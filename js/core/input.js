/**
 * Nexus Vector - Input System
 * 
 * This module handles all user input including keyboard, touch, and device orientation.
 * Now decoupled from other systems through event publishing.
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
    
    // Previous input states - used to detect key/touch presses (not just held down)
    const prevEvt = { ...evt };
    
    // Touch coordinates
    let touchX1, touchY1, touchX2, touchY2;
    
    /**
     * Initialize input handlers
     */
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
    
    /**
     * Update the input system - called each frame to track state transitions
     */
    function update() {
        // Store previous state for detecting key presses/releases
        Object.assign(prevEvt, evt);
    }
    
    /**
     * Check if a key/button was just pressed this frame (not held down)
     * @param {string} key - The key to check
     * @returns {boolean} - Whether the key was just pressed
     */
    function wasPressed(key) {
        return evt[key] && !prevEvt[key];
    }
    
    /**
     * Check if a key/button was just released this frame
     * @param {string} key - The key to check
     * @returns {boolean} - Whether the key was just released
     */
    function wasReleased(key) {
        return !evt[key] && prevEvt[key];
    }
    
    /**
     * Handle key down events
     * @param {KeyboardEvent} e - The key down event
     */
    function keyDownHandler(e) {
        switch (e.keyCode) {
            case 32: // Space
                evt.space = true;
                GameEvents.publish('input:fire', {});
                break;
            case 37: // Left arrow
                evt.left = true;
                GameEvents.publish('input:left', {});
                break;
            case 38: // Up arrow
                evt.up = true;
                GameEvents.publish('input:up', {});
                break;
            case 39: // Right arrow
                evt.right = true;
                GameEvents.publish('input:right', {});
                break;
            case 40: // Down arrow
                evt.down = true;
                GameEvents.publish('input:down', {
                    purpose: 'magwave' // Down arrow activates magwave
                });
                break;
            case 16: // Shift
                evt.shift = true;
                GameEvents.publish('input:shift', {
                    isPressed: true
                });
                break;
            case 9:  // Tab
                evt.tab = true;
                break;
            case 13: // Enter
                evt.enter = true;
                GameEvents.publish('input:enter', {});
                break;
            case 80: // P (pause)
                if (GameState.getCurrentState() === GameState.STATE.PLAYING) {
                    GameEvents.publish('game:togglePause', {});
                } else if (GameState.getCurrentState() === GameState.STATE.PAUSED) {
                    GameEvents.publish('game:togglePause', {});
                }
                break;
        }
        e.preventDefault();
    }
    
    /**
     * Handle key up events
     * @param {KeyboardEvent} e - The key up event
     */
    function keyUpHandler(e) {
        switch (e.keyCode) {
            case 32: // Space
                evt.space = false;
                GameEvents.publish('input:fireEnd', {});
                break;
            case 37: // Left arrow
                evt.left = false;
                GameEvents.publish('input:leftEnd', {});
                break;
            case 38: // Up arrow
                evt.up = false;
                GameEvents.publish('input:upEnd', {});
                break;
            case 39: // Right arrow
                evt.right = false;
                GameEvents.publish('input:rightEnd', {});
                break;
            case 40: // Down arrow
                evt.down = false;
                GameEvents.publish('input:downEnd', {});
                break;
            case 16: // Shift
                evt.shift = false;
                GameEvents.publish('input:shift', {
                    isPressed: false
                });
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
    
    /**
     * Handle touch start event
     * @param {TouchEvent} event - The touch start event
     */
    function handleStart(event) {
        if (event.changedTouches) {
            evt.touch = true;
            touchX1 = event.touches[0].pageX;
            touchY1 = event.touches[0].pageY;
            
            const canvas = GameState.getCanvas();
            
            // Set touch direction based on screen position
            if (event.touches[0].pageX > canvas.width / 2 + 100) {
                evt.rightTouch = true;
                GameEvents.publish('input:right', { source: 'touch' });
            } else if (event.touches[0].pageX <= canvas.width / 2 - 100) {
                evt.leftTouch = true;
                GameEvents.publish('input:left', { source: 'touch' });
            }
            
            if (event.touches[0].pageY > canvas.height / 2 + 100) {
                evt.downTouch = true;
                GameEvents.publish('input:down', { 
                    source: 'touch',
                    purpose: 'magwave'
                });
            } else if (event.touches[0].pageY <= canvas.height / 2 - 100) {
                evt.upTouch = true;
                GameEvents.publish('input:up', { source: 'touch' });
            }
            
            // Handle multi-touch for pause or revive
            if (event.touches.length > 1) {
                if (GameState.isPlayerDead()) {
                    // Use the proper API to revive hero
                    GameState.setPlayerUndead(true);
                    GameEvents.publish('player:revive', {});
                } else if (GameState.getCurrentState() === GameState.STATE.PLAYING) {
                    GameEvents.publish('game:togglePause', {});
                } else if (GameState.getCurrentState() === GameState.STATE.PAUSED) {
                    GameEvents.publish('game:togglePause', {});
                }
            }
        }
    }
    
    /**
     * Handle touch end event
     * @param {TouchEvent} event - The touch end event
     */
    function handleEnd(event) {
        if (event.changedTouches) {
            event.preventDefault();
            touchX2 = event.changedTouches[0].pageX;
            touchY2 = event.changedTouches[0].pageY;
            
            if (evt.rightTouch) {
                GameEvents.publish('input:rightEnd', { source: 'touch' });
            }
            
            if (evt.leftTouch) {
                GameEvents.publish('input:leftEnd', { source: 'touch' });
            }
            
            if (evt.downTouch) {
                GameEvents.publish('input:downEnd', { source: 'touch' });
            }
            
            if (evt.upTouch) {
                GameEvents.publish('input:upEnd', { source: 'touch' });
            }
            
            evt.touch = false;
            evt.rightTouch = false;
            evt.leftTouch = false;
            evt.downTouch = false;
            evt.upTouch = false;
        }
    }
    
    /**
     * Handle device orientation for tilt controls
     * @param {DeviceOrientationEvent} event - The device orientation event
     */
    function handleOrientation(event) {
        const oldTiltLeft = evt.tiltLeft;
        const oldTiltRight = evt.tiltRight;
        
        if (event.gamma > 3) {
            evt.tiltLeft = false;
            evt.tiltRight = true;
            
            if (!oldTiltRight) {
                GameEvents.publish('input:right', { source: 'tilt' });
            }
        } else if (event.gamma < -3) {
            evt.tiltRight = false;
            evt.tiltLeft = true;
            
            if (!oldTiltLeft) {
                GameEvents.publish('input:left', { source: 'tilt' });
            }
        } else if (event.gamma >= -3 && event.gamma <= 3) {
            if (oldTiltLeft) {
                GameEvents.publish('input:leftEnd', { source: 'tilt' });
            }
            if (oldTiltRight) {
                GameEvents.publish('input:rightEnd', { source: 'tilt' });
            }
            
            evt.tiltRight = false;
            evt.tiltLeft = false;
        }
        event.preventDefault();
    }
    
    /**
     * Handle device motion as a fallback for orientation
     * @param {DeviceMotionEvent} event - The device motion event
     */
    function handleMotion(event) {
        const oldTiltLeft = evt.tiltLeft;
        const oldTiltRight = evt.tiltRight;
        
        if (event.acceleration.x > 5) {
            evt.tiltLeft = false;
            evt.tiltRight = true;
            
            if (!oldTiltRight) {
                GameEvents.publish('input:right', { source: 'motion' });
            }
        } else if (event.acceleration.x < -5) {
            evt.tiltRight = false;
            evt.tiltLeft = true;
            
            if (!oldTiltLeft) {
                GameEvents.publish('input:left', { source: 'motion' });
            }
        } else {
            if (oldTiltLeft) {
                GameEvents.publish('input:leftEnd', { source: 'motion' });
            }
            if (oldTiltRight) {
                GameEvents.publish('input:rightEnd', { source: 'motion' });
            }
            
            evt.tiltRight = false;
            evt.tiltLeft = false;
        }
        event.preventDefault();
    }
    
    // Public API
    return {
        init: init,
        update: update,
        wasPressed: wasPressed,
        wasReleased: wasReleased,
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