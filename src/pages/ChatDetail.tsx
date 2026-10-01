import { Helmet } from 'react-helmet-async';
import { ArrowLeft, MoreVertical, Phone, Languages, CheckCheck, Camera, Image as ImageIcon, Send, X, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc, orderBy, increment, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import DOMPurify from 'dompurify';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { AlertCircle, RefreshCcw, Loader2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  text: string;
  imageUrl?: string;
  senderId: string;
  time: string;
  createdAt: number;
}

import { AnimatedBackButton } from '../components/AnimatedBackButton';

export default function ChatDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, profile } = useAuth();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatData, setChatData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [loadingChat, setLoadingChat] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Refs to correctly handle incoming push notifications without resubscribing
  const initialLoadRef = useRef(true);
  const chatDataRef = useRef<any>(null);

  useEffect(() => {
    chatDataRef.current = chatData;
  }, [chatData]);

  // Request Notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChatDetails = async () => {
    if (!id || !user) return;
    setLoadingChat(true);
    setError(null);
    try {
      const chatDocRef = doc(db, 'chats', id);
      const chatDoc = await getDoc(chatDocRef);
      if (chatDoc.exists()) {
        const data = chatDoc.data();
        const otherParticipantId = data.participants.find((p: string) => p !== user.uid);
        const otherParticipantName = data.participantNames?.[otherParticipantId] || 'Usuario';
        setChatData({
          id: chatDoc.id,
          name: otherParticipantName,
          role: 'Usuario', // Could fetch actual role if needed
          online: true,
          participants: data.participants
        });

        // Reset unread count for current user
        await updateDoc(chatDocRef, {
          [`unreadCount.${user.uid}`]: 0
        });
      } else {
        setError("La conversación no existe.");
      }
    } catch (err) {
      setError("No se pudo cargar la información del chat.");
      handleFirestoreError(err, OperationType.GET, `chats/${id}`);
    } finally {
      setLoadingChat(false);
    }
  };

  useEffect(() => {
    fetchChatDetails();

    if (!id || !user) return;

    // Listen for messages
    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', id),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Check for specifically incoming new messages if not first load
      if (!initialLoadRef.current) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            // If the message is from another user
            if (data.senderId !== user.uid) {
              const senderName = chatDataRef.current?.name || 'Usuario';
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(`Nuevo mensaje de ${senderName}`, {
                  body: data.text,
                  icon: '/icon-192x192.png' // Assuming you have standard PWA icons
                });
              }
            }
          }
        });
      } else {
        initialLoadRef.current = false;
      }

      const msgs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          text: data.text,
          imageUrl: data.imageUrl,
          senderId: data.senderId,
          time: data.createdAt ? new Date(data.createdAt.toMillis()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '',
          createdAt: data.createdAt?.toMillis() || 0
        };
      });
      setMessages(msgs);
    }, (err) => {
      setError("Error al recibir mensajes en tiempo real.");
      try {
        handleFirestoreError(err, OperationType.LIST, 'messages');
      } catch (e) {
        console.error("Firestore error handled in ChatDetail:", e);
      }
    });

    return () => unsubscribe();
  }, [id, user]);

  const handleSendMessage = async (e?: React.FormEvent, imageUrl?: string) => {
    e?.preventDefault();
    if ((!message.trim() && !imageUrl) || !user || !id || !chatData || isSending) return;

    const textToSend = message;
    setMessage('');
    setIsSending(true);
    setError(null);

    try {
      await addDoc(collection(db, 'messages'), {
        chatId: id,
        senderId: user.uid,
        text: textToSend,
        imageUrl: imageUrl || null,
        createdAt: serverTimestamp()
      });

      const otherParticipantId = chatData.participants.find((p: string) => p !== user.uid);

      await updateDoc(doc(db, 'chats', id), {
        lastMessage: imageUrl ? '📷 Foto enviada' : textToSend,
        updatedAt: serverTimestamp(),
        [`unreadCount.${otherParticipantId}`]: increment(1)
      });

      // Notify the other participant
      await notificationService.create({
        userId: otherParticipantId,
        type: 'message_new',
        title: `Nuevo mensaje de ${profile?.name || 'Usuario'}`,
        message: imageUrl ? '📷 Foto enviada' : textToSend,
        relatedId: id
      });
    } catch (err) {
      console.error("Error sending message:", err);
      setError("No se pudo enviar el mensaje. Por favor, intenta de nuevo.");
      if (textToSend) setMessage(textToSend); // Restore message so user can try again
      handleFirestoreError(err, OperationType.CREATE, 'messages');
    } finally {
      setIsSending(false);
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 0.7 quality to keep size small enough for Firestore
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !id) return;

    try {
      setIsUploadingImage(true);
      setError(null);

      const base64Image = await compressImage(file);

      await handleSendMessage(undefined, base64Image);
    } catch (err) {
      console.error("Error uploading image:", String(err));
      setError("Hubo un error al procesar la imagen. Intenta con otra foto.");
    } finally {
      setIsUploadingImage(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!window.confirm('¿Eliminar este mensaje?')) return;
    try {
      await deleteDoc(doc(db, 'messages', messageId));
    } catch (err) {
      console.error("Error deleting message:", err);
      setError("No se pudo eliminar el mensaje.");
      handleFirestoreError(err, OperationType.DELETE, `messages/${messageId}`);
    }
  };

  const deleteChat = async () => {
    if (!id || !window.confirm('¿Estás seguro de que quieres eliminar toda esta conversación permanentemente?')) return;

    try {
      // Delete the chat document
      await deleteDoc(doc(db, 'chats', id));

      // Delete all messages in the chat
      const q = query(collection(db, 'messages'), where('chatId', '==', id));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      navigate('/messages');
    } catch (err) {
      console.error("Error deleting chat:", err);
      setError("No se pudo eliminar la conversación.");
      handleFirestoreError(err, OperationType.DELETE, `chats/${id}`);
    }
  };

  if (loadingChat && !chatData) {
    return <div className="flex h-full items-center justify-center bg-surface-lowest text-on-surface-variant">
      <Loader2 className="w-6 h-6 animate-spin text-primary-container mr-2" />
      Cargando chat...
    </div>;
  }

  if (error && !chatData) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-surface-lowest p-8 text-center">
        <AlertCircle className="w-12 h-12 text-error mb-4" />
        <h3 className="text-lg font-bold text-on-surface mb-2">Error al cargar el chat</h3>
        <p className="text-on-surface-variant mb-6">{error}</p>
        <button
          onClick={() => fetchChatDetails()}
          className="bg-primary-container text-surface-lowest px-6 py-2 rounded-xl font-bold flex items-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-surface-lowest text-on-surface">
      <Helmet>
        <title>Chat con {chatData.name} | PinPro</title>
        <meta name="description" content={`Conversación con ${chatData.name} en PinPro.`} />
      </Helmet>
      {/* TopAppBar */}
      <header className="flex items-center bg-surface-lowest p-4 border-b border-primary-container/10 justify-end sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 ml-2">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-container/40 to-primary-container/10 flex items-center justify-center text-primary-container font-black text-xl border border-primary-container/50 shadow-[0_0_15px_rgba(0,255,255,0.4)] ring-2 ring-primary-container/30">
                <span className="drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]">{chatData.name.charAt(0).toUpperCase()}</span>
              </div>
              {chatData.online && (
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#00FF00] border-2 border-surface-lowest rounded-full shadow-[0_0_8px_#00FF00]"></div>
              )}
            </div>
            <div>
              <h2 className="text-on-surface text-base font-bold leading-tight">{chatData.name}</h2>
              <p className="text-primary-container text-xs font-medium">{chatData.role}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex w-12 h-12 items-center justify-center rounded-full bg-transparent text-on-surface hover:bg-primary-container/10 transition-colors">
            <Phone className="w-6 h-6" />
          </button>
          <button
            onClick={deleteChat}
            className="flex w-12 h-12 items-center justify-center rounded-full bg-transparent text-red-500 hover:bg-red-500/10 transition-colors"
            title="Eliminar conversación"
          >
            <Trash2 className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="px-4 py-3 bg-surface-lowest border-b border-primary-container/10">
          <div className="p-3 bg-error/10 border border-error/20 rounded-xl flex items-center gap-3 text-error text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <div className="flex-1 font-medium">{error}</div>
            <button
              onClick={() => setError(null)}
              className="p-1 hover:bg-error/10 rounded-full transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6 hide-scrollbar">
        {messages.map((msg) => (
          msg.senderId !== user?.uid ? (
            <div key={msg.id} className="flex items-end gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-container font-bold text-sm shrink-0 border border-primary-container/30">
                {chatData.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col gap-1.5 items-start group">
                <div className="flex items-center gap-2">
                  <div className="rounded-2xl rounded-bl-none overflow-hidden bg-secondary text-on-surface shadow-[0_0_15px_rgba(176,38,255,0.2)]">
                    {msg.imageUrl && (
                      <img src={msg.imageUrl} loading="lazy" alt="Mensaje" className="max-w-full h-auto max-h-64 object-cover" />
                    )}
                    {msg.text && (
                      <p className="text-xl font-medium leading-relaxed px-5 py-4 whitespace-pre-wrap break-words">{DOMPurify.sanitize(msg.text)}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteMessage(msg.id)}
                    className="p-2 hover:bg-red-500/10 text-red-500 rounded-full transition-all"
                    title="Eliminar mensaje"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-sm text-on-surface-variant ml-1">{msg.time}</span>
              </div>
            </div>
          ) : (
            <div key={msg.id} className="flex items-end gap-3 justify-end ml-auto max-w-[85%] group">
              <div className="flex flex-col gap-1.5 items-end">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => deleteMessage(msg.id)}
                    className="p-2 hover:bg-red-500/10 text-red-500 rounded-full transition-all"
                    title="Eliminar mensaje"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="rounded-2xl rounded-br-none overflow-hidden bg-primary-container text-surface-lowest shadow-lg shadow-primary-container/10">
                    {msg.imageUrl && (
                      <img src={msg.imageUrl} loading="lazy" alt="Mensaje" className="max-w-full h-auto max-h-64 object-cover" />
                    )}
                    {msg.text && (
                      <p className="text-xl font-medium leading-relaxed px-5 py-4 whitespace-pre-wrap break-words">
                        {DOMPurify.sanitize(msg.text)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 mr-1">
                  <span className="text-sm text-on-surface-variant">{msg.time}</span>
                  <CheckCheck className="w-5 h-5 text-primary-container" />
                </div>
              </div>
            </div>
          )
        ))}

        {messages.length === 0 && (
          <div className="text-center text-on-surface-variant text-sm mt-10">
            Envía un mensaje para iniciar la conversación.
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="p-4 bg-surface-lowest border-t border-primary-container/10 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3 max-w-5xl mx-auto">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingImage}
            className="flex w-12 h-12 shrink-0 items-center justify-center rounded-full text-primary-container bg-primary-container/10 hover:bg-primary-container/20 transition-colors disabled:opacity-50"
          >
            {isUploadingImage ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
          </button>

          <div className="flex-1 relative">
            <input
              className="w-full bg-surface-container border-none rounded-full px-6 py-4 text-xl focus:ring-2 focus:ring-primary-container/50 text-on-surface placeholder-on-surface-variant"
              placeholder="Escribe un mensaje..."
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={(!message.trim() && !isUploadingImage) || isSending || isUploadingImage}
            className="flex w-12 h-12 shrink-0 items-center justify-center rounded-full bg-primary-container text-surface-lowest shadow-lg shadow-primary-container/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSending ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Send className="w-6 h-6 ml-1" />
            )}
          </button>
        </form>
      </footer>
    </div>
  );
}
