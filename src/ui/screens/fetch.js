/**
 * Fetch Screen
 * Fetch NBA Top Shot Moments from Flow blockchain
 */

import { Logger } from '../../utils/logger.js';
import { showToast } from '../components/toasts.js';
import { showLoader, hideLoader } from '../components/loader.js';

export class FetchScreen {
    constructor(app) {
        this.app = app;
    }
    
    render() {
        const container = document.getElementById('app');
        container.innerHTML = `
            <div class="fetch-screen">
                <div class="container">
                    <div class="row justify-content-center align-items-center min-vh-100">
                        <div class="col-md-8 col-lg-6">
                            <div class="card shadow-lg border-0">
                                <div class="card-body p-5 text-center">
                                    <h2 class="mb-4">Fetching Your Moments</h2>
                                    
                                    <div class="wallet-info mb-4 p-3 bg-light rounded">
                                        <small class="text-muted d-block mb-1">Connected Wallet</small>
                                        <code class="text-primary">${this.app.walletAddress}</code>
                                    </div>
                                    
                                    <div id="fetchProgress" class="mb-4">
                                        <div class="spinner-border text-primary mb-3" role="status">
                                            <span class="visually-hidden">Loading...</span>
                                        </div>
                                        <p class="text-muted">Reading NBA Top Shot collection from Flow blockchain...</p>
                                    </div>
                                    
                                    <div id="fetchResult" style="display: none;"></div>
                                    
                                    <button id="retryBtn" class="btn btn-outline-primary" style="display: none;">
                                        <i class="bi bi-arrow-clockwise"></i> Retry
                                    </button>
                                    
                                    <button id="useMockBtn" class="btn btn-outline-secondary mt-2" style="display: none;">
                                        Use Demo Cards Instead
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Start fetching
        this.fetchMoments();
    }
    
    async fetchMoments() {
        try {
            Logger.info('Fetching moments from Flow', { address: this.app.walletAddress });
            
            // Load Cadence script
            const scriptResponse = await fetch('../../../cadence/get_topshot_moments.cdc');
            const script = await scriptResponse.text();
            
            // Execute query
            const moments = await window.fcl.query({
                cadence: script,
                args: (arg, t) => [
                    arg(this.app.walletAddress, t.Address)
                ]
            });
            
            Logger.info('Moments fetched', { count: moments.length });
            Logger.info('Moments fetched', { moments });
            
            if (moments && moments.length > 0) {
                this.app.moments = moments;
                this.showSuccess(moments.length);
            } else {
                this.showEmpty();
            }
            
        } catch (error) {
            Logger.error('Failed to fetch moments', { error: error.message });
            this.showError(error);
        }
    }
    
    showSuccess(count) {
        const progressEl = document.getElementById('fetchProgress');
        const resultEl = document.getElementById('fetchResult');
        
        progressEl.style.display = 'none';
        resultEl.style.display = 'block';
        
        resultEl.innerHTML = `
            <div class="alert alert-success">
                <i class="bi bi-check-circle-fill"></i>
                <strong>Success!</strong> Found ${count} NBA Top Shot Moment${count !== 1 ? 's' : ''} in your collection.
            </div>
            
            <button id="continueBtn" class="btn btn-primary btn-lg w-100">
                Continue to Deck Builder <i class="bi bi-arrow-right"></i>
            </button>
        `;
        
        document.getElementById('continueBtn').addEventListener('click', () => {
            this.app.showScreen('deck');
        });
    }
    
    showEmpty() {
        const progressEl = document.getElementById('fetchProgress');
        const resultEl = document.getElementById('fetchResult');
        const mockBtn = document.getElementById('useMockBtn');
        
        progressEl.style.display = 'none';
        resultEl.style.display = 'block';
        mockBtn.style.display = 'block';
        
        resultEl.innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle-fill"></i>
                <strong>No Moments Found</strong><br>
                Your wallet doesn't contain any NBA Top Shot Moments yet.
            </div>
            
            <p class="text-muted mb-3">
                Visit <a href="https://nbatopshot.com" target="_blank">NBA Top Shot</a> 
                to collect Moments and build your deck!
            </p>
        `;
        
        mockBtn.addEventListener('click', () => {
            this.useMockMode();
        });
    }
    
    showError(error) {
        const progressEl = document.getElementById('fetchProgress');
        const resultEl = document.getElementById('fetchResult');
        const retryBtn = document.getElementById('retryBtn');
        const mockBtn = document.getElementById('useMockBtn');
        
        progressEl.style.display = 'none';
        resultEl.style.display = 'block';
        retryBtn.style.display = 'block';
        mockBtn.style.display = 'block';
        
        resultEl.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-x-circle-fill"></i>
                <strong>Error</strong><br>
                ${error.message}
            </div>
            
            <p class="text-muted">
                This could be a temporary network issue. Please try again.
            </p>
        `;
        
        retryBtn.addEventListener('click', () => {
            this.render();
        });
        
        mockBtn.addEventListener('click', () => {
            this.useMockMode();
        });
    }
    
    useMockMode() {
        Logger.info('Switching to mock mode from fetch screen');
        
        window.MomentRivalsConfig.USE_MOCK = true;
        this.app.moments = window.MomentRivalsConfig.MOCK_MOMENTS;
        
        showToast('Using demo cards for testing', 'info');
        this.app.showScreen('deck');
    }
    
    destroy() {
        // Cleanup if needed
    }
}