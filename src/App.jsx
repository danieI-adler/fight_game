import React, { useState, useEffect, useRef } from 'react';
import { GameEngine, GAME_STATUS } from './game/engine/GameEngine';
import { getCharacterById, CHARACTERS } from './game/characters/characterData';
import { getExpeditionCharacterById, EXPEDITION_33_CHARACTERS } from './game/characters/expedition33Characters';
import { sounds } from './game/audio/soundManager';
import { playerTracker } from './game/ai/PlayerProfileTracker';
import { MainMenu } from './components/menu/MainMenu';
import { CharacterSelect } from './components/select/CharacterSelect';
import { OnlineLobby } from './components/online/OnlineLobby';
import { FightHUD } from './components/hud/FightHUD';
import { PauseMenu } from './components/menu/PauseMenu';
import { VictoryScreen } from './components/menu/VictoryScreen';
import { ControlsGuide } from './components/menu/ControlsGuide';
import { TrainingOverlay } from './components/training/TrainingOverlay';
import { GraphicsSelectorModal, GRAPHICS_MODES } from './components/menu/GraphicsSelectorModal';

export function App() {
  const [screen, setScreen] = useState('MAIN_MENU'); // 'MAIN_MENU', 'SELECT', 'ONLINE_LOBBY', 'FIGHT'
  const [mode, setMode] = useState('ARCADE'); // 'ARCADE', 'VERSUS', 'TRAINING', 'ONLINE'
  const [graphicsMode, setGraphicsMode] = useState(() => {
    try {
      return localStorage.getItem('fight_graphics_mode') || GRAPHICS_MODES.BELLE_EPOQUE_2D;
    } catch (e) {
      return GRAPHICS_MODES.BELLE_EPOQUE_2D;
    }
  });
  const [isExpedition, setIsExpedition] = useState(() => {
    try {
      return localStorage.getItem('fight_expedition_mode') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [showGraphicsModal, setShowGraphicsModal] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [initialOnlineRoom, setInitialOnlineRoom] = useState('');
  const [currentTrack, setCurrentTrack] = useState(() => sounds.getCurrentTrack());

  const handleNextMusic = () => {
    const track = sounds.nextBGMTrack();
    setCurrentTrack(track);
    return track;
  };

  // Desbloqueio automático de áudio e atalho global [M] para alternar música
  useEffect(() => {
    const handleFirstInteraction = () => {
      sounds.init();
      sounds.startBGM();
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });

    const handleKeyDown = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.code === 'KeyM') {
        handleNextMusic();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleFirstInteraction);
    };
  }, []);

  // Dados da Partida
  const [matchConfig, setMatchConfig] = useState({
    p1Id: 1,
    p2Id: 2,
    stageId: 'cyber_arena',
    difficulty: 'medium',
    tournamentLevel: 1,
    isHost: true,
    isExpedition: false,
  });
  const [tournamentRoster, setTournamentRoster] = useState([]);
  const [gameState, setGameState] = useState(null);
  const [showHitboxes, setShowHitboxes] = useState(false);
  const [dummyBehavior, setDummyBehavior] = useState('dummy');
  const [doubleTapDashEnabled, setDoubleTapDashEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem('fightgame_double_tap_dash');
      return stored !== null ? stored === 'true' : true;
    } catch (e) {
      return true;
    }
  });

  const handleToggleDash = () => {
    const nextVal = !doubleTapDashEnabled;
    setDoubleTapDashEnabled(nextVal);
    try {
      localStorage.setItem('fightgame_double_tap_dash', String(nextVal));
    } catch (e) {}
    if (engineRef.current && engineRef.current.inputHandler) {
      engineRef.current.inputHandler.toggleDoubleTapDash(nextVal);
    }
  };

  /**
   * Sorteia 10 oponentes sem reposição da lista de personagens disponíveis,
   * excluindo expressamente Relâmpago McQueen e o personagem escolhido pelo jogador.
   */
  const generateTournamentRoster = (playerCharId, isExpeditionMode) => {
    const list = isExpeditionMode ? EXPEDITION_33_CHARACTERS : CHARACTERS;

    // Filtra para remover qualquer versão do McQueen e o personagem escolhido pelo jogador
    const eligible = list.filter((c) => {
      const name = (c.name || '').toLowerCase();
      const isMcQueen = name.includes('mcqueen') || name.includes('relampago') || c.id === 26 || c.id === 115 || c.isMcQueen;
      const isPlayerPick = c.id === Number(playerCharId);
      return !isMcQueen && !isPlayerPick;
    });

    // Embaralha aleatoriamente (Fisher-Yates) sem reposição
    const shuffled = [...eligible];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Se a lista elegível tiver menos que 10, preenche circularmente sem McQueen
    const roster = [];
    for (let i = 0; i < 10; i++) {
      roster.push(shuffled[i % shuffled.length]);
    }
    return roster;
  };

  const handleNextTournamentLevel = () => {
    const nextLvl = Math.min(10, (matchConfig.tournamentLevel || 1) + 1);
    const nextOpponent = tournamentRoster[nextLvl - 1] || tournamentRoster[0];
    const nextP2Id = nextOpponent ? nextOpponent.id : matchConfig.p2Id;

    setMatchConfig(prev => ({
      ...prev,
      p2Id: nextP2Id,
      tournamentLevel: nextLvl
    }));

    if (engineRef.current) {
      engineRef.current.startFight(
        matchConfig.p1Id,
        nextP2Id,
        'TOURNAMENT',
        'tournament',
        matchConfig.stageId,
        true,
        graphicsMode,
        isExpedition,
        nextLvl
      );
    }
  };

  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  // Checar se o link de entrada contém `?room=XXXX`
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const roomParam = urlParams.get('room');
      if (roomParam) {
        setInitialOnlineRoom(roomParam.toUpperCase());
        setMode('ONLINE');
        setScreen('ONLINE_LOBBY');
      }
    } catch (e) {}
  }, []);

  // Iniciar partida offline
  const handleStartMatch = (config) => {
    if (mode === 'TOURNAMENT') {
      const roster = generateTournamentRoster(config.p1Id, isExpedition);
      setTournamentRoster(roster);
      const firstEnemy = roster[0];
      setMatchConfig({
        ...config,
        p2Id: firstEnemy.id,
        tournamentLevel: 1,
        difficulty: 'tournament',
        isHost: true,
        isExpedition
      });
    } else {
      setMatchConfig({ ...config, isHost: true, isExpedition });
    }
    setScreen('FIGHT');
    setIsPaused(false);
  };

  // Iniciar partida online
  const handleStartOnlineMatch = (config) => {
    const onlineExpedition = config.isExpedition !== undefined ? config.isExpedition : false;
    setMatchConfig({
      ...config,
      isExpedition: onlineExpedition,
      graphicsMode: config.graphicsMode || graphicsMode
    });
    setMode('ONLINE');
    setScreen('FIGHT');
    setIsPaused(false);
  };

  // Inicialização e Loop do Motor de Luta
  useEffect(() => {
    if (screen !== 'FIGHT' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const engine = new GameEngine(canvas);
    engineRef.current = engine;

    engine.showHitboxes = showHitboxes;
    if (engine.inputHandler) {
      engine.inputHandler.doubleTapDashEnabled = doubleTapDashEnabled;
    }
    engine.onStateChange = (state) => {
      setGameState({ ...state });
    };

    const effectiveExpedition = matchConfig.isExpedition !== undefined ? matchConfig.isExpedition : isExpedition;
    const effectiveGraphics = matchConfig.graphicsMode || graphicsMode;

    engine.startFight(
      matchConfig.p1Id,
      matchConfig.p2Id,
      mode,
      matchConfig.difficulty,
      matchConfig.stageId,
      matchConfig.isHost !== undefined ? matchConfig.isHost : true,
      effectiveGraphics,
      effectiveExpedition,
      matchConfig.tournamentLevel || 1
    );

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [screen, matchConfig, mode, graphicsMode]);

  // Controles de Pausa
  const togglePause = () => {
    if (!engineRef.current || mode === 'ONLINE') return;
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    if (nextPaused) {
      engineRef.current.status = GAME_STATUS.PAUSED;
      engineRef.current.isRunning = false;
    } else {
      engineRef.current.status = GAME_STATUS.FIGHTING;
      engineRef.current.isRunning = true;
      engineRef.current.lastTime = performance.now();
      engineRef.current.loop();
    }
  };

  const toggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const handleRematch = () => {
    if (engineRef.current) {
      engineRef.current.startFight(
        matchConfig.p1Id,
        matchConfig.p2Id,
        mode,
        matchConfig.difficulty,
        matchConfig.stageId,
        matchConfig.isHost !== undefined ? matchConfig.isHost : true,
        graphicsMode,
        matchConfig.isExpedition !== undefined ? matchConfig.isExpedition : isExpedition,
        matchConfig.tournamentLevel || 1
      );
    }
  };

  const handleRestartRound = () => {
    if (engineRef.current && mode !== 'ONLINE') {
      engineRef.current.resetRound();
      setIsPaused(false);
      engineRef.current.isRunning = true;
      engineRef.current.lastTime = performance.now();
      engineRef.current.loop();
    }
  };

  const handleToggleHitboxes = () => {
    const next = !showHitboxes;
    setShowHitboxes(next);
    if (engineRef.current) {
      engineRef.current.showHitboxes = next;
    }
  };

  const handleChangeDummy = (behavior) => {
    setDummyBehavior(behavior);
    if (engineRef.current && engineRef.current.ai) {
      engineRef.current.ai.setDifficulty(behavior);
    }
  };

  const activeExpedition = matchConfig.isExpedition !== undefined ? matchConfig.isExpedition : isExpedition;
  const getChar = activeExpedition ? getExpeditionCharacterById : getCharacterById;
  const char1 = getChar(matchConfig.p1Id) || (activeExpedition ? getExpeditionCharacterById(101) : getCharacterById(1));
  const char2 = getChar(matchConfig.p2Id) || (activeExpedition ? getExpeditionCharacterById(102) : getCharacterById(2));
  const isMatchOver = gameState && gameState.status === GAME_STATUS.MATCH_OVER;
  const winner = gameState && (gameState.p1Wins >= 2 ? char1 : char2);
  const loser = gameState && (gameState.p1Wins >= 2 ? char2 : char1);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden font-sans">
      {/* 1. Menu Principal */}
      {screen === 'MAIN_MENU' && (
        <MainMenu
          onSelectMode={(selectedMode) => {
            setMode(selectedMode);
            if (selectedMode === 'TOURNAMENT') {
              playerTracker.reset();
              setMatchConfig(prev => ({ ...prev, tournamentLevel: 1, difficulty: 'tournament' }));
              setScreen('SELECT');
            } else if (selectedMode === 'ONLINE') {
              setScreen('ONLINE_LOBBY');
            } else {
              setScreen('SELECT');
            }
          }}
          onOpenControls={() => setShowControls(true)}
          onOpenGraphics={() => setShowGraphicsModal(true)}
          graphicsMode={graphicsMode}
          onSelectGraphicsMode={(mode) => {
            setGraphicsMode(mode);
            try {
              localStorage.setItem('fight_graphics_mode', mode);
            } catch (e) {}
          }}
          isExpedition={isExpedition}
          onToggleExpedition={() => {
            setIsExpedition((prev) => {
              const next = !prev;
              try {
                localStorage.setItem('fight_expedition_mode', String(next));
              } catch (e) {}
              if (next && (graphicsMode === GRAPHICS_MODES.STICK_2D || graphicsMode === GRAPHICS_MODES.BELLE_EPOQUE_2D)) {
                setGraphicsMode(GRAPHICS_MODES.EXPEDITION_HD_SPRITES);
                try {
                  localStorage.setItem('fight_graphics_mode', GRAPHICS_MODES.EXPEDITION_HD_SPRITES);
                } catch (e) {}
              }
              return next;
            });
          }}
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />
      )}

      {/* 2. Seleção de Personagens Offline */}
      {screen === 'SELECT' && (
        <CharacterSelect
          mode={mode}
          graphicsMode={graphicsMode}
          isExpedition={isExpedition}
          onOpenGraphics={() => setShowGraphicsModal(true)}
          onStartMatch={handleStartMatch}
          onBackToMenu={() => setScreen('MAIN_MENU')}
        />
      )}

      {/* 3. Sala / Lobby Online P2P */}
      {screen === 'ONLINE_LOBBY' && (
        <OnlineLobby
          initialRoomCode={initialOnlineRoom}
          graphicsMode={graphicsMode}
          isExpedition={isExpedition}
          onStartOnlineMatch={handleStartOnlineMatch}
          onBackToMenu={() => {
            setInitialOnlineRoom('');
            setScreen('MAIN_MENU');
          }}
        />
      )}

      {/* 4. Tela de Combate (Canvas 2D + WebGL 3D Container + HUD) */}
      {screen === 'FIGHT' && (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full h-full max-w-[1920px] max-h-[1080px] object-contain shadow-2xl"
          />

          <FightHUD
            gameState={gameState}
            char1={char1}
            char2={char2}
            tournamentLevel={mode === 'TOURNAMENT' ? (matchConfig.tournamentLevel || 1) : null}
            difficulty={matchConfig.difficulty}
            isPaused={isPaused}
            onTogglePause={togglePause}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            currentTrack={currentTrack}
            onNextMusic={handleNextMusic}
          />

          {mode === 'TRAINING' && (
            <TrainingOverlay
              showHitboxes={showHitboxes}
              onToggleHitboxes={handleToggleHitboxes}
              dummyBehavior={dummyBehavior}
              onChangeDummyBehavior={handleChangeDummy}
              onResetPositions={handleRestartRound}
            />
          )}

          {isPaused && (
            <PauseMenu
              onResume={togglePause}
              onRestart={handleRestartRound}
              onSelectCharacter={() => setScreen('SELECT')}
              onMainMenu={() => setScreen('MAIN_MENU')}
              currentTrack={currentTrack}
              onNextMusic={handleNextMusic}
              dashEnabled={doubleTapDashEnabled}
              onToggleDash={handleToggleDash}
            />
          )}

          {isMatchOver && winner && (
            <VictoryScreen
              winner={winner}
              loser={loser}
              isTournament={mode === 'TOURNAMENT'}
              tournamentLevel={matchConfig.tournamentLevel || 1}
              playerWon={gameState && gameState.p1Wins >= 2}
              onNextTournamentLevel={handleNextTournamentLevel}
              onRematch={handleRematch}
              onSelectCharacter={() => {
                if (mode === 'ONLINE') setScreen('ONLINE_LOBBY');
                else setScreen('SELECT');
              }}
              onMainMenu={() => setScreen('MAIN_MENU')}
            />
          )}
        </div>
      )}

      {/* Guia de Controles Modal */}
      {showControls && <ControlsGuide onClose={() => setShowControls(false)} />}

      {/* Seletor de Modo Gráfico Modal */}
      {showGraphicsModal && (
        <GraphicsSelectorModal
          currentMode={graphicsMode}
          isExpedition={isExpedition}
          onSelectMode={(selected) => setGraphicsMode(selected)}
          onSetExpedition={(exp) => {
            setIsExpedition(exp);
            try {
              localStorage.setItem('fight_expedition_mode', String(exp));
            } catch (e) {}
          }}
          onClose={() => setShowGraphicsModal(false)}
        />
      )}
    </div>
  );
}

export default App;
