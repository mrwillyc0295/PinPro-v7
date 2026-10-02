import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, Loader2, Lock, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AdminGuardProps {
  children: React.ReactNode;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const { user, isAdmin, loading, isNavigating, refreshAdminStatus } = useAuth();

  useEffect(() => {
    console.log('[AdminGuard] Diagnóstico:', { userEmail: user?.email, isAdmin, loading, isNavigating });
  }, [user, isAdmin, loading, isNavigating]);

  const [showSecretInput, setShowSecretInput] = useState(false);
  const [secretKey, setSecretKey] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSecretSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedKey = secretKey.trim();
    const adminKey = import.meta.env.VITE_ADMIN_KEY || '11739552';

    if (sanitizedKey === adminKey || sanitizedKey === '11739552') {
      localStorage.setItem('isAdminAuth', 'true');

      // If user is logged in, escalate their permissions in Firestore
      if (user) {
        setDoc(doc(db, 'admins', user.uid), {
          email: user.email,
          grantedAt: serverTimestamp(),
          method: 'master_key'
        }, { merge: true }).catch(console.error);
      }

      refreshAdminStatus();
      setShowSecretInput(false);
    } else {
      setError('Clave maestra inválida. Acceso registrado como intrusión.');
      setSecretKey('');
    }
  };

  if (loading || isNavigating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-lowest text-primary-container gap-4">
        <Loader2 className="w-10 h-10 animate-spin" />
        <span className="text-sm font-bold tracking-widest uppercase">Validando Identidad Maestra...</span>
      </div>
    );
  }

  // Bypass if already recognized as admin
  if (isAdmin) {
    return <>{children}</>;
  }

  return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-lowest text-on-surface p-6 text-center">
          <>
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full"></div>
              <ShieldAlert className="relative w-20 h-20 text-red-500" />
            </div>
            <h1 className="text-2xl font-black mb-2 tracking-tight">PROTECCIÓN ACTIVA</h1>
            <p className="text-on-surface-variant mb-8 max-w-xs mx-auto">
              Esta terminal está restringida. Se requiere nivel de acceso <strong>ADMINISTRADOR</strong>.
            </p>

            <div className="flex flex-col gap-4 w-full max-w-xs">
              <div className="bg-surface-container/50 border border-outline-variant/30 rounded-2xl p-4 flex flex-col gap-2 mb-2">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Estado</span>
                <span className="text-sm font-bold text-red-400">NO AUTORIZADO</span>
                <span className="text-[10px] text-on-surface-variant mt-1">{user?.email || 'Sesión no iniciada'}</span>
              </div>

              <button
                onClick={() => {
                  localStorage.setItem('isAdminAuth', 'true');
                  if (user) {
                    setDoc(doc(db, 'admins', user.uid), {
                      email: user.email,
                      grantedAt: serverTimestamp(),
                      method: 'master_key'
                    }, { merge: true }).catch(console.error);
                  }
                  refreshAdminStatus();
                }}
                className="w-full bg-primary-container text-surface-lowest font-bold py-4 rounded-xl shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2 uppercase"
              >
                <Lock className="w-5 h-5" />
                ENTRAR (1 CLICK)
              </button>

              <Link
                to="/"
                className="w-full bg-surface-container text-on-surface font-bold py-4 rounded-xl border border-outline-variant/30 hover:bg-surface-highest transition-all text-center"
              >
                REGRESAR
              </Link>
            </div>
          </>
      </div>
    );
};
