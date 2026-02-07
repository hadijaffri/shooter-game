import { Entity } from './Entity';
import { PLAYER, WEAPONS, COLORS } from '../utils/Constants';
import { clamp } from '../utils/MathUtils';

export class Player extends Entity {
  constructor(x, y, name, colorIndex = 0) {
    super(x, y);
    this.name = name || 'Player';
    this.radius = PLAYER.RADIUS;
    this.hp = PLAYER.MAX_HP;
    this.maxHp = PLAYER.MAX_HP;
    this.speed = PLAYER.SPEED;
    this.color = COLORS.players[colorIndex % COLORS.players.length];
    this.colorIndex = colorIndex;

    this.weapon = 'pistol';
    this.weaponAmmo = {};
    this.lastFireTime = 0;
    this.reloading = false;
    this.reloadStartTime = 0;

    this.kills = 0;
    this.deaths = 0;
    this.score = 0;

    this.isDashing = false;
    this.dashTime = 0;
    this.lastDashTime = 0;
    this.dashDirX = 0;
    this.dashDirY = 0;

    this.effects = {};
    this.isInvincible = true;
    this.spawnTime = Date.now();
    this.dead = false;
    this.respawnTimer = 0;

    this.inputState = { up: false, down: false, left: false, right: false, shooting: false };
    this.mouseX = 0;
    this.mouseY = 0;
  }

  update(dt, gameWidth, gameHeight) {
    if (this.dead) return;

    if (this.isInvincible && Date.now() - this.spawnTime > PLAYER.INVINCIBILITY_AFTER_SPAWN) {
      this.isInvincible = false;
    }

    Object.entries(this.effects).forEach(([key, effect]) => {
      if (Date.now() > effect.endTime) {
        delete this.effects[key];
      }
    });

    if (this.isDashing) {
      if (Date.now() - this.dashTime > PLAYER.DASH_DURATION) {
        this.isDashing = false;
      } else {
        this.vx = this.dashDirX * PLAYER.DASH_SPEED;
        this.vy = this.dashDirY * PLAYER.DASH_SPEED;
      }
    } else {
      const currentSpeed = this.effects.speed ? this.speed * 1.6 : this.speed;
      let mx = 0, my = 0;
      if (this.inputState.up) my -= 1;
      if (this.inputState.down) my += 1;
      if (this.inputState.left) mx -= 1;
      if (this.inputState.right) mx += 1;

      if (mx !== 0 && my !== 0) {
        const len = Math.sqrt(mx * mx + my * my);
        mx /= len;
        my /= len;
      }

      this.vx = mx * currentSpeed;
      this.vy = my * currentSpeed;
    }

    super.update(dt);
    this.x = clamp(this.x, this.radius, gameWidth - this.radius);
    this.y = clamp(this.y, this.radius, gameHeight - this.radius);

    if (this.reloading) {
      const weapon = WEAPONS[this.weapon];
      if (Date.now() - this.reloadStartTime >= weapon.reloadTime) {
        this.weaponAmmo[this.weapon] = weapon.maxAmmo;
        this.reloading = false;
      }
    }
  }

  dash() {
    if (this.dead) return;
    if (Date.now() - this.lastDashTime < PLAYER.DASH_COOLDOWN) return;

    let dx = 0, dy = 0;
    if (this.inputState.up) dy -= 1;
    if (this.inputState.down) dy += 1;
    if (this.inputState.left) dx -= 1;
    if (this.inputState.right) dx += 1;

    if (dx === 0 && dy === 0) {
      dx = Math.cos(this.angle);
      dy = Math.sin(this.angle);
    }

    const len = Math.sqrt(dx * dx + dy * dy);
    this.dashDirX = dx / len;
    this.dashDirY = dy / len;
    this.isDashing = true;
    this.dashTime = Date.now();
    this.lastDashTime = Date.now();
  }

  canFire() {
    if (this.dead || this.reloading) return false;
    const weapon = WEAPONS[this.weapon];
    if (Date.now() - this.lastFireTime < weapon.fireRate) return false;
    if (weapon.ammo !== Infinity) {
      const ammo = this.weaponAmmo[this.weapon] ?? weapon.maxAmmo;
      if (ammo <= 0) return false;
    }
    return true;
  }

  fire() {
    if (!this.canFire()) return null;
    const weapon = WEAPONS[this.weapon];
    this.lastFireTime = Date.now();

    if (weapon.ammo !== Infinity) {
      if (this.weaponAmmo[this.weapon] === undefined) {
        this.weaponAmmo[this.weapon] = weapon.maxAmmo;
      }
      this.weaponAmmo[this.weapon]--;
    }

    return weapon;
  }

  reload() {
    if (this.reloading || this.dead) return;
    const weapon = WEAPONS[this.weapon];
    if (weapon.ammo === Infinity) return;
    const current = this.weaponAmmo[this.weapon] ?? weapon.maxAmmo;
    if (current >= weapon.maxAmmo) return;
    this.reloading = true;
    this.reloadStartTime = Date.now();
  }

  switchWeapon(weaponName) {
    if (this.dead) return;
    if (WEAPONS[weaponName] && weaponName !== this.weapon) {
      this.weapon = weaponName;
      this.reloading = false;
    }
  }

  takeDamage(amount) {
    if (this.dead || this.isInvincible) return false;
    if (this.effects.shield) {
      amount *= 0.5;
    }
    this.hp -= amount;
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
    this.respawnTimer = Date.now();
  }

  respawn(x, y) {
    this.x = x;
    this.y = y;
    this.hp = PLAYER.MAX_HP;
    this.dead = false;
    this.weapon = 'pistol';
    this.weaponAmmo = {};
    this.reloading = false;
    this.effects = {};
    this.isInvincible = true;
    this.spawnTime = Date.now();
    this.isDashing = false;
  }

  addEffect(type, duration) {
    this.effects[type] = { endTime: Date.now() + duration };
    if (type === 'health') {
      this.hp = Math.min(this.maxHp, this.hp + 30);
      delete this.effects[type];
    }
  }

  getAmmoDisplay() {
    const weapon = WEAPONS[this.weapon];
    if (weapon.ammo === Infinity) return '∞';
    const current = this.weaponAmmo[this.weapon] ?? weapon.maxAmmo;
    return `${current}/${weapon.maxAmmo}`;
  }

  serialize() {
    return {
      ...super.serialize(),
      name: this.name,
      hp: this.hp,
      maxHp: this.maxHp,
      weapon: this.weapon,
      color: this.color,
      colorIndex: this.colorIndex,
      kills: this.kills,
      deaths: this.deaths,
      score: this.score,
      dead: this.dead,
      isDashing: this.isDashing,
      isInvincible: this.isInvincible,
      effects: this.effects,
      reloading: this.reloading,
    };
  }
}
