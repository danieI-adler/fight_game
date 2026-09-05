import React, { useState } from 'react';
import { sounds } from '../../game/audio/soundManager';
import { Sparkles, Layers, Box, Monitor, Wand2, Flame } from 'lucide-react';

export const GRAPHICS_MODES = {
  STICK_2D: 'STICK_2D',
  BELLE_EPOQUE_2D: 'BELLE_EPOQUE_2D',
  EXPEDITION_HD_SPRITES: 'EXPEDITION_HD_SPRITES',
  MODE_2_5D: 'MODE_2_5D',
  EXPEDITION_PBR_3D: 'EXPEDITION_PBR_3D',
  FULL_3D: 'FULL_3D'
};

export const GraphicsSelectorModal = ({ currentMode, isExpedition = false, onSelectMode, onSetExpedition, onClose }) => {
  const [activeTab, setActiveTab] = useState(isExpedition ? 'EXPEDITION' : 'CLASSIC');

  const expeditionOptions = [
    {
      id: GRAPHICS_MODES.EXPEDITION_HD_SPRITES,
      title: '1. 2D Clair Obscur HD',
      subtitle: 'Sprites HD & Chiaroscuro',
      icon: <Wand2 size={24} className="text-amber-400" />,
      desc: 'Sprites e ilustrações em altíssima definição com iluminação Chiaroscuro dramática, sombras de contato suaves, luz de recorte (Rim Light) e física de respiração.',
      badge: '🌟 Fidelidade Máxima 2D',
      tagColor: 'border-amber-500/70 text-amber-300 bg-amber-950/40'
    },
    {
      id: GRAPHICS_MODES.EXPEDITION_PBR_3D,
      title: '2. 3D PBR Realista Next-Gen',
      subtitle: 'Modelos 3D & Luz de Estúdio',
      icon: <Flame size={24} className="text-purple-400" />,
      desc: 'Lutadores 3D com materiais PBR realistas (pele com sardas, ouro, veludo), armas fiéis e iluminação de estúdio cinematográfica projetada no cenário.',
      badge: '✨ 3D PBR Avançado',
      tagColor: 'border-purple-500/70 text-purple-300 bg-purple-950/40'
    },
    {
      id: GRAPHICS_MODES.BELLE_EPOQUE_2D,
      title: '3. 2D Belle Époque Clássico',
      subtitle: 'Ilustrado Vetorial',
      icon: <Sparkles size={24} className="text-sky-400" />,
      desc: 'Traço vetorial ilustrado encorpado com sobretudos, máscaras de porcelana, física de tecido e pinceladas de tinta.',
      badge: '2D Ilustrado',
      tagColor: 'border-sky-800 text-sky-300'
    }
  ];

  const classicOptions = [
    {
      id: GRAPHICS_MODES.STICK_2D,
      title: '1. Boneco Palito',
      subtitle: '2D Retrô Clássico',
      icon: <Layers size={24} className="text-slate-400" />,
      desc: 'Visual minimalista com articulações geométricas simples e traço clássico.',
      badge: 'Leve & Rápido',
      tagColor: 'border-slate-700 text-slate-400'
    },
    {
      id: GRAPHICS_MODES.BELLE_EPOQUE_2D,
      title: '2. 2D Belle Époque',
      subtitle: 'Ilustrado & Encorpado',
      icon: <Sparkles size={24} className="text-sky-400" />,
      desc: 'Sobretudos esvoaçantes, máscaras de porcelana e pinceladas de tinta.',
      badge: 'Estilo Ilustrado',
      tagColor: 'border-sky-800 text-sky-300'
    },
    {
      id: GRAPHICS_MODES.MODE_2_5D,
      title: '3. Modo 2.5D',
      subtitle: 'Lutadores 3D + Cenário 2D',
      icon: <Box size={24} className="text-blue-400" />,
      desc: 'Personagens em Three.js 3D volumétrico com materiais PBR projetados sobre o cenário 2D.',
      badge: '3D Volumétrico',
      tagColor: 'border-blue-800 text-blue-300'
    },
    {
      id: GRAPHICS_MODES.FULL_3D,
      title: '4. Tudo 3D Next-Gen',
      subtitle: 'Arena 3D & Luz Dinâmica',
      icon: <Monitor size={24} className="text-emerald-400" />,
      desc: 'Arena 3D completa com reflexos em tempo real, iluminação dramática e câmera dinâmica.',
      badge: 'Qualidade Máxima',
      tagColor: 'border-emerald-800 text-emerald-300'
    }
  ];

  const handleChoose = (modeId, isExpeditionMode) => {
    sounds.playSelect();
    try {
      localStorage.setItem('fight_graphics_mode', modeId);
    } catch (e) {}

    if (onSetExpedition && isExpeditionMode !== undefined) {
      onSetExpedition(isExpeditionMode);
    }
    onSelectMode(modeId);
    if (onClose) onClose();
  };

  const currentOptions = activeTab === 'EXPEDITION' ? expeditionOptions : classicOptions;

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-6 select-none">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl flex flex-col justify-between text-slate-200">
        {/* Header */}
        <div className="text-center border-b border-slate-800 pb-3 mb-3">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest block mb-1 font-serif">
            ✦ CONFIGURAÇÃO VISUAL & BRANCHES GRÁFICAS ✦
          </span>
          <h2 className="text-2xl font-black text-white font-mono tracking-wider">
            ESCOLHA O MODO GRÁFICO
          </h2>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-4 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => {
              sounds.playSelect();
              setActiveTab('EXPEDITION');
            }}
            className={`flex-1 py-2 px-3 rounded-md font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'EXPEDITION'
                ? 'bg-amber-600 text-black shadow-lg font-serif'
                : 'text-slate-400 hover:text-amber-200 hover:bg-slate-900'
            }`}
          >
            <Sparkles size={15} />
            <span>Branches Especiais (Expedition 33)</span>
          </button>

          <button
            onClick={() => {
              sounds.playSelect();
              setActiveTab('CLASSIC');
            }}
            className={`flex-1 py-2 px-3 rounded-md font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'CLASSIC'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers size={15} />
            <span>Modos Gerais (20 Personagens)</span>
          </button>
        </div>

        {/* Options Grid */}
        <div className={`grid gap-3.5 my-1 ${activeTab === 'EXPEDITION' ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {currentOptions.map((opt) => {
            const isSelected = currentMode === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => handleChoose(opt.id, activeTab === 'EXPEDITION')}
                className={`p-4 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? activeTab === 'EXPEDITION'
                      ? 'bg-slate-850 border-amber-500 ring-2 ring-amber-500/60 shadow-xl shadow-amber-950/50'
                      : 'bg-slate-850 border-blue-500 ring-2 ring-blue-500/50 shadow-xl shadow-blue-950/50'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-600 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    {opt.icon}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${opt.tagColor}`}>
                    {opt.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white mb-0.5 font-serif">{opt.title}</h3>
                  <span className="text-xs text-amber-400/90 font-medium block mb-2">{opt.subtitle}</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{opt.desc}</p>
                </div>

                <div className="mt-4 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className={isSelected ? 'text-amber-300 font-bold' : 'text-slate-400'}>
                    {isSelected ? '✓ Modo Ativo' : 'Clique para Selecionar'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">60 FPS</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Botão de Fechar */}
        {onClose && (
          <button
            onClick={onClose}
            className="w-full mt-4 py-2.5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Fechar
          </button>
        )}
      </div>
    </div>
  );
};
