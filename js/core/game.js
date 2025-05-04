/**
 * Nexus Vector - Game Core
 * 
 * This module handles the main game loop, initialization, and state management.
 */

const Game = (function() {
    'use strict';
    
    // Private variables
    let canvas;
    let ctx;
    let start = false;
    let deadHero = false;
    let unDeadHero = false;
    let shotDrones = 0;
    let destDust = 0;
    let gamePaused = false;
    let speed = 7;
    let score = 0;
    let frameCount = 0;
    
    // Add XP and leveling system
    let xp = 0;
    let level = 1;
    
    // Notification system
    let notifications = [];
    const NOTIFICATION_DURATION = 90; // 1.5 seconds at 60fps

    /**
     * Show a notification message on screen
     * @param {string} message - The message to display
     */
    function showNotification(message) {
        notifications.push({
            message: message,
            duration: NOTIFICATION_DURATION,
            opacity: 1.0
        });
    }
    
    /**
     * Update and draw notifications
     */
    function updateNotifications() {
        for (let i = notifications.length - 1; i >= 0; i--) {
            const notification = notifications[i];
            
            // Update duration and fade out at the end
            notification.duration--;
            if (notification.duration < 30) {
                notification.opacity = notification.duration / 30;
            }
            
            // Remove expired notifications
            if (notification.duration <= 0) {
                notifications.splice(i, 1);
                continue;
            }
            
            // Draw notification
            ctx.save();
            ctx.textAlign = "center";
            ctx.font = "bold 18px Arial";
            ctx.fillStyle = `rgba(255, 255, 255, ${notification.opacity})`;
            ctx.fillText(
                notification.message,
                canvas.width / 2,
                100 + (i * 30)
            );
            ctx.restore();
        }
    }

    // Fix XP counter to prevent negative values
    function gainXP(amount, isStardust = false) {
        xp += amount;
        if (isStardust) {
            BulletSystem.incrementBulletCount(10); // Add 10 bullets per stardust
        }
        while (xp >= level * 100) { // Level up every 100 XP
            xp -= level * 100;
            level++;
            increaseEnemyDifficulty();
        }
    }

    function increaseEnemyDifficulty() {
        ShipSystem.increaseEnemySpeed(1); // Increase enemy speed
        ShipSystem.decreaseEnemySpawnCooldown(10); // Decrease spawn cooldown
    }

    // Reset player's stats upon death
    function resetPlayerStats() {
        xp = 0;
        level = 1;
        BulletSystem.clearAllBullets();
        BulletSystem.incrementBulletCount(-BulletSystem.getBulletCount()); // Reset bullet count to 0
    }

    // Add parallax background system
    const ParallaxSystem = {
        layers: [
            { stars: [], speed: 0.5, color: "#555" },
            { stars: [], speed: 1, color: "#888" },
            { stars: [], speed: 1.5, color: "#FFF" }
        ],

        init: function() {
            this.layers.forEach(layer => {
                for (let i = 0; i < 100; i++) {
                    layer.stars.push({
                        x: Math.random() * canvas.width,
                        y: Math.random() * canvas.height,
                        size: Math.random() * 2 + 1
                    });
                }
            });
        },

        draw: function(ctx) {
            this.layers.forEach(layer => {
                ctx.fillStyle = layer.color;
                layer.stars.forEach(star => {
                    ctx.beginPath();
                    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                    ctx.fill();

                    // Move stars downward
                    star.y += layer.speed;

                    // Reset stars that move off-screen
                    if (star.y > canvas.height) {
                        star.y = 0;
                        star.x = Math.random() * canvas.width;
                    }
                });
            });
        },
        
        // Add horizontal movement function for parallax layers
        moveX: function(dx) {
            this.layers.forEach(layer => {
                // Move each star horizontally at its proportional parallax speed
                layer.stars.forEach(star => {
                    star.x += dx * (layer.speed / 1.5); // Scale by layer speed for parallax effect
                    
                    // Wrap stars horizontally if they move off-screen
                    if (star.x < 0) {
                        star.x += canvas.width;
                    } else if (star.x > canvas.width) {
                        star.x -= canvas.width;
                    }
                });
            });
        }
    };
    
    /**
     * Move parallax background horizontally
     * @param {number} dx - Distance to move
     */
    function moveParallaxX(dx) {
        ParallaxSystem.moveX(dx);
    }

    // Initialize the game
    function init() {
        canvas = document.getElementById("gameCanvas");
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;
        ctx = canvas.getContext("2d");
        
        // Initialize systems in the correct order
        ColorUtils.initColorCache();
        StarSystem.initStarSizeCache();
        InputSystem.init();
        ShipSystem.init();
        BulletSystem.init();
        DustSystem.init();
        PowerUpSystem.init(); // Initialize PowerUpSystem
        ParallaxSystem.init();
        
        // Set up event listeners
        window.addEventListener('resize', resizeCanvas, false);
        window.addEventListener('orientationchange', resizeCanvas, false);
        
        // Start the game loop
        window.requestAnimationFrame(gameLoop);
    }
    
    // Main game loop
    function gameLoop(timestamp) {
        // Update FPS counter
        PerformanceMonitor.update(timestamp);
        
        // Increment frame counter
        frameCount++;
        
        if (start) {
            if (!gamePaused) {
                if (!deadHero) {
                    if (!DockingSystem.isDocking()) {
                        // Game active state
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ParallaxSystem.draw(ctx); // Draw parallax background
                        updateActiveGame();
                    } else {
                        // Docked state
                        updateDockedState();
                    }
                } else {
                    // Game over state
                    handleGameOver();
                }
            } else {
                // Paused state
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ParallaxSystem.draw(ctx); // Draw parallax background
                StarSystem.drawStars(ctx);
                RoomSystem.drawRooms(ctx);
                drawHelps();
            }
        } else {
            // Start screen
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ParallaxSystem.draw(ctx); // Draw parallax background
            StarSystem.drawStars(ctx);
            drawStartScreen();
        }
        
        window.requestAnimationFrame(gameLoop);
    }
    
    // Update game when in active play state
    function updateActiveGame() {
        ParallaxSystem.draw(ctx);
        StarSystem.drawStars(ctx);
        RoomSystem.drawRooms(ctx);
        
        // Check if rooms need to be regenerated
        if (RoomSystem.roomList.length > 0 && RoomSystem.roomList[0].y >= canvas.height) {
            RoomSystem.regenerateRooms();
        }
        
        RoomSystem.drawRats(ctx);
        
        // Move rooms and rats
        RoomSystem.updateRooms();
        RoomSystem.updateRats();
        
        RoomSystem.drawDock(ctx);
        DustSystem.drawDust(ctx);
        ShipSystem.drawHero(ctx);
        BulletSystem.drawHeroBullets(ctx, DustSystem.dust);
        drawScore();
        MovementSystem.moveAll();
        
        // Check docking
        RoomSystem.checkDocking();

        // Update and draw enemies
        ShipSystem.updateEnemies(); // Updates position, shooting, and spawning
        ShipSystem.drawEnemies(ctx); // Draws all active enemies
        
        // Update and draw bullets (enemy bullets are now spawned in ShipSystem.updateEnemies)
        BulletSystem.updateBullets(ctx); // Renamed from drawBullets, handles movement/drawing
        
        // Check hero bullets hitting enemies
        BulletSystem.checkHeroHits(); // Needs update to check against activeEnemies
        
        // Check enemy bullets hitting hero
        BulletSystem.checkEnemyHits();
        
        // Check enemy bullets hitting dust
        BulletSystem.checkDustHits();
        
        // Update stars
        StarSystem.updateStars();
        
        // Check enemy-dust collisions
        DustSystem.checkEnemyCollisions(); // Needs update to check against activeEnemies
        
        // Check enemy-hero collision (Needs update to check against activeEnemies)
        ShipSystem.checkHeroCollisions(); // New function needed in ShipSystem
        
        // Clean up bullets that are off screen
        BulletSystem.cleanupBullets();
        
        // Update and draw power-ups
        PowerUpSystem.update(); 
        PowerUpSystem.draw(ctx);
        
        // Draw notifications
        updateNotifications();
        
        // Draw FPS counter
        PerformanceMonitor.draw(ctx);
    }
    
    // Update game when in docked state
    function updateDockedState() {
        // Reset enemy and projectiles
        ShipSystem.resetEnemy();
        BulletSystem.clearAllBullets();
        DustSystem.clearAllDust();
        
        // Center the view on the man
        DockingSystem.centerViewOnMan();
        
        // Draw the scene
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        StarSystem.drawStars(ctx);
        RoomSystem.drawRooms(ctx);
        RoomSystem.drawRats(ctx);
        RoomSystem.drawDock(ctx);
        ShipSystem.drawHero(ctx);
        DockingSystem.drawMan(ctx);
        MovementSystem.moveAll();
        
        // Handle man movement
        DockingSystem.handleManMovement();
        
        // Update stars in docked mode
        StarSystem.updateStarsInDockedMode();
        
        // Check if man returns to ship
        if (DockingSystem.checkManReturnsToShip()) {
            DockingSystem.undock();
        }
        
        // Check for rat interactions
        RoomSystem.checkRatInteractions();
    }
    
    // Handle game over state
    function handleGameOver() {
        if (InputSystem.isEnterPressed() || unDeadHero) {
            resetGame();
        }
        // Draw relevant elements for game over screen
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ParallaxSystem.draw(ctx); // Keep background
        StarSystem.drawStars(ctx);
        // RoomSystem.drawRooms(ctx); // Optional: show rooms where player died
        drawGameOver(); // Draws the skull icon
        // Optionally draw final score here too
    }
    
    // Reset the game state
    function resetGame() {
        score = 0;
        shotDrones = 0;
        destDust = 0;
        ShipSystem.resetEnemy(); // Resets all enemies
        
        // Recycle all objects
        BulletSystem.clearAllBullets();
        DustSystem.clearAllDust();
        PowerUpSystem.resetAllPowerUps(); // Reset power-ups
        
        RoomSystem.clearRooms();
        deadHero = false;
        unDeadHero = false;
        RoomSystem.generateRooms();
        resetPlayerStats();
        // Reset difficulty scaling in ShipSystem if needed, or rely on level reset
        // ShipSystem.resetDifficulty(); // Example if needed
    }
    
    // Canvas resize handler
    function resizeCanvas() {
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;
        ctx = canvas.getContext("2d");
        
        // Update dependent values
        DustSystem.updateMagWaveRange();
    }
    
    // Draw the start screen
    function drawStartScreen() {
        if (!(InputSystem.isEnterPressed() || InputSystem.isLeftTouchActive() || InputSystem.isRightTouchActive())) {
            ctx.font = "40px Consolas";
            ctx.fillStyle = ColorUtils.randRGB();
            ctx.textAlign = "center";
            ctx.fillText("NEXUS \u2A58\u2A57 VECTOR", canvas.width / 2, canvas.height / 2);
            ctx.font = "20px Courier New";
            ctx.fillText("PRESS ENTER OR TAP TO START", canvas.width / 2, canvas.height / 2 + 40);
        } else {
            RoomSystem.generateRooms();
            start = true;
        }
    }
    
    // Update drawScore to include player's level and remove radar
    function drawScore() {
        ctx.textAlign = "end";
        ctx.fillStyle = ColorUtils.randRGB();
        ctx.font = "18px Consolas";
        ctx.fillText("Stardust Collected:" + score, canvas.width - 12, 22);
        ctx.fillStyle = ColorUtils.randRGB();
        ctx.fillText("Stardust Destroyed:" + destDust, canvas.width - 12, 42);
        ctx.fillStyle = ColorUtils.randRGB();
        ctx.fillText("Drones Destroyed:" + shotDrones, canvas.width - 12, 62);
        ctx.fillStyle = ColorUtils.randRGB();
        ctx.fillText("Bullets Available:" + BulletSystem.getBulletCount(), canvas.width - 12, 82);
        ctx.fillStyle = ColorUtils.randRGB();
        ctx.fillText("XP:" + xp, canvas.width - 12, 102);
        ctx.fillStyle = ColorUtils.randRGB();
        ctx.fillText("Level:" + level, canvas.width - 12, 122);
    }
    
    // Draw help text in pause screen
    function drawHelps() {
        drawScore();
        ctx.font = "18px Consolas";
        ctx.fillStyle = ColorUtils.randRGB();
        ctx.textAlign = "start";
        ctx.fillText("Move:             <-/-> or Tilt", 5, canvas.height - 60);
        ctx.fillStyle = ColorUtils.randRGB();
        ctx.fillText("Shoot:            Space/Touch Right", 5, canvas.height - 42);
        ctx.fillStyle = ColorUtils.randRGB();
        ctx.fillText("MagWave:     Down/Touch Left", 5, canvas.height - 24);
        ctx.fillStyle = ColorUtils.randRGB();
        ctx.fillText("Resume:         p/Multi-Touch", 5, canvas.height - 6);
        ctx.textAlign = "center";
        ctx.fillStyle = ColorUtils.randRGB();
        ctx.font = "48px Consolas";
        ctx.fillText("| |", canvas.width / 2, canvas.height / 2);
    }
    
    // Draw game over screen
    function drawGameOver() {
        RoomSystem.drawRooms(ctx);
        ctx.font = "48px Consolas";
        ctx.fillStyle = ColorUtils.randRGB();
        ctx.textAlign = "center";
        ctx.fillText("\u2620", canvas.width / 2, canvas.height / 2);
    }
    
    // Public API
    return {
        init: init,
        getCanvas: function() { return canvas; },
        getContext: function() { return ctx; },
        isGameStarted: function() { return start; },
        isGamePaused: function() { return gamePaused; },
        setGamePaused: function(isPaused) { gamePaused = isPaused; },
        isHeroDead: function() { return deadHero; },
        setHeroDead: function(isDead) { deadHero = isDead; },
        isUnDeadHero: function() { return unDeadHero; },
        setUnDeadHero: function(isUndead) { unDeadHero = isUndead; },
        incrementScore: function() { score += 1; },
        incrementDestDust: function() { destDust += 1; },
        incrementShotDrones: function() { shotDrones += 1; },
        getScore: function() { return score; },
        getFrameCount: function() { return frameCount; },
        getSpeed: function() { return speed; },
        gainXP: gainXP,
        showNotification: showNotification,
        moveParallaxX: moveParallaxX, // Expose parallax movement function
        get level() { return level; }
    };
})();