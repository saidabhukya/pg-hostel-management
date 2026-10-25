/**
 * Dynamic Modal Component
 */
const Modal = {
  activeModal: null,

  open({ title, content, maxWidth = '680px', onClose = null }) {
    const root = document.getElementById('modal-root');
    if (!root) return;

    this.close(); // Close any existing modal

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'active-modal-overlay';

    overlay.innerHTML = `
      <div class="modal-content" style="max-width: ${maxWidth};">
        <div class="modal-header">
          <h2 class="modal-title">${title}</h2>
          <button class="modal-close-btn" onclick="Modal.close()">
            <i data-lucide="x"></i>
          </button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
      </div>
    `;

    root.appendChild(overlay);
    this.activeModal = { overlay, onClose };

    // Trigger active class for CSS transition
    setTimeout(() => {
      overlay.classList.add('active');
      Utils.renderIcons();
    }, 10);

    // Click outside to close
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        Modal.close();
      }
    });

    // ESC key listener
    const escListener = (e) => {
      if (e.key === 'Escape') {
        Modal.close();
        document.removeEventListener('keydown', escListener);
      }
    };
    document.addEventListener('keydown', escListener);
  },

  close() {
    if (this.activeModal) {
      const { overlay, onClose } = this.activeModal;
      overlay.classList.remove('active');
      setTimeout(() => {
        if (overlay.parentElement) {
          overlay.remove();
        }
        if (typeof onClose === 'function') onClose();
      }, 250);
      this.activeModal = null;
    }
  }
};

window.Modal = Modal;
