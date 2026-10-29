const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { calculateCycle, evaluateDueStatus, formatDateDisplay } = require('../utils/feeCycleCalculator');

/**
 * GET /api/fees/cycles
 * List all fee cycles with search and status filters
 */
router.get('/cycles', authenticateToken, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 25 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let conditions = [];
    const params = [];

    // If student, only their cycles
    if (req.user.role === 'student') {
      if (!req.student) {
        return res.json({ success: true, data: [], pagination: { totalRecords: 0 } });
      }
      conditions.push('fc.student_id = ?');
      params.push(req.student.id);
    }

    if (status) {
      if (status === 'paid') {
        conditions.push("fc.status = 'paid'");
      } else if (status === 'pending') {
        conditions.push("fc.status = 'pending'");
      }
    }

    if (search) {
      const q = `%${search.trim()}%`;
      conditions.push('(s.name LIKE ? OR s.reg_number LIKE ? OR r.room_number LIKE ?)');
      params.push(q, q, q);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await db.getOne(
      `SELECT COUNT(*) AS total
       FROM fee_cycles fc
       JOIN students s ON s.id = fc.student_id
       LEFT JOIN allocations a ON a.student_id = s.id AND a.status = 'active'
       LEFT JOIN beds b ON b.id = a.bed_id
       LEFT JOIN rooms r ON r.id = b.room_id
       ${whereClause}`,
      params
    );
    const totalRecords = Number(countRes?.total || 0);

    const cycles = await db.query(
      `SELECT 
        fc.*,
        s.name AS student_name,
        s.reg_number,
        s.phone AS student_phone,
        s.email AS student_email,
        s.joining_date,
        r.room_number,
        b.bed_label,
        p.receipt_number,
        p.payment_date,
        p.payment_method
       FROM fee_cycles fc
       JOIN students s ON s.id = fc.student_id
       LEFT JOIN allocations a ON a.student_id = s.id AND a.status = 'active'
       LEFT JOIN beds b ON b.id = a.bed_id
       LEFT JOIN rooms r ON r.id = b.room_id
       LEFT JOIN payments p ON p.fee_cycle_id = fc.id
       ${whereClause}
       ORDER BY fc.start_date DESC, fc.id DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), offset]
    );

    const enhanced = cycles.map(c => {
      const isPaid = c.status === 'paid';
      const reminder = evaluateDueStatus(c.due_date, isPaid);
      return {
        ...c,
        startDateDisplay: formatDateDisplay(c.start_date),
        endDateDisplay: formatDateDisplay(c.end_date),
        dueDateDisplay: formatDateDisplay(c.due_date),
        paymentDateDisplay: formatDateDisplay(c.payment_date),
        reminder
      };
    });

    return res.json({
      success: true,
      data: enhanced,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalRecords,
        totalPages: Math.ceil(totalRecords / parseInt(limit, 10))
      }
    });
  } catch (err) {
    console.error('[Fee Cycles Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve fee cycles.',
      error: err.message
    });
  }
});

/**
 * GET /api/fees/student/:studentId
 * Get complete fee history for a student with joining-date cycles and next due date
 */
router.get('/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Students can only view their own
    if (req.user.role === 'student' && (!req.student || req.student.id !== Number(studentId))) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const student = await db.getOne('SELECT * FROM students WHERE id = ?', [studentId]);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const cycles = await db.query(
      `SELECT fc.*, p.receipt_number, p.payment_date, p.payment_method, p.transaction_id, p.id AS payment_id
       FROM fee_cycles fc
       LEFT JOIN payments p ON p.fee_cycle_id = fc.id
       WHERE fc.student_id = ?
       ORDER BY fc.cycle_number ASC`,
      [studentId]
    );

    // Format and calculate statuses
    const enhancedCycles = cycles.map(c => {
      const isPaid = c.status === 'paid';
      const reminder = evaluateDueStatus(c.due_date, isPaid);
      return {
        ...c,
        startDateDisplay: formatDateDisplay(c.start_date),
        endDateDisplay: formatDateDisplay(c.end_date),
        dueDateDisplay: formatDateDisplay(c.due_date),
        paymentDateDisplay: formatDateDisplay(c.payment_date),
        reminder
      };
    });

    // Find the latest pending cycle or determine next due
    const pendingCycle = enhancedCycles.find(c => c.status !== 'paid');
    let nextDueInfo = null;

    if (pendingCycle) {
      nextDueInfo = {
        cycleNumber: pendingCycle.cycle_number,
        cycleStartDate: pendingCycle.start_date,
        cycleEndDate: pendingCycle.end_date,
        dueDate: pendingCycle.due_date,
        dueDateDisplay: pendingCycle.dueDateDisplay,
        amount: pendingCycle.amount,
        status: pendingCycle.status,
        reminder: pendingCycle.reminder
      };
    } else if (enhancedCycles.length > 0) {
      // All previous cycles are paid; next cycle due is next month!
      const last = enhancedCycles[enhancedCycles.length - 1];
      const nextCycleObj = calculateCycle(student.joining_date, last.cycle_number + 1);
      nextDueInfo = {
        cycleNumber: nextCycleObj.cycleNumber,
        cycleStartDate: nextCycleObj.startDate,
        cycleEndDate: nextCycleObj.endDate,
        dueDate: nextCycleObj.dueDate,
        dueDateDisplay: nextCycleObj.dueDateDisplay,
        amount: student.monthly_fee,
        status: 'upcoming',
        reminder: evaluateDueStatus(nextCycleObj.dueDate, false)
      };
    }

    return res.json({
      success: true,
      data: {
        student: {
          id: student.id,
          name: student.name,
          regNumber: student.reg_number,
          joiningDate: student.joining_date,
          joiningDateDisplay: formatDateDisplay(student.joining_date),
          monthlyFee: student.monthly_fee
        },
        cycles: enhancedCycles,
        nextDueInfo
      }
    });
  } catch (err) {
    console.error('[Student Fees Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve student fees history.',
      error: err.message
    });
  }
});

/**
 * GET /api/fees/reminders
 * Returns students with fees overdue, due today, due soon (within 7 days), or upcoming
 * Supports both admin (all resident students) and student (personal dues)
 */
router.get('/reminders', authenticateToken, async (req, res) => {
  try {
    const isStudent = req.user && req.user.role === 'student';
    let querySql = `
      SELECT 
        fc.*,
        s.id AS student_id,
        s.name AS student_name,
        s.reg_number,
        s.phone AS student_phone,
        s.email AS student_email,
        r.room_number,
        b.bed_label
      FROM fee_cycles fc
      JOIN students s ON s.id = fc.student_id AND s.status = 'active'
      LEFT JOIN allocations a ON a.student_id = s.id AND a.status = 'active'
      LEFT JOIN beds b ON b.id = a.bed_id
      LEFT JOIN rooms r ON r.id = b.room_id
      WHERE fc.status != 'paid'
    `;
    const queryParams = [];

    if (isStudent) {
      if (!req.student) {
        return res.json({
          success: true,
          data: {
            summary: { paidCount: 0, pendingTotal: 0, overdueCount: 0, dueTodayCount: 0, dueSoonCount: 0, upcomingCount: 0, totalActionRequired: 0, totalPendingCount: 0 },
            overdue: [],
            dueToday: [],
            dueSoon: [],
            upcoming: []
          }
        });
      }
      querySql += ` AND fc.student_id = ? `;
      queryParams.push(req.student.id);
    }

    querySql += ` ORDER BY fc.due_date ASC `;

    const rawPendingCycles = await db.query(querySql, queryParams);
    const pendingCycles = Array.isArray(rawPendingCycles) ? rawPendingCycles : [];

    const overdueList = [];
    const dueTodayList = [];
    const dueSoonList = [];
    const upcomingList = [];
    let pendingTotal = 0;

    for (const c of pendingCycles) {
      pendingTotal += Math.max(0, Number(c.amount || 0) - Number(c.paid_amount || 0));
      const reminder = evaluateDueStatus(c.due_date, false);
      const item = {
        ...c,
        amount: Number(c.amount || 7000),
        paid_amount: Number(c.paid_amount || 0),
        startDateDisplay: formatDateDisplay(c.start_date),
        endDateDisplay: formatDateDisplay(c.end_date),
        dueDateDisplay: formatDateDisplay(c.due_date),
        reminder
      };

      if (reminder.status === 'overdue') {
        overdueList.push(item);
      } else if (reminder.status === 'due_today') {
        dueTodayList.push(item);
      } else if (reminder.status === 'due_soon') {
        dueSoonList.push(item);
      } else {
        upcomingList.push(item);
      }
    }

    // Get paid cycles count
    const paidSql = isStudent && req.student
      ? "SELECT COUNT(*) as count FROM fee_cycles WHERE status = 'paid' AND student_id = ?"
      : "SELECT COUNT(*) as count FROM fee_cycles WHERE status = 'paid'";
    const paidParams = isStudent && req.student ? [req.student.id] : [];
    const paidRes = await db.getOne(paidSql, paidParams);
    const paidCount = Number(paidRes?.count || 0);

    return res.json({
      success: true,
      data: {
        summary: {
          paidCount,
          pendingTotal,
          overdueCount: overdueList.length,
          dueTodayCount: dueTodayList.length,
          dueSoonCount: dueSoonList.length,
          upcomingCount: upcomingList.length,
          totalActionRequired: overdueList.length + dueTodayList.length + dueSoonList.length,
          totalPendingCount: pendingCycles.length
        },
        overdue: overdueList,
        dueToday: dueTodayList,
        dueSoon: dueSoonList,
        upcoming: upcomingList
      }
    });
  } catch (err) {
    console.error('[Fee Reminders API Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve fee reminders: ' + (err.message || 'Server error'),
      error: err.message
    });
  }
});

/**
 * POST /api/fees/generate-next/:studentId
 * Generate next cycle for a student
 */
router.post('/generate-next/:studentId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await db.getOne('SELECT * FROM students WHERE id = ?', [studentId]);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // Get latest cycle number
    const lastCycle = await db.getOne(
      'SELECT cycle_number FROM fee_cycles WHERE student_id = ? ORDER BY cycle_number DESC LIMIT 1',
      [studentId]
    );

    const nextCycleNum = (lastCycle?.cycle_number || 0) + 1;
    const nextCycle = calculateCycle(student.joining_date, nextCycleNum);

    const insertRes = await db.query(
      `INSERT INTO fee_cycles (student_id, cycle_number, start_date, end_date, due_date, amount, paid_amount, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, 0.00, 'pending', 'Manually generated cycle')`,
      [studentId, nextCycleNum, nextCycle.startDate, nextCycle.endDate, nextCycle.dueDate, student.monthly_fee]
    );

    return res.json({
      success: true,
      message: `Cycle ${nextCycleNum} generated successfully (${nextCycle.startDateDisplay} to ${nextCycle.endDateDisplay}).`,
      data: {
        cycleId: insertRes.insertId,
        cycle: nextCycle
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to generate next fee cycle.',
      error: err.message
    });
  }
});

module.exports = router;
