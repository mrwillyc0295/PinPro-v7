import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface IAStatusCardProps {
  onAction?: () => void;
  count?: number;
  category?: string;
}

export const IAStatusCard = React.memo(({
  onAction,
  count = 5,
  category = "Tecnología"
}: IAStatusCardProps) => {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="relative w-full bg-gradient-to-br from-[#1A1C20] to-[#336C6F] p-[1px] rounded-2xl shadow-[0_10px_30px_rgba(0,255,204,0.15)] border border-[#00FFCC]/30 overflow-hidden"
    >
      {/* Decorative Blur Background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FFCC]/10 blur-[50px] rounded-full -mr-10 -mt-10 pointer-events-none"></div>

      <div className="p-5 flex flex-col gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-[#00FFCC]/20 flex items-center justify-center border border-[#00FFCC]/30 shadow-[0_0_15px_rgba(0,255,204,0.2)]">
              <Sparkles className="w-5 h-5 text-[#00FFCC] animate-pulse" />
            </div>
            {/* Pulsing indicator */}
            <div className="absolute -top-1 -right-1 w-4 h-4">
              <div className="absolute inset-0 bg-[#00FFCC] rounded-full animate-ping opacity-75"></div>
              <div className="relative w-4 h-4 bg-[#00FFCC] rounded-full shadow-[0_0_12px_#00FFCC] border-2 border-black"></div>
            </div>
          </div>
          <div className="flex flex-col flex-1">
            <h3 className="text-white font-black text-sm uppercase tracking-tight flex items-center gap-2">
              IA Analizando <span className="text-[#00FFCC] text-[10px] animate-pulse">tu zona</span>
            </h3>
            <p className="text-white/80 text-[13px] font-bold mt-1 leading-snug">
              Hay <strong className="text-[#00FFCC]">{count} nuevos pedidos</strong> de <em className="not-italic text-white border-b border-[#00FFCC]/40">{category}</em> cerca de ti.
            </p>
          </div>
        </div>

        <button
          onClick={onAction}
          className="group w-full bg-[#00FFCC]/10 hover:bg-[#00FFCC] border-2 border-[#00FFCC]/30 hover:border-[#00FFCC] text-[#00FFCC] hover:text-black font-black text-xs py-3.5 rounded-xl flex items-center justify-center gap-3 uppercase tracking-[0.1em] transition-all duration-500 shadow-[0_0_15px_rgba(0,255,204,0.1)] active:scale-[0.98]"
        >
          Ofrecer mis servicios ahora
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
});
