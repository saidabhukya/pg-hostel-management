const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { formatDateDisplay } = require('../utils/feeCycleCalculator');

/**
 * GET /api/expenses
 * List expenses with category filter, search, date range, and pagination
 */
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { category, search, startDate, endDate, page = 1, limit = 25 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let conditions = [];
    const params = [];

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (startDate) {
      conditions.push('expense_date >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('expense_date <= ?');
      params.push(endDate);
    }

    if (search) {
      const q = `%${search.trim()}%`;
      conditions.push('(description LIKE ? OR receipt_ref LIKE ? OR category LIKE ?)');
      params.push(q, q, q);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await db.getOne(
      `SELECT COUNT(*) AS total, COALESCE(SUM(amount), 0) AS total_amount FROM expenses ${whereClause}`,
      params
    );
    const totalRecords = Number(countRes?.total || 0);
    const filteredTotalAmount = Number(countRes?.total_amount || 0);

    const expenses = await db.query(
      `SELECT * FROM expenses ${whereClause} ORDER BY expense_date DESC, id DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), offset]
    );

    const enhanced = expenses.map(e => ({
      ...e,
      expenseDateDisplay: formatDateDisplay(e.expense_date)
    }));

    // Calculate overall financial summary
    const incomeRow = await db.getOne("SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'PAID'");
    const totalIncome = Number(incomeRow?.total || 0);

    const expenseRow = await db.getOne("SELECT COALESCE(SUM(amount), 0) AS total FROM expenses");
    const totalExpenses = Number(expenseRow?.total || 0);

    const netIncome = totalIncome - totalExpenses;

    return res.json({
      success: true,
      data: enhanced,
      summary: {
        totalIncome,
        totalExpenses,
        netIncome,
        filteredTotalAmount
      },
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalRecords,
        totalPages: Math.ceil(totalRecords / parseInt(limit, 10))
      }
    });
  } catch (err) {
    console.error('[Expenses Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve expenses.',
      error: err.message
    });
  }
});

/**
 * POST /api/expenses
 * Record a new expense
 */
router.post('/', authenticateToken, requireAdmin, upload.single('receipt'), async (req, res) => {
  try {
    const { category, amount, expenseDate, description, receiptRef } = req.body;

    if (!category || !amount || !expenseDate || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Category, Amount, Expense Date, and Description.'
      });
    }

    const receiptPath = req.file ? `/uploads/${req.file.filename}` : (receiptRef || null);

    const insertRes = await db.query(
      `INSERT INTO expenses (category, amount, expense_date, description, receipt_ref)
       VALUES (?, ?, ?, ?, ?)`,
      [category, parseFloat(amount), expenseDate, description.trim(), receiptPath]
    );

    return res.status(201).json({
      success: true,
      message: `Expense of ₹${parseFloat(amount)} recorded successfully under ${category}.`,
      expenseId: insertRes.insertId
    });
  } catch (err) {
    console.error('[Record Expense Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to record expense.',
      error: err.message
    });
  }
});

module.exports = router;
