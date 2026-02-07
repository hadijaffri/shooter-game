import { lerp, clamp } from '../../utils/MathUtils';
import { GAME } from '../../utils/Constants';

export class Camera {
  constructor(canvasWidth, canvasHeight) {
    this.x = 0;
    this.y = 0;
    this.width = canvasWidth;
    this.height = canvasHeight;
    this.smoothing = 0.08;
    this.shake = 0;
    this.shakeDecay = 0.9;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  follow(target) {
    const targetX = target.x - this.width / 2;
    const targetY = target.y - this.height / 2;

    this.x = lerp(this.x, targetX, this.smoothing);
    this.y = lerp(this.y, targetY, this.smoothing);

    this.x = clamp(this.x, 0, GAME.WIDTH - this.width);
    this.y = clamp(this.y, 0, GAME.HEIGHT - this.height);

    if (this.shake > 0.5) {
      this.shakeOffsetX = (Math.random() - 0.5) * this.shake;
      this.shakeOffsetY = (Math.random() - 0.5) * this.shake;
      this.shake *= this.shakeDecay;
    } else {
      this.shake = 0;
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }
  }

  addShake(intensity) {
    this.shake = Math.min(this.shake + intensity, 20);
  }

  apply(ctx) {
    ctx.translate(
      -this.x + this.shakeOffsetX,
      -this.y + this.shakeOffsetY
    );
  }

  restore(ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
  }

  screenToWorld(sx, sy) {
    return {
      x: sx + this.x - this.shakeOffsetX,
      y: sy + this.y - this.shakeOffsetY,
    };
  }

  worldToScreen(wx, wy) {
    return {
      x: wx - this.x + this.shakeOffsetX,
      y: wy - this.y + this.shakeOffsetY,
    };
  }

  isVisible(x, y, margin = 100) {
    return (
      x > this.x - margin &&
      x < this.x + this.width + margin &&
      y > this.y - margin &&
      y < this.y + this.height + margin
    );
  }
}
