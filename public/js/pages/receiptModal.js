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
            <button class="btn btn-sm" style="background:#25d366;color:#ffffff;font-weight:700;display:inline-flex;align-items:center;gap:0.4rem;border:none;box-shadow:0 2px 5px rgba(37,211,102,0.3);padding:0.5rem 0.9rem;border-radius:6px;cursor:pointer;" onclick="ReceiptModal.sendWhatsApp(${p.id}, 'student')">
              <i data-lucide="message-circle" style="width:16px;height:16px;"></i>
              <span>Send PDF to Student WhatsApp</span>
            </button>
            ${(p.parent_phone || p.parentPhone) ? `
              <button class="btn btn-sm btn-secondary" style="font-size:0.8rem;padding:0.45rem 0.75rem;" onclick="ReceiptModal.sendWhatsApp(${p.id}, 'parent')" title="Send PDF receipt to Parent (+91 ${p.parent_phone || p.parentPhone})">
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
              <div style="font-size:0.78rem;color:#64748b;margin-top:2px;">Date: <strong>${p.paymentDateDisplay || p.payment_date}</strong></div>
            </div>
          </div>

          <!-- Resident & Allocation Info Grid -->
          <div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:1rem;background:#f8fafc;padding:1rem;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:1.5rem;font-size:0.84rem;">
            <div>
              <div style="color:#64748b;font-size:0.72rem;text-transform:uppercase;font-weight:700;">Resident Student</div>
              <div style="font-size:1rem;font-weight:800;color:#0f172a;">${Utils.escapeHTML(p.student_name)}</div>
              <div style="color:#475569;margin-top:2px;">Reg No: <strong>${p.reg_number}</strong></div>
              <div style="color:#64748b;">${Utils.escapeHTML(p.course || '')} (${p.year || ''})</div>
              <div style="color:#64748b;">Phone: <strong>+91 ${p.student_phone || '-'}</strong></div>
            </div>
            <div style="text-align:right;">
              <div style="color:#64748b;font-size:0.72rem;text-transform:uppercase;font-weight:700;">Room Allocation</div>
              <div style="font-size:1rem;font-weight:800;color:#dc2626;">Room ${p.room_number || '-'} • ${p.bed_label || '-'}</div>
              <div style="color:#475569;margin-top:2px;">Floor: Floor ${p.floor_number || '-'}</div>
              <div style="color:#64748b;">Parent: ${Utils.escapeHTML(p.parent_name || '')}</div>
              <div style="color:#64748b;">Parent Ph: ${p.parent_phone ? '+91 ' + p.parent_phone : '-'}</div>
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
        <div style="display:flex;justify-content:flex-end;gap:0.75rem;margin-top:1.5rem;flex-wrap:wrap;">
          <button class="btn btn-secondary" onclick="Modal.close()">Close</button>
          
          <button class="btn" style="background:#25d366;color:#ffffff;font-weight:700;display:inline-flex;align-items:center;gap:0.4rem;border:none;box-shadow:0 2px 4px rgba(37,211,102,0.25);" onclick="ReceiptModal.sendWhatsApp(${p.id}, 'student')" title="Send PDF receipt to Student on WhatsApp (+91 ${p.student_phone || ''})">
            <i data-lucide="message-circle" style="width:16px;height:16px;"></i>
            <span>Send Student WhatsApp</span>
          </button>

          ${p.parent_phone ? `
            <button class="btn btn-secondary" onclick="ReceiptModal.sendWhatsApp(${p.id}, 'parent')" title="Send PDF receipt to Parent (+91 ${p.parent_phone})">
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

  buildPDFDoc(receiptData = null) {
    const p = receiptData || this.currentReceipt;
    if (!p) return null;

    const jsPDFClass = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (!jsPDFClass) return null;

    const doc = new jsPDFClass({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Header Banner
    doc.setFillColor(220, 38, 38); // Crimson Red
    doc.rect(0, 0, 210, 18, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SRI RAM PG', 105, 12, { align: 'center' });

    // Subheader & Receipt #
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18);
    doc.text('OFFICIAL FEE PAYMENT RECEIPT', 14, 32);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Receipt Number: ${p.receipt_number || 'REC-OFFICIAL'}`, 14, 38);
    doc.text(`Payment Date: ${p.paymentDateDisplay || p.payment_date || Utils.getTodayISO()}`, 14, 43);
    doc.text(`Status: ${p.status || 'PAID'}`, 14, 48);

    // Student & Room Box
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 54, 182, 34, 3, 3, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Student: ${p.student_name || 'Resident Student'}`, 18, 62);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Registration No: ${p.reg_number || '-'}`, 18, 68);
    doc.text(`College: ${p.college || 'VIGNAN UNIVERSITY'}`, 18, 74);
    doc.text(`Course: ${p.course || 'B.Tech'} (${p.year || '1st Year'})`, 18, 80);

    doc.setFont('helvetica', 'bold');
    doc.text(`Room: Room ${p.room_number || '-'} • ${p.bed_label || '-'}`, 110, 62);
    doc.setFont('helvetica', 'normal');
    doc.text(`Floor: Floor ${p.floor_number || '-'}`, 110, 68);
    doc.text(`Parent / Guardian: ${p.parent_name || 'Parent / Guardian'}`, 110, 74);
    doc.text(`Parent Phone: ${p.parent_phone ? '+91 ' + p.parent_phone : '-'}`, 110, 80);

    let finalY = 135;

    if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        startY: 94,
        head: [['Item Description', 'Billing Cycle Period', 'Amount (INR)']],
        body: [
          [
            'Monthly Hostel Room & Residency Charges\n(Lodging, Electricity, High-Speed Wi-Fi & Mess Amenities)',
            `${p.cycleStartDisplay || p.cycle_start_date || 'Current Cycle'} to ${p.cycleEndDisplay || p.cycle_end_date || 'Current Cycle'}\n(Joining-Date Anchored)`,
            `₹${Number(p.amount || 7000).toLocaleString('en-IN')}`
          ],
          [
            'TOTAL AMOUNT PAID',
            `Settled via ${p.payment_method || 'UPI / Cash'}`,
            `₹${Number(p.amount || 7000).toLocaleString('en-IN')}`
          ]
        ],
        theme: 'grid',
        headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: { 2: { halign: 'right', fontStyle: 'bold' } }
      });
      finalY = doc.lastAutoTable.finalY + 10;
    } else {
      // Direct drawing fallback
      doc.setFillColor(220, 38, 38);
      doc.rect(14, 94, 182, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Item Description', 18, 99);
      doc.text('Billing Cycle Period', 90, 99);
      doc.text('Amount (INR)', 192, 99, { align: 'right' });

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'normal');
      doc.text('Monthly Hostel Room Charges', 18, 108);
      doc.text(`${p.cycleStartDisplay || p.cycle_start_date || '-'} to ${p.cycleEndDisplay || p.cycle_end_date || '-'}`, 90, 108);
      doc.text(`₹${Number(p.amount || 7000).toLocaleString('en-IN')}`, 192, 108, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL AMOUNT PAID', 18, 118);
      doc.text(`Settled via ${p.payment_method || 'UPI / Cash'}`, 90, 118);
      doc.setTextColor(220, 38, 38);
      doc.text(`₹${Number(p.amount || 7000).toLocaleString('en-IN')}`, 192, 118, { align: 'right' });
      finalY = 135;
    }

    // Next due reminder note
    doc.setDrawColor(254, 202, 202);
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(14, finalY, 182, 14, 2, 2, 'FD');
    doc.setTextColor(185, 28, 28);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`Notice: Next Billing Cycle Due on ${p.nextDueDateDisplay || '15-11-2026'}. Monthly fee: ₹${Number(p.amount || 7000).toLocaleString('en-IN')}.`, 20, finalY + 9);

    // Signatures
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Authorized Hostel Accounts Seal', 140, finalY + 45);
    doc.line(135, finalY + 42, 185, finalY + 42);

    doc.text('Hostel Chief Warden', 20, finalY + 45);
    doc.line(18, finalY + 42, 60, finalY + 42);

    return doc;
  },

  downloadPDF(receiptData = null) {
    const p = receiptData || this.currentReceipt;
    if (!p) return;

    try {
      const doc = this.buildPDFDoc(p);
      if (!doc) {
        Toast.info('Opening receipt print dialog...');
        this.printReceipt();
        return;
      }

      const filename = `Receipt_${p.receipt_number || 'HOSTEL'}_${p.reg_number || 'FEE'}.pdf`;
      doc.save(filename);
      Toast.success(`Receipt ${p.receipt_number || ''} downloaded as PDF.`);
    } catch (e) {
      console.warn('PDF direct save failed, falling back to print window:', e);
      Toast.info('Downloading via print dialog (Save as PDF)...');
      this.printReceipt();
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
    const origin = window.location.origin || (window.location.protocol + '//' + window.location.host);
    const publicUrl = `${origin}/receipt.html?id=${p.id}&receipt=${encodeURIComponent(p.receipt_number)}`;
    const amountStr = '₹' + Number(p.amount || 0).toLocaleString('en-IN');

    return `🧾 *SRI RAM PG - OFFICIAL FEE PAYMENT RECEIPT*
━━━━━━━━━━━━━━━━━━━━━━━━━
Dear *${p.student_name}*,

Your monthly hostel room fee payment has been successfully received & recorded.

📋 *Payment Summary:*
• *Receipt No:* ${p.receipt_number}
• *Amount Paid:* ${amountStr} (${p.payment_method})
• *Payment Date:* ${p.paymentDateDisplay || p.payment_date}
• *Student Reg No:* ${p.reg_number}
• *Room Allocation:* Room ${p.room_number || '-'} • Bed ${p.bed_label || '-'} (Floor ${p.floor_number || '-'})
• *Billing Cycle:* ${p.cycleStartDisplay || p.cycle_start_date} to ${p.cycleEndDisplay || p.cycle_end_date}
• *Next Due Date:* ${p.nextDueDateDisplay || '15-11-2026'}
• *Status:* ✅ PAID / SETTLED

📄 *Download & View Official PDF Receipt:*
${publicUrl}

The stamped official PDF receipt file has also been generated. Please keep this for your records.

Thank you,
*SRI RAM PG Management*
Opp. Vignan University, Vadlamudi
━━━━━━━━━━━━━━━━━━━━━━━━━`;
  },

  async sendWhatsApp(paymentIdOrData, target = 'student') {
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

      const rawPhone = target === 'parent' 
        ? (p.parent_phone || p.parentPhone || '') 
        : (p.student_phone || p.studentPhone || p.phone || '');
      let cleanPhone = this.formatPhoneForWhatsApp(rawPhone);
      const recipientName = target === 'parent' ? (p.parent_name || 'Parent') : p.student_name;

      // If phone number is not found on record, prompt admin to enter it
      if (!cleanPhone) {
        const entered = prompt(`Enter WhatsApp number for ${recipientName} (10 digits):`);
        if (entered) {
          cleanPhone = this.formatPhoneForWhatsApp(entered);
        }
      }

      const message = this.getWhatsAppMessage(p, target);
      const filename = `Receipt_${p.receipt_number || 'HOSTEL'}_${p.reg_number || 'FEE'}.pdf`;

      // 1. Build PDF Document & save file to disk immediately
      let pdfFile = null;
      try {
        const doc = this.buildPDFDoc(p);
        if (doc) {
          const blob = doc.output('blob');
          pdfFile = new File([blob], filename, { type: 'application/pdf' });
          doc.save(filename); // Automatically downloads the actual PDF file
        }
      } catch (err) {
        console.warn('PDF file creation warning:', err);
      }

      // 2. Try native Web Share API (which directly attaches files to WhatsApp on mobile/supported desktop)
      if (pdfFile && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          await navigator.share({
            title: `Fee Receipt ${p.receipt_number}`,
            text: message,
            files: [pdfFile]
          });
          Toast.success(`Official PDF receipt shared to WhatsApp!`);
          return;
        } catch (shareErr) {
          if (shareErr.name !== 'AbortError') {
            console.log('Web Share API aborted or falling back to WhatsApp link');
          }
        }
      }

      // 3. Fallback to WhatsApp URL (wa.me) with pre-filled student number & message
      const waUrl = cleanPhone 
        ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
        : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

      window.open(waUrl, '_blank');

      Toast.success(`Receipt PDF downloaded! Opening WhatsApp to send to ${recipientName} (${cleanPhone ? '+91 ' + cleanPhone.slice(-10) : 'student'})...`);
    } catch (e) {
      Toast.error('Failed to prepare WhatsApp message: ' + e.message);
    }
  }
};

window.ReceiptModal = ReceiptModal;
