import { WEAPONS, GAME } from '../../utils/Constants';

export class HUD {
  constructor(ctx) {
    this.ctx = ctx;
    this.killFeed = [];
    this.killFeedDuration = 4000;
    this.announcements = [];
    this.announcementDuration = 2000;
  }

  render(player, canvasWidth, canvasHeight) {
    if (!player) return;
    this.renderHealthBar(player, canvasWidth, canvasHeight);
    this.renderWeaponInfo(player, canvasWidth, canvasHeight);
    this.renderDashCooldown(player, canvasWidth, canvasHeight);
    this.renderKillFeed(canvasWidth);
    this.renderAnnouncements(canvasWidth, canvasHeight);
    this.renderEffects(player, canvasWidth, canvasHeight);
    this.renderStats(player);
  }

  renderHealthBar(player, cw, ch) {
    const ctx = this.ctx;
    const barW = 250;
    const barH = 20;
    const x = 20;
    const y = ch - 50;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(x - 2, y - 2, barW + 4, barH + 4);

    const hpRatio = player.hp / player.maxHp;
    const gradient = ctx.createLinearGradient(x, y, x + barW * hpRatio, y);
    if (hpRatio > 0.6) {
      gradient.addColorStop(0, '#4CAF50');
      gradient.addColorStop(1, '#66BB6A');
    } else if (hpRatio > 0.3) {
      gradient.addColorStop(0, '#FF9800');
      gradient.addColorStop(1, '#FFB74D');
    } else {
      gradient.addColorStop(0, '#F44336');
      gradient.addColorStop(1, '#EF5350');
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barW * hpRatio, barH);

    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barW, barH);

    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(player.hp)} / ${player.maxHp}`, x + barW / 2, y + 15);
  }

  renderWeaponInfo(player, cw, ch) {
    const ctx = this.ctx;
    const weapon = WEAPONS[player.weapon];
    const x = cw - 200;
    const y = ch - 60;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(x - 10, y - 5, 190, 55);

    ctx.fillStyle = weapon.color;
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(weapon.name, x, y + 15);

    ctx.fillStyle = '#FFF';
    ctx.font = '14px monospace';
    ctx.fillText(`Ammo: ${player.getAmmoDisplay()}`, x, y + 35);

    if (player.reloading) {
      const elapsed = Date.now() - player.reloadStartTime;
      const progress = elapsed / weapon.reloadTime;
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(x, y + 40, 170, 4);
      ctx.fillStyle = '#FFC107';
      ctx.fillRect(x, y + 40, 170 * progress, 4);
    }
  }

  renderDashCooldown(player, cw, ch) {
    const ctx = this.ctx;
    const x = 280;
    const y = ch - 50;
    const elapsed = Date.now() - player.lastDashTime;
    const cooldown = 2000;
    const ready = elapsed >= cooldown;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(x, y - 2, 60, 24);

    ctx.font = '12px monospace';
    ctx.textAlign = 'center';

    if (ready) {
      ctx.fillStyle = '#4ECDC4';
      ctx.fillText('DASH', x + 30, y + 14);
    } else {
      const ratio = elapsed / cooldown;
      ctx.fillStyle = '#444';
      ctx.fillRect(x + 2, y, 56 * ratio, 20);
      ctx.fillStyle = '#888';
      ctx.fillText('DASH', x + 30, y + 14);
    }
  }

  renderStats(player) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(15, 15, 150, 60);

    ctx.fillStyle = '#FFF';
    ctx.font = '13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Kills: ${player.kills}`, 25, 35);
    ctx.fillText(`Deaths: ${player.deaths}`, 25, 52);
    ctx.fillText(`Score: ${player.score}`, 25, 69);
  }

  renderEffects(player, cw, ch) {
    const ctx = this.ctx;
    let offsetX = 20;
    const y = ch - 80;

    Object.entries(player.effects || {}).forEach(([type, effect]) => {
      const remaining = effect.endTime - Date.now();
      if (remaining <= 0) return;

      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(offsetX, y, 70, 20);

      ctx.fillStyle = type === 'speed' ? '#00BFFF' : type === 'shield' ? '#FFD700' : '#FF4444';
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${type} ${(remaining / 1000).toFixed(1)}s`, offsetX + 5, y + 14);

      offsetX += 80;
    });
  }

  addKill(killer, victim, weapon) {
    this.killFeed.unshift({
      killer,
      victim,
      weapon,
      time: Date.now(),
    });
    if (this.killFeed.length > 5) this.killFeed.pop();
  }

  addAnnouncement(text, color = '#FFF') {
    this.announcements.push({
      text,
      color,
      time: Date.now(),
    });
  }

  renderKillFeed(cw) {
    const ctx = this.ctx;
    const now = Date.now();
    this.killFeed = this.killFeed.filter(k => now - k.time < this.killFeedDuration);

    this.killFeed.forEach((kill, i) => {
      const alpha = 1 - (now - kill.time) / this.killFeedDuration;
      const y = 90 + i * 22;
      const x = cw - 20;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      const text = `${kill.killer} [${kill.weapon}] ${kill.victim}`;
      const metrics = ctx.measureText(text);
      ctx.fillRect(x - metrics.width - 20, y - 12, metrics.width + 20, 20);

      ctx.font = '12px monospace';
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFF';
      ctx.fillText(text, x - 5, y + 2);
    });
    ctx.globalAlpha = 1;
  }

  renderAnnouncements(cw, ch) {
    const ctx = this.ctx;
    const now = Date.now();
    this.announcements = this.announcements.filter(a => now - a.time < this.announcementDuration);

    this.announcements.forEach(ann => {
      const alpha = 1 - (now - ann.time) / this.announcementDuration;
      const progress = (now - ann.time) / this.announcementDuration;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = ann.color;
      ctx.font = `bold ${24 - progress * 4}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(ann.text, cw / 2, ch / 3 - progress * 30);
    });
    ctx.globalAlpha = 1;
  }

  renderMinimap(camera, player, players, bots, walls, cw, ch) {
    const ctx = this.ctx;
    const size = 160;
    const x = cw - size - 15;
    const y = 15;
    const scale = size / GAME.WIDTH;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, size, size);

    ctx.fillStyle = 'rgba(74,74,106,0.6)';
    walls.forEach(wall => {
      ctx.fillRect(
        x + wall.x * scale,
        y + wall.y * scale,
        wall.w * scale,
        wall.h * scale
      );
    });

    const allPlayers = [...players, ...bots];
    allPlayers.forEach(p => {
      if (p.dead) return;
      ctx.fillStyle = p.id === player.id ? '#FFF' : (p.isBot ? '#FF4444' : p.color);
      ctx.beginPath();
      ctx.arc(x + p.x * scale, y + p.y * scale, p.id === player.id ? 3 : 2, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      x + camera.x * scale,
      y + camera.y * scale,
      camera.width * scale,
      camera.height * scale
    );
  }

  renderScoreboard(players, bots, cw, ch) {
    const ctx = this.ctx;
    const all = [...players, ...bots].sort((a, b) => b.score - a.score);

    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(cw / 2 - 200, 80, 400, 40 + all.length * 30);

    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SCOREBOARD', cw / 2, 108);

    ctx.font = '12px monospace';
    ctx.fillStyle = '#888';
    ctx.textAlign = 'left';
    ctx.fillText('NAME', cw / 2 - 170, 130);
    ctx.textAlign = 'center';
    ctx.fillText('K', cw / 2 + 40, 130);
    ctx.fillText('D', cw / 2 + 90, 130);
    ctx.fillText('PTS', cw / 2 + 150, 130);

    all.forEach((p, i) => {
      const y = 152 + i * 28;
      ctx.fillStyle = p.dead ? '#666' : '#FFF';
      ctx.font = '14px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(p.name + (p.isBot ? ' [BOT]' : ''), cw / 2 - 170, y);
      ctx.textAlign = 'center';
      ctx.fillText(p.kills, cw / 2 + 40, y);
      ctx.fillText(p.deaths, cw / 2 + 90, y);
      ctx.fillStyle = '#FFD700';
      ctx.fillText(p.score, cw / 2 + 150, y);
    });
  }

  renderDeathScreen(cw, ch, respawnTime) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(139,0,0,0.4)';
    ctx.fillRect(0, 0, cw, ch);

    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('YOU DIED', cw / 2, ch / 2 - 20);

    const remaining = Math.max(0, (respawnTime - Date.now()) / 1000).toFixed(1);
    ctx.font = '18px monospace';
    ctx.fillText(`Respawning in ${remaining}s`, cw / 2, ch / 2 + 20);
  }
}
