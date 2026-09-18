import React, { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { User, X, Mail, Smartphone, RotateCcw, Fingerprint, Lock, BellRing } from 'lucide-react';
import { toast } from 'sonner';
import { useAppSelector } from '@/libs/state/redux/hooks';
import { capitalizeWords } from '@/libs/utils/text';
import { formatPhoneDisplay } from '@/libs/utils/phone';
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
import {
  isPushNotificationSupported,
  getExistingPushSubscription,
  getPushPermissionState,
  requestAndSyncPushSubscription,
  unregisterAndRemovePushSubscription,
} from '@/libs/utils/notifications/webPush';
import { UserExperienceEnum } from '@/libs/utils/auth';

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: 'default' | 'white' | 'guardian';
}

const UserProfileModal = ({ open, onOpenChange, variant }: UserProfileModalProps) => {
  const [showClearCacheConfirm, setShowClearCacheConfirm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isRegisteringBio, setIsRegisteringBio] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [isBioEnabled, setIsBioEnabled] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isPushLoading, setIsPushLoading] = useState(false);
  useModalBackClose(open, () => onOpenChange(false));

  const user = useAppSelector((state) => state.authSlice.user);
  const token = useAppSelector((state) => state.authSlice.token);
  const activeExperience = useAppSelector((state) => state.authSlice.activeExperience);
  const isGuardian = variant === 'guardian' || activeExperience === UserExperienceEnum.KID_GUARDIAN;
  const isWhite = !isGuardian && variant === 'white';

  useEffect(() => {
    if (open) {
      isBiometricsAvailable().then((available) => {
        setBioAvailable(available);
        setIsBioEnabled(hasRegisteredBiometrics());
      });

      if (isPushNotificationSupported()) {
        setPushSupported(true);
        getExistingPushSubscription().then((sub) => {
          setPushEnabled(Boolean(sub) && getPushPermissionState() === 'granted');
        });
      }
    }
  }, [open]);

  if (!user) return null;

  const userInitials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'US';
  const userName = capitalizeWords(`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim());
  const userPhone = user.phone 
    ? formatPhoneDisplay(user.phone, (user as any).dialCodePhone)
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
      const targetUsername = (user.username || user.email || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '');
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

  const handleTogglePush = async () => {
    setIsPushLoading(true);
    try {
      if (pushEnabled) {
        await unregisterAndRemovePushSubscription();
        setPushEnabled(false);
        toast.info('Notificaciones desactivadas en este dispositivo.');
      } else {
        const success = await requestAndSyncPushSubscription();
        if (success) {
          setPushEnabled(true);
          toast.success('¡Notificaciones en el celular activadas con éxito!');
        } else {
          if (getPushPermissionState() === 'denied') {
            toast.error(
              'Las notificaciones están bloqueadas en tu navegador. Puedes habilitarlas en los permisos del sitio.'
            );
          } else {
            toast.error('No se concedieron permisos de notificación.');
          }
        }
      }
    } catch (err) {
      console.warn('Push toggle failed:', err);
      toast.error('Ocurrió un problema al actualizar las notificaciones.');
    } finally {
      setIsPushLoading(false);
    }
  };

  return (
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-[300] animate-in fade-in" />
          <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-surface w-[90%] max-w-sm rounded-2xl shadow-xl z-[301] p-0 overflow-hidden outline-none animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div
              className={
                isGuardian
                  ? 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-sky-700 p-6 text-white flex flex-col items-center relative overflow-hidden'
                  : isWhite
                  ? 'bg-white border-b border-slate-200 p-6 text-slate-900 flex flex-col items-center relative'
                  : 'bg-primary p-6 text-white flex flex-col items-center relative'
              }
            >
              {/* Subtle background glow for guardian */}
              {isGuardian && (
                <>
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-lg pointer-events-none" />
                  <div className="absolute -left-6 -top-6 w-20 h-20 bg-sky-400/20 rounded-full blur-md pointer-events-none" />
                </>
              )}
              <button
                onClick={() => onOpenChange(false)}
                className={
                  isWhite
                    ? 'absolute top-4 right-4 p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors cursor-pointer z-10'
                    : 'absolute top-4 right-4 p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors cursor-pointer z-10'
                }
              >
                <X size={18} />
              </button>
              <div
                className={
                  isGuardian
                    ? 'w-20 h-20 bg-white text-indigo-700 rounded-full flex items-center justify-center text-3xl font-bold mb-3 shadow-md ring-4 ring-white/30 overflow-hidden relative z-10'
                    : isWhite
                    ? 'w-20 h-20 bg-slate-100 text-slate-800 rounded-full flex items-center justify-center text-3xl font-bold mb-3 ring-4 ring-slate-100 overflow-hidden border border-slate-200 shadow-inner'
                    : 'w-20 h-20 bg-white text-primary rounded-full flex items-center justify-center text-3xl font-bold mb-3 shadow-sm ring-4 ring-primary-foreground/20 overflow-hidden'
                }
              >
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt={userName} className="w-full h-full object-cover" />
                ) : (
                  userInitials
                )}
              </div>
              <h2 className={isWhite ? 'text-xl font-bold text-slate-900' : 'text-xl font-bold text-white relative z-10'}>
                {userName}
              </h2>
              <p
                className={
                  isGuardian
                    ? 'text-indigo-100/90 text-sm mt-0.5 font-medium relative z-10'
                    : isWhite
                    ? 'text-slate-500 text-sm mt-0.5 font-medium'
                    : 'opacity-90 text-sm mt-1'
                }
              >
                Perfil de Usuario
              </p>
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
                    className={`w-full flex items-center justify-between py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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

              {/* Push Notifications Section */}
              {pushSupported && (
                <div className="pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleTogglePush}
                    disabled={isPushLoading}
                    className={`w-full flex items-center justify-between py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      pushEnabled
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <BellRing size={16} className={pushEnabled ? 'text-emerald-600' : 'text-gray-500'} />
                      <span>{pushEnabled ? 'Notificaciones en celular: Activas' : 'Activar avisos en celular'}</span>
                    </div>
                    <span className="text-[11px] font-semibold underline">
                      {isPushLoading ? 'Cargando...' : pushEnabled ? 'Desactivar' : 'Activar'}
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
        title="¿Limpiar caché y actualizar app?"
        description="Analizamos que tu navegador puede tener una versión antigua o archivos desactualizados. Al confirmar se limpiará la memoria de la aplicación, se instalará la versión más reciente y deberás iniciar sesión nuevamente. Si el problema persiste luego de esto, por favor contacta al administrador del sistema."
        confirmText="Limpiar y actualizar"
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
