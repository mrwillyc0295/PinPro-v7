import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Share2, Download, Copy, Check, Star, BadgeCheck, MapPin, Globe, Phone, Mail, MessageCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface DigitalCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  onShare: () => void;
}

export function DigitalCardModal({ isOpen, onClose, profile, onShare }: DigitalCardModalProps) {
  const [copied, setCopied] = React.useState(false);
  const profileUrl = `${window.location.origin}/p/${profile?.uid || profile?.id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-sm bg-[#0a0c10] border border-white/10 rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/40 text-white/70 hover:text-white transition-colors backdrop-blur-md border border-white/5"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Card Preview Container */}
          <div className="p-6 pt-6">
            <h3 className="text-white/60 font-medium text-center text-xs uppercase tracking-[0.3em] mb-4">
              Tu Tarjeta Digital
            </h3>

            {/* The Actual Card Design */}
            <div className={cn(
              "relative w-full aspect-[1.6/2.4] rounded-[24px] overflow-hidden border p-6 flex flex-col items-center justify-between transition-all duration-500",
              profile?.isElite
                ? "border-[#FFD700]/50 shadow-[0_0_30px_rgba(255,215,0,0.2)] bg-gradient-to-br from-[#1a1600] to-[#0a0a0a]"
                : profile?.isPremium
                  ? "border-[#FF00FF]/50 shadow-[0_0_30px_rgba(255,0,255,0.2)] bg-gradient-to-br from-[#1a001a] to-[#0a0a0a]"
                  : "border-[#00FFFF]/30 shadow-[0_0_30px_rgba(0,255,255,0.1)] bg-gradient-to-br from-[#001a1a] to-[#0a0a0a]"
            )}>
              {/* Patterns/Overlay */}
              <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/10 rounded-full blur-3xl -mr-10 -mt-10"></div>

              {/* Profile Header */}
              <div className="relative z-10 flex flex-col items-center justify-center gap-3 w-full flex-grow">
                <div className="relative">
                  <div className={cn(
                    "w-32 h-32 rounded-full border-4 p-1",
                    profile?.isElite ? "border-[#FFD700]" : profile?.isPremium ? "border-[#FF00FF]" : "border-[#00FFFF]"
                  )}>
                    <img
                      src={profile?.photoUrl || 'https://via.placeholder.com/150'}
                      className="w-full h-full rounded-full object-cover grayscale-[0.2] contrast-[1.1]"
                      alt={profile?.name}
                    />
                  </div>
                  {(profile?.instagram && profile?.facebook) && (
                    <BadgeCheck className="absolute bottom-0 right-0 w-8 h-8 text-white fill-[#0095f6] drop-shadow-[0_0_10px_rgba(0,149,246,0.6)]" />
                  )}
                </div>

                <div className="text-center">
                  <h4 className="text-white font-black text-2xl leading-tight">
                    {profile?.name}
                  </h4>
                  <p className="text-[#00FFFF] text-xs font-bold uppercase tracking-[0.2em] mt-1">
                    {profile?.profession || 'Profesional'}
                  </p>
                </div>
              </div>

              {/* Rating Section (Replaces QR) */}
              <div className="relative z-10 w-full flex flex-col items-center py-4">
                  <div className="text-white/30 text-[10px] font-medium uppercase tracking-widest mb-1">
                    Clasificación
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-8 h-8 text-[#FFD700] fill-current" />
                    <span className="text-5xl font-black text-white tracking-tighter">
                        {profile?.rating || '5.0'}
                    </span>
                  </div>
              </div>

              {/* Footer Info */}
              <div className="relative z-10 w-full flex flex-col gap-2 pt-4 border-t border-white/10">
                <div className="flex justify-between items-center text-[9px] text-white/50 font-bold uppercase tracking-widest">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#00FFFF]" />
                    {profile?.municipality || 'Ubicación'}
                  </div>
                </div>
                <div className="flex justify-center mt-1">
                  <div className="text-[10px] font-black italic text-transparent bg-clip-text bg-gradient-to-r from-[#00FFFF] to-[#FF00FF]">
                    PINPRO PROFESSIONAL
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col gap-3">
              {/* WhatsApp direct share */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `¡Hola! Te comparto la Tarjeta Digital de ${profile?.name || 'un profesional'} en PinPro. Mira su especialidad de ${profile?.profession || 'servicios'} y contáctale en tiempo real aquí: ${profileUrl}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-black font-extrabold py-3 w-full rounded-2xl transition-all active:scale-95 shadow-[0_4px_15px_rgba(37,211,102,0.25)] text-xs uppercase tracking-wider"
              >
                <MessageCircle className="w-4 h-4 fill-black text-black" />
                Compartir por WhatsApp
              </a>

              <div className="grid grid-cols-2 gap-2 w-full">
                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-3 rounded-2xl border border-white/10 transition-all active:scale-95 text-[11px] uppercase tracking-tight"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                  {copied ? '¡Copiado!' : 'Copiar Link'}
                </button>
                <button
                  onClick={onShare}
                  className="flex items-center justify-center gap-2 bg-[#00FFFF] hover:bg-white text-black font-black py-3 px-3 rounded-2xl transition-all active:scale-95 shadow-[0_0_20px_rgba(0,255,255,0.4)] text-[11px] uppercase tracking-tight"
                >
                  <Share2 className="w-4 h-4" />
                  Más Opciones
                </button>
              </div>
            </div>

            <p className="text-center text-[10px] text-white/30 mt-6 font-medium italic tracking-widest">
              Digital Identity Powered by PinPro
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
