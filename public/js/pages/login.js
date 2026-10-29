/**
 * SRI RAM PG - Login Page Component
 * Implements full-screen rotating hostel background slider (2000ms loop),
 * white center card, dual-role selection (Student Login & Warden / Admin Login),
 * slider navigation controls, and comprehensive branding.
 */
const LoginPage = {
  currentSlide: 0,
  sliderTimer: null,
  activeRole: 'student', // 'student' or 'admin'

  slides: [
    {
      id: 1,
      image: './assets/images/hostel-slide-1.jpg?v=hd2',
      title: 'SRI RAM PG Main Campus',
      category: 'Exterior Architecture'
    },
    {
      id: 2,
      image: './assets/images/hostel-slide-2.jpg?v=hd2',
      title: 'Spacious Resident Rooms',
      category: 'Air-Conditioned Suites'
    },
    {
      id: 3,
      image: './assets/images/hostel-slide-3.jpg?v=hd2',
      title: 'Hostel Dining Hall & Mess',
      category: 'Clean Dining & Meals'
    },
    {
      id: 4,
      image: './assets/images/hostel-slide-4.jpg?v=hd2',
      title: 'Quiet Study & Common Lounge',
      category: 'Academic Environment'
    },
    {
      id: 5,
      image: './assets/images/hostel-slide-5.jpg?v=hd2',
      title: 'Reception & Secure Corridors',
      category: '24/7 Monitored Residency'
    }
  ],

  setRole(role) {
    this.activeRole = role;
    const studentBtn = document.getElementById('tab-btn-student');
    const adminBtn = document.getElementById('tab-btn-admin');
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    const helperEl = document.getElementById('login-role-helper');
    const submitBtn = document.getElementById('login-submit-btn');

    const activeStyle = 'flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:0.6rem 0.75rem;font-size:0.82rem;font-weight:700;border-radius:8px;border:none;cursor:pointer;background:#e11d48;color:#ffffff;box-shadow:0 2px 4px rgba(225,29,72,0.25);transition:all 0.2s;';
    const inactiveStyle = 'flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:0.6rem 0.75rem;font-size:0.82rem;font-weight:600;border-radius:8px;border:none;cursor:pointer;background:transparent;color:#64748b;transition:all 0.2s;';

    if (role === 'student') {
      if (studentBtn) studentBtn.style.cssText = activeStyle;
      if (adminBtn) adminBtn.style.cssText = inactiveStyle;
      if (usernameInput) usernameInput.placeholder = 'Student ID / Reg Number (e.g. TEST001)';
      if (passwordInput) passwordInput.placeholder = 'Student Password';
      if (helperEl) {
        helperEl.innerHTML = `🎓 <strong>Student Resident Portal:</strong> Enter your registered Student ID / Username and Password.`;
      }
      if (submitBtn) {
        submitBtn.innerHTML = `<span>Login to Student Portal</span> <i data-lucide="arrow-right"></i>`;
      }
    } else {
      if (studentBtn) studentBtn.style.cssText = inactiveStyle;
      if (adminBtn) adminBtn.style.cssText = activeStyle;
      if (usernameInput) usernameInput.placeholder = 'Admin Username or Email';
      if (passwordInput) passwordInput.placeholder = 'Admin Password';
      if (helperEl) {
        helperEl.innerHTML = `👑 <strong>Warden / Admin Portal:</strong> Authorized administration desk and hostel warden access.`;
      }
      if (submitBtn) {
        submitBtn.innerHTML = `<span>Login to Admin Portal</span> <i data-lucide="arrow-right"></i>`;
      }
    }
    if (typeof Utils !== 'undefined' && Utils.renderIcons) Utils.renderIcons();
  },

  render() {
    return `
      <div class="sri-ram-login-viewport" id="sri-ram-viewport">
        <!-- 1. FULL-SCREEN BACKGROUND SLIDER WITH 5 HOSTEL PHOTOS -->
        <div class="sri-ram-bg-slider" id="sri-ram-bg-slider">
          ${this.slides.map((s, idx) => `
            <div 
              class="sri-ram-bg-slide ${idx === 0 ? 'active' : ''}" 
              id="bg-slide-${idx}"
              style="background-image: url('${s.image}');"
              aria-hidden="${idx !== 0}"
            ></div>
          `).join('')}
          <div class="sri-ram-bg-overlay"></div>
          <div class="sri-ram-ambient-curve"></div>
        </div>

        <!-- 2. TOP BRANDING BAR (Only PG Name) -->
        <header class="sri-ram-top-bar">
          <div class="sri-ram-top-left">
            <div class="sri-ram-brand-logo-wrap">
              <img src="./assets/images/sri-ram-pg-logo.svg" alt="SRI RAM PG Logo" class="sri-ram-nav-logo" />
            </div>
            <div class="sri-ram-brand-text">
              <span class="sri-ram-nav-title">SRI RAM <span class="nav-title-red">PG</span></span>
            </div>
          </div>
        </header>

        <!-- 3. CENTER LOGIN CARD -->
        <main class="sri-ram-card-container">
          <div class="sri-ram-login-card">
            <!-- House & Bed Logo -->
            <div class="sri-ram-card-logo-wrap">
              <img src="./assets/images/sri-ram-pg-logo.svg" alt="SRI RAM PG" class="sri-ram-card-logo" />
            </div>

            <!-- Title: Only PG Name -->
            <h1 class="sri-ram-card-title" style="margin-bottom:1.25rem;">SRI RAM <span class="title-highlight">PG</span></h1>

            <!-- ROLE SELECTOR TABS -->
            <div style="display:flex;gap:6px;background:#f1f5f9;padding:4px;border-radius:10px;margin-bottom:1.25rem;border:1px solid #e2e8f0;">
              <button 
                type="button" 
                id="tab-btn-student" 
                onclick="LoginPage.setRole('student')" 
                style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:0.6rem 0.75rem;font-size:0.82rem;font-weight:700;border-radius:8px;border:none;cursor:pointer;background:#e11d48;color:#ffffff;box-shadow:0 2px 4px rgba(225,29,72,0.25);transition:all 0.2s;"
              >
                <i data-lucide="graduation-cap" style="width:15px;height:15px;"></i>
                <span>Student Login</span>
              </button>
              <button 
                type="button" 
                id="tab-btn-admin" 
                onclick="LoginPage.setRole('admin')" 
                style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:0.6rem 0.75rem;font-size:0.82rem;font-weight:600;border-radius:8px;border:none;cursor:pointer;background:transparent;color:#64748b;transition:all 0.2s;"
              >
                <i data-lucide="shield" style="width:15px;height:15px;"></i>
                <span>Warden / Admin</span>
              </button>
            </div>

            <!-- Login Form -->
            <form id="login-form" onsubmit="LoginPage.handleSubmit(event)" novalidate>
              <!-- Username or Student ID Field -->
              <div class="sri-ram-field-group">
                <i data-lucide="user" class="sri-ram-field-icon"></i>
                <input 
                  type="text" 
                  id="login-username" 
                  class="sri-ram-input" 
                  placeholder="Student ID / Reg Number (e.g. TEST001)" 
                  required 
                  autocomplete="username"
                />
              </div>

              <!-- Password Field -->
              <div class="sri-ram-field-group">
                <i data-lucide="lock" class="sri-ram-field-icon"></i>
                <input 
                  type="password" 
                  id="login-password" 
                  class="sri-ram-input has-toggle" 
                  placeholder="Student Password" 
                  required 
                  autocomplete="current-password"
                />
                <button 
                  type="button" 
                  id="toggle-pwd-btn" 
                  class="sri-ram-pwd-toggle" 
                  onclick="LoginPage.togglePasswordVisibility()" 
                  title="Show/Hide Password"
                  aria-label="Show or hide password"
                >
                  <i id="pwd-eye-icon" data-lucide="eye"></i>
                </button>
              </div>

              <!-- Contextual helper alert -->
              <div id="login-role-helper" style="font-size:0.75rem;color:var(--text-muted);margin:0.25rem 0 0.85rem;background:rgba(225,29,72,0.06);padding:0.45rem 0.65rem;border-radius:var(--radius-sm);border-left:3px solid var(--primary-red);line-height:1.4;">
                🎓 <strong>Student Resident Portal:</strong> Enter your registered Student ID / Username and Password.
              </div>

              <!-- Options Row: Remember Me & Forgot Password -->
              <div class="sri-ram-options-row">
                <label class="sri-ram-remember">
                  <input type="checkbox" id="login-remember" checked />
                  <span>Remember Me</span>
                </label>
                <a href="javascript:void(0)" class="sri-ram-forgot-link" onclick="LoginPage.handleForgotPassword()">
                  Forgot Password?
                </a>
              </div>

              <!-- Login Button -->
              <button type="submit" id="login-submit-btn" class="sri-ram-submit-btn">
                <span>Login to Student Portal</span>
                <i data-lucide="arrow-right"></i>
              </button>
            </form>

            <!-- OR Divider -->
            <div class="sri-ram-divider">
              <span>OR</span>
            </div>

            <!-- Register Link -->
            <div class="sri-ram-register-row" style="margin-bottom: 0.5rem;">
              <span>New resident student?</span>
              <a href="javascript:void(0)" class="sri-ram-register-link" onclick="LoginPage.handleRegister(event)">
                Admissions & Enrollment
              </a>
            </div>

            <!-- Server Connection Indicator -->
            <div style="margin-top:0.75rem;font-size:0.72rem;color:var(--text-muted);display:flex;align-items:center;justify-content:center;gap:6px;">
              <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#10b981;"></span>
              <span>Online Cloud Database Sync Active</span>
              <a href="javascript:void(0)" onclick="LoginPage.openServerConfigModal()" style="color:var(--text-muted);text-decoration:underline;margin-left:4px;">Server</a>
            </div>
          </div>
        </main>
      </div>
    `;
  },

  initSlider() {
    this.cleanup();
    this.currentSlide = 0;
    this.sliderTimer = setInterval(() => {
      this.nextSlide();
    }, 2000);
  },

  goToSlide(idx) {
    if (idx < 0 || idx >= this.slides.length) return;
    this.currentSlide = idx;

    for (let i = 0; i < this.slides.length; i++) {
      const slideEl = document.getElementById(`bg-slide-${i}`);
      if (slideEl) {
        if (i === idx) {
          slideEl.classList.add('active');
          slideEl.setAttribute('aria-hidden', 'false');
        } else {
          slideEl.classList.remove('active');
          slideEl.setAttribute('aria-hidden', 'true');
        }
      }
    }

    if (this.sliderTimer) {
      clearInterval(this.sliderTimer);
      this.sliderTimer = setInterval(() => {
        this.nextSlide();
      }, 2000);
    }
  },

  nextSlide() {
    const nextIdx = (this.currentSlide + 1) % this.slides.length;
    this.goToSlide(nextIdx);
  },

  prevSlide() {
    const prevIdx = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
    this.goToSlide(prevIdx);
  },

  cleanup() {
    if (this.sliderTimer) {
      clearInterval(this.sliderTimer);
      this.sliderTimer = null;
    }
  },

  togglePasswordVisibility() {
    const input = document.getElementById('login-password');
    const icon = document.getElementById('pwd-eye-icon');
    if (!input || !icon) return;

    if (input.type === 'password') {
      input.type = 'text';
      icon.setAttribute('data-lucide', 'eye-off');
    } else {
      input.type = 'password';
      icon.setAttribute('data-lucide', 'eye');
    }
    Utils.renderIcons();
  },

  async handleSubmit(e) {
    e.preventDefault();
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    const submitBtn = document.getElementById('login-submit-btn');

    const username = usernameInput ? usernameInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';

    if (!username || !password) {
      Toast.error('Please enter both username and password.');
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>Signing in...</span>`;
      }

      // Online backend authentication call
      const res = await API.post('/auth/login', { username, password });

      if (res && res.success) {
        this.cleanup();

        API.setToken(res.token);
        API.setUser(res.user);
        API.setStudent(res.student);

        App.user = res.user;

        Toast.success(res.message || 'Login successful!');

        // Mount authenticated layout
        App.renderAuthenticatedShell();

        if (typeof NotificationCenter !== 'undefined') {
          NotificationCenter.init();
        }

        const fab = document.getElementById('ai-assistant-btn');
        if (fab) fab.style.display = 'flex';

        // Role-based route dispatch
        if (res.user.role === 'admin') {
          App.navigate('dashboard');
        } else {
          App.navigate('student-dashboard');
        }
      } else {
        Toast.error(res?.message || 'Invalid username or password.');
      }
    } catch (err) {
      console.error('[Login Error]', err);
      Toast.error(err.message || 'Invalid username or password.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        const btnLabel = this.activeRole === 'admin' ? 'Login to Admin Portal' : 'Login to Student Portal';
        submitBtn.innerHTML = `<span>${btnLabel}</span> <i data-lucide="arrow-right"></i>`;
        Utils.renderIcons();
      }
    }
  },

  handleForgotPassword() {
    Modal.open({
      title: 'SRI RAM PG - Password Assistance',
      content: `
        <div style="font-size:0.9rem;color:var(--text-secondary);line-height:1.6;">
          <p style="margin-bottom:1rem;">
            For your security, resident student credentials are managed via the hostel administration desk.
          </p>
          <div style="background:var(--bg-secondary);padding:1rem;border-radius:var(--radius-md);border-left:3px solid #dc2626;margin-bottom:1rem;">
            <strong style="color:var(--text-primary);">Need to reset your credentials?</strong><br/>
            &bull; <strong>Students:</strong> Contact the hostel warden desk or Chief Warden with your Student ID card.<br/>
            &bull; <strong>Warden / Admin:</strong> Log in and update your credentials in Settings.<br/>
            &bull; <strong>Helpline:</strong> +91 98111 22334 &bull; help@srirampg.in
          </div>
          <div style="margin-top:1.5rem;display:flex;justify-content:flex-end;">
            <button class="btn btn-primary" onclick="Modal.close()">Got it</button>
          </div>
        </div>
      `,
      maxWidth: '500px'
    });
  },

  handleRegister(e) {
    if (e) e.preventDefault();
    Modal.open({
      title: 'SRI RAM PG - Resident Admissions',
      content: `
        <div style="font-size:0.9rem;color:var(--text-secondary);line-height:1.6;">
          <div style="text-align:center;margin-bottom:1.25rem;">
            <img src="./assets/images/sri-ram-pg-logo.svg" alt="SRI RAM PG" style="width:65px;height:auto;margin:0 auto 0.5rem;" />
            <h3 style="font-size:1.15rem;font-weight:800;color:var(--text-primary);margin:0;">Admissions & Bed Allocation</h3>
            <p style="font-size:0.8rem;color:var(--text-muted);margin:0.25rem 0 0;">SRI RAM PG</p>
          </div>
          <p style="margin-bottom:0.75rem;">
            Student resident admissions and bed allocations are processed through the administration office.
          </p>
          <ul style="padding-left:1.25rem;margin-bottom:1.25rem;font-size:0.85rem;">
            <li>Once enrolled by the warden, your login credentials will be provided to you.</li>
            <li>You can log in from any phone, laptop, or desktop via the online portal.</li>
            <li>For admissions, visit the reception desk or call <strong>+91 98111 22334</strong>.</li>
          </ul>
          <div style="display:flex;justify-content:flex-end;">
            <button class="btn btn-primary" onclick="Modal.close()">Close</button>
          </div>
        </div>
      `,
      maxWidth: '520px'
    });
  },

  openServerConfigModal() {
    const currentApi = API.baseUrl;
    Modal.open({
      title: 'Online Server & API Configuration',
      content: `
        <div style="font-size:0.88rem;color:var(--text-secondary);line-height:1.6;">
          <p style="margin-bottom:0.75rem;">
            Current Backend Endpoint:
            <code style="display:block;background:var(--bg-secondary);padding:0.4rem 0.6rem;border-radius:4px;margin-top:4px;color:var(--primary-red);word-break:break-all;">${currentApi}</code>
          </p>
          <div class="form-group" style="margin-top:1rem;">
            <label class="form-label">Custom Backend / API URL</label>
            <input 
              type="text" 
              id="cfg-custom-api" 
              class="form-control" 
              placeholder="e.g. https://your-hostel-api.onrender.com/api" 
              value="${localStorage.getItem('pg_hostel_api_url') || ''}"
            />
            <small style="color:var(--text-muted);font-size:0.75rem;margin-top:4px;display:block;">
              Leave blank to automatically use the default production server origin.
            </small>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:0.5rem;margin-top:1.25rem;">
            <button class="btn btn-secondary btn-sm" onclick="Modal.close()">Cancel</button>
            <button class="btn btn-primary btn-sm" onclick="LoginPage.saveServerConfig()">Save & Reconnect</button>
          </div>
        </div>
      `,
      maxWidth: '480px'
    });
  },

  saveServerConfig() {
    const input = document.getElementById('cfg-custom-api');
    const val = input ? input.value.trim() : '';
    API.setCustomApiUrl(val);
    Modal.close();
    Toast.success('Backend server configuration updated.');
  }
};

window.LoginPage = LoginPage;
