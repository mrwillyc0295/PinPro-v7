import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CalendarDays, PlusCircle, Bell, Search, AlertTriangle, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { SafeBoundary } from '../components/SafeBoundary';

export default function ClientDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { title: "Mis Reservas", icon: CalendarDays, path: "/client-reservations", color: "text-[#00FFFF]" },
    { title: "Profesionales", icon: Search, path: "/home", color: "text-[#39FF14]" },
    { title: "Notificaciones", icon: Bell, path: "/notifications", color: "text-[#FFD700]" },
    { title: "Nueva Solicitud", icon: Zap, path: "/new-request", color: "text-[#00FFFF]", isPrimary: true },
  ];

  return (
    <SafeBoundary>
      <div className="flex flex-col min-h-screen bg-black px-6 pt-12 pb-6 gap-6">
        <header className="flex flex-col gap-1 items-center text-center">
          <h1 className="text-3xl font-black text-white">Hola, {profile?.name || 'Cliente'}</h1>
          <p className="text-white/60 text-lg">¿Qué necesitas resolver hoy?</p>
        </header>

        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col gap-1 shadow-[0_0_20px_rgba(0,255,255,0.05)]">
             <span className="text-sm font-bold text-white/50 uppercase tracking-widest">Contrataciones</span>
             <span className="text-3xl font-black text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">{profile?.completedJobs || 0}</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col gap-1 shadow-[0_0_20px_rgba(168,85,247,0.05)]">
             <span className="text-sm font-bold text-white/50 uppercase tracking-widest">Gasto Total</span>
             <span className="text-3xl font-black text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">$0</span>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4">
          {menuItems.map((item) => (
            <button
              key={item.title}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-3 border rounded-3xl p-6 transition-all active:scale-95 group",
                item.isPrimary
                  ? "bg-[#00FFFF]/10 border-[#00FFFF]/30 shadow-[0_0_20px_rgba(0,255,255,0.1)] hover:bg-[#00FFFF]/20"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              )}
            >
              <item.icon className={cn("w-10 h-10 group-hover:scale-110 transition-transform", item.color)} />
              <span className="text-xl font-black text-white tracking-tight uppercase italic">{item.title}</span>
            </button>
          ))}
        </section>

        <section className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <h2 className="text-lg font-black text-white mb-4">Mis Reseñas</h2>
            <div className="text-white/40 text-center py-6">Aún no has escrito reseñas.</div>
        </section>
      </div>
    </SafeBoundary>
  );
}
