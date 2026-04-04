'use client';

import { useState, useCallback, useEffect } from 'react';
import { NotificationPermissionState, UseNotificationsReturn } from '@/types/api';

function isSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export default function useNotifications(): UseNotificationsReturn {
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>('default');

  useEffect(() => {
    if (isSupported()) {
      setPermissionState(Notification.permission as NotificationPermissionState);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported()) return 'denied';
    const result = await Notification.requestPermission();
    setPermissionState(result as NotificationPermissionState);
    return result;
  }, []);

  const sendNotification = useCallback(
    (title: string, body: string, icon?: string) => {
      if (!isSupported()) return;
      if (Notification.permission !== 'granted') return;
      if (document.visibilityState === 'visible') return;

      new Notification(title, { body, icon });
    },
    [],
  );

  return { sendNotification, permissionState, requestPermission };
}
