'use client';

import React, { useCallback, useMemo } from 'react';
import { Rank, PlayerNumber } from '@/types/game';
import { DragPieceData, DragHandlers } from '@/types/api';
import { ThemeId } from '@/lib/themes';

interface DragDropPieceProps {
  piece: { id: string; rank: Rank; name: string; owner: PlayerNumber };
  theme: ThemeId;
  sourceType: 'tray' | 'board';
  sourceRow?: number;
  sourceCol?: number;
  count?: number;
  dragHandlers: DragHandlers;
  onTapSelect?: (data: DragPieceData) => void;
  isSelected?: boolean;
  onDoubleClick?: () => void;
  children: React.ReactNode;
}

export default function DragDropPiece({
  piece,
  theme,
  sourceType,
  sourceRow,
  sourceCol,
  count,
  dragHandlers,
  onTapSelect,
  isSelected,
  onDoubleClick,
  children,
}: DragDropPieceProps) {
  const data: DragPieceData = useMemo(
    () => ({
      pieceId: piece.id,
      rank: piece.rank,
      name: piece.name,
      owner: piece.owner,
      sourceType,
      sourceRow,
      sourceCol,
    }),
    [piece.id, piece.rank, piece.name, piece.owner, sourceType, sourceRow, sourceCol],
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      dragHandlers.onDragStart(e, data);

      const target = e.currentTarget as HTMLElement;
      target.style.opacity = '0.5';
      target.style.transform = 'scale(0.95)';
    },
    [dragHandlers, data],
  );

  const handleDragEnd = useCallback(
    (e: React.DragEvent) => {
      const target = e.currentTarget as HTMLElement;
      target.style.opacity = '1';
      target.style.transform = 'scale(1)';

      dragHandlers.onDragEnd(e);
    },
    [dragHandlers],
  );

  const handleClick = useCallback(() => {
    if (onTapSelect) {
      onTapSelect(data);
    }
  }, [onTapSelect, data]);

  return (
    <div
      draggable="true"
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onDoubleClick={onDoubleClick}
      className={`relative cursor-grab select-none transition-transform active:cursor-grabbing ${
        isSelected ? 'ring-2 ring-yellow-400 ring-offset-1 rounded-md' : ''
      }`}
    >
      {children}

      {count !== undefined && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-black/80 px-1 text-[10px] font-bold text-white">
          x{count}
        </span>
      )}
    </div>
  );
}
