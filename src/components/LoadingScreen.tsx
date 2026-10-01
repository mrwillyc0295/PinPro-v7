import React from 'react';
import { motion } from 'motion/react';
import { MapPin } from 'lucide-react';
import neonMapBg from '../assets/images/neon_city_map_1776719564588.png';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'CARGANDO PINPRO...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-black max-w-md mx-auto relative overflow-hidden w-full">
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url(${neonMapBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative z-10 flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-[#00FFFF]/20 rounded-full blur-2xl animate-pulse"></div>
        <MapPin className="w-16 h-16 text-[#00FFFF] drop-shadow-[0_0_20px_rgba(0,255,255,1)] relative z-10" />
      </motion.div>
      <span className="mt-6 text-[#00FFFF] font-black italic tracking-widest animate-pulse z-10 text-xs sm:text-sm">
        {message}
      </span>

      {/* Decorative pulse ring */}
      <motion.div
        animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
        className="absolute w-32 h-32 border-2 border-[#00FFFF]/30 rounded-full z-0"
      />
    </div>
  );
};

export default LoadingScreen;
