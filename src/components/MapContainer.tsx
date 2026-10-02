import React, { useEffect, useState } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface MapContainerProps {
  customCoords?: [number, number];
  children?: React.ReactNode;
  center: [number, number];
  zoom: number;
  zoomControl?: boolean;
  className?: string;
  style?: React.CSSProperties;
  preferCanvas?: boolean;
  onLocationUpdate?: (pos: [number, number]) => void;
}

export default function MapContainer(props: MapContainerProps) {
  // Lechería como origen nativo
  const INITIAL_POS: [number, number] = [10.2117, -64.6735];
  const [coords, setCoords] = useState<[number, number]>(props.center || INITIAL_POS);

  useEffect(() => {
    // Rastreo continuo de posición
    let watchId: number;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setCoords(newPos);
          if (props.onLocationUpdate) {
            props.onLocationUpdate(newPos);
          }
        },
        (err) => console.log('Error GPS continuo:', err),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
    return () => {
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
    };
  }, [props.onLocationUpdate]);

  return (
    <LeafletMapContainer
      {...props}
      center={coords}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      {props.children}
    </LeafletMapContainer>
  );
}
