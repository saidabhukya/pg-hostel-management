/**
 * Leave Requests & Real-Time Notification Management Page Component
 */
const LeaveRequestsPage = {
  _allRequests: [],
  _currentFilter: 'all',
  _searchQuery: '',

  async render() {
    const user = API.getUser();
    const isAdmin = user && user.role === 'admin';

    return `
      <div class="page-header" style="margin-bottom:1.5rem;">
        <div class="page-title-group">
          <div style="display:flex;align-items:center;gap:0.75rem;">
            <h1>${isAdmin ? 'Hostel Leave Requests & Gate Passes' : 'My Leave Applications & Outstation Gate Passes'}</h1>
            <span id="leave-filter-badge" class="badge badge-info" style="font-size:0.78rem;">All Applications</span>
          </div>
          <p>${isAdmin ? 'Review, approve, or reject student overnight outstation and vacation leave requests with real-time notifications' : 'Submit leave applications, track real-time approvals, and view warden remarks'}</p>
        </div>
        <div class="page-actions" style="display:flex;gap:0.75rem;align-items:center;">
          <button class="btn btn-secondary" onclick="LeaveRequestsPage.loadRequests(true)" title="Refresh data">
            <i data-lucide="refresh-cw"></i>
            <span>Refresh</span>
          </button>
          <button class="btn btn-primary" onclick="LeaveRequestsPage.openApplyModal()">
            <i data-lucide="calendar-plus"></i>
            <span>Apply For Leave</span>
          </button>
        </div>
      </div>

      <!-- Quick Metrics Ribbon -->
      <div class="kpi-grid" style="margin-bottom:1.5rem;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));">
        <div class="kpi-card" style="cursor:pointer;" onclick="LeaveRequestsPage.setFilter('all')">
          <div class="kpi-header">
            <span class="kpi-title">Total Applications</span>
            <div class="kpi-icon-wrap"><i data-lucide="calendar"></i></div>
          </div>
          <div class="kpi-value" id="kpi-total-leaves">0</div>
          <div class="kpi-footer"><span>All recorded requests</span></div>
        </div>

        <div class="kpi-card" style="cursor:pointer;border-left:4px solid var(--accent-orange, #f59e0b);" onclick="LeaveRequestsPage.setFilter('pending')">
          <div class="kpi-header">
            <span class="kpi-title">Pending Decisions</span>
            <div class="kpi-icon-wrap" style="background:rgba(245, 158, 11, 0.1);color:#f59e0b;"><i data-lucide="clock"></i></div>
          </div>
          <div class="kpi-value" style="color:#f59e0b;" id="kpi-pending-leaves">0</div>
          <div class="kpi-footer"><span>Awaiting Warden review</span></div>
        </div>

        <div class="kpi-card" style="cursor:pointer;border-left:4px solid var(--accent-green, #10b981);" onclick="LeaveRequestsPage.setFilter('approved')">
          <div class="kpi-header">
            <span class="kpi-title">Approved Leaves</span>
            <div class="kpi-icon-wrap" style="background:rgba(16, 185, 129, 0.1);color:#10b981;"><i data-lucide="check-circle-2"></i></div>
          </div>
          <div class="kpi-value" style="color:#10b981;" id="kpi-approved-leaves">0</div>
          <div class="kpi-footer"><span>Gate pass authorized</span></div>
        </div>

        <div class="kpi-card" style="cursor:pointer;border-left:4px solid var(--primary-red, #ef4444);" onclick="LeaveRequestsPage.setFilter('rejected')">
          <div class="kpi-header">
            <span class="kpi-title">Rejected Requests</span>
            <div class="kpi-icon-wrap" style="background:rgba(239, 68, 68, 0.1);color:#ef4444;"><i data-lucide="x-circle"></i></div>
          </div>
          <div class="kpi-value" style="color:#ef4444;" id="kpi-rejected-leaves">0</div>
          <div class="kpi-footer"><span>Declined with feedback</span></div>
        </div>
      </div>

      <!-- Controls: Status Tabs & Search -->
      <div class="card" style="margin-bottom:1.5rem;padding:0.85rem 1.25rem;">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;">
          <!-- Category Tabs -->
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
            <button class="btn btn-sm leave-tab-btn active" id="tab-all" onclick="LeaveRequestsPage.setFilter('all')">
              All Requests <span class="badge" id="tab-badge-all" style="background:var(--bg-secondary);margin-left:4px;">0</span>
            </button>
            <button class="btn btn-sm leave-tab-btn" id="tab-pending" onclick="LeaveRequestsPage.setFilter('pending')">
              Pending <span class="badge badge-warning" id="tab-badge-pending" style="margin-left:4px;">0</span>
            </button>
            <button class="btn btn-sm leave-tab-btn" id="tab-approved" onclick="LeaveRequestsPage.setFilter('approved')">
              Approved <span class="badge badge-success" id="tab-badge-approved" style="margin-left:4px;">0</span>
            </button>
            <button class="btn btn-sm leave-tab-btn" id="tab-rejected" onclick="LeaveRequestsPage.setFilter('rejected')">
              Rejected <span class="badge badge-danger" id="tab-badge-rejected" style="margin-left:4px;">0</span>
            </button>
          </div>

          <!-- Search Box -->
          <div style="min-width:240px;position:relative;">
            <input type="text" id="leave-search-input" class="form-control form-control-sm" placeholder="Search by student, room, reason..." oninput="LeaveRequestsPage.handleSearch(this.value)" style="padding-left:2rem;" />
            <i data-lucide="search" style="position:absolute;left:0.65rem;top:50%;transform:translateY(-50%);width:14px;height:14px;color:var(--text-muted);pointer-events:none;"></i>
          </div>
        </div>
      </div>

      <!-- Requests Table -->
      <div class="table-container">
        <table class="data-table data-table-responsive-cards" id="leaves-table">
          <thead>
            <tr>
              ${isAdmin ? `
                <th>Resident Student</th>
                <th>Room & Bed</th>
              ` : ''}
              <th>Departure Details</th>
              <th>Return Details</th>
              <th>Leave Reason</th>
              <th>Parent / Emergency Contact</th>
              <th>Status</th>
              <th>Warden Feedback</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="leaves-tbody">
            <tr>
              <td colspan="${isAdmin ? '9' : '7'}" style="text-align:center;padding:3rem;color:var(--text-muted);">
                <div style="display:flex;align-items:center;justify-content:center;gap:0.5rem;">
                  <span class="spinner-border spinner-border-sm"></span>
                  <span>Loading leave requests...</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  },

  async afterRender() {
    await this.loadRequests();
    // Auto-mark any pending unread leave notifications when Admin views this page
    const user = API.getUser();
    if (user && user.role === 'admin' && typeof NotificationCenter !== 'undefined') {
      const leaveNotifs = NotificationCenter.notifications.filter(n => n.type === 'leave' && !n.is_read);
      for (const n of leaveNotifs) {
        try {
          await API.put(`/notifications/${n.id}/read`);
          n.is_read = 1;
        } catch(e) {}
      }
      NotificationCenter.leaveUnreadCount = 0;
      NotificationCenter._updateBadge();
    }
  },

  setFilter(filter) {
    this._currentFilter = filter;
    document.querySelectorAll('.leave-tab-btn').forEach(btn => {
      btn.classList.remove('active', 'btn-primary');
      btn.classList.add('btn-secondary');
    });

    const activeBtn = document.getElementById(`tab-${filter}`);
    if (activeBtn) {
      activeBtn.classList.remove('btn-secondary');
      activeBtn.classList.add('active', 'btn-primary');
    }

    const badge = document.getElementById('leave-filter-badge');
    if (badge) {
      badge.textContent = filter.charAt(0).toUpperCase() + filter.slice(1) + ' Requests';
    }

    this.filterAndRender();
  },

  handleSearch(query) {
    this._searchQuery = (query || '').toLowerCase().trim();
    this.filterAndRender();
  },

  async loadRequests(showToast = false) {
    try {
      const res = await API.get('/leave-requests');
      if (res && res.success && Array.isArray(res.data)) {
        this._allRequests = res.data;
        this.updateKpis(this._allRequests);
        this.filterAndRender();
        if (showToast) Toast.success('Leave requests updated');
        return;
      }
    } catch (e) {
      console.warn('[LeaveRequests] API fetch failed, falling back to local store');
    }

    if (typeof MockData !== 'undefined' && Array.isArray(MockData.leaveRequests)) {
      const user = API.getUser();
      let list = MockData.leaveRequests;
      if (user && user.role === 'student') {
        const student = API.getStudent();
        if (student) {
          list = list.filter(l => Number(l.student_id) === Number(student.id));
        }
      }
      this._allRequests = list;
      this.updateKpis(this._allRequests);
      this.filterAndRender();
      if (showToast) Toast.info('Showing cached requests');
    } else {
      this._allRequests = [];
      this.renderTable([]);
    }
  },

  updateKpis(list) {
    const total = list.length;
    const pending = list.filter(l => (l.status || '').toLowerCase() === 'pending').length;
    const approved = list.filter(l => (l.status || '').toLowerCase() === 'approved').length;
    const rejected = list.filter(l => (l.status || '').toLowerCase() === 'rejected').length;

    const setTxt = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(val);
    };

    setTxt('kpi-total-leaves', total);
    setTxt('kpi-pending-leaves', pending);
    setTxt('kpi-approved-leaves', approved);
    setTxt('kpi-rejected-leaves', rejected);

    setTxt('tab-badge-all', total);
    setTxt('tab-badge-pending', pending);
    setTxt('tab-badge-approved', approved);
    setTxt('tab-badge-rejected', rejected);
  },

  filterAndRender() {
    let filtered = [...this._allRequests];

    if (this._currentFilter !== 'all') {
      filtered = filtered.filter(l => (l.status || '').toLowerCase() === this._currentFilter);
    }

    if (this._searchQuery) {
      const q = this._searchQuery;
      filtered = filtered.filter(l => {
        const sName = (l.student_name || '').toLowerCase();
        const reg = (l.reg_number || '').toLowerCase();
        const room = String(l.room_number || '').toLowerCase();
        const reason = (l.reason || l.leave_reason || '').toLowerCase();
        const msg = (l.additional_message || '').toLowerCase();
        return sName.includes(q) || reg.includes(q) || room.includes(q) || reason.includes(q) || msg.includes(q);
      });
    }

    this.renderTable(filtered);
  },

  renderTable(requests) {
    const tbody = document.getElementById('leaves-tbody');
    if (!tbody) return;

    const user = API.getUser();
    const isAdmin = user && user.role === 'admin';

    if (requests.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="${isAdmin ? '9' : '7'}" style="text-align:center;padding:3.5rem 1rem;color:var(--text-muted);">
            <i data-lucide="calendar-check" style="width:48px;height:48px;margin-bottom:0.75rem;opacity:0.4;display:block;margin-left:auto;margin-right:auto;"></i>
            <p style="font-weight:700;font-size:1.05rem;color:var(--text-primary);margin:0 0 0.35rem;">No leave requests found</p>
            <p style="font-size:0.85rem;margin:0;">There are no applications matching the selected filter.</p>
          </td>
        </tr>
      `;
      Utils.renderIcons();
      return;
    }

    tbody.innerHTML = requests.map(l => {
      const status = (l.status || 'Pending').toLowerCase();
      const isPending = status === 'pending';
      const isApproved = status === 'approved';
      const isRejected = status === 'rejected';

      const statusBadge = isApproved 
        ? `<span class="badge badge-success" style="font-weight:700;"><i data-lucide="check" style="width:12px;height:12px;margin-right:3px;"></i> Approved</span>`
        : isRejected
        ? `<span class="badge badge-danger" style="font-weight:700;"><i data-lucide="x" style="width:12px;height:12px;margin-right:3px;"></i> Rejected</span>`
        : `<span class="badge badge-warning" style="font-weight:700;"><i data-lucide="clock" style="width:12px;height:12px;margin-right:3px;"></i> Pending</span>`;

      const reasonDisplay = Utils.escapeHTML(l.reason || l.leave_reason || 'Personal Work');
      const sDate = l.startDateDisplay || (typeof Utils !== 'undefined' ? Utils.formatDate(l.start_date) : l.start_date);
      const eDate = l.endDateDisplay || (typeof Utils !== 'undefined' ? Utils.formatDate(l.end_date || l.return_date) : (l.end_date || l.return_date));
      const lTime = l.leaving_time || '08:00 AM';
      const aTime = l.arrival_time || '08:00 PM';
      const emergencyContact = l.emergency_contact || l.student_phone || '+91 98765 43210';
      const remarks = l.admin_remarks || l.admin_response || '';

      const avatarInitial = (l.student_name ? l.student_name.charAt(0) : 'S').toUpperCase();

      return `
        <tr style="${isPending ? 'background:rgba(245, 158, 11, 0.03);' : ''}">
          ${isAdmin ? `
            <td data-label="Resident">
              <div style="display:flex;align-items:center;gap:0.75rem;">
                <div class="user-avatar" style="width:36px;height:36px;font-size:0.95rem;background:var(--primary-red);color:#fff;font-weight:700;flex-shrink:0;">
                  ${avatarInitial}
                </div>
                <div>
                  <div style="font-weight:700;color:var(--text-primary);font-size:0.92rem;">${Utils.escapeHTML(l.student_name || 'Resident Student')}</div>
                  <div style="font-size:0.75rem;color:var(--text-muted);">${Utils.escapeHTML(l.reg_number || '23030-EE-067')}</div>
                </div>
              </div>
            </td>

            <td data-label="Room & Bed">
              <span class="badge badge-info" style="font-weight:600;">
                Rm ${l.room_number || '—'} ${l.bed_label ? `• ${l.bed_label}` : ''}
              </span>
            </td>
          ` : ''}

          <td data-label="Departure">
            <div style="font-weight:700;color:var(--text-primary);">${sDate}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);"><i data-lucide="log-out" style="width:11px;height:11px;vertical-align:middle;"></i> ${lTime}</div>
          </td>

          <td data-label="Return">
            <div style="font-weight:700;color:var(--text-primary);">${eDate}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);"><i data-lucide="log-in" style="width:11px;height:11px;vertical-align:middle;"></i> ${aTime}</div>
          </td>

          <td data-label="Reason">
            <div style="font-weight:600;font-size:0.87rem;color:var(--text-primary);">${reasonDisplay}</div>
            ${l.additional_message ? `
              <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${Utils.escapeHTML(l.additional_message)}">
                "${Utils.escapeHTML(l.additional_message)}"
              </div>
            ` : ''}
          </td>

          <td data-label="Emergency Contact">
            <a href="tel:${emergencyContact}" style="font-weight:600;font-size:0.85rem;color:var(--text-primary);text-decoration:none;display:inline-flex;align-items:center;gap:4px;">
              <i data-lucide="phone" style="width:12px;height:12px;color:var(--primary-red);"></i>
              ${emergencyContact}
            </a>
          </td>

          <td data-label="Status">
            ${statusBadge}
          </td>

          <td data-label="Warden Feedback">
            <span style="font-size:0.82rem;color:${remarks ? 'var(--text-primary)' : 'var(--text-muted)'};font-style:${remarks ? 'normal' : 'italic'};">
              ${remarks ? Utils.escapeHTML(remarks) : '—'}
            </span>
          </td>

          <td data-label="Action">
            <div style="display:flex;gap:0.35rem;align-items:center;flex-wrap:wrap;">
              ${isAdmin && isPending ? `
                <button class="btn btn-sm btn-primary" onclick="LeaveRequestsPage.updateStatus(${l.id}, 'Approved')" title="Approve Request & Issue Gate Pass" style="padding:0.25rem 0.55rem;font-size:0.78rem;">
                  <i data-lucide="check" style="width:13px;height:13px;"></i>
                  <span>Approve</span>
                </button>
                <button class="btn btn-sm btn-danger" onclick="LeaveRequestsPage.openRejectModal(${l.id})" title="Reject Request with Reason" style="padding:0.25rem 0.55rem;font-size:0.78rem;">
                  <i data-lucide="x" style="width:13px;height:13px;"></i>
                  <span>Reject</span>
                </button>
              ` : ''}
              <button class="btn btn-sm btn-secondary" onclick="LeaveRequestsPage.openDetailsModal(${l.id})" title="View Complete Application Details" style="padding:0.25rem 0.55rem;font-size:0.78rem;">
                <i data-lucide="eye" style="width:13px;height:13px;"></i>
                <span>Details</span>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    Utils.renderIcons();
  },

  openApplyModal() {
    const today = Utils.getTodayISO();
    const user = API.getUser();
    const student = API.getStudent() || {};

    const studentName = student.name || (user ? user.name : 'Resident Student');
    const studentReg = student.reg_number || (user ? user.username : '23030-EE-067');
    const roomInfo = student.room_number ? `Room ${student.room_number} ${student.bed_label ? `(Bed ${student.bed_label})` : ''}` : 'Room 407 (Bed E)';
    const parentPhone = student.parent_phone || student.phone || '+91 93909 22890';

    Modal.open({
      title: 'Apply For Overnight / Outstation Leave',
      content: `
        <form id="leave-apply-form" onsubmit="LeaveRequestsPage.submitApplication(event)">
          <!-- Auto-fetched Student Details Banner -->
          <div style="background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:8px;padding:0.85rem 1rem;margin-bottom:1.25rem;">
            <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:0.4rem;">
              Applicant Residency Information (Verified)
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(140px, 1fr));gap:0.75rem;font-size:0.85rem;">
              <div>
                <span style="color:var(--text-muted);display:block;font-size:0.72rem;">Student Name</span>
                <strong style="color:var(--text-primary);">${Utils.escapeHTML(studentName)}</strong>
              </div>
              <div>
                <span style="color:var(--text-muted);display:block;font-size:0.72rem;">Registration / Roll No</span>
                <strong style="color:var(--text-primary);">${Utils.escapeHTML(studentReg)}</strong>
              </div>
              <div>
                <span style="color:var(--text-muted);display:block;font-size:0.72rem;">Assigned Room</span>
                <strong style="color:var(--primary-red);">${Utils.escapeHTML(roomInfo)}</strong>
              </div>
            </div>
          </div>

          <div class="form-grid">
            <!-- 10 Prescribed Reasons Dropdown -->
            <div class="form-group col-span-2">
              <label class="form-label required">Reason for Absence</label>
              <select id="leave-reason-select" class="form-control" onchange="LeaveRequestsPage.handleReasonChange(this.value)" required>
                <option value="">Select official reason...</option>
                <option value="Going Home">1. Going Home</option>
                <option value="Family Function">2. Family Function</option>
                <option value="Medical Emergency">3. Medical Emergency</option>
                <option value="Personal Work">4. Personal Work</option>
                <option value="Festival Holidays">5. Festival Holidays</option>
                <option value="Weekend Leave">6. Weekend Leave</option>
                <option value="Family Emergency">7. Family Emergency</option>
                <option value="College Holidays">8. College Holidays</option>
                <option value="Village Visit">9. Village Visit</option>
                <option value="Other">10. Other (Specify custom reason)</option>
              </select>
            </div>

            <!-- Custom Reason (shown when Other is selected) -->
            <div class="form-group col-span-2" id="custom-reason-group" style="display:none;">
              <label class="form-label required">Specify Reason Details</label>
              <input type="text" id="leave-custom-reason" class="form-control" placeholder="Provide brief explanation for leave..." />
            </div>

            <!-- Start Date & Leaving Time -->
            <div class="form-group">
              <label class="form-label required">Leave Start Date</label>
              <input type="date" id="leave-start-date" class="form-control" value="${today}" required />
            </div>

            <div class="form-group">
              <label class="form-label required">Leaving Time</label>
              <input type="time" id="leave-leaving-time" class="form-control" value="08:00" required />
            </div>

            <!-- Return Date & Expected Arrival Time -->
            <div class="form-group">
              <label class="form-label required">Expected Return Date</label>
              <input type="date" id="leave-return-date" class="form-control" value="${today}" required />
            </div>

            <div class="form-group">
              <label class="form-label required">Expected Arrival Time</label>
              <input type="time" id="leave-arrival-time" class="form-control" value="20:00" required />
            </div>

            <!-- Emergency / Parent Contact -->
            <div class="form-group col-span-2">
              <label class="form-label required">Parent / Emergency Contact Number</label>
              <input type="tel" id="leave-contact" class="form-control" value="${parentPhone}" placeholder="+91 98765 43210" required />
              <small style="color:var(--text-muted);font-size:0.75rem;">Warden may call this number for gate pass verification.</small>
            </div>

            <!-- Additional Message (Optional) -->
            <div class="form-group col-span-2">
              <label class="form-label">Additional Message / Destination Address (Optional)</label>
              <textarea id="leave-additional-message" class="form-control" rows="2" placeholder="e.g. Traveling to home town via RTC bus, returning Monday morning for 9 AM lecture..."></textarea>
            </div>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:0.75rem;margin-top:1.5rem;padding-top:1rem;border-top:1px solid var(--border-color);">
            <button type="button" class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
            <button type="submit" id="leave-submit-btn" class="btn btn-primary" style="min-width:160px;">
              <i data-lucide="send"></i>
              <span>Submit Leave Request</span>
            </button>
          </div>
        </form>
      `,
      maxWidth: '620px'
    });

    Utils.renderIcons();
  },

  handleReasonChange(val) {
    const group = document.getElementById('custom-reason-group');
    const input = document.getElementById('leave-custom-reason');
    if (group && input) {
      if (val === 'Other') {
        group.style.display = 'block';
        input.required = true;
        input.focus();
      } else {
        group.style.display = 'none';
        input.required = false;
      }
    }
  },

  async submitApplication(e) {
    e.preventDefault();
    const btn = document.getElementById('leave-submit-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner-border spinner-border-sm" style="width:14px;height:14px;border:2px solid #fff;border-right-color:transparent;border-radius:50%;display:inline-block;animation:spin 0.75s linear infinite;margin-right:6px;"></span> Submitting...`;
    }

    try {
      const reasonSelect = document.getElementById('leave-reason-select').value;
      const customReason = document.getElementById('leave-custom-reason') ? document.getElementById('leave-custom-reason').value.trim() : '';
      const finalReason = reasonSelect === 'Other' ? (customReason || 'Other') : reasonSelect;

      const startDate = document.getElementById('leave-start-date').value;
      const returnDate = document.getElementById('leave-return-date').value;
      const leavingTime = document.getElementById('leave-leaving-time').value;
      const arrivalTime = document.getElementById('leave-arrival-time').value;
      const emergencyContact = document.getElementById('leave-contact').value;
      const additionalMessage = document.getElementById('leave-additional-message').value.trim();

      const user = API.getUser();
      const student = API.getStudent() || {};

      const payload = {
        student_id: student.id || (user ? user.id : 1),
        student_name: student.name || (user ? user.name : 'Resident Student'),
        reg_number: student.reg_number || (user ? user.username : '23030-EE-067'),
        room_number: student.room_number || '407',
        startDate,
        endDate: returnDate,
        returnDate,
        leavingTime,
        arrivalTime,
        leaving_time: leavingTime,
        arrival_time: arrivalTime,
        reason: finalReason,
        leave_reason: finalReason,
        emergencyContact,
        emergency_contact: emergencyContact,
        additionalMessage,
        additional_message: additionalMessage
      };

      try {
        const res = await API.post('/leave-requests', payload);
        if (res && res.success) {
          Toast.success('Leave request submitted! Notification sent to Warden.');
          Modal.close();
          await this.loadRequests();
          if (typeof NotificationCenter !== 'undefined') NotificationCenter.fetchNotifications();
          return;
        }
      } catch (err) {
        console.warn('[LeaveRequests] Backend request failed, utilizing client store');
      }

      // Fallback to MockData
      if (typeof MockData !== 'undefined' && typeof MockData.addLeaveRequest === 'function') {
        MockData.addLeaveRequest(payload);
        Toast.success('Leave application submitted successfully! Status: Pending.');
        Modal.close();
        await this.loadRequests();
        if (typeof NotificationCenter !== 'undefined') NotificationCenter.fetchNotifications();
      } else {
        Toast.error('Could not submit leave request. Please retry.');
      }
    } catch (submitErr) {
      console.error('Leave submission error:', submitErr);
      Toast.error('An error occurred during submission.');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="send"></i><span>Submit Leave Request</span>`;
        Utils.renderIcons();
      }
    }
  },

  async updateStatus(id, newStatus, remarks = '') {
    try {
      const res = await API.put(`/leave-requests/${id}/status`, {
        status: newStatus,
        remarks: remarks || (newStatus === 'Approved' ? 'Approved by Warden. Gate pass authorized.' : 'Application rejected.')
      });

      if (res && res.success) {
        Toast.success(`Leave request ${newStatus.toLowerCase()} successfully!`);
        await this.loadRequests();
        if (typeof NotificationCenter !== 'undefined') NotificationCenter.fetchNotifications();
        return;
      }
    } catch (e) {
      console.warn('[LeaveRequests] Online status update fallback');
    }

    if (typeof MockData !== 'undefined' && typeof MockData.updateLeaveRequestStatus === 'function') {
      MockData.updateLeaveRequestStatus(id, newStatus, remarks);
      Toast.success(`Leave request ${newStatus.toLowerCase()} successfully!`);
      await this.loadRequests();
      if (typeof NotificationCenter !== 'undefined') NotificationCenter.fetchNotifications();
    } else {
      Toast.error('Failed to update leave status.');
    }
  },

  openRejectModal(id) {
    Modal.open({
      title: 'Reject Leave Request',
      content: `
        <div>
          <p style="color:var(--text-muted);font-size:0.875rem;margin-bottom:1rem;">
            Please provide a specific reason for rejecting this leave request. The student will receive this remark instantly in their portal.
          </p>

          <div class="form-group">
            <label class="form-label required">Rejection Reason / Warden Note</label>
            <textarea id="reject-reason-input" class="form-control" rows="3" placeholder="e.g. Internal semester exams scheduled during requested period, or parent confirmation pending..."></textarea>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:0.75rem;margin-top:1.5rem;padding-top:1rem;border-top:1px solid var(--border-color);">
            <button type="button" class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
            <button type="button" class="btn btn-danger" onclick="LeaveRequestsPage.confirmReject(${id})">
              <i data-lucide="x-circle"></i>
              <span>Confirm Rejection</span>
            </button>
          </div>
        </div>
      `,
      maxWidth: '480px'
    });
    Utils.renderIcons();
  },

  async confirmReject(id) {
    const input = document.getElementById('reject-reason-input');
    const remarks = input ? input.value.trim() : '';
    if (!remarks) {
      Toast.error('Please enter a rejection reason.');
      return;
    }
    Modal.close();
    await this.updateStatus(id, 'Rejected', remarks);
  },

  openDetailsModal(id) {
    const item = this._allRequests.find(r => r.id === id);
    if (!item) return;

    const user = API.getUser();
    const isAdmin = user && user.role === 'admin';
    const status = (item.status || 'Pending').toLowerCase();
    const isPending = status === 'pending';

    const sDate = item.startDateDisplay || (typeof Utils !== 'undefined' ? Utils.formatDate(item.start_date) : item.start_date);
    const eDate = item.endDateDisplay || (typeof Utils !== 'undefined' ? Utils.formatDate(item.end_date || item.return_date) : (item.end_date || item.return_date));
    const createdDate = item.created_at ? Utils.formatDate(item.created_at) : 'Recent';

    Modal.open({
      title: 'Leave Request & Gate Pass Record',
      content: `
        <div style="display:flex;flex-direction:column;gap:1.25rem;">
          <!-- Top Badge Bar -->
          <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border-color);padding-bottom:0.75rem;">
            <div>
              <span style="font-size:0.75rem;color:var(--text-muted);display:block;">Application Reference</span>
              <strong style="font-size:0.95rem;color:var(--text-primary);">PASS-REQ-#${item.id}</strong>
            </div>
            <div>
              <span class="badge ${status === 'approved' ? 'badge-success' : status === 'rejected' ? 'badge-danger' : 'badge-warning'}" style="font-size:0.85rem;padding:0.35rem 0.75rem;font-weight:700;">
                ${item.status || 'Pending'}
              </span>
            </div>
          </div>

          <!-- Resident Info -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:1rem;background:var(--bg-secondary);padding:1rem;border-radius:8px;">
            <div>
              <span style="color:var(--text-muted);font-size:0.75rem;display:block;">Resident Student</span>
              <strong style="font-size:0.95rem;color:var(--text-primary);">${Utils.escapeHTML(item.student_name || 'Resident Student')}</strong>
              <div style="font-size:0.75rem;color:var(--text-muted);">${Utils.escapeHTML(item.reg_number || '23030-EE-067')}</div>
            </div>

            <div>
              <span style="color:var(--text-muted);font-size:0.75rem;display:block;">Assigned Room</span>
              <strong style="color:var(--primary-red);">Room ${item.room_number || '—'} ${item.bed_label ? `(${item.bed_label})` : ''}</strong>
            </div>

            <div>
              <span style="color:var(--text-muted);font-size:0.75rem;display:block;">Emergency Contact</span>
              <strong style="color:var(--text-primary);">${item.emergency_contact || item.student_phone || '—'}</strong>
            </div>
          </div>

          <!-- Schedule Grid -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
            <div style="border:1px solid var(--border-color);border-radius:8px;padding:0.85rem;">
              <span style="font-size:0.72rem;text-transform:uppercase;color:var(--text-muted);font-weight:700;">Departure Schedule</span>
              <div style="font-size:1.05rem;font-weight:800;color:var(--text-primary);margin-top:4px;">${sDate}</div>
              <div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px;">Leaving Time: <strong>${item.leaving_time || '08:00 AM'}</strong></div>
            </div>

            <div style="border:1px solid var(--border-color);border-radius:8px;padding:0.85rem;">
              <span style="font-size:0.72rem;text-transform:uppercase;color:var(--text-muted);font-weight:700;">Return Schedule</span>
              <div style="font-size:1.05rem;font-weight:800;color:var(--text-primary);margin-top:4px;">${eDate}</div>
              <div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px;">Expected Arrival: <strong>${item.arrival_time || '08:00 PM'}</strong></div>
            </div>
          </div>

          <!-- Reason & Notes -->
          <div>
            <span style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:0.25rem;">Reason for Leave</span>
            <div style="background:var(--bg-secondary);padding:0.75rem;border-radius:6px;font-weight:600;color:var(--text-primary);">
              ${Utils.escapeHTML(item.reason || item.leave_reason || 'Personal Work')}
            </div>
          </div>

          ${item.additional_message ? `
            <div>
              <span style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:0.25rem;">Additional Student Note</span>
              <div style="background:var(--bg-secondary);padding:0.75rem;border-radius:6px;font-size:0.85rem;color:var(--text-primary);">
                "${Utils.escapeHTML(item.additional_message)}"
              </div>
            </div>
          ` : ''}

          <!-- Warden Remarks -->
          ${item.admin_remarks || item.admin_response ? `
            <div>
              <span style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:0.25rem;">Warden Decision Remarks</span>
              <div style="background:rgba(239, 68, 68, 0.08);border-left:3px solid var(--primary-red);padding:0.75rem;border-radius:4px;font-size:0.85rem;color:var(--text-primary);">
                ${Utils.escapeHTML(item.admin_remarks || item.admin_response)}
              </div>
            </div>
          ` : ''}

          <!-- Footer Actions -->
          <div style="display:flex;justify-content:flex-end;gap:0.75rem;margin-top:0.75rem;padding-top:1rem;border-top:1px solid var(--border-color);">
            <button class="btn btn-secondary" onclick="Modal.close()">Close</button>
            ${isAdmin && isPending ? `
              <button class="btn btn-danger" onclick="Modal.close(); LeaveRequestsPage.openRejectModal(${item.id})">Reject</button>
              <button class="btn btn-primary" onclick="Modal.close(); LeaveRequestsPage.updateStatus(${item.id}, 'Approved')">Approve Request</button>
            ` : ''}
          </div>
        </div>
      `,
      maxWidth: '560px'
    });
    Utils.renderIcons();
  }
};

window.LeaveRequestsPage = LeaveRequestsPage;
