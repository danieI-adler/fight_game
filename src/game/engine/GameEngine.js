import { Fighter, FIGHTER_STATE } from './Fighter';
import { Camera } from './Camera';
import { Stage } from './Stage';
import { ParticleManager } from './Particles';
import { CollisionSystem } from './Collision';
import { InputHandler } from './InputHandler';
import { FighterAI } from '../ai/FighterAI';
import { playerTracker } from '../ai/PlayerProfileTracker';
import { sounds } from '../audio/soundManager';
import { getCharacterById } from '../characters/characterData';
import { getExpeditionCharacterById } from '../characters/expedition33Characters';
import { network, MSG_TYPE } from '../network/NetworkManager';
import { GameEngine3D } from '../engine3d/GameEngine3D';
import { ExpeditionStageRenderer } from './ExpeditionStages';

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
    this.graphicsMode = 'BELLE_EPOQUE_2D'; // 'STICK_2D', 'BELLE_EPOQUE_2D', 'MODE_2_5D', 'FULL_3D'
    this.engine3D = null;
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

    // Cinemática Especial: Renoir KO Gustave
    this.specialCinematic = null; // { active, timer, renoir, gustave, phase, beamProgress }

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
    this.remoteClientInputQueue = [];
    this.lastNetworkSyncTime = 0;

    this.bindEvents();
    this.setupNetworkHandlers();
  }

  bindEvents() {
    this.inputHandler.attach();

    window.addEventListener('keydown', (e) => {
      if (this.status !== GAME_STATUS.FIGHTING && this.status !== GAME_STATUS.INTRO) return;

      const now = performance.now();

      // P1 Just Pressed (Usado localmente por P1 no Versus/Arcade e pelo jogador local no Online)
      if (this.inputHandler.p1Binds.up.includes(e.code)) this.justPressedP1.jump = true;
      if (this.inputHandler.p1Binds.lightPunch.includes(e.code)) this.justPressedP1.lightPunch = true;
      if (this.inputHandler.p1Binds.heavyPunch.includes(e.code)) this.justPressedP1.heavyPunch = true;
      if (this.inputHandler.p1Binds.lightKick.includes(e.code)) this.justPressedP1.lightKick = true;
      if (this.inputHandler.p1Binds.heavyKick.includes(e.code)) this.justPressedP1.heavyKick = true;
      if (this.inputHandler.p1Binds.special1.includes(e.code)) this.justPressedP1.special1 = true;
      if (this.inputHandler.p1Binds.superMove.includes(e.code)) this.justPressedP1.superMove = true;

      // Detecção de Duplo Toque para Dash (P1 - A / D)
      if (this.inputHandler.doubleTapDashEnabled) {
        if (this.inputHandler.p1Binds.left.includes(e.code)) {
          const last = this.inputHandler.lastTapTime['p1_left'] || 0;
          if (now - last < this.inputHandler.doubleTapWindow && now - last > 40) {
            this.justPressedP1.dashLeft = true;
            this.inputHandler.lastTapTime['p1_left'] = 0;
          } else {
            this.inputHandler.lastTapTime['p1_left'] = now;
          }
        } else if (this.inputHandler.p1Binds.right.includes(e.code)) {
          const last = this.inputHandler.lastTapTime['p1_right'] || 0;
          if (now - last < this.inputHandler.doubleTapWindow && now - last > 40) {
            this.justPressedP1.dashRight = true;
            this.inputHandler.lastTapTime['p1_right'] = 0;
          } else {
            this.inputHandler.lastTapTime['p1_right'] = now;
          }
        }
      }

      // P2 Just Pressed (Modo Versus Local)
      if (this.mode === 'VERSUS') {
        if (this.inputHandler.p2Binds.up.includes(e.code)) this.justPressedP2.jump = true;
        if (this.inputHandler.p2Binds.lightPunch.includes(e.code)) this.justPressedP2.lightPunch = true;
        if (this.inputHandler.p2Binds.heavyPunch.includes(e.code)) this.justPressedP2.heavyPunch = true;
        if (this.inputHandler.p2Binds.lightKick.includes(e.code)) this.justPressedP2.lightKick = true;
        if (this.inputHandler.p2Binds.heavyKick.includes(e.code)) this.justPressedP2.heavyKick = true;
        if (this.inputHandler.p2Binds.special1.includes(e.code)) this.justPressedP2.special1 = true;
        if (this.inputHandler.p2Binds.superMove.includes(e.code)) this.justPressedP2.superMove = true;

        if (this.inputHandler.doubleTapDashEnabled) {
          if (this.inputHandler.p2Binds.left.includes(e.code)) {
            const last = this.inputHandler.lastTapTime['p2_left'] || 0;
            if (now - last < this.inputHandler.doubleTapWindow && now - last > 40) {
              this.justPressedP2.dashLeft = true;
              this.inputHandler.lastTapTime['p2_left'] = 0;
            } else {
              this.inputHandler.lastTapTime['p2_left'] = now;
            }
          } else if (this.inputHandler.p2Binds.right.includes(e.code)) {
            const last = this.inputHandler.lastTapTime['p2_right'] || 0;
            if (now - last < this.inputHandler.doubleTapWindow && now - last > 40) {
              this.justPressedP2.dashRight = true;
              this.inputHandler.lastTapTime['p2_right'] = 0;
            } else {
              this.inputHandler.lastTapTime['p2_right'] = now;
            }
          }
        }
      }
    });
  }

  setupNetworkHandlers() {
    this.networkUnsub = network.on('data', (type, payload) => {
      if (this.mode !== 'ONLINE') return;

      if (type === MSG_TYPE.CLIENT_INPUT && this.isOnlineHost) {
        this.remoteClientInput = payload;
        this.remoteClientInputQueue.push(payload);
        if (this.remoteClientInputQueue.length > 30) {
          this.remoteClientInputQueue.shift();
        }
      } else if (type === MSG_TYPE.HOST_STATE && !this.isOnlineHost) {
        this.applyHostStateSnapshot(payload);
      }
    });
  }

  startFight(char1Id, char2Id, mode = 'VERSUS', difficulty = 'medium', stageId = 'cyber_arena', isHost = true, graphicsMode = 'BELLE_EPOQUE_2D', isExpedition = false, tournamentLevel = 1) {
    this.mode = mode;
    this.graphicsMode = graphicsMode;
    this.isExpedition = isExpedition;
    this.stageId = stageId;
    this.isOnlineHost = isHost;
    this.isTraining = mode === 'TRAINING';
    this.tournamentLevel = tournamentLevel;
    this.stage.setStage(stageId);

    const actualDiff = this.isTraining ? 'dummy' : (mode === 'TOURNAMENT' ? 'tournament' : difficulty);
    const profile = mode === 'TOURNAMENT' ? playerTracker.getHabitProfile() : null;
    this.ai.setDifficulty(actualDiff, tournamentLevel, profile);

    const c1 = this.isExpedition ? getExpeditionCharacterById(char1Id) : getCharacterById(char1Id);
    const c2 = this.isExpedition ? getExpeditionCharacterById(char2Id) : getCharacterById(char2Id);

    this.p1 = new Fighter(c1, false, this.stage.groundY);
    this.p2 = new Fighter(c2, true, this.stage.groundY);
    this.p2.aiDifficulty = actualDiff;
    this.p2.aiTournamentLevel = tournamentLevel;
    this.p1.setOpponent(this.p2);
    this.p2.setOpponent(this.p1);

    if (this.engine3D) {
      this.engine3D.destroy();
      this.engine3D = null;
    }

    if (this.graphicsMode === 'MODE_2_5D' || this.graphicsMode === 'FULL_3D' || this.graphicsMode === 'EXPEDITION_PBR_3D') {
      try {
        const parent = this.canvas.parentElement || document.body;
        this.engine3D = new GameEngine3D(parent, this.graphicsMode === 'FULL_3D');
        this.engine3D.setFighters(c1, c2);
        parent.appendChild(this.engine3D.domElement);
      } catch (err) {
        console.error('Failed to init 3D engine, fallback to 2D:', err);
        this.graphicsMode = 'EXPEDITION_HD_SPRITES';
      }
    }

    this.currentRound = 1;
    this.p1Wins = 0;
    this.p2Wins = 0;
    if (this.isTraining) {
      this.p1.energy = 100;
      this.p2.energy = 100;
    }

    this.isRunning = true;
    this.lastTime = performance.now();
    sounds.startBGM();
    this.loop();
  }

  resetRound() {
    this.specialCinematic = null;
    this.p1.reset(650, true);
    this.p2.reset(1350, true);
    if (this.isTraining) {
      this.p1.energy = 100;
      this.p2.energy = 100;
    }
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
  }

  destroy() {
    this.stop();
    this.inputHandler.detach();
    if (this.networkUnsub) {
      this.networkUnsub();
      this.networkUnsub = null;
    }
    if (this.engine3D) {
      this.engine3D.destroy();
      this.engine3D = null;
    }
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
        p1VersoRank: this.p1.isVerso ? this.p1.versoRanks[this.p1.versoRankIndex] : null,
        p2Health: this.p2.health,
        p2MaxHealth: this.p2.maxHealth,
        p2Energy: this.p2.energy,
        p2Combo: this.p2.comboCount,
        p2VersoRank: this.p2.isVerso ? this.p2.versoRanks[this.p2.versoRankIndex] : null,
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
      if (this.justPressedP1) {
        if (this.justPressedP1.jump) playerTracker.recordAction('JUMP');
        if (this.justPressedP1.lightPunch) playerTracker.recordAction('lightPunch');
        if (this.justPressedP1.heavyPunch) playerTracker.recordAction('heavyPunch');
        if (this.justPressedP1.lightKick) playerTracker.recordAction('lightKick');
        if (this.justPressedP1.heavyKick) playerTracker.recordAction('heavyKick');
        if (this.justPressedP1.special1) playerTracker.recordAction('special');
        if (this.justPressedP1.superMove) playerTracker.recordAction('super');
      }

      this.inputHandler.updateFighterInput(this.p1, this.inputHandler.p1Binds, 0, this.justPressedP1);
      this.justPressedP1 = {};

      // Rastrear frame posicional e comportamental de P1
      const duelDist = Math.abs(this.p1.position.x - this.p2.position.x);
      playerTracker.trackPlayerFrame(this.p1, this.p2, duelDist);

      // 2. Processar P2 (Versus Local / IA / Rede)
      if (this.mode === 'VERSUS') {
        this.inputHandler.updateFighterInput(this.p2, this.inputHandler.p2Binds, 1, this.justPressedP2);
        this.justPressedP2 = {};
      } else if (this.mode === 'ONLINE' && this.isOnlineHost) {
        // Aplica inputs recebidos do cliente P2 a partir da fila (sem perder nenhum ataque)
        let mergedJustPressed = {};
        while (this.remoteClientInputQueue.length > 0) {
          const packet = this.remoteClientInputQueue.shift();
          if (packet.justPressed) {
            mergedJustPressed = { ...mergedJustPressed, ...packet.justPressed };
          }
          this.remoteClientInput = packet;
        }

        if (this.remoteClientInput) {
          this.p2.crouch(this.remoteClientInput.down);
          this.p2.block(this.remoteClientInput.block);

          if (!this.remoteClientInput.down && !this.remoteClientInput.block) {
            if (this.remoteClientInput.left && !this.remoteClientInput.right) this.p2.move(-1);
            else if (this.remoteClientInput.right && !this.remoteClientInput.left) this.p2.move(1);
            else this.p2.stopMoving();
          }

          const jp = { ...(this.remoteClientInput.justPressed || {}), ...mergedJustPressed };
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
      this.updateCinematic(dt);
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

  extractFighterSnapshot(fighter) {
    return {
      x: Math.round(fighter.position.x),
      y: Math.round(fighter.position.y),
      state: fighter.state,
      hp: fighter.health,
      energy: Math.round(fighter.energy),
      facing: fighter.facing,
      isGrounded: fighter.isGrounded,
      stateTime: fighter.stateTime,
      isBlocking: fighter.isBlocking,
      isCrouching: fighter.isCrouching,
      superType: fighter.superType,
      superPhase: fighter.superPhase,
      // Buffs & efeitos especiais
      mcqueenSpeedBuffTimer: fighter.mcqueenSpeedBuffTimer,
      mcqueenSpeedMultiplier: fighter.mcqueenSpeedMultiplier,
      sparrowDrunkTimer: fighter.sparrowDrunkTimer,
      sparrowDodgeCharges: fighter.sparrowDodgeCharges,
      palpatineDualSabers: fighter.palpatineDualSabers,
      scielCritCharges: fighter.scielCritCharges,
      scielCritTimer: fighter.scielCritTimer,
      // Projéteis e summons
      batmanBatarang: fighter.batmanBatarang ? { ...fighter.batmanBatarang } : null,
      batmanBatmobile: fighter.batmanBatmobile ? { ...fighter.batmanBatmobile } : null,
      vaderThrowingSaber: fighter.vaderThrowingSaber ? { ...fighter.vaderThrowingSaber } : null,
      palpatineLightning: fighter.palpatineLightning ? { ...fighter.palpatineLightning } : null,
      jokerAcidBlossom: fighter.jokerAcidBlossom ? { ...fighter.jokerAcidBlossom } : null,
      jokerCards: (fighter.jokerCards || []).map(c => ({ ...c })),
      jokerJackInTheBox: fighter.jokerJackInTheBox ? { ...fighter.jokerJackInTheBox } : null,
      mcqueenDriftBurn: fighter.mcqueenDriftBurn ? { ...fighter.mcqueenDriftBurn } : null,
      sparrowBlackPearl: fighter.sparrowBlackPearl ? {
        shipX: fighter.sparrowBlackPearl.shipX,
        shipY: fighter.sparrowBlackPearl.shipY,
        shipFacing: fighter.sparrowBlackPearl.shipFacing,
        cannonballs: (fighter.sparrowBlackPearl.cannonballs || []).map(cb => ({ ...cb }))
      } : null,
      gustaveBullet: fighter.gustaveBullet ? { ...fighter.gustaveBullet } : null,
      renoirBlackHole: fighter.renoirBlackHole ? { ...fighter.renoirBlackHole } : null
    };
  }

  applyFighterSnapshot(fighter, s) {
    if (!fighter || !s) return;
    fighter.position.x += (s.x - fighter.position.x) * 0.4;
    fighter.position.y = s.y;
    fighter.state = s.state;
    fighter.health = s.hp;
    fighter.energy = s.energy;
    fighter.facing = s.facing;
    fighter.isGrounded = s.isGrounded;
    fighter.stateTime = s.stateTime;
    if (s.isBlocking !== undefined) fighter.isBlocking = s.isBlocking;
    if (s.isCrouching !== undefined) fighter.isCrouching = s.isCrouching;
    if (s.superType !== undefined) fighter.superType = s.superType;
    if (s.superPhase !== undefined) fighter.superPhase = s.superPhase;

    // Buffs
    if (s.mcqueenSpeedBuffTimer !== undefined) fighter.mcqueenSpeedBuffTimer = s.mcqueenSpeedBuffTimer;
    if (s.mcqueenSpeedMultiplier !== undefined) fighter.mcqueenSpeedMultiplier = s.mcqueenSpeedMultiplier;
    if (s.sparrowDrunkTimer !== undefined) fighter.sparrowDrunkTimer = s.sparrowDrunkTimer;
    if (s.sparrowDodgeCharges !== undefined) fighter.sparrowDodgeCharges = s.sparrowDodgeCharges;
    if (s.palpatineDualSabers !== undefined) fighter.palpatineDualSabers = s.palpatineDualSabers;
    if (s.scielCritCharges !== undefined) fighter.scielCritCharges = s.scielCritCharges;
    if (s.scielCritTimer !== undefined) fighter.scielCritTimer = s.scielCritTimer;

    // Projéteis
    fighter.batmanBatarang = s.batmanBatarang;
    fighter.batmanBatmobile = s.batmanBatmobile;
    fighter.vaderThrowingSaber = s.vaderThrowingSaber;
    fighter.palpatineLightning = s.palpatineLightning;
    fighter.jokerAcidBlossom = s.jokerAcidBlossom;
    fighter.jokerCards = s.jokerCards || [];
    fighter.jokerJackInTheBox = s.jokerJackInTheBox;
    fighter.mcqueenDriftBurn = s.mcqueenDriftBurn;
    fighter.sparrowBlackPearl = s.sparrowBlackPearl;
    fighter.gustaveBullet = s.gustaveBullet;
    fighter.renoirBlackHole = s.renoirBlackHole;

    fighter.updateSkeletalPose();
  }

  broadcastHostState() {
    const snapshot = {
      p1: this.extractFighterSnapshot(this.p1),
      p2: this.extractFighterSnapshot(this.p2),
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

    if (snap.p1) this.applyFighterSnapshot(this.p1, snap.p1);
    if (snap.p2) this.applyFighterSnapshot(this.p2, snap.p2);

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
        // Ganha 8% de energia com o soco rápido (J) para premiar o combo starter, ou 5% nos demais
        const energyGained = this.p1.state === 'LIGHT_PUNCH' ? 8 : 5;
        this.p1.gainAttackEnergy(energyGained);
        let hitBoxP1 = this.p1.activeHitbox;
        // Sciel Buff de Crítico: se Sciel tiver cargas de crítico ativas, aplica chance / dano crítico massivo
        if (this.p1.scielCritCharges > 0) {
          const isCrit = Math.random() < 0.6 || hitBoxP1.isHeavy;
          if (isCrit) {
            hitBoxP1 = { ...hitBoxP1, damage: Math.round(hitBoxP1.damage * 1.85), isHeavy: true };
            if (this.particles) {
              this.particles.emitFloatingText('CRITICAL!', hitResult.point.x, hitResult.point.y - 40, '#fbbf24', true);
              this.particles.emitShockwave(hitResult.point.x, hitResult.point.y, 110, '#fbbf24');
              this.particles.emitSparks(hitResult.point.x, hitResult.point.y, '#f59e0b', 25, 8);
            }
          }
          this.p1.scielCritCharges--;
        }

        const hitLanded = this.p2.receiveHit(hitBoxP1, hitResult.point, this.particles);
        // Se acertou golpe sem ser bloqueado (defesas não contam como hit), Verso sobe de rank
        if (hitLanded && this.p1.isVerso) {
          this.p1.gainVersoHit();
        }

        if (hitBoxP1.isHeavy) {
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
        const energyGained = this.p2.state === 'LIGHT_PUNCH' ? 8 : 5;
        this.p2.gainAttackEnergy(energyGained);

        let hitBoxP2 = this.p2.activeHitbox;
        // Sciel Buff de Crítico para P2
        if (this.p2.scielCritCharges > 0) {
          const isCrit = Math.random() < 0.6 || hitBoxP2.isHeavy;
          if (isCrit) {
            hitBoxP2 = { ...hitBoxP2, damage: Math.round(hitBoxP2.damage * 1.85), isHeavy: true };
            if (this.particles) {
              this.particles.emitFloatingText('CRITICAL!', hitResult.point.x, hitResult.point.y - 40, '#fbbf24', true);
              this.particles.emitShockwave(hitResult.point.x, hitResult.point.y, 110, '#fbbf24');
              this.particles.emitSparks(hitResult.point.x, hitResult.point.y, '#f59e0b', 25, 8);
            }
          }
          this.p2.scielCritCharges--;
        }

        const hitLanded = this.p1.receiveHit(hitBoxP2, hitResult.point, this.particles);
        // Se acertou golpe sem ser bloqueado (defesas não contam como hit), Verso sobe de rank
        if (hitLanded && this.p2.isVerso) {
          this.p2.gainVersoHit();
        }

        if (hitBoxP2.isHeavy) {
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

    const p1IsRenoir = (this.p1.charData?.name || '').toLowerCase().includes('renoir');
    const p2IsGustave = (this.p2.charData?.name || '').toLowerCase().includes('gustave');
    const p2IsRenoir = (this.p2.charData?.name || '').toLowerCase().includes('renoir');
    const p1IsGustave = (this.p1.charData?.name || '').toLowerCase().includes('gustave');

    let renoirKiller = null;
    let gustaveVictim = null;

    if (this.p2.isDead) {
      this.p1Wins++;
      if (p1IsRenoir && p2IsGustave && this.p1Wins >= this.maxRounds) {
        renoirKiller = this.p1;
        gustaveVictim = this.p2;
      }
    } else if (this.p1.isDead) {
      this.p2Wins++;
      if (p2IsRenoir && p1IsGustave && this.p2Wins >= this.maxRounds) {
        renoirKiller = this.p2;
        gustaveVictim = this.p1;
      }
    }

    if (renoirKiller && gustaveVictim) {
      // Ativa Cinemática Especial: Renoir eliminando Gustave na vitória definitiva (2 pontos)
      // Não deve ter a mensagem de K.O. na tela
      this.statusMessage = '';
      this.statusSubMessage = '';
      this.statusTimer = 11.5; // Sequência estendida e dramática
      this.timeScale = 1.0;
      this.specialCinematic = {
        active: true,
        timer: 0,
        renoir: renoirKiller,
        gustave: gustaveVictim,
        phase: 'WALK_BACK',
        ghostTrail: [],
        beamActive: false,
        beamProgress: 0,
        beamStart: null,
        beamEnd: null,
        initialDist: Math.abs(renoirKiller.position.x - gustaveVictim.position.x),
        halfwayX: 0
      };

      // Gustave fica parado (imóvel) enquanto Renoir recua
      gustaveVictim.state = FIGHTER_STATE.IDLE;
      gustaveVictim.isWeakenedSway = false;
      gustaveVictim.isDesperateRunning = false;
      if (gustaveVictim.charData && gustaveVictim.charData.visual) {
        gustaveVictim.charData.visual.isSwordDrawn = false;
        gustaveVictim.charData.visual.hasLanceramBlade = false; // Espada oculta inicialmente
      }
      gustaveVictim.velocity.x = 0;
      gustaveVictim.velocity.y = 0;

      // Renoir começa se afastando andando para trás solenemente por 5s
      const awayDir = renoirKiller.position.x < gustaveVictim.position.x ? -1 : 1;
      renoirKiller.facing = -awayDir; // olhando para Gustave enquanto recua
      renoirKiller.state = FIGHTER_STATE.WALK_BACK;
    } else {
      this.statusMessage = 'K.O.!';
      this.statusTimer = 2.8;
      this.timeScale = 0.4;
      this.camera.addShake(16, 0.4);

      if (this.p1.isDead) {
        this.p2.state = FIGHTER_STATE.VICTORY;
      } else {
        this.p1.state = FIGHTER_STATE.VICTORY;
      }
    }
  }

  updateCinematic(dt) {
    if (!this.specialCinematic || !this.specialCinematic.active) return;
    const sc = this.specialCinematic;
    sc.timer += dt;
    const { renoir, gustave } = sc;

    // Garante que nenhuma mensagem de K.O. apareça durante a cinemática
    this.statusMessage = '';

    // Atualiza partículas da trilha fantasma
    if (sc.ghostTrail && sc.ghostTrail.length > 0) {
      for (const g of sc.ghostTrail) {
        g.alpha -= dt * 2.2;
      }
      sc.ghostTrail = sc.ghostTrail.filter((g) => g.alpha > 0);
    }

    // FASE 1 (0s a 5.0s): Renoir caminha para trás devagar enquanto Gustave fica parado
    if (sc.timer < 5.0) {
      sc.phase = 'WALK_BACK';
      const awayDir = renoir.position.x < gustave.position.x ? -1 : 1;
      renoir.facing = -awayDir; // encara Gustave enquanto recua
      renoir.state = FIGHTER_STATE.WALK_BACK;
      renoir.velocity.x = awayDir * (renoir.getEffectiveSpeed() * 0.42);

      // Gustave fica parado olhando
      gustave.state = FIGHTER_STATE.IDLE;
      gustave.isWeakenedSway = false;
      gustave.velocity.x = 0;
      gustave.velocity.y = 0;
    }
    // FASE 2 (5.0s a 5.4s): Renoir para. A espada de Gustave aparece do nada em sua mão com efeito luminoso!
    else if (sc.timer >= 5.0 && sc.timer < 5.4) {
      if (sc.phase !== 'SWORD_SPAWN') {
        sc.phase = 'SWORD_SPAWN';
        renoir.velocity.x = 0;
        renoir.state = FIGHTER_STATE.IDLE;
        renoir.isLeaningForward = true; // Renoir já se inclina observando

        // Espada de Gustave aparece do nada na mão!
        if (gustave.charData && gustave.charData.visual) {
          gustave.charData.visual.isSwordDrawn = true;
          gustave.charData.visual.hasLanceramBlade = false;
        }
        sounds.playRapierSlash();
        sounds.playDimensionalPierce();
        this.particles.emitSparks(gustave.position.x + gustave.facing * 25, gustave.position.y - 65, '#d4af37', 24, 7);
        this.particles.emitShockwave(gustave.position.x + gustave.facing * 25, gustave.position.y - 65, 45, '#fbbf24');

        // Calcula a metade do caminho entre Gustave e Renoir no momento em que Renoir parou
        sc.halfwayX = (gustave.position.x + renoir.position.x) / 2;
        sc.gustaveStartX = gustave.position.x;
      }
      gustave.state = FIGHTER_STATE.IDLE;
      gustave.velocity.x = 0;
    }
    // FASE 3 (5.4s a ~6.2s): Corrida desesperada de Gustave até a metade do caminho
    else if (sc.timer >= 5.4 && sc.phase !== 'PIERCE' && sc.phase !== 'COLLAPSE') {
      const gustaveDir = renoir.position.x > gustave.position.x ? 1 : -1;
      gustave.facing = gustaveDir;
      gustave.state = FIGHTER_STATE.WALK_FORWARD;
      gustave.isDesperateRunning = true; // animação de arrancada rápida inclinada com espada estendida

      // Corrida desesperada bem rápida (3x a velocidade de caminhada do Renoir)
      gustave.velocity.x = gustaveDir * (gustave.getEffectiveSpeed() * 1.55);

      // Efeito de poeira e esforço na corrida desesperada
      if (Math.random() < 0.35) {
        this.particles.emitDust(gustave.position.x, gustave.groundY, 2, '#64748b');
      }

      // Verifica se Gustave cruzou ou chegou na metade do caminho
      const reachedHalfway = gustaveDir === 1 ? (gustave.position.x >= sc.halfwayX) : (gustave.position.x <= sc.halfwayX);

      if (reachedHalfway && sc.phase !== 'TELEPORT') {
        sc.phase = 'TELEPORT';
        sc.teleportTriggerTime = sc.timer;
        gustave.velocity.x = 0;
        gustave.isDesperateRunning = false;
        renoir.isLeaningForward = false;
        sounds.playStaffBell();

        // Cria a trilha "fantasma" do Renoir
        const startX = renoir.position.x;
        // Surge rente a Gustave (a 35px, bem colado para perfuração no peito)
        const targetX = gustave.position.x + (gustave.facing * 35);
        const steps = 8;
        for (let i = 0; i <= steps; i++) {
          const tPos = i / steps;
          sc.ghostTrail.push({
            x: startX + (targetX - startX) * tPos,
            y: renoir.position.y,
            facing: -gustave.facing,
            alpha: 0.9 - (i / steps) * 0.35
          });
        }

        this.particles.emitSparks(renoir.position.x, renoir.position.y - 60, '#000000', 30, 8);
        this.particles.emitSparks(renoir.position.x, renoir.position.y - 60, '#ffffff', 25, 6);

        // Teleporta instantaneamente face a face com Gustave
        renoir.position.x = Math.max(80, Math.min(1920, targetX));
        renoir.facing = -gustave.facing;
        renoir.velocity.x = 0;
        renoir.velocity.y = 0;

        this.particles.emitShockwave(renoir.position.x, renoir.groundY, 110, '#ffffff');

        // Imediatamente transiciona para PIERCE
        sc.phase = 'PIERCE';
        sc.pierceStartTime = sc.timer;
        sounds.playDimensionalPierce();
        sounds.playThunderSlam();
        this.camera.addShake(24, 0.6);
        sc.beamActive = true;
      }
    }

    // FASE 4: Perfura Gustave no meio do tronco (duração de 3 segundos a partir do teletransporte)
    if (sc.phase === 'PIERCE') {
      const strikeTime = sc.timer - (sc.pierceStartTime || 6.2);
      renoir.state = FIGHTER_STATE.HEAVY_PUNCH;
      gustave.state = FIGHTER_STATE.HURT;
      gustave.isWeakenedSway = false;
      gustave.isDesperateRunning = false;
      gustave.velocity.x = 0;
      gustave.velocity.y = 0;

      // O feixe é curto antes de perfurar (0 a 0.25s), depois cresce cortando aos céus (0.25s a 3.0s)
      const lengthProgress = Math.min(1.0, strikeTime / 0.35);
      sc.beamProgress = lengthProgress;

      // ATRAVESSAR O MEIO DO TRONCO DE GUSTAVE:
      // O peito/tronco de Gustave fica em torno de groundY - 75px
      const gustaveTorsoX = gustave.position.x;
      const gustaveTorsoY = gustave.groundY - 75;

      // Início do feixe: pistola de Renoir (fica um pouco antes de perfurar o peito)
      const startX = renoir.position.x + (renoir.facing * 18);
      const startY = gustaveTorsoY + 28; // ligeiramente ascendente de baixo

      // Vetor que atravessa diretamente o centro do tronco de Gustave
      const dirX = gustaveTorsoX - startX;
      const dirY = gustaveTorsoY - startY;

      // O feixe se estende atravessando Gustave e projetando-se além de suas costas
      const endX = gustaveTorsoX + (dirX * (1.2 + 2.2 * lengthProgress));
      const endY = gustaveTorsoY + (dirY * (1.2 + 2.2 * lengthProgress)) - (80 * lengthProgress);

      sc.beamStart = { x: startX, y: startY };
      sc.beamEnd = { x: endX, y: endY };

      // Emissão contínua de faíscas sombrias e fragmentos/pétalas pretos e vermelhos
      if (Math.random() < 0.45) {
        this.camera.addShake(4, 0.08);
      }
      if (Math.random() < 0.65) {
        this.particles.emitSparks(gustaveTorsoX, gustaveTorsoY, '#000000', 6, 8);
        this.particles.emitSparks(gustaveTorsoX, gustaveTorsoY, '#ef4444', 5, 6);
        this.particles.emitSparks(gustaveTorsoX, gustaveTorsoY, '#ffffff', 4, 5);
      }

      // Após 3 segundos cravados de perfuração, o feixe se dissipa e Gustave desaba
      if (strikeTime >= 3.0) {
        sc.beamActive = false;
        sc.phase = 'COLLAPSE';
        gustave.state = FIGHTER_STATE.KNOCKDOWN;
        gustave.velocity.x = -gustave.facing * 3.5;
        gustave.velocity.y = -4;
        gustave.isDead = true;
        sounds.playKO();
        renoir.state = FIGHTER_STATE.VICTORY;
      }
    }
  }

  drawCinematicBeam(ctx) {
    if (!this.specialCinematic || !this.specialCinematic.active) return;
    const sc = this.specialCinematic;

    // 1. Desenha a trilha "fantasma" de Renoir
    if (sc.ghostTrail && sc.ghostTrail.length > 0 && sc.renoir) {
      ctx.save();
      for (const ghost of sc.ghostTrail) {
        ctx.globalAlpha = ghost.alpha * 0.55;
        ctx.save();
        ctx.translate(ghost.x, ghost.y);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.beginPath();
        ctx.ellipse(0, -60, 24, 65, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    // 2. Desenha o feixe de perfuração detalhado de 3 segundos
    if (!sc.beamActive || !sc.beamStart || !sc.beamEnd) return;
    const { beamStart, beamEnd } = sc;
    const strikeTime = sc.timer >= 6.0 ? (sc.timer - 6.0) : 0;

    ctx.save();
    // Borda exterior branca brilhante de rasgo dimensional
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 35;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.moveTo(beamStart.x, beamStart.y);
    ctx.lineTo(beamEnd.x, beamEnd.y);
    ctx.stroke();

    // Centro abissal preto como sombra na luz
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#050505';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(beamStart.x, beamStart.y);
    ctx.lineTo(beamEnd.x, beamEnd.y);
    ctx.stroke();

    // Faixa fina de luz pura no miolo
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(beamStart.x, beamStart.y);
    ctx.lineTo(beamEnd.x, beamEnd.y);
    ctx.stroke();

    // Pigmentos pretos de sombra ondulando dentro do feixe branco
    const dx = beamEnd.x - beamStart.x;
    const dy = beamEnd.y - beamStart.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const particleCount = 14;

    for (let p = 0; p < particleCount; p++) {
      const pT = ((p / particleCount) + strikeTime * 1.5) % 1.0;
      const curX = beamStart.x + dx * pT;
      const curY = beamStart.y + dy * pT;
      const waveOffset = Math.sin(strikeTime * 15 + p * 1.8) * 5;

      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(curX + waveOffset, curY - waveOffset, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Pétala escura/vermelha em suspensão
      if (p % 2 === 0) {
        ctx.fillStyle = 'rgba(185, 28, 28, 0.75)';
        ctx.beginPath();
        ctx.ellipse(curX - waveOffset * 1.5, curY + waveOffset, 4, 2, strikeTime * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
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

    if (this.graphicsMode === 'FULL_3D') {
      if (this.engine3D) {
        this.engine3D.update(this.p1, this.p2);
      }
    } else if (this.graphicsMode === 'MODE_2_5D' || this.graphicsMode === 'EXPEDITION_PBR_3D') {
      this.camera.applyTransform(ctx);
      if (this.isExpedition) {
        ExpeditionStageRenderer.draw(ctx, this.stageId || 'monolith_33', this.camera);
      } else {
        this.stage.draw(ctx, this.camera);
      }
      this.particles.draw(ctx);
      this.camera.restoreTransform(ctx);

      if (this.engine3D) {
        this.engine3D.update(this.p1, this.p2);
      }
    } else {
      // Modos 2D: STICK_2D, BELLE_EPOQUE_2D ou EXPEDITION_HD_SPRITES
      this.camera.applyTransform(ctx);
      if (this.isExpedition) {
        ExpeditionStageRenderer.draw(ctx, this.stageId || 'monolith_33', this.camera);
      } else {
        this.stage.draw(ctx, this.camera);
      }
      this.p1.draw(ctx, this.showHitboxes, this.graphicsMode, this.isExpedition);
      this.p2.draw(ctx, this.showHitboxes, this.graphicsMode, this.isExpedition);
      this.drawCinematicBeam(ctx);
      this.particles.draw(ctx);
      this.camera.restoreTransform(ctx);
    }
  }
}
