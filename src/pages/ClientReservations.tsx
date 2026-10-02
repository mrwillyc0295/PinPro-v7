import { Clock, Calendar, MapPin, Wrench, Sparkles, AlertTriangle, Star, X, MessageSquare, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs, runTransaction, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { RANKING_CONSTANTS } from '../services/rankingService';

export default function ClientReservations() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [reservations, setReservations] = useState<any[]>([]);
  const [isLoadingReservations, setIsLoadingReservations] = useState(true);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedResForReview, setSelectedResForReview] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [punctuality, setPunctuality] = useState(5);
  const [professionalism, setProfessionalism] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewedResIds, setReviewedResIds] = useState<Set<string>>(new Set());

  const handleGoToChat = async (proId: string) => {
    if (!user) return;

    try {
      const chatQuery = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', user.uid)
      );
      const chatSnap = await getDocs(chatQuery);
      let chatId = null;

      chatSnap.forEach(chatDoc => {
        const data = chatDoc.data();
        if (data.participants.includes(proId)) {
          chatId = chatDoc.id;
        }
      });

      if (chatId) {
        navigate(`/messages/${chatId}`);
      } else {
        alert("No se encontró un chat activo para esta reserva.");
      }
    } catch (error) {
      console.error("Error finding chat:", error);
      handleFirestoreError(error, OperationType.LIST, 'chats');
    }
  };

  useEffect(() => {
    if (!loading && profile && profile.role === 'Profesional') {
      navigate('/activity');
    }
  }, [profile?.role, loading, navigate]);

  useEffect(() => {
    if (!user) return;

    const qRes = query(
      collection(db, 'reservations'),
      where('clientId', '==', user.uid)
    );

    const qReq = query(
      collection(db, 'requests'),
      where('clientId', '==', user.uid)
    );

    let resData: any[] = [];
    let reqData: any[] = [];

    const updateCombined = () => {
      const combined = [...resData, ...reqData];
      combined.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA; // Descending
      });
      setReservations(combined);
      setIsLoadingReservations(false);
    };

    const unsubscribeRes = onSnapshot(qRes, (snapshot) => {
      resData = snapshot.docs.map(doc => ({
        id: doc.id,
        type: 'reservation',
        ...doc.data()
      }));
      updateCombined();
    }, (error) => {
      console.error("Error fetching reservations:", error);
    });

    const unsubscribeReq = onSnapshot(qReq, (snapshot) => {
      reqData = snapshot.docs.map(doc => ({
        id: doc.id,
        type: 'request',
        ...doc.data()
      }));
      updateCombined();
    }, (error) => {
      console.error("Error fetching requests:", error);
    });

    // Fetch existing reviews to know which ones are already reviewed
    const fetchReviews = async () => {
      const revQ = query(collection(db, 'reviews'), where('clientId', '==', user.uid));
      const revSnap = await getDocs(revQ);
      const ids = new Set<string>();
      revSnap.forEach(doc => {
        ids.add(doc.data().reservationId);
      });
      setReviewedResIds(ids);
    };
    fetchReviews();

    return () => {
      unsubscribeRes();
      unsubscribeReq();
    };
  }, [user]);

  const handleViewDetails = (res: any) => {
    if (res.type === 'request') {
      alert(`Detalles de la solicitud:\n\nServicio: ${res.serviceType}\nDescripción: ${res.description}\nFecha: ${res.date}\nUbicación: ${res.location}\nEstado: ${res.status}`);
    } else {
      alert(`Detalles de la reserva:\n\nServicio: ${res.serviceTitle}\nProfesional: ${res.proName}\nFecha: ${res.date}\nUbicación: ${res.location}\nEstado: ${res.status}`);
    }
  };

  const handleOpenReview = (res: any) => {
    setSelectedResForReview(res);
    setRating(5);
    setPunctuality(5);
    setProfessionalism(5);
    setCommunication(5);
    setComment('');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedResForReview || !user || !profile) return;
    setIsSubmittingReview(true);

    try {
      await runTransaction(db, async (transaction) => {
        const proRef = doc(db, 'profesionales', selectedResForReview.proId);
        const proDoc = await transaction.get(proRef);

        if (!proDoc.exists()) {
          throw new Error("El perfil del profesional no existe.");
        }

        const proData = proDoc.data();
        const currentRating = proData.rating || 5;
        const currentTotal = proData.totalReviews || 0;

        const newTotal = currentTotal + 1;
        const newRatingAvg = ((currentRating * currentTotal) + rating) / newTotal;

        // Recalculate Final Score for Ranking
        let score = proData.baseScore || 0;
        score += proData?.verificationStatus === 'verified' ? RANKING_CONSTANTS.TRUST_BOOST_VALUE : 0;
        score += proData?.isPremium ? RANKING_CONSTANTS.PREMIUM_BOOST_VALUE : 0;
        score += newRatingAvg * RANKING_CONSTANTS.RATING_MULTIPLIER;
        score += proData?.activityBoost || proData?.activity?.rating || 0;
        score += proData?.locationBoost || 0;

        if (proData.adminBoost && proData.adminBoostExpiry) {
          const now = new Date();
          const expiry = proData.adminBoostExpiry instanceof Timestamp
            ? proData.adminBoostExpiry.toDate()
            : new Date(proData.adminBoostExpiry);
          if (expiry > now) score += proData.adminBoost;
        }
        score -= proData.penalties || 0;

        const reviewRef = doc(collection(db, 'reviews'));

        // 1. Create review
        transaction.set(reviewRef, {
          reservationId: selectedResForReview.id,
          proId: selectedResForReview.proId,
          clientId: user.uid,
          clientName: profile.name || 'Cliente',
          clientPhoto: profile.photoUrl || '',
          rating,
          punctuality,
          professionalism,
          communication,
          comment,
          createdAt: serverTimestamp()
        });

        // 2. Update Professional Profile with aggregates AND new ranking score
        transaction.update(proRef, {
          rating: Number(newRatingAvg.toFixed(2)),
          totalReviews: newTotal,
          finalScore: Math.max(0, score),
          updatedAt: serverTimestamp()
        });
      });

      setReviewedResIds(prev => new Set(prev).add(selectedResForReview.id));
      setShowReviewModal(false);
      alert("¡Gracias por tu reseña! Tu opinión ayuda a nuestra comunidad.");
    } catch (error) {
      console.error("Error submitting review transaction:", error);
      handleFirestoreError(error, OperationType.WRITE, 'reviews/transaction');
      alert("Error al enviar la reseña. Por favor intenta de nuevo.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'active':
        return {
          color: 'text-[#00FF00]',
          bg: 'bg-[#00FF00]/10',
          border: 'border-[#00FF00]/30',
          text: 'En progreso'
        };
      case 'accepted':
        return {
          color: 'text-[#00FFFF]',
          bg: 'bg-[#00FFFF]/10',
          border: 'border-[#00FFFF]/30',
          text: 'Aceptada'
        };
      case 'completed':
        return {
          color: 'text-on-surface-variant',
          bg: 'bg-surface-highest',
          border: 'border-outline-variant',
          text: 'Completado'
        };
      case 'cancelled':
        return {
          color: 'text-[#ef4343]',
          bg: 'bg-[#ef4343]/10',
          border: 'border-[#ef4343]/30',
          text: 'Cancelado'
        };
      default: // pending
        return {
          color: 'text-[#FFD700]',
          bg: 'bg-[#FFD700]/10',
          border: 'border-[#FFD700]/30',
          text: 'Pendiente'
        };
    }
  };

  return (
    <div className="flex-1 w-full h-full bg-surface-lowest overflow-y-auto hide-scrollbar flex flex-col">
      <div className="sticky top-0 z-20 bg-surface-lowest/90 backdrop-blur-xl border-b border-primary-container/20 shadow-[0_4px_20px_-10px_rgba(0,255,255,0.3)] px-5 py-4 pt-12 flex items-center justify-end">
        <h1 className="text-lg font-black text-on-surface tracking-wide drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] uppercase italic">Mis Solicitudes</h1>
      </div>
      <div className="p-5 flex flex-col gap-4">
        {isLoadingReservations ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Loader2 className="w-8 h-8 text-primary-container animate-spin shadow-[0_0_15px_rgba(0,255,255,0.5)] rounded-full" />
            <div className="text-on-surface-variant text-sm font-medium">Cargando solicitudes...</div>
          </div>
        ) : reservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-highest flex items-center justify-center border border-outline-variant/50">
              <Calendar className="w-8 h-8 text-on-surface-variant" />
            </div>
            <div>
              <h3 className="text-on-surface font-bold text-lg">No tienes solicitudes</h3>
              <p className="text-on-surface-variant text-sm mt-1">Explora profesionales o publica una nueva solicitud.</p>
            </div>
            <button onClick={() => navigate('/home')} className="mt-4 bg-primary-container text-surface-lowest font-bold px-6 py-3 rounded-xl shadow-[0_0_15px_rgba(0,255,255,0.3)]">
              Explorar Servicios
            </button>
          </div>
        ) : (
          reservations.map((res) => {
            const styles = getStatusStyles(res.status);
            const isReviewed = reviewedResIds.has(res.id);
            return (
              <div key={res.id} className={cn("relative p-5 rounded-2xl border backdrop-blur-md flex flex-col gap-4 transition-all", res.status === 'completed' || res.status === 'cancelled' ? "bg-surface opacity-80 border-outline-variant/50" : "bg-surface-container/80 border-primary-container/50 shadow-[0_5px_20px_-5px_rgba(0,255,255,0.15)]")}>
                <div className="flex justify-between items-start">
                  <div className="flex gap-3 items-center">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border", styles.bg, styles.color, styles.border)}>
                      <Wrench className="w-5 h-5 drop-shadow-[0_0_5px_currentColor]" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-sm font-bold text-on-surface">{res.type === 'request' ? res.serviceType : res.serviceTitle}</h3>
                      <p className="text-xs text-on-surface-variant font-medium">{res.type === 'request' ? 'Solicitud General' : res.proName}</p>
                    </div>
                  </div>
                  <div className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold border shadow-[0_0_10px_currentColor]", styles.bg, styles.color, styles.border)}>
                    {styles.text}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-outline-variant/50">
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <Calendar className="w-4 h-4 text-primary-container drop-shadow-[0_0_5px_rgba(0,255,255,0.5)]" />
                    <span className="text-xs font-medium truncate">{res.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <MapPin className="w-4 h-4 text-primary-container drop-shadow-[0_0_5px_rgba(0,255,255,0.5)]" />
                    <span className="text-xs font-medium truncate">{res.location}</span>
                  </div>
                </div>
                <div className="flex gap-3 mt-2">
                  {res.status === 'active' || res.status === 'accepted' ? (
                    <>
                      {res.type !== 'request' && (
                        <button
                          onClick={() => handleGoToChat(res.proId)}
                          className="w-12 h-12 flex items-center justify-center rounded-xl bg-surface border border-outline-variant text-primary-container hover:border-primary-container hover:shadow-[0_0_15px_rgba(0,255,255,0.3)] transition-all shrink-0"
                        >
                          <MessageSquare className="w-5 h-5" />
                        </button>
                      )}
                      <button onClick={() => navigate('/tracking')} className="flex-1 bg-primary-container text-surface-lowest text-xs font-bold py-2.5 rounded-lg hover:bg-on-surface hover:shadow-[0_0_20px_rgba(0,255,255,0.7)] transition-all shadow-[0_0_15px_rgba(0,255,255,0.4)] border border-primary-container">
                        Ver Seguimiento
                      </button>
                    </>
                  ) : res.status === 'completed' && !isReviewed && res.type !== 'request' ? (
                    <>
                      <button onClick={() => handleViewDetails(res)} className="flex-1 bg-surface border border-outline-variant text-on-surface text-xs font-bold py-2.5 rounded-lg hover:border-primary-container hover:text-primary-container hover:shadow-[0_0_15px_rgba(0,255,255,0.3)] transition-all">
                        Ver Detalles
                      </button>
                      <button onClick={() => handleOpenReview(res)} className="flex-1 bg-gradient-to-r from-[#00FFFF] to-[#B026FF] text-surface-lowest text-xs font-bold py-2.5 rounded-lg shadow-[0_0_15px_rgba(0,255,255,0.4)] transition-all">
                        Dejar Reseña
                      </button>
                    </>
                  ) : (
                    <button onClick={() => handleViewDetails(res)} className="flex-1 bg-surface border border-outline-variant text-on-surface text-xs font-bold py-2.5 rounded-lg hover:border-primary-container hover:text-primary-container hover:shadow-[0_0_15px_rgba(0,255,255,0.3)] transition-all">
                      Ver Detalles
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedResForReview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-lowest/80 backdrop-blur-sm">
          <div className="bg-surface-container border border-primary-container/30 rounded-3xl p-6 w-full max-w-md shadow-[0_0_30px_rgba(0,255,255,0.15)] relative">
            <button
              onClick={() => setShowReviewModal(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary-container transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-xl font-bold text-on-surface mb-2">Califica el servicio</h2>
            <p className="text-sm text-on-surface-variant mb-6">¿Qué te pareció el trabajo de {selectedResForReview.proName}?</p>

            <div className="space-y-4 mb-6">
              {[
                { label: 'Calidad General', state: rating, setState: setRating },
                { label: 'Puntualidad', state: punctuality, setState: setPunctuality },
                { label: 'Profesionalismo', state: professionalism, setState: setProfessionalism },
                { label: 'Comunicación', state: communication, setState: setCommunication },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-on-surface">{item.label}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => item.setState(star)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star className={cn("w-6 h-6", item.state >= star ? "text-[#FFD700] fill-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]" : "text-outline-variant")} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-on-surface mb-2">Comentario</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Describe tu experiencia..."
                className="w-full bg-surface border border-outline-variant rounded-xl p-3 text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-all resize-none h-24"
              ></textarea>
            </div>

            <button
              onClick={handleSubmitReview}
              disabled={isSubmittingReview || !comment.trim()}
              className="w-full bg-primary-container text-surface-lowest font-bold py-3.5 rounded-xl shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:shadow-[0_0_20px_rgba(0,255,255,0.5)] transition-all disabled:opacity-50"
            >
              {isSubmittingReview ? 'Enviando...' : 'Enviar Reseña'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
