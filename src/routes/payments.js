const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { calculateCycle, formatDateDisplay } = require('../utils/feeCycleCalculator');

/**
 * GET /api/payments
 * List payments with search, method filter, and pagination
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, method, studentId, page = 1, limit = 25 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let conditions = [];
    const params = [];

    // If student, restrict to own payments
    if (req.user.role === 'student') {
      if (!req.student) {
        return res.json({ success: true, data: [], pagination: { totalRecords: 0 } });
      }
      conditions.push('p.student_id = ?');
      params.push(req.student.id);
    } else if (studentId) {
      conditions.push('p.student_id = ?');
      params.push(studentId);
    }

    if (method) {
      conditions.push('p.payment_method = ?');
      params.push(method);
    }

    if (search) {
      const q = `%${search.trim()}%`;
      conditions.push('(s.name LIKE ? OR s.reg_number LIKE ? OR p.receipt_number LIKE ? OR p.transaction_id LIKE ?)');
      params.push(q, q, q, q);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await db.getOne(
      `SELECT COUNT(*) AS total
       FROM payments p
       JOIN students s ON s.id = p.student_id
       ${whereClause}`,
      params
    );
    const totalRecords = Number(countRes?.total || 0);

    const payments = await db.query(
      `SELECT 
        p.*,
        s.name AS student_name,
        s.reg_number,
        s.phone AS student_phone,
        s.email AS student_email,
        r.room_number,
        b.bed_label,
        u.name AS recorded_by_name
       FROM payments p
       JOIN students s ON s.id = p.student_id
       LEFT JOIN allocations a ON a.student_id = s.id AND a.status = 'active'
       LEFT JOIN beds b ON b.id = a.bed_id
       LEFT JOIN rooms r ON r.id = b.room_id
       LEFT JOIN users u ON u.id = p.created_by
       ${whereClause}
       ORDER BY p.payment_date DESC, p.id DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), offset]
    );

    const enhanced = payments.map(p => ({
      ...p,
      paymentDateDisplay: formatDateDisplay(p.payment_date),
      cycleStartDisplay: formatDateDisplay(p.cycle_start_date),
      cycleEndDisplay: formatDateDisplay(p.cycle_end_date)
    }));

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
    console.error('[Get Payments Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve payments.',
      error: err.message
    });
  }
});

/**
 * GET /api/payments/:id
 * Retrieve single payment with complete receipt details
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await db.getOne(
      `SELECT 
        p.*,
        s.id AS student_id,
        s.name AS student_name,
        s.reg_number,
        s.phone AS student_phone,
        s.email AS student_email,
        s.college,
        s.course,
        s.year,
        s.parent_name,
        s.parent_phone,
        r.room_number,
        f.floor_number,
        b.bed_label,
        u.name AS recorded_by_name
       FROM payments p
       JOIN students s ON s.id = p.student_id
       LEFT JOIN allocations a ON a.student_id = s.id AND a.status = 'active'
       LEFT JOIN beds b ON b.id = a.bed_id
       LEFT JOIN rooms r ON r.id = b.room_id
       LEFT JOIN floors f ON f.id = r.floor_id
       LEFT JOIN users u ON u.id = p.created_by
       WHERE p.id = ?`,
      [id]
    );

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    // Students can only view their own payment receipts
    if (req.user.role === 'student' && (!req.student || req.student.id !== payment.student_id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Determine next due date after this payment
    const student = await db.getOne('SELECT joining_date, monthly_fee FROM students WHERE id = ?', [payment.student_id]);
    const latestCycle = await db.getOne(
      'SELECT cycle_number FROM fee_cycles WHERE student_id = ? ORDER BY cycle_number DESC LIMIT 1',
      [payment.student_id]
    );

    const nextCycleObj = calculateCycle(student.joining_date, (latestCycle?.cycle_number || 1) + 1);

    const receiptData = {
      ...payment,
      paymentDateDisplay: formatDateDisplay(payment.payment_date),
      cycleStartDisplay: formatDateDisplay(payment.cycle_start_date),
      cycleEndDisplay: formatDateDisplay(payment.cycle_end_date),
      nextDueDate: nextCycleObj.dueDate,
      nextDueDateDisplay: nextCycleObj.dueDateDisplay
    };

    return res.json({
      success: true,
      data: receiptData
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve receipt.',
      error: err.message
    });
  }
});

/**
 * POST /api/payments
 * Record a payment for a student and update/create fee cycle
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      studentId,
      amount,
      paymentDate,
      cycleStartDate,
      cycleEndDate,
      paymentMethod,
      transactionId,
      notes,
      feeCycleId
    } = req.body;

    if (!studentId || !amount || !paymentDate || !cycleStartDate || !cycleEndDate || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required payment details: student, amount, date, cycle dates, and payment method.'
      });
    }

    const student = await db.getOne('SELECT * FROM students WHERE id = ?', [studentId]);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const payAmount = parseFloat(amount);
    const year = new Date().getFullYear();
    const countRow = await db.getOne('SELECT COUNT(*) AS total FROM payments');
    const seq = Number(countRow?.total || 0) + 1;
    const receiptNumber = `REC-${year}-${String(seq).padStart(4, '0')}`;

    let cycleIdToLink = feeCycleId;

    // If specific feeCycleId was provided, update it
    if (cycleIdToLink) {
      await db.query(
        `UPDATE fee_cycles 
         SET paid_amount = paid_amount + ?, status = 'paid'
         WHERE id = ?`,
        [payAmount, cycleIdToLink]
      );
    } else {
      // Find matching fee cycle by date range, or create it
      const existingCycle = await db.getOne(
        `SELECT id FROM fee_cycles 
         WHERE student_id = ? AND start_date = ? AND end_date = ?`,
        [studentId, cycleStartDate, cycleEndDate]
      );

      if (existingCycle) {
        cycleIdToLink = existingCycle.id;
        await db.query(
          `UPDATE fee_cycles 
           SET paid_amount = paid_amount + ?, status = 'paid'
           WHERE id = ?`,
          [payAmount, cycleIdToLink]
        );
      } else {
        // Create new cycle
        const lastCycle = await db.getOne(
          'SELECT cycle_number FROM fee_cycles WHERE student_id = ? ORDER BY cycle_number DESC LIMIT 1',
          [studentId]
        );
        const nextCycleNum = (lastCycle?.cycle_number || 0) + 1;

        const newCycleRes = await db.query(
          `INSERT INTO fee_cycles (student_id, cycle_number, start_date, end_date, due_date, amount, paid_amount, status, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'paid', 'Created via payment entry')`,
          [studentId, nextCycleNum, cycleStartDate, cycleEndDate, cycleEndDate, payAmount, payAmount]
        );
        cycleIdToLink = newCycleRes.insertId;
      }
    }

    // Record Payment
    const paymentRes = await db.query(
      `INSERT INTO payments (
        student_id, fee_cycle_id, receipt_number, amount, payment_date,
        cycle_start_date, cycle_end_date, payment_method, transaction_id,
        status, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PAID', ?, ?)`,
      [
        studentId,
        cycleIdToLink,
        receiptNumber,
        payAmount,
        paymentDate,
        cycleStartDate,
        cycleEndDate,
        paymentMethod,
        transactionId || null,
        notes || 'Payment recorded by admin',
        req.user.id
      ]
    );

    // Automatically ensure the NEXT upcoming cycle exists so next due date is immediately calculated!
    const cycleCount = await db.getOne(
      'SELECT COUNT(*) AS count FROM fee_cycles WHERE student_id = ?',
      [studentId]
    );
    const nextNum = Number(cycleCount?.count || 1) + 1;
    const upcomingCycle = calculateCycle(student.joining_date, nextNum);

    const existingUpcoming = await db.getOne(
      'SELECT id FROM fee_cycles WHERE student_id = ? AND cycle_number = ?',
      [studentId, nextNum]
    );

    if (!existingUpcoming) {
      await db.query(
        `INSERT INTO fee_cycles (student_id, cycle_number, start_date, end_date, due_date, amount, paid_amount, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, 0.00, 'pending', 'Upcoming cycle')`,
        [studentId, nextNum, upcomingCycle.startDate, upcomingCycle.endDate, upcomingCycle.dueDate, student.monthly_fee]
      );
    }

    // Send notification to student
    if (student.user_id) {
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type, link)
         VALUES (?, 'Payment Received', ?, 'payment', '#payments')`,
        [
          student.user_id,
          `Payment of ₹${payAmount.toLocaleString('en-IN')} for cycle ${formatDateDisplay(cycleStartDate)} to ${formatDateDisplay(cycleEndDate)} confirmed. Receipt #${receiptNumber}. Next due: ${upcomingCycle.dueDateDisplay}.`
        ]
      );
    }

    return res.status(201).json({
      success: true,
      message: `Payment of ₹${payAmount} successfully recorded! Receipt #${receiptNumber} generated.`,
      data: {
        paymentId: paymentRes.insertId,
        receiptNumber,
        nextDueDate: upcomingCycle.dueDate,
        nextDueDateDisplay: upcomingCycle.dueDateDisplay
      }
    });
  } catch (err) {
    console.error('[Record Payment Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to record payment.',
      error: err.message
    });
  }
});

module.exports = router;
