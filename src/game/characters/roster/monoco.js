import { BaseCharacter } from '../base/BaseCharacter.js';
import { sounds } from '../../audio/soundManager.js';

export class MonocoBehavior extends BaseCharacter {
  constructor() {
    super('monoco', 'Monoco');
  }

  init(fighter) {
    fighter.isMonoco = true;
    fighter.energy = fighter.maxEnergy; // Monoco sempre tem a skill pronta
  }

  reset(fighter) {
    fighter.energy = fighter.maxEnergy;
  }

  onSpecial(fighter, level) {
    fighter.extraType = 'MONOCO_STAFF_SPIN';
    sounds.playStaffBell();
    sounds.playWhoosh();
    return true;
  }

  onSuper(fighter) {
    fighter.superPhase = 'PARRY_STANCE';
    fighter.isInvulnerable = false; // Permite ser acertado para absorver e contra-atacar
    sounds.playStaffBell();
    sounds.playWhoosh();
    return true;
  }

  draw(fighter, ctx) {
    if (fighter.state === 'SUPER_MOVE' && fighter.superPhase === 'PARRY_STANCE') {
      fighter.drawMonocoParryDome(ctx);
    }
  }
}

export const monocoBehavior = new MonocoBehavior();
