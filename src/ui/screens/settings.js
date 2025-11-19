/**
 * Settings Screen
 * User preferences and configuration
 */

import { Logger } from '../../utils/logger.js';
import { showToast } from '../components/toasts.js';

export class SettingsScreen {
    constructor(app) {
        this.app = app;
    }
    
    render() {
        const config = window.MomentRivalsConfig;
        
        const container = document.getElementById('app');
        container.innerHTML = `
            <div class="settings-screen">
                <nav class="navbar navbar-dark bg-dark">
                    <div class="container-fluid">
                        <span class="navbar-brand">
                            <i class="bi bi-gear"></i> Settings
                        </span>
                        <button id="backBtn" class="btn btn-outline-light btn-sm">
                            <i class="bi bi-arrow-left"></i> Back
                        </button>
                    </div>
                </nav>
                
                <div class="container py-4">
                    <div class="row justify-content-center">
                        <div class="col-lg-8">
                            <!-- Audio Settings -->
                            <div class="card mb-3">
                                <div class="card-header">
                                    <h5 class="mb-0"><i class="bi bi-volume-up"></i> Audio</h5>
                                </div>
                                <div class="card-body">
                                    <div class="form-check form-switch mb-3">
                                        <input class="form-check-input" type="checkbox" id="soundEnabled" 
                                               ${config.SOUND.ENABLED ? 'checked' : ''}>
                                        <label class="form-check-label" for="soundEnabled">
                                            Enable Sound Effects
                                        </label>
                                    </div>
                                    
                                    <label for="volumeSlider" class="form-label">
                                        Volume: <span id="volumeValue">${Math.round(config.SOUND.VOLUME * 100)}%</span>
                                    </label>
                                    <input type="range" class="form-range" min="0" max="100" 
                                           value="${config.SOUND.VOLUME * 100}" id="volumeSlider"
                                           ${!config.SOUND.ENABLED ? 'disabled' : ''}>
                                </div>
                            </div>
                            
                            <!-- Accessibility -->
                            <div class="card mb-3">
                                <div class="card-header">
                                    <h5 class="mb-0"><i class="bi bi-universal-access"></i> Accessibility</h5>
                                </div>
                                <div class="card-body">
                                    <div class="form-check form-switch mb-3">
                                        <input class="form-check-input" type="checkbox" id="reducedMotion"
                                               ${config.ACCESSIBILITY.REDUCED_MOTION ? 'checked' : ''}>
                                        <label class="form-check-label" for="reducedMotion">
                                            Reduced Motion
                                            <br><small class="text-muted">Disable animations and transitions</small>
                                        </label>
                                    </div>
                                    
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" id="highContrast"
                                               ${config.ACCESSIBILITY.HIGH_CONTRAST ? 'checked' : ''}>
                                        <label class="form-check-label" for="highContrast">
                                            High Contrast Mode
                                            <br><small class="text-muted">Increase visual contrast</small>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Gameplay -->
                            <div class="card mb-3">
                                <div class="card-header">
                                    <h5 class="mb-0"><i class="bi bi-joystick"></i> Gameplay</h5>
                                </div>
                                <div class="card-body">
                                    <div class="mb-3">
                                        <label for="animationDuration" class="form-label">
                                            Animation Speed
                                        </label>
                                        <select class="form-select" id="animationDuration">
                                            <option value="150" ${config.UI.ANIMATION_DURATION === 150 ? 'selected' : ''}>Fast</option>
                                            <option value="300" ${config.UI.ANIMATION_DURATION === 300 ? 'selected' : ''}>Normal</option>
                                            <option value="500" ${config.UI.ANIMATION_DURATION === 500 ? 'selected' : ''}>Slow</option>
                                        </select>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="autoAdvanceDelay" class="form-label">
                                            Auto-Advance Delay
                                        </label>
                                        <select class="form-select" id="autoAdvanceDelay">
                                            <option value="1000" ${config.UI.AUTO_ADVANCE_DELAY === 1000 ? 'selected' : ''}>Fast (1s)</option>
                                            <option value="2000" ${config.UI.AUTO_ADVANCE_DELAY === 2000 ? 'selected' : ''}>Normal (2s)</option>
                                            <option value="3000" ${config.UI.AUTO_ADVANCE_DELAY === 3000 ? 'selected' : ''}>Slow (3s)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Developer Options -->
                            ${config.ENVIRONMENT === 'development' ? `
                                <div class="card mb-3">
                                    <div class="card-header">
                                        <h5 class="mb-0"><i class="bi bi-code-slash"></i> Developer Options</h5>
                                    </div>
                                    <div class="card-body">
                                        <div class="form-check form-switch mb-3">
                                            <input class="form-check-input" type="checkbox" id="useMock"
                                                   ${config.USE_MOCK ? 'checked' : ''}>
                                            <label class="form-check-label" for="useMock">
                                                Use Mock Data
                                                <br><small class="text-muted">Test without wallet connection</small>
                                            </label>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label class="form-label">Log Level</label>
                                            <select class="form-select" id="logLevel">
                                                <option value="error" ${config.LOG_LEVEL === 'error' ? 'selected' : ''}>Error</option>
                                                <option value="warn" ${config.LOG_LEVEL === 'warn' ? 'selected' : ''}>Warning</option>
                                                <option value="info" ${config.LOG_LEVEL === 'info' ? 'selected' : ''}>Info</option>
                                                <option value="debug" ${config.LOG_LEVEL === 'debug' ? 'selected' : ''}>Debug</option>
                                            </select>
                                        </div>
                                        
                                        <button id="showDevToolsBtn" class="btn btn-outline-primary w-100">
                                            <i class="bi bi-tools"></i> Show Dev Tools
                                        </button>
                                    </div>
                                </div>
                            ` : ''}
                            
                            <!-- Data Management -->
                            <div class="card mb-3">
                                <div class="card-header">
                                    <h5 class="mb-0"><i class="bi bi-database"></i> Data</h5>
                                </div>
                                <div class="card-body">
                                    <button id="clearCacheBtn" class="btn btn-outline-warning w-100 mb-2">
                                        <i class="bi bi-trash"></i> Clear Cache
                                    </button>
                                    
                                    <button id="resetSettingsBtn" class="btn btn-outline-danger w-100">
                                        <i class="bi bi-arrow-counterclockwise"></i> Reset All Settings
                                    </button>
                                </div>
                            </div>
                            
                            <!-- About -->
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0"><i class="bi bi-info-circle"></i> About</h5>
                                </div>
                                <div class="card-body">
                                    <p><strong>Moment Rivals</strong></p>
                                    <p class="mb-1">Version: ${config.VERSION}</p>
                                    <p class="mb-1">Network: ${config.FLOW_NETWORK.toUpperCase()}</p>
                                    <p class="mb-0">Environment: ${config.ENVIRONMENT}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.attachEventListeners();
    }
    
    attachEventListeners() {
        document.getElementById('backBtn')?.addEventListener('click', () => {
            history.back();
        });
        
        // Sound
        document.getElementById('soundEnabled')?.addEventListener('change', (e) => {
            window.MomentRivalsConfig.SOUND.ENABLED = e.target.checked;
            document.getElementById('volumeSlider').disabled = !e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('volumeSlider')?.addEventListener('input', (e) => {
            const value = e.target.value / 100;
            window.MomentRivalsConfig.SOUND.VOLUME = value;
            document.getElementById('volumeValue').textContent = `${e.target.value}%`;
            this.saveSettings();
        });
        
        // Accessibility
        document.getElementById('reducedMotion')?.addEventListener('change', (e) => {
            window.MomentRivalsConfig.ACCESSIBILITY.REDUCED_MOTION = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('highContrast')?.addEventListener('change', (e) => {
            window.MomentRivalsConfig.ACCESSIBILITY.HIGH_CONTRAST = e.target.checked;
            this.saveSettings();
        });
        
        // Gameplay
        document.getElementById('animationDuration')?.addEventListener('change', (e) => {
            window.MomentRivalsConfig.UI.ANIMATION_DURATION = parseInt(e.target.value);
            this.saveSettings();
        });
        
        document.getElementById('autoAdvanceDelay')?.addEventListener('change', (e) => {
            window.MomentRivalsConfig.UI.AUTO_ADVANCE_DELAY = parseInt(e.target.value);
            this.saveSettings();
        });
        
        // Developer
        document.getElementById('useMock')?.addEventListener('change', (e) => {
            window.MomentRivalsConfig.USE_MOCK = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('logLevel')?.addEventListener('change', (e) => {
            window.MomentRivalsConfig.LOG_LEVEL = e.target.value;
            this.saveSettings();
        });
        
        document.getElementById('showDevToolsBtn')?.addEventListener('click', () => {
            this.app.showScreen('devtools');
        });
        
        // Data
        document.getElementById('clearCacheBtn')?.addEventListener('click', () => {
            this.clearCache();
        });
        
        document.getElementById('resetSettingsBtn')?.addEventListener('click', () => {
            this.resetSettings();
        });
    }
    
    saveSettings() {
        try {
            const settings = {
                SOUND: window.MomentRivalsConfig.SOUND,
                ACCESSIBILITY: window.MomentRivalsConfig.ACCESSIBILITY,
                UI: window.MomentRivalsConfig.UI,
                USE_MOCK: window.MomentRivalsConfig.USE_MOCK,
                LOG_LEVEL: window.MomentRivalsConfig.LOG_LEVEL
            };
            
            localStorage.setItem('moment_rivals_preferences', JSON.stringify(settings));
            Logger.info('Settings saved');
        } catch (error) {
            Logger.error('Failed to save settings', { error: error.message });
        }
    }
    
    clearCache() {
        if (confirm('Clear all cached data? This will log you out.')) {
            try {
                sessionStorage.clear();
                localStorage.removeItem('player_deck');
                showToast('Cache cleared', 'success');
                
                setTimeout(() => {
                    location.reload();
                }, 1000);
            } catch (error) {
                Logger.error('Failed to clear cache', { error: error.message });
                showToast('Failed to clear cache', 'error');
            }
        }
    }
    
    resetSettings() {
        if (confirm('Reset all settings to default?')) {
            try {
                localStorage.removeItem('moment_rivals_preferences');
                showToast('Settings reset', 'success');
                
                setTimeout(() => {
                    location.reload();
                }, 1000);
            } catch (error) {
                Logger.error('Failed to reset settings', { error: error.message });
                showToast('Failed to reset settings', 'error');
            }
        }
    }
    
    destroy() {
        // Cleanup if needed
    }
}