const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const config = require('../config/config');
const { authenticateToken } = require('../middleware/auth');
const { seed } = require('../database/seed');

/**
 * POST /api/auth/login
 * Handles both Admin and Student logins
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/Email and password are required.'
      });
    }

    const trimmedUser = username.trim();

    // Find user by username or email
    const user = await db.getOne(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [trimmedUser, trimmedUser]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your username or password.'
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your username or password.'
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    let studentProfile = null;
    if (user.role === 'student') {
      studentProfile = await db.getOne(
        `SELECT s.*, r.room_number, f.floor_number, b.bed_label, b.bed_number
         FROM students s
         LEFT JOIN allocations a ON a.student_id = s.id AND a.status = 'active'
         LEFT JOIN beds b ON b.id = a.bed_id
         LEFT JOIN rooms r ON r.id = b.room_id
         LEFT JOIN floors f ON f.id = r.floor_id
         WHERE s.user_id = ?`,
        [user.id]
      );
    }

    return res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone
      },
      student: studentProfile
    });
  } catch (err) {
    console.error('[Auth Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication.',
      error: err.message
    });
  }
});

/**
 * GET /api/auth/me
 * Returns current authenticated user and linked student profile
 */
router.get('/me', authenticateToken, async (req, res) => {
  return res.json({
    success: true,
    user: req.user,
    student: req.student || null
  });
});

/**
 * POST /api/auth/change-password
 */
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    const user = await db.getOne('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password.'
      });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);

    return res.json({
      success: true,
      message: 'Password updated successfully!'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update password.',
      error: err.message
    });
  }
});

/**
 * POST /api/auth/reset-demo
 * Resets database back to clean sample state
 */
router.post('/reset-demo', async (req, res) => {
  try {
    await seed();
    return res.json({
      success: true,
      message: 'Database successfully reset to initial demo state.'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to reset demo database.',
      error: err.message
    });
  }
});

module.exports = router;
