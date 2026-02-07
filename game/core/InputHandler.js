import { EventEmitter } from '../../utils/EventEmitter';

export class InputHandler extends EventEmitter {
  constructor(canvas) {
    super();
    this.canvas = canvas;
    this.keys = {};
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseDown = false;
    this.locked = false;

    this.keyMap = {
      'KeyW': 'up', 'ArrowUp': 'up',
      'KeyS': 'down', 'ArrowDown': 'down',
      'KeyA': 'left', 'ArrowLeft': 'left',
      'KeyD': 'right', 'ArrowRight': 'right',
      'Space': 'dash',
      'KeyR': 'reload',
      'Digit1': 'weapon1',
      'Digit2': 'weapon2',
      'Digit3': 'weapon3',
      'Digit4': 'weapon4',
      'Digit5': 'weapon5',
      'Tab': 'scoreboard',
      'Enter': 'chat',
      'Escape': 'menu',
    };

    this.bindEvents();
  }

  bindEvents() {
    this._onKeyDown = (e) => {
      if (this.locked) return;
      const action = this.keyMap[e.code];
      if (action) {
        e.preventDefault();
        if (!this.keys[action]) {
          this.keys[action] = true;
          this.emit('action', action, true);
        }
      }
    };

    this._onKeyUp = (e) => {
      const action = this.keyMap[e.code];
      if (action) {
        this.keys[action] = false;
        this.emit('action', action, false);
      }
    };

    this._onMouseMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
      this.emit('mousemove', this.mouseX, this.mouseY);
    };

    this._onMouseDown = (e) => {
      if (e.button === 0) {
        this.mouseDown = true;
        this.emit('mousedown');
      }
    };

    this._onMouseUp = (e) => {
      if (e.button === 0) {
        this.mouseDown = false;
        this.emit('mouseup');
      }
    };

    this._onContextMenu = (e) => e.preventDefault();

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    this.canvas.addEventListener('mousemove', this._onMouseMove);
    this.canvas.addEventListener('mousedown', this._onMouseDown);
    this.canvas.addEventListener('mouseup', this._onMouseUp);
    this.canvas.addEventListener('contextmenu', this._onContextMenu);
  }

  getInputState() {
    return {
      up: !!this.keys.up,
      down: !!this.keys.down,
      left: !!this.keys.left,
      right: !!this.keys.right,
      shooting: this.mouseDown,
    };
  }

  lock() { this.locked = true; }
  unlock() { this.locked = false; }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    this.canvas.removeEventListener('mousemove', this._onMouseMove);
    this.canvas.removeEventListener('mousedown', this._onMouseDown);
    this.canvas.removeEventListener('mouseup', this._onMouseUp);
    this.canvas.removeEventListener('contextmenu', this._onContextMenu);
    this.removeAll();
  }
}
