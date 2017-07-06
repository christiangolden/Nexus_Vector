/*TODO: 
	Design Menu Button/Menu
*/

//set up canvas
var canvas = document.getElementById("myCanvas");
canvas.width = document.body.clientWidth;
canvas.height = document.body.clientHeight;
var ctx = canvas.getContext("2d");

var wait = false; //delay between hero bullets

var downUp = true;
var leftRight = false;
var upDown = false;
var rightLeft = false;

var start = false;
var startColor = 0;

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

function randColor() {
    'use strict';
    return Math.floor(Math.random() * 255);
}

function randRGB() {
    'use strict';
    return ("rgb(" + randColor() + "," + randColor() + "," + randColor() + ")");
}

//event listeners
//events
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
            event.preventDefault();
        } else if (event.touches[0].pageX <= canvas.width / 2 - 100) {
            evt.leftTouch = true;
            event.preventDefault();
        }
        if (event.touches[0].pageY > canvas.height / 2 + 100) {
            evt.downTouch = true;
            event.preventDefault();
        } else if (event.touches[0].pageY <= canvas.height / 2 - 100) {
            evt.upTouch = true;
            event.preventDefault();
        }
        if (event.touches.length > 1) {
            if (deadHero) {
                unDeadHero = true;
                event.preventDefault();
            }
            if (!gamePaused && !deadHero) {
                gamePaused = true;
                event.preventDefault();
            } else {
                gamePaused = false;
                event.preventDefault();
            }
            event.preventDefault();
        }
        event.preventDefault();
    }
    event.preventDefault();
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

function Room(x, y, width, height) {
    'use strict';
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;

}

//var room = new Room(canvas.width / 2, canvas.height / 2, canvas.width / 2, canvas.height / 2);
var roomList = [];
var randX, randY, randWidth, randHeight;
var i, j;
function generateRooms() {
    'use strict';
    var numFloor = Math.floor(Math.random() * 10 + 5);
    for (i = 0; i < numFloor; i += 1) {
        if (roomList.length > 0) {
            randX = roomList[i - 1].x + Math.floor(Math.random() * roomList[i - 1].width);
            randY = roomList[i - 1].y + Math.floor(Math.random() * roomList[i - 1].height);
            randWidth = Math.floor(Math.random() * canvas.width / 2 + 100);

            randHeight = Math.floor(Math.random() * canvas.height / 2 + 100);
            roomList[i] = new Room(randX, randY, randWidth, randHeight);
        } else {
            randX = Math.floor(Math.random() * canvas.width / 2);
            randY = Math.floor(Math.random() * -canvas.height - canvas.height);// / 2);
            randWidth = Math.floor(Math.random() * canvas.width / 2 + 100);
            randHeight = Math.floor(Math.random() * canvas.height / 2 + 100);
            roomList[i] = new Room(randX, randY, randWidth, randHeight);
        }
    }
}
function drawRooms() {
    'use strict';
    var i;
    for (i = 0; i < roomList.length; i += 1) {
        ctx.beginPath();
        ctx.moveTo(roomList[i].x, roomList[i].y);
        ctx.lineTo(roomList[i].x + roomList[i].width, roomList[i].y);
        ctx.lineTo(roomList[i].x + roomList[i].width, roomList[i].y + roomList[i].height);
        ctx.lineTo(roomList[i].x, roomList[i].y + roomList[i].height);
        ctx.lineTo(roomList[i].x, roomList[i].y);
        //ctx.strokeStyle = "#999";
        ctx.fillStyle = "#222";
        ctx.fill();
        //ctx.stroke();
        ctx.closePath();
    }
}

function drawDock() {
    'use strict';
    var i;
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

function drawHero() {
    'use strict';
    var i;
	for (i = 0; i <= dust.xList.length; i += 1) {
        if (dust.xList[i] + dust.width > hero.leftX && dust.xList[i] < hero.rightX &&
                dust.yList[i] > hero.tipY && dust.yList[i] < hero.leftY) {
            dust.xList.splice(i, 1);
            dust.yList.splice(i, 1);
            destDust += 1;
            deadHero = true;
        }
    }
    hero.leftX = hero.tipX - 10;
    hero.rightX = hero.tipX + 10;
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

//generate xy lists for stardust
function genDustXY() {
    'use strict';
    var i;
    if (Math.floor(Math.random() * 50) === 1) {
		dust.x = Math.floor(Math.random() * (canvas.width - dust.width) + 1);
		dust.y = Math.floor(Math.random() * -canvas.height - dust.height);
        dust.xList[dust.xList.length] = dust.x;
        dust.yList[dust.yList.length] = dust.y;
    }
}
//draw stardust
function drawDust() {
    'use strict';
    var i;
	genDustXY();
	for (i = 0; i < dust.yList.length; i += 1) {
	    if (dust.yList[i] >= canvas.height) {
			dust.yList.splice(i, 1);
			dust.xList.splice(i, 1);
	    } else {
            ctx.beginPath();
            ctx.fillStyle = randRGB();
            ctx.fillRect(dust.xList[i], dust.yList[i], dust.width, dust.height);
	    }
	}
}

function genStarXY() {
    'use strict';
    if (Math.floor(Math.random() * 3) === 1) {
		star.x = Math.floor(Math.random() * -canvas.width) +
            Math.floor(Math.random() * canvas.width * 2);
		star.y = Math.floor(Math.random() * -canvas.height) +
            Math.floor(Math.random() * canvas.height);
		star.xList[star.xList.length] = star.x;
		star.yList[star.yList.length] = star.y;
    }
}

function drawStars() {
    'use strict';
    if (star.xList.length < 300) {
        genStarXY();
    }
    var i, randTwinkle;
    for (i = 0; i < star.yList.length; i += 1) {
        star.size = Math.floor(Math.random() * 12 + 10);
        ctx.font = star.size + "px Courier";
        ctx.fillStyle = randRGB();
        ctx.textAlign = "center";
        ctx.fillText("*", star.xList[i], star.yList[i] + star.size / 2);
    }
}

function drawMagWave() {
    'use strict';
    var i;
    ctx.beginPath();
    ctx.arc(hero.tipX, hero.tipY - hero.height, magWave.radius, magWave.startAngle, magWave.endAngle);
    ctx.strokeStyle = randRGB();
    ctx.lineWidth = mwEnergy;
    ctx.stroke();
    ctx.closePath();
}

var titleX = canvas.width;
function drawTitle() {
    'use strict';
    ctx.font = "62px Consolas";
    ctx.fillStyle = randRGB();
    ctx.textAlign = "start";
    ctx.fillText("Nexus \u2A58\u2A57 Vector", titleX, canvas.height / 2);
    if (titleX > -444) {
        titleX -= 1;
    } else {
        titleX = canvas.width;
    }
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

var bulletTimer = 0;
var bulletWait = false;

function drawBullets() {
    'use strict';
    var i;
    if (Math.floor(Math.random() * 10) === 3 && badguy.tipY > 0) {
        bulletList[bulletList.length] = new Bullet(2, 16, badguy.tipX - 1, badguy.tipY - 9);
    }
    for (i = 0; i < bulletList.length; i += 1) {
        if (bulletList[i].y < canvas.height) {
            bulletList[i].y += 10;
            ctx.beginPath();
            ctx.rect(bulletList[i].x, bulletList[i].y, bulletList[i].width, bulletList[i].height);
            ctx.fillStyle = randRGB();
            ctx.fill();
        }
    }
}

var timer = 0;

function drawHeroBullets() {
    'use strict';
    var i, j;
    if (wait) {
        timer += 1;
        if (timer === 7) {
            wait = false;
        }
    } else {
        if (evt.space || evt.rightTouch) {
            heroBulletList[heroBulletList.length] = new Bullet(2, 16, hero.tipX - 1, hero.tipY);
            timer = 0;
            wait = true;
        }
    }
    for (i = 0; i < heroBulletList.length; i += 1) {
        if (heroBulletList[i].y < 1) {
            heroBulletList.splice(i, 1);
            break;
        }
        if (heroBulletList[i].y > 0) {
            heroBulletList[i].y -= 20;
            ctx.beginPath();
            ctx.rect(heroBulletList[i].x, heroBulletList[i].y, heroBulletList[i].width, heroBulletList[i].height);
            ctx.fillStyle = randRGB();
            ctx.fill();//evt.down
        }
        for (j = 0; j < dust.xList.length; j += 1) {
            if (heroBulletList[i].x + heroBulletList[i].width >= dust.xList[j] &&
                    heroBulletList[i].x <= dust.xList[j] + dust.width &&
                    heroBulletList[i].y <= dust.yList[j] + dust.height &&
                    heroBulletList[i].y + heroBulletList[i].height >= dust.yList[j]) {
                destDust += 1;
                dust.yList.splice(j, 1);
                dust.xList.splice(j, 1);
                heroBulletList.splice(i, 1);
                break;
            }
        }
    }
}

function moveHeroRight() {
    'use strict';
    if (evt.shift) {
        for (i = 0; i < star.xList.length; i += 1) {
            star.xList[i] -= speed;
        }
        for (i = 0; i < roomList.length; i += 1) {
            roomList[i].x -= speed;
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
    hero.rightX += 1;   //man[1] -= 1;
    for (i = 0; i < roomList.length; i += 1) {
        roomList[i].x += 1;
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
    hero.rightX -= 1;    //man[1] += 1;
    for (i = 0; i < roomList.length; i += 1) {
        roomList[i].x -= 1;
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
    hero.leftY += 1;    //man[2] -= 1;
    for (i = 0; i < roomList.length; i += 1) {
        roomList[i].y += 1;
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
    hero.leftY -= 1;   //man[2] += 1;
    for (i = 0; i < roomList.length; i += 1) {
        roomList[i].y -= 1;
    }
    for (i = 0; i < star.xList.length; i += 1) {
        star.yList[i] -= 1;
    }

}

function moveStuff() {
    'use strict';
    var i;
    
    if ((evt.down || evt.leftTouch) && mwEnergy > 0) {
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
    
    
    if ((evt.right || evt.tiltRight)) {
        moveHeroRight();
    }
    if ((evt.left || evt.tiltLeft)) {
        moveHeroLeft();
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
function resizeCanvas() {
    'use strict';
    canvas = document.getElementById("myCanvas");
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
    ctx = canvas.getContext("2d");
    hero = new Ship("up", 20, 40, canvas.width / 2, canvas.height - 50);
}

window.addEventListener('resize', resizeCanvas, false);
window.addEventListener('orientationchange', resizeCanvas, false);
    
function drawGame() {
    'use strict';
    var i, j, xdist, ydist;
    if (start) {
        if (!gamePaused) {
            if (!deadHero) {
                if (!docking) {
                    //draw/update game screen
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    drawStars();
                    drawRooms();
                    for (i = 0; i < roomList.length; i += 1) {
                        if (roomList[i].y < canvas.height) {
                            roomList[i].y += 0.5;
                        }
                    }
                    drawDock();
                    drawDust();
                    drawHero();
                    drawHeroBullets();
                    drawScore();
                    moveStuff();

                    for (i = 0; i < roomList.length; i += 1) {
                        if (hero.tipY <= roomList[i].y + (roomList[i].height / 2) + 15 &&
                                hero.leftY >= roomList[i].y + (roomList[i].height / 2) - 15 &&
                                hero.rightX >= roomList[i].x + (roomList[i].width / 2) - 15 &&
                                hero.leftX <= roomList[i].x + (roomList[i].width / 2) + 15) {
                            ctx.fillText("Docking...", hero.tipX, hero.tipY);
                            docking = true;
                            man[1] = hero.tipX;
                            man[2] = hero.tipY;
                        }
                    }
                    for (i = 0; i < heroBulletList.length; i += 1) {
                        if (heroBulletList[i].x >= badguy.leftX &&
                                heroBulletList[i].x <= badguy.rightX && badguy.tipY > 0 &&
                                heroBulletList[i].y >= badguy.leftY && heroBulletList[i].y <= badguy.tipY) {
                            shotDrones += 1;
                            badguy = new Ship("down", 20, 40, Math.floor(Math.random() * canvas.width),
                                              Math.floor(Math.random() * -canvas.height));
                            heroBulletList.splice(i, 1);
                            break;
                        }
                    }
                    drawEnemy();
                    drawBullets();
                    //check if enemy shot hero & if hero is dead
                    for (i = 0; i < bulletList.length; i += 1) {
                        if (bulletList[i].x > hero.leftX && bulletList[i].x < hero.rightX &&
                                bulletList[i].y > hero.tipY && bulletList[i].y < hero.tipY + hero.height) {
                            bulletList.splice(i, 1);
                            deadHero = true;
                        }
                    }

                    //check if enemy shot stardust
                    for (i = 0; i < bulletList.length; i += 1) {
                        for (j = 0; j < dust.xList.length; j += 1) {
                            if (bulletList[i].x + bulletList[i].width > dust.xList[j] &&
                                    bulletList[i].x < dust.xList[j] + dust.width &&
                                    bulletList[i].y + bulletList[i].height > dust.yList[j] &&
                                    bulletList[i].y < dust.yList[j] + dust.height) {
                                bulletList.splice(i, 1);
                                dust.xList.splice(j, 1);
                                dust.yList.splice(j, 1);
                                destDust += 1;
                                if (i >= bulletList.length) {
                                    break;
                                }
                            }
                        }
                    }

                    //descending stars, spliced if pass canvas bottom
                    for (i = 0; i < star.xList.length; i += 1) {
                        if (star.yList[i] < canvas.height) {
                            star.yList[i] += 1;
                        } else {
                            star.yList.splice(i, 1);
                            star.xList.splice(i, 1);
                        }
                    }

                    for (i = 0; i < dust.xList.length; i += 1) {
                        if (badguy.rightX >= dust.xList[i] &&
                                   badguy.leftX <= dust.xList[i] + dust.width &&
                                   badguy.tipY >= dust.yList[i] &&
                                   badguy.leftY <= dust.yList[i] + dust.height) {
                            dust.xList.splice(i, 1);
                            dust.yList.splice(i, 1);
                            destDust += 1;
                            if (i >= dust.xList.length) {
                                break;
                            }
                        }
                    }

                    if (badguy.tipY > hero.tipY && badguy.leftY < hero.tipY + hero.height &&
                            badguy.rightX > hero.leftX && badguy.leftX < hero.rightX) {
                        deadHero = true;
                    }
                    //descending enemy bullets, spliced if pass canvas bottom
                    for (i = 0; i < bulletList.length; i += 1) {
                        if (bulletList[i].y > canvas.height) {
                            bulletList.splice(i, 1);
                        }
                    }
                } else {
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
                    }
                    if (Math.abs(ydist)) {
                        man[2] += ydist / 20;
                        hero.tipY += ydist / 20;
                        hero.leftY += ydist / 20;
                        hero.rightY += ydist / 20;
                        for (i = 0; i < roomList.length; i += 1) {
                            roomList[i].y += ydist / 20;
                        }
                    }
                    

                    drawStars();
                    drawRooms();
                    drawDock();
                    drawHero();
                    drawMan();
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
                        if (star.yList[i] < canvas.height) {
                            star.yList[i] += 0.5;
                        } else {
                            star.yList.splice(i, 1);
                            star.xList.splice(i, 1);
                        }
                    }
                    if (man[1] > hero.leftX && man[1] < hero.rightX &&
                            man[2] > hero.tipY + hero.height / 2 &&
                            man[2] < hero.leftY) {
/*                        hero.tipX = canvas.width / 2;
                        hero.leftX = hero.tipX - hero.width / 2;
                        hero.rightX = hero.tipX + hero.width / 2;*/
                        hero.tipY = canvas.height - 50;
                        hero.leftY = hero.tipY + hero.height;
                        hero.rightY = hero.tipY + hero.height;
                        for (i = 0; i < roomList.length; i += 1) {
                            roomList[i].y += canvas.height / 2 + hero.height;
                        }
                        docking = false;
                    }
                }
            } else {
                //reset game upon confirmation of replay
                if (evt.enter || unDeadHero) {
                    score = 0;
                    shotDrones = 0;
                    destDust = 0;
                    badguy = new Ship("down", 20, 40, Math.floor(Math.random() * canvas.width), 0);
                    bulletList.splice(0, bulletList.length);
                    heroBulletList.splice(0, heroBulletList.length);
                    dust.xList.splice(0, dust.xList.length);
                    dust.yList.splice(0, dust.yList.length);
                    roomList.splice(0, roomList.length);
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
drawGame();
