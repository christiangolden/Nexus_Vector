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
    
    // Add dynamic movement patterns for the enemy
    let enemyMovementPattern = "zigzag"; // Default movement pattern
    let zigzagDirection = 1; // 1 for right, -1 for left

    function updateEnemyMovement() {
        const canvas = Game.getCanvas();

        switch (enemyMovementPattern) {
            case "zigzag":
                badguy.tipX += zigzagDirection * 3; // Move horizontally
                badguy.tipY += 5; // Move downward

                // Reverse direction if hitting canvas edges
                if (badguy.tipX <= 0 || badguy.tipX >= canvas.width) {
                    zigzagDirection *= -1;
                }
                break;

            case "random":
                badguy.tipX += (Math.random() - 0.5) * 10; // Random horizontal movement
                badguy.tipY += 5; // Move downward
                break;

            default:
                badguy.tipY += 7; // Default downward movement
                break;
        }

        // Reset enemy if it goes off screen
        if (badguy.tipY > canvas.height + badguy.height) {
            badguy = new Ship("down", 20, 40, Math.floor(Math.random() * canvas.width), 0);
        }
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

        // Apply dynamic movement
        updateEnemyMovement();

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

    // Define enemy types with movement and shooting patterns
    const enemyTypes = [
        {
            type: "basic",
            movement: "wave",
            shootCooldown: 100,
            bulletPattern: "straight"
        },
        {
            type: "sniper",
            movement: "linear",
            shootCooldown: 200,
            bulletPattern: "aimed"
        },
        {
            type: "swarm",
            movement: "zigzag",
            shootCooldown: 150,
            bulletPattern: "spread"
        }
    ];

    // Array to hold active enemies
    let activeEnemies = [];
    let enemySpawnCooldown = 0;

    function spawnEnemy() {
        const canvas = Game.getCanvas();
        const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        const newEnemy = {
            ...enemyType,
            ship: new Ship("down", 20, 40, Math.random() * canvas.width, -40),
            shootTimer: 0
        };
        activeEnemies.push(newEnemy);
    }

    // Add difficulty scaling for enemies
    let enemySpeed = 5;
    let enemySpawnCooldownReduction = 0;

    function increaseEnemySpeed(amount) {
        enemySpeed += amount;
    }

    function decreaseEnemySpawnCooldown(amount) {
        enemySpawnCooldownReduction += amount;
    }

    function updateEnemyMovements() {
        const canvas = Game.getCanvas();

        activeEnemies.forEach((enemy, index) => {
            const { movement, ship } = enemy;

            switch (movement) {
                case "wave":
                    ship.tipX += Math.sin(Game.getFrameCount() / 20) * 5;
                    ship.tipY += enemySpeed;
                    break;

                case "linear":
                    ship.tipY += enemySpeed;
                    break;

                case "zigzag":
                    ship.tipX += zigzagDirection * 3;
                    ship.tipY += enemySpeed;
                    if (ship.tipX <= 0 || ship.tipX >= canvas.width) {
                        zigzagDirection *= -1;
                    }
                    break;
            }

            // Remove enemies that go off-screen
            if (ship.tipY > canvas.height + ship.height) {
                activeEnemies.splice(index, 1);
                // Increment XP by 10 when an enemy is killed
                Game.gainXP(10);
            }
        });
    }

    function updateEnemyShooting(ctx) {
        activeEnemies.forEach(enemy => {
            if (enemy.shootTimer <= 0) {
                switch (enemy.bulletPattern) {
                    case "straight":
                        BulletSystem.spawnBullet(enemy.ship.tipX, enemy.ship.tipY, 0, 10, "enemy");
                        break;

                    case "aimed":
                        const angle = Math.atan2(ShipSystem.hero.tipY - enemy.ship.tipY, ShipSystem.hero.tipX - enemy.ship.tipX);
                        BulletSystem.spawnBullet(enemy.ship.tipX, enemy.ship.tipY, Math.cos(angle) * 10, Math.sin(angle) * 10, "enemy");
                        break;

                    case "spread":
                        for (let i = -1; i <= 1; i++) {
                            BulletSystem.spawnBullet(enemy.ship.tipX, enemy.ship.tipY, i * 5, 10, "enemy");
                        }
                        break;
                }
                enemy.shootTimer = enemy.shootCooldown;
            } else {
                enemy.shootTimer--;
            }
        });
    }

    function drawEnemies(ctx) {
        activeEnemies.forEach(enemy => {
            const { ship } = enemy;
            ship.leftY = ship.tipY - ship.height;
            ship.rightY = ship.tipY - ship.height;
            ship.leftX = ship.tipX - 10;
            ship.rightX = ship.tipX + 10;

            ctx.beginPath();
            ctx.moveTo(ship.tipX, ship.tipY);
            ctx.lineTo(ship.rightX, ship.rightY);
            ctx.lineTo(ship.leftX, ship.leftY);
            ctx.lineTo(ship.tipX, ship.tipY);
            ctx.fillStyle = ColorUtils.randRGB();
            ctx.fill();
            ctx.closePath();
        });
    }

    function updateEnemySpawning() {
        if (enemySpawnCooldown <= 0) {
            spawnEnemy();
            enemySpawnCooldown = Math.random() * 100 + 50 - enemySpawnCooldownReduction; // Adjust spawn interval
        } else {
            enemySpawnCooldown--;
        }
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
        resetEnemy: resetEnemy,
        updateEnemyMovements: updateEnemyMovements,
        updateEnemyShooting: updateEnemyShooting,
        drawEnemies: drawEnemies,
        updateEnemySpawning: updateEnemySpawning,
        increaseEnemySpeed: increaseEnemySpeed,
        decreaseEnemySpawnCooldown: decreaseEnemySpawnCooldown
    };
})();