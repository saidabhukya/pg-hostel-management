/**
 * Top Header Component
 */
const Header = {
  render(user) {
    const isDark = Utils.getTheme() === 'dark';

    const isAdmin = user && user.role === 'admin';

    return `
      <header class="top-header">
        <div class="header-left">
          <button class="menu-toggle-btn" onclick="Sidebar.toggleMobile()" title="Toggle Menu">
            <i data-lucide="menu"></i>
          </button>

          ${isAdmin ? `
            <!-- Global Real-Time Search (Admin Only) -->
            <div class="global-search-box">
              <i data-lucide="search" class="search-icon"></i>
              <input 
                type="text" 
                class="search-input" 
                id="global-search-input"
                placeholder="Search students (name, reg no, room) or rooms..."
                autocomplete="off"
                oninput="Header.handleSearch(this.value)"
                onfocus="Header.handleSearch(this.value)"
              />
              <div id="search-dropdown" class="search-results-dropdown"></div>
            </div>
          ` : `
            <div style="font-weight:700;font-size:0.95rem;color:var(--text-primary);letter-spacing:-0.2px;">
              SRI RAM PG <span style="font-size:0.75rem;color:var(--text-muted);font-weight:500;">• Resident Portal</span>
            </div>
          `}
        </div>

        <div class="header-right">
          <!-- AI Assistant Quick Launch -->
          <button class="header-btn" onclick="App.toggleAiAssistant()" title="AI Hostel Assistant" style="color:var(--primary-red);">
            <i data-lucide="bot"></i>
          </button>

          <!-- Notification Bell -->
          <div style="position:relative;">
            <button class="header-btn" id="notification-bell-btn" onclick="NotificationCenter.togglePopover(event)" title="Notifications" style="position:relative;">
              <i data-lucide="bell"></i>
              <span id="header-unread-dot" class="badge-dot" style="display:none;"></span>
              <span id="header-notif-count" class="header-notif-badge" style="display:none;position:absolute;top:2px;right:2px;background:var(--primary-red);color:#ffffff;border-radius:10px;font-size:0.65rem;font-weight:700;padding:0 4px;min-width:16px;height:16px;align-items:center;justify-content:center;line-height:1;border:2px solid var(--bg-card);box-shadow:0 1px 3px rgba(0,0,0,0.2);"></span>
            </button>
            <div id="notification-popover-container" class="notification-popover"></div>
          </div>

          <!-- Theme Toggle (Light / Dark) -->
          <button class="header-btn" onclick="Utils.toggleTheme()" title="Toggle Light/Dark Theme">
            <i id="theme-toggle-icon" data-lucide="${isDark ? 'sun' : 'moon'}"></i>
          </button>

          <!-- User Profile & Logout -->
          <div style="display:flex;align-items:center;gap:0.6rem;padding-left:0.5rem;border-left:1px solid var(--border-color);position:relative;">
            <button
              class="user-avatar profile-avatar-btn"
              style="width:34px;height:34px;font-size:0.8rem;border:none;cursor:pointer;"
              onclick="Header.toggleProfileCard(event)"
              title="View Profile"
              aria-haspopup="true"
              aria-expanded="false"
              id="profile-avatar-trigger"
            >
              ${user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </button>
            <div style="display:none;flex-direction:column;line-height:1.2;" class="d-md-flex">
              <span style="font-size:0.82rem;font-weight:700;color:var(--text-primary);">${user.name || 'User'}</span>
              <span style="font-size:0.68rem;color:var(--primary-red);font-weight:600;text-transform:uppercase;">${user.role}</span>
            </div>
            <button class="header-btn" onclick="App.logout()" title="Logout" style="margin-left:0.25rem;">
              <i data-lucide="log-out"></i>
            </button>
            <!-- Profile Card Popover -->
            <div id="profile-card-popover" class="profile-card-popover" role="dialog" aria-label="Profile Information">
            </div>
          </div>
        </div>
      </header>
    `;
  },

  searchTimeout: null,

  handleSearch(val) {
    clearTimeout(this.searchTimeout);
    const dropdown = document.getElementById('search-dropdown');
    if (!dropdown) return;

    if (!val || val.trim().length < 2) {
      dropdown.classList.remove('active');
      dropdown.innerHTML = '';
      return;
    }

    this.searchTimeout = setTimeout(async () => {
      try {
        const query = val.trim();
        const res = await API.get('/students', { search: query, limit: 5 });
        const students = res.data || [];

        if (students.length === 0) {
          dropdown.innerHTML = `
            <div style="padding:1rem;text-align:center;color:var(--text-muted);font-size:0.85rem;">
              No students found matching "<strong>${Utils.escapeHTML(query)}</strong>"
            </div>
          `;
        } else {
          dropdown.innerHTML = students.map(s => `
            <div class="search-result-item" onclick="Header.selectSearchResult(${s.id})">
              <div class="user-avatar" style="width:32px;height:32px;font-size:0.75rem;">
                ${s.name.charAt(0)}
              </div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:0.88rem;font-weight:700;color:var(--text-primary);">${Utils.escapeHTML(s.name)}</div>
                <div style="font-size:0.75rem;color:var(--text-muted);">
                  Reg: ${s.reg_number} • Room ${s.room_number || 'Unallocated'}, ${s.bed_label || ''}
                </div>
              </div>
              <span class="badge ${(s.fee_status === 'paid' || s.latest_cycle_status === 'paid') ? 'badge-success' : 'badge-danger'}">
                ${(s.fee_status === 'paid' || s.latest_cycle_status === 'paid') ? 'Paid' : 'Due'}
              </span>
            </div>
          `).join('');
        }

        dropdown.classList.add('active');
        Utils.renderIcons();
      } catch (e) {
        console.error('Search error:', e);
      }
    }, 200);
  },

  selectSearchResult(studentId) {
    const dropdown = document.getElementById('search-dropdown');
    if (dropdown) dropdown.classList.remove('active');
    const input = document.getElementById('global-search-input');
    if (input) input.value = '';
    StudentProfile.open(studentId);
  },

  /**
   * Toggle the profile info card popover when avatar is clicked
   */
  toggleProfileCard(event) {
    event.stopPropagation();
    const popover = document.getElementById('profile-card-popover');
    const trigger = document.getElementById('profile-avatar-trigger');
    if (!popover) return;

    const isOpen = popover.classList.contains('active');

    if (isOpen) {
      popover.classList.remove('active');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    } else {
      // Build and populate the card each time it opens so data is fresh
      popover.innerHTML = Header.buildProfileCardHTML();
      popover.classList.add('active');
      if (trigger) trigger.setAttribute('aria-expanded', 'true');
      Utils.renderIcons();
    }
  },

  /**
   * Build the HTML for the profile card based on current user + student data
   */
  buildProfileCardHTML() {
    const user = API.getUser();
    const student = API.getStudent();
    if (!user) return '';

    const isAdmin = user.role === 'admin';
    const initial = (user.name || 'U').charAt(0).toUpperCase();

    const adminBlock = isAdmin ? `
      <div class="profile-card-section">
        <div class="profile-card-row">
          <span class="profile-card-label"><i data-lucide="shield-check" style="width:13px;height:13px;"></i> Role</span>
          <span class="profile-card-value role-badge-admin">Administrator</span>
        </div>
        <div class="profile-card-row">
          <span class="profile-card-label"><i data-lucide="mail" style="width:13px;height:13px;"></i> Email</span>
          <span class="profile-card-value">${Utils.escapeHTML(user.email || '—')}</span>
        </div>
        ${user.phone ? `
        <div class="profile-card-row">
          <span class="profile-card-label"><i data-lucide="phone" style="width:13px;height:13px;"></i> Phone</span>
          <span class="profile-card-value">${Utils.escapeHTML(user.phone)}</span>
        </div>` : ''}
      </div>
    ` : '';

    const studentBlock = (!isAdmin && student) ? `
      <div class="profile-card-section">
        <div class="profile-card-row">
          <span class="profile-card-label"><i data-lucide="hash" style="width:13px;height:13px;"></i> Reg No.</span>
          <span class="profile-card-value badge badge-info">${Utils.escapeHTML(student.reg_number || '—')}</span>
        </div>
        <div class="profile-card-row">
          <span class="profile-card-label"><i data-lucide="mail" style="width:13px;height:13px;"></i> Email</span>
          <span class="profile-card-value">${Utils.escapeHTML(student.email || user.email || '—')}</span>
        </div>
        <div class="profile-card-row">
          <span class="profile-card-label"><i data-lucide="phone" style="width:13px;height:13px;"></i> Phone</span>
          <span class="profile-card-value">${Utils.escapeHTML(student.phone || '—')}</span>
        </div>
        <div class="profile-card-row">
          <span class="profile-card-label"><i data-lucide="book-open" style="width:13px;height:13px;"></i> Course</span>
          <span class="profile-card-value">${Utils.escapeHTML(student.course || '—')} (Yr ${student.year || '—'})</span>
        </div>
        <div class="profile-card-row">
          <span class="profile-card-label"><i data-lucide="door-open" style="width:13px;height:13px;"></i> Room / Bed</span>
          <span class="profile-card-value" style="color:var(--primary-red);font-weight:700;">
            ${student.room_number ? `Room ${student.room_number} • ${student.bed_label || ''}` : 'Not Allocated'}
          </span>
        </div>
      </div>
    ` : (!isAdmin ? `
      <div class="profile-card-section" style="text-align:center;color:var(--text-muted);font-size:0.8rem;padding:0.5rem 0;">
        No hostel profile linked yet.
      </div>
    ` : '');

    const viewProfileAction = (!isAdmin && student) ? `
      <button class="btn btn-sm btn-primary" style="width:100%;" onclick="Header.openMyStudentProfile(); Header.closeProfileCard();">
        <i data-lucide="user" style="width:14px;height:14px;"></i> View Full Profile
      </button>
    ` : '';

    return `
      <!-- Card Arrow -->
      <div class="profile-card-arrow"></div>

      <!-- Avatar + name header -->
      <div class="profile-card-header">
        <div class="user-avatar" style="width:52px;height:52px;font-size:1.35rem;border:3px solid var(--primary-red-border);">
          ${initial}
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:1rem;font-weight:800;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${Utils.escapeHTML(user.name || 'User')}
          </div>
          <div style="font-size:0.7rem;font-weight:700;color:var(--primary-red);text-transform:uppercase;letter-spacing:0.5px;margin-top:2px;">
            ${isAdmin ? '🛡 Administrator' : '🎓 Student'}
          </div>
        </div>
      </div>

      <!-- Info rows -->
      ${adminBlock}
      ${studentBlock}

      <!-- Actions footer -->
      <div class="profile-card-footer">
        ${viewProfileAction}
        <button class="btn btn-sm btn-secondary" style="width:100%;" onclick="App.navigate('settings'); Header.closeProfileCard();">
          <i data-lucide="settings" style="width:14px;height:14px;"></i> Account Settings
        </button>
        <button class="btn btn-sm" style="width:100%;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;" onclick="App.logout();">
          <i data-lucide="log-out" style="width:14px;height:14px;"></i> Sign Out
        </button>
      </div>
    `;
  },

  /**
   * Close the profile card popover
   */
  closeProfileCard() {
    const popover = document.getElementById('profile-card-popover');
    const trigger = document.getElementById('profile-avatar-trigger');
    if (popover) popover.classList.remove('active');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  },

  /**
   * Open the logged-in student's own full profile via /students/me
   * Bypasses ID lookup issues by using the server-side /me endpoint
   */
  async openMyStudentProfile() {
    try {
      const res = await API.get('/students/me');
      if (!res.success) {
        Toast.error(res.message || 'Could not load your profile.');
        return;
      }

      const { profile, feeCycles, payments, complaints, leaveRequests, nextDueInfo } = res.data;

      // Reuse StudentProfile renderer but inject data directly
      const content = StudentProfile.buildContent(profile, feeCycles, payments, complaints, leaveRequests, nextDueInfo, false);
      Modal.open({
        title: `My Profile — ${profile.name}`,
        content,
        maxWidth: '820px'
      });
    } catch (e) {
      Toast.error('Failed to load profile: ' + e.message);
    }
  }
};

// Close search dropdown on click outside
document.addEventListener('click', (e) => {
  const searchBox = document.querySelector('.global-search-box');
  const dropdown = document.getElementById('search-dropdown');
  if (dropdown && searchBox && !searchBox.contains(e.target)) {
    dropdown.classList.remove('active');
  }

  // Close profile card popover on click outside
  const profilePopover = document.getElementById('profile-card-popover');
  const profileTrigger = document.getElementById('profile-avatar-trigger');
  if (
    profilePopover &&
    profilePopover.classList.contains('active') &&
    !profilePopover.contains(e.target) &&
    e.target !== profileTrigger
  ) {
    Header.closeProfileCard();
  }
});

window.Header = Header;
