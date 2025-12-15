/**
 * Moment Rivals - Main Application Bundle
 * Entry point that initializes the application
 */

import { Logger } from '../../src/utils/logger.js';
import { logout, isLoggedIn } from '../../src/utils/auth.js'
import { BootScreen } from '../../src/ui/screens/boot.js';
import { LoginScreen } from '../../src/ui/screens/login.js';
import { FetchScreen } from '../../src/ui/screens/fetch.js';
import { DeckScreen } from '../../src/ui/screens/deck.js';
import { LobbyScreen } from '../../src/ui/screens/lobby.js';
import { MatchScreen } from '../../src/ui/screens/match.js';
import { ResultsScreen } from '../../src/ui/screens/results.js';
import { SettingsScreen } from '../../src/ui/screens/settings.js';
import { DevToolsScreen } from '../../src/ui/screens/devtools.js';

/**
 * Main Application Class
 */
class MomentRivalsApp {
    constructor() {
        this.currentScreen = null;
        this.screenInstance = null;
        this.walletAddress = null;
        this.moments = [];
        this.playerDeck = [];
        this.matchConfig = null;
        this.matchResult = null;
        
        // Screen registry
        this.screens = {
            boot: BootScreen,
            login: LoginScreen,
            fetch: FetchScreen,
            deck: DeckScreen,
            lobby: LobbyScreen,
            match: MatchScreen,
            results: ResultsScreen,
            settings: SettingsScreen,
            devtools: DevToolsScreen
        };
    }
    
    /**
     * Initialize application
     */
    async init() {
        Logger.info('Initializing Moment Rivals', {
            version: window.MomentRivalsConfig.VERSION,
            environment: window.MomentRivalsConfig.ENVIRONMENT
        });
        
        // Configure FCL
        this.configureFCL();
        
        // Set up FCL subscription
        this.setupFCLSubscription();
        
        // Start with boot screen
        this.showScreen('boot');
    }
    
    /**
     * Configure Flow Client Library
     */
    configureFCL() {
        const config = window.MomentRivalsConfig.FCL_CONFIG;
        
        Object.keys(config).forEach(key => {
            window.fcl.config().put(key, config[key]);
        });
        
        Logger.info('FCL configured', { network: config['flow.network'] });
    }
    
    /**
     * Set up FCL user subscription
     */
    setupFCLSubscription() {
        window.fcl.currentUser.subscribe(async (user) => {
            if (user.loggedIn) {
                this.walletAddress = user.addr;

                const walletInfo = await getDapperUserInfo();
                this.walletType = walletInfo?.isDapper ? 'dapper' : 'other';
                
                Logger.info('User authenticated', { 
                    address: user.addr,
                    walletType: this.walletType 
                });

                Logger.info('User authenticated', { address: user.addr });
            } else if (this.walletAddress) {
                // User logged out
               Logger.info('User logged out - clearing state');
                
                this.walletAddress = null;
                this.walletType = null;
                this.moments = [];
                this.playerDeck = [];
                this.matchConfig = null;
                this.matchResult = null;
                
                // Only redirect to login if not already there
                if (this.currentScreen !== 'login') {
                    this.showScreen('login');
                }
            }
        });
    }
    
    /**
     * Show a screen
     * @param {string} screenName - Name of screen to show
     */
    showScreen(screenName) {
        Logger.info('Showing screen', { screen: screenName });
        
        // Destroy previous screen
        if (this.screenInstance && typeof this.screenInstance.destroy === 'function') {
            this.screenInstance.destroy();
        }
        
        // Get screen class
        const ScreenClass = this.screens[screenName];
        
        if (!ScreenClass) {
            Logger.error('Screen not found', { screen: screenName });
            return;
        }
        
        // Create and render new screen
        this.screenInstance = new ScreenClass(this);
        
        if (screenName === 'boot') {
            this.screenInstance.init();
        } else {
            this.screenInstance.render();
        }
        
        this.currentScreen = screenName;
    }


    /**
     * Global logout method
     */
    async logout() {
        try {
            await logout();
            
            // Clear app state
            this.walletAddress = null;
            this.walletType = null;
            this.moments = [];
            this.playerDeck = [];
            this.matchConfig = null;
            this.matchResult = null;
            
            // Navigate to login
            this.showScreen('login');
            
            return true;
        } catch (error) {
            Logger.error('App logout failed', { error: error.message });
            return false;
        }
    }
}

/**
 * Initialize application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    const app = new MomentRivalsApp();
    app.init();
    
    // Expose app instance globally for debugging
    if (window.MomentRivalsConfig.ENVIRONMENT === 'development') {
        window.app = app;
    }

    window.logout = () => app.logout();

});