'use client';

import { useState, useCallback } from 'react';

interface LobbyProps {
  onCreateGame: (nickname: string, theme: string) => void;
  onJoinGame: (code: string, nickname: string) => void;
  onPlayBot: (nickname: string) => void;
  roomCode: string | null;
  playerNumber: number | null;
  waiting: boolean;
  error: string | null;
}

function LoadingSpinner() {
  return (
    <div className="inline-block w-5 h-5 border-2 border-amber-400/30 border-t-amber-400 rounded-full spin-slow" />
  );
}

function LobbyParticles() {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    left: `${(i / 12) * 100 + Math.random() * 8}%`,
    delay: `${(Math.random() * 8).toFixed(2)}s`,
    duration: `${(8 + Math.random() * 6).toFixed(2)}s`,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <div
          key={i}
          className="lobby-particle"
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
}

export default function Lobby({
  onCreateGame, onJoinGame, onPlayBot, roomCode, playerNumber, waiting, error,
}: LobbyProps) {
  const [nickname, setNickname] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState<'menu' | 'join'>('menu');
  const [selectedTheme, setSelectedTheme] = useState<string>('kingdom');
  const [copied, setCopied] = useState(false);

  const handleCopyCode = useCallback(() => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Fallback: select text (clipboard API may not be available)
    });
  }, [roomCode]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animated-bg relative">
      <LobbyParticles />

      <div className="max-w-md w-full relative z-10">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-amber-400 mb-2 tracking-[0.2em] drop-shadow-lg">
            BATTLE TACTIC
          </h1>
          <p className="text-stone-500 text-sm tracking-wide">
            Classic strategy board game &mdash; online multiplayer
          </p>
        </div>

        {/* Waiting for opponent */}
        {waiting && roomCode && (
          <div className="bg-stone-800/80 border border-stone-600 rounded-xl p-6 text-center backdrop-blur-sm shadow-xl">
            <p className="text-gray-300 mb-4">Share this room code with your opponent:</p>
            <button
              onClick={handleCopyCode}
              className="relative w-full text-4xl font-mono font-bold text-amber-400 tracking-[0.3em]
                bg-stone-900 py-3 rounded-lg border border-amber-400/30
                hover:border-amber-400/60 hover:bg-stone-900/80 transition-all
                cursor-pointer group"
              title="Click to copy"
            >
              {roomCode}
              <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs tracking-normal transition-opacity ${
                copied ? 'text-green-400 opacity-100' : 'text-stone-500 opacity-0 group-hover:opacity-100'
              }`}>
                {copied ? 'Copied!' : 'Copy'}
              </span>
            </button>
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-400">
              <LoadingSpinner />
              <span className="animate-pulse">Waiting for opponent to join...</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              You are {nickname || `Player ${playerNumber}`}
            </p>
          </div>
        )}

        {/* Menu */}
        {!waiting && mode === 'menu' && (
          <div className="space-y-4">
            <div className="mb-4">
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value.slice(0, 20))}
                placeholder="Enter your nickname"
                maxLength={20}
                className="w-full px-4 py-3 bg-stone-800 border border-stone-600 rounded-lg
                  text-center text-lg text-white
                  focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30
                  placeholder:text-stone-600
                  transition-all"
              />
            </div>
            <div className="mb-4">
              <p className="text-xs text-stone-400 text-center mb-2">Choose a theme:</p>
              <div className="flex gap-2 justify-center">
                {[
                  { id: 'kingdom', name: 'Kingdom', icon: '🏰' },
                  { id: 'pirate', name: 'Pirate', icon: '🏴‍☠️' },
                  { id: 'greek', name: 'Greek', icon: '⚡' },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTheme(t.id)}
                    className={`
                      flex-1 py-3 rounded-lg text-center transition-all
                      ${selectedTheme === t.id
                        ? 'bg-amber-600 ring-2 ring-amber-300 text-white'
                        : 'bg-stone-700 hover:bg-stone-600 text-stone-300'
                      }
                    `}
                  >
                    <span className="text-2xl block mb-1">{t.icon}</span>
                    <span className="text-xs font-semibold">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => onCreateGame(nickname || 'Player 1', selectedTheme)}
              className="w-full py-4 bg-amber-600 hover:bg-amber-500 rounded-lg
                font-bold text-xl transition-all hover:scale-[1.02] text-white
                shadow-lg shadow-amber-600/20 active:scale-[0.98]"
            >
              Create Game
            </button>
            <button
              onClick={() => onPlayBot(nickname || 'Player 1')}
              className="w-full py-4 bg-emerald-700 hover:bg-emerald-600 rounded-lg
                font-bold text-xl transition-all hover:scale-[1.02] text-white
                shadow-lg shadow-emerald-700/20 active:scale-[0.98]"
            >
              Play vs Bot
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full py-4 bg-stone-700 hover:bg-stone-600 rounded-lg
                font-bold text-xl transition-all hover:scale-[1.02] text-white
                shadow-lg shadow-stone-700/20 active:scale-[0.98]"
            >
              Join Game
            </button>
          </div>
        )}

        {/* Join form */}
        {!waiting && mode === 'join' && (
          <div className="space-y-4">
            <button
              onClick={() => setMode('menu')}
              className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              &larr; Back
            </button>
            <input
              type="text"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter room code"
              maxLength={6}
              className="w-full px-4 py-3 bg-stone-800 border border-stone-600 rounded-lg
                text-center text-2xl font-mono tracking-[0.3em] text-white
                focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30
                placeholder:text-stone-600 placeholder:tracking-normal placeholder:text-base
                transition-all"
            />
            <button
              onClick={() => onJoinGame(joinCode, nickname || 'Player 2')}
              disabled={joinCode.length !== 6}
              className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-lg
                font-bold text-lg transition-all disabled:opacity-40
                disabled:cursor-not-allowed text-white shadow-lg shadow-green-600/20
                active:scale-[0.98]"
            >
              Join
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-900/30 border border-red-600/50 rounded-lg
            text-red-400 text-sm text-center shake">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
