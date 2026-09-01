import React from 'react';
import { X, Gamepad2, Keyboard, Zap, Shield, Swords } from 'lucide-react';
import { sounds } from '../../game/audio/soundManager';

export const ControlsGuide = ({ onClose }) => {
  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-6 select-none">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-[0_0_40px_rgba(0,0,0,0.8)] flex flex-col justify-between max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Gamepad2 className="text-cyan-400" size={24} />
            <h2 className="text-2xl font-black italic tracking-wider text-slate-100">
              GUIA DE CONTROLES & GOLPES
            </h2>
          </div>
          <button
            onClick={() => {
              sounds.playSelect();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Columns: Player 1 vs Player 2 */}
        <div className="grid grid-cols-2 gap-6 my-4 text-xs">
          {/* Player 1 Controls */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-cyan-500/30 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-cyan-400 font-black text-sm mb-1">
              <Keyboard size={16} />
              <span>JOGADOR 1 (TECLADO / GAMEPAD 1)</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Movimento:</span>
                <span className="font-bold text-white">[A] Esquerda / [D] Direita</span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Pulo & Agacho:</span>
                <span className="font-bold text-white">[W] Pular / [S] Agachar</span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Socos:</span>
                <span className="font-bold text-cyan-300">[F] Fraco / [R] Forte</span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Chutes:</span>
                <span className="font-bold text-emerald-300">[G] Fraco / [T] Forte</span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Defesa (Block):</span>
                <span className="font-bold text-blue-300">[E] ou [Shift Esq]</span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Habilidade Especial:</span>
                <span className="font-bold text-amber-300">[Q] (Consome 25%)</span>
              </div>
              <div className="col-span-2 bg-gradient-to-r from-cyan-950 to-indigo-950 p-2 rounded border border-cyan-500/40 text-center">
                <span className="text-cyan-300 font-black block text-xs">⚡ GOLPE SUPER / ULTIMATE:</span>
                <span className="font-bold text-white text-sm">[BARRA DE ESPAÇO] (100% de Energia)</span>
              </div>
            </div>
          </div>

          {/* Player 2 Controls */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-rose-500/30 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-rose-400 font-black text-sm mb-1">
              <Keyboard size={16} />
              <span>JOGADOR 2 (TECLADO / GAMEPAD 2)</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Movimento:</span>
                <span className="font-bold text-white">[←] Esquerda / [→] Direita</span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Pulo & Agacho:</span>
                <span className="font-bold text-white">[↑] Pular / [↓] Agachar</span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Socos:</span>
                <span className="font-bold text-rose-300">[Num 4 / B] Fraco / [Num 7 / H] Forte</span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Chutes:</span>
                <span className="font-bold text-orange-300">[Num 5 / N] Fraco / [Num 8 / M] Forte</span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Defesa (Block):</span>
                <span className="font-bold text-blue-300">[Num 0] ou [Ctrl Dir]</span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Habilidade Especial:</span>
                <span className="font-bold text-amber-300">[Num 9 / L] (Consome 25%)</span>
              </div>
              <div className="col-span-2 bg-gradient-to-r from-rose-950 to-orange-950 p-2 rounded border border-rose-500/40 text-center">
                <span className="text-rose-300 font-black block text-xs">⚡ GOLPE SUPER / ULTIMATE:</span>
                <span className="font-bold text-white text-sm">[ENTER] (100% de Energia)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mechanics Tips */}
        <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 flex items-center justify-around text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5">
            <Shield size={14} className="text-blue-400" />
            <span>Andar para trás ativa guarda automática</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Swords size={14} className="text-amber-400" />
            <span>Golpes no ar ou agachados mudam o alcance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap size={14} className="text-yellow-400" />
            <span>Combos rápidos geram carga de Super</span>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            sounds.playSelect();
            onClose();
          }}
          className="mt-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs uppercase tracking-wider text-slate-200 transition-colors cursor-pointer"
        >
          Entendido, Voltar ao Jogo
        </button>
      </div>
    </div>
  );
};
