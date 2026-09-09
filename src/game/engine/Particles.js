/**
 * Sistema de Partículas & Efeitos Visuais
 * Efeitos inspirados em Electricman e jogos de luta clássicos:
 * - Faíscas e arcos elétricos estilizados
 * - Ondas de choque circulares
 * - Rastros de movimento (Ghosting / Motion Blur)
 * - Textos de dano e combos flutuantes
 * - Poeira de impacto no chão
 */

export class ParticleManager {
  constructor() {
    this.particles = [];
    this.lightningArcs = [];
    this.shockwaves = [];
    this.floatingTexts = [];
    this.motionTrails = [];
    this.slashLines = [];
  }

  reset() {
    this.particles = [];
    this.lightningArcs = [];
    this.shockwaves = [];
    this.floatingTexts = [];
    this.motionTrails = [];
    this.slashLines = [];
  }

  // --- CORTES DE ESPADA / FLORETE BRILHANTES (Alpha Strike / Blade Waltz) ---
  emitSwordSlash(x1, y1, x2, y2, color = '#38bdf8', width = 3.5) {
    this.slashLines.push({
      x1,
      y1,
      x2,
      y2,
      color,
      width,
      alpha: 1.0,
      decay: 0.08
    });
  }

  // --- FAÍSCAS E DETRITOS DE IMPACTO ---
  emitSparks(x, y, color = '#ffcc00', count = 18, speed = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (Math.random() * 0.7 + 0.3) * speed;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - Math.random() * 2,
        color,
        size: Math.random() * 3 + 2,
        alpha: 1,
        life: 1,
        decay: Math.random() * 0.03 + 0.02,
        gravity: 0.25,
      });
    }
  }

  // --- ARCOS ELÉTRICOS ESTILO ELECTRICMAN ---
  emitElectricArc(startX, startY, endX, endY, color = '#00f0ff', count = 3) {
    for (let i = 0; i < count; i++) {
      const segments = [];
      const steps = 7;
      let currX = startX;
      let currY = startY;

      for (let s = 1; s <= steps; s++) {
        const progress = s / steps;
        const targetX = startX + (endX - startX) * progress;
        const targetY = startY + (endY - startY) * progress;
        const jitter = (Math.random() - 0.5) * 45 * (1 - Math.abs(progress - 0.5));

        const nextX = s === steps ? endX : targetX + (Math.random() - 0.5) * 20;
        const nextY = s === steps ? endY : targetY + jitter;

        segments.push({ x1: currX, y1: currY, x2: nextX, y2: nextY });
        currX = nextX;
        currY = nextY;
      }

      this.lightningArcs.push({
        segments,
        color,
        alpha: 1,
        decay: 0.12,
        width: Math.random() * 2.5 + 1.5,
      });
    }
  }

  // --- ONDA DE CHOQUE CIRCULAR ---
  emitShockwave(x, y, maxRadius = 80, color = 'rgba(255, 255, 255, 0.8)') {
    this.shockwaves.push({
      x,
      y,
      radius: 5,
      maxRadius,
      color,
      alpha: 1,
      speed: (maxRadius - 5) / 12,
    });
  }

  // --- EXPLOSÃO DE RAIOS EM ÁREA NO CHÃO (AoE) ---
  emitGroundLightningExplosion(x, y, radius = 220, color = '#ef4444') {
    // 1. Raios radialmente pelo chão (esquerda e direita)
    const branches = 6;
    for (let i = 0; i < branches; i++) {
      const dir = (i % 2 === 0 ? 1 : -1);
      const dist = (Math.random() * 0.5 + 0.5) * radius;
      const targetX = x + dir * dist;
      const targetY = y - (Math.random() * 25);
      this.emitElectricArc(x, y - 10, targetX, targetY, color, 2);
    }
    // Raios verticais para cima
    for (let i = 0; i < 3; i++) {
      const topX = x + (Math.random() - 0.5) * 120;
      const topY = y - Math.random() * 140 - 40;
      this.emitElectricArc(x, y - 5, topX, topY, '#ff0033', 1);
    }
    // Detritos de terra e faíscas incandescentes
    this.emitSparks(x, y - 15, color, 30, 14);
    this.emitSparks(x, y - 15, '#ffaa00', 20, 10);
    this.emitDust(x, y, 16, 'rgba(239, 68, 68, 0.4)');
  }

  // --- TEXTO FLUTUANTE (DANO / CRÍTICO / BLOCK) ---
  emitFloatingText(text, x, y, color = '#ffffff', isCrit = false) {
    this.floatingTexts.push({
      text,
      x: x + (Math.random() - 0.5) * 20,
      y,
      vy: -2.5,
      color,
      alpha: 1,
      life: 1,
      decay: 0.02,
      scale: isCrit ? 1.4 : 1.0,
      isCrit,
    });
  }

  // --- RASTRO DE FANTASMA / AFTERIMAGE ---
  addMotionTrail(snapshot) {
    this.motionTrails.push({
      ...snapshot,
      alpha: 0.6,
      decay: 0.08,
    });
  }

  // --- POEIRA DE PULO / IMPACTO ---
  emitDust(x, y, count = 8, color = 'rgba(180, 180, 200, 0.6)') {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y - Math.random() * 6,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 2 - 0.5,
        color,
        size: Math.random() * 5 + 3,
        alpha: 0.7,
        life: 1,
        decay: 0.04,
        gravity: -0.02, // Flutua para cima levemente
      });
    }
  }

  update(dt = 1) {
    // Normaliza dt para a taxa padrão de 60 FPS (dt normal em loop é ~0.016s)
    // Se dt for passado como frames (ex: 1), mantém 1. Se for segundos (~0.016), multiplica por 60.
    const step = dt < 0.2 ? dt * 60 : dt;

    // Atualizar partículas (faíscas, poeira)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * step;
      p.y += p.vy * step;
      p.vy += p.gravity * step;
      p.alpha -= p.decay * step;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Atualizar arcos elétricos
    for (let i = this.lightningArcs.length - 1; i >= 0; i--) {
      const arc = this.lightningArcs[i];
      arc.alpha -= arc.decay * step;
      if (arc.alpha <= 0) {
        this.lightningArcs.splice(i, 1);
      }
    }

    // Atualizar ondas de choque
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.radius += s.speed * step;
      s.alpha = Math.max(0, 1 - (s.radius / s.maxRadius));
      if (s.radius >= s.maxRadius || s.alpha <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Atualizar textos flutuantes
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * step;
      ft.alpha -= ft.decay * step;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Atualizar rastros de movimento
    for (let i = this.motionTrails.length - 1; i >= 0; i--) {
      const t = this.motionTrails[i];
      t.alpha -= t.decay * step;
      if (t.alpha <= 0) {
        this.motionTrails.splice(i, 1);
      }
    }

    // Atualizar cortes de espada
    for (let i = this.slashLines.length - 1; i >= 0; i--) {
      const s = this.slashLines[i];
      s.alpha -= s.decay * step;
      if (s.alpha <= 0) {
        this.slashLines.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    ctx.save();

    // 1. Desenhar rastros de fantasma (Afterimages)
    for (const trail of this.motionTrails) {
      ctx.save();
      ctx.globalAlpha = trail.alpha * 0.5;
      if (trail.draw) {
        trail.draw(ctx);
      }
      ctx.restore();
    }

    // 2. Desenhar cortes de espada / florete (Blade Waltz)
    for (const s of this.slashLines) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, s.alpha);
      ctx.strokeStyle = s.color || '#38bdf8';
      ctx.shadowColor = s.color || '#38bdf8';
      ctx.shadowBlur = 18;
      ctx.lineWidth = s.width || 3.5;
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      ctx.stroke();

      // Núcleo branco no centro do corte
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1, (s.width || 3.5) * 0.4);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Desenhar ondas de choque
    for (const s of this.shockwaves) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.strokeStyle = s.color;
      ctx.lineWidth = Math.max(1, 4 * s.alpha);
      ctx.globalAlpha = s.alpha;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.restore();
    }

    // 4. Desenhar arcos elétricos
    for (const arc of this.lightningArcs) {
      ctx.save();
      ctx.globalAlpha = arc.alpha;
      ctx.strokeStyle = arc.color;
      ctx.lineWidth = arc.width;
      ctx.shadowColor = arc.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      for (const seg of arc.segments) {
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
      }
      ctx.stroke();

      // Núcleo branco no centro do raio elétrico
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = arc.width * 0.4;
      ctx.stroke();
      ctx.restore();
    }

    // 5. Desenhar partículas
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 6. Desenhar textos flutuantes
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.fillStyle = ft.color;
      ctx.font = `bold ${ft.isCrit ? '22px' : '16px'} 'Segoe UI', Impact, sans-serif`;
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    ctx.restore();
  }
}
