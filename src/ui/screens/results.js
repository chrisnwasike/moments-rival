/**
 * Results Screen
 * Match results and replay download
 */

import { Logger } from '../../utils/logger.js';
import { showToast } from '../components/toasts.js';
import { downloadReplay, getReplaySummary } from '../../core/replay.js';

export class ResultsScreen {
    constructor(app) {
        this.app = app;
    }
    
    render() {
        const result = this.app.matchResult;
        const isWinner = result.winner === 'player';
        
        const container = document.getElementById('app');
        container.innerHTML = `
            <div class="results-screen">
                <div class="container">
                    <div class="row justify-content-center">
                        <div class="col-lg-8">
                            <!-- Result Banner -->
                            <div class="card mb-4 ${isWinner ? 'border-success' : 'border-danger'}">
                                <div class="card-body text-center">
                                    <i class="bi bi-${isWinner ? 'trophy-fill text-warning' : 'x-circle-fill text-danger'}" 
                                       style="font-size: 3rem;"></i>
                                    <h1 class="mt-1">${isWinner ? 'Victory!' : 'Defeat'}</h1>
                                    <p class="lead text-muted">
                                        ${isWinner ? 'You defeated the AI opponent!' : 'The AI opponent was victorious'}
                                    </p>
                                </div>
                            </div>
                            
                            <!-- Match Stats -->
                            <div class="card mb-4">
                                <div class="card-header">
                                    <h5 class="mb-0"><i class="bi bi-bar-chart"></i> Match Statistics</h5>
                                </div>
                                <div class="card-body">
                                    <div class="row text-center">
                                        <div class="col-6 col-md-3">
                                            <h2 class="text-primary">${result.player.roundsWon}</h2>
                                            <small class="text-muted">Rounds Won</small>
                                        </div>
                                        <div class="col-6 col-md-3">
                                            <h2 class="text-success">${result.player.totalScore}</h2>
                                            <small class="text-muted">Total Points</small>
                                        </div>
                                        <div class="col-6 col-md-3">
                                            <h2 class="text-info">${result.player.graveyard.length}</h2>
                                            <small class="text-muted">Cards Played</small>
                                        </div>
                                        <div class="col-6 col-md-3">
                                            <h2 class="text-warning">${result.player.energy}</h2>
                                            <small class="text-muted">Energy Left</small>
                                        </div>
                                    </div>
                                    
                                    <hr>
                                    
                                    <div class="table-responsive">
                                        <table class="table table-sm">
                                            <thead>
                                                <tr>
                                                    <th>Round</th>
                                                    <th>Your Score</th>
                                                    <th>AI Score</th>
                                                    <th>Result</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${this.renderRoundResults(result)}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Actions -->
                            <div class="card">
                                <div class="card-body">
                                    <div class="action-btns">
                                        <button id="playAgainBtn" class="btn btn-primary btn-lg">
                                            <i class="bi bi-arrow-repeat"></i> Play Again
                                        </button>
                                        
                                        <button id="downloadReplayBtn" class="btn btn-outline-secondary">
                                            <i class="bi bi-download"></i> Download Replay
                                        </button>
                                        
                                        <button id="changeDeckBtn" class="btn btn-outline-primary">
                                            <i class="bi bi-collection"></i> Change Deck
                                        </button>
                                        
                                        <button id="mainMenuBtn" class="btn btn-outline-secondary">
                                            <i class="bi bi-house"></i> Main Menu
                                        </button>
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
    
    renderRoundResults(result) {
        return result.rounds.map(round => {
            if (!round.winner) return '';
            
            const playerWon = round.winner === 'player';
            const tie = round.winner === 'tie';
            
            return `
                <tr>
                    <td>Round ${round.roundNumber}</td>
                    <td>${round.finalScore.player}</td>
                    <td>${round.finalScore.opponent}</td>
                    <td>
                        <span class="badge bg-${playerWon ? 'success' : tie ? 'warning' : 'danger'}">
                            ${playerWon ? 'Won' : tie ? 'Tie' : 'Lost'}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    attachEventListeners() {
        document.getElementById('playAgainBtn')?.addEventListener('click', () => {
            this.playAgain();
        });
        
        document.getElementById('downloadReplayBtn')?.addEventListener('click', () => {
            this.downloadReplay();
        });
        
        document.getElementById('changeDeckBtn')?.addEventListener('click', () => {
            this.app.showScreen('deck');
        });
        
        document.getElementById('mainMenuBtn')?.addEventListener('click', () => {
            this.app.showScreen('login');
        });
    }
    
    playAgain() {
        Logger.info('Starting new match with same deck');
        this.app.showScreen('lobby');
    }
    
    downloadReplay() {
        try {
            downloadReplay(this.app.matchResult);
            showToast('Replay downloaded successfully!', 'success');
        } catch (error) {
            Logger.error('Failed to download replay', { error: error.message });
            showToast('Failed to download replay', 'error');
        }
    }
    
    destroy() {
        // Cleanup if needed
    }
}