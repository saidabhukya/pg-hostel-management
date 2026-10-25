/**
 * Mess & Dining Management Page Component
 * Shows Today's featured meals, 7-day schedule, student feedback, and admin menu editor
 */
const MessPage = {
  currentData: null,

  async render() {
    const user = API.getUser();
    const isAdmin = user && user.role === 'admin';

    // Synchronously prepare schedule from MockData so the page renders INSTANTLY
    let data = this.currentData;
    if (!data && typeof MockData !== 'undefined' && MockData.messSchedule) {
      data = MockData.messSchedule;
      this.currentData = data;
    }

    const todayDayName = data?.todayDayName || 'Monday';
    const todayMenu = data?.todayMenu || null;
    const weeklyMenu = data?.weeklyMenu || [];

    return `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Hostel Mess & Dining Schedule</h1>
          <p>Nutritious 7-day meal plan, service hours, and dining feedback</p>
        </div>
        <div class="page-actions" style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          ${isAdmin ? `
            <button class="btn btn-primary" onclick="MessPage.openCustomBroadcastModal()">
              <i data-lucide="bell-ring" style="width:14px;height:14px;"></i>
              <span>Send Food Call-Out</span>
            </button>
          ` : ''}
          <button class="btn btn-secondary" onclick="MessPage.openFeedbackModal()">
            <i data-lucide="message-square" style="color:var(--primary-red);"></i>
            <span>Food Feedback / Complaint</span>
          </button>
        </div>
      </div>

      <!-- 15-MINUTE DINING HALL CALL-OUT ALERT SYSTEM -->
      <div id="meal-alerts-container">
        ${this.getMealAlertsHtml(isAdmin)}
      </div>

      <!-- TODAY'S FEATURED MENU HERO CARD -->
      <div id="today-menu-card" class="card" style="margin-bottom:1.75rem;border-left:4px solid var(--primary-red);background:linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 100%);">
        ${this.getTodayHtml(todayDayName, todayMenu)}
      </div>

      <!-- 7-DAY WEEKLY SCHEDULE -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <i data-lucide="calendar" style="color:var(--primary-red);"></i>
            7-Day Weekly Mess Routine
          </h3>
          <span style="font-size:0.8rem;color:var(--text-muted);">Dining Hall Ground Floor • Pure Vegetarian & Healthy Balanced Diet</span>
        </div>

        <div id="weekly-menu-container" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:1.25rem;">
          ${this.getWeeklyHtml(weeklyMenu, todayDayName, isAdmin)}
        </div>
      </div>
    `;
  },

  async afterRender() {
    Utils.renderIcons();
    await this.loadMenu();
  },

  getTodayHtml(dayName, todayMenu) {
    if (!todayMenu) {
      return `<p style="padding:1.5rem;text-align:center;color:var(--text-muted);">Today's menu details loading...</p>`;
    }

    return `
      <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border-color);padding-bottom:1rem;margin-bottom:1.25rem;flex-wrap:wrap;gap:0.75rem;">
        <div>
          <span class="badge badge-danger" style="margin-bottom:0.25rem;font-size:0.8rem;">TODAY'S SPECIAL • VIGNAN VIHAR BOYS HOSTEL</span>
          <h2 style="font-size:1.45rem;font-weight:800;color:var(--text-primary);letter-spacing:-0.5px;">
            ${dayName}'s Dining Menu
          </h2>
        </div>
        <div style="font-size:0.82rem;color:var(--text-muted);">
          Service Hall: <strong>Ground Floor Main Dining Hall</strong>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:1rem;">
        <!-- Breakfast -->
        <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:1rem;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem;">
            <span style="font-size:0.8rem;font-weight:800;color:var(--primary-red);text-transform:uppercase;">🍳 Break Fast</span>
            <span style="font-size:0.72rem;color:var(--text-muted);font-weight:600;">${todayMenu.breakfast_timing || '7:30 AM - 9:30 AM'}</span>
          </div>
          <p style="font-size:0.86rem;color:var(--text-primary);line-height:1.45;">${Utils.escapeHTML(todayMenu.breakfast || '-')}</p>
        </div>

        <!-- Lunch -->
        <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:1rem;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem;">
            <span style="font-size:0.8rem;font-weight:800;color:var(--primary-red);text-transform:uppercase;">🍲 Lunch</span>
            <span style="font-size:0.72rem;color:var(--text-muted);font-weight:600;">${todayMenu.lunch_timing || '12:30 PM - 2:30 PM'}</span>
          </div>
          <p style="font-size:0.86rem;color:var(--text-primary);line-height:1.45;">${Utils.escapeHTML(todayMenu.lunch || '-')}</p>
        </div>

        <!-- Snacks -->
        <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:1rem;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem;">
            <span style="font-size:0.8rem;font-weight:800;color:var(--primary-red);text-transform:uppercase;">☕ Snacks</span>
            <span style="font-size:0.72rem;color:var(--text-muted);font-weight:600;">${todayMenu.snacks_timing || '4:30 PM - 6:00 PM'}</span>
          </div>
          <p style="font-size:0.86rem;color:var(--text-primary);line-height:1.45;">${Utils.escapeHTML(todayMenu.snacks || '-')}</p>
        </div>

        <!-- Dinner -->
        <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:1rem;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem;">
            <span style="font-size:0.8rem;font-weight:800;color:var(--primary-red);text-transform:uppercase;">🍽️ Dinner</span>
            <span style="font-size:0.72rem;color:var(--text-muted);font-weight:600;">${todayMenu.dinner_timing || '7:30 PM - 9:30 PM'}</span>
          </div>
          <p style="font-size:0.86rem;color:var(--text-primary);line-height:1.45;">${Utils.escapeHTML(todayMenu.dinner || '-')}</p>
        </div>
      </div>

      ${todayMenu.special_notes ? `
        <div style="margin-top:1rem;font-size:0.84rem;color:var(--primary-red);font-weight:700;display:flex;align-items:center;gap:0.4rem;">
          <i data-lucide="sparkles" style="width:15px;height:15px;"></i>
          <span>Hostel Chef's Special: ${Utils.escapeHTML(todayMenu.special_notes)}</span>
        </div>
      ` : ''}
    `;
  },

  getWeeklyHtml(weeklyMenu, todayDay, isAdmin) {
    if (!Array.isArray(weeklyMenu) || weeklyMenu.length === 0) {
      return `<p style="padding:1rem;color:var(--text-muted);">Weekly menu routine loading...</p>`;
    }

    return weeklyMenu.map(m => {
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

          <div style="display:flex;flex-direction:column;gap:0.55rem;font-size:0.83rem;">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:700;color:var(--primary-red);font-size:0.76rem;text-transform:uppercase;">🍳 Break Fast:</span>
                <span style="font-size:0.7rem;color:var(--text-muted);">${m.breakfast_timing || '7:30 AM - 9:30 AM'}</span>
              </div>
              <p style="color:var(--text-secondary);margin-top:2px;">${Utils.escapeHTML(m.breakfast || '')}</p>
            </div>

            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:700;color:var(--primary-red);font-size:0.76rem;text-transform:uppercase;">🍲 Lunch:</span>
                <span style="font-size:0.7rem;color:var(--text-muted);">${m.lunch_timing || '12:30 PM - 2:30 PM'}</span>
              </div>
              <p style="color:var(--text-secondary);margin-top:2px;">${Utils.escapeHTML(m.lunch || '')}</p>
            </div>

            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:700;color:var(--primary-red);font-size:0.76rem;text-transform:uppercase;">☕ Snacks:</span>
                <span style="font-size:0.7rem;color:var(--text-muted);">${m.snacks_timing || '4:30 PM - 6:00 PM'}</span>
              </div>
              <p style="color:var(--text-secondary);margin-top:2px;">${Utils.escapeHTML(m.snacks || '')}</p>
            </div>

            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:700;color:var(--primary-red);font-size:0.76rem;text-transform:uppercase;">🍽️ Dinner:</span>
                <span style="font-size:0.7rem;color:var(--text-muted);">${m.dinner_timing || '7:30 PM - 9:30 PM'}</span>
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

        const card = document.getElementById('today-menu-card');
        if (card) card.innerHTML = this.getTodayHtml(todayDayName, todayMenu);

        const container = document.getElementById('weekly-menu-container');
        const user = API.getUser();
        const isAdmin = user && user.role === 'admin';
        if (container) container.innerHTML = this.getWeeklyHtml(weeklyMenu, todayDayName, isAdmin);

        const alertsContainer = document.getElementById('meal-alerts-container');
        if (alertsContainer) alertsContainer.innerHTML = this.getMealAlertsHtml(isAdmin);

        Utils.renderIcons();
      }
    } catch (e) {
      console.warn('Live mess reload:', e.message);
    }
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
            <label class="form-label required">Break Fast Menu</label>
            <textarea id="edit-mess-bf" class="form-control" rows="2" required>${Utils.escapeHTML(item.breakfast || '')}</textarea>
          </div>

          <div class="form-group" style="margin-bottom:1.15rem;">
            <label class="form-label required">Lunch Menu</label>
            <textarea id="edit-mess-lunch" class="form-control" rows="2" required>${Utils.escapeHTML(item.lunch || '')}</textarea>
          </div>

          <div class="form-group" style="margin-bottom:1.15rem;">
            <label class="form-label required">Evening Snacks</label>
            <textarea id="edit-mess-snacks" class="form-control" rows="2" required>${Utils.escapeHTML(item.snacks || '')}</textarea>
          </div>

          <div class="form-group" style="margin-bottom:1.15rem;">
            <label class="form-label required">Dinner Menu</label>
            <textarea id="edit-mess-dinner" class="form-control" rows="2" required>${Utils.escapeHTML(item.dinner || '')}</textarea>
          </div>

          <div class="form-group" style="margin-bottom:1.5rem;">
            <label class="form-label">Special Notes / Chef Special</label>
            <input type="text" id="edit-mess-notes" class="form-control" value="${Utils.escapeHTML(item.special_notes || '')}" placeholder="e.g. Special Sunday Dessert / South Indian Sambhar" />
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
    const snacks = document.getElementById('edit-mess-snacks').value;
    const dinner = document.getElementById('edit-mess-dinner').value;
    const specialNotes = document.getElementById('edit-mess-notes').value;

    try {
      const res = await API.put(`/mess/${dayOfWeek}`, {
        breakfast,
        lunch,
        snacks,
        dinner,
        specialNotes
      });

      if (res.success) {
        Toast.success(res.message || `Menu for ${dayOfWeek} updated!`);
        Modal.close();
        await this.loadMenu();
      }
    } catch (err) {
      Toast.error(err.message || 'Failed to update menu.');
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
        Toast.success(res.message || 'Feedback submitted successfully!');
        Modal.close();
      }
    } catch (err) {
      Toast.error(err.message || 'Failed to submit feedback.');
    }
  },

  getMealAlertsHtml(isAdmin) {
    const statuses = (typeof MockData !== 'undefined' && typeof MockData.getMealAlertsStatus === 'function')
      ? MockData.getMealAlertsStatus()
      : [];

    return `
      <div class="card" style="margin-bottom:1.75rem;border:1px solid rgba(220, 38, 38, 0.25);background:var(--bg-card);box-shadow:0 4px 15px rgba(220, 38, 38, 0.05);">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.75rem;">
          <div>
            <h3 class="card-title" style="display:flex;align-items:center;gap:0.5rem;color:var(--text-primary);font-size:1.08rem;">
              <i data-lucide="bell-ring" style="color:var(--primary-red);"></i>
              15-Minute Dining Hall Call-Out Alerts (Come to Mess)
            </h3>
            <span style="font-size:0.79rem;color:var(--text-muted);display:block;margin-top:0.2rem;">
              Automated & instant notifications sent 15 minutes before meal times to <strong>every resident student</strong> & <strong>admin portal</strong> calling all to eat food.
            </span>
          </div>
          ${isAdmin ? `
            <button class="btn btn-sm btn-primary" onclick="MessPage.openCustomBroadcastModal()" style="display:flex;align-items:center;gap:0.35rem;">
              <i data-lucide="megaphone" style="width:13px;height:13px;"></i>
              <span>Broadcast Custom Alert</span>
            </button>
          ` : ''}
        </div>

        <div style="padding:1.15rem;">
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(230px, 1fr));gap:1rem;">
            ${statuses.map(s => `
              <div style="background:var(--bg-secondary);border:1px solid ${s.isSent ? 'rgba(34, 197, 94, 0.45)' : 'var(--border-color)'};border-radius:var(--radius-md);padding:1rem;display:flex;flex-direction:column;justify-content:space-between;">
                <div>
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.45rem;">
                    <span style="font-size:0.95rem;font-weight:800;color:var(--text-primary);display:flex;align-items:center;gap:0.35rem;">
                      <span>${s.icon}</span> ${s.name}
                    </span>
                    ${s.isSent ? `
                      <span class="badge badge-success" style="font-size:0.68rem;display:inline-flex;align-items:center;gap:0.25rem;">
                        <i data-lucide="check" style="width:11px;height:11px;"></i> Sent Today
                      </span>
                    ` : `
                      <span class="badge badge-warning" style="font-size:0.68rem;display:inline-flex;align-items:center;gap:0.25rem;">
                        <i data-lucide="clock" style="width:11px;height:11px;"></i> Auto-Scheduled
                      </span>
                    `}
                  </div>

                  <div style="font-size:0.77rem;color:var(--text-muted);margin-bottom:0.25rem;">
                    ⏰ Dining Time: <strong>${s.timing}</strong>
                  </div>
                  <div style="font-size:0.75rem;color:var(--primary-red);font-weight:700;margin-bottom:0.5rem;display:flex;align-items:center;gap:0.3rem;">
                    <i data-lucide="bell" style="width:12px;height:12px;"></i>
                    <span>Alert Time: ${s.alertTimeDisplay}</span>
                  </div>

                  <div style="font-size:0.77rem;color:var(--text-secondary);background:var(--bg-card);padding:0.45rem 0.6rem;border-radius:var(--radius-sm);border:1px solid var(--border-color);line-height:1.35;max-height:55px;overflow:hidden;text-overflow:ellipsis;">
                    <strong style="color:var(--text-primary);">Menu:</strong> ${Utils.escapeHTML(s.menu)}
                  </div>
                </div>

                <div style="margin-top:0.85rem;">
                  ${isAdmin ? `
                    <button class="btn btn-sm ${s.isSent ? 'btn-secondary' : 'btn-primary'}" onclick="MessPage.sendMealAlert('${s.key}')" style="width:100%;display:flex;align-items:center;justify-content:center;gap:0.35rem;font-size:0.75rem;padding:0.38rem 0.5rem;">
                      <i data-lucide="${s.isSent ? 'refresh-cw' : 'send'}" style="width:12px;height:12px;"></i>
                      <span>${s.isSent ? 'Re-send Call to Mess' : 'Send Come to Mess Alert'}</span>
                    </button>
                  ` : `
                    <div style="font-size:0.73rem;color:var(--text-muted);text-align:center;padding:0.2rem 0;">
                      ${s.isSent ? `Delivered to your notification bell (${s.sentAt || 'Today'})` : `Notification will pop up 15m before`}
                    </div>
                  `}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  async sendMealAlert(mealKey) {
    try {
      Toast.info('Sending dining alert to all residents & admin...');
      const res = await API.post('/mess/send-alert', { mealType: mealKey });
      if (res.success) {
        Toast.success(res.message || 'Notification sent to all residents and admin!');
        if (window.NotificationCenter && typeof window.NotificationCenter.fetchNotifications === 'function') {
          await window.NotificationCenter.fetchNotifications();
        }
        await this.loadMenu();
      }
    } catch (err) {
      Toast.error(err.message || 'Failed to send meal notification.');
    }
  },

  openCustomBroadcastModal() {
    Modal.open({
      title: 'Broadcast Meal Call-Out (Come to Mess)',
      content: `
        <form onsubmit="MessPage.submitCustomBroadcast(event)">
          <div class="form-group" style="margin-bottom:1.15rem;">
            <label class="form-label required">Select Meal</label>
            <select id="broadcast-meal-type" class="form-control" required>
              <option value="breakfast">🍳 Break Fast (Starts 7:30 AM)</option>
              <option value="lunch">🍲 Lunch (Starts 12:30 PM)</option>
              <option value="snacks">☕ Evening Snacks (Starts 4:30 PM)</option>
              <option value="dinner" selected>🍽️ Dinner (Starts 7:30 PM)</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom:1.15rem;">
            <label class="form-label required">Notification Title</label>
            <input type="text" id="broadcast-meal-title" class="form-control" value="🍽️ Food is Ready - Please Come to Mess!" required />
          </div>

          <div class="form-group" style="margin-bottom:1.5rem;">
            <label class="form-label required">Message (Delivered to All Students & Admin)</label>
            <textarea id="broadcast-meal-msg" class="form-control" rows="3" required>Dear Residents, delicious hot food is now ready and being served in the Ground Floor Dining Hall. Please come down to the mess to eat food!</textarea>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.35rem;">
              🔔 This alert will appear instantly in the notification bell for every resident student and admin portal.
            </div>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:0.75rem;">
            <button type="button" class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
            <button type="submit" class="btn btn-primary" style="display:flex;align-items:center;gap:0.4rem;">
              <i data-lucide="send" style="width:14px;height:14px;"></i>
              <span>Broadcast to All</span>
            </button>
          </div>
        </form>
      `,
      maxWidth: '540px'
    });
    Utils.renderIcons();
  },

  async submitCustomBroadcast(e) {
    e.preventDefault();
    const mealType = document.getElementById('broadcast-meal-type').value;
    const customTitle = document.getElementById('broadcast-meal-title').value;
    const customMessage = document.getElementById('broadcast-meal-msg').value;

    try {
      Toast.info('Broadcasting meal call-out...');
      const res = await API.post('/mess/send-alert', {
        mealType,
        customTitle,
        customMessage
      });
      if (res.success) {
        Toast.success('Notification broadcasted to all students & admin portal!');
        Modal.close();
        if (window.NotificationCenter && typeof window.NotificationCenter.fetchNotifications === 'function') {
          await window.NotificationCenter.fetchNotifications();
        }
        await this.loadMenu();
      }
    } catch (err) {
      Toast.error(err.message || 'Failed to send alert.');
    }
  }
};

window.MessPage = MessPage;
