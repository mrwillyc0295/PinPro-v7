import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { User, ShieldAlert, Award, Sparkles, Wifi, WifiOff } from 'lucide-react';
import { cn } from '../lib/utils';
import { onSnapshotsInSync } from 'firebase/firestore';
import { db } from '../firebase';

export const RoleModeBadge: React.FC = () => {
  const { user, profile, isAdmin } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsFirebaseConnected(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setIsFirebaseConnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // native Firestore connection sync listener
    let unsubscribeSync: (() => void) | undefined;
    try {
      unsubscribeSync = onSnapshotsInSync(db, () => {
        setIsFirebaseConnected(true);
      });
    } catch (e) {
      console.error('Error listening to firebase snapshot sync state:', e);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (unsubscribeSync) {
        unsubscribeSync();
      }
    };
  }, []);

  if (!user || !profile) return null;

  const currentRole = profile?.role || 'Cliente';
  const roleUpper = currentRole.toUpperCase();

  // Determine styling configuration based on role
  let badgeLabel = 'Cliente';
  let badgeColorClass = 'text-cyan-400 bg-cyan-950/45 border-cyan-500/20 shadow-[0_0_12px_rgba(6,182,212,0.15)]';
  let bulletColorClass = 'bg-cyan-400 animate-pulse';
  let RoleIcon = User;

  if (isAdmin) {
    badgeLabel = 'CEO Administrador';
    badgeColorClass = 'text-rose-400 bg-rose-950/45 border-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.15)]';
    bulletColorClass = 'bg-rose-500';
    RoleIcon = ShieldAlert;
  } else if (roleUpper === 'PROFESIONAL') {
    badgeLabel = 'Profesional PinPro';
    badgeColorClass = 'text-[#39FF14] bg-stone-900/85 border-[#39FF14]/20 shadow-[0_0_12px_rgba(57,255,20,0.15)]';
    bulletColorClass = 'bg-[#39FF14] animate-pulse';
    RoleIcon = Award;
  } else if (roleUpper === 'REFERIDOR' || roleUpper === 'AGENTE') {
    badgeLabel = 'Agente PinPro';
    badgeColorClass = 'text-amber-400 bg-amber-950/45 border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.15)]';
    bulletColorClass = 'bg-amber-400 animate-pulse';
    RoleIcon = Sparkles;
  }

  // Determine styling configuration for database connection state
  const isConnOk = isOnline && isFirebaseConnected;
  const connectionLabel = isConnOk ? 'NUBE ACTIVA' : 'OF-LINE';
  const connectionColorClass = isConnOk
    ? 'text-emerald-400 bg-emerald-950/45 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
    : 'text-rose-450 bg-rose-955/45 border-rose-500/25 shadow-[0_0_12px_rgba(244,63,94,0.15)]';
  const connectionBulletClass = isConnOk ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500';
  const ConnIcon = isConnOk ? Wifi : WifiOff;

  return (
    <div className="w-full pointer-events-none flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 py-2 absolute top-0 left-0 z-50 px-4">
      {/* Role Mode Badge */}
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="pointer-events-auto"
      >
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full border backdrop-blur-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider font-sans",
          badgeColorClass
        )}>
          {/* Status bullet indicator */}
          <span className="relative flex h-2 w-2">
            <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", bulletColorClass)} />
            <span className={cn("relative inline-flex rounded-full h-2 w-2", bulletColorClass)} />
          </span>

          <RoleIcon className="w-3.5 h-3.5" />

          <span className="leading-none">{badgeLabel}</span>
        </div>
      </motion.div>

      {/* Database Connection Badge */}
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ type: "spring", stiffness: 350, damping: 25, delay: 0.05 }}
        className="pointer-events-auto"
      >
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full border backdrop-blur-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider font-sans transition-all duration-300",
          connectionColorClass
        )}>
          {/* Status bullet indicator */}
          <span className="relative flex h-1.5 w-1.5">
            {isConnOk && (
              <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", connectionBulletClass)} />
            )}
            <span className={cn("relative inline-flex rounded-full h-1.5 w-1.5", connectionBulletClass)} />
          </span>

          <ConnIcon className={cn("w-3.5 h-3.5", isConnOk ? "text-emerald-400" : "text-rose-450")} />

          <span className="leading-none">{connectionLabel}</span>
        </div>
      </motion.div>
    </div>
  );
};

export default RoleModeBadge;
