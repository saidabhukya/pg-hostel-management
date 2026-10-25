const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { formatDateDisplay } = require('../utils/feeCycleCalculator');

/**
 * GET /api/complaints
 * List complaints (Admin sees all, Student sees own)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 25 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let conditions = [];
    const params = [];

    if (req.user.role === 'student') {
      if (!req.student) {
        return res.json({ success: true, data: [], pagination: { totalRecords: 0 } });
      }
      conditions.push('c.student_id = ?');
      params.push(req.student.id);
    }

    if (status) {
      conditions.push('c.status = ?');
      params.push(status);
    }

    if (category) {
      conditions.push('c.category = ?');
      params.push(category);
    }

    if (search) {
      const q = `%${search.trim()}%`;
      conditions.push('(c.title LIKE ? OR c.description LIKE ? OR s.name LIKE ? OR s.reg_number LIKE ?)');
      params.push(q, q, q, q);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await db.getOne(
      `SELECT COUNT(*) AS total
       FROM complaints c
       JOIN students s ON s.id = c.student_id
       ${whereClause}`,
      params
    );
    const totalRecords = Number(countRes?.total || 0);

    const complaints = await db.query(
      `SELECT 
        c.*,
        s.name AS student_name,
        s.reg_number,
        s.phone AS student_phone,
        r.room_number,
        b.bed_label
       FROM complaints c
       JOIN students s ON s.id = c.student_id
       LEFT JOIN allocations a ON a.student_id = s.id AND a.status = 'active'
       LEFT JOIN beds b ON b.id = a.bed_id
       LEFT JOIN rooms r ON r.id = b.room_id
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), offset]
    );

    const enhanced = complaints.map(c => ({
      ...c,
      createdAtDisplay: formatDateDisplay(c.created_at)
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
    console.error('[Complaints Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve complaints.',
      error: err.message
    });
  }
});

/**
 * POST /api/complaints
 * Submit complaint (student or admin on behalf of student)
 */
router.post('/', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    const { category, title, description, studentId } = req.body;

    if (!category || !title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Category, Title, and Description for the complaint.'
      });
    }

    let targetStudentId = null;
    if (req.user.role === 'student') {
      if (!req.student) {
        return res.status(403).json({ success: false, message: 'Student profile not found.' });
      }
      targetStudentId = req.student.id;
    } else {
      targetStudentId = studentId;
      if (!targetStudentId) {
        return res.status(400).json({ success: false, message: 'Student ID required.' });
      }
    }

    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const insertRes = await db.query(
      `INSERT INTO complaints (student_id, category, title, description, photo_url, status)
       VALUES (?, ?, ?, ?, ?, 'Pending')`,
      [targetStudentId, category, title.trim(), description.trim(), photoUrl]
    );

    // Notify Admin
    const student = await db.getOne('SELECT name, reg_number FROM students WHERE id = ?', [targetStudentId]);
    const adminUser = await db.getOne("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (adminUser) {
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type, link)
         VALUES (?, 'New Student Complaint', ?, 'complaint', '#complaints')`,
        [
          adminUser.id,
          `New ${category} complaint submitted by ${student?.name || 'Student'} (${student?.reg_number || ''}): "${title}".`
        ]
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully! Warden will review it shortly.',
      complaintId: insertRes.insertId
    });
  } catch (err) {
    console.error('[Submit Complaint Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit complaint.',
      error: err.message
    });
  }
});

/**
 * PUT /api/complaints/:id/status
 * Admin updates complaint status & notes
 */
router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!['Pending', 'In Progress', 'Resolved'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be Pending, In Progress, or Resolved.'
      });
    }

    const complaint = await db.getOne('SELECT * FROM complaints WHERE id = ?', [id]);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const resolvedAt = status === 'Resolved' ? new Date().toISOString() : null;

    await db.query(
      `UPDATE complaints 
       SET status = ?, admin_notes = ?, resolved_at = ?
       WHERE id = ?`,
      [status, adminNotes || complaint.admin_notes, resolvedAt, id]
    );

    // Notify student
    const student = await db.getOne('SELECT user_id, name FROM students WHERE id = ?', [complaint.student_id]);
    if (student && student.user_id) {
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type, link)
         VALUES (?, 'Complaint Status Updated', ?, 'complaint', '#complaints')`,
        [
          student.user_id,
          `Your complaint "${complaint.title}" is now marked as ${status}.${adminNotes ? ' Note: ' + adminNotes : ''}`
        ]
      );
    }

    return res.json({
      success: true,
      message: `Complaint status updated to ${status}.`
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update complaint status.',
      error: err.message
    });
  }
});

module.exports = router;
