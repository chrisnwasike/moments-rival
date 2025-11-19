/**
 * HTTP Request Wrapper
 * Simplified fetch with error handling
 */

import { Logger } from './logger.js';

export const http = {
    /**
     * GET request
     */
    async get(url, options = {}) {
        return this.request(url, { ...options, method: 'GET' });
    },
    
    /**
     * POST request
     */
    async post(url, data, options = {}) {
        return this.request(url, {
            ...options,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            body: JSON.stringify(data)
        });
    },
    
    /**
     * Base request method
     */
    async request(url, options = {}) {
        const config = window.MomentRivalsConfig;
        const fullUrl = url.startsWith('http') ? url : `${config.API_BASE}${url}`;
        
        Logger.debug('HTTP Request', { url: fullUrl, method: options.method || 'GET' });
        
        try {
            const response = await fetch(fullUrl, options);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            Logger.debug('HTTP Response', { url: fullUrl, data });
            
            return data;
            
        } catch (error) {
            Logger.error('HTTP Error', { url: fullUrl, error: error.message });
            throw error;
        }
    }
};