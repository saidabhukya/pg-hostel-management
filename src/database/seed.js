const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { createTables } = require('./init');
const { calculateCycle } = require('../utils/feeCycleCalculator');

// Indian first names and last names for realistic generation
const FIRST_NAMES = [
  'Aarav', 'Aditi', 'Akash', 'Amit', 'Ananya', 'Anil', 'Ankit', 'Archana', 'Arjun', 'Bhavna',
  'Chetan', 'Deepak', 'Divya', 'Gaurav', 'Harish', 'Ishaan', 'Kavita', 'Manish', 'Neha', 'Nikhil',
  'Pooja', 'Pranav', 'Priya', 'Rahul', 'Rajesh', 'Rakesh', 'Riya', 'Rohan', 'Sachin', 'Sameer',
  'Sandeep', 'Sanjay', 'Shalini', 'Shreya', 'Sneha', 'Suresh', 'Tarun', 'Varun', 'Vikas', 'Vishal'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Kumar', 'Singh', 'Patel', 'Reddy', 'Mishra', 'Joshi', 'Yadav',
  'Nair', 'Bose', 'Das', 'Pandey', 'Chauhan', 'Mehta', 'Shah', 'Aggarwal', 'Tripathi', 'Iyer'
];

const COLLEGES = [
  'National Institute of Technology',
  'Delhi Technological University',
  'Vellore Institute of Technology',
  'Indian Institute of Information Technology',
  'Birla Institute of Technology'
];

const COURSES = [
  'B.Tech Computer Science',
  'B.Tech Information Technology',
  'B.Tech Electronics & Comm.',
  'B.Tech Mechanical Engineering',
  'BCA / MCA'
];

async function seed() {
  console.log('[Seed] Starting database seed...');
  await createTables();

  // Clear existing data to ensure clean state
  const tables = [
    'notifications', 'leave_requests', 'complaints', 'visitors', 'payments',
    'fee_cycles', 'allocations', 'beds', 'rooms', 'floors', 'students',
    'mess_menu', 'expenses', 'announcements', 'settings', 'users'
  ];

  for (const table of tables) {
    try {
      await db.query(`DELETE FROM ${table}`);
    } catch (e) {
      // Table might not exist yet or empty
    }
  }

  console.log('[Seed] Cleared existing tables.');

  // 1. Password Hashes
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const studentPasswordHash = await bcrypt.hash('student123', 10);

  // 2. Insert Admin User
  const adminRes = await db.query(
    `INSERT INTO users (username, email, password_hash, role, name, phone, avatar)
     VALUES (?, ?, ?, 'admin', ?, ?, ?)`,
    ['admin', 'admin@hostel.com', adminPasswordHash, 'Hostel Chief Warden', '+91 98111 22334', '/assets/images/default-avatar.png']
  );
  const adminUserId = adminRes.insertId;

  // 3. Insert Floors (5 floors: 1 to 5)
  const floorIds = [];
  for (let f = 1; f <= 5; f++) {
    const floorRes = await db.query(
      `INSERT INTO floors (floor_number, name, description)
       VALUES (?, ?, ?)`,
      [f, `Floor ${f}`, `${f}th Floor - Student Residential Wing`]
    );
    floorIds[f] = floorRes.insertId;
  }
  console.log('[Seed] Seeded 5 floors.');

  // 4. Insert Rooms (10 rooms per floor => 50 rooms)
  // e.g. Floor 1: 101 to 110, Floor 2: 201 to 210, etc.
  const roomMap = {}; // key: '205' -> { id, floorId, roomNumber }
  const allRooms = [];

  for (let f = 1; f <= 5; f++) {
    const fId = floorIds[f];
    for (let r = 1; r <= 10; r++) {
      const roomNum = `${f}${String(r).padStart(2, '0')}`; // '101', '205', etc.
      const roomRes = await db.query(
        `INSERT INTO rooms (floor_id, room_number, capacity, type, status)
         VALUES (?, ?, 5, 'Standard 5-Bed', 'active')`,
        [fId, roomNum]
      );
      const roomId = roomRes.insertId;
      roomMap[roomNum] = { id: roomId, floorId: fId, roomNumber: roomNum, floorNum: f };
      allRooms.push(roomMap[roomNum]);
    }
  }
  console.log('[Seed] Seeded 50 rooms across 5 floors.');

  // 5. Insert Beds (5 beds per room => 250 beds)
  const allBeds = [];
  for (const r of allRooms) {
    for (let b = 1; b <= 5; b++) {
      const bedRes = await db.query(
        `INSERT INTO beds (room_id, bed_number, bed_label, status)
         VALUES (?, ?, ?, 'available')`,
        [r.id, b, `Bed ${b}`]
      );
      allBeds.push({
        id: bedRes.insertId,
        roomId: r.id,
        roomNumber: r.roomNumber,
        bedNumber: b,
        bedLabel: `Bed ${b}`,
        floorNum: r.floorNum
      });
    }
  }
  console.log(`[Seed] Seeded ${allBeds.length} total beds (Target: 250).`);

  // Target: 183 Occupied beds, 67 Available beds.
  // Exactly as requested in prompt section 6 & 32!
  // In Room 205 specifically:
  // Bed 1: Occupied
  // Bed 2: Occupied
  // Bed 3: Ravi Kumar (Occupied)
  // Bed 4: Available
  // Bed 5: Available

  // Find beds for Room 205
  const beds205 = allBeds.filter(b => b.roomNumber === '205');
  const raviBed = beds205.find(b => b.bedNumber === 3);

  // 6. Create Ravi Kumar (Student)
  const raviUserRes = await db.query(
    `INSERT INTO users (username, email, password_hash, role, name, phone, avatar)
     VALUES (?, ?, ?, 'student', ?, ?, ?)`,
    ['2024IT123', 'ravi.kumar@college.edu', studentPasswordHash, 'Ravi Kumar', '+91 98765 43210', '/assets/images/default-student.png']
  );
  const raviUserId = raviUserRes.insertId;

  const raviStudentRes = await db.query(
    `INSERT INTO students (user_id, reg_number, name, email, phone, college, course, year, gender, parent_name, parent_phone, address, photo_url, joining_date, monthly_fee, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Male', ?, ?, ?, ?, '2026-09-16', 7000.00, 'active')`,
    [
      raviUserId,
      '2024IT123',
      'Ravi Kumar',
      'ravi.kumar@college.edu',
      '+91 98765 43210',
      'National Institute of Technology',
      'B.Tech Information Technology',
      '3rd Year',
      'Suresh Kumar',
      '+91 98765 11111',
      'Flat 402, Green Valley Apartments, Sector 62, Noida, UP - 201301',
      '/assets/images/default-student.png'
    ]
  );
  const raviStudentId = raviStudentRes.insertId;

  // Allocate Bed 3 in 205 to Ravi Kumar
  await db.query(
    `INSERT INTO allocations (student_id, bed_id, start_date, status, remarks)
     VALUES (?, ?, '2026-09-16', 'active', 'Allocated at admission')`,
    [raviStudentId, raviBed.id]
  );
  await db.query(`UPDATE beds SET status = 'occupied' WHERE id = ?`, [raviBed.id]);

  // Ravi's Fee Cycles:
  // Cycle 1: 16-09-2026 to 15-10-2026 -> PAID on 13-10-2026 (Receipt REC-2026-0001)
  const raviCycle1 = calculateCycle('2026-09-16', 1);
  const raviCycle2 = calculateCycle('2026-09-16', 2);

  const raviC1Res = await db.query(
    `INSERT INTO fee_cycles (student_id, cycle_number, start_date, end_date, due_date, amount, paid_amount, status, notes)
     VALUES (?, 1, ?, ?, ?, 7000.00, 7000.00, 'paid', 'First month cycle paid via UPI')`,
    [raviStudentId, raviCycle1.startDate, raviCycle1.endDate, raviCycle1.dueDate]
  );
  const raviC1Id = raviC1Res.insertId;

  // Ravi's Payment
  await db.query(
    `INSERT INTO payments (student_id, fee_cycle_id, receipt_number, amount, payment_date, cycle_start_date, cycle_end_date, payment_method, transaction_id, status, notes, created_by)
     VALUES (?, ?, 'REC-2026-0001', 7000.00, '2026-10-13', ?, ?, 'UPI', 'UPI-9843217740', 'PAID', 'Monthly fee for September-October cycle', ?)`,
    [raviStudentId, raviC1Id, raviCycle1.startDate, raviCycle1.endDate, adminUserId]
  );

  // Cycle 2: 16-10-2026 to 15-11-2026 -> PENDING (Next Due: 15-11-2026)
  await db.query(
    `INSERT INTO fee_cycles (student_id, cycle_number, start_date, end_date, due_date, amount, paid_amount, status, notes)
     VALUES (?, 2, ?, ?, ?, 7000.00, 0.00, 'pending', 'Upcoming cycle due on 15-11-2026')`,
    [raviStudentId, raviCycle2.startDate, raviCycle2.endDate, raviCycle2.dueDate]
  );

  // Allocate Bed 1 and Bed 2 in Room 205 (Occupied)
  const bed1_205 = beds205.find(b => b.bedNumber === 1);
  const bed2_205 = beds205.find(b => b.bedNumber === 2);

  // Create Amit Sharma for Bed 1
  const s1Res = await db.query(
    `INSERT INTO students (reg_number, name, email, phone, college, course, year, gender, parent_name, parent_phone, address, joining_date, monthly_fee, status)
     VALUES ('2024CS101', 'Amit Sharma', 'amit.sharma@college.edu', '+91 98765 00101', 'National Institute of Technology', 'B.Tech Computer Science', '3rd Year', 'Male', 'Raj Sharma', '+91 98765 99101', 'B-12 Vasundhara, Ghaziabad', '2026-08-10', 7000.00, 'active')`
  );
  await db.query(
    `INSERT INTO allocations (student_id, bed_id, start_date, status) VALUES (?, ?, '2026-08-10', 'active')`,
    [s1Res.insertId, bed1_205.id]
  );
  await db.query(`UPDATE beds SET status = 'occupied' WHERE id = ?`, [bed1_205.id]);

  // Create Rahul Verma for Bed 2
  const s2Res = await db.query(
    `INSERT INTO students (reg_number, name, email, phone, college, course, year, gender, parent_name, parent_phone, address, joining_date, monthly_fee, status)
     VALUES ('2024EC102', 'Rahul Verma', 'rahul.verma@college.edu', '+91 98765 00102', 'National Institute of Technology', 'B.Tech Electronics & Comm.', '3rd Year', 'Male', 'Manoj Verma', '+91 98765 99102', '45 Model Town, Delhi', '2026-09-01', 7000.00, 'active')`
  );
  await db.query(
    `INSERT INTO allocations (student_id, bed_id, start_date, status) VALUES (?, ?, '2026-09-01', 'active')`,
    [s2Res.insertId, bed2_205.id]
  );
  await db.query(`UPDATE beds SET status = 'occupied' WHERE id = ?`, [bed2_205.id]);

  // Notice: Bed 4 & Bed 5 in Room 205 remain 'available'! Exactly matches section 8!

  // Now create remaining occupied beds to reach exactly 183 occupied beds!
  // Current occupied: 3 (Ravi, Amit, Rahul).
  // Remaining to occupy: 183 - 3 = 180 beds.
  const remainingAvailableBeds = allBeds.filter(b => b.id !== raviBed.id && b.id !== bed1_205.id && b.id !== bed2_205.id && !(b.roomNumber === '205' && (b.bedNumber === 4 || b.bedNumber === 5)));

  // Target:
  // Total fees collected: ₹11,90,000 (170 students with paid ₹7,000)
  // Total pending fees: ₹91,000 (13 students with pending ₹7,000)
  // 170 paid + 13 pending = 183 total students / occupied beds!
  // 250 - 183 = 67 available beds!

  let receiptCounter = 2;
  const paymentMethods = ['UPI', 'Cash', 'Bank Transfer', 'Card'];

  // 168 more paid students (Ravi and Amit already paid => total 170)
  // And 12 more pending students (Rahul is pending => total 13)
  for (let i = 0; i < 180; i++) {
    const bed = remainingAvailableBeds[i];
    const fName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lName = LAST_NAMES[(i * 3) % LAST_NAMES.length];
    const name = `${fName} ${lName}`;
    const regNo = `2024ST${String(i + 10).padStart(3, '0')}`;
    const email = `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@hostel.edu`;
    const phone = `+91 98${String(10000000 + i * 47).slice(0, 8)}`;
    const college = COLLEGES[i % COLLEGES.length];
    const course = COURSES[i % COURSES.length];
    const year = `${(i % 4) + 1}st Year`;
    const gender = i % 3 === 0 ? 'Female' : 'Male';

    // Stagger joining dates across August, September, October 2026
    const day = (i % 25) + 1;
    const month = (i % 2 === 0) ? '09' : '08';
    const joiningDate = `2026-${month}-${String(day).padStart(2, '0')}`;

    const studentRes = await db.query(
      `INSERT INTO students (reg_number, name, email, phone, college, course, year, gender, parent_name, parent_phone, address, joining_date, monthly_fee, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 7000.00, 'active')`,
      [
        regNo, name, email, phone, college, course, year, gender,
        `${LAST_NAMES[i % LAST_NAMES.length]} Parent`,
        `+91 97${String(20000000 + i * 53).slice(0, 8)}`,
        `Sample Address ${i + 1}, City Block`,
        joiningDate
      ]
    );
    const stuId = studentRes.insertId;

    // Allocate bed
    await db.query(
      `INSERT INTO allocations (student_id, bed_id, start_date, status) VALUES (?, ?, ?, 'active')`,
      [stuId, bed.id, joiningDate]
    );
    await db.query(`UPDATE beds SET status = 'occupied' WHERE id = ?`, [bed.id]);

    const isPaidStudent = (i < 168); // 168 + 2 (Ravi & Amit) = 170 students paid => 170 * 7000 = 11,90,000!

    const cycle1 = calculateCycle(joiningDate, 1);
    if (isPaidStudent) {
      const cRes = await db.query(
        `INSERT INTO fee_cycles (student_id, cycle_number, start_date, end_date, due_date, amount, paid_amount, status)
         VALUES (?, 1, ?, ?, ?, 7000.00, 7000.00, 'paid')`,
        [stuId, cycle1.startDate, cycle1.endDate, cycle1.dueDate]
      );
      const cId = cRes.insertId;

      const method = paymentMethods[i % paymentMethods.length];
      const receiptNo = `REC-2026-${String(receiptCounter++).padStart(4, '0')}`;
      const payDay = Math.min(28, day + 2);
      const payDate = `2026-10-${String(payDay).padStart(2, '0')}`;

      await db.query(
        `INSERT INTO payments (student_id, fee_cycle_id, receipt_number, amount, payment_date, cycle_start_date, cycle_end_date, payment_method, transaction_id, status, created_by)
         VALUES (?, ?, ?, 7000.00, ?, ?, ?, ?, ?, 'PAID', ?)`,
        [stuId, cId, receiptNo, payDate, cycle1.startDate, cycle1.endDate, method, `TXN-${100000 + i}`, adminUserId]
      );
    } else {
      // 12 more pending students (+ Rahul = 13 pending students => 13 * 7000 = 91,000 pending!)
      await db.query(
        `INSERT INTO fee_cycles (student_id, cycle_number, start_date, end_date, due_date, amount, paid_amount, status)
         VALUES (?, 1, ?, ?, ?, 7000.00, 0.00, 'pending')`,
        [stuId, cycle1.startDate, cycle1.endDate, cycle1.dueDate]
      );
    }
  }

  // Amit Sharma's fee record (Paid)
  const amitC1 = calculateCycle('2026-08-10', 1);
  const amitCRes = await db.query(
    `INSERT INTO fee_cycles (student_id, cycle_number, start_date, end_date, due_date, amount, paid_amount, status)
     VALUES (?, 1, ?, ?, ?, 7000.00, 7000.00, 'paid')`,
    [s1Res.insertId, amitC1.startDate, amitC1.endDate, amitC1.dueDate]
  );
  await db.query(
    `INSERT INTO payments (student_id, fee_cycle_id, receipt_number, amount, payment_date, cycle_start_date, cycle_end_date, payment_method, transaction_id, status, created_by)
     VALUES (?, ?, 'REC-2026-0170', 7000.00, '2026-08-15', ?, ?, 'Bank Transfer', 'NEFT-882910', 'PAID', ?)`,
    [s1Res.insertId, amitCRes.insertId, amitC1.startDate, amitC1.endDate, adminUserId]
  );

  // Rahul Verma's fee record (Pending)
  const rahulC1 = calculateCycle('2026-09-01', 1);
  await db.query(
    `INSERT INTO fee_cycles (student_id, cycle_number, start_date, end_date, due_date, amount, paid_amount, status)
     VALUES (?, 1, ?, ?, ?, 7000.00, 0.00, 'pending')`,
    [s2Res.insertId, rahulC1.startDate, rahulC1.endDate, rahulC1.dueDate]
  );

  console.log('[Seed] Seeded 183 students: 170 Paid (₹11,90,000) and 13 Pending (₹91,000). Total beds: 250, Occupied: 183, Available: 67.');

  // 7. Seed Expenses (Target Total Expenses = ₹3,20,000 => Net Income = ₹8,70,000!)
  const expensesList = [
    { cat: 'Electricity', amount: 85000.00, date: '2026-10-05', desc: 'Main transformer & hostel commercial electricity bill for September' },
    { cat: 'Water', amount: 18000.00, date: '2026-10-06', desc: 'Municipal water supply & RO water plant filter maintenance' },
    { cat: 'Internet', amount: 24000.00, date: '2026-10-01', desc: 'High-speed dedicated leased line 1 Gbps fiber internet for 5 floors' },
    { cat: 'Food', amount: 95000.00, date: '2026-10-10', desc: 'Bulk pantry provisions, dairy, vegetables and cooking fuel for mess' },
    { cat: 'Cleaning', amount: 16000.00, date: '2026-10-08', desc: 'Sanitary supplies, floor disinfectants, waste disposal contractor' },
    { cat: 'Maintenance', amount: 22000.00, date: '2026-10-12', desc: 'Elevator servicing, solar water heater repairs, electrical fittings' },
    { cat: 'Salary', amount: 45000.00, date: '2026-10-01', desc: 'Hostel housekeeping staff, mess cooks, and night security guard stipend' },
    { cat: 'Repairs', amount: 15000.00, date: '2026-10-14', desc: 'Plumbing valve replacement on 2nd floor and door latch repairs' }
  ];
  // Sum = 85k + 18k + 24k + 95k + 16k + 22k + 45k + 15k = ₹3,20,000 exactly!
  // Net Income = ₹11,90,000 - ₹3,20,000 = ₹8,70,000!

  for (const exp of expensesList) {
    await db.query(
      `INSERT INTO expenses (category, amount, expense_date, description, receipt_ref)
       VALUES (?, ?, ?, ?, ?)`,
      [exp.cat, exp.amount, exp.date, exp.desc, `VOUCH-2026-${Math.floor(1000 + Math.random() * 9000)}`]
    );
  }
  console.log('[Seed] Seeded hostel expenses: ₹3,20,000 (Net Income: ₹8,70,000).');

  // 8. Seed Mess Menu (All 7 days)
  const weeklyMenu = [
    {
      day: 'Monday',
      bf: 'Idli, Sambar, Coconut Chutney, Boiled Eggs / Banana, Tea / Coffee',
      lunch: 'Steamed Basmati Rice, Dal Tadka, Paneer Butter Masala, Roti, Fresh Salad, Curd',
      dinner: 'Vegetable Pulao, Rajma Masala, Chapati, Mixed Veg Raita, Gulab Jamun',
      notes: 'Special sweet at dinner'
    },
    {
      day: 'Tuesday',
      bf: 'Aloo Paratha with Butter, Curd, Pickle, Tea / Coffee',
      lunch: 'Jeera Rice, Chana Masala, Aloo Gobi, Phulka, Boondi Raita, Papad',
      dinner: 'Kadhai Paneer / Chicken Curry (Optional), Dal Makhani, Tandoori Roti, Rice, Kheer',
      notes: 'Non-veg option available upon prior coupon'
    },
    {
      day: 'Wednesday',
      bf: 'Poha with Peanuts, Sev, Mint Chutney, Fresh Fruits, Tea / Milk',
      lunch: 'Lemon Rice, Sambar, Bhindi Fry, Curd Rice, Papad, Pickle',
      dinner: 'Egg Curry / Malai Kofta, Yellow Dal Fry, Butter Roti, Steamed Rice, Custard',
      notes: 'Fresh fruit salad counter open during lunch'
    },
    {
      day: 'Thursday',
      bf: 'Masala Dosa, Tomato Chutney, Sambar, Tea / Coffee',
      lunch: 'Plain Rice, Dal Fry, Seasonal Mixed Vegetable, Chapati, Cucumber Raita',
      dinner: 'Veg Biryani / Chicken Biryani, Mirchi Ka Salan, Onion Raita, Rasgulla',
      notes: 'Special Feast Dinner Night'
    },
    {
      day: 'Friday',
      bf: 'Upma, Coconut Chutney, Boiled Sprouts, Tea / Coffee',
      lunch: 'Peas Pulao, Paneer Do Pyaza, Dal Palak, Phulka, Curd, Salad',
      dinner: 'Aloo Jeera, Dal Tadka, Phulka, Steamed Rice, Semiya Payasam',
      notes: 'Healthy greens emphasis'
    },
    {
      day: 'Saturday',
      bf: 'Puri Bhaji (Aloo Curry), Halwa, Tea / Coffee',
      lunch: 'Fried Rice, Veg Manchurian Gravy, Hakka Noodles, Hot Garlic Dip',
      dinner: 'Matar Paneer, Dal Makhani, Missi Roti, Steamed Rice, Ice Cream',
      notes: 'Weekend special lunch'
    },
    {
      day: 'Sunday',
      bf: 'Chole Bhature with Onion Salad & Mint Chutney, Sweet Lassi / Tea',
      lunch: 'Hyderabadi Dum Biryani (Veg/Chicken), Raita, Salan, Roasted Papad',
      dinner: 'Light Khichdi / Chapati with Dal & Seasonal Sabzi, Fruit Custard',
      notes: 'Sunday brunch extended until 10:30 AM'
    }
  ];

  for (const m of weeklyMenu) {
    await db.query(
      `INSERT INTO mess_menu (day_of_week, breakfast, lunch, dinner, special_notes)
       VALUES (?, ?, ?, ?, ?)`,
      [m.day, m.bf, m.lunch, m.dinner, m.notes]
    );
  }
  console.log('[Seed] Seeded weekly mess menu for 7 days.');

  // 9. Seed Complaints
  const sampleComplaints = [
    {
      studentId: raviStudentId,
      cat: 'Wi-Fi',
      title: 'Slow Wi-Fi speed near Room 205 balcony',
      desc: 'The Wi-Fi signal drops frequently in the evening hours when studying. Please inspect the access point on 2nd floor.',
      status: 'In Progress',
      notes: 'Network team scheduled access point reboot and repeater repositioning.'
    },
    {
      studentId: s1Res.insertId,
      cat: 'Electrical',
      title: 'Ceiling fan regulator stuck at speed 2',
      desc: 'The wall regulator knob is loose and cannot increase speed.',
      status: 'Resolved',
      notes: 'Electrician replaced the modular regulator switch on 12-10-2026.'
    },
    {
      studentId: s2Res.insertId,
      cat: 'Plumbing',
      title: 'Water pressure low in 2nd floor washroom tap 3',
      desc: 'Washroom tap has very slow trickle of water.',
      status: 'Pending',
      notes: null
    },
    {
      studentId: raviStudentId,
      cat: 'Cleaning',
      title: 'Floor mopping required in corridor wing B',
      desc: 'Spilled beverage in the corridor requires deep sanitization.',
      status: 'Resolved',
      notes: 'Housekeeping completed deep floor scrubbing.'
    }
  ];

  for (const c of sampleComplaints) {
    await db.query(
      `INSERT INTO complaints (student_id, category, title, description, status, admin_notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [c.studentId, c.cat, c.title, c.desc, c.status, c.notes]
    );
  }
  console.log('[Seed] Seeded sample complaints.');

  // 10. Seed Visitors
  const sampleVisitors = [
    {
      studentId: raviStudentId,
      name: 'Suresh Kumar',
      phone: '+91 98765 11111',
      rel: 'Father',
      purpose: 'Visiting with college documents and winter clothes',
      entry: '2026-10-15 14:30:00',
      exit: '2026-10-15 17:00:00',
      status: 'checked_out'
    },
    {
      studentId: s1Res.insertId,
      name: 'Raj Sharma',
      phone: '+91 98765 99101',
      rel: 'Father',
      purpose: 'Delivering laptop charger and books',
      entry: '2026-10-16 11:00:00',
      exit: '2026-10-16 13:15:00',
      status: 'checked_out'
    },
    {
      studentId: raviStudentId,
      name: 'Vikas Kumar',
      phone: '+91 98765 22222',
      rel: 'Brother',
      purpose: 'Meeting during campus recruitment drive',
      entry: '2026-10-17 15:00:00',
      exit: null,
      status: 'in_hostel'
    }
  ];

  for (const v of sampleVisitors) {
    await db.query(
      `INSERT INTO visitors (student_id, visitor_name, phone, relation, purpose, entry_time, exit_time, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [v.studentId, v.name, v.phone, v.rel, v.purpose, v.entry, v.exit, v.status]
    );
  }
  console.log('[Seed] Seeded visitor logs.');

  // 11. Seed Announcements
  const sampleAnnouncements = [
    {
      title: 'Hostel Maintenance Schedule — Water Tank Cleaning',
      content: 'Hostel overhead water tanks will undergo periodic ultraviolet sanitization tomorrow from 10:00 AM to 1:00 PM. Please store required water in advance.',
      priority: 'High',
      date: '2026-10-16'
    },
    {
      title: 'High-Speed Wi-Fi Upgrade on Floors 1-5',
      content: 'Wi-Fi 6 access points are being configured across all 5 floors to provide 100 Mbps per room. Seamless roaming is enabled.',
      priority: 'Medium',
      date: '2026-10-14'
    },
    {
      title: 'Special Diwali Feast & Cultural Evening Announced',
      content: 'All residents are invited to the Grand Hostel Feast on Sunday evening at 7:30 PM in the central mess dining hall.',
      priority: 'Low',
      date: '2026-10-12'
    },
    {
      title: 'Reminder: Joining-Date Based Fee Payment Due Notices',
      content: 'Residents are reminded to clear their monthly room charges in accordance with their respective joining cycle dates to avoid late payment flags.',
      priority: 'Urgent',
      date: '2026-10-10'
    }
  ];

  for (const a of sampleAnnouncements) {
    await db.query(
      `INSERT INTO announcements (title, content, priority, audience, published_date, created_by)
       VALUES (?, ?, ?, 'all', ?, ?)`,
      [a.title, a.content, a.priority, a.date, adminUserId]
    );
  }
  console.log('[Seed] Seeded announcements.');

  // 12. Seed Leave Requests
  await db.query(
    `INSERT INTO leave_requests (student_id, reason, start_date, end_date, emergency_contact, status, admin_remarks)
     VALUES (?, 'Visiting home for family function and Diwali break', '2026-10-25', '2026-11-02', '+91 98765 11111', 'Approved', 'Approved by Warden. Gate pass issued.')`,
    [raviStudentId]
  );
  await db.query(
    `INSERT INTO leave_requests (student_id, reason, start_date, end_date, emergency_contact, status)
     VALUES (?, 'Attending hackathon at IIT Delhi', '2026-10-20', '2026-10-22', '+91 98765 99101', 'Pending')`,
    [s1Res.insertId]
  );

  // 13. Seed Notifications
  const sampleNotifications = [
    {
      userId: raviUserId,
      title: 'Payment Successful',
      message: 'Payment of ₹7,000 for cycle 16-09-2026 to 15-10-2026 recorded successfully. Receipt REC-2026-0001 available for download.',
      type: 'payment',
      link: '#payments'
    },
    {
      userId: raviUserId,
      title: 'Next Fee Due Notice',
      message: 'Your next billing cycle of ₹7,000 is due on 15-11-2026.',
      type: 'fee_due',
      link: '#fees'
    },
    {
      userId: raviUserId,
      title: 'Complaint Update',
      message: 'Your complaint regarding Wi-Fi signal has been set to In Progress by the warden.',
      type: 'complaint',
      link: '#complaints'
    },
    {
      userId: adminUserId,
      title: 'New Leave Request',
      message: 'Student Amit Sharma submitted a leave request for 20-10-2026 to 22-10-2026.',
      type: 'leave',
      link: '#leave-requests'
    },
    {
      userId: adminUserId,
      title: 'Fee Collection Milestone',
      message: 'Total collections reached ₹11,90,000 with 170 cycles paid this month.',
      type: 'payment',
      link: '#reports'
    }
  ];

  for (const n of sampleNotifications) {
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type, is_read, link)
       VALUES (?, ?, ?, ?, 0, ?)`,
      [n.userId, n.title, n.message, n.type, n.link]
    );
  }

  // 14. Seed Settings
  const settingsList = [
    { key: 'hostel_name', val: 'SRI RAM PG', desc: 'Hostel Name' },
    { key: 'hostel_address', val: 'Opposite Vignan University, Vadlamudi, Guntur, AP - 522213', desc: 'Hostel Official Address' },
    { key: 'contact_phone', val: '+91 98765 43210', desc: 'Helpline Phone Number' },
    { key: 'contact_email', val: 'warden@srirampg.in', desc: 'Official Email' },
    { key: 'default_monthly_fee', val: '7000', desc: 'Default Monthly Fee (₹)' },
    { key: 'curfew_time', val: '10:00 PM', desc: 'Night Curfew Time' },
    { key: 'gate_pass_rule', val: 'Parents must verify leave requests exceeding 3 days', desc: 'Gate Pass Policy' }
  ];

  for (const s of settingsList) {
    await db.query(
      `INSERT INTO settings (key_name, value, description) VALUES (?, ?, ?)`,
      [s.key, s.val, s.desc]
    );
  }

  console.log('[Seed] Database seeding completed successfully!');
}

if (require.main === module) {
  seed().then(() => {
    console.log('[Seed] All sample data loaded.');
    process.exit(0);
  }).catch(err => {
    console.error('[Seed] Error during seeding:', err);
    process.exit(1);
  });
}

module.exports = { seed };
