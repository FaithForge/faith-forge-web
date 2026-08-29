import { toast } from 'sonner';
import { clearAppCacheAndReload } from './appCache';

interface BuildVersionInfo {
  version: string;
  buildTime: number;
  buildDate: string;
}

let isUpdating = false;

/**
 * Silently checks if a newer version of the application has been deployed to the server.
 * If a new build is detected, purges the local cache and reloads the application.
 */
export const checkAppVersion = async (): Promise<boolean> => {
  if (isUpdating || typeof window === 'undefined' || import.meta.env.DEV) return false;

  try {
    const currentBuild = typeof __APP_BUILD_TIME__ !== 'undefined' ? __APP_BUILD_TIME__ : 0;
    const response = await fetch(`/version.json?nocache=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });

    if (!response.ok) return false;

    const data: BuildVersionInfo = await response.json();

    if (data && data.buildTime && currentBuild && data.buildTime > currentBuild) {
      isUpdating = true;
      toast.info('✨ Nueva versión disponible. Actualizando Iglekids...');
      setTimeout(async () => {
        await clearAppCacheAndReload();
      }, 1200);
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
 * Runs on app start, every 5 minutes, and whenever the user returns to the tab.
 */
export const setupRemoteVersionWatcher = (): void => {
  if (typeof window === 'undefined' || import.meta.env.DEV) return;

  // 1. Initial check after 3 seconds
  setTimeout(() => {
    checkAppVersion();
  }, 3000);

  // 2. Periodic background check every 5 minutes
  setInterval(() => {
    checkAppVersion();
  }, 5 * 60 * 1000);

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
