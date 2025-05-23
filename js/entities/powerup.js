/**
 * Nexus Vector - Power-Up System
 * 
 * This module handles power-ups that can be collected by the player.
 */

const PowerUpSystem = (function() {
    'use strict';
    
    // Array to hold active power-ups
    let powerUps = [];
    
    // Power-up object pool for efficient object reuse
    const powerUpPool = {
        pool: [],
        maxSize: 20, // Maximum size of the pool
        
        init: function() {
            // Pre-allocate power-up objects
            for (let i = 0; i < this.maxSize; i++) {
                this.pool.push({
                    x: 0,
                    y: 0,
                    width: 20,
                    height: 20,
                    type: "",
                    velocity: 0,
                    age: 0,
                    maxAge: 300,
                    driftX: 0,
                    oscillate: false,
                    oscillationSpeed: 0,
                    oscillationAmount: 0
                });
            }
        },
        
        get: function(x, y, type, velocity) {
            let powerUp;
            
            if (this.pool.length > 0) {
                powerUp = this.pool.pop();
                
                // Reset properties
                powerUp.x = x;
                powerUp.y = y;
                powerUp.width = 20;
                powerUp.height = 20;
                powerUp.type = type;
                powerUp.velocity = velocity;
                powerUp.age = 0;
                powerUp.maxAge = 300;
                powerUp.driftX = (Math.random() * 2) - 1;
                powerUp.oscillate = Math.random() > 0.5;
                powerUp.oscillationSpeed = Math.random() * 0.05 + 0.02;
                powerUp.oscillationAmount = Math.random() * 20 + 10;
            } else {
                // Create new if pool is empty (shouldn't happen often)
                powerUp = {
                    x: x,
                    y: y,
                    width: 20,
                    height: 20,
                    type: type,
                    velocity: velocity,
                    age: 0,
                    maxAge: 300,
                    driftX: (Math.random() * 2) - 1,
                    oscillate: Math.random() > 0.5,
                    oscillationSpeed: Math.random() * 0.05 + 0.02,
                    oscillationAmount: Math.random() * 20 + 10
                };
            }
            
            return powerUp;
        },
        
        recycle: function(powerUp) {
            if (this.pool.length < this.maxSize) {
                this.pool.push(powerUp);
            }
        }
    };
    
    // Power-up types and their properties
    const POWER_UP_TYPES = {
        SHIELD: {
            color: "#3399FF",
            symbol: "S",
            velocity: 3,
            apply: function() {
                PowerUpSystem.resetAllPowerUps();
                shieldActive = true;
            }
        },
        RAPID_FIRE: {
            color: "#FF3366",
            symbol: "R",
            velocity: 2,
            apply: function() {
                PowerUpSystem.resetAllPowerUps();
                rapidFireActive = true;
                originalFireRate = fireRate;
                fireRate = fireRate / 2;
            }
        },
        MULTI_SHOT: {
            color: "#FFCC00",
            symbol: "M",
            velocity: 4,
            apply: function() {
                PowerUpSystem.resetAllPowerUps();
                multiShotActive = true;
                multiShotCount = 3;
            }
        },
        EXTRA_BULLETS: {
            color: "#66CC66",
            symbol: "B",
            duration: 0,
            velocity: 3.5,
            apply: function() {
                BulletSystem.incrementBulletCount(50);
            }
        }
    };
    
    // Active power-up states
    let shieldActive = false;
    let rapidFireActive = false;
    let multiShotActive = false;
    let multiShotCount = 1;
    
    // Original fire rate for restoration after power-up expires
    let originalFireRate = 7;
    let fireRate = 7;
    
    /**
     * Initialize the power-up system
     */
    function init() {
        powerUps = [];
        resetAllPowerUps();
        powerUpPool.init();
    }
    
    /**
     * Reset all active power-ups
     */
    function resetAllPowerUps() {
        shieldActive = false;
        rapidFireActive = false;
        fireRate = 7;
        originalFireRate = 7;
        multiShotActive = false;
        multiShotCount = 1;
    }
    
    /**
     * Spawn a power-up at the given location
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    function spawnPowerUp(x, y) {
        // Increased chance of spawning power-ups from 15% to 40%
        if (Math.random() > 0.40) return; // 40% chance of spawning
        
        // Choose a random power-up type
        const types = Object.keys(POWER_UP_TYPES);
        const randomType = types[Math.floor(Math.random() * types.length)];
        const typeProps = POWER_UP_TYPES[randomType];
        
        // Add small random velocity variation to make movement more natural
        const velocityVariation = (Math.random() * 1.5) - 0.75; // -0.75 to +0.75
        
        // Create power-up object with movement properties using the pool
        const powerUp = powerUpPool.get(
            x, 
            y, 
            randomType, 
            typeProps.velocity + velocityVariation
        );
        
        powerUps.push(powerUp);
        
        // Safely call showNotification if it exists
        if (GameState && typeof GameState.showNotification === 'function') {
            GameState.showNotification("Power-up dropped!");
        }
    }
    
    /**
     * Update all power-ups
     */
    function update() {
        // Check if player has no bullets - this will deactivate shooting-related powerups
        const hasBullets = BulletSystem && BulletSystem.getBulletCount() > 0;
        
        // Only deactivate rapid fire and multi-shot if player has no bullets
        if (!hasBullets) {
            if (rapidFireActive) {
                rapidFireActive = false;
                fireRate = originalFireRate;
                // Notify player
                if (GameState && typeof GameState.showNotification === 'function') {
                    GameState.showNotification("Rapid-fire deactivated - Out of ammo!");
                }
            }
            
            if (multiShotActive) {
                multiShotActive = false;
                multiShotCount = 1;
                // Notify player
                if (GameState && typeof GameState.showNotification === 'function') {
                    GameState.showNotification("Multi-shot deactivated - Out of ammo!");
                }
            }
        }
        
        // Don't adjust timers anymore since power-ups are persistent

        const warpLevel = GameState.getWarpLevel();
        const warpFactor = 3;
        const yMult = 1 + (warpFactor - 1) * warpLevel;

        // Update power-up positions and check for collection
        for (let i = powerUps.length - 1; i >= 0; i--) {
            const powerUp = powerUps[i];
            
            // Check if magwave is active and affects the power-up
            if ((InputSystem.isDownPressed() || InputSystem.isLeftTouchActive()) && 
                DustSystem.getMwEnergy() > 0 && !DockingSystem.isDocking()) {
                
                // Get the hero and magwave properties
                const hero = ShipSystem.hero;
                const mwRange = DustSystem.getMwRange();
                
                // Calculate if power-up is within range of the magwave
                const inUpperRight = 
                    powerUp.x > hero.tipX &&
                    powerUp.x < (hero.tipX + mwRange) &&
                    powerUp.y < hero.tipY - hero.height &&
                    powerUp.y > (hero.tipY - hero.height - mwRange);
                
                const inLowerRight = 
                    powerUp.x > hero.tipX &&
                    powerUp.x < (hero.tipX + mwRange) &&
                    powerUp.y > hero.tipY - hero.height;
                
                const inUpperLeft = 
                    powerUp.x < hero.tipX &&
                    powerUp.x > (hero.tipX - mwRange) &&
                    powerUp.y < hero.tipY - hero.height &&
                    powerUp.y > (hero.tipY - hero.height - mwRange);
                
                const inLowerLeft = 
                    powerUp.x < hero.tipX &&
                    powerUp.x > (hero.tipX - mwRange) &&
                    powerUp.y > hero.tipY - hero.height;
                
                // Apply movement based on quadrant (same logic as dust)
                if (inUpperRight) {
                    // Upper right quadrant
                    powerUp.x -= 4;
                    powerUp.y += 6 * yMult;
                } else if (inLowerRight) {
                    // Lower right quadrant
                    powerUp.x -= 4;
                    powerUp.y -= 6 * yMult;
                } else if (inUpperLeft) {
                    // Upper left quadrant
                    powerUp.x += 4;
                    powerUp.y += 6 * yMult;
                } else if (inLowerLeft) {
                    // Lower left quadrant
                    powerUp.x += 4;
                    powerUp.y -= 6 * yMult;
                } else {
                    // Normal movement
                    powerUp.y += powerUp.velocity * yMult;
                    powerUp.x += powerUp.driftX;
                    // Apply oscillating motion if enabled
                    if (powerUp.oscillate) {
                        powerUp.x += Math.sin(powerUp.age * powerUp.oscillationSpeed) 
                                   * Math.cos(powerUp.age * powerUp.oscillationSpeed * 0.5)
                                   * powerUp.oscillationAmount * 0.05;
                    }
                }
                
                // Check for collection with magwave (similar to dust)
                if (powerUp.x <= hero.tipX + 3 &&
                    powerUp.x >= hero.tipX - DustSystem.magWave.radius - powerUp.width &&
                    powerUp.x <= hero.tipX + DustSystem.magWave.radius + powerUp.width &&
                    powerUp.y >= hero.tipY - hero.height - DustSystem.magWave.radius &&
                    powerUp.y <= hero.tipY - hero.height + DustSystem.magWave.radius) {
                    
                    // Apply power-up effect
                    POWER_UP_TYPES[powerUp.type].apply();
                    
                    // Safely flash notification on screen
                    if (GameState && typeof GameState.showNotification === 'function') {
                        GameState.showNotification("Power-up: " + powerUp.type + " activated!");
                    }
                    
                    // Remove power-up
                    powerUps.splice(i, 1);
                    powerUpPool.recycle(powerUp);
                    continue;
                }
            } else {
                // Normal movement when magwave is not affecting the power-up
                powerUp.y += powerUp.velocity * yMult;
                powerUp.x += powerUp.driftX;
                // Apply oscillating motion if enabled
                if (powerUp.oscillate) {
                    powerUp.x += Math.sin(powerUp.age * powerUp.oscillationSpeed) 
                               * Math.cos(powerUp.age * powerUp.oscillationSpeed * 0.5)
                               * powerUp.oscillationAmount * 0.05;
                }
            }
            
            // Keep within screen bounds horizontally
            const canvas = GameState.getCanvas();
            if (powerUp.x < 0) {
                powerUp.x = 0;
                powerUp.driftX *= -0.8; // Bounce off left edge with damping
            } else if (powerUp.x > canvas.width - powerUp.width) {
                powerUp.x = canvas.width - powerUp.width;
                powerUp.driftX *= -0.8; // Bounce off right edge with damping
            }
            
            // Increase age
            powerUp.age++;
            
            // Remove if off-screen or too old
            if (powerUp.y > GameState.getCanvas().height || powerUp.age >= powerUp.maxAge) {
                powerUps.splice(i, 1);
                powerUpPool.recycle(powerUp);
                continue;
            }
            
            // Check if hero collected the power-up through direct collision
            if (CollisionSystem.isColliding(
                powerUp.x, powerUp.y, powerUp.width, powerUp.height,
                ShipSystem.hero.leftX, ShipSystem.hero.tipY, ShipSystem.hero.width, ShipSystem.hero.height
            )) {
                // Apply power-up effect
                POWER_UP_TYPES[powerUp.type].apply();
                
                // Safely flash notification on screen
                if (GameState && typeof GameState.showNotification === 'function') {
                    GameState.showNotification("Power-up: " + powerUp.type + " activated!");
                }
                
                // Remove power-up
                powerUps.splice(i, 1);
                powerUpPool.recycle(powerUp);
            }
        }
    }
    
    /**
     * Draw all power-ups
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    function draw(ctx) {
        // Draw power-ups
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "16px Arial";
        
        for (let i = 0; i < powerUps.length; i++) {
            const powerUp = powerUps[i];
            const type = POWER_UP_TYPES[powerUp.type];
            
            // Make power-ups blink when about to expire
            if (powerUp.age > powerUp.maxAge - 60 && powerUp.age % 10 > 5) {
                continue; // Skip drawing to create blinking effect
            }
            
            // Add glowing effect to make power-ups more visible
            ctx.save();
            
            // Outer glow
            const glowSize = 5 + Math.sin(powerUp.age * 0.1) * 2; // Pulsing glow
            ctx.beginPath();
            ctx.arc(
                powerUp.x + powerUp.width / 2,
                powerUp.y + powerUp.height / 2,
                powerUp.width / 2 + glowSize,
                0, Math.PI * 2
            );
            ctx.fillStyle = type.color + "33"; // Add alpha for transparency
            ctx.fill();
            
            // Draw power-up background (circle)
            ctx.beginPath();
            ctx.arc(
                powerUp.x + powerUp.width / 2,
                powerUp.y + powerUp.height / 2,
                powerUp.width / 2,
                0, Math.PI * 2
            );
            ctx.fillStyle = type.color;
            ctx.fill();
            
            // Add highlight
            ctx.beginPath();
            ctx.arc(
                powerUp.x + powerUp.width / 2 - powerUp.width * 0.2,
                powerUp.y + powerUp.height / 2 - powerUp.height * 0.2,
                powerUp.width * 0.15,
                0, Math.PI * 2
            );
            ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
            ctx.fill();
            
            // Draw power-up symbol
            ctx.fillStyle = "#FFFFFF";
            ctx.fillText(
                type.symbol,
                powerUp.x + powerUp.width / 2,
                powerUp.y + powerUp.height / 2
            );
            
            ctx.restore();
        }
        
        // Draw shield effect if active
        if (shieldActive) {
            ctx.beginPath();
            ctx.arc(
                ShipSystem.hero.tipX,
                ShipSystem.hero.tipY,
                ShipSystem.hero.width,
                0, Math.PI * 2
            );
            // Pulse opacity based on remaining duration
            const opacity = 0.3 + 0.2 * Math.sin(GameState.getFrameCount() / 5);
            ctx.fillStyle = `rgba(51, 153, 255, ${opacity})`;
            ctx.fill();
            
            ctx.lineWidth = 2;
            ctx.strokeStyle = "#3399FF";
            ctx.stroke();
        }
    }
    
    /**
     * Move power-ups horizontally (for shift-move)
     * @param {number} dx - Distance to move
     */
    function movePowerUpsX(dx) {
        for (let i = 0; i < powerUps.length; i++) {
            powerUps[i].x += dx;
        }
    }
    
    // Public API
    return {
        init: init,
        update: update,
        draw: draw,
        spawnPowerUp: spawnPowerUp,
        movePowerUpsX: movePowerUpsX,
        resetAllPowerUps: resetAllPowerUps,
        // Getters for power-up states
        isShieldActive: function() { return shieldActive; },
        isRapidFireActive: function() { return rapidFireActive; },
        isMultiShotActive: function() { return multiShotActive; },
        getMultiShotCount: function() { return multiShotCount; },
        getFireRate: function() { return fireRate; }
    };
})();