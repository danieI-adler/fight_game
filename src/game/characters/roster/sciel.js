import { BaseCharacter } from '../base/BaseCharacter.js';
import { sounds } from '../../audio/soundManager.js';

export class ScielBehavior extends BaseCharacter {
  constructor() {
    super('sciel', 'Sciel');
  }

  init(fighter) {
    fighter.scielCritCharges = 0;
    fighter.scielCritTimer = 0;
  }

  reset(fighter) {
    fighter.scielCritCharges = 0;
    fighter.scielCritTimer = 0;
  }

  onSpecial(fighter, level) {
    fighter.extraType = 'SCIEL_CRIT_BUFF';
    sounds.playSuperCharge();
    sounds.playRapierSlash();
    fighter.scielCritCharges = level === 2 ? 5 : 3;
    fighter.scielCritTimer = 8.0;
    return true;
  }

  onSuper(fighter) {
    fighter.superPhase = 'DASH_IN';
    sounds.playWhoosh();
    return true;
  }

  update(fighter, dt, stageWidth, particles) {
    if (fighter.scielCritTimer > 0) {
      fighter.scielCritTimer -= dt;
      if (fighter.scielCritTimer <= 0 || fighter.scielCritCharges <= 0) {
        fighter.scielCritCharges = 0;
        fighter.scielCritTimer = 0;
      }
    }
  }

  draw(fighter, ctx) {
    if (fighter.superType === 'SCIEL_DARK_WAVE' && fighter._darkWaveCenterX != null) {
      fighter.drawScielDarkWave(ctx);
    }
  }
}

export const scielBehavior = new ScielBehavior();
