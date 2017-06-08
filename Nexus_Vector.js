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

//ctx drawn hero
var heroWidth = heroRightWingX - heroLeftWingX;
var heroHeight = heroRightWingY - heroTipY;
var heroTipX = canvas.width/2;
var heroTipY = canvas.height - 50;
var heroRightWingX = heroTipX + 10;
var heroRightWingY = heroTipY + 40;
var heroLeftWingX = heroTipX - 10;
var heroLeftWingY = heroTipY + 40;

//events
var hPressed = false;
var pPressed = false;
var rightPressed = false;
var leftPressed = false;
var downPressed = false;
var shiftPressed = false;
var spacePressed = false;
var screenTouched = false;
var screenTiltRight = false;
var screenTiltLeft = false;

var speed = 7;

var heroCollision = false;

var titleX = canvas.width;

/***DRAW DOORS AND MAKE THEM BLINK VARIOUS SHADES OF THEIR COLOR***/
var silverDoorWidth = 32;
var silverDoorHeight = 64;
var silverDoorX = 0;
var silverDoorY = 0;
var silverDoorXList = [];
var silverDoorYList = [];
var randSilver = 0;

var goldDoorWidth = 32;
var goldDoorHeight = 64;
var goldDoorX = 0;
var goldDoorY = 0;
var goldDoorXList = [];
var goldDoorYList = [];
var randGold = 0;

//Stardust

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
	x: heroTipX - .5,
	y: canvas.height - 10
};

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

var randGreen = 0;
var randRed = 0;
var randBlue = 0;

var playingGame = false;

function drawHero(){
	for (i = 0; i <= dust.xList.length; i++){
	if (dust.xList[i] + dust.width > heroLeftWingX && dust.xList[i] < (heroRightWingX) && 
		(dust.yList[i] + dust.height) > (heroTipY) && dust.yList[i] < heroLeftWingY){
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
	    heroLeftWingX = heroTipX - 10;
	    heroRightWingX = heroTipX + 10;
	    heroWidth = heroRightWingX - heroLeftWingX;
	    ctx.beginPath();
	    ctx.moveTo(heroTipX, heroTipY);
	    ctx.lineTo(heroLeftWingX, heroLeftWingY);
	    ctx.lineTo(heroRightWingX, heroRightWingY);
	    ctx.fillStyle = 'rgb(' + randRed +',' + randGreen + ',' + randBlue + ')';
	    ctx.fill();

	    ctx.beginPath();
	    ctx.moveTo(heroTipX, heroTipY+8);
	    ctx.lineTo(heroLeftWingX+4, heroLeftWingY-3);
	    ctx.lineTo(heroRightWingX-4, heroRightWingY-3);
	    ctx.fillStyle = "#000";
	    ctx.fill();
    }
    heroCollision = false;    
}

function handleStart(event){
    if (event.changedTouches){
	screenTouched = true;
    }
}

function handleEnd(event){
    if (event.changedTouches){
	screenTouched = false;
    }
}

function handleOrientation(event){
    if (event.gamma > 3){
	screenTiltLeft = false;
	screenTiltRight = true;
    }
    else if (event.gamma < -3){
	screenTiltRight = false;
	screenTiltLeft = true;
    }
    else if (event.gamma >= -3 && event.gamma <= 3){
	screenTiltRight = false;
	screenTiltLeft = false;
    }
}

//create silver doors (collision with silver door switches to vertical mode)
function genSilverDoorXY(){
    if(Math.floor(Math.random() * 80) == 1){
	silverDoorYList[silverDoorYList.length] = Math.floor(Math.random() * 
		(screen.height * -screen.height));
	silverDoorXList[silverDoorXList.length] = Math.floor(Math.random() * 
		screen.width);
    }
}	

function drawSilverDoor(){
    for(i=0; i < silverDoorXList.length; i++){
	randSilver = Math.floor(Math.random() * 100 + 100);
	ctx.beginPath();
	ctx.rect(silverDoorXList[i], silverDoorYList[i], silverDoorWidth, silverDoorHeight);
	ctx.fillStyle = 'rgb(' + randSilver + ',' + randSilver + ',' + randSilver + ')';
	ctx.fill();
	ctx.closePath();
    }
}

//create gold doors very sparingly (collision with gold door switches to isometric mode
function genGoldDoorXY(){
    if(Math.floor(Math.random() * 100) == 1){
	goldDoorYList[goldDoorYList.length] = Math.floor(Math.random() * (screen.height * -screen.height));
	goldDoorXList[goldDoorXList.length] = Math.floor(Math.random() * (screen.width));
    }
}

function drawGoldDoor(){
    for(i=0; i < goldDoorXList.length; i++){
	randGold = Math.floor(Math.random() * 100 + 100);
	ctx.beginPath();
	ctx.rect(goldDoorXList[i], goldDoorYList[i], goldDoorWidth, goldDoorHeight);
	ctx.fillStyle = 'rgb(' + randGold + ',' + randGold + ',' + 0 + ')';
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
	if ((spacePressed == false && screenTouched == false) || laser.x < dust.xList[i] || 
		laser.x > dust.xList[i] + dust.width || laserEnergyBar.x <= -laserEnergyBar.width){
	    dust.xList[dust.xList.length] = dust.x;
	    dust.yList[dust.yList.length] = dust.y;
	}
    }
}

function drawdustShips(){
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
        rightPressed = true;
    }
    else if(e.keyCode == 37) {
        leftPressed = true;
    }
    else if(e.keyCode == 32) {
    	spacePressed = true;
    }
    else if(e.keyCode == 40){
    	downPressed = true;
    }
    else if(e.keyCode == 16){
		shiftPressed = true;
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
        rightPressed = false;
    }
    else if(e.keyCode == 37) {
        leftPressed = false;
    }
    else if(e.keyCode == 32) {
    	spacePressed = false;
    }
    else if(e.keyCode == 40){
    	downPressed = false;
    }
    else if(e.keyCode == 16){
		shiftPressed = false;
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
	    	dust.yList[i] < laser.y && (spacePressed || screenTouched)){
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
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.textAlign = "start";
    ctx.fillText("Move\t\t\t\t:<-/-> or Tilt", 0, lifeBar.y + lifeBar.height * 2);
    ctx.fillText("Shoot\t\t\t:Space or Tap", 0, lifeBar.y + lifeBar.height * 3);
    ctx.fillText("Boost\t\t\t:Shift + <-/->", 0, lifeBar.y + lifeBar.height * 4);
    ctx.fillText("Strafe\t\t:Down + <-/->", 0, lifeBar.y + lifeBar.height * 5);
    ctx.textAlign = "end";
    ctx.fillText("Stardust Captured: " + score, canvas.width - 12, 22);
}


function draw() {
	if(!gamePaused){
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	   	drawHelps();
	    drawTitle();
	    genstarXY();
	    drawStars();
	    genSilverDoorXY();
	    drawSilverDoor();
	    genGoldDoorXY();
	    drawGoldDoor();
	    if((spacePressed || screenTouched) && laserEnergyBar.x > -laserEnergyBar.width){
	    	drawLaser();
	    }
	    gendustXY();
	    drawdustShips();
	    drawLEB();
	    drawSEB();
	    drawLB();
	    drawHero();
	    //handleOrientation();
	    for(i = 0; i < dust.yList.length; i++){
	    	if (((spacePressed == false && screenTouched == false) || laser.x < dust.xList[i] || 
	    		laser.x > dust.xList[i] + dust.width || laserEnergyBar.x <= -laserEnergyBar.width)){
	            dust.yList[i] += Math.floor(Math.random() * 5 + 3);
		    	dust.xList[i] += Math.floor(Math.random() * -5 + 3);
		    if (rightPressed && downPressed){
		   		dust.xList[i] -= speed;
		    }
		    if (leftPressed && downPressed){
				dust.xList[i] += speed;
		    }
		    if (dust.yList[i] >= canvas.height){
				dust.yList.splice(i,1);
				dust.xList.splice(i,1);
		    }
	    	}
	    }

	    if((spacePressed || screenTouched) && laserEnergyBar.x >= -laserEnergyBar.width){
			laserEnergyBar.x--;
	    }
	    else if(spacePressed == false && screenTouched == false && laserEnergyBar.x < 0){
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

	    if((rightPressed || screenTiltRight) && heroLeftWingX < canvas.width && 
	    	downPressed == false) {
	        laser.x += speed;
			heroTipX += speed;
	    }
	    else if((rightPressed || screenTiltRight) && heroLeftWingX >= canvas.width && 
	    	downPressed == false){
	    	laser.x -= canvas.width + heroWidth;
			heroTipX -= canvas.width + heroWidth;
	    }

	    else if((leftPressed || screenTiltLeft) && heroRightWingX > 0 && downPressed == false){
	        laser.x -= speed;
			heroTipX -= speed;
	    }
	    else if((leftPressed || screenTiltLeft) && heroRightWingX <= 0 && downPressed == false){
	    	laser.x += canvas.width + heroWidth;
			heroTipX += canvas.width + heroWidth;
	    }

	    if(shiftPressed && staminaBar.x > -staminaBar.width){
			staminaBar.x--;
			speed = 10;
	    }
	    else{
			speed = 7;
	    }
	    if(shiftPressed == false && staminaBar.x < 0){
			staminaBar.x++;
	    }

	    for (i = 0; i <= silverDoorXList.length; i++){
			silverDoorYList[i] += 5;
			if(silverDoorYList[i] > canvas.height){
			    silverDoorYList.splice(i,1);
			    silverDoorXList.splice(i,1);
			}
	    }

	    for (i=0; i <= goldDoorXList.length; i++){
			goldDoorYList[i] += 5;
			if(goldDoorYList[i] > canvas.height){
			    goldDoorYList.splice(i,1);
			    goldDoorXList.splice(i,1);
		    }
	    }
    }
   	requestAnimationFrame(draw);
}
draw();
