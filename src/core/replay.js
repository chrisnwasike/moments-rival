/**
 * Replay System
 * Serialize/deserialize match replays for review
 */

import { Logger } from '../utils/logger.js';

/**
 * Create replay data from game state
 * @param {Object} gameState - Final game state
 * @returns {Object} Replay object
 */
export function createReplay(gameState) {
    const replay = {
        version: '1.0',
        matchId: gameState.matchId,
        startTime: gameState.startTime,
        endTime: Date.now(),
        duration: Date.now() - gameState.startTime,
        
        config: gameState.config,
        
        players: {
            player: {
                id: gameState.player.id,
                deck: gameState.player.deck.map(simplifyCard),
                finalScore: gameState.player.totalScore,
                roundsWon: gameState.player.roundsWon,
            },
            opponent: {
                id: gameState.opponent.id,
                deck: gameState.opponent.deck.map(simplifyCard),
                finalScore: gameState.opponent.totalScore,
                roundsWon: gameState.opponent.roundsWon,
            }
        },
        
        winner: gameState.winner,
        
        rounds: gameState.rounds.map(round => ({
            roundNumber: round.roundNumber,
            finalScore: round.finalScore,
            winner: round.winner,
            turns: round.turns.map(turn => ({
                turnNumber: turn.turnNumber,
                playerPlay: simplifyPlay(turn.playerPlay),
                opponentPlay: simplifyPlay(turn.opponentPlay),
                playerPoints: turn.playerPoints,
                opponentPoints: turn.opponentPoints,
            }))
        })),
        
        events: gameState.events,
        
        metadata: {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
        }
    };
    
    Logger.info('Replay created', { matchId: replay.matchId });
    
    return replay;
}

/**
 * Simplify card for replay (remove unnecessary data)
 */
function simplifyCard(card) {
    return {
        id: card.id,
        momentId: card.momentId,
        playerName: card.playerName,
        cardType: card.cardType,
        energyCost: card.energyCost,
        offense: card.offense,
        defense: card.defense,
        speed: card.speed,
        agility: card.agility,
    };
}

/**
 * Simplify play for replay
 */
function simplifyPlay(play) {
    if (!play) return null;
    
    if (play.type === 'PASS') {
        return { type: 'PASS' };
    }
    
    return {
        type: play.type,
        cards: play.cards ? play.cards.map(simplifyCard) : []
    };
}

/**
 * Export replay as JSON string
 */
export function exportReplay(gameState) {
    const replay = createReplay(gameState);
    return JSON.stringify(replay, null, 2);
}

/**
 * Import replay from JSON string
 */
export function importReplay(jsonString) {
    try {
        const replay = JSON.parse(jsonString);
        
        if (!replay.version || !replay.matchId) {
            throw new Error('Invalid replay format');
        }
        
        Logger.info('Replay imported', { matchId: replay.matchId });
        
        return replay;
    } catch (error) {
        Logger.error('Failed to import replay', { error: error.message });
        return null;
    }
}

/**
 * Validate replay data
 */
export function validateReplay(replay) {
    const errors = [];
    
    if (!replay.version) {
        errors.push('Missing version');
    }
    
    if (!replay.matchId) {
        errors.push('Missing matchId');
    }
    
    if (!replay.players || !replay.players.player || !replay.players.opponent) {
        errors.push('Invalid players data');
    }
    
    if (!replay.rounds || !Array.isArray(replay.rounds)) {
        errors.push('Invalid rounds data');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Get replay summary
 */
export function getReplaySummary(replay) {
    return {
        matchId: replay.matchId,
        duration: formatDuration(replay.duration),
        winner: replay.winner,
        finalScore: `${replay.players.player.finalScore} - ${replay.players.opponent.finalScore}`,
        roundsWon: `${replay.players.player.roundsWon} - ${replay.players.opponent.roundsWon}`,
        totalTurns: replay.rounds.reduce((sum, round) => sum + round.turns.length, 0),
        date: replay.metadata?.timestamp || 'Unknown',
    };
}

/**
 * Format duration in ms to readable string
 */
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
}

/**
 * Download replay as file
 */
export function downloadReplay(gameState, filename = null) {
    const replay = createReplay(gameState);
    const json = JSON.stringify(replay, null, 2);
    
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `moment-rivals-replay-${replay.matchId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    Logger.info('Replay downloaded', { filename: a.download });
}