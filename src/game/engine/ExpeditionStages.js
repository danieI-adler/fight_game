/**
 * Cenários Oficiais de Clair Obscur: Expedition 33 em 2D com Paralaxe e Atmosfera Belle Époque
 */

export const EXPEDITION_STAGES = [
  {
    id: 'monolith_33',
    name: 'O Monólito (Número 33)',
    groundY: 580,
    width: 2400,
    theme: 'dark_gold'
  },
  {
    id: 'lumiere_city',
    name: 'Lumière: Cidade Petrificada',
    groundY: 580,
    width: 2400,
    theme: 'belle_epoque'
  },
  {
    id: 'flying_waters',
    name: 'Águas Voadoras (Gravidade Zero)',
    groundY: 580,
    width: 2400,
    theme: 'surreal_ocean'
  },
  {
    id: 'paintress_atelier',
    name: 'O Atelier da Pintora',
    groundY: 580,
    width: 2400,
    theme: 'baroque_ruins'
  }
];

export class ExpeditionStageRenderer {
  static draw(ctx, stageId, camera) {
    const time = performance.now() / 1000;

    switch (stageId) {
      case 'monolith_33':
        this.drawMonolith(ctx, camera, time);
        break;
      case 'lumiere_city':
        this.drawLumiere(ctx, camera, time);
        break;
      case 'flying_waters':
        this.drawFlyingWaters(ctx, camera, time);
        break;
      case 'paintress_atelier':
      default:
        this.drawAtelier(ctx, camera, time);
        break;
    }
  }

  // 1. O Monólito com o número 33
  static drawMonolith(ctx, camera, time) {
    const cx = camera.x;

    // Céu tempestuoso de tinta
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 720);
    skyGrad.addColorStop(0, '#06080e');
    skyGrad.addColorStop(0.6, '#0f172a');
    skyGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(-600, -200, 3600, 1200);

    // O Monólito Gigantesco ao Fundo
    const monoX = 1200 - cx * 0.15;
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.moveTo(monoX - 180, 700);
    ctx.lineTo(monoX - 110, -100);
    ctx.lineTo(monoX + 110, -100);
    ctx.lineTo(monoX + 180, 700);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.stroke();

    // O Número Dourado "33" Incandescente
    ctx.save();
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 35 + Math.sin(time * 3) * 15;
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 90px "Cinzel", "Georgia", serif';
    ctx.textAlign = 'center';
    ctx.fillText('33', monoX, 180);
    ctx.restore();

    // Ruínas Neoclássicas na camada média
    ctx.fillStyle = '#111827';
    for (let i = 0; i < 8; i++) {
      const px = 200 + i * 280 - cx * 0.4;
      ctx.fillRect(px, 340, 45, 240);
      ctx.fillRect(px - 15, 330, 75, 15);
    }

    // Piso de paralelepípedo com reflexo de tinta
    const floorGrad = ctx.createLinearGradient(0, 580, 0, 720);
    floorGrad.addColorStop(0, '#1e293b');
    floorGrad.addColorStop(0.3, '#0f172a');
    floorGrad.addColorStop(1, '#020617');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(-600, 580, 3600, 200);

    // Linha de solo dourada
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-600, 580);
    ctx.lineTo(3000, 580);
    ctx.stroke();

    // Fuligem e partículas de tinta no ar
    ctx.fillStyle = '#fbbf24';
    for (let i = 0; i < 20; i++) {
      const fx = ((i * 137 + time * 40) % 2400) - cx * 0.5;
      const fy = 200 + ((i * 83 + Math.sin(time + i) * 60) % 380);
      ctx.globalAlpha = 0.3 + 0.4 * Math.sin(time + i);
      ctx.beginPath();
      ctx.arc(fx, fy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }

  // 2. Lumière: A Cidade Belle Époque
  static drawLumiere(ctx, camera, time) {
    const cx = camera.x;

    // Céu Crepuscular
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 720);
    skyGrad.addColorStop(0, '#0c1322');
    skyGrad.addColorStop(0.5, '#1e1b4b');
    skyGrad.addColorStop(1, '#3b0764');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(-600, -200, 3600, 1200);

    // Silhuetas de Telhados Parisienses e Mansardas
    ctx.fillStyle = '#0f172a';
    for (let i = 0; i < 10; i++) {
      const bx = i * 260 - cx * 0.2;
      ctx.fillRect(bx, 260, 240, 320);
      ctx.beginPath();
      ctx.moveTo(bx - 10, 260);
      ctx.lineTo(bx + 120, 160);
      ctx.lineTo(bx + 250, 260);
      ctx.closePath();
      ctx.fill();
    }

    // Postes de Luz a Gás acesos em azul ciano etéreo
    for (let i = 0; i < 9; i++) {
      const lx = 150 + i * 260 - cx * 0.6;
      ctx.fillStyle = '#020617';
      ctx.fillRect(lx - 4, 380, 8, 200);

      // Lamparina
      ctx.save();
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 25;
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.arc(lx, 375, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Piso Molhado com Reflexos
    const floorGrad = ctx.createLinearGradient(0, 580, 0, 720);
    floorGrad.addColorStop(0, '#111827');
    floorGrad.addColorStop(0.4, '#090d16');
    floorGrad.addColorStop(1, '#030712');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(-600, 580, 3600, 200);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-600, 580);
    ctx.lineTo(3000, 580);
    ctx.stroke();
  }

  // 3. Águas Voadoras (Gravidade Zero)
  static drawFlyingWaters(ctx, camera, time) {
    const cx = camera.x;

    // Fundo Cósmico Bioluminescente
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 720);
    skyGrad.addColorStop(0, '#022c22');
    skyGrad.addColorStop(0.5, '#042f2e');
    skyGrad.addColorStop(1, '#083344');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(-600, -200, 3600, 1200);

    // Bolhas Gigantes de Água Flutuando no Ar
    for (let i = 0; i < 7; i++) {
      const bx = 250 + i * 320 - cx * 0.3;
      const by = 220 + Math.sin(time * 1.5 + i) * 35;
      const radius = 60 + (i % 3) * 25;

      ctx.save();
      ctx.shadowColor = '#2dd4bf';
      ctx.shadowBlur = 30;
      ctx.fillStyle = 'rgba(45, 212, 191, 0.25)';
      ctx.beginPath();
      ctx.arc(bx, by, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#5eead4';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    // Piso de Corais e Rocha Submarina
    ctx.fillStyle = '#041f1e';
    ctx.fillRect(-600, 580, 3600, 200);
    ctx.strokeStyle = '#2dd4bf';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-600, 580);
    ctx.lineTo(3000, 580);
    ctx.stroke();
  }

  // 4. O Atelier da Pintora
  static drawAtelier(ctx, camera, time) {
    const cx = camera.x;

    // Salão Barroco
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 720);
    skyGrad.addColorStop(0, '#1c0c04');
    skyGrad.addColorStop(0.5, '#2e1065');
    skyGrad.addColorStop(1, '#09040e');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(-600, -200, 3600, 1200);

    // Grandes Telas de Pintura Rasgadas no Fundo
    for (let i = 0; i < 6; i++) {
      const tx = 180 + i * 380 - cx * 0.35;
      ctx.fillStyle = '#261b14';
      ctx.fillRect(tx, 140, 180, 280);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 3;
      ctx.strokeRect(tx, 140, 180, 280);

      // Traços de Tinta na Tela
      ctx.strokeStyle = i % 2 === 0 ? '#ef4444' : '#38bdf8';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(tx + 20, 200);
      ctx.quadraticCurveTo(tx + 90, 300, tx + 160, 220);
      ctx.stroke();
    }

    // Piso com Manchas de Tinta Dourada
    ctx.fillStyle = '#0f0a07';
    ctx.fillRect(-600, 580, 3600, 200);

    // Poças de Tinta Dourada
    for (let i = 0; i < 8; i++) {
      const px = 100 + i * 300 - cx;
      ctx.save();
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.ellipse(px, 580, 45, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-600, 580);
    ctx.lineTo(3000, 580);
    ctx.stroke();
  }
}
