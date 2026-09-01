import React from 'react';
import { Swords, Bot, Dumbbell, Gamepad2, Volume2, VolumeX, Sparkles, Trophy } from 'lucide-react';
import { sounds } from '../../game/audio/soundManager';

export const MainMenu = ({ onSelectMode, onOpenControls, isMuted, onToggleMute }) => {
  const handleSelect = (mode) => {
    sounds.playPunch(true);
    onSelectMode(mode);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-8 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950/60 text-slate-100 overflow-hidden select-none">
      {/* Background Animated Neon Grid Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] pointer-events-none" />

      {/* Top Header / Sound Toggle */}
      <div className="w-full flex justify-between items-center z-10">
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/80 rounded-full border border-slate-800 text-xs text-cyan-400 font-semibold tracking-wider">
          <Sparkles size={14} />
          <span>FIGHT GAME 2D • ELECTRIC EDITION</span>
        </div>
        <button
          onClick={onToggleMute}
          className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
          title={isMuted ? 'Desmutar' : 'Mutar'}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      {/* Center Title Logo */}
      <div className="flex flex-col items-center text-center my-auto z-10">
        <h1 className="text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-500 drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)] animate-pulse">
          FIGHT GAME
        </h1>
        <p className="text-sm font-bold tracking-widest text-cyan-300 mt-2 uppercase">
          Inspirado em Street Fighter, Mortal Kombat & Electricman
        </p>
        <span className="text-xs text-slate-400 mt-1">20 Lutadores • Efeitos Elétricos • Combos Fluidos</span>

        {/* Menu Action Buttons */}
        <div className="flex flex-col gap-3.5 w-80 mt-8">
          <button
            onClick={() => handleSelect('ARCADE')}
            className="group py-3 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all transform hover:scale-105 cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Trophy size={18} />
              <span>Modo Arcade (IA)</span>
            </div>
            <span className="text-xs opacity-75">➔</span>
          </button>

          <button
            onClick={() => handleSelect('VERSUS')}
            className="group py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 border-2 border-cyan-500/60 hover:border-cyan-400 text-cyan-300 font-bold text-sm uppercase tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all transform hover:scale-105 cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Swords size={18} />
              <span>Versus Local (2P)</span>
            </div>
            <span className="text-xs opacity-75">➔</span>
          </button>

          <button
            onClick={() => handleSelect('TRAINING')}
            className="group py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 border-2 border-indigo-500/60 hover:border-indigo-400 text-indigo-300 font-bold text-sm uppercase tracking-widest transition-all transform hover:scale-105 cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Dumbbell size={18} />
              <span>Modo Treino</span>
            </div>
            <span className="text-xs opacity-75">➔</span>
          </button>

          <button
            onClick={onOpenControls}
            className="py-2.5 px-5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Gamepad2 size={16} />
            Guia de Controles & Golpes
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="w-full flex justify-between items-center text-xs text-slate-400 z-10 border-t border-slate-800/80 pt-3">
        <span>Pronto para GitHub Pages</span>
        <span>Feito com React, Vite, Canvas 2D & Web Audio API</span>
      </div>
    </div>
  );
};
