import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Fingerprint, Sparkles, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useAppDispatch } from '@/libs/state/redux/hooks';
import { UserLogin } from '@/libs/state/redux/thunks/user/auth.thunk';
import { setAuthSession } from '@/libs/state/redux/slices/user/auth.slice';
import {
  isBiometricsAvailable,
  hasRegisteredBiometrics,
  getRegisteredBiometricData,
  authenticateWithBiometrics,
  registerBiometrics,
  updateBiometricSessionToken,
  BiometricSessionData,
} from '@/libs/utils/biometrics';
import { formatPersonShortName } from '@/libs/utils/text';

interface IFormLoginInput {
  username: string;
  password: string;
}

const LoginView = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [isBioLoading, setIsBioLoading] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [registeredBioData, setRegisteredBioData] = useState<BiometricSessionData | null>(null);
  const [pendingLoginData, setPendingLoginData] = useState<{
    username: string;
    password?: string;
    user: any;
    token: string;
  } | null>(null);
  const [showRegisterBioModal, setShowRegisterBioModal] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<IFormLoginInput>();

  useEffect(() => {
    const checkBiometrics = async () => {
      const available = await isBiometricsAvailable();
      setBioAvailable(available);
      if (available && hasRegisteredBiometrics()) {
        setRegisteredBioData(getRegisteredBiometricData());
      }
    };
    checkBiometrics();
  }, []);

  /**
   * Handles biometric fingerprint / Face ID login.
   * If session token is expired, re-authenticates in the background with decrypted credentials.
   */
  const handleBiometricLogin = async () => {
    setIsBioLoading(true);
    try {
      const result = await authenticateWithBiometrics();
      if (!result) return;

      if (result.tokenValid && result.token && result.user) {
        dispatch(
          setAuthSession({
            user: result.user,
            token: result.token,
          })
        );
        const name =
          formatPersonShortName(result.user?.firstName, result.user?.lastName) ||
          result.username;
        toast.success(`¡Bienvenido de nuevo, ${name}!`);
        navigate('/', { replace: true });
        return;
      }

      if (result.password) {
        const loginResult = await dispatch(
          UserLogin({ username: result.username, password: result.password })
        );

        if (UserLogin.fulfilled.match(loginResult)) {
          const payload = loginResult.payload;
          updateBiometricSessionToken({
            token: payload.token,
            user: payload.user,
          });
          const name =
            formatPersonShortName(payload.user?.firstName, payload.user?.lastName) ||
            result.username;
          toast.success(`¡Bienvenido de nuevo, ${name}!`);
          navigate('/', { replace: true });
        } else {
          const rawMsg = loginResult.error?.message || '';
          const isAuthError = rawMsg.includes('401') || rawMsg.includes('404');
          const errMsg = isAuthError
            ? 'Tus credenciales han cambiado. Por favor, ingresa con tu contraseña.'
            : (loginResult.payload as any)?.message ?? rawMsg ?? 'Error al iniciar sesión';
          toast.error(errMsg);
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'No se pudo verificar la biometría.');
    } finally {
      setIsBioLoading(false);
    }
  };

  /**
   * Handles form submission: dispatches the UserLogin thunk and checks for biometric prompt.
   *
   * @param {IFormLoginInput} data - Form values containing username and password.
   * @returns {Promise<void>}
   */
  const onSubmit: SubmitHandler<IFormLoginInput> = async (data) => {
    setIsLoading(true);
    try {
      const cleanUsername = data.username.trim().toLowerCase().replace(/\s+/g, '');
      const resultAction = await dispatch(UserLogin({ username: cleanUsername, password: data.password }));
      if (UserLogin.fulfilled.match(resultAction)) {
        const payload = resultAction.payload;
        // If biometrics is available on device and not yet registered for this user, prompt registration
        if (bioAvailable && (!registeredBioData || registeredBioData.username !== cleanUsername)) {
          setPendingLoginData({
            username: cleanUsername,
            password: data.password,
            user: payload.user,
            token: payload.token,
          });
          setShowRegisterBioModal(true);
        } else {
          // If already registered for this user, update token silently
          if (registeredBioData && registeredBioData.username === cleanUsername) {
            updateBiometricSessionToken({
              token: payload.token,
              user: payload.user,
            });
          }
          toast.success('¡Bienvenido!');
          navigate('/', { replace: true });
        }
      } else {
        const rawMsg = resultAction.error?.message || '';
        const isAuthError = rawMsg.includes('401') || rawMsg.includes('404');
        const errMsg = isAuthError 
          ? 'Usuario o contraseña incorrectos' 
          : (resultAction.payload as any)?.message ?? rawMsg ?? 'Ocurrió un error inesperado';
        
        toast.error(errMsg);
      }
    } catch {
      toast.error('Error de conexión. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmRegisterBio = async () => {
    if (pendingLoginData) {
      const success = await registerBiometrics(pendingLoginData);
      if (success) {
        toast.success('¡Biometría (Huella / Face ID) configurada con éxito!');
      }
    }
    setShowRegisterBioModal(false);
    navigate('/', { replace: true });
  };

  const handleSkipRegisterBio = () => {
    setShowRegisterBioModal(false);
    navigate('/', { replace: true });
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-slate-50 px-6 animate-in fade-in duration-500 pb-safe overflow-hidden z-0">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-20%] w-96 h-96 bg-blue-400/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse -z-10" style={{ animationDuration: '4s' }}></div>
      <div className="absolute top-[10%] right-[-20%] w-96 h-96 bg-cyan-300/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse -z-10" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
      <div className="absolute bottom-[-10%] left-[10%] w-[500px] h-[500px] bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse -z-10" style={{ animationDuration: '6s', animationDelay: '2s' }}></div>
      
      <div className="w-full max-w-sm flex flex-col items-center z-10">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <img src="/logo-iglekids.png" alt="Iglekids Logo" className="w-60 h-auto drop-shadow-sm" />
        </div>

        <div className="w-full bg-white p-7 rounded-3xl shadow-sm border border-gray-100/90 flex flex-col gap-5">
          <h2 className="text-xl font-bold text-gray-800 text-center">Iniciar Sesión</h2>
          
          {/* Quick Access Button with Fingerprint / Face ID if already registered */}
          {bioAvailable && registeredBioData && (
            <div className="flex flex-col gap-2.5 p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 px-0.5">
                <UserCheck size={16} className="text-emerald-600 shrink-0" />
                <span className="truncate">
                  Cuenta guardada:{' '}
                  <strong>
                    {formatPersonShortName(
                      registeredBioData.user?.firstName,
                      registeredBioData.user?.lastName
                    ) || registeredBioData.username}
                  </strong>
                </span>
              </div>
              <Button
                type="button"
                onClick={handleBiometricLogin}
                loading={isBioLoading}
                loadingText="Verificando biometría..."
                block
                className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 py-3 shadow-xs font-semibold"
              >
                <Fingerprint size={20} />
                Ingresar con Huella / Face ID
              </Button>
              <div className="text-center pt-0.5">
                <span className="text-[11px] text-gray-400 font-medium">o ingresa con tus credenciales abajo</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input 
              label="Usuario / Email"
              type="text" 
              placeholder="Ingresa tu usuario"
              autoComplete="username"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              error={errors.username?.message}
              {...register('username', { required: 'Este campo es obligatorio' })}
            />

            <Input 
              label="Contraseña"
              type="password" 
              placeholder="Ingresa tu contraseña"
              autoComplete="current-password"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              error={errors.password?.message}
              {...register('password', { 
                required: 'La contraseña es obligatoria',
                minLength: { value: 6, message: 'Mínimo 6 caracteres' } 
              })}
            />

            <Button 
              type="submit" 
              block 
              variant="primary" 
              loading={isLoading}
              loadingText="Ingresando..."
              className="mt-2 py-3 text-sm font-semibold"
            >
              Ingresar con Contraseña
            </Button>
          </form>
        </div>

        <p className="text-center mt-6 text-xs text-gray-400 font-medium">Iglekids • v3.0.0</p>
      </div>

      {/* Modal suggesting biometric registration on first login */}
      <ConfirmModal
        open={showRegisterBioModal}
        onOpenChange={(open) => !open && handleSkipRegisterBio()}
        title="¿Activar ingreso con Huella / Face ID?"
        description="Puedes usar el sensor de huella o Face ID de tu dispositivo para iniciar sesión de forma rápida y segura en las próximas ocasiones."
        confirmText="Activar biometría"
        cancelText="Ahora no"
        type="info"
        onConfirm={handleConfirmRegisterBio}
      />
    </div>
  );
};

export default LoginView;
