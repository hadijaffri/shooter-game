import { Entity } from './Entity';
import { PLAYER, WEAPONS } from '../utils/Constants';
import { distance, angleBetween, clamp, randomRange } from '../utils/MathUtils';

const AI_STATES = { IDLE: 'idle', PATROL: 'patrol', CHASE: 'chase', ATTACK: 'attack', FLEE: 'flee' };

export class Enemy extends Entity {
  constructor(x, y, difficulty = 1) {
    super(x, y);
    this.radius = PLAYER.RADIUS;
    this.hp = 60 + difficulty * 20;
    this.maxHp = this.hp;
    this.speed = 2 + difficulty * 0.5;
    this.damage = 15 + difficulty * 5;
    this.color = '#FF4444';
    this.name = `Bot-${this.id.substring(0, 4)}`;

    this.state = AI_STATES.PATROL;
    this.targetX = x;
    this.targetY = y;
    this.detectionRange = 300 + difficulty * 50;
    this.attackRange = 250;
    this.fleeHpThreshold = 0.25;
    this.lastFireTime = 0;
    this.fireRate = 600 - difficulty * 50;
    this.accuracy = 0.85 + difficulty * 0.03;
    this.patrolTimer = 0;
    this.stateTimer = 0;
    this.difficulty = difficulty;
    this.dead = false;
    this.weapon = difficulty > 2 ? 'smg' : 'pistol';
    this.kills = 0;
    this.deaths = 0;
    this.score = 0;
  }

  update(dt, players, gameWidth, gameHeight) {
    if (this.dead) return;

    this.stateTimer += dt;
    let nearestPlayer = null;
    let nearestDist = Infinity;

    players.forEach(p => {
      if (p.dead) return;
      const d = distance(this.x, this.y, p.x, p.y);
      if (d < nearestDist) {
        nearestDist = d;
        nearestPlayer = p;
      }
    });

    switch (this.state) {
      case AI_STATES.PATROL:
        this.patrol(dt, gameWidth, gameHeight);
        if (nearestPlayer && nearestDist < this.detectionRange) {
          this.state = AI_STATES.CHASE;
          this.stateTimer = 0;
        }
        break;

      case AI_STATES.CHASE:
        if (!nearestPlayer || nearestDist > this.detectionRange * 1.5) {
          this.state = AI_STATES.PATROL;
          this.stateTimer = 0;
        } else if (nearestDist < this.attackRange) {
          this.state = AI_STATES.ATTACK;
          this.stateTimer = 0;
        } else {
          this.moveToward(nearestPlayer.x, nearestPlayer.y, dt);
        }
        if (this.hp / this.maxHp < this.fleeHpThreshold) {
          this.state = AI_STATES.FLEE;
          this.stateTimer = 0;
        }
        break;

      case AI_STATES.ATTACK:
        if (!nearestPlayer || nearestPlayer.dead) {
          this.state = AI_STATES.PATROL;
          this.stateTimer = 0;
        } else {
          this.angle = angleBetween(this.x, this.y, nearestPlayer.x, nearestPlayer.y);
          if (nearestDist > this.attackRange * 1.3) {
            this.state = AI_STATES.CHASE;
          } else if (nearestDist < this.attackRange * 0.5) {
            this.strafeAround(nearestPlayer, dt);
          }
          if (this.hp / this.maxHp < this.fleeHpThreshold) {
            this.state = AI_STATES.FLEE;
            this.stateTimer = 0;
          }
        }
        break;

      case AI_STATES.FLEE:
        if (nearestPlayer) {
          const fleeAngle = angleBetween(nearestPlayer.x, nearestPlayer.y, this.x, this.y);
          this.moveInDirection(fleeAngle, dt);
        }
        if (this.hp / this.maxHp > 0.5 || this.stateTimer > 180) {
          this.state = AI_STATES.PATROL;
          this.stateTimer = 0;
        }
        break;
    }

    this.x = clamp(this.x, this.radius, gameWidth - this.radius);
    this.y = clamp(this.y, this.radius, gameHeight - this.radius);
  }

  patrol(dt, gameWidth, gameHeight) {
    this.patrolTimer += dt;
    if (this.patrolTimer > 120 || distance(this.x, this.y, this.targetX, this.targetY) < 20) {
      this.targetX = randomRange(100, gameWidth - 100);
      this.targetY = randomRange(100, gameHeight - 100);
      this.patrolTimer = 0;
    }
    this.moveToward(this.targetX, this.targetY, dt);
  }

  moveToward(tx, ty, dt) {
    const a = angleBetween(this.x, this.y, tx, ty);
    this.angle = a;
    this.x += Math.cos(a) * this.speed * dt;
    this.y += Math.sin(a) * this.speed * dt;
  }

  moveInDirection(angle, dt) {
    this.x += Math.cos(angle) * this.speed * 1.2 * dt;
    this.y += Math.sin(angle) * this.speed * 1.2 * dt;
  }

  strafeAround(target, dt) {
    const a = angleBetween(this.x, this.y, target.x, target.y) + Math.PI / 2;
    this.x += Math.cos(a) * this.speed * 0.8 * dt;
    this.y += Math.sin(a) * this.speed * 0.8 * dt;
    this.angle = angleBetween(this.x, this.y, target.x, target.y);
  }

  canFire() {
    if (this.dead || this.state !== AI_STATES.ATTACK) return false;
    return Date.now() - this.lastFireTime > this.fireRate;
  }

  fire() {
    if (!this.canFire()) return null;
    this.lastFireTime = Date.now();
    const spread = (1 - this.accuracy) * 0.3;
    const finalAngle = this.angle + (Math.random() - 0.5) * spread;
    return { angle: finalAngle, weapon: WEAPONS[this.weapon] };
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.state === AI_STATES.PATROL || this.state === AI_STATES.IDLE) {
      this.state = AI_STATES.CHASE;
    }
    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
      return true;
    }
    return false;
  }

  die() {
    this.dead = true;
    this.deaths++;
  }

  respawn(x, y) {
    this.x = x;
    this.y = y;
    this.hp = this.maxHp;
    this.dead = false;
    this.state = AI_STATES.PATROL;
    this.stateTimer = 0;
  }

  serialize() {
    return {
      ...super.serialize(),
      name: this.name,
      hp: this.hp,
      maxHp: this.maxHp,
      color: this.color,
      dead: this.dead,
      state: this.state,
      weapon: this.weapon,
      kills: this.kills,
      deaths: this.deaths,
      score: this.score,
      isBot: true,
    };
  }
}
