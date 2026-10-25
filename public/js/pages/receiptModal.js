/**
 * Receipt Modal & PDF Generator Component
 * Provides instant printable invoice view and client-side jsPDF receipt download
 */
const ReceiptModal = {
  currentReceipt: null,

  async open(paymentId) {
    try {
      const res = await API.get(`/payments/${paymentId}`);
      if (!res.success) {
        Toast.error(res.message);
        return;
      }

      this.currentReceipt = res.data;
      const p = res.data;

      const receiptHtml = `
        <div id="printable-receipt" style="background:#ffffff;color:#0f172a;padding:2rem;border-radius:var(--radius-lg);border:1px solid #e2e8f0;box-shadow:0 4px 12px rgba(0,0,0,0.05);position:relative;">
          <!-- Watermark / Seal Accent -->
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%, -50%) rotate(-25deg);font-size:5rem;font-weight:900;color:rgba(220, 38, 38, 0.05);pointer-events:none;user-select:none;border:4px dashed rgba(220, 38, 38, 0.08);padding:1rem 2rem;border-radius:12px;">
            PAID
          </div>

          <!-- Receipt Header: College Logo & Brand Info -->
          <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #dc2626;padding-bottom:1.25rem;margin-bottom:1.5rem;">
            <div style="display:flex;align-items:center;gap:1rem;">
              <img src="/assets/images/college-logo.svg" alt="College Crest" style="height:55px;width:auto;object-fit:contain;" />
              <div>
                <h3 style="font-size:1.15rem;font-weight:800;color:#0f172a;letter-spacing:-0.3px;margin:0;">PG HOSTEL MANAGEMENT SYSTEM</h3>
                <p style="font-size:0.75rem;color:#64748b;margin:2px 0 0;">Institutional Student Housing & Residency Office</p>
                <p style="font-size:0.7rem;color:#94a3b8;margin:0;">Knowledge Park III, Institutional Area, Greater Noida, UP - 201306</p>
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;color:#dc2626;letter-spacing:1px;">OFFICIAL RECEIPT</div>
              <div style="font-size:1.1rem;font-weight:800;font-family:var(--font-mono);color:#0f172a;">${p.receipt_number}</div>
              <div style="font-size:0.78rem;color:#64748b;margin-top:2px;">Date: <strong>${p.paymentDateDisplay}</strong></div>
            </div>
          </div>

          <!-- Resident & Allocation Info Grid -->
          <div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:1rem;background:#f8fafc;padding:1rem;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:1.5rem;font-size:0.84rem;">
            <div>
              <div style="color:#64748b;font-size:0.72rem;text-transform:uppercase;font-weight:700;">Resident Student</div>
              <div style="font-size:1rem;font-weight:800;color:#0f172a;">${Utils.escapeHTML(p.student_name)}</div>
              <div style="color:#475569;margin-top:2px;">Reg No: <strong>${p.reg_number}</strong></div>
              <div style="color:#64748b;">${Utils.escapeHTML(p.course || '')} (${p.year || ''})</div>
              <div style="color:#64748b;">Phone: ${p.student_phone}</div>
            </div>
            <div style="text-align:right;">
              <div style="color:#64748b;font-size:0.72rem;text-transform:uppercase;font-weight:700;">Room Allocation</div>
              <div style="font-size:1rem;font-weight:800;color:#dc2626;">Room ${p.room_number || '-'} • ${p.bed_label || '-'}</div>
              <div style="color:#475569;margin-top:2px;">Floor: Floor ${p.floor_number || '-'}</div>
              <div style="color:#64748b;">Parent: ${Utils.escapeHTML(p.parent_name || '')}</div>
              <div style="color:#64748b;">Parent Ph: ${p.parent_phone || '-'}</div>
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
                  <div style="font-size:0.75rem;color:#64748b;">Includes lodging, electricity, Wi-Fi & mess amenities</div>
                </td>
                <td style="padding:0.8rem;color:#475569;">
                  ${p.cycleStartDisplay} → ${p.cycleEndDisplay}
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
          <div style="display:flex;align-items:center;justify-content:space-between;padding:0.85rem;background:#fef2f2;border:1px dashed #fca5a5;border-radius:8px;margin-bottom:1.5rem;font-size:0.82rem;">
            <div>
              <span style="color:#991b1b;font-weight:700;">Payment Mode:</span> ${p.payment_method}
              ${p.transaction_id ? ` • <span style="font-family:var(--font-mono);color:#991b1b;">Txn ID: ${p.transaction_id}</span>` : ''}
            </div>
            <div style="color:#991b1b;font-weight:700;">
              Next Billing Cycle Due: <strong>${p.nextDueDateDisplay || '15-11-2026'}</strong>
            </div>
          </div>

          <!-- Signature & Stamp Section -->
          <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:2rem;padding-top:1rem;border-top:1px solid #e2e8f0;font-size:0.75rem;color:#64748b;">
            <div>
              <p>1. Computer-generated official receipt; physically verified by Accounts.</p>
              <p>2. Keep this receipt safely for semester end residency clearance.</p>
              <p style="margin-top:4px;">Received by: <strong>${p.recorded_by_name || 'Accounts Desk'}</strong></p>
            </div>
            <div style="text-align:center;">
              <div style="border-bottom:1px solid #0f172a;width:160px;margin-bottom:0.25rem;"></div>
              <strong style="color:#0f172a;">Chief Hostel Warden</strong><br/>
              Authorized Signature & Seal
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display:flex;justify-content:flex-end;gap:0.75rem;margin-top:1.5rem;">
          <button class="btn btn-secondary" onclick="Modal.close()">Close</button>
          <button class="btn btn-secondary" onclick="ReceiptModal.printReceipt()">
            <i data-lucide="printer" style="width:16px;height:16px;"></i>
            <span>Print Receipt</span>
          </button>
          <button class="btn btn-primary" onclick="ReceiptModal.downloadPDF()">
            <i data-lucide="download" style="width:16px;height:16px;"></i>
            <span>Download PDF Receipt</span>
          </button>
        </div>
      `;

      Modal.open({
        title: `Official Receipt — ${p.receipt_number}`,
        content: receiptHtml,
        maxWidth: '720px'
      });
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

  downloadPDF() {
    if (!this.currentReceipt) return;
    const p = this.currentReceipt;

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // Header Banner
      doc.setFillColor(220, 38, 38); // Crimson Red
      doc.rect(0, 0, 210, 18, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PG HOSTEL MANAGEMENT SYSTEM', 105, 12, { align: 'center' });

      // Subheader & Receipt #
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(18);
      doc.text('OFFICIAL FEE PAYMENT RECEIPT', 14, 32);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Receipt Number: ${p.receipt_number}`, 14, 38);
      doc.text(`Payment Date: ${p.paymentDateDisplay}`, 14, 43);
      doc.text(`Status: ${p.status}`, 14, 48);

      // Student & Room Box
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 54, 182, 34, 3, 3, 'FD');

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Student: ${p.student_name}`, 18, 62);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Registration No: ${p.reg_number}`, 18, 68);
      doc.text(`College: ${p.college || 'National Institute of Technology'}`, 18, 74);
      doc.text(`Course: ${p.course || ''} (${p.year || ''})`, 18, 80);

      doc.setFont('helvetica', 'bold');
      doc.text(`Room: Room ${p.room_number || '-'} • ${p.bed_label || '-'}`, 110, 62);
      doc.setFont('helvetica', 'normal');
      doc.text(`Floor: Floor ${p.floor_number || '-'}`, 110, 68);
      doc.text(`Parent / Guardian: ${p.parent_name || '-'}`, 110, 74);
      doc.text(`Parent Phone: ${p.parent_phone || '-'}`, 110, 80);

      // Line items table using autoTable
      doc.autoTable({
        startY: 94,
        head: [['Item Description', 'Billing Cycle Period', 'Amount (INR)']],
        body: [
          [
            'Monthly Hostel Room & Residency Charges\n(Lodging, Electricity, High-Speed Wi-Fi & Mess)',
            `${p.cycleStartDisplay} to ${p.cycleEndDisplay}\n(Joining-Date Anchored)`,
            `₹${Number(p.amount).toLocaleString('en-IN')}`
          ],
          [
            'TOTAL AMOUNT PAID',
            `Settled via ${p.payment_method}`,
            `₹${Number(p.amount).toLocaleString('en-IN')}`
          ]
        ],
        theme: 'grid',
        headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: { 2: { halign: 'right', fontStyle: 'bold' } }
      });

      const finalY = doc.lastAutoTable.finalY + 10;

      // Next due reminder note
      doc.setDrawColor(254, 202, 202);
      doc.setFillColor(254, 242, 242);
      doc.roundedRect(14, finalY, 182, 14, 2, 2, 'FD');
      doc.setTextColor(185, 28, 28);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`Notice: Next Billing Cycle Due on ${p.nextDueDateDisplay || '15-11-2026'}. Monthly fee: ₹7,000.`, 20, finalY + 9);

      // Signatures
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Authorized Hostel Accounts Seal', 140, finalY + 45);
      doc.line(135, finalY + 42, 185, finalY + 42);

      doc.text('Hostel Chief Warden', 20, finalY + 45);
      doc.line(18, finalY + 42, 60, finalY + 42);

      // Save PDF
      doc.save(`Receipt_${p.receipt_number}_${p.reg_number}.pdf`);
      Toast.success(`Receipt ${p.receipt_number} downloaded as PDF.`);
    } catch (e) {
      console.error(e);
      Toast.error('PDF generation error: ' + e.message);
    }
  }
};

window.ReceiptModal = ReceiptModal;
