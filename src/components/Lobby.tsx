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
  { id: 'kingdom', name: 'Kingdom', desc: 'Medieval castles & knights', icon: '👑', preview: '/images/kingdom-bg.png' },
  { id: 'pirate', name: 'Pirate', desc: 'High seas & treasure', icon: '⚓', preview: '/images/pirate-bg.png' },
  { id: 'greek', name: 'Greek', desc: 'Gods of Olympus', icon: '⚡', preview: '/images/greek-bg.png' },
];

export default function Lobby({
  onCreateGame, onJoinGame, onPlayBot, roomCode, playerNumber, waiting, error,
}: LobbyProps) {
  const [nickname, setNickname] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState<'menu' | 'join'>('menu');
  const [selectedTheme, setSelectedTheme] = useState('kingdom');
  const [copied, setCopied] = useState(false);

  const handleCopyCode = useCallback(() => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }, [roomCode]);

  const currentTheme = THEMES.find(t => t.id === selectedTheme)!;

  return (
    <div className="min-h-screen bg-[#030508] text-white relative overflow-hidden">
      {/* Full-screen background image from selected theme */}
      <div
        className="fixed inset-0 transition-all duration-1000 ease-out"
        style={{ backgroundImage: `url(${currentTheme.preview})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-[2px]" />
      {/* Bottom gradient */}
      <div className="fixed inset-0 bg-gradient-to-t from-[#030508] via-[#030508]/40 to-transparent" />
      {/* Top vignette */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,transparent_20%,#030508_80%)]" />

      {/* Floating particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 30 }, (_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              background: `rgba(150, 180, 255, ${0.1 + Math.random() * 0.2})`,
              animation: `dust-float ${8 + Math.random() * 8}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">

        {/* Waiting for opponent */}
        {waiting && roomCode ? (
          <div className="w-full max-w-md text-center">
            <h1 className="text-5xl font-black mb-2 tracking-[0.08em]">
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">OUT</span>RANK
            </h1>
            <div className="w-12 h-0.5 bg-blue-500/50 mx-auto mb-8 rounded-full" />
            <p className="text-white/40 mb-5 text-sm">Share this code with your opponent</p>
            <button
              onClick={handleCopyCode}
              className="relative w-full text-4xl font-mono font-black text-blue-400 tracking-[0.4em]
                bg-white/[0.03] py-6 rounded-2xl border border-white/10
                hover:border-blue-500/40 hover:bg-white/[0.05] transition-all cursor-pointer group"
            >
              {roomCode}
              <span className={`absolute right-5 top-1/2 -translate-y-1/2 text-xs font-sans tracking-normal font-medium transition-all ${
                copied ? 'text-green-400 opacity-100' : 'text-white/20 opacity-0 group-hover:opacity-100'
              }`}>
                {copied ? '✓ Copied' : 'Copy'}
              </span>
            </button>
            <div className="flex items-center justify-center gap-3 mt-8">
              <div className="w-3.5 h-3.5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
              <span className="text-white/30 text-sm">Waiting for opponent...</span>
            </div>
            <p className="text-white/15 text-xs mt-3">
              Playing as {nickname || `Player ${playerNumber}`}
            </p>
          </div>
        ) : mode === 'join' ? (
          /* Join form */
          <div className="w-full max-w-md">
            <button
              onClick={() => setMode('menu')}
              className="text-white/25 hover:text-blue-400 transition-colors mb-10 flex items-center gap-1.5 text-sm group"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span> Back
            </button>
            <div className="text-center mb-10">
              <h2 className="text-4xl font-black mb-2">Join Game</h2>
              <p className="text-white/25 text-sm">Enter the 6-character room code</p>
            </div>
            <input
              type="text"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="• • • • • •"
              maxLength={6}
              className="w-full px-4 py-6 bg-white/[0.04] border border-white/[0.08] rounded-2xl
                text-center text-4xl font-mono tracking-[0.5em] text-white
                focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10
                placeholder:text-white/10 placeholder:tracking-[0.5em] placeholder:text-2xl
                transition-all duration-300"
            />
            <button
              onClick={() => onJoinGame(joinCode, nickname || 'Player 2')}
              disabled={joinCode.length !== 6}
              className="w-full mt-5 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl
                font-bold text-lg transition-all disabled:opacity-15 disabled:cursor-not-allowed text-white
                hover:shadow-xl hover:shadow-blue-500/20 active:scale-[0.99]"
            >
              Join Game →
            </button>
          </div>
        ) : (
          /* Main Menu - split layout */
          <div className="w-full max-w-5xl">
            {/* Title - centered at top */}
            <div className="text-center mb-16">
              <h1 className="text-7xl md:text-8xl font-black tracking-[0.04em] leading-none mb-3">
                <span className="bg-gradient-to-r from-blue-400 via-blue-200 to-cyan-300 bg-clip-text text-transparent drop-shadow-2xl">OUT</span><span className="text-white drop-shadow-2xl">RANK</span>
              </h1>
              <p className="text-white/20 text-sm tracking-[0.3em] uppercase font-light">
                Strategy &middot; Deception &middot; War
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Left side - Faction selection */}
              <div>
                <h3 className="text-white/30 text-[11px] font-bold uppercase tracking-[0.2em] mb-4">
                  Select Faction
                </h3>
                <div className="space-y-3">
                  {THEMES.map(t => {
                    const isSelected = selectedTheme === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTheme(t.id)}
                        className={`
                          w-full flex items-center gap-4 p-3 rounded-2xl transition-all duration-500 group text-left
                          ${isSelected
                            ? 'bg-white/[0.08] ring-1 ring-blue-500/40'
                            : 'bg-white/[0.02] hover:bg-white/[0.05] ring-1 ring-white/[0.04] hover:ring-white/10'
                          }
                        `}
                      >
                        {/* Preview thumbnail */}
                        <div className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 transition-all duration-500 ${
                          isSelected ? 'ring-2 ring-blue-400/60 shadow-lg shadow-blue-500/20' : 'ring-1 ring-white/10'
                        }`}>
                          <img
                            src={t.preview}
                            alt={t.name}
                            className={`w-full h-full object-cover transition-all duration-500 ${
                              isSelected ? 'scale-110 brightness-90' : 'brightness-50 group-hover:brightness-75'
                            }`}
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{t.icon}</span>
                            <h4 className={`font-bold text-base transition-colors ${isSelected ? 'text-white' : 'text-white/50'}`}>
                              {t.name}
                            </h4>
                          </div>
                          <p className="text-white/20 text-xs mt-0.5">{t.desc}</p>
                        </div>

                        {/* Radio indicator */}
                        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                          isSelected ? 'border-blue-400 bg-blue-500' : 'border-white/20'
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right side - Name + Actions */}
              <div>
                {/* Name input */}
                <div className="mb-6">
                  <h3 className="text-white/30 text-[11px] font-bold uppercase tracking-[0.2em] mb-4">
                    Commander Name
                  </h3>
                  <div className="relative">
                    <input
                      type="text"
                      value={nickname}
                      onChange={e => setNickname(e.target.value.slice(0, 20))}
                      placeholder="Enter your name..."
                      maxLength={20}
                      className="w-full bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/15
                        focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/8 h-14 text-lg px-5 pr-12
                        transition-all duration-300 rounded-2xl focus:outline-none hover:border-white/15"
                    />
                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${
                      nickname ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                    }`}>
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-md shadow-green-400/50" />
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="space-y-3">
                  <h3 className="text-white/30 text-[11px] font-bold uppercase tracking-[0.2em] mb-4">
                    Game Mode
                  </h3>

                  {onPlayBot && (
                    <button
                      onClick={() => onPlayBot(nickname || 'Player 1')}
                      className="w-full h-14 rounded-2xl relative overflow-hidden group
                        transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]
                        hover:shadow-2xl hover:shadow-blue-500/15"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500" />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                      <div className="relative flex items-center justify-center gap-3 font-bold text-base">
                        <span className="text-lg">🤖</span> Play vs Bot
                      </div>
                    </button>
                  )}

                  <button
                    onClick={() => onCreateGame(nickname || 'Player 1', selectedTheme)}
                    className="w-full h-12 rounded-xl bg-white/[0.04] border border-white/[0.08]
                      hover:bg-white/[0.07] hover:border-white/15
                      transition-all duration-200 font-semibold text-sm text-white/60 hover:text-white
                      flex items-center justify-center gap-2.5 active:scale-[0.99]"
                  >
                    <span>👥</span> Create Room
                  </button>

                  <button
                    onClick={() => setMode('join')}
                    className="w-full h-12 rounded-xl bg-white/[0.04] border border-white/[0.08]
                      hover:bg-white/[0.07] hover:border-white/15
                      transition-all duration-200 font-semibold text-sm text-white/60 hover:text-white
                      flex items-center justify-center gap-2.5 active:scale-[0.99]"
                  >
                    <span>⚔️</span> Join Game
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <p className="text-center text-white/10 text-[10px] mt-12 tracking-[0.15em] uppercase">
              No account required &middot; Play instantly
            </p>
          </div>
        )}
      </div>

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-red-950/90 border border-red-500/20 rounded-2xl
          text-red-300 text-sm text-center backdrop-blur-xl shadow-2xl shake">
          {error}
        </div>
      )}
    </div>
  );
}
