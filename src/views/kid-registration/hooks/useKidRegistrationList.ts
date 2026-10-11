import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetKids, GetMoreKids } from '@/libs/state/redux/thunks/kid-church/kid.thunk';
import { useChurchMeetingStatus } from '@/libs/hooks/useChurchMeetingStatus';
import { useSearchScroll } from '@/libs/context/SearchScrollContext';
import { useInfiniteScroll } from '@/libs/hooks/useInfiniteScroll';

/**
 * Hook to manage kid registration search, debounce, pagination, and infinite scroll.
 * Shared across role-specific registration dashboard views.
 *
 * @returns {object} Kid list state, handlers, and refs.
 */
export const useKidRegistrationList = () => {
  const dispatch = useAppDispatch();
  const [searchText, setSearchText] = useState('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const { setSearchAvailable, registerSearchFocusHandler } = useSearchScroll();
  const { data: kids, loading, currentPage, totalPages, needsRefresh } = useAppSelector(
    (state) => state.kidSlice,
  );

  const meetingStatus = useChurchMeetingStatus();
  const { isConfigured, shouldBlockKids, currentMeeting } = meetingStatus;

  const hasInitializedRef = useRef(false);
  const prevMeetingIdRef = useRef<string | undefined>(currentMeeting?.id);
  const prevSearchTextRef = useRef<string>('');

  // Debounced search and data synchronization
  useEffect(() => {
    if (!isConfigured || shouldBlockKids) return;

    const isMeetingChanged =
      prevMeetingIdRef.current !== undefined && prevMeetingIdRef.current !== currentMeeting?.id;
    const isSearchChanged = searchText !== prevSearchTextRef.current;

    if (
      !hasInitializedRef.current &&
      kids.length > 0 &&
      !needsRefresh &&
      !isSearchChanged &&
      !isMeetingChanged
    ) {
      hasInitializedRef.current = true;
      prevMeetingIdRef.current = currentMeeting?.id;
      prevSearchTextRef.current = searchText;
      return;
    }

    if (hasInitializedRef.current && !needsRefresh && !isSearchChanged && !isMeetingChanged) {
      return;
    }

    hasInitializedRef.current = true;
    prevMeetingIdRef.current = currentMeeting?.id;
    prevSearchTextRef.current = searchText;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const delay = isSearchChanged && searchText.trim().length > 0 ? 400 : 0;

    if (delay === 0) {
      dispatch(GetKids({ findText: searchText }));
    } else {
      timeoutRef.current = setTimeout(() => {
        dispatch(GetKids({ findText: searchText }));
      }, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [searchText, isConfigured, shouldBlockKids, dispatch, currentMeeting?.id, needsRefresh, kids.length]);

  // Reset handler when Home tab is clicked in BottomNav
  useEffect(() => {
    const handleReset = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      prevSearchTextRef.current = '';
      setSearchText('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const mainEl = document.querySelector('main');
      if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });

      if (isConfigured && !shouldBlockKids) {
        dispatch(GetKids({ findText: '' }));
      }
    };

    window.addEventListener('reset-registration-dashboard', handleReset);
    return () => {
      window.removeEventListener('reset-registration-dashboard', handleReset);
    };
  }, [dispatch, isConfigured, shouldBlockKids]);

  const handleClearSearch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    prevSearchTextRef.current = '';
    setSearchText('');
    dispatch(GetKids({ findText: '' }));
  }, [dispatch]);

  const handleRefreshKids = useCallback(async () => {
    if (!isConfigured || shouldBlockKids) return;
    try {
      await dispatch(GetKids({ findText: searchText })).unwrap();
    } catch {
      // ignore
    }
  }, [isConfigured, shouldBlockKids, dispatch, searchText]);

  const hasMore = currentPage < totalPages;

  const handleLoadMore = useCallback(async () => {
    if (!isConfigured || shouldBlockKids) return;
    try {
      await dispatch(GetMoreKids({ findText: searchText })).unwrap();
    } catch (e) {
      console.error(e);
    }
  }, [isConfigured, shouldBlockKids, dispatch, searchText]);

  const { sentinelRef, loadingMore, triggerLoadMore } = useInfiniteScroll({
    onLoadMore: handleLoadMore,
    hasMore,
    isLoading: loading,
    threshold: 250,
    cooldownMs: 800,
  });

  // Connect TopBar search icon with local input
  useEffect(() => {
    setSearchAvailable(true);
    registerSearchFocusHandler(() => {
      searchInputRef.current?.focus();
    });

    return () => {
      setSearchAvailable(false);
      registerSearchFocusHandler(null);
    };
  }, [setSearchAvailable, registerSearchFocusHandler]);

  return {
    searchText,
    setSearchText,
    handleClearSearch,
    handleRefreshKids,
    kids,
    loading,
    hasMore,
    loadingMore,
    triggerLoadMore,
    sentinelRef,
    searchInputRef,
    meetingStatus,
  };
};
