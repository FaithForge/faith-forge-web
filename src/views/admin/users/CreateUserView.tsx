import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { 
  ArrowLeft, 
  Camera, 
  Trash2, 
  Loader2, 
  User, 
  Shield, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Sparkles,
  Check,
  Copy,
  CheckCheck,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import { toast } from 'sonner';
import clsx from 'clsx';
import PageHeader from '@/components/ui/PageHeader';
import { useAppDispatch } from '@/libs/state/redux/hooks';
import { CreateUser, CreateUserAccount, UploadUserImage } from '@/libs/state/redux/thunks/user/user.thunk';
import { 
  ICreateUser, 
  UserIdType, 
  UserState, 
  idTypeSelect, 
  healthSecurityEntitySelect, 
  userStateSelect,
  generateSuggestedUsername 
} from '@/libs/models/User';
import { resizeAndCropImageToSquare } from '@/libs/utils/image';
import { validateTwoLastNames } from '@/libs/utils/validator';
import { useBackSwipeGuard } from '@/libs/hooks/useBackSwipeGuard';
import { APP_ROUTES } from '@/config/routes';
import dayjs from 'dayjs';
import Input from '@/components/ui/Input';
import PhoneInput from '@/components/ui/PhoneInput';
import DatePickerWheel from '@/components/ui/DatePickerWheel';
import SelectSearch from '@/components/ui/SelectSearch';
import Button from '@/components/ui/Button';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface CreateUserFormData {
  firstName: string;
  lastName: string;
  nationalIdType: UserIdType;
  nationalId: string;
  gender: string;
  birthday: string;
  dialCodePhone: string;
  phone: string;
  email: string;
  healthSecurityEntity: string;
  state: UserState;
  createAccount: boolean;
  username: string;
  password: string;
}

interface CreatedAccountResult {
  fullName: string;
  username: string;
  password: string;
  email?: string;
  phone?: string;
  dialCodePhone?: string;
  photoUrl?: string;
}

/**
 * View to Create a New User in the Admin Panel.
 * Supports creating person data (POST /user) and optional access account (POST /user/account).
 */
const CreateUserView: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Estados locales
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUsernameManuallyEdited, setIsUsernameManuallyEdited] = useState(false);
  const [isPasswordManuallyEdited, setIsPasswordManuallyEdited] = useState(false);
  const [hasCopiedText, setHasCopiedText] = useState(false);

  // State for confirmation screen after account creation
  const [createdAccountResult, setCreatedAccountResult] = useState<CreatedAccountResult | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    clearErrors,
    formState: { errors, isDirty },
  } = useForm<CreateUserFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      nationalIdType: UserIdType.CC,
      nationalId: '',
      gender: '',
      birthday: '',
      dialCodePhone: '+57',
      phone: '',
      email: '',
      healthSecurityEntity: '',
      state: UserState.ACTIVE,
      createAccount: false,
      username: '',
      password: '',
    },
  });

  const watchedFirstName = watch('firstName');
  const watchedLastName = watch('lastName');
  const watchedPhone = watch('phone');
  const watchedDialCode = watch('dialCodePhone');
  const watchedEmail = watch('email');
  const watchedCreateAccount = watch('createAccount');
  const watchedGender = watch('gender');

  // Auto-suggest username when names change if not manually edited
  useEffect(() => {
    if (!isUsernameManuallyEdited) {
      const suggested = generateSuggestedUsername(watchedFirstName, watchedLastName);
      setValue('username', suggested);
    }
  }, [watchedFirstName, watchedLastName, isUsernameManuallyEdited, setValue]);

  // Auto-fill password with phone number if not manually edited
  useEffect(() => {
    if (!isPasswordManuallyEdited) {
      setValue('password', watchedPhone || '');
    }
  }, [watchedPhone, isPasswordManuallyEdited, setValue]);

  /**
   * Handles create account checkbox click by validating and toggling requirements.
   */
  const handleToggleCreateAccount = async () => {
    const nextState = !watchedCreateAccount;
    setValue('createAccount', nextState, { shouldDirty: true });

    if (nextState) {
      setTimeout(() => {
        trigger(['phone', 'email', 'firstName', 'lastName']);
      }, 0);
    } else {
      clearErrors(['phone', 'email']);
    }
  };

  /**
   * Processes and optimizes captured or selected user image.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - File input change event
   */
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const resizedBlob = await resizeAndCropImageToSquare(file);
        const resizedFile = new File([resizedBlob], file.name, { type: file.type });
        setPhotoFile(resizedFile);
        setPhotoUrl(URL.createObjectURL(resizedBlob));
      } catch (error) {
        toast.error('Error al procesar la imagen seleccionada');
      }
    }
  };

  const isBackGuardActive = (isDirty || Boolean(photoFile)) && !createdAccountResult;
  const { allowNavigation } = useBackSwipeGuard({
    enabled: isBackGuardActive,
    onBlockBack: () => setShowCancelModal(true),
  });

  /**
   * Removes the selected photo.
   */
  const removePhoto = () => {
    setPhotoUrl('');
    setPhotoFile(null);
  };

  /**
   * Handles navigation exit attempt.
   */
  const handleBackClick = () => {
    if (isDirty || photoFile) {
      setShowCancelModal(true);
    } else {
      allowNavigation();
      navigate(APP_ROUTES.admin.root);
    }
  };

  /**
   * Confirms exit and discards pending changes.
   */
  const handleConfirmCancel = () => {
    allowNavigation();
    setShowCancelModal(false);
    navigate(APP_ROUTES.admin.root);
  };

  /**
   * Submits form to create the user and optional login account.
   *
   * @param {CreateUserFormData} data - Collected form data
   */
  const onSubmit = async (data: CreateUserFormData) => {
    if (data.createAccount) {
      if (!data.email || !data.email.trim()) {
        toast.error('El correo electrónico es obligatorio para crear la cuenta de acceso');
        return;
      }
      if (!data.phone || !data.phone.trim()) {
        toast.error('El número de teléfono es obligatorio para asignar la contraseña de la cuenta');
        return;
      }
      if (!data.username || !data.username.trim()) {
        toast.error('El nombre de usuario es obligatorio para la cuenta de acceso');
        return;
      }
      if (!data.password || !data.password.trim()) {
        toast.error('La contraseña es obligatoria para la cuenta de acceso');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // 1. Upload photo if present
      let uploadedPhotoKey: string | undefined = undefined;
      if (photoFile) {
        try {
          const formData = new FormData();
          formData.append('file', photoFile);
          const uploadRes = await dispatch(UploadUserImage({ formData })).unwrap();
          uploadedPhotoKey = uploadRes;
        } catch (uploadError) {
          toast.error('Error al subir la foto de perfil. Continuando con el registro...');
        }
      }

      // 2. Create person/user (POST /user)
      const userPayload: ICreateUser = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        nationalIdType: data.nationalId ? data.nationalIdType : undefined,
        nationalId: data.nationalId ? data.nationalId.trim() : undefined,
        gender: data.gender,
        birthday: data.birthday ? data.birthday : undefined,
        dialCodePhone: data.dialCodePhone || '+57',
        phone: data.phone ? data.phone.trim() : undefined,
        email: data.email ? data.email.trim().toLowerCase() : undefined,
        healthSecurityEntity: data.healthSecurityEntity || undefined,
        state: data.state || UserState.ACTIVE,
        photoUrl: uploadedPhotoKey,
      };

      const userResponse = await dispatch(CreateUser(userPayload)).unwrap();
      const createdUserId = userResponse?.id || userResponse?.userId;

      // 3. Create login account if enabled (POST /user/account)
      if (data.createAccount) {
        if (!createdUserId) {
          toast.error('Usuario creado, pero no se pudo obtener su identificador para la cuenta de acceso.');
          navigate(APP_ROUTES.admin.root);
        } else {
          try {
            await dispatch(
              CreateUserAccount({
                userId: createdUserId,
                username: data.username.trim().toLowerCase(),
                password: data.password.trim(),
                email: data.email ? data.email.trim().toLowerCase() : undefined,
              })
            ).unwrap();
            
            toast.success('¡Usuario y cuenta de acceso creados con éxito!');
            
            // Display confirmation screen with credentials and WhatsApp share button
            setCreatedAccountResult({
              fullName: `${data.firstName.trim()} ${data.lastName.trim()}`,
              username: data.username.trim().toLowerCase(),
              password: data.password.trim(),
              email: data.email ? data.email.trim().toLowerCase() : undefined,
              phone: data.phone ? data.phone.trim() : undefined,
              dialCodePhone: data.dialCodePhone || '+57',
              photoUrl: photoUrl || undefined,
            });
          } catch (accountErr: any) {
            toast.error(accountErr?.message || 'Usuario creado, pero ocurrió un error al crear su cuenta de acceso.');
            navigate(APP_ROUTES.admin.root);
          }
        }
      } else {
        toast.success('¡Usuario registrado con éxito!');
        navigate(APP_ROUTES.admin.root);
      }
    } catch (err: any) {
      toast.error(err?.message || err?.error || 'Error al registrar el usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Generates formatted message for WhatsApp.
   */
  const whatsappMessage = useMemo(() => {
    if (!createdAccountResult) return '';
    const loginUrl = `${window.location.origin}${APP_ROUTES.auth.login}`;
    return `¡Hola *${createdAccountResult.fullName}*! 👋

Te damos la bienvenida a la plataforma. Tu cuenta de acceso ha sido creada con éxito:

👤 *Usuario:* ${createdAccountResult.username}
🔑 *Contraseña:* ${createdAccountResult.password}
🌐 *Ingreso:* ${loginUrl}

⚠️ *Importante:* Guarda estas credenciales en un lugar seguro y te recomendamos borrar este mensaje por seguridad una vez hayas iniciado sesión.`;
  }, [createdAccountResult]);

  /**
   * Copies formatted message to clipboard.
   */
  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(whatsappMessage);
      setHasCopiedText(true);
      toast.success('¡Mensaje copiado al portapapeles!');
      setTimeout(() => setHasCopiedText(false), 3000);
    } catch (err) {
      toast.error('No se pudo copiar el mensaje automáticamente.');
    }
  };

  /**
   * Opens WhatsApp with pre-filled message.
   */
  const handleShareWhatsApp = () => {
    if (!createdAccountResult) return;
    const cleanDial = (createdAccountResult.dialCodePhone || '+57').replace(/\+/g, '');
    const cleanPhone = (createdAccountResult.phone || '').replace(/\D/g, '');
    const fullPhone = `${cleanDial}${cleanPhone}`;
    const encodedText = encodeURIComponent(whatsappMessage);
    
    const waUrl = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    window.open(waUrl, '_blank');
  };

  // =========================================================================
  // VISTA 2: Pantalla de Confirmación de Cuenta Creada y Compartir WhatsApp
  // =========================================================================
  if (createdAccountResult) {
    return (
      <div className="min-h-full bg-slate-50/60 pb-20">
        {/* Header */}
        <div className="bg-primary text-primary-foreground p-4 sticky top-0 z-30 shadow-md flex items-center justify-between">
          <span className="font-bold text-base">Cuenta de Usuario Creada</span>
          <div className="w-6" />
        </div>

        <div className="max-w-xl mx-auto p-4 sm:p-6 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300">
          
          {/* Card de Éxito y Resumen */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 shadow-xs">
              <Check size={32} strokeWidth={3} />
            </div>
            
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              ¡Cuenta Creada Exitosamente!
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-md">
              El usuario ha sido registrado y sus credenciales de acceso están listas para ser compartidas.
            </p>

            {/* Ficha Resumen de Credenciales */}
            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 mt-5 text-left flex flex-col gap-2.5">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-xs text-gray-500 font-medium">Nombre Completo</span>
                <span className="text-xs font-bold text-gray-900">{createdAccountResult.fullName}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-xs text-gray-500 font-medium">Usuario</span>
                <span className="text-xs font-bold font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                  {createdAccountResult.username}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 font-medium">Contraseña Inicial</span>
                <span className="text-xs font-bold font-mono text-gray-900 bg-gray-200 px-2 py-0.5 rounded-md">
                  {createdAccountResult.password}
                </span>
              </div>
            </div>
          </div>

          {/* Card Mensaje de WhatsApp */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-emerald-200 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2 text-emerald-800">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <FaWhatsapp size={18} />
              </div>
              <h2 className="text-sm font-bold tracking-tight">
                Mensaje Listo para Compartir
              </h2>
            </div>

            {/* Vista previa del mensaje */}
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 font-mono text-xs text-gray-800 whitespace-pre-line leading-relaxed shadow-inner">
              {whatsappMessage}
            </div>

            {/* Action buttons for WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <Button
                type="button"
                variant="default"
                onClick={handleCopyMessage}
                className="py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
              >
                {hasCopiedText ? (
                  <>
                    <CheckCheck size={18} className="text-emerald-600" /> Copiado
                  </>
                ) : (
                  <>
                    <Copy size={18} /> Copiar Mensaje
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="primary"
                onClick={handleShareWhatsApp}
                className="py-2.5 text-sm font-bold flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white border-transparent shadow-sm"
              >
                <FaWhatsapp size={18} /> Enviar por WhatsApp
              </Button>
            </div>
          </div>

          {/* Finish Button */}
          <Button
            type="button"
            variant="default"
            block
            onClick={() => navigate(APP_ROUTES.admin.root)}
            className="py-3 text-base font-bold shadow-xs hover:bg-gray-100"
          >
            Finalizar y Volver a Administración
          </Button>

        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: Main User Creation Form
  // =========================================================================
  return (
    <div className="min-h-full bg-slate-50/60 pb-20">
      <PageHeader title="Crear Usuario" onBack={handleBackClick} />

      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          
          {/* Card 1: Foto de Perfil */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs flex flex-col items-center justify-center">
            <label htmlFor="userPhotoUpload" className="relative cursor-pointer group block">
              <div className={clsx(
                'w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-md flex items-center justify-center transition-transform group-hover:scale-105 active:scale-95',
                !photoUrl && (watchedGender === 'F' ? 'bg-pink-100 text-pink-500' : 'bg-blue-100 text-blue-500')
              )}>
                {photoUrl ? (
                  <img src={photoUrl} alt="Foto del usuario" className="w-full h-full object-cover" />
                ) : (
                  <User size={52} />
                )}
              </div>
              <div className="absolute bottom-0 right-0 bg-primary text-white p-2.5 rounded-full shadow-lg hover:bg-primary/90 transition-transform group-hover:scale-110 active:scale-95 border-2 border-white">
                <Camera size={16} />
              </div>
              <input
                id="userPhotoUpload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </label>

            <span className="text-xs text-gray-500 font-medium mt-2.5 text-center">
              {photoUrl ? 'Toca la imagen para cambiarla' : 'Toca la imagen para agregar foto de perfil (Opcional)'}
            </span>

            {photoUrl && (
              <button
                type="button"
                onClick={removePhoto}
                className="mt-2 text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors"
              >
                <Trash2 size={13} /> Eliminar foto
              </button>
            )}
          </div>

          {/* Card 2: Personal Information */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                <User size={14} />
              </div>
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                Información Personal
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nombres"
                required
                placeholder="Nombres del usuario"
                error={errors.firstName?.message}
                {...register('firstName', {
                  required: 'Los nombres son obligatorios',
                  minLength: { value: 2, message: 'Debe tener al menos 2 caracteres' },
                })}
              />

              <Input
                label="Apellidos"
                required
                placeholder="Apellidos del usuario"
                error={errors.lastName?.message}
                {...register('lastName', {
                  required: 'Los apellidos son obligatorios',
                  validate: validateTwoLastNames,
                })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Controller
                name="nationalIdType"
                control={control}
                render={({ field }) => (
                  <SelectSearch
                    label="Tipo Doc."
                    options={idTypeSelect.map((opt) => ({ id: opt.value, name: `${opt.value} - ${opt.label}` }))}
                    value={field.value}
                    onChange={(val) => field.onChange(val as UserIdType)}
                    placeholder="Tipo de documento..."
                    searchable={false}
                  />
                )}
              />

              <div className="sm:col-span-2">
                <Input
                  label="Número de Documento"
                  placeholder="Escribir número de documento..."
                  error={errors.nationalId?.message}
                  {...register('nationalId')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Controller
                name="gender"
                control={control}
                rules={{ required: 'El género es obligatorio' }}
                render={({ field }) => (
                  <SelectSearch
                    label="Género"
                    required
                    options={[
                      { id: 'M', name: 'Masculino' },
                      { id: 'F', name: 'Femenino' },
                    ]}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.gender?.message}
                    placeholder="Seleccionar género..."
                    searchable={false}
                  />
                )}
              />

              <Controller
                name="birthday"
                control={control}
                render={({ field }) => (
                  <div>
                    <DatePickerWheel
                      label="Fecha de Nacimiento"
                      value={field.value}
                      onChange={(date) => field.onChange(dayjs(date).format('YYYY-MM-DD'))}
                      minDate={dayjs().subtract(100, 'year').format('YYYY-MM-DD')}
                      maxDate={dayjs().format('YYYY-MM-DD')}
                    />
                    {errors.birthday && (
                      <span className="text-red-500 text-xs font-medium mt-1 inline-block">
                        {errors.birthday.message}
                      </span>
                    )}
                  </div>
                )}
              />
            </div>
          </div>

          {/* Card 3: Contacto y Salud */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                <Shield size={14} />
              </div>
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                Contacto e Información Adicional
              </h2>
            </div>

            <Controller
              name="phone"
              control={control}
              rules={{
                validate: (val) => {
                  if (!watch('createAccount')) return true;
                  if (!val || !val.trim()) return 'El teléfono es obligatorio para crear la cuenta de acceso';
                  const clean = val.replace(/\D/g, '');
                  if (clean.length < 7) return 'El teléfono debe tener al menos 7 dígitos';
                  return true;
                },
              }}
              render={({ field }) => (
                <PhoneInput
                  label="Teléfono / Celular"
                  required={watchedCreateAccount}
                  dialCode={watch('dialCodePhone') || '+57'}
                  phone={field.value}
                  onDialCodeChange={(code) => setValue('dialCodePhone', code, { shouldDirty: true })}
                  onPhoneChange={(val) => {
                    field.onChange(val);
                    if (watchedCreateAccount) trigger('phone');
                  }}
                  error={errors.phone?.message}
                />
              )}
            />

            <Input
              type="email"
              label="Correo Electrónico"
              required={watchedCreateAccount}
              placeholder="Correo electrónico del usuario"
              error={errors.email?.message}
              {...register('email', {
                validate: (val) => {
                  if (!watch('createAccount')) {
                    if (val && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(val)) {
                      return 'Ingrese un correo electrónico válido';
                    }
                    return true;
                  }
                  if (!val || !val.trim()) return 'El correo electrónico es obligatorio para crear la cuenta de acceso';
                  if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(val)) {
                    return 'Ingrese un correo electrónico válido';
                  }
                  return true;
                },
              })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Controller
                name="healthSecurityEntity"
                control={control}
                render={({ field }) => (
                  <SelectSearch
                    label="Entidad de Salud (EPS)"
                    options={healthSecurityEntitySelect}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Buscar EPS..."
                    valueKey="name"
                    searchable={true}
                  />
                )}
              />

              <Controller
                name="state"
                control={control}
                rules={{ required: 'El estado es obligatorio' }}
                render={({ field }) => (
                  <SelectSearch
                    label="Estado Inicial"
                    required
                    options={userStateSelect.map((st) => ({ id: st.value, name: st.label }))}
                    value={field.value}
                    onChange={(val) => field.onChange(val as UserState)}
                    placeholder="Seleccionar estado..."
                    searchable={false}
                  />
                )}
              />
            </div>
          </div>

          {/* Card 4: Cuenta de Acceso (Opcional) */}
          <div className={clsx(
            'rounded-2xl border transition-all duration-300 overflow-hidden',
            watchedCreateAccount 
              ? 'bg-emerald-50/40 border-emerald-200 shadow-xs' 
              : 'bg-white border-gray-200/80 shadow-xs'
          )}>
            <div className="p-5 sm:p-6 flex flex-col gap-4">
              
              {/* Checkbox Header with Pre-validation */}
              <div 
                onClick={handleToggleCreateAccount}
                className="flex items-center gap-3.5 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={watchedCreateAccount}
                  onChange={handleToggleCreateAccount}
                  className="w-5 h-5 rounded-md border-gray-300 text-primary focus:ring-primary/20 transition-colors pointer-events-none shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <KeyRound size={16} className={watchedCreateAccount ? 'text-emerald-700' : 'text-gray-500'} />
                    <span className={clsx('font-bold text-sm sm:text-base', watchedCreateAccount ? 'text-emerald-900' : 'text-gray-800')}>
                      Crear cuenta de acceso al sistema
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-0.5">
                    {watchedCreateAccount
                      ? 'Se crearán credenciales de acceso con el correo y teléfono indicados.'
                      : 'Habilita credenciales (usuario y contraseña) para iniciar sesión.'}
                  </p>
                </div>
              </div>

              {/* Collapsible content if checked */}
              {watchedCreateAccount && (
                <div className="pt-3 border-t border-emerald-100/80 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Nombre de Usuario Generado"
                      required
                      placeholder="Nombre de usuario"
                      error={errors.username?.message}
                      {...register('username', {
                        required: 'El usuario es obligatorio para la cuenta',
                        onChange: () => setIsUsernameManuallyEdited(true),
                      })}
                    />

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                        Contraseña Inicial <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Contraseña"
                          className="block w-full rounded-xl border-2 border-gray-200 bg-white text-text-main py-2.5 px-3 pr-10 focus:border-primary focus:ring-0 outline-none text-base shadow-sm transition-colors"
                          {...register('password', {
                            required: 'La contraseña es obligatoria para la cuenta',
                            onChange: () => setIsPasswordManuallyEdited(true),
                          })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {errors.password && (
                        <span className="text-red-500 text-xs font-medium mt-1 inline-block">
                          {errors.password.message}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            block
            disabled={isSubmitting}
            className="py-3 text-base font-bold shadow-md hover:shadow-lg transition-all mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={20} className="animate-spin mr-2 inline" /> Guardando Usuario...
              </>
            ) : (
              <>
                <Check size={20} className="mr-2 inline" /> Guardar Usuario
              </>
            )}
          </Button>

        </form>
      </div>

      {/* Confirm Cancel Modal */}
      <ConfirmModal
        open={showCancelModal}
        onOpenChange={setShowCancelModal}
        title="¿Descartar cambios?"
        description="Hay datos ingresados en el formulario. Si sales ahora, se perderán."
        confirmText="Sí, salir"
        cancelText="Continuar editando"
        onConfirm={handleConfirmCancel}
        type="danger"
        disableBackClose={true}
      />
    </div>
  );
};

export default CreateUserView;
