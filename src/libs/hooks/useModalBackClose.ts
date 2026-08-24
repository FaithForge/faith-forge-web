import { useEffect, useRef } from 'react';

interface ModalEntry {
  id: string;
  onClose: () => void;
}

// Global modal stack tracking currently open modals in LIFO order (topmost is last)
const modalStack: ModalEntry[] = [];
let isListening = false;
let isInternalBack = false;

const handleGlobalPopState = () => {
  // If popstate was triggered by our own programmatic history.back() when a modal was closed via UI,
  // ignore it and reset the flag so we don't close any parent modal.
  if (isInternalBack) {
    isInternalBack = false;
    return;
  }

  // Physical or browser back button was pressed:
  // Close ONLY the topmost modal on the stack
  if (modalStack.length > 0) {
    const topModal = modalStack[modalStack.length - 1];
    topModal.onClose();
  }
};

const ensureGlobalListener = () => {
  if (!isListening && typeof window !== 'undefined') {
    window.addEventListener('popstate', handleGlobalPopState);
    isListening = true;
  }
};

let nextModalId = 0;

/**
 * Hook to handle mobile / Android physical or gesture back button for modals and drawers.
 * Coordinates multiple nested/stacked modals so only the topmost modal closes upon back.
 * Prevents UI-driven closes from accidentally cascading to parent modals.
 *
 * @param {boolean} open - Whether the modal/drawer is open.
 * @param {(() => void) | undefined} onClose - Callback to close the modal.
 */
export const useModalBackClose = (open: boolean, onClose?: () => void) => {
  const modalIdRef = useRef<string | null>(null);
  if (!modalIdRef.current) {
    modalIdRef.current = `modal_${++nextModalId}`;
  }

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const isPushedRef = useRef(false);

  useEffect(() => {
    ensureGlobalListener();
    const id = modalIdRef.current!;

    if (!open || !onCloseRef.current) {
      if (isPushedRef.current) {
        isPushedRef.current = false;
        // Remove from global stack
        const idx = modalStack.findIndex((m) => m.id === id);
        if (idx !== -1) {
          modalStack.splice(idx, 1);
        }
        // Revert pushed history entry silently without closing parent modals
        if (window.history.state?.modalOpen) {
          isInternalBack = true;
          window.history.back();
        }
      }
      return;
    }

    // Modal just opened: register in stack and push history state
    window.history.pushState({ modalOpen: true, modalId: id }, '');
    isPushedRef.current = true;

    // Add / update in modal stack
    const existingIdx = modalStack.findIndex((m) => m.id === id);
    const entry: ModalEntry = {
      id,
      onClose: () => {
        if (onCloseRef.current) {
          onCloseRef.current();
        }
      },
    };

    if (existingIdx !== -1) {
      modalStack[existingIdx] = entry;
    } else {
      modalStack.push(entry);
    }

    return () => {
      if (isPushedRef.current) {
        isPushedRef.current = false;
        const idx = modalStack.findIndex((m) => m.id === id);
        if (idx !== -1) {
          modalStack.splice(idx, 1);
        }
        if (window.history.state?.modalOpen) {
          isInternalBack = true;
          window.history.back();
        }
      }
    };
  }, [open]);
};

