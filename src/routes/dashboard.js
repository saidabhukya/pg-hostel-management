const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

/**
 * GET /api/dashboard/stats
 * Returns the 8 primary KPI cards
 */
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // 1. Total Students
    const studentCountRow = await db.getOne(
      "SELECT COUNT(*) AS total FROM students WHERE status = 'active'"
    );
    const totalStudents = Number(studentCountRow?.total || 0);

    // 2. Total Beds, Occupied, Available, Maintenance
    const bedStats = await db.query(
      `SELECT status, COUNT(*) AS count FROM beds GROUP BY status`
    );
    let totalBeds = 0;
    let occupiedBeds = 0;
    let availableBeds = 0;
    let maintenanceBeds = 0;

    for (const b of bedStats) {
      const c = Number(b.count);
      totalBeds += c;
      if (b.status === 'occupied') occupiedBeds = c;
      else if (b.status === 'available') availableBeds = c;
      else if (b.status === 'maintenance') maintenanceBeds = c;
    }

    // 3. Fees Collected (Sum of all payments with status = 'PAID')
    const feeCollectedRow = await db.getOne(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'PAID'"
    );
    const feesCollected = Number(feeCollectedRow?.total || 0);

    // 4. Pending Fees (Sum of fee_cycles with status = 'pending' or 'overdue')
    const pendingFeeRow = await db.getOne(
      "SELECT COALESCE(SUM(amount - paid_amount), 0) AS total FROM fee_cycles WHERE status IN ('pending', 'overdue')"
    );
    const pendingFees = Number(pendingFeeRow?.total || 0);

    // 5. Hostel Expenses (Sum of all expenses)
    const expenseRow = await db.getOne(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM expenses"
    );
    const hostelExpenses = Number(expenseRow?.total || 0);

    // 6. Net Income = Fees Collected - Hostel Expenses
    const netIncome = feesCollected - hostelExpenses;

    // 7. Additional quick metrics: Pending complaints, active visitors
    const complaintRow = await db.getOne(
      "SELECT COUNT(*) AS total FROM complaints WHERE status = 'Pending'"
    );
    const pendingComplaints = Number(complaintRow?.total || 0);

    const visitorRow = await db.getOne(
      "SELECT COUNT(*) AS total FROM visitors WHERE status = 'in_hostel'"
    );
    const activeVisitors = Number(visitorRow?.total || 0);

    return res.json({
      success: true,
      data: {
        totalStudents,
        totalBeds,
        occupiedBeds,
        availableBeds,
        maintenanceBeds,
        occupancyRate: totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : 0,
        feesCollected,
        pendingFees,
        hostelExpenses,
        netIncome,
        pendingComplaints,
        activeVisitors
      }
    });
  } catch (err) {
    console.error('[Dashboard Stats Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard metrics.',
      error: err.message
    });
  }
});

/**
 * GET /api/dashboard/charts
 * Returns datasets for Chart.js
 */
router.get('/charts', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // 1. Floor-wise occupancy (1F to 5F)
    const floorOccupancy = await db.query(`
      SELECT 
        f.floor_number,
        f.name AS floor_name,
        COUNT(b.id) AS total_beds,
        SUM(CASE WHEN b.status = 'occupied' THEN 1 ELSE 0 END) AS occupied_beds,
        SUM(CASE WHEN b.status = 'available' THEN 1 ELSE 0 END) AS available_beds
      FROM floors f
      JOIN rooms r ON r.floor_id = f.id
      JOIN beds b ON b.room_id = r.id
      GROUP BY f.id, f.floor_number, f.name
      ORDER BY f.floor_number ASC
    `);

    // 2. Monthly Income vs Expenses (Last 6 months)
    const monthlyIncome = await db.query(`
      SELECT 
        substr(payment_date, 1, 7) AS month_year,
        SUM(amount) AS total_income
      FROM payments
      WHERE status = 'PAID'
      GROUP BY month_year
      ORDER BY month_year ASC
    `);

    const monthlyExpenses = await db.query(`
      SELECT 
        substr(expense_date, 1, 7) AS month_year,
        SUM(amount) AS total_expense
      FROM expenses
      GROUP BY month_year
      ORDER BY month_year ASC
    `);

    // 3. Category-wise expense breakdown
    const categoryExpenses = await db.query(`
      SELECT 
        category,
        SUM(amount) AS total_amount,
        COUNT(*) AS count
      FROM expenses
      GROUP BY category
      ORDER BY total_amount DESC
    `);

    // 4. Recent Activities (last 5 payments, last 5 complaints)
    const recentPayments = await db.query(`
      SELECT p.*, s.name AS student_name, s.reg_number, r.room_number, b.bed_label
      FROM payments p
      JOIN students s ON s.id = p.student_id
      LEFT JOIN allocations a ON a.student_id = s.id AND a.status = 'active'
      LEFT JOIN beds b ON b.id = a.bed_id
      LEFT JOIN rooms r ON r.id = b.room_id
      ORDER BY p.payment_date DESC, p.id DESC
      LIMIT 5
    `);

    const recentComplaints = await db.query(`
      SELECT c.*, s.name AS student_name, s.reg_number, r.room_number
      FROM complaints c
      JOIN students s ON s.id = c.student_id
      LEFT JOIN allocations a ON a.student_id = s.id AND a.status = 'active'
      LEFT JOIN beds b ON b.id = a.bed_id
      LEFT JOIN rooms r ON r.id = b.room_id
      ORDER BY c.created_at DESC
      LIMIT 5
    `);

    return res.json({
      success: true,
      data: {
        floorOccupancy,
        monthlyIncome,
        monthlyExpenses,
        categoryExpenses,
        recentPayments,
        recentComplaints
      }
    });
  } catch (err) {
    console.error('[Dashboard Charts Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard charts data.',
      error: err.message
    });
  }
});

module.exports = router;
