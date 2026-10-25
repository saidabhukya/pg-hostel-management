const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * GET /api/mess
 * Returns full weekly schedule and highlights today's menu
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const todayDayName = DAYS[new Date().getDay()];

    const menuRows = await db.query('SELECT * FROM mess_menu');

    // Sort in order Monday -> Sunday
    const dayOrder = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 };
    const sortedMenu = menuRows.sort((a, b) => (dayOrder[a.day_of_week] || 0) - (dayOrder[b.day_of_week] || 0));

    const todayMenu = sortedMenu.find(m => m.day_of_week.toLowerCase() === todayDayName.toLowerCase()) || sortedMenu[0];

    return res.json({
      success: true,
      data: {
        todayDayName,
        todayMenu,
        weeklyMenu: sortedMenu
      }
    });
  } catch (err) {
    console.error('[Mess Menu Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve mess menu.',
      error: err.message
    });
  }
});

/**
 * PUT /api/mess/:dayOfWeek
 * Admin updates menu for a specific day
 */
router.put('/:dayOfWeek', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { dayOfWeek } = req.params;
    const { breakfast, lunch, dinner, specialNotes } = req.body;

    if (!breakfast || !lunch || !dinner) {
      return res.status(400).json({
        success: false,
        message: 'Breakfast, Lunch, and Dinner menus are required.'
      });
    }

    const existing = await db.getOne('SELECT id FROM mess_menu WHERE LOWER(day_of_week) = LOWER(?)', [dayOfWeek]);

    if (existing) {
      await db.query(
        `UPDATE mess_menu 
         SET breakfast = ?, lunch = ?, dinner = ?, special_notes = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [breakfast, lunch, dinner, specialNotes || null, existing.id]
      );
    } else {
      await db.query(
        `INSERT INTO mess_menu (day_of_week, breakfast, lunch, dinner, special_notes)
         VALUES (?, ?, ?, ?, ?)`,
        [dayOfWeek, breakfast, lunch, dinner, specialNotes || null]
      );
    }

    return res.json({
      success: true,
      message: `Mess menu for ${dayOfWeek} updated successfully.`
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update mess menu.',
      error: err.message
    });
  }
});

/**
 * POST /api/mess/feedback
 * Students submit mess feedback/complaint
 */
router.post('/feedback', authenticateToken, async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Feedback title and details are required.'
      });
    }

    const studentId = req.student ? req.student.id : req.body.studentId;
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Valid student account required.' });
    }

    // Save as Food category complaint
    await db.query(
      `INSERT INTO complaints (student_id, category, title, description, status)
       VALUES (?, 'Food', ?, ?, 'Pending')`,
      [studentId, `[Mess] ${title}`, description]
    );

    return res.json({
      success: true,
      message: 'Mess feedback submitted to the food committee.'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to submit mess feedback.',
      error: err.message
    });
  }
});

module.exports = router;
