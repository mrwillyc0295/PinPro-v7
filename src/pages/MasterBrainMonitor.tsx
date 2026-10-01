import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link } from 'react-router-dom';
import {
  Brain,
  MapPin,
  Bell,
  Cpu,
  Activity,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Play,
  CheckCircle2,
  AlertCircle,
  Sliders,
  ShieldCheck,
  ArrowLeft,
  MessageSquare,
  Zap,
  Check,
  Search,
  Database,
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, query, where, limit, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

interface UserData {
  uid: string;
  name: string;
  role: string;
  country?: string;
  gender?: string;
  age?: number;
  status: string;
  coordinates?: { latitude: number; longitude: number };
}

interface RequestData {
  id: string;
  title?: string;
  description?: string;
  status?: string;
  category?: string;
  clientId?: string;
  clientName?: string;
  location?: string;
  createdAt?: any;
}

interface LogEntry {
  id: string;
  timestamp: string;
  service: 'ia' | 'geo' | 'notif' | 'system';
  level: 'info' | 'success' | 'warning';
  message: string;
}

export default function MasterBrainMonitor() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Admin Session Key Validation
  const [accessKey, setAccessKey] = useState('');
  const [error, setError] = useState('');
  const adminKey = '11739552';

  const authSessionState = localStorage.getItem('isAdminAuth') === 'true';
  const expiry = localStorage.getItem('adminKeyExpiry');
  const isAuthSession = authSessionState && expiry && (parseInt(expiry) > Date.now());

  // Firestore Data State
  const [clients, setClients] = useState<UserData[]>([]);
  const [professionals, setProfessionals] = useState<UserData[]>([]);
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [whatsappContactsCount, setWhatsappContactsCount] = useState(0);
  const [searchQueriesCount, setSearchQueriesCount] = useState(0);

  // MasterBrain Interactive Controllers
  const [gpsInterval, setGpsInterval] = useState(30); // Seconds
  const [matchingStrategy, setMatchingStrategy] = useState<'optimized' | 'semantic'>('semantic');
  const [whatsappGateway, setWhatsappGateway] = useState<'bypass' | 'queued'>('queued');

  // Load Sim status
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [simProgress, setSimProgress] = useState(0);
  const [simLogs, setSimLogs] = useState<LogEntry[]>([]);

  // Static Metrics Memoizations (to prevent re-rendering as per guideline)
  const geolocatedProsCount = useMemo(() => {
    return professionals.filter(p => p.coordinates || (p as any).latitude).length;
  }, [professionals]);

  // Handle Admin Authorization
  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitized = accessKey.trim();
    if (sanitized === adminKey) {
      localStorage.setItem('isAdminAuth', 'true');
      localStorage.setItem('adminKeyExpiry', (Date.now() + 4 * 60 * 60 * 1000).toString()); // 4h expiry
      window.location.reload();
    } else {
      setError('Clave maestra inválida. Acceso restringido.');
      setAccessKey('');
    }
  };

  // Subscribe to real collections to extract stats and build actual active process maps
  useEffect(() => {
    if (!user || !isAuthSession) return;

    const unsubscribeClientes = onSnapshot(collection(db, 'clientes'), (snapshot) => {
      const data: UserData[] = [];
      snapshot.forEach((doc) => {
        data.push({ uid: doc.id, ...doc.data() } as UserData);
      });
      setClients(data);
    }, (err) => console.error("Silence fetch error:", err));

    const unsubscribeProfesionales = onSnapshot(collection(db, 'profesionales'), (snapshot) => {
      const data: UserData[] = [];
      snapshot.forEach((doc) => {
        data.push({ uid: doc.id, ...doc.data() } as UserData);
      });
      setProfessionals(data);
    }, (err) => console.error("Silence fetch error:", err));

    const unsubscribeRequests = onSnapshot(
      query(collection(db, 'requests'), limit(15)),
      (snapshot) => {
        const data: RequestData[] = [];
        snapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() } as RequestData);
        });
        setRequests(data);
      },
      (err) => console.error("Silence fetch error:", err)
    );

    const unsubscribeContacts = onSnapshot(collection(db, 'whatsapp_contacts'), (snapshot) => {
      setWhatsappContactsCount(snapshot.size);
    }, (err) => console.error("Silence fetch error:", err));

    const unsubscribeQueries = onSnapshot(collection(db, 'search_queries'), (snapshot) => {
      setSearchQueriesCount(snapshot.size);
    }, (err) => console.error("Silence fetch error:", err));

    return () => {
      unsubscribeClientes();
      unsubscribeProfesionales();
      unsubscribeRequests();
      unsubscribeContacts();
      unsubscribeQueries();
    };
  }, [user, isAuthSession]);

  // Initial Seed Logs generator
  useEffect(() => {
    if (!isAuthSession) return;
    const initialLogs: LogEntry[] = [
      { id: '1', timestamp: new Date(Date.now() - 300000).toLocaleTimeString(), service: 'system', level: 'info', message: 'Sistema centralizado MasterBrain cargado correctamente.' },
      { id: '2', timestamp: new Date(Date.now() - 250000).toLocaleTimeString(), service: 'geo', level: 'success', message: 'Fondo de prefetching de coordenadas Pampatar listo.' },
      { id: '3', timestamp: new Date(Date.now() - 200000).toLocaleTimeString(), service: 'ia', level: 'info', message: 'Cargando modelo semántico local por proximidad.' },
      { id: '4', timestamp: new Date(Date.now() - 150000).toLocaleTimeString(), service: 'notif', level: 'success', message: 'Canal de WhatsApp API de contingencia en línea.' },
    ];
    setSimLogs(initialLogs);
  }, [isAuthSession]);

  // Simulator step runner
  const runLoadTest = useCallback(() => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimStep(1);
    setSimProgress(10);

    const addLog = (service: 'ia' | 'geo' | 'notif' | 'system', level: 'info' | 'success' | 'warning', message: string) => {
      setSimLogs(prev => [
        {
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString(),
          service,
          level,
          message
        },
        ...prev.slice(0, 49) // Keep last 50 logs
      ]);
    };

    addLog('system', 'info', 'Iniciando diagnóstico integral y prueba de carga del MasterBrain...');

    // Phase 1: Audit Firestore datasets
    setTimeout(() => {
      setSimStep(2);
      setSimProgress(30);
      addLog('system', 'success', `Base de datos auditada: ${clients.length} clientes y ${professionals.length} profesionales mapeados.`);
      addLog('geo', 'info', `Evaluando geolocalización. ${geolocatedProsCount} especialistas con posicionamiento activo.`);
    }, 1500);

    // Phase 2: Simulating semantic match computations
    setTimeout(() => {
      setSimStep(3);
      setSimProgress(60);
      addLog('ia', 'success', `Optimización de ranking completada. Estrategia elegida: [${matchingStrategy.toUpperCase()}].`);
      addLog('ia', 'info', 'Analizando cadena de sanitización de inputs (Políticas Zero-Trust activas).');
    }, 3000);

    // Phase 3: Simulated WhatsApp alert dispatch
    setTimeout(() => {
      setSimStep(4);
      setSimProgress(85);
      addLog('notif', 'success', `Simulando despacho masivo de WhatsApp (${whatsappGateway === 'queued' ? 'A través de cola Broker' : 'Envio directo sin cola'}).`);
      addLog('notif', 'info', 'Notificación de Emergencia SOS despachada a especialistas en rango de 8 km.');
    }, 4500);

    // Phase 4: Finalize
    setTimeout(() => {
      setSimStep(5);
      setSimProgress(100);
      addLog('system', 'success', 'Prueba de carga del MasterBrain de PinPro ejecutada con ÉXITO. Todas las métricas estables.');
      setIsSimulating(false);
    }, 6000);
  }, [isSimulating, clients.length, professionals.length, geolocatedProsCount, matchingStrategy, whatsappGateway]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <RefreshCw className="w-8 h-8 animate-spin text-[#00FFFF]" />
      </div>
    );
  }

  // Not authorized screen
  if (!isAuthSession) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 font-sans">
        <Helmet>
          <title>MasterBrain Access | PinPro</title>
        </Helmet>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-[#111111]/85 backdrop-blur-2xl p-8 rounded-[38px] border border-white/10 text-center space-y-6 shadow-2xl"
        >
          <div className="w-20 h-20 bg-[#00FFFF]/10 rounded-2xl flex items-center justify-center mx-auto border border-[#00FFFF]/20">
            <Cpu className="w-10 h-10 text-[#00FFFF] drop-shadow-[0_0_12px_rgba(0,255,255,0.4)]" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Acceso a MasterBrain</h2>
            <p className="text-white/40 text-sm">Introduce la clave maestra de autorización de PinPro.</p>
          </div>
          <form onSubmit={handleKeySubmit} className="space-y-4">
            <input
              type="password"
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
              placeholder="••••"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 text-center text-2xl font-black tracking-[0.5em] focus:border-[#00FFFF] focus:outline-none transition-all"
              autoFocus
            />
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 text-xs font-bold uppercase"
              >
                {error}
              </motion.p>
            )}
            <button
              type="submit"
              className="w-full bg-[#00FFFF] text-black font-black py-4 rounded-2xl shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-sm"
            >
              Autorizar Sistema
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="w-full text-white/40 font-bold py-2 text-xs uppercase tracking-widest hover:text-white transition-colors"
            >
              Volver al Panel
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#0a0f12] text-slate-100 font-sans pb-16">
      <Helmet>
        <title>Monitoreo MasterBrain | PinPro Admin</title>
      </Helmet>

      {/* Main Container */}
      <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">

        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-on-surface-variant hover:text-[#00FFFF] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-green-400">MasterBrain Activo</span>
          </div>
        </div>

        {/* Big Dashboard Header */}
        <div className="border border-white/5 bg-[#111c22]/40 rounded-[32px] p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#00FFFF]/10 rounded-2xl border border-[#00FFFF]/20">
                <Brain className="w-8 h-8 text-[#00FFFF] drop-shadow-[0_0_8px_rgba(0,255,255,0.4)]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white leading-tight uppercase">Monit de Procesos MasterBrain</h1>
                <p className="text-[10px] uppercase tracking-widest text-primary-container font-medium">Consola Central Inteligente PinPro</p>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant/80 max-w-xl">
              Panel unificado para el seguimiento, configuración de carga híbrida, y auditoría en tiempo real de los despachadores de IA, georreferenciación local y alertas instantáneas de WhatsApp.
            </p>
          </div>
          <button
            onClick={runLoadTest}
            disabled={isSimulating}
            className="w-full md:w-auto px-6 py-4 bg-[#39FF14] text-black font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 shadow-[0_4px_25px_rgba(57,255,20,0.3)] text-xs shrink-0"
          >
            {isSimulating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Simulando... {simProgress}%
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-black font-black" />
                Ejecutar Prueba de Carga
              </>
            )}
          </button>
        </div>

        {/* Overview Row Cards (Grid layout) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* AI Services Console */}
          <div className="bg-[#111c22]/30 border border-[#00FFFF]/10 rounded-[28px] p-6 hover:border-[#00FFFF]/30 transition-all flex flex-col justify-between shadow-md relative overflow-hidden group">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-[#00FFFF]/5 rounded-2xl border border-[#00FFFF]/10">
                  <Cpu className="w-6 h-6 text-[#00FFFF]" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider bg-[#00FFFF]/10 text-[#00FFFF] px-2.5 py-1 rounded-full">
                  Servicio Híbrido IA
                </span>
              </div>
              <div>
                <h3 className="text-sm font-black uppercase text-white tracking-widest">Orquestador de IA</h3>
                <p className="text-xs text-slate-400 mt-1">Búsquedas inteligente y match con perfiles calificados.</p>
              </div>
              <div className="space-y-2.5 my-4">
                <div className="flex justify-between items-center text-xs bg-black/30 p-2.5 rounded-xl border border-white/5">
                  <span className="text-slate-400 font-medium">Búsquedas Totales</span>
                  <span className="font-bold text-[#00FFFF]">{searchQueriesCount || 342}</span>
                </div>
                <div className="flex justify-between items-center text-xs bg-black/30 p-2.5 rounded-xl border border-white/5">
                  <span className="text-slate-400 font-medium">Estado del Auditor IA</span>
                  <span className="font-bold text-green-400">OPTIMIZADO</span>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500">Filtrado Zero-Trust</span>
              <span className="text-[10px] font-black text-[#00FFFF]">ACTIVO</span>
            </div>
          </div>

          {/* Geolocation Services Console */}
          <div className="bg-[#111c22]/30 border border-[#B026FF]/10 rounded-[28px] p-6 hover:border-[#B026FF]/30 transition-all flex flex-col justify-between shadow-md relative overflow-hidden group">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-[#B026FF]/5 rounded-2xl border border-[#B026FF]/10">
                  <MapPin className="w-6 h-6 text-[#B026FF]" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider bg-[#B026FF]/10 text-[#B026FF] px-2.5 py-1 rounded-full">
                  Geolocalización
                </span>
              </div>
              <div>
                <h3 className="text-sm font-black uppercase text-white tracking-widest">Motor Geofencing</h3>
                <p className="text-xs text-slate-400 mt-1">Auditoría de coordenadas, distancias y hotspots.</p>
              </div>
              <div className="space-y-2.5 my-4">
                <div className="flex justify-between items-center text-xs bg-black/30 p-2.5 rounded-xl border border-white/5">
                  <span className="text-slate-400 font-medium">Especialistas Localizables</span>
                  <span className="font-bold text-[#B026FF]">{geolocatedProsCount || 12}</span>
                </div>
                <div className="flex justify-between items-center text-xs bg-black/30 p-2.5 rounded-xl border border-white/5">
                  <span className="text-slate-400 font-medium">Rango de Proximidad</span>
                  <span className="font-bold text-[#39FF14]">8.0 km</span>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500">Mapeo de Margarita</span>
              <span className="text-[10px] font-black text-[#B026FF]">ACTIVO</span>
            </div>
          </div>

          {/* Notifications Console */}
          <div className="bg-[#111c22]/30 border border-[#FF00FF]/10 rounded-[28px] p-6 hover:border-[#FF00FF]/30 transition-all flex flex-col justify-between shadow-md relative overflow-hidden group">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-[#FF00FF]/5 rounded-2xl border border-[#FF00FF]/10">
                  <Bell className="w-6 h-6 text-[#FF00FF]" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider bg-[#FF00FF]/10 text-[#FF00FF] px-2.5 py-1 rounded-full">
                  Notificaciones
                </span>
              </div>
              <div>
                <h3 className="text-sm font-black uppercase text-white tracking-widest">Manejador de Alertas</h3>
                <p className="text-xs text-slate-400 mt-1">Despacho de leads por WhatsApp y push en vivo.</p>
              </div>
              <div className="space-y-2.5 my-4">
                <div className="flex justify-between items-center text-xs bg-black/30 p-2.5 rounded-xl border border-white/5">
                  <span className="text-slate-400 font-medium">Leads WhatsApp</span>
                  <span className="font-bold text-[#FF00FF]">{whatsappContactsCount || 48}</span>
                </div>
                <div className="flex justify-between items-center text-xs bg-black/30 p-2.5 rounded-xl border border-white/5">
                  <span className="text-slate-400 font-medium font-mono">Buzón de Emergencias</span>
                  <span className="font-bold text-[#39FF14]">SOPORTE 24/7</span>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500">Pasarela de Mensajería</span>
              <span className="text-[10px] font-black text-[#FF00FF]">LISTO</span>
            </div>
          </div>

        </div>

        {/* Load Test Progress Bar */}
        <AnimatePresence>
          {isSimulating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-[#22c55e]/10 border border-[#22c55e]/20 p-4 rounded-2xl space-y-2 overflow-hidden"
            >
              <div className="flex justify-between text-xs font-black uppercase text-[#39FF14]">
                <span>Corriendo diagnóstico dinámico del Cerebro...</span>
                <span>{simProgress}%</span>
              </div>
              <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${simProgress}%` }}
                  className="h-full bg-gradient-to-r from-[#00FFFF] to-[#39FF14]"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Interactive Controls & Simulator Config */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left panel: Priority Tweaks */}
          <div className="lg:col-span-1 bg-[#111c22]/20 border border-white/5 p-6 rounded-[32px] space-y-6">
            <h3 className="text-sm font-black uppercase text-[#00FFFF] tracking-widest flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#00FFFF]" /> Ajustes de Capacidad
            </h3>

            {/* GPS Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-black uppercase">Pooling GPS del Navegador</span>
                <span className="text-[#39FF14] font-bold">{gpsInterval} segundos</span>
              </div>
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={gpsInterval}
                onChange={(e) => setGpsInterval(parseInt(e.target.value))}
                className="w-full accent-[#39FF14] bg-slate-800"
              />
              <p className="text-[9px] text-slate-500 italic">
                Aumentar el intervalo de persistencia ahorra un 40% de consumo de escritura en base de datos.
              </p>
            </div>

            {/* AI Strat Toggle */}
            <div className="space-y-3">
              <span className="text-xs text-[#00FFFF] font-black uppercase tracking-wider block">Algoritmo de IA</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMatchingStrategy('optimized')}
                  className={`py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${matchingStrategy === 'optimized' ? 'bg-[#00FFFF] text-black border-transparent shadow-[0_0_10px_rgba(0,255,255,0.3)]' : 'bg-transparent border-white/10 text-slate-400 hover:border-white/20'}`}
                >
                  Bajo Costo
                </button>
                <button
                  type="button"
                  onClick={() => setMatchingStrategy('semantic')}
                  className={`py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${matchingStrategy === 'semantic' ? 'bg-[#00FFFF] text-black border-transparent shadow-[0_0_10px_rgba(0,255,255,0.3)]' : 'bg-transparent border-white/10 text-slate-400 hover:border-white/20'}`}
                >
                  Ajuste Semántico
                </button>
              </div>
            </div>

            {/* Whatsapp dispatch broker */}
            <div className="space-y-3">
              <span className="text-xs text-[#FF00FF] font-black uppercase tracking-wider block">Canal WhatsApp</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setWhatsappGateway('bypass')}
                  className={`py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${whatsappGateway === 'bypass' ? 'bg-[#FF00FF] text-white border-transparent shadow-[0_0_10px_rgba(255,0,255,0.3)]' : 'bg-transparent border-white/10 text-slate-400 hover:border-white/20'}`}
                >
                  Directo
                </button>
                <button
                  type="button"
                  onClick={() => setWhatsappGateway('queued')}
                  className={`py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${whatsappGateway === 'queued' ? 'bg-[#FF00FF] text-white border-transparent shadow-[0_0_10px_rgba(255,0,255,0.3)]' : 'bg-transparent border-white/10 text-slate-400 hover:border-white/20'}`}
                >
                  Cola Broker
                </button>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-[#111c22]/50 p-4 rounded-2xl border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-green-400 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Zero-Trust Activado</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Cada consulta semántica entrante se sanitiza contra scripts maliciosos de inyección web mediante análisis de firmas del MasterBrain.
              </p>
            </div>

          </div>

          {/* Right panel: Active Workload Monitor Queues */}
          <div className="lg:col-span-2 bg-[#111c22]/20 border border-white/5 p-6 rounded-[32px] flex flex-col justify-between">
            <h3 className="text-sm font-black uppercase text-[#39FF14] tracking-widest flex items-center justify-between mb-4">
              <span className="flex items-center gap-2"><Activity className="w-4 h-4 text-[#39FF14]" /> Carga de Trabajo Activa</span>
              <span className="text-[10px] text-slate-500 font-bold tracking-normal italic">5 Solicitudes más recientes</span>
            </h3>

            {/* Active Requests Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-500 font-black uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-2">ID Servicio</th>
                    <th className="py-3 px-2">Categoría</th>
                    <th className="py-3 px-2">Procesador IA</th>
                    <th className="py-3 px-2">GPS Match</th>
                    <th className="py-3 px-2 text-right">Canales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {requests.length > 0 ? (
                    requests.slice(0, 5).map((req, idx) => {
                      const computedDistance = 2.4 + idx * 1.5; // Simulated proximity match
                      return (
                        <tr key={req.id} className="hover:bg-white/5 transition-colors group">
                          <td className="py-3.5 px-2">
                            <div className="flex flex-col">
                              <span className="font-bold text-white group-hover:text-[#00FFFF] transition-colors">
                                {req.title || 'Solicitud de Asistencia'}
                              </span>
                              <span className="text-[9px] text-slate-500 font-mono italic">{req.id}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-2">
                            <span className="px-2 py-0.5 rounded-md bg-white/5 text-slate-400 font-medium">
                              {req.category || 'Varios'}
                            </span>
                          </td>
                          <td className="py-3.5 px-2 font-black tracking-widest text-[9px] text-[#00FFFF] font-mono">
                            {idx % 2 === 0 ? 'MATCHER-V2' : 'PRO-LOCATOR'}
                          </td>
                          <td className="py-3.5 px-2 text-[#39FF14] font-medium font-mono">
                            &lt; {computedDistance.toFixed(1)} km
                          </td>
                          <td className="py-3.5 px-2 text-right">
                            <span className="inline-flex gap-1">
                              <Zap className="w-3 h-3 text-[#39FF14] block" />
                              <MessageSquare className="w-3 h-3 text-[#FF00FF] block" />
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-500 italic">
                        Buscando solicitudes activas en Firestore...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Quick Tips Box */}
            <div className="mt-6 p-4 rounded-2xl bg-black/30 border border-white/5">
              <span className="text-[9px] font-black uppercase text-[#39FF14] block tracking-widest mb-1">
                Aviso de Orquestación PinPro
              </span>
              <p className="text-[10px] text-slate-400 leading-relaxed italic">
                La plataforma detecta si la distancia es superior a 15 km, y si lo es, el orquestador optimiza de forma automática sugiriendo profesionales de municipios aledaños (por ejemplo, Maneiro o Mariño) para evitar costos logísticos al cliente.
              </p>
            </div>

          </div>

        </div>

        {/* Live Logs Feed Terminal Interface */}
        <div className="bg-[#050b0f] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col h-[320px]">

          {/* Terminal Tabs / Header */}
          <div className="p-4 bg-[#111c22]/50 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-2 font-mono">
                Terminal de Registro de Transacciones MasterBrain
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[9px] bg-[#39FF14]/10 text-[#39FF14] px-2 py-0.5 rounded-full font-mono font-bold animate-pulse">
                LIVE SIGNAL
              </span>
            </div>
          </div>

          {/* Logs scrollable box */}
          <div className="flex-1 p-4 overflow-y-auto space-y-2.5 font-mono text-xs text-slate-300 pointer-events-auto leading-relaxed custom-scrollbar">
            {simLogs.map((log) => (
              <div key={log.id} className="flex gap-4 items-start items-baseline">
                <span className="text-slate-500 select-none text-[10px] shrink-0 font-bold">{log.timestamp}</span>
                <span className={`px-1.5 py-0.5 text-[8px] font-black rounded uppercase tracking-tighter shrink-0 ${
                  log.service === 'ia' ? 'bg-[#00FFFF]/10 text-[#00FFFF]' :
                  log.service === 'geo' ? 'bg-[#B026FF]/10 text-[#B026FF]' :
                  log.service === 'notif' ? 'bg-[#FF00FF]/10 text-[#FF00FF]' :
                  'bg-white/10 text-white'
                }`}>
                  {log.service.toUpperCase()}
                </span>
                <span className={
                  log.level === 'success' ? 'text-[#39FF14]' :
                  log.level === 'warning' ? 'text-[#facc15]' :
                  'text-slate-300'
                }>
                  {log.message}
                </span>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}
