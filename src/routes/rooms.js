const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

/**
 * GET /api/rooms/structure
 * Returns the 5 floors with their 10 rooms each and bed occupancy counts
 */
router.get('/structure', authenticateToken, async (req, res) => {
  try {
    const floors = await db.query('SELECT * FROM floors ORDER BY floor_number DESC');

    const roomsWithBeds = await db.query(`
      SELECT 
        r.id,
        r.floor_id,
        r.room_number,
        r.capacity,
        r.type,
        r.status AS room_status,
        COUNT(b.id) AS total_beds,
        SUM(CASE WHEN b.status = 'occupied' THEN 1 ELSE 0 END) AS occupied_beds,
        SUM(CASE WHEN b.status = 'available' THEN 1 ELSE 0 END) AS available_beds,
        SUM(CASE WHEN b.status = 'maintenance' THEN 1 ELSE 0 END) AS maintenance_beds
      FROM rooms r
      JOIN beds b ON b.room_id = r.id
      GROUP BY r.id, r.floor_id, r.room_number, r.capacity, r.type, r.status
      ORDER BY r.room_number ASC
    `);

    // Group rooms by floor
    const floorsData = floors.map(floor => {
      const floorRooms = roomsWithBeds
        .filter(rm => Number(rm.floor_id) === Number(floor.id))
        .sort((a, b) => a.room_number.localeCompare(b.room_number, undefined, { numeric: true }));

      const totalBeds = floorRooms.reduce((acc, r) => acc + Number(r.total_beds), 0);
      const occupiedBeds = floorRooms.reduce((acc, r) => acc + Number(r.occupied_beds), 0);
      const availableBeds = floorRooms.reduce((acc, r) => acc + Number(r.available_beds), 0);

      return {
        ...floor,
        rooms: floorRooms,
        stats: {
          totalRooms: floorRooms.length,
          totalBeds,
          occupiedBeds,
          availableBeds
        }
      };
    });

    return res.json({
      success: true,
      data: floorsData
    });
  } catch (err) {
    console.error('[Room Structure Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve hostel structure.',
      error: err.message
    });
  }
});

/**
 * GET /api/rooms/:roomNumber
 * Detailed view of a room and its 5 beds, with occupant student details
 */
router.get('/:roomNumber', authenticateToken, async (req, res) => {
  try {
    const { roomNumber } = req.params;

    const room = await db.getOne(
      `SELECT r.*, f.floor_number, f.name AS floor_name
       FROM rooms r
       JOIN floors f ON f.id = r.floor_id
       WHERE r.room_number = ?`,
      [roomNumber]
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: `Room ${roomNumber} not found.`
      });
    }

    // Get 5 beds for this room and occupant details if occupied
    const beds = await db.query(
      `SELECT 
        b.id,
        b.bed_number,
        b.bed_label,
        b.status,
        s.id AS student_id,
        s.name AS student_name,
        s.reg_number,
        s.phone AS student_phone,
        s.email AS student_email,
        s.photo_url,
        s.course,
        s.year,
        s.joining_date,
        a.id AS allocation_id,
        a.start_date AS allocation_start_date
       FROM beds b
       LEFT JOIN allocations a ON a.bed_id = b.id AND a.status = 'active'
       LEFT JOIN students s ON s.id = a.student_id
       WHERE b.room_id = ?
       ORDER BY b.bed_number ASC`,
      [room.id]
    );

    return res.json({
      success: true,
      data: {
        room,
        beds
      }
    });
  } catch (err) {
    console.error('[Room Detail Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve room details.',
      error: err.message
    });
  }
});

/**
 * GET /api/rooms/available/dropdown
 * Cascading selector: returns available rooms and beds for student assignment
 */
router.get('/options/available', authenticateToken, async (req, res) => {
  try {
    const { floorNumber } = req.query;

    let floorFilter = '';
    const params = [];
    if (floorNumber) {
      floorFilter = 'WHERE f.floor_number = ?';
      params.push(floorNumber);
    }

    const availableBeds = await db.query(
      `SELECT 
        b.id AS bed_id,
        b.bed_number,
        b.bed_label,
        r.id AS room_id,
        r.room_number,
        f.id AS floor_id,
        f.floor_number,
        f.name AS floor_name
       FROM beds b
       JOIN rooms r ON r.id = b.room_id
       JOIN floors f ON f.id = r.floor_id
       ${floorFilter ? floorFilter + " AND b.status = 'available'" : "WHERE b.status = 'available'"}
       ORDER BY f.floor_number ASC, r.room_number ASC, b.bed_number ASC`,
      params
    );

    return res.json({
      success: true,
      data: availableBeds
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch available beds.',
      error: err.message
    });
  }
});

/**
 * PUT /api/rooms/beds/:bedId/status
 * Admin changes bed status (available, maintenance)
 */
router.put('/beds/:bedId/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { bedId } = req.params;
    const { status } = req.body;

    if (!['available', 'maintenance'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "available" or "maintenance". Use student allocation to occupy.'
      });
    }

    // Check if bed is currently occupied
    const activeAlloc = await db.getOne(
      "SELECT * FROM allocations WHERE bed_id = ? AND status = 'active'",
      [bedId]
    );

    if (activeAlloc) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change status of an occupied bed. Transfer or vacate the student first.'
      });
    }

    await db.query('UPDATE beds SET status = ? WHERE id = ?', [status, bedId]);

    return res.json({
      success: true,
      message: `Bed status updated to ${status}.`
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update bed status.',
      error: err.message
    });
  }
});

/**
 * POST /api/rooms/beds/transfer
 * Admin transfers a student from one bed to another available bed
 */
router.post('/beds/transfer', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { studentId, targetBedId, reason } = req.body;

    if (!studentId || !targetBedId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and Target Bed ID are required.'
      });
    }

    // Check target bed availability
    const targetBed = await db.getOne('SELECT * FROM beds WHERE id = ?', [targetBedId]);
    if (!targetBed) {
      return res.status(404).json({ success: false, message: 'Target bed not found.' });
    }
    if (targetBed.status !== 'available') {
      return res.status(400).json({ success: false, message: 'Target bed is not available.' });
    }

    // Find current active allocation
    const currentAlloc = await db.getOne(
      "SELECT * FROM allocations WHERE student_id = ? AND status = 'active'",
      [studentId]
    );

    const today = new Date().toISOString().split('T')[0];

    if (currentAlloc) {
      // Mark current allocation as transferred
      await db.query(
        "UPDATE allocations SET status = 'transferred', end_date = ?, remarks = ? WHERE id = ?",
        [today, reason || 'Transferred to another bed', currentAlloc.id]
      );
      // Free up old bed
      await db.query("UPDATE beds SET status = 'available' WHERE id = ?", [currentAlloc.bed_id]);
    }

    // Create new allocation
    await db.query(
      "INSERT INTO allocations (student_id, bed_id, start_date, status, remarks) VALUES (?, ?, ?, 'active', ?)",
      [studentId, targetBedId, today, reason || 'Room/Bed transfer']
    );
    // Mark target bed as occupied
    await db.query("UPDATE beds SET status = 'occupied' WHERE id = ?", [targetBedId]);

    // Send notification to student
    const student = await db.getOne('SELECT user_id, name FROM students WHERE id = ?', [studentId]);
    if (student && student.user_id) {
      const roomInfo = await db.getOne(
        `SELECT r.room_number, b.bed_label FROM beds b JOIN rooms r ON r.id = b.room_id WHERE b.id = ?`,
        [targetBedId]
      );
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, 'system', '#profile')`,
        [
          student.user_id,
          'Room Transfer Completed',
          `You have been transferred to Room ${roomInfo.room_number}, ${roomInfo.bed_label}.`
        ]
      );
    }

    return res.json({
      success: true,
      message: 'Student bed transfer completed successfully!'
    });
  } catch (err) {
    console.error('[Bed Transfer Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to process bed transfer.',
      error: err.message
    });
  }
});

module.exports = router;
