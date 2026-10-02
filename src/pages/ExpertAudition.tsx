import React, { useState, useEffect } from 'react';
import { Brain, Rocket, Users, ChevronLeft, Sparkles, MessageSquare, ShieldCheck, TrendingUp, DollarSign, Zap, Target, BarChart3, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { cn } from '../lib/utils';

interface Expert {
  id: number;
  name: string;
  role: string;
  prompt: string;
  icon: any;
  color: string;
}

const ExpertAudition = () => {
  const navigate = useNavigate();
  const [selectedExperts, setSelectedExperts] = useState<number[]>([]);
  const [queryText, setQueryText] = useState("");
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totales: 0,
    profesionales: 0,
    clientes: 0,
    bloqueados: 0
  });

  const experts: Expert[] = [
    { id: 1, name: "Elon Musk", role: "VISIONARIO TECH", prompt: "Enfoque en escalabilidad radical y automatización.", icon: Rocket, color: "text-orange-400" },
    { id: 2, name: "Warren Buffett", role: "ANÁLISIS FINANCIERO", prompt: "Enfoque en flujo de caja, valor intrínseco y riesgo.", icon: DollarSign, color: "text-green-400" },
    { id: 3, name: "Seth Godin", role: "MARKETING Y MARCA", prompt: "Enfoque en posicionamiento y confianza del usuario.", icon: Target, color: "text-purple-400" },
    { id: 4, name: "Steve Jobs", role: "DISEÑO Y PRODUCTO", prompt: "Enfoque en simplicidad, estética y perfección.", icon: Zap, color: "text-cyan-400" },
    { id: 5, name: "Sheryl Sandberg", role: "OPERACIONES Y ESCALA", prompt: "Enfoque en eficiencia operativa y cultura.", icon: TrendingUp, color: "text-blue-400" },
    { id: 6, name: "Nava Ravikant", role: "APALANCAMIENTO", prompt: "Enfoque en juicios de alto valor y tecnología.", icon: Brain, color: "text-yellow-400" },
    { id: 7, name: "Peter Thiel", role: "MONOPOLIO Y ESTRATEGIA", prompt: "Enfoque en ir de 0 a 1 y crear ventajas competitivas únicas.", icon: ShieldCheck, color: "text-red-400" },
    { id: 8, name: "Gary Vee", role: "ATENCIÓN Y CONTENIDO", prompt: "Enfoque en ganar la atención del mercado y ejecución rápida.", icon: MessageSquare, color: "text-pink-400" },
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const clientesSnap = await getDocs(collection(db, 'clientes'));
        const prosSnap = await getDocs(collection(db, 'profesionales'));

        const total = clientesSnap.size + prosSnap.size;
        const pros = prosSnap.size;
        const clients = clientesSnap.size;
        const blocked = clientesSnap.docs.filter(d => d.data().status === 'Bloqueado').length +
                        prosSnap.docs.filter(d => d.data().status === 'Bloqueado').length;

        setDashboardStats({
          totales: total,
          profesionales: pros,
          clientes: clients,
          bloqueados: blocked
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      }
    };
    fetchStats();
  }, []);

  const toggleExpert = (id: number) => {
    if (selectedExperts.includes(id)) {
      setSelectedExperts(selectedExperts.filter(e => e !== id));
    } else if (selectedExperts.length < 8) {
      setSelectedExperts([...selectedExperts, id]);
    }
  };

  const iniciarConsulta = () => {
    if (selectedExperts.length === 0 || !queryText.trim()) return;
    setIsAnalysing(true);

    // El "Dashboard Context" que representas en tu código
    const dashboardContext = {
      stats: dashboardStats,
      status: "Atención Requerida: Análisis de Red Activo",
      region: "Global (PinPro Network)",
      diagnostico: "Estado de salud actualizado en tiempo real"
    };

    const fullPayload = {
      userQuestion: queryText,
      context: dashboardContext,
      experts: experts.filter(e => selectedExperts.includes(e.id))
    };

    console.log("Enviando a la IA:", fullPayload);
    // Simulación de interacción con Gemini
    setTimeout(() => {
      setIsAnalysing(false);
      alert("Análisis completado. He enviado los resultados a tu consola (F12) para que veas el Payload real.");
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#050a12] text-white flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-surface-lowest/90 backdrop-blur-xl px-6 py-6 border-b border-primary-container/20 shadow-[0_0_30px_rgba(0,255,255,0.1)] text-center">
        <div className="w-24 hidden lg:block" /> {/* Spacer for centering balance */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase">Audición de Expertos</h1>
          <p className="text-[10px] text-cyan-400 font-mono tracking-[0.2em] uppercase">Intelligence Panel v1.0</p>
        </div>
        <div className="bg-[#111827] border border-gray-700 rounded-2xl px-4 py-2 flex items-center gap-3 shadow-[0_0_15px_rgba(0,255,255,0.1)] ml-auto">
          <span className="text-[10px] font-bold text-gray-500 uppercase">Seleccionados</span>
          <span className="text-lg font-mono text-cyan-400">{selectedExperts.length}/8</span>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-8 max-w-6xl mx-auto w-full">
        {/* Context Stats Summary */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Usuarios', val: dashboardStats.totales, color: 'text-white' },
            { label: 'Pros', val: dashboardStats.profesionales, color: 'text-cyan-400' },
            { label: 'Clientes', val: dashboardStats.clientes, color: 'text-purple-400' },
            { label: 'Blocked', val: dashboardStats.bloqueados, color: 'text-red-400' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{stat.label}</span>
              <span className={cn("text-2xl font-black italic", stat.color)}>{stat.val}</span>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Panel Lateral - Expertos */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-xs font-bold text-orange-400 mb-2 uppercase tracking-widest flex items-center gap-2">
              <Users className="w-4 h-4" /> Panel Profesional
            </h3>
            <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {experts.map(expert => (
                <button
                  key={expert.id}
                  onClick={() => toggleExpert(expert.id)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-3xl border transition-all active:scale-95 text-left",
                    selectedExperts.includes(expert.id)
                      ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_20px_rgba(0,255,255,0.1)]'
                      : 'border-white/5 bg-white/5 hover:border-white/20'
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-2xl",
                    selectedExperts.includes(expert.id) ? 'bg-cyan-500 text-black' : 'bg-white/10 text-white/50'
                  )}>
                    <expert.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-black text-sm uppercase italic tracking-tighter">{expert.name}</p>
                    <p className={cn("text-[9px] font-mono uppercase", expert.color)}>{expert.role}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Panel Central - Input */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-[#0d1421] rounded-[40px] p-8 border border-white/10 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <Sparkles className="w-24 h-24 text-cyan-400" />
              </div>

              <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-2">¿Qué quieres consultar hoy?</h2>
              <p className="text-white/40 text-sm mb-8">Plantea un desafío de negocio basado en tus métricas actuales.</p>

              <div className="flex flex-col gap-4">
                <textarea
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  placeholder="Ej: ¿Cómo podemos optimizar la estructura si tenemos 31 pros y solo 1 cliente activo?"
                  className="w-full bg-[#161f2e] border border-white/10 rounded-3xl p-6 h-48 focus:outline-none focus:border-cyan-500/50 text-white placeholder-white/20 transition-all resize-none shadow-inner"
                />
                <button
                  onClick={iniciarConsulta}
                  disabled={isAnalysing || selectedExperts.length === 0 || !queryText.trim()}
                  className={cn(
                    "w-full py-5 rounded-3xl flex items-center justify-center gap-3 transition-all active:scale-95 group font-black uppercase italic tracking-widest",
                    isAnalysing || selectedExperts.length === 0 || !queryText.trim()
                      ? "bg-white/5 text-white/20 cursor-not-allowed"
                      : "bg-blue-600 text-white shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:bg-blue-500"
                  )}
                >
                  {isAnalysing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-6 h-6 group-hover:translate-y-[-2px] transition-transform" />
                      Iniciar Sesión de Expertos
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Resultado Área */}
            <div className="bg-black/40 rounded-[40px] border-2 border-dashed border-white/10 h-64 flex flex-col items-center justify-center text-white/20 p-8 text-center">
              <AnimatePresence mode="wait">
                {isAnalysing ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <div className="relative">
                      <Brain className="w-16 h-16 text-cyan-400 animate-pulse" />
                      <div className="absolute inset-0 bg-cyan-400/20 blur-xl animate-pulse rounded-full" />
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-400">
                      Sincronizando mentes maestras...
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <div className="grid grid-cols-4 gap-3 opacity-20">
                      {selectedExperts.length > 0 ? (
                        experts.filter(e => selectedExperts.includes(e.id)).map(e => (
                          <e.icon key={e.id} className="w-8 h-8" />
                        ))
                      ) : (
                        <Users className="w-12 h-12" />
                      )}
                    </div>
                    <p className="uppercase tracking-[0.2em] text-[11px] font-black italic max-w-xs">
                      Selecciona tus expertos e inicia la consulta estratégica
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExpertAudition;
