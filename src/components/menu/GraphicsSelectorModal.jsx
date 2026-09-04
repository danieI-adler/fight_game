import React from 'react';
import { sounds } from '../../game/audio/soundManager';
import { Sparkles, Layers, Box, Monitor } from 'lucide-react';

export const GRAPHICS_MODES = {
  STICK_2D: 'STICK_2D',
  BELLE_EPOQUE_2D: 'BELLE_EPOQUE_2D',
  MODE_2_5D: 'MODE_2_5D',
  FULL_3D: 'FULL_3D'
};

export const GraphicsSelectorModal = ({ currentMode, onSelectMode, onClose }) => {
  const options = [
    {
      id: GRAPHICS_MODES.STICK_2D,
      title: '1. Boneco Palito',
      subtitle: '2D Retrô Clássico',
      icon: <Layers size={24} className="text-slate-400" />,
      desc: 'Visual minimalista com articulações geométricas simples e traço clássico.',
      badge: 'Leve & Rápido'
    },
    {
      id: GRAPHICS_MODES.BELLE_EPOQUE_2D,
      title: '2. 2D Belle Époque',
      subtitle: 'Ilustrado & Encorpado',
      icon: <Sparkles size={24} className="text-sky-400" />,
      desc: 'Sobretudos esvoaçantes, máscaras de porcelana, física de tecido e pinceladas de tinta.',
      badge: 'Estilo Clair Obscur'
    },
    {
      id: GRAPHICS_MODES.MODE_2_5D,
      title: '3. Modo 2.5D',
      subtitle: 'Lutadores 3D + Cenário 2D',
      icon: <Box size={24} className="text-amber-400" />,
      desc: 'Personagens em Three.js 3D volumétrico com materiais PBR projetados sobre o cenário 2D.',
      badge: '3D Volumétrico'
    },
    {
      id: GRAPHICS_MODES.FULL_3D,
      title: '4. Tudo 3D Next-Gen',
      subtitle: 'Arena 3D & Luz Dinâmica',
      icon: <Monitor size={24} className="text-emerald-400" />,
      desc: 'Arena 3D completa com reflexos em tempo real, iluminação dramática e câmera dinâmica.',
      badge: 'Qualidade Máxima'
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
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl flex flex-col justify-between text-slate-200">
        {/* Header */}
        <div className="text-center border-b border-slate-800 pb-4 mb-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest block mb-1">
            CONFIGURAÇÃO VISUAL
          </span>
          <h2 className="text-2xl font-black text-white font-mono tracking-wider">
            ESCOLHA O MODO GRÁFICO
          </h2>
          <span className="text-xs text-slate-400">
            Você pode alterar esta opção a qualquer momento no Menu Principal.
          </span>
        </div>

        {/* 4 Cards */}
        <div className="grid grid-cols-2 gap-3.5 my-2">
          {options.map((opt) => {
            const isSelected = currentMode === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => handleChoose(opt.id)}
                className={`p-4 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-850 border-blue-500 ring-2 ring-blue-500/50'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-600 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    {opt.icon}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                    {opt.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white mb-0.5">{opt.title}</h3>
                  <span className="text-[11px] text-blue-400 font-medium block mb-2">{opt.subtitle}</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{opt.desc}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className={isSelected ? 'text-blue-400 font-bold' : 'text-slate-400'}>
                    {isSelected ? '✓ Selecionado' : 'Clique para selecionar'}
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
            className="w-full mt-4 py-2.5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Continuar para o Jogo
          </button>
        )}
      </div>
    </div>
  );
};
