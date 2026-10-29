const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { calculateCycle, evaluateDueStatus, formatDateDisplay } = require('../utils/feeCycleCalculator');

/**
 * GET /api/students
 * List students with search, filter, and pagination
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, floor, feeStatus, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let conditions = ["s.status != 'left'"];
    const params = [];

    if (search) {
      const q = `%${search.trim()}%`;
      conditions.push('(s.name LIKE ? OR s.reg_number LIKE ? OR s.phone LIKE ? OR r.room_number LIKE ? OR b.bed_label LIKE ?)');
      params.push(q, q, q, q, q);
    }

    if (floor) {
      conditions.push('f.floor_number = ?');
      params.push(parseInt(floor, 10));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count query
    const countQuery = `
      SELECT COUNT(DISTINCT s.id) AS total
      FROM students s
      LEFT JOIN allocations a ON a.student_id = s.id AND a.status = 'active'
      LEFT JOIN beds b ON b.id = a.bed_id
      LEFT JOIN rooms r ON r.id = b.room_id
      LEFT JOIN floors f ON f.id = r.floor_id
      ${whereClause}
    `;
    const countRes = await db.getOne(countQuery, params);
    const totalRecords = Number(countRes?.total || 0);

    // List query with latest fee cycle info
    const listQuery = `
      SELECT 
        s.id,
        s.reg_number,
        s.name,
        s.email,
        s.phone,
        s.college,
        s.course,
        s.year,
        s.gender,
        s.parent_name,
        s.parent_phone,
        s.mother_name,
        s.mother_phone,
        s.address,
        s.photo_url,
        s.joining_date,
        s.monthly_fee,
        s.status AS student_status,
        u.username,
        r.room_number,
        f.floor_number,
        b.bed_label,
        b.bed_number,
        (
          SELECT fc.status 
          FROM fee_cycles fc 
          WHERE fc.student_id = s.id 
          ORDER BY fc.cycle_number DESC 
          LIMIT 1
        ) AS latest_cycle_status,
        (
          SELECT fc.due_date 
          FROM fee_cycles fc 
          WHERE fc.student_id = s.id 
          ORDER BY fc.cycle_number DESC 
          LIMIT 1
        ) AS latest_cycle_due_date,
        (
          SELECT fc.end_date 
          FROM fee_cycles fc 
          WHERE fc.student_id = s.id 
          ORDER BY fc.cycle_number DESC 
          LIMIT 1
        ) AS latest_cycle_end_date
      FROM students s
      LEFT JOIN users u ON u.id = s.user_id
      LEFT JOIN allocations a ON a.student_id = s.id AND a.status = 'active'
      LEFT JOIN beds b ON b.id = a.bed_id
      LEFT JOIN rooms r ON r.id = b.room_id
      LEFT JOIN floors f ON f.id = r.floor_id
      ${whereClause}
      ORDER BY s.id DESC
      LIMIT ? OFFSET ?
    `;

    const students = await db.query(listQuery, [...params, parseInt(limit, 10), offset]);

    // Enhance students with fee reminder evaluation
    const enhancedStudents = students.map(st => {
      const isPaid = st.latest_cycle_status === 'paid';
      const reminder = evaluateDueStatus(st.latest_cycle_due_date, isPaid);
      return {
        ...st,
        feeReminder: reminder
      };
    });

    let filteredList = enhancedStudents;
    if (feeStatus) {
      if (feeStatus === 'paid') {
        filteredList = enhancedStudents.filter(s => s.latest_cycle_status === 'paid');
      } else if (feeStatus === 'pending') {
        filteredList = enhancedStudents.filter(s => s.latest_cycle_status !== 'paid');
      } else if (feeStatus === 'overdue') {
        filteredList = enhancedStudents.filter(s => s.feeReminder.status === 'overdue');
      }
    }

    return res.json({
      success: true,
      data: filteredList,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalRecords,
        totalPages: Math.ceil(totalRecords / parseInt(limit, 10))
      }
    });
  } catch (err) {
    console.error('[Get Students Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve students list.',
      error: err.message
    });
  }
});

/**
 * GET /api/students/me
 * Returns the currently logged-in student's own full profile.
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Only students can access this endpoint.' });
    }

    const student = await db.getOne(
      `SELECT 
        s.*,
        u.username,
        r.room_number,
        r.id AS room_id,
        f.floor_number,
        f.name AS floor_name,
        b.id AS bed_id,
        b.bed_label,
        b.bed_number,
        a.id AS allocation_id,
        a.start_date AS allocation_start_date
       FROM students s
       LEFT JOIN users u ON u.id = s.user_id
       LEFT JOIN allocations a ON a.student_id = s.id AND a.status = 'active'
       LEFT JOIN beds b ON b.id = a.bed_id
       LEFT JOIN rooms r ON r.id = b.room_id
       LEFT JOIN floors f ON f.id = r.floor_id
       WHERE s.user_id = ?`,
      [req.user.id]
    );

    if (!student) {
      return res.status(404).json({ success: false, message: 'No student profile linked to this account.' });
    }

    const studentId = student.id;
    const feeCycles = await db.query(
      `SELECT * FROM fee_cycles WHERE student_id = ? ORDER BY cycle_number ASC`,
      [studentId]
    );
    const payments = await db.query(
      `SELECT * FROM payments WHERE student_id = ? ORDER BY payment_date DESC, id DESC`,
      [studentId]
    );
    const complaints = await db.query(
      `SELECT * FROM complaints WHERE student_id = ? ORDER BY created_at DESC`,
      [studentId]
    );
    const leaveRequests = await db.query(
      `SELECT * FROM leave_requests WHERE student_id = ? ORDER BY created_at DESC`,
      [studentId]
    );

    const latestCycle = feeCycles[feeCycles.length - 1];
    let nextDueInfo = null;
    if (latestCycle) {
      const isPaid = latestCycle.status === 'paid';
      nextDueInfo = evaluateDueStatus(latestCycle.due_date, isPaid);
    }

    return res.json({
      success: true,
      data: { profile: student, feeCycles, payments, complaints, leaveRequests, nextDueInfo }
    });
  } catch (err) {
    console.error('[Student /me Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to load your profile.', error: err.message });
  }
});

/**
 * GET /api/students/:id
 * Retrieve comprehensive student profile with all tabs
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const studentId = req.params.id;

    // Strict role check: Students can only view their own profile
    if (req.user.role === 'student') {
      const myStudentId = req.student ? Number(req.student.id) : null;
      if (!myStudentId || myStudentId !== Number(studentId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view your own profile.'
        });
      }
    }

    const student = await db.getOne(
      `SELECT 
        s.*,
        u.username,
        r.room_number,
        r.id AS room_id,
        f.floor_number,
        f.name AS floor_name,
        b.id AS bed_id,
        b.bed_label,
        b.bed_number,
        a.id AS allocation_id,
        a.start_date AS allocation_start_date
       FROM students s
       LEFT JOIN users u ON u.id = s.user_id
       LEFT JOIN allocations a ON a.student_id = s.id AND a.status = 'active'
       LEFT JOIN beds b ON b.id = a.bed_id
       LEFT JOIN rooms r ON r.id = b.room_id
       LEFT JOIN floors f ON f.id = r.floor_id
       WHERE s.id = ?`,
      [studentId]
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    const feeCycles = await db.query(
      `SELECT * FROM fee_cycles WHERE student_id = ? ORDER BY cycle_number ASC`,
      [studentId]
    );

    const payments = await db.query(
      `SELECT * FROM payments WHERE student_id = ? ORDER BY payment_date DESC, id DESC`,
      [studentId]
    );

    const complaints = await db.query(
      `SELECT * FROM complaints WHERE student_id = ? ORDER BY created_at DESC`,
      [studentId]
    );

    const leaveRequests = await db.query(
      `SELECT * FROM leave_requests WHERE student_id = ? ORDER BY created_at DESC`,
      [studentId]
    );

    const latestCycle = feeCycles[feeCycles.length - 1];
    let nextDueInfo = null;
    if (latestCycle) {
      const isPaid = latestCycle.status === 'paid';
      nextDueInfo = evaluateDueStatus(latestCycle.due_date, isPaid);
    }

    return res.json({
      success: true,
      data: {
        profile: student,
        feeCycles,
        payments,
        complaints,
        leaveRequests,
        nextDueInfo
      }
    });
  } catch (err) {
    console.error('[Student Detail Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve student details.',
      error: err.message
    });
  }
});

/**
 * POST /api/students
 * Add new student with credentials, automatic bed allocation, and joining-date fee cycle
 */
router.post('/', authenticateToken, requireAdmin, upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'idProof', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      name,
      regNumber,
      username,
      password,
      phone,
      email,
      college,
      course,
      year,
      gender,
      parentName,
      parentPhone,
      motherName,
      motherPhone,
      address,
      joiningDate,
      bedId,
      monthlyFee
    } = req.body;

    if (!name || !regNumber || !phone || !email || !joiningDate || !bedId) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all mandatory fields: Name, Reg Number, Phone, Email, Joining Date, and Bed.'
      });
    }

    const regNumTrim = regNumber.trim();
    const emailTrim = email.trim();
    const studentUsername = username && username.trim() ? username.trim() : regNumTrim;
    const initialPassword = password && password.trim() ? password.trim() : regNumTrim;

    // Check uniqueness in students and users tables
    const existingStudent = await db.getOne(
      'SELECT id FROM students WHERE reg_number = ? OR email = ?',
      [regNumTrim, emailTrim]
    );
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'A student with this Registration Number or Email already exists.'
      });
    }

    const existingUser = await db.getOne(
      'SELECT id FROM users WHERE LOWER(username) = LOWER(?)',
      [studentUsername]
    );
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `Username "${studentUsername}" is already taken. Please choose another username or use the Registration Number.`
      });
    }

    // Verify bed availability
    const bed = await db.getOne('SELECT * FROM beds WHERE id = ?', [bedId]);
    if (!bed) {
      return res.status(404).json({ success: false, message: 'Selected bed does not exist.' });
    }
    if (bed.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Selected bed is already occupied or under maintenance. Please select an available bed.'
      });
    }

    // File paths
    let photoUrl = '/assets/images/default-student.png';
    let idProofUrl = null;

    if (req.files) {
      if (req.files.photo && req.files.photo[0]) {
        photoUrl = `/uploads/${req.files.photo[0].filename}`;
      }
      if (req.files.idProof && req.files.idProof[0]) {
        idProofUrl = `/uploads/${req.files.idProof[0].filename}`;
      }
    }

    const feeAmount = parseFloat(monthlyFee) || 7000.00;
    // Hash student password securely with bcrypt
    const passwordHash = await bcrypt.hash(initialPassword, 10);

    // 1. Create User account for student portal online login
    const userRes = await db.query(
      `INSERT INTO users (username, email, password_hash, role, name, phone, avatar)
       VALUES (?, ?, ?, 'student', ?, ?, ?)`,
      [studentUsername, emailTrim, passwordHash, name.trim(), phone.trim(), photoUrl]
    );
    const userId = userRes.insertId;

    // 2. Insert Student record in online cloud database
    const studentRes = await db.query(
      `INSERT INTO students (
        user_id, reg_number, name, email, phone, college, course, year,
        gender, parent_name, parent_phone, mother_name, mother_phone,
        address, photo_url, id_proof_url, joining_date, monthly_fee, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        userId,
        regNumTrim,
        name.trim(),
        emailTrim,
        phone.trim(),
        college || 'Vignan University',
        course || 'B.Tech',
        year || '1st Year',
        gender || 'Male',
        parentName || 'Parent / Guardian',
        parentPhone || phone,
        motherName || null,
        motherPhone || null,
        address || 'Hostel Campus',
        photoUrl,
        idProofUrl,
        joiningDate,
        feeAmount
      ]
    );
    const studentId = studentRes.insertId;

    // 3. Allocate Bed & Mark Bed as Occupied
    await db.query(
      `INSERT INTO allocations (student_id, bed_id, start_date, status, remarks)
       VALUES (?, ?, ?, 'active', 'Allocated at admission')`,
      [studentId, bedId, joiningDate]
    );
    await db.query(`UPDATE beds SET status = 'occupied' WHERE id = ?`, [bedId]);

    // 4. Automatically Generate Cycle 1 Based on Joining Date
    const cycle1 = calculateCycle(joiningDate, 1);
    await db.query(
      `INSERT INTO fee_cycles (student_id, cycle_number, start_date, end_date, due_date, amount, paid_amount, status, notes)
       VALUES (?, 1, ?, ?, ?, ?, 0.00, 'pending', 'Initial cycle generated on admission')`,
      [studentId, cycle1.startDate, cycle1.endDate, cycle1.dueDate, feeAmount]
    );

    // 5. Create Welcome Notification
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES (?, 'Welcome to SRI RAM PG!', ?, 'system', '#profile')`,
      [
        userId,
        `Welcome ${name}! Your admission is confirmed. Username: "${studentUsername}". First fee cycle: ${cycle1.startDateDisplay} to ${cycle1.endDateDisplay}.`
      ]
    );

    return res.status(201).json({
      success: true,
      message: `Student ${name} successfully enrolled! Credentials: Username: "${studentUsername}", Password: "${initialPassword}".`,
      data: {
        studentId,
        regNumber: regNumTrim,
        username: studentUsername,
        password: initialPassword,
        firstCycle: cycle1
      }
    });
  } catch (err) {
    console.error('[Add Student Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to add student.',
      error: err.message
    });
  }
});

/**
 * PUT /api/students/:id
 * Update student profile information (with optional photo upload)
 */
router.put('/:id', authenticateToken, requireAdmin, upload.single('photo'), async (req, res) => {
  try {
    const studentId = req.params.id;
    const {
      name,
      phone,
      email,
      college,
      course,
      year,
      parentName,
      parentPhone,
      motherName,
      motherPhone,
      address,
      monthlyFee
    } = req.body;

    const existing = await db.getOne('SELECT * FROM students WHERE id = ?', [studentId]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    let photoUrl = existing.photo_url;
    if (req.file) {
      photoUrl = `/uploads/${req.file.filename}`;
    }

    await db.query(
      `UPDATE students 
       SET name = ?, phone = ?, email = ?, college = ?, course = ?, year = ?,
           parent_name = ?, parent_phone = ?, mother_name = ?, mother_phone = ?,
           address = ?, monthly_fee = ?, photo_url = ?
       WHERE id = ?`,
      [
        name || existing.name,
        phone || existing.phone,
        email || existing.email,
        college || existing.college,
        course || existing.course,
        year || existing.year,
        parentName || existing.parent_name,
        parentPhone || existing.parent_phone,
        motherName !== undefined ? motherName : existing.mother_name,
        motherPhone !== undefined ? motherPhone : existing.mother_phone,
        address || existing.address,
        monthlyFee ? parseFloat(monthlyFee) : existing.monthly_fee,
        photoUrl,
        studentId
      ]
    );

    // Sync linked user record name, email, phone, avatar
    if (existing.user_id) {
      await db.query(
        `UPDATE users SET name = ?, email = ?, phone = ?, avatar = ? WHERE id = ?`,
        [name || existing.name, email || existing.email, phone || existing.phone, photoUrl, existing.user_id]
      );
    }

    return res.json({
      success: true,
      message: 'Student details updated successfully!',
      photoUrl
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update student details.',
      error: err.message
    });
  }
});

/**
 * POST /api/students/:id/photo
 * Admin uploads or updates student profile photo (optional)
 */
router.post('/:id/photo', authenticateToken, requireAdmin, upload.single('photo'), async (req, res) => {
  try {
    const studentId = req.params.id;
    const student = await db.getOne('SELECT id, user_id, name, photo_url FROM students WHERE id = ?', [studentId]);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select an image file (JPG, PNG, WEBP) to upload.' });
    }

    const photoUrl = `/uploads/${req.file.filename}`;

    // Update student table
    await db.query('UPDATE students SET photo_url = ? WHERE id = ?', [photoUrl, studentId]);

    // Update linked user table avatar so header/nav updates
    if (student.user_id) {
      await db.query('UPDATE users SET avatar = ? WHERE id = ?', [photoUrl, student.user_id]);
    }

    return res.json({
      success: true,
      message: `Profile photo for ${student.name} updated successfully!`,
      photoUrl
    });
  } catch (err) {
    console.error('[Upload Student Photo Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload student photo.',
      error: err.message
    });
  }
});

/**
 * DELETE /api/students/:id/photo
 * Admin removes custom student photo and resets to default avatar
 */
router.delete('/:id/photo', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const studentId = req.params.id;
    const defaultPhoto = '/assets/images/default-student.png';
    const student = await db.getOne('SELECT id, user_id, name FROM students WHERE id = ?', [studentId]);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    await db.query('UPDATE students SET photo_url = ? WHERE id = ?', [defaultPhoto, studentId]);
    if (student.user_id) {
      await db.query('UPDATE users SET avatar = ? WHERE id = ?', [defaultPhoto, student.user_id]);
    }

    return res.json({
      success: true,
      message: `Photo for ${student.name} reset to default avatar.`,
      photoUrl: defaultPhoto
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to reset photo.',
      error: err.message
    });
  }
});

/**
 * POST /api/students/:id/reset-password
 * Admin resets student password
 */
router.post('/:id/reset-password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const studentId = req.params.id;
    const { newPassword } = req.body;

    const student = await db.getOne('SELECT id, user_id, name, reg_number FROM students WHERE id = ?', [studentId]);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const passwordToSet = newPassword && String(newPassword).trim() ? String(newPassword).trim() : student.reg_number;
    if (passwordToSet.length < 4) {
      return res.status(400).json({ success: false, message: 'Password must be at least 4 characters.' });
    }

    const newHash = await bcrypt.hash(passwordToSet, 10);

    if (student.user_id) {
      await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, student.user_id]);
    } else {
      const userRes = await db.query(
        `INSERT INTO users (username, email, password_hash, role, name) VALUES (?, ?, ?, 'student', ?)`,
        [student.reg_number, `${student.reg_number.toLowerCase()}@hostel.local`, newHash, student.name]
      );
      await db.query('UPDATE students SET user_id = ? WHERE id = ?', [userRes.insertId, studentId]);
    }

    return res.json({
      success: true,
      message: `Password for ${student.name} (${student.reg_number}) reset successfully. New Password: "${passwordToSet}".`,
      newPassword: passwordToSet
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to reset student password.',
      error: err.message
    });
  }
});

/**
 * PUT /api/students/:id/status
 * Admin activates/deactivates student account
 */
router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const studentId = req.params.id;
    const { status } = req.body;

    if (!['active', 'inactive', 'left'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be active, inactive, or left.' });
    }

    await db.query('UPDATE students SET status = ? WHERE id = ?', [status, studentId]);
    return res.json({ success: true, message: `Student status updated to "${status}".` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update student status.', error: err.message });
  }
});

/**
 * DELETE /api/students/:id
 * Vacate student and free up allocated bed
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const studentId = req.params.id;

    const student = await db.getOne('SELECT * FROM students WHERE id = ?', [studentId]);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // Free up active bed allocation
    const alloc = await db.getOne(
      "SELECT * FROM allocations WHERE student_id = ? AND status = 'active'",
      [studentId]
    );

    if (alloc) {
      const today = new Date().toISOString().split('T')[0];
      await db.query(
        "UPDATE allocations SET status = 'vacated', end_date = ? WHERE id = ?",
        [today, alloc.id]
      );
      await db.query("UPDATE beds SET status = 'available' WHERE id = ?", [alloc.bed_id]);
    }

    // Mark student status as left
    await db.query("UPDATE students SET status = 'left' WHERE id = ?", [studentId]);

    return res.json({
      success: true,
      message: `Student ${student.name} marked as vacated and bed has been freed.`
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to vacate student.',
      error: err.message
    });
  }
});

module.exports = router;
