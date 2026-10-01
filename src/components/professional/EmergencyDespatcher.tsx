import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { AlertCircle, MapPin, Navigation, X, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function EmergencyDespatcher() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [activeEmergency, setActiveEmergency] = useState<any>(null);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (!user || profile?.role !== 'Profesional') return;

    // Listen for pending emergencies specifically assigned to this professional
    // OR general ones in their area (simplified here to assigned ones or all for demo)
    const q = query(
      collection(db, 'emergencies'),
      where('professionalId', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        setActiveEmergency(data);
        setShowNotification(true);

        // Sonido de sirena de emergencia
        try {
          // Usamos una sirena más nítida
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3');
          audio.volume = 0.7;
          audio.play().catch(e => console.warn("Audio play blocked until user interacts", e));
        } catch (e) {
          console.warn("Audio context error", e);
        }
      } else {
        setActiveEmergency(null);
        setShowNotification(false);
      }
    });

    return () => unsubscribe();
  }, [user, profile?.role]);

  const handleAccept = async () => {
    if (!activeEmergency) return;

    try {
      await updateDoc(doc(db, 'emergencies', activeEmergency.id), {
        status: 'accepted',
        updatedAt: serverTimestamp()
      });
      navigate(`/tracking/${activeEmergency.id}`);
    } catch (error) {
      console.error("Error accepting emergency:", error);
    }
  };

  return (
    <AnimatePresence>
      {showNotification && activeEmergency && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-[5000] bg-black/90 backdrop-blur-2xl border-2 border-red-500 rounded-3xl p-5 shadow-[0_0_50px_rgba(255,0,0,0.4)]"
        >
          {/* Siren Lights Effect */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none opacity-20">
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-transparent to-blue-600 animate-[pulse_2s_infinite]"></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-600 rounded-xl animate-bounce">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-black text-lg leading-tight italic">¡NUEVA EMERGENCIA!</h3>
                  <p className="text-red-500 font-black text-[10px] uppercase tracking-widest">Solicitud de alta prioridad</p>
                </div>
              </div>
              <button
                onClick={() => setShowNotification(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-5">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="w-4 h-4 text-[#00FFFF]" />
                <span className="text-white/80 font-bold text-sm truncate">{activeEmergency.clientLocation.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-yellow-400" />
                <span className="text-white/80 font-bold text-sm">{activeEmergency.clientName}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowNotification(false)}
                className="flex-1 py-3 text-white/50 font-bold text-xs uppercase tracking-widest hover:text-white transition-colors"
              >
                Ignorar
              </button>
              <button
                onClick={handleAccept}
                className="flex-[2] py-4 bg-red-600 text-white font-black uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,0,0,0.3)] active:scale-95 transition-all"
              >
                <Navigation className="w-5 h-5" />
                ATENDER AHORA
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
