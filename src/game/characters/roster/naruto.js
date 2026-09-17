import { BaseCharacter } from '../base/BaseCharacter.js';
import { sounds } from '../../audio/soundManager.js';
import { Box } from '../../engine/Collision.js';
import { FIGHTER_STATE } from '../../engine/Fighter.js';
import { ExpeditionRenderer } from '../../engine/ExpeditionRenderer.js';

export class NarutoBehavior extends BaseCharacter {
  constructor() {
    super('naruto', 'Naruto Uzumaki');
  }

  init(fighter) {
    fighter.isNaruto = true;
    fighter.narutoClone = null;
    fighter.narutoRasenShuriken = null;
    fighter.narutoChargeTimer = 0;
    fighter._rushTimer = 0;
  }

  reset(fighter) {
    fighter.narutoClone = null;
    fighter.narutoRasenShuriken = null;
    fighter.narutoChargeTimer = 0;
    fighter._rushTimer = 0;
  }

  // 12 - NARUTO Q: Invoca um clone que repete os movimentos simetricamente. Apertar E troca de lugar instantaneamente!
  onSpecial(fighter, level) {
    fighter.extraType = 'NARUTO_KAGE_BUNSHIN';
    sounds.playWhoosh();
    sounds.playDash();

    // Spawn simétrico do clone em relação ao oponente ou arena
    const op = fighter.opponent;
    let spawnX;
    if (op && !op.isDead) {
      // Eixo simétrico: espelhado do outro lado do oponente
      spawnX = op.position.x + (op.position.x - fighter.position.x);
    } else {
      spawnX = fighter.position.x - fighter.facing * 200;
    }
    // Limitar dentro da arena
    spawnX = Math.max(90, Math.min(1910, spawnX));

    fighter.narutoClone = {
      x: spawnX,
      y: fighter.groundY,
      vx: 0,
      facing: spawnX < (op ? op.position.x : 1000) ? 1 : -1,
      timer: 9.0, // 9 segundos ativo
      active: true,
      lastSwapTime: 0
    };

    // Efeito de poof ninja na aparição
    sounds.playWhoosh();
    return true;
  }

  // 12 - NARUTO R (Super): Carrega enquanto Enter/R é segurado com clone girando chakra; ao soltar, corre e lança!
  onSuper(fighter) {
    fighter.superType = 'NARUTO_RASEN_SHURIKEN';
    fighter.superPhase = 'CHARGING';
    fighter.narutoChargeTimer = 0.1;
    fighter._rushTimer = 0;
    fighter.narutoRasenShuriken = null;
    fighter.isInvulnerable = true;
    fighter.velocity.x = 0;

    sounds.playSuperCharge();
    sounds.playWindTornado();
    return true;
  }

  update(fighter, dt, stageWidth, particles) {
    // --- 1. Atualização do Clone Espelho (Q) ---
    if (fighter.narutoClone && fighter.narutoClone.active) {
      const clone = fighter.narutoClone;
      clone.timer -= dt;

      // Movimentação simétrica: espelha a velocidade horizontal de Naruto
      clone.vx = -fighter.velocity.x;
      clone.x += clone.vx * dt * 60;
      clone.x = Math.max(70, Math.min(stageWidth - 70, clone.x));
      clone.y = fighter.position.y;

      // Clone vira em direção ao oponente ou a Naruto
      if (fighter.opponent) {
        clone.facing = clone.x <= fighter.opponent.position.x ? 1 : -1;
      }

      // Desaparece ao expirar
      if (clone.timer <= 0) {
        clone.active = false;
        fighter.narutoClone = null;
        if (particles) {
          particles.emitDust(clone.x, clone.y - 40, 12, '#e2e8f0');
        }
      }
    }

    // --- 2. Atualização da Ultimate Carregada (Enter / R) ---
    if (fighter.superType === 'NARUTO_RASEN_SHURIKEN') {
      if (fighter.superPhase === 'CHARGING') {
        fighter.velocity.x = 0;
        fighter.isInvulnerable = true;

        // Se ainda estiver segurando a tecla Enter e não atingiu carga máxima (2.8s)
        if (fighter.isHoldingSuper && fighter.narutoChargeTimer < 2.8) {
          fighter.narutoChargeTimer += dt;

          // Faíscas espirais intensas de chakra azul celeste e branco na mão
          if (particles && Math.random() < 0.75) {
            const hx = fighter.position.x + fighter.facing * 30;
            const hy = fighter.position.y - 70;
            particles.emitSparks(hx + (Math.random() - 0.5) * 40, hy + (Math.random() - 0.5) * 40, '#38bdf8', 4, 3);
            particles.emitSparks(hx, hy, '#ffffff', 2, 2);
          }
        } else {
          // Soltou o Enter ou atingiu carga máxima -> Dispara em corrida!
          fighter.superPhase = 'RUSH';
          fighter._rushTimer = 0;
          fighter.velocity.x = fighter.facing * 1200;
          sounds.playDash();
          sounds.playWindTornado();

          if (particles) {
            // Poof de dissipação do clone auxiliar
            const hx = fighter.position.x - fighter.facing * 35;
            particles.emitDust(hx, fighter.position.y - 40, 10, '#cbd5e1');
          }
        }
      } else if (fighter.superPhase === 'RUSH') {
        fighter._rushTimer += dt;
        fighter.isInvulnerable = true;

        const op = fighter.opponent;
        const closeToEnemy = op && Math.abs(fighter.position.x - op.position.x) < 90;

        // Lança o Rasen-Shuriken ao se aproximar do oponente ou após 0.22s de corrida
        if (fighter._rushTimer >= 0.22 || closeToEnemy) {
          fighter.superPhase = 'THROW';
          fighter.velocity.x *= 0.15; // Freia o avanço

          const chargeRatio = Math.min(1, fighter.narutoChargeTimer / 2.5);
          const scaledDmg = Math.round(300 + chargeRatio * 420); // Dano: 300 a 720!
          const scaleSize = 1.0 + chargeRatio * 1.1; // Escala: 1.0x a 2.1x!

          fighter.narutoRasenShuriken = {
            x: fighter.position.x + fighter.facing * 45,
            y: fighter.position.y - 70,
            vx: fighter.facing * 1150,
            vy: 0,
            damage: scaledDmg,
            scale: scaleSize,
            active: true,
            hasHit: false,
            timer: 0,
            expanded: false
          };

          sounds.playWhoosh();
          sounds.playWindTornado();
          sounds.playLaser();

          // Restaura o controle do Naruto
          setTimeout(() => {
            if (fighter.superType === 'NARUTO_RASEN_SHURIKEN' && fighter.superPhase === 'THROW') {
              fighter.state = FIGHTER_STATE.IDLE;
              fighter.superPhase = null;
              fighter.superType = null;
              fighter.isInvulnerable = false;
            }
          }, 140);
        }
      }
    }

    // --- 3. Voo e Impacto do Rasen-Shuriken ---
    if (fighter.narutoRasenShuriken && fighter.narutoRasenShuriken.active) {
      const rs = fighter.narutoRasenShuriken;
      rs.x += rs.vx * dt;
      rs.timer += dt;

      if (particles && Math.random() < 0.65) {
        particles.emitSparks(rs.x, rs.y, '#38bdf8', 5, 4);
        particles.emitSparks(rs.x, rs.y, '#ffffff', 3, 2);
      }

      if (fighter.opponent && !rs.hasHit && !fighter.opponent.isDead) {
        const radius = 40 * rs.scale;
        const hurtboxes = fighter.opponent.getHurtboxes();
        const shurikenBox = new Box(rs.x - radius, rs.y - radius, radius * 2, radius * 2, 'hitbox');

        for (const hurt of hurtboxes) {
          if (shurikenBox.intersects(hurt)) {
            rs.hasHit = true;
            rs.expanded = true;

            const attackData = {
              damage: rs.damage,
              knockback: 28,
              knockdown: true,
              isHeavy: true,
              unblockable: true,
              attackerPower: fighter.attackPower
            };
            fighter.opponent.receiveHit(attackData, { x: rs.x, y: rs.y }, particles);

            sounds.playThunderSlam();
            sounds.playLaser();

            if (particles) {
              particles.emitShockwave(rs.x, rs.y, 240 * rs.scale, '#38bdf8');
              particles.emitSparks(rs.x, rs.y, '#ffffff', 40, 14);
              particles.emitSparks(rs.x, rs.y, '#0284c7', 35, 12);
            }
            break;
          }
        }
      }

      if (rs.timer > 2.2 || rs.x < -200 || rs.x > stageWidth + 200 || rs.hasHit) {
        rs.active = false;
      }
    }
  }

  // --- Renderização Visual das Habilidades de Naruto ---
  draw(fighter, ctx) {
    // 1. Renderiza o Clone Espelho (Q)
    if (fighter.narutoClone && fighter.narutoClone.active) {
      const clone = fighter.narutoClone;
      const cloneProxy = {
        position: { x: clone.x, y: clone.y },
        facing: clone.facing,
        pose: fighter.pose,
        charData: fighter.charData,
        groundY: fighter.groundY,
        stateTime: fighter.stateTime,
        energy: 0,
        state: fighter.state,
        velocity: { x: clone.vx, y: 0 },
        isGrounded: fighter.isGrounded,
        getHurtboxes: () => []
      };

      ctx.save();
      ctx.globalAlpha = 0.88;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ExpeditionRenderer.draw(ctx, cloneProxy);
      ctx.restore();
    }

    // 2. Renderiza o Clone Auxiliar durante a carga da Ultimate
    if (fighter.superType === 'NARUTO_RASEN_SHURIKEN' && fighter.superPhase === 'CHARGING') {
      const helperCloneProxy = {
        position: { x: fighter.position.x - fighter.facing * 35, y: fighter.position.y },
        facing: fighter.facing,
        pose: fighter.pose,
        charData: fighter.charData,
        groundY: fighter.groundY,
        stateTime: fighter.stateTime,
        energy: 0,
        state: fighter.state,
        velocity: { x: 0, y: 0 },
        isGrounded: true,
        getHurtboxes: () => []
      };

      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 14;
      ExpeditionRenderer.draw(ctx, helperCloneProxy);
      ctx.restore();

      // Desenha o Rasen-Shuriken crescendo na mão de Naruto e do clone
      const chargeRatio = Math.min(1, fighter.narutoChargeTimer / 2.5);
      const orbScale = 0.7 + chargeRatio * 1.0;
      const hx = fighter.position.x + fighter.facing * 28;
      const hy = fighter.position.y - 70;

      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(Date.now() * 0.04);
      ctx.fillStyle = '#bae6fd';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#0ea5e9';
      ctx.shadowBlur = 24 * orbScale;

      ctx.beginPath();
      ctx.arc(0, 0, 16 * orbScale, 0, Math.PI * 2);
      ctx.fill();

      // 4 lâminas de vento rotativas
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(26 * orbScale, 6 * orbScale);
        ctx.lineTo(36 * orbScale, 0);
        ctx.lineTo(26 * orbScale, -6 * orbScale);
        ctx.closePath();
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3. Renderiza o Fuuton Rasen-Shuriken voando
    if (fighter.narutoRasenShuriken && fighter.narutoRasenShuriken.active) {
      const rs = fighter.narutoRasenShuriken;
      const s = rs.scale || 1.0;

      ctx.save();
      ctx.translate(rs.x, rs.y);
      ctx.rotate(Date.now() * 0.035 * Math.sign(rs.vx));
      ctx.fillStyle = '#f0f9ff';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3.5 * s;
      ctx.shadowColor = '#0ea5e9';
      ctx.shadowBlur = 30 * s;

      // Orbe central de puro chakra rotativo
      ctx.beginPath();
      ctx.arc(0, 0, 18 * s, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2 * s;
      ctx.stroke();

      // 4 Lâminas aerodinâmicas de Fuuton gigantes
      ctx.strokeStyle = '#38bdf8';
      ctx.fillStyle = 'rgba(186, 230, 253, 0.4)';
      ctx.lineWidth = 3 * s;
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(34 * s, 8 * s);
        ctx.lineTo(50 * s, 0);
        ctx.lineTo(34 * s, -8 * s);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}

export const narutoBehavior = new NarutoBehavior();
