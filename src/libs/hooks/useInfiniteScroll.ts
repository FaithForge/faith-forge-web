import { useEffect, useRef, useState, useCallback } from 'react';

export interface UseInfiniteScrollOptions {
  /** Async or sync callback to load the next page */
  onLoadMore: () => Promise<void> | void;
  /** Whether there are more items to load (e.g. currentPage < totalPages) */
  hasMore: boolean;
  /** Initial loading state of the list */
  isLoading: boolean;
  /** Distance in pixels from bottom of scroll container to trigger loading (default: 250) */
  threshold?: number;
  /** Minimum ms between consecutive triggers (default: 800) */
  cooldownMs?: number;
}

export interface UseInfiniteScrollReturn {
  /** Sentinel element ref to attach at the bottom of the list */
  sentinelRef: React.RefObject<HTMLDivElement>;
  /** Whether a background page load is currently in-flight */
  loadingMore: boolean;
  /** Manual load more trigger function */
  triggerLoadMore: () => Promise<void>;
}

/**
 * Robust infinite scroll hook for mobile and desktop views.
 * Listens to the main layout scroll container and sentinel visibility with cooldown throttling
 * and in-flight deduplication to completely eliminate runaway request loops while reliably loading subsequent pages.
 *
 * @param {UseInfiniteScrollOptions} options - Configuration options for infinite scrolling.
 * @returns {UseInfiniteScrollReturn} Sentinel ref, loadingMore flag, and manual trigger function.
 */
export const useInfiniteScroll = ({
  onLoadMore,
  hasMore,
  isLoading,
  threshold = 250,
  cooldownMs = 800,
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn => {
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Keep latest references without causing effect re-subscriptions
  const onLoadMoreRef = useRef(onLoadMore);
  const hasMoreRef = useRef(hasMore);
  const isLoadingRef = useRef(isLoading);
  const isBusyRef = useRef(false);
  const lastTriggerTimeRef = useRef(0);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
    hasMoreRef.current = hasMore;
    isLoadingRef.current = isLoading;
  });

  const triggerLoadMore = useCallback(async () => {
    if (isBusyRef.current || isLoadingRef.current || !hasMoreRef.current) return;

    const now = Date.now();
    if (now - lastTriggerTimeRef.current < cooldownMs) return;

    lastTriggerTimeRef.current = now;
    isBusyRef.current = true;
    setLoadingMore(true);

    try {
      await Promise.resolve(onLoadMoreRef.current());
    } catch (e) {
      console.error('[useInfiniteScroll] Error loading more items:', e);
    } finally {
      // Cooldown buffer before unlocking next trigger to allow DOM layout recalculation
      setTimeout(() => {
        isBusyRef.current = false;
        setLoadingMore(false);
      }, 350);
    }
  }, [cooldownMs]);

  useEffect(() => {
    const getMainEl = (): HTMLElement | null => {
      return document.querySelector('main');
    };

    const checkAndTrigger = () => {
      const mainEl = getMainEl();
      const scrollTop = mainEl ? mainEl.scrollTop : (window.scrollY || document.documentElement.scrollTop);
      const scrollHeight = mainEl ? mainEl.scrollHeight : document.documentElement.scrollHeight;
      const clientHeight = mainEl ? mainEl.clientHeight : window.innerHeight;

      // Must be within threshold distance of bottom
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
      if (distanceFromBottom > threshold) return;

      // Must have more data and not be currently busy
      if (!hasMoreRef.current || isLoadingRef.current || isBusyRef.current) return;

      triggerLoadMore();
    };

    const mainEl = getMainEl();
    if (mainEl) {
      mainEl.addEventListener('scroll', checkAndTrigger, { passive: true });
    }
    window.addEventListener('scroll', checkAndTrigger, { passive: true });

    // IntersectionObserver on sentinel to detect entering bottom of scroll view
    let observer: IntersectionObserver | null = null;
    const sentinel = sentinelRef.current;

    if (sentinel && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry || !entry.isIntersecting) return;

          if (!hasMoreRef.current || isLoadingRef.current || isBusyRef.current) return;

          triggerLoadMore();
        },
        {
          root: mainEl || null,
          rootMargin: `${threshold}px`,
        }
      );
      observer.observe(sentinel);
    }

    return () => {
      if (mainEl) {
        mainEl.removeEventListener('scroll', checkAndTrigger);
      }
      window.removeEventListener('scroll', checkAndTrigger);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [threshold, triggerLoadMore]);

  return {
    sentinelRef,
    loadingMore,
    triggerLoadMore,
  };
};

export default useInfiniteScroll;
