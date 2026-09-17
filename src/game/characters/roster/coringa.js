import { BaseCharacter } from '../base/BaseCharacter.js';
import { sounds } from '../../audio/soundManager.js';

export class JokerBehavior extends BaseCharacter {
  constructor() { super('coringa', 'Coringa'); }
  init(fighter) {
    fighter.jokerCards = [];
    fighter.jokerJackInTheBox = null;
    fighter.jokerCrowbarBeat = null;
  }
  reset(fighter) {
    fighter.jokerCards = [];
    fighter.jokerJackInTheBox = null;
    fighter.jokerCrowbarBeat = null;
  }
  onSpecial(fighter, level) {
    fighter.extraType = 'JOKER_TRICK_CARDS';
    sounds.playWhoosh();
    sounds.playPunch(false);
    const cardCount = level === 2 ? 5 : 3;
    for (let i = 0; i < cardCount; i++) {
      const angle = (i - (cardCount - 1) / 2) * 0.18;
      fighter.jokerCards.push({
        x: fighter.position.x + fighter.facing * 35,
        y: fighter.position.y - 75,
        vx: Math.cos(angle) * fighter.facing * 820,
        vy: Math.sin(angle) * 820,
        damage: level === 2 ? 38 : 28,
        active: true,
        hasHit: false
      });
    }
    return true;
  }
  onSuper(fighter) {
    fighter.superType = 'JOKER_GRAND_FINALE';
    fighter.superPhase = 'GRAND_FINALE_BOX';
    sounds.playSuperCharge();
    sounds.playStaffBell();
    fighter.jokerCrowbarBeat = {
      hitCount: 0,
      timer: 0,
      nextHitTime: 0.2,
      target: fighter.opponent
    };
    return true;
  }
}
export const jokerBehavior = new JokerBehavior();
