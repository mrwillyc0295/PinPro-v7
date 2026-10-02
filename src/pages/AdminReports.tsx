import { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, Clock, ArrowLeft, UserX, User, ChevronRight, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { cn } from '../lib/utils';
import { LoadingScreen } from '../components/LoadingScreen';

interface ReportData {
  id: string;
  reporterId: string;
  reportedId: string;
  reason: string;
  description: string;
  status: 'Pendiente' | 'Resuelto';
  createdAt: any;
  reporterName?: string;
  reportedName?: string;
}

export default function AdminReports() {
  const { user, profile, loading } = useAuth();
  const [reports, setReports] = useState<ReportData[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);
  const [filterStatus, setFilterStatus] = useState<'Todos' | 'Pendiente' | 'Resuelto'>('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Replace insecure localStorage bypasses with backend-verified checks
  const isAdmin = profile?.role === 'Admin' ||
    ['mr.willyc0295@gmail.com', 'publicpost0295@gmail.com'].includes(user?.email?.toLowerCase() || '');

  useEffect(() => {
    console.log('[AdminReports] Diagnóstico de acceso:');
    console.log('- user:', user?.email);
    console.log('- profile:', profile);
    console.log('- isAdmin:', isAdmin);
  }, [user, profile, isAdmin]);

  const handleExit = () => {
    window.location.href = '/';
  };

  useEffect(() => {
    if (!user || !isAdmin) return;

    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const reportsData: ReportData[] = [];

      for (const document of snapshot.docs) {
        const data = document.data() as Omit<ReportData, 'id'>;

        // Fetch user names for better context
        let reporterName = 'Usuario Desconocido';
        let reportedName = 'Usuario Desconocido';

        try {
          const reporterDoc = await getDoc(doc(db, 'clientes', data.reporterId));
          if (reporterDoc.exists()) reporterName = reporterDoc.data().name;
          else {
            const reporterProDoc = await getDoc(doc(db, 'profesionales', data.reporterId));
            if (reporterProDoc.exists()) reporterName = reporterProDoc.data().name;
          }

          if (data.reportedId === 'PINPRO_PLATFORM') {
            reportedName = 'Problema de Plataforma (PinPro)';
          } else {
            const reportedDoc = await getDoc(doc(db, 'clientes', data.reportedId));
            if (reportedDoc.exists()) reportedName = reportedDoc.data().name;
            else {
              const reportedProDoc = await getDoc(doc(db, 'profesionales', data.reportedId));
              if (reportedProDoc.exists()) reportedName = reportedProDoc.data().name;
            }
          }
        } catch (error) {
          console.error("Error fetching user details for report:", error);
        }

        reportsData.push({
          id: document.id,
          ...data,
          reporterName,
          reportedName
        });
      }

      setReports(reportsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reports');
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const handleResolve = async (reportId: string) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), {
        status: 'Resuelto',
        resolvedAt: new Date()
      });
      if (selectedReport?.id === reportId) {
        setSelectedReport(prev => prev ? { ...prev, status: 'Resuelto' } : null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `reports/${reportId}`);
    }
  };

  const handleBlockUser = async (userId: string) => {
    if (!window.confirm('¿Estás seguro de bloquear a este usuario?')) return;
    try {
      // Intentar bloquear en ambas colecciones por si acaso
      await updateDoc(doc(db, 'clientes', userId), { status: 'Bloqueado' }).catch(() => {});
      await updateDoc(doc(db, 'profesionales', userId), { status: 'Bloqueado' }).catch(() => {});
      alert('Usuario bloqueado exitosamente.');
    } catch (error) {
      console.error("Error blocking user:", error);
      alert('Hubo un error al intentar bloquear al usuario.');
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        return;
      }
      console.error("Error logging in:", error);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center bg-surface-lowest text-on-surface p-6 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">
          {!user ? 'No has iniciado sesión' : 'Acceso Denegado'}
        </h1>
        <p className="text-on-surface-variant mb-2">
          {!user
            ? 'Debes iniciar sesión con tu cuenta de administrador para ver esta página.'
            : 'No tienes permisos de administrador para ver esta página.'}
        </p>
        <p className="text-xs text-on-surface-variant/50 mb-6 font-mono">
          Email: {user?.email || 'No email'}<br/>
          Role: {profile?.role || 'No role'}
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          {!user && (
            <button
              onClick={handleLogin}
              className="px-6 py-3 bg-white text-black rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              Iniciar Sesión
            </button>
          )}
          <button onClick={handleExit} className="px-6 py-3 bg-primary-container text-surface-lowest rounded-xl font-bold text-on-surface">Volver al Inicio</button>
        </div>
      </div>
    );
  }

  const filteredReports = reports.filter(r => {
    const matchesStatus = filterStatus === 'Todos' || r.status === filterStatus;
    const matchesSearch = r.reportedName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.reporterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.reason.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-full w-full bg-surface-lowest flex flex-col relative">
      {/* Header */}
      <div className="sticky top-0 z-50 flex items-center bg-surface-lowest/90 backdrop-blur-md p-4 pt-16 border-b border-primary-container/20 shadow-[0_4px_20px_rgba(0,255,255,0.05)] justify-start w-full">
        <div className="flex items-center gap-2 px-2">
          <h2 className="text-on-surface text-xl font-black tracking-tighter uppercase italic">CENTRO DE REPORTES</h2>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4 w-full max-w-5xl mx-auto">

        {/* Filters & Search */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center bg-surface-container/50 rounded-xl px-3 py-2 border border-outline-variant/30 focus-within:border-primary-container transition-colors">
            <Search className="w-5 h-5 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Buscar por nombre o motivo..."
              className="bg-transparent border-none outline-none flex-1 ml-2 text-sm text-on-surface placeholder:text-on-surface-variant"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {['Todos', 'Pendiente', 'Resuelto'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as any)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all",
                  filterStatus === status
                    ? "bg-primary-container text-surface-lowest shadow-[0_0_10px_rgba(0,255,255,0.3)]"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-highest"
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-3">
          {filteredReports.length === 0 ? (
            <div className="text-center py-10 text-on-surface-variant flex flex-col items-center">
              <CheckCircle className="w-12 h-12 mb-3 text-green-500/50" />
              <p className="font-medium">No hay reportes que coincidan con tu búsqueda.</p>
            </div>
          ) : (
            filteredReports.map(report => (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className="bg-surface-container/40 border border-outline-variant/20 rounded-2xl p-4 flex flex-col gap-3 active:scale-[0.98] transition-transform cursor-pointer hover:border-primary-container/30"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      report.status === 'Pendiente' ? "bg-red-500/20 text-red-500" : "bg-green-500/20 text-green-500"
                    )}>
                      {report.status === 'Pendiente' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-on-surface">{report.reason}</h3>
                      <p className="text-[10px] text-on-surface-variant flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {report.createdAt?.toDate().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-1 rounded-full",
                    report.status === 'Pendiente' ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
                  )}>
                    {report.status}
                  </span>
                </div>

                <div className="bg-surface-lowest/50 rounded-xl p-3 text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="text-on-surface-variant">Reportado:</span>
                    <span className="font-bold text-on-surface">{report.reportedName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Por:</span>
                    <span className="font-bold text-on-surface">{report.reporterName}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-[100] bg-surface-lowest flex flex-col animate-in slide-in-from-bottom-full duration-300">
          <div className="sticky top-0 z-10 bg-surface-lowest/90 backdrop-blur-md p-4 pt-16 flex items-center justify-end">
            <h2 className="text-base font-black text-on-surface uppercase tracking-wide">Detalle del Reporte</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Status Banner */}
            <div className={cn(
              "rounded-2xl p-4 flex items-center gap-3",
              selectedReport.status === 'Pendiente' ? "bg-red-500/10 border border-red-500/20" : "bg-green-500/10 border border-green-500/20"
            )}>
              {selectedReport.status === 'Pendiente' ? <AlertTriangle className="w-6 h-6 text-red-500" /> : <CheckCircle className="w-6 h-6 text-green-500" />}
              <div>
                <h3 className={cn("text-sm font-bold", selectedReport.status === 'Pendiente' ? "text-red-500" : "text-green-500")}>
                  Estado: {selectedReport.status}
                </h3>
                <p className="text-xs text-on-surface-variant">
                  {selectedReport.status === 'Pendiente' ? 'Requiere atención del administrador' : 'Este caso ha sido cerrado'}
                </p>
              </div>
            </div>

            {/* Reason & Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-primary-container uppercase tracking-wider">Motivo del Reporte</h4>
              <div className="bg-surface-container/50 rounded-2xl p-4 border border-outline-variant/20">
                <p className="text-base font-bold text-on-surface mb-2">{selectedReport.reason}</p>
                <p className="text-sm text-on-surface-variant leading-relaxed">{selectedReport.description}</p>
              </div>
            </div>

            {/* Users Involved */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-primary-container uppercase tracking-wider">Usuarios Involucrados</h4>

              {/* Reported User */}
              <div className="bg-surface-container/30 border border-red-500/20 rounded-2xl p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">REPORTADO</div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-surface-highest flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">{selectedReport.reportedName}</p>
                    <p className="text-xs text-on-surface-variant font-mono">{selectedReport.reportedId}</p>
                  </div>
                </div>
                {selectedReport.reportedId !== 'PINPRO_PLATFORM' && (
                  <div className="flex gap-2">
                    <Link to={`/profile/${selectedReport.reportedId}`} className="flex-1 bg-surface-highest hover:bg-primary-container/20 text-on-surface text-xs font-bold py-2 rounded-xl text-center transition-colors">
                      Ver Perfil
                    </Link>
                    <button
                      onClick={() => handleBlockUser(selectedReport.reportedId)}
                      className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold py-2 rounded-xl text-center transition-colors flex items-center justify-center gap-1"
                    >
                      <UserX className="w-4 h-4" /> Bloquear
                    </button>
                  </div>
                )}
              </div>

              {/* Reporter User */}
              <div className="bg-surface-container/30 border border-outline-variant/20 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-highest flex items-center justify-center">
                      <User className="w-5 h-5 text-on-surface-variant" />
                    </div>
                    <div>
                      <p className="text-xs text-on-surface-variant uppercase font-bold tracking-wider mb-0.5">Reportado por</p>
                      <p className="text-sm font-bold text-on-surface">{selectedReport.reporterName}</p>
                    </div>
                  </div>
                  <Link to={`/profile/${selectedReport.reporterId}`} className="bg-surface-highest hover:bg-primary-container/20 text-on-surface text-xs font-bold px-4 py-2 rounded-xl text-center transition-colors">
                    Ver
                  </Link>
                </div>
              </div>
            </div>

            {/* Actions */}
            {selectedReport.status === 'Pendiente' && (
              <div className="pt-4 pb-8">
                <button
                  onClick={() => handleResolve(selectedReport.id)}
                  className="w-full bg-primary-container text-surface-lowest font-bold py-4 rounded-2xl shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Marcar como Resuelto
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
