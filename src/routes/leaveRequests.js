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
        COALESCE(l.student_name, s.name) AS student_name,
        COALESCE(l.room_number, r.room_number) AS room_number,
        COALESCE(l.leave_reason, l.reason) AS leave_reason,
        COALESCE(l.return_date, l.end_date) AS return_date,
        COALESCE(l.admin_response, l.admin_remarks) AS admin_response,
        s.reg_number,
        s.phone AS student_phone,
        s.photo_url AS student_photo,
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
      endDateDisplay: formatDateDisplay(r.return_date || r.end_date),
      createdAtDisplay: formatDateDisplay(r.created_at) + ' ' + (r.created_at && String(r.created_at).includes('T') ? String(r.created_at).split('T')[1]?.substring(0, 5) : '')
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
 * Student applies for leave with all required fields
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      reason, 
      leave_reason,
      startDate, 
      start_date, 
      endDate, 
      return_date, 
      end_date,
      leavingTime,
      leaving_time,
      arrivalTime,
      arrival_time,
      additionalMessage,
      additional_message,
      emergencyContact,
      emergency_contact
    } = req.body;

    const actualReason = (leave_reason || reason || '').trim();
    const actualStartDate = (start_date || startDate || '').trim();
    const actualReturnDate = (return_date || end_date || endDate || '').trim();
    const actualLeavingTime = (leaving_time || leavingTime || '05:00 PM').trim();
    const actualArrivalTime = (arrival_time || arrivalTime || '08:00 PM').trim();
    const actualMessage = (additional_message || additionalMessage || '').trim();
    const actualContact = (emergency_contact || emergencyContact || req.student?.parent_phone || '').trim();

    if (!actualReason || !actualStartDate || !actualReturnDate) {
      return res.status(400).json({
        success: false,
        message: 'Leave reason, start date, and return date are required.'
      });
    }

    let student = req.student;
    if (!student && req.user.role === 'student') {
      student = await db.getOne('SELECT * FROM students WHERE user_id = ?', [req.user.id]);
    }
    const studentId = student ? student.id : req.body.studentId;
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID not resolved.' });
    }

    const studentInfo = await db.getOne(
      `SELECT s.name, s.reg_number, r.room_number 
       FROM students s 
       LEFT JOIN allocations a ON a.student_id = s.id AND a.status = 'active'
       LEFT JOIN beds b ON b.id = a.bed_id
       LEFT JOIN rooms r ON r.id = b.room_id
       WHERE s.id = ?`,
      [studentId]
    );

    const studentName = studentInfo?.name || student?.name || 'Resident Student';
    const roomNumber = studentInfo?.room_number || student?.room_number || 'Room';
    const nowISO = new Date().toISOString();

    const insertRes = await db.query(
      `INSERT INTO leave_requests (
        student_id, student_name, room_number, leave_reason, reason, 
        start_date, return_date, end_date, leaving_time, arrival_time, 
        additional_message, emergency_contact, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?)`,
      [
        studentId, studentName, roomNumber, actualReason, actualReason,
        actualStartDate, actualReturnDate, actualReturnDate, actualLeavingTime, actualArrivalTime,
        actualMessage, actualContact, nowISO, nowISO
      ]
    );

    const newRequestId = insertRes.insertId || insertRes.lastID;

    // Immediately send notification to Admin / Warden Portal
    const adminUser = await db.getOne("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    await db.query(
      `INSERT INTO notifications (user_id, recipient_role, title, message, type, related_request_id, is_read, link, created_at)
       VALUES (?, 'admin', ?, ?, 'leave', ?, 0, '#leave-requests', ?)`,
      [
        adminUser?.id || null,
        `New Leave Request: ${studentName}`,
        `${studentName} (Room ${roomNumber}) requested leave for "${actualReason}" from ${formatDateDisplay(actualStartDate)} to ${formatDateDisplay(actualReturnDate)}.`,
        newRequestId,
        nowISO
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully. Request status is Pending.',
      requestId: newRequestId,
      data: {
        id: newRequestId,
        student_id: studentId,
        student_name: studentName,
        room_number: roomNumber,
        leave_reason: actualReason,
        start_date: actualStartDate,
        return_date: actualReturnDate,
        leaving_time: actualLeavingTime,
        arrival_time: actualArrivalTime,
        additional_message: actualMessage,
        status: 'Pending',
        created_at: nowISO
      }
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
 * Admin / Warden approves or rejects leave request
 */
router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks, admin_response, rejection_reason } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be Approved or Rejected.' });
    }

    const leave = await db.getOne('SELECT * FROM leave_requests WHERE id = ?', [id]);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }

    const responseMsg = (rejection_reason || admin_response || remarks || '').trim();
    const nowISO = new Date().toISOString();

    await db.query(
      `UPDATE leave_requests 
       SET status = ?, admin_response = ?, admin_remarks = ?, updated_at = ? 
       WHERE id = ?`,
      [status, responseMsg || null, responseMsg || null, nowISO, id]
    );

    // Notify the respective student
    const student = await db.getOne('SELECT user_id, name FROM students WHERE id = ?', [leave.student_id]);
    if (student) {
      const notifTitle = status === 'Approved' 
        ? 'Your leave request has been APPROVED by the Warden.' 
        : 'Your leave request has been REJECTED by the Warden.';
      
      const notifBody = status === 'Approved'
        ? `Your leave request for ${formatDateDisplay(leave.start_date)} to ${formatDateDisplay(leave.return_date || leave.end_date)} has been APPROVED.${responseMsg ? ' Warden note: ' + responseMsg : ''}`
        : `Your leave request for ${formatDateDisplay(leave.start_date)} to ${formatDateDisplay(leave.return_date || leave.end_date)} has been REJECTED.${responseMsg ? ' Reason: ' + responseMsg : ''}`;

      await db.query(
        `INSERT INTO notifications (user_id, recipient_id, recipient_role, title, message, type, related_request_id, is_read, link, created_at)
         VALUES (?, ?, 'student', ?, ?, 'leave', ?, 0, '#leave-requests', ?)`,
        [student.user_id, leave.student_id, notifTitle, notifBody, leave.id, nowISO]
      );
    }

    // Mark the corresponding admin leave notification as read
    await db.query(
      `UPDATE notifications SET is_read = 1, read_at = ? WHERE related_request_id = ? AND recipient_role = 'admin'`,
      [nowISO, id]
    );

    return res.json({
      success: true,
      message: `Leave request has been ${status}. Respective student notified.`,
      status,
      updated_at: nowISO
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update leave request.',
      error: err.message
    });
  }
});
});

module.exports = router;
