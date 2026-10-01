import { useState, useEffect, useRef } from 'react';
import { calculatePreciseDistance, isValidServiceArea } from '../lib/gisServices';
import { smoothCoordinates, isDisplacementAnomalous } from '../services/geoService';

interface GeoConfig {
  minDistanceMeters?: number; // Mínimo de metros movidos antes de enviar actualización
  minTimeSeconds?: number;    // Frecuencia máxima en segundos incluso si no se mueve
  enableHighAccuracy?: boolean;
}

export function useSmartGeolocation({
  minDistanceMeters = 5,
  minTimeSeconds = 5,
  enableHighAccuracy = true
}: GeoConfig = {}) {
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOutOfArea, setIsOutOfArea] = useState(false);

  const lastUpdateTime = useRef<number>(0);
  const lastLocation = useRef<[number, number] | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada por el navegador.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const currentLoc: [number, number] = [
          position.coords.latitude,
          position.coords.longitude
        ];

        // 1. Validar restricción geográfica (LATAM / ESPAÑA)
        if (!isValidServiceArea(currentLoc[0], currentLoc[1])) {
          setIsOutOfArea(true);
          setError('El servicio de PinPro no está disponible en tu región actual.');
          return;
        }

        setIsOutOfArea(false);

        const now = Date.now();
        const timeDiffSeconds = lastUpdateTime.current === 0 ? 0.5 : (now - lastUpdateTime.current) / 1000;

        let processedLoc = currentLoc;
        if (lastLocation.current) {
          // Detectar saltos bruscos/anómalos (ej: interferencias urbanas por rebotes de edificios)
          const isAnomalous = isDisplacementAnomalous(lastLocation.current, currentLoc, timeDiffSeconds);
          if (isAnomalous) {
            console.warn(`[SmartGeo] Salto de GPS anómalo detectado de [${lastLocation.current}] a [${currentLoc}]. Filtrando teletransportación.`);
            // Suavizado premium ultra amortiguado para filtrar picos de ruido
            processedLoc = smoothCoordinates(lastLocation.current, currentLoc, 0.08);
          } else {
            // Suavizado estándar para eliminar micro-vibración del sensor físico (alpha=0.45)
            processedLoc = smoothCoordinates(lastLocation.current, currentLoc, 0.45);
          }
        }

        let shouldUpdate = false;

        // 2. Lógica de "Thresholds" (Debounce espacial/temporal) para ahorrar batería
        if (!lastLocation.current) {
          shouldUpdate = true; // Primera lectura
        } else {
          const movedDistanceKm = calculatePreciseDistance(lastLocation.current, processedLoc);
          const movedDistanceMeters = movedDistanceKm * 1000;

          // Refresca si se movió más de la distancia mínima (ej. 5 metros)
          // O si superó el tiempo límite (ej. 5 segundos)
          if (movedDistanceMeters >= minDistanceMeters || timeDiffSeconds >= minTimeSeconds) {
            shouldUpdate = true;
          }
        }

        if (shouldUpdate) {
          setLocation(processedLoc);
          lastLocation.current = processedLoc;
          lastUpdateTime.current = now;
          setError(null);

          console.log(`[SmartGeo] Ubicación suavizada y validada: ${processedLoc[0]}, ${processedLoc[1]}`);
        }
      },
      (err) => {
        setError(`Error GPS: ${err.message}`);
      },
      {
        enableHighAccuracy: true, // Forzar alta precisión para latencia mínima PinPro
        maximumAge: 0, // Force fresh positioning data on every update
        timeout: 5000   // Reduced to 5s for fast real-time failover
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [minDistanceMeters, minTimeSeconds, enableHighAccuracy]);

  return { location, error, isOutOfArea };
}
