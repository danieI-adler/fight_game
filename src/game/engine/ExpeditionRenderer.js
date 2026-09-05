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

    // 2. Aura de Energia e Efeitos de Tinta
    if (fighter.energy >= 100 || fighter.state === FIGHTER_STATE.SUPER_MOVE) {
      this.drawEnergyAura(ctx, x, y, p, char, vis, fighter.stateTime);
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
    this.drawArm(ctx, x, y, p.chest, p.leftShoulder, p.leftElbow, p.leftHand, vis, false, f, fighter.stateTime);

    // 8. Cabeça, Cabelo, Máscaras e Traços Oficiais
    this.drawHead(ctx, x, y, f, p, char, vis, fighter.stateTime);

    // 9. Braço Frontal & Arma Principal (Braço mecânico, Florete, Orbes, Cimitarras, Bengala, Sabre, Pincel)
    this.drawArm(ctx, x, y, p.chest, p.rightShoulder, p.rightElbow, p.rightHand, vis, true, f, fighter.stateTime);

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

  static drawEnergyAura(ctx, x, y, p, char, vis, time) {
    ctx.save();
    ctx.shadowColor = char.glowColor || '#d4af37';
    ctx.shadowBlur = 25;
    ctx.strokeStyle = char.energyColor || '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.6 + 0.3 * Math.sin(time * 10);
    ctx.beginPath();
    ctx.arc(x + p.chest.x, y + p.chest.y, vis.isMonoco ? 65 : 52, 0, Math.PI * 2);
    ctx.stroke();

    // Glifos rotativos
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(x + p.chest.x, y + p.chest.y, vis.isMonoco ? 78 : 64, time * 2, time * 2 + Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  static drawBackAccessories(ctx, x, y, f, p, vis, time) {
    const cx = x + p.chest.x;
    const cy = y + p.chest.y;

    // 1. Gustave: Lâmina Lanceram nas costas
    if (vis.hasLanceramBlade) {
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

  static drawArm(ctx, x, y, chest, shoulder, elbow, hand, vis, isFront, f, time) {
    ctx.save();
    const sx = x + shoulder.x;
    const sy = y + shoulder.y;
    const ex = x + elbow.x;
    const ey = y + elbow.y;
    const hx = x + hand.x;
    const hy = y + hand.y;

    ctx.globalAlpha = isFront ? 1.0 : 0.8;
    const isMechArm = isFront && vis.hasMechanicalArm;

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
      ctx.strokeStyle = '#0284c7';
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
    ctx.strokeStyle = isMechArm ? '#fbbf24' : (vis.accentColor || '#d4af37');
    ctx.lineWidth = isMechArm ? 2 : 1.2;
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

    // 3. Mão / Punho
    ctx.beginPath();
    ctx.arc(hx, hy, isMechArm ? 6.5 : 5, 0, Math.PI * 2);
    ctx.fillStyle = isMechArm ? '#d4af37' : (vis.gloveColor || '#1e293b');
    ctx.fill();

    // Núcleo elétrico azul no punho de Gustave
    if (isMechArm) {
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(hx, hy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Armas Oficiais
    if (isFront) {
      this.drawWeapon(ctx, hx, hy, f, vis, time);
    }

    ctx.restore();
  }

  static drawWeapon(ctx, hx, hy, f, vis, time) {
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
      // Cimitarras douradas curvas de Sciel
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.quadraticCurveTo(hx + 18 * f, hy - 24, hx + 34 * f, hy - 14);
      ctx.stroke();
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
      ctx.lineTo(hx + 6 * f, hy + 38);
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
      ctx.arc(hx + 54 * f, hy - 34, 3, 0, Math.PI * 2);
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
    } else if (vis.hairStyle === 'white_fur_mane') {
      // Monoco: Juba de pelos brancos
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.arc(hx, hy - 4, 15, 0, Math.PI * 2);
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
}
