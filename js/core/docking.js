/**
 * Nexus Vector - Docking System
 * 
 * This module handles the docking state when the ship docks with a space station,
 * allowing the player to explore the ASCII roguelike station interior.
 */

const DockingSystem = (function() {
    'use strict';
    
    // Docking status
    let docking = false;
    let dockingTransition = 0; // For transition animation
    
    // Cooldown after undocking to prevent immediate re-dock
    let undockCooldown = 0;
    
    // Callback for when docking is complete
    let onDockingCompleteCallback = null;
    
    // Last docking position (for undocking)
    let lastDockX = 0;
    let lastDockY = 0;
    
    /**
     * Start docking process at specified coordinates
     * @param {number} x - X position to dock at
     * @param {number} y - Y position to dock at
     */
    function dock(x, y) {
        docking = true;
        dockingTransition = 0;
        lastDockX = x;
        lastDockY = y;
        
        // Start docking animation
        animateDocking();
    }
    
    /**
     * Animate the docking process with a smooth transition
     */
    function animateDocking() {
        if (!docking) return;
        
        // Animate transition from 0 to 100
        dockingTransition += 5;
        
        if (dockingTransition >= 100) {
            // Docking complete
            GameState.showNotification("Docking complete. Press ESC to exit station.");
            
            // Hide ship during docking
            ShipSystem.hero.visible = false;
            
            // Switch game state to DOCKED
            GameState.setState('DOCKED');
            return;
        }
        
        // Simple loading animation during transition
        const ctx = GameState.getContext();
        const canvas = GameState.getCanvas();
        
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "24px Consolas";
        ctx.textAlign = "center";
        ctx.fillText("DOCKING SEQUENCE IN PROGRESS", canvas.width / 2, canvas.height / 2 - 40);
        
        // Progress bar
        ctx.fillStyle = "#333333";
        ctx.fillRect(canvas.width / 2 - 100, canvas.height / 2, 200, 20);
        
        ctx.fillStyle = "#33AAFF";
        ctx.fillRect(canvas.width / 2 - 100, canvas.height / 2, 200 * (dockingTransition / 100), 20);
        
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(`${Math.floor(dockingTransition)}%`, canvas.width / 2, canvas.height / 2 + 40);
        
        // Continue animation
        requestAnimationFrame(animateDocking);
    }
    
    /**
     * End docking and return to normal gameplay
     */
    function undock() {
        // Start undocking animation
        docking = false;
        animateUndocking();
    }
    
    /**
     * Animate the undocking process
     */
    function animateUndocking() {
        if (docking) return;
        
        // Animate transition from 100 to 0
        dockingTransition -= 5;
        
        if (dockingTransition <= 0) {
            // Undocking complete
            GameState.showNotification("Undocking complete.");
            
            // Show ship again
            ShipSystem.hero.visible = true;
            
            // Place ship at last docked X position and default starting Y position
            const canvas = GameState.getCanvas();
            ShipSystem.hero.tipX = lastDockX;
            ShipSystem.hero.tipY = ShipSystem.getDefaultShipY(canvas);
            ShipSystem.hero.leftX = ShipSystem.hero.tipX - ShipSystem.hero.width/2;
            ShipSystem.hero.rightX = ShipSystem.hero.tipX + ShipSystem.hero.width/2;
            ShipSystem.hero.leftY = ShipSystem.hero.tipY + ShipSystem.hero.height;
            ShipSystem.hero.rightY = ShipSystem.hero.tipY + ShipSystem.hero.height;
            
            // Set undock cooldown (e.g., 60 frames = 1 second at 60fps)
            undockCooldown = 60;
            
            // Switch game state back to PLAYING
            GameState.setState('PLAYING');
            return;
        }
        
        // Simple animation during transition
        const ctx = GameState.getContext();
        const canvas = GameState.getCanvas();
        
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "24px Consolas";
        ctx.textAlign = "center";
        ctx.fillText("UNDOCKING SEQUENCE IN PROGRESS", canvas.width / 2, canvas.height / 2 - 40);
        
        // Progress bar (reversed)
        ctx.fillStyle = "#333333";
        ctx.fillRect(canvas.width / 2 - 100, canvas.height / 2, 200, 20);
        
        ctx.fillStyle = "#33AAFF";
        ctx.fillRect(canvas.width / 2 - 100, canvas.height / 2, 200 * (dockingTransition / 100), 20);
        
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(`${Math.floor(dockingTransition)}%`, canvas.width / 2, canvas.height / 2 + 40);
        
        // Continue animation
        requestAnimationFrame(animateUndocking);
    }
    
    /**
     * Set callback for when docking is complete
     * @param {Function} callback - Function to call when docking completes
     */
    function setOnDockingComplete(callback) {
        onDockingCompleteCallback = callback;
    }
    
    /**
     * Check if ESC key is pressed to exit the station
     */
    function checkExitStation() {
        if (!docking) return;
        
        if (InputSystem.wasPressed('esc')) {
            // Check if player is at docking point in ASCII map
            if (StationSystem.checkExit()) {
                StationSystem.exitStation();
                undock();
            } else {
                GameState.showNotification("Return to the docking bay (D) to exit the station.");
            }
        }
    }
    
    /**
     * Handle movement of player character in ASCII mode
     */
    function handlePlayerMovement() {
        if (!docking) return;
        // Removed debug notification
        // Handle arrow key movement
        if (InputSystem.wasPressed('left')) {
            StationSystem.movePlayer(-1, 0);
        }
        if (InputSystem.wasPressed('right')) {
            StationSystem.movePlayer(1, 0);
        }
        if (InputSystem.wasPressed('up')) {
            StationSystem.movePlayer(0, -1);
        }
        if (InputSystem.wasPressed('down')) {
            StationSystem.movePlayer(0, 1);
        }
    }
    
    // Patch: decrement undockCooldown each frame
    function updateUndockCooldown() {
        if (undockCooldown > 0) undockCooldown--;
    }
    
    // Patch: prevent docking if undockCooldown is active
    function canDock() {
        return undockCooldown === 0;
    }
    
    // Public API
    return {
        isDocking: function() { return docking; },
        dock: dock,
        undock: undock,
        setOnDockingComplete: setOnDockingComplete,
        checkExitStation: checkExitStation,
        handlePlayerMovement: handlePlayerMovement,
        updateUndockCooldown: updateUndockCooldown,
        canDock: canDock
    };
})();