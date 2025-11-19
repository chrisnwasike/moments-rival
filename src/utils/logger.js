/**
 * Logger Utility
 * Configurable logging with levels
 */

const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

export class Logger {
    static getLevel() {
        return window.MomentRivalsConfig?.LOG_LEVEL || 'info';
    }
    
    static shouldLog(level) {
        const currentLevel = LOG_LEVELS[this.getLevel()] || 2;
        const messageLevel = LOG_LEVELS[level] || 2;
        return messageLevel <= currentLevel;
    }
    
    static error(message, data = {}) {
        if (this.shouldLog('error')) {
            console.error(`[ERROR] ${message}`, data);
        }
    }
    
    static warn(message, data = {}) {
        if (this.shouldLog('warn')) {
            console.warn(`[WARN] ${message}`, data);
        }
    }
    
    static info(message, data = {}) {
        if (this.shouldLog('info')) {
            console.info(`[INFO] ${message}`, data);
        }
    }
    
    static debug(message, data = {}) {
        if (this.shouldLog('debug')) {
            console.log(`[DEBUG] ${message}`, data);
        }
    }
}