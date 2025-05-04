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
                Game.setHeroDead(true);
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
        const canvas = Game.getCanvas();
        hero = new Ship("up", 20, 40, canvas.width / 2, canvas.height - 50);
        // Initialize enemy array and cooldown
        activeEnemies = [];
        enemySpawnCooldown = baseSpawnInterval; 
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
    
    // Remove old single enemy functions: updateEnemyMovement, drawEnemy

    /**
     * Spawns a new enemy of a random type.
     */
    function spawnEnemy() {
        const canvas = Game.getCanvas();
        // Select a random enemy type
        const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        
        // Create the new enemy object
        const newEnemy = {
            ...enemyType, // Copy properties from the type definition
            ship: new Ship("down", 20, 40, Math.random() * canvas.width, -40), // Spawn above screen
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
            const formationChance = Math.min(0.1 + (Game.level * 0.05), 0.5); // Cap at 50%
            
            if (Math.random() < formationChance) {
                spawnFormation();
            } else {
                spawnEnemy();
            }
            
            // Reset cooldown with some randomness, adjusted by difficulty
            enemySpawnCooldown = baseSpawnInterval + (Math.random() * 50 - 25) - (Game.level * 5); 
            if (enemySpawnCooldown < 30) enemySpawnCooldown = 30; // Minimum spawn time
        } else {
            enemySpawnCooldown--;
        }
    }
    
    /**
     * Spawns a formation of enemies based on predefined patterns.
     */
    function spawnFormation() {
        const canvas = Game.getCanvas();
        
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
        if (Game.level >= 3) possibleTypes.push("tracker");
        if (Game.level >= 5) possibleTypes.push("zigzag");
        if (Game.level >= 7) possibleTypes.push("sniper");
        
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
                ship: new Ship("down", 20, 40, baseX + pos.x, baseY + pos.y),
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
        const canvas = Game.getCanvas();
        const playerX = hero.tipX; // Get player X for tracking enemies

        // Update spawning
        updateEnemySpawning();

        // Update movement and shooting for each enemy
        for (let i = activeEnemies.length - 1; i >= 0; i--) {
            const enemy = activeEnemies[i];
            const { ship, movement, formation } = enemy;

            // --- Update Movement ---
            let targetSpeed = enemySpeed + (Game.level * 0.5); // Increase speed with level
            
            // Special formation movement behaviors
            if (formation) {
                // Formation enemies move more as a unit
                switch(formation) {
                    case "arrow":
                        // Arrow formation sways side to side as it descends
                        ship.tipX += Math.sin(ship.tipY / 80) * 2;
                        ship.tipY += targetSpeed * 0.9; // Slightly slower
                        break;
                    case "line":
                        // Line formation moves in a wave pattern
                        ship.tipX += Math.sin(ship.tipY / 60) * 3;
                        ship.tipY += targetSpeed * 0.85;
                        break;
                    case "box":
                        // Box formation moves straight down but slower
                        ship.tipY += targetSpeed * 0.7;
                        break;
                    case "diamond":
                        // Diamond formation moves in a tighter wave pattern
                        ship.tipX += Math.sin(ship.tipY / 40) * 2;
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
                        ship.tipX += Math.sin(ship.tipY / 50) * 3; 
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
            enemy.shootTimer--;
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
                activeEnemies.splice(i, 1);
            }
        }
    }

    /**
     * Draws all active enemy ships.
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    function drawEnemies(ctx) {
        activeEnemies.forEach(enemy => {
            const { ship } = enemy;
            
            // Draw enemy ship
            ctx.beginPath();
            ctx.moveTo(ship.tipX, ship.tipY);
            ctx.lineTo(ship.rightX, ship.rightY);
            ctx.lineTo(ship.leftX, ship.leftY);
            ctx.lineTo(ship.tipX, ship.tipY);
            ctx.fillStyle = ColorUtils.randRGB(); // Keep the flashy colors for now
            ctx.fill();
            ctx.closePath();
        });
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
            activeEnemies.forEach(enemy => {
                enemy.ship.leftX -= speed;
                enemy.ship.rightX -= speed;
                enemy.ship.tipX -= speed;
            });
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
            activeEnemies.forEach(enemy => {
                enemy.ship.leftX += speed;
                enemy.ship.rightX += speed;
                enemy.ship.tipX += speed;
            });
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
        // This function is effectively handled within updateEnemySpawning using Game.level
        // We can keep it for potential direct adjustments or remove it.
        // Let's adjust baseSpawnInterval slightly instead.
        baseSpawnInterval -= amount;
        if (baseSpawnInterval < 50) baseSpawnInterval = 50; // Minimum base interval
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
        checkHeroCollisions: checkHeroCollisions, // Add this line
        resetEnemy: resetEnemy,
        increaseEnemySpeed: increaseEnemySpeed,
        decreaseEnemySpawnCooldown: decreaseEnemySpawnCooldown
    };
})();