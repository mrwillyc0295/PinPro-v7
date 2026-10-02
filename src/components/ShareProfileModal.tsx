import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageCircle,
  Copy,
  Check,
  Share2,
  Facebook,
  Send,
  QrCode,
  X,
  Sparkles,
  Zap,
  Download,
  Award
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

interface ShareProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  proName: string;
  proCategory: string;
  proRating: string | number;
  proJobs: string | number;
  proPhoto: string;
  profileUrl: string;
}

export default function ShareProfileModal({
  isOpen,
  onClose,
  proName,
  proCategory,
  proRating,
  proJobs,
  proPhoto,
  profileUrl
}: ShareProfileModalProps) {
  const [copied, setCopied] = useState(false);

  // Text contents for shares
  const shareTitle = `Tarjeta Digital de ${proName} - PinPro`;
  const shareText = `¡Hola! Soy ${proName}, especialista en ${proCategory}. Te comparto mi tarjeta de presentación digital de PinPro. ⭐ ${proRating} de valoración. Revisa mis fotos, servicios, y contáctame en tiempo real aquí:`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar el enlace:', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: profileUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadQR = () => {
    const canvas = document.getElementById('share-qr-canvas') as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `QR_PinPro_${proName.replace(/\s+/g, '_')}.png`;
      link.href = url;
      link.click();
    }
  };

  // URL shares
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + profileUrl)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(profileUrl)}&text=${encodeURIComponent(shareText)}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="share-modal-root" className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-xl"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-md bg-[#0f0f0f] border border-white/10 rounded-[38px] p-6 text-white overflow-hidden shadow-2xl flex flex-col items-center"
          >
            {/* Top Close Button */}
            <button
              id="close-share-modal"
              onClick={onClose}
              className="absolute right-5 top-5 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center border border-white/5"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>

            {/* Title / Description */}
            <div className="text-center mt-2 mb-6">
              <span className="text-[10px] font-extrabold uppercase bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 px-3 py-1 rounded-full tracking-[0.2em] inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" /> Tarjeta Digital Activa
              </span>
              <h3 className="text-2xl font-black mt-3 tracking-tighter uppercase">Compartir Perfil</h3>
              <p className="text-zinc-500 text-xs mt-1 font-medium">Llega a clientes compartiendo en todas tus redes</p>
            </div>

            {/* DIGITAL PRESENTATION CARD MOCKUP (FUTURISTIC) */}
            <div className="w-full relative group max-w-xs aspect-[1.586/1] mb-6 rounded-2xl overflow-hidden border border-cyan-500/20 bg-gradient-to-br from-black via-zinc-900 to-[#0e171b] p-5 shadow-[0_0_25px_rgba(0,255,255,0.05)] select-none">
              {/* Glass shine element */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

              {/* Card Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#00FFFF]/10 border border-[#00FFFF]/20 flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5 text-[#00FFFF] fill-[#00FFFF]/20" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-[#00FFFF]">PinPro Card</span>
                </div>
                <div className="flex items-center gap-1 py-0.5 px-2 rounded-full bg-green-500/10 border border-green-500/20">
                  <Award className="w-3 h-3 text-green-400" />
                  <span className="text-[8px] font-black text-green-400 uppercase tracking-wide">Elite Pro</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-[#00FFFF] to-purple-500 shrink-0">
                  <img
                    src={proPhoto}
                    alt="Avatar Tarjeta"
                    className="w-full h-full rounded-full object-cover border-2 border-black"
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="text-base font-black truncate text-white uppercase tracking-tight">{proName}</h4>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase truncate">{proCategory}</p>

                  <div className="flex items-center gap-3 mt-1.5 font-mono text-[10px] text-[#00FFFF]">
                    <span>⭐ {proRating}</span>
                    <span className="text-zinc-500">•</span>
                    <span>🛠️ {proJobs} Trabajos</span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="absolute bottom-4 left-5 right-5 flex justify-between items-center text-[8px] text-zinc-500 font-bold uppercase">
                <span>ID: PIN-{proName.slice(0, 3).toUpperCase()}-PRO</span>
                <span className="text-xs tracking-wider font-extrabold text-[#00FFFF]">PinPro.app</span>
              </div>
            </div>

            {/* HIDDEN QR CANVAS FOR EXPORTS */}
            <div className="hidden">
              <QRCodeCanvas
                id="share-qr-canvas"
                value={profileUrl}
                size={256}
                level="H"
                includeMargin={true}
              />
            </div>

            {/* SOCIAL SHARING BUTTONS */}
            <div className="w-full space-y-3">
              {/* WhatsApp Button */}
              <a
                id="share-whatsapp-btn"
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full h-14 bg-[#25D366] text-black font-extrabold rounded-2xl flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm uppercase tracking-wider shadow-[0_4px_15px_rgba(37,211,102,0.2)]"
              >
                <MessageCircle className="w-5 h-5 fill-black" />
                Compartir por WhatsApp
              </a>

              {/* Action grid (Telegram / Facebook / Link) */}
              <div className="grid grid-cols-2 gap-3">
                <a
                  id="share-telegram-btn"
                  href={telegramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="h-12 bg-white/5 hover:bg-white/10 text-white rounded-2xl flex items-center justify-center gap-2 transition-all border border-white/5 active:scale-95 text-xs font-bold uppercase tracking-wider"
                >
                  <Send className="w-4 h-4 text-[#00FFFF]" />
                  Telegram
                </a>

                <a
                  id="share-facebook-btn"
                  href={facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="h-12 bg-white/5 hover:bg-white/10 text-white rounded-2xl flex items-center justify-center gap-2 transition-all border border-white/5 active:scale-95 text-xs font-bold uppercase tracking-wider"
                >
                  <Facebook className="w-4 h-4 text-cyan-400" />
                  Facebook
                </a>
              </div>

              {/* Copiar enlace & qr download action bar */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  id="share-copy-link-btn"
                  onClick={handleCopyLink}
                  className={`h-12 rounded-2xl flex items-center justify-center gap-2 transition-all border active:scale-95 text-xs font-bold uppercase tracking-wider ${
                    copied
                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                      : 'bg-white/5 hover:bg-white/10 text-white border-white/5'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-400" />
                      ¡Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-zinc-400" />
                      Copiar Link
                    </>
                  )}
                </button>

                <button
                  id="share-download-qr-btn"
                  onClick={handleDownloadQR}
                  className="h-12 bg-cyan-400/5 hover:bg-cyan-400/10 text-[#00FFFF] rounded-2xl flex items-center justify-center gap-2 transition-all border border-cyan-400/15 active:scale-95 text-xs font-bold uppercase tracking-wider"
                >
                  <Download className="w-4 h-4" />
                  Descargar QR
                </button>
              </div>

              {/* Native mobile share if supported */}
              {navigator.share && (
                <button
                  id="native-share-btn"
                  onClick={handleNativeShare}
                  className="w-full text-center text-[10px] text-[#00FFFF] font-extrabold uppercase tracking-widest mt-2 hover:opacity-80 transition-opacity"
                >
                  Compartir vía sistema nativo del móvil
                </button>
              )}
            </div>

            {/* Bottom Branding Watermark */}
            <div className="flex items-center justify-center gap-1.5 mt-8 text-[9px] text-white/20 select-none uppercase tracking-[0.2em] pointer-events-none">
              <Zap className="w-2.5 h-2.5 text-[#00FFFF]/30 animate-pulse" />
              <span>Tarjeta Virtual Autenticada</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
