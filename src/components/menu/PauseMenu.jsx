import React from 'react';
import { sounds } from '../../game/audio/soundManager';

export const PauseMenu = ({ onResume, onRestart, onSelectCharacter, onMainMenu, currentTrack, onNextMusic, dashEnabled, onToggleDash }) => {
  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 select-none">
      <div className="w-80 bg-slate-900 border border-slate-700 rounded-lg p-6 shadow-2xl flex flex-col items-center">
        <h2 className="text-xl font-bold text-white mb-5 uppercase tracking-wider">
          PAUSADO
        </h2>

        <div className="flex flex-col gap-2.5 w-full">
          <button
            onClick={() => {
              sounds.playPunch(false);
              onResume();
            }}
            className="py-2.5 px-4 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Continuar
          </button>

          <button
            onClick={() => {
              sounds.playSelect();
              if (onNextMusic) onNextMusic();
            }}
            className="py-2 px-4 rounded bg-amber-950/60 hover:bg-amber-900/80 border border-amber-600/60 text-amber-300 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-between"
          >
            <span>🎵 Música</span>
            <span className="text-[10px] text-amber-400/90 truncate max-w-[140px]">
              {currentTrack?.title || 'Trocar'}
            </span>
          </button>

          <button
            onClick={() => {
              sounds.playSelect();
              if (onToggleDash) onToggleDash();
            }}
            className={`py-2 px-4 rounded border text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-between ${
              dashEnabled
                ? 'bg-emerald-950/70 hover:bg-emerald-900/90 border-emerald-500/70 text-emerald-300'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-400'
            }`}
          >
            <span>⚡ Dash Duplo Toque</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${dashEnabled ? 'bg-emerald-500 text-black' : 'bg-slate-700 text-slate-300'}`}>
              {dashEnabled ? 'ATIVADO' : 'DESATIVADO'}
            </span>
          </button>

          <button
            onClick={() => {
              sounds.playPunch(false);
              onRestart();
            }}
            className="py-2 px-4 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Reiniciar Round
          </button>

          <button
            onClick={() => {
              sounds.playSelect();
              onSelectCharacter();
            }}
            className="py-2 px-4 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Trocar Personagens
          </button>

          <button
            onClick={() => {
              sounds.playSelect();
              onMainMenu();
            }}
            className="py-2 px-4 rounded bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs uppercase tracking-wider transition-colors cursor-pointer mt-2"
          >
            Menu Principal
          </button>
        </div>
      </div>
    </div>
  );
};
