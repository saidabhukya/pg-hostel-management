/**
 * Student Profile Modal / Detailed View
 * Displays 5 tabs: Profile, Fees & Cycles, Payments & Receipts, Complaints, Leave Requests
 */
const StudentProfile = {
  currentStudentId: null,

  async open(studentId) {
    this.currentStudentId = studentId;
    try {
      const res = await API.get(`/students/${studentId}`);
      if (!res.success) {
        Toast.error(res.message);
        return;
      }

      const { profile, feeCycles, payments, complaints, leaveRequests, nextDueInfo } = res.data;
      const user = API.getUser();
      const isAdmin = user && user.role === 'admin';

      const content = this.buildContent(profile, feeCycles, payments, complaints, leaveRequests, nextDueInfo, isAdmin);

      Modal.open({
        title: `Student Profile: ${profile.name}`,
        content,
        maxWidth: '820px'
      });
    } catch (e) {
      Toast.error('Failed to load student profile: ' + e.message);
    }
  },

  /**
   * Build the full modal content HTML.
   * Called by both open() and Header.openMyStudentProfile().
   */
  buildContent(profile, feeCycles, payments, complaints, leaveRequests, nextDueInfo, isAdmin) {
    return `
        <div>
          <!-- Profile Header Banner -->
          <div style="display:flex;gap:1.25rem;align-items:center;background:var(--bg-secondary);padding:1.25rem;border-radius:var(--radius-lg);margin-bottom:1.25rem;border:1px solid var(--border-color);flex-wrap:wrap;">
            <div class="user-avatar" style="width:64px;height:64px;font-size:1.5rem;border:3px solid var(--primary-red-border);">
              ${profile.name.charAt(0)}
            </div>
            <div style="flex:1;min-width:200px;">
              <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;">
                <h2 style="font-size:1.35rem;font-weight:800;color:var(--text-primary);">${Utils.escapeHTML(profile.name)}</h2>
                <span class="badge badge-info">${profile.reg_number}</span>
                <span class="badge ${profile.status === 'active' ? 'badge-success' : 'badge-danger'}">${profile.status}</span>
              </div>
              <div style="font-size:0.84rem;color:var(--text-muted);margin-top:0.25rem;">
                ${Utils.escapeHTML(profile.college)} • ${Utils.escapeHTML(profile.course)} (${profile.year})
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;font-weight:700;">Current Room & Bed</div>
              <div style="font-size:1.1rem;font-weight:800;color:var(--primary-red);">
                ${profile.room_number ? `Room ${profile.room_number} • ${profile.bed_label}` : 'Not Allocated'}
              </div>
            </div>
          </div>

          <!-- 5 TABS NAVIGATION -->
          <div class="tab-nav">
            <button class="tab-btn active" onclick="StudentProfile.switchTab('tab-bio', this)">
              <i data-lucide="user" style="width:16px;height:16px;"></i> Profile Bio
            </button>
            <button class="tab-btn" onclick="StudentProfile.switchTab('tab-fees', this)">
              <i data-lucide="credit-card" style="width:16px;height:16px;"></i> Fees & Cycles (${feeCycles.length})
            </button>
            <button class="tab-btn" onclick="StudentProfile.switchTab('tab-payments', this)">
              <i data-lucide="receipt" style="width:16px;height:16px;"></i> Payments (${payments.length})
            </button>
            <button class="tab-btn" onclick="StudentProfile.switchTab('tab-complaints', this)">
              <i data-lucide="alert-triangle" style="width:16px;height:16px;"></i> Complaints (${complaints.length})
            </button>
            <button class="tab-btn" onclick="StudentProfile.switchTab('tab-leaves', this)">
              <i data-lucide="calendar" style="width:16px;height:16px;"></i> Leaves (${leaveRequests.length})
            </button>
          </div>

          <!-- TAB 1: BIO & PARENT DETAILS -->
          <div id="tab-bio" class="tab-content active">
            <div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:1rem;font-size:0.88rem;">
              <div class="card" style="padding:1rem;">
                <h4 style="font-size:0.82rem;font-weight:700;color:var(--primary-red);text-transform:uppercase;margin-bottom:0.75rem;">Residency Information</h4>
                <div style="display:flex;flex-direction:column;gap:0.5rem;">
                  <div><span style="color:var(--text-muted);">Joining Date:</span> <strong>${Utils.formatDate(profile.joining_date)}</strong></div>
                  <div><span style="color:var(--text-muted);">Floor:</span> <strong>Floor ${profile.floor_number || '-'}</strong></div>
                  <div><span style="color:var(--text-muted);">Room Number:</span> <strong>Room ${profile.room_number || '-'}</strong></div>
                  <div><span style="color:var(--text-muted);">Bed Assignment:</span> <strong>${profile.bed_label || '-'}</strong></div>
                  <div><span style="color:var(--text-muted);">Monthly Fee:</span> <strong>${Utils.formatINR(profile.monthly_fee)}</strong></div>
                </div>
              </div>

              <div class="card" style="padding:1rem;">
                <h4 style="font-size:0.82rem;font-weight:700;color:var(--primary-red);text-transform:uppercase;margin-bottom:0.75rem;">Emergency & Parent Details</h4>
                <div style="display:flex;flex-direction:column;gap:0.5rem;">
                  <div><span style="color:var(--text-muted);">Parent / Guardian:</span> <strong>${Utils.escapeHTML(profile.parent_name)}</strong></div>
                  <div><span style="color:var(--text-muted);">Parent Phone:</span> <strong>${profile.parent_phone}</strong></div>
                  <div><span style="color:var(--text-muted);">Student Phone:</span> <strong>${profile.phone}</strong></div>
                  <div><span style="color:var(--text-muted);">College Email:</span> <strong>${profile.email}</strong></div>
                  <div><span style="color:var(--text-muted);">Permanent Address:</span> <span>${Utils.escapeHTML(profile.address)}</span></div>
                </div>
              </div>
            </div>

            ${isAdmin ? `
              <div style="display:flex;justify-content:flex-end;gap:0.75rem;margin-top:1.25rem;">
                <button class="btn btn-secondary btn-sm" onclick="RoomDetailModal.promptTransfer(${profile.id}, '${Utils.escapeHTML(profile.name)}', ${profile.bed_id})">
                  <i data-lucide="arrow-right-left" style="width:14px;height:14px;"></i>
                  Transfer Bed
                </button>
                <button class="btn btn-danger btn-sm" onclick="StudentProfile.vacateStudent(${profile.id}, '${Utils.escapeHTML(profile.name)}')">
                  <i data-lucide="user-x" style="width:14px;height:14px;"></i>
                  Vacate Student
                </button>
              </div>
            ` : ''}
          </div>

          <!-- TAB 2: FEES & JOINING-DATE CYCLES -->
          <div id="tab-fees" class="tab-content">
            <!-- Next Due Highlight Banner -->
            ${nextDueInfo ? `
              <div style="background:var(--bg-secondary);border:1px solid var(--border-color);border-left:4px solid var(--primary-red);border-radius:var(--radius-md);padding:1rem;margin-bottom:1rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.75rem;">
                <div>
                  <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;color:var(--text-muted);">Next Fee Due Reminder</div>
                  <div style="font-size:1.15rem;font-weight:800;color:var(--text-primary);">
                    Due on ${nextDueInfo.dueDateDisplay || Utils.formatDate(nextDueInfo.dueDate)}
                  </div>
                  <div style="font-size:0.8rem;color:var(--text-muted);">Cycle ${nextDueInfo.cycleNumber} • ₹7,000 monthly fee</div>
                </div>
                <div style="display:flex;align-items:center;gap:0.5rem;">
                  <span class="badge ${nextDueInfo.reminder.badgeClass}" style="font-size:0.85rem;padding:0.35rem 0.75rem;">
                    ${nextDueInfo.reminder.label}
                  </span>
                  ${isAdmin ? `
                    <button class="btn btn-sm btn-primary" onclick="PaymentsPage.openRecordPaymentModal(${profile.id}, '${Utils.escapeHTML(profile.name)}', ${profile.monthly_fee})">
                      Record Payment
                    </button>
                  ` : ''}
                </div>
              </div>
            ` : ''}

            <div class="table-container" style="border:none;">
              <table class="data-table" style="font-size:0.85rem;">
                <thead>
                  <tr>
                    <th>Cycle</th>
                    <th>Billing Period</th>
                    <th>Due Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${feeCycles.map(c => `
                    <tr>
                      <td style="font-weight:700;">Cycle ${c.cycle_number}</td>
                      <td>${Utils.formatDate(c.start_date)} → ${Utils.formatDate(c.end_date)}</td>
                      <td>${Utils.formatDate(c.due_date)}</td>
                      <td style="font-weight:700;">${Utils.formatINR(c.amount)}</td>
                      <td>
                        <span class="badge ${c.status === 'paid' ? 'badge-success' : 'badge-danger'}">
                          ${c.status === 'paid' ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            ${isAdmin ? `
              <div style="margin-top:1rem;text-align:right;">
                <button class="btn btn-sm btn-secondary" onclick="StudentProfile.generateNextCycle(${profile.id})">
                  <i data-lucide="plus" style="width:14px;height:14px;"></i>
                  Generate Next Billing Cycle
                </button>
              </div>
            ` : ''}
          </div>

          <!-- TAB 3: PAYMENTS & RECEIPTS -->
          <div id="tab-payments" class="tab-content">
            ${payments.length === 0 ? `
              <p style="color:var(--text-muted);text-align:center;padding:2rem;">No recorded payments yet.</p>
            ` : `
              <div class="table-container" style="border:none;">
                <table class="data-table" style="font-size:0.85rem;">
                  <thead>
                    <tr>
                      <th>Receipt #</th>
                      <th>Payment Date</th>
                      <th>Cycle Covered</th>
                      <th>Method</th>
                      <th>Amount</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${payments.map(p => `
                      <tr>
                        <td><span class="badge badge-info">${p.receipt_number}</span></td>
                        <td>${Utils.formatDate(p.payment_date)}</td>
                        <td>${Utils.formatDate(p.cycle_start_date)} to ${Utils.formatDate(p.cycle_end_date)}</td>
                        <td>${p.payment_method}</td>
                        <td style="font-weight:700;color:var(--status-success);">${Utils.formatINR(p.amount)}</td>
                        <td>
                          <button class="btn btn-sm btn-secondary" onclick="ReceiptModal.open(${p.id})">
                            <i data-lucide="download" style="width:14px;height:14px;"></i>
                            Receipt
                          </button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>

          <!-- TAB 4: COMPLAINTS -->
          <div id="tab-complaints" class="tab-content">
            ${complaints.length === 0 ? `
              <p style="color:var(--text-muted);text-align:center;padding:2rem;">No complaints logged by this resident.</p>
            ` : `
              <div style="display:flex;flex-direction:column;gap:0.75rem;">
                ${complaints.map(c => `
                  <div class="card" style="padding:1rem;background:var(--bg-secondary);">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.35rem;">
                      <span class="badge badge-info">${c.category}</span>
                      <span class="badge ${c.status === 'Resolved' ? 'badge-success' : c.status === 'In Progress' ? 'badge-warning' : 'badge-danger'}">
                        ${c.status}
                      </span>
                    </div>
                    <div style="font-weight:700;color:var(--text-primary);font-size:0.95rem;">${Utils.escapeHTML(c.title)}</div>
                    <div style="font-size:0.82rem;color:var(--text-secondary);margin:0.25rem 0;">${Utils.escapeHTML(c.description)}</div>
                    <div style="font-size:0.72rem;color:var(--text-muted);">${Utils.formatDate(c.created_at)}</div>
                    ${c.admin_notes ? `
                      <div style="margin-top:0.5rem;padding:0.4rem 0.6rem;background:var(--bg-card);border-radius:var(--radius-sm);font-size:0.78rem;color:var(--text-secondary);">
                        <strong>Warden Note:</strong> ${Utils.escapeHTML(c.admin_notes)}
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <!-- TAB 5: LEAVE REQUESTS -->
          <div id="tab-leaves" class="tab-content">
            ${leaveRequests.length === 0 ? `
              <p style="color:var(--text-muted);text-align:center;padding:2rem;">No leave requests on file.</p>
            ` : `
              <div style="display:flex;flex-direction:column;gap:0.75rem;">
                ${leaveRequests.map(l => `
                  <div class="card" style="padding:1rem;background:var(--bg-secondary);">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.35rem;">
                      <span style="font-weight:700;font-size:0.85rem;color:var(--text-primary);">
                        ${Utils.formatDate(l.start_date)} → ${Utils.formatDate(l.end_date)}
                      </span>
                      <span class="badge ${l.status === 'Approved' ? 'badge-success' : l.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}">
                        ${l.status}
                      </span>
                    </div>
                    <div style="font-size:0.85rem;color:var(--text-secondary);">${Utils.escapeHTML(l.reason)}</div>
                    <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.25rem;">
                      Emergency Contact: ${l.emergency_contact}
                    </div>
                    ${l.admin_remarks ? `
                      <div style="margin-top:0.4rem;font-size:0.75rem;color:var(--primary-red);">
                        <strong>Remarks:</strong> ${Utils.escapeHTML(l.admin_remarks)}
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>
      `;
  },  /* end buildContent */

  switchTab(tabId, btn) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    const target = document.getElementById(tabId);
    if (target) target.classList.add('active');
    if (btn) btn.classList.add('active');
    Utils.renderIcons();
  },

  async generateNextCycle(studentId) {
    try {
      const res = await API.post(`/fees/generate-next/${studentId}`);
      if (res.success) {
        Toast.success(res.message);
        this.open(studentId);
      }
    } catch (e) {
      Toast.error(e.message);
    }
  },

  async vacateStudent(studentId, name) {
    if (!confirm(`Are you sure you want to mark ${name} as vacated? This will free up their bed immediately.`)) {
      return;
    }

    try {
      const res = await API.delete(`/students/${studentId}`);
      Toast.success(res.message);
      Modal.close();
      if (window.StudentsPage) StudentsPage.loadStudents();
      if (window.HostelStructurePage) HostelStructurePage.loadStructure();
    } catch (e) {
      Toast.error(e.message);
    }
  }
};

window.StudentProfile = StudentProfile;
