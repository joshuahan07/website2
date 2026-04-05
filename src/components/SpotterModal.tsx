'use client';

import { useState } from 'react';
import { Square, Rank } from '@/types/game';
import { PIECE_DEFINITIONS, RANK_DISPLAY } from '@/lib/pieces';
import { useTheme } from '@/lib/ThemeContext';
import { getPieceCrop } from '@/lib/pieceCrops';

interface SpotterModalProps {
  spotterPosition: Square;
  targets: Square[];
  onPredict: (target: Square, rank: Rank) => void;
}

const COL_LABELS = ['A','B','C','D','E','F','G','H','I','J'];

function coordLabel(row: number, col: number): string {
  return `${COL_LABELS[col]}${8 - row}`;
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

  // Get spotter image
  const spotterImage = theme.pieceImages['1'];
  const spotterCrop = spotterImage ? getPieceCrop(theme.id, spotterImage) : null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="relative max-w-lg w-full mx-4 rounded-3xl overflow-hidden border border-cyan-500/30 shadow-2xl shadow-cyan-500/10">
        {/* Background */}
        <div className="absolute inset-0 bg-[#0a0d14]/95 backdrop-blur-xl" />
        <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

        <div className="relative p-6">
          {/* Header with spotter preview */}
          <div className="flex items-center gap-4 mb-5">
            {/* Spotter piece circle */}
            <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-cyan-400/60 bg-stone-900 flex-shrink-0"
              style={{ boxShadow: '0 0 15px rgba(6,182,212,0.2)' }}>
              {spotterImage ? (
                <img
                  src={spotterImage}
                  alt={theme.pieceNames['1']}
                  className="w-full h-full object-cover"
                  style={spotterCrop ? { transform: `scale(${spotterCrop.scale}) translate(${spotterCrop.offsetX}%, ${spotterCrop.offsetY}%)` } : undefined}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl">{theme.pieceEmojis['1']}</div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-black text-cyan-400 tracking-wide">
                {theme.pieceNames['1']} Prediction
              </h2>
              <p className="text-xs text-white/30 mt-0.5">
                Predict an adjacent enemy at {coordLabel(spotterPosition.row, spotterPosition.col)}. If correct, it&apos;s destroyed!
              </p>
            </div>
          </div>

          {/* Target selection */}
          {targets.length > 1 && (
            <div className="mb-5">
              <p className="text-[11px] text-white/40 uppercase tracking-wider font-bold mb-2">Choose Target</p>
              <div className="flex gap-2">
                {targets.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedTarget(t)}
                    className={`
                      flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all
                      ${selectedTarget?.row === t.row && selectedTarget?.col === t.col
                        ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/50'
                        : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white'
                      }
                    `}
                  >
                    {/* Show the black enemy circle */}
                    <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-black ring-2 ring-red-600 flex items-center justify-center">
                      <span className="text-red-400 font-black text-sm">?</span>
                    </div>
                    {coordLabel(t.row, t.col)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Single target preview */}
          {targets.length === 1 && (
            <div className="mb-5 flex items-center justify-center gap-3">
              <span className="text-white/30 text-xs">Target:</span>
              <div className="w-10 h-10 rounded-full bg-black ring-2 ring-red-600 flex items-center justify-center">
                <span className="text-red-400 font-black">?</span>
              </div>
              <span className="text-white/60 text-sm font-mono">{coordLabel(targets[0].row, targets[0].col)}</span>
            </div>
          )}

          {/* Rank selection grid */}
          <p className="text-[11px] text-white/40 uppercase tracking-wider font-bold mb-3">What rank is it?</p>
          <div className="grid grid-cols-4 gap-2 mb-5">
            {guessableRanks.map(def => {
              const display = RANK_DISPLAY[def.rank];
              const isActive = selectedRank === def.rank;
              const pieceImage = theme.pieceImages[def.rank];
              const crop = pieceImage ? getPieceCrop(theme.id, pieceImage) : null;
              const rankLabel = def.rank === '0' ? 'Spy' : def.rank === 'B' ? '💥' : def.rank;

              return (
                <button
                  key={def.rank}
                  onClick={() => setSelectedRank(def.rank)}
                  className={`
                    relative p-1.5 rounded-xl text-center transition-all flex flex-col items-center gap-1
                    ${isActive
                      ? 'bg-cyan-500/20 ring-2 ring-cyan-400/60 scale-105'
                      : 'bg-white/[0.03] hover:bg-white/[0.06] ring-1 ring-white/[0.06]'
                    }
                  `}
                >
                  {/* Circular piece image */}
                  <div className={`w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ${
                    isActive ? 'ring-2 ring-cyan-400/50' : 'ring-1 ring-white/10'
                  } bg-stone-900`}>
                    {pieceImage ? (
                      <img
                        src={pieceImage}
                        alt={theme.pieceNames[def.rank]}
                        className="w-full h-full object-cover"
                        style={crop ? { transform: `scale(${crop.scale}) translate(${crop.offsetX}%, ${crop.offsetY}%)` } : undefined}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-lg font-bold" style={{ color: display.color }}>
                          {theme.pieceEmojis[def.rank]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Rank badge */}
                  <div className="absolute -top-1 -right-1 bg-black/90 rounded-full w-5 h-5 flex items-center justify-center border border-stone-600">
                    <span className="text-[9px] font-black text-white">{rankLabel}</span>
                  </div>

                  {/* Name */}
                  <span className={`text-[8px] leading-tight truncate w-full ${isActive ? 'text-cyan-300' : 'text-white/30'}`}>
                    {theme.pieceNames[def.rank]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Predict button */}
          <button
            onClick={handleConfirm}
            disabled={!selectedTarget || !selectedRank}
            className="w-full py-3.5 rounded-2xl font-bold text-base bg-gradient-to-r from-cyan-600 to-cyan-500
              hover:from-cyan-500 hover:to-cyan-400 text-white
              disabled:opacity-20 disabled:cursor-not-allowed transition-all
              hover:shadow-xl hover:shadow-cyan-500/20 active:scale-[0.99]"
          >
            PREDICT →
          </button>
        </div>
      </div>
    </div>
  );
}
