import { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, getDocs, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { AnimatedBackButton } from '../components/AnimatedBackButton';

// Sonido futurista de radar desde Mixkit
const radarSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

// Función para calcular distancia en línea recta (Haversine)
function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return "---";
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return (R * c).toFixed(1); // Retorna km con un decimal
}

function monitorDistancia(nuevoRequerimiento: any, proLocation: {lat: number, lng: number}) {
  if (!nuevoRequerimiento.latitude || !nuevoRequerimiento.longitude || !proLocation.lat || !proLocation.lng) return;

  const distanciaStr = calcularDistancia(
    proLocation.lat,
    proLocation.lng,
    nuevoRequerimiento.latitude,
    nuevoRequerimiento.longitude
  );

  if (distanciaStr !== "---" && parseFloat(distanciaStr) <= 5) {
    // 1. Ejecutar sonido si está cerca
    radarSound.play().catch(e => console.log('Audio no reproducido automático:', String(e)));

    // 2. Ejecutar vibración física (Solo en Android/PWA instalada)
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
    console.log("¡Misión cerca detectada!");
  }
}

  const getCategoryColor = (category: string) => {
    if (!category) return '#bc13fe';
    const cat = category.toLowerCase();
    if (cat.includes('urgente')) return '#ff3b3b';
    if (cat.includes('plomer') || cat.includes('agua')) return '#00f2ff';
    if (cat.includes('electric')) return '#ffcc00';
    return '#bc13fe'; // Púrpura para otros
  };

const RequirementItem = ({ req, proLocation, onContact }: { req: any, proLocation: any, onContact: (r: any) => void }) => {
  // Use either req.lat/req.lng or mock them slightly offset from proLocation for demo
  const reqLat = req.latitude || (proLocation.lat ? proLocation.lat + 0.02 : 10.97);
  const reqLng = req.longitude || (proLocation.lng ? proLocation.lng + 0.03 : -63.85);

  const distancia = calcularDistancia(proLocation.lat, proLocation.lng, reqLat, reqLng);
  const color = getCategoryColor(req.serviceType || req.category || (req.isEmergency ? 'urgente' : ''));

  return (
    <div className="requirement-card" style={{ borderLeft: `5px solid ${color}` }}>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: color }}></span>
              <span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: color }}></span>
            </span>
            <span className="text-xs font-bold font-mono tracking-widest" style={{ color }}>{distancia} KM</span>
        </div>

        {req.isEmergency ? (
          <div className="req-badge m-0">URGENTE</div>
        ) : (
          <div className="req-badge m-0" style={{ backgroundColor: color, opacity: 0.9 }}>
            {req.serviceType || req.category || 'General'}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg text-white font-bold">{req.title || req.serviceType || 'Servicio Solicitado'}</h3>
          <span className="text-white/40 text-[10px] font-semibold">
          {req.createdAt?.toDate ? (() => {
            const diff = Date.now() - req.createdAt.toDate().getTime();
            const minutes = Math.floor(diff / 60000);
            if (minutes < 60) return `Hace ${minutes}m`;
            const hours = Math.floor(minutes / 60);
            if (hours < 24) return `Hace ${hours}h`;
            return `Hace ${Math.floor(hours / 24)}d`;
          })() : 'Reciente'}
        </span>
      </div>

      <p className="text-white/70 text-sm mb-4 leading-relaxed">{req.description}</p>

      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-1 text-xs text-white/60 font-semibold mb-1">
          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {req.location || 'Zona no especificada'}</span>
          <span className="flex items-center gap-1 text-[#00FFFF]">💰 Est. ${req.basePrice || req.budget || '---'}</span>
        </div>

        <button
          className="btn-apply !w-auto !mt-0 px-6 py-2"
          onClick={() => onContact(req)}
          style={{ background: `linear-gradient(90deg, ${color}, #0072ff)` }}
        >
          POSTULARSE
        </button>
      </div>
    </div>
  );
};

export default function MuroRequerimientos() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  // Almacenar IDs que ya hemos procesado
  const seenIdsRef = useRef<Set<string>>(new Set());

  const profileRef = useRef(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const loadingRef = useRef(loading);
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    // 1. Listen to standard requests
    const qReqs = query(
      collection(db, 'requests'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeReqs = onSnapshot(qReqs, (snapshot) => {
      const reqs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isEmergency: false
      }));

      setRequests(prev => {
        const others = prev.filter(r => r.isEmergency);
        return [...others, ...reqs].sort((a: any, b: any) => {
          const timeA = a.createdAt?.toMillis() || 0;
          const timeB = b.createdAt?.toMillis() || 0;
          return timeB - timeA;
        });
      });

      const currentProfile = profileRef.current;
      const proLocation = {
        lat: currentProfile?.latitude || (typeof currentProfile?.location === 'object' ? (currentProfile.location as any)?.latitude : null) || 10.9757,
        lng: currentProfile?.longitude || (typeof currentProfile?.location === 'object' ? (currentProfile.location as any)?.longitude : null) || -63.8560
      };

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const newReq = { id: change.doc.id, ...change.doc.data() };
          if (!seenIdsRef.current.has(newReq.id)) {
            seenIdsRef.current.add(newReq.id);
            if (!loadingRef.current) monitorDistancia(newReq, proLocation);
          }
        }
      });

      setLoading(false);
    });

    // 2. Listen to emergencies
    const qEmers = query(
      collection(db, 'emergencies'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeEmers = onSnapshot(qEmers, (snapshot) => {
      const emers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isEmergency: true
      }));

      setRequests(prev => {
        const standard = prev.filter(r => !r.isEmergency);
        return [...emers, ...standard].sort((a: any, b: any) => {
          // Keep emers on top if they are same time
          if (a.isEmergency && !b.isEmergency) return -1;
          if (!a.isEmergency && b.isEmergency) return 1;

          const timeA = a.createdAt?.toMillis() || 0;
          const timeB = b.createdAt?.toMillis() || 0;
          return timeB - timeA;
        });
      });

      const currentProfile = profileRef.current;
      const proLocation = {
        lat: currentProfile?.latitude || (typeof currentProfile?.location === 'object' ? (currentProfile.location as any)?.latitude : null) || 10.9757,
        lng: currentProfile?.longitude || (typeof currentProfile?.location === 'object' ? (currentProfile.location as any)?.longitude : null) || -63.8560
      };

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const newEmer = { id: change.doc.id, ...change.doc.data() };
          if (!seenIdsRef.current.has(newEmer.id)) {
            seenIdsRef.current.add(newEmer.id);
            if (!loadingRef.current) monitorDistancia(newEmer, proLocation);
          }
        }
      });
    });

    return () => {
      unsubscribeReqs();
      unsubscribeEmers();
    };
  }, []);


  const handleContactClient = async (request: any) => {
    if (!user || !profile) {
      alert("Debes iniciar sesión para contactar clientes.");
      return;
    }

    if (profile.role !== 'Profesional' && profile.role !== 'Admin') {
      alert("Solo los profesionales pueden contactar clientes para ofrecer servicios.");
      return;
    }

    try {
      if (request.isEmergency) {
        // Direct Action for Emergencies: Accept it
        await updateDoc(doc(db, 'emergencies', request.id), {
          status: 'accepted',
          professionalId: user.uid,
          professionalName: profile.name || 'Profesional',
          professionalPhoto: profile.photoUrl || '',
          acceptedAt: serverTimestamp()
        });
        alert("¡Has aceptado una EMERGENCIA! Dirígete al lugar de inmediato.");
        navigate(`/emergency/${request.id}`);
        return;
      }

      const chatsRef = collection(db, 'chats');
      const q = query(chatsRef, where('participants', 'array-contains', user.uid));
      const querySnapshot = await getDocs(q);

      let existingChatId: string | null = null;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.participants.includes(request.clientId)) {
          existingChatId = doc.id;
        }
      });

      if (existingChatId) {
        navigate(`/messages/${existingChatId}`);
      } else {
        const newChatRef = await addDoc(collection(db, 'chats'), {
          participants: [user.uid, request.clientId],
          participantNames: {
            [user.uid]: profile.name || 'Profesional',
            [request.clientId]: request.clientName || 'Cliente'
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastMessage: `Hola, vi tu solicitud de ${request.serviceType}. ¿En qué te puedo ayudar?`
        });

        await addDoc(collection(db, 'messages'), {
          chatId: newChatRef.id,
          senderId: user.uid,
          text: `Hola, vi tu solicitud de ${request.serviceType}. ¿En qué te puedo ayudar?`,
          createdAt: serverTimestamp()
        });

        navigate(`/messages/${newChatRef.id}`);
      }
    } catch (error) {
      console.error("Error creating chat:", error);
      handleFirestoreError(error, OperationType.CREATE, 'chats');
    }
  };

  const getCategoryColor = (category: string) => {
    if (!category) return '#bc13fe';
    const cat = category.toLowerCase();
    if (cat.includes('urgente')) return '#ff3b3b';
    if (cat.includes('plomer') || cat.includes('agua')) return '#00f2ff';
    if (cat.includes('electric')) return '#ffcc00';
    return '#bc13fe'; // Púrpura para otros
  };

  return (
    <div className="requirements-screen relative flex min-h-full w-full flex-col bg-[#0a0e14] overflow-x-hidden pb-20 font-sans text-white">
      {/* Header */}
      <div className="top-bar flex items-center bg-[#0a0e14] p-[15px] justify-end sticky top-0 z-[100] border-b border-[#00f2ff]/20">
        <h2 className="text-white text-lg font-black leading-tight tracking-[-0.015em] uppercase italic">Muro de Trabajo</h2>
      </div>

      <div className="p-6">
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-black uppercase text-white tracking-wider">Oportunidades de Trabajo</h1>
          <p className="text-white/60 text-sm mt-1">Proyectos disponibles en tu zona</p>
        </header>

        <div className="flex flex-col gap-4">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-12">
               <div className="w-8 h-8 border-4 border-[#00FFFF] border-t-transparent rounded-full animate-spin mb-4"></div>
             </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-white/50">
               No hay requerimientos en este momento.
            </div>
          ) : (
            requests.map((req) => (
              <RequirementItem
                key={req.id}
                req={req}
                proLocation={{
                  lat: profile?.latitude || (typeof profile?.location === 'object' ? (profile.location as any)?.latitude : null) || 10.9757,
                  lng: profile?.longitude || (typeof profile?.location === 'object' ? (profile.location as any)?.longitude : null) || -63.8560
                }}
                onContact={handleContactClient}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
