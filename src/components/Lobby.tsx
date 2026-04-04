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
  { id: 'kingdom', name: 'Kingdom', desc: 'Medieval castles & knights', icon: '👑', preview: '/images/kingdom/king.png' },
  { id: 'pirate', name: 'Pirate', desc: 'High seas & treasure', icon: '⚓', preview: '/images/pirate/kraken.png' },
  { id: 'greek', name: 'Greek', desc: 'Gods of Olympus', icon: '⚡', preview: '/images/greek/zeus.png' },
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

  return (
    <div className="min-h-screen bg-[#050608] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Layered animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Moving gradient mesh */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 60% at 20% 80%, rgba(30,64,175,0.12) 0%, transparent 50%), radial-gradient(ellipse 60% 80% at 80% 20%, rgba(99,102,241,0.08) 0%, transparent 50%), radial-gradient(ellipse 50% 50% at 50% 50%, rgba(6,182,212,0.05) 0%, transparent 60%)',
          animation: 'bgShift 20s ease-in-out infinite alternate',
        }} />

        {/* Hex grid pattern */}
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%233b82f6' fill-opacity='1'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        {/* Floating orbs */}
        <div className="absolute w-[500px] h-[500px] rounded-full top-[-15%] left-[-5%] blur-[100px]"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)', animation: 'orbFloat1 15s ease-in-out infinite' }} />
        <div className="absolute w-[400px] h-[400px] rounded-full bottom-[-10%] right-[-5%] blur-[80px]"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', animation: 'orbFloat2 18s ease-in-out infinite' }} />
        <div className="absolute w-[300px] h-[300px] rounded-full top-[30%] right-[15%] blur-[60px]"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)', animation: 'orbFloat3 12s ease-in-out infinite' }} />

        {/* Sparkle particles */}
        {Array.from({ length: 50 }, (_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              background: i % 3 === 0
                ? `rgba(59,130,246,${0.15 + Math.random() * 0.3})`
                : i % 3 === 1
                  ? `rgba(139,92,246,${0.1 + Math.random() * 0.2})`
                  : `rgba(255,255,255,${0.05 + Math.random() * 0.15})`,
              animation: `dust-float ${5 + Math.random() * 8}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 10}s`,
            }}
          />
        ))}

        {/* Horizontal light streak */}
        <div className="absolute top-[45%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/10 to-transparent" />
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-2xl">
        <div className="relative rounded-3xl overflow-hidden">
          {/* Card border glow */}
          <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-b from-blue-500/20 via-white/[0.06] to-blue-500/10" />

          <div className="relative bg-[#0a0d14]/95 backdrop-blur-3xl rounded-3xl p-8 md:p-12">
            {/* Inner top light */}
            <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
            {/* Corner accents */}
            <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-blue-500/20 rounded-tl-xl" />
            <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-blue-500/20 rounded-tr-xl" />
            <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-blue-500/20 rounded-bl-xl" />
            <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-blue-500/20 rounded-br-xl" />

            {/* Waiting for opponent */}
            {waiting && roomCode ? (
              <div className="text-center py-4">
                <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-[0.1em]">
                  <span className="text-blue-400">OUT</span><span className="text-white/90">RANK</span>
                </h1>
                <div className="w-16 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400 mx-auto mb-8 rounded-full" />
                <p className="text-white/40 mb-6 text-sm">Share this room code with your opponent</p>
                <button
                  onClick={handleCopyCode}
                  className="relative w-full text-4xl font-mono font-bold text-blue-400 tracking-[0.3em]
                    bg-blue-500/5 py-5 rounded-2xl border border-blue-500/20
                    hover:border-blue-400/50 hover:bg-blue-500/10 transition-all cursor-pointer group"
                >
                  {roomCode}
                  <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-xs tracking-normal transition-all ${
                    copied ? 'text-green-400 opacity-100' : 'text-white/30 opacity-0 group-hover:opacity-100'
                  }`}>
                    {copied ? '✓ Copied!' : 'Copy'}
                  </span>
                </button>
                <div className="flex items-center justify-center gap-3 mt-6">
                  <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
                  <span className="text-white/40 text-sm animate-pulse">Waiting for opponent...</span>
                </div>
                <p className="text-white/20 text-xs mt-3">
                  Playing as {nickname || `Player ${playerNumber}`}
                </p>
              </div>
            ) : mode === 'join' ? (
              /* Join form */
              <div className="py-4">
                <button
                  onClick={() => setMode('menu')}
                  className="text-sm text-white/30 hover:text-blue-400 transition-colors mb-8 flex items-center gap-1.5 group"
                >
                  <span className="group-hover:-translate-x-1 transition-transform">←</span> Back
                </button>
                <div className="text-center mb-8">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                    <span className="text-xl">⚔️</span>
                  </div>
                  <h2 className="text-3xl font-black text-white mb-2">Join Game</h2>
                  <p className="text-white/30 text-sm">Enter the 6-character room code</p>
                </div>
                <input
                  type="text"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="• • • • • •"
                  maxLength={6}
                  className="w-full px-4 py-5 bg-white/[0.03] border-2 border-white/[0.06] rounded-2xl
                    text-center text-3xl font-mono tracking-[0.5em] text-white
                    focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10
                    placeholder:text-white/10 placeholder:tracking-[0.5em]
                    transition-all duration-300"
                />
                <button
                  onClick={() => onJoinGame(joinCode, nickname || 'Player 2')}
                  disabled={joinCode.length !== 6}
                  className="w-full mt-4 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-2xl
                    font-bold text-lg transition-all disabled:opacity-15
                    disabled:cursor-not-allowed text-white
                    hover:shadow-xl hover:shadow-blue-600/20
                    active:scale-[0.99]"
                >
                  Join Game →
                </button>
              </div>
            ) : (
              /* Main Menu */
              <>
                {/* Logo Section */}
                <div className="text-center mb-10">
                  {/* Animated logo icon */}
                  <div className="relative inline-block mb-5">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-blue-500/25 relative overflow-hidden">
                      <span className="text-4xl relative z-10">⚔️</span>
                      <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent" />
                    </div>
                    {/* Glow ring */}
                    <div className="absolute -inset-2 rounded-3xl bg-blue-500/10 blur-xl -z-10 animate-pulse" />
                  </div>

                  <h1 className="text-5xl md:text-7xl font-black text-white mb-1 tracking-[0.06em] leading-none">
                    <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-300 bg-clip-text text-transparent">OUT</span><span className="text-white/95">RANK</span>
                  </h1>
                  <div className="flex items-center justify-center gap-3 mt-3 mb-2">
                    <div className="h-px flex-1 max-w-[60px] bg-gradient-to-r from-transparent to-blue-500/30" />
                    <p className="text-white/30 text-sm tracking-[0.2em] uppercase font-medium">
                      Strategy &middot; Deception &middot; War
                    </p>
                    <div className="h-px flex-1 max-w-[60px] bg-gradient-to-l from-transparent to-blue-500/30" />
                  </div>
                </div>

                {/* Nickname Input */}
                <div className="mb-8">
                  <label className="block text-white/40 text-[11px] font-bold uppercase tracking-[0.15em] mb-2.5 ml-1">
                    Commander Name
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={nickname}
                      onChange={e => setNickname(e.target.value.slice(0, 20))}
                      placeholder="Enter your name..."
                      maxLength={20}
                      className="w-full bg-white/[0.03] border-2 border-white/[0.06] text-white placeholder:text-white/15
                        focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10 h-14 text-lg px-5 pr-12
                        transition-all duration-300 rounded-2xl focus:outline-none
                        group-hover:border-white/10"
                    />
                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${
                      nickname ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                    }`}>
                      <div className="w-3 h-3 rounded-full bg-green-400 shadow-lg shadow-green-400/50" />
                    </div>
                  </div>
                </div>

                {/* Theme Selection */}
                <div className="mb-10">
                  <label className="block text-white/40 text-[11px] font-bold uppercase tracking-[0.15em] mb-4 ml-1">
                    Choose Your Faction
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {THEMES.map(t => {
                      const isSelected = selectedTheme === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setSelectedTheme(t.id)}
                          className={`
                            relative rounded-2xl transition-all duration-300 group overflow-hidden
                            ${isSelected
                              ? 'ring-2 ring-blue-500/70 shadow-xl shadow-blue-500/15 scale-[1.02]'
                              : 'ring-1 ring-white/[0.06] hover:ring-white/15 hover:scale-[1.01]'
                            }
                          `}
                        >
                          {/* Theme preview image */}
                          <div className="relative h-24 overflow-hidden">
                            <img
                              src={t.preview}
                              alt={t.name}
                              className={`w-full h-full object-cover transition-all duration-500 ${
                                isSelected ? 'scale-110 brightness-75' : 'scale-100 brightness-50 group-hover:brightness-[0.6] group-hover:scale-105'
                              }`}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d14] via-[#0a0d14]/60 to-transparent" />

                            {/* Icon overlay */}
                            <div className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all ${
                              isSelected ? 'bg-blue-500 shadow-md shadow-blue-500/40' : 'bg-black/40 backdrop-blur-sm'
                            }`}>
                              {t.icon}
                            </div>
                          </div>

                          {/* Theme info */}
                          <div className={`px-3 pb-3 pt-1 ${isSelected ? 'bg-blue-500/5' : 'bg-transparent'}`}>
                            <h3 className={`font-bold text-sm tracking-wide ${isSelected ? 'text-blue-300' : 'text-white/50'}`}>
                              {t.name}
                            </h3>
                            <p className="text-[10px] text-white/20 mt-0.5">{t.desc}</p>
                          </div>

                          {/* Check badge */}
                          {isSelected && (
                            <div className="absolute top-2.5 left-2.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
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
                      className="w-full h-[52px] bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500
                        hover:from-blue-500 hover:via-blue-400 hover:to-indigo-400
                        text-white font-bold text-base rounded-2xl
                        transition-all duration-300 hover:shadow-2xl hover:shadow-blue-600/20
                        active:scale-[0.99] flex items-center justify-center gap-3
                        relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      <span className="text-lg opacity-80">🤖</span>
                      <span className="relative">Play vs Bot</span>
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => onCreateGame(nickname || 'Player 1', selectedTheme)}
                      className="h-11 bg-white/[0.03] border border-white/[0.08] text-white/60 hover:bg-white/[0.06]
                        hover:border-white/15 hover:text-white transition-all duration-200 rounded-xl font-medium text-sm
                        flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      <span className="opacity-50 text-xs">👥</span> Create Room
                    </button>
                    <button
                      onClick={() => setMode('join')}
                      className="h-11 bg-white/[0.03] border border-white/[0.08] text-white/60 hover:bg-white/[0.06]
                        hover:border-white/15 hover:text-white transition-all duration-200 rounded-xl font-medium text-sm
                        flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      <span className="opacity-50 text-xs">⚔️</span> Join Game
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 mt-8">
                  <div className="w-1 h-1 rounded-full bg-white/10" />
                  <p className="text-white/15 text-[10px] tracking-[0.15em] uppercase">
                    No account required
                  </p>
                  <div className="w-1 h-1 rounded-full bg-white/10" />
                </div>
              </>
            )}
          </div>
        </div>
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
