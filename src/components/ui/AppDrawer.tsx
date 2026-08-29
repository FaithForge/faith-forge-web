import React, { ReactNode } from 'react';
import { Drawer } from 'vaul';
import { X } from 'lucide-react';
import clsx from 'clsx';

export interface AppDrawerProps {
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
  onCloseAutoFocus?: (e: Event) => void;
  onPointerDownOutside?: (e: any) => void;
  onInteractOutside?: (e: any) => void;
  overlayZIndex?: string;
  contentZIndex?: string;
}

/**
 * Reusable application drawer component based on Vaul.
 * Provides a standardized bottom sheet with:
 * - Draggable header/title to swipe down and dismiss.
 * - Non-draggable body (via data-vaul-no-drag) to avoid accidental dismissals when scrolling or interacting with inputs.
 * - Standardized responsive typography, accessible Drawer.Title, and close button.
 *
 * @param {AppDrawerProps} props - Drawer properties and handlers.
 * @returns {JSX.Element} The rendered drawer component.
 */
export const AppDrawer: React.FC<AppDrawerProps> = ({
  open,
  onOpenChange,
  title,
  icon,
  children,
  showCloseButton = true,
  onClose,
  dismissible = true,
  nested = false,
  repositionInputs = false,
  maxHeight = 'max-h-[calc(100dvh-3rem)]',
  headerLeft,
  headerRight,
  contentClassName = '',
  bodyClassName = '',
  headerClassName = '',
  onCloseAutoFocus,
  onPointerDownOutside,
  onInteractOutside,
  overlayZIndex = 'z-[300]',
  contentZIndex = 'z-[301]',
}) => {
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      dismissible={dismissible}
      nested={nested}
      repositionInputs={repositionInputs}
    >
      <Drawer.Portal>
        <Drawer.Overlay
          onClick={dismissible ? handleClose : undefined}
          className={clsx(
            'fixed inset-0 bg-black/50 cursor-pointer',
            overlayZIndex
          )}
        />
        <Drawer.Content
          className={clsx(
            'bg-gray-50 flex flex-col rounded-t-[24px] fixed bottom-0 left-0 right-0 outline-none mt-20',
            maxHeight,
            contentZIndex,
            contentClassName
          )}
          onCloseAutoFocus={onCloseAutoFocus || ((e) => e.preventDefault())}
          onPointerDownOutside={onPointerDownOutside}
          onInteractOutside={onInteractOutside}
        >
          {/* Header Bar - Draggable by swiping down on title */}
          <div
            className={clsx(
              'w-full bg-white rounded-t-[24px] border-b border-gray-100 shadow-xs z-20 flex items-center justify-between px-4 py-3.5 sticky top-0 select-none cursor-grab active:cursor-grabbing touch-pan-y shrink-0',
              headerClassName
            )}
          >
            <div className="w-8 shrink-0 flex items-center justify-start">
              {headerLeft || null}
            </div>

            {title && (
              <Drawer.Title className="font-bold text-gray-800 text-base sm:text-lg flex items-center justify-center gap-2 text-center flex-1 truncate px-2">
                {icon && <span className="shrink-0">{icon}</span>}
                <span className="truncate">{title}</span>
              </Drawer.Title>
            )}

            <div className="w-8 shrink-0 flex items-center justify-end">
              {headerRight ? (
                headerRight
              ) : showCloseButton ? (
                <button
                  type="button"
                  data-vaul-no-drag=""
                  onClick={handleClose}
                  className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 active:scale-95 transition-all shrink-0 cursor-pointer"
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>
              ) : null}
            </div>
          </div>

          {/* Body Content - Protected from dragging by data-vaul-no-drag */}
          <div
            data-vaul-no-drag=""
            className={clsx(
              'overflow-y-auto flex-1 min-h-0 overscroll-contain',
              bodyClassName
            )}
          >
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default AppDrawer;
