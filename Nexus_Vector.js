/*TODO: 
	Design Start Screen
	Design Pause Screen
	Design Death Screen
	Design Menu Button/Menu
*/

/***DOOR CHANGING AXIS FUNCTION, CONTINUE TO PRETTY UP GUI***/

//set up canvas
var canvas = document.getElementById("myCanvas");
canvas.width = document.body.clientWidth;
canvas.height = document.body.clientHeight;
var ctx = canvas.getContext("2d");



var gamePaused = false;/**needs to be implemented**/

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

var speed = 7;

var heroCollision = false;

var titleX = canvas.width;

/***DRAW DOORS AND MAKE THEM BLINK VARIOUS SHADES OF THEIR COLOR***/

var silverDoor = {
	width: 32,
	height: 64,
	x: 0,
	y: 0,
	xList: [],
	yList: [],
	randSilver: 0
};

var goldDoor = {
	width: 32,
	height: 64,
	x: 0,
	y: 0,
	xList: [],
	yList: [],
	randGold: 0
}

//score
var score = 0;
var deaths = 0;

//event listeners
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
window.addEventListener("deviceorientation", handleOrientation, false);
window.addEventListener("touchstart", handleStart, false);
window.addEventListener("touchend", handleEnd, false);

//laser

var laserEnergyBar = {
	width: canvas.width/5,
	height: 20,
	x: 0,
	y: 0
};

var staminaBar = {
	width: canvas.width/5,
	height: laserEnergyBar.height,
	x: 0,
	y: laserEnergyBar.y + laserEnergyBar.height
};

var lifeBar = {
	width: canvas.width/5,
	height: staminaBar.height,
	x: 0,
	y: staminaBar.y + staminaBar.height
};

function ship(orientation, width, height, tipX, tipY){
	this.width = width;
	this.height = height;
	this.tipX = tipX;
	this.tipY = tipY;
	this.rightX = this.tipX + this.width/2;
	this.leftX = this.tipX - this.width/2;
	if(orientation == "up"){
		this.rightY = this.tipY + this.height;
		this.leftY = this.tipY + this.height;
	}
	else{
		this.rightY = this.tipY - this.height;
		this.leftY = this.tipY - this.height;
	}
}

hero = new ship("up", 20, 40, canvas.width/2, canvas.height - 50);
badguy = new ship("down", 20, 40, canvas.width/2, 40);

var randGreen = 0;
var randRed = 0;
var randBlue = 0;

function drawHero(){
	for (i = 0; i <= dust.xList.length; i++){
	if (dust.xList[i] + dust.width > hero.leftX && dust.xList[i] < (hero.rightX) && 
		(dust.yList[i] + dust.height) > (hero.tipY) && dust.yList[i] < hero.leftY){
	    heroCollision = true;
	    delete dust.xList[i];
	    delete dust.yList[i];
	}
    }
    if(heroCollision){
		deaths++;
		if(lifeBar.x > -lifeBar.width){
	            lifeBar.x -= 10;
		}
    }
    if(heroCollision == false){
        randGreen = Math.floor(Math.random() * 255);
	    randRed = Math.floor(Math.random() * 255);
	    randBlue = Math.floor(Math.random() * 255);
	    hero.leftX = hero.tipX - 10;
	    hero.rightX = hero.tipX + 10;
	    hero.width = hero.rightX - hero.leftX;
	    ctx.beginPath();
	    ctx.moveTo(hero.tipX, hero.tipY);
	    ctx.lineTo(hero.leftX, hero.leftY);
	    ctx.lineTo(hero.rightX, hero.rightY);
	    ctx.fillStyle = 'rgb(' + randRed +',' + randGreen + ',' + randBlue + ')';
	    ctx.fill();

	    ctx.beginPath();
	    ctx.moveTo(hero.tipX, hero.tipY+8);
	    ctx.lineTo(hero.leftX+4, hero.leftY-3);
	    ctx.lineTo(hero.rightX-4, hero.rightY-3);
	    ctx.fillStyle = "#000";
	    ctx.fill();
    }
    heroCollision = false;    
}

var dust = {
	width: 16,
	height: 16,
	xList: [],
	yList: [],
	x: 0,
	y: 0
};

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
	x: hero.tipX - .5,
	y: canvas.height - 10
};

function handleStart(event){
    if (event.changedTouches){
		evt.touch = true;
    }
}

function handleEnd(event){
    if (event.changedTouches){
		evt.touch = false;
    }
}

function handleOrientation(event){
    if (event.gamma > 3){
		evt.tiltLeft = false;
		evt.tiltRight = true;
    }
    else if (event.gamma < -3){
		evt.tiltRight = false;
		evt.tiltLeft = true;
    }
    else if (event.gamma >= -3 && event.gamma <= 3){
		evt.tiltRight = false;
		evt.tiltLeft = false;
    }
}

//create silver doors (collision with silver door switches to vertical mode)
function gensilverDoorXY(){
    if(Math.floor(Math.random() * 80) == 1){
		silverDoor.yList[silverDoor.yList.length] = Math.floor(Math.random() * 
			(screen.height * -screen.height));
		silverDoor.xList[silverDoor.xList.length] = Math.floor(Math.random() * 
			screen.width);
    }
}	

function drawSilverDoor(){
	gensilverDoorXY();
    for(i=0; i < silverDoor.xList.length; i++){
	silverDoor.randSilver = Math.floor(Math.random() * 100 + 100);
	ctx.beginPath();
	ctx.rect(silverDoor.xList[i], silverDoor.yList[i], silverDoor.width, silverDoor.height);
	ctx.fillStyle = 'rgb(' + silverDoor.randSilver + ',' + silverDoor.randSilver + ',' + silverDoor.randSilver + ')';
	ctx.fill();
	ctx.closePath();
    }
}

//create gold doors very sparingly (collision with gold door switches to isometric mode
function gengoldDoorXY(){
    if(Math.floor(Math.random() * 100) == 1){
	goldDoor.yList[goldDoor.yList.length] = Math.floor(Math.random() * (screen.height * -screen.height));
	goldDoor.xList[goldDoor.xList.length] = Math.floor(Math.random() * (screen.width));
    }
}

function drawGoldDoor(){
	gengoldDoorXY();
    for(i=0; i < goldDoor.xList.length; i++){
	goldDoor.randGold = Math.floor(Math.random() * 100 + 100);
	ctx.beginPath();
	ctx.rect(goldDoor.xList[i], goldDoor.yList[i], goldDoor.width, goldDoor.height);
	ctx.fillStyle = 'rgb(' + goldDoor.randGold + ',' + goldDoor.randGold + ',' + 0 + ')';
	ctx.fill();
	ctx.closePath();
    }
}

//draw laser energy bar
function drawLEB(){
	ctx.beginPath();
	ctx.rect(laserEnergyBar.x, laserEnergyBar.y, laserEnergyBar.width, laserEnergyBar.height);
	ctx.fillStyle = "rgba(255,100,10,0.4)";
	ctx.fill();
	ctx.closePath();
}

//draw stamina energy bar
function drawSEB(){
	ctx.beginPath();
	ctx.rect(staminaBar.x, staminaBar.y, staminaBar.width, staminaBar.height);
	ctx.fillStyle = "rgba(100,10,255,0.4)";
	ctx.fill();
	ctx.closePath();
}

function drawLB(){
	ctx.beginPath();
	ctx.rect(lifeBar.x, lifeBar.y, lifeBar.width, lifeBar.height);
	ctx.fillStyle = "rgba(10,255,100,0.4)";
	ctx.fill();
	ctx.closePath();
}

function gendustXY(){
    if (Math.floor(Math.random() * 5) == 1){
		dust.x = Math.floor(Math.random()* -canvas.width) + Math.floor(Math.random() * canvas.width * 2);
		dust.y = Math.floor(Math.random()* -canvas.height - 1);
	if ((evt.space == false && evt.touch == false) || laser.x < dust.xList[i] || 
		laser.x > dust.xList[i] + dust.width || laserEnergyBar.x <= -laserEnergyBar.width){
	    dust.xList[dust.xList.length] = dust.x;
	    dust.yList[dust.yList.length] = dust.y;
	}
    }
}

function drawdustShips(){
	gendustXY();
	for (i = 0; i < dust.yList.length; i++){
	    if(dust.yList[i] >= canvas.height){
			dust.yList.splice(i,1);//delete dust.yList[i];
			dust.xList.splice(i,1);//delete dust.xList[i];
	    }
	    else{
			dustRGB1 = Math.floor(Math.random() * 255);
			dustRGB2 = Math.floor(Math.random() * 255);
			dustRGB3 = Math.floor(Math.random() * 255);
			ctx.beginPath();
			ctx.rect(dust.xList[i], dust.yList[i], dust.width, dust.height);
			ctx.fillStyle = 'rgb(' + dustRGB1 + ',' + dustRGB2 + ',' + dustRGB3 + ')';
			ctx.fill();
			ctx.closePath();
	    }
	}
}

function genstarXY(){
    if (Math.floor(Math.random() * 3) == 1){
		star.x = Math.floor(Math.random() * -canvas.width) + Math.floor(Math.random() * canvas.width * 2);
		star.y = Math.floor(Math.random() * -canvas.height) + Math.floor(Math.random() * canvas.height);
		star.xList[star.xList.length] = star.x;
		star.yList[star.yList.length] = star.y;
    }
}

function drawStars(){
	genstarXY();
    for (i = 0; i < star.yList.length; i++){
		star.size = Math.floor(Math.random() * 4);
		var randRGB = Math.floor(Math.random() * 255);
		ctx.beginPath();
		ctx.rect(star.xList[i], star.yList[i], star.size, star.size);
		ctx.fillStyle = 'rgb(' + randRGB + ',' + randRGB + ',' + randRGB + ')';
		ctx.fill();
		ctx.closePath();
    }
}

function keyDownHandler(e) {
    if(e.keyCode == 39) {
        evt.right = true;
    }
    else if(e.keyCode == 37) {
        evt.left = true;
    }
    else if(e.keyCode == 32) {
    	evt.space = true;
    }
    else if(e.keyCode == 40){
    	evt.down = true;
    }
    else if(e.keyCode == 16){
		evt.shift = true;
    }
    else if(e.keyCode == 72){
    	hPressed = true;
    }
    else if(e.keyCode == 80){
		if(gamePaused == false){
			gamePaused = true;
		}
		else{
			gamePaused = false;
		}
    }
}
function keyUpHandler(e) {
    if(e.keyCode == 39) {
        evt.right = false;
    }
    else if(e.keyCode == 37) {
        evt.left = false;
    }
    else if(e.keyCode == 32) {
    	evt.space = false;
    }
    else if(e.keyCode == 40){
    	evt.down = false;
    }
    else if(e.keyCode == 16){
		evt.shift = false;
    }
    else if(e.keyCode == 72){
    	hPressed = false;
    }
}

//my added drawLaser function
function drawLaser(){
	ctx.beginPath();
	ctx.rect(laser.x, 0, laser.width, laser.height);
	ctx.fillStyle = 'rgb(' +
		Math.floor(Math.random() * 255) + ',' +
		Math.floor(Math.random() * 255) + ',' +
		Math.floor(Math.random() * 255) + ')';
	ctx.fill();
	ctx.closePath();
	for (i = 0; i < dust.xList.length; i++){
	    if(laser.x >= dust.xList[i] && laser.x <= dust.xList[i] + dust.width && dust.yList[i] > 0 && 
	    	dust.yList[i] < laser.y && (evt.space || evt.touch)){
			dust.yList.splice(i,1);
			dust.xList.splice(i,1);
			score++;
	    }
	}
}

function drawTitle(){
    var randR = Math.floor(Math.random() * 255);
    var randG = Math.floor(Math.random() * 255);
    var randB = Math.floor(Math.random() * 255);
    ctx.font = "62px Courier New";
    ctx.fillStyle = 'rgb(' + randR + ',' + randG + ',' + randB + ')';
    ctx.textAlign = "start";
    ctx.fillText("Nexus Vector", titleX, canvas.height/2);
    if(titleX > -444){
    	titleX--;
    }
    else{
    	titleX = canvas.width;
    }
}

function drawHelps(){
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

function drawBars(){
	drawLEB();
	drawSEB();
	drawLB();
}

function drawDoors(){
	drawSilverDoor();
	drawGoldDoor();
}

function draw() {
	if(!gamePaused){
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	   	drawHelps();
	    drawTitle();
	    drawStars();
	    drawDoors();
	    if((evt.space || evt.touch) && laserEnergyBar.x > -laserEnergyBar.width){
	    	drawLaser();
	    }
	    drawdustShips();
	    drawBars();
	    drawHero();
	    //handleOrientation();
	    for(i = 0; i < dust.yList.length; i++){
	    	if (((evt.space == false && evt.touch == false) || laser.x < dust.xList[i] || 
	    		laser.x > dust.xList[i] + dust.width || laserEnergyBar.x <= -laserEnergyBar.width)){
	            dust.yList[i] += Math.floor(Math.random() * 5 + 3);
		    	dust.xList[i] += Math.floor(Math.random() * -5 + 3);
		    if (evt.right && evt.down){
		   		dust.xList[i] -= speed;
		    }
		    if (evt.left && evt.down){
				dust.xList[i] += speed;
		    }
		    if (dust.yList[i] >= canvas.height){
				dust.yList.splice(i,1);
				dust.xList.splice(i,1);
		    }
	    	}
	    }

	    if((evt.space || evt.touch) && laserEnergyBar.x >= -laserEnergyBar.width){
			laserEnergyBar.x--;
	    }
	    else if(evt.space == false && evt.touch == false && laserEnergyBar.x < 0){
			laserEnergyBar.x++;
	    }

	    for (i = 0; i < star.xList.length; i++){
			if(star.yList[i] < canvas.height){
			    star.yList[i]++;
			}
			else{
			    star.yList.splice(i,1);
			    star.xList.splice(i,1);
			}
	    }

	    if((evt.right || evt.tiltRight) && hero.leftX < canvas.width && 
	    	evt.down == false) {
	        laser.x += speed;
			hero.tipX += speed;
	    }
	    else if((evt.right || evt.tiltRight) && hero.leftX >= canvas.width && 
	    	evt.down == false){
	    	laser.x -= canvas.width + hero.width;
			hero.tipX -= canvas.width + hero.width;
	    }

	    else if((evt.left || evt.tiltLeft) && hero.rightX > 0 && evt.down == false){
	        laser.x -= speed;
			hero.tipX -= speed;
	    }
	    else if((evt.left || evt.tiltLeft) && hero.rightX <= 0 && evt.down == false){
	    	laser.x += canvas.width + hero.width;
			hero.tipX += canvas.width + hero.width;
	    }

	    if(evt.shift && staminaBar.x > -staminaBar.width){
			staminaBar.x--;
			speed = 10;
	    }
	    else{
			speed = 7;
	    }
	    if(evt.shift == false && staminaBar.x < 0){
			staminaBar.x++;
	    }

	    for (i = 0; i <= silverDoor.xList.length; i++){
			silverDoor.yList[i] += 5;
			if(silverDoor.yList[i] > canvas.height){
			    silverDoor.yList.splice(i,1);
			    silverDoor.xList.splice(i,1);
			}
	    }

	    for (i=0; i <= goldDoor.xList.length; i++){
			goldDoor.yList[i] += 5;
			if(goldDoor.yList[i] > canvas.height){
			    goldDoor.yList.splice(i,1);
			    goldDoor.xList.splice(i,1);
		    }
	    }
    }
   	requestAnimationFrame(draw);
}
draw();
