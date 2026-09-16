import { BaseCharacter } from '../base/BaseCharacter.js';
import { sounds } from '../../audio/soundManager.js';

export class PaintressBehavior extends BaseCharacter {
  constructor() {
    super('paintress', 'La Peintresse');
  }

  init(fighter) {
    fighter.paintressRealityTear = null;
    fighter.chromaticWaves = [];
  }

  reset(fighter) {
    fighter.paintressRealityTear = null;
    fighter.chromaticWaves = [];
  }

  onSpecial(fighter, level) {
    fighter.extraType = 'PAINTRESS_REALITY_TEAR';
    sounds.playDimensionalPierce();
    const tearX = fighter.position.x + fighter.facing * 140;
    fighter.paintressRealityTear = {
      x: tearX,
      y: fighter.groundY,
      duration: 5.0,
      freezeTime: level === 2 ? 2.4 : 1.2,
      active: true
    };
    return true;
  }

  onSuper(fighter) {
    fighter.superPhase = 'SUMMON_WAVES';
    sounds.playSuperCharge();
    sounds.playChromaticWaveCast();
    return true;
  }

  update(fighter, dt, stageWidth, particles) {
    // Ondas Cromáticas de La Peintresse
    if (fighter.chromaticWaves && fighter.chromaticWaves.length > 0) {
      for (const wave of fighter.chromaticWaves) {
        if (!wave.active) continue;
        wave.x += wave.vx * dt;

        if (particles && Math.random() < 0.4) {
          particles.emitDust(wave.x, fighter.groundY, 3, wave.color);
        }

        if (fighter.opponent && !wave.hasHit && !fighter.opponent.isDead) {
          const dist = Math.abs(wave.x - fighter.opponent.position.x);
          if (dist < 42) {
            if (!fighter.opponent.isGrounded) {
              if (particles && Math.random() < 0.3) {
                particles.emitSparks(wave.x, fighter.groundY - 15, '#ffffff', 4, 3);
              }
            } else {
              wave.hasHit = true;
              const isFinisher = wave.waveIndex === 2;
              const attackData = {
                damage: wave.damage || 230,
                knockback: isFinisher ? 22 : 10,
                knockdown: isFinisher,
                isHeavy: true,
                attackerPower: fighter.attackPower
              };
              fighter.opponent.receiveHit(attackData, { x: wave.x, y: fighter.groundY - 30 }, particles);
              sounds.playChromaticWaveHit();
              if (particles) {
                particles.emitShockwave(wave.x, fighter.groundY, isFinisher ? 170 : 130, wave.color);
                particles.emitSparks(wave.x, fighter.groundY - 25, wave.color, isFinisher ? 35 : 22, 10);
                particles.emitDust(wave.x, fighter.groundY, 12, '#1e293b');
              }
            }
          }
        }

        if (wave.x < -200 || wave.x > stageWidth + 200) {
          wave.active = false;
        }
      }
      fighter.chromaticWaves = fighter.chromaticWaves.filter((w) => w.active);
    }
  }

  draw(fighter, ctx) {
    fighter.drawChromaticWaves(ctx);
  }
}

export const paintressBehavior = new PaintressBehavior();
