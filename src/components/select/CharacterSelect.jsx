import React, { useState, useEffect, useRef } from 'react';
import { CHARACTERS } from '../../game/characters/characterData';
import { EXPEDITION_33_CHARACTERS } from '../../game/characters/expedition33Characters';
import { STAGES } from '../../game/engine/Stage';
import { EXPEDITION_STAGES } from '../../game/engine/ExpeditionStages';
import { Fighter } from '../../game/engine/Fighter';
import { sounds } from '../../game/audio/soundManager';

export const CharacterSelect = ({
  mode,
  graphicsMode = 'BELLE_EPOQUE_2D',
  isExpedition = false,
  onStartMatch,
  onBackToMenu
}) => {
  const charList = isExpedition ? EXPEDITION_33_CHARACTERS : CHARACTERS;
  const stageList = isExpedition ? EXPEDITION_STAGES : STAGES;

  const [p1Index, setP1Index] = useState(0);
  const [p2Index, setP2Index] = useState(1);
  const [selectedStage, setSelectedStage] = useState(isExpedition ? 'monolith_33' : 'cyber_arena');
  const [aiDifficulty, setAiDifficulty] = useState('medium');

  const canvasRef = useRef(null);

  const selectedCharP1 = charList[p1Index] || charList[0];
  const selectedCharP2 = charList[p2Index] || charList[1];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const f1 = new Fighter(selectedCharP1, false, 280);
    f1.position.set(130, 280);
    const f2 = new Fighter(selectedCharP2, true, 280);
    f2.position.set(370, 280);

    const renderLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = isExpedition ? '#d4af37' : '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, 280);
      ctx.lineTo(480, 280);
      ctx.stroke();

      f1.charData = selectedCharP1;
      f2.charData = selectedCharP2;
      f1.update(0.016);
      f2.update(0.016);
      f1.draw(ctx, false, graphicsMode, isExpedition);
      f2.draw(ctx, false, graphicsMode, isExpedition);

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [selectedCharP1, selectedCharP2, graphicsMode, isExpedition]);

  const handleSelectP1 = (index) => {
    setP1Index(index);
    sounds.playSelect();
  };

  const handleSelectP2 = (index) => {
    setP2Index(index);
    sounds.playSelect();
  };

  const handleConfirm = () => {
    sounds.playPunch(false);
    onStartMatch({
      p1Id: selectedCharP1.id,
      p2Id: selectedCharP2.id,
      stageId: selectedStage,
      difficulty: aiDifficulty,
      isExpedition
    });
  };

  return (
    <div className={`w-full h-full flex flex-col justify-between p-6 select-none ${
      isExpedition ? 'bg-[#06080e] text-amber-100' : 'bg-[#0a0a0f] text-slate-200'
    }`}>
      {/* Top Header */}
      <div className={`flex items-center justify-between border-b pb-3 ${
        isExpedition ? 'border-amber-900/50' : 'border-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToMenu}
            className={`px-3 py-1 rounded text-xs font-semibold border transition-colors cursor-pointer ${
              isExpedition
                ? 'bg-amber-950/80 hover:bg-amber-900 border-amber-700 text-amber-200'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
          >
            ← Voltar
          </button>
          <h1 className={`text-xl font-bold tracking-wider ${
            isExpedition ? 'text-amber-300 font-serif' : 'text-white'
          }`}>
            {isExpedition ? 'CLAIR OBSCUR: EXPEDITION 33' : 'SELEÇÃO DE PERSONAGENS'}
          </h1>
        </div>

        {/* Stage & Difficulty Selectors */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded border border-slate-800">
            <span className="text-slate-400">Cenário:</span>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="bg-slate-800 text-white rounded px-2 py-0.5 border border-slate-700 outline-none cursor-pointer"
            >
              {stageList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {mode !== 'VERSUS' && (
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded border border-slate-800">
              <span className="text-slate-400">Dificuldade:</span>
              <select
                value={aiDifficulty}
                onChange={(e) => setAiDifficulty(e.target.value)}
                className="bg-slate-800 text-white rounded px-2 py-0.5 border border-slate-700 outline-none cursor-pointer"
              >
                <option value="easy">Fácil</option>
                <option value="medium">Médio</option>
                <option value="hard">Difícil</option>
                <option value="boss">Boss</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Grid of Characters & Preview */}
      <div className="flex-1 flex gap-6 my-4 items-center justify-between overflow-hidden">
        {/* Left Column: Character Grid */}
        <div className="w-7/12 flex flex-col justify-center">
          <div className={`grid gap-2.5 max-h-[480px] ${
            isExpedition ? 'grid-cols-3' : 'grid-cols-5'
          }`}>
            {charList.map((char, index) => {
              const isP1 = p1Index === index;
              const isP2 = p2Index === index;

              return (
                <div
                  key={char.id}
                  onClick={() => handleSelectP1(index)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleSelectP2(index);
                  }}
                  className={`relative p-2 rounded border cursor-pointer transition-all flex flex-col justify-between overflow-hidden ${
                    isExpedition ? 'h-24' : 'h-20'
                  } ${
                    isP1
                      ? 'border-blue-500 bg-blue-950/70 shadow-lg shadow-blue-950/60 ring-1 ring-blue-400'
                      : isP2
                      ? 'border-red-500 bg-red-950/70 shadow-lg shadow-red-950/60 ring-1 ring-red-400'
                      : isExpedition
                      ? 'border-amber-900/40 bg-slate-950/90 hover:border-amber-500 hover:bg-slate-900'
                      : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                  }`}
                >
                  <div className="absolute top-1 left-1 flex gap-1 z-10">
                    {isP1 && (
                      <span className="px-1.5 bg-blue-600 text-white text-[9px] font-bold rounded shadow">
                        P1
                      </span>
                    )}
                    {isP2 && (
                      <span className="px-1.5 bg-red-600 text-white text-[9px] font-bold rounded shadow">
                        {mode === 'VERSUS' ? 'P2' : 'CPU'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 h-full">
                    {char.image && (
                      <div className="w-12 h-16 rounded border border-amber-800/60 overflow-hidden flex-shrink-0 bg-black/60 shadow">
                        <img
                          src={char.image}
                          alt={char.name}
                          className="w-full h-full object-cover object-top"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                      <div>
                        <span className={`text-xs font-bold block truncate ${
                          isExpedition ? 'text-amber-200 font-serif' : 'text-slate-200'
                        }`}>
                          {char.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {char.title}
                        </span>
                        {char.style && (
                          <span className="text-[9px] text-amber-400/80 block truncate mt-0.5 font-mono">
                            {char.style}
                          </span>
                        )}
                      </div>
                      <div
                        className="w-full h-1 rounded-full mt-1"
                        style={{ backgroundColor: char.themeColor }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex justify-between">
            <span>Clique Esquerdo: P1 | Clique Direito: P2/CPU</span>
            <span>{charList.length} Personagens Disponíveis</span>
          </div>
        </div>

        {/* Right Column: Preview & Controls */}
        <div className={`w-5/12 h-full flex flex-col justify-between rounded border p-3.5 ${
          isExpedition
            ? 'bg-slate-950/90 border-amber-900/60 shadow-xl'
            : 'bg-slate-900/60 border-slate-800'
        }`}>
          {/* Duel Header Cards */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            {/* P1 Card */}
            <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded border border-blue-900/60 shadow-inner">
              {selectedCharP1.image && (
                <div className="w-12 h-16 rounded border border-blue-500/50 overflow-hidden flex-shrink-0 bg-black">
                  <img src={selectedCharP1.image} alt={selectedCharP1.name} className="w-full h-full object-cover object-top" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="font-bold text-blue-300 text-xs block truncate">{selectedCharP1.name}</span>
                <span className="text-[9px] text-slate-400 block truncate">{selectedCharP1.title}</span>
                <div className="text-[9px] text-slate-300 space-y-0.5 mt-0.5">
                  <div>Atk: {Math.round(selectedCharP1.stats.attackPower * 100)}% | Def: {Math.round(selectedCharP1.stats.defense * 100)}%</div>
                  <div>Velocidade: {selectedCharP1.stats.speed}</div>
                </div>
              </div>
            </div>

            {/* P2 Card */}
            <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded border border-red-900/60 shadow-inner">
              {selectedCharP2.image && (
                <div className="w-12 h-16 rounded border border-red-500/50 overflow-hidden flex-shrink-0 bg-black">
                  <img src={selectedCharP2.image} alt={selectedCharP2.name} className="w-full h-full object-cover object-top" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="font-bold text-red-300 text-xs block truncate">{selectedCharP2.name}</span>
                <span className="text-[9px] text-slate-400 block truncate">{selectedCharP2.title}</span>
                <div className="text-[9px] text-slate-300 space-y-0.5 mt-0.5">
                  <div>Atk: {Math.round(selectedCharP2.stats.attackPower * 100)}% | Def: {Math.round(selectedCharP2.stats.defense * 100)}%</div>
                  <div>Velocidade: {selectedCharP2.stats.speed}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative w-full h-44 bg-slate-950 rounded border border-slate-800 overflow-hidden flex items-center justify-center">
            <canvas ref={canvasRef} width={500} height={300} className="w-full h-full object-contain" />
            <div className="absolute top-2 left-3 text-blue-400 text-xs font-semibold">
              P1: {selectedCharP1.name}
            </div>
            <div className="absolute top-2 right-3 text-red-400 text-xs font-semibold">
              {mode === 'VERSUS' ? 'P2' : 'CPU'}: {selectedCharP2.name}
            </div>
          </div>

          <button
            onClick={handleConfirm}
            className={`w-full py-2.5 rounded font-bold text-sm uppercase tracking-wider transition-colors cursor-pointer ${
              isExpedition
                ? 'bg-amber-600 hover:bg-amber-500 text-black font-serif'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            Iniciar Duelo
          </button>
        </div>
      </div>
    </div>
  );
};
