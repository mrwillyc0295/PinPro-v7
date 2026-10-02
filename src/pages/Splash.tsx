import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAuthSystem } from '../hooks/useAuthSystem';
import neonMapBg from '../assets/images/neon_city_map_1776719564588.png';
import profIcon from '../assets/images/profesional_icon_3d_1781396900504.jpg';
import clienteIcon from '../assets/images/cliente_icon_3d_1781396912877.jpg';
import agenteIcon from '../assets/images/agente_icon_3d_1781396923363.jpg';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { LoadingScreen } from '../components/LoadingScreen';

export default function Splash() {
  const navigate = useNavigate();
  const { loading: authLoading, isNavigating, setIsNavigating, refreshAdminStatus, handleNavigateWithTelemetry } = useAuth();
  const [showSecretInput, setShowSecretInput] = useState(false);
  const [secretKey, setSecretKey] = useState('');
  const [entryMode] = useState<'selection' | 'loading'>('selection');
  const [activeRole, setActiveRole] = useState<'cliente' | 'profesional' | 'agente' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { registrarUsuario, accesoInvitado } = useAuthSystem();

  const handleQuickEntry = async (rol: 'Cliente' | 'Profesional') => {
    setIsNavigating(true);
    try {
      // 1. Acceso instantáneo
      const userCredential = await signInAnonymously(auth);

      // 2. Upsert silencioso (No bloqueante)
      await setDoc(doc(db, "usuarios", userCredential.user.uid), {
        uid: userCredential.user.uid,
        role: rol,
        status: "Activo",
        createdAt: serverTimestamp()
      }, { merge: true });

      navigate('/home');
    } catch (err: any) {
      console.error("Error de conexión atómica:", err);
      let errorMsg = "Error de conexión. Intente de nuevo.";

      if (err.message?.includes('requests-from-referer') && err.message?.includes('are-blocked')) {
        const currentDomain = window.location.hostname;
        errorMsg = `🚨 Dominio No Autorizado: "${currentDomain}". Por favor, agréguelo a 'Authorized Domains' en su consola de Firebase Authentication para habilitar el acceso.`;
      }

      setError(errorMsg);
    } finally {
      setIsNavigating(false);
    }
  };

  const handleSecretSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedKey = secretKey.replace(/\s+/g, '');
    if (sanitizedKey === 'clickjobsolution') {
      localStorage.setItem('isAdminAuth', 'true');
      refreshAdminStatus();
      handleNavigateWithTelemetry(window.location.pathname, '/dashboard', navigate);
    } else {
      setError('Clave de acceso incorrecta');
      setShowSecretInput(false);
      setSecretKey('');
    }
  };

  // Función de Login Rápido / Bypass Corregida y Optimizada en Paralelo
  const loginInstantaneamente = async (roleType: 'cliente' | 'profesional' | 'agente' | 'guest') => {
    if (isNavigating) return;

    try {
      setIsNavigating(true);
      if (roleType !== 'guest') setActiveRole(roleType as any);
      setError(null);

      const result = await accesoInvitado();
      if (!result.success) {
        if (result.error?.includes("auth/operation-not-allowed")) {
           setError("Acceso anónimo no habilitado en Firebase.");
        } else {
           setError(result.error || "Error al conectar");
        }
        return;
      }

      const user = result.user;

      if (roleType === 'guest') {
         handleNavigateWithTelemetry(window.location.pathname, '/home', navigate);
         return;
      }

      // Si es un rol específico, guardamos el rol temporal y completamos perfil
      localStorage.setItem('pending_role', roleType.toUpperCase());
      handleNavigateWithTelemetry(window.location.pathname, '/complete-profile', navigate);

    } catch (err: any) {
      console.error("Error en loginInstantaneamente:", err);
      let errorMsg = err.message || "Error inesperado";

      if (err.message?.includes('requests-from-referer') && err.message?.includes('are-blocked')) {
        const currentDomain = window.location.hostname;
        errorMsg = `🚨 Dominio Bloqueado: "${currentDomain}". Agréguelo a Authorized Domains en Firebase.`;
      }

      setError(errorMsg);
    } finally {
      setActiveRole(null);
      setIsNavigating(false);
    }
  };

  if (entryMode === 'loading' || authLoading || isNavigating) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-black overflow-x-hidden relative max-w-md mx-auto border-x border-white/10 px-6">
      <img src={neonMapBg} alt="Background" className="absolute inset-0 w-full h-full object-cover saturate-150 contrast-125 brightness-110 opacity-70 pointer-events-none" />
      <div className="absolute inset-0 bg-black/60 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black pointer-events-none"></div>

      <div id="splash_content_container" className="relative z-20 w-full flex flex-col items-center justify-between min-h-[100dvh] py-12">

        {/* Branding */}
        <motion.div id="splash_branding" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mt-8">
          <div className="flex items-center justify-center -space-x-1 mb-2">
            <span className="text-8xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[#00FFFF] to-[#B026FF] drop-shadow-[0_0_20px_rgba(0,255,255,0.4)]">Pin</span>
            <button id="admin_secret_trigger" type="button" onClick={() => setShowSecretInput(true)} className="focus:outline-none cursor-pointer">
              <span className="text-8xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[#B026FF] to-[#FF00FF] drop-shadow-[0_0_20px_rgba(176,38,255,0.4)]">Pro</span>
            </button>
          </div>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.4 }} className="h-[2px] w-16 bg-gradient-to-r from-[#00FFFF] to-[#FF00FF] mx-auto rounded-full" />
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-white/60 text-[10px] font-black uppercase tracking-[0.6em] mt-6">
            Servicios Locales en Tiempo Real
          </motion.p>
        </motion.div>

        {/* Central Text */}
        <div className="flex-1 flex flex-col justify-center items-center w-full px-6 text-center py-6">
          <h2 className="text-xl font-display font-medium text-white/90 mb-2 italic">¿Qué perfil registrarás?</h2>
          <p className="text-white/40 text-[11px] font-medium max-w-[280px] mx-auto leading-relaxed">
            Selecciona el tipo de perfil para comenzar tu registro.
          </p>
        </div>

        {/* Action Cards (Roles Normalizados a Minúsculas para /register) */}
        <div className="w-full flex flex-col items-center pb-8">
          <div className="w-full flex flex-col gap-6 px-6 max-w-sm">
            {error && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] py-4 px-4 rounded-2xl text-center font-black uppercase tracking-widest mb-2">
                {error}
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              <motion.div key="step-role" id="selection_step_2" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col gap-4 w-full">

                {/* Card: Profesional */}
                <button
                  id="btn_role_profesional"
                  type="button"
                  onClick={() => handleQuickEntry('Profesional')}
                  disabled={activeRole !== null || isNavigating}
                  className="bg-transparent border border-white/10 rounded-[28px] p-[24px] group relative w-full h-32 flex items-center justify-between transition-all hover:scale-[1.02] hover:border-white/20 hover:bg-white/5 active:scale-[0.98] cursor-pointer"
                >
                  <div className="flex flex-col text-left">
                    <span className="text-secondary font-semibold text-[10px] uppercase tracking-widest mb-1">Quiero Ofrecer Servicios</span>
                    <span className="text-white font-bold text-xl tracking-tight">Soy Profesional</span>
                  </div>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden">
                     {activeRole === 'profesional' ? <Loader2 className="w-8 h-8 animate-spin text-secondary" /> : <img src={profIcon} className="w-16 h-16 object-cover" alt="Profesional" />}
                  </div>
                </button>

                {/* Card: Cliente */}
                <button
                  id="btn_role_cliente"
                  type="button"
                  onClick={() => handleQuickEntry('Cliente')}
                  disabled={activeRole !== null || isNavigating}
                  className="bg-transparent border border-white/10 rounded-[28px] p-[24px] group relative w-full h-32 flex items-center justify-between transition-all hover:scale-[1.02] hover:border-white/20 hover:bg-white/5 active:scale-[0.98] cursor-pointer"
                >
                  <div className="flex flex-col text-left">
                    <span className="text-primary font-semibold text-[10px] uppercase tracking-widest mb-1">Busco Ayuda Rápida</span>
                    <span className="text-white font-bold text-xl tracking-tight">Soy Cliente</span>
                  </div>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden">
                     {activeRole === 'cliente' ? <Loader2 className="w-8 h-8 animate-spin text-primary" /> : <img src={clienteIcon} className="w-16 h-16 object-cover" alt="Cliente" />}
                  </div>
                </button>

                {/* Card: Agente */}
                <button
                  id="btn_role_agente"
                  type="button"
                  onClick={() => {
                    handleNavigateWithTelemetry(window.location.pathname, '/register', (path: string) =>
                      navigate(path, { state: { initialRole: 'agente' } })
                    );
                  }}
                  disabled={activeRole !== null || isNavigating}
                  className="bg-transparent border border-white/10 rounded-[28px] p-[24px] group relative w-full h-32 flex items-center justify-between transition-all hover:scale-[1.02] hover:border-white/20 hover:bg-white/5 active:scale-[0.98] cursor-pointer"
                >
                  <div className="flex flex-col text-left">
                    <span className="text-accent-green font-semibold text-[10px] uppercase tracking-widest mb-1">Socio Estratégico</span>
                    <span className="text-white font-bold text-xl tracking-tight">Agente PinPro</span>
                  </div>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden">
                     {activeRole === 'agente' ? <Loader2 className="w-8 h-8 animate-spin text-accent-green" /> : <img src={agenteIcon} className="w-16 h-16 object-cover" alt="Agente" />}
                  </div>
                </button>

                {/* Card: Explorar Mapa (Zero Friction) */}
                <button
                  id="btn_role_guest"
                  type="button"
                  onClick={() => loginInstantaneamente('guest')}
                  disabled={activeRole !== null || isNavigating}
                  className="mt-4 bg-[#00FFFF] text-black rounded-3xl p-6 w-full flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_rgba(0,255,255,0.3)]"
                >
                  <Globe className="w-6 h-6 animate-pulse" />
                  <span className="font-black text-lg uppercase tracking-tighter italic">ENTRAR AL MAPA (SIN REGISTRO)</span>
                </button>

              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center w-full px-6">
          <p className="text-white/20 text-[8px] font-bold uppercase tracking-[0.8em]">PinPro Digital Evolution • 2026</p>
        </div>
      </div>

      {/* Panel de Control Secreto */}
      <AnimatePresence>
        {showSecretInput && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed inset-x-0 bottom-0 p-8 z-50 bg-black/90 backdrop-blur-3xl border-t border-white/5 max-w-md mx-auto">
            <form onSubmit={handleSecretSubmit} className="flex flex-col gap-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-black text-[10px] uppercase tracking-widest italic">Panel de Control</span>
                <button type="button" onClick={() => setShowSecretInput(false)} className="text-white/40 hover:text-white flex items-center justify-center p-1">
                  <Lock className="w-4 h-4" />
                </button>
              </div>
              <input
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="Introducir código..."
                className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-4 px-6 focus:outline-none focus:border-[#00FFFF] transition-all text-xl font-mono tracking-widest text-center"
                autoFocus
              />
              <button type="submit" className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#00FFFF] to-[#B026FF] text-white font-black uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,255,0.3)]">
                AUTENTICAR
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
