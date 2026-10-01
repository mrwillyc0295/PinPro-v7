import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AuthGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, requireAuth = true }) => {
  const { user, profile, loading, isAdmin, isNavigating, authState, isInitialized } = useAuth();
  const location = useLocation();

  // 1. EL FRENO ABSOLUTO: Bloqueo mientras el sistema se estabiliza
  if (loading || isNavigating || authState === 'LOADING' || !isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent border-[#00FFFF] animate-spin"></div>
      </div>
    );
  }

  // 2. PROTECCIÓN DE RUTAS PRIVADAS
  if (requireAuth && (authState === 'UNAUTHENTICATED' || !user) && !isAdmin) {
    return <Navigate to="/inicio-registro" state={{ from: location }} replace />;
  }

  const isRealProfile = profile && !(profile as any).isNewUser;

  // 3. PROTECCIÓN DE RUTAS PÚBLICAS (Login/Registro)
  if (!requireAuth && authState === 'AUTHENTICATED') {
    return <Navigate to="/orquestador" replace />;
  }

  // 4. VERIFICACIÓN DE PERFIL PARA RUTAS PRIVADAS
  const onboardingRoutes = ['/complete-profile', '/onboarding', '/seleccionar-rol'];
  const isOnboarding = onboardingRoutes.includes(location.pathname);

  if (requireAuth && !isRealProfile && !isAdmin && !isOnboarding) {
    return <Navigate to="/inicio-registro" replace />;
  }

  return <>{children}</>;
};
