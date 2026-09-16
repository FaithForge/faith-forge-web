import { HttpRequestMethod, MicroserviceEnum, API_BASE_URL } from '@/libs/common-types/global';
import axios from 'axios';
import { toast } from 'sonner';

export const OFFLINE_QUEUE_STORAGE_KEY = 'app_offline_mutation_queue';
export const OFFLINE_QUEUE_CHANGED_EVENT = 'offlineQueue:changed';

export interface QueuedMutation {
  id: string;
  microservice: MicroserviceEnum;
  method: HttpRequestMethod;
  url: string;
  data?: unknown;
  params?: Record<string, unknown>;
  idempotencyKey: string;
  timestamp: number;
  retryCount: number;
  description?: string;
}

/**
 * Generates a cryptographically secure or pseudo-random UUID v4 string.
 *
 * @returns {string} UUID v4 identifier.
 */
export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Retrieves the current offline queue from localStorage.
 *
 * @returns {QueuedMutation[]} Array of queued mutations.
 */
export const getOfflineQueue = (): QueuedMutation[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Error reading offline queue from localStorage:', err);
    return [];
  }
};

/**
 * Persists the offline queue to localStorage and notifies listeners.
 *
 * @param {QueuedMutation[]} queue - Array of queued mutations.
 */
export const saveOfflineQueue = (queue: QueuedMutation[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(OFFLINE_QUEUE_STORAGE_KEY, JSON.stringify(queue));
    window.dispatchEvent(
      new CustomEvent(OFFLINE_QUEUE_CHANGED_EVENT, { detail: { count: queue.length } })
    );
  } catch (err) {
    console.warn('Error saving offline queue to localStorage:', err);
  }
};

/**
 * Adds a mutation request to the offline queue with an idempotency key.
 *
 * @param {object} mutation - Mutation payload details.
 * @returns {QueuedMutation} The created queue item.
 */
export const enqueueOfflineMutation = (mutation: {
  microservice: MicroserviceEnum;
  method: HttpRequestMethod;
  url: string;
  data?: unknown;
  params?: Record<string, unknown>;
  description?: string;
  idempotencyKey?: string;
}): QueuedMutation => {
  const queue = getOfflineQueue();
  const newItem: QueuedMutation = {
    id: generateUUID(),
    microservice: mutation.microservice,
    method: mutation.method,
    url: mutation.url,
    data: mutation.data,
    params: mutation.params,
    idempotencyKey: mutation.idempotencyKey || generateUUID(),
    timestamp: Date.now(),
    retryCount: 0,
    description: mutation.description,
  };

  queue.push(newItem);
  saveOfflineQueue(queue);

  toast.info('Sin conexión. Operación guardada localmente para sincronizar al volver a conectarse.', {
    duration: 4000,
  });

  return newItem;
};

/**
 * Returns the current number of pending items in the offline queue.
 *
 * @returns {number} Pending queue count.
 */
export const getPendingQueueCount = (): number => {
  return getOfflineQueue().length;
};

/**
 * Removes a specific mutation from the offline queue by its unique ID.
 *
 * @param {string} id - The ID of the queued mutation.
 */
export const removeOfflineMutation = (id: string): void => {
  const queue = getOfflineQueue();
  const filtered = queue.filter((item) => item.id !== id);
  saveOfflineQueue(filtered);
};

/**
 * Clears the entire offline mutation queue.
 */
export const clearOfflineQueue = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(OFFLINE_QUEUE_STORAGE_KEY);
    window.dispatchEvent(
      new CustomEvent(OFFLINE_QUEUE_CHANGED_EVENT, { detail: { count: 0 } })
    );
  } catch (err) {
    console.warn('Error clearing offline queue:', err);
  }
};

// Singleton lock to prevent parallel executions of queue draining
let isProcessingQueue = false;

/**
 * Sequentially drains and processes all pending mutations in the offline queue.
 * Executes each request with its corresponding `Idempotency-Key` header.
 *
 * @param {Function} [getToken] - Function to retrieve the active JWT token.
 * @returns {Promise<{ total: number; succeeded: number; failed: number }>} Sync summary.
 */
export const processOfflineQueue = async (
  getToken?: () => string | undefined
): Promise<{ total: number; succeeded: number; failed: number }> => {
  if (isProcessingQueue) {
    return { total: 0, succeeded: 0, failed: 0 };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { total: 0, succeeded: 0, failed: 0 };
  }

  const initialQueue = getOfflineQueue();
  if (initialQueue.length === 0) {
    return { total: 0, succeeded: 0, failed: 0 };
  }

  isProcessingQueue = true;
  let succeeded = 0;
  let failed = 0;

  toast.loading(`Sincronizando ${initialQueue.length} ${initialQueue.length === 1 ? 'operación pendiente' : 'operaciones pendientes'}...`, {
    id: 'offline-sync-toast',
  });

  try {
    const token = getToken ? getToken() : undefined;
    const currentQueue = [...getOfflineQueue()];

    for (const item of currentQueue) {
      const baseURL = `${API_BASE_URL}/ms-${item.microservice}`;
      const url = item.url;
      const headers: Record<string, string> = {
        'Idempotency-Key': item.idempotencyKey,
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      try {
        await axios({
          baseURL,
          url,
          method: item.method,
          data: item.data,
          params: item.params,
          headers,
          timeout: 15000,
        });

        // Mutation succeeded, remove it from persistent queue
        removeOfflineMutation(item.id);
        succeeded++;
      } catch (err: unknown) {
        // Check if error is a permanent client rejection (4xx except 408 / 429)
        const axiosErr = err as { response?: { status?: number } };
        const status = axiosErr?.response?.status;
        const isClientPermanentError =
          status && status >= 400 && status < 500 && status !== 408 && status !== 429;

        if (isClientPermanentError) {
          // If server rejected with 4xx, do not block the queue indefinitely
          console.warn(`Offline mutation ${item.id} rejected by server with status ${status}. Removing from queue.`);
          removeOfflineMutation(item.id);
          failed++;
        } else {
          // Network still down or 5xx server error: keep in queue with incremented retry count
          item.retryCount = (item.retryCount || 0) + 1;
          const remaining = getOfflineQueue().map((q) => (q.id === item.id ? item : q));
          saveOfflineQueue(remaining);
          failed++;
          // Abort further processing for now if network dropped again
          if (!navigator.onLine) {
            break;
          }
        }
      }
    }

    if (succeeded > 0) {
      toast.success(
        `¡Sincronización completada! ${succeeded} ${succeeded === 1 ? 'operación guardada' : 'operaciones guardadas'} en el servidor.`,
        { id: 'offline-sync-toast', duration: 4000 }
      );
      // Emit event so queries and UI refresh their data
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('offlineQueue:synced', { detail: { succeeded } }));
      }
    } else if (failed > 0) {
      toast.error('No se pudieron sincronizar algunas operaciones pendientes. Se reintentará más tarde.', {
        id: 'offline-sync-toast',
        duration: 5000,
      });
    } else {
      toast.dismiss('offline-sync-toast');
    }
  } finally {
    isProcessingQueue = false;
  }

  return { total: initialQueue.length, succeeded, failed };
};
