/**
 * Game State Machine
 * Manages the finite state machine for match flow
 * States: INIT → SELECTION → LOCKED → REVEAL → SCORING → NEXT_TURN → ROUND_END → MATCH_END
 */

import { calculateScore, determineTieBreaker } from './scoring.js';
import { applyEnergyRegen, canAffordPlay, deductEnergy } from './energy.js';
import { Logger } from '../utils/logger.js';

const STATES = {
    INIT: 'INIT',
    SELECTION: 'SELECTION',
    LOCKED: 'LOCKED',
    REVEAL: 'REVEAL',
    SCORING: 'SCORING',
    NEXT_TURN: 'NEXT_TURN',
    ROUND_END: 'ROUND_END',
    MATCH_END: 'MATCH_END'
};

/**
 * Create initial game state
 */
export function createInitialState(playerDeck, opponentDeck, config) {
    const state = {
        // Match metadata
        matchId: generateMatchId(),
        startTime: Date.now(),
        config: config,
        
        // Current position
        currentRound: 1,
        currentTurn: 1,
        state: STATES.INIT,
        
        // Players
        player: {
            id: 'player',
            deck: [...playerDeck],
            hand: [...playerDeck],
            graveyard: [],
            energy: config.START_ENERGY,
            passedLastTurn: false,
            selectedCards: [],
            lockedPlay: null,
            totalScore: 0,
            roundsWon: 0
        },
        
        opponent: {
            id: 'opponent',
            deck: [...opponentDeck],
            hand: [...opponentDeck],
            graveyard: [],
            energy: config.START_ENERGY,
            passedLastTurn: false,
            selectedCards: [],
            lockedPlay: null,
            totalScore: 0,
            roundsWon: 0
        },
        
        // Round/turn tracking
        rounds: [],
        currentRoundScore: { player: 0, opponent: 0 },
        
        // Event log
        events: [],
        
        // Winner (null until match ends)
        winner: null
    };
    
    // Initialize rounds structure
    for (let r = 0; r < config.ROUNDS; r++) {
        state.rounds[r] = {
            roundNumber: r + 1,
            turns: [],
            finalScore: { player: 0, opponent: 0 },
            winner: null
        };
        
        for (let t = 0; t < config.TURNS_PER_ROUND; t++) {
            state.rounds[r].turns[t] = {
                turnNumber: t + 1,
                playerPlay: null,
                opponentPlay: null,
                playerPoints: 0,
                opponentPoints: 0,
                resolved: false
            };
        }
    }
    
    return state;
}

/**
 * State machine transition
 */
export function transition(state, action) {
    Logger.debug('State transition', { from: state.state, action: action.type });
    
    const newState = { ...state };
    
    switch (state.state) {
        case STATES.INIT:
            return handleInit(newState, action);
            
        case STATES.SELECTION:
            return handleSelection(newState, action);
            
        case STATES.LOCKED:
            return handleLocked(newState, action);
            
        case STATES.REVEAL:
            return handleReveal(newState, action);
            
        case STATES.SCORING:
            return handleScoring(newState, action);
            
        case STATES.NEXT_TURN:
            return handleNextTurn(newState, action);
            
        case STATES.ROUND_END:
            return handleRoundEnd(newState, action);
            
        case STATES.MATCH_END:
            return handleMatchEnd(newState, action);
            
        default:
            Logger.error('Invalid state', { state: state.state });
            return state;
    }
}

/**
 * Handle INIT state
 */
function handleInit(state, action) {
    if (action.type === 'START_MATCH') {
        state.state = STATES.SELECTION;
        addEvent(state, 'Match started', { 
            round: state.currentRound, 
            turn: state.currentTurn 
        });
        addEvent(state, `Round ${state.currentRound} begins`);
        addEvent(state, `Turn ${state.currentTurn} - Select your cards`);
    }
    return state;
}

/**
 * Handle SELECTION state
 */
function handleSelection(state, action) {
    switch (action.type) {
        case 'SELECT_CARD':
            return selectCard(state, action.playerId, action.cardId);
            
        case 'DESELECT_CARD':
            return deselectCard(state, action.playerId, action.cardId);
            
        case 'SELECT_PASS':
            return selectPass(state, action.playerId);
            
        case 'LOCK_IN':
            return lockInPlay(state, action.playerId);
            
        default:
            return state;
    }
}

/**
 * Handle LOCKED state (both players locked)
 */
function handleLocked(state, action) {
    if (action.type === 'TRIGGER_REVEAL') {
        state.state = STATES.REVEAL;
        addEvent(state, 'Revealing plays...');
    }
    return state;
}

/**
 * Handle REVEAL state
 */
function handleReveal(state, action) {
    if (action.type === 'TRIGGER_SCORING') {
        state.state = STATES.SCORING;
        
        const turn = getCurrentTurn(state);
        turn.playerPlay = state.player.lockedPlay;
        turn.opponentPlay = state.opponent.lockedPlay;
        
        // Log reveals
        const playerDesc = describePlay(state.player.lockedPlay);
        const opponentDesc = describePlay(state.opponent.lockedPlay);
        
        addEvent(state, `You played: ${playerDesc}`);
        addEvent(state, `Opponent played: ${opponentDesc}`);
    }
    return state;
}

/**
 * Handle SCORING state
 */
function handleScoring(state, action) {
    if (action.type === 'CALCULATE_SCORE') {
        const turn = getCurrentTurn(state);
        const result = calculateScore(
            state.player.lockedPlay,
            state.opponent.lockedPlay
        );
        
        turn.playerPoints = result.playerPoints;
        turn.opponentPoints = result.opponentPoints;
        turn.resolved = true;
        
        state.currentRoundScore.player += result.playerPoints;
        state.currentRoundScore.opponent += result.opponentPoints;
        
        state.player.totalScore += result.playerPoints;
        state.opponent.totalScore += result.opponentPoints;
        
        addEvent(state, `You scored ${result.playerPoints} points`);
        addEvent(state, `Opponent scored ${result.opponentPoints} points`);
        
        // Move played cards to graveyard
        moveCardsToGraveyard(state);
        
        // Check if round/match is over
        if (state.currentTurn >= state.config.TURNS_PER_ROUND) {
            state.state = STATES.ROUND_END;
        } else {
            state.state = STATES.NEXT_TURN;
        }
    }
    return state;
}

/**
 * Handle NEXT_TURN state
 */
function handleNextTurn(state, action) {
    if (action.type === 'ADVANCE_TURN') {
        state.currentTurn++;
        
        // Apply energy regeneration
        state.player.energy = applyEnergyRegen(
            state.player.energy,
            state.player.passedLastTurn,
            state.config
        );
        
        state.opponent.energy = applyEnergyRegen(
            state.opponent.energy,
            state.opponent.passedLastTurn,
            state.config
        );
        
        addEvent(state, `Turn ${state.currentTurn} begins`);
        
        if (state.player.passedLastTurn) {
            addEvent(state, `You gained +${state.config.PASS_BONUS} bonus energy for passing`);
        }
        
        if (state.opponent.passedLastTurn) {
            addEvent(state, `Opponent gained +${state.config.PASS_BONUS} bonus energy for passing`);
        }
        
        // Reset turn state
        state.player.passedLastTurn = false;
        state.opponent.passedLastTurn = false;
        state.player.lockedPlay = null;
        state.opponent.lockedPlay = null;
        state.player.selectedCards = [];
        state.opponent.selectedCards = [];
        
        state.state = STATES.SELECTION;
    }
    return state;
}

/**
 * Handle ROUND_END state
 */
function handleRoundEnd(state, action) {
    if (action.type === 'RESOLVE_ROUND') {
        const currentRound = state.rounds[state.currentRound - 1];
        currentRound.finalScore = {
            player: state.currentRoundScore.player,
            opponent: state.currentRoundScore.opponent
        };
        
        // Determine round winner
        if (state.currentRoundScore.player > state.currentRoundScore.opponent) {
            currentRound.winner = 'player';
            state.player.roundsWon++;
            addEvent(state, `You won Round ${state.currentRound}! (${state.currentRoundScore.player} - ${state.currentRoundScore.opponent})`);
        } else if (state.currentRoundScore.opponent > state.currentRoundScore.player) {
            currentRound.winner = 'opponent';
            state.opponent.roundsWon++;
            addEvent(state, `Opponent won Round ${state.currentRound}! (${state.currentRoundScore.opponent} - ${state.currentRoundScore.player})`);
        } else {
            currentRound.winner = 'tie';
            addEvent(state, `Round ${state.currentRound} ended in a tie! (${state.currentRoundScore.player} - ${state.currentRoundScore.opponent})`);
        }
        
        // Check if match is over
        if (state.player.roundsWon >= 3 || state.opponent.roundsWon >= 3) {
            state.state = STATES.MATCH_END;
            state.winner = state.player.roundsWon >= 3 ? 'player' : 'opponent';
            addEvent(state, `Match Over! ${state.winner === 'player' ? 'You win' : 'Opponent wins'}!`);
        } else if (state.currentRound >= state.config.ROUNDS) {
            // All rounds played, determine winner
            state.state = STATES.MATCH_END;
            
            if (state.player.roundsWon > state.opponent.roundsWon) {
                state.winner = 'player';
            } else if (state.opponent.roundsWon > state.player.roundsWon) {
                state.winner = 'opponent';
            } else {
                // Tie-breaker
                const tieResult = determineTieBreaker(state.player, state.opponent);
                state.winner = tieResult.winner;
                addEvent(state, `Tie-breaker: ${tieResult.reason}`);
            }
            
            addEvent(state, `Match Over! ${state.winner === 'player' ? 'You win' : 'Opponent wins'}!`);
        } else {
            // Next round
            state.currentRound++;
            state.currentTurn = 1;
            state.currentRoundScore = { player: 0, opponent: 0 };
            
            // Reset energy for new round
            state.player.energy = state.config.START_ENERGY;
            state.opponent.energy = state.config.START_ENERGY;
            state.player.passedLastTurn = false;
            state.opponent.passedLastTurn = false;
            
            addEvent(state, `Round ${state.currentRound} begins`);
            state.state = STATES.SELECTION;
        }
    }
    return state;
}

/**
 * Handle MATCH_END state
 */
function handleMatchEnd(state, action) {
    // Terminal state - no transitions
    return state;
}

/**
 * Select a card
 */
function selectCard(state, playerId, cardId) {
    const player = state[playerId];
    
    if (!player) return state;
    
    const card = player.hand.find(c => c.id === cardId);
    if (!card) return state;
    
    // Check if already selected
    if (player.selectedCards.includes(cardId)) {
        return state;
    }
    
    // Validate selection based on card type and current selection
    const currentSelection = player.selectedCards.map(id => 
        player.hand.find(c => c.id === id)
    );
    
    if (card.cardType === 'OFFENSE') {
        // Only one offense card allowed, can combine with support
        const hasOffense = currentSelection.some(c => c.cardType === 'OFFENSE');
        if (hasOffense) return state;
        
        // Replace any defense with this offense
        player.selectedCards = currentSelection
            .filter(c => c.cardType === 'SUPPORT')
            .map(c => c.id);
        player.selectedCards.push(cardId);
        
    } else if (card.cardType === 'DEFENSE') {
        // Only one defense card allowed, cannot combine with offense/support
        player.selectedCards = [cardId];
        
    } else if (card.cardType === 'SUPPORT') {
        // Can only add support if offense is already selected
        const hasOffense = currentSelection.some(c => c.cardType === 'OFFENSE');
        if (!hasOffense) return state;
        
        // Only one support allowed
        const hasSupport = currentSelection.some(c => c.cardType === 'SUPPORT');
        if (hasSupport) return state;
        
        player.selectedCards.push(cardId);
    }
    
    return state;
}

/**
 * Deselect a card
 */
function deselectCard(state, playerId, cardId) {
    const player = state[playerId];
    
    if (!player) return state;
    
    player.selectedCards = player.selectedCards.filter(id => id !== cardId);
    
    return state;
}

/**
 * Select pass
 */
function selectPass(state, playerId) {
    const player = state[playerId];
    
    if (!player) return state;
    
    player.selectedCards = [];
    player.lockedPlay = { type: 'PASS' };
    
    return state;
}

/**
 * Lock in play
 */
function lockInPlay(state, playerId) {
    const player = state[playerId];
    
    if (!player) return state;
    
    // If already passed, do nothing
    if (player.lockedPlay?.type === 'PASS') {
        player.passedLastTurn = true;
    } else {
        // Get selected cards
        const cards = player.selectedCards.map(id => 
            player.hand.find(c => c.id === id)
        ).filter(c => c);
        
        if (cards.length === 0) return state;
        
        // Check affordability
        const totalCost = cards.reduce((sum, card) => sum + card.energyCost, 0);
        if (totalCost > player.energy) return state;
        
        // Deduct energy
        player.energy = deductEnergy(player.energy, totalCost);
        
        // Create play object
        const offenseCard = cards.find(c => c.cardType === 'OFFENSE');
        const defenseCard = cards.find(c => c.cardType === 'DEFENSE');
        const supportCard = cards.find(c => c.cardType === 'SUPPORT');
        
        player.lockedPlay = {
            type: offenseCard ? 'OFFENSE' : 'DEFENSE',
            cards: cards,
            offenseCard,
            defenseCard,
            supportCard
        };
        
        // Remove cards from hand
        player.hand = player.hand.filter(c => !cards.includes(c));
    }
    
    // Check if both players have locked in
    if (state.player.lockedPlay && state.opponent.lockedPlay) {
        state.state = STATES.LOCKED;
        addEvent(state, 'Both players locked in');
    }
    
    return state;
}

/**
 * Move played cards to graveyard
 */
function moveCardsToGraveyard(state) {
    if (state.player.lockedPlay?.cards) {
        state.player.graveyard.push(...state.player.lockedPlay.cards);
    }
    
    if (state.opponent.lockedPlay?.cards) {
        state.opponent.graveyard.push(...state.opponent.lockedPlay.cards);
    }
}

/**
 * Get current turn object
 */
function getCurrentTurn(state) {
    return state.rounds[state.currentRound - 1].turns[state.currentTurn - 1];
}

/**
 * Describe a play for logging
 */
function describePlay(play) {
    if (!play) return 'Nothing';
    if (play.type === 'PASS') return 'PASS';
    
    const parts = [];
    
    if (play.offenseCard) {
        parts.push(`${play.offenseCard.playerName} (OFF: ${play.offenseCard.offense})`);
    }
    
    if (play.defenseCard) {
        parts.push(`${play.defenseCard.playerName} (DEF: ${play.defenseCard.defense})`);
    }
    
    if (play.supportCard) {
        parts.push(`+ ${play.supportCard.playerName} (SUPPORT)`);
    }
    
    return parts.join(' ');
}

/**
 * Add event to log
 */
function addEvent(state, message, data = {}) {
    state.events.push({
        timestamp: Date.now(),
        round: state.currentRound,
        turn: state.currentTurn,
        message,
        data
    });
    
    Logger.info(message, data);
}

/**
 * Generate unique match ID
 */
function generateMatchId() {
    return `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Export state constants
 */
export { STATES };