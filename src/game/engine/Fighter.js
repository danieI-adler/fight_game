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

    // Habilidade Exclusiva de Monoco: Skill sempre pronta (Parry & Mimic)
    this.isMonoco = Boolean(charData.isMonoco || Number(charData.id) === 107 || (charData.name || '').toLowerCase().includes('monoco'));
    if (this.isMonoco) {
      this.energy = this.maxEnergy; // Monoco sempre tem a skill pronta!
    }

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
    this.lastAction = null; // 'BLOCK', 'JUMP', 'ATTACK', 'CROUCH'
    this.chromaticWaves = []; // La Peintresse: ondas cromáticas de energia no chão

    // Ataques Extras (33% ou 66% de energia)
    this.gustaveBullet = null; // { x, y, vx, damage, active }
    this.renoirBlackHole = null; // { x, y, timer, damage, active }
    this.paintressRealityTear = null; // { x, y, duration, freezeTime, active }
    this.timeFreezeTimer = 0; // tempo que o lutador fica congelado no tempo
    this.extraType = null;
    this.extraAttackLevel = 1;
    this.versoEnterUsed = false; // 1x por combate enter para Rank S
    this.isWeakenedSway = false; // cinemática especial: balançando atordoado em pé

    // Novas Habilidades & Ultimates dos 6 novos personagens
    this.batmanBatarang = null; // { x, y, vx, returning, originX, damage, active, hasHit }
    this.vaderThrowingSaber = null; // { x, y, vx, returning, startX, maxDist, damage, active, hasHit }
    this.palpatineLightning = null; // { timer, reach, damage, active }
    this.jokerAcidBlossom = null; // { x, y, vx, timer, damage, active, hasHit }
    this.sparrowDrunkTimer = 0; // chance de esquiva aumentada
    this.sparrowDodgeCharges = 0; // esquiva dos próximos 3 ou 5 ataques
    this.mcqueenDriftBurn = null; // { x, y, duration, active }
    this.mcqueenSpeedBuffTimer = 0; // dobra/triplica a velocidade por 5s
    this.mcqueenSpeedMultiplier = 1.0;
    
    // Ultimates
    this.batmanBatmobile = null; // { x, vx, active, hasHit, hitOpponent }
    this.vaderChokeTarget = null; // { target, timer, damageApplied }
    this.palpatineDualSabers = false; // flag para rodopio
    this.jokerCrowbarBeat = null; // { hitCount, timer, nextHitTime, target }
    this.sparrowBlackPearl = null; // { timer, shotsFired, maxShots: 3, interval: 5.0, cannonballs: [] }
    this.mcqueenBlitz = null; // { phase, timer, startX, targetX, hasHit }

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
    this.lastAction = null;
    this.chromaticWaves = [];

    // Reset de Ataques Extras & Ultimates
    this.gustaveBullet = null;
    this.renoirBlackHole = null;
    this.paintressRealityTear = null;
    this.batmanBatarang = null;
    this.vaderThrowingSaber = null;
    this.vaderChokeTarget = null;
    this.palpatineLightning = null;
    this.palpatineDualSabers = false;
    this.jokerAcidBlossom = null;
    this.jokerCrowbarBeat = null;
    this.sparrowDrunkTimer = 0;
    this.sparrowDodgeCharges = 0;
    this.sparrowBlackPearl = null;
    this.mcqueenDriftBurn = null;
    this.mcqueenSpeedBuffTimer = 0;
    this.mcqueenSpeedMultiplier = 1.0;
    this.mcqueenBlitz = null;
    this.batmanBatmobile = null;
    this.timeFreezeTimer = 0;
    this.extraType = null;
    this.extraAttackLevel = 1;
    this.versoEnterUsed = false;
    this.isWeakenedSway = false;

    // Reinicia o rank do Verso em uma nova rodada
    if (this.isVerso) {
      this.versoRankIndex = 0;
      this.versoHitStreak = 0;
      this.attackPower = this.baseAttackPower * this.versoRankMultipliers[0];
    }

    // Monoco sempre mantém energia cheia para sua skill
    if (this.isMonoco) {
      this.energy = this.maxEnergy;
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

    this.velocity.x = dir * this.getEffectiveSpeed();

    if (dir === this.facing) {
      this.state = FIGHTER_STATE.WALK_FORWARD;
    } else if (dir === -this.facing) {
      this.state = FIGHTER_STATE.WALK_BACK;
      this.isBlocking = true;
      this.lastAction = 'BLOCK';
    }
  }

  stopMoving() {
    if (this.isCrouching) {
      this.velocity.x = 0;
      return;
    }
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
    this.lastAction = 'JUMP';
    const jumpPower = this.slowTimer > 0 ? this.jumpForce * 0.78 : this.jumpForce;
    this.velocity.y = -jumpPower;
    this.velocity.x = dirX * (this.getEffectiveSpeed() * 0.85);
    this.state = FIGHTER_STATE.JUMP;
    this.stateTime = 0;
    sounds.playJump();
  }

  crouch(isCrouching) {
    if (!this.isGrounded) return;

    // Se estiver executando um ataque (ex: soco ou chute agachado), mantém isCrouching mas NÃO interrompe o golpe
    const attackStates = [
      FIGHTER_STATE.CROUCH_PUNCH,
      FIGHTER_STATE.CROUCH_KICK,
      FIGHTER_STATE.LIGHT_PUNCH,
      FIGHTER_STATE.HEAVY_PUNCH,
      FIGHTER_STATE.LIGHT_KICK,
      FIGHTER_STATE.HEAVY_KICK,
      FIGHTER_STATE.SPECIAL_1,
      FIGHTER_STATE.SPECIAL_2,
      FIGHTER_STATE.SUPER_MOVE,
      FIGHTER_STATE.HURT,
      FIGHTER_STATE.KNOCKDOWN,
      FIGHTER_STATE.GET_UP
    ];

    this.isCrouching = isCrouching;

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
    this.velocity.x = dir * (this.getEffectiveSpeed() * 2.2);
    this.stateTime = 0;
    sounds.playDash();
  }

  // --- 2 ATAQUES PADRÃO: SOCO E CHUTE (EM PÉ, AGACHADO E NO AR) ---

  punch() {
    if (!this.canAct()) return;
    this.lastAction = 'ATTACK';
    this.hasHitCurrentAttack = false;
    this.stateTime = 0;

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
      this.state = FIGHTER_STATE.HEAVY_KICK;
      sounds.playWhoosh();
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

    // 1. Gustave: tiro de pistola de longo alcance
    if (charName.includes('gustave')) {
      this.extraType = 'GUSTAVE_GUN';
      sounds.playGunshot();
      const gunX = this.position.x + this.facing * 35;
      const gunY = this.position.y - 82;
      this.gustaveBullet = {
        x: gunX,
        y: gunY,
        vx: this.facing * 1400, // projétil extremamente veloz
        damage: level === 2 ? 160 : 100,
        active: true,
        hasHit: false
      };
    }
    // 2. Maelle: dash relâmpago atravessando o inimigo e se reposicionando do outro lado
    else if (charName.includes('maelle')) {
      this.extraType = 'MAELLE_BLINK_DASH';
      sounds.playRapierSlash();
      sounds.playDash();
      this.isInvulnerable = true;
      const op = this.opponent;
      const targetX = op ? op.position.x + (this.facing * 100) : this.position.x + (this.facing * 250);
      this.position.x = Math.max(70, Math.min(1930, targetX));
      if (op) {
        this.facing = (op.position.x - this.position.x) >= 0 ? 1 : -1;
      }
      // Dano aplicado no corte do dash
      if (op && !op.isDead) {
        const attackData = {
          damage: level === 2 ? 180 : 110,
          knockback: 12,
          knockdown: level === 2,
          isHeavy: level === 2,
          attackerPower: this.attackPower
        };
        op.receiveHit(attackData, { x: this.position.x, y: this.position.y - 70 }, null);
      }
    }
    // 3. Lune: cura percentual do HP com efeito visual verde
    else if (charName.includes('lune')) {
      this.extraType = 'LUNE_HEAL';
      sounds.playHealSound();
      const healPercent = level === 2 ? 0.30 : 0.15;
      const healAmount = Math.round(this.maxHealth * healPercent);
      this.health = Math.min(this.maxHealth, this.health + healAmount);
    }
    // 4. Renoir: bate a bengala no chão, buraco negro surge sob o alvo (exige pulo no timing correto)
    else if (charName.includes('renoir')) {
      this.extraType = 'RENOIR_BLACK_HOLE';
      sounds.playBlackHoleSound();
      const target = this.opponent;
      const holeX = target ? target.position.x : this.position.x + this.facing * 180;
      this.renoirBlackHole = {
        x: holeX,
        y: this.groundY,
        timer: 0.65, // tempo de delay até a eclosão
        hasExploded: false,
        damage: level === 2 ? 220 : 140,
        active: true,
        level: level
      };
    }
    // 5. Monoco: giro com cajado 360° causando dano ao redor
    else if (charName.includes('monoco')) {
      this.extraType = 'MONOCO_STAFF_SPIN';
      sounds.playStaffBell();
      sounds.playWhoosh();
    }
    // 6. La Peintresse: corte na realidade no chão paralisando quem pisar
    else if (charName.includes('peintresse') || charName.includes('paintress')) {
      this.extraType = 'PAINTRESS_REALITY_TEAR';
      sounds.playDimensionalPierce();
      const tearX = this.position.x + this.facing * 140;
      this.paintressRealityTear = {
        x: tearX,
        y: this.groundY,
        duration: 5.0, // permanece no chão por 5s
        freezeTime: level === 2 ? 2.4 : 1.2, // congela o oponente por 2.4s ou 1.2s
        active: true
      };
    }
    // 7. Batman: Lançamento de Batarangue que viaja até o fim do mapa e volta
    else if (charName.includes('batman')) {
      this.extraType = 'BATMAN_BATARANG';
      sounds.playWhoosh();
      const bx = this.position.x + this.facing * 35;
      const by = this.position.y - 75;
      this.batmanBatarang = {
        x: bx,
        y: by,
        vx: this.facing * 1100,
        returning: false,
        originFighter: this,
        damage: level === 2 ? 160 : 100,
        active: true,
        hasHitOut: false,
        hasHitBack: false
      };
    }
    // 8. Darth Vader: Arremesso de Sabre de Luz Giratório (vai para frente e retorna)
    else if (charName.includes('vader')) {
      this.extraType = 'VADER_SABER_THROW';
      sounds.playWhoosh();
      sounds.playDimensionalPierce();
      const sx = this.position.x + this.facing * 40;
      const sy = this.position.y - 75;
      this.vaderThrowingSaber = {
        x: sx,
        y: sy,
        startX: sx,
        vx: this.facing * 950,
        maxDist: level === 2 ? 450 : 350,
        returning: false,
        originFighter: this,
        damage: level === 2 ? 180 : 120,
        active: true,
        hasHitOut: false,
        hasHitBack: false,
        rot: 0
      };
    }
    // 9. Palpatine: Relâmpagos da Força contínuos
    else if (charName.includes('palpatine')) {
      this.extraType = 'PALPATINE_FORCE_LIGHTNING';
      sounds.playElectricZap();
      const reach = level === 2 ? 480 : 350;
      this.palpatineLightning = {
        timer: level === 2 ? 0.9 : 0.5,
        reach: reach,
        damage: level === 2 ? 210 : 135,
        active: true
      };
      const target = this.opponent;
      if (target && !target.isDead) {
        const dist = Math.abs(target.position.x - this.position.x);
        const facingTarget = (target.position.x - this.position.x) * this.facing > 0;
        if (facingTarget && dist < reach) {
          const attackData = {
            damage: level === 2 ? 210 : 135,
            knockback: 10,
            knockdown: false,
            isHeavy: true,
            attackerPower: this.attackPower
          };
          target.receiveHit(attackData, { x: target.position.x, y: target.position.y - 70 }, null);
        }
      }
    }
    // 10. Coringa: Acid Blossom (esguicho rápido de ácido que atinge e deixa em pé stunado)
    else if (charName.includes('coringa') || charName.includes('joker')) {
      this.extraType = 'JOKER_ACID_BLOSSOM';
      sounds.playWhoosh();
      const ax = this.position.x + this.facing * 30;
      const ay = this.position.y - 82;
      this.jokerAcidBlossom = {
        x: ax,
        y: ay,
        vx: this.facing * 1200,
        damage: level === 2 ? 150 : 95,
        active: true,
        hasHit: false
      };
    }
    // 11. Jack Sparrow: Garrafa de Rum e Caminhar Bêbado de Esquiva (desvia dos próximos 3 ou 5 ataques)
    else if (charName.includes('jack') || charName.includes('sparrow')) {
      this.extraType = 'SPARROW_DRUNKEN_RUM';
      sounds.playHealSound();
      sounds.playWhoosh();
      this.sparrowDodgeCharges = level === 2 ? 5 : 3; // desvia dos próximos 3 ou 5 ataques!
      this.sparrowDrunkTimer = 10.0; // mantém a pose bêbada enquanto tiver cargas
    }
    // 12. Relâmpago McQueen: Drift & Queima de Pneus + Dobro ou Triplo de Velocidade por 5 segundos
    else if (charName.includes('mcqueen') || charName.includes('relampago')) {
      this.extraType = 'MCQUEEN_DRIFT_BURNOUT';
      sounds.playDash();
      sounds.playThunderSlam();
      this.mcqueenSpeedBuffTimer = 5.0; // Ganha velocidade por 5 segundos
      this.mcqueenSpeedMultiplier = level === 2 ? 3.0 : 2.0; // Dobro no lv1, triplo no lv2!
      this.mcqueenDriftBurn = {
        x: this.position.x,
        y: this.groundY,
        facing: this.facing,
        duration: 2.5,
        damage: level === 2 ? 40 : 25,
        tick: 0,
        active: true
      };
      // Arranque veloz instantâneo
      this.velocity.x = this.facing * (this.speed * 2.5);
    }
    // Personagens genéricos: golpe padrão fortificado
    else {
      this.extraType = 'GENERIC_EXTRA';
      sounds.playElectricZap();
    }
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

    if (this.superType === 'MONOCO_PARRY_MIMIC') {
      this.superPhase = 'PARRY_STANCE';
      sounds.playStaffBell();
      sounds.playWhoosh();
    } else if (this.superType === 'MAELLE_WALTZ') {
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
      // Controle do elemento de Lune baseado na ação anterior do jogador:
      // Bloquear -> Gelo (ICE)
      // Pular -> Ar (WIND)
      // Atacar -> Fogo (FIRE)
      // Agachar -> Terra (EARTH)
      if (this.lastAction === 'BLOCK' || this.isBlocking || this.state === FIGHTER_STATE.BLOCK || this.state === FIGHTER_STATE.WALK_BACK) {
        this.luneElement = 'ICE';
      } else if (this.lastAction === 'JUMP' || !this.isGrounded || this.state === FIGHTER_STATE.JUMP) {
        this.luneElement = 'WIND';
      } else if (this.lastAction === 'CROUCH' || this.isCrouching || this.state === FIGHTER_STATE.CROUCH) {
        this.luneElement = 'EARTH';
      } else if (this.lastAction === 'ATTACK') {
        this.luneElement = 'FIRE';
      } else {
        this.luneElement = 'ICE';
      }

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
    } else if (this.superType === 'PAINTRESS_CHROMATIC_WAVES') {
      this.superPhase = 'SUMMON_WAVES';
      sounds.playSuperCharge();
      sounds.playChromaticWaveCast();
    } else if (this.superType === 'BATMAN_BATMOBILE') {
      this.superPhase = 'SUMMON_CAR';
      sounds.playSuperCharge();
      sounds.playWhoosh();
      // O Batmóvel surge veloz de trás ou da frente dependendo do facing
      const spawnX = this.position.x - this.facing * 500;
      this.batmanBatmobile = {
        x: spawnX,
        vx: this.facing * 1400,
        active: true,
        hasHit: false
      };
      // Batman dá um mortal no ar invulnerável para não ser atropelado
      this.velocity.y = -16;
      this.velocity.x = this.facing * 2;
      this.isGrounded = false;
    } else if (this.superType === 'VADER_CHOKE') {
      this.superPhase = 'CHOKE_LIFT';
      sounds.playSuperCharge();
      sounds.playDimensionalPierce();
      const target = this.opponent;
      this.vaderChokeTarget = {
        target: target,
        timer: 0,
        damageApplied: false
      };
      if (target && !target.isDead) {
        target.isInvulnerable = false;
        target.velocity.x = 0;
        target.velocity.y = -7;
        target.isGrounded = false;
        target.state = FIGHTER_STATE.HURT;
        target.hitstunTime = 2.0;
      }
    } else if (this.superType === 'PALPATINE_DUAL_SABERS') {
      this.superPhase = 'SABER_SPIN';
      sounds.playSuperCharge();
      sounds.playSuper();
      this.palpatineDualSabers = true;
    } else if (this.superType === 'JOKER_CROWBAR') {
      this.superPhase = 'CROWBAR_RUSH';
      sounds.playSuperCharge();
      sounds.playRapierSlash();
      this.jokerCrowbarBeat = {
        hitCount: 0,
        nextHitTime: 0.15,
        totalHits: 6,
        target: this.opponent
      };
    } else if (this.superType === 'SPARROW_BLACK_PEARL') {
      this.superPhase = 'CANNON_COMMAND';
      sounds.playSuperCharge();
      sounds.playGunshot();
      // O navio existe e fica ancorado no canto em que Jack está
      // Se Jack está na metade esquerda, navio fica no canto esquerdo (x: 110) atirando para a direita (facing: 1)
      // Se Jack está na metade direita, navio fica no canto direito (x: 1810) atirando para a esquerda (facing: -1)
      const shipIsLeft = this.position.x < 960;
      const shipX = shipIsLeft ? 120 : 1800;
      const shipFacing = shipIsLeft ? 1 : -1;

      // 3 tiros de canhão na horizontal: 1 a cada 5 segundos
      this.sparrowBlackPearl = {
        shipX: shipX,
        shipY: this.groundY,
        shipFacing: shipFacing,
        timer: 0,
        shotsFired: 0,
        maxShots: 3,
        interval: 5.0,
        cannonballs: []
      };
    } else if (this.superType === 'MCQUEEN_KACHOW_BLITZ') {
      this.superPhase = 'NITRO_CHARGE';
      sounds.playSuperCharge();
      sounds.playSuper();
      this.mcqueenBlitz = {
        timer: 0,
        phase: 'DASH_OUT',
        hasHit: false
      };
    } else {
      this.superType = 'GUSTAVE_SMASH';
      this.superPhase = 'CHARGE'; // 'CHARGE' (0-0.5s), 'LEAP' (0.5-0.85s), 'SLAM' (0.85-1.45s)
      sounds.playSuperCharge();
      this.playCharacterVoice();
    }
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
        particles.emitFloatingText(`DODGED! (${this.sparrowDodgeCharges} left)`, this.position.x, this.position.y - 85, '#fbbf24', true);
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
            this.opponent.receiveHit(attackData, { x: this.luneIceLance.x, y: this.luneIceLance.y }, particles);
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

    // 5.5 Ondas Cromáticas de La Peintresse (viajam no chão em padrões rítmicos; salto desvia)
    if (this.chromaticWaves && this.chromaticWaves.length > 0) {
      for (const wave of this.chromaticWaves) {
        if (!wave.active) continue;
        wave.x += wave.vx * dt;

        if (particles && Math.random() < 0.4) {
          particles.emitDust(wave.x, this.groundY, 3, wave.color);
        }

        // Detecção de colisão com oponente
        if (this.opponent && !wave.hasHit && !this.opponent.isDead) {
          const dist = Math.abs(wave.x - this.opponent.position.x);
          if (dist < 42) {
            // EXIGÊNCIA DE SALTO: se o oponente pular e estiver no ar (!isGrounded), a onda passa por baixo!
            if (!this.opponent.isGrounded) {
              // Passou por baixo do oponente em segurança pelo pulo!
              if (particles && Math.random() < 0.3) {
                particles.emitSparks(wave.x, this.groundY - 15, '#ffffff', 4, 3);
              }
            } else {
              // Oponente estava no chão -> Toma dano massivo da onda cromática!
              wave.hasHit = true;
              const isFinisher = wave.waveIndex === 2;
              const attackData = {
                damage: wave.damage || 230,
                knockback: isFinisher ? 22 : 10,
                knockdown: isFinisher,
                isHeavy: true,
                attackerPower: this.attackPower
              };
              this.opponent.receiveHit(attackData, { x: wave.x, y: this.groundY - 30 }, particles);
              sounds.playChromaticWaveHit();
              if (particles) {
                particles.emitShockwave(wave.x, this.groundY, isFinisher ? 170 : 130, wave.color);
                particles.emitSparks(wave.x, this.groundY - 25, wave.color, isFinisher ? 35 : 22, 10);
                particles.emitDust(wave.x, this.groundY, 12, '#1e293b');
              }
            }
          }
        }

        if (wave.x < -200 || wave.x > stageWidth + 200) {
          wave.active = false;
        }
      }
      this.chromaticWaves = this.chromaticWaves.filter((w) => w.active);
    }
    // 5.6 Congelamento Temporal (La Peintresse Reality Tear)
    if (this.timeFreezeTimer > 0) {
      this.timeFreezeTimer -= dt;
      this.velocity.x = 0;
      this.velocity.y = 0;
      if (particles && Math.random() < 0.3) {
        particles.emitSparks(this.position.x + (Math.random() - 0.5) * 30, this.position.y - 60, '#fbbf24', 2, 2);
      }
    }

    // 5.7 Bala de Pistola de Gustave (Ataque Extra)
    if (this.gustaveBullet && this.gustaveBullet.active) {
      this.gustaveBullet.x += this.gustaveBullet.vx * dt;
      if (particles && Math.random() < 0.5) {
        particles.emitSparks(this.gustaveBullet.x, this.gustaveBullet.y, '#f59e0b', 2, 3);
      }
      if (this.opponent && !this.gustaveBullet.hasHit && !this.opponent.isDead) {
        const bX = this.gustaveBullet.x;
        const bY = this.gustaveBullet.y;
        const bulletBox = new Box(bX - 15, bY - 10, 30, 20, 'hitbox');
        for (const hurt of this.opponent.getHurtboxes()) {
          if (bulletBox.intersects(hurt)) {
            this.gustaveBullet.hasHit = true;
            this.gustaveBullet.active = false;
            const attackData = {
              damage: this.gustaveBullet.damage || 120,
              knockback: 10,
              knockdown: false,
              isHeavy: false,
              attackerPower: this.attackPower
            };
            this.opponent.receiveHit(attackData, { x: bX, y: bY }, particles);
            sounds.playPunch(false);
            if (particles) {
              particles.emitSparks(bX, bY, '#f59e0b', 16, 7);
              particles.emitShockwave(bX, bY, 45, '#fbbf24');
            }
            break;
          }
        }
      }
      if (this.gustaveBullet.x < -100 || this.gustaveBullet.x > stageWidth + 100) {
        this.gustaveBullet.active = false;
      }
    }

    // 5.8 Buraco Negro de Renoir (Ataque Extra)
    if (this.renoirBlackHole && this.renoirBlackHole.active) {
      this.renoirBlackHole.timer -= dt;
      if (particles && Math.random() < 0.3) {
        particles.emitDust(this.renoirBlackHole.x + (Math.random() - 0.5) * 50, this.groundY, 3, '#18181b');
      }
      if (this.renoirBlackHole.timer <= 0 && !this.renoirBlackHole.hasExploded) {
        this.renoirBlackHole.hasExploded = true;
        sounds.playThunderSlam();
        if (particles) {
          particles.emitShockwave(this.renoirBlackHole.x, this.groundY, 160, '#000000');
          particles.emitShockwave(this.renoirBlackHole.x, this.groundY, 110, '#f59e0b');
          particles.emitSparks(this.renoirBlackHole.x, this.groundY - 30, '#000000', 30, 10);
        }
        // Colisão: precisa acertar o timing do pulo para desviar!
        if (this.opponent && !this.opponent.isDead && !this.opponent.isInvulnerable) {
          const dist = Math.abs(this.renoirBlackHole.x - this.opponent.position.x);
          if (dist < 110) {
            // Se o oponente pulou e está no ar (!isGrounded), desvia com sucesso!
            if (!this.opponent.isGrounded) {
              if (particles) {
                particles.emitFloatingText('EVADED!', this.opponent.position.x, this.opponent.position.y - 70, '#22c55e');
              }
            } else {
              // No chão: engolido pelo buraco negro
              const attackData = {
                damage: this.renoirBlackHole.damage || 150,
                knockback: 18,
                knockdown: true,
                isHeavy: true,
                attackerPower: this.attackPower
              };
              this.opponent.receiveHit(attackData, { x: this.renoirBlackHole.x, y: this.groundY - 20 }, particles);
            }
          }
        }
      }
      if (this.renoirBlackHole.timer <= -0.4) {
        this.renoirBlackHole.active = false;
      }
    }

    // 5.9 Fenda na Realidade de La Peintresse (Ataque Extra)
    if (this.paintressRealityTear && this.paintressRealityTear.active) {
      this.paintressRealityTear.duration -= dt;
      if (particles && Math.random() < 0.25) {
        particles.emitSparks(this.paintressRealityTear.x + (Math.random() - 0.5) * 40, this.groundY - 15, '#fbbf24', 2, 2);
      }
      if (this.opponent && !this.opponent.isDead && this.opponent.timeFreezeTimer <= 0) {
        const dist = Math.abs(this.paintressRealityTear.x - this.opponent.position.x);
        if (dist < 55 && this.opponent.isGrounded) {
          // Oponente pisou na fenda: fica paralisado pelo tempo definido!
          this.opponent.timeFreezeTimer = this.paintressRealityTear.freezeTime || 1.2;
          sounds.playTimeFreeze();
          if (particles) {
            particles.emitShockwave(this.paintressRealityTear.x, this.groundY, 90, '#fbbf24');
            particles.emitSparks(this.opponent.position.x, this.opponent.position.y - 50, '#ffffff', 20, 8);
            particles.emitFloatingText('PARALYZED!', this.opponent.position.x, this.opponent.position.y - 85, '#fbbf24', true);
          }
        }
      }
      if (this.paintressRealityTear.duration <= 0) {
        this.paintressRealityTear.active = false;
      }
    }

    // 5.10 Batarangue do Batman (Ataque Extra: vai até a borda da arena e volta)
    if (this.batmanBatarang && this.batmanBatarang.active) {
      const b = this.batmanBatarang;
      b.x += b.vx * dt;
      if (particles && Math.random() < 0.45) {
        particles.emitSparks(b.x, b.y, '#38bdf8', 2, 2);
      }

      // Checa se atingiu o fim do mapa
      if (!b.returning) {
        if (b.x <= 40 || b.x >= stageWidth - 40) {
          b.returning = true;
          b.vx = -b.vx; // Inverte o sentido em direção ao Batman!
          sounds.playWhoosh();
        }
      } else {
        // Retornando em direção ao Batman
        const distToBatman = Math.abs(b.x - this.position.x);
        if (distToBatman < 40) {
          b.active = false; // Batman pegou o batarangue de volta!
        }
      }

      if (this.opponent && !this.opponent.isDead) {
        const hitKey = b.returning ? 'hasHitBack' : 'hasHitOut';
        if (!b[hitKey]) {
          const bBox = new Box(b.x - 18, b.y - 12, 36, 24, 'hitbox');
          for (const hurt of this.opponent.getHurtboxes()) {
            if (bBox.intersects(hurt)) {
              b[hitKey] = true;
              const attackData = {
                damage: b.damage || 110,
                knockback: b.returning ? -8 : 10,
                knockdown: false,
                isHeavy: true,
                attackerPower: this.attackPower
              };
              this.opponent.receiveHit(attackData, { x: b.x, y: b.y }, particles);
              sounds.playPunch(true);
              if (particles) {
                particles.emitShockwave(b.x, b.y, 60, '#38bdf8');
                particles.emitSparks(b.x, b.y, '#0f172a', 20, 8);
              }
              break;
            }
          }
        }
      }

      if (b.x < -200 || b.x > stageWidth + 200) {
        b.active = false;
      }
    }

    // 5.11 Sabre Giratório de Darth Vader (Ataque Extra: voa girando para frente e volta)
    if (this.vaderThrowingSaber && this.vaderThrowingSaber.active) {
      const s = this.vaderThrowingSaber;
      s.x += s.vx * dt;
      s.rot += dt * 30; // Rotação rápida do sabre
      if (particles && Math.random() < 0.6) {
        particles.emitSparks(s.x, s.y, '#ef4444', 3, 4);
      }

      const travelDist = Math.abs(s.x - s.startX);
      if (!s.returning) {
        if (travelDist >= s.maxDist || s.x <= 40 || s.x >= stageWidth - 40) {
          s.returning = true;
          s.vx = -s.vx;
          sounds.playWhoosh();
        }
      } else {
        // Retornando para as mãos de Vader
        if (Math.abs(s.x - this.position.x) < 35) {
          s.active = false;
        }
      }

      if (this.opponent && !this.opponent.isDead) {
        const hitKey = s.returning ? 'hasHitBack' : 'hasHitOut';
        if (!s[hitKey]) {
          const sBox = new Box(s.x - 30, s.y - 15, 60, 30, 'hitbox');
          for (const hurt of this.opponent.getHurtboxes()) {
            if (sBox.intersects(hurt)) {
              s[hitKey] = true;
              const attackData = {
                damage: s.damage || 130,
                knockback: s.returning ? -6 : 12,
                knockdown: false,
                isHeavy: true,
                attackerPower: this.attackPower
              };
              this.opponent.receiveHit(attackData, { x: s.x, y: s.y }, particles);
              sounds.playPunch(true);
              if (particles) {
                particles.emitShockwave(s.x, s.y, 70, '#ef4444');
                particles.emitSparks(s.x, s.y, '#fca5a5', 22, 9);
              }
              break;
            }
          }
        }
      }

      if (s.x < -200 || s.x > stageWidth + 200) {
        s.active = false;
      }
    }

    // 5.12 Relâmpagos de Palpatine (Ataque Extra)
    if (this.palpatineLightning && this.palpatineLightning.active) {
      this.palpatineLightning.timer -= dt;
      if (particles && Math.random() < 0.6) {
        const lX = this.position.x + this.facing * (Math.random() * (this.palpatineLightning.reach || 350));
        particles.emitSparks(lX, this.position.y - 70, '#a855f7', 4, 4);
      }
      if (this.palpatineLightning.timer <= 0) {
        this.palpatineLightning.active = false;
      }
    }

    // 5.13 Acid Blossom do Coringa (Ataque Extra: atinge e deixa de pé atordoado)
    if (this.jokerAcidBlossom && this.jokerAcidBlossom.active) {
      const a = this.jokerAcidBlossom;
      a.x += a.vx * dt;
      if (particles && Math.random() < 0.5) {
        particles.emitSparks(a.x, a.y, '#10b981', 3, 3);
        particles.emitSparks(a.x, a.y, '#fbbf24', 2, 2);
      }
      if (this.opponent && !a.hasHit && !this.opponent.isDead) {
        const aBox = new Box(a.x - 16, a.y - 12, 32, 24, 'hitbox');
        for (const hurt of this.opponent.getHurtboxes()) {
          if (aBox.intersects(hurt)) {
            a.hasHit = true;
            a.active = false;
            // Dano com hitstun longo que DEIXA O OPONENTE DE PÉ (knockdown: false)
            this.opponent.hitstunTime = 0.95; // atordoado de pé
            const attackData = {
              damage: a.damage || 110,
              knockback: 2, // Quase sem knockback para ficar de pé no lugar
              knockdown: false,
              isHeavy: false,
              attackerPower: this.attackPower
            };
            this.opponent.receiveHit(attackData, { x: a.x, y: a.y }, particles);
            sounds.playPunch(false);
            if (particles) {
              particles.emitShockwave(a.x, a.y, 80, '#10b981');
              particles.emitSparks(a.x, a.y, '#22c55e', 25, 8);
              particles.emitFloatingText('ACID STUN!', this.opponent.position.x, this.opponent.position.y - 85, '#10b981', true);
            }
            break;
          }
        }
      }
      if (a.x < -100 || a.x > stageWidth + 100) {
        a.active = false;
      }
    }

    // 5.14 Rum & Esquiva Bêbada de Jack Sparrow (Ataque Extra)
    if (this.sparrowDodgeCharges > 0 || this.sparrowDrunkTimer > 0) {
      if (this.sparrowDodgeCharges <= 0) {
        this.sparrowDrunkTimer -= dt;
      }
      if (particles && Math.random() < 0.25) {
        particles.emitSparks(this.position.x, this.position.y - 80, '#fbbf24', 2, 2);
      }
    }

    // 5.14b Relâmpago McQueen: Super Velocidade (Dobro ou Triplo de Velocidade por 5s)
    if (this.mcqueenSpeedBuffTimer > 0) {
      this.mcqueenSpeedBuffTimer -= dt;
      if (particles && Math.random() < 0.5) {
        // Rastro de velocidade e faíscas nos pneus
        particles.emitSparks(this.position.x - this.facing * 30, this.groundY - 10, '#ef4444', 3, 4);
        particles.emitSparks(this.position.x - this.facing * 40, this.groundY - 10, '#fbbf24', 2, 3);
        particles.emitDust(this.position.x - this.facing * 35, this.groundY, 2, '#450a0a');
      }
    }

    // 5.15 Queima de Pneu / Drift de McQueen (Ataque Extra)
    if (this.mcqueenDriftBurn && this.mcqueenDriftBurn.active) {
      const db = this.mcqueenDriftBurn;
      db.duration -= dt;
      db.tick += dt;
      if (particles) {
        // Fumaça de pneu e faíscas
        particles.emitDust(db.x + (Math.random() - 0.5) * 80, db.y, 4, '#18181b');
        particles.emitSparks(db.x + (Math.random() - 0.5) * 60, db.y - 10, '#ef4444', 3, 4);
      }
      if (db.tick >= 0.4) {
        db.tick = 0;
        if (this.opponent && !this.opponent.isDead) {
          const dist = Math.abs(db.x - this.opponent.position.x);
          if (dist < 110) {
            const attackData = {
              damage: db.damage || 25,
              knockback: 3,
              knockdown: false,
              isHeavy: false,
              attackerPower: this.attackPower
            };
            this.opponent.receiveHit(attackData, { x: this.opponent.position.x, y: this.opponent.position.y - 30 }, particles);
          }
        }
      }
      if (db.duration <= 0) {
        db.active = false;
      }
    }

    // 5.16 Batmóvel do Batman (Ultimate)
    if (this.batmanBatmobile && this.batmanBatmobile.active) {
      const bm = this.batmanBatmobile;
      bm.x += bm.vx * dt;
      if (particles && Math.random() < 0.6) {
        particles.emitDust(bm.x, this.groundY, 6, '#09090b');
        particles.emitSparks(bm.x, this.groundY - 15, '#38bdf8', 4, 5);
      }
      // Atropela o oponente
      if (this.opponent && !bm.hasHit && !this.opponent.isDead) {
        const dist = Math.abs(bm.x - this.opponent.position.x);
        if (dist < 100) {
          bm.hasHit = true;
          const attackData = {
            damage: 380,
            knockback: 32,
            knockdown: true,
            isHeavy: true,
            attackerPower: this.attackPower
          };
          this.opponent.receiveHit(attackData, { x: bm.x, y: this.groundY - 40 }, particles);
          sounds.playThunderSlam();
          if (particles) {
            particles.emitShockwave(bm.x, this.groundY, 180, '#38bdf8');
            particles.emitSparks(bm.x, this.groundY - 30, '#0284c7', 40, 15);
            particles.emitDust(bm.x, this.groundY, 20, '#09090b');
          }
        }
      }
      if (bm.x < -300 || bm.x > stageWidth + 300) {
        bm.active = false;
      }
    }

    // 5.17 Canhões do Pérola Negra de Jack Sparrow (Ultimate: o navio existe no canto e atira na horizontal a cada 5s)
    if (this.sparrowBlackPearl) {
      const bp = this.sparrowBlackPearl;
      bp.timer += dt;

      // Dispara 1 tiro a cada 5 segundos até 3 tiros disparados na horizontal
      if (bp.shotsFired < bp.maxShots && bp.timer >= bp.shotsFired * bp.interval) {
        bp.shotsFired++;
        sounds.playGunshot();
        sounds.playThunderSlam();

        const spawnX = bp.shipX + bp.shipFacing * 95;
        const spawnY = this.groundY - 60; // altura do tronco/canhão do navio

        bp.cannonballs.push({
          x: spawnX,
          y: spawnY,
          vx: bp.shipFacing * 1150, // Projétil atravessa a arena na horizontal
          exploded: false,
          active: true
        });

        if (particles) {
          particles.emitShockwave(spawnX, spawnY, 80, '#f59e0b');
          particles.emitSparks(spawnX, spawnY, '#f59e0b', 20, 8);
          particles.emitDust(spawnX, this.groundY, 15, '#451a03');
        }
      }

      // Atualiza balas de canhão voando na horizontal
      for (const cb of bp.cannonballs) {
        if (!cb.active) continue;
        cb.x += cb.vx * dt;

        if (particles && Math.random() < 0.6) {
          particles.emitSparks(cb.x, cb.y, '#f97316', 3, 3);
          particles.emitDust(cb.x, cb.y + 10, 2, '#292524');
        }

        // Colisão com o oponente ou com os limites da arena
        if (this.opponent && !this.opponent.isDead && !cb.exploded) {
          const dist = Math.abs(cb.x - this.opponent.position.x);
          const heightDiff = Math.abs(cb.y - (this.opponent.position.y - 50));
          if (dist < 55 && heightDiff < 85) {
            cb.exploded = true;
            cb.active = false;
            sounds.playThunderSlam();
            if (particles) {
              particles.emitShockwave(cb.x, cb.y, 160, '#f59e0b');
              particles.emitSparks(cb.x, cb.y, '#ef4444', 35, 12);
              particles.emitDust(cb.x, this.groundY, 25, '#78350f');
            }
            const attackData = {
              damage: 130, // 3 tiros x 130 = 390 de dano total
              knockback: 22,
              knockdown: true,
              isHeavy: true,
              attackerPower: this.attackPower
            };
            this.opponent.receiveHit(attackData, { x: cb.x, y: cb.y }, particles);
          }
        }

        if (cb.x < -200 || cb.x > stageWidth + 200) {
          cb.active = false;
        }
      }

      bp.cannonballs = bp.cannonballs.filter((cb) => cb.active);
      if (bp.shotsFired >= bp.maxShots && bp.cannonballs.length === 0 && bp.timer > 16.0) {
        this.sparrowBlackPearl = null;
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
      ? ((this.superType === 'RENOIR_FLOWER' || this.superType === 'LUNE_ELEMENTAL' || this.superType === 'PAINTRESS_CHROMATIC_WAVES') ? 2.0 : 1.6) 
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

    // Renderiza as Ondas Cromáticas de La Peintresse
    this.drawChromaticWaves(ctx);

    // Renderiza a Cúpula de Parry do Monoco
    if (this.isMonoco && this.state === FIGHTER_STATE.SUPER_MOVE && this.superPhase === 'PARRY_STANCE') {
      this.drawMonocoParryDome(ctx);
    }

    // Renderiza projéteis e áreas de Ataques Extras
    this.drawExtraAttacks(ctx);
  }

  drawExtraAttacks(ctx) {
    // 1. Bala de Pistola de Gustave
    if (this.gustaveBullet && this.gustaveBullet.active) {
      ctx.save();
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.ellipse(this.gustaveBullet.x, this.gustaveBullet.y, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rastro veloz da bala
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(this.gustaveBullet.x, this.gustaveBullet.y);
      ctx.lineTo(this.gustaveBullet.x - Math.sign(this.gustaveBullet.vx) * 35, this.gustaveBullet.y);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Buraco Negro de Renoir
    if (this.renoirBlackHole && this.renoirBlackHole.active) {
      const bh = this.renoirBlackHole;
      ctx.save();
      ctx.translate(bh.x, bh.y);
      const pulse = Math.sin(Date.now() * 0.015) * 0.15 + 0.85;

      // Vórtice negro abissal no chão
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 30;
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.ellipse(0, 0, 60 * pulse, 18 * pulse, 0, 0, Math.PI * 2);
      ctx.fill();

      // Borda vermelha/púrpura de aviso
      ctx.strokeStyle = bh.timer < 0.2 ? '#ef4444' : '#7c3aed';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Espirais de sucção
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const ang = (Date.now() * 0.006) + (i * Math.PI * 2 / 3);
        ctx.beginPath();
        ctx.arc(0, 0, 35 * pulse, ang, ang + 1.2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3. Fenda da Realidade de La Peintresse
    if (this.paintressRealityTear && this.paintressRealityTear.active) {
      const pt = this.paintressRealityTear;
      ctx.save();
      ctx.translate(pt.x, pt.y);
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 20;

      // Rasgo dourado cósmico no piso
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-45, 0);
      ctx.lineTo(0, -8);
      ctx.lineTo(45, 0);
      ctx.stroke();

      // Interior negro do rasgo
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-40, 0);
      ctx.lineTo(0, -6);
      ctx.lineTo(40, 0);
      ctx.stroke();

      // Partículas verticais de distorção
      const now = Date.now() * 0.01;
      ctx.fillStyle = '#fef08a';
      for (let p = 0; p < 4; p++) {
        const px = (p - 1.5) * 20;
        const py = -Math.abs(Math.sin(now + p)) * 30;
        ctx.fillRect(px, py, 2.5, 7);
      }
      ctx.restore();
    }

    // 4. Efeito Visual de Cura de Lune (Aura Verde)
    if (this.extraType === 'LUNE_HEAL' && this.state === FIGHTER_STATE.SPECIAL_1 && this.stateTime < 0.6) {
      ctx.save();
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 25;
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.75)';
      ctx.lineWidth = 3;
      const hPulse = Math.sin(this.stateTime * 18) * 10;
      ctx.beginPath();
      ctx.ellipse(this.position.x, this.position.y - 65, 45 + hPulse, 65 + hPulse, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Cruzes verdes de cura subindo
      ctx.fillStyle = '#4ade80';
      for (let c = 0; c < 3; c++) {
        const cx = this.position.x + (c - 1) * 28;
        const cy = this.position.y - 40 - (this.stateTime * 90) - (c * 15);
        ctx.fillRect(cx - 3, cy - 8, 6, 16);
        ctx.fillRect(cx - 8, cy - 3, 16, 6);
      }
      ctx.restore();
    }

    // 5. Batarangue do Batman (vai e volta com rotação)
    if (this.batmanBatarang && this.batmanBatarang.active) {
      const bx = this.batmanBatarang.x;
      const by = this.batmanBatarang.y;
      const rot = Date.now() * 0.025;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(rot);
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#09090b';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(-18, -5);
      ctx.quadraticCurveTo(0, -14, 18, -5);
      ctx.lineTo(10, 8);
      ctx.lineTo(0, 3);
      ctx.lineTo(-10, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 6. Sabre Giratório de Darth Vader (vai e volta)
    if (this.vaderThrowingSaber && this.vaderThrowingSaber.active) {
      const sx = this.vaderThrowingSaber.x;
      const sy = this.vaderThrowingSaber.y;
      const rot = this.vaderThrowingSaber.rot || 0;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(rot);

      // Lâmina de plasma escarlate giratória
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 22;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-45, 0);
      ctx.lineTo(45, 0);
      ctx.stroke();

      // Núcleo branco incandescente
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Cabo metálico no centro
      ctx.fillStyle = '#09090b';
      ctx.fillRect(-8, -3, 16, 6);
      ctx.restore();
    }

    // 7. Relâmpagos de Palpatine
    if (this.palpatineLightning && this.palpatineLightning.active) {
      const sx = this.position.x + this.facing * 30;
      const sy = this.position.y - 75;
      const reach = this.palpatineLightning.reach || 350;
      ctx.save();
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 22;
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2.8;

      for (let branch = 0; branch < 3; branch++) {
        ctx.beginPath();
        let curX = sx;
        let curY = sy + (branch - 1) * 15;
        ctx.moveTo(curX, curY);
        const steps = 7;
        const stepLen = reach / steps;
        for (let s = 1; s <= steps; s++) {
          curX += this.facing * stepLen;
          curY += (Math.random() - 0.5) * 45;
          ctx.lineTo(curX, curY);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    // 8. Acid Blossom do Coringa (esguicho de ácido verde borbulhante)
    if (this.jokerAcidBlossom && this.jokerAcidBlossom.active) {
      const ax = this.jokerAcidBlossom.x;
      const ay = this.jokerAcidBlossom.y;
      ctx.save();
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(ax, ay, 9, 0, Math.PI * 2);
      ctx.fill();

      // Gotas menores de ácido
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(ax - this.facing * 12, ay - 4, 5, 0, Math.PI * 2);
      ctx.arc(ax - this.facing * 22, ay + 3, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 9. Garrafa de Rum de Jack Sparrow (indicador visual de embriaguez/esquiva)
    if (this.sparrowDrunkTimer > 0) {
      const hx = this.position.x;
      const hy = this.position.y - 125;
      const pulse = Math.sin(Date.now() * 0.01) * 3;
      ctx.save();
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 12px "Cinzel", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🍾 RUM DODGE!', hx, hy + pulse);
      ctx.restore();
    }

    // 10. Queima de Pneu / Drift de McQueen
    if (this.mcqueenDriftBurn && this.mcqueenDriftBurn.active) {
      const bx = this.mcqueenDriftBurn.x;
      const by = this.mcqueenDriftBurn.y;
      ctx.save();
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 15;
      // Marca de pneu no asfalto
      ctx.fillStyle = '#09090b';
      ctx.fillRect(bx - 50, by - 6, 100, 6);
      // Faíscas e chamas do atrito
      ctx.fillStyle = '#facc15';
      for (let s = 0; s < 4; s++) {
        const sx = bx + (s - 1.5) * 25 + Math.sin(Date.now() * 0.01 + s) * 8;
        ctx.fillRect(sx, by - 12, 5, 8);
      }
      ctx.restore();
    }

    // 11. Batmóvel Atropelando (Batman Ultimate)
    if (this.batmanBatmobile && this.batmanBatmobile.active) {
      const mx = this.batmanBatmobile.x;
      const my = this.groundY;
      const dir = Math.sign(this.batmanBatmobile.vx) || 1;
      ctx.save();
      ctx.translate(mx, my);
      ctx.scale(dir, 1);
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 25;

      // Carroceria aerodinâmica escura do Batmóvel
      ctx.fillStyle = '#050505';
      ctx.beginPath();
      ctx.moveTo(-110, -10);
      ctx.lineTo(-80, -38);
      ctx.lineTo(-20, -42);
      ctx.lineTo(40, -30);
      ctx.lineTo(95, -15);
      ctx.lineTo(110, 0);
      ctx.lineTo(-110, 0);
      ctx.closePath();
      ctx.fill();

      // Turbina de fogo traseira
      ctx.shadowColor = '#38bdf8';
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(-110, -22);
      ctx.lineTo(-150 - Math.random() * 25, -18);
      ctx.lineTo(-110, -14);
      ctx.closePath();
      ctx.fill();

      // Rodas robustas
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.arc(-65, -4, 16, 0, Math.PI * 2);
      ctx.arc(65, -4, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Faróis azuis cortando a noite
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.beginPath();
      ctx.moveTo(95, -20);
      ctx.lineTo(240, -45);
      ctx.lineTo(240, 5);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    // 12. Pérola Negra de Jack Sparrow (Navio no canto da luta disparando na horizontal)
    if (this.sparrowBlackPearl) {
      const bp = this.sparrowBlackPearl;
      ctx.save();
      ctx.translate(bp.shipX, bp.shipY);
      ctx.scale(bp.shipFacing, 1);

      // Casco de madeira negra do navio pirata
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.moveTo(-110, -15);
      ctx.lineTo(95, -15);
      ctx.lineTo(80, 0);
      ctx.lineTo(-85, 0);
      ctx.closePath();
      ctx.fill();

      // Detalhe das tábuas do casco
      ctx.strokeStyle = '#44403c';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Proa pontiaguda e cabine de popa
      ctx.fillStyle = '#292524';
      ctx.beginPath();
      ctx.moveTo(-110, -15);
      ctx.lineTo(-135, -55);
      ctx.lineTo(-90, -50);
      ctx.lineTo(-85, -15);
      ctx.closePath();
      ctx.fill();

      // Mastro principal e vergas
      ctx.fillStyle = '#292524';
      ctx.fillRect(-15, -135, 10, 120);
      ctx.fillRect(45, -115, 8, 100);

      // Velas Negras rasgadas do Pérola Negra
      ctx.fillStyle = 'rgba(12, 10, 9, 0.92)';
      ctx.beginPath();
      ctx.moveTo(-10, -130);
      ctx.quadraticCurveTo(20, -95, -10, -60);
      ctx.lineTo(-10, -130);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(50, -110);
      ctx.quadraticCurveTo(75, -80, 50, -50);
      ctx.lineTo(50, -110);
      ctx.fill();
      ctx.stroke();

      // Bandeira Jolly Roger no topo do mastro principal
      ctx.fillStyle = '#09090b';
      ctx.fillRect(-22, -145, 16, 10);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(-14, -140, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Canhão apontado para frente (horizontal)
      ctx.fillStyle = '#0c0a09';
      ctx.beginPath();
      ctx.roundRect(55, -28, 48, 14, 4);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();

      // Balas de Canhão cortando na Horizontal
      if (bp.cannonballs) {
        for (const cb of bp.cannonballs) {
          if (!cb.active) continue;
          ctx.save();
          // Rastro horizontal incandescente
          const trailLen = 45 * Math.sign(cb.vx);
          const grad = ctx.createLinearGradient(cb.x, cb.y, cb.x - trailLen, cb.y);
          grad.addColorStop(0, '#f59e0b');
          grad.addColorStop(0.5, '#ef4444');
          grad.addColorStop(1, 'transparent');

          ctx.strokeStyle = grad;
          ctx.lineWidth = 10;
          ctx.beginPath();
          ctx.moveTo(cb.x, cb.y);
          ctx.lineTo(cb.x - trailLen, cb.y);
          ctx.stroke();

          // Projétil esférico de canhão
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 18;
          ctx.fillStyle = '#1c1917';
          ctx.beginPath();
          ctx.arc(cb.x, cb.y, 13, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          ctx.restore();
        }
      }
    }

    // 12b. Aura de Super Velocidade de McQueen (Rastro veloz contínuo)
    if (this.mcqueenSpeedBuffTimer > 0) {
      ctx.save();
      ctx.strokeStyle = this.mcqueenSpeedMultiplier >= 3.0 ? 'rgba(239, 68, 68, 0.45)' : 'rgba(245, 158, 11, 0.4)';
      ctx.lineWidth = 3;
      const t = Date.now() * 0.02;
      for (let i = 0; i < 3; i++) {
        const lineOffset = ((t + i * 20) % 50) * this.facing;
        ctx.beginPath();
        ctx.moveTo(this.position.x - lineOffset, this.position.y - 15 - i * 14);
        ctx.lineTo(this.position.x - lineOffset - this.facing * 35, this.position.y - 15 - i * 14);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 13. Sabres Duplos Giratórios de Palpatine (Giro helicóptero de sabres no chão)
    if (this.palpatineDualSabers && this.state === FIGHTER_STATE.SUPER_MOVE) {
      const px = this.position.x;
      const py = this.position.y - 45;
      const rot = this.stateTime * 28;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(rot);
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 24;

      // Dois sabres vermelhos em 180 graus opostos
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(-75, 0);
      ctx.lineTo(75, 0);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    }
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

  drawChromaticWaves(ctx) {
    if (!this.chromaticWaves || this.chromaticWaves.length === 0) return;

    const gy = this.groundY;
    const now = Date.now() * 0.01;

    for (const wave of this.chromaticWaves) {
      if (!wave.active) continue;

      const wx = wave.x;
      const dir = Math.sign(wave.vx) || 1;
      const waveHeight = 65;

      ctx.save();
      ctx.translate(wx, gy);
      ctx.scale(dir, 1);

      ctx.shadowColor = wave.color;
      ctx.shadowBlur = 22;

      // 1. Rastro luminoso de tinta cósmica no chão
      const trailGrad = ctx.createLinearGradient(0, 0, -80, 0);
      trailGrad.addColorStop(0, wave.color);
      trailGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = trailGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-80, 0);
      ctx.lineTo(-60, -15);
      ctx.lineTo(0, -waveHeight * 0.4);
      ctx.closePath();
      ctx.fill();

      // 2. Lâmina / Onda Crescente de Tinta Cósmica (exige salto)
      ctx.beginPath();
      ctx.moveTo(25, 0); // Ponta frontal rente ao chão
      ctx.quadraticCurveTo(15, -waveHeight * 0.7, 0, -waveHeight); // Crista superior
      ctx.quadraticCurveTo(-15, -waveHeight * 0.6, -20, 0); // Cauda traseira
      ctx.closePath();

      const waveGrad = ctx.createLinearGradient(0, -waveHeight, 0, 0);
      waveGrad.addColorStop(0, wave.secondary || '#ffffff');
      waveGrad.addColorStop(0.5, wave.color);
      waveGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = waveGrad;
      ctx.fill();

      // 3. Borda luminosa reluzente da onda
      ctx.strokeStyle = wave.secondary || '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(25, 0);
      ctx.quadraticCurveTo(15, -waveHeight * 0.7, 0, -waveHeight);
      ctx.stroke();

      // 4. Pingos de tinta cósmica cintilantes na crista
      ctx.fillStyle = '#ffffff';
      for (let d = 0; d < 3; d++) {
        const dropX = -5 + Math.sin(now + d * 2) * 12;
        const dropY = -waveHeight + Math.cos(now + d * 1.5) * 10;
        ctx.beginPath();
        ctx.arc(dropX, dropY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  drawMonocoParryDome(ctx) {
    const cx = this.position.x;
    const cy = this.position.y - 65;
    const t = this.stateTime;
    const pulse = Math.sin(t * 15) * 0.12 + 0.88;

    ctx.save();
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 25;

    // 1. Cúpula translúcida dourada
    ctx.beginPath();
    ctx.arc(cx, cy, 72 * pulse, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
    ctx.fill();

    // 2. Anel de runas douradas
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 3. Arcos rúnicos rotativos
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.8;
    for (let i = 0; i < 4; i++) {
      const startAngle = (t * 4) + (i * Math.PI / 2);
      ctx.beginPath();
      ctx.arc(cx, cy, 64 * pulse, startAngle, startAngle + Math.PI / 4);
      ctx.stroke();
    }

    ctx.restore();
  }
}
