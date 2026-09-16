import React, { useEffect, useState, useCallback } from 'react';
import { WifiOff, Wifi, RefreshCw, CloudUpload } from 'lucide-react';
import { toast } from 'sonner';
import {
  getPendingQueueCount,
  processOfflineQueue,
  OFFLINE_QUEUE_CHANGED_EVENT,
} from '@/libs/utils/offlineQueue';
import { store } from '@/libs/state/redux/store';

/**
 * Global offline detection banner that alerts the user when internet connection is lost,
 * displays pending offline queue status, and automatically syncs when connection is restored.
 *
 * @returns {JSX.Element | null}
 */
const NetworkStatusBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState<number>(getPendingQueueCount());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const handleSyncQueue = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    try {
      await processOfflineQueue(() => store.getState().authSlice?.token);
      setPendingCount(getPendingQueueCount());
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  useEffect(() => {
    const handleQueueChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ count: number }>;
      setPendingCount(customEvent.detail?.count ?? getPendingQueueCount());
    };

    const handleOnline = () => {
      setIsOnline(true);
      toast.success('¡Conexión a internet restablecida!', {
        icon: <Wifi className="text-emerald-500" size={18} />,
        duration: 3500,
      });
      // Automatically drain the offline queue when connection is restored
      void handleSyncQueue();
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
    window.addEventListener(OFFLINE_QUEUE_CHANGED_EVENT, handleQueueChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener(OFFLINE_QUEUE_CHANGED_EVENT, handleQueueChange);
    };
  }, [handleSyncQueue]);

  if (isOnline && pendingCount === 0) return null;

  // Render offline banner or pending sync banner
  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[99999] bg-gradient-to-r from-red-600 to-rose-600 text-white px-3 py-2 text-xs shadow-lg flex items-center justify-between animate-in slide-in-from-top duration-300">
        <div className="flex items-center gap-2 font-medium min-w-0">
          <WifiOff size={16} className="shrink-0 animate-pulse" />
          <span className="truncate">
            <strong>Sin conexión a internet.</strong>{' '}
            {pendingCount > 0
              ? `${pendingCount} ${pendingCount === 1 ? 'operación guardada' : 'operaciones guardadas'} para sincronizar.`
              : 'Algunas funciones requieren conexión.'}
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
  }

  // If online but has pending operations to sync
  return (
    <div className="fixed top-0 left-0 right-0 z-[99999] bg-gradient-to-r from-amber-600 to-orange-600 text-white px-3 py-2 text-xs shadow-lg flex items-center justify-between animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2 font-medium min-w-0">
        <CloudUpload size={16} className={`shrink-0 ${isSyncing ? 'animate-bounce' : ''}`} />
        <span className="truncate">
          <strong>Sincronización pendiente:</strong> {pendingCount}{' '}
          {pendingCount === 1 ? 'operación local' : 'operaciones locales'} por enviar al servidor.
        </span>
      </div>
      <button
        type="button"
        disabled={isSyncing}
        onClick={handleSyncQueue}
        className="shrink-0 ml-2 px-2.5 py-1 bg-white/20 hover:bg-white/30 disabled:opacity-50 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1 active:scale-95"
      >
        <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />{' '}
        {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
      </button>
    </div>
  );
};

export default NetworkStatusBanner;
