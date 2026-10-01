import React, { useEffect, useState } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapContainerProps {
  customCoords?: [number, number];
  children?: React.ReactNode;
  center?: [number, number];
  zoom?: number;
  zoomControl?: boolean;
  className?: string;
  style?: React.CSSProperties;
  preferCanvas?: boolean;
  onLocationUpdate?: (pos: [number, number]) => void;
  showLiveUserMarker?: boolean;
}

// Componente para re-centrar suavemente el mapa si la posición cambia
function MapCenterController({ coords }: { coords: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords[0] !== 0 && coords[1] !== 0) {
      map.setView(coords, map.getZoom(), { animate: true });
    }
  }, [coords, map]);
  return null;
}

// Icono animado de pulso para la ubicación en vivo
const pulseIcon = L.divIcon({
  className: 'user-location-marker',
  html: '<div class="pulse-marker"><div class="inner-dot"></div></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

export default function MapContainer({
  customCoords,
  children,
  center,
  zoom = 13,
  zoomControl = true,
  className,
  style,
  preferCanvas = true,
  onLocationUpdate,
  showLiveUserMarker = true,
  ...restProps
}: MapContainerProps) {
  // Isla Margarita como origen por defecto estable
  const MARGARITA_POS: [number, number] = [10.9577, -63.8697];
  const initialCenter = customCoords || center || MARGARITA_POS;

  const [coords, setCoords] = useState<[number, number]>(initialCenter);
  const [hasGpsFix, setHasGpsFix] = useState<boolean>(false);

  useEffect(() => {
    if (customCoords) {
      setCoords(customCoords);
    }
  }, [customCoords]);

  useEffect(() => {
    let watchId: number;
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setCoords(newPos);
          setHasGpsFix(true);
          if (onLocationUpdate) {
            onLocationUpdate(newPos);
          }
        },
        (err) => {
          console.warn('Rastreo GPS continuo inaccesible, usando ubicación fallback/por defecto:', err.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    }
    return () => {
      if (watchId !== undefined && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [onLocationUpdate]);

  return (
    <LeafletMapContainer
      center={coords}
      zoom={zoom}
      zoomControl={zoomControl}
      className={className}
      style={style}
      preferCanvas={preferCanvas}
      {...restProps}
    >
      <MapCenterController coords={coords} />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      {showLiveUserMarker && (
        <Marker position={coords} icon={pulseIcon}>
          <Popup>
            <div className="text-xs font-semibold text-gray-900 dark:text-white">
              {hasGpsFix ? '📍 Tu ubicación en vivo' : '📍 Ubicación base (Margarita)'}
            </div>
          </Popup>
        </Marker>
      )}
      {children}
    </LeafletMapContainer>
  );
}
