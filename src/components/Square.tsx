'use client';

import { isLake } from '@/lib/gameLogic';
import { ClientPiece, PlayerNumber } from '@/types/game';
import { useTheme } from '@/lib/ThemeContext';
import Piece from './Piece';

interface SquareProps {
  row: number;
  col: number;
  piece: ClientPiece | null;
  myPlayer: PlayerNumber;
  isSelected: boolean;
  isValidMove: boolean;
  isLastMoveFrom: boolean;
  isLastMoveTo: boolean;
  revealing: boolean;
  onClick: () => void;
  isSetupZone?: boolean;
  isAttackTarget?: boolean;
  slideStyle?: React.CSSProperties;
  onPieceDragStart?: (row: number, col: number) => void;
  onPieceDrop?: (row: number, col: number) => void;
}

export default function Square({
  row, col, piece, myPlayer,
  isSelected, isValidMove, isLastMoveFrom, isLastMoveTo,
  revealing, onClick, isSetupZone, isAttackTarget, slideStyle,
  onPieceDragStart, onPieceDrop,
}: SquareProps) {
  const { theme } = useTheme();
  const lake = isLake(row, col);
  const isDark = (row + col) % 2 === 1;

  if (lake) {
    return (
      <div
        className={`aspect-square rounded-md flex items-center justify-center overflow-hidden theme-transition relative ${theme.board.lakeAnimationClass || theme.board.lakeClass}`}
        style={{
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6), inset 0 -2px 6px rgba(0,0,0,0.4)',
        }}
      >
        {/* Diagonal stripes to indicate blocked */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.15) 4px, rgba(255,255,255,0.15) 6px)',
          }}
        />
        <span className="text-blue-200/25 text-base animate-pulse relative z-10">~</span>
      </div>
    );
  }

  const handleDragStart = (e: React.DragEvent) => {
    if (onPieceDragStart && piece && piece.owner === myPlayer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', `${row},${col}`);
      onPieceDragStart(row, col);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (onPieceDrop) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (onPieceDrop) {
      onPieceDrop(row, col);
    }
  };

  return (
    <div
      onClick={onClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`
        aspect-square relative flex items-center justify-center
        transition-all duration-150 cursor-pointer theme-transition
        rounded-md
        ${isSetupZone ? 'ring-1 ring-inset ring-emerald-500/25' : ''}
        ${isSelected ? 'ring-2 ring-yellow-400 shadow-yellow-400/20' : ''}
        ${isValidMove && !isAttackTarget ? 'valid-move-glow' : ''}
        ${isAttackTarget ? 'attack-target-glow' : ''}
        ${isLastMoveFrom || isLastMoveTo ? 'last-move-highlight' : ''}
        hover:brightness-125
      `}
      style={{
        backgroundColor: isSelected ? 'rgba(113, 63, 18, 0.25)'
          : isValidMove && !isAttackTarget ? 'rgba(20, 83, 45, 0.25)'
          : isAttackTarget ? 'rgba(127, 29, 29, 0.25)'
          : isSetupZone ? 'rgba(6, 78, 59, 0.12)'
          : isLastMoveTo ? 'rgba(113, 63, 18, 0.35)'
          : isLastMoveFrom ? 'rgba(113, 63, 18, 0.2)'
          : isDark ? theme.board.darkSquare : theme.board.lightSquare,
        boxShadow: (!isSelected && !isValidMove && !isAttackTarget && !isLastMoveFrom && !isLastMoveTo)
          ? 'inset 0 1px 2px rgba(0,0,0,0.3), inset 0 -1px 1px rgba(255,255,255,0.03)'
          : undefined,
      }}
    >
      {piece && (
        <div className="w-full h-full" style={slideStyle} draggable={!!onPieceDragStart && piece.owner === myPlayer} onDragStart={handleDragStart}>
          <Piece
            piece={piece}
            isOwn={piece.owner === myPlayer}
            isSelected={isSelected}
            revealing={revealing}
          />
        </div>
      )}
      {isValidMove && !piece && (
        <div className={`w-3 h-3 rounded-full ${
          isAttackTarget
            ? 'bg-red-400/50 shadow-md shadow-red-400/30'
            : 'bg-green-400/40 valid-move-pulse shadow-md shadow-green-400/20'
        }`} />
      )}
    </div>
  );
}
