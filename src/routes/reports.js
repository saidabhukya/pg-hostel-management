const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { formatDateDisplay, evaluateDueStatus } = require('../utils/feeCycleCalculator');

/**
 * GET /api/reports/:reportType
 * Returns clean structured datasets for all 9 report types
 */
router.get('/:reportType', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { reportType } = req.params;
    const { startDate, endDate, filter, search } = req.query;

    let result = { title: '', columns: [], rows: [], summary: {} };

    switch (reportType) {
      // 1. STUDENT REPORT
      case 'students': {
        result.title = 'Comprehensive Student Directory Report';
        result.columns = ['Reg No', 'Student Name', 'College', 'Course', 'Room', 'Bed', 'Phone', 'Joining Date', 'Status'];
        
        let where = ["s.status != 'left'"];
        const p = [];
        if (search) {
          where.push('(s.name LIKE ? OR s.reg_number LIKE ? OR s.college LIKE ?)');
          p.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        const rows = await db.query(`
          SELECT 
            s.reg_number, s.name, s.college, s.course, 
            COALESCE(r.room_number, 'Unassigned') AS room_number,
            COALESCE(b.bed_label, '-') AS bed_label,
            s.phone, s.joining_date, s.status
          FROM students s
          LEFT JOIN allocations a ON a.student_id = s.id AND a.status = 'active'
          LEFT JOIN beds b ON b.id = a.bed_id
          LEFT JOIN rooms r ON r.id = b.room_id
          WHERE ${where.join(' AND ')}
          ORDER BY s.id DESC
        `, p);

        result.rows = rows.map(r => [
          r.reg_number, r.name, r.college, r.course, r.room_number, r.bed_label, r.phone, formatDateDisplay(r.joining_date), r.status
        ]);
        result.summary = { 'Total Students': rows.length };
        break;
      }

      // 2. ROOM REPORT
      case 'rooms': {
        result.title = 'Room Capacity & Status Report';
        result.columns = ['Floor', 'Room Number', 'Type', 'Capacity', 'Occupied Beds', 'Available Beds', 'Status'];
        
        const rows = await db.query(`
          SELECT 
            f.name AS floor_name, r.room_number, r.type, r.capacity, r.status,
            SUM(CASE WHEN b.status = 'occupied' THEN 1 ELSE 0 END) AS occupied_beds,
            SUM(CASE WHEN b.status = 'available' THEN 1 ELSE 0 END) AS available_beds
          FROM rooms r
          JOIN floors f ON f.id = r.floor_id
          JOIN beds b ON b.room_id = r.id
          GROUP BY r.id, f.name, r.room_number, r.type, r.capacity, r.status
          ORDER BY r.room_number ASC
        `);

        result.rows = rows.map(r => [
          r.floor_name, r.room_number, r.type, r.capacity, r.occupied_beds, r.available_beds, r.status
        ]);
        result.summary = {
          'Total Rooms': rows.length,
          'Total Capacity': rows.reduce((acc, r) => acc + Number(r.capacity), 0)
        };
        break;
      }

      // 3. BED OCCUPANCY REPORT
      case 'occupancy': {
        result.title = 'Bed Occupancy & Allocation Details Report';
        result.columns = ['Room', 'Bed', 'Status', 'Occupant Name', 'Reg Number', 'Phone', 'Since Date'];
        
        const rows = await db.query(`
          SELECT 
            r.room_number, b.bed_label, b.status,
            s.name AS student_name, s.reg_number, s.phone,
            a.start_date
          FROM beds b
          JOIN rooms r ON r.id = b.room_id
          LEFT JOIN allocations a ON a.bed_id = b.id AND a.status = 'active'
          LEFT JOIN students s ON s.id = a.student_id
          ORDER BY r.room_number ASC, b.bed_number ASC
        `);

        const occupiedCount = rows.filter(r => r.status === 'occupied').length;
        const availableCount = rows.filter(r => r.status === 'available').length;

        result.rows = rows.map(r => [
          r.room_number, r.bed_label, r.status.toUpperCase(), r.student_name || '-', r.reg_number || '-', r.phone || '-', r.start_date ? formatDateDisplay(r.start_date) : '-'
        ]);
        result.summary = {
          'Total Beds': rows.length,
          'Occupied Beds': occupiedCount,
          'Available Beds': availableCount,
          'Occupancy Rate': `${((occupiedCount / rows.length) * 100).toFixed(1)}%`
        };
        break;
      }

      // 4. FEE COLLECTION REPORT
      case 'collections': {
        result.title = 'Fee Collections Ledger Report';
        result.columns = ['Receipt #', 'Date', 'Student Name', 'Reg No', 'Cycle', 'Amount', 'Method', 'Transaction ID'];
        
        let where = ["p.status = 'PAID'"];
        const p = [];
        if (startDate) { where.push('p.payment_date >= ?'); p.push(startDate); }
        if (endDate) { where.push('p.payment_date <= ?'); p.push(endDate); }

        const rows = await db.query(`
          SELECT 
            p.receipt_number, p.payment_date, s.name AS student_name, s.reg_number,
            p.cycle_start_date, p.cycle_end_date, p.amount, p.payment_method, p.transaction_id
          FROM payments p
          JOIN students s ON s.id = p.student_id
          WHERE ${where.join(' AND ')}
          ORDER BY p.payment_date DESC, p.id DESC
        `, p);

        const totalCollected = rows.reduce((acc, r) => acc + Number(r.amount), 0);

        result.rows = rows.map(r => [
          r.receipt_number,
          formatDateDisplay(r.payment_date),
          r.student_name,
          r.reg_number,
          `${formatDateDisplay(r.cycle_start_date)} to ${formatDateDisplay(r.cycle_end_date)}`,
          `₹${Number(r.amount).toLocaleString('en-IN')}`,
          r.payment_method,
          r.transaction_id || '-'
        ]);
        result.summary = {
          'Total Transactions': rows.length,
          'Total Collected': `₹${totalCollected.toLocaleString('en-IN')}`
        };
        break;
      }

      // 5. PENDING FEE REPORT
      case 'pending-fees': {
        result.title = 'Pending & Overdue Fees Statement';
        result.columns = ['Reg No', 'Student Name', 'Room', 'Cycle Range', 'Due Date', 'Pending Amount', 'Status'];

        const rows = await db.query(`
          SELECT 
            s.reg_number, s.name AS student_name, r.room_number,
            fc.start_date, fc.end_date, fc.due_date,
            (fc.amount - fc.paid_amount) AS pending_amount,
            fc.status
          FROM fee_cycles fc
          JOIN students s ON s.id = fc.student_id AND s.status = 'active'
          LEFT JOIN allocations a ON a.student_id = s.id AND a.status = 'active'
          LEFT JOIN beds b ON b.id = a.bed_id
          LEFT JOIN rooms r ON r.id = b.room_id
          WHERE fc.status != 'paid'
          ORDER BY fc.due_date ASC
        `);

        const totalPending = rows.reduce((acc, r) => acc + Number(r.pending_amount), 0);

        result.rows = rows.map(r => {
          const reminder = evaluateDueStatus(r.due_date, false);
          return [
            r.reg_number,
            r.student_name,
            r.room_number || '-',
            `${formatDateDisplay(r.start_date)} to ${formatDateDisplay(r.end_date)}`,
            formatDateDisplay(r.due_date),
            `₹${Number(r.pending_amount).toLocaleString('en-IN')}`,
            reminder.label
          ];
        });
        result.summary = {
          'Pending Count': rows.length,
          'Total Pending Dues': `₹${totalPending.toLocaleString('en-IN')}`
        };
        break;
      }

      // 6. EXPENSE REPORT
      case 'expenses': {
        result.title = 'Hostel Operating Expenses Report';
        result.columns = ['Date', 'Category', 'Description', 'Amount', 'Voucher / Receipt'];

        let where = [];
        const p = [];
        if (startDate) { where.push('expense_date >= ?'); p.push(startDate); }
        if (endDate) { where.push('expense_date <= ?'); p.push(endDate); }
        if (filter) { where.push('category = ?'); p.push(filter); }

        const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

        const rows = await db.query(`
          SELECT * FROM expenses ${whereSql} ORDER BY expense_date DESC, id DESC
        `, p);

        const totalExp = rows.reduce((acc, r) => acc + Number(r.amount), 0);

        result.rows = rows.map(r => [
          formatDateDisplay(r.expense_date),
          r.category,
          r.description,
          `₹${Number(r.amount).toLocaleString('en-IN')}`,
          r.receipt_ref || '-'
        ]);
        result.summary = {
          'Total Expense Entries': rows.length,
          'Total Expenses': `₹${totalExp.toLocaleString('en-IN')}`
        };
        break;
      }

      // 7. INCOME & NET REPORT
      case 'income': {
        result.title = 'Hostel Financial Profit & Loss Statement';
        result.columns = ['Financial Metric', 'Amount (INR)'];

        const incRow = await db.getOne("SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'PAID'");
        const expRow = await db.getOne("SELECT COALESCE(SUM(amount), 0) AS total FROM expenses");
        const pendRow = await db.getOne("SELECT COALESCE(SUM(amount - paid_amount), 0) AS total FROM fee_cycles WHERE status != 'paid'");

        const grossIncome = Number(incRow?.total || 0);
        const totalExpenses = Number(expRow?.total || 0);
        const pendingDues = Number(pendRow?.total || 0);
        const netProfit = grossIncome - totalExpenses;

        result.rows = [
          ['Total Gross Fee Income Collected', `₹${grossIncome.toLocaleString('en-IN')}`],
          ['Total Hostel Operating Expenses', `₹${totalExpenses.toLocaleString('en-IN')}`],
          ['Net Hostel Operational Income', `₹${netProfit.toLocaleString('en-IN')}`],
          ['Outstanding Receivables (Pending Fees)', `₹${pendingDues.toLocaleString('en-IN')}`]
        ];
        result.summary = {
          'Gross Income': `₹${grossIncome.toLocaleString('en-IN')}`,
          'Total Expenses': `₹${totalExpenses.toLocaleString('en-IN')}`,
          'Net Profit': `₹${netProfit.toLocaleString('en-IN')}`
        };
        break;
      }

      // 8. COMPLAINT REPORT
      case 'complaints': {
        result.title = 'Maintenance & Student Grievances Audit Report';
        result.columns = ['Date', 'Category', 'Title', 'Student Name', 'Room', 'Status', 'Resolution Notes'];

        const rows = await db.query(`
          SELECT 
            c.created_at, c.category, c.title, s.name AS student_name, r.room_number, c.status, c.admin_notes
          FROM complaints c
          JOIN students s ON s.id = c.student_id
          LEFT JOIN allocations a ON a.student_id = s.id AND a.status = 'active'
          LEFT JOIN beds b ON b.id = a.bed_id
          LEFT JOIN rooms r ON r.id = b.room_id
          ORDER BY c.created_at DESC
        `);

        result.rows = rows.map(r => [
          formatDateDisplay(r.created_at),
          r.category,
          r.title,
          r.student_name,
          r.room_number || '-',
          r.status,
          r.admin_notes || '-'
        ]);
        result.summary = {
          'Total Complaints': rows.length,
          'Resolved': rows.filter(r => r.status === 'Resolved').length,
          'Pending / In Progress': rows.filter(r => r.status !== 'Resolved').length
        };
        break;
      }

      // 9. VISITOR REPORT
      case 'visitors': {
        result.title = 'Hostel Visitor Gate Log Report';
        result.columns = ['Visitor Name', 'Phone', 'Relation', 'Student Visited', 'Purpose', 'Entry Time', 'Exit Time', 'Status'];

        const rows = await db.query(`
          SELECT 
            v.visitor_name, v.phone, v.relation, s.name AS student_name,
            v.purpose, v.entry_time, v.exit_time, v.status
          FROM visitors v
          JOIN students s ON s.id = v.student_id
          ORDER BY v.entry_time DESC
        `);

        result.rows = rows.map(r => [
          r.visitor_name,
          r.phone,
          r.relation,
          r.student_name,
          r.purpose,
          r.entry_time,
          r.exit_time || 'In Hostel',
          r.status === 'in_hostel' ? 'In Hostel' : 'Checked Out'
        ]);
        result.summary = {
          'Total Visitors Logged': rows.length,
          'Currently In Hostel': rows.filter(r => r.status === 'in_hostel').length
        };
        break;
      }

      default:
        return res.status(400).json({ success: false, message: `Unknown report type: ${reportType}` });
    }

    return res.json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('[Reports Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate report.',
      error: err.message
    });
  }
});

module.exports = router;
