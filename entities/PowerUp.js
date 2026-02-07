import { Entity } from './Entity';
import { POWERUPS } from '../utils/Constants';

export class PowerUp extends Entity {
  constructor(x, y, type) {
    super(x, y);
    this.type = type;
    this.radius = 15;
    this.config = POWERUPS[type];
    this.color = this.config.color;
    this.symbol = this.config.symbol;
    this.duration = this.config.duration;
    this.bobOffset = Math.random() * Math.PI * 2;
    this.pulsePhase = 0;
  }

  update(dt) {
    this.bobOffset += 0.03 * dt;
    this.pulsePhase += 0.05 * dt;
  }

  getVisualY() {
    return this.y + Math.sin(this.bobOffset) * 5;
  }

  getPulseScale() {
    return 1 + Math.sin(this.pulsePhase) * 0.15;
  }

  serialize() {
    return {
      ...super.serialize(),
      type: this.type,
      color: this.color,
      symbol: this.symbol,
      radius: this.radius,
    };
  }
}
