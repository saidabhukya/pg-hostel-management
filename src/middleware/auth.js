const jwt = require('jsonwebtoken');
const config = require('../config/config');
const db = require('../config/db');

/**
 * Verify JWT token middleware
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // Fetch fresh user from DB
    const user = await db.getOne(
      'SELECT id, username, email, role, name, phone, avatar FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session. User no longer exists.'
      });
    }

    req.user = user;

    // If user is student, attach student profile details
    if (user.role === 'student') {
      const student = await db.getOne(
        `SELECT s.*, r.room_number, f.floor_number, b.bed_label, b.bed_number
         FROM students s
         LEFT JOIN allocations a ON a.student_id = s.id AND a.status = 'active'
         LEFT JOIN beds b ON b.id = a.bed_id
         LEFT JOIN rooms r ON r.id = b.room_id
         LEFT JOIN floors f ON f.id = r.floor_id
         WHERE s.user_id = ?`,
        [user.id]
      );
      req.student = student || null;
    }

    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired authentication token.',
      error: err.message
    });
  }
}

/**
 * Require Admin role middleware
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access restricted to Hostel Admin only.'
    });
  }
  next();
}

/**
 * Require Student role middleware
 */
function requireStudent(req, res, next) {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Access restricted to Students only.'
    });
  }
  next();
}

module.exports = {
  authenticateToken,
  requireAdmin,
  requireStudent
};
