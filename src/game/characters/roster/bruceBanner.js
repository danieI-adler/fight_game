import { BaseCharacter } from '../base/BaseCharacter.js';
import { sounds } from '../../audio/soundManager.js';

// 4 - BRUCE BANNER: buff -> ele recebe o dobro de poder ao ser acertado
export class BannerBehavior extends BaseCharacter {
  constructor() { super('bruce_banner', 'Bruce Banner'); }
  init(fighter) {
    fighter.isBanner = true;
    fighter.isHulk = false;
  }
  reset(fighter) {
    fighter.isHulk = false;
  }
  onSpecial(fighter, level) {
    fighter.extraType = 'BANNER_NERVOUS';
    sounds.playSuperCharge();
    fighter.energy = Math.min(fighter.maxEnergy, fighter.energy + 35);
    return true;
  }
  onSuper(fighter) {
    fighter.superType = 'HULK_TRANSFORM';
    fighter.superPhase = 'HULK_TRANSFORM';
    sounds.playSuperCharge();
    sounds.playThunderSlam();
    fighter.isHulk = true;
    fighter.attackPower = fighter.baseAttackPower * 1.85;
    return true;
  }
  onHitTaken(fighter, attackData) {
    // 4 - Bruce Banner recebe o dobro de poder ao ser acertado antes de virar Hulk!
    if (!fighter.isHulk) {
      fighter.energy = Math.min(fighter.maxEnergy, fighter.energy + 5.0); // Dobro do ganho normal!
    }
  }
}
export const bannerBehavior = new BannerBehavior();

