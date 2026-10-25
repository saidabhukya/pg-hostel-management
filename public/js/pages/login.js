/**
 * SRI RAM PG - Login Page Component
 * Implements full-screen rotating hostel background slider (2000ms loop),
 * white glassmorphic center card, vertical thumbnails with glowing active state,
 * slider navigation controls, and comprehensive branding.
 */
const LoginPage = {
  currentSlide: 0,
  sliderTimer: null,

  slides: [
    {
      id: 1,
      image: './assets/images/hostel-slide-1.jpg',
      title: 'SRI RAM PG Main Campus',
      category: 'Exterior Architecture'
    },
    {
      id: 2,
      image: './assets/images/hostel-slide-2.jpg',
      title: 'Spacious Resident Rooms',
      category: 'Air-Conditioned Suites'
    },
    {
      id: 3,
      image: './assets/images/hostel-slide-3.jpg',
      title: 'Student Lounge & Recreation',
      category: 'Community Living'
    },
    {
      id: 4,
      image: './assets/images/hostel-slide-4.jpg',
      title: 'Quiet Study & Dining Hall',
      category: 'Academic Environment'
    },
    {
      id: 5,
      image: './assets/images/hostel-slide-5.jpg',
      title: 'Clean & Secure Corridors',
      category: '24/7 Monitored Residency'
    }
  ],

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
          <!-- Dark blue gradient overlay for optimal readability & contrast -->
          <div class="sri-ram-bg-overlay"></div>
          <!-- Subtle decorative ambient wave line -->
          <div class="sri-ram-ambient-curve"></div>
        </div>

        <!-- 2. TOP BRANDING BAR (Overlay) -->
        <header class="sri-ram-top-bar">
          <div class="sri-ram-top-left">
            <div class="sri-ram-brand-logo-wrap">
              <img src="./assets/images/sri-ram-pg-logo.svg" alt="SRI RAM PG Logo" class="sri-ram-nav-logo" />
            </div>
            <div class="sri-ram-brand-text">
              <span class="sri-ram-nav-title">SRI RAM <span class="nav-title-red">PG</span></span>
              <span class="sri-ram-nav-subtitle">Comfort | Safety | Home Away From Home</span>
            </div>
          </div>

          <div class="sri-ram-top-right">
            <span class="sri-ram-motto">Better Stays &bull; Brighter Futures</span>
          </div>
        </header>

        <!-- 3. SLIDER NAVIGATION ARROWS (Left & Right) -->
        <button 
          type="button" 
          class="sri-ram-nav-arrow arrow-left" 
          onclick="LoginPage.prevSlide()" 
          title="Previous Photo"
          aria-label="Previous Photo"
        >
          <i data-lucide="chevron-left"></i>
        </button>

        <button 
          type="button" 
          class="sri-ram-nav-arrow arrow-right" 
          onclick="LoginPage.nextSlide()" 
          title="Next Photo"
          aria-label="Next Photo"
        >
          <i data-lucide="chevron-right"></i>
        </button>

        <!-- 4. CENTER LOGIN CARD (Glassmorphism, fixed position) -->
        <main class="sri-ram-card-container">
          <div class="sri-ram-login-card">
            <!-- House & Bed Logo -->
            <div class="sri-ram-card-logo-wrap">
              <img src="./assets/images/sri-ram-pg-logo.svg" alt="SRI RAM PG" class="sri-ram-card-logo" />
            </div>

            <!-- Title & Subtitle -->
            <h1 class="sri-ram-card-title">SRI RAM <span class="title-highlight">PG</span></h1>
            <p class="sri-ram-card-subtitle">Opposite Vignan University, Vadlamudi • Your home away from home</p>

            <!-- Login Form -->
            <form id="login-form" onsubmit="LoginPage.handleSubmit(event)" novalidate>
              <!-- Username or Email Field -->
              <div class="sri-ram-field-group">
                <i data-lucide="user" class="sri-ram-field-icon"></i>
                <input 
                  type="text" 
                  id="login-username" 
                  class="sri-ram-input" 
                  placeholder="Username, Roll/Reg Number, or Email" 
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
                  placeholder="Password (Default: Reg Number)" 
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

              <div style="font-size:0.75rem;color:var(--text-muted);margin:0.25rem 0 0.85rem;background:rgba(255,255,255,0.06);padding:0.4rem 0.6rem;border-radius:var(--radius-sm);border-left:3px solid var(--primary-red);line-height:1.4;">
                🎓 <strong>Students:</strong> Enter your <strong>Registration Number</strong> as both Username & Password.
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

              <!-- Blue-to-Teal Gradient Login Button -->
              <button type="submit" id="login-submit-btn" class="sri-ram-submit-btn">
                <span>Login</span>
                <i data-lucide="arrow-right"></i>
              </button>
            </form>

            <!-- OR Divider -->
            <div class="sri-ram-divider">
              <span>OR</span>
            </div>

            <!-- Register Link -->
            <div class="sri-ram-register-row" style="margin-bottom: 0.25rem;">
              <span>Don't have an account?</span>
              <a href="javascript:void(0)" class="sri-ram-register-link" onclick="LoginPage.handleRegister(event)">
                Register
              </a>
            </div>
          </div>
        </main>

        <!-- 5. RIGHT SIDE HOSTEL THUMBNAILS & VERTICAL DOT INDICATORS -->
        <aside class="sri-ram-side-gallery">
          <div class="sri-ram-thumbs-column">
            ${this.slides.map((s, idx) => `
              <div 
                class="sri-ram-thumb-item ${idx === 0 ? 'active' : ''}" 
                id="thumb-item-${idx}" 
                onclick="LoginPage.goToSlide(${idx})"
                title="${s.title}"
                role="button"
                tabindex="0"
              >
                <div class="thumb-img-wrapper" style="background-image: url('${s.image}');"></div>
                <div class="thumb-badge ${idx === 0 ? 'active' : ''}" id="thumb-badge-${idx}">
                  ${s.id}
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Vertical Indicator Dots -->
          <div class="sri-ram-dots-column">
            ${this.slides.map((s, idx) => `
              <span 
                class="sri-ram-dot ${idx === 0 ? 'active' : ''}" 
                id="dot-item-${idx}" 
                onclick="LoginPage.goToSlide(${idx})"
                title="Slide ${s.id}"
              ></span>
            `).join('')}
          </div>
        </aside>

        <!-- 6. BOTTOM BRANDING BAR (Overlay) -->
        <footer class="sri-ram-bottom-bar">
          <div class="sri-ram-bottom-left">
            <i data-lucide="shield-check" class="bottom-shield-icon"></i>
            <span>Safe &nbsp;|&nbsp; Secure &nbsp;|&nbsp; Comfortable</span>
          </div>

          <div class="sri-ram-bottom-right">
            <span>More than just a stay...</span>
            <i data-lucide="heart" class="bottom-heart-icon"></i>
          </div>
        </footer>
      </div>
    `;
  },

  /**
   * Initializes the 2000ms auto-advancing slideshow with smooth crossfades
   */
  initSlider() {
    this.cleanup(); // Clear any existing timer
    this.currentSlide = 0;

    // Start 2000ms loop
    this.sliderTimer = setInterval(() => {
      this.nextSlide();
    }, 2000);
  },

  /**
   * Navigate to a specific slide (0-4), updating backgrounds, thumbnails, and indicator dots
   */
  goToSlide(idx) {
    if (idx < 0 || idx >= this.slides.length) return;
    this.currentSlide = idx;

    // 1. Update background slide elements
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

      // 2. Update side thumbnails
      const thumbEl = document.getElementById(`thumb-item-${i}`);
      const badgeEl = document.getElementById(`thumb-badge-${i}`);
      if (thumbEl) {
        if (i === idx) {
          thumbEl.classList.add('active');
        } else {
          thumbEl.classList.remove('active');
        }
      }
      if (badgeEl) {
        if (i === idx) {
          badgeEl.classList.add('active');
        } else {
          badgeEl.classList.remove('active');
        }
      }

      // 3. Update vertical indicator dots
      const dotEl = document.getElementById(`dot-item-${i}`);
      if (dotEl) {
        if (i === idx) {
          dotEl.classList.add('active');
        } else {
          dotEl.classList.remove('active');
        }
      }
    }

    // Reset the 2000ms timer so the user enjoys a full 2s view after manual clicks
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

  /**
   * Cleans up the background rotation interval when unmounting or navigating
   */
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

  fillCredentials(username, password) {
    const uInput = document.getElementById('login-username');
    const pInput = document.getElementById('login-password');
    if (uInput) uInput.value = username;
    if (pInput) pInput.value = password;
    Toast.info(`Credentials filled: ${username}`);
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

      const res = await API.post('/auth/login', { username, password });

      if (res && res.success) {
        // Clean up the background animation interval before leaving
        this.cleanup();

        API.setToken(res.token);
        API.setUser(res.user);
        API.setStudent(res.student);

        // Keep in-memory user reference active
        App.user = res.user;

        Toast.success(res.message || 'Welcome to SRI RAM PG!');

        // Mount authenticated layout
        App.renderAuthenticatedShell();

        // Initialize live notification listeners
        if (typeof NotificationCenter !== 'undefined') {
          NotificationCenter.init();
        }

        // Show floating AI Assistant
        const fab = document.getElementById('ai-assistant-btn');
        if (fab) fab.style.display = 'flex';

        // Role-based route dispatch
        if (res.user.role === 'admin') {
          App.navigate('dashboard');
        } else {
          App.navigate('student-dashboard');
        }
      }
    } catch (err) {
      Toast.error(err.message || 'Invalid username or password.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Login</span> <i data-lucide="arrow-right"></i>`;
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
            For your security, resident student & warden account credentials are sync-locked with SRI RAM PG Admissions & Registry.
          </p>
          <div style="background:var(--bg-secondary);padding:1rem;border-radius:var(--radius-md);border-left:3px solid #dc2626;margin-bottom:1rem;">
            <strong style="color:var(--text-primary);">Need to reset your password?</strong><br/>
            &bull; <strong>Students:</strong> Contact the hostel warden desk with your Student ID card.<br/>
            &bull; <strong>Admin / Warden:</strong> Use the Settings page inside the admin portal to update your credentials.<br/>
            &bull; <strong>Helpline:</strong> +91 120 232 4000 &bull; support@srirampg.in
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
      title: 'SRI RAM PG - Resident Registration',
      content: `
        <div style="font-size:0.9rem;color:var(--text-secondary);line-height:1.6;">
          <div style="text-align:center;margin-bottom:1.25rem;">
            <img src="./assets/images/sri-ram-pg-logo.svg" alt="SRI RAM PG" style="width:65px;height:auto;margin:0 auto 0.5rem;" />
            <h3 style="font-size:1.15rem;font-weight:800;color:var(--text-primary);margin:0;">Admissions & Bed Allocation</h3>
            <p style="font-size:0.8rem;color:var(--text-muted);margin:0.25rem 0 0;">SRI RAM PG &bull; Better Stays, Brighter Futures</p>
          </div>
          <p style="margin-bottom:0.75rem;">
            Student resident admissions and bed allocations are handled directly by the hostel administration office.
          </p>
          <ul style="padding-left:1.25rem;margin-bottom:1.25rem;font-size:0.85rem;">
            <li>If you are an enrolled resident, your account username and default password is your <strong>Registration Number</strong> (e.g. <code>2024IT123</code>).</li>
            <li>For new admissions or inquiries, visit the warden reception desk or call <strong>+91 120 232 4000</strong>.</li>
            <li>Online applications: write to <strong>admissions@srirampg.in</strong>.</li>
          </ul>
          <div style="display:flex;justify-content:flex-end;">
            <button class="btn btn-primary" onclick="Modal.close()">Close</button>
          </div>
        </div>
      `,
      maxWidth: '520px'
    });
  },

  async resetDemoDatabase() {
    try {
      Toast.info('Restoring SRI RAM PG demo records...');
      await API.post('/auth/reset-demo');
      Modal.close();
      Toast.success('Database restored! Use admin/admin123 or 2024IT123/student123.');
    } catch (e) {
      Toast.error('Failed to reset demo: ' + e.message);
    }
  }
};

window.LoginPage = LoginPage;
