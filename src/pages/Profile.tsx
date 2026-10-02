import { Helmet } from 'react-helmet-async';
import { ArrowLeft, MoreHorizontal, MapPin, Star, User, DollarSign, Image as ImageIcon, MessageSquare, Calendar, Wrench, Instagram, Facebook, Sparkles, Plus, X, Save, Trash2, Briefcase, Award, TrendingUp, ShieldCheck, Edit2, Bell, Camera, ExternalLink, AlertTriangle, Share2, UserRound } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import DOMPurify from 'dompurify';
import { useAuth, ServiceItem } from '../contexts/AuthContext';
import { doc, updateDoc, query, collection, where, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { ReportModal } from '../components/ReportModal';

import { LoadingScreen } from '../components/LoadingScreen';
import { AnimatedBackButton } from '../components/AnimatedBackButton';

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, loading, switchRole } = useAuth();
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);

  const [localRole, setLocalRole] = useState<'Cliente' | 'Profesional' | 'Referidor' | 'Agente' | null>(null);

  useEffect(() => {
    if (profile) {
      setLocalRole(profile.role === 'Admin' ? 'Profesional' : (profile.role as any));
    }
  }, [profile]);

  const isClientPath = location.pathname === '/profile/cliente';
  const isProPath = location.pathname === '/profile/profesional';
  const isClient = isClientPath || (!isProPath && localRole === 'Cliente');

  if (loading) {
    return <LoadingScreen />;
  }

  if (!profile) {
    return <div className="flex items-center justify-center h-full">No se pudo cargar el perfil.</div>;
  }

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

  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [serviceForm, setServiceForm] = useState<Partial<ServiceItem>>({ title: '', desc: '', price: '', unit: '' });
  const [isSaving, setIsSaving] = useState(false);

  const profileData = useMemo(() => ({
    name: profile?.name || 'Usuario',
    location: profile?.municipality
      ? `${profile.municipality}, ${profile.state}, ${profile.country}`
      : (profile?.country || 'Ubicación no especificada'),
    bio: profile?.bio || 'Sin biografía.',
    zodiacSign: profile?.zodiacSign || '',
    yearsOfExperience: profile?.yearsOfExperience || 0,
    profileImage: profile?.photoUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAVqV7kR3nY9ZElnG0EBeEF8qLS4vIawXTRCOzs9ycbzOY4CjRoA0m-E2UF1hY7Eg7c0tXOnC0cy7y1nJsGFYuWZYNDvs4PEbsGJn4kaFty-vD0SiCCDGLwp4c_a4EGCQIHxEpmoJqha5OdKbIXPyEZCh87TlrFqPdGFFu2x3pWGTQ0MHq4Xs2B9dzI0ZmnGmYFgRfhz1lrbDzE5AKNuX5vLOX5ar0C-Bd7efu_ZghTx0E0jQG-1n2k2OskIF18ctr2PwYjqBRJYxa',
    instagram: profile?.instagram || '',
    facebook: profile?.facebook || '',
    tags: (profile as any)?.tags || [],
    videoUrl: (profile as any)?.videoUrl || '',
    portfolio: profile?.portfolio || [],
    services: profile?.services || []
  }), [profile]);

  const handleOpenServiceModal = useCallback((service?: ServiceItem) => {
    if (service) {
      setEditingService(service);
      setServiceForm(service);
    } else {
      setEditingService(null);
      setServiceForm({ title: '', desc: '', price: '', unit: '' });
    }
    setIsServiceModalOpen(true);
  }, []);

  const handleSaveService = useCallback(async () => {
    if (!user || !profile) return;
    if (!serviceForm.title || !serviceForm.price) return;

    setIsSaving(true);
    try {
      let updatedServices = [...(profile.services || [])];

      if (editingService) {
        updatedServices = updatedServices.map(s => s.id === editingService.id ? { ...s, ...serviceForm } as ServiceItem : s);
      } else {
        const newService: ServiceItem = {
          id: Date.now().toString(),
          title: serviceForm.title || '',
          desc: serviceForm.desc || '',
          price: serviceForm.price || '',
          unit: serviceForm.unit || ''
        };
        updatedServices.push(newService);
      }

      const collectionName = profile.role === 'Cliente' ? 'clientes' : 'profesionales';
      await setDoc(doc(db, collectionName, user.uid), {
        services: updatedServices
      }, { merge: true });

      setIsServiceModalOpen(false);
    } catch (error: any) {
      console.error("Error saving service:", error);
      handleFirestoreError(error, OperationType.UPDATE, `${profile?.role === 'Cliente' ? 'clientes' : 'profesionales'}/${user.uid}`);
      alert("Error al guardar el servicio");
    } finally {
      setIsSaving(false);
    }
  }, [user, profile, serviceForm, editingService]);

  const handleDeleteService = async () => {
    if (!user || !profile || !editingService) return;

    if (!window.confirm("¿Estás seguro de que deseas eliminar este servicio?")) return;

    setIsSaving(true);
    try {
      const updatedServices = (profile.services || []).filter(s => s.id !== editingService.id);

      const collectionName = profile.role === 'Cliente' ? 'clientes' : 'profesionales';
      await setDoc(doc(db, collectionName, user.uid), {
        services: updatedServices
      }, { merge: true });

      setIsServiceModalOpen(false);
    } catch (error: any) {
      console.error("Error deleting service:", error);
      handleFirestoreError(error, OperationType.UPDATE, `${profile?.role === 'Cliente' ? 'clientes' : 'profesionales'}/${user.uid}`);
      alert("Error al eliminar el servicio");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSwitchRole = async (newRole: 'Cliente' | 'Profesional') => {
    console.log(`[Profile] Switch attempt: ${profile?.role} -> ${newRole}`);
    if (!user || !profile || profile.role === (newRole as string)) return;

    setLocalRole(newRole); // Instant UI feedback
    try {
      await switchRole(newRole);
      console.log(`[Profile] Switch successful, navigating to /profile/${newRole.toLowerCase()}`);
      if (newRole === 'Cliente') {
        navigate('/profile/cliente');
      } else {
        navigate('/profile/profesional');
      }
    } catch (error) {
      console.error("[Profile] Error switching role:", error);
      setLocalRole(profile.role === 'Admin' ? 'Profesional' : (profile.role as any)); // Revert on error
    }
  };

  const executeShare = async () => {
    const profileUrl = `${window.location.origin}/p/${user?.uid}`;
    const shareTitle = `Tarjeta Digital de ${profile?.name || 'Profesional'} - PinPro`;
    const shareText = `Mira mi perfil profesional como ${profile?.profession || 'profesional'} en PinPro.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: profileUrl,
        });
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(profileUrl);
        alert('¡Enlace a tu perfil copiado al portapapeles!');
      } catch (error) {
        console.error('Failed to copy text:', error);
      }
    }
  };

  // Memoized view stats
  const { totalViews, uniqueVisitors, recentVisitors } = useMemo(() => {
    const stats = profile?.viewStats || [];
    return {
      totalViews: stats.length,
      uniqueVisitors: new Set(stats.map((v: any) => v.userId).filter(Boolean)).size,
      recentVisitors: stats.slice(-5).reverse()
    };
  }, [profile?.viewStats]);

  return (
    <div className="h-screen w-full overflow-y-auto bg-[#0b0e11] pb-[100px] box-border relative flex flex-col overflow-x-hidden">
      <Helmet>
        <title>Mi Perfil | PinPro</title>
        <meta name="description" content="Gestiona tu perfil profesional y servicios en PinPro." />
        <meta property="og:title" content={`${profileData.name} - Mi Perfil en PinPro`} />
        <meta property="og:description" content={profileData.bio || 'Conecta con los mejores profesionales locales en tiempo real.'} />
        <meta property="og:image" content={profile?.photoUrl || profileData.profileImage || user?.photoURL || 'https://i.ibb.co/hWk4b4S/IMG-20260416-WA0005.jpg'} />
      </Helmet>
      {/* Header */}
      <div className="sticky top-0 z-50 flex items-center bg-surface-lowest/90 backdrop-blur-xl px-4 py-4 border-b border-primary-container/20 shadow-[0_0_30px_rgba(0,255,255,0.1)] justify-end gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSwitchRole(isClient ? 'Profesional' : 'Cliente')}
            className={cn(
              "px-5 py-2 rounded-xl text-[12px] font-black uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95 flex items-center gap-2.5 border-2",
              isClient
                ? "bg-[#B026FF] text-white border-white/20 shadow-[0_0_20px_rgba(176,38,255,0.4)]"
                : "bg-[#00FFFF] text-black border-black/10 shadow-[0_0_20px_rgba(0,255,255,0.4)]"
            )}
          >
            {isClient ? (
              <><Sparkles className="w-4 h-4" /> Ser Pro</>
            ) : (
              <><UserRound className="w-5 h-5" /> Modo Cliente</>
            )}
          </button>
          <button
            onClick={() => navigate(`/p/${user?.uid}`)}
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-surface-highest border border-primary-container/20 text-on-surface hover:border-primary-container shadow-[0_0_15px_rgba(0,255,255,0.1)] transition-all"
            title="Ver mi perfil público"
          >
            <ExternalLink className="w-6 h-6" />
          </button>
          <Link to="/notifications" className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-primary-container/10 transition-colors text-on-surface relative">
            <Bell className="w-6 h-6" />
            {unreadNotifCount > 0 && (
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-[#00FF00] rounded-full shadow-[0_0_10px_#00FF00]"></span>
            )}
          </Link>
          <Link to="/settings" className="flex items-center justify-center rounded-full w-12 h-12 hover:bg-primary-container/10 transition-colors text-on-surface">
            <MoreHorizontal className="w-8 h-8" />
          </Link>
        </div>
        <h1 className="text-lg font-black text-white italic tracking-tighter uppercase ml-2">Mi Perfil</h1>
      </div>

      {/* Banner Superior */}
      <div className="relative w-full h-[220px] shrink-0 bg-[#0b0e11] overflow-hidden group">
        <div className="absolute inset-0">
          <img
            src="/mapa-neo.png"
            className="w-full h-full object-cover opacity-80"
            alt="background profile"
          />
          {/* Neon Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0b0e11]/20 via-[#0b0e11]/50 to-[#0b0e11]"></div>
        </div>
      </div>

      {/* Avatar Superpuesto */}
      <div className="flex flex-col items-center -mt-[80px] relative z-20">
        {/* Social Icons Above Avatar */}
        <div className="flex gap-3 mb-2">
          {profileData.instagram ? (
            <motion.a
              href={profileData.instagram}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-8 h-8 rounded-lg bg-black/40 backdrop-blur-md border border-[#00ff88]/40 flex items-center justify-center text-[#00ff88] shadow-lg transition-all"
            >
              <Instagram className="w-4 h-4" />
            </motion.a>
          ) : (
            <motion.div
              onClick={() => navigate('/edit-profile')}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-8 h-8 rounded-lg bg-black/40 backdrop-blur-md border border-white/5 flex items-center justify-center text-white/20 shadow-lg cursor-pointer transition-all hover:text-[#00ff88]/40"
            >
              <Instagram className="w-4 h-4" />
            </motion.div>
          )}

          {profileData.facebook ? (
            <motion.a
              href={profileData.facebook}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-8 h-8 rounded-lg bg-black/40 backdrop-blur-md border border-[#00ff88]/40 flex items-center justify-center text-[#00ff88] shadow-lg transition-all"
            >
              <Facebook className="w-4 h-4" />
            </motion.a>
          ) : (
            <motion.div
              onClick={() => navigate('/edit-profile')}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-8 h-8 rounded-lg bg-black/40 backdrop-blur-md border border-white/5 flex items-center justify-center text-white/20 shadow-lg cursor-pointer transition-all hover:text-[#00ff88]/40"
            >
              <Facebook className="w-4 h-4" />
            </motion.div>
          )}
        </div>

        <div className={cn(
          "relative w-[110px] h-[110px] rounded-full bg-[#1a1d23] overflow-hidden flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.5)] border-[3px]",
          ((profile as any)?.isElite || (profileData.instagram && profileData.facebook)) ? "border-[#00ff88]" : "border-[#00FFFF]"
        )}>
          <img
            src={profile?.photoUrl || profileData.profileImage || user?.photoURL || 'https://i.ibb.co/hWk4b4S/IMG-20260416-WA0005.jpg'}
            alt={profileData.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
          <div className={cn(
            "absolute bottom-2 right-2 bg-[#0b0e11] p-1 rounded-full shadow-2xl z-30 ring-2 ring-[#00FFFF]/30 backdrop-blur-md",
          )}>
            <div className={cn(
              "w-3 h-3 rounded-full border-2 border-[#1a1d23] shadow-[0_0_10px_currentColor]",
              profile?.isOnline ? "bg-[#00FF88] text-[#00FF88]" : "bg-[#FF3366] text-[#FF3366]"
            )}></div>
          </div>
        </div>
      </div>

      {/* Profile Info - Centered & Spaced */}
      <div className="flex flex-col items-center mt-[15px] px-6 z-20 text-center">
        <div className="flex items-center gap-3">
          <h1 className="text-[1.8rem] font-black text-white uppercase tracking-tighter italic drop-shadow-[0_0_15px_rgba(0,255,255,0.4)] leading-tight">
            {profileData.name}
          </h1>
        </div>

        <div className="flex flex-col items-center gap-2 mt-2">
          <p className="text-[0.9rem] font-black text-[#00ff88] uppercase tracking-[2px] opacity-90 leading-none">
            {isClient ? 'CLIENTE EXCLUSIVO' : (profile?.profession || 'MECÁNICO DE MOTOS')}
            <Link to="/edit-profile" className="inline-block ml-2 text-[#00ff88]/60 hover:text-[#00ff88]">
              <Edit2 className="w-3.5 h-3.5 translate-y-[1px]" />
            </Link>
          </p>
          <div className="flex items-center gap-1.5 text-[#94a3b8] text-[0.8rem] font-medium uppercase tracking-wide">
            <span className="text-[#00ff88] opacity-80">📍</span>
            {profileData.location}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-5 mt-6">
        <div className="grid grid-cols-3 gap-px bg-primary-container/10 p-px rounded-xl overflow-hidden border border-white/5">
          {isClient ? (
            <>
              <div className="flex flex-col items-center justify-center bg-[#12161c] py-4">
                <div className="font-black text-xl text-on-surface">0</div>
                <span className="text-[8px] text-on-surface-variant font-bold uppercase tracking-tighter text-center mt-1">Contratos</span>
              </div>
              <div className="flex flex-col items-center justify-center bg-[#12161c] py-4">
                <div className="font-black text-xl text-on-surface">0</div>
                <span className="text-[8px] text-on-surface-variant font-bold uppercase tracking-tighter text-center mt-1">Puntos</span>
              </div>
              <div className="flex flex-col items-center justify-center bg-[#12161c] py-4">
                <div className="font-black text-xl text-primary-container">$0.00</div>
                <span className="text-[8px] text-on-surface-variant font-bold uppercase tracking-tighter text-center mt-1">Inversión</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center justify-center bg-[#12161c] py-4">
                <div className="font-black text-xl text-on-surface">0.0</div>
                <span className="text-[8px] text-on-surface-variant font-bold uppercase tracking-tighter text-center mt-1">Rating</span>
              </div>
              <div className="flex flex-col items-center justify-center bg-[#12161c] py-4">
                <div className="font-black text-xl text-on-surface">{profileData.yearsOfExperience || 0}</div>
                <span className="text-[8px] text-on-surface-variant font-bold uppercase tracking-tighter text-center mt-1">Años Exp</span>
              </div>
              <div className="flex flex-col items-center justify-center bg-[#12161c] py-4">
                <div className="font-black text-xl text-on-surface">{profileData.services?.length || 0}</div>
                <span className="text-[8px] text-on-surface-variant font-bold uppercase tracking-tighter text-center mt-1">Servicios</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* New Section: Digital Card View for Client */}
      {isClient && (
        <div className="px-5 mt-6">
          <div className={cn(
            "relative w-full aspect-[1.6/2.4] max-w-sm mx-auto rounded-[24px] overflow-hidden border p-6 flex flex-col items-center justify-between transition-all duration-500",
            (profile as any)?.isElite
              ? "border-[#FFD700]/50 shadow-[0_0_30px_rgba(255,215,0,0.2)] bg-gradient-to-br from-[#1a1600] to-[#0a0a0a]"
              : (profile as any)?.isPremium
                ? "border-[#FF00FF]/50 shadow-[0_0_30px_rgba(255,0,255,0.2)] bg-gradient-to-br from-[#1a001a] to-[#0a0a0a]"
                : "border-[#00FFFF]/30 shadow-[0_0_30px_rgba(0,255,255,0.1)] bg-gradient-to-br from-[#001a1a] to-[#0a0a0a]"
          )}>
            {/* Patterns/Overlay */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/10 rounded-full blur-3xl -mr-10 -mt-10"></div>

            {/* Profile Header */}
            <div className="relative z-10 flex flex-col items-center justify-center gap-3 w-full flex-grow">
              <div className="relative">
                <div className={cn(
                  "w-32 h-32 rounded-full border-4 p-1",
                  (profile as any)?.isElite ? "border-[#FFD700]" : (profile as any)?.isPremium ? "border-[#FF00FF]" : "border-[#00FFFF]"
                )}>
                  <img
                    src={profile?.photoUrl || 'https://via.placeholder.com/150'}
                    className="w-full h-full rounded-full object-cover grayscale-[0.2] contrast-[1.1]"
                    alt={profileData.name}
                  />
                </div>
              </div>

              <div className="text-center">
                <h4 className="text-white font-black text-2xl leading-tight">
                  {profileData.name}
                </h4>
                <p className="text-[#00FFFF] text-xs font-bold uppercase tracking-[0.2em] mt-1">
                  {profile.profession || 'Profesional'}
                </p>
              </div>
            </div>

            {/* Rating Section */}
            <div className="relative z-10 w-full flex flex-col items-center py-4">
              <div className="text-white/30 text-[10px] font-medium uppercase tracking-widest mb-1">
                Clasificación
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-8 h-8 text-[#FFD700] fill-current" />
                <span className="text-5xl font-black text-white tracking-tighter">
                    {profile.rating || '5.0'}
                </span>
              </div>
            </div>

            {/* Footer Info */}
            <div className="relative z-10 w-full flex flex-col gap-2 pt-4 border-t border-white/10">
              <div className="flex justify-between items-center text-[9px] text-white/50 font-bold uppercase tracking-widest">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#00FFFF]" />
                  {profile.municipality || 'Ubicación'}
                </div>
              </div>
              <div className="flex justify-center mt-1">
                <div className="text-[10px] font-black italic text-transparent bg-clip-text bg-gradient-to-r from-[#00FFFF] to-[#FF00FF]">
                  PINPRO PROFESSIONAL
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Cards Layout */}
      <div className="px-5 flex flex-col gap-4 mt-6">
        {/* Status Section */}
        <div className="flex flex-wrap items-center gap-2">
          {((profile as any)?.isElite) && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[8px] font-black uppercase tracking-widest">
              <Award className="w-3 h-3" />
              ELITE
            </div>
          )}
        </div>

      {/* Content Sections */}
      <div className="px-5 flex flex-col gap-4 w-full max-w-[800px] mx-auto pb-4">
        {isClient ? (
          <div className="flex flex-col gap-4">
            {/* Client Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/new-request')}
                className="bg-primary-container text-surface-lowest font-black text-[10px] uppercase tracking-widest py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                Nueva Solicitud
              </button>
              <button
                onClick={() => navigate('/edit-profile')}
                className="bg-[#12161c] border border-primary-container/20 text-primary-container font-black text-[10px] uppercase tracking-widest py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Edit2 className="w-4 h-4" />
                Editar Perfil
              </button>
            </div>

            {/* Client Dashboard Card - Neo Card Style */}
            <div className="bg-[#12161c] border border-white/5 rounded-xl p-5 relative overflow-hidden group">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-[#e2e8f0]">
                <ShieldCheck className="w-4 h-4 text-[#00ff88]" />
                Nivel de Contratante
              </h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00FFFF] to-[#B026FF]">
                  Explorador
                </span>
                <Award className="w-6 h-6 text-primary-container" />
              </div>
              <div className="w-full bg-surface-highest/30 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-[#00FFFF] to-[#B026FF] h-full rounded-full w-[0%]"></div>
              </div>
            </div>

            {/* Recent Hires - Neo Card */}
            <div className="bg-[#12161c] border border-white/5 rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-[#e2e8f0]">
                <Briefcase className="w-4 h-4 text-[#00ff88]" />
                Profesionales Recientes
              </h3>
              <div className="text-center py-6 text-on-surface-variant text-[11px] border border-dashed border-white/10 rounded-xl bg-black/20">
                <p>Aún no has contratado a ningún profesional.</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Professional Analytics Banner - Neo Card */}
            <div className="bg-[#12161c] border border-white/5 rounded-xl p-5 relative overflow-hidden group">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-[#e2e8f0]">
                <TrendingUp className="w-4 h-4 text-[#00ff88]" />
                Análisis de Visitas
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-black/40 border border-white/5 rounded-lg p-3 text-center">
                  <div className="text-xl font-black text-primary-container">{totalViews}</div>
                  <div className="text-[9px] text-on-surface-variant uppercase tracking-widest font-bold mt-1">Visitas</div>
                </div>
                <div className="bg-black/40 border border-white/5 rounded-lg p-3 text-center">
                  <div className="text-xl font-black text-[#B026FF]">{uniqueVisitors}</div>
                  <div className="text-[9px] text-on-surface-variant uppercase tracking-widest font-bold mt-1">Únicos</div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <h4 className="text-[9px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-1">Últimos Visitantes</h4>
                {recentVisitors.length > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    {recentVisitors.map((v, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-1.5 border border-white/5">
                        <span className="text-[10px] text-on-surface font-medium">
                          {v.userId ? `ID: ${v.userId.substring(0, 8)}` : 'Visitante'}
                        </span>
                        <span className="text-[9px] text-on-surface-variant opacity-60">
                          {new Date(v.timestamp?.seconds * 1000).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-on-surface-variant italic opacity-50">Sin visitas aún.</p>
                )}
              </div>
            </div>

            {/* Premium Upgrade - Neo Card Style */}
            {profile?.role === 'Profesional' && !profile?.isPremium && (
              <div className="bg-gradient-to-r from-primary-container/10 to-[#B026FF]/10 border border-primary-container/20 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-[#00ff88] animate-pulse" />
                  <div>
                    <h3 className="text-[11px] font-bold text-[#e2e8f0] uppercase tracking-widest">Upgrade Premium</h3>
                    <p className="text-[9px] text-on-surface-variant">Multiplica tus servicios x5</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/premium-filter')}
                  className="bg-primary-container text-surface-lowest text-[9px] font-black px-4 py-1.5 rounded-lg uppercase tracking-widest"
                >
                  Ver Más
                </button>
              </div>
            )}

            {/* About - Neo Card */}
            <div className="bg-[#12161c] border border-white/5 rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-[#e2e8f0]">
                <User className="w-4 h-4 text-[#00ff88]" />
                Sobre mí
              </h3>
              <p className="text-on-surface-variant leading-relaxed text-[13px] font-light italic">
                {profileData.bio ? DOMPurify.sanitize(profileData.bio, { ALLOWED_TAGS: [] }) : 'En busca de nuevos retos profesionales...'}
              </p>
              {profileData.tags && profileData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
                  {profileData.tags.map((tag: string, index: number) => (
                    <div key={index} className="flex items-center gap-1 bg-primary-container/5 border border-primary-container/20 text-primary-container px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                      {tag}
                    </div>
                  ))}
                </div>
              )}
            </div>

        {/* Video Presentation */}
        {profile?.role === 'Profesional' && profileData.videoUrl && (
          <div className="bg-surface-container/60 backdrop-blur-md border border-primary-container/15 rounded-2xl p-5 relative overflow-hidden group hover:border-primary-container/40 transition-colors">
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-on-surface">
              <Camera className="w-5 h-5 text-primary-container drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
              Video de Presentación
            </h3>
            <div className="relative w-full rounded-xl overflow-hidden aspect-video bg-surface-highest border border-outline-variant/30">
              <iframe
                src={profileData.videoUrl.replace('watch?v=', 'embed/')}
                title="Video de presentación"
                className="absolute inset-0 w-full h-full"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}

            {/* Services - Neo Card */}
            <div className="bg-[#12161c] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-[#e2e8f0]">
                  <DollarSign className="w-4 h-4 text-[#00ff88]" />
                  Servicios Ofrecidos
                </h3>
                {profile?.role === 'Profesional' && (
                  <button
                    onClick={() => handleOpenServiceModal()}
                    className="text-[10px] text-primary-container font-black uppercase tracking-widest bg-primary-container/10 px-3 py-1 rounded-lg"
                  >
                    + ADD
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-4">
                {profileData.services.map((service, i) => (
                  <div
                    key={service.id || i}
                    onClick={() => profile?.role === 'Profesional' && handleOpenServiceModal(service)}
                    className="bg-gradient-to-br from-[#1a1c22] to-[#0a0a0a] border border-primary-container/20 rounded-2xl p-5 shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)] cursor-pointer hover:border-primary-container/50 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-black text-sm text-[#e2e8f0] uppercase tracking-tight">{service.title}</p>
                        <p className="text-[11px] text-on-surface-variant opacity-80 mt-1">{service.desc}</p>
                      </div>
                      <div className="text-right bg-black/40 px-3 py-1 rounded-full border border-white/5">
                        <p className="font-black text-primary-container text-xs">{service.price}</p>
                        <p className="text-[9px] text-on-surface-variant uppercase">{service.unit}</p>
                      </div>
                    </div>
                    <button className="w-full py-2.5 bg-primary-container/10 text-primary-container font-black text-[10px] uppercase tracking-widest rounded-xl border border-primary-container/20 group-hover:bg-primary-container group-hover:text-surface-lowest transition-all">
                      {profile?.role === 'Profesional' ? 'Editar Servicio' : 'Reservar / Contactar'}
                    </button>
                  </div>
                ))}
                {profileData.services.length === 0 && (
                  <div className="text-center py-10 text-on-surface-variant text-[11px] border border-dashed border-white/10 rounded-2xl">
                    No hay servicios configurados.
                  </div>
                )}
              </div>
            </div>

            {/* Portfolio - Neo Card */}
            <div className="bg-[#12161c] border border-white/5 rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-[#e2e8f0]">
                <ImageIcon className="w-4 h-4 text-[#00ff88]" />
                Portafolio
              </h3>
              {profileData.portfolio && profileData.portfolio.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {profileData.portfolio.slice(0, 3).map((imgUrl: string, index: number) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden border border-white/5 bg-black/20">
                      <img src={imgUrl} className="w-full h-full object-cover opacity-80" alt="Portfolio" />
                    </div>
                  ))}
                  {profileData.portfolio.length > 3 && (
                    <div className="aspect-square rounded-lg bg-black/40 border border-white/5 flex items-center justify-center">
                      <span className="text-[10px] font-black text-primary-container">+{profileData.portfolio.length - 3}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-on-surface-variant text-[11px] border border-dashed border-white/10 rounded-xl">
                  Sin fotos aún.
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="px-5 mt-6 mb-4">
        <button
          onClick={executeShare}
          className="w-full bg-[#00FFFF] hover:bg-white text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 uppercase tracking-tight transition-all active:scale-95 shadow-[0_0_20px_rgba(0,255,255,0.4)]"
        >
          <Share2 className="w-4 h-4" />
          Compartir Tarjeta Digital
        </button>
      </div>

      {/* Support / Report Platform Button */}
      <div className="mt-8 mb-24 flex justify-center pb-12">
        <button
          onClick={() => setShowReportModal(true)}
          className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#e2e8f0]/40 hover:text-red-500/60 transition-colors px-4 py-2 rounded-lg border border-white/5 bg-black/20"
        >
          <AlertTriangle className="w-3 h-3" />
          Reportar un Problema
        </button>
      </div>
    </div>

      {/* Service Edit Modal */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-[#12161c] border border-white/5 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#e2e8f0]">
                {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h3>
              <button
                onClick={() => setIsServiceModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/5 text-on-surface-variant transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest pl-1">Título</label>
                <input
                  type="text"
                  value={serviceForm.title}
                  onChange={(e) => setServiceForm({...serviceForm, title: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 text-on-surface text-[11px] rounded-xl px-4 py-3 focus:outline-none focus:border-primary-container transition-all"
                  placeholder="Ej. Reparación de Fugas"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest pl-1">Descripción</label>
                <input
                  type="text"
                  value={serviceForm.desc}
                  onChange={(e) => setServiceForm({...serviceForm, desc: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 text-on-surface text-[11px] rounded-xl px-4 py-3 focus:outline-none focus:border-primary-container transition-all"
                  placeholder="Ej. Arreglo de grifos"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest pl-1">Precio</label>
                  <input
                    type="text"
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({...serviceForm, price: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 text-on-surface text-[11px] rounded-xl px-4 py-3 focus:outline-none focus:border-primary-container transition-all text-center"
                    placeholder="Ej. $80"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest pl-1">Unidad</label>
                  <input
                    type="text"
                    value={serviceForm.unit}
                    onChange={(e) => setServiceForm({...serviceForm, unit: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 text-on-surface text-[11px] rounded-xl px-4 py-3 focus:outline-none focus:border-primary-container transition-all text-center"
                    placeholder="Ej. /hr"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-white/5 flex gap-2">
              {editingService && (
                <button
                  onClick={handleDeleteService}
                  disabled={isSaving}
                  className="p-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleSaveService}
                disabled={isSaving || !serviceForm.title || !serviceForm.price}
                className="flex-1 bg-primary-container hover:bg-primary text-surface-lowest font-black text-[10px] uppercase tracking-widest py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Platform Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />

      {/* Digital Card Share Modal */}
      {/* Modal removed - Integrated into Profile View */}
    </div>
  );
}
