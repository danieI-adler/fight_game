import React, { useState, useEffect, useRef } from 'react';
import { network, MSG_TYPE } from '../../game/network/NetworkManager';
import { CHARACTERS, getCharacterById } from '../../game/characters/characterData';
import { STAGES } from '../../game/engine/Stage';
import { Fighter } from '../../game/engine/Fighter';
import { sounds } from '../../game/audio/soundManager';
import { Copy, Check, Wifi, ArrowLeft } from 'lucide-react';

export const OnlineLobby = ({ initialRoomCode, onStartOnlineMatch, onBackToMenu }) => {
  const [tab, setTab] = useState(initialRoomCode ? 'JOIN' : 'CREATE');
  const [roomCodeInput, setRoomCodeInput] = useState(initialRoomCode || '');
  const [activeRoomCode, setActiveRoomCode] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [ping, setPing] = useState(0);

  // Seleções do Lobby
  const [p1CharId, setP1CharId] = useState(1);
  const [p2CharId, setP2CharId] = useState(2);
  const [selectedStage, setSelectedStage] = useState('cyber_arena');
  const [p1Ready, setP1Ready] = useState(false);
  const [p2Ready, setP2Ready] = useState(false);

  const canvasRef = useRef(null);

  // Setup callbacks de rede
  useEffect(() => {
    network.onConnectedCallback = (hostStatus) => {
      setIsConnected(true);
      setIsConnecting(false);
      setIsHost(hostStatus);
      setErrorMsg('');
      sounds.playSelect();

      // Host envia estado inicial do lobby
      if (hostStatus) {
        network.send(MSG_TYPE.LOBBY_SYNC, {
          p1CharId,
          p2CharId,
          selectedStage,
          p1Ready,
          p2Ready: false
        });
      }
    };

    network.onDataCallback = (type, payload) => {
      if (type === MSG_TYPE.LOBBY_SYNC) {
        if (payload.p1CharId !== undefined) setP1CharId(payload.p1CharId);
        if (payload.p2CharId !== undefined) setP2CharId(payload.p2CharId);
        if (payload.selectedStage !== undefined) setSelectedStage(payload.selectedStage);
        if (payload.p1Ready !== undefined) setP1Ready(payload.p1Ready);
        if (payload.p2Ready !== undefined) setP2Ready(payload.p2Ready);
      } else if (type === MSG_TYPE.START_MATCH) {
        sounds.playPunch(false);
        onStartOnlineMatch({
          p1Id: payload.p1Id,
          p2Id: payload.p2Id,
          stageId: payload.stageId,
          isHost: network.isHost,
        });
      }
    };

    network.onDisconnectedCallback = () => {
      setIsConnected(false);
      setP1Ready(false);
      setP2Ready(false);
      setErrorMsg('Oponente desconectou.');
    };

    network.onErrorCallback = (err) => {
      setIsConnecting(false);
      setErrorMsg(`Erro de conexão: ${err.message || 'Sala não encontrada'}`);
    };

    // Monitoramento de Ping a cada 1s
    const pingTimer = setInterval(() => {
      setPing(network.ping);
    }, 1000);

    return () => {
      clearInterval(pingTimer);
    };
  }, [p1CharId, p2CharId, selectedStage, p1Ready, p2Ready]);

  // Se veio com initialRoomCode, tenta conectar automaticamente
  useEffect(() => {
    if (initialRoomCode && !isConnected && !isConnecting) {
      handleJoinRoom(initialRoomCode);
    }
  }, [initialRoomCode]);

  // Canvas Preview dos Personagens Selecionados
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const char1 = getCharacterById(p1CharId);
    const char2 = getCharacterById(p2CharId);

    const f1 = new Fighter(char1, false, 280);
    f1.position.set(130, 280);
    const f2 = new Fighter(char2, true, 280);
    f2.position.set(370, 280);

    const renderLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, 280);
      ctx.lineTo(480, 280);
      ctx.stroke();

      f1.charData = char1;
      f2.charData = char2;
      f1.update(0.016);
      f2.update(0.016);
      f1.draw(ctx);
      f2.draw(ctx);

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [p1CharId, p2CharId]);

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

  // Entrar em Sala
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
      setErrorMsg('Não foi possível conectar à sala.');
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

  // Toggle "Pronto"
  const handleToggleReady = () => {
    sounds.playSelect();
    if (isHost) {
      const next = !p1Ready;
      setP1Ready(next);
      network.send(MSG_TYPE.LOBBY_SYNC, { p1Ready: next });

      // Se ambos prontos, Host inicia a partida
      if (next && p2Ready) {
        setTimeout(() => {
          network.send(MSG_TYPE.START_MATCH, {
            p1Id: p1CharId,
            p2Id: p2CharId,
            stageId: selectedStage
          });
          onStartOnlineMatch({
            p1Id: p1CharId,
            p2Id: p2CharId,
            stageId: selectedStage,
            isHost: true
          });
        }, 600);
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
    <div className="w-full h-full flex flex-col justify-between p-6 bg-[#0a0a0f] text-slate-200 select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              network.disconnect();
              onBackToMenu();
            }}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            Sair da Sala
          </button>
          <h1 className="text-xl font-bold text-white tracking-wider">
            PARTIDA ONLINE (P2P)
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

      {/* Se NÃO estiver conectado: Tela de Criação / Entrada na Sala */}
      {!isConnected ? (
        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
          <div className="w-full bg-slate-900 border border-slate-800 rounded p-6 shadow-xl">
            {/* Tabs */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              <button
                onClick={() => {
                  setTab('CREATE');
                  setErrorMsg('');
                }}
                className={`py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer ${
                  tab === 'CREATE'
                    ? 'bg-blue-600 text-white'
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
                    ? 'bg-blue-600 text-white'
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
                    className="w-full py-3 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isConnecting ? 'Criando...' : 'Gerar Código de Sala'}
                  </button>
                ) : (
                  <div className="flex flex-col gap-3">
                    <span className="text-xs text-slate-400">Código da sua Sala:</span>
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
                <label className="text-xs text-slate-400">Código da Sala do Host:</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="EX: 7X9K"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-center font-mono font-bold text-xl py-2.5 rounded uppercase tracking-widest outline-none focus:border-blue-500"
                />

                <button
                  onClick={() => handleJoinRoom()}
                  disabled={isConnecting}
                  className="w-full py-3 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isConnecting ? 'Conectando...' : 'Entrar na Sala'}
                </button>
              </div>
            )}

            {/* Erro */}
            {errorMsg && (
              <div className="mt-4 p-2.5 rounded bg-red-950/60 border border-red-800 text-red-300 text-xs text-center">
                {errorMsg}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Se ESTIVER conectado: Seleção de Personagens em Tempo Real */
        <div className="flex-1 flex gap-6 my-4 items-center justify-between overflow-hidden">
          {/* Grade de 20 Personagens */}
          <div className="w-7/12 flex flex-col justify-center">
            <div className="grid grid-cols-5 gap-2 max-h-[480px]">
              {CHARACTERS.map((char) => {
                const isSelectedByMe = isHost ? p1CharId === char.id : p2CharId === char.id;
                const isSelectedByOpponent = isHost ? p2CharId === char.id : p1CharId === char.id;

                return (
                  <div
                    key={char.id}
                    onClick={() => handleSelectCharacter(char.id)}
                    className={`relative p-2 rounded border cursor-pointer transition-all flex flex-col items-center justify-between h-18 ${
                      isSelectedByMe
                        ? 'border-blue-500 bg-blue-950/50'
                        : isSelectedByOpponent
                        ? 'border-red-500 bg-red-950/50'
                        : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="absolute top-1 left-1 flex gap-1">
                      {isSelectedByMe && (
                        <span className="px-1 bg-blue-600 text-white text-[9px] font-bold rounded">
                          VOCÊ
                        </span>
                      )}
                      {isSelectedByOpponent && (
                        <span className="px-1 bg-red-600 text-white text-[9px] font-bold rounded">
                          OPONENTE
                        </span>
                      )}
                    </div>

                    <span className="text-xs font-bold text-slate-200 mt-2 block truncate">
                      {char.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate w-full text-center">
                      {char.title}
                    </span>

                    <div
                      className="w-full h-0.5 rounded-full mt-1"
                      style={{ backgroundColor: char.themeColor }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Painel do Duelo Online */}
          <div className="w-5/12 h-full flex flex-col justify-between bg-slate-900/60 rounded border border-slate-800 p-4">
            <div className="relative w-full h-44 bg-slate-950 rounded border border-slate-800 overflow-hidden flex items-center justify-center">
              <canvas ref={canvasRef} width={500} height={300} className="w-full h-full object-contain" />
              <div className="absolute top-2 left-3 text-blue-400 text-xs font-semibold">
                P1 (Host): {getCharacterById(p1CharId).name} {p1Ready && '✓ PRONTO'}
              </div>
              <div className="absolute top-2 right-3 text-red-400 text-xs font-semibold">
                P2 (Convidado): {getCharacterById(p2CharId).name} {p2Ready && '✓ PRONTO'}
              </div>
            </div>

            {/* Cenário (Apenas Host altera) */}
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
                  {STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-slate-200 font-semibold">
                  {STAGES.find((s) => s.id === selectedStage)?.name || 'Neo Cyber Arena'}
                </span>
              )}
            </div>

            {/* Botão de Pronto / Iniciar */}
            <button
              onClick={handleToggleReady}
              className={`w-full py-3 rounded text-white font-bold text-sm uppercase tracking-wider transition-colors cursor-pointer ${
                (isHost ? p1Ready : p2Ready)
                  ? 'bg-emerald-600 hover:bg-emerald-500'
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
