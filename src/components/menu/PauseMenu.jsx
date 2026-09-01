import React from 'react';
import { Play, RotateCcw, Users, Home } from 'lucide-react';
import { sounds } from '../../game/audio/soundManager';

export const PauseMenu = ({ onResume, onRestart, onSelectCharacter, onMainMenu }) => {
  return (
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 select-none">
      <div className="w-80 bg-slate-900 border-2 border-slate-700 rounded-2xl p-6 shadow-[0_0_40px_rgba(0,0,0,0.8)] flex flex-col items-center">
        <h2 className="text-3xl font-black italic tracking-wider text-amber-400 mb-6 uppercase">
          JOGO PAUSADO
        </h2>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={() => {
              sounds.playPunch(false);
              onResume();
            }}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs uppercase tracking-widest shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Play size={16} />
            Continuar Luta
          </button>

          <button
            onClick={() => {
              sounds.playPunch(false);
              onRestart();
            }}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} />
            Reiniciar Round
          </button>

          <button
            onClick={() => {
              sounds.playSelect();
              onSelectCharacter();
            }}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Users size={16} />
            Trocar Personagens
          </button>

          <button
            onClick={() => {
              sounds.playSelect();
              onMainMenu();
            }}
            className="py-2.5 px-4 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800 text-rose-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            <Home size={16} />
            Menu Principal
          </button>
        </div>
      </div>
    </div>
  );
};
