/**
 * Leave Requests & Gate Passes Page Component
 */
const LeaveRequestsPage = {
  async render() {
    const user = API.getUser();
    const isAdmin = user && user.role === 'admin';

    return `
      <div class="page-header">
        <div class="page-title-group">
          <h1>${isAdmin ? 'Hostel Leave Applications & Gate Passes' : 'My Leave Applications & Gate Passes'}</h1>
          <p>${isAdmin ? 'Official overnight absence permissions, outstations, and family visits' : 'Apply for overnight outstation, vacation, and view gate pass approvals'}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="LeaveRequestsPage.openApplyModal()">
            <i data-lucide="calendar-plus"></i>
            <span>Apply For Leave</span>
          </button>
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
              <th>Leave Period</th>
              <th>Reason for Absence</th>
              <th>Emergency Contact</th>
              <th>Status</th>
              <th>Warden Remarks</th>
              ${isAdmin ? `<th>Action</th>` : ''}
            </tr>
          </thead>
          <tbody id="leaves-tbody">
            <tr>
              <td colspan="${isAdmin ? '8' : '5'}" style="text-align:center;padding:2.5rem;color:var(--text-muted);">
                Loading leave requests...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  },

  async afterRender() {
    await this.loadRequests();
  },

  async loadRequests() {
    try {
      const res = await API.get('/leave-requests');
      if (res && res.success) {
        this.renderTable(res.data);
        return;
      }
    } catch (e) {
      console.warn('[LeaveRequests] Online load failed, using local dataset');
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
      const formatted = list.map(l => ({
        ...l,
        startDateDisplay: l.startDateDisplay || (typeof Utils !== 'undefined' ? Utils.formatDate(l.start_date) : l.start_date),
        endDateDisplay: l.endDateDisplay || (typeof Utils !== 'undefined' ? Utils.formatDate(l.end_date) : l.end_date)
      }));
      this.renderTable(formatted);
    } else {
      Toast.error('Failed to load leave requests.');
    }
  },

  renderTable(requests) {
    const tbody = document.getElementById('leaves-tbody');
    if (!tbody) return;

    const user = API.getUser();
    const isAdmin = user && user.role === 'admin';

    if (requests.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="${isAdmin ? '8' : '5'}" style="text-align:center;padding:3rem;color:var(--text-muted);">
            <i data-lucide="calendar-check" style="width:40px;height:40px;margin-bottom:0.5rem;opacity:0.5;"></i>
            <p style="font-weight:600;">No pending or active leave requests.</p>
          </td>
        </tr>
      `;
      Utils.renderIcons();
      return;
    }

    tbody.innerHTML = requests.map(l => {
      const isPending = l.status === 'Pending';
      const isApproved = l.status === 'Approved';

      return `
        <tr>
          ${isAdmin ? `
            <td data-label="Resident">
              <div style="font-weight:700;color:var(--text-primary);">${Utils.escapeHTML(l.student_name)}</div>
              <div style="font-size:0.75rem;color:var(--text-muted);">${l.reg_number} • ${l.student_phone}</div>
            </td>

            <td data-label="Room & Bed">
              <span class="badge badge-info">${l.room_number ? `Rm ${l.room_number} • ${l.bed_label}` : '-'}</span>
            </td>
          ` : ''}

          <td data-label="Period">
            <div style="font-weight:700;">${l.startDateDisplay} → ${l.endDateDisplay}</div>
          </td>

          <td data-label="Reason">
            <span style="font-size:0.85rem;">${Utils.escapeHTML(l.reason)}</span>
          </td>

          <td data-label="Emergency Contact">
            <span style="font-weight:600;">${l.emergency_contact}</span>
          </td>

          <td data-label="Status">
            <span class="badge ${isApproved ? 'badge-success' : isPending ? 'badge-warning' : 'badge-danger'}">
              ${l.status}
            </span>
          </td>

          <td data-label="Remarks">
            <span style="font-size:0.8rem;color:var(--text-muted);">${Utils.escapeHTML(l.admin_remarks || '-')}</span>
          </td>

          ${isAdmin ? `
            <td data-label="Action">
              ${isPending ? `
                <div style="display:flex;gap:0.35rem;">
                  <button class="btn btn-sm btn-primary" onclick="LeaveRequestsPage.updateStatus(${l.id}, 'Approved')" title="Approve Leave Application">
                    Approve
                  </button>
                  <button class="btn btn-sm btn-danger" onclick="LeaveRequestsPage.updateStatus(${l.id}, 'Rejected')" title="Reject Leave Application">
                    Reject
                  </button>
                </div>
              ` : `
                <span style="font-size:0.75rem;color:var(--text-muted);font-weight:600;">Decision Logged</span>
              `}
            </td>
          ` : ''}
        </tr>
      `;
    }).join('');

    Utils.renderIcons();
  },

  openApplyModal() {
    const today = Utils.getTodayISO();
    const user = API.getUser();
    const student = API.getStudent();

    Modal.open({
      title: 'Hostel Leave Application',
      content: `
        <form onsubmit="LeaveRequestsPage.submitApplication(event)">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label required">Departure Date (From)</label>
              <input type="date" id="leave-start" class="form-control" value="${today}" required />
            </div>

            <div class="form-group">
              <label class="form-label required">Return Date (To)</label>
              <input type="date" id="leave-end" class="form-control" value="${today}" required />
            </div>

            <div class="form-group col-span-2">
              <label class="form-label required">Parent / Emergency Contact Number</label>
              <input type="tel" id="leave-contact" class="form-control" value="${student ? student.parent_phone : '+91 98765 11111'}" required />
            </div>

            <div class="form-group col-span-2">
              <label class="form-label required">Purpose / Reason for Leave</label>
              <textarea id="leave-reason" class="form-control" rows="3" placeholder="Provide destination address, family reason, or academic conference details..." required></textarea>
            </div>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:0.75rem;margin-top:1.5rem;padding-top:1rem;border-top:1px solid var(--border-color);">
            <button type="button" class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
            <button type="submit" class="btn btn-primary">Submit Application</button>
          </div>
        </form>
      `,
      maxWidth: '560px'
    });
  },

  async submitApplication(e) {
    e.preventDefault();
    const startDate = document.getElementById('leave-start').value;
    const endDate = document.getElementById('leave-end').value;
    const emergencyContact = document.getElementById('leave-contact').value;
    const reason = document.getElementById('leave-reason').value;

    try {
      const res = await API.post('/leave-requests', {
        startDate,
        endDate,
        emergencyContact,
        reason
      });

      if (res && res.success) {
        Toast.success(res.message);
        Modal.close();
        this.loadRequests();
        return;
      }
    } catch (err) {
      console.warn('[LeaveRequests] Online submit failed, storing locally');
    }

    if (typeof MockData !== 'undefined' && typeof MockData.addLeaveRequest === 'function') {
      const student = API.getStudent() || {};
      MockData.addLeaveRequest({
        student_id: student.id || 1,
        student_name: student.name || 'Ravi Kumar',
        reg_number: student.reg_number || '2024ST001',
        room_number: student.room_number || '205',
        startDate,
        endDate,
        emergencyContact,
        reason
      });
      Toast.success('Leave application submitted successfully!');
      Modal.close();
      this.loadRequests();
    } else {
      Toast.error('Failed to submit application.');
    }
  },

  async updateStatus(id, newStatus) {
    const remarks = prompt(`Enter optional remarks for ${newStatus} decision:`, newStatus === 'Approved' ? 'Approved by Warden. Gate pass issued.' : 'Incomplete documentation');
    if (remarks === null) return;

    try {
      const res = await API.put(`/leave-requests/${id}/status`, {
        status: newStatus,
        remarks
      });

      if (res && res.success) {
        Toast.success(res.message);
        this.loadRequests();
        return;
      }
    } catch (e) {
      console.warn('[LeaveRequests] Online status update failed, updating locally');
    }

    if (typeof MockData !== 'undefined' && typeof MockData.updateLeaveRequestStatus === 'function') {
      MockData.updateLeaveRequestStatus(id, newStatus, remarks);
      Toast.success(`Leave request ${newStatus.toLowerCase()} successfully.`);
      this.loadRequests();
    } else {
      Toast.error('Failed to update leave status.');
    }
  }
};

window.LeaveRequestsPage = LeaveRequestsPage;
