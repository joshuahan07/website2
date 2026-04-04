'use client';

import { useState } from 'react';
import { PlacedPiece, Rank } from '@/types/game';
import { PIECE_DEFINITIONS, RANK_DISPLAY } from '@/lib/pieces';
import { useTheme } from '@/lib/ThemeContext';
import { getPieceCrop } from '@/lib/pieceCrops';

interface CapturedPiecesProps {
  mine: PlacedPiece[];
  theirs: PlacedPiece[];
}

const SORTED_RANKS: Rank[] = ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1', '0', 'B'];

function CaptureGrid({ pieces, label, color, highlightColor }: {
  pieces: PlacedPiece[];
  label: string;
  color: string;
  highlightColor: string;
}) {
  const { theme } = useTheme();
  const [failedImgs, setFailedImgs] = useState<Set<string>>(new Set());

  const countByRank: Record<string, number> = {};
  for (const p of pieces) {
    countByRank[p.rank] = (countByRank[p.rank] || 0) + 1;
  }

  const defByRank = new Map(PIECE_DEFINITIONS.map(d => [d.rank, d]));

  return (
    <div>
      <h4 className={`text-[10px] uppercase tracking-wider mb-1.5 ${color}`}>
        {label} ({pieces.length})
      </h4>
      <div className="grid grid-cols-3 gap-1">
        {SORTED_RANKS.map(rank => {
          const def = defByRank.get(rank)!;
          const captured = countByRank[rank] || 0;
          const display = RANK_DISPLAY[rank];
          const imgSrc = theme.pieceImages[rank];
          const hasCaptured = captured > 0;

          return (
            <div
              key={rank}
              className={`flex flex-col items-center rounded p-1 ${
                hasCaptured ? 'bg-stone-800/60' : 'opacity-35'
              }`}
            >
              <div className="w-10 h-10 flex items-center justify-center">
                {imgSrc && !failedImgs.has(rank) ? (
                  <img
                    src={imgSrc}
                    alt={theme.pieceNames[rank]}
                    className="w-full h-full object-cover"
                    style={{ transform: `scale(${getPieceCrop(theme.id, imgSrc).scale}) translate(${getPieceCrop(theme.id, imgSrc).offsetX}%, ${getPieceCrop(theme.id, imgSrc).offsetY}%)` }}
                    onError={() => setFailedImgs(prev => new Set(prev).add(rank))}
                  />
                ) : (
                  <span style={{ color: display.color }} className="text-lg font-bold">
                    {theme.pieceEmojis[rank]}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-bold tabular-nums ${hasCaptured ? highlightColor : 'text-gray-600'}`}>
                {captured}/{def.quantity}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CapturedPieces({ mine, theirs }: CapturedPiecesProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
        Captured
      </h3>
      <CaptureGrid pieces={mine} label="Your Losses" color="text-red-400" highlightColor="text-red-400" />
      <CaptureGrid pieces={theirs} label="Enemy Casualties" color="text-green-400" highlightColor="text-green-400" />
    </div>
  );
}
