import { useEffect, useRef } from 'react';
import { isAnyModalOpen, isInternalModalBack } from '@/libs/hooks/useModalBackClose';

interface UseBackSwipeGuardProps {
  /**
   * Whether the guard is actively protecting against back navigation.
   */
  enabled: boolean;
  /**
   * Callback invoked when a back gesture/swipe/button is blocked.
   */
  onBlockBack: () => void;
}

/**
 * Custom hook to intercept mobile back swipe gestures and browser back button (popstate)
 * when there is an active form or unsaved data, triggering a discard confirmation dialog.
 *
 * @param {UseBackSwipeGuardProps} options - Configuration with active state and block callback.
 */
export const useBackSwipeGuard = ({ enabled, onBlockBack }: UseBackSwipeGuardProps) => {
  const isEnabledRef = useRef(enabled);
  const onBlockBackRef = useRef(onBlockBack);
  const isLeavingRef = useRef(false);

  isEnabledRef.current = enabled;
  onBlockBackRef.current = onBlockBack;

  useEffect(() => {
    if (!enabled) return;

    // Push an initial guard entry to the history stack
    const guardKey = `guard_${Date.now()}`;
    window.history.pushState({ formGuard: guardKey }, '', window.location.href);

    const handlePopState = (event: PopStateEvent) => {
      if (isLeavingRef.current) {
        return;
      }

      // If a modal was closed internally by useModalBackClose or any modal is currently open in stack, do not block
      if (isInternalModalBack() || isAnyModalOpen()) {
        return;
      }

      // If the destination state is still our form guard (e.g. user popped back from a modal to this page),
      // they are still on the form, so do not trigger the discard prompt.
      if (event.state?.formGuard === guardKey) {
        return;
      }

      if (isEnabledRef.current) {
        // Restore history entry so user stays on the current view
        window.history.pushState({ formGuard: guardKey }, '', window.location.href);
        // Trigger the discard confirmation UI
        onBlockBackRef.current();
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // Clean up guard history entry if the component unmounts naturally
      if (window.history.state?.formGuard === guardKey && !isLeavingRef.current) {
        isLeavingRef.current = true;
        window.history.back();
      }
    };
  }, [enabled]);

  /**
   * Call before programmatically navigating away after user confirms discard or finishes.
   */
  const allowNavigation = () => {
    isLeavingRef.current = true;
  };

  return { allowNavigation };
};
