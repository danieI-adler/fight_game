import { FIGHTER_STATE } from './Fighter';

/**
 * Renderizador 2D Especializado para Clair Obscur: Expedition 33
 * Desenha Gustave (braço mecânico), Maelle (florete), Lune (orbes astrais), Sciel (lâminas duplas),
 * Renoir (armadura pesada), Verso (adagas sombrias), Monoco (colosso com chifres),
 * Esquie (criatura alada) e La Peintresse (pincel monumental).
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
    ctx.ellipse(x, fighter.groundY, (vis.isMonoco ? 48 : 36) * shadowScale, 9 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fill();
    ctx.restore();

    // 2. Aura de Energia / Pincelada do Monólito
    if (fighter.energy >= 100 || fighter.state === FIGHTER_STATE.SUPER_MOVE) {
      ctx.save();
      ctx.shadowColor = char.glowColor || '#fbbf24';
      ctx.shadowBlur = 24;
      ctx.strokeStyle = char.energyColor || '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = 0.6 + 0.3 * Math.sin(fighter.stateTime * 12);
      ctx.beginPath();
      ctx.arc(x + p.chest.x, y + p.chest.y, vis.isMonoco ? 60 : 50, 0, Math.PI * 2);
      ctx.stroke();

      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.arc(x + p.chest.x, y + p.chest.y, vis.isMonoco ? 72 : 60, fighter.stateTime * 2, fighter.stateTime * 2 + Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Sobretudo / Manto Traseiro
    this.drawCoatTails(ctx, x, y, f, p, vis.coatColor, vis.accentColor, fighter.velocity.x, fighter.stateTime, vis);

    // 4. Pernas & Botas
    this.drawLeg(ctx, x, y, p.pelvis, p.leftKnee, p.leftFoot, vis.pantColor, vis.bootColor, false, vis);
    this.drawLeg(ctx, x, y, p.pelvis, p.rightKnee, p.rightFoot, vis.pantColor, vis.bootColor, true, vis);

    // 5. Tronco & Vestimenta
    this.drawTorso(ctx, x, y, f, p, vis.vestColor, vis.coatColor, vis.accentColor, vis);

    // 6. Braço Traseiro
    this.drawArm(ctx, x, y, p.chest, p.leftShoulder, p.leftElbow, p.leftHand, vis.coatColor, vis.gloveColor, vis.accentColor, false, vis, f);

    // 7. Cabeça, Rosto & Adornos
    this.drawHead(ctx, x, y, f, p, char, vis);

    // 8. Braço Frontal & Arma Signature
    this.drawArm(ctx, x, y, p.chest, p.rightShoulder, p.rightElbow, p.rightHand, vis.coatColor, vis.gloveColor, vis.accentColor, true, vis, f);

    // 9. Arcos de Pincelada e Ataque
    this.drawAttackTrail(ctx, fighter, x, y, f, p, vis);

    ctx.restore();

    // 10. Debug Hitboxes
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

  static drawCoatTails(ctx, x, y, f, p, coatColor, accentColor, vx, time, vis) {
    ctx.save();
    const px = x + p.pelvis.x;
    const py = y + p.pelvis.y;
    const widthFactor = vis.isMonoco ? 1.5 : (vis.isPaintress ? 1.4 : 1.0);
    const sway = -f * (vx * 2.8) + Math.sin(time * 6) * 4;
    const tailX = px - (18 * widthFactor) * f + sway;
    const tailY = py + (vis.isPaintress ? 48 : 38);

    ctx.beginPath();
    ctx.moveTo(px - 10 * widthFactor * f, py);
    ctx.quadraticCurveTo(px - 15 * widthFactor * f + sway * 0.5, py + 20, tailX, tailY);
    ctx.lineTo(tailX + 14 * widthFactor * f, tailY);
    ctx.quadraticCurveTo(px - 2 * f, py + 20, px + 8 * widthFactor * f, py);
    ctx.closePath();

    ctx.fillStyle = coatColor;
    ctx.fill();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  static drawTorso(ctx, x, y, f, p, vestColor, coatColor, accentColor, vis) {
    ctx.save();
    const cx = x + p.chest.x;
    const cy = y + p.chest.y;
    const px = x + p.pelvis.x;
    const py = y + p.pelvis.y;
    const w = vis.isMonoco ? 20 : 14;

    ctx.beginPath();
    ctx.moveTo(cx - w * f, cy - 8);
    ctx.lineTo(cx + w * f, cy - 8);
    ctx.lineTo(px + (w - 2) * f, py);
    ctx.lineTo(px - (w - 2) * f, py);
    ctx.closePath();
    ctx.fillStyle = vestColor;
    ctx.fill();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Botões / Detalhes de Latão
    ctx.fillStyle = accentColor;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(cx + 2 * f, cy + 4 + i * 8, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  static drawLeg(ctx, x, y, pelvis, knee, foot, pantColor, bootColor, isFront, vis) {
    ctx.save();
    const px = x + pelvis.x;
    const py = y + pelvis.y;
    const kx = x + knee.x;
    const ky = y + knee.y;
    const fx = x + foot.x;
    const fy = y + foot.y;

    ctx.globalAlpha = isFront ? 1.0 : 0.8;
    const w = vis.isMonoco ? 7 : 5;

    // Coxa
    ctx.beginPath();
    ctx.moveTo(px - w, py);
    ctx.lineTo(px + w, py);
    ctx.lineTo(kx + w - 1, ky);
    ctx.lineTo(kx - w + 1, ky);
    ctx.closePath();
    ctx.fillStyle = pantColor;
    ctx.fill();

    // Bota
    ctx.beginPath();
    ctx.moveTo(kx - w, ky);
    ctx.lineTo(kx + w, ky);
    ctx.lineTo(fx + w + 1, fy - 2);
    ctx.lineTo(fx - w, fy);
    ctx.closePath();
    ctx.fillStyle = bootColor;
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  static drawArm(ctx, x, y, chest, shoulder, elbow, hand, coatColor, gloveColor, accentColor, isFront, vis, f) {
    ctx.save();
    const sx = x + shoulder.x;
    const sy = y + shoulder.y;
    const ex = x + elbow.x;
    const ey = y + elbow.y;
    const hx = x + hand.x;
    const hy = y + hand.y;

    ctx.globalAlpha = isFront ? 1.0 : 0.8;

    // Ombro
    ctx.beginPath();
    ctx.moveTo(sx - 5, sy - 3);
    ctx.lineTo(sx + 5, sy - 3);
    ctx.lineTo(ex + 4, ey);
    ctx.lineTo(ex - 4, ey);
    ctx.closePath();
    ctx.fillStyle = vis.hasMechanicalArm && isFront ? '#d4af37' : coatColor;
    ctx.fill();

    // Antebraço / Manopla
    ctx.beginPath();
    ctx.moveTo(ex - 4, ey);
    ctx.lineTo(ex + 4, ey);
    ctx.lineTo(hx + 5, hy);
    ctx.lineTo(hx - 5, hy);
    ctx.closePath();
    ctx.fillStyle = vis.hasMechanicalArm && isFront ? '#d4af37' : gloveColor;
    ctx.fill();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Punho
    ctx.beginPath();
    ctx.arc(hx, hy, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = vis.hasMechanicalArm && isFront ? '#d4af37' : gloveColor;
    ctx.fill();

    // Armas nas mãos
    if (isFront) {
      if (vis.weaponType === 'rapier') {
        // Florete de Maelle
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(hx + 38 * f, hy - 4);
        ctx.stroke();

        // Guarda do florete
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(hx + 4 * f, hy, 6, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
      } else if (vis.weaponType === 'dual_curved_blades') {
        // Lâmina curva de Sciel
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.quadraticCurveTo(hx + 20 * f, hy - 25, hx + 32 * f, hy - 15);
        ctx.stroke();
      } else if (vis.weaponType === 'colossal_brush') {
        // Pincel monumental de La Peintresse
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(hx - 15 * f, hy + 20);
        ctx.lineTo(hx + 45 * f, hy - 35);
        ctx.stroke();

        // Ponta de cerdas douradas
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.ellipse(hx + 48 * f, hy - 38, 9, 5, 0.4 * f, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  static drawHead(ctx, x, y, f, p, char, vis) {
    ctx.save();
    const hx = x + p.head.x;
    const hy = y + p.head.y;

    // Pescoço
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(hx - 4, hy + 8, 8, 6);

    // Cabeça
    ctx.beginPath();
    ctx.ellipse(hx, hy, 11, 13, 0, 0, Math.PI * 2);
    ctx.fillStyle = vis.maskColor || '#f8fafc';
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Chifres se for Monoco
    if (vis.isMonoco) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(hx - 6, hy - 8);
      ctx.quadraticCurveTo(hx - 16, hy - 25, hx - 22, hy - 18);
      ctx.moveTo(hx + 6, hy - 8);
      ctx.quadraticCurveTo(hx + 16, hy - 25, hx + 22, hy - 18);
      ctx.stroke();
    }

    // Orelhas / Asas de Esquie
    if (vis.isEsquie) {
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.ellipse(hx - 10, hy - 12, 10, 5, -0.4, 0, Math.PI * 2);
      ctx.ellipse(hx + 10, hy - 12, 10, 5, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Olhos com Brilho
    ctx.fillStyle = char.themeColor;
    ctx.beginPath();
    ctx.arc(hx + 4 * f, hy - 1, 2.5, 0, Math.PI * 2);
    ctx.fill();

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
    ctx.moveTo(hx - 30 * f, hy);
    ctx.quadraticCurveTo(hx, hy - 15, hx + 25 * f, hy);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.restore();
  }
}
