/**
 * Gerenciador de Arenas e Cenários com Parallax
 */

export const STAGES = [
  {
    id: 'cyber_arena',
    name: 'Neo Cyber Arena',
    groundY: 560,
    width: 2000,
    height: 720,
    theme: {
      sky: ['#0f0c29', '#302b63', '#24243e'],
      gridColor: 'rgba(0, 240, 255, 0.25)',
      groundColor: '#10101c',
      accentColor: '#00f0ff',
      buildingColors: ['#16132b', '#1e1a38', '#2a244d']
    }
  },
  {
    id: 'electric_dojo',
    name: 'Dojo Elétrico',
    groundY: 560,
    width: 2000,
    height: 720,
    theme: {
      sky: ['#050505', '#1a002b', '#0d001a'],
      gridColor: 'rgba(168, 85, 247, 0.3)',
      groundColor: '#120b1f',
      accentColor: '#c084fc',
      buildingColors: ['#180f28', '#25173e', '#36225a']
    }
  },
  {
    id: 'volcano_core',
    name: 'Cratera Vulcânica',
    groundY: 560,
    width: 2000,
    height: 720,
    theme: {
      sky: ['#2b0500', '#541200', '#1f0000'],
      gridColor: 'rgba(255, 85, 0, 0.35)',
      groundColor: '#1a0d08',
      accentColor: '#ff4400',
      buildingColors: ['#2d1109', '#3f180e', '#5a2213']
    }
  },
  {
    id: 'cosmic_void',
    name: 'Vácuo Cósmico',
    groundY: 560,
    width: 2000,
    height: 720,
    theme: {
      sky: ['#020014', '#080826', '#0f051d'],
      gridColor: 'rgba(99, 102, 241, 0.3)',
      groundColor: '#0d0e1c',
      accentColor: '#818cf8',
      buildingColors: ['#13142e', '#1c1f45', '#272b5f']
    }
  }
];

export class Stage {
  constructor(stageId = 'cyber_arena') {
    this.stageData = STAGES.find(s => s.id === stageId) || STAGES[0];
    this.groundY = this.stageData.groundY;
    this.width = this.stageData.width;
    this.height = this.stageData.height;
    this.time = 0;
  }

  setStage(stageId) {
    this.stageData = STAGES.find(s => s.id === stageId) || STAGES[0];
    this.groundY = this.stageData.groundY;
    this.width = this.stageData.width;
    this.height = this.stageData.height;
  }

  update(dt = 1 / 60) {
    this.time += dt;
  }

  draw(ctx, camera) {
    const { sky, gridColor, groundColor, accentColor, buildingColors } = this.stageData.theme;

    // 1. Fundo Gradiente Estático / Parallax Céu
    const grad = ctx.createLinearGradient(0, 0, 0, this.groundY);
    grad.addColorStop(0, sky[0]);
    grad.addColorStop(0.6, sky[1]);
    grad.addColorStop(1, sky[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, -200, this.width, this.groundY + 200);

    // 2. Silhuetas de Prédios/Estruturas com Parallax
    const camX = camera ? camera.x : 0;
    ctx.save();
    for (let layer = 0; layer < 3; layer++) {
      ctx.fillStyle = buildingColors[layer];
      const speed = 0.2 + layer * 0.15;
      const count = 14;
      const spacing = 160;

      for (let i = -2; i < count; i++) {
        const bx = i * spacing - (camX * speed) % spacing;
        const bw = 100 + ((i * 37) % 60);
        const bh = 180 + ((i * 53) % 200) + layer * 40;
        const by = this.groundY - bh;

        ctx.fillRect(bx, by, bw, bh);

        // Luzes de janelas nos prédios
        if (layer > 0) {
          ctx.fillStyle = (i + layer) % 2 === 0 ? accentColor : 'rgba(255, 255, 255, 0.4)';
          ctx.globalAlpha = 0.3 + 0.2 * Math.sin(this.time * 2 + i);
          for (let wy = by + 20; wy < this.groundY - 30; wy += 35) {
            ctx.fillRect(bx + 15, wy, 8, 12);
            ctx.fillRect(bx + bw - 25, wy, 8, 12);
          }
          ctx.globalAlpha = 1.0;
          ctx.fillStyle = buildingColors[layer];
        }
      }
    }
    ctx.restore();

    // 3. Lua / Sol Gigante de Fundo
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.width / 2, 220, 110, 0, Math.PI * 2);
    ctx.fillStyle = accentColor;
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 40;
    ctx.globalAlpha = 0.25;
    ctx.fill();
    ctx.restore();

    // 4. Chão com Linhas Cibernéticas / Grid de Perspectiva
    ctx.fillStyle = groundColor;
    ctx.fillRect(0, this.groundY, this.width, this.height - this.groundY + 200);

    // Linha superior brilhante do chão
    ctx.save();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 4;
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(0, this.groundY);
    ctx.lineTo(this.width, this.groundY);
    ctx.stroke();

    // Grid no chão
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 0;
    const gridSpacing = 60;
    for (let x = 0; x < this.width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, this.groundY);
      ctx.lineTo(x + (x - this.width / 2) * 0.5, this.height + 200);
      ctx.stroke();
    }
    for (let y = this.groundY; y < this.height + 200; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
    ctx.restore();
  }
}
