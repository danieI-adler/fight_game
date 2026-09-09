import { FIGHTER_STATE } from './Fighter';
import { sounds } from '../audio/soundManager';

/**
 * FighterCombat
 * Centraliza a máquina de estados de ataques, cálculo de hitboxes,
 * janelas de ativação de golpes, danos e efeitos visuais/sonoros de golpes.
 */
export class FighterCombat {
  /**
   * Executa a atualização da máquina de estados de ataque a cada frame
   */
  static updateAttackStates(fighter, dt, particles, stageWidth = 2000) {
    fighter.activeHitbox = null;

    switch (fighter.state) {
      case FIGHTER_STATE.LIGHT_PUNCH:
        if (fighter.stateTime > 0.05 && fighter.stateTime < 0.18) {
          fighter.activeHitbox = fighter.createHitbox(15, 95, 60, 30);
          fighter.activeHitbox.damage = 40;
          fighter.activeHitbox.knockback = 5;
          fighter.activeHitbox.isHeavy = false;
          fighter.activeHitbox.attackerPower = fighter.attackPower;
        }
        if (fighter.stateTime >= 0.22) {
          fighter.state = FIGHTER_STATE.IDLE;
        }
        break;

      case FIGHTER_STATE.HEAVY_PUNCH:
        if (fighter.stateTime > 0.1 && fighter.stateTime < 0.26) {
          fighter.activeHitbox = fighter.createHitbox(20, 100, 75, 35);
          fighter.activeHitbox.damage = 95;
          fighter.activeHitbox.knockback = 12;
          fighter.activeHitbox.isHeavy = true;
          fighter.activeHitbox.attackerPower = fighter.attackPower;

          if (particles && Math.random() < 0.3) {
            const sparkX = fighter.facing === 1 ? fighter.position.x + 65 : fighter.position.x - 65;
            particles.emitSparks(sparkX, fighter.position.y - 85, fighter.charData.themeColor, 3, 3);
          }
        }
        if (fighter.stateTime >= 0.38) {
          fighter.state = FIGHTER_STATE.IDLE;
        }
        break;

      case FIGHTER_STATE.LIGHT_KICK:
        if (fighter.stateTime > 0.05 && fighter.stateTime < 0.18) {
          fighter.activeHitbox = fighter.createHitbox(20, 65, 65, 35);
          fighter.activeHitbox.damage = 50;
          fighter.activeHitbox.knockback = 6;
          fighter.activeHitbox.isHeavy = false;
          fighter.activeHitbox.attackerPower = fighter.attackPower;
        }
        if (fighter.stateTime >= 0.24) {
          fighter.state = FIGHTER_STATE.IDLE;
        }
        break;

      case FIGHTER_STATE.HEAVY_KICK:
        if (fighter.stateTime > 0.1 && fighter.stateTime < 0.28) {
          fighter.activeHitbox = fighter.createHitbox(25, 90, 80, 40);
          fighter.activeHitbox.damage = 110;
          fighter.activeHitbox.knockback = 14;
          fighter.activeHitbox.knockdown = true;
          fighter.activeHitbox.isHeavy = true;
          fighter.activeHitbox.attackerPower = fighter.attackPower;
        }
        if (fighter.stateTime >= 0.42) {
          fighter.state = FIGHTER_STATE.IDLE;
        }
        break;

      case FIGHTER_STATE.CROUCH_PUNCH:
        if (fighter.stateTime > 0.05 && fighter.stateTime < 0.18) {
          fighter.activeHitbox = fighter.createHitbox(15, 45, 55, 25);
          fighter.activeHitbox.damage = 35;
          fighter.activeHitbox.knockback = 4;
          fighter.activeHitbox.isHeavy = false;
          fighter.activeHitbox.attackerPower = fighter.attackPower;
        }
        if (fighter.stateTime >= 0.22) {
          fighter.state = FIGHTER_STATE.CROUCH;
        }
        break;

      case FIGHTER_STATE.CROUCH_KICK:
        if (fighter.stateTime > 0.07 && fighter.stateTime < 0.22) {
          fighter.activeHitbox = fighter.createHitbox(20, 25, 70, 25);
          fighter.activeHitbox.damage = 65;
          fighter.activeHitbox.knockback = 9;
          fighter.activeHitbox.knockdown = true;
          fighter.activeHitbox.isHeavy = true;
          fighter.activeHitbox.attackerPower = fighter.attackPower;
        }
        if (fighter.stateTime >= 0.32) {
          fighter.state = FIGHTER_STATE.CROUCH;
        }
        break;

      case FIGHTER_STATE.JUMP_PUNCH:
        if (fighter.stateTime > 0.05 && fighter.stateTime < 0.22) {
          fighter.activeHitbox = fighter.createHitbox(15, 70, 55, 30);
          fighter.activeHitbox.damage = 60;
          fighter.activeHitbox.knockback = 7;
          fighter.activeHitbox.isHeavy = false;
          fighter.activeHitbox.attackerPower = fighter.attackPower;
        }
        if (fighter.stateTime >= 0.28) {
          fighter.state = fighter.isGrounded ? FIGHTER_STATE.IDLE : FIGHTER_STATE.JUMP;
        }
        break;

      case FIGHTER_STATE.JUMP_KICK:
        if (fighter.stateTime > 0.05 && fighter.stateTime < 0.26) {
          fighter.activeHitbox = fighter.createHitbox(20, 50, 70, 40);
          fighter.activeHitbox.damage = 85;
          fighter.activeHitbox.knockback = 11;
          fighter.activeHitbox.isHeavy = true;
          fighter.activeHitbox.attackerPower = fighter.attackPower;
        }
        if (fighter.stateTime >= 0.32) {
          fighter.state = fighter.isGrounded ? FIGHTER_STATE.IDLE : FIGHTER_STATE.JUMP;
        }
        break;

      case FIGHTER_STATE.DASH_FORWARD:
      case FIGHTER_STATE.DASH_BACK:
        if (fighter.stateTime >= 0.2) {
          fighter.state = FIGHTER_STATE.IDLE;
        }
        break;

      case FIGHTER_STATE.SPECIAL_1:
      case FIGHTER_STATE.SPECIAL_2:
        if (fighter.stateTime > 0.08 && fighter.stateTime < 0.3) {
          fighter.activeHitbox = fighter.createHitbox(25, 80, 100, 55);
          fighter.activeHitbox.damage = 140;
          fighter.activeHitbox.knockback = 16;
          fighter.activeHitbox.knockdown = true;
          fighter.activeHitbox.isHeavy = true;
          fighter.activeHitbox.attackerPower = fighter.attackPower;

          if (particles && Math.random() < 0.5) {
            const startX = fighter.position.x + (fighter.facing * 15);
            const endX = fighter.position.x + (fighter.facing * 110);
            particles.emitElectricArc(startX, fighter.position.y - 70, endX, fighter.position.y - 70, fighter.charData.themeColor);
          }
        }
        if (fighter.stateTime >= 0.45) {
          fighter.state = FIGHTER_STATE.IDLE;
        }
        break;

      case FIGHTER_STATE.SUPER_MOVE:
        // --- 1. MAELLE: VALSA DAS LÂMINAS / ALPHA STRIKE (6 Golpes Rápidos com Teletransporte) ---
        if (fighter.superType === 'MAELLE_WALTZ') {
          fighter.isInvulnerable = true;
          fighter.velocity.x = 0;
          fighter.velocity.y = 0;

          const target = fighter.opponent;
          const targetX = target ? target.position.x : fighter.position.x + fighter.facing * 120;
          const targetY = target ? target.position.y : fighter.position.y;

          const strikeOffsets = [
            { x: -80, y: 0, face: 1 },
            { x: 90, y: -70, face: -1 },
            { x: 0, y: -110, face: 1 },
            { x: -90, y: -60, face: 1 },
            { x: 80, y: 0, face: -1 },
            { x: -60, y: 0, face: 1 }
          ];

          const strikeInterval = 0.11;
          for (let i = 0; i < 6; i++) {
            const strikeStartTime = 0.04 + i * strikeInterval;
            const strikePhaseName = `STRIKE_${i + 1}`;

            if (fighter.stateTime >= strikeStartTime && fighter.superPhase === `STRIKE_${i}`) {
              fighter.superPhase = strikePhaseName;
              fighter.hasHitCurrentAttack = false;
              const off = strikeOffsets[i];
              fighter.facing = off.face;
              fighter.position.x = Math.max(60, Math.min(stageWidth - 60, targetX + off.x * (target ? target.facing : 1)));
              fighter.position.y = fighter.groundY + off.y;
              fighter.isGrounded = off.y === 0;

              const isFinisher = i === 5;
              if (isFinisher) {
                sounds.playRapierFinisher();
              } else {
                sounds.playRapierSlash();
              }

              if (particles) {
                const slashStartX = fighter.position.x - fighter.facing * 30;
                const slashStartY = fighter.position.y - 60;
                const slashEndX = targetX + (fighter.facing * 50);
                const slashEndY = targetY - 60 + (Math.random() - 0.5) * 40;

                particles.emitSwordSlash(slashStartX, slashStartY, slashEndX, slashEndY, isFinisher ? '#fbbf24' : '#38bdf8', isFinisher ? 5.5 : 3.5);
                if (isFinisher) {
                  particles.emitSwordSlash(slashStartX, slashEndY, slashEndX, slashStartY, '#38bdf8', 4.5);
                  particles.emitShockwave(targetX, targetY - 60, 180, '#38bdf8');
                  particles.emitSparks(targetX, targetY - 60, '#fbbf24', 30, 12);
                } else {
                  particles.emitSparks(targetX, targetY - 60, '#38bdf8', 10, 6);
                }
              }
            }

            if (fighter.stateTime >= strikeStartTime && fighter.stateTime < strikeStartTime + 0.08) {
              const isFinisher = i === 5;
              fighter.activeHitbox = fighter.createHitbox(10, 80, 80, 50);
              fighter.activeHitbox.damage = isFinisher ? 140 : 45;
              fighter.activeHitbox.knockback = isFinisher ? 24 : 3;
              fighter.activeHitbox.knockdown = isFinisher;
              fighter.activeHitbox.isHeavy = isFinisher;
              fighter.activeHitbox.attackerPower = fighter.attackPower;
            }
          }

          if (fighter.stateTime >= 0.95) {
            fighter.isInvulnerable = false;
            fighter.superPhase = null;
            fighter.superType = null;
            fighter.position.y = fighter.groundY;
            fighter.isGrounded = true;
            fighter.state = FIGHTER_STATE.IDLE;
          }
          break;
        }

        // --- 2. RENOIR: FLOR NEGRA MONUMENTAL (Bengala Erguida, Carga da Flor & Esmagamento Abissal) ---
        if (fighter.superType === 'RENOIR_FLOWER') {
          fighter.isInvulnerable = true;
          fighter.velocity.x = 0;
          fighter.velocity.y = 0;

          const target = fighter.opponent;
          const targetX = target ? target.position.x : fighter.position.x + fighter.facing * 180;
          const groundY = fighter.groundY;

          // Fase 1: Evocação e Florescimento (0.0s - 0.7s)
          if (fighter.stateTime < 0.7) {
            if (fighter.superPhase === 'SUMMON_FLOWER' && fighter.stateTime >= 0.1) {
              fighter.superPhase = 'FLOWER_BLOOM';
            }
            if (particles && Math.random() < 0.6) {
              // Pétalas e fagulhas sombrias subindo acima do adversário
              const px = targetX + (Math.random() - 0.5) * 80;
              const py = groundY - 210 + (Math.random() - 0.5) * 60;
              particles.emitSparks(px, py, '#09090b', 4, 3);
              particles.emitSparks(px, py, '#78716c', 2, 2);
            }
          }
          // Fase 2: Carga de Energia Abissal (0.7s - 1.2s)
          else if (fighter.stateTime >= 0.7 && fighter.stateTime < 1.2) {
            if (fighter.superPhase !== 'FLOWER_CHARGING') {
              fighter.superPhase = 'FLOWER_CHARGING';
              sounds.playElectricZap();
            }
            if (particles && Math.random() < 0.75) {
              const fx = targetX + (Math.random() - 0.5) * 90;
              const fy = groundY - 210 + (Math.random() - 0.5) * 70;
              particles.emitElectricArc(fx, fy, targetX, groundY - 210, '#000000', 1);
              particles.emitSparks(targetX, groundY - 210, '#a855f7', 3, 5);
            }
          }
          // Fase 3: Queda Devastadora da Flor sobre o Adversário (1.2s - 1.55s)
          else if (fighter.stateTime >= 1.2 && fighter.stateTime < 1.55) {
            if (fighter.superPhase !== 'FLOWER_SLAM') {
              fighter.superPhase = 'FLOWER_SLAM';
              sounds.playThunderSlam();
              sounds.playPunch(true);

              if (particles) {
                // Impacto titânico no chão sob a cabeça do adversário
                particles.emitShockwave(targetX, groundY, 320, '#000000');
                particles.emitShockwave(targetX, groundY, 220, '#78716c');
                particles.emitShockwave(targetX, groundY, 140, '#ef4444');
                particles.emitSparks(targetX, groundY - 30, '#000000', 50, 16);
                particles.emitSparks(targetX, groundY - 30, '#ef4444', 35, 12);
                particles.emitDust(targetX, groundY, 30, '#1c1917');
              }
            }

            // Hitbox massiva AoE de impacto no chão onde a flor cai
            if (fighter.stateTime >= 1.25 && fighter.stateTime < 1.48 && !fighter.hasHitCurrentAttack) {
              const boxWidth = 260;
              const boxLeft = targetX - boxWidth / 2;
              fighter.activeHitbox = {
                x: boxLeft,
                y: groundY - 140,
                width: boxWidth,
                height: 150,
                damage: 380,
                knockback: 25,
                knockdown: true,
                isHeavy: true,
                unblockable: false,
                attackerPower: fighter.attackPower
              };
            }
          }

          // Fase 4: Recuperação e Término
          if (fighter.stateTime >= 1.85) {
            fighter.isInvulnerable = false;
            fighter.superPhase = null;
            fighter.superType = null;
            fighter.activeHitbox = null;
            fighter.state = FIGHTER_STATE.IDLE;
          }
          break;
        }

        // --- 3. GUSTAVE / SUPER MOVE PADRÃO (3 FASES) ---
        if (fighter.stateTime < 0.5) {
          fighter.velocity.x = 0;
          fighter.isInvulnerable = true;
          if (particles && Math.random() < 0.65) {
            const gx = fighter.position.x - fighter.facing * 30;
            const gy = fighter.position.y - 45;
            particles.emitElectricArc(gx + (Math.random() - 0.5) * 60, gy + (Math.random() - 0.5) * 60, gx, gy, '#ef4444', 2);
            particles.emitSparks(gx, gy, '#ef4444', 4, 6);
          }
        } else if (fighter.stateTime >= 0.5 && fighter.stateTime < 0.85) {
          if (fighter.superPhase === 'CHARGE') {
            fighter.superPhase = 'LEAP';
            const targetX = fighter.opponent ? fighter.opponent.position.x : fighter.position.x + fighter.facing * 320;
            const dist = targetX - fighter.position.x;
            fighter.facing = dist >= 0 ? 1 : -1;
            fighter.velocity.y = -15;
            fighter.velocity.x = Math.max(-20, Math.min(20, dist / 0.35));
            fighter.isGrounded = false;
            sounds.playSuper();
            if (particles) particles.emitDust(fighter.position.x, fighter.groundY, 14, '#ef4444');
          }

          if (particles && Math.random() < 0.7) {
            const hx = fighter.position.x + fighter.facing * 35;
            const hy = fighter.position.y - 120;
            particles.emitElectricArc(fighter.position.x, fighter.position.y - 60, hx, hy, '#ff0033', 2);
            particles.emitSparks(hx, hy, '#ef4444', 5, 8);
          }
        } else if (fighter.stateTime >= 0.85 && fighter.stateTime < 1.45) {
          if (fighter.superPhase === 'LEAP') {
            fighter.superPhase = 'IMPACT';
            fighter.position.y = fighter.groundY;
            fighter.velocity.y = 0;
            fighter.velocity.x = 0;
            fighter.isGrounded = true;

            sounds.playPunch(true);
            sounds.playSuperImpact();

            if (particles) {
              const impactX = fighter.position.x + fighter.facing * 40;
              particles.emitShockwave(impactX, fighter.groundY, 260, '#ef4444');
              particles.emitShockwave(impactX, fighter.groundY, 150, '#fbbf24');
              particles.emitSparks(impactX, fighter.groundY - 20, '#ef4444', 45, 16);
              particles.emitDust(impactX, fighter.groundY, 25, '#fbbf24');
            }
          }

          if (fighter.stateTime >= 0.85 && fighter.stateTime < 1.15) {
            const impactBoxX = fighter.facing === 1 ? -60 : -260;
            fighter.activeHitbox = fighter.createHitbox(impactBoxX, 100, 320, 110);
            fighter.activeHitbox.damage = 350;
            fighter.activeHitbox.knockback = 26;
            fighter.activeHitbox.knockdown = true;
            fighter.activeHitbox.isHeavy = true;
            fighter.activeHitbox.unblockable = false;
            fighter.activeHitbox.attackerPower = fighter.attackPower;
          }
        }

        if (fighter.stateTime >= 1.45) {
          fighter.isInvulnerable = false;
          fighter.superPhase = null;
          fighter.superType = null;
          fighter.state = FIGHTER_STATE.IDLE;
        }
        break;

      case FIGHTER_STATE.KNOCKDOWN:
        if (fighter.stateTime >= 0.65) {
          if (fighter.isDead) {
            fighter.state = FIGHTER_STATE.DEFEAT;
          } else {
            fighter.state = FIGHTER_STATE.GET_UP;
            fighter.stateTime = 0;
            fighter.isInvulnerable = true;
          }
        }
        break;

      case FIGHTER_STATE.GET_UP:
        if (fighter.stateTime >= 0.3) {
          fighter.isInvulnerable = false;
          fighter.state = FIGHTER_STATE.IDLE;
        }
        break;
    }
  }
}
