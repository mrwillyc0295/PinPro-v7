import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare, Users, User, ShieldAlert, Send, Loader2, CheckCircle, Mail } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { connectGmail, getGmailToken, sendEmailViaGmail } from '../lib/googleAuth';

interface UserData {
  uid: string;
  name: string;
  role: string;
  email: string;
}

export default function AdminCommunications() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [targetAudience, setTargetAudience] = useState<'all' | 'clients' | 'professionals' | 'individual' | 'uids'>('all');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [messageTitle, setMessageTitle] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sendViaEmail, setSendViaEmail] = useState(false);
  const [gmailToken, setGmailToken] = useState<string | null>(null);

  useEffect(() => {
    // Check if token exists in memory
    getGmailToken().then(token => setGmailToken(token));
  }, []);

  const handleConnectGmail = async () => {
    try {
      const token = await connectGmail();
      if (token) setGmailToken(token);
    } catch (error) {
      alert('Error conectando con Gmail: ' + (error as Error).message);
    }
  };

  useEffect(() => {
    if (!user || !isAdmin) return;

    // Handle query params
    const params = new URLSearchParams(location.search);
    const uid = params.get('uid');
    const uids = params.get('uids');

    if (uid) {
      setTargetAudience('individual');
      setSelectedUserId(uid);
    } else if (uids) {
      setTargetAudience('uids');
      setSelectedUserIds(uids.split(','));
    }

    // Fetch all users to allow targeting
    const unsubscribeClientes = onSnapshot(collection(db, 'clientes'), (snapshot) => {
      const clientesData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data(), role: 'Cliente' } as UserData));
      setUsers(prev => {
        const otherUsers = prev.filter(u => u.role !== 'Cliente');
        return [...otherUsers, ...clientesData];
      });
    });

    const unsubscribeProfesionales = onSnapshot(collection(db, 'profesionales'), (snapshot) => {
      const profesionalesData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data(), role: 'Profesional' } as UserData));
      setUsers(prev => {
        const otherUsers = prev.filter(u => u.role !== 'Profesional');
        return [...otherUsers, ...profesionalesData];
      });
    });

    return () => {
      unsubscribeClientes();
      unsubscribeProfesionales();
    };
  }, []);

  const handleSend = async () => {
    if (!messageTitle.trim() || !messageContent.trim()) {
      alert('Por favor, ingresa un título y un mensaje.');
      return;
    }

    if (targetAudience === 'individual' && !selectedUserId) {
      alert('Por favor, selecciona un usuario.');
      return;
    }

    setIsSending(true);
    setSendSuccess(false);

    try {
      let targetUsers: UserData[] = [];

      switch (targetAudience) {
        case 'all':
          targetUsers = users;
          break;
        case 'clients':
          targetUsers = users.filter(u => u.role === 'Cliente');
          break;
        case 'professionals':
          targetUsers = users.filter(u => u.role === 'Profesional');
          break;
        case 'individual':
          const user = users.find(u => u.uid === selectedUserId);
          if (user) targetUsers = [user];
          break;
        case 'uids':
          targetUsers = users.filter(u => selectedUserIds.includes(u.uid));
          break;
      }

      if (targetUsers.length === 0) {
        alert('No hay usuarios que coincidan con el criterio seleccionado.');
        setIsSending(false);
        return;
      }

      if (!window.confirm(`¿Estás seguro de enviar este mensaje a ${targetUsers.length} usuario(s)?`)) {
        setIsSending(false);
        return;
      }

      // Check if we need to send an email, verify token
      let currentToken = gmailToken;
      if (sendViaEmail) {
        if (!currentToken) {
           try {
             currentToken = await connectGmail();
             if (currentToken) setGmailToken(currentToken);
           } catch (e) {
             alert('Es necesario conectarse con Google para enviar el correo.');
             setIsSending(false);
             return;
           }
        }
      }

      // Send to all targets
      for (const targetUser of targetUsers) {
        // App internal notification
        await notificationService.create({
          userId: targetUser.uid,
          type: 'system',
          title: messageTitle,
          message: messageContent
        });

        // Email via Gmail
        if (sendViaEmail && currentToken && targetUser.email) {
          try {
            await sendEmailViaGmail(
              currentToken,
              targetUser.email,
              messageTitle,
              `<div style="font-family: Arial, sans-serif;">
                <p><strong>Actualización de NeoApp:</strong></p>
                <p>${messageContent.replace(/\n/g, '<br/>')}</p>
                <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
                <p style="font-size: 12px; color: #888;">Mensaje del administrador.</p>
              </div>`
            );
          } catch (e) {
             console.error(`AdminCommunications: failed to send email to ${targetUser.email}`, e);
          }
        }
      }

      setSendSuccess(true);
      setMessageTitle('');
      setMessageContent('');
      setTimeout(() => setSendSuccess(false), 3000);

    } catch (error) {
      console.error('Error sending messages:', error);
      alert('Hubo un error al enviar los mensajes.');
    } finally {
      setIsSending(false);
    }
  };

  const filteredIndividualUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-full w-full bg-surface-lowest pb-10">
      {/* Header Admin */}
      <div className="sticky top-0 z-50 flex items-center bg-surface-lowest/90 backdrop-blur-md p-4 pt-16 border-b border-primary-container/20 shadow-[0_4px_20px_rgba(0,255,255,0.05)] justify-end">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
          <h2 className="text-on-surface text-lg font-black tracking-tighter uppercase italic drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]">COMUNICACIÓN</h2>
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto space-y-6 mt-4">

        {/* Main Interface Block */}
        <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Send className="w-32 h-32" />
          </div>

          <h3 className="text-xl font-black text-on-surface mb-6 flex items-center gap-2">
            <Send className="w-5 h-5 text-primary-container" />
            Emisión de Mensajes del Sistema
          </h3>

          <div className="space-y-6">

            {/* Target Selection */}
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                Destinatarios
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => setTargetAudience('all')}
                  className={cn(
                    "p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all",
                    targetAudience === 'all'
                      ? "bg-primary-container/20 border-primary-container text-primary-container shadow-[0_0_15px_rgba(0,255,255,0.2)]"
                      : "bg-surface-lowest border-outline-variant/30 text-on-surface-variant hover:border-primary-container/50 hover:text-on-surface"
                  )}
                >
                  <Users className="w-6 h-6" />
                  <span className="text-xs font-bold">TODOS</span>
                  <span className="text-[10px] opacity-70">({users.length})</span>
                </button>
                <button
                  onClick={() => setTargetAudience('clients')}
                  className={cn(
                    "p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all",
                    targetAudience === 'clients'
                      ? "bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                      : "bg-surface-lowest border-outline-variant/30 text-on-surface-variant hover:border-blue-500/50 hover:text-on-surface"
                  )}
                >
                  <User className="w-6 h-6" />
                  <span className="text-xs font-bold">CLIENTES</span>
                  <span className="text-[10px] opacity-70">({users.filter(u => u.role === 'Cliente').length})</span>
                </button>
                <button
                  onClick={() => setTargetAudience('professionals')}
                  className={cn(
                    "p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all",
                    targetAudience === 'professionals'
                      ? "bg-orange-500/20 border-orange-500 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.2)]"
                      : "bg-surface-lowest border-outline-variant/30 text-on-surface-variant hover:border-orange-500/50 hover:text-on-surface"
                  )}
                >
                  <ShieldAlert className="w-6 h-6" />
                  <span className="text-xs font-bold">PROFESIONALES</span>
                  <span className="text-[10px] opacity-70">({users.filter(u => u.role === 'Profesional').length})</span>
                </button>
                <button
                  onClick={() => setTargetAudience('individual')}
                  className={cn(
                    "p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all",
                    targetAudience === 'individual'
                      ? "bg-[#B026FF]/20 border-[#B026FF] text-[#B026FF] shadow-[0_0_15px_rgba(176,38,255,0.2)]"
                      : "bg-surface-lowest border-outline-variant/30 text-on-surface-variant hover:border-[#B026FF]/50 hover:text-on-surface"
                  )}
                >
                  <User className="w-6 h-6" />
                  <span className="text-xs font-bold">INDIVIDUAL</span>
                </button>
                {targetAudience === 'uids' && (
                  <div className="p-3 rounded-xl border bg-yellow-500/20 border-yellow-500 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)] flex flex-col items-center justify-center gap-1">
                    <CheckCircle className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase">SELECCIÓN</span>
                    <span className="text-[10px] font-bold">({selectedUserIds.length})</span>
                  </div>
                )}
              </div>
            </div>

            {/* Individual Selection (Conditional) */}
            <AnimatePresence>
              {targetAudience === 'individual' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                    Seleccionar Usuario
                  </label>
                  <input
                    type="text"
                    placeholder="Buscar por nombre o correo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-surface-lowest border border-outline-variant/50 text-on-surface rounded-xl px-4 py-3 focus:outline-none focus:border-[#B026FF] transition-colors"
                  />
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {filteredIndividualUsers.slice(0, 20).map(u => (
                      <div
                        key={u.uid}
                        onClick={() => setSelectedUserId(u.uid)}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors border",
                          selectedUserId === u.uid
                            ? "bg-[#B026FF]/20 border-[#B026FF]"
                            : "bg-surface-lowest border-transparent hover:border-outline-variant/30"
                        )}
                      >
                        <div>
                          <p className={cn("font-bold", selectedUserId === u.uid ? "text-[#B026FF]" : "text-on-surface")}>
                            {u.name}
                          </p>
                          <p className="text-xs text-on-surface-variant">{u.email}</p>
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          u.role === 'Profesional' ? "bg-orange-500/20 text-orange-400" : "bg-blue-500/20 text-blue-400"
                        )}>
                          {u.role}
                        </span>
                      </div>
                    ))}
                    {filteredIndividualUsers.length === 0 && (
                      <p className="text-sm text-on-surface-variant italic text-center py-4">No se encontraron usuarios.</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Message Content */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                  Título del Mensaje
                </label>
                <input
                  type="text"
                  placeholder="Ej: Actualización Importante"
                  value={messageTitle}
                  onChange={(e) => setMessageTitle(e.target.value)}
                  className="w-full bg-surface-lowest border border-outline-variant/30 text-on-surface rounded-xl px-4 py-4 text-xl focus:outline-none focus:border-primary-container transition-colors"
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                  Contenido del Mensaje
                </label>
                <textarea
                  placeholder="Escribe el mensaje que quieres enviar..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  className="w-full bg-surface-lowest border border-outline-variant/30 text-on-surface rounded-xl px-4 py-4 text-xl min-h-[200px] resize-y focus:outline-none focus:border-primary-container transition-colors"
                  maxLength={1000}
                />
                <div className="flex justify-between mt-1 text-xs text-on-surface-variant">
                  <label className="flex items-center gap-2 cursor-pointer bg-surface-lowest p-2 rounded border border-outline-variant/30 hover:border-primary-container/50">
                    <input
                      type="checkbox"
                      checked={sendViaEmail}
                      onChange={(e) => setSendViaEmail(e.target.checked)}
                      className="accent-[#B026FF]"
                    />
                    <span className="flex items-center gap-1"><Mail className="w-4 h-4 text-primary-container" /> Enviar también copia por Correo a través de Gmail</span>
                  </label>
                  <span>{messageContent.length}/1000</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-outline-variant/20">
              <button
                onClick={handleSend}
                disabled={isSending || sendSuccess || !messageTitle.trim() || !messageContent.trim() || (targetAudience === 'individual' && !selectedUserId) || (targetAudience === 'uids' && selectedUserIds.length === 0)}
                className={cn(
                  "w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg",
                  sendSuccess
                    ? "bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                    : "bg-primary-container text-surface-lowest hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(0,255,255,0.3)]",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                )}
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enviando...
                  </>
                ) : sendSuccess ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Mensaje Enviado
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Emitir Mensaje
                  </>
                )}
              </button>
              <p className="text-center text-xs text-on-surface-variant mt-3 italic">
                {targetAudience === 'individual'
                  ? "El usuario seleccionado recibirá una notificación en la aplicación."
                  : "Todos los usuarios seleccionados recibirán la alerta en su centro de notificaciones."}
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
