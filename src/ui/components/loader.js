/**
 * Loading Spinner
 * Full-screen loading indicator
 */

import { Logger } from '../../utils/logger.js';

let loaderElement = null;

/**
 * Show loading spinner
 * @param {string} message - Loading message
 */
export function showLoader(message = 'Loading...') {
    Logger.debug('Showing loader', { message });
    
    // Create loader if it doesn't exist
    if (!loaderElement) {
        loaderElement = document.createElement('div');
        loaderElement.id = 'appLoader';
        loaderElement.className = 'app-loader';
        loaderElement.innerHTML = `
            <div class="loader-backdrop"></div>
            <div class="loader-content">
                <div class="spinner-border text-primary mb-3" role="status" style="width: 3rem; height: 3rem;">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="loader-message"></p>
            </div>
        `;
        document.body.appendChild(loaderElement);
    }
    
    // Update message
    const messageEl = loaderElement.querySelector('.loader-message');
    if (messageEl) {
        messageEl.textContent = message;
    }
    
    // Show loader
    loaderElement.style.display = 'flex';
}

/**
 * Hide loading spinner
 */
export function hideLoader() {
    Logger.debug('Hiding loader');
    
    if (loaderElement) {
        loaderElement.style.display = 'none';
    }
}

/**
 * Update loader message
 * @param {string} message - New message
 */
export function updateLoader(message) {
    if (loaderElement) {
        const messageEl = loaderElement.querySelector('.loader-message');
        if (messageEl) {
            messageEl.textContent = message;
        }
    }
}