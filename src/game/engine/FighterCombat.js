import { FIGHTER_STATE } from './Fighter';
import { Box } from './Collision';
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
          fighter.state = fighter.isCrouching ? FIGHTER_STATE.CROUCH : FIGHTER_STATE.IDLE;
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
          fighter.state = fighter.isCrouching ? FIGHTER_STATE.CROUCH : FIGHTER_STATE.IDLE;
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
        // Monoco: Giro de 360° com cajado cobrindo frente e trás
        if (fighter.extraType === 'MONOCO_STAFF_SPIN') {
          if (fighter.stateTime > 0.05 && fighter.stateTime < 0.32) {
            const spinDamage = fighter.extraAttackLevel === 2 ? 180 : 110;
            // Hitbox estendida para trás e para frente
            fighter.activeHitbox = fighter.createHitbox(-85, 80, 190, 60);
            fighter.activeHitbox.damage = spinDamage;
            fighter.activeHitbox.knockback = 15;
            fighter.activeHitbox.knockdown = true;
            fighter.activeHitbox.isHeavy = true;
            fighter.activeHitbox.attackerPower = fighter.attackPower;

            if (particles && Math.random() < 0.6) {
              const ang = Math.random() * Math.PI * 2;
              const px = fighter.position.x + Math.cos(ang) * 75;
              const py = fighter.position.y - 65 + Math.sin(ang) * 40;
              particles.emitSparks(px, py, '#f59e0b', 3, 3);
            }
          }
          if (fighter.stateTime >= 0.42) {
            fighter.state = FIGHTER_STATE.IDLE;
            fighter.extraType = null;
          }
        }
        // Maelle, Gustave, Lune, Renoir, Peintresse já tratam seus efeitos em tempo real
        else if (fighter.extraType === 'GUSTAVE_GUN' || fighter.extraType === 'MAELLE_BLINK_DASH' || fighter.extraType === 'LUNE_HEAL' || fighter.extraType === 'RENOIR_BLACK_HOLE' || fighter.extraType === 'PAINTRESS_REALITY_TEAR') {
          if (fighter.stateTime >= 0.35) {
            fighter.isInvulnerable = false;
            fighter.state = FIGHTER_STATE.IDLE;
            fighter.extraType = null;
          }
        } else {
          // Genérico
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
            fighter.extraType = null;
          }
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
              fighter.activeHitbox.damage = isFinisher ? 250 : 75;
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
              const hb = new Box(boxLeft, groundY - 140, boxWidth, 150, 'hitbox');
              hb.damage = 380;
              hb.knockback = 25;
              hb.knockdown = true;
              hb.isHeavy = true;
              hb.unblockable = false;
              hb.attackerPower = fighter.attackPower;
              fighter.activeHitbox = hb;
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

        // --- 3. SCIEL: DARK WAVE (Rasgo no Espaço/Tempo em +) ---
        if (fighter.superType === 'SCIEL_DARK_WAVE') {
          fighter.isInvulnerable = true;
          fighter.velocity.x = 0;
          fighter.velocity.y = 0;

          const target = fighter.opponent;
          const targetX = target ? target.position.x : fighter.position.x + fighter.facing * 150;
          const targetY = target ? target.position.y - 60 : fighter.position.y - 60;

          // Fase 1: Dash até o oponente (0 - 0.25s)
          if (fighter.stateTime < 0.25) {
            if (fighter.superPhase === 'DASH_IN') {
              const dist = targetX - fighter.position.x;
              fighter.facing = dist >= 0 ? 1 : -1;
              // Deslizar suavemente até a posição do oponente
              fighter.position.x += (targetX - fighter.facing * 60 - fighter.position.x) * 0.15;
            }

            if (particles && Math.random() < 0.5) {
              particles.emitSparks(fighter.position.x, fighter.position.y - 50, '#fbbf24', 3, 5);
            }
          }

          // Fase 2: Corte Horizontal (0.25 - 0.55s)
          if (fighter.stateTime >= 0.25 && fighter.stateTime < 0.55) {
            if (fighter.superPhase === 'DASH_IN') {
              fighter.superPhase = 'HORIZONTAL_CUT';
              fighter.hasHitCurrentAttack = false;
              // Posicionar ao lado do oponente
              fighter.position.x = targetX - fighter.facing * 60;
              // Salvar centro do corte para o renderer visual
              fighter._darkWaveCenterX = targetX;
              fighter._darkWaveCenterY = targetY;
              fighter._darkWaveTime = 0;
              sounds.playRapierSlash();

              if (particles) {
                // Slash horizontal (esquerda → direita)
                particles.emitSwordSlash(targetX - 160, targetY, targetX + 160, targetY, '#ffffff', 5);
                particles.emitSparks(targetX, targetY, '#ffffff', 15, 8);
              }
            }
            fighter._darkWaveTime = fighter.stateTime - 0.25;

            // Hitbox do corte horizontal (larga e baixa)
            if (fighter.stateTime >= 0.28 && fighter.stateTime < 0.48 && !fighter.hasHitCurrentAttack) {
              const hb = new Box(targetX - 150, targetY - 25, 300, 50, 'hitbox');
              hb.damage = 200;
              hb.knockback = 8;
              hb.knockdown = false;
              hb.isHeavy = false;
              hb.attackerPower = fighter.attackPower;
              fighter.activeHitbox = hb;
            }
          }

          // Fase 3: Corte Vertical (0.55 - 0.85s)
          if (fighter.stateTime >= 0.55 && fighter.stateTime < 0.85) {
            if (fighter.superPhase === 'HORIZONTAL_CUT') {
              fighter.superPhase = 'VERTICAL_CUT';
              fighter.hasHitCurrentAttack = false;
              sounds.playRapierFinisher();

              if (particles) {
                // Slash vertical (cima → baixo)
                particles.emitSwordSlash(targetX, targetY - 150, targetX, targetY + 150, '#ffffff', 5);
                particles.emitSparks(targetX, targetY, '#fbbf24', 20, 10);
                particles.emitShockwave(targetX, targetY, 120, '#ffffff');
              }
            }
            fighter._darkWaveTime = fighter.stateTime - 0.25;

            // Hitbox do corte vertical (estreita e alta)
            if (fighter.stateTime >= 0.58 && fighter.stateTime < 0.78 && !fighter.hasHitCurrentAttack) {
              const hb = new Box(targetX - 30, targetY - 140, 60, 280, 'hitbox');
              hb.damage = 220;
              hb.knockback = 22;
              hb.knockdown = true;
              hb.isHeavy = true;
              hb.attackerPower = fighter.attackPower;
              fighter.activeHitbox = hb;
            }
          }

          // Fase 4: Recuperação (0.85 - 1.3s)
          if (fighter.stateTime >= 0.85) {
            fighter._darkWaveTime = fighter.stateTime - 0.25;
          }
          if (fighter.stateTime >= 1.3) {
            fighter.isInvulnerable = false;
            fighter.superPhase = null;
            fighter.superType = null;
            fighter._darkWaveCenterX = null;
            fighter._darkWaveCenterY = null;
            fighter._darkWaveTime = null;
            fighter.activeHitbox = null;
            fighter.state = FIGHTER_STATE.IDLE;
          }
          break;
        }

        // --- 4. LUNE: MAGIA ELEMENTAL ASTRAL (Gelo, Fogo, Terra, Ar) ---
        if (fighter.superType === 'LUNE_ELEMENTAL') {
          fighter.isInvulnerable = true;
          fighter.velocity.x = 0;
          fighter.velocity.y = 0;

          const elem = fighter.luneElement || 'ICE';
          const target = fighter.opponent;

          // 1. GELO (ICE): Dispara estaca veloz de gelo que causa dano e slow de 4s
          if (elem === 'ICE') {
            if (particles && Math.random() < 0.5) {
              particles.emitSparks(fighter.position.x + fighter.facing * 25, fighter.position.y - 60, '#38bdf8', 3, 5);
            }
            if (fighter.stateTime >= 0.32 && !fighter.luneIceLance) {
              sounds.playIceSpell();
              fighter.luneIceLance = {
                x: fighter.position.x + fighter.facing * 35,
                y: fighter.position.y - 65,
                vx: fighter.facing * 1200,
                active: true,
                hasHit: false,
                damage: 280
              };
              if (particles) {
                particles.emitShockwave(fighter.position.x + fighter.facing * 35, fighter.position.y - 65, 80, '#38bdf8');
              }
            }
            if (fighter.stateTime >= 0.8) {
              fighter.isInvulnerable = false;
              fighter.superPhase = null;
              fighter.superType = null;
              fighter.state = FIGHTER_STATE.IDLE;
            }
          }

          // 2. FOGO (FIRE): Lança-chamas continuo que causa dano frontal e queimação (DoT)
          else if (elem === 'FIRE') {
            if (fighter.stateTime >= 0.22 && fighter.stateTime < 0.9) {
              fighter.luneFlameActive = true;
              if (particles) {
                const flameOriginX = fighter.position.x + fighter.facing * 30;
                for (let i = 0; i < 4; i++) {
                  const dist = 30 + Math.random() * 280;
                  const fx = flameOriginX + fighter.facing * dist;
                  const fy = fighter.position.y - 65 + (Math.random() - 0.5) * 45;
                  particles.emitSparks(fx, fy, Math.random() < 0.5 ? '#f97316' : '#ef4444', 3, 6);
                }
              }

              if (fighter.stateTime >= 0.28 && fighter.stateTime < 0.75 && !fighter.hasHitCurrentAttack) {
                const reach = 320;
                const boxX = fighter.facing === 1 ? fighter.position.x + 20 : fighter.position.x - 20 - reach;
                const hb = new Box(boxX, fighter.position.y - 110, reach, 95, 'hitbox');
                hb.damage = 220;
                hb.knockback = 12;
                hb.knockdown = false;
                hb.isHeavy = true;
                hb.attackerPower = fighter.attackPower;
                fighter.activeHitbox = hb;
                if (target) {
                  target.burnTimer = 3.5;
                  target.burnTickTimer = 0;
                }
              }
            } else {
              fighter.luneFlameActive = false;
            }

            if (fighter.stateTime >= 1.05) {
              fighter.isInvulnerable = false;
              fighter.superPhase = null;
              fighter.superType = null;
              fighter.luneFlameActive = false;
              fighter.state = FIGHTER_STATE.IDLE;
            }
          }

          // 3. TERRA (EARTH): Terremoto no chão (bloqueio não reduz, apenas pulo)
          else if (elem === 'EARTH') {
            if (fighter.stateTime >= 0.38 && fighter.superPhase === 'CAST_EARTH') {
              fighter.superPhase = 'EARTH_BURST';
              sounds.playEarthquakeSound();
              sounds.playThunderSlam();
              fighter.luneEarthquakeTimer = 4.0;
              fighter.luneEarthquakeTick = 0;

              if (particles) {
                particles.emitGroundLightningExplosion(fighter.position.x + fighter.facing * 60, fighter.groundY, 260, '#b45309');
                particles.emitShockwave(fighter.position.x, fighter.groundY, 220, '#d97706');
                particles.emitDust(fighter.position.x, fighter.groundY, 30, '#78350f');
              }
            }

            if (fighter.stateTime >= 0.85) {
              fighter.isInvulnerable = false;
              fighter.superPhase = null;
              fighter.superType = null;
              fighter.state = FIGHTER_STATE.IDLE;
            }
          }

          // 4. AR (WIND): Furacão perseguidor que causa dano contínuo via raios
          else if (elem === 'WIND') {
            if (fighter.stateTime >= 0.3 && !fighter.luneTornado) {
              sounds.playWindTornado();
              fighter.luneTornado = {
                x: fighter.position.x + fighter.facing * 75,
                active: true,
                duration: 4.5,
                zapTick: 0
              };
              if (particles) {
                particles.emitShockwave(fighter.position.x + fighter.facing * 75, fighter.groundY, 140, '#94a3b8');
                particles.emitDust(fighter.position.x + fighter.facing * 75, fighter.groundY, 20, '#cbd5e1');
              }
            }

            if (fighter.stateTime >= 0.75) {
              fighter.isInvulnerable = false;
              fighter.superPhase = null;
              fighter.superType = null;
              fighter.state = FIGHTER_STATE.IDLE;
            }
          }
          break;
        }

        // --- 5. LA PEINTRESSE: ONDAS CROMÁTICAS (Padrões Rítmicos que Exigem Pulo) ---
        if (fighter.superType === 'PAINTRESS_CHROMATIC_WAVES') {
          fighter.isInvulnerable = true;
          fighter.velocity.x = 0;
          fighter.velocity.y = 0;

          if (!fighter._wavesSpawned) {
            fighter._wavesSpawned = [false, false, false];
          }

          // Partículas cósmicas ao redor da deusa durante a pintura das ondas
          if (particles && Math.random() < 0.6) {
            const bx = fighter.position.x + fighter.facing * 35;
            const by = fighter.position.y - 120;
            particles.emitSparks(bx, by, '#fbbf24', 4, 5);
            particles.emitSparks(fighter.position.x, fighter.position.y - 60, '#d946ef', 2, 4);
          }

          const waveConfigs = [
            { time: 0.35, color: '#fbbf24', secondary: '#fef08a', speed: 780, name: 'WAVE_1' },
            { time: 0.75, color: '#d946ef', secondary: '#f5d0fe', speed: 850, name: 'WAVE_2' },
            { time: 1.15, color: '#ef4444', secondary: '#fca5a5', speed: 920, name: 'WAVE_3' }
          ];

          for (let i = 0; i < 3; i++) {
            const cfg = waveConfigs[i];
            if (fighter.stateTime >= cfg.time && !fighter._wavesSpawned[i]) {
              fighter._wavesSpawned[i] = true;
              fighter.superPhase = cfg.name;
              sounds.playChromaticWaveCast();

              const startX = fighter.position.x + fighter.facing * 50;
              fighter.chromaticWaves.push({
                x: startX,
                vx: fighter.facing * cfg.speed,
                color: cfg.color,
                secondary: cfg.secondary,
                damage: 230,
                hasHit: false,
                active: true,
                waveIndex: i,
                timeAlive: 0
              });

              if (particles) {
                particles.emitShockwave(startX, fighter.groundY, 120, cfg.color);
                particles.emitSparks(startX, fighter.groundY - 20, cfg.color, 18, 8);
              }
            }
          }

          if (fighter.stateTime >= 1.55) {
            fighter.isInvulnerable = false;
            fighter.superPhase = null;
            fighter.superType = null;
            fighter._wavesSpawned = null;
            fighter.state = FIGHTER_STATE.IDLE;
          }
          break;
        }

        // --- 6. MONOCO: PARRY MÍSTICO & REFLEXÃO GESTRAL ---
        if (fighter.superType === 'MONOCO_PARRY_MIMIC') {
          fighter.velocity.x = 0;
          fighter.velocity.y = 0;

          // Fase 1: Postura de Parry ativa por curto período (0s a 0.55s)
          // "não faz nada" a menos que seja atingido
          if (fighter.superPhase === 'PARRY_STANCE') {
            fighter.isInvulnerable = false;

            if (particles && Math.random() < 0.45) {
              const staffX = fighter.position.x + fighter.facing * 30;
              const staffY = fighter.position.y - 70;
              particles.emitSparks(staffX, staffY, '#fbbf24', 2, 4);
            }

            // Se ninguém atacou Monoco durante a janela de parry, a postura acaba sem efeito ("não faz nada")
            if (fighter.stateTime >= 0.55) {
              fighter.superPhase = null;
              fighter.superType = null;
              fighter.state = FIGHTER_STATE.IDLE;
            }
          }

          // Fase 2: Contra-Ataque com Golpe Padrão (quando dá parry em soco/chute comum)
          else if (fighter.superPhase === 'PARRY_BASIC_COUNTER') {
            fighter.isInvulnerable = false;

            if (fighter.stateTime >= 0.06 && fighter.stateTime < 0.22 && !fighter.hasHitCurrentAttack) {
              const hb = fighter.createHitbox(15, 80, 85, 55);
              hb.damage = 90;
              hb.knockback = 8;
              hb.knockdown = false;
              hb.isHeavy = false;
              hb.attackerPower = fighter.attackPower;
              fighter.activeHitbox = hb;

              if (particles) {
                particles.emitSparks(fighter.position.x + fighter.facing * 35, fighter.position.y - 70, '#f59e0b', 8, 4);
              }
            }

            if (fighter.stateTime >= 0.28) {
              fighter.superPhase = null;
              fighter.superType = null;
              fighter.state = FIGHTER_STATE.IDLE;
            }
          }

          // Fase 3: Explosão Mística de Reversão (quando contra-ataca habilidade)
          else if (fighter.superPhase === 'MIMIC_BURST') {
            fighter.isInvulnerable = true;

            if (fighter.stateTime >= 0.1 && fighter.stateTime < 0.35 && !fighter.hasHitCurrentAttack) {
              const reach = 220;
              const boxX = fighter.facing === 1 ? fighter.position.x + 10 : fighter.position.x - 10 - reach;
              const hb = new Box(boxX, fighter.position.y - 120, reach, 110, 'hitbox');
              hb.damage = 420;
              hb.knockback = 26;
              hb.knockdown = true;
              hb.isHeavy = true;
              hb.attackerPower = fighter.attackPower;
              fighter.activeHitbox = hb;

              if (particles) {
                particles.emitShockwave(fighter.position.x + fighter.facing * 50, fighter.position.y - 60, 200, '#fbbf24');
                particles.emitSparks(fighter.position.x + fighter.facing * 50, fighter.position.y - 60, '#f59e0b', 30, 12);
              }
            }

            if (fighter.stateTime >= 0.65) {
              fighter.isInvulnerable = false;
              fighter.superPhase = null;
              fighter.superType = null;
              fighter.state = FIGHTER_STATE.IDLE;
            }
          }
          break;
        }

        // --- 7. GUSTAVE / SUPER MOVE PADRÃO (3 FASES) ---
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
            fighter._superTargetX = targetX;
            fighter._superStartX = fighter.position.x;
            const dist = targetX - fighter.position.x;
            fighter.facing = dist >= 0 ? 1 : -1;
            fighter.velocity.y = -15;
            fighter.velocity.x = 0; // Sem velocidade horizontal — interpolação controlada
            fighter.isGrounded = false;
            sounds.playSuper();
            if (particles) particles.emitDust(fighter.position.x, fighter.groundY, 14, '#ef4444');
          }

          // Interpolar posição horizontal em direção ao alvo durante o LEAP
          if (fighter._superTargetX != null && fighter._superStartX != null) {
            const leapProgress = Math.min(1, (fighter.stateTime - 0.5) / 0.35);
            const landX = fighter._superTargetX - fighter.facing * 40;
            fighter.position.x = fighter._superStartX + (landX - fighter._superStartX) * leapProgress;
          }

          // Manter no ar durante o LEAP (sobrescrever gravidade)
          if (!fighter.isGrounded) {
            fighter.position.y = Math.min(fighter.position.y, fighter.groundY - 80);
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

            // Teleportar para perto do oponente para garantir o impacto
            const landX = fighter._superTargetX || fighter.position.x;
            fighter.position.x = landX - fighter.facing * 40;
            fighter.position.y = fighter.groundY;
            fighter.velocity.y = 0;
            fighter.velocity.x = 0;
            fighter.isGrounded = true;

            sounds.playPunch(true);
            sounds.playThunderSlam();

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
