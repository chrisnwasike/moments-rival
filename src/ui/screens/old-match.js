/**
 * Match Screen
 * Main gameplay HUD
 */

import { Logger } from '../../utils/logger.js';
import { showToast } from '../components/toasts.js';
import { createInitialState, transition, STATES } from '../../core/stateMachine.js';
import { AIBot } from '../../core/aiBot.js';
import { CardTile } from '../components/cardTile.js';
import { EnergyMeter } from '../components/meters.js';

export class MatchScreen {
    constructor(app) {
        this.app = app;
        this.gameState = null;
        this.aiBot = null;
        this.autoAdvanceTimeout = null;
    }
    
    render() {
        // Initialize game
        this.initGame();
        
        const container = document.getElementById('app');
        container.innerHTML = `
            <div class="match-screen">
                ${this.renderHUD()}
                
                <div class="container-fluid py-3">
                    <div class="row">
                        <!-- Main Play Area -->
                        <div class="col-lg-9">
                            ${this.renderBoard()}
                            ${this.renderPlayerArea()}
                        </div>
                        
                        <!-- Event Log -->
                        <div class="col-lg-3">
                            ${this.renderLog()}
                        </div>
                    </div>
                </div>
                
                ${this.renderRevealModal()}
            </div>
        `;
        
        this.attachEventListeners();
        this.updateUI();
        
        // Start match
        this.startMatch();
    }
    
    initGame() {
        const config = window.MomentRivalsConfig.GAME;
        
        // Create opponent deck (simplified for AI)
        const opponentDeck = this.createOpponentDeck();
        
        // Initialize game state
        this.gameState = createInitialState(this.app.playerDeck, opponentDeck, config);
        
        // Initialize AI
        const seed = Date.now();
        this.aiBot = new AIBot(seed, this.app.matchConfig.difficulty);
        
        Logger.info('Match initialized', { 
            matchId: this.gameState.matchId,
            difficulty: this.app.matchConfig.difficulty
        });
    }
    
    createOpponentDeck() {
        // Create balanced AI deck
        const deck = [];
        
        // 3 offense cards
        for (let i = 0; i < 3; i++) {
            deck.push({
                id: `ai_off_${i}`,
                playerName: `AI Offense ${i + 1}`,
                cardType: 'OFFENSE',
                offense: 5 + i,
                defense: 2,
                speed: 5,
                agility: 4,
                energyCost: 1 + i,
                momentId: null
            });
        }
        
        // 3 defense cards
        for (let i = 0; i < 3; i++) {
            deck.push({
                id: `ai_def_${i}`,
                playerName: `AI Defense ${i + 1}`,
                cardType: 'DEFENSE',
                offense: 2,
                defense: 5 + i,
                speed: 4,
                agility: 3,
                energyCost: 1 + i,
                momentId: null
            });
        }
        
        // 1 support card
        deck.push({
            id: 'ai_sup_0',
            playerName: 'AI Support',
            cardType: 'SUPPORT',
            offense: 3,
            defense: 3,
            speed: 6,
            agility: 6,
            energyCost: 1,
            momentId: null
        });
        
        return deck;
    }
    
    renderHUD() {
        return `
            <nav class="navbar navbar-dark bg-dark sticky-top">
                <div class="container-fluid">
                    <span class="navbar-brand">
                        <i class="bi bi-trophy"></i>
                        Round ${this.gameState?.currentRound || 1} / ${this.gameState?.config.ROUNDS || 4}
                        - Turn ${this.gameState?.currentTurn || 1} / ${this.gameState?.config.TURNS_PER_ROUND || 3}
                    </span>
                    
                    <div class="d-flex align-items-center gap-3">
                        <span class="badge bg-primary">
                            Rounds Won: You ${this.gameState?.player.roundsWon || 0} - ${this.gameState?.opponent.roundsWon || 0} AI
                        </span>
                        
                        <button id="forfeitBtn" class="btn btn-outline-danger btn-sm">
                            <i class="bi bi-flag"></i> Forfeit
                        </button>
                    </div>
                </div>
            </nav>
        `;
    }
    
    renderBoard() {
        const state = this.gameState;
        
        return `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="row">
                        ${state.rounds.map((round, rIdx) => this.renderRoundColumn(round, rIdx)).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
    renderRoundColumn(round, rIdx) {
        const isCurrent = rIdx === this.gameState.currentRound - 1;
        const isComplete = round.winner !== null;
        
        return `
            <div class="col-3">
                <div class="round-column ${isCurrent ? 'active' : ''} ${isComplete ? 'complete' : ''}">
                    <h6 class="round-header">
                        Round ${round.roundNumber}
                        ${isComplete ? `<br><small class="text-${round.winner === 'player' ? 'success' : round.winner === 'opponent' ? 'danger' : 'warning'}">${round.winner === 'tie' ? 'Tie' : round.winner === 'player' ? 'Won' : 'Lost'}</small>` : ''}
                    </h6>
                    
                    ${round.turns.map((turn, tIdx) => this.renderTurnCell(turn, tIdx, rIdx)).join('')}
                    
                    ${isComplete ? `
                        <div class="round-score mt-2">
                            <small>
                                You: ${round.finalScore.player}<br>
                                AI: ${round.finalScore.opponent}
                            </small>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    renderTurnCell(turn, tIdx, rIdx) {
        const isCurrent = rIdx === this.gameState.currentRound - 1 && 
                         tIdx === this.gameState.currentTurn - 1;
        
        return `
            <div class="turn-cell ${isCurrent ? 'current' : ''} ${turn.resolved ? 'resolved' : ''}">
                <div class="turn-label">Turn ${turn.turnNumber}</div>
                
                ${turn.playerPlay ? `
                    <div class="play player-play">
                        <small>${this.describePlay(turn.playerPlay)}</small>
                    </div>
                ` : ''}
                
                ${turn.opponentPlay ? `
                    <div class="play opponent-play">
                        <small>${this.describePlay(turn.opponentPlay)}</small>
                    </div>
                ` : ''}
                
                ${turn.resolved ? `
                    <div class="turn-score">
                        <span class="badge bg-success">${turn.playerPoints}</span>
                        <span class="badge bg-danger">${turn.opponentPoints}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    describePlay(play) {
        if (!play) return '—';
        if (play.type === 'PASS') return 'PASS';
        
        const cards = play.cards || [];
        if (cards.length === 0) return '—';
        
        return cards.map(c => c.playerName.split(' ')[0]).join(' + ');
    }
    
    renderPlayerArea() {
        const state = this.gameState;
        
        return `
            <div class="card">
                <div class="card-body">
                    <!-- Energy Display -->
                    <div class="row mb-3">
                        <div class="col-6">
                            <label class="form-label">Your Energy</label>
                            ${EnergyMeter.render(state.player.energy, 10, 'success')}
                        </div>
                        <div class="col-6">
                            <label class="form-label">AI Energy</label>
                            ${EnergyMeter.render(state.opponent.energy, 10, 'danger')}
                        </div>
                    </div>
                    
                    <!-- Hand -->
                    <h6>Your Hand</h6>
                    <div class="hand-area mb-3" id="handArea">
                        ${this.renderHand()}
                    </div>
                    
                    <!-- Selection Info -->
                    <div id="selectionInfo" class="alert alert-info">
                        ${this.getSelectionInfo()}
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="d-flex gap-2">
                        <button id="passBtn" class="btn btn-warning">
                            <i class="bi bi-skip-forward"></i> Pass Turn
                        </button>
                        
                        <button id="lockInBtn" class="btn btn-success flex-grow-1" disabled>
                            <i class="bi bi-lock"></i> Lock In Play
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderHand() {
        const state = this.gameState;
        const hand = state.player.hand;
        
        if (hand.length === 0) {
            return '<p class="text-muted">No cards remaining in hand</p>';
        }
        
        return `
            <div class="row row-cols-3 row-cols-md-4 row-cols-lg-5 row-cols-xl-7 g-2">
                ${hand.map(card => `
                    <div class="col">
                        <div class="hand-card ${state.player.selectedCards.includes(card.id) ? 'selected' : ''}" 
                             data-card-id="${card.id}">
                            ${CardTile.render(card, { compact: true })}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    getSelectionInfo() {
        const state = this.gameState;
        const selected = state.player.selectedCards.map(id => 
            state.player.hand.find(c => c.id === id)
        ).filter(c => c);
        
        if (selected.length === 0) {
            return 'Select cards to play or click Pass';
        }
        
        const cost = selected.reduce((sum, c) => sum + c.energyCost, 0);
        const names = selected.map(c => c.playerName).join(' + ');
        
        return `Selected: ${names} (Cost: ${cost} energy)`;
    }
    
    renderLog() {
        return `
            <div class="card sticky-top" style="top: 70px;">
                <div class="card-header bg-dark text-white">
                    <h6 class="mb-0"><i class="bi bi-list-ul"></i> Event Log</h6>
                </div>
                <div class="card-body event-log" id="eventLog" style="max-height: 60vh; overflow-y: auto;">
                    ${this.renderLogEntries()}
                </div>
            </div>
        `;
    }
    
    renderLogEntries() {
        const events = this.gameState?.events || [];
        
        if (events.length === 0) {
            return '<p class="text-muted">No events yet</p>';
        }
        
        return events.slice(-20).reverse().map(event => `
            <div class="log-entry">
                <small class="text-muted">R${event.round} T${event.turn}</small><br>
                ${event.message}
            </div>
        `).join('');
    }
    
    renderRevealModal() {
        return `
            <div class="modal fade" id="revealModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-dark text-white">
                            <h5 class="modal-title">Revealing Plays...</h5>
                        </div>
                        <div class="modal-body text-center" id="revealContent">
                            <div class="spinner-border text-primary mb-3" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <p>Both players have locked in their plays!</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    attachEventListeners() {
        // Forfeit
        document.getElementById('forfeitBtn')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to forfeit this match?')) {
                this.forfeitMatch();
            }
        });
        
        // Card selection
        document.getElementById('handArea')?.addEventListener('click', (e) => {
            const card = e.target.closest('.hand-card');
            if (card) {
                const cardId = card.dataset.cardId;
                this.selectCard(cardId);
            }
        });
        
        // Pass
        document.getElementById('passBtn')?.addEventListener('click', () => {
            this.selectPass();
        });
        
        // Lock in
        document.getElementById('lockInBtn')?.addEventListener('click', () => {
            this.lockIn();
        });
    }
    
    startMatch() {
        this.gameState = transition(this.gameState, { type: 'START_MATCH' });
        this.updateUI();
    }
    
    selectCard(cardId) {
        if (this.gameState.state !== STATES.SELECTION) return;
        if (this.gameState.player.lockedPlay) return;
        
        this.gameState = transition(this.gameState, { 
            type: 'SELECT_CARD', 
            playerId: 'player',
            cardId 
        });
        
        this.updateUI();
    }
    
    selectPass() {
        if (this.gameState.state !== STATES.SELECTION) return;
        if (this.gameState.player.lockedPlay) return;
        
        this.gameState = transition(this.gameState, { 
            type: 'SELECT_PASS', 
            playerId: 'player'
        });
        
        this.updateUI();
        
        // Auto lock in pass
        setTimeout(() => {
            this.lockIn();
        }, 300);
    }
    
    lockIn() {
        if (this.gameState.state !== STATES.SELECTION) return;
        
        // Player locks in
        this.gameState = transition(this.gameState, { 
            type: 'LOCK_IN', 
            playerId: 'player'
        });
        
        // AI makes decision
        const aiPlay = this.aiBot.choosePlay(this.gameState);
        
        if (aiPlay.isPass) {
            this.gameState = transition(this.gameState, { 
                type: 'SELECT_PASS', 
                playerId: 'opponent'
            });
        } else {
            // Select AI cards
            aiPlay.cards.forEach(card => {
                this.gameState = transition(this.gameState, { 
                    type: 'SELECT_CARD', 
                    playerId: 'opponent',
                    cardId: card.id
                });
            });
        }
        
        // AI locks in
        this.gameState = transition(this.gameState, { 
            type: 'LOCK_IN', 
            playerId: 'opponent'
        });
        
        this.updateUI();
        
        // Trigger reveal
        if (this.gameState.state === STATES.LOCKED) {
            this.triggerReveal();
        }
    }
    
    triggerReveal() {
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('revealModal'));
        modal.show();
        
        setTimeout(() => {
            this.gameState = transition(this.gameState, { type: 'TRIGGER_REVEAL' });
            
            // Show plays in modal
            const content = document.getElementById('revealContent');
            content.innerHTML = `
                <h5>Plays Revealed!</h5>
                <div class="row mt-4">
                    <div class="col-6">
                        <h6>Your Play</h6>
                        <p>${this.describePlay(this.gameState.player.lockedPlay)}</p>
                    </div>
                    <div class="col-6">
                        <h6>AI Play</h6>
                        <p>${this.describePlay(this.gameState.opponent.lockedPlay)}</p>
                    </div>
                </div>
            `;
            
            setTimeout(() => {
                modal.hide();
                this.triggerScoring();
            }, 2000);
        }, 1000);
    }
    
    triggerScoring() {
        this.gameState = transition(this.gameState, { type: 'TRIGGER_SCORING' });
        this.gameState = transition(this.gameState, { type: 'CALCULATE_SCORE' });
        
        this.updateUI();
        
        // Check if round/match ended
        if (this.gameState.state === STATES.ROUND_END) {
            setTimeout(() => {
                this.resolveRound();
            }, 2000);
        } else if (this.gameState.state === STATES.NEXT_TURN) {
            setTimeout(() => {
                this.advanceTurn();
            }, 2000);
        }
    }
    
    advanceTurn() {
        this.gameState = transition(this.gameState, { type: 'ADVANCE_TURN' });
        this.updateUI();
    }
    
    resolveRound() {
        this.gameState = transition(this.gameState, { type: 'RESOLVE_ROUND' });
        this.updateUI();
        
        if (this.gameState.state === STATES.MATCH_END) {
            setTimeout(() => {
                this.endMatch();
            }, 2000);
        }
    }
    
    endMatch() {
        Logger.info('Match ended', { 
            winner: this.gameState.winner,
            matchId: this.gameState.matchId
        });
        
        // Store match result
        this.app.matchResult = this.gameState;
        
        // Navigate to results
        this.app.showScreen('results');
    }
    
    forfeitMatch() {
        this.gameState.winner = 'opponent';
        this.app.matchResult = this.gameState;
        this.app.showScreen('results');
    }
    
    updateUI() {
        // Update HUD
        const hudContainer = document.querySelector('.navbar');
        if (hudContainer) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = this.renderHUD();
            hudContainer.replaceWith(tempDiv.firstElementChild);
        }
        
        // Update board
        const boardContainer = document.querySelector('.match-screen .card:first-of-type .card-body');
        if (boardContainer) {
            boardContainer.innerHTML = `
                <div class="row">
                    ${this.gameState.rounds.map((round, rIdx) => this.renderRoundColumn(round, rIdx)).join('')}
                </div>
            `;
        }
        
        // Update player area
        const handArea = document.getElementById('handArea');
        if (handArea) {
            handArea.innerHTML = this.renderHand();
        }
        
        const selectionInfo = document.getElementById('selectionInfo');
        if (selectionInfo) {
            selectionInfo.innerHTML = this.getSelectionInfo();
        }
        
        // Update energy
        const playerEnergy = document.querySelector('.col-6:first-child');
        if (playerEnergy) {
            playerEnergy.innerHTML = `
                <label class="form-label">Your Energy</label>
                ${EnergyMeter.render(this.gameState.player.energy, 10, 'success')}
            `;
        }
        
        const opponentEnergy = document.querySelector('.col-6:last-child');
        if (opponentEnergy) {
            opponentEnergy.innerHTML = `
                <label class="form-label">AI Energy</label>
                ${EnergyMeter.render(this.gameState.opponent.energy, 10, 'danger')}
            `;
        }
        
        // Update lock in button
        const lockBtn = document.getElementById('lockInBtn');
        if (lockBtn) {
            const canLockIn = this.gameState.state === STATES.SELECTION && 
                            (this.gameState.player.selectedCards.length > 0 || 
                             this.gameState.player.lockedPlay?.type === 'PASS');
            lockBtn.disabled = !canLockIn;
        }
        
        // Update log
        const logContainer = document.getElementById('eventLog');
        if (logContainer) {
            logContainer.innerHTML = this.renderLogEntries();
            logContainer.scrollTop = 0;
        }
        
        // Re-attach event listeners for dynamic content
        this.attachEventListeners();
    }
    
    destroy() {
        if (this.autoAdvanceTimeout) {
            clearTimeout(this.autoAdvanceTimeout);
        }
    }
}