/**
 * Hostel Structure & Visual Floor Grid Component
 * Displays 5 floors, 50 rooms, 250 beds with occupancy dots and click-to-manage
 */
const HostelStructurePage = {
  async render() {
    return `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Hostel Floors & Visual Room Matrix</h1>
          <p>5 Residential Floors • 50 Rooms • 250 Total Bed Inventory</p>
        </div>
        <div class="page-actions">
          <div style="display:flex;align-items:center;gap:1.25rem;font-size:0.84rem;font-weight:600;">
            <span style="display:flex;align-items:center;gap:0.4rem;">
              <span class="bed-dot available" style="width:12px;height:12px;"></span> Available
            </span>
            <span style="display:flex;align-items:center;gap:0.4rem;">
              <span class="bed-dot occupied" style="width:12px;height:12px;"></span> Occupied
            </span>
            <span style="display:flex;align-items:center;gap:0.4rem;">
              <span class="bed-dot maintenance" style="width:12px;height:12px;"></span> Maintenance
            </span>
          </div>
          <button class="btn btn-secondary" onclick="HostelStructurePage.loadStructure()">
            <i data-lucide="refresh-cw"></i>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <!-- Quick Floor Filter / Jump Links -->
      <div style="display:flex;gap:0.5rem;margin-bottom:1.5rem;overflow-x:auto;padding-bottom:0.5rem;">
        <button class="btn btn-sm btn-secondary active" onclick="HostelStructurePage.filterFloor('all', this)">All Floors</button>
        <button class="btn btn-sm btn-secondary" onclick="HostelStructurePage.filterFloor(5, this)">5th Floor (501-510)</button>
        <button class="btn btn-sm btn-secondary" onclick="HostelStructurePage.filterFloor(4, this)">4th Floor (401-410)</button>
        <button class="btn btn-sm btn-secondary" onclick="HostelStructurePage.filterFloor(3, this)">3rd Floor (301-310)</button>
        <button class="btn btn-sm btn-secondary" onclick="HostelStructurePage.filterFloor(2, this)">2nd Floor (201-210)</button>
        <button class="btn btn-sm btn-secondary" onclick="HostelStructurePage.filterFloor(1, this)">1st Floor (101-110)</button>
      </div>

      <!-- Floors Container -->
      <div id="floors-matrix-container" class="structure-container">
        <p style="color:var(--text-muted);padding:2rem;text-align:center;">Loading room structure...</p>
      </div>
    `;
  },

  async afterRender() {
    await this.loadStructure();
  },

  async loadStructure() {
    let data = null;
    try {
      const res = await API.get('/rooms/structure');
      if (res && res.success) {
        data = res.data;
      }
    } catch (e) {
      console.warn('[HostelStructure] Online load failed, using local dataset');
    }

    if (!data && typeof MockData !== 'undefined') {
      data = MockData.structure;
    }

    if (data) {
      this.renderFloors(data);
    } else {
      Toast.error('Failed to load hostel floors.');
    }
  },

  renderFloors(floors) {
    const container = document.getElementById('floors-matrix-container');
    if (!container) return;

    // Ordered 5F down to 1F
    container.innerHTML = floors.map(floor => `
      <div class="floor-row" data-floor="${floor.floor_number}">
        <div class="floor-header">
          <div style="display:flex;align-items:center;gap:0.75rem;">
            <span class="floor-badge">
              <i data-lucide="layers" style="width:16px;height:16px;"></i>
              ${floor.floor_number}F — ${floor.name}
            </span>
            <span style="font-size:0.82rem;color:var(--text-muted);">${floor.rooms.length} Rooms (5 Beds/Room)</span>
          </div>
          <div class="floor-stats">
            <span><strong>${floor.stats.occupiedBeds}</strong> Occupied</span>
            <span><strong>${floor.stats.availableBeds}</strong> Available</span>
            <span><strong>${floor.stats.totalBeds}</strong> Total Beds</span>
          </div>
        </div>

        <div class="rooms-grid">
          ${floor.rooms.map(r => `
            <div class="room-card ${r.room_number === '205' ? 'style="border-color:var(--primary-red);"' : ''}" onclick="RoomDetailModal.open('${r.room_number}')" title="Click to inspect Room ${r.room_number}">
              <div class="room-card-number">Room ${r.room_number}</div>
              
              <!-- 5 Bed Dots Representation -->
              <div class="room-bed-dots">
                ${Array(Number(r.occupied_beds)).fill(0).map(() => `<span class="bed-dot occupied" title="Occupied Bed"></span>`).join('')}
                ${Array(Number(r.available_beds)).fill(0).map(() => `<span class="bed-dot available" title="Available Bed"></span>`).join('')}
                ${Array(Number(r.maintenance_beds)).fill(0).map(() => `<span class="bed-dot maintenance" title="Maintenance Bed"></span>`).join('')}
              </div>

              <div class="room-occupancy-text">
                ${r.occupied_beds} / 5 Beds Occupied
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    Utils.renderIcons();
  },

  filterFloor(floorNum, btn) {
    document.querySelectorAll('.floor-row').forEach(row => {
      if (floorNum === 'all' || row.getAttribute('data-floor') === String(floorNum)) {
        row.style.display = 'block';
      } else {
        row.style.display = 'none';
      }
    });

    // Update active button state
    if (btn && btn.parentElement) {
      btn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
  }
};

window.HostelStructurePage = HostelStructurePage;
