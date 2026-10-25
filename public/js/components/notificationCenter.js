/**
 * Notification Center Component
 * - Click bell to open/close popover
 * - Unread count badge (number, not just dot)
 * - Smooth animation, grouped by read/unread
 * - Click a notification → mark read + navigate its link
 * - Mark all read, refresh button
 * - Auto-refresh every 60 seconds while logged in
 */
const NotificationCenter = {
  notifications: [],
  unreadCount: 0,
  _refreshTimer: null,
  _isOpen: false,

  async init() {
    await this.fetchNotifications();
    this._startAutoRefresh();
  },

  _startAutoRefresh() {
    clearInterval(this._refreshTimer);
    this._refreshTimer = setInterval(async () => {
      await this.fetchNotifications();
      // If popover is open, re-render it with fresh data
      if (this._isOpen) {
        const container = document.getElementById('notification-popover-container');
        if (container) this._renderInto(container);
      }
    }, 60000); // every 60 s
  },

  async fetchNotifications() {
    try {
      const res = await API.get('/notifications');
      this.notifications = res.data || [];
      this.unreadCount = res.unreadCount || 0;
      this._updateBadge();
    } catch (e) {
      // Quiet fail when unauthenticated
    }
  },

  _updateBadge() {
    // Red dot
    const dot = document.getElementById('header-unread-dot');
    if (dot) {
      dot.style.display = this.unreadCount > 0 ? 'block' : 'none';
    }
    // Count number inside the bell button (if element exists)
    const countEl = document.getElementById('header-notif-count');
    if (countEl) {
      countEl.textContent = this.unreadCount > 9 ? '9+' : String(this.unreadCount);
      countEl.style.display = this.unreadCount > 0 ? 'inline-flex' : 'none';
    }
  },

  togglePopover(event) {
    if (event) event.stopPropagation();
    const container = document.getElementById('notification-popover-container');
    if (!container) return;

    if (this._isOpen) {
      this._close(container);
    } else {
      this._open(container);
    }
  },

  _open(container) {
    // Refresh data silently each time the panel opens
    this.fetchNotifications().then(() => {
      this._renderInto(container);
      Utils.renderIcons();
    });
    this._renderInto(container); // show immediately with cached data
    container.classList.add('active');
    this._isOpen = true;
    Utils.renderIcons();
  },

  _close(container) {
    container.classList.remove('active');
    this._isOpen = false;
  },

  _renderInto(container) {
    const unread = this.notifications.filter(n => !n.is_read);
    const read   = this.notifications.filter(n =>  n.is_read);

    const unreadBadge = this.unreadCount > 0
      ? `<span class="notification-unread-pill">${this.unreadCount > 99 ? '99+' : this.unreadCount}</span>`
      : '';

    const markAllBtn = unread.length > 0
      ? `<button class="btn btn-sm btn-secondary" onclick="NotificationCenter.markAllRead()" style="font-size:0.73rem;padding:0.2rem 0.6rem;">
           <i data-lucide="check-check" style="width:12px;height:12px;"></i> Mark all read
         </button>`
      : '';

    const refreshBtn = `
      <button class="btn btn-sm btn-secondary" onclick="NotificationCenter._refreshAndRender()" title="Refresh" style="font-size:0.73rem;padding:0.2rem 0.5rem;">
        <i data-lucide="refresh-cw" style="width:12px;height:12px;"></i>
      </button>`;

    if (this.notifications.length === 0) {
      container.innerHTML = `
        <div class="notification-header">
          <span class="notification-header-title">
            <i data-lucide="bell" style="width:16px;height:16px;"></i>
            Notifications
          </span>
          ${refreshBtn}
        </div>
        <div style="padding:2.5rem 1rem;text-align:center;color:var(--text-muted);font-size:0.85rem;flex:1;">
          <i data-lucide="bell-off" style="width:40px;height:40px;margin-bottom:0.75rem;opacity:0.35;display:block;margin-left:auto;margin-right:auto;"></i>
          <p style="margin:0;font-weight:600;">You're all caught up!</p>
          <p style="margin:0.25rem 0 0;font-size:0.75rem;">No notifications yet.</p>
        </div>
      `;
      return;
    }

    const renderItem = (n) => {
      const icon = NotificationCenter._iconForType(n.type);
      const timeAgo = NotificationCenter._timeAgo(n.created_at);
      return `
        <div class="notification-item ${n.is_read ? '' : 'unread'}" onclick="NotificationCenter.handleClick(${n.id}, '${(n.link || '').replace(/'/g, "\\'")}')">
          <div class="notification-icon-wrap">
            <i data-lucide="${icon}" style="width:15px;height:15px;"></i>
          </div>
          <div style="flex:1;min-width:0;">
            <div class="notification-title">${Utils.escapeHTML(n.title)}</div>
            <div class="notification-message">${Utils.escapeHTML(n.message)}</div>
            <div class="notification-time">
              <i data-lucide="clock" style="width:10px;height:10px;vertical-align:middle;"></i>
              ${timeAgo}
            </div>
          </div>
          ${!n.is_read ? '<div style="width:7px;height:7px;border-radius:50%;background:var(--primary-red);flex-shrink:0;margin-top:5px;"></div>' : ''}
        </div>
      `;
    };

    const unreadSection = unread.length > 0 ? `
      <div style="padding:0.45rem 1.1rem 0.25rem;font-size:0.67rem;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--text-muted);background:var(--bg-secondary);border-bottom:1px solid var(--border-color);">
        Unread (${unread.length})
      </div>
      ${unread.map(renderItem).join('')}
    ` : '';

    const readSection = read.length > 0 ? `
      <div style="padding:0.45rem 1.1rem 0.25rem;font-size:0.67rem;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--text-muted);background:var(--bg-secondary);border-bottom:1px solid var(--border-color);">
        Earlier
      </div>
      ${read.map(renderItem).join('')}
    ` : '';

    container.innerHTML = `
      <div class="notification-header">
        <span class="notification-header-title">
          <i data-lucide="bell" style="width:16px;height:16px;"></i>
          Notifications ${unreadBadge}
        </span>
        <div style="display:flex;gap:0.4rem;align-items:center;">
          ${markAllBtn}
          ${refreshBtn}
        </div>
      </div>
      <div class="notification-list">
        ${unreadSection}
        ${readSection}
      </div>
      <div class="notification-footer">
        <span style="font-size:0.75rem;color:var(--text-muted);">${this.notifications.length} total notification${this.notifications.length !== 1 ? 's' : ''}</span>
        <button class="btn btn-sm btn-secondary" style="font-size:0.73rem;padding:0.2rem 0.6rem;" onclick="NotificationCenter.clearAllRead()">
          <i data-lucide="trash-2" style="width:12px;height:12px;"></i> Clear read
        </button>
      </div>
    `;
  },

  async _refreshAndRender() {
    await this.fetchNotifications();
    const container = document.getElementById('notification-popover-container');
    if (container) {
      this._renderInto(container);
      Utils.renderIcons();
      Toast.info('Notifications refreshed.');
    }
  },

  async handleClick(id, link) {
    try {
      // Mark as read on the server
      await API.put(`/notifications/${id}/read`);

      // Update local state
      const item = this.notifications.find(n => n.id === id);
      if (item && !item.is_read) {
        item.is_read = 1;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        this._updateBadge();
      }

      // Re-render popover to reflect the change
      const container = document.getElementById('notification-popover-container');
      if (container) this._renderInto(container);

      // Navigate to link if present
      if (link && link.startsWith('#')) {
        const route = link.substring(1);
        this._close(container);
        App.navigate(route);
      } else if (link && link !== '') {
        this._close(container);
      }

      Utils.renderIcons();
    } catch (e) {
      console.error('NotificationCenter.handleClick error:', e);
    }
  },

  async markAllRead() {
    try {
      await API.put('/notifications/read-all');
      this.notifications.forEach(n => n.is_read = 1);
      this.unreadCount = 0;
      this._updateBadge();
      const container = document.getElementById('notification-popover-container');
      if (container) this._renderInto(container);
      Utils.renderIcons();
      Toast.success('All notifications marked as read.');
    } catch (e) {
      Toast.error('Failed to mark notifications as read.');
    }
  },

  /**
   * Clear (hide) already-read notifications from the local list
   * (does NOT delete from DB — just filters the view)
   */
  clearAllRead() {
    this.notifications = this.notifications.filter(n => !n.is_read);
    const container = document.getElementById('notification-popover-container');
    if (container) this._renderInto(container);
    Utils.renderIcons();
    Toast.info('Read notifications cleared from view.');
  },

  /** Map notification type → lucide icon name */
  _iconForType(type) {
    const map = {
      fee_due:      'alert-circle',
      payment:      'check-circle-2',
      complaint:    'wrench',
      announcement: 'megaphone',
      leave:        'calendar',
      system:       'info',
      warning:      'triangle-alert',
    };
    return map[type] || 'bell';
  },

  /** Human-readable relative time */
  _timeAgo(isoString) {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now  = new Date();
      const diff = Math.floor((now - date) / 1000); // seconds
      if (diff < 60)   return 'Just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
      // Fallback: formatted date
      const d = date.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
      return d;
    } catch (e) {
      return isoString;
    }
  }
};

// ─── Close popover when clicking outside ──────────────────────────────────────
document.addEventListener('click', (e) => {
  if (!NotificationCenter._isOpen) return;

  const container = document.getElementById('notification-popover-container');
  const bellBtn   = document.getElementById('notification-bell-btn');

  if (
    container &&
    !container.contains(e.target) &&
    e.target !== bellBtn &&
    !bellBtn?.contains(e.target)
  ) {
    NotificationCenter._close(container);
  }
});

window.NotificationCenter = NotificationCenter;
