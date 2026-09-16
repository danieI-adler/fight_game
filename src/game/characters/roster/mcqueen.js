import { BaseCharacter } from '../base/BaseCharacter.js';
import { sounds } from '../../audio/soundManager.js';

export class McQueenBehavior extends BaseCharacter {
  constructor() {
    super('mcqueen', 'Relâmpago McQueen');
  }

  init(fighter) {
    fighter.isMcQueen = true;
    fighter.mcqueenSpeedBuffTimer = 0;
    fighter.mcqueenSpeedMultiplier = 1.0;
    fighter.mcqueenBlitz = null;
    fighter.mcqueenDriftBurn = null;
  }

  reset(fighter) {
    fighter.mcqueenSpeedBuffTimer = 0;
    fighter.mcqueenSpeedMultiplier = 1.0;
    fighter.mcqueenBlitz = null;
    fighter.mcqueenDriftBurn = null;
  }

  onSpecial(fighter, level) {
    fighter.extraType = 'MCQUEEN_DRIFT_BURNOUT';
    sounds.playDash();
    sounds.playSuper();
    fighter.mcqueenSpeedBuffTimer = 5.0;
    fighter.mcqueenSpeedMultiplier = level === 2 ? 3.0 : 2.0;
    fighter.mcqueenDriftBurn = {
      x: fighter.position.x,
      y: fighter.groundY,
      duration: 3.0,
      active: true
    };
    return true;
  }

  onSuper(fighter) {
    fighter.superPhase = 'KACHOW_RUN_1';
    sounds.playSuperCharge();
    sounds.playDash();
    fighter.mcqueenBlitz = {
      phase: 1,
      timer: 0,
      startX: fighter.position.x,
      targetX: fighter.opponent ? fighter.opponent.position.x : fighter.position.x + fighter.facing * 400,
      hasHit: false
    };
    return true;
  }

  update(fighter, dt, stageWidth, particles) {
    if (fighter.mcqueenSpeedBuffTimer > 0) {
      fighter.mcqueenSpeedBuffTimer -= dt;
      if (fighter.mcqueenSpeedBuffTimer <= 0) {
        fighter.mcqueenSpeedMultiplier = 1.0;
      }
    }
  }

  draw(fighter, ctx) {
    if (!fighter.isDead) {
      fighter.drawMcQueenSpeedBadge(ctx);
    }
  }
}

export const mcqueenBehavior = new McQueenBehavior();
