'use client';

import { useState, useEffect } from 'react';
import { UseGeolocationReturn } from '@/types/api';

function isSupported(): boolean {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator;
}

export default function useGeolocation(): UseGeolocationReturn {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);

  useEffect(() => {
    if (!isSupported()) {
      setError('Geolocation is not supported by this browser');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        setIsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setIsPermissionDenied(true);
          setError('Location permission denied');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError('Location information is unavailable');
        } else if (err.code === err.TIMEOUT) {
          setError('Location request timed out');
        } else {
          setError('An unknown error occurred');
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 600000,
      }
    );
  }, []);

  return { latitude, longitude, isLoading, error, isPermissionDenied };
}
