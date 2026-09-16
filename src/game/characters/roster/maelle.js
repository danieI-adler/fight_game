import { BaseCharacter } from '../base/BaseCharacter.js';
import { sounds } from '../../audio/soundManager.js';

export class MaelleBehavior extends BaseCharacter {
  constructor() {
    super('maelle', 'Maelle');
  }

  onSpecial(fighter, level) {
    fighter.extraType = 'MAELLE_BLINK_DASH';
    sounds.playRapierSlash();
    sounds.playDash();
    fighter.isInvulnerable = true;
    const op = fighter.opponent;
    const targetX = op ? op.position.x + (fighter.facing * 100) : fighter.position.x + (fighter.facing * 250);
    fighter.position.x = Math.max(70, Math.min(1930, targetX));
    if (op) {
      fighter.facing = (op.position.x - fighter.position.x) >= 0 ? 1 : -1;
    }
    // Dano aplicado no corte do dash
    if (op && !op.isDead) {
      const attackData = {
        damage: level === 2 ? 180 : 110,
        knockback: 12,
        knockdown: level === 2,
        isHeavy: level === 2,
        attackerPower: fighter.attackPower
      };
      op.receiveHit(attackData, { x: fighter.position.x, y: fighter.position.y - 70 }, null);
    }
    return true;
  }

  onSuper(fighter) {
    fighter.superPhase = 'STRIKE_0';
    sounds.playRapierSlash();
    return true;
  }
}

export const maelleBehavior = new MaelleBehavior();
