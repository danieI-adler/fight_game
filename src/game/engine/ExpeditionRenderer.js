import { FIGHTER_STATE } from './Fighter';

/**
 * Renderizador 2D Hiper-Detalhado e Fiel aos Modelos Oficiais de Clair Obscur: Expedition 33
 * - Gustave: Cabelos castanhos cacheados, bigode, braço mecânico de latão com pistões e núcleo elétrico, sobretudo com filigrana dourada e lâmina Lanceram nas costas.
 * - Maelle: Rabo de cavalo ruivo/castanho, meia-máscara de porcelana com filigrana azul/ouro, gibão de duelista com leque dourado e florete de esgrima com copo ornate.
 * - Lune: Cabelos negros ondulados, tatuagens douradas sob o olho, braçadeira com anéis dourados e glifo "33", orbes astrais e constelações reluzentes.
 * - Sciel: Cabelos curtos castanhos com franja, top cropped com sol dourado no peito, fitas de ouro esvoaçantes e cimitarras duplas curvas.
 * - Renoir: Cavalheiro com barba e cabelos grisalhos, terno de gala Belle Époque com sobretudo de pele sobre os ombros e bengala pesada de ferro.
 * - Verso: Cabelos negros com mecha branca frontal marcante, sobretudo escuro com gola grossa de pele e sabre dourado com rastro de névoa escura.
 * - Monoco: Colosso Gestral corcunda com juba de pelos brancos, monólito gravado com runas como rosto, cajado com sino de bronze e punhos de pedra encadeados.
 * - Esquie: Máscara veneziana, crista emplumada, asas iridescentes em esmeralda e garras astrais.
 * - La Peintresse: Máscara com auréola de raios solares em ouro, vestido monumental barroco e pincel titânico derramando tinta dourada e negra.
 */
export class ExpeditionRenderer {
  static draw(ctx, fighter, showHitboxes = false) {
    const x = fighter.position.x;
    const y = fighter.position.y;
    const f = fighter.facing;
    const p = fighter.pose;
    const char = fighter.charData;
    const vis = char.visual || {};

    ctx.save();

    // 1. Sombra Suave
    const shadowDist = Math.max(0, fighter.groundY - y);
    const shadowScale = Math.max(0.3, 1 - shadowDist / 300);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, fighter.groundY, (vis.isMonoco ? 52 : (vis.isPaintress ? 46 : 38)) * shadowScale, 10 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fill();
    ctx.restore();

    // 2. Aura de Energia por Nível de Poder (Gustave: <33% sem aura, 33-66% Amarela, 66-100% Roxa, 100%/Ult Vermelha com Raios)
    this.drawEnergyAura(ctx, x, y, p, char, vis, fighter.stateTime, fighter.energy || 0, fighter.state);

    // SE FOR RELÂMPAGO MCQUEEN: DESENHAR COMO CARRO DA COPA PISTÃO
    const isMcQueen = (char.name || '').toLowerCase().includes('mcqueen') || vis.isVehicle || vis.isMcQueen;
    if (isMcQueen) {
      this.drawMcQueenCar(ctx, x, y, f, fighter);
      ctx.restore();

      if (showHitboxes) {
        ctx.save();
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 1.5;
        for (const box of fighter.getHurtboxes()) {
          ctx.strokeRect(box.x, box.y, box.width, box.height);
        }
        if (fighter.activeHitbox) {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(fighter.activeHitbox.x, fighter.activeHitbox.y, fighter.activeHitbox.width, fighter.activeHitbox.height);
        }
        ctx.restore();
      }
      return;
    }

    // SE FOR HULK TRANSFORMADO: RENDERIZAR O VERDADEIRO HULK (GIGANTE, MUSCULOSO, PELE VERDE, BERMUDA ROXA RASGADA, CABELO NEGRO BAGUNÇADO)
    if (fighter.isHulk) {
      this.drawTrueHulk(ctx, x, y, f, p, fighter);
      ctx.restore();

      if (showHitboxes) {
        ctx.save();
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 1.5;
        for (const box of fighter.getHurtboxes()) {
          ctx.strokeRect(box.x, box.y, box.width, box.height);
        }
        if (fighter.activeHitbox) {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(fighter.activeHitbox.x, fighter.activeHitbox.y, fighter.activeHitbox.width, fighter.activeHitbox.height);
        }
        ctx.restore();
      }
      return;
    }

    // 3. Acessórios Traseiros (Lanceram de Gustave, Cajado com Sino de Monoco, Capa de Renoir, Asas de Esquie)
    this.drawBackAccessories(ctx, x, y, f, p, vis, fighter.stateTime);

    // 4. Manto / Cauda do Sobretudo / Vestido Barroco
    this.drawCoatTails(ctx, x, y, f, p, vis, fighter.velocity.x, fighter.stateTime);

    // 5. Pernas & Botas Detalhadas
    this.drawLeg(ctx, x, y, p.pelvis, p.leftKnee, p.leftFoot, vis, false, f);
    this.drawLeg(ctx, x, y, p.pelvis, p.rightKnee, p.rightFoot, vis, true, f);

    // 6. Tronco & Peitoral Temático (Com bordados dourados oficiais)
    this.drawTorso(ctx, x, y, f, p, vis, fighter.stateTime);

    // 7. Braço Traseiro (com arma se empunhada)
    this.drawArm(ctx, x, y, p.chest, p.leftShoulder, p.leftElbow, p.leftHand, vis, false, f, fighter.stateTime, fighter.energy || 0, fighter.state);

    // 8. Cabeça, Cabelo, Máscaras e Traços Oficiais
    this.drawHead(ctx, x, y, f, p, char, vis, fighter.stateTime);

    // 9. Braço Frontal & Arma Principal (Braço mecânico, Florete, Orbes, Cimitarras, Bengala, Sabre, Pincel)
    this.drawArm(ctx, x, y, p.chest, p.rightShoulder, p.rightElbow, p.rightHand, vis, true, f, fighter.stateTime, fighter.energy || 0, fighter.state);

    // 10. Rastros de Pincelada / Corte de Espada
    this.drawAttackTrail(ctx, fighter, x, y, f, p, vis);

    ctx.restore();

    // Debug Hitboxes
    if (showHitboxes) {
      ctx.save();
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1.5;
      for (const box of fighter.getHurtboxes()) {
        ctx.strokeRect(box.x, box.y, box.width, box.height);
      }
      if (fighter.activeHitbox) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(fighter.activeHitbox.x, fighter.activeHitbox.y, fighter.activeHitbox.width, fighter.activeHitbox.height);
      }
      ctx.restore();
    }
  }

  static drawEnergyAura(ctx, x, y, p, char, vis, time, energy = 0, state = '') {
    const isGustave = Number(char.id) === 101 || Number(char.id) === 1 || (char.name || '').toLowerCase().includes('gustave') || vis.hasMechanicalArm;
    let auraColor = null;
    let auraGlow = null;
    let isRedLightning = false;

    if (isGustave) {
      if (energy >= 100 || state === FIGHTER_STATE.SUPER_MOVE) {
        auraColor = '#ef4444'; // Vermelho com raios
        auraGlow = 'rgba(239, 68, 68, 0.95)';
        isRedLightning = true;
      } else if (energy >= 66) {
        auraColor = '#a855f7'; // Roxo arcano
        auraGlow = 'rgba(168, 85, 247, 0.9)';
      } else if (energy >= 33) {
        auraColor = '#eab308'; // Amarelo dourado
        auraGlow = 'rgba(234, 179, 8, 0.85)';
      }
    } else {
      if (energy >= 100 || state === FIGHTER_STATE.SUPER_MOVE) {
        auraColor = char.energyColor || '#ffffff';
        auraGlow = char.glowColor || '#d4af37';
      }
    }

    if (!auraColor) return;

    ctx.save();
    ctx.shadowColor = auraGlow;
    ctx.shadowBlur = isRedLightning ? 30 : 20;
    ctx.strokeStyle = auraColor;
    ctx.lineWidth = isRedLightning ? 3.5 : 2.5;
    ctx.globalAlpha = 0.65 + 0.3 * Math.sin(time * 12);
    ctx.beginPath();
    ctx.arc(x + p.chest.x, y + p.chest.y, vis.isMonoco ? 65 : 52, 0, Math.PI * 2);
    ctx.stroke();

    // Glifos rotativos
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(x + p.chest.x, y + p.chest.y, vis.isMonoco ? 78 : 64, time * 2.5, time * 2.5 + Math.PI * 2);
    ctx.stroke();

    // Raios vermelhos estalando para 100% de energia
    if (isRedLightning) {
      ctx.setLineDash([]);
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const ang = time * 7 + (i * Math.PI) / 2;
        const sx = x + p.chest.x + Math.cos(ang) * 45;
        const sy = y + p.chest.y + Math.sin(ang) * 45;
        const ex = sx + (Math.random() - 0.5) * 40;
        const ey = sy + (Math.random() - 0.5) * 40;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  static drawBackAccessories(ctx, x, y, f, p, vis, time) {
    const cx = x + p.chest.x;
    const cy = y + p.chest.y;

    // 1. Gustave: Lâmina Lanceram nas costas (oculta se estiver empunhada)
    if (vis.hasLanceramBlade && !vis.isSwordDrawn) {
      ctx.save();
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(cx - 8 * f, cy + 18);
      ctx.lineTo(cx - 24 * f, cy - 32);
      ctx.stroke();

      // Guarda e bainha
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cx - 12 * f, cy + 8);
      ctx.lineTo(cx - 20 * f, cy - 18);
      ctx.stroke();

      // Pomo dourado
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(cx - 25 * f, cy - 34, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. Monoco: Cajado de madeira com sino de bronze pendurado
    if (vis.hasStaffBell) {
      ctx.save();
      const staffX = cx - 18 * f;
      const staffY = cy - 25;

      // Haste de madeira retorcida
      ctx.strokeStyle = '#5c4033';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(staffX, staffY + 50);
      ctx.quadraticCurveTo(staffX - 6 * f, staffY + 10, staffX - 2 * f, staffY);
      ctx.stroke();

      // Sino de bronze com corda
      const bellSwing = Math.sin(time * 5) * 3;
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(staffX - 2 * f, staffY);
      ctx.lineTo(staffX - 8 * f + bellSwing, staffY + 12);
      ctx.stroke();

      // Sino
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(staffX - 8 * f + bellSwing, staffY + 16, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d4af37';
      ctx.stroke();
      ctx.restore();
    }

    // 3. Esquie: Asas de Penas Iridescentes
    if (vis.isEsquie) {
      ctx.save();
      const wingFlap = Math.sin(time * 8) * 8;
      ctx.fillStyle = '#065f46';
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1.5;

      // Asa Esquerda
      ctx.beginPath();
      ctx.moveTo(cx - 4 * f, cy - 6);
      ctx.quadraticCurveTo(cx - 45 * f, cy - 35 + wingFlap, cx - 35 * f, cy + 10);
      ctx.quadraticCurveTo(cx - 15 * f, cy + 5, cx - 4 * f, cy + 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  static drawCoatTails(ctx, x, y, f, p, vis, vx, time) {
    ctx.save();
    const px = x + p.pelvis.x;
    const py = y + p.pelvis.y;
    const sway = -f * (vx * 2.8) + Math.sin(time * 6) * 4;

    if (vis.coatType === 'baroque_gown') {
      // Vestido Barroco Monumental de La Peintresse
      ctx.fillStyle = '#09090b';
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px - 14 * f, py);
      ctx.quadraticCurveTo(px - 32 * f + sway, py + 30, px - 38 * f + sway, py + 55);
      ctx.lineTo(px + 32 * f, py + 55);
      ctx.quadraticCurveTo(px + 24 * f, py + 30, px + 14 * f, py);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Bordados dourados da saia
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px - 28 * f + sway, py + 48);
      ctx.lineTo(px + 24 * f, py + 48);
      ctx.stroke();
    } else if (vis.coatType === 'stone_shell') {
      // Casco pétreo robusto de Monoco
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(px - 6 * f, py + 6, 22, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      // Sobretudo Belle Époque clássico
      const widthFactor = vis.isMonoco ? 1.5 : 1.0;
      const tailX = px - (18 * widthFactor) * f + sway;
      const tailY = py + 38;

      ctx.beginPath();
      ctx.moveTo(px - 10 * widthFactor * f, py);
      ctx.quadraticCurveTo(px - 15 * widthFactor * f + sway * 0.5, py + 20, tailX, tailY);
      ctx.lineTo(tailX + 14 * widthFactor * f, tailY);
      ctx.quadraticCurveTo(px - 2 * f, py + 20, px + 8 * widthFactor * f, py);
      ctx.closePath();

      ctx.fillStyle = vis.coatColor || '#0b1626';
      ctx.fill();
      ctx.strokeStyle = vis.accentColor || '#d4af37';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Fitas douradas esvoaçantes de Sciel
    if (vis.hasGoldRibbons) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, py + 4);
      ctx.quadraticCurveTo(px - 25 * f + sway, py + 18, px - 35 * f + sway * 1.5, py + 36);
      ctx.stroke();
    }

    ctx.restore();
  }

  static drawTorso(ctx, x, y, f, p, vis, time) {
    ctx.save();
    const cx = x + p.chest.x;
    const cy = y + p.chest.y;
    const px = x + p.pelvis.x;
    const py = y + p.pelvis.y;
    const w = vis.isMonoco ? 22 : 14;

    // Formato do Tronco
    ctx.beginPath();
    ctx.moveTo(cx - w * f, cy - 8);
    ctx.lineTo(cx + w * f, cy - 8);
    ctx.lineTo(px + (w - 2) * f, py);
    ctx.lineTo(px - (w - 2) * f, py);
    ctx.closePath();
    ctx.fillStyle = vis.vestColor || '#1a2332';
    ctx.fill();
    ctx.strokeStyle = vis.accentColor || '#d4af37';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Detalhes Específicos do Personagem:
    if (vis.hasSunburstChest) {
      // Sciel: Bordado de sol dourado no peitoral
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx + 2 * f, cy - 1, 5, 0, Math.PI * 2);
      ctx.stroke();
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        ctx.beginPath();
        ctx.moveTo(cx + 2 * f + Math.cos(a) * 5, cy - 1 + Math.sin(a) * 5);
        ctx.lineTo(cx + 2 * f + Math.cos(a) * 9, cy - 1 + Math.sin(a) * 9);
        ctx.stroke();
      }
    } else if (vis.hasFurCollar) {
      // Verso: Gola grossa de pele cinzenta
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 8, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (vis.coatType === 'draped_overcoat') {
      // Renoir: Sobretudo nos ombros com gravata
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 2, cy - 8, 4, 6);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 1, cy - 2, 2, 7);
    } else {
      // Botões e fivelas de latão Belle Époque
      ctx.fillStyle = vis.accentColor || '#d4af37';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(cx + 2 * f, cy - 2 + i * 6, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  static drawLeg(ctx, x, y, pelvis, knee, foot, vis, isFront, f) {
    ctx.save();
    const px = x + pelvis.x;
    const py = y + pelvis.y;
    const kx = x + knee.x;
    const ky = y + knee.y;
    const fx = x + foot.x;
    const fy = y + foot.y;

    ctx.globalAlpha = isFront ? 1.0 : 0.8;
    const w = vis.isMonoco ? 8 : 5;

    // Coxa
    ctx.beginPath();
    ctx.moveTo(px - w, py);
    ctx.lineTo(px + w, py);
    ctx.lineTo(kx + w - 1, ky);
    ctx.lineTo(kx - w + 1, ky);
    ctx.closePath();
    ctx.fillStyle = vis.pantColor || '#0f172a';
    ctx.fill();

    // Bota / Greva
    ctx.beginPath();
    ctx.moveTo(kx - w, ky);
    ctx.lineTo(kx + w, ky);
    ctx.lineTo(fx + w + 1, fy - 2);
    ctx.lineTo(fx - w, fy);
    ctx.closePath();
    ctx.fillStyle = vis.bootColor || '#1c1917';
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  static drawArm(ctx, x, y, chest, shoulder, elbow, hand, vis, isFront, f, time, energy = 0, state = '') {
    ctx.save();
    const sx = x + shoulder.x;
    const sy = y + shoulder.y;
    const ex = x + elbow.x;
    const ey = y + elbow.y;
    const hx = x + hand.x;
    const hy = y + hand.y;

    ctx.globalAlpha = isFront ? 1.0 : 0.8;
    const isMechArm = isFront && vis.hasMechanicalArm;
    const isSuper = state === FIGHTER_STATE.SUPER_MOVE;

    // Cores dinâmicas da Manopla de Gustave por Energia
    let gauntletGlow = null;
    let coreColor = '#38bdf8'; // < 33%: Azul sutil
    let coreSize = 2.5;

    if (isMechArm) {
      if (energy >= 100 || isSuper) {
        coreColor = '#ef4444'; // 100%: Vermelho de raios
        gauntletGlow = '#ff0033';
        coreSize = 5;
      } else if (energy >= 66) {
        coreColor = '#a855f7'; // 66-100%: Roxo
        gauntletGlow = '#c084fc';
        coreSize = 3.8;
      } else if (energy >= 33) {
        coreColor = '#facc15'; // 33-66%: Amarelo
        gauntletGlow = '#eab308';
        coreSize = 3.2;
      }
    }

    // 1. Ombro
    ctx.beginPath();
    ctx.moveTo(sx - 5, sy - 3);
    ctx.lineTo(sx + 5, sy - 3);
    ctx.lineTo(ex + 4, ey);
    ctx.lineTo(ex - 4, ey);
    ctx.closePath();
    ctx.fillStyle = isMechArm ? '#d4af37' : (vis.coatColor || '#0b1626');
    ctx.fill();
    if (isMechArm) {
      // Válvula de vapor no ombro de Gustave
      ctx.strokeStyle = coreColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 2. Antebraço / Manopla
    ctx.beginPath();
    ctx.moveTo(ex - 4, ey);
    ctx.lineTo(ex + 4, ey);
    ctx.lineTo(hx + 5, hy);
    ctx.lineTo(hx - 5, hy);
    ctx.closePath();
    ctx.fillStyle = isMechArm ? '#b45309' : (vis.gloveColor || '#1e293b');
    ctx.fill();
    ctx.strokeStyle = isMechArm ? (gauntletGlow || '#fbbf24') : (vis.accentColor || '#d4af37');
    ctx.lineWidth = isMechArm ? 2.5 : 1.2;
    if (gauntletGlow) {
      ctx.shadowColor = gauntletGlow;
      ctx.shadowBlur = energy >= 100 ? 22 : 12;
    }
    ctx.stroke();

    // Braçadeira de anéis dourados com o "33" de Lune
    if (vis.hasArmCoils && isFront) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(sx - 3 + i * 3, sy + 3 + i * 4);
        ctx.lineTo(sx + 5 + i * 3, sy + 3 + i * 4);
        ctx.stroke();
      }
    }

    // 3. Mão / Punho da Manopla
    ctx.beginPath();
    ctx.arc(hx, hy, isMechArm ? (isSuper ? 8 : 6.5) : 5, 0, Math.PI * 2);
    ctx.fillStyle = isMechArm ? (isSuper ? '#ef4444' : '#d4af37') : (vis.gloveColor || '#1e293b');
    ctx.fill();

    // Núcleo elétrico energizado no punho de Gustave
    if (isMechArm) {
      ctx.save();
      ctx.shadowColor = gauntletGlow || '#38bdf8';
      ctx.shadowBlur = energy >= 100 ? 25 : 10;
      ctx.fillStyle = coreColor;
      ctx.beginPath();
      ctx.arc(hx, hy, coreSize, 0, Math.PI * 2);
      ctx.fill();

      // Ponto superaquecido branco no centro do punho
      if (energy >= 100 || isSuper) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(hx, hy, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Raios saltando do punho
        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 1.8;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(hx, hy);
          ctx.lineTo(hx + (Math.random() - 0.5) * 35, hy + (Math.random() - 0.5) * 35);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // 4. Armas Oficiais
    if (isFront) {
      this.drawWeapon(ctx, hx, hy, f, vis, time, state);
    }

    ctx.restore();
  }

  static drawWeapon(ctx, hx, hy, f, vis, time, state = '') {
    ctx.save();

    if (vis.weaponType === 'rapier') {
      // Florete elegante de Maelle
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + 42 * f, hy - 4);
      ctx.stroke();

      // Guarda de copo dourada
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(hx + 4 * f, hy, 6, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
    } else if (vis.weaponType === 'dual_curved_blades') {
      // Cetro/Foice dupla de Sciel — haste central com lâminas curvas em lados opostos
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 6;

      // Haste central do cetro
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(hx - 20 * f, hy + 16);
      ctx.lineTo(hx + 24 * f, hy - 14);
      ctx.stroke();

      // Lâmina superior (ponta curva para cima, lado da frente)
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(hx + 20 * f, hy - 12);
      ctx.quadraticCurveTo(hx + 34 * f, hy - 30, hx + 28 * f, hy - 38);
      ctx.stroke();

      // Lâmina inferior (ponta curva para baixo, lado de trás)
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(hx - 16 * f, hy + 14);
      ctx.quadraticCurveTo(hx - 30 * f, hy + 30, hx - 24 * f, hy + 38);
      ctx.stroke();

      ctx.shadowBlur = 0;
    } else if (vis.weaponType === 'gold_saber') {
      // Sabre dourado reluzente de Verso
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + 38 * f, hy - 8);
      ctx.stroke();
    } else if (vis.weaponType === 'gentleman_cane') {
      // Bengala de ferro nobre de Renoir
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      if (state === FIGHTER_STATE.SUPER_MOVE) {
        if (time < 1.2) {
          // Erguida apontando para cima na evocação da Flor Negra
          ctx.lineTo(hx + 4 * f, hy - 45);
        } else {
          // Apontada para frente/baixo no esmagamento
          ctx.lineTo(hx + 38 * f, hy + 18);
        }
      } else {
        ctx.lineTo(hx + 6 * f, hy + 38);
      }
      ctx.stroke();

      // Pomo prateado
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(hx, hy - 2, 4.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (vis.weaponType === 'astral_orbs') {
      // Orbes astrais e runas cósmicas de Lune
      const orbAngle = time * 4;
      for (let i = 0; i < 3; i++) {
        const ang = orbAngle + (i * Math.PI * 2) / 3;
        const ox = hx + Math.cos(ang) * 16;
        const oy = hy + Math.sin(ang) * 16;

        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#e9d5ff';
        ctx.beginPath();
        ctx.arc(ox, oy, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (vis.weaponType === 'colossal_brush') {
      // Pincel monumental de La Peintresse
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      ctx.moveTo(hx - 18 * f, hy + 22);
      ctx.lineTo(hx + 48 * f, hy - 38);
      ctx.stroke();

      // Cerdas com tinta dourada e preta
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(hx + 52 * f, hy - 41, 10, 6, 0.4 * f, 0, Math.PI * 2);
      ctx.fill();

      // Gotas de tinta caindo
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
    } else if (vis.isSwordDrawn || vis.hasLanceramBlade) {
      if (vis.isSwordDrawn) {
        // Gustave empunhando a lâmina Lanceram na mão
        ctx.save();
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(hx + 46 * f, hy - 12);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(hx + 4 * f, hy - 1);
        ctx.lineTo(hx + 44 * f, hy - 11);
        ctx.stroke();

        // Guarda e pomo
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.arc(hx, hy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    } else if (vis.weaponType === 'sith_lightsaber') {
      // Sabre de Luz Vermelho de Darth Vader
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 18;
      // Empunhadura
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + 12 * f, hy - 8);
      ctx.stroke();
      // Lâmina de plasma escarlate com núcleo branco
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(hx + 12 * f, hy - 8);
      ctx.lineTo(hx + 50 * f, hy - 32);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (vis.weaponType === 'batarang') {
      // Batarangue empunhado por Batman
      ctx.fillStyle = '#09090b';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(hx + 8 * f, hy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (vis.weaponType === 'pirate_saber') {
      // Sabre de pirata curvo de Jack Sparrow
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.quadraticCurveTo(hx + 28 * f, hy - 20, hx + 36 * f, hy - 14);
      ctx.stroke();
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(hx + 4 * f, hy, 5, 0, Math.PI);
      ctx.stroke();
    } else if (vis.weaponType === 'tactical_rifle') {
      // Fuzil FAL tático do Capitão Nascimento (BOPE)
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(hx - 10 * f, hy + 4);
      ctx.lineTo(hx + 28 * f, hy - 4);
      ctx.stroke();
      // Cano e mira
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hx + 28 * f, hy - 4);
      ctx.lineTo(hx + 38 * f, hy - 4);
      ctx.stroke();
      // Carregador curvado
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(hx + 10 * f, hy);
      ctx.lineTo(hx + 8 * f, hy + 10);
      ctx.stroke();
    } else if (vis.weaponType === 'heavy_frying_pan') {
      // Frigideira de Ferro fundido de Rapunzel
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 3;
      // Cabo
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + 14 * f, hy - 8);
      ctx.stroke();
      // Corpo redondo da frigideira
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.arc(hx + 24 * f, hy - 14, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#52525b';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (vis.weaponType === 'vibranium_shield') {
      // Escudo de Vibranium acoplado no antebraço do Capitão América
      ctx.save();
      ctx.translate(hx + 8 * f, hy);
      // Vermelho externo
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
      // Branco
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(0, 0, 13.5, 0, Math.PI * 2);
      ctx.fill();
      // Vermelho
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(0, 0, 9.5, 0, Math.PI * 2);
      ctx.fill();
      // Azul centro
      ctx.fillStyle = '#1d4ed8';
      ctx.beginPath();
      ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
      ctx.fill();
      // Estrela
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (vis.weaponType === 'kunai_chakra') {
      // Kunai com chakra azul de Naruto
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + 18 * f, hy - 8);
      ctx.stroke();
      // Lâmina afiada
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(hx + 18 * f, hy - 8);
      ctx.lineTo(hx + 28 * f, hy - 12);
      ctx.lineTo(hx + 22 * f, hy - 4);
      ctx.closePath();
      ctx.fill();
      // Brilho de chakra
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (vis.weaponType === 'kusanagi_sword') {
      // Espada Kusanagi de Sasuke com faíscas de Chidori
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + 42 * f, hy - 14);
      ctx.stroke();

      // Bainha/cabo preto minimalista
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(hx - 8 * f, hy + 3);
      ctx.lineTo(hx, hy);
      ctx.stroke();

      // Brilho elétrico
      ctx.shadowColor = '#818cf8';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else if (vis.weaponType === 'golden_spatula') {
      // Espátula Dourada do Bob Esponja
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + 16 * f, hy - 10);
      ctx.stroke();

      // Palheta da espátula dourada
      ctx.fillStyle = '#facc15';
      ctx.fillRect(hx + 16 * f, hy - 16, 12 * f, 12);
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(hx + 16 * f, hy - 16, 12 * f, 12);
    } else if (vis.weaponType === 'repulsor_gauntlets') {
      // Manoplas Repulsoras Stark do Homem de Ferro
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(hx - 4 * f, hy - 4, 10 * f, 8);
      // Núcleo repulsor na palma
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(hx + 4 * f, hy, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(hx + 4 * f, hy, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (vis.weaponType === 'web_shooters') {
      // Lançador de Teia no pulso do Homem-Aranha
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(hx - 3 * f, hy - 3, 8 * f, 6);
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(hx + 2 * f, hy, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(hx + 4 * f, hy, 1, 0, Math.PI * 2);
      ctx.fill();
    } else if (vis.weaponType === 'spotted_egg') {
      // Ovo do Yoshi empunhado
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(hx + 4 * f, hy, 7, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(hx + 2 * f, hy - 2, 2.5, 0, Math.PI * 2);
      ctx.arc(hx + 6 * f, hy + 3, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (vis.weaponType === 'lightning_tail') {
      // Cauda de raio amarela do Pikachu
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.moveTo(hx - 8 * f, hy + 8);
      ctx.lineTo(hx - 14 * f, hy + 2);
      ctx.lineTo(hx - 18 * f, hy + 6);
      ctx.lineTo(hx - 26 * f, hy - 4);
      ctx.lineTo(hx - 22 * f, hy - 8);
      ctx.closePath();
      ctx.fill();
      // Base marrom
      ctx.fillStyle = '#78350f';
      ctx.fillRect(hx - 10 * f, hy + 6, 4 * f, 4);
    } else if (vis.weaponType === 'golden_ring') {
      // Anel Dourado do Sonic
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(hx + 6 * f, hy, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else if (vis.weaponType === 'venom_injector') {
      // Braçadeira com tubos de Venom verde fluorescente do Bane
      ctx.fillStyle = '#18181b';
      ctx.fillRect(hx - 4 * f, hy - 5, 12 * f, 10);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(hx - 2 * f, hy - 4);
      ctx.lineTo(hx + 6 * f, hy + 4);
      ctx.stroke();
    } else if (vis.weaponType === 'bat_swarm') {
      // Aura de névoa e morcegos de Drácula na mão
      ctx.fillStyle = '#450a0a';
      ctx.beginPath();
      ctx.arc(hx + 4 * f, hy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(hx + 6 * f, hy - 3, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (vis.weaponType === 'dual_elucidator_dark_repulser') {
      // Espada Dupla de Kirito: Elucidator (preta) e Dark Repulser (azul-esverdeada)
      // Elucidator (mão principal)
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + 42 * f, hy - 16);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Dark Repulser (mão secundária/cruzada)
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(hx - 4 * f, hy + 2);
      ctx.lineTo(hx + 36 * f, hy + 16);
      ctx.stroke();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    } else if (vis.weaponType === 'dmt_blades') {
      // Duas Lâminas de Aço Ultra-Duro com empunhaduras de gatilho do DMT de Eren
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + 38 * f, hy - 12);
      ctx.stroke();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      // Gatilho do cabo
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(hx - 6 * f, hy - 2, 6 * f, 4);
    } else if (vis.weaponType === 'nunchaku') {
      // Nunchaku de madeira e corrente de Bruce Lee
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + 18 * f, hy - 14);
      ctx.stroke();
      // Corrente e bastão secundário pendente
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(hx + 18 * f, hy - 14);
      ctx.lineTo(hx + 24 * f, hy - 12);
      ctx.stroke();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(hx + 24 * f, hy - 12);
      ctx.lineTo(hx + 34 * f, hy + 2);
      ctx.stroke();
    } else if (vis.weaponType === 'ki_blast') {
      // Esfera de Ki de Goku na palma da mão
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(hx + 6 * f, hy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else if (vis.weaponType === 'green_lightsaber') {
      // Sabre de Luz Verde de Yoda
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + 10 * f, hy - 8);
      ctx.stroke();
      // Lâmina de plasma verde esmeralda
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(hx + 10 * f, hy - 8);
      ctx.lineTo(hx + 36 * f, hy - 28);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (vis.weaponType === 'blaster_dl44') {
      // Pistola Blaster DL-44 de Han Solo
      ctx.fillStyle = '#18181b';
      ctx.fillRect(hx - 2 * f, hy - 3, 14 * f, 6);
      ctx.fillRect(hx + 8 * f, hy - 5, 8 * f, 3); // Mira telescópica montada
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(hx + 12 * f, hy - 1, 4 * f, 2); // Ponta do cano
    } else if (vis.weaponType === 'fireball_flower') {
      // Flor de Fogo / Chama na mão de Mario
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(hx + 4 * f, hy - 2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(hx + 4 * f, hy - 2, 3.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (vis.weaponType === 'adamantium_claws') {
      // 3 Garras de Adamantium retráteis de Wolverine
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 2;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(hx + 2 * f, hy + i * 3);
        ctx.lineTo(hx + 24 * f, hy + i * 4 - 4);
        ctx.stroke();
      }
    } else if (vis.weaponType === 'blades_of_chaos') {
      // Lâminas do Caos de Kratos com correntes
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(hx - 6 * f, hy + 4);
      ctx.lineTo(hx, hy);
      ctx.stroke();
      // Lâmina curvada com entalhe flamejante
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + 24 * f, hy - 14);
      ctx.lineTo(hx + 30 * f, hy - 4);
      ctx.lineTo(hx + 18 * f, hy + 4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (vis.weaponType === 'symbiote_tendrils') {
      // Gavinhas negras e garras de Venom
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 3;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(hx, hy + i * 4);
        ctx.lineTo(hx + 22 * f, hy + i * 6 - 2);
        ctx.stroke();
      }
    } else if (vis.weaponType === 'symbiote_scythes') {
      // Braço em foice rubra de Carnificina
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(hx, hy - 4);
      ctx.lineTo(hx + 30 * f, hy - 18);
      ctx.lineTo(hx + 22 * f, hy + 8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (vis.weaponType === 'laser_eyes') {
      // Resplendor rubro nas mãos / energia de Homelander
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(hx + 4 * f, hy, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  static drawHead(ctx, x, y, f, p, char, vis, time) {
    ctx.save();
    const hx = x + p.head.x;
    const hy = y + p.head.y;

    // 1. Pele Natural
    ctx.beginPath();
    ctx.ellipse(hx, hy, 10.5, 12.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = vis.isMonoco ? '#cbd5e1' : '#e2b998';
    ctx.fill();

    // 2. Monoco: Monólito Gravado no Rosto
    if (vis.hasRuneFaceSlab) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(hx - 3, hy - 10, 6, 18);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(hx - 3, hy - 10, 6, 18);
      // Runas vermelhas brilhantes
      ctx.fillStyle = '#f87171';
      ctx.fillRect(hx - 1, hy - 6, 2, 2);
      ctx.fillRect(hx - 1, hy - 1, 2, 3);
      ctx.fillRect(hx - 1, hy + 4, 2, 2);
    }

    // 3. Meia-Máscara de Porcelana de Maelle
    if (vis.maskStyle === 'porcelain_half') {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(hx + 3 * f, hy - 1, 6, -Math.PI / 2, Math.PI / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 4. Auréola Solar de La Peintresse
    if (vis.maskStyle === 'full_porcelain_halo') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(hx, hy, 11, 13, 0, 0, Math.PI * 2);
      ctx.fill();

      // Raios de ouro da auréola
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      for (let ang = -Math.PI * 0.8; ang <= Math.PI * 0.8; ang += Math.PI / 6) {
        ctx.beginPath();
        ctx.moveTo(hx + Math.cos(ang) * 14, hy + Math.sin(ang) * 14);
        ctx.lineTo(hx + Math.cos(ang) * 22, hy + Math.sin(ang) * 22);
        ctx.stroke();
      }
    }

    // 5. Cabelos Oficiais
    ctx.fillStyle = vis.hairColor || '#271810';
    if (vis.hairStyle === 'high_ponytail') {
      // Maelle: Rabo de cavalo ruivo
      ctx.beginPath();
      ctx.ellipse(hx, hy - 8, 11, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      // Rabo de cavalo caindo para trás
      ctx.beginPath();
      ctx.moveTo(hx - 8 * f, hy - 6);
      ctx.quadraticCurveTo(hx - 22 * f, hy + 8, hx - 18 * f, hy + 22);
      ctx.lineTo(hx - 14 * f, hy + 18);
      ctx.closePath();
      ctx.fill();
    } else if (vis.hairStyle === 'white_streak_fringe') {
      // Verso: Cabelo preto com mecha branca
      ctx.beginPath();
      ctx.ellipse(hx, hy - 7, 12, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      // Mecha branca frontal
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(hx + 3 * f, hy - 12);
      ctx.lineTo(hx + 8 * f, hy - 4);
      ctx.lineTo(hx + 5 * f, hy - 2);
      ctx.closePath();
      ctx.fill();
    } else if (vis.hairStyle === 'golden_braid' || vis.headgear === 'golden_braid') {
      // Rapunzel: Trança dourada mágica gigante descendo pelas costas
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.ellipse(hx, hy - 7, 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Trança longa esvoaçante
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(hx - 6 * f, hy - 2);
      ctx.quadraticCurveTo(hx - 24 * f, hy + 20, hx - 16 * f, hy + 50);
      ctx.quadraticCurveTo(hx - 8 * f, hy + 75, hx - 20 * f, hy + 95);
      ctx.stroke();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else if (vis.hairStyle === 'spiky_blonde' || vis.headgear === 'ninja_headband') {
      // Naruto: Cabelo loiro espetado e bandana de Konoha
      ctx.fillStyle = '#eab308';
      for (let i = 0; i < 5; i++) {
        const ang = -Math.PI * 0.8 + i * 0.4;
        ctx.beginPath();
        ctx.moveTo(hx + Math.cos(ang) * 9, hy + Math.sin(ang) * 9);
        ctx.lineTo(hx + Math.cos(ang) * 18, hy + Math.sin(ang) * 18 - 4);
        ctx.lineTo(hx + Math.cos(ang + 0.3) * 10, hy + Math.sin(ang + 0.3) * 10);
        ctx.fill();
      }
      // Bandana azul de Konoha com placa de metal
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(hx - 9, hy - 8, 18, 5);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(hx - 5, hy - 8, 10, 4);
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(hx, hy - 6, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (vis.headgear === 'bope_beret') {
      // Capitão Nascimento: Boina preta tática do BOPE
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.ellipse(hx, hy - 8, 13, 5, -0.2 * f, 0, Math.PI * 2);
      ctx.fill();
      // Brasão / Faca na Caveira no lado da boina
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(hx + 5 * f, hy - 8, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (vis.headgear === 'avenger_helmet') {
      // Capitão América: Capacete azul tático com 'A' branco
      ctx.fillStyle = '#1d4ed8';
      ctx.beginPath();
      ctx.ellipse(hx, hy - 4, 11.5, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      // Letra 'A' branca na testa
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('A', hx + 2 * f, hy - 4);
    } else if (vis.headgear === 'spiky_sasuke_hair' || vis.hairStyle === 'spiky_black') {
      // Sasuke Uchiha: Cabelo preto espetado para trás e franjas laterais
      ctx.fillStyle = '#1e1b4b';
      for (let i = 0; i < 6; i++) {
        const ang = -Math.PI * 0.9 + i * 0.35;
        ctx.beginPath();
        ctx.moveTo(hx + Math.cos(ang) * 9, hy + Math.sin(ang) * 9);
        ctx.lineTo(hx + Math.cos(ang) * 20 - 4 * f, hy + Math.sin(ang) * 20 - 6);
        ctx.lineTo(hx + Math.cos(ang + 0.25) * 10, hy + Math.sin(ang + 0.25) * 10);
        ctx.fill();
      }
      // Franja lateral
      ctx.beginPath();
      ctx.moveTo(hx + 4 * f, hy - 6);
      ctx.lineTo(hx + 8 * f, hy + 8);
      ctx.lineTo(hx + 2 * f, hy);
      ctx.fill();
    } else if (vis.headgear === 'sponge_head') {
      // Bob Esponja: Cabeça amarela quadrada com poros
      ctx.fillStyle = '#facc15';
      ctx.fillRect(hx - 10, hy - 12, 20, 20);
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(hx - 10, hy - 12, 20, 20);
      // Poros verdes/oliva
      ctx.fillStyle = '#ca8a04';
      ctx.beginPath();
      ctx.arc(hx - 5, hy - 6, 1.8, 0, Math.PI * 2);
      ctx.arc(hx + 4, hy - 8, 2.2, 0, Math.PI * 2);
      ctx.arc(hx - 6, hy + 3, 2, 0, Math.PI * 2);
      ctx.fill();
      // Olhos grandes azuis esféricos
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(hx + 2 * f, hy - 3, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(hx + 3.5 * f, hy - 3, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (vis.headgear === 'iron_helmet') {
      // Homem de Ferro: Capacete dourado e vermelho com fendas dos olhos reluzentes
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.ellipse(hx, hy - 4, 11, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      // Placa frontal dourada
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(hx - 5, hy - 10);
      ctx.lineTo(hx + 8 * f, hy - 10);
      ctx.lineTo(hx + 8 * f, hy + 3);
      ctx.lineTo(hx - 3, hy + 6);
      ctx.closePath();
      ctx.fill();
      // Visor ocular ciano reluzente
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(hx + 2 * f, hy - 3, 5 * f, 2);
      ctx.shadowBlur = 0;
    } else if (vis.headgear === 'spider_mask') {
      // Homem-Aranha: Máscara vermelha com lentes angulares brancas e padrão de teia
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.ellipse(hx, hy - 4, 11, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      // Linhas da teia na máscara
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hx, hy - 14);
      ctx.lineTo(hx, hy + 6);
      ctx.moveTo(hx - 10, hy - 4);
      ctx.lineTo(hx + 10, hy - 4);
      ctx.stroke();
      // Lente ocular branca com borda preta
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.ellipse(hx + 3 * f, hy - 3, 5, 3.5, 0.2 * f, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(hx + 3 * f, hy - 3, 3.8, 2.4, 0.2 * f, 0, Math.PI * 2);
      ctx.fill();
    } else if (vis.headgear === 'yoshi_snout') {
      // Cabeça arredondada verde do Yoshi com bochechas brancas e crista vermelha
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(hx, hy - 2, 12, 0, Math.PI * 2);
      ctx.fill();
      // Bochecha branca
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(hx + 3 * f, hy + 2, 7, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Crista vermelha atrás
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(hx - 8 * f, hy - 4, 3.5, 0, Math.PI * 2);
      ctx.arc(hx - 10 * f, hy + 2, 3, 0, Math.PI * 2);
      ctx.fill();
      // Olho grande preto/branco
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(hx + 3 * f, hy - 5, 4, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(hx + 4.5 * f, hy - 5, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (vis.headgear === 'pikachu_ears') {
      // Cabeça amarela com orelhas pontudas de pontas pretas e bochecha vermelha
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(hx, hy - 2, 11, 0, Math.PI * 2);
      ctx.fill();
      // Orelhas pontudas
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.moveTo(hx - 6, hy - 10);
      ctx.lineTo(hx - 14, hy - 24);
      ctx.lineTo(hx - 1, hy - 11);
      ctx.closePath();
      ctx.fill();
      // Ponta preta da orelha 1
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.moveTo(hx - 10, hy - 17);
      ctx.lineTo(hx - 14, hy - 24);
      ctx.lineTo(hx - 7, hy - 18);
      ctx.closePath();
      ctx.fill();
      // Orelha 2
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.moveTo(hx + 2, hy - 11);
      ctx.lineTo(hx + 10, hy - 24);
      ctx.lineTo(hx + 7, hy - 10);
      ctx.closePath();
      ctx.fill();
      // Ponta preta da orelha 2
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.moveTo(hx + 6, hy - 18);
      ctx.lineTo(hx + 10, hy - 24);
      ctx.lineTo(hx + 9, hy - 17);
      ctx.closePath();
      ctx.fill();
      // Bochecha vermelha elétrica
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(hx + 5 * f, hy + 2, 3.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (vis.headgear === 'hedgehog_quills') {
      // Espinhos azuis longos para trás do Sonic
      ctx.fillStyle = '#1d4ed8';
      for (let i = 0; i < 4; i++) {
        const ang = -Math.PI * 0.85 + i * 0.45;
        ctx.beginPath();
        ctx.moveTo(hx + Math.cos(ang) * 9, hy + Math.sin(ang) * 9);
        ctx.lineTo(hx - 18 * f, hy - 14 + i * 8);
        ctx.lineTo(hx + Math.cos(ang + 0.3) * 10, hy + Math.sin(ang + 0.3) * 10);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(hx, hy - 2, 11, 0, Math.PI * 2);
      ctx.fill();
      // Focinho cor de pêssego
      ctx.fillStyle = '#fdba74';
      ctx.beginPath();
      ctx.ellipse(hx + 4 * f, hy + 2, 5, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Narizinho preto
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(hx + 8 * f, hy + 1, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (vis.headgear === 'luchador_mask') {
      // Máscara de luta preta com aberturas e tubos verdes de Venom do Bane
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.ellipse(hx, hy - 2, 12, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      // Aberturas oculares brancas ferozes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(hx + 3 * f, hy - 3, 3, 2, 0.2 * f, 0, Math.PI * 2);
      ctx.fill();
      // Tubo verde de Venom na nuca/lado
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(hx - 6 * f, hy + 6);
      ctx.quadraticCurveTo(hx - 14 * f, hy - 2, hx - 4 * f, hy - 10);
      ctx.stroke();
    } else if (vis.headgear === 'widows_peak' || vis.hairStyle === 'slick_back_dark') {
      // Drácula: Cabelo preto penteado para trás com bico de viúva e tez pálida
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.ellipse(hx, hy - 7, 12, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      // Bico de viúva na testa
      ctx.beginPath();
      ctx.moveTo(hx - 6, hy - 6);
      ctx.lineTo(hx, hy - 2);
      ctx.lineTo(hx + 6, hy - 6);
      ctx.fill();
      // Olhar sombrio avermelhado
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.arc(hx + 4 * f, hy - 1, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (vis.headgear === 'kirito_hair' || vis.hairStyle === 'bangs_dark') {
      // Kirito: Cabelo preto desfiado com franjas sobre a testa
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.ellipse(hx, hy - 6, 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Franjas pontudas
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(hx - 6 + i * 4, hy - 4);
        ctx.lineTo(hx - 4 + i * 4, hy + 2);
        ctx.lineTo(hx - 2 + i * 4, hy - 4);
        ctx.fill();
      }
    } else if (vis.headgear === 'scout_hair' || vis.hairStyle === 'parted_brown') {
      // Eren Yeager: Cabelo castanho escuro repartido com marcas de titã sob os olhos
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.ellipse(hx, hy - 6, 12, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(hx - 4, hy - 4);
      ctx.lineTo(hx + 4 * f, hy + 3);
      ctx.lineTo(hx + 2 * f, hy - 2);
      ctx.fill();
      // Marcas vermelhas de titã sob o olho
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hx + 2 * f, hy + 2);
      ctx.lineTo(hx + 6 * f, hy + 5);
      ctx.stroke();
    } else if (vis.headgear === 'bruce_hair' || vis.hairStyle === 'mop_top_black') {
      // Bruce Lee: Corte de tigela clássico preto com expressão focada
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.ellipse(hx, hy - 7, 12, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Linha reta da franja na testa
      ctx.fillRect(hx - 8, hy - 5, 16, 3);
      // Costeleta lateral
      ctx.beginPath();
      ctx.moveTo(hx - 6 * f, hy - 4);
      ctx.lineTo(hx - 6 * f, hy + 3);
      ctx.lineTo(hx - 4 * f, hy);
      ctx.fill();
    } else if (vis.headgear === 'goku_hair' || vis.hairStyle === 'saiyan_wild') {
      // Goku: Cabelo espetado clássico Saiyajin com múltiplas pontas volumosas
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.ellipse(hx, hy - 7, 12, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      // Espetos largos de Saiyajin para cima e lados
      const spikes = [
        { ox: -12, oy: -8, tx: -20 * f, ty: -24 },
        { ox: -6, oy: -12, tx: -10 * f, ty: -28 },
        { ox: 0, oy: -14, tx: 2 * f, ty: -30 },
        { ox: 8, oy: -12, tx: 16 * f, ty: -26 },
        { ox: 12, oy: -6, tx: 22 * f, ty: -16 }
      ];
      for (const sp of spikes) {
        ctx.beginPath();
        ctx.moveTo(hx + sp.ox, hy + sp.oy);
        ctx.lineTo(hx + sp.tx, hy + sp.ty);
        ctx.lineTo(hx + sp.ox + 6, hy + sp.oy);
        ctx.fill();
      }
    } else if (vis.headgear === 'yoda_ears' || vis.hairStyle === 'wispy_white') {
      // Yoda: Cabeça arredondada com orelhas pontudas verdes compridas e tufos brancos
      ctx.fillStyle = '#15803d'; // Pele verde sábia
      // Orelha esquerda
      ctx.beginPath();
      ctx.moveTo(hx - 8, hy - 2);
      ctx.lineTo(hx - 26, hy - 8);
      ctx.lineTo(hx - 8, hy + 4);
      ctx.closePath();
      ctx.fill();
      // Orelha direita
      ctx.beginPath();
      ctx.moveTo(hx + 8, hy - 2);
      ctx.lineTo(hx + 26, hy - 8);
      ctx.lineTo(hx + 8, hy + 4);
      ctx.closePath();
      ctx.fill();
      // Tufos brancos nas laterais
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(hx - 10, hy - 4, 3, 2);
      ctx.fillRect(hx + 7, hy - 4, 3, 2);
    } else if (vis.headgear === 'scoundrel_hair' || vis.hairStyle === 'swept_brown') {
      // Han Solo: Cabelo castanho ondulado para o lado
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.ellipse(hx, hy - 7, 12, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(hx - 8, hy - 8);
      ctx.quadraticCurveTo(hx + 6 * f, hy - 14, hx + 12 * f, hy - 2);
      ctx.lineTo(hx + 8 * f, hy + 2);
      ctx.fill();
    } else if (vis.headgear === 'mario_cap' || vis.hairStyle === 'cap_brim') {
      // Mario: Boné vermelho brilhante com aba frontal
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.ellipse(hx, hy - 8, 13, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Aba do boné
      ctx.fillRect(hx + (f === 1 ? 4 : -16), hy - 5, 12, 3);
      // Emblema circular branco no centro
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(hx + 2 * f, hy - 9, 3.5, 0, Math.PI * 2);
      ctx.fill();
      // 'M' vermelho
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(hx + 1 * f, hy - 10, 2, 2);
    } else if (vis.headgear === 'wolverine_cowl' || vis.hairStyle === 'flared_fins') {
      // Wolverine: Máscara cowl preta/azul com grandes aletas pontudas clássicas
      ctx.fillStyle = '#09090b';
      // Aleta lateral traseira
      ctx.beginPath();
      ctx.moveTo(hx - 8 * f, hy - 2);
      ctx.lineTo(hx - 18 * f, hy - 24);
      ctx.lineTo(hx - 2 * f, hy - 10);
      ctx.closePath();
      ctx.fill();
      // Aleta lateral dianteira
      ctx.beginPath();
      ctx.moveTo(hx + 4 * f, hy - 2);
      ctx.lineTo(hx + 20 * f, hy - 26);
      ctx.lineTo(hx + 10 * f, hy - 8);
      ctx.closePath();
      ctx.fill();
    } else if (vis.headgear === 'kratos_bald_beard' || vis.hairStyle === 'full_spartan_beard') {
      // Kratos: Cabeça raspada pálida, tatuagem vermelha de Esparta no olho e barba cheia escura
      // Tatuagem vermelha cortando a face
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hx - 2 * f, hy - 12);
      ctx.lineTo(hx + 4 * f, hy + 6);
      ctx.stroke();
      // Barba cheia espartana
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.ellipse(hx + 2 * f, hy + 8, 6.5, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (vis.headgear === 'symbiote_fangs') {
      // Venom: Cabeça negra lisa simbiótica com olhos brancos gigantes e dentes
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.ellipse(hx, hy - 4, 12, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      // Olho branco alongado característico de Venom
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(hx - 2 * f, hy - 6);
      ctx.quadraticCurveTo(hx + 10 * f, hy - 10, hx + 12 * f, hy - 2);
      ctx.quadraticCurveTo(hx + 4 * f, hy - 1, hx - 2 * f, hy - 6);
      ctx.fill();
      // Dentes pontudos inferiores
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(hx + i * 3 * f, hy + 6);
        ctx.lineTo(hx + (i * 3 + 1.5) * f, hy + 2);
        ctx.lineTo(hx + (i * 3 + 3) * f, hy + 6);
        ctx.fill();
      }
    } else if (vis.headgear === 'carnage_crests') {
      // Carnificina: Cabeça carmesim retorcida com veias pretas e olhos recortados
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.ellipse(hx, hy - 4, 11, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      // Gavinhas na cabeça
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(hx, hy - 10);
      ctx.lineTo(hx - 6 * f, hy - 18);
      ctx.moveTo(hx + 4 * f, hy - 10);
      ctx.lineTo(hx + 8 * f, hy - 16);
      ctx.stroke();
      // Olho preto com contorno branco recortado
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.ellipse(hx + 3 * f, hy - 3, 5, 3, 0.2 * f, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (vis.headgear === 'blonde_slick_quiff') {
      // Homelander: Penteado loiro para trás com topete impecável e olhos vermelhos brilhantes
      ctx.fillStyle = '#ca8a04';
      ctx.beginPath();
      ctx.ellipse(hx, hy - 7, 12, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Topete levantado na frente
      ctx.beginPath();
      ctx.moveTo(hx - 4 * f, hy - 11);
      ctx.quadraticCurveTo(hx + 4 * f, hy - 16, hx + 10 * f, hy - 8);
      ctx.lineTo(hx + 4 * f, hy - 7);
      ctx.fill();
      // Olhos rubros brilhantes de laser
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(hx + 4 * f, hy - 1, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Cabelo clássico
      ctx.beginPath();
      ctx.ellipse(hx, hy - 7, 11, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. Bigode de Gustave e Barba de Renoir
    if (vis.hasMustache && !vis.hasRuneFaceSlab) {
      ctx.fillStyle = vis.hairColor || '#271810';
      ctx.beginPath();
      ctx.ellipse(hx + 3 * f, hy + 4, 4, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 7. Tatuagem Dourada sob o Olho de Lune
    if (vis.hasFaceTattoo) {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(hx + 3 * f, hy + 3, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 8. Olho com Brilho Temático
    if (!vis.hasRuneFaceSlab) {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(hx + 4 * f, hy - 1, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = char.themeColor;
      ctx.beginPath();
      ctx.arc(hx + 4.5 * f, hy - 1, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  static drawAttackTrail(ctx, fighter, x, y, f, p, vis) {
    if (!fighter.activeHitbox) return;

    ctx.save();
    ctx.shadowColor = vis.paintTrailColor || '#38bdf8';
    ctx.shadowBlur = 20;
    ctx.strokeStyle = vis.paintTrailColor || '#38bdf8';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    const hx = x + p.rightHand.x;
    const hy = y + p.rightHand.y;

    ctx.beginPath();
    ctx.moveTo(hx - 32 * f, hy);
    ctx.quadraticCurveTo(hx, hy - 18, hx + 28 * f, hy);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.restore();
  }

  // --- RENDERIZADOR EXCLUSIVO DE RELÂMPAGO MCQUEEN (CARRO DA COPA PISTÃO) ---
  static drawMcQueenCar(ctx, x, y, f, fighter) {
    const t = fighter.stateTime;
    const isMoving = Math.abs(fighter.velocity.x) > 0.5;
    const wheelRot = isMoving ? t * 25 * f : 0;
    const bounce = Math.sin(t * 14) * (isMoving ? 2 : 0.8);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(f, 1);

    // 1. Chassi Principal Vermelho de Corrida (#dc2626 com gradiente #991b1b)
    const carGrad = ctx.createLinearGradient(-75, -55, 75, 0);
    carGrad.addColorStop(0, '#dc2626');
    carGrad.addColorStop(0.5, '#ef4444');
    carGrad.addColorStop(1, '#991b1b');

    ctx.fillStyle = carGrad;
    ctx.beginPath();
    ctx.moveTo(-75, -15); // traseira baixa
    ctx.lineTo(-78, -38); // spoiler base
    ctx.lineTo(-65, -42); // subida traseira
    ctx.lineTo(-30, -56 + bounce); // teto / cabine
    ctx.lineTo(25, -56 + bounce);  // topo parabrisa
    ctx.lineTo(60, -32);  // capô dianteiro
    ctx.lineTo(82, -18);  // bico dianteiro
    ctx.lineTo(82, -8);   // para-choque
    ctx.lineTo(-75, -8);  // saia lateral
    ctx.closePath();
    ctx.fill();

    // Contorno do carro
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 2. Spoiler Traseiro Elevado
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(-78, -52 + bounce, 18, 5);
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(-72, -47 + bounce, 6, 9);

    // 3. Para-brisa com Olhos Expressivos da Pixar
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-15, -53 + bounce);
    ctx.lineTo(22, -53 + bounce);
    ctx.lineTo(45, -34);
    ctx.lineTo(-12, -34);
    ctx.closePath();
    ctx.fill();

    // Íris azuis de McQueen
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(8, -42 + bounce, 5, 0, Math.PI * 2);
    ctx.arc(26, -42 + bounce, 5, 0, Math.PI * 2);
    ctx.fill();

    // Pupilas
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(9, -42 + bounce, 2.5, 0, Math.PI * 2);
    ctx.arc(27, -42 + bounce, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 4. Decalque Relâmpago e Número 95
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(-35, -28);
    ctx.lineTo(5, -28);
    ctx.lineTo(-8, -18);
    ctx.lineTo(25, -18);
    ctx.lineTo(10, -12);
    ctx.lineTo(-25, -12);
    ctx.closePath();
    ctx.fill();

    // Número 95 dourado/amarelo na lateral
    ctx.font = '900 16px "Impact", sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.strokeText('95', -22, -32);
    ctx.fillText('95', -22, -32);

    // 5. Boca / Sorriso no para-choque
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(68, -14, 10, 0.2, Math.PI * 0.8);
    ctx.stroke();

    // 6. Quatro Rodas Lightyear Pretas com Calotas Vermelhas
    const drawWheel = (wx, wy) => {
      ctx.save();
      ctx.translate(wx, wy);
      ctx.rotate(wheelRot);

      // Pneu de borracha preta
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Roda vermelha / aro
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();

      // Centro cromado
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    drawWheel(-48, -4);
    drawWheel(52, -4);

    // 7. Faróis Dianteiros com Brilho
    ctx.fillStyle = '#fef08a';
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(75, -24, 6, 3, 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // --- RENDERIZADOR DEDICADO DO INCRÍVEL HULK COM ANIMAÇÕES COMPLETAS E DINÂMICAS ---
  static drawTrueHulk(ctx, x, y, f, p, fighter) {
    const t = fighter.stateTime;
    const state = fighter.state;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(f * 1.45, 1.45); // Escala colossal do Gigante Esmeralda

    // Aura gama pulsante verde ao redor do colosso
    const gammaPulse = Math.sin(t * 8) * 0.15 + 0.85;
    ctx.save();
    ctx.shadowColor = 'rgba(74, 222, 128, 0.9)';
    ctx.shadowBlur = 24 * gammaPulse;

    // Cálculo das animações procedurais baseadas no estado
    let bodyY = 0;
    let bodyRot = 0;
    let chestTilt = 0;
    let headOffX = 0;
    let headOffY = 0;

    // Posições dos pés
    let legBackAngle = 0;
    let legFrontAngle = 0;
    let footBackY = 0;
    let footFrontY = 0;
    let footBackX = -14;
    let footFrontX = 14;

    // Posições dos braços
    let armBackAngle = 0;
    let armFrontAngle = 0;
    let fistBackX = -50;
    let fistBackY = -36;
    let fistFrontX = 52;
    let fistFrontY = -35;
    let armFrontExt = 0;
    let armBackExt = 0;

    const isWalking = state === FIGHTER_STATE.WALK_FORWARD || state === FIGHTER_STATE.WALK_BACK || (state === FIGHTER_STATE.BLOCK && Math.abs(fighter.velocity.x) > 0.1);
    const isCrouched = state === FIGHTER_STATE.CROUCH || state === FIGHTER_STATE.CROUCH_BLOCK || state === FIGHTER_STATE.CROUCH_PUNCH || state === FIGHTER_STATE.CROUCH_KICK;
    const isPunching = state === FIGHTER_STATE.LIGHT_PUNCH || state === FIGHTER_STATE.HEAVY_PUNCH || state === FIGHTER_STATE.CROUCH_PUNCH;
    const isKicking = state === FIGHTER_STATE.LIGHT_KICK || state === FIGHTER_STATE.HEAVY_KICK || state === FIGHTER_STATE.CROUCH_KICK;
    const isSpecial = state === FIGHTER_STATE.SPECIAL_1 || state === FIGHTER_STATE.SPECIAL_2 || state === FIGHTER_STATE.SUPER_MOVE;
    const isHurt = state === FIGHTER_STATE.HURT;
    const isKnocked = state === FIGHTER_STATE.KNOCKDOWN || state === FIGHTER_STATE.DEFEAT;
    const isBlocking = state === FIGHTER_STATE.BLOCK || state === FIGHTER_STATE.CROUCH_BLOCK;

    if (isKnocked) {
      bodyY = 35;
      bodyRot = -0.7;
      fistBackY = 20;
      fistFrontY = 25;
    } else if (isHurt) {
      bodyRot = -0.15;
      bodyY = 5;
      headOffX = -8;
      headOffY = -4;
      fistBackX = -35;
      fistFrontX = 25;
      fistFrontY = -60;
    } else if (isCrouched) {
      bodyY = 22;
      chestTilt = 0.15;
      footBackX = -20;
      footFrontX = 18;
      footBackY = 5;
      footFrontY = 5;
      if (state === FIGHTER_STATE.CROUCH_PUNCH) {
        const pExt = Math.sin(Math.min(1, t / 0.22) * Math.PI);
        armFrontExt = pExt * 45;
        fistFrontX = 52 + armFrontExt;
        fistFrontY = -15;
      } else {
        fistFrontX = 35;
        fistFrontY = -15;
        fistBackX = -20;
        fistBackY = -15;
      }
    } else if (isSpecial) {
      // Hulk Smash ou Super Golpe: ergue os dois braços gigantes e golpeia o solo
      const smashPhase = Math.min(1, t / 0.45);
      if (smashPhase < 0.4) {
        // Erguendo ambos os punhos aos céus com rugido furioso
        const lift = smashPhase / 0.4;
        bodyY = -lift * 10;
        fistFrontX = 15;
        fistFrontY = -120 * lift;
        fistBackX = -15;
        fistBackY = -120 * lift;
        armFrontAngle = -1.2 * lift;
        armBackAngle = -1.2 * lift;
      } else {
        // Slam violento no solo gerando cratera
        const slam = (smashPhase - 0.4) / 0.6;
        bodyY = Math.sin(slam * Math.PI * 0.5) * 15;
        bodyRot = 0.25;
        fistFrontX = 45;
        fistFrontY = -10;
        fistBackX = 25;
        fistBackY = -10;
        armFrontAngle = 0.6;
        armBackAngle = 0.6;
      }
    } else if (isPunching) {
      const punchExt = Math.sin(Math.min(1, t / (state === FIGHTER_STATE.HEAVY_PUNCH ? 0.38 : 0.22)) * Math.PI);
      armFrontExt = punchExt * (state === FIGHTER_STATE.HEAVY_PUNCH ? 60 : 42);
      chestTilt = punchExt * 0.2;
      bodyY = punchExt * 4;
      fistFrontX = 52 + armFrontExt;
      fistFrontY = -55 - punchExt * 10;
      fistBackX = -35 - punchExt * 10;
      fistBackY = -45;
    } else if (isKicking) {
      const kickExt = Math.sin(Math.min(1, t / 0.35) * Math.PI);
      legFrontAngle = -kickExt * 0.9;
      footFrontX = 14 + kickExt * 50;
      footFrontY = -kickExt * 45;
      bodyRot = -kickExt * 0.2;
      bodyY = -kickExt * 6;
    } else if (isBlocking) {
      // Postura de bloqueio maciço: braços cruzados na frente do rosto
      fistFrontX = 22;
      fistFrontY = -95;
      fistBackX = 14;
      fistBackY = -85;
      chestTilt = -0.05;
      if (isWalking) {
        const step = Math.sin(t * 10);
        footBackX = -14 - step * 12;
        footFrontX = 14 + step * 12;
        bodyY = Math.abs(step) * 4;
      }
    } else if (isWalking) {
      // Passos pesados titânicos do Hulk
      const walk = Math.sin(t * 9);
      legBackAngle = -walk * 0.45;
      legFrontAngle = walk * 0.45;
      footBackX = -14 - walk * 18;
      footFrontX = 14 + walk * 18;
      footBackY = Math.max(0, -walk * 12);
      footFrontY = Math.max(0, walk * 12);
      bodyY = Math.abs(walk) * 5;
      bodyRot = walk * 0.06;

      // Balanço dos braços colossais ao andar
      armFrontAngle = -walk * 0.5;
      armBackAngle = walk * 0.5;
      fistFrontX = 52 - walk * 24;
      fistFrontY = -35 + Math.abs(walk) * 8;
      fistBackX = -50 + walk * 24;
      fistBackY = -36 + Math.abs(walk) * 8;
    } else {
      // IDLE: Respiração pesada e ameaçadora do monstro
      const breath = Math.sin(t * 4);
      bodyY = breath * 2.5;
      chestTilt = breath * 0.02;
      fistFrontY = -35 + breath * 3;
      fistBackY = -36 - breath * 3;
    }

    ctx.translate(0, bodyY);
    if (bodyRot !== 0) ctx.rotate(bodyRot);

    // 1. Pernas Musculosas Gigantes (Pele verde #22c55e e bermuda roxa rasgada #581c87)
    // Perna Traseira
    ctx.save();
    ctx.translate(-14, -32);
    ctx.rotate(legBackAngle);
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 28, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-2, 22 + footBackY * 0.5, 12, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    // Pé Traseiro
    ctx.beginPath();
    ctx.roundRect(-12, 27 + footBackY, 24, 10, 4);
    ctx.fill();
    ctx.restore();

    // Perna Frontal
    ctx.save();
    ctx.translate(14, -32);
    ctx.rotate(legFrontAngle);
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 28, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(2, 22 + footFrontY * 0.5, 13, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    // Pé Frontal
    ctx.beginPath();
    ctx.roundRect(-10, 27 + footFrontY, 26, 10, 4);
    ctx.fill();
    ctx.restore();

    // Bermuda Roxa Rasgada (Calça rasgada clássica do Hulk)
    ctx.fillStyle = '#4a044e';
    ctx.beginPath();
    ctx.moveTo(-24, -65);
    ctx.lineTo(24, -65);
    ctx.lineTo(26, -30);
    // Pontas rasgadas da perna direita
    ctx.lineTo(18, -25);
    ctx.lineTo(12, -32);
    ctx.lineTo(4, -26);
    ctx.lineTo(0, -42); // cavalo
    // Pontas rasgadas da perna esquerda
    ctx.lineTo(-6, -26);
    ctx.lineTo(-14, -32);
    ctx.lineTo(-20, -25);
    ctx.lineTo(-26, -30);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#2e1065';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 2. Tronco / Trapézio e Peitoral Gigantesco
    ctx.save();
    if (chestTilt !== 0) ctx.rotate(chestTilt);

    // Costas / Trapézio largo
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.ellipse(0, -98, 38, 26, 0, 0, Math.PI * 2);
    ctx.fill();

    // Peitorais maciços
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(-14, -92, 18, 15, 0.1, 0, Math.PI * 2);
    ctx.ellipse(14, -92, 18, 15, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // Linhas musculares / abdômen tanquinho colossal
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -102);
    ctx.lineTo(0, -66);
    // Gomos do abdômen
    ctx.moveTo(-12, -80);
    ctx.lineTo(12, -80);
    ctx.moveTo(-11, -72);
    ctx.lineTo(11, -72);
    ctx.stroke();

    // 3. Braço Traseiro e Punho Esmagador
    ctx.save();
    ctx.translate(-34, -95);
    if (armBackAngle !== 0) ctx.rotate(armBackAngle);
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(0, 0, 17, 0, Math.PI * 2); // Ombro maciço
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-8, 20, 14, 20, 0.3, 0, Math.PI * 2); // Bíceps
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-14, 43, 15, 18, 0, 0, Math.PI * 2); // Antebraço
    ctx.fill();
    // Punho fechado traseiro
    ctx.beginPath();
    ctx.arc(-16, 59, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4. Braço Frontal Titânico
    ctx.save();
    ctx.translate(32, -95);
    if (armFrontAngle !== 0) ctx.rotate(armFrontAngle);
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2); // Ombro frontal
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(12 + armFrontExt * 0.3, 20, 16, 22, -0.3, 0, Math.PI * 2); // Bíceps frontal gigante
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(18 + armFrontExt * 0.65, 43, 16, 19, 0, 0, Math.PI * 2); // Antebraço frontal
    ctx.fill();
    // Punho gigante dianteiro
    ctx.beginPath();
    ctx.arc(20 + armFrontExt, 60, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // 5. Cabeça Feroz do Hulk
    ctx.save();
    ctx.translate(headOffX, headOffY);

    // Queixo quadrado pesado e mandíbula feroz
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.roundRect(-14, -135, 28, 26, [8, 8, 4, 4]);
    ctx.fill();

    // Expressão: Sobrancelha franzida e olhos verdes incandescentes
    ctx.fillStyle = '#86efac';
    ctx.shadowColor = '#4ade80';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(-6, -126, 4, 2.5, 0.2, 0, Math.PI * 2);
    ctx.ellipse(6, -126, 4, 2.5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Boca com dentes cerrados rosnando
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(-8, -118, 16, 6, 2);
    ctx.fill();
    ctx.strokeStyle = '#052e16';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Cabelo preto curto e desgrenhado do Hulk
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.moveTo(-16, -135);
    ctx.lineTo(-12, -145);
    ctx.lineTo(-4, -142);
    ctx.lineTo(2, -147);
    ctx.lineTo(10, -142);
    ctx.lineTo(16, -145);
    ctx.lineTo(16, -133);
    ctx.closePath();
    ctx.fill();

    ctx.restore(); // Fecha Cabeça
    ctx.restore(); // Fecha Tronco
    ctx.restore(); // Fecha Aura
    ctx.restore(); // Fecha Hulk transform
  }
}
