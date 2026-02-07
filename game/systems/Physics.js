import { rectCollision, circleCollision } from '../../utils/MathUtils';

export class Physics {
  constructor() {
    this.walls = [];
  }

  setWalls(walls) {
    this.walls = walls;
  }

  resolveWallCollisions(entity, radius) {
    this.walls.forEach(wall => {
      if (rectCollision(wall, entity.x, entity.y, radius)) {
        const cx = wall.x + wall.w / 2;
        const cy = wall.y + wall.h / 2;
        const dx = entity.x - cx;
        const dy = entity.y - cy;
        const halfW = wall.w / 2 + radius;
        const halfH = wall.h / 2 + radius;

        const overlapX = halfW - Math.abs(dx);
        const overlapY = halfH - Math.abs(dy);

        if (overlapX < overlapY) {
          entity.x += dx > 0 ? overlapX : -overlapX;
        } else {
          entity.y += dy > 0 ? overlapY : -overlapY;
        }
      }
    });
  }

  checkBulletWallCollision(bullet) {
    for (const wall of this.walls) {
      if (
        bullet.x >= wall.x &&
        bullet.x <= wall.x + wall.w &&
        bullet.y >= wall.y &&
        bullet.y <= wall.y + wall.h
      ) {
        return true;
      }
    }
    return false;
  }

  checkBulletPlayerCollision(bullet, player) {
    if (player.dead || bullet.ownerId === player.id) return false;
    if (player.isInvincible) return false;
    return circleCollision(bullet.x, bullet.y, bullet.radius, player.x, player.y, player.radius);
  }

  checkPickupCollision(pickup, player) {
    if (player.dead) return false;
    return circleCollision(pickup.x, pickup.y, pickup.radius, player.x, player.y, player.radius);
  }

  checkLineOfSight(x1, y1, x2, y2) {
    const steps = 20;
    const dx = (x2 - x1) / steps;
    const dy = (y2 - y1) / steps;

    for (let i = 0; i <= steps; i++) {
      const px = x1 + dx * i;
      const py = y1 + dy * i;
      for (const wall of this.walls) {
        if (
          px >= wall.x && px <= wall.x + wall.w &&
          py >= wall.y && py <= wall.y + wall.h
        ) {
          return false;
        }
      }
    }
    return true;
  }
}
