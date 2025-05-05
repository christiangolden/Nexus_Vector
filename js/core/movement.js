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
        // Warp speed logic with energy and smooth ramp
        const warpEnergy = GameState.getWarpEnergy();
        const canWarp = warpEnergy > 0;
        const minWarpToReactivate = 20;
        let warpActive = GameState.getWarpActive();
        let warpLevel = GameState.getWarpLevel();
        const rampUp = 0.12; // How fast to ramp up
        const rampDown = 0.08; // How fast to ramp down
        // Only allow warp if up is pressed, not docking, and energy > 0
        if (InputSystem.isUpPressed() && !DockingSystem.isDocking() && canWarp) {
            if (!warpActive) {
                GameState.setWarpActive(true);
                GameState.setSpeed(14); // Double the normal speed (default is 7)
            }
            // Drain warp energy faster
            GameState.setWarpEnergy(warpEnergy - 2);
            // Ramp up warp level
            warpLevel = Math.min(1, warpLevel + rampUp);
            GameState.setWarpLevel(warpLevel);
            console.log('[MovementSystem] warpLevel set to:', warpLevel);
            // If energy runs out, disable warp immediately
            if (GameState.getWarpEnergy() <= 0) {
                GameState.setWarpActive(false);
                GameState.setWarpLevel(0);
                GameState.setSpeed(7);
                return; // Stop further warp logic this frame
            }
        } else {
            // If warp energy is depleted, force warp off
            if (GameState.getWarpEnergy() <= 0) {
                GameState.setWarpActive(false);
                GameState.setWarpLevel(0);
                GameState.setSpeed(7);
            }
            // Recharge warp energy if not at max
            if (warpEnergy < 100) {
                GameState.setWarpEnergy(warpEnergy + 0.5);
            }
            // Ramp down warp level
            warpLevel = Math.max(0, warpLevel - rampDown);
            GameState.setWarpLevel(warpLevel);
            console.log('[MovementSystem] warpLevel set to:', warpLevel);
            // If warp was active, only allow reactivation if energy > minWarpToReactivate
            if (warpActive && (!InputSystem.isUpPressed() || DockingSystem.isDocking() || !canWarp)) {
                GameState.setWarpActive(false);
                GameState.setSpeed(7);
            }
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