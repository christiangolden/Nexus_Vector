/**
 * Nexus Vector - Main Entry Point
 * 
 * This is the main entry point for the Nexus Vector game.
 * It initializes all the game components and starts the game loop.
 */

// Wait for the DOM to be fully loaded before starting the game
document.addEventListener('DOMContentLoaded', function() {
    'use strict';
    
    // Initialize the game
    GameState.init();
    
    // Patch: Particle system update/draw in main loop
    (function() {
        const oldGameLoop = GameState.gameLoop;
        GameState.gameLoop = function() {
            oldGameLoop.apply(this, arguments);
            // Draw and update particles after everything else
            if (typeof ParticleSystem !== 'undefined') {
                ParticleSystem.update();
                const ctx = GameState.getContext();
                ParticleSystem.draw(ctx);
            }
        };
    })();
});