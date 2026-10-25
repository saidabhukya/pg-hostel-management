const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { formatDateDisplay } = require('../utils/feeCycleCalculator');

/**
 * GET /api/leave-requests
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    let conditions = [];
    const params = [];

    if (req.user.role === 'student') {
      if (!req.student) {
        return res.json({ success: true, data: [] });
      }
      conditions.push('l.student_id = ?');
      params.push(req.student.id);
    }

    if (status) {
      conditions.push('l.status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const requests = await db.query(
      `SELECT 
        l.*,
        s.name AS student_name,
        s.reg_number,
        s.phone AS student_phone,
        r.room_number,
        b.bed_label
       FROM leave_requests l
       JOIN students s ON s.id = l.student_id
       LEFT JOIN allocations a ON a.student_id = s.id AND a.status = 'active'
       LEFT JOIN beds b ON b.id = a.bed_id
       LEFT JOIN rooms r ON r.id = b.room_id
       ${whereClause}
       ORDER BY l.created_at DESC`,
      params
    );

    const enhanced = requests.map(r => ({
      ...r,
      startDateDisplay: formatDateDisplay(r.start_date),
      endDateDisplay: formatDateDisplay(r.end_date),
      createdAtDisplay: formatDateDisplay(r.created_at)
    }));

    return res.json({
      success: true,
      data: enhanced
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve leave requests.',
      error: err.message
    });
  }
});

/**
 * POST /api/leave-requests
 * Student applies for leave
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { reason, startDate, endDate, emergencyContact } = req.body;

    if (!reason || !startDate || !endDate || !emergencyContact) {
      return res.status(400).json({
        success: false,
        message: 'Reason, Start Date, End Date, and Emergency Contact are required.'
      });
    }

    const studentId = req.student ? req.student.id : req.body.studentId;
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID not resolved.' });
    }

    const insertRes = await db.query(
      `INSERT INTO leave_requests (student_id, reason, start_date, end_date, emergency_contact, status)
       VALUES (?, ?, ?, ?, ?, 'Pending')`,
      [studentId, reason.trim(), startDate, endDate, emergencyContact.trim()]
    );

    // Notify Warden
    const adminUser = await db.getOne("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (adminUser) {
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type, link)
         VALUES (?, 'New Leave Request Submitted', 'A student has submitted a new hostel leave application.', 'leave', '#leave-requests')`,
        [adminUser.id]
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully. Warden approval pending.',
      requestId: insertRes.insertId
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to submit leave request.',
      error: err.message
    });
  }
});

/**
 * PUT /api/leave-requests/:id/status
 * Admin approves or rejects leave request
 */
router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be Approved or Rejected.' });
    }

    const leave = await db.getOne('SELECT * FROM leave_requests WHERE id = ?', [id]);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }

    await db.query(
      `UPDATE leave_requests SET status = ?, admin_remarks = ? WHERE id = ?`,
      [status, remarks || null, id]
    );

    // Notify student
    const student = await db.getOne('SELECT user_id FROM students WHERE id = ?', [leave.student_id]);
    if (student && student.user_id) {
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type, link)
         VALUES (?, 'Leave Request Decision', ?, 'leave', '#leave-requests')`,
        [
          student.user_id,
          `Your leave application for ${formatDateDisplay(leave.start_date)} to ${formatDateDisplay(leave.end_date)} was ${status}.${remarks ? ' Remarks: ' + remarks : ''}`
        ]
      );
    }

    return res.json({
      success: true,
      message: `Leave request has been ${status}.`
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update leave request.',
      error: err.message
    });
  }
});

module.exports = router;
