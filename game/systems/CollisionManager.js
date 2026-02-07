import { Physics } from './Physics';
import { circleCollision, distance } from '../../utils/MathUtils';

export class CollisionManager {
  constructor() {
    this.physics = new Physics();
  }

  setWalls(walls) {
    this.physics.setWalls(walls);
  }

  processPlayerWallCollisions(players) {
    players.forEach(player => {
      if (!player.dead) {
        this.physics.resolveWallCollisions(player, player.radius);
      }
    });
  }

  processBulletCollisions(bullets, players, bots, callbacks) {
    const toRemove = [];

    bullets.forEach((bullet, index) => {
      if (!bullet.active) return;

      if (this.physics.checkBulletWallCollision(bullet)) {
        toRemove.push(index);
        if (callbacks.onWallHit) callbacks.onWallHit(bullet);
        return;
      }

      const allTargets = [...players, ...bots];
      for (const target of allTargets) {
        if (this.physics.checkBulletPlayerCollision(bullet, target)) {
          toRemove.push(index);
          if (callbacks.onPlayerHit) callbacks.onPlayerHit(bullet, target);
          return;
        }
      }
    });

    for (let i = toRemove.length - 1; i >= 0; i--) {
      bullets.splice(toRemove[i], 1);
    }
  }

  processPickupCollisions(pickups, player, callbacks) {
    const toRemove = [];

    pickups.forEach((pickup, index) => {
      if (this.physics.checkPickupCollision(pickup, player)) {
        toRemove.push(index);
        if (callbacks.onPickup) callbacks.onPickup(pickup, player);
      }
    });

    for (let i = toRemove.length - 1; i >= 0; i--) {
      pickups.splice(toRemove[i], 1);
    }
  }

  processExplosion(x, y, radius, damage, ownerId, targets, callbacks) {
    targets.forEach(target => {
      if (target.dead || target.id === ownerId) return;
      const dist = distance(x, y, target.x, target.y);
      if (dist < radius) {
        const falloff = 1 - dist / radius;
        const actualDamage = damage * falloff;
        if (callbacks.onExplosionHit) callbacks.onExplosionHit(target, actualDamage);
      }
    });
  }
}
