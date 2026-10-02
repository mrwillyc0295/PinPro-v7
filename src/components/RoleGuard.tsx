import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles }) => {
  const { user, profile, loading, isAdmin, isNavigating } = useAuth();
  const location = useLocation();

  // 1. Estado de espera mientras Firebase resuelve el token y Firestore el perfil
  if (loading || isNavigating) {
    return (
      <div className="min-h-[100dvh] bg-[#050508] text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
        </div>
        <span className="text-[10px] font-mono tracking-widest text-stone-400 uppercase font-bold animate-pulse">
          Autenticando Permisos de Nodo...
        </span>
      </div>
    );
  }

  // 2. Bloqueo por falta de Sesión Activa
  if (!user) {
    console.warn("🛑 [SECURITY] Intento de acceso sin token. Redirigiendo a registro.");
    return <Navigate to="/inicio-registro" state={{ from: location }} replace />;
  }

  // 3. Normalización de privilegios y validación estricta
  const userRole = (profile?.role || 'CLIENTE').toUpperCase();
  const hasAccess = allowedRoles.map(r => r.toUpperCase()).includes(userRole) || isAdmin;

  // 4. Bloqueo por Incompatibilidad de Rol (Intrusión evitada)
  if (!hasAccess) {
    console.error(`🚨 [SECURITY VIOLATION] UID ${user.uid} intentó forzar ruta ${location.pathname}. Rol denegado: ${userRole}`);

    // Lo rebotamos a su Home legítimo según la jerarquía de PinPro
    if (userRole === 'PROFESIONAL') return <Navigate to="/pro/dashboard" replace />;
    if (userRole === 'REFERIDOR' || userRole === 'AGENTE') return <Navigate to="/dashboard-referidor" replace />;
    return <Navigate to="/home" replace />;
  }

  // 5. Permiso concedido: Renderiza la interfaz protegida
  return <>{children}</>;
};

export default RoleGuard;
