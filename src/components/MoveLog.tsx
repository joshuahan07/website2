'use client';

import { MoveLogEntry, Rank } from '@/types/game';
import { useEffect, useRef } from 'react';
import { useTheme } from '@/lib/ThemeContext';

interface MoveLogProps {
  entries: MoveLogEntry[];
  onEntryClick?: (from: { row: number; col: number }, to: { row: number; col: number }) => void;
}

function coordLabel(row: number, col: number): string {
  const colLetter = String.fromCharCode(65 + col); // A-J
  const rowNum = 8 - row; // row 0 = "8", row 7 = "1"
  return `${colLetter}${rowNum}`;
}

export default function MoveLog({ entries, onEntryClick }: MoveLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  const tn = (rank: Rank) => theme.pieceNames[rank];
  const te = (rank: Rank) => theme.pieceEmojis[rank];

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
        Move Log
      </h3>
      <div className="max-h-48 overflow-y-auto space-y-0.5 text-[11px] font-mono">
        {entries.length === 0 && (
          <p className="text-gray-600 text-xs">No moves yet</p>
        )}
        {entries.map((entry, i) => (
          <div
            key={i}
            onClick={() => onEntryClick?.(entry.from, entry.to)}
            className={`px-1.5 py-0.5 rounded cursor-pointer transition-all border-l-2 border-transparent ${
              entry.player === 1
                ? 'bg-blue-900/20 hover:bg-blue-900/40 hover:border-blue-400'
                : 'bg-red-900/20 hover:bg-red-900/40 hover:border-red-400'
            }`}
          >
            <span className="text-gray-500">{entry.moveNumber}.</span>
            <span className={`inline-block w-2 h-2 rounded-full mx-1 ${
              entry.player === 1 ? 'bg-blue-400' : 'bg-red-400'
            }`} />{' '}
            <span className="text-gray-300">
              {coordLabel(entry.from.row, entry.from.col)} &rarr; {coordLabel(entry.to.row, entry.to.col)}
            </span>
            {entry.pieceRank && (
              <span className="text-amber-400"> [{te(entry.pieceRank)} {tn(entry.pieceRank)}]</span>
            )}
            {entry.combat && (
              <div className="text-gray-300 pl-3">
                {te(entry.combat.attackerRank)} {tn(entry.combat.attackerRank)} vs {te(entry.combat.defenderRank)} {tn(entry.combat.defenderRank)}: {
                  entry.combat.result.includes('Flag captured') ? `${tn('F')} captured!`
                  : entry.combat.result.includes('Both destroyed') ? 'Both destroyed'
                  : entry.combat.result.includes('wins')
                    ? (() => {
                        const attackerWins = entry.combat!.result.includes(entry.combat!.attackerName);
                        const winnerRank = attackerWins ? entry.combat!.attackerRank : entry.combat!.defenderRank;
                        return `${tn(winnerRank)} wins`;
                      })()
                    : entry.combat.result
                }
              </div>
            )}
            {entry.spotter && (
              <div className="pl-3">
                <span className={entry.spotter.correct ? 'text-green-400' : 'text-red-400'}>
                  {te('1')} {tn('1')} guessed {te(entry.spotter.predictedRank)} {tn(entry.spotter.predictedRank)}:{' '}
                  {entry.spotter.correct ? 'CORRECT!' : `Wrong (was ${te(entry.spotter.targetRank)} ${tn(entry.spotter.targetRank)})`}
                </span>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
