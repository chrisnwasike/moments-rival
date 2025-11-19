/**
 * Deck Builder Screen
 * Select 7 moments to build a deck
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
                            <div class="card mb-3">
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
            </div>
        `;
        
        this.attachEventListeners();
        this.updateSaveButton();
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