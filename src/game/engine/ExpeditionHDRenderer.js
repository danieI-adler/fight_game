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
    const themeColor = char.themeColor || '#0ea5e9';
    const glowColor = char.glowColor || 'rgba(14, 165, 233, 0.85)';
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

    // 4. Efeito de Aura por Nível de Poder/Energia (Gustave: <33% sem aura, 33-66% Amarela, 66-100% Roxa, 100%/Ult Vermelha com Raios)
    const energy = fighter.energy || 0;
    const isGustave = Number(char.id) === 101 || Number(char.id) === 1 || (char.name || '').toLowerCase().includes('gustave') || vis.hasMechanicalArm;

    let auraColor = null;
    let auraGlow = null;
    let auraRadius = 110;
    let auraPulseSpeed = 8;
    let isRedLightning = false;

    if (isGustave) {
      if (energy >= 100 || state === FIGHTER_STATE.SUPER_MOVE) {
        auraColor = '#ef4444'; // Vermelho com raios
        auraGlow = 'rgba(239, 68, 68, 0.95)';
        auraRadius = 130;
        auraPulseSpeed = 18;
        isRedLightning = true;
      } else if (energy >= 66) {
        auraColor = '#a855f7'; // Roxo arcano
        auraGlow = 'rgba(168, 85, 247, 0.9)';
        auraRadius = 120;
        auraPulseSpeed = 12;
      } else if (energy >= 33) {
        auraColor = '#eab308'; // Amarelo dourado
        auraGlow = 'rgba(234, 179, 8, 0.85)';
        auraRadius = 115;
        auraPulseSpeed = 8;
      }
    } else {
      if (energy >= 100 || state === FIGHTER_STATE.SUPER_MOVE) {
        auraColor = char.themeColor || '#0ea5e9';
        auraGlow = char.glowColor || 'rgba(14, 165, 233, 0.85)';
      }
    }

    if (auraColor) {
      // Aura volumétrica suave atrás do personagem
      ctx.save();
      const pulse = 1 + Math.sin(time * auraPulseSpeed) * 0.08;
      const rad = auraRadius * pulse;
      const auraGrad = ctx.createRadialGradient(0, -60, 20, 0, -60, rad);
      auraGrad.addColorStop(0, `rgba(${this.hexToRgb(auraColor)}, 0.45)`);
      auraGrad.addColorStop(0.6, `rgba(${this.hexToRgb(auraColor)}, 0.18)`);
      auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, -60, rad, 0, Math.PI * 2);
      ctx.fill();

      // Raios vermelhos estalando ao redor da aura a 100% de energia
      if (isRedLightning) {
        ctx.strokeStyle = '#fca5a5';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 15;
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          const arcAng = time * 8 + (i * Math.PI) / 2;
          const sx = Math.cos(arcAng) * 50;
          const sy = -60 + Math.sin(arcAng) * 50;
          const ex = sx + (Math.random() - 0.5) * 45;
          const ey = sy + (Math.random() - 0.5) * 45;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo((sx + ex) / 2 + (Math.random() - 0.5) * 20, (sy + ey) / 2 + (Math.random() - 0.5) * 20);
          ctx.lineTo(ex, ey);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // 5. Renderização do Retrato HD do Personagem
    const imageSrc = fighter.isHulk ? './assets/expedition33/hulk_transformed.png' : char.image;
    const img = this.getImage(imageSrc);
    const spriteWidth = fighter.isHulk ? 210 : 140;
    const spriteHeight = fighter.isHulk ? 240 : 180;
    const spriteX = -spriteWidth / 2;
    const spriteY = -spriteHeight + 15;

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.save();

      // Recorte com bordas suaves e moldura de silhueta
      ctx.shadowColor = auraGlow || glowColor;
      ctx.shadowBlur = (state === FIGHTER_STATE.SUPER_MOVE || state === FIGHTER_STATE.SPECIAL_1 || energy >= 100) ? 30 : (auraColor ? 20 : 10);

      // Desenha imagem HD principal
      ctx.drawImage(img, spriteX, spriteY, spriteWidth, spriteHeight);

      // Luz de Recorte (Rim Light) na borda do corpo com cor da aura
      ctx.globalCompositeOperation = 'source-atop';
      const rimGrad = ctx.createLinearGradient(-spriteWidth / 2, 0, spriteWidth / 2, 0);
      rimGrad.addColorStop(0, `rgba(${this.hexToRgb(auraColor || themeColor)}, 0.55)`);
      rimGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.2)');
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
    this.drawCharacterSpecifics(ctx, fighter, char, vis, time, state, stateTime, energy);

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

  static drawCharacterSpecifics(ctx, fighter, char, vis, time, state, stateTime, energy = 0) {
    const f = 1; // Já transformado pelo contexto

    // A. Gustave: Núcleo Overcharge e Manopla Mecânica com Aura Dinâmica
    if (vis.hasMechanicalArm) {
      ctx.save();
      const isSuper = state === FIGHTER_STATE.SUPER_MOVE;
      let coreColor = '#38bdf8'; // < 33%: Azul sutil padrão
      let coreGlow = '#0284c7';
      let sparkColor = '#e0f2fe';
      let arcCount = 1;
      let coreSize = 5;

      if (energy >= 100 || isSuper) {
        coreColor = '#ef4444'; // 100%: Vermelho de raios
        coreGlow = '#ff0033';
        sparkColor = '#fca5a5';
        arcCount = 4;
        coreSize = 8;
      } else if (energy >= 66) {
        coreColor = '#a855f7'; // 66-100%: Roxo
        coreGlow = '#c084fc';
        sparkColor = '#f3e8ff';
        arcCount = 2;
        coreSize = 6.5;
      } else if (energy >= 33) {
        coreColor = '#facc15'; // 33-66%: Amarelo
        coreGlow = '#eab308';
        sparkColor = '#fef08a';
        arcCount = 2;
        coreSize = 6;
      }

      const pulse = Math.sin(time * (energy >= 100 ? 20 : 12)) * 0.3 + 0.7;
      ctx.fillStyle = coreColor;
      ctx.shadowColor = coreGlow;
      ctx.shadowBlur = energy >= 100 ? 28 : (energy >= 33 ? 20 : 12);
      ctx.beginPath();
      ctx.arc(22, -65, coreSize * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Centro branco superaquecido para 100% de poder
      if (energy >= 100 || isSuper) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(22, -65, 3.5 * pulse, 0, Math.PI * 2);
        ctx.fill();
      }

      // Raios elétricos saindo da manopla
      for (let i = 0; i < arcCount; i++) {
        if (Math.random() < 0.65 || isSuper || state === FIGHTER_STATE.SPECIAL_1 || state === FIGHTER_STATE.HEAVY_PUNCH) {
          ctx.strokeStyle = sparkColor;
          ctx.lineWidth = energy >= 100 ? 2.5 : 1.5;
          ctx.beginPath();
          ctx.moveTo(22, -65);
          const range = energy >= 100 ? 55 : (energy >= 33 ? 35 : 25);
          ctx.lineTo(22 + (Math.random() - 0.5) * range, -65 + (Math.random() - 0.5) * range);
          ctx.stroke();
        }
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
    ctx.save();
    // Hurtboxes (Verde)
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.85)';
    ctx.lineWidth = 1.5;
    for (const box of fighter.getHurtboxes()) {
      ctx.strokeRect(box.x, box.y, box.width, box.height);
    }

    // Hitbox ativa (Vermelha)
    if (fighter.activeHitbox) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
      const hb = fighter.activeHitbox;
      ctx.fillRect(hb.x, hb.y, hb.width, hb.height);
      ctx.strokeRect(hb.x, hb.y, hb.width, hb.height);
    }
    ctx.restore();
  }
}
