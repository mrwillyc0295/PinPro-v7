import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Error capturado en la aplicación:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#12141a] border border-red-500/30 rounded-3xl p-6 sm:p-8 text-center shadow-2xl backdrop-blur-xl">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-400 animate-pulse">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight mb-2">
              Algo no salió como esperábamos
            </h1>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Inconveniente temporal detectado en la plataforma. No te preocupes, tus datos están a salvo.
            </p>

            {this.state.error && (
              <div className="mb-6 p-3 bg-black/50 border border-white/5 rounded-xl text-left overflow-x-auto max-h-32">
                <code className="text-xs text-red-300 font-mono break-all">
                  {this.state.error.toString()}
                </code>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-[#00FFFF] text-black font-bold rounded-xl hover:bg-cyan-400 transition-colors text-sm cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reintentar
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors text-sm cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Volver al Inicio
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const SafeBoundary: React.FC<{ children: ReactNode; name?: string }> = ({ children, name }) => {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 m-2 bg-[#12141a] border border-amber-500/20 rounded-2xl text-center text-amber-200 text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Módulo {name ? `"${name}"` : 'secundario'} no disponible temporalmente.</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
};
