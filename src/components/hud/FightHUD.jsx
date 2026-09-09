import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Pause, Play, Music } from 'lucide-react';

export const FightHUD = ({
  gameState,
  char1,
  char2,
  isPaused,
  onTogglePause,
  isMuted,
  onToggleMute,
  currentTrack,
  onNextMusic,
}) => {
  const [trackNotification, setTrackNotification] = useState('');

  const handleMusicSwitch = () => {
    if (onNextMusic) {
      const newTrack = onNextMusic();
      if (newTrack) {
        setTrackNotification(`🎵 ${newTrack.title}`);
      }
    }
  };

  useEffect(() => {
    if (trackNotification) {
      const timer = setTimeout(() => setTrackNotification(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [trackNotification]);

  if (!gameState || !char1 || !char2) return null;

  const {
    p1Health = 1000,
    p1MaxHealth = 1000,
    p1Energy = 0,
    p1Combo = 0,
    p1VersoRank = null,
    p2Health = 1000,
    p2MaxHealth = 1000,
    p2Energy = 0,
    p2Combo = 0,
    p2VersoRank = null,
    roundTimer = 99,
    currentRound = 1,
    p1Wins = 0,
    p2Wins = 0,
    statusMessage = '',
    statusSubMessage = '',
  } = gameState;

  const rankBadgeStyle = (rank) => {
    switch (rank) {
      case 'S': return 'bg-rose-950/80 text-rose-400 border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)] animate-pulse';
      case 'A': return 'bg-orange-950/80 text-orange-400 border-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]';
      case 'B': return 'bg-amber-950/80 text-amber-300 border-amber-500';
      case 'C': return 'bg-emerald-950/80 text-emerald-400 border-emerald-500';
      case 'D': return 'bg-sky-950/80 text-sky-400 border-sky-500';
      case 'E':
      default: return 'bg-slate-900/80 text-slate-400 border-slate-600';
    }
  };

  const rankMultiplier = (rank) => {
    switch (rank) {
      case 'S': return '200%';
      case 'A': return '175%';
      case 'B': return '150%';
      case 'C': return '125%';
      case 'D': return '100%';
      case 'E':
      default: return '75%';
    }
  };

  const p1HealthPercent = Math.max(0, Math.min(100, (p1Health / p1MaxHealth) * 100));
  const p2HealthPercent = Math.max(0, Math.min(100, (p2Health / p2MaxHealth) * 100));

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 select-none">
      {/* Top Header: Health Bars & Timer */}
      <div className="w-full flex items-center justify-between gap-4 max-w-6xl mx-auto">
        {/* Player 1 */}
        <div className="flex-1 flex flex-col items-start">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-base text-slate-100">
              {char1.name}
            </span>
            {p1VersoRank && (
              <span
                className={`text-xs font-black px-2 py-0.5 rounded border font-mono tracking-wider flex items-center gap-1 ${rankBadgeStyle(p1VersoRank)}`}
                title={`Rank de Estilo ${p1VersoRank}: ${rankMultiplier(p1VersoRank)} de dano`}
              >
                RANK {p1VersoRank} <span className="text-[10px] opacity-80 font-normal">({rankMultiplier(p1VersoRank)})</span>
              </span>
            )}
            <div className="flex gap-1 ml-2">
              {[0, 1].map((idx) => (
                <div
                  key={idx}
                  className={`w-3 h-3 rounded-full border border-slate-500 ${
                    idx < p1Wins ? 'bg-yellow-400' : 'bg-slate-900'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="w-full h-6 bg-slate-950 rounded border border-slate-700 overflow-hidden flex flex-row-reverse">
            <div
              className="h-full bg-emerald-500 transition-all duration-100"
              style={{ width: `${p1HealthPercent}%` }}
            />
          </div>

          <div className="w-2/3 h-2 bg-slate-950 rounded border border-slate-700 mt-1 overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-100"
              style={{ width: `${p1Energy}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">
            {p1Energy >= 100 ? 'ESPECIAL PRONTO [ENTER]' : `ENERGIA: ${Math.round(p1Energy)}%`}
          </span>
        </div>

        {/* Center Timer & Controls */}
        <div className="flex flex-col items-center mx-2 pointer-events-auto">
          <div className="w-14 h-14 rounded bg-slate-950 border border-slate-700 flex items-center justify-center shadow-lg">
            <span className="text-2xl font-bold text-white font-mono">
              {roundTimer}
            </span>
          </div>
          <div className="flex gap-1 mt-1.5">
            <button
              onClick={onTogglePause}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Pausar [Esc]"
            >
              {isPaused ? <Play size={13} /> : <Pause size={13} />}
            </button>
            <button
              onClick={onToggleMute}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={isMuted ? 'Desmutar' : 'Mutar'}
            >
              {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            </button>
            <button
              onClick={handleMusicSwitch}
              className="p-1.5 rounded bg-amber-950/70 hover:bg-amber-900 border border-amber-600/70 text-amber-300 hover:text-amber-100 transition-colors cursor-pointer flex items-center gap-1"
              title={`Trocar Música [Tecla M] (Atual: ${currentTrack?.title || 'Trilha'})`}
            >
              <Music size={13} />
            </button>
          </div>

          {/* Notificação Flutuante ao Trocar Música */}
          {trackNotification && (
            <div className="absolute top-20 bg-black/90 border border-amber-500/80 text-amber-300 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xl backdrop-blur-md animate-bounce">
              {trackNotification}
            </div>
          )}
        </div>

        {/* Player 2 */}
        <div className="flex-1 flex flex-col items-end">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex gap-1 mr-2">
              {[0, 1].map((idx) => (
                <div
                  key={idx}
                  className={`w-3 h-3 rounded-full border border-slate-500 ${
                    idx < p2Wins ? 'bg-yellow-400' : 'bg-slate-900'
                  }`}
                />
              ))}
            </div>
            {p2VersoRank && (
              <span
                className={`text-xs font-black px-2 py-0.5 rounded border font-mono tracking-wider flex items-center gap-1 ${rankBadgeStyle(p2VersoRank)}`}
                title={`Rank de Estilo ${p2VersoRank}: ${rankMultiplier(p2VersoRank)} de dano`}
              >
                RANK {p2VersoRank} <span className="text-[10px] opacity-80 font-normal">({rankMultiplier(p2VersoRank)})</span>
              </span>
            )}
            <span className="font-bold text-base text-slate-100">
              {char2.name}
            </span>
          </div>

          <div className="w-full h-6 bg-slate-950 rounded border border-slate-700 overflow-hidden flex flex-row">
            <div
              className="h-full bg-emerald-500 transition-all duration-100"
              style={{ width: `${p2HealthPercent}%` }}
            />
          </div>

          <div className="w-2/3 h-2 bg-slate-950 rounded border border-slate-700 mt-1 overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all duration-100"
              style={{ width: `${p2Energy}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">
            {p2Energy >= 100 ? 'ESPECIAL PRONTO' : `ENERGIA: ${Math.round(p2Energy)}%`}
          </span>
        </div>
      </div>

      {/* Combo Floating Counters */}
      <div className="w-full flex justify-between px-12 pointer-events-none">
        {p1Combo > 1 && (
          <div className="flex flex-col items-start font-mono">
            <span className="text-3xl font-black text-blue-400">
              {p1Combo} HITS
            </span>
          </div>
        )}
        {p2Combo > 1 && (
          <div className="flex flex-col items-end font-mono">
            <span className="text-3xl font-black text-red-400">
              {p2Combo} HITS
            </span>
          </div>
        )}
      </div>

      {/* Center Announcer */}
      {statusMessage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="px-8 py-3 bg-black/90 border border-slate-600 flex flex-col items-center">
            <h1 className="text-5xl font-black tracking-widest text-white uppercase font-mono">
              {statusMessage}
            </h1>
            {statusSubMessage && (
              <span className="text-sm font-semibold tracking-widest text-slate-300 mt-1 uppercase">
                {statusSubMessage}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Bottom Hint */}
      <div className="w-full text-center text-xs text-slate-400 bg-slate-950/80 py-1 border-t border-slate-800">
        P1: [A/D] Mover | [W / Espaço] Pular | [S] Agachar | [F/R] Socos | [G/T] Chutes | [E] Bloqueio | [Enter] Especial
      </div>
    </div>
  );
};
