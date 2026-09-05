import { useState, useEffect } from 'react';

/**
 * Detects whether the virtual software keyboard is currently visible on mobile devices.
 * Uses window.visualViewport as the primary standard API and focused editable elements as a fallback.
 *
 * @returns {boolean} True if mobile virtual keyboard is open.
 */
export const useIsKeyboardOpen = (): boolean => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const vv = window.visualViewport;

    const handleViewportChange = () => {
      if (!vv) return;
      // When software keyboard is visible, visualViewport height is substantially smaller than window.innerHeight
      const isKeyboardVisible = window.innerHeight - vv.height > 150;
      setIsOpen(isKeyboardVisible);
    };

    if (vv) {
      vv.addEventListener('resize', handleViewportChange);
    }

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        if (window.innerWidth < 768) {
          setIsOpen(true);
        }
      }
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        const active = document.activeElement as HTMLElement;
        const isStillInput =
          active &&
          (active.tagName === 'INPUT' ||
            active.tagName === 'TEXTAREA' ||
            active.isContentEditable);
        if (!isStillInput) {
          setIsOpen(false);
        }
      }, 120);
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);

    return () => {
      if (vv) {
        vv.removeEventListener('resize', handleViewportChange);
      }
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  return isOpen;
};
