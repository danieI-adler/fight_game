import { BaseCharacter } from '../base/BaseCharacter.js';
import { sounds } from '../../audio/soundManager.js';
import { Box } from '../../engine/Collision.js';

export class GustaveBehavior extends BaseCharacter {
  constructor() {
    super('gustave', 'Gustave');
  }

  init(fighter) {
    fighter.gustaveBullet = null;
  }

  reset(fighter, startX, keepEnergy) {
    fighter.gustaveBullet = null;
  }

  onSpecial(fighter, level) {
    fighter.extraType = 'GUSTAVE_GUN';
    sounds.playGunshot();
    const gunX = fighter.position.x + fighter.facing * 35;
    const gunY = fighter.position.y - 82;
    fighter.gustaveBullet = {
      x: gunX,
      y: gunY,
      vx: fighter.facing * 1400, // projétil extremamente veloz
      damage: level === 2 ? 160 : 100,
      active: true,
      hasHit: false
    };
    return true;
  }

  onSuper(fighter) {
    fighter.superType = 'GUSTAVE_SMASH';
    fighter.superPhase = 'CHARGE'; // 'CHARGE' (0-0.5s), 'LEAP' (0.5-0.85s), 'SLAM' (0.85-1.45s)
    sounds.playSuperCharge();
    fighter.playCharacterVoice();
    return true;
  }

  update(fighter, dt, stageWidth, particles) {
    // Bala de Pistola de Gustave (Ataque Extra)
    if (fighter.gustaveBullet && fighter.gustaveBullet.active) {
      fighter.gustaveBullet.x += fighter.gustaveBullet.vx * dt;
      if (particles && Math.random() < 0.5) {
        particles.emitSparks(fighter.gustaveBullet.x, fighter.gustaveBullet.y, '#f59e0b', 2, 3);
      }
      if (fighter.opponent && !fighter.gustaveBullet.hasHit && !fighter.opponent.isDead) {
        const bX = fighter.gustaveBullet.x;
        const bY = fighter.gustaveBullet.y;
        const bulletBox = new Box(bX - 15, bY - 10, 30, 20, 'hitbox');
        for (const hurt of fighter.opponent.getHurtboxes()) {
          if (bulletBox.intersects(hurt)) {
            fighter.gustaveBullet.hasHit = true;
            fighter.gustaveBullet.active = false;
            const attackData = {
              damage: fighter.gustaveBullet.damage || 120,
              knockback: 10,
              knockdown: false,
              isHeavy: false,
              attackerPower: fighter.attackPower
            };
            fighter.opponent.receiveHit(attackData, { x: bX, y: bY }, particles);
            sounds.playPunch(false);
            if (particles) {
              particles.emitSparks(bX, bY, '#f59e0b', 16, 7);
              particles.emitShockwave(bX, bY, 45, '#fbbf24');
            }
            break;
          }
        }
      }
      if (fighter.gustaveBullet.x < -100 || fighter.gustaveBullet.x > stageWidth + 100) {
        fighter.gustaveBullet.active = false;
      }
    }
  }

  draw(fighter, ctx) {
    if (fighter.gustaveBullet && fighter.gustaveBullet.active) {
      ctx.save();
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.ellipse(fighter.gustaveBullet.x, fighter.gustaveBullet.y, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rastro veloz da bala
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(fighter.gustaveBullet.x, fighter.gustaveBullet.y);
      ctx.lineTo(fighter.gustaveBullet.x - Math.sign(fighter.gustaveBullet.vx) * 35, fighter.gustaveBullet.y);
      ctx.stroke();
      ctx.restore();
    }
  }
}

export const gustaveBehavior = new GustaveBehavior();
