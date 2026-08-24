import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, Sparkles, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';
import { clearAppCacheAndReload } from '@/libs/utils/appCache';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global ErrorBoundary to catch unhandled runtime errors,
 * render failures, or broken cached chunks, preventing white screens.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleClearCache = async () => {
    await clearAppCacheAndReload();
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-xl border border-gray-100 flex flex-col items-center animate-in zoom-in-95 fade-in duration-300">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5 shadow-xs">
              <Sparkles size={32} />
            </div>

            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Actualización disponible
            </h1>

            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              La aplicación necesita renovar sus archivos temporales para continuar funcionando sin problemas.
            </p>

            <div className="w-full flex flex-col gap-3">
              <Button
                onClick={this.handleClearCache}
                block
                variant="primary"
                className="flex items-center justify-center gap-2 py-3"
              >
                <RotateCcw size={18} />
                Limpiar caché y actualizar
              </Button>

              <Button
                onClick={this.handleReload}
                block
                variant="ghost"
                className="flex items-center justify-center gap-2 py-2.5"
              >
                <RefreshCw size={16} />
                Reintentar
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
