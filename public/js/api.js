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

  async request(endpoint, options = {}) {
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
      console.error(`[API Network Error] ${url}:`, netErr.message);
      throw new Error('Unable to connect to server. Please try again.');
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
