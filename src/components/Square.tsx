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
      <div className="aspect-square rounded-md overflow-hidden theme-transition relative"
        style={{ boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6), inset 0 -2px 6px rgba(0,0,0,0.4)' }}
      >
        {/* Theme-specific lake visuals */}
        {theme.id === 'kingdom' ? (
          /* Kingdom: Lava spike pit */
          <div className="w-full h-full relative bg-[#0a0604]">
            {/* Lava glow from below */}
            <div className="absolute inset-0" style={{
              background: 'radial-gradient(ellipse at 50% 90%, rgba(255,60,10,0.4) 0%, rgba(200,40,0,0.2) 30%, transparent 60%)',
              animation: 'lavaGlow 2s ease-in-out infinite alternate',
            }} />
            {/* Spike row using clip-path */}
            <div className="absolute bottom-0 left-0 right-0 h-[65%]" style={{
              background: 'linear-gradient(to top, #2a1a12, #1a0e08, #3a2015)',
              clipPath: 'polygon(0% 100%, 5% 35%, 10% 100%, 15% 25%, 20% 100%, 28% 20%, 33% 100%, 40% 30%, 45% 100%, 52% 15%, 58% 100%, 63% 28%, 70% 100%, 75% 22%, 82% 100%, 88% 18%, 93% 100%, 97% 35%, 100% 100%)',
              animation: 'spikesMove 2.5s ease-in-out infinite',
            }} />
            {/* Spike highlights */}
            <div className="absolute bottom-0 left-0 right-0 h-[65%] opacity-40" style={{
              background: 'linear-gradient(to top, rgba(255,80,20,0.3), transparent 60%)',
              clipPath: 'polygon(0% 100%, 5% 35%, 10% 100%, 15% 25%, 20% 100%, 28% 20%, 33% 100%, 40% 30%, 45% 100%, 52% 15%, 58% 100%, 63% 28%, 70% 100%, 75% 22%, 82% 100%, 88% 18%, 93% 100%, 97% 35%, 100% 100%)',
              animation: 'spikesMove 2.5s ease-in-out infinite, lavaGlow 2s ease-in-out infinite alternate',
            }} />
            {/* Ember particles */}
            <div className="absolute w-1 h-1 rounded-full bg-orange-500/60 left-[30%] bottom-[50%]" style={{ animation: 'ember 2s ease-out infinite' }} />
            <div className="absolute w-0.5 h-0.5 rounded-full bg-red-400/50 left-[60%] bottom-[40%]" style={{ animation: 'ember 2.5s ease-out infinite 0.7s' }} />
            <div className="absolute w-1 h-1 rounded-full bg-yellow-500/40 left-[45%] bottom-[55%]" style={{ animation: 'ember 3s ease-out infinite 1.3s' }} />
          </div>
        ) : theme.id === 'pirate' ? (
          /* Pirate: Deep whirlpool with debris */
          <div className="w-full h-full relative bg-[#04111d]">
            {/* Deep ocean layers */}
            <div className="absolute inset-0" style={{
              background: 'radial-gradient(ellipse at 50% 50%, rgba(10,80,120,0.5) 0%, rgba(5,30,50,0.3) 50%, transparent 80%)',
            }} />
            {/* Outer whirlpool ring */}
            <div className="absolute inset-[-30%] rounded-full" style={{
              background: 'conic-gradient(from 0deg, transparent, rgba(40,160,200,0.25) 30deg, transparent 60deg, rgba(30,140,180,0.2) 120deg, transparent 180deg, rgba(50,170,210,0.2) 240deg, transparent 300deg)',
              animation: 'spin 6s linear infinite',
            }} />
            {/* Inner vortex */}
            <div className="absolute inset-[10%] rounded-full" style={{
              background: 'conic-gradient(from 180deg, transparent, rgba(80,200,240,0.2) 45deg, transparent 90deg, rgba(60,180,220,0.15) 180deg, transparent 240deg)',
              animation: 'spin 4s linear infinite reverse',
            }} />
            {/* Dark center hole */}
            <div className="absolute inset-[30%] rounded-full bg-[radial-gradient(circle,rgba(0,10,20,0.8)_0%,transparent_100%)]" />
            {/* Foam specks */}
            <div className="absolute w-1 h-1 rounded-full bg-white/30 top-[15%] left-[25%]" style={{ animation: 'spin 6s linear infinite' }} />
            <div className="absolute w-0.5 h-0.5 rounded-full bg-white/20 top-[70%] left-[65%]" style={{ animation: 'spin 6s linear infinite' }} />
            <div className="absolute w-1 h-1 rounded-full bg-cyan-300/20 top-[40%] left-[75%]" style={{ animation: 'spin 4s linear infinite reverse' }} />
          </div>
        ) : (
          /* Greek: Medusa's poison pool */
          <div className="w-full h-full relative bg-[#08051a]">
            {/* Toxic pool surface */}
            <div className="absolute inset-0" style={{
              background: 'radial-gradient(ellipse at 50% 50%, rgba(120,40,200,0.3) 0%, rgba(60,15,100,0.15) 50%, transparent 80%)',
              animation: 'toxicPulse 3s ease-in-out infinite',
            }} />
            {/* Swirling surface */}
            <div className="absolute inset-[-10%] rounded-full" style={{
              background: 'conic-gradient(from 0deg, transparent, rgba(147,51,234,0.15) 60deg, transparent 120deg, rgba(168,85,247,0.12) 240deg, transparent 360deg)',
              animation: 'spin 10s linear infinite',
            }} />
            {/* Bubbles */}
            <div className="absolute w-2 h-2 rounded-full bottom-0 left-[20%]"
              style={{ background: 'radial-gradient(circle at 30% 30%, rgba(192,132,252,0.6), rgba(147,51,234,0.3) 50%, transparent 100%)', animation: 'poisonBubble 2.5s ease-out infinite' }} />
            <div className="absolute w-1.5 h-1.5 rounded-full bottom-0 left-[55%]"
              style={{ background: 'radial-gradient(circle at 30% 30%, rgba(168,85,247,0.5), rgba(120,40,200,0.2) 50%, transparent 100%)', animation: 'poisonBubble 3s ease-out infinite 0.8s' }} />
            <div className="absolute w-2.5 h-2.5 rounded-full bottom-0 left-[75%]"
              style={{ background: 'radial-gradient(circle at 30% 30%, rgba(139,92,246,0.5), rgba(100,30,180,0.2) 50%, transparent 100%)', animation: 'poisonBubble 3.5s ease-out infinite 1.5s' }} />
            <div className="absolute w-1 h-1 rounded-full bottom-0 left-[40%]"
              style={{ background: 'radial-gradient(circle at 30% 30%, rgba(192,132,252,0.4), transparent 60%)', animation: 'poisonBubble 4s ease-out infinite 2.2s' }} />
            {/* Green toxic highlights */}
            <div className="absolute inset-0" style={{
              background: 'radial-gradient(circle at 25% 40%, rgba(34,197,94,0.08) 0%, transparent 30%), radial-gradient(circle at 70% 60%, rgba(34,197,94,0.06) 0%, transparent 25%)',
              animation: 'toxicPulse 4s ease-in-out infinite alternate',
            }} />
            {/* Poison skull */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-purple-400/25 text-base animate-pulse drop-shadow-lg">☠</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  const handleDragStart = (e: React.DragEvent) => {
    if (onPieceDragStart && piece && piece.owner === myPlayer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', `${row},${col}`);

      // Use the circular piece element as the drag ghost instead of the full square
      const target = e.currentTarget as HTMLElement;
      const circle = target.querySelector('.rounded-full') as HTMLElement;
      if (circle) {
        const rect = circle.getBoundingClientRect();
        e.dataTransfer.setDragImage(circle, rect.width / 2, rect.height / 2);
      }

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
