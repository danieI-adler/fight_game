import { BaseCharacter } from '../base/BaseCharacter.js';
import { sounds } from '../../audio/soundManager.js';
import { Box } from '../../engine/Collision.js';
import { FIGHTER_STATE } from '../../engine/Fighter.js';

export class DarthVaderBehavior extends BaseCharacter {
  constructor() {
    super('vader', 'Darth Vader');
  }

  init(fighter) {
    fighter.vaderThrowingSaber = null;
    fighter.vaderChokeTarget = null;
  }

  reset(fighter) {
    fighter.vaderThrowingSaber = null;
    fighter.vaderChokeTarget = null;
  }

  onSpecial(fighter, level) {
    fighter.extraType = 'VADER_SABER_THROW';
    sounds.playLaser();
    sounds.playRapierSlash();
    fighter.vaderThrowingSaber = {
      x: fighter.position.x + fighter.facing * 40,
      y: fighter.position.y - 70,
      vx: fighter.facing * 850,
      returning: false,
      startX: fighter.position.x,
      maxDist: 650,
      damage: level === 2 ? 175 : 105,
      active: true,
      hasHit: false
    };
    return true;
  }

  onSuper(fighter) {
    fighter.superPhase = 'CHOKE_LIFT';
    sounds.playSuperCharge();
    sounds.playDimensionalPierce();
    const target = fighter.opponent;
    fighter.vaderChokeTarget = {
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
    return true;
  }

  update(fighter, dt, stageWidth, particles) {
    // 1. Sabre Giratório Arremessado
    if (fighter.vaderThrowingSaber && fighter.vaderThrowingSaber.active) {
      const s = fighter.vaderThrowingSaber;
      s.x += s.vx * dt;
      if (particles && Math.random() < 0.6) {
        particles.emitSparks(s.x, s.y, '#ef4444', 3, 3);
      }
      if (!s.returning && Math.abs(s.x - s.startX) >= s.maxDist) {
        s.returning = true;
        s.vx = -s.vx;
      }
      if (fighter.opponent && !s.hasHit && !fighter.opponent.isDead) {
        const hurtboxes = fighter.opponent.getHurtboxes();
        const saberBox = new Box(s.x - 30, s.y - 12, 60, 24, 'hitbox');
        for (const hurt of hurtboxes) {
          if (saberBox.intersects(hurt)) {
            s.hasHit = true;
            const attackData = {
              damage: s.damage,
              knockback: 14,
              knockdown: true,
              isHeavy: true,
              attackerPower: fighter.attackPower
            };
            fighter.opponent.receiveHit(attackData, { x: s.x, y: s.y }, particles);
            sounds.playPunch(true);
            if (particles) {
              particles.emitSparks(s.x, s.y, '#ef4444', 25, 10);
              particles.emitShockwave(s.x, s.y, 80, '#dc2626');
            }
            break;
          }
        }
      }
      if (s.returning && Math.abs(s.x - fighter.position.x) < 40) {
        s.active = false;
      }
      if (s.x < -200 || s.x > stageWidth + 200) {
        s.active = false;
      }
    }

    // 2. Choke Lift da Força (Super)
    if (fighter.vaderChokeTarget && fighter.vaderChokeTarget.target) {
      const chk = fighter.vaderChokeTarget;
      chk.timer += dt;
      if (chk.timer >= 0.8 && !chk.damageApplied && !chk.target.isDead) {
        chk.damageApplied = true;
        const attackData = {
          damage: 390,
          knockback: 16,
          knockdown: true,
          isHeavy: true,
          attackerPower: fighter.attackPower
        };
        chk.target.receiveHit(attackData, { x: chk.target.position.x, y: chk.target.position.y - 70 }, particles);
        sounds.playThunderSlam();
        if (particles) {
          particles.emitShockwave(chk.target.position.x, chk.target.position.y - 70, 180, '#ef4444');
          particles.emitElectricArc(fighter.position.x, fighter.position.y - 70, chk.target.position.x, chk.target.position.y - 70, '#ef4444', 4);
        }
      }
      if (chk.timer >= 1.6) {
        fighter.vaderChokeTarget = null;
      }
    }
  }

  draw(fighter, ctx) {
    if (fighter.vaderThrowingSaber && fighter.vaderThrowingSaber.active) {
      const s = fighter.vaderThrowingSaber;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(fighter.stateTime * 28);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 6;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.moveTo(-35, 0);
      ctx.lineTo(35, 0);
      ctx.stroke();
      ctx.restore();
    }
  }
}

export const darthVaderBehavior = new DarthVaderBehavior();
