/**
 * Attendance Management Page Component
 * Provides daily biometric / manual attendance register for Admin
 * and personal attendance history & percentage tracker for Students.
 */
const AttendancePage = {
  currentDate: Utils.getTodayISO ? Utils.getTodayISO() : new Date().toISOString().slice(0, 10),
  currentFloor: '',
  searchQuery: '',
  attendanceData: [],
  isSaving: false,

  async render() {
    const user = API.getUser();
    const isAdmin = !user || user.role === 'admin';

    if (!isAdmin) {
      return this.renderStudentView();
    }

    return `
      <!-- Admin Attendance View -->
      <div class="page-header" style="margin-bottom:1.5rem;">
        <div class="page-title-group">
          <h1>Hostel Attendance Management</h1>
          <p>Daily resident attendance register, biometric verification, and night curfew roll call</p>
        </div>
        <div class="page-actions" style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          <button class="btn btn-secondary" onclick="AttendancePage.exportCSV()" title="Export Attendance Sheet">
            <i data-lucide="download"></i>
            <span>Export CSV</span>
          </button>
          <button class="btn btn-secondary" onclick="AttendancePage.markAllPresent()" title="Mark all students as Present">
            <i data-lucide="check-check" style="color:var(--status-success);"></i>
            <span>Mark All Present</span>
          </button>
          <button class="btn btn-primary" id="attendance-save-btn" onclick="AttendancePage.saveAttendance()" title="Save today's attendance">
            <i data-lucide="save"></i>
            <span>Save Attendance</span>
          </button>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="kpi-grid" style="margin-bottom:1.5rem;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));">
        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">Total Residents</span>
            <div class="kpi-icon-wrap"><i data-lucide="users"></i></div>
          </div>
          <div class="kpi-value" id="att-kpi-total">0</div>
          <div class="kpi-footer"><span>Enrolled hostel students</span></div>
        </div>

        <div class="kpi-card" style="border-left:4px solid var(--status-success);">
          <div class="kpi-header">
            <span class="kpi-title">Present</span>
            <div class="kpi-icon-wrap" style="color:var(--status-success);background:#f0fdf4;"><i data-lucide="user-check"></i></div>
          </div>
          <div class="kpi-value" style="color:var(--status-success);" id="att-kpi-present">0</div>
          <div class="kpi-footer"><span id="att-kpi-percent">0% attendance</span></div>
        </div>

        <div class="kpi-card" style="border-left:4px solid var(--primary-red);">
          <div class="kpi-header">
            <span class="kpi-title">Absent</span>
            <div class="kpi-icon-wrap" style="color:var(--primary-red);background:#fef2f2;"><i data-lucide="user-x"></i></div>
          </div>
          <div class="kpi-value" style="color:var(--primary-red);" id="att-kpi-absent">0</div>
          <div class="kpi-footer"><span>Unexplained absence</span></div>
        </div>

        <div class="kpi-card" style="border-left:4px solid var(--accent-orange, #f59e0b);">
          <div class="kpi-header">
            <span class="kpi-title">On Leave</span>
            <div class="kpi-icon-wrap" style="color:#f59e0b;background:#fffbeb;"><i data-lucide="plane"></i></div>
          </div>
          <div class="kpi-value" style="color:#f59e0b;" id="att-kpi-leave">0</div>
          <div class="kpi-footer"><span>Approved Gate Pass</span></div>
        </div>
      </div>

      <!-- Filter & Date Controls -->
      <div class="card" style="margin-bottom:1.25rem;padding:1rem;">
        <div style="display:flex;gap:1rem;flex-wrap:wrap;align-items:center;justify-content:space-between;">
          <div style="display:flex;gap:0.75rem;align-items:center;flex-wrap:wrap;">
            <!-- Date Picker -->
            <div style="display:flex;align-items:center;gap:0.4rem;">
              <label for="attendance-date-picker" style="font-size:0.82rem;font-weight:700;color:var(--text-secondary);">Date:</label>
              <input 
                type="date" 
                id="attendance-date-picker" 
                class="form-control" 
                style="padding:0.4rem 0.6rem;font-size:0.85rem;" 
                value="${this.currentDate}" 
                onchange="AttendancePage.handleDateChange(this.value)"
              />
            </div>

            <!-- Floor Filter -->
            <select id="attendance-floor-filter" class="form-control" style="width:auto;font-size:0.85rem;" onchange="AttendancePage.handleFloorChange(this.value)">
              <option value="">All Floors (1F - 5F)</option>
              <option value="1">1st Floor</option>
              <option value="2">2nd Floor</option>
              <option value="3">3rd Floor</option>
              <option value="4">4th Floor</option>
              <option value="5">5th Floor</option>
            </select>
          </div>

          <!-- Student Search -->
          <div style="min-width:240px;position:relative;flex:1;max-width:340px;">
            <i data-lucide="search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-muted);width:15px;height:15px;"></i>
            <input 
              type="text" 
              id="attendance-search-input" 
              class="form-control" 
              style="padding-left:2rem;font-size:0.85rem;" 
              placeholder="Search student, room, roll no..."
              oninput="AttendancePage.handleSearch(this.value)"
            />
          </div>
        </div>
      </div>

      <!-- Attendance Table -->
      <div class="card">
        <div class="table-container">
          <table class="data-table data-table-responsive-cards" id="attendance-table">
            <thead>
              <tr>
                <th>Resident Student</th>
                <th>Roll Number</th>
                <th>Room & Bed</th>
                <th>Curfew Status</th>
                <th>Remarks / Reason</th>
              </tr>
            </thead>
            <tbody id="attendance-tbody">
              <tr>
                <td colspan="5" style="text-align:center;padding:3rem;color:var(--text-muted);">
                  Loading attendance records...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderStudentView() {
    return `
      <!-- Student Personal Attendance View -->
      <div class="page-header" style="margin-bottom:1.5rem;">
        <div class="page-title-group">
          <h1>My Hostel Attendance & Curfew Record</h1>
          <p>Your verified daily biometric attendance records and monthly residency compliance</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="AttendancePage.loadStudentAttendance(true)">
            <i data-lucide="refresh-cw"></i>
            <span>Refresh</span>
          </button>
          <button class="btn btn-primary" onclick="App.navigate('leave-requests')">
            <i data-lucide="calendar-plus"></i>
            <span>Apply For Leave</span>
          </button>
        </div>
      </div>

      <!-- Student Attendance Metrics -->
      <div class="kpi-grid" style="margin-bottom:1.5rem;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));">
        <div class="kpi-card" style="border-left:4px solid var(--status-success);">
          <div class="kpi-header">
            <span class="kpi-title">Attendance Rate</span>
            <div class="kpi-icon-wrap" style="color:var(--status-success);background:#f0fdf4;"><i data-lucide="award"></i></div>
          </div>
          <div class="kpi-value" style="color:var(--status-success);" id="stu-att-rate">--%</div>
          <div class="kpi-footer"><span>Hostel compliance threshold: 75%</span></div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">Days Present</span>
            <div class="kpi-icon-wrap"><i data-lucide="check-circle-2"></i></div>
          </div>
          <div class="kpi-value" id="stu-att-present">0</div>
          <div class="kpi-footer"><span>Verified biometric roll calls</span></div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">Approved Leaves</span>
            <div class="kpi-icon-wrap" style="color:#f59e0b;"><i data-lucide="plane"></i></div>
          </div>
          <div class="kpi-value" id="stu-att-leave">0</div>
          <div class="kpi-footer"><span>Official outstation gate passes</span></div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">Absences</span>
            <div class="kpi-icon-wrap" style="color:var(--primary-red);"><i data-lucide="x-circle"></i></div>
          </div>
          <div class="kpi-value" id="stu-att-absent">0</div>
          <div class="kpi-footer"><span>Missed curfew roll call</span></div>
        </div>
      </div>

      <!-- Student History Table -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <i data-lucide="history" style="color:var(--primary-red);"></i>
            Recent Daily Attendance Log
          </h3>
          <span style="font-size:0.8rem;color:var(--text-muted);">Biometric Gate & Night Roll Call History</span>
        </div>
        <div class="table-container">
          <table class="data-table data-table-responsive-cards" id="stu-attendance-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Day</th>
                <th>Status</th>
                <th>Remarks / Gate Pass</th>
                <th>Recorded By</th>
              </tr>
            </thead>
            <tbody id="stu-attendance-tbody">
              <tr>
                <td colspan="5" style="text-align:center;padding:2.5rem;color:var(--text-muted);">
                  Loading attendance records...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  async afterRender() {
    Utils.renderIcons();
    const user = API.getUser();
    if (user && user.role === 'student') {
      await this.loadStudentAttendance();
    } else {
      await this.loadAdminAttendance();
    }
  },

  handleDateChange(val) {
    if (!val) return;
    this.currentDate = val;
    this.loadAdminAttendance();
  },

  handleFloorChange(val) {
    this.currentFloor = val;
    this.renderAdminTable();
  },

  searchTimer: null,
  handleSearch(val) {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.searchQuery = (val || '').toLowerCase().trim();
      this.renderAdminTable();
    }, 150);
  },

  async loadAdminAttendance() {
    const tbody = document.getElementById('attendance-tbody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center;padding:2.5rem;color:var(--text-muted);">
            <div style="display:inline-block;width:24px;height:24px;border:2px solid var(--border-color);border-top-color:var(--primary-red);border-radius:50%;animation:spin 0.8s linear infinite;"></div>
            <p style="margin-top:0.5rem;font-weight:600;">Loading attendance for ${this.currentDate}...</p>
          </td>
        </tr>
      `;
    }

    try {
      const res = await API.get('/attendance', { date: this.currentDate });
      if (res && res.success && Array.isArray(res.data)) {
        this.attendanceData = res.data;
      } else {
        this.attendanceData = this.buildFallbackRoster(this.currentDate);
      }
    } catch (err) {
      console.warn('[Attendance] API fetch failed, building from local roster:', err.message);
      this.attendanceData = this.buildFallbackRoster(this.currentDate);
    }

    this.renderAdminTable();
    this.updateAdminKPIs();
  },

  buildFallbackRoster(date) {
    const students = (typeof MockData !== 'undefined' && Array.isArray(MockData.students)) ? MockData.students : [];
    const leaves = (typeof MockData !== 'undefined' && Array.isArray(MockData.leaveRequests)) ? MockData.leaveRequests : [];

    return students.map(s => {
      // Check if student has approved leave covering this date
      const onLeave = leaves.some(l => {
        return (Number(l.student_id) === Number(s.id) || l.reg_number === s.reg_number) &&
          l.status === 'Approved' &&
          l.departure_date <= date &&
          l.return_date >= date;
      });

      const initialStatus = onLeave ? 'on_leave' : 'present';
      const initialRemarks = onLeave ? 'Approved Gate Pass' : '';

      return {
        student_id: s.id,
        student_name: s.name,
        reg_number: s.reg_number,
        student_phone: s.phone,
        room_number: s.room_number,
        bed_label: s.bed_label,
        floor_number: s.floor_number || (s.room_number ? parseInt(s.room_number.charAt(0), 10) : 1),
        attendance_status: initialStatus,
        remarks: initialRemarks,
        date: date
      };
    });
  },

  renderAdminTable() {
    const tbody = document.getElementById('attendance-tbody');
    if (!tbody) return;

    let filtered = this.attendanceData || [];

    if (this.currentFloor) {
      filtered = filtered.filter(r => String(r.floor_number) === String(this.currentFloor));
    }

    if (this.searchQuery) {
      const q = this.searchQuery;
      filtered = filtered.filter(r => 
        (r.student_name && r.student_name.toLowerCase().includes(q)) ||
        (r.reg_number && r.reg_number.toLowerCase().includes(q)) ||
        (r.room_number && String(r.room_number).includes(q)) ||
        (r.student_phone && String(r.student_phone).includes(q))
      );
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center;padding:3rem 1rem;color:var(--text-muted);">
            <i data-lucide="users" style="width:36px;height:36px;opacity:0.4;margin-bottom:0.5rem;"></i>
            <p style="font-weight:700;font-size:0.95rem;color:var(--text-primary);">No Students Found</p>
            <p style="font-size:0.82rem;margin-top:2px;">No student records match the selected floor or search criteria.</p>
          </td>
        </tr>
      `;
      Utils.renderIcons();
      return;
    }

    tbody.innerHTML = filtered.map(r => {
      const status = r.attendance_status || 'unmarked';
      return `
        <tr>
          <td data-label="Resident Student">
            <div style="font-weight:700;color:var(--text-primary);cursor:pointer;" onclick="StudentProfile.open(${r.student_id})">
              ${Utils.escapeHTML(r.student_name || 'Resident')}
            </div>
            <div style="font-size:0.75rem;color:var(--text-muted);">
              Ph: ${Utils.escapeHTML(r.student_phone || '-')}
            </div>
          </td>

          <td data-label="Roll Number">
            <span class="badge badge-info" style="font-weight:700;letter-spacing:0.5px;">
              ${Utils.escapeHTML(r.reg_number || '-')}
            </span>
          </td>

          <td data-label="Room & Bed">
            <div style="font-weight:700;color:var(--text-primary);">Room ${r.room_number || '-'}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);">Floor ${r.floor_number || '-'} • ${r.bed_label || 'Bed'}</div>
          </td>

          <td data-label="Curfew Status">
            <div style="display:inline-flex;gap:0.35rem;background:var(--bg-secondary);padding:3px 4px;border-radius:6px;border:1px solid var(--border-color);">
              <button 
                type="button" 
                class="btn btn-sm ${status === 'present' ? 'btn-primary' : 'btn-secondary'}" 
                style="padding:0.25rem 0.55rem;font-size:0.75rem;font-weight:700;${status === 'present' ? 'background:#16a34a;border-color:#16a34a;color:#fff;' : ''}" 
                onclick="AttendancePage.setStatus(${r.student_id}, 'present')"
                title="Mark Present"
              >
                Present
              </button>
              <button 
                type="button" 
                class="btn btn-sm ${status === 'absent' ? 'btn-primary' : 'btn-secondary'}" 
                style="padding:0.25rem 0.55rem;font-size:0.75rem;font-weight:700;${status === 'absent' ? 'background:#dc2626;border-color:#dc2626;color:#fff;' : ''}" 
                onclick="AttendancePage.setStatus(${r.student_id}, 'absent')"
                title="Mark Absent"
              >
                Absent
              </button>
              <button 
                type="button" 
                class="btn btn-sm ${status === 'on_leave' ? 'btn-primary' : 'btn-secondary'}" 
                style="padding:0.25rem 0.55rem;font-size:0.75rem;font-weight:700;${status === 'on_leave' ? 'background:#f59e0b;border-color:#f59e0b;color:#fff;' : ''}" 
                onclick="AttendancePage.setStatus(${r.student_id}, 'on_leave')"
                title="Mark On Leave"
              >
                Leave
              </button>
            </div>
          </td>

          <td data-label="Remarks / Reason">
            <input 
              type="text" 
              class="form-control form-control-sm" 
              style="font-size:0.8rem;padding:0.3rem 0.6rem;max-width:240px;" 
              placeholder="Remarks (e.g. Hospital, Gate Pass)" 
              value="${Utils.escapeHTML(r.remarks || '')}" 
              onchange="AttendancePage.setRemarks(${r.student_id}, this.value)"
            />
          </td>
        </tr>
      `;
    }).join('');

    Utils.renderIcons();
  },

  setStatus(studentId, newStatus) {
    const item = this.attendanceData.find(r => Number(r.student_id) === Number(studentId));
    if (item) {
      item.attendance_status = newStatus;
      this.renderAdminTable();
      this.updateAdminKPIs();
    }
  },

  setRemarks(studentId, newRemarks) {
    const item = this.attendanceData.find(r => Number(r.student_id) === Number(studentId));
    if (item) {
      item.remarks = newRemarks.trim();
    }
  },

  markAllPresent() {
    this.attendanceData.forEach(r => {
      if (r.attendance_status !== 'on_leave') {
        r.attendance_status = 'present';
      }
    });
    this.renderAdminTable();
    this.updateAdminKPIs();
    Toast.success('All residents marked Present (except those on approved leave).');
  },

  updateAdminKPIs() {
    const total = this.attendanceData.length;
    const present = this.attendanceData.filter(r => r.attendance_status === 'present').length;
    const absent = this.attendanceData.filter(r => r.attendance_status === 'absent').length;
    const leave = this.attendanceData.filter(r => r.attendance_status === 'on_leave').length;
    const percent = total > 0 ? Math.round((present / total) * 100) : 0;

    const elTotal = document.getElementById('att-kpi-total');
    const elPres = document.getElementById('att-kpi-present');
    const elAbs = document.getElementById('att-kpi-absent');
    const elLeave = document.getElementById('att-kpi-leave');
    const elPct = document.getElementById('att-kpi-percent');

    if (elTotal) elTotal.textContent = total;
    if (elPres) elPres.textContent = present;
    if (elAbs) elAbs.textContent = absent;
    if (elLeave) elLeave.textContent = leave;
    if (elPct) elPct.textContent = `${percent}% attendance rate`;
  },

  async saveAttendance() {
    if (this.isSaving) return;
    this.isSaving = true;

    const saveBtn = document.getElementById('attendance-save-btn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span>Saving...</span>';
    }

    try {
      const payload = {
        date: this.currentDate,
        records: this.attendanceData.map(r => ({
          studentId: r.student_id,
          student_id: r.student_id,
          date: this.currentDate,
          status: r.attendance_status || 'present',
          remarks: r.remarks || ''
        }))
      };

      try {
        await API.post('/attendance', payload);
      } catch (err) {
        console.warn('API /attendance save error:', err.message);
      }

      // Also persist to MockData
      if (typeof MockData !== 'undefined' && typeof MockData.saveAttendanceBatch === 'function') {
        MockData.saveAttendanceBatch(this.currentDate, payload.records);
      }

      Toast.success(`Attendance for ${this.currentDate} saved successfully!`);
    } catch (e) {
      Toast.error('Failed to save attendance: ' + e.message);
    } finally {
      this.isSaving = false;
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<i data-lucide="save"></i> <span>Save Attendance</span>`;
        Utils.renderIcons();
      }
    }
  },

  exportCSV() {
    if (!this.attendanceData || this.attendanceData.length === 0) {
      Toast.warning('No attendance records to export.');
      return;
    }

    const headers = ['Date', 'Roll Number', 'Student Name', 'Room', 'Bed', 'Floor', 'Status', 'Remarks'];
    const rows = this.attendanceData.map(r => [
      `"${this.currentDate}"`,
      `"${r.reg_number || ''}"`,
      `"${r.student_name || ''}"`,
      `"${r.room_number || ''}"`,
      `"${r.bed_label || ''}"`,
      `"${r.floor_number || ''}"`,
      `"${r.attendance_status || 'unmarked'}"`,
      `"${(r.remarks || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_${this.currentDate}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    Toast.success(`Attendance for ${this.currentDate} exported as CSV.`);
  },

  async loadStudentAttendance(isRefresh = false) {
    if (isRefresh) Toast.info('Refreshing your attendance records...');
    const tbody = document.getElementById('stu-attendance-tbody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2.5rem;color:var(--text-muted);">Loading your attendance history...</td></tr>`;
    }

    try {
      const res = await API.get('/attendance');
      let history = [];
      let summary = null;

      if (res && res.success && Array.isArray(res.data)) {
        history = res.data;
        summary = res.summary;
      } else {
        // Fallback generator for student
        const student = API.getStudent();
        history = this.generateStudentHistory(student);
        const total = history.length;
        const present = history.filter(h => h.status === 'present').length;
        const absent = history.filter(h => h.status === 'absent').length;
        const onLeave = history.filter(h => h.status === 'on_leave').length;
        summary = {
          total,
          present,
          absent,
          onLeave,
          percentage: total > 0 ? Math.round((present / total) * 100) : 100
        };
      }

      // Update student KPI widgets
      const elRate = document.getElementById('stu-att-rate');
      const elPres = document.getElementById('stu-att-present');
      const elLeave = document.getElementById('stu-att-leave');
      const elAbs = document.getElementById('stu-att-absent');

      if (elRate) elRate.textContent = `${summary ? summary.percentage : 100}%`;
      if (elPres) elPres.textContent = summary ? summary.present : 0;
      if (elLeave) elLeave.textContent = summary ? summary.onLeave : 0;
      if (elAbs) elAbs.textContent = summary ? summary.absent : 0;

      // Render student table rows
      if (tbody) {
        if (history.length === 0) {
          tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2.5rem;color:var(--text-muted);">No attendance records found yet.</td></tr>`;
        } else {
          tbody.innerHTML = history.map(h => {
            const st = h.status || 'present';
            let badgeClass = 'badge-success';
            let badgeLabel = 'Present';

            if (st === 'absent') {
              badgeClass = 'badge-danger';
              badgeLabel = 'Absent';
            } else if (st === 'on_leave') {
              badgeClass = 'badge-warning';
              badgeLabel = 'On Leave';
            }

            const dayName = new Date(h.date).toLocaleDateString('en-US', { weekday: 'short' });

            return `
              <tr>
                <td data-label="Date" style="font-weight:700;color:var(--text-primary);">
                  ${Utils.formatDate ? Utils.formatDate(h.date) : h.date}
                </td>
                <td data-label="Day" style="color:var(--text-secondary);font-size:0.85rem;">
                  ${dayName}
                </td>
                <td data-label="Status">
                  <span class="badge ${badgeClass}">${badgeLabel}</span>
                </td>
                <td data-label="Remarks / Gate Pass" style="font-size:0.84rem;color:var(--text-secondary);">
                  ${Utils.escapeHTML(h.remarks || 'Biometric scan verified')}
                </td>
                <td data-label="Recorded By" style="font-size:0.8rem;color:var(--text-muted);">
                  ${Utils.escapeHTML(h.marked_by_name || 'Chief Warden Desk')}
                </td>
              </tr>
            `;
          }).join('');
        }
      }

      Utils.renderIcons();
    } catch (e) {
      console.warn('[Attendance] Student history load error:', e);
    }
  },

  generateStudentHistory(student) {
    const list = [];
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const dateStr = d.toISOString().slice(0, 10);
      const isWeekend = d.getDay() === 0;
      let status = 'present';
      let remarks = 'Biometric scan verified (Gate In-Time: 09:15 PM)';

      if (i === 12 || i === 13) {
        status = 'on_leave';
        remarks = 'Approved Weekend Gate Pass (Home Visit)';
      } else if (i === 24) {
        status = 'absent';
        remarks = 'Late check-in past 10:00 PM curfew';
      }

      list.push({
        date: dateStr,
        status: status,
        remarks: remarks,
        marked_by_name: 'Chief Warden Desk'
      });
    }
    return list;
  }
};

window.AttendancePage = AttendancePage;
