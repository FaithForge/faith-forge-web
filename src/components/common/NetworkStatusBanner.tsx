import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Global offline detection banner that alerts the user when internet connection is lost
 * and automatically notifies when connection is restored.
 *
 * @returns {JSX.Element | null}
 */
const NetworkStatusBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('¡Conexión a internet restablecida!', {
        icon: <Wifi className="text-emerald-500" size={18} />,
        duration: 3500,
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Sin conexión a internet. Verificando red...', {
        icon: <WifiOff className="text-red-500" size={18} />,
        duration: 5000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[99999] bg-gradient-to-r from-red-600 to-rose-600 text-white px-3 py-2 text-xs shadow-lg flex items-center justify-between animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2 font-medium min-w-0">
        <WifiOff size={16} className="shrink-0 animate-pulse" />
        <span className="truncate">
          <strong>Sin conexión a internet.</strong> Algunas funciones requieren conexión.
        </span>
      </div>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="shrink-0 ml-2 px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1 active:scale-95"
      >
        <RefreshCw size={12} /> Reintentar
      </button>
    </div>
  );
};

export default NetworkStatusBanner;
