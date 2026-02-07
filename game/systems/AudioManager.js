export class AudioManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.3;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch (e) {
      this.enabled = false;
    }
  }

  playTone(frequency, duration, type = 'square', vol = 1) {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

    gain.gain.setValueAtTime(this.volume * vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playNoise(duration, vol = 0.5) {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.volume * vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    source.connect(gain);
    gain.connect(this.ctx.destination);
    source.start();
  }

  playShoot(weaponName) {
    switch (weaponName) {
      case 'Pistol':
        this.playTone(400, 0.1, 'square', 0.4);
        this.playNoise(0.05, 0.3);
        break;
      case 'Shotgun':
        this.playNoise(0.15, 0.7);
        this.playTone(200, 0.15, 'sawtooth', 0.3);
        break;
      case 'SMG':
        this.playTone(500, 0.05, 'square', 0.3);
        this.playNoise(0.03, 0.2);
        break;
      case 'Sniper':
        this.playTone(800, 0.15, 'sine', 0.5);
        this.playNoise(0.1, 0.4);
        break;
      case 'Rocket':
        this.playTone(150, 0.3, 'sawtooth', 0.5);
        this.playNoise(0.2, 0.4);
        break;
      default:
        this.playTone(440, 0.1, 'square', 0.3);
    }
  }

  playExplosion() {
    this.playNoise(0.4, 0.8);
    this.playTone(80, 0.3, 'sawtooth', 0.5);
    this.playTone(60, 0.4, 'sine', 0.4);
  }

  playHit() {
    this.playTone(300, 0.08, 'square', 0.3);
  }

  playKill() {
    this.playTone(600, 0.1, 'sine', 0.4);
    setTimeout(() => this.playTone(800, 0.15, 'sine', 0.4), 100);
  }

  playDeath() {
    this.playTone(200, 0.3, 'sawtooth', 0.4);
    this.playTone(100, 0.4, 'sine', 0.3);
  }

  playPickup() {
    this.playTone(523, 0.08, 'sine', 0.3);
    setTimeout(() => this.playTone(659, 0.08, 'sine', 0.3), 80);
    setTimeout(() => this.playTone(784, 0.12, 'sine', 0.3), 160);
  }

  playDash() {
    this.playTone(200, 0.1, 'sine', 0.2);
    this.playTone(400, 0.1, 'sine', 0.15);
  }

  playReload() {
    this.playTone(300, 0.05, 'square', 0.2);
    setTimeout(() => this.playTone(500, 0.05, 'square', 0.2), 150);
  }

  toggleSound() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }
}
