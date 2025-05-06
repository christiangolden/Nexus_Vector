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
    let dockingPhase = 'in'; // 'in' for swipe-in, 'out' for swipe-out
    
    // Cooldown after undocking to prevent immediate re-dock
    let undockCooldown = 0;
    
    // Callback for when docking is complete
    let onDockingCompleteCallback = null;
    
    // Last docking position (for undocking)
    let lastDockX = 0;
    let lastDockY = 0;
    let lastDockTipY = 0; // Store the player's Y coordinate before docking
    
    /**
     * Start docking process at specified coordinates
     * @param {number} x - X position to dock at
     * @param {number} y - Y position to dock at
     */
    function dock(x, y) {
        docking = true;
        dockingTransition = 0;
        dockingPhase = 'in';
        lastDockX = x;
        lastDockY = y;
        lastDockTipY = ShipSystem.hero.tipY; // Save the current Y position
        
        // Start docking animation
        animateDocking();
    }
    
    /**
     * Animate the docking process with a smooth transition
     */
    function animateDocking() {
        if (!docking) return;

        const ctx = GameState.getContext();
        const canvas = GameState.getCanvas();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (dockingPhase === 'in') {
            dockingTransition += 5;

            // Overlay and UI (drawn first)
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1.0;
            ctx.restore();

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

            // --- Swipe-in effect (drawn last, on top) ---
            const swipeWidth = canvas.width * (dockingTransition / 100);
            ctx.save();
            ctx.fillStyle = "#000";
            ctx.globalAlpha = 1.0;
            ctx.fillRect(0, 0, swipeWidth, canvas.height);
            ctx.restore();
            // --- End swipe-in effect ---

            if (dockingTransition >= 100) {
                dockingPhase = 'out';
                dockingTransition = 100;
                ShipSystem.hero.visible = false;
                GameState.setState('DOCKED');
                docking = false; // Allow normal DOCKED state logic and movement
            } else {
                requestAnimationFrame(animateDocking);
                return;
            }
        }

        if (dockingPhase === 'out') {
            // Draw the station interior behind the swipe
            if (typeof StationSystem !== 'undefined' && StationSystem.drawStationInterior) {
                StationSystem.drawStationInterior(ctx);
            }

            // --- Swipe-out effect (drawn last, on top) ---
            dockingTransition -= 5;
            const swipeWidth = canvas.width * (dockingTransition / 100);
            ctx.save();
            ctx.fillStyle = "#000";
            ctx.globalAlpha = 1.0;
            ctx.fillRect(0, 0, swipeWidth, canvas.height);
            ctx.restore();
            // --- End swipe-out effect ---

            if (dockingTransition <= 0) {
                GameState.showNotification("Docking complete. Press ESC to exit station.");
                ShipSystem.hero.visible = false;
                GameState.setState('DOCKED');
                return;
            } else {
                requestAnimationFrame(animateDocking);
                return;
            }
        }
    }
    
    /**
     * End docking and return to normal gameplay
     */
    function undock() {
        // Start undocking swipe animation
        docking = true;
        dockingTransition = 0;
        dockingPhase = 'undock-swipe';
        animateUndocking();
    }
    
    /**
     * Animate the undocking process
     */
    function animateUndocking() {
        if (!docking) return;
        const ctx = GameState.getContext();
        const canvas = GameState.getCanvas();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the station interior as background
        if (typeof StationSystem !== 'undefined' && StationSystem.drawStationInterior) {
            StationSystem.drawStationInterior(ctx);
        }

        // Swipe-out effect: black rectangle slides in from left to right
        dockingTransition += 5;
        const swipeWidth = canvas.width * (dockingTransition / 100);
        ctx.save();
        ctx.fillStyle = "#000";
        ctx.globalAlpha = 1.0;
        ctx.fillRect(0, 0, swipeWidth, canvas.height);
        ctx.restore();

        if (dockingTransition >= 100) {
            // Undocking complete
            docking = false;
            GameState.showNotification("Undocking complete.");
            ShipSystem.hero.visible = true;
            // Place ship at last docked X position and restore previous Y position
            ShipSystem.hero.tipX = lastDockX;
            ShipSystem.hero.tipY = lastDockTipY; // Restore the Y position
            ShipSystem.hero.leftX = ShipSystem.hero.tipX - ShipSystem.hero.width/2;
            ShipSystem.hero.rightX = ShipSystem.hero.tipX + ShipSystem.hero.width/2;
            ShipSystem.hero.leftY = ShipSystem.hero.tipY + ShipSystem.hero.height;
            ShipSystem.hero.rightY = ShipSystem.hero.tipY + ShipSystem.hero.height;
            undockCooldown = 60;
            GameState.setState('PLAYING');
            return;
        } else {
            requestAnimationFrame(animateUndocking);
        }
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
        // Allow ESC to trigger undocking if in DOCKED state (not just during docking animation)
        if (!(GameState.getCurrentState && GameState.getCurrentState() === GameState.STATE.DOCKED)) return;

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
        // Allow movement if in DOCKED state (not just during docking animation)
        if (!(GameState.getCurrentState && GameState.getCurrentState() === GameState.STATE.DOCKED)) return;
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