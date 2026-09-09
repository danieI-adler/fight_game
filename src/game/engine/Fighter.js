import { Vector2D } from './Vector2D';
import { Box } from './Collision';
import { sounds } from '../audio/soundManager';
import { FighterRenderer } from './FighterRenderer';
import { StickRenderer } from './StickRenderer';
import { ExpeditionRenderer } from './ExpeditionRenderer';
import { ExpeditionHDRenderer } from './ExpeditionHDRenderer';
import { FighterAnimator } from './FighterAnimator';
import { FighterCombat } from './FighterCombat';

export const FIGHTER_STATE = {
  IDLE: 'IDLE',
  WALK_FORWARD: 'WALK_FORWARD',
  WALK_BACK: 'WALK_BACK',
  JUMP: 'JUMP',
  CROUCH: 'CROUCH',
  BLOCK: 'BLOCK',
  DASH_FORWARD: 'DASH_FORWARD',
  DASH_BACK: 'DASH_BACK',
  LIGHT_PUNCH: 'LIGHT_PUNCH',
  HEAVY_PUNCH: 'HEAVY_PUNCH',
  LIGHT_KICK: 'LIGHT_KICK',
  HEAVY_KICK: 'HEAVY_KICK',
  CROUCH_PUNCH: 'CROUCH_PUNCH',
  CROUCH_KICK: 'CROUCH_KICK',
  JUMP_PUNCH: 'JUMP_PUNCH',
  JUMP_KICK: 'JUMP_KICK',
  SPECIAL_1: 'SPECIAL_1',
  SPECIAL_2: 'SPECIAL_2',
  SUPER_MOVE: 'SUPER_MOVE',
  HURT: 'HURT',
  KNOCKDOWN: 'KNOCKDOWN',
  GET_UP: 'GET_UP',
  VICTORY: 'VICTORY',
  DEFEAT: 'DEFEAT'
};

export class Fighter {
  constructor(charData, isPlayer2 = false, stageGroundY = 560) {
    this.charData = charData;
    this.isPlayer2 = isPlayer2;
    this.groundY = stageGroundY;

    // Posição e Física
    this.position = new Vector2D(isPlayer2 ? 1400 : 600, stageGroundY);
    this.velocity = new Vector2D(0, 0);
    this.gravity = 0.52; // Física de gravidade suave com tempo de suspensão natural
    this.facing = isPlayer2 ? -1 : 1;

    // Atributos
    this.maxHealth = charData.stats.health || 1000;
    this.health = this.maxHealth;
    this.energy = 0;
    this.maxEnergy = 100;
    this.speed = charData.stats.speed || 7.0;
    this.jumpForce = 13.8;
    this.attackPower = charData.stats.attackPower || 1.0;
    this.defense = charData.stats.defense || 1.0;

    // Estado e Animação
    this.state = FIGHTER_STATE.IDLE;
    this.stateTime = 0;
    this.animFrame = 0;
    this.isGrounded = true;
    this.isCrouching = false;
    this.isBlocking = false;
    this.isInvulnerable = false;
    this.isDead = false;
    this.jumpCooldown = 0; // Previne pulo duplo acidental

    // Sistema de Combate
    this.activeHitbox = null;
    this.hasHitCurrentAttack = false;
    this.comboCount = 0;
    this.hitstunTime = 0;
    this.blockstunTime = 0;
    this.hitstopTimer = 0;

    // Articulação Esquelética
    this.pose = {
      head: { x: 0, y: -115 },
      chest: { x: 0, y: -80 },
      pelvis: { x: 0, y: -50 },
      leftShoulder: { x: -10, y: -85 },
      leftElbow: { x: -20, y: -60 },
      leftHand: { x: -10, y: -45 },
      rightShoulder: { x: 10, y: -85 },
      rightElbow: { x: 20, y: -60 },
      rightHand: { x: 15, y: -45 },
      leftHip: { x: -10, y: -50 },
      leftKnee: { x: -15, y: -25 },
      leftFoot: { x: -10, y: 0 },
      rightHip: { x: 10, y: -50 },
      rightKnee: { x: 15, y: -25 },
      rightFoot: { x: 10, y: 0 },
    };

    this.opponent = null;
  }

  setOpponent(opponent) {
    this.opponent = opponent;
  }

  createHitbox(offsetX, offsetY, width, height) {
    const boxX = this.facing === 1 ? this.position.x + offsetX : this.position.x - offsetX - width;
    return new Box(boxX, this.position.y - offsetY, width, height, 'hitbox');
  }

  gainAttackEnergy(amount = 5) {
    this.energy = Math.min(this.maxEnergy, this.energy + amount);
  }

  reset(startX) {
    this.position.x = startX !== undefined ? startX : (this.isPlayer2 ? 1400 : 600);
    this.position.y = this.groundY;
    this.velocity.set(0, 0);
    this.health = this.maxHealth;
    this.energy = 0;
    this.state = FIGHTER_STATE.IDLE;
    this.stateTime = 0;
    this.isDead = false;
    this.isInvulnerable = false;
    this.comboCount = 0;
    this.hitstunTime = 0;
    this.blockstunTime = 0;
    this.jumpCooldown = 0;
    this.activeHitbox = null;
    this.facing = this.isPlayer2 ? -1 : 1;
  }

  // --- CONTROLES ---

  move(dir) {
    if (!this.canAct() || !this.isGrounded) return;
    this.velocity.x = dir * this.speed;

    if (dir === this.facing) {
      this.state = FIGHTER_STATE.WALK_FORWARD;
    } else if (dir === -this.facing) {
      this.state = FIGHTER_STATE.WALK_BACK;
      this.isBlocking = true;
    }
  }

  stopMoving() {
    if (this.state === FIGHTER_STATE.WALK_FORWARD || this.state === FIGHTER_STATE.WALK_BACK) {
      this.velocity.x = 0;
      this.isBlocking = false;
      this.state = FIGHTER_STATE.IDLE;
    }
  }

  jump(dirX = 0) {
    if (!this.canAct() || !this.isGrounded || this.jumpCooldown > 0) return;
    this.isGrounded = false;
    this.jumpCooldown = 0.22; // Cooldown de pulo
    this.velocity.y = -this.jumpForce;
    this.velocity.x = dirX * (this.speed * 0.85);
    this.state = FIGHTER_STATE.JUMP;
    this.stateTime = 0;
    sounds.playJump();
  }

  crouch(isCrouching) {
    if (!this.canAct() && this.state !== FIGHTER_STATE.CROUCH) return;
    if (!this.isGrounded) return;

    this.isCrouching = isCrouching;
    if (isCrouching) {
      this.velocity.x = 0;
      this.state = FIGHTER_STATE.CROUCH;
    } else if (this.state === FIGHTER_STATE.CROUCH) {
      this.state = FIGHTER_STATE.IDLE;
    }
  }

  block(isBlocking) {
    if (!this.canAct() && this.state !== FIGHTER_STATE.BLOCK) return;
    this.isBlocking = isBlocking;
    if (isBlocking && this.isGrounded) {
      this.velocity.x = 0;
      this.state = FIGHTER_STATE.BLOCK;
    } else if (this.state === FIGHTER_STATE.BLOCK) {
      this.state = FIGHTER_STATE.IDLE;
    }
  }

  dash(dir) {
    if (!this.canAct() || !this.isGrounded) return;
    this.state = dir === this.facing ? FIGHTER_STATE.DASH_FORWARD : FIGHTER_STATE.DASH_BACK;
    this.velocity.x = dir * (this.speed * 2.2);
    this.stateTime = 0;
    sounds.playDash();
  }

  // --- ATAQUES ---

  lightPunch() {
    if (!this.canAct()) return;
    this.velocity.x *= 0.3;
    this.state = !this.isGrounded ? FIGHTER_STATE.JUMP_PUNCH : (this.isCrouching ? FIGHTER_STATE.CROUCH_PUNCH : FIGHTER_STATE.LIGHT_PUNCH);
    this.stateTime = 0;
    this.hasHitCurrentAttack = false;
    sounds.playWhoosh();
  }

  heavyPunch() {
    if (!this.canAct()) return;
    this.velocity.x *= 0.2;
    this.state = !this.isGrounded ? FIGHTER_STATE.JUMP_PUNCH : FIGHTER_STATE.HEAVY_PUNCH;
    this.stateTime = 0;
    this.hasHitCurrentAttack = false;
    sounds.playWhoosh();
  }

  lightKick() {
    if (!this.canAct()) return;
    this.velocity.x *= 0.3;
    this.state = !this.isGrounded ? FIGHTER_STATE.JUMP_KICK : (this.isCrouching ? FIGHTER_STATE.CROUCH_KICK : FIGHTER_STATE.LIGHT_KICK);
    this.stateTime = 0;
    this.hasHitCurrentAttack = false;
    sounds.playWhoosh();
  }

  heavyKick() {
    if (!this.canAct()) return;
    this.velocity.x *= 0.2;
    this.state = !this.isGrounded ? FIGHTER_STATE.JUMP_KICK : FIGHTER_STATE.HEAVY_KICK;
    this.stateTime = 0;
    this.hasHitCurrentAttack = false;
    sounds.playWhoosh();
  }

  crouchPunch() {
    if (!this.canAct() || !this.isGrounded) return;
    this.isCrouching = true;
    this.velocity.x = 0;
    this.state = FIGHTER_STATE.CROUCH_PUNCH;
    this.stateTime = 0;
    this.hasHitCurrentAttack = false;
    sounds.playWhoosh();
  }

  crouchKick() {
    if (!this.canAct() || !this.isGrounded) return;
    this.isCrouching = true;
    this.velocity.x = 0;
    this.state = FIGHTER_STATE.CROUCH_KICK;
    this.stateTime = 0;
    this.hasHitCurrentAttack = false;
    sounds.playWhoosh();
  }

  playCharacterVoice() {
    if (!this.charData) return;
    if (this.charData.voiceAbility === 'gustave_ability') {
      sounds.playGustaveAbility();
    }
  }

  special1() {
    if (!this.canAct() || this.energy < 25) return;
    this.energy -= 25;
    this.state = FIGHTER_STATE.SPECIAL_1;
    this.stateTime = 0;
    this.hasHitCurrentAttack = false;
    sounds.playElectricZap();
    this.playCharacterVoice();
  }

  special2() {
    if (!this.canAct() || this.energy < 35) return;
    this.energy -= 35;
    this.state = FIGHTER_STATE.SPECIAL_2;
    this.stateTime = 0;
    this.hasHitCurrentAttack = false;
    sounds.playElectricZap();
    this.playCharacterVoice();
  }

  superMove() {
    if (!this.canAct() || this.energy < 100) return;
    this.energy = 0;
    this.state = FIGHTER_STATE.SUPER_MOVE;
    this.stateTime = 0;
    this.hasHitCurrentAttack = false;
    this.isInvulnerable = true;

    this.superType = this.charData?.superType || null;

    if (this.superType === 'MAELLE_WALTZ') {
      this.superPhase = 'STRIKE_0';
      sounds.playRapierSlash();
    } else {
      this.superType = 'GUSTAVE_SMASH';
      this.superPhase = 'CHARGE'; // 'CHARGE' (0-0.5s), 'LEAP' (0.5-0.85s), 'SLAM' (0.85-1.45s)
      sounds.playSuperCharge();
      this.checkGustaveVoice();
    }
  }

  canAct() {
    const lockStates = [
      FIGHTER_STATE.LIGHT_PUNCH,
      FIGHTER_STATE.HEAVY_PUNCH,
      FIGHTER_STATE.LIGHT_KICK,
      FIGHTER_STATE.HEAVY_KICK,
      FIGHTER_STATE.CROUCH_PUNCH,
      FIGHTER_STATE.CROUCH_KICK,
      FIGHTER_STATE.JUMP_PUNCH,
      FIGHTER_STATE.JUMP_KICK,
      FIGHTER_STATE.SPECIAL_1,
      FIGHTER_STATE.SPECIAL_2,
      FIGHTER_STATE.SUPER_MOVE,
      FIGHTER_STATE.DASH_FORWARD,
      FIGHTER_STATE.DASH_BACK,
      FIGHTER_STATE.HURT,
      FIGHTER_STATE.KNOCKDOWN,
      FIGHTER_STATE.GET_UP,
      FIGHTER_STATE.VICTORY,
      FIGHTER_STATE.DEFEAT
    ];
    return !this.isDead && this.hitstunTime <= 0 && this.blockstunTime <= 0 && !lockStates.includes(this.state);
  }

  // --- DANO ---

  receiveHit(attackData, hitPoint, particles) {
    if (this.isDead || this.isInvulnerable) return false;

    const isGuarding = this.isBlocking || (this.state === FIGHTER_STATE.WALK_BACK && this.isGrounded);

    if (isGuarding && !attackData.unblockable) {
      const chipDamage = Math.max(1, Math.round(attackData.damage * 0.15 / this.defense));
      this.health = Math.max(0, this.health - chipDamage);
      this.blockstunTime = 0.18;
      this.velocity.x = -this.facing * (attackData.knockback * 0.4);

      sounds.playBlock();
      if (particles) {
        particles.emitSparks(hitPoint.x, hitPoint.y, '#38bdf8', 8, 4);
      }

      // Defender não dá energia
      return false;
    }

    const actualDamage = Math.round(attackData.damage * (attackData.attackerPower || 1.0) / this.defense);
    this.health = Math.max(0, this.health - actualDamage);
    // Ganha 2,5% de energia ao receber pancada
    this.energy = Math.min(this.maxEnergy, this.energy + 2.5);

    if (attackData.isHeavy) {
      sounds.playPunch(true);
      if (particles) {
        particles.emitSparks(hitPoint.x, hitPoint.y, this.charData.themeColor || '#ffaa00', 20, 8);
        particles.emitShockwave(hitPoint.x, hitPoint.y, 65, this.charData.energyColor || '#ffffff');
        particles.emitElectricArc(hitPoint.x - 20, hitPoint.y - 20, hitPoint.x + 20, hitPoint.y + 20, this.charData.themeColor);
      }
    } else {
      sounds.playPunch(false);
      if (particles) {
        particles.emitSparks(hitPoint.x, hitPoint.y, '#ffea00', 12, 5);
      }
    }

    if (particles) {
      particles.emitFloatingText(`-${actualDamage}`, hitPoint.x, hitPoint.y - 25, attackData.isHeavy ? '#ff3b30' : '#ffffff', attackData.isHeavy);
    }

    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
      this.state = FIGHTER_STATE.KNOCKDOWN;
      this.velocity.x = -this.facing * (attackData.knockback * 1.4);
      this.velocity.y = -8;
      this.isGrounded = false;
      sounds.playKO();
    } else if (attackData.knockdown || !this.isGrounded) {
      this.state = FIGHTER_STATE.KNOCKDOWN;
      this.velocity.x = -this.facing * attackData.knockback;
      this.velocity.y = -7;
      this.isGrounded = false;
    } else {
      this.state = FIGHTER_STATE.HURT;
      this.hitstunTime = attackData.isHeavy ? 0.32 : 0.18;
      this.velocity.x = -this.facing * attackData.knockback;
    }

    return true;
  }

  getHurtboxes() {
    const x = this.position.x;
    const y = this.position.y;
    const crouchFactor = this.isCrouching ? 0.65 : 1.0;
    const height = 125 * crouchFactor;

    // Cabeça calculada com base na pose dinâmica do esqueleto
    const headX = x + (this.pose?.head?.x || 0);
    const headY = y + (this.pose?.head?.y || -115);

    return [
      // 1. Cabeça (cobre rosto, máscara, queixo e topo da cabeça)
      new Box(headX - 18, headY - 18, 36, 36 * (this.isCrouching ? 0.8 : 1.0), 'hurtbox'),
      // 2. Tronco / Peitoral
      new Box(x - 26, y - height + 30, 52, 54 * crouchFactor, 'hurtbox'),
      // 3. Pernas / Pés
      new Box(x - 24, y - (height * 0.42), 48, height * 0.42, 'hurtbox'),
    ];
  }

  getPushbox() {
    return new Box(this.position.x - 25, this.position.y - 120, 50, 120, 'pushbox');
  }

  // --- ATUALIZAÇÃO ---

  update(dt = 1 / 60, stageWidth = 2000, particles = null) {
    this.stateTime += dt;
    if (this.jumpCooldown > 0) this.jumpCooldown -= dt;

    // 1. Orientação
    if (this.opponent && this.canAct() && this.isGrounded) {
      this.facing = this.opponent.position.x > this.position.x ? 1 : -1;
    }

    // Fator de escala normalizado para 60 FPS
    const timeScale = dt * 60;

    // 2. Gravidade
    if (!this.isGrounded) {
      this.velocity.y += this.gravity * timeScale;
      this.position.y += this.velocity.y * timeScale;

      if (this.position.y >= this.groundY) {
        this.position.y = this.groundY;
        this.velocity.y = 0;
        this.isGrounded = true;

        if (particles) {
          particles.emitDust(this.position.x, this.groundY, 6);
        }

        if (this.state === FIGHTER_STATE.JUMP || this.state === FIGHTER_STATE.JUMP_PUNCH || this.state === FIGHTER_STATE.JUMP_KICK) {
          this.state = FIGHTER_STATE.IDLE;
          this.stateTime = 0;
        }
      }
    } else {
      this.position.y = this.groundY;
    }

    // 3. Física Horizontal
    this.position.x += this.velocity.x * timeScale;
    if (this.isGrounded) {
      this.velocity.x *= Math.pow(0.82, timeScale);
      if (Math.abs(this.velocity.x) < 0.1) this.velocity.x = 0;
    }

    this.position.x = Math.max(60, Math.min(stageWidth - 60, this.position.x));

    // 4. Hitstun & Blockstun
    if (this.hitstunTime > 0) {
      this.hitstunTime -= dt;
      if (this.hitstunTime <= 0 && !this.isDead) {
        this.state = FIGHTER_STATE.IDLE;
      }
    }
    if (this.blockstunTime > 0) {
      this.blockstunTime -= dt;
      if (this.blockstunTime <= 0) {
        this.state = FIGHTER_STATE.IDLE;
      }
    }

    // 5. Atualização de Ataques
    this.updateAttackStates(dt, particles, stageWidth);

    // 6. Watchdog de Segurança Anti-Travamento (Golpes comuns 0.8s, Super Move 1.6s)
    const attackStates = [
      FIGHTER_STATE.LIGHT_PUNCH,
      FIGHTER_STATE.HEAVY_PUNCH,
      FIGHTER_STATE.LIGHT_KICK,
      FIGHTER_STATE.HEAVY_KICK,
      FIGHTER_STATE.CROUCH_PUNCH,
      FIGHTER_STATE.CROUCH_KICK,
      FIGHTER_STATE.SPECIAL_1,
      FIGHTER_STATE.SPECIAL_2,
      FIGHTER_STATE.SUPER_MOVE,
      FIGHTER_STATE.DASH_FORWARD,
      FIGHTER_STATE.DASH_BACK
    ];
    const maxLockTime = this.state === FIGHTER_STATE.SUPER_MOVE ? 1.6 : 0.8;
    if (attackStates.includes(this.state) && this.stateTime > maxLockTime) {
      this.state = this.isGrounded ? FIGHTER_STATE.IDLE : FIGHTER_STATE.JUMP;
      this.stateTime = 0;
      this.activeHitbox = null;
      this.isInvulnerable = false;
      this.superPhase = null;
    }

    // 7. Pose Esquelética
    this.updateSkeletalPose();
  }

  updateAttackStates(dt, particles, stageWidth = 2000) {
    FighterCombat.updateAttackStates(this, dt, particles, stageWidth);
  }

  updateSkeletalPose() {
    FighterAnimator.updatePose(this);
  }

  draw(ctx, showHitboxes = false, graphicsMode = 'BELLE_EPOQUE_2D', isExpedition = false) {
    if (graphicsMode === 'EXPEDITION_HD_SPRITES') {
      ExpeditionHDRenderer.draw(ctx, this, showHitboxes);
    } else if (isExpedition) {
      ExpeditionRenderer.draw(ctx, this, showHitboxes);
    } else if (graphicsMode === 'STICK_2D') {
      StickRenderer.draw(ctx, this, showHitboxes);
    } else {
      FighterRenderer.draw(ctx, this, showHitboxes);
    }
  }
}
