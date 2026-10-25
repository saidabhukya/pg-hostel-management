/**
 * Main Application Coordinator & SPA Router
 */
const App = {
  currentRoute: 'dashboard',
  user: null,

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
            const initialRoute = window.location.hash ? window.location.hash.substring(1) : (this.user.role === 'admin' ? 'dashboard' : 'student-dashboard');
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
          console.warn('Session verification failed:', err);
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

    this.currentRoute = routeId;
    window.location.hash = `#${routeId}`;

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
    switch (routeId) {
      // Admin Routes
      case 'dashboard':
        if (this.user.role !== 'admin') return this.navigate('student-dashboard');
        pageContainer.innerHTML = await AdminDashboard.render();
        await AdminDashboard.afterRender();
        break;

      case 'students':
        if (this.user.role !== 'admin') return this.navigate('student-dashboard');
        pageContainer.innerHTML = await StudentsPage.render();
        await StudentsPage.afterRender();
        break;

      case 'hostel-structure':
      case 'beds':
        if (this.user.role !== 'admin') return this.navigate('student-dashboard');
        pageContainer.innerHTML = await HostelStructurePage.render();
        await HostelStructurePage.afterRender();
        break;

      case 'fees':
      case 'student-fees':
        pageContainer.innerHTML = await FeesPage.render();
        await FeesPage.afterRender();
        break;

      case 'payments':
      case 'student-payments':
        pageContainer.innerHTML = await PaymentsPage.render();
        await PaymentsPage.afterRender();
        break;

      case 'complaints':
        pageContainer.innerHTML = await ComplaintsPage.render();
        await ComplaintsPage.afterRender();
        break;

      case 'visitors':
        if (this.user.role !== 'admin') return this.navigate('student-dashboard');
        pageContainer.innerHTML = await VisitorsPage.render();
        await VisitorsPage.afterRender();
        break;

      case 'mess':
        pageContainer.innerHTML = await MessPage.render();
        await MessPage.afterRender();
        break;

      case 'expenses':
        if (this.user.role !== 'admin') return this.navigate('student-dashboard');
        pageContainer.innerHTML = await ExpensesPage.render();
        await ExpensesPage.afterRender();
        break;

      case 'reports':
        if (this.user.role !== 'admin') return this.navigate('student-dashboard');
        pageContainer.innerHTML = await ReportsPage.render();
        await ReportsPage.afterRender();
        break;

      case 'announcements':
        pageContainer.innerHTML = await AnnouncementsPage.render();
        await AnnouncementsPage.afterRender();
        break;

      case 'leave-requests':
        pageContainer.innerHTML = await LeaveRequestsPage.render();
        await LeaveRequestsPage.afterRender();
        break;

      case 'settings':
        pageContainer.innerHTML = await SettingsPage.render();
        await SettingsPage.afterRender();
        break;

      // Student Routes
      case 'student-dashboard':
        pageContainer.innerHTML = await StudentDashboard.render();
        await StudentDashboard.afterRender();
        break;

      case 'student-profile':
        const student = API.getStudent();
        if (student) {
          StudentProfile.open(student.id);
        } else {
          pageContainer.innerHTML = await StudentDashboard.render();
          await StudentDashboard.afterRender();
        }
        break;

      default:
        if (this.user.role === 'admin') {
          pageContainer.innerHTML = await AdminDashboard.render();
          await AdminDashboard.afterRender();
        } else {
          pageContainer.innerHTML = await StudentDashboard.render();
          await StudentDashboard.afterRender();
        }
        break;
    }

    Utils.renderIcons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    if (route && route !== App.currentRoute) {
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
