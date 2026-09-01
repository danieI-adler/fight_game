import React from 'react';
import { sounds } from '../../game/audio/soundManager';

export const PauseMenu = ({ onResume, onRestart, onSelectCharacter, onMainMenu }) => {
  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 select-none">
      <div className="w-72 bg-slate-900 border border-slate-700 rounded p-6 shadow-2xl flex flex-col items-center">
        <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider">
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
