/**
 * Nexus Vector - Collision System
 * 
 * This module handles collision detection between game objects.
 */

const CollisionSystem = (function() {
    'use strict';
    
    /**
     * Check if two rectangles are colliding
     * @param {number} x1 - First object's x position
     * @param {number} y1 - First object's y position
     * @param {number} width1 - First object's width
     * @param {number} height1 - First object's height
     * @param {number} x2 - Second object's x position
     * @param {number} y2 - Second object's y position
     * @param {number} width2 - Second object's width
     * @param {number} height2 - Second object's height
     * @returns {boolean} - Whether the objects are colliding
     */
    function isColliding(x1, y1, width1, height1, x2, y2, width2, height2) {
        return x1 < x2 + width2 && 
               x1 + width1 > x2 && 
               y1 < y2 + height2 && 
               y1 + height1 > y2;
    }
    
    /**
     * Check if a point is inside a rectangle
     * @param {number} pointX - Point x position
     * @param {number} pointY - Point y position
     * @param {number} rectX - Rectangle x position
     * @param {number} rectY - Rectangle y position
     * @param {number} rectWidth - Rectangle width
     * @param {number} rectHeight - Rectangle height
     * @returns {boolean} - Whether the point is inside the rectangle
     */
    function isPointInside(pointX, pointY, rectX, rectY, rectWidth, rectHeight) {
        return pointX >= rectX && 
               pointX <= rectX + rectWidth &&
               pointY >= rectY &&
               pointY <= rectY + rectHeight;
    }
    
    /**
     * Check if a point is inside a circle
     * @param {number} pointX - Point x position
     * @param {number} pointY - Point y position
     * @param {number} circleX - Circle center x position
     * @param {number} circleY - Circle center y position
     * @param {number} radius - Circle radius
     * @returns {boolean} - Whether the point is inside the circle
     */
    function isPointInsideCircle(pointX, pointY, circleX, circleY, radius) {
        const dx = pointX - circleX;
        const dy = pointY - circleY;
        return dx * dx + dy * dy <= radius * radius;
    }
    
    // Public API
    return {
        isColliding: isColliding,
        isPointInside: isPointInside,
        isPointInsideCircle: isPointInsideCircle
    };
})();