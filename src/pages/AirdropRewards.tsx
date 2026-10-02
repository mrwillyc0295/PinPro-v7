import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { Wallet, Gift, Clock, CheckCircle2, ArrowRightLeft, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, limit, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

export default function AirdropRewards() {
  const { user, profile } = useAuth();
  const [tokenBalance, setTokenBalance] = useState(0);
  const [dailyLoginClaimed, setDailyLoginClaimed] = useState(false);
  const [onlineHoursProgess, setOnlineHoursProgess] = useState(0);
  const [transactionHistory, setTransactionHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Listen to token balance from profile
    const unsubscribeProfile = onSnapshot(doc(db, 'profesionales', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setTokenBalance(data.tokenBalance || 0);
      }
    });

    // Listen to transactions
    const q = query(
      collection(db, 'token_transactions'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribeTransactions = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        time: doc.data().createdAt?.toDate().toLocaleString() || 'Ahora'
      }));
      setTransactionHistory(txs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching transactions:", error);
      setLoading(false);
    });

    return () => {
      unsubscribeProfile();
      unsubscribeTransactions();
    };
  }, [user]);

  const usdValue = useMemo(() => (tokenBalance / 100).toFixed(2), [tokenBalance]);

  const handleClaimLogin = async () => {
    if (!user || !profile || dailyLoginClaimed) return;

    try {
      const reward = 10;
      const newBalance = tokenBalance + reward;

      await updateDoc(doc(db, 'profesionales', user.uid), {
        tokenBalance: newBalance
      });

      await addDoc(collection(db, 'token_transactions'), {
        userId: user.uid,
        amount: reward,
        description: "Recompensa Login Diario",
        type: 'bonus',
        createdAt: serverTimestamp()
      });

      setDailyLoginClaimed(true);
    } catch (error) {
      console.error("Error claiming login reward:", error);
      handleFirestoreError(error, OperationType.UPDATE, 'profesionales');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
        <p className="text-cyan-400 font-black uppercase tracking-widest text-xs">Cargando Billetera $PIN...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
      <h1 className="text-2xl font-black mb-6 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-magenta-500">
        Reward Center
      </h1>

      {/* Digital Credit Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-[#111111]/80 backdrop-blur-3xl border border-white/10 p-8 rounded-[38px] shadow-2xl mb-8 group"
      >
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[conic-gradient(transparent,var(--color-primary-container),transparent_30%)] animate-rotate opacity-[0.05] pointer-events-none"></div>

        <div className="relative flex flex-col">
          <div className="flex justify-between items-start mb-10">
            <div className="w-16 h-16 bg-primary-container/10 rounded-2xl flex items-center justify-center border border-primary-container/20 shadow-[0_0_15px_rgba(0,255,255,0.1)]">
              <Wallet className="w-8 h-8 text-primary-container" />
            </div>
            <div className="text-right">
              <p className="text-primary-container font-black uppercase tracking-[0.2em] text-[10px] mb-1">Balance Token</p>
              <div className="flex items-center justify-end gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]"></div>
                <span className="text-white/40 text-[10px] font-black uppercase">Red Activa</span>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-5xl font-black mb-2 tracking-tighter text-white">
              {tokenBalance.toLocaleString()}
              <span className="text-xl font-medium text-white/40 ml-2 uppercase italic">$PIN</span>
            </h2>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#00FF66]" />
              <p className="text-[#00FF66] font-black text-sm uppercase tracking-wider">≈ ${usdValue} USD</p>
            </div>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 mb-8">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
              <span>Tipo de Cambio</span>
              <span className="text-white">100 $PIN = $1.00 USD</span>
            </div>
          </div>

          <button
            disabled={tokenBalance < 5000}
            className="w-full py-5 rounded-2xl font-black bg-gradient-to-r from-[#00FFFF] to-[#B026FF] disabled:from-zinc-800 disabled:to-zinc-900 disabled:text-zinc-500 text-black uppercase tracking-widest text-xs shadow-[0_4px_20px_rgba(0,255,255,0.3)] hover:shadow-[0_4px_30px_rgba(0,255,255,0.5)] transition-all transform active:scale-95 transition-all"
          >
            {tokenBalance < 5000 ? "Canjear a Billetera (Min 5,000)" : "Retirar Fondos"}
          </button>
        </div>
      </motion.div>

      {/* Missions */}
      <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-6 px-2">Misiones y Airdrops Disponibles</h3>
      <div className="space-y-4 mb-10">
        {/* Daily Login */}
        <div className="group bg-[#111111] border border-white/5 p-6 rounded-[28px] flex items-center justify-between transition-all hover:border-primary-container/30">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-primary-container/10 rounded-2xl flex items-center justify-center border border-primary-container/10 group-hover:scale-110 transition-transform">
              <Gift className="w-6 h-6 text-primary-container" />
            </div>
            <div>
              <p className="font-black text-white uppercase italic tracking-tighter">Login Diario</p>
              <p className="text-[10px] font-bold text-primary-container uppercase tracking-widest">+10 $PIN</p>
            </div>
          </div>
          <button
            onClick={handleClaimLogin}
            disabled={dailyLoginClaimed}
            className={cn(
              "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95",
              dailyLoginClaimed
                ? "bg-white/5 text-white/20 border border-white/5"
                : "bg-primary-container text-black shadow-[0_0_15px_rgba(0,255,255,0.2)] hover:shadow-[0_0_20px_rgba(0,255,255,0.4)]"
            )}
          >
            {dailyLoginClaimed ? "Completado" : "Reclamar"}
          </button>
        </div>

        {/* 6 Hours */}
        <div className="bg-[#111111] border border-white/5 p-6 rounded-[28px] space-y-4 transition-all hover:border-magenta-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-magenta-500/10 rounded-2xl flex items-center justify-center border border-magenta-500/10">
                <Clock className="w-6 h-6 text-magenta-400" />
              </div>
              <div>
                <p className="font-black text-white uppercase italic tracking-tighter">Conexión Elite</p>
                <p className="text-[10px] font-bold text-magenta-400 uppercase tracking-widest">6 Horas On • +50 $PIN</p>
              </div>
            </div>
            <span className="text-[10px] font-black text-magenta-400 uppercase tracking-widest">{onlineHoursProgess}%</span>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${onlineHoursProgess}%` }}
              className="bg-magenta-500 h-full shadow-[0_0_10px_rgba(255,0,255,0.4)]"
            />
          </div>
        </div>

        {/* Service */}
        <div className="group bg-[#111111] border border-white/5 p-6 rounded-[28px] flex items-center justify-between transition-all hover:border-[#00FF66]/30">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-[#00FF66]/10 rounded-2xl flex items-center justify-center border border-[#00FF66]/10">
              <CheckCircle2 className="w-6 h-6 text-[#00FF66]" />
            </div>
            <div>
              <p className="font-black text-white uppercase italic tracking-tighter">Misión Completada</p>
              <p className="text-[10px] font-bold text-[#00FF66] uppercase tracking-widest">+100 $PIN por Trabajo</p>
            </div>
          </div>
          <div className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white/20 text-[10px] font-black uppercase tracking-widest">
            En Curso
          </div>
        </div>
      </div>

      {/* History */}
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Historial</h3>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-2">
        {transactionHistory.map(tx => (
          <div key={tx.id} className="flex items-center justify-between p-4 border-b border-gray-800 last:border-none">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-cyan-400/50 w-4 h-4" />
              <div>
                <p className="font-bold text-sm">+{tx.amount} $PIN</p>
                <p className="text-[10px] text-gray-500">{tx.desc}</p>
              </div>
            </div>
            <p className="text-[10px] text-gray-600">{tx.time}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
