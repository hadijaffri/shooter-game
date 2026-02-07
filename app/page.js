'use client';

import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const [screen, setScreen] = useState('menu');
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('Player');
  const [joinCode, setJoinCode] = useState('');
  const [status, setStatus] = useState('');

  const startGame = async (mode, name, roomId = null) => {
    setScreen('loading');
    setStatus('Loading 3D engine...');

    try {
      const { Game3D } = await import('../game/Game3D');
      const container = containerRef.current;

      const game = new Game3D(container, name);
      gameRef.current = game;

      game.on('room-created', (id) => {
        setRoomCode(id);
        setScreen('lobby');
      });

      if (mode === 'create') {
        setStatus('Creating room...');
        await game.init('online');
        return;
      }

      if (mode === 'join') {
        setStatus('Joining room...');
        await game.init('online', roomId);
      } else {
        setStatus('Generating arena...');
        await game.init('offline');
      }

      setScreen('game');
      game.start();
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
      setTimeout(() => setScreen('menu'), 3000);
    }
  };

  const startFromLobby = () => {
    if (gameRef.current) {
      setScreen('game');
      gameRef.current.start();
    }
  };

  useEffect(() => {
    return () => {
      if (gameRef.current) {
        gameRef.current.stop();
      }
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {screen === 'menu' && (
        <div className="menu-overlay">
          <div className="menu-container">
            <h1 className="menu-title">
              <span className="title-glow">NEON</span>
              <span className="title-accent">ARENA</span>
            </h1>
            <p className="menu-subtitle">3D Multiplayer Shooter</p>

            <div className="menu-section">
              <input
                type="text"
                className="menu-input"
                placeholder="Enter your name"
                maxLength={15}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
            </div>

            <div className="menu-buttons">
              <button
                className="menu-btn btn-primary"
                onClick={() => startGame('offline', playerName)}
              >
                <span className="btn-icon">&#9876;</span>
                Play Offline (vs Waves)
              </button>

              <button
                className="menu-btn btn-secondary"
                onClick={() => startGame('create', playerName)}
              >
                <span className="btn-icon">&#9733;</span>
                Create Online Room
              </button>

              <div className="join-section">
                <input
                  type="text"
                  className="menu-input"
                  placeholder="Room code..."
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                />
                <button
                  className="menu-btn btn-accent"
                  onClick={() => joinCode && startGame('join', playerName, joinCode)}
                >
                  Join
                </button>
              </div>
            </div>

            <div className="controls-info">
              <h3>Controls</h3>
              <div className="controls-grid">
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
        </div>
      )}

      {screen === 'loading' && (
        <div className="loading-overlay">
          <div className="loading-text">{status}</div>
        </div>
      )}

      {screen === 'lobby' && (
        <div className="menu-overlay">
          <div className="menu-container">
            <h1 className="menu-title">
              <span className="title-glow">ROOM</span>
              <span className="title-accent">CREATED</span>
            </h1>

            <div className="room-info" style={{ display: 'block' }}>
              <p>Share this code with friends:</p>
              <div className="room-code">{roomCode}</div>
              <p className="room-hint">Players can join using this code</p>
            </div>

            <button className="menu-btn btn-primary" onClick={startFromLobby}>
              Start Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
