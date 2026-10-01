import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Share2, Edit3, MessageSquare, Briefcase, User, Settings, LogOut, Power, Bell, TrendingUp, Zap, Users as UsersIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { QRCodeCanvas } from 'qrcode.react';
import ShareProfileModal from '../components/ShareProfileModal';

export default function ProDashboard() {
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [proData, setProData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(true);
  const [accessKey, setAccessKey] = useState('');
  const [error, setError] = useState('');
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    const granted = localStorage.getItem('pme_pinpro_auth_key') === 'true';
    if (granted || profile?.role === 'Admin' || isAdmin) {
      setIsLocked(false);
    }
  }, [profile, isAdmin]);

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Clave simple solicitada por el usuario
    if (accessKey === '11739552') {
      localStorage.setItem('pme_pinpro_auth_key', 'true');
      setIsLocked(false);
      setError('');
    } else {
      setError('Clave incorrecta');
      setAccessKey('');
    }
  };

  useEffect(() => {
    if (!user) return;
    const fetchPro = async () => {
      const docRef = doc(db, 'profesionales', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProData(docSnap.data());
      }
      setLoading(false);
    };
    fetchPro();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const toggleStatus = async () => {
    if (!user || !proData) return;
    const newStatus = !proData.isOnline;
    await updateDoc(doc(db, 'profesionales', user.uid), {
      isOnline: newStatus
    });
    setProData({ ...proData, isOnline: newStatus });
  };

  const shareCard = () => {
    setIsShareOpen(true);
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-black"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#00FFFF]"></div></div>;

  if (isLocked) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 font-sans">
        <Helmet>
          <title>Acceso Protegido | PinPro</title>
        </Helmet>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-[#111111]/80 backdrop-blur-2xl p-8 rounded-[38px] border border-white/10 text-center space-y-6 shadow-2xl"
        >
          <div className="w-20 h-20 bg-[#00FFFF]/10 rounded-3xl flex items-center justify-center mx-auto border border-[#00FFFF]/20">
            <Zap className="w-10 h-10 text-[#00FFFF] fill-[#00FFFF]/20" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Panel Acceso Pro</h2>
            <p className="text-white/40 text-sm">Introduce la clave de seguridad para continuar.</p>
          </div>
          <form onSubmit={handleKeySubmit} className="space-y-4">
            <input
              type="password"
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
              placeholder="••••"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 text-center text-2xl font-black tracking-[0.5em] focus:border-[#00FFFF] focus:outline-none transition-all"
              autoFocus
            />
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 text-xs font-bold uppercase"
              >
                {error}
              </motion.p>
            )}
            <button
              type="submit"
              className="w-full bg-[#00FFFF] text-black font-black py-4 rounded-2xl shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-sm"
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full text-white/40 font-bold py-2 text-xs uppercase tracking-widest hover:text-white transition-colors"
            >
              Regresar al mapa
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const profileUrl = `${window.location.origin}/p/${user?.uid}`;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col pb-24 font-sans selection:bg-[#00FFFF] selection:text-black">
      <Helmet>
        <title>{`Dashboard: ${proData?.name || 'Profesional'} | PinPro`}</title>
        <meta property="og:title" content={`Perfil Profesional: ${proData?.name || 'Profesional'} 🛠️`} />
        <meta property="og:description" content={`Especialista en ${proData?.category || 'Servicios'} • Calificación: ⭐ ${proData?.rating || '5.0'}. ¡Mira mis servicios en PinPro!`} />
        <meta property="og:image" content={proData?.photoUrl || 'https://pinpro.app/cover.png'} />
        <meta property="og:type" content="website" />
        <meta name="theme-color" content="#00FFFF" />
      </Helmet>

      {/* Top Header */}
      <div className="sticky top-0 z-[100] px-6 py-4 flex justify-between items-center bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#00FFFF]/10 rounded-xl flex items-center justify-center border border-[#00FFFF]/20">
            <Zap className="w-5 h-5 text-[#00FFFF] fill-[#00FFFF]/20" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter leading-none">PinPro</h1>
            <p className="text-[10px] font-bold text-[#00FFFF] tracking-[0.2em] uppercase">Control Panel</p>
          </div>
        </div>
        <button onClick={toggleStatus} className={cn(
          "px-5 py-2 rounded-2xl text-[10px] font-black flex items-center gap-2 transition-all active:scale-95",
          proData?.isOnline ? "bg-green-500/10 text-green-400 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.2)]" : "bg-red-500/10 text-red-400 border border-red-500/20"
        )}>
          <div className={cn("w-2 h-2 rounded-full", proData?.isOnline ? "bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" : "bg-red-500")} />
          {proData?.isOnline ? "EN LÍNEA" : "DESCONECTADO"}
        </button>
      </div>

      <div className="p-6 space-y-10 max-w-lg mx-auto w-full">
        {/* Airdrop & Rewards Banner */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/airdrop')}
          className="w-full relative group overflow-hidden rounded-[32px] p-6 bg-gradient-to-br from-purple-900/40 to-black border border-purple-500/30 flex items-center justify-between"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-purple-500/10 to-transparent opacity-50"></div>
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center border border-purple-500/40">
              <Zap className="w-7 h-7 text-purple-400 fill-purple-400/20" />
            </div>
            <div className="text-left">
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Centro de Airdrop</h3>
              <p className="text-[10px] font-bold text-purple-300 uppercase tracking-widest">Recompensas y Tokens PIN</p>
            </div>
          </div>
          <TrendingUp className="w-6 h-6 text-purple-400 group-hover:translate-x-1 transition-transform" />
        </motion.button>

        {/* Futuristic Digital Card */}
        <div className="relative group">
          {/* Animated Border Glow */}
          <div className="absolute -inset-1.5 bg-gradient-to-r from-[#00FFFF] to-purple-600 rounded-[40px] opacity-20 blur-xl group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-[#111111]/80 backdrop-blur-3xl rounded-[38px] overflow-hidden border border-white/10 shadow-3xl"
          >
            {/* Conic Gradient Rotation Effect */}
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[conic-gradient(transparent,var(--color-primary-container),transparent_30%)] animate-rotate opacity-[0.08] pointer-events-none"></div>

            <div className="relative p-10 flex flex-col items-center text-center">
              {/* Profile Pic with Status */}
              <div className="relative mb-8">
                <div className="absolute -inset-2 bg-[#00FFFF] rounded-full opacity-20 blur-md animate-pulse"></div>
                <div className="relative w-32 h-32 rounded-full p-1.5 bg-gradient-to-tr from-[#00FFFF] to-purple-500 shadow-2xl">
                    <img
                      src={proData?.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`}
                      alt="Avatar"
                      loading="lazy"
                      className="w-full h-full rounded-full object-cover border-4 border-black"
                    />
                  <div className={cn(
                    "absolute bottom-2 right-2 w-7 h-7 rounded-full border-4 border-black flex items-center justify-center",
                    proData?.isOnline ? "bg-green-500" : "bg-red-500"
                  )}></div>
                </div>
              </div>

              <h2 className="text-3xl font-black mb-1 bg-gradient-to-r from-white to-[#00FFFF] bg-clip-text text-transparent uppercase tracking-tight">
                {proData?.name || 'Profesional'}
              </h2>
              <p className="text-white/40 text-sm font-bold tracking-widest uppercase mb-8">
                {proData?.category || 'Especialista'} • ID: #{user?.uid?.slice(-4).toUpperCase()}
              </p>

              <div className="grid grid-cols-2 gap-8 w-full mb-10">
                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                  <div className="flex items-center justify-center gap-1.5 text-[#00FFFF] mb-1">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-[10px] font-black uppercase">Puntos</span>
                  </div>
                  <span className="text-3xl font-black tracking-tighter">{proData?.rating || '5.0'}</span>
                </div>
                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                  <div className="flex items-center justify-center gap-1.5 text-purple-400 mb-1">
                    <Briefcase className="w-3 h-3" />
                    <span className="text-[10px] font-black uppercase">Trabajos</span>
                  </div>
                  <span className="text-3xl font-black tracking-tighter">{proData?.completedJobs || '0'}</span>
                </div>
              </div>

              {/* QR Section */}
              <div className="w-full bg-[#050505] rounded-3xl p-8 border border-white/5 mb-10 group/qr relative overflow-hidden">
                <div className="relative w-40 h-40 mx-auto bg-white p-3 rounded-2xl shadow-inner overflow-hidden">
                  <QRCodeCanvas
                    value={profileUrl}
                    size={136}
                    level={"H"}
                    includeMargin={false}
                    className="w-full h-full"
                  />
                  {/* Laser Scan Line */}
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-[#00FFFF] shadow-[0_0_15px_#00FFFF] animate-scan z-10"></div>
                </div>
                <p className="mt-4 text-[#00FFFF] text-[10px] font-black uppercase tracking-[0.3em]">Escanea mi Perfil</p>
              </div>

              <div className="w-full grid grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/pro/edit')}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 text-xs uppercase tracking-widest"
                >
                  <Edit3 className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={shareCard}
                  className="bg-gradient-to-r from-[#00FFFF] to-[#0072ff] text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(0,255,255,0.3)] hover:shadow-[0_4px_30px_rgba(0,255,255,0.5)] transition-all active:scale-95 text-xs uppercase tracking-widest"
                >
                  <Share2 className="w-4 h-4 text-black" />
                  Compartir
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Menu */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-900/50 border border-white/5 p-5 rounded-[28px] space-y-3">
            <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-zinc-500" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Ajustes</h3>
              <p className="text-[10px] text-zinc-500 font-medium">Cuenta y privacidad</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500/5 border border-red-500/10 p-5 rounded-[28px] space-y-3 text-left group"
          >
            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
              <LogOut className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Salir</h3>
              <p className="text-[10px] text-red-400/50 font-medium">Cerrar sesión segura</p>
            </div>
          </button>
        </div>
      </div>

      {proData && (
        <ShareProfileModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          proName={proData.name || 'Profesional'}
          proCategory={proData.category || 'Servicios'}
          proRating={proData.rating ?? '5.0'}
          proJobs={proData.completedJobs ?? 0}
          proPhoto={proData.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`}
          profileUrl={profileUrl}
        />
      )}
    </div>
  );
}
