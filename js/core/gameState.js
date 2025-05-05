/**
 * Nexus Vector - Game State
 * 
 * This module centralizes game state management and provides a single source of truth
 * for the game's current state. It helps decouple components by removing direct references.
 */

const GameState = (function() {
    'use strict';
    
    // Game state constants
    const STATE = {
        START_SCREEN: 'startScreen',
        PLAYING: 'playing',
        PAUSED: 'paused',
        DOCKED: 'docked', 
        GAME_OVER: 'gameOver'
    };
    
    // Core game state
    let currentState = STATE.START_SCREEN;
    let previousState = null;
    
    // Player state
    const player = {
        score: 0,
        shotDrones: 0,
        destroyedDust: 0,
        xp: 0,
        level: 1,
        isDead: false,
        isUndead: false
    };
    
    // Session state
    const session = {
        frameCount: 0,
        lastTimestamp: 0,
        deltaTime: 0,
        speed: 7
    };
    
    // Game settings - configurable options
    const settings = {
        targetFps: 60,
        timeStep: 1000 / 60, // Based on target FPS
        notificationDuration: 90 // 1.5 seconds at 60fps
    };
    
    // State change listeners
    const stateChangeListeners = [];
    
    // Canvas and context references
    let canvas;
    let ctx;
    
    // Register a state change listener
    function onStateChange(callback) {
        stateChangeListeners.push(callback);
    }
    
    // Update the current state
    function setState(newState) {
        if (!STATE[newState]) {
            console.error(`Invalid state: ${newState}`);
            return;
        }
        
        previousState = currentState;
        currentState = STATE[newState];
        
        // Notify all listeners
        stateChangeListeners.forEach(callback => {
            callback(currentState, previousState);
        });
    }
    
    // Reset player stats
    function resetPlayerStats() {
        player.score = 0;
        player.shotDrones = 0;
        player.destroyedDust = 0;
        player.xp = 0;
        player.level = 1;
        player.isDead = false;
        player.isUndead = false;
    }
    
    // Update frame timing
    function updateFrameTiming(timestamp) {
        session.frameCount++;
        session.deltaTime = (timestamp - session.lastTimestamp) / 1000; // Convert to seconds
        
        // Clamp deltaTime to avoid "jumps" if the game pauses or tab switches
        if (session.deltaTime > 0.1) session.deltaTime = 0.1;
        
        session.lastTimestamp = timestamp;
    }
    
    // Add XP to player
    function gainXp(amount, isStardust = false) {
        player.xp += amount;
        
        // If this is stardust being collected via magwave, increment bullet count
        if (isStardust) {
            BulletSystem.incrementBulletCount(10);
        }
        
        // Level up when XP threshold is reached
        while (player.xp >= player.level * 100) { 
            player.xp -= player.level * 100;
            player.level++;
            
            // Publish a level up event that systems can subscribe to
            GameEvents.publish('player:levelUp', { 
                level: player.level,
                previousLevel: player.level - 1
            });
        }
    }
    
    // Add parallax background system (moved from Game)
    const ParallaxSystem = {
        layers: [
            { stars: [], speed: 0.5, color: "#555" },
            { stars: [], speed: 1, color: "#888" },
            { stars: [], speed: 1.5, color: "#FFF" }
        ],

        init: function() {
            // Initialize parallax layers
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
    
    // Notification system
    let notifications = [];
    
    /**
     * Show a notification message on screen
     * @param {string} message - The message to display
     */
    function showNotification(message) {
        notifications.push({
            message: message,
            duration: settings.notificationDuration,
            opacity: 1.0
        });
        
        // Also publish an event so other systems can react
        GameEvents.publish('notification:show', { message });
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
    
    // Initialize the game
    function init() {
        canvas = document.getElementById("gameCanvas");
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;
        ctx = canvas.getContext("2d");
        
        // Set up event listeners
        window.addEventListener('resize', resizeCanvas, false);
        window.addEventListener('orientationchange', resizeCanvas, false);
        
        // Initialize systems in the correct order
        initSystems();
        
        // Subscribe to events
        setupEventHandlers();
        
        // Start the game loop
        window.requestAnimationFrame(gameLoop);
    }
    
    /**
     * Initialize all game systems in the correct order
     */
    function initSystems() {
        // Initialize utility services first
        ColorUtils.initColorCache();
        StarSystem.initStarSizeCache();
        
        // Initialize input handling
        InputSystem.init();
        
        // Initialize entity systems
        ShipSystem.init();
        BulletSystem.init();
        DustSystem.init();
        PowerUpSystem.init();
        RoomSystem.init();
        
        // Initialize visuals
        ParallaxSystem.init();
    }
    
    /**
     * Set up event subscriptions to handle game events
     */
    function setupEventHandlers() {
        // Subscribe to state changes
        onStateChange((newState, oldState) => {
            if (newState === STATE.PLAYING && oldState === STATE.START_SCREEN) {
                // Generate initial rooms when starting game
                RoomSystem.generateRooms();
            }
            
            if (newState === STATE.GAME_OVER) {
                // Pause systems, play death animation, etc.
            }
        });
        
        // Subscribe to level up events to increase difficulty
        GameEvents.subscribe('player:levelUp', (data) => {
            ShipSystem.increaseEnemySpeed(0.5);
            ShipSystem.decreaseEnemySpawnCooldown(10);
            showNotification(`Level Up! Now level ${data.level}`);
        });
        
        // Handle pause toggle events
        GameEvents.subscribe('game:togglePause', () => {
            if (currentState === STATE.PLAYING) {
                setState('PAUSED');
            } else if (currentState === STATE.PAUSED) {
                setState('PLAYING');
            }
        });
    }
    
    // Main game loop
    function gameLoop(timestamp) {
        // Update timing information
        updateFrameTiming(timestamp);
        
        // Update FPS counter
        PerformanceMonitor.update(timestamp);
        
        // Process based on current game state
        switch (currentState) {
            case STATE.START_SCREEN:
                updateStartScreen();
                break;
                
            case STATE.PLAYING:
                updatePlayingState();
                break;
                
            case STATE.PAUSED:
                updatePausedState();
                break;
                
            case STATE.DOCKED:
                updateDockedState();
                break;
                
            case STATE.GAME_OVER:
                updateGameOverState();
                break;
        }
        
        // Request next frame
        window.requestAnimationFrame(gameLoop);
    }
    
    // Update start screen state
    function updateStartScreen() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ParallaxSystem.draw(ctx);
        StarSystem.drawStars(ctx);
        drawStartScreen();
        
        // Check for input to start game
        if (InputSystem.isEnterPressed() || 
            InputSystem.isLeftTouchActive() || 
            InputSystem.isRightTouchActive()) {
            setState('PLAYING');
        }
    }
    
    // Update active gameplay state
    function updatePlayingState() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background elements
        ParallaxSystem.draw(ctx);
        StarSystem.drawStars(ctx);
        RoomSystem.drawRooms(ctx);
        
        // Check if rooms need to be regenerated
        if (RoomSystem.roomList.length > 0 && RoomSystem.roomList[0].y >= canvas.height) {
            RoomSystem.regenerateRooms();
        }
        
        // Update and draw rooms and creatures
        RoomSystem.drawRats(ctx);
        RoomSystem.updateRooms();
        RoomSystem.updateRats();
        
        // Draw other environment elements
        RoomSystem.drawDock(ctx);
        DustSystem.drawDust(ctx);
        
        // Draw player and bullets
        ShipSystem.drawHero(ctx);
        BulletSystem.drawHeroBullets(ctx, DustSystem.dust);
        
        // Draw UI
        drawScore();
        
        // Process movement
        MovementSystem.moveAll();
        
        // Check docking
        RoomSystem.checkDocking();

        // Update and draw enemies
        ShipSystem.updateEnemies();
        ShipSystem.drawEnemies(ctx);
        
        // Update and draw bullets
        BulletSystem.updateBullets(ctx);
        
        // Check collisions
        checkAllCollisions();
        
        // Update stars
        StarSystem.updateStars();
        
        // Clean up bullets that are off screen
        BulletSystem.cleanupBullets();
        
        // Update and draw power-ups
        PowerUpSystem.update(); 
        PowerUpSystem.draw(ctx);
        
        // Update and draw notifications
        updateNotifications();
        
        // Draw FPS counter
        PerformanceMonitor.draw(ctx);
        
        // Check if player is dead
        if (player.isDead) {
            setState('GAME_OVER');
        }
    }
    
    // Process all collision checks
    function checkAllCollisions() {
        // Check hero bullets hitting enemies
        BulletSystem.checkHeroHits();
        
        // Check enemy bullets hitting hero
        BulletSystem.checkEnemyHits();
        
        // Check enemy bullets hitting dust
        BulletSystem.checkDustHits();
        
        // Check enemy-dust collisions
        DustSystem.checkEnemyCollisions();
        
        // Check enemy-hero collision
        ShipSystem.checkHeroCollisions();
    }
    
    // Update paused state
    function updatePausedState() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ParallaxSystem.draw(ctx);
        StarSystem.drawStars(ctx);
        RoomSystem.drawRooms(ctx);
        drawHelpText();
    }
    
    // Update docked state
    function updateDockedState() {
        // Reset enemies and projectiles when docked
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
            setState('PLAYING');
        }
        
        // Check for rat interactions
        RoomSystem.checkRatInteractions();
    }
    
    // Update game over state
    function updateGameOverState() {
        if (InputSystem.isEnterPressed() || player.isUndead) {
            resetGame();
            setState('PLAYING');
        }
        
        // Draw game over screen
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ParallaxSystem.draw(ctx);
        StarSystem.drawStars(ctx);
        drawGameOver();
    }
    
    // Reset the game state
    function resetGame() {
        // Reset game state
        resetPlayerStats();
        
        // Reset game entities
        ShipSystem.resetEnemy();
        BulletSystem.clearAllBullets();
        DustSystem.clearAllDust();
        PowerUpSystem.resetAllPowerUps();
        
        // Generate new environment
        RoomSystem.clearRooms();
        RoomSystem.generateRooms();
    }
    
    // Canvas resize handler
    function resizeCanvas() {
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;
        ctx = canvas.getContext("2d");
        
        // Update dependent values
        DustSystem.updateMagWaveRange();
        
        // Publish resize event
        GameEvents.publish('canvas:resized', { width: canvas.width, height: canvas.height });
    }
    
    // Draw the start screen
    function drawStartScreen() {
        ctx.font = "40px Consolas";
        ctx.fillStyle = ColorUtils.randRGB();
        ctx.textAlign = "center";
        ctx.fillText("NEXUS \u2A58\u2A57 VECTOR", canvas.width / 2, canvas.height / 2);
        ctx.font = "20px Courier New";
        ctx.fillText("PRESS ENTER OR TAP TO START", canvas.width / 2, canvas.height / 2 + 40);
    }
    
    // Draw the score and game stats
    function drawScore() {
        ctx.textAlign = "end";
        ctx.fillStyle = ColorUtils.randRGB();
        ctx.font = "18px Consolas";
        ctx.fillText("Stardust Collected:" + player.score, canvas.width - 12, 22);
        ctx.fillStyle = ColorUtils.randRGB();
        ctx.fillText("Stardust Destroyed:" + player.destroyedDust, canvas.width - 12, 42);
        ctx.fillStyle = ColorUtils.randRGB();
        ctx.fillText("Drones Destroyed:" + player.shotDrones, canvas.width - 12, 62);
        ctx.fillStyle = ColorUtils.randRGB();
        ctx.fillText("Bullets Available:" + BulletSystem.getBulletCount(), canvas.width - 12, 82);
        ctx.fillStyle = ColorUtils.randRGB();
        ctx.fillText("XP:" + player.xp, canvas.width - 12, 102);
        ctx.fillStyle = ColorUtils.randRGB();
        ctx.fillText("Level:" + player.level, canvas.width - 12, 122);
    }
    
    // Draw help text in pause screen
    function drawHelpText() {
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
        STATE: STATE,
        getCurrentState: function() { return currentState; },
        getPreviousState: function() { return previousState; },
        setState: setState,
        onStateChange: onStateChange,
        
        // Player state accessors
        getPlayerScore: function() { return player.score; },
        incrementPlayerScore: function() { player.score += 1; },
        getShotDrones: function() { return player.shotDrones; },
        incrementShotDrones: function() { player.shotDrones += 1; },
        getDestroyedDust: function() { return player.destroyedDust; },
        incrementDestDust: function() { player.destroyedDust += 1; }, 
        getXp: function() { return player.xp; },
        getLevel: function() { return player.level; },
        gainXp: gainXp,
        isPlayerDead: function() { return player.isDead; },
        setHeroDead: function(isDead) { player.isDead = isDead; },
        isPlayerUndead: function() { return player.isUndead; },
        setPlayerUndead: function(isUndead) { player.isUndead = isUndead; },
        resetPlayerStats: resetPlayerStats,
        
        // Session state accessors
        getFrameCount: function() { return session.frameCount; },
        getDeltaTime: function() { return session.deltaTime; },
        updateFrameTiming: updateFrameTiming,
        getSpeed: function() { return session.speed; },
        setSpeed: function(speed) { session.speed = speed; },
        
        // Settings accessors
        getTargetFps: function() { return settings.targetFps; },
        getTimeStep: function() { return settings.timeStep; },
        getNotificationDuration: function() { return settings.notificationDuration; },
        
        // Canvas and rendering
        getCanvas: function() { return canvas; },
        getContext: function() { return ctx; },
        
        // Parallax
        moveParallaxX: moveParallaxX,
        
        // Add init to public API
        init: init,
        
        // Notifications
        showNotification: showNotification
    };
})();