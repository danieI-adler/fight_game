import { FIGHTER_STATE } from './Fighter';

/**
 * Renderizador de Combate 2D HD (Clair Obscur: Expedition 33)
 * Projeta os retratos e texturas em altíssima definição dos combatentes
 * com iluminação Chiaroscuro dramática, luz de recorte (Rim Light),
 * física de respiração, armas cintilantes e partículas de tinta mágica.
 */
export class ExpeditionHDRenderer {
  static imageCache = new Map();
  static loadedImages = new Set();

  static getImage(src) {
    if (!src) return null;
    if (this.imageCache.has(src)) {
      return this.imageCache.get(src);
    }
    const img = new Image();
    img.src = src;
    img.onload = () => {
      this.loadedImages.add(src);
    };
    this.imageCache.set(src, img);
    return img;
  }

  static draw(ctx, fighter, showHitboxes = false) {
    const char = fighter.charData;
    const vis = char.visual || {};
    const x = fighter.position.x;
    const y = fighter.position.y;
    const f = fighter.facing; // 1 = direita, -1 = esquerda
    const state = fighter.state;
    const time = performance.now() / 1000;
    const stateTime = fighter.stateTime || 0;

    ctx.save();

    // 1. Sombra de Contato Volumétrica Suave (Ground Shadow)
    const groundDist = Math.max(0, (fighter.groundY || 620) - y);
    const shadowScale = Math.max(0.3, 1 - groundDist / 250);
    const shadowAlpha = Math.max(0.1, 0.45 - groundDist / 400);

    ctx.save();
    ctx.translate(x, fighter.groundY || 620);
    ctx.scale(shadowScale, shadowScale * 0.35);
    const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, 50);
    grad.addColorStop(0, `rgba(0, 0, 0, ${shadowAlpha})`);
    grad.addColorStop(0.6, `rgba(0, 0, 0, ${shadowAlpha * 0.5})`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Animação Procedural de Respiração & Deslocamento por Estado
    let breathY = 0;
    let breathScale = 1;
    let tiltAngle = 0;
    let stretchX = 1;
    let stretchY = 1;
    let offsetX = 0;
    let offsetY = 0;

    switch (state) {
      case FIGHTER_STATE.IDLE:
        breathY = Math.sin(time * 3 + (fighter.isPlayer2 ? 1.5 : 0)) * 2.5;
        breathScale = 1 + Math.sin(time * 3) * 0.015;
        tiltAngle = Math.sin(time * 1.5) * 0.02 * f;
        break;

      case FIGHTER_STATE.WALK_FORWARD:
        breathY = Math.abs(Math.sin(time * 10)) * -6;
        tiltAngle = 0.08 * f;
        stretchX = 1.02;
        break;

      case FIGHTER_STATE.WALK_BACK:
        breathY = Math.abs(Math.sin(time * 8)) * -4;
        tiltAngle = -0.06 * f;
        break;

      case FIGHTER_STATE.DASH_FORWARD:
        offsetX = 15 * f;
        offsetY = 10;
        tiltAngle = 0.25 * f;
        stretchX = 1.15;
        stretchY = 0.88;
        break;

      case FIGHTER_STATE.DASH_BACK:
        offsetX = -12 * f;
        offsetY = 8;
        tiltAngle = -0.2 * f;
        stretchX = 1.1;
        break;

      case FIGHTER_STATE.JUMP:
      case FIGHTER_STATE.JUMP_FORWARD:
      case FIGHTER_STATE.JUMP_BACK:
        tiltAngle = (fighter.velocity.x * 0.02) * f;
        stretchY = 1.08;
        stretchX = 0.94;
        break;

      case FIGHTER_STATE.LIGHT_PUNCH: {
        const ext = Math.sin(Math.min(1, stateTime / 0.18) * Math.PI);
        offsetX = ext * 22 * f;
        tiltAngle = ext * 0.12 * f;
        stretchX = 1 + ext * 0.1;
        break;
      }

      case FIGHTER_STATE.HEAVY_PUNCH: {
        const ext = Math.sin(Math.min(1, stateTime / 0.35) * Math.PI);
        offsetX = ext * 35 * f;
        offsetY = ext * 4;
        tiltAngle = ext * 0.22 * f;
        stretchX = 1 + ext * 0.18;
        break;
      }

      case FIGHTER_STATE.LIGHT_KICK: {
        const ext = Math.sin(Math.min(1, stateTime / 0.24) * Math.PI);
        offsetX = ext * 18 * f;
        tiltAngle = -ext * 0.08 * f;
        break;
      }

      case FIGHTER_STATE.HEAVY_KICK: {
        const ext = Math.sin(Math.min(1, stateTime / 0.42) * Math.PI);
        offsetX = ext * 30 * f;
        offsetY = -ext * 8;
        tiltAngle = -ext * 0.18 * f;
        stretchX = 1 + ext * 0.15;
        break;
      }

      case FIGHTER_STATE.CROUCH:
      case FIGHTER_STATE.CROUCH_PUNCH:
      case FIGHTER_STATE.CROUCH_KICK:
        offsetY = 24;
        stretchY = 0.75;
        stretchX = 1.12;
        break;

      case FIGHTER_STATE.BLOCK:
      case FIGHTER_STATE.CROUCH_BLOCK:
        offsetX = -6 * f;
        offsetY = 6;
        tiltAngle = -0.1 * f;
        stretchX = 0.95;
        break;

      case FIGHTER_STATE.HURT: {
        const shake = (Math.random() - 0.5) * 8;
        offsetX = (-14 * f) + shake;
        tiltAngle = -0.22 * f;
        break;
      }

      case FIGHTER_STATE.KNOCKDOWN:
      case FIGHTER_STATE.DEFEAT:
        tiltAngle = -1.4 * f;
        offsetY = 45;
        stretchX = 1.2;
        stretchY = 0.6;
        break;

      case FIGHTER_STATE.SPECIAL_1:
      case FIGHTER_STATE.SPECIAL_2:
      case FIGHTER_STATE.SUPER_MOVE: {
        const pulse = Math.sin(time * 16) * 0.08;
        stretchX = 1.1 + pulse;
        stretchY = 1.1 + pulse;
        tiltAngle = 0.15 * f;
        break;
      }
    }

    // 3. Aplica Transformação Centralizada no Lutador
    ctx.translate(x + offsetX, y + breathY + offsetY);
    ctx.scale(f * stretchX * breathScale, stretchY * breathScale);
    ctx.rotate(tiltAngle);

    // 4. Efeito de Aura Chiaroscuro / Luz de Recorte
    const themeColor = char.themeColor || '#0ea5e9';
    const glowColor = char.glowColor || 'rgba(14, 165, 233, 0.85)';

    // Aura volumétrica suave atrás do personagem
    ctx.save();
    const auraGrad = ctx.createRadialGradient(0, -60, 20, 0, -60, 110);
    auraGrad.addColorStop(0, `rgba(${this.hexToRgb(themeColor)}, 0.28)`);
    auraGrad.addColorStop(0.7, `rgba(${this.hexToRgb(themeColor)}, 0.08)`);
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, -60, 110, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 5. Renderização do Retrato HD do Personagem
    const img = this.getImage(char.image);
    const spriteWidth = 140;
    const spriteHeight = 180;
    const spriteX = -spriteWidth / 2;
    const spriteY = -spriteHeight + 15;

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.save();

      // Recorte com bordas suaves e moldura de silhueta
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = (state === FIGHTER_STATE.SUPER_MOVE || state === FIGHTER_STATE.SPECIAL_1) ? 28 : 12;

      // Desenha imagem HD principal
      ctx.drawImage(img, spriteX, spriteY, spriteWidth, spriteHeight);

      // Luz de Recorte (Rim Light) na borda do corpo
      ctx.globalCompositeOperation = 'source-atop';
      const rimGrad = ctx.createLinearGradient(-spriteWidth / 2, 0, spriteWidth / 2, 0);
      rimGrad.addColorStop(0, `rgba(${this.hexToRgb(themeColor)}, 0.45)`);
      rimGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.15)');
      rimGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.3)');
      rimGrad.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
      ctx.fillStyle = rimGrad;
      ctx.fillRect(spriteX, spriteY, spriteWidth, spriteHeight);

      // Efeito de Dano / Flash Branco no impacto
      if (fighter.hitstunTime > 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.fillRect(spriteX, spriteY, spriteWidth, spriteHeight);
      }

      ctx.restore();
    }

    // 6. Efeitos Visuais & Armas Dinâmicas HD por Personagem
    this.drawCharacterSpecifics(ctx, fighter, char, vis, time, state, stateTime);

    // 7. Efeito de Escudo ao Bloquear
    if (state === FIGHTER_STATE.BLOCK || state === FIGHTER_STATE.CROUCH_BLOCK) {
      this.drawBlockShield(ctx, themeColor, time);
    }

    ctx.restore();

    // 8. Hitboxes de depuração (se habilitado)
    if (showHitboxes) {
      this.drawDebugHitboxes(ctx, fighter);
    }
  }

  static drawCharacterSpecifics(ctx, fighter, char, vis, time, state, stateTime) {
    const f = 1; // Já transformado pelo contexto

    // A. Gustave: Núcleo Overcharge do Braço Dourado
    if (vis.hasMechanicalArm) {
      ctx.save();
      const pulse = Math.sin(time * 12) * 0.3 + 0.7;
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(22, -65, 5 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Faíscas elétricas de sobrecarga
      if (Math.random() < 0.4 || state === FIGHTER_STATE.SPECIAL_1 || state === FIGHTER_STATE.HEAVY_PUNCH) {
        ctx.strokeStyle = '#e0f2fe';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(22, -65);
        ctx.lineTo(22 + (Math.random() - 0.5) * 25, -65 + (Math.random() - 0.5) * 25);
        ctx.stroke();
      }
      ctx.restore();
    }

    // B. Lune: Orbes Astrais Celestiais Flutuantes
    if (vis.weaponType === 'astral_orbs' || char.id === 103) {
      ctx.save();
      for (let i = 0; i < 3; i++) {
        const ang = time * 3.5 + (i * Math.PI * 2) / 3;
        const ox = Math.cos(ang) * 45;
        const oy = -75 + Math.sin(ang) * 18;

        // Rastro de luz estelar
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 16;
        ctx.fillStyle = '#f3e8ff';
        ctx.beginPath();
        ctx.arc(ox, oy, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(192, 132, 252, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, -75, 45, ang - 0.4, ang);
        ctx.stroke();
      }
      ctx.restore();
    }

    // C. Sciel: Fitas Douradas Esvoaçantes & Lâminas Solares
    if (vis.hasGoldRibbons || char.id === 104) {
      ctx.save();
      const wave = Math.sin(time * 6) * 12;
      ctx.strokeStyle = '#fbbf24';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-10, -50);
      ctx.quadraticCurveTo(-35, -35 + wave, -55, -20 + wave * 1.5);
      ctx.stroke();
      ctx.restore();
    }

    // D. La Peintresse: Pinceladas de Tinta Cósmica (L'Encre)
    if (vis.isPaintress || char.id === 109) {
      ctx.save();
      const inkFlow = (time * 40) % 60;
      ctx.fillStyle = 'rgba(251, 191, 36, 0.85)';
      ctx.shadowColor = '#d97706';
      ctx.shadowBlur = 14;

      // Gotas de tinta dourada suspensa
      for (let i = 0; i < 4; i++) {
        const iy = -110 + ((inkFlow + i * 25) % 90);
        const ix = 35 + Math.sin(iy * 0.08) * 14;
        ctx.beginPath();
        ctx.arc(ix, iy, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // E. Efeito de Corte em Ataques Físicos
    if (state === FIGHTER_STATE.LIGHT_PUNCH || state === FIGHTER_STATE.HEAVY_PUNCH ||
        state === FIGHTER_STATE.LIGHT_KICK || state === FIGHTER_STATE.HEAVY_KICK ||
        state === FIGHTER_STATE.SPECIAL_1 || state === FIGHTER_STATE.SUPER_MOVE) {
      this.drawSlashTrail(ctx, char.themeColor, stateTime, state);
    }
  }

  static drawSlashTrail(ctx, color, stateTime, state) {
    ctx.save();
    const progress = Math.min(1, stateTime / 0.3);
    const alpha = Math.sin(progress * Math.PI);
    if (alpha <= 0.05) {
      ctx.restore();
      return;
    }

    ctx.strokeStyle = color || '#38bdf8';
    ctx.shadowColor = color || '#38bdf8';
    ctx.shadowBlur = 16;
    ctx.lineWidth = state === FIGHTER_STATE.SUPER_MOVE ? 6 : 3.5;
    ctx.globalAlpha = alpha;

    ctx.beginPath();
    ctx.arc(20, -65, 55, -Math.PI * 0.4, Math.PI * 0.4);
    ctx.stroke();

    // Arco de brilho interno branco
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(20, -65, 53, -Math.PI * 0.3, Math.PI * 0.3);
    ctx.stroke();

    ctx.restore();
  }

  static drawBlockShield(ctx, color, time) {
    ctx.save();
    const pulse = Math.sin(time * 10) * 0.1 + 0.9;
    ctx.strokeStyle = color || '#38bdf8';
    ctx.shadowColor = color || '#38bdf8';
    ctx.shadowBlur = 18;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.75;

    ctx.beginPath();
    ctx.ellipse(32, -65, 18 * pulse, 55 * pulse, 0, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.stroke();

    // Gradiente interno do escudo
    const grad = ctx.createLinearGradient(15, 0, 45, 0);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    grad.addColorStop(1, `rgba(${this.hexToRgb(color)}, 0.25)`);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.restore();
  }

  static hexToRgb(hex) {
    if (!hex) return '14, 165, 233';
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length === 6) {
      const r = parseInt(cleanHex.substring(0, 2), 16);
      const g = parseInt(cleanHex.substring(2, 4), 16);
      const b = parseInt(cleanHex.substring(4, 6), 16);
      return `${r}, ${g}, ${b}`;
    }
    return '14, 165, 233';
  }

  static drawDebugHitboxes(ctx, fighter) {
    // Hurtbox (Verde)
    ctx.save();
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      fighter.position.x - 30,
      fighter.position.y - 120,
      60,
      120
    );

    // Hitbox ativa (Vermelha)
    if (fighter.activeHitbox) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
      const hb = fighter.activeHitbox;
      ctx.fillRect(hb.x, hb.y, hb.width, hb.height);
      ctx.strokeRect(hb.x, hb.y, hb.width, hb.height);
    }
    ctx.restore();
  }
}
