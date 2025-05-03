/**
 * Nexus Vector - Color Utilities
 * 
 * This module handles color generation and caching for better performance.
 */

const ColorUtils = (function() {
    'use strict';
    
    // Color cache for better performance
    let cachedColors = [];
    const colorUpdateInterval = 10;
    
    /**
     * Generate a random color value (0-255)
     * @returns {number} Random color value
     */
    function randColor() {
        return Math.floor(Math.random() * 255);
    }
    
    /**
     * Initialize the color cache with pre-generated colors
     */
    function initColorCache() {
        cachedColors = [];
        for (let i = 0; i < 20; i++) {
            cachedColors.push("rgb(" + randColor() + "," + randColor() + "," + randColor() + ")");
        }
    }
    
    /**
     * Get a random color from the cache
     * @returns {string} Random RGB color string
     */
    function getRandomCachedColor() {
        return cachedColors[Math.floor(Math.random() * cachedColors.length)];
    }
    
    /**
     * Generate an RGB color string, using color cache for better performance
     * @returns {string} RGB color string
     */
    function randRGB() {
        // Update one color in the cache periodically
        if (Game.getFrameCount() % colorUpdateInterval === 0) {
            const index = Math.floor(Math.random() * cachedColors.length);
            cachedColors[index] = "rgb(" + randColor() + "," + randColor() + "," + randColor() + ")";
        }
        return getRandomCachedColor();
    }
    
    // Public API
    return {
        randColor: randColor,
        randRGB: randRGB,
        initColorCache: initColorCache,
        getRandomCachedColor: getRandomCachedColor
    };
})();