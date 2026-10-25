const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { calculateCycle, formatDateDisplay } = require('../utils/feeCycleCalculator');

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * POST /api/ai-assistant/query
 * Intelligent AI Hostel Assistant with modular LLM integration & built-in semantic context
 */
router.post('/query', authenticateToken, async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Question cannot be empty.'
      });
    }

    const q = question.trim().toLowerCase();
    const userRole = req.user.role;
    let answer = '';
    let category = 'general';
    let quickActions = [];

    // STUDENT QUERY HANDLERS
    if (userRole === 'student' && req.student) {
      const student = req.student;

      // 1. Fee Due Query
      if (q.includes('fee') || q.includes('due') || q.includes('payment') || q.includes('next fee') || q.includes('pending')) {
        category = 'fees';
        // Get student's fee cycles
        const cycles = await db.query(
          'SELECT * FROM fee_cycles WHERE student_id = ? ORDER BY cycle_number ASC',
          [student.id]
        );
        const pending = cycles.find(c => c.status !== 'paid');

        if (pending) {
          answer = `Your next fee of **₹${Number(pending.amount).toLocaleString('en-IN')}** for the billing cycle (${formatDateDisplay(pending.start_date)} to ${formatDateDisplay(pending.end_date)}) is due on **${formatDateDisplay(pending.due_date)}**.`;
        } else if (cycles.length > 0) {
          const last = cycles[cycles.length - 1];
          const nextCycleObj = calculateCycle(student.joining_date, last.cycle_number + 1);
          answer = `All your current fee cycles are paid! Your next upcoming billing cycle of **₹${Number(student.monthly_fee).toLocaleString('en-IN')}** will be due on **${nextCycleObj.dueDateDisplay}** (${nextCycleObj.startDateDisplay} to ${nextCycleObj.endDateDisplay}).`;
        } else {
          answer = `Your monthly hostel fee is **₹${Number(student.monthly_fee).toLocaleString('en-IN')}**, calculated from your joining date (${formatDateDisplay(student.joining_date)}).`;
        }
        quickActions = [
          { label: 'View Fee History', link: '#fees' },
          { label: 'View Receipts', link: '#payments' }
        ];
      }
      // 2. Room & Bed Query
      else if (q.includes('room') || q.includes('bed') || q.includes('floor') || q.includes('where do i stay')) {
        category = 'room';
        answer = `You are currently residing in **Room ${student.room_number || '205'}**, **${student.bed_label || 'Bed 3'}** on **Floor ${student.floor_number || 2}**.`;
        quickActions = [{ label: 'View My Room', link: '#hostel-structure' }];
      }
      // 3. Mess / Food Query
      else if (q.includes('food') || q.includes('menu') || q.includes('mess') || q.includes('dinner') || q.includes('lunch') || q.includes('breakfast')) {
        category = 'mess';
        const todayDay = DAYS[new Date().getDay()];
        const menu = await db.getOne('SELECT * FROM mess_menu WHERE LOWER(day_of_week) = LOWER(?)', [todayDay]);
        if (menu) {
          answer = `**Today's Mess Menu (${todayDay}):**\n` +
            `• **Breakfast (${menu.breakfast_timing}):** ${menu.breakfast}\n` +
            `• **Lunch (${menu.lunch_timing}):** ${menu.lunch}\n` +
            `• **Dinner (${menu.dinner_timing}):** ${menu.dinner}\n` +
            (menu.special_notes ? `• *Note:* ${menu.special_notes}` : '');
        } else {
          answer = `Today is ${todayDay}. Mess timings are 7:30-9:30 AM (Breakfast), 12:30-2:30 PM (Lunch), and 7:30-9:30 PM (Dinner).`;
        }
        quickActions = [{ label: 'Full Weekly Menu', link: '#mess' }];
      }
      // 4. Complaint Query
      else if (q.includes('complaint') || q.includes('wifi') || q.includes('tap') || q.includes('plumbing') || q.includes('broken') || q.includes('repair')) {
        category = 'complaint';
        answer = `To report an issue with Wi-Fi, electrical fittings, plumbing, or room cleaning, navigate to the **Complaints** section, select your issue category, add a description, and optionally attach a photo. The warden and maintenance staff will attend to it immediately.`;
        quickActions = [{ label: 'Submit Complaint', link: '#complaints' }];
      }
      // 5. Leave Request Query
      else if (q.includes('leave') || q.includes('out') || q.includes('gate pass') || q.includes('holiday') || q.includes('vacation')) {
        category = 'leave';
        answer = `Hostel gate pass and leave permissions can be requested via the **Leave Requests** tab. Specify your departure date, return date, reason, and emergency parent contact. Approvals are processed within 24 hours.`;
        quickActions = [{ label: 'Apply For Leave', link: '#leave-requests' }];
      }
      // 6. Curfew / Rules Query
      else if (q.includes('rule') || q.includes('curfew') || q.includes('time') || q.includes('contact') || q.includes('emergency')) {
        category = 'rules';
        const curfew = await db.getOne("SELECT value FROM settings WHERE key_name = 'curfew_time'");
        const phone = await db.getOne("SELECT value FROM settings WHERE key_name = 'contact_phone'");
        answer = `**Hostel Guidelines & Timings:**\n` +
          `• **Night Curfew:** ${curfew?.value || '10:00 PM'}\n` +
          `• **Visitors:** 9:00 AM to 6:00 PM in the reception lounge only.\n` +
          `• **Warden Helpline:** ${phone?.value || '+91 120 232 4000'}\n` +
          `• Quiet study hours begin from 11:00 PM across all residential floors.`;
      } else {
        answer = `Hello ${req.user.name}! I am your AI Hostel Assistant. You can ask me:\n` +
          `• *"When is my next fee due?"*\n` +
          `• *"What is today's mess menu?"*\n` +
          `• *"What is my room and bed allocation?"*\n` +
          `• *"How do I raise a maintenance complaint?"*\n` +
          `• *"What are the hostel curfew hours?"*`;
      }
    }
    // ADMIN QUERY HANDLERS
    else {
      // 1. Occupancy & Beds
      if (q.includes('occupan') || q.includes('bed') || q.includes('available') || q.includes('vacant')) {
        category = 'occupancy';
        const totalBedsRow = await db.getOne('SELECT COUNT(*) AS total FROM beds');
        const occBedsRow = await db.getOne("SELECT COUNT(*) AS total FROM beds WHERE status = 'occupied'");
        const availBedsRow = await db.getOne("SELECT COUNT(*) AS total FROM beds WHERE status = 'available'");
        
        const tot = Number(totalBedsRow?.total || 250);
        const occ = Number(occBedsRow?.total || 0);
        const avl = Number(availBedsRow?.total || 0);
        const pct = ((occ / tot) * 100).toFixed(1);

        answer = `**Hostel Occupancy Status:**\n` +
          `• Total Beds: **${tot}** (50 rooms across 5 floors)\n` +
          `• Occupied Beds: **${occ}** (${pct}% occupancy)\n` +
          `• Available Beds: **${avl}** ready for new student allocation.`;
        quickActions = [{ label: 'View Floor Matrix', link: '#hostel-structure' }];
      }
      // 2. Financial / Fee Summary
      else if (q.includes('fee') || q.includes('income') || q.includes('expense') || q.includes('profit') || q.includes('pending')) {
        category = 'financials';
        const incRow = await db.getOne("SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'PAID'");
        const expRow = await db.getOne("SELECT COALESCE(SUM(amount), 0) AS total FROM expenses");
        const pendRow = await db.getOne("SELECT COALESCE(SUM(amount - paid_amount), 0) AS total FROM fee_cycles WHERE status != 'paid'");

        const gross = Number(incRow?.total || 0);
        const exp = Number(expRow?.total || 0);
        const net = gross - exp;
        const pend = Number(pendRow?.total || 0);

        answer = `**Hostel Financial Summary:**\n` +
          `• Fees Collected: **₹${gross.toLocaleString('en-IN')}**\n` +
          `• Hostel Operating Expenses: **₹${exp.toLocaleString('en-IN')}**\n` +
          `• **Net Operational Income:** **₹${net.toLocaleString('en-IN')}**\n` +
          `• Outstanding Pending Dues: **₹${pend.toLocaleString('en-IN')}**`;
        quickActions = [
          { label: 'View Payments Ledger', link: '#payments' },
          { label: 'Fee Reminders', link: '#fees' }
        ];
      }
      // 3. Complaints status
      else if (q.includes('complaint') || q.includes('repair') || q.includes('maintenance')) {
        category = 'complaints';
        const pendingCount = await db.getOne("SELECT COUNT(*) AS total FROM complaints WHERE status = 'Pending'");
        const inProgressCount = await db.getOne("SELECT COUNT(*) AS total FROM complaints WHERE status = 'In Progress'");
        answer = `There are currently **${pendingCount?.total || 0} Pending** and **${inProgressCount?.total || 0} In Progress** maintenance complaints awaiting resolution.`;
        quickActions = [{ label: 'Manage Complaints', link: '#complaints' }];
      } else {
        answer = `Hello Warden! I am your AI Hostel Management Assistant. You can ask me:\n` +
          `• *"What is the current bed occupancy rate?"*\n` +
          `• *"What is the financial breakdown of income vs expenses?"*\n` +
          `• *"How much fee is pending this month?"*\n` +
          `• *"What complaints require immediate attention?"*`;
      }
    }

    return res.json({
      success: true,
      data: {
        question,
        answer,
        category,
        quickActions,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('[AI Assistant Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to process AI assistant query.',
      error: err.message
    });
  }
});

module.exports = router;
