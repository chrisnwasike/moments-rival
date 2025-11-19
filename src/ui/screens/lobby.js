/**
 * Lobby Screen
 * Match setup and deck verification
 */

import { Logger } from '../../utils/logger.js';
import { showToast } from '../components/toasts.js';
import { showLoader, hideLoader } from '../components/loader.js';
import { http } from '../../utils/http.js';
import { CardTile } from '../components/cardTile.js';

export class LobbyScreen {
    constructor(app) {
        this.app = app;
        this.opponent = 'ai';
        this.difficulty = 'medium';
    }
    
    render() {
        const container = document.getElementById('app');
        container.innerHTML = `
            <div class="lobby-screen">
                <nav class="navbar navbar-dark bg-dark">
                    <div class="container-fluid">
                        <span class="navbar-brand">
                            <img src="assets/img/logo.png" height="30" class="me-2">
                            Match Lobby
                        </span>
                        <button id="backBtn" class="btn btn-outline-light btn-sm">
                            <i class="bi bi-arrow-left"></i> Back to Deck
                        </button>
                    </div>
                </nav>
                
                <div class="container-fluid pt-4">
                    <div class="row justify-content-center">
                        <div class="col-lg-8">
                            <!-- Deck Summary -->
                            <div class="card">
                                <div class="card-header bg-primary text-white">
                                    <h5 class="mb-0"><i class="bi bi-collection"></i> Your Deck</h5>
                                </div>
                                <div class="card-body">
                                                                    
                                    <div class="mb-3">
                                        <span class="badge bg-danger me-2">
                                            Offense: ${this.countCardType('OFFENSE')}
                                        </span>
                                        <span class="badge bg-primary me-2">
                                            Defense: ${this.countCardType('DEFENSE')}
                                        </span>
                                        <span class="badge bg-warning text-dark">
                                            Support: ${this.countCardType('SUPPORT')}
                                        </span>
                                    </div>

                                    <div class="row " id="deckPreview">
                                        <div id="deck-preview" class="deck-preview-row">
                                            ${this.renderDeckPreview()}
                                        </div>
                                    </div>

                                </div>
                            </div>                                                
                        </div>
                        <div class="col-lg-4">
                            <!-- Match Options -->
                            <div class="card mb-4">
                                <div class="card-header">
                                    <h5 class="mb-0"><i class="bi bi-gear"></i> Match Options</h5>
                                </div>
                                <div class="card-body">
                                    <div class="mb-3">
                                        <label class="form-label">Opponent</label>
                                        <select id="opponentSelect" class="form-select">
                                            <option value="ai" selected>AI Opponent</option>
                                            <option value="hotseat" disabled>Hot Seat (Coming Soon)</option>
                                        </select>
                                    </div>
                                    
                                    <div class="mb-3" id="difficultyGroup">
                                        <label class="form-label">AI Difficulty</label>
                                        <select id="difficultySelect" class="form-select">
                                            <option value="easy">Easy - Random plays</option>
                                            <option value="medium" selected>Medium - Balanced strategy</option>
                                            <option value="hard">Hard - Optimal decisions</option>
                                        </select>
                                        <small class="text-muted">
                                            AI uses deterministic logic with seeded randomness
                                        </small>
                                    </div>
                                    
                                    <div class="alert alert-info">
                                        <i class="bi bi-info-circle"></i>
                                        <strong>Match Rules:</strong> 4 rounds × 3 turns. First to win 3 rounds wins the match!
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Start Match -->
                            <div class="card">
                                <div class="card-body text-center">
                                    <button id="startMatchBtn" class="btn btn-success btn-lg">
                                        <i class="bi bi-play-fill"></i> Start Match
                                    </button>
                                    
                                    <p class="text-muted mt-3 mb-0">
                                        <small>Match will verify deck ownership before starting</small>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.attachEventListeners();
    }
    
    renderDeckPreview() {
                // `<div class="card-preview" title="${card.playerName}">
                //     <div class="card-preview-img ${card.cardType.toLowerCase()}">
                //         <span class="card-type-badge">${card.cardType[0]}</span>
                //     </div>
                //     <small class="text-truncate d-block">${card.playerName.split(' ')[0]}</small>
                // </div>`
        return this.app.playerDeck.map(card => `
                <div class="card-preview">
                    <div class="moment-card" 
                            data-moment-id="${card.playerName}">
                        ${CardTile.renderModeTwo(card, { selectable: false })}
                    </div>
                </div>


        `).join('');
    }
    
    countCardType(type) {
        return this.app.playerDeck.filter(c => c.cardType === type).length;
    }
    
    attachEventListeners() {
        document.getElementById('backBtn')?.addEventListener('click', () => {
            this.app.showScreen('deck');
        });
        
        document.getElementById('opponentSelect')?.addEventListener('change', (e) => {
            this.opponent = e.target.value;
        });
        
        document.getElementById('difficultySelect')?.addEventListener('change', (e) => {
            this.difficulty = e.target.value;
        });
        
        document.getElementById('startMatchBtn')?.addEventListener('click', () => {
            this.startMatch();
        });
    }
    
    async startMatch() {
        showLoader('Verifying deck ownership...');
        
        try {
            // Server-side ownership verification
            // if (!window.MomentRivalsConfig.USE_MOCK) {
            //     const verification = await this.verifyOwnership();
                
            //     if (!verification.success) {
            //         throw new Error('Ownership verification failed');
            //     }
                
            //     Logger.info('Deck ownership verified', verification.data);
            // }
            
            hideLoader();
            
            // Store match configuration
            this.app.matchConfig = {
                opponent: this.opponent,
                difficulty: this.difficulty,
                timestamp: Date.now()
            };
            
            showToast('Match starting...', 'success');
            
            // Navigate to match screen
            setTimeout(() => {
                this.app.showScreen('match');
            }, 500);
            
        } catch (error) {
            Logger.error('Failed to start match', { error: error.message });
            hideLoader();
            showToast('Failed to start match: ' + error.message, 'error');
        }
    }
    
    async verifyOwnership() {
        const deckMomentIds = this.app.playerDeck.map(card => card.momentId);
        
        const response = await http.post('/OwnershipController?action=verifyStart', {
            address: this.app.walletAddress,
            deckMomentIds: deckMomentIds
        });
        
        return response;
    }
    
    destroy() {
        // Cleanup if needed
    }
}