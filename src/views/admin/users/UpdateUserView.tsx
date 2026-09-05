import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { 
  Camera, 
  Trash2, 
  Sparkles, 
  Save, 
  RotateCcw,
  CheckCircle2,
  User as UserIcon,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import PageHeader from '@/components/ui/PageHeader';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { updateAuthUser } from '@/libs/state/redux/slices/user/auth.slice';
import { 
  GetUser, 
  UpdateUser, 
  UploadUserImage 
} from '@/libs/state/redux/thunks/user/user.thunk';
import { 
  IUser, 
  IUpdateUser, 
  UserIdType, 
  UserState, 
  UserGenderCode,
  idTypeSelect, 
  healthSecurityEntitySelect, 
  userStateSelect 
} from '@/libs/models/User';
import { resizeAndCropImageToSquare } from '@/libs/utils/image';
import { capitalizeWords } from '@/libs/utils/text';
import { validateTwoLastNames } from '@/libs/utils/validator';
import { toDateOnlyInputValue } from '@/libs/utils/date';
import { APP_ROUTES } from '@/config/routes';
import dayjs from 'dayjs';
import Input from '@/components/ui/Input';
import PhoneInput from '@/components/ui/PhoneInput';
import DatePickerWheel from '@/components/ui/DatePickerWheel';
import SelectSearch from '@/components/ui/SelectSearch';
import Button from '@/components/ui/Button';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface UpdateUserFormData {
  firstName: string;
  lastName: string;
  nationalIdType: UserIdType;
  nationalId: string;
  gender: UserGenderCode;
  birthday: string;
  dialCodePhone: string;
  phone: string;
  email: string;
  healthSecurityEntity: string;
  state: UserState;
}

/**
 * Dedicated view for editing an existing user by ID.
 *
 * @returns {JSX.Element} Rendered edit user view.
 */
const UpdateUserView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.authSlice.user);
  const { current: currentUserInSlice, data: usersList } = useAppSelector((state) => state.userSlice);

  const [loadedUser, setLoadedUser] = useState<IUser | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty }
  } = useForm<UpdateUserFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      nationalIdType: UserIdType.CC,
      nationalId: '',
      gender: UserGenderCode.MALE,
      birthday: '',
      dialCodePhone: '+57',
      phone: '',
      email: '',
      healthSecurityEntity: '',
      state: UserState.ACTIVE,
    },
  });

  const watchedGender = watch('gender');

  /**
   * Loads user data into the form fields.
   *
   * @param {IUser} user - User data returned by API.
   */
  const populateUserData = (user: IUser) => {
    const userGender = 
      user.gender === UserGenderCode.FEMALE || (user.gender as unknown) === 'FEMALE' 
        ? UserGenderCode.FEMALE 
        : UserGenderCode.MALE;

    const formattedBirthday = toDateOnlyInputValue(user.birthday);

    reset({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      nationalIdType: user.nationalIdType || UserIdType.CC,
      nationalId: user.nationalId || '',
      gender: userGender,
      birthday: formattedBirthday,
      dialCodePhone: '+57',
      phone: user.phone || '',
      email: user.email || '',
      healthSecurityEntity: user.healthSecurityEntity || '',
      state: user.state || UserState.ACTIVE,
    });

    setPhotoPreview(user.photoUrl || '');
    setPhotoFile(null);
  };

  // Populate user data from Redux if already in memory, otherwise fallback to GetUser
  useEffect(() => {
    if (!id) {
      navigate(APP_ROUTES.admin.users);
      return;
    }

    if (currentUserInSlice && currentUserInSlice.id === id) {
      setLoadedUser(currentUserInSlice as IUser);
      populateUserData(currentUserInSlice as IUser);
      setIsLoadingUser(false);
      return;
    }

    if (usersList && usersList.length > 0) {
      const found = usersList.find((u) => u.id === id);
      if (found) {
        setLoadedUser(found);
        populateUserData(found);
        setIsLoadingUser(false);
        return;
      }
    }

    const fetchUser = async () => {
      setIsLoadingUser(true);
      try {
        const response = await dispatch(GetUser({ id })).unwrap();
        if (response) {
          setLoadedUser(response);
          populateUserData(response);
        } else {
          toast.error('No se encontró el usuario solicitado');
          navigate(APP_ROUTES.admin.users);
        }
      } catch (err: any) {
        toast.error(err?.message || 'Error al cargar los datos del usuario');
        navigate(APP_ROUTES.admin.users);
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUser();
  }, [id, currentUserInSlice, usersList, dispatch, navigate]);

  /**
   * Processes and optimizes captured or selected user image.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - File input change event.
   */
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const resizedBlob = await resizeAndCropImageToSquare(file);
        const resizedFile = new File([resizedBlob], file.name, { type: file.type });
        setPhotoFile(resizedFile);
        setPhotoPreview(URL.createObjectURL(resizedBlob));
      } catch (error) {
        toast.error('Error al procesar la imagen seleccionada');
      }
    }
  };

  /**
   * Removes selected or pre-loaded photo.
   */
  const removePhoto = () => {
    setPhotoPreview('');
    setPhotoFile(null);
  };

  /**
   * Resets form to original loaded user values.
   */
  const handleResetForm = () => {
    if (loadedUser) {
      populateUserData(loadedUser);
      toast.info('Valores restaurados al estado original');
    }
  };

  /**
   * Submits form to update user via PUT /user/:id.
   *
   * @param {UpdateUserFormData} data - Collected form data.
   */
  const onSubmit = async (data: UpdateUserFormData) => {
    if (!id || !loadedUser) return;

    setIsSubmitting(true);
    const toastId = toast.loading('Actualizando información del usuario...');

    try {
      let finalPhotoUrl = photoPreview;

      // 1. Upload new photo if changed
      if (photoFile) {
        try {
          const formData = new FormData();
          formData.append('file', photoFile);
          const uploadRes = await dispatch(UploadUserImage({ formData })).unwrap();
          if (uploadRes) {
            finalPhotoUrl = uploadRes;
          }
        } catch (uploadErr) {
          toast.error('No se pudo subir la foto, se continuará con los demás datos.');
        }
      }

      // 2. Construct payload with UpdateUserDTO
      const updatePayload: IUpdateUser = {
        nationalIdType: data.nationalIdType,
        nationalId: data.nationalId ? data.nationalId.trim() : undefined,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        dialCodePhone: data.dialCodePhone || '+57',
        phone: data.phone ? data.phone.trim() : undefined,
        email: data.email ? data.email.trim() : undefined,
        state: data.state,
        birthday: data.birthday ? data.birthday : undefined,
        gender: data.gender,
        healthSecurityEntity: data.healthSecurityEntity || undefined,
        photoUrl: finalPhotoUrl || undefined,
      };

      await dispatch(
        UpdateUser({
          id,
          updateUser: updatePayload,
        })
      ).unwrap();

      toast.success('¡Usuario actualizado exitosamente!', { id: toastId });

      // Update auth session if editing current session user
      if (currentUser?.id === id) {
        dispatch(
          updateAuthUser({
            ...updatePayload,
            photoUrl: finalPhotoUrl,
          })
        );
      }

      navigate(APP_ROUTES.admin.userDetail(id));
    } catch (err: any) {
      toast.error(err?.message || err?.error || 'Error al actualizar el usuario', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles back navigation with unsaved changes verification.
   */
  const handleBack = () => {
    if (isDirty || photoFile) {
      setShowDiscardModal(true);
    } else {
      if (id) {
        navigate(APP_ROUTES.admin.userDetail(id));
      } else {
        navigate(APP_ROUTES.admin.users);
      }
    }
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-full flex-1 w-full bg-slate-50 pb-20">
        <PageHeader title="Editar Usuario" onBack={handleBack} />
        <div className="flex justify-center items-center py-24">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex-1 w-full bg-slate-50 pb-28">
      <PageHeader title="Editar Usuario" onBack={handleBack} />

      <div className="max-w-2xl mx-auto p-4 sm:p-6 flex flex-col gap-6">
        
        {/* Header Card */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-1">
            <Sparkles size={14} />
            <span>Módulo de Usuarios</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
            Actualizar Datos del Usuario
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Modifica los datos personales, de contacto y el estado de la cuenta.
          </p>
        </div>

        {/* Edit Form */}
        <form 
          onSubmit={handleSubmit(onSubmit)} 
          className="flex flex-col gap-6 animate-in fade-in duration-300"
        >
          {/* Foto de Perfil */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-xs flex flex-col items-center sm:flex-row gap-5">
            <div className="relative group shrink-0">
              <div className={clsx(
                'w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20 flex items-center justify-center shadow-xs transition-transform',
                watchedGender === UserGenderCode.FEMALE ? 'bg-pink-50 text-pink-500' : 'bg-blue-50 text-blue-500'
              )}>
                {photoPreview ? (
                  <img src={photoPreview} alt="Foto de perfil" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={44} />
                )}
              </div>

              <label
                htmlFor="edit-user-photo"
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer shadow-md hover:bg-primary/90 transition-colors"
              >
                <Camera size={16} />
                <input
                  id="edit-user-photo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </label>
            </div>

            <div className="flex-1 text-center sm:text-left flex flex-col justify-center">
              <h2 className="text-base font-extrabold text-gray-900">
                {loadedUser?.firstName} {loadedUser?.lastName}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                ID: #{loadedUser?.faithForgeId || loadedUser?.id?.slice(0, 8)} • {loadedUser?.nationalIdType || 'CC'}: {loadedUser?.nationalId}
              </p>

              <div className="flex items-center gap-2 justify-center sm:justify-start mt-3">
                <label
                  htmlFor="edit-user-photo"
                  className="text-xs font-bold text-primary hover:text-primary/80 cursor-pointer bg-primary/10 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  <Camera size={14} /> Cambiar Foto
                </label>
                {photoPreview && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
                  >
                    <Trash2 size={14} /> Quitar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Card: Personal Information */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                <UserIcon size={14} />
              </div>
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                Datos Personales
              </h3>
            </div>

            {/* Documento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Controller
                name="nationalIdType"
                control={control}
                render={({ field }) => (
                  <SelectSearch
                    label="Tipo de Documento"
                    options={idTypeSelect.map((opt) => ({ id: opt.value, name: opt.label }))}
                    value={field.value}
                    onChange={field.onChange}
                    searchable={false}
                  />
                )}
              />

              <Input
                label="Número de Documento"
                placeholder="Número de documento..."
                {...register('nationalId', {
                  required: 'El número de documento es obligatorio',
                })}
                error={errors.nationalId?.message}
              />
            </div>

            {/* Nombres y Apellidos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nombres"
                placeholder="Nombres del usuario"
                {...register('firstName', {
                  required: 'Los nombres son obligatorios',
                })}
                error={errors.firstName?.message}
              />

              <Input
                label="Apellidos (Ambos Apellidos)"
                placeholder="Apellidos del usuario"
                {...register('lastName', {
                  required: 'Los apellidos son obligatorios',
                  validate: validateTwoLastNames,
                })}
                error={errors.lastName?.message}
              />
            </div>

            {/* Género */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                Género
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue('gender', UserGenderCode.MALE, { shouldDirty: true })}
                  className={clsx(
                    'flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all',
                    watchedGender === UserGenderCode.MALE
                      ? 'border-blue-500 bg-blue-50/80 text-blue-700 shadow-xs'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  )}
                >
                  Masculino
                </button>

                <button
                  type="button"
                  onClick={() => setValue('gender', UserGenderCode.FEMALE, { shouldDirty: true })}
                  className={clsx(
                    'flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all',
                    watchedGender === UserGenderCode.FEMALE
                      ? 'border-pink-500 bg-pink-50/80 text-pink-700 shadow-xs'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  )}
                >
                  Femenino
                </button>
              </div>
            </div>

            {/* Fecha de Nacimiento */}
            <div>
              <Controller
                name="birthday"
                control={control}
                render={({ field }) => (
                  <DatePickerWheel
                    label="Fecha de Nacimiento"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            {/* EPS */}
            <div>
              <Controller
                name="healthSecurityEntity"
                control={control}
                render={({ field }) => (
                  <SelectSearch
                    label="EPS / Entidad Promotora de Salud"
                    placeholder="Seleccionar EPS..."
                    options={healthSecurityEntitySelect}
                    value={field.value}
                    onChange={field.onChange}
                    searchable={true}
                  />
                )}
              />
            </div>
          </div>

          {/* Card: Contacto y Estado */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                <CheckCircle2 size={14} />
              </div>
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                Contacto y Estado de Cuenta
              </h3>
            </div>

            {/* Phone */}
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <PhoneInput
                  label="Teléfono / Celular"
                  dialCode={watch('dialCodePhone') || '+57'}
                  onDialCodeChange={(dial) => setValue('dialCodePhone', dial, { shouldDirty: true })}
                  phone={field.value || ''}
                  onPhoneChange={field.onChange}
                  error={errors.phone?.message}
                />
              )}
            />

            {/* Correo Electrónico */}
            <Input
              label="Correo Electrónico"
              type="email"
              placeholder="correo@ejemplo.com"
              {...register('email', {
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Ingresa un correo electrónico válido',
                },
              })}
              error={errors.email?.message}
            />

            {/* Estado */}
            <Controller
              name="state"
              control={control}
              render={({ field }) => (
                <SelectSearch
                  label="Estado del Usuario"
                  options={userStateSelect.map((opt) => ({ id: opt.value, name: opt.label }))}
                  value={field.value}
                  onChange={field.onChange}
                  searchable={false}
                />
              )}
            />
          </div>

          {/* Botonera de Acciones */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetForm}
              disabled={isSubmitting || (!isDirty && !photoFile)}
              className="flex items-center justify-center gap-2 py-3 px-5 rounded-2xl border-2 border-gray-200 bg-white text-gray-600 font-bold text-sm hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw size={16} /> Restaurar
            </button>

            <Button
              type="submit"
              variant="primary"
              block
              disabled={isSubmitting}
              className="py-3.5 font-bold text-base flex items-center justify-center gap-2 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> Guardando Cambios...
                </>
              ) : (
                <>
                  <Save size={20} /> Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Discard Changes Modal */}
      <ConfirmModal
        open={showDiscardModal}
        onOpenChange={setShowDiscardModal}
        title="¿Descartar cambios?"
        description="Tienes modificaciones sin guardar en el formulario. Si sales ahora, se perderán los cambios realizados."
        confirmText="Sí, salir y descartar"
        cancelText="Continuar editando"
        onConfirm={() => {
          setShowDiscardModal(false);
          if (id) {
            navigate(APP_ROUTES.admin.userDetail(id));
          } else {
            navigate(APP_ROUTES.admin.users);
          }
        }}
        type="warning"
      />
    </div>
  );
};

export default UpdateUserView;
