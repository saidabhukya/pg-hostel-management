/**
 * Admin Dashboard Page Component
 * Renders 8 KPI metric cards, Chart.js graphs, and recent activity ledgers
 */
const AdminDashboard = {
  charts: {},

  async render() {
    return `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Hostel Overview & Command Center</h1>
          <p>Real-time campus residency metrics, financial status, and occupancy analytics</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="AdminDashboard.refresh()">
            <i data-lucide="refresh-cw"></i>
            <span>Refresh Stats</span>
          </button>
          <button class="btn btn-primary" onclick="AddStudentModal.open()">
            <i data-lucide="user-plus"></i>
            <span>Add New Student</span>
          </button>
        </div>
      </div>

      <!-- 8 PRIMARY KPI CARDS -->
      <div class="kpi-grid" id="dashboard-kpi-container">
        <!-- Skeleton Loaders -->
        ${Array(8).fill(0).map(() => `
          <div class="kpi-card">
            <div style="height:14px;background:var(--border-color);width:45%;border-radius:4px;margin-bottom:1rem;"></div>
            <div style="height:28px;background:var(--border-color);width:60%;border-radius:6px;"></div>
          </div>
        `).join('')}
      </div>

      <!-- CHARTS SECTION (Chart.js) -->
      <div class="chart-grid">
        <!-- Floor-Wise Occupancy (1F to 5F) -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <i data-lucide="building-2" style="color:var(--primary-red);"></i>
              Floor-Wise Bed Occupancy (1F - 5F)
            </h3>
            <span class="badge badge-info" id="occupancy-rate-badge">Occupancy Rate: --%</span>
          </div>
          <div class="chart-wrapper">
            <canvas id="floorOccupancyChart"></canvas>
          </div>
        </div>

        <!-- Monthly Income vs Expenses -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <i data-lucide="trending-up" style="color:var(--primary-red);"></i>
              Financial Performance (Income vs Expenses)
            </h3>
            <button class="btn btn-sm btn-secondary" onclick="App.navigate('reports')">View Audit</button>
          </div>
          <div class="chart-wrapper">
            <canvas id="financialChart"></canvas>
          </div>
        </div>
      </div>

      <!-- SECONDARY CHARTS & RECENT ACTIVITIES -->
      <div class="chart-grid">
        <!-- Occupancy Breakdown Doughnut -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <i data-lucide="pie-chart" style="color:var(--primary-red);"></i>
              Total Bed Distribution (250 Beds)
            </h3>
          </div>
          <div class="chart-wrapper">
            <canvas id="bedDistributionChart"></canvas>
          </div>
        </div>

        <!-- Operating Expenses Breakdown -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <i data-lucide="wallet" style="color:var(--primary-red);"></i>
              Expense Categories Breakdown
            </h3>
            <button class="btn btn-sm btn-secondary" onclick="App.navigate('expenses')">Manage</button>
          </div>
          <div class="chart-wrapper">
            <canvas id="expenseCategoryChart"></canvas>
          </div>
        </div>
      </div>

      <!-- RECENT ACTIVITY TABLES -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(460px, 1fr));gap:1.5rem;margin-top:1.5rem;">
        <!-- Recent Fee Payments -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <i data-lucide="receipt" style="color:var(--primary-red);"></i>
              Recent Fee Collections
            </h3>
            <a href="#payments" onclick="Sidebar.handleNavClick('payments', event)" style="font-size:0.8rem;font-weight:600;">View All</a>
          </div>
          <div id="recent-payments-container">
            <p style="color:var(--text-muted);font-size:0.85rem;">Loading recent transactions...</p>
          </div>
        </div>

        <!-- Recent Maintenance Complaints -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <i data-lucide="alert-circle" style="color:var(--primary-red);"></i>
              Recent Complaints & Issues
            </h3>
            <a href="#complaints" onclick="Sidebar.handleNavClick('complaints', event)" style="font-size:0.8rem;font-weight:600;">Manage</a>
          </div>
          <div id="recent-complaints-container">
            <p style="color:var(--text-muted);font-size:0.85rem;">Loading complaints...</p>
          </div>
        </div>
      </div>
    `;
  },

  async afterRender() {
    await this.loadData();
  },

  async refresh() {
    Toast.info('Refreshing dashboard metrics...');
    await this.loadData();
    Toast.success('Dashboard metrics up to date.');
  },

  async loadData() {
    let stats = null;
    let charts = null;

    try {
      const [statsRes, chartsRes] = await Promise.all([
        API.get('/dashboard/stats'),
        API.get('/dashboard/charts')
      ]);

      if (statsRes && statsRes.success) stats = statsRes.data;
      if (chartsRes && chartsRes.success) charts = chartsRes.data;
    } catch (err) {
      console.warn('[Dashboard Load Online Attempt, using local dataset]:', err.message);
    }

    if (!stats && typeof MockData !== 'undefined') stats = MockData.stats;
    if (!charts && typeof MockData !== 'undefined') charts = MockData.charts;

    if (stats) {
      try {
        this.renderKpiCards(stats);
      } catch (e) {
        console.warn('renderKpiCards error:', e);
      }
    }
    if (charts) {
      try {
        this.renderCharts(charts, stats || {});
      } catch (e) {
        console.warn('renderCharts error:', e);
      }
      try {
        this.renderRecentActivities(charts);
      } catch (e) {
        console.warn('renderRecentActivities error:', e);
      }
    }

    Utils.renderIcons();
  },

  renderKpiCards(data) {
    const container = document.getElementById('dashboard-kpi-container');
    if (!container) return;

    const cards = [
      {
        title: 'Total Students',
        value: data.totalStudents,
        icon: 'users',
        subtext: 'Active hostel residents',
        link: 'students'
      },
      {
        title: 'Total Beds',
        value: data.totalBeds,
        icon: 'bed-double',
        subtext: '5 Floors • 50 Rooms',
        link: 'hostel-structure'
      },
      {
        title: 'Occupied Beds',
        value: data.occupiedBeds,
        icon: 'user-check',
        subtext: `${data.occupancyRate}% current occupancy`,
        highlightColor: 'red',
        link: 'hostel-structure'
      },
      {
        title: 'Available Beds',
        value: data.availableBeds,
        icon: 'bed',
        subtext: `${data.availableBeds} beds ready for allocation`,
        link: 'hostel-structure'
      },
      {
        title: 'Fees Collected',
        value: Utils.formatINR(data.feesCollected),
        icon: 'receipt',
        subtext: 'Total revenue realized',
        link: 'payments'
      },
      {
        title: 'Pending Fees',
        value: Utils.formatINR(data.pendingFees),
        icon: 'clock',
        subtext: 'Outstanding student dues',
        highlightColor: 'yellow',
        link: 'fees'
      },
      {
        title: 'Hostel Expenses',
        value: Utils.formatINR(data.hostelExpenses),
        icon: 'credit-card',
        subtext: 'Maintenance & utilities',
        link: 'expenses'
      },
      {
        title: 'Net Income',
        value: Utils.formatINR(data.netIncome),
        icon: 'wallet',
        subtext: 'Collected - Operating Expenses',
        highlightColor: 'green',
        link: 'reports'
      }
    ];

    container.innerHTML = cards.map(c => `
      <div class="kpi-card" onclick="App.navigate('${c.link}')" style="cursor:pointer;" title="Click to view ${c.title}">
        <div class="kpi-header">
          <span class="kpi-title">${c.title}</span>
          <div class="kpi-icon-wrap">
            <i data-lucide="${c.icon}"></i>
          </div>
        </div>
        <div class="kpi-value">${c.value}</div>
        <div class="kpi-footer">
          <i data-lucide="info" style="width:14px;height:14px;"></i>
          <span>${c.subtext}</span>
        </div>
      </div>
    `).join('');

    const occBadge = document.getElementById('occupancy-rate-badge');
    if (occBadge) occBadge.innerText = `Occupancy: ${data.occupancyRate}%`;
  },

  renderCharts(chartData, statsData) {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js library is not loaded. Skipping chart rendering.');
      return;
    }

    const isDark = Utils.getTheme() === 'dark';
    const textColor = isDark ? '#cbd5e1' : '#475569';
    const gridColor = isDark ? '#1e293b' : '#f1f5f9';

    // Destroy prior instances
    Object.values(this.charts).forEach(c => c && typeof c.destroy === 'function' && c.destroy());
    this.charts = {};

    // 1. Floor-wise Occupancy Bar Chart
    try {
      const floorCanvas = document.getElementById('floorOccupancyChart');
      if (floorCanvas && chartData.floorOccupancy) {
        const floors = chartData.floorOccupancy;
        this.charts.floor = new Chart(floorCanvas.getContext('2d'), {
          type: 'bar',
          data: {
            labels: floors.map(f => `${f.floor_name}`),
            datasets: [
              {
                label: 'Occupied Beds',
                data: floors.map(f => Number(f.occupied_beds)),
                backgroundColor: '#dc2626',
                borderRadius: 6
              },
              {
                label: 'Available Beds',
                data: floors.map(f => Number(f.available_beds)),
                backgroundColor: isDark ? '#334155' : '#cbd5e1',
                borderRadius: 6
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { stacked: true, grid: { color: gridColor }, ticks: { color: textColor } },
              y: { stacked: true, max: 50, grid: { color: gridColor }, ticks: { color: textColor } }
            },
            plugins: {
              legend: { labels: { color: textColor } }
            }
          }
        });
      }
    } catch (e) {
      console.warn('Floor occupancy chart error:', e);
    }

    // 2. Monthly Financials (Income vs Expenses)
    try {
      const finCanvas = document.getElementById('financialChart');
      if (finCanvas) {
        const incList = chartData.monthlyIncome || [];
        const expList = chartData.monthlyExpenses || [];

        const allMonths = Array.from(new Set([
          ...incList.map(i => i.month_year),
          ...expList.map(e => e.month_year)
        ])).sort();

        const labels = allMonths.length ? allMonths : ['Current Month'];
        const incData = allMonths.length ? allMonths.map(m => {
          const row = incList.find(i => i.month_year === m);
          return row ? Number(row.total_income) : 0;
        }) : [statsData.feesCollected || 0];

        const expData = allMonths.length ? allMonths.map(m => {
          const row = expList.find(e => e.month_year === m);
          return row ? Number(row.total_expense) : 0;
        }) : [statsData.hostelExpenses || 0];

        this.charts.financial = new Chart(finCanvas.getContext('2d'), {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Fees Collected (₹)',
                data: incData,
                backgroundColor: '#16a34a',
                borderRadius: 6
              },
              {
                label: 'Expenses (₹)',
                data: expData,
                backgroundColor: '#dc2626',
                borderRadius: 6
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { grid: { color: gridColor }, ticks: { color: textColor } },
              y: { grid: { color: gridColor }, ticks: { color: textColor } }
            },
            plugins: { legend: { labels: { color: textColor } } }
          }
        });
      }
    } catch (e) {
      console.warn('Financial chart error:', e);
    }

    // 3. Bed Distribution Doughnut
    try {
      const bedCanvas = document.getElementById('bedDistributionChart');
      if (bedCanvas && statsData) {
        const occ = Number(statsData.occupiedBeds || 0);
        const avail = Number(statsData.availableBeds || 0);
        const maint = Number(statsData.maintenanceBeds || 0);

        this.charts.bed = new Chart(bedCanvas.getContext('2d'), {
          type: 'doughnut',
          data: {
            labels: [`Occupied (${occ})`, `Available (${avail})`, `Maintenance (${maint})`],
            datasets: [{
              data: [occ, avail, maint],
              backgroundColor: ['#dc2626', '#16a34a', '#f97316'],
              borderWidth: 2,
              borderColor: isDark ? '#131c2e' : '#ffffff'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: { legend: { position: 'bottom', labels: { color: textColor } } }
          }
        });
      }
    } catch (e) {
      console.warn('Bed distribution chart error:', e);
    }

    // 4. Expense Breakdown Doughnut/Polar
    try {
      const expCanvas = document.getElementById('expenseCategoryChart');
      if (expCanvas) {
        const cats = chartData.categoryExpenses || [];
        if (cats.length === 0) {
          this.charts.expense = new Chart(expCanvas.getContext('2d'), {
            type: 'doughnut',
            data: {
              labels: ['No Expenses Recorded'],
              datasets: [{
                data: [1],
                backgroundColor: [isDark ? '#334155' : '#e2e8f0'],
                borderWidth: 2,
                borderColor: isDark ? '#131c2e' : '#ffffff'
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              cutout: '70%',
              plugins: {
                legend: { position: 'bottom', labels: { color: textColor } },
                tooltip: { enabled: false }
              }
            }
          });
        } else {
          this.charts.expense = new Chart(expCanvas.getContext('2d'), {
            type: 'pie',
            data: {
              labels: cats.map(c => c.category),
              datasets: [{
                data: cats.map(c => Number(c.total_amount)),
                backgroundColor: [
                  '#dc2626', '#2563eb', '#16a34a', '#f59e0b',
                  '#9333ea', '#06b6d4', '#ea580c', '#64748b'
                ],
                borderWidth: 2,
                borderColor: isDark ? '#131c2e' : '#ffffff'
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'right', labels: { color: textColor } } }
            }
          });
        }
      }
    } catch (e) {
      console.warn('Expense category chart error:', e);
    }
  },

  renderRecentActivities(data) {
    // Recent Payments
    const payContainer = document.getElementById('recent-payments-container');
    if (payContainer && data.recentPayments) {
      if (data.recentPayments.length === 0) {
        payContainer.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">No payments recorded yet.</p>';
      } else {
        payContainer.innerHTML = `
          <div class="table-container" style="border:none;">
            <table class="data-table" style="font-size:0.82rem;">
              <tbody>
                ${data.recentPayments.map(p => `
                  <tr>
                    <td>
                      <div style="font-weight:700;color:var(--text-primary);">${Utils.escapeHTML(p.student_name)}</div>
                      <div style="color:var(--text-muted);font-size:0.75rem;">${p.reg_number} • Rm ${p.room_number || '-'}</div>
                    </td>
                    <td><span class="badge badge-info">${p.receipt_number}</span></td>
                    <td style="font-weight:700;color:var(--status-success);">${Utils.formatINR(p.amount)}</td>
                    <td>
                      <div style="display:flex;gap:0.35rem;align-items:center;">
                        <button class="btn btn-sm btn-secondary" onclick="ReceiptModal.open(${p.id})" title="View Receipt">
                          <i data-lucide="eye" style="width:14px;height:14px;"></i>
                        </button>
                        <button class="btn btn-sm" style="background:#25d366;color:#ffffff;border:none;padding:0.3rem 0.5rem;" onclick="ReceiptModal.sendWhatsApp(${p.id}, 'student')" title="Send PDF Receipt to Student on WhatsApp (+91 ${p.student_phone || ''})">
                          <i data-lucide="message-circle" style="width:14px;height:14px;"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
    }

    // Recent Complaints
    const compContainer = document.getElementById('recent-complaints-container');
    if (compContainer && data.recentComplaints) {
      if (data.recentComplaints.length === 0) {
        compContainer.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">No active complaints.</p>';
      } else {
        compContainer.innerHTML = `
          <div class="table-container" style="border:none;">
            <table class="data-table" style="font-size:0.82rem;">
              <tbody>
                ${data.recentComplaints.map(c => `
                  <tr>
                    <td>
                      <div style="font-weight:700;color:var(--text-primary);">${Utils.escapeHTML(c.title)}</div>
                      <div style="color:var(--text-muted);font-size:0.75rem;">${Utils.escapeHTML(c.student_name)} • Rm ${c.room_number || '-'}</div>
                    </td>
                    <td><span class="badge badge-info">${c.category}</span></td>
                    <td>
                      <span class="badge ${c.status === 'Resolved' ? 'badge-success' : c.status === 'In Progress' ? 'badge-warning' : 'badge-danger'}">
                        ${c.status}
                      </span>
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
};

window.AdminDashboard = AdminDashboard;
