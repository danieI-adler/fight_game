import { BaseCharacter } from '../base/BaseCharacter.js';
import { sounds } from '../../audio/soundManager.js';
import { Box } from '../../engine/Collision.js';
import { FIGHTER_STATE } from '../../engine/Fighter.js';

export class PalpatineBehavior extends BaseCharacter {
  constructor() { super('palpatine', 'Palpatine'); }
  init(fighter) {
    fighter.palpatineLightning = null;
    fighter.palpatineDualSabers = false;
  }
  reset(fighter) {
    fighter.palpatineLightning = null;
    fighter.palpatineDualSabers = false;
  }
  onSpecial(fighter, level) {
    fighter.extraType = 'PALPATINE_FORCE_LIGHTNING';
    sounds.playElectricZap();
    sounds.playSuperCharge();
    fighter.palpatineLightning = {
      reach: level === 2 ? 650 : 420,
      damage: level === 2 ? 180 : 100,
      timer: 0,
      active: true,
      hasHit: false
    };
    return true;
  }
  onSuper(fighter) {
    fighter.superPhase = 'UNLIMITED_POWER';
    sounds.playSuperCharge();
    sounds.playElectricZap();
    fighter.palpatineDualSabers = true;
    return true;
  }
}
export const palpatineBehavior = new PalpatineBehavior();
