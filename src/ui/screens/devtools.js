/**
 * DevTools Screen
 * Developer utilities and state inspection
 */

import { Logger } from '../../utils/logger.js';
import { showToast } from '../components/toasts.js';

export class DevToolsScreen {
    constructor(app) {
        this.app = app;
    }
    
    render() {
        const container = document.getElementById('app');
        container.innerHTML = `
            <div class="devtools-screen">
                <nav class="navbar navbar-dark bg-danger">
                    <div class="container-fluid">
                        <span class="navbar-brand">
                            <i class="bi bi-tools"></i> Developer Tools
                        </span>
                        <button id="closeBtn" class="btn btn-outline-light btn-sm">
                            <i class="bi bi-x"></i> Close
                        </button>
                    </div>
                </nav>
                
                <div class="container-fluid py-3">
                    <div class="row">
                        <!-- Actions -->
                        <div class="col-lg-4">
                            <div class="card mb-3">
                                <div class="card-header">
                                    <h6 class="mb-0">Quick Actions</h6>
                                </div>
                                <div class="card-body">
                                    <div class="d-grid gap-2">
                                        <button id="dumpStateBtn" class="btn btn-outline-primary btn-sm">
                                            <i class="bi bi-download"></i> Dump State to Console
                                        </button>
                                        
                                        <button id="copyStateBtn" class="btn btn-outline-primary btn-sm">
                                            <i class="bi bi-clipboard"></i> Copy State to Clipboard
                                        </button>
                                        
                                        <button id="simulateErrorBtn" class="btn btn-outline-warning btn-sm">
                                            <i class="bi bi-bug"></i> Simulate Network Error
                                        </button>
                                        
                                        <button id="testToastBtn" class="btn btn-outline-info btn-sm">
                                            <i class="bi bi-chat-square-text"></i> Test Toast
                                        </button>
                                        
                                        <button id="clearLogsBtn" class="btn btn-outline-danger btn-sm">
                                            <i class="bi bi-trash"></i> Clear Console Logs
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="card">
                                <div class="card-header">
                                    <h6 class="mb-0">State Inspector</h6>
                                </div>
                                <div class="card-body">
                                    <div class="mb-2">
                                        <strong>Wallet:</strong>
                                        <code class="d-block small">${this.app.walletAddress || 'None'}</code>
                                    </div>
                                    <div class="mb-2">
                                        <strong>Moments:</strong>
                                        <code>${this.app.moments?.length || 0} loaded</code>
                                    </div>
                                    <div class="mb-2">
                                        <strong>Deck:</strong>
                                        <code>${this.app.playerDeck?.length || 0} cards</code>
                                    </div>
                                    <div>
                                        <strong>Current Screen:</strong>
                                        <code>${this.app.currentScreen || 'Unknown'}</code>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Logs -->
                        <div class="col-lg-8">
                            <div class="card">
                                <div class="card-header">
                                    <h6 class="mb-0">Application Logs</h6>
                                </div>
                                <div class="card-body">
                                    <div id="devLogs" class="devtools-logs" style="height: 60vh; overflow-y: auto; font-family: monospace; font-size: 0.85rem;">
                                        <p class="text-muted">Open browser console (F12) to see detailed logs</p>
                                    </div>
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
        document.getElementById('closeBtn')?.addEventListener('click', () => {
            history.back();
        });
        
        document.getElementById('dumpStateBtn')?.addEventListener('click', () => {
            this.dumpState();
        });
        
        document.getElementById('copyStateBtn')?.addEventListener('click', () => {
            this.copyState();
        });
        
        document.getElementById('simulateErrorBtn')?.addEventListener('click', () => {
            this.simulateError();
        });
        
        document.getElementById('testToastBtn')?.addEventListener('click', () => {
            showToast('This is a test toast notification!', 'info');
        });
        
        document.getElementById('clearLogsBtn')?.addEventListener('click', () => {
            console.clear();
            showToast('Console cleared', 'success');
        });
    }
    
    dumpState() {
        console.group('🔍 Application State Dump');
        console.log('Wallet Address:', this.app.walletAddress);
        console.log('Moments:', this.app.moments);
        console.log('Player Deck:', this.app.playerDeck);
        console.log('Match Config:', this.app.matchConfig);
        console.log('Match Result:', this.app.matchResult);
        console.log('Current Screen:', this.app.currentScreen);
        console.log('Config:', window.MomentRivalsConfig);
        console.groupEnd();
        
        showToast('State dumped to console', 'success');
    }
    
    async copyState() {
        const state = {
            walletAddress: this.app.walletAddress,
            moments: this.app.moments,
            playerDeck: this.app.playerDeck,
            matchConfig: this.app.matchConfig,
            currentScreen: this.app.currentScreen
        };
        
        try {
            await navigator.clipboard.writeText(JSON.stringify(state, null, 2));
            showToast('State copied to clipboard', 'success');
        } catch (error) {
            Logger.error('Failed to copy state', { error: error.message });
            showToast('Failed to copy state', 'error');
        }
    }
    
    simulateError() {
        Logger.error('Simulated error', { test: true });
        showToast('Simulated network error - check console', 'error');
        
        // Trigger a fake error
        console.error('⚠️ SIMULATED ERROR: Network request failed');
    }
    
    destroy() {
        // Cleanup if needed
    }
}