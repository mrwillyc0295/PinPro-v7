import { ArrowLeft, MapPin, Zap, Shield, Target, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-surface-lowest text-on-surface overflow-y-auto hide-scrollbar">
      {/* Header */}
      <header className="px-6 pt-12 pb-4 sticky top-0 z-10 bg-surface-lowest/80 backdrop-blur-xl border-b border-surface-highest flex items-center gap-4">
        <div className="w-10 h-10"></div>
        <h1 className="text-xl font-display font-bold">Acerca de PINPRO</h1>
      </header>

      <div className="p-6 space-y-8">
        {/* Hero */}
        <div className="flex flex-col items-center text-center space-y-4 py-6">
          <div className="w-20 h-20 rounded-full bg-primary-container/10 flex items-center justify-center border border-primary-container/30 shadow-[0_0_30px_rgba(0,255,255,0.2)]">
            <MapPin className="w-10 h-10 text-primary-container drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]" />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-on-surface drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">PINPRO</h2>
          <p className="text-on-surface-variant text-sm max-w-xs leading-relaxed">
            Conectando necesidades con soluciones a través de tecnología de precisión.
          </p>
        </div>

        {/* Mission / Tech */}
        <div className="bg-surface-container/40 rounded-3xl p-8 border border-outline-variant/30 space-y-6 shadow-[0_5px_20px_-5px_rgba(0,0,0,0.3)]">
          <h3 className="text-xl font-black text-primary-container uppercase tracking-widest">Nuestra Tecnología</h3>
          <p className="text-base text-on-surface/90 leading-relaxed">
            PINPRO utiliza un motor de <strong className="text-on-surface font-black">geolocalización de última generación</strong>. Nuestro algoritmo analiza en tiempo real tu ubicación exacta para conectarte instantáneamente con los profesionales más calificados que se encuentran en tu radio de cercanía.
          </p>
          <p className="text-base text-on-surface/90 leading-relaxed">
            Eliminamos los tiempos de espera y optimizamos la logística para que recibas el servicio que necesitas, justo cuando lo necesitas.
          </p>
        </div>

        {/* Features */}
        <div className="grid gap-6">
          <button
            onClick={() => navigate('/masterminds')}
            className="flex items-center justify-between gap-4 bg-primary-container p-8 rounded-[2.5rem] border border-primary-container/30 shadow-[0_10px_30px_-10px_rgba(0,255,255,0.4)] group active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-black/20 flex items-center justify-center">
                <Brain className="w-8 h-8 text-black" />
              </div>
              <div className="text-left">
                <h4 className="text-lg font-black text-black uppercase italic tracking-tight">The Masterminds</h4>
                <p className="text-xs text-black/60 font-bold uppercase tracking-widest">Ver la visión del concepto</p>
              </div>
            </div>
            <ArrowLeft className="w-6 h-6 text-black rotate-180 group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="flex items-start gap-6 bg-surface p-6 rounded-2xl border border-outline-variant/20 hover:border-primary-container/30 transition-colors shadow-sm">
            <div className="w-12 h-12 rounded-full bg-primary-container/10 flex items-center justify-center shrink-0">
              <Target className="w-6 h-6 text-primary-container" />
            </div>
            <div>
              <h4 className="font-black text-base mb-2 text-on-surface">Precisión Absoluta</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">Mapeo hiperlocal para encontrar al experto más cercano a tu puerta en cuestión de segundos.</p>
            </div>
          </div>

          <div className="flex items-start gap-6 bg-surface p-6 rounded-2xl border border-outline-variant/20 hover:border-primary-container/30 transition-colors shadow-sm">
            <div className="w-12 h-12 rounded-full bg-primary-container/10 flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 text-primary-container" />
            </div>
            <div>
              <h4 className="font-black text-base mb-2 text-on-surface">Conexión Instantánea</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">Notificaciones en tiempo real y asignación inteligente para una respuesta inmediata.</p>
            </div>
          </div>

          <div className="flex items-start gap-6 bg-surface p-6 rounded-2xl border border-outline-variant/20 hover:border-primary-container/30 transition-colors shadow-sm">
            <div className="w-12 h-12 rounded-full bg-primary-container/10 flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6 text-primary-container" />
            </div>
            <div>
              <h4 className="font-black text-base mb-2 text-on-surface">Red Segura</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">Profesionales verificados y rastreo de ubicación en vivo durante la prestación del servicio.</p>
            </div>
          </div>
        </div>

        <div className="text-center pt-4 pb-8">
          <p className="text-xs text-on-surface-variant font-mono">PINPRO v1.0.0</p>
          <p className="text-[10px] text-on-surface-variant/60 mt-1">© 2026 PINPRO Technologies</p>
        </div>
      </div>
    </div>
  );
}
