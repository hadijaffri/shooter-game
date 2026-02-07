import { generateId } from '../utils/MathUtils';

export class Entity {
  constructor(x, y) {
    this.id = generateId();
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.active = true;
    this.createdAt = Date.now();
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  distanceTo(other) {
    const dx = other.x - this.x;
    const dy = other.y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  destroy() {
    this.active = false;
  }

  serialize() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      angle: this.angle,
      active: this.active,
    };
  }
}
