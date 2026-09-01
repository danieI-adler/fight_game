import React from 'react';
import { sounds } from '../../game/audio/soundManager';

export const TrainingOverlay = ({
  showHitboxes,
  onToggleHitboxes,
  dummyBehavior,
  onChangeDummyBehavior,
  onResetPositions,
}) => {
  return (
    <div className="absolute top-20 left-4 bg-slate-900 border border-slate-700 rounded p-3 text-xs text-slate-200 shadow-md flex flex-col gap-2 pointer-events-auto z-40 select-none">
      <span className="font-bold text-slate-300 text-xs border-b border-slate-800 pb-1">
        MODO TREINO
      </span>

      <button
        onClick={() => {
          sounds.playSelect();
          onToggleHitboxes();
        }}
        className={`px-2 py-1 rounded flex items-center justify-between gap-2 border cursor-pointer ${
          showHitboxes
            ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
            : 'bg-slate-800 border-slate-700 text-slate-300'
        }`}
      >
        <span>Hitboxes:</span>
        <span className="font-bold">{showHitboxes ? 'ON' : 'OFF'}</span>
      </button>

      <div className="flex items-center justify-between gap-2">
        <span className="text-slate-400">Boneco:</span>
        <select
          value={dummyBehavior}
          onChange={(e) => onChangeDummyBehavior(e.target.value)}
          className="bg-slate-800 text-slate-200 rounded px-1.5 py-0.5 border border-slate-700 outline-none cursor-pointer text-xs"
        >
          <option value="dummy">Parado</option>
          <option value="easy">IA Fácil</option>
          <option value="medium">IA Média</option>
          <option value="hard">IA Difícil</option>
        </select>
      </div>

      <button
        onClick={() => {
          sounds.playSelect();
          onResetPositions();
        }}
        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold cursor-pointer text-center mt-1"
      >
        Reposicionar
      </button>
    </div>
  );
};
