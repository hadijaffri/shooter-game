import { randomRange } from '../../utils/MathUtils';

class Particle {
  constructor(x, y, config) {
    this.x = x;
    this.y = y;
    this.vx = config.vx || (Math.random() - 0.5) * (config.speed || 4);
    this.vy = config.vy || (Math.random() - 0.5) * (config.speed || 4);
    this.life = config.life || 30;
    this.maxLife = this.life;
    this.size = config.size || randomRange(2, 5);
    this.color = config.color || '#FFF';
    this.gravity = config.gravity || 0;
    this.friction = config.friction || 0.98;
    this.fadeOut = config.fadeOut !== false;
    this.shrink = config.shrink || false;
  }

  update() {
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    return this.life > 0;
  }

  getAlpha() {
    if (!this.fadeOut) return 1;
    return this.life / this.maxLife;
  }

  getSize() {
    if (!this.shrink) return this.size;
    return this.size * (this.life / this.maxLife);
  }
}

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.maxParticles = 500;
  }

  emit(x, y, count, config = {}) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      this.particles.push(new Particle(x, y, config));
    }
  }

  emitExplosion(x, y, color = '#FF6600', count = 30) {
    this.emit(x, y, count, {
      speed: 8,
      color,
      life: randomRange(20, 40),
      gravity: 0.05,
      size: randomRange(2, 6),
      shrink: true,
    });
  }

  emitHit(x, y, color = '#FFF', count = 8) {
    this.emit(x, y, count, {
      speed: 3,
      color,
      life: randomRange(10, 20),
      size: randomRange(1, 3),
      fadeOut: true,
    });
  }

  emitTrail(x, y, color = '#888') {
    this.emit(x, y, 1, {
      speed: 0.5,
      color,
      life: 15,
      size: randomRange(1, 2),
      fadeOut: true,
    });
  }

  emitDash(x, y, color) {
    this.emit(x, y, 3, {
      speed: 2,
      color,
      life: 20,
      size: randomRange(3, 6),
      fadeOut: true,
      shrink: true,
    });
  }

  emitDeath(x, y, color) {
    this.emit(x, y, 40, {
      speed: 6,
      color,
      life: randomRange(30, 60),
      gravity: 0.08,
      size: randomRange(3, 8),
      shrink: true,
    });
  }

  update() {
    this.particles = this.particles.filter(p => p.update());
  }

  render(ctx) {
    this.particles.forEach(p => {
      const alpha = p.getAlpha();
      const size = p.getSize();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  clear() {
    this.particles = [];
  }
}
