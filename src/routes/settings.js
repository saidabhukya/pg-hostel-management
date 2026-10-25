const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

/**
 * GET /api/settings
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const settings = await db.query('SELECT * FROM settings');
    const settingsMap = {};
    for (const s of settings) {
      settingsMap[s.key_name] = s.value;
    }
    return res.json({
      success: true,
      data: settingsMap
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve settings.', error: err.message });
  }
});

/**
 * PUT /api/settings
 */
router.put('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const updates = req.body; // e.g. { hostel_name, contact_phone, curfew_time, ... }

    for (const [key, val] of Object.entries(updates)) {
      const existing = await db.getOne('SELECT id FROM settings WHERE key_name = ?', [key]);
      if (existing) {
        await db.query('UPDATE settings SET value = ? WHERE key_name = ?', [String(val), key]);
      } else {
        await db.query('INSERT INTO settings (key_name, value) VALUES (?, ?)', [key, String(val)]);
      }
    }

    return res.json({
      success: true,
      message: 'Hostel settings updated successfully!'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update settings.', error: err.message });
  }
});

module.exports = router;
