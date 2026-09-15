import React, { useState } from 'react';
import { X, Sparkles, Shield, Zap, Flame, Swords, FileText, ChevronRight } from 'lucide-react';
import { sounds } from '../../game/audio/soundManager';

import patchNotes from '../../data/patchNotes.json';
const PATCH_SECTIONS = patchNotes;

export const PatchNotesModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0c0f17] border border-slate-700/80 rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-wide text-white uppercase font-sans">
                  Notas de Atualização & Balanceamento
                </h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Patch v1.1.0
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Revisão cirúrgica de 30 itens: reworks de habilidades, correções de bugs, física e novos efeitos.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playSelect();
              onClose();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800/80 bg-slate-950/60 px-6 gap-2">
          {PATCH_SECTIONS.map((section, idx) => {
            const sectionTitle = section.section || section.title || `Seção ${idx + 1}`;
            const badgeCount = section.changes ? section.changes.length : 0;
            const isActive = activeTab === idx;
            return (
              <button
                key={sectionTitle}
                onClick={() => {
                  sounds.playSelect();
                  setActiveTab(idx);
                }}
                className={`py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-amber-400 text-amber-300 bg-amber-400/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <Sparkles size={14} className={isActive ? 'text-amber-400' : 'text-slate-500'} />
                <span>{sectionTitle}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-normal">
                  {badgeCount} itens
                </span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[60vh] scrollbar-thin scrollbar-thumb-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {PATCH_SECTIONS[activeTab].changes.map((item, i) => (
              <div
                key={i}
                className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white tracking-wide">
                      {item.title}
                    </span>
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300/90 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-500">
          <span>Mudanças aplicadas em tempo real em todos os modos offline, torneio e online.</span>
          <button
            onClick={() => {
              sounds.playSelect();
              onClose();
            }}
            className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase text-xs tracking-wider transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
};
