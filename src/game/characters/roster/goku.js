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

  // 25 - GOKU: Q Kamehameha (feixe concentrado de Ki)
  onSpecial(fighter, level) {
    fighter.extraType = 'GOKU_KAMEHAMEHA';
    sounds.playLaser();
    sounds.playSuperCharge();
    fighter.gokuKamehameha = {
      reach: 1400,
      damage: level === 2 ? 220 : 145,
      timer: 0,
      active: true,
      hasHit: false
    };
    return true;
  }

  // 25 - GOKU: Ultimate -> Colossal Genki Dama!
  onSuper(fighter) {
    fighter.superType = 'GOKU_GENKI_DAMA';
    fighter.superPhase = 'GENKI_DAMA_CHARGE';
    sounds.playSuperCharge();
    sounds.playSuper();
    fighter.gokuGenkiDama = {
      timer: 0,
      x: fighter.position.x + fighter.facing * 40,
      y: fighter.position.y - 120,
      damage: 460,
      active: true,
      hasHit: false,
      scale: 0.2
    };
    return true;
  }
  update(fighter, dt, stageWidth, particles) {
    if (fighter.energy >= 80 && particles && Math.random() < 0.3) {
      particles.emitSparks(fighter.position.x, fighter.position.y - 60, '#facc15', 3, 2);
    }
  }
}

export const gokuBehavior = new GokuBehavior();
