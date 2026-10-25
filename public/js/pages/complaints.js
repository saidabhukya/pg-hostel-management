/**
 * Complaints & Grievance Redressal Page Component
 */
const ComplaintsPage = {
  currentStatus: '',
  currentCategory: '',

  async render() {
    const user = API.getUser();
    const isAdmin = user && user.role === 'admin';

    return `
      <div class="page-header">
        <div class="page-title-group">
          <h1>${isAdmin ? 'Hostel Grievances & Maintenance Complaints' : 'My Grievances & Maintenance Complaints'}</h1>
          <p>${isAdmin ? 'Track electrical, plumbing, Wi-Fi, cleaning, and dining issues' : 'Track maintenance tickets and repairs for your room'}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="ComplaintsPage.openSubmitModal()">
            <i data-lucide="plus-circle"></i>
            <span>Submit Complaint</span>
          </button>
        </div>
      </div>

      <!-- Filters Toolbar -->
      <div class="card" style="margin-bottom:1.25rem;padding:1rem;">
        <div style="display:flex;gap:1rem;flex-wrap:wrap;align-items:center;">
          <!-- Category Filter -->
          <div style="min-width:180px;">
            <select id="comp-category-filter" class="form-control" onchange="ComplaintsPage.handleCategoryFilter(this.value)">
              <option value="">All Categories</option>
              <option value="Electrical">Electrical</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Cleaning">Cleaning</option>
              <option value="Wi-Fi">Wi-Fi</option>
              <option value="Food">Food / Mess</option>
              <option value="Room">Room</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <!-- Status Filter -->
          <div style="min-width:180px;">
            <select id="comp-status-filter" class="form-control" onchange="ComplaintsPage.handleStatusFilter(this.value)">
              <option value="">All Statuses</option>
              <option value="Pending">Pending (Under Review)</option>
              <option value="In Progress">In Progress (Processing)</option>
              <option value="Resolved">Resolved (Solved)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Complaints List Container -->
      <div id="complaints-list-container" style="display:flex;flex-direction:column;gap:1rem;">
        <p style="text-align:center;color:var(--text-muted);padding:2.5rem;">Loading complaints...</p>
      </div>
    `;
  },

  async afterRender() {
    await this.loadComplaints();
  },

  handleCategoryFilter(cat) {
    this.currentCategory = cat;
    this.loadComplaints();
  },

  handleStatusFilter(st) {
    this.currentStatus = st;
    this.loadComplaints();
  },

  async loadComplaints() {
    try {
      const container = document.getElementById('complaints-list-container');
      if (container) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:2rem;">Refreshing complaints...</p>';
      }

      const res = await API.get('/complaints', {
        category: this.currentCategory,
        status: this.currentStatus
      });

      if (res.success) {
        this.renderComplaints(res.data);
      }
    } catch (e) {
      Toast.error('Failed to load complaints: ' + e.message);
    }
  },

  renderComplaints(complaints) {
    const container = document.getElementById('complaints-list-container');
    if (!container) return;

    const user = API.getUser();
    const isAdmin = user && user.role === 'admin';

    if (!complaints || complaints.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align:center;padding:3rem;color:var(--text-muted);">
          <i data-lucide="check-circle" style="width:48px;height:48px;margin-bottom:0.5rem;color:var(--status-success);opacity:0.7;"></i>
          <h3 style="color:var(--text-primary);margin-bottom:0.25rem;">No Complaints Found</h3>
          <p>All hostel facilities are currently reported in working order.</p>
        </div>
      `;
      Utils.renderIcons();
      return;
    }

    container.innerHTML = complaints.map(c => {
      const isResolved = c.status === 'Resolved' || c.status === 'Solved';
      const isInProgress = c.status === 'In Progress' || c.status === 'Processing';
      const badgeClass = isResolved ? 'badge-success' : isInProgress ? 'badge-warning' : 'badge-danger';
      const statusLabel = isResolved ? 'Resolved (Solved)' : isInProgress ? 'In Progress (Processing)' : 'Pending Review';
      const statusIcon = isResolved ? 'check-circle' : isInProgress ? 'wrench' : 'clock';
      const borderLeftColor = isResolved ? 'var(--status-success)' : isInProgress ? 'var(--status-warning)' : 'var(--primary-red)';

      return `
      <div class="card" style="border-left:4px solid ${borderLeftColor};">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap;">
          <div style="flex:1;min-width:280px;">
            <div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.35rem;flex-wrap:wrap;">
              <span class="badge badge-info">${Utils.escapeHTML(c.category || 'General')}</span>
              <span class="badge ${badgeClass}" style="display:inline-flex;align-items:center;gap:0.3rem;">
                <i data-lucide="${statusIcon}" style="width:12px;height:12px;"></i>
                ${statusLabel}
              </span>
              <span style="font-size:0.75rem;color:var(--text-muted);display:flex;align-items:center;gap:0.25rem;">
                <i data-lucide="clock" style="width:12px;height:12px;"></i>
                Submitted: ${c.createdAtDisplay || (c.created_at ? Utils.formatDate(c.created_at) : 'Today')}
              </span>
            </div>
            <h3 style="font-size:1.1rem;font-weight:700;color:var(--text-primary);margin-top:0.25rem;">${Utils.escapeHTML(c.title || 'Hostel Maintenance Ticket')}</h3>
            <p style="font-size:0.88rem;color:var(--text-secondary);margin:0.5rem 0;line-height:1.5;">${Utils.escapeHTML(c.description || 'No additional details provided.')}</p>
            
            <div style="font-size:0.78rem;color:var(--text-muted);display:flex;align-items:center;gap:0.4rem;flex-wrap:wrap;">
              <i data-lucide="user" style="width:12px;height:12px;"></i>
              <span>Resident: <strong>${Utils.escapeHTML(c.student_name || 'Hostel Resident')}</strong> ${c.reg_number ? `(${Utils.escapeHTML(c.reg_number)})` : ''}</span>
              <span>•</span>
              <i data-lucide="map-pin" style="width:12px;height:12px;"></i>
              <span>Room ${c.room_number ? Utils.escapeHTML(String(c.room_number)) : 'General'}${c.bed_label ? `, ${Utils.escapeHTML(c.bed_label)}` : ''}</span>
            </div>
          </div>

          <!-- Actions & Photo -->
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.75rem;">
            ${c.photo_url ? `
              <a href="${c.photo_url}" target="_blank" class="btn btn-sm btn-secondary" title="View Uploaded Attachment">
                <i data-lucide="image" style="width:14px;height:14px;"></i>
                Photo Attachment
              </a>
            ` : ''}

            ${isAdmin ? `
              <div style="display:flex;gap:0.4rem;">
                <button class="btn btn-sm btn-secondary" onclick="ComplaintsPage.openUpdateStatusModal(${c.id}, '${c.status}', '${Utils.escapeHTML(c.admin_notes || '')}')" title="Update Status">
                  <i data-lucide="edit-3" style="width:14px;height:14px;"></i>
                  <span>Update Status</span>
                </button>
                <button class="btn btn-sm btn-secondary" onclick="ComplaintsPage.deleteComplaint(${c.id})" title="Delete Ticket" style="color:var(--primary-red);">
                  <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
                </button>
              </div>
            ` : ''}
          </div>
        </div>

        ${c.admin_notes ? `
          <div style="margin-top:0.85rem;padding:0.75rem 0.9rem;background:var(--bg-secondary);border-radius:var(--radius-md);border-left:3px solid ${isResolved ? 'var(--status-success)' : 'var(--status-warning)'};font-size:0.82rem;color:var(--text-secondary);">
            <div style="display:flex;align-items:center;gap:0.35rem;font-weight:700;font-size:0.8rem;color:${isResolved ? 'var(--status-success)' : 'var(--status-warning)'};margin-bottom:0.25rem;">
              <i data-lucide="${isResolved ? 'check-check' : 'message-square'}" style="width:14px;height:14px;"></i>
              <span>${isResolved ? 'Warden Solved & Resolution Remarks:' : 'Warden Processing Update Remarks:'}</span>
            </div>
            <p style="margin:0;line-height:1.45;color:var(--text-primary);">${Utils.escapeHTML(c.admin_notes)}</p>
          </div>
        ` : ''}
      </div>
      `;
    }).join('');

    Utils.renderIcons();
  },

  openSubmitModal() {
    const user = API.getUser();
    const isStudent = user && user.role === 'student';
    const student = isStudent ? API.getStudent() : null;
    const defaultRoom = student ? (student.room_number || '') : '';

    Modal.open({
      title: 'Submit Maintenance Complaint',
      content: `
        <form id="submit-complaint-form" onsubmit="ComplaintsPage.handleSubmit(event)">
          <div class="form-group" style="margin-bottom:1.15rem;">
            <label class="form-label required">Complaint Category</label>
            <select id="comp-category" class="form-control" required>
              <option value="Wi-Fi">Wi-Fi & Internet</option>
              <option value="Electrical">Electrical (Lights, Fan, Switch)</option>
              <option value="Plumbing">Plumbing (Tap, Shower, Flush)</option>
              <option value="Cleaning">Cleaning & Sanitation</option>
              <option value="Food">Food / Mess Quality</option>
              <option value="Room">Room Furniture / Lock</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom:1.15rem;">
            <label class="form-label">Room Number / Location</label>
            <input type="text" id="comp-room" class="form-control" value="${defaultRoom}" placeholder="e.g. 101, Dining Hall, 2nd Floor Corridor" />
            <small style="color:var(--text-muted);font-size:0.72rem;">Room number or specific area in the hostel needing repair.</small>
          </div>

          <div class="form-group" style="margin-bottom:1.15rem;">
            <label class="form-label required">Complaint Subject / Title</label>
            <input type="text" id="comp-title" class="form-control" placeholder="e.g. Bathroom tap leaking on 2nd floor" required />
          </div>

          <div class="form-group" style="margin-bottom:1.15rem;">
            <label class="form-label required">Detailed Description</label>
            <textarea id="comp-desc" class="form-control" rows="4" placeholder="Describe the problem, exact room/corridor location, and urgency..." required></textarea>
          </div>

          <div class="form-group" style="margin-bottom:1.5rem;">
            <label class="form-label">Photo Upload (Optional)</label>
            <input type="file" id="comp-photo" class="form-control" accept="image/*" />
            <small style="color:var(--text-muted);font-size:0.72rem;">Supports JPG, PNG, WEBP up to 5MB.</small>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:0.75rem;padding-top:1rem;border-top:1px solid var(--border-color);">
            <button type="button" class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
            <button type="submit" id="comp-submit-btn" class="btn btn-primary">
              <i data-lucide="send" style="width:16px;height:16px;"></i>
              <span>Submit Ticket</span>
            </button>
          </div>
        </form>
      `,
      maxWidth: '560px'
    });
    Utils.renderIcons();
  },

  async handleSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('comp-submit-btn');

    const category = document.getElementById('comp-category').value;
    const roomNumber = document.getElementById('comp-room') ? document.getElementById('comp-room').value.trim() : '';
    const title = document.getElementById('comp-title').value;
    const description = document.getElementById('comp-desc').value;
    const photoInput = document.getElementById('comp-photo');

    const formData = new FormData();
    formData.append('category', category);
    if (roomNumber) formData.append('room_number', roomNumber);
    formData.append('title', title);
    formData.append('description', description);
    if (photoInput && photoInput.files[0]) {
      formData.append('photo', photoInput.files[0]);
    }

    try {
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span>Submitting...</span>';
      }

      const res = await API.post('/complaints', formData);
      if (res.success) {
        Toast.success(res.message);
        Modal.close();
        await ComplaintsPage.loadComplaints();
        if (window.NotificationCenter && typeof window.NotificationCenter.fetchNotifications === 'function') {
          await window.NotificationCenter.fetchNotifications();
        }
      }
    } catch (err) {
      Toast.error(err.message || 'Failed to submit complaint.');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="send" style="width:16px;height:16px;"></i> <span>Submit Ticket</span>`;
        Utils.renderIcons();
      }
    }
  },

  openUpdateStatusModal(id, currentStatus, currentNotes) {
    Modal.open({
      title: 'Update Complaint Status',
      content: `
        <form onsubmit="ComplaintsPage.submitStatusUpdate(event, ${id})">
          <div class="form-group" style="margin-bottom:1.15rem;">
            <label class="form-label required">Update Ticket Status</label>
            <select id="update-comp-status" class="form-control" required>
              <option value="In Progress" ${currentStatus === 'In Progress' || currentStatus === 'Processing' ? 'selected' : ''}>⚙ In Progress (Processing / Work Underway)</option>
              <option value="Resolved" ${currentStatus === 'Resolved' || currentStatus === 'Solved' ? 'selected' : ''}>✓ Resolved (Solved & Fixed)</option>
              <option value="Pending" ${currentStatus === 'Pending' ? 'selected' : ''}>⏳ Pending (Awaiting Review)</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom:1.5rem;">
            <label class="form-label required">Warden Remarks / Action Notes (Visible on Student Portal)</label>
            <textarea id="update-comp-notes" class="form-control" rows="3" placeholder="Explain action taken (e.g. Plumber replaced tap washer, issue solved)..." required>${currentNotes || ''}</textarea>
            <small style="color:var(--text-muted);font-size:0.75rem;">These notes immediately update on the student resident portal and their notification center.</small>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:0.75rem;">
            <button type="button" class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
            <button type="submit" class="btn btn-primary">
              <i data-lucide="check" style="width:14px;height:14px;"></i>
              <span>Save & Update Student</span>
            </button>
          </div>
        </form>
      `,
      maxWidth: '500px'
    });
    Utils.renderIcons();
  },

  async submitStatusUpdate(e, id) {
    e.preventDefault();
    const status = document.getElementById('update-comp-status').value;
    const adminNotes = document.getElementById('update-comp-notes').value;

    try {
      const res = await API.put(`/complaints/${id}/status`, { status, adminNotes });
      if (res.success) {
        Toast.success(res.message);
        Modal.close();
        await ComplaintsPage.loadComplaints();
        if (window.NotificationCenter && typeof window.NotificationCenter.fetchNotifications === 'function') {
          await window.NotificationCenter.fetchNotifications();
        }
      }
    } catch (err) {
      Toast.error(err.message);
    }
  },

  async deleteComplaint(id) {
    if (!confirm('Are you sure you want to delete this maintenance complaint record?')) return;
    try {
      const res = await API.delete(`/complaints/${id}`);
      if (res.success) {
        Toast.success(res.message || 'Complaint deleted successfully.');
        await ComplaintsPage.loadComplaints();
        if (window.NotificationCenter && typeof window.NotificationCenter.fetchNotifications === 'function') {
          await window.NotificationCenter.fetchNotifications();
        }
      }
    } catch (err) {
      Toast.error(err.message || 'Failed to delete complaint.');
    }
  }
};

window.ComplaintsPage = ComplaintsPage;
