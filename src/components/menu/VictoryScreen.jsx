import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Users, Home } from 'lucide-react';
import { sounds } from '../../game/audio/soundManager';

export const VictoryScreen = ({ winner, loser, onRematch, onSelectCharacter, onMainMenu }) => {
  useEffect(() => {
    // Efeito de confetes na vitória
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: [winner.themeColor || '#facc15', '#00f0ff', '#f43f5e', '#ffffff'],
      });
    } catch (e) {}
  }, [winner]);

  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 select-none">
      <div className="w-96 bg-slate-900 border-2 border-amber-500 rounded-2xl p-8 shadow-[0_0_50px_rgba(245,158,11,0.5)] flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-4xl mb-4 shadow-[0_0_20px_#facc15]">
          🏆
        </div>

        <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">
          VENCEDOR DO COMBATE
        </span>
        <h2 className="text-3xl font-black italic tracking-wide text-slate-100 mt-1 uppercase drop-shadow-md">
          {winner.name}
        </h2>
        <span className="text-xs text-slate-400 mt-0.5">{winner.title}</span>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full mt-6">
          <button
            onClick={() => {
              sounds.playPunch(true);
              onRematch();
            }}
            className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs uppercase tracking-widest shadow-lg transition-all transform hover:scale-105 cursor-pointer flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} />
            Revanche (Mesmos Lutadores)
          </button>

          <button
            onClick={() => {
              sounds.playSelect();
              onSelectCharacter();
            }}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Users size={16} />
            Selecionar Novos Personagens
          </button>

          <button
            onClick={() => {
              sounds.playSelect();
              onMainMenu();
            }}
            className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Home size={16} />
            Menu Principal
          </button>
        </div>
      </div>
    </div>
  );
};
