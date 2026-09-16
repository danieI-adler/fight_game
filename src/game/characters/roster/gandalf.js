import { BaseCharacter } from '../base/BaseCharacter.js';
import { sounds } from '../../audio/soundManager.js';

export class GandalfBehavior extends BaseCharacter {
  constructor() { super('gandalf', 'Gandalf'); }
  init(fighter) { fighter.isGandalf = true; fighter.gandalfLightSpells = []; }
  reset(fighter) { fighter.gandalfLightSpells = []; }
  onSpecial(fighter, level) {
    fighter.extraType = 'GANDALF_LIGHT_PULSE';
    sounds.playSuperCharge();
    sounds.playStaffBell();
    fighter.gandalfLightSpells.push({
      x: fighter.position.x + fighter.facing * 35,
      y: fighter.position.y - 75,
      vx: fighter.facing * 780,
      damage: level === 2 ? 150 : 95,
      active: true,
      hasHit: false
    });
    return true;
  }
  onSuper(fighter) {
    fighter.superPhase = 'YOU_SHALL_NOT_PASS';
    sounds.playSuperCharge();
    sounds.playThunderSlam();
    return true;
  }
}
export const gandalfBehavior = new GandalfBehavior();
