import { Helmet } from 'react-helmet-async';
import { ArrowLeft, MapPin, Star, User, DollarSign, Image as ImageIcon, MessageSquare, Calendar, Wrench, Instagram, Facebook, ShieldCheck, Award, Briefcase, TrendingUp, AlertTriangle, Camera, Sparkles, Loader2, Share2, Phone, UserRound } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import DOMPurify from 'dompurify';
import useSWR from 'swr';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { ServiceItem, useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { ReportModal } from '../components/ReportModal';
import { LoadingScreen } from '../components/LoadingScreen';
import { DigitalCardModal } from '../components/DigitalCardModal';

import { AnimatedBackButton } from '../components/AnimatedBackButton';

import { ChatOverlay, CallUI } from '../components/RealTimeComponents';

export default function PublicProfile() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, profile, switchRole } = useAuth();

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false);

  // SWR Fetcher for Profile
  const fetchProfile = async (profileId: string) => {
    // Parallel fetch for better performance
    const [proSnap, clientSnap] = await Promise.all([
      getDoc(doc(db, 'profesionales', profileId)),
      getDoc(doc(db, 'clientes', profileId))
    ]);

    if (proSnap.exists()) {
      return { id: proSnap.id, ...proSnap.data() };
    }
    if (clientSnap.exists()) {
      return { id: clientSnap.id, ...clientSnap.data() };
    }
    throw new Error("No such user!");
  };

  const { data: profileData, error: swrError, isLoading: profileLoading } = useSWR<any>(
    id ? `profile/${id}` : null,
    () => fetchProfile(id!),
    { revalidateOnFocus: false, dedupingInterval: 60000 } // Cache for 1 minute
  );

  useEffect(() => {
    // Fetch reviews separately as they change more frequently
    if (id) {
      const q = query(collection(db, 'reviews'), where('proId', '==', id));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const revs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReviews(revs);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'reviews');
      });
      return () => unsubscribe();
    }
  }, [id]);

  const handleMessageClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setIsChatOpen(true);
  };

  const handleSendRequest = async () => {
    if (!user || !profileData || !id) return;
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: id,
        senderId: user.uid,
        message: `¡Nueva solicitud de servicio de ${profile?.name || 'un cliente'}!`,
        type: 'request',
        createdAt: serverTimestamp(),
        read: false
      });
      alert("Solicitud enviada exitosamente al profesional.");
      setShowBookingModal(true);
    } catch (error) {
      console.error(error);
      alert("Error al enviar la solicitud.");
    }
  };

  const handleReportClick = async () => {
    if (!user || !profileData || !id) {
      alert("Debes iniciar sesión para reportar un perfil.");
      return;
    }
    setShowReportModal(true);
  };

  const { services, averageRating } = useMemo(() => {
    const svcs: ServiceItem[] = profileData?.services || [];
    const rating = reviews.length > 0
      ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length).toFixed(1)
      : '0.0';
    return { services: svcs, averageRating: rating };
  }, [profileData?.services, reviews]);

  const isClient = profileData?.role === 'Cliente';

  if (profileLoading) {
    return <LoadingScreen message="CARGANDO PERFIL..." />;
  }

  if (swrError || !profileData) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-surface-lowest gap-4">
        <div className="text-on-surface-variant">Perfil no encontrado</div>
        <button onClick={() => navigate(-1)} className="text-primary-container font-bold">Volver</button>
      </div>
    );
  }

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const executeShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = `Tarjeta Digital de ${profileData.name} - PinPro`;
    const shareText = `Hola, te comparto el perfil profesional de ${profileData.name} como ${profileData.profession || 'profesional'} en PinPro.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('¡Enlace copiado al portapapeles!');
      } catch (error) {
        console.error('Failed to copy text:', error);
      }
    }
  };

  return (
    <div className="relative flex min-h-full w-full flex-col overflow-x-hidden bg-surface-lowest">
      <Helmet>
        <title>{profileData?.name} | PinPro</title>
        <meta name="description" content={profileData?.bio || `Conecta con ${profileData?.name}, profesional en PinPro.`} />
      </Helmet>

      {/* Optimized Profile Container */}
      <div className="flex flex-col h-full bg-[#0a0c10] overflow-y-auto overflow-x-hidden pb-12">

        {/* Banner Section */}
        <div className="relative w-full h-[220px] shrink-0 bg-[#0b0e11] overflow-hidden group">
          <div className="absolute inset-0">
            <img
              src="/mapa-neo.png"
              className="w-full h-full object-cover opacity-80"
              alt="header"
            />
            {/* Neon Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0b0e11]/20 via-[#0b0e11]/50 to-[#0b0e11]"></div>
          </div>
        </div>

        {/* Floating Header Actions */}
        <div className="absolute top-4 left-4 right-4 z-[60] flex items-center justify-between pointer-events-none">
          <div />
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={handleShare}
              className="w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-xl border border-white/10 text-primary-container shadow-xl active:scale-95 transition-all"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleReportClick}
              className="w-12 h-12 flex items-center justify-center bg-black/40 backdrop-blur-md text-red-500 rounded-xl border border-white/10 shadow-xl active:scale-95 transition-all"
            >
              <AlertTriangle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Avatar Superpuesto */}
        <div className="relative flex flex-col items-center px-6 -mt-[80px] z-20">
          {/* Social Icons Above Avatar */}
          <div className="flex gap-4 mb-3">
            <motion.a
              href={profileData.instagram || undefined}
              target={profileData.instagram ? "_blank" : undefined}
              rel="noopener noreferrer"
              className={cn(
                "w-10 h-10 rounded-xl bg-black/40 backdrop-blur-md border flex items-center justify-center shadow-xl transition-all",
                profileData.instagram ? "border-[#00ff88]/30 text-[#00ff88]" : "border-white/5 text-white/10 pointer-events-none"
              )}
            >
              <Instagram className="w-5 h-5" />
            </motion.a>
            <motion.a
              href={profileData.facebook || undefined}
              target={profileData.facebook ? "_blank" : undefined}
              rel="noopener noreferrer"
              className={cn(
                "w-10 h-10 rounded-xl bg-black/40 backdrop-blur-md border flex items-center justify-center shadow-xl transition-all",
                profileData.facebook ? "border-[#00ff88]/30 text-[#00ff88]" : "border-white/5 text-white/10 pointer-events-none"
              )}
            >
              <Facebook className="w-5 h-5" />
            </motion.a>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#00FFFF] to-[#B026FF] animate-pulse blur-xl opacity-30" />
            <div className={cn(
              "relative w-[120px] h-[120px] rounded-full border-4 border-[#0a0c10] overflow-hidden shadow-2xl bg-surface-highest",
              (profileData as any).isElite && "ring-4 ring-primary-container/20 ring-offset-2 ring-offset-[#0a0c10]"
            )}>
              <img
                src={profileData.photoUrl || (profileData as any).profileImage || 'https://i.ibb.co/hWk4b4S/IMG-20260416-WA0005.jpg'}
                alt={profileData.name}
                className="w-full h-full object-cover"
                loading="eager"
                decoding="sync"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://i.ibb.co/hWk4b4S/IMG-20260416-WA0005.jpg';
                }}
              />
            </div>
            <div className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-[#00FF88] border-2 border-[#0a0c10] shadow-[0_0_10px_#00FF88]" />
          </div>

          {/* Profile Name & Tags - Centered & Spaced */}
          <div className="mt-[15px] text-center">
            <h1 className="text-[1.80rem] font-black text-white uppercase tracking-tighter italic leading-tight drop-shadow-[0_0_15px_rgba(0,255,255,0.4)]">
              {profileData.name}
            </h1>
            <p className="text-[0.9rem] font-black text-[#00ff88] uppercase tracking-[2px] mt-1 opacity-90 leading-none">
              {profileData.profession || 'MECÁNICO DE MOTOS'}
            </p>
            <div className="flex items-center justify-center gap-1.5 mt-2 text-[#94a3b8]">
              <span className="text-[#00ff88] opacity-80">📍</span>
              <span className="text-[0.8rem] font-medium uppercase tracking-wide leading-none">
                {profileData.municipality || 'Mérida'}, {profileData.state || 'Yucatán'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Row - Neo Grid */}
        <div className="px-5 mt-8 w-full max-w-[800px] mx-auto">
          <div className="grid grid-cols-3 gap-px bg-white/5 border border-white/5 rounded-xl overflow-hidden shadow-2xl">
            <div className="bg-black/30 p-4 flex flex-col items-center justify-center gap-1">
              <div className="text-lg font-black text-[#e2e8f0] flex items-center gap-1">
                <Star className="w-3 h-3 text-primary-container fill-primary-container" />
                {averageRating}
              </div>
              <span className="text-[7px] font-black uppercase tracking-widest text-on-surface-variant text-center leading-none opacity-40">
                Calificación
              </span>
            </div>
            <div className="bg-black/30 p-4 flex flex-col items-center justify-center gap-1">
              <div className="text-lg font-black text-[#e2e8f0]">
                {profileData.yearsOfExperience || 0}
              </div>
              <span className="text-[7px] font-black uppercase tracking-widest text-on-surface-variant text-center leading-none opacity-40">
                Años Exp.
              </span>
            </div>
            <div className="bg-black/30 p-4 flex flex-col items-center justify-center gap-1">
              <div className="text-lg font-black text-primary-container">
                {reviews.length}
              </div>
              <span className="text-[7px] font-black uppercase tracking-widest text-on-surface-variant text-center leading-none opacity-40">
                Reseñas
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons Area */}
        {!isClient && (
          <div className="flex flex-col gap-3 px-5 mt-8 w-full max-w-[800px] mx-auto">
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => setShowBookingModal(true)}
                className="w-full bg-primary-container text-surface-lowest font-black text-[12px] uppercase tracking-[0.2em] py-4 rounded-xl shadow-[0_0_20px_rgba(0,255,255,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                <Calendar className="w-5 h-5" />
                Reservar Servicio
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={handleMessageClick}
                className="bg-black/40 border border-white/10 text-on-surface h-12 flex items-center justify-center rounded-xl active:scale-95 transition-all"
              >
                <MessageSquare className="w-5 h-5 text-primary-container" />
              </button>
              <button
                onClick={() => setIsCallOpen(true)}
                className="bg-black/40 border border-white/10 text-on-surface h-12 flex items-center justify-center rounded-xl active:scale-95 transition-all"
              >
                <Phone className="w-5 h-5 text-primary-container" />
              </button>
              <button
                onClick={() => navigate(`/emergency/${id}`)}
                className="bg-red-500/10 border border-red-500/30 text-red-500 h-12 flex items-center justify-center rounded-xl active:scale-95 transition-all"
              >
                <AlertTriangle className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Content Section - Neo Card Layout */}
        <div className="px-5 mt-8 flex flex-col gap-4 w-full max-w-[800px] mx-auto">
          {/* About */}
          <div className="bg-[#12161c] border border-white/5 rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-[#e2e8f0]">
              <User className="w-4 h-4 text-[#00ff88]" />
              Sobre mí
            </h3>
            <p className="text-on-surface-variant leading-relaxed text-[13px] font-light italic opacity-80">
              {profileData.bio ? DOMPurify.sanitize(profileData.bio, { ALLOWED_TAGS: [] }) : 'Sin información biográfica...'}
            </p>
          </div>

          {/* Services */}
          {!isClient && (
            <div className="bg-[#12161c] border border-white/5 rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-[#e2e8f0]">
                <DollarSign className="w-4 h-4 text-[#00ff88]" />
                Servicios
              </h3>
              <div className="flex flex-col gap-3">
                {services.map((service, i) => (
                  <div key={service.id || i} className="flex items-center justify-between p-3 bg-black/20 border border-white/5 rounded-lg">
                    <div>
                      <p className="text-[11px] font-bold text-[#e2e8f0] uppercase tracking-wide">{service.title}</p>
                      <p className="text-[9px] text-on-surface-variant opacity-60 italic">{service.desc}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-black text-primary-container">{service.price}</p>
                      <p className="text-[8px] text-on-surface-variant uppercase">{service.unit}</p>
                    </div>
                  </div>
                ))}
                {services.length === 0 && (
                  <p className="text-center text-[11px] text-on-surface-variant py-4 opacity-50">No hay servicios listados.</p>
                )}
              </div>
            </div>
          )}

          {/* Portfolio */}
          {!isClient && (
            <div className="bg-[#12161c] border border-white/5 rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-[#e2e8f0]">
                <ImageIcon className="w-4 h-4 text-[#00ff88]" />
                Portafolio
              </h3>
              {profileData.portfolio && profileData.portfolio.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {profileData.portfolio.slice(0, 3).map((imgUrl: string, index: number) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden border border-white/5 bg-black/10">
                      <img src={imgUrl} className="w-full h-full object-cover opacity-80" alt="Work" loading="lazy" decoding="async" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-[11px] text-on-surface-variant py-4 opacity-50">Sin trabajos previos fotos.</p>
              )}
            </div>
          )}

          {/* Reviews */}
          <div className="bg-[#12161c] border border-white/5 rounded-2xl p-6 mb-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/5 rounded-full blur-3xl -mr-16 -mt-16" />

            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Star className="w-5 h-5 text-primary-container fill-primary-container" />
                Reseñas Verificadas
              </h3>
              <div className="px-3 py-1 bg-primary-container/10 border border-primary-container/20 rounded-full">
                <span className="text-[10px] font-black text-primary-container uppercase tracking-widest">
                  {reviews.length} TOTAL
                </span>
              </div>
            </div>

            {reviews.length > 0 ? (
              <div className="flex flex-col gap-6">
                {reviews.map((review) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    key={review.id}
                    className="relative p-5 bg-black/20 border border-white/5 rounded-2xl group hover:border-primary-container/30 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-surface-highest">
                          <img
                        src={review.clientPhoto || 'https://i.ibb.co/hWk4b4S/IMG-20260416-WA0005.jpg'}
                        alt={review.clientName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                        </div>
                        <div>
                          <p className="text-[12px] font-black text-white uppercase tracking-tight">{review.clientName || 'Cliente PinPro'}</p>
                          <p className="text-[9px] text-white/40 uppercase tracking-widest font-medium">Usuario Verificado</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-primary-container/10 px-2 py-0.5 rounded-lg border border-primary-container/20">
                        <Star className="w-3 h-3 text-primary-container fill-primary-container" />
                        <span className="text-[11px] font-black text-primary-container">{review.rating.toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="relative">
                      <span className="absolute -left-2 -top-2 text-4xl text-primary-container/10 font-serif leading-none">“</span>
                      <p className="text-[13px] text-white/70 italic leading-relaxed pl-3">
                        {review.comment}
                      </p>
                    </div>

                    <div className="mt-4 flex gap-4 border-t border-white/5 pt-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-[8px] text-white/30 uppercase font-black tracking-widest">Puntualidad</span>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <div key={s} className={cn("w-1.5 h-1.5 rounded-full", s <= review.punctuality ? "bg-primary-container" : "bg-white/5")} />
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[8px] text-white/30 uppercase font-black tracking-widest">Profesionalismo</span>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <div key={s} className={cn("w-1.5 h-1.5 rounded-full", s <= review.professionalism ? "bg-primary-container" : "bg-white/5")} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 bg-black/10 rounded-2xl border border-dashed border-white/5">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                  <Star className="w-6 h-6 text-white/20" />
                </div>
                <p className="text-[11px] font-black text-white/30 uppercase tracking-[3px]">Sin reseñas todavía</p>
                <p className="text-[9px] text-white/20 uppercase mt-1">¡Sé el primero en calificar este servicio!</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Booking Confirmation Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-lowest border border-primary-container/30 rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_0_30px_rgba(0,255,255,0.15)] flex flex-col">
            <div className="p-6 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-container/10 flex items-center justify-center border border-primary-container/30 shadow-[0_0_15px_rgba(0,255,255,0.2)]">
                <Calendar className="w-8 h-8 text-primary-container drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-on-surface mb-2">Confirmar Reserva</h3>
                <p className="text-sm text-on-surface-variant">
                  Estás a punto de iniciar el proceso de reserva con <span className="text-primary-container font-bold">{profileData?.name}</span>. ¿Deseas continuar?
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-outline-variant/30 flex gap-3 bg-surface-container/30">
              <button
                onClick={() => setShowBookingModal(false)}
                className="flex-1 py-3 rounded-xl border border-outline-variant/50 text-on-surface-variant hover:bg-surface-highest transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  navigate(`/booking/${id}`);
                }}
                className="flex-1 bg-gradient-to-r from-[#00FFFF] to-[#B026FF] hover:from-[#00E5E5] hover:to-[#9D15EB] text-surface-lowest font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(0,255,255,0.3)] transition-all active:scale-[0.98]"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Report User Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportedUserId={id}
        reportedUserName={profileData?.name}
      />

      {/* Digital Card Share Modal */}
      <DigitalCardModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        profile={profileData}
        onShare={executeShare}
      />

      <ChatOverlay
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        orderId={`profile-${id}`}
        recipientId={id || ""}
        recipientName={profileData?.name || "Usuario"}
      />
      <CallUI
        isOpen={isCallOpen}
        onClose={() => setIsCallOpen(false)}
        recipientId={id || ""}
        recipientName={profileData?.name || "Usuario"}
      />
    </div>
  );
}
