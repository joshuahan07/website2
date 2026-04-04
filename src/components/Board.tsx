'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { ClientPiece, PlayerNumber, Square as SquareType } from '@/types/game';
import SquareComponent from './Square';
import { BOARD_ROWS, BOARD_COLS } from '@/lib/gameLogic';
import { useTheme } from '@/lib/ThemeContext';

interface BoardProps {
  board: (ClientPiece | null)[][];
  myPlayer: PlayerNumber;
  selectedSquare: SquareType | null;
  validMoves: SquareType[];
  lastMove: { from: SquareType; to: SquareType } | null;
  revealingSquares: Set<string>;
  onSquareClick: (row: number, col: number) => void;
  phase?: string;
  isMyTurn?: boolean;
  myNickname?: string;
  opponentNickname?: string;
  onSetupDragDrop?: (fromRow: number, fromCol: number, toRow: number, toCol: number) => void;
  setupOverlay?: React.ReactNode;
  opponentMove?: { from: SquareType; to: SquareType } | null;
}

// Columns: A-J (left to right), Rows: 1-8 (bottom to top visually, so 1 = your back row)
const COL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const ROW_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8'];

export default function Board({
  board, myPlayer, selectedSquare, validMoves,
  lastMove, revealingSquares, onSquareClick, phase, isMyTurn,
  myNickname, opponentNickname, onSetupDragDrop, setupOverlay, opponentMove,
}: BoardProps) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [boardWidth, setBoardWidth] = useState<number | null>(null);
  const dragSourceRef = useRef<{ row: number; col: number } | null>(null);
  const [arrowMove, setArrowMove] = useState<{ fromRow: number; fromCol: number; toRow: number; toCol: number } | null>(null);

  const LABEL_TOP = 20;      // column labels above board
  const LABEL_BOTTOM = 24;   // side labels below board
  const LABEL_LEFT = 32;     // row labels on left
  const GRID_GAP = 4;
  const GRID_PADDING = 12;   // p-1.5 = 6px each side

  const computeSize = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // Available height from top of board container to bottom of viewport
    // Add extra padding to prevent cutting into the top bar
    const availableHeight = window.innerHeight - rect.top - 24;
    const availableWidth = el.clientWidth;

    // Grid height = available - labels
    const gridHeight = availableHeight - LABEL_TOP - LABEL_BOTTOM;
    // Cell size from height constraint
    const cellFromHeight = (gridHeight - GRID_PADDING * 2 - GRID_GAP * (BOARD_ROWS - 1)) / BOARD_ROWS;
    // Total width needed for that cell size
    const widthFromHeight = cellFromHeight * BOARD_COLS + GRID_GAP * (BOARD_COLS - 1) + GRID_PADDING * 2 + LABEL_LEFT;

    // Cell size from width constraint
    const gridWidthAvail = availableWidth - LABEL_LEFT;
    const cellFromWidth = (gridWidthAvail - GRID_PADDING * 2 - GRID_GAP * (BOARD_COLS - 1)) / BOARD_COLS;

    // Use the smaller cell size to fit both constraints
    const cellSize = Math.min(cellFromHeight, cellFromWidth);
    const finalWidth = cellSize * BOARD_COLS + GRID_GAP * (BOARD_COLS - 1) + GRID_PADDING * 2 + LABEL_LEFT;

    setBoardWidth(Math.max(finalWidth, 300));
  }, []);

  useEffect(() => {
    computeSize();
    window.addEventListener('resize', computeSize);
    return () => window.removeEventListener('resize', computeSize);
  }, [computeSize]);

  useEffect(() => {
    const timer = setTimeout(computeSize, 50);
    return () => clearTimeout(timer);
  }, [phase, computeSize]);

  // Show arrow for opponent moves - driven by opponentMove prop from move log
  useEffect(() => {
    if (!opponentMove) {
      setArrowMove(null);
      return;
    }
    setArrowMove({
      fromRow: opponentMove.from.row,
      fromCol: opponentMove.from.col,
      toRow: opponentMove.to.row,
      toCol: opponentMove.to.col,
    });
    const timer = setTimeout(() => setArrowMove(null), 1400);
    return () => clearTimeout(timer);
  }, [opponentMove]);

  // Flip board so the current player's pieces are at the bottom.
  const rows: number[] = [];
  for (let r = 0; r < BOARD_ROWS; r++) {
    const displayRow = myPlayer === 1 ? r : BOARD_ROWS - 1 - r;
    rows.push(displayRow);
  }

  // Columns always A-J left to right
  const cols: number[] = [];
  for (let c = 0; c < BOARD_COLS; c++) {
    cols.push(c);
  }

  // Row labels: 1 at bottom (your side), 8 at top (opponent side)
  // Display index 0 = top of screen, display index 7 = bottom
  // So top gets "8", bottom gets "1"
  const getRowLabel = (displayIndex: number) => {
    return ROW_LABELS[BOARD_ROWS - 1 - displayIndex];
  };

  // Calculate slide transform for the piece that moved
  const getSlideStyle = (row: number, col: number): React.CSSProperties | undefined => {
    if (!arrowMove) return undefined;
    if (row !== arrowMove.toRow || col !== arrowMove.toCol) return undefined;

    const fromDisplayRow = rows.indexOf(arrowMove.fromRow);
    const toDisplayRow = rows.indexOf(arrowMove.toRow);
    const fromDisplayCol = cols.indexOf(arrowMove.fromCol);
    const toDisplayCol = cols.indexOf(arrowMove.toCol);

    const deltaRow = fromDisplayRow - toDisplayRow;
    const deltaCol = fromDisplayCol - toDisplayCol;

    return {
      animation: 'pieceSlideIn 0.8s ease-out',
      '--slide-from-x': `${deltaCol * 100}%`,
      '--slide-from-y': `${deltaRow * 100}%`,
    } as React.CSSProperties;
  };

  return (
    <div
      ref={containerRef}
      className="w-full mx-auto relative theme-transition"
    >
      <div
        className="mx-auto relative"
        style={boardWidth ? { width: `${boardWidth}px`, maxWidth: '100%' } : { maxWidth: '1000px' }}
      >
        {/* Opponent label */}
        <div className="flex justify-center mb-0.5" style={{ paddingLeft: '32px' }}>
          <span className="text-xs text-red-400/80 font-semibold tracking-wide">
            {opponentNickname || 'Opponent'}
          </span>
        </div>

        {/* Column labels - top only (A-J) */}
        <div className="flex mb-1" style={{ paddingLeft: '32px' }}>
          <div className="grid grid-cols-10 gap-[3px] flex-1" style={{ padding: '0 4px' }}>
            {cols.map((c, i) => (
              <div key={i} className="text-center text-xs text-stone-400 font-mono font-semibold">
                {COL_LABELS[c]}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-stretch">
          {/* Row labels - left side only (8 at top, 1 at bottom) */}
          <div className="flex flex-col gap-[3px] justify-center pr-1.5" style={{ width: '32px', padding: '4px 6px 4px 0' }}>
            {rows.map((_r, ri) => (
              <div key={ri} className="flex-1 flex items-center justify-center text-xs text-stone-400 font-mono font-semibold">
                {getRowLabel(ri)}
              </div>
            ))}
          </div>

          {/* Board grid */}
          <div className="flex-1 relative">
            {/* Outer glow - changes with turn */}
            <div className={`absolute -inset-[3px] rounded-xl blur-[3px] transition-all duration-700 ${
              isMyTurn
                ? 'bg-gradient-to-br from-blue-400/40 via-blue-500/20 to-blue-400/40 shadow-xl shadow-blue-500/20'
                : 'bg-gradient-to-br from-stone-600/15 via-stone-700/5 to-stone-600/15'
            }`} />
            {/* Board frame */}
            <div className={`relative overflow-hidden grid grid-cols-10 gap-[4px] p-1.5 rounded-xl border-2 border-stone-700/80 ${theme.board.backgroundClass}`}
              style={{
                background: 'linear-gradient(145deg, rgba(30,25,20,0.95), rgba(15,12,10,0.98))',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4), inset 0 -1px 2px rgba(255,255,255,0.03), 0 4px 16px rgba(0,0,0,0.5)',
              }}
            >
              {rows.map((r) => (
                cols.map((c) => {
                  const piece = board[r]?.[c] ?? null;
                  const isSelected = selectedSquare?.row === r && selectedSquare?.col === c;
                  const isValid = validMoves.some(m => m.row === r && m.col === c);
                  const isLastFrom = lastMove?.from.row === r && lastMove?.from.col === c;
                  const isLastTo = lastMove?.to.row === r && lastMove?.to.col === c;
                  const isRevealing = revealingSquares.has(`${r},${c}`);
                  const isMySetupZone = myPlayer === 1 ? r >= 5 : r <= 2;
                  const slideStyle = getSlideStyle(r, c);

                  return (
                    <SquareComponent
                      key={`${r}-${c}`}
                      row={r}
                      col={c}
                      piece={piece}
                      myPlayer={myPlayer}
                      isSelected={isSelected}
                      isValidMove={isValid}
                      isLastMoveFrom={isLastFrom}
                      isLastMoveTo={isLastTo}
                      revealing={isRevealing}
                      onClick={() => onSquareClick(r, c)}
                      isSetupZone={phase === 'setup' && isMySetupZone}
                      isAttackTarget={isValid && piece !== null && piece.owner !== myPlayer}
                      slideStyle={slideStyle}
                      onPieceDragStart={phase === 'setup' && onSetupDragDrop ? (dr, dc) => {
                        dragSourceRef.current = { row: dr, col: dc };
                      } : undefined}
                      onPieceDrop={phase === 'setup' && onSetupDragDrop ? (dr, dc) => {
                        if (dragSourceRef.current) {
                          onSetupDragDrop(dragSourceRef.current.row, dragSourceRef.current.col, dr, dc);
                          dragSourceRef.current = null;
                        }
                      } : undefined}
                    />
                  );
                })
              ))}

              {/* Green arrow overlay for opponent moves */}
              {arrowMove && (() => {
                const fromDI = rows.indexOf(arrowMove.fromRow);
                const toDI = rows.indexOf(arrowMove.toRow);
                const fromCI = cols.indexOf(arrowMove.fromCol);
                const toCI = cols.indexOf(arrowMove.toCol);
                // Calculate % positions (center of each cell)
                const cellW = 100 / BOARD_COLS;
                const cellH = 100 / BOARD_ROWS;
                const x1 = (fromCI + 0.5) * cellW;
                const y1 = (fromDI + 0.5) * cellH;
                const x2 = (toCI + 0.5) * cellW;
                const y2 = (toDI + 0.5) * cellH;
                return (
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none z-30"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    style={{ animation: 'fadeOut 1s ease-out forwards' }}
                  >
                    <defs>
                      <marker id="arrowhead" markerWidth="4" markerHeight="3" refX="4" refY="1.5" orient="auto">
                        <polygon points="0 0, 4 1.5, 0 3" fill="#4ade80" />
                      </marker>
                    </defs>
                    <line
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke="#4ade80"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      markerEnd="url(#arrowhead)"
                      opacity="0.8"
                    />
                  </svg>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Narration slot */}
        <div id="narration-slot" className="flex justify-center" />

        {/* Voice commander slot */}
        <div id="voice-commander-slot" className="absolute bottom-0 right-0" />

        {/* Player labels - opponent at top, you at bottom */}
        <div className="flex justify-center mt-1" style={{ paddingLeft: '32px' }}>
          <span className="text-xs text-blue-400 font-semibold tracking-wide">
            {myNickname || 'You'}
          </span>
        </div>

        {/* Setup overlay - aligned with the board grid (offset by row labels) */}
        {setupOverlay && (
          <div className="absolute top-0 bottom-[38%] flex items-center justify-center z-20 pointer-events-none" style={{ left: '32px', right: 0 }}>
            <div className="pointer-events-auto w-full px-1">
              {setupOverlay}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
