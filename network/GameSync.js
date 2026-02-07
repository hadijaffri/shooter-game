import { lerp, lerpAngle } from '../utils/MathUtils';

export class GameSync {
  constructor() {
    this.remoteStates = new Map();
    this.interpolationDelay = 100;
  }

  addState(peerId, state) {
    if (!this.remoteStates.has(peerId)) {
      this.remoteStates.set(peerId, []);
    }

    const buffer = this.remoteStates.get(peerId);
    buffer.push({ state, time: Date.now() });

    while (buffer.length > 30) {
      buffer.shift();
    }
  }

  getInterpolatedState(peerId) {
    const buffer = this.remoteStates.get(peerId);
    if (!buffer || buffer.length < 2) {
      return buffer?.[buffer?.length - 1]?.state || null;
    }

    const renderTime = Date.now() - this.interpolationDelay;
    let before = null;
    let after = null;

    for (let i = 0; i < buffer.length - 1; i++) {
      if (buffer[i].time <= renderTime && buffer[i + 1].time >= renderTime) {
        before = buffer[i];
        after = buffer[i + 1];
        break;
      }
    }

    if (!before || !after) {
      return buffer[buffer.length - 1].state;
    }

    const t = (renderTime - before.time) / (after.time - before.time);
    return this.interpolate(before.state, after.state, t);
  }

  interpolate(a, b, t) {
    return {
      ...b,
      x: lerp(a.x, b.x, t),
      y: lerp(a.y, b.y, t),
      angle: lerpAngle(a.angle || 0, b.angle || 0, t),
    };
  }

  removePlayer(peerId) {
    this.remoteStates.delete(peerId);
  }

  clear() {
    this.remoteStates.clear();
  }
}
