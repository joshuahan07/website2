'use client';

import { useEffect, useRef } from 'react';
import { ThemeId } from '@/lib/themes';
import { getNotificationContent } from '@/lib/apis/notifications';
import useNotifications from '@/hooks/useNotifications';

interface MoveLogEntry {
  combat?: { defenderName: string };
  player: number;
}

interface GameState {
  phase: string;
  myPlayer: number;
  currentTurn: number;
  opponentConnected: boolean;
  moveLog: MoveLogEntry[];
}

interface NotificationManagerProps {
  theme: ThemeId;
  gameState: GameState | null;
}

export default function NotificationManager({ theme, gameState }: NotificationManagerProps) {
  const { sendNotification } = useNotifications();
  const prevTurnRef = useRef<number | null>(null);
  const prevConnectedRef = useRef<boolean | null>(null);
  const prevMoveLogLengthRef = useRef<number>(0);
  const originalTitleRef = useRef<string>('');

  // Store the original document title on mount
  useEffect(() => {
    originalTitleRef.current = document.title;
  }, []);

  // Revert document title when tab becomes visible
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible' && originalTitleRef.current) {
        document.title = originalTitleRef.current;
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Track turn changes
  useEffect(() => {
    if (!gameState || gameState.phase !== 'playing') {
      prevTurnRef.current = null;
      return;
    }

    const { myPlayer, currentTurn } = gameState;

    if (prevTurnRef.current !== null && prevTurnRef.current !== currentTurn && currentTurn === myPlayer) {
      const content = getNotificationContent(theme, 'your_turn');
      sendNotification(content.title, content.body);

      if (document.visibilityState !== 'visible') {
        document.title = '\u2694\uFE0F YOUR TURN';
      }
    }

    prevTurnRef.current = currentTurn;
  }, [gameState, theme, sendNotification]);

  // Track piece kills from move log
  useEffect(() => {
    if (!gameState || gameState.phase !== 'playing') {
      prevMoveLogLengthRef.current = 0;
      return;
    }

    const { moveLog, myPlayer } = gameState;
    const prevLength = prevMoveLogLengthRef.current;

    if (moveLog.length > prevLength) {
      // Check new entries for combat where the player's piece was killed
      for (let i = prevLength; i < moveLog.length; i++) {
        const entry = moveLog[i];
        if (entry.combat && entry.player !== myPlayer) {
          const content = getNotificationContent(theme, 'piece_killed', {
            pieceName: entry.combat.defenderName,
          });
          sendNotification(content.title, content.body);
        }
      }
    }

    prevMoveLogLengthRef.current = moveLog.length;
  }, [gameState, theme, sendNotification]);

  // Track opponent connection status
  useEffect(() => {
    if (!gameState) {
      prevConnectedRef.current = null;
      return;
    }

    const { opponentConnected } = gameState;

    if (prevConnectedRef.current !== null && prevConnectedRef.current !== opponentConnected) {
      const event = opponentConnected ? 'opponent_reconnected' : 'opponent_disconnected';
      const content = getNotificationContent(theme, event);
      sendNotification(content.title, content.body);
    }

    prevConnectedRef.current = opponentConnected;
  }, [gameState, theme, sendNotification]);

  return null;
}
