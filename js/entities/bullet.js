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
        maxBullets = GameState.getScore() * 10; // 10 bullets per stardust
    }

    // Initialize bullet count to 0
    let bulletCount = 100; // Start with some bullets

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
        bulletCount = 100; // Start with some bullets
    }
    
    /**
     * Updates enemy bullets position and collision detection
     * @param {number} timeStep - Fixed timestep in seconds (optional)
     */
    function updateBullets(timeStep = 1/60) {
        const timeScale = timeStep * 60; // Scale to 60 fps baseline
        const warp = GameState.getWarpActive();
        const warpFactor = warp ? 8 : 1;
        
        // Update enemy bullets
        for (let i = bulletList.length - 1; i >= 0; i--) {
            const bullet = bulletList[i];
            
            // Move bullet based on its velocity, scaled by timeScale and warp
            bullet.x += bullet.dx * timeScale * warpFactor;
            bullet.y += bullet.dy * timeScale * warpFactor;

            // Check if bullet is off-screen (top, bottom, left, right)
            if (bullet.y < 0 || bullet.y > GameState.getCanvas().height || bullet.x < 0 || bullet.x > GameState.getCanvas().width) {
                // Recycle bullets that are off-screen
                bulletList.splice(i, 1);
                bulletPool.recycle(bullet);
            }
        }
    }

    /**
     * Renders enemy bullets
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    function drawEnemyBullets(ctx) {
        // Draw enemy bullets
        for (let i = 0; i < bulletList.length; i++) {
            const bullet = bulletList[i];
            ctx.beginPath();
            ctx.rect(bullet.x, bullet.y, bullet.width, bullet.height);
            ctx.fillStyle = ColorUtils.randRGB();
            ctx.fill();
        }
    }
    
    /**
     * Draw hero bullets
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {Object} dust - Dust system object for collision checking
     * @param {number} timeStep - Fixed timestep in seconds (optional)
     */
    function drawHeroBullets(ctx, dust, timeStep = 1/60) {
        const timeScale = timeStep * 60;
        const warp = GameState.getWarpActive();
        const warpFactor = warp ? 8 : 1;
        
        // Manage bullet firing rate - use PowerUpSystem's fire rate if available
        if (wait) {
            // Scale timer increment by timeScale for consistent fire rate
            timer += timeScale;
            // Check if using rapid fire rate from power-up
            const effectiveFireRate = PowerUpSystem ? PowerUpSystem.getFireRate() : 7;
            if (timer >= effectiveFireRate) {
                wait = false;
            }
        } else {
            if (InputSystem.isSpacePressed() || InputSystem.isRightTouchActive()) {
                // Check if multi-shot is active
                if (PowerUpSystem && PowerUpSystem.isMultiShotActive()) {
                    const count = PowerUpSystem.getMultiShotCount();
                    const spread = 8; // Pixels between bullets
                    
                    // Calculate positions for multiple bullets
                    for (let i = 0; i < count; i++) {
                        const offsetX = (i - Math.floor(count / 2)) * spread;
                        spawnHeroBullet(ShipSystem.hero.tipX - 1 + offsetX, ShipSystem.hero.tipY);
                    }
                } else {
                    // Regular single shot
                    spawnHeroBullet(ShipSystem.hero.tipX - 1, ShipSystem.hero.tipY);
                }
                
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
            
            // Move and draw bullets - scale movement by timeScale and warp
            if (heroBulletList[i].y > 0) {
                heroBulletList[i].y -= 20 * timeScale * warpFactor;
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
                    GameState.incrementDestDust();
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
     * Check if hero bullets hit any enemy ship.
     */
    function checkHeroHits() {
        const enemies = ShipSystem.activeEnemies; // Get the list of active enemies

        for (let i = heroBulletList.length - 1; i >= 0; i--) {
            const bullet = heroBulletList[i];
            let hit = false; // Flag to check if bullet hit any enemy

            // Loop through active enemies
            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j].ship; // Get the ship object from the enemy entry

                // Check collision using enemy's bounding box
                if (CollisionSystem.isColliding(
                    bullet.x, bullet.y,
                    bullet.width, bullet.height,
                    enemy.leftX, enemy.leftY, 
                    enemy.width, enemy.tipY - enemy.leftY 
                )) {
                    GameState.incrementShotDrones();
                    
                    // Use the new removeEnemy function, indicating it was destroyed
                    ShipSystem.removeEnemy(j, true);
                    
                    // Remove and recycle the hero bullet
                    heroBulletList.splice(i, 1);
                    bulletPool.recycle(bullet);

                    hit = true;
                    break; // Exit inner loop, bullet is gone
                }
            }
            // If bullet hit an enemy, continue to the next bullet (outer loop)
            if (hit) continue; 
        }
    }
    
    /**
     * Check if enemy bullets hit the hero
     */
    function checkEnemyHits() {
        for (let i = 0; i < bulletList.length; i++) {
            // Check if shield is active from PowerUpSystem
            if (PowerUpSystem && PowerUpSystem.isShieldActive()) {
                // If shield active, destroy bullets that hit the shield (larger radius than hero)
                const shieldRadius = ShipSystem.hero.width; // Size of shield
                
                // Calculate distance between bullet and hero center
                const dx = bulletList[i].x - ShipSystem.hero.tipX;
                const dy = bulletList[i].y - ShipSystem.hero.tipY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < shieldRadius) {
                    const recycledBullet = bulletList.splice(i, 1)[0];
                    bulletPool.recycle(recycledBullet);
                    i--;
                    continue;
                }
            }
            
            // Normal collision check with hero ship
            if (CollisionSystem.isColliding(
                bulletList[i].x, bulletList[i].y,
                bulletList[i].width, bulletList[i].height,
                ShipSystem.hero.leftX, ShipSystem.hero.tipY,
                ShipSystem.hero.width, ShipSystem.hero.height
            )) {
                const recycledBullet = bulletList.splice(i, 1)[0];
                bulletPool.recycle(recycledBullet);
                i--;
                GameState.setHeroDead(true);
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
                    GameState.incrementDestDust();
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
            if (bulletList[i].y > GameState.getCanvas().height) {
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
        updateBullets: updateBullets, // Use this now for enemy bullets
        drawEnemyBullets: drawEnemyBullets, // New function to draw enemy bullets
        drawHeroBullets: drawHeroBullets,
        checkHeroHits: checkHeroHits,
        checkEnemyHits: checkEnemyHits,
        checkDustHits: checkDustHits,
        cleanupBullets: cleanupBullets,
        moveBulletsX: moveBulletsX,
        clearAllBullets: clearAllBullets,
        spawnBullet: spawnBullet, // Expose spawnBullet
        // Expose bullet count functions if needed by Game or UI
        getBulletCount: getBulletCount, 
        incrementBulletCount: incrementBulletCount, 
        decrementBulletCount: decrementBulletCount 
    };
})();