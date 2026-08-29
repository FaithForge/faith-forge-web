import React, { useState, useEffect, useCallback } from 'react';
import AppDrawer from '@/components/ui/AppDrawer';
import { 
  X, 
  KeyRound, 
  UserCheck, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Copy, 
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import { useAppDispatch } from '@/libs/state/redux/hooks';
import { CreateUserAccount, UpdateUserAccount } from '@/libs/state/redux/thunks/user/user.thunk';
import { IUser, generateSuggestedUsername, generateTemporaryPassword } from '@/libs/models';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';

interface UserAccountModalProps {
  open: boolean;
  onClose: () => void;
  user: Partial<IUser> | IUser | null | undefined;
  onSuccess?: (accountData: { username: string; password?: string; email?: string }) => void;
}

/**
 * Modal Drawer for managing user access credentials (Creation and Updating/Reset).
 * Consumes POST /user/account when the user has no account, and PUT /user/account when updating credentials.
 *
 * @param {UserAccountModalProps} props - Component properties.
 * @returns {JSX.Element} Rendered user account management drawer.
 */
export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  open,
  onClose,
  user,
  onSuccess,
}) => {
  useModalBackClose(open, onClose);
  const dispatch = useAppDispatch();

  const isUpdating = Boolean(user?.username);

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasCopiedCredentials, setHasCopiedCredentials] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<{ username?: string; password?: string; email?: string }>({});

  /**
   * Initializes or resets the form inputs based on the target user.
   */
  const initializeForm = useCallback(() => {
    if (!user) return;

    const defaultPass = user.phone ? user.phone.trim() : '';

    if (isUpdating) {
      // User already has an account: pre-load current username and default password to phone
      setUsername(user.username || '');
      setPassword(defaultPass);
      setEmail(user.email || '');
    } else {
      // User does not have an account: generate suggested username and default password to phone
      const suggestedUser = generateSuggestedUsername(user.firstName || '', user.lastName || '');
      setUsername(suggestedUser);
      setPassword(defaultPass);
      setEmail(user.email || '');
    }

    setShowPassword(false);
    setIsSubmitting(false);
    setFormErrors({});
    setHasCopiedCredentials(false);
  }, [user, isUpdating]);

  // Sync state whenever modal is opened
  useEffect(() => {
    if (open) {
      initializeForm();
    }
  }, [open, initializeForm]);

  /**
   * Generates a temporary random password for the user.
   */
  const handleRegeneratePassword = () => {
    const newPass = generateTemporaryPassword();
    setPassword(newPass);
    setShowPassword(true);
    setFormErrors((prev) => ({ ...prev, password: undefined }));
    toast.info('Nueva contraseña temporal generada');
  };

  /**
   * Restores the password field to the user's phone number.
   */
  const handleUsePhoneAsPassword = () => {
    if (user?.phone) {
      setPassword(user.phone.trim());
      setFormErrors((prev) => ({ ...prev, password: undefined }));
      toast.info('Contraseña restablecida al número de teléfono');
    }
  };

  /**
   * Copies current in-form credentials directly to the clipboard.
   */
  const handleQuickCopyCredentials = async () => {
    if (!username || !password) {
      toast.error('Completa el usuario y la contraseña antes de copiar');
      return;
    }

    const textToCopy = `Usuario: ${username}\nContraseña: ${password}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setHasCopiedCredentials(true);
      toast.success('¡Credenciales copiadas al portapapeles!');
      setTimeout(() => setHasCopiedCredentials(false), 2500);
    } catch {
      toast.error('No se pudo copiar al portapapeles');
    }
  };

  /**
   * Submits the credentials creation or update form.
   *
   * @param {React.FormEvent} e - Form event.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      toast.error('No se ha especificado un usuario válido');
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanEmail = email.trim().toLowerCase();

    const errors: { username?: string; password?: string; email?: string } = {};
    if (!cleanUsername) {
      errors.username = 'El nombre de usuario es obligatorio';
    }
    if (!cleanPassword) {
      errors.password = 'La contraseña es obligatoria';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    const payload = {
      userId: user.id,
      username: cleanUsername,
      password: cleanPassword,
      email: cleanEmail || undefined,
    };

    try {
      if (isUpdating) {
        await dispatch(UpdateUserAccount(payload)).unwrap();
        toast.success('¡Credenciales actualizadas exitosamente!');
      } else {
        await dispatch(CreateUserAccount(payload)).unwrap();
        toast.success('¡Cuenta creada exitosamente!');
      }

      onSuccess?.({
        username: cleanUsername,
        password: cleanPassword,
        email: cleanEmail || undefined,
      });

      onClose();
    } catch (err: any) {
      const rawMessage = typeof err === 'string'
        ? err
        : err?.message || (Array.isArray(err?.message) ? err.message.join(', ') : '') || err?.error || '';

      if (rawMessage.includes('Username already in use')) {
        setFormErrors((prev) => ({
          ...prev,
          username: 'Este nombre de usuario ya se encuentra registrado. Por favor elija otro.',
        }));
        toast.error('El nombre de usuario ya se encuentra en uso');
      } else if (rawMessage.includes('Email already in use')) {
        setFormErrors((prev) => ({
          ...prev,
          email: 'Este correo electrónico ya se encuentra registrado por otro usuario.',
        }));
        toast.error('El correo electrónico ya está en uso');
      } else if (rawMessage.includes('The user already have a account')) {
        toast.error('El usuario ya tiene una cuenta registrada previamente.');
      } else if (rawMessage.includes('The user does not have an account to reset')) {
        toast.error('El usuario no cuenta con una cuenta de acceso para actualizar.');
      } else {
        toast.error(rawMessage || 'Ocurrió un error al gestionar las credenciales');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalTitle = isUpdating ? 'Actualizar credenciales de acceso' : 'Crear cuenta de acceso';
  const submitButtonText = isUpdating ? 'Actualizar Credenciales' : 'Crear Cuenta';

  return (
    <AppDrawer
      open={open}
      onOpenChange={(o) => !o && onClose()}
      onClose={onClose}
      title={modalTitle}
      maxHeight="max-h-[92dvh]"
      contentClassName="bg-surface"
      bodyClassName="p-5 flex flex-col gap-4 pb-12"
    >
            {/* User Target Header */}
            {user && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  <UserCheck size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-gray-900 truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.nationalIdType || 'CC'}: <span className="font-semibold text-gray-700">{user.nationalId || 'Sin documento'}</span>
                    {user.phone ? ` • Tel: ${user.phone}` : ''}
                  </p>
                </div>
                {user.username && (
                  <span className="px-2.5 py-1 text-[11px] font-mono font-bold bg-primary/10 text-primary rounded-full shrink-0">
                    {user.username}
                  </span>
                )}
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Username input */}
              <div>
                <Input
                  label="Nombre de Usuario"
                  required
                  placeholder="ej: jperez"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''));
                    setFormErrors((prev) => ({ ...prev, username: undefined }));
                  }}
                  error={formErrors.username}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <p className="text-[11px] text-gray-400 mt-1 pl-1">
                  Solo minúsculas y números, sin espacios ni caracteres especiales.
                </p>
              </div>

              {/* Password input with toggle, quick phone restore and regenerate button */}
              <div>
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Contraseña de Acceso <span className="text-red-500">*</span>
                  </label>

                  <div className="flex items-center gap-2">
                    {user?.phone && password !== user.phone.trim() && (
                      <button
                        type="button"
                        onClick={handleUsePhoneAsPassword}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors active:scale-95 cursor-pointer"
                      >
                        Usar teléfono
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleRegeneratePassword}
                      className="text-xs font-bold text-primary hover:text-primary-focus flex items-center gap-1 transition-colors active:scale-95 cursor-pointer"
                    >
                      <Sparkles size={13} /> Generar aleatoria
                    </button>
                  </div>
                </div>

                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setFormErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    placeholder="Contraseña"
                    className={clsx(
                      'block w-full rounded-xl border-2 border-gray-200 bg-white text-text-main py-2.5 pl-3 pr-10 focus:border-primary focus:ring-0 outline-none text-base shadow-sm transition-colors font-mono',
                      formErrors.password && 'border-red-500 focus:border-red-500'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {formErrors.password && (
                  <span className="text-red-500 text-xs font-medium mt-1 inline-block">
                    {formErrors.password}
                  </span>
                )}

                {/* Quick copy in-form button */}
                <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-100">
                  <span className="text-[11px] text-gray-400">
                    {user?.phone
                      ? 'Por defecto asignada con el número de teléfono.'
                      : 'Ingresa la contraseña de acceso deseada.'}
                  </span>

                  <button
                    type="button"
                    onClick={handleQuickCopyCredentials}
                    className={clsx(
                      'text-xs font-bold flex items-center gap-1 py-1 px-2 rounded-lg transition-all',
                      hasCopiedCredentials
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 active:scale-95'
                    )}
                  >
                    {hasCopiedCredentials ? (
                      <>
                        <Check size={12} /> ¡Copiado!
                      </>
                    ) : (
                      <>
                        <Copy size={12} /> Copiar credenciales
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Email input (Optional) */}
              <div>
                <Input
                  label="Correo Electrónico (Opcional)"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value.toLowerCase());
                    setFormErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  error={formErrors.email}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <p className="text-[11px] text-gray-400 mt-1 pl-1">
                  Permite asociar o actualizar el correo de inicio de sesión y recuperación.
                </p>
              </div>

              {/* Submit Action Button */}
              <Button
                type="submit"
                block
                variant="primary"
                loading={isSubmitting}
                loadingText={isUpdating ? 'Actualizando Credenciales...' : 'Creando Cuenta...'}
                disabled={isSubmitting || !username.trim() || !password.trim()}
                className="mt-3 py-3 font-bold text-sm flex items-center justify-center gap-2 shadow-xs"
              >
                <KeyRound size={18} /> {submitButtonText}
              </Button>
            </form>
    </AppDrawer>
  );
};

export default UserAccountModal;
