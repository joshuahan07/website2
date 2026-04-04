'use client';

import React, { useState, useCallback } from 'react';
import { DropHandlers } from '@/types/api';

interface DragDropZoneProps {
  row: number;
  col: number;
  isValidTarget: boolean;
  dropHandlers: DropHandlers;
  onTapPlace?: () => void;
  children: React.ReactNode;
}

export default function DragDropZone({
  row,
  col,
  isValidTarget,
  dropHandlers,
  onTapPlace,
  children,
}: DragDropZoneProps) {
  const [isOver, setIsOver] = useState(false);
  const enterCountRef = React.useRef(0);

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      enterCountRef.current += 1;
      setIsOver(true);
      dropHandlers.onDragEnter(e);
    },
    [dropHandlers],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      enterCountRef.current -= 1;
      if (enterCountRef.current <= 0) {
        enterCountRef.current = 0;
        setIsOver(false);
      }
      dropHandlers.onDragLeave(e);
    },
    [dropHandlers],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      dropHandlers.onDragOver(e);
    },
    [dropHandlers],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      enterCountRef.current = 0;
      setIsOver(false);
      dropHandlers.onDrop(e);
    },
    [dropHandlers],
  );

  const handleClick = useCallback(() => {
    if (onTapPlace) {
      onTapPlace();
    }
  }, [onTapPlace]);

  const highlightClass = isOver
    ? isValidTarget
      ? 'ring-2 ring-green-400 bg-green-400/25 shadow-[inset_0_0_12px_rgba(74,222,128,0.4)]'
      : 'ring-2 ring-red-400 bg-red-400/25 shadow-[inset_0_0_12px_rgba(248,113,113,0.4)]'
    : '';

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`relative flex items-center justify-center transition-all duration-150 ${highlightClass}`}
      data-row={row}
      data-col={col}
    >
      {children}
    </div>
  );
}
