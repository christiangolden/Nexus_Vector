# Nexus Vector

A space exploration game with procedurally generated rooms, enemy encounters, and stardust collection.

## Game Features

- Fly through space collecting stardust
- Dodge or destroy enemy drones
- Dock with procedurally generated space stations
- Interact with creatures inside the space stations (ASCII roguelike interiors)
- Use magnetic waves to attract stardust and power-ups
- Fast-paced arcade action with colorful effects
- Power-ups and upgrades

## Controls

- **Move**: Left/Right arrow keys, tilt device, or swipe/touch left/right
- **Shoot**: Space bar or touch right side of screen
- **MagWave**: Down arrow or touch left side of screen
- **Warp Speed**: Up arrow (hold to activate warp, uses warp energy)
- **Pause/Resume**: P key or multi-touch
- **Dock**: Move to a docking station (◐) and the game will auto-dock
- **Inside Station**: Arrow keys to move, ESC to exit station (must be at docking bay 'D')

## Download & Play Locally

1. **Download or Clone the Repository**
   - Download as ZIP from GitHub and extract, or use:
     ```sh
     git clone <repo-url>
     ```

2. **Open the Game**
   - Open `index.html` in your web browser (Chrome or Firefox recommended).
   - No build or server is required; all assets are included.

3. **Optional: Local Server for Best Experience**
   - For full audio and input support, you may want to run a local server:
     ```sh
     cd /path/to/Nexus_Vector
     python3 -m http.server 8000
     ```
   - Then open [http://localhost:8000](http://localhost:8000) in your browser.

4. **Controls**
   - See the Controls section above for keyboard, touch, and tilt options.

## Architecture

The game uses a modular architecture:

### Core Modules
- `game.js` - Orchestrates initialization and main game loop
- `gameState.js` - Handles game state, main loop, rendering, and event subscriptions
- `input.js` - Keyboard, touch, and device orientation input handling (event-driven)
- `movement.js` - Coordinates all movement, including warp speed
- `docking.js` - Manages docking/undocking, docking animations, and ASCII station exploration

### Entity Modules
- `ship.js` - Player and enemy ship management
- `bullet.js` - Projectile management
- `dust.js` - Stardust and magwave attraction
- `powerup.js` - Power-up spawning and collection
- `particle.js` - Visual effects for explosions, etc.
- `room.js` - Procedurally generated space stations and ASCII interiors (StationSystem)
- `star.js` - Background star field
- `station.js` - (Legacy, see room.js/StationSystem)

### Utility Modules
- `collision.js` - Collision detection
- `colors.js` - Color utilities and caching
- `performance.js` - Performance monitoring

### Other Files
- `main.js` - Entry point for the application
- `Nexus_Vector.css` - Game styling

## Performance Optimizations

The game includes several performance optimizations:
- Object pooling for bullets, dust, and power-ups
- Color caching to reduce random color generation
- Batch rendering where possible
- Star size caching to reduce string allocations
- FPS counter for performance monitoring
- Limited maximum number of stars and dust particles

## Future Improvements

Potential areas for future development:
- Sound effects and music
- Additional enemy types
- More power-ups and upgrades
- Saved high scores
- Multiple levels/difficulty settings
- Enhanced ASCII station features

## Credits

Created by Christian T Golden