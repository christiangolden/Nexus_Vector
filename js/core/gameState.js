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
        speed: 7,
        accumulator: 0, // For fixed timestep
        warpActive: false // Warp speed mode
    };
    
    // Game settings - configurable options
    const settings = {
        targetFps: 60,
        timeStep: 1000 / 60, // Fixed timestep in ms (16.67ms @ 60fps)
        notificationDuration: 90, // 1.5 seconds at 60fps
        maxDeltaTime: 100 // Max delta time in ms to prevent spiral of death
    };
    
    // State change listeners
    const stateChangeListeners = [];
    
    // Canvas and context references
    let canvas;
    let ctx;
    
    // Warp energy for warp drive (separate from magwave)
    let warpEnergy = 100;
    
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
    
    // Update frame timing with fixed timestep accumulation
    function updateFrameTiming(timestamp) {
        // Calculate real delta time in milliseconds
        let frameDelta = timestamp - session.lastTimestamp;
        
        // Clamp deltaTime to avoid "spiral of death" after pauses/tab switches
        if (frameDelta > settings.maxDeltaTime) {
            frameDelta = settings.maxDeltaTime;
        }
        
        // Update last timestamp
        session.lastTimestamp = timestamp;
        
        // Store delta in seconds for systems that need real elapsed time
        session.deltaTime = frameDelta / 1000; 
        
        // Add to the accumulator
        session.accumulator += frameDelta;
        
        // Increment frame counter
        session.frameCount++;
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
            const warp = session.warpActive;
            const warpFactor = warp ? 8 : 1;
            this.layers.forEach(layer => {
                ctx.fillStyle = layer.color;
                layer.stars.forEach(star => {
                    ctx.beginPath();
                    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                    ctx.fill();

                    // Move stars downward
                    star.y += layer.speed * warpFactor;

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
                // Generate initial stations when starting game
                StationSystem.init();
                StationSystem.generateStation();
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
    
    // Main game loop with fixed timestep implementation
    function gameLoop(timestamp) {
        // Update timing information with accumulator
        updateFrameTiming(timestamp);
        
        // Update FPS counter
        PerformanceMonitor.update(timestamp);
        
        // Process fixed timestep updates
        // Process as many fixed steps as needed to catch up
        while (session.accumulator >= settings.timeStep) {
            // Update game logic at fixed intervals
            updateLogic(settings.timeStep / 1000); // timeStep in seconds
            
            // Subtract the fixed timestep from the accumulator
            session.accumulator -= settings.timeStep;
        }
        
        // Calculate interpolation factor for smooth rendering between physics steps
        const alpha = session.accumulator / settings.timeStep;
        
        // Render the game with interpolation factor
        renderGame(alpha);
        
        // Request next frame
        window.requestAnimationFrame(gameLoop);
    }
    
    // Update game logic at fixed timestep intervals
    function updateLogic(timeStep) {
        // Always update undock cooldown
        if (typeof DockingSystem !== 'undefined' && DockingSystem.updateUndockCooldown) {
            DockingSystem.updateUndockCooldown();
        }
        // Process based on current game state
        switch (currentState) {
            case STATE.START_SCREEN:
                updateStartScreenLogic(timeStep);
                break;
                
            case STATE.PLAYING:
                updatePlayingStateLogic(timeStep);
                break;
                
            case STATE.PAUSED:
                // No updates during pause
                break;
                
            case STATE.DOCKED:
                updateDockedStateLogic(timeStep);
                break;
                
            case STATE.GAME_OVER:
                updateGameOverLogic(timeStep);
                break;
        }
        
        // Always update input system to track key state changes
        InputSystem.update();
    }
    
    // Render the game (can run at variable frame rate)
    function renderGame(interpolation) {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Render based on current game state
        switch (currentState) {
            case STATE.START_SCREEN:
                renderStartScreen(interpolation);
                break;
                
            case STATE.PLAYING:
                renderPlayingState(interpolation);
                break;
                
            case STATE.PAUSED:
                renderPausedState(interpolation);
                break;
                
            case STATE.DOCKED:
                renderDockedState(interpolation);
                break;
                
            case STATE.GAME_OVER:
                renderGameOverState(interpolation);
                break;
        }
        
        // Update and draw notifications
        updateNotifications();
    }
    
    // Start screen logic - fixed timestep update
    function updateStartScreenLogic(timeStep) {
        StarSystem.updateStars();
        
        // Check for input to start game
        if (InputSystem.isEnterPressed() || 
            InputSystem.isLeftTouchActive() || 
            InputSystem.isRightTouchActive()) {
            setState('PLAYING');
        }
    }
    
    // Start screen rendering
    function renderStartScreen(interpolation) {
        ParallaxSystem.draw(ctx);
        StarSystem.drawStars(ctx);
        drawStartScreen();
    }
    
    // Game play logic at fixed timestep
    function updatePlayingStateLogic(timeStep) {
        // Check if player is attempting to dock with a space station
        StationSystem.checkDocking();
        
        // Process movement with consistent physics - pass timeStep
        MovementSystem.moveAll(timeStep);
        
        // Update space stations
        StationSystem.updateStations(timeStep);
        
        // Update enemies
        ShipSystem.updateEnemies();
        
        // Update bullets with timeStep
        BulletSystem.updateBullets(timeStep);
        
        // Check all collisions
        checkAllCollisions();
        
        // Update stars
        StarSystem.updateStars();
        
        // Clean up bullets that are off screen
        BulletSystem.cleanupBullets();
        
        // Update power-ups
        PowerUpSystem.update();
        // Update particles for enemy explosions
        if (typeof ParticleSystem !== 'undefined') {
            ParticleSystem.update();
        }
        
        // Check if player is dead
        if (player.isDead) {
            setState('GAME_OVER');
        }
    }
    
    // Game play rendering
    function renderPlayingState(interpolation) {
        // Screen shake effect during warp
        let shaking = false;
        let shakeX = 0, shakeY = 0;
        if (GameState.getWarpActive()) {
            shaking = true;
            // Increase shake intensity: random offset between -4 and 4 pixels
            shakeX = (Math.random() - 0.5) * 8;
            shakeY = (Math.random() - 0.5) * 8;
            ctx.save();
            ctx.translate(shakeX, shakeY);
        }
        // Draw background elements
        ParallaxSystem.draw(ctx);
        StarSystem.drawStars(ctx);
        // Draw monolithic space stations
        StationSystem.drawStations(ctx);
        // Draw other environment elements
        DustSystem.drawDust(ctx);
        // Draw magwave effect if active
        if ((InputSystem.isDownPressed() || InputSystem.isLeftTouchActive()) && 
            DustSystem.getMwEnergy() > 0 && 
            !DockingSystem.isDocking() &&
            DustSystem.magWave.radius > 0) {
            DustSystem.drawMagWave(ctx);
        }
        // Draw player and bullets - pass timeStep for frame-independent animation
        ShipSystem.drawHero(ctx);
        BulletSystem.drawHeroBullets(ctx, DustSystem.dust, session.deltaTime);
        BulletSystem.drawEnemyBullets(ctx); // Draw enemy bullets
        // Draw enemies
        ShipSystem.drawEnemies(ctx);
        // Draw power-ups
        PowerUpSystem.draw(ctx);
        // Draw particles for enemy explosions
        if (typeof ParticleSystem !== 'undefined') {
            ParticleSystem.draw(ctx);
        }
        // Restore context after shake
        if (shaking) {
            ctx.restore();
        }
        // Draw UI
        drawScore();
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
    
    // Paused state rendering
    function renderPausedState(interpolation) {
        ParallaxSystem.draw(ctx);
        StarSystem.drawStars(ctx);
        StationSystem.drawStations(ctx);
        drawHelpText();
    }
    
    // Docked state logic
    function updateDockedStateLogic(timeStep) {
        // Check if player wants to exit the station
        DockingSystem.checkExitStation();
        
        // Handle player movement in ASCII map
        DockingSystem.handlePlayerMovement();
        
        // Update stars in docked mode for background effect
        StarSystem.updateStarsInDockedMode();
    }
    
    // Docked state rendering
    function renderDockedState(interpolation) {
        // Reset enemies and projectiles when rendering docked state first time
        if (previousState !== STATE.DOCKED) {
            ShipSystem.resetEnemy();
            BulletSystem.clearAllBullets();
            DustSystem.clearAllDust();
        }
        
        // Draw ASCII roguelike interior when docked
        StationSystem.drawStationInterior(ctx);
    }
    
    // Game over state logic
    function updateGameOverLogic(timeStep) {
        StarSystem.updateStars();
        
        if (InputSystem.isEnterPressed() || player.isUndead) {
            resetGame();
            setState('PLAYING');
        }
    }
    
    // Game over state rendering
    function renderGameOverState(interpolation) {
        ParallaxSystem.draw(ctx);
        StarSystem.drawStars(ctx);
        StationSystem.drawStations(ctx);
        drawGameOver();
    }
    
    // Draw game over screen
    function drawGameOver() {
        ctx.font = "48px Consolas";
        ctx.fillStyle = ColorUtils.randRGB();
        ctx.textAlign = "center";
        ctx.fillText("\u2620", canvas.width / 2, canvas.height / 2);
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
        StationSystem.init();
        StationSystem.generateStation();
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

        // Draw warp energy bar at upper left
        const barX = 12;
        const barY = 12;
        const barWidth = 120;
        const barHeight = 16;
        const warpEnergy = GameState.getWarpEnergy();
        ctx.save();
        ctx.textAlign = "start";
        ctx.font = "bold 14px Consolas";
        ctx.fillStyle = "#222";
        ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
        ctx.fillStyle = "#3399FF";
        ctx.fillRect(barX, barY, barWidth * (warpEnergy / 100), barHeight);
        ctx.strokeStyle = "#FFF";
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = "#FFF";
        ctx.fillText("WARP", barX, barY + barHeight + 14);
        ctx.restore();
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
        // Warp mode accessors
        getWarpActive: function() { return session.warpActive; },
        setWarpActive: function(active) { session.warpActive = active; },
        getWarpLevel: function() { return session.warpLevel || 0; },
        setWarpLevel: function(level) { session.warpLevel = level; },
        getWarpEnergy: function() { return warpEnergy; },
        setWarpEnergy: function(val) { warpEnergy = Math.max(0, Math.min(100, val)); },
        
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