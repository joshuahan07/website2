'use client';

import { useState, useCallback, useEffect } from 'react';
import { DragPieceData, DragHandlers, DropHandlers, UseDragAndDropReturn } from '@/types/api';

interface UseDragAndDropOptions {
  onDrop: (data: DragPieceData, row: number, col: number) => void;
}

export default function useDragAndDrop({ onDrop }: UseDragAndDropOptions): UseDragAndDropReturn & { isTouchDevice: boolean } {
  const [draggedPiece, setDraggedPiece] = useState<DragPieceData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [highlightedSquare, setHighlightedSquare] = useState<{ row: number; col: number } | null>(null);
  const [isHighlightValid, setIsHighlightValid] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window);
  }, []);

  const dragHandlers: DragHandlers = {
    onDragStart: useCallback((e: React.DragEvent, data: DragPieceData) => {
      e.dataTransfer.setData('application/json', JSON.stringify(data));
      e.dataTransfer.effectAllowed = 'move';
      setDraggedPiece(data);
      setIsDragging(true);
    }, []),

    onDragEnd: useCallback((_e: React.DragEvent) => {
      setDraggedPiece(null);
      setIsDragging(false);
      setHighlightedSquare(null);
      setIsHighlightValid(false);
    }, []),
  };

  const dropHandlers = useCallback(
    (row: number, col: number, isValid: boolean): DropHandlers => ({
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = isValid ? 'move' : 'none';
      },

      onDragEnter: (e: React.DragEvent) => {
        e.preventDefault();
        setHighlightedSquare({ row, col });
        setIsHighlightValid(isValid);
      },

      onDragLeave: (e: React.DragEvent) => {
        // Only clear if we're actually leaving this element, not entering a child
        const related = e.relatedTarget as Node | null;
        if (related && (e.currentTarget as Node).contains(related)) {
          return;
        }
        setHighlightedSquare((prev) => {
          if (prev && prev.row === row && prev.col === col) {
            return null;
          }
          return prev;
        });
      },

      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        const raw = e.dataTransfer.getData('application/json');
        if (!raw) return;

        try {
          const data: DragPieceData = JSON.parse(raw);
          if (isValid) {
            onDrop(data, row, col);
          }
        } catch {
          // Invalid JSON — ignore
        }

        setDraggedPiece(null);
        setIsDragging(false);
        setHighlightedSquare(null);
        setIsHighlightValid(false);
      },
    }),
    [onDrop],
  );

  return {
    dragHandlers,
    dropHandlers,
    draggedPiece,
    isDragging,
    highlightedSquare,
    isHighlightValid,
    isTouchDevice,
  };
}
