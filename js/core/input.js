/**
 * Nexus Vector - Input System
 * 
 * This module handles all user input including keyboard, touch, and device orientation.
 */

const InputSystem = (function() {
    'use strict';
    
    // Input state object
    const evt = {
        w: false,
        enter: false,
        right: false,
        left: false,
        down: false,
        up: false,
        shift: false,
        space: false,
        tab: false,
        touch: false,
        rightTouch: false,
        leftTouch: false,
        downTouch: false,
        upTouch: false,
        tiltRight: false,
        tiltLeft: false
    };
    
    // Touch coordinates
    let touchX1, touchY1, touchX2, touchY2;
    
    // Initialize input handlers
    function init() {
        // Set up event listeners
        document.addEventListener("keydown", keyDownHandler, false);
        document.addEventListener("keyup", keyUpHandler, false);
        window.addEventListener("touchstart", handleStart, false);
        window.addEventListener("touchend", handleEnd, false);
        
        // Check for device orientation support
        if (window.DeviceOrientationEvent) {
            window.addEventListener("deviceorientation", handleOrientation, false);
        } else if (window.DeviceMotionEvent) {
            window.addEventListener("devicemotion", handleMotion, false);
        }
    }
    
    // Handle key down events
    function keyDownHandler(e) {
        switch (e.keyCode) {
            case 32: // Space
                evt.space = true;
                break;
            case 37: // Left arrow
                evt.left = true;
                break;
            case 38: // Up arrow
                evt.up = true;
                break;
            case 39: // Right arrow
                evt.right = true;
                break;
            case 40: // Down arrow
                evt.down = true;
                break;
            case 16: // Shift
                evt.shift = true;
                break;
            case 9:  // Tab
                evt.tab = true;
                break;
            case 13: // Enter
                evt.enter = true;
                break;
            case 80: // P (pause)
                if (!Game.isGamePaused() && !Game.isHeroDead() && Game.isGameStarted()) {
                    Game.setGamePaused(true);
                } else {
                    Game.setGamePaused(false);
                }
                break;
        }
        e.preventDefault();
    }
    
    // Handle key up events
    function keyUpHandler(e) {
        switch (e.keyCode) {
            case 87: // W
                evt.w = false;
                break;
            case 39: // Right arrow
                evt.right = false;
                break;
            case 38: // Up arrow
                evt.up = false;
                break;
            case 37: // Left arrow
                evt.left = false;
                break;
            case 32: // Space
                evt.space = false;
                break;
            case 40: // Down arrow
                evt.down = false;
                break;
            case 16: // Shift
                evt.shift = false;
                break;
            case 9:  // Tab
                evt.tab = false;
                break;
            case 13: // Enter
                evt.enter = false;
                break;
        }
        e.preventDefault();
    }
    
    // Handle touch start event
    function handleStart(event) {
        if (event.changedTouches) {
            evt.touch = true;
            touchX1 = event.touches[0].pageX;
            touchY1 = event.touches[0].pageY;
            
            const canvas = Game.getCanvas();
            
            // Set touch direction based on screen position
            if (event.touches[0].pageX > canvas.width / 2 + 100) {
                evt.rightTouch = true;
            } else if (event.touches[0].pageX <= canvas.width / 2 - 100) {
                evt.leftTouch = true;
            }
            
            if (event.touches[0].pageY > canvas.height / 2 + 100) {
                evt.downTouch = true;
            } else if (event.touches[0].pageY <= canvas.height / 2 - 100) {
                evt.upTouch = true;
            }
            
            // Handle multi-touch for pause or revive
            if (event.touches.length > 1) {
                if (Game.isHeroDead()) {
                    // Use the proper API to revive hero
                    DockingSystem.reviveHero();
                }
                
                if (!Game.isGamePaused() && !Game.isHeroDead()) {
                    Game.setGamePaused(true);
                } else {
                    Game.setGamePaused(false);
                }
            }
        }
    }
    
    // Handle touch end event
    function handleEnd(event) {
        if (event.changedTouches) {
            event.preventDefault();
            touchX2 = event.changedTouches[0].pageX;
            touchY2 = event.changedTouches[0].pageY;
            evt.touch = false;
            evt.rightTouch = false;
            evt.leftTouch = false;
            evt.downTouch = false;
            evt.upTouch = false;
        }
    }
    
    // Handle device orientation for tilt controls
    function handleOrientation(event) {
        if (event.gamma > 3) {
            evt.tiltLeft = false;
            evt.tiltRight = true;
        } else if (event.gamma < -3) {
            evt.tiltRight = false;
            evt.tiltLeft = true;
        } else if (event.gamma >= -3 && event.gamma <= 3) {
            evt.tiltRight = false;
            evt.tiltLeft = false;
        }
        event.preventDefault();
    }
    
    // Handle device motion as a fallback for orientation
    function handleMotion(event) {
        if (event.acceleration.x > 5) {
            evt.tiltLeft = false;
            evt.tiltRight = true;
        } else if (event.acceleration.x < -5) {
            evt.tiltRight = false;
            evt.tiltLeft = true;
        } else {
            evt.tiltRight = false;
            evt.tiltLeft = false;
        }
        event.preventDefault();
    }
    
    // Public API
    return {
        init: init,
        isRightPressed: function() { return evt.right; },
        isLeftPressed: function() { return evt.left; },
        isUpPressed: function() { return evt.up; },
        isDownPressed: function() { return evt.down; },
        isSpacePressed: function() { return evt.space; },
        isShiftPressed: function() { return evt.shift; },
        isEnterPressed: function() { return evt.enter; },
        isTiltRight: function() { return evt.tiltRight; },
        isTiltLeft: function() { return evt.tiltLeft; },
        isRightTouchActive: function() { return evt.rightTouch; },
        isLeftTouchActive: function() { return evt.leftTouch; },
        isUpTouchActive: function() { return evt.upTouch; },
        isDownTouchActive: function() { return evt.downTouch; },
        isTouchActive: function() { return evt.touch; },
        getState: function() { return {...evt}; }
    };
})();