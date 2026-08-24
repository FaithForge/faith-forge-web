const BIOMETRIC_STORAGE_KEY = 'iglekids_biometric_session';

/**
 * Clears all PWA caches, Service Workers, and client storage, then reloads the application.
 * Safely preserves the user's registered fingerprint / Face ID credentials by default.
 *
 * @param {object} [options] - Options for cache purge.
 * @param {boolean} [options.preserveBiometrics=true] - Whether to preserve biometric login credentials.
 * @returns {Promise<void>} Resolves when cleanup is complete before reload.
 */
export const clearAppCacheAndReload = async (options?: {
  preserveBiometrics?: boolean;
}): Promise<void> => {
  const { preserveBiometrics = true } = options || {};

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

    // 3. Backup biometric session so user doesn't lose Face ID / fingerprint
    const savedBio = preserveBiometrics
      ? localStorage.getItem(BIOMETRIC_STORAGE_KEY)
      : null;

    // 4. Clear LocalStorage and SessionStorage
    localStorage.clear();
    sessionStorage.clear();

    // 5. Restore biometric session if preserved
    if (savedBio) {
      localStorage.setItem(BIOMETRIC_STORAGE_KEY, savedBio);
    }

    // 6. Delete IndexedDB databases if supported
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
    // 7. Force reload bypassing cache
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
