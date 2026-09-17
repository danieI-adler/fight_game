import { BaseCharacter } from '../base/BaseCharacter.js';
import { sounds } from '../../audio/soundManager.js';
import { FIGHTER_STATE } from '../../engine/Fighter.js';

export class DraculaBehavior extends BaseCharacter {
  constructor() { super('dracula', 'Drácula'); }
  init(fighter) {
    fighter.isDracula = true;
    fighter.draculaBatSwarm = null;
    fighter.draculaBloodEclipse = null;
  }
  reset(fighter) {
    fighter.draculaBatSwarm = null;
    fighter.draculaBloodEclipse = null;
  }
  onSpecial(fighter, level) {
    fighter.extraType = 'DRACULA_BAT_SWARM';
    sounds.playWhoosh();
    fighter.draculaBatSwarm = {
      x: fighter.position.x + fighter.facing * 35,
      y: fighter.position.y - 65,
      vx: fighter.facing * (level === 2 ? 850 : 650),
      damage: level === 2 ? 175 : 110,
      active: true,
      hasHit: false
    };
    return true;
  }
  onSuper(fighter) {
    fighter.superType = 'DRACULA_BLOOD_ECLIPSE';
    fighter.superPhase = 'BLOOD_ECLIPSE';
    sounds.playSuperCharge();
    sounds.playWhoosh();
    fighter.draculaBloodEclipse = {
      timer: 0,
      target: fighter.opponent,
      damage: 420,
      active: true,
      hitsLanded: 0
    };
    // Cura 15% de vida
    fighter.health = Math.min(fighter.maxHealth, fighter.health + Math.round(fighter.maxHealth * 0.15));
    return true;
  }
}

// 19 - KIRITO: Não trava no Q nem na Ult. Q Starburst Stream com áudio; Ult Dual Wield (duas espadas, combo J e K)
export class KiritoBehavior extends BaseCharacter {
  constructor() { super('kirito', 'Kirito'); }
  init(fighter) {
    fighter.isKirito = true;
    fighter.kiritoStarburstQ = null;
    fighter.kiritoDualBladeActive = false;
    fighter.kiritoDualBladeTimer = 0;
    fighter.kiritoStarburstCooldown = 0;
  }
  reset(fighter) {
    fighter.kiritoStarburstQ = null;
    fighter.kiritoDualBladeActive = false;
    fighter.kiritoDualBladeTimer = 0;
    fighter.kiritoStarburstCooldown = 0;
  }
  // Q: Starburst Stream com áudio oficial e avanço supersônico fatiando o inimigo
  onSpecial(fighter, level) {
    fighter.extraType = 'KIRITO_STARBURST_Q';
    sounds.playKiritoStarburst();
    sounds.playLaser();
    sounds.playDash();
    fighter.velocity.x = fighter.facing * 1250;
    fighter.isInvulnerable = true;
    fighter.kiritoStarburstQ = {
      timer: 0,
      damage: level === 2 ? 220 : 150,
      active: true,
      hasHit: false
    };
    return true;
  }
  // R (Super): Empunhadura Dupla (Dual Wield) - Kirito saca a Dark Repulser e comba J e K alternando as espadas!
  onSuper(fighter) {
    fighter.superType = 'KIRITO_DUAL_WIELD';
    fighter.superPhase = 'DUAL_WIELD_STANCE';
    sounds.playSuperCharge();
    sounds.playRapierSlash();
    fighter.kiritoDualBladeActive = true;
    fighter.kiritoDualBladeTimer = 15.0; // 15 segundos em modo Dual Wield!
    fighter.attackPower = (fighter.baseAttackPower || 1.18) * 1.35;
    fighter.speed = (fighter.baseSpeed || 8.9) * 1.25;
    fighter.isInvulnerable = true;
    return true;
  }
  update(fighter, dt, stageWidth, particles) {
    // 19 - Kirito: Q Starburst Stream avanço e recuperação rápida
    if (fighter.kiritoStarburstQ && fighter.kiritoStarburstQ.active) {
      const kq = fighter.kiritoStarburstQ;
      kq.timer += dt;

      if (particles && Math.random() < 0.6) {
        particles.emitSparks(fighter.position.x, fighter.position.y - 60, '#38bdf8', 6, 5);
        particles.emitSparks(fighter.position.x, fighter.position.y - 60, '#ffffff', 4, 3);
      }

      if (fighter.opponent && !fighter.opponent.isDead && !kq.hasHit && kq.timer > 0.05) {
        const dist = Math.abs(fighter.position.x - fighter.opponent.position.x);
        if (dist < 90) {
          kq.hasHit = true;
          sounds.playPunch(true);
          sounds.playLaser();
          if (particles) {
            particles.emitShockwave(fighter.opponent.position.x, fighter.opponent.position.y - 60, 160, '#38bdf8');
            particles.emitSparks(fighter.opponent.position.x, fighter.opponent.position.y - 60, '#ffffff', 30, 12);
          }
          const attackData = {
            damage: kq.damage,
            knockback: 18,
            knockdown: true,
            isHeavy: true,
            attackerPower: fighter.attackPower
          };
          fighter.opponent.receiveHit(attackData, { x: fighter.opponent.position.x, y: fighter.opponent.position.y - 60 }, particles);
        }
      }

      if (kq.timer >= 0.22) {
        kq.active = false;
        fighter.kiritoStarburstQ = null;
        fighter.extraType = null;
        fighter.isInvulnerable = false;
        fighter.velocity.x *= 0.2;
        if (fighter.state === FIGHTER_STATE.SPECIAL_1) {
          fighter.state = FIGHTER_STATE.IDLE;
        }
      }
    }

    // 19 - Kirito: Duração do modo Dual Wield (R)
    if (fighter.kiritoDualBladeTimer > 0) {
      fighter.kiritoDualBladeTimer -= dt;
      if (particles && Math.random() < 0.25) {
        particles.emitSparks(fighter.position.x - fighter.facing * 15, fighter.position.y - 60, '#38bdf8', 2, 2);
        particles.emitSparks(fighter.position.x + fighter.facing * 15, fighter.position.y - 60, '#34d399', 2, 2);
      }
      if (fighter.kiritoDualBladeTimer <= 0) {
        fighter.kiritoDualBladeActive = false;
        fighter.attackPower = fighter.baseAttackPower || 1.18;
        fighter.speed = fighter.baseSpeed || 8.9;
      }
    }

    // Recuperação da animação da Ultimate (ativação da postura)
    if (fighter.superType === 'KIRITO_DUAL_WIELD' && fighter.stateTime >= 0.25) {
      fighter.state = FIGHTER_STATE.IDLE;
      fighter.superType = null;
      fighter.superPhase = null;
      fighter.isInvulnerable = false;
    }
  }
}

// 20 - EREN: Q joga o DMT com o fio e golpeia; Ult o raio cai NELE e ele vira Titã maior que o Hulk
export class ErenBehavior extends BaseCharacter {
  constructor() { super('eren', 'Eren Yeager'); }
  init(fighter) {
    fighter.isEren = true;
    fighter.erenDmtRush = null;
    fighter.erenTitanRoar = null;
  }
  reset(fighter) {
    fighter.erenDmtRush = null;
    fighter.erenTitanRoar = null;
  }
  onSpecial(fighter, level) {
    // Q: Dispositivo DMT & Lâminas de Aço (lança cabo com fio e golpeia)
    fighter.extraType = 'EREN_DMT_DASH';
    sounds.playWhoosh();
    sounds.playDash();
    const target = fighter.opponent;
    const targetX = target ? target.position.x + fighter.facing * 40 : fighter.position.x + fighter.facing * 270;
    fighter.erenDmtRush = {
      timer: 0,
      startX: fighter.position.x,
      targetX: targetX,
      damage: level === 2 ? 200 : 130,
      active: true,
      hasHit: false
    };
    return true;
  }
  onSuper(fighter) {
    // Ult: O raio cai NELE e ele se transforma no Titã de Ataque colossal!
    fighter.superType = 'EREN_TITAN_ROAR';
    fighter.superPhase = 'TITAN_TRANSFORMATION';
    sounds.playSuperCharge();
    sounds.playThunderSlam();
    fighter.erenTitanRoar = {
      timer: 0,
      x: fighter.position.x, // Raio cai exatamente sobre o Eren!
      y: fighter.groundY - 140,
      damage: 440,
      active: true,
      hasHit: false
    };
    return true;
  }
}

// 21 - BRUCE LEE: Q sem raiozinho (socos rápidos Wing Chun e voadora pura)
export class BruceLeeBehavior extends BaseCharacter {
  constructor() { super('bruce_lee', 'Bruce Lee'); }
  init(fighter) {
    fighter.isBruceLee = true;
    fighter.bruceOneInch = null;
  }
  reset(fighter) {
    fighter.bruceOneInch = null;
  }
  onSpecial(fighter, level) {
    // Q rework: One Inch Punch & Wing Chun Flurry SEM NENHUM RAIO!
    fighter.extraType = 'BRUCE_LEE_ONE_INCH_PUNCH';
    sounds.playPunch(true);
    sounds.playWhoosh();
    fighter.bruceOneInch = {
      timer: 0.3,
      damage: level === 2 ? 210 : 145,
      active: true,
      hasHit: false
    };
    return true;
  }
  onSuper(fighter) {
    fighter.superType = 'BRUCE_LEE_DRAGON_FURY';
    fighter.superPhase = 'DRAGON_FURY';
    sounds.playSuperCharge();
    sounds.playPunch(true);
    fighter.bruceLeeFury = {
      timer: 0,
      target: fighter.opponent,
      damage: 430,
      active: true,
      hitsLanded: 0
    };
    return true;
  }
}

// 23 - YODA: Q Force Push jogando o alvo pra longe; Ult ataque hiper rápido com pulos e sabre verde Ataru
export class YodaBehavior extends BaseCharacter {
  constructor() { super('yoda', 'Mestre Yoda'); }
  init(fighter) {
    fighter.isYoda = true;
    fighter.yodaForcePush = null;
    fighter.yodaAtaruFlurry = null;
  }
  reset(fighter) {
    fighter.yodaForcePush = null;
    fighter.yodaAtaruFlurry = null;
  }
  onSpecial(fighter, level) {
    // Q rework: Force Push repulsor jogando o alvo longe (sem raiozinho elétrico)
    fighter.extraType = 'YODA_FORCE_PUSH';
    sounds.playDimensionalPierce();
    sounds.playWhoosh();
    fighter.yodaForcePush = {
      timer: 0.35,
      reach: level === 2 ? 360 : 250,
      damage: level === 2 ? 180 : 110,
      active: true,
      hasHit: false
    };
    if (fighter.opponent && !fighter.opponent.isDead) {
      const dist = Math.abs(fighter.position.x - fighter.opponent.position.x);
      if (dist < 260) {
        fighter.opponent.velocity.x = fighter.facing * 28; // Joga pra longe!
        fighter.opponent.hitstunTime = 0.5;
      }
    }
    return true;
  }
  onSuper(fighter) {
    // Ult rework: Ataque hiper rápido com pulos acrobáticos e sabre verde Forma IV Ataru
    fighter.superType = 'YODA_FORCE_UNLEASHED';
    fighter.superPhase = 'ATARU_STORM';
    sounds.playSuperCharge();
    sounds.playRapierSlash();
    const ataruObj = {
      timer: 0,
      target: fighter.opponent,
      damage: 420,
      active: true,
      hitsLanded: 0
    };
    fighter.yodaAtaru = ataruObj;
    fighter.yodaAtaruFlurry = ataruObj;
    return true;
  }
  update(fighter, dt, stageWidth, particles) {
    // Recovery e animação acrobática da Ultimate Ataru de Yoda
    if (fighter.yodaAtaru && fighter.yodaAtaru.active) {
      const ya = fighter.yodaAtaru;
      ya.timer += dt;
      const target = ya.target;

      if (particles && Math.random() < 0.8) {
        particles.emitSparks(fighter.position.x, fighter.position.y - 50, '#22c55e', 6, 4);
      }

      const strikeTimes = [0.15, 0.35, 0.55, 0.75, 0.95];
      for (let i = ya.hitsLanded; i < strikeTimes.length; i++) {
        if (ya.timer >= strikeTimes[i]) {
          ya.hitsLanded = i + 1;
          sounds.playLaser();
          sounds.playRapierSlash();
          const isFinal = i === strikeTimes.length - 1;
          if (target && !target.isDead) {
            fighter.position.x = target.position.x + (i % 2 === 0 ? -1 : 1) * 45;
            fighter.position.y = fighter.groundY - 35;
            fighter.velocity.y = -5;
            fighter.isGrounded = false;
            if (particles) {
              particles.emitShockwave(target.position.x, target.position.y - 50, isFinal ? 200 : 110, '#22c55e');
              particles.emitSparks(target.position.x, target.position.y - 50, '#22c55e', isFinal ? 30 : 14, 8);
            }
            const attackData = {
              damage: Math.round(ya.damage / 5),
              knockback: isFinal ? 28 : 5,
              knockdown: isFinal,
              isHeavy: isFinal,
              unblockable: true,
              attackerPower: fighter.attackPower
            };
            target.receiveHit(attackData, { x: target.position.x, y: target.position.y - 50 }, particles);
          }
        }
      }

      if (ya.timer >= 1.15) {
        ya.active = false;
        fighter.yodaAtaru = null;
        fighter.yodaAtaruFlurry = null;
        fighter.superPhase = null;
        fighter.superType = null;
        fighter.isInvulnerable = false;
        fighter.isGrounded = true;
        fighter.position.y = fighter.groundY;
        if (fighter.state === FIGHTER_STATE.SUPER_MOVE) {
          fighter.state = FIGHTER_STATE.IDLE;
        }
      }
    }
  }
}

// 24 - HAN SOLO: Q Chewie aparece e dá tiros de besta; Ult Millennium Falcon dá tiros de suporte
export class HanSoloBehavior extends BaseCharacter {
  constructor() { super('han_solo', 'Han Solo'); }
  init(fighter) {
    fighter.isHanSolo = true;
    fighter.chewieBowcaster = null;
    fighter.falconSupport = null;
  }
  reset(fighter) {
    fighter.chewieBowcaster = null;
    fighter.falconSupport = null;
  }
  onSpecial(fighter, level) {
    // Q rework: Chewie aparece e dá tiros de besta Wookiee (Bowcaster)
    fighter.extraType = 'HAN_CHEWIE_BOWCASTER';
    sounds.playLaser();
    sounds.playGunshot();
    fighter.chewieBowcaster = {
      x: fighter.position.x - fighter.facing * 50,
      y: fighter.position.y - 70,
      vx: fighter.facing * (level === 2 ? 1150 : 920),
      damage: level === 2 ? 190 : 120,
      active: true,
      hasHit: false
    };
    return true;
  }
  onSuper(fighter) {
    // Ult rework: Millennium Falcon aparece em rasante dando suporte aéreo
    fighter.superType = 'HAN_SOLO_CARPET_BOMB';
    fighter.superPhase = 'FALCON_AIR_SUPPORT';
    sounds.playSuperCharge();
    sounds.playGunshot();
    fighter.falconSupport = {
      timer: 0,
      shotsFired: 0,
      maxShots: 6,
      interval: 0.18,
      damage: 425,
      active: true
    };
    return true;
  }
  update(fighter, dt, stageWidth, particles) {
    if (fighter.chewieBowcaster && fighter.chewieBowcaster.active) {
      const cb = fighter.chewieBowcaster;
      cb.x += cb.vx * dt;
      if (particles && Math.random() < 0.6) {
        particles.emitSparks(cb.x, cb.y, '#22c55e', 3, 2);
      }
      if (fighter.opponent && !fighter.opponent.isDead && !cb.hasHit) {
        const dist = Math.abs(cb.x - fighter.opponent.position.x);
        if (dist < 40 && Math.abs(cb.y - (fighter.opponent.position.y - 50)) < 60) {
          cb.hasHit = true;
          cb.active = false;
          sounds.playLaser();
          sounds.playPunch(true);
          if (particles) {
            particles.emitShockwave(cb.x, cb.y, 90, '#22c55e');
            particles.emitSparks(cb.x, cb.y, '#ef4444', 16, 6);
          }
          const attackData = {
            damage: cb.damage,
            knockback: 15,
            knockdown: true,
            isHeavy: true,
            attackerPower: fighter.attackPower
          };
          fighter.opponent.receiveHit(attackData, { x: cb.x, y: cb.y }, particles);
        }
      }
      if (cb.x < 0 || cb.x > stageWidth) {
        cb.active = false;
        fighter.chewieBowcaster = null;
      }
    }
  }
  draw(ctx, fighter) {
    if (fighter.chewieBowcaster && fighter.chewieBowcaster.active) {
      const cb = fighter.chewieBowcaster;
      ctx.save();
      // Desenha projétil de energia esmeralda da besta de Chewbacca
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#86efac';
      ctx.beginPath();
      ctx.ellipse(cb.x, cb.y, 16, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

// 25 - MARIO: Q cria canos conectados para teletransporte; Ult surge Cogumelo (cresce) com 1% de Estrela invencível
export class MarioBehavior extends BaseCharacter {
  constructor() { super('mario', 'Mario'); }
  init(fighter) {
    fighter.isMario = true;
    fighter.marioPipes = [];
    fighter.marioSuperSizeTimer = 0;
    fighter.marioStarInvincibleTimer = 0;
  }
  reset(fighter) {
    fighter.marioPipes = [];
    fighter.marioSuperSizeTimer = 0;
    fighter.marioStarInvincibleTimer = 0;
  }
  onSpecial(fighter, level) {
    // Q rework: Cria túnel/cano verde no chão. Se já tiver outro, entra e sai no outro!
    fighter.extraType = 'MARIO_WARP_PIPE';
    sounds.playWhoosh();
    const pipeX = fighter.position.x + fighter.facing * 60;
    if (fighter.marioPipes.length >= 2) {
      fighter.marioPipes.shift(); // Mantém no máximo 2 canos
    }
    fighter.marioPipes.push({ x: pipeX, y: fighter.groundY });
    if (fighter.marioPipes.length === 2) {
      // Teletransporta entre os canos!
      const dest = fighter.marioPipes[0];
      fighter.position.x = dest.x;
      sounds.playStaffBell();
    }
    return true;
  }
  onSuper(fighter) {
    // Ult rework: Surge Cogumelo (+tamanho e +dano) com 1% de chance de Estrela Dourada invencível!
    fighter.superType = 'MARIO_FINALE_FIRE';
    fighter.superPhase = 'SUPER_MUSHROOM';
    sounds.playSuperCharge();
    sounds.playSuper();
    const isStar = Math.random() < 0.01; // 1% de chance de estrela!
    if (isStar) {
      fighter.marioStarInvincibleTimer = 5.0; // 5 segundos invencível brilhando dourado!
      fighter.isInvulnerable = true;
    } else {
      fighter.marioSuperSizeTimer = 7.0; // Cogumelo deixa grande por 7s!
      fighter.attackPower = (fighter.baseAttackPower || 1.1) * 1.5;
    }
    return true;
  }
  update(fighter, dt, stageWidth, particles) {
    if (fighter.marioStarInvincibleTimer > 0) {
      fighter.marioStarInvincibleTimer -= dt;
      fighter.isInvulnerable = true;
      if (particles && Math.random() < 0.5) {
        particles.emitSparks(fighter.position.x, fighter.position.y - 45, '#facc15', 5, 4);
      }
      if (fighter.marioStarInvincibleTimer <= 0) {
        fighter.isInvulnerable = false;
      }
    }
    if (fighter.marioSuperSizeTimer > 0) {
      fighter.marioSuperSizeTimer -= dt;
      if (fighter.marioSuperSizeTimer <= 0) {
        fighter.attackPower = fighter.baseAttackPower || 1.1;
      }
    }
  }
  draw(ctx, fighter) {
    if (fighter.marioPipes && fighter.marioPipes.length > 0) {
      ctx.save();
      for (const pipe of fighter.marioPipes) {
        // Desenha cano verde clássico de Super Mario
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(pipe.x - 22, pipe.y - 42, 44, 42);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(pipe.x - 26, pipe.y - 54, 52, 14);
        ctx.strokeStyle = '#14532d';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(pipe.x - 26, pipe.y - 54, 52, 14);
        ctx.strokeRect(pipe.x - 22, pipe.y - 42, 44, 42);
      }
      ctx.restore();
    }
  }
}

// 26 - WOLVERINE: Q rework sem raiozinho, puro corte em X de garras de Adamantium
export class WolverineBehavior extends BaseCharacter {
  constructor() { super('wolverine', 'Wolverine'); }
  init(fighter) {
    fighter.isWolverine = true;
    fighter.wolverineXSlash = null;
  }
  reset(fighter) {
    fighter.wolverineXSlash = null;
  }
  onSpecial(fighter, level) {
    // Q rework: Corte cruzado em X com garras de Adamantium sem faísca elétrica!
    fighter.extraType = 'WOLVERINE_X_SLASH';
    sounds.playRapierSlash();
    sounds.playPunch(true);
    fighter.wolverineXSlash = {
      timer: 0.28,
      damage: level === 2 ? 200 : 135,
      active: true,
      hasHit: false
    };
    return true;
  }
  onSuper(fighter) {
    fighter.superType = 'WOLVERINE_BERSERKER_BARRAGE';
    fighter.superPhase = 'BERSERKER_BARRAGE';
    sounds.playSuperCharge();
    sounds.playRapierSlash();
    fighter.wolverineBarrage = {
      timer: 0,
      target: fighter.opponent,
      damage: 420,
      active: true,
      hitsLanded: 0
    };
    return true;
  }
}

// 27 - KRATOS: Q Lâminas do Caos com correntes de fogo; Ult concede buff de crítico e reduz dano recebido
export class KratosBehavior extends BaseCharacter {
  constructor() { super('kratos', 'Kratos'); }
  init(fighter) {
    fighter.isKratos = true;
    fighter.kratosBlades = null;
    fighter.spartanRageTimer = 0;
  }
  reset(fighter) {
    fighter.kratosBlades = null;
    fighter.spartanRageTimer = 0;
  }
  onSpecial(fighter, level) {
    // Q: Lâminas do Caos com correntes de fogo ardente (sem raiozinho)
    fighter.extraType = 'KRATOS_BLADES_OF_CHAOS';
    sounds.playFireCast();
    sounds.playRapierSlash();
    fighter.kratosBlades = {
      timer: 0.35,
      reach: level === 2 ? 340 : 240,
      damage: level === 2 ? 205 : 135,
      active: true,
      hasHit: false
    };
    return true;
  }
  onSuper(fighter) {
    // Ult rework: Fúria Espartana ativa buff de crítico e redução de dano recebido!
    fighter.superType = 'KRATOS_SPARTAN_RAGE';
    fighter.superPhase = 'SPARTAN_RAGE';
    sounds.playSuperCharge();
    sounds.playThunderSlam();
    fighter.spartanRageTimer = 8.0; // 8 segundos de Fúria Espartana!
    fighter.attackPower = (fighter.baseAttackPower || 1.2) * 1.45; // Buff brutal
    return true;
  }
  update(fighter, dt, stageWidth, particles) {
    if (fighter.spartanRageTimer > 0) {
      fighter.spartanRageTimer -= dt;
      if (particles && Math.random() < 0.35) {
        particles.emitSparks(fighter.position.x, fighter.position.y - 60, '#ef4444', 4, 3);
      }
      if (fighter.spartanRageTimer <= 0) {
        fighter.attackPower = fighter.baseAttackPower || 1.2;
      }
    }
  }
}

export class VenomBehavior extends BaseCharacter {
  constructor() { super('venom', 'Venom'); }
  init(fighter) { fighter.isVenom = true; }
  onSpecial(fighter, level) {
    fighter.extraType = 'VENOM_TENDRILS';
    sounds.playPunch(true);
    sounds.playWhoosh();
    return true;
  }
  onSuper(fighter) {
    fighter.superType = 'VENOM_WE_ARE_VENOM';
    fighter.superPhase = 'WE_ARE_VENOM';
    sounds.playSuperCharge();
    return true;
  }
}

export class CarnageBehavior extends BaseCharacter {
  constructor() { super('carnage', 'Carnificina'); }
  init(fighter) { fighter.isCarnage = true; }
  onSpecial(fighter, level) {
    fighter.extraType = 'CARNAGE_SCYTHES';
    sounds.playRapierSlash();
    return true;
  }
  onSuper(fighter) {
    fighter.superType = 'CARNAGE_MAXIMUM_CARNAGE';
    fighter.superPhase = 'MAXIMUM_CARNAGE';
    sounds.playSuperCharge();
    sounds.playRapierSlash();
    return true;
  }
}

// 28 - HOMELANDER: Q voo por 3 a 6s segurando W e golpe caindo causa 200% de dano; Ult olhos a laser
export class HomelanderBehavior extends BaseCharacter {
  constructor() { super('homelander', 'Capitão Pátria'); }
  init(fighter) {
    fighter.isHomelander = true;
    fighter.homelanderFlightTimer = 0;
  }
  reset(fighter) {
    fighter.homelanderFlightTimer = 0;
  }
  onSpecial(fighter, level) {
    // Q rework: Permite voo por 3 a 6 segundos! Ao golpear caindo, dá 200% de dano
    fighter.extraType = 'HOMELANDER_FLIGHT_MODE';
    sounds.playSuperCharge();
    sounds.playWhoosh();
    fighter.homelanderFlightTimer = level === 2 ? 6.0 : 3.5;
    fighter.velocity.y = -12; // Decola imediatamente!
    fighter.isGrounded = false;
    return true;
  }
  onSuper(fighter) {
    // Ult: Olhos a laser devastadores
    fighter.superType = 'HOMELANDER_LASER_EYES';
    fighter.superPhase = 'LASER_SWEEP';
    sounds.playSuperCharge();
    sounds.playLaser();
    fighter.homelanderLaser = {
      timer: 0,
      reach: 1200,
      damage: 440,
      active: true
    };
    return true;
  }
  update(fighter, dt, stageWidth, particles) {
    if (fighter.homelanderFlightTimer > 0) {
      fighter.homelanderFlightTimer -= dt;
      // Mantém flutuando enquanto durar o voo
      fighter.velocity.y = Math.min(fighter.velocity.y, 1);
      if (particles && Math.random() < 0.25) {
        particles.emitSparks(fighter.position.x, fighter.position.y - 70, '#ef4444', 3, 2);
      }
    }
  }
}

export const draculaBehavior = new DraculaBehavior();
export const kiritoBehavior = new KiritoBehavior();
export const erenBehavior = new ErenBehavior();
export const bruceLeeBehavior = new BruceLeeBehavior();
export const yodaBehavior = new YodaBehavior();
export const hanSoloBehavior = new HanSoloBehavior();
export const marioBehavior = new MarioBehavior();
export const wolverineBehavior = new WolverineBehavior();
export const kratosBehavior = new KratosBehavior();
export const venomBehavior = new VenomBehavior();
export const carnageBehavior = new CarnageBehavior();
export const homelanderBehavior = new HomelanderBehavior();

