/**
 * Main Application Coordinator & SPA Router
 */
const App = {
  currentRoute: 'dashboard',
  user: null,
  _isNavigating: false,

  async init() {
    try {
      // 1. Initialize Theme from localStorage
      if (typeof Utils !== 'undefined') {
        const theme = Utils.getTheme();
        Utils.setTheme(theme);
      }

      // 2. Check token and session
      const token = typeof API !== 'undefined' ? API.getToken() : null;
      if (token) {
        try {
          const res = await API.get('/auth/me');
          if (res && res.success && res.user) {
            this.user = res.user;
            API.setUser(res.user);
            if (res.student) API.setStudent(res.student);
            
            this.renderAuthenticatedShell();
            
            // Route to URL hash or default
            let initialRoute = window.location.hash ? window.location.hash.substring(1) : '';
            if (!initialRoute || initialRoute === 'login' || initialRoute === 'logout') {
              initialRoute = this.user.role === 'admin' ? 'dashboard' : 'student-dashboard';
            }
            this.navigate(initialRoute);
            
            // Initialize notifications
            if (typeof NotificationCenter !== 'undefined') {
              NotificationCenter.init();
            }
            
            // Show AI FAB
            const fab = document.getElementById('ai-assistant-btn');
            if (fab) fab.style.display = 'flex';
            
            return;
          }
        } catch (err) {
          console.warn('Session online verification failed:', err.message);
          const cachedUser = typeof API !== 'undefined' ? API.getUser() : null;
          if (cachedUser) {
            this.user = cachedUser;
            this.renderAuthenticatedShell();
            let initialRoute = window.location.hash ? window.location.hash.substring(1) : '';
            if (!initialRoute || initialRoute === 'login' || initialRoute === 'logout') {
              initialRoute = this.user.role === 'admin' ? 'dashboard' : 'student-dashboard';
            }
            this.navigate(initialRoute);
            if (typeof NotificationCenter !== 'undefined') {
              NotificationCenter.init();
            }
            const fab = document.getElementById('ai-assistant-btn');
            if (fab) fab.style.display = 'flex';
            return;
          }
          if (typeof API !== 'undefined') API.setToken(null);
        }
      }

      // Render Login Page if not authenticated
      this.renderLoginPage();
    } catch (fatalErr) {
      console.error('Fatal initialization error in App.init:', fatalErr);
      this.renderLoginPage();
    }
  },

  renderLoginPage() {
    const root = document.getElementById('app-root');
    if (!root) return;
    
    // Hide AI FAB on login screen
    const fab = document.getElementById('ai-assistant-btn');
    if (fab) fab.style.display = 'none';

    root.innerHTML = LoginPage.render();
    if (typeof LoginPage.initSlider === 'function') {
      LoginPage.initSlider();
    }
    Utils.renderIcons();
  },

  renderAuthenticatedShell() {
    if (typeof LoginPage !== 'undefined' && typeof LoginPage.cleanup === 'function') {
      LoginPage.cleanup();
    }
    const root = document.getElementById('app-root');
    if (!root || !this.user) return;

    root.innerHTML = `
      <div class="app-layout">
        <!-- Sidebar Navigation -->
        <div id="sidebar-mount">
          ${Sidebar.render(this.user, this.currentRoute)}
        </div>

        <!-- Main Wrapper -->
        <div class="main-wrapper">
          <!-- Top Header -->
          <div id="header-mount">
            ${Header.render(this.user)}
          </div>

          <!-- Page Content Container -->
          <main class="page-content" id="page-container"></main>
        </div>
      </div>
    `;

    // Ensure AI Assistant floating action button is visible
    const fab = document.getElementById('ai-assistant-btn');
    if (fab) fab.style.display = 'flex';

    Utils.renderIcons();
  },

  async navigate(routeId) {
    if (!this.user) {
      this.renderLoginPage();
      return;
    }

    if (this._isNavigating && this.currentRoute === routeId) {
      return;
    }
    this._isNavigating = true;
    this._navSequence = (this._navSequence || 0) + 1;
    const currentSeq = this._navSequence;

    try {
      this.currentRoute = routeId;
      if (window.location.hash !== `#${routeId}`) {
        window.location.hash = `#${routeId}`;
      }

      // Update active nav items in sidebar
      document.querySelectorAll('.nav-item').forEach(el => {
        const href = el.getAttribute('href');
        if (href === `#${routeId}`) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      });

      const pageContainer = document.getElementById('page-container');
      if (!pageContainer) return;

      // Route dispatch
      try {
        let pageHtml = '';
        let activePageModule = null;

        switch (routeId) {
          // Admin Routes
          case 'dashboard':
            if (this.user.role !== 'admin') return this.navigate('student-dashboard');
            pageHtml = await AdminDashboard.render();
            activePageModule = AdminDashboard;
            break;

          case 'students':
            if (this.user.role !== 'admin') return this.navigate('student-dashboard');
            pageHtml = await StudentsPage.render();
            activePageModule = StudentsPage;
            break;

          case 'hostel-structure':
          case 'beds':
            if (this.user.role !== 'admin') return this.navigate('student-dashboard');
            pageHtml = await HostelStructurePage.render();
            activePageModule = HostelStructurePage;
            break;

          case 'fees':
          case 'student-fees':
            pageHtml = await FeesPage.render();
            activePageModule = FeesPage;
            break;

          case 'payments':
          case 'student-payments':
            pageHtml = await PaymentsPage.render();
            activePageModule = PaymentsPage;
            break;

          case 'attendance':
            pageHtml = await AttendancePage.render();
            activePageModule = AttendancePage;
            break;

          case 'complaints':
            pageHtml = await ComplaintsPage.render();
            activePageModule = ComplaintsPage;
            break;

          case 'visitors':
            if (this.user.role !== 'admin') return this.navigate('student-dashboard');
            pageHtml = await VisitorsPage.render();
            activePageModule = VisitorsPage;
            break;

          case 'mess':
            pageHtml = await MessPage.render();
            activePageModule = MessPage;
            break;

          case 'expenses':
            if (this.user.role !== 'admin') return this.navigate('student-dashboard');
            pageHtml = await ExpensesPage.render();
            activePageModule = ExpensesPage;
            break;

          case 'reports':
            if (this.user.role !== 'admin') return this.navigate('student-dashboard');
            pageHtml = await ReportsPage.render();
            activePageModule = ReportsPage;
            break;

          case 'announcements':
            pageHtml = await AnnouncementsPage.render();
            activePageModule = AnnouncementsPage;
            break;

          case 'leave-requests':
            pageHtml = await LeaveRequestsPage.render();
            activePageModule = LeaveRequestsPage;
            break;

          case 'notifications':
          case 'student-notifications':
            pageHtml = await NotificationsPage.render();
            activePageModule = NotificationsPage;
            break;

          case 'admin-profile':
          case 'profile':
          case 'settings':
            pageHtml = await SettingsPage.render();
            activePageModule = SettingsPage;
            break;

          // Student Routes
          case 'student-dashboard':
            pageHtml = await StudentDashboard.render();
            activePageModule = StudentDashboard;
            break;

          case 'student-profile':
            const student = API.getStudent();
            if (student) {
              pageHtml = await StudentDashboard.render();
              activePageModule = StudentDashboard;
              setTimeout(() => {
                if (typeof StudentProfile !== 'undefined') StudentProfile.open(student.id);
              }, 60);
            } else {
              pageHtml = await StudentDashboard.render();
              activePageModule = StudentDashboard;
            }
            break;

          default:
            if (this.user.role === 'admin') {
              pageHtml = await AdminDashboard.render();
              activePageModule = AdminDashboard;
            } else {
              pageHtml = await StudentDashboard.render();
              activePageModule = StudentDashboard;
            }
            break;
        }

        if (pageHtml) {
          pageContainer.innerHTML = pageHtml;
          Utils.renderIcons();
        }

        // Safely invoke afterRender - never destroy rendered page on secondary afterRender warnings
        if (activePageModule && typeof activePageModule.afterRender === 'function') {
          try {
            await activePageModule.afterRender();
          } catch (afterRenderErr) {
            console.warn(`[Page afterRender warning for route ${routeId}]:`, afterRenderErr);
          }
        }
      } catch (routeErr) {
        console.error(`[App.navigate Error on route ${routeId}]:`, routeErr);
        pageContainer.innerHTML = `
          <div class="card" style="padding:2.5rem;text-align:center;margin:2rem auto;max-width:540px;">
            <i data-lucide="alert-circle" style="width:48px;height:48px;color:var(--primary-red);margin-bottom:1rem;"></i>
            <h2 style="font-size:1.3rem;font-weight:800;color:var(--text-primary);margin-bottom:0.5rem;">Unable to Open Page</h2>
            <p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:1.5rem;">${Utils.escapeHTML(routeErr.message || 'An unexpected rendering issue occurred.')}</p>
            <div style="display:flex;gap:0.75rem;justify-content:center;">
              <button class="btn btn-secondary" onclick="App.navigate('dashboard')">Go to Dashboard</button>
              <button class="btn btn-primary" onclick="App.navigate('${routeId}')">Retry</button>
            </div>
          </div>
        `;
      }

      Utils.renderIcons();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      this._isNavigating = false;
    }
  },

  toggleAiAssistant() {
    AiAssistantModal.open();
  },

  logout() {
    API.setToken(null);
    API.setUser(null);
    API.setStudent(null);
    this.user = null;
    Toast.info('You have been signed out.');
    window.location.hash = '';
    this.renderLoginPage();
  }
};

// Listen to browser hash changes
window.addEventListener('hashchange', () => {
  if (App.user && window.location.hash) {
    const route = window.location.hash.substring(1);
    if (route && route !== App.currentRoute && !App._isNavigating) {
      App.navigate(route);
    }
  }
});

// Boot application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    App.init();
  });
} else {
  App.init();
}

window.App = App;
