/**
 * Nexus Vector - Star System
 * 
 * This module handles the star field background.
 */

const StarSystem = (function() {
    'use strict';
    
    // Star properties
    const star = {
        size: 1,
        xList: [],
        yList: [],
        x: 0,
        y: 0
    };
    
    // Maximum number of stars for performance
    const starMaxCount = 150;
    
    // Cache for star sizes to avoid recalculating font strings
    const starSizes = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    const starSizeCache = {};
    
    /**
     * Initialize star size cache
     */
    function initStarSizeCache() {
        for (let i = 0; i < starSizes.length; i++) {
            starSizeCache[starSizes[i]] = starSizes[i] + "px Courier";
        }
    }
    
    /**
     * Generate a new star at a random position
     */
    function genStarXY() {
        const canvas = GameState.getCanvas();
        
        // Only generate stars if we're below the limit and randomly
        if (star.xList.length < starMaxCount && Math.floor(Math.random() * 3) === 1) {
            star.x = Math.floor(Math.random() * -canvas.width) +
                Math.floor(Math.random() * canvas.width * 2);
            star.y = Math.floor(Math.random() * -canvas.height) +
                Math.floor(Math.random() * canvas.height);
            star.xList.push(star.x);
            star.yList.push(star.y);
        }
    }
    
    /**
     * Draw the stars
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    function drawStars(ctx) {
        if (star.xList.length < starMaxCount) {
            genStarXY();
        }
        ctx.textAlign = "center";
        const warpLevel = GameState.getWarpLevel();
        for (let i = 0; i < star.yList.length; i++) {
            const sizeIndex = Math.floor(Math.random() * starSizes.length);
            let size = starSizes[sizeIndex];
            // Stretch stars vertically in warp mode
            if (warpLevel > 0) size = size * (1 + 1.5 * warpLevel);
            ctx.font = starSizeCache[sizeIndex in starSizeCache ? starSizes[sizeIndex] : size];
            ctx.fillStyle = ColorUtils.randRGB();
            if (warpLevel > 0) {
                ctx.save();
                ctx.transform(1, 0, 0, 1 + 1.5 * warpLevel, 0, -star.yList[i]);
                ctx.globalAlpha = 0.7;
                ctx.fillText("*", star.xList[i], star.yList[i] + size / 2);
                ctx.globalAlpha = 1.0;
                ctx.restore();
            } else {
                ctx.fillText("*", star.xList[i], star.yList[i] + size / 2);
            }
        }
    }
    
    /**
     * Update stars position (for normal gameplay)
     */
    function updateStars() {
        const canvas = GameState.getCanvas();
        const warpLevel = GameState.getWarpLevel();
        const warpFactor = 3;
        const speed = 1 + (warpFactor - 1) * warpLevel;
        for (let i = 0; i < star.xList.length; i++) {
            if (star.yList[i] < canvas.height * 2) {
                star.yList[i] += speed;
            } else {
                star.yList.splice(i, 1);
                star.xList.splice(i, 1);
                i--;
            }
        }
    }
    
    /**
     * Update stars position in docked mode
     */
    function updateStarsInDockedMode() {
        const canvas = GameState.getCanvas();
        
        // Move stars down slower in docked mode
        for (let i = 0; i < star.xList.length; i++) {
            if (star.yList[i] < canvas.height * 2) {
                star.yList[i] += 0.5;
            } else {
                star.yList.splice(i, 1);
                star.xList.splice(i, 1);
                i--;
            }
        }
    }
    
    /**
     * Move all stars horizontally
     * @param {number} dx - Amount to move stars horizontally
     */
    function moveStarsX(dx) {
        for (let i = 0; i < star.xList.length; i++) {
            star.xList[i] += dx;
        }
    }
    
    // Public API
    return {
        initStarSizeCache: initStarSizeCache,
        drawStars: drawStars,
        updateStars: updateStars,
        updateStarsInDockedMode: updateStarsInDockedMode,
        moveStarsX: moveStarsX,
        getStars: function() { return star; }
    };
})();