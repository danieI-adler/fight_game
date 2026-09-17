import { Vector2D } from './Vector2D';
import { Box } from './Collision';
import { sounds } from '../audio/soundManager';
import { FighterRenderer } from './FighterRenderer';
import { StickRenderer } from './StickRenderer';
import { ExpeditionRenderer } from './ExpeditionRenderer';
import { ExpeditionHDRenderer } from './ExpeditionHDRenderer';
import { FighterAnimator } from './FighterAnimator';
import { FighterCombat } from './FighterCombat';
import { getCharacterBehavior } from '../characters/registry';

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

    // Habilidade Exclusiva de Monoco: Skill sempre pronta (Parry & Mimic)
    this.isMonoco = Boolean(charData.isMonoco || Number(charData.id) === 107 || (charData.name || '').toLowerCase().includes('monoco'));
    if (this.isMonoco) {
      this.energy = this.maxEnergy; // Monoco sempre tem a skill pronta!
    }

    // Identificação de Relâmpago McQueen: dano escala com velocidade
    this.isMcQueen = Boolean(
      (charData.name || '').toLowerCase().includes('mcqueen') ||
      (charData.name || '').toLowerCase().includes('relampago') ||
      charData.visual?.isVehicle ||
      charData.visual?.isMcQueen
    );

    // Identificação do Lote 1 dos Novos Personagens
    const cNameLower = (charData.name || '').toLowerCase();
    this.isGandalf = Boolean(cNameLower.includes('gandalf') || charData.hasRangedKick && cNameLower.includes('gandalf'));
    this.isGreenArrow = Boolean(cNameLower.includes('arqueiro') || cNameLower.includes('green arrow') || (charData.hasRangedKick && !this.isGandalf));
    this.isBanner = Boolean(cNameLower.includes('banner') || charData.isBannerTransform);
    this.isHulk = false; // Começa como cientista frágil; se transforma apenas após a Ultimate!
    this.isZorro = Boolean(cNameLower.includes('zorro') || charData.cannotBlock || charData.hasClashParry);

    // Identificação do Lote 2 dos Novos Personagens
    this.isAang = Boolean(cNameLower.includes('aang') || charData.superType === 'AVATAR_STATE_FOUR_ELEMENTS');
    this.isDoctorStrange = Boolean(cNameLower.includes('estranho') || cNameLower.includes('strange') || charData.hasSymmetricalPortals);
    this.isWalterWhite = Boolean(cNameLower.includes('walter') || cNameLower.includes('heisenberg'));
    this.isMessi = Boolean(cNameLower.includes('messi'));

    // Identificação do Lote 3 dos Novos Personagens (Capitão Nascimento, Rapunzel, Capitão América, Naruto)
    this.isNascimento = Boolean(cNameLower.includes('nascimento') || cNameLower.includes('bope'));
    this.isRapunzel = Boolean(cNameLower.includes('rapunzel') || charData.superType === 'RAPUNZEL_GOLDEN_HAIR_STORM');
    this.isCaptainAmerica = Boolean(cNameLower.includes('amrica') || cNameLower.includes('america') || cNameLower.includes('capito amrica') || cNameLower.includes('capitao america'));
    this.isNaruto = Boolean(cNameLower.includes('naruto') || charData.superType === 'NARUTO_RASEN_SHURIKEN');

    // Identificação do Lote 4 dos Novos Personagens (Sasuke, Bob Esponja, Homem de Ferro, Homem-Aranha)
    this.isSasuke = Boolean(cNameLower.includes('sasuke') || charData.superType === 'SASUKE_KIRIN');
    this.isSpongeBob = Boolean(cNameLower.includes('spongebob') || cNameLower.includes('esponja') || charData.superType === 'SPONGEBOB_BUBBLE_SPATULA');
    this.isIronMan = Boolean(cNameLower.includes('ferro') || cNameLower.includes('iron') || charData.superType === 'IRONMAN_UNIBEAM');
    this.isSpiderMan = Boolean(cNameLower.includes('aranha') || cNameLower.includes('spider') || charData.superType === 'SPIDERMAN_WEB_BARRAGE');

    // Identificação do Lote 5 dos Novos Personagens (Yoshi, Pikachu, Sonic, Bane)
    this.isYoshi = Boolean(cNameLower.includes('yoshi') || charData.superType === 'YOSHI_EGG_BOMBER');
    this.isPikachu = Boolean(cNameLower.includes('pikachu') || charData.superType === 'PIKACHU_THUNDER_STRIKE');
    this.isSonic = Boolean(cNameLower.includes('sonic') || charData.superType === 'SONIC_SUPER_TRANSFORMATION');
    this.isBane = Boolean(cNameLower.includes('bane') || charData.superType === 'BANE_BACKBREAKER');

    // Identificação do Lote 6 dos Novos Personagens (Drácula, Kirito, Eren, Bruce Lee)
    this.isDracula = Boolean(cNameLower.includes('dracula') || cNameLower.includes('drcula') || charData.superType === 'DRACULA_BLOOD_ECLIPSE');
    this.isKirito = Boolean(cNameLower.includes('kirito') || charData.superType === 'KIRITO_STARBURST_STREAM');
    this.isEren = Boolean(cNameLower.includes('eren') || charData.superType === 'EREN_TITAN_ROAR');
    this.isBruceLee = Boolean(cNameLower.includes('bruce lee') || cNameLower.includes('lee') && !cNameLower.includes('banner') || charData.superType === 'BRUCE_LEE_DRAGON_FURY');

    // Identificação do Lote 7 dos Novos Personagens (Goku, Yoda, Han Solo, Mario, Wolverine, Kratos)
    this.isGoku = Boolean(cNameLower.includes('goku') || charData.superType === 'GOKU_GENKI_DAMA');
    this.isYoda = Boolean(cNameLower.includes('yoda') || charData.superType === 'YODA_FORCE_UNLEASHED');
    this.isHanSolo = Boolean(cNameLower.includes('han solo') || cNameLower.includes('solo') || charData.superType === 'HAN_SOLO_CARPET_BOMB');
    this.isMario = Boolean(cNameLower.includes('mario') || charData.superType === 'MARIO_FINALE_FIRE');
    this.isWolverine = Boolean(cNameLower.includes('wolverine') || cNameLower.includes('wolwerine') || cNameLower.includes('logan') || charData.superType === 'WOLVERINE_BERSERKER_BARRAGE');
    this.isKratos = Boolean(cNameLower.includes('kratos') || charData.superType === 'KRATOS_SPARTAN_RAGE');

    // Identificação do Lote 8 dos Novos Personagens (Venom, Carnificina, Capitão Pátria / Homelander)
    this.isVenom = Boolean(cNameLower.includes('venom') || cNameLower.includes('venon') || charData.superType === 'VENOM_WE_ARE_VENOM');
    this.isCarnage = Boolean(cNameLower.includes('carnificina') || cNameLower.includes('carnage') || charData.superType === 'CARNAGE_MAXIMUM_CARNAGE');
    this.isHomelander = Boolean(cNameLower.includes('homelander') || cNameLower.includes('pátria') || cNameLower.includes('patria') || charData.superType === 'HOMELANDER_LASER_EYES');

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

    // Status Elementais universais
    this.slowTimer = 0;
    this.burnTimer = 0;
    this.burnTickTimer = 0;
    this.timeFreezeTimer = 0;
    this.extraType = null;
    this.extraAttackLevel = 1;

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
    this.behavior = getCharacterBehavior(this);
    if (this.behavior) {
      this.behavior.init(this);
    }
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

  reset(startX, keepEnergy = false) {
    this.position.x = startX !== undefined ? startX : (this.isPlayer2 ? 1400 : 600);
    this.position.y = this.groundY;
    this.velocity.set(0, 0);
    this.health = this.maxHealth;
    if (!keepEnergy) {
      this.energy = 0;
    }
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

    // Reinicia status elementais universais
    this.slowTimer = 0;
    this.burnTimer = 0;
    this.burnTickTimer = 0;
    this.timeFreezeTimer = 0;
    this.extraType = null;
    this.extraAttackLevel = 1;

    if (this.behavior) {
      this.behavior.reset(this, startX, keepEnergy);
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
    let s = this.slowTimer > 0 ? this.speed * 0.48 : this.speed;
    if (this.mcqueenSpeedBuffTimer > 0) {
      s *= this.mcqueenSpeedMultiplier;
    }
    return s;
  }

  move(dir) {
    if (!this.canAct() || !this.isGrounded) return;

    if (this.isCrouching) {
      this.velocity.x = dir * (this.getEffectiveSpeed() * 0.45);
      if (this.state === FIGHTER_STATE.IDLE || this.state === FIGHTER_STATE.WALK_FORWARD || this.state === FIGHTER_STATE.WALK_BACK) {
        this.state = FIGHTER_STATE.CROUCH;
      }
      return;
    }

    if (this.isBlocking && !this.isZorro) {
      // Andar bloqueando: velocidade reduzida em 50% mantendo postura de guarda
      this.velocity.x = dir * (this.getEffectiveSpeed() * 0.5);
      this.state = FIGHTER_STATE.BLOCK;
      this.lastAction = 'BLOCK';
      return;
    }

    this.velocity.x = dir * this.getEffectiveSpeed();

    if (dir === this.facing) {
      this.state = FIGHTER_STATE.WALK_FORWARD;
    } else if (dir === -this.facing) {
      this.state = FIGHTER_STATE.WALK_BACK;
      if (!this.isZorro) {
        this.isBlocking = true;
        this.lastAction = 'BLOCK';
      }
    }
  }

  stopMoving() {
    if (this.isCrouching) {
      this.velocity.x = 0;
      this.state = FIGHTER_STATE.CROUCH;
      return;
    }

    if (this.isBlocking && !this.isZorro) {
      this.velocity.x = 0;
      this.state = FIGHTER_STATE.BLOCK;
      return;
    }

    if (this.state === FIGHTER_STATE.WALK_FORWARD || this.state === FIGHTER_STATE.WALK_BACK) {
      this.velocity.x = 0;
      this.state = FIGHTER_STATE.IDLE;
      this.isBlocking = false;
    }
  }

  jump(dirX = 0) {
    if (!this.canAct() || this.jumpCooldown > 0) return;
    if (!this.isGrounded) {
      // 17 - Sonic: Double Jump enquanto em Super Sonic!
      if (this.canDoubleJump && !this.hasDoubleJumped) {
        this.hasDoubleJumped = true;
        this.jumpCooldown = 0.15;
        this.velocity.y = -(this.jumpForce * 0.95);
        this.velocity.x = dirX * (this.getEffectiveSpeed() * 0.9);
        this.state = FIGHTER_STATE.JUMP;
        sounds.playWhoosh();
        sounds.playDash();
        return;
      }
      return;
    }
    this.hasDoubleJumped = false;
    this.isGrounded = false;
    this.jumpCooldown = 0.22; // Cooldown de pulo
    this.lastAction = 'JUMP';
    const jumpPower = this.slowTimer > 0 ? this.jumpForce * 0.78 : this.jumpForce;
    this.velocity.y = -jumpPower;
    this.velocity.x = dirX * (this.getEffectiveSpeed() * 0.85);
    this.state = FIGHTER_STATE.JUMP;
    this.stateTime = 0;
    sounds.playJump();
  }

  crouch(isCrouching) {
    if (!this.canAct() && this.state !== FIGHTER_STATE.CROUCH) return;
    this.isCrouching = isCrouching;

    const attackStates = [
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
      FIGHTER_STATE.SUPER_MOVE
    ];

    if (attackStates.includes(this.state)) {
      return;
    }

    if (isCrouching) {
      this.lastAction = 'CROUCH';
      this.state = FIGHTER_STATE.CROUCH;
    } else if (this.state === FIGHTER_STATE.CROUCH) {
      this.state = FIGHTER_STATE.IDLE;
    }
  }

  block(isBlocking) {
    if (this.isZorro) {
      this.isBlocking = false;
      return; // 5 - Zorro não pode se defender!
    }
    // 12 - Naruto: Apertar E com clone ativo faz ele trocar de lugar instantaneamente!
    if (isBlocking && this.narutoClone && this.narutoClone.active) {
      const tempX = this.position.x;
      const tempY = this.position.y;
      this.position.x = this.narutoClone.x;
      this.position.y = this.narutoClone.y;
      this.narutoClone.x = tempX;
      this.narutoClone.y = tempY;
      sounds.playWhoosh();
      sounds.playDash();
      this.narutoClone.active = false;
      this.narutoClone = null;
      return;
    }
    if (!this.canAct() && this.state !== FIGHTER_STATE.BLOCK) return;
    this.isBlocking = isBlocking;
    if (isBlocking && this.isGrounded) {
      this.lastAction = 'BLOCK';
      this.velocity.x = 0;
      this.state = FIGHTER_STATE.BLOCK;
    } else if (this.state === FIGHTER_STATE.BLOCK) {
      this.state = FIGHTER_STATE.IDLE;
    }
  }

  dash(dir) {
    if (!this.canAct() || !this.isGrounded) return;
    this.state = dir === this.facing ? FIGHTER_STATE.DASH_FORWARD : FIGHTER_STATE.DASH_BACK;
    // 17 - Super Sonic possui dash estendido!
    const dashMult = (this.superSonicTimer > 0) ? 6.2 : 3.8;
    this.velocity.x = dir * (this.getEffectiveSpeed() * dashMult);
    this.stateTime = 0;
    sounds.playDash();
  }

  // --- 2 ATAQUES PADRÃO: SOCO E CHUTE (EM PÉ, AGACHADO E NO AR) ---

  punch() {
    if (!this.canAct()) return;
    this.lastAction = 'ATTACK';
    this.hasHitCurrentAttack = false;
    this.stateTime = 0;

    // 19 - Kirito: Em modo Empunhadura Dupla, o soco desfere golpe de espada Elucidator
    if (this.isKirito && (this.kiritoDualBladeActive || this.kiritoDualBladeTimer > 0)) {
      sounds.playRapierSlash();
    } else if (this.isNascimento && this.nascimentoGunTimer > 0) {
      // 9 - Capitão Nascimento: Desfere tiros com a arma sacada
      sounds.playGunshot();
      const bX = this.position.x + this.facing * 35;
      const bY = this.position.y - 65;
      this.gustaveBullet = {
        x: bX,
        y: bY,
        vx: this.facing * 1400,
        damage: 80,
        active: true,
        hasHit: false
      };
    }

    if (!this.isGrounded) {
      this.state = FIGHTER_STATE.JUMP_PUNCH;
      sounds.playWhoosh();
    } else if (this.isCrouching || this.state === FIGHTER_STATE.CROUCH) {
      this.isCrouching = true;
      this.velocity.x = 0;
      this.state = FIGHTER_STATE.CROUCH_PUNCH;
      sounds.playWhoosh();
    } else {
      this.velocity.x *= 0.25;
      this.state = FIGHTER_STATE.LIGHT_PUNCH;
      sounds.playWhoosh();
    }
  }

  kick() {
    if (!this.canAct()) return;
    this.lastAction = 'ATTACK';
    this.hasHitCurrentAttack = false;
    this.stateTime = 0;

    // 19 - Kirito: Em modo Empunhadura Dupla, o chute desfere golpe cruzado com a Dark Repulser
    if (this.isKirito && (this.kiritoDualBladeActive || this.kiritoDualBladeTimer > 0)) {
      sounds.playRapierSlash();
    }

    if (!this.isGrounded) {
      this.state = FIGHTER_STATE.JUMP_KICK;
      sounds.playWhoosh();
    } else if (this.isCrouching || this.state === FIGHTER_STATE.CROUCH) {
      this.isCrouching = true;
      this.velocity.x = 0;
      this.state = FIGHTER_STATE.CROUCH_KICK;
      sounds.playWhoosh();
    } else {
      this.velocity.x *= 0.25;
      this.state = FIGHTER_STATE.LIGHT_KICK;
      sounds.playWhoosh();

      // Gandalf e Arqueiro Verde: ÚNICOS dois personagens com projétil a distância no K (com balanceamento de cooldown e velocidade)
      if (this.isGandalf) {
        if (this.rangedKickCooldown <= 0) {
          this.rangedKickCooldown = 0.55; // Delay balanceado entre disparos
          sounds.playStaffBell();
          sounds.playElectricZap();
          const staffX = this.position.x + this.facing * 40;
          const staffY = this.position.y - 75;
          this.gandalfLightSpells.push({
            x: staffX,
            y: staffY,
            vx: this.facing * 880, // Velocidade balanceada e esquivável
            damage: 42, // Dano balanceado
            active: true,
            hasHit: false
          });
        }
      } else if (this.isGreenArrow) {
        if (this.rangedKickCooldown <= 0) {
          this.rangedKickCooldown = 0.5; // Delay balanceado entre flechas
          sounds.playWhoosh();
          const bowX = this.position.x + this.facing * 35;
          const bowY = this.position.y - 75;
          this.arrowProjectiles.push({
            x: bowX,
            y: bowY,
            vx: this.facing * 1050, // Velocidade balanceada
            vy: -30,
            gravity: 100,
            isTrick: false,
            type: 'NORMAL_ARROW',
            damage: 45, // Dano balanceado
            active: true,
            hasHit: false
          });
        }
      } else if (this.isAang && (this.aangAvatarStateActive || this.avatarStateTimer > 0)) {
        // 2 - Elemento AR de Aang: Rajada cortante de vento / Air Sweep (Apenas em Estado Avatar - 5s após ultimate)
        sounds.playWhoosh();
        const ax = this.position.x + this.facing * 35;
        const ay = this.position.y - 65;
        this.aangAirBlasts.push({
          x: ax,
          y: ay,
          vx: this.facing * 920,
          damage: 40,
          active: true,
          hasHit: false
        });
      }
    }
  }

  // Aliases retrocompatíveis
  lightPunch() { this.punch(); }
  heavyPunch() { this.punch(); }
  lightKick() { this.kick(); }
  heavyKick() { this.kick(); }
  crouchPunch() { this.punch(); }
  crouchKick() { this.kick(); }

  playCharacterVoice() {
    if (!this.charData) return;
    if (this.charData.voiceAbility === 'gustave_ability') {
      sounds.playGustaveAbility();
    } else if (this.charData.voiceAbility === 'mcqueen_katchau' || this.isMcQueen) {
      sounds.playMcQueenKatchau();
    } else if (this.charData.voiceAbility === 'kirito_starburst' || this.isKirito) {
      sounds.playKiritoStarburst();
    }
  }

  // --- ATAQUE EXTRA (Gasta 33% ou 66% de energia causando mais efeito/dano se 66%) ---
  specialAttack() {
    if (!this.canAct()) return;
    if (this.energy < 33) return;

    // Determina se usa 66% ou 33%
    const isLevel2 = this.energy >= 66;
    const energyCost = isLevel2 ? 66 : 33;
    this.energy -= energyCost;
    const level = isLevel2 ? 2 : 1;

    this.lastAction = 'ATTACK';
    this.state = FIGHTER_STATE.SPECIAL_1;
    this.stateTime = 0;
    this.hasHitCurrentAttack = false;
    this.extraAttackLevel = level;

    const charName = (this.charData?.name || '').toLowerCase();
    if (this.behavior && this.behavior.onSpecial(this, level)) {
      return;
    }

    this.extraType = 'GENERIC_EXTRA';
    sounds.playElectricZap();
  }

  special1() {
    this.specialAttack();
  }

  special2() {
    this.specialAttack();
  }

  superMove() {
    // Verso: Tecla Enter 1x por combate ascende diretamente para o Rank S!
    if (this.isVerso) {
      if (!this.versoEnterUsed) {
        this.versoEnterUsed = true;
        this.versoRankIndex = this.versoRanks.length - 1; // Rank 'S'
        this.attackPower = this.baseAttackPower * this.versoRankMultipliers[this.versoRankIndex];
        sounds.playSuperCharge();
        sounds.playSuper();
      }
      return;
    }

    if (this.charData?.hasNoSkills) return;
    if (!this.canAct() || this.energy < 100) return;
    this.energy = 0;
    this.state = FIGHTER_STATE.SUPER_MOVE;
    this.stateTime = 0;
    this.hasHitCurrentAttack = false;

    this.superType = this.charData?.superType || null;
    this.isInvulnerable = this.superType !== 'MONOCO_PARRY_MIMIC';

    if (this.behavior && this.behavior.onSuper(this)) {
      return;
    }

    this.superType = 'GUSTAVE_SMASH';
    this.superPhase = 'CHARGE';
    sounds.playSuperCharge();
    this.playCharacterVoice();
  }

  canAct() {
    if (this.timeFreezeTimer > 0) return false;

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

    // --- ESQUIVA EMBRIAGADA DE JACK SPARROW (Desvia dos próximos 3 ou 5 ataques) ---
    if (this.sparrowDodgeCharges > 0) {
      this.sparrowDodgeCharges--;
      sounds.playWhoosh();
      this.velocity.x = -this.facing * 6; // cambaleia para longe do golpe
      if (particles) {
        particles.emitSparks(this.position.x, this.position.y - 50, '#f59e0b', 12, 6);
      }
      if (this.sparrowDodgeCharges <= 0) {
        this.sparrowDrunkTimer = 0;
      }
      return false; // Desvia completamente de graça!
    }

    // --- PARRY E REFLEXÃO DE MONOCO ---
    // Se Monoco estiver na postura de Parry (PARRY_STANCE), ele não toma dano e reflete/copia!
    if (this.isMonoco && this.state === FIGHTER_STATE.SUPER_MOVE && this.superPhase === 'PARRY_STANCE') {
      sounds.playParryReflect();
      sounds.playStaffBell();

      const isSkill = Boolean(
        attackData?.isSuper ||
        attackData?.isSkill ||
        (this.opponent && [
          FIGHTER_STATE.SUPER_MOVE,
          FIGHTER_STATE.SPECIAL_1,
          FIGHTER_STATE.SPECIAL_2
        ].includes(this.opponent.state))
      );

      if (particles) {
        particles.emitShockwave(this.position.x, this.position.y - 60, isSkill ? 240 : 130, '#fbbf24');
        particles.emitSparks(this.position.x, this.position.y - 60, '#ffffff', isSkill ? 40 : 18, isSkill ? 14 : 7);
        particles.emitFloatingText(isSkill ? 'PARRY & MIMIC!' : 'PARRY COUNTER!', this.position.x, this.position.y - 110, '#f59e0b', isSkill);
      }

      this.executeMonocoReflect(attackData, particles, isSkill);
      return false; // NÃO TOMA DANO!
    }

    // --- ANULAÇÃO DE ATAQUE DO ZORRO (CLASH PARRY / CONTRAGOLPE) ---
    // Se Zorro atacar no mesmo momento em que recebe um golpe, anula completamente o ataque inimigo!
    if (this.isZorro) {
      const attackStates = [
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
        FIGHTER_STATE.SUPER_MOVE
      ];
      if (attackStates.includes(this.state)) {
        sounds.playRapierSlash();
        sounds.playParryReflect();
        if (particles) {
          particles.emitSwordSlash(this.position.x - this.facing * 40, this.position.y - 65, this.position.x + this.facing * 50, this.position.y - 65, '#fbbf24', 6);
          particles.emitSparks(hitPoint.x, hitPoint.y, '#fbbf24', 28, 10);
          particles.emitShockwave(hitPoint.x, hitPoint.y, 140, '#f59e0b');
        }
        // Item 5: Ele apenas cancela o dano de ambos os jogadores, ele não causa dano ao bloquear. Após block, próximo hit causa 150% dmg.
        this.zorroEmpoweredNextHit = true;
        return false; // ANULA O ATAQUE COMPLETAMENTE!
      }
    }

    const isGuarding = this.isBlocking || (this.state === FIGHTER_STATE.WALK_BACK && this.isGrounded);

    if (isGuarding && !attackData.unblockable) {
      // Capitão América: Passiva Defesa Impenetrável reduz o dano de bloqueio pela metade (50% menos chip damage)
      const chipFactor = this.isCaptainAmerica ? 0.075 : 0.15;
      const chipDamage = Math.max(1, Math.round(attackData.damage * chipFactor / this.defense));
      this.health = Math.max(0, this.health - chipDamage);

      // Guard cancel / recuperação acelerada se o lutador for IA Crazy ou Boss
      const isCrazyAI = this.isPlayer2 && (this.aiDifficulty === 'crazy' || this.aiTournamentLevel >= 9);
      this.blockstunTime = isCrazyAI ? 0.05 : 0.18;
      this.velocity.x = -this.facing * (attackData.knockback * (isCrazyAI ? 0.2 : 0.4));

      sounds.playBlock();
      if (particles) {
        particles.emitSparks(hitPoint.x, hitPoint.y, '#38bdf8', 8, 4);
      }

      // Defender não dá energia
      return false;
    }

    let attackerPwr = attackData.attackerPower || 1.0;
    if (attackData.attacker && attackData.attacker.isZorro && attackData.attacker.zorroEmpoweredNextHit) {
      attackerPwr *= 1.5; // Item 5: após block/clash, próximo hit causa 150% dmg
      attackData.attacker.zorroEmpoweredNextHit = false;
    }

    let actualDamage = Math.round(attackData.damage * attackerPwr / this.defense);
    if (this.captainShieldDefenseTimer > 0) {
      actualDamage = Math.round(actualDamage * 0.5); // Item 11: Defesa com escudo reduz 50% do dano!
    }
    if (this.kratosRageTimer > 0) {
      actualDamage = Math.round(actualDamage * 0.6); // Item 27: Fúria Espartana reduz dano sofrido
    }
    this.health = Math.max(0, this.health - actualDamage);
    // Ganha 2,5% de energia ao receber pancada (Bruce Banner em forma humana ganha o dobro: 5.0%)
    const energyGain = (this.isBanner && !this.isHulk) ? 5.0 : 2.5;
    this.energy = Math.min(this.maxEnergy, this.energy + energyGain);

    // Se Verso levar um golpe limpo (fora da defesa), o rank dele volta para E (75% do dano)
    this.resetVersoRankOnHitTaken();

    if (this.behavior) {
      this.behavior.onHitTaken(this, attackData);
    }

    if (attackData.isHeavy) {
      sounds.playPunch(true);
      if (particles) {
        particles.emitSparks(hitPoint.x, hitPoint.y, this.charData?.themeColor || '#ffaa00', 20, 8);
        particles.emitShockwave(hitPoint.x, hitPoint.y, 65, this.charData?.energyColor || '#ffffff');
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
      this.hitstunTime = attackData.hitstun !== undefined ? attackData.hitstun : (attackData.isHeavy ? 0.32 : 0.18);
      this.velocity.x = -this.facing * attackData.knockback;
    }

    return true;
  }

  // --- MECÂNICA DE REFLEXÃO E CÓPIA DE HABILIDADE (MONOCO) ---

  executeMonocoReflect(attackData, particles, isSkill = false) {
    const op = this.opponent;

    // SE NÃO FOR HABILIDADE (ATAQUE PADRÃO) -> REFLETE UM CONTRA-ATAQUE PADRÃO!
    if (!isSkill) {
      this.superType = 'MONOCO_PARRY_MIMIC';
      this.superPhase = 'PARRY_BASIC_COUNTER';
      this.stateTime = 0;
      this.isInvulnerable = false;
      sounds.playPunch(true);
      return;
    }

    // SE FOR HABILIDADE -> COPIA E ATIVA A HABILIDADE DO OPONENTE!
    const opSuper = op?.superType || op?.charData?.superType;

    if (opSuper === 'GUSTAVE_SMASH' || op?.charData?.name === 'Gustave') {
      this.superType = 'GUSTAVE_SMASH';
      this.superPhase = 'LEAP';
      this.stateTime = 0.5;
      this.isInvulnerable = true;
      const targetX = op ? op.position.x : this.position.x + this.facing * 320;
      this._superTargetX = targetX;
      this._superStartX = this.position.x;
      this.facing = (targetX - this.position.x) >= 0 ? 1 : -1;
      this.velocity.y = -15;
      this.velocity.x = 0;
      this.isGrounded = false;
      sounds.playSuper();
    } else if (opSuper === 'MAELLE_WALTZ' || op?.charData?.name === 'Maelle') {
      this.superType = 'MAELLE_WALTZ';
      this.superPhase = 'STRIKE_0';
      this.stateTime = 0;
      this.isInvulnerable = true;
      sounds.playRapierSlash();
    } else if (opSuper === 'RENOIR_FLOWER' || op?.charData?.name === 'Renoir') {
      this.superType = 'RENOIR_FLOWER';
      this.superPhase = 'SUMMON_FLOWER';
      this.stateTime = 0.45;
      this.isInvulnerable = true;
      sounds.playSuperCharge();
    } else if (opSuper === 'SCIEL_DARK_WAVE' || op?.charData?.name === 'Sciel') {
      this.superType = 'SCIEL_DARK_WAVE';
      this.superPhase = 'HORIZONTAL_CUT';
      this.stateTime = 0.25;
      this.isInvulnerable = true;
      sounds.playRapierSlash();
    } else if (opSuper === 'LUNE_ELEMENTAL' || op?.charData?.name === 'Lune') {
      this.superType = 'LUNE_ELEMENTAL';
      this.luneElement = op?.luneElement || 'FIRE';
      this.superPhase = 'CAST_' + this.luneElement;
      this.stateTime = 0.2;
      this.isInvulnerable = true;
      if (this.luneElement === 'ICE') sounds.playIceSpell();
      else if (this.luneElement === 'FIRE') sounds.playFireCast();
      else if (this.luneElement === 'EARTH') sounds.playEarthquakeSound();
      else sounds.playWindTornado();
    } else if (opSuper === 'PAINTRESS_CHROMATIC_WAVES' || op?.charData?.name === 'La Peintresse') {
      this.superType = 'PAINTRESS_CHROMATIC_WAVES';
      this.superPhase = 'WAVE_1';
      this.stateTime = 0.3;
      this.isInvulnerable = true;
      this._wavesSpawned = [false, false, false];
      sounds.playChromaticWaveCast();
    } else {
      // Contra-ataque de Reversão Místico do Cajado Gestral
      this.superType = 'MONOCO_PARRY_MIMIC';
      this.superPhase = 'MIMIC_BURST';
      this.stateTime = 0;
      this.isInvulnerable = true;
      sounds.playThunderSlam();
    }
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

    // 2. Gravidade e Modo de Voo Livre (Homelander)
    const isFreeFlying = Boolean(this.homelanderFlightTimer && this.homelanderFlightTimer > 0);

    if (isFreeFlying) {
      this.isGrounded = false;
      this.position.y += this.velocity.y * timeScale;
      // Amortece velocidade vertical suavemente quando não houver impulso
      this.velocity.y *= Math.pow(0.88, timeScale);
      if (Math.abs(this.velocity.y) < 0.05) this.velocity.y = 0;

      // Limite superior e inferior da arena
      if (this.position.y >= this.groundY) {
        this.position.y = this.groundY;
        if (this.velocity.y > 0) this.velocity.y = 0;
      } else if (this.position.y < 120) {
        this.position.y = 120;
        if (this.velocity.y < 0) this.velocity.y = 0;
      }
    } else if (!this.isGrounded) {
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

    if (this.rangedKickCooldown > 0) {
      this.rangedKickCooldown -= dt;
    }

    if (this.kiritoStarburstCooldown > 0) {
      this.kiritoStarburstCooldown -= dt;
    }

    // 4.1 RELÂMPAGO MCQUEEN: DANO ESCALA PROPORCIONAL À SUA VELOCIDADE ATUAL!
    if (this.isMcQueen) {
      const currentSpeed = Math.abs(this.velocity.x);
      const baseSpd = this.speed || 7.0;
      const speedRatio = currentSpeed / baseSpd;
      // Multiplicador de velocidade dinâmica: parte da base e sobe proporcionalmente à velocidade
      // Em repouso: 1.0x. Correndo normal: 1.25x. Correndo em buff de turbo (2x/3x) ou blitz: até 2.5x - 4.0x!
      let dynamicSpeedMult = 1.0 + Math.max(0, speedRatio) * 0.45;
      if (this.mcqueenSpeedBuffTimer > 0) {
        dynamicSpeedMult *= (this.mcqueenSpeedMultiplier || 1.0);
      }
      this.attackPower = this.baseAttackPower * dynamicSpeedMult;
      this.mcqueenCurrentDamageMultiplier = dynamicSpeedMult;
    }

    // 4.2 WOLVERINE: REGENERAÇÃO PASSIVA MUTANTE DO FATOR DE CURA (+8 HP por segundo)
    if (this.isWolverine && !this.isDead && this.health < this.maxHealth) {
      this.wolverineHealTimer = (this.wolverineHealTimer || 0) + dt;
      if (this.wolverineHealTimer >= 0.5) {
        this.wolverineHealTimer = 0;
        this.health = Math.min(this.maxHealth, this.health + 4);
        if (particles && Math.random() < 0.25) {
          particles.emitSparks(this.position.x, this.position.y - 45, '#22c55e', 3, 2);
        }
      }
    }

    // 5. Atualização de Ataques
    this.updateAttackStates(dt, particles, stageWidth);

    if (this.behavior) {
      this.behavior.update(this, dt, stageWidth, particles);
    }

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
      ? ((this.superType === 'RENOIR_FLOWER' || this.superType === 'LUNE_ELEMENTAL' || this.superType === 'PAINTRESS_CHROMATIC_WAVES' || this.superType === 'JOKER_GRAND_FINALE' || this.superType === 'JOKER_CROWBAR') ? 2.2 : 1.6) 
      : 0.8;
    if (attackStates.includes(this.state) && this.stateTime > maxLockTime) {
      // Se Vader estava no meio do choke e foi interrompido ou atingiu o watchdog, libera o oponente imediatamente
      if (this.superType === 'VADER_CHOKE' && this.opponent) {
        this.opponent.isInvulnerable = false;
        this.opponent.isGrounded = true;
        this.opponent.position.y = this.opponent.groundY;
        this.opponent.velocity.x = 0;
        this.opponent.velocity.y = 0;
        if (this.opponent.state === FIGHTER_STATE.HURT) {
          this.opponent.state = FIGHTER_STATE.IDLE;
        }
      }

      this.state = this.isGrounded ? FIGHTER_STATE.IDLE : FIGHTER_STATE.JUMP;
      this.stateTime = 0;
      this.activeHitbox = null;
      this.isInvulnerable = false;
      this.superPhase = null;
      this.superType = null;
      this.vaderChokeTarget = null;
    }

    // 7. Pose Esquelética
    this.updateSkeletalPose();
  }

  updateAttackStates(dt, particles, stageWidth = 2000) {
    FighterCombat.updateAttackStates(this, dt, particles, stageWidth);

    // Watchdogs Universais de Segurança (Garante que Kirito, Homem de Ferro, Goku, Han Solo e Homelander nunca travem!)
    if (this.state === FIGHTER_STATE.SPECIAL_1 && this.stateTime >= 0.42) {
      this.state = FIGHTER_STATE.IDLE;
      this.activeHitbox = null;
      this.extraType = null;
      this.isInvulnerable = false;
    }
    if (this.state === FIGHTER_STATE.SUPER_MOVE && this.stateTime >= 1.55) {
      this.state = FIGHTER_STATE.IDLE;
      this.activeHitbox = null;
      this.superPhase = null;
      this.isInvulnerable = false;
    }
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

    // Renderiza efeitos de status sobre o lutador (Geada de Slow, Chamas de Burn)
    this.drawStatusEffects(ctx);

    if (this.behavior) {
      this.behavior.draw(this, ctx);
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
    this.slowTimer = 0;
    this.burnTimer = 0;
    this.burnTickTimer = 0;
    this.timeFreezeTimer = 0;
    this.extraType = null;
    this.extraAttackLevel = 1;
