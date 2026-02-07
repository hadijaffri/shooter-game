import { Enemy } from '../../entities/Enemy';
import { randomInt, randomRange } from '../../utils/MathUtils';
import { GAME } from '../../utils/Constants';

export class WaveManager {
  constructor() {
    this.wave = 0;
    this.enemiesPerWave = 5;
    this.waveGrowth = 3;
    this.maxDifficulty = 5;
    this.spawnDelay = 800;
    this.waveCooldown = 5000;
    this.lastWaveEndTime = 0;
    this.spawning = false;
    this.spawnQueue = [];
    this.lastSpawnTime = 0;
    this.totalEnemiesThisWave = 0;
    this.onWaveStart = null;
    this.onEnemySpawn = null;
    this.started = false;
  }

  start() {
    this.started = true;
    this.wave = 0;
    this.lastWaveEndTime = Date.now() - this.waveCooldown;
  }

  update(aliveEnemies, spawnPoints) {
    if (!this.started) return;

    // If all enemies dead and no more in queue, start next wave after cooldown
    if (aliveEnemies === 0 && this.spawnQueue.length === 0 && !this.spawning) {
      if (Date.now() - this.lastWaveEndTime >= this.waveCooldown) {
        this.startNextWave(spawnPoints);
      }
    }

    // Process spawn queue
    if (this.spawnQueue.length > 0 && Date.now() - this.lastSpawnTime >= this.spawnDelay) {
      const enemyData = this.spawnQueue.shift();
      this.lastSpawnTime = Date.now();
      if (this.onEnemySpawn) this.onEnemySpawn(enemyData);

      if (this.spawnQueue.length === 0) {
        this.spawning = false;
      }
    }
  }

  startNextWave(spawnPoints) {
    this.wave++;
    this.spawning = true;

    const count = this.enemiesPerWave + (this.wave - 1) * this.waveGrowth;
    const baseDifficulty = Math.min(1 + Math.floor(this.wave / 3), this.maxDifficulty);

    this.totalEnemiesThisWave = count;
    this.spawnQueue = [];

    for (let i = 0; i < count; i++) {
      const sp = spawnPoints[randomInt(0, spawnPoints.length - 1)];
      const difficulty = baseDifficulty + randomInt(0, Math.min(2, Math.floor(this.wave / 4)));
      const offsetX = randomRange(-50, 50);
      const offsetZ = randomRange(-50, 50);

      this.spawnQueue.push({
        x: Math.max(50, Math.min(GAME.WIDTH - 50, sp.x + offsetX)),
        y: Math.max(50, Math.min(GAME.HEIGHT - 50, sp.y + offsetZ)),
        difficulty: Math.min(difficulty, this.maxDifficulty),
      });
    }

    // Reduce spawn delay in later waves
    this.spawnDelay = Math.max(200, 800 - this.wave * 30);
    // Reduce cooldown between waves
    this.waveCooldown = Math.max(2000, 5000 - this.wave * 200);

    if (this.onWaveStart) this.onWaveStart(this.wave, count);
  }

  getWave() { return this.wave; }
  getTotalEnemies() { return this.totalEnemiesThisWave; }
}
