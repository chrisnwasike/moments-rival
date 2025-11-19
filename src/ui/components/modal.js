/**
 * Modal Dialogs
 * Bootstrap modal wrapper
 */

import { Logger } from '../../utils/logger.js';

/**
 * Show modal dialog
 * @param {string} title - Modal title
 * @param {string} content - Modal body content (HTML)
 * @param {Object} options - Additional options
 */
export function showModal(title, content, options = {}) {
    Logger.info('Showing modal', { title });
    
    const {
        size = '', // 'sm', 'lg', 'xl'
        centered = true,
        buttons = null, // Array of { text, class, onClick }
        backdrop = true,
        keyboard = true
    } = options;
    
    // Create modal element
    const modalId = `modal_${Date.now()}`;
    const modalEl = document.createElement('div');
    modalEl.id = modalId;
    modalEl.className = 'modal fade';
    modalEl.setAttribute('tabindex', '-1');
    
    const sizeClass = size ? `modal-${size}` : '';
    const centeredClass = centered ? 'modal-dialog-centered' : '';
    
    let buttonsHTML = '';
    if (buttons && buttons.length > 0) {
        buttonsHTML = `
            <div class="modal-footer">
                ${buttons.map((btn, idx) => `
                    <button type="button" class="btn ${btn.class || 'btn-secondary'}" data-btn-index="${idx}">
                        ${btn.text}
                    </button>
                `).join('')}
            </div>
        `;
    }
    
    modalEl.innerHTML = `
        <div class="modal-dialog ${sizeClass} ${centeredClass}">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">${title}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                ${buttonsHTML}
            </div>
        </div>
    `;
    
    document.body.appendChild(modalEl);
    
    // Attach button click handlers
    if (buttons) {
        buttons.forEach((btn, idx) => {
            const btnEl = modalEl.querySelector(`[data-btn-index="${idx}"]`);
            if (btnEl && btn.onClick) {
                btnEl.addEventListener('click', () => {
                    btn.onClick();
                });
            }
        });
    }
    
    // Initialize and show modal
    const modal = new bootstrap.Modal(modalEl, {
        backdrop: backdrop,
        keyboard: keyboard
    });
    
    modal.show();
    
    // Remove modal element after it's hidden
    modalEl.addEventListener('hidden.bs.modal', () => {
        modalEl.remove();
    });
    
    return modal;
}

/**
 * Show confirmation dialog
 * @param {string} message - Confirmation message
 * @param {Function} onConfirm - Callback on confirm
 * @param {Function} onCancel - Callback on cancel
 */
export function showConfirm(message, onConfirm, onCancel = null) {
    return showModal('Confirm', message, {
        buttons: [
            {
                text: 'Cancel',
                class: 'btn-secondary',
                onClick: () => {
                    if (onCancel) onCancel();
                }
            },
            {
                text: 'Confirm',
                class: 'btn-primary',
                onClick: onConfirm
            }
        ]
    });
}