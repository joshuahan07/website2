'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ClientPiece, Rank } from '@/types/game';
import { RANK_DISPLAY } from '@/lib/pieces';
import { useTheme } from '@/lib/ThemeContext';
import { getPieceCrop } from '@/lib/pieceCrops';

interface PieceProps {
  piece: ClientPiece;
  isOwn: boolean;
  isSelected?: boolean;
  revealing?: boolean;
}

export default function Piece({ piece, isOwn, isSelected, revealing }: PieceProps) {
  const { theme } = useTheme();
  const [imgFailed, setImgFailed] = useState(false);

  const isRevealed = !isOwn && 'rank' in piece && piece.rank !== undefined;
  const rank = (isOwn || isRevealed) ? (piece as { rank: Rank }).rank : undefined;
  const display = rank ? RANK_DISPLAY[rank] : null;
  const themeEmoji = rank ? theme.pieceEmojis[rank] : undefined;
  const pieceImage = rank ? theme.pieceImages[rank] : undefined;

  const isIdle = !isSelected && !revealing;
  const isOwnFlag = isOwn && rank === 'F';
  const isOwnBomb = isOwn && rank === 'B';

  // Crop settings per piece
  const crop = pieceImage ? getPieceCrop(theme.id, pieceImage) : { scale: 1.15, offsetX: 0, offsetY: 0 };
  const pieceScale = crop.scale;
  const pieceOffsetX = crop.offsetX;
  const pieceOffsetY = crop.offsetY;

  // Ring color
  const ringColor = isOwn
    ? isOwnFlag
      ? 'ring-amber-400 ring-[3px]'
      : isOwnBomb
        ? 'ring-red-500 ring-[3px]'
        : 'ring-blue-400/60'
    : 'ring-red-600';

  // Background
  const bgClass = isOwn
    ? isOwnFlag
      ? 'bg-gradient-to-br from-amber-800 to-amber-950 flag-glow'
      : isOwnBomb
        ? 'bg-gradient-to-br from-red-900 to-red-950 bomb-glow'
        : 'bg-gradient-to-br from-stone-800 to-stone-950'
    : 'bg-black';

  // Tooltip for special pieces (own only)
  const getTooltip = (): string | null => {
    if (!isOwn || !rank) return null;
    switch (rank) {
      case '0': return `${theme.pieceNames['0']} (Spy) — Kills ${theme.pieceNames['10']} when attacking first. Dies to everything else.`;
      case '1': return `${theme.pieceNames['1']} (Spotter) — Predict the enemy directly ahead to destroy it.`;
      case '2': return `${theme.pieceNames['2']} (Scout) — Moves any number of squares in a straight line.`;
      case '3': return `${theme.pieceNames['3']} (Miner) — Only piece that can defuse ${theme.pieceNames['B']}s.`;
      case 'B': return `${theme.pieceNames['B']} (Bomb) — Immovable. Destroys attackers except ${theme.pieceNames['3']}.`;
      case 'F': return `${theme.pieceNames['F']} (Flag) — Immovable. If captured, you lose!`;
      default: return `${theme.pieceNames[rank]} — Rank ${rank}`;
    }
  };

  const tooltip = getTooltip();

  return (
    <div className="w-full h-full flex items-center justify-center select-none relative p-[3px] group/piece"
      title={tooltip || undefined}>
      {/* Circular piece container */}
      <div
        className={`
          w-full h-full rounded-full flex items-center justify-center
          relative overflow-hidden ring-2 transition-all duration-200
          ${ringColor} ${bgClass}
          ${isSelected ? 'piece-selected !ring-yellow-400 !ring-[3px]' : ''}
          ${revealing ? 'animate-pulse !ring-white !ring-[3px] scale-110 z-20' : ''}
          ${isIdle ? 'piece-idle' : ''}
          ${isIdle && isOwn ? 'hover:brightness-125 hover:scale-105' : ''}
          shadow-lg
        `}
      >
        {isOwn && rank && display ? (
          /* OWN PIECE: show full image */
          <>
            {pieceImage && !imgFailed ? (
              <div className="w-full h-full relative">
                <Image
                  src={pieceImage}
                  alt={display.symbol}
                  fill
                  className="object-cover drop-shadow-md"
                  style={{ transform: `scale(${pieceScale}) translate(${pieceOffsetX}%, ${pieceOffsetY}%)` }}
                  onError={() => setImgFailed(true)}
                  sizes="64px"
                />
              </div>
            ) : (
              <span className="text-sm sm:text-base font-bold leading-none drop-shadow-md"
                style={{ color: display.color }}>
                {themeEmoji || display.symbol}
              </span>
            )}
          </>
        ) : isRevealed && rank && display ? (
          /* REVEALED ENEMY: black circle with rank number/emoji */
          <span className="text-sm sm:text-lg font-black leading-none drop-shadow-md"
            style={{ color: display.color }}>
            {display.symbol}
          </span>
        ) : (
          /* HIDDEN ENEMY: black circle with red ? */
          <span className="text-lg font-black text-red-400">?</span>
        )}
      </div>

      {/* Rank badge - top right corner (own pieces only) */}
      {isOwn && rank && display && (
        <span className="absolute -top-0.5 -right-0.5 z-10 bg-stone-900/90 rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center border border-stone-600 text-[9px] sm:text-[11px] font-black text-white drop-shadow">
          {display.symbol}
        </span>
      )}
    </div>
  );
}
