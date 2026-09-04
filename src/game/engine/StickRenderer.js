import { FIGHTER_STATE } from './Fighter';

/**
 * Renderizador de Boneco Palito Clássico (Modo 1: STICK_2D)
 * Estilo retrô minimalista com articulações geométricas e auras de combate.
 */
export class StickRenderer {
  static draw(ctx, fighter, showHitboxes = false) {
    const x = fighter.position.x;
    const y = fighter.position.y;
    const f = fighter.facing;
    const p = fighter.pose;
    const { themeColor, secondaryColor, glowColor, energyColor } = fighter.charData;

    ctx.save();

    // Sombra no chão
    const shadowDist = Math.max(0, fighter.groundY - y);
    const shadowScale = Math.max(0.3, 1 - shadowDist / 300);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, fighter.groundY, 30 * shadowScale, 7 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fill();
    ctx.restore();

    // Aura de Energia
    if (fighter.energy >= 100 || fighter.state === FIGHTER_STATE.SUPER_MOVE) {
      ctx.save();
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 18;
      ctx.strokeStyle = energyColor;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(fighter.stateTime * 14);
      ctx.beginPath();
      ctx.arc(x + p.chest.x, y + p.chest.y, 45, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;

    const drawBone = (from, to, width = 7, color = secondaryColor) => {
      ctx.beginPath();
      ctx.moveTo(x + from.x, y + from.y);
      ctx.lineTo(x + to.x, y + to.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x + from.x, y + from.y);
      ctx.lineTo(x + to.x, y + to.y);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = width * 0.35;
      ctx.stroke();
    };

    // Pernas
    drawBone(p.pelvis, p.leftKnee, 7, secondaryColor);
    drawBone(p.leftKnee, p.leftFoot, 6, secondaryColor);
    drawBone(p.pelvis, p.rightKnee, 8, themeColor);
    drawBone(p.rightKnee, p.rightFoot, 7, themeColor);

    // Coluna / Tronco
    drawBone(p.pelvis, p.chest, 10, themeColor);

    // Braço Traseiro
    drawBone(p.chest, p.leftShoulder, 7, secondaryColor);
    drawBone(p.leftShoulder, p.leftElbow, 6, secondaryColor);
    drawBone(p.leftElbow, p.leftHand, 5, secondaryColor);

    // Braço Frontal
    drawBone(p.chest, p.rightShoulder, 8, themeColor);
    drawBone(p.rightShoulder, p.rightElbow, 7, themeColor);
    drawBone(p.rightElbow, p.rightHand, 6, themeColor);

    // Cabeça
    ctx.beginPath();
    ctx.arc(x + p.head.x, y + p.head.y, 14, 0, Math.PI * 2);
    ctx.fillStyle = themeColor;
    ctx.fill();

    // Olhos / Visor
    ctx.beginPath();
    ctx.arc(x + p.head.x + (f * 4), y + p.head.y - 2, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore();

    // Hitboxes se ativado
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

    ctx.restore();
  }
}
