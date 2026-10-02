import React from 'react';
import { motion } from 'motion/react';
import { User, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';
import { useSmartGeolocation } from '../hooks/useSmartGeolocation';

interface RadarScannerProps {
  isScanning: boolean;
  avatarUrl?: string; // Avatar del cliente buscando
}

export const RadarScanner = React.memo(({ isScanning, avatarUrl }: RadarScannerProps) => {
  const { location, isOutOfArea, error } = useSmartGeolocation();

  // Si abres la aplicación en USA en lugar de Colombia, corta de raíz la UI
  if (isOutOfArea) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-6 text-center bg-surface-highest rounded-3xl border border-red-500/30">
        <ShieldAlert className="w-12 h-12 text-red-500 mb-4 animate-pulse" />
        <h3 className="text-lg font-black text-on-surface mb-2 tracking-widest uppercase">Región No Soportada</h3>
        <p className="text-sm text-on-surface-variant font-medium">PinPro está habilitado exclusivamente para el control y mapeo en países de habla hispana (Latinoamérica y España).</p>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-square max-w-[300px] mx-auto flex items-center justify-center overflow-hidden rounded-full">
      {/* Fondo base oscuro tipo Night Map */}
      <div className="absolute inset-0 bg-[#0A0A0A] rounded-full overflow-hidden shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] border-2 border-[#00FFFF]/20">
        {/* Grid lines estilo GIS */}
        <div className="absolute inset-0 flex items-center justify-center bg-[length:20px_20px]
          bg-[linear-gradient(to_right,#00FFFF_1px,transparent_1px),linear-gradient(to_bottom,#00FFFF_1px,transparent_1px)]
          opacity-10 pointer-events-none">
        </div>
      </div>

      {isScanning && (
        <>
          {/* Pulsos de Radar Cyan Puro */}
          <motion.div
            initial={{ scale: 0.1, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
            className="absolute w-24 h-24 rounded-full border-2 border-[#00FFFF] shadow-[0_0_30px_rgba(0,255,255,0.7)] pointer-events-none"
          />
          <motion.div
            initial={{ scale: 0.1, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 2.5, delay: 0.8, repeat: Infinity, ease: 'linear' }}
            className="absolute w-24 h-24 rounded-full border border-[#00FFFF] pointer-events-none"
          />
          <motion.div
            initial={{ scale: 0.1, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 2.5, delay: 1.6, repeat: Infinity, ease: 'linear' }}
            className="absolute w-24 h-24 rounded-full border border-[#00FFFF] opacity-50 pointer-events-none"
          />

          {/* Sweep de aguja de radar */}
          <div className="absolute w-1/2 h-full top-0 right-0 origin-left animate-[spin_3s_linear_infinite] overflow-hidden">
            <div className="w-[150px] h-[150px] origin-bottom-left -rotate-45"
                 style={{ background: 'conic-gradient(from 0deg, transparent 50%, rgba(0, 255, 255, 0.4) 100%)' }}>
            </div>
          </div>
        </>
      )}

      {/* Avatar Central del Cliente */}
      <div className={cn(
        "relative z-20 w-16 h-16 rounded-full bg-surface-lowest border-4 flex items-center justify-center overflow-hidden transition-all duration-500",
        isScanning ? "border-[#00FFFF] shadow-[0_0_25px_rgba(0,255,255,0.8)]" : "border-outline-variant"
      )}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="Buscando" className="w-full h-full object-cover" />
        ) : (
          <User className={cn("w-8 h-8", isScanning ? "text-[#00FFFF]" : "text-on-surface-variant")} />
        )}
      </div>

      {/* Geolocalización en debug */}
      {location && (
        <div className="absolute bottom-6 bg-black/60 backdrop-blur text-[#00FFFF] text-[8px] font-mono px-2 py-1 rounded shadow-[0_0_5px_rgba(0,255,255,0.3)] border border-[#00FFFF]/30">
          LAT: {location[0].toFixed(5)} LNG: {location[1].toFixed(5)}
        </div>
      )}
    </div>
  );
});
