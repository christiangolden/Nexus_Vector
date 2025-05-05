/**
 * Nexus Vector - Game Core
 * 
 * This module handles the main game loop, initialization, and orchestrates the game systems.
 * Note: This has been slimmed down to remove duplicated functionality that's now in GameState.
 */

const Game = (function() {
    'use strict';
    
    // Private variables
    let canvas;
    let ctx;
    
    // Initialize the game
    function init() {
        canvas = document.getElementById("gameCanvas");
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;
        ctx = canvas.getContext("2d");
        
        // Initialize systems in the correct order
        initSystems();
        
        // Subscribe to events
        setupEventHandlers();
        
        // Start the game loop via GameState
        GameState.init();
    }
    
    /**
     * Initialize all game systems in the correct order
     */
    function initSystems() {
        // Initialize utility services first
        ColorUtils.initColorCache();
        StarSystem.initStarSizeCache();
        
        // Initialize input handling
        InputSystem.init();
        
        // Initialize entity systems
        ShipSystem.init();
        BulletSystem.init();
        DustSystem.init();
        PowerUpSystem.init();
        RoomSystem.init();
    }
    
    /**
     * Set up event subscriptions to handle game events
     */
    function setupEventHandlers() {
        // Subscribe to level up events to increase difficulty
        GameEvents.subscribe('player:levelUp', (data) => {
            ShipSystem.increaseEnemySpeed(0.5);
            ShipSystem.decreaseEnemySpawnCooldown(10);
            GameState.showNotification(`Level Up! Now level ${data.level}`);
        });
        
        // Handle pause toggle events
        GameEvents.subscribe('game:togglePause', () => {
            if (GameState.getCurrentState() === GameState.STATE.PLAYING) {
                GameState.setState('PAUSED');
            } else if (GameState.getCurrentState() === GameState.STATE.PAUSED) {
                GameState.setState('PLAYING');
            }
        });
    }
    
    // Public API - much slimmer now that functionality has been moved to GameState
    return {
        init: init,
        getCanvas: function() { return GameState.getCanvas(); },
        getContext: function() { return GameState.getContext(); },
        moveParallaxX: function(dx) { GameState.moveParallaxX(dx); },
        showNotification: function(message) { GameState.showNotification(message); }
    };
})();