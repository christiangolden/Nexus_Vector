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
    
    // Frame offset for color animation
    let frameOffset = 0;
    
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
     * Generate a random RGB color string
     * @returns {string} - Random RGB color string
     */
    function randRGB() {
        const frameCount = (typeof GameState !== 'undefined' && GameState.getFrameCount) ? GameState.getFrameCount() : 0;
        
        // Generate different values for each RGB component
        const r = Math.floor(Math.random() * 200 + 55);
        const g = Math.floor(Math.random() * 200 + 55);
        const b = Math.floor(Math.random() * 200 + 55);
        
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    // Public API
    return {
        randColor: randColor,
        randRGB: randRGB,
        initColorCache: initColorCache,
        getRandomCachedColor: getRandomCachedColor
    };
})();