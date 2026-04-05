'use client';

import { useState } from 'react';
import { RevealEvent } from '@/types/game';
import { RANK_DISPLAY } from '@/lib/pieces';
import { useTheme } from '@/lib/ThemeContext';
import { getPieceCrop } from '@/lib/pieceCrops';

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

  const isCombat = event.pieces.length === 2 && event.result;
  const isBothDestroyed = event.result?.winner === 'both_destroyed';
  const isSpotterReveal = event.type === 'spotter_reveal';

  const bombPieceIndex = event.type === 'miner_defuses_bomb'
    ? event.pieces.findIndex(p => p.rank === 'B')
    : -1;

  // Get accent color based on event type
  const accentColor = (() => {
    switch (event.type) {
      case 'spy_kills_marshal': return { text: 'text-purple-400', bg: 'from-purple-500/20', border: 'border-purple-500/30', glow: 'shadow-purple-500/20' };
      case 'miner_defuses_bomb': return { text: 'text-orange-400', bg: 'from-orange-500/20', border: 'border-orange-500/30', glow: 'shadow-orange-500/20' };
      case 'spotter_reveal': return { text: 'text-cyan-400', bg: 'from-cyan-500/20', border: 'border-cyan-500/30', glow: 'shadow-cyan-500/20' };
      default: return { text: 'text-red-400', bg: 'from-red-500/20', border: 'border-red-500/30', glow: 'shadow-red-500/20' };
    }
  })();

  return (
    <div className="fixed left-0 right-0 bottom-0 flex items-center justify-center z-40 pointer-events-none" style={{ top: '44px' }}>
      {/* Dark backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Radial glow behind card */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`w-[400px] h-[400px] rounded-full bg-gradient-radial ${accentColor.bg} to-transparent blur-3xl opacity-50`} />
      </div>

      {/* Main card */}
      <div className="relative animate-bounce-in max-w-md w-full mx-6">
        <div className={`relative rounded-3xl overflow-hidden border ${accentColor.border} shadow-2xl ${accentColor.glow}`}>
          {/* Card background */}
          <div className="absolute inset-0 bg-[#0a0d14]/95 backdrop-blur-xl" />
          {/* Top accent line */}
          <div className={`absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-current to-transparent ${accentColor.text} opacity-40`} />

          <div className="relative p-8">
            {/* Title */}
            <h3 className={`text-3xl font-black mb-6 ${accentColor.text} tracking-wider text-center`}>
              {getTitle()}
            </h3>

            {/* Pieces */}
            <div className="flex items-center justify-center gap-4">
              {event.pieces.map((p, i) => {
                const display = RANK_DISPLAY[p.rank];
                const isP1 = p.owner === 1;
                const survived = event.result
                  ? (i === 0 ? event.result.attackerSurvived : event.result.defenderSurvived)
                  : true;
                const pieceImage = theme.pieceImages[p.rank];
                const hasImgError = imgErrors[i];
                const crop = pieceImage ? getPieceCrop(theme.id, pieceImage) : null;

                const slideClass = isCombat
                  ? (i === 0 ? 'combat-slide-left' : 'combat-slide-right')
                  : '';

                const rankLabel = p.rank === '0' ? 'Spy' : p.rank === 'B' ? '💥' : p.rank === 'F' ? '🏆' : p.rank;

                return (
                  <div key={i} className="flex items-center gap-4">
                    {i === 1 && isCombat && (
                      <>
                        {isBothDestroyed && <div className="shockwave" />}
                        <div className="vs-text text-3xl font-black text-white/20 mx-2">
                          VS
                        </div>
                      </>
                    )}
                    <div className={`text-center ${slideClass}`}>
                      {/* Piece circle */}
                      <div className="relative">
                        <div
                          className={`
                            w-24 h-24 rounded-full overflow-hidden
                            ring-[3px] transition-all relative
                            ${isP1 ? 'ring-blue-400/70' : 'ring-red-500/70'}
                            ${!survived ? 'piece-shatter' : 'animate-scale-in'}
                          `}
                          style={{
                            boxShadow: isP1
                              ? '0 0 20px rgba(59,130,246,0.2), inset 0 0 15px rgba(0,0,0,0.4)'
                              : '0 0 20px rgba(239,68,68,0.2), inset 0 0 15px rgba(0,0,0,0.4)',
                          }}
                        >
                          {pieceImage && !hasImgError ? (
                            <img
                              src={pieceImage}
                              alt={display.symbol}
                              className="w-full h-full object-cover"
                              style={crop ? {
                                transform: `scale(${crop.scale}) translate(${crop.offsetX}%, ${crop.offsetY}%)`,
                              } : undefined}
                              onError={() => handleImgError(i)}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-stone-900">
                              <span className="text-3xl font-bold" style={{ color: display.color }}>
                                {theme.pieceEmojis[p.rank]}
                              </span>
                            </div>
                          )}

                          {/* Defuse spark */}
                          {event.type === 'miner_defuses_bomb' && i === bombPieceIndex && (
                            <div className="defuse-spark" />
                          )}
                          {/* Spotter beam/fizzle */}
                          {isSpotterReveal && event.spotterResult && i === 1 && (
                            <div className={event.spotterResult.correct ? 'spotter-beam' : 'spotter-fizzle'} />
                          )}
                        </div>

                        {/* Rank badge - like on the board */}
                        <div className="absolute -top-1 -right-1 z-10 bg-black/90 rounded-full w-7 h-7 flex items-center justify-center border-2 border-stone-600 shadow-lg">
                          <span className="text-xs font-black text-white">{rankLabel}</span>
                        </div>

                        {/* Defeated X overlay */}
                        {!survived && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-5xl font-black text-red-500/60">✕</span>
                          </div>
                        )}
                      </div>

                      {/* Name */}
                      <p className="text-sm font-bold text-white/90 mt-3">
                        {theme.pieceNames[p.rank]}
                      </p>
                      <p className={`text-[10px] font-medium ${isP1 ? 'text-blue-400/70' : 'text-red-400/70'}`}>
                        {isP1 ? 'Player 1' : 'Player 2'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Result text */}
            {event.result && (
              <div className="mt-6 text-center animate-scale-in">
                <div className="inline-block px-5 py-2 rounded-full bg-white/[0.05] border border-white/10">
                  <p className="text-base font-black tracking-wide text-white">
                    {event.result.winner === 'flag_captured' && `🏆 ${theme.pieceNames['F'].toUpperCase()} CAPTURED!`}
                    {event.result.winner === 'both_destroyed' && '💀 Both Destroyed'}
                    {event.result.winner === 'attacker' && `${theme.pieceNames[event.result.attacker.rank]} wins!`}
                    {event.result.winner === 'defender' && `${theme.pieceNames[event.result.defender.rank]} wins!`}
                  </p>
                </div>
              </div>
            )}

            {/* Spy kill flavor text */}
            {event.type === 'spy_kills_marshal' && event.result && (
              <p className="mt-3 text-sm italic text-purple-300/60 text-center animate-scale-in">
                The {theme.pieceNames['0']} strikes from the shadows...
              </p>
            )}

            {/* Spotter result */}
            {event.spotterResult && (
              <div className="mt-6 animate-scale-in">
                <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06]">
                  {event.spotterResult.predictedRank && (() => {
                    const predImg = theme.pieceImages[event.spotterResult.predictedRank!];
                    const predCrop = predImg ? getPieceCrop(theme.id, predImg) : null;
                    return (
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-white/40 text-sm">Predicted</span>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-cyan-400/40 bg-stone-900">
                            {predImg ? (
                              <img src={predImg} alt="" className="w-full h-full object-cover"
                                style={predCrop ? { transform: `scale(${predCrop.scale}) translate(${predCrop.offsetX}%, ${predCrop.offsetY}%)` } : undefined} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-sm">{theme.pieceEmojis[event.spotterResult!.predictedRank!]}</div>
                            )}
                          </div>
                          <span className="font-bold text-cyan-300 text-sm">
                            {theme.pieceNames[event.spotterResult!.predictedRank!]}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                  {(() => {
                    const actImg = theme.pieceImages[event.spotterResult.targetPiece.rank];
                    const actCrop = actImg ? getPieceCrop(theme.id, actImg) : null;
                    return (
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-white/40 text-sm">Actual</span>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/20 bg-stone-900">
                            {actImg ? (
                              <img src={actImg} alt="" className="w-full h-full object-cover"
                                style={actCrop ? { transform: `scale(${actCrop.scale}) translate(${actCrop.offsetX}%, ${actCrop.offsetY}%)` } : undefined} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-sm">{theme.pieceEmojis[event.spotterResult!.targetPiece.rank]}</div>
                            )}
                          </div>
                          <span className="font-bold text-white text-sm">
                            {theme.pieceNames[event.spotterResult.targetPiece.rank]}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                  <div className={`text-center py-2 rounded-xl font-black text-base ${
                    event.spotterResult.correct
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {event.spotterResult.correct ? '✓ CORRECT — Target Destroyed!' : '✕ WRONG'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
