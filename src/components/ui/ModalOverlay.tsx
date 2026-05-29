import React, { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type ModalOverlayProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  panelClassName?: string;
  wrapperClassName?: string;
  backdropClassName?: string;
  closeOnBackdropClick?: boolean;
};

const mergeClasses = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

/**
 * Renders a reusable modal overlay with portal mounting and enter/exit transitions.
 *
 * @param {ModalOverlayProps} props - Overlay state, close handler, and panel content.
 * @returns {JSX.Element | null} - A portal-based overlay container with animated backdrop and panel.
 */
const ModalOverlay: React.FC<ModalOverlayProps> = ({
  open,
  onClose,
  children,
  panelClassName = '',
  wrapperClassName = '',
  backdropClassName = '',
  closeOnBackdropClick = true,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(open);
  const [isVisible, setIsVisible] = useState(open);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setShouldRender(true);

      const openDelayId = window.setTimeout(() => {
        window.requestAnimationFrame(() => {
          setIsVisible(true);
        });
      }, 20);

      return () => window.clearTimeout(openDelayId);
    }

    setIsVisible(false);

    const timeoutId = window.setTimeout(() => {
      setShouldRender(false);
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open]);

  if (!isMounted || !shouldRender) {
    return null;
  }

  return createPortal(
    <div
      className={mergeClasses('fixed inset-0 z-[110] flex items-end justify-center p-3 sm:items-center', wrapperClassName)}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={mergeClasses(
          'absolute inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity duration-300 ease-out',
          isVisible ? 'opacity-100' : 'opacity-0',
          backdropClassName,
        )}
        onClick={closeOnBackdropClick ? onClose : undefined}
      />
      <div
        className={mergeClasses(
          'relative z-10 w-full transition-all duration-300 ease-out will-change-transform',
          isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-6 scale-[0.96] opacity-0',
          panelClassName,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
};

export default ModalOverlay;