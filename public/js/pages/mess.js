/**
 * Mess & Dining Management Page Component
 * Shows Today's featured meals, 7-day schedule, student feedback, and admin menu editor
 */
const MessPage = {
  currentData: null,

  async render() {
    const user = API.getUser();
    const isAdmin = user && user.role === 'admin';

    return `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Hostel Mess & Dining Schedule</h1>
          <p>Nutritious 7-day meal plan, service hours, and dining feedback</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="MessPage.openFeedbackModal()">
            <i data-lucide="message-square" style="color:var(--primary-red);"></i>
            <span>Food Feedback / Complaint</span>
          </button>
        </div>
      </div>

      <!-- TODAY'S FEATURED MENU HERO CARD -->
      <div id="today-menu-card" class="card" style="margin-bottom:1.75rem;border-left:4px solid var(--primary-red);background:linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 100%);">
        <div style="text-align:center;padding:2rem;color:var(--text-muted);">
          Loading today's meal schedule...
        </div>
      </div>

      <!-- 7-DAY WEEKLY SCHEDULE -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <i data-lucide="calendar" style="color:var(--primary-red);"></i>
            7-Day Weekly Mess Routine
          </h3>
          <span style="font-size:0.8rem;color:var(--text-muted);">Dining Hall Ground Floor</span>
        </div>

        <div id="weekly-menu-container" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:1.25rem;">
          <p style="color:var(--text-muted);padding:1rem;">Loading weekly routine...</p>
        </div>
      </div>
    `;
  },

  async afterRender() {
    await this.loadMenu();
  },

  async loadMenu() {
    try {
      const res = await API.get('/mess');
      if (res.success && res.data) {
        this.currentData = res.data;
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDay = days[new Date().getDay()];
        const todayDayName = res.data.todayDayName || currentDay;
        const weeklyMenu = Array.isArray(res.data.weeklyMenu) ? res.data.weeklyMenu : (Array.isArray(res.data) ? res.data : []);
        const todayMenu = res.data.todayMenu || weeklyMenu.find(m => (m.day_of_week || m.day || '').toLowerCase() === todayDayName.toLowerCase()) || weeklyMenu[0];

        this.renderToday(todayDayName, todayMenu);
        this.renderWeekly(weeklyMenu, todayDayName);
      } else {
        Toast.error('Failed to load mess schedule.');
      }
    } catch (e) {
      Toast.error('Failed to load mess schedule: ' + e.message);
    }
  },

  renderToday(dayName, todayMenu) {
    const card = document.getElementById('today-menu-card');
    if (!card) return;

    if (!todayMenu) {
      card.innerHTML = `<p style="padding:1.5rem;text-align:center;color:var(--text-muted);">Menu details unavailable.</p>`;
      return;
    }

    card.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border-color);padding-bottom:1rem;margin-bottom:1.25rem;flex-wrap:wrap;gap:0.75rem;">
        <div>
          <span class="badge badge-danger" style="margin-bottom:0.25rem;font-size:0.8rem;">TODAY'S SPECIAL</span>
          <h2 style="font-size:1.45rem;font-weight:800;color:var(--text-primary);letter-spacing:-0.5px;">
            ${dayName}'s Dining Menu
          </h2>
        </div>
        <div style="font-size:0.82rem;color:var(--text-muted);">
          Service Hall: <strong>Ground Floor Wing A</strong>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:1.25rem;">
        <!-- Breakfast -->
        <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:1.15rem;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.6rem;">
            <span style="font-size:0.82rem;font-weight:800;color:var(--primary-red);text-transform:uppercase;">Breakfast</span>
            <span style="font-size:0.75rem;color:var(--text-muted);font-weight:600;">${todayMenu.breakfast_timing || '7:30 AM - 9:30 AM'}</span>
          </div>
          <p style="font-size:0.9rem;color:var(--text-primary);line-height:1.5;">${Utils.escapeHTML(todayMenu.breakfast || 'Idli, Sambar, Chutney, Tea')}</p>
        </div>

        <!-- Lunch -->
        <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:1.15rem;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.6rem;">
            <span style="font-size:0.82rem;font-weight:800;color:var(--primary-red);text-transform:uppercase;">Lunch</span>
            <span style="font-size:0.75rem;color:var(--text-muted);font-weight:600;">${todayMenu.lunch_timing || '12:30 PM - 2:30 PM'}</span>
          </div>
          <p style="font-size:0.9rem;color:var(--text-primary);line-height:1.5;">${Utils.escapeHTML(todayMenu.lunch || 'Rice, Dal, Veg Curry, Roti')}</p>
        </div>

        <!-- Dinner -->
        <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:1.15rem;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.6rem;">
            <span style="font-size:0.82rem;font-weight:800;color:var(--primary-red);text-transform:uppercase;">Dinner</span>
            <span style="font-size:0.75rem;color:var(--text-muted);font-weight:600;">${todayMenu.dinner_timing || '7:30 PM - 9:30 PM'}</span>
          </div>
          <p style="font-size:0.9rem;color:var(--text-primary);line-height:1.5;">${Utils.escapeHTML(todayMenu.dinner || 'Steamed Rice, Dal, Chapati, Dessert')}</p>
        </div>
      </div>

      ${todayMenu.special_notes ? `
        <div style="margin-top:1rem;font-size:0.82rem;color:var(--primary-red);font-weight:600;display:flex;align-items:center;gap:0.4rem;">
          <i data-lucide="sparkles" style="width:14px;height:14px;"></i>
          Chef's Special: ${Utils.escapeHTML(todayMenu.special_notes)}
        </div>
      ` : ''}
    `;

    Utils.renderIcons();
  },

  renderWeekly(weeklyMenu, todayDay) {
    const container = document.getElementById('weekly-menu-container');
    if (!container) return;

    const user = API.getUser();
    const isAdmin = user && user.role === 'admin';

    if (!Array.isArray(weeklyMenu) || weeklyMenu.length === 0) {
      container.innerHTML = `<p style="padding:1rem;color:var(--text-muted);">No routine available.</p>`;
      return;
    }

    container.innerHTML = weeklyMenu.map(m => {
      const dayName = m.day_of_week || m.day || 'Day';
      const isToday = dayName.toLowerCase() === String(todayDay || '').toLowerCase();

      return `
        <div class="card" style="padding:1.15rem;border:1px solid ${isToday ? 'var(--primary-red)' : 'var(--border-color)'};background:var(--bg-card);box-shadow:${isToday ? '0 4px 14px rgba(220, 38, 38, 0.12)' : 'none'};">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem;padding-bottom:0.5rem;border-bottom:1px solid var(--border-color);">
            <div style="display:flex;align-items:center;gap:0.5rem;">
              <h4 style="font-size:1.05rem;font-weight:800;color:var(--text-primary);">${dayName}</h4>
              ${isToday ? `<span class="badge badge-danger">Today</span>` : ''}
            </div>
            ${isAdmin ? `
              <button class="btn btn-sm btn-secondary" onclick="MessPage.openEditModal('${dayName}')" title="Edit ${dayName}'s Menu">
                <i data-lucide="edit-3" style="width:13px;height:13px;"></i>
                <span>Edit</span>
              </button>
            ` : ''}
          </div>

          <div style="display:flex;flex-direction:column;gap:0.6rem;font-size:0.85rem;">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:700;color:var(--primary-red);font-size:0.78rem;text-transform:uppercase;">Breakfast:</span>
                <span style="font-size:0.72rem;color:var(--text-muted);">${m.breakfast_timing || '7:30 AM - 9:30 AM'}</span>
              </div>
              <p style="color:var(--text-secondary);margin-top:2px;">${Utils.escapeHTML(m.breakfast || '')}</p>
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:700;color:var(--primary-red);font-size:0.78rem;text-transform:uppercase;">Lunch:</span>
                <span style="font-size:0.72rem;color:var(--text-muted);">${m.lunch_timing || '12:30 PM - 2:30 PM'}</span>
              </div>
              <p style="color:var(--text-secondary);margin-top:2px;">${Utils.escapeHTML(m.lunch || '')}</p>
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:700;color:var(--primary-red);font-size:0.78rem;text-transform:uppercase;">Dinner:</span>
                <span style="font-size:0.72rem;color:var(--text-muted);">${m.dinner_timing || '7:30 PM - 9:30 PM'}</span>
              </div>
              <p style="color:var(--text-secondary);margin-top:2px;">${Utils.escapeHTML(m.dinner || '')}</p>
            </div>
            ${m.special_notes ? `
              <div style="margin-top:0.35rem;padding-top:0.35rem;border-top:1px dashed var(--border-color);font-size:0.78rem;color:var(--primary-red);font-weight:600;">
                ⭐ ${Utils.escapeHTML(m.special_notes)}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    Utils.renderIcons();
  },

  openEditModal(dayOfWeek) {
    if (!this.currentData) return;
    const weekly = this.currentData.weeklyMenu || [];
    const item = weekly.find(m => (m.day_of_week || m.day) === dayOfWeek);
    if (!item) return;

    Modal.open({
      title: `Update Menu for ${dayOfWeek}`,
      content: `
        <form onsubmit="MessPage.submitEdit(event, '${dayOfWeek}')">
          <div class="form-group" style="margin-bottom:1.15rem;">
            <label class="form-label required">Breakfast Menu</label>
            <textarea id="edit-mess-bf" class="form-control" rows="2" required>${Utils.escapeHTML(item.breakfast)}</textarea>
          </div>

          <div class="form-group" style="margin-bottom:1.15rem;">
            <label class="form-label required">Lunch Menu</label>
            <textarea id="edit-mess-lunch" class="form-control" rows="2" required>${Utils.escapeHTML(item.lunch)}</textarea>
          </div>

          <div class="form-group" style="margin-bottom:1.15rem;">
            <label class="form-label required">Dinner Menu</label>
            <textarea id="edit-mess-dinner" class="form-control" rows="2" required>${Utils.escapeHTML(item.dinner)}</textarea>
          </div>

          <div class="form-group" style="margin-bottom:1.5rem;">
            <label class="form-label">Special Notes / Chef Special</label>
            <input type="text" id="edit-mess-notes" class="form-control" value="${Utils.escapeHTML(item.special_notes || '')}" />
          </div>

          <div style="display:flex;justify-content:flex-end;gap:0.75rem;">
            <button type="button" class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Menu</button>
          </div>
        </form>
      `,
      maxWidth: '560px'
    });
  },

  async submitEdit(e, dayOfWeek) {
    e.preventDefault();
    const breakfast = document.getElementById('edit-mess-bf').value;
    const lunch = document.getElementById('edit-mess-lunch').value;
    const dinner = document.getElementById('edit-mess-dinner').value;
    const specialNotes = document.getElementById('edit-mess-notes').value;

    try {
      const res = await API.put(`/mess/${dayOfWeek}`, {
        breakfast,
        lunch,
        dinner,
        specialNotes
      });

      if (res.success) {
        Toast.success(res.message);
        Modal.close();
        this.loadMenu();
      }
    } catch (err) {
      Toast.error(err.message);
    }
  },

  openFeedbackModal() {
    Modal.open({
      title: 'Mess & Food Feedback',
      content: `
        <form onsubmit="MessPage.submitFeedback(event)">
          <div class="form-group" style="margin-bottom:1.15rem;">
            <label class="form-label required">Subject</label>
            <input type="text" id="mess-fb-title" class="form-control" placeholder="e.g. Suggestion for Sunday dinner dessert" required />
          </div>

          <div class="form-group" style="margin-bottom:1.5rem;">
            <label class="form-label required">Feedback / Concern Details</label>
            <textarea id="mess-fb-desc" class="form-control" rows="4" placeholder="Describe taste, hygiene, food quality or timing suggestions..." required></textarea>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:0.75rem;">
            <button type="button" class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
            <button type="submit" class="btn btn-primary">Submit to Food Committee</button>
          </div>
        </form>
      `,
      maxWidth: '520px'
    });
  },

  async submitFeedback(e) {
    e.preventDefault();
    const title = document.getElementById('mess-fb-title').value;
    const description = document.getElementById('mess-fb-desc').value;

    try {
      const res = await API.post('/mess/feedback', { title, description });
      if (res.success) {
        Toast.success(res.message);
        Modal.close();
      }
    } catch (err) {
      Toast.error(err.message);
    }
  }
};

window.MessPage = MessPage;
