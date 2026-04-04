'use client';

import { useState } from 'react';
import { Square, Rank } from '@/types/game';
import { PIECE_DEFINITIONS, RANK_DISPLAY } from '@/lib/pieces';
import { useTheme } from '@/lib/ThemeContext';

interface SpotterModalProps {
  spotterPosition: Square;
  targets: Square[];
  onPredict: (target: Square, rank: Rank) => void;
}

export default function SpotterModal({ spotterPosition, targets, onPredict }: SpotterModalProps) {
  const [selectedTarget, setSelectedTarget] = useState<Square | null>(
    targets.length === 1 ? targets[0] : null
  );
  const [selectedRank, setSelectedRank] = useState<Rank | null>(null);
  const { theme } = useTheme();

  const handleConfirm = () => {
    if (!selectedTarget || !selectedRank) return;
    onPredict(selectedTarget, selectedRank);
  };

  const guessableRanks = PIECE_DEFINITIONS.filter(d => d.rank !== 'F');

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-stone-800 border border-cyan-500/50 rounded-lg p-5 max-w-sm w-full mx-4 shadow-2xl">
        <h2 className="text-lg font-bold text-cyan-400 mb-2 text-center">
          {theme.pieceEmojis['1']} {theme.pieceNames['1']} Prediction
        </h2>
        <p className="text-xs text-gray-400 mb-4 text-center">
          Your {theme.pieceNames['1']} at ({spotterPosition.row}, {spotterPosition.col}) can
          predict an adjacent enemy piece. If correct, it is destroyed!
        </p>

        {targets.length > 1 && (
          <div className="mb-4">
            <p className="text-xs text-gray-300 mb-2">Choose target:</p>
            <div className="flex gap-2 justify-center">
              {targets.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedTarget(t)}
                  className={`
                    px-3 py-1.5 rounded text-sm transition-all
                    ${selectedTarget?.row === t.row && selectedTarget?.col === t.col
                      ? 'bg-cyan-600 text-white'
                      : 'bg-stone-700 text-gray-300 hover:bg-stone-600'
                    }
                  `}
                >
                  ({t.row}, {t.col})
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-gray-300 mb-2">What rank is it?</p>
        <div className="grid grid-cols-4 gap-1.5 mb-4">
          {guessableRanks.map(def => {
            const display = RANK_DISPLAY[def.rank];
            const isActive = selectedRank === def.rank;
            const pieceImage = theme.pieceImages[def.rank];
            const rankLabel = def.rank === '0' ? 'Spy' : def.rank === 'B' ? 'Bomb' : def.rank;

            return (
              <button
                key={def.rank}
                onClick={() => setSelectedRank(def.rank)}
                className={`
                  p-1.5 rounded text-center transition-all text-xs flex flex-col items-center gap-0.5
                  ${isActive
                    ? 'bg-cyan-600 ring-2 ring-cyan-300'
                    : 'bg-stone-700 hover:bg-stone-600'
                  }
                `}
              >
                <div className="w-8 h-8 relative flex items-center justify-center">
                  {pieceImage ? (
                    <img
                      src={pieceImage}
                      alt={theme.pieceNames[def.rank]}
                      className="w-full h-full object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <span className="text-lg font-bold" style={{ color: display.color }}>
                      {theme.pieceEmojis[def.rank]}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold" style={{ color: display.color }}>
                  {rankLabel}
                </span>
                <span className="text-[8px] text-gray-400 leading-tight truncate w-full">{theme.pieceNames[def.rank]}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleConfirm}
          disabled={!selectedTarget || !selectedRank}
          className="w-full py-2.5 rounded font-bold bg-cyan-600 hover:bg-cyan-500 text-white
            disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          PREDICT
        </button>
      </div>
    </div>
  );
}
