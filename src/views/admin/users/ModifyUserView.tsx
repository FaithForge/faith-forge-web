import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { 
  ArrowLeft, 
  Search, 
  Loader2, 
  User as UserIcon, 
  Camera, 
  Trash2, 
  Sparkles, 
  Save, 
  AlertCircle,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import PageHeader from '@/components/ui/PageHeader';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { updateAuthUser } from '@/libs/state/redux/slices/user/auth.slice';
import { 
  GetUserByNationalId, 
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
import { validateTwoLastNames } from '@/libs/utils/validator';
import { APP_ROUTES } from '@/config/routes';
import dayjs from 'dayjs';
import Input from '@/components/ui/Input';
import PhoneInput from '@/components/ui/PhoneInput';
import DatePickerWheel from '@/components/ui/DatePickerWheel';
import SelectSearch from '@/components/ui/SelectSearch';
import Button from '@/components/ui/Button';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface ModifyUserFormData {
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
 * View for searching and editing existing users.
 * Allows searching by national ID and modifying fields according to UpdateUserDTO.
 *
 * @returns {JSX.Element} Rendered view component.
 */
const ModifyUserView: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.authSlice.user);

  // Estados de búsqueda
  const [searchNationalId, setSearchNationalId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [foundUser, setFoundUser] = useState<IUser | null>(null);

  // Image and form states
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty }
  } = useForm<ModifyUserFormData>({
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
   * Loads found user data into form fields.
   *
   * @param {IUser} user - User data returned by API.
   */
  const populateUserData = (user: IUser) => {
    // Normalize gender
    const userGender = 
      user.gender === UserGenderCode.FEMALE || (user.gender as unknown) === 'FEMALE' 
        ? UserGenderCode.FEMALE 
        : UserGenderCode.MALE;

    // Normalizar fecha de nacimiento
    let formattedBirthday = '';
    if (user.birthday) {
      const d = dayjs(user.birthday);
      if (d.isValid()) {
        formattedBirthday = d.format('YYYY-MM-DD');
      }
    }

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

  /**
   * Executes user search by national ID / document number.
   *
   * @param {React.FormEvent} [e] - Search form submit event.
   */
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const cleanId = searchNationalId.trim();
    if (!cleanId) {
      toast.error('Ingresa un número de documento para buscar');
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    setFoundUser(null);

    try {
      const response = await dispatch(GetUserByNationalId(cleanId)).unwrap();
      if (response) {
        setFoundUser(response);
        populateUserData(response);
      } else {
        toast.info('No se encontró ningún usuario con ese número de documento');
      }
    } catch (error: any) {
      toast.info(error?.message || error || 'No se encontró ningún usuario con ese número de documento');
    } finally {
      setIsSearching(false);
    }
  };

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
    if (foundUser) {
      populateUserData(foundUser);
      toast.info('Valores restaurados al estado original');
    }
  };

  /**
   * Submits form to update user via PUT /user/:id.
   *
   * @param {ModifyUserFormData} data - Collected form data.
   */
  const onSubmit = async (data: ModifyUserFormData) => {
    if (!foundUser) return;

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
          id: foundUser.id,
          updateUser: updatePayload,
        })
      ).unwrap();

      toast.success('¡Usuario actualizado exitosamente!', { id: toastId });

      // Update local user state
      setFoundUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          ...updatePayload,
          photoUrl: finalPhotoUrl,
        } as IUser;
      });

      // Si el usuario editado es el usuario autenticado actualmente, actualizar la sesión
      if (currentUser?.id === foundUser.id) {
        dispatch(
          updateAuthUser({
            ...updatePayload,
            photoUrl: finalPhotoUrl,
          })
        );
      }

      // Sincronizar form
      reset(data);
      setPhotoFile(null);
    } catch (err: any) {
      toast.error(err?.message || err?.error || 'Error al actualizar el usuario', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles back navigation by checking for unsaved changes.
   */
  const handleBack = () => {
    if (isDirty || photoFile) {
      setShowDiscardModal(true);
    } else {
      navigate(APP_ROUTES.admin.root);
    }
  };

  return (
    <div className="min-h-full flex-1 w-full bg-slate-50 pb-28">
      <PageHeader title="Modificar Usuario" onBack={handleBack} />

      <div className="max-w-2xl mx-auto p-4 sm:p-6 flex flex-col gap-6">
        
        {/* Card de Encabezado */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-1">
            <Sparkles size={14} />
            <span>Módulo de Usuarios</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
            Actualizar Datos de Usuario
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Busca al usuario por su documento de identidad para editar su información personal y de contacto.
          </p>
        </div>

        {/* Search by Document Card */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100 mb-4">
            <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <Search size={14} />
            </div>
            <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
              Buscar Usuario por Cédula / Documento
            </h2>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <Input
                label="Número de Documento"
                placeholder="Escribir número de documento..."
                value={searchNationalId}
                onChange={(e) => setSearchNationalId(e.target.value)}
                onClear={() => setSearchNationalId('')}
                autoFocus
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              disabled={isSearching || !searchNationalId.trim()}
              className="py-2.5 px-5 h-[46px] font-bold text-sm shrink-0 w-full sm:w-auto flex items-center justify-center gap-2"
            >
              {isSearching ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Buscando...
                </>
              ) : (
                <>
                  <Search size={18} /> Buscar
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Not Found State */}
        {hasSearched && !isSearching && !foundUser && (
          <div className="bg-white rounded-2xl p-8 border border-gray-200/80 shadow-xs text-center flex flex-col items-center animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
              <AlertCircle size={24} />
            </div>
            <h3 className="font-bold text-gray-800 text-base">No se encontró el usuario</h3>
            <p className="text-xs text-gray-500 max-w-sm mt-1">
              Verifica que el número de cédula esté escrito correctamente o créalo desde la opción "Crear Nuevo Usuario".
            </p>
          </div>
        )}

        {/* Edit Form */}
        {foundUser && (
          <form 
            onSubmit={handleSubmit(onSubmit)} 
            className="flex flex-col gap-6 animate-in fade-in slide-in-from-top-3 duration-300"
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
                <h3 className="text-base font-extrabold text-gray-900">
                  {foundUser.firstName} {foundUser.lastName}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  ID: #{foundUser.faithForgeId || foundUser.id.slice(0, 8)} • {foundUser.nationalIdType || 'CC'}: {foundUser.nationalId}
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
                <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                  Datos Personales
                </h2>
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

              {/* Gender */}
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
                <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                  Contacto y Estado de Cuenta
                </h2>
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
        )}
      </div>

      {/* Discard Changes on Exit Modal */}
      <ConfirmModal
        open={showDiscardModal}
        onOpenChange={setShowDiscardModal}
        title="¿Descartar cambios?"
        description="Tienes modificaciones sin guardar en el formulario. Si sales ahora, se perderán los cambios realizados."
        confirmText="Sí, salir y descartar"
        cancelText="Continuar editando"
        onConfirm={() => navigate(APP_ROUTES.admin.root)}
        type="warning"
      />
    </div>
  );
};

export default ModifyUserView;
