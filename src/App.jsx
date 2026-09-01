import React, { useState, useEffect, useRef } from 'react';
import { GameEngine, GAME_STATUS } from './game/engine/GameEngine';
import { getCharacterById } from './game/characters/characterData';
import { sounds } from './game/audio/soundManager';
import { MainMenu } from './components/menu/MainMenu';
import { CharacterSelect } from './components/select/CharacterSelect';
import { FightHUD } from './components/hud/FightHUD';
import { PauseMenu } from './components/menu/PauseMenu';
import { VictoryScreen } from './components/menu/VictoryScreen';
import { ControlsGuide } from './components/menu/ControlsGuide';
import { TrainingOverlay } from './components/training/TrainingOverlay';

export function App() {
  const [screen, setScreen] = useState('MAIN_MENU'); // 'MAIN_MENU', 'SELECT', 'FIGHT'
  const [mode, setMode] = useState('ARCADE'); // 'ARCADE', 'VERSUS', 'TRAINING'
  const [showControls, setShowControls] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Dados da Partida Ativa
  const [matchConfig, setMatchConfig] = useState({
    p1Id: 1,
    p2Id: 2,
    stageId: 'cyber_arena',
    difficulty: 'medium',
  });
  const [gameState, setGameState] = useState(null);
  const [showHitboxes, setShowHitboxes] = useState(false);
  const [dummyBehavior, setDummyBehavior] = useState('dummy');

  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  // Iniciar partida
  const handleStartMatch = (config) => {
    setMatchConfig(config);
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
      matchConfig.stageId
    );

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [screen, matchConfig, mode]);

  // Controles de Pausa
  const togglePause = () => {
    if (!engineRef.current) return;
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

  // Toggle Som
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
        matchConfig.stageId
      );
    }
  };

  const handleRestartRound = () => {
    if (engineRef.current) {
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

  const char1 = getCharacterById(matchConfig.p1Id);
  const char2 = getCharacterById(matchConfig.p2Id);
  const isMatchOver = gameState && gameState.status === GAME_STATUS.MATCH_OVER;
  const winner = gameState && (gameState.p1Wins >= 2 ? char1 : char2);
  const loser = gameState && (gameState.p1Wins >= 2 ? char2 : char1);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden font-sans">
      {/* 1. Tela de Menu Principal */}
      {screen === 'MAIN_MENU' && (
        <MainMenu
          onSelectMode={(selectedMode) => {
            setMode(selectedMode);
            setScreen('SELECT');
          }}
          onOpenControls={() => setShowControls(true)}
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />
      )}

      {/* 2. Tela de Seleção de Personagens */}
      {screen === 'SELECT' && (
        <CharacterSelect
          mode={mode}
          onStartMatch={handleStartMatch}
          onBackToMenu={() => setScreen('MAIN_MENU')}
        />
      )}

      {/* 3. Tela de Combate (Canvas + HUD) */}
      {screen === 'FIGHT' && (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Canvas de Alta Performance */}
          <canvas
            ref={canvasRef}
            className="w-full h-full max-w-[1920px] max-h-[1080px] object-contain shadow-2xl"
          />

          {/* HUD de Combate */}
          <FightHUD
            gameState={gameState}
            char1={char1}
            char2={char2}
            isPaused={isPaused}
            onTogglePause={togglePause}
            isMuted={isMuted}
            onToggleMute={toggleMute}
          />

          {/* Modo Treino Overlay */}
          {mode === 'TRAINING' && (
            <TrainingOverlay
              showHitboxes={showHitboxes}
              onToggleHitboxes={handleToggleHitboxes}
              dummyBehavior={dummyBehavior}
              onChangeDummyBehavior={handleChangeDummy}
              onResetPositions={handleRestartRound}
            />
          )}

          {/* Menu de Pausa */}
          {isPaused && (
            <PauseMenu
              onResume={togglePause}
              onRestart={handleRestartRound}
              onSelectCharacter={() => setScreen('SELECT')}
              onMainMenu={() => setScreen('MAIN_MENU')}
            />
          )}

          {/* Tela de Vitória / K.O. Final */}
          {isMatchOver && winner && (
            <VictoryScreen
              winner={winner}
              loser={loser}
              onRematch={handleRematch}
              onSelectCharacter={() => setScreen('SELECT')}
              onMainMenu={() => setScreen('MAIN_MENU')}
            />
          )}
        </div>
      )}

      {/* Guia de Controles Modal */}
      {showControls && <ControlsGuide onClose={() => setShowControls(false)} />}
    </div>
  );
}

export default App;
