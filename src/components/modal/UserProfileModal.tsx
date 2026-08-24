import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { User, X, Mail, Smartphone, RotateCcw } from 'lucide-react';
import { useAppSelector } from '@/libs/state/redux/hooks';
import { capitalizeWords } from '@/libs/utils/text';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { clearAppCacheAndReload } from '@/libs/utils/appCache';

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserProfileModal = ({ open, onOpenChange }: UserProfileModalProps) => {
  const [showClearCacheConfirm, setShowClearCacheConfirm] = useState(false);
  useModalBackClose(open, () => onOpenChange(false));

  const user = useAppSelector((state) => state.authSlice.user);

  if (!user) return null;

  const userInitials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'US';
  const userName = capitalizeWords(`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim());
  const userPhone = user.phone 
    ? ((user as any).dialCodePhone ? `${(user as any).dialCodePhone} ${user.phone}` : user.phone)
    : 'No disponible';

  return (
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-[130] animate-in fade-in" />
          <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-surface w-[90%] max-w-sm rounded-2xl shadow-xl z-[131] p-0 overflow-hidden outline-none animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="bg-primary p-6 text-white flex flex-col items-center relative">
              <button 
                onClick={() => onOpenChange(false)}
                className="absolute top-4 right-4 p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
              <div className="w-20 h-20 bg-white text-primary rounded-full flex items-center justify-center text-3xl font-bold mb-3 shadow-sm ring-4 ring-primary-foreground/20">
                {userInitials}
              </div>
              <h2 className="text-xl font-bold">{userName}</h2>
              <p className="opacity-90 text-sm mt-1">Perfil de Usuario</p>
            </div>

            {/* Info list */}
            <div className="p-6 flex flex-col gap-4">
              <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-xl text-xs text-blue-800 text-center">
                La edición de tu información personal estará disponible en una futura actualización.
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                  <User size={20} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-bold text-gray-500 uppercase">Nombre Completo</p>
                  <p className="text-sm font-medium text-gray-800 truncate">{userName}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                  <Mail size={20} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-bold text-gray-500 uppercase">Correo Electrónico</p>
                  <p className="text-sm font-medium text-gray-800 truncate">{user.email || 'No disponible'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                  <Smartphone size={20} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-bold text-gray-500 uppercase">Teléfono</p>
                  <p className="text-sm font-medium text-gray-800 truncate">{userPhone}</p>
                </div>
              </div>

              {/* Botón de limpiar caché y actualizar */}
              <div className="pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowClearCacheConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 active:scale-98 transition-all"
                >
                  <RotateCcw size={14} className="text-gray-500" />
                  Limpiar caché y actualizar app
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Confirmación para limpiar caché */}
      <ConfirmModal
        open={showClearCacheConfirm}
        onOpenChange={setShowClearCacheConfirm}
        title="¿Limpiar caché y datos locales?"
        description="Se eliminarán los archivos temporales de la app y se recargarán los datos más recientes del servidor."
        confirmText="Limpiar y recargar"
        cancelText="Cancelar"
        type="info"
        onConfirm={clearAppCacheAndReload}
      />
    </>
  );
};

export default UserProfileModal;
