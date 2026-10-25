/**
 * Sidebar Navigation Component
 */
const Sidebar = {
  render(user, currentRoute = 'dashboard') {
    const isAdmin = user.role === 'admin';

    let navItemsHtml = '';

    if (isAdmin) {
      const adminNav = [
        { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
        { id: 'students', label: 'Students', icon: 'users' },
        { id: 'hostel-structure', label: 'Floors & Rooms', icon: 'building-2' },
        { id: 'beds', label: 'Beds Management', icon: 'bed-double' },
        { id: 'fees', label: 'Fees & Cycles', icon: 'credit-card' },
        { id: 'payments', label: 'Payments & Receipts', icon: 'receipt' },
        { id: 'complaints', label: 'Complaints', icon: 'alert-triangle' },
        { id: 'visitors', label: 'Visitors Log', icon: 'user-check' },
        { id: 'mess', label: 'Mess / Food', icon: 'utensils' },
        { id: 'expenses', label: 'Hostel Expenses', icon: 'wallet' },
        { id: 'reports', label: 'Reports & Analytics', icon: 'bar-chart-3' },
        { id: 'announcements', label: 'Announcements', icon: 'megaphone' },
        { id: 'leave-requests', label: 'Leave Requests', icon: 'calendar-days' },
        { id: 'settings', label: 'Hostel Settings', icon: 'settings' }
      ];

      navItemsHtml = adminNav.map(item => `
        <a href="#${item.id}" class="nav-item ${currentRoute === item.id ? 'active' : ''}" onclick="Sidebar.handleNavClick('${item.id}', event)">
          <span class="nav-item-icon"><i data-lucide="${item.icon}"></i></span>
          <span>${item.label}</span>
        </a>
      `).join('');
    } else {
      // Student Navigation
      const studentNav = [
        { id: 'student-dashboard', label: 'My Dashboard', icon: 'home' },
        { id: 'student-profile', label: 'My Profile & Bed', icon: 'user' },
        { id: 'student-fees', label: 'Fee Dues & Cycles', icon: 'credit-card' },
        { id: 'student-payments', label: 'Payment Receipts', icon: 'receipt' },
        { id: 'complaints', label: 'Submit Complaint', icon: 'alert-triangle' },
        { id: 'leave-requests', label: 'Apply Leave', icon: 'calendar-days' },
        { id: 'mess', label: 'Today\'s Mess Menu', icon: 'utensils' },
        { id: 'announcements', label: 'Announcements', icon: 'megaphone' },
        { id: 'settings', label: 'Change Password', icon: 'shield-check' }
      ];

      navItemsHtml = studentNav.map(item => `
        <a href="#${item.id}" class="nav-item ${currentRoute === item.id ? 'active' : ''}" onclick="Sidebar.handleNavClick('${item.id}', event)">
          <span class="nav-item-icon"><i data-lucide="${item.icon}"></i></span>
          <span>${item.label}</span>
        </a>
      `).join('');
    }

    return `
      <aside class="sidebar" id="app-sidebar">
        <!-- Sidebar Brand Header with College Logo -->
        <div class="sidebar-header">
          <img src="./assets/images/hanuman.svg" alt="Lord Hanuman" class="sidebar-logo" style="border-radius:50%;border:2px solid #FFD700;background:#FFF9C4;" />
          <div class="sidebar-title-block">
            <span class="sidebar-title">SRI RAM PG</span>
            <span class="sidebar-subtitle">MANAGEMENT SYSTEM</span>
          </div>
        </div>

        <!-- Navigation Menu -->
        <nav class="sidebar-nav">
          <span class="sidebar-nav-section-title">${isAdmin ? 'Administrative Portal' : 'Student Living Portal'}</span>
          ${navItemsHtml}

          <!-- Logout Link -->
          <div style="margin-top:auto;padding-top:1rem;border-top:1px solid var(--border-color);">
            <a href="javascript:void(0)" class="nav-item" onclick="App.logout()">
              <span class="nav-item-icon" style="color:var(--primary-red);"><i data-lucide="log-out"></i></span>
              <span style="color:var(--primary-red);font-weight:600;">Sign Out</span>
            </a>
          </div>
        </nav>

        <!-- Sidebar User Snippet -->
        <div class="sidebar-footer">
          <div class="user-snippet">
            <div class="user-avatar">
              ${user.name ? user.name.charAt(0) : 'U'}
            </div>
            <div class="user-info">
              <span class="user-name">${user.name || 'User'}</span>
              <span class="user-role-badge">${user.role === 'admin' ? 'Chief Warden' : 'Resident Student'}</span>
            </div>
          </div>
        </div>
      </aside>
    `;
  },

  handleNavClick(routeId, event) {
    if (event) event.preventDefault();
    this.closeMobile();
    window.location.hash = `#${routeId}`;
    App.navigate(routeId);
  },

  toggleMobile() {
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) sidebar.classList.toggle('mobile-open');
  },

  closeMobile() {
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) sidebar.classList.remove('mobile-open');
  }
};

window.Sidebar = Sidebar;
