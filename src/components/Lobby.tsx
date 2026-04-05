'use client';

import { useState, useCallback, useEffect } from 'react';
import { getPieceCrop } from '@/lib/pieceCrops';

interface LobbyProps {
  onCreateGame: (nickname: string, theme: string) => void;
  onJoinGame: (code: string, nickname: string) => void;
  onPlayBot?: (nickname: string) => void;
  roomCode: string | null;
  playerNumber: number | null;
  waiting: boolean;
  error: string | null;
  connecting?: boolean;
}

const THEMES = [
  {
    id: 'kingdom', name: 'Kingdom', desc: 'Command medieval armies through castle sieges',
    icon: '👑', preview: '/images/kingdom-bg.png',
    pieces: ['king', 'queen', 'prince'],
    color: 'from-amber-500/20 to-amber-900/20',
    accent: '#f59e0b',
  },
  {
    id: 'pirate', name: 'Pirate', desc: 'Rule the seas with cunning and firepower',
    icon: '⚓', preview: '/images/pirate-bg.png',
    pieces: ['kraken', 'pirate-king', 'megalodon'],
    color: 'from-cyan-500/20 to-cyan-900/20',
    accent: '#06b6d4',
  },
  {
    id: 'greek', name: 'Greek', desc: 'Wield the power of gods and titans',
    icon: '⚡', preview: '/images/greek-bg.png',
    pieces: ['zeus', 'poseidon', 'hades'],
    color: 'from-purple-500/20 to-purple-900/20',
    accent: '#a855f7',
  },
];

const FEATURES = [
  { icon: '🎭', title: '30 Hidden Pieces', desc: 'Your army is invisible to your opponent' },
  { icon: '⚔️', title: 'Strategic Combat', desc: 'Higher rank wins — but you never know what you face' },
  { icon: '🎯', title: 'Special Abilities', desc: 'Spies, Scouts, Miners & Spotters with unique powers' },
];

export default function Lobby({
  onCreateGame, onJoinGame, onPlayBot, roomCode, playerNumber, waiting, error, connecting,
}: LobbyProps) {
  const [nickname, setNickname] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState<'menu' | 'join'>('menu');
  const [selectedTheme, setSelectedTheme] = useState('kingdom');
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleCopyCode = useCallback(() => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }, [roomCode]);

  const currentTheme = THEMES.find(t => t.id === selectedTheme)!;

  return (
    <div className="min-h-screen bg-[#020308] text-white relative overflow-hidden">
      {/* === LAYERED BACKGROUND === */}
      {/* All theme images stacked, only selected one is visible - smooth crossfade */}
      {THEMES.map(t => {
        const bgScale = t.id === 'kingdom' ? 1.1 : 1.05;
        return (
          <div key={t.id} className="fixed inset-0 transition-opacity duration-[1200ms] ease-in-out"
            style={{
              backgroundImage: `url(${t.preview})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
              opacity: selectedTheme === t.id ? 1 : 0,
              transform: `scale(${bgScale})`,
            }} />
        );
      })}
      {/* Cinematic overlays - lighter so image is more visible */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#020308]/30 via-[#020308]/50 to-[#020308]/90" />
      <div className="fixed inset-0 bg-gradient-to-r from-[#020308]/30 via-transparent to-[#020308]/30" />
      {/* Subtle scanline */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.008]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px)',
      }} />
      {/* Particles */}
      <div className="fixed inset-0 pointer-events-none">
        {mounted && Array.from({ length: 40 }, (_, i) => (
          <div key={i} className="absolute rounded-full" style={{
            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
            width: `${1 + Math.random() * 2}px`, height: `${1 + Math.random() * 2}px`,
            background: i % 3 === 0 ? `rgba(59,130,246,${0.15 + Math.random() * 0.25})`
              : i % 3 === 1 ? `rgba(168,85,247,${0.1 + Math.random() * 0.15})`
              : `rgba(255,255,255,${0.03 + Math.random() * 0.08})`,
            animation: `dust-float ${6 + Math.random() * 10}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 10}s`,
          }} />
        ))}
      </div>

      {/* === CONTENT === */}
      <div className="relative z-10 min-h-screen">

        {/* Connecting */}
        {connecting ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 relative">
                <div className="absolute inset-0 rounded-2xl bg-blue-500/20 animate-ping" />
                <div className="relative w-full h-full rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                  <span className="text-2xl">⚔️</span>
                </div>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Connecting to server...</h2>
              <p className="text-white/30 text-sm">Waking up the battlefield</p>
              <div className="w-48 h-1 bg-white/5 rounded-full mx-auto mt-6 overflow-hidden">
                <div className="h-full bg-blue-500/50 rounded-full" style={{ animation: 'loadBar 2s ease-in-out infinite' }} />
              </div>
            </div>
          </div>

        ) : waiting && roomCode ? (
          /* Waiting for opponent */
          <div className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-md text-center">
              <h1 className="text-5xl font-black mb-2 tracking-[0.08em]">
                <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">OUT</span>RANK
              </h1>
              <div className="w-12 h-0.5 bg-blue-500/50 mx-auto mb-8 rounded-full" />
              <p className="text-white/40 mb-5 text-sm">Share this code with your opponent</p>
              <button onClick={handleCopyCode}
                className="relative w-full text-4xl font-mono font-black text-blue-400 tracking-[0.4em]
                  bg-white/[0.03] py-6 rounded-2xl border border-white/10
                  hover:border-blue-500/40 hover:bg-white/[0.05] transition-all cursor-pointer group">
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
              <p className="text-white/15 text-xs mt-3">Playing as {nickname || `Player ${playerNumber}`}</p>
            </div>
          </div>

        ) : mode === 'join' ? (
          /* Join form */
          <div className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-md">
              <button onClick={() => setMode('menu')}
                className="text-white/25 hover:text-blue-400 transition-colors mb-10 flex items-center gap-1.5 text-sm group">
                <span className="group-hover:-translate-x-1 transition-transform">←</span> Back
              </button>
              <div className="text-center mb-10">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <span className="text-2xl">⚔️</span>
                </div>
                <h2 className="text-4xl font-black mb-2">Join Game</h2>
                <p className="text-white/25 text-sm">Enter the 6-character room code</p>
              </div>
              <input type="text" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="• • • • • •" maxLength={6}
                className="w-full px-4 py-6 bg-white/[0.04] border border-white/[0.08] rounded-2xl
                  text-center text-4xl font-mono tracking-[0.5em] text-white
                  focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10
                  placeholder:text-white/10 placeholder:tracking-[0.5em] placeholder:text-2xl transition-all duration-300" />
              <button onClick={() => onJoinGame(joinCode, nickname || 'Player 2')} disabled={joinCode.length !== 6}
                className="w-full mt-5 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold text-lg transition-all
                  disabled:opacity-15 disabled:cursor-not-allowed text-white hover:shadow-xl hover:shadow-blue-500/20 active:scale-[0.99]">
                Join Game →
              </button>
            </div>
          </div>

        ) : (
          /* === MAIN MENU === */
          <div className="h-screen flex flex-col overflow-hidden">

            {/* HERO SECTION */}
            <div className="flex-1 flex items-center justify-center px-6 py-4">
              <div className="w-full max-w-6xl">

                {/* Logo + Hero */}
                <div className="text-center mb-4 md:mb-6">
                  {/* Scrolling piece carousel */}
                  <div className="relative mb-4 overflow-hidden mx-auto max-w-xl">
                    <div className="flex gap-3 animate-[carouselScroll_25s_linear_infinite]"
                      style={{ width: 'max-content' }}>
                      {/* Duplicate the pieces for infinite scroll effect */}
                      {[...Array(2)].map((_, dupeIdx) => (
                        ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1', '0', 'B', 'F'].map((rank) => {
                          const imgPath = currentTheme.id === 'kingdom'
                            ? `/images/kingdom/${{'10':'king','9':'queen','8':'prince','7':'kingsguard','6':'archer','5':'swordsman','4':'jester','3':'blacksmith','2':'horseman','1':'tower-guard','0':'assassin','B':'spike-pit','F':'princess'}[rank]}.png`
                            : currentTheme.id === 'pirate'
                              ? `/images/pirate/${{'10':'kraken','9':'pirate-king','8':'megalodon','7':'shark-rider','6':'musketeer','5':'buccaneer','4':'crewmate','3':'diver','2':'parrot','1':'watchman','0':'stowaway','B':'sea-mine','F':'treasure-chest'}[rank]}.png`
                              : `/images/greek/${{'10':'zeus','9':'poseidon','8':'hades','7':'athena','6':'apollo','5':'ares','4':'centaur','3':'hephaestus','2':'pegasus','1':'oracle','0':'kronos','B':'medusa-stone','F':'pandoras-box'}[rank]}.png`;
                          const crop = getPieceCrop(currentTheme.id, imgPath.split('/').pop()!);
                          return (
                            <div key={`${dupeIdx}-${rank}`}
                              className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-white/10 flex-shrink-0 bg-stone-900">
                              <img src={imgPath} alt="" className="w-full h-full object-cover"
                                style={{ transform: `scale(${crop.scale}) translate(${crop.offsetX}%, ${crop.offsetY}%)` }} />
                            </div>
                          );
                        })
                      ))}
                    </div>
                    {/* Fade edges */}
                    <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#020308] to-transparent pointer-events-none z-10" />
                    <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#020308] to-transparent pointer-events-none z-10" />
                  </div>

                  <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-[0.02em] leading-[0.85] mb-2">
                    <span className="text-blue-200/85">OUT</span><span className="text-white">RANK</span>
                  </h1>
                  <p className="text-white/60 text-xs md:text-sm tracking-[0.2em] uppercase font-light mb-4">
                    Strategy &middot; Deception &middot; War
                  </p>

                </div>

                {/* CENTERED SINGLE COLUMN LAYOUT */}
                <div className="max-w-xl mx-auto">

                  {/* Name input - clean and prominent */}
                  <div className="relative mb-4">
                    <input type="text" value={nickname} onChange={e => setNickname(e.target.value.slice(0, 20))}
                      placeholder="Enter your name..." maxLength={20}
                      className="w-full bg-[#0d1017]/80 backdrop-blur-sm border border-white/10 text-white text-center
                        placeholder:text-white/25 focus:border-blue-400/50 focus:ring-4 focus:ring-blue-500/10
                        h-14 text-lg px-5 transition-all duration-300 rounded-2xl focus:outline-none hover:border-white/20" />
                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${
                      nickname ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}>
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-md shadow-green-400/50" />
                    </div>
                  </div>

                  {/* Faction selector - horizontal tabs */}
                  <div className="bg-[#0d1017]/60 backdrop-blur-sm rounded-2xl p-1.5 mb-4 border border-white/[0.06]">
                    <div className="grid grid-cols-3 gap-1.5">
                      {THEMES.map(t => {
                        const isSelected = selectedTheme === t.id;
                        return (
                          <button key={t.id} onClick={() => setSelectedTheme(t.id)}
                            className={`relative rounded-xl py-3.5 px-3 transition-all duration-300 ${
                              isSelected
                                ? 'bg-[#1a2035] shadow-lg'
                                : 'hover:bg-white/[0.04]'
                            }`}>
                            {/* Active indicator bar */}
                            {isSelected && (
                              <div className="absolute top-0 left-[20%] right-[20%] h-0.5 bg-blue-400 rounded-full" />
                            )}
                            <span className="text-2xl block mb-1">{t.icon}</span>
                            <h4 className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-white/50'}`}>{t.name}</h4>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action buttons - stacked, full width */}
                  <div className="space-y-3">
                    {onPlayBot && (
                      <button onClick={() => onPlayBot(nickname || 'Player 1')}
                        className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-500
                          transition-all duration-200 active:scale-[0.99]
                          hover:shadow-xl hover:shadow-blue-600/25
                          flex items-center justify-center gap-3 font-bold text-base text-white">
                        <span className="text-xl">🤖</span> Play vs Bot
                      </button>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => onCreateGame(nickname || 'Player 1', selectedTheme)}
                        className="h-12 rounded-2xl bg-[#111827] border border-white/10 text-white/80
                          hover:bg-[#1a2035] hover:border-white/20 hover:text-white transition-all duration-200
                          font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98]">
                        <span>👥</span> Create Room
                      </button>
                      <button onClick={() => setMode('join')}
                        className="h-12 rounded-2xl bg-[#111827] border border-white/10 text-white/80
                          hover:bg-[#1a2035] hover:border-white/20 hover:text-white transition-all duration-200
                          font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98]">
                        <span>⚔️</span> Join Game
                      </button>
                    </div>
                  </div>

                  {/* Footer */}
                  <p className="text-center text-white/15 text-[10px] mt-4 tracking-[0.2em] uppercase">
                    No account required
                  </p>
                </div>
              </div>
            </div>
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
