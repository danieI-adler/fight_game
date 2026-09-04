import { Vector2D } from './Vector2D';
import { Box } from './Collision';
import { sounds } from '../audio/soundManager';

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

  special1() {
    if (!this.canAct() || this.energy < 25) return;
    this.energy -= 25;
    this.state = FIGHTER_STATE.SPECIAL_1;
    this.stateTime = 0;
    this.hasHitCurrentAttack = false;
    sounds.playElectricZap();
  }

  special2() {
    if (!this.canAct() || this.energy < 35) return;
    this.energy -= 35;
    this.state = FIGHTER_STATE.SPECIAL_2;
    this.stateTime = 0;
    this.hasHitCurrentAttack = false;
    sounds.playElectricZap();
  }

  superMove() {
    if (!this.canAct() || this.energy < 100) return;
    this.energy = 0;
    this.state = FIGHTER_STATE.SUPER_MOVE;
    this.stateTime = 0;
    this.hasHitCurrentAttack = false;
    this.isInvulnerable = true;
    sounds.playSuper();
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
        particles.emitFloatingText('DEFESA!', hitPoint.x, hitPoint.y - 30, '#38bdf8');
      }

      this.energy = Math.min(this.maxEnergy, this.energy + 1.25);
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
    const crouchFactor = this.isCrouching ? 0.6 : 1.0;
    const height = 120 * crouchFactor;

    return [
      new Box(x - 18, y - height, 36, 32 * crouchFactor, 'hurtbox'),
      new Box(x - 26, y - height + 28, 52, 55 * crouchFactor, 'hurtbox'),
      new Box(x - 24, y - (height * 0.4), 48, height * 0.4, 'hurtbox'),
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

    // 2. Gravidade
    if (!this.isGrounded) {
      this.velocity.y += this.gravity;
      this.position.y += this.velocity.y;

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
    this.position.x += this.velocity.x;
    if (this.isGrounded) {
      this.velocity.x *= 0.82;
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
    this.updateAttackStates(dt, particles);

    // 6. Watchdog de Segurança Anti-Travamento (Se ficar preso num estado de golpe por > 0.8s, reseta)
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
    if (attackStates.includes(this.state) && this.stateTime > 0.8) {
      this.state = this.isGrounded ? FIGHTER_STATE.IDLE : FIGHTER_STATE.JUMP;
      this.stateTime = 0;
      this.activeHitbox = null;
      this.isInvulnerable = false;
    }

    // 7. Pose Esquelética
    this.updateSkeletalPose();
  }

  updateAttackStates(dt, particles) {
    this.activeHitbox = null;

    switch (this.state) {
      case FIGHTER_STATE.LIGHT_PUNCH:
        if (this.stateTime > 0.05 && this.stateTime < 0.18) {
          this.activeHitbox = this.createHitbox(15, 95, 60, 30);
          this.activeHitbox.damage = 40;
          this.activeHitbox.knockback = 5;
          this.activeHitbox.isHeavy = false;
          this.activeHitbox.attackerPower = this.attackPower;
        }
        if (this.stateTime >= 0.22) {
          this.state = FIGHTER_STATE.IDLE;
        }
        break;

      case FIGHTER_STATE.HEAVY_PUNCH:
        if (this.stateTime > 0.1 && this.stateTime < 0.26) {
          this.activeHitbox = this.createHitbox(20, 100, 75, 35);
          this.activeHitbox.damage = 95;
          this.activeHitbox.knockback = 12;
          this.activeHitbox.isHeavy = true;
          this.activeHitbox.attackerPower = this.attackPower;

          if (particles && Math.random() < 0.3) {
            const sparkX = this.facing === 1 ? this.position.x + 65 : this.position.x - 65;
            particles.emitSparks(sparkX, this.position.y - 85, this.charData.themeColor, 3, 3);
          }
        }
        if (this.stateTime >= 0.38) {
          this.state = FIGHTER_STATE.IDLE;
        }
        break;

      case FIGHTER_STATE.LIGHT_KICK:
        if (this.stateTime > 0.05 && this.stateTime < 0.18) {
          this.activeHitbox = this.createHitbox(20, 65, 65, 35);
          this.activeHitbox.damage = 50;
          this.activeHitbox.knockback = 6;
          this.activeHitbox.isHeavy = false;
          this.activeHitbox.attackerPower = this.attackPower;
        }
        if (this.stateTime >= 0.24) {
          this.state = FIGHTER_STATE.IDLE;
        }
        break;

      case FIGHTER_STATE.HEAVY_KICK:
        if (this.stateTime > 0.1 && this.stateTime < 0.28) {
          this.activeHitbox = this.createHitbox(25, 90, 80, 40);
          this.activeHitbox.damage = 110;
          this.activeHitbox.knockback = 14;
          this.activeHitbox.knockdown = true;
          this.activeHitbox.isHeavy = true;
          this.activeHitbox.attackerPower = this.attackPower;
        }
        if (this.stateTime >= 0.42) {
          this.state = FIGHTER_STATE.IDLE;
        }
        break;

      case FIGHTER_STATE.CROUCH_PUNCH:
        if (this.stateTime > 0.05 && this.stateTime < 0.18) {
          this.activeHitbox = this.createHitbox(15, 45, 55, 25);
          this.activeHitbox.damage = 35;
          this.activeHitbox.knockback = 4;
          this.activeHitbox.isHeavy = false;
          this.activeHitbox.attackerPower = this.attackPower;
        }
        if (this.stateTime >= 0.22) {
          this.state = FIGHTER_STATE.CROUCH;
        }
        break;

      case FIGHTER_STATE.CROUCH_KICK:
        if (this.stateTime > 0.07 && this.stateTime < 0.22) {
          this.activeHitbox = this.createHitbox(20, 25, 70, 25);
          this.activeHitbox.damage = 65;
          this.activeHitbox.knockback = 9;
          this.activeHitbox.knockdown = true;
          this.activeHitbox.isHeavy = true;
          this.activeHitbox.attackerPower = this.attackPower;
        }
        if (this.stateTime >= 0.32) {
          this.state = FIGHTER_STATE.CROUCH;
        }
        break;

      case FIGHTER_STATE.JUMP_PUNCH:
        if (this.stateTime > 0.05 && this.stateTime < 0.22) {
          this.activeHitbox = this.createHitbox(15, 70, 55, 30);
          this.activeHitbox.damage = 60;
          this.activeHitbox.knockback = 7;
          this.activeHitbox.isHeavy = false;
          this.activeHitbox.attackerPower = this.attackPower;
        }
        if (this.stateTime >= 0.28) {
          this.state = this.isGrounded ? FIGHTER_STATE.IDLE : FIGHTER_STATE.JUMP;
        }
        break;

      case FIGHTER_STATE.JUMP_KICK:
        if (this.stateTime > 0.05 && this.stateTime < 0.26) {
          this.activeHitbox = this.createHitbox(20, 50, 70, 40);
          this.activeHitbox.damage = 85;
          this.activeHitbox.knockback = 11;
          this.activeHitbox.isHeavy = true;
          this.activeHitbox.attackerPower = this.attackPower;
        }
        if (this.stateTime >= 0.32) {
          this.state = this.isGrounded ? FIGHTER_STATE.IDLE : FIGHTER_STATE.JUMP;
        }
        break;

      case FIGHTER_STATE.DASH_FORWARD:
      case FIGHTER_STATE.DASH_BACK:
        if (this.stateTime >= 0.2) {
          this.state = FIGHTER_STATE.IDLE;
        }
        break;

      case FIGHTER_STATE.SPECIAL_1:
      case FIGHTER_STATE.SPECIAL_2:
        if (this.stateTime > 0.08 && this.stateTime < 0.3) {
          this.activeHitbox = this.createHitbox(25, 80, 100, 55);
          this.activeHitbox.damage = 140;
          this.activeHitbox.knockback = 16;
          this.activeHitbox.knockdown = true;
          this.activeHitbox.isHeavy = true;
          this.activeHitbox.attackerPower = this.attackPower;

          if (particles && Math.random() < 0.5) {
            const startX = this.position.x + (this.facing * 15);
            const endX = this.position.x + (this.facing * 110);
            particles.emitElectricArc(startX, this.position.y - 70, endX, this.position.y - 70, this.charData.themeColor);
          }
        }
        if (this.stateTime >= 0.45) {
          this.state = FIGHTER_STATE.IDLE;
        }
        break;

      case FIGHTER_STATE.SUPER_MOVE:
        if (this.stateTime > 0.12 && this.stateTime < 0.55) {
          this.activeHitbox = this.createHitbox(20, 100, 140, 80);
          this.activeHitbox.damage = 280;
          this.activeHitbox.knockback = 22;
          this.activeHitbox.knockdown = true;
          this.activeHitbox.isHeavy = true;
          this.activeHitbox.attackerPower = this.attackPower;

          if (particles) {
            const shockX = this.position.x + (this.facing * 70);
            particles.emitShockwave(shockX, this.position.y - 60, 90, this.charData.themeColor);
            particles.emitElectricArc(this.position.x, this.position.y - 60, shockX + (this.facing * 70), this.position.y - 60, this.charData.energyColor, 2);
          }
        }
        if (this.stateTime >= 0.75) {
          this.isInvulnerable = false;
          this.state = FIGHTER_STATE.IDLE;
        }
        break;

      case FIGHTER_STATE.KNOCKDOWN:
        // Transição automática para levantar ou derrota sem travar
        if (this.stateTime >= 0.65) {
          if (this.isDead) {
            this.state = FIGHTER_STATE.DEFEAT;
          } else {
            this.state = FIGHTER_STATE.GET_UP;
            this.stateTime = 0;
            this.isInvulnerable = true;
          }
        }
        break;

      case FIGHTER_STATE.GET_UP:
        if (this.stateTime >= 0.3) {
          this.isInvulnerable = false;
          this.state = FIGHTER_STATE.IDLE;
        }
        break;
    }
  }

  updateSkeletalPose() {
    const t = this.stateTime;
    const f = this.facing;
    const p = this.pose;

    p.head = { x: 0, y: -115 };
    p.chest = { x: 0, y: -80 };
    p.pelvis = { x: 0, y: -50 };

    switch (this.state) {
      case FIGHTER_STATE.IDLE: {
        const bounce = Math.sin(t * 7) * 3;
        p.head.y = -115 + bounce;
        p.chest.y = -80 + bounce;
        p.pelvis.y = -50 + bounce * 0.5;

        p.leftShoulder = { x: -8 * f, y: -85 + bounce };
        p.leftElbow = { x: 12 * f, y: -70 + bounce };
        p.leftHand = { x: 22 * f, y: -85 + bounce };

        p.rightShoulder = { x: 8 * f, y: -85 + bounce };
        p.rightElbow = { x: 25 * f, y: -65 + bounce };
        p.rightHand = { x: 35 * f, y: -75 + bounce };

        p.leftHip = { x: -10 * f, y: -50 };
        p.leftKnee = { x: -16 * f, y: -25 };
        p.leftFoot = { x: -18 * f, y: 0 };

        p.rightHip = { x: 10 * f, y: -50 };
        p.rightKnee = { x: 18 * f, y: -25 };
        p.rightFoot = { x: 22 * f, y: 0 };
        break;
      }

      case FIGHTER_STATE.WALK_FORWARD:
      case FIGHTER_STATE.WALK_BACK: {
        const walkCycle = Math.sin(t * 12);
        p.head.y = -115 + Math.abs(walkCycle) * 3;
        p.chest.y = -80 + Math.abs(walkCycle) * 3;

        p.leftFoot = { x: walkCycle * 25 * f, y: Math.max(0, -walkCycle * 15) };
        p.rightFoot = { x: -walkCycle * 25 * f, y: Math.max(0, walkCycle * 15) };
        p.leftKnee = { x: p.leftFoot.x * 0.6, y: -25 };
        p.rightKnee = { x: p.rightFoot.x * 0.6, y: -25 };

        p.leftHand = { x: -walkCycle * 18 * f + 15 * f, y: -80 };
        p.rightHand = { x: walkCycle * 18 * f + 25 * f, y: -80 };
        break;
      }

      case FIGHTER_STATE.CROUCH:
      case FIGHTER_STATE.CROUCH_BLOCK: {
        p.head.y = -75;
        p.chest.y = -50;
        p.pelvis.y = -30;
        p.leftKnee = { x: -15 * f, y: -15 };
        p.leftFoot = { x: -18 * f, y: 0 };
        p.rightKnee = { x: 20 * f, y: -15 };
        p.rightFoot = { x: 22 * f, y: 0 };

        p.leftHand = { x: 15 * f, y: -55 };
        p.rightHand = { x: 28 * f, y: -50 };
        break;
      }

      case FIGHTER_STATE.LIGHT_PUNCH: {
        const ext = Math.sin(Math.min(1, t / 0.22) * Math.PI);
        p.rightShoulder = { x: 10 * f, y: -85 };
        p.rightElbow = { x: (20 + ext * 30) * f, y: -85 };
        p.rightHand = { x: (25 + ext * 55) * f, y: -90 };
        break;
      }

      case FIGHTER_STATE.HEAVY_PUNCH: {
        const ext = Math.sin(Math.min(1, t / 0.38) * Math.PI);
        p.chest.x = (ext * 15) * f;
        p.rightShoulder = { x: 12 * f, y: -85 };
        p.rightElbow = { x: (25 + ext * 40) * f, y: -88 };
        p.rightHand = { x: (30 + ext * 70) * f, y: -92 };
        break;
      }

      case FIGHTER_STATE.LIGHT_KICK: {
        const ext = Math.sin(Math.min(1, t / 0.24) * Math.PI);
        p.rightKnee = { x: (15 + ext * 25) * f, y: -55 };
        p.rightFoot = { x: (20 + ext * 60) * f, y: -65 };
        break;
      }

      case FIGHTER_STATE.HEAVY_KICK: {
        const ext = Math.sin(Math.min(1, t / 0.42) * Math.PI);
        p.head.y = -105;
        p.pelvis.y = -60;
        p.rightKnee = { x: (20 + ext * 35) * f, y: -75 };
        p.rightFoot = { x: (25 + ext * 75) * f, y: -90 };
        break;
      }

      case FIGHTER_STATE.BLOCK: {
        p.leftHand = { x: 18 * f, y: -100 };
        p.rightHand = { x: 22 * f, y: -90 };
        p.leftElbow = { x: 12 * f, y: -75 };
        p.rightElbow = { x: 15 * f, y: -70 };
        break;
      }

      case FIGHTER_STATE.HURT: {
        p.head.x = -15 * f;
        p.head.y = -110;
        p.chest.x = -10 * f;
        p.leftHand = { x: -20 * f, y: -60 };
        p.rightHand = { x: -10 * f, y: -55 };
        break;
      }

      case FIGHTER_STATE.KNOCKDOWN:
      case FIGHTER_STATE.DEFEAT: {
        p.head = { x: -40 * f, y: -15 };
        p.chest = { x: -20 * f, y: -15 };
        p.pelvis = { x: 0, y: -10 };
        p.leftHand = { x: -35 * f, y: -5 };
        p.rightHand = { x: -15 * f, y: -5 };
        p.leftFoot = { x: 30 * f, y: 0 };
        p.rightFoot = { x: 45 * f, y: 0 };
        break;
      }
    }
  }

  draw(ctx, showHitboxes = false) {
    const x = this.position.x;
    const y = this.position.y;
    const { themeColor, secondaryColor, glowColor, energyColor } = this.charData;
    const p = this.pose;

    ctx.save();

    // Sombra no chão
    const shadowDist = Math.max(0, this.groundY - y);
    const shadowScale = Math.max(0.3, 1 - shadowDist / 300);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, this.groundY, 35 * shadowScale, 8 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fill();
    ctx.restore();

    // Aura de Energia
    if (this.energy > 30 || this.state === FIGHTER_STATE.SUPER_MOVE) {
      ctx.save();
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 16;
      ctx.strokeStyle = energyColor;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.4 + 0.3 * Math.sin(this.stateTime * 15);
      ctx.beginPath();
      ctx.arc(x + p.chest.x, y + p.chest.y, 45, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Desenho dos Membros Articulados
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;

    const drawLimb = (from, to, width = 6, color = secondaryColor) => {
      ctx.beginPath();
      ctx.moveTo(x + from.x, y + from.y);
      ctx.lineTo(x + to.x, y + to.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x + from.x, y + from.y);
      ctx.lineTo(x + to.x, y + to.y);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = width * 0.35;
      ctx.stroke();
    };

    drawLimb(p.pelvis, p.leftKnee, 7, secondaryColor);
    drawLimb(p.leftKnee, p.leftFoot, 6, secondaryColor);
    drawLimb(p.pelvis, p.rightKnee, 8, themeColor);
    drawLimb(p.rightKnee, p.rightFoot, 7, themeColor);

    drawLimb(p.pelvis, p.chest, 10, themeColor);

    drawLimb(p.chest, p.leftShoulder, 7, secondaryColor);
    drawLimb(p.leftShoulder, p.leftElbow, 6, secondaryColor);
    drawLimb(p.leftElbow, p.leftHand, 5, secondaryColor);

    drawLimb(p.chest, p.rightShoulder, 8, themeColor);
    drawLimb(p.rightShoulder, p.rightElbow, 7, themeColor);
    drawLimb(p.rightElbow, p.rightHand, 6, themeColor);

    // Cabeça
    ctx.beginPath();
    ctx.arc(x + p.head.x, y + p.head.y, 14, 0, Math.PI * 2);
    ctx.fillStyle = themeColor;
    ctx.fill();

    // Centro / Olhos
    ctx.beginPath();
    ctx.arc(x + p.head.x + (this.facing * 4), y + p.head.y - 2, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore();

    if (showHitboxes) {
      ctx.save();
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1.5;
      for (const box of this.getHurtboxes()) {
        ctx.strokeRect(box.x, box.y, box.width, box.height);
      }

      if (this.activeHitbox) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.fillRect(this.activeHitbox.x, this.activeHitbox.y, this.activeHitbox.width, this.activeHitbox.height);
        ctx.strokeRect(this.activeHitbox.x, this.activeHitbox.y, this.activeHitbox.width, this.activeHitbox.height);
      }
      ctx.restore();
    }

    ctx.restore();
  }
}
