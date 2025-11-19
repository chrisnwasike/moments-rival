/**
 * Scoring Logic
 * Calculate points from simultaneous plays and determine tie-breakers
 */

import { Logger } from '../utils/logger.js';

/**
 * Calculate score for simultaneous reveal
 * @param {Object} playerPlay - Player's locked play
 * @param {Object} opponentPlay - Opponent's locked play
 * @returns {Object} { playerPoints, opponentPoints, description }
 */
export function calculateScore(playerPlay, opponentPlay) {
    Logger.debug('Calculating score', { playerPlay, opponentPlay });
    
    // Handle passes
    if (playerPlay.type === 'PASS' && opponentPlay.type === 'PASS') {
        return {
            playerPoints: 0,
            opponentPoints: 0,
            description: 'Both players passed'
        };
    }
    
    if (playerPlay.type === 'PASS') {
        return {
            playerPoints: 0,
            opponentPoints: calculateOffensiveValue(opponentPlay),
            description: 'Player passed, opponent scores freely'
        };
    }
    
    if (opponentPlay.type === 'PASS') {
        return {
            playerPoints: calculateOffensiveValue(playerPlay),
            opponentPoints: 0,
            description: 'Opponent passed, player scores freely'
        };
    }
    
    // Both players made plays
    const playerOffense = calculateOffensiveValue(playerPlay);
    const playerDefense = calculateDefensiveValue(playerPlay);
    
    const opponentOffense = calculateOffensiveValue(opponentPlay);
    const opponentDefense = calculateDefensiveValue(opponentPlay);
    
    // Offense vs Defense calculation
    // Points scored = max(0, offense - opponent's defense)
    const playerPoints = Math.max(0, playerOffense - opponentDefense);
    const opponentPoints = Math.max(0, opponentOffense - playerDefense);
    
    return {
        playerPoints,
        opponentPoints,
        description: `Player OFF:${playerOffense} DEF:${playerDefense} vs Opponent OFF:${opponentOffense} DEF:${opponentDefense}`
    };
}

/**
 * Calculate offensive value of a play
 */
function calculateOffensiveValue(play) {
    if (!play || play.type === 'PASS') return 0;
    if (play.type === 'DEFENSE') return 0;
    
    let value = 0;
    
    // Base offense from offense card
    if (play.offenseCard) {
        value += play.offenseCard.offense || 0;
    }
    
    // Bonus from support card
    if (play.supportCard) {
        const supportBonus = play.supportCard.agility || 0;
        value += Math.floor(supportBonus * 0.5); // Support adds 50% of agility
    }
    
    return value;
}

/**
 * Calculate defensive value of a play
 */
function calculateDefensiveValue(play) {
    if (!play || play.type === 'PASS') return 0;
    
    let value = 0;
    
    // Defense from defense card
    if (play.defenseCard) {
        value += play.defenseCard.defense || 0;
    }
    
    // Passive defense from offense cards
    if (play.offenseCard) {
        value += Math.floor((play.offenseCard.defense || 0) * 0.3); // 30% of defense stat
    }
    
    return value;
}

/**
 * Determine match winner via tie-breaker
 * Used when rounds won are equal after all rounds
 */
export function determineTieBreaker(player, opponent) {
    Logger.info('Applying tie-breaker logic');
    
    // 1. Total points scored
    if (player.totalScore > opponent.totalScore) {
        return {
            winner: 'player',
            reason: `Total score: ${player.totalScore} vs ${opponent.totalScore}`
        };
    }
    
    if (opponent.totalScore > player.totalScore) {
        return {
            winner: 'opponent',
            reason: `Total score: ${opponent.totalScore} vs ${player.totalScore}`
        };
    }
    
    // 2. Remaining hand strength (sum of top 3 offense cards)
    const playerHandStrength = calculateHandStrength(player.hand);
    const opponentHandStrength = calculateHandStrength(opponent.hand);
    
    if (playerHandStrength > opponentHandStrength) {
        return {
            winner: 'player',
            reason: `Hand strength: ${playerHandStrength} vs ${opponentHandStrength}`
        };
    }
    
    if (opponentHandStrength > playerHandStrength) {
        return {
            winner: 'opponent',
            reason: `Hand strength: ${opponentHandStrength} vs ${playerHandStrength}`
        };
    }
    
    // 3. Remaining energy
    if (player.energy > opponent.energy) {
        return {
            winner: 'player',
            reason: `Remaining energy: ${player.energy} vs ${opponent.energy}`
        };
    }
    
    if (opponent.energy > player.energy) {
        return {
            winner: 'opponent',
            reason: `Remaining energy: ${opponent.energy} vs ${player.energy}`
        };
    }
    
    // 4. Coin flip (deterministic based on match data)
    const coinFlip = (player.deck.length + opponent.deck.length) % 2;
    
    return {
        winner: coinFlip === 0 ? 'player' : 'opponent',
        reason: 'Coin flip (all other factors equal)'
    };
}

/**
 * Calculate hand strength (sum of top 3 offense values)
 */
function calculateHandStrength(hand) {
    if (!hand || hand.length === 0) return 0;
    
    return hand
        .filter(card => card.cardType === 'OFFENSE')
        .sort((a, b) => (b.offense || 0) - (a.offense || 0))
        .slice(0, 3)
        .reduce((sum, card) => sum + (card.offense || 0), 0);
}

/**
 * Validate play is legal
 */
export function isValidPlay(cards, availableEnergy) {
    if (!cards || cards.length === 0) return false;
    
    // Check energy cost
    const totalCost = cards.reduce((sum, card) => sum + (card.energyCost || 0), 0);
    if (totalCost > availableEnergy) return false;
    
    // Check card type combinations
    const offenseCount = cards.filter(c => c.cardType === 'OFFENSE').length;
    const defenseCount = cards.filter(c => c.cardType === 'DEFENSE').length;
    const supportCount = cards.filter(c => c.cardType === 'SUPPORT').length;
    
    // Defense cannot be combined with anything
    if (defenseCount > 0 && (offenseCount > 0 || supportCount > 0)) {
        return false;
    }
    
    // Only one of each type
    if (offenseCount > 1 || defenseCount > 1 || supportCount > 1) {
        return false;
    }
    
    // Support requires offense
    if (supportCount > 0 && offenseCount === 0) {
        return false;
    }
    
    return true;
}