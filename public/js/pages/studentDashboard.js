/**
 * Student Dashboard Page Component
 * Dedicated personal residency portal for students
 */
const StudentDashboard = {
  async render() {
    const user = API.getUser();
    const student = API.getStudent();

    return `
      <!-- Welcome Hero Banner -->
      <div class="card" style="margin-bottom:1.75rem;border-left:4px solid var(--primary-red);background:linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 100%);padding:1.5rem;">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;">
          <div style="display:flex;align-items:center;gap:1.25rem;">
            <div class="user-avatar" style="width:60px;height:60px;font-size:1.5rem;border:2px solid var(--primary-red);">
              ${user ? user.name.charAt(0) : 'S'}
            </div>
            <div>
              <span class="badge badge-info" style="margin-bottom:0.25rem;">Student Resident Portal</span>
              <h1 style="font-size:1.5rem;font-weight:800;color:var(--text-primary);letter-spacing:-0.4px;">
                Welcome, ${Utils.escapeHTML(user ? user.name : 'Resident')}!
              </h1>
              <p style="font-size:0.84rem;color:var(--text-muted);margin-top:0.2rem;">
                Roll No: <strong>${student ? student.reg_number : '2024IT123'}</strong> • ${student ? student.course : 'B.Tech IT'}
              </p>
            </div>
          </div>

          <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
            <button class="btn btn-secondary" onclick="App.toggleAiAssistant()">
              <i data-lucide="bot" style="color:var(--primary-red);"></i>
              <span>AI Assistant</span>
            </button>
            <button class="btn btn-primary" onclick="ComplaintsPage.openSubmitModal()">
              <i data-lucide="plus-circle"></i>
              <span>Submit Complaint</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 4 RESIDENT KPI CARDS -->
      <div class="kpi-grid" style="margin-bottom:1.75rem;">
        <!-- Card 1: Room & Bed -->
        <div class="kpi-card" style="border-left:4px solid var(--primary-red);">
          <div class="kpi-header">
            <span class="kpi-title">Assigned Room</span>
            <div class="kpi-icon-wrap"><i data-lucide="door-closed"></i></div>
          </div>
          <div class="kpi-value" style="color:var(--primary-red);">
            Room ${student ? student.room_number : '205'}
          </div>
          <div class="kpi-footer">
            <span>Floor ${student ? student.floor_number : '2'} • ${student ? student.bed_label : 'Bed 3'}</span>
          </div>
        </div>

        <!-- Card 2: Monthly Fee Anchor -->
        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">Monthly Fee</span>
            <div class="kpi-icon-wrap"><i data-lucide="credit-card"></i></div>
          </div>
          <div class="kpi-value">
            ${Utils.formatINR(student ? student.monthly_fee : 7000)}
          </div>
          <div class="kpi-footer">
            <span>Joining Date: <strong>${Utils.formatDate(student ? student.joining_date : '2026-09-16')}</strong></span>
          </div>
        </div>

        <!-- Card 3: Next Due Date -->
        <div class="kpi-card" id="student-next-due-card">
          <div class="kpi-header">
            <span class="kpi-title">Next Fee Due</span>
            <div class="kpi-icon-wrap"><i data-lucide="clock"></i></div>
          </div>
          <div class="kpi-value" id="stu-due-date-val" style="font-size:1.35rem;">15-11-2026</div>
          <div class="kpi-footer">
            <span class="badge badge-info" id="stu-due-badge">Upcoming Cycle</span>
          </div>
        </div>

        <!-- Card 4: Curfew & Security -->
        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">Night Curfew</span>
            <div class="kpi-icon-wrap"><i data-lucide="shield-alert"></i></div>
          </div>
          <div class="kpi-value">10:00 PM</div>
          <div class="kpi-footer">
            <span>Helpline: +91 120 232 4000</span>
          </div>
        </div>
      </div>

      <!-- MAIN CONTENT SPLIT: Recent Payments vs Today's Food Menu -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(460px, 1fr));gap:1.5rem;margin-bottom:1.5rem;">
        <!-- Fee Cycles & Payment Receipts -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <i data-lucide="receipt" style="color:var(--primary-red);"></i>
              My Payment Receipts
            </h3>
            <button class="btn btn-sm btn-secondary" onclick="App.navigate('fees')">View All Cycles</button>
          </div>
          <div id="stu-payments-container">
            <p style="color:var(--text-muted);font-size:0.85rem;">Loading payment history...</p>
          </div>
        </div>

        <!-- Today's Mess Menu -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <i data-lucide="utensils" style="color:var(--primary-red);"></i>
              Today's Mess Schedule
            </h3>
            <button class="btn btn-sm btn-secondary" onclick="App.navigate('mess')">Weekly Routine</button>
          </div>
          <div id="stu-mess-container">
            <p style="color:var(--text-muted);font-size:0.85rem;">Loading dining menu...</p>
          </div>
        </div>
      </div>

      <!-- SECONDARY SPLIT: Active Announcements & Complaints Status -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(460px, 1fr));gap:1.5rem;">
        <!-- Important Bulletins -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <i data-lucide="megaphone" style="color:var(--primary-red);"></i>
              Hostel Bulletins & Notices
            </h3>
          </div>
          <div id="stu-announcements-container">
            <p style="color:var(--text-muted);font-size:0.85rem;">Loading notices...</p>
          </div>
        </div>

        <!-- My Complaints Status -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <i data-lucide="alert-triangle" style="color:var(--primary-red);"></i>
              My Maintenance Tickets
            </h3>
            <button class="btn btn-sm btn-secondary" onclick="ComplaintsPage.openSubmitModal()">+ New Ticket</button>
          </div>
          <div id="stu-complaints-container">
            <p style="color:var(--text-muted);font-size:0.85rem;">Loading tickets...</p>
          </div>
        </div>
      </div>
    `;
  },

  async afterRender() {
    await this.loadStudentData();
  },

  async loadStudentData() {
    const student = API.getStudent();
    if (!student) return;

    try {
      const [feeRes, messRes, compRes, annRes] = await Promise.all([
        API.get(`/fees/student/${student.id}`),
        API.get('/mess'),
        API.get('/complaints'),
        API.get('/announcements')
      ]);

      // 1. Next Due Info
      if (feeRes.success && feeRes.data) {
        const nextDue = feeRes.data.nextDueInfo;
        const dueEl = document.getElementById('stu-due-date-val');
        const badgeEl = document.getElementById('stu-due-badge');
        if (nextDue && dueEl && badgeEl) {
          dueEl.innerText = nextDue.dueDateDisplay || Utils.formatDate(nextDue.dueDate);
          badgeEl.className = `badge ${nextDue.reminder.badgeClass}`;
          badgeEl.innerText = nextDue.reminder.label;
        }

        // Render Payments List
        const payContainer = document.getElementById('stu-payments-container');
        if (payContainer) {
          const cycles = feeRes.data.cycles || [];
          if (cycles.length === 0) {
            payContainer.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">No payment cycles on record.</p>';
          } else {
            payContainer.innerHTML = `
              <div class="table-container" style="border:none;">
                <table class="data-table" style="font-size:0.82rem;">
                  <thead>
                    <tr>
                      <th>Cycle</th>
                      <th>Period</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${cycles.map(c => `
                      <tr>
                        <td style="font-weight:700;">Cycle ${c.cycle_number}</td>
                        <td>${c.startDateDisplay} to ${c.endDateDisplay}</td>
                        <td style="font-weight:700;">${Utils.formatINR(c.amount)}</td>
                        <td><span class="badge ${c.reminder.badgeClass}">${c.reminder.label}</span></td>
                        <td>
                          ${c.payment_id ? `
                            <button class="btn btn-sm btn-secondary" onclick="ReceiptModal.open(${c.payment_id})">
                              <i data-lucide="download" style="width:12px;height:12px;"></i> PDF
                            </button>
                          ` : `<span style="color:var(--text-muted);font-size:0.75rem;">Unpaid</span>`}
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `;
          }
        }
      }

      // 2. Mess Info
      const messContainer = document.getElementById('stu-mess-container');
      if (messContainer && messRes.success && messRes.data) {
        const tm = messRes.data.todayMenu;
        if (tm) {
          messContainer.innerHTML = `
            <div style="font-size:0.85rem;display:flex;flex-direction:column;gap:0.75rem;">
              <div style="padding:0.75rem;background:var(--bg-secondary);border-radius:var(--radius-md);">
                <strong style="color:var(--primary-red);font-size:0.75rem;text-transform:uppercase;">Breakfast (${tm.breakfast_timing || '7:30 - 9:30 AM'}):</strong>
                <p style="margin-top:2px;">${Utils.escapeHTML(tm.breakfast)}</p>
              </div>
              <div style="padding:0.75rem;background:var(--bg-secondary);border-radius:var(--radius-md);">
                <strong style="color:var(--primary-red);font-size:0.75rem;text-transform:uppercase;">Lunch (${tm.lunch_timing || '12:30 - 2:30 PM'}):</strong>
                <p style="margin-top:2px;">${Utils.escapeHTML(tm.lunch)}</p>
              </div>
              <div style="padding:0.75rem;background:var(--bg-secondary);border-radius:var(--radius-md);">
                <strong style="color:var(--primary-red);font-size:0.75rem;text-transform:uppercase;">Dinner (${tm.dinner_timing || '7:30 - 9:30 PM'}):</strong>
                <p style="margin-top:2px;">${Utils.escapeHTML(tm.dinner)}</p>
              </div>
            </div>
          `;
        }
      }

      // 3. Announcements
      const annContainer = document.getElementById('stu-announcements-container');
      if (annContainer) {
        let anns = (annRes && annRes.success && Array.isArray(annRes.data) && annRes.data.length > 0)
          ? annRes.data
          : ((typeof MockData !== 'undefined' && MockData.announcements) ? MockData.announcements : []);
        anns = anns.slice(0, 3);
        if (anns.length === 0) {
          annContainer.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">No active announcements.</p>';
        } else {
          annContainer.innerHTML = anns.map(a => `
            <div style="padding:0.75rem;background:var(--bg-secondary);border-radius:var(--radius-md);margin-bottom:0.6rem;border-left:3px solid var(--primary-red);">
              <div style="font-weight:700;font-size:0.9rem;color:var(--text-primary);">${Utils.escapeHTML(a.title || 'Hostel Bulletin')}</div>
              <div style="font-size:0.8rem;color:var(--text-secondary);margin:0.25rem 0;">${Utils.escapeHTML((a.content || '').substring(0, 120))}...</div>
              <div style="font-size:0.7rem;color:var(--text-muted);">${a.publishedDateDisplay || (a.published_date ? Utils.formatDate(a.published_date) : 'Today')}</div>
            </div>
          `).join('');
        }
      }

      // 4. Complaints
      const compContainer = document.getElementById('stu-complaints-container');
      if (compContainer && compRes.success) {
        const comps = (compRes.data || []);
        if (comps.length === 0) {
          compContainer.innerHTML = `
            <div style="padding:1.5rem;text-align:center;color:var(--text-muted);font-size:0.85rem;">
              <i data-lucide="check-circle" style="width:32px;height:32px;color:var(--status-success);margin-bottom:0.5rem;opacity:0.7;"></i>
              <p style="margin:0;font-weight:600;">No Complaints Active</p>
              <p style="margin:0.25rem 0 0;font-size:0.75rem;">All facilities in your room are reported in working condition.</p>
            </div>
          `;
        } else {
          compContainer.innerHTML = comps.slice(0, 4).map(c => {
            const isResolved = c.status === 'Resolved' || c.status === 'Solved';
            const isInProgress = c.status === 'In Progress' || c.status === 'Processing';
            const badgeClass = isResolved ? 'badge-success' : isInProgress ? 'badge-warning' : 'badge-danger';
            const statusLabel = isResolved ? 'Resolved (Solved)' : isInProgress ? 'In Progress (Processing)' : 'Pending Review';
            const statusIcon = isResolved ? 'check-circle' : isInProgress ? 'wrench' : 'clock';

            return `
              <div style="padding:0.9rem;background:var(--bg-secondary);border-radius:var(--radius-md);margin-bottom:0.75rem;border-left:4px solid ${isResolved ? 'var(--status-success)' : isInProgress ? 'var(--status-warning)' : 'var(--primary-red)'};">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.35rem;">
                  <span class="badge badge-info">${Utils.escapeHTML(c.category || 'General')}</span>
                  <span class="badge ${badgeClass}" style="display:inline-flex;align-items:center;gap:0.3rem;">
                    <i data-lucide="${statusIcon}" style="width:12px;height:12px;"></i>
                    ${statusLabel}
                  </span>
                  <span style="font-size:0.72rem;color:var(--text-muted);margin-left:auto;">
                    ${c.createdAtDisplay || (c.created_at ? Utils.formatDate(c.created_at) : 'Today')}
                  </span>
                </div>
                <div style="font-weight:700;font-size:0.92rem;color:var(--text-primary);margin-top:0.2rem;">
                  ${Utils.escapeHTML(c.title)}
                </div>
                ${c.description ? `
                  <p style="font-size:0.8rem;color:var(--text-secondary);margin:0.25rem 0 0.45rem;line-height:1.4;">
                    ${Utils.escapeHTML(c.description)}
                  </p>
                ` : ''}

                <!-- Live Warden Resolution Notes on Student Dashboard -->
                ${c.admin_notes ? `
                  <div style="margin-top:0.5rem;padding:0.5rem 0.75rem;background:var(--bg-card);border-radius:var(--radius-sm);border-left:3px solid ${isResolved ? 'var(--status-success)' : 'var(--status-warning)'};font-size:0.8rem;color:var(--text-primary);">
                    <div style="display:flex;align-items:center;gap:0.35rem;font-weight:700;font-size:0.75rem;color:${isResolved ? 'var(--status-success)' : 'var(--status-warning)'};margin-bottom:0.2rem;">
                      <i data-lucide="${isResolved ? 'check-check' : 'message-square'}" style="width:13px;height:13px;"></i>
                      <span>${isResolved ? 'Warden Solved & Closed Remarks:' : 'Warden Processing Update Remarks:'}</span>
                    </div>
                    <div>${Utils.escapeHTML(c.admin_notes)}</div>
                  </div>
                ` : `
                  <div style="margin-top:0.35rem;font-size:0.72rem;color:var(--text-muted);display:flex;align-items:center;gap:0.3rem;">
                    <i data-lucide="info" style="width:12px;height:12px;"></i>
                    <span>${isResolved ? 'Issue marked solved by warden.' : isInProgress ? 'Maintenance technician dispatched to your room.' : 'Ticket received by warden desk, awaiting technician dispatch.'}</span>
                  </div>
                `}
              </div>
            `;
          }).join('') + `
            <div style="text-align:right;margin-top:0.5rem;">
              <button class="btn btn-sm btn-secondary" onclick="App.navigate('complaints')">
                <span>View Full Complaints Console</span>
                <i data-lucide="arrow-right" style="width:12px;height:12px;"></i>
              </button>
            </div>
          `;
        }
      }

      Utils.renderIcons();
    } catch (e) {
      console.error(e);
    }
  }
};

window.StudentDashboard = StudentDashboard;
