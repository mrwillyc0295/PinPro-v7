import { useState } from 'react';
import { useMap } from 'react-leaflet';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

const LocationController = () => {
  const map = useMap();
  const [address, setAddress] = useState("Esperando ubicación...");
  const [loading, setLoading] = useState(false);

  const handleGPSUpdate = () => {
    if (!navigator.geolocation) return alert("GPS no soportado");

    setLoading(true);
    setAddress("Solicitando acceso a ubicación...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // 1. Centrar el mapa
        map.setView([latitude, longitude], 16, { animate: true });

        // 2. Reverse geocoding
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const formattedAddress = `${data.address.road || 'Calle desconocida'}, ${data.address.city || data.address.town || ''}`;
          setAddress(formattedAddress);
        } catch (err) {
          setAddress("Dirección no encontrada");
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
            setAddress("Ubicación denegada. Por favor, habilítala en la configuración de tu navegador.");
        } else {
            setAddress("Error al obtener la ubicación.");
        }
        console.error("Geolocation error:", error);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="absolute top-4 right-4 z-[1000] bg-surface-lowest/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-primary-container/20 w-64">
      {/* Header controls */}
      <div className="flex justify-between items-center pb-2 border-b border-primary-container/10">
        <span className="text-[10px] font-bold text-primary-container tracking-wider flex items-center gap-1">
          <MapPin size={12} /> UBICACIÓN
        </span>
        <button
          onClick={handleGPSUpdate}
          className="bg-primary-container/10 text-primary-container text-[11px] font-bold py-1 px-3 rounded-full hover:bg-primary-container hover:text-surface-lowest transition-all shadow-[0_0_10px_rgba(0,255,255,0.2)] disabled:opacity-50"
          disabled={loading}
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : "ACTUAL"}
        </button>
      </div>

      {/* Address panel */}
      <div className="mt-3">
        <p className="text-[10px] text-on-surface-variant uppercase tracking-wide mb-1">DIRECCIÓN DETECTADA</p>
        <p className="text-sm text-on-surface font-medium italic mb-2 break-words">
          {address}
        </p>
        <p className="text-[9px] text-on-surface-variant font-bold flex items-center gap-1">
          <Navigation size={9} /> GPS HABILITADO
        </p>
      </div>
    </div>
  );
};

export default LocationController;
