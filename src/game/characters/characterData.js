/**
 * Definições dos 20 Personagens do Jogo (Personagem 1 até Personagem 20)
 * Cada lutador possui paleta de cores própria, estilo de luta, atributos balanceados
 * e slots modulares para injeção de habilidades especiais personalizadas.
 */

export const CHARACTERS = [
  {
    id: 1,
    name: 'Personagem 1',
    title: 'Mestre do Relâmpago',
    themeColor: '#00f0ff',
    secondaryColor: '#0066ff',
    glowColor: 'rgba(0, 240, 255, 0.8)',
    energyColor: '#7df9ff',
    style: 'Electric Strike',
    avatarIcon: '⚡',
    stats: {
      health: 1000,
      speed: 7.2,
      jumpForce: 17.5,
      attackPower: 1.05,
      defense: 1.0,
      energyRegen: 1.2,
    },
    stance: 'balanced',
    description: 'Especialista em golpes rápidos e ataques envoltos em arcos voltaicos.',
    specialMoves: [
      { name: 'Relâmpago Direto', command: '↓ ➔ + Soco', cost: 25, type: 'projectile' },
      { name: 'Salto Eletrizante', command: '➔ ↓ ➔ + Chute', cost: 35, type: 'anti-air' },
      { name: 'Sobrecarga Voltaica (Super)', command: '↓ ➔ ↓ ➔ + Soco Forte', cost: 100, type: 'ultimate' }
    ]
  },
  {
    id: 2,
    name: 'Personagem 2',
    title: 'Fúria Carmesim',
    themeColor: '#ff2a2a',
    secondaryColor: '#8b0000',
    glowColor: 'rgba(255, 42, 42, 0.8)',
    energyColor: '#ff7373',
    style: 'Flaming Brawler',
    avatarIcon: '🔥',
    stats: {
      health: 1050,
      speed: 6.8,
      jumpForce: 16.5,
      attackPower: 1.18,
      defense: 1.05,
      energyRegen: 0.95,
    },
    stance: 'heavy',
    description: 'Golpes pesados com grande alcance e rajadas de calor explosivas.',
    specialMoves: [
      { name: 'Punho do Dragão', command: '↓ ➔ + Soco', cost: 25, type: 'dash-strike' },
      { name: 'Chute Giratório Flamejante', command: '↓ ⬅ + Chute', cost: 30, type: 'spin-kick' },
      { name: 'Inferno Explosivo (Super)', command: '↓ ➔ ↓ ➔ + Soco Forte', cost: 100, type: 'ultimate' }
    ]
  },
  {
    id: 3,
    name: 'Personagem 3',
    title: 'Sombra Cibernética',
    themeColor: '#9d4edd',
    secondaryColor: '#3c096c',
    glowColor: 'rgba(157, 78, 221, 0.8)',
    energyColor: '#c77dff',
    style: 'Shadow Ninja',
    avatarIcon: '🌌',
    stats: {
      health: 920,
      speed: 8.5,
      jumpForce: 18.8,
      attackPower: 0.95,
      defense: 0.9,
      energyRegen: 1.3,
    },
    stance: 'agile',
    description: 'Extremamente ágil, esquivas rápidas e golpes em sequências alucinantes.',
    specialMoves: [
      { name: 'Teleporte Sombrio', command: '↓ ⬅ + Soco', cost: 20, type: 'teleport' },
      { name: 'Adagas de Vácuo', command: '↓ ➔ + Soco', cost: 25, type: 'projectile' },
      { name: 'Execução do Vácuo (Super)', command: '↓ ➔ ↓ ➔ + Chute Forte', cost: 100, type: 'ultimate' }
    ]
  },
  {
    id: 4,
    name: 'Personagem 4',
    title: 'Titã de Rocha',
    themeColor: '#e0a96d',
    secondaryColor: '#7c4a03',
    glowColor: 'rgba(224, 169, 109, 0.8)',
    energyColor: '#ffd79e',
    style: 'Earth Juggernaut',
    avatarIcon: '🪨',
    stats: {
      health: 1250,
      speed: 5.5,
      jumpForce: 15.0,
      attackPower: 1.3,
      defense: 1.25,
      energyRegen: 0.8,
    },
    stance: 'titan',
    description: 'Armadura pesada com grande absorção de dano e agarrões devastadores.',
    specialMoves: [
      { name: 'Impacto Sísmico', command: '↓ ↓ + Soco', cost: 25, type: 'ground-slam' },
      { name: 'Arremesso Brutal', command: '➔ ➔ + Soco Forte', cost: 35, type: 'grab' },
      { name: 'Terremoto Cataclísmico (Super)', command: '↓ ➔ ↓ ➔ + Soco Forte', cost: 100, type: 'ultimate' }
    ]
  },
  {
    id: 5,
    name: 'Personagem 5',
    title: 'Vendaval Esmeralda',
    themeColor: '#00ff88',
    secondaryColor: '#006633',
    glowColor: 'rgba(0, 255, 136, 0.8)',
    energyColor: '#80ffbf',
    style: 'Wind Acrobat',
    avatarIcon: '🌪️',
    stats: {
      health: 950,
      speed: 8.0,
      jumpForce: 19.5,
      attackPower: 1.0,
      defense: 0.95,
      energyRegen: 1.15,
    },
    stance: 'acrobatic',
    description: 'Luta aérea com chutes no ar e acrobacias imprevisíveis.',
    specialMoves: [
      { name: 'Tornado Ascendente', command: '➔ ↓ ➔ + Chute', cost: 30, type: 'anti-air' },
      { name: 'Lâmina de Vento', command: '↓ ➔ + Chute', cost: 25, type: 'projectile' },
      { name: 'Tufão Supremo (Super)', command: '↓ ➔ ↓ ➔ + Chute Forte', cost: 100, type: 'ultimate' }
    ]
  },
  {
    id: 6,
    name: 'Personagem 6',
    title: 'Zero Criogênico',
    themeColor: '#38bdf8',
    secondaryColor: '#0369a1',
    glowColor: 'rgba(56, 189, 248, 0.8)',
    energyColor: '#bae6fd',
    style: 'Cryo Martial',
    avatarIcon: '❄️',
    stats: {
      health: 980,
      speed: 6.9,
      jumpForce: 17.0,
      attackPower: 1.05,
      defense: 1.05,
      energyRegen: 1.1,
    },
    stance: 'balanced',
    description: 'Golpes gélidos que congelam e retardam a recuperação dos oponentes.',
    specialMoves: [
      { name: 'Esfera Glacial', command: '↓ ➔ + Soco', cost: 25, type: 'freeze' },
      { name: 'Deslize de Gelo', command: '↓ ➔ + Chute', cost: 25, type: 'slide' },
      { name: 'Era do Gelo (Super)', command: '↓ ➔ ↓ ➔ + Soco Forte', cost: 100, type: 'ultimate' }
    ]
  },
  {
    id: 7,
    name: 'Personagem 7',
    title: 'Solar Radiante',
    themeColor: '#facc15',
    secondaryColor: '#ca8a04',
    glowColor: 'rgba(250, 204, 21, 0.8)',
    energyColor: '#fef08a',
    style: 'Solar Flare',
    avatarIcon: '☀️',
    stats: {
      health: 1020,
      speed: 7.0,
      jumpForce: 17.2,
      attackPower: 1.1,
      defense: 1.0,
      energyRegen: 1.1,
    },
    stance: 'balanced',
    description: 'Energia fotônica que ofusca os inimigos com explosões de luz pura.',
    specialMoves: [
      { name: 'Raio Solar', command: '↓ ➔ + Soco', cost: 25, type: 'beam' },
      { name: 'Explosão Nova', command: '↓ ⬅ + Soco', cost: 35, type: 'burst' },
      { name: 'Supernova Radiante (Super)', command: '↓ ➔ ↓ ➔ + Soco Forte', cost: 100, type: 'ultimate' }
    ]
  },
  {
    id: 8,
    name: 'Personagem 8',
    title: 'Venenoso Tóxico',
    themeColor: '#a855f7',
    secondaryColor: '#581c87',
    glowColor: 'rgba(168, 85, 247, 0.8)',
    energyColor: '#e9d5ff',
    style: 'Venom Striker',
    avatarIcon: '🧪',
    stats: {
      health: 960,
      speed: 7.4,
      jumpForce: 17.8,
      attackPower: 1.02,
      defense: 0.98,
      energyRegen: 1.25,
    },
    stance: 'agile',
    description: 'Usa toxinas corrosivas e golpes ardilosos com efeito prolongado.',
    specialMoves: [
      { name: 'Poça Ácida', command: '↓ ➔ + Soco', cost: 25, type: 'hazard' },
      { name: 'Golpe Corrosivo', command: '➔ ➔ + Soco', cost: 30, type: 'strike' },
      { name: 'Chuva Tóxica (Super)', command: '↓ ➔ ↓ ➔ + Soco Forte', cost: 100, type: 'ultimate' }
    ]
  },
  {
    id: 9,
    name: 'Personagem 9',
    title: 'Cyborg Laser',
    themeColor: '#f43f5e',
    secondaryColor: '#881337',
    glowColor: 'rgba(244, 63, 94, 0.8)',
    energyColor: '#fecdd3',
    style: 'Cyber Mech',
    avatarIcon: '🤖',
    stats: {
      health: 1100,
      speed: 6.4,
      jumpForce: 16.0,
      attackPower: 1.15,
      defense: 1.12,
      energyRegen: 1.0,
    },
    stance: 'heavy',
    description: 'Braços mecânicos equipados com propulsores e disparadores de plasma.',
    specialMoves: [
      { name: 'Canhão de Plasma', command: '↓ ➔ + Soco', cost: 30, type: 'beam' },
      { name: 'Foguete Propulsor', command: '➔ ➔ + Chute', cost: 30, type: 'dash' },
      { name: 'Bombardeio Orbital (Super)', command: '↓ ➔ ↓ ➔ + Soco Forte', cost: 100, type: 'ultimate' }
    ]
  },
  {
    id: 10,
    name: 'Personagem 10',
    title: 'Espírito Espectral',
    themeColor: '#2dd4bf',
    secondaryColor: '#0f766e',
    glowColor: 'rgba(45, 212, 191, 0.8)',
    energyColor: '#99f6e4',
    style: 'Phantom Arts',
    avatarIcon: '👻',
    stats: {
      health: 900,
      speed: 8.3,
      jumpForce: 19.2,
      attackPower: 0.98,
      defense: 0.9,
      energyRegen: 1.35,
    },
    stance: 'agile',
    description: 'Capaz de atravessar golpes inimigos com intangibilidade momentânea.',
    specialMoves: [
      { name: 'Passo Fantasma', command: '↓ ⬅ + Chute', cost: 20, type: 'dodge' },
      { name: 'Garras Espirituais', command: '↓ ➔ + Soco', cost: 25, type: 'combo' },
      { name: 'Possessão Astral (Super)', command: '↓ ➔ ↓ ➔ + Soco Forte', cost: 100, type: 'ultimate' }
    ]
  },
  {
    id: 11,
    name: 'Personagem 11',
    title: 'Monge da Força',
    themeColor: '#fb923c',
    secondaryColor: '#9a3412',
    glowColor: 'rgba(251, 146, 60, 0.8)',
    energyColor: '#fed7aa',
    style: 'Chi Kung-Fu',
    avatarIcon: '🧘',
    stats: {
      health: 1000,
      speed: 7.3,
      jumpForce: 17.6,
      attackPower: 1.08,
      defense: 1.02,
      energyRegen: 1.15,
    },
    stance: 'balanced',
    description: 'Equilíbrio supremo entre mente e corpo, canalizando esferas de Chi.',
    specialMoves: [
      { name: 'Hadouken de Chi', command: '↓ ➔ + Soco', cost: 25, type: 'projectile' },
      { name: 'Chute dos Mil Pés', command: 'Chute rápido x3', cost: 25, type: 'multi-kick' },
      { name: 'Dragão Cósmico de Chi (Super)', command: '↓ ➔ ↓ ➔ + Soco Forte', cost: 100, type: 'ultimate' }
    ]
  },
  {
    id: 12,
    name: 'Personagem 12',
    title: 'Samurai Cibernético',
    themeColor: '#ec4899',
    secondaryColor: '#831843',
    glowColor: 'rgba(236, 72, 153, 0.8)',
    energyColor: '#fbcfe8',
    style: 'Neo-Iaido',
    avatarIcon: '⚔️',
    stats: {
      health: 970,
      speed: 7.6,
      jumpForce: 17.7,
      attackPower: 1.12,
      defense: 0.96,
      energyRegen: 1.1,
    },
    stance: 'balanced',
    description: 'Cortes precisos com lâminas de laser de alta frequência.',
    specialMoves: [
      { name: 'Corte Relâmpago', command: '➔ ➔ + Soco', cost: 30, type: 'slash-dash' },
      { name: 'Contra-Ataque Perfeito', command: '↓ ⬅ + Soco', cost: 25, type: 'parry' },
      { name: 'Dança das Mil Lâminas (Super)', command: '↓ ➔ ↓ ➔ + Soco Forte', cost: 100, type: 'ultimate' }
    ]
  },
  {
    id: 13,
    name: 'Personagem 13',
    title: 'Berserker Selvagem',
    themeColor: '#ef4444',
    secondaryColor: '#450a0a',
    glowColor: 'rgba(239, 68, 68, 0.8)',
    energyColor: '#fca5a5',
    style: 'Raw Savage',
    avatarIcon: '🐺',
    stats: {
      health: 1150,
      speed: 7.1,
      jumpForce: 17.0,
      attackPower: 1.22,
      defense: 0.95,
      energyRegen: 1.05,
    },
    stance: 'heavy',
    description: 'Fúria incontrolável: seu dano aumenta conforme sua vida diminui.',
    specialMoves: [
      { name: 'Investida Feroz', command: '➔ ➔ + Soco', cost: 25, type: 'charge' },
      { name: 'Mordida Sanguinária', command: '↓ ➔ + Soco', cost: 30, type: 'grab' },
      { name: 'Fúria do Berserker (Super)', command: '↓ ➔ ↓ ➔ + Soco Forte', cost: 100, type: 'ultimate' }
    ]
  },
  {
    id: 14,
    name: 'Personagem 14',
    title: 'Mestre da Gravidade',
    themeColor: '#6366f1',
    secondaryColor: '#312e81',
    glowColor: 'rgba(99, 102, 241, 0.8)',
    energyColor: '#c7d2fe',
    style: 'Gravity Shift',
    avatarIcon: '🪐',
    stats: {
      health: 990,
      speed: 6.8,
      jumpForce: 21.0,
      attackPower: 1.04,
      defense: 1.04,
      energyRegen: 1.2,
    },
    stance: 'balanced',
    description: 'Manipula campos gravitacionais para puxar ou empurrar oponentes.',
    specialMoves: [
      { name: 'Poço Gravitacional', command: '↓ ➔ + Soco', cost: 30, type: 'vortex' },
      { name: 'Queda Meteórica', command: '(No Ar) ↓ + Chute', cost: 25, type: 'dive-kick' },
      { name: 'Singularidade Negra (Super)', command: '↓ ➔ ↓ ➔ + Soco Forte', cost: 100, type: 'ultimate' }
    ]
  },
  {
    id: 15,
    name: 'Personagem 15',
    title: 'Dança das Sombras',
    themeColor: '#8b5cf6',
    secondaryColor: '#4c1d95',
    glowColor: 'rgba(139, 92, 246, 0.8)',
    energyColor: '#ddd6fe',
    style: 'Capoeira Neo',
    avatarIcon: '🪕',
    stats: {
      health: 940,
      speed: 8.2,
      jumpForce: 19.0,
      attackPower: 1.05,
      defense: 0.92,
      energyRegen: 1.2,
    },
    stance: 'acrobatic',
    description: 'Movimentos rítmicos e imprevisíveis de chutes circulares e rasteiras.',
    specialMoves: [
      { name: 'Meia-Lua Estelar', command: '↓ ➔ + Chute', cost: 25, type: 'roundhouse' },
      { name: 'Armada Veloz', command: '↓ ⬅ + Chute', cost: 25, type: 'spin-kick' },
      { name: 'Berimbau das Galáxias (Super)', command: '↓ ➔ ↓ ➔ + Chute Forte', cost: 100, type: 'ultimate' }
    ]
  },
  {
    id: 16,
    name: 'Personagem 16',
    title: 'Guardião de Ferro',
    themeColor: '#94a3b8',
    secondaryColor: '#334155',
    glowColor: 'rgba(148, 163, 184, 0.8)',
    energyColor: '#e2e8f0',
    style: 'Steel Aegis',
    avatarIcon: '🛡️',
    stats: {
      health: 1300,
      speed: 5.2,
      jumpForce: 14.5,
      attackPower: 1.15,
      defense: 1.35,
      energyRegen: 0.75,
    },
    stance: 'titan',
    description: 'Muralha intransponível com escudo refletor e socos pesados de impacto.',
    specialMoves: [
      { name: 'Barreira de Aço', command: '⬅ + Bloqueio', cost: 20, type: 'shield' },
      { name: 'Punho Hidráulico', command: '↓ ➔ + Soco', cost: 30, type: 'heavy-punch' },
      { name: 'Fortaleza Inabalável (Super)', command: '↓ ➔ ↓ ➔ + Soco Forte', cost: 100, type: 'ultimate' }
    ]
  },
  {
    id: 17,
    name: 'Personagem 17',
    title: 'Centelha Temporal',
    themeColor: '#06b6d4',
    secondaryColor: '#164e63',
    glowColor: 'rgba(6, 182, 212, 0.8)',
    energyColor: '#a5f3fc',
    style: 'Chrono Martial',
    avatarIcon: '⏳',
    stats: {
      health: 930,
      speed: 8.4,
      jumpForce: 18.2,
      attackPower: 1.0,
      defense: 0.93,
      energyRegen: 1.3,
    },
    stance: 'agile',
    description: 'Manipulação de micro-intervalos de tempo para contra-ataques cirúrgicos.',
    specialMoves: [
      { name: 'Rebobinar', command: '↓ ⬅ + Soco', cost: 35, type: 'time-reversal' },
      { name: 'Aceleração Temporal', command: '➔ ➔ + Dash', cost: 20, type: 'fast-dash' },
      { name: 'Parada no Tempo (Super)', command: '↓ ➔ ↓ ➔ + Soco Forte', cost: 100, type: 'ultimate' }
    ]
  },
  {
    id: 18,
    name: 'Personagem 18',
    title: 'Imperador Vulcânico',
    themeColor: '#f97316',
    secondaryColor: '#7c2d12',
    glowColor: 'rgba(249, 115, 22, 0.8)',
    energyColor: '#ffedd5',
    style: 'Magma Fist',
    avatarIcon: '🌋',
    stats: {
      health: 1080,
      speed: 6.5,
      jumpForce: 16.2,
      attackPower: 1.25,
      defense: 1.1,
      energyRegen: 0.9,
    },
    stance: 'heavy',
    description: 'Erupções de magma e socos incandescentes de altíssimo dano bruto.',
    specialMoves: [
      { name: 'Geiser de Lava', command: '↓ ↓ + Soco', cost: 30, type: 'eruption' },
      { name: 'Meteoro Flamejante', command: '↓ ➔ + Soco', cost: 30, type: 'fireball' },
      { name: 'Cataclismo Vulcânico (Super)', command: '↓ ➔ ↓ ➔ + Soco Forte', cost: 100, type: 'ultimate' }
    ]
  },
  {
    id: 19,
    name: 'Personagem 19',
    title: 'Ilusionista Psíquico',
    themeColor: '#d946ef',
    secondaryColor: '#701a75',
    glowColor: 'rgba(217, 70, 239, 0.8)',
    energyColor: '#fae8ff',
    style: 'Psy-Kinetic',
    avatarIcon: '🔮',
    stats: {
      health: 910,
      speed: 7.7,
      jumpForce: 18.5,
      attackPower: 1.06,
      defense: 0.9,
      energyRegen: 1.35,
    },
    stance: 'agile',
    description: 'Ataques telecinéticos à distância e clones ilusórios para confundir a guarda.',
    specialMoves: [
      { name: 'Onda Psíquica', command: '↓ ➔ + Soco', cost: 25, type: 'psy-wave' },
      { name: 'Clone Miragem', command: '↓ ⬅ + Soco', cost: 30, type: 'decoy' },
      { name: 'Explosão Mental (Super)', command: '↓ ➔ ↓ ➔ + Soco Forte', cost: 100, type: 'ultimate' }
    ]
  },
  {
    id: 20,
    name: 'Personagem 20',
    title: 'Deus do Caos Ômega',
    themeColor: '#e11d48',
    secondaryColor: '#4c0519',
    glowColor: 'rgba(225, 29, 72, 0.9)',
    energyColor: '#ffe4e6',
    style: 'Electric Apex Boss',
    avatarIcon: '⚡👑',
    stats: {
      health: 1200,
      speed: 7.8,
      jumpForce: 18.5,
      attackPower: 1.25,
      defense: 1.15,
      energyRegen: 1.4,
    },
    stance: 'titan',
    description: 'O lutador supremo: combina a eletricidade de Electricman com o poder de chefões clássicos.',
    specialMoves: [
      { name: 'Raio Ômega Devastador', command: '↓ ➔ + Soco', cost: 30, type: 'beam' },
      { name: 'Fúria Elétrica Dimensional', command: '➔ ↓ ➔ + Chute', cost: 40, type: 'rush' },
      { name: 'Apocalipse Elétrico (Super)', command: '↓ ➔ ↓ ➔ + Soco Forte', cost: 100, type: 'ultimate' }
    ]
  }
];

export const getCharacterById = (id) => {
  return CHARACTERS.find(c => c.id === Number(id)) || CHARACTERS[0];
};
