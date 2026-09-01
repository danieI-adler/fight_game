import React from 'react';
import { X } from 'lucide-react';
import { sounds } from '../../game/audio/soundManager';

export const ControlsGuide = ({ onClose }) => {
  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-6 select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded p-6 shadow-xl flex flex-col justify-between max-h-[90vh] overflow-y-auto text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-xl font-bold text-white">
            GUIA DE CONTROLES
          </h2>
          <button
            onClick={() => {
              sounds.playSelect();
              onClose();
            }}
            className="p-1 rounded bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tables */}
        <div className="grid grid-cols-2 gap-4 my-4 text-xs">
          {/* Player 1 */}
          <div className="bg-slate-950 p-3 rounded border border-slate-800 flex flex-col gap-2">
            <span className="font-bold text-blue-400 text-sm border-b border-slate-800 pb-1">
              JOGADOR 1 (P1)
            </span>
            <div className="space-y-1 text-slate-300">
              <div className="flex justify-between py-0.5 border-b border-slate-900">
                <span className="text-slate-400">Mover:</span>
                <span className="font-mono">[A] / [D]</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-900">
                <span className="text-slate-400">Pular:</span>
                <span className="font-mono font-bold text-white">[Espaço] ou [W]</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-900">
                <span className="text-slate-400">Agachar:</span>
                <span className="font-mono">[S]</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-900">
                <span className="text-slate-400">Bloqueio:</span>
                <span className="font-mono">[E] ou [Shift]</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-900">
                <span className="text-slate-400">Socos (Fraco/Forte):</span>
                <span className="font-mono">[F] / [R]</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-900">
                <span className="text-slate-400">Chutes (Fraco/Forte):</span>
                <span className="font-mono">[G] / [T]</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-900">
                <span className="text-slate-400">Golpe Especial:</span>
                <span className="font-mono">[Q]</span>
              </div>
              <div className="flex justify-between py-1 bg-slate-900 px-2 rounded mt-2">
                <span className="text-yellow-400 font-semibold">SUPER GOLPE:</span>
                <span className="font-mono font-bold text-white">[ENTER]</span>
              </div>
            </div>
          </div>

          {/* Player 2 */}
          <div className="bg-slate-950 p-3 rounded border border-slate-800 flex flex-col gap-2">
            <span className="font-bold text-red-400 text-sm border-b border-slate-800 pb-1">
              JOGADOR 2 (P2)
            </span>
            <div className="space-y-1 text-slate-300">
              <div className="flex justify-between py-0.5 border-b border-slate-900">
                <span className="text-slate-400">Mover:</span>
                <span className="font-mono">[←] / [→]</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-900">
                <span className="text-slate-400">Pular:</span>
                <span className="font-mono font-bold text-white">[↑]</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-900">
                <span className="text-slate-400">Agachar:</span>
                <span className="font-mono">[↓]</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-900">
                <span className="text-slate-400">Bloqueio:</span>
                <span className="font-mono">[Num 0] ou [Ctrl]</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-900">
                <span className="text-slate-400">Socos (Fraco/Forte):</span>
                <span className="font-mono">[Num 4] / [Num 7]</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-900">
                <span className="text-slate-400">Chutes (Fraco/Forte):</span>
                <span className="font-mono">[Num 5] / [Num 8]</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-900">
                <span className="text-slate-400">Golpe Especial:</span>
                <span className="font-mono">[Num 9]</span>
              </div>
              <div className="flex justify-between py-1 bg-slate-900 px-2 rounded mt-2">
                <span className="text-yellow-400 font-semibold">SUPER GOLPE:</span>
                <span className="font-mono font-bold text-white">[Num Enter]</span>
              </div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            sounds.playSelect();
            onClose();
          }}
          className="mt-2 py-2 rounded bg-slate-800 hover:bg-slate-700 font-bold text-xs uppercase tracking-wider text-slate-200 transition-colors cursor-pointer"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};
