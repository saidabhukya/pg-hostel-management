/**
 * Toast Notification Component
 */
const Toast = {
  show(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-root');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle-2';
    else if (type === 'error') iconName = 'alert-triangle';
    else if (type === 'warning') iconName = 'alert-circle';

    toast.innerHTML = `
      <i data-lucide="${iconName}" style="flex-shrink:0;"></i>
      <span style="flex:1;">${Utils.escapeHTML(message)}</span>
      <button style="background:none;border:none;cursor:pointer;color:var(--text-muted);display:flex;align-items:center;" onclick="this.parentElement.remove()">
        <i data-lucide="x" style="width:16px;height:16px;"></i>
      </button>
    `;

    container.appendChild(toast);
    Utils.renderIcons();

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
  },

  success(msg) { this.show(msg, 'success'); },
  error(msg) { this.show(msg, 'error', 5000); },
  warning(msg) { this.show(msg, 'warning'); },
  info(msg) { this.show(msg, 'info'); }
};

window.Toast = Toast;
