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

function randColor() {
    'use strict';
    return Math.floor(Math.random() * 255);
}

function randRGB() {
    'use strict';
    return ("rgb(" + randColor() + "," + randColor() + "," + randColor() + ")");
}

//event listeners kept in "events.js" file

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
var goblinList = [];

var i, j, randX, randY, randWidth, randHeight;

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

function genShipLevels() {
    'use strict';
    var shipLevels, numLevels;
    shipLevels = [];
    numLevels = Math.floor(Math.random() * 5 + 3);
    for (i = 0; i < numLevels; i += 1) {
        generateRooms();
        shipLevels[i] = roomList;
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

function drawHero() {
    'use strict';
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

var bulletTimer = 0;
var bulletWait = false;

function drawBullets() {
    'use strict';
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
