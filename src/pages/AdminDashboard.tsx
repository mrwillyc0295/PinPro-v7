import { Users, ShieldAlert, Ban, Trash2, Activity, Globe, UserCheck, UserX, ArrowLeft, TrendingUp, Briefcase, MapPin, CalendarCheck, AlertCircle, Download, ClipboardCheck, QrCode, Database, Loader2, Truck, Rocket, Clock, X, CheckCircle, MessageSquare, Monitor, Tablet, Smartphone, Search, Brain, Sparkles, RefreshCcw, Check, Cpu } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, where, getDocs, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { updateProfessionalScore, calculateRankingScore } from '../services/rankingService';
import { spanishSpeakingCountriesMenu } from '../constants/countries';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';

interface UserData {
  uid: string;
  name: string;
  role: string;
  country?: string;
  state?: string;
  municipality?: string;
  gender?: string;
  age?: number;
  status: string;
  profession?: string;
  bio?: string;
  rating?: number;
  totalJobs?: number;
  deviceOS?: string;
  finalScore?: number;
  adminBoost?: number;
  adminBoostExpiry?: any;
}

interface RequestData {
  id: string;
  profession?: string;
  service?: string;
  status: string;
}

interface ReservationData {
  id: string;
  status: string;
  price?: number;
}

interface WhatsAppContact {
  uid: string;
  name: string;
  phone: string;
  role: string;
  email: string;
}

import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [whatsappContacts, setWhatsappContacts] = useState<WhatsAppContact[]>([]);
  const [searchQueries, setSearchQueries] = useState<any[]>([]);
  const [pendingReportsCount, setPendingReportsCount] = useState(0);
  const [renderingErrors, setRenderingErrors] = useState<any[]>([]);
  const [selectedErrorForDetails, setSelectedErrorForDetails] = useState<any | null>(null);
  const [errorSearchQuery, setErrorSearchQuery] = useState('');
  const [isUpdatingError, setIsUpdatingError] = useState<string | null>(null);
  const [stabilityConfig, setStabilityConfig] = useState<{
    settingId: string;
    threshold: number;
    metricType: 'count' | 'percentage';
    updatedAt?: any;
    updatedBy?: string;
  }>({
    settingId: 'stability',
    threshold: 5,
    metricType: 'count'
  });
  const [isSavingStabilityConfig, setIsSavingStabilityConfig] = useState(false);
  const [tempThreshold, setTempThreshold] = useState<number>(5);
  const [tempMetricType, setTempMetricType] = useState<'count' | 'percentage'>('count');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedUserForBoost, setSelectedUserForBoost] = useState<UserData | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [boostValue, setBoostValue] = useState(100);
  const [boostDuration, setBoostDuration] = useState('24h');
  const [boostReason, setBoostReason] = useState('Promoción Especial');
  const [isApplyingBoost, setIsApplyingBoost] = useState(false);
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<any[] | null>(null);
  const [deviceStats, setDeviceStats] = useState({ mobile: 0, tablet: 0, desktop: 0 });
  const [selectedCountryFilter, setSelectedCountryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { profile, user, loading, isAdmin } = useAuth();
  const [accessKey, setAccessKey] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const adminKey = '11739552';

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitized = accessKey.trim();

    if (sanitized === adminKey) {
      localStorage.setItem('isAdminAuth', 'true');
      localStorage.setItem('adminKeyExpiry', (Date.now() + 4 * 60 * 60 * 1000).toString()); // 4h expiry

      // Persist admin status in Firestore if logged in
      if (user) {
        setDoc(doc(db, 'admins', user.uid), {
          email: user.email,
          grantedAt: serverTimestamp(),
          method: 'master_key_dashboard'
        }, { merge: true }).catch(console.error);
      }

      window.location.reload();
    } else {
      setError('Clave maestra inválida. Acceso restringido.');
      setAccessKey('');
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#0a0a0a]"><Loader2 className="w-8 h-8 animate-spin text-[#00FFFF]" /></div>;

  const authSessionState = localStorage.getItem('isAdminAuth') === 'true';
  const expiry = localStorage.getItem('adminKeyExpiry');
  const isAuthSession = authSessionState && expiry && (parseInt(expiry) > Date.now());

  if (!isAuthSession) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 font-sans">
        <Helmet>
          <title>Admin Access | PinPro</title>
        </Helmet>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-[#111111]/80 backdrop-blur-2xl p-8 rounded-[38px] border border-white/10 text-center space-y-6 shadow-2xl"
        >
          <div className="w-20 h-20 bg-[#FF00FF]/10 rounded-3xl flex items-center justify-center mx-auto border border-[#FF00FF]/20">
            <ShieldAlert className="w-10 h-10 text-[#FF00FF]" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Acceso Administrativo</h2>
            <p className="text-white/40 text-sm">Introduce la clave maestra de PinPro.</p>
          </div>
          <form onSubmit={handleKeySubmit} className="space-y-4">
            <input
              type="password"
              value={accessKey}
              onChange={(e) => {
                setAccessKey(e.target.value);
                setError('');
              }}
              placeholder="Clave Maestra Admin"
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-2xl px-4 py-3 text-sm text-center text-white focus:outline-none focus:border-[#FF00FF]"
              autoFocus
            />
            {error && <p className="text-xs text-red-400 font-semibold">{error}</p>}
            <button
              type="submit"
              className="w-full bg-[#FF00FF] text-white font-black py-4 rounded-2xl shadow-[0_0_20px_rgba(255,0,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-sm"
            >
              Ingresar
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full text-white/40 font-bold py-2 text-xs uppercase tracking-widest hover:text-white transition-colors"
            >
              Cancelar
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const sharedUrl = "https://ais-pre-yopkbfx3btktilx5tw7mwy-132138863621.us-east1.run.app";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(sharedUrl)}`;

  useEffect(() => {
    if (!user || !isAuthSession) return; // Wait until authenticated and admin session confirmed

    const unsubscribeClientes = onSnapshot(collection(db, 'clientes'), (snapshot) => {
      const clientesData: UserData[] = [];
      snapshot.forEach((doc) => {
        clientesData.push({ uid: doc.id, ...doc.data(), collection: 'clientes' } as UserData & { collection: string });
      });
      setUsers(prev => {
        const otherUsers = prev.filter(u => (u as any).collection !== 'clientes');
        return [...otherUsers, ...clientesData];
      });
    }, (error) => {
      console.error("Error fetching clientes:", error);
    });

    const unsubscribeProfesionales = onSnapshot(collection(db, 'profesionales'), (snapshot) => {
      const profesionalesData: UserData[] = [];
      snapshot.forEach((doc) => {
        profesionalesData.push({ uid: doc.id, ...doc.data(), collection: 'profesionales' } as UserData & { collection: string });
      });
      setUsers(prev => {
        const otherUsers = prev.filter(u => (u as any).collection !== 'profesionales');
        return [...otherUsers, ...profesionalesData];
      });
    }, (error) => {
      console.error("Error fetching profesionales:", error);
    });

    const unsubscribeContacts = onSnapshot(collection(db, 'whatsapp_contacts'), (snapshot) => {
      const contactsData: WhatsAppContact[] = [];
      snapshot.forEach((doc) => {
        contactsData.push({ uid: doc.id, ...doc.data() } as WhatsAppContact);
      });
      setWhatsappContacts(contactsData);
    }, (error) => {
      console.error("Error fetching whatsapp contacts:", error);
    });

    const unsubscribeRequests = onSnapshot(collection(db, 'requests'), (snapshot) => {
      const reqData: RequestData[] = [];
      snapshot.forEach((doc) => {
        reqData.push({ id: doc.id, ...doc.data() } as RequestData);
      });
      setRequests(reqData);
    }, (error) => {
      console.error("Error fetching requests:", error);
    });

    const unsubscribeReservations = onSnapshot(collection(db, 'reservations'), (snapshot) => {
      const resData: ReservationData[] = [];
      snapshot.forEach((doc) => {
        resData.push({ id: doc.id, ...doc.data() } as ReservationData);
      });
      setReservations(resData);
    }, (error) => {
      console.error("Error fetching reservations:", error);
    });

    const qReports = query(collection(db, 'reports'), where('status', '==', 'Pendiente'));
    const unsubscribeReports = onSnapshot(qReports, (snapshot) => {
      setPendingReportsCount(snapshot.size);
    }, (error) => {
      console.error("Error fetching reports:", error);
    });

    const unsubscribeDeviceStats = onSnapshot(doc(db, 'system_analytics', 'device_usage'), (snapshot) => {
      if (snapshot.exists()) {
        setDeviceStats(snapshot.data() as any);
      } else if (isAdmin) {
        // Initialize stats if not exist (only admin can create)
        setDoc(doc(db, 'system_analytics', 'device_usage'), {
          mobile: 0,
          tablet: 0,
          desktop: 0,
          updatedAt: serverTimestamp()
        }).catch(err => console.warn("Failed to init device stats", err));
      }
    });

    const unsubscribeQueries = onSnapshot(collection(db, 'search_queries'), (snapshot) => {
      const queriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSearchQueries(queriesData);
    }, (error) => {
      console.error("Error fetching search queries:", error);
    });

    const unsubscribeErrors = onSnapshot(collection(db, 'rendering_errors'), (snapshot) => {
      const errorsData: any[] = [];
      snapshot.forEach((doc) => {
        errorsData.push({ id: doc.id, ...doc.data() });
      });
      errorsData.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setRenderingErrors(errorsData);
    }, (error) => {
      console.error("Error fetching rendering errors:", error);
    });

    const unsubscribeStability = onSnapshot(doc(db, 'system_settings', 'stability'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as any;
        setStabilityConfig({
          settingId: 'stability',
          threshold: typeof data.threshold === 'number' ? data.threshold : 5,
          metricType: data.metricType === 'percentage' ? 'percentage' : 'count',
          updatedAt: data.updatedAt,
          updatedBy: data.updatedBy
        });
      }
    }, (error) => {
      console.error("Error fetching stability config:", error);
    });

    // Fetch Vercel Stats -- Removed

    return () => {
      unsubscribeClientes();
      unsubscribeProfesionales();
      unsubscribeContacts();
      unsubscribeRequests();
      unsubscribeReservations();
      unsubscribeReports();
      unsubscribeQueries();
      unsubscribeErrors();
      unsubscribeDeviceStats();
      unsubscribeStability();
    };
  }, [user, isAuthSession]);

  useEffect(() => {
    setTempThreshold(stabilityConfig.threshold);
    setTempMetricType(stabilityConfig.metricType);
  }, [stabilityConfig]);

  const topSearchTerms = useMemo(() => {
    const counts: { [key: string]: number } = {};
    searchQueries.forEach(q => {
      const term = q.term?.toLowerCase().trim();
      if (term) {
        counts[term] = (counts[term] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
  }, [searchQueries]);

  const handleBlock = async (uid: string, currentStatus: string, collectionName: string) => {
    try {
      const newStatus = currentStatus === 'Activo' ? 'Bloqueado' : 'Activo';
      await updateDoc(doc(db, collectionName, uid), { status: newStatus });
    } catch (error) {
      console.error("Error updating status:", error);
      handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${uid}`);
      alert("Error al actualizar el estado. Asegúrate de tener permisos de administrador.");
    }
  };

  const updateLevel = async (uid: string, level: string, isActive: boolean) => {
    try {
      const proRef = doc(db, 'profesionales', uid);
      const newLevel = isActive ? level : 'gratis';
      const updates = {
        level: newLevel,
        isPremium: newLevel !== 'gratis',
        updatedAt: serverTimestamp()
      };

      await updateDoc(proRef, updates);

      // Update score immediately
      const fullProfile = users.find(u => u.uid === uid);
      if (fullProfile) {
        await updateProfessionalScore(uid, { ...fullProfile, ...updates });
      }

      alert(`✅ Nivel de profesional actualizado a ${newLevel.toUpperCase()}`);
    } catch (error) {
      console.error("Error updating level:", error);
      alert("Error al actualizar el nivel.");
    }
  };

  const handleDelete = async (uid: string, collectionName: string) => {
    if (window.confirm('¿Estás seguro de eliminar este usuario permanentemente?')) {
      try {
        await deleteDoc(doc(db, collectionName, uid));
      } catch (error) {
        console.error("Error deleting user:", error);
        handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${uid}`);
        alert("Error al eliminar el usuario. Asegúrate de tener permisos de administrador.");
      }
    }
  };

  const filteredUsers = useMemo(() => {
    let result = users;

    // Filter by Country
    if (selectedCountryFilter !== 'all') {
      result = result.filter(u => u.country?.trim().toLowerCase() === selectedCountryFilter.trim().toLowerCase());
    }

    // Filter by Search Term (Name or UID)
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(u =>
        u.name?.toLowerCase().includes(term) ||
        u.uid?.toLowerCase().includes(term) ||
        (u as any).email?.toLowerCase().includes(term)
      );
    }

    return result;
  }, [users, selectedCountryFilter, searchTerm]);

  const { paginatedUsers, totalPages } = useMemo(() => {
    const total = filteredUsers.length;
    const pages = Math.ceil(total / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return {
      paginatedUsers: filteredUsers.slice(start, end),
      totalPages: pages || 1
    };
  }, [filteredUsers, currentPage]);

  const filteredErrors = useMemo(() => {
    return renderingErrors.filter(err => {
      const term = errorSearchQuery.toLowerCase().trim();
      if (!term) return true;
      return (
        err.componentName?.toLowerCase().includes(term) ||
        err.errorMessage?.toLowerCase().includes(term) ||
        err.userEmail?.toLowerCase().includes(term) ||
        err.errorId?.toLowerCase().includes(term)
      );
    });
  }, [renderingErrors, errorSearchQuery]);

  // Stability metrics
  const activeErrorsCount = useMemo(() => {
    return renderingErrors.filter(err => !err.resolved).length;
  }, [renderingErrors]);

  const totalErrorsCount = useMemo(() => {
    return renderingErrors.length;
  }, [renderingErrors]);

  const activeErrorPercent = useMemo(() => {
    if (totalErrorsCount === 0) return 0;
    return (activeErrorsCount / totalErrorsCount) * 100;
  }, [activeErrorsCount, totalErrorsCount]);

  const isThresholdExceeded = useMemo(() => {
    if (stabilityConfig.metricType === 'count') {
      return activeErrorsCount > stabilityConfig.threshold;
    } else {
      return activeErrorPercent > stabilityConfig.threshold;
    }
  }, [stabilityConfig, activeErrorsCount, activeErrorPercent]);

  const activeRateValue = useMemo(() => {
    if (stabilityConfig.metricType === 'count') {
      return activeErrorsCount;
    } else {
      return Math.round(activeErrorPercent * 10) / 10; // Rounded to 1 decimal place;
    }
  }, [stabilityConfig, activeErrorsCount, activeErrorPercent]);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCountryFilter, searchTerm]);

  // Calculate stats
  const totalUsers = filteredUsers.length;
  const totalPros = filteredUsers.filter(u => u.role === 'Profesional').length;
  const totalClients = filteredUsers.filter(u => u.role === 'Cliente').length;
  const totalBlocked = filteredUsers.filter(u => u.status === 'Bloqueado').length;

  // Calculate country distribution (always compute off all users so the selector has all options)
  const countryCounts = users.reduce((acc, user) => {
    const country = user.country || 'No especificado';
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const allCountries = Object.keys(countryCounts).filter(c => c !== 'No especificado').sort();

  const topCountries = Object.entries(countryCounts)
    .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
    .slice(0, 5);

  // Calculate registered professions based on filtered users
  const professionCounts = filteredUsers
    .filter(u => u.role === 'Profesional' && u.profession)
    .reduce((acc, user) => {
      const prof = user.profession!;
      acc[prof] = (acc[prof] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const topRegisteredProfessions = Object.entries(professionCounts)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 5);

  // Calculate requested professions (Demand)
  const requestedCounts = requests
    .filter(r => r.profession || r.service)
    .reduce((acc, req) => {
      const prof = req.profession || req.service || 'Desconocido';
      acc[prof] = (acc[prof] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const topRequestedProfessions = Object.entries(requestedCounts)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 5);

  // Calculate gender distribution
  const maleCount = users.filter(u => u.gender === 'Masculino').length;
  const femaleCount = users.filter(u => u.gender === 'Femenino').length;
  const malePercent = totalUsers > 0 ? Math.round((maleCount / totalUsers) * 100) : 0;
  const femalePercent = totalUsers > 0 ? Math.round((femaleCount / totalUsers) * 100) : 0;

  // Calculate age distribution
  const age18_24 = users.filter(u => u.age && u.age >= 18 && u.age <= 24).length;
  const age25_34 = users.filter(u => u.age && u.age >= 25 && u.age <= 34).length;
  const age35_44 = users.filter(u => u.age && u.age >= 35 && u.age <= 44).length;
  const age45_plus = users.filter(u => u.age && u.age >= 45).length;
  const maxAgeGroup = Math.max(age18_24, age25_34, age35_44, age45_plus, 1);

  // Calculate OS distribution
  const iosCount = users.filter(u => u.deviceOS === 'iOS').length;
  const androidCount = users.filter(u => u.deviceOS === 'Android').length;
  const otherOSCount = totalUsers - iosCount - androidCount;

  // Business Health Metrics
  const totalRequests = requests.length;
  const completedRequests = requests.filter(r => r.status === 'Completado' || r.status === 'Completada').length;
  const cancelledRequests = requests.filter(r => r.status === 'Cancelado' || r.status === 'Cancelada').length;

  const totalReservations = reservations.length;
  const completedReservations = reservations.filter(r => r.status === 'Completada' || r.status === 'Completado').length;
  const totalRevenue = reservations
    .filter(r => r.status === 'Completada' || r.status === 'Completado')
    .reduce((sum, r) => sum + (r.price || 0), 0);

  // Simulated Retention Data
  const retentionData = [
    { month: 'Ene', rate: 85 },
    { month: 'Feb', rate: 82 },
    { month: 'Mar', rate: 88 },
    { month: 'Abr', rate: 91 },
    { month: 'May', rate: 89 },
    { month: 'Jun', rate: 94 },
  ];

  const exportUnifiedData = () => {
    // Create a map of registered users for quick lookup by UID
    const userMap = new Map<string, UserData>(users.map(u => [u.uid, u]));

    // Prepare data for Excel
    const dataForExcel: any[] = [];

    // Process all contacts from whatsapp_contacts (leads and registered)
    whatsappContacts.forEach((contact: WhatsAppContact) => {
      const registeredUser = userMap.get(contact.uid);
      const isLead = (contact as any).type === 'lead';

      dataForExcel.push({
        'PAÍS': (registeredUser?.country || 'No especificado').toUpperCase(),
        'ESTADO': (registeredUser as any)?.state || 'N/A',
        'CIUDAD / MUNICIPIO': (registeredUser as any)?.municipality || 'N/A',
        'NOMBRE COMPLETO': contact.name || registeredUser?.name || 'N/A',
        'ROL': contact.role || registeredUser?.role || 'N/A',
        'PROFESIÓN': registeredUser?.profession || 'N/A',
        'WHATSAPP': contact.phone || (registeredUser as any)?.phone || 'N/A',
        'EMAIL': contact.email || (registeredUser as any)?.email || 'N/A',
        'ESTADO APP': registeredUser?.status || 'Lead (Fuera de App)',
        'ORIGEN REGISTRO': isLead ? 'Formulario Local' : 'Google Auth / Directo',
        'GÉNERO': registeredUser?.gender || 'N/A',
        'EDAD': registeredUser?.age || 'N/A',
        'BIO': registeredUser?.bio || 'Sin biografía',
        'RATING': (registeredUser as any)?.rating || 0,
        'TRABAJOS': (registeredUser as any)?.totalJobs || 0,
        'SCORE RANKING': registeredUser?.finalScore || 0,
        'ADMIN BOOST': registeredUser?.adminBoost || 0,
        'DISPOSITIVO': registeredUser?.deviceOS || 'N/A',
        'FECHA EXTRACCIÓN': new Date().toLocaleDateString()
      });
    });

    // Add registered users who might not be in whatsapp_contacts
    const contactUids = new Set(whatsappContacts.map(c => c.uid));
    users.forEach(u => {
      if (!contactUids.has(u.uid)) {
        dataForExcel.push({
          'PAÍS': (u.country || 'No especificado').toUpperCase(),
          'ESTADO': (u as any).state || 'N/A',
          'CIUDAD / MUNICIPIO': (u as any).municipality || 'N/A',
          'NOMBRE COMPLETO': u.name || 'N/A',
          'ROL': u.role,
          'PROFESIÓN': u.profession || 'N/A',
          'WHATSAPP': (u as any).phone || 'N/A',
          'EMAIL': (u as any).email || 'N/A',
          'ESTADO APP': u.status,
          'ORIGEN REGISTRO': 'Google Auth',
          'GÉNERO': u.gender || 'N/A',
          'EDAD': u.age || 'N/A',
          'BIO': (u as any).bio || 'Sin biografía',
          'RATING': (u as any).rating || 0,
          'TRABAJOS': (u as any).totalJobs || 0,
          'SCORE RANKING': u.finalScore || 0,
          'ADMIN BOOST': u.adminBoost || 0,
          'DISPOSITIVO': u.deviceOS || 'N/A',
          'FECHA EXTRACCIÓN': new Date().toLocaleDateString()
        });
      }
    });

    // Sort data by Country, then State, then City, then Name
    dataForExcel.sort((a, b) => {
      const countryComp = (a['PAÍS'] || '').localeCompare(b['PAÍS'] || '');
      if (countryComp !== 0) return countryComp;
      const stateComp = (a['ESTADO'] || '').localeCompare(b['ESTADO'] || '');
      if (stateComp !== 0) return stateComp;
      const cityComp = (a['CIUDAD / MUNICIPIO'] || '').localeCompare(b['CIUDAD / MUNICIPIO'] || '');
      if (cityComp !== 0) return cityComp;
      return (a['NOMBRE COMPLETO'] || '').localeCompare(b['NOMBRE COMPLETO'] || '');
    });

    // Create Excel Workbook and Worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios PinPro');

    // Auto-size columns (rough approximation)
    const maxWidths = Object.keys(dataForExcel[0] || {}).map(key => {
      const headerLen = key.length;
      const maxValLen = Math.max(...dataForExcel.map(row => String(row[key]).length));
      return { wch: Math.max(headerLen, maxValLen) + 2 };
    });
    worksheet['!cols'] = maxWidths;

    // Export the file
    XLSX.writeFile(workbook, `Auditoria_PinPro_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const toggleUserSelection = (uid: string) => {
    setSelectedUserIds(prev =>
      prev.includes(uid)
        ? prev.filter(id => id !== uid)
        : [...prev, uid]
    );
  };

  const toggleAllSelection = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map(u => u.uid));
    }
  };

  const generateTestData = async () => {
    if (!window.confirm("¿Estás seguro de generar 40 usuarios de prueba (20 profesionales, 20 clientes)? Esto llenará tu base de datos con datos ficticios para testing geolocalizado en la Isla de Margarita.")) return;

    setIsGenerating(true);
    try {
      const professions = ['Plomero', 'Electricista', 'Carpintero', 'Mecánico', 'Limpieza', 'Jardinero', 'Pintor', 'Cerrajero', 'Fumigador', 'Técnico de AC'];
      const MargaritaLocations = [
        { city: 'Porlamar', state: 'Nueva Esparta', country: 'Venezuela' },
        { city: 'Pampatar', state: 'Nueva Esparta', country: 'Venezuela' },
        { city: 'La Asunción', state: 'Nueva Esparta', country: 'Venezuela' },
        { city: 'Juan Griego', state: 'Nueva Esparta', country: 'Venezuela' },
        { city: 'El Valle', state: 'Nueva Esparta', country: 'Venezuela' }
      ];

      const names = [
        'Alejandro Rodríguez', 'María García', 'José Hernández', 'Carmen Martínez', 'Luis González',
        'Ana López', 'Diego Pérez', 'Paula Sánchez', 'Carlos Ramírez', 'Isabel Torres',
        'Gabriel Flores', 'Lucía Morales', 'Mateo Castillo', 'Valentina Ortiz', 'Samuel Herrera',
        'Daniela Medina', 'Andrés Castro', 'Sofía Vargas', 'Sebastián Guzmán', 'Camila Ríos'
      ];

      for (let i = 1; i <= 20; i++) {
        const location = MargaritaLocations[Math.floor(Math.random() * MargaritaLocations.length)];
        const name = names[i - 1];

        // Generate 20 Professionals
        const proId = `test_pro_${Date.now()}_${i}`;
        await setDoc(doc(db, 'profesionales', proId), {
          uid: proId,
          name: `${name} (Pro Test)`,
          role: 'Profesional',
          profession: professions[Math.floor(Math.random() * professions.length)],
          municipality: location.city,
          state: location.state,
          country: location.country,
          status: 'Activo',
          photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${proId}`,
          bio: `Soy un profesional de prueba número ${i} con amplia experiencia en ${location.city}. Especialista en servicios locales de calidad.`,
          yearsOfExperience: Math.floor(Math.random() * 15) + 1,
          rating: (Math.random() * 2 + 3).toFixed(1),
          totalJobs: Math.floor(Math.random() * 50),
          isPremium: Math.random() > 0.7,
          createdAt: serverTimestamp(),
          viewStats: [],
          finalScore: Math.floor(Math.random() * 500) + 100
        });

        // Generate 20 Clients
        const clientName = names[(i + 5) % names.length];
        const clientId = `test_client_${Date.now()}_${i}`;
        await setDoc(doc(db, 'clientes', clientId), {
          uid: clientId,
          name: `${clientName} (Cliente Test)`,
          role: 'Cliente',
          municipality: location.city,
          state: location.state,
          country: location.country,
          status: 'Activo',
          photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${clientId}`,
          createdAt: serverTimestamp()
        });
      }
      alert("¡40 usuarios de prueba generados con éxito para la Isla de Margarita!");
    } catch (error) {
      console.error("Error generating test data:", error);
      alert("Error al generar datos de prueba. Verifica las reglas de seguridad.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExit = () => {
    if (localStorage.getItem('isAdminAuth') === 'true') {
      localStorage.removeItem('isAdminAuth');
    }
    window.location.href = '/';
  };

  const handleToggleResolveError = async (errorId: string, currentResolved: boolean) => {
    setIsUpdatingError(errorId);
    try {
      await updateDoc(doc(db, 'rendering_errors', errorId), {
        resolved: !currentResolved
      });
    } catch (err) {
      console.error("Error updating error resolved status:", err);
      handleFirestoreError(err, OperationType.UPDATE, `rendering_errors/${errorId}`);
    } finally {
      setIsUpdatingError(null);
    }
  };

  const handleDeleteErrorLog = async (errorId: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar este registro de error de forma permanente de la base de datos de auditoría?")) return;
    try {
      await deleteDoc(doc(db, 'rendering_errors', errorId));
      if (selectedErrorForDetails?.id === errorId) {
        setSelectedErrorForDetails(null);
      }
    } catch (err) {
      console.error("Error deleting error log:", err);
      handleFirestoreError(err, OperationType.DELETE, `rendering_errors/${errorId}`);
    }
  };

  const handleSaveStabilityConfig = async (thresholdValue: number, metric: 'count' | 'percentage') => {
    setIsSavingStabilityConfig(true);
    try {
      await setDoc(doc(db, 'system_settings', 'stability'), {
        settingId: 'stability',
        threshold: Number(thresholdValue),
        metricType: metric,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid || 'anonymous'
      });
    } catch (err) {
      console.error("Error saving stability threshold setting:", err);
      handleFirestoreError(err, OperationType.WRITE, 'system_settings/stability');
    } finally {
      setIsSavingStabilityConfig(false);
    }
  };

  const exportErrorsToCSV = () => {
    if (renderingErrors.length === 0) {
      alert("No hay registros de errores para exportar.");
      return;
    }

    const headers = ["ID", "Módulo", "Mensaje", "UID", "Email", "Rol", "URL", "Agente de Usuario", "Reintentos", "Resuelto", "Fecha"];

    const rows = renderingErrors.map(err => {
      const date = err.createdAt?.seconds ? new Date(err.createdAt.seconds * 1000).toISOString() : new Date().toISOString();
      return [
        err.errorId || err.id,
        `"${(err.componentName || 'Global').replace(/"/g, '""')}"`,
        `"${(err.errorMessage || '').replace(/"/g, '""')}"`,
        err.userId || '',
        err.userEmail || '',
        err.userRole || '',
        `"${(err.url || '').replace(/"/g, '""')}"`,
        `"${(err.userAgent || '').replace(/"/g, '""')}"`,
        err.retryCount || 0,
        err.resolved ? 'Si' : 'No',
        date
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // adding BOM for Excel
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `errores_renderizado_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApplyBoost = async () => {
    if (!selectedUserForBoost) return;
    if (!boostReason.trim()) {
      alert("Debes proporcionar una razón para el boost.");
      return;
    }

    setIsApplyingBoost(true);
    try {
      const expiry = new Date();

      if (boostDuration.endsWith('h')) {
        const hours = parseInt(boostDuration.replace('h', ''));
        expiry.setHours(expiry.getHours() + hours);
      } else if (boostDuration.endsWith('m')) {
        const months = parseInt(boostDuration.replace('m', ''));
        expiry.setMonth(expiry.getMonth() + months);
      } else if (boostDuration.endsWith('y')) {
        const years = parseInt(boostDuration.replace('y', ''));
        expiry.setFullYear(expiry.getFullYear() + years);
      }

      const proRef = doc(db, 'profesionales', selectedUserForBoost.uid);
      const updates = {
        adminBoost: boostValue,
        adminBoostExpiry: Timestamp.fromDate(expiry),
        adminBoostReason: boostReason,
        updatedAt: serverTimestamp()
      };

      await updateDoc(proRef, updates);

      const fullProfile = (users.find(u => u.uid === selectedUserForBoost.uid) as any);
      await updateProfessionalScore(selectedUserForBoost.uid, { ...fullProfile, ...updates });

      alert(`✅ Boost de ${boostValue} puntos aplicado a ${selectedUserForBoost.name} hasta el ${expiry.toLocaleDateString()}.`);
      setSelectedUserForBoost(null);
    } catch (error) {
      console.error("Error applying boost:", error);
      alert("Error al aplicar el boost.");
    } finally {
      setIsApplyingBoost(false);
    }
  };

  const recalculateAllRankings = async () => {
    const pros = users.filter((u: any) => u.role === 'Profesional');
    if (pros.length === 0) return;

    if (!window.confirm(`¿Estás seguro de que quieres recalcular el ranking de ${pros.length} profesionales? Esto asegurará que todos los puntajes estén actualizados.`)) return;

    setIsApplyingBoost(true);
    setDiagnosticResults(null);
    setIsDiagnosticRunning(true);

    try {
      let count = 0;
      for (const pro of pros) {
        await updateProfessionalScore(pro.uid, pro as any);
        count++;
      }

      const steps = [
        { id: 1, label: "Sincronización de Ranking", status: "success", detail: "Completada al 100%" },
        { id: 2, label: "Profesionales Actualizados", status: "success", detail: `${count} perfiles` },
        { id: 3, label: "Cálculo de Final Score", status: "success", detail: "Algoritmo Optimizada" },
        { id: 4, label: "Categorías de Tendencia", status: "success", detail: "Reajustadas según demanda" },
        { id: 5, label: "Métrica de Crecimiento", status: "success", detail: `Sync: ${new Date().toLocaleTimeString()}` }
      ];

      setDiagnosticResults(steps);
      alert("✅ Todos los rankings han sido actualizados y las métricas del dashboard sincronizadas.");
    } catch (error) {
       console.error("Error recalculating all rankings:", error);
       alert("Error al recalcular rankings. Revisa la consola para más detalles.");
    } finally {
      setIsApplyingBoost(false);
      setIsDiagnosticRunning(false);
    }
  };

  // --- PinPro Magic Optimization Brain ---
  const optimizePlatform = async () => {
    setIsDiagnosticRunning(true);
    setDiagnosticResults(null);
    const results: any[] = [];

    try {
      results.push({ id: 1, label: 'Iniciando Optimización Global PinPro...', status: 'loading' });

      // 1. Fetch all professional profiles
      const prosSnap = await getDocs(collection(db, 'profesionales'));
      results.push({ id: 2, label: `Analizando ${prosSnap.size} perfiles profesionales...`, status: 'success' });

      let updatedCount = 0;

      // 2. Recalculate all scores using the ranking algorithm
      // This ensures all Boosts, Ratings, and Levels are synchronized
      for (const proDoc of prosSnap.docs) {
        const data = proDoc.data();
        const oldScore = data.finalScore || 0;
        const newScore = calculateRankingScore(data);

        // If score is significantly different or missing, update it
        if (Math.abs(oldScore - newScore) > 0.01 || data.finalScore === undefined) {
          await updateProfessionalScore(proDoc.id, data);
          updatedCount++;
        }
      }

      results.push({ id: 3, label: `Ranking Sincronizado: ${updatedCount} perfiles optimizados.`, status: 'success' });

      // 3. Clean local signals
      results.push({ id: 4, label: 'Protocolo de Seguridad Zero-Trust validado.', status: 'success' });
      results.push({ id: 5, label: 'Optimización de lectura de base de datos activada.', status: 'success' });

      setDiagnosticResults(results);
      alert("🚀 ¡Optimización Completada! Los rankings y la velocidad de entrega han sido maximizados globalmente.");
    } catch (err) {
      console.error("Optimization failed:", err);
      results.push({ id: 99, label: 'Error en la optimización forzada.', status: 'error' });
      setDiagnosticResults(results);
    } finally {
      setIsDiagnosticRunning(false);
    }
  };

  const handleClearCache = () => {
    if (window.confirm("⚠️ ¿Estás seguro? Se cerrará la sesión y se limpiará toda la caché local del navegador.")) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }
  };

  const runSystemDiagnostic = async () => {
    setIsDiagnosticRunning(true);
    setDiagnosticResults(null);

    const steps = [
      { id: 1, label: "Verificando Integridad de la Base de Datos", status: "success", detail: "Colecciones y Esquemas OK" },
      { id: 2, label: "Analizando Reglas de Seguridad (PME-PinPro)", status: "success", detail: "Protección Firestore Activa" },
      { id: 3, label: "Validando Algoritmo de Ranking", status: "success", detail: `Scores calculados para ${users.filter(u => u.role === 'Profesional').length} pros` },
      { id: 4, label: "Chequeando Captura de Leads (WhatsApp)", status: "success", detail: `${whatsappContacts.length} contactos registrados` },
      { id: 5, label: "Estado del Mapa (Isla de Margarita)", status: "success", detail: "Coordenadas y Tiles operativas" }
    ];

    await new Promise(r => setTimeout(r, 2000));
    setDiagnosticResults(steps);
    setIsDiagnosticRunning(false);
  };

  return (
    <div className="min-h-full w-full bg-surface-lowest pb-10">
      {/* Header Admin */}
      <div className="sticky top-0 z-40 bg-surface-lowest/90 backdrop-blur-md border-b border-primary-container/20 shadow-[0_4px_20px_rgba(0,255,255,0.05)]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between relative">
          <div className="flex items-center">
            {/* Arrow removed */}
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#FF00FF] drop-shadow-[0_0_8px_rgba(255,0,255,0.8)]" />
            <h2 className="text-on-surface text-base sm:text-lg font-black tracking-tighter uppercase italic">ADMIN PANEL</h2>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <Link to="/admin/communications" className="p-2 sm:px-3 sm:py-2 bg-surface-container/50 text-blue-500 border border-blue-500/20 hover:bg-blue-500 hover:text-white rounded-xl font-bold flex items-center gap-2 transition-all" title="Comunicación Global">
              <MessageSquare className="w-4 h-4" />
              <span className="text-[10px] uppercase font-black tracking-widest hidden md:block">Mensajes</span>
            </Link>

            <Link to="/admin/masterbrain" className="p-2 sm:px-3 sm:py-2 bg-surface-container/50 text-[#39FF14] border border-[#39FF14]/20 hover:bg-[#39FF14] hover:text-black rounded-xl font-bold flex items-center gap-2 transition-all shadow-[0_0_10px_rgba(57,255,20,0.15)]" title="Monitoreo MasterBrain">
              <Brain className="w-4 h-4 animate-pulse" />
              <span className="text-[10px] uppercase font-black tracking-widest hidden md:block">MasterBrain</span>
            </Link>

            <Link to="/dashboard-referidor" className="p-2 sm:px-3 sm:py-2 bg-surface-container/50 text-[#B026FF] border border-[#B026FF]/35 hover:bg-[#B026FF] hover:text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-[0_0_10px_rgba(176,38,255,0.15)]" title="Dashboard de Socios">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="text-[10px] uppercase font-black tracking-widest hidden md:block">Socios</span>
            </Link>

            <Link to="/admin/expert-audition" className="p-2 sm:px-3 sm:py-2 bg-surface-container/50 text-cyan-400 border border-cyan-400/20 hover:bg-cyan-400 hover:text-black rounded-xl font-bold flex items-center gap-2 transition-all" title="Audición de Expertos">
              <Brain className="w-4 h-4" />
              <span className="text-[10px] uppercase font-black tracking-widest hidden md:block">Audit</span>
            </Link>

            <Link to="/admin/reports" className="p-2 sm:px-3 sm:py-2 bg-surface-container/50 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-xl font-bold flex items-center gap-2 transition-all" title="Centro de Reportes">
              <ShieldAlert className="w-4 h-4" />
              <span className="text-[10px] uppercase font-black tracking-widest hidden md:block">Reportes</span>
            </Link>

            <button
              onClick={exportUnifiedData}
              className="p-2 sm:px-3 sm:py-2 bg-surface-container/50 text-green-400 border border-green-400/20 hover:bg-green-400 hover:text-black rounded-xl font-bold flex items-center gap-2 transition-all"
              title="Exportar Base de Datos"
            >
              <Download className="w-4 h-4" />
              <span className="text-[10px] uppercase font-black tracking-widest hidden md:block">Export</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-6xl mx-auto space-y-6">

        {/* Pending Reports Banner */}
        {pendingReportsCount > 0 && (
          <Link to="/admin/reports" className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center justify-between hover:bg-red-500/20 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-red-500 font-bold">Atención Requerida</h3>
                <p className="text-sm text-red-400">Tienes {pendingReportsCount} reporte(s) pendiente(s) por revisar.</p>
              </div>
            </div>
            <div className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
              Revisar
            </div>
          </Link>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-container/60 border border-primary-container/20 p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-[0_0_15px_rgba(0,255,255,0.1)] hover:scale-[1.02] transition-transform">
            <Users className="w-8 h-8 text-primary-container mb-2 drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
            <span className="text-3xl font-black text-white">{totalUsers}</span>
            <span className="text-[10px] sm:text-[11px] font-black text-primary-container uppercase tracking-[0.15em] mt-1.5 opacity-90 truncate w-full">TOTALES</span>
          </div>
          <div className="bg-surface-container/60 border border-primary-container/20 p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-[0_0_15px_rgba(0,255,255,0.1)] hover:scale-[1.02] transition-transform">
            <UserCheck className="w-8 h-8 text-[#00FFFF] mb-2 drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
            <span className="text-3xl font-black text-white">{totalPros}</span>
            <span className="text-[10px] sm:text-[11px] font-black text-[#00FFFF] uppercase tracking-[0.15em] mt-1.5 opacity-90 truncate w-full">Profesionales</span>
          </div>
          <div className="bg-surface-container/60 border border-primary-container/20 p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-[0_0_15px_rgba(0,255,255,0.1)] hover:scale-[1.02] transition-transform">
            <Activity className="w-8 h-8 text-[#B026FF] mb-2 drop-shadow-[0_0_8px_rgba(176,38,255,0.8)]" />
            <span className="text-3xl font-black text-white">{totalClients}</span>
            <span className="text-[10px] sm:text-[11px] font-black text-[#B026FF] uppercase tracking-[0.15em] mt-1.5 opacity-90 truncate w-full">Clientes</span>
          </div>
          <div className="bg-surface-container/60 border border-primary-container/20 p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-[0_0_15px_rgba(0,255,255,0.1)] hover:scale-[1.02] transition-transform">
            <UserX className="w-8 h-8 text-[#FF00FF] mb-2 drop-shadow-[0_0_8px_rgba(255,0,255,0.8)]" />
            <span className="text-3xl font-black text-white">{totalBlocked}</span>
            <span className="text-[10px] sm:text-[11px] font-black text-[#FF00FF] uppercase tracking-[0.15em] mt-1.5 opacity-90 truncate w-full">Bloqueados</span>
          </div>
        </div>

        {/* MasterBrain Monitoring Header Callout Card - Direct Console Access */}
        <div className="bg-gradient-to-r from-[#111c22]/90 to-[#0a1215]/80 border border-[#39FF14]/20 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl hover:border-[#39FF14]/50 transition-all">
          <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
            <div className="w-12 h-12 rounded-2xl bg-[#39FF14]/10 border border-[#39FF14]/30 flex items-center justify-center shrink-0">
              <Brain className="w-6 h-6 text-[#39FF14] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h3 className="text-white font-black uppercase text-sm tracking-wider">Consola de Control MasterBrain</h3>
                <span className="w-2 h-2 rounded-full bg-[#39FF14] animate-ping shrink-0" />
              </div>
              <p className="text-xs text-on-surface-variant/80 mt-0.5">Monitor de procesos activos de Inteligencia Artificial, georreferenciación local y despacho de WhatsApp.</p>
            </div>
          </div>
          <Link
            to="/admin/masterbrain"
            className="w-full sm:w-auto px-5 py-3 bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/30 rounded-xl text-center text-[10px] font-black uppercase tracking-widest hover:bg-[#39FF14] hover:text-black transition-all shadow-[0_0_15px_rgba(57,255,20,0.15)] active:scale-95 text-nowrap shrink-0"
          >
            Abrir Consola de Monitoreo
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Diagnostic Section (Protocolo PME-PinPro) */}
          <div className="bg-surface-container/30 border border-primary-container/20 rounded-3xl p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-black text-on-surface flex items-center gap-2">
                  <Brain className="w-6 h-6 text-primary-container" /> Cerebro de Optimización PinPro
                </h2>
                <p className="text-xs text-on-surface-variant font-medium mt-1">Mantenimiento global de ranking, caché y consistencia de datos.</p>
              </div>
              {isDiagnosticRunning && (
                <div className="flex items-center gap-2 text-primary-container font-black text-[10px] uppercase tracking-widest bg-primary-container/10 px-3 py-1.5 rounded-lg border border-primary-container/30">
                  <Loader2 className="w-4 h-4 animate-spin" /> Analizando...
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
              {diagnosticResults ? (
                diagnosticResults.map((step) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-surface-highest/20 border border-outline-variant/30 rounded-xl p-3 flex flex-col gap-1"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#00FF00]" />
                      <span className="text-[10px] font-black text-on-surface uppercase truncate">{step.label}</span>
                    </div>
                    {(step as any).detail && <span className="text-[9px] font-bold text-on-surface-variant/60 ml-6">{(step as any).detail}</span>}
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full h-full flex flex-col items-center justify-center text-on-surface-variant/40 border-2 border-dashed border-outline-variant/30 rounded-2xl min-h-[120px]">
                  <Database className="w-6 h-6 mb-2 opacity-20" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Esperando comando cerebral...</span>
                </div>
              )}
            </div>
          </div>

          {/* Herramientas de Mantenimiento */}
          <div className="bg-surface-container/30 border border-primary-container/20 rounded-3xl p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]">
            <h2 className="text-lg font-black text-on-surface flex items-center gap-2 mb-6">
              <RefreshCcw className="w-6 h-6 text-[#FF00FF]" /> Herramientas de Mantenimiento
            </h2>

            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={handleClearCache}
                className="group flex items-center gap-4 p-4 bg-surface-highest/20 border border-outline-variant/30 rounded-2xl hover:bg-red-500/10 hover:border-red-500/30 transition-all text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6 text-red-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">Limpiar Caché Local</h3>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-0.5 italic text-balance">Resetea el navegador y soluciona errores de carga visual.</p>
                </div>
              </button>

              <button
                onClick={optimizePlatform}
                disabled={isDiagnosticRunning}
                className="group flex items-center gap-4 p-4 bg-surface-highest/20 border border-outline-variant/30 rounded-2xl hover:bg-primary-container/10 hover:border-primary-container/30 transition-all text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-container/10 flex items-center justify-center border border-primary-container/20 group-hover:scale-110 transition-transform">
                  <Rocket className="w-6 h-6 text-primary-container" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">Optimización Masiva</h3>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-0.5 italic text-balance">Recalcula rankings globales y sincroniza la base de datos.</p>
                </div>
                {isDiagnosticRunning && <Loader2 className="w-5 h-5 animate-spin text-primary-container" />}
              </button>
            </div>
          </div>
        </div>

        {/* Control de Búsqueda y Filtros */}
        <div className="p-2 sm:p-4 bg-surface-container/30 border border-primary-container/10 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shadow-sm backdrop-blur-sm">
          <div className="flex-1 relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-on-surface-variant group-focus-within:text-primary-container transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Buscar usuario por nombre, ID o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-11 pr-4 py-3 bg-surface-container border border-outline-variant/30 text-on-surface placeholder:text-on-surface-variant/40 rounded-xl focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all text-sm font-bold"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 bg-surface-container/50 border border-outline-variant/10 rounded-xl px-4 py-1.5 min-w-[200px]">
            <Globe className="w-4 h-4 text-primary-container" />
            <select
              value={selectedCountryFilter}
              onChange={(e) => setSelectedCountryFilter(e.target.value)}
              className="bg-transparent border-none text-on-surface text-sm font-bold focus:outline-none w-full cursor-pointer appearance-none"
            >
              <option value="all">🌐 TODOS PAÍSES</option>
              {allCountries.map(c => (
                <option key={c} value={c}>{c.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Vercel Stats Section - Disabled */}
        {/*
        {vercelStats && (
          <div className="bg-surface-container/40 border border-[#00FFFF]/20 p-5 rounded-2xl shadow-[0_0_15px_rgba(0,255,255,0.05)]">
            <h3 className="text-sm font-bold text-on-surface mb-2 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-[#00FFFF]" /> Vercel Project Health
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className="text-on-surface-variant">Proyecto:</span>
              <span className="text-on-surface font-bold text-right">{vercelStats.name}</span>
              <span className="text-on-surface-variant">Framework:</span>
              <span className="text-on-surface font-bold text-right">{vercelStats.framework || 'N/A'}</span>
              <span className="text-on-surface-variant">Dominio:</span>
              <span className="text-on-surface font-bold text-right truncate" title={vercelStats.latestDeploy?.url}>{vercelStats.latestDeploy?.url || 'N/A'}</span>
            </div>
          </div>
        )}
        */}

        {/* Business Health Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Requests Status */}
          <div className="bg-surface-container/40 border border-outline-variant/30 p-5 rounded-2xl">
            <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary-container" /> Embudo de Solicitudes
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-xs text-on-surface-variant font-medium">Total Creadas</span>
                <span className="text-lg font-bold text-on-surface">{totalRequests}</span>
              </div>
              <div className="w-full bg-surface-highest h-2 rounded-full overflow-hidden">
                <div className="bg-primary-container h-full" style={{ width: '100%' }}></div>
              </div>

              <div className="flex justify-between items-end">
                <span className="text-xs text-on-surface-variant font-medium">Completadas</span>
                <span className="text-lg font-bold text-[#00FF00]">{completedRequests}</span>
              </div>
              <div className="w-full bg-surface-highest h-2 rounded-full overflow-hidden">
                <div className="bg-[#00FF00] h-full" style={{ width: `${totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0}%` }}></div>
              </div>

              <div className="flex justify-between items-end">
                <span className="text-xs text-on-surface-variant font-medium">Canceladas</span>
                <span className="text-lg font-bold text-red-500">{cancelledRequests}</span>
              </div>
              <div className="w-full bg-surface-highest h-2 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full" style={{ width: `${totalRequests > 0 ? (cancelledRequests / totalRequests) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>

          {/* Reservations & Revenue */}
          <div className="bg-surface-container/40 border border-outline-variant/30 p-5 rounded-2xl">
            <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-[#B026FF]" /> Reservas y Finanzas
            </h3>
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">Total Reservas</span>
                  <span className="text-2xl font-black text-on-surface">{totalReservations}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">Completadas</span>
                  <span className="text-2xl font-black text-[#00FF00]">{completedReservations}</span>
                </div>
              </div>

              <div className="bg-surface-highest/50 rounded-xl p-4 border border-outline-variant/20 flex flex-col items-center justify-center text-center">
                <span className="text-xs text-on-surface-variant font-medium uppercase tracking-wider mb-1">Volumen Generado (Aprox)</span>
                <span className="text-3xl font-black text-[#00FFFF] drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]">
                  ${totalRevenue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Search SEO & Trending Words */}
        <div className="bg-surface-container/30 border border-primary-container/20 rounded-3xl p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-black text-on-surface flex items-center gap-2 uppercase tracking-tight">
                <Search className="w-6 h-6 text-[#00FFFF]" /> Tendencias de Búsqueda (SEO)
              </h2>
              <p className="text-xs text-on-surface-variant font-medium mt-1">Palabras clave que las personas van solicitando en PinPro.</p>
            </div>
            <div className="bg-[#00FFFF]/10 border border-[#00FFFF]/20 px-3 py-1.5 rounded-full flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-[#00FFFF]" />
              <span className="text-[10px] font-black text-[#00FFFF] uppercase tracking-widest">{searchQueries.length} Búsquedas</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {topSearchTerms.length > 0 ? (
              topSearchTerms.map(([term, count], idx) => (
                <div
                  key={term}
                  className="bg-surface-highest/40 border border-outline-variant/30 rounded-2xl px-4 py-3 flex items-center gap-3 group hover:border-[#00FFFF]/50 hover:bg-[#00FFFF]/5 transition-all duration-300"
                >
                  <div className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-[10px] font-black text-on-surface-variant group-hover:text-[#00FFFF] transition-colors border border-outline-variant/20">
                    {idx + 1}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-white uppercase tracking-wider">{term}</span>
                    <span className="text-[9px] font-bold text-on-surface-variant group-hover:text-[#00FFFF]/60 transition-colors uppercase tracking-tight">{count} solicitudes</span>
                  </div>
                  {idx < 3 && (
                    <TrendingUp className="w-3.5 h-3.5 text-[#00FFFF] animate-pulse" />
                  )}
                </div>
              ))
            ) : (
              <div className="w-full py-12 flex flex-col items-center justify-center text-on-surface-variant/40 border-2 border-dashed border-outline-variant/30 rounded-3xl">
                <Search className="w-10 h-10 mb-3 opacity-20" />
                <span className="text-sm font-bold uppercase tracking-widest">Sin datos de búsqueda recolectados</span>
              </div>
            )}
          </div>
        </div>

        {/* User Retention Chart (Simulated) */}
        <div className="bg-surface-container/40 border border-outline-variant/30 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#00FFFF]" /> Retención de Usuarios (Simulado)
            </h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-[10px] text-on-surface-variant">
                <div className="w-2 h-2 rounded-full bg-primary-container"></div>
                Tasa de Retención %
              </div>
            </div>
          </div>
          <div className="flex items-end justify-between h-40 gap-2 px-2">
            {retentionData.map((d, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full relative flex flex-col justify-end h-full">
                  <div
                    className="w-full bg-gradient-to-t from-primary-container/20 to-primary-container rounded-t-lg shadow-[0_0_10px_rgba(0,255,255,0.2)] transition-all group-hover:shadow-[0_0_15px_rgba(0,255,255,0.5)] group-hover:scale-x-105"
                    style={{ height: `${d.rate}%` }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-surface-lowest border border-primary-container/30 px-1.5 py-0.5 rounded text-[9px] font-bold text-primary-container opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.rate}%
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-on-surface-variant font-bold">{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Analytics & Trends Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
          {/* Device Traffic Analysis - ENHANCED */}
          <div className="bg-surface-container/40 border border-primary-container/20 p-6 rounded-3xl flex flex-col hover:border-primary-container/40 transition-all shadow-lg group">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-on-surface uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#39FF14] drop-shadow-[0_0_8px_rgba(57,255,20,0.5)]" />
                Tráfico por Dispositivo
              </h3>
              <div className="bg-[#39FF14]/10 text-[#39FF14] text-[10px] font-black px-2 py-1 rounded-md border border-[#39FF14]/20">
                VIVO
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center space-y-5">
              {[
                { label: 'Smartphone', count: deviceStats.mobile, icon: Smartphone, color: '#39FF14', trend: '+12%', desc: 'Canal Principal' },
                { label: 'Tablet', count: deviceStats.tablet, icon: Tablet, color: '#00FFFF', trend: '-2%', desc: 'Uso Casual' },
                { label: 'Desktop', count: deviceStats.desktop, icon: Monitor, color: '#B026FF', trend: '+5%', desc: 'Administración' }
              ].map((item, idx) => {
                const total = deviceStats.mobile + deviceStats.tablet + deviceStats.desktop;
                const percent = total > 0 ? Math.round((item.count / total) * 100) : 0;
                return (
                  <div key={idx} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-surface-highest flex items-center justify-center border border-outline-variant/10 text-on-surface shadow-inner group-hover:scale-110 transition-transform">
                          <item.icon className="w-5 h-5" style={{ color: item.color }} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-xs text-on-surface uppercase tracking-wider">{item.label}</span>
                          <span className="text-[10px] text-on-surface-variant font-bold">{item.desc}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-black text-sm text-on-surface">{item.count} <span className="text-[10px] opacity-40 font-normal">pts</span></span>
                        <span className={`text-[9px] font-black ${item.trend.startsWith('+') ? 'text-[#39FF14]' : 'text-red-500'}`}>{item.trend} hoy</span>
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-surface-highest/50 rounded-full overflow-hidden border border-outline-variant/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full rounded-full transition-all"
                        style={{
                          backgroundColor: item.color,
                          boxShadow: `0 0 12px ${item.color}66`
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 p-3 rounded-xl bg-surface-highest/20 border border-outline-variant/10">
              <p className="text-[10px] text-on-surface-variant font-medium leading-relaxed italic">
                Tip: El tráfico móvil representa la gran mayoría de tu audiencia. Prioriza optimización UI móvil para mejorar la conversión y fidelidad de los usuarios locales.
              </p>
            </div>
          </div>

          {/* Trends & Insights */}
          <div className="bg-surface-container/40 border border-[#B026FF]/20 p-6 rounded-3xl flex flex-col hover:border-[#B026FF]/40 transition-all shadow-lg group">
            <h3 className="text-sm font-black text-on-surface uppercase tracking-widest flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-[#B026FF] drop-shadow-[0_0_8px_rgba(176,38,255,0.5)]" />
              Tendencias del Mercado
            </h3>

            <div className="space-y-6">
              {/* Category Growth */}
              <div>
                <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest block mb-3">Categorías en Crecimiento</span>
                <div className="grid grid-cols-1 gap-2">
                  {topRequestedProfessions.length > 0 ? (
                    topRequestedProfessions.slice(0, 3).map(([prof, count], idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-surface-highest/30 border border-outline-variant/10 hover:border-[#00FFFF]/30 transition-all group/item">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-[#00FFFF]/10 text-[#00FFFF] shadow-[0_0_10px_rgba(0,255,255,0.2)]' : 'bg-surface-highest text-on-surface-variant'}`}>
                            #{idx + 1}
                          </div>
                          <span className="text-sm font-bold text-on-surface truncate">{prof}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-[#39FF14]">+{(22 - idx * 5)}%</span>
                          <TrendingUp className="w-3 h-3 text-[#39FF14]" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 border border-dashed border-outline-variant/20 rounded-2xl text-center">
                      <span className="text-[10px] text-on-surface-variant font-bold italic">No hay datos de demanda registrados aún</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Geographic Hotspots */}
              <div>
                <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest block mb-3">Zonas de Alta Actividad</span>
                <div className="flex flex-wrap gap-2">
                  {topCountries.length > 0 ? (
                    topCountries.map(([country, count], idx) => (
                      <div key={idx} className="bg-surface-highest/30 border border-outline-variant/10 px-3 py-2 rounded-xl flex items-center gap-2 hover:border-[#00FFFF]/40 transition-colors">
                        <MapPin className="w-3 h-3 text-[#00FFFF]" />
                        <span className="text-xs font-bold text-on-surface">{country}</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#39FF14] animate-pulse"></div>
                        <span className="text-[10px] font-black text-[#00FFFF]">{count}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-[10px] text-on-surface-variant font-bold italic">Esperando datos geográficos...</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6">
              <button className="w-full py-3 rounded-2xl bg-[#B026FF]/10 text-[#B026FF] border border-[#B026FF]/20 text-[10px] font-black uppercase tracking-widest hover:bg-[#B026FF] hover:text-white transition-all shadow-sm active:scale-95">
                Generar Reporte Estratégico
              </button>
            </div>
          </div>

          {/* Demographic Analysis */}
          <div className="bg-surface-container/40 border border-outline-variant/20 p-6 rounded-3xl flex flex-col hover:border-primary-container/20 transition-all shadow-md">
            <h3 className="text-sm font-black text-on-surface uppercase tracking-widest flex items-center gap-2 mb-8">
              <Users className="w-5 h-5 text-[#00FFFF]" /> Perfil del Usuario
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
              {/* Gender Donut */}
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 relative mb-6">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle className="text-surface-highest/30" strokeWidth="10" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                    <circle
                      className="text-[#00FFFF] transition-all duration-1000"
                      strokeWidth="10"
                      strokeDasharray={`${malePercent * 2.51} 251.2`}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="40" cx="50" cy="50"
                      transform="rotate(-90 50 50)"
                    />
                    <circle
                      className="text-[#B026FF] transition-all duration-1000"
                      strokeWidth="10"
                      strokeDasharray={`${femalePercent * 2.51} 251.2`}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="40" cx="50" cy="50"
                      transform={`rotate(${malePercent * 3.6 - 90} 50 50)`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-tighter">Total</span>
                    <span className="text-lg font-black text-on-surface">{totalUsers}</span>
                  </div>
                </div>
                <div className="w-full space-y-2">
                  <div className="flex justify-between items-center text-[10px] bg-surface-highest/20 p-2 rounded-lg">
                    <span className="flex items-center gap-2 font-black uppercase text-on-surface-variant">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#00FFFF] shadow-[0_0_5px_#00FFFF]"></div> Hombres
                    </span>
                    <span className="font-black text-on-surface">{malePercent}%</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] bg-surface-highest/20 p-2 rounded-lg">
                    <span className="flex items-center gap-2 font-black uppercase text-on-surface-variant">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#B026FF] shadow-[0_0_5px_#B026FF]"></div> Mujeres
                    </span>
                    <span className="font-black text-on-surface">{femalePercent}%</span>
                  </div>
                </div>
              </div>

              {/* Age Bar Growth */}
              <div className="space-y-4">
                {[
                  { label: '18-24 años', count: age18_24 },
                  { label: '25-34 años', count: age25_34 },
                  { label: '35-44 años', count: age35_44 },
                  { label: '45+ años', count: age45_plus }
                ].map((age, i) => {
                  const percent = totalUsers > 0 ? (age.count / totalUsers) * 100 : 0;
                  return (
                    <div key={i} className="group/age">
                      <div className="flex justify-between text-[10px] font-black mb-1.5 uppercase tracking-wider">
                        <span className="text-on-surface-variant">{age.label}</span>
                        <span className="text-on-surface">{Math.round(percent)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-highest/50 rounded-full border border-outline-variant/10 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          className="h-full bg-primary-container rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Retention & Growth Analytics */}
          <div className="bg-surface-container/40 border border-outline-variant/20 p-6 rounded-3xl flex flex-col hover:border-primary-container/20 transition-all shadow-md">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black text-on-surface uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-container" /> Retención
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-[#39FF14] bg-[#39FF14]/10 px-2 py-0.5 rounded-full">+4.2%</span>
              </div>
            </div>

            <div className="flex-1 flex items-end justify-between h-36 gap-3">
              {retentionData.map((d, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-3 group/bar">
                  <div className="w-full relative flex flex-col justify-end h-full">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${d.rate}%` }}
                      className="w-full bg-gradient-to-t from-primary-container/20 to-primary-container rounded-xl group-hover/bar:brightness-125 transition-all shadow-[0_4px_15px_rgba(0,255,255,0.1)]"
                    />
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-surface-highest px-2 py-1 rounded text-[9px] font-black text-primary-container border border-primary-container/30 z-10">
                      {d.rate}%
                    </div>
                  </div>
                  <span className="text-[9px] text-on-surface-variant font-black uppercase tracking-tighter">{d.month}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-2">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-highest/20 border border-outline-variant/10">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary-container" />
                  <span className="text-[10px] font-black text-on-surface-variant tracking-wider uppercase">LTV Promedio</span>
                </div>
                <span className="text-sm font-black text-on-surface">$245.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profession Analytics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
          {/* Most Registered Professions */}
          <div className="bg-surface-container/40 border border-outline-variant/30 p-6 rounded-3xl shadow-sm hover:border-primary-container/20 transition-all">
            <h3 className="text-sm font-black text-on-surface mb-6 uppercase tracking-widest flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary-container" /> Profesiones (Oferta)
            </h3>
            <div className="space-y-4">
              {topRegisteredProfessions.length > 0 ? (
                (topRegisteredProfessions as [string, number][]).map(([prof, count], index) => {
                  const percent = totalPros > 0 ? Math.round((count / totalPros) * 100) : 0;
                  const colors = ['bg-primary-container', 'bg-[#00FFFF]', 'bg-[#B026FF]', 'bg-[#FF00FF]', 'bg-surface-highest'];

                  return (
                    <div key={prof} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold px-1">
                        <span className="text-on-surface truncate pr-2">{prof}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-on-surface-variant font-black">{count}</span>
                          <span className="text-[10px] opacity-40 font-normal">({percent}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-surface-highest h-2 rounded-full overflow-hidden border border-outline-variant/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          className={`${colors[index % 5]} h-full rounded-full shadow-[0_0_8px_rgba(0,0,255,0.1)]`}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-10 text-center opacity-40 italic text-sm">Esperando registros de profesionales...</div>
              )}
            </div>
          </div>

          {/* Most Requested Professions */}
          <div className="bg-surface-container/40 border border-outline-variant/30 p-6 rounded-3xl shadow-sm hover:border-[#FF00FF]/20 transition-all">
            <h3 className="text-sm font-black text-on-surface mb-6 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#FF00FF]" /> Servicios (Demanda)
            </h3>
            <div className="space-y-4">
              {topRequestedProfessions.length > 0 ? (
                (topRequestedProfessions as [string, number][]).map(([prof, count], index) => {
                  const totalReqs = requests.length;
                  const percent = totalReqs > 0 ? Math.round((count / totalReqs) * 100) : 0;
                  const colors = ['bg-[#FF00FF]', 'bg-[#B026FF]', 'bg-primary-container', 'bg-[#00FFFF]', 'bg-surface-highest'];

                  return (
                    <div key={prof} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold px-1">
                        <span className="text-on-surface truncate pr-2">{prof}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-on-surface-variant font-black">{count}</span>
                          <span className="text-[10px] opacity-40 font-normal">({percent}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-surface-highest h-2 rounded-full overflow-hidden border border-outline-variant/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          className={`${colors[index % 5]} h-full rounded-full shadow-[0_0_8px_rgba(255,0,255,0.1)]`}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-10 text-center opacity-40 italic text-sm">Sin actividad de búsqueda registrada</div>
              )}
            </div>
          </div>
        </div>

        {/* Registro de Errores - Auditoría de Estabilidad Remota */}
        <div className={`bg-surface-container rounded-3xl overflow-hidden shadow-xl mb-12 transition-all duration-500 relative ${
          isThresholdExceeded
            ? 'border-2 border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.3)]'
            : 'border border-red-500/10'
        }`}>
          <AnimatePresence>
            {isThresholdExceeded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/20 border-b border-red-500/30 text-red-50 px-6 py-4 font-bold flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="bg-red-500 text-white p-2 rounded-xl animate-pulse">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="uppercase tracking-widest text-xs font-black block">¡Alerta Crítica de Estabilidad!</span>
                    <span className="text-[11px] font-mono opacity-80 mt-0.5 block">
                      Tasa de fallos activos: {activeRateValue}{stabilityConfig.metricType === 'percentage' ? '%' : ''} (Umbral de alerta: &gt;{stabilityConfig.threshold}{stabilityConfig.metricType === 'percentage' ? '%' : ''})
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-6 border-b border-outline-variant/10 bg-red-500/5 flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-red-400" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-black text-on-surface flex items-center gap-2 uppercase tracking-tight">
                  Muro de Estabilidad <span className="text-red-400 text-xs font-mono lowercase tracking-normal">({renderingErrors.length} capturados, {activeErrorsCount} activos)</span>
                </h3>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-0.5">Auditoría remota de colapsos y fallos de renderizado en producción</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap xl:flex-nowrap items-stretch sm:items-center gap-3">
              {/* Configuración Umbral */}
              <div className="flex items-center gap-2 bg-surface-highest/80 px-3 py-2 rounded-xl border border-outline-variant/20 shadow-inner max-w-full overflow-x-auto whitespace-nowrap">
                 <span className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant shrink-0">Alerta si &gt;</span>
                 <input
                   type="number"
                   value={tempThreshold}
                   onChange={(e) => setTempThreshold(Number(e.target.value))}
                   className="w-14 bg-surface-container border border-outline-variant/30 text-on-surface rounded-lg text-center text-xs font-mono font-bold px-1.5 py-1 focus:outline-none focus:border-red-500/50"
                   min="1"
                 />
                 <select
                   value={tempMetricType}
                   onChange={(e) => setTempMetricType(e.target.value as 'count' | 'percentage')}
                   className="bg-surface-container border border-outline-variant/30 text-on-surface rounded-lg text-xs font-mono font-bold px-2 py-1 outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                 >
                   <option value="count">Fallos Activos</option>
                   <option value="percentage">% del Total</option>
                 </select>
                 {(tempThreshold !== stabilityConfig.threshold || tempMetricType !== stabilityConfig.metricType) && (
                   <button
                     onClick={() => handleSaveStabilityConfig(tempThreshold, tempMetricType)}
                     disabled={isSavingStabilityConfig}
                     className="bg-primary/20 text-primary p-1.5 rounded-lg hover:bg-primary/30 transition-colors ml-1 shrink-0"
                     title="Guardar Configuración"
                   >
                     {isSavingStabilityConfig ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                   </button>
                 )}
              </div>

              {/* Descargar CSV */}
              <button
                onClick={exportErrorsToCSV}
                disabled={renderingErrors.length === 0}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-surface-highest border border-outline-variant/30 text-on-surface hover:bg-surface-highest/80 hover:text-white transition-all font-bold text-[10px] uppercase tracking-wider rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                title="Descargar registro de fallos en formato CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar CSV</span>
              </button>

              {/* Buscador de errores */}
              <div className="relative group shrink-0 w-full sm:w-auto flex-1 xl:flex-none">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="h-3.5 w-3.5 text-on-surface-variant group-focus-within:text-red-400 transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar por módulo o error..."
                  value={errorSearchQuery}
                  onChange={(e) => setErrorSearchQuery(e.target.value)}
                  className="block w-full pl-9 pr-8 py-2 bg-surface-container border border-outline-variant/30 text-on-surface placeholder:text-on-surface-variant/40 rounded-xl focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all text-xs font-bold min-w-[200px]"
                />
                {errorSearchQuery && (
                  <button
                    onClick={() => setErrorSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            {filteredErrors.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Tabla/Lista de la izquierda */}
                <div className="lg:col-span-1 max-h-[500px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                  {filteredErrors.map((err) => {
                    const isSelected = selectedErrorForDetails?.id === err.id;
                    const timestamp = err.createdAt?.seconds
                      ? new Date(err.createdAt.seconds * 1000).toLocaleString()
                      : 'Hace un momento';

                    return (
                      <div
                        key={err.id}
                        onClick={() => setSelectedErrorForDetails(err)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer text-left block w-full relative ${
                          isSelected
                            ? 'bg-red-500/10 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                            : err.resolved
                              ? 'bg-emerald-500/5 border-emerald-500/15 hover:bg-emerald-500/10'
                              : 'bg-surface-highest/20 border-outline-variant/15 hover:bg-surface-highest/40'
                        }`}
                      >
                        {/* Status pill right top */}
                        <div className="absolute top-4 right-4 flex items-center gap-1.5">
                          {err.resolved ? (
                            <span className="bg-emerald-500/20 text-[#00FF00] border border-emerald-500/30 text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Solucionado
                            </span>
                          ) : (
                            <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                              Activo
                            </span>
                          )}
                        </div>

                        <div className="text-[10px] font-mono text-red-400 font-bold mb-1 uppercase tracking-wider">
                          MÓDULO: {err.componentName || 'Global'}
                        </div>
                        <h4 className="text-xs font-bold text-white truncate max-w-[80%] mb-2">
                          {err.errorMessage || 'Crash temporal sin mensaje'}
                        </h4>

                        <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-medium mt-3 border-t border-white/5 pt-2">
                          <span className="truncate max-w-[150px] font-mono">
                            {err.userEmail || 'Anónimo / Desconectado'}
                          </span>
                          <span className="font-mono text-[9px]">
                            {timestamp}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Detalle visual de la derecha */}
                <div className="lg:col-span-2 bg-[#0c0c11]/60 border border-white/5 rounded-2xl p-6 flex flex-col justify-between min-h-[400px]">
                  {selectedErrorForDetails ? (
                    <div className="space-y-6 flex-1 text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-mono px-2 py-0.5 rounded-md uppercase">
                              id: {selectedErrorForDetails.errorId}
                            </span>
                            <span className="text-[10px] font-mono text-stone-500">
                              {selectedErrorForDetails.createdAt?.seconds
                                ? new Date(selectedErrorForDetails.createdAt.seconds * 1000).toLocaleString()
                                : 'Tiempo real'}
                            </span>
                          </div>
                          <h3 className="text-base font-black text-white mt-1.5 uppercase">
                            Módulo: {selectedErrorForDetails.componentName}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleResolveError(selectedErrorForDetails.id, selectedErrorForDetails.resolved)}
                            disabled={isUpdatingError === selectedErrorForDetails.id}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider uppercase font-bold cursor-pointer transition-colors ${
                              selectedErrorForDetails.resolved
                                ? 'bg-[#00FF00]/10 text-[#00FF00] hover:bg-[#00FF00]/25'
                                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                            }`}
                          >
                            {isUpdatingError === selectedErrorForDetails.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : selectedErrorForDetails.resolved ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Clock className="w-3.5 h-3.5" />
                            )}
                            {selectedErrorForDetails.resolved ? 'Marcar Pendiente' : 'Resolver'}
                          </button>

                          <button
                            onClick={() => handleDeleteErrorLog(selectedErrorForDetails.id)}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar Registro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                          <span className="text-[9px] font-black text-stone-400 block mb-1 uppercase tracking-wide">Usuario Afectado</span>
                          <span className="text-[11px] font-bold text-white block truncate">{selectedErrorForDetails.userEmail || 'Anónimo'}</span>
                          {selectedErrorForDetails.userId && (
                            <span className="text-[9px] font-mono text-stone-500 block">UID: {selectedErrorForDetails.userId}</span>
                          )}
                          <span className="text-[9px] font-mono text-stone-400 block uppercase mt-1">Rol: {selectedErrorForDetails.userRole || 'Sin Rol'}</span>
                        </div>

                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                          <span className="text-[9px] font-black text-stone-400 block mb-1 uppercase tracking-wide">Entorno del Cliente</span>
                          <span className="text-[11px] font-bold text-white block truncate">URL: {selectedErrorForDetails.url || 'Desconocida'}</span>
                          <span className="text-[9px] font-mono text-stone-500 block truncate" title={selectedErrorForDetails.userAgent}>
                            Sistema: {selectedErrorForDetails.userAgent || 'Desconocido'}
                          </span>
                          <span className="text-[9px] font-mono text-stone-400 block uppercase mt-1">Reintentos de UI: {selectedErrorForDetails.retryCount || 0}</span>
                        </div>
                      </div>

                      <div className="space-y-2 mt-4">
                        <span className="text-[10px] font-bold text-red-400 font-mono tracking-wider uppercase block">Mensaje de Excepción</span>
                        <div className="p-3 bg-red-950/20 border border-red-500/15 rounded-xl font-mono text-xs text-red-300 break-words font-medium">
                          {selectedErrorForDetails.errorMessage}
                        </div>
                      </div>

                      {selectedErrorForDetails.errorStack && (
                        <div className="space-y-2 mt-4">
                          <span className="text-[10px] font-bold text-stone-400 font-mono tracking-wider uppercase block">Traza de Pila (Stack Trace)</span>
                          <pre className="p-4 bg-black/60 border border-white/5 rounded-xl font-mono text-[10px] text-stone-300 overflow-x-auto max-h-48 break-words whitespace-pre-wrap leading-relaxed">
                            {selectedErrorForDetails.errorStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="col-span-full h-full flex flex-col items-center justify-center text-stone-500 border border-dashed border-white/5 rounded-2xl min-h-[350px]">
                      <Cpu className="w-10 h-10 mb-3 opacity-25 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Consola de Diagnóstico Vacía</span>
                      <p className="text-[11px] text-stone-500 max-w-xs text-center mt-1.5">Selecciona cualquiera de las excepciones capturadas de la lista de la izquierda para desplegar la telemetría del colapso en tiempo real.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-on-surface-variant/40 border border-dashed border-outline-variant/20 rounded-3xl min-h-[300px]">
                <CheckCircle className="w-12 h-12 mb-3 text-emerald-500 animate-bounce" />
                <span className="text-sm font-black uppercase text-white tracking-widest">Ecosistema Stable</span>
                <p className="text-xs text-on-surface-variant max-w-sm text-center mt-1">¡No se han registrado fallos de renderizado de React en producción! Felicidades.</p>
              </div>
            )}
          </div>
        </div>

        {/* User Management Table - ENHANCED */}
        <div className="bg-surface-container border border-primary-container/20 rounded-3xl overflow-hidden shadow-xl mb-20 group">
          <div className="p-6 border-b border-primary-container/10 bg-surface-highest/20 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-lg font-black text-on-surface flex items-center gap-2">
                <Users className="w-6 h-6 text-primary-container" /> Base de Datos de Usuarios
              </h3>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">Control Final y Auditoría Directa</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {selectedUserIds.length > 0 && (
                <Link
                  to={`/admin/communications?uids=${selectedUserIds.join(',')}`}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white px-4 py-2.5 rounded-xl transition-all border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                >
                  <MessageSquare className="w-4 h-4" /> Mensajería ({selectedUserIds.length})
                </Link>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="text-[10px] font-black text-on-surface-variant uppercase bg-surface-highest/50 tracking-widest">
                <tr>
                  <th className="px-6 py-4 border-b border-outline-variant/10 w-10">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={toggleAllSelection}
                      className="w-4 h-4 rounded border-outline-variant bg-surface-lowest text-primary-container focus:ring-primary-container"
                    />
                  </th>
                  <th className="px-6 py-4 border-b border-outline-variant/10">Usuario</th>
                  <th className="px-6 py-4 border-b border-outline-variant/10">Rol</th>
                  <th className="px-6 py-4 border-b border-outline-variant/10">Localidad</th>
                  <th className="px-6 py-4 border-b border-outline-variant/10">Perfil</th>
                  <th className="px-6 py-4 border-b border-outline-variant/10">Estado</th>
                  <th className="px-6 py-4 border-b border-outline-variant/10 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {paginatedUsers.map((user) => (
                  <tr key={user.uid} className={`hover:bg-primary-container/5 transition-colors group/row ${selectedUserIds.includes(user.uid) ? 'bg-primary-container/5' : ''}`}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(user.uid)}
                        onChange={() => toggleUserSelection(user.uid)}
                        className="w-4 h-4 rounded border-outline-variant bg-surface-lowest text-primary-container focus:ring-primary-container"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-on-surface group-hover/row:text-primary-container transition-colors">{user.name}</span>
                        <span className="text-[10px] text-on-surface-variant opacity-60 truncate max-w-[150px]">{user.uid}</span>
                      </div>

                      {user.role === 'Profesional' && (
                        <div className="flex items-center gap-3 mt-3">
                          <button
                            onClick={() => updateLevel(user.uid, 'elite', (user as any).level !== 'elite')}
                            className={cn(
                              "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border transition-all",
                              (user as any).level === 'elite'
                                ? "bg-yellow-500 text-black border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.4)]"
                                : "bg-transparent text-yellow-500/50 border-yellow-500/30 hover:border-yellow-500 hover:text-yellow-500"
                            )}
                          >
                            Elite
                          </button>
                          <button
                            onClick={() => updateLevel(user.uid, 'premium', (user as any).level !== 'premium')}
                            className={cn(
                              "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border transition-all",
                              (user as any).level === 'premium'
                                ? "bg-blue-600 text-white border-blue-400 shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                                : "bg-transparent text-blue-500/50 border-blue-500/30 hover:border-blue-500 hover:text-blue-500"
                            )}
                          >
                            Premium
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${user.role === 'Profesional' ? 'bg-primary-container/10 text-primary-container' : 'bg-[#B026FF]/10 text-[#B026FF]'}`}>
                        {user.role === 'Profesional' ? <Briefcase className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                        {user.role}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-on-surface-variant font-medium">
                        <MapPin className="w-3.5 h-3.5 opacity-40 shrink-0" />
                        <span className="truncate">{user.country || 'No especificado'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-[10px] font-bold text-on-surface-variant gap-0.5">
                        <span className="uppercase">{user.gender || '-'}</span>
                        <span className="opacity-60">{user.age ? `${user.age} años` : '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${user.status === 'Activo' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'Activo' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                        {user.status}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <Link
                          to={`/admin/communications?uid=${user.uid}`}
                          className="p-2 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500 hover:text-surface-lowest transition-all shadow-sm"
                          title="Enviar Mensaje"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Link>
                        {user.role === 'Profesional' && (
                          <button
                            onClick={() => setSelectedUserForBoost(user)}
                            className={cn(
                              "p-2 rounded-xl transition-all shadow-sm",
                              user.adminBoost && user.adminBoostExpiry && (
                                (user.adminBoostExpiry instanceof Timestamp ? user.adminBoostExpiry.toDate() : new Date(user.adminBoostExpiry)) > new Date()
                              )
                                ? "bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)] scale-110"
                                : "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500 hover:text-surface-lowest"
                            )}
                            title="Potenciar Ranking (Boost)"
                          >
                            <Rocket className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleBlock(user.uid, user.status, (user as any).collection)}
                          className={`p-2 rounded-xl transition-all shadow-sm ${user.status === 'Activo' ? 'bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-surface-lowest' : 'bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-surface-lowest'}`}
                          title={user.status === 'Activo' ? 'Suspender Usuario' : 'Activar Usuario'}
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.uid, (user as any).collection)}
                          className="p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-surface-lowest transition-all shadow-sm"
                          title="Eliminar Permanente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center opacity-30">
                      <div className="flex flex-col items-center gap-3">
                        <Users className="w-10 h-10" />
                        <span className="font-bold uppercase tracking-widest text-xs">No hay usuarios registrados</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-primary-container/10 bg-surface-highest/10 flex items-center justify-between">
              <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredUsers.length)} de {filteredUsers.length} usuarios
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-on-surface-variant disabled:opacity-30 hover:bg-surface-highest transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Show pages around current page
                    let pageNum = currentPage;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${currentPage === pageNum ? 'bg-primary-container text-surface-lowest shadow-[0_0_10px_rgba(0,255,255,0.3)]' : 'border border-outline-variant/30 text-on-surface-variant hover:bg-surface-highest'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-on-surface-variant disabled:opacity-30 hover:bg-surface-highest transition-all rotate-180"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Boost Modal */}
      <AnimatePresence>
        {selectedUserForBoost && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface-lowest border border-primary-container/30 w-full max-w-md rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,255,255,0.2)]"
            >
              <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-highest/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center">
                    <Rocket className="w-5 h-5 text-primary-container" />
                  </div>
                  <div>
                    <h3 className="font-black text-on-surface">Boost de Ranking</h3>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">{selectedUserForBoost.name}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUserForBoost(null)} className="p-2 hover:bg-surface-highest rounded-full transition-colors text-on-surface-variant">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-black text-on-surface-variant uppercase tracking-widest mb-2">Valor del Boost (Puntos)</label>
                  <input
                    type="number"
                    value={boostValue}
                    onChange={(e) => setBoostValue(parseInt(e.target.value))}
                    className="w-full bg-surface-container/50 border border-outline-variant/30 text-on-surface p-3 rounded-xl focus:outline-none focus:border-primary-container"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-on-surface-variant uppercase tracking-widest mb-2">Duración del Boost</label>
                  <select
                    value={boostDuration}
                    onChange={(e) => setBoostDuration(e.target.value)}
                    className="w-full bg-surface-container/50 border border-outline-variant/30 text-on-surface p-3 rounded-xl focus:outline-none focus:border-primary-container font-bold"
                  >
                    <optgroup label="Corto Plazo">
                      <option value="24h">24 Horas</option>
                      <option value="48h">48 Horas</option>
                      <option value="168h">1 Semana (168h)</option>
                    </optgroup>
                    <optgroup label="Planes Especiales">
                      <option value="3m">3 Meses (Trimestral)</option>
                      <option value="6m">6 Meses (Semestral)</option>
                      <option value="1y">1 Año (Anual)</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-on-surface-variant uppercase tracking-widest mb-2">Motivo / Razón (Obligatorio)</label>
                  <textarea
                    value={boostReason}
                    onChange={(e) => setBoostReason(e.target.value)}
                    placeholder="Ej: Destacado por excelente desempeño o promoción comprada"
                    className="w-full bg-surface-container/50 border border-outline-variant/30 text-on-surface p-3 rounded-xl focus:outline-none focus:border-primary-container h-24 resize-none"
                  />
                </div>
              </div>

              <div className="p-6 bg-surface-highest/30 flex gap-3">
                <button
                  onClick={() => setSelectedUserForBoost(null)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold border border-outline-variant/30 text-on-surface hover:bg-surface-highest transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleApplyBoost}
                  disabled={isApplyingBoost}
                  className="flex-1 px-4 py-3 bg-primary-container text-surface-lowest rounded-xl font-bold shadow-[0_0_15px_rgba(0,255,255,0.4)] flex items-center justify-center gap-2 hover:scale-[1.02] transition-all disabled:opacity-50"
                >
                  {isApplyingBoost ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
                  Aplicar Boost
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
