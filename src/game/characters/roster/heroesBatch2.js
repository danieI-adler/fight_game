import { BaseCharacter } from '../base/BaseCharacter.js';
import { sounds } from '../../audio/soundManager.js';
import { FIGHTER_STATE } from '../../engine/Fighter.js';

export class SasukeBehavior extends BaseCharacter {
  constructor() { super('sasuke', 'Sasuke Uchiha'); }
  init(fighter) { fighter.isSasuke = true; }
  onSpecial(fighter, level) {
    fighter.extraType = 'SASUKE_CHIDORI_RUSH';
    sounds.playElectricZap();
    sounds.playDash();
    fighter.sasukeChidori = {
      timer: 0,
      startX: fighter.position.x,
      targetX: fighter.opponent ? fighter.opponent.position.x : fighter.position.x + fighter.facing * 350,
      damage: level === 2 ? 190 : 125,
      active: true,
      hasHit: false
    };
    return true;
  }
  onSuper(fighter) {
    fighter.superType = 'SASUKE_KIRIN';
    fighter.superPhase = 'KIRIN_STRIKE';
    sounds.playSuperCharge();
    sounds.playThunderSlam();
    fighter.sasukeKirin = {
      timer: 0,
      x: fighter.opponent ? fighter.opponent.position.x : fighter.position.x + fighter.facing * 200,
      y: fighter.groundY - 180,
      damage: 420,
      active: true,
      hasHit: false,
      lightningFlashes: 0
    };
    return true;
  }
}

// 13 - BOB ESPONJA: Q sem raios (hambúrgueres giratórios); Ult sopra bolha de sabão no alvo deixando stunado com dano leve contínuo
export class SpongeBobBehavior extends BaseCharacter {
  constructor() { super('spongebob', 'Bob Esponja'); }
  init(fighter) {
    fighter.isSpongeBob = true;
    fighter.spongebobPatty = null;
    fighter.spongebobBubbleSpatula = null;
  }
  reset(fighter) {
    fighter.spongebobPatty = null;
    fighter.spongebobBubbleSpatula = null;
  }
  onSpecial(fighter, level) {
    // Q: Hambúrguer de Siri giratório sem nenhum raio!
    fighter.extraType = 'SPONGEBOB_PATTY_THROW';
    sounds.playWhoosh();
    fighter.spongebobPatty = {
      x: fighter.position.x + fighter.facing * 30,
      y: fighter.position.y - 65,
      vx: fighter.facing * (level === 2 ? 780 : 620),
      vy: -140,
      rot: 0,
      damage: level === 2 ? 165 : 105,
      active: true,
      hasHit: false
    };
    return true;
  }
  onSuper(fighter) {
    // Ult: Sopra uma bolha de sabão gigante que prende o alvo stunado e dá dano contínuo
    fighter.superType = 'SPONGEBOB_BUBBLE_SPATULA';
    fighter.superPhase = 'BUBBLE_TRAP';
    sounds.playSuperCharge();
    sounds.playWaterSplash();
    const target = fighter.opponent;
    fighter.spongebobBubbleSpatula = {
      timer: 0,
      target: target,
      damage: 380,
      active: true,
      hitsLanded: 0
    };
    if (target && !target.isDead) {
      target.hitstunTime = 1.45;
      target.state = FIGHTER_STATE.HURT;
      target.velocity.x = 0;
      target.velocity.y = -2;
    }
    return true;
  }
}

// 14 - HOMEM DE FERRO: Q e Ult sem travar o jogo
export class IronManBehavior extends BaseCharacter {
  constructor() { super('ironman', 'Homem de Ferro'); }
  init(fighter) {
    fighter.isIronMan = true;
    fighter.ironmanRepulsor = null;
    fighter.ironmanUnibeam = null;
  }
  reset(fighter) {
    fighter.ironmanRepulsor = null;
    fighter.ironmanUnibeam = null;
  }
  onSpecial(fighter, level) {
    fighter.extraType = 'IRONMAN_REPULSOR_BEAM';
    sounds.playLaser();
    fighter.ironmanRepulsor = {
      x: fighter.position.x + fighter.facing * 40,
      y: fighter.position.y - 65,
      vx: fighter.facing * (level === 2 ? 1200 : 950),
      damage: level === 2 ? 180 : 115,
      active: true,
      hasHit: false
    };
    return true;
  }
  onSuper(fighter) {
    fighter.superType = 'IRONMAN_UNIBEAM';
    fighter.superPhase = 'UNIBEAM_BLAST';
    sounds.playSuperCharge();
    sounds.playLaser();
    fighter.ironmanUnibeam = {
      timer: 0,
      reach: 1200,
      width: 55,
      damage: 410,
      active: true,
      tickTimer: 0
    };
    return true;
  }
}

// 15 - HOMEM-ARANHA: Q puxão acrobático; Ult casulo de teias cinemático
export class SpiderManBehavior extends BaseCharacter {
  constructor() { super('spiderman', 'Homem-Aranha'); }
  init(fighter) {
    fighter.isSpiderMan = true;
    fighter.spidermanWeb = null;
    fighter.spidermanWebBarrage = null;
  }
  reset(fighter) {
    fighter.spidermanWeb = null;
    fighter.spidermanWebBarrage = null;
  }
  onSpecial(fighter, level) {
    fighter.extraType = 'SPIDERMAN_WEB_PULL';
    sounds.playWhoosh();
    fighter.spidermanWeb = {
      x: fighter.position.x + fighter.facing * 35,
      y: fighter.position.y - 65,
      vx: fighter.facing * (level === 2 ? 1150 : 920),
      vy: 0,
      damage: level === 2 ? 165 : 100,
      active: true,
      hasHit: false,
      pulling: false
    };
    return true;
  }
  onSuper(fighter) {
    fighter.superType = 'SPIDERMAN_WEB_BARRAGE';
    fighter.superPhase = 'WEB_COCOON_BARRAGE';
    sounds.playSuperCharge();
    sounds.playWhoosh();
    fighter.spidermanWebBarrage = {
      timer: 0,
      phase: 'COCOON',
      target: fighter.opponent,
      active: true,
      hitsLanded: 0
    };
    if (fighter.opponent && !fighter.opponent.isDead) {
      fighter.opponent.hitstunTime = 1.5;
      fighter.opponent.state = FIGHTER_STATE.HURT;
    }
    return true;
  }
}

// 16 - YOSHI: Ult a língua engole o oponente pro estômago, causando dano e cuspindo depois!
export class YoshiBehavior extends BaseCharacter {
  constructor() { super('yoshi', 'Yoshi'); }
  init(fighter) {
    fighter.isYoshi = true;
    fighter.yoshiEgg = null;
    fighter.yoshiTongueSwallow = null;
  }
  reset(fighter) {
    fighter.yoshiEgg = null;
    fighter.yoshiTongueSwallow = null;
  }
  onSpecial(fighter, level) {
    fighter.extraType = 'YOSHI_EGG_THROW';
    sounds.playPunch(false);
    fighter.yoshiEgg = {
      x: fighter.position.x + fighter.facing * 35,
      y: fighter.position.y - 65,
      vx: fighter.facing * (level === 2 ? 750 : 580),
      vy: -240,
      bounces: 0,
      damage: level === 2 ? 170 : 110,
      active: true,
      hasHit: false
    };
    return true;
  }
  onSuper(fighter) {
    // Ult: Língua do Yoshi puxando o inimigo pro estômago, cospe depois de causar dano!
    fighter.superType = 'YOSHI_EGG_BOMBER';
    fighter.superPhase = 'TONGUE_SWALLOW';
    sounds.playSuperCharge();
    sounds.playWhoosh();
    fighter.yoshiTongueSwallow = {
      timer: 0,
      phase: 'TONGUE_OUT', // 'TONGUE_OUT' -> 'SWALLOWED' -> 'SPIT_OUT'
      target: fighter.opponent,
      active: true,
      damage: 420
    };
    return true;
  }
  update(fighter, dt, stageWidth, particles) {
    if (fighter.yoshiEgg && fighter.yoshiEgg.active) {
      const ye = fighter.yoshiEgg;
      ye.x += ye.vx * dt;
      ye.vy += 800 * dt;
      ye.y += ye.vy * dt;
      if (ye.y >= fighter.groundY) {
        ye.y = fighter.groundY;
        ye.vy = -ye.vy * 0.6;
        ye.bounces = (ye.bounces || 0) + 1;
        if (ye.bounces >= 3) {
          ye.active = false;
          fighter.yoshiEgg = null;
        }
      }
      if (fighter.opponent && !fighter.opponent.isDead && !ye.hasHit) {
        const dist = Math.abs(ye.x - fighter.opponent.position.x);
        if (dist < 45 && Math.abs(ye.y - (fighter.opponent.position.y - 50)) < 60) {
          ye.hasHit = true;
          ye.active = false;
          fighter.yoshiEgg = null;
          sounds.playPunch(true);
          if (particles) {
            particles.emitShockwave(ye.x, ye.y, 90, '#22c55e');
            particles.emitSparks(ye.x, ye.y, '#ffffff', 18, 6);
          }
          fighter.opponent.receiveHit({
            damage: ye.damage,
            knockback: 14,
            knockdown: true,
            isHeavy: true,
            attackerPower: fighter.attackPower
          }, { x: ye.x, y: ye.y }, particles);
        }
      }
    }

    if (fighter.yoshiTongueSwallow && fighter.yoshiTongueSwallow.active) {
      const yts = fighter.yoshiTongueSwallow;
      yts.timer += dt;
      const target = yts.target;

      if (yts.phase === 'TONGUE_OUT') {
        if (target && !target.isDead) {
          const dist = Math.abs(fighter.position.x - target.position.x);
          if (dist < 320 && yts.timer > 0.08) {
            yts.phase = 'SWALLOWED';
            sounds.playPunch(true);
            target.position.x = fighter.position.x + fighter.facing * 20;
            target.position.y = fighter.position.y;
            target.hitstunTime = 0.8;
            if (particles) {
              particles.emitShockwave(target.position.x, target.position.y - 45, 100, '#ec4899');
            }
          }
        }
        if (yts.timer >= 0.35 && yts.phase === 'TONGUE_OUT') {
          yts.phase = 'SPIT_OUT';
        }
      } else if (yts.phase === 'SWALLOWED') {
        if (target && !target.isDead) {
          target.position.x = fighter.position.x;
          target.velocity.x = 0;
          target.velocity.y = 0;
        }
        if (yts.timer >= 0.75) {
          yts.phase = 'SPIT_OUT';
          sounds.playWhoosh();
          sounds.playThunderSlam();
          if (target && !target.isDead) {
            target.position.x = fighter.position.x + fighter.facing * 55;
            target.velocity.x = fighter.facing * 24;
            target.velocity.y = -8;
            target.isGrounded = false;
            if (particles) {
              particles.emitShockwave(target.position.x, target.position.y - 50, 180, '#22c55e');
              particles.emitSparks(target.position.x, target.position.y - 50, '#fbbf24', 25, 8);
            }
            target.receiveHit({
              damage: yts.damage,
              knockback: 26,
              knockdown: true,
              isHeavy: true,
              unblockable: true,
              attackerPower: fighter.attackPower
            }, { x: target.position.x, y: target.position.y - 50 }, particles);
          }
        }
      } else if (yts.phase === 'SPIT_OUT' && yts.timer >= 1.05) {
        yts.active = false;
        fighter.yoshiTongueSwallow = null;
        fighter.superPhase = null;
        fighter.superType = null;
        fighter.isInvulnerable = false;
        if (fighter.state === FIGHTER_STATE.SUPER_MOVE) {
          fighter.state = FIGHTER_STATE.IDLE;
        }
      }
    }
  }
  draw(ctx, fighter) {
    if (fighter.yoshiEgg && fighter.yoshiEgg.active) {
      const ye = fighter.yoshiEgg;
      ctx.save();
      ctx.translate(ye.x, ye.y);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(-4, -4, 4, 0, Math.PI * 2);
      ctx.arc(4, 5, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    if (fighter.yoshiTongueSwallow && fighter.yoshiTongueSwallow.active) {
      const yts = fighter.yoshiTongueSwallow;
      if (yts.phase === 'TONGUE_OUT') {
        const tx = fighter.position.x + fighter.facing * Math.min(300, yts.timer * 900);
        const ty = fighter.position.y - 55;
        ctx.save();
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(fighter.position.x + fighter.facing * 25, fighter.position.y - 55);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.fillStyle = '#fda4af';
        ctx.beginPath();
        ctx.arc(tx, ty, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }
}

// PIKACHU
export class PikachuBehavior extends BaseCharacter {
  constructor() { super('pikachu', 'Pikachu'); }
  init(fighter) {
    fighter.isPikachu = true;
    fighter.pikachuQuickAttack = null;
    fighter.pikachuThunder = null;
  }
  reset(fighter) {
    fighter.pikachuQuickAttack = null;
    fighter.pikachuThunder = null;
  }
  onSpecial(fighter, level) {
    fighter.extraType = 'PIKACHU_QUICK_ATTACK';
    sounds.playElectricZap();
    sounds.playDash();
    fighter.pikachuQuickAttack = {
      timer: 0,
      startX: fighter.position.x,
      targetX: fighter.opponent ? fighter.opponent.position.x : fighter.position.x + fighter.facing * 320,
      damage: level === 2 ? 180 : 115,
      active: true,
      hasHit: false
    };
    return true;
  }
  onSuper(fighter) {
    fighter.superType = 'PIKACHU_THUNDER_STRIKE';
    fighter.superPhase = 'THUNDER_CHARGE';
    sounds.playSuperCharge();
    sounds.playElectricZap();
    fighter.pikachuThunder = {
      timer: 0,
      x: fighter.opponent ? fighter.opponent.position.x : fighter.position.x + fighter.facing * 180,
      y: fighter.groundY - 220,
      damage: 430,
      active: true,
      hasHit: false
    };
    return true;
  }
}

// 17 - SONIC: Ult concede double jump, aumenta velocidade dos hits, velocidade de movimento e dash maior
export class SonicBehavior extends BaseCharacter {
  constructor() { super('sonic', 'Sonic'); }
  init(fighter) {
    fighter.isSonic = true;
    fighter.sonicSpinDash = null;
    fighter.superSonicTimer = 0;
  }
  reset(fighter) {
    fighter.sonicSpinDash = null;
    fighter.superSonicTimer = 0;
  }
  onSpecial(fighter, level) {
    fighter.extraType = 'SONIC_SPIN_DASH';
    sounds.playDash();
    fighter.sonicSpinDash = {
      timer: 0,
      startX: fighter.position.x,
      targetX: fighter.opponent ? fighter.opponent.position.x + fighter.facing * 60 : fighter.position.x + fighter.facing * 400,
      damage: level === 2 ? 190 : 120,
      active: true,
      hasHit: false
    };
    return true;
  }
  onSuper(fighter) {
    // Ult: Super Sonic (Permite Double Jump, velocidade dos hits aumentada, move speed turbinado e dash estendido)
    fighter.superType = 'SONIC_SUPER_TRANSFORMATION';
    fighter.superPhase = 'SUPER_SONIC_TRANSFORM';
    sounds.playSuperCharge();
    sounds.playSuper();
    fighter.superSonicTimer = 8.0; // 8 segundos de Super Sonic!
    fighter.speed = (fighter.baseSpeed || 10.2) * 1.5; // +50% move speed
    fighter.canDoubleJump = true; // Permite Double Jump!
    return true;
  }
  update(fighter, dt, stageWidth, particles) {
    if (fighter.superSonicTimer > 0) {
      fighter.superSonicTimer -= dt;
      fighter.canDoubleJump = true;
      if (particles && Math.random() < 0.4) {
        particles.emitSparks(fighter.position.x, fighter.position.y - 50, '#facc15', 4, 3);
      }
      if (fighter.superSonicTimer <= 0) {
        fighter.speed = fighter.baseSpeed || 10.2;
        fighter.canDoubleJump = false;
      }
    }
  }
}

// 18 - BANE: Q injeta veneno nas veias e fica maior em tamanho causando mais dano; Ult agarrão devastador no local atual
export class BaneBehavior extends BaseCharacter {
  constructor() { super('bane', 'Bane'); }
  init(fighter) {
    fighter.isBane = true;
    fighter.baneVenomBuffTimer = 0;
    fighter.baneVenomSmash = null;
  }
  reset(fighter) {
    fighter.baneVenomBuffTimer = 0;
    fighter.baneVenomSmash = null;
  }
  onSpecial(fighter, level) {
    // Q rework: Injeta veneno Venom nas veias, aumenta tamanho e ganha buff de dano!
    fighter.extraType = 'BANE_VENOM_INJECTION';
    sounds.playSuperCharge();
    sounds.playWhoosh();
    fighter.baneVenomBuffTimer = level === 2 ? 8.0 : 5.5;
    fighter.attackPower = (fighter.baseAttackPower || 1.1) * 1.4; // +40% de dano!
    return true;
  }
  onSuper(fighter) {
    // Ult: Fica reluzente e no primeiro contato aplica o quebra-costas clássico
    fighter.superType = 'BANE_BACKBREAKER_SLAM';
    fighter.superPhase = 'VENOM_RUSH_SLAM';
    sounds.playSuperCharge();
    sounds.playThunderSlam();
    fighter.baneVenomSmash = {
      timer: 0,
      reach: 120,
      damage: 440,
      active: true,
      hasHit: false
    };
    return true;
  }
  update(fighter, dt, stageWidth, particles) {
    if (fighter.baneVenomBuffTimer > 0) {
      fighter.baneVenomBuffTimer -= dt;
      if (particles && Math.random() < 0.3) {
        particles.emitSparks(fighter.position.x, fighter.position.y - 65, '#22c55e', 3, 2);
      }
      if (fighter.baneVenomBuffTimer <= 0) {
        fighter.attackPower = fighter.baseAttackPower || 1.1;
      }
    }
  }
}

export const sasukeBehavior = new SasukeBehavior();
export const spongebobBehavior = new SpongeBobBehavior();
export const ironmanBehavior = new IronManBehavior();
export const spidermanBehavior = new SpiderManBehavior();
export const yoshiBehavior = new YoshiBehavior();
export const pikachuBehavior = new PikachuBehavior();
export const sonicBehavior = new SonicBehavior();
export const baneBehavior = new BaneBehavior();

