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
    if (cleanEndpoint === '/students') {
      return {
        success: true,
        data: MockData.students,
        pagination: { total: MockData.students.length, page: 1, limit: 15, totalPages: 1 }
      };
    }
    if (cleanEndpoint.startsWith('/students/')) {
      return {
        success: true,
        data: MockData.studentProfile,
        student: MockData.studentProfile
      };
    }

    // 4. Hostel Structure & Rooms
    if (cleanEndpoint === '/rooms/structure') {
      return { success: true, data: MockData.structure };
    }
    if (cleanEndpoint === '/floors') {
      return { success: true, data: MockData.structure };
    }
    if (cleanEndpoint.startsWith('/rooms/')) {
      const rNum = cleanEndpoint.replace('/rooms/', '');
      return {
        success: true,
        data: {
          room: { room_number: rNum, capacity: 5, occupied_count: 4, type: 'Standard 5-Bed' },
          beds: [
            { id: 1, bed_label: 'Bed-A', status: 'occupied', student_name: 'Ravi Kumar', reg_number: '2024IT123' },
            { id: 2, bed_label: 'Bed-B', status: 'occupied', student_name: 'Aarav Sharma', reg_number: '2024CS045' },
            { id: 3, bed_label: 'Bed-C', status: 'occupied', student_name: 'Priya Verma', reg_number: '2024EC012' },
            { id: 4, bed_label: 'Bed-D', status: 'occupied', student_name: 'Aditi Patel', reg_number: '2024ME088' },
            { id: 5, bed_label: 'Bed-E', status: 'available', student_name: null, reg_number: null }
          ]
        }
      };
    }

    // 5. Fees & Payments
    if (cleanEndpoint === '/fees/cycles' || cleanEndpoint === '/fees') {
      return {
        success: true,
        data: MockData.feeCycles,
        pagination: { total: MockData.feeCycles.length, page: 1, limit: 15, totalPages: 1 }
      };
    }
    if (cleanEndpoint === '/fees/reminders') {
      return {
        success: true,
        data: {
          summary: { dueSoonCount: 4, overdueCount: 2, dueTodayCount: 1 }
        }
      };
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
      return { success: true, data: MockData.messMenu };
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
