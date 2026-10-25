/**
 * Room Detail & Bed Management Modal Component
 * Displays 5 individual beds in the room with status badges, occupant details, and actions
 */
const RoomDetailModal = {
  currentRoomData: null,

  async open(roomNumber) {
    try {
      const res = await API.get(`/rooms/${roomNumber}`);
      if (!res.success) {
        Toast.error(res.message);
        return;
      }

      this.currentRoomData = res.data;
      const { room, beds } = res.data;
      const user = API.getUser();
      const isAdmin = user && user.role === 'admin';

      const content = `
        <div style="margin-bottom:1.25rem;">
          <div style="display:flex;align-items:center;justify-content:space-between;background:var(--bg-secondary);padding:1rem 1.25rem;border-radius:var(--radius-md);margin-bottom:1.25rem;border:1px solid var(--border-color);">
            <div>
              <div style="font-size:1.3rem;font-weight:800;color:var(--text-primary);">Room ${room.room_number}</div>
              <div style="font-size:0.84rem;color:var(--text-muted);">${room.floor_name} • ${room.type}</div>
            </div>
            <div style="text-align:right;">
              <span class="badge badge-info" style="font-size:0.85rem;padding:0.4rem 0.85rem;">
                Capacity: ${room.capacity} Residents
              </span>
            </div>
          </div>

          <!-- 5 BEDS LIST -->
          <div class="bed-list">
            ${beds.map(b => {
              const isOccupied = b.status === 'occupied';
              const isAvailable = b.status === 'available';
              const isMaintenance = b.status === 'maintenance';

              return `
                <div class="bed-item status-${b.status}">
                  <!-- Left: Bed Label & Status Badge -->
                  <div style="display:flex;align-items:center;gap:1rem;min-width:140px;">
                    <div style="width:38px;height:38px;border-radius:var(--radius-md);background:var(--bg-primary);display:flex;align-items:center;justify-content:center;border:1px solid var(--border-color);color:var(--text-primary);font-weight:800;">
                      ${b.bed_number}
                    </div>
                    <div>
                      <div style="font-weight:700;font-size:0.95rem;color:var(--text-primary);">${b.bed_label}</div>
                      <span class="badge ${isAvailable ? 'badge-success' : isOccupied ? 'badge-danger' : 'badge-maintenance'}" style="margin-top:0.25rem;">
                        ${b.status}
                      </span>
                    </div>
                  </div>

                  <!-- Middle: Occupant Information (If Occupied) -->
                  <div style="flex:1;min-width:0;padding:0 0.5rem;">
                    ${isOccupied && b.student_name ? `
                      <div style="display:flex;align-items:center;gap:0.6rem;">
                        <div class="table-student-avatar" style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.8rem;background:var(--primary-red-light);color:var(--primary-red);">
                          ${b.student_name.charAt(0)}
                        </div>
                        <div style="min-width:0;">
                          <div style="font-weight:700;font-size:0.88rem;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                            ${Utils.escapeHTML(b.student_name)}
                          </div>
                          <div style="font-size:0.75rem;color:var(--text-muted);">
                            ${b.reg_number} • ${b.course || ''}
                          </div>
                        </div>
                      </div>
                    ` : `
                      <span style="font-size:0.84rem;color:var(--text-muted);font-style:italic;">
                        ${isAvailable ? 'Vacant — Ready for student allocation' : 'Temporarily undergoing maintenance / repairs'}
                      </span>
                    `}
                  </div>

                  <!-- Right: Action Buttons -->
                  <div style="display:flex;align-items:center;gap:0.4rem;flex-shrink:0;">
                    ${isOccupied ? `
                      <button class="btn btn-sm btn-secondary" onclick="Modal.close(); StudentProfile.open(${b.student_id})" title="View Student Profile">
                        <i data-lucide="user" style="width:14px;height:14px;"></i>
                        <span>Profile</span>
                      </button>
                      ${isAdmin ? `
                        <button class="btn btn-sm btn-secondary" onclick="RoomDetailModal.promptTransfer(${b.student_id}, '${Utils.escapeHTML(b.student_name)}', ${b.id})" title="Transfer Student to Another Bed">
                          <i data-lucide="arrow-right-left" style="width:14px;height:14px;"></i>
                          <span>Transfer</span>
                        </button>
                        <button class="btn btn-sm" style="background:#fee2e2;color:#dc2626;border:1px solid #fecdd3;" onclick="RoomDetailModal.vacateOccupant(${b.student_id}, '${Utils.escapeHTML(b.student_name)}', '${room.room_number}', '${b.bed_label}')" title="Vacate student and make bed available">
                          <i data-lucide="user-minus" style="width:14px;height:14px;"></i>
                          <span>Vacate</span>
                        </button>
                      ` : ''}
                    ` : `
                      ${isAdmin ? `
                        <button class="btn btn-sm btn-primary" onclick="Modal.close(); AddStudentModal.openWithBed(${b.id}, '${room.room_number}', '${b.bed_label}')" title="Allocate this bed to new student">
                          <i data-lucide="user-plus" style="width:14px;height:14px;"></i>
                          <span>Allocate</span>
                        </button>
                        ${isAvailable ? `
                          <button class="btn btn-sm btn-secondary" onclick="RoomDetailModal.updateBedStatus(${b.id}, 'maintenance')" title="Mark as Maintenance">
                            <i data-lucide="wrench" style="width:14px;height:14px;"></i>
                          </button>
                        ` : `
                          <button class="btn btn-sm btn-secondary" onclick="RoomDetailModal.updateBedStatus(${b.id}, 'available')" title="Mark as Available">
                            <i data-lucide="check" style="width:14px;height:14px;"></i>
                          </button>
                        `}
                      ` : ''}
                    `}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;

      Modal.open({
        title: `Room ${room.room_number} Management`,
        content: content,
        maxWidth: '740px'
      });
    } catch (e) {
      Toast.error('Failed to open room: ' + e.message);
    }
  },

  async updateBedStatus(bedId, newStatus) {
    try {
      await API.put(`/rooms/beds/${bedId}/status`, { status: newStatus });
      Toast.success(`Bed status changed to ${newStatus}.`);
      if (this.currentRoomData) {
        this.open(this.currentRoomData.room.room_number);
      }
      if (window.HostelStructurePage) {
        HostelStructurePage.loadStructure();
      }
    } catch (e) {
      Toast.error(e.message);
    }
  },

  async promptTransfer(studentId, studentName, currentBedId) {
    try {
      const res = await API.get('/rooms/options/available');
      const availableBeds = res.data || [];

      if (availableBeds.length === 0) {
        Toast.warning('No available beds found in the hostel for transfer.');
        return;
      }

      const optionsHtml = availableBeds.map(b => `
        <option value="${b.bed_id}">
          Floor ${b.floor_number} • Room ${b.room_number} — ${b.bed_label}
        </option>
      `).join('');

      Modal.open({
        title: `Transfer ${studentName}`,
        content: `
          <div style="font-size:0.9rem;color:var(--text-secondary);">
            <p style="margin-bottom:1rem;">
              Select an available target bed for <strong>${Utils.escapeHTML(studentName)}</strong>. The current bed will be automatically freed up.
            </p>
            <div class="form-group" style="margin-bottom:1.25rem;">
              <label class="form-label required">Select Destination Bed</label>
              <select id="transfer-target-bed" class="form-control">
                ${optionsHtml}
              </select>
            </div>
            <div class="form-group" style="margin-bottom:1.5rem;">
              <label class="form-label">Transfer Reason / Remarks</label>
              <input type="text" id="transfer-reason" class="form-control" placeholder="e.g. Student requested quiet wing" value="Mutual floor transfer" />
            </div>
            <div style="display:flex;justify-content:flex-end;gap:0.75rem;">
              <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" onclick="RoomDetailModal.executeTransfer(${studentId})">Complete Transfer</button>
            </div>
          </div>
        `,
        maxWidth: '520px'
      });
    } catch (e) {
      Toast.error('Transfer setup failed: ' + e.message);
    }
  },

  async executeTransfer(studentId) {
    const targetBedSelect = document.getElementById('transfer-target-bed');
    const reasonInput = document.getElementById('transfer-reason');
    if (!targetBedSelect) return;

    const targetBedId = targetBedSelect.value;
    const reason = reasonInput ? reasonInput.value : '';

    try {
      await API.post('/rooms/beds/transfer', {
        studentId,
        targetBedId,
        reason
      });
      Toast.success('Student transferred successfully!');
      Modal.close();
      if (window.HostelStructurePage) {
        HostelStructurePage.loadStructure();
      }
    } catch (e) {
      Toast.error('Transfer failed: ' + e.message);
    }
  },

  async vacateOccupant(studentId, studentName, roomNumber, bedLabel) {
    if (!confirm(`Are you sure you want to remove ${studentName} from PG? This will immediately free up ${bedLabel} in Room ${roomNumber} and show it as Available.`)) {
      return;
    }
    try {
      Toast.info(`Vacating ${studentName}...`);
      const res = await API.delete(`/students/${studentId}`);
      if (res.success) {
        Toast.success(`${studentName} removed! ${bedLabel} in Room ${roomNumber} is now Available.`);
        this.open(roomNumber);
        if (window.HostelStructurePage) HostelStructurePage.loadStructure();
        if (window.StudentsPage) StudentsPage.loadStudents();
        if (window.AdminDashboard && App.currentRoute === 'dashboard') AdminDashboard.loadData();
      }
    } catch (e) {
      Toast.error(e.message || 'Failed to vacate student.');
    }
  }
};

window.RoomDetailModal = RoomDetailModal;
