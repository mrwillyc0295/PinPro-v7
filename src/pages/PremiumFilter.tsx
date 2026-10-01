import { ArrowRight, CheckCircle2, Star, Shield, Zap, Award, ChevronRight, CreditCard, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

export default function PremiumFilter() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [profession, setProfession] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'none' | 'premium' | 'elite'>('none');
  const [paymentStep, setPaymentStep] = useState<'selection' | 'processing' | 'success'>('selection');

  useEffect(() => {
    if (profile?.profession) {
      setProfession(profile.profession);
    }
  }, [profile]);

  const handleTierSelection = (tier: 'none' | 'premium' | 'elite') => {
    if (tier === 'none') {
      handleUpdateProfile('none');
      return;
    }
    setSelectedTier(tier);
    setPaymentStep('selection');
    setShowPaymentModal(true);
  };

  const handleProcessPayment = () => {
    setPaymentStep('processing');
    // Simulate payment verification delay
    setTimeout(() => {
      setPaymentStep('success');
      // After success, wait a bit then update profile
      setTimeout(() => {
        handleUpdateProfile(selectedTier);
      }, 1500);
    }, 2500);
  };

  const handleUpdateProfile = async (tier: 'none' | 'premium' | 'elite') => {
    if (!user || !profession) return;

    try {
      setLoading(true);
      const isPremium = tier === 'premium';
      const isElite = tier === 'elite';

      await setDoc(doc(db, 'profesionales', user.uid), {
        profession: profession,
        isPremium: isPremium || isElite,
        isElite: isElite
      }, { merge: true });

      if (tier !== 'none') {
        // Success message is handled by the success step in modal
      } else {
        navigate('/edit-profile');
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      handleFirestoreError(error, OperationType.UPDATE, `profesionales/${user.uid}`);
      alert('Error al guardar la información');
      setShowPaymentModal(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col bg-surface-lowest overflow-x-hidden max-w-md mx-auto border-x border-surface-highest pb-10">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container/10 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-[#B026FF]/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="flex-1 flex flex-col px-6 pt-12 pb-8 z-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-primary-container/10 rounded-full mb-4 shadow-[0_0_20px_rgba(0,255,255,0.2)]">
            <Star className="w-8 h-8 text-primary-container drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
          </div>
          <h1 className="text-2xl font-black text-on-surface mb-2 tracking-tight">Membresías PinPro</h1>
          <p className="text-sm text-on-surface-variant">Eleva tu perfil y multiplica tus oportunidades.</p>
        </div>

        {/* Profession Selection */}
        <div className="mb-8">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1 mb-2 block">Confirma tu profesión principal</label>
          <select
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
            className="w-full bg-surface-container/50 border border-outline-variant/50 text-on-surface text-sm rounded-xl px-4 py-4 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all appearance-none"
          >
            <option value="" disabled>Selecciona una opción...</option>
            <option value="plomero">Plomería</option>
            <option value="electricista">Electricidad</option>
            <option value="limpieza">Limpieza del Hogar</option>
            <option value="belleza">Belleza y Estética</option>
            <option value="tecnologia">Soporte Tecnológico</option>
            <option value="otros">Otros</option>
          </select>
        </div>

        {/* Plans Grid */}
        <div className="flex flex-col gap-6">
          {/* Premium Plan */}
          <div className={cn(
            "bg-gradient-to-br from-surface-container to-surface-highest border rounded-3xl p-6 relative overflow-hidden shadow-[0_10px_30px_-10px_rgba(0,255,255,0.1)]",
            profile?.isPremium && !profile?.isElite ? "border-primary-container shadow-[0_0_20px_rgba(0,255,255,0.2)]" : "border-primary-container/30"
          )}>
            {profile?.isPremium && !profile?.isElite && (
              <div className="absolute top-0 right-0 bg-primary-container text-surface-lowest text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-tighter">Plan Actual</div>
            )}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-wider text-primary-container drop-shadow-[0_0_10px_rgba(0,255,255,0.4)]">Premium</span>
                <Zap className="w-4 h-4 text-primary-container" />
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-on-surface">$9.99</p>
                <p className="text-[10px] text-on-surface-variant font-bold uppercase">Mensual</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary-container" />
                <span className="text-xs text-on-surface">Prioridad en búsquedas</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary-container" />
                <span className="text-xs text-on-surface">Insignia de verificado</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary-container" />
                <span className="text-xs text-on-surface">Soporte prioritario</span>
              </div>
            </div>

            <button
              onClick={() => handleTierSelection('premium')}
              disabled={!profession || loading || (profile?.isPremium && !profile?.isElite)}
              className="w-full bg-primary-container text-surface-lowest font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(0,255,255,0.3)] active:scale-[0.98] disabled:opacity-50"
            >
              {profile?.isPremium && !profile?.isElite ? 'Plan Actual' : 'Elegir Premium'}
            </button>
          </div>

          {/* Elite Plan */}
          <div className={cn(
            "bg-gradient-to-br from-amber-500/10 to-amber-900/20 border rounded-3xl p-6 relative overflow-hidden shadow-[0_10px_30px_-10px_rgba(245,158,11,0.2)]",
            profile?.isElite ? "border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]" : "border-amber-500/40"
          )}>
            {profile?.isElite ? (
              <div className="absolute top-0 right-0 bg-amber-500 text-surface-lowest text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-tighter">Plan Actual</div>
            ) : (
              <div className="absolute top-0 right-0 bg-amber-500 text-surface-lowest text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-tighter">Más Popular</div>
            )}

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-wider text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]">Elite</span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-on-surface">$19.99</p>
                <p className="text-[10px] text-on-surface-variant font-bold uppercase">Mensual</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-on-surface">Posicionamiento #1 garantizado</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-on-surface">Comisión 0% en plataforma</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-on-surface">Acceso a trabajos exclusivos</span>
              </div>
            </div>

            <button
              onClick={() => handleTierSelection('elite')}
              disabled={!profession || loading || profile?.isElite}
              className="w-full bg-amber-500 text-surface-lowest font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.4)] active:scale-[0.98] disabled:opacity-50"
            >
              {profile?.isElite ? 'Plan Actual' : 'Elegir Elite'}
            </button>
          </div>
        </div>

        {/* Free Plan */}
        <button
          onClick={() => handleTierSelection('none')}
          disabled={!profession || loading}
          className="mt-8 w-full text-on-surface-variant text-xs font-bold hover:text-on-surface transition-colors flex items-center justify-center gap-2"
        >
          Continuar con el plan gratuito
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Payment Verification Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-surface-container border border-primary-container/30 rounded-3xl p-6 w-full max-w-sm shadow-[0_0_30px_rgba(0,255,255,0.2)] animate-in zoom-in duration-300">
            {paymentStep === 'selection' && (
              <div className="flex flex-col gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary-container/10 flex items-center justify-center border border-primary-container/30 mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-primary-container" />
                  </div>
                  <h3 className="text-xl font-black text-on-surface">Verificación de Pago</h3>
                  <p className="text-sm text-on-surface-variant mt-2">
                    Estás por adquirir el plan <span className="text-primary-container font-bold uppercase">{selectedTier}</span> por {selectedTier === 'premium' ? '$9.99' : '$19.99'}/mes.
                  </p>
                </div>

                <div className="bg-surface-lowest/50 border border-outline-variant/30 rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center text-[8px] text-white font-black">VISA</div>
                      <span className="text-sm font-bold text-on-surface">•••• 4242</span>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-primary-container" />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleProcessPayment}
                    className="w-full bg-primary-container text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(0,255,255,0.4)] hover:scale-[1.02] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    PROCESS
                  </button>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="w-full bg-surface-highest text-on-surface font-bold py-4 rounded-xl border border-outline-variant/30 hover:bg-surface-highest/80 transition-all"
                  >
                    CANCELAR
                  </button>
                </div>
              </div>
            )}

            {paymentStep === 'processing' && (
              <div className="flex flex-col items-center text-center py-8 gap-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-primary-container/20 border-t-primary-container animate-spin"></div>
                  <Shield className="absolute inset-0 m-auto w-8 h-8 text-primary-container animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-on-surface">Verificando Pago</h3>
                  <p className="text-sm text-on-surface-variant mt-2">
                    Estamos procesando tu transacción de forma segura. Por favor, no cierres esta ventana.
                  </p>
                </div>
              </div>
            )}

            {paymentStep === 'success' && (
              <div className="flex flex-col items-center text-center py-8 gap-6 animate-in zoom-in duration-500">
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-on-surface">¡Pago Exitoso!</h3>
                  <p className="text-sm text-on-surface-variant mt-2">
                    Tu membresía <span className="text-primary-container font-bold uppercase">{selectedTier}</span> ha sido activada correctamente.
                  </p>
                </div>
                <p className="text-[10px] text-on-surface-variant animate-pulse">Redirigiendo a tu perfil...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
