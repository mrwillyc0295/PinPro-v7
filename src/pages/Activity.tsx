import { ArrowLeft, Clock, Calendar, MapPin, Wrench, Sparkles, Globe, Briefcase, CheckCircle2, Loader2, MessageSquare, ChevronRight, Eye, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import DOMPurify from 'dompurify';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { notificationService, NotificationType } from '../services/notificationService';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { cacheService } from '../services/cacheService';

import { AnimatedBackButton } from '../components/AnimatedBackButton';

export default function Activity() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const isPro = profile?.role === 'Profesional';
  const [activities, setActivities] = useState<any[]>([]);
  const [availableRequests, setAvailableRequests] = useState<any[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-jobs' | 'available'>('my-jobs');
  const [isAccepting, setIsAccepting] = useState<string | null>(null);
  const [viewingRequest, setViewingRequest] = useState<any | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<{ id: string, status: string } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!loading && profile && profile.role !== 'Profesional') {
      navigate('/home');
    }
  }, [profile?.role, loading, navigate]);

  // Listen to professional's reservations
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'reservations'),
      where('proId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const actData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      actData.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });

      setActivities(actData);
      cacheService.setItem('activities', actData); // Cache
      setIsLoadingActivities(false);
    }, (error) => {
      console.error("Error fetching activities:", error);
      const cached = cacheService.getItem('activities'); // Offline access
      if(cached) setActivities(cached);
      setIsLoadingActivities(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Listen to available public requests
  useEffect(() => {
    if (!user || activeTab !== 'available') return;

    const q = query(
      collection(db, 'requests'),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reqData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      reqData.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });

      setAvailableRequests(reqData);
      setIsLoadingRequests(false);
    }, (error) => {
      console.error("Error fetching available requests:", error);
      setIsLoadingRequests(false);
    });

    return () => unsubscribe();
  }, [user, activeTab]);

  const handleAcceptRequest = async (request: any) => {
    if (!user || !profile) return;

    const confirmAccept = window.confirm(`¿Deseas aceptar esta solicitud de ${request.clientName}?`);
    if (!confirmAccept) return;

    setIsAccepting(request.id);
    try {
      // 1. Update request status
      await updateDoc(doc(db, 'requests', request.id), {
        status: 'accepted',
        acceptedBy: user.uid,
        acceptedByName: profile.name
      });

      // 2. Create reservation
      await addDoc(collection(db, 'reservations'), {
        clientId: request.clientId,
        clientName: request.clientName,
        proId: user.uid,
        proName: profile.name || 'Profesional',
        proProfession: profile.profession || 'Profesional',
        serviceTitle: request.serviceType,
        servicePrice: 'A convenir',
        date: request.date || 'Hoy',
        location: request.location || 'Ubicación no especificada',
        status: 'active',
        createdAt: serverTimestamp(),
        requestId: request.id
      });

      // 3. Create or find chat
      const chatQuery = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', user.uid)
      );
      const chatSnap = await getDocs(chatQuery);
      let existingChatId = null;

      chatSnap.forEach(chatDoc => {
        const data = chatDoc.data();
        if (data.participants.includes(request.clientId)) {
          existingChatId = chatDoc.id;
        }
      });

      if (!existingChatId) {
        const newChatRef = await addDoc(collection(db, 'chats'), {
          participants: [user.uid, request.clientId],
          participantNames: {
            [user.uid]: profile.name || 'Profesional',
            [request.clientId]: request.clientName || 'Cliente'
          },
          lastMessage: '¡Hola! He aceptado tu solicitud. ¿Cómo puedo ayudarte?',
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          unreadCount: {
            [request.clientId]: 1,
            [user.uid]: 0
          }
        });

        await addDoc(collection(db, 'messages'), {
          chatId: newChatRef.id,
          senderId: user.uid,
          text: '¡Hola! He aceptado tu solicitud. ¿Cómo puedo ayudarte?',
          createdAt: serverTimestamp()
        });
      }

      alert("¡Solicitud aceptada! Ahora puedes contactar al cliente.");
      setActiveTab('my-jobs');
    } catch (error) {
      console.error("Error accepting request:", error);
      handleFirestoreError(error, OperationType.UPDATE, `requests/${request.id}`);
      alert("Hubo un error al aceptar la solicitud.");
    } finally {
      setIsAccepting(null);
      setViewingRequest(null);
    }
  };

  const handleGoToChat = async (clientId: string) => {
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
        if (data.participants.includes(clientId)) {
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

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'reservations', id), {
        status: newStatus
      });

      // If completed, we could also update the original request if it exists
      const resDoc = activities.find(a => a.id === id);

      // Notify the client
      if (resDoc && resDoc.clientId) {
        let title = '';
        let message = '';
        let type: NotificationType = 'system';

        switch (newStatus) {
          case 'active':
            title = 'Trabajo en Progreso';
            message = `${profile?.name} ha comenzado el servicio de ${resDoc.serviceTitle || 'Servicio'}.`;
            type = 'booking_started';
            break;
          case 'completed':
            title = 'Servicio Completado';
            message = `${profile?.name} ha finalizado el servicio. ¡No olvides dejar una reseña!`;
            type = 'booking_completed';
            break;
          case 'cancelled':
            title = 'Servicio Cancelado';
            message = `${profile?.name} ha cancelado el servicio.`;
            type = 'booking_cancelled';
            break;
        }

        if (title) {
          await notificationService.create({
            userId: resDoc.clientId,
            type,
            title,
            message,
            relatedId: id
          });
        }
      }

      if (newStatus === 'completed') {
        if (resDoc?.requestId) {
          await updateDoc(doc(db, 'requests', resDoc.requestId), {
            status: 'completed'
          });
        }

        // Grant Airdrop Reward: +100 $PIN
        if (user && profile) {
          const rewardAmount = 100;
          const currentTokenBalance = (profile as any).tokenBalance || 0;

          await updateDoc(doc(db, 'profesionales', user.uid), {
            tokenBalance: currentTokenBalance + rewardAmount
          });

          // Add to transactions history
          await addDoc(collection(db, 'token_transactions'), {
            userId: user.uid,
            amount: rewardAmount,
            description: `Bono por Servicio completado: ${resDoc?.serviceTitle || 'Servicio'}`,
            type: 'reward',
            createdAt: serverTimestamp()
          });
        }

        alert(`¡Trabajo completado! Se ha registrado un ingreso de ${resDoc?.servicePrice || '$0'} en tu billetera y has ganado +100 $PIN.`);
      } else {
        alert(`Estado actualizado a: ${newStatus === 'active' ? 'En progreso' : 'Cancelado'}`);
      }
      setUpdatingStatus(null);
    } catch (error) {
      console.error("Error updating status:", error);
      handleFirestoreError(error, OperationType.UPDATE, `reservations/${id}`);
      alert("Error al actualizar el estado.");
    } finally {
      setIsUpdating(false);
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
      {/* Header */}
      <div className="sticky top-0 z-20 bg-surface-lowest/90 backdrop-blur-xl border-b border-primary-container/20 shadow-[0_4px_20px_-10px_rgba(0,255,255,0.3)] px-5 py-4 pt-12 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12"></div>
          <h1 className="text-lg font-bold text-on-surface tracking-wide drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">Panel de Trabajo</h1>
          <div className="w-10 h-10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary-container drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-surface-container/50 p-1 rounded-xl border border-outline-variant/30">
          <button
            onClick={() => setActiveTab('my-jobs')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all",
              activeTab === 'my-jobs'
                ? "bg-primary-container text-surface-lowest shadow-[0_0_15px_rgba(0,255,255,0.3)]"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <Briefcase className="w-4 h-4" />
            Mis Trabajos
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all",
              activeTab === 'available'
                ? "bg-primary-container text-surface-lowest shadow-[0_0_15px_rgba(0,255,255,0.3)]"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <Globe className="w-4 h-4" />
            Disponibles
            {availableRequests.length > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#00FF00] text-[10px] text-black font-bold animate-pulse shadow-[0_0_8px_rgba(0,255,0,0.6)]">
                {availableRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col gap-4">
        {activeTab === 'my-jobs' ? (
          isLoadingActivities ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Loader2 className="w-8 h-8 text-primary-container animate-spin shadow-[0_0_15px_rgba(0,255,255,0.5)] rounded-full" />
              <div className="text-on-surface-variant text-sm font-medium">Cargando trabajos...</div>
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-surface-highest flex items-center justify-center border border-outline-variant/50">
                <Wrench className="w-8 h-8 text-on-surface-variant" />
              </div>
              <div>
                <h3 className="text-on-surface font-bold text-lg">No tienes trabajos</h3>
                <p className="text-on-surface-variant text-sm mt-1">Acepta una solicitud disponible para empezar.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {activities.map((activity) => {
                const styles = getStatusStyles(activity.status);
                return (
                  <div
                    key={activity.id}
                    className={cn(
                      "relative p-5 rounded-2xl border transition-all duration-300 flex flex-col gap-4",
                      activity.status === 'completed' || activity.status === 'cancelled'
                        ? "bg-surface border-outline-variant opacity-80"
                        : "bg-surface-container/80 backdrop-blur-md border-primary-container/50 shadow-[0_5px_20px_-5px_rgba(0,255,255,0.15)] hover:shadow-[0_5px_25px_-5px_rgba(0,255,255,0.3)]"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3 items-center">
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border", styles.bg, styles.color, styles.border)}>
                          <Wrench className="w-5 h-5 drop-shadow-[0_0_5px_currentColor]" />
                        </div>
                        <div className="flex flex-col">
                          <h3 className="text-sm font-bold text-on-surface">{activity.serviceTitle}</h3>
                          <p className="text-xs text-on-surface-variant font-medium">Cliente: {activity.clientName}</p>
                        </div>
                      </div>
                      <div className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold border shadow-[0_0_10px_currentColor]", styles.bg, styles.color, styles.border)}>
                        {styles.text}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-outline-variant/50">
                      <div className="flex items-center gap-2 text-on-surface-variant">
                        <Calendar className="w-4 h-4 text-primary-container drop-shadow-[0_0_5px_rgba(0,255,255,0.5)]" />
                        <span className="text-xs font-medium truncate">{activity.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-on-surface-variant">
                        <MapPin className="w-4 h-4 text-primary-container drop-shadow-[0_0_5px_rgba(0,255,255,0.5)]" />
                        <span className="text-xs font-medium truncate">{activity.location}</span>
                      </div>
                    </div>

                    {activity.status !== 'completed' && activity.status !== 'cancelled' && (
                      <div className="flex gap-3 mt-2">
                        <button
                          onClick={() => handleGoToChat(activity.clientId)}
                          className="w-12 h-12 flex items-center justify-center rounded-xl bg-surface border border-outline-variant text-primary-container hover:border-primary-container hover:shadow-[0_0_15px_rgba(0,255,255,0.3)] transition-all shrink-0"
                        >
                          <MessageSquare className="w-5 h-5" />
                        </button>

                        {activity.status === 'active' ? (
                          <>
                            <button
                              onClick={() => setUpdatingStatus({ id: activity.id, status: activity.status })}
                              className="flex-1 bg-surface border border-outline-variant text-on-surface text-xs font-bold py-2.5 rounded-lg hover:border-primary-container hover:text-primary-container hover:shadow-[0_0_15px_rgba(0,255,255,0.3)] transition-all"
                            >
                              Gestionar
                            </button>
                            <button onClick={() => navigate('/tracking')} className="flex-1 bg-primary-container text-surface-lowest text-xs font-bold py-2.5 rounded-lg hover:bg-on-surface hover:shadow-[0_0_20px_rgba(0,255,255,0.7)] transition-all shadow-[0_0_15px_rgba(0,255,255,0.4)] border border-primary-container">
                              Seguimiento
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setUpdatingStatus({ id: activity.id, status: activity.status })}
                              className="flex-1 bg-surface border border-outline-variant text-on-surface text-xs font-bold py-2.5 rounded-lg hover:border-primary-container hover:text-primary-container hover:shadow-[0_0_15px_rgba(0,255,255,0.3)] transition-all"
                            >
                              Gestionar
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(activity.id, 'active')}
                              className="flex-1 bg-primary-container text-surface-lowest text-xs font-bold py-2.5 rounded-lg hover:bg-on-surface hover:shadow-[0_0_20px_rgba(0,255,255,0.7)] transition-all shadow-[0_0_15px_rgba(0,255,255,0.4)] border border-primary-container"
                            >
                              Iniciar Trabajo
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Available Requests Tab */
          isLoadingRequests ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Loader2 className="w-8 h-8 text-primary-container animate-spin shadow-[0_0_15px_rgba(0,255,255,0.5)] rounded-full" />
              <div className="text-on-surface-variant text-sm font-medium">Buscando solicitudes...</div>
            </div>
          ) : availableRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-surface-highest flex items-center justify-center border border-outline-variant/50">
                <Globe className="w-8 h-8 text-on-surface-variant" />
              </div>
              <div>
                <h3 className="text-on-surface font-bold text-lg">No hay solicitudes</h3>
                <p className="text-on-surface-variant text-sm mt-1">Vuelve más tarde para ver nuevas oportunidades.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {availableRequests.map((request) => (
                <div
                  key={request.id}
                  className="relative p-5 rounded-2xl border bg-surface-container/80 backdrop-blur-md border-outline-variant/30 shadow-sm hover:border-primary-container/50 transition-all duration-300 flex flex-col gap-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center border border-primary-container/30 text-primary-container">
                        <Sparkles className="w-5 h-5 drop-shadow-[0_0_5px_currentColor]" />
                      </div>
                      <div className="flex flex-col">
                        <h3 className="text-xl font-bold text-on-surface">{request.serviceType}</h3>
                        <p className="text-sm text-on-surface-variant font-medium">Publicado por: {request.clientName}</p>
                      </div>
                    </div>
                    <div className="px-2.5 py-1 rounded-md text-[10px] font-bold border bg-primary-container/5 text-primary-container border-primary-container/30">
                      NUEVA
                    </div>
                  </div>

                  <p className="text-lg text-on-surface-variant line-clamp-2 italic leading-relaxed">
                    "{request.description ? DOMPurify.sanitize(request.description, { ALLOWED_TAGS: [] }) : ''}"
                  </p>

                  {request.photos && request.photos.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                      {request.photos.slice(0, 3).map((photo: string, i: number) => (
                        <div key={i} className="w-16 h-16 rounded-xl border border-outline-variant/30 overflow-hidden shrink-0">
                          <img src={photo} alt="Request" loading="lazy" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      ))}
                      {request.photos.length > 3 && (
                        <div className="w-16 h-16 rounded-xl bg-surface-highest flex items-center justify-center text-[10px] font-bold text-on-surface-variant shrink-0 border border-outline-variant/30">
                          +{request.photos.length - 3}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-outline-variant/50">
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <Calendar className="w-4 h-4 text-primary-container" />
                      <span className="text-xs font-medium truncate">{request.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <MapPin className="w-4 h-4 text-primary-container" />
                      <span className="text-xs font-medium truncate">{request.location}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setViewingRequest(request)}
                    className="w-full bg-primary-container text-surface-lowest text-xs font-black py-3 rounded-xl hover:bg-on-surface hover:shadow-[0_0_20px_rgba(0,255,255,0.7)] transition-all shadow-[0_0_15px_rgba(0,255,255,0.4)] border border-primary-container flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    VER DETALLES Y ACEPTAR
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Request Detail Modal */}
      {viewingRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-lowest/80 backdrop-blur-sm">
          <div className="bg-surface-container border border-primary-container/30 rounded-3xl p-6 w-full max-w-md shadow-[0_0_30px_rgba(0,255,255,0.15)] relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setViewingRequest(null)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary-container transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary-container/10 flex items-center justify-center border border-primary-container/30 text-primary-container">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-on-surface">{viewingRequest.serviceType}</h2>
                <p className="text-xs text-on-surface-variant">Publicado por {viewingRequest.clientName}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-primary-container uppercase tracking-widest mb-2">Descripción</h3>
                <p className="text-xl text-on-surface leading-relaxed">
                  {viewingRequest.description ? DOMPurify.sanitize(viewingRequest.description, { ALLOWED_TAGS: [] }) : ''}
                </p>
              </div>

              {viewingRequest.photos && viewingRequest.photos.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-primary-container uppercase tracking-widest mb-3">Fotos</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {viewingRequest.photos.map((photo: string, i: number) => (
                      <div key={i} className="aspect-square rounded-xl border border-outline-variant/30 overflow-hidden">
                        <img src={photo} alt="Request" loading="lazy" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 py-4 border-y border-outline-variant/20">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase">Fecha</span>
                  <div className="flex items-center gap-2 text-on-surface text-sm font-medium">
                    <Calendar className="w-4 h-4 text-primary-container" />
                    {viewingRequest.date}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase">Ubicación</span>
                  <div className="flex items-center gap-2 text-on-surface text-sm font-medium">
                    <MapPin className="w-4 h-4 text-primary-container" />
                    {viewingRequest.location}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleAcceptRequest(viewingRequest)}
                disabled={isAccepting === viewingRequest.id}
                className="w-full bg-primary-container text-surface-lowest font-black py-4 rounded-2xl shadow-[0_0_20px_rgba(0,255,255,0.4)] hover:shadow-[0_0_30px_rgba(0,255,255,0.6)] transition-all flex items-center justify-center gap-2"
              >
                {isAccepting === viewingRequest.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                {isAccepting === viewingRequest.id ? 'ACEPTANDO...' : 'ACEPTAR ESTE TRABAJO'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Status Update Modal */}
      {updatingStatus && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-lowest/80 backdrop-blur-sm">
          <div className="bg-surface-container border border-primary-container/30 rounded-3xl p-6 w-full max-w-sm shadow-[0_0_30px_rgba(0,255,255,0.15)] relative">
            <button
              onClick={() => setUpdatingStatus(null)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary-container transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-xl font-bold text-on-surface mb-2">Gestionar Trabajo</h2>
            <p className="text-sm text-on-surface-variant mb-6">Actualiza el estado actual de este servicio.</p>

            <div className="flex flex-col gap-3">
              {updatingStatus.status !== 'active' && (
                <button
                  onClick={() => handleUpdateStatus(updatingStatus.id, 'active')}
                  disabled={isUpdating}
                  className="w-full bg-primary-container/10 text-primary-container font-bold py-4 rounded-xl border border-primary-container/30 hover:bg-primary-container/20 transition-all flex items-center justify-center gap-2"
                >
                  <Clock className="w-5 h-5" />
                  MARCAR COMO "EN PROGRESO"
                </button>
              )}

              <button
                onClick={() => handleUpdateStatus(updatingStatus.id, 'completed')}
                disabled={isUpdating}
                className="w-full bg-[#00FF00]/10 text-[#00FF00] font-bold py-4 rounded-xl border border-[#00FF00]/30 hover:bg-[#00FF00]/20 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                MARCAR COMO "COMPLETADO"
              </button>

              <button
                onClick={() => handleUpdateStatus(updatingStatus.id, 'cancelled')}
                disabled={isUpdating}
                className="w-full bg-error/10 text-error font-bold py-4 rounded-xl border border-error/30 hover:bg-error/20 transition-all flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                CANCELAR TRABAJO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
