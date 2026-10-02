import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, HelpCircle, Navigation, Award, Sparkles,
  ChevronRight, ChevronLeft, Check, Compass,
  MapPin, ShieldCheck, HeartHandshake, RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export const PinProTour: React.FC = () => {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Check if tour has already been completed; if not, trigger automatically
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('pinpro_tour_completed');
    if (!hasSeenTour && profile) {
      // Trigger with a subtle delay to let components render smoothly
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [profile]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('pinpro_tour_completed', 'true');
    setCurrentStep(0);
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setIsOpen(true);
  };

  const steps = [
    {
      title: "🚀 Bienvenido al Ecosistema PinPro",
      icon: HeartHandshake,
      iconColor: "text-[#39FF14]",
      glowColor: "rgba(57, 255, 20, 0.25)",
      description: "¡Hola! Soy tu asistente de crecimiento PinPro. He diseñado esta guía interactiva para ayudarte a navegar nuestra plataforma local en tiempo real de alto rendimiento. PinPro está construido para que crezcas tu marca personal, generes ingresos o consigas el servicio exacto al instante.",
      tip: "💡 Dato PinPro: Más del 85% de los clientes prefieren servicios con GPS de precisión integrado activo."
    },
    {
      title: "🎭 Identidad Operativa (Tus 3 Roles)",
      icon: Award,
      iconColor: "text-cyan-400",
      glowColor: "rgba(6, 182, 212, 0.25)",
      description: "Operas libre de confusiones: arriba cuentas con el Badge de Rol en Tiempo Real. En PinPro existen 3 caminos:\n\n1. Cliente: Busca contratar servicios locales bajo demanda.\n2. Profesional PinPro: Ofrece su talento, con ranking, portafolio y radar activo.\n3. Agente / Referidor PinPro: Multiplica sus ingresos recomendando a otros socios.",
      tip: "💡 Conoce tu camino: El color del badge superior cambiará inteligentemente según el rol que asumiste."
    },
    {
      title: "📡 Estado de Nube Descentralizada",
      icon: RefreshCw,
      iconColor: "text-emerald-400",
      glowColor: "rgba(16, 185, 129, 0.25)",
      description: "Junto al badge de rol, verás el indicador 'NUBE ACTIVA'. Este componente sincroniza asíncronamente con Firebase Firestore en milisegundos. Si pierdes tu señal, PinPro continuará operando de manera offline gracias a la tecnología de caché local y se sincronizará automáticamente al recuperar tu red.",
      tip: "🛡️ Ciberseguridad: Tus datos de geolocalización y transacciones están cifrados de extremo a extremo."
    },
    {
      title: "📍 Geolocalización y Radar en Vivo",
      icon: MapPin,
      iconColor: "text-rose-400",
      glowColor: "rgba(244, 63, 94, 0.25)",
      description: "En la pantalla 'Explorar' (Compass) cuentas con un mapa interactivo de precisión militar. El radar dinámico escanea y proyecta únicamente profesionales que se encuentran activos a tu distancia real de interacción.",
      tip: "📍 Geolocalización: PinPro solicita accesos precisos solo en modo activo para respaldar tu seguridad."
    },
    {
      title: "⚙️ Alterna y Edita tu Perfil",
      icon: Sparkles,
      iconColor: "text-amber-400",
      glowColor: "rgba(245, 158, 11, 0.25)",
      description: "Cambia de rol en cualquier momento desde tu panel de usuario o sección de configuración. PinPro incentiva la dualidad: puedes ser cliente en la mañana para contratar una mudanza, y profesional en la tarde ofreciendo asesorías técnicas o reparaciones.",
      tip: "🚀 Estrategia Pro: Completa tu portafolio oficial para un ranking inmediato con inteligencia artificial."
    }
  ];

  const currentStepData = steps[currentStep];
  const StepIcon = currentStepData?.icon || HelpCircle;

  return (
    <>
      {/* Floating help action button */}
      <div className="fixed bottom-20 right-6 z-45 pointer-events-none md:bottom-6">
        <motion.button
          onClick={handleRestart}
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Ver Guía de Roles y Navegación"
          className="pointer-events-auto flex items-center justify-center w-12 h-12 rounded-full bg-stone-900 border border-[#39FF14]/30 text-[#39FF14] shadow-[0_0_20px_rgba(57,255,20,0.3)] hover:bg-[#39FF14]/10 transition-all duration-300"
        >
          <HelpCircle className="w-6 h-6 animate-pulse" />
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            {/* Spotlight background overlays */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none overflow-hidden"
            >
              {currentStep === 1 && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-20 rounded-full bg-[#00FFFF]/5 border border-[#00FFFF]/20 filter blur-xl animate-pulse" />
              )}
              {currentStep === 2 && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-20 rounded-full bg-emerald-500/5 border border-emerald-500/20 filter blur-xl animate-pulse" />
              )}
              {currentStep === 3 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-96 h-96 rounded-full bg-rose-500/5 border border-rose-500/10 filter blur-3xl animate-pulse" />
                </div>
              )}
            </motion.div>

            {/* Guided Tour Dashboard Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-md bg-stone-950 border border-stone-800 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              {/* Top Cyan Accent Beam */}
              <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#39FF14] to-transparent" />

              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5">
                <span className="text-[10px] font-mono tracking-widest text-stone-500 font-bold uppercase">
                  PinPro Master Guide (Paso {currentStep + 1} de {steps.length})
                </span>
                <button
                  onClick={handleClose}
                  className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stepper Content */}
              <div className="px-6 py-6 flex flex-col items-center text-center">
                {/* Simulated Floating Glowing Icon */}
                <motion.div
                  key={currentStep}
                  initial={{ rotate: -10, scale: 0.8, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  style={{ boxShadow: `0 0 25px ${currentStepData.glowColor}` }}
                  className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center border border-current mb-5 bg-stone-900/40",
                    currentStepData.iconColor
                  )}
                >
                  <StepIcon className="w-8 h-8" />
                </motion.div>

                {/* Paso Title */}
                <h3 className="text-lg font-black tracking-tight text-white uppercase mb-3">
                  {currentStepData.title}
                </h3>

                {/* Interactive Description Box */}
                <div className="text-stone-300 text-xs sm:text-sm font-medium leading-relaxed mb-5 whitespace-pre-line text-left bg-stone-900/30 p-4 rounded-2xl border border-stone-800/40">
                  {currentStepData.description}
                </div>

                {/* Tactical Tip Callout */}
                <div className="w-full bg-[#39FF14]/5 border border-[#39FF14]/10 p-3 rounded-xl mb-4">
                  <p className="text-[10px] sm:text-[11px] font-mono text-left tracking-normal font-medium text-emerald-400">
                    {currentStepData.tip}
                  </p>
                </div>
              </div>

              {/* Progress Bar & Footer Controls */}
              <div className="border-t border-stone-900 px-6 py-4 flex items-center justify-between bg-stone-950">
                {/* Dots indicator */}
                <div className="flex gap-1.5">
                  {steps.map((_, idx) => (
                    <span
                      key={idx}
                      className={cn(
                        "h-1.5 transition-all duration-300 rounded-full",
                        idx === currentStep ? "w-4 bg-[#39FF14]" : "w-1.5 bg-stone-800"
                      )}
                    />
                  ))}
                </div>

                {/* Navigation Actions */}
                <div className="flex items-center gap-2">
                  {currentStep > 0 && (
                    <button
                      onClick={() => setCurrentStep(prev => prev - 1)}
                      className="flex items-center justify-center gap-1.5 h-10 w-10 sm:w-auto sm:px-4 rounded-xl border border-stone-800 text-stone-300 bg-stone-900/30 hover:bg-stone-900 hover:text-white transition-all text-xs font-black uppercase tracking-wider active:scale-95"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Atrás</span>
                    </button>
                  )}

                  {currentStep < steps.length - 1 ? (
                    <button
                      onClick={() => setCurrentStep(prev => prev + 1)}
                      className="flex items-center justify-center gap-1.5 h-10 px-4 sm:px-5 rounded-xl bg-gradient-to-r from-[#39FF14] to-emerald-500 text-black shadow-[0_0_15px_rgba(57,255,20,0.3)] hover:brightness-110 hover:shadow-[0_0_20px_rgba(57,255,20,0.4)] transition-all text-xs font-black uppercase tracking-wider active:scale-95"
                    >
                      <span>Siguiente</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleClose}
                      className="flex items-center justify-center gap-1.5 h-10 px-5 rounded-xl bg-custom-cyan text-black shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:brightness-110 hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all text-xs font-black uppercase tracking-wider active:scale-95"
                    >
                      <span>¡Entendido!</span>
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PinProTour;
