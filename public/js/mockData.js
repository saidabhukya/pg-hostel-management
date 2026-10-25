/**
 * Clean State Data Store for Static Hosting (GitHub Pages)
 * Single Source of Truth: All room occupancy and available beds are dynamically
 * calculated directly from `store.students`.
 * When a student is enrolled, their bed is marked occupied.
 * When a student is removed/vacated, their bed automatically and immediately becomes Available.
 */
(function() {
  const STORAGE_KEY = 'sri_ram_pg_live_store_v10';

  // Purge any older demo stores
  try {
    ['sri_ram_pg_clean_store_v1', 'sri_ram_pg_clean_store_v2', 'sri_ram_pg_clean_store_v3', 'sri_ram_pg_clean_store_v4', 'sri_ram_pg_live_store_v1'].forEach(k => {
      localStorage.removeItem(k);
    });
  } catch (e) {}

  /**
   * Official Vignan Vihar Boys Hostel 7-Day Food Routine
   * Extracted directly from official hostel dining schedule board
   */
  function getVignanMessMenu() {
    return [
      {
        id: 1,
        day: 'Monday',
        day_of_week: 'Monday',
        breakfast: 'Idly, Vada, Pongal, Chetney, Sambar, Allam Chetney, Milk, Coffee',
        lunch: 'Dal, Sweet (ChakkarPongal / Bread Halwa / Ravva Kesari), Chetney, Sambar, Boiled Egg, Onion + Tomato Curry / Omlet, Guntuvankaya / Egg Porutu, Rice, Rasam, Curd',
        snacks: 'Alu Bajji (1), Full Mirchi Bajji (1), Thapala Chakkalu (1), Rice Flour Pakodi (1), Ragijava / Pulses, Tea, Milk',
        dinner: 'Rice, Pulka, Pappu, Potato Curry, Dosakai + Tomato, Seasonal Fruits, Chetney, Rasam, Pappu Charu, (Plain Curd Rice,) Curd',
        breakfast_timing: '7:30 AM - 9:30 AM',
        lunch_timing: '12:30 PM - 2:30 PM',
        snacks_timing: '4:30 PM - 6:00 PM',
        dinner_timing: '7:30 PM - 9:30 PM',
        special_notes: 'Monday Sweet (ChakkarPongal / Halwa / Kesari) & Evening Mirchi / Alu Bajji'
      },
      {
        id: 2,
        day: 'Tuesday',
        day_of_week: 'Tuesday',
        breakfast: 'Idly, Chapathi with Pappu, Upma, Chetney, Pudina Chetney, Milk, Coffee',
        lunch: 'Dal, Pulihora / Kichadi / Pudina Rice / Tomato Rice, Chetney, Akukura Pappu, Cabbage + Tomato, Goruchikkudu, Sambar, Rice, Rasam, Curd',
        snacks: 'Noodles (2), Chakka Pakodi with Mirchi (1), Karapoosa (1), Pulses, Tea, Milk',
        dinner: 'Rice, Pulka-Gravy, Seasonal Curry, Egg Fried Rice, Veg Fried Rice, Kakarakaya Iguru, Chetney, Bendakaya Fry, Rasam, Sambar, Curd',
        breakfast_timing: '7:30 AM - 9:30 AM',
        lunch_timing: '12:30 PM - 2:30 PM',
        snacks_timing: '4:30 PM - 6:00 PM',
        dinner_timing: '7:30 PM - 9:30 PM',
        special_notes: 'Pulihora / Kichadi / Pudina Rice & Night Egg / Veg Fried Rice with Bendakaya Fry'
      },
      {
        id: 3,
        day: 'Wednesday',
        day_of_week: 'Wednesday',
        breakfast: 'Idly, Plain Dosa, Chetney, Koriyandar Chetney, Upma, Milk, Coffee',
        lunch: 'Dal, Tomato Pappu, Benda Iguru, Seasonal Curry, Chetney, Papada, Sambar, Rasam, Curd, Rice',
        snacks: 'Cream Cake (2), Dilpasand (1), Veg Puff (1), Pulses, Tea, Milk',
        dinner: 'Rice, Pulka, Biryani, Kurma, Raita, Gongura Chetney, Chicken Curry, Arati Iguru, Veg Curries + Sweet, Pappu Charu, Rasam, Curd',
        breakfast_timing: '7:30 AM - 9:30 AM',
        lunch_timing: '12:30 PM - 2:30 PM',
        snacks_timing: '4:30 PM - 6:00 PM',
        dinner_timing: '7:30 PM - 9:30 PM',
        special_notes: 'Wednesday Feast: Chicken Curry, Biryani, Gongura Chetney & Evening Dilpasand / Cake'
      },
      {
        id: 4,
        day: 'Thursday',
        day_of_week: 'Thursday',
        breakfast: 'Idly, Utappa, Upma, Chetney, Allam Chetney, Milk, Coffee',
        lunch: 'Dal, Chetney, Seasonal Curry, Seasonal Frys, Chama Pulusu, Dosakaya Pappu, Rasam, Sambar, Curd, Rice',
        snacks: 'Uggani (1), All Mixture (1), Punugulu (2), Chetney, Rajijava, Pulses, Tea, Milk',
        dinner: 'Boiled Egg, Rice, Pulka-Pappu, Cabbage Pickle, Cali Flower, Cabbage, Sambar, Rice, Seasonal Fruits, Rasam, Curd',
        breakfast_timing: '7:30 AM - 9:30 AM',
        lunch_timing: '12:30 PM - 2:30 PM',
        snacks_timing: '4:30 PM - 6:00 PM',
        dinner_timing: '7:30 PM - 9:30 PM',
        special_notes: 'Hot Punugulu & Uggani Snack with Boiled Egg & Seasonal Fruits at Dinner'
      },
      {
        id: 5,
        day: 'Friday',
        day_of_week: 'Friday',
        breakfast: 'Idly, Chapathi, Chetney, Tamota Bath, Pudina Chetney, Kurma, Milk, Coffee',
        lunch: 'Dal, Akukura Pappu, Chetney, Seasonal Curry, Iguru, Vadiyalu / Appadalu, Rasam, Sambar, Curd, Rice',
        snacks: 'Cream Bun (1), Cake (1), Biscuits (2), Tea, Pulses, Milk',
        dinner: 'Rice, Pulka-Kurma, Biryani, Chicken Fry, Chetney, Veg Curries + Sweet, Rasam, Curd',
        breakfast_timing: '7:30 AM - 9:30 AM',
        lunch_timing: '12:30 PM - 2:30 PM',
        snacks_timing: '4:30 PM - 6:00 PM',
        dinner_timing: '7:30 PM - 9:30 PM',
        special_notes: 'Friday Special Biryani & Crispy Chicken Fry Dinner with Bakery Bun/Cake'
      },
      {
        id: 6,
        day: 'Saturday',
        day_of_week: 'Saturday',
        breakfast: 'Idly, Masala Dosa, Uppma, Koriyandar Chetney, Chetney, Milk, Coffee',
        lunch: 'Dal, Fry, Dosaakaya Pappu, Dondakai Iguru, Drumstick Tamota, Oil Fry, Chetney, Rasam, Sambar, Curd, Rice',
        snacks: 'Jilebi (1), Badusha (1), Mysorepak (1), Fruit Salad (1), Pulses, Tea, Milk',
        dinner: 'Boiled Egg, Pulka / Alu Palak / Dondakaya / Bendakaya / Kakarikai, Rasam, Chetney, Fruit Curd Rice, Sambar, Curd',
        breakfast_timing: '7:30 AM - 9:30 AM',
        lunch_timing: '12:30 PM - 2:30 PM',
        snacks_timing: '4:30 PM - 6:00 PM',
        dinner_timing: '7:30 PM - 9:30 PM',
        special_notes: 'Saturday Sweets (Jilebi, Badusha, Mysorepak) & Refreshing Fruit Salad'
      },
      {
        id: 7,
        day: 'Sunday',
        day_of_week: 'Sunday',
        breakfast: 'Idly, Bread Jam (2), Puri (1), Onion Dosa (1), Karam Podi, Chetney, Milk, Coffee',
        lunch: 'Mudda Pappu, Pickle, Alu Patchikaram, Milli Maker + Tomato / Pakodi Pulusu, Pachipulusu / Majjighi Charu, Sambar, Curd, Rice',
        snacks: 'Cornflex Chat (2), Poha (1), Besibilli Bath (2), Payasam, Tea, Milk, Pulses',
        dinner: 'Rice, Pulka, Biryani, Kurma, Chicken Fry, Raita, Gongora Chetney, Pappu Charu, Rasam, Veg Curries + Sweet, Curd',
        breakfast_timing: '8:00 AM - 10:00 AM',
        lunch_timing: '1:00 PM - 3:00 PM',
        snacks_timing: '4:30 PM - 6:00 PM',
        dinner_timing: '8:00 PM - 10:00 PM',
        special_notes: 'Sunday Grand Day: Traditional Mudda Pappu, Besibilli Bath, Sweet Payasam, Biryani & Chicken Fry'
      }
    ];
  }

  function getDefaultAnnouncements() {
    const today = new Date().toISOString().slice(0, 10);
    return [
      {
        id: 1,
        title: 'Hostel Maintenance Schedule — Water Tank Cleaning',
        content: 'Hostel overhead water tanks will undergo periodic ultraviolet sanitization tomorrow from 10:00 AM to 1:00 PM. Please store required water in advance.',
        priority: 'High',
        audience: 'all',
        published_date: today,
        date: today,
        publishedDateDisplay: formatDisplayDate(today),
        author_name: 'Hostel Chief Warden',
        created_by: 1
      },
      {
        id: 2,
        title: 'High-Speed Wi-Fi 6 Upgrade across all 5 Floors',
        content: 'New Wi-Fi 6 access points have been configured across all 5 hostel floors to provide 100 Mbps per room. Seamless roaming is enabled.',
        priority: 'Medium',
        audience: 'all',
        published_date: today,
        date: today,
        publishedDateDisplay: formatDisplayDate(today),
        author_name: 'Hostel Chief Warden',
        created_by: 1
      },
      {
        id: 3,
        title: 'Reminder: Joining-Date Based Monthly Fee Cycles',
        content: 'All residents are advised to track their respective monthly joining dates in the Fee Management tab. Room charges should be cleared on or before the due date.',
        priority: 'Urgent',
        audience: 'students',
        published_date: today,
        date: today,
        publishedDateDisplay: formatDisplayDate(today),
        author_name: 'Hostel Accounts Desk',
        created_by: 1
      },
      {
        id: 4,
        title: 'Vignan Vihar Boys Hostel: Special Sunday Dining Feast',
        content: 'Special grand dinner this Sunday featuring Hyderabadi Dum Chicken Biryani, Paneer Butter Masala, Veg Curries, and Sweet Payasam. Dining hall timings: 7:30 PM to 9:30 PM.',
        priority: 'Medium',
        audience: 'all',
        published_date: today,
        date: today,
        publishedDateDisplay: formatDisplayDate(today),
        author_name: 'Food & Mess Committee',
        created_by: 1
      }
    ];
  }

  function getDefaultComplaints() {
    const today = new Date().toISOString().slice(0, 10);
    return [
      {
        id: 1,
        student_id: 1,
        student_name: 'Sai Teja',
        reg_number: '2024CS101',
        room_number: '101',
        bed_label: 'Bed-A',
        title: 'Bathroom tap leaking on Floor 1',
        description: 'Water is dripping continuously from the washbasin faucet. Please arrange for a washer replacement.',
        category: 'Plumbing',
        priority: 'High',
        status: 'In Progress',
        admin_notes: 'Plumber assigned, ceramic valve being replaced.',
        created_at: new Date(Date.now() - 86400000).toISOString().slice(0, 19).replace('T', ' '),
        createdAtDisplay: formatDisplayDate(new Date(Date.now() - 86400000).toISOString().slice(0, 10))
      },
      {
        id: 2,
        student_id: 2,
        student_name: 'Vikramaditya',
        reg_number: '2024CS102',
        room_number: '102',
        bed_label: 'Bed-B',
        title: 'Wi-Fi access point reboot required in corridor',
        description: 'Signal strength is intermittent in the study zone near Rooms 101 to 105 during evening study hours.',
        category: 'Wi-Fi',
        priority: 'Medium',
        status: 'Pending',
        admin_notes: '',
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        createdAtDisplay: formatDisplayDate(today)
      },
      {
        id: 3,
        student_id: 3,
        student_name: 'Ravi Kumar',
        reg_number: '2024IT103',
        room_number: '201',
        bed_label: 'Bed-A',
        title: 'Ceiling fan regulator switch repaired',
        description: 'Wall regulator switch was loose and unable to control speed.',
        category: 'Electrical',
        priority: 'Low',
        status: 'Resolved',
        admin_notes: 'Electrician replaced the modular regulator unit.',
        created_at: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 19).replace('T', ' '),
        createdAtDisplay: formatDisplayDate(new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10))
      }
    ];
  }

  function getDefaultNotifications() {
    const now = new Date();
    return [
      {
        id: 1,
        title: 'Maintenance Ticket Filed: Bathroom tap leaking on Floor 1',
        message: 'Plumbing issue reported in Room 101 (Sai Teja).',
        type: 'complaint',
        is_read: 0,
        link: '#complaints',
        created_at: new Date(now.getTime() - 2 * 3600000).toISOString()
      },
      {
        id: 2,
        title: 'Hostel Notice: Sunday Special Mess Menu',
        message: 'Hyderabadi Chicken Biryani & Paneer Butter Masala active for dinner.',
        type: 'announcement',
        is_read: 0,
        link: '#mess',
        created_at: new Date(now.getTime() - 6 * 3600000).toISOString()
      },
      {
        id: 3,
        title: 'Monthly Fee Schedule Active',
        message: 'Billing cycle fee records generated for all registered residents.',
        type: 'fee_due',
        is_read: 1,
        link: '#fees',
        created_at: new Date(now.getTime() - 86400000).toISOString()
      }
    ];
  }

  function formatDisplayDateTime(isoStr) {
    if (!isoStr) return '-';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return String(isoStr);
      const day = String(d.getDate()).padStart(2, '0');
      const mon = String(d.getMonth() + 1).padStart(2, '0');
      const yr = d.getFullYear();
      let hours = d.getHours();
      const mins = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${day}-${mon}-${yr} ${hours}:${mins} ${ampm}`;
    } catch (e) {
      return String(isoStr);
    }
  }

  function getDefaultVisitors() {
    const now = new Date();
    const entryTime1 = new Date(now.getTime() - 2 * 3600000).toISOString();
    const entryTime2 = new Date(now.getTime() - 26 * 3600000).toISOString();
    const exitTime2 = new Date(now.getTime() - 24 * 3600000).toISOString();

    return [
      {
        id: 1,
        visitor_name: 'Ramesh Kumar',
        phone: '+91 98765 43210',
        student_id: 1,
        student_name: 'Sunkara Sai Teja',
        reg_number: '211FA04001',
        room_number: '101',
        relation: 'Parent (Father)',
        purpose: 'Delivering winter clothes, laptop, and home snacks',
        entry_time: entryTime1,
        entryTimeDisplay: formatDisplayDateTime(entryTime1),
        exit_time: null,
        exitTimeDisplay: 'Currently Inside',
        status: 'in_hostel',
        created_at: entryTime1
      },
      {
        id: 2,
        visitor_name: 'Venkat Rao',
        phone: '+91 98123 76540',
        student_id: 2,
        student_name: 'Kranthi Kumar',
        reg_number: '211FA04002',
        room_number: '101',
        relation: 'Guardian (Uncle)',
        purpose: 'Semester fee verification & family visit',
        entry_time: entryTime2,
        entryTimeDisplay: formatDisplayDateTime(entryTime2),
        exit_time: exitTime2,
        exitTimeDisplay: formatDisplayDateTime(exitTime2),
        status: 'checked_out',
        created_at: entryTime2
      }
    ];
  }

  function getCleanInitialState() {
    return {
      adminUser: {
        id: 1,
        username: 'admin',
        email: 'admin@hostel.com',
        role: 'admin',
        name: 'Hostel Chief Warden',
        phone: '+91 98111 22334',
        avatar: './assets/images/default-avatar.png'
      },
      students: [],
      maintenanceBeds: [], // Array of unique bed identifiers e.g. "101_Bed-C"
      feeCycles: [],
      payments: [],
      complaints: getDefaultComplaints(),
      notifications: getDefaultNotifications(),
      expenses: [],
      visitors: getDefaultVisitors(),
      announcements: getDefaultAnnouncements(),
      leaveRequests: [],
      settings: {
        hostel_name: 'SRI RAM PG',
        hostel_address: 'Opposite Vignan University, Vadlamudi, Guntur, AP - 522213',
        contact_phone: '+91 98111 22334',
        contact_email: 'warden@srirampg.in',
        default_monthly_fee: '7000',
        curfew_time: '10:00 PM'
      },
      messMenu: getVignanMessMenu()
    };
  }

  function saveStore() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }

  /**
   * Data Integrity & Deduplication Engine
   * Eliminates orphan payments from deleted students and caps payments
   * strictly to genuine paid billing cycles so feesCollected is 100% accurate.
   */
  function sanitizeStore() {
    if (!store) return;
    if (!Array.isArray(store.students)) store.students = [];
    if (!Array.isArray(store.maintenanceBeds)) store.maintenanceBeds = [];
    if (!Array.isArray(store.feeCycles)) store.feeCycles = [];
    if (!Array.isArray(store.payments)) store.payments = [];
    if (!Array.isArray(store.expenses)) store.expenses = [];
    if (!Array.isArray(store.complaints)) store.complaints = [];
    if (!Array.isArray(store.visitors) || store.visitors.length === 0) {
      store.visitors = getDefaultVisitors();
    }
    if (!Array.isArray(store.announcements) || store.announcements.length === 0) {
      store.announcements = getDefaultAnnouncements();
    } else {
      const validAnn = store.announcements.filter(a => a && typeof a === 'object' && a.title);
      store.announcements = validAnn.length > 0 ? validAnn : getDefaultAnnouncements();
    }
    if (!Array.isArray(store.notifications) || store.notifications.length === 0) {
      store.notifications = getDefaultNotifications();
    }
    if (!store.settings) {
      store.settings = {
        hostel_name: 'SRI RAM PG',
        hostel_address: 'Opposite Vignan University, Vadlamudi, Guntur, AP - 522213',
        contact_phone: '+91 98111 22334',
        contact_email: 'warden@srirampg.in',
        default_monthly_fee: '7000',
        curfew_time: '10:00 PM'
      };
    } else {
      if (!store.settings.hostel_name || store.settings.hostel_name.includes('Management System')) {
        store.settings.hostel_name = 'SRI RAM PG';
      }
      if (!store.settings.hostel_address || store.settings.hostel_address.includes('Greater Noida') || store.settings.hostel_address.includes('Knowledge Park')) {
        store.settings.hostel_address = 'Opposite Vignan University, Vadlamudi, Guntur, AP - 522213';
      }
    }

    const activeStudentMap = new Map();
    store.students.forEach(s => {
      s.id = Number(s.id);
      if (s.college && (s.college.includes("Vignan's Foundation") || s.college === 'Vignan University, Vadlamudi' || s.college === 'Vignan University')) {
        s.college = 'VIGNAN UNIVERSITY';
      }
      if (!s.password) {
        s.password = s.reg_number;
      }
      activeStudentMap.set(s.id, s);
    });

    // 1. Purge fee cycles for students who no longer exist in store.students
    store.feeCycles = store.feeCycles.filter(c => activeStudentMap.has(Number(c.student_id)));

    // 2. Purge payments for students who no longer exist in store.students (no orphaned payments!)
    store.payments = store.payments.filter(p => activeStudentMap.has(Number(p.student_id)));

    // 3. For each active student:
    // Synchronize feeCycles & payments so there are NO duplicate payments for the same cycle
    const sanitizedPayments = [];
    const processedCycleIds = new Set();

    store.students.forEach(student => {
      const studentId = Number(student.id);
      let studentCycles = store.feeCycles.filter(c => Number(c.student_id) === studentId);

      // If student has no cycle at all, create Cycle 1
      if (studentCycles.length === 0) {
        const today = new Date().toISOString().slice(0, 10);
        const jD = student.joining_date || today;
        let cycleEnd = today;
        try {
          const d = new Date(jD);
          const nextM = new Date(d.getFullYear(), d.getMonth() + 1, d.getDate());
          const cEndD = new Date(nextM.getTime() - (24 * 60 * 60 * 1000));
          cycleEnd = cEndD.toISOString().slice(0, 10);
        } catch (e) {}

        const feeCycleId = store.feeCycles.length ? Math.max(...store.feeCycles.map(c => c.id)) + 1 : 1;
        const isPaid = student.fee_status === 'paid';
        const newCycle = {
          id: feeCycleId,
          student_id: studentId,
          student_name: student.name,
          reg_number: student.reg_number,
          room_number: student.room_number,
          bed_label: student.bed_label,
          college: student.college,
          course: student.course,
          cycle_number: 1,
          start_date: jD,
          end_date: cycleEnd,
          due_date: jD,
          amount: Number(student.monthly_fee || 7000),
          paid_amount: isPaid ? Number(student.monthly_fee || 7000) : 0,
          payment_date: isPaid ? (student.joining_date || today) : null,
          status: isPaid ? 'paid' : 'pending'
        };
        store.feeCycles.push(newCycle);
        studentCycles = [newCycle];
      }

      // Check student payments
      const studentPayments = store.payments.filter(p => Number(p.student_id) === studentId);

      studentCycles.forEach(cycle => {
        cycle.id = Number(cycle.id);
        const cycleAmount = Number(cycle.amount || student.monthly_fee || 7000);

        // Find payments corresponding to this cycle
        const matchingPayments = studentPayments.filter(p => 
          Number(p.fee_cycle_id) === cycle.id || 
          (!p.fee_cycle_id && studentPayments.length === 1)
        );

        if (cycle.status === 'paid' || student.fee_status === 'paid' || matchingPayments.length > 0) {
          cycle.status = 'paid';
          cycle.paid_amount = cycleAmount;
          if (!cycle.payment_date) cycle.payment_date = cycle.start_date || new Date().toISOString().slice(0, 10);
          student.fee_status = 'paid';

          // Ensure exactly ONE clean payment record exists for this paid cycle
          let pRecord = matchingPayments[0];
          if (!pRecord) {
            const pId = sanitizedPayments.length ? Math.max(...sanitizedPayments.map(p => p.id)) + 1 : 1;
            pRecord = {
              id: pId,
              paymentId: pId,
              fee_cycle_id: cycle.id,
              student_id: studentId,
              student_name: student.name,
              reg_number: student.reg_number,
              room_number: student.room_number,
              floor_number: student.floor_number || 1,
              bed_label: student.bed_label || 'Bed-A',
              college: student.college,
              course: student.course,
              student_phone: student.phone || '',
              student_email: student.email || '',
              parent_name: student.parent_name || 'Parent / Guardian',
              parent_phone: student.parent_phone || '+91 98765 00000',
              amount: cycleAmount,
              payment_method: 'UPI',
              transaction_id: `TXN${Date.now()}`,
              payment_date: cycle.payment_date || new Date().toISOString().slice(0, 10),
              cycle_start_date: cycle.start_date,
              cycle_end_date: cycle.end_date,
              receipt_number: `REC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(pId).padStart(4, '0')}`,
              status: 'PAID'
            };
          } else {
            // Keep the real payment record, but enforce exact cycle amount
            pRecord.amount = cycleAmount;
            pRecord.fee_cycle_id = cycle.id;
            pRecord.student_name = student.name;
            pRecord.reg_number = student.reg_number;
            pRecord.room_number = student.room_number;
            pRecord.floor_number = student.floor_number;
            pRecord.bed_label = student.bed_label;
            pRecord.college = student.college;
            pRecord.course = student.course;
            pRecord.status = 'PAID';
          }

          if (!processedCycleIds.has(cycle.id)) {
            processedCycleIds.add(cycle.id);
            sanitizedPayments.push(pRecord);
          }
        } else {
          cycle.status = 'pending';
          cycle.paid_amount = 0;
          cycle.payment_date = null;
        }
      });
    });

    store.payments = sanitizedPayments;
  }

  // Load from localStorage or initialize clean
  let store;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      store = JSON.parse(saved);
      if (!Array.isArray(store.students)) store.students = [];
      if (!Array.isArray(store.maintenanceBeds)) store.maintenanceBeds = [];
      if (!Array.isArray(store.feeCycles)) store.feeCycles = [];
      if (!Array.isArray(store.payments)) store.payments = [];
      if (!Array.isArray(store.announcements) || store.announcements.length === 0) {
        store.announcements = getDefaultAnnouncements();
      }
      if (!Array.isArray(store.complaints) || store.complaints.length === 0) {
        store.complaints = getDefaultComplaints();
      }
      if (!Array.isArray(store.notifications) || store.notifications.length === 0) {
        store.notifications = getDefaultNotifications();
      }
      // Always adopt the latest Vignan Vihar Boys Hostel menu
      store.messMenu = getVignanMessMenu();
    } else {
      store = getCleanInitialState();
      // Safely migrate user-added students and records from v9, v8, v7, v6, or v5
      try {
        const prevKeys = ['sri_ram_pg_live_store_v9', 'sri_ram_pg_live_store_v8', 'sri_ram_pg_live_store_v7', 'sri_ram_pg_live_store_v6', 'sri_ram_pg_live_store_v5'];
        for (const pk of prevKeys) {
          const val = localStorage.getItem(pk);
          if (val) {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed.students) && parsed.students.length > 0 && store.students.length === 0) {
              store.students = parsed.students;
            }
            if (Array.isArray(parsed.feeCycles) && parsed.feeCycles.length > 0 && store.feeCycles.length === 0) {
              store.feeCycles = parsed.feeCycles;
            }
            if (Array.isArray(parsed.payments) && parsed.payments.length > 0 && store.payments.length === 0) {
              store.payments = parsed.payments;
            }
            if (Array.isArray(parsed.maintenanceBeds) && parsed.maintenanceBeds.length > 0 && store.maintenanceBeds.length === 0) {
              store.maintenanceBeds = parsed.maintenanceBeds;
            }
          }
        }
      } catch (e) {}
    }
    sanitizeStore();
    saveStore();
  } catch (e) {
    store = getCleanInitialState();
    sanitizeStore();
    saveStore();
  }

  const bedLetters = ['A', 'B', 'C', 'D', 'E'];

  // Helper date formatter DD-MM-YYYY
  function formatDisplayDate(dateStr) {
    if (!dateStr) return '-';
    const parts = String(dateStr).slice(0, 10).split('-');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return dateStr;
  }

  const MockData = {
    get adminUser() { return store.adminUser; },
    get students() { return store.students; },

    get feeCycles() {
      sanitizeStore();
      const today = new Date().toISOString().slice(0, 10);
      return store.feeCycles.map(c => {
        const isPaid = c.status === 'paid' || (Number(c.paid_amount || 0) >= Number(c.amount || 0));
        let reminder;
        if (isPaid) {
          reminder = { status: 'paid', label: 'Paid', badgeClass: 'badge-success' };
        } else if (c.due_date && c.due_date < today) {
          reminder = { status: 'overdue', label: 'Overdue', badgeClass: 'badge-danger' };
        } else if (c.due_date && c.due_date === today) {
          reminder = { status: 'due_today', label: 'Due Today', badgeClass: 'badge-danger' };
        } else {
          reminder = { status: 'pending', label: 'Pending', badgeClass: 'badge-warning' };
        }

        return {
          ...c,
          status: isPaid ? 'paid' : 'pending',
          startDateDisplay: formatDisplayDate(c.start_date),
          endDateDisplay: formatDisplayDate(c.end_date),
          dueDateDisplay: formatDisplayDate(c.due_date),
          paymentDateDisplay: c.payment_date ? formatDisplayDate(c.payment_date) : '-',
          reminder
        };
      });
    },

    get payments() {
      sanitizeStore();
      return store.payments;
    },
    get complaints() {
      if (!Array.isArray(store.complaints) || store.complaints.length === 0) {
        store.complaints = getDefaultComplaints();
        saveStore();
      }
      return (store.complaints || []).map(c => {
        const student = (store.students || []).find(s => Number(s.id) === Number(c.student_id));
        return {
          ...c,
          student_name: c.student_name || (student ? student.name : 'Resident Student'),
          reg_number: c.reg_number || (student ? student.reg_number : 'RESIDENT'),
          room_number: c.room_number || (student ? student.room_number : '101'),
          bed_label: c.bed_label || (student ? student.bed_label : 'Bed-A'),
          createdAtDisplay: c.createdAtDisplay || (c.created_at ? formatDisplayDate(c.created_at.slice(0, 10)) : 'Today')
        };
      });
    },
    get expenses() {
      return (store.expenses || []).map(e => ({
        ...e,
        expenseDateDisplay: formatDisplayDate(e.date || e.expense_date)
      }));
    },
    get visitors() {
      if (!Array.isArray(store.visitors) || store.visitors.length === 0) {
        store.visitors = getDefaultVisitors();
        saveStore();
      }
      return store.visitors.map(v => {
        const student = (store.students || []).find(s => Number(s.id) === Number(v.student_id));
        return {
          ...v,
          student_name: v.student_name || (student ? student.name : 'Resident Student'),
          reg_number: v.reg_number || (student ? student.reg_number : ''),
          room_number: v.room_number || (student ? student.room_number : '-'),
          entryTimeDisplay: v.entryTimeDisplay || formatDisplayDateTime(v.entry_time || v.created_at),
          exitTimeDisplay: v.exitTimeDisplay || (v.exit_time ? formatDisplayDateTime(v.exit_time) : (v.status === 'in_hostel' ? 'Currently Inside' : '-'))
        };
      });
    },
    get announcements() {
      if (!Array.isArray(store.announcements) || store.announcements.length === 0) {
        store.announcements = getDefaultAnnouncements();
        saveStore();
      }
      const valid = store.announcements.filter(a => a && typeof a === 'object' && a.title);
      if (valid.length === 0) {
        store.announcements = getDefaultAnnouncements();
        saveStore();
        return store.announcements;
      }
      return valid.map(a => ({
        ...a,
        title: a.title || a.headline || 'Hostel Bulletin',
        content: a.content || a.description || '',
        publishedDateDisplay: a.publishedDateDisplay || formatDisplayDate(a.published_date || a.date || a.created_at) || 'Today'
      }));
    },
    get notifications() {
      if (!Array.isArray(store.notifications) || store.notifications.length === 0) {
        store.notifications = getDefaultNotifications();
        saveStore();
      }
      return store.notifications;
    },
    get leaveRequests() { return store.leaveRequests; },
    get settings() { return store.settings; },
    get messMenu() { return store.messMenu; },

    get messSchedule() {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayDayName = days[new Date().getDay()];
      const weekly = (store.messMenu || []).map(m => ({
        ...m,
        day_of_week: m.day_of_week || m.day,
        breakfast_timing: m.breakfast_timing || '7:30 AM - 9:30 AM',
        lunch_timing: m.lunch_timing || '12:30 PM - 2:30 PM',
        snacks_timing: m.snacks_timing || '4:30 PM - 6:00 PM',
        dinner_timing: m.dinner_timing || '7:30 PM - 9:30 PM'
      }));
      const todayMenu = weekly.find(m => (m.day_of_week || m.day || '').toLowerCase() === todayDayName.toLowerCase()) || weekly[0];
      return {
        todayDayName,
        todayMenu,
        weeklyMenu: weekly
      };
    },

    /**
     * Dynamically build hostel structure (5 floors, 50 rooms, 5 beds each)
     * derived strictly from `store.students` and `store.maintenanceBeds`.
     */
    get structure() {
      const floors = [];

      for (let f = 1; f <= 5; f++) {
        const rooms = [];
        let floorOccupied = 0;
        let floorMaintenance = 0;

        for (let r = 1; r <= 10; r++) {
          const roomNum = `${f}${String(r).padStart(2, '0')}`;
          const occupants = store.students.filter(s => String(s.room_number) === roomNum);
          const occupiedCount = occupants.length;

          let maintenanceCount = 0;
          for (let b = 1; b <= 5; b++) {
            const key = `${roomNum}_Bed-${bedLetters[b - 1]}`;
            if (store.maintenanceBeds.includes(key)) maintenanceCount++;
          }

          const availableCount = Math.max(0, 5 - occupiedCount - maintenanceCount);
          floorOccupied += occupiedCount;
          floorMaintenance += maintenanceCount;

          rooms.push({
            id: (f - 1) * 10 + r,
            floor_id: f,
            floor_number: f,
            room_number: roomNum,
            capacity: 5,
            occupied_beds: occupiedCount,
            available_beds: availableCount,
            maintenance_beds: maintenanceCount
          });
        }

        floors.push({
          id: f,
          floor_number: f,
          name: `Floor ${f}`,
          stats: {
            totalRooms: 10,
            totalBeds: 50,
            occupiedBeds: floorOccupied,
            availableBeds: Math.max(0, 50 - floorOccupied - floorMaintenance),
            maintenanceBeds: floorMaintenance
          },
          rooms: rooms
        });
      }

      return floors;
    },

    /**
     * Dynamically return all unassigned beds across all 50 rooms.
     */
    get availableBeds() {
      const list = [];

      for (let f = 1; f <= 5; f++) {
        for (let r = 1; r <= 10; r++) {
          const roomNum = `${f}${String(r).padStart(2, '0')}`;
          const occupants = store.students.filter(s => String(s.room_number) === roomNum);

          for (let b = 1; b <= 5; b++) {
            const label = `Bed-${bedLetters[b - 1]}`;
            const key = `${roomNum}_${label}`;
            const isOccupied = occupants.some(s => s.bed_label === label);
            const isMaintenance = store.maintenanceBeds.includes(key);

            if (!isOccupied && !isMaintenance) {
              list.push({
                bed_id: (f - 1) * 50 + (r - 1) * 5 + b,
                bed_number: b,
                bed_label: label,
                room_id: (f - 1) * 10 + r,
                room_number: roomNum,
                floor_id: f,
                floor_number: f,
                floor_name: `Floor ${f}`
              });
            }
          }
        }
      }

      return list;
    },

    get stats() {
      sanitizeStore();
      const totalStudents = store.students.length;
      const totalBeds = 250;
      const occupiedBeds = totalStudents;
      const maintenanceBeds = store.maintenanceBeds.length;
      const availableBeds = Math.max(0, totalBeds - occupiedBeds - maintenanceBeds);
      const occupancyRate = ((occupiedBeds / totalBeds) * 100).toFixed(1);

      let feesCollected = 0;
      for (const p of store.payments) {
        if (p.status === 'PAID') feesCollected += Number(p.amount || 0);
      }

      let pendingFees = 0;
      for (const c of store.feeCycles) {
        if (c.status !== 'paid' && Number(c.paid_amount || 0) < Number(c.amount || 0)) {
          pendingFees += Math.max(0, Number(c.amount || 0) - Number(c.paid_amount || 0));
        }
      }

      let hostelExpenses = 0;
      for (const e of store.expenses) {
        hostelExpenses += Number(e.amount || 0);
      }

      const netIncome = feesCollected - hostelExpenses;
      const pendingComplaints = store.complaints.filter(c => c.status !== 'Resolved').length;
      const activeVisitors = store.visitors.filter(v => v.status === 'in_hostel').length;

      return {
        totalStudents,
        totalBeds,
        occupiedBeds,
        availableBeds,
        maintenanceBeds,
        occupancyRate,
        feesCollected,
        pendingFees,
        hostelExpenses,
        netIncome,
        pendingComplaints,
        activeVisitors
      };
    },

    get charts() {
      sanitizeStore();
      const floorOccupancy = this.structure.map(f => ({
        floor_number: f.floor_number,
        floor_name: f.name,
        total_beds: f.stats.totalBeds,
        occupied_beds: f.stats.occupiedBeds,
        available_beds: f.stats.availableBeds
      }));

      // Group payments by month (e.g. "Oct 2026")
      const incomeByMonth = {};
      for (const p of store.payments) {
        if (p.status === 'PAID') {
          const d = p.payment_date ? new Date(p.payment_date) : new Date();
          const monthYear = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
          incomeByMonth[monthYear] = (incomeByMonth[monthYear] || 0) + Number(p.amount || 0);
        }
      }
      const monthlyIncome = Object.keys(incomeByMonth).map(m => ({
        month_year: m,
        total_income: incomeByMonth[m]
      }));

      // Group expenses by month (e.g. "Oct 2026")
      const expByMonth = {};
      for (const e of store.expenses) {
        const d = (e.date || e.expense_date) ? new Date(e.date || e.expense_date) : new Date();
        const monthYear = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
        expByMonth[monthYear] = (expByMonth[monthYear] || 0) + Number(e.amount || 0);
      }
      const monthlyExpenses = Object.keys(expByMonth).map(m => ({
        month_year: m,
        total_expense: expByMonth[m]
      }));

      // Group expenses by category
      const categoryTotals = {};
      for (const e of store.expenses) {
        const cat = e.category || 'Other';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(e.amount || 0);
      }
      const categoryExpenses = Object.keys(categoryTotals).map(c => ({
        category: c,
        total: categoryTotals[c],
        total_amount: categoryTotals[c]
      }));

      return {
        floorOccupancy,
        monthlyIncome,
        monthlyExpenses,
        categoryExpenses,
        recentPayments: store.payments.slice(-5).reverse(),
        recentComplaints: store.complaints.slice(-5).reverse()
      };
    },

    getRoomDetails(rNum) {
      rNum = String(rNum);
      const floorNum = parseInt(rNum.charAt(0), 10) || 1;
      const studentsInRoom = store.students.filter(s => String(s.room_number) === rNum);
      const beds = [];

      for (let b = 1; b <= 5; b++) {
        const label = `Bed-${bedLetters[b - 1]}`;
        const key = `${rNum}_${label}`;
        const bedId = (floorNum - 1) * 50 + (parseInt(rNum.slice(-2), 10) - 1) * 5 + b;

        const student = studentsInRoom.find(s => s.bed_label === label);
        const isMaintenance = store.maintenanceBeds.includes(key);

        if (student) {
          beds.push({
            id: bedId,
            bed_number: b,
            bed_label: label,
            status: 'occupied',
            student_id: student.id,
            student_name: student.name,
            reg_number: student.reg_number,
            student_phone: student.phone,
            student_email: student.email,
            college: student.college || 'Vignan University',
            course: student.course || 'B.Tech',
            year: student.year || '1st Year',
            joining_date: student.joining_date
          });
        } else if (isMaintenance) {
          beds.push({
            id: bedId,
            bed_number: b,
            bed_label: label,
            status: 'maintenance',
            student_id: null,
            student_name: null,
            reg_number: null,
            student_phone: null,
            student_email: null,
            college: null,
            course: null,
            year: null,
            joining_date: null
          });
        } else {
          beds.push({
            id: bedId,
            bed_number: b,
            bed_label: label,
            status: 'available',
            student_id: null,
            student_name: null,
            reg_number: null,
            student_phone: null,
            student_email: null,
            college: null,
            course: null,
            year: null,
            joining_date: null
          });
        }
      }

      return {
        room: {
          id: (floorNum - 1) * 10 + (parseInt(rNum.slice(-2), 10) || 1),
          room_number: rNum,
          capacity: 5,
          occupied_count: studentsInRoom.length,
          type: 'Standard 5-Bed',
          floor_number: floorNum,
          floor_name: `Floor ${floorNum}`
        },
        beds: beds
      };
    },

    getPaymentDetails(pId) {
      const p = store.payments.find(pay => Number(pay.id) === Number(pId) || Number(pay.paymentId) === Number(pId));
      if (!p) {
        return store.payments[0] || null;
      }

      let nextDue = '2026-11-15';
      let nextDueDisp = '15-11-2026';
      try {
        if (p.cycle_end_date) {
          const d = new Date(p.cycle_end_date);
          const nextD = new Date(d.getTime() + (24 * 60 * 60 * 1000));
          nextDue = nextD.toISOString().slice(0, 10);
          nextDueDisp = formatDisplayDate(nextDue);
        }
      } catch (e) {}

      return {
        ...p,
        paymentDateDisplay: formatDisplayDate(p.payment_date),
        cycleStartDisplay: formatDisplayDate(p.cycle_start_date),
        cycleEndDisplay: formatDisplayDate(p.cycle_end_date),
        nextDueDate: nextDue,
        nextDueDateDisplay: nextDueDisp
      };
    },

    addStudent(data) {
      const studentId = store.students.length ? Math.max(...store.students.map(s => s.id)) + 1 : 1;
      const isPaidNow = (data.paymentStatus === 'paid' || data.payment_status === 'paid');
      const feeStatus = isPaidNow ? 'paid' : 'pending';

      const bedLabel = (data.bedLabel || data.bed_label || 'Bed-A').trim();
      const roomNumber = String(data.roomNumber || data.room_number || '101').trim();
      const floorNumber = Number(data.floorNumber || data.floor_number || parseInt(roomNumber.charAt(0), 10) || 1);

      const newStudent = {
        id: studentId,
        reg_number: data.regNumber || data.reg_number || `REG${Date.now().toString().slice(-4)}`,
        name: data.name,
        email: data.email,
        phone: data.phone,
        college: data.college || 'VIGNAN UNIVERSITY',
        course: data.course || 'B.Tech - Artificial Intelligence & Machine Learning (AI & ML)',
        joining_date: data.joiningDate || data.joining_date || new Date().toISOString().slice(0, 10),
        monthly_fee: Number(data.monthlyFee || data.monthly_fee || 7000),
        room_number: roomNumber,
        floor_number: floorNumber,
        bed_label: bedLabel,
        bed_id: Number(data.bedId || data.bed_id || 0),
        fee_status: feeStatus,
        password: data.password || data.regNumber || data.reg_number,
        status: 'active'
      };

      store.students.unshift(newStudent);

      // Initial Fee Cycle (PENDING by default, unless marked Paid Now)
      const feeCycleId = store.feeCycles.length ? Math.max(...store.feeCycles.map(c => c.id)) + 1 : 1;
      const today = new Date().toISOString().slice(0, 10);
      const paidAmt = isPaidNow ? newStudent.monthly_fee : 0;

      // Cycle end date calculation (1 month after joining date)
      let cycleEnd = today;
      try {
        const jD = new Date(newStudent.joining_date || today);
        const nextM = new Date(jD.getFullYear(), jD.getMonth() + 1, jD.getDate());
        const cEndD = new Date(nextM.getTime() - (24 * 60 * 60 * 1000));
        cycleEnd = cEndD.toISOString().slice(0, 10);
      } catch (e) {}

      store.feeCycles.unshift({
        id: feeCycleId,
        student_id: newStudent.id,
        student_name: newStudent.name,
        reg_number: newStudent.reg_number,
        room_number: newStudent.room_number,
        bed_label: newStudent.bed_label,
        college: newStudent.college,
        course: newStudent.course,
        cycle_number: 1,
        start_date: newStudent.joining_date || today,
        end_date: cycleEnd,
        due_date: newStudent.joining_date || today,
        amount: newStudent.monthly_fee,
        paid_amount: paidAmt,
        payment_date: isPaidNow ? today : null,
        status: feeStatus
      });

      // ONLY record payment if explicitly marked as Paid Now
      if (isPaidNow) {
        const pId = store.payments.length ? Math.max(...store.payments.map(p => p.id)) + 1 : 1;
        const receiptNumber = `REC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(pId).padStart(4, '0')}`;

        store.payments.unshift({
          id: pId,
          paymentId: pId,
          fee_cycle_id: feeCycleId,
          student_id: newStudent.id,
          student_name: newStudent.name,
          reg_number: newStudent.reg_number,
          room_number: newStudent.room_number,
          floor_number: newStudent.floor_number,
          bed_label: newStudent.bed_label,
          college: newStudent.college,
          course: newStudent.course,
          student_phone: newStudent.phone,
          student_email: newStudent.email,
          parent_name: 'Parent / Guardian',
          parent_phone: '+91 98765 00000',
          amount: newStudent.monthly_fee,
          payment_method: data.paymentMethod || data.payment_method || 'Cash / Desk',
          transaction_id: `TXN${Date.now()}`,
          payment_date: today,
          cycle_start_date: newStudent.joining_date || today,
          cycle_end_date: cycleEnd,
          receipt_number: receiptNumber,
          status: 'PAID'
        });
      }

      sanitizeStore();
      saveStore();
      return newStudent;
    },

    deleteStudent(studentId) {
      const idNum = Number(studentId);
      store.students = store.students.filter(s => s.id !== idNum);
      store.feeCycles = store.feeCycles.filter(c => c.student_id !== idNum);
      store.payments = store.payments.filter(p => Number(p.student_id) !== idNum);
      sanitizeStore();
      saveStore();
    },

    updateStudentFeeStatus(studentId, feeStatus, paymentData = {}) {
      const sId = Number(studentId);
      const student = store.students.find(s => s.id === sId);
      if (!student) throw new Error('Student not found.');

      student.fee_status = feeStatus;

      // Find student's current fee cycle
      let cycle = store.feeCycles.find(c => Number(c.student_id) === sId);
      if (!cycle) {
        const feeCycleId = store.feeCycles.length ? Math.max(...store.feeCycles.map(c => c.id)) + 1 : 1;
        const today = new Date().toISOString().slice(0, 10);
        cycle = {
          id: feeCycleId,
          student_id: sId,
          student_name: student.name,
          reg_number: student.reg_number,
          room_number: student.room_number,
          bed_label: student.bed_label,
          college: student.college,
          course: student.course,
          cycle_number: 1,
          start_date: student.joining_date || today,
          end_date: today,
          due_date: student.joining_date || today,
          amount: Number(student.monthly_fee || 7000),
          paid_amount: 0,
          status: 'pending'
        };
        store.feeCycles.unshift(cycle);
      }

      if (feeStatus === 'paid') {
        const cycleAmount = Number(cycle.amount || student.monthly_fee || 7000);
        cycle.status = 'paid';
        cycle.paid_amount = cycleAmount;
        cycle.payment_date = paymentData.paymentDate || new Date().toISOString().slice(0, 10);

        // Record or update payment record
        let payment = store.payments.find(p => Number(p.fee_cycle_id) === Number(cycle.id));
        if (!payment) {
          const pId = store.payments.length ? Math.max(...store.payments.map(p => p.id)) + 1 : 1;
          payment = {
            id: pId,
            paymentId: pId,
            fee_cycle_id: cycle.id,
            student_id: sId,
            student_name: student.name,
            reg_number: student.reg_number,
            room_number: student.room_number,
            floor_number: student.floor_number || 1,
            bed_label: student.bed_label || 'Bed-A',
            college: student.college,
            course: student.course,
            student_phone: student.phone || '',
            student_email: student.email || '',
            parent_name: student.parent_name || 'Parent / Guardian',
            parent_phone: student.parent_phone || '+91 98765 00000',
            amount: cycleAmount,
            payment_method: paymentData.paymentMethod || 'UPI',
            transaction_id: paymentData.transactionId || `TXN${Date.now()}`,
            payment_date: cycle.payment_date,
            cycle_start_date: cycle.start_date,
            cycle_end_date: cycle.end_date,
            receipt_number: `REC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(pId).padStart(4, '0')}`,
            status: 'PAID'
          };
          store.payments.unshift(payment);
        } else {
          payment.amount = cycleAmount;
          payment.payment_method = paymentData.paymentMethod || payment.payment_method || 'UPI';
          payment.payment_date = cycle.payment_date;
          payment.status = 'PAID';
        }
      } else {
        // Reset to pending
        cycle.status = 'pending';
        cycle.paid_amount = 0;
        cycle.payment_date = null;
        store.payments = store.payments.filter(p => Number(p.student_id) !== sId);
      }

      sanitizeStore();
      saveStore();
      return student;
    },

    transferStudent(studentId, targetBedId, reason) {
      const sId = Number(studentId);
      const student = store.students.find(s => s.id === sId);
      if (!student) throw new Error('Student not found.');

      // Lookup target bed from available beds
      const target = this.availableBeds.find(b => String(b.bed_id) === String(targetBedId));
      if (!target) throw new Error('Destination bed is not available.');

      student.room_number = target.room_number;
      student.floor_number = target.floor_number;
      student.bed_label = target.bed_label;
      student.bed_id = target.bed_id;

      // Update fee cycle room/bed references
      store.feeCycles.forEach(c => {
        if (c.student_id === sId) {
          c.room_number = target.room_number;
          c.bed_label = target.bed_label;
        }
      });

      saveStore();
      return student;
    },

    updateBedStatus(bedId, newStatus) {
      const bId = Number(bedId);
      const f = Math.floor((bId - 1) / 50) + 1;
      const roomIdx = Math.floor(((bId - 1) % 50) / 5) + 1;
      const bIdx = ((bId - 1) % 5) + 1;
      const roomNum = `${f}${String(roomIdx).padStart(2, '0')}`;
      const label = `Bed-${bedLetters[bIdx - 1]}`;
      const key = `${roomNum}_${label}`;

      if (newStatus === 'maintenance') {
        if (!store.maintenanceBeds.includes(key)) {
          store.maintenanceBeds.push(key);
        }
      } else {
        store.maintenanceBeds = store.maintenanceBeds.filter(k => k !== key);
      }

      saveStore();
    },

    recordPayment(data) {
      sanitizeStore();
      const studentId = Number(data.studentId || data.student_id);
      const student = store.students.find(s => s.id === studentId);
      const amount = Number(data.amount || (student ? student.monthly_fee : 7000));
      const feeCycleId = data.feeCycleId ? Number(data.feeCycleId) : null;
      const todayISO = new Date().toISOString().slice(0, 10);
      const paymentDate = data.paymentDate || todayISO;

      // Locate matching fee cycle
      let cycle = null;
      if (feeCycleId) {
        cycle = store.feeCycles.find(c => Number(c.id) === feeCycleId);
      }
      if (!cycle) {
        cycle = store.feeCycles.find(c => Number(c.student_id) === studentId && c.status !== 'paid');
      }
      if (!cycle && store.feeCycles.length > 0) {
        cycle = store.feeCycles.find(c => Number(c.student_id) === studentId);
      }

      // Check if this cycle is already fully paid - prevent duplicate payment accumulation
      if (cycle && cycle.status === 'paid' && Number(cycle.paid_amount || 0) >= Number(cycle.amount || amount)) {
        const existingPayment = store.payments.find(p => Number(p.fee_cycle_id) === Number(cycle.id));
        if (existingPayment) {
          return existingPayment;
        }
      }

      const cycleStart = data.cycleStartDate || (cycle ? cycle.start_date : paymentDate);
      const cycleEnd = data.cycleEndDate || (cycle ? cycle.end_date : paymentDate);

      // If no pending cycle found, create next billing cycle
      if (!cycle) {
        const lastCycle = store.feeCycles.filter(c => Number(c.student_id) === studentId).slice(-1)[0];
        const nextCycleNum = lastCycle ? (Number(lastCycle.cycle_number || 1) + 1) : 1;
        const newCycleId = store.feeCycles.length ? Math.max(...store.feeCycles.map(c => c.id)) + 1 : 1;
        cycle = {
          id: newCycleId,
          student_id: studentId,
          student_name: student ? student.name : (data.student_name || 'Resident Student'),
          reg_number: student ? student.reg_number : '',
          room_number: student ? student.room_number : '',
          bed_label: student ? student.bed_label : 'Bed-A',
          college: student ? student.college : 'VIGNAN UNIVERSITY',
          course: student ? student.course : 'B.Tech',
          cycle_number: nextCycleNum,
          start_date: cycleStart,
          end_date: cycleEnd,
          due_date: cycleStart,
          amount: amount,
          paid_amount: amount,
          payment_date: paymentDate,
          status: 'paid'
        };
        store.feeCycles.unshift(cycle);
      }

      const pId = store.payments.length ? Math.max(...store.payments.map(p => p.id)) + 1 : 1;
      const receiptNumber = `REC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(pId).padStart(4, '0')}`;

      const newPayment = {
        id: pId,
        paymentId: pId,
        fee_cycle_id: cycle.id,
        student_id: studentId,
        student_name: student ? student.name : (data.student_name || 'Resident Student'),
        reg_number: student ? student.reg_number : '',
        room_number: student ? student.room_number : (cycle ? cycle.room_number : ''),
        floor_number: student ? student.floor_number : 1,
        bed_label: student ? student.bed_label : (cycle ? cycle.bed_label : 'Bed-A'),
        college: student ? student.college : 'VIGNAN UNIVERSITY',
        course: student ? student.course : 'B.Tech',
        year: student ? (student.year || '1st Year') : '1st Year',
        student_phone: student ? student.phone : '+91 98765 43210',
        student_email: student ? student.email : '',
        parent_name: student ? (student.parent_name || 'Parent / Guardian') : 'Parent / Guardian',
        parent_phone: student ? (student.parent_phone || '+91 98765 00000') : '+91 98765 00000',
        amount: amount,
        payment_method: data.paymentMethod || data.payment_method || 'UPI',
        transaction_id: data.transactionId || `TXN${Date.now()}`,
        payment_date: paymentDate,
        cycle_start_date: cycleStart,
        cycle_end_date: cycleEnd,
        receipt_number: receiptNumber,
        status: 'PAID'
      };

      store.payments.unshift(newPayment);

      // Update student and fee cycle status to Paid
      if (student) {
        student.fee_status = 'paid';
      }
      if (cycle) {
        cycle.status = 'paid';
        cycle.paid_amount = Number(cycle.amount || amount);
        cycle.payment_date = paymentDate;
      }

      sanitizeStore();
      saveStore();
      return newPayment;
    },

    updateMessMenu(dayOfWeek, data) {
      const item = store.messMenu.find(m => (m.day_of_week || m.day || '').toLowerCase() === String(dayOfWeek).toLowerCase());
      if (item) {
        if (data.breakfast) item.breakfast = data.breakfast;
        if (data.lunch) item.lunch = data.lunch;
        if (data.snacks) item.snacks = data.snacks;
        if (data.dinner) item.dinner = data.dinner;
        if (data.specialNotes !== undefined) item.special_notes = data.specialNotes;
        saveStore();
      }
      return item;
    },

    addMessFeedback(data) {
      const fb = {
        id: (store.complaints.length ? Math.max(...store.complaints.map(c => c.id)) : 0) + 1,
        title: data.title || 'Mess & Dining Feedback',
        description: data.description || '',
        category: 'Mess & Food',
        priority: 'Medium',
        status: 'In Progress',
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
      };
      store.complaints.unshift(fb);
      saveStore();
      return fb;
    },

    addExpense(data) {
      const eId = store.expenses.length ? Math.max(...store.expenses.map(e => e.id)) + 1 : 1;
      const today = new Date().toISOString().slice(0, 10);
      const amount = Number(data.amount || 0);
      const newExpense = {
        id: eId,
        category: data.category || 'Other',
        amount: amount,
        expense_date: data.expenseDate || data.date || today,
        date: data.expenseDate || data.date || today,
        expenseDateDisplay: formatDisplayDate(data.expenseDate || data.date || today),
        description: data.description || '',
        receipt_ref: data.receiptRef || data.receipt_ref || `VOUCH-${new Date().getFullYear()}-${String(eId).padStart(4, '0')}`,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
      };
      store.expenses.unshift(newExpense);
      saveStore();
      return newExpense;
    },

    deleteExpense(id) {
      const eId = Number(id);
      store.expenses = store.expenses.filter(e => e.id !== eId);
      saveStore();
    },

    addAnnouncement(data) {
      if (!Array.isArray(store.announcements)) store.announcements = [];
      const newId = store.announcements.length ? Math.max(...store.announcements.map(a => Number(a.id) || 0)) + 1 : 1;
      const today = new Date().toISOString().slice(0, 10);
      const user = (window.API && typeof window.API.getUser === 'function' && window.API.getUser()) || store.adminUser;

      const newAnn = {
        id: newId,
        title: (data.title || '').trim(),
        content: (data.content || '').trim(),
        priority: data.priority || 'Medium',
        audience: data.audience || 'all',
        published_date: data.publishedDate || data.published_date || today,
        date: data.publishedDate || data.published_date || today,
        publishedDateDisplay: formatDisplayDate(data.publishedDate || data.published_date || today),
        author_name: (user && user.name) || 'Hostel Chief Warden',
        created_by: (user && user.id) || 1,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
      };

      store.announcements.unshift(newAnn);

      // Also create a notification
      if (!Array.isArray(store.notifications)) store.notifications = [];
      const notifId = store.notifications.length ? Math.max(...store.notifications.map(n => Number(n.id) || 0)) + 1 : 1;
      store.notifications.unshift({
        id: notifId,
        title: 'New Announcement: ' + (data.title || '').trim(),
        message: (data.content || '').slice(0, 100) + '...',
        type: 'announcement',
        is_read: 0,
        link: '#announcements',
        created_at: 'Just now'
      });

      saveStore();
      return newAnn;
    },

    deleteAnnouncement(id) {
      const annId = Number(id);
      if (Array.isArray(store.announcements)) {
        store.announcements = store.announcements.filter(a => Number(a.id) !== annId);
        saveStore();
      }
    },

    addComplaint(data) {
      if (!Array.isArray(store.complaints)) store.complaints = [];
      const cId = store.complaints.length ? Math.max(...store.complaints.map(c => Number(c.id) || 0)) + 1 : 1;
      const user = (window.API && typeof window.API.getUser === 'function' && window.API.getUser()) || {};
      const student = (window.API && typeof window.API.getStudent === 'function' && window.API.getStudent()) || 
                      (store.students && store.students[0]) || {};
      const isStudent = user && user.role === 'student';
      const today = new Date().toISOString().slice(0, 10);

      const studentName = isStudent ? (student.name || user.name) : (data.student_name || user.name || 'Resident Student');
      const regNumber = isStudent ? (student.reg_number || user.username || 'RESIDENT') : (data.reg_number || (student ? student.reg_number : 'ADMIN'));
      const roomNum = isStudent ? (student.room_number || data.room_number || '101') : (data.room_number || (student ? student.room_number : '101'));
      const bedLabel = isStudent ? (student.bed_label || data.bed_label || 'Bed-A') : (data.bed_label || (student ? student.bed_label : 'Bed-A'));

      const newComplaint = {
        id: cId,
        student_id: isStudent ? (student.id || user.id || 1) : 1,
        student_name: studentName,
        reg_number: regNumber,
        room_number: roomNum,
        bed_label: bedLabel,
        title: (data.title || 'Hostel Maintenance Issue').trim(),
        description: (data.description || '').trim(),
        category: data.category || 'Maintenance & Repairs',
        priority: data.priority || 'Medium',
        status: 'Pending',
        admin_notes: '',
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        createdAtDisplay: formatDisplayDate(today)
      };

      store.complaints.unshift(newComplaint);

      // Notification
      if (!Array.isArray(store.notifications)) store.notifications = [];
      const notifId = store.notifications.length ? Math.max(...store.notifications.map(n => Number(n.id) || 0)) + 1 : 1;
      store.notifications.unshift({
        id: notifId,
        title: `Maintenance Ticket Filed: ${newComplaint.title}`,
        message: `${newComplaint.category} issue reported in Room ${roomNum} (${studentName}).`,
        type: 'complaint',
        is_read: 0,
        link: '#complaints',
        created_at: new Date().toISOString()
      });

      saveStore();
      return newComplaint;
    },

    updateComplaintStatus(id, status, adminNotes) {
      const cId = Number(id);
      const comp = (store.complaints || []).find(c => Number(c.id) === cId);
      if (comp) {
        let normalizedStatus = status;
        if (status === 'Solved') normalizedStatus = 'Resolved';
        if (status === 'Processing') normalizedStatus = 'In Progress';

        comp.status = normalizedStatus;
        if (adminNotes !== undefined) comp.admin_notes = adminNotes.trim();

        // Push status change notification targeting the resident & room
        if (!Array.isArray(store.notifications)) store.notifications = [];
        const notifId = store.notifications.length ? Math.max(...store.notifications.map(n => Number(n.id) || 0)) + 1 : 1;
        const statusDisplay = normalizedStatus === 'Resolved' ? 'Solved & Resolved' : normalizedStatus === 'In Progress' ? 'In Progress (Processing)' : 'Pending Review';

        store.notifications.unshift({
          id: notifId,
          title: `Ticket Status: ${comp.title}`,
          message: `Complaint #${cId} (Room ${comp.room_number || '-'}) status updated to "${statusDisplay}".${comp.admin_notes ? ' Warden Remarks: ' + comp.admin_notes : ''}`,
          type: normalizedStatus === 'Resolved' ? 'payment' : 'complaint',
          is_read: 0,
          link: '#complaints',
          created_at: new Date().toISOString()
        });

        saveStore();
      }
      return comp;
    },

    deleteComplaint(id) {
      const cId = Number(id);
      if (Array.isArray(store.complaints)) {
        store.complaints = store.complaints.filter(c => Number(c.id) !== cId);
        saveStore();
      }
    },

    addLeaveRequest(data) {
      if (!Array.isArray(store.leaveRequests)) store.leaveRequests = [];
      const lId = store.leaveRequests.length ? Math.max(...store.leaveRequests.map(l => Number(l.id) || 0)) + 1 : 1;
      const today = new Date().toISOString().slice(0, 10);
      const newLeave = {
        id: lId,
        student_id: Number(data.student_id) || 1,
        student_name: data.student_name || 'Resident Student',
        student_phone: data.student_phone || data.emergencyContact || '',
        reg_number: data.reg_number || '',
        room_number: data.room_number || '',
        bed_label: data.bed_label || '',
        start_date: data.startDate || today,
        end_date: data.endDate || today,
        startDateDisplay: formatDisplayDate(data.startDate || today),
        endDateDisplay: formatDisplayDate(data.endDate || today),
        reason: data.reason || 'Personal / Outstation Leave',
        emergency_contact: data.emergencyContact || data.parent_phone || '',
        status: 'Pending',
        admin_remarks: '',
        created_at: new Date().toISOString()
      };
      store.leaveRequests.unshift(newLeave);

      // Add notification for leave application
      if (!Array.isArray(store.notifications)) store.notifications = [];
      const notifId = store.notifications.length ? Math.max(...store.notifications.map(n => Number(n.id) || 0)) + 1 : 1;
      store.notifications.unshift({
        id: notifId,
        student_id: newLeave.student_id,
        reg_number: newLeave.reg_number,
        title: `Leave Application Submitted`,
        message: `Leave applied for ${newLeave.startDateDisplay} to ${newLeave.endDateDisplay}. Awaiting warden approval.`,
        type: 'leave',
        is_read: 0,
        link: '#leave-requests',
        created_at: new Date().toISOString()
      });

      saveStore();
      return newLeave;
    },

    updateLeaveRequestStatus(id, status, remarks) {
      const lId = Number(id);
      if (Array.isArray(store.leaveRequests)) {
        const item = store.leaveRequests.find(l => Number(l.id) === lId);
        if (item) {
          item.status = status;
          if (remarks !== undefined) item.admin_remarks = remarks;

          // Notification for the student
          if (!Array.isArray(store.notifications)) store.notifications = [];
          const notifId = store.notifications.length ? Math.max(...store.notifications.map(n => Number(n.id) || 0)) + 1 : 1;
          store.notifications.unshift({
            id: notifId,
            student_id: item.student_id,
            reg_number: item.reg_number,
            title: `Leave Request ${status}`,
            message: `Your leave application from ${item.startDateDisplay} to ${item.endDateDisplay} has been ${status.toLowerCase()}.${remarks ? ' Warden remarks: ' + remarks : ''}`,
            type: 'leave',
            is_read: 0,
            link: '#leave-requests',
            created_at: new Date().toISOString()
          });

          saveStore();
          return item;
        }
      }
      return null;
    },

    addVisitor(data) {
      if (!Array.isArray(store.visitors)) store.visitors = [];
      const vId = store.visitors.length ? Math.max(...store.visitors.map(v => Number(v.id) || 0)) + 1 : 1;
      
      const studentId = Number(data.studentId || data.student_id);
      const student = (store.students || []).find(s => Number(s.id) === studentId) || {};
      
      const now = new Date();
      const nowISO = now.toISOString();
      const entryTimeFormatted = formatDisplayDateTime(nowISO);

      const newVisitor = {
        id: vId,
        visitor_name: (data.visitorName || data.visitor_name || 'Visitor').trim(),
        phone: (data.phone || '').trim(),
        student_id: student.id || studentId || 1,
        student_name: student.name || data.student_name || 'Resident Student',
        reg_number: student.reg_number || data.reg_number || '',
        room_number: student.room_number || data.room_number || '-',
        relation: (data.relation || 'Parent / Relative').trim(),
        purpose: (data.purpose || 'Personal Visit').trim(),
        entry_time: nowISO,
        entryTimeDisplay: entryTimeFormatted,
        exit_time: null,
        exitTimeDisplay: 'Currently Inside',
        status: 'in_hostel',
        created_at: nowISO
      };

      store.visitors.unshift(newVisitor);

      // Notification
      if (!Array.isArray(store.notifications)) store.notifications = [];
      const notifId = store.notifications.length ? Math.max(...store.notifications.map(n => Number(n.id) || 0)) + 1 : 1;
      store.notifications.unshift({
        id: notifId,
        student_id: newVisitor.student_id,
        reg_number: newVisitor.reg_number,
        title: `Visitor Gate Entry Logged`,
        message: `${newVisitor.visitor_name} (${newVisitor.relation}) checked in at the gate to visit ${newVisitor.student_name}.`,
        type: 'visitor',
        is_read: 0,
        link: '#visitors',
        created_at: nowISO
      });

      saveStore();
      return newVisitor;
    },

    checkoutVisitor(id) {
      const vId = Number(id);
      if (Array.isArray(store.visitors)) {
        const item = store.visitors.find(v => Number(v.id) === vId);
        if (item) {
          const now = new Date();
          const nowISO = now.toISOString();
          item.status = 'checked_out';
          item.exit_time = nowISO;
          item.exitTimeDisplay = formatDisplayDateTime(nowISO);
          saveStore();
          return item;
        }
      }
      return null;
    },

    markNotificationRead(id) {
      const nId = Number(id);
      if (Array.isArray(store.notifications)) {
        const item = store.notifications.find(n => Number(n.id) === nId);
        if (item) {
          item.is_read = 1;
          saveStore();
        }
      }
    },

    markAllNotificationsRead() {
      if (Array.isArray(store.notifications)) {
        store.notifications.forEach(n => { n.is_read = 1; });
        saveStore();
      }
    },

    clearReadNotifications() {
      if (Array.isArray(store.notifications)) {
        store.notifications = store.notifications.filter(n => !n.is_read);
        saveStore();
      }
    },

    updateSettings(data) {
      if (!store.settings) store.settings = {};
      Object.assign(store.settings, data);
      saveStore();
      return store.settings;
    },

    saveStore() {
      saveStore();
    },

    resetToClean() {
      store = getCleanInitialState();
      saveStore();
    }
  };

  window.MockData = MockData;
})();
