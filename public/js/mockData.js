/**
 * Clean State Data Store for Static Hosting (GitHub Pages)
 * Zero sample data: Ready for real students, payments, rooms, and expenses.
 * Persists all newly added records to browser localStorage.
 */
(function() {
  const STORAGE_KEY = 'sri_ram_pg_clean_store_v4';

  // Purge any old demo stores from browser localStorage
  try {
    ['sri_ram_pg_clean_store_v1', 'sri_ram_pg_clean_store_v2', 'sri_ram_pg_clean_store_v3', 'sri_ram_pg_live_store_v1'].forEach(k => {
      localStorage.removeItem(k);
    });
  } catch (e) {}

  // Build 5 floors, 50 rooms (101-110, 201-210, etc.), 250 beds (Bed-A to Bed-E)
  function buildCleanHostelStructure() {
    const structure = [];
    const availableBeds = [];
    let bedIdCounter = 1;

    for (let f = 1; f <= 5; f++) {
      const rooms = [];
      for (let r = 1; r <= 10; r++) {
        const roomNum = `${f}${String(r).padStart(2, '0')}`;
        rooms.push({
          room_number: roomNum,
          capacity: 5,
          occupied_beds: 0,
          available_beds: 5,
          maintenance_beds: 0
        });

        // 5 beds per room: Bed-A, Bed-B, Bed-C, Bed-D, Bed-E
        const bedLetters = ['A', 'B', 'C', 'D', 'E'];
        for (let b = 1; b <= 5; b++) {
          availableBeds.push({
            bed_id: bedIdCounter++,
            bed_number: b,
            bed_label: `Bed-${bedLetters[b - 1]}`,
            room_id: (f - 1) * 10 + r,
            room_number: roomNum,
            floor_id: f,
            floor_number: f,
            floor_name: `Floor ${f}`
          });
        }
      }

      structure.push({
        floor_number: f,
        name: `Floor ${f}`,
        stats: {
          totalBeds: 50,
          occupiedBeds: 0,
          availableBeds: 50
        },
        rooms: rooms
      });
    }

    return { structure, availableBeds };
  }

  function getCleanInitialState() {
    const { structure, availableBeds } = buildCleanHostelStructure();

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
      structure: structure,
      availableBeds: availableBeds,
      feeCycles: [],
      payments: [],
      complaints: [],
      expenses: [],
      visitors: [],
      announcements: [],
      leaveRequests: [],
      settings: {
        hostel_name: 'SRI RAM PG',
        hostel_address: 'Knowledge Park III, Institutional Area, Greater Noida, UP - 201306',
        contact_phone: '+91 120 232 4000',
        contact_email: 'warden@srirampg.in',
        default_monthly_fee: '7000',
        curfew_time: '10:00 PM'
      },
      messMenu: [
        { id: 1, day: 'Monday', breakfast: 'Idli, Sambar, Coconut Chutney, Tea/Coffee', lunch: 'Rice, Dal Tadka, Paneer Butter Masala, Roti, Salad', snacks: 'Samosa, Masala Chai', dinner: 'Jeera Rice, Mixed Veg Curry, Phulka, Gulab Jamun' },
        { id: 2, day: 'Tuesday', breakfast: 'Aloo Paratha, Curd, Pickle, Tea/Coffee', lunch: 'Rice, Rajma Masala, Aloo Gobi, Roti, Curd', snacks: 'Veg Cutlet, Tea/Coffee', dinner: 'Veg Pulao, Dal Fry, Roti, Kheer' },
        { id: 3, day: 'Wednesday', breakfast: 'Poha, Sev, Boiled Eggs / Banana, Tea/Coffee', lunch: 'Rice, Sambar, Bhindi Masala, Roti, Curd', snacks: 'Bhel Puri, Green Tea', dinner: 'Egg Curry / Paneer Do Pyaza, Steamed Rice, Chapati' },
        { id: 4, day: 'Thursday', breakfast: 'Masala Dosa, Chutney, Sambar, Coffee', lunch: 'Rice, Chole Bhature / Roti, Boondi Raita', snacks: 'Biscuit / Cookies, Masala Chai', dinner: 'Veg Biryani, Mirchi Ka Salan, Raita, Ice Cream' },
        { id: 5, day: 'Friday', breakfast: 'Upma, Vada, Chutney, Tea/Coffee', lunch: 'Rice, Dal Makhani, Mixed Vegetable, Roti, Curd', snacks: 'Pakora, Mint Chutney, Chai', dinner: 'Fried Rice, Veg Manchurian, Spring Rolls' },
        { id: 6, day: 'Saturday', breakfast: 'Puri Bhaji, Halwa, Tea/Coffee', lunch: 'Lemon Rice, Dal Palak, Curd Rice, Papad', snacks: 'French Fries, Lemonade', dinner: 'Paneer Biryani, Veg Kurma, Parotta, Rasgulla' },
        { id: 7, day: 'Sunday', breakfast: 'Chole Kulche / Bread Omelette, Fresh Juice', lunch: 'Special Sunday Feast: Paneer Tikka, Dum Aloo, Butter Naan', snacks: 'Cake Slice, Tea/Coffee', dinner: 'Khichdi, Kadhi, Papad, Achar, Fruit Custard' }
      ]
    };
  }

  // Load from localStorage or initialize clean
  let store;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      store = JSON.parse(saved);
    } else {
      store = getCleanInitialState();
    }
  } catch (e) {
    store = getCleanInitialState();
  }

  function saveStore() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }

  const MockData = {
    get adminUser() { return store.adminUser; },
    get students() { return store.students; },
    get structure() { return store.structure; },
    get availableBeds() { return store.availableBeds; },
    get feeCycles() { return store.feeCycles; },
    get payments() { return store.payments; },
    get complaints() { return store.complaints; },
    get expenses() { return store.expenses; },
    get visitors() { return store.visitors; },
    get announcements() { return store.announcements; },
    get leaveRequests() { return store.leaveRequests; },
    get settings() { return store.settings; },
    get messMenu() { return store.messMenu; },

    get stats() {
      const totalStudents = store.students.length;
      const totalBeds = 250;
      const occupiedBeds = totalStudents;
      const availableBeds = Math.max(0, totalBeds - occupiedBeds);
      const occupancyRate = ((occupiedBeds / totalBeds) * 100).toFixed(1);

      let feesCollected = 0;
      for (const p of store.payments) {
        if (p.status === 'PAID') feesCollected += Number(p.amount || 0);
      }

      let pendingFees = 0;
      for (const c of store.feeCycles) {
        if (c.status === 'pending' || c.status === 'overdue') {
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
        maintenanceBeds: 0,
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
      const floorOccupancy = store.structure.map(f => ({
        floor_number: f.floor_number,
        floor_name: f.name,
        total_beds: f.stats.totalBeds,
        occupied_beds: f.stats.occupiedBeds,
        available_beds: f.stats.availableBeds
      }));

      return {
        floorOccupancy,
        monthlyIncome: [],
        monthlyExpenses: [],
        categoryExpenses: [],
        recentPayments: store.payments.slice(-5).reverse(),
        recentComplaints: store.complaints.slice(-5).reverse()
      };
    },

    addStudent(data) {
      const studentId = store.students.length ? Math.max(...store.students.map(s => s.id)) + 1 : 1;
      const newStudent = {
        id: studentId,
        reg_number: data.regNumber || data.reg_number || `REG${Date.now().toString().slice(-4)}`,
        name: data.name,
        email: data.email,
        phone: data.phone,
        college: data.college || 'College',
        course: data.course || 'Degree',
        joining_date: data.joiningDate || data.joining_date || new Date().toISOString().slice(0, 10),
        monthly_fee: Number(data.monthlyFee || data.monthly_fee || 7000),
        room_number: String(data.roomNumber || data.room_number || ''),
        floor_number: Number(data.floorNumber || data.floor_number || 1),
        bed_label: data.bedLabel || data.bed_label || 'Bed-A',
        bed_id: Number(data.bedId || data.bed_id || 0),
        fee_status: 'paid',
        status: 'active'
      };

      store.students.unshift(newStudent);

      // Mark bed occupied in structure
      const floor = store.structure.find(f => f.floor_number === newStudent.floor_number);
      if (floor) {
        floor.stats.occupiedBeds = Math.min(floor.stats.totalBeds, floor.stats.occupiedBeds + 1);
        floor.stats.availableBeds = Math.max(0, floor.stats.totalBeds - floor.stats.occupiedBeds);
        const room = floor.rooms.find(r => r.room_number === newStudent.room_number);
        if (room) {
          room.occupied_beds = Math.min(room.capacity, room.occupied_beds + 1);
          room.available_beds = Math.max(0, room.capacity - room.occupied_beds);
        }
      }

      // Remove allocated bed from available list
      if (newStudent.bed_id) {
        store.availableBeds = store.availableBeds.filter(b => b.bed_id !== newStudent.bed_id);
      } else {
        const bedIdx = store.availableBeds.findIndex(b => b.room_number === newStudent.room_number && b.bed_label === newStudent.bed_label);
        if (bedIdx !== -1) store.availableBeds.splice(bedIdx, 1);
      }

      // Initial Payment & Fee Cycle
      const feeCycleId = store.feeCycles.length + 1;
      const today = new Date().toISOString().slice(0, 10);
      store.feeCycles.unshift({
        id: feeCycleId,
        student_id: newStudent.id,
        student_name: newStudent.name,
        reg_number: newStudent.reg_number,
        room_number: newStudent.room_number,
        bed_label: newStudent.bed_label,
        cycle_number: 1,
        start_date: today,
        end_date: today,
        due_date: today,
        amount: newStudent.monthly_fee,
        paid_amount: newStudent.monthly_fee,
        status: 'paid'
      });

      store.payments.unshift({
        id: store.payments.length + 1,
        student_id: newStudent.id,
        student_name: newStudent.name,
        reg_number: newStudent.reg_number,
        room_number: newStudent.room_number,
        bed_label: newStudent.bed_label,
        amount: newStudent.monthly_fee,
        payment_method: 'UPI / Direct',
        transaction_id: `TXN${Date.now()}`,
        payment_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
        status: 'PAID'
      });

      saveStore();
      return newStudent;
    },

    deleteStudent(studentId) {
      const idx = store.students.findIndex(s => s.id === Number(studentId));
      if (idx !== -1) {
        const student = store.students[idx];
        store.students.splice(idx, 1);

        // Free up bed
        const floor = store.structure.find(f => f.floor_number === student.floor_number);
        if (floor) {
          floor.stats.occupiedBeds = Math.max(0, floor.stats.occupiedBeds - 1);
          floor.stats.availableBeds = Math.min(floor.stats.totalBeds, floor.stats.totalBeds - floor.stats.occupiedBeds);
          const room = floor.rooms.find(r => r.room_number === student.room_number);
          if (room) {
            room.occupied_beds = Math.max(0, room.occupied_beds - 1);
            room.available_beds = Math.min(room.capacity, room.capacity - room.occupied_beds);
          }
        }

        // Add bed back to available list
        store.availableBeds.push({
          bed_id: Date.now(),
          bed_number: 1,
          bed_label: student.bed_label,
          room_id: 1,
          room_number: student.room_number,
          floor_id: student.floor_number,
          floor_number: student.floor_number,
          floor_name: `Floor ${student.floor_number}`
        });

        saveStore();
      }
    },

    resetToClean() {
      store = getCleanInitialState();
      saveStore();
    }
  };

  window.MockData = MockData;
})();
