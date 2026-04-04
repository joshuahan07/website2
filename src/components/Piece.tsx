'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ClientPiece, Rank } from '@/types/game';
import { RANK_DISPLAY } from '@/lib/pieces';
import { useTheme } from '@/lib/ThemeContext';

interface PieceProps {
  piece: ClientPiece;
  isOwn: boolean;
  isSelected?: boolean;
  revealing?: boolean;
}

export default function Piece({ piece, isOwn, isSelected, revealing }: PieceProps) {
  const { theme } = useTheme();
  const [imgFailed, setImgFailed] = useState(false);
  const [enemyImgFailed, setEnemyImgFailed] = useState(false);

  const isRevealed = 'rank' in piece && piece.rank !== undefined;
  const showInfo = isOwn || isRevealed;

  const rank = showInfo ? (piece as { rank: Rank }).rank : undefined;
  const display = rank ? RANK_DISPLAY[rank] : null;
  const themeEmoji = rank ? theme.pieceEmojis[rank] : undefined;
  const pieceImage = rank ? theme.pieceImages[rank] : undefined;
  const enemyPieceImage = theme.enemyPieceImage;

  const isIdle = !isSelected && !revealing;
  const isOwnFlag = isOwn && rank === 'F';
  const isOwnBomb = isOwn && rank === 'B';

  // Ring color based on piece type
  const ringColor = isOwn
    ? isOwnFlag
      ? 'ring-amber-400 ring-[3px]'
      : isOwnBomb
        ? 'ring-red-500 ring-[3px]'
        : 'ring-blue-400/60'
    : showInfo
      ? 'ring-red-400/60'
      : 'ring-red-600';

  return (
    <div
      className={`
        w-full h-full flex items-center justify-center
        select-none relative p-[3px]
      `}
    >
      {/* Circular piece container */}
      <div
        className={`
          w-full h-full rounded-full flex items-center justify-center
          relative overflow-hidden ring-2 transition-all duration-200
          ${ringColor}
          ${isOwn
            ? isOwnFlag
              ? 'bg-gradient-to-br from-amber-800 to-amber-950 flag-glow'
              : isOwnBomb
                ? 'bg-gradient-to-br from-red-900 to-red-950 bomb-glow'
                : 'bg-gradient-to-br from-stone-800 to-stone-950'
            : showInfo
              ? 'bg-gradient-to-br from-stone-800 to-stone-950 piece-shimmer'
              : 'bg-black'
          }
          ${isSelected ? 'piece-selected !ring-yellow-400 !ring-[3px]' : ''}
          ${revealing ? 'animate-pulse !ring-white !ring-[3px] scale-110 z-20' : ''}
          ${isIdle ? 'piece-idle' : ''}
          ${isIdle && isOwn ? 'hover:brightness-125 hover:scale-105' : ''}
          shadow-lg
        `}
      >
        {showInfo && rank && display ? (
          <>
            {pieceImage && !imgFailed ? (
              <div className="w-full h-full relative">
                <Image
                  src={pieceImage}
                  alt={display.symbol}
                  fill
                  className="object-cover drop-shadow-md scale-[1.15]"
                  onError={() => setImgFailed(true)}
                  sizes="64px"
                />
              </div>
            ) : (
              <span
                className="text-sm sm:text-base font-bold leading-none drop-shadow-md"
                style={{ color: display.color }}
              >
                {themeEmoji || display.symbol}
              </span>
            )}
          </>
        ) : (
          <>
            {enemyPieceImage && !enemyImgFailed ? (
              <div className="w-full h-full relative">
                <Image
                  src={enemyPieceImage}
                  alt="Hidden piece"
                  fill
                  className="object-contain opacity-60"
                  onError={() => setEnemyImgFailed(true)}
                  sizes="64px"
                />
              </div>
            ) : (
              <span className="text-lg font-black text-red-400">?</span>
            )}
          </>
        )}
      </div>

      {/* Rank badge - top right corner outside the circle */}
      {showInfo && rank && display && isOwn && (
        <span className="absolute -top-0.5 -right-0.5 z-10 bg-stone-900/90 rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center border border-stone-600 text-[9px] sm:text-[11px] font-black text-white drop-shadow">
          {display.symbol}
        </span>
      )}
    </div>
  );
}
