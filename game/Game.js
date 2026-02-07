import { Camera } from './core/Camera';
import { InputHandler } from './core/InputHandler';
import { Renderer } from './core/Renderer';
import { HUD } from './core/HUD';
import { ParticleSystem } from './systems/ParticleSystem';
import { MapGenerator } from './systems/MapGenerator';
import { CollisionManager } from './systems/CollisionManager';
import { AudioManager } from './systems/AudioManager';
import { Player } from '../entities/Player';
import { Bullet } from '../entities/Bullet';
import { Enemy } from '../entities/Enemy';
import { PowerUp } from '../entities/PowerUp';
import { WeaponPickup } from '../entities/Weapon';
import { NetworkManager } from '../network/NetworkManager';
import { GameSync } from '../network/GameSync';
import { MSG } from '../network/Protocol';
import { GAME, PLAYER, WEAPONS, POWERUPS } from '../utils/Constants';
import { angleBetween, randomRange, randomInt } from '../utils/MathUtils';
import { EventEmitter } from '../utils/EventEmitter';

export class Game extends EventEmitter {
  constructor(canvas, playerName) {
    super();
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.playerName = playerName;

    this.camera = new Camera(canvas.width, canvas.height);
    this.input = new InputHandler(canvas);
    this.renderer = new Renderer(this.ctx);
    this.hud = new HUD(this.ctx);
    this.particles = new ParticleSystem();
    this.mapGen = new MapGenerator();
    this.collisions = new CollisionManager();
    this.audio = new AudioManager();
    this.network = new NetworkManager();
    this.sync = new GameSync();

    this.localPlayer = null;
    this.remotePlayers = new Map();
    this.bots = [];
    this.bullets = [];
    this.powerUps = [];
    this.weaponPickups = [];
    this.mapData = null;

    this.running = false;
    this.showScoreboard = false;
    this.lastFrame = 0;
    this.frame = 0;
    this.powerUpTimer = 0;
    this.weaponSpawnTimer = 0;

    this.mode = 'offline';
    this.botCount = 5;
  }

  async init(mode = 'offline', roomId = null) {
    this.mode = mode;
    this.audio.init();

    this.mapData = this.mapGen.generate();
    this.collisions.setWalls(this.mapData.walls);

    const spawn = this.mapData.spawnPoints[0];
    this.localPlayer = new Player(spawn.x, spawn.y, this.playerName, 0);

    this.setupInput();
    this.setupResize();

    if (mode === 'online') {
      await this.initNetwork(roomId);
    } else {
      this.spawnBots(this.botCount);
    }

    this.spawnInitialItems();
  }

  async initNetwork(roomId) {
    this.network.playerName = this.playerName;
    await this.network.initialize();

    if (roomId) {
      await this.network.joinRoom(roomId);
    } else {
      const id = await this.network.createRoom();
      this.emit('room-created', id);
    }

    this.spawnBots(3);
    this.setupNetworkEvents();
  }

  setupNetworkEvents() {
    this.network.on('player-join-request', (data) => {
      const idx = this.remotePlayers.size + 1;
      const spawn = this.mapData.spawnPoints[idx % this.mapData.spawnPoints.length];
      const rp = new Player(spawn.x, spawn.y, data.name, idx);
      rp.id = data.id || data.peerId;
      this.remotePlayers.set(data.peerId, rp);
      this.hud.addAnnouncement(`${data.name} joined!`, '#4ECDC4');
    });

    this.network.on('state-update', ({ from, state }) => {
      this.sync.addState(from, state);
    });

    this.network.on('remote-shoot', ({ from, angle, weapon, x, y }) => {
      const rp = this.remotePlayers.get(from);
      if (rp) {
        const w = WEAPONS[weapon] || WEAPONS.pistol;
        const bullet = new Bullet(x, y, angle, w, rp.id, rp.color);
        this.bullets.push(bullet);
        this.audio.playShoot(w.name);
      }
    });

    this.network.on('remote-kill', ({ killer, victim, weapon }) => {
      this.hud.addKill(killer, victim, weapon);
    });

    this.network.on('player-left', (peerId) => {
      const rp = this.remotePlayers.get(peerId);
      if (rp) {
        this.hud.addAnnouncement(`${rp.name} left`, '#FF6B6B');
        this.remotePlayers.delete(peerId);
        this.sync.removePlayer(peerId);
      }
    });

    this.network.on('latency-update', (latency) => {
      this.emit('latency', latency);
    });
  }

  setupInput() {
    this.input.on('action', (action, pressed) => {
      if (!pressed) return;

      switch (action) {
        case 'dash':
          this.localPlayer.dash();
          if (this.localPlayer.isDashing) {
            this.audio.playDash();
            this.network.broadcast(MSG.DASH, {});
          }
          break;
        case 'reload':
          this.localPlayer.reload();
          if (this.localPlayer.reloading) this.audio.playReload();
          break;
        case 'weapon1': this.localPlayer.switchWeapon('pistol'); break;
        case 'weapon2': this.localPlayer.switchWeapon('shotgun'); break;
        case 'weapon3': this.localPlayer.switchWeapon('smg'); break;
        case 'weapon4': this.localPlayer.switchWeapon('sniper'); break;
        case 'weapon5': this.localPlayer.switchWeapon('rocketLauncher'); break;
        case 'scoreboard': this.showScoreboard = true; break;
      }
    });

    this.input.on('action', (action, pressed) => {
      if (action === 'scoreboard' && !pressed) this.showScoreboard = false;
    });

    this.input.on('mousedown', () => {
      if (this.localPlayer.dead) return;
      this.tryShoot();
    });
  }

  setupResize() {
    this._onResize = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.camera.resize(this.canvas.width, this.canvas.height);
    };
    window.addEventListener('resize', this._onResize);
    this._onResize();
  }

  tryShoot() {
    const player = this.localPlayer;
    if (!player.canFire()) return;

    const weapon = player.fire();
    if (!weapon) return;

    const pellets = weapon.pellets || 1;
    for (let i = 0; i < pellets; i++) {
      const spread = (Math.random() - 0.5) * weapon.spread * 2;
      const angle = player.angle + spread;
      const bx = player.x + Math.cos(player.angle) * (player.radius + 15);
      const by = player.y + Math.sin(player.angle) * (player.radius + 15);
      const bullet = new Bullet(bx, by, angle, weapon, player.id, player.color);
      this.bullets.push(bullet);
    }

    this.audio.playShoot(weapon.name);
    this.camera.addShake(weapon.name === 'Sniper' ? 8 : weapon.name === 'Rocket' ? 10 : 3);

    if (this.mode === 'online') {
      this.network.broadcast(MSG.SHOOT, {
        x: player.x, y: player.y,
        angle: player.angle,
        weapon: player.weapon,
      });
    }
  }

  spawnBots(count) {
    for (let i = 0; i < count; i++) {
      const sp = this.mapData.spawnPoints[(i + 2) % this.mapData.spawnPoints.length];
      const difficulty = randomInt(1, 3);
      const bot = new Enemy(sp.x, sp.y, difficulty);
      this.bots.push(bot);
    }
  }

  spawnInitialItems() {
    const powerUpTypes = Object.keys(POWERUPS);
    this.mapData.powerUpSpots.forEach((spot, i) => {
      const type = powerUpTypes[i % powerUpTypes.length];
      this.powerUps.push(new PowerUp(spot.x, spot.y, type));
    });

    const weaponTypes = Object.keys(WEAPONS).filter(w => w !== 'pistol');
    this.mapData.weaponSpots.forEach((spot, i) => {
      const type = weaponTypes[i % weaponTypes.length];
      this.weaponPickups.push(new WeaponPickup(spot.x, spot.y, type));
    });
  }

  start() {
    this.running = true;
    this.lastFrame = performance.now();
    this.loop();
  }

  stop() {
    this.running = false;
    this.input.destroy();
    this.network.disconnect();
    window.removeEventListener('resize', this._onResize);
  }

  loop() {
    if (!this.running) return;
    requestAnimationFrame(() => this.loop());

    const now = performance.now();
    const rawDt = (now - this.lastFrame) / (1000 / 60);
    const dt = Math.min(rawDt, 3);
    this.lastFrame = now;
    this.frame++;

    this.update(dt);
    this.render();
  }

  update(dt) {
    const player = this.localPlayer;

    if (!player.dead) {
      player.inputState = this.input.getInputState();
      const worldMouse = this.camera.screenToWorld(this.input.mouseX, this.input.mouseY);
      player.angle = angleBetween(player.x, player.y, worldMouse.x, worldMouse.y);

      if (player.inputState.shooting) {
        const weapon = WEAPONS[player.weapon];
        if (weapon.automatic) this.tryShoot();
      }
    }

    player.update(dt, GAME.WIDTH, GAME.HEIGHT);

    if (player.isDashing) {
      this.particles.emitDash(player.x, player.y, player.color);
    }

    this.collisions.processPlayerWallCollisions([player]);

    if (player.dead && Date.now() - player.respawnTimer > PLAYER.RESPAWN_TIME) {
      const sp = this.mapData.spawnPoints[randomInt(0, this.mapData.spawnPoints.length - 1)];
      player.respawn(sp.x, sp.y);
    }

    const allPlayers = [player, ...Array.from(this.remotePlayers.values())];

    this.bots.forEach(bot => {
      if (bot.dead) {
        if (Date.now() - bot.respawnTimer > PLAYER.RESPAWN_TIME + 2000) {
          const sp = this.mapData.spawnPoints[randomInt(0, this.mapData.spawnPoints.length - 1)];
          bot.respawn(sp.x, sp.y);
        }
        return;
      }

      bot.update(dt, allPlayers, GAME.WIDTH, GAME.HEIGHT);
      this.collisions.processPlayerWallCollisions([bot]);

      const fireResult = bot.fire();
      if (fireResult) {
        const bx = bot.x + Math.cos(fireResult.angle) * (bot.radius + 15);
        const by = bot.y + Math.sin(fireResult.angle) * (bot.radius + 15);
        const bullet = new Bullet(bx, by, fireResult.angle, fireResult.weapon, bot.id, bot.color);
        this.bullets.push(bullet);
        if (this.camera.isVisible(bot.x, bot.y, 300)) {
          this.audio.playShoot(fireResult.weapon.name);
        }
      }
    });

    this.bullets.forEach(b => b.update(dt));
    this.bullets = this.bullets.filter(b => b.active);

    this.collisions.processBulletCollisions(
      this.bullets,
      allPlayers,
      this.bots,
      {
        onWallHit: (bullet) => {
          this.particles.emitHit(bullet.x, bullet.y, '#888');
        },
        onPlayerHit: (bullet, target) => {
          const damageMultiplier = this.getOwner(bullet.ownerId)?.effects?.damage ? 1.5 : 1;

          if (bullet.explosive) {
            this.handleExplosion(bullet, damageMultiplier);
          } else {
            const killed = target.takeDamage(bullet.damage * damageMultiplier);
            this.particles.emitHit(bullet.x, bullet.y, target.color);
            this.audio.playHit();

            if (killed) {
              this.handleKill(bullet.ownerId, target);
            }
          }
        },
      }
    );

    this.collisions.processPickupCollisions(this.powerUps, player, {
      onPickup: (pickup) => {
        player.addEffect(pickup.type, pickup.duration);
        this.audio.playPickup();
        this.hud.addAnnouncement(`+${pickup.type.toUpperCase()}`, pickup.color);
      },
    });

    this.collisions.processPickupCollisions(this.weaponPickups, player, {
      onPickup: (pickup) => {
        player.switchWeapon(pickup.weaponType);
        this.audio.playPickup();
        this.hud.addAnnouncement(`${pickup.config.name}`, pickup.config.color);
      },
    });

    this.powerUps.forEach(p => p.update(dt));
    this.weaponPickups.forEach(w => w.update(dt));

    this.powerUpTimer += dt;
    if (this.powerUpTimer > 600) {
      this.respawnItems();
      this.powerUpTimer = 0;
    }

    this.particles.update();
    this.camera.follow(player.dead ? { x: player.x, y: player.y } : player);

    // Interpolate remote players
    this.remotePlayers.forEach((rp, peerId) => {
      const state = this.sync.getInterpolatedState(peerId);
      if (state) {
        rp.x = state.x;
        rp.y = state.y;
        rp.angle = state.angle || 0;
        rp.hp = state.hp ?? rp.hp;
        rp.dead = state.dead ?? rp.dead;
        rp.weapon = state.weapon || rp.weapon;
      }
    });

    if (this.mode === 'online' && this.frame % 3 === 0) {
      this.network.sendStateUpdate(player.serialize());
    }
  }

  handleExplosion(bullet, damageMultiplier) {
    this.particles.emitExplosion(bullet.x, bullet.y, '#FF4500', 40);
    this.camera.addShake(12);
    this.audio.playExplosion();

    const allTargets = [this.localPlayer, ...Array.from(this.remotePlayers.values()), ...this.bots];
    this.collisions.processExplosion(
      bullet.x, bullet.y,
      bullet.explosionRadius,
      bullet.damage * damageMultiplier,
      bullet.ownerId,
      allTargets,
      {
        onExplosionHit: (target, damage) => {
          const killed = target.takeDamage(damage);
          if (killed) this.handleKill(bullet.ownerId, target);
        },
      }
    );
  }

  handleKill(killerId, victim) {
    const killer = this.getOwner(killerId);
    if (killer) {
      killer.kills++;
      killer.score += 100;
      this.audio.playKill();
      this.hud.addKill(killer.name, victim.name, WEAPONS[killer.weapon]?.name || 'Unknown');
    }

    this.particles.emitDeath(victim.x, victim.y, victim.color);
    if (victim === this.localPlayer) {
      this.audio.playDeath();
    }

    if (this.mode === 'online') {
      this.network.broadcast(MSG.KILL, {
        killer: killer?.name || 'Unknown',
        victim: victim.name,
        weapon: killer?.weapon || 'pistol',
      });
    }
  }

  getOwner(id) {
    if (this.localPlayer.id === id) return this.localPlayer;
    for (const [, rp] of this.remotePlayers) {
      if (rp.id === id) return rp;
    }
    for (const bot of this.bots) {
      if (bot.id === id) return bot;
    }
    return null;
  }

  respawnItems() {
    const powerUpTypes = Object.keys(POWERUPS);
    if (this.powerUps.length < 3) {
      const spot = this.mapData.powerUpSpots[randomInt(0, this.mapData.powerUpSpots.length - 1)];
      const type = powerUpTypes[randomInt(0, powerUpTypes.length - 1)];
      this.powerUps.push(new PowerUp(spot.x, spot.y, type));
    }

    const weaponTypes = Object.keys(WEAPONS).filter(w => w !== 'pistol');
    if (this.weaponPickups.length < 3) {
      const spot = this.mapData.weaponSpots[randomInt(0, this.mapData.weaponSpots.length - 1)];
      const type = weaponTypes[randomInt(0, weaponTypes.length - 1)];
      this.weaponPickups.push(new WeaponPickup(spot.x, spot.y, type));
    }
  }

  render() {
    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    ctx.clearRect(0, 0, cw, ch);

    ctx.save();
    this.camera.apply(ctx);

    this.mapGen.renderBackground(ctx);
    this.mapGen.renderWalls(ctx);

    this.powerUps.forEach(p => this.renderer.renderPowerUp(p));
    this.weaponPickups.forEach(w => this.renderer.renderWeaponPickup(w));

    this.bullets.forEach(b => this.renderer.renderBullet(b));

    this.bots.forEach(bot => {
      if (!bot.dead) this.renderer.renderPlayer(bot);
    });

    this.remotePlayers.forEach(rp => {
      if (!rp.dead) this.renderer.renderPlayer(rp);
    });

    if (!this.localPlayer.dead) {
      this.renderer.renderPlayer(this.localPlayer);
    }

    this.particles.render(ctx);

    ctx.restore();

    const worldMouse = this.camera.screenToWorld(this.input.mouseX, this.input.mouseY);
    const screenPos = this.camera.worldToScreen(worldMouse.x, worldMouse.y);
    this.renderer.renderCrosshair(screenPos.x, screenPos.y);

    this.hud.render(this.localPlayer, cw, ch);
    this.hud.renderMinimap(
      this.camera, this.localPlayer,
      [this.localPlayer, ...Array.from(this.remotePlayers.values())],
      this.bots,
      this.mapData.walls,
      cw, ch
    );

    if (this.showScoreboard) {
      this.hud.renderScoreboard(
        [this.localPlayer, ...Array.from(this.remotePlayers.values())],
        this.bots, cw, ch
      );
    }

    if (this.localPlayer.dead) {
      this.hud.renderDeathScreen(cw, ch, this.localPlayer.respawnTimer + PLAYER.RESPAWN_TIME);
    }

    if (this.mode === 'online') {
      ctx.fillStyle = '#888';
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(
        `Online: ${this.network.getPlayerCount()} | Ping: ${this.network.latency}ms`,
        15, ch - 10
      );
    }
  }
}
