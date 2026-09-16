import { BaseCharacter } from '../base/BaseCharacter.js';
import { sounds } from '../../audio/soundManager.js';

// 3 - JACK SPARROW: Q nerf sem raioszinhos; o barco aparece logo atrás do Jack e os tiros são de 3 em 3 segundos
export class JackSparrowBehavior extends BaseCharacter {
  constructor() { super('jack_sparrow', 'Jack Sparrow'); }
  init(fighter) {
    fighter.sparrowDrunkTimer = 0;
    fighter.sparrowDodgeCharges = 0;
    fighter.sparrowBlackPearl = null;
  }
  reset(fighter) {
    fighter.sparrowDrunkTimer = 0;
    fighter.sparrowDodgeCharges = 0;
    fighter.sparrowBlackPearl = null;
  }
  onSpecial(fighter, level) {
    // Q nerf: Bebida de Rum esquiva com cambaleio sem nenhum raio
    fighter.extraType = 'SPARROW_DRUNKEN_RUM';
    sounds.playStaffBell();
    sounds.playDash();
    fighter.sparrowDrunkTimer = 3.5;
    fighter.sparrowDodgeCharges = level === 2 ? 2 : 1; // Nerf nas esquivas
    return true;
  }
  onSuper(fighter) {
    // Barco aparece logo atrás do Jack com tiros ritmados a cada 3 segundos
    fighter.superType = 'SPARROW_BLACK_PEARL';
    fighter.superPhase = 'BLACK_PEARL_BROADSIDE';
    sounds.playSuperCharge();
    sounds.playThunderSlam();
    fighter.sparrowBlackPearl = {
      timer: 0,
      shotsFired: 0,
      maxShots: 3,
      interval: 3.0, // Tiros ritmados de 3 em 3 segundos!
      spawnX: fighter.position.x - fighter.facing * 75, // Barco logo atrás do Jack
      cannonballs: []
    };
    return true;
  }
  update(fighter, dt, stageWidth, particles) {
    if (fighter.sparrowDrunkTimer > 0) {
      fighter.sparrowDrunkTimer -= dt;
      if (particles && Math.random() < 0.2) {
        particles.emitDust(fighter.position.x, fighter.groundY, 1, '#78350f');
      }
    }
  }
}
export const jackSparrowBehavior = new JackSparrowBehavior();

