/**
 * Reports & Analytics Page Component
 * Renders all 9 official reports with filters, date ranges, print view, CSV and jsPDF export
 */
const ReportsPage = {
  currentReportType: 'students',
  currentReportData: null,

  async render() {
    return `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Audits, Reports & Financial Analytics</h1>
          <p>Official institutional summaries for administration, compliance, and accounting</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="ReportsPage.printReport()">
            <i data-lucide="printer"></i>
            <span>Print Report</span>
          </button>
          <button class="btn btn-secondary" onclick="ReportsPage.exportCSV()">
            <i data-lucide="file-spreadsheet"></i>
            <span>Export CSV</span>
          </button>
          <button class="btn btn-primary" onclick="ReportsPage.exportPDF()">
            <i data-lucide="download"></i>
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      <!-- Report Type Selector Grid -->
      <div class="card" style="margin-bottom:1.5rem;padding:1.25rem;">
        <label class="form-label" style="margin-bottom:0.75rem;font-weight:700;">Select Report Category</label>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(210px, 1fr));gap:0.75rem;" id="report-type-selector">
          <button class="btn btn-secondary active" onclick="ReportsPage.selectReport('students', this)">
            <i data-lucide="users" style="width:16px;height:16px;"></i> 1. Student Directory
          </button>
          <button class="btn btn-secondary" onclick="ReportsPage.selectReport('rooms', this)">
            <i data-lucide="door-closed" style="width:16px;height:16px;"></i> 2. Room Capacity
          </button>
          <button class="btn btn-secondary" onclick="ReportsPage.selectReport('occupancy', this)">
            <i data-lucide="bed" style="width:16px;height:16px;"></i> 3. Bed Occupancy
          </button>
          <button class="btn btn-secondary" onclick="ReportsPage.selectReport('collections', this)">
            <i data-lucide="receipt" style="width:16px;height:16px;"></i> 4. Fee Collections
          </button>
          <button class="btn btn-secondary" onclick="ReportsPage.selectReport('pending-fees', this)">
            <i data-lucide="clock" style="width:16px;height:16px;"></i> 5. Pending Fees
          </button>
          <button class="btn btn-secondary" onclick="ReportsPage.selectReport('expenses', this)">
            <i data-lucide="credit-card" style="width:16px;height:16px;"></i> 6. Expense Ledger
          </button>
          <button class="btn btn-secondary" onclick="ReportsPage.selectReport('income', this)">
            <i data-lucide="wallet" style="width:16px;height:16px;"></i> 7. Financial P&L
          </button>
          <button class="btn btn-secondary" onclick="ReportsPage.selectReport('complaints', this)">
            <i data-lucide="alert-triangle" style="width:16px;height:16px;"></i> 8. Complaints Audit
          </button>
          <button class="btn btn-secondary" onclick="ReportsPage.selectReport('visitors', this)">
            <i data-lucide="user-check" style="width:16px;height:16px;"></i> 9. Visitor Gate Log
          </button>
        </div>
      </div>

      <!-- Report Container with Printable Document Wrapper -->
      <div class="card" id="report-display-card" style="padding:1.75rem;">
        <!-- Header Strip for Printable Document -->
        <div id="report-printable-area">
          <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid var(--primary-red);padding-bottom:1rem;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem;">
            <div style="display:flex;align-items:center;gap:1rem;">
              <img src="./assets/images/college-logo.svg" alt="College Logo" style="height:48px;width:auto;" />
              <div>
                <h2 style="font-size:1.25rem;font-weight:800;color:var(--text-primary);letter-spacing:-0.4px;" id="report-main-title">
                  Student Directory Report
                </h2>
                <div style="font-size:0.78rem;color:var(--text-muted);">PG Hostel Institutional Residency Management</div>
              </div>
            </div>
            <div style="text-align:right;">
              <span class="badge badge-info" id="report-generated-timestamp">Generated on: ${Utils.formatDate(Utils.getTodayISO())}</span>
              <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">Official Document</div>
            </div>
          </div>

          <!-- Summary KPI Strip -->
          <div id="report-summary-strip" style="display:flex;gap:1.5rem;margin-bottom:1.5rem;background:var(--bg-secondary);padding:1rem 1.25rem;border-radius:var(--radius-md);flex-wrap:wrap;">
            <!-- Rendered dynamically -->
          </div>

          <!-- Dynamic Data Table -->
          <div class="table-container" style="border:none;">
            <table class="data-table" id="report-data-table" style="font-size:0.85rem;">
              <thead id="report-table-head"></thead>
              <tbody id="report-table-body">
                <tr><td style="text-align:center;padding:2rem;color:var(--text-muted);">Generating report...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  async afterRender() {
    await this.loadReport('students');
  },

  selectReport(type, btn) {
    this.currentReportType = type;
    if (btn && btn.parentElement) {
      btn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
    this.loadReport(type);
  },

  async loadReport(type) {
    try {
      const tbody = document.getElementById('report-table-body');
      if (tbody) {
        tbody.innerHTML = '<tr><td style="text-align:center;padding:2rem;color:var(--text-muted);">Querying database records...</td></tr>';
      }

      const res = await API.get(`/reports/${type}`);
      if (res.success && res.data) {
        this.currentReportData = res.data;
        this.renderReportContent(res.data);
      }
    } catch (e) {
      Toast.error('Failed to load report: ' + e.message);
    }
  },

  renderReportContent(data) {
    const titleEl = document.getElementById('report-main-title');
    const summaryStrip = document.getElementById('report-summary-strip');
    const thead = document.getElementById('report-table-head');
    const tbody = document.getElementById('report-table-body');

    if (titleEl) titleEl.innerText = data.title;

    // Render Summary Badges
    if (summaryStrip && data.summary) {
      summaryStrip.innerHTML = Object.entries(data.summary).map(([k, v]) => `
        <div>
          <span style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;font-weight:700;">${k}</span>
          <div style="font-size:1.15rem;font-weight:800;color:var(--primary-red);">${v}</div>
        </div>
      `).join('');
    }

    // Render Table Head
    if (thead) {
      thead.innerHTML = `
        <tr>
          ${data.columns.map(col => `<th>${col}</th>`).join('')}
        </tr>
      `;
    }

    // Render Table Body
    if (tbody) {
      if (data.rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${data.columns.length}" style="text-align:center;padding:2rem;color:var(--text-muted);">No records found for this report.</td></tr>`;
      } else {
        tbody.innerHTML = data.rows.map(row => `
          <tr>
            ${row.map(cell => `<td>${cell !== null && cell !== undefined ? cell : '-'}</td>`).join('')}
          </tr>
        `).join('');
      }
    }

    Utils.renderIcons();
  },

  printReport() {
    const area = document.getElementById('report-printable-area');
    if (!area) return;

    const w = window.open('', '_blank');
    w.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${this.currentReportData ? this.currentReportData.title : 'Hostel Report'}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 25px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #e2e8f0; padding: 8px 12px; font-size: 12px; text-align: left; }
            th { background: #f1f5f9; font-weight: bold; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${area.innerHTML}
        </body>
      </html>
    `);
    w.document.close();
  },

  exportCSV() {
    if (!this.currentReportData) return;
    const { title, columns, rows } = this.currentReportData;
    const filename = title.replace(/[^a-zA-Z0-9]/g, '_');
    Utils.exportToCSV(filename, columns, rows);
    Toast.success(`Report exported as ${filename}.csv`);
  },

  exportPDF() {
    if (!this.currentReportData) return;
    const { title, columns, rows } = this.currentReportData;

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      // Header Banner
      doc.setFillColor(220, 38, 38);
      doc.rect(0, 0, 297, 16, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('PG HOSTEL MANAGEMENT SYSTEM — OFFICIAL AUDIT REPORT', 148, 11, { align: 'center' });

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(16);
      doc.text(title.toUpperCase(), 14, 28);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated Date: ${Utils.formatDate(Utils.getTodayISO())} | Total Records: ${rows.length}`, 14, 34);

      // AutoTable
      doc.autoTable({
        startY: 38,
        head: [columns],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3 }
      });

      const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      doc.save(filename);
      Toast.success(`Report downloaded as ${filename}`);
    } catch (e) {
      Toast.error('PDF export error: ' + e.message);
    }
  }
};

window.ReportsPage = ReportsPage;
