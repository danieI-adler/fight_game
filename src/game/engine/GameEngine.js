import { Fighter, FIGHTER_STATE } from './Fighter';
import { Camera } from './Camera';
import { Stage } from './Stage';
import { ParticleManager } from './Particles';
import { CollisionSystem } from './Collision';
import { InputHandler } from './InputHandler';
import { FighterAI } from '../ai/FighterAI';
import { sounds } from '../audio/soundManager';
import { getCharacterById } from '../characters/characterData';
import { network, MSG_TYPE } from '../network/NetworkManager';

export const GAME_STATUS = {
  INTRO: 'INTRO',
  FIGHTING: 'FIGHTING',
  ROUND_END: 'ROUND_END',
  MATCH_OVER: 'MATCH_OVER',
  PAUSED: 'PAUSED'
};

export class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.width = 1280;
    this.height = 720;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.camera = new Camera(this.width, this.height);
    this.stage = new Stage('cyber_arena');
    this.particles = new ParticleManager();
    this.inputHandler = new InputHandler();
    this.ai = new FighterAI('medium');

    // Estado da Partida
    this.mode = 'VERSUS'; // 'VERSUS', 'ARCADE', 'TRAINING', 'ONLINE'
    this.isOnlineHost = true;
    this.status = GAME_STATUS.INTRO;
    this.roundTime = 99;
    this.roundTimer = 99;
    this.currentRound = 1;
    this.p1Wins = 0;
    this.p2Wins = 0;
    this.maxRounds = 2;
    this.statusMessage = 'ROUND 1';
    this.statusSubMessage = 'READY...';
    this.statusTimer = 0;

    // Lutadores
    this.p1 = new Fighter(getCharacterById(1), false, this.stage.groundY);
    this.p2 = new Fighter(getCharacterById(2), true, this.stage.groundY);
    this.p1.setOpponent(this.p2);
    this.p2.setOpponent(this.p1);

    // Hitstop
    this.hitstopFrames = 0;
    this.timeScale = 1.0;

    // Configurações
    this.showHitboxes = false;
    this.isTraining = false;

    // Callback para atualização de UI
    this.onStateChange = null;

    // Loop
    this.isRunning = false;
    this.animationFrameId = null;
    this.lastTime = performance.now();
    this.justPressedP1 = {};
    this.justPressedP2 = {};

    // Rede
    this.remoteClientInput = {};
    this.lastNetworkSyncTime = 0;

    this.bindEvents();
    this.setupNetworkHandlers();
  }

  bindEvents() {
    this.inputHandler.attach();

    window.addEventListener('keydown', (e) => {
      if (this.status !== GAME_STATUS.FIGHTING && this.status !== GAME_STATUS.INTRO) return;

      // P1 Just Pressed (Usado localmente por P1 no Versus/Arcade e pelo jogador local no Online)
      if (this.inputHandler.p1Binds.up.includes(e.code)) this.justPressedP1.jump = true;
      if (this.inputHandler.p1Binds.lightPunch.includes(e.code)) this.justPressedP1.lightPunch = true;
      if (this.inputHandler.p1Binds.heavyPunch.includes(e.code)) this.justPressedP1.heavyPunch = true;
      if (this.inputHandler.p1Binds.lightKick.includes(e.code)) this.justPressedP1.lightKick = true;
      if (this.inputHandler.p1Binds.heavyKick.includes(e.code)) this.justPressedP1.heavyKick = true;
      if (this.inputHandler.p1Binds.special1.includes(e.code)) this.justPressedP1.special1 = true;
      if (this.inputHandler.p1Binds.superMove.includes(e.code)) this.justPressedP1.superMove = true;

      // P2 Just Pressed (Modo Versus Local)
      if (this.mode === 'VERSUS') {
        if (this.inputHandler.p2Binds.up.includes(e.code)) this.justPressedP2.jump = true;
        if (this.inputHandler.p2Binds.lightPunch.includes(e.code)) this.justPressedP2.lightPunch = true;
        if (this.inputHandler.p2Binds.heavyPunch.includes(e.code)) this.justPressedP2.heavyPunch = true;
        if (this.inputHandler.p2Binds.lightKick.includes(e.code)) this.justPressedP2.lightKick = true;
        if (this.inputHandler.p2Binds.heavyKick.includes(e.code)) this.justPressedP2.heavyKick = true;
        if (this.inputHandler.p2Binds.special1.includes(e.code)) this.justPressedP2.special1 = true;
        if (this.inputHandler.p2Binds.superMove.includes(e.code)) this.justPressedP2.superMove = true;
      }
    });
  }

  setupNetworkHandlers() {
    network.onDataCallback = (type, payload) => {
      if (this.mode !== 'ONLINE') return;

      if (type === MSG_TYPE.CLIENT_INPUT && this.isOnlineHost) {
        // Host recebe inputs do cliente P2
        this.remoteClientInput = payload;
      } else if (type === MSG_TYPE.HOST_STATE && !this.isOnlineHost) {
        // Cliente recebe snapshot de estado do Host
        this.applyHostStateSnapshot(payload);
      }
    };
  }

  startFight(char1Id, char2Id, mode = 'VERSUS', difficulty = 'medium', stageId = 'cyber_arena', isHost = true) {
    this.mode = mode;
    this.isOnlineHost = isHost;
    this.isTraining = mode === 'TRAINING';
    this.stage.setStage(stageId);
    this.ai.setDifficulty(this.isTraining ? 'dummy' : difficulty);

    const c1 = getCharacterById(char1Id);
    const c2 = getCharacterById(char2Id);

    this.p1 = new Fighter(c1, false, this.stage.groundY);
    this.p2 = new Fighter(c2, true, this.stage.groundY);
    this.p1.setOpponent(this.p2);
    this.p2.setOpponent(this.p1);

    this.currentRound = 1;
    this.p1Wins = 0;
    this.p2Wins = 0;
    this.resetRound();

    this.isRunning = true;
    this.lastTime = performance.now();
    sounds.startBGM();
    this.loop();
  }

  resetRound() {
    this.p1.reset(650);
    this.p2.reset(1350);
    this.particles.reset();
    this.roundTimer = this.roundTime;
    this.timeScale = 1.0;
    this.status = GAME_STATUS.INTRO;
    this.statusMessage = `ROUND ${this.currentRound}`;
    this.statusSubMessage = 'READY...';
    this.statusTimer = 2.0;
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    sounds.stopBGM();
  }

  destroy() {
    this.stop();
    this.inputHandler.detach();
  }

  loop() {
    if (!this.isRunning) return;

    const now = performance.now();
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    if (dt > 0.1) dt = 0.1;

    this.update(dt * this.timeScale);
    this.render();

    if (this.onStateChange) {
      this.onStateChange({
        p1Health: this.p1.health,
        p1MaxHealth: this.p1.maxHealth,
        p1Energy: this.p1.energy,
        p1Combo: this.p1.comboCount,
        p2Health: this.p2.health,
        p2MaxHealth: this.p2.maxHealth,
        p2Energy: this.p2.energy,
        p2Combo: this.p2.comboCount,
        roundTimer: Math.ceil(this.roundTimer),
        currentRound: this.currentRound,
        p1Wins: this.p1Wins,
        p2Wins: this.p2Wins,
        status: this.status,
        statusMessage: this.statusMessage,
        statusSubMessage: this.statusSubMessage,
      });
    }

    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }

  update(dt) {
    if (this.hitstopFrames > 0) {
      this.hitstopFrames--;
      this.camera.update(this.p1, this.p2, dt);
      return;
    }

    // --- MODO ONLINE CLIENTE ---
    if (this.mode === 'ONLINE' && !this.isOnlineHost) {
      // Cliente envia seus inputs locais ao Host
      const clientInputPacket = {
        left: this.inputHandler.isPressed(this.inputHandler.p1Binds.left),
        right: this.inputHandler.isPressed(this.inputHandler.p1Binds.right),
        down: this.inputHandler.isPressed(this.inputHandler.p1Binds.down),
        block: this.inputHandler.isPressed(this.inputHandler.p1Binds.block),
        justPressed: { ...this.justPressedP1 }
      };
      network.send(MSG_TYPE.CLIENT_INPUT, clientInputPacket);
      this.justPressedP1 = {};

      // Atualiza câmera e partículas locais
      this.stage.update(dt);
      this.particles.update(dt);
      this.camera.update(this.p1, this.p2, dt);
      return;
    }

    // --- LÓGICA AUTORITATIVA (LOCAL OU HOST ONLINE) ---
    if (this.status === GAME_STATUS.INTRO) {
      this.statusTimer -= dt;
      if (this.statusTimer <= 1.0) {
        this.statusMessage = 'FIGHT!';
      }
      if (this.statusTimer <= 0) {
        this.status = GAME_STATUS.FIGHTING;
        this.statusMessage = '';
      }
    } else if (this.status === GAME_STATUS.FIGHTING) {
      if (!this.isTraining) {
        this.roundTimer -= dt;
        if (this.roundTimer <= 0) {
          this.roundTimer = 0;
          this.handleTimeUp();
        }
      }

      // 1. Processar P1 Local
      this.inputHandler.updateFighterInput(this.p1, this.inputHandler.p1Binds, 0, this.justPressedP1);
      this.justPressedP1 = {};

      // 2. Processar P2 (Versus Local / IA / Rede)
      if (this.mode === 'VERSUS') {
        this.inputHandler.updateFighterInput(this.p2, this.inputHandler.p2Binds, 1, this.justPressedP2);
        this.justPressedP2 = {};
      } else if (this.mode === 'ONLINE' && this.isOnlineHost) {
        // Aplica inputs recebidos do cliente P2
        if (this.remoteClientInput) {
          const fakeBinds = { left: [], right: [], down: [], block: [] };
          this.p2.crouch(this.remoteClientInput.down);
          this.p2.block(this.remoteClientInput.block);

          if (!this.remoteClientInput.down && !this.remoteClientInput.block) {
            if (this.remoteClientInput.left && !this.remoteClientInput.right) this.p2.move(-1);
            else if (this.remoteClientInput.right && !this.remoteClientInput.left) this.p2.move(1);
            else this.p2.stopMoving();
          }

          const jp = this.remoteClientInput.justPressed || {};
          if (jp.jump) {
            const dirX = this.remoteClientInput.left ? -1 : (this.remoteClientInput.right ? 1 : 0);
            this.p2.jump(dirX);
          }
          if (jp.superMove) this.p2.superMove();
          else if (jp.special1) this.p2.special1();
          else if (jp.heavyPunch) this.p2.heavyPunch();
          else if (jp.lightPunch) this.p2.lightPunch();
          else if (jp.heavyKick) this.p2.heavyKick();
          else if (jp.lightKick) this.p2.lightKick();

          this.remoteClientInput.justPressed = {};
        }
      } else {
        this.ai.update(this.p2, this.p1, dt);
      }

      // 3. Atualização física
      this.p1.update(dt, this.stage.width, this.particles);
      this.p2.update(dt, this.stage.width, this.particles);

      CollisionSystem.resolvePushboxes(this.p1, this.p2);
      this.checkCombatHits();

      if (this.p1.isDead || this.p2.isDead) {
        this.handleKnockout();
      }
    } else if (this.status === GAME_STATUS.ROUND_END) {
      this.statusTimer -= dt;
      this.p1.update(dt, this.stage.width, this.particles);
      this.p2.update(dt, this.stage.width, this.particles);

      if (this.statusTimer <= 0) {
        if (this.p1Wins >= this.maxRounds || this.p2Wins >= this.maxRounds) {
          this.status = GAME_STATUS.MATCH_OVER;
          this.statusMessage = this.p1Wins >= this.maxRounds ? `${this.p1.charData.name} VENCEU!` : `${this.p2.charData.name} VENCEU!`;
        } else {
          this.currentRound++;
          this.resetRound();
        }
      }
    }

    // Se for Host Online, transmite snapshot de estado para o Cliente
    if (this.mode === 'ONLINE' && this.isOnlineHost) {
      const now = performance.now();
      if (now - this.lastNetworkSyncTime > 16) { // ~60 fps sync
        this.lastNetworkSyncTime = now;
        this.broadcastHostState();
      }
    }

    this.stage.update(dt);
    this.particles.update(dt);
    this.camera.update(this.p1, this.p2, dt);
  }

  broadcastHostState() {
    const snapshot = {
      p1: {
        x: Math.round(this.p1.position.x),
        y: Math.round(this.p1.position.y),
        state: this.p1.state,
        hp: this.p1.health,
        energy: Math.round(this.p1.energy),
        facing: this.p1.facing,
        isGrounded: this.p1.isGrounded,
        stateTime: this.p1.stateTime
      },
      p2: {
        x: Math.round(this.p2.position.x),
        y: Math.round(this.p2.position.y),
        state: this.p2.state,
        hp: this.p2.health,
        energy: Math.round(this.p2.energy),
        facing: this.p2.facing,
        isGrounded: this.p2.isGrounded,
        stateTime: this.p2.stateTime
      },
      roundTimer: this.roundTimer,
      currentRound: this.currentRound,
      p1Wins: this.p1Wins,
      p2Wins: this.p2Wins,
      status: this.status,
      statusMessage: this.statusMessage,
      statusSubMessage: this.statusSubMessage
    };
    network.send(MSG_TYPE.HOST_STATE, snapshot);
  }

  applyHostStateSnapshot(snap) {
    if (!snap) return;

    // Sincronizar P1
    if (snap.p1) {
      this.p1.position.x += (snap.p1.x - this.p1.position.x) * 0.4;
      this.p1.position.y = snap.p1.y;
      this.p1.state = snap.p1.state;
      this.p1.health = snap.p1.hp;
      this.p1.energy = snap.p1.energy;
      this.p1.facing = snap.p1.facing;
      this.p1.isGrounded = snap.p1.isGrounded;
      this.p1.stateTime = snap.p1.stateTime;
      this.p1.updateSkeletalPose();
    }

    // Sincronizar P2
    if (snap.p2) {
      this.p2.position.x += (snap.p2.x - this.p2.position.x) * 0.4;
      this.p2.position.y = snap.p2.y;
      this.p2.state = snap.p2.state;
      this.p2.health = snap.p2.hp;
      this.p2.energy = snap.p2.energy;
      this.p2.facing = snap.p2.facing;
      this.p2.isGrounded = snap.p2.isGrounded;
      this.p2.stateTime = snap.p2.stateTime;
      this.p2.updateSkeletalPose();
    }

    this.roundTimer = snap.roundTimer;
    this.currentRound = snap.currentRound;
    this.p1Wins = snap.p1Wins;
    this.p2Wins = snap.p2Wins;
    this.status = snap.status;
    this.statusMessage = snap.statusMessage;
    this.statusSubMessage = snap.statusSubMessage;
  }

  checkCombatHits() {
    if (this.p1.activeHitbox && !this.p1.hasHitCurrentAttack) {
      const hitResult = CollisionSystem.checkAttackHit(this.p1, this.p2);
      if (hitResult) {
        this.p1.hasHitCurrentAttack = true;
        this.p1.comboCount++;
        this.p2.receiveHit(this.p1.activeHitbox, hitResult.point, this.particles);

        if (this.p1.activeHitbox.isHeavy) {
          this.camera.addShake(12, 0.25);
          this.hitstopFrames = 5;
        } else {
          this.camera.addShake(4, 0.12);
          this.hitstopFrames = 2;
        }
      }
    }

    if (this.p2.activeHitbox && !this.p2.hasHitCurrentAttack) {
      const hitResult = CollisionSystem.checkAttackHit(this.p2, this.p1);
      if (hitResult) {
        this.p2.hasHitCurrentAttack = true;
        this.p2.comboCount++;
        this.p1.receiveHit(this.p2.activeHitbox, hitResult.point, this.particles);

        if (this.p2.activeHitbox.isHeavy) {
          this.camera.addShake(12, 0.25);
          this.hitstopFrames = 5;
        } else {
          this.camera.addShake(4, 0.12);
          this.hitstopFrames = 2;
        }
      }
    }

    if (!this.p1.activeHitbox && this.p2.hitstunTime <= 0) this.p1.comboCount = 0;
    if (!this.p2.activeHitbox && this.p1.hitstunTime <= 0) this.p2.comboCount = 0;
  }

  handleKnockout() {
    this.status = GAME_STATUS.ROUND_END;
    this.statusMessage = 'K.O.!';
    this.statusTimer = 2.8;
    this.timeScale = 0.4;
    this.camera.addShake(16, 0.4);

    if (this.p1.isDead) {
      this.p2Wins++;
      this.p2.state = FIGHTER_STATE.VICTORY;
    } else {
      this.p1Wins++;
      this.p1.state = FIGHTER_STATE.VICTORY;
    }
  }

  handleTimeUp() {
    this.status = GAME_STATUS.ROUND_END;
    this.statusMessage = 'TEMPO!';
    this.statusTimer = 2.5;

    if (this.p1.health > this.p2.health) {
      this.p1Wins++;
      this.p2.state = FIGHTER_STATE.DEFEAT;
    } else if (this.p2.health > this.p1.health) {
      this.p2Wins++;
      this.p1.state = FIGHTER_STATE.DEFEAT;
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    this.camera.applyTransform(ctx);
    this.stage.draw(ctx, this.camera);
    this.p1.draw(ctx, this.showHitboxes);
    this.p2.draw(ctx, this.showHitboxes);
    this.particles.draw(ctx);
    this.camera.restoreTransform(ctx);
  }
}
