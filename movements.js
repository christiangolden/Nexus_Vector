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
    hero.rightX += 1;   //man[1] -= 1;
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
    hero.rightX -= 1;    //man[1] += 1;
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
    hero.leftY += 1;    //man[2] -= 1;
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
    hero.leftY -= 1;   //man[2] += 1;
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