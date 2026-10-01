import { ArrowLeft, Wallet, CheckCircle2, ChevronRight, AlertCircle, X } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { cn } from '../lib/utils';

export default function CashOut() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();

  // Get balance from state or default to a positive testing balance if not passed
  const initialBalance = location.state?.balance || 250.00;

  // 1. GESTIÓN DE ESTADOS FINANCIEROS
  const [availableBalance, setAvailableBalance] = useState<number>(initialBalance);
  const [withdrawalAmount, setWithdrawalAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [pendingTransactions, setPendingTransactions] = useState<{id: string, amount: number, method: string, date: string, status: string}[]>([]);

  // UI States
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Constant
  const MIN_WITHDRAWAL_AMOUNT = 20.00;

  // Payment Methods
  const paymentMethods = [
    { id: 'zelle', label: 'Zelle' },
    { id: 'pago_movil', label: 'Pago Móvil (Tasa BCV)' },
    { id: 'binance', label: 'Binance Pay' },
    { id: 'paypal', label: 'PayPal' },
    { id: 'acuerdo', label: 'Acuerdo con el Profesional' }
  ];

  // 2. VALIDACIONES DE SEGURIDAD (Frontend)
  const isAmountValid = () => {
    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || withdrawalAmount === '') return false;
    if (amount < MIN_WITHDRAWAL_AMOUNT) return false;
    if (amount > availableBalance) return false;
    return true;
  };

  const isFormValid = isAmountValid() && paymentMethod !== '';

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Allow numbers and decimal points only
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setWithdrawalAmount(value);

      const numValue = parseFloat(value);
      if (value !== '' && !isNaN(numValue)) {
        if (numValue < MIN_WITHDRAWAL_AMOUNT) {
          setErrorMsg(`El retiro mínimo es de $${MIN_WITHDRAWAL_AMOUNT.toFixed(2)}`);
        } else if (numValue > availableBalance) {
          setErrorMsg('El monto excede tu saldo disponible');
        } else {
          setErrorMsg('');
        }
      } else {
        setErrorMsg('');
      }
    }
  };

  const handleSubmit = async () => {
    if (!isFormValid || isProcessing) return;

    setIsProcessing(true);
    const amount = parseFloat(withdrawalAmount);

    try {
      // Simulate network request and backend operation
      await new Promise(resolve => setTimeout(resolve, 1500));

      const selectedMethodLabel = paymentMethods.find(m => m.id === paymentMethod)?.label || paymentMethod;

      // Add to pending transactions
      const newTransaction = {
        id: Math.random().toString(36).substr(2, 9),
        amount: amount,
        method: selectedMethodLabel,
        date: new Date().toLocaleString(),
        status: 'pending'
      };

      setPendingTransactions([newTransaction, ...pendingTransactions]);

      // Deduct internal balance
      setAvailableBalance(prev => prev - amount);

      // Also potentially save to DB if Firebase is hooked correctly
      // (as in your prompt "Asegúrate de deducir el monto...")
      await addDoc(collection(db, 'payouts'), {
        proId: user?.uid,
        proName: profile?.name,
        amount: amount,
        method: selectedMethodLabel,
        status: 'pending',
        createdAt: new Date()
      });

      // Show Success Modal
      setShowSuccessModal(true);
      setWithdrawalAmount('');
      setPaymentMethod('');

    } catch (e) {
      console.error(e);
      setErrorMsg('Ocurrió un error al procesar el retiro.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative flex min-h-full w-full flex-col bg-[#050505] overflow-x-hidden pb-20">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-container/5 rounded-full blur-[100px] transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#B026FF]/5 rounded-full blur-[100px] transform -translate-x-1/2 translate-y-1/2"></div>
      </div>

      {/* Header */}
      <div className="flex items-center bg-[#050505]/80 backdrop-blur-md p-4 pb-2 justify-between sticky top-0 z-10 border-b border-primary-container/10">
        <div className="w-10"></div>
        <h2 className="text-on-surface text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Retiro de Ganancias</h2>
        <div className="w-10"></div>
      </div>

      <div className="px-5 py-8 relative z-10 flex-1 flex flex-col">
        {/* Balance Display */}
        <div className="flex flex-col items-center justify-center mb-10">
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-[0.2em] mb-2">Saldo Disponible</p>
          <h1 className="text-primary-container drop-shadow-[0_0_20px_rgba(0,255,255,0.4)] tracking-tight text-[56px] font-black leading-tight text-center">
            ${availableBalance.toFixed(2)}
          </h1>
        </div>

        {/* Amount Input */}
        <div className="mb-8">
          <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3 block pl-1">Monto a retirar</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <span className="text-on-surface-variant text-2xl font-light">$</span>
            </div>
            <input
              type="text" // Using text to allow empty state cleanly and manage decimals manually
              value={withdrawalAmount}
              onChange={handleAmountChange}
              placeholder="0.00"
              className={cn(
                "w-full bg-surface-container/50 border rounded-2xl py-6 pl-12 pr-6 text-2xl font-bold text-on-surface focus:outline-none focus:ring-2 transition-all shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)]",
                errorMsg
                  ? "border-red-500/50 focus:ring-red-500/50 focus:border-red-500"
                  : "border-primary-container/30 focus:ring-primary-container/50 focus:border-primary-container"
              )}
            />
          </div>
          {errorMsg && (
            <div className="mt-2 flex items-center gap-2 text-red-400 pl-2">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs font-bold">{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Payment Methods */}
        <div className="mb-10">
          <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3 block pl-1">Método de Transferencia</label>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <label
                key={method.id}
                className={cn(
                  "cursor-pointer p-4 rounded-xl border flex items-center justify-between transition-all group overflow-hidden relative",
                  paymentMethod === method.id
                    ? "bg-primary-container/10 border-primary-container shadow-[0_0_15px_rgba(0,255,255,0.15)]"
                    : "bg-surface-container/40 border-outline-variant/30 hover:border-primary-container/50 hover:bg-surface-container/60"
                )}
              >
                {/* Visual indicator for selection */}
                {paymentMethod === method.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-container shadow-[0_0_10px_rgba(0,255,255,1)]"></div>
                )}

                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                    paymentMethod === method.id
                      ? "border-primary-container"
                      : "border-on-surface-variant"
                  )}>
                    {paymentMethod === method.id && (
                      <div className="w-2.5 h-2.5 bg-primary-container rounded-full shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
                    )}
                  </div>
                  <span className={cn(
                    "text-sm font-bold transition-colors",
                    paymentMethod === method.id ? "text-primary-container drop-shadow-[0_0_5px_rgba(0,255,255,0.3)]" : "text-on-surface"
                  )}>
                    {method.label}
                  </span>
                </div>
                {paymentMethod === method.id && <ChevronRight className="w-5 h-5 text-primary-container" />}
              </label>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-auto pt-4 pb-6">
          <button
            disabled={!isFormValid || isProcessing}
            onClick={handleSubmit}
            className="w-full relative group overflow-hidden rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-all active:scale-[0.98]"
          >
            {/* Background Gradient */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-r from-[#00FFFF] to-[#B026FF] transition-opacity",
              isFormValid ? "opacity-100 shadow-[0_0_20px_rgba(0,255,255,0.4)]" : "opacity-30"
            )}></div>

            {/* Button Content */}
            <div className="relative py-4 px-6 flex items-center justify-center gap-3">
              {isProcessing ? (
                <div className="w-5 h-5 rounded-full border-2 border-surface-lowest border-t-transparent animate-spin"></div>
              ) : (
                <Wallet className={cn("w-5 h-5", isFormValid ? "text-surface-lowest" : "text-on-surface")} />
              )}
              <span className={cn(
                "font-black uppercase tracking-widest text-sm",
                isFormValid ? "text-surface-lowest" : "text-on-surface"
              )}>
                {isProcessing ? 'Procesando...' : 'Solicitar Retiro'}
              </span>
            </div>
          </button>
        </div>

        {/* Pending Transactions Section */}
        {pendingTransactions.length > 0 && (
          <div className="mt-4 pt-8 border-t border-outline-variant/30">
            <h3 className="text-on-surface text-sm font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary-container" />
              Retiros Pendientes
            </h3>
            <div className="space-y-3">
              {pendingTransactions.map((tx) => (
                <div key={tx.id} className="bg-surface-container/30 p-4 rounded-xl border border-primary-container/10 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-on-surface">{tx.method}</p>
                    <p className="text-[10px] text-on-surface-variant mt-1">{tx.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-primary-container font-black drop-shadow-[0_0_5px_rgba(0,255,255,0.4)]">
                      -${tx.amount.toFixed(2)}
                    </p>
                    <span className="text-[10px] uppercase font-bold text-yellow-500 tracking-wider">
                      En Proceso
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-surface-lowest w-full max-w-sm rounded-[2rem] p-8 border border-primary-container/30 shadow-[0_20px_60px_-10px_rgba(0,255,255,0.2)] animate-in zoom-in-95 duration-200 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>

            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-surface-container rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-20 h-20 bg-primary-container/10 rounded-full flex items-center justify-center mb-6 relative z-10 border border-primary-container/20 shadow-[0_0_30px_rgba(0,255,255,0.2)]">
              <CheckCircle2 className="w-10 h-10 text-primary-container drop-shadow-[0_0_10px_rgba(0,255,255,0.6)]" />
            </div>

            <h3 className="text-2xl font-black text-on-surface mb-2 relative z-10">¡Retiro en Proceso!</h3>
            <p className="text-sm text-on-surface-variant font-medium mb-8 leading-relaxed relative z-10">
              Tu solicitud ha sido recibida. El dinero será transferido a tu cuenta en las próximas horas laborables.
            </p>

            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-surface-highest text-on-surface hover:bg-surface-container font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all border border-outline-variant/30 uppercase tracking-widest text-xs relative z-10"
            >
              Cerrar y Volver
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
