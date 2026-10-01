import { ArrowLeft, Star, ShieldCheck, Zap, CheckCircle2, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { cn } from '../lib/utils';

export default function Premium() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (plan: 'Premium' | 'Elite') => {
    if (!user) return;
    setLoading(plan);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      const userRef = doc(db, 'profesionales', user.uid);
      await updateDoc(userRef, {
        isPremium: plan === 'Premium' || plan === 'Elite',
        isElite: plan === 'Elite',
      });

      alert(`¡Suscripción a plan ${plan} exitosa!`);
      window.location.reload();
    } catch (error) {
      console.error("Error subscribing:", error);
      alert("Hubo un error al procesar la suscripción.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="relative flex min-h-full w-full flex-col bg-surface-lowest overflow-x-hidden pb-20">
      {/* Header */}
      <div className="flex items-center bg-surface-lowest/80 backdrop-blur-md p-4 pb-2 justify-between sticky top-0 z-10">
        <div className="w-10"></div>
        <h2 className="text-on-surface text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Planes Premium</h2>
        <div className="w-10"></div>
      </div>

      {/* Hero Section */}
      <div className="px-6 py-8 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full flex items-center justify-center mb-6 border border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
          <Crown className="w-10 h-10 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]" />
        </div>
        <h1 className="text-3xl font-black text-on-surface mb-3 tracking-tight">Destaca tu Perfil</h1>
        <p className="text-sm text-on-surface-variant max-w-[280px] leading-relaxed">
          Aumenta tu visibilidad, consigue más clientes y obtén la insignia de verificación.
        </p>
      </div>

      <div className="px-4 space-y-6">
        {/* Basic Plan (Current) */}
        <div className="bg-surface-container/40 rounded-3xl p-6 border border-outline-variant/30">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-on-surface">Básico</h3>
              <p className="text-sm text-on-surface-variant">Gratis para siempre</p>
            </div>
            {!profile?.isPremium && !profile?.isElite && (
              <span className="bg-surface-highest text-on-surface-variant text-xs font-bold px-3 py-1 rounded-full">Actual</span>
            )}
          </div>
          <ul className="space-y-3 mb-6">
            <li className="flex items-center gap-2 text-sm text-on-surface-variant">
              <CheckCircle2 className="w-4 h-4 text-on-surface-variant/50" /> Perfil público
            </li>
            <li className="flex items-center gap-2 text-sm text-on-surface-variant">
              <CheckCircle2 className="w-4 h-4 text-on-surface-variant/50" /> Aparecer en el mapa
            </li>
            <li className="flex items-center gap-2 text-sm text-on-surface-variant">
              <CheckCircle2 className="w-4 h-4 text-on-surface-variant/50" /> Recibir mensajes
            </li>
          </ul>
        </div>

        {/* Premium Plan */}
        <div className={cn(
          "bg-gradient-to-br from-primary-container/10 to-surface-container rounded-3xl p-6 border relative overflow-hidden",
          profile?.isPremium && !profile?.isElite ? "border-primary-container shadow-[0_0_20px_rgba(0,255,255,0.2)]" : "border-primary-container/30"
        )}>
          {profile?.isPremium && !profile?.isElite && (
            <div className="absolute top-0 right-0 bg-primary-container text-surface-lowest text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
              Tu Plan
            </div>
          )}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-primary-container flex items-center gap-2">
                <Star className="w-5 h-5 fill-primary-container" /> Premium
              </h3>
              <p className="text-sm text-on-surface-variant">$9.99 / mes</p>
            </div>
          </div>
          <ul className="space-y-3 mb-6">
            <li className="flex items-center gap-2 text-sm text-on-surface">
              <CheckCircle2 className="w-4 h-4 text-primary-container" /> Insignia de Verificación
            </li>
            <li className="flex items-center gap-2 text-sm text-on-surface">
              <CheckCircle2 className="w-4 h-4 text-primary-container" /> Mayor visibilidad en búsquedas
            </li>
            <li className="flex items-center gap-2 text-sm text-on-surface">
              <CheckCircle2 className="w-4 h-4 text-primary-container" /> Hasta 10 fotos en portafolio
            </li>
          </ul>
          <button
            onClick={() => handleSubscribe('Premium')}
            disabled={loading !== null || (profile?.isPremium && !profile?.isElite)}
            className="w-full py-3 bg-primary-container text-surface-lowest font-bold rounded-xl disabled:opacity-50"
          >
            {loading === 'Premium' ? 'Procesando...' : (profile?.isPremium && !profile?.isElite) ? 'Plan Actual' : 'Suscribirse a Premium'}
          </button>
        </div>

        {/* Elite Plan */}
        <div className={cn(
          "bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-3xl p-6 border relative overflow-hidden",
          profile?.isElite ? "border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]" : "border-yellow-500/30"
        )}>
          {profile?.isElite && (
            <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
              Tu Plan
            </div>
          )}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-yellow-500 flex items-center gap-2">
                <Crown className="w-5 h-5 fill-yellow-500" /> Elite
              </h3>
              <p className="text-sm text-on-surface-variant">$19.99 / mes</p>
            </div>
          </div>
          <ul className="space-y-3 mb-6">
            <li className="flex items-center gap-2 text-sm text-on-surface">
              <CheckCircle2 className="w-4 h-4 text-yellow-500" /> Todo lo de Premium
            </li>
            <li className="flex items-center gap-2 text-sm text-on-surface">
              <CheckCircle2 className="w-4 h-4 text-yellow-500" /> Primeros lugares en el mapa
            </li>
            <li className="flex items-center gap-2 text-sm text-on-surface">
              <CheckCircle2 className="w-4 h-4 text-yellow-500" /> Portafolio ilimitado
            </li>
            <li className="flex items-center gap-2 text-sm text-on-surface">
              <CheckCircle2 className="w-4 h-4 text-yellow-500" /> Soporte prioritario
            </li>
          </ul>
          <button
            onClick={() => handleSubscribe('Elite')}
            disabled={loading !== null || profile?.isElite}
            className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold rounded-xl disabled:opacity-50"
          >
            {loading === 'Elite' ? 'Procesando...' : profile?.isElite ? 'Plan Actual' : 'Suscribirse a Elite'}
          </button>
        </div>
      </div>
    </div>
  );
}
