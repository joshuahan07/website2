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

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || '';
    socket = io(socketUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
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
      router.push('/game');
    });

    socket.on(S2C.PLAYER_JOINED, () => {
      router.push('/game');
    });

    socket.on(S2C.ERROR, (data: { message: string }) => {
      setError(data.message);
    });

    return () => {
      socket?.disconnect();
    };
  }, [router]);

  const handleCreateGame = useCallback((nickname: string, theme: string) => {
    setError(null);
    sessionStorage.setItem('nickname', nickname);
    sessionStorage.setItem('roomTheme', theme);
    socket?.emit(C2S.CREATE_ROOM, { nickname, theme });
  }, []);

  const handleJoinGame = useCallback((code: string, nickname: string) => {
    setError(null);
    sessionStorage.setItem('nickname', nickname);
    socket?.emit(C2S.JOIN_ROOM, { roomCode: code, nickname });
  }, []);

  const handlePlayBot = useCallback((nickname: string) => {
    setError(null);
    sessionStorage.setItem('nickname', nickname);
    socket?.emit(C2S.CREATE_BOT_GAME, { nickname });
  }, []);

  return (
    <Lobby
      onCreateGame={handleCreateGame}
      onJoinGame={handleJoinGame}
      onPlayBot={handlePlayBot}
      roomCode={roomCode}
      playerNumber={playerNumber}
      waiting={waiting}
      error={error}
    />
  );
}
