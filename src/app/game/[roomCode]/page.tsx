'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import {
  ClientGameState, PlacedPiece, Square, PlayerNumber, Rank,
  RevealEvent, ClientPiece, VisiblePiece,
} from '@/types/game';
import { C2S, S2C } from '@/lib/socketEvents';
import { getValidMoves, isLake, BOARD_ROWS, BOARD_COLS, isValidSetupRow } from '@/lib/gameLogic';
import { PIECE_DEFINITIONS, RANK_DISPLAY, TOTAL_PIECES } from '@/lib/pieces';
import { useTheme } from '@/lib/ThemeContext';
import Board from '@/components/Board';
import CapturedPieces from '@/components/CapturedPieces';
import MoveLog from '@/components/MoveLog';
import SpotterModal from '@/components/SpotterModal';
import RevealAnimation from '@/components/RevealAnimation';
import GameOverModal from '@/components/GameOverModal';
import ThemeToggle from '@/components/ThemeToggle';
import SetupTray from '@/components/SetupTray';
import CoinFlip from '@/components/CoinFlip';
import Tutorial from '@/components/Tutorial';
import LoadingScreen from '@/components/LoadingScreen';
import { SFX, setSfxMuted } from '@/lib/sounds';
import { startMusic, stopMusic, setMusicVolume } from '@/lib/ambientMusic';
import VoiceCommander from '@/components/api/VoiceCommander';
import NotificationManager from '@/components/api/NotificationManager';
import { GameCommand } from '@/types/api';

let socket: Socket | null = null;

function TurnTimer({ active, deadline, paused }: { active: boolean; deadline?: number; paused?: boolean }) {
  const [display, setDisplay] = useState('0:00');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (paused) {
      setIsUrgent(false);
      return;
    }

    if (deadline && deadline > 0 && active) {
      // Countdown mode - only show when it's your turn
      const update = () => {
        const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        setDisplay(`${mins}:${secs.toString().padStart(2, '0')}`);
        setIsUrgent(remaining <= 5 && remaining > 0);
      };
      update();
      const interval = setInterval(update, 200);
      return () => clearInterval(interval);
    } else if (!deadline || deadline <= 0) {
      // Count up mode (no timer set)
      let count = 0;
      setIsUrgent(false);
      if (!active) { setDisplay('0:00'); return; }
      const interval = setInterval(() => {
        count++;
        const mins = Math.floor(count / 60);
        const secs = count % 60;
        setDisplay(`${mins}:${secs.toString().padStart(2, '0')}`);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      // Opponent's turn with timer - show waiting
      setDisplay('--');
      setIsUrgent(false);
    }
  }, [active, deadline]);

  return (
    <span className={`text-xs font-mono tabular-nums ${isUrgent ? 'text-red-400 animate-pulse font-bold' : active ? 'text-amber-400 timer-tick' : 'text-stone-500'}`}>
      {display}
    </span>
  );
}

export default function GamePage({ params }: { params: { roomCode: string } }) {
  const router = useRouter();
  const { theme, setThemeId } = useTheme();
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<Square[]>([]);
  const [revealEvent, setRevealEvent] = useState<RevealEvent | null>(null);
  const [revealingSquares, setRevealingSquares] = useState<Set<string>>(new Set());
  const [showSpotter, setShowSpotter] = useState(false);
  const [spotterData, setSpotterData] = useState<{ spotterPosition: Square; adjacentTargets: Square[] } | null>(null);
  const [disconnected, setDisconnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [replayHighlight, setReplayHighlight] = useState<{ from: Square; to: Square } | null>(null);
  const [copied, setCopied] = useState(false);
  const [coinFlip, setCoinFlip] = useState<{ player1Name: string; player2Name: string; winner: 1 | 2 } | null>(null);
  const [opponentMove, setOpponentMove] = useState<{ from: Square; to: Square } | null>(null);
  const [sfxMuted, setSfxMutedState] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [showRevealedBoard, setShowRevealedBoard] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const tutorialShownRef = useRef(false);
  const gameStartTimeRef = useRef<number>(0);

  // Setup state
  const [setupPieces, setSetupPieces] = useState<PlacedPiece[]>([]);
  const [selectedRank, setSelectedRank] = useState<Rank | null>(null);
  const [isReady, setIsReady] = useState(false);

  const myPlayer = useRef<PlayerNumber>(1);
  const roomCode = useRef<string>('');
  const revealTimerRef = useRef<NodeJS.Timeout | null>(null);
  const revealShowTimerRef = useRef<NodeJS.Timeout | null>(null);
  const revealSafetyRef = useRef<NodeJS.Timeout | null>(null);
  const revealSetAtRef = useRef<number>(0);

  const handleCopyRoomCode = useCallback(() => {
    if (!roomCode.current) return;
    navigator.clipboard.writeText(roomCode.current).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const storedPlayer = sessionStorage.getItem('playerNumber');

    if (!storedPlayer) {
      router.push('/');
      return;
    }

    roomCode.current = params.roomCode;
    // Store roomCode to sessionStorage so the /game redirect fallback works
    sessionStorage.setItem('roomCode', params.roomCode);
    myPlayer.current = parseInt(storedPlayer) as PlayerNumber;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || '';
    socket = io(socketUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    // If no game state received within 10s of connecting, room is likely gone
    let gotGameState = false;
    let connectTimeout: NodeJS.Timeout | null = null;

    socket.on('connect', () => {
      const storedNickname = sessionStorage.getItem('nickname');
      socket?.emit(C2S.JOIN_ROOM, {
        roomCode: params.roomCode,
        nickname: storedNickname || undefined,
        playerNumber: parseInt(storedPlayer!) as PlayerNumber,
      });
      // Start timeout after connect — if server doesn't respond, room is gone
      if (!gotGameState) {
        connectTimeout = setTimeout(() => {
          if (!gotGameState) {
            sessionStorage.removeItem('roomCode');
            sessionStorage.removeItem('playerNumber');
            sessionStorage.removeItem('roomTheme');
            router.push('/');
          }
        }, 8000);
      }
    });

    const storedTheme = sessionStorage.getItem('roomTheme');
    if (storedTheme === 'kingdom' || storedTheme === 'pirate' || storedTheme === 'greek') {
      setThemeId(storedTheme);
    }

    socket.on(S2C.GAME_STATE, (state: ClientGameState) => {
      gotGameState = true;
      if (connectTimeout) { clearTimeout(connectTimeout); connectTimeout = null; }
      // Track game start time + start music
      if (state.phase === 'playing' && !gameStartTimeRef.current) {
        gameStartTimeRef.current = Date.now();
        const t = state.roomTheme as 'kingdom' | 'pirate' | 'greek' | undefined;
        if (t && !musicPlaying) {
          startMusic(t);
          setMusicPlaying(true);
        }
      }
      // Stop music and show revealed board on game over
      if (state.phase === 'gameover') {
        stopMusic();
        setMusicPlaying(false);
        if (state.revealedBoard) {
          setTimeout(() => setShowRevealedBoard(true), 500);
        }
      }

      // Show tutorial once when entering setup phase
      if (state.phase === 'setup' && !tutorialShownRef.current) {
        tutorialShownRef.current = true;
        // Check if user has seen tutorial before
        if (!sessionStorage.getItem('tutorial-seen')) {
          setShowTutorial(true);
        }
      }

      // Restore spotter prompt from game state (handles reconnect)
      if (state.awaitingSpotter) {
        setSpotterData(state.awaitingSpotter);
        setShowSpotter(true);
      }

      // Force-clear stuck reveal events on reconnect or when server has moved on
      // The server delays game state updates by the animation duration, so if we
      // receive a new game state, any previous reveal should be done
      if (state.phase === 'playing' && state.currentTurn === myPlayer.current) {
        // It's now our turn - clear any lingering reveal after a brief grace period
        // (the REVEAL_EVENT arrives ~100ms after GAME_STATE, so wait for it)
        setTimeout(() => {
          if (revealSetAtRef.current && Date.now() - revealSetAtRef.current > 5000) {
            setRevealEvent(null);
            setRevealingSquares(new Set());
          }
        }, 200);
      }

      // Detect opponent's move from new move log entries
      setGameState(prev => {
        if (prev && state.moveLog.length > (prev.moveLog?.length || 0)) {
          const latestMove = state.moveLog[state.moveLog.length - 1];
          if (latestMove && latestMove.player !== myPlayer.current) {
            SFX.yourTurn();
            setLastMove({ from: latestMove.from, to: latestMove.to });
            setOpponentMove({ from: latestMove.from, to: latestMove.to });
            setTimeout(() => setLastMove(null), 2000);
            setTimeout(() => setOpponentMove(null), 1500);
          }
        }
        return state;
      });
      setError(null);
    });

    socket.on('coin_flip', (data: { player1Name: string; player2Name: string; winner: 1 | 2 }) => {
      setCoinFlip(data);
    });

    socket.on(S2C.REVEAL_EVENT, (event: RevealEvent) => {
      // Clear ALL existing timers to prevent stale reveals from killing new ones
      if (revealTimerRef.current) {
        clearTimeout(revealTimerRef.current);
        revealTimerRef.current = null;
      }
      if (revealShowTimerRef.current) {
        clearTimeout(revealShowTimerRef.current);
        revealShowTimerRef.current = null;
      }
      if (revealSafetyRef.current) {
        clearTimeout(revealSafetyRef.current);
        revealSafetyRef.current = null;
      }

      // Delay the battle popup so the piece slide/arrow plays out fully first
      // Slide = 400ms, arrow = 1100ms, plus render buffer
      const showDelay = 1500;

      // Show the battle card and revealing squares together after the delay
      revealShowTimerRef.current = setTimeout(() => {
        revealShowTimerRef.current = null;
        const squares = new Set<string>();
        for (const p of event.pieces) {
          squares.add(`${p.position.row},${p.position.col}`);
        }
        setRevealingSquares(squares);
        setRevealEvent(event);
        revealSetAtRef.current = Date.now();
      }, showDelay);

      revealTimerRef.current = setTimeout(() => {
        setRevealEvent(null);
        setRevealingSquares(new Set());
        revealTimerRef.current = null;
      }, event.duration + showDelay);

      // Safety fallback: force clear after 8 seconds max — tracked so it can be cancelled
      revealSafetyRef.current = setTimeout(() => {
        revealSafetyRef.current = null;
        setRevealEvent(null);
        setRevealingSquares(new Set());
      }, 8000);
    });

    socket.on(S2C.SPOTTER_PROMPT, (data: { spotterPosition: Square; adjacentTargets: Square[] }) => {
      setSpotterData(data);
      setShowSpotter(true);
    });

    socket.on(S2C.SPOTTER_RESULT, () => {
      setShowSpotter(false);
      setSpotterData(null);
    });

    socket.on(S2C.OPPONENT_DISCONNECTED, () => {
      setDisconnected(true);
    });

    socket.on(S2C.OPPONENT_RECONNECTED, () => {
      setDisconnected(false);
    });

    socket.on(S2C.INVALID_MOVE, (data: { message: string }) => {
      SFX.error();
      setError(data.message);
      setTimeout(() => setError(null), 3000);
    });

    socket.on(S2C.ERROR, (data: { message: string }) => {
      setError(data.message);
      // If room not found, clean up and redirect to lobby
      if (data.message.includes('Room not found') || data.message.includes('Room is full')) {
        sessionStorage.removeItem('roomCode');
        sessionStorage.removeItem('playerNumber');
        sessionStorage.removeItem('roomTheme');
        setTimeout(() => router.push('/'), 2000);
      }
    });

    return () => {
      socket?.disconnect();
      if (connectTimeout) { clearTimeout(connectTimeout); connectTimeout = null; }
      // Clean up reveal timers to prevent orphaned timeouts from setting stale state
      if (revealTimerRef.current) { clearTimeout(revealTimerRef.current); revealTimerRef.current = null; }
      if (revealShowTimerRef.current) { clearTimeout(revealShowTimerRef.current); revealShowTimerRef.current = null; }
      if (revealSafetyRef.current) { clearTimeout(revealSafetyRef.current); revealSafetyRef.current = null; }
    };
  }, [router, params.roomCode]);

  // Switch music track when theme changes
  useEffect(() => {
    if (musicPlaying) {
      startMusic(theme.id as 'kingdom' | 'pirate' | 'greek');
    }
  }, [theme.id, musicPlaying]);

  // Handle square clicks during PLAYING phase
  const handleBoardClick = useCallback((row: number, col: number) => {
    if (!gameState) return;
    // Block moves while battle card is showing, but self-heal if stuck > 6s
    if (revealEvent) {
      if (Date.now() - revealSetAtRef.current > 6000) {
        setRevealEvent(null);
        setRevealingSquares(new Set());
        if (revealTimerRef.current) { clearTimeout(revealTimerRef.current); revealTimerRef.current = null; }
        if (revealShowTimerRef.current) { clearTimeout(revealShowTimerRef.current); revealShowTimerRef.current = null; }
        if (revealSafetyRef.current) { clearTimeout(revealSafetyRef.current); revealSafetyRef.current = null; }
      } else {
        return;
      }
    }

    // SETUP PHASE — place pieces
    if (gameState.phase === 'setup') {
      if (isReady) return;

      const existingIdx = setupPieces.findIndex(p => p.row === row && p.col === col);
      const hasSelectedPiece = selectedSquare !== null;

      // If clicking a placed piece while another placed piece is selected -> SWAP
      if (existingIdx >= 0 && hasSelectedPiece) {
        const otherIdx = setupPieces.findIndex(p => p.row === selectedSquare.row && p.col === selectedSquare.col);
        if (otherIdx >= 0 && otherIdx !== existingIdx) {
          const updated = [...setupPieces];
          // Swap positions
          const tempRow = updated[existingIdx].row;
          const tempCol = updated[existingIdx].col;
          updated[existingIdx] = { ...updated[existingIdx], row: updated[otherIdx].row, col: updated[otherIdx].col };
          updated[otherIdx] = { ...updated[otherIdx], row: tempRow, col: tempCol };
          setSetupPieces(updated);
          socket?.emit(C2S.PLACE_PIECES, { pieces: updated });
          setSelectedSquare(null);
          return;
        }
      }

      // If clicking a placed piece with no selection -> select it for swapping (or remove if clicked again)
      if (existingIdx >= 0) {
        if (hasSelectedPiece && selectedSquare.row === row && selectedSquare.col === col) {
          // Clicking same piece again - deselect
          setSelectedSquare(null);
        } else if (!selectedRank) {
          // No rank selected from tray - select this piece for swapping
          setSelectedSquare({ row, col });
        } else {
          // Rank is selected from tray - remove this piece to place new one
          const updated = [...setupPieces];
          updated.splice(existingIdx, 1);
          setSetupPieces(updated);
        }
        return;
      }

      // If clicking empty square with a placed piece selected -> move it there
      if (hasSelectedPiece && !selectedRank) {
        const moveIdx = setupPieces.findIndex(p => p.row === selectedSquare.row && p.col === selectedSquare.col);
        if (moveIdx >= 0 && isValidSetupRow(row, myPlayer.current) && !isLake(row, col)) {
          const updated = [...setupPieces];
          updated[moveIdx] = { ...updated[moveIdx], row, col };
          setSetupPieces(updated);
          socket?.emit(C2S.PLACE_PIECES, { pieces: updated });
          setSelectedSquare(null);
          return;
        }
      }

      if (!selectedRank) return;
      if (!isValidSetupRow(row, myPlayer.current)) return;
      if (isLake(row, col)) return;

      const def = PIECE_DEFINITIONS.find(d => d.rank === selectedRank);
      if (!def) return;

      const placedCount = setupPieces.filter(p => p.rank === selectedRank).length;
      if (placedCount >= def.quantity) return;

      const newPiece: PlacedPiece = {
        id: `p${myPlayer.current}-${selectedRank}-${placedCount}`,
        rank: selectedRank,
        name: def.name,
        owner: myPlayer.current,
        row,
        col,
      };

      const updated = [...setupPieces, newPiece];
      setSetupPieces(updated);
      socket?.emit(C2S.PLACE_PIECES, { pieces: updated });

      // Auto-deselect if all placed
      if (placedCount + 1 >= def.quantity) {
        setSelectedRank(null);
      }
      return;
    }

    // PLAYING PHASE
    if (gameState.phase !== 'playing') return;
    if (gameState.currentTurn !== myPlayer.current) return;

    const clickedPiece = gameState.board[row]?.[col];

    if (selectedSquare) {
      // Second click — try to move
      if (selectedSquare.row === row && selectedSquare.col === col) {
        // Deselect
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }

      // Check if clicking own piece — switch selection
      if (clickedPiece && clickedPiece.owner === myPlayer.current) {
        setSelectedSquare({ row, col });
        const piece = clickedPiece as VisiblePiece;
        const moves = getValidMoves(piece, gameState.board as any);
        setValidMoves(moves);
        return;
      }

      // Try to move
      const isValid = validMoves.some(m => m.row === row && m.col === col);
      if (isValid) {
        socket?.emit(C2S.MAKE_MOVE, {
          from: selectedSquare,
          to: { row, col },
        });
        setLastMove({ from: selectedSquare, to: { row, col } });
        setSelectedSquare(null);
        setValidMoves([]);
      }
    } else {
      // First click — select own piece
      if (clickedPiece && clickedPiece.owner === myPlayer.current) {
        SFX.select();
        setSelectedSquare({ row, col });
        const piece = clickedPiece as VisiblePiece;
        const moves = getValidMoves(piece, gameState.board as any);
        setValidMoves(moves);
      }
    }
  }, [gameState, selectedSquare, validMoves, setupPieces, selectedRank, isReady, revealEvent]);

  const handleSpotterPredict = useCallback((target: Square, rank: Rank) => {
    if (!spotterData) return;
    socket?.emit(C2S.SPOTTER_PREDICT, {
      spotterPosition: spotterData.spotterPosition,
      targetPosition: target,
      predictedRank: rank,
    });
  }, [spotterData]);

  const handleAutoPlace = useCallback(() => {
    // Use the import from gameLogic
    import('@/lib/gameLogic').then(({ autoPlacePieces }) => {
      const pieces = autoPlacePieces(myPlayer.current);
      setSetupPieces(pieces);
      socket?.emit(C2S.PLACE_PIECES, { pieces });
    });
  }, []);

  const handleReady = useCallback(() => {
    if (setupPieces.length !== TOTAL_PIECES) return;
    SFX.ready();
    setIsReady(true);
    socket?.emit(C2S.PLACE_PIECES, { pieces: setupPieces });
    // Small delay to ensure PLACE_PIECES processes first, then send pieces again with READY as backup
    setTimeout(() => {
      socket?.emit(C2S.PLAYER_READY, { pieces: setupPieces });
    }, 100);
  }, [setupPieces]);

  const handlePlayAgain = useCallback(() => {
    socket?.emit(C2S.PLAY_AGAIN);
    setSetupPieces([]);
    setSelectedRank(null);
    setIsReady(false);
    setSelectedSquare(null);
    setValidMoves([]);
    setLastMove(null);
  }, []);

  // Handle voice commands
  const handleVoiceCommand = useCallback((command: GameCommand) => {
    if (!gameState) return;

    if (command.type === 'ready' && gameState.phase === 'setup') {
      if (setupPieces.length === TOTAL_PIECES && !isReady) {
        setIsReady(true);
        socket?.emit(C2S.PLACE_PIECES, { pieces: setupPieces });
        socket?.emit(C2S.PLAYER_READY);
      }
    }

    if (command.type === 'move' && gameState.phase === 'playing' && command.from && command.to) {
      // Parse coordinates like "A3" to row/col
      const parseCoord = (s: string) => {
        const col = s.charCodeAt(0) - 65; // A=0, B=1, ...
        const row = 8 - parseInt(s.slice(1)); // "1"=row7, "8"=row0
        return { row, col };
      };
      const from = parseCoord(command.from);
      const to = parseCoord(command.to);
      if (from.row >= 0 && from.row < 8 && from.col >= 0 && from.col < 10 &&
          to.row >= 0 && to.row < 8 && to.col >= 0 && to.col < 10) {
        socket?.emit(C2S.MAKE_MOVE, { from, to });
        setLastMove({ from, to });
      }
    }

    if (command.type === 'theme' && command.theme) {
      const t = command.theme.toLowerCase();
      if (t === 'kingdom' || t === 'pirate' || t === 'greek') {
        setThemeId(t);
      }
    }
  }, [gameState, setupPieces, isReady, setThemeId]);

  // Build the board for setup phase (show placed pieces)
  const getDisplayBoard = (): (ClientPiece | null)[][] => {
    if (!gameState) return [];

    if (gameState.phase === 'setup') {
      const board: (ClientPiece | null)[][] = [];
      for (let r = 0; r < BOARD_ROWS; r++) {
        board[r] = [];
        for (let c = 0; c < BOARD_COLS; c++) {
          const piece = setupPieces.find(p => p.row === r && p.col === c);
          board[r][c] = piece ? { ...piece } as VisiblePiece : null;
        }
      }
      return board;
    }

    // Show revealed board after game over if toggled
    if (gameState.phase === 'gameover' && showRevealedBoard && gameState.revealedBoard) {
      return gameState.revealedBoard as (ClientPiece | null)[][];
    }

    return gameState.board;
  };

  if (!gameState) {
    return <LoadingScreen />;
  }

  const isMyTurn = gameState.currentTurn === myPlayer.current;
  const placedCounts: Record<string, number> = {};
  for (const p of setupPieces) {
    placedCounts[p.rank] = (placedCounts[p.rank] || 0) + 1;
  }

  return (
    <div className="lg:h-screen flex flex-col lg:overflow-hidden overflow-y-auto bg-stone-950 text-white">
      {/* Top bar */}
      <div className="game-topbar flex items-center justify-between px-4 py-2 bg-stone-900/90 border-b border-stone-700 backdrop-blur-sm relative z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const leave = () => {
                sessionStorage.removeItem('roomCode');
                sessionStorage.removeItem('playerNumber');
                sessionStorage.removeItem('roomTheme');
                router.push('/');
              };
              if (gameState?.phase === 'playing') {
                if (window.confirm('Leave the game? Your progress will be lost.')) {
                  leave();
                }
              } else {
                leave();
              }
            }}
            className="text-blue-400 font-black text-lg tracking-wider hover:text-blue-300 transition-colors cursor-pointer"
          >
            OUTRANK
          </button>
          <button
            onClick={handleCopyRoomCode}
            className="text-xs text-stone-400 bg-stone-800 px-2 py-0.5 rounded font-mono
              hover:bg-stone-700 hover:text-stone-300 transition-all cursor-pointer group relative"
            title="Click to copy room code"
          >
            Room: {gameState.roomCode}
            {copied && (
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-green-400 whitespace-nowrap">
                Copied!
              </span>
            )}
          </button>
          <button
            onClick={() => {
              const newMuted = !sfxMuted;
              setSfxMuted(newMuted);
              setSfxMutedState(newMuted);
            }}
            className="text-xs bg-stone-800 px-2 py-1 rounded hover:bg-stone-700 transition-all cursor-pointer"
            title={sfxMuted ? 'Unmute sound effects' : 'Mute sound effects'}
          >
            {sfxMuted ? '🔇' : '🔊'}
          </button>
          <button
            onClick={() => {
              if (musicPlaying) { stopMusic(); setMusicPlaying(false); }
              else {
                const t = (gameState?.roomTheme || 'kingdom') as 'kingdom' | 'pirate' | 'greek';
                startMusic(t); setMusicPlaying(true);
              }
            }}
            className="text-xs bg-stone-800 px-2 py-1 rounded hover:bg-stone-700 transition-all cursor-pointer"
            title={musicPlaying ? 'Stop music' : 'Play music'}
          >
            {musicPlaying ? '🎵' : '🎶'}
          </button>
          {musicPlaying && (
            <input
              type="range"
              min="0"
              max="80"
              defaultValue="25"
              onChange={e => setMusicVolume(parseInt(e.target.value) / 100)}
              className="w-16 h-1 accent-blue-400 cursor-pointer"
              title="Music volume"
            />
          )}
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <span className="text-xs text-stone-400">
            {gameState.myNickname || `Player ${myPlayer.current}`}
            <span className={`ml-2 inline-block w-2 h-2 rounded-full ${
              myPlayer.current === 1 ? 'bg-blue-400' : 'bg-red-400'
            }`} />
          </span>
          <span className="game-vs-label text-xs text-stone-500 ml-2">
            vs {gameState.opponentNickname || 'Opponent'}
          </span>
          {gameState.phase === 'playing' && (
            <div className="flex items-center gap-2">
              <TurnTimer active={isMyTurn} deadline={gameState.turnDeadline} paused={!!revealEvent} />
              <span className={`text-sm font-bold px-3 py-1 rounded transition-all flex items-center gap-1.5 ${
                isMyTurn
                  ? 'bg-green-600/30 text-green-400 border border-green-500/50 turn-glow'
                  : 'bg-stone-800 text-stone-400 border border-stone-700'
              }`}>
                <span className={isMyTurn ? 'turn-icon-swing' : 'opacity-50'}>
                  {theme.id === 'kingdom' ? '\u2694\uFE0F' : theme.id === 'pirate' ? '\u2620\uFE0F' : '\u26A1'}
                </span>
                {isMyTurn ? theme.flavor.yourTurn : theme.flavor.waiting}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Disconnection warning */}
      {disconnected && (
        <div className="bg-red-900/50 border-b border-red-600 px-4 py-2 text-center text-sm text-red-300 animate-pulse">
          Opponent disconnected &mdash; waiting for reconnection (5 min)...
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-900/30 border-b border-red-600/50 px-4 py-2 text-center text-sm text-red-400 shake">
          {error}
        </div>
      )}

      {/* Main content */}
      <div className="game-layout-main flex-1 min-h-0 flex flex-col lg:flex-row gap-6 px-4 py-2 max-w-[1600px] mx-auto w-full">
        {/* Left sidebar — captured pieces (playing/gameover only) */}
        {(gameState.phase === 'playing' || gameState.phase === 'gameover') && (
          <div className="game-sidebar-left lg:w-52 shrink-0 order-2 lg:order-1 overflow-y-auto">
            <CapturedPieces
              mine={gameState.capturedPieces.mine}
              theirs={gameState.capturedPieces.theirs}
            />
          </div>
        )}

        {/* Center — board with setup overlay */}
        <div className="game-board-center flex-1 min-h-0 order-1 lg:order-2 flex flex-col relative">
          <Board
            board={getDisplayBoard()}
            myPlayer={myPlayer.current}
            selectedSquare={selectedSquare}
            validMoves={validMoves}
            lastMove={replayHighlight || lastMove}
            revealingSquares={revealingSquares}
            onSquareClick={handleBoardClick}
            phase={gameState.phase}
            isMyTurn={isMyTurn}
            myNickname={gameState.myNickname}
            opponentNickname={gameState.opponentNickname}
            opponentMove={opponentMove}
            setupOverlay={gameState.phase === 'setup' ? (
              <div className="bg-stone-950/92 backdrop-blur-md border border-stone-700/60 rounded-2xl p-4 shadow-2xl"
                style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-base font-bold text-amber-400 tracking-wide">
                      {theme.flavor.setupTitle}
                    </h2>
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      Select a piece, then click your rows to place
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold tabular-nums text-stone-300">
                      {setupPieces.length}<span className="text-stone-500">/{TOTAL_PIECES}</span>
                    </span>
                    <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="#292524" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15" fill="none" stroke="#f59e0b" strokeWidth="3"
                        strokeDasharray={`${(setupPieces.length / TOTAL_PIECES) * 94.2} 94.2`}
                        strokeLinecap="round"
                        className="transition-all duration-300"
                      />
                    </svg>
                  </div>
                </div>
                <SetupTray
                  selectedRank={selectedRank}
                  onSelectRank={setSelectedRank}
                  placedCounts={placedCounts}
                  isReady={isReady}
                />
                <div className="flex gap-2 items-center mt-3">
                  <button onClick={handleAutoPlace} disabled={isReady}
                    className="flex-1 py-1.5 bg-stone-800 hover:bg-stone-700 rounded-lg text-xs font-medium disabled:opacity-40 transition-colors border border-stone-700/50">
                    Auto-Place
                  </button>
                  <button onClick={() => { setSetupPieces([]); setSelectedRank(null); }} disabled={isReady}
                    className="flex-1 py-1.5 bg-stone-800 hover:bg-stone-700 rounded-lg text-xs font-medium disabled:opacity-40 transition-colors border border-stone-700/50">
                    Clear
                  </button>
                  <button onClick={handleReady} disabled={setupPieces.length !== TOTAL_PIECES || isReady}
                    className={`flex-[1.5] py-1.5 rounded-lg font-bold text-sm transition-all ${
                      isReady ? 'bg-green-900/60 text-green-300 border border-green-600/50'
                        : setupPieces.length === TOTAL_PIECES ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-600/20'
                        : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700/50'
                    }`}>
                    {isReady ? 'Waiting...' : 'READY'}
                  </button>
                </div>
                {gameState.opponentReady && (
                  <p className="text-green-400 text-[10px] text-center animate-pulse mt-2">Opponent is ready!</p>
                )}
              </div>
            ) : undefined}
            onSetupDragDrop={gameState.phase === 'setup' && !isReady ? (fromRow, fromCol, toRow, toCol) => {
              const fromIdx = setupPieces.findIndex(p => p.row === fromRow && p.col === fromCol);
              if (fromIdx < 0) return;

              const toIdx = setupPieces.findIndex(p => p.row === toRow && p.col === toCol);
              const updated = [...setupPieces];

              if (toIdx >= 0) {
                // Swap the two pieces
                updated[fromIdx] = { ...updated[fromIdx], row: toRow, col: toCol };
                updated[toIdx] = { ...updated[toIdx], row: fromRow, col: fromCol };
              } else if (isValidSetupRow(toRow, myPlayer.current) && !isLake(toRow, toCol)) {
                // Move piece to empty square
                updated[fromIdx] = { ...updated[fromIdx], row: toRow, col: toCol };
              } else {
                return;
              }

              setSetupPieces(updated);
              socket?.emit(C2S.PLACE_PIECES, { pieces: updated });
            } : undefined}
          />

        </div>

        {/* Right sidebar — move log (playing/gameover only) */}
        {(gameState.phase === 'playing' || gameState.phase === 'gameover') && (
          <div className="game-sidebar-right lg:w-52 shrink-0 order-3 overflow-y-auto">
            <MoveLog
              entries={gameState.moveLog}
              onEntryClick={(from, to) => {
                setReplayHighlight({ from, to });
                setTimeout(() => setReplayHighlight(null), 2000);
              }}
            />
          </div>
        )}
      </div>

      {/* Modals / overlays */}
      {revealEvent && <RevealAnimation event={revealEvent} />}

      {coinFlip && (
        <CoinFlip
          player1Name={coinFlip.player1Name}
          player2Name={coinFlip.player2Name}
          winner={coinFlip.winner}
          onComplete={() => setCoinFlip(null)}
        />
      )}

      {showSpotter && spotterData && (
        <SpotterModal
          spotterPosition={spotterData.spotterPosition}
          targets={spotterData.adjacentTargets}
          onPredict={handleSpotterPredict}
        />
      )}

      {/* Tutorial */}
      {showTutorial && (
        <Tutorial onClose={() => {
          setShowTutorial(false);
          sessionStorage.setItem('tutorial-seen', '1');
        }} />
      )}

      <NotificationManager
        theme={theme.id}
        gameState={gameState ? {
          phase: gameState.phase,
          myPlayer: myPlayer.current,
          currentTurn: gameState.currentTurn,
          opponentConnected: gameState.opponentConnected,
          moveLog: gameState.moveLog,
        } : null}
      />
      <VoiceCommander theme={theme.id} onCommand={handleVoiceCommand} />

      {gameState.phase === 'gameover' && gameState.winner && (
        <GameOverModal
          winner={gameState.winner}
          myPlayer={myPlayer.current}
          reason={gameState.winReason || ''}
          onPlayAgain={() => {
            sessionStorage.removeItem('roomCode');
            sessionStorage.removeItem('playerNumber');
            sessionStorage.removeItem('roomTheme');
            router.push('/');
          }}
          onRematch={() => {
            handlePlayAgain();
            gameStartTimeRef.current = 0;
            setShowRevealedBoard(false);
          }}
          onRevealBoard={() => setShowRevealedBoard(!showRevealedBoard)}
          boardRevealed={showRevealedBoard}
          moveCount={gameState.moveLog.length}
          capturedMine={gameState.capturedPieces.mine.length}
          capturedTheirs={gameState.capturedPieces.theirs.length}
          gameDuration={gameStartTimeRef.current ? Date.now() - gameStartTimeRef.current : undefined}
        />
      )}
    </div>
  );
}
