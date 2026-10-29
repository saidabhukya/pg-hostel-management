/**
 * Expenses Management Page Component
 * Tracks utility, grocery, salary, and facility upkeep outlays and net income calculations
 */
const ExpensesPage = {
  currentCategory: '',
  currentPage: 1,

  async render() {
    return `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Hostel Operating Expenses & P&L</h1>
          <p>Utility bills, food provisions, staff stipends, and maintenance vouchers</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="ExpensesPage.exportCSV()">
            <i data-lucide="download"></i>
            <span>Export CSV</span>
          </button>
          <button class="btn btn-primary" onclick="ExpensesPage.openAddExpenseModal()">
            <i data-lucide="plus-circle"></i>
            <span>Record New Expense</span>
          </button>
        </div>
      </div>

      <!-- Financial Balance Strip (Income, Expenses, Net) -->
      ${(() => {
        const stats = (typeof MockData !== 'undefined' && MockData.stats) ? MockData.stats : { feesCollected: 0, hostelExpenses: 0, netIncome: 0 };
        return `
      <div class="kpi-grid" id="expenses-financial-strip">
        <div class="kpi-card" style="border-left:4px solid var(--status-success);">
          <div class="kpi-header">
            <span class="kpi-title">Total Fee Income</span>
            <span class="badge badge-success">Receipts</span>
          </div>
          <div class="kpi-value" id="exp-total-income">${Utils.formatINR(stats.feesCollected || 0)}</div>
          <div class="kpi-footer">Total resident payments realized</div>
        </div>

        <div class="kpi-card" style="border-left:4px solid var(--primary-red);">
          <div class="kpi-header">
            <span class="kpi-title">Total Operating Expenses</span>
            <span class="badge badge-danger">Outflow</span>
          </div>
          <div class="kpi-value" id="exp-total-expenses">${Utils.formatINR(stats.hostelExpenses || 0)}</div>
          <div class="kpi-footer">Utilities, food & maintenance</div>
        </div>

        <div class="kpi-card" style="border-left:4px solid #2563eb;">
          <div class="kpi-header">
            <span class="kpi-title">Net Operational Income</span>
            <span class="badge badge-info">Net P&L</span>
          </div>
          <div class="kpi-value" id="exp-net-income" style="color:${(stats.netIncome || 0) >= 0 ? 'var(--status-success)' : 'var(--status-danger)'};">${Utils.formatINR(stats.netIncome || 0)}</div>
          <div class="kpi-footer">Formula: Collected Fees - Expenses</div>
        </div>
      </div>
        `;
      })()}

      <!-- Filters Toolbar -->
      <div class="card" style="margin-bottom:1.25rem;padding:1rem;">
        <div style="display:flex;gap:1rem;flex-wrap:wrap;align-items:center;">
          <!-- Category Filter -->
          <div style="min-width:180px;">
            <select class="form-control" onchange="ExpensesPage.handleCategoryFilter(this.value)">
              <option value="">All Categories</option>
              <option value="Electricity">Electricity</option>
              <option value="Water">Water Supply</option>
              <option value="Internet">Internet / Wi-Fi</option>
              <option value="Food">Food & Pantry</option>
              <option value="Cleaning">Cleaning & Sanitation</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Salary">Staff Salaries</option>
              <option value="Repairs">Repairs</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Expenses Table -->
      <div class="table-container">
        <table class="data-table data-table-responsive-cards" id="expenses-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description / Purpose</th>
              <th>Amount (INR)</th>
              <th>Voucher / Ref</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="expenses-tbody">
            <tr>
              <td colspan="6" style="text-align:center;padding:2.5rem;color:var(--text-muted);">
                Loading expense ledger...
              </td>
            </tr>
          </tbody>
        </table>

        <div class="pagination" id="expenses-pagination" style="display:none;"></div>
      </div>
    `;
  },

  async afterRender() {
    await this.loadExpenses();
  },

  handleCategoryFilter(cat) {
    this.currentCategory = cat;
    this.currentPage = 1;
    this.loadExpenses();
  },

  async loadExpenses() {
    try {
      const res = await API.get('/expenses', {
        category: this.currentCategory,
        page: this.currentPage,
        limit: 15
      });

      if (res && res.success) {
        this.renderTable(res.data, res.pagination);
        if (res.summary) {
          const incEl = document.getElementById('exp-total-income');
          const expEl = document.getElementById('exp-total-expenses');
          const netEl = document.getElementById('exp-net-income');
          if (incEl) incEl.innerText = Utils.formatINR(res.summary.totalIncome);
          if (expEl) expEl.innerText = Utils.formatINR(res.summary.totalExpenses);
          if (netEl) netEl.innerText = Utils.formatINR(res.summary.netIncome);
        }
        return;
      }
    } catch (e) {
      console.warn('[Expenses] Online load failed, using local dataset');
    }

    if (typeof MockData !== 'undefined' && Array.isArray(MockData.expenses)) {
      let list = MockData.expenses;
      if (this.currentCategory) {
        list = list.filter(e => e.category === this.currentCategory);
      }
      this.renderTable(list, { page: 1, limit: 100, totalPages: 1, totalRecords: list.length });
      const stats = MockData.stats;
      const incEl = document.getElementById('exp-total-income');
      const expEl = document.getElementById('exp-total-expenses');
      const netEl = document.getElementById('exp-net-income');
      if (incEl) incEl.innerText = Utils.formatINR(stats.feesCollected);
      if (expEl) expEl.innerText = Utils.formatINR(stats.hostelExpenses);
      if (netEl) netEl.innerText = Utils.formatINR(stats.netIncome);
    } else {
      Toast.error('Failed to load expenses.');
    }
  },

  renderTable(expenses, pagination) {
    const tbody = document.getElementById('expenses-tbody');
    const paginationEl = document.getElementById('expenses-pagination');
    if (!tbody) return;

    if (expenses.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center;padding:3rem;color:var(--text-muted);">
            <i data-lucide="wallet" style="width:40px;height:40px;margin-bottom:0.5rem;opacity:0.5;"></i>
            <p style="font-weight:600;">No expenses found under this filter.</p>
          </td>
        </tr>
      `;
      if (paginationEl) paginationEl.style.display = 'none';
      Utils.renderIcons();
      return;
    }

    tbody.innerHTML = expenses.map(e => `
      <tr>
        <td data-label="Date" style="font-weight:600;">
          ${e.expenseDateDisplay}
        </td>

        <td data-label="Category">
          <span class="badge badge-info">${e.category}</span>
        </td>

        <td data-label="Description">
          <div style="font-weight:600;color:var(--text-primary);">${Utils.escapeHTML(e.description)}</div>
        </td>

        <td data-label="Amount" style="font-weight:800;color:var(--primary-red);font-size:0.95rem;">
          ${Utils.formatINR(e.amount)}
        </td>

        <td data-label="Voucher">
          <span style="font-family:var(--font-mono);font-size:0.8rem;color:var(--text-muted);">${e.receipt_ref || '-'}</span>
        </td>

        <td data-label="Action">
          <button class="btn btn-sm" style="background:var(--status-danger-bg);color:var(--status-danger);border:1px solid #fecaca;" onclick="ExpensesPage.deleteExpense(${e.id})" title="Delete Expense Voucher">
            <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
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
          <button class="btn btn-sm btn-secondary" ${pagination.page <= 1 ? 'disabled' : ''} onclick="ExpensesPage.changePage(${pagination.page - 1})">
            Previous
          </button>
          <span style="font-size:0.82rem;font-weight:700;padding:0.4rem 0.75rem;">Page ${pagination.page} of ${pagination.totalPages}</span>
          <button class="btn btn-sm btn-secondary" ${pagination.page >= pagination.totalPages ? 'disabled' : ''} onclick="ExpensesPage.changePage(${pagination.page + 1})">
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
    this.loadExpenses();
  },

  openAddExpenseModal() {
    const today = Utils.getTodayISO();

    Modal.open({
      title: 'Record Hostel Operating Expense',
      content: `
        <form onsubmit="ExpensesPage.submitExpense(event)">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label required">Expense Category</label>
              <select id="exp-category" class="form-control" required>
                <option value="Electricity">Electricity</option>
                <option value="Water">Water Supply / RO</option>
                <option value="Internet">Internet / Wi-Fi</option>
                <option value="Food">Food / Pantry Provisions</option>
                <option value="Cleaning">Cleaning & Disinfectants</option>
                <option value="Maintenance">Facility Maintenance</option>
                <option value="Salary">Staff Stipends / Salaries</option>
                <option value="Repairs">Repairs</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label required">Amount Paid (₹)</label>
              <input type="number" id="exp-amount" class="form-control" placeholder="e.g. 15000" min="1" step="1" required />
            </div>

            <div class="form-group">
              <label class="form-label required">Date of Expense</label>
              <input type="date" id="exp-date" class="form-control" value="${today}" required />
            </div>

            <div class="form-group">
              <label class="form-label">Bill / Voucher Reference No.</label>
              <input type="text" id="exp-ref" class="form-control" placeholder="e.g. VOUCH-2026-9481" />
            </div>

            <div class="form-group col-span-2">
              <label class="form-label required">Description / Purpose</label>
              <textarea id="exp-desc" class="form-control" rows="3" placeholder="Provide vendor name, invoice context or repair details..." required></textarea>
            </div>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:0.75rem;margin-top:1.5rem;padding-top:1rem;border-top:1px solid var(--border-color);">
            <button type="button" class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Expense</button>
          </div>
        </form>
      `,
      maxWidth: '600px'
    });
  },

  async submitExpense(e) {
    e.preventDefault();
    const category = document.getElementById('exp-category').value;
    const amount = document.getElementById('exp-amount').value;
    const expenseDate = document.getElementById('exp-date').value;
    const receiptRef = document.getElementById('exp-ref').value;
    const description = document.getElementById('exp-desc').value;

    try {
      const res = await API.post('/expenses', {
        category,
        amount,
        expenseDate,
        description,
        receiptRef
      });

      if (res && res.success) {
        Toast.success(res.message);
        Modal.close();
        this.loadExpenses();
        if (window.AdminDashboard && App.currentRoute === 'dashboard') {
          AdminDashboard.loadData();
        }
        return;
      }
    } catch (err) {
      console.warn('[Expenses] Online add failed, recording locally');
    }

    if (typeof MockData !== 'undefined' && typeof MockData.addExpense === 'function') {
      MockData.addExpense({
        category,
        amount,
        date: expenseDate,
        description,
        receiptRef
      });
      Toast.success('Expense recorded successfully!');
      Modal.close();
      this.loadExpenses();
      if (window.AdminDashboard && App.currentRoute === 'dashboard') {
        AdminDashboard.loadData();
      }
    } else {
      Toast.error('Failed to record expense.');
    }
  },

  async deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense record?')) return;
    try {
      const res = await API.delete(`/expenses/${id}`);
      if (res && res.success) {
        Toast.success(res.message || 'Expense deleted successfully!');
        this.loadExpenses();
        if (window.AdminDashboard && App.currentRoute === 'dashboard') {
          AdminDashboard.loadData();
        }
        return;
      }
    } catch (e) {
      console.warn('[Expenses] Online delete failed, deleting locally');
    }

    if (typeof MockData !== 'undefined' && typeof MockData.deleteExpense === 'function') {
      MockData.deleteExpense(id);
      Toast.success('Expense deleted successfully!');
      this.loadExpenses();
      if (window.AdminDashboard && App.currentRoute === 'dashboard') {
        AdminDashboard.loadData();
      }
    } else {
      Toast.error('Failed to delete expense.');
    }
  },

  async exportCSV() {
    try {
      const res = await API.get('/reports/expenses');
      if (res.success && res.data) {
        Utils.exportToCSV('PG_Hostel_Operating_Expenses', res.data.columns, res.data.rows);
        Toast.success('Expenses exported to CSV.');
      }
    } catch (e) {
      Toast.error('Export failed: ' + e.message);
    }
  }
};

window.ExpensesPage = ExpensesPage;
