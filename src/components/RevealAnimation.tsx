'use client';

import { useState } from 'react';
import { RevealEvent } from '@/types/game';
import { RANK_DISPLAY } from '@/lib/pieces';
import { useTheme } from '@/lib/ThemeContext';

interface RevealAnimationProps {
  event: RevealEvent;
}

export default function RevealAnimation({ event }: RevealAnimationProps) {
  const { theme } = useTheme();
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});

  const handleImgError = (index: number) => {
    setImgErrors(prev => ({ ...prev, [index]: true }));
  };

  const getTitle = () => {
    const key = event.type as keyof typeof theme.revealTitles;
    return theme.revealTitles[key] || 'REVEAL!';
  };

  const getColor = () => {
    switch (event.type) {
      case 'spy_kills_marshal': return 'text-purple-400';
      case 'miner_defuses_bomb': return 'text-orange-400';
      case 'scout_move': return 'text-green-400';
      case 'spotter_reveal': return 'text-cyan-400';
      default: return 'text-red-400';
    }
  };

  const getBgClass = () => {
    switch (event.type) {
      case 'spy_kills_marshal': return 'bg-spy';
      case 'miner_defuses_bomb': return 'bg-miner';
      default: return '';
    }
  };

  const isCombat = event.pieces.length === 2 && event.result;

  const sparks = Array.from({ length: 8 }, (_, i) => ({
    x: `${(Math.cos((i / 8) * Math.PI * 2) * 40).toFixed(0)}px`,
    y: `${(Math.sin((i / 8) * Math.PI * 2) * 40).toFixed(0)}px`,
    color: event.type === 'spy_kills_marshal' ? '#8b5cf6'
      : event.type === 'miner_defuses_bomb' ? '#f97316'
      : '#fbbf24',
    delay: `${(i * 0.05).toFixed(2)}s`,
  }));

  const getSpyKillDescription = () => {
    const spyName = theme.pieceNames['0'];
    const marshalName = theme.pieceNames['10'];
    return `The ${spyName} strikes from the shadows and slays the mighty ${marshalName}!`;
  };

  const isBothDestroyed = event.result?.winner === 'both_destroyed';

  // Determine which piece index is the bomb for miner_defuses_bomb
  const bombPieceIndex = event.type === 'miner_defuses_bomb'
    ? event.pieces.findIndex(p => p.rank === 'B')
    : -1;

  return (
    <div className="fixed left-0 right-0 bottom-0 bg-black/85 flex items-center justify-center z-40 pointer-events-none backdrop-blur-[2px]" style={{ top: '44px' }}>

      <div className={`animate-bounce-in bg-stone-900/95 border border-stone-600 rounded-xl
        p-6 shadow-2xl text-center max-w-sm spark-container ${getBgClass()}`}>

        {(event.result || event.spotterResult) && sparks.map((s, i) => (
          <div
            key={i}
            className="spark"
            style={{
              '--spark-x': s.x,
              '--spark-y': s.y,
              background: s.color,
              left: '50%',
              top: '40%',
              animationDelay: s.delay,
            } as React.CSSProperties}
          />
        ))}

        <h3 className={`text-2xl font-black mb-4 ${getColor()} text-glow tracking-wider`}>
          {getTitle()}
        </h3>

        <div className="flex items-center justify-center gap-3">
          {event.pieces.map((p, i) => {
            const display = RANK_DISPLAY[p.rank];
            const isP1 = p.owner === 1;
            const survived = event.result
              ? (i === 0 ? event.result.attackerSurvived : event.result.defenderSurvived)
              : true;
            const pieceImage = theme.pieceImages[p.rank];
            const hasImgError = imgErrors[i];

            const slideClass = isCombat
              ? (i === 0 ? 'combat-slide-left' : 'combat-slide-right')
              : '';

            const isSpotterReveal = event.type === 'spotter_reveal';

            return (
              <div key={i} className="flex items-center gap-3">
                {i === 1 && isCombat && (
                  <>
                    {isBothDestroyed && (
                      <div className="shockwave" />
                    )}
                    <div className="vs-text text-2xl font-black text-amber-400 drop-shadow-lg mx-1">
                      VS
                    </div>
                  </>
                )}
                <div className="text-center">
                  <div
                    className={`
                      relative
                      ${isCombat ? 'w-20 h-20' : 'w-16 h-16'} rounded-lg flex flex-col items-center justify-center
                      border-2 transition-all
                      ${isP1 ? 'bg-blue-900 border-blue-400' : 'bg-red-900 border-red-400'}
                      ${!survived ? 'piece-shatter' : 'animate-scale-in'}
                      ${slideClass}
                    `}
                  >
                    {pieceImage && !hasImgError ? (
                      <img
                        src={pieceImage}
                        alt={display.symbol}
                        className="w-[70%] h-[70%] object-contain drop-shadow-md"
                        onError={() => handleImgError(i)}
                      />
                    ) : (
                      <span className="text-2xl font-bold drop-shadow-md" style={{ color: display.color }}>
                        {theme.pieceEmojis[p.rank]}
                      </span>
                    )}
                    <span className="text-[9px] text-gray-300 font-medium">{theme.pieceNames[p.rank]}</span>

                    {/* Rank number overlay */}
                    <span className="absolute top-0.5 right-1 text-[10px] font-black text-white/70 drop-shadow">
                      {p.rank !== 'F' && p.rank !== 'B' ? p.rank : ''}
                    </span>

                    {/* Defuse spark overlay on the bomb piece */}
                    {event.type === 'miner_defuses_bomb' && i === bombPieceIndex && (
                      <div className="defuse-spark" />
                    )}

                    {/* Spotter beam/fizzle overlay */}
                    {isSpotterReveal && event.spotterResult && i === 1 && (
                      <div className={event.spotterResult.correct ? 'spotter-beam' : 'spotter-fizzle'} />
                    )}
                  </div>
                  <span className={`text-[10px] mt-1 block font-medium ${
                    isP1 ? 'text-blue-400' : 'text-red-400'
                  }`}>
                    Player {p.owner}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {event.result && (
          <p className="mt-4 text-base font-black text-amber-400 tracking-wide animate-scale-in">
            {event.result.winner === 'flag_captured' && `${theme.pieceNames['F'].toUpperCase()} CAPTURED!`}
            {event.result.winner === 'both_destroyed' && 'Both destroyed!'}
            {event.result.winner === 'attacker' && `${theme.pieceEmojis[event.result.attacker.rank]} ${theme.pieceNames[event.result.attacker.rank]} wins!`}
            {event.result.winner === 'defender' && `${theme.pieceEmojis[event.result.defender.rank]} ${theme.pieceNames[event.result.defender.rank]} wins!`}
          </p>
        )}

        {/* Special spy_kills_marshal themed description */}
        {event.type === 'spy_kills_marshal' && event.result && (
          <p className="mt-2 text-sm italic text-purple-300/90 animate-scale-in">
            {getSpyKillDescription()}
          </p>
        )}

        {event.spotterResult && (
          <div className="mt-4 animate-scale-in text-center">
            {event.spotterResult.predictedRank && (
              <p className="text-sm text-cyan-300 mb-1">
                Predicted: <span className="font-black">{theme.pieceEmojis[event.spotterResult.predictedRank]} {theme.pieceNames[event.spotterResult.predictedRank]}</span>
              </p>
            )}
            <p className="text-sm text-stone-400 mb-1">
              Actual: <span className="font-black text-white">{theme.pieceEmojis[event.spotterResult.targetPiece.rank]} {theme.pieceNames[event.spotterResult.targetPiece.rank]}</span>
            </p>
            <p className={`text-base font-black tracking-wide ${
              event.spotterResult.correct ? 'text-green-400' : 'text-red-400'
            }`}>
              {event.spotterResult.correct ? 'CORRECT! Target destroyed!' : 'WRONG!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
