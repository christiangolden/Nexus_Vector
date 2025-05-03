var canvas = document.getElementById("myCanvas");
canvas.width = document.body.clientWidth;
canvas.height = document.body.clientHeight;
var ctx = canvas.getContext("2d");

var wait = false; //delay between hero bullets

var start = false;

var deadHero = false;
var unDeadHero = false;

var shotDrones = 0;
var destDust = 0;

var gamePaused = false;
var speed = 7;
var score = 0;

//range of magwave mag power
var mwRange = (canvas.width * canvas.height) * 0.0004;

//magwave duration
var mwEnergy = 5;

var bulletList = [];
var heroBulletList = [];

var dock = "\u27D0\uFE0E"; //place to land ship on generated room
var docking = false;

var man = [
    "@", //walking hero after docked
    0,
    0];

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

function randColor() {
    'use strict';
    return Math.floor(Math.random() * 255);
}

// Cache commonly used values and colors
var cachedColors = [];
var colorUpdateInterval = 10;
var frameCount = 0;

// Pre-generate some colors to avoid constant randomization
function initColorCache() {
    'use strict';
    for (var i = 0; i < 20; i++) {
        cachedColors.push("rgb(" + randColor() + "," + randColor() + "," + randColor() + ")");
    }
}

function getRandomCachedColor() {
    'use strict';
    return cachedColors[Math.floor(Math.random() * cachedColors.length)];
}

// Replace the original randRGB function with cached version
function randRGB() {
    'use strict';
    // Update colors periodically instead of every frame
    if (frameCount % colorUpdateInterval === 0) {
        var index = Math.floor(Math.random() * cachedColors.length);
        cachedColors[index] = "rgb(" + randColor() + "," + randColor() + "," + randColor() + ")";
    }
    return getRandomCachedColor();
}

// Call this at startup
initColorCache();

function Creature(x, y, size) {
    'use strict';
    this.x = x;
    this.y = y;
    this.size = size;
}

function Room(x, y, width, height) {
    'use strict';
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;

}

var roomList = [];
var ratList = [];

var i, j, randX, randY, randWidth, randHeight;

function generateRooms() {
    'use strict';
    var numFloor = Math.floor(Math.random() * 10 + 5);
    for (i = 0; i < numFloor; i += 1) {
        if (roomList.length > 0) {
            randX = roomList[i - 1].x + Math.floor(Math.random() * -roomList[i - 1].width) +
                    roomList[i -1].width / 2;
            randY = roomList[i - 1].y + Math.floor(Math.random() * roomList[i - 1].height);
            randWidth = Math.floor(Math.random() * canvas.width / 2 + 100);

            randHeight = Math.floor(Math.random() * canvas.height / 2 + 100);
            roomList[i] = new Room(randX, randY, randWidth, randHeight);
        } else {
            randX = Math.floor(Math.random() * canvas.width / 2) - canvas.width / 2;
            randY = Math.floor(Math.random() * -canvas.height * numFloor) - canvas.height;
            randWidth = Math.floor(Math.random() * canvas.width / 2 + 100);
            randHeight = Math.floor(Math.random() * canvas.height / 2 + 100);
            roomList[i] = new Room(randX, randY, randWidth, randHeight);
        }
        ratList[ratList.length] = new Creature(roomList[i].x +
                                      roomList[i].width * Math.random(),
                                      roomList[i].y +
                                      roomList[i].height * Math.random(),
                                      12);
    }
}

function drawRooms() {
    'use strict';
    for (i = 0; i < roomList.length; i += 1) {
        ctx.beginPath();
        ctx.moveTo(roomList[i].x, roomList[i].y);
        ctx.lineTo(roomList[i].x + roomList[i].width, roomList[i].y);
        ctx.lineTo(roomList[i].x + roomList[i].width, roomList[i].y + roomList[i].height);
        ctx.lineTo(roomList[i].x, roomList[i].y + roomList[i].height);
        ctx.lineTo(roomList[i].x, roomList[i].y);
        ctx.fillStyle = "#222";
        ctx.fill();
        ctx.closePath();
    }
}

function drawRats() {
    'use strict';
    for (i = 0; i < ratList.length; i += 1) {
        ctx.font = "12px Consolas";
        ctx.fillStyle = "rgb(128,128,0)";
        ctx.fillText("r", ratList[i].x, ratList[i].y);
    }
}

function drawDock() {
    'use strict';
    ctx.font = "48px Consolas";
    ctx.fillStyle = randRGB();
    for (i = 0; i < roomList.length; i += 1) {
        ctx.fillText(dock, roomList[i].x + (roomList[i].width / 2), roomList[i].y + (roomList[i].height / 2));
    }
}

function drawMan() {
    'use strict';
    ctx.font = "16px Consolas";
    ctx.fillStyle = randRGB();
    ctx.fillText(man[0], man[1], man[2]);
}

function Ship(orientation, width, height, tipX, tipY) {
    'use strict';
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


function Bullet(width, height, x, y) {
    'use strict';
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
}

var hero = new Ship("up", 20, 40, canvas.width / 2, canvas.height - 50);
var badguy = new Ship("down", 20, 40,
                      Math.floor(Math.random() * canvas.width), 0);

var dust = {
	width: 14,
	height: 14,
	xList: [],
	yList: [],
	x: 0,
	y: 0
};

// Improved collision detection functions
function isColliding(x1, y1, width1, height1, x2, y2, width2, height2) {
    'use strict';
    return x1 < x2 + width2 && 
           x1 + width1 > x2 && 
           y1 < y2 + height2 && 
           y1 + height1 > y2;
}

// Optimize drawHero function with better collision detection
function drawHero() {
    'use strict';
    // Use iterators correctly to avoid out-of-bounds
    for (i = 0; i < dust.xList.length; i += 1) {
        if (isColliding(dust.xList[i], dust.yList[i], dust.width, dust.height,
                       hero.leftX, hero.tipY, hero.width, hero.height)) {
            dust.xList.splice(i, 1);
            dust.yList.splice(i, 1);
            destDust += 1;
            deadHero = true;
            // Important: adjust loop counter when removing element
            i -= 1;
        }
    }
    
    hero.leftX = hero.tipX - hero.width/2;
    hero.rightX = hero.tipX + hero.width/2;
    ctx.beginPath();
    ctx.moveTo(hero.tipX, hero.tipY);
    ctx.lineTo(hero.rightX, hero.rightY);
    ctx.lineTo(hero.leftX, hero.leftY);
    ctx.lineTo(hero.tipX, hero.tipY);
    ctx.fillStyle = randRGB();
    ctx.fill();
    ctx.closePath();
}

function drawEnemy() {
    'use strict';
    badguy.leftY = badguy.tipY - badguy.height;
    badguy.rightY = badguy.tipY - badguy.height;
    badguy.leftX = badguy.tipX - 10;
    badguy.rightX = badguy.tipX + 10;
    badguy.leftX = badguy.tipX - 10;
    badguy.rightX = badguy.tipX + 10;
    
    if (badguy.tipX > (hero.tipX + 5) && badguy.tipY < hero.tipY) {
        badguy.leftX -= 5;
        badguy.rightX -= 5;
        badguy.tipX -= 5;
        badguy.tipY += 5;
    } else if (badguy.tipX < (hero.tipX - 5) && badguy.tipY < hero.tipY) {
        badguy.leftX += 5;
        badguy.rightX += 5;
        badguy.tipX += 5;
        badguy.tipY += 5;
    } else if (badguy.tipY > canvas.height + badguy.height) {
        badguy = new Ship("down", 20, 40, Math.floor(Math.random() * canvas.width), 0);
    } else {
        badguy.tipY += 7;
    }
    badguy.width = badguy.rightX - badguy.leftX;
    ctx.beginPath();
    ctx.moveTo(badguy.tipX, badguy.tipY);
    ctx.lineTo(badguy.rightX, badguy.rightY);
    ctx.lineTo(badguy.leftX, badguy.leftY);
    ctx.lineTo(badguy.tipX, badguy.tipY);
    ctx.fillStyle = randRGB();
    ctx.fill();
    ctx.closePath();
}

//stars
var star = {
	size: 1,
	xList: [],
	yList: [],
	x: 0,
	y: 0
};

var magWave = {
    x: hero.tipX,
    y: canvas.height - hero.height * 2,
    radius: 0,
    startAngle: 0,
    endAngle: 2 * Math.PI
};

// Create a dust object pool similar to bullets
var dustPool = {
    pool: [],
    maxSize: 40,
    
    init: function() {
        'use strict';
        for (var i = 0; i < this.maxSize; i++) {
            this.pool.push({
                x: 0,
                y: 0
            });
        }
    },
    
    get: function(x, y) {
        'use strict';
        if (this.pool.length > 0) {
            var dustParticle = this.pool.pop();
            dustParticle.x = x;
            dustParticle.y = y;
            return dustParticle;
        }
        return { x: x, y: y };
    },
    
    recycle: function(dustParticle) {
        'use strict';
        if (this.pool.length < this.maxSize) {
            this.pool.push(dustParticle);
        }
    }
};

// Initialize dust pool
dustPool.init();

// Optimized dust generation
function genDustXY() {
    'use strict';
    // Limit max number of dust particles for performance
    var maxDustCount = 100;
    
    if (dust.xList.length < maxDustCount && Math.floor(Math.random() * 50) === 1) {
        var x = Math.floor(Math.random() * (canvas.width - dust.width) + 1);
        var y = Math.floor(Math.random() * -canvas.height - dust.height);
        
        var dustParticle = dustPool.get(x, y);
        dust.xList.push(dustParticle.x);
        dust.yList.push(dustParticle.y);
    }
}

// Optimized dust drawing with batch rendering
function drawDust() {
    'use strict';
    genDustXY();
    
    // Use a single color for all dust particles in each frame
    // to reduce style changes which are costly
    ctx.fillStyle = randRGB();
    
    for (i = 0; i < dust.yList.length; i += 1) {
        if (dust.yList[i] >= canvas.height) {
            // Recycle dust particles that go off screen
            var recycledX = dust.xList.splice(i, 1)[0];
            var recycledY = dust.yList.splice(i, 1)[0];
            dustPool.recycle({x: recycledX, y: recycledY});
            i -= 1;
        } else {
            // Begin batch rendering - don't change styles between draws
            ctx.fillRect(dust.xList[i], dust.yList[i], dust.width, dust.height);
        }
    }
}

// Optimize star creation and rendering
var starMaxCount = 150; // Fewer stars for better performance

function genStarXY() {
    'use strict';
    // Only generate stars if we're below the limit
    if (star.xList.length < starMaxCount && Math.floor(Math.random() * 3) === 1) {
        star.x = Math.floor(Math.random() * -canvas.width) +
            Math.floor(Math.random() * canvas.width * 2);
        star.y = Math.floor(Math.random() * -canvas.height) +
            Math.floor(Math.random() * canvas.height);
        star.xList.push(star.x);
        star.yList.push(star.y);
    }
}

// Create a star size cache to avoid recalculating for each star
var starSizes = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
var starSizeCache = {};

// Precompute font settings for each star size
function initStarSizeCache() {
    'use strict';
    for (var i = 0; i < starSizes.length; i++) {
        starSizeCache[starSizes[i]] = starSizes[i] + "px Courier";
    }
}

// Call this at startup
initStarSizeCache();

function drawStars() {
    'use strict';
    if (star.xList.length < starMaxCount) {
        genStarXY();
    }
    
    // Batch rendering for stars
    ctx.textAlign = "center";
    
    for (i = 0; i < star.yList.length; i += 1) {
        // Use a predefined set of sizes instead of random generation each time
        var sizeIndex = Math.floor(Math.random() * starSizes.length);
        star.size = starSizes[sizeIndex];
        
        // Use cached font string
        ctx.font = starSizeCache[star.size];
        ctx.fillStyle = randRGB();
        ctx.fillText("*", star.xList[i], star.yList[i] + star.size / 2);
    }
}

function drawMagWave() {
    'use strict';
    ctx.beginPath();
    ctx.arc(hero.tipX, hero.tipY - hero.height, magWave.radius, magWave.startAngle, magWave.endAngle);
    ctx.strokeStyle = randRGB();
    ctx.lineWidth = mwEnergy;
    ctx.stroke();
    ctx.closePath();
}

function startScreen() {
    'use strict';
    if (!(evt.enter || evt.leftTouch || evt.rightTouch)) {
        ctx.font = "40px Consolas";
        ctx.fillStyle = randRGB();
        ctx.textAlign = "center";
        ctx.fillText("NEXUS \u2A58\u2A57 VECTOR", canvas.width / 2, canvas.height / 2);
        ctx.font = "20px Courier New";
        ctx.fillText("PRESS ENTER OR TAP TO START", canvas.width / 2, canvas.height / 2 + 40);
    } else {
        
        generateRooms();
        start = true;
    }
}

function drawScore() {
    'use strict';
    ctx.textAlign = "end";
    ctx.fillStyle = randRGB();
    ctx.font = "18px Consolas";
    ctx.fillText("Stardust Collected:" + score, canvas.width - 12, 22);
    ctx.fillStyle = randRGB();
    ctx.fillText("Stardust Destroyed:" + destDust, canvas.width - 12, 42);
    ctx.fillStyle = randRGB();
    ctx.fillText("Drones Destroyed:" + shotDrones, canvas.width - 12, 62);
}

function drawHelps() {
    'use strict';
    drawScore();
    ctx.font = "18px Consolas";
    ctx.fillStyle = randRGB();
    ctx.textAlign = "start";
    ctx.fillText("Move:             <-/-> or Tilt", 5, canvas.height - 60);
    ctx.fillStyle = randRGB();
    ctx.fillText("Shoot:            Space/Touch Right", 5, canvas.height - 42);
    ctx.fillStyle = randRGB();
    ctx.fillText("MagWave:     Down/Touch Left", 5, canvas.height - 24);
    ctx.fillStyle = randRGB();
    ctx.fillText("Resume:         p/Multi-Touch", 5, canvas.height - 6);
    ctx.textAlign = "center";
    ctx.fillStyle = randRGB();
    ctx.font = "48px Consolas";
    ctx.fillText("| |", canvas.width / 2, canvas.height / 2);
}

function drawGameOver() {
    'use strict';
    drawRooms();
    ctx.font = "48px Consolas";
    ctx.fillStyle = randRGB();
    ctx.textAlign = "center";
    ctx.fillText("\u2620", canvas.width / 2, canvas.height / 2);
}

// Object pool implementation for bullets
var bulletPool = {
    pool: [],
    maxSize: 30,
    
    init: function() {
        'use strict';
        for (var i = 0; i < this.maxSize; i++) {
            this.pool.push(new Bullet(2, 16, 0, 0));
        }
    },
    
    get: function(x, y) {
        'use strict';
        if (this.pool.length > 0) {
            var bullet = this.pool.pop();
            bullet.x = x;
            bullet.y = y;
            return bullet;
        }
        return new Bullet(2, 16, x, y); // Fallback if pool is empty
    },
    
    recycle: function(bullet) {
        'use strict';
        if (this.pool.length < this.maxSize) {
            this.pool.push(bullet);
        }
    }
};

// Initialize the object pool
bulletPool.init();

// Updated bullet functions to use object pooling
function drawBullets() {
    'use strict';
    if (Math.floor(Math.random() * 10) === 3 && badguy.tipY > 0) {
        bulletList.push(bulletPool.get(badguy.tipX - 1, badguy.tipY - 9));
    }
    for (i = 0; i < bulletList.length; i += 1) {
        if (bulletList[i].y < canvas.height) {
            bulletList[i].y += 10;
            ctx.beginPath();
            ctx.rect(bulletList[i].x, bulletList[i].y, bulletList[i].width, bulletList[i].height);
            ctx.fillStyle = randRGB();
            ctx.fill();
        } else {
            // Recycle bullets that are off-screen
            var bullet = bulletList.splice(i, 1)[0];
            bulletPool.recycle(bullet);
            i -= 1;
        }
    }
}

function drawHeroBullets() {
    'use strict';
    if (wait) {
        timer += 1;
        if (timer === 7) {
            wait = false;
        }
    } else {
        if (evt.space || evt.rightTouch) {
            heroBulletList.push(bulletPool.get(hero.tipX - 1, hero.tipY));
            timer = 0;
            wait = true;
        }
    }
    
    for (i = 0; i < heroBulletList.length; i += 1) {
        if (heroBulletList[i].y < 1) {
            var recycledBullet = heroBulletList.splice(i, 1)[0];
            bulletPool.recycle(recycledBullet);
            i -= 1;
            continue;
        }
        
        if (heroBulletList[i].y > 0) {
            heroBulletList[i].y -= 20;
            ctx.beginPath();
            ctx.rect(heroBulletList[i].x, heroBulletList[i].y, heroBulletList[i].width, heroBulletList[i].height);
            ctx.fillStyle = randRGB();
            ctx.fill();
        }
        
        // Check for bullet collision with dust
        for (j = 0; j < dust.xList.length; j += 1) {
            if (isColliding(heroBulletList[i].x, heroBulletList[i].y, 
                           heroBulletList[i].width, heroBulletList[i].height,
                           dust.xList[j], dust.yList[j], dust.width, dust.height)) {
                destDust += 1;
                dust.yList.splice(j, 1);
                dust.xList.splice(j, 1);
                
                var bulletToRecycle = heroBulletList.splice(i, 1)[0];
                bulletPool.recycle(bulletToRecycle);
                i -= 1;
                break;
            }
        }
    }
}

var timer = 0;

function moveHeroRight() {
    'use strict';
    if (evt.shift) {
        for (i = 0; i < star.xList.length; i += 1) {
            star.xList[i] -= speed;
        }
        for (i = 0; i < roomList.length; i += 1) {
            roomList[i].x -= speed;
        }
        for (i = 0; i < ratList.length; i += 1) {
            ratList[i].x -= speed;
        }
        for (i = 0; i < dust.xList.length; i += 1) {
            dust.xList[i] -= speed;
        }
        for (i = 0; i < bulletList.length; i += 1) {
            bulletList[i].x -= speed;
        }
        badguy.leftX -= speed;
        badguy.rightX -= speed;
        badguy.tipX -= speed;
    } else {
        if (hero.leftX >= canvas.width) {
            hero.tipX -= canvas.width + hero.width;
        } else {
            hero.tipX += speed;
        }
    }
}

function moveHeroLeft() {
    'use strict';
    if (evt.shift) {
        for (i = 0; i < star.xList.length; i += 1) {
            star.xList[i] += speed;
        }
        for (i = 0; i < roomList.length; i += 1) {
            roomList[i].x += speed;
        }
        for (i = 0; i < ratList.length; i += 1) {
            ratList[i].x += speed;
        }
        for (i = 0; i < dust.xList.length; i += 1) {
            dust.xList[i] += speed;
        }
        for (i = 0; i < bulletList.length; i += 1) {
            bulletList[i].x += speed;
        }
        badguy.leftX += speed;
        badguy.rightX += speed;
        badguy.tipX += speed;
    } else {
        if (hero.rightX <= 0) {
            hero.tipX += canvas.width + hero.width;
        } else {
            hero.tipX -= speed;
        }
    }
}


function moveManLeft() {
    'use strict';
    var i;
    hero.tipX += 1;
    hero.leftX += 1;
    hero.rightX += 1;
    for (i = 0; i < roomList.length; i += 1) {
        roomList[i].x += 1;
    }
    for (i = 0; i < ratList.length; i += 1) {
        ratList[i].x += 1;
    }

    for (i = 0; i < star.xList.length; i += 1) {
        star.xList[i] += 1;
    }
}

function moveManRight() {
    'use strict';
    var i;
    hero.tipX -= 1;
    hero.leftX -= 1;
    hero.rightX -= 1;
    for (i = 0; i < roomList.length; i += 1) {
        roomList[i].x -= 1;
    }
    for (i = 0; i < ratList.length; i += 1) {
        ratList[i].x -= 1;
    }
    for (i = 0; i < star.xList.length; i += 1) {
        star.xList[i] -= 1;
    }

}

function moveManUp() {
    'use strict';
    var i;
    hero.tipY += 1;
    hero.rightY += 1;
    hero.leftY += 1;
    for (i = 0; i < roomList.length; i += 1) {
        roomList[i].y += 1;
    }
    for (i = 0; i < ratList.length; i += 1) {
        ratList[i].y += 1;
    }
    for (i = 0; i < star.xList.length; i += 1) {
        star.yList[i] += 1;
    }

}

function moveManDown() {
    'use strict';
    var i;
    hero.tipY -= 1;
    hero.rightY -= 1;
    hero.leftY -= 1;
    for (i = 0; i < roomList.length; i += 1) {
        roomList[i].y -= 1;
    }
    for (i = 0; i < ratList.length; i += 1) {
        ratList[i].y -= 1;
    }
    for (i = 0; i < star.xList.length; i += 1) {
        star.yList[i] -= 1;
    }

}

function inRoom(x, y) {
    'use strict';
    for (i = 0; i < roomList.length; i += 1) {
        if (x < roomList[i].x + roomList[i].width &&
                x > roomList[i].x &&
                y > roomList[i].y &&
                y < roomList[i].y + roomList[i].height) {
            return true;
        }
    }
    return false;
}

function moveStuff() {
    'use strict';
    var i;
    
    if ((evt.down || evt.leftTouch) && mwEnergy > 0 && !docking) {
        if (magWave.radius < hero.width) {
            magWave.radius += 0.5;
            mwEnergy -= 0.02;
        } else {
            magWave.radius = 0;
        }
        drawMagWave();
    } else {
        magWave.radius = 0;
    }

    if ((!(evt.down || evt.leftTouch)) && mwEnergy < 5) {
        mwEnergy += 0.05;
    }
    
    
    if ((evt.right || evt.tiltRight) && !docking) {
        moveHeroRight();
    }
    if ((evt.left || evt.tiltLeft) && !docking) {
        moveHeroLeft();
    }
    
                    
    for (i = 0; i < ratList.length; i += 1) {
        randX = Math.random() * 2 - 1;
        randY = Math.random() * 2 - 1;
        if (inRoom(ratList[i].x + randX, ratList[i].y)) {
            ratList[i].x += randX;
        }
        if (inRoom(ratList[i].x, ratList[i].y + randY)) {
            ratList[i].y += randY;
        }
    }
    
    for (i = 0; i < dust.yList.length; i += 1) {
        if ((evt.down || evt.leftTouch) && dust.xList[i] > hero.tipX &&
                    dust.xList[i] < (hero.tipX + mwRange) &&
                    dust.yList[i] < hero.tipY - hero.height &&
                    dust.yList[i] > (hero.tipY - hero.height - mwRange) &&
                    mwEnergy > 0) {
            dust.xList[i] -= 3;
            dust.yList[i] += 5;
        } else if ((evt.down || evt.leftTouch) && dust.xList[i] > hero.tipX &&
                    dust.xList[i] < (hero.tipX + mwRange) &&
                    dust.yList[i] > hero.tipY - hero.height && mwEnergy > 0) {
            dust.xList[i] -= 3;
            dust.yList[i] -= 5;
        } else if ((evt.down || evt.leftTouch) && dust.xList[i] < hero.tipX &&
                   dust.xList[i] > (hero.tipX - mwRange) &&
                   dust.yList[i] < hero.tipY - hero.height &&
                   dust.yList[i] > (hero.tipY - hero.height - mwRange) &&
                    mwEnergy > 0) {
            dust.xList[i] += 3;
            dust.yList[i] += 5;
        } else if ((evt.down || evt.leftTouch) && dust.xList[i] < hero.tipX &&
                   dust.xList[i] > (hero.tipX - mwRange) &&
                   dust.yList[i] > hero.tipY - hero.height && mwEnergy > 0) {
            dust.xList[i] += 3;
            dust.yList[i] -= 5;
        } else {
            dust.yList[i] += Math.floor(Math.random() * 5 + 3);
            dust.xList[i] += Math.floor(Math.random() * -5 + 3);
        }

        if ((evt.down || evt.leftTouch) && dust.xList[i] <= hero.tipX + 3 &&
                dust.xList[i] >= hero.tipX - magWave.radius - dust.width &&
                dust.xList[i] <= hero.tipX + magWave.radius + dust.width &&
                dust.yList[i] >= hero.tipY - hero.height - magWave.radius &&
                dust.yList[i] <= hero.tipY - hero.height + magWave.radius &&
                mwEnergy > 0) {
            dust.xList.splice(i, 1);
            dust.yList.splice(i, 1);
            score += 1;
        }
    }
}

// Original resizeCanvas function remains with added mwRange recalculation
function resizeCanvas() {
    'use strict';
    canvas = document.getElementById("myCanvas");
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
    ctx = canvas.getContext("2d");
    
    // Update range calculation on resize
    mwRange = (canvas.width * canvas.height) * 0.0004;
}

window.addEventListener('resize', resizeCanvas, false);
window.addEventListener('orientationchange', resizeCanvas, false);
    
// Add performance monitoring and FPS counter
var fpsCounter = {
    frameCount: 0,
    lastTime: 0,
    fps: 0,
    
    update: function(now) {
        'use strict';
        // Update every second
        if (!this.lastTime) { 
            this.lastTime = now;
            return;
        }
        
        this.frameCount++;
        
        // If a second has passed
        if (now - this.lastTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = now;
        }
    },
    
    draw: function() {
        'use strict';
        if (this.fps > 0) {
            ctx.font = "14px Consolas";
            ctx.fillStyle = "#FFF";
            ctx.textAlign = "start";
            ctx.fillText("FPS: " + this.fps, 10, 20);
        }
    }
};

// Update main game loop to include FPS counter
function drawGame(timestamp) {
    'use strict';
    var xdist, ydist;
    
    // Update FPS counter
    fpsCounter.update(timestamp);
    
    // Increment frame counter for color rotation and other timing
    frameCount++;
    
    if (start) {
        if (!gamePaused) {
            if (!deadHero) {
                if (!docking) {
                    //draw/update game screen
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    drawStars();
                    drawRooms();
                    if (roomList.length > 0 && roomList[0].y >= canvas.height) {
                        roomList.splice(0, roomList.length);
                        generateRooms();
                        drawRooms();
                    }
                    drawRats();
                    
                    // Batch operations for better performance
                    var roomLength = roomList.length;
                    for (i = 0; i < roomLength; i += 1) {
                        roomList[i].y += 0.5;
                    }
                    
                    var ratLength = ratList.length;
                    for (i = 0; i < ratLength; i += 1) {
                        ratList[i].y += 0.5;
                    }
                    
                    drawDock();
                    drawDust();
                    drawHero();
                    drawHeroBullets();
                    drawScore();
                    moveStuff();

                    // Use isColliding for docking detection
                    for (i = 0; i < roomList.length; i += 1) {
                        if (isColliding(
                            hero.tipX - 5, hero.tipY - 5, 10, 10,
                            roomList[i].x + (roomList[i].width / 2) - 15,
                            roomList[i].y + (roomList[i].height / 2) - 15,
                            30, 30)) {
                            ctx.fillText("Docking...", hero.tipX, hero.tipY);
                            docking = true;
                            man[1] = hero.tipX;
                            man[2] = hero.tipY;
                            break;
                        }
                    }
                    
                    // Use improved collision detection for hero bullets hitting badguy
                    for (i = 0; i < heroBulletList.length; i += 1) {
                        if (isColliding(
                            heroBulletList[i].x, heroBulletList[i].y,
                            heroBulletList[i].width, heroBulletList[i].height,
                            badguy.leftX, badguy.leftY,
                            badguy.width, badguy.tipY - badguy.leftY) && badguy.tipY > 0) {
                            shotDrones += 1;
                            badguy = new Ship("down", 20, 40, Math.floor(Math.random() * canvas.width),
                                            Math.floor(Math.random() * -canvas.height));
                            var recycledHeroBullet = heroBulletList.splice(i, 1)[0];
                            bulletPool.recycle(recycledHeroBullet);
                            i -= 1;
                            break;
                        }
                    }
                    
                    drawEnemy();
                    drawBullets();
                    
                    // Improved collision detection for bullets hitting hero
                    for (i = 0; i < bulletList.length; i += 1) {
                        if (isColliding(
                            bulletList[i].x, bulletList[i].y,
                            bulletList[i].width, bulletList[i].height,
                            hero.leftX, hero.tipY,
                            hero.width, hero.height)) {
                            var recycledEnemyBullet = bulletList.splice(i, 1)[0];
                            bulletPool.recycle(recycledEnemyBullet);
                            i -= 1;
                            deadHero = true;
                        }
                    }

                    // Improved double-loop collision detection for bullets and dust
                    for (i = 0; i < bulletList.length; i += 1) {
                        for (j = 0; j < dust.xList.length; j += 1) {
                            if (isColliding(
                                bulletList[i].x, bulletList[i].y,
                                bulletList[i].width, bulletList[i].height,
                                dust.xList[j], dust.yList[j],
                                dust.width, dust.height)) {
                                var recycledBullet = bulletList.splice(i, 1)[0];
                                bulletPool.recycle(recycledBullet);
                                dust.xList.splice(j, 1);
                                dust.yList.splice(j, 1);
                                destDust += 1;
                                i -= 1;
                                break;
                            }
                        }
                    }

                    // Process stars with optimized loop
                    var starLength = star.xList.length;
                    for (i = 0; i < starLength; i += 1) {
                        if (star.yList[i] < canvas.height * 2) {
                            star.yList[i] += 1;
                        } else {
                            star.yList.splice(i, 1);
                            star.xList.splice(i, 1);
                            i -= 1;
                            starLength -= 1;
                        }
                    }

                    // Use isColliding for badguy-dust collision
                    var dustLength = dust.xList.length;
                    for (i = 0; i < dustLength; i += 1) {
                        if (isColliding(
                            dust.xList[i], dust.yList[i],
                            dust.width, dust.height,
                            badguy.leftX, badguy.leftY,
                            badguy.width, badguy.tipY - badguy.leftY)) {
                            dust.xList.splice(i, 1);
                            dust.yList.splice(i, 1);
                            destDust += 1;
                            i -= 1;
                            dustLength -= 1;
                        }
                    }

                    // Use isColliding for badguy-hero collision
                    if (isColliding(
                        badguy.leftX, badguy.leftY,
                        badguy.width, badguy.tipY - badguy.leftY,
                        hero.leftX, hero.tipY,
                        hero.width, hero.height)) {
                        deadHero = true;
                    }
                    
                    // More efficient bullet recycling
                    var bulletCount = bulletList.length;
                    for (i = 0; i < bulletCount; i += 1) {
                        if (bulletList[i].y > canvas.height) {
                            var outOfBoundsBullet = bulletList.splice(i, 1)[0];
                            bulletPool.recycle(outOfBoundsBullet);
                            i -= 1;
                            bulletCount -= 1;
                        }
                    }
                }
                // The rest of the docking case remains the same
                else {
                    badguy = new Ship("down", 20, 40, Math.floor(Math.random() * canvas.width), 0);
                    bulletList.splice(0, bulletList.length);
                    heroBulletList.splice(0, heroBulletList.length);
                    dust.xList.splice(0, dust.xList.length);
                    dust.yList.splice(0, dust.yList.length);
                    
                    xdist = canvas.width / 2 - man[1];
                    ydist = canvas.height / 2 - man[2];
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    
                    if (Math.abs(xdist)) {
                        man[1] += xdist / 20;
                        hero.tipX += xdist / 20;
                        hero.leftX += xdist / 20;
                        hero.rightX += xdist / 20;

                        for (i = 0; i < roomList.length; i += 1) {
                            roomList[i].x += xdist / 20;
                        }
                        for (i = 0; i < ratList.length; i += 1) {
                            ratList[i].x += xdist / 20;
                        }
                    }
                    if (Math.abs(ydist)) {
                        man[2] += ydist / 20;
                        hero.tipY += ydist / 20;
                        hero.leftY += ydist / 20;
                        hero.rightY += ydist / 20;
                        for (i = 0; i < roomList.length; i += 1) {
                            roomList[i].y += ydist / 20;
                        }
                        for (i = 0; i < ratList.length; i += 1) {
                            ratList[i].y += ydist / 20;
                        }
                    }

                    drawStars();
                    drawRooms();
                    drawRats();
                    drawDock();
                    drawHero();
                    drawMan();
                    moveStuff();
                    if ((evt.right || evt.rightTouch) && inRoom(man[1] + 8, man[2])) {
                        moveManRight();
                    }
                    if ((evt.left || evt.leftTouch) && inRoom(man[1] - 7, man[2])) {
                        moveManLeft();
                    }
                    if ((evt.down || evt.downTouch) && inRoom(man[1], man[2] + 5)) {
                        moveManDown();
                    }
                    if ((evt.up || evt.upTouch) && inRoom(man[1], man[2] - 10)) {
                        moveManUp();
                    }
                    for (i = 0; i < star.xList.length; i += 1) {
                        if (star.yList[i] < canvas.height * 2) {
                            star.yList[i] += 0.5;
                        } else {
                            star.yList.splice(i, 1);
                            star.xList.splice(i, 1);
                        }
                    }

                    if (man[1] > hero.leftX && man[1] < hero.rightX &&
                            man[2] > hero.tipY + hero.height / 2 &&
                            man[2] < hero.leftY) {
                        hero.tipY = canvas.height - 50;
                        hero.leftY = hero.tipY + hero.height;
                        hero.rightY = hero.tipY + hero.height;
                        for (i = 0; i < roomList.length; i += 1) {
                            roomList[i].y += canvas.height / 2 + hero.height;
                        }
                        for (i = 0; i < ratList.length; i += 1) {
                            ratList[i].y += canvas.height / 2 + hero.height;
                        }
                        docking = false;
                    }
                    for (i = 0; i < ratList.length; i += 1) {
                        if (man[1] > ratList[i].x - 5 &&
                                man[1] < ratList[i].x + 5 &&
                                man[2] > ratList[i].y - 5 &&
                                man[2] < ratList[i].y + 5) {
                            ctx.fillText("Rat: 'Oy, ya stapped on meh!'",
                                        ratList[i].x, ratList[i].y - ratList[i].size);
                        }
                    }
                }
            } else {
                //reset game upon confirmation of replay
                if (evt.enter || unDeadHero) {
                    score = 0;
                    shotDrones = 0;
                    destDust = 0;
                    badguy = new Ship("down", 20, 40, Math.floor(Math.random() * canvas.width), 0);
                    
                    // Properly recycle all objects
                    while (bulletList.length > 0) {
                        bulletPool.recycle(bulletList.pop());
                    }
                    
                    while (heroBulletList.length > 0) {
                        bulletPool.recycle(heroBulletList.pop());
                    }
                    
                    dust.xList = [];
                    dust.yList = [];
                    roomList = [];
                    ratList = [];
                    deadHero = false;
                    unDeadHero = false;
                    generateRooms();
                }
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawStars();
                drawGameOver();
            }
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawStars();
            drawRooms();
            drawHelps();
        }
    } else {
        //display start screen
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawStars();
        startScreen();
    }
    
    window.requestAnimationFrame(drawGame);
}

// Set initial game state - call object pool initialization before starting game
function initGame() {
    'use strict';
    // Initialize all caches
    initColorCache();
    initStarSizeCache();
    
    // Initialize all object pools
    bulletPool.init();
    dustPool.init();
    
    // Start the game loop
    window.requestAnimationFrame(drawGame);
}

// Replace direct drawGame() call with initGame()
initGame();
