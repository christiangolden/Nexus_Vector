/**
 * Nexus Vector - Movement System
 * 
 * This module coordinates all movement in the game.
 */

const MovementSystem = (function() {
    'use strict';
    
    /**
     * Move all game elements horizontally when the player uses shift key movement
     * @param {number} dx - The amount to move horizontally
     */
    function moveAllX(dx) {
        StarSystem.moveStarsX(dx);
        RoomSystem.moveStationsX(dx);
        BulletSystem.moveBulletsX(dx);
        DustSystem.moveDustX(dx);
        
        // Add parallax background to movement handling
        if (GameState && GameState.moveParallaxX) {
            GameState.moveParallaxX(dx);
        }
        
        // Add PowerUpSystem to movement handling
        if (PowerUpSystem) {
            PowerUpSystem.movePowerUpsX(dx);
        }
    }
    
    /**
     * Process all movement for the current frame
     * @param {number} timeStep - Fixed timestep in seconds
     */
    function moveAll(timeStep = 1/60) {
        // Handle ship movement based on input
        if ((InputSystem.isRightPressed() || InputSystem.isTiltRight()) && !DockingSystem.isDocking()) {
            ShipSystem.moveHeroRight();
        }
        
        if ((InputSystem.isLeftPressed() || InputSystem.isTiltLeft()) && !DockingSystem.isDocking()) {
            ShipSystem.moveHeroLeft();
        }
        
        // Update dust and magwave with the timeStep
        DustSystem.updateDust(timeStep);
        
        // Removed all rat and old room/corridor logic
    }
    
    // Public API
    return {
        moveAll: moveAll,
        moveAllX: moveAllX
    };
})();