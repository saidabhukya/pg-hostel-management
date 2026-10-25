/**
 * Announcements Page Component
 */
const AnnouncementsPage = {
  async render() {
    const user = API.getUser();
    const isAdmin = !user || user.role === 'admin';

    return `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Hostel Bulletins & Announcements</h1>
          <p>Official notices from the Warden's Office, Accounts Desk, and campus administration</p>
        </div>
        <div class="page-actions">
          ${isAdmin ? `
            <button class="btn btn-primary" onclick="AnnouncementsPage.openCreateModal()">
              <i data-lucide="plus-circle"></i>
              <span>Post Announcement</span>
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Announcements List Container -->
      <div id="announcements-container" style="display:flex;flex-direction:column;gap:1.25rem;">
        <p style="text-align:center;color:var(--text-muted);padding:2rem;">Loading announcements...</p>
      </div>
    `;
  },

  async afterRender() {
    await this.loadAnnouncements();
  },

  async loadAnnouncements() {
    try {
      const res = await API.get('/announcements');
      if (res && res.success) {
        this.renderAnnouncements(res.data || []);
      } else {
        this.renderAnnouncements([]);
      }
    } catch (e) {
      Toast.error('Failed to load announcements: ' + e.message);
    }
  },

  renderAnnouncements(list) {
    const container = document.getElementById('announcements-container');
    if (!container) return;

    const user = API.getUser();
    const isAdmin = !user || user.role === 'admin';

    if (!Array.isArray(list) || list.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align:center;padding:3rem;color:var(--text-muted);">
          <i data-lucide="megaphone-off" style="width:40px;height:40px;margin-bottom:0.5rem;opacity:0.5;"></i>
          <p style="font-weight:600;">No active bulletins or notices.</p>
          <p style="font-size:0.85rem;margin-top:0.25rem;">Click the "+ Post Announcement" button above to publish an official bulletin.</p>
        </div>
      `;
      Utils.renderIcons();
      return;
    }

    container.innerHTML = list.map(a => {
      let priorityBadge = 'badge-info';
      let borderLeftColor = 'var(--accent-blue, #2563eb)';

      if (a.priority === 'Urgent') {
        priorityBadge = 'badge-danger';
        borderLeftColor = 'var(--primary-red, #dc2626)';
      } else if (a.priority === 'High') {
        priorityBadge = 'badge-danger';
        borderLeftColor = '#ea580c';
      } else if (a.priority === 'Medium') {
        priorityBadge = 'badge-warning';
        borderLeftColor = '#f59e0b';
      }

      const dateStr = a.publishedDateDisplay || (a.published_date ? Utils.formatDate(a.published_date) : 'Today');
      const audienceLabel = a.audience === 'all'
        ? 'All Residents & Staff'
        : (a.audience === 'students' ? 'Students Only' : (a.audience === 'staff' ? 'Staff Only' : Utils.escapeHTML(a.audience)));

      return `
        <div class="card" style="border-left:5px solid ${borderLeftColor};transition:transform 0.15s ease,box-shadow 0.15s ease;">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:0.75rem;flex-wrap:wrap;gap:0.5rem;">
            <div style="display:flex;align-items:center;gap:0.6rem;">
              <span class="badge ${priorityBadge}">${Utils.escapeHTML(a.priority || 'General')} Priority</span>
              <span style="font-size:0.78rem;color:var(--text-muted);">
                <i data-lucide="calendar" style="width:13px;height:13px;display:inline-block;vertical-align:-1px;margin-right:2px;"></i>
                Published: <strong>${dateStr}</strong>
              </span>
            </div>
            ${isAdmin ? `
              <button class="btn btn-sm btn-danger" onclick="AnnouncementsPage.deleteAnnouncement(${a.id})" title="Delete Bulletin" style="padding:0.3rem 0.5rem;">
                <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
              </button>
            ` : ''}
          </div>

          <h3 style="font-size:1.2rem;font-weight:800;color:var(--text-primary);letter-spacing:-0.3px;margin-bottom:0.6rem;">
            ${Utils.escapeHTML(a.title)}
          </h3>

          <p style="font-size:0.92rem;color:var(--text-secondary);line-height:1.6;white-space:pre-line;">
            ${Utils.escapeHTML(a.content)}
          </p>

          <div style="margin-top:1rem;padding-top:0.75rem;border-top:1px solid var(--border-color);font-size:0.75rem;color:var(--text-muted);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;">
            <span>Issued by: <strong style="color:var(--text-primary);">${Utils.escapeHTML(a.author_name || 'Hostel Chief Warden')}</strong></span>
            <span>Target Audience: <strong style="color:var(--text-primary);">${audienceLabel}</strong></span>
          </div>
        </div>
      `;
    }).join('');

    Utils.renderIcons();
  },

  openCreateModal() {
    Modal.open({
      title: 'Post New Announcement',
      content: `
        <form onsubmit="AnnouncementsPage.submitAnnouncement(event)">
          <div class="form-group" style="margin-bottom:1.15rem;">
            <label class="form-label required">Notice Title / Headline</label>
            <input type="text" id="ann-title" class="form-control" placeholder="e.g. Scheduled Water Tank Cleaning Tomorrow" required />
          </div>

          <div class="form-grid" style="margin-bottom:1.15rem;">
            <div class="form-group">
              <label class="form-label required">Priority Level</label>
              <select id="ann-priority" class="form-control" required>
                <option value="Low">Low Priority</option>
                <option value="Medium" selected>Medium Priority</option>
                <option value="High">High Priority</option>
                <option value="Urgent">Urgent Alert</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label required">Target Audience</label>
              <select id="ann-audience" class="form-control" required>
                <option value="all">All Residents & Staff</option>
                <option value="students">Students Only</option>
                <option value="staff">Staff Only</option>
              </select>
            </div>
          </div>

          <div class="form-group" style="margin-bottom:1.5rem;">
            <label class="form-label required">Detailed Notice Content</label>
            <textarea id="ann-content" class="form-control" rows="5" placeholder="Write the announcement details clearly..." required></textarea>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:0.75rem;">
            <button type="button" class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
            <button type="submit" class="btn btn-primary">Publish Announcement</button>
          </div>
        </form>
      `,
      maxWidth: '600px'
    });
  },

  async submitAnnouncement(e) {
    e.preventDefault();
    const title = (document.getElementById('ann-title').value || '').trim();
    const content = (document.getElementById('ann-content').value || '').trim();
    const priority = document.getElementById('ann-priority').value;
    const audience = document.getElementById('ann-audience').value;

    if (!title || !content) {
      Toast.error('Please enter both headline and content for the announcement.');
      return;
    }

    try {
      const res = await API.post('/announcements', {
        title,
        content,
        priority,
        audience
      });

      if (res && res.success) {
        Toast.success(res.message || 'Announcement published successfully!');
        Modal.close();
        await this.loadAnnouncements();
        if (window.NotificationCenter && typeof window.NotificationCenter.fetchNotifications === 'function') {
          window.NotificationCenter.fetchNotifications();
        }
      } else {
        Toast.error((res && res.message) || 'Failed to publish announcement.');
      }
    } catch (err) {
      Toast.error(err.message || 'Error publishing announcement.');
    }
  },

  async deleteAnnouncement(id) {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const res = await API.delete(`/announcements/${id}`);
      if (res && res.success) {
        Toast.success(res.message || 'Announcement deleted successfully.');
        await this.loadAnnouncements();
      } else {
        Toast.error((res && res.message) || 'Failed to delete announcement.');
      }
    } catch (e) {
      Toast.error(e.message || 'Error deleting announcement.');
    }
  }
};

window.AnnouncementsPage = AnnouncementsPage;
