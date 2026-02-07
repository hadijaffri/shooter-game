export const GAME = {
  WIDTH: 2400,
  HEIGHT: 2400,
  TICK_RATE: 60,
  INTERPOLATION_DELAY: 100,
};

export const PLAYER = {
  RADIUS: 20,
  SPEED: 4,
  MAX_HP: 100,
  RESPAWN_TIME: 3000,
  DASH_SPEED: 12,
  DASH_DURATION: 150,
  DASH_COOLDOWN: 2000,
  INVINCIBILITY_AFTER_SPAWN: 2000,
};

export const WEAPONS = {
  pistol: {
    name: 'Pistol',
    damage: 20,
    fireRate: 400,
    bulletSpeed: 10,
    bulletSize: 4,
    spread: 0.05,
    ammo: Infinity,
    reloadTime: 0,
    color: '#FFD700',
    automatic: false,
  },
  shotgun: {
    name: 'Shotgun',
    damage: 12,
    fireRate: 800,
    bulletSpeed: 9,
    bulletSize: 3,
    spread: 0.15,
    pellets: 6,
    ammo: 8,
    maxAmmo: 8,
    reloadTime: 1500,
    color: '#FF6347',
    automatic: false,
  },
  smg: {
    name: 'SMG',
    damage: 10,
    fireRate: 100,
    bulletSpeed: 11,
    bulletSize: 3,
    spread: 0.1,
    ammo: 30,
    maxAmmo: 30,
    reloadTime: 1800,
    color: '#00CED1',
    automatic: true,
  },
  sniper: {
    name: 'Sniper',
    damage: 80,
    fireRate: 1200,
    bulletSpeed: 18,
    bulletSize: 3,
    spread: 0.01,
    ammo: 5,
    maxAmmo: 5,
    reloadTime: 2500,
    color: '#9370DB',
    automatic: false,
  },
  rocketLauncher: {
    name: 'Rocket',
    damage: 60,
    fireRate: 1500,
    bulletSpeed: 6,
    bulletSize: 8,
    spread: 0.02,
    ammo: 3,
    maxAmmo: 3,
    reloadTime: 3000,
    color: '#FF4500',
    explosive: true,
    explosionRadius: 80,
    automatic: false,
  },
};

export const POWERUPS = {
  health: { color: '#00FF00', duration: 0, symbol: '+' },
  speed: { color: '#00BFFF', duration: 8000, symbol: 'S' },
  shield: { color: '#FFD700', duration: 10000, symbol: 'O' },
  damage: { color: '#FF4444', duration: 8000, symbol: 'D' },
};

export const COLORS = {
  players: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'],
  background: '#1a1a2e',
  grid: '#16213e',
  wall: '#4a4a6a',
  minimap: 'rgba(0,0,0,0.6)',
};

export const NETWORK = {
  SYNC_RATE: 20,
  MAX_PLAYERS: 8,
  ROOM_CODE_LENGTH: 6,
};
