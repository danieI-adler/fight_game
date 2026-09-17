import { BaseCharacter } from '../base/BaseCharacter.js';
import { sounds } from '../../audio/soundManager.js';

export class GreenArrowBehavior extends BaseCharacter {
  constructor() { super('arqueiro_verde', 'Arqueiro Verde'); }
  init(fighter) { fighter.isGreenArrow = true; fighter.arrowProjectiles = []; }
  reset(fighter) { fighter.arrowProjectiles = []; }
  onSpecial(fighter, level) {
    fighter.extraType = 'ARROW_TRICK_SHOT';
    sounds.playWhoosh();
    fighter.arrowProjectiles.push({
      x: fighter.position.x + fighter.facing * 40,
      y: fighter.position.y - 75,
      vx: fighter.facing * 1200,
      vy: 0,
      isTrick: level === 2,
      damage: level === 2 ? 165 : 100,
      active: true,
      hasHit: false
    });
    return true;
  }
  onSuper(fighter) {
    fighter.superType = 'ARROW_STORM';
    fighter.superPhase = 'ARROW_STORM';
    sounds.playSuperCharge();
    sounds.playWhoosh();
    return true;
  }
}
export const greenArrowBehavior = new GreenArrowBehavior();
