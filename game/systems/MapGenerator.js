import { GAME, COLORS } from '../../utils/Constants';
import { randomRange, randomInt } from '../../utils/MathUtils';

export class MapGenerator {
  constructor() {
    this.walls = [];
    this.spawnPoints = [];
    this.powerUpSpots = [];
    this.weaponSpots = [];
  }

  generate() {
    this.walls = [];
    this.spawnPoints = [];
    this.powerUpSpots = [];
    this.weaponSpots = [];

    this.addBorderWalls();
    this.addCenterStructure();
    this.addCornerStructures();
    this.addRandomWalls(12);
    this.generateSpawnPoints();
    this.generateItemSpots();

    return {
      walls: this.walls,
      spawnPoints: this.spawnPoints,
      powerUpSpots: this.powerUpSpots,
      weaponSpots: this.weaponSpots,
    };
  }

  addBorderWalls() {
    const t = 20;
    this.walls.push(
      { x: 0, y: 0, w: GAME.WIDTH, h: t },
      { x: 0, y: GAME.HEIGHT - t, w: GAME.WIDTH, h: t },
      { x: 0, y: 0, w: t, h: GAME.HEIGHT },
      { x: GAME.WIDTH - t, y: 0, w: t, h: GAME.HEIGHT }
    );
  }

  addCenterStructure() {
    const cx = GAME.WIDTH / 2;
    const cy = GAME.HEIGHT / 2;
    const size = 120;
    const gap = 60;

    this.walls.push(
      { x: cx - size, y: cy - size, w: size - gap / 2, h: 20 },
      { x: cx + gap / 2, y: cy - size, w: size - gap / 2, h: 20 },
      { x: cx - size, y: cy + size - 20, w: size - gap / 2, h: 20 },
      { x: cx + gap / 2, y: cy + size - 20, w: size - gap / 2, h: 20 },
      { x: cx - size, y: cy - size, w: 20, h: size - gap / 2 },
      { x: cx - size, y: cy + gap / 2, w: 20, h: size - gap / 2 },
      { x: cx + size - 20, y: cy - size, w: 20, h: size - gap / 2 },
      { x: cx + size - 20, y: cy + gap / 2, w: 20, h: size - gap / 2 }
    );
  }

  addCornerStructures() {
    const offset = 250;
    const positions = [
      [offset, offset],
      [GAME.WIDTH - offset, offset],
      [offset, GAME.HEIGHT - offset],
      [GAME.WIDTH - offset, GAME.HEIGHT - offset],
    ];

    positions.forEach(([cx, cy]) => {
      const w = randomRange(60, 120);
      const h = randomRange(60, 120);
      this.walls.push({ x: cx - w / 2, y: cy - h / 2, w, h });

      if (Math.random() > 0.5) {
        this.walls.push({
          x: cx - w / 2 - 50,
          y: cy - 10,
          w: 40,
          h: 20,
        });
      }
    });
  }

  addRandomWalls(count) {
    for (let i = 0; i < count; i++) {
      const x = randomRange(150, GAME.WIDTH - 150);
      const y = randomRange(150, GAME.HEIGHT - 150);
      const horizontal = Math.random() > 0.5;
      const w = horizontal ? randomRange(80, 200) : 20;
      const h = horizontal ? 20 : randomRange(80, 200);

      const cx = GAME.WIDTH / 2;
      const cy = GAME.HEIGHT / 2;
      if (Math.abs(x - cx) < 160 && Math.abs(y - cy) < 160) continue;

      this.walls.push({ x: x - w / 2, y: y - h / 2, w, h });
    }
  }

  generateSpawnPoints() {
    const margin = 100;
    const positions = [
      [margin, margin],
      [GAME.WIDTH - margin, margin],
      [margin, GAME.HEIGHT - margin],
      [GAME.WIDTH - margin, GAME.HEIGHT - margin],
      [GAME.WIDTH / 2, margin],
      [GAME.WIDTH / 2, GAME.HEIGHT - margin],
      [margin, GAME.HEIGHT / 2],
      [GAME.WIDTH - margin, GAME.HEIGHT / 2],
    ];
    this.spawnPoints = positions.map(([x, y]) => ({ x, y }));
  }

  generateItemSpots() {
    this.powerUpSpots = [
      { x: GAME.WIDTH / 2, y: GAME.HEIGHT / 2 },
      { x: GAME.WIDTH / 4, y: GAME.HEIGHT / 4 },
      { x: (GAME.WIDTH * 3) / 4, y: GAME.HEIGHT / 4 },
      { x: GAME.WIDTH / 4, y: (GAME.HEIGHT * 3) / 4 },
      { x: (GAME.WIDTH * 3) / 4, y: (GAME.HEIGHT * 3) / 4 },
      { x: GAME.WIDTH / 2, y: GAME.HEIGHT / 4 },
      { x: GAME.WIDTH / 2, y: (GAME.HEIGHT * 3) / 4 },
    ];

    this.weaponSpots = [
      { x: GAME.WIDTH / 3, y: GAME.HEIGHT / 3 },
      { x: (GAME.WIDTH * 2) / 3, y: GAME.HEIGHT / 3 },
      { x: GAME.WIDTH / 3, y: (GAME.HEIGHT * 2) / 3 },
      { x: (GAME.WIDTH * 2) / 3, y: (GAME.HEIGHT * 2) / 3 },
      { x: GAME.WIDTH / 2, y: GAME.HEIGHT / 6 },
      { x: GAME.WIDTH / 2, y: (GAME.HEIGHT * 5) / 6 },
    ];
  }

  renderBackground(ctx) {
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    const gridSize = 60;
    for (let x = 0; x <= GAME.WIDTH; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GAME.HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= GAME.HEIGHT; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GAME.WIDTH, y);
      ctx.stroke();
    }
  }

  renderWalls(ctx) {
    this.walls.forEach(wall => {
      ctx.fillStyle = COLORS.wall;
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);

      ctx.strokeStyle = '#5a5a8a';
      ctx.lineWidth = 2;
      ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
    });
  }
}
