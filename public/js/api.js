/**
 * API Client Module
 * Centralizes all network requests, JWT header attachment, and response normalization
 */
const API = {
  baseUrl: (function() {
    if (typeof window !== 'undefined' && window.location && window.location.protocol === 'file:') {
      return 'http://localhost:5000/api';
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

  async request(endpoint, options = {}) {
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
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        // Token expired or invalid
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
