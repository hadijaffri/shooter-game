import { EventEmitter } from '../utils/EventEmitter';
import { PeerClient } from './PeerClient';
import { createMessage, parseMessage, MSG } from './Protocol';
import { NETWORK } from '../utils/Constants';

export class NetworkManager extends EventEmitter {
  constructor() {
    super();
    this.client = new PeerClient();
    this.isOnline = false;
    this.isHost = false;
    this.myId = null;
    this.playerName = '';
    this.lastSyncTime = 0;
    this.syncInterval = 1000 / NETWORK.SYNC_RATE;
    this.latency = 0;
    this.pingInterval = null;
  }

  async initialize() {
    this.myId = await this.client.init();

    this.client.on('message', ({ from, data }) => {
      const msg = parseMessage(data);
      if (!msg) return;
      this.handleMessage(from, msg);
    });

    this.client.on('peer-joined', (peerId) => {
      this.emit('player-joined', peerId);
      if (this.isHost) {
        this.send(peerId, MSG.GAME_STATE, { welcome: true });
      }
    });

    this.client.on('peer-left', (peerId) => {
      this.emit('player-left', peerId);
    });

    return this.myId;
  }

  async createRoom() {
    const roomId = this.client.createRoom();
    this.isHost = true;
    this.isOnline = true;
    this.startPingLoop();
    return roomId;
  }

  async joinRoom(roomId) {
    await this.client.joinRoom(roomId);
    this.isOnline = true;
    this.isHost = false;
    this.startPingLoop();

    this.send(roomId, MSG.JOIN, {
      name: this.playerName,
      id: this.myId,
    });

    return roomId;
  }

  handleMessage(from, msg) {
    switch (msg.type) {
      case MSG.JOIN:
        this.emit('player-join-request', { peerId: from, ...msg.data });
        break;
      case MSG.STATE_UPDATE:
        this.emit('state-update', { from, state: msg.data });
        break;
      case MSG.SHOOT:
        this.emit('remote-shoot', { from, ...msg.data });
        break;
      case MSG.HIT:
        this.emit('remote-hit', { from, ...msg.data });
        break;
      case MSG.KILL:
        this.emit('remote-kill', { from, ...msg.data });
        break;
      case MSG.RESPAWN:
        this.emit('remote-respawn', { from, ...msg.data });
        break;
      case MSG.CHAT:
        this.emit('chat-message', { from, ...msg.data });
        break;
      case MSG.PICKUP:
        this.emit('remote-pickup', { from, ...msg.data });
        break;
      case MSG.DASH:
        this.emit('remote-dash', { from });
        break;
      case MSG.WEAPON_SWITCH:
        this.emit('remote-weapon-switch', { from, weapon: msg.data.weapon });
        break;
      case MSG.PLAYER_INPUT:
        this.emit('remote-input', { from, input: msg.data });
        break;
      case MSG.PING:
        this.send(from, MSG.PONG, { t: msg.data.t });
        break;
      case MSG.PONG:
        this.latency = Date.now() - msg.data.t;
        this.emit('latency-update', this.latency);
        break;
      case MSG.HOST_SYNC:
        this.emit('host-sync', msg.data);
        break;
      case MSG.GAME_STATE:
        this.emit('game-state', msg.data);
        break;
    }
  }

  send(peerId, type, data) {
    this.client.send(peerId, createMessage(type, data));
  }

  broadcast(type, data) {
    this.client.broadcast(createMessage(type, data));
  }

  sendStateUpdate(state) {
    const now = Date.now();
    if (now - this.lastSyncTime < this.syncInterval) return;
    this.lastSyncTime = now;
    this.broadcast(MSG.STATE_UPDATE, state);
  }

  startPingLoop() {
    this.pingInterval = setInterval(() => {
      this.broadcast(MSG.PING, { t: Date.now() });
    }, 2000);
  }

  getPlayerCount() {
    return this.client.getPeerCount() + 1;
  }

  disconnect() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.client.disconnect();
    this.isOnline = false;
    this.isHost = false;
  }
}
