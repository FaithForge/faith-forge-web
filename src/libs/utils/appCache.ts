/**
 * Clears all PWA caches, Service Workers, and client storage, then reloads the application.
 *
 * @returns {Promise<void>} Resolves when cleanup is complete before reload.
 */
export const clearAppCacheAndReload = async (): Promise<void> => {
  try {
    // 1. Clear Cache Storage (PWA Assets)
    if ('caches' in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((name) => caches.delete(name)));
    }

    // 2. Unregister all active Service Workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }

    // 3. Clear LocalStorage and SessionStorage
    localStorage.clear();
    sessionStorage.clear();

    // 4. Delete IndexedDB databases if supported
    if (window.indexedDB && indexedDB.databases) {
      try {
        const dbs = await indexedDB.databases();
        for (const db of dbs) {
          if (db.name) indexedDB.deleteDatabase(db.name);
        }
      } catch (e) {
        console.warn('Could not clear IndexedDB databases:', e);
      }
    }
  } catch (err) {
    console.error('Error while purging app cache:', err);
  } finally {
    // 5. Force reload bypassing cache
    window.location.replace('/');
  }
};

/**
 * Automatically catches Vite/Rollup dynamic import failure (chunk load errors)
 * that occur after deployments, clears the cache, and reloads the fresh version.
 */
export const setupChunkLoadErrorAutoRecover = (): void => {
  const CHUNK_RELOAD_KEY = 'app_chunk_reload_attempted';

  window.addEventListener('error', (event) => {
    const message = event?.message || '';
    if (
      message.includes('Loading chunk') ||
      message.includes('Failed to fetch dynamically imported module') ||
      message.includes('dynamically imported module')
    ) {
      if (!sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, 'true');
        clearAppCacheAndReload();
      }
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason?.message || event?.reason || '';
    if (
      typeof reason === 'string' &&
      (reason.includes('Loading chunk') ||
        reason.includes('Failed to fetch dynamically imported module') ||
        reason.includes('dynamically imported module'))
    ) {
      if (!sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, 'true');
        clearAppCacheAndReload();
      }
    }
  });
};
