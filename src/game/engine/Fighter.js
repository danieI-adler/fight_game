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
    this.baseAttackPower = charData.stats.attackPower || 1.0;
    this.defense = charData.stats.defense || 1.0;

    // Habilidade Exclusiva de Verso: Sistema de Ranks E -> D -> C -> B -> A -> S
    this.isVerso = Boolean(charData.isVerso || Number(charData.id) === 106 || (charData.name || '').toLowerCase().includes('verso'));
    this.versoRanks = ['E', 'D', 'C', 'B', 'A', 'S'];
    this.versoRankMultipliers = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
    this.versoRankIndex = 0; // Inicia em E (0.75x)
    this.versoHitStreak = 0;
    this.attackPower = this.isVerso ? this.baseAttackPower * this.versoRankMultipliers[this.versoRankIndex] : this.baseAttackPower;

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

    // Habilidades Elementais e Efeitos de Status (Lune & outros)
    this.slowTimer = 0;
    this.burnTimer = 0;
    this.burnTickTimer = 0;
    this.luneElement = null; // 'ICE', 'FIRE', 'EARTH', 'WIND'
    this.luneIceLance = null; // { x, y, vx, active, damage, hasHit }
    this.luneFlameActive = false;
    this.luneEarthquakeTimer = 0;
    this.luneEarthquakeTick = 0;
    this.luneTornado = null; // { x, y, duration, zapTick, active }

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

    // Reinicia efeitos elementais e de status
    this.slowTimer = 0;
    this.burnTimer = 0;
    this.burnTickTimer = 0;
    this.luneElement = null;
    this.luneIceLance = null;
    this.luneFlameActive = false;
    this.luneEarthquakeTimer = 0;
    this.luneEarthquakeTick = 0;
    this.luneTornado = null;

    // Reinicia o rank do Verso em uma nova rodada
    if (this.isVerso) {
      this.versoRankIndex = 0;
      this.versoHitStreak = 0;
      this.attackPower = this.baseAttackPower * this.versoRankMultipliers[0];
    }
  }

  // --- HABILIDADE PASSIVA DE VERSO (STYLE RANK) ---
  gainVersoHit() {
    if (!this.isVerso) return;
    if (this.versoRankIndex < this.versoRanks.length - 1) {
      this.versoRankIndex++;
      this.attackPower = this.baseAttackPower * this.versoRankMultipliers[this.versoRankIndex];
    }
  }

  resetVersoRankOnHitTaken() {
    if (!this.isVerso) return;
    this.versoRankIndex = 0;
    this.versoHitStreak = 0;
    this.attackPower = this.baseAttackPower * this.versoRankMultipliers[0];
  }

  // --- CONTROLES ---

  getEffectiveSpeed() {
    return this.slowTimer > 0 ? this.speed * 0.48 : this.speed;
  }

  move(dir) {
    if (!this.canAct() || !this.isGrounded) return;
    this.velocity.x = dir * this.getEffectiveSpeed();

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
    const jumpPower = this.slowTimer > 0 ? this.jumpForce * 0.78 : this.jumpForce;
    this.velocity.y = -jumpPower;
    this.velocity.x = dirX * (this.getEffectiveSpeed() * 0.85);
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
    this.velocity.x = dir * (this.getEffectiveSpeed() * 2.2);
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
    if (this.charData?.hasNoSkills || this.isVerso) return;
    if (!this.canAct() || this.energy < 25) return;
    this.energy -= 25;
    this.state = FIGHTER_STATE.SPECIAL_1;
    this.stateTime = 0;
    this.hasHitCurrentAttack = false;
    sounds.playElectricZap();
    this.playCharacterVoice();
  }

  special2() {
    if (this.charData?.hasNoSkills || this.isVerso) return;
    if (!this.canAct() || this.energy < 35) return;
    this.energy -= 35;
    this.state = FIGHTER_STATE.SPECIAL_2;
    this.stateTime = 0;
    this.hasHitCurrentAttack = false;
    sounds.playElectricZap();
    this.playCharacterVoice();
  }

  superMove() {
    if (this.charData?.hasNoSkills || this.isVerso) return;
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
    } else if (this.superType === 'RENOIR_FLOWER') {
      this.superPhase = 'SUMMON_FLOWER';
      sounds.playWhoosh();
      sounds.playSuperCharge();
    } else if (this.superType === 'SCIEL_DARK_WAVE') {
      this.superPhase = 'DASH_IN';
      sounds.playWhoosh();
    } else if (this.superType === 'LUNE_ELEMENTAL') {
      const elements = ['ICE', 'FIRE', 'EARTH', 'WIND'];
      this.luneElement = elements[Math.floor(Math.random() * elements.length)];
      this.superPhase = 'CAST_' + this.luneElement;
      sounds.playSuperCharge();
      if (this.luneElement === 'ICE') {
        sounds.playIceSpell();
      } else if (this.luneElement === 'FIRE') {
        sounds.playFireCast();
      } else if (this.luneElement === 'EARTH') {
        sounds.playEarthquakeSound();
      } else if (this.luneElement === 'WIND') {
        sounds.playWindTornado();
      }
    } else {
      this.superType = 'GUSTAVE_SMASH';
      this.superPhase = 'CHARGE'; // 'CHARGE' (0-0.5s), 'LEAP' (0.5-0.85s), 'SLAM' (0.85-1.45s)
      sounds.playSuperCharge();
      this.playCharacterVoice();
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

    // Se Verso levar um golpe limpo (fora da defesa), o rank dele volta para E (75% do dano)
    this.resetVersoRankOnHitTaken();

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

    // 5.1 Atualização de Efeitos de Status Elementais
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (particles && Math.random() < 0.2) {
        particles.emitSparks(this.position.x + (Math.random() - 0.5) * 40, this.position.y - Math.random() * 80, '#38bdf8', 2, 2);
      }
    }

    if (this.burnTimer > 0 && !this.isDead) {
      this.burnTimer -= dt;
      this.burnTickTimer += dt;
      if (particles && Math.random() < 0.35) {
        particles.emitSparks(this.position.x + (Math.random() - 0.5) * 35, this.position.y - Math.random() * 70, '#f97316', 3, 3);
      }
      if (this.burnTickTimer >= 0.45) {
        this.burnTickTimer = 0;
        const burnDmg = 25;
        this.health = Math.max(0, this.health - burnDmg);
        if (particles) {
          particles.emitFloatingText(`-${burnDmg}`, this.position.x, this.position.y - 80, '#ef4444');
          particles.emitSparks(this.position.x, this.position.y - 50, '#f97316', 6, 4);
        }
        if (this.health <= 0 && !this.isDead) {
          this.health = 0;
          this.isDead = true;
          this.state = FIGHTER_STATE.KNOCKDOWN;
          this.velocity.x = -this.facing * 4;
          this.velocity.y = -6;
          this.isGrounded = false;
          sounds.playKO();
        }
      }
    }

    // 5.2 Terremoto de Lune (dano continuo no chão: bloqueio não reduz, apenas pulo salva)
    if (this.luneEarthquakeTimer > 0) {
      this.luneEarthquakeTimer -= dt;
      this.luneEarthquakeTick += dt;
      if (particles && Math.random() < 0.35) {
        const rx = this.position.x + (Math.random() - 0.5) * 650;
        particles.emitDust(rx, this.groundY, 4, '#a87132');
      }
      if (this.opponent && this.luneEarthquakeTick >= 0.38) {
        this.luneEarthquakeTick = 0;
        // BLOQUEIO NÃO REDUZ O DANO, APENAS PULO!
        if (this.opponent.isGrounded && !this.opponent.isInvulnerable && !this.opponent.isDead) {
          const earthDmg = 35;
          this.opponent.health = Math.max(0, this.opponent.health - earthDmg);
          if (particles) {
            particles.emitShockwave(this.opponent.position.x, this.groundY, 70, '#b45309');
            particles.emitDust(this.opponent.position.x, this.groundY, 5, '#78350f');
            particles.emitFloatingText(`-${earthDmg}`, this.opponent.position.x, this.opponent.position.y - 75, '#f59e0b');
          }
          if (this.opponent.health <= 0 && !this.opponent.isDead) {
            this.opponent.health = 0;
            this.opponent.isDead = true;
            this.opponent.state = FIGHTER_STATE.KNOCKDOWN;
            this.opponent.velocity.x = -this.opponent.facing * 5;
            this.opponent.velocity.y = -7;
            this.opponent.isGrounded = false;
            sounds.playKO();
          }
        }
      }
    }

    // 5.3 Furacão de Lune (persegue o alvo e causa dano via raios)
    if (this.luneTornado && this.luneTornado.active) {
      this.luneTornado.duration -= dt;
      if (this.opponent) {
        const dx = this.opponent.position.x - this.luneTornado.x;
        const dir = Math.sign(dx);
        this.luneTornado.x += dir * 210 * dt;
      }
      this.luneTornado.zapTick += dt;
      if (particles && Math.random() < 0.5) {
        particles.emitDust(this.luneTornado.x + (Math.random() - 0.5) * 50, this.groundY, 3, '#cbd5e1');
      }
      if (this.opponent && Math.abs(this.luneTornado.x - this.opponent.position.x) < 180 && this.luneTornado.zapTick >= 0.35) {
        this.luneTornado.zapTick = 0;
        if (!this.opponent.isInvulnerable && !this.opponent.isDead) {
          const zapDmg = 35;
          const isBlocked = this.opponent.isBlocking;
          const finalDmg = isBlocked ? Math.round(zapDmg * 0.3) : zapDmg;
          this.opponent.health = Math.max(0, this.opponent.health - finalDmg);
          sounds.playElectricZap();
          if (particles) {
            particles.emitElectricArc(this.luneTornado.x, this.groundY - 140, this.opponent.position.x, this.opponent.position.y - 60, '#00f0ff', 3);
            particles.emitSparks(this.opponent.position.x, this.opponent.position.y - 60, '#38bdf8', 12, 8);
            particles.emitFloatingText(`-${finalDmg}`, this.opponent.position.x, this.opponent.position.y - 85, '#00f0ff');
          }
          if (this.opponent.health <= 0 && !this.opponent.isDead) {
            this.opponent.health = 0;
            this.opponent.isDead = true;
            this.opponent.state = FIGHTER_STATE.KNOCKDOWN;
            this.opponent.velocity.x = -this.opponent.facing * 5;
            this.opponent.velocity.y = -7;
            this.opponent.isGrounded = false;
            sounds.playKO();
          }
        }
      }
      if (this.luneTornado.duration <= 0) {
        this.luneTornado.active = false;
      }
    }

    // 5.4 Estaca de Gelo de Lune (projétil voador)
    if (this.luneIceLance && this.luneIceLance.active) {
      this.luneIceLance.x += this.luneIceLance.vx * dt;
      if (particles && Math.random() < 0.6) {
        particles.emitSparks(this.luneIceLance.x, this.luneIceLance.y, '#bae6fd', 3, 3);
      }
      if (this.opponent && !this.luneIceLance.hasHit) {
        const hurtboxes = this.opponent.getHurtboxes();
        const lanceBox = new Box(this.luneIceLance.x - 45, this.luneIceLance.y - 18, 90, 36, 'hitbox');
        for (const hurt of hurtboxes) {
          if (lanceBox.intersects(hurt)) {
            this.luneIceLance.hasHit = true;
            this.luneIceLance.active = false;
            const attackData = {
              damage: this.luneIceLance.damage || 280,
              knockback: 18,
              knockdown: true,
              isHeavy: true,
              attackerPower: this.attackPower
            };
            this.opponent.takeHit(attackData, { x: this.luneIceLance.x, y: this.luneIceLance.y }, particles);
            this.opponent.slowTimer = 4.0; // Aplica slow de 4 segundos!
            sounds.playIceSpell();
            if (particles) {
              particles.emitShockwave(this.luneIceLance.x, this.luneIceLance.y, 120, '#38bdf8');
              particles.emitSparks(this.luneIceLance.x, this.luneIceLance.y, '#e0f2fe', 30, 10);
            }
            break;
          }
        }
      }
      if (this.luneIceLance.x < -100 || this.luneIceLance.x > stageWidth + 100) {
        this.luneIceLance.active = false;
      }
    }

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
    const maxLockTime = this.state === FIGHTER_STATE.SUPER_MOVE 
      ? ((this.superType === 'RENOIR_FLOWER' || this.superType === 'LUNE_ELEMENTAL') ? 2.0 : 1.6) 
      : 0.8;
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

    // Renderiza a insígnia de Rank de Estilo sobre a cabeça de Verso (E, D, C, B, A ou S)
    if (this.isVerso && !this.isDead) {
      this.drawVersoStyleRank(ctx);
    }

    // Renderiza a Flor Negra Titânica de Renoir
    if (this.superType === 'RENOIR_FLOWER' && this.state === FIGHTER_STATE.SUPER_MOVE) {
      this.drawRenoirBlackFlower(ctx);
    }

    // Renderiza o rasgo Dark Wave da Sciel
    if (this.superType === 'SCIEL_DARK_WAVE' && this._darkWaveCenterX != null) {
      this.drawScielDarkWave(ctx);
    }

    // Renderiza os Elementos de Lune (Estaca de Gelo, Lança-Chamas, Terremoto, Furacão)
    this.drawLuneElements(ctx);

    // Renderiza efeitos de status sobre o lutador (Geada de Slow, Chamas de Burn)
    this.drawStatusEffects(ctx);
  }

  drawRenoirBlackFlower(ctx) {
    const t = this.stateTime;
    const target = this.opponent;
    const targetX = target ? target.position.x : this.position.x + this.facing * 180;
    const groundY = this.groundY;

    // Altura da flor: paira a 220px acima do chão durante o carregamento (0s - 1.2s),
    // e aos 1.2s - 1.45s desce violentamente esmagando o chão.
    let flowerY = groundY - 210;
    let flowerScale = 1.0;

    if (t < 0.6) {
      // Florescendo e crescendo
      flowerScale = Math.min(1.0, t / 0.5) * 1.1;
      flowerY = groundY - 210 - Math.sin(t * 8) * 6;
    } else if (t < 1.2) {
      // Carregando energia com pulso
      flowerScale = 1.1 + Math.sin((t - 0.6) * 18) * 0.12;
      flowerY = groundY - 210 + Math.sin(t * 10) * 4;
    } else if (t < 1.45) {
      // Queda devastadora em direção ao chão
      const fallProgress = Math.min(1.0, (t - 1.2) / 0.22);
      flowerY = (groundY - 210) + (210 * Math.pow(fallProgress, 2.5));
      flowerScale = 1.2 + fallProgress * 0.4;
    } else {
      // Pós impacto - pétalas se dissipando no chão
      const fadeProgress = Math.min(1.0, (t - 1.45) / 0.4);
      flowerY = groundY - 15;
      flowerScale = 1.6 + fadeProgress * 0.4;
      ctx.globalAlpha = Math.max(0, 1.0 - fadeProgress);
    }

    ctx.save();
    ctx.translate(targetX, flowerY);

    // 1. Aura Negra e Neblina Sombria
    ctx.save();
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 35;

    const rot = t * 1.5;
    const petalCount = 8;
    const baseRadius = 55 * flowerScale;

    // Pétalas traseiras mais escuras
    for (let i = 0; i < petalCount; i++) {
      const angle = rot + (i * Math.PI * 2) / petalCount;
      const px = Math.cos(angle) * (baseRadius * 0.65);
      const py = Math.sin(angle) * (baseRadius * 0.65);

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle + Math.PI / 2);

      ctx.beginPath();
      ctx.ellipse(0, 0, 22 * flowerScale, 45 * flowerScale, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#09090b';
      ctx.fill();
      ctx.strokeStyle = '#44403c';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    // Pétalas dianteiras com gradiente de ébano e borda obsidiana brilhante
    for (let i = 0; i < petalCount; i++) {
      const angle = rot + Math.PI / petalCount + (i * Math.PI * 2) / petalCount;
      const px = Math.cos(angle) * (baseRadius * 0.45);
      const py = Math.sin(angle) * (baseRadius * 0.45);

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle + Math.PI / 2);

      ctx.beginPath();
      ctx.ellipse(0, 0, 18 * flowerScale, 38 * flowerScale, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#18181b';
      ctx.fill();
      ctx.strokeStyle = t >= 1.2 ? '#ef4444' : '#78716c';
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.restore();
    }

    // Centro / Núcleo Abissal da Flor
    ctx.beginPath();
    ctx.arc(0, 0, 26 * flowerScale, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();
    ctx.strokeStyle = t >= 1.2 ? '#f87171' : '#d4af37';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Runa interna de Renoir / Pistilo Carmesim & Dourado
    ctx.beginPath();
    ctx.arc(0, 0, 10 * flowerScale, 0, Math.PI * 2);
    ctx.fillStyle = t >= 1.2 ? '#dc2626' : '#a855f7';
    ctx.shadowColor = t >= 1.2 ? '#ef4444' : '#c084fc';
    ctx.shadowBlur = 20;
    ctx.fill();

    ctx.restore();
    ctx.restore();
  }

  drawScielDarkWave(ctx) {
    const cx = this._darkWaveCenterX;
    const cy = this._darkWaveCenterY;
    const t = this._darkWaveTime || 0;

    // Tamanho dos cortes (crescem rapidamente, depois mantêm)
    const maxLen = 180;
    const fadeStart = 0.6; // começa a desaparecer
    const fadeEnd = 1.05;   // totalmente invisível

    if (t >= fadeEnd) return;

    ctx.save();

    // Opacidade global do efeito (fade out)
    let alpha = 1.0;
    if (t >= fadeStart) {
      alpha = 1.0 - (t - fadeStart) / (fadeEnd - fadeStart);
    }
    alpha = Math.max(0, Math.min(1, alpha));

    // --- CORTE HORIZONTAL (aparece a partir de t=0) ---
    if (t >= 0) {
      const hProgress = Math.min(1, t / 0.08); // cresce em 80ms
      const hLen = maxLen * hProgress;

      ctx.save();
      ctx.globalAlpha = alpha;

      // Distorção visual: rasgo negro com borda branca brilhante
      // Borda externa branca (glow)
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 25;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(cx - hLen, cy);
      ctx.lineTo(cx + hLen, cy);
      ctx.stroke();

      // Centro negro (o rasgo em si)
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(cx - hLen, cy);
      ctx.lineTo(cx + hLen, cy);
      ctx.stroke();

      // Borda interna branca fina
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - hLen, cy);
      ctx.lineTo(cx + hLen, cy);
      ctx.stroke();

      ctx.restore();
    }

    // --- CORTE VERTICAL (aparece a partir de t=0.3) ---
    if (t >= 0.3) {
      const vProgress = Math.min(1, (t - 0.3) / 0.08);
      const vLen = maxLen * vProgress;

      ctx.save();
      ctx.globalAlpha = alpha;

      // Borda externa branca (glow)
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 25;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(cx, cy - vLen);
      ctx.lineTo(cx, cy + vLen);
      ctx.stroke();

      // Centro negro
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(cx, cy - vLen);
      ctx.lineTo(cx, cy + vLen);
      ctx.stroke();

      // Borda interna branca fina
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy - vLen);
      ctx.lineTo(cx, cy + vLen);
      ctx.stroke();

      ctx.restore();
    }

    // Centro do + : flash branco no cruzamento
    if (t >= 0.3 && alpha > 0.2) {
      ctx.save();
      ctx.globalAlpha = alpha * 0.8;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 30;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, 8 * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  drawVersoStyleRank(ctx) {
    const headX = this.position.x + (this.pose?.head?.x || 0);
    const headY = this.position.y + (this.pose?.head?.y || -115);
    const badgeY = headY - 32;

    const rankLetters = ['E', 'D', 'C', 'B', 'A', 'S'];
    const currentRank = rankLetters[this.versoRankIndex] || 'E';

    // Cores temáticas elegantes estilo Clair Obscur / Devil May Cry
    const rankColors = {
      E: { text: '#94a3b8', glow: 'rgba(148, 163, 184, 0.6)', border: '#475569', label: '75%' },
      D: { text: '#38bdf8', glow: 'rgba(56, 189, 248, 0.7)', border: '#0284c7', label: '100%' },
      C: { text: '#4ade80', glow: 'rgba(74, 222, 128, 0.75)', border: '#16a34a', label: '125%' },
      B: { text: '#fbbf24', glow: 'rgba(251, 191, 36, 0.8)', border: '#d97706', label: '150%' },
      A: { text: '#f97316', glow: 'rgba(249, 115, 22, 0.85)', border: '#ea580c', label: '175%' },
      S: { text: '#f43f5e', glow: 'rgba(244, 63, 94, 0.95)', border: '#e11d48', label: '200%' }
    };

    const style = rankColors[currentRank] || rankColors.E;
    const isMaxRank = currentRank === 'S';
    const bounce = isMaxRank ? Math.sin(this.stateTime * 14) * 2.5 : Math.sin(this.stateTime * 4) * 1.2;

    ctx.save();
    ctx.translate(headX, badgeY + bounce);

    // 1. Auréola / Brilho suave de fundo
    ctx.save();
    ctx.shadowColor = style.glow;
    ctx.shadowBlur = isMaxRank ? 18 : 10;

    // Losango / Emblema metálico
    const r = isMaxRank ? 16 : 14;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r, 0);
    ctx.lineTo(0, r);
    ctx.lineTo(-r, 0);
    ctx.closePath();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fill();

    ctx.strokeStyle = style.border;
    ctx.lineWidth = isMaxRank ? 2.5 : 1.8;
    ctx.stroke();

    // Detalhe interno se for Rank S
    if (isMaxRank) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(-6, -6, 12, 12);
    }
    ctx.restore();

    // 2. Letra do Rank
    ctx.font = isMaxRank ? '900 17px "Cinzel", "Times New Roman", serif' : 'bold 15px "Cinzel", "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = style.text;
    ctx.shadowColor = style.glow;
    ctx.shadowBlur = isMaxRank ? 12 : 6;
    ctx.fillText(currentRank, 0, 1);

    ctx.restore();
  }

  drawLuneElements(ctx) {
    // 1. Estaca de Gelo de Lune (projétil voador cristalino)
    if (this.luneIceLance && this.luneIceLance.active) {
      const lx = this.luneIceLance.x;
      const ly = this.luneIceLance.y;
      const dir = Math.sign(this.luneIceLance.vx) || 1;
      ctx.save();
      ctx.translate(lx, ly);
      ctx.scale(dir, 1);
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 18;

      // Corpo da estaca de gelo
      ctx.beginPath();
      ctx.moveTo(35, 0);
      ctx.lineTo(-25, -13);
      ctx.lineTo(-35, 0);
      ctx.lineTo(-25, 13);
      ctx.closePath();
      const grad = ctx.createLinearGradient(-35, 0, 35, 0);
      grad.addColorStop(0, '#0284c7');
      grad.addColorStop(0.5, '#38bdf8');
      grad.addColorStop(1, '#ffffff');
      ctx.fillStyle = grad;
      ctx.fill();

      // Reflexos cristalinos
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-35, 0);
      ctx.lineTo(35, 0);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Lança-Chamas de Lune
    if (this.luneFlameActive) {
      const startX = this.position.x + this.facing * 28;
      const startY = this.position.y - 65;
      const reach = 320;
      const t = this.stateTime;
      ctx.save();
      ctx.translate(startX, startY);
      ctx.scale(this.facing, 1);

      for (let i = 0; i < 3; i++) {
        const spread = 24 + i * 20;
        const wave = Math.sin(t * 25 + i * 2) * 8;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(reach * 0.45, -spread + wave, reach, -spread * 1.4);
        ctx.quadraticCurveTo(reach * 0.7, 0, reach, spread * 1.4);
        ctx.quadraticCurveTo(reach * 0.45, spread - wave, 0, 0);
        ctx.closePath();

        if (i === 0) {
          ctx.fillStyle = 'rgba(254, 240, 138, 0.85)';
          ctx.shadowColor = '#facc15';
          ctx.shadowBlur = 22;
        } else if (i === 1) {
          ctx.fillStyle = 'rgba(249, 115, 22, 0.7)';
          ctx.shadowColor = '#f97316';
          ctx.shadowBlur = 16;
        } else {
          ctx.fillStyle = 'rgba(220, 38, 38, 0.45)';
          ctx.shadowColor = '#dc2626';
          ctx.shadowBlur = 10;
        }
        ctx.fill();
      }
      ctx.restore();
    }

    // 3. Terremoto no Chão
    if (this.luneEarthquakeTimer > 0) {
      const gy = this.groundY;
      const cx = this.position.x;
      const pulse = (Math.sin(Date.now() * 0.03) + 1) * 0.5;
      ctx.save();
      ctx.shadowColor = '#d97706';
      ctx.shadowBlur = 16 + pulse * 10;

      // Fissuras no piso
      ctx.strokeStyle = `rgba(217, 119, 6, ${0.5 + pulse * 0.4})`;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      for (let offset = -420; offset <= 420; offset += 35) {
        const x1 = cx + offset;
        const yOffset = Math.sin(offset * 0.1 + Date.now() * 0.01) * 6;
        ctx.moveTo(x1, gy);
        ctx.lineTo(x1 + 18, gy - 10 + yOffset);
        ctx.lineTo(x1 + 35, gy);
      }
      ctx.stroke();

      // Linha de energia tectônica
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 460, gy - 2);
      ctx.lineTo(cx + 460, gy - 2);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Furacão (Tornado com Raios)
    if (this.luneTornado && this.luneTornado.active) {
      const tx = this.luneTornado.x;
      const gy = this.groundY;
      const now = Date.now() * 0.008;
      ctx.save();
      ctx.translate(tx, gy);

      // Vórtice espiral de vento
      const layers = 8;
      for (let l = 0; l < layers; l++) {
        const height = (l / layers) * 165;
        const radiusX = 14 + l * 7.5;
        const radiusY = 5 + l * 2.2;
        const spinOffset = Math.sin(now + l * 0.8) * 8;

        ctx.beginPath();
        ctx.ellipse(spinOffset, -height, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(203, 213, 225, ${0.35 + (l / layers) * 0.45})`;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.stroke();

        if (l % 2 === 0) {
          ctx.fillStyle = 'rgba(241, 245, 249, 0.08)';
          ctx.fill();
        }
      }

      // Raios elétricos crepitando no furacão
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      let rx = 0;
      let ry = 0;
      ctx.moveTo(rx, ry);
      for (let s = 1; s <= 4; s++) {
        rx += (Math.random() - 0.5) * 35;
        ry -= 35;
        ctx.lineTo(rx, ry);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  drawStatusEffects(ctx) {
    // Geada de Slow
    if (this.slowTimer > 0 && !this.isDead) {
      ctx.save();
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 14;
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 2;

      // Anéis de gelo nos pés
      ctx.beginPath();
      ctx.ellipse(this.position.x, this.position.y - 4, 32, 8, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Cristal gélido sobre a cabeça
      const hx = this.position.x + (this.pose?.head?.x || 0);
      const hy = this.position.y + (this.pose?.head?.y || -115) - 22;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hx, hy - 7); ctx.lineTo(hx, hy + 7);
      ctx.moveTo(hx - 7, hy); ctx.lineTo(hx + 7, hy);
      ctx.moveTo(hx - 5, hy - 5); ctx.lineTo(hx + 5, hy + 5);
      ctx.moveTo(hx - 5, hy + 5); ctx.lineTo(hx + 5, hy - 5);
      ctx.stroke();
      ctx.restore();
    }

    // Chamas de Burn (Queimando)
    if (this.burnTimer > 0 && !this.isDead) {
      ctx.save();
      const cx = this.position.x;
      const cy = this.position.y - 60;
      const t = Date.now() * 0.015;
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 16;
      for (let f = 0; f < 3; f++) {
        const ox = (f - 1) * 14 + Math.sin(t + f) * 4;
        const oy = Math.cos(t * 1.5 + f) * 6;
        ctx.beginPath();
        ctx.moveTo(cx + ox - 8, cy + 10);
        ctx.quadraticCurveTo(cx + ox, cy - 25 + oy, cx + ox, cy - 35 + oy);
        ctx.quadraticCurveTo(cx + ox + 6, cy - 20 + oy, cx + ox + 8, cy + 10);
        ctx.closePath();
        ctx.fillStyle = f === 1 ? 'rgba(254, 240, 138, 0.85)' : 'rgba(239, 68, 68, 0.75)';
        ctx.fill();
      }
      ctx.restore();
    }
  }
}
