import { BaseCharacter } from '../base/BaseCharacter.js';
import { sounds } from '../../audio/soundManager.js';
import { Box } from '../../engine/Collision.js';
import { FIGHTER_STATE } from '../../engine/Fighter.js';

export class LuneBehavior extends BaseCharacter {
  constructor() {
    super('lune', 'Lune');
  }

  init(fighter) {
    fighter.luneElement = null;
    fighter.luneIceLance = null;
    fighter.luneFlameActive = false;
    fighter.luneEarthquakeTimer = 0;
    fighter.luneEarthquakeTick = 0;
    fighter.luneTornado = null;
  }

  reset(fighter) {
    fighter.luneElement = null;
    fighter.luneIceLance = null;
    fighter.luneFlameActive = false;
    fighter.luneEarthquakeTimer = 0;
    fighter.luneEarthquakeTick = 0;
    fighter.luneTornado = null;
  }

  onSpecial(fighter, level) {
    fighter.extraType = 'LUNE_HEAL';
    sounds.playHealSound();
    const healPercent = level === 2 ? 0.30 : 0.15;
    const healAmount = Math.round(fighter.maxHealth * healPercent);
    fighter.health = Math.min(fighter.maxHealth, fighter.health + healAmount);
    return true;
  }

  onSuper(fighter) {
    if (fighter.lastAction === 'BLOCK' || fighter.isBlocking || fighter.state === FIGHTER_STATE.BLOCK || fighter.state === FIGHTER_STATE.WALK_BACK) {
      fighter.luneElement = 'ICE';
    } else if (fighter.lastAction === 'JUMP' || !fighter.isGrounded || fighter.state === FIGHTER_STATE.JUMP) {
      fighter.luneElement = 'WIND';
    } else if (fighter.lastAction === 'CROUCH' || fighter.isCrouching || fighter.state === FIGHTER_STATE.CROUCH) {
      fighter.luneElement = 'EARTH';
    } else if (fighter.lastAction === 'ATTACK') {
      fighter.luneElement = 'FIRE';
    } else {
      fighter.luneElement = 'ICE';
    }

    fighter.superPhase = 'CAST_' + fighter.luneElement;
    sounds.playSuperCharge();
    if (fighter.luneElement === 'ICE') {
      sounds.playIceSpell();
    } else if (fighter.luneElement === 'FIRE') {
      sounds.playFireCast();
    } else if (fighter.luneElement === 'EARTH') {
      sounds.playEarthquakeSound();
    } else if (fighter.luneElement === 'WIND') {
      sounds.playWindTornado();
    }
    return true;
  }

  update(fighter, dt, stageWidth, particles) {
    // 1. Terremoto de Lune
    if (fighter.luneEarthquakeTimer > 0) {
      fighter.luneEarthquakeTimer -= dt;
      fighter.luneEarthquakeTick += dt;
      if (particles && Math.random() < 0.35) {
        const rx = fighter.position.x + (Math.random() - 0.5) * 650;
        particles.emitDust(rx, fighter.groundY, 4, '#a87132');
      }
      if (fighter.opponent && fighter.luneEarthquakeTick >= 0.38) {
        fighter.luneEarthquakeTick = 0;
        if (fighter.opponent.isGrounded && !fighter.opponent.isInvulnerable && !fighter.opponent.isDead) {
          const earthDmg = 35;
          fighter.opponent.health = Math.max(0, fighter.opponent.health - earthDmg);
          if (particles) {
            particles.emitShockwave(fighter.opponent.position.x, fighter.groundY, 70, '#b45309');
            particles.emitDust(fighter.opponent.position.x, fighter.groundY, 5, '#78350f');
            particles.emitFloatingText(`-${earthDmg}`, fighter.opponent.position.x, fighter.opponent.position.y - 75, '#f59e0b');
          }
          if (fighter.opponent.health <= 0 && !fighter.opponent.isDead) {
            fighter.opponent.health = 0;
            fighter.opponent.isDead = true;
            fighter.opponent.state = FIGHTER_STATE.KNOCKDOWN;
            fighter.opponent.velocity.x = -fighter.opponent.facing * 5;
            fighter.opponent.velocity.y = -7;
            fighter.opponent.isGrounded = false;
            sounds.playKO();
          }
        }
      }
    }

    // 2. Furacão de Lune
    if (fighter.luneTornado && fighter.luneTornado.active) {
      fighter.luneTornado.duration -= dt;
      if (fighter.opponent) {
        const dx = fighter.opponent.position.x - fighter.luneTornado.x;
        const dir = Math.sign(dx);
        fighter.luneTornado.x += dir * 210 * dt;
      }
      fighter.luneTornado.zapTick += dt;
      if (particles && Math.random() < 0.5) {
        particles.emitDust(fighter.luneTornado.x + (Math.random() - 0.5) * 50, fighter.groundY, 3, '#cbd5e1');
      }
      if (fighter.opponent && Math.abs(fighter.luneTornado.x - fighter.opponent.position.x) < 180 && fighter.luneTornado.zapTick >= 0.35) {
        fighter.luneTornado.zapTick = 0;
        if (!fighter.opponent.isInvulnerable && !fighter.opponent.isDead) {
          const zapDmg = 35;
          const isBlocked = fighter.opponent.isBlocking;
          const finalDmg = isBlocked ? Math.round(zapDmg * 0.3) : zapDmg;
          fighter.opponent.health = Math.max(0, fighter.opponent.health - finalDmg);
          sounds.playElectricZap();
          if (particles) {
            particles.emitElectricArc(fighter.luneTornado.x, fighter.groundY - 140, fighter.opponent.position.x, fighter.opponent.position.y - 60, '#00f0ff', 3);
            particles.emitSparks(fighter.opponent.position.x, fighter.opponent.position.y - 60, '#38bdf8', 12, 8);
            particles.emitFloatingText(`-${finalDmg}`, fighter.opponent.position.x, fighter.opponent.position.y - 85, '#00f0ff');
          }
          if (fighter.opponent.health <= 0 && !fighter.opponent.isDead) {
            fighter.opponent.health = 0;
            fighter.opponent.isDead = true;
            fighter.opponent.state = FIGHTER_STATE.KNOCKDOWN;
            fighter.opponent.velocity.x = -fighter.opponent.facing * 5;
            fighter.opponent.velocity.y = -7;
            fighter.opponent.isGrounded = false;
            sounds.playKO();
          }
        }
      }
      if (fighter.luneTornado.duration <= 0) {
        fighter.luneTornado.active = false;
      }
    }

    // 3. Estaca de Gelo de Lune
    if (fighter.luneIceLance && fighter.luneIceLance.active) {
      fighter.luneIceLance.x += fighter.luneIceLance.vx * dt;
      if (particles && Math.random() < 0.6) {
        particles.emitSparks(fighter.luneIceLance.x, fighter.luneIceLance.y, '#bae6fd', 3, 3);
      }
      if (fighter.opponent && !fighter.luneIceLance.hasHit) {
        const hurtboxes = fighter.opponent.getHurtboxes();
        const lanceBox = new Box(fighter.luneIceLance.x - 45, fighter.luneIceLance.y - 18, 90, 36, 'hitbox');
        for (const hurt of hurtboxes) {
          if (lanceBox.intersects(hurt)) {
            fighter.luneIceLance.hasHit = true;
            fighter.luneIceLance.active = false;
            const attackData = {
              damage: fighter.luneIceLance.damage || 280,
              knockback: 18,
              knockdown: true,
              isHeavy: true,
              attackerPower: fighter.attackPower
            };
            fighter.opponent.receiveHit(attackData, { x: fighter.luneIceLance.x, y: fighter.luneIceLance.y }, particles);
            fighter.opponent.slowTimer = 4.0;
            sounds.playIceSpell();
            if (particles) {
              particles.emitShockwave(fighter.luneIceLance.x, fighter.luneIceLance.y, 120, '#38bdf8');
              particles.emitSparks(fighter.luneIceLance.x, fighter.luneIceLance.y, '#e0f2fe', 30, 10);
            }
            break;
          }
        }
      }
      if (fighter.luneIceLance.x < -100 || fighter.luneIceLance.x > stageWidth + 100) {
        fighter.luneIceLance.active = false;
      }
    }
  }

  draw(fighter, ctx) {
    fighter.drawLuneElements(ctx);
  }
}

export const luneBehavior = new LuneBehavior();
