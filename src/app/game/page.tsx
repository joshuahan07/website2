'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GameRedirect() {
  const router = useRouter();
  useEffect(() => {
    const storedRoom = sessionStorage.getItem('roomCode');
    if (storedRoom) {
      router.replace(`/game/${storedRoom}`);
    } else {
      router.replace('/');
    }
  }, [router]);
  return null;
}
