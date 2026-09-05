import React, { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { User, X, Mail, Smartphone, RotateCcw, Fingerprint, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useAppSelector } from '@/libs/state/redux/hooks';
import { capitalizeWords } from '@/libs/utils/text';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { clearAppCacheAndReload } from '@/libs/utils/appCache';
import {
  isBiometricsAvailable,
  hasRegisteredBiometrics,
  registerBiometrics,
  clearBiometricSession,
} from '@/libs/utils/biometrics';

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserProfileModal = ({ open, onOpenChange }: UserProfileModalProps) => {
  const [showClearCacheConfirm, setShowClearCacheConfirm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isRegisteringBio, setIsRegisteringBio] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [isBioEnabled, setIsBioEnabled] = useState(false);
  useModalBackClose(open, () => onOpenChange(false));

  const user = useAppSelector((state) => state.authSlice.user);
  const token = useAppSelector((state) => state.authSlice.token);

  useEffect(() => {
    if (open) {
      isBiometricsAvailable().then((available) => {
        setBioAvailable(available);
        setIsBioEnabled(hasRegisteredBiometrics());
      });
    }
  }, [open]);

  if (!user) return null;

  const userInitials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'US';
  const userName = capitalizeWords(`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim());
  const userPhone = user.phone 
    ? ((user as any).dialCodePhone ? `${(user as any).dialCodePhone} ${user.phone}` : user.phone)
    : 'No disponible';

  const handleToggleBiometrics = async () => {
    if (isBioEnabled) {
      clearBiometricSession();
      setIsBioEnabled(false);
      toast.success('Inicio de sesión con biometría desactivado');
    } else {
      setPasswordInput('');
      setShowPasswordModal(true);
    }
  };

  const handleConfirmPasswordAndRegisterBio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput) {
      toast.error('Por favor, ingresa tu contraseña.');
      return;
    }
    setIsRegisteringBio(true);
    try {
      const targetUsername = user.username || user.email || userName;
      const success = await registerBiometrics({
        username: targetUsername,
        password: passwordInput,
        user,
        token,
      });
      if (success) {
        setIsBioEnabled(true);
        setShowPasswordModal(false);
        setPasswordInput('');
        toast.success('¡Biometría (Huella / Face ID) configurada con éxito!');
      } else {
        toast.error('No se pudo configurar la biometría en este dispositivo.');
      }
    } catch {
      toast.error('Ocurrió un error al configurar la biometría.');
    } finally {
      setIsRegisteringBio(false);
    }
  };

  return (
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-[300] animate-in fade-in" />
          <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-surface w-[90%] max-w-sm rounded-2xl shadow-xl z-[301] p-0 overflow-hidden outline-none animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="bg-primary p-6 text-white flex flex-col items-center relative">
              <button 
                onClick={() => onOpenChange(false)}
                className="absolute top-4 right-4 p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
              <div className="w-20 h-20 bg-white text-primary rounded-full flex items-center justify-center text-3xl font-bold mb-3 shadow-sm ring-4 ring-primary-foreground/20 overflow-hidden">
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt={userName} className="w-full h-full object-cover" />
                ) : (
                  userInitials
                )}
              </div>
              <h2 className="text-xl font-bold">{userName}</h2>
              <p className="opacity-90 text-sm mt-1">Perfil de Usuario</p>
            </div>

            {/* Info list */}
            <div className="p-6 flex flex-col gap-4">
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

              {/* Biometrics / Fingerprint / Face ID Section */}
              {bioAvailable && (
                <div className="pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleToggleBiometrics}
                    className={`w-full flex items-center justify-between py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      isBioEnabled
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Fingerprint size={16} className={isBioEnabled ? 'text-emerald-600' : 'text-gray-500'} />
                      <span>{isBioEnabled ? 'Biometría activada (Huella / Face ID)' : 'Activar biometría (Huella / Face ID)'}</span>
                    </div>
                    <span className="text-[11px] font-semibold underline">
                      {isBioEnabled ? 'Desactivar' : 'Configurar'}
                    </span>
                  </button>
                </div>
              )}

              {/* Purge cache and update app button */}
              <div className="pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowClearCacheConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 active:scale-98 transition-all"
                >
                  <RotateCcw size={14} className="text-gray-500" />
                  Limpiar caché y actualizar app
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Cache purge confirmation */}
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

      {/* Biometrics Password Confirmation Dialog */}
      <Dialog.Root open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-[310] animate-in fade-in" />
          <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-surface w-[90%] max-w-sm rounded-2xl shadow-xl z-[311] p-6 outline-none animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Fingerprint size={22} />
              </div>
              <div>
                <Dialog.Title className="text-base font-bold text-gray-800">
                  Activar Huella / Face ID
                </Dialog.Title>
                <Dialog.Description className="text-xs text-gray-500">
                  Ingresa tu contraseña para habilitar el inicio de sesión biométrico en este dispositivo.
                </Dialog.Description>
              </div>
            </div>

            <form onSubmit={handleConfirmPasswordAndRegisterBio} className="flex flex-col gap-4">
              <Input
                label="Contraseña"
                type="password"
                placeholder="Ingresa tu contraseña"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoComplete="current-password"
                required
              />

              <div className="flex gap-2 justify-end mt-2">
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={isRegisteringBio}
                  loadingText="Escaneando..."
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Confirmar y escanear
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
};

export default UserProfileModal;
