import { Peer } from 'peerjs';

export const MSG_TYPE = {
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

    // Callbacks
    this.onConnectedCallback = null;
    this.onDataCallback = null;
    this.onDisconnectedCallback = null;
    this.onErrorCallback = null;
  }

  // Gera código aleatório de 4 caracteres alfanuméricos
  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // --- CRIAR SALA (HOST / P1) ---
  createRoom(customCode = null) {
    this.disconnect();
    this.isHost = true;
    this.roomCode = (customCode || this.generateRoomCode()).toUpperCase();
    const peerId = `fightgame-${this.roomCode}`;

    return new Promise((resolve, reject) => {
      try {
        this.peer = new Peer(peerId, {
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ]
          }
        });

        this.peer.on('open', () => {
          resolve(this.roomCode);
        });

        this.peer.on('connection', (connection) => {
          this.conn = connection;
          this.setupConnection();
        });

        this.peer.on('error', (err) => {
          console.error('Peer error:', err);
          if (this.onErrorCallback) this.onErrorCallback(err);
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
    const targetPeerId = `fightgame-${this.roomCode}`;

    return new Promise((resolve, reject) => {
      try {
        this.peer = new Peer(null, {
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ]
          }
        });

        this.peer.on('open', () => {
          this.conn = this.peer.connect(targetPeerId, {
            reliable: false // Modo baixa latência para fighting game
          });

          this.setupConnection();
          resolve(this.roomCode);
        });

        this.peer.on('error', (err) => {
          console.error('Peer connection error:', err);
          if (this.onErrorCallback) this.onErrorCallback(err);
          reject(err);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  // --- CONFIGURAÇÃO DO DATA CHANNEL ---
  setupConnection() {
    if (!this.conn) return;

    this.conn.on('open', () => {
      this.isConnected = true;
      this.startPingLoop();
      if (this.onConnectedCallback) this.onConnectedCallback(this.isHost);
    });

    this.conn.on('data', (data) => {
      this.handleIncomingData(data);
    });

    this.conn.on('close', () => {
      this.handleDisconnect();
    });

    this.conn.on('error', (err) => {
      console.error('Data channel error:', err);
      if (this.onErrorCallback) this.onErrorCallback(err);
    });
  }

  handleIncomingData(data) {
    if (!data || !data.type) return;

    // Tratamento de Ping/Pong interno
    if (data.type === MSG_TYPE.PING) {
      this.send(MSG_TYPE.PONG, { timestamp: data.payload.timestamp });
      return;
    }
    if (data.type === MSG_TYPE.PONG) {
      this.ping = Math.round(performance.now() - data.payload.timestamp);
      return;
    }

    if (this.onDataCallback) {
      this.onDataCallback(data.type, data.payload);
    }
  }

  send(type, payload = {}) {
    if (this.conn && this.isConnected) {
      try {
        this.conn.send({ type, payload });
      } catch (err) {
        console.error('Send packet error:', err);
      }
    }
  }

  startPingLoop() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = setInterval(() => {
      if (this.isConnected) {
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
    if (this.onDisconnectedCallback) {
      this.onDisconnectedCallback();
    }
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
