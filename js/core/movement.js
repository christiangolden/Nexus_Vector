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
        RoomSystem.moveRoomsX(dx);
        RoomSystem.moveRatsX(dx);
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
        
        // Move rats randomly within their rooms
        // Scale movement by timeStep for consistent movement speed
        const timeScale = timeStep * 60; // Scale to 60fps baseline
        for (let i = 0; i < RoomSystem.ratList.length; i++) {
            const randX = (Math.random() * 2 - 1) * timeScale;
            const randY = (Math.random() * 2 - 1) * timeScale;
            
            if (RoomSystem.inRoom(RoomSystem.ratList[i].x + randX, RoomSystem.ratList[i].y)) {
                RoomSystem.ratList[i].x += randX;
            }
            if (RoomSystem.inRoom(RoomSystem.ratList[i].x, RoomSystem.ratList[i].y + randY)) {
                RoomSystem.ratList[i].y += randY;
            }
        }
    }
    
    // Public API
    return {
        moveAll: moveAll,
        moveAllX: moveAllX
    };
})();