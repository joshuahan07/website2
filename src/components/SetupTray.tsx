'use client';

import { useState } from 'react';
import { Rank } from '@/types/game';
import { PIECE_DEFINITIONS, RANK_DISPLAY } from '@/lib/pieces';
import { useTheme } from '@/lib/ThemeContext';
import { getPieceCrop } from '@/lib/pieceCrops';

interface SetupTrayProps {
  selectedRank: Rank | null;
  onSelectRank: (rank: Rank | null) => void;
  placedCounts: Record<string, number>;
  isReady: boolean;
}

const SORTED_RANKS: Rank[] = ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1', '0', 'B', 'F'];

export default function SetupTray({
  selectedRank,
  onSelectRank,
  placedCounts,
  isReady,
}: SetupTrayProps) {
  const { theme } = useTheme();
  const [failedImgs, setFailedImgs] = useState<Set<string>>(new Set());
  const defByRank = new Map(PIECE_DEFINITIONS.map(d => [d.rank, d]));

  return (
    <div className="grid grid-cols-7 gap-2">
      {SORTED_RANKS.map(rank => {
        const def = defByRank.get(rank)!;
        const placed = placedCounts[rank] ?? 0;
        const remaining = def.quantity - placed;
        const display = RANK_DISPLAY[rank];
        const imgSrc = theme.pieceImages[rank];
        const isActive = selectedRank === rank;
        const fullyPlaced = remaining === 0;
        const rankLabel = rank === '0' ? 'Spy' : rank === 'B' ? 'Bomb' : rank === 'F' ? 'Flag' : rank;

        return (
          <button
            key={rank}
            type="button"
            onClick={() => onSelectRank(isActive ? null : rank)}
            disabled={isReady}
            className={`
              relative flex flex-col items-center p-1.5 rounded-xl
              transition-all duration-150 select-none
              ${isReady ? 'opacity-40 cursor-not-allowed' : fullyPlaced ? 'opacity-30' : 'cursor-pointer hover:bg-stone-700/60'}
              ${isActive ? 'ring-2 ring-amber-400 bg-amber-900/30 scale-105' : 'bg-stone-800/40'}
            `}
          >
            {/* Count badge - top right */}
            <span className={`absolute -top-1 -right-1 text-[9px] font-bold tabular-nums px-1.5 py-0.5 rounded-full z-10 ${
              fullyPlaced
                ? 'bg-green-600 text-white'
                : isActive
                  ? 'bg-amber-600 text-white'
                  : 'bg-stone-700 text-stone-300'
            }`}>
              {remaining}/{def.quantity}
            </span>

            {/* Circular piece image */}
            <div className={`w-14 h-14 rounded-full overflow-hidden flex items-center justify-center
              ${isActive ? 'ring-2 ring-amber-400/50' : 'ring-1 ring-stone-600/50'}
              bg-stone-900
            `}>
              {imgSrc && !failedImgs.has(rank) ? (
                <img
                  src={imgSrc}
                  alt={theme.pieceNames[rank]}
                  className="w-full h-full object-cover"
                  style={{ transform: `scale(${getPieceCrop(theme.id, imgSrc || '').scale}) translate(${getPieceCrop(theme.id, imgSrc || '').offsetX}%, ${getPieceCrop(theme.id, imgSrc || '').offsetY}%)` }}
                  onError={() => setFailedImgs(prev => new Set(prev).add(rank))}
                />
              ) : (
                <span className="text-xl font-bold" style={{ color: display.color }}>
                  {theme.pieceEmojis[rank]}
                </span>
              )}
            </div>

            {/* Rank label */}
            <span className="text-[11px] font-black leading-none mt-1" style={{ color: display.color }}>
              {rankLabel}
            </span>

            {/* Checkmark overlay */}
            {fullyPlaced && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
                <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
