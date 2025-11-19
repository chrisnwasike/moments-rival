/**
 * Energy System
 * Manages energy regeneration, costs, and pass bonuses
 */

import { Logger } from '../utils/logger.js';

/**
 * Apply energy regeneration at start of turn
 * @param {number} currentEnergy - Current energy amount
 * @param {boolean} passedLastTurn - Whether player passed last turn
 * @param {Object} config - Game configuration
 * @returns {number} New energy amount
 */
export function applyEnergyRegen(currentEnergy, passedLastTurn, config) {
    let newEnergy = currentEnergy + config.ENERGY_PER_TURN;
    
    if (passedLastTurn) {
        newEnergy += config.PASS_BONUS;
    }
    
    // No maximum cap - energy can accumulate
    Logger.debug('Energy regenerated', { 
        from: currentEnergy, 
        to: newEnergy, 
        passBonus: passedLastTurn 
    });
    
    return newEnergy;
}

/**
 * Deduct energy cost
 * @param {number} currentEnergy - Current energy amount
 * @param {number} cost - Cost to deduct
 * @returns {number} New energy amount
 */
export function deductEnergy(currentEnergy, cost) {
    const newEnergy = Math.max(0, currentEnergy - cost);
    
    Logger.debug('Energy deducted', { from: currentEnergy, cost, to: newEnergy });
    
    return newEnergy;
}

/**
 * Check if player can afford a play
 * @param {Array} cards - Cards in the play
 * @param {number} availableEnergy - Available energy
 * @returns {boolean} Whether play is affordable
 */
export function canAffordPlay(cards, availableEnergy) {
    if (!cards || cards.length === 0) return true; // Pass is always affordable
    
    const totalCost = cards.reduce((sum, card) => sum + (card.energyCost || 0), 0);
    
    return totalCost <= availableEnergy;
}

/**
 * Calculate total cost of cards
 * @param {Array} cards - Cards to calculate cost for
 * @returns {number} Total energy cost
 */
export function calculateCost(cards) {
    if (!cards || cards.length === 0) return 0;
    
    return cards.reduce((sum, card) => sum + (card.energyCost || 0), 0);
}

/**
 * Validate energy state (prevent negative energy)
 * @param {Object} playerState - Player state object
 * @returns {Object} Validated/corrected player state
 */
export function validateEnergyState(playerState) {
    if (playerState.energy < 0) {
        Logger.warn('Negative energy detected, correcting', { 
            playerId: playerState.id, 
            energy: playerState.energy 
        });
        playerState.energy = 0;
    }
    
    return playerState;
}

/**
 * Calculate energy efficiency of a play
 * (offensive value per energy spent)
 * @param {Array} cards - Cards in play
 * @returns {number} Efficiency ratio
 */
export function calculateEnergyEfficiency(cards) {
    const cost = calculateCost(cards);
    if (cost === 0) return 0;
    
    const offensiveValue = cards.reduce((sum, card) => {
        return sum + (card.cardType === 'OFFENSE' ? (card.offense || 0) : 0);
    }, 0);
    
    return offensiveValue / cost;
}

/**
 * Get optimal plays within energy budget
 * @param {Array} hand - Available cards
 * @param {number} availableEnergy - Energy budget
 * @returns {Array} Array of possible play combinations
 */
export function getAffordablePlays(hand, availableEnergy) {
    const plays = [];
    
    // Single offense cards
    const offenseCards = hand.filter(c => c.cardType === 'OFFENSE');
    offenseCards.forEach(offense => {
        if (offense.energyCost <= availableEnergy) {
            plays.push({ cards: [offense], cost: offense.energyCost });
            
            // Try adding support
            const supportCards = hand.filter(c => c.cardType === 'SUPPORT');
            supportCards.forEach(support => {
                const totalCost = offense.energyCost + support.energyCost;
                if (totalCost <= availableEnergy) {
                    plays.push({ 
                        cards: [offense, support], 
                        cost: totalCost 
                    });
                }
            });
        }
    });
    
    // Single defense cards
    const defenseCards = hand.filter(c => c.cardType === 'DEFENSE');
    defenseCards.forEach(defense => {
        if (defense.energyCost <= availableEnergy) {
            plays.push({ cards: [defense], cost: defense.energyCost });
        }
    });
    
    // Pass is always an option
    plays.push({ cards: [], cost: 0, isPass: true });
    
    return plays;
}