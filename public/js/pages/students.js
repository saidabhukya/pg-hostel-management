/**
 * Students Directory Page Component
 * Directory listing with search, floor filtering, fee status badges, and profile links
 */
const StudentsPage = {
  currentPage: 1,
  currentSearch: '',
  currentFloor: '',
  currentFeeStatus: '',

  async render() {
    return `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Student Directory</h1>
          <p>Resident profiles, assigned rooms, beds, and real-time fee dues</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="StudentsPage.exportStudents()">
            <i data-lucide="download"></i>
            <span>Export CSV</span>
          </button>
          <button class="btn btn-primary" onclick="AddStudentModal.open()">
            <i data-lucide="user-plus"></i>
            <span>Add Student</span>
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
              id="student-search-input" 
              class="form-control" 
              style="padding-left:2.2rem;" 
              placeholder="Filter by name, registration no, phone, room..."
              oninput="StudentsPage.handleSearch(this.value)"
            />
          </div>

          <!-- Floor Filter -->
          <div style="min-width:140px;">
            <select id="student-floor-filter" class="form-control" onchange="StudentsPage.handleFloorFilter(this.value)">
              <option value="">All Floors</option>
              <option value="1">1st Floor</option>
              <option value="2">2nd Floor</option>
              <option value="3">3rd Floor</option>
              <option value="4">4th Floor</option>
              <option value="5">5th Floor</option>
            </select>
          </div>

          <!-- Fee Status Filter -->
          <div style="min-width:140px;">
            <select id="student-fee-filter" class="form-control" onchange="StudentsPage.handleFeeFilter(this.value)">
              <option value="">All Fee Statuses</option>
              <option value="paid">Paid Only</option>
              <option value="pending">Pending Only</option>
              <option value="overdue">Overdue Only</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Students Table -->
      <div class="table-container">
        <table class="data-table data-table-responsive-cards" id="students-table">
          <thead>
            <tr>
              <th>Student Details</th>
              <th>College & Course</th>
              <th>Residency (Room / Bed)</th>
              <th>Joining Date</th>
              <th>Monthly Fee</th>
              <th>Fee Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="students-table-body">
            <tr>
              <td colspan="7" style="text-align:center;padding:2.5rem;color:var(--text-muted);">
                Loading students registry...
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination Controls -->
        <div class="pagination" id="students-pagination" style="display:none;"></div>
      </div>
    `;
  },

  async afterRender() {
    await this.loadStudents();
  },

  searchTimer: null,
  handleSearch(val) {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.currentSearch = val;
      this.currentPage = 1;
      this.loadStudents();
    }, 250);
  },

  handleFloorFilter(floor) {
    this.currentFloor = floor;
    this.currentPage = 1;
    this.loadStudents();
  },

  handleFeeFilter(status) {
    this.currentFeeStatus = status;
    this.currentPage = 1;
    this.loadStudents();
  },

  async loadStudents() {
    try {
      const tbody = document.getElementById('students-table-body');
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-muted);">Refreshing list...</td></tr>';
      }

      const res = await API.get('/students', {
        page: this.currentPage,
        limit: 15,
        search: this.currentSearch,
        floor: this.currentFloor,
        feeStatus: this.currentFeeStatus
      });

      if (res.success) {
        this.renderTable(res.data, res.pagination);
      }
    } catch (e) {
      Toast.error('Failed to load students: ' + e.message);
    }
  },

  renderTable(students, pagination) {
    const tbody = document.getElementById('students-table-body');
    const paginationEl = document.getElementById('students-pagination');
    if (!tbody) return;

    if (students.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center;padding:3rem;color:var(--text-muted);">
            <i data-lucide="users" style="width:40px;height:40px;margin-bottom:0.5rem;opacity:0.5;"></i>
            <p style="font-weight:600;">No matching students found.</p>
          </td>
        </tr>
      `;
      if (paginationEl) paginationEl.style.display = 'none';
      Utils.renderIcons();
      return;
    }

    tbody.innerHTML = students.map(s => {
      const reminder = s.feeReminder || { status: 'pending', label: 'Pending', badgeClass: 'badge-danger' };

      return `
        <tr>
          <td data-label="Student">
            <div class="table-student-cell">
              <div class="table-student-avatar" style="display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--primary-red);">
                ${s.name.charAt(0)}
              </div>
              <div>
                <a href="javascript:void(0)" onclick="StudentProfile.open(${s.id})" style="font-weight:700;color:var(--text-primary);">
                  ${Utils.escapeHTML(s.name)}
                </a>
                <div style="font-size:0.75rem;color:var(--text-muted);">
                  ${s.reg_number} • ${s.phone}
                </div>
              </div>
            </div>
          </td>

          <td data-label="College & Course">
            <div style="font-weight:600;color:var(--text-primary);">${Utils.escapeHTML(s.college)}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);">${Utils.escapeHTML(s.course)} (${s.year})</div>
          </td>

          <td data-label="Residency">
            ${s.room_number ? `
              <span class="badge badge-info" style="font-size:0.8rem;">
                Room ${s.room_number} • ${s.bed_label}
              </span>
            ` : `
              <span class="badge badge-warning">Unallocated</span>
            `}
          </td>

          <td data-label="Joining Date">
            <div style="font-weight:600;">${Utils.formatDate(s.joining_date)}</div>
            <div style="font-size:0.72rem;color:var(--text-muted);">Billing Anchor</div>
          </td>

          <td data-label="Monthly Fee" style="font-weight:700;">
            ${Utils.formatINR(s.monthly_fee)}
          </td>

          <td data-label="Fee Status">
            <span class="badge ${reminder.badgeClass}">
              ${reminder.label}
            </span>
          </td>

          <td data-label="Actions">
            <div style="display:flex;gap:0.4rem;">
              <button class="btn btn-sm btn-secondary" onclick="StudentProfile.open(${s.id})" title="View Complete Profile & Dues">
                <i data-lucide="eye" style="width:14px;height:14px;"></i>
              </button>
              <button class="btn btn-sm btn-secondary" onclick="PaymentsPage.openRecordPaymentModal(${s.id}, '${Utils.escapeHTML(s.name)}', ${s.monthly_fee})" title="Record Payment for this Student">
                <i data-lucide="credit-card" style="width:14px;height:14px;"></i>
              </button>
              <button class="btn btn-sm" style="background:var(--status-danger-bg);color:var(--status-danger);border:1px solid #fecaca;" onclick="StudentsPage.removeStudent(${s.id}, '${Utils.escapeHTML(s.name)}')" title="Remove / Vacate Student">
                <i data-lucide="user-x" style="width:14px;height:14px;"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Pagination
    if (paginationEl && pagination && pagination.totalPages > 1) {
      paginationEl.style.display = 'flex';
      paginationEl.innerHTML = `
        <span class="pagination-info">
          Showing ${(pagination.page - 1) * pagination.limit + 1} to ${Math.min(pagination.page * pagination.limit, pagination.totalRecords)} of ${pagination.totalRecords} students
        </span>
        <div class="pagination-controls">
          <button class="btn btn-sm btn-secondary" ${pagination.page <= 1 ? 'disabled' : ''} onclick="StudentsPage.changePage(${pagination.page - 1})">
            Previous
          </button>
          <span style="font-size:0.82rem;font-weight:700;padding:0.4rem 0.75rem;color:var(--text-primary);">
            Page ${pagination.page} of ${pagination.totalPages}
          </span>
          <button class="btn btn-sm btn-secondary" ${pagination.page >= pagination.totalPages ? 'disabled' : ''} onclick="StudentsPage.changePage(${pagination.page + 1})">
            Next
          </button>
        </div>
      `;
    } else if (paginationEl) {
      paginationEl.style.display = 'none';
    }

    Utils.renderIcons();
  },

  changePage(newPage) {
    this.currentPage = newPage;
    this.loadStudents();
  },

  async exportStudents() {
    try {
      const res = await API.get('/reports/students');
      if (res.success && res.data) {
        Utils.exportToCSV('PG_Hostel_Students_List', res.data.columns, res.data.rows);
        Toast.success('Student list exported to CSV.');
      }
    } catch (e) {
      Toast.error('Export failed: ' + e.message);
    }
  },

  removeStudent(studentId, studentName) {
    Modal.open({
      title: 'Remove / Vacate Student',
      content: `
        <div style="text-align:center;padding:0.5rem 0;">
          <div style="width:56px;height:56px;background:var(--status-danger-bg);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;">
            <i data-lucide="user-x" style="width:28px;height:28px;color:var(--status-danger);"></i>
          </div>
          <h3 style="font-size:1.05rem;font-weight:700;color:var(--text-primary);margin-bottom:0.5rem;">
            Remove <span style="color:var(--status-danger);">${Utils.escapeHTML(studentName)}</span>?
          </h3>
          <p style="font-size:0.875rem;color:var(--text-secondary);line-height:1.6;margin-bottom:1.25rem;">
            This will mark the student as <strong>vacated</strong>, free up their allocated bed,
            and disable their portal login.<br/>
            <strong style="color:var(--status-danger);">This action cannot be undone.</strong>
          </p>
          <div style="display:flex;gap:0.75rem;justify-content:center;">
            <button class="btn btn-secondary" onclick="Modal.close()">
              <i data-lucide="x" style="width:15px;height:15px;"></i> Cancel
            </button>
            <button class="btn" style="background:var(--status-danger);color:#fff;border:none;"
              onclick="StudentsPage.confirmRemove(${studentId}, '${Utils.escapeHTML(studentName)}')">
              <i data-lucide="user-x" style="width:15px;height:15px;"></i> Yes, Remove Student
            </button>
          </div>
        </div>
      `,
      maxWidth: '420px'
    });
    Utils.renderIcons();
  },

  async confirmRemove(studentId, studentName) {
    Modal.close();
    try {
      Toast.info(`Removing ${studentName}...`);
      const res = await API.delete(`/students/${studentId}`);
      if (res.success) {
        Toast.success(res.message || `${studentName} has been vacated and their bed is now free.`);
        this.loadStudents();
        if (window.HostelStructurePage) HostelStructurePage.loadStructure();
        // Refresh dashboard counts if visible
        if (window.AdminDashboard && App.currentRoute === 'dashboard') {
          AdminDashboard.loadData();
        }
      }
    } catch (err) {
      Toast.error(err.message || 'Failed to remove student.');
    }
  }
};

window.StudentsPage = StudentsPage;
