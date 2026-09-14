import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Options for configuring the screen wake lock behavior.
 */
export interface UseScreenWakeLockOptions {
  /**
   * Whether the screen wake lock should be automatically requested and maintained.
   * Defaults to `true`.
   */
  enabled?: boolean;
  /**
   * Optional callback triggered when the wake lock is successfully acquired.
   */
  onAcquire?: () => void;
  /**
   * Optional callback triggered when the wake lock is released by the system or browser.
   */
  onRelease?: () => void;
  /**
   * Optional callback triggered when an error occurs while requesting the wake lock.
   */
  onError?: (err: unknown) => void;
}

/**
 * Custom hook to keep the device screen awake and prevent it from sleeping or dimming
 * while the user is actively using the application.
 *
 * Utilizes the native Screen Wake Lock API and automatically re-acquires the lock
 * on visibility changes, window focus, or user interactions if previously released.
 *
 * @param {UseScreenWakeLockOptions} [options] - Configuration options for the wake lock.
 * @returns {{ isSupported: boolean; isActive: boolean; request: () => Promise<boolean>; release: () => Promise<void> }}
 * Wake lock status and manual acquisition/release controls.
 */
export const useScreenWakeLock = (options: UseScreenWakeLockOptions = {}) => {
  const { enabled = true, onAcquire, onRelease, onError } = options;

  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(false);

  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const isAcquiringRef = useRef<boolean>(false);
  const isEnabledRef = useRef<boolean>(enabled);

  isEnabledRef.current = enabled;

  // Verify feature support in current browser/environment
  useEffect(() => {
    const supported = typeof window !== 'undefined' && 'wakeLock' in navigator;
    setIsSupported(supported);
  }, []);

  /**
   * Attempts to request a screen wake lock if supported and document is visible.
   */
  const requestLock = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('wakeLock' in navigator)) {
      return false;
    }

    if (!isEnabledRef.current || document.visibilityState !== 'visible') {
      return false;
    }

    // Lock is already active and valid
    if (sentinelRef.current && !sentinelRef.current.released) {
      setIsActive(true);
      return true;
    }

    if (isAcquiringRef.current) {
      return false;
    }

    isAcquiringRef.current = true;

    try {
      const sentinel = await navigator.wakeLock.request('screen');
      sentinelRef.current = sentinel;
      setIsActive(true);
      onAcquire?.();

      sentinel.addEventListener('release', () => {
        sentinelRef.current = null;
        setIsActive(false);
        onRelease?.();
      });

      return true;
    } catch (err) {
      sentinelRef.current = null;
      setIsActive(false);
      onError?.(err);
      return false;
    } finally {
      isAcquiringRef.current = false;
    }
  }, [onAcquire, onRelease, onError]);

  /**
   * Releases any active screen wake lock.
   */
  const releaseLock = useCallback(async (): Promise<void> => {
    if (sentinelRef.current) {
      try {
        await sentinelRef.current.release();
      } catch {
        // Silent catch on release errors
      } finally {
        sentinelRef.current = null;
        setIsActive(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      releaseLock();
      return;
    }

    // Initial acquisition attempt
    requestLock();

    // Re-acquire when document becomes visible (e.g., returning from another tab or unlocking)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isEnabledRef.current) {
        requestLock();
      }
    };

    // Re-acquire on window focus or page restoration
    const handleFocus = () => {
      if (document.visibilityState === 'visible' && isEnabledRef.current) {
        requestLock();
      }
    };

    // Browsers often require a user gesture before granting wake lock.
    // Listen for initial user gestures to acquire if not already active.
    const handleUserInteraction = () => {
      if ((!sentinelRef.current || sentinelRef.current.released) && isEnabledRef.current) {
        requestLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handleFocus);
    window.addEventListener('click', handleUserInteraction, { passive: true });
    window.addEventListener('touchstart', handleUserInteraction, { passive: true });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handleFocus);
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      releaseLock();
    };
  }, [enabled, requestLock, releaseLock]);

  return {
    isSupported,
    isActive,
    request: requestLock,
    release: releaseLock,
  };
};
