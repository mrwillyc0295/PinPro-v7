import React, { useState, useMemo, useCallback } from 'react';
import { useRadarProximidad } from '../hooks/useRadarProximidad';

const MapaPinPro = () => {
  // Ubicación del usuario (ejemplo simulado en El Tigre, Anzoátegui)
  const [miUbicacion, setMiUbicacion] = useState({ lat: 8.8875, lng: -64.2450 });
  const [radarActivo, setRadarActivo] = useState(false);

  // Lista simulada de profesionales que viene de tu backend
  const profesionales = useMemo(() => [
    {
      id: 'usr_1',
      fullName: 'Carlos Mendoza',
      oficio: 'Electricista',
      lat: 8.8885, // Muy cerca
      lng: -64.2460,
      certification: { isCertified: true } // Pasará el filtro
    },
    {
      id: 'usr_2',
      fullName: 'Ana Torres',
      oficio: 'Plomero',
      lat: 8.8950, // Más lejos, fuera del radio de 500m
      lng: -64.2500,
      certification: { isCertified: true }
    }
  ], []);

  // Ejecutamos el Hook. Pasamos 500 metros como límite.
  const { limpiarMemoriaRadar } = useRadarProximidad(
    radarActivo ? miUbicacion : null,
    profesionales,
    500
  );

  const toggleRadar = useCallback(() => {
    if (radarActivo) {
        limpiarMemoriaRadar();
    }
    setRadarActivo(!radarActivo);
  }, [radarActivo, limpiarMemoriaRadar]);

  return (
    <div className="p-4 flex flex-col items-center">
      <h2 className="text-xl font-bold mb-4">Mapa de Servicios Pin Pro</h2>

      {/* Botón crucial: Los navegadores exigen interacción del usuario antes de reproducir audio */}
      <button
        onClick={toggleRadar}
        className={`px-6 py-3 rounded-lg text-white ${radarActivo ? 'bg-red-500' : 'bg-green-500'}`}
      >
        {radarActivo ? 'Apagar Radar de Voz' : 'Encender Radar de Voz'}
      </button>

      {/* Aquí iría el componente visual de tu mapa (Google Maps, Mapbox, Leaflet, etc.) */}
      <div className="mt-8 w-full h-64 bg-gray-200 flex items-center justify-center rounded-lg shadow-inner">
        <p className="text-gray-500">Visualización del Mapa...</p>
      </div>
    </div>
  );
};

export default MapaPinPro;
