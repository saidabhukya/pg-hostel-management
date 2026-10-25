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
    const notifications = await db.query(
      `SELECT * FROM notifications 
       WHERE user_id = ? OR user_id IS NULL 
       ORDER BY created_at DESC 
       LIMIT 30`,
      [req.user.id]
    );

    const unreadCountRow = await db.getOne(
      `SELECT COUNT(*) AS total FROM notifications 
       WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0`,
      [req.user.id]
    );

    const enhanced = notifications.map(n => ({
      ...n,
      createdAtDisplay: formatDateDisplay(n.created_at) + ' ' + (n.created_at ? n.created_at.split('T')[1]?.substring(0, 5) || '' : '')
    }));

    return res.json({
      success: true,
      data: enhanced,
      unreadCount: Number(unreadCountRow?.total || 0)
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
    await db.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
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
    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? OR user_id IS NULL',
      [req.user.id]
    );
    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed.', error: err.message });
  }
});

module.exports = router;
