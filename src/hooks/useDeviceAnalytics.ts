import { useEffect } from 'react';

export default function useDeviceAnalytics() {
  useEffect(() => {
    // FIX: Array de dependencias vacío estricto y cero setStates.
    // Absorbe cualquier intento de inicialización sin tocar el renderizado.
    try {
      (window as any).deviceStatsInitialized = true;
    } catch (e) {}
  }, []);

  return { isReady: true, error: null };
}
