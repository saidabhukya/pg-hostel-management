/**
 * Receipt Modal & PDF Generator Component
 * Provides instant printable invoice view, client-side jsPDF receipt download,
 * and direct WhatsApp sharing with PDF file and official verification link.
 */
const ReceiptModal = {
  currentReceipt: null,

  async open(paymentId, options = {}) {
    try {
      let p = null;
      if (typeof paymentId === 'object' && paymentId !== null) {
        p = paymentId;
      } else {
        try {
          const res = await API.get(`/payments/${paymentId}`);
          if (res && res.success) {
            p = res.data;
          }
        } catch (apiErr) {
          console.warn('[ReceiptModal] Online receipt fetch failed, using local dataset');
        }
        if (!p && typeof MockData !== 'undefined' && typeof MockData.getPaymentDetails === 'function') {
          p = MockData.getPaymentDetails(paymentId);
        }
        if (!p) {
          Toast.error('Receipt record not found.');
          return;
        }
      }

      this.currentReceipt = p;
      const justPaid = !!options.justPaid;

      const receiptHtml = `
        <!-- WhatsApp PDF Receipt Action Banner -->
        <div style="background:#ecfdf5;border:1px solid #10b981;border-radius:10px;padding:0.9rem 1.15rem;margin-bottom:1.5rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;box-shadow:0 2px 6px rgba(16, 185, 129, 0.12);">
          <div style="display:flex;align-items:center;gap:0.75rem;">
            <div style="background:#10b981;color:#ffffff;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <i data-lucide="${justPaid ? 'check-circle-2' : 'message-circle'}" style="width:20px;height:20px;"></i>
            </div>
            <div>
              <strong style="color:#065f46;font-size:0.94rem;">${justPaid ? 'Payment Successfully Recorded!' : 'Official PDF Fee Receipt Ready'}</strong>
              <div style="color:#047857;font-size:0.82rem;margin-top:2px;">
                Send official PDF receipt to Student's WhatsApp (<strong>+91 ${p.student_phone || p.phone || p.studentPhone || ''}</strong>)
              </div>
            </div>
          </div>
          <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">
            <button class="btn btn-sm" style="background:#25d366;color:#ffffff;font-weight:700;display:inline-flex;align-items:center;gap:0.4rem;border:none;box-shadow:0 2px 5px rgba(37,211,102,0.3);padding:0.5rem 0.9rem;border-radius:6px;cursor:pointer;" onclick="ReceiptModal.sendWhatsApp(${p.id}, 'student', event)" title="Share PDF receipt directly to Student WhatsApp">
              <i data-lucide="message-circle" style="width:16px;height:16px;"></i>
              <span>Send PDF to Student WhatsApp</span>
            </button>
            <button class="btn btn-sm btn-primary" style="display:inline-flex;align-items:center;gap:0.4rem;padding:0.5rem 0.9rem;border-radius:6px;cursor:pointer;" onclick="ReceiptModal.downloadPDF()" title="Download Official PDF Receipt">
              <i data-lucide="download" style="width:15px;height:15px;"></i>
              <span>Download PDF</span>
            </button>
            ${(p.parent_phone || p.parentPhone) ? `
              <button class="btn btn-sm btn-secondary" style="font-size:0.8rem;padding:0.45rem 0.75rem;" onclick="ReceiptModal.sendWhatsApp(${p.id}, 'parent', event)" title="Send PDF receipt to Parent (+91 ${p.parent_phone || p.parentPhone})">
                <i data-lucide="users" style="width:14px;height:14px;"></i>
                <span>WhatsApp Parent</span>
              </button>
            ` : ''}
          </div>
        </div>

        <div id="printable-receipt" style="background:#ffffff;color:#0f172a;padding:2rem;border-radius:var(--radius-lg);border:1px solid #e2e8f0;box-shadow:0 4px 12px rgba(0,0,0,0.05);position:relative;">
          <!-- Watermark / Seal Accent -->
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%, -50%) rotate(-25deg);font-size:5rem;font-weight:900;color:rgba(220, 38, 38, 0.05);pointer-events:none;user-select:none;border:4px dashed rgba(220, 38, 38, 0.08);padding:1rem 2rem;border-radius:12px;">
            PAID
          </div>

          <!-- Receipt Header: College Logo & Brand Info -->
          <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #dc2626;padding-bottom:1.25rem;margin-bottom:1.5rem;">
            <div style="display:flex;align-items:center;gap:1rem;">
              <img src="./assets/images/college-logo.svg" alt="College Crest" style="height:55px;width:auto;object-fit:contain;" />
              <div>
                <h3 style="font-size:1.15rem;font-weight:800;color:#0f172a;letter-spacing:-0.3px;margin:0;">SRI RAM PG</h3>
                <p style="font-size:0.75rem;color:#64748b;margin:2px 0 0;">Student Housing & Residency</p>
                <p style="font-size:0.7rem;color:#94a3b8;margin:0;">${(typeof MockData !== 'undefined' && MockData.settings && MockData.settings.hostel_address) || 'OPP. VIGNAN UNIVERSITY'}</p>
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;color:#dc2626;letter-spacing:1px;">OFFICIAL RECEIPT</div>
              <div style="font-size:1.1rem;font-weight:800;font-family:var(--font-mono);color:#0f172a;">${p.receipt_number}</div>
              <div style="font-size:0.78rem;color:#64748b;margin-top:2px;">Paid: <strong style="color:#0f172a;">${p.paymentDateDisplay || p.payment_date}</strong></div>
            </div>
          </div>

          <!-- Resident & Allocation Info Grid -->
          <div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:1rem;background:#f8fafc;padding:1rem;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:1.5rem;font-size:0.84rem;">
            <div>
              <div style="color:#64748b;font-size:0.7rem;text-transform:uppercase;font-weight:700;letter-spacing:0.5px;">RESIDENT STUDENT</div>
              <div style="font-size:1.05rem;font-weight:800;color:#0f172a;margin-top:2px;">${Utils.escapeHTML(p.student_name)}</div>
              <div style="color:#475569;margin-top:3px;font-size:0.82rem;">Reg No: <strong style="color:#0f172a;">${p.reg_number}</strong></div>
              <div style="color:#64748b;font-size:0.8rem;margin-top:2px;">${Utils.escapeHTML(p.course || '')} (${p.year || ''})</div>
              <div style="color:#475569;font-size:0.82rem;margin-top:2px;">WhatsApp: <strong style="color:#0f172a;">+91 ${p.student_phone || p.phone || '-'}</strong></div>
            </div>
            <div style="text-align:right;">
              <div style="color:#64748b;font-size:0.7rem;text-transform:uppercase;font-weight:700;letter-spacing:0.5px;">ALLOCATED ROOM & BED</div>
              <div style="font-size:1.05rem;font-weight:800;color:#dc2626;margin-top:2px;">Room ${p.room_number || '-'} • Bed-${p.bed_label || '-'}</div>
              <div style="color:#475569;margin-top:3px;font-size:0.82rem;">Floor: Floor ${p.floor_number || '-'}</div>
              <div style="color:#64748b;font-size:0.8rem;margin-top:2px;">Parent: ${Utils.escapeHTML(p.parent_name || '-')}</div>
              <div style="color:#64748b;font-size:0.8rem;margin-top:2px;">Parent Ph: ${p.parent_phone ? p.parent_phone : '-'}</div>
            </div>
          </div>

          <!-- Fee Breakdown Table -->
          <table style="width:100%;border-collapse:collapse;margin-bottom:1.5rem;font-size:0.88rem;">
            <thead>
              <tr style="background:#f1f5f9;border-bottom:2px solid #cbd5e1;color:#475569;text-align:left;">
                <th style="padding:0.6rem 0.8rem;">Description</th>
                <th style="padding:0.6rem 0.8rem;">Billing Cycle Period</th>
                <th style="padding:0.6rem 0.8rem;text-align:right;">Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:0.8rem;">
                  <strong style="color:#0f172a;">Monthly Hostel Room Charges</strong>
                  <div style="font-size:0.75rem;color:#64748b;">Includes accommodation, electricity, Wi-Fi & mess amenities</div>
                </td>
                <td style="padding:0.8rem;color:#475569;">
                  ${p.cycleStartDisplay || p.cycle_start_date} → ${p.cycleEndDisplay || p.cycle_end_date}
                </td>
                <td style="padding:0.8rem;text-align:right;font-weight:700;color:#0f172a;">
                  ${Utils.formatINR(p.amount)}
                </td>
              </tr>
              <tr style="background:#f8fafc;font-weight:800;">
                <td colspan="2" style="padding:0.8rem;text-align:right;color:#0f172a;">TOTAL AMOUNT RECEIVED:</td>
                <td style="padding:0.8rem;text-align:right;color:#dc2626;font-size:1.05rem;">
                  ${Utils.formatINR(p.amount)}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Transaction Mode & Next Due Notice -->
          <div style="display:flex;align-items:center;justify-content:space-between;padding:0.85rem 1rem;background:#fef2f2;border:1px dashed #fca5a5;border-radius:8px;margin-bottom:1.5rem;font-size:0.82rem;">
            <div>
              <span style="color:#991b1b;font-weight:700;">Payment Mode:</span> ${p.payment_method}
              ${p.transaction_id ? ` • <span style="font-family:var(--font-mono);color:#991b1b;">Txn ID: ${p.transaction_id}</span>` : ''}
            </div>
            <div style="color:#991b1b;font-weight:700;">
              Next Billing Due: <strong>${p.nextDueDateDisplay || '15-11-2026'}</strong>
            </div>
          </div>

          <!-- Signature & Official Green PAID Stamp Section -->
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:2rem;padding-top:1.25rem;border-top:1px solid #e2e8f0;font-size:0.75rem;color:#64748b;gap:1rem;flex-wrap:wrap;">
            <div style="flex:1;min-width:180px;">
              <p style="margin:0 0 3px 0;">1. Computer-generated official digital receipt; verified by Accounts.</p>
              <p style="margin:0 0 3px 0;">2. Keep this receipt safely for semester-end residency clearance.</p>
              <p style="margin:4px 0 0 0;">Received by: <strong style="color:#0f172a;">${p.recorded_by_name || 'Accounts Desk'}</strong></p>
            </div>

            <!-- Green Official PAID Stamp -->
            <div style="display:flex;align-items:center;justify-content:center;transform:rotate(-7deg);margin:0.25rem 0.5rem;">
              <div style="border:2.5px solid #16a34a;border-radius:10px;padding:6px 14px;background:#f0fdf4;box-shadow:0 0 0 2px rgba(22,163,74,0.2) inset;text-align:center;min-width:130px;">
                <div style="font-size:0.6rem;font-weight:800;letter-spacing:1px;color:#15803d;text-transform:uppercase;">SRI RAM PG HOSTEL</div>
                <div style="font-size:1.35rem;font-weight:900;letter-spacing:3px;color:#16a34a;line-height:1.15;margin:1px 0;">PAID</div>
                <div style="font-size:0.58rem;font-weight:700;letter-spacing:0.8px;color:#15803d;border-top:1px dashed #86efac;padding-top:2px;">OFFICIAL ACCOUNTS SEAL</div>
              </div>
            </div>

            <!-- Authorized Signature of Saida -->
            <div style="text-align:center;min-width:170px;">
              <div style="height:52px;display:flex;align-items:flex-end;justify-content:center;margin-bottom:3px;">
                <img src="${(typeof window !== 'undefined' && window.WARDEN_SIGNATURE_DATA) ? window.WARDEN_SIGNATURE_DATA : './assets/images/signature.png'}" 
                     alt="Chief Warden Signature" 
                     style="max-height:50px;max-width:145px;object-fit:contain;display:block;" />
              </div>
              <div style="border-bottom:1.5px solid #0f172a;width:160px;margin:0 auto 0.25rem auto;"></div>
              <strong style="color:#0f172a;font-size:0.8rem;">Chief Hostel Warden</strong><br/>
              <span style="color:#64748b;font-size:0.7rem;">Authorized Signature & Seal</span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display:flex;justify-content:flex-end;gap:0.75rem;margin-top:1.5rem;flex-wrap:wrap;">
          <button class="btn btn-secondary" onclick="Modal.close()">Close</button>
          
          <button class="btn" style="background:#25d366;color:#ffffff;font-weight:700;display:inline-flex;align-items:center;gap:0.4rem;border:none;box-shadow:0 2px 4px rgba(37,211,102,0.25);" onclick="ReceiptModal.sendWhatsApp(${p.id}, 'student', event)" title="Send PDF receipt to Student on WhatsApp (+91 ${p.student_phone || ''})">
            <i data-lucide="message-circle" style="width:16px;height:16px;"></i>
            <span>Send Student WhatsApp</span>
          </button>

          ${p.parent_phone ? `
            <button class="btn btn-secondary" onclick="ReceiptModal.sendWhatsApp(${p.id}, 'parent', event)" title="Send PDF receipt to Parent (+91 ${p.parent_phone})">
              <i data-lucide="users" style="width:16px;height:16px;"></i>
              <span>WhatsApp Parent</span>
            </button>
          ` : ''}

          <button class="btn btn-secondary" onclick="ReceiptModal.printReceipt()">
            <i data-lucide="printer" style="width:16px;height:16px;"></i>
            <span>Print</span>
          </button>
          <button class="btn btn-primary" onclick="ReceiptModal.downloadPDF()">
            <i data-lucide="download" style="width:16px;height:16px;"></i>
            <span>Download PDF</span>
          </button>
        </div>
      `;

      Modal.open({
        title: `Official Receipt — ${p.receipt_number}`,
        content: receiptHtml,
        maxWidth: '740px'
      });
      Utils.renderIcons();
    } catch (e) {
      Toast.error('Failed to open receipt: ' + e.message);
    }
  },

  printReceipt() {
    const printArea = document.getElementById('printable-receipt');
    if (!printArea) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Hostel Fee Receipt - ${this.currentReceipt ? this.currentReceipt.receipt_number : 'Print'}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; color: #0f172a; }
            * { box-sizing: border-box; }
            table { width: 100%; border-collapse: collapse; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${printArea.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
  },

  renderPrintableReceiptHtml(p) {
    return `
      <div id="printable-receipt" style="background:#ffffff;color:#0f172a;padding:2rem;border-radius:12px;border:1px solid #e2e8f0;box-shadow:0 4px 12px rgba(0,0,0,0.05);position:relative;font-family:'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <!-- Watermark -->
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%, -50%) rotate(-25deg);font-size:5rem;font-weight:900;color:rgba(220, 38, 38, 0.05);pointer-events:none;user-select:none;border:4px dashed rgba(220, 38, 38, 0.08);padding:1rem 2rem;border-radius:12px;">
          PAID
        </div>

        <!-- Receipt Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #dc2626;padding-bottom:1.25rem;margin-bottom:1.5rem;">
          <div style="display:flex;align-items:center;gap:1rem;">
            <img src="./assets/images/college-logo.svg" alt="College Crest" style="height:55px;width:auto;object-fit:contain;" />
            <div>
              <h3 style="font-size:1.15rem;font-weight:800;color:#0f172a;letter-spacing:-0.3px;margin:0;">SRI RAM PG</h3>
              <p style="font-size:0.75rem;color:#64748b;margin:2px 0 0;">Student Housing & Residency</p>
              <p style="font-size:0.7rem;color:#94a3b8;margin:0;">OPP. VIGNAN UNIVERSITY, VADLAMUDI</p>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;color:#dc2626;letter-spacing:1px;">OFFICIAL RECEIPT</div>
            <div style="font-size:1.1rem;font-weight:800;font-family:monospace;color:#0f172a;">${p.receipt_number}</div>
            <div style="font-size:0.78rem;color:#64748b;margin-top:2px;">Paid: <strong style="color:#0f172a;">${p.paymentDateDisplay || p.payment_date}</strong></div>
          </div>
        </div>

        <!-- Resident & Allocation Info Grid -->
        <div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:1rem;background:#f8fafc;padding:1rem;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:1.5rem;font-size:0.84rem;">
          <div>
            <div style="color:#64748b;font-size:0.7rem;text-transform:uppercase;font-weight:700;letter-spacing:0.5px;">RESIDENT STUDENT</div>
            <div style="font-size:1.05rem;font-weight:800;color:#0f172a;margin-top:2px;">${Utils.escapeHTML(p.student_name)}</div>
            <div style="color:#475569;margin-top:3px;font-size:0.82rem;">Reg No: <strong style="color:#0f172a;">${p.reg_number}</strong></div>
            <div style="color:#64748b;font-size:0.8rem;margin-top:2px;">${Utils.escapeHTML(p.course || '')} (${p.year || ''})</div>
            <div style="color:#475569;font-size:0.82rem;margin-top:2px;">WhatsApp: <strong style="color:#0f172a;">+91 ${p.student_phone || p.phone || '-'}</strong></div>
          </div>
          <div style="text-align:right;">
            <div style="color:#64748b;font-size:0.7rem;text-transform:uppercase;font-weight:700;letter-spacing:0.5px;">ALLOCATED ROOM & BED</div>
            <div style="font-size:1.05rem;font-weight:800;color:#dc2626;margin-top:2px;">Room ${p.room_number || '-'} • Bed-${p.bed_label || '-'}</div>
            <div style="color:#475569;margin-top:3px;font-size:0.82rem;">Floor: Floor ${p.floor_number || '-'}</div>
            <div style="color:#64748b;font-size:0.8rem;margin-top:2px;">Parent: ${Utils.escapeHTML(p.parent_name || '-')}</div>
            <div style="color:#64748b;font-size:0.8rem;margin-top:2px;">Parent Ph: ${p.parent_phone ? p.parent_phone : '-'}</div>
          </div>
        </div>

        <!-- Fee Breakdown Table -->
        <table style="width:100%;border-collapse:collapse;margin-bottom:1.5rem;font-size:0.88rem;">
          <thead>
            <tr style="background:#f1f5f9;border-bottom:2px solid #cbd5e1;color:#475569;text-align:left;">
              <th style="padding:0.6rem 0.8rem;">Description</th>
              <th style="padding:0.6rem 0.8rem;">Billing Cycle Period</th>
              <th style="padding:0.6rem 0.8rem;text-align:right;">Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom:1px solid #e2e8f0;">
              <td style="padding:0.8rem;">
                <strong style="color:#0f172a;">Monthly Hostel Room Charges</strong>
                <div style="font-size:0.75rem;color:#64748b;">Includes accommodation, electricity, Wi-Fi & mess amenities</div>
              </td>
              <td style="padding:0.8rem;color:#475569;">
                ${p.cycleStartDisplay || p.cycle_start_date} → ${p.cycleEndDisplay || p.cycle_end_date}
              </td>
              <td style="padding:0.8rem;text-align:right;font-weight:700;color:#0f172a;">
                ${Utils.formatINR(p.amount)}
              </td>
            </tr>
            <tr style="background:#f8fafc;font-weight:800;">
              <td colspan="2" style="padding:0.8rem;text-align:right;color:#0f172a;">TOTAL AMOUNT RECEIVED:</td>
              <td style="padding:0.8rem;text-align:right;color:#dc2626;font-size:1.05rem;">
                ${Utils.formatINR(p.amount)}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Transaction Mode & Next Due Notice -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding:0.85rem 1rem;background:#fef2f2;border:1px dashed #fca5a5;border-radius:8px;margin-bottom:1.5rem;font-size:0.82rem;">
          <div>
            <span style="color:#991b1b;font-weight:700;">Payment Mode:</span> ${p.payment_method}
            ${p.transaction_id ? ` • <span style="font-family:monospace;color:#991b1b;">Txn ID: ${p.transaction_id}</span>` : ''}
          </div>
          <div style="color:#991b1b;font-weight:700;">
            Next Billing Due: <strong>${p.nextDueDateDisplay || '15-11-2026'}</strong>
          </div>
        </div>

        <!-- Signature & Official Green PAID Stamp Section -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:2rem;padding-top:1.25rem;border-top:1px solid #e2e8f0;font-size:0.75rem;color:#64748b;gap:1rem;flex-wrap:wrap;">
          <div style="flex:1;min-width:180px;">
            <p style="margin:0 0 3px 0;">1. Computer-generated official digital receipt; verified by Accounts.</p>
            <p style="margin:0 0 3px 0;">2. Keep this receipt safely for semester-end residency clearance.</p>
            <p style="margin:4px 0 0 0;">Received by: <strong style="color:#0f172a;">${p.recorded_by_name || 'Accounts Desk'}</strong></p>
          </div>

          <!-- Green Official PAID Stamp -->
          <div style="display:flex;align-items:center;justify-content:center;transform:rotate(-7deg);margin:0.25rem 0.5rem;">
            <div style="border:2.5px solid #16a34a;border-radius:10px;padding:6px 14px;background:#f0fdf4;box-shadow:0 0 0 2px rgba(22,163,74,0.2) inset;text-align:center;min-width:130px;">
              <div style="font-size:0.6rem;font-weight:800;letter-spacing:1px;color:#15803d;text-transform:uppercase;">SRI RAM PG HOSTEL</div>
              <div style="font-size:1.35rem;font-weight:900;letter-spacing:3px;color:#16a34a;line-height:1.15;margin:1px 0;">PAID</div>
              <div style="font-size:0.58rem;font-weight:700;letter-spacing:0.8px;color:#15803d;border-top:1px dashed #86efac;padding-top:2px;">OFFICIAL ACCOUNTS SEAL</div>
            </div>
          </div>

          <!-- Authorized Signature of Saida -->
          <div style="text-align:center;min-width:170px;">
            <div style="height:52px;display:flex;align-items:flex-end;justify-content:center;margin-bottom:3px;">
              <img src="${(typeof window !== 'undefined' && window.WARDEN_SIGNATURE_DATA) ? window.WARDEN_SIGNATURE_DATA : './assets/images/signature.png'}" 
                   alt="Chief Warden Signature" 
                   style="max-height:50px;max-width:145px;object-fit:contain;display:block;" />
            </div>
            <div style="border-bottom:1.5px solid #0f172a;width:160px;margin:0 auto 0.25rem auto;"></div>
            <strong style="color:#0f172a;font-size:0.8rem;">Chief Hostel Warden</strong><br/>
            <span style="color:#64748b;font-size:0.7rem;">Authorized Signature & Seal</span>
          </div>
        </div>
      </div>
    `;
  },

  async generatePDFDoc(receiptData = null) {
    const p = receiptData || this.currentReceipt;
    if (!p) throw new Error('Receipt record not found.');

    const jsPDFClass = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (!jsPDFClass) throw new Error('jsPDF engine not available.');

    // 1. Try high-definition html2canvas render of #printable-receipt for 100% exact visual reproduction
    let el = document.getElementById('printable-receipt');
    let tempWrapper = null;

    if (!el && typeof document !== 'undefined') {
      tempWrapper = document.createElement('div');
      tempWrapper.style.cssText = 'position:fixed;left:-9999px;top:0;width:760px;background:#ffffff;z-index:-9999;';
      tempWrapper.innerHTML = this.renderPrintableReceiptHtml(p);
      document.body.appendChild(tempWrapper);
      el = tempWrapper.querySelector('#printable-receipt');
    }

    if (window.html2canvas && el) {
      try {
        // Clone into a standardized 760px width container to guarantee consistent layout on mobile & desktop
        const clone = el.cloneNode(true);
        const renderContainer = document.createElement('div');
        renderContainer.style.cssText = 'position:fixed;left:-9999px;top:0;width:760px;background:#ffffff;padding:0;margin:0;z-index:-9999;font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';
        clone.style.width = '760px';
        clone.style.maxWidth = '760px';
        clone.style.boxShadow = 'none';
        clone.style.border = 'none';
        clone.style.margin = '0';
        renderContainer.appendChild(clone);
        document.body.appendChild(renderContainer);

        const canvas = await window.html2canvas(clone, {
          scale: 2.5, // 300 DPI crisp output
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: 1000
        });

        renderContainer.remove();
        if (tempWrapper) tempWrapper.remove();

        const doc = new jsPDFClass({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
          compress: true
        });

        const pageWidth = 210;
        const pageMargin = 12;
        const printWidth = pageWidth - (pageMargin * 2); // 186 mm
        const printHeight = (canvas.height * printWidth) / canvas.width;

        doc.addImage(
          canvas.toDataURL('image/png', 1.0),
          'PNG',
          pageMargin,
          12,
          printWidth,
          printHeight,
          undefined,
          'FAST'
        );

        return doc;
      } catch (canvasErr) {
        console.warn('[ReceiptModal] html2canvas render failed, using vector PDF generator:', canvasErr);
        if (tempWrapper) tempWrapper.remove();
      }
    }

    // 2. High-precision vector fallback matching the exact reference layout
    return this.buildVectorPDF(p);
  },

  buildVectorPDF(receiptData = null) {
    const p = receiptData || this.currentReceipt;
    if (!p) return null;

    const jsPDFClass = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (!jsPDFClass) return null;

    const doc = new jsPDFClass({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Clean white A4 page
    // 1. Top Header
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('SRI RAM PG', 28, 19);

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('Student Housing & Residency', 28, 24);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('OPP. VIGNAN UNIVERSITY, VADLAMUDI', 28, 28.5);

    // Official Receipt Right side
    doc.setTextColor(220, 38, 38);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('OFFICIAL RECEIPT', 196, 17, { align: 'right' });

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(`${p.receipt_number || 'REC-OFFICIAL'}`, 196, 23, { align: 'right' });

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Paid: ${p.paymentDateDisplay || p.payment_date || Utils.getTodayISO()}`, 196, 28.5, { align: 'right' });

    // Red separator line
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(0.6);
    doc.line(14, 32, 196, 32);

    // 2. Resident Student & Room Allocation Box
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 37, 182, 38, 2.5, 2.5, 'FD');

    // Left Column
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('RESIDENT STUDENT', 18, 44);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.text(`${p.student_name || 'Resident Student'}`, 18, 50);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Reg No: ${p.reg_number || '-'}`, 18, 56);
    doc.setTextColor(100, 116, 139);
    doc.text(`${p.course || 'B.Tech'} (${p.year || '1st Year'})`, 18, 62);
    doc.setTextColor(71, 85, 105);
    doc.text(`WhatsApp: +91 ${p.student_phone || p.phone || '-'}`, 18, 68);

    // Right Column
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('ALLOCATED ROOM & BED', 192, 44, { align: 'right' });

    doc.setTextColor(220, 38, 38);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.text(`Room ${p.room_number || '-'} • Bed-${p.bed_label || '-'}`, 192, 50, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Floor: Floor ${p.floor_number || '-'}`, 192, 56, { align: 'right' });
    doc.setTextColor(100, 116, 139);
    doc.text(`Parent: ${p.parent_name || '-'}`, 192, 62, { align: 'right' });
    doc.text(`Parent Ph: ${p.parent_phone ? p.parent_phone : '-'}`, 192, 68, { align: 'right' });

    // 3. Fee Breakdown Table
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(241, 245, 249);
    doc.rect(14, 82, 182, 8, 'FD');

    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Description', 18, 87.5);
    doc.text('Billing Cycle Period', 95, 87.5);
    doc.text('Amount (INR)', 192, 87.5, { align: 'right' });

    // Watermark in background
    doc.setTextColor(254, 226, 226);
    doc.setFontSize(36);
    doc.setFont('helvetica', 'bold');
    doc.text('PAID', 105, 112, { align: 'center' });

    // Table Content Line
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 90, 196, 90);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Monthly Hostel Room Charges', 18, 97);

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('Includes accommodation, electricity, Wi-Fi & mess amenities', 18, 102);

    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`${p.cycleStartDisplay || p.cycle_start_date || '-'} → ${p.cycleEndDisplay || p.cycle_end_date || '-'}`, 95, 98);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(`₹${Number(p.amount || 7000).toLocaleString('en-IN')}`, 192, 98, { align: 'right' });

    doc.line(14, 108, 196, 108);

    // Total Row
    doc.setFillColor(248, 250, 252);
    doc.rect(14, 108.5, 182, 10, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('TOTAL AMOUNT RECEIVED:', 140, 115, { align: 'right' });

    doc.setTextColor(220, 38, 38);
    doc.setFontSize(11);
    doc.text(`₹${Number(p.amount || 7000).toLocaleString('en-IN')}`, 192, 115, { align: 'right' });

    doc.line(14, 118.5, 196, 118.5);

    // 4. Payment Mode & Next Due Notice Card
    doc.setDrawColor(254, 165, 165);
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(14, 124, 182, 11, 2, 2, 'FD');

    doc.setTextColor(153, 27, 27);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`Payment Mode: ${p.payment_method || 'UPI / Cash'}${p.transaction_id ? ' • Txn ID: ' + p.transaction_id : ''}`, 18, 131);
    doc.text(`Next Billing Due: ${p.nextDueDateDisplay || p.next_due_date || '15-11-2026'}`, 192, 131, { align: 'right' });

    // 5. Footer: Verification Notes, Green Stamp & Signature
    const finalY = 148;

    // Left Notes
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('1. Computer-generated official digital receipt; verified by Accounts Desk.', 14, finalY + 4);
    doc.text('2. Keep this receipt safely for semester-end residency clearance.', 14, finalY + 9);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('Received by: Accounts Desk', 14, finalY + 14);

    // Center Green Stamp
    const stampX = 98;
    const stampY = finalY;
    const stampW = 46;
    const stampH = 22;

    doc.setDrawColor(22, 163, 74);
    doc.setLineWidth(1.1);
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(stampX, stampY, stampW, stampH, 2.5, 2.5, 'FD');

    doc.setLineWidth(0.35);
    doc.roundedRect(stampX + 1.2, stampY + 1.2, stampW - 2.4, stampH - 2.4, 1.8, 1.8, 'D');

    doc.setTextColor(21, 128, 61);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.text('SRI RAM PG HOSTEL', stampX + (stampW / 2), stampY + 5, { align: 'center' });

    doc.setTextColor(22, 163, 74);
    doc.setFontSize(12);
    doc.text('PAID', stampX + (stampW / 2), stampY + 12.5, { align: 'center' });

    doc.setDrawColor(134, 239, 172);
    doc.setLineWidth(0.3);
    doc.line(stampX + 4, stampY + 15, stampX + stampW - 4, stampY + 15);

    doc.setTextColor(21, 128, 61);
    doc.setFontSize(5.5);
    doc.text('OFFICIAL ACCOUNTS SEAL', stampX + (stampW / 2), stampY + 19, { align: 'center' });

    // Right Signature of Saida
    const sigData = (typeof window !== 'undefined' && window.WARDEN_SIGNATURE_DATA) ? window.WARDEN_SIGNATURE_DATA : null;
    if (sigData) {
      try {
        doc.addImage(sigData, 'PNG', 152, finalY - 4, 38, 18);
      } catch (err) {}
    }

    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.4);
    doc.line(148, finalY + 16, 196, finalY + 16);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Chief Hostel Warden', 172, finalY + 20, { align: 'center' });

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.text('Authorized Signature & Seal', 172, finalY + 24, { align: 'center' });

    return doc;
  },

  // Legacy alias for compatibility
  buildPDFDoc(receiptData = null) {
    return this.buildVectorPDF(receiptData);
  },

  async downloadPDF(receiptData = null) {
    const p = receiptData || this.currentReceipt;
    if (!p) return;

    try {
      Toast.info('Generating official PDF receipt...');
      const doc = await this.generatePDFDoc(p);
      if (!doc) {
        Toast.info('Opening receipt print dialog...');
        this.printReceipt();
        return;
      }

      const filename = `Receipt_${p.receipt_number || 'HOSTEL'}_${(p.student_name || 'STUDENT').replace(/\s+/g, '_')}.pdf`;
      doc.save(filename);
      Toast.success(`Receipt ${p.receipt_number || ''} downloaded as PDF.`);

      // Provide clear option to share through WhatsApp right after downloading
      this.showPostDownloadSharePrompt(p);
    } catch (e) {
      console.warn('PDF direct save failed, falling back to print window:', e);
      Toast.info('Downloading via print dialog (Save as PDF)...');
      this.printReceipt();
    }
  },

  showPostDownloadSharePrompt(p) {
    const existing = document.getElementById('post-download-share-prompt');
    if (existing) {
      existing.style.display = 'flex';
      return;
    }

    const receiptEl = document.getElementById('printable-receipt');
    if (receiptEl && receiptEl.parentElement) {
      const banner = document.createElement('div');
      banner.id = 'post-download-share-prompt';
      banner.style.cssText = 'background:#f0fdf4;border:1.5px solid #22c55e;border-radius:10px;padding:0.9rem 1.15rem;margin-top:1.25rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;box-shadow:0 2px 8px rgba(34, 197, 94, 0.15);';
      banner.innerHTML = `
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <div style="background:#16a34a;color:#ffffff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <i data-lucide="check" style="width:18px;height:18px;"></i>
          </div>
          <div>
            <strong style="color:#15803d;font-size:0.92rem;">Receipt PDF Successfully Downloaded!</strong>
            <div style="color:#166534;font-size:0.8rem;margin-top:2px;">
              Share official payment confirmation to <strong>${p.student_name}</strong> on WhatsApp (+91 ${p.student_phone || p.phone || ''})
            </div>
          </div>
        </div>
        <div style="display:flex;gap:0.5rem;align-items:center;">
          <button class="btn btn-sm" style="background:#25d366;color:#ffffff;font-weight:700;display:inline-flex;align-items:center;gap:0.4rem;border:none;box-shadow:0 2px 4px rgba(37,211,102,0.3);padding:0.55rem 1rem;border-radius:6px;cursor:pointer;" onclick="ReceiptModal.sendWhatsApp(${p.id}, 'student', event)">
            <i data-lucide="message-circle" style="width:16px;height:16px;"></i>
            <span>Share on Student WhatsApp</span>
          </button>
        </div>
      `;
      receiptEl.parentElement.insertBefore(banner, receiptEl.nextSibling);
      if (window.lucide) window.lucide.createIcons();
    }
  },

  formatPhoneForWhatsApp(phone) {
    if (!phone) return '';
    let digits = String(phone).replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('0')) {
      digits = '91' + digits.substring(1);
    } else if (digits.length === 10) {
      digits = '91' + digits; // Standard Indian country code
    }
    return digits;
  },

  getWhatsAppMessage(p, target = 'student') {
    let baseUrl = window.location.href.split('#')[0].split('?')[0];
    if (baseUrl.endsWith('/index.html')) {
      baseUrl = baseUrl.replace(/\/index\.html$/, '');
    } else {
      baseUrl = baseUrl.replace(/\/$/, '');
    }
    const publicUrl = `${baseUrl}/receipt.html?id=${p.id}&receipt=${encodeURIComponent(p.receipt_number || '')}`;
    const amountStr = '₹' + Number(p.amount || 0).toLocaleString('en-IN');
    const recipientGreeting = target === 'parent' ? (p.parent_name || 'Parent / Guardian') : p.student_name;

    return `🧾 *SRI RAM PG - OFFICIAL FEE PAYMENT RECEIPT*
━━━━━━━━━━━━━━━━━━━━━━━━━
Dear *${recipientGreeting}*,

The monthly hostel room fee payment for *${p.student_name}* has been successfully received & verified.

📋 *Payment Summary:*
• *Receipt No:* ${p.receipt_number || 'REC-OFFICIAL'}
• *Amount Paid:* ${amountStr} (${p.payment_method || 'UPI / Cash'})
• *Payment Date:* ${p.paymentDateDisplay || p.payment_date || Utils.getTodayISO()}
• *Student Reg No:* ${p.reg_number || '-'}
• *Room Allocation:* Room ${p.room_number || '-'} • Bed ${p.bed_label || '-'} (Floor ${p.floor_number || '-'})
• *Billing Cycle:* ${p.cycleStartDisplay || p.cycle_start_date || '-'} to ${p.cycleEndDisplay || p.cycle_end_date || '-'}
• *Next Due Date:* ${p.nextDueDateDisplay || '15-11-2026'}
• *Status:* ✅ PAID & VERIFIED

📄 *View & Download Official PDF Receipt:*
${publicUrl}

Thank you,
*SRI RAM PG Management*
Opp. Vignan University, Vadlamudi
━━━━━━━━━━━━━━━━━━━━━━━━━`;
  },

  _isWhatsAppProcessing: false,

  async sendWhatsApp(paymentIdOrData, target = 'student', event = null) {
    if (event && event.stopPropagation) {
      event.stopPropagation();
      if (event.preventDefault) event.preventDefault();
    }

    // Debounce / Concurrency guard: strictly prevent double clicks and duplicate downloads
    if (this._isWhatsAppProcessing) {
      console.warn('[ReceiptModal] WhatsApp share already processing, skipping duplicate call.');
      return;
    }
    this._isWhatsAppProcessing = true;

    // Visual button feedback
    const btn = (event && event.currentTarget) || (event && event.target && typeof event.target.closest === 'function' ? event.target.closest('button') : null);
    if (btn) {
      btn.disabled = true;
    }

    try {
      let p = null;
      if (typeof paymentIdOrData === 'object' && paymentIdOrData !== null) {
        p = paymentIdOrData;
      } else if (this.currentReceipt && Number(this.currentReceipt.id) === Number(paymentIdOrData)) {
        p = this.currentReceipt;
      } else {
        const res = await API.get(`/payments/${paymentIdOrData}`);
        if (!res.success) {
          Toast.error(res.message || 'Could not find payment receipt.');
          return;
        }
        p = res.data;
      }

      // If student phone is missing on receipt, look it up from student record
      if ((!p.student_phone && !p.phone) && (p.student_id || p.reg_number)) {
        const students = (typeof MockData !== 'undefined' && MockData.students) || [];
        const found = students.find(s => 
          (p.student_id && Number(s.id) === Number(p.student_id)) ||
          (p.reg_number && s.reg_number === p.reg_number)
        );
        if (found) {
          p.student_phone = found.phone;
          p.phone = found.phone;
          if (found.parent_phone) p.parent_phone = found.parent_phone;
          if (found.parent_name) p.parent_name = found.parent_name;
        }
      }

      const rawPhone = target === 'parent' 
        ? (p.parent_phone || p.parentPhone || '') 
        : (p.student_phone || p.studentPhone || p.phone || '');
      let cleanPhone = this.formatPhoneForWhatsApp(rawPhone);
      const recipientName = target === 'parent' ? (p.parent_name || 'Parent') : (p.student_name || 'Student');

      // If phone number is not found on record, prompt admin to enter it
      if (!cleanPhone) {
        const entered = prompt(`Enter WhatsApp number for ${recipientName} (10 digits):`);
        if (entered) {
          cleanPhone = this.formatPhoneForWhatsApp(entered);
        }
      }

      const message = this.getWhatsAppMessage(p, target);
      const filename = `Receipt_${p.receipt_number || 'HOSTEL'}_${(p.student_name || 'STUDENT').replace(/\s+/g, '_')}.pdf`;

      // 1. Generate latest PDF
      let pdfFile = null;
      let doc = null;
      try {
        doc = await this.generatePDFDoc(p);
        if (doc) {
          const blob = doc.output('blob');
          pdfFile = new File([blob], filename, { type: 'application/pdf' });
        }
      } catch (pdfErr) {
        console.warn('PDF generation for WhatsApp share error:', pdfErr);
      }

      // 2. Check if device supports direct PDF file sharing (Android Chrome / iOS Safari Web Share)
      if (pdfFile && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          await navigator.share({
            title: `Official Receipt ${p.receipt_number}`,
            text: message,
            files: [pdfFile]
          });
          Toast.success(`Receipt PDF shared successfully via WhatsApp!`);
          return;
        } catch (shareErr) {
          if (shareErr.name === 'AbortError') {
            return; // User dismissed native share sheet
          }
          console.log('Native share failed, proceeding to manual WhatsApp link');
        }
      }

      // 3. Fallback for Desktop browsers:
      // Since WhatsApp Web cannot attach local files automatically via URL,
      // download the PDF file so it is ready on the device, and open WhatsApp.
      if (doc) {
        try {
          doc.save(filename);
          Toast.info(`Receipt PDF downloaded to device. Opening WhatsApp for ${recipientName} — please attach the downloaded PDF in the chat.`);
        } catch (saveErr) {}
      }

      const waUrl = cleanPhone 
        ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`
        : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

      window.open(waUrl, '_blank');

      Toast.success(`Opened WhatsApp chat for ${recipientName} (+91 ${cleanPhone ? cleanPhone.slice(-10) : 'student'})`);
    } catch (e) {
      Toast.error('Failed to prepare WhatsApp message: ' + e.message);
    } finally {
      setTimeout(() => {
        ReceiptModal._isWhatsAppProcessing = false;
        if (btn) btn.disabled = false;
      }, 1500);
    }
  }
};

window.ReceiptModal = ReceiptModal;
