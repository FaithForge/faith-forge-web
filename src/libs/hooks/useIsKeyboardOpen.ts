import { useState, useEffect } from 'react';

/**
 * Checks if the current focused element is an editable input or textarea.
 *
 * @returns {boolean} True if active element is an editable form field.
 */
const isEditableElementFocused = (): boolean => {
  if (typeof document === 'undefined') return false;
  const active = document.activeElement as HTMLElement | null;
  if (!active) return false;
  const tag = active.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    active.isContentEditable ||
    active.getAttribute('role') === 'textbox'
  );
};

/**
 * Detects whether the virtual software keyboard is currently visible on mobile devices.
 * Uses window.visualViewport as the primary standard API and focused editable elements as a fallback.
 *
 * @returns {boolean} True if mobile virtual keyboard is open.
 */
export const useIsKeyboardOpen = (): boolean => {
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return isEditableElementFocused() && window.innerWidth < 1024;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const vv = window.visualViewport;

    const evaluateState = () => {
      const isMobileScreen =
        window.innerWidth < 1024 || window.matchMedia('(pointer: coarse)').matches;
      if (!isMobileScreen) {
        setIsOpen(false);
        return;
      }

      // Check 1: If any editable input is actively focused on mobile
      if (isEditableElementFocused()) {
        setIsOpen(true);
        return;
      }

      // Check 2: visualViewport height significantly shrunk compared to window height
      if (vv && window.innerHeight - vv.height > 120) {
        setIsOpen(true);
        return;
      }

      setIsOpen(false);
    };

    if (vv) {
      vv.addEventListener('resize', evaluateState);
      vv.addEventListener('scroll', evaluateState);
    }

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.getAttribute('role') === 'textbox')
      ) {
        const isMobileScreen =
          window.innerWidth < 1024 || window.matchMedia('(pointer: coarse)').matches;
        if (isMobileScreen) {
          setIsOpen(true);
        }
      }
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        if (!isEditableElementFocused()) {
          setIsOpen(false);
        }
      }, 150);
    };

    window.addEventListener('focusin', handleFocusIn, { passive: true });
    window.addEventListener('focusout', handleFocusOut, { passive: true });

    return () => {
      if (vv) {
        vv.removeEventListener('resize', evaluateState);
        vv.removeEventListener('scroll', evaluateState);
      }
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  return isOpen;
};
