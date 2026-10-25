/**
 * API Client Module
 * Centralizes all network requests, JWT header attachment, and response normalization.
 * Includes automatic Mock Data Fallback for GitHub Pages and static deployments.
 */
const API = {
  isStaticHost: (function() {
    if (typeof window === 'undefined' || !window.location) return false;
    return window.location.hostname.endsWith('github.io') || window.location.protocol === 'file:';
  })(),

  baseUrl: (function() {
    if (typeof window !== 'undefined' && window.location) {
      const customApi = localStorage.getItem('pg_hostel_api_url');
      if (customApi) return customApi;
      if (window.location.protocol === 'file:') return 'http://localhost:5000/api';
    }
    return '/api';
  })(),

  getToken() {
    return localStorage.getItem('pg_hostel_token');
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('pg_hostel_token', token);
    } else {
      localStorage.removeItem('pg_hostel_token');
    }
  },

  getUser() {
    try {
      const u = localStorage.getItem('pg_hostel_user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  },

  setUser(user) {
    if (user) {
      localStorage.setItem('pg_hostel_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('pg_hostel_user');
    }
  },

  getStudent() {
    try {
      const user = this.getUser();
      if (user && user.role === 'student' && typeof MockData !== 'undefined' && Array.isArray(MockData.students)) {
        const found = MockData.students.find(s => 
          Number(s.id) === Number(user.id) || 
          (s.reg_number && user.username && s.reg_number.trim().toLowerCase() === user.username.trim().toLowerCase())
        );
        if (found) {
          const enhanced = {
            ...found,
            joiningDateDisplay: found.joiningDateDisplay || (found.joining_date ? Utils.formatDate(found.joining_date) : 'Today')
          };
          localStorage.setItem('pg_hostel_student', JSON.stringify(enhanced));
          return enhanced;
        }
      }
      const s = localStorage.getItem('pg_hostel_student');
      return s ? JSON.parse(s) : null;
    } catch (e) {
      return null;
    }
  },

  setStudent(student) {
    if (student) {
      localStorage.setItem('pg_hostel_student', JSON.stringify(student));
    } else {
      localStorage.removeItem('pg_hostel_student');
    }
  },

  /**
   * Handle mock data responses for GitHub Pages static hosting
   */
  handleMockResponse(endpoint, options = {}) {
    if (typeof MockData === 'undefined') {
      throw new Error('Static demo mode: MockData module not loaded.');
    }

    const cleanEndpoint = endpoint.split('?')[0];
    const method = (options.method || 'GET').toUpperCase();

    // 1. Authentication
    if (cleanEndpoint === '/auth/login' && method === 'POST') {
      let body = {};
      try {
        body = typeof options.body === 'string' ? JSON.parse(options.body) : (options.body || {});
      } catch (e) {}

      const inputUser = (body.username || '').trim();
      const inputPass = (body.password || '').trim();

      if (!inputUser || !inputPass) {
        throw new Error('Please enter both username and password.');
      }

      const uLower = inputUser.toLowerCase();

      // Case A: Administrator / Warden Login
      if (uLower === 'admin' || uLower === 'admin@hostel.com' || uLower === 'warden') {
        const adminUser = MockData.adminUser || {
          id: 1,
          username: 'admin',
          email: 'admin@hostel.com',
          role: 'admin',
          name: 'Hostel Chief Warden',
          phone: '+91 98111 22334',
          avatar: './assets/images/default-avatar.png'
        };

        return {
          success: true,
          token: 'demo-jwt-token-admin',
          user: adminUser,
          message: 'Welcome Warden! Logged into SRI RAM PG.'
        };
      }

      // Case B: Student Login by Registration Number, Email, Phone, or Name
      const students = MockData.students || [];
      const student = students.find(s =>
        (s.reg_number && s.reg_number.toLowerCase() === uLower) ||
        (s.email && s.email.toLowerCase() === uLower) ||
        (s.phone && s.phone.replace(/\D/g, '') === inputUser.replace(/\D/g, '')) ||
        (s.name && s.name.toLowerCase() === uLower)
      );

      if (student) {
        // Password verification:
        // Default password is their Registration Number (case-insensitive) OR custom password if changed
        const savedPass = String(student.password || student.reg_number || '').trim();
        const inputPLower = inputPass.toLowerCase();
        const isMatch = (inputPLower === savedPass.toLowerCase()) ||
                        (inputPLower === String(student.reg_number || '').trim().toLowerCase()) ||
                        (inputPass === 'student123') ||
                        (inputPass === 'password') ||
                        (inputPass === (student.phone || '').replace(/\D/g, ''));

        if (!isMatch) {
          throw new Error('Incorrect password. Please use your Registration Number as password.');
        }

        const studentUser = {
          id: student.id,
          username: student.reg_number,
          email: student.email || `${student.reg_number.toLowerCase()}@vignan.ac.in`,
          role: 'student',
          name: student.name,
          phone: student.phone,
          avatar: student.photo_url || './assets/images/default-student.png'
        };

        const studentProfile = {
          ...student,
          user_id: student.id,
          joiningDateDisplay: student.joiningDateDisplay || (student.joining_date ? Utils.formatDate(student.joining_date) : 'Today')
        };

        return {
          success: true,
          token: `demo-jwt-token-student-${student.id}`,
          user: studentUser,
          student: studentProfile,
          message: `Welcome ${student.name}! Logged into SRI RAM PG.`
        };
      }

      // If no student found with that registration number
      throw new Error(`Invalid credentials. No active student found with Registration Number "${inputUser}". Please verify with the Warden.`);
    }

    if (cleanEndpoint === '/auth/change-password' && method === 'POST') {
      let body = {};
      try {
        body = typeof options.body === 'string' ? JSON.parse(options.body) : (options.body || {});
      } catch (e) {}

      const currentUser = this.getUser();
      if (currentUser && currentUser.role === 'student') {
        const student = (MockData.students || []).find(s => s.id === currentUser.id || s.reg_number === currentUser.username);
        if (student) {
          student.password = body.newPassword;
          if (MockData.saveStore) MockData.saveStore();
        }
      }

      return {
        success: true,
        message: 'Password updated successfully!'
      };
    }

    if (cleanEndpoint === '/auth/me') {
      const currentUser = this.getUser() || MockData.adminUser;
      let currentStudent = null;
      if (currentUser && currentUser.role === 'student') {
        const students = MockData.students || [];
        currentStudent = this.getStudent() || students.find(s => s.id === currentUser.id || s.reg_number === currentUser.username) || students[0] || null;
      }
      return {
        success: true,
        user: currentUser,
        student: currentStudent
      };
    }

    // 2. Dashboard
    if (cleanEndpoint === '/dashboard/stats') {
      return { success: true, data: MockData.stats };
    }
    if (cleanEndpoint === '/dashboard/charts') {
      return { success: true, data: MockData.charts };
    }

    // 3. Students
    if (cleanEndpoint === '/students' && method === 'POST') {
      let data = {};
      if (options.body instanceof FormData) {
        options.body.forEach((val, key) => { data[key] = val; });
      } else if (typeof options.body === 'string') {
        try { data = JSON.parse(options.body); } catch(e) {}
      } else {
        data = options.body || {};
      }
      const newStudent = MockData.addStudent ? MockData.addStudent(data) : data;
      return {
        success: true,
        message: 'Student registered and bed allocated successfully!',
        data: newStudent
      };
    }

    if (cleanEndpoint.startsWith('/students/') && method === 'DELETE') {
      const sId = cleanEndpoint.replace('/students/', '');
      if (MockData.deleteStudent) MockData.deleteStudent(sId);
      return {
        success: true,
        message: 'Student record removed and bed released.'
      };
    }

    if (cleanEndpoint === '/students/me') {
      const myStudent = this.getStudent();
      if (!myStudent) {
        return { success: false, message: 'Student profile not found.' };
      }
      const sId = Number(myStudent.id);
      const studentFeeCycles = (MockData.feeCycles || []).filter(c => Number(c.student_id) === sId);
      const studentPayments = (MockData.payments || []).filter(p => Number(p.student_id) === sId);
      const studentComplaints = (MockData.complaints || []).filter(c => 
        Number(c.student_id) === sId || (c.reg_number && myStudent.reg_number && c.reg_number.toLowerCase() === myStudent.reg_number.toLowerCase())
      );
      const studentLeaves = (MockData.leaveRequests || []).filter(l => Number(l.student_id) === sId);

      return {
        success: true,
        data: {
          profile: myStudent,
          student: myStudent,
          feeCycles: studentFeeCycles,
          payments: studentPayments,
          complaints: studentComplaints,
          leaveRequests: studentLeaves,
          nextDueInfo: {
            dueDate: myStudent.joining_date,
            status: myStudent.fee_status || 'pending'
          }
        },
        student: myStudent
      };
    }

    if (cleanEndpoint === '/students') {
      const currentUser = this.getUser();
      if (currentUser && currentUser.role === 'student') {
        const student = this.getStudent();
        const list = student ? [student] : [];
        return {
          success: true,
          data: list,
          pagination: { total: list.length, page: 1, limit: 15, totalPages: 1 }
        };
      }

      let list = [...MockData.students];
      try {
        const urlObj = new URL('http://dummy' + endpoint);
        const search = (urlObj.searchParams.get('search') || '').toLowerCase().trim();
        const floor = urlObj.searchParams.get('floor');
        const feeStatus = urlObj.searchParams.get('feeStatus');

        if (search) {
          list = list.filter(s => 
            (s.name && s.name.toLowerCase().includes(search)) ||
            (s.reg_number && s.reg_number.toLowerCase().includes(search)) ||
            (s.college && s.college.toLowerCase().includes(search)) ||
            (s.course && s.course.toLowerCase().includes(search)) ||
            (s.room_number && String(s.room_number).includes(search)) ||
            (s.phone && s.phone.includes(search))
          );
        }
        if (floor) {
          list = list.filter(s => String(s.floor_number) === String(floor));
        }
        if (feeStatus) {
          list = list.filter(s => s.fee_status === feeStatus);
        }
      } catch (e) {}

      return {
        success: true,
        data: list,
        pagination: { total: list.length, page: 1, limit: 15, totalPages: 1 }
      };
    }
    if (cleanEndpoint.startsWith('/students/') && cleanEndpoint.endsWith('/fee-status') && method === 'PUT') {
      const parts = cleanEndpoint.split('/');
      const sId = Number(parts[2]);
      let body = {};
      try {
        body = typeof options.body === 'string' ? JSON.parse(options.body) : (options.body || {});
      } catch (e) {}

      if (MockData.updateStudentFeeStatus) {
        MockData.updateStudentFeeStatus(sId, body.feeStatus, body);
      }
      return {
        success: true,
        message: `Student fee status successfully updated to ${body.feeStatus === 'paid' ? 'Paid' : 'Pending'}!`
      };
    }

    if (cleanEndpoint.startsWith('/students/')) {
      let sId = Number(cleanEndpoint.replace('/students/', ''));
      const currentUser = this.getUser();
      if (currentUser && currentUser.role === 'student') {
        const myStudent = this.getStudent();
        if (myStudent) {
          sId = Number(myStudent.id);
        }
      }
      const student = MockData.students.find(s => s.id === sId) || (currentUser && currentUser.role === 'student' ? this.getStudent() : MockData.studentProfile);
      const studentFeeCycles = (MockData.feeCycles || []).filter(c => Number(c.student_id) === sId);
      const studentPayments = (MockData.payments || []).filter(p => Number(p.student_id) === sId);
      const studentComplaints = (MockData.complaints || []).filter(c => 
        Number(c.student_id) === sId ||
        (student && student.reg_number && c.reg_number === student.reg_number)
      );
      const studentLeaves = (MockData.leaveRequests || []).filter(l => Number(l.student_id) === sId);

      return {
        success: true,
        data: {
          profile: student,
          student: student,
          feeCycles: studentFeeCycles,
          payments: studentPayments,
          complaints: studentComplaints,
          leaveRequests: studentLeaves,
          nextDueInfo: {
            dueDate: student ? student.joining_date : null,
            status: student ? student.fee_status : 'pending'
          }
        },
        student: student
      };
    }

    if (cleanEndpoint === '/system/reset-clean') {
      if (MockData.resetToClean) MockData.resetToClean();
      return {
        success: true,
        message: 'All sample data removed! Starting fresh with 0 students and 250 available beds.'
      };
    }

    // 4. Hostel Structure & Rooms
    if (cleanEndpoint === '/rooms/beds/transfer' && method === 'POST') {
      let body = {};
      try {
        body = typeof options.body === 'string' ? JSON.parse(options.body) : (options.body || {});
      } catch (e) {}
      if (MockData.transferStudent) {
        MockData.transferStudent(body.studentId, body.targetBedId, body.reason);
      }
      return { success: true, message: 'Student transferred successfully!' };
    }

    if (cleanEndpoint.startsWith('/rooms/beds/') && cleanEndpoint.endsWith('/status') && method === 'PUT') {
      const parts = cleanEndpoint.split('/');
      const bedId = parts[3];
      let body = {};
      try {
        body = typeof options.body === 'string' ? JSON.parse(options.body) : (options.body || {});
      } catch (e) {}
      if (MockData.updateBedStatus) {
        MockData.updateBedStatus(bedId, body.status);
      }
      return { success: true, message: `Bed status updated to ${body.status}` };
    }

    if (cleanEndpoint === '/rooms/options/available') {
      return { success: true, data: MockData.availableBeds || [] };
    }
    if (cleanEndpoint === '/rooms/structure') {
      return { success: true, data: MockData.structure };
    }
    if (cleanEndpoint === '/floors') {
      return { success: true, data: MockData.structure };
    }
    if (cleanEndpoint.startsWith('/rooms/')) {
      const rNum = cleanEndpoint.replace('/rooms/', '');
      const details = MockData.getRoomDetails ? MockData.getRoomDetails(rNum) : null;
      if (details) {
        return { success: true, data: details };
      }
      return {
        success: true,
        data: {
          room: { room_number: rNum, capacity: 5, occupied_count: 0, type: 'Standard 5-Bed' },
          beds: [
            { id: 1, bed_number: 1, bed_label: 'Bed-A', status: 'available' },
            { id: 2, bed_number: 2, bed_label: 'Bed-B', status: 'available' },
            { id: 3, bed_number: 3, bed_label: 'Bed-C', status: 'available' },
            { id: 4, bed_number: 4, bed_label: 'Bed-D', status: 'available' },
            { id: 5, bed_number: 5, bed_label: 'Bed-E', status: 'available' }
          ]
        }
      };
    }

    // 5. Fees & Payments
    if (cleanEndpoint === '/fees/cycles' || cleanEndpoint === '/fees') {
      const currentUser = this.getUser();
      let list = [...(MockData.feeCycles || [])];
      if (currentUser && currentUser.role === 'student') {
        const student = this.getStudent();
        if (student) {
          const sId = Number(student.id);
          const sReg = (student.reg_number || '').trim().toLowerCase();
          list = list.filter(c => Number(c.student_id) === sId || (c.reg_number && c.reg_number.toLowerCase() === sReg));
        } else {
          list = [];
        }
      }

      try {
        const urlObj = new URL('http://dummy' + endpoint);
        const search = (urlObj.searchParams.get('search') || '').toLowerCase().trim();
        const status = (urlObj.searchParams.get('status') || '').toLowerCase().trim();

        if (search) {
          list = list.filter(c => 
            (c.student_name && c.student_name.toLowerCase().includes(search)) ||
            (c.reg_number && c.reg_number.toLowerCase().includes(search)) ||
            (c.room_number && String(c.room_number).includes(search))
          );
        }

        if (status) {
          if (status === 'paid') {
            list = list.filter(c => c.status === 'paid');
          } else if (status === 'pending') {
            list = list.filter(c => c.status !== 'paid');
          }
        }
      } catch (e) {}

      return {
        success: true,
        data: list,
        pagination: { total: list.length, page: 1, limit: 15, totalPages: 1 }
      };
    }

    if (cleanEndpoint === '/fees/reminders') {
      const currentUser = this.getUser();
      let cycles = MockData.feeCycles || [];
      if (currentUser && currentUser.role === 'student') {
        const student = this.getStudent();
        if (student) {
          const sId = Number(student.id);
          const sReg = (student.reg_number || '').trim().toLowerCase();
          cycles = cycles.filter(c => Number(c.student_id) === sId || (c.reg_number && c.reg_number.toLowerCase() === sReg));
        } else {
          cycles = [];
        }
      }

      const paidCount = cycles.filter(c => c.status === 'paid').length;
      const pendingCycles = cycles.filter(c => c.status !== 'paid');
      const dueSoonCount = pendingCycles.length;
      let pendingTotal = 0;
      pendingCycles.forEach(c => {
        pendingTotal += Math.max(0, Number(c.amount || 0) - Number(c.paid_amount || 0));
      });

      return {
        success: true,
        data: {
          summary: {
            dueSoonCount: dueSoonCount,
            overdueCount: 0,
            dueTodayCount: 0,
            paidCount: paidCount,
            pendingTotal: pendingTotal
          }
        }
      };
    }

    if (cleanEndpoint.startsWith('/fees/student/')) {
      let sId = Number(cleanEndpoint.replace('/fees/student/', ''));
      const currentUser = this.getUser();
      if (currentUser && currentUser.role === 'student') {
        const myStudent = this.getStudent();
        if (myStudent) {
          sId = Number(myStudent.id);
        }
      }
      const student = (MockData.students || []).find(s => Number(s.id) === sId) || this.getStudent() || {};
      const allCycles = MockData.feeCycles || [];
      const studentCycles = allCycles.filter(c => Number(c.student_id) === sId);
      const studentPayments = (MockData.payments || []).filter(p => Number(p.student_id) === sId);

      const enhancedCycles = studentCycles.map(c => {
        const payment = studentPayments.find(p => p.fee_cycle_id === c.id || (p.student_id === sId && p.cycle_start_date === c.start_date));
        const isPaid = c.status === 'paid';
        return {
          ...c,
          startDateDisplay: c.startDateDisplay || (c.start_date ? Utils.formatDate(c.start_date) : '-'),
          endDateDisplay: c.endDateDisplay || (c.end_date ? Utils.formatDate(c.end_date) : '-'),
          dueDateDisplay: c.dueDateDisplay || (c.due_date ? Utils.formatDate(c.due_date) : '-'),
          payment_id: payment ? payment.id : (isPaid ? c.id : null),
          reminder: {
            label: isPaid ? 'Paid' : 'Payment Due',
            badgeClass: isPaid ? 'badge-success' : 'badge-danger'
          }
        };
      });

      const pendingCycle = enhancedCycles.find(c => c.status !== 'paid');
      const isAllPaid = !pendingCycle && enhancedCycles.length > 0;
      const today = new Date().toISOString().slice(0, 10);
      const nextDue = pendingCycle
        ? {
            cycleNumber: pendingCycle.cycle_number,
            dueDate: pendingCycle.due_date,
            dueDateDisplay: pendingCycle.dueDateDisplay,
            amount: pendingCycle.amount,
            status: pendingCycle.status,
            reminder: pendingCycle.reminder
          }
        : {
            cycleNumber: enhancedCycles.length + 1,
            dueDate: student.joining_date || today,
            dueDateDisplay: student.joiningDateDisplay || (student.joining_date ? Utils.formatDate(student.joining_date) : 'Upcoming'),
            amount: Number(student.monthly_fee || 7000),
            status: 'paid',
            reminder: {
              label: 'All Paid',
              badgeClass: 'badge-success'
            }
          };

      return {
        success: true,
        data: {
          student,
          cycles: enhancedCycles,
          nextDueInfo: nextDue
        }
      };
    }

    if (cleanEndpoint === '/payments' && method === 'POST') {
      let data = {};
      if (options.body instanceof FormData) {
        options.body.forEach((val, key) => { data[key] = val; });
      } else if (typeof options.body === 'string') {
        try { data = JSON.parse(options.body); } catch(e) {}
      } else {
        data = options.body || {};
      }
      const payment = MockData.recordPayment ? MockData.recordPayment(data) : data;
      return {
        success: true,
        message: 'Payment recorded successfully! Receipt generated.',
        data: {
          ...payment,
          id: payment.id,
          paymentId: payment.id
        }
      };
    }

    if (cleanEndpoint.startsWith('/payments/')) {
      const pId = Number(cleanEndpoint.replace('/payments/', ''));
      const details = MockData.getPaymentDetails ? MockData.getPaymentDetails(pId) : null;
      if (details) {
        const currentUser = this.getUser();
        if (currentUser && currentUser.role === 'student') {
          const student = this.getStudent();
          if (student && Number(details.student_id) !== Number(student.id) && details.reg_number !== student.reg_number) {
            return { success: false, message: 'Unauthorized access to payment receipt.' };
          }
        }
        return { success: true, data: details };
      }
      return { success: false, message: 'Payment record not found.' };
    }

    if (cleanEndpoint === '/payments') {
      const currentUser = this.getUser();
      let list = [...(MockData.payments || [])];
      if (currentUser && currentUser.role === 'student') {
        const student = this.getStudent();
        if (student) {
          const sId = Number(student.id);
          const sReg = (student.reg_number || '').trim().toLowerCase();
          list = list.filter(p => Number(p.student_id) === sId || (p.reg_number && p.reg_number.toLowerCase() === sReg));
        } else {
          list = [];
        }
      }
      return {
        success: true,
        data: list,
        pagination: { total: list.length, page: 1, limit: 15, totalPages: 1 }
      };
    }

    // 6. Mess, Complaints, Expenses, Announcements, Visitors, Leaves
    if (cleanEndpoint === '/mess/menu' || cleanEndpoint === '/mess') {
      const schedule = MockData.messSchedule || {
        todayDayName: 'Monday',
        todayMenu: MockData.messMenu[0],
        weeklyMenu: MockData.messMenu
      };
      return { success: true, data: schedule };
    }

    if (cleanEndpoint.startsWith('/mess/') && method === 'PUT') {
      const dayOfWeek = decodeURIComponent(cleanEndpoint.replace('/mess/', ''));
      let body = {};
      try {
        body = typeof options.body === 'string' ? JSON.parse(options.body) : (options.body || {});
      } catch (e) {}
      if (MockData.updateMessMenu) {
        MockData.updateMessMenu(dayOfWeek, body);
      }
      return {
        success: true,
        message: `Mess menu for ${dayOfWeek} updated successfully!`
      };
    }

    if (cleanEndpoint === '/mess/feedback' && method === 'POST') {
      let body = {};
      try {
        body = typeof options.body === 'string' ? JSON.parse(options.body) : (options.body || {});
      } catch (e) {}
      if (MockData.addMessFeedback) {
        MockData.addMessFeedback(body);
      }
      return {
        success: true,
        message: 'Feedback submitted successfully to the Hostel Food & Mess Committee!'
      };
    }
    if (cleanEndpoint.startsWith('/complaints/') && cleanEndpoint.endsWith('/status') && method === 'PUT') {
      const parts = cleanEndpoint.split('/');
      const cId = parts[2];
      let body = {};
      try {
        body = typeof options.body === 'string' ? JSON.parse(options.body) : (options.body || {});
      } catch (e) {}

      const updated = MockData.updateComplaintStatus ? MockData.updateComplaintStatus(cId, body.status, body.adminNotes) : null;
      return {
        success: true,
        message: `Complaint ticket #${cId} status updated to '${body.status}'.`,
        data: updated
      };
    }

    if (cleanEndpoint.startsWith('/complaints/') && method === 'DELETE') {
      const cId = cleanEndpoint.replace('/complaints/', '');
      if (MockData.deleteComplaint) MockData.deleteComplaint(cId);
      return {
        success: true,
        message: 'Complaint record removed successfully.'
      };
    }

    if (cleanEndpoint === '/complaints' && method === 'POST') {
      let body = {};
      if (options.body instanceof FormData) {
        options.body.forEach((val, key) => { body[key] = val; });
      } else if (typeof options.body === 'string') {
        try { body = JSON.parse(options.body); } catch(e) {}
      } else {
        body = options.body || {};
      }

      const newComp = MockData.addComplaint ? MockData.addComplaint(body) : body;
      return {
        success: true,
        message: 'Complaint submitted successfully! Warden & maintenance alerted.',
        data: newComp
      };
    }

    if (cleanEndpoint === '/complaints') {
      const currentUser = this.getUser();
      let list = [...(MockData.complaints || [])];
      if (currentUser && currentUser.role === 'student') {
        const student = this.getStudent();
        if (student) {
          const sId = Number(student.id);
          const sReg = (student.reg_number || '').trim().toLowerCase();

          list = list.filter(c => {
            const cId = Number(c.student_id);
            const cReg = String(c.reg_number || '').trim().toLowerCase();
            return (
              (sId && cId === sId) ||
              (sReg && cReg && cReg === sReg)
            );
          });
        } else {
          list = [];
        }
      }

      // Filter by category or status if provided in query string
      try {
        const urlObj = new URL('http://dummy' + endpoint);
        const cat = urlObj.searchParams.get('category');
        const st = urlObj.searchParams.get('status');
        if (cat) {
          list = list.filter(c => (c.category || '').toLowerCase() === cat.toLowerCase());
        }
        if (st) {
          const stLower = st.toLowerCase();
          list = list.filter(c => {
            const cSt = (c.status || '').toLowerCase();
            if (stLower === 'resolved' || stLower === 'solved') {
              return cSt === 'resolved' || cSt === 'solved';
            }
            if (stLower === 'in progress' || stLower === 'processing') {
              return cSt === 'in progress' || cSt === 'processing';
            }
            return cSt === stLower;
          });
        }
      } catch (e) {}

      return { success: true, data: list };
    }
    if (cleanEndpoint === '/expenses' && method === 'POST') {
      let data = {};
      try {
        data = typeof options.body === 'string' ? JSON.parse(options.body) : (options.body || {});
      } catch (e) {}
      const newExp = MockData.addExpense ? MockData.addExpense(data) : data;
      return {
        success: true,
        message: 'Hostel operating expense recorded successfully!',
        data: newExp
      };
    }

    if (cleanEndpoint.startsWith('/expenses/') && method === 'DELETE') {
      const eId = cleanEndpoint.replace('/expenses/', '');
      if (MockData.deleteExpense) MockData.deleteExpense(eId);
      return {
        success: true,
        message: 'Expense record deleted successfully!'
      };
    }

    if (cleanEndpoint === '/expenses') {
      let list = [...(MockData.expenses || [])];
      try {
        const urlObj = new URL('http://dummy' + endpoint);
        const category = urlObj.searchParams.get('category');
        if (category) {
          list = list.filter(e => e.category === category);
        }
      } catch (e) {}

      const stats = MockData.stats || {};
      const summary = {
        totalIncome: stats.feesCollected || 0,
        totalExpenses: stats.hostelExpenses || 0,
        netIncome: stats.netIncome || 0
      };

      return {
        success: true,
        data: list,
        summary: summary,
        pagination: { total: list.length, page: 1, limit: 15, totalPages: 1 }
      };
    }
    if (cleanEndpoint === '/announcements' && method === 'POST') {
      let body = {};
      try {
        body = typeof options.body === 'string' ? JSON.parse(options.body) : (options.body || {});
      } catch (e) {}

      const newAnn = MockData.addAnnouncement ? MockData.addAnnouncement(body) : body;
      return {
        success: true,
        message: 'Announcement published successfully!',
        data: newAnn,
        announcementId: newAnn.id
      };
    }

    if (cleanEndpoint.startsWith('/announcements/') && method === 'DELETE') {
      const parts = cleanEndpoint.split('/');
      const annId = Number(parts[2]);
      if (MockData.deleteAnnouncement) {
        MockData.deleteAnnouncement(annId);
      }
      return {
        success: true,
        message: 'Announcement deleted successfully.'
      };
    }

    if (cleanEndpoint === '/announcements') {
      return { success: true, data: MockData.announcements };
    }

    if (cleanEndpoint === '/visitors' && method === 'POST') {
      let body = {};
      try {
        body = typeof options.body === 'string' ? JSON.parse(options.body) : (options.body || {});
      } catch (e) {}

      const newVisitor = MockData.addVisitor ? MockData.addVisitor(body) : body;
      return {
        success: true,
        message: `Visitor entry logged successfully! Gate pass issued for ${newVisitor.visitor_name}.`,
        data: newVisitor
      };
    }

    if (cleanEndpoint.startsWith('/visitors/') && cleanEndpoint.endsWith('/checkout') && method === 'PUT') {
      const parts = cleanEndpoint.split('/');
      const vId = Number(parts[2]);
      const updated = MockData.checkoutVisitor ? MockData.checkoutVisitor(vId) : null;
      return {
        success: true,
        message: 'Visitor departure logged successfully.',
        data: updated
      };
    }

    if (cleanEndpoint === '/visitors') {
      const currentUser = this.getUser();
      let list = [...(MockData.visitors || [])];
      if (currentUser && currentUser.role === 'student') {
        const student = this.getStudent();
        if (student) {
          const sId = Number(student.id);
          const sReg = (student.reg_number || '').trim().toLowerCase();
          list = list.filter(v => Number(v.student_id) === sId || (v.reg_number && v.reg_number.toLowerCase() === sReg));
        } else {
          list = [];
        }
      }

      // Filter by status or search
      try {
        const urlObj = new URL('http://dummy' + endpoint);
        const search = (urlObj.searchParams.get('search') || '').toLowerCase().trim();
        const status = (urlObj.searchParams.get('status') || '').toLowerCase().trim();

        if (status) {
          list = list.filter(v => (v.status || '').toLowerCase() === status);
        }
        if (search) {
          list = list.filter(v => 
            (v.visitor_name && v.visitor_name.toLowerCase().includes(search)) ||
            (v.student_name && v.student_name.toLowerCase().includes(search)) ||
            (v.phone && v.phone.includes(search)) ||
            (v.reg_number && v.reg_number.toLowerCase().includes(search)) ||
            (v.room_number && String(v.room_number).includes(search))
          );
        }
      } catch (e) {}

      return { success: true, data: list };
    }

    if (cleanEndpoint.startsWith('/leave-requests/') && cleanEndpoint.endsWith('/status') && method === 'PUT') {
      const parts = cleanEndpoint.split('/');
      const lId = parts[2];
      let body = {};
      try {
        body = typeof options.body === 'string' ? JSON.parse(options.body) : (options.body || {});
      } catch (e) {}
      const updated = MockData.updateLeaveRequestStatus ? MockData.updateLeaveRequestStatus(lId, body.status, body.remarks) : null;
      return {
        success: true,
        message: `Leave request status updated to '${body.status}'.`,
        data: updated
      };
    }

    if (cleanEndpoint === '/leave-requests' && method === 'POST') {
      let body = {};
      try {
        body = typeof options.body === 'string' ? JSON.parse(options.body) : (options.body || {});
      } catch (e) {}

      const currentUser = this.getUser();
      const student = this.getStudent() || {};
      const newLeave = MockData.addLeaveRequest ? MockData.addLeaveRequest({
        ...body,
        student_id: student.id || (currentUser ? currentUser.id : 1),
        student_name: student.name || (currentUser ? currentUser.name : 'Resident'),
        reg_number: student.reg_number || (currentUser ? currentUser.username : ''),
        room_number: student.room_number,
        bed_label: student.bed_label
      }) : body;

      return {
        success: true,
        message: 'Leave application submitted successfully! Warden approval pending.',
        data: newLeave
      };
    }

    if (cleanEndpoint === '/leave-requests' || cleanEndpoint === '/leaves') {
      const currentUser = this.getUser();
      let list = [...(MockData.leaveRequests || [])];
      if (currentUser && currentUser.role === 'student') {
        const student = this.getStudent();
        if (student) {
          const sId = Number(student.id);
          const sReg = (student.reg_number || '').trim().toLowerCase();
          list = list.filter(l => Number(l.student_id) === sId || (l.reg_number && l.reg_number.toLowerCase() === sReg));
        } else {
          list = [];
        }
      }
      return { success: true, data: list };
    }

    if (cleanEndpoint.startsWith('/notifications/') && cleanEndpoint.endsWith('/read') && method === 'PUT') {
      const parts = cleanEndpoint.split('/');
      const notifId = parts[2];
      if (MockData.markNotificationRead) {
        MockData.markNotificationRead(notifId);
      }
      return { success: true, message: 'Notification marked as read.' };
    }

    if (cleanEndpoint === '/notifications/read-all' && method === 'PUT') {
      if (MockData.markAllNotificationsRead) {
        MockData.markAllNotificationsRead();
      }
      return { success: true, message: 'All notifications marked as read.' };
    }

    if (cleanEndpoint === '/notifications/clear-read' || (cleanEndpoint === '/notifications' && method === 'DELETE')) {
      if (MockData.clearReadNotifications) {
        MockData.clearReadNotifications();
      }
      return { success: true, message: 'Read notifications cleared.' };
    }

    if (cleanEndpoint === '/notifications') {
      const currentUser = this.getUser();
      let notifs = MockData.notifications || [];
      if (currentUser && currentUser.role === 'student') {
        const student = this.getStudent();
        const sId = student ? Number(student.id) : (currentUser ? Number(currentUser.id) : 0);
        const sReg = student ? (student.reg_number || '').toLowerCase() : (currentUser ? (currentUser.username || '').toLowerCase() : '');

        notifs = notifs.filter(n => {
          if (n.type === 'announcement' || n.link === '#announcements') return true;
          if (n.student_id && Number(n.student_id) === sId) return true;
          if (n.reg_number && String(n.reg_number).toLowerCase() === sReg) return true;
          const msg = (n.message || '') + ' ' + (n.title || '');
          if (sReg && msg.toLowerCase().includes(sReg)) return true;
          return false;
        });
      }
      const unreadCount = notifs.filter(n => !n.is_read || n.is_read === 0 || n.is_read === false).length;
      return {
        success: true,
        data: notifs,
        unreadCount: unreadCount
      };
    }

    // 7. AI Hostel Assistant Smart Query Engine (Context-Aware)
    if (cleanEndpoint === '/ai-assistant/query' || cleanEndpoint.startsWith('/ai-assistant')) {
      let body = {};
      try {
        body = typeof options.body === 'string' ? JSON.parse(options.body) : (options.body || {});
      } catch (e) {}

      const question = (body.question || '').trim();
      const q = question.toLowerCase();
      const currentUser = this.getUser() || MockData.adminUser;
      const isStudent = currentUser && currentUser.role === 'student';
      const student = isStudent ? (this.getStudent() || MockData.studentProfile) : null;
      const stats = MockData.stats || {};
      const students = MockData.students || [];
      const messSchedule = MockData.messSchedule || {};
      const complaints = MockData.complaints || [];
      const announcements = MockData.announcements || [];
      const settings = MockData.settings || {};
      const feeCycles = MockData.feeCycles || [];

      let answer = '';
      let category = 'general';
      let quickActions = [];

      // STUDENT CONTEXT
      if (isStudent && student) {
        // Privacy Guard: Prevent leakage of other students' info or administrative financial data
        if (q.includes('all student') || q.includes('other student') || q.includes('who lives in') || q.includes('who is in room') || q.includes('student list') || q.includes('total revenue') || q.includes('total expense') || q.includes('profit and loss') || q.includes('p&l')) {
          category = 'privacy';
          answer = `As a resident student, privacy policies ensure you only have access to your own personal profile, room assignment, fee records, and maintenance tickets. For administrative or hostel-wide inquiries, please consult the Warden's Office.`;
          quickActions = [
            { label: 'My Dashboard', link: '#student-dashboard' },
            { label: 'My Profile', link: '#student-profile' }
          ];
        }
        // Fee Due Query
        else if (q.includes('fee') || q.includes('due') || q.includes('pay') || q.includes('next fee') || q.includes('pending') || q.includes('rent') || q.includes('charge')) {
          category = 'fees';
          const studentCycles = feeCycles.filter(c => Number(c.student_id) === Number(student.id));
          const pendingCycle = studentCycles.find(c => c.status !== 'paid');

          if (pendingCycle) {
            answer = `Your monthly room fee of **₹${Number(pendingCycle.amount || student.monthly_fee || 7000).toLocaleString('en-IN')}** for billing cycle (${pendingCycle.startDateDisplay || pendingCycle.start_date} to ${pendingCycle.endDateDisplay || pendingCycle.end_date}) is due on **${pendingCycle.dueDateDisplay || pendingCycle.due_date}** (Status: **Pending**).`;
          } else if (student.fee_status === 'paid') {
            answer = `All your current fee cycles are fully **PAID**! Your monthly hostel fee is **₹${Number(student.monthly_fee || 7000).toLocaleString('en-IN')}**, calculated from your joining date (${student.joiningDateDisplay || student.joining_date}).`;
          } else {
            answer = `Your monthly hostel fee is **₹${Number(student.monthly_fee || 7000).toLocaleString('en-IN')}**. Current Status: **Pending**. Please clear your dues on or before your cycle due date.`;
          }

          quickActions = [
            { label: 'View Fee History', link: '#fees' },
            { label: 'Download Receipts', link: '#payments' }
          ];
        }
        // Room & Bed Query
        else if (q.includes('room') || q.includes('bed') || q.includes('floor') || q.includes('where do i stay') || q.includes('my room') || q.includes('my bed')) {
          category = 'room';
          answer = `You are currently allocated to **Room ${student.room_number || '101'}**, **${student.bed_label || 'Bed-A'}** on **Floor ${student.floor_number || 1}**.\n\nRoom Capacity: 5 beds with attached study desks and Wi-Fi 6 connectivity.`;
          quickActions = [{ label: 'View Hostel Matrix', link: '#hostel-structure' }];
        }
        // Mess / Dining Menu Query
        else if (q.includes('food') || q.includes('menu') || q.includes('mess') || q.includes('dinner') || q.includes('lunch') || q.includes('breakfast') || q.includes('snack') || q.includes('eat') || q.includes('meal')) {
          category = 'mess';
          const todayMenu = messSchedule.todayMenu || {};
          const dayName = messSchedule.todayDayName || 'Today';

          answer = `**Today's Mess Menu (${dayName}) — Vignan Vihar Boys Hostel:**\n\n` +
            `• **Breakfast (${todayMenu.breakfast_timing || '7:30 - 9:30 AM'}):**\n  ${todayMenu.breakfast || 'Tiffin & Tea'}\n` +
            `• **Lunch (${todayMenu.lunch_timing || '12:30 - 2:30 PM'}):**\n  ${todayMenu.lunch || 'Meals with Curries'}\n` +
            `• **Evening Snacks (${todayMenu.snacks_timing || '4:30 - 6:00 PM'}):**\n  ${todayMenu.snacks || 'Hot Snacks & Tea'}\n` +
            `• **Dinner (${todayMenu.dinner_timing || '7:30 - 9:30 PM'}):**\n  ${todayMenu.dinner || 'Dinner with Veg/Non-Veg'}\n` +
            (todayMenu.special_notes ? `\n• *Special Note:* ${todayMenu.special_notes}` : '');

          quickActions = [{ label: 'Full 7-Day Schedule', link: '#mess' }];
        }
        // Complaints & Maintenance Query
        else if (q.includes('complaint') || q.includes('ticket') || q.includes('wifi') || q.includes('tap') || q.includes('plumb') || q.includes('broken') || q.includes('repair') || q.includes('clean') || q.includes('fan') || q.includes('light') || q.includes('water') || q.includes('grievance') || q.includes('issue')) {
          category = 'complaint';
          const myComplaints = complaints.filter(c => 
            Number(c.student_id) === Number(student.id) ||
            (c.reg_number && c.reg_number === student.reg_number) ||
            (c.room_number && String(c.room_number) === String(student.room_number))
          );
          
          if (myComplaints.length > 0) {
            answer = `**Maintenance & Grievance Tickets for Room ${student.room_number || '-'} (${student.name}):**\n\n` +
              myComplaints.map(c => 
                `• **${c.title}** [${c.category}]\n` +
                `  Status: **${c.status}** | Date: ${c.createdAtDisplay || (c.created_at ? Utils.formatDate(c.created_at) : 'Recent')}\n` +
                `  Issue: ${c.description || '-'}\n` +
                (c.admin_notes ? `  *Warden Action Note:* ${c.admin_notes}` : '  *Warden Action Note:* Awaiting technician assignment.')
              ).join('\n\n') +
              `\n\nNeed to submit another issue? Click **Submit Ticket** below.`;
          } else {
            answer = `You currently have **no open complaints or maintenance tickets** filed for Room **${student.room_number || '-'}**.\n\n` +
              `If you are experiencing any issues with Wi-Fi, plumbing, electrical fittings, furniture, or housekeeping, click **Submit Ticket** below to alert the hostel maintenance team immediately.`;
          }
          quickActions = [
            { label: 'Submit Ticket', link: '#complaints' },
            { label: 'View Grievances', link: '#complaints' }
          ];
        }
        // Leave / Gate pass Query
        else if (q.includes('leave') || q.includes('out') || q.includes('gate pass') || q.includes('vacation') || q.includes('holiday') || q.includes('permission')) {
          category = 'leave';
          answer = `Hostel gate pass and outstation leave permissions can be requested via the **Leave Requests** tab. Specify your departure date, return date, reason, and guardian contact. Approvals are typically processed within 24 hours.`;
          quickActions = [{ label: 'Apply For Leave', link: '#leave-requests' }];
        }
        // Curfew & Rules
        else if (q.includes('rule') || q.includes('curfew') || q.includes('time') || q.includes('contact') || q.includes('warden') || q.includes('phone') || q.includes('emergency')) {
          category = 'rules';
          answer = `**SRI RAM PG Rules & Guidelines:**\n\n` +
            `• **Night Curfew:** ${settings.curfew_time || '10:00 PM'} (Gate closes strictly).\n` +
            `• **Visitor Hours:** 9:00 AM to 6:00 PM in the reception lounge only.\n` +
            `• **Warden Helpline:** ${settings.contact_phone || '+91 120 232 4000'}\n` +
            `• **Official Email:** ${settings.contact_email || 'warden@srirampg.in'}\n` +
            `• Quiet study hours are observed after 11:00 PM across all residential floors.`;
        }
        // Bulletins / Announcements
        else if (q.includes('bulletin') || q.includes('announc') || q.includes('notice') || q.includes('news')) {
          category = 'announcements';
          if (announcements.length > 0) {
            answer = `**Latest Hostel Bulletins:**\n\n` +
              announcements.slice(0, 3).map(a => `• **${a.title}** (${a.priority} Priority, ${a.publishedDateDisplay || 'Today'}):\n  ${a.content.slice(0, 110)}...`).join('\n\n');
          } else {
            answer = `There are no new bulletins at this time. All hostel operations are running on regular schedule.`;
          }
          quickActions = [{ label: 'Noticeboard', link: '#announcements' }];
        }
        // General Student Help
        else {
          answer = `Hello **${student.name || 'Resident'}**! I am your AI Hostel Assistant. You can ask me:\n\n` +
            `• *"When is my next fee due?"*\n` +
            `• *"What is today's mess menu?"*\n` +
            `• *"What is my room and bed number?"*\n` +
            `• *"How do I raise a maintenance complaint?"*\n` +
            `• *"What are the hostel curfew hours?"*`;
          quickActions = [
            { label: 'Today\'s Menu', link: '#mess' },
            { label: 'My Room', link: '#hostel-structure' },
            { label: 'Fee Status', link: '#fees' }
          ];
        }
      }
      // ADMIN / WARDEN CONTEXT
      else {
        // Room search (e.g. "room 101", "room 204")
        const roomMatch = q.match(/\broom\s*(\d{3})\b/i);
        if (roomMatch) {
          category = 'room_detail';
          const rNum = roomMatch[1];
          const roomStudents = students.filter(s => String(s.room_number) === String(rNum));
          answer = `**Room ${rNum} Status (Floor ${rNum.charAt(0)}):**\n\n` +
            `• Total Capacity: **5 Beds**\n` +
            `• Currently Occupied: **${roomStudents.length} / 5 Beds**\n` +
            `• Vacant Beds: **${5 - roomStudents.length} Beds**\n\n` +
            (roomStudents.length > 0
              ? `**Assigned Residents:**\n` + roomStudents.map(s => `• ${s.bed_label}: **${s.name}** (${s.college || 'Vignan'}, ${s.course || 'B.Tech'}) — Fee: **${(s.fee_status || 'pending').toUpperCase()}** (Ph: ${s.phone || '-'})`).join('\n')
              : `• No students are currently allocated to Room ${rNum}. All 5 beds (Bed-A to Bed-E) are ready for occupancy.`);

          quickActions = [
            { label: `View Room ${rNum}`, link: '#hostel-structure' },
            { label: 'Register Student', link: '#students' }
          ];
        }
        // Specific Student lookup
        else if (q.includes('student') && students.some(s => q.includes(s.name.toLowerCase()))) {
          category = 'student_lookup';
          const found = students.find(s => q.includes(s.name.toLowerCase()));
          answer = `**Student Profile: ${found.name}**\n\n` +
            `• Reg Number: **${found.reg_number}**\n` +
            `• Room & Bed: **Room ${found.room_number} (${found.bed_label})**, Floor ${found.floor_number}\n` +
            `• College & Course: **${found.college || 'Vignan'}** — ${found.course || 'B.Tech'}\n` +
            `• Monthly Fee: **₹${Number(found.monthly_fee || 7000).toLocaleString('en-IN')}** (Status: **${(found.fee_status || 'pending').toUpperCase()}**)\n` +
            `• Joining Date: **${found.joiningDateDisplay || found.joining_date}**\n` +
            `• Student Phone: **${found.phone || '-'}** | Parent Phone: **${found.parent_phone || '-'}**`;

          quickActions = [
            { label: 'View Profile', link: '#students' },
            { label: 'Fee Records', link: '#fees' }
          ];
        }
        // Occupancy & Bed Distribution
        else if (q.includes('occupan') || q.includes('bed') || q.includes('capacity') || q.includes('vacan') || q.includes('available') || q.includes('rooms')) {
          category = 'occupancy';
          answer = `**Hostel Occupancy & Bed Distribution:**\n\n` +
            `• Total Capacity: **${stats.totalBeds || 250} Beds** (50 rooms across 5 floors)\n` +
            `• Occupied Beds: **${stats.occupiedBeds || 0} Beds** (${stats.occupancyRate || 0}% occupancy)\n` +
            `• Available Beds: **${stats.availableBeds || 250} Beds** ready for admission\n` +
            `• Maintenance Beds: **${stats.maintenanceBeds || 0} Beds**`;

          quickActions = [
            { label: 'Floor Matrix', link: '#hostel-structure' },
            { label: 'Student Directory', link: '#students' }
          ];
        }
        // Financials / Income / Expenses / P&L
        else if (q.includes('fee') || q.includes('income') || q.includes('expense') || q.includes('profit') || q.includes('p&l') || q.includes('financial') || q.includes('collection') || q.includes('pending')) {
          category = 'financials';
          answer = `**Hostel Financial Summary (Live):**\n\n` +
            `• Total Fees Collected: **₹${Number(stats.feesCollected || 0).toLocaleString('en-IN')}**\n` +
            `• Total Operating Expenses: **₹${Number(stats.hostelExpenses || 0).toLocaleString('en-IN')}**\n` +
            `• **Net Operational Income (P&L):** **₹${Number(stats.netIncome || 0).toLocaleString('en-IN')}**\n` +
            `• Outstanding Pending Fees: **₹${Number(stats.pendingFees || 0).toLocaleString('en-IN')}** (${stats.pendingFeeStudentsCount || 0} student${stats.pendingFeeStudentsCount !== 1 ? 's' : ''} pending)`;

          quickActions = [
            { label: 'Operating Expenses & P&L', link: '#expenses' },
            { label: 'Fee Management', link: '#fees' },
            { label: 'Payment Receipts', link: '#payments' }
          ];
        }
        // Maintenance & Complaints
        else if (q.includes('complaint') || q.includes('ticket') || q.includes('repair') || q.includes('maintenance') || q.includes('grievance') || q.includes('issue') || q.includes('broken')) {
          category = 'complaints';
          const pendingCount = complaints.filter(c => c.status === 'Pending').length;
          const inProgressCount = complaints.filter(c => c.status === 'In Progress').length;
          const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;
          const activeComplaints = complaints.filter(c => c.status !== 'Resolved');

          answer = `**Hostel Grievances & Maintenance Status (Live):**\n\n` +
            `• **Pending Review:** **${pendingCount}** tickets\n` +
            `• **In Progress / Dispatched:** **${inProgressCount}** tickets\n` +
            `• **Resolved:** **${resolvedCount}** tickets\n\n` +
            (activeComplaints.length > 0
              ? `**Active Tickets Requiring Attention:**\n` +
                activeComplaints.slice(0, 5).map(c => 
                  `• **[${c.status}]** Room ${c.room_number || 'General'} (${c.student_name || 'Resident'}): **${c.title}** (${c.category})\n` +
                  `  *Details:* ${c.description ? c.description.slice(0, 90) + (c.description.length > 90 ? '...' : '') : '-'}` +
                  (c.admin_notes ? `\n  *Notes:* ${c.admin_notes}` : '')
                ).join('\n\n') +
                (activeComplaints.length > 5 ? `\n\n*+ ${activeComplaints.length - 5} more active tickets in queue.*` : '')
              : `All reported hostel facilities and maintenance tickets are currently **Resolved**.`);

          quickActions = [
            { label: 'Manage Complaints Console', link: '#complaints' }
          ];
        }
        // Mess / Dining Schedule
        else if (q.includes('food') || q.includes('mess') || q.includes('menu') || q.includes('lunch') || q.includes('dinner') || q.includes('breakfast')) {
          category = 'mess';
          const todayMenu = messSchedule.todayMenu || {};
          const dayName = messSchedule.todayDayName || 'Today';

          answer = `**Today's Mess Menu (${dayName}) — Vignan Vihar Boys Hostel:**\n\n` +
            `• **Breakfast (${todayMenu.breakfast_timing || '7:30 - 9:30 AM'}):** ${todayMenu.breakfast || '-'}\n` +
            `• **Lunch (${todayMenu.lunch_timing || '12:30 - 2:30 PM'}):** ${todayMenu.lunch || '-'}\n` +
            `• **Snacks (${todayMenu.snacks_timing || '4:30 - 6:00 PM'}):** ${todayMenu.snacks || '-'}\n` +
            `• **Dinner (${todayMenu.dinner_timing || '7:30 - 9:30 PM'}):** ${todayMenu.dinner || '-'}\n` +
            (todayMenu.special_notes ? `\n• *Special Note:* ${todayMenu.special_notes}` : '');

          quickActions = [{ label: 'Edit Mess Schedule', link: '#mess' }];
        }
        // Bulletins & Announcements
        else if (q.includes('bulletin') || q.includes('announc') || q.includes('notice') || q.includes('post')) {
          category = 'announcements';
          answer = `There are currently **${announcements.length} active bulletin${announcements.length !== 1 ? 's' : ''}** on the hostel notice board.\n\n` +
            (announcements.length > 0
              ? announcements.slice(0, 3).map(a => `• **${a.title}** (${a.priority} Priority, ${a.publishedDateDisplay || 'Today'})`).join('\n')
              : 'No active bulletins published.');

          quickActions = [
            { label: 'Post New Announcement', link: '#announcements' },
            { label: 'View Noticeboard', link: '#announcements' }
          ];
        }
        // General Warden Welcome / Help
        else {
          answer = `Hello Warden! I am your **AI Hostel Management Assistant**. You can ask me:\n\n` +
            `• *"What is the current bed occupancy rate?"*\n` +
            `• *"Give me a summary of hostel financials (P&L)"*\n` +
            `• *"How much fee is pending this month?"*\n` +
            `• *"Who is in room 101?"*\n` +
            `• *"What complaints need attention?"*\n` +
            `• *"What is today's mess menu?"*`;

          quickActions = [
            { label: 'Overview Dashboard', link: '#dashboard' },
            { label: 'Operating Expenses', link: '#expenses' },
            { label: 'Floor Matrix', link: '#hostel-structure' },
            { label: 'Fee Cycles', link: '#fees' }
          ];
        }
      }

      return {
        success: true,
        data: {
          question,
          answer,
          category,
          quickActions,
          timestamp: new Date().toISOString()
        }
      };
    }
    if (cleanEndpoint.startsWith('/reports/')) {
      const type = cleanEndpoint.replace('/reports/', '');
      const stats = MockData.stats || {};
      const students = MockData.students || [];
      const payments = MockData.payments || [];
      const cycles = MockData.feeCycles || [];

      if (type === 'collections' || type === 'income') {
        return {
          success: true,
          data: {
            title: type === 'collections' ? 'Fee Collections Ledger' : 'Financial Statement & Profit & Loss',
            summary: {
              'Fees Collected': Utils.formatINR(stats.feesCollected || 0),
              'Hostel Expenses': Utils.formatINR(stats.hostelExpenses || 0),
              'Net Realized': Utils.formatINR(stats.netIncome || 0)
            },
            columns: ['Receipt #', 'Date', 'Student Name', 'Reg No', 'Room', 'Payment Mode', 'Amount', 'Status'],
            rows: payments.map(p => [
              p.receipt_number || '-',
              Utils.formatDate(p.payment_date),
              p.student_name || '-',
              p.reg_number || '-',
              `Room ${p.room_number || '-'} (${p.bed_label || '-'})`,
              p.payment_method || 'UPI',
              Utils.formatINR(p.amount),
              'Settled'
            ])
          }
        };
      }

      if (type === 'expenses') {
        const expenses = MockData.expenses || [];
        return {
          success: true,
          data: {
            title: 'Hostel Operating Expenses Ledger',
            summary: {
              'Total Outflow': Utils.formatINR(stats.hostelExpenses || 0),
              'Expense Entries': expenses.length
            },
            columns: ['Voucher #', 'Date', 'Category', 'Description', 'Amount (INR)'],
            rows: expenses.map(e => [
              e.receipt_ref || '-',
              Utils.formatDate(e.date || e.expense_date),
              e.category || 'Other',
              e.description || '-',
              Utils.formatINR(e.amount)
            ])
          }
        };
      }

      if (type === 'dues') {
        const pendingCycles = cycles.filter(c => c.status !== 'paid');
        return {
          success: true,
          data: {
            title: 'Outstanding Fee Dues Report',
            summary: {
              'Pending Dues': Utils.formatINR(stats.pendingFees || 0),
              'Students with Dues': pendingCycles.length
            },
            columns: ['Student Name', 'Reg No', 'Room & Bed', 'College', 'Due Date', 'Monthly Fee', 'Due Amount'],
            rows: pendingCycles.map(c => [
              c.student_name || '-',
              c.reg_number || '-',
              `Room ${c.room_number || '-'} (${c.bed_label || '-'})`,
              c.college || 'Vignan University',
              c.dueDateDisplay || c.due_date || '-',
              Utils.formatINR(c.amount),
              Utils.formatINR(Math.max(0, Number(c.amount || 0) - Number(c.paid_amount || 0)))
            ])
          }
        };
      }

      if (type === 'visitors') {
        const visitors = MockData.visitors || [];
        return {
          success: true,
          data: {
            title: 'Hostel Visitor Gate Registry Log',
            summary: {
              'Total Visitors Logged': visitors.length,
              'Currently In Hostel': visitors.filter(v => v.status === 'in_hostel').length
            },
            columns: ['Visitor Name', 'Phone', 'Student Visited', 'Reg Number', 'Room', 'Relationship', 'Purpose', 'Entry Time', 'Exit Time', 'Status'],
            rows: visitors.map(v => [
              v.visitor_name || '-',
              v.phone || '-',
              v.student_name || '-',
              v.reg_number || '-',
              v.room_number ? `Room ${v.room_number}` : '-',
              v.relation || '-',
              v.purpose || '-',
              v.entryTimeDisplay || '-',
              v.exitTimeDisplay || '-',
              v.status === 'in_hostel' ? 'In Hostel' : 'Checked Out'
            ])
          }
        };
      }

      // Default fallback report
      return {
        success: true,
        data: {
          title: 'Student Residency Directory',
          summary: {
            'Enrolled Students': stats.totalStudents || 0,
            'Total Beds': stats.totalBeds || 250,
            'Occupancy Rate': `${stats.occupancyRate || 0}%`
          },
          columns: ['Student Name', 'Reg No', 'Room', 'Bed', 'College', 'Course', 'Joining Date', 'Fee Status'],
          rows: students.map(s => [
            s.name || '-',
            s.reg_number || '-',
            s.room_number || '-',
            s.bed_label || '-',
            s.college || '-',
            s.course || '-',
            s.joining_date ? Utils.formatDate(s.joining_date) : '-',
            s.fee_status === 'paid' ? 'Paid' : 'Pending'
          ])
        }
      };
    }

    if (cleanEndpoint === '/settings') {
      return { success: true, data: MockData.settings };
    }

    // Fallback for actions (POST/PUT/DELETE)
    return {
      success: true,
      message: 'Action simulated successfully in Demo Mode.'
    };
  },

  async request(endpoint, options = {}) {
    // If hosted on GitHub Pages and no custom backend URL is configured, use mock response directly
    if (this.isStaticHost && !localStorage.getItem('pg_hostel_api_url')) {
      return this.handleMockResponse(endpoint, options);
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = options.headers || {};

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers
    };

    try {
      const res = await fetch(url, config);

      // Status 405 (Method Not Allowed) happens when POSTing to static GitHub Pages
      if (res.status === 405 && window.location.hostname.endsWith('github.io')) {
        console.warn('[API] GitHub Pages static host returned 405. Falling back to Demo Mode data.');
        return this.handleMockResponse(endpoint, options);
      }

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        this.setToken(null);
        this.setUser(null);
        this.setStudent(null);
        if (window.App && typeof window.App.navigate === 'function') {
          window.App.navigate('login');
        }
        throw new Error(data.message || 'Session expired. Please log in again.');
      }

      if (!res.ok) {
        throw new Error(data.message || `Request failed with status ${res.status}`);
      }

      return data;
    } catch (err) {
      // If network fails (e.g. backend not running or static CDN error)
      if (window.location.hostname.endsWith('github.io') || window.location.protocol === 'file:') {
        console.warn('[API Fallback] Request failed, using Demo Mode mock data for:', endpoint);
        return this.handleMockResponse(endpoint, options);
      }
      console.error(`[API Error] ${endpoint}:`, err.message);
      throw err;
    }
  },

  get(endpoint, params = {}) {
    const qs = new URLSearchParams(params).toString();
    const url = qs ? `${endpoint}?${qs}` : endpoint;
    return this.request(url, { method: 'GET' });
  },

  post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data)
    });
  },

  put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data)
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};

window.API = API;
