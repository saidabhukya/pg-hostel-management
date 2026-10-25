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

      const username = (body.username || '').trim().toLowerCase();
      if (username === 'admin') {
        return {
          success: true,
          token: 'demo-jwt-token-admin',
          user: MockData.adminUser,
          message: 'Welcome Warden! Logged into SRI RAM PG (Demo Mode)'
        };
      } else {
        return {
          success: true,
          token: 'demo-jwt-token-student',
          user: MockData.studentUser,
          student: MockData.studentProfile,
          message: 'Welcome Ravi Kumar! Logged into SRI RAM PG (Demo Mode)'
        };
      }
    }

    if (cleanEndpoint === '/auth/me') {
      const currentUser = this.getUser() || MockData.adminUser;
      return {
        success: true,
        user: currentUser,
        student: currentUser.role === 'student' ? (this.getStudent() || MockData.studentProfile) : null
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

    if (cleanEndpoint === '/students') {
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
    if (cleanEndpoint.startsWith('/students/')) {
      const sId = Number(cleanEndpoint.replace('/students/', ''));
      const student = MockData.students.find(s => s.id === sId) || MockData.studentProfile;
      return {
        success: true,
        data: student,
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
      let list = [...(MockData.feeCycles || [])];
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
      const cycles = MockData.feeCycles || [];
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
        return { success: true, data: details };
      }
      return { success: false, message: 'Payment record not found.' };
    }

    if (cleanEndpoint === '/payments') {
      return {
        success: true,
        data: MockData.payments,
        pagination: { total: MockData.payments.length, page: 1, limit: 15, totalPages: 1 }
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
    if (cleanEndpoint === '/complaints') {
      return { success: true, data: MockData.complaints };
    }
    if (cleanEndpoint === '/expenses') {
      return { success: true, data: MockData.expenses };
    }
    if (cleanEndpoint === '/announcements') {
      return { success: true, data: MockData.announcements };
    }
    if (cleanEndpoint === '/visitors') {
      return { success: true, data: MockData.visitors };
    }
    if (cleanEndpoint === '/leave-requests' || cleanEndpoint === '/leaves') {
      return { success: true, data: MockData.leaveRequests };
    }
    if (cleanEndpoint === '/notifications') {
      return {
        success: true,
        data: [
          { id: 1, title: 'Demo Mode Active', message: 'You are exploring the live UI in GitHub Pages demo mode.', read: false, created_at: 'Just now' }
        ]
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
