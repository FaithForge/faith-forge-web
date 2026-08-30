import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Loader2, AlertTriangle } from 'lucide-react';
import { FaChild, FaChildDress } from 'react-icons/fa6';
import clsx from 'clsx';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetKid, UpdateKid } from '@/libs/state/redux/thunks/kid-church/kid.thunk';
import { GetKidGroups } from '@/libs/state/redux/thunks/kid-church/kid-group.thunk';
import { GetKidMedicalConditions } from '@/libs/state/redux/thunks/kid-church/kid-medical-condition.thunk';
import { UploadUserImage } from '@/libs/state/redux/thunks/user/user.thunk';
import { ID_TYPE_CODE_MAPPER, userGenderSelect, healthSecurityEntitySelect } from '@/libs/models';
import { KidGroupType } from '@/libs/models/KidChurch';
import { UserIdType } from '@/libs/models/User';
import { 
  KID_MIN_AGE_MONTHS, 
  KID_MAX_AGE_YEARS, 
  KID_AGE_COPY, 
  isKidUnderMinAge 
} from '@/libs/common-types/constants';
import { resizeAndCropImageToSquare } from '@/libs/utils/image/index';
import { capitalizeWords } from '@/libs/utils/text';
import { validateTwoLastNames } from '@/libs/utils/validator';
import PageHeader from '@/components/ui/PageHeader';
import { UpdateKidSkeleton } from '@/components/ui/DetailSkeleton';
import { APP_ROUTES } from '@/config/routes';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import SelectSearch from '@/components/ui/SelectSearch';
import DatePickerWheel from '@/components/ui/DatePickerWheel';

const UpdateKidView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { current: kid, loading: kidLoading } = useAppSelector((state) => state.kidSlice);
  const kidGroupSlice = useAppSelector((state) => state.kidGroupSlice);
  const kidMedicalConditionSlice = useAppSelector((state) => state.kidMedicalConditionSlice);

  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [staticGroup, setStaticGroup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm();

  // Load groups, medical conditions, and kid info
  useEffect(() => {
    dispatch(GetKidGroups({}));
    dispatch(GetKidMedicalConditions());
    if (id) {
      dispatch(GetKid({ id }));
    }
  }, [id, dispatch]);

  // Populate form with kid data
  useEffect(() => {
    if (kid) {
      setValue('firstName', capitalizeWords(kid.firstName || ''));
      setValue('lastName', capitalizeWords(kid.lastName || ''));
      if (kid.birthday) {
        setValue('birthday', dayjs(kid.birthday).format('YYYY-MM-DD'));
      }
      setValue('gender', kid.gender || 'M');
      setValue('healthSecurityEntity', kid.healthSecurityEntity || '');
      setValue('medicalCondition', kid.medicalCondition?.id || '');
      setValue('staticGroup', !!kid.staticGroup);
      setStaticGroup(!!kid.staticGroup);
      setValue('kidGroup', kid.kidGroup?.id || '');
      setValue('observations', kid.observations || '');
      if (kid.photoUrl) {
        setPhotoPreview(kid.photoUrl);
      }
    }
  }, [kid, setValue]);

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const resized = await resizeAndCropImageToSquare(file, 500, 500 * 1024);
        setPhotoBlob(resized);
        setPhotoPreview(URL.createObjectURL(resized));
      } catch {
        toast.error('Error al procesar la imagen seleccionada');
      }
    }
  };

  const birthdayValue = watch('birthday');

  /**
   * Calculates detailed age components (years, months, days) from a birthday string.
   *
   * @param {string} birthdayDateString - ISO date string of birth.
   * @returns {{ years: number; totalMonths: number; months: number; days: number } | null} Age breakdown or null if invalid.
   */
  function getAge(birthdayDateString: string) {
    if (!birthdayDateString) return null;
    const birthDate = dayjs(birthdayDateString);
    const now = dayjs();
    const years = now.diff(birthDate, 'year');
    const totalMonths = now.diff(birthDate, 'month');
    const months = totalMonths % 12;
    const days = now.diff(birthDate, 'day');
    return { years, totalMonths, months, days };
  }

  const ageData = birthdayValue ? getAge(birthdayValue) : null;

  const isUnderThreeMonths = useMemo(() => {
    return isKidUnderMinAge(birthdayValue);
  }, [birthdayValue]);

  const onSubmit = async (values: any) => {
    if (!id) return;

    if (isUnderThreeMonths) {
      toast.error(KID_AGE_COPY.minAgeToastError);
      return;
    }

    setIsSubmitting(true);
    try {
      let uploadedPhotoUrl: string | undefined = undefined;

      // Upload new photo ONLY if the user selected a new one
      if (photoBlob) {
        const formData = new FormData();
        formData.append('file', photoBlob);
        const uploadAction = await dispatch(UploadUserImage({ formData }));
        if (UploadUserImage.fulfilled.match(uploadAction)) {
          uploadedPhotoUrl = uploadAction.payload as string;
        } else {
          toast.error('Error al subir la nueva imagen');
          setIsSubmitting(false);
          return;
        }
      }

      const updatePayload: any = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        birthday: values.birthday,
        gender: values.gender,
        staticGroup,
        staticKidGroupId: staticGroup ? values.kidGroup : undefined,
        observations: values.observations || undefined,
        healthSecurityEntity: values.healthSecurityEntity || undefined,
        medicalConditionId: values.medicalCondition || undefined,
      };

      if (uploadedPhotoUrl) {
        updatePayload.photoUrl = uploadedPhotoUrl;
      }

      const result = await dispatch(
        UpdateKid({
          id,
          updateKid: updatePayload,
        })
      );

      if (UpdateKid.fulfilled.match(result)) {
        toast.success('¡Datos del niño actualizados!');
        await dispatch(GetKid({ id }));
        navigate(APP_ROUTES.kidRegistration.checkIn(id), { replace: true });
      } else {
        toast.error('Error al actualizar los datos del niño');
      }
    } catch {
      toast.error('Error inesperado al actualizar el niño');
    } finally {
      setIsSubmitting(false);
    }
  };

  const kidGroupOptions = useMemo(() => {
    return (kidGroupSlice.data || [])
      .filter((g: any) => g.type !== KidGroupType.SPECIAL && !g.name?.toLowerCase().includes('yo soy iglekids'))
      .map((g: any) => ({
        id: g.id,
        name: g.name,
      }));
  }, [kidGroupSlice.data]);

  const medicalConditionOptions = [
    { id: '', name: 'Ninguna' },
    ...(kidMedicalConditionSlice.data || []).map((m: any) => ({
      id: m.id,
      name: m.name,
    })),
  ];

  const epsOptions = healthSecurityEntitySelect;

  const genderOptions = userGenderSelect.map((g) => ({
    id: g.value,
    name: g.label,
  }));

  return (
    <div className="min-h-full bg-gray-50 flex flex-col flex-1 pb-28 sm:pb-32">
      <PageHeader
        title="Actualizar Datos del Niño"
        onBack={() => navigate(APP_ROUTES.kidRegistration.checkIn(id || ''))}
      />

      {kidLoading && !kid ? (
        <UpdateKidSkeleton />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 pb-16 flex flex-col gap-4 max-w-lg mx-auto">
          {/* Foto de Perfil */}
          <div className="flex flex-col items-center justify-center my-3">
            <label htmlFor="profilePhoto" className="relative cursor-pointer group block">
              <div className={clsx(
                "w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg flex items-center justify-center transition-transform group-hover:scale-105 active:scale-95",
                !photoPreview && (
                  watch('gender') === 'F'
                    ? "bg-pink-100 text-pink-500"
                    : "bg-blue-100 text-blue-500"
                )
              )}>
                {photoPreview ? (
                  <img src={photoPreview} alt="Perfil" className="w-full h-full object-cover" />
                ) : watch('gender') === 'F' ? (
                  <FaChildDress size={64} />
                ) : (
                  <FaChild size={64} />
                )}
              </div>
              <div
                className="absolute bottom-0 right-0 bg-primary text-white p-2.5 rounded-full shadow-lg hover:bg-primary/90 transition-transform group-hover:scale-110 active:scale-95 border-2 border-white"
              >
                <Camera size={19} />
              </div>
              <input
                id="profilePhoto"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoCapture}
              />
            </label>
            <span className="text-xs text-gray-500 font-medium mt-2.5">
              Toca la imagen o la cámara para cambiar la foto
            </span>
          </div>

          {/* Formulario de Datos */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
            <Input
              label="Nombre"
              required
              placeholder="Ej: Samuel David"
              error={errors.firstName?.message as string}
              {...register('firstName', { required: 'El nombre es obligatorio' })}
            />

            <Input
              label="Apellidos"
              required
              placeholder="Ej: Peña Merlano"
              error={errors.lastName?.message as string}
              {...register('lastName', { 
                required: 'Los apellidos son obligatorios',
                validate: validateTwoLastNames
              })}
            />

            {/* Date of Birth (Up to 13 years old for edition) */}
            <div className="mb-2">
              <DatePickerWheel
                label="Fecha de Nacimiento"
                required
                value={birthdayValue}
                minDate={dayjs().subtract(13, 'year').startOf('year').format('YYYY-MM-DD')}
                maxDate={dayjs().format('YYYY-MM-DD')}
                onChange={(dateStr) => setValue('birthday', dateStr)}
              />
              {ageData && !isUnderThreeMonths && (
                <p className="text-xs text-primary font-bold mt-2 bg-primary/10 inline-block px-2 py-1 rounded-md">
                  (Tiene: {ageData.years} años y {ageData.months} meses)
                </p>
              )}
              {isUnderThreeMonths && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded-xl flex items-start gap-2.5 text-xs leading-relaxed mt-2 animate-in fade-in">
                  <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-red-900 text-xs mb-0.5">{KID_AGE_COPY.minAgeTitle}</span>
                    {KID_AGE_COPY.minAgeAlertMessage(ageData ? `${ageData.months} meses / ${ageData.days} días` : undefined)}
                  </div>
                </div>
              )}
            </div>

            {/* Gender */}
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <SelectSearch
                  label="Género"
                  required
                  value={field.value}
                  onChange={field.onChange}
                  options={genderOptions}
                  placeholder="Seleccionar género..."
                />
              )}
            />

            {/* EPS */}
            <Controller
              name="healthSecurityEntity"
              control={control}
              rules={{ required: 'La EPS es obligatoria' }}
              render={({ field }) => (
                <SelectSearch
                  label="EPS / Entidad de Salud"
                  required
                  value={field.value}
                  onChange={field.onChange}
                  options={epsOptions}
                  error={errors.healthSecurityEntity?.message as string}
                  placeholder="Seleccionar EPS..."
                />
              )}
            />

            {/* Condición Médica */}
            <Controller
              name="medicalCondition"
              control={control}
              render={({ field }) => (
                <SelectSearch
                  label="Condición Médica"
                  value={field.value}
                  onChange={field.onChange}
                  options={medicalConditionOptions}
                  placeholder="Ninguna / Seleccionar..."
                />
              )}
            />

            {/* Grupo Estático Switch */}
            <div className="flex items-center justify-between py-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Salón / Grupo Estático
                </label>
                <span className="block text-xs text-gray-500 font-normal mt-0.5">
                  Forzar grupo fijo independientemente de la edad
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStaticGroup(!staticGroup);
                  if (staticGroup) setValue('kidGroup', '');
                }}
                className={clsx(
                  "relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 shrink-0 ml-4",
                  staticGroup ? "bg-primary" : "bg-gray-200"
                )}
              >
                <span
                  className={clsx(
                    "inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm",
                    staticGroup ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>

            {staticGroup && (
              <Controller
                name="kidGroup"
                control={control}
                render={({ field }) => (
                  <SelectSearch
                    label="Salón Asignado Fijo"
                    value={field.value}
                    onChange={field.onChange}
                    options={kidGroupOptions}
                    placeholder="Seleccionar salón..."
                  />
                )}
              />
            )}

            {/* Observaciones */}
            <div className="mb-1">
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                Observaciones Generales
              </label>
              <textarea
                {...register('observations')}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                className="block w-full rounded-xl border-2 border-gray-200 bg-white text-text-main py-2.5 px-3 focus:border-primary outline-none text-base shadow-sm"
                rows={3}
                maxLength={300}
                placeholder="Si tiene alguna otra observación médica, alimentaria o a la que debamos prestar atención, anótala aquí..."
              />
            </div>
          </div>

          <Button
            type="submit"
            block
            variant="primary"
            className="mb-8"
            disabled={isUnderThreeMonths}
            loading={isSubmitting}
            loadingText="Guardando cambios..."
          >
            Guardar Cambios
          </Button>
        </form>
      )}
    </div>
  );
};

export default UpdateKidView;
