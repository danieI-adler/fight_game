import { Peer } from 'peerjs';

export const MSG_TYPE = {
  HANDSHAKE: 'HANDSHAKE',
  LOBBY_SYNC: 'LOBBY_SYNC',
  START_MATCH: 'START_MATCH',
  CLIENT_INPUT: 'CLIENT_INPUT',
  HOST_STATE: 'HOST_STATE',
  REMATCH: 'REMATCH',
  PING: 'PING',
  PONG: 'PONG',
  DISCONNECT: 'DISCONNECT'
};

class NetworkManager {
  constructor() {
    this.peer = null;
    this.conn = null;
    this.isHost = false;
    this.roomCode = '';
    this.isConnected = false;
    this.ping = 0;
    this.pingInterval = null;
    this.listeners = new Map();
  }

  // Event Emitter multi-listener para não sobrescrever callbacks
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, ...args) {
    if (this.listeners.has(event)) {
      for (const cb of this.listeners.get(event)) {
        try {
          cb(...args);
        } catch (e) {
          console.error(`Error in listener for ${event}:`, e);
        }
      }
    }
  }

  generateRoomCode() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  getIceServers() {
    return [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:stun.services.mozilla.com' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ];
  }

  // --- CRIAR SALA (HOST / P1) ---
  createRoom(customCode = null) {
    this.disconnect();
    this.isHost = true;
    this.roomCode = (customCode || this.generateRoomCode()).toUpperCase();
    const peerId = `fg2d-${this.roomCode.toLowerCase()}`;

    return new Promise((resolve, reject) => {
      try {
        this.peer = new Peer(peerId, {
          debug: 1,
          config: {
            iceServers: this.getIceServers()
          }
        });

        this.peer.on('open', (id) => {
          console.log(`[Host] Sala criada com ID: ${id}`);
          resolve(this.roomCode);
        });

        this.peer.on('connection', (connection) => {
          console.log('[Host] Conexão recebida de cliente!');
          this.conn = connection;
          this.setupConnection();
        });

        this.peer.on('error', (err) => {
          console.error('[Host] Peer erro:', err);
          this.emit('error', err);
          reject(err);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  // --- ENTRAR EM SALA (CLIENT / P2) ---
  joinRoom(roomCode) {
    this.disconnect();
    this.isHost = false;
    this.roomCode = roomCode.trim().toUpperCase();
    const targetPeerId = `fg2d-${this.roomCode.toLowerCase()}`;

    return new Promise((resolve, reject) => {
      try {
        this.peer = new Peer(null, {
          debug: 1,
          config: {
            iceServers: this.getIceServers()
          }
        });

        this.peer.on('open', (id) => {
          console.log(`[Client] Conectando ao host ${targetPeerId} com ID local: ${id}`);
          this.conn = this.peer.connect(targetPeerId, {
            reliable: true // Garante abertura correta do DataChannel WebRTC
          });

          this.setupConnection();
          resolve(this.roomCode);
        });

        this.peer.on('error', (err) => {
          console.error('[Client] Peer erro:', err);
          this.emit('error', err);
          reject(err);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  setupConnection() {
    if (!this.conn) return;

    const onOpen = () => {
      console.log(`[WebRTC] Canal de dados aberto! Host: ${this.isHost}`);
      this.isConnected = true;
      this.startPingLoop();

      // Envia aperto de mão imediato
      this.send(MSG_TYPE.HANDSHAKE, { isHost: this.isHost, time: Date.now() });
      this.emit('connected', this.isHost);
    };

    if (this.conn.open) {
      onOpen();
    } else {
      this.conn.on('open', onOpen);
    }

    this.conn.on('data', (data) => {
      this.handleIncomingData(data);
    });

    this.conn.on('close', () => {
      console.log('[WebRTC] Canal fechado.');
      this.handleDisconnect();
    });

    this.conn.on('error', (err) => {
      console.error('[WebRTC] Erro no canal:', err);
      this.emit('error', err);
    });
  }

  handleIncomingData(data) {
    if (!data || !data.type) return;

    if (data.type === MSG_TYPE.PING) {
      this.send(MSG_TYPE.PONG, { timestamp: data.payload.timestamp });
      return;
    }
    if (data.type === MSG_TYPE.PONG) {
      this.ping = Math.round(performance.now() - data.payload.timestamp);
      return;
    }
    if (data.type === MSG_TYPE.HANDSHAKE) {
      if (!this.isConnected) {
        this.isConnected = true;
        this.emit('connected', this.isHost);
      }
    }

    this.emit('data', data.type, data.payload);
  }

  send(type, payload = {}) {
    if (this.conn && this.conn.open) {
      try {
        this.conn.send({ type, payload });
      } catch (err) {
        console.error('Erro ao enviar pacote:', err);
      }
    }
  }

  startPingLoop() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = setInterval(() => {
      if (this.isConnected && this.conn && this.conn.open) {
        this.send(MSG_TYPE.PING, { timestamp: performance.now() });
      }
    }, 2000);
  }

  handleDisconnect() {
    this.isConnected = false;
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    this.emit('disconnected');
  }

  disconnect() {
    this.isConnected = false;
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.conn) {
      try { this.conn.close(); } catch (e) {}
      this.conn = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch (e) {}
      this.peer = null;
    }
  }
}

export const network = new NetworkManager();
