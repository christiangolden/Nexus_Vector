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
        isUndead: false,
        starEnergy: 0 // Add star energy to player state
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

    let starEnergyWarningTimer = 0;
    let starEnergyWarningPulse = 0;

    function triggerStarEnergyWarning() {
        starEnergyWarningTimer = 180; // 3 seconds at 60fps
        starEnergyWarningPulse = 0;
    }

    function updateStarEnergyWarning() {
        if (starEnergyWarningTimer > 0) {
            starEnergyWarningTimer--;
            starEnergyWarningPulse++;
        }
    }
    
    // --- Screen shake for shooting ---
    let shootShakeFrames = 0;
    let shootShakeIntensity = 0;
    function triggerShootShake(frames = 6, intensity = 8) {
        shootShakeFrames = frames;
        shootShakeIntensity = intensity;
    }

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
        player.starEnergy = 0; // Start star energy empty
        if (typeof BulletSystem !== 'undefined' && BulletSystem.resetBulletCount) {
            BulletSystem.resetBulletCount();
        }
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
    function showNotification(message, options = {}) {
        notifications.push({
            message: message,
            duration: options.duration || settings.notificationDuration,
            opacity: 1.0,
            pulse: options.pulse || false
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
            if (notification.pulse) {
                // More drastic pulse/glow effect
                const pulse = 0.5 + 0.5 * Math.abs(Math.sin(session.frameCount / 4));
                ctx.shadowColor = `rgba(255,255,128,${pulse})`;
                ctx.shadowBlur = 36 * pulse;
                ctx.fillStyle = `rgba(255, 255, 128, ${notification.opacity * (0.7 + 0.6 * pulse)})`;
            } else {
                ctx.fillStyle = `rgba(255, 255, 255, ${notification.opacity})`;
                ctx.shadowBlur = 0;
            }
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
            // Ambient rumble logic
            if (newState === STATE.PLAYING) {
                if (window.startAmbientRumble) window.startAmbientRumble();
            } else {
                if (window.stopAmbientRumble) window.stopAmbientRumble();
            }
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
        updateStarEnergyWarning();
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
        // If docking transition is active, only show docking animation
        if (typeof DockingSystem !== 'undefined' && DockingSystem.isDocking && DockingSystem.isDocking()) {
            // The docking animation handles its own canvas clearing and drawing
            return;
        }
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
        // Lose all power-ups if star energy is zero
        if (player.starEnergy === 0) {
            PowerUpSystem.resetAllPowerUps();
        }
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
        // Screen shake effect during warp or shooting
        let shaking = false;
        let shakeX = 0, shakeY = 0;
        if (GameState.getWarpActive()) {
            shaking = true;
            shakeX = (Math.random() - 0.5) * 8;
            shakeY = (Math.random() - 0.5) * 8;
            ctx.save();
            ctx.translate(shakeX, shakeY);
        } else if (shootShakeFrames > 0) {
            shaking = true;
            shakeX = (Math.random() - 0.5) * shootShakeIntensity;
            shakeY = (Math.random() - 0.5) * shootShakeIntensity;
            ctx.save();
            ctx.translate(shakeX, shakeY);
            shootShakeFrames--;
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
        console.log('[GameState] renderDockedState called');
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
        // --- Layout for bottom center ---
        const meterWidth = 180;
        const meterHeight = 22;
        const xpBarWidth = 180;
        const xpBarHeight = 22;
        const gap = 48; // Increased space between bars to prevent overlap
        const totalWidth = meterWidth + gap + xpBarWidth;
        const centerX = canvas.width / 2;
        const baseY = canvas.height - 48; // 48px from bottom

        // --- Star Energy Meter (Left) ---
        const meterX = centerX - totalWidth / 2;
        const meterY = baseY;
        const starEnergy = player.starEnergy;
        const maxStarEnergy = 1000;
        ctx.save();
        ctx.font = "bold 15px Consolas";
        if (starEnergyWarningTimer > 0) {
            const pulse = 0.7 + 0.3 * Math.abs(Math.sin(starEnergyWarningPulse / 30));
            ctx.shadowColor = `rgba(255,32,32,${pulse})`;
            ctx.shadowBlur = 48 * pulse;
        }
        ctx.fillStyle = "#222";
        ctx.fillRect(meterX - 2, meterY - 2, meterWidth + 4, meterHeight + 4);
        ctx.fillStyle = "#44C3FF";
        ctx.fillRect(meterX, meterY, meterWidth * Math.min(starEnergy / maxStarEnergy, 1), meterHeight);
        ctx.strokeStyle = "#FFF";
        ctx.lineWidth = 2;
        ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);
        ctx.font = "bold 20px Consolas";
        ctx.fillStyle = "#FFD700";
        ctx.textAlign = "right";
        ctx.fillText("★", meterX - 10, meterY + meterHeight - 3);
        ctx.restore();

        // --- XP Bar and Level Counter (Right) ---
        const xpBarX = meterX + meterWidth + gap;
        const xpBarY = meterY;
        const currentXp = player.xp;
        const nextLevelXp = player.level * 100;
        // Draw bar background
        ctx.save();
        ctx.font = "bold 15px Consolas";
        ctx.fillStyle = "#222";
        ctx.fillRect(xpBarX - 2, xpBarY - 2, xpBarWidth + 4, xpBarHeight + 4);
        ctx.fillStyle = "#44FF88";
        ctx.fillRect(xpBarX, xpBarY, xpBarWidth * (currentXp / nextLevelXp), xpBarHeight);
        ctx.strokeStyle = "#FFF";
        ctx.lineWidth = 2;
        ctx.strokeRect(xpBarX, xpBarY, xpBarWidth, xpBarHeight);
        // Draw level number at the right end of the bar
        ctx.font = "bold 18px Consolas";
        ctx.textAlign = "right";
        ctx.fillStyle = "#FFD700";
        ctx.fillText(`${player.level}`, xpBarX + xpBarWidth + 24, xpBarY + xpBarHeight / 2 + 6);
        ctx.restore();
    }
    
    // Draw help text in pause screen
    function drawHelpText() {
        drawScore();
        // Remove all instruction text, only show pause icon
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
    
    // Star Energy API
    function getStarEnergy() {
        return player.starEnergy;
    }
    function setStarEnergy(val) {
        player.starEnergy = Math.max(0, Math.min(1000, val));
    }
    function addStarEnergy(val) {
        player.starEnergy = Math.max(0, Math.min(1000, player.starEnergy + val));
    }

    // --- Cleanup all warp/warp audio effects on player death ---
    function handlePlayerDeathCleanup() {
        // Stop warp visuals and reset state
        session.warpActive = false;
        session.warpLevel = 0;
        session.speed = 7;
        // Stop all warp and magwave sounds if available
        if (window.stopContinuousWarpSound) window.stopContinuousWarpSound();
        if (window.stopWarpSound) window.stopWarpSound();
        if (window.stopMagwaveSound) window.stopMagwaveSound();
        if (window.stopAmbientRumble) window.stopAmbientRumble();
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
        setHeroDead: function(isDead) { 
            player.isDead = isDead;
            if (isDead) {
                player.xp = 0;
                player.starEnergy = 0;
                handlePlayerDeathCleanup();
            }
        },
        isPlayerUndead: function() { return player.isUndead; },
        setPlayerUndead: function(isUndead) { player.isUndead = isUndead; },
        resetPlayerStats: resetPlayerStats,
        getStarEnergy: getStarEnergy,
        setStarEnergy: setStarEnergy,
        addStarEnergy: addStarEnergy,
        
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
        showNotification: showNotification,

        triggerStarEnergyWarning: triggerStarEnergyWarning,

        // Expose renderPlayingState for undocking animation
        renderPlayingState: renderPlayingState,

        triggerShootShake: triggerShootShake
    };
})();