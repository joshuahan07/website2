'use client';

import { PlayerNumber } from '@/types/game';
import { useTheme } from '@/lib/ThemeContext';
import { ThemeId } from '@/lib/themes';

interface GameOverModalProps {
  winner: PlayerNumber;
  myPlayer: PlayerNumber;
  reason: string;
  onPlayAgain: () => void;
  moveCount?: number;
  capturedMine?: number;
  capturedTheirs?: number;
}

interface ThemeVisuals {
  winIcon: string;
  loseIcon: string;
  winClass: string;
  loseClass: string;
}

function getThemeVisuals(themeId: ThemeId): ThemeVisuals {
  switch (themeId) {
    case 'kingdom':
      return { winIcon: '\u{1F451}', loseIcon: '\u{1F3DA}\uFE0F', winClass: 'banner-unfurl', loseClass: 'crumble' };
    case 'pirate':
      return { winIcon: '\u{1F4B0}', loseIcon: '\u{1F6A2}', winClass: 'chest-open', loseClass: '' };
    case 'greek':
      return { winIcon: '\u26A1', loseIcon: '\u{1F3DB}\uFE0F', winClass: '', loseClass: 'columns-collapse' };
    default:
      return { winIcon: '\u{1F3C6}', loseIcon: '\u{1F480}', winClass: '', loseClass: '' };
  }
}

function getThemedBackground(themeId: ThemeId, isWinner: boolean): string {
  if (isWinner) {
    switch (themeId) {
      case 'kingdom':
        return 'radial-gradient(ellipse at center, rgba(234,179,8,0.15) 0%, transparent 70%)';
      case 'pirate':
        return 'radial-gradient(ellipse at center, rgba(234,179,8,0.2) 0%, transparent 70%)';
      case 'greek':
        return 'radial-gradient(ellipse at center, rgba(234,179,8,0.2) 0%, rgba(59,130,246,0.05) 50%, transparent 70%)';
      default:
        return 'none';
    }
  } else {
    switch (themeId) {
      case 'kingdom':
        return 'radial-gradient(ellipse at center, rgba(127,29,29,0.15) 0%, transparent 70%)';
      case 'pirate':
        return 'radial-gradient(ellipse at center, rgba(30,58,138,0.15) 0%, transparent 70%)';
      case 'greek':
        return 'radial-gradient(ellipse at center, rgba(127,29,29,0.1) 0%, transparent 70%)';
      default:
        return 'none';
    }
  }
}

function ConfettiPieces() {
  const colors = ['#fbbf24', '#22c55e', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'];
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    left: `${Math.random() * 100}%`,
    color: colors[i % colors.length],
    delay: `${(Math.random() * 2).toFixed(2)}s`,
    duration: `${(2 + Math.random() * 3).toFixed(2)}s`,
    size: `${6 + Math.random() * 6}px`,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pieces.map((p, i) => (
        <div
          key={i}
          className="confetti-piece"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
}

export default function GameOverModal({
  winner, myPlayer, reason, onPlayAgain,
  moveCount, capturedMine, capturedTheirs,
}: GameOverModalProps) {
  const isWinner = winner === myPlayer;
  const { theme } = useTheme();
  const visuals = getThemeVisuals(theme.id);
  const themeClass = isWinner ? visuals.winClass : visuals.loseClass;
  const bgGradient = getThemedBackground(theme.id, isWinner);

  // Pirate lose: inline sinking animation
  const pirateLoseStyle = (!isWinner && theme.id === 'pirate') ? {
    animation: 'pirate-sink 3s ease-in forwards',
  } : {};

  // Pirate win: golden glow effect
  const pirateWinGlow = (isWinner && theme.id === 'pirate') ? {
    boxShadow: '0 0 40px rgba(234,179,8,0.3), 0 0 80px rgba(234,179,8,0.15)',
  } : {};

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm"
      style={{ backgroundImage: bgGradient }}
    >
      {isWinner && <ConfettiPieces />}

      <div
        className={`
          animate-scale-in bg-stone-900 border-2 rounded-xl p-8 max-w-md w-full mx-4 text-center shadow-2xl relative
          ${isWinner ? 'border-green-500 shadow-green-500/20' : 'border-red-500 shadow-red-500/20'}
          ${themeClass}
        `}
        style={{ ...pirateLoseStyle, ...pirateWinGlow }}
      >
        <h2 className={`text-5xl font-black mb-2 tracking-wider text-glow ${
          isWinner ? 'text-green-400' : 'text-red-400'
        }`}>
          {isWinner ? theme.flavor.win : theme.flavor.lose}
        </h2>

        <p className="text-gray-400 mb-6 text-sm">{reason}</p>

        <div className={`text-6xl mb-6 ${isWinner ? 'animate-bounce' : ''}`}>
          {isWinner ? visuals.winIcon : visuals.loseIcon}
        </div>

        {/* Greek win: golden radial gradient overlay */}
        {isWinner && theme.id === 'greek' && (
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 50% 30%, rgba(234,179,8,0.15) 0%, transparent 60%)',
            }}
          />
        )}

        {(moveCount !== undefined || capturedMine !== undefined || capturedTheirs !== undefined) && (
          <div className="flex justify-center gap-6 mb-6 text-sm">
            {moveCount !== undefined && (
              <div className="text-center">
                <div className="text-xl font-bold text-amber-400">{moveCount}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider">Moves</div>
              </div>
            )}
            {capturedTheirs !== undefined && (
              <div className="text-center">
                <div className="text-xl font-bold text-green-400">{capturedTheirs}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider">Captured</div>
              </div>
            )}
            {capturedMine !== undefined && (
              <div className="text-center">
                <div className="text-xl font-bold text-red-400">{capturedMine}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider">Lost</div>
              </div>
            )}
          </div>
        )}

        <button
          onClick={onPlayAgain}
          className="px-8 py-3 bg-amber-600 hover:bg-amber-500 rounded-lg
            font-bold text-lg transition-all hover:scale-105 text-white
            shadow-lg shadow-amber-600/20"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
