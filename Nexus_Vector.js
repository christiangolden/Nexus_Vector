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

//enemies
var dustWidth = 16;
var dustHeight = 16;
var dustXList = [];
var dustYList = [];
var dustX = 0;
var dustY = 0;

//stars
var starWidth = 2;
var starHeight = 2;
var starXList = [];
var starYList = [];
var starX = 0;
var starY = 0;

//laser
var laserWidth = 1;
var laserHeight = canvas.height-10;
var laserX = heroTipX - .5;
var laserY = canvas.height;

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
var laserEnergyBarWidth = canvas.width/5;
var laserEnergyBarHeight = 10;
var laserEnergyBarY = 0;
var laserEnergyBarX = 0;

var staminaBarWidth = canvas.width/5;
var staminaBarHeight = 10;
var staminaBarY = laserEnergyBarY + 10;
var staminaBarX = 0;

var lifeBarWidth = canvas.width/5;
var lifeBarHeight = 10;
var lifeBarY = staminaBarY + 10;
var lifeBarX = 0;



var randGreen = 0;
var randRed = 0;
var randBlue = 0;

var playingGame = false;

function drawHero(){
	for (i = 0; i <= dustXList.length; i++){
	if (dustXList[i] + dustWidth > heroLeftWingX && dustXList[i] < (heroRightWingX) && 
		(dustYList[i] + dustHeight) > (heroTipY) && dustYList[i] < heroLeftWingY){
	    heroCollision = true;
	    delete dustXList[i];
	    delete dustYList[i];
	}
    }
    if(heroCollision){
		deaths++;
		if(lifeBarX > -lifeBarWidth){
	            lifeBarX -= 10;
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
	    ctx.moveTo(heroTipX, heroTipY+2);
	    ctx.lineTo(heroLeftWingX+2, heroLeftWingY-1);
	    ctx.lineTo(heroRightWingX-2, heroRightWingY-1);
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
	ctx.rect(laserEnergyBarX, laserEnergyBarY, laserEnergyBarWidth, laserEnergyBarHeight);
	ctx.fillStyle = "#ff0000";
	ctx.fill();
	ctx.closePath();
}

//draw stamina energy bar
function drawSEB(){
	ctx.beginPath();
	ctx.rect(staminaBarX, staminaBarY, staminaBarWidth, staminaBarHeight);
	ctx.fillStyle = "#0000ff";
	ctx.fill();
	ctx.closePath();
}

function drawLB(){
	ctx.beginPath();
	ctx.rect(lifeBarX, lifeBarY, lifeBarWidth, lifeBarHeight);
	ctx.fillStyle = "#00ff00";
	ctx.fill();
	ctx.closePath();
}

function gendustXY(){
    if (Math.floor(Math.random() * 5) == 1){
	dustX = Math.floor(Math.random()* -canvas.width) + Math.floor(Math.random() * canvas.width * 2);
	dustY = Math.floor(Math.random()* -canvas.height - 1);
	if ((spacePressed == false && screenTouched == false) || laserX < dustXList[i] || 
		laserX > dustXList[i] + dustWidth || laserEnergyBarX <= -laserEnergyBarWidth){
	    dustXList[dustXList.length] = dustX;
	    dustYList[dustYList.length] = dustY;
	}
    }
}

function drawdustShips(){
	for (i = 0; i < dustYList.length; i++){
	    if(dustYList[i] >= canvas.height){
		delete dustYList[i];
		delete dustXList[i];
	    }
	    else{
		dustRGB1 = Math.floor(Math.random() * 255);
		dustRGB2 = Math.floor(Math.random() * 255);
		dustRGB3 = Math.floor(Math.random() * 255);
		ctx.beginPath();
		ctx.rect(dustXList[i], dustYList[i], dustWidth, dustHeight);
		ctx.fillStyle = 'rgb(' + dustRGB1 + ',' + dustRGB2 + ',' + dustRGB3 + ')';
		ctx.fill();
		ctx.closePath();
	    }
	}
}

function genStarXY(){
    if (Math.floor(Math.random() * 3) == 1){
	starX = Math.floor(Math.random() * -canvas.width) + Math.floor(Math.random() * canvas.width * 2);
	starY = Math.floor(Math.random() * -canvas.height) + Math.floor(Math.random() * canvas.height);
	starXList[starXList.length] = starX;
	starYList[starYList.length] = starY;
    }
}

function drawStars(){
    for (i = 0; i < starYList.length; i++){
	var starSize = Math.floor(Math.random() * 4);
	randRGB = Math.floor(Math.random() * 255);
	ctx.beginPath();
	ctx.rect(starXList[i], starYList[i], starSize, starSize);
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
    else if(e.keyCode == 80){
	pPressed = true;
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
    else if(e.keyCode == 80){
	pPressed = false;
    }
}

//my added drawLaser function
function drawLaser(){
	ctx.beginPath();
	ctx.rect(laserX, 0, laserWidth, laserHeight);
	ctx.fillStyle = 'rgb(' +
		Math.floor(Math.random() * 255) + ',' +
		Math.floor(Math.random() * 255) + ',' +
		Math.floor(Math.random() * 255) + ')';
	ctx.fill();
	ctx.closePath();
	for (i = 0; i < dustXList.length; i++){
	    if(laserX >= dustXList[i] && laserX <= dustXList[i] + dustWidth && dustYList[i] > 0 && 
	    	dustYList[i] < laserY && (spacePressed || screenTouched)){
			delete dustXList[i];
			delete dustYList[i];
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
    ctx.fillText("Nexus Vector", titleX, canvas.height/2);
    if(titleX > -444){
    	titleX--;
    }
    else{
    	titleX = canvas.width;
    }
}

function drawStats(){
    ctx.font = "22px Courier New";
    ctx.fillStyle = "#fff";
    ctx.fillText("Move: <-/-> or Tilt", 0, lifeBarY + 30);
    ctx.fillText("Shoot: Space or Tap", 0, lifeBarY + 50);
    ctx.fillText("Boost: Shift + <-/->", 0, lifeBarY + 70);
    ctx.fillText("Strafe: Down + <-/->", 0, lifeBarY + 90);
    ctx.fillText("Dust: " + score, 0, lifeBarY + 110);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStats();
    drawTitle();
    genStarXY();
    drawStars();
    genSilverDoorXY();
    drawSilverDoor();
    genGoldDoorXY();
    drawGoldDoor();
    if((spacePressed || screenTouched) && laserEnergyBarX > -laserEnergyBarWidth){
    	drawLaser();
    }
    gendustXY();
    drawdustShips();
    drawLEB();
    drawSEB();
    drawLB();
    drawHero();
    //handleOrientation();
    for(i = 0; i < dustYList.length; i++){
    	if (((spacePressed == false && screenTouched == false) || laserX < dustXList[i] || 
    		laserX > dustXList[i] + dustWidth || laserEnergyBarX <= -laserEnergyBarWidth)){
            dustYList[i] += Math.floor(Math.random() * 5 + 3);
	    dustXList[i] += Math.floor(Math.random() * -5 + 3);
	    if (rightPressed && downPressed){
	   	dustXList[i] -= speed;
	    }
	    if (leftPressed && downPressed){
		dustXList[i] += speed;
	    }
	    if (dustYList[i] >= canvas.height){
		delete dustYList[i];
		delete dustXList[i];
	    }
    	}
    }

    if((spacePressed || screenTouched) && laserEnergyBarX >= -laserEnergyBarWidth){
	laserEnergyBarX--;
    }
    else if(spacePressed == false && screenTouched == false && laserEnergyBarX < 0){
	laserEnergyBarX++;
    }

    for (i = 0; i < starXList.length; i++){
		if(starYList[i] < canvas.height){
		    starYList[i]++;
		}
		else{
		    delete starYList[i];
		    delete starXList[i];
		}
    }

    if((rightPressed || screenTiltRight) && heroLeftWingX < canvas.width && 
    	downPressed == false) {
        laserX += speed;
		heroTipX += speed;
    }
    else if((rightPressed || screenTiltRight) && heroLeftWingX >= canvas.width && 
    	downPressed == false){
    	laserX -= canvas.width + heroWidth;
		heroTipX -= canvas.width + heroWidth;
    }

    else if((leftPressed || screenTiltLeft) && heroRightWingX > 0 && downPressed == false){
        laserX -= speed;
		heroTipX -= speed;
    }
    else if((leftPressed || screenTiltLeft) && heroRightWingX <= 0 && downPressed == false){
    	laserX += canvas.width + heroWidth;
		heroTipX += canvas.width + heroWidth;
    }

    if(shiftPressed && staminaBarX > -staminaBarWidth){
		staminaBarX--;
		speed = 10;
    }
    else{
		speed = 7;
    }
    if(shiftPressed == false && staminaBarX < 0){
		staminaBarX++;
    }

    for (i = 0; i <= silverDoorXList.length; i++){
		silverDoorYList[i] += 5;
		if(silverDoorYList[i] > canvas.height){
		    delete silverDoorYList[i];
		    delete silverDoorXList[i];
		}
    }

    for (i=0; i <= goldDoorXList.length; i++){
		goldDoorYList[i] += 5;
		if(goldDoorYList[i] > canvas.height){
		    delete goldDoorYList[i];
		    delete goldDoorXList[i];
	    }
    }
    requestAnimationFrame(draw);
}
draw();