import { EventEmitter } from '../utils/EventEmitter';

export class PeerClient extends EventEmitter {
  constructor() {
    super();
    this.peer = null;
    this.connections = new Map();
    this.myId = null;
    this.isHost = false;
    this.roomId = null;
    this.ready = false;
  }

  async init() {
    const { default: Peer } = await import('peerjs');

    return new Promise((resolve, reject) => {
      this.peer = new Peer();

      this.peer.on('open', (id) => {
        this.myId = id;
        this.ready = true;
        this.emit('ready', id);
        resolve(id);
      });

      this.peer.on('connection', (conn) => {
        this.setupConnection(conn);
      });

      this.peer.on('error', (err) => {
        this.emit('error', err);
        if (!this.ready) reject(err);
      });
    });
  }

  createRoom() {
    this.isHost = true;
    this.roomId = this.myId;
    this.emit('room-created', this.roomId);
    return this.roomId;
  }

  async joinRoom(roomId) {
    return new Promise((resolve, reject) => {
      const conn = this.peer.connect(roomId, { reliable: true });

      conn.on('open', () => {
        this.roomId = roomId;
        this.setupConnection(conn);
        this.emit('room-joined', roomId);
        resolve(roomId);
      });

      conn.on('error', (err) => {
        reject(err);
      });

      setTimeout(() => reject(new Error('Connection timeout')), 10000);
    });
  }

  setupConnection(conn) {
    this.connections.set(conn.peer, conn);

    conn.on('data', (data) => {
      this.emit('message', { from: conn.peer, data });
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      this.emit('peer-left', conn.peer);
    });

    conn.on('error', () => {
      this.connections.delete(conn.peer);
    });

    this.emit('peer-joined', conn.peer);
  }

  send(peerId, data) {
    const conn = this.connections.get(peerId);
    if (conn && conn.open) {
      conn.send(data);
    }
  }

  broadcast(data) {
    this.connections.forEach((conn) => {
      if (conn.open) {
        conn.send(data);
      }
    });
  }

  getPeerCount() {
    return this.connections.size;
  }

  disconnect() {
    this.connections.forEach(conn => conn.close());
    this.connections.clear();
    if (this.peer) this.peer.destroy();
    this.ready = false;
  }
}
