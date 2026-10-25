const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { formatDateDisplay } = require('../utils/feeCycleCalculator');

/**
 * GET /api/visitors
 * List visitors with search, status filter, and pagination
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 25 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let conditions = [];
    const params = [];

    if (req.user.role === 'student') {
      if (!req.student) {
        return res.json({ success: true, data: [], pagination: { totalRecords: 0 } });
      }
      conditions.push('v.student_id = ?');
      params.push(req.student.id);
    }

    if (status) {
      conditions.push('v.status = ?');
      params.push(status);
    }

    if (search) {
      const q = `%${search.trim()}%`;
      conditions.push('(v.visitor_name LIKE ? OR v.phone LIKE ? OR s.name LIKE ? OR s.reg_number LIKE ?)');
      params.push(q, q, q, q);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await db.getOne(
      `SELECT COUNT(*) AS total FROM visitors v JOIN students s ON s.id = v.student_id ${whereClause}`,
      params
    );
    const totalRecords = Number(countRes?.total || 0);

    const visitors = await db.query(
      `SELECT 
        v.*,
        s.name AS student_name,
        s.reg_number,
        s.phone AS student_phone,
        r.room_number,
        b.bed_label
       FROM visitors v
       JOIN students s ON s.id = v.student_id
       LEFT JOIN allocations a ON a.student_id = s.id AND a.status = 'active'
       LEFT JOIN beds b ON b.id = a.bed_id
       LEFT JOIN rooms r ON r.id = b.room_id
       ${whereClause}
       ORDER BY v.entry_time DESC, v.id DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), offset]
    );

    const enhanced = visitors.map(v => ({
      ...v,
      entryTimeDisplay: formatDateDisplay(v.entry_time) + ' ' + (v.entry_time ? v.entry_time.split('T')[1]?.substring(0, 5) || '' : ''),
      exitTimeDisplay: v.exit_time ? formatDateDisplay(v.exit_time) + ' ' + (v.exit_time.split('T')[1]?.substring(0, 5) || '') : 'Currently In Hostel'
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
    console.error('[Visitors Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve visitors list.',
      error: err.message
    });
  }
});

/**
 * POST /api/visitors
 * Admin records visitor entry
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { visitorName, phone, studentId, purpose, relation } = req.body;

    if (!visitorName || !phone || !studentId || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Visitor Name, Phone, Student Visited, and Purpose.'
      });
    }

    const student = await db.getOne('SELECT name, user_id FROM students WHERE id = ?', [studentId]);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const entryTime = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const insertRes = await db.query(
      `INSERT INTO visitors (student_id, visitor_name, phone, relation, purpose, entry_time, status)
       VALUES (?, ?, ?, ?, ?, ?, 'in_hostel')`,
      [studentId, visitorName.trim(), phone.trim(), relation || 'Relative', purpose.trim(), entryTime]
    );

    // Notify student
    if (student.user_id) {
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type, link)
         VALUES (?, 'Visitor Arrival Notification', ?, 'system', '#visitors')`,
        [
          student.user_id,
          `${visitorName} (${relation || 'Guest'}) has arrived at the hostel reception to visit you.`
        ]
      );
    }

    return res.status(201).json({
      success: true,
      message: `Visitor entry recorded for ${visitorName}.`,
      visitorId: insertRes.insertId
    });
  } catch (err) {
    console.error('[Record Visitor Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to record visitor.',
      error: err.message
    });
  }
});

/**
 * PUT /api/visitors/:id/checkout
 * Mark visitor exit
 */
router.put('/:id/checkout', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const exitTime = new Date().toISOString().replace('T', ' ').substring(0, 19);

    await db.query(
      `UPDATE visitors SET exit_time = ?, status = 'checked_out' WHERE id = ?`,
      [exitTime, id]
    );

    return res.json({
      success: true,
      message: 'Visitor checkout recorded.'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to checkout visitor.',
      error: err.message
    });
  }
});

module.exports = router;
