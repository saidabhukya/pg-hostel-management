const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

/**
 * GET /api/attendance
 * List attendance records (Admin views all for a date, Student views own history)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { date = today, month, studentId } = req.query;

    if (req.user.role === 'student') {
      if (!req.student) {
        return res.json({ success: true, data: [], summary: { present: 0, absent: 0, total: 0 } });
      }

      // Student gets own attendance history
      const history = await db.query(
        `SELECT a.*, u.name as marked_by_name
         FROM attendance a
         LEFT JOIN users u ON u.id = a.marked_by
         WHERE a.student_id = ?
         ORDER BY a.date DESC
         LIMIT 60`,
        [req.student.id]
      );

      const total = history.length;
      const present = history.filter(h => h.status === 'present').length;
      const absent = history.filter(h => h.status === 'absent').length;
      const onLeave = history.filter(h => h.status === 'on_leave').length;

      return res.json({
        success: true,
        data: history,
        summary: {
          total,
          present,
          absent,
          onLeave,
          percentage: total > 0 ? Math.round((present / total) * 100) : 100
        }
      });
    }

    // Admin query
    let conditions = [];
    const params = [];

    if (date) {
      conditions.push('a.date = ?');
      params.push(date);
    }

    if (studentId) {
      conditions.push('a.student_id = ?');
      params.push(studentId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const records = await db.query(
      `SELECT 
        s.id as student_id,
        s.name as student_name,
        s.reg_number,
        s.phone as student_phone,
        r.room_number,
        b.bed_label,
        f.floor_number,
        COALESCE(a.status, 'unmarked') as attendance_status,
        a.remarks,
        a.date,
        a.id as attendance_id
       FROM students s
       LEFT JOIN allocations al ON al.student_id = s.id AND al.status = 'active'
       LEFT JOIN beds b ON b.id = al.bed_id
       LEFT JOIN rooms r ON r.id = b.room_id
       LEFT JOIN floors f ON f.id = r.floor_id
       LEFT JOIN attendance a ON a.student_id = s.id AND a.date = ?
       WHERE s.status = 'active'
       ORDER BY r.room_number ASC, b.bed_number ASC`,
      [date]
    );

    return res.json({
      success: true,
      date,
      data: records
    });
  } catch (err) {
    console.error('[Attendance Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve attendance.',
      error: err.message
    });
  }
});

/**
 * POST /api/attendance
 * Admin marks attendance for a student (or batch)
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { studentId, date = today, status = 'present', remarks = '', batch } = req.body;

    if (Array.isArray(batch) && batch.length > 0) {
      for (const item of batch) {
        const itemDate = item.date || date;
        const existing = await db.getOne(
          'SELECT id FROM attendance WHERE student_id = ? AND date = ?',
          [item.studentId, itemDate]
        );

        if (existing) {
          await db.query(
            'UPDATE attendance SET status = ?, remarks = ?, marked_by = ? WHERE id = ?',
            [item.status, item.remarks || '', req.user.id, existing.id]
          );
        } else {
          await db.query(
            'INSERT INTO attendance (student_id, date, status, remarks, marked_by) VALUES (?, ?, ?, ?, ?)',
            [item.studentId, itemDate, item.status, item.remarks || '', req.user.id]
          );
        }
      }

      return res.json({
        success: true,
        message: `Attendance marked successfully for ${batch.length} students.`
      });
    }

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID is required.' });
    }

    const existing = await db.getOne(
      'SELECT id FROM attendance WHERE student_id = ? AND date = ?',
      [studentId, date]
    );

    if (existing) {
      await db.query(
        'UPDATE attendance SET status = ?, remarks = ?, marked_by = ? WHERE id = ?',
        [status, remarks, req.user.id, existing.id]
      );
    } else {
      await db.query(
        'INSERT INTO attendance (student_id, date, status, remarks, marked_by) VALUES (?, ?, ?, ?, ?)',
        [studentId, date, status, remarks, req.user.id]
      );
    }

    return res.json({
      success: true,
      message: 'Attendance record saved successfully.'
    });
  } catch (err) {
    console.error('[Mark Attendance Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to record attendance.',
      error: err.message
    });
  }
});

/**
 * GET /api/attendance/summary
 */
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const totalStudentsRow = await db.getOne("SELECT COUNT(*) as total FROM students WHERE status = 'active'");
    const total = Number(totalStudentsRow?.total || 0);

    const counts = await db.query(
      `SELECT status, COUNT(*) as count FROM attendance WHERE date = ? GROUP BY status`,
      [today]
    );

    let present = 0;
    let absent = 0;
    let onLeave = 0;

    for (const c of counts) {
      if (c.status === 'present') present = Number(c.count);
      else if (c.status === 'absent') absent = Number(c.count);
      else if (c.status === 'on_leave') onLeave = Number(c.count);
    }

    return res.json({
      success: true,
      date: today,
      data: {
        total,
        present,
        absent,
        onLeave,
        unmarked: Math.max(0, total - (present + absent + onLeave))
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to get attendance summary.', error: err.message });
  }
});

module.exports = router;
