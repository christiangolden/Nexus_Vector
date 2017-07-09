var evt = {
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

function keyDownHandler(e) {
    'use strict';
    if (e.keyCode === 32) {
        evt.space = true;
        e.preventDefault();
    }
    if (e.keyCode === 37) {
        evt.left = true;
        e.preventDefault();
    }
    if (e.keyCode === 38) {
        evt.up = true;
        e.preventDefault();
    }
    if (e.keyCode === 39) {
        evt.right = true;
        e.preventDefault();
    }
    if (e.keyCode === 40) {
        evt.down = true;
        e.preventDefault();
    }
    if (e.keyCode === 16) {
		evt.shift = true;
        e.preventDefault();
    }
    if (e.keyCode === 9) {
        evt.tab = true;
        e.preventDefault();
    }
    if (e.keyCode === 13) {
        evt.enter = true;
        e.preventDefault();
    }
    if (e.keyCode === 80) {
		if (!gamePaused && !deadHero && start) {
			gamePaused = true;
		} else {
			gamePaused = false;
		}
    }
    e.preventDefault();
}
function keyUpHandler(e) {
    'use strict';
    if (e.keyCode === 87) {
        evt.w = false;
        e.preventDefault();
    }
    if (e.keyCode === 39) {
        evt.right = false;
        e.preventDefault();
    }
    if (e.keyCode === 38) {
        evt.up = false;
        e.preventDefault();
    }
    if (e.keyCode === 37) {
        evt.left = false;
        e.preventDefault();
    }
    if (e.keyCode === 32) {
        evt.space = false;
        e.preventDefault();
    }
    if (e.keyCode === 40) {
        evt.down = false;
        e.preventDefault();
    }
    if (e.keyCode === 16) {
		evt.shift = false;
        e.preventDefault();
    }
    if (e.keyCode === 9) {
        evt.tab = false;
        e.preventDefault();
    }
    if (e.keyCode === 13) {
        evt.enter = false;
        e.preventDefault();
    }
    e.preventDefault();
}

var touchX1, touchY1, touchX2, touchY2;
function handleStart(event) {
    'use strict';
    if (event.changedTouches) {
		evt.touch = true;
        touchX1 = event.touches[0].pageX;
        touchY1 = event.touches[0].pageY;
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
        if (event.touches.length > 1) {
            if (deadHero) {
                unDeadHero = true;
            }
            if (!gamePaused && !deadHero) {
                gamePaused = true;
            } else {
                gamePaused = false;
            }
        }
    }
}

function handleEnd(event) {
    'use strict';

    if (event.changedTouches) {
        event.preventDefault();
        touchX2 = event.changedTouches[0].pageX;
        touchY2 = event.changedTouches[0].pageY;
		evt.touch = false;
        evt.rightTouch = false;
        evt.leftTouch = false;
        evt.downTouch = false;
        evt.upTouch = false;
        event.preventDefault();
    }
}

//the following accelerometer function should work for most cases
function handleOrientation(event) {
    'use strict';
    if (event.gamma > 3) {
		evt.tiltLeft = false;
		evt.tiltRight = true;
        event.preventDefault();
    } else if (event.gamma < -3) {
		evt.tiltRight = false;
		evt.tiltLeft = true;
        event.preventDefault();
    } else if (event.gamma >= -3 && event.gamma <= 3) {
		evt.tiltRight = false;
		evt.tiltLeft = false;
        event.preventDefault();
    }
}

//if the above doesn't work, this should.
function handleMotion(event) {
    'use strict';
    if (event.acceleration.x > 5) {
        evt.tiltLeft = false;
        evt.tiltRight = true;
        event.preventDefault();
    } else if (event.acceleration.x < -5) {
        evt.tiltRight = false;
        evt.tiltLeft = true;
        event.preventDefault();
    } else {
        evt.tiltRight = false;
        evt.tiltLeft = false;
        event.preventDefault();
    }
}


document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

//check for browser accelerometer compatibility
if (window.DeviceOrientationEvent) {
    window.addEventListener("deviceorientation", handleOrientation, false);
} else if (window.DeviceMotionEvent) {
    window.addEventListener("devicemotion", handleMotion, false);
}

window.addEventListener("touchstart", handleStart, false);
window.addEventListener("touchend", handleEnd, false);