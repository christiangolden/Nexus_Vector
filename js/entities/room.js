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
        this.rotationSpeed = 0.01 * (Math.random() * 0.5 + 0.5) * (Math.random() < 0.5 ? 1 : -1);
        this.rotation = 0;
        this.interiorGenerated = false;
        this.specialRooms = {
            bridge: { x: 0, y: 0 },
            engine: { x: 0, y: 0 },
            storage: { x: 0, y: 0 },
            dock: { x: 0, y: 0 }
        };
        
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
        
        // The dock is always at the bottom
        this.specialRooms.dock = { x: Math.floor(MAP_WIDTH/2), y: MAP_HEIGHT-2 };
        asciiMap[MAP_HEIGHT-2][Math.floor(MAP_WIDTH/2)] = 'D';
        
        // Set player starting position at the dock
        playerX = this.specialRooms.dock.x;
        playerY = this.specialRooms.dock.y;
        
        this.interiorGenerated = true;
    };
    
    /**
     * Generate random rooms for the station interior
     */
    SpaceStation.prototype.generateRooms = function() {
        // Parameters
        const MIN_ROOMS = 7;
        const MAX_ROOMS = 12;
        const MAX_ATTEMPTS = 100;
        const MIN_ROOM_W = 5, MAX_ROOM_W = 12;
        const MIN_ROOM_H = 4, MAX_ROOM_H = 8;
        // Clear map
        for (let y = 0; y < MAP_HEIGHT; y++) {
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
        // Step 1: Place non-overlapping rooms
        let rooms = [];
        let attempts = 0;
        while (rooms.length < MAX_ROOMS && attempts < MAX_ATTEMPTS) {
            attempts++;
            let w = MIN_ROOM_W + Math.floor(Math.random() * (MAX_ROOM_W - MIN_ROOM_W + 1));
            let h = MIN_ROOM_H + Math.floor(Math.random() * (MAX_ROOM_H - MIN_ROOM_H + 1));
            let x = 2 + Math.floor(Math.random() * (MAP_WIDTH - w - 4));
            let y = 2 + Math.floor(Math.random() * (MAP_HEIGHT - h - 6));
            // Check overlap
            let overlap = false;
            for (const r of rooms) {
                if (x + w < r.x - 1 || x > r.x + r.w + 1 || y + h < r.y - 1 || y > r.y + r.h + 1) continue;
                overlap = true;
                break;
            }
            if (overlap) continue;
            // Place room
            rooms.push({x, y, w, h, cx: Math.floor(x + w/2), cy: Math.floor(y + h/2)});
            for (let ry = y; ry < y + h; ry++) {
                for (let rx = x; rx < x + w; rx++) {
                    if (ry === y || ry === y + h - 1 || rx === x || rx === x + w - 1) {
                        asciiMap[ry][rx] = '#';
                    } else {
                        asciiMap[ry][rx] = '.';
                    }
                }
            }
        }
        if (rooms.length < MIN_ROOMS) {
            // Not enough rooms, try again
            return this.generateRooms();
        }
        // Step 2: Connect rooms with MST (Prim's algorithm)
        let connected = [rooms[0]];
        let unconnected = rooms.slice(1);
        let connections = [];
        while (unconnected.length > 0) {
            let bestDist = Infinity, bestA = null, bestB = null, bestIdx = -1;
            for (const a of connected) {
                for (let i = 0; i < unconnected.length; i++) {
                    const b = unconnected[i];
                    const dist = Math.abs(a.cx - b.cx) + Math.abs(a.cy - b.cy);
                    if (dist < bestDist) {
                        bestDist = dist; bestA = a; bestB = b; bestIdx = i;
                    }
                }
            }
            connections.push([bestA, bestB]);
            connected.push(bestB);
            unconnected.splice(bestIdx, 1);
        }
        // Step 3: Carve corridors (L-shaped)
        for (const [a, b] of connections) {
            let x = a.cx, y = a.cy;
            while (x !== b.cx) {
                asciiMap[y][x] = '.';
                x += (b.cx > x) ? 1 : -1;
            }
            while (y !== b.cy) {
                asciiMap[y][x] = '.';
                y += (b.cy > y) ? 1 : -1;
            }
            asciiMap[y][x] = '.';
        }
        // Step 4: Place doors at room/corridor boundaries
        for (const room of rooms) {
            // For each wall, if adjacent to corridor, place a door
            for (let rx = room.x; rx < room.x + room.w; rx++) {
                for (let ry = room.y; ry < room.y + room.h; ry++) {
                    if (asciiMap[ry][rx] !== '#') continue;
                    for (const [dx, dy] of [[0,1],[1,0],[0,-1],[-1,0]]) {
                        const nx = rx + dx, ny = ry + dy;
                        if (asciiMap[ny] && asciiMap[ny][nx] === '.') {
                            asciiMap[ry][rx] = '+';
                            break;
                        }
                    }
                }
            }
        }
        // Step 5: Place dock at bottom-most room
        let dockRoom = rooms.reduce((a, b) => (a.cy > b.cy ? a : b));
        asciiMap[dockRoom.cy][dockRoom.cx] = 'D';
        this.specialRooms.dock = {x: dockRoom.cx, y: dockRoom.cy};
        playerX = dockRoom.cx;
        playerY = dockRoom.cy;
        // Step 6: Place special rooms in random rooms (not dock)
        let otherRooms = rooms.filter(r => r !== dockRoom);
        if (otherRooms.length >= 3) {
            let shuffled = otherRooms.slice().sort(() => Math.random() - 0.5);
            asciiMap[shuffled[0].cy][shuffled[0].cx] = 'B';
            asciiMap[shuffled[1].cy][shuffled[1].cx] = 'E';
            asciiMap[shuffled[2].cy][shuffled[2].cx] = 'S';
            this.specialRooms.bridge = {x: shuffled[0].cx, y: shuffled[0].cy};
            this.specialRooms.engine = {x: shuffled[1].cx, y: shuffled[1].cy};
            this.specialRooms.storage = {x: shuffled[2].cx, y: shuffled[2].cy};
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
        
        // Update each station
        for (let i = 0; i < stationList.length; i++) {
            stationList[i].update(deltaTime);
            stationList[i].y += 0.5;
            
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
                    default:
                        ctx.fillStyle = "#000000";
                }
                
                ctx.fillRect(tileX, tileY, tileSize, tileSize);
                
                // Draw ASCII character
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText(asciiMap[y][x], tileX + tileSize/2, tileY + tileSize/2);
            }
        }
        
        // Draw player
        ctx.fillStyle = "#FFAA00";
        ctx.fillText('@', startX + playerX * tileSize + tileSize/2, startY + playerY * tileSize + tileSize/2);
        
        // Draw station info
        ctx.font = "16px Arial";
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.fillText("Use ARROW KEYS to move - Press ESC to exit station", ctx.canvas.width / 2, startY - 20);
        
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
            return;
        }
        
        // Check if can move to the new position
        const tile = asciiMap[newY][newX];
        if (tile !== '#') { // Not a wall
            playerX = newX;
            playerY = newY;
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
        isInside = false;
        DockingSystem.undock();
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
        isInside: function() { return isInside; }
    };
})();

// Replace the old RoomSystem with the new StationSystem
const RoomSystem = StationSystem;