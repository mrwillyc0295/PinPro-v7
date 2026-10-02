import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, Phone, MessageSquare, ChevronLeft, Shield, Clock, Navigation, CheckCircle, AlertCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'motion/react';

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

// Custom Icons
const clientIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const proIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2942/2942503.png',
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

import { ChatOverlay, CallUI } from '../components/RealTimeComponents';
import { useSocket } from '../contexts/SocketContext';
import { Bell, X as CloseIcon } from 'lucide-react';

export default function TrackingEmergency() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { requestPushPermission } = useSocket();
  const [emergency, setEmergency] = useState<any>(null);
  const [proLocation, setProLocation] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [showPushBanner, setShowPushBanner] = useState(false);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      setShowPushBanner(true);
    }
  }, []);

  const handleEnablePush = async () => {
    const granted = await requestPushPermission();
    if (granted) setShowPushBanner(false);
  };

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnapshot(doc(db, 'emergencies', id), (doc) => {
      if (doc.exists()) {
        setEmergency({ id: doc.id, ...doc.data() });
      } else {
        navigate('/');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, navigate]);

  // Simulate professional moving if accepted
  useEffect(() => {
    if (emergency?.status === 'accepted' || emergency?.status === 'arrived') {
      // In a real app, this would come from the professional's live geolocation
      // For demo, we start near the client
      const startLat = emergency.clientLocation.lat + 0.005;
      const startLng = emergency.clientLocation.lng + 0.005;
      setProLocation([startLat, startLng]);

      const interval = setInterval(() => {
        setProLocation(prev => {
          if (!prev) return null;
          const [lat, lng] = prev;
          const dLat = (emergency.clientLocation.lat - lat) * 0.1;
          const dLng = (emergency.clientLocation.lng - lng) * 0.1;

          // If very close, stop moving
          if (Math.abs(dLat) < 0.0001 && Math.abs(dLng) < 0.0001) {
            clearInterval(interval);
            return [emergency.clientLocation.lat, emergency.clientLocation.lng];
          }

          return [lat + dLat, lng + dLng];
        });
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [emergency?.status, emergency?.clientLocation]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!id) return;

    try {
      await updateDoc(doc(db, 'emergencies', id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      // Grant Airdrop Reward: +100 $PIN on completion
      if (newStatus === 'completed' && isProfessional && user && profile) {
        const rewardAmount = 100;
        const currentTokenBalance = (profile as any).tokenBalance || 0;

        await updateDoc(doc(db, 'profesionales', user.uid), {
          tokenBalance: currentTokenBalance + rewardAmount
        });

        // Add to transactions history
        await addDoc(collection(db, 'token_transactions'), {
          userId: user.uid,
          amount: rewardAmount,
          description: `Bono por Emergencia completada: ${emergency?.serviceType || 'Servicio'}`,
          type: 'reward',
          createdAt: serverTimestamp()
        });

        alert("¡Felicidades! Has ganado +100 $PIN por completar esta emergencia.");
      }
    } catch (error) {
      console.error("Error updating emergency status:", error);
    }
  };

  const isProfessional = profile?.role === 'Profesional' && user?.uid === emergency?.professionalId;
  const isClient = user?.uid === emergency?.clientId;

  if (loading) return (
    <div className="h-full w-full flex items-center justify-center bg-black">
      <div className="w-12 h-12 border-4 border-[#00FFFF] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="relative flex-1 w-full h-full bg-[#0a0a0a] overflow-hidden flex flex-col">
      {showPushBanner && (
        <div className="absolute top-20 left-4 right-4 z-[2000] bg-black/80 backdrop-blur-md border border-red-500/30 rounded-2xl p-4 shadow-[0_0_20px_rgba(255,0,0,0.1)] flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div className="flex-1">
            <h4 className="text-white text-sm font-bold tracking-tight">Notificaciones</h4>
            <p className="text-white/50 text-[10px] leading-tight font-medium">Actívalas para recibir alertas críticas de emergencia.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPushBanner(false)}
              className="p-2 text-white/30 hover:text-white"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleEnablePush}
              className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-[0_0_10px_rgba(255,0,0,0.4)]"
            >
              Activar
            </button>
          </div>
        </div>
      )}
      {emergency && (
        <>
          <ChatOverlay
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            orderId={`emergency-${emergency.id}`}
            recipientId={isProfessional ? emergency.clientId : (emergency.professionalId || "wait")}
            recipientName={isProfessional ? emergency.clientName : (emergency.professionalName || "Rescatista")}
          />
          <CallUI
            isOpen={isCallOpen}
            onClose={() => setIsCallOpen(false)}
            recipientId={isProfessional ? emergency.clientId : (emergency.professionalId || "wait")}
            recipientName={isProfessional ? emergency.clientName : (emergency.professionalName || "Rescatista")}
          />
        </>
      )}
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-[1000] p-4 flex items-center justify-between pointer-events-none">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white border border-white/10 pointer-events-auto"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="px-4 py-2 bg-red-600/90 backdrop-blur-md rounded-full text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2 border border-red-500/50 shadow-[0_0_15px_rgba(255,0,0,0.4)] animate-pulse pointer-events-auto">
          <AlertCircle className="w-4 h-4" />
          Emergencia en curso
        </div>
        <div className="w-10 h-10"></div>
      </div>

      {/* Map Section */}
      <div className="flex-1 w-full relative z-0">
        <MapContainer
          center={[emergency.clientLocation.lat, emergency.clientLocation.lng]}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {emergency?.clientLocation &&
           typeof emergency.clientLocation.lat === 'number' &&
           typeof emergency.clientLocation.lng === 'number' && (
            <Marker position={[emergency.clientLocation.lat, emergency.clientLocation.lng]} icon={clientIcon}>
              <Popup>
                <div className="font-bold">Ubicación del Cliente</div>
                <div className="text-xs text-gray-500">{emergency.clientName}</div>
              </Popup>
            </Marker>
          )}

          {proLocation && typeof proLocation[0] === 'number' && typeof proLocation[1] === 'number' && (
            <Marker position={proLocation} icon={proIcon}>
              <Popup>
                <div className="font-bold">Profesional en camino</div>
                <div className="text-xs text-gray-500">{emergency.professionalName}</div>
              </Popup>
            </Marker>
          )}

          {emergency?.clientLocation &&
           typeof emergency.clientLocation.lat === 'number' &&
           typeof emergency.clientLocation.lng === 'number' && (
            <MapFocus center={[emergency.clientLocation.lat, emergency.clientLocation.lng]} />
          )}
        </MapContainer>
      </div>

      {/* Bottom Info Card */}
      <AnimatePresence>
        <motion.div
          initial={{ y: 300 }}
          animate={{ y: 0 }}
          className="absolute bottom-0 left-0 right-0 z-[1001] bg-[#121212]/95 backdrop-blur-xl border-t border-white/10 rounded-t-[32px] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
        >
          <div className="max-w-md mx-auto flex flex-col gap-5">
            {/* Status Indicator */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#00FFFF]/10 rounded-xl">
                  <Shield className="w-6 h-6 text-[#00FFFF]" />
                </div>
                <div>
                  <h3 className="text-white font-black text-lg">
                    {emergency.status === 'pending' ? 'Buscando Profesional' :
                     emergency.status === 'accepted' ? 'Profesional en Camino' :
                     emergency.status === 'arrived' ? 'Profesional ha Llegado' : 'Finalizado'}
                  </h3>
                  <p className="text-white/50 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Actualizado hace un momento
                  </p>
                </div>
              </div>
              {emergency.status === 'accepted' && (
                <div className="text-right">
                  <span className="text-[10px] text-white/40 block font-bold">LLEGADA</span>
                  <span className="text-[#00FFFF] font-black text-xl italic">8 MIN</span>
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="h-[1px] bg-white/5"></div>

            {/* User Details */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-14 h-14 rounded-full bg-white/10 border border-white/10 overflow-hidden ring-2 ring-[#00FFFF]/20">
                    <img
                      src={isProfessional ? "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150" : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150"}
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-bold leading-tight">
                    {isProfessional ? emergency.clientName : emergency.professionalName}
                  </h4>
                  <p className="text-[#00FFFF] text-[10px] font-black uppercase tracking-wider mt-0.5">
                    {isProfessional ? 'Cliente con Emergencia' : emergency.serviceType}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCallOpen(true)}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-90"
                >
                  <Phone className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-90"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-2 pb-safe">
              {isProfessional && (
                <>
                  {emergency.status === 'accepted' && (
                    <button
                      onClick={() => handleUpdateStatus('arrived')}
                      className="w-full h-14 bg-[#00FFFF] text-black font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(0,255,255,0.3)]"
                    >
                      <Navigation className="w-5 h-5" />
                      He llegado al lugar
                    </button>
                  )}
                  {emergency.status === 'arrived' && (
                    <button
                      onClick={() => handleUpdateStatus('completed')}
                      className="w-full h-14 bg-green-500 text-black font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Finalizar Servicio
                    </button>
                  )}
                </>
              )}

              {!isProfessional && emergency.status === 'pending' && (
                <div className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-[#00FFFF] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-white/60 font-bold uppercase tracking-widest text-xs">Esperando confirmación...</span>
                </div>
              )}

              {isClient && emergency.status !== 'completed' && (
                <button
                  className="w-full py-3 text-red-500/70 text-xs font-bold uppercase tracking-widest hover:text-red-500 transition-colors"
                  onClick={() => handleUpdateStatus('cancelled')}
                >
                  Cancelar Solicitud
                </button>
              )}

              {emergency.status === 'completed' && (
                <button
                  onClick={() => navigate('/')}
                  className="w-full h-14 bg-white text-black font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center transition-all"
                >
                  Regresar al Inicio
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <style>{`
        .pb-safe {
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
        }
        .leaflet-container {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
      `}</style>
    </div>
  );
}
