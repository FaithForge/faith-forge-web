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
import { useAppDispatch } from '@/libs/state/redux/hooks';
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
  UserGender,
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
  gender: UserGender;
  birthday: string;
  dialCodePhone: string;
  phone: string;
  email: string;
  healthSecurityEntity: string;
  state: UserState;
}

/**
 * Vista para la búsqueda y modificación de usuarios existentes.
 * Permite buscar por cédula/documento y editar los campos del DTO UpdateUserDTO.
 *
 * @returns {JSX.Element} Componente renderizado de la vista.
 */
const ModifyUserView: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Estados de búsqueda
  const [searchNationalId, setSearchNationalId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [foundUser, setFoundUser] = useState<IUser | null>(null);

  // Estados de imagen y formulario
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
      gender: UserGender.MALE,
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
   * Carga los datos del usuario encontrado en el formulario.
   *
   * @param {IUser} user - Datos del usuario devuelto por la API.
   */
  const populateUserData = (user: IUser) => {
    // Normalizar género
    const userGender = 
      user.gender === 'F' || (user.gender as unknown) === UserGender.FEMALE 
        ? UserGender.FEMALE 
        : UserGender.MALE;

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
   * Ejecuta la búsqueda de usuario por su número de cédula / documento.
   *
   * @param {React.FormEvent} [e] - Evento de submit del formulario de búsqueda.
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
   * Procesa la captura o selección de imagen del usuario y la optimiza.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - Evento de cambio del input de archivo.
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
   * Elimina la foto seleccionada o precargada.
   */
  const removePhoto = () => {
    setPhotoPreview('');
    setPhotoFile(null);
  };

  /**
   * Restablece el formulario a los valores originales del usuario cargado.
   */
  const handleResetForm = () => {
    if (foundUser) {
      populateUserData(foundUser);
      toast.info('Valores restaurados al estado original');
    }
  };

  /**
   * Envía el formulario para actualizar el usuario vía PUT /user/:id.
   *
   * @param {ModifyUserFormData} data - Datos recopilados del formulario.
   */
  const onSubmit = async (data: ModifyUserFormData) => {
    if (!foundUser) return;

    setIsSubmitting(true);
    const toastId = toast.loading('Actualizando información del usuario...');

    try {
      let finalPhotoUrl = photoPreview;

      // 1. Subir nueva foto si fue cambiada
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

      // 2. Construir payload con DTO UpdateUserDTO
      const updatePayload: IUpdateUser = {
        id: foundUser.id,
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

      // Actualizar el estado local del usuario
      setFoundUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          ...updatePayload,
          photoUrl: finalPhotoUrl,
        } as IUser;
      });

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
   * Maneja el retroceso comprobando si existen cambios sin guardar.
   */
  const handleBack = () => {
    if (isDirty || photoFile) {
      setShowDiscardModal(true);
    } else {
      navigate(APP_ROUTES.admin.root);
    }
  };

  return (
    <div className="min-h-full bg-slate-50/60 pb-28">
      {/* TopBar Header */}
      <div 
        className="bg-primary text-primary-foreground p-4 sticky -top-1 z-30 shadow-md flex items-center justify-between"
        style={{
          boxShadow: '0 -6px 0 0 var(--color-primary), 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        }}
      >
        <button
          type="button"
          onClick={handleBack}
          className="p-1 hover:bg-white/10 rounded-full transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft size={22} />
          <span className="font-bold text-base">Modificar Usuario</span>
        </button>
        <div className="w-6" /> {/* Spacer */}
      </div>

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

        {/* Card de Búsqueda por Documento */}
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

        {/* Estado no encontrado */}
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

        {/* Formulario de Edición */}
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
                  watchedGender === UserGender.FEMALE ? 'bg-pink-50 text-pink-500' : 'bg-blue-50 text-blue-500'
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

            {/* Card: Datos Personales */}
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

              {/* Género */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  Género
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setValue('gender', UserGender.MALE, { shouldDirty: true })}
                    className={clsx(
                      'flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all',
                      watchedGender === UserGender.MALE
                        ? 'border-blue-500 bg-blue-50/80 text-blue-700 shadow-xs'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    Masculino
                  </button>

                  <button
                    type="button"
                    onClick={() => setValue('gender', UserGender.FEMALE, { shouldDirty: true })}
                    className={clsx(
                      'flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all',
                      watchedGender === UserGender.FEMALE
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

              {/* Teléfono */}
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

      {/* Modal de Descarte de Cambios al Salir */}
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
