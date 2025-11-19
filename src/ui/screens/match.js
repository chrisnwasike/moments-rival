/**
 * Match Screen - Updated with New Rules
 * 
 * NEW RULES IMPLEMENTED:
 * - Decks: Up to 25 cards, pre-validated, shuffled
 * - Starting hand: 7 cards with 1 mulligan option
 * - Turn flow: Draw → Energy refresh → Play 1 card → Reveal → Score
 * - Hand size: Max 7 (auto-discard excess)
 * - Card cycling: Once per turn, discard 1 + draw 1 for 1 energy
 * - Deck exhaustion: Skip draw when empty
 * - Card play: Exactly 1 card per turn, Pass if can't afford
 * - Match structure: 4 rounds × 3 turns
 */

import { Logger } from '../../utils/logger.js';
import { showToast } from '../components/toasts.js';
import { CardTile } from '../components/cardTile.js';
import { EnergyMeter } from '../components/meters.js';

// Game Constants
const GAME_CONFIG = {
    MAX_DECK_SIZE: 25,
    STARTING_HAND_SIZE: 7,
    MAX_HAND_SIZE: 7,
    ROUNDS: 4,
    TURNS_PER_ROUND: 3,
    STARTING_ENERGY: 3,
    ENERGY_PER_TURN: 1,
    CYCLE_COST: 1,
    MULLIGAN_PENALTY: 1  // Draw back same number minus 1
};

// Game States
const STATES = {
    MULLIGAN: 'MULLIGAN',           // Initial mulligan phase
    DRAW: 'DRAW',                   // Draw step
    ENERGY_REFRESH: 'ENERGY_REFRESH', // Energy restoration
    ACTION: 'ACTION',               // Main action phase (play card or pass)
    LOCKED: 'LOCKED',               // Both players have played
    REVEAL: 'REVEAL',               // Cards are revealed
    SCORING: 'SCORING',             // Calculate scores
    TURN_END: 'TURN_END',           // End of turn checks
    ROUND_END: 'ROUND_END',         // End of round
    MATCH_END: 'MATCH_END'          // Match complete
};

export class MatchScreen {
    constructor(app) {
        this.app = app;
        this.gameState = null;
        this.autoAdvanceTimeout = null;
    }
    
    render() {
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
                
                ${this.renderMulliganModal()}
                ${this.renderRevealModal()}
            </div>
        `;
        
        this.attachEventListeners();
        this.updateUI();
        
        // Start match with mulligan phase
        this.startMatch();
    }
    
    initGame() {
        // Validate and prepare player deck (up to 25 cards)
        let playerDeck = this.app.playerDeck || [];
        
        if (playerDeck.length > GAME_CONFIG.MAX_DECK_SIZE) {
            playerDeck = playerDeck.slice(0, GAME_CONFIG.MAX_DECK_SIZE);
            Logger.warn('Player deck truncated to 25 cards');
        }
        
        // Shuffle decks
        playerDeck = this.shuffleDeck([...playerDeck]);
        const opponentDeck = this.shuffleDeck(this.createOpponentDeck());
        
        // Initialize game state
        this.gameState = {
            matchId: `match_${Date.now()}`,
            state: STATES.MULLIGAN,
            config: GAME_CONFIG,
            
            // Match tracking
            currentRound: 1,
            currentTurn: 1,
            
            // Player state
            player: {
                deck: playerDeck,
                hand: [],
                graveyard: [],
                energy: GAME_CONFIG.STARTING_ENERGY,
                maxEnergy: GAME_CONFIG.STARTING_ENERGY,
                totalScore: 0,
                roundScore: 0,
                roundsWon: 0,
                selectedCards: [],  // Array of selected cards for combos
                cycledThisTurn: false,
                hasMulliganed: false,
                lockedPlay: null
            },
            
            // Opponent state
            opponent: {
                deck: opponentDeck,
                hand: [],
                graveyard: [],
                energy: GAME_CONFIG.STARTING_ENERGY,
                maxEnergy: GAME_CONFIG.STARTING_ENERGY,
                totalScore: 0,
                roundScore: 0,
                roundsWon: 0,
                selectedCards: [],  // Array of selected cards for combos
                cycledThisTurn: false,
                hasMulliganed: false,
                lockedPlay: null
            },
            
            // Round tracking
            rounds: [],
            
            // Event log
            eventLog: [],
            
            winner: null
        };
        
        // Initialize rounds structure
        for (let r = 0; r < GAME_CONFIG.ROUNDS; r++) {
            const round = {
                roundNumber: r + 1,
                turns: [],
                winner: null,
                finalScore: { player: 0, opponent: 0 }
            };
            
            for (let t = 0; t < GAME_CONFIG.TURNS_PER_ROUND; t++) {
                round.turns.push({
                    turnNumber: t + 1,
                    playerPlay: null,
                    opponentPlay: null,
                    playerPoints: 0,
                    opponentPoints: 0,
                    resolved: false
                });
            }
            
            this.gameState.rounds.push(round);
        }
        
        Logger.info('Match initialized', { 
            matchId: this.gameState.matchId,
            deckSize: playerDeck.length
        });
    }
    
    createOpponentDeck() {
        // Create a balanced 25-card AI deck
        const deck = [];
        
        // 10 offense cards (varying power levels)
        for (let i = 0; i < 10; i++) {
            deck.push({
                id: `ai_off_${i}`,
                playerName: `AI Offense ${i + 1}`,
                cardType: 'OFFENSE',
                offense: 1 + Math.floor(i / 2),
                defense: 2,
                speed: 4 + (i % 3),
                agility: 4,
                energyCost: 1 + Math.floor(i / 3),
                momentId: null
            });
        }
        
        // 10 defense cards
        for (let i = 0; i < 10; i++) {
            deck.push({
                id: `ai_def_${i}`,
                playerName: `AI Defense ${i + 1}`,
                cardType: 'DEFENSE',
                offense: 2,
                defense: 1 + Math.floor(i / 2),
                speed: 3 + (i % 3),
                agility: 4,
                energyCost: 1 + Math.floor(i / 3),
                momentId: null
            });
        }
        
        // 5 support cards
        for (let i = 0; i < 5; i++) {
            deck.push({
                id: `ai_sup_${i}`,
                playerName: `AI Support ${i + 1}`,
                cardType: 'SUPPORT',
                boostValue: 2 + Math.floor(i / 2), // Boost by 2-3 points
                speed: 5 + i,
                agility: 5 + i,
                energyCost: 1 + Math.floor(i / 2),
                momentId: null
            });
        }
        
        return deck;
    }
    
    shuffleDeck(deck) {
        // Fisher-Yates shuffle
        const shuffled = [...deck];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    // ============================================================================
    // MULLIGAN PHASE
    // ============================================================================
    
    startMatch() {
        // Draw initial hands (7 cards each)
        this.drawCards('player', GAME_CONFIG.STARTING_HAND_SIZE);
        this.drawCards('opponent', GAME_CONFIG.STARTING_HAND_SIZE);
        
        this.addLog('Match started! Draw your starting hand of 7 cards.');
        this.addLog('You may mulligan once: discard any cards and draw back (same number - 1).');
        
        this.updateUI();
        
        // Show mulligan modal
        this.showMulliganModal();
    }
    
    showMulliganModal() {
        const modal = new bootstrap.Modal(document.getElementById('mulliganModal'));
        modal.show();
    }
    
    processMulligan(discardIds) {
        if (this.gameState.player.hasMulliganed) {
            showToast('You have already used your mulligan', 'warning');
            return;
        }
        
        if (discardIds.length === 0) {
            // Skip mulligan
            this.addLog('Mulligan skipped. Keeping starting hand.');
        } else {
            // Discard selected cards
            discardIds.forEach(cardId => {
                const idx = this.gameState.player.hand.findIndex(c => c.id === cardId);
                if (idx !== -1) {
                    const card = this.gameState.player.hand.splice(idx, 1)[0];
                    // Return to bottom of deck
                    this.gameState.player.deck.push(card);
                }
            });
            
            // Shuffle deck
            this.gameState.player.deck = this.shuffleDeck(this.gameState.player.deck);
            
            // Draw back (same number - 1)
            const drawCount = Math.max(0, discardIds.length - GAME_CONFIG.MULLIGAN_PENALTY);
            this.drawCards('player', drawCount);
            
            this.addLog(`Mulligan: Discarded ${discardIds.length} cards, drew ${drawCount} cards.`);
        }
        
        this.gameState.player.hasMulliganed = true;
        
        // AI mulligan decision (simplified - keep all cards for now)
        this.gameState.opponent.hasMulliganed = true;
        this.addLog('Opponent kept their starting hand.');
        
        // Close modal and start first turn
        const modal = bootstrap.Modal.getInstance(document.getElementById('mulliganModal'));
        modal.hide();
        
        // Transition to first turn
        setTimeout(() => {
            this.startTurn();
        }, 500);
    }
    
    // ============================================================================
    // TURN FLOW
    // ============================================================================
    
    startTurn() {
        this.addLog(`─── Round ${this.gameState.currentRound}, Turn ${this.gameState.currentTurn} ───`);
        
        // Reset turn state
        this.gameState.player.selectedCards = [];
        this.gameState.opponent.selectedCards = [];
        this.gameState.player.cycledThisTurn = false;
        this.gameState.opponent.cycledThisTurn = false;
        this.gameState.player.lockedPlay = null;
        this.gameState.opponent.lockedPlay = null;
        
        // Step 1: Draw phase
        this.executeDrawStep();
    }
    
    executeDrawStep() {
        this.gameState.state = STATES.DRAW;
        this.addLog('Draw Step');
        
        // Player draws 1 card
        const playerDrawn = this.drawCards('player', 1);
        if (playerDrawn === 0) {
            this.addLog('Your deck is empty - no card drawn.');
        } else {
            this.addLog('You drew 1 card.');
        }
        
        // Opponent draws 1 card
        const opponentDrawn = this.drawCards('opponent', 1);
        if (opponentDrawn === 0) {
            this.addLog('Opponent deck is empty - no card drawn.');
        } else {
            this.addLog('Opponent drew 1 card.');
        }
        
        this.updateUI();
        
        // Step 2: Energy refresh
        setTimeout(() => {
            this.executeEnergyRefresh();
        }, 800);
    }
    
    executeEnergyRefresh() {
        this.gameState.state = STATES.ENERGY_REFRESH;
        this.addLog('Energy Refresh');
        
        // Restore energy to max
        const playerGain = this.gameState.player.maxEnergy - this.gameState.player.energy;
        const opponentGain = this.gameState.opponent.maxEnergy - this.gameState.opponent.energy;
        
        this.gameState.player.energy = this.gameState.player.maxEnergy;
        this.gameState.opponent.energy = this.gameState.opponent.maxEnergy;
        
        if (playerGain > 0) {
            this.addLog(`You restore ${playerGain} energy → ${this.gameState.player.energy} energy.`);
        }
        if (opponentGain > 0) {
            this.addLog(`Opponent restores ${opponentGain} energy → ${this.gameState.opponent.energy} energy.`);
        }
        
        this.updateUI();
        
        // Step 3: Action phase
        setTimeout(() => {
            this.executeActionPhase();
        }, 800);
    }
    
    executeActionPhase() {
        this.gameState.state = STATES.ACTION;
        this.addLog('Action Phase - Play 1 card or Pass');
        this.updateUI();
        
        // Player makes their choice
        // UI controls are now active
    }
    
    // ============================================================================
    // CARD CYCLING
    // ============================================================================
    
    cycleCard(playerId, cardId) {
        const player = this.gameState[playerId];
        
        if (player.cycledThisTurn) {
            showToast('You have already cycled this turn', 'warning');
            return;
        }
        
        if (player.energy < GAME_CONFIG.CYCLE_COST) {
            showToast('Not enough energy to cycle', 'warning');
            return;
        }
        
        // Find and remove card from hand
        const idx = player.hand.findIndex(c => c.id === cardId);
        if (idx === -1) return;
        
        const discarded = player.hand.splice(idx, 1)[0];
        player.graveyard.push(discarded);
        
        // Draw 1 card
        this.drawCards(playerId, 1);
        
        // Spend energy
        player.energy -= GAME_CONFIG.CYCLE_COST;
        player.cycledThisTurn = true;
        
        this.addLog(`${playerId === 'player' ? 'You' : 'Opponent'} cycled ${discarded.playerName} (Cost: ${GAME_CONFIG.CYCLE_COST} energy)`);
        this.updateUI();
    }
    
    // ============================================================================
    // CARD PLAY
    // ============================================================================
    
 
    selectCard(cardId) {
        if (this.gameState.state !== STATES.ACTION) return;
        if (this.gameState.player.lockedPlay) return;
        
        const card = this.gameState.player.hand.find(c => c.id === cardId);
        if (!card) return;
        
        // Handle card selection based on type and current selection
        const currentSelection = this.gameState.player.selectedCards || [];
        const isAlreadySelected = currentSelection.find(c => c.id === cardId);
        
        // If clicking an already selected card, deselect it
        if (isAlreadySelected) {
            this.gameState.player.selectedCards = currentSelection.filter(c => c.id !== cardId);
            this.updateUI();
            return;
        }
        
        // Check card type and selection rules
        if (card.cardType === 'OFFENSE' || card.cardType === 'DEFENSE') {
            // Can only have one main card (OFFENSE or DEFENSE)
            const mainCards = currentSelection.filter(c => c.cardType === 'OFFENSE' || c.cardType === 'DEFENSE');
            if (mainCards.length > 0) {
                // Replace the existing main card
                this.gameState.player.selectedCards = [
                    card,
                    ...currentSelection.filter(c => c.cardType === 'SUPPORT')
                ];
            } else {
                // Add as first main card
                this.gameState.player.selectedCards = [...currentSelection, card];
            }
        } else if (card.cardType === 'SUPPORT') {
            // SUPPORT cards can only be added if there's a main card
            const mainCards = currentSelection.filter(c => c.cardType === 'OFFENSE' || c.cardType === 'DEFENSE');
            if (mainCards.length === 0) {
                showToast('You must select an OFFENSE or DEFENSE card first', 'warning');
                return;
            }
            
            // Can only have one SUPPORT card
            const supportCards = currentSelection.filter(c => c.cardType === 'SUPPORT');
            if (supportCards.length > 0) {
                // Replace existing SUPPORT
                this.gameState.player.selectedCards = [
                    ...currentSelection.filter(c => c.cardType !== 'SUPPORT'),
                    card
                ];
            } else {
                // Add SUPPORT to combo
                this.gameState.player.selectedCards = [...currentSelection, card];
            }
        }
        
        // Check if combo is affordable
        const totalCost = this.gameState.player.selectedCards.reduce((sum, c) => sum + c.energyCost, 0);
        if (totalCost > this.gameState.player.energy) {
            showToast('Not enough energy for this combination', 'warning');
            this.gameState.player.selectedCards = currentSelection; // Revert
            return;
        }
        
        this.updateUI();
    }
    
    playCard() {
        if (this.gameState.state !== STATES.ACTION) return;
        
        const selectedCards = this.gameState.player.selectedCards;
        if (!selectedCards || selectedCards.length === 0) {
            showToast('Select a card to play', 'warning');
            return;
        }
        
        // Validate selection
        const mainCards = selectedCards.filter(c => c.cardType === 'OFFENSE' || c.cardType === 'DEFENSE');
        const supportCards = selectedCards.filter(c => c.cardType === 'SUPPORT');
        
        if (mainCards.length !== 1) {
            showToast('You must play exactly one OFFENSE or DEFENSE card', 'warning');
            return;
        }
        
        if (supportCards.length > 1) {
            showToast('You can only play one SUPPORT card', 'warning');
            return;
        }
        
        // Check total cost
        const totalCost = selectedCards.reduce((sum, c) => sum + c.energyCost, 0);
        if (totalCost > this.gameState.player.energy) {
            showToast('Not enough energy to play these cards', 'warning');
            return;
        }
        
        // Remove cards from hand
        selectedCards.forEach(card => {
            const idx = this.gameState.player.hand.findIndex(c => c.id === card.id);
            if (idx !== -1) {
                this.gameState.player.hand.splice(idx, 1);
            }
        });
        
        // Spend energy
        this.gameState.player.energy -= totalCost;
        
        // Set locked play
        const mainCard = mainCards[0];
        const supportCard = supportCards.length > 0 ? supportCards[0] : null;
        
        this.gameState.player.lockedPlay = {
            type: 'CARD',
            mainCard: mainCard,
            supportCard: supportCard,
            cards: selectedCards // Keep reference to all cards
        };
        
        const playDesc = supportCard 
            ? `${mainCard.playerName} + ${supportCard.playerName} (Cost: ${totalCost})`
            : `${mainCard.playerName} (Cost: ${totalCost})`;
        
        this.addLog(`You played: ${playDesc}`);
        this.updateUI();
        
        // AI makes their play
        setTimeout(() => {
            this.aiPlay();
        }, 1000);
    }
        
    selectPass() {
        if (this.gameState.state !== STATES.ACTION) return;
        if (this.gameState.player.lockedPlay) return;
        
        this.gameState.player.lockedPlay = {
            type: 'PASS'
        };
        
        this.addLog('You passed this turn.');
        this.updateUI();
        
        // AI makes their play
        setTimeout(() => {
            this.aiPlay();
        }, 1000);
    }
    

    aiPlay() {
        // Simple AI: play highest affordable card, optionally with support
        const affordableMainCards = this.gameState.opponent.hand.filter(
            c => (c.cardType === 'OFFENSE' || c.cardType === 'DEFENSE') && 
                 c.energyCost <= this.gameState.opponent.energy
        );
        
        if (affordableMainCards.length === 0) {
            // Must pass
            this.gameState.opponent.lockedPlay = { type: 'PASS' };
            this.addLog('Opponent passed this turn.');
        } else {
            // Play best main card
            const bestMainCard = affordableMainCards.reduce((best, card) => {
                const cardValue = (card.offense || 0) + (card.defense || 0);
                const bestValue = (best.offense || 0) + (best.defense || 0);
                return cardValue > bestValue ? card : best;
            }, affordableMainCards[0]);
            
            // Check if we can afford a SUPPORT card too
            let supportCard = null;
            const remainingEnergy = this.gameState.opponent.energy - bestMainCard.energyCost;
            const affordableSupport = this.gameState.opponent.hand.filter(
                c => c.cardType === 'SUPPORT' && c.energyCost <= remainingEnergy
            );
            
            // 30% chance to use support if available
            if (affordableSupport.length > 0 && Math.random() < 0.3) {
                supportCard = affordableSupport[0];
            }
            
            // Remove cards from hand
            const cardsToPlay = [bestMainCard];
            if (supportCard) cardsToPlay.push(supportCard);
            
            cardsToPlay.forEach(card => {
                const idx = this.gameState.opponent.hand.findIndex(c => c.id === card.id);
                if (idx !== -1) {
                    this.gameState.opponent.hand.splice(idx, 1);
                }
            });
            
            // Spend energy
            const totalCost = cardsToPlay.reduce((sum, c) => sum + c.energyCost, 0);
            this.gameState.opponent.energy -= totalCost;
            
            this.gameState.opponent.lockedPlay = {
                type: 'CARD',
                mainCard: bestMainCard,
                supportCard: supportCard,
                cards: cardsToPlay
            };
            
            const playDesc = supportCard 
                ? `a card combo (Cost: ${totalCost})`
                : `a card (Cost: ${totalCost})`;
            
            this.addLog(`Opponent played ${playDesc}`);
        }
        
        this.updateUI();
        
        // Both players locked in - proceed to reveal
        setTimeout(() => {
            this.executeReveal();
        }, 1500);
    }    
    // ============================================================================
    // REVEAL & SCORING
    // ============================================================================
    
    executeReveal() {
        this.gameState.state = STATES.REVEAL;
        this.addLog('═══ REVEAL ═══');
        
        const turn = this.getCurrentTurn();
        turn.playerPlay = this.gameState.player.lockedPlay;
        turn.opponentPlay = this.gameState.opponent.lockedPlay;
        
        // Show reveal modal
        this.showRevealModal();
        
        setTimeout(() => {
            this.executeScoring();
        }, 5000);
    }
    

    executeScoring() {
        this.gameState.state = STATES.SCORING;
        this.addLog('Calculating scores...');
        
        const turn = this.getCurrentTurn();
        const playerPlay = turn.playerPlay;
        const opponentPlay = turn.opponentPlay;
        
        let playerPoints = 0;
        let opponentPoints = 0;
        
        // Calculate points based on plays
        if (playerPlay.type === 'CARD' && opponentPlay.type === 'CARD') {
            const playerMain = playerPlay.mainCard;
            const playerSupport = playerPlay.supportCard;
            const opponentMain = opponentPlay.mainCard;
            const opponentSupport = opponentPlay.supportCard;
            
            // Calculate boosted stats
            const playerBoost = playerSupport ? (playerSupport.boostValue || 0) : 0;
            const opponentBoost = opponentSupport ? (opponentSupport.boostValue || 0) : 0;
            
            let playerAttack = (playerMain.offense || 0) + playerBoost;
            let playerDefense = (playerMain.defense || 0) + playerBoost;
            let opponentAttack = (opponentMain.offense || 0) + opponentBoost;
            let opponentDefense = (opponentMain.defense || 0) + opponentBoost;
            
            // Player points = their offense - opponent defense
            playerPoints = Math.max(0, playerAttack - opponentDefense);
            
            // Opponent points = their offense - player defense
            opponentPoints = Math.max(0, opponentAttack - playerDefense);
            
            const playerCardDesc = playerSupport 
                ? `${playerMain.playerName} + ${playerSupport.playerName} (ATK:${playerAttack} DEF:${playerDefense})`
                : `${playerMain.playerName} (ATK:${playerAttack} DEF:${playerDefense})`;
            
            const opponentCardDesc = opponentSupport
                ? `Combo (ATK:${opponentAttack} DEF:${opponentDefense})`
                : `Card (ATK:${opponentAttack} DEF:${opponentDefense})`;
            
            this.addLog(`${playerCardDesc} vs ${opponentCardDesc}`);
            
        } else if (playerPlay.type === 'CARD') {
            // Only player played a card
            const playerMain = playerPlay.mainCard;
            const playerSupport = playerPlay.supportCard;
            const playerBoost = playerSupport ? (playerSupport.boostValue || 0) : 0;
            
            playerPoints = (playerMain.offense || 0) + playerBoost;
            
            const cardDesc = playerSupport
                ? `${playerMain.playerName} + ${playerSupport.playerName}`
                : playerMain.playerName;
            
            this.addLog(`${cardDesc} scores unopposed!`);
            
        } else if (opponentPlay.type === 'CARD') {
            // Only opponent played a card
            const opponentMain = opponentPlay.mainCard;
            const opponentSupport = opponentPlay.supportCard;
            const opponentBoost = opponentSupport ? (opponentSupport.boostValue || 0) : 0;
            
            opponentPoints = (opponentMain.offense || 0) + opponentBoost;
            this.addLog(`Opponent scores unopposed!`);
            
        } else {
            // Both passed
            this.addLog('Both players passed - no points scored.');
        }
        
        // Update scores
        turn.playerPoints = playerPoints;
        turn.opponentPoints = opponentPoints;
        turn.resolved = true;
        
        this.gameState.player.roundScore += playerPoints;
        this.gameState.opponent.roundScore += opponentPoints;
        this.gameState.player.totalScore += playerPoints;
        this.gameState.opponent.totalScore += opponentPoints;
        
        this.addLog(`Points: You +${playerPoints} | Opponent +${opponentPoints}`);
        this.addLog(`Round Score: You ${this.gameState.player.roundScore} - ${this.gameState.opponent.roundScore} Opponent`);
        
        // Move played cards to graveyard
        if (playerPlay.type === 'CARD' && playerPlay.cards) {
            playerPlay.cards.forEach(card => {
                this.gameState.player.graveyard.push(card);
            });
        }
        if (opponentPlay.type === 'CARD' && opponentPlay.cards) {
            opponentPlay.cards.forEach(card => {
                this.gameState.opponent.graveyard.push(card);
            });
        }
        
        this.updateUI();
        
        // Close reveal modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('revealModal'));
        if (modal) modal.hide();
        
        // Check if turn/round/match ends
        setTimeout(() => {
            this.executeTurnEnd();
        }, 2000);
    }    
    executeTurnEnd() {
        this.gameState.state = STATES.TURN_END;
        
        // Check if round ends
        if (this.gameState.currentTurn >= GAME_CONFIG.TURNS_PER_ROUND) {
            setTimeout(() => {
                this.executeRoundEnd();
            }, 1000);
        } else {
            // Advance to next turn
            this.gameState.currentTurn++;
            setTimeout(() => {
                this.startTurn();
            }, 1000);
        }
    }
    
    executeRoundEnd() {
        this.gameState.state = STATES.ROUND_END;
        
        const round = this.gameState.rounds[this.gameState.currentRound - 1];
        round.finalScore.player = this.gameState.player.roundScore;
        round.finalScore.opponent = this.gameState.opponent.roundScore;
        
        // Determine round winner
        if (this.gameState.player.roundScore > this.gameState.opponent.roundScore) {
            round.winner = 'player';
            this.gameState.player.roundsWon++;
            this.addLog(`═══ ROUND ${this.gameState.currentRound} END - YOU WIN! ═══`);
        } else if (this.gameState.opponent.roundScore > this.gameState.player.roundScore) {
            round.winner = 'opponent';
            this.gameState.opponent.roundsWon++;
            this.addLog(`═══ ROUND ${this.gameState.currentRound} END - OPPONENT WINS! ═══`);
        } else {
            round.winner = 'tie';
            this.addLog(`═══ ROUND ${this.gameState.currentRound} END - TIE! ═══`);
        }
        
        this.updateUI();
        
        // Check if match ends
        if (this.gameState.currentRound >= GAME_CONFIG.ROUNDS) {
            setTimeout(() => {
                this.executeMatchEnd();
            }, 2000);
        } else {
            // Advance to next round
            this.gameState.currentRound++;
            this.gameState.currentTurn = 1;
            this.gameState.player.roundScore = 0;
            this.gameState.opponent.roundScore = 0;
            
            // Increase max energy each round
            this.gameState.player.maxEnergy += GAME_CONFIG.ENERGY_PER_TURN;
            this.gameState.opponent.maxEnergy += GAME_CONFIG.ENERGY_PER_TURN;
            
            setTimeout(() => {
                this.startTurn();
            }, 2000);
        }
    }
    
    executeMatchEnd() {
        this.gameState.state = STATES.MATCH_END;
        
        // Determine final winner
        if (this.gameState.player.totalScore > this.gameState.opponent.totalScore) {
            this.gameState.winner = 'player';
            this.addLog('═══ MATCH COMPLETE - YOU WIN! ═══');
        } else if (this.gameState.opponent.totalScore > this.gameState.player.totalScore) {
            this.gameState.winner = 'opponent';
            this.addLog('═══ MATCH COMPLETE - OPPONENT WINS! ═══');
        } else {
            // Tie-breaker: rounds won
            if (this.gameState.player.roundsWon > this.gameState.opponent.roundsWon) {
                this.gameState.winner = 'player';
                this.addLog('═══ TIE-BREAKER: YOU WIN (MORE ROUNDS WON)! ═══');
            } else if (this.gameState.opponent.roundsWon > this.gameState.player.roundsWon) {
                this.gameState.winner = 'opponent';
                this.addLog('═══ TIE-BREAKER: OPPONENT WINS (MORE ROUNDS WON)! ═══');
            } else {
                // Final tie-breaker: remaining energy
                if (this.gameState.player.energy > this.gameState.opponent.energy) {
                    this.gameState.winner = 'player';
                    this.addLog('═══ TIE-BREAKER: YOU WIN (MORE ENERGY)! ═══');
                } else if (this.gameState.opponent.energy > this.gameState.player.energy) {
                    this.gameState.winner = 'opponent';
                    this.addLog('═══ TIE-BREAKER: OPPONENT WINS (MORE ENERGY)! ═══');
                } else {
                    // Coin flip
                    this.gameState.winner = Math.random() < 0.5 ? 'player' : 'opponent';
                    this.addLog(`═══ TIE-BREAKER: ${this.gameState.winner.toUpperCase()} WINS (COIN FLIP)! ═══`);
                }
            }
        }
        
        this.updateUI();
        
        // Store result and navigate
        this.app.matchResult = this.gameState;
        
        setTimeout(() => {
            this.app.showScreen('results');
        }, 3000);
    }
    
    // ============================================================================
    // HELPER FUNCTIONS
    // ============================================================================
    
    drawCards(playerId, count) {
        const player = this.gameState[playerId];
        let drawn = 0;
        
        for (let i = 0; i < count; i++) {
            if (player.deck.length === 0) break;
            
            const card = player.deck.shift();
            player.hand.push(card);
            drawn++;
            
            // Check hand size limit
            if (player.hand.length > GAME_CONFIG.MAX_HAND_SIZE) {
                const excess = player.hand.shift();
                player.graveyard.push(excess);
                
                if (playerId === 'player') {
                    this.addLog(`Hand limit exceeded - ${excess.playerName} discarded.`);
                }
            }
        }
        
        return drawn;
    }
    
    getCurrentTurn() {
        return this.gameState.rounds[this.gameState.currentRound - 1]
            .turns[this.gameState.currentTurn - 1];
    }
    
    addLog(message) {
        this.gameState.eventLog.unshift({
            timestamp: Date.now(),
            message: message
        });
        
        // Keep log size manageable
        if (this.gameState.eventLog.length > 100) {
            this.gameState.eventLog.pop();
        }
    }
    
    // ============================================================================
    // RENDERING METHODS
    // ============================================================================
    
    renderHUD() {
        const state = this.gameState;
        
        return `
            <nav class="navbar navbar-dark bg-dark sticky-top">
                <div class="container-fluid">
                    <span class="navbar-brand">
                        <i class="bi bi-trophy"></i>
                        Round ${state.currentRound}/${GAME_CONFIG.ROUNDS}
                        - Turn ${state.currentTurn}/${GAME_CONFIG.TURNS_PER_ROUND}
                    </span>
                    
                    <div class="d-flex align-items-center gap-3">
                        <span class="badge bg-success">Your Score: ${state.player.totalScore}</span>
                        <span class="badge bg-danger">Opponent: ${state.opponent.totalScore}</span>
                        <span class="badge bg-primary">
                            Rounds: ${state.player.roundsWon}-${state.opponent.roundsWon}
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
        return `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="row">
                        ${this.gameState.rounds.map((round, rIdx) => 
                            this.renderRoundColumn(round, rIdx)
                        ).join('')}
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
                        ${isComplete ? `
                            <br><span class="text-${
                                round.winner === 'player' ? 'success' : 
                                round.winner === 'opponent' ? 'danger' : 'warning'
                            }">
                                ${round.winner === 'tie' ? 'Tie' : 
                                  round.winner === 'player' ? 'Won' : 'Lost'}
                            </span>
                        ` : ''}
                    </h6>
                    
                    ${round.turns.map((turn, tIdx) => 
                        this.renderTurnCell(turn, tIdx, rIdx)
                    ).join('')}
                    
                    ${isComplete ? `
                        <div class="round-score mt-2">
                            <small>You: ${round.finalScore.player}</small>
                            <small>Opp: ${round.finalScore.opponent}</small>
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
                <div class="tally">
                    <div class="plays">
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
                    </div>

                ${turn.resolved ? `
                    <div class="turn-score">
                        <span class="badge bg-success">${turn.playerPoints}</span>
                        <span class="badge bg-danger">${turn.opponentPoints}</span>
                    </div>
                ` : ''}
            </div>
            </div>
        `;
    }
    
  describePlay(play) {
        if (!play) return '—';
        if (play.type === 'PASS') return 'PASS';
        if (play.type === 'CARD' && play.mainCard) {
            const mainName = play.mainCard.playerName.split(' ')[0];
            if (play.supportCard) {
                return `${mainName}+SUP`;
            }
            return mainName;
        }
        return '—';
    }
    
    
    renderPlayerArea() {
        const state = this.gameState;
        const canCycle = !state.player.cycledThisTurn && 
                        state.player.energy >= GAME_CONFIG.CYCLE_COST &&
                        state.state === STATES.ACTION;
        
        return `
            <div class="card 1">
                <div class="card-body">
                    <!-- Energy Display -->
                    <div class="row mb-3">
                        <div class="col-6">
                            ${EnergyMeter.render(state.player.energy, 10, 'success', 'Your Energy')}
                        </div>
                        <div class="col-6">
                            ${EnergyMeter.render(state.opponent.energy, 10, 'danger', 'Opponent Energy')}
                        </div>
                    </div>
                    
                    <!-- Deck Info -->
                    <div class="row mb-3">
                        <div class="col-6">
                            <small class="text-muted">
                                <i class="bi bi-stack"></i> Deck: ${state.player.deck.length} cards
                                | Hand: ${state.player.hand.length}/${GAME_CONFIG.MAX_HAND_SIZE}
                                | Graveyard: ${state.player.graveyard.length}
                            </small>
                        </div>
                        <div class="col-6 text-end">
                            ${canCycle ? `
                                <span class="badge bg-info">
                                    <i class="bi bi-arrow-repeat"></i> 
                                    Cycle Available (${GAME_CONFIG.CYCLE_COST} energy)
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    
                    <!-- Hand -->
                    <div id="handArea">
                        ${this.renderHand()}
                    </div>
                    
                    <!-- Selection Info -->
                    <div id="selectionInfo" class="alert alert-info mt-3">
                        ${this.getSelectionInfo()}
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="d-flex gap-2 justify-content-center">
                        <button id="playCardBtn" class="btn btn-success btn-lg" 
                                ${state.state !== STATES.ACTION || !state.player.selectedCards || state.player.lockedPlay ? 'disabled' : ''}>
                            <i class="bi bi-play-circle"></i> Play Card
                        </button>
                        <button id="passBtn" class="btn btn-warning btn-lg"
                                ${state.state !== STATES.ACTION || state.player.lockedPlay ? 'disabled' : ''}>
                            <i class="bi bi-skip-forward"></i> Pass
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderHand() {
        const state = this.gameState;
        const canCycle = !state.player.cycledThisTurn && 
                        state.player.energy >= GAME_CONFIG.CYCLE_COST &&
                        state.state === STATES.ACTION;
        
        if (state.player.hand.length === 0) {
            return '<p class="text-center text-muted">No cards in hand</p>';
        }
        
        const selectedCards = state.player.selectedCards || [];
        
        return `
            <div class="hand-grid">
                ${state.player.hand.map(card => {
                    const isSelected = selectedCards.find(c => c.id === card.id);
                    const totalCost = selectedCards.reduce((sum, c) => sum + c.energyCost, 0);
                    const wouldBeAffordable = totalCost - (isSelected ? card.energyCost : 0) + card.energyCost <= state.player.energy;
                    
                    return `
                    <div class="card-hand-holder">
                             ${CardTile.renderGameMode(card, {
                                selected: !!isSelected,
                                affordable: wouldBeAffordable,
                                showCycleBtn: canCycle,
                                onSelect: state.state === STATES.ACTION && !state.player.lockedPlay,
                                disabled: state.player.lockedPlay !== null
                            })}
                    </div>
                    `;
                }).join('')}
            </div>
        `;
    }
      getSelectionInfo() {
        const state = this.gameState;
        
        if (state.player.lockedPlay) {
            if (state.player.lockedPlay.type === 'PASS') {
                return '⏭️ You passed - waiting for opponent...';
            } else {
                const mainCard = state.player.lockedPlay.mainCard;
                const supportCard = state.player.lockedPlay.supportCard;
                const cardDesc = supportCard 
                    ? `${mainCard.playerName} + ${supportCard.playerName}`
                    : mainCard.playerName;
                return `✓ You played: ${cardDesc} - waiting for opponent...`;
            }
        }
        
        if (state.state !== STATES.ACTION) {
            return `Current phase: ${state.state}`;
        }
        
        const selectedCards = state.player.selectedCards || [];
        if (selectedCards.length > 0) {
            const mainCards = selectedCards.filter(c => c.cardType === 'OFFENSE' || c.cardType === 'DEFENSE');
            const supportCards = selectedCards.filter(c => c.cardType === 'SUPPORT');
            const totalCost = selectedCards.reduce((sum, c) => sum + c.energyCost, 0);
            
            let desc = '';
            if (mainCards.length > 0) {
                desc = mainCards[0].playerName;
                if (supportCards.length > 0) {
                    desc += ` + ${supportCards[0].playerName}`;
                }
            }
            
            return `Selected: ${desc} (Cost: ${totalCost}) - Click "Play Card" to confirm`;
        }
        
        return 'Select an OFFENSE or DEFENSE card to play (optionally add a SUPPORT card), or click Pass';
    }
    
    
    renderLog() {
        return `
            <div class="card">
                <div class="card-header">
                    <h6 class="mb-0">
                        <i class="bi bi-journal-text"></i> Event Log
                    </h6>
                </div>
                <div class="card-body p-2" style="max-height: 600px; overflow-y: auto;" id="eventLog">
                    ${this.renderLogEntries()}
                </div>
            </div>
        `;
    }
    
    renderLogEntries() {
        return this.gameState.eventLog.map(entry => `
            <div class="log-entry">
                <small>${entry.message}</small>
            </div>
        `).join('');
    }
    
    renderMulliganModal() {
        return `
            <div class="modal fade" id="mulliganModal" data-bs-backdrop="static" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Mulligan Phase</h5>
                        </div>
                        <div class="modal-body">
                            <p>You may discard any number of cards and draw back <strong>(same number - 1)</strong> card.</p>
                            <p class="text-muted">This is your only mulligan for the match.</p>
                            
                            <div id="mulliganHand" class="row g-2 mt-3">
                                <!-- Will be populated dynamically -->
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" id="skipMulliganBtn">
                                Keep Hand
                            </button>
                            <button type="button" class="btn btn-primary" id="confirmMulliganBtn">
                                Mulligan Selected Cards
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderRevealModal() {
        return `
            <div class="modal fade" id="revealModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Card Reveal</h5>
                        </div>
                        <div class="modal-body" id="revealContent">
                            <div class="text-center">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Revealing...</span>
                                </div>
                                <p class="mt-3">Revealing plays...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    

    showRevealModal() {
        const modal = new bootstrap.Modal(document.getElementById('revealModal'));
        modal.show();
        
        setTimeout(() => {
            const content = document.getElementById('revealContent');
            const playerPlay = this.gameState.player.lockedPlay;
            const opponentPlay = this.gameState.opponent.lockedPlay;
            
            // Helper function to render a play
            const renderPlay = (play, isPlayer) => {
                if (play.type === 'PASS') {
                    return '<p class="text-center text-warning fs-3">PASS</p>';
                }
                
                if (play.type === 'CARD') {
                    const mainCard = play.mainCard;
                    const supportCard = play.supportCard;
                    
                    let html = CardTile.renderGameMode(mainCard, { large: true });
                    
                    if (supportCard) {
                        const boostIcon = mainCard.cardType === 'OFFENSE' ? '⚔️' : '🛡️';
                        html += `
                            <div class="text-center my-2">
                                <span class="badge bg-success fs-6">+ ${boostIcon} ${supportCard.boostValue || 0}</span>
                            </div>
                            ${CardTile.renderGameMode(supportCard, { large: true })}
                        `;
                    }
                    
                    return html;
                }
                
                return '<p class="text-center text-muted">—</p>';
            };
            
            content.innerHTML = `
                <h5 class="text-center mb-4">Cards Revealed!</h5>
                <div class="row">
                    <div class="col-6">
                        <h6 class="text-center mb-3">Your Play</h6>
                        ${renderPlay(playerPlay, true)}
                    </div>
                    <div class="col-6">
                        <h6 class="text-center mb-3">Opponent Play</h6>
                        ${renderPlay(opponentPlay, false)}
                    </div>
                </div>
            `;
        }, 1000);
    }
    
    
    // ============================================================================
    // EVENT HANDLERS
    // ============================================================================
    
    attachEventListeners() {
        // Card selection
        document.querySelectorAll('[data-card-id]').forEach(el => {
            el.addEventListener('click', (e) => {
                const cardId = e.currentTarget.dataset.cardId;
                
                if (e.target.closest('[data-cycle-btn]')) {
                    // Cycle button clicked
                    this.cycleCard('player', cardId);
                } else {
                    // Card selected
                    this.selectCard(cardId);
                }
            });
        });
        
        // Action buttons
        const playCardBtn = document.getElementById('playCardBtn');
        if (playCardBtn) {
            playCardBtn.addEventListener('click', () => this.playCard());
        }
        
        const passBtn = document.getElementById('passBtn');
        if (passBtn) {
            passBtn.addEventListener('click', () => this.selectPass());
        }
        
        // Forfeit
        const forfeitBtn = document.getElementById('forfeitBtn');
        if (forfeitBtn) {
            forfeitBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to forfeit this match?')) {
                    this.forfeitMatch();
                }
            });
        }
        
        // Mulligan
        const skipMulliganBtn = document.getElementById('skipMulliganBtn');
        if (skipMulliganBtn) {
            skipMulliganBtn.addEventListener('click', () => {
                this.processMulligan([]);
            });
        }
        
        const confirmMulliganBtn = document.getElementById('confirmMulliganBtn');
        if (confirmMulliganBtn) {
            confirmMulliganBtn.addEventListener('click', () => {
                const selected = Array.from(
                    document.querySelectorAll('#mulliganHand [data-card-id].selected')
                ).map(el => el.dataset.cardId);
                
                this.processMulligan(selected);
            });
        }
        
        // Update mulligan hand display
        const mulliganHand = document.getElementById('mulliganHand');
        if (mulliganHand && this.gameState.state === STATES.MULLIGAN) {
            mulliganHand.innerHTML = this.gameState.player.hand.map(card => `
                <div class="col-md-3 col-sm-4 col-6">
                    ${CardTile.renderGameMode(card, {
                        selectable: true,
                        onSelect: true
                    })}
                </div>
            `).join('');
        }
    }
    


    forfeitMatch() {
        this.gameState.winner = 'opponent';
        this.gameState.state = STATES.MATCH_END;
        this.addLog('═══ MATCH FORFEITED ═══');
        
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
                    ${this.gameState.rounds.map((round, rIdx) => 
                        this.renderRoundColumn(round, rIdx)
                    ).join('')}
                </div>
            `;
        }
        
        // Update player area
        const playerCardHolder = document.querySelector('.match-screen .card:last-of-type .card-body').parentElement;
        const playerCard = document.querySelector('.match-screen .card:last-of-type .card-body');
        if (playerCard) {
            const content = this.renderPlayerArea();
            playerCard.innerHTML = content.replace(/|$/g, '');
        }

        playerCardHolder.innerHTML = '';
        playerCardHolder.appendChild(boardContainer);
        playerCardHolder.appendChild(playerCard);
        
        // Update log
        const logContainer = document.getElementById('eventLog');
        if (logContainer) {
            logContainer.innerHTML = this.renderLogEntries();
        }
        
        // Re-attach listeners
        this.attachEventListeners();
    }
    
    destroy() {
        if (this.autoAdvanceTimeout) {
            clearTimeout(this.autoAdvanceTimeout);
        }
    }
}