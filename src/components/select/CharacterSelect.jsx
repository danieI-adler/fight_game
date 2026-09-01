import React, { useState, useEffect, useRef } from 'react';
import { CHARACTERS } from '../../game/characters/characterData';
import { STAGES } from '../../game/engine/Stage';
import { Fighter } from '../../game/engine/Fighter';
import { sounds } from '../../game/audio/soundManager';
import { Swords, Bot, Sparkles, Shield, Zap, Flame, Award } from 'lucide-react';

export const CharacterSelect = ({ mode, onStartMatch, onBackToMenu }) => {
  const [p1Index, setP1Index] = useState(0);
  const [p2Index, setP2Index] = useState(1);
  const [selectedStage, setSelectedStage] = useState('cyber_arena');
  const [aiDifficulty, setAiDifficulty] = useState('medium');
  const [p1Locked, setP1Locked] = useState(false);
  const [p2Locked, setP2Locked] = useState(mode !== 'VERSUS'); // Se for contra IA, P2 já pode ser locked ou escolhido

  const canvasRef = useRef(null);
  const previewFighterRef = useRef(null);

  const selectedCharP1 = CHARACTERS[p1Index];
  const selectedCharP2 = CHARACTERS[p2Index];

  // Animação de preview em tempo real no Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const f1 = new Fighter(selectedCharP1, false, 280);
    f1.position.set(130, 280);
    const f2 = new Fighter(selectedCharP2, true, 280);
    f2.position.set(370, 280);

    const renderLoop = (time) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Linha do chão neon
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(20, 280);
      ctx.lineTo(480, 280);
      ctx.stroke();

      f1.charData = selectedCharP1;
      f2.charData = selectedCharP2;
      f1.update(0.016);
      f2.update(0.016);
      f1.draw(ctx);
      f2.draw(ctx);

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [selectedCharP1, selectedCharP2]);

  const handleSelectP1 = (index) => {
    setP1Index(index);
    sounds.playSelect();
  };

  const handleSelectP2 = (index) => {
    setP2Index(index);
    sounds.playSelect();
  };

  const handleConfirm = () => {
    sounds.playPunch(true);
    onStartMatch({
      p1Id: selectedCharP1.id,
      p2Id: selectedCharP2.id,
      stageId: selectedStage,
      difficulty: aiDifficulty,
    });
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-6 bg-slate-950/95 text-slate-100 overflow-hidden select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToMenu}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold uppercase tracking-wider text-slate-300 border border-slate-700 transition-colors cursor-pointer"
          >
            ← Voltar
          </button>
          <h1 className="text-2xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-rose-400">
            SELEÇÃO DE LUTADORES
          </h1>
        </div>

        {/* Stage & Difficulty Selectors */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-semibold uppercase">Cenário:</span>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="bg-slate-800 text-cyan-300 rounded px-2 py-1 border border-slate-700 outline-none cursor-pointer"
            >
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {mode !== 'VERSUS' && (
            <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
              <Bot size={14} className="text-amber-400" />
              <span className="text-slate-400 font-semibold uppercase">Dificuldade IA:</span>
              <select
                value={aiDifficulty}
                onChange={(e) => setAiDifficulty(e.target.value)}
                className="bg-slate-800 text-amber-300 rounded px-2 py-1 border border-slate-700 outline-none cursor-pointer"
              >
                <option value="easy">Fácil (Iniciante)</option>
                <option value="medium">Médio (Padrão)</option>
                <option value="hard">Difícil (Desafio)</option>
                <option value="boss">Boss (Extremo)</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid & Preview Section */}
      <div className="flex-1 flex gap-6 my-4 items-center justify-between overflow-hidden">
        {/* Left Column: Character Grid (4 x 5 = 20 Characters) */}
        <div className="w-7/12 flex flex-col justify-center">
          <div className="grid grid-cols-5 gap-2.5 max-h-[480px]">
            {CHARACTERS.map((char, index) => {
              const isP1 = p1Index === index;
              const isP2 = p2Index === index;

              return (
                <div
                  key={char.id}
                  onClick={() => {
                    if (mode === 'VERSUS') {
                      if (!p1Locked) handleSelectP1(index);
                      else handleSelectP2(index);
                    } else {
                      handleSelectP1(index);
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleSelectP2(index);
                  }}
                  className={`relative p-2 rounded-xl border-2 cursor-pointer transition-all duration-200 flex flex-col items-center justify-between h-20 ${
                    isP1
                      ? 'border-cyan-400 bg-cyan-950/60 shadow-[0_0_15px_rgba(0,240,255,0.4)] scale-105 z-10'
                      : isP2
                      ? 'border-rose-500 bg-rose-950/60 shadow-[0_0_15px_rgba(244,63,94,0.4)] scale-105 z-10'
                      : 'border-slate-800 bg-slate-900/70 hover:border-slate-600 hover:bg-slate-800/80'
                  }`}
                >
                  {/* Indicators P1 / P2 */}
                  <div className="absolute top-1 left-1 flex gap-1">
                    {isP1 && (
                      <span className="px-1.5 py-0.2 bg-cyan-500 text-slate-950 text-[9px] font-black rounded">
                        P1
                      </span>
                    )}
                    {isP2 && (
                      <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[9px] font-black rounded">
                        {mode === 'VERSUS' ? 'P2' : 'CPU'}
                      </span>
                    )}
                  </div>

                  <span className="text-xl mt-1">{char.avatarIcon}</span>
                  <div className="w-full text-center">
                    <span className="text-[11px] font-bold text-slate-200 block truncate">
                      {char.name}
                    </span>
                    <span className="text-[9px] text-slate-400 block truncate">
                      {char.title}
                    </span>
                  </div>

                  {/* Character Theme Color Dot */}
                  <div
                    className="w-full h-1 rounded-full mt-1"
                    style={{ backgroundColor: char.themeColor }}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>Clique Esquerdo: Selecionar P1 | Clique Direito: Selecionar P2/CPU</span>
            <span className="text-cyan-400 font-semibold">20 Lutadores Disponíveis</span>
          </div>
        </div>

        {/* Right Column: Dynamic Preview & Stats Radar */}
        <div className="w-5/12 h-full flex flex-col justify-between bg-slate-900/60 rounded-2xl border border-slate-800 p-4">
          {/* Animated Fighters Canvas */}
          <div className="relative w-full h-52 bg-slate-950/80 rounded-xl border border-slate-800/80 overflow-hidden flex items-center justify-center">
            <canvas ref={canvasRef} width={500} height={300} className="w-full h-full object-contain" />
            <div className="absolute top-2 left-3 text-cyan-400 text-xs font-bold uppercase tracking-wider">
              P1: {selectedCharP1.name}
            </div>
            <div className="absolute top-2 right-3 text-rose-400 text-xs font-bold uppercase tracking-wider">
              {mode === 'VERSUS' ? 'P2' : 'CPU'}: {selectedCharP2.name}
            </div>
          </div>

          {/* Character Details & Stats */}
          <div className="grid grid-cols-2 gap-3 my-2 text-xs">
            {/* P1 Stats */}
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-cyan-500/30">
              <span className="font-bold text-cyan-300 block mb-1">{selectedCharP1.name} ({selectedCharP1.title})</span>
              <p className="text-[10px] text-slate-400 mb-2 leading-tight">{selectedCharP1.description}</p>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span>Ataque:</span>
                  <span className="text-amber-400 font-bold">{Math.round(selectedCharP1.stats.attackPower * 100)}%</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Defesa:</span>
                  <span className="text-emerald-400 font-bold">{Math.round(selectedCharP1.stats.defense * 100)}%</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Velocidade:</span>
                  <span className="text-cyan-400 font-bold">{selectedCharP1.stats.speed}</span>
                </div>
              </div>
            </div>

            {/* P2 Stats */}
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-rose-500/30">
              <span className="font-bold text-rose-300 block mb-1">{selectedCharP2.name} ({selectedCharP2.title})</span>
              <p className="text-[10px] text-slate-400 mb-2 leading-tight">{selectedCharP2.description}</p>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span>Ataque:</span>
                  <span className="text-amber-400 font-bold">{Math.round(selectedCharP2.stats.attackPower * 100)}%</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Defesa:</span>
                  <span className="text-emerald-400 font-bold">{Math.round(selectedCharP2.stats.defense * 100)}%</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Velocidade:</span>
                  <span className="text-rose-400 font-bold">{selectedCharP2.stats.speed}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Start Fight Button */}
          <button
            onClick={handleConfirm}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-slate-950 font-black text-base uppercase tracking-widest shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all transform hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2"
          >
            <Swords size={20} />
            INICIAR COMBATE!
          </button>
        </div>
      </div>
    </div>
  );
};
