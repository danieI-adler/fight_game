import { BaseCharacter } from '../base/BaseCharacter.js';
import { sounds } from '../../audio/soundManager.js';

export class RenoirBehavior extends BaseCharacter {
  constructor() {
    super('renoir', 'Renoir');
  }

  init(fighter) {
    fighter.renoirBlackHole = null;
  }

  reset(fighter) {
    fighter.renoirBlackHole = null;
  }

  onSpecial(fighter, level) {
    fighter.extraType = 'RENOIR_BLACK_HOLE';
    sounds.playBlackHoleSound();
    const target = fighter.opponent;
    const holeX = target ? target.position.x : fighter.position.x + fighter.facing * 180;
    fighter.renoirBlackHole = {
      x: holeX,
      y: fighter.groundY,
      timer: 0.65,
      hasExploded: false,
      damage: level === 2 ? 220 : 140,
      active: true,
      level: level
    };
    return true;
  }

  onSuper(fighter) {
    fighter.superPhase = 'SUMMON_FLOWER';
    sounds.playWhoosh();
    sounds.playSuperCharge();
    return true;
  }

  update(fighter, dt, stageWidth, particles) {
    if (fighter.renoirBlackHole && fighter.renoirBlackHole.active) {
      fighter.renoirBlackHole.timer -= dt;
      if (particles && Math.random() < 0.3) {
        particles.emitDust(fighter.renoirBlackHole.x + (Math.random() - 0.5) * 50, fighter.groundY, 3, '#18181b');
      }
      if (fighter.renoirBlackHole.timer <= 0 && !fighter.renoirBlackHole.hasExploded) {
        fighter.renoirBlackHole.hasExploded = true;
        sounds.playThunderSlam();
        if (particles) {
          particles.emitShockwave(fighter.renoirBlackHole.x, fighter.groundY, 160, '#000000');
          particles.emitShockwave(fighter.renoirBlackHole.x, fighter.groundY, 110, '#f59e0b');
          particles.emitSparks(fighter.renoirBlackHole.x, fighter.groundY - 30, '#000000', 30, 10);
        }
        if (fighter.opponent && !fighter.opponent.isDead && !fighter.opponent.isInvulnerable) {
          const dist = Math.abs(fighter.renoirBlackHole.x - fighter.opponent.position.x);
          if (dist < 110) {
            if (!fighter.opponent.isGrounded) {
              if (particles) {
                particles.emitFloatingText('EVADED!', fighter.opponent.position.x, fighter.opponent.position.y - 70, '#22c55e');
              }
            } else {
              const attackData = {
                damage: fighter.renoirBlackHole.damage || 150,
                knockback: 18,
                knockdown: true,
                isHeavy: true,
                attackerPower: fighter.attackPower
              };
              fighter.opponent.receiveHit(attackData, { x: fighter.renoirBlackHole.x, y: fighter.groundY - 20 }, particles);
            }
          }
        }
      }
      if (fighter.renoirBlackHole.timer <= -0.4) {
        fighter.renoirBlackHole.active = false;
      }
    }
  }

  draw(fighter, ctx) {
    if (fighter.superType === 'RENOIR_FLOWER' && fighter.state === 'SUPER_MOVE') {
      fighter.drawRenoirBlackFlower(ctx);
    }
    if (fighter.renoirBlackHole && fighter.renoirBlackHole.active) {
      const bh = fighter.renoirBlackHole;
      ctx.save();
      const progress = Math.max(0, 1 - (bh.timer / 0.65));
      const r = progress * 48;
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(bh.x, bh.y, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(bh.x, bh.y, r * 1.15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}

export const renoirBehavior = new RenoirBehavior();
