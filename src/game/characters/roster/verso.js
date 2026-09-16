import { BaseCharacter } from '../base/BaseCharacter.js';
import { sounds } from '../../audio/soundManager.js';

export class VersoBehavior extends BaseCharacter {
  constructor() {
    super('verso', 'Verso');
  }

  init(fighter) {
    fighter.isVerso = true;
    fighter.versoRanks = ['E', 'D', 'C', 'B', 'A', 'S'];
    fighter.versoRankMultipliers = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
    fighter.versoRankIndex = 0;
    fighter.versoHitStreak = 0;
    fighter.versoEnterUsed = false;
    fighter.attackPower = fighter.baseAttackPower * fighter.versoRankMultipliers[0];
  }

  reset(fighter) {
    fighter.versoRankIndex = 0;
    fighter.versoHitStreak = 0;
    fighter.versoEnterUsed = false;
    fighter.attackPower = fighter.baseAttackPower * fighter.versoRankMultipliers[0];
  }

  onSpecial(fighter, level) {
    // Verso não possui habilidades tradicionais (hasNoSkills)
    return true;
  }

  onSuper(fighter) {
    // Verso: Tecla Enter 1x por combate ascende diretamente para o Rank S!
    if (!fighter.versoEnterUsed) {
      fighter.versoEnterUsed = true;
      fighter.versoRankIndex = fighter.versoRanks.length - 1; // Rank 'S'
      fighter.attackPower = fighter.baseAttackPower * fighter.versoRankMultipliers[fighter.versoRankIndex];
      sounds.playSuperCharge();
      sounds.playSuper();
    }
    return true;
  }

  onHitGiven(fighter, opponent, hitData) {
    fighter.gainVersoHit();
  }

  onHitTaken(fighter, attackData) {
    fighter.resetVersoRankOnHitTaken();
  }

  draw(fighter, ctx) {
    if (!fighter.isDead) {
      fighter.drawVersoStyleRank(ctx);
    }
  }
}

export const versoBehavior = new VersoBehavior();
