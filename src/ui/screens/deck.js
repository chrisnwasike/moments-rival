/**
 * Deck Builder Screen
 * Select  moments to build a deck
 */

import { Logger } from '../../utils/logger.js';
import { showToast } from '../components/toasts.js';
import { CardTile } from '../components/cardTile.js';
import { momentToCard } from '../../utils/validate.js';

export class DeckScreen {
    constructor(app) {
        this.app = app;
        this.selectedMoments = [];
        this.filterTier = 'all';
        this.filterType = 'all';
        this.sortBy = 'offense';
        this.deckSize = window.MomentRivalsConfig.GAME.DECK_SIZE;
    }
    
    render() {
        const container = document.getElementById('app');
        container.innerHTML = `
            <div class="deck-screen">
                <nav class="navbar navbar-dark bg-dark">
                    <div class="container-fluid">
                        <span class="navbar-brand">
                            <img src="assets/img/logo.png" height="30" class="me-2">
                            Deck Builder
                        </span>
                        <button id="settingsBtn" class="btn btn-outline-light btn-sm d-none">
                            <i class="bi bi-gear"></i>
                        </button>
                    </div>
                </nav>
                
                <div class="container-fluid py-4">
                    <div class="row">
                        <!-- Deck Slots (Left) -->
                        <div class="col-lg-6">
                            <div class="card h-100 mb-3">
                                <div class="card-header bg-primary text-white">
                                    <h5 class="mb-0">
                                        <i class="bi bi-collection"></i> Your Deck
                                        <span class="badge bg-white text-dark float-end" id="deckCount">
                                            ${this.selectedMoments.length}/${this.deckSize} 
                                        </span>
                                    </h5>
                                </div>
 

                                <div class="card-body" style="flex:unset">
                                    <div class="action-btns">
                                        <button id="saveDeckBtn" class="btn btn-success w-100" disabled>
                                            <i class="bi bi-check-lg"></i> Save & Continue
                                        </button>
                                                                                
                                        <button id="randDeckBtn" class="btn btn-outline-primary w-100">
                                            <i class="bi bi-hand-index"></i> Random Deck
                                        </button>

                                        <button id="clearDeckBtn" class="btn btn-outline-danger w-100">
                                            <i class="bi bi-trash"></i> Clear Deck
                                        </button>

                                    </div>

                                    
                                </div>


                                <div class="card-body" id="deckSlots">
                                    ${this.renderDeckSlots()}
                                </div>

                            </div>
                        </div>
                        
                        <!-- Collection (Right) -->
                        <div class="col-lg-6">
                            <div class="card">
                                <div class="card-header">
                                    <div class="row align-items-center">
                                        <div class="col">
                                            <h5 class="mb-0">
                                                <i class="bi bi-grid-3x3"></i> Your Collection
                                                <span class="badge bg-secondary">${this.app.moments.length} cards</span>
                                            </h5>
                                        </div>
                                        <div class="col-auto">
                                            <button id="showTutorialBtn" class="btn btn-sm btn-outline-info me-2">
                                                <i class="bi bi-question-circle"></i> How to Build
                                            </button>
                                            <div class="btn-group btn-group-sm">
                                                <select id="filterTier" class="form-select form-select-sm d-none">
                                                    <option value="all">All Tiers</option>
                                                    <option value="Common">Common</option>
                                                    <option value="Fandom">Fandom</option>
                                                    <option value="Rare">Rare</option>
                                                    <option value="Legendary">Legendary</option>
                                                </select>
                                                
                                                <select id="filterType" class="form-select form-select-sm me-2">
                                                    <option value="all">All Types</option>
                                                    <option value="OFFENSE">Offense</option>
                                                    <option value="DEFENSE">Defense</option>
                                                    <option value="SUPPORT">Support</option>
                                                </select>
                                                
                                                <select id="sortBy" class="form-select form-select-sm">
                                                    <option value="offense">Sort: Offense</option>
                                                    <option value="defense">Sort: Defense</option>
                                                    <option value="cost">Sort: Cost</option>
                                                    <option value="serial">Sort: Serial #</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="card-body" style="max-height: 80vh; overflow-y: auto; background: linear-gradient(45deg, #434141, #202020)">
                                    <div id="collectionGrid" class="collection-grid-row">
                                        ${this.renderCollection()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                ${this.renderTutorialModal()}
            </div>
        `;
        
        this.attachEventListeners();
        this.updateSaveButton();

        // Check if this is first time user
        this.checkFirstTimeUser();
    }

    renderTutorialModal() {
        return `
            <!-- Tutorial Modal -->
            <div class="modal fade" id="tutorialModal" tabindex="-1" aria-labelledby="tutorialModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="tutorialModalLabel">
                                <i class="bi bi-lightbulb"></i> How to Build Your Deck
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <!-- Welcome Section -->
                            <div class="alert alert-info mb-4">
                                <h6 class="alert-heading">
                                    <i class="bi bi-info-circle-fill"></i> Welcome to Deck Building!
                                </h6>
                                <p class="mb-0">
                                    Build a powerful deck of <strong>${this.deckSize} cards</strong> from your NBA Top Shot collection. 
                                    Each card represents a Moment with unique stats and abilities.
                                </p>
                            </div>

                            <!-- Card Types Section -->
                            <h6 class="mb-3">
                                <i class="bi bi-grid-3x3-gap"></i> Understanding Card Types
                            </h6>
                            
                            <div class="row mb-4">
                                <div class="col-md-4 mb-3">
                                    <div class="card border-danger h-100">
                                        <div class="card-body">
                                            <h6 class="card-title">
                                                <i class="bi bi-lightning-charge-fill"></i> OFFENSE
                                            </h6>
                                            <p class="card-text small">
                                                High offensive power for scoring points. Use these to attack and win turns.
                                            </p>
                                            <ul class="small">
                                                <li>High Offense stat</li>
                                                <li>Score points vs opponent defense</li>
                                                <li>Examples: Dunks, Layups, 3-Pointers</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col-md-4 mb-3">
                                    <div class="card border-primary h-100">
                                        <div class="card-body">
                                            <h6 class="card-title">
                                                <i class="bi bi-shield-fill"></i> DEFENSE
                                            </h6>
                                            <p class="card-text small">
                                                Strong defensive abilities to block opponent attacks.
                                            </p>
                                            <ul class="small">
                                                <li>High Defense stat</li>
                                                <li>Reduce opponent points</li>
                                                <li>Examples: Blocks, Steals, Rebounds</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col-md-4 mb-3">
                                    <div class="card border-warning h-100">
                                        <div class="card-body">
                                            <h6 class="card-title">
                                                <i class="bi bi-star-fill"></i> SUPPORT
                                            </h6>
                                            <p class="card-text small">
                                                Boost your offense or defense cards with additional power.
                                            </p>
                                            <ul class="small">
                                                <li>Adds bonus stats</li>
                                                <li>Combo with Offense/Defense</li>
                                                <li>Examples: Assists, Passes</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Deck Requirements -->
                            <h6 class="mb-3">
                                <i class="bi bi-check2-square"></i> Deck Requirements
                            </h6>
                            
                            <div class="alert alert-warning mb-4">
                                <strong>Your deck must have <strong>Exactly ${this.deckSize} cards</strong> - No more, no less</strong>
                            </div>

                            <!-- Building Steps -->
                            <h6 class="mb-3">
                                <i class="bi bi-list-ol"></i> Building Your Deck (Step by Step)
                            </h6>
                            
                            <div class="accordion mb-4" id="tutorialAccordion">
                                <!-- Step 1 -->
                                <div class="accordion-item">
                                    <h2 class="accordion-header">
                                        <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#step1">
                                            <strong>Step 1:</strong>&nbsp;Browse Your Collection
                                        </button>
                                    </h2>
                                    <div id="step1" class="accordion-collapse collapse show" data-bs-parent="#tutorialAccordion">
                                        <div class="accordion-body">
                                            <p>Look through your NBA Top Shot Moments on the right side.</p>
                                            <ul>
                                                <li>Use <strong>filters</strong> to sort by card type (Offense, Defense, Support)</li>
                                                <li>Use <strong>sort options</strong> to order by stats (Offense, Defense, Cost)</li>
                                                <li>Check each card's <strong>stats</strong> and <strong>energy cost</strong></li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <!-- Step 2 -->
                                <div class="accordion-item">
                                    <h2 class="accordion-header">
                                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#step2">
                                            <strong>Step 2:</strong>&nbsp;Select Your Cards
                                        </button>
                                    </h2>
                                    <div id="step2" class="accordion-collapse collapse" data-bs-parent="#tutorialAccordion">
                                        <div class="accordion-body">
                                            <p>Click on any card to add it to your deck.</p>
                                            <ul>
                                                <li>Selected cards appear in <strong>deck slots</strong> on the left</li>
                                                <li>Cards light up with a <strong>green checkmark</strong> when selected</li>
                                                <li>Click the <strong>X button</strong> to remove cards from your deck</li>
                                                <li>Maximum ${this.deckSize} cards total</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <!-- Step 3 -->
                                <div class="accordion-item">
                                    <h2 class="accordion-header">
                                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#step3">
                                            <strong>Step 3:</strong>&nbsp;Balance Your Strategy
                                        </button>
                                    </h2>
                                    <div id="step3" class="accordion-collapse collapse" data-bs-parent="#tutorialAccordion">
                                        <div class="accordion-body">
                                            <p>Create a balanced deck with different card types:</p>
                                            <ul>
                                                <li><strong>Offense cards (Red):</strong> 8-12 recommended for scoring</li>
                                                <li><strong>Defense cards (Blue):</strong> 8-12 recommended for protection</li>
                                                <li><strong>Support cards (Yellow):</strong> 1-5 recommended for combos</li>
                                            </ul>
                                            <p class="mb-0">
                                                <strong>Pro Tip:</strong> Consider energy costs! Mix high-cost powerful cards with low-cost cards for flexibility.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <!-- Step 4 -->
                                <div class="accordion-item">
                                    <h2 class="accordion-header">
                                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#step4">
                                            <strong>Step 4:</strong>&nbsp;Save Your Deck
                                        </button>
                                    </h2>
                                    <div id="step4" class="accordion-collapse collapse" data-bs-parent="#tutorialAccordion">
                                        <div class="accordion-body">
                                            <p>When your deck meets all requirements:</p>
                                            <ul>
                                                <li>The <strong>"Save & Continue"</strong> button turns green</li>
                                                <li>Click it to save your deck</li>
                                                <li>You'll proceed to the <strong>Match Lobby</strong></li>
                                            </ul>
                                            <div class="alert alert-success mb-0">
                                                <strong>Quick Tip:</strong> Try the <strong>"Random Deck"</strong> button for instant deck generation!
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Tips & Tricks -->
                            <h6 class="mb-3">
                                <i class="bi bi-trophy-fill"></i> Strategy Tips
                            </h6>
                            
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <div class="card bg-light h-100">
                                        <div class="card-body">
                                            <h6 class="card-title">
                                                <i class="bi bi-graph-up text-success"></i> Energy Management
                                            </h6>
                                            <p class="card-text small mb-0">
                                                Pay attention to energy costs! Lower cost cards let you play more per turn. 
                                                Mix 1-cost, 2-cost, and 3-cost cards for flexibility.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <div class="card bg-light h-100">
                                        <div class="card-body">
                                            <h6 class="card-title">
                                                <i class="bi bi-stars text-warning"></i> Serial Numbers Matter
                                            </h6>
                                            <p class="card-text small mb-0">
                                                Lower serial number Moments (#1-50) have bonus stats! 
                                                Legendary and Rare tiers are generally stronger.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <div class="card bg-light h-100">
                                        <div class="card-body">
                                            <h6 class="card-title">
                                                <i class="bi bi-bezier2 text-info"></i> Combos are Key
                                            </h6>
                                            <p class="card-text small mb-0">
                                                During matches, you can combo Offense/Defense cards with Support cards 
                                                for powerful boosted plays!
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <div class="card bg-light h-100">
                                        <div class="card-body">
                                            <h6 class="card-title">
                                                <i class="bi bi-shuffle text-primary"></i> Experiment!
                                            </h6>
                                            <p class="card-text small mb-0">
                                                Try different deck compositions. Offense-heavy, defense-focused, 
                                                or balanced - find your winning strategy!
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                        <div class="modal-footer">
                            <div class="form-check me-auto">
                                <input class="form-check-input" type="checkbox" id="dontShowAgain">
                                <label class="form-check-label small" for="dontShowAgain">
                                    Don't show this again
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    checkFirstTimeUser() {
        // Check if user has seen tutorial before
        const hasSeenTutorial = localStorage.getItem('moment_rivals_deck_tutorial_seen');
        
        if (!hasSeenTutorial) {
            // First time user - show tutorial automatically after short delay
            setTimeout(() => {
                this.showTutorial();
                Logger.info('First-time deck builder - showing tutorial');
            }, 2000);
        }
    }
    
    showTutorial() {
        const modal = new bootstrap.Modal(document.getElementById('tutorialModal'));
        modal.show();
        
        Logger.info('Tutorial modal shown');
    }
    
    
    renderDeckSlots() {
        let html = '<div class="deck-slots">';

        for (let i = 0; i < this.deckSize; i++) {
            const moment = this.selectedMoments[i];
            
            if (moment) {
                const card = momentToCard(moment);
                html += `
                    <div class="deck-slot filled mb-2" data-index="${i}">
                        ${CardTile.render(card, { compact: true })}
                        <button class="btn btn-sm btn-danger remove-btn" data-moment-id="${moment.momentId}">
                            <i class="bi bi-x"></i>
                        </button>
                    </div>
                `;
            } else {
                html += `
                    <div class="deck-slot empty mb-2">
                        <div class="empty-slot-placeholder">
                            <i class="bi bi-plus-circle"></i>
                            <small>Slot ${i + 1}</small>
                        </div>
                    </div>
                `;
            }
        }
        
        html += `
        <div class="deck-info">
                <h6 class="card-title">Deck Requirements</h6>
                <ul class="small">
                    <li>Exactly ${this.deckSize}  cards</li>
                    <li>At least 2 offense cards</li>
                    <li>At least 2 defense cards</li>
                    <li>Maximum 1 copy per card</li>
                </ul>
            </div>
        </div>`;
        return html;
    }
    
    renderCollection() {
        const moments = this.getFilteredMoments();
        
        if (moments.length === 0) {
            return `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-inbox display-1 text-muted"></i>
                    <p class="text-muted mt-3">No moments match your filters</p>
                </div>
            `;
        }
        
        return moments.map(moment => {
            const card = momentToCard(moment);
            const isSelected = this.selectedMoments.some(m => m.momentId === moment.momentId);
            const canSelect = !isSelected && this.selectedMoments.length < this.deckSize;
            
            return `
                <div class="col">
                    <div class="moment-card${isSelected ? ' selected' : ''}${!canSelect && !isSelected ? ' disabled' : ''}" 
                         data-moment-id="${moment.momentId}">
                        ${CardTile.render(card, { selectable: true })}
                        ${isSelected ? '<div class="selected-badge"><i class="bi bi-check-circle-fill"></i></div>' : ''}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    getFilteredMoments() {
        let filtered = [...this.app.moments];
        
        // Filter by tier
        if (this.filterTier !== 'all') {
            filtered = filtered.filter(m => m.tier === this.filterTier);
        }
        
        // Filter by type
        if (this.filterType !== 'all') {
            filtered = filtered.filter(m => {
                const card = momentToCard(m);
                return card.cardType === this.filterType;
            });
        }
        
        // Sort
        filtered.sort((a, b) => {
            const cardA = momentToCard(a);
            const cardB = momentToCard(b);
            
            switch (this.sortBy) {
                case 'offense':
                    return (cardB.offense || 0) - (cardA.offense || 0);
                case 'defense':
                    return (cardB.defense || 0) - (cardA.defense || 0);
                case 'cost':
                    return (cardA.energyCost || 0) - (cardB.energyCost || 0);
                case 'serial':
                    return a.serialNumber - b.serialNumber;
                default:
                    return 0;
            }
        });
        
        return filtered;
    }
    
    attachEventListeners() {
        // Settings button
        document.getElementById('settingsBtn')?.addEventListener('click', () => {
            this.app.showScreen('settings');
        });

        // Tutorial button
        document.getElementById('showTutorialBtn')?.addEventListener('click', () => {
            this.showTutorial();
        });
        
        // Don't show again checkbox
        document.getElementById('dontShowAgain')?.addEventListener('change', (e) => {
            if (e.target.checked) {
                localStorage.setItem('moment_rivals_deck_tutorial_seen', 'true');
                Logger.info('User opted out of tutorial');
            } else {
                localStorage.removeItem('moment_rivals_deck_tutorial_seen');
            }
        });

        // Filters
        document.getElementById('filterTier')?.addEventListener('change', (e) => {
            this.filterTier = e.target.value;
            this.updateCollection();
        });
        
        document.getElementById('filterType')?.addEventListener('change', (e) => {
            this.filterType = e.target.value;
            this.updateCollection();
        });
        
        document.getElementById('sortBy')?.addEventListener('change', (e) => {
            this.sortBy = e.target.value;
            this.updateCollection();
        });
        
        // Save deck
        document.getElementById('saveDeckBtn')?.addEventListener('click', () => {
            this.saveDeck();
        });
        
        // Clear deck
        document.getElementById('clearDeckBtn')?.addEventListener('click', () => {
            this.clearDeck();
        });
        
        // Clear deck
        document.getElementById('randDeckBtn')?.addEventListener('click', () => {
            this.randDeck();
        });
        
        // Card selection
        document.getElementById('collectionGrid')?.addEventListener('click', (e) => {
            const card = e.target.closest('.col .moment-card');
            if (card && !card.classList.contains('disabled')) {
                const momentId = (card.dataset.momentId);
                this.toggleMoment(momentId);
            }
        });

        
        // Remove from deck
        document.getElementById('deckSlots')?.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('.remove-btn');
            if (removeBtn) {
                const momentId = (removeBtn.dataset.momentId);
                this.removeMoment(momentId);
            }
        });
    }
    
    toggleMoment(momentId) {
        const moment = this.app.moments.find(m => m.momentId === momentId);
        if (!moment) return;
        
        const isSelected = this.selectedMoments.some(m => m.momentId === momentId);
        
        if (isSelected) {
            this.removeMoment(momentId);
        } else {
            this.addMoment(moment);
        }
    }
    
    addMoment(moment) {
        if (this.selectedMoments.length >= this.deckSize) {
            showToast('Deck is full', 'warning');
            return;
        }
        
        if (this.selectedMoments.some(m => m.momentId === moment.momentId)) {
            showToast('Card already in deck', 'warning');
            return;
        }
        
        this.selectedMoments.push(moment);
        this.updateDeck();
        this.updateCollection();
        this.updateSaveButton();

    }
    
    removeMoment(momentId) {
        this.selectedMoments = this.selectedMoments.filter(m => m.momentId !== momentId);
        this.updateDeck();
        this.updateCollection();
        this.updateSaveButton();
    }
    
    /**
     * Generate a random valid deck
     * Ensures deck meets all requirements:
     * - Exactly 7 cards
     * - At least 2 offense cards
     * - At least 2 defense cards
     * - No duplicates
     */
    randDeck() {
        Logger.info('Generating random deck');
        
        // Clear current deck
        this.selectedMoments = [];
        
        // Categorize moments by card type
        const categorized = {
            offense: [],
            defense: [],
            support: []
        };
        
        this.app.moments.forEach(moment => {
            const card = momentToCard(moment);
            const type = card.cardType.toLowerCase();
            if (categorized[type]) {
                categorized[type].push(moment);
            }
        });
        
        
        if (this.app.moments.length < this.deckSize) {
            showToast(`Not enough cards in collection (need at least ${this.deckSize})`, 'error');
            return;
        }
        
        // Shuffle helper function
        const shuffle = (array) => {
            const shuffled = [...array];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        };
        
        // Build deck with requirements
        const deck = [];
        
        // 1. Add 2 random offense cards (minimum requirement)
        const shuffledOffense = shuffle(categorized.offense);
        deck.push(shuffledOffense[0]);
        deck.push(shuffledOffense[1]);
        
        // 2. Add 2 random defense cards (minimum requirement)
        const shuffledDefense = shuffle(categorized.defense);
        deck.push(shuffledDefense[0]);
        deck.push(shuffledDefense[1]);
        
        // 3. Fill remaining 3 slots with random cards from any category
        const remainingOffense = shuffledOffense.slice(2);
        const remainingDefense = shuffledDefense.slice(2);
        const remainingSupport = shuffle(categorized.support);
        
        // Combine all remaining cards
        const remainingPool = [
            ...remainingOffense,
            ...remainingDefense,
            ...remainingSupport
        ];
        
        // Shuffle and take 3 more cards
        const shuffledRemaining = shuffle(remainingPool);
        for (let i = 0; i < 3 && i < shuffledRemaining.length; i++) {
            // Make sure we don't add duplicates
            if (!deck.some(m => m.momentId === shuffledRemaining[i].momentId)) {
                deck.push(shuffledRemaining[i]);
            }
        }
        
        // Verify we have exactly 7 cards
        if (deck.length < this.deckSize) {
            // If we don't have enough due to duplicates, try again with more cards
            const allAvailable = [...this.app.moments];
            const shuffledAll = shuffle(allAvailable);
            
            for (const moment of shuffledAll) {
                if (deck.length >= this.deckSize) break;
                if (!deck.some(m => m.momentId === moment.momentId)) {
                    deck.push(moment);
                }
            }
        }
        
        // Set the deck (limited to 7)
        this.selectedMoments = deck.slice(0, this.deckSize);
        
        // Update UI
        this.updateDeck();
        this.updateCollection();
        this.updateSaveButton();
        
        // Validate and show result
        const validation = this.validateDeck();
        if (validation.valid) {
            const offenseCount = this.selectedMoments.filter(m => 
                momentToCard(m).cardType === 'OFFENSE'
            ).length;
            const defenseCount = this.selectedMoments.filter(m => 
                momentToCard(m).cardType === 'DEFENSE'
            ).length;
            const supportCount = this.selectedMoments.filter(m => 
                momentToCard(m).cardType === 'SUPPORT'
            ).length;
            
            showToast(
                `Random deck generated! (${offenseCount} OFF, ${defenseCount} DEF, ${supportCount} SUP)`, 
                'success'
            );
            
            Logger.info('Random deck generated', {
                offense: offenseCount,
                defense: defenseCount,
                support: supportCount
            });
        } else {
            showToast('Failed to generate valid deck: ' + validation.errors[0], 'error');
            Logger.error('Random deck validation failed', { errors: validation.errors });
        }
    }
    
    clearDeck() {
        if (this.selectedMoments.length === 0) return;
        
        if (confirm('Clear all cards from deck?')) {
            this.selectedMoments = [];
            this.updateDeck();
            this.updateCollection();
            this.updateSaveButton();
            showToast('Deck cleared', 'info');
        }
    }
    
    updateDeck() {
        const deckSlotsEl = document.getElementById('deckSlots');
        const deckCountEl = document.getElementById('deckCount');
        if (deckSlotsEl) {
            deckSlotsEl.innerHTML = this.renderDeckSlots();
        }

        deckCountEl.innerHTML = this.selectedMoments.length+'/'+this.deckSize;
    }
    
    updateCollection() {
        const collectionEl = document.getElementById('collectionGrid');
        if (collectionEl) {
            collectionEl.innerHTML = this.renderCollection();
        }
    }
    
    updateSaveButton() {
        const saveBtn = document.getElementById('saveDeckBtn');
        if (!saveBtn) return;
        
        const validation = this.validateDeck();
        
        saveBtn.disabled = !validation.valid;
        
        if (!validation.valid && this.selectedMoments.length > 0) {
            saveBtn.title = validation.errors.join(', ');
        } else {
            saveBtn.title = '';
        }
    }
    
    validateDeck() {
        const errors = [];
        
        if (this.selectedMoments.length !== this.deckSize) {
            errors.push(`Need exactly ${this.deckSize} cards (currently ${this.selectedMoments.length})`);
        }
        
        const cards = this.selectedMoments.map(m => momentToCard(m));
        const offenseCount = cards.filter(c => c.cardType === 'OFFENSE').length;
        const defenseCount = cards.filter(c => c.cardType === 'DEFENSE').length;
        
        if (offenseCount < 1) {
            errors.push('Need at least 2 offense cards');
        }
        
        if (defenseCount < 1) {
            errors.push('Need at least 2 defense cards');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    async saveDeck() {
        const validation = this.validateDeck();
        
        if (!validation.valid) {
            showToast(validation.errors[0], 'error');
            return;
        }
        
        Logger.info('Saving deck', { moments: this.selectedMoments.map(m => m.momentId) });
        
        // Convert moments to cards
        this.app.playerDeck = this.selectedMoments.map(m => momentToCard(m));
        console.log(this.app.playerDeck);
        
        // Save to session
        sessionStorage.setItem('player_deck', JSON.stringify(this.app.playerDeck));
        
        showToast('Deck saved successfully!', 'success');
        
        // Navigate to lobby
        this.app.showScreen('lobby');
    }
    
    destroy() {
        // Cleanup if needed
    }
}