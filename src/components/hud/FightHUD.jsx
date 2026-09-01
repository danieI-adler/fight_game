import React from 'react';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { sounds } from '../../game/audio/soundManager';

export const FightHUD = ({
  gameState,
  char1,
  char2,
  isPaused,
  onTogglePause,
  isMuted,
  onToggleMute,
}) => {
  if (!gameState || !char1 || !char2) return null;

  const {
    p1Health = 1000,
    p1MaxHealth = 1000,
    p1Energy = 0,
    p1Combo = 0,
    p2Health = 1000,
    p2MaxHealth = 1000,
    p2Energy = 0,
    p2Combo = 0,
    roundTimer = 99,
    currentRound = 1,
    p1Wins = 0,
    p2Wins = 0,
    statusMessage = '',
    statusSubMessage = '',
  } = gameState;

  const p1HealthPercent = Math.max(0, Math.min(100, (p1Health / p1MaxHealth) * 100));
  const p2HealthPercent = Math.max(0, Math.min(100, (p2Health / p2MaxHealth) * 100));

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 select-none">
      {/* Top Header: Health Bars & Timer */}
      <div className="w-full flex items-center justify-between gap-4 max-w-6xl mx-auto">
        {/* Player 1 Health & Energy */}
        <div className="flex-1 flex flex-col items-start">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-extrabold text-lg tracking-wider text-cyan-400 drop-shadow-md">
              {char1.name}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700">
              {char1.title}
            </span>
            <div className="flex gap-1 ml-2">
              {[0, 1].map((idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border border-amber-400/80 ${
                    idx < p1Wins ? 'bg-amber-400 shadow-[0_0_8px_#facc15]' : 'bg-slate-900/60'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Health Bar P1 */}
          <div className="w-full h-7 bg-slate-950/90 rounded-sm border-2 border-slate-700 overflow-hidden shadow-inner flex flex-row-reverse p-0.5">
            <div
              className="h-full bg-gradient-to-l from-emerald-400 via-yellow-400 to-red-500 transition-all duration-150 rounded-xs shadow-[0_0_12px_rgba(52,211,153,0.5)]"
              style={{ width: `${p1HealthPercent}%` }}
            />
          </div>

          {/* Energy / Super Meter P1 */}
          <div className="w-3/4 h-2.5 bg-slate-950/90 rounded-sm border border-cyan-500/50 mt-1 overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r from-blue-500 to-cyan-300 transition-all duration-100 ${
                p1Energy >= 100 ? 'animate-pulse bg-cyan-300 shadow-[0_0_10px_#00f0ff]' : ''
              }`}
              style={{ width: `${p1Energy}%` }}
            />
          </div>
          <span className="text-[10px] text-cyan-300 font-semibold tracking-widest mt-0.5">
            {p1Energy >= 100 ? '⚡ SUPER PRONTO (ESPAÇO)' : `ENERGIA: ${Math.round(p1Energy)}%`}
          </span>
        </div>

        {/* Center Round Timer & Controls */}
        <div className="flex flex-col items-center mx-2 pointer-events-auto">
          <div className="w-16 h-16 rounded-full bg-slate-950/90 border-3 border-amber-500 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.4)]">
            <span className="text-3xl font-black text-amber-400 font-mono tracking-tighter">
              {roundTimer}
            </span>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={onTogglePause}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-600 text-slate-200 transition-colors shadow-md cursor-pointer"
              title="Pausar"
            >
              {isPaused ? <Play size={15} /> : <Pause size={15} />}
            </button>
            <button
              onClick={onToggleMute}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-600 text-slate-200 transition-colors shadow-md cursor-pointer"
              title={isMuted ? 'Desmutar' : 'Mutar'}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
          </div>
        </div>

        {/* Player 2 Health & Energy */}
        <div className="flex-1 flex flex-col items-end">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex gap-1 mr-2">
              {[0, 1].map((idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border border-amber-400/80 ${
                    idx < p2Wins ? 'bg-amber-400 shadow-[0_0_8px_#facc15]' : 'bg-slate-900/60'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700">
              {char2.title}
            </span>
            <span className="font-extrabold text-lg tracking-wider text-rose-400 drop-shadow-md">
              {char2.name}
            </span>
          </div>

          {/* Health Bar P2 */}
          <div className="w-full h-7 bg-slate-950/90 rounded-sm border-2 border-slate-700 overflow-hidden shadow-inner flex flex-row p-0.5">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 via-yellow-400 to-red-500 transition-all duration-150 rounded-xs shadow-[0_0_12px_rgba(244,63,94,0.5)]"
              style={{ width: `${p2HealthPercent}%` }}
            />
          </div>

          {/* Energy / Super Meter P2 */}
          <div className="w-3/4 h-2.5 bg-slate-950/90 rounded-sm border border-rose-500/50 mt-1 overflow-hidden">
            <div
              className={`h-full bg-gradient-to-l from-rose-500 to-orange-300 transition-all duration-100 ${
                p2Energy >= 100 ? 'animate-pulse bg-rose-300 shadow-[0_0_10px_#f43f5e]' : ''
              }`}
              style={{ width: `${p2Energy}%` }}
            />
          </div>
          <span className="text-[10px] text-rose-300 font-semibold tracking-widest mt-0.5">
            {p2Energy >= 100 ? '⚡ SUPER PRONTO (ENTER)' : `ENERGIA: ${Math.round(p2Energy)}%`}
          </span>
        </div>
      </div>

      {/* Combo Floating Counters */}
      <div className="w-full flex justify-between px-12 pointer-events-none">
        {p1Combo > 1 && (
          <div className="animate-bounce flex flex-col items-start">
            <span className="text-4xl font-black italic text-cyan-300 drop-shadow-[0_0_12px_#00f0ff]">
              {p1Combo} HITS!
            </span>
            <span className="text-xs font-bold tracking-widest text-cyan-100 uppercase">
              Combo Eletrizante
            </span>
          </div>
        )}
        {p2Combo > 1 && (
          <div className="animate-bounce flex flex-col items-end">
            <span className="text-4xl font-black italic text-rose-400 drop-shadow-[0_0_12px_#f43f5e]">
              {p2Combo} HITS!
            </span>
            <span className="text-xs font-bold tracking-widest text-rose-100 uppercase">
              Combo Brutal
            </span>
          </div>
        )}
      </div>

      {/* Center Announcer Banner (ROUND 1 / FIGHT / K.O.) */}
      {statusMessage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="px-10 py-4 bg-slate-950/85 border-y-4 border-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.6)] transform skew-x-[-12deg] flex flex-col items-center">
            <h1 className="text-6xl font-black italic tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-red-500 drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] uppercase">
              {statusMessage}
            </h1>
            {statusSubMessage && (
              <span className="text-xl font-bold tracking-widest text-cyan-300 mt-1 uppercase">
                {statusSubMessage}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Bottom Hint */}
      <div className="w-full text-center text-xs text-slate-400/80">
        P1: [W A S D] Mover/Pular/Agachar | [F/R] Socos | [G/T] Chutes | [E] Bloqueio | [Espaço] Super
      </div>
    </div>
  );
};
