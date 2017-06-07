
/*TODO: 
	Design Start Screen
	Design Pause Screen
	Design Death Screen
	Design Menu Button/Menu
*/

//set up canvas
var canvas = document.getElementById("myCanvas");
canvas.width = document.body.clientWidth;
canvas.height = document.body.clientHeight;
var ctx = canvas.getContext("2d");

var gamePaused = false;

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

var dead = false;

var titleX = canvas.width;

//doors ***DRAW DOORS AND MAKE THEM BLINK VARIOUS SHADES OF THEIR COLOR***
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

//hero stuff
var heroWidth = 32;
var heroHeight = 32;
var heroX = (canvas.width-heroWidth)/2;
var heroY = canvas.height-heroHeight;
var Hero = new Image();
Hero.src = "Shoot_Them.bmp";

//enemies
var enemyWidth = 16;
var enemyHeight = 16;
var enemyXList = [];
var enemyYList = [];
var enemyX = 0;
var enemyY = 0;

//stars
var starWidth = 2;
var starHeight = 2;
var starXList = [];
var starYList = [];
var starX = 0;
var starY = 0;

//laser
var laserWidth = 1;
var laserHeight = canvas.height;
var laserX = heroX + (heroWidth/2) - .5;
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

//ctx drawn hero
var drawnHeroRightWingX = drawnHeroTipX + 10;
var drawnHeroLeftWingX = drawnHeroTipX - 10;

var drawnHeroWidth = drawnHeroRightWingX - drawnHeroLeftWingX;
var drawnHeroHeight = drawnHeroRightWingY - drawnHeroTipY;
var drawnHeroTipX = canvas.width/2;
var drawnHeroTipY = canvas.height - 30;
var drawnHeroLeftWingY = drawnHeroTipY + 30;
var drawnHeroRightWingY = drawnHeroTipY + 30;

var randGreen = 0;
var randRed = 0;
var randBlue = 0;

var playingGame = false;

/************** BEGIN WORKING ON IMPLEMENTATION OF HUD [INCLUDE # OF ENEMIES SHOT, # MISSED, RATIO OF SHOT TO MISSED, ETC.] **************/

function drawNewHero(){
    randGreen = Math.floor(Math.random() * 255);
    randRed = Math.floor(Math.random() * 255);
    randBlue = Math.floor(Math.random() * 255);
    drawnHeroLeftWingX = drawnHeroTipX - 10;
    drawnHeroRightWingX = drawnHeroTipX + 10;
    drawnHeroWidth = drawnHeroRightWingX - drawnHeroLeftWingX;
    ctx.beginPath();
    ctx.moveTo(drawnHeroTipX, drawnHeroTipY);
    ctx.lineTo(drawnHeroLeftWingX, drawnHeroLeftWingY);
    ctx.lineTo(drawnHeroRightWingX, drawnHeroRightWingY);
    ctx.fillStyle = 'rgb(' + randRed +',' + randGreen + ',' + randBlue + ')';
    ctx.fill();
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

//create silver doors somewhat sparingly (collision with silver door switches to vertical mode
function genSilverDoorXY(){
    if(Math.floor(Math.random() * 80) == 1){
	silverDoorYList[silverDoorYList.length] = Math.floor(Math.random() * (screen.height * -screen.height));
	silverDoorXList[silverDoorXList.length] = Math.floor(Math.random() * screen.width);
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

function genEnemyXY(){
    if (Math.floor(Math.random() * 5) == 1){
	enemyX = Math.floor(Math.random()* -canvas.width) + Math.floor(Math.random() * canvas.width * 2);
	enemyY = Math.floor(Math.random()* -canvas.height - 1);
	if ((spacePressed == false && screenTouched == false) || laserX < enemyXList[i] || laserX > enemyXList[i] + enemyWidth || laserEnergyBarX <= -laserEnergyBarWidth){
	    enemyXList[enemyXList.length] = enemyX;
	    enemyYList[enemyYList.length] = enemyY;
	}
    }
}

function drawEnemyShips(){
	for (i = 0; i < enemyYList.length; i++){
	    if(enemyYList[i] >= canvas.height){
		delete enemyYList[i];
		delete enemyXList[i];
	    }
	    else{
		enemyRGB1 = Math.floor(Math.random() * 255);
		enemyRGB2 = Math.floor(Math.random() * 255);
		enemyRGB3 = Math.floor(Math.random() * 255);
		ctx.beginPath();
		ctx.rect(enemyXList[i], enemyYList[i], enemyWidth, enemyHeight);
		ctx.fillStyle = 'rgb(' + enemyRGB1 + ',' + enemyRGB2 + ',' + enemyRGB3 + ')';
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

function drawHero(){
    for (i = 0; i <= enemyXList.length; i++){
	if (enemyXList[i] + enemyWidth > heroX && enemyXList[i] < (heroX + heroWidth) && (enemyYList[i] + enemyHeight) > (heroY) && enemyYList[i] < heroY + heroWidth){
	    dead = true;
	    delete enemyXList[i];
	    delete enemyYList[i];
	}
    }
    if(dead){
	deaths++;
	if(lifeBarX > -lifeBarWidth){
            lifeBarX--;
	}
    }
    if(dead == false){
        ctx.drawImage(Hero, heroX, heroY);
    }
    dead = false;
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
	for (i = 0; i < enemyXList.length; i++){
	    if(laserX >= enemyXList[i] && laserX <= enemyXList[i] + enemyWidth && enemyYList[i] > 0 && enemyYList[i] < laserY && (spacePressed || screenTouched)){
		delete enemyXList[i];
		delete enemyYList[i];
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
    ctx.fillText("STAR THEORY", titleX, canvas.height/2);
    if(score > 0){
        ctx.fillText(score, canvas.width/2 - 45, canvas.height/2 + 65);
    }
    if(titleX > -canvas.width/3){
        titleX--;
    }
    else{
        titleX = canvas.width;
    }
}

function drawStats(){
    ctx.font = "22px Courier New";
    ctx.fillStyle = "#fff";
    ctx.fillText("Move: Left/Right Keys", 0, lifeBarY + 30);
    ctx.fillText("Shoot: Space", 0, lifeBarY + 50);
    ctx.fillText("Boost: Shift", 0, lifeBarY + 70);
    ctx.fillText("Kills: " + score, 0, lifeBarY + 90);
    ctx.fillText("Deaths: " + deaths, 0, lifeBarY + 110);
}

/*function pauseGame(){
    if(pPressed && !gamePaused){
	gamePaused = true;
    }
    else if(pPressed && gamePaused){
	gamePaused = false;
    }
}*/

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
    genEnemyXY();
    drawEnemyShips();
    drawLEB();
    drawSEB();
    drawLB();
    //drawHero();
    drawNewHero();
    //handleOrientation();
    for(i = 0; i < enemyYList.length; i++){
    	if (((spacePressed == false && screenTouched == false) || laserX < enemyXList[i] || laserX > enemyXList[i] + enemyWidth || laserEnergyBarX <= -laserEnergyBarWidth)){// && enemyYList[i] < canvas.height){
            enemyYList[i] += Math.floor(Math.random() * 5 + 3);
	    enemyXList[i] += Math.floor(Math.random() * -5 + 3);
	    if (rightPressed && downPressed){
	   	enemyXList[i] -= speed;
	    }
	    if (leftPressed && downPressed){
		enemyXList[i] += speed;
	    }
	    if (enemyYList[i] >= canvas.height){
		delete enemyYList[i];
		delete enemyXList[i];
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

    if((rightPressed || screenTiltRight) && heroX < canvas.width && downPressed == false) {
        laserX += speed;
        heroX += speed;
	drawnHeroTipX += speed;
    }
    else if((rightPressed || screenTiltRight) && heroX >= canvas.width && downPressed == false){
    	laserX -= canvas.width + drawnHeroWidth;
    	heroX -= canvas.width + heroWidth;
	drawnHeroTipX -= canvas.width + drawnHeroWidth;
    }

    else if((leftPressed || screenTiltLeft) && heroX > 0 - heroWidth && downPressed == false) {
        laserX -= speed;
        heroX -= speed;
	drawnHeroTipX -= speed;
    }
    else if((leftPressed || screenTiltLeft) && heroX <= 0 - heroWidth && downPressed == false){
    	laserX += canvas.width + drawnHeroWidth;
    	heroX += canvas.width + heroWidth;
	drawnHeroTipX += canvas.width + drawnHeroWidth;
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
	//silverDoorXList[i]++;
	silverDoorYList[i]++;
	if(silverDoorYList[i] > canvas.height){
	    delete silverDoorYList[i];
	    delete silverDoorXList[i];
	}
    }

    for (i=0; i <= goldDoorXList.length; i++){
	goldDoorYList[i]++;
	if(goldDoorYList[i] > canvas.height){
	    delete goldDoorYList[i];
	    delete goldDoorXList[i];
        }
    }
    requestAnimationFrame(draw);
}
draw();

