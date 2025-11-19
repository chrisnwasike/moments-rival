/**
 * Client Configuration
 * Safe client-side settings only - no secrets here
 */

window.MomentRivalsConfig = {
    // Environment
    VERSION: '0.1.0',
    ENVIRONMENT: 'development', // 'development' | 'production'
    
    // Mock mode for testing without wallet
    USE_MOCK: false, // Set to true to use mock data instead of blockchain
    
    // Flow blockchain configuration
    FLOW_NETWORK: 'mainnet', // 'testnet' | 'mainnet'
    
    // FCL Configuration
    FCL_CONFIG: {
        'app.detail.title': 'Moment Rivals',
        'app.detail.icon': 'assets/img/logo.png',
        // Testnet configuration
        'accessNode.api': 'https://rest-mainnet.onflow.org',
        'discovery.wallet': 'https://fcl-discovery.onflow.org/authn',
        'flow.network': 'mainnet',
        // Uncomment below for mainnet
        // 'accessNode.api': 'https://rest-mainnet.onflow.org',
        // 'discovery.wallet': 'https://fcl-discovery.onflow.org/authn',
        // 'flow.network': 'mainnet',
    },

    // API endpoints
    API_BASE: '',
    
    // Game constants
    GAME: {
        ROUNDS: 4,
        TURNS_PER_ROUND: 3,
        START_ENERGY: 3,
        ENERGY_PER_TURN: 1,
        PASS_BONUS: 1,
        DECK_SIZE: 25,
        MAX_DUPLICATES: 1, // Max copies of same moment
    },
    
    // UI settings
    UI: {
        ANIMATION_DURATION: 300, // ms
        TOAST_DURATION: 3000, // ms
        REVEAL_DELAY: 1000, // ms before showing reveal
        AUTO_ADVANCE_DELAY: 2000, // ms before auto-advancing turn
    },
    
    // Sound effects
    SOUND: {
        ENABLED: true,
        VOLUME: 0.5, // 0-1
    },
    
    // Accessibility
    ACCESSIBILITY: {
        REDUCED_MOTION: false,
        HIGH_CONTRAST: false,
    },
    
    // Mock data for testing
    MOCK_MOMENTS: [
        {
            momentId: 1001,
            playerName: 'Alpha Player',
            team: 'Team A',
            setName: 'Base Set',
            tier: 'Common',
            playCategory: 'Dunk',
            serialNumber: 42,
            date: '2024-01-15',
            playType: 'Dunk',
        },
        {
            momentId: 1002,
            playerName: 'Beta Star',
            team: 'Team B',
            setName: 'Base Set',
            tier: 'Rare',
            playCategory: 'Three Pointer',
            serialNumber: 15,
            date: '2024-01-20',
            playType: '3PT',
        },
        {
            momentId: 1003,
            playerName: 'Gamma Guard',
            team: 'Team C',
            setName: 'Fandom',
            tier: 'Fandom',
            playCategory: 'Block',
            serialNumber: 88,
            date: '2024-02-01',
            playType: 'Block',
        },
        {
            momentId: 1004,
            playerName: 'Delta Forward',
            team: 'Team D',
            setName: 'Rare',
            tier: 'Rare',
            playCategory: 'Assist',
            serialNumber: 3,
            date: '2024-02-10',
            playType: 'Assist',
        },
        {
            momentId: 1005,
            playerName: 'Epsilon Center',
            team: 'Team E',
            setName: 'Legendary',
            tier: 'Legendary',
            playCategory: 'Dunk',
            serialNumber: 7,
            date: '2024-02-15',
            playType: 'Power Dunk',
        },
        {
            momentId: 1006,
            playerName: 'Zeta Shooter',
            team: 'Team F',
            setName: 'Base Set',
            tier: 'Common',
            playCategory: 'Layup',
            serialNumber: 250,
            date: '2024-03-01',
            playType: 'Layup',
        },
        {
            momentId: 1007,
            playerName: 'Eta Defender',
            team: 'Team G',
            setName: 'Fandom',
            tier: 'Fandom',
            playCategory: 'Steal',
            serialNumber: 100,
            date: '2024-03-10',
            playType: 'Steal',
        },
    ],
    
    // Logging
    LOG_LEVEL: 'debug', // 'error' | 'warn' | 'info' | 'debug'
};