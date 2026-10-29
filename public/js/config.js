/**
 * SRI RAM PG - Online Portal Configuration
 * Centralized online backend/API URL configuration.
 *
 * For unified deployment (Render / Railway / VPS where Express serves public folder):
 * API_BASE_URL: '/api' (default)
 *
 * For decoupled frontend (e.g. GitHub Pages, Vercel, Netlify):
 * Enter your online cloud backend URL, e.g.:
 * API_BASE_URL: 'https://your-online-api.onrender.com/api'
 */
window.__HOSTEL_CONFIG__ = {
  // Same-origin default. Change this if hosting the frontend on a different domain than the backend.
  API_BASE_URL: '/api',
  APP_NAME: 'SRI RAM PG',
  VERSION: '2.0.0-online'
};

// Safe fallback stub to prevent any residual reference issues
window.MockData = window.MockData || {};
