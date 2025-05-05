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
    let roomConnections = [];
    
    // Docking symbol
    const dock = "\u27D0\uFE0E"; 
    
    // Room types with their properties
    const ROOM_TYPES = {
        DOCK: { 
            color: "#223344", 
            features: ["dockingStation"],
            name: "Docking Bay",
            description: "A secure area for spacecraft to dock with the station."
        },
        LIVING: { 
            color: "#336633", 
            features: ["furniture", "rats"],
            name: "Living Quarters",
            description: "Residential area with basic amenities."
        },
        STORAGE: { 
            color: "#553311", 
            features: ["crates", "loot"],
            name: "Storage Bay",
            description: "A room filled with cargo containers and supplies."
        },
        ENGINE: { 
            color: "#664411", 
            features: ["energy", "hazards"],
            name: "Engine Room",
            description: "Critical station infrastructure. Potential hazards present."
        },
        COMMAND: { 
            color: "#334466", 
            features: ["terminals", "controls"],
            name: "Command Center",
            description: "Station command and control systems."
        }
    };
    
    // Room object pool for efficient object reuse
    const roomPool = {
        pool: [],
        maxSize: 30,
        
        init: function() {
            for (let i = 0; i < this.maxSize; i++) {
                this.pool.push(new Room(0, 0, 100, 100));
            }
        },
        
        get: function(x, y, width, height, type, points) {
            if (this.pool.length > 0) {
                const room = this.pool.pop();
                
                // Reset room properties
                room.id = generateUniqueId();
                room.x = x;
                room.y = y;
                room.width = width;
                room.height = height;
                room.type = type;
                room.color = ROOM_TYPES[type].color;
                room.features = [...ROOM_TYPES[type].features];
                room.name = ROOM_TYPES[type].name;
                room.description = ROOM_TYPES[type].description;
                room.visited = false;
                room.revealed = false;
                room.points = points;
                
                // Reset docking position for docking rooms
                if (type === "DOCK") {
                    room.dockingPosition = {
                        x: room.x + room.width/2,
                        y: room.y + room.height/2
                    };
                } else {
                    room.dockingPosition = null;
                }
                
                return room;
            }
            
            return new Room(x, y, width, height, type, points);
        },
        
        recycle: function(room) {
            if (this.pool.length < this.maxSize) {
                this.pool.push(room);
            }
        }
    };
    
    // Creature (rat) object pool
    const creaturePool = {
        pool: [],
        maxSize: 50,
        
        init: function() {
            for (let i = 0; i < this.maxSize; i++) {
                this.pool.push(new Creature(0, 0, 12));
            }
        },
        
        get: function(x, y, size) {
            if (this.pool.length > 0) {
                const creature = this.pool.pop();
                creature.x = x;
                creature.y = y;
                creature.size = size;
                return creature;
            }
            
            return new Creature(x, y, size);
        },
        
        recycle: function(creature) {
            if (this.pool.length < this.maxSize) {
                this.pool.push(creature);
            }
        }
    };
    
    /**
     * Room constructor with enhanced properties
     * @param {number} x - Room x position
     * @param {number} y - Room y position
     * @param {number} width - Room width
     * @param {number} height - Room height
     * @param {string} type - Room type from ROOM_TYPES
     * @param {array} points - Array of points defining the room shape
     */
    function Room(x, y, width, height, type = "STORAGE", points = null) {
        this.id = generateUniqueId();
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
        this.type = type;
        this.color = ROOM_TYPES[type].color;
        this.features = [...ROOM_TYPES[type].features];
        this.name = ROOM_TYPES[type].name;
        this.description = ROOM_TYPES[type].description;
        this.visited = false;
        this.revealed = false;
        this.points = points; // For non-rectangular rooms
        
        // For docking stations
        if (type === "DOCK") {
            this.dockingPosition = {
                x: this.x + this.width/2,
                y: this.y + this.height/2
            };
        }
    }
    
    /**
     * Generate a unique ID for rooms
     */
    function generateUniqueId() {
        return 'room_' + Math.random().toString(36).substr(2, 9);
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
     * Generate procedural rooms with enhanced variety
     */
    function generateRooms() {
        const canvas = GameState.getCanvas();
        
        // Clear previous data
        roomList = [];
        ratList = [];
        roomConnections = [];
        
        // Generate a random number of rooms
        const numFloor = Math.floor(Math.random() * 8 + 5);
        
        // Always include at least one docking bay
        const dockingBay = generateRoomWithType(null, "DOCK", canvas);
        roomList.push(dockingBay);
        
        // Generate the remaining rooms
        for (let i = 1; i < numFloor; i++) {
            // Select a room type - avoid too many docking bays
            const typeKeys = Object.keys(ROOM_TYPES).filter(t => t !== "DOCK" || Math.random() < 0.1);
            const roomType = typeKeys[Math.floor(Math.random() * typeKeys.length)];
            
            // Generate a room with this type
            const room = generateRoomWithType(roomList[i-1], roomType, canvas);
            roomList.push(room);
            
            // Create a connection between this room and a previous room
            connectRooms(roomList[i-1], room);
            
            // Add some random connections between rooms for a more interesting layout
            if (i > 1 && Math.random() < 0.3) {
                // Pick a random previous room that's not the immediately preceding one
                const randomPrevIndex = Math.floor(Math.random() * (i-1));
                connectRooms(roomList[randomPrevIndex], room);
            }
        }
        
        // Add creatures to rooms
        addCreaturesToRooms();
    }
    
    /**
     * Generate a room with specific type and features
     */
    function generateRoomWithType(prevRoom, type, canvas) {
        let randX, randY, randWidth, randHeight;
        
        if (prevRoom) {
            // Position relative to previous room with some variability
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 200 + 100;
            
            randX = prevRoom.x + Math.cos(angle) * distance;
            randY = prevRoom.y + Math.sin(angle) * distance;
            randWidth = Math.floor(Math.random() * canvas.width / 3 + 150);
            randHeight = Math.floor(Math.random() * canvas.height / 3 + 150);
        } else {
            // Initial room position
            randX = Math.floor(Math.random() * canvas.width / 2) - canvas.width / 2;
            randY = Math.floor(Math.random() * -canvas.height * 2) - canvas.height;
            randWidth = Math.floor(Math.random() * canvas.width / 3 + 200);
            randHeight = Math.floor(Math.random() * canvas.height / 3 + 200);
        }
        
        // Generate room shape
        let points = null;
        if (Math.random() < 0.7) {
            // Basic rectangular room
            return roomPool.get(randX, randY, randWidth, randHeight, type);
        } else {
            // Room with a more complex shape using points
            points = generateRoomShape(randX, randY, randWidth, randHeight, type);
            return roomPool.get(randX, randY, randWidth, randHeight, type, points);
        }
    }
    
    /**
     * Generate a more complex room shape using points
     */
    function generateRoomShape(x, y, width, height, type) {
        const points = [];
        const complexity = Math.floor(Math.random() * 3) + 5; // 5-7 points
        
        // Different shape patterns based on room type
        switch(type) {
            case "ENGINE":
                // Circular-like for engine rooms
                for (let i = 0; i < complexity; i++) {
                    const angle = (i / complexity) * Math.PI * 2;
                    const radius = width/2 * (0.8 + Math.random() * 0.4);
                    points.push({
                        x: x + width/2 + Math.cos(angle) * radius,
                        y: y + height/2 + Math.sin(angle) * radius
                    });
                }
                break;
                
            case "COMMAND":
                // Polygonal command center
                for (let i = 0; i < complexity; i++) {
                    const angle = (i / complexity) * Math.PI * 2;
                    const radius = (0.8 + Math.random() * 0.4) * (i % 2 === 0 ? width/2 : width/2.5);
                    points.push({
                        x: x + width/2 + Math.cos(angle) * radius,
                        y: y + height/2 + Math.sin(angle) * radius
                    });
                }
                break;
                
            default:
                // Irregularly shaped room
                points.push({x: x, y: y});
                points.push({x: x + width, y: y});
                points.push({x: x + width + (Math.random() * 50 - 25), y: y + height/2});
                points.push({x: x + width, y: y + height});
                points.push({x: x, y: y + height});
                points.push({x: x - (Math.random() * 50), y: y + height/2});
        }
        
        return points;
    }
    
    /**
     * Connect two rooms with a corridor
     */
    function connectRooms(roomA, roomB) {
        // Check if connection already exists
        for (const conn of roomConnections) {
            if ((conn.roomA.id === roomA.id && conn.roomB.id === roomB.id) ||
                (conn.roomA.id === roomB.id && conn.roomB.id === roomA.id)) {
                return; // Connection already exists
            }
        }
        
        // Find good connection points between rooms
        const centerA = {
            x: roomA.x + roomA.width/2,
            y: roomA.y + roomA.height/2
        };
        
        const centerB = {
            x: roomB.x + roomB.width/2,
            y: roomB.y + roomB.height/2
        };
        
        // Create connection
        roomConnections.push({
            roomA: roomA,
            roomB: roomB,
            pointA: centerA,
            pointB: centerB,
            width: 20 + Math.random() * 10
        });
    }
    
    /**
     * Add creatures to rooms based on room type
     */
    function addCreaturesToRooms() {
        for (let i = 0; i < roomList.length; i++) {
            const room = roomList[i];
            
            // Add creatures based on room type
            switch (room.type) {
                case "LIVING":
                    // More rats in living areas
                    const ratCount = Math.floor(Math.random() * 3) + 2;
                    for (let j = 0; j < ratCount; j++) {
                        addRatToRoom(room);
                    }
                    break;
                    
                case "STORAGE":
                    // Some rats in storage
                    const storageRats = Math.floor(Math.random() * 2) + 1;
                    for (let j = 0; j < storageRats; j++) {
                        addRatToRoom(room);
                    }
                    break;
                    
                default:
                    // Other rooms have a chance for a rat
                    if (Math.random() < 0.4) {
                        addRatToRoom(room);
                    }
            }
        }
    }
    
    /**
     * Add a rat to a specific room
     */
    function addRatToRoom(room) {
        const ratX = room.x + Math.random() * room.width;
        const ratY = room.y + Math.random() * room.height;
        ratList.push(creaturePool.get(ratX, ratY, 12));
    }
    
    /**
     * Draw all rooms with their unique shapes and styles
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    function drawRooms(ctx) {
        // First draw connections between rooms
        drawRoomConnections(ctx);
        
        // Then draw the rooms themselves
        for (let i = 0; i < roomList.length; i++) {
            const room = roomList[i];
            
            ctx.fillStyle = room.color || "#222";
            
            if (room.points) {
                // Draw complex shape rooms
                ctx.beginPath();
                ctx.moveTo(room.points[0].x, room.points[0].y);
                for (let j = 1; j < room.points.length; j++) {
                    ctx.lineTo(room.points[j].x, room.points[j].y);
                }
                ctx.closePath();
                ctx.fill();
                
                // Draw outline
                ctx.strokeStyle = "#444";
                ctx.lineWidth = 2;
                ctx.stroke();
            } else {
                // Draw rectangular rooms
                ctx.beginPath();
                ctx.rect(room.x, room.y, room.width, room.height);
                ctx.fill();
                
                // Draw outline
                ctx.strokeStyle = "#444";
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            
            // Draw room features based on type
            drawRoomFeatures(ctx, room);
        }
    }
    
    /**
     * Draw connections between rooms
     */
    function drawRoomConnections(ctx) {
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 15;
        
        for (const conn of roomConnections) {
            ctx.beginPath();
            
            // Create a smooth curved path between rooms
            const midX = (conn.pointA.x + conn.pointB.x) / 2;
            const midY = (conn.pointA.y + conn.pointB.y) / 2;
            
            // Add some random bend to make it look more natural
            const bendX = midX + (Math.random() * 50 - 25);
            const bendY = midY + (Math.random() * 50 - 25);
            
            ctx.moveTo(conn.pointA.x, conn.pointA.y);
            ctx.quadraticCurveTo(bendX, bendY, conn.pointB.x, conn.pointB.y);
            
            ctx.stroke();
        }
    }
    
    /**
     * Draw specific features for each room type
     */
    function drawRoomFeatures(ctx, room) {
        // Draw room name
        ctx.font = "12px Consolas";
        ctx.fillStyle = "#FFF";
        ctx.textAlign = "center";
        ctx.fillText(room.name, room.x + room.width/2, room.y + 16);
        
        // Draw features based on room type
        if (room.features.includes("furniture")) {
            drawFurniture(ctx, room);
        }
        
        if (room.features.includes("crates")) {
            drawCrates(ctx, room);
        }
        
        if (room.features.includes("terminals")) {
            drawTerminals(ctx, room);
        }
        
        if (room.features.includes("energy")) {
            drawEnergyField(ctx, room);
        }
    }
    
    /**
     * Draw furniture in living quarters
     */
    function drawFurniture(ctx, room) {
        const centerX = room.x + room.width/2;
        const centerY = room.y + room.height/2;
        
        // Draw a simple table
        ctx.fillStyle = "#554433";
        ctx.fillRect(centerX - 20, centerY - 20, 40, 40);
    }
    
    /**
     * Draw crates in storage rooms
     */
    function drawCrates(ctx, room) {
        ctx.fillStyle = "#665544";
        
        // Draw several crates
        for (let i = 0; i < 4; i++) {
            const x = room.x + Math.random() * room.width * 0.8 + room.width * 0.1;
            const y = room.y + Math.random() * room.height * 0.8 + room.height * 0.1;
            const size = 15 + Math.random() * 10;
            
            ctx.fillRect(x, y, size, size);
        }
    }
    
    /**
     * Draw terminals in command rooms
     */
    function drawTerminals(ctx, room) {
        ctx.fillStyle = "#445566";
        
        // Draw terminal strip along a wall
        ctx.fillRect(room.x + 10, room.y + room.height - 30, room.width - 20, 15);
        
        // Draw small screens
        ctx.fillStyle = "#88CCFF";
        for (let i = 0; i < 3; i++) {
            const x = room.x + 20 + i * (room.width - 40) / 3;
            ctx.fillRect(x, room.y + room.height - 28, 20, 10);
        }
    }
    
    /**
     * Draw energy field in engine rooms
     */
    function drawEnergyField(ctx, room) {
        const centerX = room.x + room.width/2;
        const centerY = room.y + room.height/2;
        
        // Draw energy core
        const gradient = ctx.createRadialGradient(
            centerX, centerY, 5,
            centerX, centerY, 30
        );
        gradient.addColorStop(0, "rgba(255, 200, 50, 0.8)");
        gradient.addColorStop(1, "rgba(255, 100, 50, 0)");
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
        ctx.fill();
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
     * Draw docking stations in docking bay rooms
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    function drawDock(ctx) {
        ctx.font = "48px Consolas";
        
        for (let i = 0; i < roomList.length; i++) {
            if (roomList[i].type === "DOCK") {
                // Calculate pulse effect based on frame count
                const pulseSize = 1 + Math.sin(GameState.getFrameCount() / 20) * 0.2;
                
                // Draw docking indicator with pulse
                ctx.save();
                ctx.translate(
                    roomList[i].dockingPosition.x, 
                    roomList[i].dockingPosition.y
                );
                ctx.scale(pulseSize, pulseSize);
                
                // Outer circle
                ctx.beginPath();
                ctx.arc(0, 0, 20, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(40, 100, 200, 0.3)";
                ctx.fill();
                
                // Inner symbol
                ctx.fillStyle = ColorUtils.randRGB();
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(dock, 0, 0);
                
                ctx.restore();
            }
        }
    }
    
    /**
     * Check if hero should dock with a station
     */
    function checkDocking() {
        for (let i = 0; i < roomList.length; i++) {
            if (roomList[i].type === "DOCK") {
                if (CollisionSystem.isColliding(
                    ShipSystem.hero.tipX - 5, ShipSystem.hero.tipY - 5, 10, 10,
                    roomList[i].dockingPosition.x - 15, roomList[i].dockingPosition.y - 15,
                    30, 30
                )) {
                    GameState.getContext().fillText("Docking...", ShipSystem.hero.tipX, ShipSystem.hero.tipY);
                    
                    // Mark room as visited
                    roomList[i].visited = true;
                    roomList[i].revealed = true;
                    
                    // Mark connected rooms as revealed
                    for (const conn of roomConnections) {
                        if (conn.roomA.id === roomList[i].id) {
                            conn.roomB.revealed = true;
                        } else if (conn.roomB.id === roomList[i].id) {
                            conn.roomA.revealed = true;
                        }
                    }
                    
                    // Initiate docking
                    DockingSystem.dock(ShipSystem.hero.tipX, ShipSystem.hero.tipY);
                    break;
                }
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
                GameState.getContext().fillText(
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
        // Recycle all current rooms and rats
        for (let i = 0; i < roomList.length; i++) {
            roomPool.recycle(roomList[i]);
        }
        
        for (let i = 0; i < ratList.length; i++) {
            creaturePool.recycle(ratList[i]);
        }
        
        // Clear lists
        roomList = [];
        ratList = [];
        roomConnections = [];
        
        // Generate new rooms
        generateRooms();
    }
    
    /**
     * Clear all rooms and rats
     */
    function clearRooms() {
        // Recycle all current rooms
        for (let i = 0; i < roomList.length; i++) {
            roomPool.recycle(roomList[i]);
        }
        
        // Recycle all current rats
        for (let i = 0; i < ratList.length; i++) {
            creaturePool.recycle(ratList[i]);
        }
        
        // Clear lists
        roomList = [];
        ratList = [];
        roomConnections = [];
    }
    
    /**
     * Draw room connection with enhanced visuals
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {Object} connection - The room connection to draw
     */
    function drawRoomConnection(ctx, connection) {
        const startX = connection.startPoint.x;
        const startY = connection.startPoint.y;
        const endX = connection.endPoint.x;
        const endY = connection.endPoint.y;
        const width = connection.width || 20;
        
        // Calculate direction vector
        const dx = endX - startX;
        const dy = endY - startY;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) return;
        
        const nx = dx / length;
        const ny = dy / length;
        
        // Calculate perpendicular vector
        const px = -ny;
        const py = nx;
        
        // Define corridor points
        const p1 = { x: startX + px * width/2, y: startY + py * width/2 };
        const p2 = { x: startX - px * width/2, y: startY - py * width/2 };
        const p3 = { x: endX - px * width/2, y: endY - py * width/2 };
        const p4 = { x: endX + px * width/2, y: endY + py * width/2 };
        
        // Draw corridor
        ctx.fillStyle = "#334455";
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.closePath();
        ctx.fill();
        
        // Draw corridor edges
        ctx.strokeStyle = "#667788";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.stroke();
        
        // Draw corridor lights
        const numLights = Math.floor(length / 40);
        ctx.fillStyle = "#AAFFFF";
        for (let i = 0; i <= numLights; i++) {
            const t = i / numLights;
            const lightX = startX + dx * t;
            const lightY = startY + dy * t;
            
            ctx.beginPath();
            ctx.arc(lightX, lightY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    /**
     * Draw a room on the canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {Object} room - The room to draw
     */
    function drawRoom(ctx, room) {
        if (!room.revealed) return;
        
        // Draw outer room shape
        ctx.fillStyle = room.visited ? room.color : "#444444";
        ctx.beginPath();
        ctx.moveTo(room.shape[0].x, room.shape[0].y);
        for (let i = 1; i < room.shape.length; i++) {
            ctx.lineTo(room.shape[i].x, room.shape[i].y);
        }
        ctx.closePath();
        ctx.fill();
        
        // Draw room border
        ctx.strokeStyle = room.visited ? "#99AAFF" : "#666666";
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw inner shape for visual interest
        if (room.visited && room.innerShape && room.innerShape.length > 0) {
            ctx.fillStyle = room.innerColor;
            ctx.beginPath();
            ctx.moveTo(room.innerShape[0].x, room.innerShape[0].y);
            for (let i = 1; i < room.innerShape.length; i++) {
                ctx.lineTo(room.innerShape[i].x, room.innerShape[i].y);
            }
            ctx.closePath();
            ctx.fill();
        }
        
        // Draw room elements if visited
        if (room.visited && room.interactiveElements) {
            for (const element of room.interactiveElements) {
                drawInteractiveElement(ctx, element);
            }
        }
        
        // Draw room symbol and name
        if (room.visited) {
            const centerX = room.x + room.width / 2;
            const centerY = room.y + room.height / 2;
            
            // Draw room symbol
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "16px Consolas";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(room.symbol, centerX, centerY - 15);
            
            // Draw room name
            ctx.font = "12px Consolas";
            ctx.fillText(room.description, centerX, centerY + 15);
        }
        
        // Draw docking positions for dock rooms
        if (room.visited && room.type === "DOCK" && room.dockingPositions) {
            ctx.fillStyle = "#88CCFF";
            for (const pos of room.dockingPositions) {
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = "#FFFFFF";
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Draw docking symbol
                ctx.fillStyle = "#FFFFFF";
                ctx.font = "14px Consolas";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(dock, pos.x, pos.y);
            }
        }
    }
    
    /**
     * Draw an interactive element
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {Object} element - The element to draw
     */
    function drawInteractiveElement(ctx, element) {
        switch (element.type) {
            case "panel":
            case "console":
            case "station":
                ctx.fillStyle = element.color;
                ctx.fillRect(element.x - element.width/2, element.y - element.height/2, 
                             element.width, element.height);
                ctx.strokeStyle = "#FFFFFF";
                ctx.lineWidth = 1;
                ctx.strokeRect(element.x - element.width/2, element.y - element.height/2, 
                               element.width, element.height);
                break;
                
            case "crate":
                ctx.fillStyle = element.color;
                ctx.fillRect(element.x - element.width/2, element.y - element.height/2, 
                             element.width, element.height);
                ctx.strokeStyle = "#553311";
                ctx.lineWidth = 2;
                ctx.strokeRect(element.x - element.width/2, element.y - element.height/2, 
                               element.width, element.height);
                
                // Draw cross lines on crate
                ctx.beginPath();
                ctx.moveTo(element.x - element.width/2, element.y - element.height/2);
                ctx.lineTo(element.x + element.width/2, element.y + element.height/2);
                ctx.moveTo(element.x + element.width/2, element.y - element.height/2);
                ctx.lineTo(element.x - element.width/2, element.y + element.height/2);
                ctx.stroke();
                break;
                
            case "core":
                // Draw pulsating engine core
                const pulseSize = 1 + 0.2 * Math.sin(Date.now() * 0.001 * element.pulseRate);
                const gradient = ctx.createRadialGradient(
                    element.x, element.y, 0,
                    element.x, element.y, element.radius * pulseSize
                );
                gradient.addColorStop(0, "#FFDD99");
                gradient.addColorStop(0.7, element.color);
                gradient.addColorStop(1, "#773300");
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(element.x, element.y, element.radius * pulseSize, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case "bed":
                ctx.fillStyle = element.color;
                ctx.fillRect(element.x - element.width/2, element.y - element.height/2, 
                             element.width, element.height);
                
                // Draw pillow
                ctx.fillStyle = "#AABBCC";
                ctx.fillRect(element.x - element.width/2 + 5, element.y - element.height/2 + 5, 
                             element.width - 10, element.height/4);
                break;
                
            case "table":
                ctx.fillStyle = element.color;
                ctx.fillRect(element.x - element.width/2, element.y - element.height/2, 
                             element.width, element.height);
                
                // Draw some items on the table
                ctx.fillStyle = "#CCDDEE";
                ctx.beginPath();
                ctx.arc(element.x, element.y, 5, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = "#EECCDD";
                ctx.beginPath();
                ctx.arc(element.x + 10, element.y - 5, 3, 0, Math.PI * 2);
                ctx.fill();
                break;
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
            const room = roomList[i];
            
            if (room.points) {
                // Check if point is in a complex shape room
                if (isPointInPolygon(x, y, room.points)) {
                    return true;
                }
            } else {
                // Check if point is in a rectangular room
                if (CollisionSystem.isPointInside(
                    x, y,
                    room.x, room.y,
                    room.width, room.height
                )) {
                    return true;
                }
            }
            
            // Check if point is in a corridor connecting rooms
            for (const conn of roomConnections) {
                if (isPointInCorridor(x, y, conn)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    /**
     * Check if point is inside a polygon defined by points
     * @param {number} x - X coordinate to check
     * @param {number} y - Y coordinate to check
     * @param {Array} points - Array of points defining the polygon
     * @returns {boolean} - Whether the point is inside the polygon
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
     * Check if point is inside a corridor
     * @param {number} x - X coordinate to check
     * @param {number} y - Y coordinate to check
     * @param {Object} connection - Room connection defining the corridor
     * @returns {boolean} - Whether the point is inside the corridor
     */
    function isPointInCorridor(x, y, connection) {
        const startX = connection.pointA.x;
        const startY = connection.pointA.y;
        const endX = connection.pointB.x;
        const endY = connection.pointB.y;
        const width = connection.width || 20;
        
        // Calculate direction vector
        const dx = endX - startX;
        const dy = endY - startY;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) return false;
        
        // Calculate normalized direction vector
        const nx = dx / length;
        const ny = dy / length;
        
        // Calculate perpendicular vector
        const px = -ny;
        const py = nx;
        
        // Project point onto corridor direction
        const vx = x - startX;
        const vy = y - startY;
        
        // Calculate projection distances
        const projDir = vx * nx + vy * ny;  // Along corridor
        const projPerp = vx * px + vy * py; // Perpendicular to corridor
        
        // Check if point is within corridor bounds
        return (projDir >= 0 && projDir <= length && 
                Math.abs(projPerp) <= width / 2);
    }
    
    /**
     * Update room positions (move them downward)
     */
    function updateRooms() {
        const deltaTime = GameState.getDeltaTime();
        const timeScale = 60 * deltaTime; // Scale to 60 fps baseline
        const moveAmount = 0.5 * timeScale;
        
        // Move all rooms downward
        for (let i = 0; i < roomList.length; i++) {
            roomList[i].y += moveAmount;
            
            // If room has special points for non-rectangular shape
            if (roomList[i].points) {
                // Fix: Changed 'i < roomList[i].points.length' to 'j < roomList[i].points.length'
                for (let j = 0; j < roomList[i].points.length; j++) {
                    roomList[i].points[j].y += moveAmount;
                }
            }
        }
        
        // Update room connections
        for (const conn of roomConnections) {
            conn.pointA.y += moveAmount;
            conn.pointB.y += moveAmount;
        }
        
        // Check if all rooms are off screen and regenerate if needed
        const canvas = GameState.getCanvas();
        let allOffscreen = true;
        for (let i = 0; i < roomList.length; i++) {
            if (roomList[i].y < canvas.height + canvas.height) {
                allOffscreen = false;
                break;
            }
        }
        
        if (allOffscreen && roomList.length > 0) {
            regenerateRooms();
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
            
            // If room has docking position, update it
            if (roomList[i].dockingPosition) {
                roomList[i].dockingPosition.x += dx;
            }
            
            // If room has special points for non-rectangular shape
            if (roomList[i].points) {
                for (let j = 0; j < roomList[i].points.length; j++) {
                    roomList[i].points[j].x += dx;
                }
            }
        }
        
        // Update room connections
        for (const conn of roomConnections) {
            conn.pointA.x += dx;
            conn.pointB.x += dx;
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
     * Initialize the room system
     */
    function init() {
        const canvas = GameState.getCanvas();
        roomList = [];
        ratList = [];
        roomConnections = [];
        
        // Initialize object pools
        roomPool.init();
        creaturePool.init();
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
        clearRooms: clearRooms,
        getRoomConnections: function() { return roomConnections; },
        init: init
    };
})();