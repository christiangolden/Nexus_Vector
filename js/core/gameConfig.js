/**
 * Nexus Vector - Game Configuration
 * 
 * This module centralizes game configuration parameters and constants
 * to make it easier to balance and tune the game.
 */

const GameConfig = (function() {
    'use strict';

    // Player settings
    const player = {
        ship: {
            width: 20,
            height: 40,
            baseSpeed: 7,
            maxSpeed: 12
        },
        progression: {
            xpPerLevel: 100,
            maxLevel: 30
        },
        weapons: {
            defaultFireRate: 7,
            rapidFireMultiplier: 2,
            standardBulletSpeed: 10,
            bulletPoolSize: 100
        }
    };

    // Enemy settings
    const enemies = {
        types: {
            basic: {
                health: 1,
                speed: 5,
                shootCooldown: 120,
                bulletSpeed: 5,
                bulletPattern: 'straight',
                scoreValue: 10,
                xpValue: 5
            },
            tracker: {
                health: 2,
                speed: 3,
                shootCooldown: 90,
                bulletSpeed: 7,
                bulletPattern: 'straight',
                scoreValue: 20,
                xpValue: 10
            },
            zigzag: {
                health: 1,
                speed: 6,
                shootCooldown: 150,
                bulletSpeed: 6,
                bulletPattern: 'spread',
                scoreValue: 15,
                xpValue: 7
            },
            sniper: {
                health: 3,
                speed: 2,
                shootCooldown: 200,
                bulletSpeed: 9,
                bulletPattern: 'aimed',
                scoreValue: 30,
                xpValue: 15
            }
        },
        formations: {
            spawnProbability: 0.2,
            minTimeBetweenFormations: 500 // frames
        },
        spawning: {
            baseInterval: 150,
            minInterval: 50,
            decreasePerLevel: 10
        },
        scaling: {
            speedIncreasePerLevel: 0.5,
            healthIncreaseEachNLevels: 5
        },
        poolSize: 30 // Maximum number of enemies in object pool
    };

    // Environment settings
    const environment = {
        dust: {
            spawnRate: 0.02,
            width: 14,
            height: 14,
            scoreValue: 1,
            xpValue: 2,
            maxPoolSize: 40
        },
        magwave: {
            energyMax: 10,
            energyRechargeRate: 0.05,
            dustAttractionRadius: 120
        },
        room: {
            maxSize: 30,
            ratMaxSize: 50,
            roomMinSize: 150,
            dockingStationProbability: 0.1
        },
        parallax: {
            layers: 3,
            minSpeed: 0.5,
            maxSpeed: 1.5
        }
    };

    // Power-up settings
    const powerUps = {
        types: {
            shield: {
                probability: 0.25,
                color: '#3399FF',
                symbol: 'S',
                velocity: 3
            },
            rapidFire: {
                probability: 0.25,
                color: '#FF3366',
                symbol: 'R',
                velocity: 2
            },
            multiShot: {
                probability: 0.25,
                color: '#FFCC00',
                symbol: 'M',
                velocity: 4
            },
            extraBullets: {
                probability: 0.25,
                color: '#66CC66',
                symbol: 'B',
                velocity: 3.5,
                bulletsGranted: 50
            }
        },
        spawnChance: 0.4, // 40% chance of spawning from destroyed enemy
        maxPoolSize: 20,
        maxAge: 300
    };

    // General game settings
    const general = {
        targetFps: 60,
        notificationDuration: 90, // frames
        scoring: {
            dustCollected: 1,
            dustDestroyed: 1,
            enemyDestroyed: 1
        }
    };

    // Return public API with getters only to prevent modification
    return {
        getPlayerConfig: function() { return { ...player }; },
        getEnemyConfig: function() { return { ...enemies }; },
        getEnvironmentConfig: function() { return { ...environment }; },
        getPowerUpConfig: function() { return { ...powerUps }; },
        getGeneralConfig: function() { return { ...general }; }
    };
})();