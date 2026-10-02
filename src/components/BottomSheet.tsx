import React, { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MapPin, X, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';

interface BottomSheetProps {
  pro: any | null;
  onClose: () => void;
}

const BottomSheet = memo(({ pro, onClose }: BottomSheetProps) => {
  if (!pro) return null;

  let basePrice = '';
  if (pro.services && pro.services.length > 0) {
    const prices = pro.services.map((s: any) => parseFloat(s.price.replace(/[^0-9.]/g, ''))).filter((p: number) => !isNaN(p) && p > 0);
    if (prices.length > 0) {
      const minPrice = Math.min(...prices);
      basePrice = `Desde $${minPrice}`;
    }
  }

  return (
    <AnimatePresence>
      {pro && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[3000]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[3001] bg-surface-lowest rounded-t-3xl p-6 shadow-2xl border-t border-outline-variant/10"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-surface-container hover:bg-surface-highest transition-colors"
            >
              <X className="w-5 h-5 text-on-surface" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-surface-highest border border-primary-container/30 shadow-lg">
                {pro.photoUrl ? (
                  <img src={pro.photoUrl} alt={pro.name} loading="lazy" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-black bg-primary-container/20 text-primary-container">
                    {pro.name?.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <h2 className="text-xl font-black text-on-surface truncate leading-tight">
                  {pro.name ? DOMPurify.sanitize(pro.name, { ALLOWED_TAGS: [] }) : ''}
                </h2>
                <p className="text-sm text-primary-container font-black uppercase tracking-wider truncate mb-1">
                  {pro.profession ? DOMPurify.sanitize(pro.profession, { ALLOWED_TAGS: [] }) : 'Profesional'}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-[#FFD700] fill-current" />
                    <span className="text-sm font-black text-on-surface">{pro.rating || '4.5'}</span>
                  </div>
                  {basePrice && (
                    <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                      {basePrice}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center text-on-surface-variant text-sm mb-6 gap-2 bg-surface-container/50 p-3 rounded-xl border border-outline-variant/10">
              <MapPin className="w-4 h-4 shrink-0" />
              <p className="truncate">{pro.municipality ? `${pro.municipality}, ${pro.state}` : (pro.country || 'Ubicación')}</p>
            </div>

            <Link
              to={`/profile/${pro.id}`}
              className="w-full flex items-center justify-center gap-2 bg-primary-container text-surface-lowest text-sm font-black py-4 rounded-2xl shadow-[0_4px_15px_rgba(0,255,255,0.3)] hover:shadow-[0_4px_25px_rgba(0,255,255,0.5)] transition-all active:scale-[0.98] uppercase tracking-wider"
            >
              Ver Perfil Completo
              <ChevronRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

export default BottomSheet;
