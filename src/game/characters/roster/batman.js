import { BaseCharacter } from '../base/BaseCharacter.js';
import { sounds } from '../../audio/soundManager.js';
import { Box } from '../../engine/Collision.js';
import { FIGHTER_STATE } from '../../engine/Fighter.js';

export class BatmanBehavior extends BaseCharacter {
  constructor() {
    super('batman', 'Batman');
  }

  init(fighter) {
    fighter.batmanBatarang = null;
    fighter.batmanBatmobile = null;
  }

  reset(fighter) {
    fighter.batmanBatarang = null;
    fighter.batmanBatmobile = null;
  }

  onSpecial(fighter, level) {
    fighter.extraType = 'BATMAN_BATARANG';
    sounds.playWhoosh();
    sounds.playRapierSlash();
    fighter.batmanBatarang = {
      x: fighter.position.x + fighter.facing * 35,
      y: fighter.position.y - 75,
      vx: fighter.facing * 980,
      returning: false,
      originX: fighter.position.x,
      damage: level === 2 ? 160 : 95,
      active: true,
      hasHit: false
    };
    return true;
  }

  onSuper(fighter) {
    fighter.superPhase = 'SUMMON_CAR';
    sounds.playSuperCharge();
    sounds.playWhoosh();
    const spawnX = fighter.position.x - fighter.facing * 500;
    fighter.batmanBatmobile = {
      x: spawnX,
      vx: fighter.facing * 1400,
      active: true,
      hasHit: false
    };
    fighter.velocity.y = -16;
    fighter.velocity.x = fighter.facing * 2;
    fighter.isGrounded = false;
    return true;
  }

  update(fighter, dt, stageWidth, particles) {
    // 1. Batarangue
    if (fighter.batmanBatarang && fighter.batmanBatarang.active) {
      const bat = fighter.batmanBatarang;
      bat.x += bat.vx * dt;
      if (particles && Math.random() < 0.4) {
        particles.emitSparks(bat.x, bat.y, '#94a3b8', 2, 2);
      }
      if (!bat.returning && Math.abs(bat.x - bat.originX) > 800) {
        bat.returning = true;
        bat.vx = -bat.vx * 0.85;
      }
      if (fighter.opponent && !bat.hasHit && !fighter.opponent.isDead) {
        const hurtboxes = fighter.opponent.getHurtboxes();
        const batBox = new Box(bat.x - 20, bat.y - 15, 40, 30, 'hitbox');
        for (const hurt of hurtboxes) {
          if (batBox.intersects(hurt)) {
            bat.hasHit = true;
            const attackData = {
              damage: bat.damage,
              knockback: 12,
              knockdown: false,
              isHeavy: true,
              attackerPower: fighter.attackPower
            };
            fighter.opponent.receiveHit(attackData, { x: bat.x, y: bat.y }, particles);
            sounds.playPunch(true);
            if (particles) {
              particles.emitSparks(bat.x, bat.y, '#38bdf8', 16, 7);
              particles.emitShockwave(bat.x, bat.y, 50, '#94a3b8');
            }
            break;
          }
        }
      }
      if (bat.returning && Math.abs(bat.x - fighter.position.x) < 40) {
        bat.active = false;
      }
      if (bat.x < -200 || bat.x > stageWidth + 200) {
        bat.active = false;
      }
    }

    // 2. Batmóvel (Super)
    if (fighter.batmanBatmobile && fighter.batmanBatmobile.active) {
      const car = fighter.batmanBatmobile;
      car.x += car.vx * dt;
      if (particles) {
        particles.emitDust(car.x, fighter.groundY, 4, '#18181b');
        particles.emitSparks(car.x - Math.sign(car.vx) * 80, fighter.groundY - 15, '#f59e0b', 4, 3);
      }
      if (fighter.opponent && !car.hasHit && !fighter.opponent.isDead) {
        const dist = Math.abs(car.x - fighter.opponent.position.x);
        if (dist < 90) {
          car.hasHit = true;
          const attackData = {
            damage: 380,
            knockback: 26,
            knockdown: true,
            isHeavy: true,
            attackerPower: fighter.attackPower
          };
          fighter.opponent.receiveHit(attackData, { x: car.x, y: fighter.groundY - 40 }, particles);
          sounds.playThunderSlam();
          if (particles) {
            particles.emitShockwave(car.x, fighter.groundY - 30, 220, '#000000');
            particles.emitSparks(car.x, fighter.groundY - 40, '#38bdf8', 35, 12);
          }
        }
      }
      if (car.x < -600 || car.x > stageWidth + 600) {
        car.active = false;
      }
    }
  }

  draw(fighter, ctx) {
    // Desenha Batarangue
    if (fighter.batmanBatarang && fighter.batmanBatarang.active) {
      const b = fighter.batmanBatarang;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(fighter.stateTime * 22);
      ctx.fillStyle = '#09090b';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI, true);
      ctx.lineTo(0, -6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Desenha Batmóvel
    if (fighter.batmanBatmobile && fighter.batmanBatmobile.active) {
      const car = fighter.batmanBatmobile;
      ctx.save();
      ctx.translate(car.x, fighter.groundY - 35);
      if (car.vx < 0) ctx.scale(-1, 1);
      ctx.fillStyle = '#09090b';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-90, -25, 180, 50, 10);
      ctx.fill();
      ctx.stroke();
      // Faróis
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 20;
      ctx.fillRect(80, -10, 15, 12);
      ctx.restore();
    }
  }
}

export const batmanBehavior = new BatmanBehavior();
