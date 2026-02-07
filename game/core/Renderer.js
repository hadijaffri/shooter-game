import { WEAPONS } from '../../utils/Constants';

export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  renderPlayer(player) {
    const ctx = this.ctx;
    if (player.dead) return;

    if (player.isInvincible) {
      ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
    }

    if (player.effects?.shield) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (player.isDashing) {
      ctx.shadowColor = player.color;
      ctx.shadowBlur = 20;
    }

    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const gunLen = player.radius + 15;
    const gunWidth = 4;
    ctx.strokeStyle = '#DDD';
    ctx.lineWidth = gunWidth;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(
      player.x + Math.cos(player.angle) * gunLen,
      player.y + Math.sin(player.angle) * gunLen
    );
    ctx.stroke();

    const weaponConfig = WEAPONS[player.weapon];
    if (weaponConfig) {
      ctx.fillStyle = weaponConfig.color;
      ctx.beginPath();
      ctx.arc(
        player.x + Math.cos(player.angle) * gunLen,
        player.y + Math.sin(player.angle) * gunLen,
        3, 0, Math.PI * 2
      );
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    this.renderPlayerHP(player);
    this.renderPlayerName(player);

    if (player.effects?.speed) {
      ctx.strokeStyle = '#00BFFF';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (player.effects?.damage) {
      ctx.fillStyle = 'rgba(255,68,68,0.3)';
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius + 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderPlayerHP(player) {
    const ctx = this.ctx;
    const barW = 40;
    const barH = 5;
    const x = player.x - barW / 2;
    const y = player.y - player.radius - 15;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x, y, barW, barH);

    const hpRatio = player.hp / player.maxHp;
    const hpColor = hpRatio > 0.6 ? '#4CAF50' : hpRatio > 0.3 ? '#FF9800' : '#F44336';
    ctx.fillStyle = hpColor;
    ctx.fillRect(x, y, barW * hpRatio, barH);

    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barW, barH);
  }

  renderPlayerName(player) {
    const ctx = this.ctx;
    ctx.fillStyle = '#FFF';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(player.name, player.x, player.y - player.radius - 20);
  }

  renderBullet(bullet) {
    const ctx = this.ctx;

    bullet.trail.forEach((pos, i) => {
      const alpha = i / bullet.trail.length * 0.4;
      ctx.fillStyle = bullet.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, bullet.radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    ctx.fillStyle = bullet.color;
    ctx.shadowColor = bullet.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  renderPowerUp(powerup) {
    const ctx = this.ctx;
    const y = powerup.getVisualY();
    const scale = powerup.getPulseScale();
    const r = powerup.radius * scale;

    ctx.fillStyle = powerup.color;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(powerup.x, y, r + 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = powerup.color;
    ctx.beginPath();
    ctx.arc(powerup.x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(powerup.symbol, powerup.x, y);
  }

  renderWeaponPickup(wp) {
    const ctx = this.ctx;
    const y = wp.getVisualY();

    ctx.fillStyle = wp.config.color;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(wp.x, y, wp.radius + 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.strokeStyle = wp.config.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(wp.x, y, wp.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#FFF';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(wp.config.name, wp.x, y);
  }

  renderCrosshair(x, y) {
    const ctx = this.ctx;
    const size = 15;
    const gap = 5;

    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.lineTo(x - gap, y);
    ctx.moveTo(x + gap, y);
    ctx.lineTo(x + size, y);
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y - gap);
    ctx.moveTo(x, y + gap);
    ctx.lineTo(x, y + size);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}
