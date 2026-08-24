import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle, X } from 'lucide-react';
import clsx from 'clsx';
import Button from '@/components/ui/Button';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';

interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  type?: 'danger' | 'warning' | 'info';
  disableBackClose?: boolean;
}

const ConfirmModal = ({ 
  open, 
  onOpenChange, 
  title, 
  description, 
  confirmText = 'Confirmar', 
  cancelText = 'Cancelar', 
  onConfirm,
  type = 'warning',
  disableBackClose = false
}: ConfirmModalProps) => {
  useModalBackClose(disableBackClose ? false : open, () => onOpenChange(false));

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl shadow-2xl p-6 w-[90vw] max-w-sm z-[1000] animate-in zoom-in-95 fade-in duration-200 outline-none">
          <div className="flex flex-col items-center text-center">
            
            <div className={clsx(
              "w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-inner",
              type === 'danger' ? "bg-red-100 text-red-600" : 
              type === 'warning' ? "bg-amber-100 text-amber-600" : 
              "bg-blue-100 text-blue-600"
            )}>
              <AlertTriangle size={32} strokeWidth={2.5} />
            </div>
            
            <Dialog.Title className="text-xl font-black text-gray-800 mb-2 tracking-tight">
              {title}
            </Dialog.Title>
            
            <Dialog.Description className="text-gray-500 text-sm mb-6 leading-relaxed">
              {description}
            </Dialog.Description>
            
            <div className="w-full flex flex-col gap-3">
              <Button
                onClick={handleConfirm}
                block
                variant={type === 'danger' ? 'primary' : type === 'warning' ? 'secondary' : 'primary'}
                style={type === 'danger' ? { backgroundColor: '#ef4444', borderColor: '#ef4444' } : undefined}
              >
                {confirmText}
              </Button>
              <Dialog.Close asChild>
                <Button block variant="ghost">
                  {cancelText}
                </Button>
              </Dialog.Close>
            </div>
          </div>
          
          <Dialog.Close asChild>
            <button className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors outline-none">
              <X size={20} />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ConfirmModal;
