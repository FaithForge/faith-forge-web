import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Fingerprint, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { UserLogin } from '@/libs/state/redux/thunks/user/auth.thunk';
import { setAuthSession } from '@/libs/state/redux/slices/user/auth.slice';
import {
  isBiometricsAvailable,
  hasRegisteredBiometrics,
  getRegisteredBiometricData,
  authenticateWithBiometrics,
  registerBiometrics,
  updateBiometricSessionToken,
  clearBiometricSession,
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
  const persistedUser = useAppSelector((state) => state.authSlice.user);
  const initialBioData = getRegisteredBiometricData();

  const [isLoading, setIsLoading] = useState(false);
  const [isBioLoading, setIsBioLoading] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [registeredBioData, setRegisteredBioData] = useState<BiometricSessionData | null>(initialBioData);
  const [photoError, setPhotoError] = useState(false);
  const [showManualLogin, setShowManualLogin] = useState(!initialBioData);
  const [pendingLoginData, setPendingLoginData] = useState<{
    username: string;
    password?: string;
    user: any;
    token: string;
  } | null>(null);
  const [showRegisterBioModal, setShowRegisterBioModal] = useState(false);
  
  const defaultInitialUsername = initialBioData?.user?.username || initialBioData?.username || '';
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<IFormLoginInput>({
    defaultValues: {
      username: defaultInitialUsername,
      password: '',
    },
  });

  useEffect(() => {
    let isMounted = true;
    const checkBiometrics = async () => {
      const available = await isBiometricsAvailable();
      if (!isMounted) return;
      setBioAvailable(available);

      if (available && hasRegisteredBiometrics()) {
        const bioData = getRegisteredBiometricData();
        setRegisteredBioData(bioData);
        const resolvedUsername = bioData?.user?.username || bioData?.username;
        if (resolvedUsername) {
          setValue('username', resolvedUsername);
        }
      } else {
        setShowManualLogin(true);
      }
    };
    checkBiometrics();

    return () => {
      isMounted = false;
    };
  }, [setValue]);

  // Synchronize photoUrl from persistedUser to registeredBioData if missing
  useEffect(() => {
    if (
      persistedUser?.photoUrl &&
      registeredBioData &&
      !registeredBioData.user?.photoUrl &&
      (!registeredBioData.username ||
        persistedUser.username?.toLowerCase() === registeredBioData.username.toLowerCase() ||
        persistedUser.email?.toLowerCase() === registeredBioData.username.toLowerCase())
    ) {
      const updatedData: BiometricSessionData = {
        ...registeredBioData,
        user: {
          ...registeredBioData.user,
          photoUrl: persistedUser.photoUrl,
        },
      };
      setRegisteredBioData(updatedData);
      try {
        localStorage.setItem('iglekids_biometric_session', JSON.stringify(updatedData));
      } catch (e) {
        console.warn('Could not sync photo to biometric session:', e);
      }
    }
  }, [persistedUser, registeredBioData]);

  // Normalize any existing registered session where email was saved instead of username
  useEffect(() => {
    if (
      registeredBioData?.user?.username &&
      registeredBioData.username !== registeredBioData.user.username
    ) {
      const normalizedData: BiometricSessionData = {
        ...registeredBioData,
        username: registeredBioData.user.username,
      };
      setRegisteredBioData(normalizedData);
      setValue('username', registeredBioData.user.username);
      try {
        localStorage.setItem('iglekids_biometric_session', JSON.stringify(normalizedData));
      } catch (e) {
        console.warn('Could not normalize biometric username:', e);
      }
    }
  }, [registeredBioData, setValue]);

  /**
   * Handles biometric fingerprint / Face ID login.
   * If session token is expired, re-authenticates in the background with decrypted credentials.
   * On failure or cancellation, automatically switches to the credentials login form.
   *
   * @returns {Promise<void>}
   */
  const handleBiometricLogin = async () => {
    setIsBioLoading(true);
    try {
      const result = await authenticateWithBiometrics();
      if (!result) {
        setShowManualLogin(true);
        return;
      }

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
        const cleanBioUsername = (result.username || '')
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '');

        const loginResult = await dispatch(
          UserLogin({ username: cleanBioUsername, password: result.password })
        );

        if (UserLogin.fulfilled.match(loginResult)) {
          const payload = loginResult.payload;
          await updateBiometricSessionToken({
            token: payload.token,
            user: payload.user,
            password: result.password,
          });
          const name =
            formatPersonShortName(payload.user?.firstName, payload.user?.lastName) ||
            cleanBioUsername;
          toast.success(`¡Bienvenido de nuevo, ${name}!`);
          navigate('/', { replace: true });
        } else {
          const rawMsg = loginResult.error?.message || '';
          const isAuthError = rawMsg.includes('401') || rawMsg.includes('404');
          const errMsg = isAuthError
            ? 'Tus credenciales han cambiado. Por favor, ingresa con tu contraseña.'
            : (loginResult.payload as any)?.message ?? rawMsg ?? 'Error al iniciar sesión';
          toast.error(errMsg);
          setShowManualLogin(true);
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'No se pudo verificar la biometría.');
      setShowManualLogin(true);
    } finally {
      setIsBioLoading(false);
    }
  };

  /**
   * Clears the biometric session from device storage and resets the form to manual login mode.
   *
   * @returns {void}
   */
  const handleForgetBiometricUser = () => {
    clearBiometricSession();
    setRegisteredBioData(null);
    setShowManualLogin(true);
    setValue('username', '');
    setValue('password', '');
    toast.info('Se desvinculó el usuario de este dispositivo');
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
      const cleanInput = data.username.trim().toLowerCase().replace(/\s+/g, '');
      const resultAction = await dispatch(UserLogin({ username: cleanInput, password: data.password }));
      if (UserLogin.fulfilled.match(resultAction)) {
        const payload = resultAction.payload;
        // The authoritative username is payload.user?.username (never email)
        const authoritativeUsername = payload.user?.username || cleanInput;

        // If biometrics is available on device and not yet registered for this user, prompt registration
        if (
          bioAvailable &&
          (!registeredBioData ||
            registeredBioData.username.toLowerCase() !== authoritativeUsername.toLowerCase())
        ) {
          setPendingLoginData({
            username: authoritativeUsername,
            password: data.password,
            user: payload.user,
            token: payload.token,
          });
          setShowRegisterBioModal(true);
        } else {
          // If already registered for this user, update token and silently re-encrypt password
          if (registeredBioData) {
            await updateBiometricSessionToken({
              token: payload.token,
              user: payload.user,
              password: data.password,
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

  /**
   * Confirms biometric registration after successful manual login.
   *
   * @returns {Promise<void>}
   */
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

  /**
   * Skips biometric registration and navigates to the app root.
   *
   * @returns {void}
   */
  const handleSkipRegisterBio = () => {
    setShowRegisterBioModal(false);
    navigate('/', { replace: true });
  };

  const hasBioModeActive = bioAvailable && registeredBioData && !showManualLogin;

  const displayUsername =
    registeredBioData?.user?.username || registeredBioData?.username || '';

  const userPhotoUrl =
    registeredBioData?.user?.photoUrl ||
    registeredBioData?.user?.photo ||
    (persistedUser?.photoUrl &&
    (!registeredBioData?.username ||
      persistedUser.username?.toLowerCase() === registeredBioData.username.toLowerCase() ||
      persistedUser.email?.toLowerCase() === registeredBioData.username.toLowerCase())
      ? persistedUser.photoUrl
      : undefined);

  const userInitials = registeredBioData?.user?.firstName || registeredBioData?.user?.lastName
    ? `${registeredBioData.user.firstName?.[0] ?? ''}${registeredBioData.user.lastName?.[0] ?? ''}`.toUpperCase()
    : displayUsername.slice(0, 2).toUpperCase() || 'US';

  const savedDisplayName =
    formatPersonShortName(registeredBioData?.user?.firstName, registeredBioData?.user?.lastName) ||
    displayUsername;

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
          {hasBioModeActive ? (
            /* Biometric Only View */
            <div className="flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
              {/* User Avatar Circle */}
              <div className="relative mb-3.5">
                <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-bold text-2xl shadow-inner overflow-hidden">
                  {userPhotoUrl && !photoError ? (
                    <img
                      src={userPhotoUrl}
                      alt={savedDisplayName}
                      onError={() => setPhotoError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    userInitials
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1.5 shadow-sm ring-2 ring-white z-10">
                  <Fingerprint size={16} />
                </div>
              </div>

              <div className="flex flex-col items-center mb-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Bienvenido de nuevo</span>
                <h2 className="text-lg font-bold text-gray-800 mt-0.5">
                  {savedDisplayName}
                </h2>
                <span className="text-xs text-gray-500 mt-1 font-medium bg-gray-100/80 px-2.5 py-0.5 rounded-full">
                  {displayUsername}
                </span>
              </div>

              <div className="w-full flex flex-col gap-3">
                <Button
                  type="button"
                  onClick={handleBiometricLogin}
                  loading={isBioLoading}
                  loadingText="Verificando huella..."
                  block
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2.5 py-3.5 text-base shadow-xs font-semibold rounded-2xl"
                >
                  <Fingerprint size={22} className="shrink-0" />
                  Ingresar con huella
                </Button>

                <Button
                  type="button"
                  variant="default"
                  onClick={() => setShowManualLogin(true)}
                  block
                  className="py-3 text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-2 rounded-2xl"
                >
                  <KeyRound size={16} className="text-gray-400 shrink-0" />
                  Iniciar sesión con usuario
                </Button>

                <button
                  type="button"
                  onClick={handleForgetBiometricUser}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors pt-1 font-medium cursor-pointer text-center"
                >
                  ¿No eres tú? Olvidar huella en este equipo
                </button>
              </div>
            </div>
          ) : (
            /* Traditional Username & Password Form */
            <div className="flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-800">Iniciar Sesión</h2>
                <p className="text-xs text-gray-500 mt-1">Ingresa tus credenciales para continuar</p>
              </div>

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
                  className="mt-2 py-3 text-sm font-semibold rounded-2xl"
                >
                  Ingresar con Contraseña
                </Button>
              </form>

              {bioAvailable && registeredBioData && (
                <div className="text-center pt-2 border-t border-gray-100 flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowManualLogin(false)}
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-medium py-1 transition-colors cursor-pointer"
                  >
                    <Fingerprint size={16} />
                    Volver a ingreso con huella
                  </button>

                  <button
                    type="button"
                    onClick={handleForgetBiometricUser}
                    className="text-[11px] text-gray-400 hover:text-red-500 transition-colors font-medium cursor-pointer"
                  >
                    Olvidar huella de {displayUsername}
                  </button>
                </div>
              )}
            </div>
          )}
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
