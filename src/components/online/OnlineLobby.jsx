import React, { useState, useEffect, useRef } from 'react';
import { network, MSG_TYPE } from '../../game/network/NetworkManager';
import { CHARACTERS, getCharacterById } from '../../game/characters/characterData';
import { EXPEDITION_33_CHARACTERS, getExpeditionCharacterById } from '../../game/characters/expedition33Characters';
import { STAGES } from '../../game/engine/Stage';
import { EXPEDITION_STAGES } from '../../game/engine/ExpeditionStages';
import { Fighter } from '../../game/engine/Fighter';
import { sounds } from '../../game/audio/soundManager';
import { Copy, Check, Wifi, ArrowLeft, Sparkles, Swords } from 'lucide-react';

export const OnlineLobby = ({
  initialRoomCode,
  graphicsMode = 'BELLE_EPOQUE_2D',
  isExpedition: initialIsExpedition = true,
  onStartOnlineMatch,
  onBackToMenu
}) => {
  const [tab, setTab] = useState(initialRoomCode ? 'JOIN' : 'CREATE');
  const [roomCodeInput, setRoomCodeInput] = useState(initialRoomCode || '');
  const [activeRoomCode, setActiveRoomCode] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [ping, setPing] = useState(0);

  // Modo de jogo escolhido pelo Host (padrão: Clair Obscur 2D)
  const [isExpeditionMode, setIsExpeditionMode] = useState(initialIsExpedition ?? true);

  // Seleções do Lobby
  const [p1CharId, setP1CharId] = useState(initialIsExpedition ? 101 : 1);
  const [p2CharId, setP2CharId] = useState(initialIsExpedition ? 102 : 2);
  const [selectedStage, setSelectedStage] = useState(initialIsExpedition ? 'monolith_33' : 'cyber_arena');
  const [p1Ready, setP1Ready] = useState(false);
  const [p2Ready, setP2Ready] = useState(false);

  const canvasRef = useRef(null);
  const lobbyStateRef = useRef({
    isExpeditionMode,
    p1CharId,
    p2CharId,
    selectedStage,
    p1Ready,
    p2Ready
  });

  useEffect(() => {
    lobbyStateRef.current = {
      isExpeditionMode,
      p1CharId,
      p2CharId,
      selectedStage,
      p1Ready,
      p2Ready
    };
  }, [isExpeditionMode, p1CharId, p2CharId, selectedStage, p1Ready, p2Ready]);

  // Lista dinâmica de personagens e cenários
  const activeCharList = isExpeditionMode ? EXPEDITION_33_CHARACTERS : CHARACTERS;
  const activeStageList = isExpeditionMode ? EXPEDITION_STAGES : STAGES;
  const getChar = isExpeditionMode ? getExpeditionCharacterById : getCharacterById;

  // Setup de Listeners do NetworkManager
  useEffect(() => {
    const unsubConnected = network.on('connected', (hostStatus) => {
      console.log('[Lobby] Conectado! Host:', hostStatus);
      setIsConnected(true);
      setIsConnecting(false);
      setIsHost(hostStatus);
      setErrorMsg('');
      sounds.playSelect();

      // Host envia estado atual do lobby
      if (hostStatus) {
        network.send(MSG_TYPE.LOBBY_SYNC, {
          isExpeditionMode: lobbyStateRef.current.isExpeditionMode,
          p1CharId: lobbyStateRef.current.p1CharId,
          p2CharId: lobbyStateRef.current.p2CharId,
          selectedStage: lobbyStateRef.current.selectedStage,
          p1Ready: lobbyStateRef.current.p1Ready,
          p2Ready: false
        });
      } else {
        // Cliente solicita sync do estado atual do Host imediatamente
        network.send(MSG_TYPE.LOBBY_REQUEST_SYNC, {});
      }
    });

    const unsubData = network.on('data', (type, payload) => {
      if (type === MSG_TYPE.LOBBY_REQUEST_SYNC) {
        // Host responde com estado completo caso o cliente tenha solicitado
        if (network.isHost) {
          network.send(MSG_TYPE.LOBBY_SYNC, {
            isExpeditionMode: lobbyStateRef.current.isExpeditionMode,
            p1CharId: lobbyStateRef.current.p1CharId,
            p2CharId: lobbyStateRef.current.p2CharId,
            selectedStage: lobbyStateRef.current.selectedStage,
            p1Ready: lobbyStateRef.current.p1Ready,
            p2Ready: lobbyStateRef.current.p2Ready
          });
        }
      } else if (type === MSG_TYPE.LOBBY_SYNC) {
        if (payload.isExpeditionMode !== undefined) {
          setIsExpeditionMode(payload.isExpeditionMode);
        }
        if (payload.p1CharId !== undefined) setP1CharId(payload.p1CharId);
        if (payload.p2CharId !== undefined) setP2CharId(payload.p2CharId);
        if (payload.selectedStage !== undefined) setSelectedStage(payload.selectedStage);
        if (payload.p1Ready !== undefined) setP1Ready(payload.p1Ready);
        if (payload.p2Ready !== undefined) setP2Ready(payload.p2Ready);
      } else if (type === MSG_TYPE.START_MATCH) {
        sounds.playPunch(false);
        const matchExpedition = payload.isExpedition !== undefined ? payload.isExpedition : isExpeditionMode;
        onStartOnlineMatch({
          p1Id: payload.p1Id,
          p2Id: payload.p2Id,
          stageId: payload.stageId,
          isHost: network.isHost,
          isExpedition: matchExpedition,
          graphicsMode: payload.graphicsMode || graphicsMode || 'BELLE_EPOQUE_2D'
        });
      }
    });

    const unsubDisconnected = network.on('disconnected', () => {
      setIsConnected(false);
      setP1Ready(false);
      setP2Ready(false);
      setErrorMsg('Oponente desconectou.');
    });

    const unsubError = network.on('error', (err) => {
      setIsConnecting(false);
      setErrorMsg(`Erro de conexão: ${err.message || 'Verifique o código da sala'}`);
    });

    const pingTimer = setInterval(() => {
      setPing(network.ping);
    }, 1000);

    return () => {
      unsubConnected();
      unsubData();
      unsubDisconnected();
      unsubError();
      clearInterval(pingTimer);
    };
  }, [isExpeditionMode]);

  // Conexão automática se initialRoomCode estiver preenchido
  useEffect(() => {
    if (initialRoomCode && !isConnected && !isConnecting) {
      handleJoinRoom(initialRoomCode);
    }
  }, [initialRoomCode]);

  // Preview de Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const char1 = getChar(p1CharId);
    const char2 = getChar(p2CharId);

    const f1 = new Fighter(char1, false, 280);
    f1.position.set(130, 280);
    const f2 = new Fighter(char2, true, 280);
    f2.position.set(370, 280);

    const renderLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = isExpeditionMode ? '#d4af37' : '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, 280);
      ctx.lineTo(480, 280);
      ctx.stroke();

      f1.charData = char1;
      f2.charData = char2;
      try {
        f1.update(0.016);
        f2.update(0.016);
        f1.draw(ctx, false, graphicsMode, isExpeditionMode);
        f2.draw(ctx, false, graphicsMode, isExpeditionMode);
      } catch (e) {}

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [p1CharId, p2CharId, graphicsMode, isExpeditionMode]);

  // Mudança do Jogo / Modo pelo Host
  const handleChangeGameMode = (newExpedition) => {
    if (!isHost) return;
    sounds.playSelect();
    setIsExpeditionMode(newExpedition);
    const newP1 = newExpedition ? 101 : 1;
    const newP2 = newExpedition ? 102 : 2;
    const newStage = newExpedition ? 'monolith_33' : 'cyber_arena';
    setP1CharId(newP1);
    setP2CharId(newP2);
    setSelectedStage(newStage);
    setP1Ready(false);
    setP2Ready(false);

    network.send(MSG_TYPE.LOBBY_SYNC, {
      isExpeditionMode: newExpedition,
      p1CharId: newP1,
      p2CharId: newP2,
      selectedStage: newStage,
      p1Ready: false,
      p2Ready: false
    });
  };

  // Criar Sala
  const handleCreateRoom = async () => {
    setIsConnecting(true);
    setErrorMsg('');
    try {
      const code = await network.createRoom();
      setActiveRoomCode(code);
      setIsHost(true);
      setIsConnecting(false);
    } catch (err) {
      setIsConnecting(false);
      setErrorMsg('Falha ao criar sala. Tente novamente.');
    }
  };

  // Entrar na Sala
  const handleJoinRoom = async (codeToJoin = null) => {
    const targetCode = (codeToJoin || roomCodeInput).trim().toUpperCase();
    if (!targetCode) {
      setErrorMsg('Digite o código da sala.');
      return;
    }

    setIsConnecting(true);
    setErrorMsg('');
    try {
      await network.joinRoom(targetCode);
      setActiveRoomCode(targetCode);
      setIsHost(false);
    } catch (err) {
      setIsConnecting(false);
      setErrorMsg('Não foi possível conectar à sala. Verifique o código.');
    }
  };

  // Seleção de Personagem
  const handleSelectCharacter = (charId) => {
    sounds.playSelect();
    if (isHost) {
      setP1CharId(charId);
      network.send(MSG_TYPE.LOBBY_SYNC, { p1CharId: charId });
    } else {
      setP2CharId(charId);
      network.send(MSG_TYPE.LOBBY_SYNC, { p2CharId: charId });
    }
  };

  // Confirmar "Pronto"
  const handleToggleReady = () => {
    sounds.playSelect();
    if (isHost) {
      const next = !p1Ready;
      setP1Ready(next);
      network.send(MSG_TYPE.LOBBY_SYNC, { p1Ready: next });

      if (next && p2Ready) {
        setTimeout(() => {
          const matchPayload = {
            p1Id: p1CharId,
            p2Id: p2CharId,
            stageId: selectedStage,
            isExpedition: isExpeditionMode,
            graphicsMode: graphicsMode || 'BELLE_EPOQUE_2D'
          };
          network.send(MSG_TYPE.START_MATCH, matchPayload);
          onStartOnlineMatch({
            ...matchPayload,
            isHost: true
          });
        }, 500);
      }
    } else {
      const next = !p2Ready;
      setP2Ready(next);
      network.send(MSG_TYPE.LOBBY_SYNC, { p2Ready: next });
    }
  };

  const handleCopyInviteLink = () => {
    const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${activeRoomCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`w-full h-full flex flex-col justify-between p-6 select-none ${
      isExpeditionMode ? 'bg-[#06080e] text-amber-100' : 'bg-[#0a0a0f] text-slate-200'
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between border-b pb-3 ${
        isExpeditionMode ? 'border-amber-900/50' : 'border-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              network.disconnect();
              onBackToMenu();
            }}
            className={`px-3 py-1 rounded text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-1.5 ${
              isExpeditionMode
                ? 'bg-amber-950/80 hover:bg-amber-900 border-amber-700 text-amber-200'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
          >
            <ArrowLeft size={14} />
            Sair da Sala
          </button>
          <h1 className={`text-xl font-bold tracking-wider ${
            isExpeditionMode ? 'text-amber-300 font-serif' : 'text-white'
          }`}>
            PARTIDA ONLINE (P2P) {isExpeditionMode && '— CLAIR OBSCUR 2D'}
          </h1>
        </div>

        {isConnected && (
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Wifi size={14} className={ping < 100 ? 'text-emerald-400' : 'text-amber-400'} />
              <span>Ping: {ping}ms</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
              Conectado
            </span>
          </div>
        )}
      </div>

      {/* Se NÃO estiver conectado: Tela de Criação / Entrada */}
      {!isConnected ? (
        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
          <div className={`w-full border rounded p-6 shadow-2xl ${
            isExpeditionMode ? 'bg-slate-950/90 border-amber-900/60' : 'bg-slate-900 border-slate-800'
          }`}>
            {/* Escolha do Jogo na Criação da Sala (Host) */}
            <div className="mb-5 pb-4 border-b border-slate-800/80 text-left">
              <span className="text-[11px] uppercase tracking-wider text-amber-400 font-bold block mb-2">
                Versão do Jogo da Sala:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpeditionMode(true)}
                  className={`py-2 px-2.5 rounded border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isExpeditionMode
                      ? 'bg-amber-900/60 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-400'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles size={13} className="text-amber-400" />
                  <span>Clair Obscur 2D (Padrão)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsExpeditionMode(false)}
                  className={`py-2 px-2.5 rounded border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    !isExpeditionMode
                      ? 'bg-blue-900/60 border-blue-500 text-blue-200 shadow-md ring-1 ring-blue-400'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Swords size={13} className="text-blue-400" />
                  <span>Arcade Clássico</span>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              <button
                onClick={() => {
                  setTab('CREATE');
                  setErrorMsg('');
                }}
                className={`py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer ${
                  tab === 'CREATE'
                    ? (isExpeditionMode ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white')
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Criar Sala
              </button>
              <button
                onClick={() => {
                  setTab('JOIN');
                  setErrorMsg('');
                }}
                className={`py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer ${
                  tab === 'JOIN'
                    ? (isExpeditionMode ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white')
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Entrar em Sala
              </button>
            </div>

            {/* Tab: Criar Sala */}
            {tab === 'CREATE' && (
              <div className="flex flex-col gap-4 text-center">
                {!activeRoomCode ? (
                  <button
                    onClick={handleCreateRoom}
                    disabled={isConnecting}
                    className={`w-full py-3 rounded text-white font-bold text-sm uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 ${
                      isExpeditionMode ? 'bg-amber-600 hover:bg-amber-500' : 'bg-blue-600 hover:bg-blue-500'
                    }`}
                  >
                    {isConnecting ? 'Criando Sala...' : 'Gerar Código de Sala'}
                  </button>
                ) : (
                  <div className="flex flex-col gap-3">
                    <span className="text-xs text-slate-400">Código da Sala:</span>
                    <div className="text-4xl font-mono font-black text-white bg-slate-950 py-3 rounded border border-slate-700 tracking-widest">
                      {activeRoomCode}
                    </div>

                    <button
                      onClick={handleCopyInviteLink}
                      className="py-2.5 px-4 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                      <span>{copied ? 'Link Copiado!' : 'Copiar Link de Convite'}</span>
                    </button>

                    <div className="flex items-center justify-center gap-2 mt-2 text-xs text-amber-400">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      <span>Aguardando oponente conectar...</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Entrar em Sala */}
            {tab === 'JOIN' && (
              <div className="flex flex-col gap-3">
                <label className="text-xs text-slate-400 text-left">Código da Sala:</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="EX: 7X9K"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-center font-mono font-bold text-xl py-2.5 rounded uppercase tracking-widest outline-none focus:border-amber-500"
                />

                <button
                  onClick={() => handleJoinRoom()}
                  disabled={isConnecting}
                  className={`w-full py-3 rounded text-white font-bold text-sm uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 mt-2 ${
                    isExpeditionMode ? 'bg-amber-600 hover:bg-amber-500' : 'bg-blue-600 hover:bg-blue-500'
                  }`}
                >
                  {isConnecting ? 'Conectando...' : 'Entrar na Sala'}
                </button>
              </div>
            )}

            {errorMsg && (
              <div className="mt-4 p-2.5 rounded bg-red-950/60 border border-red-800 text-red-300 text-xs text-center">
                {errorMsg}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Se ESTIVER conectado: Seleção em Tempo Real */
        <div className="flex-1 flex gap-6 my-4 items-center justify-between overflow-hidden">
          <div className="w-7/12 flex flex-col justify-center">
            {/* Seletor do Jogo no topo da grade (apenas Host pode alterar; convidado vê o modo sincronizado) */}
            <div className="flex items-center justify-between mb-3 px-2 py-1.5 bg-slate-950/80 rounded border border-slate-800">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <span className="text-amber-400 font-bold">Jogo Selecionado:</span>
                <span className="font-semibold text-slate-200">
                  {isExpeditionMode ? 'Clair Obscur 2D (Belle Époque)' : 'Arcade Clássico'}
                </span>
              </span>

              {isHost && (
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleChangeGameMode(true)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                      isExpeditionMode
                        ? 'bg-amber-900 border-amber-500 text-amber-200 shadow'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    Clair Obscur 2D
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChangeGameMode(false)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                      !isExpeditionMode
                        ? 'bg-blue-900 border-blue-500 text-blue-200 shadow'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    Clássico
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-5 gap-2 max-h-[480px] overflow-y-auto pr-1">
              {activeCharList.map((char) => {
                const isSelectedByMe = isHost ? p1CharId === char.id : p2CharId === char.id;
                const isSelectedByOpponent = isHost ? p2CharId === char.id : p1CharId === char.id;

                return (
                  <div
                    key={char.id}
                    onClick={() => handleSelectCharacter(char.id)}
                    className={`relative p-2 rounded border cursor-pointer transition-all flex flex-col items-center justify-between ${
                      char.image ? 'h-24' : 'h-20'
                    } ${
                      isSelectedByMe
                        ? 'border-blue-500 bg-blue-950/70 ring-1 ring-blue-400 shadow-md'
                        : isSelectedByOpponent
                        ? 'border-red-500 bg-red-950/70 ring-1 ring-red-400 shadow-md'
                        : isExpeditionMode
                        ? 'border-amber-900/40 bg-slate-950/80 hover:border-amber-500/80 hover:bg-slate-900'
                        : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="absolute top-1 left-1 flex gap-1 z-10">
                      {isSelectedByMe && (
                        <span className="px-1 bg-blue-600 text-white text-[9px] font-bold rounded shadow">
                          VOCÊ
                        </span>
                      )}
                      {isSelectedByOpponent && (
                        <span className="px-1 bg-red-600 text-white text-[9px] font-bold rounded shadow">
                          OPONENTE
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 w-full h-full mt-1">
                      {char.image && (
                        <div className="w-11 h-14 rounded border border-amber-800/60 overflow-hidden flex-shrink-0 bg-black/60 shadow">
                          <img
                            src={char.image}
                            alt={char.name}
                            className="w-full h-full object-cover object-top"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <span className={`text-xs font-bold block truncate ${
                          isExpeditionMode ? 'text-amber-200 font-serif' : 'text-slate-200'
                        }`}>
                          {char.name}
                        </span>
                        {char.title && (
                          <span className="text-[9px] text-slate-400 block truncate">
                            {char.title}
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className="w-full h-0.5 rounded-full mt-1"
                      style={{ backgroundColor: char.themeColor }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`w-5/12 h-full flex flex-col justify-between rounded border p-4 shadow-xl ${
            isExpeditionMode ? 'bg-slate-950/80 border-amber-900/50' : 'bg-slate-900/60 border-slate-800'
          }`}>
            <div className="relative w-full h-44 bg-slate-950 rounded border border-slate-800 overflow-hidden flex items-center justify-center">
              <canvas ref={canvasRef} width={500} height={300} className="w-full h-full object-contain" />
              <div className="absolute top-2 left-3 text-blue-400 text-xs font-semibold">
                P1 (Host): {getChar(p1CharId)?.name || 'Lutador 1'} {p1Ready && '✓ PRONTO'}
              </div>
              <div className="absolute top-2 right-3 text-red-400 text-xs font-semibold">
                P2 (Convidado): {getChar(p2CharId)?.name || 'Lutador 2'} {p2Ready && '✓ PRONTO'}
              </div>
            </div>

            <div className="my-2 p-2 bg-slate-950 rounded border border-slate-800 text-xs flex justify-between items-center">
              <span className="text-slate-400">Cenário da Luta:</span>
              {isHost ? (
                <select
                  value={selectedStage}
                  onChange={(e) => {
                    setSelectedStage(e.target.value);
                    network.send(MSG_TYPE.LOBBY_SYNC, { selectedStage: e.target.value });
                  }}
                  className="bg-slate-800 text-white rounded px-2 py-0.5 border border-slate-700 outline-none cursor-pointer"
                >
                  {activeStageList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-slate-200 font-semibold">
                  {activeStageList.find((s) => s.id === selectedStage)?.name || (isExpeditionMode ? 'O Monólito (Número 33)' : 'Neo Cyber Arena')}
                </span>
              )}
            </div>

            <button
              onClick={handleToggleReady}
              className={`w-full py-3 rounded text-white font-bold text-sm uppercase tracking-wider transition-colors cursor-pointer ${
                (isHost ? p1Ready : p2Ready)
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : isExpeditionMode
                  ? 'bg-amber-600 hover:bg-amber-500'
                  : 'bg-blue-600 hover:bg-blue-500'
              }`}
            >
              {(isHost ? p1Ready : p2Ready) ? '✓ Aguardando Início...' : 'Confirmar e Ficar Pronto'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
