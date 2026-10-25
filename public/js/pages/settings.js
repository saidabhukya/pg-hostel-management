/**
 * Settings & Account Security Page Component
 */
const SettingsPage = {
  async render() {
    const user = API.getUser();
    const isAdmin = user && user.role === 'admin';

    return `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Hostel Settings & Account Security</h1>
          <p>Institutional parameters, curfew rules, and login authentication security</p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(440px, 1fr));gap:1.5rem;">
        <!-- Card 1: Password & Security -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <i data-lucide="shield-check" style="color:var(--primary-red);"></i>
              Change Account Password
            </h3>
          </div>

          <form onsubmit="SettingsPage.changePassword(event)">
            <div class="form-group" style="margin-bottom:1.15rem;">
              <label class="form-label required">Current Password</label>
              <input type="password" id="set-cur-pwd" class="form-control" placeholder="Enter existing password" required />
            </div>

            <div class="form-group" style="margin-bottom:1.15rem;">
              <label class="form-label required">New Password</label>
              <input type="password" id="set-new-pwd" class="form-control" placeholder="Minimum 6 characters" required minlength="6" />
            </div>

            <div class="form-group" style="margin-bottom:1.5rem;">
              <label class="form-label required">Confirm New Password</label>
              <input type="password" id="set-cnf-pwd" class="form-control" placeholder="Re-type new password" required minlength="6" />
            </div>

            <div style="text-align:right;">
              <button type="submit" class="btn btn-primary">
                Update Password
              </button>
            </div>
          </form>
        </div>

        ${isAdmin ? `
          <!-- Card 2: Hostel Institutional Parameters (Admin Only) -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">
                <i data-lucide="building" style="color:var(--primary-red);"></i>
                Hostel Configuration
              </h3>
            </div>

            <form onsubmit="SettingsPage.saveHostelSettings(event)">
              <div class="form-group" style="margin-bottom:1.15rem;">
                <label class="form-label required">Hostel Facility Name</label>
                <input type="text" id="set-hostel-name" class="form-control" value="SRI RAM PG" required />
              </div>

              <div class="form-grid" style="margin-bottom:1.15rem;">
                <div class="form-group">
                  <label class="form-label required">Helpline Phone</label>
                  <input type="tel" id="set-hostel-phone" class="form-control" value="+91 120 232 4000" required />
                </div>
                <div class="form-group">
                  <label class="form-label required">Night Curfew Time</label>
                  <input type="text" id="set-hostel-curfew" class="form-control" value="10:00 PM" required />
                </div>
              </div>

              <div class="form-group" style="margin-bottom:1.15rem;">
                <label class="form-label required">Default Monthly Fee (₹)</label>
                <input type="number" id="set-hostel-fee" class="form-control" value="7000" min="1000" required />
              </div>

              <div class="form-group" style="margin-bottom:1.5rem;">
                <label class="form-label">Campus Address</label>
                <input type="text" id="set-hostel-addr" class="form-control" value="Knowledge Park III, Institutional Area, Greater Noida, UP - 201306" />
              </div>

              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.75rem;">
                <button type="button" class="btn btn-sm" onclick="SettingsPage.clearAllData()" style="color:#e11d48;border:1px solid #fecdd3;background:#fff1f2;">
                  <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
                  Remove Sample Data (Start Clean)
                </button>
                <button type="submit" class="btn btn-primary">
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        ` : ''}
      </div>
    `;
  },

  async afterRender() {
    const user = API.getUser();
    if (user && user.role === 'admin') {
      try {
        const res = await API.get('/settings');
        if (res.success && res.data) {
          const s = res.data;
          const nameEl = document.getElementById('set-hostel-name');
          const phoneEl = document.getElementById('set-hostel-phone');
          const curfewEl = document.getElementById('set-hostel-curfew');
          const feeEl = document.getElementById('set-hostel-fee');
          const addrEl = document.getElementById('set-hostel-addr');
          if (nameEl && s.hostel_name) nameEl.value = s.hostel_name;
          if (phoneEl && s.contact_phone) phoneEl.value = s.contact_phone;
          if (curfewEl && s.curfew_time) curfewEl.value = s.curfew_time;
          if (feeEl && s.default_monthly_fee) feeEl.value = s.default_monthly_fee;
          if (addrEl && s.hostel_address) addrEl.value = s.hostel_address;
        }
      } catch (e) {}
    }
  },

  async changePassword(e) {
    e.preventDefault();
    const cur = document.getElementById('set-cur-pwd').value;
    const np = document.getElementById('set-new-pwd').value;
    const cnf = document.getElementById('set-cnf-pwd').value;

    if (np !== cnf) {
      Toast.error('New password and confirmation do not match.');
      return;
    }

    try {
      const res = await API.post('/auth/change-password', {
        currentPassword: cur,
        newPassword: np
      });

      if (res.success) {
        Toast.success(res.message);
        document.getElementById('set-cur-pwd').value = '';
        document.getElementById('set-new-pwd').value = '';
        document.getElementById('set-cnf-pwd').value = '';
      }
    } catch (err) {
      Toast.error(err.message);
    }
  },

  async saveHostelSettings(e) {
    e.preventDefault();
    const name = document.getElementById('set-hostel-name').value;
    const phone = document.getElementById('set-hostel-phone').value;
    const curfew = document.getElementById('set-hostel-curfew').value;
    const fee = document.getElementById('set-hostel-fee').value;
    const addr = document.getElementById('set-hostel-addr').value;

    try {
      const res = await API.put('/settings', {
        hostel_name: name,
        contact_phone: phone,
        curfew_time: curfew,
        default_monthly_fee: fee,
        hostel_address: addr
      });

      if (res.success) {
        Toast.success(res.message);
      }
    } catch (err) {
      Toast.error(err.message);
    }
  },

  async clearAllData() {
    if (!confirm('Are you sure you want to remove all sample data? This will clear all students, payments, and complaints so you can add your original data from scratch.')) {
      return;
    }
    try {
      if (typeof MockData !== 'undefined' && typeof MockData.resetToClean === 'function') {
        MockData.resetToClean();
      }
      localStorage.removeItem('sri_ram_pg_live_store_v1');
      try {
        await API.post('/system/reset-clean');
      } catch(e) {}
      Toast.success('All sample data removed! Starting fresh with 0 students and 250 available beds.');
      setTimeout(() => {
        App.navigate('dashboard');
      }, 500);
    } catch (e) {
      Toast.error('Failed to reset: ' + e.message);
    }
  }
};

window.SettingsPage = SettingsPage;
