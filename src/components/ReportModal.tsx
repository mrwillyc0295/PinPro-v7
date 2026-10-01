import React, { useState } from 'react';
import { AlertTriangle, X, Send, Loader2, Info } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** If provided, this is a report against a specific user */
  reportedUserId?: string;
  reportedUserName?: string;
}

export function ReportModal({ isOpen, onClose, reportedUserId, reportedUserName }: ReportModalProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const isPlatformReport = !reportedUserId; // Si no hay reportedUserId, es un reclamo hacia PinPro

  const platformReasons = [
    "Fallo técnico de la App",
    "Problemas de Pagos",
    "Sugerencia de Mejora",
    "Robo / Fraude en mi cuenta",
    "Otro problema general"
  ];

  const userReasons = [
    "Comportamiento Inadecuado / Acoso",
    "Estafa o Fraude",
    "Servicio de mala calidad no resuelto",
    "Perfil Falso o Spam",
    "Lenguaje Ofensivo"
  ];

  const availableReasons = isPlatformReport ? platformReasons : userReasons;

  const handleSubmit = async () => {
    if (!reason || !description.trim()) {
      alert("Por favor selecciona un motivo y escribe una descripción.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'reports'), {
        reporterId: user?.uid || 'UNKNOWN_USER',
        reportedId: reportedUserId || 'PINPRO_PLATFORM',
        reason,
        description,
        status: 'Pendiente',
        createdAt: serverTimestamp()
      });

      setShowSuccess(true);
      setTimeout(() => {
        onClose();
        setShowSuccess(false);
        setReason('');
        setDescription('');
      }, 2500);

    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Hubo un error al enviar el reporte. Intenta más tarde.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="bg-surface-lowest border border-red-500/30 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.15)] flex flex-col relative"
        >
          {showSuccess ? (
            <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                <Send className="w-10 h-10 text-green-500 translate-x-1 -translate-y-1" />
              </div>
              <h3 className="text-xl font-bold text-on-surface">¡Reporte Enviado!</h3>
              <p className="text-on-surface-variant text-sm">
                Nuestro equipo de administración lo investigará y tomará medidas oportunas.
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-outline-variant/30 bg-surface-container/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500/20 text-red-500">
                    <AlertTriangle className="w-5 h-5 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-on-surface leading-tight">
                      {isPlatformReport ? 'Soporte PinPro' : 'Reportar Perfil'}
                    </h3>
                    <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                      Centro de Reclamos
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-highest text-on-surface-variant transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <div className="p-5 overflow-y-auto custom-scrollbar max-h-[60vh] space-y-5">

                {/* Notice */}
                <div className="bg-[#B026FF]/10 border border-[#B026FF]/30 p-3 rounded-xl flex items-start gap-3">
                  <Info className="w-5 h-5 text-[#B026FF] shrink-0 mt-0.5" />
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {isPlatformReport
                      ? "Usa este canal para reportar problemas de la App, fallos técnicos o emitir quejas hacia la plataforma."
                      : `Estás enviando un reporte contra ${reportedUserName}. Las falsas denuncias pueden llevar a la suspensión de tu cuenta.`}
                  </p>
                </div>

                {/* Reason Select */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">Motivo del Reporte</label>
                  <div className="flex flex-col gap-2">
                    {availableReasons.map(r => (
                      <button
                        key={r}
                        onClick={() => setReason(r)}
                        className={cn(
                          "px-4 py-3 rounded-xl text-sm font-medium transition-all text-left border",
                          reason === r
                            ? "bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                            : "bg-surface-container border-outline-variant/30 text-on-surface hover:border-red-500/50"
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">Descripción de los hechos</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Por favor, describe exactamente qué pasó con el mayor detalle posible..."
                    className="w-full bg-surface-container/50 border border-outline-variant/50 text-on-surface text-sm rounded-xl px-4 py-3 min-h-[120px] resize-y focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder:text-on-surface-variant/50"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="p-5 border-t border-outline-variant/30 flex gap-3 bg-surface-container/30">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-highest transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !reason || !description.trim()}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Emitir Reporte'}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
