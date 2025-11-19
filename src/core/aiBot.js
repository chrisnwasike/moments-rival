/**
 * AI Bot
 * Deterministic rule-based opponent with seeded randomness
 */

import { SeededRandom } from '../utils/rand.js';
import { getAffordablePlays, calculateEnergyEfficiency } from './energy.js';
import { Logger } from '../utils/logger.js';

/**
 * AI Bot class with configurable difficulty
 */
export class AIBot {
    constructor(seed = 42, difficulty = 'medium') {
        this.rng = new SeededRandom(seed);
        this.difficulty = difficulty;
        this.memory = {
            playerLastPlay: null,
            playerTendencies: {
                aggression: 0, // -1 to 1 (defensive to aggressive)
                passFrequency: 0 // 0 to 1
            }
        };
    }
    
    /**
     * Choose a play based on game state
     * @param {Object} gameState - Current game state
     * @returns {Object} Selected play { cards, isPass }
     */
    choosePlay(gameState) {
        const bot = gameState.opponent;
        const player = gameState.player;
        
        // Update memory
        this.updateMemory(player);
        
        // Get all affordable plays
        const affordablePlays = getAffordablePlays(bot.hand, bot.energy);
        
        if (affordablePlays.length === 0) {
            Logger.info('AI Bot: No affordable plays, must pass');
            return { cards: [], isPass: true };
        }
        
        // Choose play based on difficulty and situation
        let selectedPlay;
        
        switch (this.difficulty) {
            case 'easy':
                selectedPlay = this.chooseEasyPlay(affordablePlays, gameState);
                break;
                
            case 'hard':
                selectedPlay = this.chooseHardPlay(affordablePlays, gameState);
                break;
                
            case 'medium':
            default:
                selectedPlay = this.chooseMediumPlay(affordablePlays, gameState);
                break;
        }
        
        Logger.info('AI Bot chose play', { 
            difficulty: this.difficulty,
            cards: selectedPlay.cards.map(c => c.playerName),
            cost: selectedPlay.cost,
            isPass: selectedPlay.isPass 
        });
        
        return selectedPlay;
    }
    
    /**
     * Easy difficulty: Random affordable plays with slight preference for offense
     */
    chooseEasyPlay(affordablePlays, gameState) {
        // 20% chance to pass if possible
        if (this.rng.next() < 0.2) {
            return affordablePlays.find(p => p.isPass) || affordablePlays[0];
        }
        
        // Prefer offense cards
        const offensePlays = affordablePlays.filter(p => 
            p.cards.some(c => c.cardType === 'OFFENSE')
        );
        
        if (offensePlays.length > 0) {
            return offensePlays[Math.floor(this.rng.next() * offensePlays.length)];
        }
        
        // Random fallback
        return affordablePlays[Math.floor(this.rng.next() * affordablePlays.length)];
    }
    
    /**
     * Medium difficulty: Consider energy efficiency and react to player
     */
    chooseMediumPlay(affordablePlays, gameState) {
        const bot = gameState.opponent;
        const player = gameState.player;
        
        // If low on energy early game, consider passing
        if (bot.energy <= 2 && gameState.currentTurn <= 2) {
            if (this.rng.next() < 0.3) {
                return affordablePlays.find(p => p.isPass);
            }
        }
        
        // React to player's last play
        if (this.memory.playerLastPlay?.type === 'OFFENSE') {
            // Try to defend if player was aggressive
            const defensePlays = affordablePlays.filter(p => 
                p.cards.some(c => c.cardType === 'DEFENSE')
            );
            
            if (defensePlays.length > 0 && this.rng.next() < 0.6) {
                // Pick best defense
                return defensePlays.reduce((best, curr) => {
                    const bestDef = this.getDefenseValue(best.cards);
                    const currDef = this.getDefenseValue(curr.cards);
                    return currDef > bestDef ? curr : best;
                });
            }
        }
        
        // Score plays by efficiency
        const scoredPlays = affordablePlays
            .filter(p => !p.isPass)
            .map(play => ({
                ...play,
                score: this.scorePlay(play, gameState)
            }))
            .sort((a, b) => b.score - a.score);
        
        if (scoredPlays.length > 0) {
            // Pick from top 3 with weighted randomness
            const topPlays = scoredPlays.slice(0, Math.min(3, scoredPlays.length));
            const weights = topPlays.map((p, i) => Math.pow(2, topPlays.length - i));
            const totalWeight = weights.reduce((sum, w) => sum + w, 0);
            
            let rand = this.rng.next() * totalWeight;
            for (let i = 0; i < topPlays.length; i++) {
                rand -= weights[i];
                if (rand <= 0) {
                    return topPlays[i];
                }
            }
            
            return topPlays[0];
        }
        
        // Fallback to pass
        return affordablePlays.find(p => p.isPass);
    }
    
    /**
     * Hard difficulty: Optimal play with strategic depth
     */
    chooseHardPlay(affordablePlays, gameState) {
        const bot = gameState.opponent;
        const player = gameState.player;
        
        // Strategic passing: save energy for critical turns
        const turnsRemaining = gameState.config.TURNS_PER_ROUND - gameState.currentTurn + 1;
        
        if (turnsRemaining === 1 && bot.energy < 4) {
            // Last turn, go all-in if possible
            const allInPlays = affordablePlays
                .filter(p => !p.isPass)
                .sort((a, b) => b.cost - a.cost);
            
            if (allInPlays.length > 0) {
                return allInPlays[0];
            }
        } else if (turnsRemaining > 1 && bot.energy < 3) {
            // Early/mid turn with low energy - pass to save up
            if (this.rng.next() < 0.7) {
                return affordablePlays.find(p => p.isPass);
            }
        }
        
        // Perfect counter to player's last play
        if (this.memory.playerLastPlay) {
            const counterPlay = this.findCounterPlay(affordablePlays, this.memory.playerLastPlay);
            if (counterPlay && this.rng.next() < 0.8) {
                return counterPlay;
            }
        }
        
        // Calculate expected value for each play
        const scoredPlays = affordablePlays
            .filter(p => !p.isPass)
            .map(play => ({
                ...play,
                score: this.scorePlayAdvanced(play, gameState)
            }))
            .sort((a, b) => b.score - a.score);
        
        if (scoredPlays.length > 0) {
            // Slight randomness even on hard (pick from top 2)
            if (scoredPlays.length > 1 && this.rng.next() < 0.2) {
                return scoredPlays[1];
            }
            return scoredPlays[0];
        }
        
        return affordablePlays.find(p => p.isPass);
    }
    
    /**
     * Score a play (medium difficulty)
     */
    scorePlay(play, gameState) {
        if (play.isPass) return 0;
        
        let score = 0;
        
        // Base score from offensive value
        const offenseValue = play.cards
            .filter(c => c.cardType === 'OFFENSE')
            .reduce((sum, c) => sum + (c.offense || 0), 0);
        score += offenseValue * 2;
        
        // Defense value
        const defenseValue = this.getDefenseValue(play.cards);
        score += defenseValue * 1.5;
        
        // Energy efficiency bonus
        const efficiency = calculateEnergyEfficiency(play.cards);
        score += efficiency * 10;
        
        // Slight random variance
        score *= (0.9 + this.rng.next() * 0.2);
        
        return score;
    }
    
    /**
     * Score a play (hard difficulty - more sophisticated)
     */
    scorePlayAdvanced(play, gameState) {
        if (play.isPass) return 0;
        
        let score = this.scorePlay(play, gameState);
        
        const bot = gameState.opponent;
        const player = gameState.player;
        
        // Score advantage consideration
        const scoreDiff = bot.totalScore - player.totalScore;
        if (scoreDiff < 0) {
            // Behind - favor aggressive plays
            const offenseValue = play.cards
                .filter(c => c.cardType === 'OFFENSE')
                .reduce((sum, c) => sum + (c.offense || 0), 0);
            score += offenseValue * 0.5;
        } else if (scoreDiff > 5) {
            // Ahead - favor defensive/efficient plays
            const defenseValue = this.getDefenseValue(play.cards);
            score += defenseValue * 0.5;
        }
        
        // Remaining cards consideration
        const cardsLeft = bot.hand.length;
        if (cardsLeft <= 3) {
            // Low on cards - value each play more
            score *= 1.2;
        }
        
        return score;
    }
    
    /**
     * Find counter play to player's last play
     */
    findCounterPlay(affordablePlays, playerLastPlay) {
        if (playerLastPlay.type === 'OFFENSE') {
            // Counter with defense
            const playerOffense = playerLastPlay.offenseCard?.offense || 0;
            
            const goodDefenses = affordablePlays.filter(p => {
                const defCard = p.cards.find(c => c.cardType === 'DEFENSE');
                return defCard && defCard.defense >= playerOffense;
            });
            
            if (goodDefenses.length > 0) {
                return goodDefenses[0];
            }
        }
        
        return null;
    }
    
    /**
     * Get total defense value of cards
     */
    getDefenseValue(cards) {
        return cards.reduce((sum, card) => {
            if (card.cardType === 'DEFENSE') {
                return sum + (card.defense || 0);
            } else if (card.cardType === 'OFFENSE') {
                return sum + (card.defense || 0) * 0.3;
            }
            return sum;
        }, 0);
    }
    
    /**
     * Update memory based on player actions
     */
    updateMemory(player) {
        // Track player's last play
        if (player.lockedPlay) {
            this.memory.playerLastPlay = player.lockedPlay;
            
            // Update tendencies
            if (player.lockedPlay.type === 'OFFENSE') {
                this.memory.playerTendencies.aggression += 0.1;
            } else if (player.lockedPlay.type === 'DEFENSE') {
                this.memory.playerTendencies.aggression -= 0.1;
            } else if (player.lockedPlay.type === 'PASS') {
                this.memory.playerTendencies.passFrequency += 0.1;
            }
            
            // Clamp values
            this.memory.playerTendencies.aggression = Math.max(-1, Math.min(1, 
                this.memory.playerTendencies.aggression
            ));
            this.memory.playerTendencies.passFrequency = Math.max(0, Math.min(1, 
                this.memory.playerTendencies.passFrequency
            ));
        }
    }
}