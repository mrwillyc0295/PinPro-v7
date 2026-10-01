import { Helmet } from 'react-helmet-async';
import { ArrowLeft, MapPin, Star, Receipt, Zap, AlertTriangle, Loader2 } from 'lucide-react';
import { useNavigate, useParams, useLocation as useRouterLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const clientIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

function MapFocus({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 15);
  }, [center, map]);
  return null;
}

export default function EmergencyRequest() {
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();

  const [professional, setProfessional] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [location, setLocation] = useState<{ lat: number, lng: number, address: string }>({
    lat: 19.366,
    lng: -99.177,
    address: "Av. Insurgentes Sur 1458, CDMX"
  });

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation(prev => ({
          ...prev,
          lat: latitude,
          lng: longitude,
          address: `Lat ${latitude.toFixed(4)}, Lng ${longitude.toFixed(4)}`
        }));
        try {
          // Attempting to reverse geocode with nominatim
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
          const data = await response.json();
          if (data && data.address) {
            // Build a cleaner address
            const addr = data.address;
            const street = addr.road || addr.pedestrian || addr.suburb || "Calle Desconocida";
            const city = addr.city || addr.town || addr.village || addr.county || "";
            const cleanAddress = [street, city].filter(Boolean).join(", ");
            setLocation(prev => ({ ...prev, address: cleanAddress || data.display_name || "Ubicación Detectada" }));
          } else if (data && data.display_name) {
             setLocation(prev => ({ ...prev, address: data.display_name }));
          }
        } catch (e) {
          console.warn("Geocoding failed, keeping coords.", e);
        } finally {
          setIsLocating(false);
        }
      }, (error) => {
        setIsLocating(false);
        console.warn("Geolocation permission denied or error:", error);
      }, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    }
  };

  const handleMarkerDragEnd = async (e: any) => {
    const marker = e.target;
    if (marker) {
      const position = marker.getLatLng();
      const { lat, lng } = position;
      setLocation(prev => ({
        ...prev,
        lat: lat,
        lng: lng,
        address: "Buscando dirección..."
      }));
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
        const data = await response.json();
        if (data && data.address) {
          const addr = data.address;
          const street = addr.road || addr.pedestrian || addr.suburb || "Calle Desconocida";
          const city = addr.city || addr.town || addr.village || addr.county || "";
          const cleanAddress = [street, city].filter(Boolean).join(", ");
          setLocation(prev => ({ ...prev, address: cleanAddress || data.display_name || "Ubicación Seleccionada" }));
        } else if (data && data.display_name) {
          setLocation(prev => ({ ...prev, address: data.display_name }));
        }
      } catch (err) {
        console.warn("Geocoding failed, keeping coords.", err);
        setLocation(prev => ({ ...prev, address: `Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}` }));
      }
    }
  };

  useEffect(() => {
    handleGetLocation();

    const fetchProfessional = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'profesionales', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProfessional({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching professional:", error);
        handleFirestoreError(error, OperationType.GET, `profesionales/${id}`);
      } finally {
        setLoading(false);
      }
    };
    fetchProfessional();
  }, [id]);

  const handleConfirmEmergency = async () => {
    if (!user) {
      navigate('/login', { state: { from: routerLocation.pathname } });
      return;
    }

    if (!professional) return;

    try {
      setConfirming(true);

      // LOG: Aquí se registraría la emergencia.
      // El profesional recibe esta notificación en tiempo real (Firebase onSnapshot)
      console.log("Confirmando emergencia para:", professional.id);

      // Create emergency request in the new collection
      const emergencyData = {
        clientId: user.uid,
        clientName: profile?.name || user.displayName || 'Usuario PinPro',
        clientLocation: {
          lat: location.lat,
          lng: location.lng,
          address: location.address
        },
        professionalId: professional.id,
        professionalName: professional.name,
        serviceType: professional.profession || 'Servicio de Emergencia',
        status: 'pending',
        estimatedCost: 700,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      try {
        const docRef = await addDoc(collection(db, 'emergencies'), emergencyData);
        // Navigate to tracking
        navigate(`/tracking/${docRef.id}`);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'emergencies');
      }
    } catch (error: any) {
      console.error("Error creating emergency request:", error);
      alert('Error al enviar la solicitud. Inténtalo de nuevo.');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black">
        <div className="text-red-600 animate-pulse font-black tracking-widest italic">CARGANDO PROTOCOLO...</div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-black gap-4 p-8 text-center">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mb-2" />
        <div className="text-white font-black text-xl italic uppercase tracking-tighter">Profesional no disponible para emergencias</div>
        <button onClick={() => navigate(-1)} className="mt-4 px-8 py-3 bg-white/5 border border-white/20 text-white font-bold rounded-xl hover:bg-white/10 transition-colors uppercase tracking-widest text-xs">Volver a Selección</button>
      </div>
    );
  }

  return (
    <div className="bg-black font-sans min-h-screen flex justify-center w-full selection:bg-[#ef4343] selection:text-white overflow-hidden">
      <Helmet>
        <title>Emergencia: {professional.profession || 'Servicio'} | PinPro</title>
        <meta name="description" content={`Solicita ayuda urgente de ${professional.name}, ${professional.profession || 'profesional'} en PinPro.`} />
      </Helmet>
      <div className="w-full max-w-3xl h-full min-h-screen relative flex flex-col md:shadow-2xl overflow-y-auto overflow-x-hidden border-x border-white/5 pb-44">

        {/* Ambient Glow Background */}
        <div className="fixed top-0 left-0 right-0 h-[60vh] bg-gradient-to-b from-red-600/10 via-red-600/5 to-transparent pointer-events-none z-0"></div>

        {/* Header */}
        <header className="flex items-center justify-between px-4 pt-12 pb-6 z-10 sticky top-0 bg-black/80 backdrop-blur-xl border-b border-white/5">
          <div className="w-14 h-14 shrink-0" />
          <h1 className="text-white text-base font-black tracking-widest uppercase italic">Confirmar Emergencia</h1>
          <div className="w-14 h-14 shrink-0" />
        </header>

        {/* Main Content */}
        <main className="flex-1 px-5 py-6 flex flex-col gap-8 z-10 relative">

          {/* Siren Alert Section - Compacted */}
          <div className="flex items-center gap-6 py-4 bg-white/5 rounded-[40px] px-6 border border-white/10">
            <div className="relative flex items-center justify-center shrink-0">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-800 rounded-2xl flex items-center justify-center text-white shadow-[0_0_30px_rgba(255,0,0,0.5)] z-10 relative rotate-12">
                <AlertTriangle className="w-8 h-8" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tighter italic">¡Emergencia Detectada!</h2>
              <p className="text-red-500 font-black text-[10px] uppercase tracking-[0.2em] mt-1 animate-pulse">Solicitud de alta prioridad</p>
            </div>
          </div>

          {/* Section 1: Professional */}
          <section className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[40px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
            <div className="flex items-center gap-6">
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-full bg-white/10 overflow-hidden ring-2 ring-red-500/50 shadow-2xl p-0.5">
                  <img alt="Professional" className="w-full h-full object-cover rounded-full" src={professional.photoUrl || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150"} />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-white font-bold text-lg">{professional.name}</h4>
                <p className="text-[#00FFFF] text-xs font-bold uppercase tracking-[0.2em]">{professional.profession || 'Profesional'}</p>
                <div className="mt-2 text-yellow-400 text-[10px] font-black flex items-center gap-1 bg-yellow-400/10 px-2 py-0.5 rounded-lg w-min border border-yellow-400/20">
                  <Star className="w-3 h-3 fill-current" />
                  <span>4.9</span>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center bg-white/5 p-2 rounded-2xl border border-white/5">
                <span className="block text-3xl leading-none font-black text-blue-500 tracking-tighter italic drop-shadow-[0_0_15px_rgba(59,130,246,0.4)]">12</span>
                <span className="block text-[8px] font-black uppercase tracking-widest text-white/40 mt-1">MIN</span>
              </div>
            </div>
          </section>

          {/* Section 2: Ubicación */}
          <section className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[40px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-blue-500/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-black text-xs uppercase tracking-[0.2em]">Ubicación del Servicio</h3>
                <span className="text-[9px] text-[#4db8ff] block mt-0.5 font-semibold">📍 Arrastra el pin para precisión absoluta</span>
              </div>
              <button
                onClick={handleGetLocation}
                disabled={isLocating}
                className="text-[10px] font-bold px-3 py-1 bg-[#1a3a5a] text-[#4db8ff] rounded-full uppercase active:scale-95 disabled:opacity-60 transition-all font-sans cursor-pointer hover:bg-[#204970] hover:text-[#7fd2ff]"
              >
                {isLocating ? "..." : "Actualizar"}
              </button>
            </div>
            <div className="relative w-full h-40 rounded-3xl overflow-hidden bg-slate-900 mb-4 border border-white/10 shadow-inner">
              <MapContainer
                center={[location.lat, location.lng]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <Marker
                  position={[location.lat, location.lng]}
                  icon={clientIcon}
                  draggable={true}
                  eventHandlers={{
                    dragend: handleMarkerDragEnd
                  }}
                />
                <MapFocus center={[location.lat, location.lng]} />
              </MapContainer>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-white/50 uppercase font-black tracking-wider">Detalles de Dirección / Referencias</label>
              <textarea
                value={location.address}
                onChange={(e) => setLocation(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Ingresa la calle, número, apartamento o referencias para que el profesional llegue rápido..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm font-bold leading-tight focus:outline-none focus:border-[#00FFFF] transition-all placeholder:text-white/30 resize-none h-20"
              />
            </div>
            <style>{`
              .leaflet-container {
                filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
              }
            `}</style>
          </section>

          {/* Section 3: Cost Summary */}
          <section className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[40px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)] mb-10">
            <div className="p-6 bg-red-900/20 border-b border-white/5">
              <h3 className="text-white font-black text-xs uppercase tracking-[0.2em]">Resumen de Costos</h3>
            </div>
            <div className="p-7 flex flex-col gap-4">
              <div className="flex justify-between items-center text-white/60 text-sm font-bold">
                <span>Servicio Base</span>
                <span className="text-white font-mono">$450.00</span>
              </div>
              <div className="flex justify-between items-center text-red-500 font-bold text-xs uppercase italic">
                <span>Cargo por Urgencia</span>
                <span className="font-mono text-sm">+$250.00</span>
              </div>
              <div className="h-px bg-white/10 my-2" />
              <div className="flex justify-between items-end">
                <span className="text-white/40 text-xs font-bold uppercase">Total Estimado</span>
                <span className="text-4xl font-black text-white font-mono">$700.00</span>
              </div>
            </div>
          </section>
        </main>

        {/* Fixed Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-50 p-6 bg-black/95 backdrop-blur-2xl border-t border-white/5 flex flex-col gap-4 w-full max-w-3xl mx-auto pb-safe shadow-[0_-20px_50px_rgba(0,0,0,0.9)]">
          <button
            onClick={handleConfirmEmergency}
            disabled={confirming}
            className="group relative w-full h-[72px] bg-[#FACC15] text-black font-black text-lg rounded-3xl overflow-hidden transition-all duration-300 hover:scale-[1.03] disabled:opacity-50 flex items-center justify-center gap-4 uppercase tracking-[0.15em] italic border-2 border-white/20"
          >
            {confirming ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : (
              <Zap className="w-8 h-8 fill-current animate-bounce" />
            )}
            <span className="drop-shadow-sm">{confirming ? 'PROCESANDO...' : 'CONFIRMAR EMERGENCIA'}</span>
          </button>
          <button
            onClick={() => navigate(-1)}
            disabled={confirming}
            className="w-full py-2 text-white/30 text-[10px] uppercase font-black tracking-[0.5em] hover:text-white transition-colors"
          >
            Anular Emergencia
          </button>
        </div>
      </div>

    </div>
  );
}
