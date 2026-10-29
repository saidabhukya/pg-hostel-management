/**
 * Settings & Account Security Page Component
 */
const SettingsPage = {
  async render() {
    const user = API.getUser() || { name: 'Hostel Chief Warden', role: 'admin', username: 'admin', email: 'admin@hostel.com', phone: '+91 98111 22334' };
    const isAdmin = user && user.role === 'admin';

    return `
      <div class="page-header">
        <div class="page-title-group">
          <h1>${isAdmin ? 'Hostel Administration & Profile Settings' : 'Account & Security Settings'}</h1>
          <p>${isAdmin ? 'Institutional parameters, Chief Warden profile, and access credentials' : 'Manage your login password and security settings'}</p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(440px, 1fr));gap:1.5rem;">
        ${isAdmin ? `
          <!-- Card 1: Admin Profile & Chief Warden Details -->
          <div class="card" style="grid-column: 1 / -1;">
            <div class="card-header">
              <h3 class="card-title">
                <i data-lucide="user-cog" style="color:var(--primary-red);"></i>
                Administrator Profile & Chief Warden Identity
              </h3>
              <span class="badge badge-primary">Super Administrator</span>
            </div>

            <form onsubmit="SettingsPage.saveAdminProfile(event)">
              <div style="display:flex;align-items:center;gap:1.5rem;margin-bottom:1.5rem;flex-wrap:wrap;">
                <div style="position:relative;">
                  <img 
                    id="set-admin-avatar-preview"
                    src="${user.avatar || './assets/images/default-avatar.png'}" 
                    alt="${Utils.escapeHTML(user.name || 'Admin')}" 
                    style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid var(--primary-red);"
                    onerror="this.onerror=null;this.src='./assets/images/default-avatar.png';"
                  />
                  <input type="hidden" id="set-admin-avatar-val" value="${user.avatar || ''}" />
                </div>
                <div style="flex:1;min-width:220px;">
                  <label class="form-label" style="font-weight:700;">Profile Avatar / Photo</label>
                  <input type="file" id="set-admin-avatar-input" class="form-control" accept="image/*" onchange="SettingsPage.previewAdminPhoto(event)" style="font-size:0.85rem;" />
                  <span style="font-size:0.75rem;color:var(--text-muted);">Recommended JPG/PNG square image under 2MB</span>
                </div>
              </div>

              <div class="form-grid" style="margin-bottom:1.15rem;">
                <div class="form-group">
                  <label class="form-label required">Administrator Full Name</label>
                  <input type="text" id="set-admin-name" class="form-control" value="${Utils.escapeHTML(user.name || 'Hostel Chief Warden')}" required />
                </div>
                <div class="form-group">
                  <label class="form-label required">Admin Login Username</label>
                  <input type="text" id="set-admin-username" class="form-control" value="${Utils.escapeHTML(user.username || 'admin')}" required />
                </div>
              </div>

              <div class="form-grid" style="margin-bottom:1.5rem;">
                <div class="form-group">
                  <label class="form-label required">Official Email Address</label>
                  <input type="email" id="set-admin-email" class="form-control" value="${Utils.escapeHTML(user.email || 'admin@hostel.com')}" required />
                </div>
                <div class="form-group">
                  <label class="form-label required">Helpline / Mobile Number</label>
                  <input type="tel" id="set-admin-phone" class="form-control" value="${Utils.escapeHTML(user.phone || '+91 98111 22334')}" required />
                </div>
              </div>

              <div style="text-align:right;">
                <button type="submit" class="btn btn-primary">
                  <i data-lucide="check" style="width:14px;height:14px;"></i>
                  Save Admin Profile
                </button>
              </div>
            </form>
          </div>

          <!-- Card 2: Hostel Institutional Parameters -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">
                <i data-lucide="building-2" style="color:var(--primary-red);"></i>
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
                  <input type="tel" id="set-hostel-phone" class="form-control" value="+91 98111 22334" required />
                </div>
                <div class="form-group">
                  <label class="form-label required">Night Curfew Time</label>
                  <input type="text" id="set-hostel-curfew" class="form-control" value="10:00 PM" required />
                </div>
              </div>

              <div class="form-grid" style="margin-bottom:1.15rem;">
                <div class="form-group">
                  <label class="form-label required">Default Monthly Fee (₹)</label>
                  <input type="number" id="set-hostel-fee" class="form-control" value="7000" min="1000" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Contact Email</label>
                  <input type="email" id="set-hostel-email" class="form-control" value="warden@srirampg.in" />
                </div>
              </div>

              <div class="form-group" style="margin-bottom:1.5rem;">
                <label class="form-label">Campus Address</label>
                <input type="text" id="set-hostel-addr" class="form-control" value="OPP. VIGNAN UNIVERSITY" />
              </div>

              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.75rem;">
                <button type="button" class="btn btn-sm" onclick="SettingsPage.clearAllData()" style="color:#e11d48;border:1px solid #fecdd3;background:#fff1f2;">
                  <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
                  Remove Sample Data (Start Clean)
                </button>
                <button type="submit" class="btn btn-primary">
                  <i data-lucide="save" style="width:14px;height:14px;"></i>
                  Save Hostel Settings
                </button>
              </div>
            </form>
          </div>
        ` : ''}

        <!-- Card 3: Password & Security -->
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
      </div>
    `;
  },

  previewAdminPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      Toast.warning('Photo size must be under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target.result;
      const preview = document.getElementById('set-admin-avatar-preview');
      const valInput = document.getElementById('set-admin-avatar-val');
      if (preview) preview.src = b64;
      if (valInput) valInput.value = b64;
    };
    reader.readAsDataURL(file);
  },

  async saveAdminProfile(e) {
    e.preventDefault();
    const name = (document.getElementById('set-admin-name')?.value || '').trim();
    const username = (document.getElementById('set-admin-username')?.value || '').trim();
    const email = (document.getElementById('set-admin-email')?.value || '').trim();
    const phone = (document.getElementById('set-admin-phone')?.value || '').trim();
    const avatar = document.getElementById('set-admin-avatar-val')?.value || '';

    try {
      const res = await API.post('/auth/profile', {
        name,
        username,
        email,
        phone,
        avatar
      });

      if (res && res.success) {
        Toast.success(res.message || 'Admin profile updated successfully!');
        if (window.App && typeof window.App.renderAuthenticatedShell === 'function') {
          window.App.user = API.getUser();
          const nameEls = document.querySelectorAll('.user-name');
          nameEls.forEach(el => el.textContent = name);
        }
      }
    } catch (err) {
      Toast.error(err.message || 'Failed to update profile.');
    }
  },

  async afterRender() {
    const user = API.getUser();
    if (user && user.role === 'admin') {
      try {
        const res = await API.get('/settings');
        if (res && res.success && res.data) {
          const s = res.data;
          const nameEl = document.getElementById('set-hostel-name');
          const phoneEl = document.getElementById('set-hostel-phone');
          const curfewEl = document.getElementById('set-hostel-curfew');
          const feeEl = document.getElementById('set-hostel-fee');
          const addrEl = document.getElementById('set-hostel-addr');
          const emailEl = document.getElementById('set-hostel-email');
          if (nameEl && s.hostel_name) nameEl.value = s.hostel_name;
          if (phoneEl && s.contact_phone) phoneEl.value = s.contact_phone;
          if (curfewEl && s.curfew_time) curfewEl.value = s.curfew_time;
          if (feeEl && s.default_monthly_fee) feeEl.value = s.default_monthly_fee;
          if (addrEl && s.hostel_address) addrEl.value = s.hostel_address;
          if (emailEl && s.contact_email) emailEl.value = s.contact_email;
          return;
        }
      } catch (e) {}

      if (typeof MockData !== 'undefined' && MockData.settings) {
        const s = MockData.settings;
        const nameEl = document.getElementById('set-hostel-name');
        const phoneEl = document.getElementById('set-hostel-phone');
        const curfewEl = document.getElementById('set-hostel-curfew');
        const feeEl = document.getElementById('set-hostel-fee');
        const addrEl = document.getElementById('set-hostel-addr');
        const emailEl = document.getElementById('set-hostel-email');
        if (nameEl && s.hostel_name) nameEl.value = s.hostel_name;
        if (phoneEl && s.contact_phone) phoneEl.value = s.contact_phone;
        if (curfewEl && s.curfew_time) curfewEl.value = s.curfew_time;
        if (feeEl && s.default_monthly_fee) feeEl.value = s.default_monthly_fee;
        if (addrEl && s.hostel_address) addrEl.value = s.hostel_address;
        if (emailEl && s.contact_email) emailEl.value = s.contact_email;
      }
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
    const email = document.getElementById('set-hostel-email')?.value || '';

    try {
      const res = await API.put('/settings', {
        hostel_name: name,
        contact_phone: phone,
        curfew_time: curfew,
        default_monthly_fee: fee,
        hostel_address: addr,
        contact_email: email
      });

      if (res.success) {
        Toast.success(res.message || 'Hostel configuration saved successfully!');
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
