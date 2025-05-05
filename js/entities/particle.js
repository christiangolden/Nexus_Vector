// Simple Particle System for Enemy Explosions
const ParticleSystem = (function() {
    'use strict';
    
    let particles = [];
    
    function spawnExplosion(x, y, color = '#FFAA00', count = 100) {
        // Parse base color for shade variation
        let baseR = 255, baseG = 170, baseB = 0;
        if (color.startsWith('#') && color.length === 7) {
            baseR = parseInt(color.slice(1, 3), 16);
            baseG = parseInt(color.slice(3, 5), 16);
            baseB = parseInt(color.slice(5, 7), 16);
        }
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 5 + Math.random() * 8;
            // Slight color shade variation
            const dr = Math.floor((Math.random() - 0.5) * 40);
            const dg = Math.floor((Math.random() - 0.5) * 40);
            const db = Math.floor((Math.random() - 0.5) * 40);
            const shade = `rgb(${Math.min(255, Math.max(0, baseR + dr))},${Math.min(255, Math.max(0, baseG + dg))},${Math.min(255, Math.max(0, baseB + db))})`;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 30 + Math.random() * 20,
                color: shade,
                size: 0.7 + Math.random() * 1.0
            });
        }
    }

    function update() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.96; // friction
            p.vy *= 0.96;
            p.life--;
            if (p.life <= 0) particles.splice(i, 1);
        }
    }

    function draw(ctx) {
        for (const p of particles) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life / 40);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    return {
        spawnExplosion,
        update,
        draw
    };
})();
