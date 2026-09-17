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
    const reach = level === 2 ? 650 : 420;
    const dmg = level === 2 ? 210 : 135;
    fighter.palpatineLightning = {
      timer: level === 2 ? 0.9 : 0.5,
      reach: reach,
      damage: dmg,
      active: true
    };
    const target = fighter.opponent;
    if (target && !target.isDead) {
      const dist = Math.abs(target.position.x - fighter.position.x);
      const facingTarget = (target.position.x - fighter.position.x) * fighter.facing > 0;
      if (facingTarget && dist < reach) {
        const attackData = {
          damage: dmg,
          knockback: 10,
          knockdown: false,
          isHeavy: true,
          attackerPower: fighter.attackPower
        };
        target.receiveHit(attackData, { x: target.position.x, y: target.position.y - 70 }, null);
        target.hitstunTime = level === 2 ? 0.8 : 0.45; // Atordoamento pelo choque contínuo
      }
    }
    return true;
  }
  onSuper(fighter) {
    fighter.superType = 'PALPATINE_DUAL_SABERS';
    fighter.superPhase = 'UNLIMITED_POWER';
    sounds.playSuperCharge();
    sounds.playElectricZap();
    fighter.palpatineDualSabers = true;
    fighter.velocity.x = 0;
    return true;
  }
}
export const palpatineBehavior = new PalpatineBehavior();
