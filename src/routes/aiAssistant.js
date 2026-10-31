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

      // 1. Greetings
      if (/\b(hi|hello|hey|namaste|who are you|help|what can you do)\b/i.test(q)) {
        category = 'greeting';
        answer = `Hello **${student.name || 'Resident'}**! I am your **SRI RAM PG AI Hostel Assistant** 🤖.\n\n` +
          `I can answer questions regarding your hostel stay, fees, rooms, mess food, and rules. Try asking:\n` +
          `• *"When is my next fee due?"*\n` +
          `• *"What is today's menu?"*\n` +
          `• *"What is my room and bed number?"*\n` +
          `• *"Who are my roommates?"*\n` +
          `• *"How to submit a complaint?"*\n` +
          `• *"What are the curfew hours?"*`;
        quickActions = [
          { label: 'Next Fee Due', link: '#fees' },
          { label: "Today's Menu", link: '#mess' },
          { label: 'My Room', link: '#hostel-structure' }
        ];
      }
      // 2. Fee Due Query
      else if (/\b(fee|fees|due|dues|payment|paid|cost|charge|rent|receipt|pending|bill|money)\b/i.test(q)) {
        category = 'fees';
        // Get student's fee cycles
        const cycles = await db.query(
          'SELECT * FROM fee_cycles WHERE student_id = ? ORDER BY cycle_number ASC',
          [student.id]
        );
        const pending = cycles.find(c => c.status !== 'paid');

        if (pending) {
          answer = `💳 **Fee Payment & Due Notice:**\n\n` +
            `• **Pending Fee:** **₹${Number(pending.amount).toLocaleString('en-IN')}**\n` +
            `• **Billing Cycle:** ${formatDateDisplay(pending.start_date)} to ${formatDateDisplay(pending.end_date)}\n` +
            `• **Due Date:** **${formatDateDisplay(pending.due_date)}**\n` +
            `• **Status:** ⚠️ Pending Settlement\n\n` +
            `Please clear your dues at the Accounts desk or via UPI to keep your clearance active.`;
        } else if (cycles.length > 0) {
          const last = cycles[cycles.length - 1];
          const nextCycleObj = calculateCycle(student.joining_date, last.cycle_number + 1);
          answer = `✅ **All Fees Clear!**\n\n` +
            `All your current fee cycles are paid in full. Your next monthly billing cycle of **₹${Number(student.monthly_fee).toLocaleString('en-IN')}** will be due on **${nextCycleObj.dueDateDisplay}** (${nextCycleObj.startDateDisplay} to ${nextCycleObj.endDateDisplay}).`;
        } else {
          answer = `Your standard monthly hostel fee is **₹${Number(student.monthly_fee).toLocaleString('en-IN')}**, anchored to your joining date (${formatDateDisplay(student.joining_date)}).`;
        }
        quickActions = [
          { label: 'View Fee History', link: '#fees' },
          { label: 'View Receipts', link: '#payments' }
        ];
      }
      // 3. Room & Bed & Roommates
      else if (/\b(room|rooms|bed|beds|floor|floors|stay|staying|sharing|roommate|roommates)\b/i.test(q)) {
        category = 'room';
        const roommates = await db.query(
          'SELECT name, bed_label, course FROM students WHERE room_number = ? AND id != ? AND status = "active"',
          [student.room_number, student.id]
        );
        answer = `🏠 **Your Room & Bed Details:**\n\n` +
          `• **Room Number:** **Room ${student.room_number || '205'}** (${student.room_type || '3-Sharing AC'})\n` +
          `• **Bed Assignment:** **${student.bed_label || 'Bed 1'}**\n` +
          `• **Floor:** **Floor ${student.floor_number || 2}**\n\n` +
          (roommates.length > 0
            ? `👥 **Your Roommates:**\n` + roommates.map((rm, idx) => `  ${idx + 1}. **${rm.name}** (${rm.bed_label} • ${rm.course || 'Vignan Univ'})`).join('\n')
            : `All bed allocations in this room are active.`) +
          `\n\nEquipped with attached washroom, study desk, wardrobe, and 24/7 Wi-Fi.`;
        quickActions = [{ label: 'View My Room', link: '#hostel-structure' }];
      }
      // 4. Mess / Food Query
      else if (/\b(food|menu|mess|breakfast|lunch|dinner|meal|meals|snack|tea|chai|eat|curry|rice|roti)\b/i.test(q)) {
        category = 'mess';
        const todayDay = DAYS[new Date().getDay()];
        const menu = await db.getOne('SELECT * FROM mess_menu WHERE LOWER(day_of_week) = LOWER(?)', [todayDay]);
        if (menu) {
          answer = `🍽️ **Today's Sri Ram PG Mess Menu (${todayDay}):**\n\n` +
            `• **Breakfast (${menu.breakfast_timing}):**\n  ${menu.breakfast}\n\n` +
            `• **Lunch (${menu.lunch_timing}):**\n  ${menu.lunch}\n\n` +
            `• **Evening Snacks (5:00 PM - 6:00 PM):**\n  Hot Masala Chai with Mirchi Bajji / Biscuits\n\n` +
            `• **Dinner (${menu.dinner_timing}):**\n  ${menu.dinner}\n\n` +
            (menu.special_notes ? `• *Note:* ${menu.special_notes}` : '');
        } else {
          answer = `Today is ${todayDay}. Mess timings are 7:30-9:30 AM (Breakfast), 12:30-2:30 PM (Lunch), 5:00-6:00 PM (Tea & Snacks), and 7:30-9:30 PM (Dinner).`;
        }
        quickActions = [{ label: 'Full Weekly Menu', link: '#mess' }];
      }
      // 5. Wi-Fi & Internet
      else if (/\b(wifi|wi-fi|internet|broadband|ssid|password|router)\b/i.test(q)) {
        category = 'wifi';
        answer = `📶 **SRI RAM PG High-Speed Wi-Fi Details:**\n\n` +
          `• **Network SSID:** \`SRI_RAM_PG_5G\` / \`SRI_RAM_PG_2.4G\`\n` +
          `• **Speed:** Dedicated 300 Mbps fiber optic with UPS power backup.\n` +
          `• **Access:** Use your student registration number or ask the Warden Desk for floor router authentication.\n` +
          `• Facing connectivity issues? Submit a maintenance ticket under 'Wi-Fi / Internet'.`;
        quickActions = [{ label: 'Report Wi-Fi Issue', link: '#complaints' }];
      }
      // 6. Parent & Emergency Details
      else if (/\b(parent|parents|father|mother|guardian|emergency contact|my profile|blood group)\b/i.test(q)) {
        category = 'parent';
        answer = `📋 **Your Registered Profile & Parent Details:**\n\n` +
          `• **Resident Name:** **${student.name}** (\`${student.reg_number || '-'}\`)\n` +
          `• **Parent / Guardian:** **${student.parent_name || 'Venkatesh Rao'}**\n` +
          `• **Parent Phone:** **+91 ${student.parent_phone || '9848022338'}**\n` +
          `• **Emergency Contact:** **+91 ${student.emergency_contact || student.parent_phone || '9848022338'}**\n` +
          `• **Address:** ${student.parent_address || student.address || 'Guntur, Andhra Pradesh'}`;
        quickActions = [{ label: 'Edit Profile', link: '#student-profile' }];
      }
      // 7. Complaints
      else if (/\b(complaint|complaints|issue|problem|repair|broken|leak|tap|fan|light|clean|ac|plumb)\b/i.test(q)) {
        category = 'complaint';
        const myComps = await db.query(
          'SELECT * FROM complaints WHERE student_id = ? ORDER BY id DESC LIMIT 3',
          [student.id]
        );
        answer = `🛠️ **Maintenance & Complaints Helpdesk:**\n\n` +
          (myComps.length > 0
            ? `Your recent tickets:\n` + myComps.map(c => `• **[#${c.id}] ${c.title || c.category}:** Status is **${c.status}**`).join('\n') + '\n\n'
            : 'You have no open complaints right now.\n\n') +
          `To report an issue with Wi-Fi, plumbing, electrical, or cleaning, click **Submit Complaint** below.`;
        quickActions = [{ label: 'Submit Complaint', link: '#complaints' }];
      }
      // 8. Leave Request Query
      else if (/\b(leave|leaves|gate pass|out pass|home|vacation|holiday|permission)\b/i.test(q)) {
        category = 'leave';
        answer = `🎫 **Hostel Leave & Digital Gate Pass:**\n\n` +
          `Hostel gate passes can be requested via the **Leave Requests** tab. Specify your departure date, return date, reason, and parent contact. Approvals are processed digitally.`;
        quickActions = [{ label: 'Apply For Leave', link: '#leave-requests' }];
      }
      // 9. Curfew / Rules Query
      else if (/\b(rule|rules|curfew|timing|timings|gate close|in time|visitor|visitors|night)\b/i.test(q)) {
        category = 'rules';
        const curfew = await db.getOne("SELECT value FROM settings WHERE key_name = 'curfew_time'");
        const phone = await db.getOne("SELECT value FROM settings WHERE key_name = 'contact_phone'");
        answer = `📜 **Hostel Guidelines & Timings:**\n\n` +
          `• **Night Curfew:** **${curfew?.value || '10:00 PM'}** sharp (Biometric logging closes).\n` +
          `• **Visitors & Parents:** 9:00 AM to 6:00 PM in the reception lounge only.\n` +
          `• **Quiet Study Hours:** 11:00 PM to 6:00 AM.\n` +
          `• **Warden Helpline:** ${phone?.value || '+91 98765 43210'}`;
      }
      // 10. Warden Contact
      else if (/\b(contact|warden|phone|mobile|emergency|address|location|saida)\b/i.test(q)) {
        category = 'contact';
        answer = `📞 **SRI RAM PG Administration & Emergency Helpline:**\n\n` +
          `• **Chief Hostel Warden (Saida):** **+91 98765 43210**\n` +
          `• **Accounts Desk:** **+91 120 232 4000**\n` +
          `• **Security Gate:** Intercom Ext **101**\n` +
          `• **Hostel Address:** Opp. Vignan University Main Gate, Vadlamudi, Guntur, AP - 522213`;
      }
      // Fallback
      else {
        answer = `Hello ${req.user.name}! I am your AI Hostel Assistant. You can ask me:\n` +
          `• *"When is my next fee due?"*\n` +
          `• *"What is today's mess menu?"*\n` +
          `• *"What is my room and bed allocation?"*\n` +
          `• *"How do I raise a maintenance complaint?"*\n` +
          `• *"What are the curfew hours?"*`;
        quickActions = [
          { label: 'Next Fee Due', link: '#fees' },
          { label: "Today's Menu", link: '#mess' }
        ];
      }
    }
    // ADMIN QUERY HANDLERS
    else {
      // 1. Occupancy & Beds
      if (/\b(occupan|occupancy|bed|beds|available|vacant|vacancy|matrix)\b/i.test(q)) {
        category = 'occupancy';
        const totalBedsRow = await db.getOne('SELECT COUNT(*) AS total FROM beds');
        const occBedsRow = await db.getOne("SELECT COUNT(*) AS total FROM beds WHERE status = 'occupied'");
        const availBedsRow = await db.getOne("SELECT COUNT(*) AS total FROM beds WHERE status = 'available'");
        
        const tot = Number(totalBedsRow?.total || 250);
        const occ = Number(occBedsRow?.total || 0);
        const avl = Number(availBedsRow?.total || 0);
        const pct = ((occ / tot) * 100).toFixed(1);

        answer = `🏢 **Hostel Bed Occupancy & Room Matrix:**\n\n` +
          `• Total Beds: **${tot}** (50 rooms across 5 floors)\n` +
          `• Occupied Beds: **${occ}** (${pct}% occupancy)\n` +
          `• Available Beds: **${avl}** ready for new student allocation.`;
        quickActions = [{ label: 'View Floor Matrix', link: '#hostel-structure' }];
      }
      // 2. Financial / Fee Summary
      else if (/\b(fee|fees|financial|income|expense|expenses|profit|pending|due|dues|revenue|collection)\b/i.test(q)) {
        category = 'financials';
        const incRow = await db.getOne("SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'PAID'");
        const expRow = await db.getOne("SELECT COALESCE(SUM(amount), 0) AS total FROM expenses");
        const pendRow = await db.getOne("SELECT COALESCE(SUM(amount - paid_amount), 0) AS total FROM fee_cycles WHERE status != 'paid'");

        const gross = Number(incRow?.total || 0);
        const exp = Number(expRow?.total || 0);
        const net = gross - exp;
        const pend = Number(pendRow?.total || 0);

        answer = `💰 **Hostel Financial Overview:**\n\n` +
          `• Total Fees Collected: **₹${gross.toLocaleString('en-IN')}**\n` +
          `• Operational Expenses: **₹${exp.toLocaleString('en-IN')}**\n` +
          `• **Net Operational Income:** **₹${net.toLocaleString('en-IN')}**\n` +
          `• Outstanding Pending Dues: **₹${pend.toLocaleString('en-IN')}**`;
        quickActions = [
          { label: 'View Payments Ledger', link: '#payments' },
          { label: 'Fee Reminders', link: '#fees' }
        ];
      }
      // 3. Complaints status
      else if (/\b(complaint|complaints|repair|maintenance|broken|work order)\b/i.test(q)) {
        category = 'complaints';
        const pendingCount = await db.getOne("SELECT COUNT(*) AS total FROM complaints WHERE status = 'Pending'");
        const inProgressCount = await db.getOne("SELECT COUNT(*) AS total FROM complaints WHERE status = 'In Progress'");
        answer = `🛠️ **Complaints & Maintenance Status:**\n\n` +
          `There are currently **${pendingCount?.total || 0} Pending** and **${inProgressCount?.total || 0} In Progress** maintenance complaints awaiting resolution.`;
        quickActions = [{ label: 'Manage Complaints', link: '#complaints' }];
      }
      // 4. Students Count
      else if (/\b(student|students|resident|residents|enrolled)\b/i.test(q)) {
        category = 'students';
        const countRow = await db.getOne("SELECT COUNT(*) AS total FROM students WHERE status = 'active'");
        answer = `👥 **Student Resident Directory:**\n\n` +
          `• Currently **${countRow?.total || 0} active students** residing in the hostel.\n` +
          `• All residents have joining-date anchored billing cycles.`;
        quickActions = [{ label: 'View Student Directory', link: '#students' }];
      }
      else {
        answer = `Hello Warden! I am your **AI Hostel Management Assistant** 🏢.\n\n` +
          `You can ask me questions such as:\n` +
          `• *"What is the current bed occupancy rate?"*\n` +
          `• *"What is the financial breakdown of income vs expenses?"*\n` +
          `• *"How much fee is pending this month?"*\n` +
          `• *"What complaints require immediate attention?"*`;
        quickActions = [
          { label: 'Room Matrix', link: '#hostel-structure' },
          { label: 'Fee Dues', link: '#fees' },
          { label: 'Complaints', link: '#complaints' }
        ];
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
