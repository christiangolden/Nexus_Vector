/**
 * Nexus Vector - Space Station System
 * 
 * This module handles the generation and management of space stations and their interior.
 */

const StationSystem = (function() {
    'use strict';
    
    // Space station list
    let stationList = [];
    
    // ASCII map for station interiors (only generated when docked)
    let asciiMap = [];
    const MAP_WIDTH = 60;
    const MAP_HEIGHT = 30;
    
    // Player position in ASCII map
    let playerX = 0;
    let playerY = 0;
    
    // Player is currently inside a station
    let isInside = false;
    
    // Station shapes
    const STATION_SHAPES = [
        "HEXAGON",
        "OCTAGON", 
        "DIAMOND",
        "PENTAGON",
        "STAR"
    ];
    
    // Station colors
    const STATION_COLORS = [
        "#334455", 
        "#445566",
        "#556677",
        "#223344",
        "#112233"
    ];
    
    // NPC types and their symbols
    const NPC_TYPES = {
        MECHANIC: 'M',      // Mechanics in engine rooms
        CAPTAIN: 'C',       // Captains in bridge
        TRADER: 'T',        // Traders in storage areas
        GUARD: 'G',         // Guards near entrances and corridors
        SCIENTIST: 'Z',     // Scientists in various areas
        CIVILIAN: 'V'       // Civilians throughout the station
    };
    
    // Docking symbol
    const DOCK_SYMBOL = "\u27D0\uFE0E"; 
    
    /**
     * Space Station constructor
     * @param {number} x - Station center X position
     * @param {number} y - Station center Y position
     * @param {number} size - Station size
     * @param {string} shape - Station shape
     */
    function SpaceStation(x, y, size, shape = "HEXAGON") {
        this.id = 'station_' + Math.random().toString(36).substr(2, 9);
        this.x = x;
        this.y = y;
        this.size = size;
        this.shape = shape;
        this.color = STATION_COLORS[Math.floor(Math.random() * STATION_COLORS.length)];
        this.points = [];
        this.dockingPoint = {
            x: 0,
            y: 0,
            angle: 0
        };
        this.visited = false;
        this.rotationSpeed = 0.003 * (Math.random() * 0.5 + 0.5) * (Math.random() < 0.5 ? 1 : -1); // Slower rotation
        this.rotation = 0;
        this.interiorGenerated = false;
        this.specialRooms = {
            bridge: { x: 0, y: 0 },
            engine: { x: 0, y: 0 },
            storage: { x: 0, y: 0 },
            dock: { x: 0, y: 0 }
        };
        
        // NPC data structure
        this.npcs = [];
        
        // Generate the station's points based on shape
        this.generatePoints();
        
        // Place docking point at a logical position
        this.placeDockingPoint();
    }
    
    /**
     * Generate the station's points based on shape
     */
    SpaceStation.prototype.generatePoints = function() {
        this.points = [];
        
        const numPoints = (() => {
            switch(this.shape) {
                case "HEXAGON": return 6;
                case "OCTAGON": return 8;
                case "DIAMOND": return 4;
                case "PENTAGON": return 5;
                case "STAR": return 10;
                default: return 6;
            }
        })();
        
        // For stars, we need to alternate between outer and inner radius
        const isStarShape = this.shape === "STAR";
        
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            // For stars, use a smaller radius for every second point
            const radius = isStarShape && i % 2 === 1 ? this.size * 0.5 : this.size;
            
            this.points.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
            });
        }
    };
    
    /**
     * Place docking point at a logical position on the station
     */
    SpaceStation.prototype.placeDockingPoint = function() {
        // Find a suitable edge for docking
        let bestEdgeIndex = 0;
        let maxY = -Infinity;
        
        // Look for the bottom-most edge for docking
        for (let i = 0; i < this.points.length; i++) {
            const nextIndex = (i + 1) % this.points.length;
            const midY = (this.points[i].y + this.points[nextIndex].y) / 2;
            
            if (midY > maxY) {
                maxY = midY;
                bestEdgeIndex = i;
            }
        }
        
        // Place dock in the middle of the chosen edge
        const nextIndex = (bestEdgeIndex + 1) % this.points.length;
        this.dockingPoint = {
            x: (this.points[bestEdgeIndex].x + this.points[nextIndex].x) / 2,
            y: (this.points[bestEdgeIndex].y + this.points[nextIndex].y) / 2,
            angle: Math.atan2(
                this.points[nextIndex].y - this.points[bestEdgeIndex].y,
                this.points[nextIndex].x - this.points[bestEdgeIndex].x
            ) + Math.PI/2 // Perpendicular to edge
        };
    };
    
    /**
     * Draw the space station
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    SpaceStation.prototype.draw = function(ctx) {
        ctx.save();
        
        // Translate to station center
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Draw station body
        ctx.fillStyle = this.color;
        ctx.strokeStyle = "#aabbcc";
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.closePath();
        
        ctx.fill();
        ctx.stroke();
        
        // Draw details
        this.drawStationDetails(ctx);
        
        // Draw docking area - always facing "down" regardless of rotation
        ctx.save();
        // Rotate to the docking point's angle
        ctx.translate(this.dockingPoint.x, this.dockingPoint.y);
        
        // Draw a docking bay indicator
        const dockSize = this.size / 10;
        
        // Draw outer glow for docking area
        const gradient = ctx.createRadialGradient(0, 0, dockSize*0.5, 0, 0, dockSize*2);
        gradient.addColorStop(0, "rgba(0, 150, 255, 0.8)");
        gradient.addColorStop(1, "rgba(0, 100, 255, 0)");
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, dockSize*2, 0, Math.PI*2);
        ctx.fill();
        
        // Add animation effect
        const pulseSize = 1 + Math.sin(GameState.getFrameCount() / 20) * 0.2;
        
        // Draw docking port
        ctx.fillStyle = "#1166aa";
        ctx.strokeStyle = "#88ccff";
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(0, 0, dockSize * pulseSize, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
        
        // Draw docking symbol
        ctx.fillStyle = "#ffffff";
        ctx.font = `${Math.floor(dockSize*1.5)}px Consolas`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(DOCK_SYMBOL, 0, 0);
        
        ctx.restore();
        
        // Draw station name
        ctx.fillStyle = "#ffffff";
        ctx.font = "14px Consolas";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("STATION " + this.id.substring(8).toUpperCase(), 0, -this.size - 20);
        
        ctx.restore();
    };
    
    /**
     * Draw station details
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    SpaceStation.prototype.drawStationDetails = function(ctx) {
        ctx.strokeStyle = "#556677";
        ctx.lineWidth = 1;
        // Draw lines only between opposite polygon points
        const n = this.points.length;
        const isEven = n % 2 === 0;
        for (let i = 0; i < n / 2; i++) {
            const a = this.points[i];
            const b = this.points[(i + Math.floor(n / 2)) % n];
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            // For odd-sided polygons, draw the extra line
            if (!isEven && i === 0) {
                const c = this.points[Math.floor(n / 2)];
                ctx.beginPath();
                ctx.moveTo(this.points[0].x, this.points[0].y);
                ctx.lineTo(c.x, c.y);
                ctx.stroke();
            }
        }
    };
    
    /**
     * Update the space station (rotation, etc)
     * @param {number} deltaTime - Time since last update
     */
    SpaceStation.prototype.update = function(deltaTime) {
        this.rotation += this.rotationSpeed * deltaTime * 60; // Scale by deltaTime for consistent rotation
    };
    
    /**
     * Check if a point is inside the station
     * @param {number} x - X coordinate in world space
     * @param {number} y - Y coordinate in world space
     * @returns {boolean} - Whether the point is inside
     */
    SpaceStation.prototype.containsPoint = function(x, y) {
        // Transform point to station's local space
        const localX = x - this.x;
        const localY = y - this.y;
        
        // Rotate point by negative rotation to account for station rotation
        const rotatedX = localX * Math.cos(-this.rotation) - localY * Math.sin(-this.rotation);
        const rotatedY = localX * Math.sin(-this.rotation) + localY * Math.cos(-this.rotation);
        
        return isPointInPolygon(rotatedX, rotatedY, this.points);
    };
    
    /**
     * Check if ship is near the docking point
     * @param {number} shipX - Ship X position
     * @param {number} shipY - Ship Y position
     * @returns {boolean} - Whether ship is in docking range
     */
    SpaceStation.prototype.isInDockingRange = function(shipX, shipY) {
        // Transform to station's local space
        const localX = shipX - this.x;
        const localY = shipY - this.y;
        
        // Rotate point by negative rotation to account for station rotation
        const rotatedX = localX * Math.cos(-this.rotation) - localY * Math.sin(-this.rotation);
        const rotatedY = localX * Math.sin(-this.rotation) + localY * Math.cos(-this.rotation);
        
        // Check distance to docking point
        const dx = rotatedX - this.dockingPoint.x;
        const dy = rotatedY - this.dockingPoint.y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        return distance < this.size / 10;
    };
    
    /**
     * Generate ASCII map for station interior
     * This only happens when player docks
     */
    SpaceStation.prototype.generateInterior = function() {
        if (this.interiorGenerated) return;
        
        // Initialize empty map
        asciiMap = [];
        for (let y = 0; y < MAP_HEIGHT; y++) {
            asciiMap[y] = [];
            for (let x = 0; x < MAP_WIDTH; x++) {
                asciiMap[y][x] = ' ';
            }
        }
        
        // Draw outer walls
        for (let x = 0; x < MAP_WIDTH; x++) {
            asciiMap[0][x] = '#';
            asciiMap[MAP_HEIGHT-1][x] = '#';
        }
        
        for (let y = 0; y < MAP_HEIGHT; y++) {
            asciiMap[y][0] = '#';
            asciiMap[y][MAP_WIDTH-1] = '#';
        }
        
        // Generate rooms
        this.generateRooms();
        
        // Place special rooms at random locations
        this.placeSpecialRooms();
        
        // Instead, set player position to the actual 'D' tile
        for (let y = 0; y < asciiMap.length; y++) {
            for (let x = 0; x < asciiMap[y].length; x++) {
                if (asciiMap[y][x] === 'D') {
                    playerX = x;
                    playerY = y;
                    this.specialRooms.dock = { x, y };
                }
            }
        }
        
        // Generate NPCs for the station interior
        this.generateNPCs();
        
        // Attach asciiMap to this instance for test harness
        this.asciiMap = asciiMap;
        this.interiorGenerated = true;
    };
    
    /**
     * Generate random rooms for the station interior
     */
    SpaceStation.prototype.generateRooms = function() {
        // Retry limit to prevent infinite loops
        let maxAttempts = 10;
        let attempt = 0;
        let success = false;
        while (attempt < maxAttempts && !success) {
            attempt++;
            // ...existing code for rot.js Digger generation...
            const digger = new ROT.Map.Digger(MAP_WIDTH, MAP_HEIGHT, {
                roomWidth: [5, 12],
                roomHeight: [4, 8],
                corridorLength: [2, 8],
                dugPercentage: 0.25
            });
            for (let y = 0; y < MAP_HEIGHT; y++) {
                for (let x = 0; x < MAP_WIDTH; x++) {
                    asciiMap[y][x] = ' ';
                }
            }
            digger.create((x, y, value) => {
                asciiMap[y][x] = value === 0 ? '.' : '#';
            });
            const rooms = digger.getRooms();
            if (rooms.length < 4) continue; // Not enough rooms, try again
            // ...existing code for dock and special room placement...
            let dockRoom = rooms.reduce((a, b) => (a.getCenter()[1] > b.getCenter()[1] ? a : b));
            let [dockX, dockY] = dockRoom.getCenter();
            asciiMap[dockY][dockX] = 'D';
            playerX = dockX;
            playerY = dockY;
            let otherRooms = rooms.filter(r => r !== dockRoom);
            if (otherRooms.length >= 3) {
                let shuffled = otherRooms.slice().sort(() => Math.random() - 0.5);
                let [bx, by] = shuffled[0].getCenter();
                let [ex, ey] = shuffled[1].getCenter();
                let [sx, sy] = shuffled[2].getCenter();
                asciiMap[by][bx] = 'B';
                asciiMap[ey][ex] = 'E';
                asciiMap[sy][sx] = 'S';
                this.specialRooms.bridge = {x: bx, y: by};
                this.specialRooms.engine = {x: ex, y: ey};
                this.specialRooms.storage = {x: sx, y: sy};
            }
            // Place doors
            for (let y = 1; y < MAP_HEIGHT-1; y++) {
                for (let x = 1; x < MAP_WIDTH-1; x++) {
                    if (asciiMap[y][x] !== '#') continue;
                    let isRoom = false, isCorridor = false;
                    for (const [dx, dy] of [[0,1],[1,0],[0,-1],[-1,0]]) {
                        const nx = x + dx, ny = y + dy;
                        if ([ '.', 'B', 'E', 'S', 'D' ].includes(asciiMap[ny][nx])) isRoom = true;
                        if (asciiMap[ny][nx] === '.') isCorridor = true;
                    }
                    if (isRoom && isCorridor) asciiMap[y][x] = '+';
                }
            }
            // Ensure at least one adjacent tile to 'D' is walkable
            let walkable = false;
            for (const [dx, dy] of [[0,1],[1,0],[0,-1],[-1,0]]) {
                const nx = dockX + dx, ny = dockY + dy;
                if ([ '.', '+', 'B', 'E', 'S' ].includes(asciiMap[ny][nx])) walkable = true;
            }
            if (!walkable) {
                // Carve a door or floor to the right if possible, else left, else down, else up
                const directions = [[1,0],[-1,0],[0,1],[0,-1]];
                for (const [dx, dy] of directions) {
                    const nx = dockX + dx, ny = dockY + dy;
                    if (asciiMap[ny][nx] === '#') {
                        asciiMap[ny][nx] = '+';
                        break;
                    } else if (asciiMap[ny][nx] === ' ') {
                        asciiMap[ny][nx] = '.';
                        break;
                    }
                }
            }
            // Check that the dock is accessible (has at least one adjacent floor or door)
            let accessible = false;
            for (const [dx, dy] of [[0,1],[1,0],[0,-1],[-1,0]]) {
                const nx = dockX + dx, ny = dockY + dy;
                if ([ '.', '+', 'B', 'E', 'S' ].includes(asciiMap[ny][nx])) accessible = true;
            }
            if (accessible) success = true;
        }
        if (!success) {
            // Fallback: open room
            for (let y = 1; y < MAP_HEIGHT-1; y++) {
                for (let x = 1; x < MAP_WIDTH-1; x++) {
                    asciiMap[y][x] = '.';
                }
            }
            asciiMap[Math.floor(MAP_HEIGHT/2)][Math.floor(MAP_WIDTH/2)] = 'D';
            playerX = Math.floor(MAP_WIDTH/2);
            playerY = Math.floor(MAP_HEIGHT/2);
        }
    };
    
    /**
     * Create a corridor from a point
     * @param {number} startX - Starting X
     * @param {number} startY - Starting Y
     */
    SpaceStation.prototype.createCorridor = function(startX, startY) {
        // Try to connect to existing corridor
        let targetX = startX, targetY = startY;
        let dirX = 0, dirY = 0;
        
        // Decide direction
        if (Math.random() < 0.5) {
            dirX = Math.random() < 0.5 ? -1 : 1;
        } else {
            dirY = Math.random() < 0.5 ? -1 : 1;
        }
        
        let pathLength = 3 + Math.floor(Math.random() * 10);
        
        // Create corridor
        for (let i = 0; i < pathLength; i++) {
            targetX += dirX;
            targetY += dirY;
            
            // Stay in bounds
            if (targetX < 1 || targetX >= MAP_WIDTH - 1 || targetY < 1 || targetY >= MAP_HEIGHT - 1) {
                break;
            }
            
            // If we hit a wall, stop
            if (asciiMap[targetY][targetX] === '#') {
                break;
            }
            
            // Create corridor tile if empty
            if (asciiMap[targetY][targetX] === ' ') {
                asciiMap[targetY][targetX] = '.';
            }
            
            // Change direction randomly
            if (Math.random() < 0.2) {
                if (dirX !== 0) {
                    dirX = 0;
                    dirY = Math.random() < 0.5 ? -1 : 1;
                } else {
                    dirY = 0;
                    dirX = Math.random() < 0.5 ? -1 : 1;
                }
            }
        }
    };
    
    /**
     * Place special rooms in the station
     */
    SpaceStation.prototype.placeSpecialRooms = function() {
        // Find suitable locations for special rooms
        const specialRooms = [
            { symbol: 'B', name: 'bridge', placed: false },
            { symbol: 'E', name: 'engine', placed: false },
            { symbol: 'S', name: 'storage', placed: false }
        ];
        
        for (const room of specialRooms) {
            let attempts = 0;
            while (!room.placed && attempts < 100) {
                attempts++;
                
                const x = 1 + Math.floor(Math.random() * (MAP_WIDTH - 2));
                const y = 1 + Math.floor(Math.random() * (MAP_HEIGHT - 2));
                
                // Check if location is valid (floor space)
                if (asciiMap[y][x] === '.') {
                    asciiMap[y][x] = room.symbol;
                    this.specialRooms[room.name] = { x, y };
                    room.placed = true;
                }
            }
        }
        
        // If any room couldn't be placed, force place it
        for (const room of specialRooms) {
            if (!room.placed) {
                for (let y = 1; y < MAP_HEIGHT - 1; y++) {
                    for (let x = 1; x < MAP_WIDTH - 1; x++) {
                        if (asciiMap[y][x] === '.') {
                            asciiMap[y][x] = room.symbol;
                            this.specialRooms[room.name] = { x, y };
                            room.placed = true;
                            break;
                        }
                    }
                    if (room.placed) break;
                }
            }
        }
    };
    
    /**
     * Generate and place NPCs throughout the station
     * Each station will have specific NPCs based on its layout
     */
    SpaceStation.prototype.generateNPCs = function() {
        // Clear existing NPCs
        this.npcs = [];
        
        // Generate 1-3 NPCs for each special room
        this.generateRoomNPCs(this.specialRooms.bridge, NPC_TYPES.CAPTAIN, 1);
        this.generateRoomNPCs(this.specialRooms.engine, NPC_TYPES.MECHANIC, 1, 2);
        this.generateRoomNPCs(this.specialRooms.storage, NPC_TYPES.TRADER, 1);
        
        // Add guards near the dock
        this.generateRoomNPCs(this.specialRooms.dock, NPC_TYPES.GUARD, 1);
        
        // Add additional NPCs in corridors and rooms
        this.generateRandomNPCs(3, 7);
        
        console.log(`[StationSystem] Generated ${this.npcs.length} NPCs for station ${this.id}`);
        return this.npcs;
    };
    
    /**
     * Generate NPCs in a specific room area
     * @param {Object} roomPosition - {x, y} coordinates of the room center
     * @param {String} npcType - Type of NPC to generate
     * @param {Number} minCount - Minimum number of NPCs
     * @param {Number} maxCount - Maximum number of NPCs (defaults to minCount)
     */
    SpaceStation.prototype.generateRoomNPCs = function(roomPosition, npcType, minCount, maxCount = minCount) {
        if (!roomPosition || roomPosition.x === 0) return; // Invalid room
        
        const count = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
        
        // Try to place NPCs around the room's center point
        for (let i = 0; i < count; i++) {
            // Search for a valid spot in a 5x5 area around the room center
            let placed = false;
            let attempts = 0;
            
            while (!placed && attempts < 20) {
                attempts++;
                const offsetX = Math.floor(Math.random() * 5) - 2;
                const offsetY = Math.floor(Math.random() * 5) - 2;
                const x = roomPosition.x + offsetX;
                const y = roomPosition.y + offsetY;
                
                // Check if this position is valid (on a floor tile and not occupied)
                if (x > 0 && x < MAP_WIDTH && y > 0 && y < MAP_HEIGHT &&
                    (asciiMap[y][x] === '.' || asciiMap[y][x] === '+') &&
                    !this.isNPCAt(x, y)) {
                    
                    // Place NPC here
                    this.npcs.push({
                        id: 'npc_' + Math.random().toString(36).substr(2, 9),
                        x: x,
                        y: y,
                        type: npcType,
                        name: this.generateNPCName(npcType),
                        dialog: this.generateDialog(npcType),
                        dialogActive: false,
                        dialogCooldown: 0
                    });
                    
                    // Update the position in the ASCII map to show the NPC
                    asciiMap[y][x] = npcType;
                    placed = true;
                }
            }
        }
    };
    
    /**
     * Generate random NPCs throughout the station in corridors and rooms
     * @param {Number} minCount - Minimum number of NPCs
     * @param {Number} maxCount - Maximum number of NPCs
     */
    SpaceStation.prototype.generateRandomNPCs = function(minCount, maxCount) {
        const count = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
        const npcTypes = [NPC_TYPES.CIVILIAN, NPC_TYPES.SCIENTIST];
        
        for (let i = 0; i < count; i++) {
            let placed = false;
            let attempts = 0;
            
            while (!placed && attempts < 50) {
                attempts++;
                // Pick a random location in the map
                const x = 1 + Math.floor(Math.random() * (MAP_WIDTH - 2));
                const y = 1 + Math.floor(Math.random() * (MAP_HEIGHT - 2));
                
                // Check if this position is valid (on a floor tile and not occupied)
                if ((asciiMap[y][x] === '.' || asciiMap[y][x] === '+') && !this.isNPCAt(x, y)) {
                    // Choose a random NPC type
                    const npcType = npcTypes[Math.floor(Math.random() * npcTypes.length)];
                    
                    // Place NPC here
                    this.npcs.push({
                        id: 'npc_' + Math.random().toString(36).substr(2, 9),
                        x: x,
                        y: y,
                        type: npcType,
                        name: this.generateNPCName(npcType),
                        dialog: this.generateDialog(npcType),
                        moving: Math.random() < 0.5, // Some NPCs move randomly
                        moveCooldown: 0,
                        dialogActive: false,
                        dialogCooldown: 0
                    });
                    
                    // Update the position in the ASCII map to show the NPC
                    asciiMap[y][x] = npcType;
                    placed = true;
                }
            }
        }
    };
    
    /**
     * Check if there's an NPC at a specific position
     * @param {Number} x - X coordinate
     * @param {Number} y - Y coordinate
     * @returns {Boolean} - True if there's an NPC at (x,y)
     */
    SpaceStation.prototype.isNPCAt = function(x, y) {
        return this.npcs.some(npc => npc.x === x && npc.y === y);
    };
    
    /**
     * Generate a random name for an NPC based on its type
     * @param {String} npcType - The NPC type from NPC_TYPES
     * @returns {String} - A random name
     */
    SpaceStation.prototype.generateNPCName = function(npcType) {
        const names = {
            [NPC_TYPES.MECHANIC]: ['Sparks', 'Gizmo', 'Wrench', 'Coil', 'Bolt', 'Gear'],
            [NPC_TYPES.CAPTAIN]: ['Cmdr. Nova', 'Capt. Rigel', 'Lt. Polaris', 'Adm. Vega', 'Cmdr. Orion'],
            [NPC_TYPES.TRADER]: ['Barter', 'Profit', 'Exchange', 'Dealer', 'Stock', 'Vendor'],
            [NPC_TYPES.GUARD]: ['Sentinel', 'Vigilant', 'Shield', 'Watch', 'Ward', 'Patrol'],
            [NPC_TYPES.SCIENTIST]: ['Doc', 'Prof', 'Theory', 'Logic', 'Engineer', 'Quantum'],
            [NPC_TYPES.CIVILIAN]: ['Settler', 'Traveler', 'Spacer', 'Colonist', 'Wanderer']
        };
        
        // Get the appropriate name list or fallback to a default list
        const nameList = names[npcType] || names[NPC_TYPES.CIVILIAN];
        
        // Pick a random name from the list
        return nameList[Math.floor(Math.random() * nameList.length)];
    };
    
    /**
     * Generate dialog for an NPC based on its type
     * @param {String} npcType - The NPC type from NPC_TYPES
     * @returns {Array} - Array of possible dialog lines
     */
    SpaceStation.prototype.generateDialog = function(npcType) {
        const dialog = {
            [NPC_TYPES.MECHANIC]: [
                "The engine core's running hot today.",
                "Watch those power fluctuations.",
                "Need some parts for repairs?",
                "These old systems need constant maintenance."
            ],
            [NPC_TYPES.CAPTAIN]: [
                "Welcome to the bridge, pilot.",
                "The navigation systems show increased asteroid activity.",
                "We've detected unusual readings from the outer sectors.",
                "Keep your ship's systems updated."
            ],
            [NPC_TYPES.TRADER]: [
                "Looking to trade? I've got rare goods.",
                "Fresh supplies just arrived yesterday.",
                "I'll give you a good price for your cargo.",
                "Need ammunition? Fuel cells? I've got it all."
            ],
            [NPC_TYPES.GUARD]: [
                "Move along, nothing to see here.",
                "Keep your weapons holstered while on station.",
                "I'm watching you, traveler.",
                "Report any suspicious activity immediately."
            ],
            [NPC_TYPES.SCIENTIST]: [
                "My research is at a critical stage!",
                "These readings are quite fascinating.",
                "Have you encountered any unusual phenomena out there?",
                "I'm studying the effects of deep space radiation."
            ],
            [NPC_TYPES.CIVILIAN]: [
                "Just passing through the system.",
                "This station has seen better days.",
                "Have you heard news from the central planets?",
                "Been on this station for three cycles now."
            ]
        };
        
        // Get the appropriate dialog list or fallback to a default list
        const dialogList = dialog[npcType] || dialog[NPC_TYPES.CIVILIAN];
        
        return dialogList;
    };
    
    /**
     * Update NPCs for this station (movement and behavior)
     * @param {Number} deltaTime - Time since last update
     */
    SpaceStation.prototype.updateNPCs = function(deltaTime) {
        if (!this.interiorGenerated || !isInside || !this.npcs) return;
        
        // Update each NPC
        for (let i = 0; i < this.npcs.length; i++) {
            const npc = this.npcs[i];
            
            // Skip non-moving NPCs
            if (!npc.moving) continue;
            
            // Decrease movement cooldown
            if (npc.moveCooldown > 0) {
                npc.moveCooldown -= deltaTime;
                continue;
            }
            
            // Randomly decide to move
            if (Math.random() < 0.2) {
                // Remove NPC from current position in asciiMap
                asciiMap[npc.y][npc.x] = '.';
                
                // Choose a random direction
                const directions = [[0,1],[1,0],[0,-1],[-1,0]];
                const dir = directions[Math.floor(Math.random() * directions.length)];
                
                const newX = npc.x + dir[0];
                const newY = npc.y + dir[1];
                
                // Check if the new position is valid (floor or door, not occupied)
                if (newX > 0 && newX < MAP_WIDTH && newY > 0 && newY < MAP_HEIGHT && 
                    (asciiMap[newY][newX] === '.' || asciiMap[newY][newX] === '+') &&
                    !this.isNPCAt(newX, newY) && 
                    !(newX === playerX && newY === playerY)) {
                    
                    // Move NPC to new position
                    npc.x = newX;
                    npc.y = newY;
                    
                    // Update asciiMap
                    asciiMap[npc.y][npc.x] = npc.type;
                }
                else {
                    // If movement failed, put back in original position
                    asciiMap[npc.y][npc.x] = npc.type;
                }
                
                // Set cooldown for next movement (2-5 seconds)
                npc.moveCooldown = 2 + Math.random() * 3;
            }
        }
    };
    
    /**
     * Initialize the station system
     */
    function init() {
        stationList = [];
    }
    
    /**
     * Generate a new space station
     */
    function generateStation() {
        const canvas = GameState.getCanvas();
        
        // Random position (off-screen)
        const x = Math.floor(Math.random() * canvas.width);
        const y = Math.floor(Math.random() * -canvas.height) - 300; // Above the screen
        
        // Random size
        const size = 100 + Math.floor(Math.random() * 150);
        
        // Random shape
        const shape = STATION_SHAPES[Math.floor(Math.random() * STATION_SHAPES.length)];
        
        // Create station
        const station = new SpaceStation(x, y, size, shape);
        stationList.push(station);
        
        return station;
    }
    
    /**
     * Update all stations
     * @param {number} deltaTime - Time since last update
     */
    function updateStations(deltaTime) {
        const canvas = GameState.getCanvas();
        const warpLevel = GameState.getWarpLevel();
        const warpFactor = 7;
        const yMult = 1 + (warpFactor - 1) * warpLevel;
        const timeScale = 60 * deltaTime;
        console.log('[StationSystem] warpLevel:', warpLevel, 'yMult:', yMult, 'deltaTime:', deltaTime);
        
        // If inside a station, update NPCs
        if (isInside) {
            const currentStation = getCurrentStation();
            if (currentStation) {
                currentStation.updateNPCs(deltaTime);
            }
        } 
        // Otherwise update stations in space
        else {
            for (let i = 0; i < stationList.length; i++) {
                stationList[i].update(deltaTime);
                stationList[i].y += 2.0 * yMult * timeScale;
                
                // Remove stations that are far below the screen
                if (stationList[i].y - stationList[i].size > canvas.height + 500) {
                    stationList.splice(i, 1);
                    i--;
                }
            }
            
            // Generate new stations as needed
            if (stationList.length < 3 && Math.random() < 0.01) {
                generateStation();
            }
        }
    }
    
    /**
     * Draw all stations
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    function drawStations(ctx) {
        for (let i = 0; i < stationList.length; i++) {
            stationList[i].draw(ctx);
        }
    }
    
    /**
     * Move all stations horizontally (when player moves)
     * @param {number} dx - Amount to move
     */
    function moveStationsX(dx) {
        for (let i = 0; i < stationList.length; i++) {
            stationList[i].x += dx;
        }
    }
    
    /**
     * Check if player is in docking range of any station
     */
    function checkDocking() {
        if (isInside) return false; // Already docked
        if (!DockingSystem.canDock()) return false; // Prevent immediate re-dock
            
        for (let i = 0; i < stationList.length; i++) {
            const station = stationList[i];
            
            if (station.isInDockingRange(ShipSystem.hero.tipX, ShipSystem.hero.tipY)) {
                // Show docking prompt
                const ctx = GameState.getContext();
                ctx.font = "18px Consolas";
                ctx.fillStyle = "#FFFFFF";
                ctx.textAlign = "center";
                ctx.fillText("DOCKING...", ShipSystem.hero.tipX, ShipSystem.hero.tipY - 30);
                
                // Automatically dock after a brief delay
                dockAtStation(station);
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Dock at a station and go inside
     * @param {SpaceStation} station - The station to dock at
     */
    function dockAtStation(station) {
        // Generate station interior if first time
        if (!station.interiorGenerated) {
            station.generateInterior();
        }
        
        // Mark station as visited
        station.visited = true;
        
        // Enter station (switching to ASCII mode)
        isInside = true;
        
        // Notify docking system
        DockingSystem.dock(ShipSystem.hero.tipX, ShipSystem.hero.tipY);
    }
    
    /**
     * Render ASCII map of station interior
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    function drawStationInterior(ctx) {
        if (!isInside) return;
        console.log('[StationSystem] drawStationInterior: rendering player at', playerX, playerY);
        
        const tileSize = 20;
        const startX = (ctx.canvas.width - MAP_WIDTH * tileSize) / 2;
        const startY = (ctx.canvas.height - MAP_HEIGHT * tileSize) / 2;
        
        // Draw ASCII map
        ctx.font = "20px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const tileX = startX + x * tileSize;
                const tileY = startY + y * tileSize;
                
                // Draw background
                switch (asciiMap[y][x]) {
                    case '#': // Wall
                        ctx.fillStyle = "#555555";
                        break;
                    case '.': // Floor
                        ctx.fillStyle = "#222222";
                        break;
                    case '+': // Door
                        ctx.fillStyle = "#553322";
                        break;
                    case 'B': // Bridge
                        ctx.fillStyle = "#223355";
                        break;
                    case 'E': // Engine room
                        ctx.fillStyle = "#553322";
                        break;
                    case 'S': // Storage
                        ctx.fillStyle = "#554433";
                        break;
                    case 'D': // Dock
                        ctx.fillStyle = "#335577";
                        break;
                    // NPC types with different background colors
                    case NPC_TYPES.MECHANIC: // Mechanics
                        ctx.fillStyle = "#553300";
                        break;
                    case NPC_TYPES.CAPTAIN: // Captains
                        ctx.fillStyle = "#334477";
                        break;
                    case NPC_TYPES.TRADER: // Traders
                        ctx.fillStyle = "#555522";
                        break;
                    case NPC_TYPES.GUARD: // Guards
                        ctx.fillStyle = "#444444";
                        break;
                    case NPC_TYPES.SCIENTIST: // Scientists
                        ctx.fillStyle = "#225566";
                        break;
                    case NPC_TYPES.CIVILIAN: // Civilians
                        ctx.fillStyle = "#2A332A";
                        break;
                    default:
                        ctx.fillStyle = "#000000";
                }
                
                ctx.fillRect(tileX, tileY, tileSize, tileSize);
                
                // Draw ASCII character
                switch (asciiMap[y][x]) {
                    case NPC_TYPES.MECHANIC:
                        ctx.fillStyle = "#FF9933";
                        break;
                    case NPC_TYPES.CAPTAIN:
                        ctx.fillStyle = "#99CCFF";
                        break;
                    case NPC_TYPES.TRADER:
                        ctx.fillStyle = "#FFFF66";
                        break;
                    case NPC_TYPES.GUARD:
                        ctx.fillStyle = "#FF6666";
                        break;
                    case NPC_TYPES.SCIENTIST:
                        ctx.fillStyle = "#66FFFF";
                        break;
                    case NPC_TYPES.CIVILIAN:
                        ctx.fillStyle = "#AAFFAA";
                        break;
                    default:
                        ctx.fillStyle = "#FFFFFF";
                }
                
                ctx.fillText(asciiMap[y][x], tileX + tileSize/2, tileY + tileSize/2);
            }
        }
        
        // Draw player
        ctx.save();
        ctx.fillStyle = "#FFAA00";
        ctx.fillText('@', startX + playerX * tileSize + tileSize/2, startY + playerY * tileSize + tileSize/2);
        ctx.restore();
        
        // Draw station info
        ctx.font = "16px Arial";
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.fillText("Use ARROW KEYS to move - Press ESC to exit station", ctx.canvas.width / 2, startY - 20);
        
        // Check if player is next to an NPC for interaction
        const currentStation = getCurrentStation();
        if (currentStation) {
            const adjacentNPC = findAdjacentNPC(currentStation);
            if (adjacentNPC) {
                // Only show dialog if not active and cooldown is 0
                if (!adjacentNPC.dialogActive && (!adjacentNPC.dialogCooldown || adjacentNPC.dialogCooldown <= 0)) {
                    adjacentNPC.dialogActive = true;
                    adjacentNPC.dialogCooldown = 0; // Will be set when dialog closes
                    // Pick a dialog line and store it
                    adjacentNPC._currentDialogLine = adjacentNPC.dialog[Math.floor(Math.random() * adjacentNPC.dialog.length)];
                }
                drawNPCDialog(ctx, adjacentNPC, startX, startY, tileSize);
            } else {
                // If no adjacent NPC, reset dialogActive and start cooldown for all NPCs
                if (currentStation.npcs) {
                    for (const npc of currentStation.npcs) {
                        if (npc.dialogActive) {
                            npc.dialogActive = false;
                            npc.dialogCooldown = 30; // About 0.5 seconds at 60fps
                        }
                    }
                }
                // Draw help text based on player position
                const tile = asciiMap[playerY][playerX];
                let helpText = "";
                
                switch (tile) {
                    case 'D':
                        helpText = "DOCKING BAY - Press ESC to return to ship";
                        break;
                    case 'B':
                        helpText = "BRIDGE - Navigation systems and controls";
                        break;
                    case 'E':
                        helpText = "ENGINE ROOM - Power core at critical levels";
                        break;
                    case 'S':
                        helpText = "STORAGE - Supplies and equipment";
                        break;
                }
                
                if (helpText) {
                    ctx.fillText(helpText, ctx.canvas.width / 2, startY + MAP_HEIGHT * tileSize + 20);
                }
            }
        }
        
        // Decrement dialogCooldown for all NPCs
        if (currentStation.npcs) {
            for (const npc of currentStation.npcs) {
                if (npc.dialogCooldown && npc.dialogCooldown > 0) {
                    npc.dialogCooldown--;
                }
            }
        }
    }
    
    /**
     * Move player inside station
     * @param {number} dx - X movement
     * @param {number} dy - Y movement
     */
    function movePlayer(dx, dy) {
        if (!isInside) return;
        
        const newX = playerX + dx;
        const newY = playerY + dy;
        
        // Check bounds
        if (newX < 0 || newX >= MAP_WIDTH || newY < 0 || newY >= MAP_HEIGHT) {
            console.log('[StationSystem] movePlayer: Out of bounds', newX, newY);
            return;
        }
        
        // Check if can move to the new position
        const tile = asciiMap[newY][newX];
        if (tile !== '#') { // Not a wall
            playerX = newX;
            playerY = newY;
            console.log('[StationSystem] movePlayer: moved to', playerX, playerY, 'tile:', tile);
        } else {
            console.log('[StationSystem] movePlayer: blocked by wall at', newX, newY);
        }
    }
    
    /**
     * Check if player is at dock and can exit
     */
    function checkExit() {
        if (!isInside) return false;
        
        // Check if player is at docking position
        const tile = asciiMap[playerY][playerX];
        if (tile === 'D') {
            return true;
        }
        return false;
    }
    
    /**
     * Exit the station and return to the ship
     */
    function exitStation() {
        // isInside = false; // Moved to end of undocking animation for smooth transition
        DockingSystem.undock();
    }
    
    // Force exit from station (used by DockingSystem after undock animation)
    function _forceExit() {
        isInside = false;
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
     * Find an adjacent NPC to the player
     * @param {SpaceStation} station - Current station
     * @returns {Object|null} - The NPC object if found, or null
     */
    function findAdjacentNPC(station) {
        if (!station.npcs) return null;
        
        // Check all 4 adjacent tiles
        const directions = [[0,1],[1,0],[0,-1],[-1,0]];
        
        for (const [dx, dy] of directions) {
            const checkX = playerX + dx;
            const checkY = playerY + dy;
            
            // Find NPC at this position
            const npc = station.npcs.find(n => n.x === checkX && n.y === checkY);
            if (npc) return npc;
        }
        
        return null;
    }
    
    /**
     * Draw NPC dialog when player is adjacent to an NPC
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} npc - The NPC object
     * @param {number} startX - X offset of ASCII map
     * @param {number} startY - Y offset of ASCII map
     * @param {number} tileSize - Size of each ASCII tile
     */
    function drawNPCDialog(ctx, npc, startX, startY, tileSize) {
        // Draw dialog box at the bottom of the screen
        const boxWidth = MAP_WIDTH * tileSize * 0.8;
        const boxHeight = 80;
        const boxX = startX + (MAP_WIDTH * tileSize - boxWidth) / 2;
        const boxY = startY + MAP_HEIGHT * tileSize + 10;
        
        // Draw box background
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.strokeStyle = "#6688AA";
        ctx.lineWidth = 2;
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
        
        // Draw NPC name
        ctx.font = "bold 16px Arial";
        ctx.fillStyle = getColorForNPCType(npc.type);
        ctx.textAlign = "left";
        ctx.fillText(npc.name, boxX + 15, boxY + 20);
        
        // Draw dialog text
        ctx.font = "14px Arial";
        ctx.fillStyle = "#FFFFFF";
        const dialogLine = npc._currentDialogLine || npc.dialog[Math.floor(Math.random() * npc.dialog.length)];
        ctx.fillText(dialogLine, boxX + 15, boxY + 50);
    }
    
    /**
     * Get the text color for an NPC type
     * @param {String} npcType - The NPC type
     * @returns {String} - CSS color for the NPC type
     */
    function getColorForNPCType(npcType) {
        const colors = {
            [NPC_TYPES.MECHANIC]: "#FF9933",
            [NPC_TYPES.CAPTAIN]: "#99CCFF",
            [NPC_TYPES.TRADER]: "#FFFF66",
            [NPC_TYPES.GUARD]: "#FF6666",
            [NPC_TYPES.SCIENTIST]: "#66FFFF",
            [NPC_TYPES.CIVILIAN]: "#AAFFAA"
        };
        
        return colors[npcType] || "#FFFFFF";
    }
    
    /**
     * Draw a legend for NPCs
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X position to start drawing
     * @param {number} y - Y position to start drawing
     */
    function drawNPCLegend(ctx, x, y) {
        ctx.font = "14px Arial";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        
        const npcTypes = [
            { symbol: NPC_TYPES.CAPTAIN, name: "Captain", color: "#99CCFF" },
            { symbol: NPC_TYPES.MECHANIC, name: "Mechanic", color: "#FF9933" },
            { symbol: NPC_TYPES.TRADER, name: "Trader", color: "#FFFF66" },
            { symbol: NPC_TYPES.GUARD, name: "Guard", color: "#FF6666" },
            { symbol: NPC_TYPES.SCIENTIST, name: "Scientist", color: "#66FFFF" },
            { symbol: NPC_TYPES.CIVILIAN, name: "Civilian", color: "#AAFFAA" }
        ];
        
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(x, y, 120, 30 + npcTypes.length * 20);
        ctx.strokeStyle = "#555555";
        ctx.strokeRect(x, y, 120, 30 + npcTypes.length * 20);
        
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText("STATION NPCs:", x + 10, y + 15);
        
        for (let i = 0; i < npcTypes.length; i++) {
            const npc = npcTypes[i];
            ctx.fillStyle = npc.color;
            ctx.fillText(npc.symbol, x + 10, y + 40 + i * 20);
            ctx.fillText("- " + npc.name, x + 30, y + 40 + i * 20);
        }
    }
    
    /**
     * Get the current station that the player is inside
     * @returns {SpaceStation|null} - The current station or null
     */
    function getCurrentStation() {
        if (!isInside) return null;
        
        // Find the station with interiorGenerated = true
        return stationList.find(station => station.interiorGenerated) || null;
    }
    
    // Public API
    return {
        init: init,
        generateStation: generateStation,
        updateStations: updateStations,
        drawStations: drawStations,
        moveStationsX: moveStationsX,
        checkDocking: checkDocking,
        drawStationInterior: drawStationInterior,
        movePlayer: movePlayer,
        checkExit: checkExit,
        exitStation: exitStation,
        isInside: function() { return isInside; },
        _forceExit: _forceExit
    };
})();

// Replace the old RoomSystem with the new StationSystem
const RoomSystem = StationSystem;