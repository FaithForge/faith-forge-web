const BIOMETRIC_STORAGE_KEY = 'iglekids_biometric_session';

/**
 * Fast version update reload that purges stale asset caches and refreshes immediately
 * while preserving the user's current URL, Redux state, and authentication session.
 *
 * @returns {Promise<void>} Resolves when cache is cleared and page is reloaded.
 */
export const applyAppVersionUpdate = async (): Promise<void> => {
  try {
    // 1. Clear Cache Storage (PWA Assets) in parallel
    if ('caches' in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((name) => caches.delete(name)));
    }

    // 2. Instruct active Service Workers to update
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.update()));
    }
  } catch (err) {
    console.warn('Error purging cache during version update:', err);
  } finally {
    // 3. Reload current page immediately
    window.location.reload();
  }
};

/**
 * Clears all PWA caches, Service Workers, and client storage, then reloads the application.
 * Safely preserves the user's registered fingerprint / Face ID credentials by default.
 * Runs cleanup in parallel for maximum speed.
 *
 * @param {object} [options] - Options for cache purge.
 * @param {boolean} [options.preserveBiometrics=true] - Whether to preserve biometric login credentials.
 * @param {boolean} [options.preserveAuth=false] - Whether to preserve user authentication state.
 * @returns {Promise<void>} Resolves when cleanup is complete before reload.
 */
export const clearAppCacheAndReload = async (options?: {
  preserveBiometrics?: boolean;
  preserveAuth?: boolean;
}): Promise<void> => {
  const { preserveBiometrics = true, preserveAuth = false } = options || {};

  try {
    // 1. Clear Cache Storage (PWA Assets) in parallel
    if ('caches' in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((name) => caches.delete(name)));
    }

    // 2. Unregister all active Service Workers in parallel
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));
    }

    // 3. Backup biometric session and auth if preserved
    const savedBio = preserveBiometrics
      ? localStorage.getItem(BIOMETRIC_STORAGE_KEY)
      : null;
    const savedPersistRoot = preserveAuth
      ? localStorage.getItem('persist:root')
      : null;

    // 4. Clear LocalStorage and SessionStorage
    localStorage.clear();
    sessionStorage.clear();

    // 5. Restore preserved credentials
    if (savedBio) {
      localStorage.setItem(BIOMETRIC_STORAGE_KEY, savedBio);
    }
    if (savedPersistRoot) {
      localStorage.setItem('persist:root', savedPersistRoot);
    }

    // 6. Delete IndexedDB databases in parallel if supported
    if (window.indexedDB && indexedDB.databases) {
      try {
        const dbs = await indexedDB.databases();
        await Promise.all(
          dbs.map((db) => (db.name ? indexedDB.deleteDatabase(db.name) : Promise.resolve()))
        );
      } catch (e) {
        console.warn('Could not clear IndexedDB databases:', e);
      }
    }
  } catch (err) {
    console.error('Error while purging app cache:', err);
  } finally {
    // 7. Force reload
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
        applyAppVersionUpdate();
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
        applyAppVersionUpdate();
      }
    }
  });
};
