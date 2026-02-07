import { Entity } from './Entity';
import { GAME } from '../utils/Constants';

export class Bullet extends Entity {
  constructor(x, y, angle, weapon, ownerId, ownerColor) {
    super(x, y);
    this.angle = angle;
    this.speed = weapon.bulletSpeed;
    this.damage = weapon.damage;
    this.radius = weapon.bulletSize;
    this.ownerId = ownerId;
    this.color = weapon.color || ownerColor;
    this.explosive = weapon.explosive || false;
    this.explosionRadius = weapon.explosionRadius || 0;
    this.trail = [];
    this.maxTrailLength = 8;
    this.lifetime = 3000;

    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
  }

  update(dt) {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }

    super.update(dt);

    if (this.x < -50 || this.x > GAME.WIDTH + 50 ||
        this.y < -50 || this.y > GAME.HEIGHT + 50) {
      this.active = false;
    }

    if (Date.now() - this.createdAt > this.lifetime) {
      this.active = false;
    }
  }

  serialize() {
    return {
      ...super.serialize(),
      ownerId: this.ownerId,
      damage: this.damage,
      radius: this.radius,
      color: this.color,
      explosive: this.explosive,
      explosionRadius: this.explosionRadius,
    };
  }
}
