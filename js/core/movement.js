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
        ShipSystem.moveEnemiesX(dx); // Move enemy ships with scenery
        
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
        // Warp speed logic with star energy and smooth ramp
        const starEnergy = GameState.getStarEnergy();
        const canWarp = starEnergy >= 100 * timeStep;
        let warpActive = GameState.getWarpActive();
        let warpLevel = GameState.getWarpLevel();
        const rampUp = 0.12; // How fast to ramp up
        // Only allow warp if up is pressed, not docking, and enough star energy
        if (InputSystem.isUpPressed() && !DockingSystem.isDocking() && canWarp) {
            if (!warpActive) {
                GameState.setWarpActive(true);
                GameState.setSpeed(14); // Double the normal speed (default is 7)
            }
            // Drain star energy for warping (100 per second)
            GameState.setStarEnergy(starEnergy - 100 * timeStep);
            // Ramp up warp level
            warpLevel = Math.min(1, warpLevel + rampUp);
            GameState.setWarpLevel(warpLevel);
            // If star energy runs out, disable warp immediately
            if (GameState.getStarEnergy() < 10 * timeStep) {
                GameState.setWarpActive(false);
                GameState.setWarpLevel(0);
                GameState.setSpeed(7);
                return; // Stop further warp logic this frame
            }
        } else {
            // Immediately disable warp and reset warp level if up is not pressed or warp not allowed
            if (InputSystem.isUpPressed() && !DockingSystem.isDocking() && starEnergy < 100 * timeStep) {
                GameState.triggerStarEnergyWarning();
            }
            GameState.setWarpActive(false);
            GameState.setWarpLevel(0);
            GameState.setSpeed(7);
        }

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