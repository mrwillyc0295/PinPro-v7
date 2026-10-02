import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Calendar as CalendarIcon, Clock, MapPin, CreditCard, CheckCircle2, Wrench, AlertTriangle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { notificationService } from '../services/notificationService';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { opcionesMapa } from '../lib/mapOptions';

// Fix Leaflet marker icon issue
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapEvents({ setCoordinates, setLocation }: { setCoordinates: any, setLocation: any }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      setCoordinates({ lat, lng });
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        if (data && data.display_name) {
          setLocation(data.display_name);
        }
      } catch (error) {
        console.error("Error reverse geocoding:", error);
      }
    },
  });
  return null;
}

export default function Booking() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();

  const [proData, setProData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'pending_approval'>('idle');

  useEffect(() => {
    const fetchPro = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'profesionales', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProData({ id: docSnap.id, ...data });
          if (data.services && data.services.length > 0) {
            setSelectedService(data.services[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching pro:", error);
        handleFirestoreError(error, OperationType.GET, `profesionales/${id}`);
      } finally {
        setLoading(false);
      }
    };
    fetchPro();
  }, [id]);

  const handleBooking = async () => {
    if (!user || !profile) {
      alert("Debes iniciar sesión para reservar.");
      return;
    }
    if (!date || !time || !location) {
      alert("Por favor completa fecha, hora y ubicación.");
      return;
    }

    setIsSubmitting(true);
    try {
      const reservationData = {
        clientId: user.uid,
        clientName: profile.name,
        proId: proData.id,
        proName: proData.name,
        proProfession: proData.profession || 'Profesional',
        serviceTitle: selectedService ? selectedService.title : 'Servicio General',
        servicePrice: selectedService ? selectedService.price : 'A convenir',
        date: `${date} ${time}`,
        location: location,
        coordinates: coordinates ? { lat: coordinates.lat, lng: coordinates.lng } : null,
        status: 'pending', // pending, active, completed, cancelled
        createdAt: serverTimestamp()
      };

      let docRef;
      try {
        docRef = await addDoc(collection(db, 'reservations'), reservationData);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'reservations');
      }

      // Notify the professional
      if (docRef) {
        await notificationService.create({
          userId: proData.id,
          type: 'booking_new',
          title: 'Nueva Solicitud de Reserva',
          message: `${profile.name} ha solicitado un servicio de ${selectedService ? selectedService.title : 'Servicio General'}.`,
          relatedId: docRef.id
        });
      }

      setStatus('pending_approval');
    } catch (error: any) {
      console.error("Error creating reservation:", error);
      let message = "Hubo un error al crear la reserva.";
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.error.includes('insufficient permissions')) {
          message += "\n\nError de permisos: Asegúrate de que tu perfil esté completo.";
        }
      } catch (e) {
        // Not a JSON error
      }
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-surface-lowest">
        <div className="text-primary-container animate-pulse">Cargando detalles...</div>
      </div>
    );
  }

  if (!proData) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-surface-lowest gap-4">
        <div className="text-on-surface-variant">Profesional no encontrado</div>
        <button onClick={() => navigate(-1)} className="text-primary-container font-bold">Volver</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface-lowest text-on-surface">
      <Helmet>
        <title>Reserva: {proData?.name} | PinPro</title>
        <meta name="description" content={`Reserva un servicio con ${proData?.name}, ${proData?.profession || 'profesional'} en PinPro.`} />
      </Helmet>
       {/* Header */}
      <header className="px-6 pt-12 pb-4 sticky top-0 z-10 bg-surface-lowest/80 backdrop-blur-xl border-b border-surface-highest flex items-center justify-between">
        <div className="w-14 h-14 shrink-0" />
        <h1 className="text-xl font-display font-bold">Confirmar Reserva</h1>
        <div className="w-10 h-10 shrink-0" />
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Professional Info */}
        <section className="flex items-center gap-4 bg-surface-container p-4 rounded-3xl border border-primary-container/20">
          <img
            src={proData.photoUrl || "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=150&h=150"}
            alt={proData.name}
            className="w-16 h-16 rounded-full object-cover border border-primary-container/50"
          />
          <div>
            <h2 className="font-display font-bold text-lg">{proData.name}</h2>
            <p className="text-primary-container text-sm font-medium">{proData.profession || 'Profesional'}</p>
          </div>
        </section>

        {/* Service Details */}
        <section className="space-y-4">
          <h3 className="text-lg font-display font-semibold flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary-container" />
            Detalles del Servicio
          </h3>
          {proData.services && proData.services.length > 0 ? (
            <div className="space-y-3">
              {proData.services.map((service: any) => (
                <div
                  key={service.id}
                  onClick={() => setSelectedService(service)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedService?.id === service.id ? 'bg-primary-container/10 border-primary-container shadow-[0_0_15px_rgba(0,255,255,0.2)]' : 'bg-surface-container border-outline-variant/50 hover:border-primary-container/50'}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-on-surface">{service.title}</span>
                    <span className="font-bold text-primary-container">${service.price} {service.unit}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">{service.desc}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface-container rounded-3xl p-4 space-y-4 border border-outline-variant/50">
               <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Servicio</span>
                <span className="font-medium">Servicio General</span>
              </div>
              <div className="h-px bg-surface-highest w-full" />
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Precio Base</span>
                <span className="font-medium">A convenir</span>
              </div>
            </div>
          )}
        </section>

        {/* Request Engine -> Two Modes */}
        {status === 'idle' && (
          <div className="space-y-6 mt-6 pb-20">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-display font-bold text-on-surface">¿Qué tan rápido nos necesitas?</h3>
              <p className="text-sm text-on-surface-variant">Elige la modalidad del servicio</p>
            </div>

            {/* URGENCY BLOCK */}
            <button
              onClick={() => navigate(`/emergency/${proData?.id}`)}
              className="w-full text-left relative overflow-hidden group bg-gradient-to-br from-yellow-400/10 to-amber-500/10 border border-yellow-500/50 hover:bg-yellow-400/20 p-5 rounded-3xl transition-all shadow-[0_0_20px_rgba(250,204,21,0.15)]"
            >
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(250,204,21,0.5)]">
                  <span className="text-3xl animate-pulse">🚨</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-yellow-500 uppercase tracking-wide group-hover:text-yellow-400 transition-colors drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]">Urgencia Inmediata</h3>
                  <p className="text-xs text-on-surface-variant mt-1 font-medium leading-relaxed">Conectamos con {proData?.name.split(' ')[0]} lo más rápido posible. Aplican tarifas de emergencia.</p>
                </div>
              </div>
            </button>

            {/* RESERVATION BLOCK */}
            <div className="bg-surface-container/30 border border-primary-container/30 p-5 rounded-3xl space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-full bg-primary-container/20 flex items-center justify-center shrink-0">
                  <span className="text-3xl">📅</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-primary-container uppercase tracking-wide">Reserva Programada</h3>
                  <p className="text-xs text-on-surface-variant mt-1 font-medium leading-relaxed">Elige el día y la hora que mejor te convenga para el servicio.</p>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3 pt-2 relative z-10">
                <div className="flex flex-col bg-surface-container p-3 rounded-2xl border border-outline-variant/30 focus-within:border-primary-container transition-colors">
                  <label className="text-[10px] text-on-surface-variant uppercase font-bold mb-1">Fecha</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm font-medium text-on-surface w-full"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                <div className="flex flex-col bg-surface-container p-3 rounded-2xl border border-outline-variant/30 focus-within:border-primary-container transition-colors">
                  <label className="text-[10px] text-on-surface-variant uppercase font-bold mb-1">Hora</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm font-medium text-on-surface w-full"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>

              {/* Location Map */}
              <div className="space-y-3 pt-2 relative z-10">
                <label className="text-xs text-on-surface-variant uppercase font-bold px-1">Ubicación del Servicio</label>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 bg-surface-container p-3 rounded-2xl border border-outline-variant/30 focus-within:border-primary-container transition-colors">
                    <MapPin className="w-5 h-5 text-primary-container shrink-0" />
                    <input
                      type="text"
                      placeholder="Ej. Av. Siempre Viva 742"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="bg-transparent border-none outline-none text-sm font-medium text-on-surface w-full"
                    />
                  </div>
                  <div className="h-40 w-full rounded-2xl overflow-hidden border border-outline-variant/30 relative z-0">
                    <MapContainer
                      center={[opcionesMapa.center.lat, opcionesMapa.center.lng]}
                      zoom={opcionesMapa.zoom}
                      zoomControl={false}
                      className="w-full h-full"
                      style={{ background: '#0a0a0a' }}
                    >
                      <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      />
                      <MapEvents setCoordinates={setCoordinates} setLocation={setLocation} />
                      {coordinates && (
                        <Marker position={[coordinates.lat, coordinates.lng]} />
                      )}
                    </MapContainer>
                  </div>
                </div>
              </div>

              {/* Action button */}
              <div className="pt-4 border-t border-primary-container/20 relative z-10">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-on-surface-variant font-medium">Total estimado</span>
                  <span className="text-xl font-display font-bold text-primary-container">
                    {selectedService ? `$${selectedService.price}` : 'A convenir'}
                  </span>
                </div>
                <button
                  onClick={handleBooking}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[#00FFFF] to-[#B026FF] hover:from-[#00E5E5] hover:to-[#9D15EB] text-surface-lowest font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(0,255,255,0.3)] active:scale-[0.98] disabled:opacity-70 mt-2 uppercase tracking-wider text-sm"
                >
                  {isSubmitting ? (
                    <span className="animate-pulse">PROCESANDO...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      CONFIRMAR RESERVA
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {status === 'pending_approval' && (
          <div className="flex flex-col items-center justify-center text-center py-12 animate-in fade-in zoom-in duration-500 pb-20">
            <div className="w-24 h-24 bg-primary-container/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,255,255,0.3)] border border-primary-container/30">
              <span className="text-5xl">⏳</span>
            </div>
            <h3 className="text-2xl font-black text-primary-container uppercase tracking-wide drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]">Solicitud Enviada</h3>
            <p className="text-on-surface-variant font-medium mt-4 max-w-xs leading-relaxed">
              El profesional ha sido notificado. Tiene <span className="text-on-surface font-bold text-primary-container">12 horas</span> para confirmar tu cita. Te avisaremos por notificación.
            </p>
            <button
              onClick={() => navigate('/home')}
              className="mt-10 bg-surface-container border border-primary-container/30 text-primary-container font-bold px-8 py-3 rounded-xl hover:bg-primary-container/10 transition-colors shadow-[0_0_15px_rgba(0,255,255,0.1)] active:scale-[0.98]"
            >
              Volver al inicio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
