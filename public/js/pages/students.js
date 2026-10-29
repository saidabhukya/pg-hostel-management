/**
 * Students Management Page Component
 * Search, filter by floor/fee-status, add student modal, edit student, reset password, and vacancy operations.
 */
const StudentsPage = {
  currentFilters: {
    search: '',
    floor: '',
    feeStatus: '',
    page: 1,
    limit: 20
  },

  async render() {
    return `
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Student Residents Directory</h1>
          <p class="page-subtitle">Manage enrolled students, room & bed allocations, and joining-date fee statuses</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" onclick="StudentsPage.exportCSV()">
            <i data-lucide="download"></i>
            <span>Export CSV</span>
          </button>
          <button class="btn btn-primary" onclick="AddStudentModal.open()">
            <i data-lucide="user-plus"></i>
            <span>Add Student</span>
          </button>
        </div>
      </div>

      <!-- Filter & Search Toolbar -->
      <div class="card toolbar" style="margin-bottom:1.5rem;">
        <div class="search-box">
          <i data-lucide="search" class="search-icon"></i>
          <input 
            type="text" 
            id="students-search-input" 
            class="search-input" 
            placeholder="Search by student name, roll number, phone, room..."
            oninput="StudentsPage.handleSearch(this.value)"
          />
        </div>

        <div class="filter-group">
          <!-- Floor Filter -->
          <select id="students-floor-filter" class="form-control" onchange="StudentsPage.handleFloorFilter(this.value)">
            <option value="">All Floors (1F - 5F)</option>
            <option value="1">1st Floor</option>
            <option value="2">2nd Floor</option>
            <option value="3">3rd Floor</option>
            <option value="4">4th Floor</option>
            <option value="5">5th Floor</option>
          </select>

          <!-- Fee Status Filter -->
          <select id="students-fee-filter" class="form-control" onchange="StudentsPage.handleFeeFilter(this.value)">
            <option value="">All Fee Statuses</option>
            <option value="paid">Fee Paid</option>
            <option value="pending">Fee Pending</option>
            <option value="overdue">Fee Overdue</option>
          </select>

          <!-- Reset Filters -->
          <button class="btn btn-secondary" onclick="StudentsPage.resetFilters()" title="Reset Filters">
            <i data-lucide="rotate-ccw"></i>
          </button>
        </div>
      </div>

      <!-- Students Table Card -->
      <div class="card">
        <div class="table-container">
          <table class="data-table" id="students-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll / Reg No</th>
                <th>Room & Bed</th>
                <th>Joining Date</th>
                <th>Monthly Fee</th>
                <th>Fee Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="students-table-body">
              <tr>
                <td colspan="7" style="text-align:center;padding:3rem 1rem;">
                  <div style="display:inline-block;width:32px;height:32px;border:3px solid var(--border-color);border-top-color:var(--primary-red);border-radius:50%;animation:spin 0.8s linear infinite;"></div>
                  <p style="margin-top:0.75rem;color:var(--text-muted);font-weight:600;">Loading students from online database...</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls -->
        <div class="pagination-bar" id="students-pagination" style="display:none;"></div>
      </div>
    `;
  },

  async afterRender() {
    await this.loadStudents();
  },

  async loadStudents() {
    const tbody = document.getElementById('students-table-body');
    const paginationEl = document.getElementById('students-pagination');
    if (!tbody) return;

    try {
      let res = null;
      try {
        res = await API.get('/students', {
          search: this.currentFilters.search,
          floor: this.currentFilters.floor,
          feeStatus: this.currentFilters.feeStatus,
          page: this.currentFilters.page,
          limit: this.currentFilters.limit
        });
      } catch (err) {
        console.warn('API /students fetch failed:', err);
      }

      let students = (res && res.success && Array.isArray(res.data)) ? res.data : [];
      let pagination = res?.pagination || null;

      // Robust fallback to MockData if API didn't return students
      if (students.length === 0 && (!this.currentFilters.search && !this.currentFilters.floor && !this.currentFilters.feeStatus)) {
        if (typeof MockData !== 'undefined' && Array.isArray(MockData.students)) {
          const list = MockData.students;
          const page = this.currentFilters.page || 1;
          const limit = this.currentFilters.limit || 20;
          students = list.slice((page - 1) * limit, page * limit).map(s => {
            const fStatus = s.fee_status || s.latest_cycle_status || s.student_status || 'pending';
            return {
              ...s,
              fee_status: fStatus,
              latest_cycle_status: fStatus,
              student_status: fStatus
            };
          });
          pagination = {
            page,
            limit,
            totalPages: Math.ceil(list.length / limit) || 1,
            totalRecords: list.length
          };
        }
      }

      if (students.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align:center;padding:3rem 1rem;">
              <i data-lucide="users" style="width:40px;height:40px;color:var(--text-muted);margin-bottom:0.5rem;"></i>
              <p style="font-weight:700;color:var(--text-primary);font-size:1rem;">No Students Found</p>
              <p style="font-size:0.84rem;color:var(--text-muted);margin-top:0.25rem;">Try adjusting your search criteria or add a new student resident.</p>
              <button class="btn btn-primary btn-sm" onclick="AddStudentModal.open()" style="margin-top:1rem;">
                <i data-lucide="user-plus" style="width:14px;height:14px;"></i> Add Student
              </button>
            </td>
          </tr>
        `;
        Utils.renderIcons();
        if (paginationEl) paginationEl.style.display = 'none';
        return;
      }

      tbody.innerHTML = students.map(s => {
        const isPaid = s.latest_cycle_status === 'paid' || s.student_status === 'paid' || s.fee_status === 'paid';
        const photoSrc = s.photo_url || './assets/images/default-student.png';
        const sName = s.name || 'Resident Student';
        const sPhone = s.phone || '-';
        const sReg = s.reg_number || 'REG-';

        return `
          <tr>
            <td data-label="Student">
              <div style="display:flex;align-items:center;gap:0.75rem;">
                <img 
                  src="${photoSrc}" 
                  alt="${Utils.escapeHTML(sName)}" 
                  class="user-avatar" 
                  style="width:38px;height:38px;object-fit:cover;"
                  onerror="this.onerror=null;this.src='./assets/images/default-student.png';"
                />
                <div>
                  <div style="font-weight:700;color:var(--text-primary);cursor:pointer;" onclick="StudentProfile.open(${s.id})">
                    ${Utils.escapeHTML(sName)}
                  </div>
                  <div style="font-size:0.75rem;color:var(--text-muted);">
                    ${Utils.escapeHTML(sPhone)}
                  </div>
                </div>
              </div>
            </td>

            <td data-label="Roll No">
              <span class="badge badge-info" style="font-weight:700;letter-spacing:0.5px;">${Utils.escapeHTML(sReg)}</span>
            </td>

            <td data-label="Room & Bed">
              ${s.room_number ? `
                <div style="font-weight:700;color:var(--text-primary);">Room ${s.room_number}</div>
                <div style="font-size:0.75rem;color:var(--text-muted);">Floor ${s.floor_number || '-'} • ${s.bed_label || 'Bed'}</div>
              ` : `
                <span class="badge badge-danger">Unassigned</span>
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
              <span 
                class="badge ${isPaid ? 'badge-success' : 'badge-warning'}" 
                onclick="StudentsPage.openUpdateFeeModal(${s.id})"
                style="cursor:pointer;display:inline-flex;align-items:center;gap:4px;"
                title="Click to update fee status"
              >
                <i data-lucide="${isPaid ? 'check-circle' : 'clock'}" style="width:12px;height:12px;"></i>
                <span>${isPaid ? 'Paid' : 'Pending'}</span>
              </span>
            </td>

            <td data-label="Actions">
              <div style="display:flex;gap:0.35rem;align-items:center;flex-wrap:wrap;">
                <!-- View Profile -->
                <button class="btn btn-sm btn-secondary" onclick="StudentProfile.open(${s.id})" title="View Complete Profile">
                  <i data-lucide="eye" style="width:13px;height:13px;"></i>
                </button>
                <!-- Edit Student -->
                <button class="btn btn-sm btn-secondary" onclick="StudentsPage.openEditModal(${s.id})" title="Edit Student Details">
                  <i data-lucide="edit-3" style="width:13px;height:13px;color:var(--primary-red);"></i>
                </button>
                <!-- Reset Password -->
                <button class="btn btn-sm btn-secondary" onclick="StudentsPage.openResetPasswordModal(${s.id}, '${Utils.escapeHTML(s.name)}', '${Utils.escapeHTML(s.reg_number)}')" title="Reset Login Password">
                  <i data-lucide="key" style="width:13px;height:13px;"></i>
                </button>
                <!-- Fee Status -->
                <button class="btn btn-sm btn-secondary" onclick="StudentsPage.openUpdateFeeModal(${s.id})" title="Fee Status">
                  <i data-lucide="receipt" style="width:13px;height:13px;"></i>
                </button>
                <!-- Record Payment -->
                <button class="btn btn-sm btn-secondary" onclick="PaymentsPage.openRecordPaymentModal(${s.id}, '${Utils.escapeHTML(s.name)}', ${s.monthly_fee})" title="Record Payment">
                  <i data-lucide="credit-card" style="width:13px;height:13px;"></i>
                </button>
                <!-- Vacate / Remove -->
                <button class="btn btn-sm" style="background:var(--status-danger-bg);color:var(--status-danger);border:1px solid #fecaca;" onclick="StudentsPage.removeStudent(${s.id}, '${Utils.escapeHTML(s.name)}')" title="Vacate Bed / Remove Student">
                  <i data-lucide="user-x" style="width:13px;height:13px;"></i>
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
    } catch (err) {
      console.warn('[Load Students Online Attempt Failed, using local dataset]:', err.message);
      if (typeof MockData !== 'undefined' && Array.isArray(MockData.students)) {
        let list = MockData.students;
        if (this.currentFilters.search) {
          const q = this.currentFilters.search.toLowerCase();
          list = list.filter(s => 
            (s.name && s.name.toLowerCase().includes(q)) || 
            (s.reg_number && s.reg_number.toLowerCase().includes(q)) || 
            (s.room_number && String(s.room_number).includes(q))
          );
        }
        if (this.currentFilters.floor) {
          list = list.filter(s => String(s.floor_number) === String(this.currentFilters.floor));
        }
        if (this.currentFilters.feeStatus) {
          list = list.filter(s => s.fee_status === this.currentFilters.feeStatus);
        }

        if (list.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="7" style="text-align:center;padding:3rem 1rem;">
                <i data-lucide="users" style="width:40px;height:40px;color:var(--text-muted);margin-bottom:0.5rem;"></i>
                <p style="font-weight:700;color:var(--text-primary);font-size:1rem;">No Students Found</p>
                <button class="btn btn-primary btn-sm" onclick="AddStudentModal.open()" style="margin-top:1rem;">
                  <i data-lucide="user-plus" style="width:14px;height:14px;"></i> Add Student
                </button>
              </td>
            </tr>
          `;
          if (paginationEl) paginationEl.style.display = 'none';
        } else {
          tbody.innerHTML = list.map(s => {
            const isPaid = s.fee_status === 'paid';
            const user = API.getUser();
            const isAdmin = !user || user.role === 'admin';
            return `
              <tr>
                <td data-label="Student">
                  <div style="display:flex;align-items:center;gap:0.75rem;">
                    <div class="user-avatar" style="width:38px;height:38px;font-size:0.95rem;overflow:hidden;padding:0;display:flex;align-items:center;justify-content:center;background:#fff;border:1.5px solid var(--border-color);flex-shrink:0;">
                      ${s.photo_url && s.photo_url !== '/assets/images/default-student.png' ? `
                        <img src="${s.photo_url}" alt="${Utils.escapeHTML(s.name)}" style="width:100%;height:100%;object-fit:cover;" onerror="this.onerror=null; this.parentElement.innerText='${(s.name || 'S').charAt(0)}';" />
                      ` : (s.name || 'S').charAt(0)}
                    </div>
                    <div>
                      <div style="font-weight:700;color:var(--text-primary);">${Utils.escapeHTML(s.name)}</div>
                      <div style="font-size:0.75rem;color:var(--text-muted);">${s.phone || '-'}</div>
                    </div>
                  </div>
                </td>
                <td data-label="Roll / Reg No">
                  <span style="font-weight:700;color:var(--text-primary);">${Utils.escapeHTML(s.reg_number)}</span>
                </td>
                <td data-label="Room & Bed">
                  <span class="badge badge-info">Rm ${s.room_number || '-'} • ${s.bed_label || 'Bed'}</span>
                </td>
                <td data-label="Joining Date">
                  <div style="font-weight:600;">${Utils.formatDate(s.joining_date)}</div>
                </td>
                <td data-label="Monthly Fee" style="font-weight:700;">
                  ${Utils.formatINR(s.monthly_fee)}
                </td>
                <td data-label="Fee Status">
                  <span class="badge ${isPaid ? 'badge-success' : 'badge-warning'}">
                    ${isPaid ? 'Paid' : 'Pending'}
                  </span>
                </td>
                <td data-label="Actions">
                  <div style="display:flex;gap:0.35rem;">
                    <button class="btn btn-sm btn-secondary" onclick="StudentProfile.open(${s.id})" title="View Profile">
                      <i data-lucide="eye" style="width:14px;height:14px;"></i>
                    </button>
                    ${isAdmin ? `
                      <button class="btn btn-sm btn-secondary" onclick="StudentsPage.openEditModal(${s.id})" title="Edit Details">
                        <i data-lucide="edit" style="width:14px;height:14px;"></i>
                      </button>
                    ` : ''}
                  </div>
                </td>
              </tr>
            `;
          }).join('');
          if (paginationEl) paginationEl.style.display = 'none';
        }
        Utils.renderIcons();
        return;
      }
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--status-danger);">${err.message || 'Unable to load students.'}</td></tr>`;
    }
  },

  handleSearch: Utils.debounce(function(val) {
    StudentsPage.currentFilters.search = val.trim();
    StudentsPage.currentFilters.page = 1;
    StudentsPage.loadStudents();
  }, 300),

  handleFloorFilter(val) {
    this.currentFilters.floor = val;
    this.currentFilters.page = 1;
    this.loadStudents();
  },

  handleFeeFilter(val) {
    this.currentFilters.feeStatus = val;
    this.currentFilters.page = 1;
    this.loadStudents();
  },

  resetFilters() {
    this.currentFilters = { search: '', floor: '', feeStatus: '', page: 1, limit: 20 };
    const sInput = document.getElementById('students-search-input');
    const fFilter = document.getElementById('students-floor-filter');
    const feeFilter = document.getElementById('students-fee-filter');
    if (sInput) sInput.value = '';
    if (fFilter) fFilter.value = '';
    if (feeFilter) feeFilter.value = '';
    this.loadStudents();
  },

  changePage(newPage) {
    this.currentFilters.page = newPage;
    this.loadStudents();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  async exportCSV() {
    try {
      Toast.info('Preparing resident students CSV export...');
      const res = await API.get('/reports/students');
      if (res.success && res.data) {
        const headers = ['ID', 'Registration No', 'Name', 'Phone', 'Email', 'Room', 'Bed', 'Floor', 'Joining Date', 'Monthly Fee', 'Status'];
        const rows = res.data.map(s => [
          s.id,
          `"${s.reg_number}"`,
          `"${s.name}"`,
          `"${s.phone}"`,
          `"${s.email}"`,
          s.room_number || '-',
          s.bed_label || '-',
          s.floor_number || '-',
          s.joining_date,
          s.monthly_fee,
          s.status
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        Utils.downloadCSV(csvContent, `SRI_RAM_PG_Students_${new Date().toISOString().slice(0, 10)}.csv`);
        Toast.success('Resident student list exported successfully.');
      }
    } catch (e) {
      Toast.error('Export failed: ' + e.message);
    }
  },

  /**
   * Edit Student Modal
   */
  async openEditModal(studentId) {
    try {
      const res = await API.get(`/students/${studentId}`);
      if (!res.success || !res.data) {
        Toast.error('Could not load student details.');
        return;
      }

      const s = res.data.profile || res.data.student || res.data;

      Modal.open({
        title: `Edit Student: ${Utils.escapeHTML(s.name)} (${s.reg_number})`,
        content: `
          <form onsubmit="StudentsPage.submitEdit(event, ${s.id})" enctype="multipart/form-data">
            <!-- Photo Upload Field (Optional) -->
            <div style="display:flex;align-items:center;gap:1.25rem;margin-bottom:1.25rem;padding:0.9rem;background:var(--bg-secondary);border-radius:var(--radius-md);border:1px dashed var(--border-color);">
              <div style="position:relative;cursor:pointer;" onclick="document.getElementById('es-photo-input').click()" title="Click to change student photo (Optional)">
                <img
                  id="es-photo-preview"
                  src="${s.photo_url || './assets/images/default-student.png'}"
                  alt="Student Photo"
                  style="width:68px;height:68px;border-radius:50%;object-fit:cover;border:3px solid var(--primary-red-border);display:block;background:#fff;"
                  onerror="this.onerror=null; this.src='./assets/images/default-student.png';"
                />
                <div style="position:absolute;bottom:0;right:0;background:var(--primary-red);border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,0.2);">
                  <i data-lucide="camera" style="width:13px;height:13px;color:#fff;"></i>
                </div>
              </div>
              <div style="flex:1;">
                <div style="font-size:0.85rem;font-weight:600;color:var(--text-primary);margin-bottom:0.25rem;display:flex;align-items:center;gap:0.4rem;">
                  <span>Student Photo</span>
                  <span class="badge" style="background:var(--bg-card);border:1px solid var(--border-color);color:var(--text-muted);font-size:0.7rem;font-weight:600;padding:1px 6px;">Optional</span>
                </div>
                <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.4rem;">Upload or change photo (JPG, PNG, WEBP · Max 5 MB)</div>
                <input
                  type="file"
                  id="es-photo-input"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  style="display:none;"
                  onchange="StudentsPage.previewEditPhoto(this)"
                />
                <button type="button" class="btn btn-sm btn-secondary" onclick="document.getElementById('es-photo-input').click()">
                  <i data-lucide="upload" style="width:13px;height:13px;"></i>
                  Choose Photo
                </button>
                <span id="es-photo-name" style="font-size:0.75rem;color:var(--text-muted);margin-left:0.5rem;">${s.photo_url && s.photo_url !== '/assets/images/default-student.png' ? 'Current photo active' : 'No photo uploaded'}</span>
              </div>
            </div>

            <div class="form-grid" style="margin-bottom:1.15rem;">
              <div class="form-group">
                <label class="form-label required">Student Full Name</label>
                <input type="text" id="es-name" class="form-control" value="${Utils.escapeHTML(s.name || '')}" required />
              </div>

              <div class="form-group">
                <label class="form-label required">Phone Number</label>
                <input type="tel" id="es-phone" class="form-control" value="${Utils.escapeHTML(s.phone || '')}" required />
              </div>

              <div class="form-group">
                <label class="form-label required">Email Address</label>
                <input type="email" id="es-email" class="form-control" value="${Utils.escapeHTML(s.email || '')}" required />
              </div>

              <div class="form-group">
                <label class="form-label required">Monthly Fee (₹)</label>
                <input type="number" id="es-fee" class="form-control" value="${s.monthly_fee || 7000}" min="1000" step="100" required />
              </div>

              <div class="form-group">
                <label class="form-label">College / University</label>
                <input type="text" id="es-college" class="form-control" value="${Utils.escapeHTML(s.college || '')}" />
              </div>

              <div class="form-group">
                <label class="form-label">Course / Degree</label>
                <input type="text" id="es-course" class="form-control" value="${Utils.escapeHTML(s.course || '')}" />
              </div>

              <div class="form-group">
                <label class="form-label">Father / Guardian Name</label>
                <input type="text" id="es-parentName" class="form-control" value="${Utils.escapeHTML(s.parent_name || '')}" />
              </div>

              <div class="form-group">
                <label class="form-label">Father / Guardian Phone</label>
                <input type="tel" id="es-parentPhone" class="form-control" value="${Utils.escapeHTML(s.parent_phone || '')}" />
              </div>

              <div class="form-group">
                <label class="form-label">Mother Name</label>
                <input type="text" id="es-motherName" class="form-control" value="${Utils.escapeHTML(s.mother_name || '')}" />
              </div>

              <div class="form-group">
                <label class="form-label">Mother Phone</label>
                <input type="tel" id="es-motherPhone" class="form-control" value="${Utils.escapeHTML(s.mother_phone || '')}" />
              </div>

              <div class="form-group col-span-2">
                <label class="form-label">Permanent Address</label>
                <input type="text" id="es-address" class="form-control" value="${Utils.escapeHTML(s.address || '')}" />
              </div>
            </div>

            <div style="display:flex;justify-content:flex-end;gap:0.75rem;padding-top:1rem;border-top:1px solid var(--border-color);">
              <button type="button" class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
              <button type="submit" id="es-submit-btn" class="btn btn-primary">
                <i data-lucide="check" style="width:14px;height:14px;"></i> Save Changes
              </button>
            </div>
          </form>
        `,
        maxWidth: '650px'
      });
      Utils.renderIcons();
    } catch (err) {
      Toast.error('Failed to load student: ' + err.message);
    }
  },

  previewEditPhoto(input) {
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const preview = document.getElementById('es-photo-preview');
      const nameEl = document.getElementById('es-photo-name');
      if (nameEl) nameEl.textContent = file.name;
      const reader = new FileReader();
      reader.onload = e => {
        if (preview) preview.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  },

  async submitEdit(e, studentId) {
    e.preventDefault();
    const submitBtn = document.getElementById('es-submit-btn');

    const name = document.getElementById('es-name')?.value.trim();
    const phone = document.getElementById('es-phone')?.value.trim();
    const email = document.getElementById('es-email')?.value.trim();
    const monthlyFee = document.getElementById('es-fee')?.value;
    const college = document.getElementById('es-college')?.value.trim();
    const course = document.getElementById('es-course')?.value.trim();
    const parentName = document.getElementById('es-parentName')?.value.trim();
    const parentPhone = document.getElementById('es-parentPhone')?.value.trim();
    const motherName = document.getElementById('es-motherName')?.value.trim();
    const motherPhone = document.getElementById('es-motherPhone')?.value.trim();
    const address = document.getElementById('es-address')?.value.trim();
    const photoInput = document.getElementById('es-photo-input');

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Saving...</span>';
      }

      const fd = new FormData();
      fd.append('name', name);
      fd.append('phone', phone);
      fd.append('email', email);
      fd.append('monthlyFee', monthlyFee);
      if (college) fd.append('college', college);
      if (course) fd.append('course', course);
      if (parentName) fd.append('parentName', parentName);
      if (parentPhone) fd.append('parentPhone', parentPhone);
      if (motherName) fd.append('motherName', motherName);
      if (motherPhone) fd.append('motherPhone', motherPhone);
      if (address) fd.append('address', address);

      if (photoInput && photoInput.files && photoInput.files[0]) {
        fd.append('photo', photoInput.files[0]);
      }

      const res = await API.put(`/students/${studentId}`, fd);

      if (res.success) {
        Toast.success(res.message || 'Student information updated successfully!');
        Modal.close();
        this.loadStudents();
      }
    } catch (err) {
      Toast.error(err.message || 'Failed to update student.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i data-lucide="check" style="width:14px;height:14px;"></i> Save Changes`;
        Utils.renderIcons();
      }
    }
  },

  /**
   * Reset Password Modal
   */
  openResetPasswordModal(studentId, name, regNumber) {
    Modal.open({
      title: `Reset Password: ${Utils.escapeHTML(name)}`,
      content: `
        <form onsubmit="StudentsPage.submitResetPassword(event, ${studentId})">
          <div style="background:var(--bg-secondary);padding:0.9rem;border-radius:var(--radius-md);margin-bottom:1.15rem;font-size:0.86rem;">
            <div style="display:flex;justify-content:space-between;margin-bottom:0.25rem;">
              <span style="color:var(--text-muted);">Student:</span>
              <strong>${Utils.escapeHTML(name)}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:var(--text-muted);">Registration / Roll No:</span>
              <code>${Utils.escapeHTML(regNumber)}</code>
            </div>
          </div>

          <div class="form-group" style="margin-bottom:1.15rem;">
            <label class="form-label required">New Portal Password</label>
            <div style="display:flex;gap:6px;">
              <input 
                type="text" 
                id="rp-password" 
                class="form-control" 
                placeholder="Enter new password (min 4 characters)" 
                required 
              />
              <button 
                type="button" 
                class="btn btn-secondary btn-sm" 
                onclick="document.getElementById('rp-password').value = 'Pg@' + Math.random().toString(36).substring(2, 7) + '!'"
              >
                Generate
              </button>
              <button 
                type="button" 
                class="btn btn-secondary btn-sm" 
                onclick="document.getElementById('rp-password').value = '${Utils.escapeHTML(regNumber)}'"
              >
                Use RegNo
              </button>
            </div>
            <small style="color:var(--text-muted);font-size:0.75rem;margin-top:4px;display:block;">
              The student will use this new password to login from their phone or other devices.
            </small>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:0.75rem;margin-top:1.25rem;">
            <button type="button" class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
            <button type="submit" id="rp-submit-btn" class="btn btn-primary">
              <i data-lucide="key" style="width:14px;height:14px;"></i> Update Password
            </button>
          </div>
        </form>
      `,
      maxWidth: '460px'
    });
    Utils.renderIcons();
  },

  async submitResetPassword(e, studentId) {
    e.preventDefault();
    const submitBtn = document.getElementById('rp-submit-btn');
    const newPassword = document.getElementById('rp-password')?.value.trim();

    if (!newPassword || newPassword.length < 4) {
      Toast.error('Password must be at least 4 characters long.');
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Updating...</span>';
      }

      const res = await API.post(`/students/${studentId}/reset-password`, { newPassword });
      if (res.success) {
        Modal.close();
        Toast.success(res.message || 'Student password updated successfully!');
      }
    } catch (err) {
      Toast.error(err.message || 'Failed to reset password.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i data-lucide="key" style="width:14px;height:14px;"></i> Update Password`;
        Utils.renderIcons();
      }
    }
  },

  removeStudent(studentId, studentName) {
    Modal.open({
      title: 'Vacate Bed & Remove Student',
      content: `
        <div style="font-size:0.9rem;line-height:1.5;">
          <p style="margin-bottom:1rem;color:var(--text-secondary);">
            Are you sure you want to vacate resident student <strong style="color:var(--primary-red);">${Utils.escapeHTML(studentName)}</strong>?
          </p>
          <div style="background:var(--bg-secondary);padding:0.75rem 1rem;border-radius:var(--radius-sm);font-size:0.8rem;color:var(--text-muted);margin-bottom:1.25rem;border-left:3px solid #dc2626;">
            ⚠️ This will mark their active bed allocation as <strong>Available</strong> for immediate re-assignment.
          </div>
          <div style="display:flex;justify-content:flex-end;gap:0.75rem;">
            <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
            <button class="btn btn-danger" onclick="StudentsPage.confirmRemove(${studentId}, '${Utils.escapeHTML(studentName)}')">
              Yes, Vacate Bed
            </button>
          </div>
        </div>
      `,
      maxWidth: '440px'
    });
  },

  async confirmRemove(studentId, studentName) {
    Modal.close();
    try {
      Toast.info(`Vacating ${studentName}...`);
      const res = await API.delete(`/students/${studentId}`);
      if (res.success) {
        Toast.success(res.message || `${studentName} has been vacated and their bed is now free.`);
        this.loadStudents();
        if (window.HostelStructurePage) HostelStructurePage.loadStructure();
        if (window.AdminDashboard && App.currentRoute === 'dashboard') {
          AdminDashboard.loadData();
        }
      }
    } catch (err) {
      Toast.error(err.message || 'Failed to remove student.');
    }
  },

  async openUpdateFeeModal(studentId) {
    try {
      const res = await API.get(`/students/${studentId}`);
      if (!res.success || !res.data) {
        Toast.error('Could not find student details.');
        return;
      }
      const student = res.data.profile || res.data.student || res.data;
      const isPaid = student.fee_status === 'paid';

      Modal.open({
        title: `Update Fee Status: ${Utils.escapeHTML(student.name)}`,
        content: `
          <form onsubmit="StudentsPage.submitUpdateFee(event, ${student.id})">
            <div style="background:var(--bg-secondary);padding:0.9rem;border-radius:var(--radius-md);margin-bottom:1.15rem;font-size:0.86rem;">
              <div style="display:flex;justify-content:space-between;margin-bottom:0.35rem;">
                <span style="color:var(--text-muted);">Registration No:</span>
                <strong>${student.reg_number}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;margin-bottom:0.35rem;">
                <span style="color:var(--text-muted);">Allocated Room & Bed:</span>
                <strong>Room ${student.room_number || '-'} • ${student.bed_label || '-'}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;">
                <span style="color:var(--text-muted);">Monthly Hostel Fee:</span>
                <strong style="color:var(--primary-red);">${Utils.formatINR(student.monthly_fee || 7000)}</strong>
              </div>
            </div>

            <div class="form-group" style="margin-bottom:1.15rem;">
              <label class="form-label required">Select Fee Status</label>
              <select id="ufs-status" class="form-control" onchange="StudentsPage.onFeeStatusChange(this.value)" required>
                <option value="paid" ${isPaid ? 'selected' : ''}>✅ Paid (Fee cleared & receipt generated)</option>
                <option value="pending" ${!isPaid ? 'selected' : ''}>⏳ Pending (Awaiting monthly fee payment)</option>
              </select>
            </div>

            <div id="ufs-paid-details" style="display:${isPaid ? 'block' : 'none'};">
              <div class="form-group" style="margin-bottom:1.15rem;">
                <label class="form-label required">Payment Mode</label>
                <select id="ufs-method" class="form-control">
                  <option value="UPI">UPI (PhonePe / Google Pay / Paytm)</option>
                  <option value="Cash">Cash at Reception Desk</option>
                  <option value="Bank Transfer">Bank Transfer / IMPS / NEFT</option>
                  <option value="Card">Debit / Credit Card</option>
                </select>
              </div>

              <div class="form-group" style="margin-bottom:1.15rem;">
                <label class="form-label required">Payment Date</label>
                <input type="date" id="ufs-date" class="form-control" value="${new Date().toISOString().slice(0, 10)}" />
              </div>

              <div class="form-group" style="margin-bottom:1.15rem;">
                <label class="form-label">Transaction / UTR Reference</label>
                <input type="text" id="ufs-txnid" class="form-control" placeholder="e.g. UPI-984324902342" />
              </div>
            </div>

            <div style="display:flex;justify-content:flex-end;gap:0.75rem;margin-top:1.25rem;">
              <button type="button" class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
              <button type="submit" id="ufs-submit-btn" class="btn btn-primary">
                <i data-lucide="check-circle" style="width:15px;height:15px;"></i>
                <span>Save Fee Status</span>
              </button>
            </div>
          </form>
        `,
        maxWidth: '520px'
      });
      Utils.renderIcons();
    } catch (e) {
      Toast.error('Failed to open fee update modal: ' + e.message);
    }
  },

  onFeeStatusChange(val) {
    const wrap = document.getElementById('ufs-paid-details');
    if (wrap) {
      wrap.style.display = val === 'paid' ? 'block' : 'none';
    }
  },

  async submitUpdateFee(e, studentId) {
    e.preventDefault();
    const submitBtn = document.getElementById('ufs-submit-btn');
    const status = document.getElementById('ufs-status').value;
    const paymentMethod = document.getElementById('ufs-method')?.value || 'UPI';
    const paymentDate = document.getElementById('ufs-date')?.value || new Date().toISOString().slice(0, 10);
    const transactionId = document.getElementById('ufs-txnid')?.value || '';

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Saving...</span>';
      }

      const res = await API.put(`/students/${studentId}/fee-status`, {
        feeStatus: status,
        paymentMethod,
        paymentDate,
        transactionId
      });

      if (res.success) {
        Toast.success(res.message || 'Fee status updated successfully!');
        Modal.close();

        this.loadStudents();
        if (window.FeesPage) {
          FeesPage.loadCycles();
          FeesPage.loadReminderStats();
        }
        if (window.PaymentsPage) {
          PaymentsPage.loadPayments();
        }
        if (window.AdminDashboard && App.currentRoute === 'dashboard') {
          AdminDashboard.loadData();
        }
      }
    } catch (err) {
      Toast.error(err.message || 'Failed to update fee status.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i data-lucide="check-circle" style="width:15px;height:15px;"></i> <span>Save Fee Status</span>`;
        Utils.renderIcons();
      }
    }
  }
};

window.StudentsPage = StudentsPage;
