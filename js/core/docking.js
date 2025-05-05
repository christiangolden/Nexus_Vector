/**
 * Nexus Vector - Docking System
 * 
 * This module handles the docking state when the ship lands in a room.
 */

const DockingSystem = (function() {
    'use strict';
    
    // Docking status
    let docking = false;
    
    // Character representation
    const man = [
        "@", // walking hero after docked
        0,   // x position
        0    // y position
    ];
    
    /**
     * Start docking process
     * @param {number} x - X position to dock at
     * @param {number} y - Y position to dock at
     */
    function dock(x, y) {
        docking = true;
        man[1] = x;
        man[2] = y;
    }
    
    /**
     * End docking and return to normal gameplay
     */
    function undock() {
        const canvas = GameState.getCanvas();
        
        // Set ship position back at bottom of screen
        ShipSystem.hero.tipY = canvas.height - 50;
        ShipSystem.hero.leftY = ShipSystem.hero.tipY + ShipSystem.hero.height;
        ShipSystem.hero.rightY = ShipSystem.hero.tipY + ShipSystem.hero.height;
        
        // Move rooms down to get back to normal gameplay view
        for (let i = 0; i < RoomSystem.roomList.length; i++) {
            RoomSystem.roomList[i].y += canvas.height / 2 + ShipSystem.hero.height;
        }
        
        // Move rats with rooms
        for (let i = 0; i < RoomSystem.ratList.length; i++) {
            RoomSystem.ratList[i].y += canvas.height / 2 + ShipSystem.hero.height;
        }
        
        docking = false;
    }
    
    /**
     * Set the unDeadHero flag to revive the player
     */
    function reviveHero() {
        // This exposes the method to revive the hero
        // which was previously handled through window.unDeadHero
        GameState.setUnDeadHero(true);
    }
    
    /**
     * Draw the character (man) when docked
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    function drawMan(ctx) {
        ctx.font = "16px Consolas";
        ctx.fillStyle = ColorUtils.randRGB();
        ctx.fillText(man[0], man[1], man[2]);
    }
    
    /**
     * Center the view on the man when docked
     */
    function centerViewOnMan() {
        const canvas = GameState.getCanvas();
        
        // Calculate distance to center
        const xdist = canvas.width / 2 - man[1];
        const ydist = canvas.height / 2 - man[2];
        
        // Smoothly move view to center on man
        if (Math.abs(xdist)) {
            man[1] += xdist / 20;
            ShipSystem.hero.tipX += xdist / 20;
            ShipSystem.hero.leftX += xdist / 20;
            ShipSystem.hero.rightX += xdist / 20;

            for (let i = 0; i < RoomSystem.roomList.length; i++) {
                RoomSystem.roomList[i].x += xdist / 20;
            }
            for (let i = 0; i < RoomSystem.ratList.length; i++) {
                RoomSystem.ratList[i].x += xdist / 20;
            }
        }
        
        if (Math.abs(ydist)) {
            man[2] += ydist / 20;
            ShipSystem.hero.tipY += ydist / 20;
            ShipSystem.hero.leftY += ydist / 20;
            ShipSystem.hero.rightY += ydist / 20;
            
            for (let i = 0; i < RoomSystem.roomList.length; i++) {
                RoomSystem.roomList[i].y += ydist / 20;
            }
            for (let i = 0; i < RoomSystem.ratList.length; i++) {
                RoomSystem.ratList[i].y += ydist / 20;
            }
        }
    }
    
    /**
     * Move the man left
     */
    function moveManLeft() {
        ShipSystem.hero.tipX += 1;
        ShipSystem.hero.leftX += 1;
        ShipSystem.hero.rightX += 1;
        
        for (let i = 0; i < RoomSystem.roomList.length; i++) {
            RoomSystem.roomList[i].x += 1;
        }
        for (let i = 0; i < RoomSystem.ratList.length; i++) {
            RoomSystem.ratList[i].x += 1;
        }
        for (let i = 0; i < StarSystem.getStars().xList.length; i++) {
            StarSystem.getStars().xList[i] += 1;
        }
    }
    
    /**
     * Move the man right
     */
    function moveManRight() {
        ShipSystem.hero.tipX -= 1;
        ShipSystem.hero.leftX -= 1;
        ShipSystem.hero.rightX -= 1;
        
        for (let i = 0; i < RoomSystem.roomList.length; i++) {
            RoomSystem.roomList[i].x -= 1;
        }
        for (let i = 0; i < RoomSystem.ratList.length; i++) {
            RoomSystem.ratList[i].x -= 1;
        }
        for (let i = 0; i < StarSystem.getStars().xList.length; i++) {
            StarSystem.getStars().xList[i] -= 1;
        }
    }
    
    /**
     * Move the man up
     */
    function moveManUp() {
        ShipSystem.hero.tipY += 1;
        ShipSystem.hero.rightY += 1;
        ShipSystem.hero.leftY += 1;
        
        for (let i = 0; i < RoomSystem.roomList.length; i++) {
            RoomSystem.roomList[i].y += 1;
        }
        for (let i = 0; i < RoomSystem.ratList.length; i++) {
            RoomSystem.ratList[i].y += 1;
        }
        for (let i = 0; i < StarSystem.getStars().xList.length; i++) {
            StarSystem.getStars().yList[i] += 1;
        }
    }
    
    /**
     * Move the man down
     */
    function moveManDown() {
        ShipSystem.hero.tipY -= 1;
        ShipSystem.hero.rightY -= 1;
        ShipSystem.hero.leftY -= 1;
        
        for (let i = 0; i < RoomSystem.roomList.length; i++) {
            RoomSystem.roomList[i].y -= 1;
        }
        for (let i = 0; i < RoomSystem.ratList.length; i++) {
            RoomSystem.ratList[i].y -= 1;
        }
        for (let i = 0; i < StarSystem.getStars().xList.length; i++) {
            StarSystem.getStars().yList[i] -= 1;
        }
    }
    
    /**
     * Handle man movement based on input
     */
    function handleManMovement() {
        if ((InputSystem.isRightPressed() || InputSystem.isRightTouchActive()) && 
            RoomSystem.inRoom(man[1] + 8, man[2])) {
            moveManRight();
        }
        if ((InputSystem.isLeftPressed() || InputSystem.isLeftTouchActive()) && 
            RoomSystem.inRoom(man[1] - 7, man[2])) {
            moveManLeft();
        }
        if ((InputSystem.isDownPressed() || InputSystem.isDownTouchActive()) && 
            RoomSystem.inRoom(man[1], man[2] + 5)) {
            moveManDown();
        }
        if ((InputSystem.isUpPressed() || InputSystem.isUpTouchActive()) && 
            RoomSystem.inRoom(man[1], man[2] - 10)) {
            moveManUp();
        }
    }
    
    /**
     * Check if man is returning to the ship
     * @returns {boolean} - Whether the man should return to the ship
     */
    function checkManReturnsToShip() {
        return (
            man[1] > ShipSystem.hero.leftX && 
            man[1] < ShipSystem.hero.rightX &&
            man[2] > ShipSystem.hero.tipY + ShipSystem.hero.height / 2 &&
            man[2] < ShipSystem.hero.leftY
        );
    }

    /**
     * Find zoom level for docking zoom effect
     */
    function findZoom() {
        const canvas = GameState.getCanvas();
        // Create gradient for line
    }
    
    // Public API
    return {
        isDocking: function() { return docking; },
        dock: dock,
        undock: undock,
        reviveHero: reviveHero,
        drawMan: drawMan,
        centerViewOnMan: centerViewOnMan,
        moveManLeft: moveManLeft,
        moveManRight: moveManRight,
        moveManUp: moveManUp,
        moveManDown: moveManDown,
        handleManMovement: handleManMovement,
        checkManReturnsToShip: checkManReturnsToShip,
        getManX: function() { return man[1]; },
        getManY: function() { return man[2]; },
        findZoom: findZoom
    };
})();