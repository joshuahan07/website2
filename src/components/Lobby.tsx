'use client';

import { useState, useCallback } from 'react';
interface LobbyProps {
  onCreateGame: (nickname: string, theme: string) => void;
  onJoinGame: (code: string, nickname: string) => void;
  onPlayBot?: (nickname: string) => void;
  roomCode: string | null;
  playerNumber: number | null;
  waiting: boolean;
  error: string | null;
}

const THEMES = [
  { id: 'kingdom', name: 'Kingdom', desc: 'Medieval warfare', icon: '👑' },
  { id: 'pirate', name: 'Pirate', desc: 'High seas battle', icon: '⚓' },
  { id: 'greek', name: 'Greek', desc: 'Olympian conquest', icon: '⚡' },
];

export default function Lobby({
  onCreateGame, onJoinGame, onPlayBot, roomCode, playerNumber, waiting, error,
}: LobbyProps) {
  const [nickname, setNickname] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState<'menu' | 'join'>('menu');
  const [selectedTheme, setSelectedTheme] = useState('kingdom');
  const [hoveredTheme, setHoveredTheme] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = useCallback(() => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }, [roomCode]);

  return (
    <div className="min-h-screen bg-[#0B0C10] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.7)_100%)]" />
        {Array.from({ length: 30 }, (_, i) => (
          <div
            key={i}
            className="dust-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 4}s`,
            }}
          />
        ))}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-2xl">
        <div className="glass-card-strong p-8 md:p-12">

          {/* Waiting for opponent */}
          {waiting && roomCode ? (
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-[0.12em]">
                <span className="text-[#FF6A3D]">BATTLE</span> TACTIC
              </h1>
              <p className="text-[#A9AFB8] mb-6">Share this room code with your opponent:</p>
              <button
                onClick={handleCopyCode}
                className="relative w-full text-4xl font-mono font-bold text-[#FF6A3D] tracking-[0.3em]
                  bg-white/5 py-4 rounded-xl border-2 border-white/10
                  hover:border-[#FF6A3D]/50 hover:bg-white/10 transition-all cursor-pointer group"
              >
                {roomCode}
                <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-xs tracking-normal transition-opacity ${
                  copied ? 'text-green-400 opacity-100' : 'text-[#A9AFB8] opacity-0 group-hover:opacity-100'
                }`}>
                  {copied ? 'Copied!' : 'Copy'}
                </span>
              </button>
              <div className="flex items-center justify-center gap-2 mt-6 text-sm text-[#A9AFB8]">
                <div className="w-5 h-5 border-2 border-[#FF6A3D]/30 border-t-[#FF6A3D] rounded-full animate-spin" />
                <span className="animate-pulse">Waiting for opponent to join...</span>
              </div>
              <p className="text-xs text-[#A9AFB8]/60 mt-2">
                You are {nickname || `Player ${playerNumber}`}
              </p>
            </div>
          ) : mode === 'join' ? (
            /* Join form */
            <div>
              <button
                onClick={() => setMode('menu')}
                className="text-sm text-[#A9AFB8] hover:text-white transition-colors mb-6 flex items-center gap-1"
              >
                ← Back
              </button>
              <h2 className="text-2xl font-bold text-white mb-6 text-center">Join a Game</h2>
              <input
                type="text"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter room code"
                maxLength={6}
                className="w-full px-4 py-4 bg-white/5 border-2 border-white/10 rounded-xl
                  text-center text-2xl font-mono tracking-[0.3em] text-white
                  focus:outline-none focus:border-[#FF6A3D] focus:ring-2 focus:ring-[#FF6A3D]/20
                  placeholder:text-white/20 placeholder:tracking-normal placeholder:text-base
                  transition-all"
              />
              <button
                onClick={() => onJoinGame(joinCode, nickname || 'Player 2')}
                disabled={joinCode.length !== 6}
                className="w-full mt-4 py-4 bg-[#FF6A3D] hover:bg-[#ff7a50] rounded-xl
                  font-semibold text-lg transition-all disabled:opacity-30
                  disabled:cursor-not-allowed text-white
                  hover:scale-[1.02] hover:shadow-lg hover:shadow-[#FF6A3D]/30
                  active:scale-[0.98]"
              >
                Join Game
              </button>
            </div>
          ) : (
            /* Main Menu */
            <>
              {/* Logo */}
              <div className="text-center mb-10">
                <h1 className="text-5xl md:text-6xl font-black text-white mb-3 tracking-[0.12em]">
                  <span className="text-[#FF6A3D]">BATTLE</span> TACTIC
                </h1>
                <p className="text-[#A9AFB8] text-lg tracking-wide">
                  Classic strategy. Modern mayhem.
                </p>
              </div>

              {/* Nickname Input */}
              <div className="mb-8">
                <label className="block text-[#A9AFB8] text-sm font-medium mb-2 ml-1">
                  Enter Your Name
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={e => setNickname(e.target.value.slice(0, 20))}
                  placeholder="Commander..."
                  maxLength={20}
                  className="w-full bg-white/5 border-2 border-white/10 text-white placeholder:text-white/25
                    focus:border-[#FF6A3D] focus:ring-2 focus:ring-[#FF6A3D]/20 h-14 text-lg px-4
                    transition-all duration-300 rounded-xl focus:outline-none"
                />
              </div>

              {/* Theme Selection */}
              <div className="mb-10">
                <label className="block text-[#A9AFB8] text-sm font-medium mb-4 ml-1">
                  Choose Your Faction
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {THEMES.map(t => {
                    const isSelected = selectedTheme === t.id;
                    const isHovered = hoveredTheme === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTheme(t.id)}
                        onMouseEnter={() => setHoveredTheme(t.id)}
                        onMouseLeave={() => setHoveredTheme(null)}
                        className={`
                          relative p-5 rounded-xl border-2 transition-all duration-300
                          ${isSelected
                            ? 'border-[#FF6A3D] bg-[#FF6A3D]/10 shadow-lg shadow-[#FF6A3D]/20'
                            : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                          }
                        `}
                      >
                        <div className={`
                          w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center
                          transition-all duration-300 text-2xl
                          ${isSelected
                            ? 'bg-[#FF6A3D] shadow-lg shadow-[#FF6A3D]/40'
                            : 'bg-white/10'
                          }
                        `}>
                          {t.icon}
                        </div>
                        <h3 className={`font-semibold text-sm tracking-wide transition-colors ${
                          isSelected ? 'text-white' : 'text-white/70'
                        }`}>
                          {t.name}
                        </h3>
                        <p className="text-[10px] text-[#A9AFB8] mt-1">{t.desc}</p>
                        {isSelected && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#FF6A3D] rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        {isHovered && !isSelected && (
                          <div className="absolute inset-0 rounded-xl bg-white/5 animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {onPlayBot && (
                  <button
                    onClick={() => onPlayBot(nickname || 'Player 1')}
                    className="w-full h-14 bg-[#FF6A3D] hover:bg-[#ff7a50] text-white font-semibold text-lg
                      transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-[#FF6A3D]/30
                      active:scale-[0.98] rounded-xl flex items-center justify-center gap-3"
                  >
                    <span className="text-xl">🤖</span>
                    Play vs Bot
                  </button>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => onCreateGame(nickname || 'Player 1', selectedTheme)}
                    className="h-12 bg-transparent border-2 border-white/20 text-white hover:bg-white/10
                      hover:border-white/40 transition-all duration-200 rounded-xl font-semibold
                      flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <span>👥</span> Create Game
                  </button>
                  <button
                    onClick={() => setMode('join')}
                    className="h-12 bg-transparent border-2 border-white/20 text-white hover:bg-white/10
                      hover:border-white/40 transition-all duration-200 rounded-xl font-semibold
                      flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <span>⚔️</span> Join Game
                  </button>
                </div>
              </div>

              <p className="text-center text-[#A9AFB8]/50 text-xs mt-8">
                No account required. Play instantly.
              </p>

            </>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-red-900/80 border border-red-600/50 rounded-xl
          text-red-300 text-sm text-center backdrop-blur-sm shadow-2xl shake">
          {error}
        </div>
      )}
    </div>
  );
}
