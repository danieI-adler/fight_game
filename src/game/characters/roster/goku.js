import { BaseCharacter } from '../base/BaseCharacter.js';
import { sounds } from '../../audio/soundManager.js';

export class GokuBehavior extends BaseCharacter {
  constructor() {
    super('goku', 'Son Goku');
  }

  init(fighter) {
    fighter.isGoku = true;
    fighter.gokuSsjLevel = 0; // 0: Base, 1: SSJ1, 2: SSJ2, 3: SSJ3
    fighter.gokuKamehameha = null;
    fighter.gokuGenkiDama = null;
  }

  reset(fighter) {
    fighter.gokuSsjLevel = 0;
    fighter.gokuKamehameha = null;
    fighter.gokuGenkiDama = null;
  }

  // 22 - GOKU: Q aumenta o Super Saiyajin (SSJ1 -> SSJ2 -> SSJ3, com 66% sobe 2 níveis!). Cada nível aumenta speed e dano!
  onSpecial(fighter, level) {
    fighter.extraType = 'GOKU_SSJ_TRANSFORM';
    sounds.playSuperCharge();
    sounds.playSuper();
    const levelsToAdd = level === 2 ? 2 : 1;
    fighter.gokuSsjLevel = Math.min(3, (fighter.gokuSsjLevel || 0) + levelsToAdd);
    // Buff cumulativo de velocidade e dano por nível de SSJ
    fighter.speed = (fighter.baseSpeed || 9.4) * (1.0 + fighter.gokuSsjLevel * 0.15);
    fighter.attackPower = (fighter.baseAttackPower || 1.24) * (1.0 + fighter.gokuSsjLevel * 0.2);
    return true;
  }

  // 22 - GOKU: Ultimate -> Kamehameha!
  onSuper(fighter) {
    fighter.superType = 'GOKU_KAMEHAMEHA';
    fighter.superPhase = 'KAMEHAMEHA_CHARGE';
    sounds.playSuperCharge();
    sounds.playLaser();
    fighter.gokuKamehameha = {
      reach: 1400,
      damage: 440 + (fighter.gokuSsjLevel || 0) * 40,
      timer: 0,
      active: true,
      hasHit: false
    };
    return true;
  }
  update(fighter, dt, stageWidth, particles) {
    if ((fighter.gokuSsjLevel || 0) > 0 && particles && Math.random() < 0.35) {
      const sparkColor = fighter.gokuSsjLevel >= 2 ? '#38bdf8' : '#facc15';
      particles.emitSparks(fighter.position.x, fighter.position.y - 60, sparkColor, 3, 2);
    }
  }
}

export const gokuBehavior = new GokuBehavior();
