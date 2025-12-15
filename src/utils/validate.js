/**
 * Validation Utilities
 * Convert moments to cards and validate data
 */

import { Logger } from './logger.js';

/**
 * Convert NBA Top Shot moment to game card
 * @param {Object} moment - Moment data from blockchain
 * @returns {Object} Card object
 */
export function momentToCard(moment) {
    // Determine card type based on play category
    const cardType = determineCardType(moment.playCategory);
    
    // Calculate stats
    const stats = calculateStats(moment);
    let power;
    if (cardType === 'OFFENSE') {
        power = stats.offense
    } else if (cardType === 'DEFENSE') {
        power = stats.defense
    } else {
        power = stats.agility
    }

    return {
        id: `moment_${moment.momentId}`,
        momentId: moment.momentId,
        playerName: moment.playerName,
        team: moment.team,
        power: power,
        cardType: cardType,
        energyCost: stats.cost,
        offense: stats.offense,
        defense: stats.defense,
        speed: stats.speed,
        agility: stats.agility,
        boostValue: stats.agility,
        corruption: stats.corruption || 0,
        resistance: stats.resistance || 0,
        serialNumber: moment.serialNumber,
        tier: moment.tier,
        setName: moment.setName,
        mediaID: moment.momentId,
        playType: moment.playType
    };
}

/**
 * Determine card type from play category
 */
function determineCardType(playCategory) {
    const category = (playCategory || '').toLowerCase();
    
    // Offensive plays
    if (category.includes('dunk') || 
        category.includes('shot') ||
        category.includes('score') ||
        category.includes('three') ||
        category.includes('3pt')) {
        return 'OFFENSE';
    }
    
    // Defensive plays
    if (category.includes('block') || 
        category.includes('steal') || 
        category.includes('rebound') ||
        category.includes('def')) {
        return 'DEFENSE';
    }
    
    // Support plays
    if (category.includes('assist') || 
        category.includes('layup') || 
        category.includes('pass')) {
        return 'SUPPORT';
    }
    
    // Default to offense
    return 'OFFENSE';
}

/**
 * Calculate card stats from moment metadata
 */
function calculateStats(moment) {
    const tier = moment.tier || 'Common';
    const serialNumber = moment.serialNumber || 999;
    const playCategory = (moment.playCategory || '').toLowerCase();
    
    // Base stats by tier
    const tierBase = {
        'Legendary': { offense: 8, defense: 7, speed: 7, agility: 7, cost: 3 },
        'Rare': { offense: 6, defense: 5, speed: 6, agility: 6, cost: 2 },
        'Fandom': { offense: 5, defense: 4, speed: 5, agility: 5, cost: 2 },
        'Common': { offense: 4, defense: 3, speed: 4, agility: 4, cost: 1 }
    };
    
    let stats = tierBase[tier] || tierBase['Common'];
    stats = { ...stats }; // Clone
    
    // Serial number bonus (lower serial = better)
    if (serialNumber <= 50) {
        stats.offense += 2;
        stats.defense += 2;
    } else if (serialNumber <= 100) {
        stats.offense += 1;
        stats.defense += 1;
    } else if (serialNumber <= 500) {
        stats.offense += 1;
    }
    
    // Play category adjustments
    if (playCategory.includes('dunk')) {
        stats.offense += 1;
    } else if (playCategory.includes('block')) {
        stats.defense += 1;
    } else if (playCategory.includes('assist')) {
        stats.agility += 1;
    } else if (playCategory.includes('three') || playCategory.includes('3pt')) {
        stats.speed += 1;
    }
    
    // Cap stats
    stats.offense = Math.min(10, Math.max(1, stats.offense));
    stats.defense = Math.min(10, Math.max(1, stats.defense));
    stats.speed = Math.min(10, Math.max(1, stats.speed));
    stats.agility = Math.min(10, Math.max(1, stats.agility));
    stats.cost = Math.min(3, Math.max(1, stats.cost));
    
    return stats;
}

/**
 * Validate Flow address format
 */
export function isValidFlowAddress(address) {
    return /^0x[a-fA-F0-9]{16}$/.test(address);
}

/**
 * Validate deck composition
 */
export function validateDeck(deck) {
    const errors = [];
    
    if (!Array.isArray(deck)) {
        errors.push('Deck must be an array');
        return { valid: false, errors };
    }
    
    if (deck.length !== 7) {
        errors.push(`Deck must contain exactly 7 cards (currently ${deck.length})`);
    }
    
    const offenseCount = deck.filter(c => c.cardType === 'OFFENSE').length;
    const defenseCount = deck.filter(c => c.cardType === 'DEFENSE').length;
    
    if (offenseCount < 2) {
        errors.push('Deck must contain at least 2 offense cards');
    }
    
    if (defenseCount < 2) {
        errors.push('Deck must contain at least 2 defense cards');
    }
    
    // Check for duplicates
    const ids = deck.map(c => c.momentId).filter(id => id !== null);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
        errors.push('Deck contains duplicate cards');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}