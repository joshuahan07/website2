'use client';

import { useEffect } from 'react';
import { PlayerNumber } from '@/types/game';
import { useTheme } from '@/lib/ThemeContext';
import { SFX } from '@/lib/sounds';
import { getPieceCrop } from '@/lib/pieceCrops';

interface GameOverModalProps {
  winner: PlayerNumber;
  myPlayer: PlayerNumber;
  reason: string;
  onPlayAgain: () => void;
  onRematch?: () => void;
  onRevealBoard?: () => void;
  boardRevealed?: boolean;
  moveCount?: number;
  capturedMine?: number;
  capturedTheirs?: number;
  gameDuration?: number;
}

export default function GameOverModal({
  winner, myPlayer, reason, onPlayAgain, onRematch, onRevealBoard, boardRevealed,
  moveCount, capturedMine, capturedTheirs, gameDuration,
}: GameOverModalProps) {
  const isWinner = winner === myPlayer;
  const { theme } = useTheme();

  // Play sound on mount
  useEffect(() => {
    if (isWinner) SFX.victory();
    else SFX.defeat();
  }, [isWinner]);

  const formatTime = (ms?: number) => {
    if (!ms) return null;
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Theme-specific piece to show
  const heroRank = isWinner ? '10' : 'F';
  const heroImage = theme.pieceImages[heroRank];
  const heroCrop = heroImage ? getPieceCrop(theme.id, heroImage) : null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Background */}
      <div className={`absolute inset-0 backdrop-blur-md ${isWinner ? 'bg-black/70' : 'bg-black/80'}`} />

      {/* Radial glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`w-[500px] h-[500px] rounded-full blur-[100px] ${
          isWinner ? 'bg-amber-500/15' : 'bg-red-500/10'
        }`} />
      </div>

      {/* Confetti for winner */}
      {isWinner && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 40 }, (_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                width: `${5 + Math.random() * 7}px`,
                height: `${5 + Math.random() * 7}px`,
                backgroundColor: ['#fbbf24', '#22c55e', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'][i % 6],
                animationDelay: `${(Math.random() * 2).toFixed(2)}s`,
                animationDuration: `${(2 + Math.random() * 3).toFixed(2)}s`,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              }}
            />
          ))}
        </div>
      )}

      {/* Main card */}
      <div className="relative max-w-md w-full mx-4 animate-scale-in">
        <div className={`relative rounded-3xl overflow-hidden border shadow-2xl ${
          isWinner
            ? 'border-amber-500/30 shadow-amber-500/10'
            : 'border-red-500/20 shadow-red-500/10'
        }`}>
          <div className="absolute inset-0 bg-[#0a0d14]/95 backdrop-blur-xl" />
          <div className={`absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent ${
            isWinner ? 'via-amber-400/40' : 'via-red-400/30'
          } to-transparent`} />

          <div className="relative p-8">
            {/* Hero piece */}
            <div className="flex justify-center mb-4">
              <div className={`w-24 h-24 rounded-full overflow-hidden ring-[3px] ${
                isWinner ? 'ring-amber-400/70' : 'ring-red-500/50'
              }`} style={{
                boxShadow: isWinner
                  ? '0 0 30px rgba(251,191,36,0.3), 0 0 60px rgba(251,191,36,0.1)'
                  : '0 0 20px rgba(239,68,68,0.2)',
              }}>
                {heroImage ? (
                  <img src={heroImage} alt="" className="w-full h-full object-cover"
                    style={heroCrop ? { transform: `scale(${heroCrop.scale}) translate(${heroCrop.offsetX}%, ${heroCrop.offsetY}%)` } : undefined} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-stone-900 text-4xl">
                    {isWinner ? '👑' : '💀'}
                  </div>
                )}
              </div>
            </div>

            {/* Title */}
            <h2 className={`text-4xl font-black mb-1 tracking-wide text-center ${
              isWinner ? 'text-amber-400' : 'text-red-400'
            }`}>
              {isWinner ? 'VICTORY' : 'DEFEAT'}
            </h2>
            <p className={`text-center text-sm mb-1 ${isWinner ? 'text-amber-300/60' : 'text-red-300/50'}`}>
              {isWinner ? theme.flavor.win : theme.flavor.lose}
            </p>
            <p className="text-center text-xs text-white/30 mb-6">{reason}</p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {moveCount !== undefined && (
                <div className="bg-white/[0.03] rounded-2xl p-3 text-center border border-white/[0.06]">
                  <div className="text-2xl font-black text-white">{moveCount}</div>
                  <div className="text-[9px] text-white/30 uppercase tracking-wider mt-0.5">Moves</div>
                </div>
              )}
              {capturedTheirs !== undefined && (
                <div className="bg-white/[0.03] rounded-2xl p-3 text-center border border-white/[0.06]">
                  <div className="text-2xl font-black text-green-400">{capturedTheirs}</div>
                  <div className="text-[9px] text-white/30 uppercase tracking-wider mt-0.5">Captured</div>
                </div>
              )}
              {capturedMine !== undefined && (
                <div className="bg-white/[0.03] rounded-2xl p-3 text-center border border-white/[0.06]">
                  <div className="text-2xl font-black text-red-400">{capturedMine}</div>
                  <div className="text-[9px] text-white/30 uppercase tracking-wider mt-0.5">Lost</div>
                </div>
              )}
            </div>

            {gameDuration && (
              <p className="text-center text-xs text-white/20 mb-4">
                Game duration: {formatTime(gameDuration)}
              </p>
            )}

            {/* Buttons */}
            <div className="space-y-2">
              {onRematch && (
                <button
                  onClick={onRematch}
                  className={`w-full py-3.5 rounded-2xl font-bold text-base transition-all active:scale-[0.99] ${
                    isWinner
                      ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white hover:shadow-xl hover:shadow-amber-500/20'
                      : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white hover:shadow-xl hover:shadow-blue-500/20'
                  }`}
                >
                  Rematch
                </button>
              )}
              <button
                onClick={onPlayAgain}
                className="w-full py-3 rounded-2xl font-semibold text-sm bg-white/[0.04] border border-white/[0.08]
                  text-white/60 hover:bg-white/[0.08] hover:text-white transition-all active:scale-[0.99]"
              >
                Back to Lobby
              </button>
              {onRevealBoard && (
                <button
                  onClick={onRevealBoard}
                  className={`w-full py-2.5 rounded-2xl font-semibold text-xs transition-all active:scale-[0.99] ${
                    boardRevealed
                      ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                      : 'bg-white/[0.04] border border-white/[0.08] text-white/40 hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  {boardRevealed ? '👁️ Board Revealed' : '👁️ Reveal Full Board'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
