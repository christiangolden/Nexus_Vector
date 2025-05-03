/**
 * Nexus Vector - Performance Monitor
 * 
 * This module tracks and displays performance metrics like FPS.
 */

const PerformanceMonitor = (function() {
    'use strict';
    
    // FPS tracking variables
    let frameCount = 0;
    let lastTime = 0;
    let fps = 0;
    
    /**
     * Update the FPS counter
     * @param {number} now - Current timestamp in milliseconds
     */
    function update(now) {
        // Initialize lastTime on first call
        if (!lastTime) {
            lastTime = now;
            return;
        }
        
        // Count frames
        frameCount++;
        
        // If a second has passed, update FPS
        if (now - lastTime >= 1000) {
            fps = frameCount;
            frameCount = 0;
            lastTime = now;
        }
    }
    
    /**
     * Draw the FPS counter on screen
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    function draw(ctx) {
        if (fps > 0) {
            ctx.font = "14px Consolas";
            ctx.fillStyle = "#FFF";
            ctx.textAlign = "start";
            ctx.fillText("FPS: " + fps, 10, 20);
        }
    }
    
    /**
     * Get the current FPS
     * @returns {number} - Current FPS
     */
    function getFPS() {
        return fps;
    }
    
    // Public API
    return {
        update: update,
        draw: draw,
        getFPS: getFPS
    };
})();