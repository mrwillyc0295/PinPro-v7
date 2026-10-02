import { ArrowLeft, Bell, TrendingUp, Award, Briefcase, Clock, Star, CheckCircle2, Zap, Shield, CreditCard, ChevronRight, Wallet as WalletIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, limit, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

import { AnimatedBackButton } from '../components/AnimatedBackButton';

export default function Wallet() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    jobCount: 0,
    avgRating: 0,
    hours: 0
  });

  useEffect(() => {
    if (!loading && profile && profile.role !== 'Profesional') {
      navigate('/home');
    }
  }, [profile, loading, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        const q = query(
          collection(db, 'reservations'),
          where('proId', '==', user.uid),
          where('status', '==', 'completed'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );

        const querySnapshot = await getDocs(q);
        const jobs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRecentJobs(jobs);

        // Calculate total earnings (simulated from service prices)
        const total = jobs.reduce((acc, job: any) => {
          const priceStr = job.servicePrice || '$0';
          const price = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
          return acc + price;
        }, 0);

        setStats({
          totalEarnings: total,
          jobCount: jobs.length,
          avgRating: profile?.rating || 0,
          hours: jobs.length * 2 // Simulated hours
        });
      } catch (error) {
        console.error("Error fetching wallet stats:", error);
        handleFirestoreError(error, OperationType.LIST, 'reservations');
      }
    };

    fetchStats();
  }, [user, profile]);

  const isPremium = profile?.isPremium;
  const isElite = profile?.isElite;

  return (
    <div className="relative flex min-h-full w-full flex-col bg-surface-lowest overflow-x-hidden pb-20">
      {/* Header */}
      <div className="flex items-center bg-surface-lowest/80 backdrop-blur-md p-4 pb-2 justify-between sticky top-0 z-10 border-b border-primary-container/10">
        <div className="w-10"></div>
        <h2 className="text-on-surface text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Mi Billetera</h2>
        <div className="flex w-10 items-center justify-end">
          <button className="flex items-center justify-center rounded-full w-10 h-10 bg-transparent text-on-surface hover:bg-surface-highest transition-colors">
            <Bell className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Lifetime Earnings Section */}
      <div className="px-6 py-8 flex flex-col items-center justify-center bg-gradient-to-b from-primary-container/5 to-transparent">
        <p className="text-on-surface-variant text-xs font-bold uppercase tracking-[0.2em] mb-2">Ganancias Totales</p>
        <h1 className="text-primary-container drop-shadow-[0_0_20px_rgba(0,255,255,0.6)] tracking-tight text-[56px] font-black leading-tight text-center">
          ${stats.totalEarnings.toFixed(2)}
        </h1>
        <div className="mt-4 flex gap-2 items-center bg-surface-container/50 px-4 py-1.5 rounded-full border border-primary-container/20 backdrop-blur-sm">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <span className="text-on-surface text-xs font-bold">Pagos directos de clientes</span>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="px-4 pb-6 grid grid-cols-2 gap-3">
        <div className="bg-surface-container/40 p-5 rounded-2xl border border-outline-variant/30 flex flex-col items-center justify-center text-center group hover:border-primary-container/40 transition-all">
          <div className="w-12 h-12 rounded-xl bg-primary-container/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Briefcase className="w-6 h-6 text-primary-container" />
          </div>
          <p className="text-2xl font-black text-on-surface">{stats.jobCount}</p>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Trabajos</p>
        </div>
        <div className="bg-surface-container/40 p-5 rounded-2xl border border-outline-variant/30 flex flex-col items-center justify-center text-center group hover:border-primary-container/40 transition-all">
          <div className="w-12 h-12 rounded-xl bg-primary-container/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Star className="w-6 h-6 text-primary-container" />
          </div>
          <p className="text-2xl font-black text-on-surface">{stats.avgRating.toFixed(1)}</p>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Calificación</p>
        </div>
      </div>

      {/* Membership Status */}
      <div className="px-4 mb-6">
        <div className={cn(
          "relative overflow-hidden rounded-3xl p-6 border transition-all",
          isElite
            ? "bg-gradient-to-br from-amber-500/20 to-amber-900/40 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.2)]"
            : isPremium
            ? "bg-gradient-to-br from-[#00FFFF]/10 to-[#B026FF]/20 border-primary-container/40 shadow-[0_0_30px_rgba(0,255,255,0.15)]"
            : "bg-surface-container/40 border-outline-variant/30"
        )}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>

          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-on-surface-variant mb-1">Membresía Actual</h3>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-2xl font-black tracking-tight",
                  isElite ? "text-amber-500" : isPremium ? "text-primary-container" : "text-on-surface"
                )}>
                  {isElite ? 'Elite' : isPremium ? 'Premium' : 'Básico'}
                </span>
                {(isPremium || isElite) && (
                  <CheckCircle2 className={cn("w-5 h-5", isElite ? "text-amber-500" : "text-primary-container")} />
                )}
              </div>
            </div>
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center border",
              isElite ? "bg-amber-500/20 border-amber-500/30" : isPremium ? "bg-primary-container/20 border-primary-container/30" : "bg-surface border-outline-variant"
            )}>
              {isElite ? <Award className="w-7 h-7 text-amber-500" /> : isPremium ? <Zap className="w-7 h-7 text-primary-container" /> : <Shield className="w-7 h-7 text-on-surface-variant" />}
            </div>
          </div>

          {!isElite && (
            <button
              onClick={() => navigate('/premium-filter')}
              className={cn(
                "w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",
                isPremium
                  ? "bg-amber-500 text-surface-lowest shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                  : "bg-gradient-to-r from-[#00FFFF] to-[#B026FF] text-surface-lowest shadow-[0_0_15px_rgba(0,255,255,0.4)]"
              )}
            >
              {isPremium ? 'Mejorar a Elite' : 'Mejorar a Premium'}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Transaction History -> Recent Jobs */}
      <div className="px-4 flex-1">
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="text-on-surface text-base font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-container" />
            Historial de Ingresos
          </h3>
          <button className="text-primary-container text-xs font-bold hover:underline">Ver todo</button>
        </div>

        <div className="space-y-3">
          {recentJobs.length > 0 ? (
            recentJobs.map((job) => (
              <div key={job.id} className="bg-surface-container/40 p-4 rounded-2xl border border-outline-variant/30 flex items-center justify-between group hover:border-primary-container/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center border border-outline-variant text-on-surface-variant">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">{job.serviceTitle || job.serviceType}</p>
                    <p className="text-[10px] text-on-surface-variant font-medium">{job.clientName} • {job.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-primary-container drop-shadow-[0_0_5px_rgba(0,255,255,0.3)]">+{job.servicePrice || '$0'}</p>
                  <p className="text-[10px] text-green-400 font-bold uppercase tracking-tighter">Completado</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-surface-container/20 rounded-3xl border border-dashed border-outline-variant/30">
              <div className="w-16 h-16 rounded-full bg-surface-container/50 flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-on-surface-variant/30" />
              </div>
              <p className="text-on-surface-variant text-sm font-medium">Aún no tienes ingresos registrados</p>
              <p className="text-[10px] text-on-surface-variant/60 mt-1">Los trabajos completados aparecerán aquí</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="fixed bottom-20 left-0 w-full px-4 z-20">
        <div className="max-w-md mx-auto bg-surface-lowest/80 backdrop-blur-xl border border-primary-container/30 rounded-2xl p-3 flex flex-col gap-3 shadow-[0_10px_30px_rgba(0,255,255,0.2)]">
          <button
            onClick={() => navigate('/cash-out', { state: { balance: stats.totalEarnings } })}
            className="w-full bg-primary-container text-surface-lowest font-black py-4 rounded-xl flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(0,255,255,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <WalletIcon className="w-5 h-5" />
            <span className="uppercase tracking-widest text-xs">Solicitar Retiro</span>
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/payment-methods')}
              className="flex-1 bg-surface-container border border-outline-variant/50 text-on-surface text-[10px] font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:border-primary-container transition-all uppercase tracking-wider"
            >
              <CreditCard className="w-4 h-4 text-primary-container" />
              Métodos
            </button>
            <button
              className="flex-1 bg-surface-container border border-outline-variant/50 text-on-surface text-[10px] font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:border-primary-container transition-all uppercase tracking-wider"
            >
              <TrendingUp className="w-4 h-4 text-primary-container" />
              Reporte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
