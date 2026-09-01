import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { sounds } from '../../game/audio/soundManager';

export const MainMenu = ({ onSelectMode, onOpenControls, isMuted, onToggleMute }) => {
  const handleSelect = (mode) => {
    sounds.playPunch(false);
    onSelectMode(mode);
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-6 bg-[#0a0a0f] text-slate-200 select-none">
      {/* Top Header */}
      <div className="w-full flex justify-between items-center max-w-4xl mx-auto border-b border-slate-800 pb-3">
        <span className="font-bold text-sm tracking-wider text-slate-300">FIGHT GAME</span>
        <button
          onClick={onToggleMute}
          className="p-1.5 rounded bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer text-xs flex items-center gap-1.5"
          title={isMuted ? 'Desmutar' : 'Mutar'}
        >
          {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          <span>{isMuted ? 'Áudio: Mudo' : 'Áudio: Ligado'}</span>
        </button>
      </div>

      {/* Center Menu */}
      <div className="flex flex-col items-center justify-center my-auto">
        <h1 className="text-5xl font-black tracking-tight text-white mb-2 font-mono">
          FIGHT GAME
        </h1>
        <span className="text-xs text-slate-400 mb-8 tracking-wide">20 Personagens</span>

        <div className="flex flex-col gap-3 w-72">
          <button
            onClick={() => handleSelect('ARCADE')}
            className="w-full py-3 px-4 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-sm uppercase tracking-wider transition-colors cursor-pointer text-left flex justify-between items-center"
          >
            <span>Modo Arcade</span>
            <span className="text-xs text-slate-400 font-normal">1 Jogador</span>
          </button>

          <button
            onClick={() => handleSelect('VERSUS')}
            className="w-full py-3 px-4 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-sm uppercase tracking-wider transition-colors cursor-pointer text-left flex justify-between items-center"
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
            className="w-full py-3 px-4 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-sm uppercase tracking-wider transition-colors cursor-pointer text-left flex justify-between items-center"
          >
            <span>Treino</span>
            <span className="text-xs text-slate-400 font-normal">Prática</span>
          </button>

          <button
            onClick={onOpenControls}
            className="w-full py-2.5 px-4 rounded bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 font-medium text-xs uppercase tracking-wider transition-colors cursor-pointer text-center mt-2"
          >
            Controles & Golpes
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full text-center text-xs text-slate-400 max-w-4xl mx-auto border-t border-slate-800 pt-3">
        Fight Game • Build v1.0
      </div>
    </div>
  );
};
