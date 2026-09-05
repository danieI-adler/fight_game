import React from 'react';
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

export const GraphicsSelectorModal = ({ currentMode, onSelectMode, onClose }) => {
  const options = [
    {
      id: GRAPHICS_MODES.STICK_2D,
      title: '1. Boneco Palito',
      subtitle: '2D Retrô Clássico',
      icon: <Layers size={22} className="text-slate-400" />,
      desc: 'Visual minimalista com articulações geométricas simples e traço clássico.',
      badge: 'Leve & Rápido',
      tagColor: 'border-slate-700 text-slate-400'
    },
    {
      id: GRAPHICS_MODES.BELLE_EPOQUE_2D,
      title: '2. 2D Belle Époque',
      subtitle: 'Ilustrado & Encorpado',
      icon: <Sparkles size={22} className="text-sky-400" />,
      desc: 'Sobretudos esvoaçantes, máscaras de porcelana, física de tecido e pinceladas de tinta.',
      badge: 'Estilo Ilustrado',
      tagColor: 'border-sky-800 text-sky-300'
    },
    {
      id: GRAPHICS_MODES.EXPEDITION_HD_SPRITES,
      title: '3. 2D Clair Obscur HD',
      subtitle: 'Sprites HD & Chiaroscuro',
      icon: <Wand2 size={22} className="text-amber-300" />,
      desc: 'Sprites de combate em altíssima resolução, iluminação dramática Chiaroscuro e luz de recorte (Rim Light).',
      badge: '🌟 Fidelidade Máxima 2D',
      tagColor: 'border-amber-500/70 text-amber-300 bg-amber-950/40'
    },
    {
      id: GRAPHICS_MODES.MODE_2_5D,
      title: '4. Modo 2.5D Clássico',
      subtitle: 'Lutadores 3D + Cenário 2D',
      icon: <Box size={22} className="text-blue-400" />,
      desc: 'Personagens em Three.js 3D volumétrico com materiais PBR projetados sobre o cenário 2D.',
      badge: '3D Volumétrico',
      tagColor: 'border-blue-800 text-blue-300'
    },
    {
      id: GRAPHICS_MODES.EXPEDITION_PBR_3D,
      title: '5. 3D PBR Realista',
      subtitle: 'Modelos & Luz Cinematográfica',
      icon: <Flame size={22} className="text-purple-400" />,
      desc: 'Lutadores 3D com texturas realistas de pele, ouro, armas fidedignas e iluminação de estúdio Chiaroscuro.',
      badge: '✨ 3D PBR Avançado',
      tagColor: 'border-purple-500/70 text-purple-300 bg-purple-950/40'
    },
    {
      id: GRAPHICS_MODES.FULL_3D,
      title: '6. Tudo 3D Next-Gen',
      subtitle: 'Arena 3D & Luz Dinâmica',
      icon: <Monitor size={22} className="text-emerald-400" />,
      desc: 'Arena 3D completa com reflexos em tempo real, pilares góticos e câmera dinâmica.',
      badge: 'Qualidade Next-Gen',
      tagColor: 'border-emerald-800 text-emerald-300'
    }
  ];

  const handleChoose = (modeId) => {
    sounds.playSelect();
    try {
      localStorage.setItem('fight_graphics_mode', modeId);
    } catch (e) {}
    onSelectMode(modeId);
    if (onClose) onClose();
  };

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
          <span className="text-xs text-slate-400">
            Você pode alternar entre qualquer um dos 6 modos visuais a qualquer momento.
          </span>
        </div>

        {/* 6 Cards em Grid 3x2 */}
        <div className="grid grid-cols-3 gap-3 my-2 max-h-[62vh] overflow-y-auto pr-1">
          {options.map((opt) => {
            const isSelected = currentMode === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => handleChoose(opt.id)}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-850 border-amber-500 ring-2 ring-amber-500/50 shadow-lg shadow-amber-950/40'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-600 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    {opt.icon}
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${opt.tagColor}`}>
                    {opt.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-white mb-0.5">{opt.title}</h3>
                  <span className="text-[10px] text-amber-400/90 font-medium block mb-1.5">{opt.subtitle}</span>
                  <p className="text-[11px] text-slate-400 leading-snug">{opt.desc}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className={isSelected ? 'text-amber-300 font-bold text-[11px]' : 'text-slate-400 text-[11px]'}>
                    {isSelected ? '✓ Ativo' : 'Selecionar'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">60 FPS</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Botão de Fechar / Continuar */}
        {onClose && (
          <button
            onClick={onClose}
            className="w-full mt-3 py-2.5 rounded bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer font-serif"
          >
            Continuar para o Jogo
          </button>
        )}
      </div>
    </div>
  );
};
