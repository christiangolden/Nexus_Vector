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

    /**
     * Checks for collisions between the hero and any active enemy ships.
     * Sets the heroDead flag in the Game module if a collision occurs.
     */
    function checkHeroCollisions() {
        if (!hero) return; // Ensure hero exists

        for (let i = activeEnemies.length - 1; i >= 0; i--) {
            const enemy = activeEnemies[i].ship;
            
            if (CollisionSystem.isColliding(
                hero.leftX, hero.tipY, 
                hero.width, hero.height,
                enemy.leftX, enemy.leftY, // Use enemy's bounding box
                enemy.width, enemy.tipY - enemy.leftY // Height of the enemy ship
            )) {
                GameState.setHeroDead(true);
                // Optional: Destroy the enemy ship on collision?
                // activeEnemies.splice(i, 1); 
                break; // No need to check further if hero is dead
            }
        }
    }
    
    // Create hero ship
    let hero = null;
    // Remove single badguy variable
    // let badguy = null; 

    // Array to hold active enemies
    let activeEnemies = [];
    let enemySpawnCooldown = 100; // Initial cooldown
    let baseSpawnInterval = 150; // Base interval between spawns
    let enemySpeed = 5; // Base speed for enemies
    let zigzagDirection = 1; // Shared zigzag direction for simplicity

    /**
     * Ship object pool for efficient object reuse
     */
    const shipPool = {
        pool: [],
        maxSize: 30,
        
        init: function() {
            for (let i = 0; i < this.maxSize; i++) {
                this.pool.push(new Ship("down", 20, 40, 0, 0));
            }
        },
        
        get: function(orientation, width, height, tipX, tipY) {
            if (this.pool.length > 0) {
                const ship = this.pool.pop();
                // Reset ship properties
                ship.orientation = orientation;
                ship.width = width;
                ship.height = height;
                ship.tipX = tipX;
                ship.tipY = tipY;
                ship.rightX = ship.tipX + ship.width / 2;
                ship.leftX = ship.tipX - ship.width / 2;
                
                if (orientation === "up") {
                    ship.rightY = ship.tipY + ship.height;
                    ship.leftY = ship.tipY + ship.height;
                } else {
                    ship.rightY = ship.tipY - ship.height;
                    ship.leftY = ship.tipY - ship.height;
                }
                return ship;
            }
            return new Ship(orientation, width, height, tipX, tipY);
        },
        
        recycle: function(ship) {
            if (this.pool.length < this.maxSize) {
                this.pool.push(ship);
            }
        }
    };

    // Define enemy types with movement and shooting patterns
    const enemyTypes = [
        {
            type: "basic",
            movement: "wave", // Sinusoidal movement
            shootCooldownMax: 120, // Frames between shots
            bulletPattern: "straight"
        },
        {
            type: "tracker",
            movement: "track", // Tries to align horizontally with player
            shootCooldownMax: 90,
            bulletPattern: "straight"
        },
        {
            type: "zigzag",
            movement: "zigzag", // Zigzag pattern
            shootCooldownMax: 150,
            bulletPattern: "spread" // Shoots three bullets
        },
        {
            type: "sniper",
            movement: "linear", // Moves straight down
            shootCooldownMax: 200,
            bulletPattern: "aimed" // Aims at the player
        }
    ];
    
    // Define formation patterns
    const formationPatterns = [
        {
            name: "arrow",
            positions: [
                {x: 0, y: 0},     // Leader
                {x: -40, y: 30},  // Left wing
                {x: 40, y: 30}    // Right wing
            ],
            probability: 0.3      // 30% chance when formation spawns
        },
        {
            name: "line",
            positions: [
                {x: -60, y: 0},
                {x: -20, y: 0},
                {x: 20, y: 0},
                {x: 60, y: 0}
            ],
            probability: 0.3      // 30% chance when formation spawns
        },
        {
            name: "box",
            positions: [
                {x: -30, y: 0},
                {x: 30, y: 0},
                {x: -30, y: 50},
                {x: 30, y: 50}
            ],
            probability: 0.2      // 20% chance when formation spawns
        },
        {
            name: "diamond",
            positions: [
                {x: 0, y: -30},
                {x: -40, y: 20},
                {x: 40, y: 20},
                {x: 0, y: 70}
            ],
            probability: 0.2      // 20% chance when formation spawns
        }
    ];

    /**
     * Initialize ship objects
     */
    function init() {
        const canvas = GameState.getCanvas();
        hero = new Ship("up", 20, 40, canvas.width / 2, canvas.height - 50);
        // Initialize enemy array and cooldown
        activeEnemies = [];
        enemySpawnCooldown = baseSpawnInterval; 
        shipPool.init(); // Initialize the ship pool
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
                GameState.incrementDestDust();
                GameState.setHeroDead(true);
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
    
    // Remove old single enemy functions: updateEnemyMovement, drawEnemy

    /**
     * Spawns a new enemy of a random type.
     */
    function spawnEnemy() {
        const canvas = GameState.getCanvas();
        // Select a random enemy type
        const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        
        // Create the new enemy object using pool
        const newEnemy = {
            ...enemyType, // Copy properties from the type definition
            ship: shipPool.get("down", 20, 40, Math.random() * canvas.width, -40), // Use pool to get ship
            shootTimer: Math.random() * enemyType.shootCooldownMax // Random initial cooldown
        };
        activeEnemies.push(newEnemy);
    }

    /**
     * Updates the spawning of enemies based on cooldown.
     */
    function updateEnemySpawning() {
        if (enemySpawnCooldown <= 0) {
            // Chance to spawn a formation instead of single enemy
            // Formation chance increases with level
            const formationChance = Math.min(0.1 + (GameState.getLevel() * 0.05), 0.5); // Cap at 50%
            
            if (Math.random() < formationChance) {
                spawnFormation();
            } else {
                spawnEnemy();
            }
            
            // Reset cooldown with some randomness, adjusted by difficulty
            enemySpawnCooldown = baseSpawnInterval + (Math.random() * 50 - 25) - (GameState.getLevel() * 5); 
            if (enemySpawnCooldown < 30) enemySpawnCooldown = 30; // Minimum spawn time
        } else {
            enemySpawnCooldown--;
        }
    }
    
    /**
     * Spawns a formation of enemies based on predefined patterns.
     */
    function spawnFormation() {
        const canvas = GameState.getCanvas();
        
        // Pick a random formation based on probability weights
        let total = 0;
        for (const pattern of formationPatterns) {
            total += pattern.probability;
        }
        
        let random = Math.random() * total;
        let selectedPattern = formationPatterns[0]; // Default
        
        // Select pattern based on random weighted value
        for (const pattern of formationPatterns) {
            random -= pattern.probability;
            if (random <= 0) {
                selectedPattern = pattern;
                break;
            }
        }
        
        // Base enemy type for the formation
        // Choose more advanced enemy types for higher levels
        let possibleTypes = ["basic"];
        const currentLevel = GameState.getLevel();
        if (currentLevel >= 3) possibleTypes.push("tracker");
        if (currentLevel >= 5) possibleTypes.push("zigzag");
        if (currentLevel >= 7) possibleTypes.push("sniper");
        
        const baseType = enemyTypes.find(t => 
            t.type === possibleTypes[Math.floor(Math.random() * possibleTypes.length)]
        );
        
        // Base position for the formation (center of canvas, above top)
        const baseX = canvas.width / 2;
        const baseY = -60; // Above the visible area
        
        // Create enemies in formation
        for (const pos of selectedPattern.positions) {
            // Slight variations for natural appearance
            const enemyType = {...baseType}; 
            
            // For visual variations, could slightly modify color, size, etc.
            const newEnemy = {
                ...enemyType,
                ship: shipPool.get("down", 20, 40, baseX + pos.x, baseY + pos.y),
                shootTimer: Math.random() * enemyType.shootCooldownMax,
                formation: selectedPattern.name // Mark as part of formation
            };
            
            activeEnemies.push(newEnemy);
        }
    }

    /**
     * Updates the position and state of all active enemies.
     */
    function updateEnemies() {
        const canvas = GameState.getCanvas();
        const playerX = hero.tipX; // Get player X for tracking enemies
        const deltaTime = GameState.getDeltaTime();
        // Scale for frame rate independence - use 60fps as baseline
        const timeScale = 60 * deltaTime;

        // Update spawning
        updateEnemySpawning();

        // Update movement and shooting for each enemy
        for (let i = activeEnemies.length - 1; i >= 0; i--) {
            const enemy = activeEnemies[i];
            const { ship, movement, formation } = enemy;

            // --- Update Movement ---
            let targetSpeed = (enemySpeed + (GameState.getLevel() * 0.5)) * timeScale; // Scale by deltaTime for frame rate independence
            
            // Special formation movement behaviors
            if (formation) {
                // Formation enemies move more as a unit
                switch(formation) {
                    case "arrow":
                        // Arrow formation sways side to side as it descends
                        ship.tipX += Math.sin(ship.tipY / 80) * 2 * timeScale;
                        ship.tipY += targetSpeed * 0.9; // Slightly slower
                        break;
                    case "line":
                        // Line formation moves in a wave pattern
                        ship.tipX += Math.sin(ship.tipY / 60) * 3 * timeScale;
                        ship.tipY += targetSpeed * 0.85;
                        break;
                    case "box":
                        // Box formation moves straight down but slower
                        ship.tipY += targetSpeed * 0.7;
                        break;
                    case "diamond":
                        // Diamond formation moves in a tighter wave pattern
                        ship.tipX += Math.sin(ship.tipY / 40) * 2 * timeScale;
                        ship.tipY += targetSpeed * 0.75;
                        break;
                    default:
                        ship.tipY += targetSpeed;
                }
            } else {
                // Regular individual enemy movement
                switch (movement) {
                    case "wave":
                        // Moves down in a sine wave pattern
                        ship.tipX += Math.sin(ship.tipY / 50) * 3 * timeScale; 
                        ship.tipY += targetSpeed * 0.8; // Slightly slower
                        break;
                    case "track":
                        // Tries to move towards player's X position
                        if (ship.tipX < playerX - 10) ship.tipX += targetSpeed * 0.5;
                        else if (ship.tipX > playerX + 10) ship.tipX -= targetSpeed * 0.5;
                        ship.tipY += targetSpeed;
                        break;
                    case "zigzag":
                        // Moves down in a zigzag pattern
                        ship.tipX += zigzagDirection * targetSpeed * 0.7;
                        ship.tipY += targetSpeed;
                        // Reverse direction at edges
                        if (ship.tipX <= 0 || ship.tipX >= canvas.width) {
                            zigzagDirection *= -1; 
                        }
                        break;
                    case "linear":
                    default:
                        // Moves straight down
                        ship.tipY += targetSpeed;
                        break;
                }
            }

            // Keep enemy within horizontal bounds (mostly for wave/zigzag)
            if (ship.tipX < 0) ship.tipX = 0;
            if (ship.tipX > canvas.width) ship.tipX = canvas.width;

            // Update ship coordinates
            ship.leftY = ship.tipY - ship.height;
            ship.rightY = ship.tipY - ship.height;
            ship.leftX = ship.tipX - 10; // Assuming width is 20
            ship.rightX = ship.tipX + 10;
            ship.width = ship.rightX - ship.leftX;


            // --- Update Shooting ---
            // Scale shooting timer by delta time to maintain consistent fire rate
            enemy.shootTimer -= timeScale;
            if (enemy.shootTimer <= 0 && ship.tipY > 0) { // Only shoot if on screen
                const { bulletPattern } = enemy;
                switch (bulletPattern) {
                    case "aimed":
                        const angle = Math.atan2(hero.tipY - ship.tipY, hero.tipX - ship.tipX);
                        const bulletSpeed = 8;
                        BulletSystem.spawnBullet(ship.tipX, ship.tipY, Math.cos(angle) * bulletSpeed, Math.sin(angle) * bulletSpeed, "enemy");
                        break;
                    case "spread":
                        BulletSystem.spawnBullet(ship.tipX, ship.tipY, -3, 7, "enemy");
                        BulletSystem.spawnBullet(ship.tipX, ship.tipY, 0, 10, "enemy");
                        BulletSystem.spawnBullet(ship.tipX, ship.tipY, 3, 7, "enemy");
                        break;
                    case "straight":
                    default:
                        BulletSystem.spawnBullet(ship.tipX, ship.tipY, 0, 10, "enemy");
                        break;
                }
                // Reset cooldown with slight variation
                enemy.shootTimer = enemy.shootCooldownMax + (Math.random() * 20 - 10); 
            }

            // --- Remove enemies that go off-screen ---
            if (ship.tipY > canvas.height + ship.height) {
                shipPool.recycle(ship); // Recycle the ship object
                activeEnemies.splice(i, 1);
            }
        }
    }
    
    /**
     * Removes an enemy from the active enemies array and handles related effects.
     * @param {number} index - The index of the enemy in the activeEnemies array
     * @param {boolean} wasDestroyed - Whether the enemy was destroyed (true) or just went off-screen (false)
     */
    function removeEnemy(index, wasDestroyed) {
        if (index < 0 || index >= activeEnemies.length) return;
        
        const enemy = activeEnemies[index];
        
        if (wasDestroyed) {
            // Chance to spawn power-up when enemy is destroyed
            // More advanced enemies have higher chance of dropping power-ups
            // Increased base chance from 5% to 15%
            let dropChance = 0.15; // Base 15% chance (was 5%)
            
            switch (enemy.type) {
                case "tracker":
                    dropChance = 0.25; // 25% chance (was 10%)
                    break;
                case "zigzag":
                    dropChance = 0.35; // 35% chance (was 15%)
                    break;
                case "sniper":
                    dropChance = 0.45; // 45% chance (was 20%)
                    break;
            }
            
            // Formation enemies have higher drop chance (increased from 5% to 15%)
            if (enemy.formation) dropChance += 0.15;
            
            // Attempt to spawn power-up
            if (PowerUpSystem && Math.random() < dropChance) {
                PowerUpSystem.spawnPowerUp(enemy.ship.tipX, enemy.ship.tipY);
            }
            
            // Award XP for destroying the enemy
            GameState.gainXp(10);
        }
        
        // Recycle the ship object
        shipPool.recycle(enemy.ship);
        
        // Remove the enemy from the array
        activeEnemies.splice(index, 1);
    }

    /**
     * Draws all active enemy ships with visual distinctions based on type.
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    function drawEnemies(ctx) {
        activeEnemies.forEach(enemy => {
            const { ship, type, formation } = enemy;
            
            // Define colors based on enemy type
            let fillColor;
            switch (type) {
                case "basic":
                    fillColor = "#FF5555"; // Red
                    break;
                case "tracker":
                    fillColor = "#55FF55"; // Green
                    break;
                case "zigzag":
                    fillColor = "#5555FF"; // Blue
                    break;
                case "sniper":
                    fillColor = "#FFFF55"; // Yellow
                    break;
                default:
                    fillColor = ColorUtils.randRGB(); // Fallback
            }
            
            // Add slight pulsing effect for formation ships
            if (formation) {
                const pulse = 1 + Math.sin(GameState.getFrameCount() / 10) * 0.1;
                ctx.save();
                ctx.translate(ship.tipX, ship.tipY);
                ctx.scale(pulse, pulse);
                ctx.translate(-ship.tipX, -ship.tipY);
            }
            
            // Draw enemy ship based on type
            switch (type) {
                case "basic":
                    // Triangle ship (default shape)
                    ctx.beginPath();
                    ctx.moveTo(ship.tipX, ship.tipY);
                    ctx.lineTo(ship.rightX, ship.rightY);
                    ctx.lineTo(ship.leftX, ship.leftY);
                    ctx.closePath();
                    ctx.fillStyle = fillColor;
                    ctx.fill();
                    break;
                    
                case "tracker":
                    // Diamond shape
                    ctx.beginPath();
                    const halfHeight = (ship.tipY - ship.leftY) / 2;
                    ctx.moveTo(ship.tipX, ship.tipY);
                    ctx.lineTo(ship.tipX + ship.width / 2, ship.tipY - halfHeight);
                    ctx.lineTo(ship.tipX, ship.tipY - ship.height);
                    ctx.lineTo(ship.tipX - ship.width / 2, ship.tipY - halfHeight);
                    ctx.closePath();
                    ctx.fillStyle = fillColor;
                    ctx.fill();
                    
                    // Add targeting sight
                    ctx.beginPath();
                    ctx.arc(ship.tipX, ship.tipY, 5, 0, Math.PI * 2);
                    ctx.strokeStyle = "#FFFFFF";
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    break;
                    
                case "zigzag":
                    // Box with fins
                    ctx.beginPath();
                    ctx.rect(ship.leftX, ship.leftY, ship.width, ship.height);
                    ctx.fillStyle = fillColor;
                    ctx.fill();
                    
                    // Fins
                    ctx.beginPath();
                    ctx.moveTo(ship.leftX, ship.leftY);
                    ctx.lineTo(ship.leftX - 5, ship.leftY + 10);
                    ctx.lineTo(ship.leftX, ship.leftY + 20);
                    ctx.closePath();
                    ctx.fill();
                    
                    ctx.beginPath();
                    ctx.moveTo(ship.rightX, ship.rightY);
                    ctx.lineTo(ship.rightX + 5, ship.rightY + 10);
                    ctx.lineTo(ship.rightX, ship.rightY + 20);
                    ctx.closePath();
                    ctx.fill();
                    break;
                    
                case "sniper":
                    // Long, narrow design with targeting laser
                    ctx.beginPath();
                    ctx.rect(ship.tipX - 5, ship.leftY, 10, ship.height);
                    ctx.fillStyle = fillColor;
                    ctx.fill();
                    
                    // Wings
                    ctx.beginPath();
                    ctx.moveTo(ship.tipX, ship.leftY);
                    ctx.lineTo(ship.tipX - 15, ship.leftY);
                    ctx.lineTo(ship.tipX - 10, ship.leftY + 10);
                    ctx.closePath();
                    ctx.fill();
                    
                    ctx.beginPath();
                    ctx.moveTo(ship.tipX, ship.leftY);
                    ctx.lineTo(ship.tipX + 15, ship.leftY);
                    ctx.lineTo(ship.tipX + 10, ship.leftY + 10);
                    ctx.closePath();
                    ctx.fill();
                    
                    // Targeting laser (only for snipers)
                    if (enemy.shootTimer < 30) { // Show laser when about to fire
                        ctx.beginPath();
                        ctx.moveTo(ship.tipX, ship.tipY);
                        
                        // Calculate angle to hero
                        const angle = Math.atan2(ShipSystem.hero.tipY - ship.tipY, 
                                               ShipSystem.hero.tipX - ship.tipX);
                        
                        // Draw line in direction of hero
                        const laserLength = Math.min(100, 
                                                   ShipSystem.hero.tipY - ship.tipY);
                        ctx.lineTo(
                            ship.tipX + Math.cos(angle) * laserLength,
                            ship.tipY + Math.sin(angle) * laserLength
                        );
                        
                        ctx.strokeStyle = "#FF0000";
                        ctx.lineWidth = 1;
                        ctx.globalAlpha = 0.7;
                        ctx.stroke();
                        ctx.globalAlpha = 1;
                    }
                    break;
                    
                default:
                    // Fallback to basic triangle
                    ctx.beginPath();
                    ctx.moveTo(ship.tipX, ship.tipY);
                    ctx.lineTo(ship.rightX, ship.rightY);
                    ctx.lineTo(ship.leftX, ship.leftY);
                    ctx.closePath();
                    ctx.fillStyle = fillColor;
                    ctx.fill();
            }
            
            // Add highlight for formation ships
            if (formation) {
                ctx.strokeStyle = "#FFFFFF";
                ctx.lineWidth = 1.5;
                ctx.stroke(); // Outline the current path
                ctx.restore(); // Restore canvas state from pulsing effect
            }
        });
    }
    
    /**
     * Move hero ship right
     */
    function moveHeroRight() {
        const canvas = GameState.getCanvas();
        const speed = GameState.getSpeed();
        const deltaTime = GameState.getDeltaTime();
        // Use delta time to make movement frame rate independent
        const frameIndependentSpeed = speed * 60 * deltaTime; // Scale to 60 fps baseline
        
        if (InputSystem.isShiftPressed()) {
            // Move background instead of hero (handled in MovementSystem)
            MovementSystem.moveAllX(-frameIndependentSpeed);
        } else {
            // Move hero right
            if (hero.leftX >= canvas.width) {
                // Wrap around screen edge
                hero.tipX -= canvas.width + hero.width;
            } else {
                hero.tipX += frameIndependentSpeed;
            }
        }
    }
    
    /**
     * Move hero ship left
     */
    function moveHeroLeft() {
        const canvas = GameState.getCanvas();
        const speed = GameState.getSpeed();
        const deltaTime = GameState.getDeltaTime();
        // Use delta time to make movement frame rate independent
        const frameIndependentSpeed = speed * 60 * deltaTime; // Scale to 60 fps baseline
        
        if (InputSystem.isShiftPressed()) {
            // Move background instead of hero (handled in MovementSystem)
            MovementSystem.moveAllX(frameIndependentSpeed);
        } else {
            // Move hero left
            if (hero.rightX <= 0) {
                // Wrap around screen edge
                hero.tipX += canvas.width + hero.width;
            } else {
                hero.tipX -= frameIndependentSpeed;
            }
        }
    }
    
    /**
     * Reset all enemies.
     */
    function resetEnemy() {
        activeEnemies = []; // Clear the array
        enemySpawnCooldown = baseSpawnInterval; // Reset spawn timer
    }

    // Add functions for difficulty scaling (already present but ensure they modify correct vars)
    function increaseEnemySpeed(amount) {
        // This function might need adjustment if we want per-enemy-type speed scaling
        // For now, it increases the base speed used by updateEnemies
        enemySpeed += amount; 
    }

    function decreaseEnemySpawnCooldown(amount) {
        // This function is effectively handled within updateEnemySpawning using GameState.level
        // We can keep it for potential direct adjustments or remove it.
        // Let's adjust baseSpawnInterval slightly instead.
        baseSpawnInterval -= amount;
        if (baseSpawnInterval < 50) baseSpawnInterval = 50; // Minimum base interval
    }

    // Utility to get the default Y position for the ship
    function getDefaultShipY(canvas) {
        return canvas.height - ShipSystem.hero.height * 2;
    }
    
    // Public API
    return {
        Ship: Ship,
        init: init,
        get hero() { return hero; },
        get activeEnemies() { return activeEnemies; }, 
        drawHero: drawHero,
        drawEnemies: drawEnemies,
        updateEnemies: updateEnemies, 
        moveHeroRight: moveHeroRight,
        moveHeroLeft: moveHeroLeft,
        checkHeroCollisions: checkHeroCollisions,
        resetEnemy: resetEnemy,
        removeEnemy: removeEnemy, // Export the removeEnemy function
        increaseEnemySpeed: increaseEnemySpeed,
        decreaseEnemySpawnCooldown: decreaseEnemySpawnCooldown,
        getDefaultShipY: getDefaultShipY // Export for use in other modules
    };
})();