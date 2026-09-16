import { BaseCharacter } from '../base/BaseCharacter.js';
import { sounds } from '../../audio/soundManager.js';
import { Box } from '../../engine/Collision.js';

export class NarutoBehavior extends BaseCharacter {
  constructor() {
    super('naruto', 'Naruto Uzumaki');
  }

  init(fighter) {
    fighter.narutoRasengan = null;
    fighter.narutoRasenShuriken = null;
    fighter.narutoClone = null;
    fighter.narutoRasenganCharging = false;
    fighter.narutoRasenganChargeTimer = 0;
  }

  reset(fighter) {
    fighter.narutoRasengan = null;
    fighter.narutoRasenShuriken = null;
    fighter.narutoClone = null;
    fighter.narutoRasenganCharging = false;
    fighter.narutoRasenganChargeTimer = 0;
  }

  // 12 - NARUTO: Q invoca um clone que repete os movimentos dele. Apertar E troca de lugar.
  onSpecial(fighter, level) {
    fighter.extraType = 'NARUTO_KAGE_BUNSHIN';
    sounds.playWhoosh();
    sounds.playDash();
    // Invoca clone das sombras simétrico
    fighter.narutoClone = {
      x: fighter.position.x - fighter.facing * 90,
      y: fighter.position.y,
      facing: fighter.facing,
      timer: 8.0,
      active: true
    };
    return true;
  }

  // 12 - R (Super): Carrega enquanto o botão é pressionado (clone auxilia no giro do Rasengan). Ao soltar, corre e lança!
  onSuper(fighter) {
    fighter.superType = 'NARUTO_RASEN_SHURIKEN';
    fighter.superPhase = 'RASENGAN_CHARGE';
    sounds.playSuperCharge();
    sounds.playWindTornado();
    fighter.narutoRasenganCharging = true;
    fighter.narutoRasenganChargeTimer = 0.1;
    fighter.narutoRasenShuriken = {
      x: fighter.position.x + fighter.facing * 40,
      y: fighter.position.y - 70,
      vx: fighter.facing * 950,
      vy: 0,
      damage: 420,
      active: true,
      hasHit: false,
      timer: 0,
      expanded: false
    };
    return true;
  }

  update(fighter, dt, stageWidth, particles) {
    // 1. Rasen-Shuriken (Super)
    if (fighter.narutoRasenShuriken && fighter.narutoRasenShuriken.active) {
      const rs = fighter.narutoRasenShuriken;
      rs.x += rs.vx * dt;
      rs.timer += dt;
      if (particles && Math.random() < 0.6) {
        particles.emitSparks(rs.x, rs.y, '#38bdf8', 4, 3);
      }
      if (fighter.opponent && !rs.hasHit && !fighter.opponent.isDead) {
        const hurtboxes = fighter.opponent.getHurtboxes();
        const shurikenBox = new Box(rs.x - 35, rs.y - 35, 70, 70, 'hitbox');
        for (const hurt of hurtboxes) {
          if (shurikenBox.intersects(hurt)) {
            rs.hasHit = true;
            rs.expanded = true;
            const attackData = {
              damage: rs.damage,
              knockback: 22,
              knockdown: true,
              isHeavy: true,
              attackerPower: fighter.attackPower
            };
            fighter.opponent.receiveHit(attackData, { x: rs.x, y: rs.y }, particles);
            sounds.playThunderSlam();
            if (particles) {
              particles.emitShockwave(rs.x, rs.y, 200, '#38bdf8');
              particles.emitSparks(rs.x, rs.y, '#0284c7', 35, 12);
            }
            break;
          }
        }
      }
      if (rs.timer > 2.0 || rs.x < -200 || rs.x > stageWidth + 200) {
        rs.active = false;
      }
    }
  }

  draw(fighter, ctx) {
    if (fighter.narutoRasenShuriken && fighter.narutoRasenShuriken.active) {
      const rs = fighter.narutoRasenShuriken;
      ctx.save();
      ctx.translate(rs.x, rs.y);
      ctx.rotate(fighter.stateTime * 30);
      ctx.fillStyle = '#bae6fd';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#0ea5e9';
      ctx.shadowBlur = 20;
      // Orbe central
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      // 4 lâminas de vento
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(28, 6);
        ctx.lineTo(34, 0);
        ctx.lineTo(28, -6);
        ctx.closePath();
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}

export const narutoBehavior = new NarutoBehavior();
