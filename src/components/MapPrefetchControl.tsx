import React, { useState, useEffect } from 'react';
import {
  prefetchMargaritaTiles,
  getCachedTilesCount,
  clearTileCache,
  MARGARITA_ZONES
} from '../lib/offlineTileCache';
import {
  Download,
  Trash2,
  CheckCircle,
  Loader2,
  Database,
  Wifi,
  WifiOff,
  Globe,
  Map as MapIcon,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function MapPrefetchControl() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [cacheStats, setCacheStats] = useState({ count: 0, sizeMB: 0 });
  const [progress, setProgress] = useState({ carried: 0, total: 0 });
  const [currentTileUrl, setCurrentTileUrl] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);

  useEffect(() => {
    updateStats();

    // Check if previously completed
    const completed = localStorage.getItem('margarita_prefetch_completed') === 'true';
    const timestamp = localStorage.getItem('margarita_prefetch_timestamp');
    setIsCompleted(completed);
    if (timestamp) {
      const dateObj = new Date(timestamp);
      setLastSyncDate(dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  }, []);

  const updateStats = async () => {
    const stats = await getCachedTilesCount();
    setCacheStats(stats);
  };

  const handlePrefetch = async () => {
    if (isPrefetching) return;
    setIsPrefetching(true);
    setIsCompleted(false);
    setProgress({ carried: 0, total: 0 });

    try {
      await prefetchMargaritaTiles((carried, total, url) => {
        setProgress({ carried, total });
        if (url) {
          const parts = url.split('/');
          // Extract zoom, x, y coordinates
          const z = parts[parts.length - 3] || '';
          const x = parts[parts.length - 2] || '';
          const y = parts[parts.length - 1] || '';
          setCurrentTileUrl(`Z:${z} | X:${x} | Y:${y.replace('.png', '')}`);
        }
      });
      setIsCompleted(true);
      const timestamp = new Date().toISOString();
      const dateObj = new Date(timestamp);
      setLastSyncDate(dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      updateStats();
    } catch (err) {
      console.error('Error prefetching tiles:', err);
    } finally {
      setIsPrefetching(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('¿Estás seguro de que deseas purgar la caché física del mapa? Los mapas necesitarán conexión a internet activa para recargar.')) return;
    await clearTileCache();
    setIsCompleted(false);
    setLastSyncDate(null);
    updateStats();
  };

  const progressPercent = progress.total > 0 ? Math.round((progress.carried / progress.total) * 100) : 0;

  return (
    <div className="relative z-30">
      {/* Floating map prefetch badge/trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all bg-black/90 border-2 active:scale-95 shadow-lg select-none ${
          isPrefetching
            ? 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)]'
            : isCompleted
            ? 'border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.3)]'
            : cacheStats.count > 0
            ? 'border-[#00FFFF] shadow-[0_0_15px_rgba(0,255,255,0.2)]'
            : 'border-white/20'
        }`}
        title="Offline Map prefetch panel"
      >
        {isPrefetching ? (
          <Loader2 className="w-5 h-5 sm:w-7 sm:h-7 text-yellow-400 animate-spin" />
        ) : isCompleted ? (
          <Wifi className="w-5 h-5 sm:w-7 sm:h-7 text-green-400 animate-pulse" />
        ) : (
          <Globe className="w-5 h-5 sm:w-7 sm:h-7 text-[#00FFFF]" />
        )}
      </button>

      {/* Floating control card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="absolute left-0 bottom-16 sm:bottom-20 w-[300px] sm:w-[350px] bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl overflow-hidden text-white"
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b border-white/5 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#00FFFF]" />
                <h4 className="font-bold text-xs uppercase tracking-widest text-[#00FFFF]">Prefetch de Mapas</h4>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/40 hover:text-white transition-colors text-xs uppercase tracking-normal p-1 hover:bg-white/5 rounded"
              >
                Cerrar
              </button>
            </div>

            {/* Offline Shield Indicator */}
            <div className={`p-3 rounded-xl border mb-3 flex items-start gap-2.5 ${
              isCompleted
                ? 'bg-green-500/10 border-green-500/20 text-green-300'
                : cacheStats.count > 0
                ? 'bg-[#00FFFF]/5 border-[#00FFFF]/10 text-cyan-300'
                : 'bg-zinc-800/40 border-zinc-700/30 text-zinc-400'
            }`}>
              <div className="mt-0.5">
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                ) : (
                  <MapIcon className="w-4 h-4 text-cyan-400 shrink-0" />
                )}
              </div>
              <div className="flex-1 text-xs">
                <div className="font-bold flex items-center gap-1.5 justify-between">
                  <span>{isCompleted ? 'Isla Offline Ready' : cacheStats.count > 0 ? 'Caché Parcialmente Lista' : 'Memoria sin Cargar'}</span>
                  {isCompleted && (
                    <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold animate-pulse">Listo</span>
                  )}
                </div>
                <p className="opacity-70 mt-0.5 text-[11px] leading-relaxed">
                  {isCompleted
                    ? 'Todo el plano urbano principal de Margarita cargará al instante aunque no tengas megas ni red.'
                    : 'Descarga de forma inteligente los mapas locales para asegurar el funcionamiento sin cobertura.'}
                </p>
              </div>
            </div>

            {/* Cache State & Storage info */}
            <div className="grid grid-cols-2 gap-2 mb-3 bg-white/5 p-2 rounded-xl text-center select-none">
              <div>
                <span className="block text-[10px] uppercase text-white/40 font-semibold tracking-wider">Tiles Guardados</span>
                <span className="text-sm font-black text-cyan-400 mt-0.5 block">{cacheStats.count.toLocaleString()}</span>
              </div>
              <div className="border-l border-white/5">
                <span className="block text-[10px] uppercase text-white/40 font-semibold tracking-wider">Espacio Estimado</span>
                <span className="text-sm font-black text-cyan-400 mt-0.5 block">{cacheStats.sizeMB} MB</span>
              </div>
            </div>

            {/* Prefetch Action / Progress and loaders */}
            {isPrefetching ? (
              <div className="mb-4">
                <div className="flex justify-between items-center text-[11px] font-bold mb-1 text-yellow-400 select-none">
                  <span className="flex items-center gap-1 animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Descargando Margarita...
                  </span>
                  <span>{progressPercent}%</span>
                </div>
                {/* Visual smooth progress bar */}
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <motion.div
                    className="bg-yellow-400 h-full rounded-full"
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
                <div className="flex justify-between items-center text-[9px] text-white/40 mt-1 uppercase tracking-wider">
                  <span>Procesados: {progress.carried} / {progress.total}</span>
                  <span className="font-mono truncate max-w-[150px] text-right">{currentTileUrl}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 mb-3 select-none">
                <button
                  onClick={handlePrefetch}
                  className="w-full text-center py-2 px-3 bg-[#00FFFF]/10 hover:bg-[#00FFFF]/20 text-[#00FFFF] border border-[#00FFFF]/30 hover:border-[#00FFFF]/50 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  {cacheStats.count > 0 ? 'Actualizar Prefetch (3.5MB)' : 'Guardar Mapa de Margarita'}
                </button>

                {cacheStats.count > 0 && (
                  <button
                    onClick={handleClear}
                    className="w-full text-center py-1.5 px-3 bg-red-500/5 hover:bg-red-500/15 text-red-400 border border-red-500/10 hover:border-red-500/30 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Limpiar Memoria de Mapas
                  </button>
                )}
              </div>
            )}

            {/* Map prefetching zone summary */}
            <div className="border-t border-white/5 pt-2.5 mb-1 text-left">
              <div className="flex items-center justify-between pointer-events-none mb-1.5">
                <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Mapeo de Cobertura</span>
                {lastSyncDate && (
                  <span className="text-[9px] text-white/30 truncate">Sinc: {lastSyncDate}</span>
                )}
              </div>
              <div className="max-h-[120px] overflow-y-auto pr-1 flex flex-col gap-1 text-[11px] bg-black/40 rounded-lg p-1.5 text-zinc-400">
                {MARGARITA_ZONES.map((zone, idx) => (
                  <div key={idx} className="flex justify-between items-center py-0.5 border-b border-white/5 last:border-0">
                    <span className="text-white/80 font-semibold truncate max-w-[160px]">{zone.name}</span>
                    <span className="text-[9px] text-zinc-500 shrink-0 font-medium">Zooms: {zone.zooms.join(', ')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Secure connection watermark */}
            <div className="flex items-center justify-center gap-1 text-[9px] text-white/20 select-none uppercase tracking-widest mt-2 pointer-events-none">
              <Zap className="w-2.5 h-2.5 text-[#00FFFF]/30 animate-pulse" />
              <span>PinPro Ultra-Cache Encrypted</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
