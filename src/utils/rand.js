/**
 * Seeded Random Number Generator
 * Deterministic PRNG for reproducible gameplay
 */

export class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }
    
    /**
     * Get next random number (0-1)
     */
    next() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
    
    /**
     * Get random integer between min and max (inclusive)
     */
    nextInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
    
    /**
     * Get random float between min and max
     */
    nextFloat(min, max) {
        return this.next() * (max - min) + min;
    }
    
    /**
     * Shuffle array
     */
    shuffle(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = this.nextInt(0, i);
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
    
    /**
     * Pick random element from array
     */
    choice(array) {
        return array[this.nextInt(0, array.length - 1)];
    }
}