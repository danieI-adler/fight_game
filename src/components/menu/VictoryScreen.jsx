import React from 'react';
import { sounds } from '../../game/audio/soundManager';
import { Bug } from 'lucide-react';
import { openGitHubIssue } from '../../utils/githubFeedback';

export const VictoryScreen = ({
  winner,
  loser,
  isTournament = false,
  tournamentLevel = 1,
  playerWon = false,
  onNextTournamentLevel,
  onRematch,
  onSelectCharacter,
  onMainMenu
}) => {
  return (
    <div className="absolute inset-0 bg-black/85 flex items-center justify-center z-50 select-none backdrop-blur-sm">
      <div className="w-96 bg-slate-950 border border-amber-900/60 rounded-lg p-6 shadow-2xl flex flex-col items-center text-center ring-1 ring-amber-500/20">
        <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-1 font-serif">
          ✦ {isTournament ? `TORNEIO IA: NÍVEL ${tournamentLevel}/10` : 'VITORIOSO'} ✦
        </span>

        {isTournament && (
          <div className="text-[11px] text-purple-300 font-mono mb-2 bg-purple-950/60 px-2.5 py-1 rounded border border-purple-800/60">
            {playerWon
              ? (tournamentLevel < 10 ? 'A IA analisou seu estilo e subiu de nível!' : '🏆 VOCÊ DERROTOU A IA MÁXIMA!')
              : 'A IA explorou suas fraquezas e venceu!'}
          </div>
        )}

        {winner.image && (
          <div className="w-24 h-32 rounded-lg border-2 border-amber-600/70 overflow-hidden mb-3 shadow-xl bg-black">
            <img src={winner.image} alt={winner.name} className="w-full h-full object-cover object-top" />
          </div>
        )}

        <h2 className="text-2xl font-black text-amber-200 uppercase mb-4 tracking-wider font-serif">
          {winner.name}
        </h2>

        <div className="flex flex-col gap-2.5 w-full">
          {isTournament && playerWon && tournamentLevel < 10 ? (
            <button
              onClick={() => {
                sounds.playPunch(true);
                if (onNextTournamentLevel) onNextTournamentLevel();
              }}
              className="py-2.5 px-4 rounded bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer font-serif shadow-lg animate-pulse"
            >
              Avançar p/ Nível {tournamentLevel + 1} (IA Adaptada)
            </button>
          ) : (
            <button
              onClick={() => {
                sounds.playPunch(false);
                onRematch();
              }}
              className="py-2.5 px-4 rounded bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer font-serif"
            >
              {isTournament ? 'Tentar Nível Novamente' : 'Jogar Novamente'}
            </button>
          )}

          <button
            onClick={() => {
              sounds.playSelect();
              onSelectCharacter();
            }}
            className="py-2 px-4 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Selecionar Personagens
          </button>

          <button
            onClick={() => {
              sounds.playSelect();
              onMainMenu();
            }}
            className="py-2 px-4 rounded bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Menu Principal
          </button>

          <button
            onClick={() => {
              sounds.playSelect();
              openGitHubIssue('bug', { character: winner?.name });
            }}
            className="py-1.5 px-3 rounded bg-red-950/40 hover:bg-red-900/60 border border-red-900/40 text-red-300 hover:text-red-200 text-[11px] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 mt-0.5"
          >
            <Bug size={13} className="text-red-400" />
            <span>Reportar Bug / Feedback</span>
          </button>
        </div>
      </div>
    </div>
  );
};
