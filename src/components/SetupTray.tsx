'use client';

import { useState } from 'react';
import { Rank } from '@/types/game';
import { PIECE_DEFINITIONS, RANK_DISPLAY } from '@/lib/pieces';
import { useTheme } from '@/lib/ThemeContext';

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
    <div className="grid grid-cols-7 gap-1.5">
      {SORTED_RANKS.map(rank => {
        const def = defByRank.get(rank)!;
        const placed = placedCounts[rank] ?? 0;
        const remaining = def.quantity - placed;
        const display = RANK_DISPLAY[rank];
        const imgSrc = theme.pieceImages[rank];
        const isActive = selectedRank === rank;
        const fullyPlaced = remaining === 0;

        return (
          <button
            key={rank}
            type="button"
            onClick={() => onSelectRank(isActive ? null : rank)}
            disabled={isReady}
            className={`
              relative flex flex-col items-center p-1 rounded-lg
              transition-all duration-150 select-none
              ${isReady ? 'opacity-40 cursor-not-allowed' : fullyPlaced ? 'opacity-30' : 'cursor-pointer hover:bg-stone-700/60'}
              ${isActive ? 'ring-2 ring-amber-400 bg-amber-900/30 scale-105' : 'bg-stone-800/40'}
            `}
          >
            {/* Circular piece image */}
            <div className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center
              ${isActive ? 'ring-1 ring-amber-400/50' : 'ring-1 ring-stone-600/50'}
              bg-stone-900
            `}>
              {imgSrc && !failedImgs.has(rank) ? (
                <img
                  src={imgSrc}
                  alt={theme.pieceNames[rank]}
                  className="w-full h-full object-cover"
                  onError={() => setFailedImgs(prev => new Set(prev).add(rank))}
                />
              ) : (
                <span className="text-sm font-bold" style={{ color: display.color }}>
                  {theme.pieceEmojis[rank]}
                </span>
              )}
            </div>

            {/* Count */}
            <span className={`text-[9px] font-bold tabular-nums mt-0.5 ${
              fullyPlaced ? 'text-green-400' : isActive ? 'text-amber-300' : 'text-stone-400'
            }`}>
              {remaining}/{def.quantity}
            </span>

            {/* Checkmark */}
            {fullyPlaced && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
