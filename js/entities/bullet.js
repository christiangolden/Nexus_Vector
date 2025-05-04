/**
 * Nexus Vector - Bullet System
 * 
 * This module manages bullets from both hero and enemy ships.
 */

const BulletSystem = (function() {
    'use strict';
    
    /**
     * Bullet constructor
     * @param {number} width - Bullet width
     * @param {number} height - Bullet height
     * @param {number} x - Bullet x position
     * @param {number} y - Bullet y position
     */
    function Bullet(width, height, x, y) {
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
    }
    
    // Bullet lists and object pool
    let bulletList = [];
    let heroBulletList = [];
    let timer = 0;
    let wait = false;  // delay between hero bullets
    
    // Limit bullets based on stardust collected
    let maxBullets = 0;

    function updateMaxBullets() {
        maxBullets = Game.getScore() * 10; // 10 bullets per stardust
    }

    // Initialize bullet count to 0
    let bulletCount = 0;

    function getBulletCount() {
        return bulletCount;
    }

    function incrementBulletCount(amount) {
        bulletCount += amount;
    }

    function decrementBulletCount() {
        if (bulletCount > 0) {
            bulletCount--;
        }
    }

    function spawnHeroBullet(x, y) {
        if (bulletCount > 0) {
            BulletSystem.spawnBullet(x, y, 0, -10, "hero");
            decrementBulletCount();
        }
    }
    
    /**
     * Bullet pool for efficient object reuse
     */
    const bulletPool = {
        pool: [],
        maxSize: 30,
        
        init: function() {
            for (let i = 0; i < this.maxSize; i++) {
                this.pool.push(new Bullet(2, 16, 0, 0));
            }
        },
        
        get: function(x, y) {
            if (this.pool.length > 0) {
                const bullet = this.pool.pop();
                bullet.x = x;
                bullet.y = y;
                return bullet;
            }
            return new Bullet(2, 16, x, y);
        },
        
        recycle: function(bullet) {
            if (this.pool.length < this.maxSize) {
                this.pool.push(bullet);
            }
        }
    };
    
    /**
     * Add spawnBullet function to handle bullet creation
     */
    function spawnBullet(x, y, dx, dy, type) {
        const bullet = bulletPool.get(x, y);
        bullet.dx = dx;
        bullet.dy = dy;
        bullet.type = type;

        if (type === "hero") {
            heroBulletList.push(bullet);
        } else {
            bulletList.push(bullet);
        }
    }
    
    /**
     * Initialize the bullet system
     */
    function init() {
        bulletPool.init();
        bulletList = [];
        heroBulletList = [];
        timer = 0;
        wait = false;
    }
    
    /**
     * Draw enemy bullets
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    function drawBullets(ctx) {
        // Random chance to fire a bullet
        if (Math.floor(Math.random() * 10) === 3 && ShipSystem.badguy.tipY > 0) {
            bulletList.push(bulletPool.get(ShipSystem.badguy.tipX - 1, ShipSystem.badguy.tipY - 9));
        }
        
        // Update and draw bullets
        for (let i = 0; i < bulletList.length; i++) {
            if (bulletList[i].y < Game.getCanvas().height) {
                bulletList[i].y += 10;
                ctx.beginPath();
                ctx.rect(bulletList[i].x, bulletList[i].y, bulletList[i].width, bulletList[i].height);
                ctx.fillStyle = ColorUtils.randRGB();
                ctx.fill();
            } else {
                // Recycle bullets that are off-screen
                const bullet = bulletList.splice(i, 1)[0];
                bulletPool.recycle(bullet);
                i--;
            }
        }
    }
    
    /**
     * Draw hero bullets
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {Object} dust - Dust system object for collision checking
     */
    function drawHeroBullets(ctx, dust) {
        // Manage bullet firing rate
        if (wait) {
            timer++;
            if (timer === 7) {
                wait = false;
            }
        } else {
            // Replace direct heroBulletList.push with spawnHeroBullet
            if (InputSystem.isSpacePressed() || InputSystem.isRightTouchActive()) {
                spawnHeroBullet(ShipSystem.hero.tipX - 1, ShipSystem.hero.tipY);
                timer = 0;
                wait = true;
            }
        }
        
        // Update and draw hero bullets
        for (let i = 0; i < heroBulletList.length; i++) {
            // Remove bullets that go off screen
            if (heroBulletList[i].y < 1) {
                const recycledBullet = heroBulletList.splice(i, 1)[0];
                bulletPool.recycle(recycledBullet);
                i--;
                continue;
            }
            
            // Move and draw bullets
            if (heroBulletList[i].y > 0) {
                heroBulletList[i].y -= 20;
                ctx.beginPath();
                ctx.rect(
                    heroBulletList[i].x, 
                    heroBulletList[i].y, 
                    heroBulletList[i].width, 
                    heroBulletList[i].height
                );
                ctx.fillStyle = ColorUtils.randRGB();
                ctx.fill();
            }
            
            // Check for bullet collision with dust
            for (let j = 0; j < dust.xList.length; j++) {
                if (CollisionSystem.isColliding(
                    heroBulletList[i].x, heroBulletList[i].y, 
                    heroBulletList[i].width, heroBulletList[i].height,
                    dust.xList[j], dust.yList[j], dust.width, dust.height
                )) {
                    Game.incrementDestDust();
                    dust.yList.splice(j, 1);
                    dust.xList.splice(j, 1);
                    
                    const bulletToRecycle = heroBulletList.splice(i, 1)[0];
                    bulletPool.recycle(bulletToRecycle);
                    i--;
                    break;
                }
            }
        }
    }
    
    /**
     * Check if hero bullets hit enemy ship
     */
    function checkHeroHits() {
        for (let i = 0; i < heroBulletList.length; i++) {
            if (CollisionSystem.isColliding(
                heroBulletList[i].x, heroBulletList[i].y,
                heroBulletList[i].width, heroBulletList[i].height,
                ShipSystem.badguy.leftX, ShipSystem.badguy.leftY,
                ShipSystem.badguy.width, ShipSystem.badguy.tipY - ShipSystem.badguy.leftY
            ) && ShipSystem.badguy.tipY > 0) {
                Game.incrementShotDrones();
                Game.gainXP(10);
                ShipSystem.resetEnemy();
                
                const recycledBullet = heroBulletList.splice(i, 1)[0];
                bulletPool.recycle(recycledBullet);
                i--;
                break;
            }
        }
    }
    
    /**
     * Check if enemy bullets hit the hero
     */
    function checkEnemyHits() {
        for (let i = 0; i < bulletList.length; i++) {
            if (CollisionSystem.isColliding(
                bulletList[i].x, bulletList[i].y,
                bulletList[i].width, bulletList[i].height,
                ShipSystem.hero.leftX, ShipSystem.hero.tipY,
                ShipSystem.hero.width, ShipSystem.hero.height
            )) {
                const recycledBullet = bulletList.splice(i, 1)[0];
                bulletPool.recycle(recycledBullet);
                i--;
                Game.setHeroDead(true);
            }
        }
    }
    
    /**
     * Check if enemy bullets hit dust particles
     */
    function checkDustHits() {
        for (let i = 0; i < bulletList.length; i++) {
            for (let j = 0; j < DustSystem.dust.xList.length; j++) {
                if (CollisionSystem.isColliding(
                    bulletList[i].x, bulletList[i].y,
                    bulletList[i].width, bulletList[i].height,
                    DustSystem.dust.xList[j], DustSystem.dust.yList[j],
                    DustSystem.dust.width, DustSystem.dust.height
                )) {
                    const recycledBullet = bulletList.splice(i, 1)[0];
                    bulletPool.recycle(recycledBullet);
                    
                    DustSystem.dust.xList.splice(j, 1);
                    DustSystem.dust.yList.splice(j, 1);
                    Game.incrementDestDust();
                    i--;
                    break;
                }
            }
        }
    }
    
    /**
     * Clean up bullets that go off screen
     */
    function cleanupBullets() {
        for (let i = 0; i < bulletList.length; i++) {
            if (bulletList[i].y > Game.getCanvas().height) {
                const recycledBullet = bulletList.splice(i, 1)[0];
                bulletPool.recycle(recycledBullet);
                i--;
            }
        }
    }
    
    /**
     * Move all bullets horizontally
     * @param {number} dx - Distance to move
     */
    function moveBulletsX(dx) {
        for (let i = 0; i < bulletList.length; i++) {
            bulletList[i].x += dx;
        }
        for (let i = 0; i < heroBulletList.length; i++) {
            heroBulletList[i].x += dx;
        }
    }
    
    /**
     * Clear all bullets
     */
    function clearAllBullets() {
        while (bulletList.length > 0) {
            bulletPool.recycle(bulletList.pop());
        }
        while (heroBulletList.length > 0) {
            bulletPool.recycle(heroBulletList.pop());
        }
    }
    
    // Public API
    return {
        init: init,
        drawBullets: drawBullets,
        drawHeroBullets: drawHeroBullets,
        checkHeroHits: checkHeroHits,
        checkEnemyHits: checkEnemyHits,
        checkDustHits: checkDustHits,
        cleanupBullets: cleanupBullets,
        moveBulletsX: moveBulletsX,
        clearAllBullets: clearAllBullets,
        getBulletPool: function() { return bulletPool; },
        getBulletList: function() { return bulletList; },
        getHeroBulletList: function() { return heroBulletList; },
        getBulletCount: getBulletCount,
        incrementBulletCount: incrementBulletCount,
        decrementBulletCount: decrementBulletCount,
        spawnBullet: spawnBullet
    };
})();