/**
 * Nexus Vector - Room System
 * 
 * This module handles the generation and management of procedural rooms and rats.
 */

const RoomSystem = (function() {
    'use strict';
    
    // Room and rat lists
    let roomList = [];
    let ratList = [];
    
    // Docking symbol
    const dock = "\u27D0\uFE0E"; 
    
    /**
     * Room constructor
     * @param {number} x - Room x position
     * @param {number} y - Room y position
     * @param {number} width - Room width
     * @param {number} height - Room height
     */
    function Room(x, y, width, height) {
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
    }
    
    /**
     * Creature constructor (used for rats)
     * @param {number} x - Creature x position
     * @param {number} y - Creature y position
     * @param {number} size - Creature size
     */
    function Creature(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
    }
    
    /**
     * Generate procedural rooms
     */
    function generateRooms() {
        const canvas = Game.getCanvas();
        
        // Generate a random number of rooms
        const numFloor = Math.floor(Math.random() * 10 + 5);
        
        for (let i = 0; i < numFloor; i++) {
            let randX, randY, randWidth, randHeight;
            
            if (roomList.length > 0) {
                // Position relative to previous room
                randX = roomList[i - 1].x + Math.floor(Math.random() * -roomList[i - 1].width) +
                        roomList[i - 1].width / 2;
                randY = roomList[i - 1].y + Math.floor(Math.random() * roomList[i - 1].height);
                randWidth = Math.floor(Math.random() * canvas.width / 2 + 100);
                randHeight = Math.floor(Math.random() * canvas.height / 2 + 100);
                
                roomList[i] = new Room(randX, randY, randWidth, randHeight);
            } else {
                // Initial room position
                randX = Math.floor(Math.random() * canvas.width / 2) - canvas.width / 2;
                randY = Math.floor(Math.random() * -canvas.height * numFloor) - canvas.height;
                randWidth = Math.floor(Math.random() * canvas.width / 2 + 100);
                randHeight = Math.floor(Math.random() * canvas.height / 2 + 100);
                
                roomList[i] = new Room(randX, randY, randWidth, randHeight);
            }
            
            // Add a rat to each room
            ratList.push(new Creature(
                roomList[i].x + roomList[i].width * Math.random(),
                roomList[i].y + roomList[i].height * Math.random(),
                12
            ));
        }
    }
    
    /**
     * Draw all rooms
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    function drawRooms(ctx) {
        ctx.fillStyle = "#222";
        
        for (let i = 0; i < roomList.length; i++) {
            ctx.beginPath();
            ctx.moveTo(roomList[i].x, roomList[i].y);
            ctx.lineTo(roomList[i].x + roomList[i].width, roomList[i].y);
            ctx.lineTo(roomList[i].x + roomList[i].width, roomList[i].y + roomList[i].height);
            ctx.lineTo(roomList[i].x, roomList[i].y + roomList[i].height);
            ctx.lineTo(roomList[i].x, roomList[i].y);
            ctx.fill();
            ctx.closePath();
        }
    }
    
    /**
     * Draw all rats
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    function drawRats(ctx) {
        ctx.font = "12px Consolas";
        ctx.fillStyle = "rgb(128,128,0)";
        
        for (let i = 0; i < ratList.length; i++) {
            ctx.fillText("r", ratList[i].x, ratList[i].y);
        }
    }
    
    /**
     * Draw docking stations in each room
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    function drawDock(ctx) {
        ctx.font = "48px Consolas";
        ctx.fillStyle = ColorUtils.randRGB();
        
        for (let i = 0; i < roomList.length; i++) {
            ctx.fillText(
                dock, 
                roomList[i].x + (roomList[i].width / 2), 
                roomList[i].y + (roomList[i].height / 2)
            );
        }
    }
    
    /**
     * Update room positions (move them downward)
     */
    function updateRooms() {
        for (let i = 0; i < roomList.length; i++) {
            roomList[i].y += 0.5;
        }
    }
    
    /**
     * Update rat positions (move them with their rooms)
     */
    function updateRats() {
        for (let i = 0; i < ratList.length; i++) {
            ratList[i].y += 0.5;
        }
    }
    
    /**
     * Move rooms horizontally
     * @param {number} dx - Amount to move horizontally
     */
    function moveRoomsX(dx) {
        for (let i = 0; i < roomList.length; i++) {
            roomList[i].x += dx;
        }
    }
    
    /**
     * Move rats horizontally
     * @param {number} dx - Amount to move horizontally
     */
    function moveRatsX(dx) {
        for (let i = 0; i < ratList.length; i++) {
            ratList[i].x += dx;
        }
    }
    
    /**
     * Check if a point is inside any room
     * @param {number} x - X coordinate to check
     * @param {number} y - Y coordinate to check
     * @returns {boolean} - Whether the point is inside a room
     */
    function inRoom(x, y) {
        for (let i = 0; i < roomList.length; i++) {
            if (CollisionSystem.isPointInside(
                x, y,
                roomList[i].x, roomList[i].y,
                roomList[i].width, roomList[i].height
            )) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Check if hero should dock with a station
     */
    function checkDocking() {
        for (let i = 0; i < roomList.length; i++) {
            if (CollisionSystem.isColliding(
                ShipSystem.hero.tipX - 5, ShipSystem.hero.tipY - 5, 10, 10,
                roomList[i].x + (roomList[i].width / 2) - 15,
                roomList[i].y + (roomList[i].height / 2) - 15,
                30, 30
            )) {
                Game.getContext().fillText("Docking...", ShipSystem.hero.tipX, ShipSystem.hero.tipY);
                DockingSystem.dock(ShipSystem.hero.tipX, ShipSystem.hero.tipY);
                break;
            }
        }
    }
    
    /**
     * Check for rat interactions with the character
     */
    function checkRatInteractions() {
        for (let i = 0; i < ratList.length; i++) {
            if (CollisionSystem.isColliding(
                DockingSystem.getManX() - 5, DockingSystem.getManY() - 5, 10, 10,
                ratList[i].x - 5, ratList[i].y - 5, 10, 10
            )) {
                Game.getContext().fillText(
                    "Rat: 'Oy, ya stapped on meh!'",
                    ratList[i].x, ratList[i].y - ratList[i].size
                );
            }
        }
    }
    
    /**
     * Regenerate rooms when current ones move off screen
     */
    function regenerateRooms() {
        roomList = [];
        ratList = [];
        generateRooms();
    }
    
    /**
     * Clear all rooms and rats
     */
    function clearRooms() {
        roomList = [];
        ratList = [];
    }
    
    // Public API
    return {
        Room: Room,
        Creature: Creature,
        roomList: roomList,
        ratList: ratList,
        generateRooms: generateRooms,
        drawRooms: drawRooms,
        drawRats: drawRats,
        drawDock: drawDock,
        updateRooms: updateRooms,
        updateRats: updateRats,
        moveRoomsX: moveRoomsX,
        moveRatsX: moveRatsX,
        inRoom: inRoom,
        checkDocking: checkDocking,
        checkRatInteractions: checkRatInteractions,
        regenerateRooms: regenerateRooms,
        clearRooms: clearRooms
    };
})();