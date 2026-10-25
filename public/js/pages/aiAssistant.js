/**
 * AI Hostel Assistant Modal / Drawer Component
 * Modular intelligent chat interface providing real-time queries for fees, mess, rooms, and regulations
 */
const AiAssistantModal = {
  chatHistory: [],

  open() {
    const user = API.getUser();
    const isStudent = user && user.role === 'student';

    const suggestedPrompts = isStudent ? [
      'When is my next fee due?',
      'What is today\'s menu?',
      'What is the status of my complaints?',
      'What is my room and bed number?',
      'What are the hostel curfew hours?'
    ] : [
      'What complaints need attention?',
      'What is the current bed occupancy rate?',
      'Give me a summary of hostel financials',
      'How much fee is pending this month?'
    ];

    const content = `
      <div style="display:flex;flex-direction:column;height:520px;">
        <!-- Header notice -->
        <div style="background:var(--bg-secondary);padding:0.75rem 1rem;border-radius:var(--radius-md);margin-bottom:1rem;font-size:0.8rem;color:var(--text-secondary);display:flex;align-items:center;gap:0.5rem;border-left:3px solid var(--primary-red);">
          <i data-lucide="sparkles" style="color:var(--primary-red);width:16px;height:16px;flex-shrink:0;"></i>
          <span>Hostel AI Assistant powered by smart contextual reasoning. Ask questions about fees, food, beds, and rules.</span>
        </div>

        <!-- Chat Conversation Messages -->
        <div id="ai-messages-container" style="flex:1;overflow-y:auto;padding-right:0.5rem;display:flex;flex-direction:column;gap:0.85rem;">
          <!-- Welcome Message -->
          <div style="display:flex;gap:0.75rem;">
            <div class="user-avatar" style="width:32px;height:32px;background:var(--primary-red);color:#fff;font-size:0.75rem;flex-shrink:0;">
              AI
            </div>
            <div style="background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:var(--radius-lg);border-top-left-radius:2px;padding:0.85rem 1.1rem;font-size:0.88rem;color:var(--text-primary);max-width:85%;line-height:1.5;">
              Hello ${Utils.escapeHTML(user ? user.name : 'Resident')}! I am your <strong>PG Hostel AI Assistant</strong>. How can I help you today?
            </div>
          </div>
        </div>

        <!-- Quick Prompt Suggestions -->
        <div style="display:flex;gap:0.5rem;overflow-x:auto;padding:0.75rem 0 0.5rem;margin-top:auto;" id="ai-prompt-pills">
          ${suggestedPrompts.map(p => `
            <button class="btn btn-sm btn-secondary" style="font-size:0.75rem;white-space:nowrap;padding:0.3rem 0.65rem;" onclick="AiAssistantModal.sendPrompt('${p.replace(/'/g, "\\'")}')">
              ${p}
            </button>
          `).join('')}
        </div>

        <!-- Chat Input Form -->
        <form onsubmit="AiAssistantModal.handleSubmit(event)" style="display:flex;gap:0.5rem;margin-top:0.5rem;padding-top:0.75rem;border-top:1px solid var(--border-color);">
          <input 
            type="text" 
            id="ai-user-input" 
            class="form-control" 
            placeholder="Type your hostel query here (e.g. When is my next fee due?)..." 
            autocomplete="off"
            required 
          />
          <button type="submit" id="ai-send-btn" class="btn btn-primary" style="padding:0.6rem 1.1rem;">
            <i data-lucide="send" style="width:16px;height:16px;"></i>
          </button>
        </form>
      </div>
    `;

    Modal.open({
      title: 'AI Hostel Assistant',
      content,
      maxWidth: '640px'
    });

    setTimeout(() => {
      const input = document.getElementById('ai-user-input');
      if (input) input.focus();
    }, 150);
  },

  sendPrompt(text) {
    const input = document.getElementById('ai-user-input');
    if (input) {
      input.value = text;
      this.handleSubmit(new Event('submit'));
    }
  },

  async handleSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const input = document.getElementById('ai-user-input');
    const sendBtn = document.getElementById('ai-send-btn');
    if (!input) return;

    const query = input.value.trim();
    if (!query) return;

    input.value = '';
    this.appendMessage('user', query);

    try {
      if (sendBtn) sendBtn.disabled = true;

      // Loading bubble
      const loadingId = this.appendLoading();

      const res = await API.post('/ai-assistant/query', { question: query });

      this.removeLoading(loadingId);

      if (res.success && res.data) {
        this.appendMessage('assistant', res.data.answer, res.data.quickActions);
      } else {
        this.appendMessage('assistant', 'Sorry, I could not process your query at this time.');
      }
    } catch (err) {
      this.appendMessage('assistant', 'Error connecting to AI service: ' + err.message);
    } finally {
      if (sendBtn) sendBtn.disabled = false;
      Utils.renderIcons();
    }
  },

  appendMessage(role, text, quickActions = []) {
    const container = document.getElementById('ai-messages-container');
    if (!container) return;

    const isUser = role === 'user';
    const user = API.getUser();

    const formattedText = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/• /g, '• ')
      .replace(/\n/g, '<br/>');

    const msgHtml = `
      <div style="display:flex;gap:0.75rem;justify-content:${isUser ? 'flex-end' : 'flex-start'};">
        ${!isUser ? `
          <div class="user-avatar" style="width:32px;height:32px;background:var(--primary-red);color:#fff;font-size:0.75rem;flex-shrink:0;">
            AI
          </div>
        ` : ''}

        <div style="background:${isUser ? 'var(--primary-red)' : 'var(--bg-secondary)'};color:${isUser ? '#ffffff' : 'var(--text-primary)'};border:1px solid ${isUser ? 'var(--primary-red)' : 'var(--border-color)'};border-radius:var(--radius-lg);${isUser ? 'border-top-right-radius:2px;' : 'border-top-left-radius:2px;'}padding:0.85rem 1.1rem;font-size:0.88rem;max-width:85%;line-height:1.5;">
          ${formattedText}

          ${quickActions && quickActions.length > 0 ? `
            <div style="display:flex;gap:0.4rem;margin-top:0.75rem;flex-wrap:wrap;">
              ${quickActions.map(a => `
                <button class="btn btn-sm btn-secondary" style="font-size:0.72rem;padding:0.25rem 0.5rem;" onclick="Modal.close(); App.navigate('${a.link.replace('#', '')}')">
                  ${a.label} →
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>

        ${isUser ? `
          <div class="user-avatar" style="width:32px;height:32px;background:var(--primary-red-light);color:var(--primary-red);font-size:0.75rem;flex-shrink:0;">
            ${user ? user.name.charAt(0) : 'U'}
          </div>
        ` : ''}
      </div>
    `;

    container.insertAdjacentHTML('beforeend', msgHtml);
    container.scrollTop = container.scrollHeight;
    Utils.renderIcons();
  },

  appendLoading() {
    const container = document.getElementById('ai-messages-container');
    if (!container) return null;

    const id = 'loading-' + Date.now();
    const loadingHtml = `
      <div id="${id}" style="display:flex;gap:0.75rem;">
        <div class="user-avatar" style="width:32px;height:32px;background:var(--primary-red);color:#fff;font-size:0.75rem;flex-shrink:0;">AI</div>
        <div style="background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:var(--radius-lg);border-top-left-radius:2px;padding:0.85rem 1.1rem;font-size:0.88rem;color:var(--text-muted);">
          Thinking...
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', loadingHtml);
    container.scrollTop = container.scrollHeight;
    return id;
  },

  removeLoading(id) {
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.remove();
  }
};

window.AiAssistantModal = AiAssistantModal;
