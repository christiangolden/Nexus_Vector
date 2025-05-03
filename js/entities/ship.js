/**
 * Nexus Vector - Ship System
 * 
 * This module manages the player's ship and enemy ships.
 */

const ShipSystem = (function() {
    'use strict';
    
    /**
     * Ship constructor
     * @param {string} orientation - Ship orientation ("up" or "down")
     * @param {number} width - Ship width
     * @param {number} height - Ship height
     * @param {number} tipX - X position of the ship's tip
     * @param {number} tipY - Y position of the ship's tip
     */
    function Ship(orientation, width, height, tipX, tipY) {
        this.width = width;
        this.height = height;
        this.tipX = tipX;
        this.tipY = tipY;
        this.rightX = this.tipX + this.width / 2;
        this.leftX = this.tipX - this.width / 2;
        
        if (orientation === "up") {
            this.rightY = this.tipY + this.height;
            this.leftY = this.tipY + this.height;
        } else {
            this.rightY = this.tipY - this.height;
            this.leftY = this.tipY - this.height;
        }
    }
    
    // Create hero and enemy ships
    let hero = null;
    let badguy = null;
    
    /**
     * Initialize ship objects
     */
    function init() {
        const canvas = Game.getCanvas();
        hero = new Ship("up", 20, 40, canvas.width / 2, canvas.height - 50);
        badguy = new Ship("down", 20, 40, Math.floor(Math.random() * canvas.width), 0);
    }
    
    /**
     * Draw the hero ship
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    function drawHero(ctx) {
        // Check for dust collision with hero
        for (let i = 0; i < DustSystem.dust.xList.length; i++) {
            if (CollisionSystem.isColliding(
                DustSystem.dust.xList[i], DustSystem.dust.yList[i],
                DustSystem.dust.width, DustSystem.dust.height,
                hero.leftX, hero.tipY, hero.width, hero.height)
            ) {
                DustSystem.dust.xList.splice(i, 1);
                DustSystem.dust.yList.splice(i, 1);
                Game.incrementDestDust();
                Game.setHeroDead(true);
                // Important: adjust the counter when removing an element
                i--;
            }
        }
        
        // Update hero coordinates
        hero.leftX = hero.tipX - hero.width / 2;
        hero.rightX = hero.tipX + hero.width / 2;
        
        // Draw hero ship
        ctx.beginPath();
        ctx.moveTo(hero.tipX, hero.tipY);
        ctx.lineTo(hero.rightX, hero.rightY);
        ctx.lineTo(hero.leftX, hero.leftY);
        ctx.lineTo(hero.tipX, hero.tipY);
        ctx.fillStyle = ColorUtils.randRGB();
        ctx.fill();
        ctx.closePath();
    }
    
    /**
     * Draw the enemy ship
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    function drawEnemy(ctx) {
        // Update enemy coordinates
        badguy.leftY = badguy.tipY - badguy.height;
        badguy.rightY = badguy.tipY - badguy.height;
        badguy.leftX = badguy.tipX - 10;
        badguy.rightX = badguy.tipX + 10;
        
        const canvas = Game.getCanvas();
        
        // Move enemy based on hero location
        if (badguy.tipX > (hero.tipX + 5) && badguy.tipY < hero.tipY) {
            badguy.leftX -= 5;
            badguy.rightX -= 5;
            badguy.tipX -= 5;
            badguy.tipY += 5;
        } else if (badguy.tipX < (hero.tipX - 5) && badguy.tipY < hero.tipY) {
            badguy.leftX += 5;
            badguy.rightX += 5;
            badguy.tipX += 5;
            badguy.tipY += 5;
        } else if (badguy.tipY > canvas.height + badguy.height) {
            // Reset enemy if it goes off screen
            badguy = new Ship("down", 20, 40, Math.floor(Math.random() * canvas.width), 0);
        } else {
            // Normal downward movement
            badguy.tipY += 7;
        }
        
        // Update ship width
        badguy.width = badguy.rightX - badguy.leftX;
        
        // Draw enemy ship
        ctx.beginPath();
        ctx.moveTo(badguy.tipX, badguy.tipY);
        ctx.lineTo(badguy.rightX, badguy.rightY);
        ctx.lineTo(badguy.leftX, badguy.leftY);
        ctx.lineTo(badguy.tipX, badguy.tipY);
        ctx.fillStyle = ColorUtils.randRGB();
        ctx.fill();
        ctx.closePath();
    }
    
    /**
     * Move hero ship right
     */
    function moveHeroRight() {
        const canvas = Game.getCanvas();
        const speed = Game.getSpeed();
        
        if (InputSystem.isShiftPressed()) {
            // Move background instead of hero
            StarSystem.moveStarsX(-speed);
            RoomSystem.moveRoomsX(-speed);
            RoomSystem.moveRatsX(-speed);
            DustSystem.moveDustX(-speed);
            BulletSystem.moveBulletsX(-speed);
            
            // Move enemy with background
            badguy.leftX -= speed;
            badguy.rightX -= speed;
            badguy.tipX -= speed;
        } else {
            // Move hero right
            if (hero.leftX >= canvas.width) {
                // Wrap around screen edge
                hero.tipX -= canvas.width + hero.width;
            } else {
                hero.tipX += speed;
            }
        }
    }
    
    /**
     * Move hero ship left
     */
    function moveHeroLeft() {
        const canvas = Game.getCanvas();
        const speed = Game.getSpeed();
        
        if (InputSystem.isShiftPressed()) {
            // Move background instead of hero
            StarSystem.moveStarsX(speed);
            RoomSystem.moveRoomsX(speed);
            RoomSystem.moveRatsX(speed);
            DustSystem.moveDustX(speed);
            BulletSystem.moveBulletsX(speed);
            
            // Move enemy with background
            badguy.leftX += speed;
            badguy.rightX += speed;
            badguy.tipX += speed;
        } else {
            // Move hero left
            if (hero.rightX <= 0) {
                // Wrap around screen edge
                hero.tipX += canvas.width + hero.width;
            } else {
                hero.tipX -= speed;
            }
        }
    }
    
    /**
     * Reset the enemy ship
     */
    function resetEnemy() {
        const canvas = Game.getCanvas();
        badguy = new Ship("down", 20, 40, Math.floor(Math.random() * canvas.width), 0);
    }
    
    // Public API
    return {
        Ship: Ship,
        init: init,
        get hero() { return hero; },
        get badguy() { return badguy; },
        set badguy(value) { badguy = value; },
        drawHero: drawHero,
        drawEnemy: drawEnemy,
        moveHeroRight: moveHeroRight,
        moveHeroLeft: moveHeroLeft,
        resetEnemy: resetEnemy
    };
})();