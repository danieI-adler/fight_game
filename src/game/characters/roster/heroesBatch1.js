import { BaseCharacter } from '../base/BaseCharacter.js';
import { sounds } from '../../audio/soundManager.js';
import { FIGHTER_STATE } from '../../engine/Fighter.js';

// 5 - ZORRO: Q bloqueia/anula dano de ambos, sem causar dano. Próximo hit causa 150% dmg. Ult tela preta com Z cortante.
export class ZorroBehavior extends BaseCharacter {
  constructor() { super('zorro', 'Zorro'); }
  init(fighter) {
    fighter.isZorro = true;
    fighter.zorroEmpoweredNextHit = false;
  }
  reset(fighter) {
    fighter.zorroEmpoweredNextHit = false;
  }
  onSpecial(fighter, level) {
    fighter.extraType = 'ZORRO_PARRY_STANCE';
    sounds.playRapierSlash();
    sounds.playWhoosh();
    fighter.zorroParryActive = {
      timer: 0.55,
      active: true
    };
    return true;
  }
  onSuper(fighter) {
    fighter.superType = 'ZORRO_MARK_OF_Z';
    fighter.superPhase = 'MARK_OF_Z';
    sounds.playSuperCharge();
    sounds.playRapierSlash();
    fighter.zorroBlackoutTimer = 1.35;
    return true;
  }
  update(fighter, dt, stageWidth, particles) {
    if (fighter.zorroBlackoutTimer > 0) {
      fighter.zorroBlackoutTimer -= dt;
    }
    if (fighter.zorroParryActive && fighter.zorroParryActive.active) {
      fighter.zorroParryActive.timer -= dt;
      if (fighter.zorroParryActive.timer <= 0) {
        fighter.zorroParryActive.active = false;
        fighter.zorroParryActive = null;
      }
    }
  }
}

// 2 - AANG: ataque ranged no K é só no estado avatar (5 segundos apos ultimate)
export class AangBehavior extends BaseCharacter {
  constructor() { super('aang', 'Aang'); }
  init(fighter) {
    fighter.isAang = true;
    fighter.avatarStateTimer = 0;
  }
  reset(fighter) {
    fighter.avatarStateTimer = 0;
  }
  onSpecial(fighter, level) {
    fighter.extraType = level === 2 ? 'AANG_FIRE_FLURRY' : 'AANG_WATER_WHIP';
    sounds.playWaterSplash();
    sounds.playWindTornado();
    fighter.aangWaterWhip = {
      timer: 0.35,
      x: fighter.position.x,
      reach: level === 2 ? 310 : 220,
      damage: level === 2 ? 180 : 115,
      active: true,
      hasHit: false
    };
    return true;
  }
  onSuper(fighter) {
    fighter.superType = 'AANG_AVATAR_STATE';
    fighter.superPhase = 'AVATAR_SPHERE';
    sounds.playSuperCharge();
    sounds.playWindTornado();
    fighter.avatarStateTimer = 5.0; // 5 segundos de estado Avatar!
    fighter.aangAvatarState = {
      timer: 0,
      active: true,
      hitsLanded: 0,
      duration: 1.45
    };
    return true;
  }
  update(fighter, dt, stageWidth, particles) {
    if (fighter.avatarStateTimer > 0) {
      fighter.avatarStateTimer -= dt;
      if (particles && Math.random() < 0.4) {
        particles.emitSparks(fighter.position.x, fighter.position.y - 60, '#38bdf8', 3, 3);
        particles.emitSparks(fighter.position.x, fighter.position.y - 60, '#f97316', 3, 3);
      }
    }
  }
}

// 6 - DOCTOR STRANGE: agachado não passa no portal
export class DoctorStrangeBehavior extends BaseCharacter {
  constructor() { super('doutor_estranho', 'Doutor Estranho'); }
  init(fighter) {
    fighter.isDoctorStrange = true;
    fighter.strangeEldritchWhip = null;
  }
  reset(fighter) {
    fighter.strangeEldritchWhip = null;
  }
  onSpecial(fighter, level) {
    fighter.extraType = 'STRANGE_ELDRITCH_WHIP';
    sounds.playSuperCharge();
    sounds.playDimensionalPierce();
    fighter.strangeEldritchWhip = {
      timer: 0.38,
      reach: level === 2 ? 330 : 230,
      damage: level === 2 ? 185 : 120,
      active: true,
      hasHit: false
    };
    return true;
  }
  onSuper(fighter) {
    fighter.superType = 'STRANGE_MIRROR_DIMENSION';
    fighter.superPhase = 'MIRROR_SHATTER';
    sounds.playSuperCharge();
    sounds.playDimensionalPierce();
    fighter.strangeMirrorDimension = {
      timer: 0,
      duration: 1.5,
      target: fighter.opponent,
      active: true
    };
    return true;
  }
}

// WALTER WHITE
export class WalterWhiteBehavior extends BaseCharacter {
  constructor() { super('walter_white', 'Walter White'); }
  init(fighter) {
    fighter.isWalterWhite = true;
    fighter.walterFulminateCrystal = null;
    fighter.walterM60Turret = null;
  }
  reset(fighter) {
    fighter.walterFulminateCrystal = null;
    fighter.walterM60Turret = null;
  }
  onSpecial(fighter, level) {
    fighter.extraType = 'WALTER_MERCURY_FULMINATE';
    sounds.playPunch(true);
    fighter.walterFulminateCrystal = {
      x: fighter.position.x + fighter.facing * 30,
      y: fighter.groundY - 10,
      vx: fighter.facing * (level === 2 ? 720 : 580),
      vy: -220,
      damage: level === 2 ? 185 : 120,
      active: true,
      exploded: false
    };
    return true;
  }
  onSuper(fighter) {
    fighter.superType = 'WALTER_M60_TURRET';
    fighter.superPhase = 'M60_SWEEP';
    sounds.playSuperCharge();
    sounds.playGunshot();
    fighter.walterM60Turret = {
      timer: 0,
      x: fighter.position.x - fighter.facing * 80,
      y: fighter.groundY - 60,
      shotsFired: 0,
      maxShots: 6,
      interval: 0.22,
      bullets: []
    };
    return true;
  }
}

// 7 & 8 - MESSI: raios do Q na animação OK, sem textos inúteis como 'ancara messi'
export class MessiBehavior extends BaseCharacter {
  constructor() { super('messi', 'Messi'); }
  init(fighter) {
    fighter.isMessi = true;
    fighter.messiSoccerBall = null;
  }
  reset(fighter) {
    fighter.messiSoccerBall = null;
  }
  onSpecial(fighter, level) {
    fighter.extraType = 'MESSI_ANKARA_DRIBBLE';
    sounds.playDash();
    sounds.playPunch(true);
    fighter.messiAnkaraRush = {
      timer: 0,
      startX: fighter.position.x,
      targetX: fighter.opponent ? fighter.opponent.position.x : fighter.position.x + fighter.facing * 320,
      damage: level === 2 ? 190 : 125,
      active: true,
      hasHit: false
    };
    return true;
  }
  onSuper(fighter) {
    fighter.superType = 'MESSI_GOLDEN_FREE_KICK';
    fighter.superPhase = 'FREE_KICK_CURVE';
    sounds.playSuperCharge();
    sounds.playPunch(true);
    fighter.messiSoccerBall = {
      x: fighter.position.x + fighter.facing * 30,
      y: fighter.position.y - 20,
      vx: fighter.facing * 920,
      vy: -320,
      curve: 480,
      damage: 420,
      active: true,
      hasHit: false
    };
    return true;
  }
}

// 9 - CAPITÃO NASCIMENTO: Q puxa uma arma e pode dar tiros por 5 a 10 segundos
export class NascimentoBehavior extends BaseCharacter {
  constructor() { super('capitao_nascimento', 'Capitão Nascimento'); }
  init(fighter) {
    fighter.isNascimento = true;
    fighter.nascimentoGunTimer = 0;
  }
  reset(fighter) {
    fighter.nascimentoGunTimer = 0;
  }
  onSpecial(fighter, level) {
    fighter.extraType = 'NASCIMENTO_DRAW_GUN';
    sounds.playGunshot();
    fighter.nascimentoGunTimer = level === 2 ? 10.0 : 6.5; // Tiroteio ativo por 6.5s a 10s!
    // Dispara primeiro tiro imediatamente
    const bX = fighter.position.x + fighter.facing * 35;
    const bY = fighter.position.y - 65;
    fighter.nascimentoBullet = {
      x: bX,
      y: bY,
      vx: fighter.facing * 1400,
      damage: level === 2 ? 90 : 65,
      active: true,
      hasHit: false
    };
    return true;
  }
  onSuper(fighter) {
    fighter.superType = 'NASCIMENTO_INCURSION';
    fighter.superPhase = 'INCURSION_TACTICAL';
    sounds.playSuperCharge();
    sounds.playGunshot();
    fighter.nascimentoIncursion = {
      timer: 0,
      x: fighter.position.x - fighter.facing * 60,
      y: fighter.groundY - 60,
      shotsFired: 0,
      maxShots: 5,
      interval: 0.24,
      bullets: []
    };
    return true;
  }
  update(fighter, dt, stageWidth, particles) {
    if (fighter.nascimentoGunTimer > 0) {
      fighter.nascimentoGunTimer -= dt;
      if (particles && Math.random() < 0.25) {
        particles.emitDust(fighter.position.x, fighter.groundY, 1, '#18181b');
      }
    }
  }
}

// 10 - RAPUNZEL: Q tapa de cabelo de longe; Ult cabelo agarra, puxa e atordoa
export class RapunzelBehavior extends BaseCharacter {
  constructor() { super('rapunzel', 'Rapunzel'); }
  init(fighter) {
    fighter.isRapunzel = true;
    fighter.rapunzelHairSlap = null;
  }
  reset(fighter) {
    fighter.rapunzelHairSlap = null;
  }
  onSpecial(fighter, level) {
    fighter.extraType = 'RAPUNZEL_HAIR_SLAP';
    sounds.playWhoosh();
    sounds.playPunch(true);
    fighter.rapunzelHairSlap = {
      timer: 0.32,
      reach: level === 2 ? 340 : 250, // Longo alcance com o cabelo
      damage: level === 2 ? 180 : 115,
      active: true,
      hasHit: false
    };
    return true;
  }
  onSuper(fighter) {
    fighter.superType = 'RAPUNZEL_GOLDEN_HAIR_STORM';
    fighter.superPhase = 'HAIR_GRAB_PULL';
    sounds.playSuperCharge();
    sounds.playWhoosh();
    fighter.rapunzelHairStorm = {
      timer: 0,
      duration: 1.55,
      x: fighter.position.x,
      y: fighter.position.y - 70,
      damage: 400,
      active: true,
      healed: false
    };
    // Puxa o alvo para perto e atordoa
    if (fighter.opponent && !fighter.opponent.isDead) {
      fighter.opponent.position.x = fighter.position.x + fighter.facing * 60;
      fighter.opponent.hitstunTime = 1.6;
      fighter.opponent.state = FIGHTER_STATE.HURT;
    }
    return true;
  }
}

// 11 - CAPITÃO AMÉRICA: Q brande o escudo e reduz dano por 5s; Ult lança escudo, persegue, pega no ar e joga o alvo pra cima
export class CaptainAmericaBehavior extends BaseCharacter {
  constructor() { super('capitao_america', 'Capitão América'); }
  init(fighter) {
    fighter.isCaptainAmerica = true;
    fighter.captainShieldDefenseTimer = 0;
    fighter.captainShield = null;
    fighter.captainShieldSlam = null;
  }
  reset(fighter) {
    fighter.captainShieldDefenseTimer = 0;
    fighter.captainShield = null;
    fighter.captainShieldSlam = null;
  }
  onSpecial(fighter, level) {
    // Q rework: Brande o escudo de Vibranium e recebe dano reduzido pelos próximos segundos (ZERO raios!)
    fighter.extraType = 'CAPTAIN_SHIELD_GUARD';
    sounds.playParryReflect();
    sounds.playWhoosh();
    fighter.captainShieldDefenseTimer = level === 2 ? 6.0 : 4.5;
    fighter.velocity.x = 0;
    return true;
  }
  onSuper(fighter) {
    // Ult rework: Joga o escudo, corre pro alvo, pega o escudo no ar e lança o alvo pra cima
    fighter.superType = 'CAPTAIN_SHIELD_SLAM';
    fighter.superPhase = 'SHIELD_LEAP_SLAM';
    sounds.playSuperCharge();
    sounds.playParryReflect();
    fighter.captainShieldSlam = {
      timer: 0,
      phase: 'THROW_RUSH',
      active: true,
      hasHit: false
    };
    return true;
  }
  update(fighter, dt, stageWidth, particles) {
    if (fighter.captainShieldDefenseTimer > 0) {
      fighter.captainShieldDefenseTimer -= dt;
      if (particles && Math.random() < 0.3) {
        particles.emitShockwave(fighter.position.x, fighter.position.y - 50, 45, '#3b82f6');
      }
    }
  }
}

export const zorroBehavior = new ZorroBehavior();
export const aangBehavior = new AangBehavior();
export const doctorStrangeBehavior = new DoctorStrangeBehavior();
export const walterWhiteBehavior = new WalterWhiteBehavior();
export const messiBehavior = new MessiBehavior();
export const nascimentoBehavior = new NascimentoBehavior();
export const rapunzelBehavior = new RapunzelBehavior();
export const captainAmericaBehavior = new CaptainAmericaBehavior();
