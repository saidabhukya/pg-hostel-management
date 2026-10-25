/**
 * Mock Data Store for Static Hosting (GitHub Pages Demo Mode)
 * Provides realistic demo records for Admin & Student portals when no Node backend is running.
 */
(function() {
  // Generate 5 floors with 10 rooms each
  const structure = [];
  for (let f = 1; f <= 5; f++) {
    const rooms = [];
    let floorOccupied = 0;
    for (let r = 1; r <= 10; r++) {
      const roomNum = `${f}${String(r).padStart(2, '0')}`;
      // Random but consistent occupancy
      const occupied = (f === 1 && r <= 8) || (f === 2 && r <= 9) || (f === 3 && r <= 7) || (f === 4 && r <= 6) || (f === 5 && r <= 4) ? 5 : 3;
      const avail = 5 - occupied;
      floorOccupied += occupied;
      rooms.push({
        room_number: roomNum,
        capacity: 5,
        occupied_beds: occupied,
        available_beds: avail,
        maintenance_beds: 0
      });
    }
    structure.push({
      floor_number: f,
      name: `Floor ${f}`,
      stats: {
        totalBeds: 50,
        occupiedBeds: floorOccupied,
        availableBeds: 50 - floorOccupied
      },
      rooms: rooms
    });
  }

  const MockData = {
    adminUser: {
      id: 1,
      username: 'admin',
      email: 'admin@hostel.com',
      role: 'admin',
      name: 'Hostel Chief Warden',
      phone: '+91 98111 22334',
      avatar: './assets/images/default-avatar.png'
    },

    studentUser: {
      id: 2,
      username: '2024IT123',
      email: 'ravi.kumar@college.edu',
      role: 'student',
      name: 'Ravi Kumar',
      phone: '+91 98765 43210',
      avatar: './assets/images/default-student.png'
    },

    studentProfile: {
      id: 1,
      user_id: 2,
      reg_number: '2024IT123',
      name: 'Ravi Kumar',
      email: 'ravi.kumar@college.edu',
      phone: '+91 98765 43210',
      college: 'National Institute of Technology',
      course: 'B.Tech Information Technology',
      joining_date: '2024-07-01',
      monthly_fee: 7000,
      status: 'active',
      room_number: '201',
      floor_number: 2,
      bed_label: 'Bed-A',
      due_date: '2026-10-31',
      pending_amount: 0
    },

    stats: {
      totalStudents: 184,
      totalBeds: 250,
      occupiedBeds: 184,
      availableBeds: 66,
      maintenanceBeds: 0,
      occupancyRate: '73.6',
      feesCollected: 1288000,
      pendingFees: 112000,
      hostelExpenses: 345000,
      netIncome: 943000,
      pendingComplaints: 3,
      activeVisitors: 4
    },

    charts: {
      floorOccupancy: [
        { floor_number: 1, floor_name: 'Floor 1', total_beds: 50, occupied_beds: 42, available_beds: 8 },
        { floor_number: 2, floor_name: 'Floor 2', total_beds: 50, occupied_beds: 48, available_beds: 2 },
        { floor_number: 3, floor_name: 'Floor 3', total_beds: 50, occupied_beds: 38, available_beds: 12 },
        { floor_number: 4, floor_name: 'Floor 4', total_beds: 50, occupied_beds: 32, available_beds: 18 },
        { floor_number: 5, floor_name: 'Floor 5', total_beds: 50, occupied_beds: 24, available_beds: 26 }
      ],
      monthlyIncome: [
        { month_year: '2026-05', total_income: 1120000 },
        { month_year: '2026-06', total_income: 1190000 },
        { month_year: '2026-07', total_income: 1260000 },
        { month_year: '2026-08', total_income: 1240000 },
        { month_year: '2026-09', total_income: 1275000 },
        { month_year: '2026-10', total_income: 1288000 }
      ],
      monthlyExpenses: [
        { month_year: '2026-05', total_expense: 310000 },
        { month_year: '2026-06', total_expense: 325000 },
        { month_year: '2026-07', total_expense: 340000 },
        { month_year: '2026-08', total_expense: 330000 },
        { month_year: '2026-09', total_expense: 350000 },
        { month_year: '2026-10', total_expense: 345000 }
      ],
      categoryExpenses: [
        { category: 'Mess / Catering', total_amount: 180000, count: 12 },
        { category: 'Electricity & Water', total_amount: 65000, count: 4 },
        { category: 'Maintenance & Repairs', total_amount: 45000, count: 8 },
        { category: 'Housekeeping & Staff', total_amount: 35000, count: 5 },
        { category: 'High-speed Internet', total_amount: 20000, count: 2 }
      ],
      recentPayments: [
        { id: 101, student_name: 'Ravi Kumar', reg_number: '2024IT123', room_number: '201', bed_label: 'Bed-A', amount: 7000, payment_method: 'UPI', payment_date: '2026-10-22', status: 'PAID' },
        { id: 102, student_name: 'Aarav Sharma', reg_number: '2024CS045', room_number: '102', bed_label: 'Bed-B', amount: 7000, payment_method: 'Online NetBanking', payment_date: '2026-10-21', status: 'PAID' },
        { id: 103, student_name: 'Priya Verma', reg_number: '2024EC012', room_number: '304', bed_label: 'Bed-C', amount: 7000, payment_method: 'UPI', payment_date: '2026-10-20', status: 'PAID' },
        { id: 104, student_name: 'Aditi Patel', reg_number: '2024ME088', room_number: '205', bed_label: 'Bed-A', amount: 7000, payment_method: 'Credit Card', payment_date: '2026-10-19', status: 'PAID' },
        { id: 105, student_name: 'Nikhil Reddy', reg_number: '2024CS099', room_number: '401', bed_label: 'Bed-E', amount: 7000, payment_method: 'Cash at Desk', payment_date: '2026-10-18', status: 'PAID' }
      ],
      recentComplaints: [
        { id: 201, title: 'AC Filter cleaning in Room 201', category: 'Electrical', student_name: 'Ravi Kumar', room_number: '201', priority: 'Medium', status: 'In Progress', created_at: '2026-10-24 10:15:00' },
        { id: 202, title: 'Bathroom tap leaking in 3rd floor washroom', category: 'Plumbing', student_name: 'Priya Verma', room_number: '304', priority: 'High', status: 'Pending', created_at: '2026-10-23 18:30:00' },
        { id: 203, title: 'WiFi coverage drop in 5th floor corridor', category: 'Internet', student_name: 'Manish Singh', room_number: '502', priority: 'Low', status: 'Resolved', created_at: '2026-10-22 14:00:00' }
      ]
    },

    students: [
      { id: 1, reg_number: '2024IT123', name: 'Ravi Kumar', email: 'ravi.kumar@college.edu', phone: '+91 98765 43210', college: 'National Institute of Technology', course: 'B.Tech IT', joining_date: '2024-07-01', monthly_fee: 7000, room_number: '201', floor_number: 2, bed_label: 'Bed-A', fee_status: 'paid', status: 'active' },
      { id: 2, reg_number: '2024CS045', name: 'Aarav Sharma', email: 'aarav.sharma@college.edu', phone: '+91 98222 11001', college: 'Delhi Technological University', course: 'B.Tech CSE', joining_date: '2024-07-05', monthly_fee: 7000, room_number: '102', floor_number: 1, bed_label: 'Bed-B', fee_status: 'paid', status: 'active' },
      { id: 3, reg_number: '2024EC012', name: 'Priya Verma', email: 'priya.verma@college.edu', phone: '+91 98333 44556', college: 'Vellore Institute of Technology', course: 'B.Tech ECE', joining_date: '2024-08-01', monthly_fee: 7000, room_number: '304', floor_number: 3, bed_label: 'Bed-C', fee_status: 'pending', status: 'active' },
      { id: 4, reg_number: '2024ME088', name: 'Aditi Patel', email: 'aditi.patel@college.edu', phone: '+91 98444 77889', college: 'Birla Institute of Technology', course: 'B.Tech ME', joining_date: '2024-08-10', monthly_fee: 7000, room_number: '205', floor_number: 2, bed_label: 'Bed-A', fee_status: 'paid', status: 'active' },
      { id: 5, reg_number: '2024CS099', name: 'Nikhil Reddy', email: 'nikhil.reddy@college.edu', phone: '+91 98555 99001', college: 'IIIT Hyderabad', course: 'B.Tech CSE', joining_date: '2024-07-15', monthly_fee: 7000, room_number: '401', floor_number: 4, bed_label: 'Bed-E', fee_status: 'pending', status: 'active' }
    ],

    structure: structure,

    feeCycles: [
      { id: 1, student_id: 1, student_name: 'Ravi Kumar', reg_number: '2024IT123', room_number: '201', bed_label: 'Bed-A', cycle_number: 4, start_date: '2026-10-01', end_date: '2026-10-31', due_date: '2026-10-05', amount: 7000, paid_amount: 7000, status: 'paid' },
      { id: 2, student_id: 2, student_name: 'Aarav Sharma', reg_number: '2024CS045', room_number: '102', bed_label: 'Bed-B', cycle_number: 4, start_date: '2026-10-05', end_date: '2026-11-04', due_date: '2026-10-10', amount: 7000, paid_amount: 7000, status: 'paid' },
      { id: 3, student_id: 3, student_name: 'Priya Verma', reg_number: '2024EC012', room_number: '304', bed_label: 'Bed-C', cycle_number: 3, start_date: '2026-10-01', end_date: '2026-10-31', due_date: '2026-10-05', amount: 7000, paid_amount: 0, status: 'overdue' },
      { id: 4, student_id: 4, student_name: 'Aditi Patel', reg_number: '2024ME088', room_number: '205', bed_label: 'Bed-A', cycle_number: 3, start_date: '2026-10-10', end_date: '2026-11-09', due_date: '2026-10-15', amount: 7000, paid_amount: 7000, status: 'paid' },
      { id: 5, student_id: 5, student_name: 'Nikhil Reddy', reg_number: '2024CS099', room_number: '401', bed_label: 'Bed-E', cycle_number: 3, start_date: '2026-10-15', end_date: '2026-11-14', due_date: '2026-10-20', amount: 7000, paid_amount: 0, status: 'pending' }
    ],

    payments: [
      { id: 101, student_id: 1, student_name: 'Ravi Kumar', reg_number: '2024IT123', room_number: '201', bed_label: 'Bed-A', amount: 7000, payment_method: 'UPI', transaction_id: 'UPI9837264819', payment_date: '2026-10-22 14:32:00', status: 'PAID' },
      { id: 102, student_id: 2, student_name: 'Aarav Sharma', reg_number: '2024CS045', room_number: '102', bed_label: 'Bed-B', amount: 7000, payment_method: 'Online NetBanking', transaction_id: 'TXN82746192', payment_date: '2026-10-21 11:15:00', status: 'PAID' },
      { id: 103, student_id: 3, student_name: 'Priya Verma', reg_number: '2024EC012', room_number: '304', bed_label: 'Bed-C', amount: 7000, payment_method: 'UPI', transaction_id: 'UPI192837465', payment_date: '2026-09-05 16:45:00', status: 'PAID' },
      { id: 104, student_id: 4, student_name: 'Aditi Patel', reg_number: '2024ME088', room_number: '205', bed_label: 'Bed-A', amount: 7000, payment_method: 'Credit Card', transaction_id: 'CC91827364', payment_date: '2026-10-19 09:20:00', status: 'PAID' }
    ],

    messMenu: [
      { id: 1, day: 'Monday', breakfast: 'Idli, Sambar, Coconut Chutney, Tea/Coffee', lunch: 'Rice, Dal Tadka, Paneer Butter Masala, Roti, Salad', snacks: 'Samosa, Masala Chai', dinner: 'Jeera Rice, Mixed Veg Curry, Phulka, Gulab Jamun' },
      { id: 2, day: 'Tuesday', breakfast: 'Aloo Paratha, Curd, Pickle, Tea/Coffee', lunch: 'Rice, Rajma Masala, Aloo Gobi, Roti, Curd', snacks: 'Veg Cutlet, Tea/Coffee', dinner: 'Veg Pulao, Dal Fry, Roti, Kheer' },
      { id: 3, day: 'Wednesday', breakfast: 'Poha, Sev, Boiled Eggs / Banana, Tea/Coffee', lunch: 'Rice, Sambar, Bhindi Masala, Roti, Curd', snacks: 'Bhel Puri, Green Tea', dinner: 'Egg Curry / Paneer Do Pyaza, Steamed Rice, Chapati' },
      { id: 4, day: 'Thursday', breakfast: 'Masala Dosa, Chutney, Sambar, Coffee', lunch: 'Rice, Chole Bhature / Roti, Boondi Raita', snacks: 'Biscuit / Cookies, Masala Chai', dinner: 'Veg Biryani, Mirchi Ka Salan, Raita, Ice Cream' },
      { id: 5, day: 'Friday', breakfast: 'Upma, Vada, Chutney, Tea/Coffee', lunch: 'Rice, Dal Makhani, Mixed Vegetable, Roti, Curd', snacks: 'Pakora, Mint Chutney, Chai', dinner: 'Fried Rice, Veg Manchurian, Spring Rolls' },
      { id: 6, day: 'Saturday', breakfast: 'Puri Bhaji, Halwa, Tea/Coffee', lunch: 'Lemon Rice, Dal Palak, Curd Rice, Papad', snacks: 'French Fries, Lemonade', dinner: 'Paneer Biryani, Veg Kurma, Parotta, Rasgulla' },
      { id: 7, day: 'Sunday', breakfast: 'Chole Kulche / Bread Omelette, Fresh Juice', lunch: 'Special Sunday Feast: Paneer Tikka, Dum Aloo, Butter Naan', snacks: 'Cake Slice, Tea/Coffee', dinner: 'Khichdi, Kadhi, Papad, Achar, Fruit Custard' }
    ],

    complaints: [
      { id: 201, title: 'AC Filter cleaning in Room 201', category: 'Electrical', student_name: 'Ravi Kumar', room_number: '201', priority: 'Medium', status: 'In Progress', created_at: '2026-10-24 10:15:00', description: 'Cooling airflow is low, filter seems dusty.' },
      { id: 202, title: 'Bathroom tap leaking in 3rd floor washroom', category: 'Plumbing', student_name: 'Priya Verma', room_number: '304', priority: 'High', status: 'Pending', created_at: '2026-10-23 18:30:00', description: 'Constant dripping water from the washbasin faucet.' },
      { id: 203, title: 'WiFi coverage drop in 5th floor corridor', category: 'Internet', student_name: 'Manish Singh', room_number: '502', priority: 'Low', status: 'Resolved', created_at: '2026-10-22 14:00:00', description: 'Access point rebooted and signal restored.' }
    ],

    expenses: [
      { id: 301, category: 'Mess / Catering', title: 'Monthly Grocery & Milk Supplies', amount: 180000, expense_date: '2026-10-15', payment_mode: 'Bank Transfer' },
      { id: 302, category: 'Electricity & Water', title: 'State Power Board Commercial Bill', amount: 65000, expense_date: '2026-10-10', payment_mode: 'Online' },
      { id: 303, category: 'Maintenance & Repairs', title: 'Lift servicing and RO plant filters replacement', amount: 45000, expense_date: '2026-10-08', payment_mode: 'Cheque' },
      { id: 304, category: 'Housekeeping & Staff', title: 'Sanitation supplies and staff wages', amount: 35000, expense_date: '2026-10-05', payment_mode: 'Cash' },
      { id: 305, category: 'High-speed Internet', title: 'Dedicated 500Mbps Leased Line', amount: 20000, expense_date: '2026-10-01', payment_mode: 'Online' }
    ],

    announcements: [
      { id: 1, title: 'Diwali Celebration & Special Festive Dinner', content: 'Special dinner feast will be served on Friday at 8:00 PM in the central mess hall.', date: '2026-10-24', priority: 'High' },
      { id: 2, title: 'Wi-Fi Maintenance Scheduled', content: 'Corridor access points will undergo firmware upgrades on Sunday between 2:00 AM and 4:00 AM.', date: '2026-10-20', priority: 'Normal' },
      { id: 3, title: 'Monthly Fee Due Date Reminder', content: 'Kindly clear monthly hostel dues by the 5th of each month to avoid late fee penalties.', date: '2026-10-01', priority: 'Important' }
    ],

    visitors: [
      { id: 401, student_name: 'Ravi Kumar', visitor_name: 'Suresh Kumar', relation: 'Father', purpose: 'Family Visit', in_time: '2026-10-25 11:30:00', out_time: null, status: 'in_hostel' },
      { id: 402, student_name: 'Aarav Sharma', visitor_name: 'Vikram Sharma', relation: 'Brother', purpose: 'Book Delivery', in_time: '2026-10-25 09:00:00', out_time: '2026-10-25 10:15:00', status: 'checked_out' }
    ],

    leaveRequests: [
      { id: 501, student_name: 'Ravi Kumar', reg_number: '2024IT123', room_number: '201', start_date: '2026-10-28', end_date: '2026-11-02', reason: 'Diwali Festival Vacation to Hometown', parent_phone: '+91 98765 00000', status: 'Approved' }
    ],

    settings: {
      hostel_name: 'SRI RAM PG',
      hostel_address: 'Knowledge Park III, Institutional Area, Greater Noida, UP - 201306',
      contact_phone: '+91 120 232 4000',
      contact_email: 'warden@srirampg.in',
      default_monthly_fee: '7000',
      curfew_time: '10:00 PM'
    }
  };

  window.MockData = MockData;
})();
