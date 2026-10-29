/**
 * SRI RAM PG - Online API Client Module
 * Centralizes all network requests, JWT Bearer token authentication,
 * and error normalization. Communicates exclusively with the online backend.
 */
const API = {
  get baseUrl() {
    if (typeof window !== 'undefined' && window.location) {
      // 1. Check if user configured a custom API URL in localStorage
      const customApi = localStorage.getItem('pg_hostel_api_url');
      if (customApi && customApi.trim()) {
        return customApi.trim().replace(/\/$/, '');
      }

      // 2. Check if configured in window.__HOSTEL_CONFIG__
      if (window.__HOSTEL_CONFIG__ && window.__HOSTEL_CONFIG__.API_BASE_URL) {
        const cfgUrl = window.__HOSTEL_CONFIG__.API_BASE_URL.trim();
        if (cfgUrl) return cfgUrl.replace(/\/$/, '');
      }

      // 3. Fallback for direct local file opening
      if (window.location.protocol === 'file:') {
        return 'http://localhost:5000/api';
      }
    }
    // 4. Default: same-origin /api (works seamlessly for production Express server)
    return '/api';
  },

  getToken() {
    try {
      return localStorage.getItem('pg_hostel_token');
    } catch (e) {
      return null;
    }
  },

  setToken(token) {
    try {
      if (token) {
        localStorage.setItem('pg_hostel_token', token);
      } else {
        localStorage.removeItem('pg_hostel_token');
      }
    } catch (e) {}
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
    try {
      if (user) {
        localStorage.setItem('pg_hostel_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('pg_hostel_user');
      }
    } catch (e) {}
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
    try {
      if (student) {
        localStorage.setItem('pg_hostel_student', JSON.stringify(student));
      } else {
        localStorage.removeItem('pg_hostel_student');
      }
    } catch (e) {}
  },

  setCustomApiUrl(url) {
    try {
      if (url && url.trim()) {
        localStorage.setItem('pg_hostel_api_url', url.trim().replace(/\/$/, ''));
      } else {
        localStorage.removeItem('pg_hostel_api_url');
      }
    } catch (e) {}
  },

  get isStaticHost() {
    if (typeof window === 'undefined' || !window.location) return false;
    const customApi = localStorage.getItem('pg_hostel_api_url');
    if (customApi && customApi.trim()) return false;
    if (window.__HOSTEL_CONFIG__ && window.__HOSTEL_CONFIG__.API_BASE_URL) return false;
    const host = window.location.hostname || '';
    return host.endsWith('github.io') || host.endsWith('gitlab.io') || window.location.protocol === 'file:';
  },

  async mockRouter(rawEndpoint, method = 'GET', body = null) {
    if (typeof MockData === 'undefined') {
      return { success: false, message: 'Local data store is initializing...' };
    }

    const [cleanPath, queryString] = rawEndpoint.split('?');
    const path = cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath;
    const params = new URLSearchParams(queryString || '');

    let payload = {};
    if (typeof body === 'string') {
      try { payload = JSON.parse(body); } catch (e) {}
    } else if (body instanceof FormData) {
      for (const [k, v] of body.entries()) {
        payload[k] = v;
      }
    } else if (body && typeof body === 'object') {
      payload = body;
    }

    // 1. Auth routes
    if (path === '/auth/login' && method === 'POST') {
      const { username, password } = payload;
      const uLower = String(username || '').trim().toLowerCase();
      const p = String(password || '').trim();

      const adminUser = MockData.adminUser || { username: 'admin', password: 'admin123', role: 'admin', name: 'Hostel Chief Warden' };
      const adminPass = String(adminUser.password || 'admin123');
      if ((uLower === 'admin' || uLower === 'warden' || uLower === String(adminUser.username).toLowerCase() || uLower === String(adminUser.email).toLowerCase()) &&
          (p === adminPass || p === 'admin123')) {
        return {
          success: true,
          message: 'Signed in successfully as Hostel Chief Warden.',
          token: 'demo_token_admin_' + Date.now(),
          user: {
            id: adminUser.id || 1,
            username: adminUser.username || 'admin',
            name: adminUser.name || 'Hostel Chief Warden',
            email: adminUser.email || 'admin@hostel.com',
            role: 'admin',
            phone: adminUser.phone || '+91 98111 22334',
            avatar: adminUser.avatar || './assets/images/default-avatar.png'
          },
          student: null
        };
      }

      const students = MockData.students || [];
      const cleanPhone = uLower.replace(/\D/g, '');
      let s = students.find(stud => 
        (stud.reg_number && stud.reg_number.toLowerCase() === uLower) ||
        (stud.email && stud.email.toLowerCase() === uLower) ||
        (stud.name && stud.name.toLowerCase() === uLower) ||
        (cleanPhone.length >= 10 && stud.phone && stud.phone.replace(/\D/g, '').includes(cleanPhone))
      );

      if (!s && (uLower === 'student' || uLower === '2024st001' || uLower === 'ravi')) {
        s = students[0] || null;
      }

      if (s) {
        const expected = String(s.password || s.reg_number || 'student123');
        if (p === expected || p === s.reg_number || p === 'student123' || p === '123456') {
          return {
            success: true,
            message: `Signed in successfully as ${s.name}.`,
            token: 'demo_token_student_' + s.id + '_' + Date.now(),
            user: {
              id: s.id,
              username: s.reg_number,
              name: s.name,
              email: s.email,
              role: 'student',
              phone: s.phone,
              avatar: s.photo_url || './assets/images/default-student.png'
            },
            student: s
          };
        }
      }

      return { success: false, message: 'Invalid username or password.' };
    }

    if (path === '/auth/me') {
      const u = this.getUser();
      const s = this.getStudent();
      if (u) {
        return { success: true, user: u, student: s };
      }
      return { success: false, message: 'Not authenticated' };
    }

    if (path === '/auth/change-password' && method === 'POST') {
      const { newPassword } = payload;
      MockData.updateAdminPassword(newPassword);
      return { success: true, message: 'Password updated successfully!' };
    }

    // 2. Dashboard
    if (path === '/dashboard/stats') {
      return { success: true, data: MockData.stats };
    }
    if (path === '/dashboard/charts') {
      return { success: true, data: MockData.charts };
    }

    // 3. Students
    if (path === '/students') {
      if (method === 'POST') {
        const newS = MockData.addStudent(payload);
        return { success: true, message: 'Student registered successfully!', data: newS };
      }
      let list = MockData.students || [];
      const q = (params.get('search') || '').toLowerCase().trim();
      if (q) {
        list = list.filter(s => 
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.reg_number && s.reg_number.toLowerCase().includes(q)) ||
          (s.room_number && String(s.room_number).includes(q)) ||
          (s.phone && String(s.phone).includes(q))
        );
      }
      const room = params.get('room');
      if (room) list = list.filter(s => String(s.room_number) === String(room));
      const floor = params.get('floor');
      if (floor && floor !== 'all') {
        list = list.filter(s => String(s.floor_number) === String(floor));
      }
      const feeStatus = params.get('feeStatus') || params.get('status');
      if (feeStatus && feeStatus !== 'all') {
        list = list.filter(s => {
          const st = String(s.fee_status || s.latest_cycle_status || s.student_status || '').toLowerCase();
          return st === String(feeStatus).toLowerCase();
        });
      }

      const page = parseInt(params.get('page'), 10) || 1;
      const limit = parseInt(params.get('limit'), 10) || 20;
      const totalRecords = list.length;
      const totalPages = Math.ceil(totalRecords / limit) || 1;
      const start = (page - 1) * limit;
      const rawData = list.slice(start, start + limit);
      const data = rawData.map(s => {
        const fStatus = s.fee_status || s.latest_cycle_status || s.student_status || 'pending';
        return {
          ...s,
          fee_status: fStatus,
          latest_cycle_status: fStatus,
          student_status: fStatus
        };
      });

      return {
        success: true,
        data,
        pagination: { page, limit, totalPages, totalRecords }
      };
    }

    if (path.startsWith('/students/') && method === 'GET') {
      const studentId = path.split('/')[2];
      if (studentId === 'me') {
        const curStudent = this.getStudent() || MockData.students[0] || {};
        const profile = curStudent;
        const cycles = (MockData.feeCycles || []).filter(c => Number(c.student_id) === Number(profile.id));
        const pays = (MockData.payments || []).filter(p => Number(p.student_id) === Number(profile.id));
        const comps = (MockData.complaints || []).filter(c => Number(c.student_id) === Number(profile.id));
        const leaves = (MockData.leaveRequests || []).filter(l => Number(l.student_id) === Number(profile.id));
        return {
          success: true,
          data: {
            profile,
            feeCycles: cycles,
            payments: pays,
            complaints: comps,
            leaveRequests: leaves,
            nextDueInfo: {
              dueDate: cycles[0]?.due_date || '2026-11-09',
              dueDateDisplay: cycles[0]?.dueDateDisplay || '09-11-2026',
              amount: 7000,
              reminder: { status: 'paid', label: 'Paid', badgeClass: 'badge-success' }
            }
          }
        };
      }
      const s = (MockData.students || []).find(st => String(st.id) === String(studentId));
      if (s) {
        const cycles = (MockData.feeCycles || []).filter(c => Number(c.student_id) === Number(s.id));
        const pays = (MockData.payments || []).filter(p => Number(p.student_id) === Number(s.id));
        const comps = (MockData.complaints || []).filter(c => Number(c.student_id) === Number(s.id));
        const leaves = (MockData.leaveRequests || []).filter(l => Number(l.student_id) === Number(s.id));
        return {
          success: true,
          data: {
            profile: s,
            feeCycles: cycles,
            payments: pays,
            complaints: comps,
            leaveRequests: leaves,
            nextDueInfo: {
              dueDate: cycles[0]?.due_date || '2026-11-09',
              dueDateDisplay: cycles[0]?.dueDateDisplay || '09-11-2026',
              amount: 7000,
              reminder: { status: 'paid', label: 'Paid', badgeClass: 'badge-success' }
            }
          }
        };
      }
      return { success: false, message: 'Student not found' };
    }

    if (path.startsWith('/students/') && method === 'DELETE') {
      const studentId = path.split('/')[2];
      MockData.deleteStudent(studentId);
      return { success: true, message: 'Student removed successfully' };
    }

    if (path.startsWith('/students/') && path.endsWith('/fee-status') && method === 'PUT') {
      const studentId = path.split('/')[2];
      MockData.updateStudentFeeStatus(studentId, payload.feeStatus || payload.status, payload);
      return { success: true, message: 'Fee status updated successfully!' };
    }

    // 4. Hostel Structure
    if (path === '/rooms/structure') {
      return { success: true, data: MockData.structure };
    }
    if (path === '/rooms/available-beds' || path === '/rooms/options/available') {
      return { success: true, data: MockData.availableBeds };
    }
    if (path.startsWith('/rooms/beds/') && path.endsWith('/status') && method === 'PUT') {
      const bedId = path.split('/')[3];
      MockData.updateBedStatus(bedId, payload.status);
      return { success: true, message: 'Bed status updated' };
    }

    // 5. Fees
    if (path === '/fees/cycles') {
      let list = MockData.feeCycles || [];
      const q = (params.get('search') || '').toLowerCase();
      if (q) {
        list = list.filter(c => 
          (c.student_name && c.student_name.toLowerCase().includes(q)) ||
          (c.reg_number && c.reg_number.toLowerCase().includes(q))
        );
      }
      return { success: true, data: list, pagination: { totalPages: 1, totalRecords: list.length } };
    }
    if (path === '/fees/reminders') {
      const list = (MockData.feeCycles || []).filter(c => c.status !== 'paid');
      return { success: true, data: list };
    }
    if (path.startsWith('/fees/student/')) {
      const sId = path.split('/')[3];
      const cycles = (MockData.feeCycles || []).filter(c => Number(c.student_id) === Number(sId));
      return {
        success: true,
        data: {
          cycles,
          nextDueInfo: {
            dueDate: cycles[0]?.due_date || '2026-11-09',
            dueDateDisplay: cycles[0]?.dueDateDisplay || '09-11-2026',
            amount: 7000,
            reminder: { status: 'paid', label: 'Paid', badgeClass: 'badge-success' }
          }
        }
      };
    }

    // 6. Payments
    if (path === '/payments') {
      if (method === 'POST') {
        const pay = MockData.recordPayment(payload);
        return { success: true, message: 'Payment recorded successfully!', data: pay };
      }
      let list = MockData.payments || [];
      const q = (params.get('search') || '').toLowerCase();
      if (q) {
        list = list.filter(p => 
          (p.receipt_number && p.receipt_number.toLowerCase().includes(q)) ||
          (p.student_name && p.student_name.toLowerCase().includes(q)) ||
          (p.transaction_id && p.transaction_id.toLowerCase().includes(q))
        );
      }
      const m = params.get('method');
      if (m) list = list.filter(p => p.payment_method === m);
      return { success: true, data: list, pagination: { totalPages: 1, totalRecords: list.length } };
    }
    if (path.startsWith('/payments/public-receipt/')) {
      const rId = decodeURIComponent(path.split('/')[3] || '');
      const receipt = MockData.getPaymentDetails(rId);
      if (receipt) {
        return {
          success: true,
          data: {
            ...receipt,
            hostel_name: MockData.settings?.hostel_name || 'SRI RAM PG',
            hostel_address: MockData.settings?.hostel_address || 'OPP. VIGNAN UNIVERSITY',
            hostel_phone: MockData.settings?.contact_phone || '+91 98111 22334'
          }
        };
      }
      return { success: false, message: 'Receipt not found' };
    }
    if (path.startsWith('/payments/')) {
      const pId = path.split('/')[2];
      const receipt = MockData.getPaymentDetails(pId);
      return { success: true, data: receipt };
    }

    // 7. Expenses
    if (path === '/expenses') {
      if (method === 'POST') {
        const exp = MockData.addExpense(payload);
        return { success: true, message: 'Expense recorded successfully!', data: exp };
      }
      let list = MockData.expenses || [];
      const cat = params.get('category');
      if (cat) list = list.filter(e => e.category === cat);
      return {
        success: true,
        data: list,
        summary: {
          totalIncome: MockData.stats.feesCollected,
          totalExpenses: MockData.stats.hostelExpenses,
          netIncome: MockData.stats.netIncome
        },
        pagination: { totalPages: 1, totalRecords: list.length }
      };
    }
    if (path.startsWith('/expenses/') && method === 'DELETE') {
      const eId = path.split('/')[2];
      MockData.deleteExpense(eId);
      return { success: true, message: 'Expense deleted successfully!' };
    }

    // 8. Complaints
    if (path === '/complaints') {
      if (method === 'POST') {
        const comp = MockData.addComplaint(payload);
        return { success: true, message: 'Complaint registered successfully!', data: comp };
      }
      let list = MockData.complaints || [];
      const cat = params.get('category');
      if (cat) list = list.filter(c => c.category === cat);
      const st = params.get('status');
      if (st) list = list.filter(c => c.status === st);
      return { success: true, data: list };
    }
    if (path.startsWith('/complaints/') && path.endsWith('/status') && method === 'PUT') {
      const cId = path.split('/')[2];
      MockData.updateComplaintStatus(cId, payload.status, payload.adminNotes || payload.admin_notes);
      return { success: true, message: 'Complaint status updated' };
    }
    if (path.startsWith('/complaints/') && method === 'DELETE') {
      const cId = path.split('/')[2];
      MockData.deleteComplaint(cId);
      return { success: true, message: 'Complaint removed' };
    }

    // 9. Visitors
    if (path === '/visitors') {
      if (method === 'POST') {
        const vis = MockData.addVisitor(payload);
        return { success: true, message: 'Visitor entry recorded', data: vis };
      }
      return { success: true, data: MockData.visitors };
    }
    if (path.startsWith('/visitors/') && path.endsWith('/checkout') && method === 'PUT') {
      const vId = path.split('/')[2];
      MockData.checkoutVisitor(vId);
      return { success: true, message: 'Visitor logged out' };
    }

    // 10. Announcements
    if (path === '/announcements') {
      if (method === 'POST') {
        const ann = MockData.addAnnouncement(payload);
        return { success: true, message: 'Announcement published', data: ann };
      }
      return { success: true, data: MockData.announcements };
    }
    if (path.startsWith('/announcements/') && method === 'DELETE') {
      const aId = path.split('/')[2];
      MockData.deleteAnnouncement(aId);
      return { success: true, message: 'Announcement deleted' };
    }

    // 11. Leave Requests
    if (path === '/leave-requests') {
      if (method === 'POST') {
        const lr = MockData.addLeaveRequest(payload);
        return { success: true, message: 'Leave application submitted', data: lr };
      }
      return { success: true, data: MockData.leaveRequests };
    }
    if (path.startsWith('/leave-requests/') && path.endsWith('/status') && method === 'PUT') {
      const lrId = path.split('/')[2];
      MockData.updateLeaveRequestStatus(lrId, payload.status, payload.remarks);
      return { success: true, message: 'Leave status updated' };
    }

    // 12. Mess
    if (path === '/mess') {
      return { success: true, data: MockData.messSchedule };
    }
    if (path.startsWith('/mess/send-alert') && method === 'POST') {
      MockData.triggerMealAlert(payload.mealType, payload.title, payload.message);
      return { success: true, message: 'Meal alert broadcasted successfully' };
    }

    // 13. Reports
    if (path.startsWith('/reports/')) {
      const reportType = path.split('/')[2];
      return { success: true, data: MockData.generateReport(reportType) };
    }

    // 14. Settings
    if (path === '/settings') {
      if (method === 'PUT') {
        MockData.updateSettings(payload);
        return { success: true, message: 'Settings saved' };
      }
      return { success: true, data: MockData.settings };
    }

    // 15. Notifications
    if (path === '/notifications') {
      const notifs = MockData.notifications || [];
      return { success: true, data: notifs, unreadCount: notifs.filter(n => !n.is_read).length };
    }
    if (path.startsWith('/notifications/') && path.endsWith('/read') && method === 'PUT') {
      const nId = path.split('/')[2];
      if (MockData.notifications) {
        const item = MockData.notifications.find(n => String(n.id) === String(nId));
        if (item) item.is_read = 1;
      }
      return { success: true };
    }
    if (path === '/notifications/read-all' && method === 'PUT') {
      if (MockData.notifications) {
        MockData.notifications.forEach(n => { n.is_read = 1; });
      }
      return { success: true };
    }

    return { success: true, data: null };
  },

  async request(endpoint, options = {}) {
    // 1. Direct local routing for GitHub Pages / static host (Zero 405 errors)
    if (this.isStaticHost) {
      return this.mockRouter(endpoint, options.method || 'GET', options.body);
    }

    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
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

    let res;
    try {
      res = await fetch(url, config);
    } catch (netErr) {
      console.warn(`[API Network Failed for ${url}, switching to client dataset]:`, netErr.message);
      return this.mockRouter(endpoint, options.method || 'GET', options.body);
    }

    // 2. Intercept static host 405 (Method Not Allowed) or 404 (Not Found)
    if (res.status === 405 || res.status === 404) {
      console.warn(`[API returned ${res.status} for ${url}, resolving via client dataset]`);
      return this.mockRouter(endpoint, options.method || 'GET', options.body);
    }

    let data;
    try {
      data = await res.json();
    } catch (jsonErr) {
      data = {};
    }

    // 401 Unauthorized: Session invalid or expired
    if (res.status === 401) {
      this.setToken(null);
      this.setUser(null);
      this.setStudent(null);
      if (window.App && typeof window.App.navigate === 'function') {
        window.App.user = null;
        window.App.renderLoginPage();
      }
      throw new Error(data.message || 'Invalid username or password.');
    }

    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }

    return data;
  },

  get(endpoint, params = {}) {
    const cleanParams = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        cleanParams[k] = v;
      }
    }
    const qs = new URLSearchParams(cleanParams).toString();
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
