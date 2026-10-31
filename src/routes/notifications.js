const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { formatDateDisplay } = require('../utils/feeCycleCalculator');

/**
 * GET /api/notifications
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const isWarden = req.user.role === 'admin';
    const studentId = req.student ? req.student.id : null;
    let querySql = '';
    let countSql = '';
    let params = [];

    if (isWarden) {
      querySql = `SELECT * FROM notifications 
                  WHERE recipient_role = 'admin' OR user_id = ? OR user_id IS NULL 
                  ORDER BY created_at DESC 
                  LIMIT 50`;
      countSql = `SELECT COUNT(*) AS total FROM notifications 
                  WHERE (recipient_role = 'admin' OR user_id = ? OR user_id IS NULL) AND is_read = 0`;
      params = [req.user.id];
    } else {
      querySql = `SELECT * FROM notifications 
                  WHERE (user_id = ? OR (recipient_role = 'student' AND (recipient_id = ? OR user_id = ?)))
                  ORDER BY created_at DESC 
                  LIMIT 50`;
      countSql = `SELECT COUNT(*) AS total FROM notifications 
                  WHERE (user_id = ? OR (recipient_role = 'student' AND (recipient_id = ? OR user_id = ?))) AND is_read = 0`;
      params = [req.user.id, studentId || 0, req.user.id];
    }

    const notifications = await db.query(querySql, params);
    const unreadCountRow = await db.getOne(countSql, params);

    // Unread leave requests specific count for admin
    let leaveUnreadCount = 0;
    if (isWarden) {
      const lrCountRow = await db.getOne(
        `SELECT COUNT(*) AS total FROM notifications 
         WHERE (recipient_role = 'admin' OR user_id = ? OR user_id IS NULL) AND type = 'leave' AND is_read = 0`,
        [req.user.id]
      );
      leaveUnreadCount = Number(lrCountRow?.total || 0);
    } else {
      const lrCountRow = await db.getOne(
        `SELECT COUNT(*) AS total FROM notifications 
         WHERE (user_id = ? OR (recipient_role = 'student' AND (recipient_id = ? OR user_id = ?))) AND type = 'leave' AND is_read = 0`,
        params
      );
      leaveUnreadCount = Number(lrCountRow?.total || 0);
    }

    const enhanced = notifications.map(n => ({
      ...n,
      createdAtDisplay: formatDateDisplay(n.created_at) + ' ' + (n.created_at && String(n.created_at).includes('T') ? String(n.created_at).split('T')[1]?.substring(0, 5) : '')
    }));

    return res.json({
      success: true,
      data: enhanced,
      unreadCount: Number(unreadCountRow?.total || 0),
      leaveUnreadCount
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications.',
      error: err.message
    });
  }
});

/**
 * PUT /api/notifications/:id/read
 */
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const nowISO = new Date().toISOString();
    await db.query('UPDATE notifications SET is_read = 1, read_at = ? WHERE id = ?', [nowISO, id]);
    return res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed.', error: err.message });
  }
});

/**
 * PUT /api/notifications/read-all
 */
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const isWarden = req.user.role === 'admin';
    const nowISO = new Date().toISOString();
    if (isWarden) {
      await db.query(
        "UPDATE notifications SET is_read = 1, read_at = ? WHERE recipient_role = 'admin' OR user_id = ? OR user_id IS NULL",
        [nowISO, req.user.id]
      );
    } else {
      const studentId = req.student ? req.student.id : 0;
      await db.query(
        "UPDATE notifications SET is_read = 1, read_at = ? WHERE user_id = ? OR recipient_id = ?",
        [nowISO, req.user.id, studentId]
      );
    }
    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed.', error: err.message });
  }
});

module.exports = router;
