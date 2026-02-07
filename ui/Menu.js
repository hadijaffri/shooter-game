export class Menu {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.onStart = null;
    this.onJoin = null;
    this.onCreate = null;
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'menu-overlay';
    this.element.innerHTML = `
      <div class="menu-container">
        <h1 class="menu-title">
          <span class="title-glow">NEON</span>
          <span class="title-accent">ARENA</span>
        </h1>
        <p class="menu-subtitle">Multiplayer Top-Down Shooter</p>

        <div class="menu-section">
          <input type="text" id="playerName" class="menu-input" placeholder="Enter your name" maxlength="15" value="Player" />
        </div>

        <div class="menu-buttons">
          <button id="btnOffline" class="menu-btn btn-primary">
            <span class="btn-icon">⚔</span>
            Play Offline (vs Bots)
          </button>

          <button id="btnCreate" class="menu-btn btn-secondary">
            <span class="btn-icon">★</span>
            Create Online Room
          </button>

          <div class="join-section">
            <input type="text" id="roomCode" class="menu-input input-small" placeholder="Room code..." />
            <button id="btnJoin" class="menu-btn btn-accent">Join</button>
          </div>
        </div>

        <div id="roomInfo" class="room-info" style="display:none">
          <p>Room Code:</p>
          <div class="room-code" id="roomCodeDisplay"></div>
          <p class="room-hint">Share this code with friends!</p>
          <button id="btnStartOnline" class="menu-btn btn-primary">Start Game</button>
        </div>

        <div class="controls-info">
          <h3>Controls</h3>
          <div class="controls-grid">
            <span>WASD</span><span>Move</span>
            <span>Mouse</span><span>Aim</span>
            <span>Click</span><span>Shoot</span>
            <span>Space</span><span>Dash</span>
            <span>R</span><span>Reload</span>
            <span>1-5</span><span>Switch Weapon</span>
            <span>Tab</span><span>Scoreboard</span>
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(this.element);
    this.bindEvents();
  }

  bindEvents() {
    document.getElementById('btnOffline').addEventListener('click', () => {
      const name = document.getElementById('playerName').value.trim() || 'Player';
      if (this.onStart) this.onStart('offline', name);
    });

    document.getElementById('btnCreate').addEventListener('click', () => {
      const name = document.getElementById('playerName').value.trim() || 'Player';
      if (this.onCreate) this.onCreate(name);
    });

    document.getElementById('btnJoin').addEventListener('click', () => {
      const name = document.getElementById('playerName').value.trim() || 'Player';
      const code = document.getElementById('roomCode').value.trim();
      if (code && this.onJoin) this.onJoin(name, code);
    });

    const startBtn = document.getElementById('btnStartOnline');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        const name = document.getElementById('playerName').value.trim() || 'Player';
        if (this.onStart) this.onStart('online', name);
      });
    }
  }

  showRoomCode(code) {
    const info = document.getElementById('roomInfo');
    const display = document.getElementById('roomCodeDisplay');
    if (info && display) {
      display.textContent = code;
      info.style.display = 'block';
    }
  }

  hide() {
    if (this.element) {
      this.element.style.opacity = '0';
      setTimeout(() => this.element.remove(), 300);
    }
  }

  show() {
    if (this.element) {
      this.element.style.opacity = '1';
    }
  }
}
