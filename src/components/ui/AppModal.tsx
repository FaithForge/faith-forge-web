import React, { ReactNode } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { X } from 'lucide-react';
import ModalOverlay from '@/components/ui/ModalOverlay';

export interface AppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  showCloseButton?: boolean;
  onClose?: () => void;
  dismissible?: boolean;
  nested?: boolean;
  repositionInputs?: boolean;
  maxHeight?: string;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  contentClassName?: string;
  bodyClassName?: string;
  headerClassName?: string;
  overlayZIndex?: string;
  contentZIndex?: string;
  onCloseAutoFocus?: (e: Event) => void;
  onPointerDownOutside?: (e: unknown) => void;
  onInteractOutside?: (e: unknown) => void;
}

/**
 * Standard reusable modal dialog primitive matching application design specifications.
 * Renders a centered dialog with animated backdrop, accessible title, close button,
 * and contained vertical scrolling.
 *
 * @param {AppModalProps} props - Modal properties, header actions, and children.
 * @returns {JSX.Element | null} The rendered modal component.
 */
export const AppModal: React.FC<AppModalProps> = ({
  open,
  onOpenChange,
  title,
  icon,
  children,
  showCloseButton = true,
  onClose,
  dismissible = true,
  maxHeight = 'max-h-[85vh] sm:max-h-[90vh]',
  headerLeft,
  headerRight,
  contentClassName = '',
  bodyClassName = '',
  headerClassName = '',
  overlayZIndex,
}) => {
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      onOpenChange(false);
    }
  };

  return (
    <ModalOverlay
      open={open}
      onClose={handleClose}
      closeOnBackdropClick={dismissible}
      wrapperClassName="items-center justify-center p-3 sm:p-4"
      panelClassName={twMerge(
        'w-full max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto',
        contentClassName,
      )}
      overlayZIndex={overlayZIndex}
    >
      <div
        className={clsx(
          'bg-white rounded-3xl shadow-2xl w-full flex flex-col overflow-hidden border border-gray-200/90 mx-auto animate-in fade-in zoom-in-95 duration-200',
          maxHeight,
        )}
      >
        {/* Header Bar */}
        <div
          className={clsx(
            'w-full bg-white border-b border-gray-100 flex items-center justify-between px-5 py-4 shrink-0',
            headerClassName,
          )}
        >
          <div className="w-8 shrink-0 flex items-center justify-start">
            {headerLeft || null}
          </div>

          {title && (
            <h2 className="font-bold text-gray-800 text-base sm:text-lg flex items-center justify-center gap-2 text-center flex-1 truncate px-2">
              {icon && (
                <span className="shrink-0 inline-flex items-center justify-center -translate-y-[1.5px]">
                  {icon}
                </span>
              )}
              <span className="truncate">{title}</span>
            </h2>
          )}

          <div className="w-8 shrink-0 flex items-center justify-end">
            {headerRight ? (
              headerRight
            ) : showCloseButton ? (
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 hover:text-gray-700 active:scale-95 transition-all shrink-0 cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>
            ) : null}
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div
          className={clsx(
            'overflow-y-auto flex-1 min-h-0 overscroll-contain',
            bodyClassName,
          )}
        >
          {children}
        </div>
      </div>
    </ModalOverlay>
  );
};

export default AppModal;
