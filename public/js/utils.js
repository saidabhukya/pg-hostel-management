/**
 * General Utilities & Helpers
 */
const Utils = {
  /**
   * Currency formatter in Indian Rupees
   * e.g. 1190000 -> ₹11,90,000
   */
  formatINR(amount) {
    const num = Number(amount || 0);
    return '₹' + num.toLocaleString('en-IN');
  },

  /**
   * Date formatter to Indian display format (DD-MM-YYYY)
   * e.g. '2026-09-16' -> '16-09-2026'
   */
  formatDate(dateInput) {
    if (!dateInput) return '-';
    try {
      const parts = String(dateInput).split('T')[0].split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return String(dateInput);
    } catch (e) {
      return String(dateInput);
    }
  },

  /**
   * Today's date in YYYY-MM-DD
   */
  getTodayISO() {
    return new Date().toISOString().split('T')[0];
  },

  /**
   * Render Lucide icons in newly created DOM
   */
  renderIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  },

  /**
   * Theme Management (Light / Dark)
   */
  getTheme() {
    return localStorage.getItem('pg_hostel_theme') || 'light';
  },

  setTheme(theme) {
    const validTheme = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', validTheme);
    localStorage.setItem('pg_hostel_theme', validTheme);
    
    // Update theme toggle icons
    const themeIcon = document.getElementById('theme-toggle-icon');
    if (themeIcon) {
      themeIcon.setAttribute('data-lucide', validTheme === 'dark' ? 'sun' : 'moon');
      this.renderIcons();
    }
  },

  toggleTheme() {
    const current = this.getTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  },

  /**
   * Debounce helper for high-frequency input events
   */
  debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func.apply(this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Trigger immediate browser download of raw CSV content
   */
  downloadCSV(csvContent, filename) {
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename || 'export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Export table rows to CSV download
   */
  exportToCSV(filename, columns, rows) {
    const escapeCsv = (val) => {
      const str = String(val === undefined || val === null ? '' : val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += columns.map(escapeCsv).join(',') + '\r\n';

    rows.forEach(row => {
      csvContent += row.map(escapeCsv).join(',') + '\r\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Sanitize HTML string to prevent XSS
   */
  escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};

window.Utils = Utils;
