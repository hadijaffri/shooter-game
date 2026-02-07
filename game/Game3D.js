import { SceneManager } from './3d/SceneManager';
import { PlayerModel } from './3d/PlayerModel';
import { BulletRenderer3D } from './3d/BulletRenderer3D';
import { PowerUpModel } from './3d/PowerUpModel';
import { WeaponPickupModel } from './3d/WeaponPickupModel';
import { WallBuilder } from './3d/WallBuilder';
import { ParticleSystem3D } from './3d/ParticleSystem3D';
import { HUD3D } from './3d/HUD3D';
import { InputHandler } from './core/InputHandler';
import { MapGenerator } from './systems/MapGenerator';
import { CollisionManager } from './systems/CollisionManager';
import { AudioManager } from './systems/AudioManager';
import { WaveManager } from './systems/WaveManager';
import { Player } from '../entities/Player';
import { Bullet } from '../entities/Bullet';
import { Enemy } from '../entities/Enemy';
import { PowerUp } from '../entities/PowerUp';
import { WeaponPickup } from '../entities/Weapon';
import { NetworkManager } from '../network/NetworkManager';
import { GameSync } from '../network/GameSync';
import { MSG } from '../network/Protocol';
import { GAME, PLAYER, WEAPONS, POWERUPS } from '../utils/Constants';
import { angleBetween, randomInt, randomRange } from '../utils/MathUtils';
import { EventEmitter } from '../utils/EventEmitter';

export class Game3D extends EventEmitter {
  constructor(container, playerName) {
    super();
    this.container = container;
    this.playerName = playerName;

    this.sceneManager = new SceneManager(container);
    this.hud = new HUD3D();
    this.input = new InputHandler(this.sceneManager.getDomElement());
    this.mapGen = new MapGenerator();
    this.collisions = new CollisionManager();
    this.audio = new AudioManager();
    this.waveManager = new WaveManager();
    this.network = new NetworkManager();
    this.sync = new GameSync();

    this.wallBuilder = new WallBuilder(this.sceneManager.scene);
    this.bulletRenderer = new BulletRenderer3D(this.sceneManager.scene);
    this.particles = new ParticleSystem3D(this.sceneManager.scene);

    this.localPlayer = null;
    this.localPlayerModel = null;
    this.remotePlayers = new Map();
    this.remotePlayerModels = new Map();
    this.bots = [];
    this.botModels = new Map();
    this.bullets = [];
    this.powerUps = [];
    this.powerUpModels = new Map();
    this.weaponPickups = [];
    this.weaponPickupModels = new Map();
    this.mapData = null;

    this.running = false;
    this.showScoreboard = false;
    this.lastFrame = 0;
    this.frame = 0;
    this.powerUpTimer = 0;
    this.mode = 'offline';
  }

  async init(mode = 'offline', roomId = null) {
    this.mode = mode;
    this.audio.init();

    // Generate map
    this.mapData = this.mapGen.generate();
    this.collisions.setWalls(this.mapData.walls);
    this.wallBuilder.buildWalls(this.mapData.walls);

    // Create local player
    const spawn = this.mapData.spawnPoints[0];
    this.localPlayer = new Player(spawn.x, spawn.y, this.playerName, 0);
    this.localPlayerModel = new PlayerModel(this.localPlayer.color, false);
    this.sceneManager.add(this.localPlayerModel.group);

    // Set up input
    this.setupInput();

    // Spawn initial items
    this.spawnInitialItems();

    // Wave manager
    this.waveManager.onWaveStart = (wave, count) => {
      this.hud.showWaveAnnouncement(wave);
      this.audio.playPickup();
    };
    this.waveManager.onEnemySpawn = (data) => {
      this.spawnSingleBot(data.x, data.y, data.difficulty);
    };

    if (mode === 'online') {
      await this.initNetwork(roomId);
    }

    this.waveManager.start();
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
    this.setupNetworkEvents();
  }

  setupNetworkEvents() {
    this.network.on('player-join-request', (data) => {
      const idx = this.remotePlayers.size + 1;
      const spawn = this.mapData.spawnPoints[idx % this.mapData.spawnPoints.length];
      const rp = new Player(spawn.x, spawn.y, data.name, idx);
      rp.id = data.id || data.peerId;
      this.remotePlayers.set(data.peerId, rp);

      const model = new PlayerModel(rp.color, false);
      this.sceneManager.add(model.group);
      this.remotePlayerModels.set(data.peerId, model);

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
        const model = this.remotePlayerModels.get(from);
        if (model) model.flash();
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
        const model = this.remotePlayerModels.get(peerId);
        if (model) {
          this.sceneManager.remove(model.group);
          model.dispose();
          this.remotePlayerModels.delete(peerId);
        }
        this.sync.removePlayer(peerId);
      }
    });

    this.network.on('latency-update', (lat) => this.emit('latency', lat));
  }

  setupInput() {
    this.input.on('action', (action, pressed) => {
      if (!pressed) {
        if (action === 'scoreboard') this.showScoreboard = false;
        return;
      }

      switch (action) {
        case 'dash':
          this.localPlayer.dash();
          if (this.localPlayer.isDashing) {
            this.audio.playDash();
            if (this.mode === 'online') this.network.broadcast(MSG.DASH, {});
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

    this.input.on('mousedown', () => {
      if (!this.localPlayer.dead) this.tryShoot();
    });
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
      this.bullets.push(new Bullet(bx, by, angle, weapon, player.id, player.color));
    }

    this.audio.playShoot(weapon.name);
    this.sceneManager.addShake(weapon.name === 'Sniper' ? 8 : weapon.name === 'Rocket' ? 10 : 3);
    this.localPlayerModel.flash();

    if (this.mode === 'online') {
      this.network.broadcast(MSG.SHOOT, {
        x: player.x, y: player.y,
        angle: player.angle,
        weapon: player.weapon,
      });
    }
  }

  spawnSingleBot(x, y, difficulty) {
    const bot = new Enemy(x, y, difficulty);
    this.bots.push(bot);

    const model = new PlayerModel(bot.color, true);
    this.sceneManager.add(model.group);
    this.botModels.set(bot.id, model);
  }

  spawnInitialItems() {
    const powerUpTypes = Object.keys(POWERUPS);
    this.mapData.powerUpSpots.forEach((spot, i) => {
      const type = powerUpTypes[i % powerUpTypes.length];
      this.addPowerUp(spot.x, spot.y, type);
    });

    const weaponTypes = Object.keys(WEAPONS).filter(w => w !== 'pistol');
    this.mapData.weaponSpots.forEach((spot, i) => {
      const type = weaponTypes[i % weaponTypes.length];
      this.addWeaponPickup(spot.x, spot.y, type);
    });
  }

  addPowerUp(x, y, type) {
    const pu = new PowerUp(x, y, type);
    this.powerUps.push(pu);
    const model = new PowerUpModel(type, x, y);
    this.sceneManager.add(model.group);
    this.powerUpModels.set(pu.id, model);
  }

  addWeaponPickup(x, y, type) {
    const wp = new WeaponPickup(x, y, type);
    this.weaponPickups.push(wp);
    const model = new WeaponPickupModel(type, x, y);
    this.sceneManager.add(model.group);
    this.weaponPickupModels.set(wp.id, model);
  }

  removePowerUp(pu) {
    const model = this.powerUpModels.get(pu.id);
    if (model) {
      this.sceneManager.remove(model.group);
      model.dispose();
      this.powerUpModels.delete(pu.id);
    }
  }

  removeWeaponPickup(wp) {
    const model = this.weaponPickupModels.get(wp.id);
    if (model) {
      this.sceneManager.remove(model.group);
      model.dispose();
      this.weaponPickupModels.delete(wp.id);
    }
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
    this.hud.destroy();
    this.bulletRenderer.dispose();
    this.particles.dispose();
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

    // Player input
    if (!player.dead) {
      player.inputState = this.input.getInputState();

      // Aim at mouse in world space
      const worldPos = this.sceneManager.getWorldPosition(this.input.mouseX, this.input.mouseY);
      player.angle = angleBetween(player.x, player.y, worldPos.x, worldPos.z);

      // Auto-fire for automatic weapons
      if (player.inputState.shooting) {
        const weapon = WEAPONS[player.weapon];
        if (weapon.automatic) this.tryShoot();
      }
    }

    // Update player
    player.update(dt, GAME.WIDTH, GAME.HEIGHT);
    this.collisions.processPlayerWallCollisions([player]);

    if (player.isDashing) {
      this.particles.emitDash(player.x, player.y, player.color);
    }

    // Respawn
    if (player.dead && Date.now() - player.respawnTimer > PLAYER.RESPAWN_TIME) {
      const sp = this.mapData.spawnPoints[randomInt(0, this.mapData.spawnPoints.length - 1)];
      player.respawn(sp.x, sp.y);
    }

    // Update player model
    this.localPlayerModel.update(player, dt);
    if (player.dead) this.localPlayerModel.setVisible(false);

    const allPlayers = [player, ...Array.from(this.remotePlayers.values())];

    // Update bots
    const aliveEnemies = this.bots.filter(b => !b.dead).length;
    this.waveManager.update(aliveEnemies, this.mapData.spawnPoints);

    this.bots.forEach(bot => {
      if (bot.dead) {
        const model = this.botModels.get(bot.id);
        if (model) model.setVisible(false);

        // Remove dead bots after some time
        if (Date.now() - bot.respawnTimer > 10000) {
          this.sceneManager.remove(model.group);
          model.dispose();
          this.botModels.delete(bot.id);
          bot._remove = true;
        }
        return;
      }

      bot.update(dt, allPlayers, GAME.WIDTH, GAME.HEIGHT);
      this.collisions.processPlayerWallCollisions([bot]);

      const fireResult = bot.fire();
      if (fireResult) {
        const bx = bot.x + Math.cos(fireResult.angle) * (bot.radius + 15);
        const by = bot.y + Math.sin(fireResult.angle) * (bot.radius + 15);
        this.bullets.push(new Bullet(bx, by, fireResult.angle, fireResult.weapon, bot.id, bot.color));
        this.audio.playShoot(fireResult.weapon.name);
        const model = this.botModels.get(bot.id);
        if (model) model.flash();
      }

      const model = this.botModels.get(bot.id);
      if (model) model.update(bot, dt);
    });

    // Clean up removed bots
    this.bots = this.bots.filter(b => !b._remove);

    // Update bullets
    this.bullets.forEach(b => b.update(dt));
    this.bullets = this.bullets.filter(b => b.active);

    // Bullet collisions
    this.collisions.processBulletCollisions(
      this.bullets, allPlayers, this.bots,
      {
        onWallHit: (bullet) => {
          this.particles.emitHit(bullet.x, bullet.y, '#888');
        },
        onPlayerHit: (bullet, target) => {
          const owner = this.getOwner(bullet.ownerId);
          const dmgMult = owner?.effects?.damage ? 1.5 : 1;

          if (bullet.explosive) {
            this.handleExplosion(bullet, dmgMult);
          } else {
            const killed = target.takeDamage(bullet.damage * dmgMult);
            this.particles.emitHit(bullet.x, bullet.y, target.color);
            this.audio.playHit();
            if (killed) this.handleKill(bullet.ownerId, target);
          }
        },
      }
    );

    // Powerup collisions
    const puToRemove = [];
    this.powerUps.forEach((pu, i) => {
      if (this.collisions.physics.checkPickupCollision(pu, player)) {
        puToRemove.push(i);
        player.addEffect(pu.type, pu.duration);
        this.audio.playPickup();
        this.hud.addAnnouncement(`+${pu.type.toUpperCase()}`, pu.color);
        this.removePowerUp(pu);
      }
    });
    for (let i = puToRemove.length - 1; i >= 0; i--) this.powerUps.splice(puToRemove[i], 1);

    // Weapon pickup collisions
    const wpToRemove = [];
    this.weaponPickups.forEach((wp, i) => {
      if (this.collisions.physics.checkPickupCollision(wp, player)) {
        wpToRemove.push(i);
        player.switchWeapon(wp.weaponType);
        this.audio.playPickup();
        this.hud.addAnnouncement(wp.config.name, wp.config.color);
        this.removeWeaponPickup(wp);
      }
    });
    for (let i = wpToRemove.length - 1; i >= 0; i--) this.weaponPickups.splice(wpToRemove[i], 1);

    // Respawn items
    this.powerUpTimer += dt;
    if (this.powerUpTimer > 600) {
      this.respawnItems();
      this.powerUpTimer = 0;
    }

    // Update 3D powerup & weapon models (rotation!)
    this.powerUpModels.forEach(model => model.update(dt));
    this.weaponPickupModels.forEach(model => model.update(dt));

    // Sync bullet meshes
    this.bulletRenderer.syncBullets(this.bullets);

    // Particles
    this.particles.update();

    // Camera follow
    this.sceneManager.followTarget(player.x, player.y, dt);

    // Remote players
    this.remotePlayers.forEach((rp, peerId) => {
      const state = this.sync.getInterpolatedState(peerId);
      if (state) {
        rp.x = state.x; rp.y = state.y;
        rp.angle = state.angle || 0;
        rp.hp = state.hp ?? rp.hp;
        rp.dead = state.dead ?? rp.dead;
        rp.weapon = state.weapon || rp.weapon;
      }
      const model = this.remotePlayerModels.get(peerId);
      if (model) {
        model.update(rp, dt);
        if (rp.dead) model.setVisible(false);
      }
    });

    // Send state over network
    if (this.mode === 'online' && this.frame % 3 === 0) {
      this.network.sendStateUpdate(player.serialize());
    }
  }

  handleExplosion(bullet, dmgMult) {
    this.particles.emitExplosion(bullet.x, bullet.y, '#FF4500');
    this.sceneManager.addShake(14);
    this.audio.playExplosion();

    const allTargets = [this.localPlayer, ...Array.from(this.remotePlayers.values()), ...this.bots];
    this.collisions.processExplosion(
      bullet.x, bullet.y, bullet.explosionRadius, bullet.damage * dmgMult,
      bullet.ownerId, allTargets,
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
      this.hud.addKill(killer.name, victim.name, WEAPONS[killer.weapon]?.name || '?');
    }

    this.particles.emitDeath(victim.x, victim.y, victim.color);
    if (victim === this.localPlayer) this.audio.playDeath();

    if (this.mode === 'online') {
      this.network.broadcast(MSG.KILL, {
        killer: killer?.name || '?',
        victim: victim.name,
        weapon: killer?.weapon || 'pistol',
      });
    }
  }

  getOwner(id) {
    if (this.localPlayer.id === id) return this.localPlayer;
    for (const [, rp] of this.remotePlayers) if (rp.id === id) return rp;
    for (const bot of this.bots) if (bot.id === id) return bot;
    return null;
  }

  respawnItems() {
    const powerUpTypes = Object.keys(POWERUPS);
    if (this.powerUps.length < 4) {
      const spot = this.mapData.powerUpSpots[randomInt(0, this.mapData.powerUpSpots.length - 1)];
      const type = powerUpTypes[randomInt(0, powerUpTypes.length - 1)];
      this.addPowerUp(spot.x, spot.y, type);
    }
    const weaponTypes = Object.keys(WEAPONS).filter(w => w !== 'pistol');
    if (this.weaponPickups.length < 4) {
      const spot = this.mapData.weaponSpots[randomInt(0, this.mapData.weaponSpots.length - 1)];
      const type = weaponTypes[randomInt(0, weaponTypes.length - 1)];
      this.addWeaponPickup(spot.x, spot.y, type);
    }
  }

  render() {
    // Render 3D scene
    this.sceneManager.render();

    // Render 2D HUD overlay
    const ctx = this.hud.ctx;
    const cw = this.hud.canvas.width;
    const ch = this.hud.canvas.height;

    const aliveEnemies = this.bots.filter(b => !b.dead).length;
    this.hud.render(
      this.localPlayer,
      this.waveManager.getWave(),
      aliveEnemies,
      this.waveManager.getTotalEnemies()
    );

    // Minimap
    this.hud.renderMinimap(
      ctx, this.localPlayer,
      [this.localPlayer, ...Array.from(this.remotePlayers.values())],
      this.bots,
      this.mapData.walls,
      cw, ch
    );

    // Scoreboard
    if (this.showScoreboard) {
      this.hud.renderScoreboard(
        ctx,
        [this.localPlayer, ...Array.from(this.remotePlayers.values())],
        this.bots, cw, ch
      );
    }
  }
}
