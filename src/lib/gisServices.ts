import * as turf from '@turf/turf';
import { point } from '@turf/helpers';

// Polígonos simplificados (Bounding Boxes) para validación rápida en cliente (Offline)
// Evita consultas de reverse-geocoding innecesarias a IPs fuera de rango.
export const HISPANIC_REGIONS = {
  SPAIN: turf.bboxPolygon([-9.4, 35.8, 4.4, 43.8]), // [minX, minY, maxX, maxY]
  LATAM: turf.bboxPolygon([-118.4, -56.0, -34.8, 32.7]),
  // Exclusiones gruesas como Brasil y Guayanas (opcional usar polígonos más exactos, pero esto es un pre-filtro)
};

/**
 * Valida si una coordenada está dentro de las regiones permitidas (España o LATAM).
 * @param lat Latitud
 * @param lng Longitud
 * @returns boolean
 */
export function isValidServiceArea(lat: number, lng: number): boolean {
  const userPt = point([lng, lat]);
  const inSpain = turf.booleanPointInPolygon(userPt, HISPANIC_REGIONS.SPAIN);
  const inLatam = turf.booleanPointInPolygon(userPt, HISPANIC_REGIONS.LATAM);

  return inSpain || inLatam;
}

/**
 * Calcula la distancia exacta usando la fórmula Haversine (TurfJS)
 * ejecutada 100% en el cliente para no asfixiar el backend.
 * @param origin [lat, lng]
 * @param destination [lat, lng]
 * @returns distance in kilometers
 */
export function calculatePreciseDistance(origin: [number, number], destination: [number, number]): number {
  const from = point([origin[1], origin[0]]); // Turf usa [lng, lat]
  const to = point([destination[1], destination[0]]);

  return turf.distance(from, to, { units: 'kilometers' });
}

/**
 * Filtra y devuelve un arreglo procesado con las distancias de los profesionales.
 */
export function getNearbyProfessionals(
  userLocation: [number, number],
  professionals: Array<{ id: string; location: [number, number] }>,
  maxRadiusKm: number = 50
) {
  return professionals
    .map(pro => {
      const distance = calculatePreciseDistance(userLocation, pro.location);
      return { ...pro, distance };
    })
    .filter(pro => pro.distance <= maxRadiusKm)
    .sort((a, b) => a.distance - b.distance);
}
