import { ArrowLeft, User, Bell, Shield, CreditCard, HelpCircle, LogOut, ChevronRight, Settings as SettingsIcon, Clock, Gift, Globe, Check, Trash2, AlertTriangle, TrendingUp, Brain, Star, Share2, QrCode, Copy, Smartphone, FileText, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, deleteDoc, query, collection, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

import { AnimatedBackButton } from '../components/AnimatedBackButton';

export default function Settings() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('es');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [copied, setCopied] = useState(false);

  const sharedUrl = "https://ais-pre-yopkbfx3btktilx5tw7mwy-132138863621.us-east1.run.app";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(sharedUrl)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(sharedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('read', '==', false)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadNotifCount(snapshot.size);
    });
    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleDeleteProfile = async () => {
    if (!user || !profile) return;
    try {
      setIsDeleting(true);
      const collectionName = profile.role === 'Cliente' ? 'clientes' : 'profesionales';
      await deleteDoc(doc(db, collectionName, user.uid));
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Error deleting profile:", error);
      handleFirestoreError(error, OperationType.DELETE, `${profile.role === 'Cliente' ? 'clientes' : 'profesionales'}/${user.uid}`);
      alert("Error al eliminar el perfil");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleClearCache = useCallback(() => {
    localStorage.clear();
    sessionStorage.clear();
    // Keep auth if needed, but usually clear is clear
    window.location.reload();
  }, []);

  const handleAdminAccess = (targetLink?: string, onClickAction?: () => void) => {
    const code = window.prompt("🛡️ PROTOCOLO DE SEGURIDAD PINPRO\n\nIngresa la clave maestra para acceder:");
    if (code === '11739552') {
      if (targetLink) navigate(targetLink);
      if (onClickAction) onClickAction();
    } else if (code !== null) {
      alert("❌ Acceso Denegado: Credenciales no válidas.");
    }
  };

  const settingsGroups = [
    {
      title: 'Cuenta',
      items: [
        { id: 'profile', icon: User, label: 'Editar Perfil', link: '/edit-profile' },
        { id: 'activity', icon: Clock, label: 'Mis Trabajos', link: '/activity' },
        ...(profile?.role === 'Admin' || ['mr.willyc0295@gmail.com', 'publicpost0295@gmail.com'].includes(user?.email?.toLowerCase() || '') ? [
          {
            id: 'admin',
            icon: Shield,
            label: 'Panel de Control Admin',
            onClick: () => handleAdminAccess('/admin')
          },
        ] : []),
        ...(profile?.role === 'Profesional' ? [
          { id: 'premium', icon: Star, label: 'Planes Premium', link: '/premium' },
          { id: 'wallet', icon: TrendingUp, label: 'Mi Billetera (Ganancias)', link: '/wallet' },
        ] : []),
        { id: 'payment', icon: CreditCard, label: 'Métodos de Pago', link: '/payment-methods' },
        { id: 'referrals', icon: Gift, label: 'Programa de Referidos', link: '/referrals' },
        { id: 'notifications', icon: Bell, label: 'Notificaciones', link: '/notifications' },
      ]
    },
    {
      title: 'Seguridad y Privacidad',
      items: [
        { id: 'security', icon: Shield, label: 'Seguridad de la Cuenta', link: '/security' },
        { id: 'privacy', icon: Shield, label: 'Privacidad y Legal', link: '/privacy' },
        { id: 'delete', icon: AlertTriangle, label: 'Eliminar mi Perfil', onClick: () => setShowDeleteConfirm(true), danger: true },
      ]
    },
    {
      title: 'Soporte',
      items: [
        { id: 'help', icon: HelpCircle, label: 'Centro de Ayuda', link: '#' },
        { id: 'terms', icon: FileText, label: 'Términos y Condiciones', link: '/terms' },
        { id: 'masterminds', icon: Brain, label: 'The Masterminds (Concepto)', link: '/masterminds' },
        { id: 'about', icon: HelpCircle, label: 'Acerca de', link: '/about' },
      ]
    },
    {
      title: 'Instalación y Compartir',
      items: [
        { id: 'share', icon: Share2, label: 'Compartir con Amigos', onClick: () => {
          if (navigator.share) {
            navigator.share({
              title: 'PinPro',
              text: '¡Mira esta app de servicios profesionales!',
              url: sharedUrl
            }).catch((err) => {
              if (err.name !== 'AbortError') {
                console.error('Error sharing:', err);
              }
            });
          } else {
            handleCopyLink();
          }
        }},
      ]
    }
  ];

  return (
    <div className="flex-1 w-full h-full bg-surface-lowest overflow-y-auto hide-scrollbar flex flex-col relative">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-surface-lowest/90 backdrop-blur-xl border-b border-primary-container/20 shadow-[0_4px_20px_-10px_rgba(0,255,255,0.3)] px-5 py-4 pt-12 flex items-center justify-between">
        <div className="w-14 h-14 shrink-0" /> {/* Spacer for GlobalBackButton */}
        <div className="flex items-center justify-center gap-1">
          <Link to="/notifications" className="p-2 flex items-center justify-center rounded-full hover:bg-primary-container/10 transition-colors text-on-surface relative">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadNotifCount > 0 && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#00FF00] rounded-full shadow-[0_0_8px_#00FF00]"></span>
            )}
          </Link>
          <h1 className="text-lg font-bold text-on-surface tracking-wide drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">Configuración</h1>
          <div className="p-2 flex items-center justify-center">
            <SettingsIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-container drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
          </div>
        </div>
        <div className="w-10 h-10" /> {/* Spacer to balance for centering */}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col gap-6">
        {settingsGroups.map((group, index) => (
          <div key={index} className="flex flex-col gap-3">
            <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-2">{group.title}</h2>
            <div className="flex flex-col bg-surface-container/80 backdrop-blur-md rounded-2xl border border-outline-variant overflow-hidden shadow-[0_5px_20px_-5px_rgba(0,0,0,0.5)]">
              {group.items.map((item, itemIndex) => {
                const content = (
                  <>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-full bg-surface flex items-center justify-center border border-outline-variant transition-all",
                        item.danger ? "group-hover:border-error group-hover:shadow-[0_0_15px_rgba(239,67,67,0.3)]" : "group-hover:border-primary-container group-hover:shadow-[0_0_15px_rgba(0,255,255,0.3)]"
                      )}>
                        <item.icon className={cn(
                          "w-5 h-5 transition-all",
                          item.danger ? "text-error group-hover:drop-shadow-[0_0_5px_rgba(239,67,67,0.5)]" : "text-on-surface-variant group-hover:text-primary-container group-hover:drop-shadow-[0_0_5px_rgba(0,255,255,0.5)]"
                        )} />
                      </div>
                      <span className={cn(
                        "text-sm font-bold transition-colors",
                        item.danger ? "text-error" : "text-on-surface group-hover:text-primary-container"
                      )}>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {'value' in item && item.value && <span className="text-xs font-medium text-on-surface-variant">{item.value as string}</span>}
                      <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:text-primary-container transition-colors" />
                    </div>
                  </>
                );

                const className = cn(
                  "flex items-center justify-between p-4 hover:bg-primary-container/10 transition-colors group w-full text-left",
                  itemIndex !== group.items.length - 1 && "border-b border-outline-variant/50"
                );

                if (item.onClick) {
                  return (
                    <button key={item.id} onClick={item.onClick} className={className}>
                      {content}
                    </button>
                  );
                }

                return (
                  <Link key={item.id} to={item.link!} className={className}>
                    {content}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <div className="mt-4 mb-8">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-red-600/10 border-2 border-red-500 text-red-500 font-black hover:bg-red-600 hover:text-white transition-all shadow-[0_0_20px_rgba(255,0,0,0.3)] hover:shadow-[0_0_30px_rgba(255,0,0,0.7)] uppercase tracking-widest active:scale-95 group"
          >
            <LogOut className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-surface-container border border-error/30 rounded-3xl p-6 w-full max-w-sm shadow-[0_0_30px_rgba(239,67,67,0.2)] animate-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center border border-error/30">
                <AlertTriangle className="w-8 h-8 text-error" />
              </div>
              <div>
                <h3 className="text-xl font-black text-on-surface">¿Eliminar perfil?</h3>
                <p className="text-sm text-on-surface-variant mt-2">
                  Esta acción es permanente. Se eliminarán todos tus datos, fotos y servicios del sistema.
                </p>
              </div>
              <div className="flex flex-col w-full gap-3 mt-4">
                <button
                  onClick={handleDeleteProfile}
                  disabled={isDeleting}
                  className="w-full bg-error text-white font-bold py-4 rounded-xl hover:bg-red-600 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isDeleting ? 'Eliminando...' : 'SÍ, ELIMINAR TODO'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="w-full bg-surface-highest text-on-surface font-bold py-4 rounded-xl border border-outline-variant/30 hover:bg-surface-highest/80 transition-all active:scale-[0.98]"
                >
                  CANCELAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
