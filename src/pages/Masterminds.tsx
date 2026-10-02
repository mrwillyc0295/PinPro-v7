import { ArrowLeft, Brain, Cpu, Globe, Sparkles, Rocket, Zap, Users, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, Variants } from 'motion/react';

export default function Masterminds() {
  const navigate = useNavigate();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#05070a] text-white overflow-y-auto hide-scrollbar selection:bg-primary-container selection:text-black">
      {/* Header */}
      <header className="px-6 pt-12 pb-4 sticky top-0 z-50 bg-[#05070a]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-center">
        <h1 className="text-xl font-display font-black tracking-tighter uppercase italic text-primary-container">Masterminds</h1>
      </header>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-6 space-y-12 pb-20"
      >
        {/* Hero Section */}
        <motion.div variants={itemVariants} className="space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/10 border border-primary-container/20 text-primary-container text-[10px] font-black uppercase tracking-[0.2em]">
            <Sparkles className="w-3 h-3" />
            The Visionary Concept
          </div>
          <h2 className="text-5xl font-black leading-[0.9] tracking-tighter uppercase italic">
            Redefiniendo el <span className="text-primary-container drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]">Espacio-Tiempo</span> del Servicio.
          </h2>
          <p className="text-white/60 text-sm leading-relaxed max-w-sm">
            No estamos construyendo una app. Estamos creando un ecosistema de proximidad absoluta donde la necesidad y la solución colisionan en tiempo real.
          </p>
        </motion.div>

        {/* The Concept Cards */}
        <div className="grid gap-6">
          <motion.div
            variants={itemVariants}
            className="group relative p-6 rounded-[2rem] bg-gradient-to-br from-white/5 to-transparent border border-white/10 overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Globe className="w-24 h-24 text-primary-container" />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary-container flex items-center justify-center text-black shadow-[0_0_20px_rgba(0,255,255,0.4)]">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black uppercase italic tracking-tight">Geolocalización Neuronal</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Nuestra arquitectura no solo rastrea coordenadas; entiende el flujo de la ciudad. Conectamos al profesional no solo por distancia, sino por disponibilidad predictiva.
              </p>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="group relative p-6 rounded-[2rem] bg-gradient-to-br from-white/5 to-transparent border border-white/10 overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Cpu className="w-24 h-24 text-primary-container" />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-primary-container border border-primary-container/30">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black uppercase italic tracking-tight">Latencia Cero</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                En el mundo de las emergencias, cada segundo cuenta. PINPRO elimina las capas de fricción tradicionales, permitiendo una contratación en menos de 3 toques.
              </p>
            </div>
          </motion.div>
        </div>

        {/* The Masterminds Behind */}
        <motion.div variants={itemVariants} className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-white/10"></div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">The Masterminds</h3>
            <div className="h-px flex-1 bg-white/10"></div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-6 p-4 rounded-3xl bg-white/5 border border-white/5">
              <div className="w-20 h-20 rounded-2xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-500 border border-white/10">
                <img
                  src="/mastermind-1.png"
                  alt="Willy C"
                  className="w-full h-full object-cover grayscale-0"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-black uppercase italic tracking-tight">Willy C.</h4>
                <p className="text-[10px] text-primary-container font-bold uppercase tracking-widest mb-2">Lead Architect & Visionary</p>
                <p className="text-xs text-white/50 leading-relaxed">
                  El cerebro detrás de la lógica de geolocalización y la experiencia de usuario futurista.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 p-4 rounded-3xl bg-white/5 border border-white/5">
              <div className="w-20 h-20 rounded-2xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-500 border border-white/10">
                <img
                  src="/mastermind-2.png"
                  alt="AI Core"
                  className="w-full h-full object-cover grayscale-0"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-black uppercase italic tracking-tight">AI Core</h4>
                <p className="text-[10px] text-primary-container font-bold uppercase tracking-widest mb-2">Systems Intelligence</p>
                <p className="text-xs text-white/50 leading-relaxed">
                  La inteligencia que orquesta cada conexión, asegurando que la red sea siempre eficiente y segura.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          variants={itemVariants}
          className="p-8 rounded-[2.5rem] bg-primary-container text-black text-center space-y-6 shadow-[0_20px_50px_-10px_rgba(0,255,255,0.4)]"
        >
          <Rocket className="w-12 h-12 mx-auto animate-bounce" />
          <div className="space-y-2">
            <h3 className="text-2xl font-black uppercase italic leading-none">¿Listo para el futuro?</h3>
            <p className="text-sm font-bold opacity-70">Únete a la red de profesionales más avanzada del planeta.</p>
          </div>
          <button
            onClick={() => navigate('/register')}
            className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all"
          >
            Comenzar Ahora
          </button>
        </motion.div>

        {/* Footer info */}
        <motion.div variants={itemVariants} className="text-center space-y-4 pt-8 opacity-40">
          <div className="flex justify-center gap-6">
            <Users className="w-5 h-5" />
            <ShieldCheck className="w-5 h-5" />
            <Globe className="w-5 h-5" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.5em]">PINPRO Masterminds © 2026</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
