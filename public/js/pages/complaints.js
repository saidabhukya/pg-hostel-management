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
          <h1>Hostel Grievances & Maintenance Complaints</h1>
          <p>Track electrical, plumbing, Wi-Fi, cleaning, and dining issues</p>
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
          <div style="min-width:160px;">
            <select id="comp-status-filter" class="form-control" onchange="ComplaintsPage.handleStatusFilter(this.value)">
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
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

    if (complaints.length === 0) {
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

    container.innerHTML = complaints.map(c => `
      <div class="card" style="border-left:4px solid ${c.status === 'Resolved' ? 'var(--status-success)' : c.status === 'In Progress' ? 'var(--status-warning)' : 'var(--primary-red)'};">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap;">
          <div>
            <div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.35rem;">
              <span class="badge badge-info">${c.category}</span>
              <span class="badge ${c.status === 'Resolved' ? 'badge-success' : c.status === 'In Progress' ? 'badge-warning' : 'badge-danger'}">
                ${c.status}
              </span>
              <span style="font-size:0.75rem;color:var(--text-muted);">Submitted: ${c.createdAtDisplay}</span>
            </div>
            <h3 style="font-size:1.1rem;font-weight:700;color:var(--text-primary);">${Utils.escapeHTML(c.title)}</h3>
            <p style="font-size:0.88rem;color:var(--text-secondary);margin:0.5rem 0;">${Utils.escapeHTML(c.description)}</p>
            
            <div style="font-size:0.78rem;color:var(--text-muted);">
              Resident: <strong>${Utils.escapeHTML(c.student_name)}</strong> (${c.reg_number}) • Room ${c.room_number || '-'}, ${c.bed_label || '-'}
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
                <button class="btn btn-sm btn-secondary" onclick="ComplaintsPage.openUpdateStatusModal(${c.id}, '${c.status}', '${Utils.escapeHTML(c.admin_notes || '')}')">
                  <i data-lucide="edit-3" style="width:14px;height:14px;"></i>
                  Update Status
                </button>
              </div>
            ` : ''}
          </div>
        </div>

        ${c.admin_notes ? `
          <div style="margin-top:0.85rem;padding:0.75rem;background:var(--bg-secondary);border-radius:var(--radius-md);border-left:3px solid var(--primary-red);font-size:0.82rem;color:var(--text-secondary);">
            <strong>Warden Resolution Notes:</strong> ${Utils.escapeHTML(c.admin_notes)}
          </div>
        ` : ''}
      </div>
    `).join('');

    Utils.renderIcons();
  },

  openSubmitModal() {
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
  },

  async handleSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('comp-submit-btn');

    const category = document.getElementById('comp-category').value;
    const title = document.getElementById('comp-title').value;
    const description = document.getElementById('comp-desc').value;
    const photoInput = document.getElementById('comp-photo');

    const formData = new FormData();
    formData.append('category', category);
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
        ComplaintsPage.loadComplaints();
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
            <label class="form-label required">Status</label>
            <select id="update-comp-status" class="form-control" required>
              <option value="Pending" ${currentStatus === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="In Progress" ${currentStatus === 'In Progress' ? 'selected' : ''}>In Progress</option>
              <option value="Resolved" ${currentStatus === 'Resolved' ? 'selected' : ''}>Resolved</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom:1.5rem;">
            <label class="form-label">Warden Action Notes / Remarks</label>
            <textarea id="update-comp-notes" class="form-control" rows="3" placeholder="Action taken or technician dispatch info...">${currentNotes || ''}</textarea>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:0.75rem;">
            <button type="button" class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
            <button type="submit" class="btn btn-primary">Update Status</button>
          </div>
        </form>
      `,
      maxWidth: '480px'
    });
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
        ComplaintsPage.loadComplaints();
      }
    } catch (err) {
      Toast.error(err.message);
    }
  }
};

window.ComplaintsPage = ComplaintsPage;
