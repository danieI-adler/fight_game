import React from 'react';
import { Volume2, VolumeX, Sparkles, Sword } from 'lucide-react';
import { sounds } from '../../game/audio/soundManager';

export const MainMenu = ({
  onSelectMode,
  onOpenControls,
  onOpenGraphics,
  graphicsMode,
  isExpedition,
  onToggleExpedition,
  isMuted,
  onToggleMute
}) => {
  const handleSelect = (mode) => {
    sounds.playPunch(false);
    onSelectMode(mode);
  };

  return (
    <div className={`w-full h-full flex flex-col justify-between p-6 select-none transition-colors duration-300 ${
      isExpedition ? 'bg-[#06080e] text-amber-100' : 'bg-[#0a0a0f] text-slate-200'
    }`}>
      {/* Top Header */}
      <div className={`w-full flex justify-between items-center max-w-4xl mx-auto border-b pb-3 ${
        isExpedition ? 'border-amber-900/50' : 'border-slate-800'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`font-bold text-sm tracking-wider ${
            isExpedition ? 'text-amber-400 font-serif' : 'text-slate-300'
          }`}>
            {isExpedition ? 'CLAIR OBSCUR • EXPEDITION 33' : 'FIGHT GAME'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMute}
            className={`p-1.5 rounded border transition-colors cursor-pointer text-xs flex items-center gap-1.5 ${
              isExpedition
                ? 'bg-slate-950 hover:bg-slate-900 border-amber-900/60 text-amber-300'
                : 'bg-slate-850 hover:bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title={isMuted ? 'Desmutar' : 'Mutar'}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            <span>{isMuted ? 'Mudo' : 'Som: Ligado'}</span>
          </button>
        </div>
      </div>

      {/* Center Menu */}
      <div className="flex flex-col items-center justify-center my-auto">
        <h1 className={`text-4xl font-black tracking-tight mb-1 text-center ${
          isExpedition ? 'text-amber-300 font-serif tracking-widest drop-shadow-[0_2px_12px_rgba(251,191,36,0.3)]' : 'text-white font-mono'
        }`}>
          {isExpedition ? 'EXPEDITION 33' : 'FIGHT GAME'}
        </h1>
        <span className="text-xs text-slate-400 mb-6 tracking-wide">
          {isExpedition ? 'Gustave • Maelle • Lune • Sciel • Renoir • Verso • Monoco • Esquie • La Peintresse' : '20 Personagens'}
        </span>

        {/* Edition Switcher Button */}
        <button
          onClick={() => {
            sounds.playSelect();
            onToggleExpedition();
          }}
          className={`w-72 py-2.5 px-3 rounded-lg border font-bold text-xs uppercase tracking-wider transition-all cursor-pointer mb-4 flex items-center justify-between shadow-lg ${
            isExpedition
              ? 'bg-gradient-to-r from-amber-950 via-slate-950 to-amber-950 border-amber-500 text-amber-300 ring-1 ring-amber-500/50'
              : 'bg-slate-900 hover:bg-slate-850 border-slate-700 text-slate-300'
          }`}
        >
          <span className="flex items-center gap-1.5">
            {isExpedition ? <Sparkles size={14} className="text-amber-400" /> : <Sword size={14} />}
            <span>Edição:</span>
          </span>
          <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
            isExpedition ? 'bg-amber-500 text-black font-serif font-bold' : 'bg-slate-800 text-white'
          }`}>
            {isExpedition ? 'Expedition 33' : '20 Personagens'}
          </span>
        </button>

        <div className="flex flex-col gap-2.5 w-72">
          <button
            onClick={() => handleSelect('ARCADE')}
            className={`w-full py-3 px-4 rounded border font-bold text-sm uppercase tracking-wider transition-colors cursor-pointer text-left flex justify-between items-center ${
              isExpedition
                ? 'bg-amber-950/80 hover:bg-amber-900/90 border-amber-800 text-amber-100'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-white'
            }`}
          >
            <span>Modo Arcade</span>
            <span className="text-xs text-slate-400 font-normal">1 Jogador</span>
          </button>

          <button
            onClick={() => handleSelect('VERSUS')}
            className={`w-full py-3 px-4 rounded border font-bold text-sm uppercase tracking-wider transition-colors cursor-pointer text-left flex justify-between items-center ${
              isExpedition
                ? 'bg-amber-950/80 hover:bg-amber-900/90 border-amber-800 text-amber-100'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-white'
            }`}
          >
            <span>Versus Local</span>
            <span className="text-xs text-slate-400 font-normal">2 Jogadores</span>
          </button>

          <button
            onClick={() => handleSelect('ONLINE')}
            className="w-full py-3 px-4 rounded bg-blue-700 hover:bg-blue-600 border border-blue-500 text-white font-bold text-sm uppercase tracking-wider transition-colors cursor-pointer text-left flex justify-between items-center"
          >
            <span>Jogar Online</span>
            <span className="text-xs text-blue-200 font-normal">Salas P2P</span>
          </button>

          <button
            onClick={() => handleSelect('TRAINING')}
            className={`w-full py-3 px-4 rounded border font-bold text-sm uppercase tracking-wider transition-colors cursor-pointer text-left flex justify-between items-center ${
              isExpedition
                ? 'bg-slate-900 hover:bg-slate-850 border-amber-900/60 text-amber-200'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-white'
            }`}
          >
            <span>Treino</span>
            <span className="text-xs text-slate-400 font-normal">Prática</span>
          </button>

          <button
            onClick={onOpenControls}
            className="w-full py-2 px-4 rounded bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 font-medium text-xs uppercase tracking-wider transition-colors cursor-pointer text-center mt-1"
          >
            Controles & Golpes
          </button>

          <button
            onClick={onOpenGraphics}
            className="w-full py-2 px-4 rounded bg-slate-900 hover:bg-slate-850 border border-slate-800 text-amber-400 hover:text-amber-300 font-medium text-xs uppercase tracking-wider transition-colors cursor-pointer text-center flex items-center justify-between"
          >
            <span>Modo Gráfico:</span>
            <span className="font-bold text-[11px] bg-slate-800 px-2 py-0.5 rounded text-white">
              {graphicsMode === 'STICK_2D'
                ? '1. Palito 2D'
                : graphicsMode === 'BELLE_EPOQUE_2D'
                ? '2. Belle Époque 2D'
                : graphicsMode === 'MODE_2_5D'
                ? '3. Modo 2.5D'
                : '4. Tudo 3D'}
            </span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className={`w-full text-center text-xs max-w-4xl mx-auto border-t pt-3 ${
        isExpedition ? 'border-amber-900/50 text-amber-400/80 font-serif' : 'border-slate-800 text-slate-400'
      }`}>
        {isExpedition ? 'Edição Especial: Clair Obscur: Expedition 33' : 'Fight Game • Build v1.0'}
      </div>
    </div>
  );
};
