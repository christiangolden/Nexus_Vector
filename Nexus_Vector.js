/*TODO: 
	Design Start Screen
	Design Pause Screen (started, needs more work)
	Design Death Screen
	Design Menu Button/Menu
*/

//set up canvas
var canvas = document.getElementById("myCanvas");
canvas.width = document.body.clientWidth;
canvas.height = document.body.clientHeight;
var ctx = canvas.getContext("2d");

var gamePaused = false;
var speed = 7;
var heroCollision = false;
var score = 0;

function randColor() {
    'use strict';
    return Math.floor(Math.random() * 255);
}

//draw life/stamina/laser bars
//laser vars
var laserEnergyBar = {
	width: canvas.width / 5,
	height: 20,
	x: 0,
	y: 0
};

var staminaBar = {
	width: canvas.width / 5,
	height: laserEnergyBar.height,
	x: 0,
	y: laserEnergyBar.y + laserEnergyBar.height
};

var lifeBar = {
	width: canvas.width / 5,
	height: staminaBar.height,
	x: 0,
	y: staminaBar.y + staminaBar.height
};
//draw laser energy bar
function drawLEB() {
    'use strict';
	ctx.beginPath();
	ctx.rect(laserEnergyBar.x, laserEnergyBar.y, laserEnergyBar.width, laserEnergyBar.height);
	ctx.fillStyle = "rgba(255,100,10,0.4)";
	ctx.fill();
	ctx.closePath();
}

//draw stamina energy bar
function drawSEB() {
    'use strict';
	ctx.beginPath();
	ctx.rect(staminaBar.x, staminaBar.y, staminaBar.width, staminaBar.height);
	ctx.fillStyle = "rgba(100,10,255,0.4)";
	ctx.fill();
	ctx.closePath();
}
//draw life bar
function drawLB() {
    'use strict';
	ctx.beginPath();
	ctx.rect(lifeBar.x, lifeBar.y, lifeBar.width, lifeBar.height);
	ctx.fillStyle = "rgba(10,255,100,0.4)";
	ctx.fill();
	ctx.closePath();
}
//condensed
function drawBars() {
    'use strict';
	drawLEB();
	drawSEB();
	drawLB();
}

/***DRAW DOORS AND MAKE THEM BLINK VARIOUS SHADES OF THEIR COLOR***/
var silverDoor = {
	width: 32,
	height: 64,
	x: 0,
	y: 0,
	xList: [],
	yList: [],
	randTwinkle: 0
};

var goldDoor = {
	width: 32,
	height: 64,
	x: 0,
	y: 0,
	xList: [],
	yList: [],
	randGold: 0
};

//event listeners
//events
var evt = {
	right: false,
	left: false,
	down: false,
	shift: false,
	space: false,
	touch: false,
	tiltRight: false,
	tiltLeft: false
};

function keyDownHandler(e) {
    'use strict';
    e.preventDefault();
    if (e.keyCode === 39) {
        evt.right = true;
        e.stopPropagation();
    } else if (e.keyCode === 37) {
        evt.left = true;
    } else if (e.keyCode === 32) {
        evt.space = true;
    } else if (e.keyCode === 40) {
        evt.down = true;
    } else if (e.keyCode === 16) {
		evt.shift = true;
    } else if (e.keyCode === 80) {
		if (gamePaused === false) {
			gamePaused = true;
		} else {
			gamePaused = false;
		}
    }
}
function keyUpHandler(e) {
    'use strict';
    e.preventDefault();
    if (e.keyCode === 39) {
        evt.right = false;
    } else if (e.keyCode === 37) {
        evt.left = false;
    } else if (e.keyCode === 32) {
        evt.space = false;
    } else if (e.keyCode === 40) {
        evt.down = false;
    } else if (e.keyCode === 16) {
		evt.shift = false;
    }
}

function handleStart(event) {
    'use strict';
    event.preventDefault();
    if (event.changedTouches) {
		evt.touch = true;
    }
}

function handleEnd(event) {
    'use strict';
    event.preventDefault();
    if (event.changedTouches) {
		evt.touch = false;
    }
}

function handleOrientation(event) {
    'use strict';
    event.preventDefault();
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
}

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
window.addEventListener("deviceorientation", handleOrientation, false);
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

var hero = new Ship("up", 20, 40, canvas.width / 2, canvas.height - 50);
var badguy = new Ship("down", 20, 40, canvas.width / 2, 40);

var dust = {
	width: 16,
	height: 16,
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
            //heroCollision = true;
            delete dust.xList[i];
            delete dust.yList[i];
            score += 1;
        }
    }
    
    /*** replace with code for collision with actual enemies/enemy bullets*****/
    /*if (heroCollision) {
		if (lifeBar.x > -lifeBar.width) {
	        lifeBar.x -= 10;
		}
    }*/
    if (heroCollision === false) {
	    hero.leftX = hero.tipX - 10;
	    hero.rightX = hero.tipX + 10;
	    hero.width = hero.rightX - hero.leftX;
	    ctx.beginPath();
	    ctx.moveTo(hero.tipX, hero.tipY);
	    ctx.lineTo(hero.leftX, hero.leftY);
	    ctx.lineTo(hero.rightX, hero.rightY);
	    ctx.fillStyle = 'rgb(' + randColor() + ',' + randColor() + ',' + randColor() + ')';
	    ctx.fill();

	    ctx.beginPath();
	    ctx.moveTo(hero.tipX, hero.tipY + 8);
	    ctx.lineTo(hero.leftX + 4, hero.leftY - 3);
	    ctx.lineTo(hero.rightX - 4, hero.rightY - 3);
	    ctx.fillStyle = "#000";
	    ctx.fill();
    }
    heroCollision = false;
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
	width: 1,
	height: canvas.height - 10,
	x: hero.tipX - 0.5,
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

//create silver doors (collision with silver door switches to vertical mode)
function genSilverDoorXY() {
    'use strict';
    if (Math.floor(Math.random() * 80) === 1) {
		silverDoor.yList[silverDoor.yList.length] = Math.floor(Math.random() *
			(screen.height * -screen.height));
		silverDoor.xList[silverDoor.xList.length] = Math.floor(Math.random() *
			screen.width);
    }
}

function drawSilverDoor() {
    'use strict';
	genSilverDoorXY();
    var i;
    for (i = 0; i < silverDoor.xList.length; i += 1) {
        silverDoor.randTwinkle = Math.floor(Math.random() * 100 + 100);
        ctx.beginPath();
        ctx.rect(silverDoor.xList[i], silverDoor.yList[i], silverDoor.width, silverDoor.height);
        ctx.fillStyle = 'rgb(' + silverDoor.randTwinkle + ',' + silverDoor.randTwinkle + ',' + silverDoor.randTwinkle + ')';
        ctx.fill();
        ctx.closePath();
    }
}

//create gold doors very sparingly (collision with gold door switches to isometric mode
function genGoldDoorXY() {
    'use strict';
    if (Math.floor(Math.random() * 100) === 1) {
        goldDoor.yList[goldDoor.yList.length] = Math.floor(Math.random() * (screen.height * -screen.height));
        goldDoor.xList[goldDoor.xList.length] = Math.floor(Math.random() * (screen.width));
    }
}

function drawGoldDoor() {
    'use strict';
	genGoldDoorXY();
    var i;
    for (i = 0; i < goldDoor.xList.length; i += 1) {
        goldDoor.randGold = Math.floor(Math.random() * 100 + 100);
        ctx.beginPath();
        ctx.rect(goldDoor.xList[i], goldDoor.yList[i], goldDoor.width, goldDoor.height);
        ctx.fillStyle = 'rgb(' + goldDoor.randGold + ',' + goldDoor.randGold + ',' + '0)';
        ctx.fill();
        ctx.closePath();
    }
}

//generate xy lists for stardust
function genDustXY() {
    'use strict';
    var i;
    if (Math.floor(Math.random() * 5) === 1) {
		dust.x = Math.floor(Math.random() * -canvas.width) + Math.floor(Math.random() * canvas.width * 2);
		dust.y = Math.floor(Math.random() * -canvas.height - 1);
        if ((evt.space === false && evt.touch === false) || laser.x < dust.x ||
                laser.x > dust.x + dust.width || laserEnergyBar.x <= -laserEnergyBar.width) {
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
			ctx.fillStyle = 'rgb(' + randColor() + ',' + randColor() + ',' + randColor() + ')';
			ctx.fill();
			ctx.closePath();
	    }
	}
}

function genStarXY() {
    'use strict';
    if (Math.floor(Math.random() * 3) === 1) {
		star.x = Math.floor(Math.random() * -canvas.width) + Math.floor(Math.random() * canvas.width * 2);
		star.y = Math.floor(Math.random() * -canvas.height) + Math.floor(Math.random() * canvas.height);
		star.xList[star.xList.length] = star.x;
		star.yList[star.yList.length] = star.y;
    }
}

function drawStars() {
    'use strict';
	genStarXY();
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



//my added drawLaser function
function drawLaser() {
    'use strict';
    var i;
	ctx.beginPath();
	ctx.rect(laser.x, 0, laser.width, laser.height);
	ctx.fillStyle = 'rgb(' + randColor() + ',' + randColor() + ',' + randColor() + ')';
	ctx.fill();
	ctx.closePath();
	for (i = 0; i < dust.xList.length; i += 1) {
	    if (laser.x >= dust.xList[i] && laser.x <= dust.xList[i] + dust.width && dust.yList[i] > 0 &&
                dust.yList[i] < laser.y && (evt.space || evt.touch)) {
			dust.yList.splice(i, 1);
			dust.xList.splice(i, 1);
			score += 1;
	    }
	}
}

function drawMagWave() {
    'use strict';
    var i;
    ctx.beginPath();
    ctx.arc(magWave.x, magWave.y, magWave.radius, magWave.startAngle, magWave.endAngle);
    ctx.strokeStyle = 'rgb(' + randColor() + ',' + randColor() + ',' + randColor() + ')';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.closePath();
}

//Scrolling Title
var titleX = canvas.width;
function drawTitle() {
    'use strict';
    ctx.font = "62px Courier New";
    ctx.fillStyle = 'rgb(' + randColor() + ',' + randColor() + ',' + randColor() + ')';
    ctx.textAlign = "start";
    ctx.fillText("Nexus Vector", titleX, canvas.height / 2);
    if (titleX > -444) {
        titleX -= 1;
    } else {
        titleX = canvas.width;
    }
}

//controls/stats
function drawHelps() {
    'use strict';
    ctx.font = "22px Courier New";
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.textAlign = "start";
    ctx.fillText("Move\t\t\t\t:<-/-> or Tilt", 0, lifeBar.y + lifeBar.height * 2);
    ctx.fillText("Shoot\t\t\t:Space or Tap", 0, lifeBar.y + lifeBar.height * 3);
    ctx.fillText("Boost\t\t\t:Shift + <-/->", 0, lifeBar.y + lifeBar.height * 4);
    ctx.fillText("Strafe\t\t:Down + <-/->", 0, lifeBar.y + lifeBar.height * 5);
    ctx.textAlign = "end";
    ctx.fillText("Stardust Captured: " + score, canvas.width - 12, 22);
}

function drawDoors() {
    'use strict';
	drawSilverDoor();
	drawGoldDoor();
}

function draw() {
    'use strict';
	if (!gamePaused) {
        var i;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawHelps();
	    drawTitle();
	    drawStars();
	    drawDoors();
        
	    if ((evt.space || evt.touch) && laserEnergyBar.x > -laserEnergyBar.width) {
            drawLaser();
	    }
	    drawDust();
	    drawBars();
	    drawHero();
        
        if (evt.down) {
            drawMagWave();
            if (magWave.radius < hero.width) {
                magWave.radius += 0.5;
            } else {
                magWave.radius = 0;
            }
        } else {
            magWave.radius = 0;
        }
        
	    for (i = 0; i < dust.yList.length; i += 1) {
            if (((evt.space === false && evt.touch === false) || laser.x < dust.xList[i] ||
                 laser.x > dust.xList[i] + dust.width || laserEnergyBar.x <= -laserEnergyBar.width)) {
	            /*dust.yList[i] += Math.floor(Math.random() * 5 + 3);
                dust.xList[i] += Math.floor(Math.random() * -5 + 3);*/
                /*if (evt.right && evt.down) {
                    dust.xList[i] -= speed;
                }
                if (evt.left && evt.down) {
                    dust.xList[i] += speed;
                }
                if (dust.yList[i] >= canvas.height) {
                    dust.yList.splice(i, 1);
                    dust.xList.splice(i, 1);
                }*/
                if (evt.down && dust.xList[i] > magWave.x && dust.yList[i] < magWave.y) {
                    dust.xList[i] -= 3;
                    dust.yList[i] += 3;
                } else if (evt.down && dust.xList[i] > magWave.x && dust.yList[i] > magWave.y) {
                    dust.xList[i] -= 3;
                    dust.yList[i] -= 3;
                } else if (evt.down && dust.xList[i] < magWave.x && dust.yList[i] < magWave.y) {
                    dust.xList[i] += 3;
                    dust.yList[i] += 3;
                } else if (evt.down && dust.xList[i] < magWave.x && dust.yList[i] > magWave.y) {
                    dust.xList[i] += 3;
                    dust.yList[i] -= 3;
                } else {
                    dust.yList[i] += Math.floor(Math.random() * 5 + 3);
                    dust.xList[i] += Math.floor(Math.random() * -5 + 3);
                }
                
                if (evt.down && dust.xList[i] <= magWave.x + 3 &&
                        dust.xList[i] >= magWave.x - 3 &&
                        dust.yList[i] >= magWave.y - 3 &&
                        dust.yList[i] <= magWave.y + 3) {
                    dust.xList.splice(i, 1);
                    dust.yList.splice(i, 1);
                    score += 1;
                }
            }
	    }

	    if ((evt.space || evt.touch) && laserEnergyBar.x >= -laserEnergyBar.width) {
			laserEnergyBar.x -= 1;
	    } else if (evt.space === false && evt.touch === false && laserEnergyBar.x < 0) {
			laserEnergyBar.x += 1;
	    }

	    for (i = 0; i < star.xList.length; i += 1) {
			if (star.yList[i] < canvas.height) {
			    star.yList[i] += 1;
			} else {
			    star.yList.splice(i, 1);
			    star.xList.splice(i, 1);
			}
	    }

	    if ((evt.right || evt.tiltRight) && hero.leftX < canvas.width) {/* &&
                evt.down === false) {*/
	        laser.x += speed;
			hero.tipX += speed;
            magWave.x += speed;
	    } else if ((evt.right || evt.tiltRight) && hero.leftX >= canvas.width) {/* &&
                   evt.down === false) {*/
            laser.x -= canvas.width + hero.width;
			hero.tipX -= canvas.width + hero.width;
            magWave.x -= canvas.width + hero.width;
	    } else if ((evt.left || evt.tiltLeft) && hero.rightX > 0) {/* && evt.down === false) {*/
	        laser.x -= speed;
			hero.tipX -= speed;
            magWave.x -= speed;
	    } else if ((evt.left || evt.tiltLeft) && hero.rightX <= 0) {/* && evt.down === false) {*/
            laser.x += canvas.width + hero.width;
			hero.tipX += canvas.width + hero.width;
            magWave.x += canvas.width + hero.width;
	    }

	    if (evt.shift && staminaBar.x > -staminaBar.width) {
			staminaBar.x -= 1;
			speed = 10;
	    } else {
			speed = 7;
	    }
	    if (evt.shift === false && staminaBar.x < 0) {
			staminaBar.x += 1;
	    }

	    for (i = 0; i <= silverDoor.xList.length; i += 1) {
			silverDoor.yList[i] += 5;
			if (silverDoor.yList[i] > canvas.height) {
			    silverDoor.yList.splice(i, 1);
			    silverDoor.xList.splice(i, 1);
			}
	    }

	    for (i = 0; i <= goldDoor.xList.length; i += 1) {
			goldDoor.yList[i] += 5;
			if (goldDoor.yList[i] > canvas.height) {
			    goldDoor.yList.splice(i, 1);
			    goldDoor.xList.splice(i, 1);
		    }
	    }
    }
    window.requestAnimationFrame(draw);
}
draw();