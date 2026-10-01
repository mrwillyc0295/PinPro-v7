import React, { useState, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users,
  Map,
  Layers,
  ShieldCheck,
  BadgeCheck,
  Percent,
  DollarSign,
  Cpu,
  Copy,
  CheckCircle2,
  Share2,
  Zap,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Search,
  Check,
  Smartphone,
  ChevronDown,
  Info,
  ExternalLink,
  Target,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

// Types definition matching the auth_structure payload
interface RoleConfig {
  landing_route: string;
  map_visibility: string;
  capabilities?: {
    can_view_all_professionals: boolean;
    can_view_all_client_requirements: boolean;
    action: string;
    monetization: {
      type: string;
      suggested_fee: string;
    }
  }
}

export default function DashboardReferidor() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // 1. Roles Structure Matrix defined exactly from user prompt
  const baseAuthStructure = {
    CLIENTE: {
      landing_route: "/crear-requerimiento",
      map_visibility: "ver_profesionales_cercanos"
    },
    PROFESIONAL: {
      landing_route: "/completar-perfil-tecnico",
      map_visibility: "ver_requerimientos_de_clientes"
    },
    REFERIDOR: {
      landing_route: "/dashboard-referidor",
      map_visibility: "FULL_ACCESS",
      capabilities: {
        can_view_all_professionals: true,
        can_view_all_client_requirements: true,
        action: "generar_enlace_de_referencia_compartible",
        monetization: {
          type: "comision_por_match_exitoso",
          suggested_fee: "10%_del_presupuesto_del_trabajo"
        }
      }
    }
  };

  // State management
  const [activeRoleSim, setActiveRoleSim] = useState<'CLIENTE' | 'PROFESIONAL' | 'REFERIDOR'>('REFERIDOR');
  const [copiedCode, setCopiedCode] = useState(false);
  const [shareLinkActive, setShareLinkActive] = useState(false);

  // Referral Sandbox interactive list
  const [matches, setMatches] = useState([
    {
      id: "REF-2026-Margarita-099",
      referrer_user_id: user?.uid || "user_id_del_referidor",
      referrer_name: profile?.name || "Willy C. (Partner)",
      requirement_id: "REQ-2026-NE-001",
      requirement_title: "Reparación de Aire Acondicionado Split 12K BTU - Pampatar",
      professional_id: "prof_id_recomendado",
      professional_name: "Ing. Marcos Mendoza (FrioTec)",
      tracking_status: "en_negociacion",
      estimated_payout: "$3.00 - $5.00"
    },
    {
      id: "REF-2026-Margarita-102",
      referrer_user_id: user?.uid || "user_id_del_referidor",
      referrer_name: profile?.name || "Willy C. (Partner)",
      requirement_id: "REQ-2026-NE-004",
      requirement_title: "Mantenimiento Eléctrico Residencial - Porlamar Centro",
      professional_id: "prof-004",
      professional_name: "Téc. Juan Carlos Silva",
      tracking_status: "completado",
      estimated_payout: "$6.50"
    }
  ]);

  // Form states to create a new live referral
  const [reqTitle, setReqTitle] = useState('');
  const [proName, setProName] = useState('');
  const [estimatedBudget, setEstimatedBudget] = useState(40);
  const [showAddForm, setShowAddForm] = useState(false);

  // Dynamic calculations based on monetization configurations (suggested_fee: 10% del presupuesto)
  const computedTotalEarnings = useMemo(() => {
    return matches
      .filter(m => m.tracking_status === 'completado')
      .reduce((sum, current) => {
        const value = parseFloat(current.estimated_payout.replace(/[^0-9.]/g, ''));
        return sum + (isNaN(value) ? 5.0 : value);
      }, 0.0);
  }, [matches]);

  const computedPendingEarnings = useMemo(() => {
    return matches
      .filter(m => m.tracking_status === 'en_negociacion')
      .reduce((sum) => sum + 4.0, 0.0); // static fallback pending valuation
  }, [matches]);

  // Code copying link simulator callback
  const handleCopyLink = useCallback(() => {
    const customLink = `https://pinpro.app/join?ref=${profile?.referralCode || 'PINPRO'}&role=REFERIDOR`;
    navigator.clipboard.writeText(customLink);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }, [profile?.referralCode]);

  // Simulation handler to upgrade status of referral match
  const handleAdvanceStatus = (matchId: string) => {
    setMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        const nextStatus = m.tracking_status === 'en_negociacion' ? 'completado' : 'en_negociacion';
        return {
          ...m,
          tracking_status: nextStatus,
          // If upgraded to completed, lock the payout
          estimated_payout: nextStatus === 'completado' ? '$4.50' : '$3.00 - $5.00'
        };
      }
      return m;
    }));
  };

  // Add customized referral action
  const handleCreateReferral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTitle.trim() || !proName.trim()) return;

    const customId = `REF-2026-Margarita-${Math.floor(100 + Math.random() * 900)}`;
    const payoutAmount = (estimatedBudget * 0.1).toFixed(2); // 10% of budget

    const newMatch = {
      id: customId,
      referrer_user_id: user?.uid || "user_id_del_referidor",
      referrer_name: profile?.name || "Willy C. (Partner)",
      requirement_id: `REQ-2026-NE-${Math.floor(10 + Math.random() * 89)}`,
      requirement_title: reqTitle.trim(),
      professional_id: `prof-${Math.floor(100 + Math.random() * 900)}`,
      professional_name: proName.trim(),
      tracking_status: "en_negociacion",
      estimated_payout: `$${payoutAmount}`
    };

    setMatches(prev => [newMatch, ...prev]);
    setReqTitle('');
    setProName('');
    setEstimatedBudget(40);
    setShowAddForm(false);
  };

  return (
    <div className="relative min-h-screen bg-[#070b0e] text-slate-100 font-sans pb-16">
      <Helmet>
        <title>Socio Referidor | PinPro Live</title>
      </Helmet>

      {/* Hero Banner Grid Accent */}
      <div className="absolute top-0 inset-x-0 h-80 bg-gradient-to-b from-[#00FFFF]/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">

        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#B026FF] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Programa de Socios Estratégicos
            </span>
            <h1 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">
              Dashboard de <span className="text-[#00FFFF] drop-shadow-[0_0_8px_rgba(0,255,255,0.3)]">Referidores</span>
            </h1>
            <p className="text-xs text-slate-400">
              Gana dinero con un solo click
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-2 rounded-2xl">
            <BadgeCheck className="w-5 h-5 text-[#39FF14]" />
            <div className="text-left">
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Identidad de Socio</p>
              <p className="text-[10px] font-black text-white">{profile?.name || 'Willy C (Referidor)'}</p>
            </div>
          </div>
        </div>

        {/* Quick Link Generator Block (generar_enlace_de_referencia_compartible capability) */}
        <div className="bg-gradient-to-r from-[#111c22] to-[#0d161a] border border-[#00FFFF]/20 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#00FFFF]/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex gap-2 items-center bg-[#00FFFF]/10 text-[#00FFFF] border border-[#00FFFF]/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                <Percent className="w-3.5 h-3.5" /> Ganancia de 10% por Match Exitoso
              </div>
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">Enlace del Programa de Socios</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Invita a nuevos profesionales o clientes. Al registrarse con tu link, se asociarán a tu cartera y recibirás automáticamente un <strong className="text-white">10% de comisión</strong> del presupuesto de cada servicio consolidado.
              </p>
            </div>

            <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch gap-3 shrink-0">
              <div className="bg-black/50 border border-white/10 px-4 py-3.5 rounded-2xl flex items-center justify-between gap-4 font-mono text-xs text-[#00FFFF]">
                <span>https://pinpro.app/join?ref={profile?.referralCode || 'PINPRO'}&role=REFERIDOR</span>
              </div>
              <button
                onClick={handleCopyLink}
                className="px-6 py-4 bg-[#00FFFF] text-black font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(0,255,255,0.3)] shrink-0"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-4 h-4 text-black font-bold" /> Código Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-black" /> Copiar Enlace
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Core Layout: Grid containing Interactive Roles Matrix and Referral Activity Sandbox */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Columns (Col Span 2): Sandbox & Match Tracking Console */}
          <div className="lg:col-span-2 space-y-6">

            {/* Header for Sandbox */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#39FF14]" /> Historial de Matches y Comisiones
                </h3>
                <p className="text-xs text-slate-400">Simulación y auditoría en tiempo real de leads asignados y pagos estimados en curso.</p>
              </div>

              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/30 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#39FF14] hover:text-black transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Registrar Match Manual
              </button>
            </div>

            {/* Quick stats panel */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-[#111c22]/50 border border-white/5 p-4 rounded-2xl text-center flex flex-col justify-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Registros Referidos</span>
                <span className="text-2xl font-black text-white mt-1">{matches.length * 2 + 1}</span>
              </div>
              <div className="bg-[#111c22]/50 border border-[#39FF14]/10 p-4 rounded-2xl text-center flex flex-col justify-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Cobrado (Compensado)</span>
                <span className="text-2xl font-black text-[#39FF14] mt-1">${computedTotalEarnings.toFixed(2)}</span>
              </div>
              <div className="col-span-2 md:col-span-1 bg-[#111c22]/50 border border-[#00FFFF]/10 p-4 rounded-2xl text-center flex flex-col justify-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Pendiente de Cierre</span>
                <span className="text-2xl font-black text-[#00FFFF] mt-1">${computedPendingEarnings.toFixed(2)}</span>
              </div>
            </div>

            {/* Registration Add Match Form Area */}
            <AnimatePresence>
              {showAddForm && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleCreateReferral}
                  className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 space-y-4 overflow-hidden"
                >
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#00FFFF]">Nueva Recomendación Consolidada</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Título del Requerimiento</label>
                      <input
                        type="text"
                        value={reqTitle}
                        onChange={(e) => setReqTitle(e.target.value)}
                        placeholder="Ej. Cambio de Tuberías Porlamar"
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#00FFFF]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Especialista Recomendado</label>
                      <input
                        type="text"
                        value={proName}
                        onChange={(e) => setProName(e.target.value)}
                        placeholder="Ej. Ing. Carlos Salazar"
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#00FFFF]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
                    <div className="w-full sm:w-1/2 space-y-1">
                      <div className="flex justify-between text-[10px] uppercase font-black tracking-widest text-slate-400">
                        <span>Presupuesto Estimado</span>
                        <span className="text-white">${estimatedBudget} USD</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="300"
                        step="10"
                        value={estimatedBudget}
                        onChange={(e) => setEstimatedBudget(parseInt(e.target.value))}
                        className="w-full accent-[#00FFFF]"
                      />
                      <span className="text-[9px] text-[#00FFFF] italic">
                        Matricula sugerida (10% de comisión): ${(estimatedBudget * 0.1).toFixed(2)} USD
                      </span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold uppercase tracking-wider"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-[#00FFFF] text-black font-black hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-[#00FFFF]/20"
                      >
                        Crear Match
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Simulated matches timeline loop */}
            <div className="space-y-4">
              {matches.map((item) => {
                const isCompletado = item.tracking_status === 'completado';
                return (
                  <div
                    key={item.id}
                    className="bg-[#111b22]/30 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden group shadow-md"
                  >
                    {/* Status accent side bar */}
                    <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${isCompletado ? 'bg-[#39FF14]' : 'bg-yellow-500'}`} />

                    <div className="ml-2 space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-slate-400 bg-black/40 px-2 py-0.5 rounded border border-white/5 uppercase">
                          {item.id}
                        </span>

                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                          isCompletado
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                        }`}>
                          {isCompletado ? 'Match Completado' : 'En Negociación'}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-black text-white">{item.requirement_title}</h4>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#00FFFF]" />
                          Recomendado a: <strong className="text-slate-300 font-bold">{item.professional_name}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-4 pt-1 text-[10px] text-slate-400">
                        <span>Origen: <strong className="text-white">Isla de Margarita</strong></span>
                        <span>Código Socio: <strong className="text-[#00FFFF]">REF-PRO-2026</strong></span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end text-right shrink-0 mt-2 sm:mt-0">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Honorario Referidor</p>
                      <p className="text-xl font-black text-[#39FF14] drop-shadow-[0_0_8px_rgba(57,255,20,0.2)]">{item.estimated_payout}</p>

                      <button
                        onClick={() => handleAdvanceStatus(item.id)}
                        className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-[#00FFFF] hover:text-white transition-colors uppercase font-mono tracking-wider"
                      >
                        {isCompletado ? (
                          <>Reabrir Conversación <ArrowRight className="w-3 h-3" /></>
                        ) : (
                          <>Marcar como Completado <Check className="w-3 h-3" /></>
                        )}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>

          {/* Right Column: Roles Matrix Explorer Block */}
          <div className="bg-[#111c22]/15 border border-white/5 rounded-[32px] p-6 space-y-6">

            <div className="space-y-1">
              <h3 className="text-sm font-black uppercase text-[#B026FF] tracking-widest flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#B026FF]" /> Matriz de Accesos de Roles
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Audita la visibilidad del mapa interactivo y los controles según la estructura de roles configurada en PinPro Live.
              </p>
            </div>

            {/* Selector list of roles to view their profile behavior */}
            <div className="bg-black/40 p-1.5 rounded-2xl border border-white/5 grid grid-cols-3 gap-1">
              {(['CLIENTE', 'PROFESIONAL', 'REFERIDOR'] as const).map((roleName) => (
                <button
                  key={roleName}
                  type="button"
                  onClick={() => setActiveRoleSim(roleName)}
                  className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeRoleSim === roleName ? 'bg-gradient-to-r from-[#00FFFF] to-[#B026FF] text-white font-black' : 'text-slate-400 hover:text-white bg-transparent'}`}
                >
                  {roleName}
                </button>
              ))}
            </div>

            {/* Display configuration for mock selection */}
            <div className="space-y-4">
              <div className="bg-black/20 border border-white/5 p-4 rounded-2xl space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Ruta de Aterrizaje</span>
                  <span className="text-xs font-bold text-white font-mono">{baseAuthStructure[activeRoleSim].landing_route}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Visibilidad de Mapa</span>
                  <span className="text-xs font-bold text-[#00FFFF] font-mono">{baseAuthStructure[activeRoleSim].map_visibility}</span>
                </div>
                {activeRoleSim === 'REFERIDOR' && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#B026FF] block">Habilidades Adicionales</span>
                    <div className="grid grid-cols-1 gap-1.5 text-[10px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                        <span>Ver todos los profesionales (Full)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                        <span>Ver requerimientos de todo tipo (Full)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                        <span>Acción: Generar link de socio local</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Map Virtual Simulation Screen Widget */}
              <div className="bg-[#0a0f12] p-4 rounded-2xl border border-white/15 space-y-3 text-center relative overflow-hidden h-48 flex flex-col justify-between">
                <div className="absolute top-2 left-2 z-10 flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <div className="w-2 h-2 rounded-full bg-[#00FFFF]"></div>
                </div>

                <div className="absolute inset-0 bg-[radial-gradient(#22d3ee_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

                <div className="flex-1 flex flex-col items-center justify-center p-2 relative z-10 space-y-1.5">
                  <Map className="w-8 h-8 text-[#00FFFF] animate-pulse" />
                  <span className="text-xs text-white uppercase font-black font-sans">Simulando Capas del Mapa</span>
                  <p className="text-[10px] text-slate-300 leading-tight max-w-[220px]">
                    {activeRoleSim === 'CLIENTE' && "Mostrando pines celestes de especialistas de aire, plomería o cerrajería cercanos."}
                    {activeRoleSim === 'PROFESIONAL' && "Filtrando pines verdes: Solo requerimientos con presupuesto listados."}
                    {activeRoleSim === 'REFERIDOR' && "Capas ilimitadas. Vista integrada de clientes de Pampatar y especialistas homologados."}
                  </p>
                </div>

                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wide">
                  {activeRoleSim === 'REFERIDOR' ? "Nivel: Acceso de Red" : "Nivel: Acceso Restringido"}
                </div>
              </div>

            </div>

            {/* Safe Boundary / Zero Trust Notice */}
            <div className="bg-[#111c22]/40 rounded-2xl p-4 border border-white/5 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#39FF14]" />
                <span className="text-[10px] font-black uppercase text-[#39FF14] tracking-widest">Protección Criptográfica</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed italic">
                El algoritmo de ranking consolida tarifas y distancias dentro de la Isla de Margarita sin exponer datos sensibles de contacto ni coordenadas específicas a terceros para evitar hackeos de scraping web.
              </p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
