import { WEAPONS } from '../utils/Constants';
import { Entity } from './Entity';

export class WeaponPickup extends Entity {
  constructor(x, y, weaponType) {
    super(x, y);
    this.weaponType = weaponType;
    this.config = WEAPONS[weaponType];
    this.radius = 18;
    this.bobOffset = Math.random() * Math.PI * 2;
    this.rotationSpeed = 0.02;
    this.displayAngle = 0;
  }

  update(dt) {
    this.bobOffset += 0.03 * dt;
    this.displayAngle += this.rotationSpeed * dt;
  }

  getVisualY() {
    return this.y + Math.sin(this.bobOffset) * 4;
  }

  serialize() {
    return {
      ...super.serialize(),
      weaponType: this.weaponType,
      radius: this.radius,
      color: this.config.color,
      name: this.config.name,
    };
  }
}
