/*TODO: 
	Design Death Screen
	Design Menu Button/Menu
*/

//set up canvas
var canvas = document.getElementById("myCanvas");
canvas.width = document.body.clientWidth;
canvas.height = document.body.clientHeight;
var ctx = canvas.getContext("2d");

var start = false;
var startColor = 0;

var deadHero = false;

var swiped = false;

var shotDrones = 0;
var destDust = 0;
var savedDust = 0;

var gamePaused = false;
var speed = 7;
var heroCollision = false;
var score = 0;
var hp = 100;

var hpColor = 'rgb(0,255,0)';

//get amount of tilt from mobile device
var tiltLevel;

//range of magwave mag power
var mwRange = (canvas.width * canvas.height) * 0.0004;

var laserWidth = 2;

//badguy color
var red = 50;
var redder = true;

//hero color
var green = 50;
var greener = true;

//magwave duration
var mwEnergy = 5;

var bulletList = [];

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
	right: false,
	left: false,
	down: false,
	shift: false,
	space: false,
	touch: false,
    rightTouch: false,
    leftTouch: false,
	tiltRight: false,
	tiltLeft: false
};

function keyDownHandler(e) {
    'use strict';
    if (e.keyCode === 32) {
        evt.space = true;
    }
    if (e.keyCode === 37) {
        evt.left = true;
    }
    if (e.keyCode === 39) {
        evt.right = true;
    }
    if (e.keyCode === 40) {
        evt.down = true;
    }
    if (e.keyCode === 16) {
		evt.shift = true;
    }
    if (e.keyCode === 80) {
		if (gamePaused === false) {
			gamePaused = true;
		} else {
			gamePaused = false;
		}
    }
}
function keyUpHandler(e) {
    'use strict';
    if (e.keyCode === 39) {
        evt.right = false;
    }
    if (e.keyCode === 37) {
        evt.left = false;
    }
    if (e.keyCode === 32) {
        evt.space = false;
    }
    if (e.keyCode === 40) {
        evt.down = false;
    }
    if (e.keyCode === 16) {
		evt.shift = false;
    }
}
var touchX1, touchY1, touchX2, touchY2;
function handleStart(event) {
    'use strict';
    touchX1 = event.touches[0].pageX;
    touchY1 = event.touches[0].pageY;
    if (event.changedTouches) {
		evt.touch = true;
        //touchX1 = event.touches[0].pageX;
        //touchY1 = event.touches[0].pageY;
        if (event.touches[0].pageX > canvas.width / 2) {
            event.preventDefault();
            evt.rightTouch = true;
        } else if (event.touches[0].pageX <= canvas.width / 2) {
            event.preventDefault();
            evt.leftTouch = true;
        }
    }
}

function handleEnd(event) {
    'use strict';
    touchX2 = event.touches[0].pageX;
    touchY2 = event.touches[0].pageY;
    if (event.changedTouches) {
        event.preventDefault();
		evt.touch = false;
        evt.rightTouch = false;
        evt.leftTouch = false;
    }
    if (touchX1 > touchX2 || touchY1 > touchY2 ||
            touchX1 < touchX2 || touchY1 < touchY2) {
        swiped = true;
    }
}

//the following accelerometer function should work for most cases
function handleOrientation(event) {
    'use strict';
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
    tiltLevel = event.gamma;
}

//if the above doesn't work, this should.
function handleMotion(event) {
    'use strict';
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
                      Math.floor(Math.random() * canvas.width),
                      Math.floor(Math.random() * -canvas.height));

var dust = {
	width: 14,
	height: 14,
	xList: [],
	yList: [],
	x: 0,
	y: 0
};

var randGreen = 0;
var randRed = 0;
var randBlue = 0;

function drawHero() {
    'use strict';
    var i;
	for (i = 0; i <= dust.xList.length; i += 1) {
        if (dust.xList[i] + dust.width > hero.leftX && dust.xList[i] < hero.rightX &&
                dust.yList[i] + dust.height > hero.tipY && dust.yList[i] < hero.leftY) {
            delete dust.xList[i];
            delete dust.yList[i];
            hp -= 1;
        }
    }
    hero.leftX = hero.tipX - 10;
    hero.rightX = hero.tipX + 10;
    ctx.beginPath();
    ctx.moveTo(hero.leftX, hero.leftY);
    ctx.lineTo(hero.tipX, hero.tipY);
    ctx.lineTo(hero.rightX, hero.rightY);
    ctx.fillStyle = randRGB();
    ctx.fill();
}

function drawEnemy() {
    'use strict';
    if (red < 150 && redder === true) {
        red += 10;
    } else if (red > 49) {
        redder = false;
        red -= 10;
    } else {
        redder = true;
    }
    badguy.leftY = badguy.tipY - badguy.height;
    badguy.rightY = badguy.tipY - badguy.height;
    badguy.leftX = badguy.tipX - 10;
    badguy.rightX = badguy.tipX + 10;
    badguy.leftX = badguy.tipX - 10;
    badguy.rightX = badguy.tipX + 10;

    if (badguy.tipX > (hero.tipX + 4) && badguy.tipY < hero.tipY) {
        badguy.leftX -= 4;
        badguy.rightX -= 4;
        badguy.tipX -= 4;
        badguy.tipY += 4;
    } else if (badguy.tipX < (hero.tipX - 4) && badguy.tipY < hero.tipY) {
        badguy.leftX += 4;
        badguy.rightX += 4;
        badguy.tipX += 4;
        badguy.tipY += 4;
    } else if (badguy.tipY > canvas.height + badguy.height) {
        badguy = new Ship("down", 20, 40, Math.floor(Math.random() * canvas.width),
                          Math.floor(Math.random() * -canvas.height));
    } else {
        badguy.tipY += 4;
    }
    badguy.width = badguy.rightX - badguy.leftX;
    
    ctx.beginPath();
    ctx.moveTo(badguy.leftX, badguy.leftY);
    ctx.lineTo(badguy.tipX, badguy.tipY);
    ctx.lineTo(badguy.rightX, badguy.rightY);
    ctx.strokeStyle = randRGB();
    ctx.lineWidth = 2;
    ctx.stroke();
}

//stars
var star = {
	size: 2,
	xList: [],
	yList: [],
	x: 0,
	y: 0
};

//laser
var laser = {
	width: laserWidth,
	height: canvas.height - 10,
	x: hero.tipX - (laserWidth / 2),
	y: canvas.height - 10
};

//magwave - will eventually be used alternatingly with laser. Use to attract dust
//as opposed to destroying drones.
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
        if ((evt.space === false && evt.rightTouch === false) || laser.x < dust.x ||
                laser.x > dust.x + dust.width || laserWidth <= 0) {
            dust.xList[dust.xList.length] = dust.x;
            dust.yList[dust.yList.length] = dust.y;
        }
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
			ctx.rect(dust.xList[i], dust.yList[i], dust.width, dust.height);
			ctx.strokeStyle = randRGB();
			ctx.lineWidth = 2;
            ctx.stroke();
            /*ctx.fillStyle = 'rgb(200,200,200)';
            ctx.fill();*/
			ctx.closePath();
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
        star.size = Math.floor(Math.random() * 4);
        randTwinkle = randColor();
        ctx.beginPath();
        ctx.rect(star.xList[i], star.yList[i], star.size, star.size);
        ctx.fillStyle = 'rgb(' + randTwinkle + ',' + randTwinkle + ',' + randTwinkle + ')';
        ctx.fill();
        ctx.closePath();
    }
}

function drawLaser() {
    'use strict';
    var i;
    if (laserWidth > 0) {
        ctx.beginPath();
        ctx.rect(laser.x, 0, laser.width, laser.height);
        ctx.fillStyle = randRGB();
        ctx.fill();
        ctx.closePath();
        for (i = 0; i < dust.xList.length; i += 1) {
            if (laser.x >= dust.xList[i] && laser.x <= dust.xList[i] +
                    dust.width && dust.yList[i] > 0 &&
                    dust.yList[i] < laser.y && (evt.space || evt.rightTouch)) {
                dust.yList.splice(i, 1);
                dust.xList.splice(i, 1);
            }
        }
    }
}

function drawMagWave() {
    'use strict';
    var i;
    ctx.beginPath();
    ctx.arc(magWave.x, magWave.y, magWave.radius, magWave.startAngle, magWave.endAngle);
    ctx.strokeStyle = randRGB();
    ctx.lineWidth = mwEnergy;
    ctx.stroke();
    ctx.closePath();
}

//Scrolling Title
var titleX = canvas.width;
function drawTitle() {
    'use strict';
    ctx.font = "62px Courier New";
    ctx.fillStyle = randRGB();
    ctx.textAlign = "start";
    ctx.fillText("Nexus Vector", titleX, canvas.height / 2);
    if (titleX > -444) {
        titleX -= 1;
    } else {
        titleX = canvas.width;
    }
}


function startScreen() {
    'use strict';
    if (!(evt.space || evt.leftTouch || evt.rightTouch)) {
        ctx.font = "40px Courier New";
        ctx.fillStyle = randRGB();
        ctx.textAlign = "center";
        ctx.fillText("NEXUS VECTOR", canvas.width / 2, canvas.height / 2);
        ctx.font = "20px Courier New";
        ctx.fillText("PRESS SPACE OR TAP TO START", canvas.width / 2, canvas.height / 2 + 40);
    } else {
        start = true;
    }
}
//controls/stats
function drawHelps() {
    'use strict';
    ctx.font = "20px Courier New";
    ctx.fillStyle = "rgb(200,200,200)";
    ctx.textAlign = "start";
    ctx.fillText("Move\t\t\t\t:<-/-> or Tilt", 4, 20);
    ctx.fillText("Shoot\t\t\t:Space/Touch Right", 4, 2 * 20);
    ctx.fillText("Boost\t\t\t:Shift/Strong Tilt", 4, 3 * 20);
    ctx.fillText("MagWave\t:Down/Touch Left", 4, 4 * 20);
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
}

function drawScore() {
    'use strict';
    ctx.font = "18px Courier New";
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.textAlign = "end";
    ctx.fillText("Stardust Collected:" + score, canvas.width - 12, 22);
    ctx.fillText("Drones Destroyed:" + shotDrones, canvas.width - 12, 44);
    ctx.fillText("HP:", canvas.width - 88, 66);
    ctx.fillStyle = hpColor;
    ctx.fillText(hp, canvas.width - 55, 66);
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillText("/100", canvas.width - 12, 66);

}

function drawGameOver() {
    'use strict';
    ctx.font = "48px Courier New";
    ctx.fillStyle = randRGB();
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
    ctx.font = "18px Courier New";
    ctx.fillText("Space/Tap to Play Again", canvas.width / 2, canvas.height / 2 + 50);
}

function drawBullets() {
    'use strict';
    var i, bullet;
    if (Math.floor(Math.random() * 10) === 3 && badguy.tipY > 0) {
        bulletList[bulletList.length] = new Bullet(2, 4, badguy.tipX - 1, badguy.tipY - 9);
    }
    for (i = 0; i < bulletList.length; i += 1) {
        if (bulletList[i].y < canvas.height) {
            bulletList[i].y += 10;
            ctx.beginPath();
            ctx.rect(bulletList[i].x, bulletList[i].y, bulletList[i].width, bulletList[i].height);
            ctx.fillStyle = 'rgb(255,255,255)';
            ctx.fill();
        }
    }

}

function moveHeroRight() {
    'use strict';
    if (hero.leftX >= canvas.width) {
        laser.x -= canvas.width + hero.width;
        hero.tipX -= canvas.width + hero.width;
        magWave.x -= canvas.width + hero.width;
    } else {
        laser.x += speed;
        hero.tipX += speed;
        magWave.x += speed;
    }
}

function moveHeroLeft() {
    'use strict';
    if (hero.rightX <= 0) {
        laser.x += canvas.width + hero.width;
        hero.tipX += canvas.width + hero.width;
        magWave.x += canvas.width + hero.width;
    } else {
        laser.x -= speed;
        hero.tipX -= speed;
        magWave.x -= speed;
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


    if ((evt.shift || tiltLevel > 5 || tiltLevel < -5) &&
            (evt.left || evt.right)) {
        speed = 10;
    } else {
        speed = 7;
    }
    if ((evt.space || evt.rightTouch) && laserWidth > -0.1) {
        laserWidth -= 0.1;
        laser.width = laserWidth;
        laser.x += 0.05;
    } else if (laserWidth < 2.05) {
        laserWidth += 0.1;
        laser.width = laserWidth;
        laser.x -= 0.05;
    }


    
    for (i = 0; i < dust.yList.length; i += 1) {
        if (((evt.space === false && evt.rightTouch === false) || laser.x < dust.xList[i] ||
             laser.x > dust.xList[i] + dust.width || laserWidth <= 0)) {
            if ((evt.down || evt.leftTouch) && dust.xList[i] > magWave.x &&
                        dust.xList[i] < (magWave.x + mwRange) &&
                        dust.yList[i] < magWave.y &&
                        dust.yList[i] > (magWave.y - mwRange) &&
                        mwEnergy > 0) {
                dust.xList[i] -= 3;
                dust.yList[i] += 5;
            } else if ((evt.down || evt.leftTouch) && dust.xList[i] > magWave.x &&
                        dust.xList[i] < (magWave.x + mwRange) &&
                        dust.yList[i] > magWave.y && mwEnergy > 0) {
                dust.xList[i] -= 3;
                dust.yList[i] -= 5;
            } else if ((evt.down || evt.leftTouch) && dust.xList[i] < magWave.x &&
                       dust.xList[i] > (magWave.x - mwRange) &&
                       dust.yList[i] < magWave.y &&
                       dust.yList[i] > (magWave.y - mwRange) &&
                        mwEnergy > 0) {
                dust.xList[i] += 3;
                dust.yList[i] += 5;
            } else if ((evt.down || evt.leftTouch) && dust.xList[i] < magWave.x &&
                       dust.xList[i] > (magWave.x - mwRange) &&
                       dust.yList[i] > magWave.y && mwEnergy > 0) {
                dust.xList[i] += 3;
                dust.yList[i] -= 5;
            } else {
                dust.yList[i] += Math.floor(Math.random() * 5 + 3);
                dust.xList[i] += Math.floor(Math.random() * -5 + 3);
            }

            if ((evt.down || evt.leftTouch) && dust.xList[i] <= magWave.x + 3 &&
                    dust.xList[i] >= magWave.x - magWave.radius - dust.width &&
                    dust.xList[i] <= magWave.x + magWave.radius + dust.width &&
                    dust.yList[i] >= magWave.y - magWave.radius - dust.height &&
                    dust.yList[i] <= magWave.y + magWave.radius &&
                    mwEnergy > 0) {
                dust.xList.splice(i, 1);
                dust.yList.splice(i, 1);
                if (mwEnergy > 0) {
                    score += 1;
                }
            }
        }
    }
}

function drawGame() {
    'use strict';
    var i;
    if (start) {
        if (!gamePaused) {
            if (!deadHero) {
                if (swiped && !gamePaused) {
                    gamePaused = true;
                }
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawScore();
                drawTitle();
                drawStars();

                if ((evt.space || evt.rightTouch) && laserWidth > 0) {
                    drawLaser();
                }

                drawDust();
                drawHero();
                moveStuff();
                if ((evt.space || evt.rightTouch) && hero.tipX > badguy.leftX &&
                        hero.tipX < badguy.rightX && laser.width > 0 &&
                        badguy.tipY > 0) {
                    shotDrones += 1;
                    badguy = new Ship("down", 20, 40, Math.floor(Math.random() * canvas.width),
                                      Math.floor(Math.random() * -canvas.height));
                }
                drawEnemy();
                drawBullets();
                for (i = 0; i < bulletList.length; i += 1) {
                    if (bulletList[i].x > hero.leftX && bulletList[i].x < hero.rightX &&
                            bulletList[i].y > hero.tipY && bulletList[i].y < hero.tipY + hero.height) {
                        bulletList.splice(i, 1);
                        hp -= 1;
                        if (hp < 70) {
                            hpColor = 'rgb(255,255,0)';
                        }
                        if (hp < 30) {
                            hpColor = 'rgb(255,0,0)';
                        }
                        if (hp < 1) {
                            deadHero = true;
                        }
                    }
                }
                for (i = 0; i < star.xList.length; i += 1) {
                    if (star.yList[i] < canvas.height) {
                        star.yList[i] += 1;
                    } else {
                        star.yList.splice(i, 1);
                        star.xList.splice(i, 1);
                    }
                }

                for (i = 0; i < bulletList.length; i += 1) {
                    if (bulletList[i].y > canvas.height) {
                        bulletList.splice(i, 1);
                    }
                }
            } else {
                //ctx.clearRect(0, 0, canvas.width, canvas.height);
                if (evt.space || evt.leftTouch || evt.rightTouch) {
                    hp = 100;
                    score = 0;
                    shotDrones = 0;
                    destDust = 0;
                    savedDust = 0;
                    hpColor = 'rgb(0,255,0)';
                    badguy = new Ship("down", 20, 40, Math.floor(Math.random() * canvas.width),
                                      Math.floor(Math.random() * -canvas.height));
                    bulletList.splice(1, bulletList.length);
                    star.xList.splice(1, star.xList.length);
                    star.yList.splice(1, star.yList.length);
                    dust.xList.splice(1, dust.xList.length);
                    dust.yList.splice(1, dust.yList.length);
                    deadHero = false;
                }
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawStars();
                drawGameOver();

            }
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawStars();
            drawHelps();
        }
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawStars();
        startScreen();
    }
    window.requestAnimationFrame(drawGame);
}
drawGame();