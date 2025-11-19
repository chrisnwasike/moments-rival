/**
 * Boot Screen
 * Initial loading and version check
 */

import { Logger } from '../../utils/logger.js';
import { showLoader, hideLoader } from '../components/loader.js';

export class BootScreen {
    constructor(app) {
        this.app = app;
    }
    
    async init() {
        Logger.info('Booting application', { version: window.MomentRivalsConfig.VERSION });
        
        showLoader('Initializing Moment Rivals...');
        
        try {
            // Check browser compatibility
            this.checkCompatibility();
            
            // Load saved preferences
            this.loadPreferences();
            
            // Check if user has wallet connected
            await this.checkWalletStatus();
            
            hideLoader();
            
            // Route to appropriate screen
            this.route();
            
        } catch (error) {
            Logger.error('Boot failed', { error: error.message });
            hideLoader();
            this.showBootError(error);
        }
    }
    
    checkCompatibility() {
        // Check for required features
        const required = [
            'localStorage',
            'sessionStorage',
            'fetch',
            'Promise',
            'WebSocket'
        ];
        
        const missing = required.filter(feature => {
            if (feature === 'localStorage') return typeof localStorage === 'undefined';
            if (feature === 'sessionStorage') return typeof sessionStorage === 'undefined';
            if (feature === 'fetch') return typeof fetch === 'undefined';
            if (feature === 'Promise') return typeof Promise === 'undefined';
            if (feature === 'WebSocket') return typeof WebSocket === 'undefined';
            return false;
        });
        
        if (missing.length > 0) {
            throw new Error(`Browser missing required features: ${missing.join(', ')}`);
        }
        
        Logger.info('Browser compatibility check passed');
    }
    
    loadPreferences() {
        try {
            const prefs = localStorage.getItem('moment_rivals_preferences');
            if (prefs) {
                const parsed = JSON.parse(prefs);
                Object.assign(window.MomentRivalsConfig, parsed);
                Logger.info('Loaded user preferences');
            }
        } catch (error) {
            Logger.warn('Failed to load preferences', { error: error.message });
        }
    }
    
    async checkWalletStatus() {
        // Check if wallet was previously connected
        const walletAddress = sessionStorage.getItem('wallet_address');
        
        if (walletAddress) {
            Logger.info('Previous wallet session found', { address: walletAddress });
            this.app.walletAddress = walletAddress;
        }
    }
    
    route() {
        // Determine which screen to show
        if (window.MomentRivalsConfig.USE_MOCK) {
            Logger.info('Mock mode enabled, skipping to deck builder');
            this.app.showScreen('deck');
        } else if (this.app.walletAddress) {
            Logger.info('Wallet connected, proceeding to fetch');
            this.app.showScreen('fetch');
        } else {
            Logger.info('No wallet, showing login');
            this.app.showScreen('login');
        }
    }
    
    showBootError(error) {
        const container = document.getElementById('app');
        container.innerHTML = `
            <div class="container mt-5">
                <div class="alert alert-danger">
                    <h4 class="alert-heading">Failed to Start</h4>
                    <p>${error.message}</p>
                    <hr>
                    <p class="mb-0">
                        Please try refreshing the page or check your browser compatibility.
                    </p>
                    <button class="btn btn-primary mt-3" onclick="location.reload()">
                        Reload Page
                    </button>
                </div>
            </div>
        `;
    }
}