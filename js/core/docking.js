/**
 * Nexus Vector - Docking System
 * 
 * This module handles the docking state when the ship lands in a room,
 * allowing the player to explore the space station as a character.
 */

const DockingSystem = (function() {
    'use strict';
    
    // Docking status
    let docking = false;
    
    // Character representation
    const man = {
        symbol: "@",   // walking hero after docked
        x: 0,          // x position
        y: 0,          // y position
        health: 100,   // health points
        energy: 100,   // energy points
        inventory: [], // collected items
        facing: "down" // direction facing: up, down, left, right
    };
    
    // Interaction range for terminals, objects, etc.
    const INTERACTION_RANGE = 20;
    
    // Movement speed (pixels per second)
    const MOVEMENT_SPEED = 3;
    
    // Inventory system
    const inventory = {
        maxSize: 10,
        items: []
    };
    
    // FOV for exploration - reveal rooms gradually
    const FOV_RADIUS = 300;
    
    // Message log for interactions
    const messageLog = {
        messages: [],
        maxSize: 5,
        
        add: function(message) {
            this.messages.unshift({ text: message, time: 180 }); // 3 seconds at 60fps
            if (this.messages.length > this.maxSize) {
                this.messages.pop();
            }
            
            // Also show as notification
            GameState.showNotification(message);
        },
        
        update: function() {
            for (let i = this.messages.length - 1; i >= 0; i--) {
                this.messages[i].time--;
                if (this.messages[i].time <= 0) {
                    this.messages.splice(i, 1);
                }
            }
        },
        
        draw: function(ctx) {
            ctx.font = "14px Consolas";
            ctx.textAlign = "left";
            ctx.fillStyle = "#FFFFFF";
            
            for (let i = 0; i < this.messages.length; i++) {
                const opacity = Math.min(1, this.messages[i].time / 60);
                ctx.fillStyle = `rgba(255,255,255,${opacity})`;
                ctx.fillText(this.messages[i].text, 10, 30 + i * 20);
            }
        }
    };
    
    // Current room for UI display
    let currentRoom = null;
    
    /**
     * Start docking process at specified coordinates
     * @param {number} x - X position to dock at
     * @param {number} y - Y position to dock at
     */
    function dock(x, y) {
        docking = true;
        man.x = x;
        man.y = y;
        
        // Find the room we're docking in
        for (let i = 0; i < RoomSystem.roomList.length; i++) {
            const room = RoomSystem.roomList[i];
            if (room.type === "DOCK" && 
                CollisionSystem.isPointInside(
                    x, y, 
                    room.x, room.y, 
                    room.width, room.height
                )) {
                currentRoom = room;
                break;
            }
        }
        
        // Welcome message
        if (currentRoom) {
            messageLog.add(`Docked at ${currentRoom.name}. Use arrow keys to move.`);
        } else {
            messageLog.add("Docked at station. Use arrow keys to move.");
        }
        
        // Switch to docked state
        GameState.setState('DOCKED');
    }
    
    /**
     * End docking and return to normal gameplay
     */
    function undock() {
        const canvas = GameState.getCanvas();
        
        // Set ship position back at bottom of screen
        ShipSystem.hero.tipY = canvas.height - 50;
        ShipSystem.hero.leftY = ShipSystem.hero.tipY + ShipSystem.hero.height;
        ShipSystem.hero.rightY = ShipSystem.hero.tipY + ShipSystem.hero.height;
        
        // Move rooms down to get back to normal gameplay view
        for (let i = 0; i < RoomSystem.roomList.length; i++) {
            RoomSystem.roomList[i].y += canvas.height / 2 + ShipSystem.hero.height;
            
            // Mark visited rooms
            if (isInRoom(RoomSystem.roomList[i])) {
                RoomSystem.roomList[i].visited = true;
            }
        }
        
        // Move rats with rooms
        for (let i = 0; i < RoomSystem.ratList.length; i++) {
            RoomSystem.ratList[i].y += canvas.height / 2 + ShipSystem.hero.height;
        }
        
        docking = false;
        messageLog.add("Undocked from station. Returning to flight mode.");
    }
    
    /**
     * Set the unDeadHero flag to revive the player
     */
    function reviveHero() {
        GameState.setPlayerUndead(true);
    }
    
    /**
     * Draw the character (man) when docked with direction indicators
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    function drawMan(ctx) {
        // Draw the character with a direction indicator
        ctx.font = "16px Consolas";
        ctx.fillStyle = ColorUtils.randRGB();
        
        // Draw facing indicator (small triangle pointing in facing direction)
        ctx.save();
        ctx.translate(man.x, man.y);
        
        ctx.fillText(man.symbol, 0, 0);
        
        ctx.restore();
        
        // Draw FOV visualization (semi-transparent circle)
        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = "#88BBFF";
        ctx.beginPath();
        ctx.arc(man.x, man.y, FOV_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Draw player status UI
        drawPlayerStatus(ctx);
        
        // Draw message log
        messageLog.update();
        messageLog.draw(ctx);
    }
    
    /**
     * Draw player status UI
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    function drawPlayerStatus(ctx) {
        const canvas = GameState.getCanvas();
        
        // Draw status bar backgrounds
        ctx.fillStyle = "#333333";
        ctx.fillRect(10, canvas.height - 30, 150, 20); // Health
        ctx.fillRect(170, canvas.height - 30, 150, 20); // Energy
        
        // Draw health bar
        ctx.fillStyle = "#DD3333";
        ctx.fillRect(10, canvas.height - 30, 150 * (man.health / 100), 20);
        
        // Draw energy bar
        ctx.fillStyle = "#3333DD";
        ctx.fillRect(170, canvas.height - 30, 150 * (man.energy / 100), 20);
        
        // Draw status text
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "14px Consolas";
        ctx.textAlign = "center";
        ctx.fillText(`HP: ${man.health}/100`, 85, canvas.height - 15);
        ctx.fillText(`EP: ${man.energy}/100`, 245, canvas.height - 15);
        
        // Draw current room info
        if (currentRoom) {
            ctx.textAlign = "left";
            ctx.fillStyle = "#AAFFAA";
            ctx.fillText(`Location: ${currentRoom.name}`, 10, canvas.height - 45);
        }
        
        // Draw mini map in corner
        drawMiniMap(ctx);
    }
    
    /**
     * Draw a simple mini-map in the corner showing room layout
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    function drawMiniMap(ctx) {
        const canvas = GameState.getCanvas();
        const mapSize = 150;
        const mapX = canvas.width - mapSize - 10;
        const mapY = 10;
        const scale = 0.1;
        
        // Draw map background
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(mapX, mapY, mapSize, mapSize);
        ctx.strokeStyle = "#FFFFFF";
        ctx.strokeRect(mapX, mapY, mapSize, mapSize);
        
        ctx.save();
        ctx.translate(mapX + mapSize/2, mapY + mapSize/2);
        ctx.scale(scale, scale);
        
        // Draw rooms on minimap
        for (const room of RoomSystem.roomList) {
            if (!room.visited && !room.revealed) continue;
            
            if (room.points) {
                ctx.beginPath();
                ctx.moveTo(room.points[0].x - man.x, room.points[0].y - man.y);
                for (let j = 1; j < room.points.length; j++) {
                    ctx.lineTo(room.points[j].x - man.x, room.points[j].y - man.y);
                }
                ctx.closePath();
                ctx.fillStyle = room.visited ? room.color : "rgba(80,80,80,0.7)";
                ctx.fill();
                ctx.strokeStyle = "#FFFFFF";
                ctx.lineWidth = 10;
                ctx.stroke();
            } else {
                ctx.fillStyle = room.visited ? room.color : "rgba(80,80,80,0.7)";
                ctx.fillRect(
                    room.x - man.x, 
                    room.y - man.y, 
                    room.width, 
                    room.height
                );
                ctx.strokeStyle = "#FFFFFF";
                ctx.lineWidth = 10;
                ctx.strokeRect(
                    room.x - man.x, 
                    room.y - man.y, 
                    room.width, 
                    room.height
                );
            }
        }
        
        // Draw connections
        for (const conn of RoomSystem.getRoomConnections()) {
            if (!conn.roomA.visited && !conn.roomB.visited) continue;
            
            ctx.strokeStyle = "#88AAFF";
            ctx.lineWidth = 15;
            ctx.beginPath();
            ctx.moveTo(conn.pointA.x - man.x, conn.pointA.y - man.y);
            ctx.lineTo(conn.pointB.x - man.x, conn.pointB.y - man.y);
            ctx.stroke();
        }
        
        // Draw player position in center
        ctx.fillStyle = "#FFFF00";
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Draw map title
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "12px Consolas";
        ctx.textAlign = "center";
        ctx.fillText("STATION MAP", mapX + mapSize/2, mapY + mapSize + 15);
    }
    
    /**
     * Center the view on the man when docked
     */
    function centerViewOnMan() {
        const canvas = GameState.getCanvas();
        
        // Calculate distance to center
        const xdist = canvas.width / 2 - man.x;
        const ydist = canvas.height / 2 - man.y;
        
        // Smoothly move view to center on man
        if (Math.abs(xdist) > 0.1) {
            const moveX = xdist / 10;
            man.x += moveX;
            ShipSystem.hero.tipX += moveX;
            ShipSystem.hero.leftX += moveX;
            ShipSystem.hero.rightX += moveX;

            for (let i = 0; i < RoomSystem.roomList.length; i++) {
                RoomSystem.roomList[i].x += moveX;
                
                // If room has points for shape
                if (RoomSystem.roomList[i].points) {
                    for (let j = 0; j < RoomSystem.roomList[i].points.length; j++) {
                        RoomSystem.roomList[i].points[j].x += moveX;
                    }
                }
                
                // If room has docking position
                if (RoomSystem.roomList[i].dockingPosition) {
                    RoomSystem.roomList[i].dockingPosition.x += moveX;
                }
            }
            
            // Move room connections
            const connections = RoomSystem.getRoomConnections();
            for (const conn of connections) {
                conn.pointA.x += moveX;
                conn.pointB.x += moveX;
            }
            
            for (let i = 0; i < RoomSystem.ratList.length; i++) {
                RoomSystem.ratList[i].x += moveX;
            }
        }
        
        if (Math.abs(ydist) > 0.1) {
            const moveY = ydist / 10;
            man.y += moveY;
            ShipSystem.hero.tipY += moveY;
            ShipSystem.hero.leftY += moveY;
            ShipSystem.hero.rightY += moveY;
            
            for (let i = 0; i < RoomSystem.roomList.length; i++) {
                RoomSystem.roomList[i].y += moveY;
                
                // If room has points for shape
                if (RoomSystem.roomList[i].points) {
                    for (let j = 0; j < RoomSystem.roomList[i].points.length; j++) {
                        RoomSystem.roomList[i].points[j].y += moveY;
                    }
                }
                
                // If room has docking position
                if (RoomSystem.roomList[i].dockingPosition) {
                    RoomSystem.roomList[i].dockingPosition.y += moveY;
                }
            }
            
            // Move room connections
            const connections = RoomSystem.getRoomConnections();
            for (const conn of connections) {
                conn.pointA.y += moveY;
                conn.pointB.y += moveY;
            }
            
            for (let i = 0; i < RoomSystem.ratList.length; i++) {
                RoomSystem.ratList[i].y += moveY;
            }
        }
    }
    
    /**
     * Check if player is in a specific room
     * @param {Object} room - The room to check
     * @returns {boolean} - Whether player is in the room
     */
    function isInRoom(room) {
        if (room.points) {
            // Check complex room shape
            return isPointInPolygon(man.x, man.y, room.points);
        } else {
            // Check rectangular room
            return CollisionSystem.isPointInside(
                man.x, man.y,
                room.x, room.y,
                room.width, room.height
            );
        }
    }
    
    /**
     * Check if point is in polygon
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {Array} points - Array of points defining polygon
     * @returns {boolean} - Whether point is in polygon
     */
    function isPointInPolygon(x, y, points) {
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            const xi = points[i].x, yi = points[i].y;
            const xj = points[j].x, yj = points[j].y;
            
            const intersect = ((yi > y) !== (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }
    
    /**
     * Update current room based on player position
     */
    function updateCurrentRoom() {
        let newRoom = null;
        
        // Check all rooms to see which one contains the player
        for (const room of RoomSystem.roomList) {
            if (isInRoom(room)) {
                newRoom = room;
                break;
            }
        }
        
        // Check corridors if not in a room
        if (!newRoom) {
            const connections = RoomSystem.getRoomConnections();
            for (const conn of connections) {
                // Simple check for corridors - distance to line segment
                const d = distanceToLineSegment(
                    man.x, man.y,
                    conn.pointA.x, conn.pointA.y,
                    conn.pointB.x, conn.pointB.y
                );
                
                if (d < conn.width/2) {
                    // In corridor between rooms
                    newRoom = { 
                        name: "Corridor", 
                        type: "CORRIDOR",
                        description: `Corridor between ${conn.roomA.name} and ${conn.roomB.name}`,
                        color: "#334455"
                    };
                    break;
                }
            }
        }
        
        // If room changed, update and notify
        if (newRoom && (!currentRoom || newRoom.name !== currentRoom.name)) {
            currentRoom = newRoom;
            if (newRoom.description) {
                messageLog.add(`Entered ${newRoom.name}: ${newRoom.description}`);
            } else {
                messageLog.add(`Entered ${newRoom.name}`);
            }
            
            // Mark room as visited
            if (newRoom.visited === false) {
                newRoom.visited = true;
            }
        }
    }
    
    /**
     * Calculate distance from point to line segment
     */
    function distanceToLineSegment(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;
        
        if (len_sq !== 0) param = dot / len_sq;
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = px - xx;
        const dy = py - yy;
        
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Check for nearby interactive elements
     */
    function checkInteractions() {
        if (InputSystem.isSpacePressed()) {
            // Check for interactable objects near player
            let foundInteraction = false;
            
            // Check for station systems (terminals, etc)
            for (const room of RoomSystem.roomList) {
                if (!isInRoom(room)) continue;
                
                switch (room.type) {
                    case "COMMAND":
                        messageLog.add("Accessed command terminal. Station status nominal.");
                        man.energy = Math.min(100, man.energy + 10);
                        foundInteraction = true;
                        break;
                        
                    case "ENGINE":
                        messageLog.add("Examined engine core. Power output at 87%.");
                        foundInteraction = true;
                        break;
                        
                    case "LIVING":
                        messageLog.add("Found food supplies. Health restored.");
                        man.health = Math.min(100, man.health + 15);
                        foundInteraction = true;
                        break;
                        
                    case "STORAGE":
                        messageLog.add("Searched storage containers. Found energy cell.");
                        man.energy = Math.min(100, man.energy + 20);
                        foundInteraction = true;
                        break;
                        
                    case "DOCK":
                        if (checkManReturnsToShip()) {
                            messageLog.add("Returning to ship.");
                            undock();
                            GameState.setState('PLAYING');
                        } else {
                            messageLog.add("Approach your ship to undock.");
                        }
                        foundInteraction = true;
                        break;
                }
                
                if (foundInteraction) break;
            }
            
            // If no room-specific interaction, check for rats
            if (!foundInteraction) {
                // Check for nearby rats
                for (let i = 0; i < RoomSystem.ratList.length; i++) {
                    const rat = RoomSystem.ratList[i];
                    const dx = rat.x - man.x;
                    const dy = rat.y - man.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < INTERACTION_RANGE) {
                        messageLog.add("Rat: 'Oy! Watch where yer steppin!'");
                        foundInteraction = true;
                        break;
                    }
                }
            }
            
            // Generic message if nothing to interact with
            if (!foundInteraction) {
                messageLog.add("Nothing interesting nearby.");
            }
        }
    }
    
    /**
     * Move the man with improved movement controls
     * @param {string} direction - Direction to move: "left", "right", "up", "down"
     * @param {number} timeStep - Time step for frame-rate independent movement
     */
    function moveMan(direction, timeStep) {
        // Calculate movement distance based on timeStep
        const moveDistance = MOVEMENT_SPEED * timeStep * 60; // Scale to 60fps
        
        // Set facing direction
        man.facing = direction;
        
        // Calculate new position
        let newX = man.x;
        let newY = man.y;
        
        switch (direction) {
            case "left":
                newX -= moveDistance;
                break;
            case "right":
                newX += moveDistance;
                break;
            case "up":
                newY -= moveDistance;
                break;
            case "down":
                newY += moveDistance;
                break;
        }
        
        // Check if new position is valid (in a room or corridor)
        if (RoomSystem.inRoom(newX, newY)) {
            // Move world instead of character, to keep character centered
            const dx = man.x - newX;
            const dy = man.y - newY;
            
            // Move all elements
            ShipSystem.hero.tipX += dx;
            ShipSystem.hero.leftX += dx;
            ShipSystem.hero.rightX += dx;
            ShipSystem.hero.tipY += dy;
            ShipSystem.hero.leftY += dy;
            ShipSystem.hero.rightY += dy;
            
            // Move rooms
            for (let i = 0; i < RoomSystem.roomList.length; i++) {
                RoomSystem.roomList[i].x += dx;
                RoomSystem.roomList[i].y += dy;
                
                // If room has points for shape
                if (RoomSystem.roomList[i].points) {
                    for (let j = 0; j < RoomSystem.roomList[i].points.length; j++) {
                        RoomSystem.roomList[i].points[j].x += dx;
                        RoomSystem.roomList[i].points[j].y += dy;
                    }
                }
                
                // If room has docking position
                if (RoomSystem.roomList[i].dockingPosition) {
                    RoomSystem.roomList[i].dockingPosition.x += dx;
                    RoomSystem.roomList[i].dockingPosition.y += dy;
                }
            }
            
            // Move room connections
            const connections = RoomSystem.getRoomConnections();
            for (const conn of connections) {
                conn.pointA.x += dx;
                conn.pointA.y += dy;
                conn.pointB.x += dx;
                conn.pointB.y += dy;
            }
            
            // Move rats
            for (let i = 0; i < RoomSystem.ratList.length; i++) {
                RoomSystem.ratList[i].x += dx;
                RoomSystem.ratList[i].y += dy;
            }
            
            // Move stars
            for (let i = 0; i < StarSystem.getStars().xList.length; i++) {
                StarSystem.getStars().xList[i] += dx;
                StarSystem.getStars().yList[i] += dy;
            }
            
            // Update current room
            updateCurrentRoom();
            
            // Reveal nearby rooms
            revealNearbyRooms();
        }
    }
    
    /**
     * Reveal rooms that are near the player
     */
    function revealNearbyRooms() {
        for (const room of RoomSystem.roomList) {
            // Calculate distance from player to room center
            const centerX = room.x + room.width / 2;
            const centerY = room.y + room.height / 2;
            
            const dx = centerX - man.x;
            const dy = centerY - man.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Reveal rooms within FOV radius
            if (distance < FOV_RADIUS) {
                room.revealed = true;
            }
        }
    }
    
    /**
     * Handle man movement based on input with improved controls
     * @param {number} timeStep - Time step for frame-rate independent movement
     */
    function handleManMovement(timeStep = 1/60) {
        // Handle basic movement
        if (InputSystem.isRightPressed() || InputSystem.isRightTouchActive()) {
            moveMan("right", timeStep);
        }
        if (InputSystem.isLeftPressed() || InputSystem.isLeftTouchActive()) {
            moveMan("left", timeStep);
        }
        if (InputSystem.isUpPressed() || InputSystem.isUpTouchActive()) {
            moveMan("up", timeStep);
        }
        if (InputSystem.isDownPressed() || InputSystem.isDownTouchActive()) {
            moveMan("down", timeStep);
        }
        
        // Check for interactions
        checkInteractions();
        
        // Update energy (slowly depletes over time)
        man.energy = Math.max(0, man.energy - 0.01);
    }
    
    /**
     * Check if man is returning to the ship
     * @returns {boolean} - Whether the man should return to the ship
     */
    function checkManReturnsToShip() {
        return (
            Math.abs(man.x - ShipSystem.hero.tipX) < 20 &&
            Math.abs(man.y - ShipSystem.hero.tipY) < 20
        );
    }
    
    // Public API
    return {
        isDocking: function() { return docking; },
        dock: dock,
        undock: undock,
        reviveHero: reviveHero,
        drawMan: drawMan,
        centerViewOnMan: centerViewOnMan,
        handleManMovement: handleManMovement,
        checkManReturnsToShip: checkManReturnsToShip,
        getManX: function() { return man.x; },
        getManY: function() { return man.y; },
        getMan: function() { return man; },
        getCurrentRoom: function() { return currentRoom; }
    };
})();