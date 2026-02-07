import { WEAPONS, GAME } from '../../utils/Constants';

export class HUD3D {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'hud-canvas';
    this.canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;';
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this.killFeed = [];
    this.killFeedDuration = 4000;
    this.announcements = [];
    this.announcementDuration = 2000;
    this.waveAnnouncement = null;

    this.resize();
    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  render(player, wave, enemiesAlive, totalEnemies) {
    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    ctx.clearRect(0, 0, cw, ch);

    if (!player) return;

    this.renderHealthBar(ctx, player, cw, ch);
    this.renderWeaponInfo(ctx, player, cw, ch);
    this.renderDashCooldown(ctx, player, cw, ch);
    this.renderStats(ctx, player);
    this.renderWaveInfo(ctx, wave, enemiesAlive, totalEnemies, cw);
    this.renderKillFeed(ctx, cw);
    this.renderAnnouncements(ctx, cw, ch);
    this.renderEffects(ctx, player, cw, ch);
    this.renderCrosshair(ctx, cw, ch);

    if (player.dead) {
      this.renderDeathScreen(ctx, player, cw, ch);
    }
  }

  renderHealthBar(ctx, player, cw, ch) {
    const barW = 250;
    const barH = 22;
    const x = 20;
    const y = ch - 55;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(x - 2, y - 2, barW + 4, barH + 4);

    const hpRatio = player.hp / player.maxHp;
    const hpColor = hpRatio > 0.6 ? '#4CAF50' : hpRatio > 0.3 ? '#FF9800' : '#F44336';
    ctx.fillStyle = hpColor;
    ctx.fillRect(x, y, barW * hpRatio, barH);

    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barW, barH);

    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(player.hp)} / ${player.maxHp}`, x + barW / 2, y + 16);
  }

  renderWeaponInfo(ctx, player, cw, ch) {
    const weapon = WEAPONS[player.weapon];
    const x = cw - 200;
    const y = ch - 65;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(x - 10, y - 5, 195, 60);

    ctx.fillStyle = weapon.color;
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(weapon.name, x, y + 18);

    ctx.fillStyle = '#FFF';
    ctx.font = '14px monospace';
    ctx.fillText(`Ammo: ${player.getAmmoDisplay()}`, x, y + 38);

    if (player.reloading) {
      const elapsed = Date.now() - player.reloadStartTime;
      const progress = Math.min(elapsed / weapon.reloadTime, 1);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(x, y + 45, 170, 4);
      ctx.fillStyle = '#FFC107';
      ctx.fillRect(x, y + 45, 170 * progress, 4);
    }
  }

  renderDashCooldown(ctx, player, cw, ch) {
    const x = 285;
    const y = ch - 55;
    const elapsed = Date.now() - player.lastDashTime;
    const ready = elapsed >= 2000;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(x, y, 65, 24);

    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = ready ? '#4ECDC4' : '#555';
    ctx.fillText('DASH', x + 32, y + 16);

    if (!ready) {
      const ratio = elapsed / 2000;
      ctx.fillStyle = 'rgba(78,205,196,0.3)';
      ctx.fillRect(x + 2, y + 2, 61 * ratio, 20);
    }
  }

  renderStats(ctx, player) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(15, 15, 155, 65);

    ctx.fillStyle = '#FFF';
    ctx.font = '13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Kills: ${player.kills}`, 25, 35);
    ctx.fillText(`Deaths: ${player.deaths}`, 25, 52);
    ctx.fillText(`Score: ${player.score}`, 25, 69);
  }

  renderWaveInfo(ctx, wave, alive, total, cw) {
    const x = cw / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x - 100, 12, 200, 28);

    ctx.fillStyle = '#FF6B6B';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`WAVE ${wave}  |  Enemies: ${alive}/${total}`, x, 30);
  }

  renderEffects(ctx, player, cw, ch) {
    let offsetX = 20;
    const y = ch - 85;

    Object.entries(player.effects || {}).forEach(([type, effect]) => {
      const remaining = effect.endTime - Date.now();
      if (remaining <= 0) return;

      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(offsetX, y, 75, 22);

      ctx.fillStyle = type === 'speed' ? '#00BFFF' : type === 'shield' ? '#FFD700' : '#FF4444';
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${type} ${(remaining / 1000).toFixed(1)}s`, offsetX + 5, y + 15);
      offsetX += 85;
    });
  }

  renderCrosshair(ctx, cw, ch) {
    const x = cw / 2;
    const y = ch / 2;
    const size = 18;
    const gap = 6;

    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - size, y); ctx.lineTo(x - gap, y);
    ctx.moveTo(x + gap, y); ctx.lineTo(x + size, y);
    ctx.moveTo(x, y - size); ctx.lineTo(x, y - gap);
    ctx.moveTo(x, y + gap); ctx.lineTo(x, y + size);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  addKill(killer, victim, weapon) {
    this.killFeed.unshift({ killer, victim, weapon, time: Date.now() });
    if (this.killFeed.length > 5) this.killFeed.pop();
  }

  addAnnouncement(text, color = '#FFF') {
    this.announcements.push({ text, color, time: Date.now() });
  }

  showWaveAnnouncement(wave) {
    this.waveAnnouncement = { wave, time: Date.now() };
    this.addAnnouncement(`WAVE ${wave}`, '#FF6B6B');
  }

  renderKillFeed(ctx, cw) {
    const now = Date.now();
    this.killFeed = this.killFeed.filter(k => now - k.time < this.killFeedDuration);

    this.killFeed.forEach((kill, i) => {
      const alpha = 1 - (now - kill.time) / this.killFeedDuration;
      const y = 55 + i * 24;

      ctx.globalAlpha = alpha;
      const text = `${kill.killer} [${kill.weapon}] ${kill.victim}`;
      ctx.font = '12px monospace';
      const w = ctx.measureText(text).width;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(cw - w - 30, y - 12, w + 20, 22);
      ctx.fillStyle = '#FFF';
      ctx.textAlign = 'right';
      ctx.fillText(text, cw - 20, y + 3);
    });
    ctx.globalAlpha = 1;
  }

  renderAnnouncements(ctx, cw, ch) {
    const now = Date.now();
    this.announcements = this.announcements.filter(a => now - a.time < this.announcementDuration);

    this.announcements.forEach(ann => {
      const alpha = 1 - (now - ann.time) / this.announcementDuration;
      const progress = (now - ann.time) / this.announcementDuration;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ann.color;
      ctx.font = `bold ${28 - progress * 6}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(ann.text, cw / 2, ch / 3 - progress * 40);
    });
    ctx.globalAlpha = 1;
  }

  renderDeathScreen(ctx, player, cw, ch) {
    ctx.fillStyle = 'rgba(139,0,0,0.35)';
    ctx.fillRect(0, 0, cw, ch);

    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 42px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('YOU DIED', cw / 2, ch / 2 - 20);

    const remaining = Math.max(0, (player.respawnTimer + 3000 - Date.now()) / 1000).toFixed(1);
    ctx.font = '20px monospace';
    ctx.fillText(`Respawning in ${remaining}s`, cw / 2, ch / 2 + 25);
  }

  renderScoreboard(ctx, players, bots, cw, ch) {
    const all = [...players, ...bots].sort((a, b) => b.score - a.score);

    ctx.fillStyle = 'rgba(0,0,0,0.88)';
    ctx.fillRect(cw / 2 - 220, 75, 440, 50 + all.length * 32);

    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SCOREBOARD', cw / 2, 105);

    ctx.font = '12px monospace';
    ctx.fillStyle = '#777';
    ctx.textAlign = 'left';
    ctx.fillText('NAME', cw / 2 - 180, 128);
    ctx.textAlign = 'center';
    ctx.fillText('K', cw / 2 + 50, 128);
    ctx.fillText('D', cw / 2 + 100, 128);
    ctx.fillText('PTS', cw / 2 + 165, 128);

    all.forEach((p, i) => {
      const y = 155 + i * 30;
      ctx.fillStyle = p.dead ? '#555' : '#FFF';
      ctx.font = '14px monospace';
      ctx.textAlign = 'left';
      ctx.fillText((p.name || 'Unknown') + (p.isBot ? ' [BOT]' : ''), cw / 2 - 180, y);
      ctx.textAlign = 'center';
      ctx.fillText(String(p.kills || 0), cw / 2 + 50, y);
      ctx.fillText(String(p.deaths || 0), cw / 2 + 100, y);
      ctx.fillStyle = '#FFD700';
      ctx.fillText(String(p.score || 0), cw / 2 + 165, y);
    });
  }

  renderMinimap(ctx, player, players, bots, walls, cw, ch) {
    const size = 160;
    const x = cw - size - 15;
    const y = ch - size - 65;
    const scale = size / GAME.WIDTH;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, size, size);

    ctx.fillStyle = 'rgba(74,74,106,0.6)';
    walls.forEach(wall => {
      ctx.fillRect(x + wall.x * scale, y + wall.y * scale, wall.w * scale, wall.h * scale);
    });

    const allP = [...players, ...bots];
    allP.forEach(p => {
      if (p.dead) return;
      ctx.fillStyle = p.id === player.id ? '#FFF' : (p.isBot ? '#FF4444' : p.color);
      ctx.beginPath();
      ctx.arc(x + p.x * scale, y + p.y * scale, p.id === player.id ? 3 : 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  destroy() {
    window.removeEventListener('resize', this._onResize);
    this.canvas.remove();
  }
}
