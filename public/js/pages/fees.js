/**
 * Fees & Joining-Date Billing Cycles Page Component
 * Displays student fee cycles, due status indicators, and fee reminders center
 */
const FeesPage = {
  currentFilter: 'all',

  async render() {
    const user = API.getUser();
    const isAdmin = !user || user.role === 'admin';

    return `
      <div class="page-header">
        <div class="page-title-group">
          <h1>${isAdmin ? 'Fee Management & Joining-Date Cycles' : 'My Fee Dues & Billing Cycles'}</h1>
          <p>${isAdmin ? 'Personalized billing cycles anchored to each student\'s date of admission' : 'Your personal room rental billing cycles anchored to your date of admission'}</p>
        </div>
        ${isAdmin ? `
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
        ` : ''}
      </div>

      <!-- Overview Reminder Notice Cards -->
      <div class="kpi-grid" id="fee-reminders-summary-grid">
        <div class="kpi-card" style="border-left:4px solid var(--status-success);">
          <div class="kpi-header">
            <span class="kpi-title">Paid Cycles</span>
            <span class="badge badge-success">Settled</span>
          </div>
          <div class="kpi-value" id="count-paid-cycles">0</div>
          <div class="kpi-footer">${isAdmin ? 'Fully settled student cycles' : 'My fully settled cycles'}</div>
        </div>

        <div class="kpi-card" style="border-left:4px solid var(--status-warning);">
          <div class="kpi-header">
            <span class="kpi-title">Pending Cycles</span>
            <span class="badge badge-warning">Awaiting Fee</span>
          </div>
          <div class="kpi-value" id="count-due-soon-cycles">0</div>
          <div class="kpi-footer">${isAdmin ? 'Upcoming due reminders' : 'My upcoming due cycles'}</div>
        </div>

        <div class="kpi-card" style="border-left:4px solid var(--status-danger);">
          <div class="kpi-header">
            <span class="kpi-title">Total Pending</span>
            <span class="badge badge-danger">Action Required</span>
          </div>
          <div class="kpi-value" id="count-overdue-cycles">₹0</div>
          <div class="kpi-footer" id="pending-amount-footer">${isAdmin ? 'Pending fee collection' : 'My total pending dues'}</div>
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

          ${isAdmin ? `
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
          ` : ''}
        </div>
      </div>

      <!-- Fee Cycles Table -->
      <div class="table-container">
        <table class="data-table data-table-responsive-cards" id="fee-cycles-table">
          <thead>
            <tr>
              ${isAdmin ? `
                <th>Resident Student</th>
                <th>Room & Bed</th>
              ` : ''}
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
              <td colspan="${isAdmin ? '8' : '6'}" style="text-align:center;padding:2.5rem;color:var(--text-muted);">
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

      if (res && res.success) {
        this.renderTable(res.data, res.pagination);
        return;
      }
    } catch (e) {
      console.warn('[FeesPage] API cycles load failed, falling back to local dataset:', e.message);
    }

    // Graceful fallback to MockData if API failed or offline
    if (typeof MockData !== 'undefined' && MockData.feeCycles) {
      let list = MockData.feeCycles;
      if (this.currentFilter !== 'all') {
        list = list.filter(c => c.status === this.currentFilter);
      }
      if (this.currentSearch) {
        const q = this.currentSearch.toLowerCase();
        list = list.filter(c => 
          (c.student_name && c.student_name.toLowerCase().includes(q)) || 
          (c.reg_number && c.reg_number.toLowerCase().includes(q)) || 
          (c.room_number && String(c.room_number).includes(q))
        );
      }
      this.renderTable(list, { page: 1, limit: 100, totalPages: 1, totalRecords: list.length });
    } else {
      Toast.error('Unable to retrieve fee billing cycles.');
    }
  },

  async loadReminderStats() {
    let summary = null;
    try {
      const res = await API.get('/fees/reminders');
      if (res && res.success && res.data && res.data.summary) {
        summary = res.data.summary;
      }
    } catch (e) {
      console.warn('[FeesPage] API reminders load failed, falling back to local dataset:', e.message);
    }

    if (!summary) {
      const mock = this.getMockReminders();
      summary = mock.summary;
    }

    if (summary) {
      const paidEl = document.getElementById('count-paid-cycles');
      const dueSoonEl = document.getElementById('count-due-soon-cycles');
      const overdueEl = document.getElementById('count-overdue-cycles');
      const pendingFooter = document.getElementById('pending-amount-footer');
      if (paidEl) paidEl.innerText = summary.paidCount ?? 0;
      if (dueSoonEl) dueSoonEl.innerText = (summary.dueSoonCount || 0) + (summary.overdueCount || 0) + (summary.dueTodayCount || 0);
      if (overdueEl) overdueEl.innerText = Utils.formatINR(summary.pendingTotal || 0);
      if (pendingFooter) {
        const totalPending = summary.totalActionRequired || (summary.dueSoonCount || 0) + (summary.overdueCount || 0);
        pendingFooter.innerText = `${totalPending} cycle(s) awaiting payment`;
      }
    }
  },

  renderTable(cycles, pagination) {
    const tbody = document.getElementById('fee-cycles-tbody');
    const paginationEl = document.getElementById('fee-pagination');
    if (!tbody) return;

    const user = API.getUser();
    const isAdmin = !user || user.role === 'admin';

    if (cycles.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="${isAdmin ? '8' : '6'}" style="text-align:center;padding:3rem;color:var(--text-muted);">
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
      const isPaid = c.status === 'paid' || (Number(c.paid_amount || 0) >= Number(c.amount || 0));
      const reminder = c.reminder || (isPaid 
        ? { badgeClass: 'badge-success', label: 'Paid' } 
        : { badgeClass: 'badge-danger', label: 'Pending' });

      return `
        <tr>
          ${isAdmin ? `
            <td data-label="Student">
              <div style="font-weight:700;color:var(--text-primary);">${Utils.escapeHTML(c.student_name)}</div>
              <div style="font-size:0.75rem;color:var(--text-muted);">${c.reg_number} • Joining: ${c.joining_date ? Utils.formatDate(c.joining_date) : (c.start_date ? Utils.formatDate(c.start_date) : '-')}</div>
            </td>

            <td data-label="Room & Bed">
              <span class="badge badge-info">${c.room_number ? `Rm ${c.room_number} • ${c.bed_label || ''}` : 'Unallocated'}</span>
            </td>
          ` : ''}

          <td data-label="Cycle" style="font-weight:700;">
            Cycle ${c.cycle_number || 1}
          </td>

          <td data-label="Period">
            <div style="font-weight:600;">${c.startDateDisplay || c.start_date || '-'} → ${c.endDateDisplay || c.end_date || '-'}</div>
          </td>

          <td data-label="Due Date">
            <strong>${c.dueDateDisplay || c.due_date || '-'}</strong>
          </td>

          <td data-label="Monthly Fee" style="font-weight:800;color:var(--text-primary);">
            ${Utils.formatINR(c.amount)}
            ${isPaid ? '' : (Number(c.paid_amount) > 0 ? `<div style="font-size:0.75rem;color:var(--status-warning);">Paid: ${Utils.formatINR(c.paid_amount)}</div>` : '')}
          </td>

          <td data-label="Due Status">
            <span class="badge ${isPaid ? 'badge-success' : reminder.badgeClass}">
              ${isPaid ? 'Paid' : reminder.label}
            </span>
          </td>

          <td data-label="Action">
            ${isPaid ? `
              <div style="display:flex;gap:0.35rem;align-items:center;">
                <button class="btn btn-sm btn-secondary" onclick="PaymentsPage.openReceiptByCycle(${c.id})" title="View / Download Receipt">
                  <i data-lucide="receipt" style="width:14px;height:14px;"></i>
                  <span>Receipt</span>
                </button>
                <button class="btn btn-sm" style="background:#25d366;color:#ffffff;border:none;padding:0.35rem 0.6rem;font-weight:600;display:inline-flex;align-items:center;gap:0.25rem;" onclick="PaymentsPage.openReceiptByCycle(${c.id}, true)" title="Send PDF Receipt to Student on WhatsApp">
                  <i data-lucide="message-circle" style="width:14px;height:14px;"></i>
                  <span>WhatsApp</span>
                </button>
              </div>
            ` : (isAdmin ? `
              <button class="btn btn-sm btn-primary" onclick="PaymentsPage.openRecordPaymentModal(${c.student_id}, '${Utils.escapeHTML(c.student_name)}', ${c.amount}, '${c.start_date}', '${c.end_date}', ${c.id})">
                <i data-lucide="credit-card" style="width:14px;height:14px;"></i>
                <span>Record Pay</span>
              </button>
            ` : `
              <span class="badge badge-danger" style="font-size:0.78rem;">Payment Due</span>
            `)}
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

  // Cache for open modal items to prevent inline quote escaping issues in onclick
  remindersCache: {},

  getMockReminders() {
    if (typeof MockData === 'undefined') {
      return { overdue: [], dueToday: [], dueSoon: [], upcoming: [], summary: { paidCount: 0, pendingTotal: 0 } };
    }
    const cycles = (MockData.feeCycles || []).filter(c => c.status !== 'paid');
    const today = new Date().toISOString().slice(0, 10);
    const overdue = [];
    const dueToday = [];
    const dueSoon = [];
    const upcoming = [];
    let pendingTotal = 0;

    cycles.forEach(c => {
      const amount = Number(c.amount || 7000);
      const paid = Number(c.paid_amount || 0);
      pendingTotal += Math.max(0, amount - paid);

      const dStr = c.due_date || today;
      let diffDays = 0;
      try {
        const d1 = new Date(today);
        const d2 = new Date(dStr);
        diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
      } catch (e) {}

      const item = {
        id: c.id,
        student_id: c.student_id,
        student_name: c.student_name || 'Resident Student',
        reg_number: c.reg_number || 'REG',
        student_phone: c.phone || c.student_phone || '',
        room_number: c.room_number || '-',
        bed_label: c.bed_label || '',
        amount: amount,
        paid_amount: paid,
        start_date: c.start_date,
        end_date: c.end_date,
        due_date: c.due_date,
        startDateDisplay: c.startDateDisplay || c.start_date || '-',
        endDateDisplay: c.endDateDisplay || c.end_date || '-',
        dueDateDisplay: c.dueDateDisplay || c.due_date || '-',
        daysDifference: diffDays
      };

      if (diffDays < 0) {
        overdue.push(item);
      } else if (diffDays === 0) {
        dueToday.push(item);
      } else if (diffDays <= 7) {
        dueSoon.push(item);
      } else {
        upcoming.push(item);
      }
    });

    const paidCount = (MockData.feeCycles || []).filter(c => c.status === 'paid').length;
    return {
      summary: {
        paidCount,
        pendingTotal,
        overdueCount: overdue.length,
        dueTodayCount: dueToday.length,
        dueSoonCount: dueSoon.length,
        upcomingCount: upcoming.length,
        totalActionRequired: overdue.length + dueToday.length + dueSoon.length,
        totalPendingCount: cycles.length
      },
      overdue,
      dueToday,
      dueSoon,
      upcoming
    };
  },

  async loadRemindersModal() {
    // 1. Instantly open modal with responsive loading state so button always opens without delay
    Modal.open({
      title: 'Fee Reminders Notification Center',
      content: `
        <div id="reminders-modal-body" style="text-align:center;padding:2.5rem 1rem;">
          <div class="spinner" style="margin:0 auto 1rem;width:36px;height:36px;border-width:3px;"></div>
          <p style="font-weight:700;color:var(--text-primary);margin-bottom:0.25rem;">Checking Fee Reminders...</p>
          <p style="font-size:0.8rem;color:var(--text-muted);margin:0;">Scanning admission anchor dates, active billing periods, and due deadlines</p>
        </div>
      `,
      maxWidth: '720px'
    });
    Utils.renderIcons();

    let data = null;
    try {
      const res = await API.get('/fees/reminders');
      if (res && res.success && res.data) {
        data = res.data;
      }
    } catch (e) {
      console.warn('[Fee Reminders] API call failed, falling back to local data:', e.message);
    }

    if (!data) {
      data = this.getMockReminders();
    }

    const overdue = data.overdue || [];
    const dueToday = data.dueToday || [];
    const dueSoon = data.dueSoon || [];
    const upcoming = data.upcoming || [];

    // Cache items indexed by unique key for safe button event handlers
    this.remindersCache = {};
    [...overdue, ...dueToday, ...dueSoon, ...upcoming].forEach(item => {
      const key = `${item.student_id || 0}_${item.id || 0}`;
      this.remindersCache[key] = item;
    });

    const bodyEl = document.getElementById('reminders-modal-body');
    if (!bodyEl) return;

    const totalDues = overdue.length + dueToday.length + dueSoon.length + upcoming.length;

    const renderCard = (s) => {
      const key = `${s.student_id || 0}_${s.id || 0}`;
      const phone = s.student_phone || s.phone || '';
      return `
        <div style="display:flex;align-items:center;justify-content:space-between;background:var(--bg-secondary);padding:0.75rem 1rem;border-radius:var(--radius-md);border:1px solid var(--border-color);gap:0.75rem;flex-wrap:wrap;">
          <div style="min-width:200px;flex:1;">
            <div style="font-weight:700;color:var(--text-primary);font-size:0.92rem;">
              ${Utils.escapeHTML(s.student_name)}
              <span style="font-weight:500;font-size:0.8rem;color:var(--text-muted);margin-left:0.35rem;">(${Utils.escapeHTML(s.reg_number || '')})</span>
            </div>
            <div style="font-size:0.78rem;color:var(--text-secondary);margin-top:0.25rem;">
              <span class="badge badge-info" style="font-size:0.72rem;padding:0.15rem 0.45rem;">Rm ${s.room_number || '-'} ${s.bed_label ? '• ' + s.bed_label : ''}</span>
              <span style="margin-left:0.4rem;"><strong>Due:</strong> ${s.dueDateDisplay || '-'}</span>
              <span style="margin-left:0.4rem;color:var(--text-muted);">(${s.startDateDisplay || '-'} to ${s.endDateDisplay || '-'})</span>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:0.5rem;">
            <div style="text-align:right;margin-right:0.3rem;">
              <div style="font-weight:800;color:var(--text-primary);font-size:0.95rem;">${Utils.formatINR(s.amount)}</div>
              <div style="font-size:0.7rem;color:var(--text-muted);">Monthly Fee</div>
            </div>
            ${phone ? `
              <button class="btn btn-sm" style="background:#25d366;color:#ffffff;border:none;padding:0.4rem 0.7rem;font-weight:600;display:inline-flex;align-items:center;gap:0.35rem;" onclick="FeesPage.triggerWhatsAppFromCache('${key}')" title="Send WhatsApp Fee Reminder">
                <i data-lucide="message-circle" style="width:14px;height:14px;"></i>
                <span>WhatsApp</span>
              </button>
            ` : ''}
            <button class="btn btn-sm btn-primary" onclick="FeesPage.triggerPayFromCache('${key}')" title="Record Fee Payment">
              <i data-lucide="credit-card" style="width:14px;height:14px;"></i>
              <span>Pay Now</span>
            </button>
          </div>
        </div>
      `;
    };

    const renderSection = (title, list, badgeClass, iconName) => `
      <div style="margin-bottom:1.5rem;">
        <div style="font-size:0.88rem;font-weight:700;color:var(--text-primary);margin-bottom:0.75rem;display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:0.45rem;">
            <i data-lucide="${iconName}" style="width:16px;height:16px;"></i>
            <span>${title}</span>
          </div>
          <span class="badge ${badgeClass}">${list.length} Student${list.length === 1 ? '' : 's'}</span>
        </div>
        ${list.length === 0 ? `
          <div style="font-size:0.82rem;color:var(--text-muted);padding:0.75rem 1rem;background:var(--bg-secondary);border-radius:var(--radius-md);border:1px dashed var(--border-color);">
            No students currently in this category.
          </div>
        ` : `
          <div style="display:flex;flex-direction:column;gap:0.6rem;">
            ${list.map(renderCard).join('')}
          </div>
        `}
      </div>
    `;

    bodyEl.innerHTML = `
      <div style="font-size:0.9rem;color:var(--text-secondary);">
        <!-- Summary Cards Strip -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:0.6rem;margin-bottom:1.25rem;">
          <div style="background:var(--bg-secondary);padding:0.6rem 0.8rem;border-radius:var(--radius-md);border-left:3px solid var(--status-danger);">
            <div style="font-size:0.72rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;">Overdue</div>
            <div style="font-size:1.15rem;font-weight:800;color:var(--status-danger);">${overdue.length}</div>
          </div>
          <div style="background:var(--bg-secondary);padding:0.6rem 0.8rem;border-radius:var(--radius-md);border-left:3px solid var(--status-danger);">
            <div style="font-size:0.72rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;">Due Today</div>
            <div style="font-size:1.15rem;font-weight:800;color:var(--status-danger);">${dueToday.length}</div>
          </div>
          <div style="background:var(--bg-secondary);padding:0.6rem 0.8rem;border-radius:var(--radius-md);border-left:3px solid var(--status-warning);">
            <div style="font-size:0.72rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;">Due Within 7 Days</div>
            <div style="font-size:1.15rem;font-weight:800;color:var(--status-warning);">${dueSoon.length}</div>
          </div>
          <div style="background:var(--bg-secondary);padding:0.6rem 0.8rem;border-radius:var(--radius-md);border-left:3px solid var(--status-info);">
            <div style="font-size:0.72rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;">Upcoming Cycles</div>
            <div style="font-size:1.15rem;font-weight:800;color:var(--status-info);">${upcoming.length}</div>
          </div>
        </div>

        ${totalDues === 0 ? `
          <div style="text-align:center;padding:2.5rem 1rem;background:var(--bg-secondary);border-radius:var(--radius-lg);margin-bottom:1.5rem;">
            <i data-lucide="check-circle-2" style="width:48px;height:48px;color:var(--status-success);margin-bottom:0.75rem;"></i>
            <h3 style="margin-bottom:0.35rem;color:var(--text-primary);">All Student Dues Cleared!</h3>
            <p style="font-size:0.85rem;color:var(--text-muted);margin:0;">There are no pending or overdue fee reminders at this time. All active residents have settled their joining-date billing cycles.</p>
          </div>
        ` : `
          <p style="margin-bottom:1.25rem;font-size:0.85rem;color:var(--text-muted);">
            Billing cycles calculated automatically from each resident's individual joining date:
          </p>
          ${renderSection('🔴 Overdue Cycles', overdue, 'badge-danger', 'alert-triangle')}
          ${renderSection('🔴 Due Today', dueToday, 'badge-danger', 'alert-circle')}
          ${renderSection('🟡 Due Soon (Within 7 Days)', dueSoon, 'badge-warning', 'clock')}
          ${upcoming.length > 0 ? renderSection('🔵 Upcoming Cycles', upcoming, 'badge-info', 'calendar') : ''}
        `}

        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:1.5rem;padding-top:1rem;border-top:1px solid var(--border-color);">
          <button class="btn btn-sm btn-secondary" onclick="FeesPage.loadRemindersModal()" title="Re-check fee dues">
            <i data-lucide="refresh-cw" style="width:14px;height:14px;"></i>
            <span>Refresh Dues</span>
          </button>
          <button class="btn btn-secondary" onclick="Modal.close()">Close Center</button>
        </div>
      </div>
    `;

    Utils.renderIcons();
  },

  triggerWhatsAppFromCache(key) {
    const item = this.remindersCache[key];
    if (!item) return;
    this.sendDueWhatsApp(
      item.student_phone || item.phone,
      item.student_name,
      item.amount,
      item.dueDateDisplay,
      item.startDateDisplay,
      item.endDateDisplay,
      item.room_number
    );
  },

  triggerPayFromCache(key) {
    const item = this.remindersCache[key];
    if (!item) return;
    Modal.close();
    PaymentsPage.openRecordPaymentModal(
      item.student_id,
      item.student_name,
      item.amount,
      item.start_date,
      item.end_date,
      item.id
    );
  },

  sendDueWhatsApp(phone, studentName, amount, dueDate, startDate, endDate, roomNumber) {
    if (!phone) {
      Toast.warning('No phone number recorded for this student.');
      return;
    }
    let digits = String(phone).replace(/\D/g, '');
    if (digits.length === 10) digits = '91' + digits;

    const message = 
`🔔 *SRI RAM PG - HOSTEL FEE PAYMENT REMINDER*
━━━━━━━━━━━━━━━━━━━━━━━━━
Dear *${studentName}*,

This is a gentle reminder regarding your monthly hostel room fee payment.

📋 *Due Notice:*
• *Amount Due:* ₹${Number(amount || 7000).toLocaleString('en-IN')}
• *Due Date:* ${dueDate}
• *Room:* Room ${roomNumber || '-'}
• *Billing Cycle:* ${startDate} to ${endDate}

Please clear your dues on or before the due date to ensure uninterrupted residency and amenities.
Upon payment, your official stamped PDF receipt will be instantly issued to your WhatsApp.

Thank you,
*SRI RAM PG Management*
Opp. Vignan University, Vadlamudi
━━━━━━━━━━━━━━━━━━━━━━━━━`;

    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`, '_blank');
    Toast.success(`Opening WhatsApp reminder for ${studentName} (+91 ${digits.slice(-10)})...`);
  }
};

window.FeesPage = FeesPage;
