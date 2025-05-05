/**
 * Nexus Vector - Dust System
 * 
 * This module handles stardust particles and magwave interaction.
 */

const DustSystem = (function() {
    'use strict';
    
    // Dust object
    const dust = {
        width: 14,
        height: 14,
        xList: [],
        yList: [],
        x: 0,
        y: 0
    };
    
    // Magwave properties
    const magWave = {
        radius: 0,
        startAngle: 0,
        endAngle: 2 * Math.PI
    };
    
    // Magwave energy and range
    let mwEnergy = 5;
    let mwRange;
    
    /**
     * Dust object pool for efficient object reuse
     */
    const dustPool = {
        pool: [],
        maxSize: 40,
        
        init: function() {
            for (let i = 0; i < this.maxSize; i++) {
                this.pool.push({
                    x: 0,
                    y: 0
                });
            }
        },
        
        get: function(x, y) {
            if (this.pool.length > 0) {
                const dustParticle = this.pool.pop();
                dustParticle.x = x;
                dustParticle.y = y;
                return dustParticle;
            }
            return { x: x, y: y };
        },
        
        recycle: function(dustParticle) {
            if (this.pool.length < this.maxSize) {
                this.pool.push(dustParticle);
            }
        }
    };
    
    /**
     * Initialize the dust system
     */
    function init() {
        dustPool.init();
        dust.xList = [];
        dust.yList = [];
        updateMagWaveRange();
    }
    
    /**
     * Update the magwave range based on canvas dimensions
     */
    function updateMagWaveRange() {
        const canvas = GameState.getCanvas();
        mwRange = (canvas.width * canvas.height) * 0.0004;
    }
    
    /**
     * Generate a new dust particle
     * @param {number} timeStep - Fixed timestep in seconds
     */
    function genDustXY(timeStep = 1/60) {
        const canvas = GameState.getCanvas();
        const maxDustCount = 100;
        const timeScale = timeStep * 60; // Scale to 60fps baseline
        
        // Randomly generate dust with a limit
        // Scale spawn rate with timeStep
        if (dust.xList.length < maxDustCount && Math.random() < (0.02 * timeScale)) {
            const x = Math.floor(Math.random() * (canvas.width - dust.width) + 1);
            const y = Math.floor(Math.random() * -canvas.height - dust.height);
            
            const dustParticle = dustPool.get(x, y);
            dust.xList.push(dustParticle.x);
            dust.yList.push(dustParticle.y);
        }
    }
    
    /**
     * Draw dust particles
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    function drawDust(ctx) {
        // Use a single color for all dust particles in each frame
        // to reduce style changes which are costly
        ctx.fillStyle = ColorUtils.randRGB();
        
        for (let i = 0; i < dust.yList.length; i++) {
            // Batch rendering - don't change styles between draws
            ctx.fillRect(dust.xList[i], dust.yList[i], dust.width, dust.height);
        }
    }
    
    /**
     * Draw magwave effect
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    function drawMagWave(ctx) {
        ctx.beginPath();
        ctx.arc(
            ShipSystem.hero.tipX, 
            ShipSystem.hero.tipY - ShipSystem.hero.height, 
            magWave.radius, 
            magWave.startAngle, 
            magWave.endAngle
        );
        ctx.strokeStyle = ColorUtils.randRGB();
        ctx.lineWidth = mwEnergy;
        ctx.stroke();
        ctx.closePath();
    }
    
    /**
     * Update dust movement and magwave interaction
     * @param {number} timeStep - Fixed timestep in seconds
     */
    function updateDust(timeStep = 1/60) {
        const timeScale = timeStep * 60;
        const warp = GameState.getWarpActive();
        const warpFactor = warp ? 8 : 1;
        
        // Process magwave
        if ((InputSystem.isDownPressed() || InputSystem.isLeftTouchActive()) && 
            mwEnergy > 0 && !DockingSystem.isDocking()) {
            if (magWave.radius < ShipSystem.hero.width) {
                magWave.radius += 0.5 * timeScale;
                mwEnergy -= 0.02 * timeScale;
            } else {
                magWave.radius = 0;
            }
            // Remove drawMagWave call from here - we'll draw it in the render phase
        } else {
            magWave.radius = 0;
        }
        
        // Recharge magwave energy
        if (!(InputSystem.isDownPressed() || InputSystem.isLeftTouchActive()) && mwEnergy < 5) {
            mwEnergy += 0.05 * timeScale;
        }
        
        // Generate new dust with timeStep for consistent spawn rate
        genDustXY(timeStep);
        
        // Update dust movement
        for (let i = 0; i < dust.yList.length; i++) {
            // Store previous position to revert if needed
            const prevX = dust.xList[i];
            const prevY = dust.yList[i];
            
            if ((InputSystem.isDownPressed() || InputSystem.isLeftTouchActive()) && 
                dust.xList[i] > ShipSystem.hero.tipX &&
                dust.xList[i] < (ShipSystem.hero.tipX + mwRange) &&
                dust.yList[i] < ShipSystem.hero.tipY - ShipSystem.hero.height &&
                dust.yList[i] > (ShipSystem.hero.tipY - ShipSystem.hero.height - mwRange) &&
                mwEnergy > 0) {
                dust.xList[i] -= 3 * timeScale * warpFactor;
                dust.yList[i] += 5 * timeScale * warpFactor;
            } else if ((InputSystem.isDownPressed() || InputSystem.isLeftTouchActive()) && 
                dust.xList[i] > ShipSystem.hero.tipX &&
                dust.xList[i] < (ShipSystem.hero.tipX + mwRange) &&
                dust.yList[i] > ShipSystem.hero.tipY - ShipSystem.hero.height && 
                mwEnergy > 0) {
                dust.xList[i] -= 3 * timeScale * warpFactor;
                dust.yList[i] -= 5 * timeScale * warpFactor;
            } else if ((InputSystem.isDownPressed() || InputSystem.isLeftTouchActive()) && 
                dust.xList[i] < ShipSystem.hero.tipX &&
                dust.xList[i] > (ShipSystem.hero.tipX - mwRange) &&
                dust.yList[i] < ShipSystem.hero.tipY - ShipSystem.hero.height &&
                dust.yList[i] > (ShipSystem.hero.tipY - ShipSystem.hero.height - mwRange) &&
                mwEnergy > 0) {
                dust.xList[i] += 3 * timeScale * warpFactor;
                dust.yList[i] += 5 * timeScale * warpFactor;
            } else if ((InputSystem.isDownPressed() || InputSystem.isLeftTouchActive()) && 
                dust.xList[i] < ShipSystem.hero.tipX &&
                dust.xList[i] > (ShipSystem.hero.tipX - mwRange) &&
                dust.yList[i] > ShipSystem.hero.tipY - ShipSystem.hero.height && 
                mwEnergy > 0) {
                dust.xList[i] += 3 * timeScale * warpFactor;
                dust.yList[i] -= 5 * timeScale * warpFactor;
            } else {
                dust.yList[i] += (Math.floor(Math.random() * 5 + 3)) * timeScale * warpFactor;
                dust.xList[i] += (Math.floor(Math.random() * -5 + 3)) * timeScale * warpFactor;
            }

            // Check if dust is being collected by magwave
            if ((InputSystem.isDownPressed() || InputSystem.isLeftTouchActive()) && 
                dust.xList[i] <= ShipSystem.hero.tipX + magWave.radius + dust.width &&
                dust.xList[i] >= ShipSystem.hero.tipX - magWave.radius - dust.width &&
                dust.yList[i] >= ShipSystem.hero.tipY - ShipSystem.hero.height - magWave.radius &&
                dust.yList[i] <= ShipSystem.hero.tipY - ShipSystem.hero.height + magWave.radius &&
                mwEnergy > 0) {
                dust.xList.splice(i, 1);
                dust.yList.splice(i, 1);
                GameState.incrementPlayerScore();
                GameState.gainXp(1, true); // Gain 1 XP and increment bullet count by 10
                i--;
            }
            
            // Remove dust that goes off screen
            if (dust.yList[i] >= GameState.getCanvas().height || dust.yList[i] < -1000 ||
                dust.xList[i] <= -dust.width || dust.xList[i] >= GameState.getCanvas().width) {
                // Recycle dust particles that go off screen
                const recycledX = dust.xList.splice(i, 1)[0];
                const recycledY = dust.yList.splice(i, 1)[0];
                dustPool.recycle({x: recycledX, y: recycledY});
                i--;
            }
        }
    }
    
    /**
     * Check if enemy ships are colliding with dust
     */
    function checkEnemyCollisions() {
        const enemies = ShipSystem.activeEnemies;
        
        for (let i = dust.xList.length - 1; i >= 0; i--) {
            let hit = false;
            
            // Loop through all active enemy ships
            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j].ship;
                
                if (CollisionSystem.isColliding(
                    dust.xList[i], dust.yList[i],
                    dust.width, dust.height,
                    enemy.leftX, enemy.leftY,
                    enemy.width, enemy.tipY - enemy.leftY
                )) {
                    // Remove the dust particle
                    dust.xList.splice(i, 1);
                    dust.yList.splice(i, 1);
                    GameState.incrementDestDust();
                    hit = true;
                    break; // Exit the enemy loop since this dust particle is gone
                }
            }
            
            if (hit) break; // Exit the dust loop if a hit was found
        }
    }
    
    /**
     * Move dust horizontally
     * @param {number} dx - Amount to move
     */
    function moveDustX(dx) {
        for (let i = 0; i < dust.xList.length; i++) {
            dust.xList[i] += dx;
        }
    }
    
    /**
     * Clear all dust particles
     */
    function clearAllDust() {
        dust.xList = [];
        dust.yList = [];
    }
    
    // Public API
    return {
        init: init,
        dust: dust,
        magWave: magWave,
        drawDust: drawDust,
        drawMagWave: drawMagWave,
        updateDust: updateDust,
        updateMagWaveRange: updateMagWaveRange,
        checkEnemyCollisions: checkEnemyCollisions,
        moveDustX: moveDustX,
        clearAllDust: clearAllDust,
        getMwEnergy: function() { return mwEnergy; },
        getMwRange: function() { return mwRange; }
    };
})();