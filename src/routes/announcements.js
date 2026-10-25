const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { formatDateDisplay } = require('../utils/feeCycleCalculator');

/**
 * GET /api/announcements
 * View active announcements
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const announcements = await db.query(
      `SELECT a.*, u.name AS author_name
       FROM announcements a
       LEFT JOIN users u ON u.id = a.created_by
       ORDER BY a.published_date DESC, a.id DESC`
    );

    const enhanced = announcements.map(a => ({
      ...a,
      publishedDateDisplay: formatDateDisplay(a.published_date)
    }));

    return res.json({
      success: true,
      data: enhanced
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve announcements.',
      error: err.message
    });
  }
});

/**
 * POST /api/announcements
 * Admin posts announcement
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, content, priority, audience, publishedDate, expiresAt } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required.'
      });
    }

    const pubDate = publishedDate || new Date().toISOString().split('T')[0];

    const insertRes = await db.query(
      `INSERT INTO announcements (title, content, priority, audience, published_date, expires_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title.trim(), content.trim(), priority || 'Medium', audience || 'all', pubDate, expiresAt || null, req.user.id]
    );

    // Broadcast system notification to all students
    const studentUsers = await db.query("SELECT id FROM users WHERE role = 'student'");
    for (const u of studentUsers) {
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type, link)
         VALUES (?, 'New Hostel Announcement', ?, 'announcement', '#announcements')`,
        [u.id, title]
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Announcement published successfully!',
      announcementId: insertRes.insertId
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to publish announcement.',
      error: err.message
    });
  }
});

/**
 * DELETE /api/announcements/:id
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM announcements WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Announcement deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete.', error: err.message });
  }
});

module.exports = router;
