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
  }

  reset() {
    this.particles = [];
    this.lightningArcs = [];
    this.shockwaves = [];
    this.floatingTexts = [];
    this.motionTrails = [];
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
    // Atualizar partículas
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.alpha -= p.decay * dt;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Atualizar arcos elétricos
    for (let i = this.lightningArcs.length - 1; i >= 0; i--) {
      const arc = this.lightningArcs[i];
      arc.alpha -= arc.decay * dt;
      if (arc.alpha <= 0) {
        this.lightningArcs.splice(i, 1);
      }
    }

    // Atualizar ondas de choque
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.radius += s.speed * dt;
      s.alpha = Math.max(0, 1 - (s.radius / s.maxRadius));
      if (s.radius >= s.maxRadius || s.alpha <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Atualizar textos flutuantes
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.alpha -= ft.decay * dt;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Atualizar rastros de movimento
    for (let i = this.motionTrails.length - 1; i >= 0; i--) {
      const t = this.motionTrails[i];
      t.alpha -= t.decay * dt;
      if (t.alpha <= 0) {
        this.motionTrails.splice(i, 1);
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

    // 2. Desenhar ondas de choque
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

    // 3. Desenhar arcos elétricos
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

    // 4. Desenhar partículas
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

    // 5. Desenhar textos flutuantes
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
