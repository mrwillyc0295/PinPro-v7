import React from 'react';
import { motion } from 'motion/react';
import { Radar, Zap, MapPin, TrendingUp, Cpu } from 'lucide-react';

interface Opportunity {
  id: string;
  location: string;
  category: string;
  clients: number;
  trend: string;
}

const opportunities: Opportunity[] = [
  { id: '1', location: 'Pampatar', category: 'Desarrollo Web', clients: 3, trend: '↑ 20% hoy' },
  { id: '2', location: 'Porlamar', category: 'Reparación Técnica', clients: 5, trend: '↑ 15% hoy' },
];

export const AIMonitor: React.FC = () => {
  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="bg-[#111] border border-[#336C6F]/50 rounded-[24px] p-6 shadow-[0_15px_40px_rgba(0,0,0,0.4)] relative overflow-hidden group"
    >
      {/* Radar Background Effect */}
      <div className="absolute -right-20 -top-20 w-64 h-64 border border-[#00FFCC]/10 rounded-full flex items-center justify-center pointer-events-none group-hover:scale-110 transition-transform duration-1000">
        <div className="w-48 h-48 border border-[#00FFCC]/10 rounded-full flex items-center justify-center rotate-45 animate-pulse">
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#00FFCC]/20 to-transparent"></div>
        </div>
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="bg-[#00FFCC] text-black text-[9px] font-black px-2 py-0.5 rounded shadow-[0_0_10px_#00FFCC]">
                IA AUTÓNOMA ACTIVA
              </span>
              <div className="flex gap-0.5">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-1 h-3 bg-[#00FFCC]/30 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ height: ['20%', '100%', '20%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                      className="w-full bg-[#00FFCC]"
                    />
                  </div>
                ))}
              </div>
            </div>
            <h3 className="text-white font-black text-xl tracking-tight mt-1 flex items-center gap-2">
              <Radar className="w-5 h-5 text-[#336C6F]" />
              Radar de Oportunidades
            </h3>
          </div>
          <Cpu className="w-8 h-8 text-[#336C6F]/30" />
        </div>

        <div className="space-y-4 mb-6">
          {opportunities.map((opt) => (
            <motion.div
              key={opt.id}
              whileHover={{ x: 5 }}
              className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col gap-3 group/item transition-all hover:bg-white/[0.08]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#336C6F]/20 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-[#00FFCC]" />
                  </div>
                  <div>
                    <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">Ubicación Estratégica</p>
                    <p className="text-white font-bold text-sm">{opt.location}</p>
                  </div>
                </div>
                <span className="text-[#00FFCC] text-[10px] font-black flex items-center gap-1 bg-[#00FFCC]/10 px-2 py-1 rounded-lg">
                  <TrendingUp className="w-3 h-3" />
                  {opt.trend}
                </span>
              </div>

              <p className="text-white/80 text-xs leading-relaxed">
                Alta demanda de <strong className="text-white font-black">'{opt.category}'</strong>. {opt.clients} clientes esperando ser contactados.
              </p>
            </motion.div>
          ))}
        </div>

        <button className="relative w-full group/btn overflow-hidden">
          <div className="absolute inset-0 bg-[#336C6F] group-hover/btn:bg-[#00FFCC] transition-colors duration-300 rounded-xl" />
          <div className="relative px-6 py-4 flex items-center justify-center gap-3 text-white group-hover/btn:text-black font-black text-xs uppercase tracking-[0.2em] transition-colors">
            <Zap className="w-4 h-4 animate-bounce" />
            Postularme automáticamente
          </div>
        </button>

        <p className="text-center text-white/30 text-[9px] mt-4 font-bold uppercase tracking-widest">
          Optimización de perfil 98% • Algoritmo en curso
        </p>
      </div>
    </motion.div>
  );
};
