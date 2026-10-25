/**
 * Clean State Data Store for Static Hosting (GitHub Pages)
 * Single Source of Truth: All room occupancy and available beds are dynamically
 * calculated directly from `store.students`.
 * When a student is enrolled, their bed is marked occupied.
 * When a student is removed/vacated, their bed automatically and immediately becomes Available.
 */
(function() {
  const STORAGE_KEY = 'sri_ram_pg_live_store_v6';

  // Purge any older demo stores
  try {
    ['sri_ram_pg_clean_store_v1', 'sri_ram_pg_clean_store_v2', 'sri_ram_pg_clean_store_v3', 'sri_ram_pg_clean_store_v4', 'sri_ram_pg_live_store_v1'].forEach(k => {
      localStorage.removeItem(k);
    });
  } catch (e) {}

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
      if (!Array.isArray(store.students)) store.students = [];
      if (!Array.isArray(store.maintenanceBeds)) store.maintenanceBeds = [];
      if (!Array.isArray(store.feeCycles)) store.feeCycles = [];
      if (!Array.isArray(store.payments)) store.payments = [];
    } else {
      store = getCleanInitialState();
      // Migrate from v5 if available
      try {
        const v5 = localStorage.getItem('sri_ram_pg_live_store_v5');
        if (v5) {
          const parsed = JSON.parse(v5);
          if (Array.isArray(parsed.students)) store.students = parsed.students;
          if (Array.isArray(parsed.feeCycles)) store.feeCycles = parsed.feeCycles;
          if (Array.isArray(parsed.payments)) store.payments = parsed.payments;
          if (Array.isArray(parsed.maintenanceBeds)) store.maintenanceBeds = parsed.maintenanceBeds;
        }
      } catch (e) {}
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

    get payments() { return store.payments; },
    get complaints() { return store.complaints; },
    get expenses() { return store.expenses; },
    get visitors() { return store.visitors; },
    get announcements() { return store.announcements; },
    get leaveRequests() { return store.leaveRequests; },
    get settings() { return store.settings; },
    get messMenu() { return store.messMenu; },

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
      const floorOccupancy = this.structure.map(f => ({
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
        college: data.college || 'Vignan University, Vadlamudi',
        course: data.course || 'B.Tech - Artificial Intelligence & Machine Learning (AI & ML)',
        joining_date: data.joiningDate || data.joining_date || new Date().toISOString().slice(0, 10),
        monthly_fee: Number(data.monthlyFee || data.monthly_fee || 7000),
        room_number: roomNumber,
        floor_number: floorNumber,
        bed_label: bedLabel,
        bed_id: Number(data.bedId || data.bed_id || 0),
        fee_status: feeStatus,
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

      saveStore();
      return newStudent;
    },

    deleteStudent(studentId) {
      const idNum = Number(studentId);
      store.students = store.students.filter(s => s.id !== idNum);
      store.feeCycles = store.feeCycles.filter(c => c.student_id !== idNum);
      saveStore();
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
      const studentId = Number(data.studentId || data.student_id);
      const student = store.students.find(s => s.id === studentId);
      const amount = Number(data.amount || (student ? student.monthly_fee : 7000));
      const feeCycleId = data.feeCycleId ? Number(data.feeCycleId) : null;
      const todayISO = new Date().toISOString().slice(0, 10);
      const paymentDate = data.paymentDate || todayISO;

      const pId = store.payments.length ? Math.max(...store.payments.map(p => p.id)) + 1 : 1;
      const receiptNumber = `REC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(pId).padStart(4, '0')}`;

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

      const cycleStart = data.cycleStartDate || (cycle ? cycle.start_date : paymentDate);
      const cycleEnd = data.cycleEndDate || (cycle ? cycle.end_date : paymentDate);

      const newPayment = {
        id: pId,
        paymentId: pId,
        fee_cycle_id: cycle ? cycle.id : (feeCycleId || 1),
        student_id: studentId,
        student_name: student ? student.name : (data.student_name || 'Resident Student'),
        reg_number: student ? student.reg_number : '',
        room_number: student ? student.room_number : (cycle ? cycle.room_number : ''),
        floor_number: student ? student.floor_number : 1,
        bed_label: student ? student.bed_label : (cycle ? cycle.bed_label : 'Bed-A'),
        college: student ? student.college : 'Vignan University',
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
        cycle.paid_amount = Number(cycle.paid_amount || 0) + amount;
        cycle.payment_date = paymentDate;
      }

      saveStore();
      return newPayment;
    },

    resetToClean() {
      store = getCleanInitialState();
      saveStore();
    }
  };

  window.MockData = MockData;
})();
