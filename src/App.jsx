import React, { useState, useEffect, useRef } from 'react';
import { GameEngine, GAME_STATUS } from './game/engine/GameEngine';
import { getCharacterById } from './game/characters/characterData';
import { getExpeditionCharacterById } from './game/characters/expedition33Characters';
import { sounds } from './game/audio/soundManager';
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

  // Dados da Partida
  const [matchConfig, setMatchConfig] = useState({
    p1Id: 1,
    p2Id: 2,
    stageId: 'cyber_arena',
    difficulty: 'medium',
    isHost: true,
    isExpedition: false,
  });
  const [gameState, setGameState] = useState(null);
  const [showHitboxes, setShowHitboxes] = useState(false);
  const [dummyBehavior, setDummyBehavior] = useState('dummy');

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
    setMatchConfig({ ...config, isHost: true, isExpedition });
    setScreen('FIGHT');
    setIsPaused(false);
  };

  // Iniciar partida online
  const handleStartOnlineMatch = (config) => {
    setMatchConfig({ ...config, isExpedition: config.isExpedition !== undefined ? config.isExpedition : isExpedition });
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
    engine.onStateChange = (state) => {
      setGameState({ ...state });
    };

    engine.startFight(
      matchConfig.p1Id,
      matchConfig.p2Id,
      mode,
      matchConfig.difficulty,
      matchConfig.stageId,
      matchConfig.isHost !== undefined ? matchConfig.isHost : true,
      graphicsMode,
      matchConfig.isExpedition !== undefined ? matchConfig.isExpedition : isExpedition
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
        matchConfig.isExpedition !== undefined ? matchConfig.isExpedition : isExpedition
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

  const getChar = (matchConfig.isExpedition || isExpedition) ? getExpeditionCharacterById : getCharacterById;
  const char1 = getChar(matchConfig.p1Id) || ((matchConfig.isExpedition || isExpedition) ? getExpeditionCharacterById(101) : getCharacterById(1));
  const char2 = getChar(matchConfig.p2Id) || ((matchConfig.isExpedition || isExpedition) ? getExpeditionCharacterById(102) : getCharacterById(2));
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
            if (selectedMode === 'ONLINE') {
              setScreen('ONLINE_LOBBY');
            } else {
              setScreen('SELECT');
            }
          }}
          onOpenControls={() => setShowControls(true)}
          onOpenGraphics={() => setShowGraphicsModal(true)}
          graphicsMode={graphicsMode}
          isExpedition={isExpedition}
          onToggleExpedition={() => {
            setIsExpedition((prev) => {
              const next = !prev;
              try {
                localStorage.setItem('fight_expedition_mode', String(next));
              } catch (e) {}
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
          onStartMatch={handleStartMatch}
          onBackToMenu={() => setScreen('MAIN_MENU')}
        />
      )}

      {/* 3. Sala / Lobby Online P2P */}
      {screen === 'ONLINE_LOBBY' && (
        <OnlineLobby
          initialRoomCode={initialOnlineRoom}
          graphicsMode={graphicsMode}
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
            isPaused={isPaused}
            onTogglePause={togglePause}
            isMuted={isMuted}
            onToggleMute={toggleMute}
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
            />
          )}

          {isMatchOver && winner && (
            <VictoryScreen
              winner={winner}
              loser={loser}
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
          onSelectMode={(selected) => setGraphicsMode(selected)}
          onClose={() => setShowGraphicsModal(false)}
        />
      )}
    </div>
  );
}

export default App;
