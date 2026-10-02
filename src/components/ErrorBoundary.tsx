import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Cpu, ShieldAlert, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { db, auth } from '../firebase';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  componentName?: string;
  local?: boolean;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
  showDetails: boolean;
  copied: boolean;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
      showDetails: false,
      copied: false,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Elegant, silent error aggregation
    console.error(`[Resilience Engine] Caught exception in ${this.props.componentName || 'Unknown Component'}:`, error, errorInfo);

    // Commit crash logs securely to Firestore
    this.logErrorToFirestore(error, errorInfo);
  }

  private async logErrorToFirestore(error: Error, errorInfo: ErrorInfo) {
    try {
      const errorId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      const currentUser = auth.currentUser;
      const errorMessage = error?.message || 'Unknown error';
      const errorStack = error?.stack || errorInfo?.componentStack || '';

      const cachedRole = sessionStorage.getItem('pinpro_cached_role') || null;
      const cachedEmail = sessionStorage.getItem('pinpro_cached_email') || null;

      const payload = {
        errorId,
        componentName: this.props.componentName || 'Unknown Component',
        errorMessage: errorMessage.substring(0, 8000),
        errorStack: errorStack.substring(0, 15000),
        userId: currentUser?.uid || null,
        userEmail: currentUser?.email || cachedEmail || null,
        userRole: cachedRole || (currentUser ? 'Cliente' : null),
        url: window.location.href.substring(0, 1000),
        userAgent: navigator.userAgent.substring(0, 1000),
        retryCount: this.state.retryCount,
        resolved: false,
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, 'rendering_errors', errorId), payload);
      console.log(`[Resilience Engine] Remote crash logs successfully synced to Firestore: ${errorId}`);
    } catch (err) {
      console.error('[Resilience Engine] Failed to dispatch crash report to remote audit database:', err);
    }
  }

  private isModuleLoadError = (error: Error | null): boolean => {
    if (!error) return false;
    const message = error.message || '';
    const name = error.name || '';
    return (
      name === 'ChunkLoadError' ||
      /chunk/i.test(message) ||
      /module/i.test(message) ||
      /loading/i.test(message) ||
      /failed to fetch/i.test(message) ||
      /script/i.test(message) ||
      /import/i.test(message)
    );
  };

  private handleReset = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      retryCount: prevState.retryCount + 1,
      copied: false,
    }), () => {
      if (this.props.onReset) {
        this.props.onReset();
      }
    });
  };

  private handleFullReload = () => {
    window.location.reload();
  };

  private handleCopyError = () => {
    if (!this.state.error) return;
    const report = `PinPro Resilience Report
Component: ${this.props.componentName || 'Global'}
Time: ${new Date().toISOString()}
Error Message: ${this.state.error.message}
Stack Trace: ${this.state.error.stack || 'No stack trace available'}
Retry Count: ${this.state.retryCount}`;

    navigator.clipboard.writeText(report).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    }).catch((err) => {
      console.error('Error copying report to clipboard:', err);
    });
  };

  public render() {
    const { hasError, error, retryCount, showDetails, copied } = this.state;
    const { fallback, componentName, local } = this.props;

    if (hasError) {
      // 1. Check if there was a custom fallback passed
      if (fallback) {
        if (typeof fallback === 'function') {
          return (fallback as Function)(error, this.handleReset);
        }
        return fallback;
      }

      const isChunkFailure = this.isModuleLoadError(error);
      let errorMessage = 'Lo sentimos, este componente ha experimentado una interrupción temporal.';
      let isFirestoreError = false;

      try {
        const parsedError = JSON.parse(error?.message || '');
        if (parsedError.error && parsedError.operationType) {
          isFirestoreError = true;
          errorMessage = `Error de conexión de datos: ${parsedError.error}`;
        }
      } catch (e) {
        if (error?.message) {
          errorMessage = error.message;
        }
      }

      // 2. Render LOCAL / INLINE component fallback to protect layout structure
      if (local) {
        return (
          <div className="flex flex-col items-center justify-center p-6 my-2 bg-[rgba(20,20,25,0.7)] backdrop-blur-md border border-white/5 rounded-2xl text-center min-h-[200px]">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5 text-indigo-400" />
            </div>
            <h4 className="text-xs font-bold text-white mb-1">
              {componentName ? `Módulo: ${componentName}` : 'Módulo desajustado'}
            </h4>
            <p className="text-[11px] text-stone-400 max-w-sm mb-3.5 leading-normal">
              {isChunkFailure
                ? 'Conexión interrumpida al descargar este componente de la aplicación.'
                : 'Se detectó un evento inesperado al procesar este bloque.'}
            </p>
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] font-bold px-4 py-2 rounded-lg shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Reintentar
            </button>
          </div>
        );
      }

      // 3. Render GLOBAL / FULLSCREEN immersive fallback
      return (
        <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-[#050505] p-8 text-center text-white font-sans select-none overflow-y-auto">
          {/* Cyber-capsule hologram */}
          <div className="relative mb-6 flex items-center justify-center">
            <div className="w-20 h-20 bg-blue-500/10 rounded-full border border-blue-500/20 flex items-center justify-center animate-pulse animate-duration-3000">
              <Cpu className="w-8 h-8 text-blue-400" />
            </div>
            <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-violet-600/25 border border-violet-500/40 text-violet-300 text-[9px] font-mono px-2 py-0.5 rounded-full tracking-wider uppercase">
              Resiliente
            </div>
          </div>

          <span className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase mb-2 block font-semibold">
            Escudo de Estabilidad PinPro
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-4 max-w-lg leading-normal">
            {isChunkFailure ? 'Mapeo de Red en Re-Sincronización' : 'Aislamiento de Módulo Exitoso'}
          </h1>

          <p className="text-stone-300 text-xs sm:text-[13px] leading-relaxed max-w-md mx-auto mb-6">
            {isChunkFailure ? (
              <>
                Estamos optimizando el ecosistema y desplegando componentes de alto rendimiento para potenciar las marcas locales en Latinoamérica.
                <span className="block mt-2 text-indigo-300 font-medium">La descarga de este panel puede reanudarse de inmediato presionando Reintentar.</span>
              </>
            ) : (
              'El motor inteligente de estabilidad de PinPro ha contenido un evento inesperado de ejecución. Tus herramientas de geolocalización, reservas y perfil están seguras de forma local.'
            )}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-xs mx-auto mb-8">
            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:scale-[1.02] text-white font-bold py-3 px-5 rounded-xl shadow-lg transition-transform text-xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reintentar Conexión
            </button>
            <button
              onClick={this.handleFullReload}
              className="w-full bg-[#15151a] hover:bg-[#1a1a24] text-white border border-white/5 hover:border-white/15 font-semibold py-3 px-5 rounded-xl transition-colors text-xs cursor-pointer"
            >
              Recargar Todo
            </button>
          </div>

          {/* Feedback message for retry count */}
          {retryCount > 0 && (
            <div className="text-[11px] text-stone-400 mb-6 bg-white/5 border border-white/5 px-4 py-2 rounded-xl max-w-xs mx-auto">
              Intento de recuperación #{retryCount}. Si la desconexión persiste, te sugerimos reiniciar la plataforma.
            </div>
          )}

          {/* Status info bars */}
          {isFirestoreError && (
            <div className="flex items-center gap-2 max-w-xs mx-auto mb-6 bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs px-4 py-2.5 rounded-xl">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span className="text-center font-medium">Re-autenticación de perfil requerida.</span>
            </div>
          )}

          {/* Diagnostic section */}
          <div className="w-full max-w-md mx-auto border border-white/5 rounded-xl overflow-hidden bg-stone-950/80">
            <button
              onClick={() => this.setState({ showDetails: !showDetails })}
              className="w-full flex items-center justify-between px-4 py-2.5 text-[10px] text-stone-400 hover:text-white transition-colors cursor-pointer"
            >
              <span className="font-mono tracking-wider">REGISTRO DE INGENIERÍA</span>
              {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showDetails && (
              <div className="border-t border-white/5 p-4 text-left font-mono">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] text-stone-500">RESISTENCIA_REGISTRO.log</span>
                  <button
                    onClick={this.handleCopyError}
                    className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-[9px] text-stone-400 hover:text-white px-2.5 py-1 rounded-md border border-white/5 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copiar diagnóstico
                      </>
                    )}
                  </button>
                </div>
                <div className="text-[10px] text-indigo-300 mb-2 truncate max-w-full">
                  Origen: {componentName || 'Página de Aplicación'}
                </div>
                <div className="text-[10px] text-red-400 break-words max-h-24 overflow-y-auto leading-relaxed border border-white/5 bg-black/60 p-2.5 rounded-lg">
                  {errorMessage}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

export default ErrorBoundary;
