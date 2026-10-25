/**
 * Payments & Receipts Page Component
 * Records payments, lists transaction history, and launches receipt modals
 */
const PaymentsPage = {
  currentPage: 1,
  currentSearch: '',
  currentMethod: '',

  async render() {
    return `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Payments & Official Receipts</h1>
          <p>Recorded resident transactions, digital receipts, and bank reconciliations</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="PaymentsPage.exportCSV()">
            <i data-lucide="download"></i>
            <span>Export CSV</span>
          </button>
          <button class="btn btn-primary" onclick="PaymentsPage.openRecordPaymentModal()">
            <i data-lucide="plus-circle"></i>
            <span>Record New Payment</span>
          </button>
        </div>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="card" style="margin-bottom:1.25rem;padding:1rem;">
        <div style="display:flex;gap:1rem;flex-wrap:wrap;align-items:center;">
          <!-- Search box -->
          <div style="flex:1;min-width:240px;position:relative;">
            <i data-lucide="search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-muted);width:16px;height:16px;"></i>
            <input 
              type="text" 
              id="payment-search-input" 
              class="form-control" 
              style="padding-left:2.2rem;" 
              placeholder="Search by receipt no, student name, transaction ID..."
              oninput="PaymentsPage.handleSearch(this.value)"
            />
          </div>

          <!-- Payment Method Filter -->
          <div style="min-width:160px;">
            <select id="payment-method-filter" class="form-control" onchange="PaymentsPage.handleMethodFilter(this.value)">
              <option value="">All Payment Methods</option>
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Card">Card</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Payments Table -->
      <div class="table-container">
        <table class="data-table data-table-responsive-cards" id="payments-table">
          <thead>
            <tr>
              <th>Receipt Number</th>
              <th>Paid Date</th>
              <th>Resident Student</th>
              <th>Billing Cycle Covered</th>
              <th>Payment Method</th>
              <th>Amount Paid</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="payments-tbody">
            <tr>
              <td colspan="8" style="text-align:center;padding:2.5rem;color:var(--text-muted);">
                Loading payment records...
              </td>
            </tr>
          </tbody>
        </table>

        <div class="pagination" id="payments-pagination" style="display:none;"></div>
      </div>
    `;
  },

  async afterRender() {
    await this.loadPayments();
  },

  searchTimer: null,
  handleSearch(val) {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.currentSearch = val;
      this.currentPage = 1;
      this.loadPayments();
    }, 250);
  },

  handleMethodFilter(method) {
    this.currentMethod = method;
    this.currentPage = 1;
    this.loadPayments();
  },

  async loadPayments() {
    try {
      const tbody = document.getElementById('payments-tbody');
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--text-muted);">Loading payments...</td></tr>';
      }

      const res = await API.get('/payments', {
        page: this.currentPage,
        limit: 15,
        search: this.currentSearch,
        method: this.currentMethod
      });

      if (res.success) {
        this.renderTable(res.data, res.pagination);
      }
    } catch (e) {
      Toast.error('Failed to load payments: ' + e.message);
    }
  },

  renderTable(payments, pagination) {
    const tbody = document.getElementById('payments-tbody');
    const paginationEl = document.getElementById('payments-pagination');
    if (!tbody) return;

    if (payments.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center;padding:3rem;color:var(--text-muted);">
            <i data-lucide="receipt" style="width:40px;height:40px;margin-bottom:0.5rem;opacity:0.5;"></i>
            <p style="font-weight:600;">No payment transactions found.</p>
          </td>
        </tr>
      `;
      if (paginationEl) paginationEl.style.display = 'none';
      Utils.renderIcons();
      return;
    }

    tbody.innerHTML = payments.map(p => `
      <tr>
        <td data-label="Receipt #">
          <span class="badge badge-info" style="font-family:var(--font-mono);font-size:0.8rem;">
            ${p.receipt_number}
          </span>
        </td>

        <td data-label="Paid Date">
          <div style="font-weight:600;">${p.paymentDateDisplay}</div>
        </td>

        <td data-label="Student">
          <div style="font-weight:700;color:var(--text-primary);">${Utils.escapeHTML(p.student_name)}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);">${p.reg_number} • Rm ${p.room_number || '-'}</div>
        </td>

        <td data-label="Cycle Covered">
          <div style="font-weight:600;">${p.cycleStartDisplay} → ${p.cycleEndDisplay}</div>
          <div style="font-size:0.72rem;color:var(--text-muted);">Joining-date anchor</div>
        </td>

        <td data-label="Method">
          <span style="font-weight:600;display:inline-flex;align-items:center;gap:0.35rem;">
            <i data-lucide="${p.payment_method === 'Cash' ? 'banknote' : p.payment_method === 'UPI' ? 'smartphone' : 'credit-card'}" style="width:14px;height:14px;color:var(--primary-red);"></i>
            ${p.payment_method}
          </span>
          ${p.transaction_id ? `<div style="font-size:0.72rem;color:var(--text-muted);font-family:var(--font-mono);">${p.transaction_id}</div>` : ''}
        </td>

        <td data-label="Amount" style="font-weight:800;color:var(--status-success);font-size:0.95rem;">
          ${Utils.formatINR(p.amount)}
        </td>

        <td data-label="Status">
          <span class="badge badge-success">
            <i data-lucide="check-circle-2" style="width:12px;height:12px;"></i>
            ${p.status}
          </span>
        </td>

        <td data-label="Action">
          <button class="btn btn-sm btn-secondary" onclick="ReceiptModal.open(${p.id})" title="View, Print or Download PDF Receipt">
            <i data-lucide="printer" style="width:14px;height:14px;"></i>
            <span>Receipt</span>
          </button>
        </td>
      </tr>
    `).join('');

    // Pagination
    if (paginationEl && pagination && pagination.totalPages > 1) {
      paginationEl.style.display = 'flex';
      paginationEl.innerHTML = `
        <span class="pagination-info">
          Showing ${(pagination.page - 1) * pagination.limit + 1} to ${Math.min(pagination.page * pagination.limit, pagination.totalRecords)} of ${pagination.totalRecords}
        </span>
        <div class="pagination-controls">
          <button class="btn btn-sm btn-secondary" ${pagination.page <= 1 ? 'disabled' : ''} onclick="PaymentsPage.changePage(${pagination.page - 1})">
            Previous
          </button>
          <span style="font-size:0.82rem;font-weight:700;padding:0.4rem 0.75rem;">Page ${pagination.page} of ${pagination.totalPages}</span>
          <button class="btn btn-sm btn-secondary" ${pagination.page >= pagination.totalPages ? 'disabled' : ''} onclick="PaymentsPage.changePage(${pagination.page + 1})">
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
    this.loadPayments();
  },

  async openRecordPaymentModal(studentId = null, studentName = null, defaultAmount = 7000, cycleStart = null, cycleEnd = null, feeCycleId = null) {
    let studentSelectHtml = '';

    if (!studentId) {
      // Fetch students list for dropdown
      try {
        const res = await API.get('/students', { limit: 100 });
        const students = res.data || [];
        studentSelectHtml = `
          <div class="form-group col-span-2">
            <label class="form-label required">Select Resident Student</label>
            <select id="rec-student-id" class="form-control" required onchange="PaymentsPage.onStudentSelect(this.value)">
              <option value="">-- Choose Resident --</option>
              ${students.map(s => `<option value="${s.id}" data-fee="${s.monthly_fee}" data-joining="${s.joining_date}">${s.name} (${s.reg_number}) • Room ${s.room_number || '-'}</option>`).join('')}
            </select>
          </div>
        `;
      } catch (e) {
        Toast.error('Failed to load students.');
        return;
      }
    } else {
      studentSelectHtml = `
        <div class="form-group col-span-2">
          <label class="form-label">Resident Student</label>
          <input type="text" class="form-control" value="${studentName || 'Student'}" disabled />
          <input type="hidden" id="rec-student-id" value="${studentId}" />
        </div>
      `;
    }

    const today = Utils.getTodayISO();
    const cStart = cycleStart || '2026-09-16';
    const cEnd = cycleEnd || '2026-10-15';

    Modal.open({
      title: 'Record Fee Payment & Issue Receipt',
      content: `
        <form id="record-payment-form" onsubmit="PaymentsPage.submitPayment(event, ${feeCycleId || 'null'})">
          <div class="form-grid">
            ${studentSelectHtml}

            <div class="form-group">
              <label class="form-label required">Amount Paid (₹)</label>
              <input type="number" id="rec-amount" class="form-control" value="${defaultAmount}" min="100" step="100" required />
            </div>

            <div class="form-group">
              <label class="form-label required">Payment Date</label>
              <input type="date" id="rec-pay-date" class="form-control" value="${today}" required />
            </div>

            <!-- Cycle Start and End Date -->
            <div class="form-group">
              <label class="form-label required">Cycle Start Date</label>
              <input type="date" id="rec-cycle-start" class="form-control" value="${cStart}" required />
            </div>

            <div class="form-group">
              <label class="form-label required">Cycle End Date</label>
              <input type="date" id="rec-cycle-end" class="form-control" value="${cEnd}" required />
            </div>

            <div class="form-group">
              <label class="form-label required">Payment Method</label>
              <select id="rec-method" class="form-control" required>
                <option value="UPI">UPI (GooglePay / PhonePe / Paytm)</option>
                <option value="Cash">Cash (Hostel Office)</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                <option value="Card">Debit / Credit Card</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Transaction / Ref ID</label>
              <input type="text" id="rec-txnid" class="form-control" placeholder="e.g. UPI-9843217740" />
            </div>

            <div class="form-group col-span-2">
              <label class="form-label">Payment Remarks</label>
              <input type="text" id="rec-notes" class="form-control" placeholder="e.g. Cleared monthly room charge" value="Monthly hostel residency charge" />
            </div>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:0.75rem;margin-top:1.5rem;padding-top:1rem;border-top:1px solid var(--border-color);">
            <button type="button" class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
            <button type="submit" id="rec-submit-btn" class="btn btn-primary">
              <i data-lucide="receipt" style="width:16px;height:16px;"></i>
              <span>Save & Generate Receipt</span>
            </button>
          </div>
        </form>
      `,
      maxWidth: '640px'
    });
  },

  onStudentSelect(studentId) {
    if (!studentId) return;
    const select = document.getElementById('rec-student-id');
    const selectedOpt = select.options[select.selectedIndex];
    const fee = selectedOpt.getAttribute('data-fee');
    const joining = selectedOpt.getAttribute('data-joining');

    if (fee) {
      const amountInput = document.getElementById('rec-amount');
      if (amountInput) amountInput.value = fee;
    }

    if (joining) {
      // Calculate latest cycle dates
      try {
        const d = new Date(joining);
        const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, d.getDate());
        const cycleEnd = new Date(nextMonth.getTime() - (24 * 60 * 60 * 1000));
        
        const formatISO = (dt) => dt.toISOString().split('T')[0];
        const startInput = document.getElementById('rec-cycle-start');
        const endInput = document.getElementById('rec-cycle-end');
        if (startInput) startInput.value = formatISO(d);
        if (endInput) endInput.value = formatISO(cycleEnd);
      } catch (e) {}
    }
  },

  async submitPayment(e, feeCycleId) {
    e.preventDefault();
    const submitBtn = document.getElementById('rec-submit-btn');

    const studentId = document.getElementById('rec-student-id').value;
    const amount = document.getElementById('rec-amount').value;
    const paymentDate = document.getElementById('rec-pay-date').value;
    const cycleStartDate = document.getElementById('rec-cycle-start').value;
    const cycleEndDate = document.getElementById('rec-cycle-end').value;
    const paymentMethod = document.getElementById('rec-method').value;
    const transactionId = document.getElementById('rec-txnid').value;
    const notes = document.getElementById('rec-notes').value;

    if (!studentId || !amount || !paymentDate || !cycleStartDate || !cycleEndDate || !paymentMethod) {
      Toast.error('Please complete all required payment fields.');
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Processing...</span>';
      }

      const res = await API.post('/payments', {
        studentId,
        amount,
        paymentDate,
        cycleStartDate,
        cycleEndDate,
        paymentMethod,
        transactionId,
        notes,
        feeCycleId
      });

      if (res.success) {
        Toast.success(res.message);
        Modal.close();

        // Refresh views
        if (window.PaymentsPage && App.currentRoute === 'payments') {
          PaymentsPage.loadPayments();
        }
        if (window.FeesPage && App.currentRoute === 'fees') {
          FeesPage.loadCycles();
        }
        if (window.AdminDashboard && App.currentRoute === 'dashboard') {
          AdminDashboard.loadData();
        }

        // Auto-open newly generated receipt!
        if (res.data && res.data.paymentId) {
          setTimeout(() => ReceiptModal.open(res.data.paymentId), 300);
        }
      }
    } catch (err) {
      Toast.error(err.message || 'Payment recording failed.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i data-lucide="receipt" style="width:16px;height:16px;"></i> <span>Save & Generate Receipt</span>`;
        Utils.renderIcons();
      }
    }
  },

  async openReceiptByCycle(cycleId) {
    try {
      const res = await API.get('/payments', { limit: 100 });
      const match = (res.data || []).find(p => p.fee_cycle_id === cycleId);
      if (match) {
        ReceiptModal.open(match.id);
      } else {
        Toast.warning('No receipt record found for this cycle.');
      }
    } catch (e) {
      Toast.error('Receipt lookup failed: ' + e.message);
    }
  },

  async exportCSV() {
    try {
      const res = await API.get('/reports/collections');
      if (res.success && res.data) {
        Utils.exportToCSV('PG_Hostel_Fee_Receipts', res.data.columns, res.data.rows);
        Toast.success('Receipts exported to CSV.');
      }
    } catch (e) {
      Toast.error('Export failed: ' + e.message);
    }
  }
};

window.PaymentsPage = PaymentsPage;
