import React from 'react';
import { Eye, Bot, Shield, RotateCcw } from 'lucide-react';
import { sounds } from '../../game/audio/soundManager';

export const TrainingOverlay = ({
  showHitboxes,
  onToggleHitboxes,
  dummyBehavior,
  onChangeDummyBehavior,
  onResetPositions,
}) => {
  return (
    <div className="absolute top-20 left-4 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-xl p-3 text-xs text-slate-200 shadow-lg flex flex-col gap-2 pointer-events-auto z-40 select-none">
      <span className="font-black text-indigo-400 uppercase tracking-wider text-[11px] border-b border-slate-800 pb-1">
        ⚙️ MODO TREINO
      </span>

      {/* Toggle Hitboxes */}
      <button
        onClick={() => {
          sounds.playSelect();
          onToggleHitboxes();
        }}
        className={`px-2.5 py-1 rounded flex items-center justify-between gap-2 border cursor-pointer ${
          showHitboxes
            ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
            : 'bg-slate-800 border-slate-700 text-slate-400'
        }`}
      >
        <span className="flex items-center gap-1.5">
          <Eye size={13} />
          Exibir Hitboxes:
        </span>
        <span className="font-bold">{showHitboxes ? 'LIGADO' : 'DESLIGADO'}</span>
      </button>

      {/* Dummy AI Behavior */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-slate-400 flex items-center gap-1">
          <Bot size={13} />
          Boneco (P2):
        </span>
        <select
          value={dummyBehavior}
          onChange={(e) => onChangeDummyBehavior(e.target.value)}
          className="bg-slate-800 text-cyan-300 rounded px-2 py-0.5 border border-slate-700 outline-none cursor-pointer text-xs"
        >
          <option value="dummy">Parado (Passivo)</option>
          <option value="easy">IA Fácil (Revidar)</option>
          <option value="medium">IA Média</option>
          <option value="hard">IA Difícil</option>
        </select>
      </div>

      {/* Reset Positions Button */}
      <button
        onClick={() => {
          sounds.playSelect();
          onResetPositions();
        }}
        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold flex items-center justify-center gap-1.5 cursor-pointer mt-1"
      >
        <RotateCcw size={12} />
        Reposicionar Lutadores
      </button>
    </div>
  );
};
