import { Fighter, FIGHTER_STATE } from './Fighter';
import { Camera } from './Camera';
import { Stage } from './Stage';
import { ParticleManager } from './Particles';
import { CollisionSystem } from './Collision';
import { InputHandler } from './InputHandler';
import { FighterAI } from '../ai/FighterAI';
import { sounds } from '../audio/soundManager';
import { getCharacterById } from '../characters/characterData';

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
    this.mode = 'VERSUS'; // 'VERSUS', 'ARCADE', 'TRAINING'
    this.status = GAME_STATUS.INTRO;
    this.roundTime = 99;
    this.roundTimer = 99;
    this.currentRound = 1;
    this.p1Wins = 0;
    this.p2Wins = 0;
    this.maxRounds = 2; // Melhor de 3
    this.statusMessage = 'ROUND 1';
    this.statusSubMessage = 'READY...';
    this.statusTimer = 0;

    // Lutadores
    this.p1 = new Fighter(getCharacterById(1), false, this.stage.groundY);
    this.p2 = new Fighter(getCharacterById(2), true, this.stage.groundY);
    this.p1.setOpponent(this.p2);
    this.p2.setOpponent(this.p1);

    // Hitstop (congelamento momentâneo de frame para impacto)
    this.hitstopFrames = 0;
    this.timeScale = 1.0;

    // Configurações
    this.showHitboxes = false;
    this.isTraining = false;

    // Callback para atualização de UI no React
    this.onStateChange = null;

    // Loop
    this.isRunning = false;
    this.animationFrameId = null;
    this.lastTime = performance.now();
    this.justPressedP1 = {};
    this.justPressedP2 = {};

    this.bindEvents();
  }

  bindEvents() {
    this.inputHandler.attach();

    window.addEventListener('keydown', (e) => {
      if (this.status !== GAME_STATUS.FIGHTING && this.status !== GAME_STATUS.INTRO) return;

      // P1 Just Pressed
      if (this.inputHandler.p1Binds.lightPunch.includes(e.code)) this.justPressedP1.lightPunch = true;
      if (this.inputHandler.p1Binds.heavyPunch.includes(e.code)) this.justPressedP1.heavyPunch = true;
      if (this.inputHandler.p1Binds.lightKick.includes(e.code)) this.justPressedP1.lightKick = true;
      if (this.inputHandler.p1Binds.heavyKick.includes(e.code)) this.justPressedP1.heavyKick = true;
      if (this.inputHandler.p1Binds.special1.includes(e.code)) this.justPressedP1.special1 = true;
      if (this.inputHandler.p1Binds.superMove.includes(e.code)) this.justPressedP1.superMove = true;

      // P2 Just Pressed
      if (this.inputHandler.p2Binds.lightPunch.includes(e.code)) this.justPressedP2.lightPunch = true;
      if (this.inputHandler.p2Binds.heavyPunch.includes(e.code)) this.justPressedP2.heavyPunch = true;
      if (this.inputHandler.p2Binds.lightKick.includes(e.code)) this.justPressedP2.lightKick = true;
      if (this.inputHandler.p2Binds.heavyKick.includes(e.code)) this.justPressedP2.heavyKick = true;
      if (this.inputHandler.p2Binds.special1.includes(e.code)) this.justPressedP2.special1 = true;
      if (this.inputHandler.p2Binds.superMove.includes(e.code)) this.justPressedP2.superMove = true;
    });
  }

  startFight(char1Id, char2Id, mode = 'VERSUS', difficulty = 'medium', stageId = 'cyber_arena') {
    this.mode = mode;
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
    this.statusSubMessage = 'FIGHT!';
    this.statusTimer = 2.2;
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

  // --- LOOP PRINCIPAL DO JOGO ---
  loop() {
    if (!this.isRunning) return;

    const now = performance.now();
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // Limitar delta time para evitar saltos
    if (dt > 0.1) dt = 0.1;

    this.update(dt * this.timeScale);
    this.render();

    // Notificar React para sincronizar o HUD
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

  // --- ATUALIZAÇÃO DA LÓGICA E FÍSICA ---
  update(dt) {
    // 1. Tratamento de Hitstop (Congelamento de impacto estilo Electricman/SF)
    if (this.hitstopFrames > 0) {
      this.hitstopFrames--;
      this.camera.update(this.p1, this.p2, dt);
      return;
    }

    // 2. Controle de Estados do Round (Intro / Luta / Fim de Round)
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
      // Timer do Round
      if (!this.isTraining) {
        this.roundTimer -= dt;
        if (this.roundTimer <= 0) {
          this.roundTimer = 0;
          this.handleTimeUp();
        }
      }

      // 3. Processar Entradas do Jogador 1
      this.inputHandler.updateFighterInput(this.p1, this.inputHandler.p1Binds, 0, this.justPressedP1);
      this.justPressedP1 = {};

      // 4. Processar Entradas do Jogador 2 (Ou IA)
      if (this.mode === 'VERSUS') {
        this.inputHandler.updateFighterInput(this.p2, this.inputHandler.p2Binds, 1, this.justPressedP2);
        this.justPressedP2 = {};
      } else {
        this.ai.update(this.p2, this.p1, dt);
      }

      // 5. Atualização dos Lutadores
      this.p1.update(dt, this.stage.width, this.particles);
      this.p2.update(dt, this.stage.width, this.particles);

      // 6. Resolução de Colisão de Corpos (Pushbox)
      CollisionSystem.resolvePushboxes(this.p1, this.p2);

      // 7. Detecção e Resolução de Golpes (Hitbox vs Hurtbox)
      this.checkCombatHits();

      // 8. Checar se alguém foi nocauteado
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

    // Atualização de Cenário, Câmera e Partículas
    this.stage.update(dt);
    this.particles.update(dt);
    this.camera.update(this.p1, this.p2, dt);
  }

  // --- CHECAGEM DE GOLPES ---
  checkCombatHits() {
    // P1 atacando P2
    if (this.p1.activeHitbox && !this.p1.hasHitCurrentAttack) {
      const hitResult = CollisionSystem.checkAttackHit(this.p1, this.p2);
      if (hitResult) {
        this.p1.hasHitCurrentAttack = true;
        this.p1.comboCount++;
        const connected = this.p2.receiveHit(this.p1.activeHitbox, hitResult.point, this.particles);

        // Screenshake & Hitstop
        if (this.p1.activeHitbox.isHeavy) {
          this.camera.addShake(12, 0.25);
          this.hitstopFrames = 5;
        } else {
          this.camera.addShake(4, 0.12);
          this.hitstopFrames = 2;
        }
      }
    }

    // P2 atacando P1
    if (this.p2.activeHitbox && !this.p2.hasHitCurrentAttack) {
      const hitResult = CollisionSystem.checkAttackHit(this.p2, this.p1);
      if (hitResult) {
        this.p2.hasHitCurrentAttack = true;
        this.p2.comboCount++;
        const connected = this.p1.receiveHit(this.p2.activeHitbox, hitResult.point, this.particles);

        if (this.p2.activeHitbox.isHeavy) {
          this.camera.addShake(12, 0.25);
          this.hitstopFrames = 5;
        } else {
          this.camera.addShake(4, 0.12);
          this.hitstopFrames = 2;
        }
      }
    }

    // Reset combos se nenhum golpe estiver ativo e hitstun zerou
    if (!this.p1.activeHitbox && this.p2.hitstunTime <= 0) this.p1.comboCount = 0;
    if (!this.p2.activeHitbox && this.p1.hitstunTime <= 0) this.p2.comboCount = 0;
  }

  handleKnockout() {
    this.status = GAME_STATUS.ROUND_END;
    this.statusMessage = 'K.O.!';
    this.statusTimer = 2.8;
    this.timeScale = 0.4; // Efeito de câmera lenta no K.O.
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
    this.statusMessage = 'TEMPO ESGOTADO!';
    this.statusTimer = 2.5;

    if (this.p1.health > this.p2.health) {
      this.p1Wins++;
      this.p2.state = FIGHTER_STATE.DEFEAT;
    } else if (this.p2.health > this.p1.health) {
      this.p2Wins++;
      this.p1.state = FIGHTER_STATE.DEFEAT;
    }
  }

  // --- RENDERIZAÇÃO DO FRAME ---
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Aplicar transformação da câmera dinâmica
    this.camera.applyTransform(ctx);

    // 1. Desenhar Cenário com Parallax
    this.stage.draw(ctx, this.camera);

    // 2. Desenhar Lutadores
    this.p1.draw(ctx, this.showHitboxes);
    this.p2.draw(ctx, this.showHitboxes);

    // 3. Desenhar Partículas e Efeitos de Impacto
    this.particles.draw(ctx);

    // Restaurar transformação
    this.camera.restoreTransform(ctx);
  }
}
