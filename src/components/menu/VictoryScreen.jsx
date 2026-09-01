import React from 'react';
import { sounds } from '../../game/audio/soundManager';

export const VictoryScreen = ({ winner, loser, onRematch, onSelectCharacter, onMainMenu }) => {
  return (
    <div className="absolute inset-0 bg-black/85 flex items-center justify-center z-50 select-none">
      <div className="w-80 bg-slate-900 border border-slate-700 rounded p-6 shadow-2xl flex flex-col items-center text-center">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
          VENCEDOR
        </span>
        <h2 className="text-2xl font-bold text-white uppercase mb-1">
          {winner.name}
        </h2>
        <span className="text-xs text-slate-400 mb-6">{winner.title}</span>

        <div className="flex flex-col gap-2.5 w-full">
          <button
            onClick={() => {
              sounds.playPunch(false);
              onRematch();
            }}
            className="py-2.5 px-4 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Jogar Novamente
          </button>

          <button
            onClick={() => {
              sounds.playSelect();
              onSelectCharacter();
            }}
            className="py-2 px-4 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Selecionar Personagens
          </button>

          <button
            onClick={() => {
              sounds.playSelect();
              onMainMenu();
            }}
            className="py-2 px-4 rounded bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Menu Principal
          </button>
        </div>
      </div>
    </div>
  );
};
