export const sanitizeCoordinates = (lat: number, lng: number) => {
  const MARGARITA_BOUNDS = { minLat: 10.8, maxLat: 11.2, minLng: -64.5, maxLng: -63.7 };

  if (lat < MARGARITA_BOUNDS.minLat || lat > MARGARITA_BOUNDS.maxLat) {
    console.warn(`[GeoService] Ubicación detectada fuera de Margarita: ${lat}, ${lng}. Activando modo roaming global.`);
    return { lat, lng };
  }
  return { lat, lng };
};

/**
 * Filtro de Suavizado Exponencial (Filtro Paso Bajo / Kalman Simplificado)
 * Mitiga saltos de GPS bruscos (jitter) en dispositivos móviles del cliente.
 * @param lastCoords [lat, lng] anterior
 * @param newCoords [lat, lng] entrante
 * @param alpha Factor de suavizado (0 a 1). Valores menores dan más suavidad pero más inercia.
 */
export const smoothCoordinates = (
  lastCoords: [number, number],
  newCoords: [number, number],
  alpha: number = 0.35
): [number, number] => {
  const lat = lastCoords[0] + alpha * (newCoords[0] - lastCoords[0]);
  const lng = lastCoords[1] + alpha * (newCoords[1] - lastCoords[1]);
  return [lat, lng];
};

/**
 * Validador de Velocidad y Desplazamiento Anómalo
 * Previene saltos irracionales (teletransportación) ocasionados por rebotes en edificios u obstrucciones de señal.
 * @param lastCoords [lat, lng] anterior
 * @param newCoords [lat, lng] actual
 * @param timeSeconds Tiempo transcurrido en segundos
 * @param maxSpeedKmh Límite de velocidad razonable, por defecto 120 km/h para transporte terrestre urbano
 */
export const isDisplacementAnomalous = (
  lastCoords: [number, number],
  newCoords: [number, number],
  timeSeconds: number,
  maxSpeedKmh: number = 120
): boolean => {
  if (timeSeconds <= 0) return false;

  // Calcular distancia geodésica simplificada rápida
  const R = 6371; // Radio terrestre en km
  const dLat = ((newCoords[0] - lastCoords[0]) * Math.PI) / 180;
  const dLng = ((newCoords[1] - lastCoords[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lastCoords[0] * Math.PI) / 180) *
      Math.cos((newCoords[0] * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;

  const speedKmh = (distanceKm / (timeSeconds / 3600));

  // Si la velocidad excede el umbral terrestre de respuesta ágil en la ciudad, se marca como ruido
  return speedKmh > maxSpeedKmh;
};

/**
 * Hash Espacial (Spatial Hashing)
 * Segmenta coordenadas en rejillas rectangulares homogéneas compartidas para agrupar consultas de manera ultra-rápida.
 * Reemplaza consultas complejas de rango trigonométrico O(n) por accesos directos indexables en claves de Firestore.
 * @param lat Latitud
 * @param lng Longitud
 * @param precision Tamaño de celda en grados (~0.01 son aprox 1.1 km a nivel del ecuador)
 */
export const computeSpatialHashKey = (
  lat: number,
  lng: number,
  precision: number = 0.01
): string => {
  const roundedLat = Math.round(lat / precision);
  const roundedLng = Math.round(lng / precision);
  return `geo_${roundedLat}_${roundedLng}`;
};
