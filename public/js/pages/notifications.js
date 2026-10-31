/**
 * Notifications Page Component
 * Dedicated full-page view for student & admin alerts, leave gate passes, and system notices
 */
const NotificationsPage = {
  _currentFilter: 'all',

  async render() {
    const user = API.getUser();
    const isAdmin = user && user.role === 'admin';

    return `
      <div class="page-header" style="margin-bottom:1.5rem;">
        <div class="page-title-group">
          <div style="display:flex;align-items:center;gap:0.75rem;">
            <h1>${isAdmin ? 'Warden Notices & Activity Stream' : 'My Notifications & Alerts'}</h1>
            <span id="notif-page-count" class="badge badge-info">0 unread</span>
          </div>
          <p>${isAdmin ? 'Real-time alerts for student leave requests, complaint tickets, and fee transactions' : 'Track your leave approvals, warden remarks, mess updates, and fee acknowledgments'}</p>
        </div>
        <div class="page-actions" style="display:flex;gap:0.75rem;align-items:center;">
          <button class="btn btn-secondary" onclick="NotificationsPage.refreshData()" title="Refresh notifications">
            <i data-lucide="refresh-cw"></i>
            <span>Refresh</span>
          </button>
          <button class="btn btn-secondary" onclick="NotificationsPage.markAllRead()">
            <i data-lucide="check-check"></i>
            <span>Mark All as Read</span>
          </button>
        </div>
      </div>

      <!-- Filters & Stats -->
      <div class="card" style="margin-bottom:1.5rem;padding:0.85rem 1.25rem;">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;">
          <div style="display:flex;gap:0.5rem;">
            <button class="btn btn-sm notif-filter-btn active btn-primary" id="btn-filter-all" onclick="NotificationsPage.setFilter('all')">
              All Notifications
            </button>
            <button class="btn btn-sm notif-filter-btn btn-secondary" id="btn-filter-unread" onclick="NotificationsPage.setFilter('unread')">
              Unread Only
            </button>
            <button class="btn btn-sm notif-filter-btn btn-secondary" id="btn-filter-read" onclick="NotificationsPage.setFilter('read')">
              Read History
            </button>
          </div>

          <button class="btn btn-sm btn-secondary" onclick="NotificationsPage.clearRead()">
            <i data-lucide="trash-2" style="width:13px;height:13px;"></i>
            <span>Clear Read</span>
          </button>
        </div>
      </div>

      <!-- Notifications List Container -->
      <div id="notifications-list-mount">
        <div style="padding:3.5rem;text-align:center;color:var(--text-muted);">
          <div style="display:flex;align-items:center;justify-content:center;gap:0.5rem;">
            <span class="spinner-border spinner-border-sm"></span>
            <span>Loading notifications...</span>
          </div>
        </div>
      </div>
    `;
  },

  async afterRender() {
    await this.refreshData();
  },

  setFilter(filter) {
    this._currentFilter = filter;
    document.querySelectorAll('.notif-filter-btn').forEach(btn => {
      btn.classList.remove('active', 'btn-primary');
      btn.classList.add('btn-secondary');
    });

    const activeBtn = document.getElementById(`btn-filter-${filter}`);
    if (activeBtn) {
      activeBtn.classList.remove('btn-secondary');
      activeBtn.classList.add('active', 'btn-primary');
    }

    this.renderList();
  },

  async refreshData() {
    if (typeof NotificationCenter !== 'undefined') {
      await NotificationCenter.fetchNotifications();
      this.renderList();
    }
  },

  async markAllRead() {
    if (typeof NotificationCenter !== 'undefined') {
      await NotificationCenter.markAllRead();
      this.renderList();
    }
  },

  clearRead() {
    if (typeof NotificationCenter !== 'undefined') {
      NotificationCenter.clearAllRead();
      this.renderList();
    }
  },

  async handleItemClick(id, link) {
    if (typeof NotificationCenter !== 'undefined') {
      await NotificationCenter.handleClick(id, link);
      this.renderList();
    }
  },

  renderList() {
    const mount = document.getElementById('notifications-list-mount');
    if (!mount) return;

    const notifs = typeof NotificationCenter !== 'undefined' ? (NotificationCenter.notifications || []) : [];
    const unreadCount = typeof NotificationCenter !== 'undefined' ? (NotificationCenter.unreadCount || 0) : 0;

    const countBadge = document.getElementById('notif-page-count');
    if (countBadge) {
      countBadge.textContent = `${unreadCount} unread`;
      countBadge.className = unreadCount > 0 ? 'badge badge-danger' : 'badge badge-info';
    }

    let list = [...notifs];
    if (this._currentFilter === 'unread') {
      list = list.filter(n => !n.is_read);
    } else if (this._currentFilter === 'read') {
      list = list.filter(n => n.is_read);
    }

    if (list.length === 0) {
      mount.innerHTML = `
        <div class="card" style="padding:4rem 1.5rem;text-align:center;color:var(--text-muted);">
          <i data-lucide="bell-off" style="width:48px;height:48px;margin-bottom:1rem;opacity:0.35;display:block;margin-left:auto;margin-right:auto;"></i>
          <h3 style="font-size:1.1rem;font-weight:700;color:var(--text-primary);margin:0 0 0.35rem;">
            ${this._currentFilter === 'unread' ? 'No unread notifications' : 'No notifications in this folder'}
          </h3>
          <p style="font-size:0.85rem;margin:0;">You are all caught up with your latest hostel activity.</p>
        </div>
      `;
      Utils.renderIcons();
      return;
    }

    mount.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:0.75rem;">
        ${list.map(n => {
          const isUnread = !n.is_read;
          const icon = typeof NotificationCenter !== 'undefined' ? NotificationCenter._iconForType(n.type) : 'bell';
          const timeAgo = typeof NotificationCenter !== 'undefined' ? NotificationCenter._timeAgo(n.created_at) : 'Recently';

          return `
            <div class="card" style="padding:1.15rem 1.35rem;cursor:pointer;transition:transform 0.15s ease, box-shadow 0.15s ease;${isUnread ? 'border-left:4px solid var(--primary-red);background:rgba(239, 68, 68, 0.02);' : ''}" onclick="NotificationsPage.handleItemClick(${n.id}, '${(n.link || '').replace(/'/g, "\\'")}')">
              <div style="display:flex;align-items:flex-start;gap:1.1rem;">
                <div style="width:40px;height:40px;border-radius:10px;background:${isUnread ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-secondary)'};display:flex;align-items:center;justify-content:center;color:${isUnread ? 'var(--primary-red)' : 'var(--text-muted)'};flex-shrink:0;">
                  <i data-lucide="${icon}" style="width:20px;height:20px;"></i>
                </div>

                <div style="flex:1;min-width:0;">
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:0.75rem;margin-bottom:0.25rem;">
                    <div style="font-weight:${isUnread ? '800' : '600'};font-size:0.95rem;color:var(--text-primary);">
                      ${Utils.escapeHTML(n.title)}
                    </div>
                    <div style="display:flex;align-items:center;gap:0.5rem;flex-shrink:0;">
                      <span style="font-size:0.75rem;color:var(--text-muted);display:inline-flex;align-items:center;gap:4px;">
                        <i data-lucide="clock" style="width:12px;height:12px;"></i>
                        ${timeAgo}
                      </span>
                      ${isUnread ? '<span style="width:8px;height:8px;border-radius:50%;background:var(--primary-red);"></span>' : ''}
                    </div>
                  </div>

                  <p style="margin:0;font-size:0.85rem;color:var(--text-secondary);line-height:1.45;">
                    ${Utils.escapeHTML(n.message)}
                  </p>

                  ${n.link ? `
                    <div style="margin-top:0.6rem;">
                      <span class="btn btn-sm btn-secondary" style="font-size:0.75rem;padding:0.2rem 0.6rem;pointer-events:none;">
                        <span>View Details</span>
                        <i data-lucide="arrow-right" style="width:12px;height:12px;margin-left:4px;"></i>
                      </span>
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    Utils.renderIcons();
  }
};

window.NotificationsPage = NotificationsPage;
