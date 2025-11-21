/**
 * Login Screen
 * Wallet connection via FCL
 */

import { Logger } from '../../utils/logger.js';
import { showToast } from '../components/toasts.js';
import { showLoader, hideLoader } from '../components/loader.js';

export class LoginScreen {
    constructor(app) {
        this.app = app;
    }
    
    render() {
        const container = document.getElementById('app');
        container.innerHTML = `
            <div class="login-screen w-100" style="display: flex;align-items: center;height: 100vh;">

                <div class="container">
                    <div class="row justify-content-center align-items-center ">
                        <div class="col-md-8 col-lg-6">
                            <div class="card">


                                <div class="card-body p-5 text-center">
                                    <img src="assets/img/logo_white.png" alt="Moment Rivals" class="mb-4" style="max-width: 60%;filter: drop-shadow(5px 5px 2px #00000040);">
                                    
                                    <h1 class="h3 mb-3 d-none">Moment Rivals</h1>
                                    <p class="text-muted mb-4">
                                        A strategic trading card game by Nine Lives, powered by NBA Top Shot Moments on Flow blockchain
                                    </p>
                                    
                                    <button id="connectWalletBtn" class="btn btn-primary btn-lg w-100 mb-3">
                                        <i class="bi bi-wallet2"></i> Connect Flow Wallet
                                    </button>
                                    
                                    <button id="useMockBtn" class="btn btn-outline-secondary w-100 mb-3 d-none">
                                        <i class="bi bi-play-circle"></i> Play with Demo Cards
                                    </button>
                                    
                                    <div class="text-start mt-4">
                                        <small class="text-muted">
                                            <strong>New to Flow?</strong><br>
                                            Get a wallet at 
                                            <a href="https://wallet.flow.com" target="_blank">Flow Wallet</a>
                                            <a href="https://lilico.app" target="_blank">Lilico</a>
                                        </small>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="text-center mt-3">
                                <small class="text-muted">
                                    Network: ${window.MomentRivalsConfig.FLOW_NETWORK.toUpperCase()}
                                    | 
                                    Version ${window.MomentRivalsConfig.VERSION}
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.attachEventListeners();
    }
    
    attachEventListeners() {
        document.getElementById('connectWalletBtn').addEventListener('click', () => {
            this.connectWallet();
        });
        
        $('.close-signin-modal').on('click', function() {
            $('#app').addClass('d-none');
        })
    }
    
    async connectWallet() {
        showLoader('Connecting to Flow wallet...');
        
        try {
            Logger.info('Initiating FCL authentication');
            
            // Authenticate with FCL
            await window.fcl.authenticate();
            
            // Wait for user object
            const user = await window.fcl.currentUser.snapshot();
            
            if (user.loggedIn) {
                Logger.info('Wallet connected', { address: user.addr });
                
                this.app.walletAddress = user.addr;
                sessionStorage.setItem('wallet_address', user.addr);
                
                hideLoader();
                showToast('Wallet connected successfully!', 'success');
                
                // Navigate to fetch screen
                this.app.showScreen('fetch');
            } else {
                throw new Error('Authentication failed');
            }
            
        } catch (error) {
            Logger.error('Wallet connection failed', { error: error.message });
            hideLoader();
            showToast('Failed to connect wallet. Please try again.', 'error');
        }
    }
    
    useMockMode() {
        Logger.info('Switching to mock mode');
        
        window.MomentRivalsConfig.USE_MOCK = true;
        this.app.moments = window.MomentRivalsConfig.MOCK_MOMENTS;
        
        showToast('Using demo cards for testing', 'info');
        
        // Navigate to deck builder
        this.app.showScreen('deck');
    }
    
    destroy() {
        // Cleanup if needed
    }
}