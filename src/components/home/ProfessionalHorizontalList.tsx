import React, { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import DOMPurify from 'dompurify';
import { Star, BadgeCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SafeBoundary } from '../SafeBoundary';

interface Professional {
  id: string;
  name: string;
  photoUrl?: string;
  profession?: string;
  isElite?: boolean;
  isPremium?: boolean;
  isOnline?: boolean;
  instagram?: string;
  facebook?: string;
  rating?: number;
  services?: any[];
}

const ProfessionalCard = memo(({ pro, idx, viewMode }: { pro: Professional; idx: number; viewMode: string }) => {
  return (
    <Link
      to={`/profile/${pro.id}`}
      className={cn(
        "min-w-[240px] w-[240px] sm:min-w-[280px] sm:w-[280px] h-[88px] sm:h-[100px] bg-[#111318]/95 backdrop-blur-2xl rounded-[20px] shadow-lg snap-center border transition-all duration-500 flex flex-row group overflow-hidden shrink-0 active:scale-[0.98]",
        pro.isElite
          ? "border-[#FFD700]/40 ring-1 ring-[#FFD700]/10"
          : pro.isPremium
            ? "border-[#FF00FF]/40 ring-1 ring-[#FF00FF]/10"
            : "border-outline-variant/10",
      )}
    >
      <div className="relative w-[88px] sm:w-[100px] h-full shrink-0 overflow-hidden border-r border-outline-variant/10">
        {pro.photoUrl ? (
          <img
            alt={pro.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            src={pro.photoUrl}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-highest text-on-surface font-black text-2xl uppercase">
            {pro.name?.charAt(0) || "P"}
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 min-w-0 p-2.5 sm:p-3 relative bg-gradient-to-br from-transparent to-surface-highest/5 gap-1">
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1 sm:gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h4
                className={cn(
                  "font-black text-on-surface text-[14px] sm:text-[18px] truncate leading-tight transition-colors duration-300",
                  pro.isElite
                    ? "group-hover:text-[#FFD700]"
                    : pro.isPremium
                      ? "group-hover:text-[#FF00FF]"
                      : "group-hover:text-primary-container",
                )}
              >
                {pro.name ? DOMPurify.sanitize(pro.name, { ALLOWED_TAGS: [] }) : ""}
              </h4>
              {pro.instagram && pro.facebook && (
                <BadgeCheck className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-[#0095f6] shrink-0 drop-shadow-[0_0_12px_rgba(0,149,246,0.6)]" />
              )}
            </div>
          </div>

          <p className="text-[9px] sm:text-[12px] text-on-surface-variant font-bold uppercase tracking-[0.1em] truncate mt-0.5 opacity-80">
            {pro.profession ? DOMPurify.sanitize(pro.profession, { ALLOWED_TAGS: [] }) : "Profesional"}
          </p>

          {(pro.isPremium || pro.isElite) && (
            <div
              className={cn(
                "mt-1.5 self-start px-1.5 sm:px-2 py-[1px] rounded-full text-[6px] sm:text-[8px] font-bold tracking-widest border shadow-sm",
                pro.isElite
                  ? "bg-[#FFD700]/10 border-[#FFD700]/40 text-[#FFD700]"
                  : "bg-[#FF00FF]/10 border-[#FF00FF]/40 text-[#FF00FF]",
              )}
            >
              {pro.isElite ? "ELITE" : "PREMIUM"}
            </div>
          )}

          <div className="flex items-center gap-2 mt-3">
            <div
              className={cn(
                "w-2.5 h-2.5 rounded-full shrink-0 animate-pulse",
                pro.isOnline
                  ? "bg-green-500 shadow-[0_0_10px_#22c55e]"
                  : "bg-red-500 shadow-[0_0_10px_#ef4444]"
              )}
            ></div>
            <span className={cn(
              "text-[7px] sm:text-[9px] font-black uppercase tracking-widest",
              pro.isOnline ? "text-green-500/90" : "text-red-500/90"
            )}>
              {pro.isOnline ? "ACTIVO" : "INACTIVO"}
            </span>
          </div>
        </div>

        <div className="absolute bottom-2.5 right-10 sm:right-16 transition-all duration-300">
          <div className="flex items-center gap-1.5 bg-surface-highest/90 px-3 py-1 rounded-full border border-white/10 backdrop-blur-2xl shadow-[0_6px_16px_rgba(0,0,0,0.5)] shrink-0 group-hover:border-primary-container/40 scale-110">
            <Star className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFD700] fill-current drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]" />
            <span className="text-[14px] sm:text-[18px] font-black text-on-surface tracking-tighter">
              {pro.rating || (pro.isElite ? "5.0" : pro.isPremium ? "4.8" : "4.5")}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
});

ProfessionalCard.displayName = 'ProfessionalCard';

export const ProfessionalHorizontalList = memo(({
  professionals,
  searchTerm,
  viewMode,
  lastVisible,
  loadMoreProfessionals,
  isMoreLoading
}: {
  professionals: Professional[];
  searchTerm: string;
  viewMode: string;
  lastVisible: any;
  loadMoreProfessionals: () => void;
  isMoreLoading: boolean;
}) => {
  return (
    <div className="w-full relative h-[140px] sm:h-[160px] flex items-center">
      <SafeBoundary>
        <div className="flex overflow-x-auto gap-4 px-6 sm:px-8 snap-x snap-mandatory hide-scrollbar pb-6 pt-2">
          {professionals.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-w-full h-[88px] sm:h-[100px] border-2 border-dashed border-outline-variant/10 rounded-2xl">
              <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-on-surface-variant/30 mb-1" />
              <div className="text-on-surface-variant text-[10px] sm:text-[13px] font-bold uppercase tracking-widest text-center opacity-70">
                {searchTerm ? `No hay coincidencias` : "Busca en otra zona"}
              </div>
            </div>
          ) : (
            <>
              {professionals.map((pro, idx) => (
                <ProfessionalCard
                  key={pro.id}
                  pro={pro}
                  idx={idx}
                  viewMode={viewMode}
                />
              ))}
              {lastVisible && (
                <div className="min-w-[140px] flex items-center justify-center shrink-0 snap-center">
                  <button
                    onClick={loadMoreProfessionals}
                    disabled={isMoreLoading}
                    className="w-full h-[88px] sm:h-[100px] bg-surface-highest/30 hover:bg-surface-highest/50 border border-outline-variant/10 rounded-[20px] flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group"
                  >
                    {isMoreLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-primary-container" />
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded-full bg-primary-container/10 flex items-center justify-center group-hover:bg-primary-container/20 border border-primary-container/20">
                          <Plus className="w-4 h-4 text-primary-container" />
                        </div>
                        <span className="text-[10px] font-black text-on-surface uppercase tracking-widest">
                          Ver Más
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </SafeBoundary>
    </div>
  );
});

ProfessionalHorizontalList.displayName = 'ProfessionalHorizontalList';
