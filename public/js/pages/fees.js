/**
 * Fees & Joining-Date Billing Cycles Page Component
 * Displays student fee cycles, due status indicators, and fee reminders center
 */
const FeesPage = {
  currentFilter: 'all',

  async render() {
    return `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Fee Management & Joining-Date Cycles</h1>
          <p>Personalized billing cycles anchored to each student's date of admission</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="FeesPage.loadRemindersModal()">
            <i data-lucide="bell-ring" style="color:var(--primary-red);"></i>
            <span>Fee Reminders Center</span>
          </button>
          <button class="btn btn-primary" onclick="PaymentsPage.openRecordPaymentModal()">
            <i data-lucide="plus-circle"></i>
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      <!-- Overview Reminder Notice Cards -->
      <div class="kpi-grid" id="fee-reminders-summary-grid">
        <div class="kpi-card" style="border-left:4px solid var(--status-success);">
          <div class="kpi-header">
            <span class="kpi-title">Paid Cycles</span>
            <span class="badge badge-success">Current Month</span>
          </div>
          <div class="kpi-value" id="count-paid-cycles">170</div>
          <div class="kpi-footer">Fully settled student cycles</div>
        </div>

        <div class="kpi-card" style="border-left:4px solid var(--status-warning);">
          <div class="kpi-header">
            <span class="kpi-title">Due Soon</span>
            <span class="badge badge-warning">Within 7 Days</span>
          </div>
          <div class="kpi-value" id="count-due-soon-cycles">8</div>
          <div class="kpi-footer">Upcoming due reminders</div>
        </div>

        <div class="kpi-card" style="border-left:4px solid var(--status-danger);">
          <div class="kpi-header">
            <span class="kpi-title">Due Today & Overdue</span>
            <span class="badge badge-danger">Action Required</span>
          </div>
          <div class="kpi-value" id="count-overdue-cycles">5</div>
          <div class="kpi-footer">Total ₹91,000 pending</div>
        </div>
      </div>

      <!-- Filter Controls -->
      <div class="card" style="margin-bottom:1.25rem;padding:1rem;">
        <div style="display:flex;gap:1rem;flex-wrap:wrap;align-items:center;justify-content:space-between;">
          <div style="display:flex;gap:0.5rem;">
            <button class="btn btn-sm btn-secondary active" onclick="FeesPage.setFilter('all', this)">All Cycles</button>
            <button class="btn btn-sm btn-secondary" onclick="FeesPage.setFilter('pending', this)">Pending / Due Only</button>
            <button class="btn btn-sm btn-secondary" onclick="FeesPage.setFilter('paid', this)">Paid Only</button>
          </div>

          <div style="min-width:260px;position:relative;">
            <i data-lucide="search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-muted);width:16px;height:16px;"></i>
            <input 
              type="text" 
              id="fee-search-input" 
              class="form-control" 
              style="padding-left:2.2rem;" 
              placeholder="Search by student name, room, reg no..."
              oninput="FeesPage.handleSearch(this.value)"
            />
          </div>
        </div>
      </div>

      <!-- Fee Cycles Table -->
      <div class="table-container">
        <table class="data-table data-table-responsive-cards" id="fee-cycles-table">
          <thead>
            <tr>
              <th>Resident Student</th>
              <th>Room & Bed</th>
              <th>Cycle #</th>
              <th>Billing Period (Anchor)</th>
              <th>Due Date</th>
              <th>Monthly Fee</th>
              <th>Due Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="fee-cycles-tbody">
            <tr>
              <td colspan="8" style="text-align:center;padding:2.5rem;color:var(--text-muted);">
                Loading fee cycles...
              </td>
            </tr>
          </tbody>
        </table>

        <div class="pagination" id="fee-pagination" style="display:none;"></div>
      </div>
    `;
  },

  async afterRender() {
    await this.loadCycles();
    await this.loadReminderStats();
  },

  currentSearch: '',
  currentPage: 1,

  setFilter(status, btn) {
    this.currentFilter = status;
    this.currentPage = 1;
    if (btn && btn.parentElement) {
      btn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
    this.loadCycles();
  },

  searchTimer: null,
  handleSearch(val) {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.currentSearch = val;
      this.currentPage = 1;
      this.loadCycles();
    }, 250);
  },

  async loadCycles() {
    try {
      const tbody = document.getElementById('fee-cycles-tbody');
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--text-muted);">Refreshing cycles...</td></tr>';
      }

      const res = await API.get('/fees/cycles', {
        page: this.currentPage,
        limit: 15,
        status: this.currentFilter === 'all' ? '' : this.currentFilter,
        search: this.currentSearch
      });

      if (res.success) {
        this.renderTable(res.data, res.pagination);
      }
    } catch (e) {
      Toast.error('Failed to load fee cycles: ' + e.message);
    }
  },

  async loadReminderStats() {
    try {
      const res = await API.get('/fees/reminders');
      if (res.success && res.data.summary) {
        const s = res.data.summary;
        const dueSoonEl = document.getElementById('count-due-soon-cycles');
        const overdueEl = document.getElementById('count-overdue-cycles');
        if (dueSoonEl) dueSoonEl.innerText = s.dueSoonCount;
        if (overdueEl) overdueEl.innerText = s.overdueCount + s.dueTodayCount;
      }
    } catch (e) {}
  },

  renderTable(cycles, pagination) {
    const tbody = document.getElementById('fee-cycles-tbody');
    const paginationEl = document.getElementById('fee-pagination');
    if (!tbody) return;

    if (cycles.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center;padding:3rem;color:var(--text-muted);">
            <i data-lucide="calendar-x" style="width:40px;height:40px;margin-bottom:0.5rem;opacity:0.5;"></i>
            <p style="font-weight:600;">No fee cycles found matching filter.</p>
          </td>
        </tr>
      `;
      if (paginationEl) paginationEl.style.display = 'none';
      Utils.renderIcons();
      return;
    }

    tbody.innerHTML = cycles.map(c => {
      const reminder = c.reminder || { badgeClass: 'badge-danger', label: 'Pending' };

      return `
        <tr>
          <td data-label="Student">
            <div style="font-weight:700;color:var(--text-primary);">${Utils.escapeHTML(c.student_name)}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);">${c.reg_number} • Joining: ${Utils.formatDate(c.joining_date)}</div>
          </td>

          <td data-label="Room & Bed">
            <span class="badge badge-info">${c.room_number ? `Rm ${c.room_number} • ${c.bed_label}` : 'Unallocated'}</span>
          </td>

          <td data-label="Cycle" style="font-weight:700;">
            Cycle ${c.cycle_number}
          </td>

          <td data-label="Period">
            <div style="font-weight:600;">${c.startDateDisplay} → ${c.endDateDisplay}</div>
          </td>

          <td data-label="Due Date">
            <strong>${c.dueDateDisplay}</strong>
          </td>

          <td data-label="Amount" style="font-weight:800;color:var(--text-primary);">
            ${Utils.formatINR(c.amount)}
          </td>

          <td data-label="Status">
            <span class="badge ${reminder.badgeClass}">
              ${reminder.label}
            </span>
          </td>

          <td data-label="Action">
            ${c.status === 'paid' ? `
              <button class="btn btn-sm btn-secondary" onclick="PaymentsPage.openReceiptByCycle(${c.id})" title="View Receipt">
                <i data-lucide="receipt" style="width:14px;height:14px;"></i>
                Receipt
              </button>
            ` : `
              <button class="btn btn-sm btn-primary" onclick="PaymentsPage.openRecordPaymentModal(${c.student_id}, '${Utils.escapeHTML(c.student_name)}', ${c.amount}, '${c.start_date}', '${c.end_date}', ${c.id})">
                Record Pay
              </button>
            `}
          </td>
        </tr>
      `;
    }).join('');

    // Pagination
    if (paginationEl && pagination && pagination.totalPages > 1) {
      paginationEl.style.display = 'flex';
      paginationEl.innerHTML = `
        <span class="pagination-info">
          Showing ${(pagination.page - 1) * pagination.limit + 1} to ${Math.min(pagination.page * pagination.limit, pagination.totalRecords)} of ${pagination.totalRecords}
        </span>
        <div class="pagination-controls">
          <button class="btn btn-sm btn-secondary" ${pagination.page <= 1 ? 'disabled' : ''} onclick="FeesPage.changePage(${pagination.page - 1})">
            Previous
          </button>
          <span style="font-size:0.82rem;font-weight:700;padding:0.4rem 0.75rem;">Page ${pagination.page} of ${pagination.totalPages}</span>
          <button class="btn btn-sm btn-secondary" ${pagination.page >= pagination.totalPages ? 'disabled' : ''} onclick="FeesPage.changePage(${pagination.page + 1})">
            Next
          </button>
        </div>
      `;
    } else if (paginationEl) {
      paginationEl.style.display = 'none';
    }

    Utils.renderIcons();
  },

  changePage(p) {
    this.currentPage = p;
    this.loadCycles();
  },

  async loadRemindersModal() {
    try {
      const res = await API.get('/fees/reminders');
      if (!res.success) return;

      const { summary, overdue, dueToday, dueSoon } = res.data;

      const renderSection = (title, list, badgeClass) => `
        <div style="margin-bottom:1.5rem;">
          <div style="font-size:0.85rem;font-weight:700;color:var(--text-primary);margin-bottom:0.75rem;display:flex;align-items:center;gap:0.5rem;">
            <span>${title}</span>
            <span class="badge ${badgeClass}">${list.length} Students</span>
          </div>
          ${list.length === 0 ? `
            <div style="font-size:0.82rem;color:var(--text-muted);padding:0.5rem;">No students in this reminder category.</div>
          ` : `
            <div style="display:flex;flex-direction:column;gap:0.5rem;">
              ${list.map(s => `
                <div style="display:flex;align-items:center;justify-content:space-between;background:var(--bg-secondary);padding:0.6rem 0.85rem;border-radius:var(--radius-md);font-size:0.85rem;">
                  <div>
                    <strong>${Utils.escapeHTML(s.student_name)}</strong> (${s.reg_number}) • Room ${s.room_number || '-'}
                    <div style="font-size:0.75rem;color:var(--text-muted);">
                      Due Date: ${s.dueDateDisplay} • Cycle: ${s.startDateDisplay} to ${s.endDateDisplay}
                    </div>
                  </div>
                  <button class="btn btn-sm btn-primary" onclick="Modal.close(); PaymentsPage.openRecordPaymentModal(${s.student_id}, '${Utils.escapeHTML(s.student_name)}', ${s.amount}, '${s.start_date}', '${s.end_date}', ${s.id})">
                    Pay Now
                  </button>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      `;

      Modal.open({
        title: 'Fee Reminders Notification Center',
        content: `
          <div style="font-size:0.9rem;color:var(--text-secondary);">
            <p style="margin-bottom:1.25rem;">
              Automated reminders calculated based on student admission anchor dates:
            </p>
            ${renderSection('🔴 Overdue Cycles', overdue, 'badge-danger')}
            ${renderSection('🔴 Due Today', dueToday, 'badge-danger')}
            ${renderSection('🟡 Due Soon (Within 7 Days)', dueSoon, 'badge-warning')}
            <div style="text-align:right;margin-top:1.5rem;">
              <button class="btn btn-secondary" onclick="Modal.close()">Close Center</button>
            </div>
          </div>
        `,
        maxWidth: '680px'
      });
    } catch (e) {
      Toast.error('Failed to open reminders center: ' + e.message);
    }
  }
};

window.FeesPage = FeesPage;
