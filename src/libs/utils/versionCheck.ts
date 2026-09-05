import { toast } from 'sonner';
import { applyAppVersionUpdate } from './appCache';

interface BuildVersionInfo {
  version: string;
  buildTime: number;
  buildDate: string;
}

let isUpdating = false;

/**
 * Silently checks if a newer version of the application has been deployed to the server.
 * If a new build is detected, immediately purges stale cache and refreshes the application.
 *
 * @returns {Promise<boolean>} Resolves to true if an update was triggered, false otherwise.
 */
export const checkAppVersion = async (): Promise<boolean> => {
  if (isUpdating || typeof window === 'undefined' || import.meta.env.DEV) return false;

  try {
    const currentBuild = typeof __APP_BUILD_TIME__ !== 'undefined' ? __APP_BUILD_TIME__ : 0;
    const response = await fetch(`/version.json?nocache=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });

    if (!response.ok) return false;

    const data: BuildVersionInfo = await response.json();

    if (data && data.buildTime && currentBuild && data.buildTime > currentBuild) {
      isUpdating = true;
      toast.info('✨ Actualizando Iglekids a la última versión...', {
        duration: 2000,
      });

      // Apply update immediately without artificial delays
      setTimeout(() => {
        applyAppVersionUpdate();
      }, 50);

      return true;
    }

    return false;
  } catch (error) {
    // Silent fail in case of offline or network interruption
    return false;
  }
};

/**
 * Initializes the remote version check watcher.
 * Runs on app start, every 3 minutes, and whenever the user returns to the tab.
 */
export const setupRemoteVersionWatcher = (): void => {
  if (typeof window === 'undefined' || import.meta.env.DEV) return;

  // 1. Initial check after 2 seconds
  setTimeout(() => {
    checkAppVersion();
  }, 2000);

  // 2. Periodic background check every 3 minutes
  setInterval(() => {
    checkAppVersion();
  }, 3 * 60 * 1000);

  // 3. Check when returning to the tab / opening the PWA from background
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkAppVersion();
    }
  });

  window.addEventListener('focus', () => {
    checkAppVersion();
  });
};
