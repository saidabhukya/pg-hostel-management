/**
 * Visitors Management Page Component
 */
const VisitorsPage = {
  currentStatus: '',
  currentSearch: '',

  getRowsHtml(visitors) {
    if (!visitors || visitors.length === 0) {
      return `
        <tr>
          <td colspan="8" style="text-align:center;padding:3rem;color:var(--text-muted);">
            <i data-lucide="user-x" style="width:40px;height:40px;margin-bottom:0.5rem;opacity:0.5;"></i>
            <p style="font-weight:600;">No visitors logged.</p>
          </td>
        </tr>
      `;
    }

    return visitors.map(v => {
      const isInHostel = v.status === 'in_hostel';

      return `
        <tr>
          <td data-label="Visitor">
            <div style="font-weight:700;color:var(--text-primary);">${Utils.escapeHTML(v.visitor_name)}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);">${Utils.escapeHTML(v.phone || '-')}</div>
          </td>

          <td data-label="Student Visited">
            <div style="font-weight:700;color:var(--text-primary);">${Utils.escapeHTML(v.student_name || 'Resident')}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);">${Utils.escapeHTML(v.reg_number || '')} • Room ${Utils.escapeHTML(String(v.room_number || '-'))}</div>
          </td>

          <td data-label="Relation">
            <span class="badge badge-info">${Utils.escapeHTML(v.relation || 'Relative')}</span>
          </td>

          <td data-label="Purpose">
            <span style="font-size:0.84rem;">${Utils.escapeHTML(v.purpose || '-')}</span>
          </td>

          <td data-label="Entry Time">
            <div style="font-weight:600;font-size:0.82rem;">${v.entryTimeDisplay || '-'}</div>
          </td>

          <td data-label="Exit Time">
            <div style="font-weight:600;font-size:0.82rem;color:${isInHostel ? 'var(--primary-red)' : 'var(--text-muted)'};">
              ${v.exitTimeDisplay || '-'}
            </div>
          </td>

          <td data-label="Status">
            <span class="badge ${isInHostel ? 'badge-danger' : 'badge-success'}">
              ${isInHostel ? 'In Hostel' : 'Checked Out'}
            </span>
          </td>

          <td data-label="Action">
            ${isInHostel ? `
              <button class="btn btn-sm btn-primary" onclick="VisitorsPage.checkoutVisitor(${v.id})" title="Record Exit Time">
                Check Out
              </button>
            ` : `
              <span style="color:var(--text-muted);font-size:0.78rem;">Completed</span>
            `}
          </td>
        </tr>
      `;
    }).join('');
  },

  async render() {
    const initialList = (typeof MockData !== 'undefined' && MockData.visitors) ? MockData.visitors : [];

    return `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Hostel Visitor Gate Registry</h1>
          <p>Security gate log of visitors, parents, and relatives visiting residents</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="VisitorsPage.exportCSV()">
            <i data-lucide="download"></i>
            <span>Export Gate Log</span>
          </button>
          <button class="btn btn-primary" onclick="VisitorsPage.openLogVisitorModal()">
            <i data-lucide="user-plus"></i>
            <span>Log Visitor Entry</span>
          </button>
        </div>
      </div>

      <!-- Filters Toolbar -->
      <div class="card" style="margin-bottom:1.25rem;padding:1rem;">
        <div style="display:flex;gap:1rem;flex-wrap:wrap;align-items:center;">
          <div style="flex:1;min-width:240px;position:relative;">
            <i data-lucide="search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-muted);width:16px;height:16px;"></i>
            <input 
              type="text" 
              class="form-control" 
              style="padding-left:2.2rem;" 
              placeholder="Search visitor name, phone, student visited..."
              oninput="VisitorsPage.handleSearch(this.value)"
            />
          </div>

          <div style="min-width:180px;">
            <select class="form-control" onchange="VisitorsPage.handleStatusFilter(this.value)">
              <option value="">All Visitors</option>
              <option value="in_hostel">Currently In Hostel</option>
              <option value="checked_out">Checked Out</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Visitors Table -->
      <div class="table-container">
        <table class="data-table data-table-responsive-cards" id="visitors-table">
          <thead>
            <tr>
              <th>Visitor Details</th>
              <th>Student Visited</th>
              <th>Relation</th>
              <th>Purpose of Visit</th>
              <th>Entry Time</th>
              <th>Exit Time</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="visitors-tbody">
            ${this.getRowsHtml(initialList)}
          </tbody>
        </table>
      </div>
    `;
  },

  async afterRender() {
    await this.loadVisitors();
  },

  searchTimer: null,
  handleSearch(val) {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.currentSearch = val;
      this.loadVisitors();
    }, 250);
  },

  handleStatusFilter(val) {
    this.currentStatus = val;
    this.loadVisitors();
  },

  async loadVisitors() {
    try {
      const res = await API.get('/visitors', {
        status: this.currentStatus,
        search: this.currentSearch
      });

      if (res && res.success) {
        this.renderTable(res.data || []);
      } else {
        const fallback = (typeof MockData !== 'undefined' && MockData.visitors) ? MockData.visitors : [];
        this.renderTable(fallback);
      }
    } catch (e) {
      console.warn('Failed to load visitors:', e);
      const fallback = (typeof MockData !== 'undefined' && MockData.visitors) ? MockData.visitors : [];
      this.renderTable(fallback);
    }
  },

  renderTable(visitors) {
    const tbody = document.getElementById('visitors-tbody');
    if (!tbody) return;

    tbody.innerHTML = this.getRowsHtml(visitors);
    Utils.renderIcons();
  },

  async openLogVisitorModal() {
    try {
      const res = await API.get('/students', { limit: 100 });
      const students = res.data || [];

      if (students.length === 0) {
        Toast.warning('No resident students found in the portal. Please add a student before logging visitors.');
        return;
      }

      Modal.open({
        title: 'Log Visitor Entry',
        content: `
          <form onsubmit="VisitorsPage.submitLog(event)">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label required">Visitor Name</label>
                <input type="text" id="vis-name" class="form-control" placeholder="e.g. Ramesh Kumar" required />
              </div>

              <div class="form-group">
                <label class="form-label required">Phone Number</label>
                <input type="tel" id="vis-phone" class="form-control" placeholder="e.g. +91 98765 11111" required />
              </div>

              <div class="form-group">
                <label class="form-label required">Student to Visit</label>
                <select id="vis-student" class="form-control" required>
                  <option value="">-- Select Resident --</option>
                  ${students.map(s => `<option value="${s.id}">${s.name} (${s.reg_number}) • Room ${s.room_number || '-'}</option>`).join('')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Relationship to Student</label>
                <input type="text" id="vis-rel" class="form-control" placeholder="e.g. Father, Mother, Brother" value="Parent" />
              </div>

              <div class="form-group col-span-2">
                <label class="form-label required">Purpose of Visit</label>
                <input type="text" id="vis-purpose" class="form-control" placeholder="e.g. Delivering winter clothes & laptop" required />
              </div>
            </div>

            <div style="display:flex;justify-content:flex-end;gap:0.75rem;margin-top:1.5rem;padding-top:1rem;border-top:1px solid var(--border-color);">
              <button type="button" class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
              <button type="submit" class="btn btn-primary">
                <i data-lucide="check" style="width:16px;height:16px;"></i>
                Record Entry
              </button>
            </div>
          </form>
        `,
        maxWidth: '580px'
      });
    } catch (e) {
      Toast.error('Setup failed: ' + e.message);
    }
  },

  async submitLog(e) {
    e.preventDefault();
    const visitorName = (document.getElementById('vis-name').value || '').trim();
    const phone = (document.getElementById('vis-phone').value || '').trim();
    const studentId = document.getElementById('vis-student').value;
    const relation = (document.getElementById('vis-rel').value || '').trim();
    const purpose = (document.getElementById('vis-purpose').value || '').trim();

    if (!visitorName || !studentId) {
      Toast.error('Please enter visitor name and select the student.');
      return;
    }

    try {
      const res = await API.post('/visitors', {
        visitorName,
        phone,
        studentId,
        relation,
        purpose
      });

      if (res && res.success) {
        Toast.success(res.message || 'Visitor entry logged successfully!');
        Modal.close();
        await this.loadVisitors();
      } else {
        Toast.error((res && res.message) || 'Failed to record visitor entry.');
      }
    } catch (err) {
      Toast.error(err.message || 'Error recording visitor entry.');
    }
  },

  async checkoutVisitor(id) {
    try {
      const res = await API.put(`/visitors/${id}/checkout`);
      if (res && res.success) {
        Toast.success(res.message || 'Visitor departure logged.');
        await this.loadVisitors();
      } else {
        Toast.error((res && res.message) || 'Failed to checkout visitor.');
      }
    } catch (e) {
      Toast.error(e.message || 'Error logging visitor departure.');
    }
  },

  async exportCSV() {
    try {
      const res = await API.get('/reports/visitors');
      if (res.success && res.data) {
        Utils.exportToCSV('PG_Hostel_Visitors_Log', res.data.columns, res.data.rows);
        Toast.success('Gate log exported to CSV.');
      }
    } catch (e) {
      Toast.error('Export failed: ' + e.message);
    }
  }
};

window.VisitorsPage = VisitorsPage;
