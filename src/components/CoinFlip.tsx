'use client';

import { useState, useEffect } from 'react';

interface CoinFlipProps {
  player1Name: string;
  player2Name: string;
  winner: 1 | 2;
  onComplete: () => void;
}

export default function CoinFlip({ player1Name, player2Name, winner, onComplete }: CoinFlipProps) {
  const [phase, setPhase] = useState<'spinning' | 'result'>('spinning');

  useEffect(() => {
    // Show spinning for 1.5 seconds, then result for 1 second
    const spinTimer = setTimeout(() => setPhase('result'), 1500);
    const doneTimer = setTimeout(() => onComplete(), 2500);
    return () => {
      clearTimeout(spinTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  const winnerName = winner === 1 ? player1Name : player2Name;

  return (
    <div className="fixed left-0 right-0 bottom-0 bg-black/90 flex items-center justify-center z-40 backdrop-blur-sm" style={{ top: '44px' }}>
      <div className="text-center">
        <h2 className="text-2xl font-black text-amber-400 mb-6 tracking-wider">
          COIN FLIP
        </h2>

        {/* Coin */}
        <div className="relative w-32 h-32 mx-auto mb-8" style={{ perspective: '600px' }}>
          <div
            className={`w-full h-full relative ${
              phase === 'spinning'
                ? 'coin-spinning'
                : winner === 2 ? 'coin-landed coin-landed-p2' : 'coin-landed'
            }`}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Front - Player 1 */}
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-4 border-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/30"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="text-center">
                <span className="text-3xl block mb-1">&#x1F464;</span>
                <span className="text-[11px] font-bold text-amber-900 block px-2 truncate max-w-[100px]">
                  {player1Name}
                </span>
              </div>
            </div>

            {/* Back - Player 2 */}
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-4 border-blue-300 flex items-center justify-center shadow-lg shadow-blue-500/30"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <div className="text-center">
                <span className="text-3xl block mb-1">&#x1F464;</span>
                <span className="text-[11px] font-bold text-blue-900 block px-2 truncate max-w-[100px]">
                  {player2Name}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Result text */}
        {phase === 'result' && (
          <div className="animate-scale-in">
            <p className="text-xl font-black text-green-400 mb-2">
              {winnerName} goes first!
            </p>
            <p className="text-sm text-stone-400">
              Starting the game...
            </p>
          </div>
        )}

        {phase === 'spinning' && (
          <p className="text-sm text-stone-400 animate-pulse">
            Flipping...
          </p>
        )}
      </div>
    </div>
  );
}
