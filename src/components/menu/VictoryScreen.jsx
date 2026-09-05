import React from 'react';
import { sounds } from '../../game/audio/soundManager';

export const VictoryScreen = ({ winner, loser, onRematch, onSelectCharacter, onMainMenu }) => {
  return (
    <div className="absolute inset-0 bg-black/85 flex items-center justify-center z-50 select-none backdrop-blur-sm">
      <div className="w-96 bg-slate-950 border border-amber-900/60 rounded-lg p-6 shadow-2xl flex flex-col items-center text-center ring-1 ring-amber-500/20">
        <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-2 font-serif">
          ✦ VITORIOSO ✦
        </span>

        {winner.image && (
          <div className="w-24 h-32 rounded-lg border-2 border-amber-600/70 overflow-hidden mb-3 shadow-xl bg-black">
            <img src={winner.image} alt={winner.name} className="w-full h-full object-cover object-top" />
          </div>
        )}

        <h2 className="text-2xl font-black text-amber-200 uppercase mb-4 tracking-wider font-serif">
          {winner.name}
        </h2>

        <div className="flex flex-col gap-2.5 w-full">
          <button
            onClick={() => {
              sounds.playPunch(false);
              onRematch();
            }}
            className="py-2.5 px-4 rounded bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer font-serif"
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
