const TILE_CACHE_NAME = 'pinpro-offline-tiles-v1';

// slippy map conversion formulas
function lon2tile(lon: number, zoom: number): number {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

function lat2tile(lat: number, zoom: number): number {
  return Math.floor(
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
      Math.pow(2, zoom)
  );
}

export const MARGARITA_ZONES = [
  {
    name: 'Isla de Margarita (Vista General)',
    description: 'Vistas panorámicas completas a nivel regional de toda la isla para navegación general.',
    bounds: {
      sw: [10.92, -64.42] as [number, number],
      ne: [11.18, -63.75] as [number, number],
    },
    zooms: [11, 12, 13],
  },
  {
    name: 'Porlamar (Comercio y Centro)',
    description: 'Zona de alto tráfico comercial: Avenidas 4 de Mayo, Santiago Mariño y casco central.',
    bounds: {
      sw: [10.940, -63.880] as [number, number],
      ne: [10.970, -63.830] as [number, number],
    },
    zooms: [14, 15],
  },
  {
    name: 'Pampatar y Playa El Ángel',
    bounds: {
      sw: [10.970, -63.825] as [number, number],
      ne: [11.000, -63.785] as [number, number],
    },
    description: 'Hoteles premium, centros comerciales y zonas gastronómicas con alta demanda de servicios.',
    zooms: [14, 15],
  },
  {
    name: 'Juan Griego',
    description: 'La bahía histórica del norte con importante afluencia turística e intercambios comerciales.',
    bounds: {
      sw: [11.065, -63.980] as [number, number],
      ne: [11.095, -63.945] as [number, number],
    },
    zooms: [14, 15],
  },
  {
    name: 'Playa El Agua y El Tirano',
    description: 'Bulevar turístico costero con alta afluencia de servicios de hospitalidad y recreación.',
    bounds: {
      sw: [11.125, -63.825] as [number, number],
      ne: [11.160, -63.795] as [number, number],
    },
    zooms: [14, 15],
  },
  {
    name: 'La Asunción',
    description: 'Casco histórico colonial de la Capital del estado con densa actividad institucional y vecinal.',
    bounds: {
      sw: [11.015, -63.880] as [number, number],
      ne: [11.045, -63.845] as [number, number],
    },
    zooms: [14, 15],
  }
];

export async function prefetchMargaritaTiles(
  onProgress?: (carried: number, total: number, url?: string) => void
): Promise<void> {
  if (typeof window === 'undefined' || !window.caches) {
    console.warn('[Prefetch] Cache API no está disponible en este entorno.');
    return;
  }

  const cache = await window.caches.open(TILE_CACHE_NAME);
  const urls: string[] = [];

  // 1. generate URLs for optimal grid
  for (const zone of MARGARITA_ZONES) {
    for (const zoom of zone.zooms) {
      const minLat = zone.bounds.sw[0];
      const maxLat = zone.bounds.ne[0];
      const minLon = zone.bounds.sw[1];
      const maxLon = zone.bounds.ne[1];

      // Conversion to OS tile coordinates
      const x1 = lon2tile(minLon, zoom);
      const x2 = lon2tile(maxLon, zoom);
      const y1 = lat2tile(maxLat, zoom);
      const y2 = lat2tile(minLat, zoom);

      const xStart = Math.min(x1, x2);
      const xEnd = Math.max(x1, x2);
      const yStart = Math.min(y1, y2);
      const yEnd = Math.max(y1, y2);

      for (let x = xStart; x <= xEnd; x++) {
        for (let y = yStart; y <= yEnd; y++) {
          urls.push(`https://a.basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${x}/${y}.png`);
        }
      }
    }
  }

  // Deduplicate URLs
  const uniqueUrls = Array.from(new Set(urls));
  const total = uniqueUrls.length;
  let carried = 0;

  console.log(`[Prefetching] Iniciando descarga controlada para Margarita: ${total} Tiles.`);

  // Stagger downloads in small batches to respect client device sockets and avoid rate limiting
  const batchSize = 6;
  for (let i = 0; i < total; i += batchSize) {
    const batch = uniqueUrls.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (url) => {
        try {
          const match = await cache.match(url);
          if (!match) {
            const response = await fetch(url, { mode: 'cors', cache: 'no-store' });
            if (response.ok) {
              await cache.put(url, response.clone());
            }
          }
        } catch (err) {
          // Ignorar fallas técnicas de tiles individuales (firewalls, cortes de red temporarios)
        } finally {
          carried++;
          if (onProgress) {
            onProgress(carried, total, url);
          }
        }
      })
    );
    // Pausa técnica para evitar congestionar el canal de red
    await new Promise((resolve) => setTimeout(resolve, 30));
  }

  // Persistir metadatos de sincronizado exitoso en LocalStorage
  localStorage.setItem('margarita_prefetch_completed', 'true');
  localStorage.setItem('margarita_prefetch_timestamp', new Date().toISOString());
  localStorage.setItem('margarita_prefetch_count', total.toString());
}

export async function getCachedTilesCount(): Promise<{ count: number; sizeMB: number }> {
  try {
    if (typeof window === 'undefined' || !window.caches) {
      return { count: 0, sizeMB: 0 };
    }
    const cache = await window.caches.open(TILE_CACHE_NAME);
    const keys = await cache.keys();
    // Estimación empírica segura de 12.5 KB por tile PNG
    const sizeEstimated = (keys.length * 12.5) / 1024;
    return { count: keys.length, sizeMB: parseFloat(sizeEstimated.toFixed(2)) };
  } catch (err) {
    console.error('Error al contar caché físico de mapas:', err);
    return { count: 0, sizeMB: 0 };
  }
}

export async function clearTileCache(): Promise<void> {
  try {
    if (typeof window !== 'undefined' && window.caches) {
      await window.caches.delete(TILE_CACHE_NAME);
      localStorage.removeItem('margarita_prefetch_completed');
      localStorage.removeItem('margarita_prefetch_timestamp');
      localStorage.removeItem('margarita_prefetch_count');
      console.log('[Prefetch] Caché de mapa purgado con éxito.');
    }
  } catch (err) {
    console.error('Error al purgar caché físico de mapas:', err);
  }
}

/**
 * Función heredada compatible si se requiere simular rutas específicas.
 */
export async function downloadRouteTiles(
  pointA: [number, number],
  pointB: [number, number],
  minZoom = 13,
  maxZoom = 15
) {
  try {
    if (typeof window === 'undefined' || !window.caches) return;
    const cache = await window.caches.open(TILE_CACHE_NAME);
    const urlsToCache: string[] = [];

    const minLat = Math.min(pointA[0], pointB[0]);
    const maxLat = Math.max(pointA[0], pointB[0]);
    const minLon = Math.min(pointA[1], pointB[1]);
    const maxLon = Math.max(pointA[1], pointB[1]);

    for (let z = minZoom; z <= maxZoom; z++) {
      const x1 = lon2tile(minLon, z);
      const x2 = lon2tile(maxLon, z);
      const y1 = lat2tile(maxLat, z);
      const y2 = lat2tile(minLat, z);

      for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
        for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
          const url = `https://a.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`;
          urlsToCache.push(url);
        }
      }
    }

    urlsToCache.forEach(async (url) => {
      try {
        const match = await cache.match(url);
        if (!match) {
          const response = await fetch(url, { mode: 'cors' });
          if (response.ok) {
            await cache.put(url, response.clone());
          }
        }
      } catch (e) {
        // Ignorar
      }
    });
  } catch (error) {
    console.error("Fallo al preparar memoria offline de ruta:", error);
  }
}
