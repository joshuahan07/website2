'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import Lobby from '@/components/Lobby';
import { C2S, S2C } from '@/lib/socketEvents';

let socket: Socket | null = null;

export default function Home() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [playerNumber, setPlayerNumber] = useState<number | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || '';
    socket = io(socketUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 30000,
    });

    socket.on('connect', () => {
      setConnected(true);
      setConnecting(false);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on(S2C.ROOM_CREATED, (data: { roomCode: string; playerNumber: number; theme?: string }) => {
      setRoomCode(data.roomCode);
      setPlayerNumber(data.playerNumber);
      setWaiting(true);
      setError(null);
      sessionStorage.setItem('roomCode', data.roomCode);
      sessionStorage.setItem('playerNumber', String(data.playerNumber));
      if (data.theme) sessionStorage.setItem('roomTheme', data.theme);
    });

    socket.on(S2C.ROOM_JOINED, (data: { roomCode: string; playerNumber: number; theme?: string }) => {
      sessionStorage.setItem('roomCode', data.roomCode);
      sessionStorage.setItem('playerNumber', String(data.playerNumber));
      if (data.theme) sessionStorage.setItem('roomTheme', data.theme);
      socket?.disconnect();
      router.push('/game');
    });

    socket.on(S2C.PLAYER_JOINED, () => {
      socket?.disconnect();
      router.push('/game');
    });

    socket.on(S2C.ERROR, (data: { message: string }) => {
      setError(data.message);
    });

    return () => {
      socket?.disconnect();
    };
  }, [router]);

  // Wait for connection before emitting, show connecting state
  const emitWhenReady = useCallback((event: string, data: Record<string, unknown>) => {
    if (socket?.connected) {
      socket.emit(event, data);
    } else {
      setConnecting(true);
      // Wait for connection then emit
      const onConnect = () => {
        socket?.emit(event, data);
        socket?.off('connect', onConnect);
        setConnecting(false);
      };
      socket?.on('connect', onConnect);
      // Timeout after 30s
      setTimeout(() => {
        socket?.off('connect', onConnect);
        if (!socket?.connected) {
          setConnecting(false);
          setError('Server is waking up. Please try again in a few seconds.');
        }
      }, 30000);
    }
  }, []);

  const handleCreateGame = useCallback((nickname: string, theme: string, timer: number) => {
    setError(null);
    sessionStorage.setItem('nickname', nickname);
    sessionStorage.setItem('roomTheme', theme);
    emitWhenReady(C2S.CREATE_ROOM, { nickname, theme, turnTimer: timer });
  }, [emitWhenReady]);

  const handleJoinGame = useCallback((code: string, nickname: string) => {
    setError(null);
    sessionStorage.setItem('nickname', nickname);
    emitWhenReady(C2S.JOIN_ROOM, { roomCode: code, nickname });
  }, [emitWhenReady]);

  const handlePlayBot = useCallback((nickname: string, theme: string, timer: number) => {
    setError(null);
    sessionStorage.setItem('nickname', nickname);
    sessionStorage.setItem('roomTheme', theme);
    emitWhenReady(C2S.CREATE_BOT_GAME, { nickname, theme, turnTimer: timer });
  }, [emitWhenReady]);

  return (
    <Lobby
      onCreateGame={handleCreateGame}
      onJoinGame={handleJoinGame}
      onPlayBot={handlePlayBot}
      roomCode={roomCode}
      playerNumber={playerNumber}
      waiting={waiting}
      error={error}
      connecting={connecting}
    />
  );
}
