import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { Phone, PhoneOff, Send, X, Mic, MicOff, Volume2, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface ChatOverlayProps {
  orderId: string;
  recipientId: string;
  recipientName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ChatOverlay({ orderId, recipientId, recipientName, isOpen, onClose }: ChatOverlayProps) {
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState<any[]>([]);
  const { socket } = useSocket();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket || !isOpen) return;

    socket.emit('join-room', orderId);

    const handleMessage = (data: any) => {
      if (data.room === orderId) {
        setChatLog((prev) => [...prev, data]);
      }
    };

    socket.on('receive-message', handleMessage);

    return () => {
      socket.off('receive-message', handleMessage);
    };
  }, [socket, orderId, isOpen]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatLog]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !socket || !user) return;

    const msgData = {
      room: orderId,
      author: user.uid,
      authorName: user.displayName || 'Usuario',
      text: message,
      time: new Date().toISOString(),
      recipientId: recipientId // Added for Push fallback
    };

    socket.emit('send-message', msgData);
    setChatLog((prev) => [...prev, msgData]);
    setMessage('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
           initial={{ y: '100%' }}
           animate={{ y: 0 }}
           exit={{ y: '100%' }}
           transition={{ type: 'spring', damping: 25, stiffness: 200 }}
           className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex flex-col justify-end"
        >
          <div className="bg-[#121212] rounded-t-[32px] h-[80vh] flex flex-col border-t border-white/10">
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00FFFF] to-[#B026FF] p-0.5">
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-white font-bold text-sm">
                    {recipientName.charAt(0)}
                  </div>
                </div>
                <div>
                  <h3 className="text-white font-bold leading-tight">{recipientName}</h3>
                  <p className="text-[#00FFFF] text-[10px] font-black uppercase tracking-widest">Chat en tiempo real</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar">
              {chatLog.map((msg, i) => (
                <div key={i} className={cn(
                  "flex flex-col gap-1 max-w-[80%]",
                  msg.author === user?.uid ? "ml-auto items-end" : "items-start"
                )}>
                  <div className={cn(
                    "px-5 py-3.5 rounded-2xl text-3xl font-medium",
                    msg.author === user?.uid
                      ? "bg-[#00FFFF] text-black rounded-tr-none"
                      : "bg-white/10 text-white rounded-tl-none border border-white/5"
                  )}>
                    {msg.text}
                  </div>
                  <span className="text-sm text-white/30 font-bold uppercase tracking-tighter">
                    {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {chatLog.length === 0 && (
                <div className="h-full flex items-center justify-center text-center opacity-20 px-8">
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-white italic">
                    Inicia la conversación para coordinar el servicio
                  </p>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-6 pt-2 bg-[#0a0a0a] border-t border-white/5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
               <div className="relative group">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="w-full bg-white/5 border border-white/10 rounded-full py-5 pl-8 pr-16 text-3xl text-white focus:outline-none focus:border-[#00FFFF]/50 transition-all font-medium"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#00FFFF] text-black flex items-center justify-center shadow-[0_0_15px_rgba(0,255,255,0.4)] transition-transform active:scale-95"
                  >
                    <Send className="w-5 h-5 ml-0.5" />
                  </button>
               </div>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface CallUIProps {
  recipientId: string;
  recipientName: string;
  isIncoming?: boolean;
  isOpen: boolean;
  onClose: () => void;
  offer?: any;
}

export function CallUI({ recipientId, recipientName, isIncoming, isOpen, onClose, offer: incomingOffer }: CallUIProps) {
  const [status, setStatus] = useState<'calling' | 'ringing' | 'connected' | 'ended'>('calling');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { socket } = useSocket();
  const { user } = useAuth();
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);

  useEffect(() => {
    let timer: any;
    if (status === 'connected') {
      timer = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [status]);

  const setupWebRTC = async () => {
    try {
      setError(null);
      localStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      peerConnection.current = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      localStream.current.getTracks().forEach(track => {
        peerConnection.current?.addTrack(track, localStream.current!);
      });

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('ice-candidate', { candidate: event.candidate, to: recipientId });
        }
      };

      peerConnection.current.ontrack = (event) => {
        const remoteAudio = new Audio();
        remoteAudio.srcObject = event.streams[0];
        remoteAudio.play();
      };
    } catch (err: any) {
      console.error("WebRTC Setup Error:", err);
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission')) {
        setError('Acceso al micrófono denegado. Por favor, actívalo para llamar.');
      } else {
        setError('Ocurrió un error al configurar la llamada.');
      }
      setStatus('ended');
    }
  };

  const startCall = async () => {
    if (!socket || !user) return;
    setStatus('calling');
    await setupWebRTC();

    if (peerConnection.current) {
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      socket.emit('call-user', {
        offer,
        to: recipientId,
        fromId: user.uid,
        fromName: user.displayName || 'Usuario PinPro'
      });
    }
  };

  const answerCall = async () => {
    if (!socket || !incomingOffer) return;
    setStatus('connected');
    await setupWebRTC();

    if (peerConnection.current) {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(incomingOffer));
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socket.emit('answer-call', { answer, to: recipientId });
    }
  };

  useEffect(() => {
    if (!isOpen || !socket) return;

    if (isIncoming) {
      setStatus('ringing');
    } else {
      startCall();
    }

    const handleAnswer = async (data: any) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        setStatus('connected');
      }
    };

    const handleIceCandidate = async (data: any) => {
      if (peerConnection.current) {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    };

    socket.on('call-answered', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);

    return () => {
      socket.off('call-answered', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      localStream.current?.getTracks().forEach(t => t.stop());
      peerConnection.current?.close();
    };
  }, [isOpen, socket, isIncoming, recipientId]);

  const formatDuration = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[3000] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-between p-12 overflow-hidden"
      >
        {/* Animated Background Rings */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-[#00FFFF]/10 rounded-full animate-ping"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-[#B026FF]/5 rounded-full animate-[ping_3s_infinite]"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-6 mt-12">
          <motion.div
            animate={status === 'connected' ? {} : { scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-32 h-32 rounded-full p-1 bg-gradient-to-br from-[#00FFFF] to-[#B026FF] shadow-[0_0_50px_rgba(0,255,255,0.3)]"
          >
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden border-2 border-black">
              <span className="text-4xl font-black text-white">{recipientName.charAt(0)}</span>
            </div>
          </motion.div>

          <div className="text-center">
            <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">{recipientName}</h2>
            <div className="flex items-center justify-center gap-2">
                {error ? (
                  <p className="text-red-500 text-xs font-black uppercase tracking-widest animate-pulse">
                    {error}
                  </p>
                ) : (
                  <>
                    <div className={cn(
                        "w-2 h-2 rounded-full",
                        status === 'connected' ? "bg-green-500 animate-pulse" : "bg-[#00FFFF]"
                    )}></div>
                    <p className="text-[#00FFFF] text-xs font-black uppercase tracking-[0.3em]">
                        {status === 'calling' ? 'Llamando...' :
                         status === 'ringing' ? 'Llamada Entrante' :
                         status === 'connected' ? `Conectado ${formatDuration(duration)}` : 'Finalizando...'}
                    </p>
                  </>
                )}
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-12 mb-12 w-full max-w-xs">
          {error ? (
            <button
              onClick={isIncoming ? answerCall : startCall}
              className="px-8 py-4 bg-[#00FFFF] text-black font-black uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(0,255,255,0.4)] active:scale-95 transition-all"
            >
              Reintentar
            </button>
          ) : status === 'ringing' ? (
            <div className="flex gap-12 w-full justify-center">
              <button
                onClick={onClose}
                className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white shadow-[0_0_30px_rgba(239,68,68,0.5)] active:scale-90 transition-all"
              >
                <X className="w-8 h-8" />
              </button>
              <button
                onClick={answerCall}
                className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white shadow-[0_0_30px_rgba(34,197,94,0.5)] active:scale-90 transition-all animate-bounce"
              >
                <Phone className="w-8 h-8" />
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-8 w-full">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={cn(
                    "flex flex-col items-center gap-2 group",
                    isMuted ? "text-[#00FFFF]" : "text-white/40"
                  )}
                >
                  <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-all group-hover:bg-white/10">
                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">{isMuted ? 'Silenciado' : 'Silenciar'}</span>
                </button>

                <div className="flex flex-col items-center gap-2 text-white/40">
                  <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <Volume2 className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Altavoz</span>
                </div>

                <div className="flex flex-col items-center gap-2 text-white/40 opacity-30">
                  <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <Phone className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Añadir</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center text-white shadow-[0_0_40px_rgba(239,68,68,0.4)] active:scale-90 transition-all hover:bg-red-400 group"
              >
                <PhoneOff className="w-8 h-8 group-hover:rotate-12 transition-transform" />
              </button>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
