export const MSG = {
  JOIN: 'join',
  LEAVE: 'leave',
  STATE_UPDATE: 'state',
  PLAYER_INPUT: 'input',
  SHOOT: 'shoot',
  HIT: 'hit',
  KILL: 'kill',
  RESPAWN: 'respawn',
  CHAT: 'chat',
  PICKUP: 'pickup',
  DASH: 'dash',
  WEAPON_SWITCH: 'weapon',
  RELOAD: 'reload',
  PING: 'ping',
  PONG: 'pong',
  GAME_STATE: 'gameState',
  HOST_SYNC: 'hostSync',
};

export function createMessage(type, data) {
  return JSON.stringify({ t: type, d: data, ts: Date.now() });
}

export function parseMessage(raw) {
  try {
    const msg = JSON.parse(raw);
    return { type: msg.t, data: msg.d, timestamp: msg.ts };
  } catch {
    return null;
  }
}
