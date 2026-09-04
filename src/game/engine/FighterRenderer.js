import { FIGHTER_STATE } from './Fighter';

/**
 * Renderizador de Alta Fidelidade 2D - Estilo Clair Obscur: Expedition 33
 * Desenha os lutadores com anatomia sólida, sobretudos esvoaçantes, máscaras de porcelana,
 * tricornes, manoplas articuladas, botas de cano alto e arcos luminosos de tinta.
 */
export class FighterRenderer {
  static draw(ctx, fighter, showHitboxes = false) {
    const x = fighter.position.x;
    const y = fighter.position.y;
    const f = fighter.facing;
    const p = fighter.pose;
    const char = fighter.charData;
    const vis = char.visual || {};

    const coatColor = vis.coatColor || char.secondaryColor || '#1e293b';
    const accentColor = vis.accentColor || char.themeColor || '#d4af37';
    const vestColor = vis.vestColor || '#0f172a';
    const pantColor = vis.pantColor || '#090d16';
    const bootColor = vis.bootColor || '#1c1917';
    const gloveColor = vis.gloveColor || char.themeColor || '#0284c7';
    const maskColor = vis.maskColor || '#f8fafc';
    const trailColor = vis.paintTrailColor || char.themeColor || '#38bdf8';

    ctx.save();

    // 1. Sombra Suave no Chão
    const shadowDist = Math.max(0, fighter.groundY - y);
    const shadowScale = Math.max(0.3, 1 - shadowDist / 300);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, fighter.groundY, 36 * shadowScale, 9 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fill();
    ctx.restore();

    // 2. Aura de Energia / Pincelada Etérea
    if (fighter.energy >= 100 || fighter.state === FIGHTER_STATE.SUPER_MOVE) {
      ctx.save();
      ctx.shadowColor = char.glowColor || 'rgba(56, 189, 248, 0.8)';
      ctx.shadowBlur = 20;
      ctx.strokeStyle = char.energyColor || '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(fighter.stateTime * 12);
      ctx.beginPath();
      ctx.arc(x + p.chest.x, y + p.chest.y, 52, 0, Math.PI * 2);
      ctx.stroke();

      // Círculo Rúnico
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(x + p.chest.x, y + p.chest.y, 62, fighter.stateTime * 2, fighter.stateTime * 2 + Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Camada Traseira do Sobretudo (Caudas esvoaçantes com física de inércia)
    this.drawCoatTailsBack(ctx, x, y, f, p, coatColor, accentColor, fighter.velocity.x, fighter.stateTime);

    // 4. Perna Traseira (Esquerda)
    this.drawLeg(ctx, x, y, p.pelvis, p.leftKnee, p.leftFoot, pantColor, bootColor, false);

    // 5. Braço Traseiro (Esquerdo)
    this.drawArm(ctx, x, y, p.chest, p.leftShoulder, p.leftElbow, p.leftHand, coatColor, gloveColor, accentColor, false);

    // 6. Tronco / Colete Belle Époque
    this.drawTorso(ctx, x, y, f, p, vestColor, coatColor, accentColor);

    // 7. Perna Frontal (Direita)
    this.drawLeg(ctx, x, y, p.pelvis, p.rightKnee, p.rightFoot, pantColor, bootColor, true);

    // 8. Camada Frontal do Sobretudo / Lapelas
    this.drawCoatFront(ctx, x, y, f, p, coatColor, accentColor);

    // 9. Braço Frontal (Direito - Manopla de Ataque)
    this.drawArm(ctx, x, y, p.chest, p.rightShoulder, p.rightElbow, p.rightHand, coatColor, gloveColor, accentColor, true);

    // 10. Cabeça, Máscara de Porcelana & Chapéu
    this.drawHeadAndHeadgear(ctx, x, y, f, p, vis.headgear, vis.maskStyle, maskColor, coatColor, accentColor, char.themeColor);

    // 11. Arcos de Pincelada Luminosa nos Ataques (Expedition 33 Paintress effect)
    this.drawAttackPaintTrail(ctx, fighter, x, y, f, p, trailColor);

    ctx.restore();

    // 12. Hitboxes de Debug se ativado
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

  // --- TRONCO & COLETE BELLE ÉPOQUE ---
  static drawTorso(ctx, x, y, f, p, vestColor, coatColor, accentColor) {
    ctx.save();
    const cx = x + p.chest.x;
    const cy = y + p.chest.y;
    const px = x + p.pelvis.x;
    const py = y + p.pelvis.y;

    // Colete / Corselete
    ctx.beginPath();
    ctx.moveTo(cx - 14 * f, cy - 8);
    ctx.lineTo(cx + 14 * f, cy - 8);
    ctx.lineTo(px + 12 * f, py);
    ctx.lineTo(px - 12 * f, py);
    ctx.closePath();
    ctx.fillStyle = vestColor;
    ctx.fill();

    // Borda / Costura
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Botões de latão dourado
    ctx.fillStyle = accentColor;
    for (let i = 0; i < 3; i++) {
      const by = cy + 4 + i * 8;
      ctx.beginPath();
      ctx.arc(cx + 2 * f, by, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cinturão com Fivela de Metal
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(px - 13 * f, py - 4, 26 * f, 6);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px - 4 * f, py - 5, 8 * f, 8);

    ctx.restore();
  }

  // --- PERNAS & BOTAS DE COURO COM FIVELAS ---
  static drawLeg(ctx, x, y, pelvis, knee, foot, pantColor, bootColor, isFront) {
    ctx.save();
    const px = x + pelvis.x;
    const py = y + pelvis.y;
    const kx = x + knee.x;
    const ky = y + knee.y;
    const fx = x + foot.x;
    const fy = y + foot.y;

    const shade = isFront ? 1.0 : 0.8;
    ctx.globalAlpha = shade;

    // Coxa (Calça de Veludo / Couro)
    ctx.beginPath();
    ctx.moveTo(px - 5, py);
    ctx.lineTo(px + 5, py);
    ctx.lineTo(kx + 4, ky);
    ctx.lineTo(kx - 4, ky);
    ctx.closePath();
    ctx.fillStyle = pantColor;
    ctx.fill();

    // Joelheira / Reforço
    ctx.beginPath();
    ctx.arc(kx, ky, 5, 0, Math.PI * 2);
    ctx.fillStyle = bootColor;
    ctx.fill();

    // Bota de Cano Alto
    ctx.beginPath();
    ctx.moveTo(kx - 4.5, ky);
    ctx.lineTo(kx + 4.5, ky);
    ctx.lineTo(fx + 6, fy - 2);
    ctx.lineTo(fx - 4, fy);
    ctx.closePath();
    ctx.fillStyle = bootColor;
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Pé / Salto da Bota
    ctx.beginPath();
    ctx.ellipse(fx + 2, fy, 7, 3.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#0f0e0e';
    ctx.fill();

    ctx.restore();
  }

  // --- BRAÇO & MANOPLA ARTICULADA ---
  static drawArm(ctx, x, y, chest, shoulder, elbow, hand, coatColor, gloveColor, accentColor, isFront) {
    ctx.save();
    const sx = x + shoulder.x;
    const sy = y + shoulder.y;
    const ex = x + elbow.x;
    const ey = y + elbow.y;
    const hx = x + hand.x;
    const hy = y + hand.y;

    const alpha = isFront ? 1.0 : 0.82;
    ctx.globalAlpha = alpha;

    // Ombreira / Manga Superior
    ctx.beginPath();
    ctx.moveTo(sx - 5, sy - 3);
    ctx.lineTo(sx + 5, sy - 3);
    ctx.lineTo(ex + 4, ey);
    ctx.lineTo(ex - 4, ey);
    ctx.closePath();
    ctx.fillStyle = coatColor;
    ctx.fill();

    // Ombreira metálica no braço frontal
    if (isFront) {
      ctx.beginPath();
      ctx.arc(sx, sy, 6, 0, Math.PI * 2);
      ctx.fillStyle = accentColor;
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Antebraço / Manopla
    ctx.beginPath();
    ctx.moveTo(ex - 4, ey);
    ctx.lineTo(ex + 4, ey);
    ctx.lineTo(hx + 4.5, hy);
    ctx.lineTo(hx - 4.5, hy);
    ctx.closePath();
    ctx.fillStyle = gloveColor;
    ctx.fill();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Punho Fechado / Luva de Duelo
    ctx.beginPath();
    ctx.arc(hx, hy, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = gloveColor;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    ctx.restore();
  }

  // --- SOBRETUDO: CAMADA TRASEIRA COM FLUIDEZ DE TECIDO ---
  static drawCoatTailsBack(ctx, x, y, f, p, coatColor, accentColor, vx, time) {
    ctx.save();
    const px = x + p.pelvis.x;
    const py = y + p.pelvis.y;

    // Inércia e oscilação do vento
    const sway = -f * (vx * 2.5) + Math.sin(time * 6) * 4;
    const tailX = px - 18 * f + sway;
    const tailY = py + 38;

    ctx.beginPath();
    ctx.moveTo(px - 10 * f, py);
    ctx.quadraticCurveTo(px - 15 * f + sway * 0.5, py + 20, tailX, tailY);
    ctx.lineTo(tailX + 12 * f, tailY);
    ctx.quadraticCurveTo(px - 2 * f, py + 20, px + 8 * f, py);
    ctx.closePath();

    ctx.fillStyle = coatColor;
    ctx.fill();

    // Borda do sobretudo
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.restore();
  }

  // --- SOBRETUDO: CAMADA FRONTAL / GOLA ALTA ---
  static drawCoatFront(ctx, x, y, f, p, coatColor, accentColor) {
    ctx.save();
    const cx = x + p.chest.x;
    const cy = y + p.chest.y;

    // Gola Alta / Lapela
    ctx.beginPath();
    ctx.moveTo(cx - 8 * f, cy - 12);
    ctx.lineTo(cx - 14 * f, cy - 2);
    ctx.lineTo(cx - 6 * f, cy + 6);
    ctx.closePath();
    ctx.fillStyle = coatColor;
    ctx.fill();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  // --- CABEÇA, MÁSCARA DE PORCELANA & CHAPELARIA CLÁSSICA ---
  static drawHeadAndHeadgear(ctx, x, y, f, p, headgear, maskStyle, maskColor, coatColor, accentColor, themeColor) {
    ctx.save();
    const hx = x + p.head.x;
    const hy = y + p.head.y;

    // 1. Pescoço com Lenço / Cravat
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(hx - 4, hy + 8, 8, 7);

    // 2. Base da Cabeça / Máscara de Porcelana
    ctx.beginPath();
    ctx.ellipse(hx, hy, 11, 13, 0, 0, Math.PI * 2);
    ctx.fillStyle = maskColor;
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 3. Traço / Marcação na Máscara (Expedition 33 Paintress style)
    ctx.beginPath();
    ctx.moveTo(hx + 2 * f, hy - 4);
    ctx.lineTo(hx + 8 * f, hy + 4);
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 4. Olhos Lúgubres com Brilho Etéreo
    ctx.beginPath();
    ctx.arc(hx + 4 * f, hy - 1, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = themeColor;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(hx + 4 * f, hy - 1, 1, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // 5. Chapelaria / Adornos de Cabeça
    switch (headgear) {
      case 'tricorne': {
        // Chapéu Tricorne Belle Époque
        ctx.beginPath();
        ctx.moveTo(hx - 18 * f, hy - 6);
        ctx.quadraticCurveTo(hx - 2 * f, hy - 18, hx + 18 * f, hy - 6);
        ctx.lineTo(hx + 12 * f, hy - 14);
        ctx.lineTo(hx - 10 * f, hy - 14);
        ctx.closePath();
        ctx.fillStyle = coatColor;
        ctx.fill();
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Emblema Dourado Central
        ctx.beginPath();
        ctx.arc(hx + 3 * f, hy - 11, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = accentColor;
        ctx.fill();
        break;
      }

      case 'fedora': {
        // Chapéu Duster com Abas
        ctx.beginPath();
        ctx.ellipse(hx, hy - 8, 18, 4, 0, 0, Math.PI * 2);
        ctx.fillStyle = coatColor;
        ctx.fill();
        ctx.fillRect(hx - 8, hy - 18, 16, 10);
        ctx.fillStyle = accentColor;
        ctx.fillRect(hx - 8, hy - 10, 16, 2);
        break;
      }

      case 'feather_cap': {
        // Chapéu Aristocrático com Pluma
        ctx.beginPath();
        ctx.ellipse(hx, hy - 9, 14, 5, 0, 0, Math.PI * 2);
        ctx.fillStyle = coatColor;
        ctx.fill();

        // Pluma Longa Esvoaçante
        ctx.beginPath();
        ctx.moveTo(hx - 6 * f, hy - 10);
        ctx.quadraticCurveTo(hx - 16 * f, hy - 26, hx - 22 * f, hy - 18);
        ctx.strokeStyle = themeColor;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        break;
      }

      case 'hood': {
        // Capuz de Peregrino
        ctx.beginPath();
        ctx.arc(hx - 2 * f, hy, 14, -Math.PI * 0.7, Math.PI * 0.7);
        ctx.lineTo(hx - 6 * f, hy + 12);
        ctx.closePath();
        ctx.fillStyle = coatColor;
        ctx.fill();
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        break;
      }

      case 'beret': {
        // Boina da Expedição
        ctx.beginPath();
        ctx.ellipse(hx - 2 * f, hy - 10, 15, 6, -0.2 * f, 0, Math.PI * 2);
        ctx.fillStyle = coatColor;
        ctx.fill();
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        break;
      }

      case 'gilded_visor': {
        // Elmo Esculpido Dourado
        ctx.beginPath();
        ctx.arc(hx, hy - 2, 12, 0, Math.PI * 2);
        ctx.fillStyle = accentColor;
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.fillRect(hx - 2, hy - 2, 10 * f, 3);
        break;
      }

      default: {
        // Cabelo / Penteado estilizado
        ctx.beginPath();
        ctx.arc(hx - 4 * f, hy - 4, 11, Math.PI * 0.8, Math.PI * 1.8);
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // --- EFEITOS DE PINCELADA LUMINOSA NOS ATAQUES ---
  static drawAttackPaintTrail(ctx, fighter, x, y, f, p, trailColor) {
    if (!fighter.activeHitbox) return;

    ctx.save();
    ctx.shadowColor = trailColor;
    ctx.shadowBlur = 18;

    const t = fighter.stateTime;
    const progress = Math.min(1, t / 0.3);

    ctx.strokeStyle = trailColor;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';

    switch (fighter.state) {
      case FIGHTER_STATE.LIGHT_PUNCH:
      case FIGHTER_STATE.HEAVY_PUNCH: {
        const hx = x + p.rightHand.x;
        const hy = y + p.rightHand.y;
        ctx.beginPath();
        ctx.moveTo(hx - 25 * f, hy);
        ctx.quadraticCurveTo(hx - 10 * f, hy - 10, hx + 15 * f, hy);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;
      }

      case FIGHTER_STATE.LIGHT_KICK:
      case FIGHTER_STATE.HEAVY_KICK: {
        const fx = x + p.rightFoot.x;
        const fy = y + p.rightFoot.y;
        ctx.beginPath();
        ctx.arc(x + p.pelvis.x, y + p.pelvis.y, 45, -0.4 * f, 0.4 * f, f === -1);
        ctx.stroke();
        break;
      }

      case FIGHTER_STATE.SPECIAL_1:
      case FIGHTER_STATE.SPECIAL_2:
      case FIGHTER_STATE.SUPER_MOVE: {
        // Grande rastro estilizado de pincelada de óleo luminoso
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(x + (f * 30), y - 60, 65, -Math.PI * 0.5, Math.PI * 0.5, f === -1);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
        break;
      }
    }

    ctx.restore();
  }
}
