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
        const canvas = Game.getCanvas();
        mwRange = (canvas.width * canvas.height) * 0.0004;
    }
    
    /**
     * Generate a new dust particle
     */
    function genDustXY() {
        const canvas = Game.getCanvas();
        const maxDustCount = 100;
        
        // Randomly generate dust with a limit
        if (dust.xList.length < maxDustCount && Math.floor(Math.random() * 50) === 1) {
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
        genDustXY();
        
        // Use a single color for all dust particles in each frame
        // to reduce style changes which are costly
        ctx.fillStyle = ColorUtils.randRGB();
        
        for (let i = 0; i < dust.yList.length; i++) {
            if (dust.yList[i] >= Game.getCanvas().height) {
                // Recycle dust particles that go off screen
                const recycledX = dust.xList.splice(i, 1)[0];
                const recycledY = dust.yList.splice(i, 1)[0];
                dustPool.recycle({x: recycledX, y: recycledY});
                i--;
            } else {
                // Batch rendering - don't change styles between draws
                ctx.fillRect(dust.xList[i], dust.yList[i], dust.width, dust.height);
            }
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
     */
    function updateDust() {
        // Process magwave
        if ((InputSystem.isDownPressed() || InputSystem.isLeftTouchActive()) && 
            mwEnergy > 0 && !DockingSystem.isDocking()) {
            if (magWave.radius < ShipSystem.hero.width) {
                magWave.radius += 0.5;
                mwEnergy -= 0.02;
            } else {
                magWave.radius = 0;
            }
            drawMagWave(Game.getContext());
        } else {
            magWave.radius = 0;
        }
        
        // Recharge magwave energy
        if (!(InputSystem.isDownPressed() || InputSystem.isLeftTouchActive()) && mwEnergy < 5) {
            mwEnergy += 0.05;
        }
        
        // Update dust movement
        for (let i = 0; i < dust.yList.length; i++) {
            if ((InputSystem.isDownPressed() || InputSystem.isLeftTouchActive()) && 
                dust.xList[i] > ShipSystem.hero.tipX &&
                dust.xList[i] < (ShipSystem.hero.tipX + mwRange) &&
                dust.yList[i] < ShipSystem.hero.tipY - ShipSystem.hero.height &&
                dust.yList[i] > (ShipSystem.hero.tipY - ShipSystem.hero.height - mwRange) &&
                mwEnergy > 0) {
                // Upper right quadrant
                dust.xList[i] -= 3;
                dust.yList[i] += 5;
            } else if ((InputSystem.isDownPressed() || InputSystem.isLeftTouchActive()) && 
                dust.xList[i] > ShipSystem.hero.tipX &&
                dust.xList[i] < (ShipSystem.hero.tipX + mwRange) &&
                dust.yList[i] > ShipSystem.hero.tipY - ShipSystem.hero.height && 
                mwEnergy > 0) {
                // Lower right quadrant
                dust.xList[i] -= 3;
                dust.yList[i] -= 5;
            } else if ((InputSystem.isDownPressed() || InputSystem.isLeftTouchActive()) && 
                dust.xList[i] < ShipSystem.hero.tipX &&
                dust.xList[i] > (ShipSystem.hero.tipX - mwRange) &&
                dust.yList[i] < ShipSystem.hero.tipY - ShipSystem.hero.height &&
                dust.yList[i] > (ShipSystem.hero.tipY - ShipSystem.hero.height - mwRange) &&
                mwEnergy > 0) {
                // Upper left quadrant
                dust.xList[i] += 3;
                dust.yList[i] += 5;
            } else if ((InputSystem.isDownPressed() || InputSystem.isLeftTouchActive()) && 
                dust.xList[i] < ShipSystem.hero.tipX &&
                dust.xList[i] > (ShipSystem.hero.tipX - mwRange) &&
                dust.yList[i] > ShipSystem.hero.tipY - ShipSystem.hero.height && 
                mwEnergy > 0) {
                // Lower left quadrant
                dust.xList[i] += 3;
                dust.yList[i] -= 5;
            } else {
                // Normal dust movement
                dust.yList[i] += Math.floor(Math.random() * 5 + 3);
                dust.xList[i] += Math.floor(Math.random() * -5 + 3);
            }

            // Check if dust is being collected by magwave
            if ((InputSystem.isDownPressed() || InputSystem.isLeftTouchActive()) && 
                dust.xList[i] <= ShipSystem.hero.tipX + 3 &&
                dust.xList[i] >= ShipSystem.hero.tipX - magWave.radius - dust.width &&
                dust.xList[i] <= ShipSystem.hero.tipX + magWave.radius + dust.width &&
                dust.yList[i] >= ShipSystem.hero.tipY - ShipSystem.hero.height - magWave.radius &&
                dust.yList[i] <= ShipSystem.hero.tipY - ShipSystem.hero.height + magWave.radius &&
                mwEnergy > 0) {
                dust.xList.splice(i, 1);
                dust.yList.splice(i, 1);
                Game.incrementScore();
                i--;
            }
        }
    }
    
    /**
     * Check if enemy ship is colliding with dust
     */
    function checkEnemyCollisions() {
        for (let i = 0; i < dust.xList.length; i++) {
            if (CollisionSystem.isColliding(
                dust.xList[i], dust.yList[i],
                dust.width, dust.height,
                ShipSystem.badguy.leftX, ShipSystem.badguy.leftY,
                ShipSystem.badguy.width, ShipSystem.badguy.tipY - ShipSystem.badguy.leftY
            )) {
                dust.xList.splice(i, 1);
                dust.yList.splice(i, 1);
                Game.incrementDestDust();
                i--;
            }
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