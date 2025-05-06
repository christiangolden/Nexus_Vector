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
    let dockingPhase = null; // null when idle, 'in' for swipe-in, 'out' for swipe-out, 'undock-swipe' for undocking
    
    // Cooldown after undocking to prevent immediate re-dock
    let undockCooldown = 0;
    
    // Callback for when docking is complete
    let onDockingCompleteCallback = null;
    
    // Last docking position (for undocking)
    let lastDockX = 0;
    let lastDockY = 0;
    let lastDockTipY = 0; // Store the player's Y coordinate before docking
    
    // Easing function for smooth transitions
    function easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    /**
     * Start docking process at specified coordinates
     * @param {number} x - X position to dock at
     * @param {number} y - Y position to dock at
     */
    function dock(x, y) {
        docking = true;
        dockingTransition = 0;
        dockingPhase = 'zoom-in'; // Start with zoom-in phase
        lastDockX = x;
        lastDockY = y;
        lastDockTipY = ShipSystem.hero.tipY; // Save the current Y position
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

        // --- Organic Zoom-In and Fade-Out ---
        if (dockingPhase === 'zoom-in') {
            const ZOOM_DURATION = 60; // frames, slower for organic feel
            const MAX_ZOOM = 2.2;
            let t = dockingTransition / ZOOM_DURATION;
            if (t > 1) t = 1;
            const easedT = easeInOutQuad(t);
            const zoom = 1 + (MAX_ZOOM - 1) * easedT;
            const fadeAlpha = easedT; // Fade to black as we zoom

            if (typeof GameState.renderPlayingState === 'function') {
                ctx.save();
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.scale(zoom, zoom);
                ctx.translate(-lastDockX, -lastDockY);
                GameState.renderPlayingState(0);
                ctx.restore();
            } else {
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            // Fade to black overlay
            ctx.save();
            ctx.globalAlpha = fadeAlpha;
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();

            dockingTransition++;
            if (dockingTransition >= ZOOM_DURATION) {
                dockingTransition = 0;
                dockingPhase = 'fade-in-interior'; // Start fading in the station interior
            } else {
                requestAnimationFrame(animateDocking);
                return;
            }
        }

        // --- Fade In Station Interior ---
        if (dockingPhase === 'fade-in-interior') {
            const FADE_DURATION = 40; // frames
            let t = dockingTransition / FADE_DURATION;
            if (t > 1) t = 1;
            const fadeAlpha = 1 - easeInOutQuad(t); // Fade from black to visible

            // Draw station interior
            if (typeof StationSystem !== 'undefined' && StationSystem.drawStationInterior) {
                StationSystem.drawStationInterior(ctx);
            } else {
                ctx.fillStyle = '#222';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            // Fade from black overlay
            ctx.save();
            ctx.globalAlpha = fadeAlpha;
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();

            dockingTransition++;
            if (dockingTransition >= FADE_DURATION) {
                ShipSystem.hero.visible = false;
                GameState.setState('DOCKED');
                docking = false;
                dockingPhase = null;
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
        console.log('animateUndocking called. docking:', docking, 'dockingTransition:', dockingTransition);
        if (!docking) return;
        const ctx = GameState.getContext();
        const canvas = GameState.getCanvas();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the space flight scene as background during undocking
        if (typeof GameState !== 'undefined' && GameState.renderPlayingState) {
            // Render the normal space flight background (no interpolation)
            GameState.renderPlayingState(0);
        } else {
            // Fallback: fill with black
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Swipe-out effect: black rectangle shrinks from left to right (mirrors docking swipe-out)
        dockingTransition += 2; // Was 5
        const swipeWidth = canvas.width * (1 - dockingTransition / 100);
        ctx.save();
        ctx.fillStyle = "#000";
        ctx.globalAlpha = 1.0;
        ctx.fillRect(0, 0, swipeWidth, canvas.height);
        ctx.restore();

        if (dockingTransition >= 100) {
            // Undocking complete
            docking = false;
            dockingPhase = null;
            // GameState.showNotification("Undocking complete."); // Removed notification
            ShipSystem.hero.visible = true;
            // Place ship at last docked X position and restore previous Y position
            ShipSystem.hero.tipX = lastDockX;
            ShipSystem.hero.tipY = lastDockTipY; // Restore the Y position
            ShipSystem.hero.leftX = ShipSystem.hero.tipX - ShipSystem.hero.width/2;
            ShipSystem.hero.rightX = ShipSystem.hero.tipX + ShipSystem.hero.width/2;
            ShipSystem.hero.leftY = ShipSystem.hero.tipY + ShipSystem.hero.height;
            ShipSystem.hero.rightY = ShipSystem.hero.tipY + ShipSystem.hero.height;
            undockCooldown = 60;
            if (typeof StationSystem !== 'undefined') {
                StationSystem._forceExit();
            }
            setTimeout(() => {
                GameState.setState('PLAYING');
            }, 0);
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
        console.log('[DockingSystem] handlePlayerMovement called. State:', GameState.getCurrentState());
        // Allow movement if in DOCKED state (not just during docking animation)
        if (!(GameState.getCurrentState && GameState.getCurrentState() === GameState.STATE.DOCKED)) return;
        // Handle arrow key movement
        if (InputSystem.wasPressed('left')) {
            console.log('[DockingSystem] Left pressed');
            StationSystem.movePlayer(-1, 0);
        }
        if (InputSystem.wasPressed('right')) {
            console.log('[DockingSystem] Right pressed');
            StationSystem.movePlayer(1, 0);
        }
        if (InputSystem.wasPressed('up')) {
            console.log('[DockingSystem] Up pressed');
            StationSystem.movePlayer(0, -1);
        }
        if (InputSystem.wasPressed('down')) {
            console.log('[DockingSystem] Down pressed');
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
        isDocking: function() {
            // Robust: true if in any docking/undocking transition phase
            return docking === true || dockingPhase === 'in' || dockingPhase === 'out' || dockingPhase === 'undock-swipe';
        },
        dock: dock,
        undock: undock,
        setOnDockingComplete: setOnDockingComplete,
        checkExitStation: checkExitStation,
        handlePlayerMovement: handlePlayerMovement,
        updateUndockCooldown: updateUndockCooldown,
        canDock: canDock
    };
})();