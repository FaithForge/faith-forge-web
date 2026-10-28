import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, AlertTriangle, Trash2 } from 'lucide-react';
import { FaChild, FaChildDress } from 'react-icons/fa6';
import clsx from 'clsx';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import {
  useGetKidQuery,
  useUpdateKidMutation,
  useGetKidGroupsQuery,
  useGetKidMedicalConditionsQuery,
  useGetKidPresignedUploadUrlMutation,
  useUploadKidPhotoFallbackMutation,
} from '@/libs/state/redux/api/kidChurchApi';
import { userGenderSelect, healthSecurityEntitySelect, idKidTypeSelect, UserIdType, IUpdateKid } from '@/libs/models';
import { useKidsTerm } from '@/libs/hooks/useTerm';
import { 
  KID_AGE_COPY, 
  isKidUnderMinAge 
} from '@/libs/common-types/constants';
import { resizeAndCropImageToSquare } from '@/libs/utils/image/index';
import { capitalizeWords } from '@/libs/utils/text';
import { toDateOnlyInputValue } from '@/libs/utils/date';
import { validateTwoLastNames } from '@/libs/utils/validator';
import PageHeader from '@/components/ui/PageHeader';
import { UpdateKidSkeleton } from '@/components/ui/DetailSkeleton';
import { APP_ROUTES } from '@/config/routes';
import { isFeatureEnabled } from '@/config/features';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import SelectSearch from '@/components/ui/SelectSearch';
import Textarea from '@/components/ui/Textarea';
import DatePickerWheel from '@/components/ui/DatePickerWheel';
import { useTranslation } from 'react-i18next';

const UpdateKidView: React.FC = () => {
  const { t } = useTranslation(['kidRegistration', 'common']);
  const guardianTerm = useKidsTerm('guardian');
  const isKidRegisterEnabled = isFeatureEnabled('kidRegister');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: kid, isLoading: kidLoading } = useGetKidQuery({ id: id || '' }, { skip: !id });
  const [updateKid] = useUpdateKidMutation();
  const [getKidPresignedUploadUrl] = useGetKidPresignedUploadUrlMutation();
  const [uploadKidPhotoFallback] = useUploadKidPhotoFallbackMutation();
  const { data: kidGroups = [] } = useGetKidGroupsQuery();
  const { data: medicalConditions = [] } = useGetKidMedicalConditionsQuery();

  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [isPhotoRemoved, setIsPhotoRemoved] = useState<boolean>(false);
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

  // Populate form with kid data
  useEffect(() => {
    if (kid) {
      setValue('firstName', capitalizeWords(kid.firstName || ''));
      setValue('lastName', capitalizeWords(kid.lastName || ''));
      setValue('nationalIdType', kid.nationalIdType || UserIdType.RC);
      setValue('nationalId', kid.nationalId || '');
      if (kid.birthday) {
        setValue('birthday', toDateOnlyInputValue(kid.birthday));
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
        setIsPhotoRemoved(false);
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
        setIsPhotoRemoved(false);
      } catch {
        toast.error('Error al procesar la imagen seleccionada');
      }
    }
  };

  const removePhoto = () => {
    setPhotoPreview('');
    setPhotoBlob(null);
    setIsPhotoRemoved(true);
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
    const dateStr = toDateOnlyInputValue(birthdayDateString);
    const birthDate = dayjs.utc(dateStr);
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
      let uploadedPhotoUrl: string | null | undefined = undefined;

      if (isPhotoRemoved) {
        uploadedPhotoUrl = null;
      } else if (photoBlob) {
        try {
          const fileName = `kid-${id}.jpg`;
          const presigned = await getKidPresignedUploadUrl({
            fileName,
            contentType: 'image/jpeg',
            kidId: id,
          }).unwrap();

          let uploadSucceeded = false;
          try {
            const directResponse = await fetch(presigned.uploadUrl, {
              method: 'PUT',
              headers: {
                'Content-Type': 'image/jpeg',
              },
              body: photoBlob,
            });
            if (directResponse.ok) {
              uploadedPhotoUrl = presigned.publicUrl;
              uploadSucceeded = true;
            }
          } catch (directUploadErr) {
            console.warn('Direct S3 upload failed, using multipart fallback:', directUploadErr);
          }

          if (!uploadSucceeded) {
            const formData = new FormData();
            formData.append('file', photoBlob, fileName);
            formData.append('kidId', id);
            const fallbackRes = await uploadKidPhotoFallback(formData).unwrap();
            uploadedPhotoUrl = fallbackRes.photoUrl;
          }
        } catch {
          toast.error(t('kidRegistration:form.error_uploading_photo', 'Error al subir la nueva imagen'));
          setIsSubmitting(false);
          return;
        }
      }

      const trimmedNationalId = isKidRegisterEnabled ? values.nationalId?.trim() || undefined : kid?.nationalId;
      const updatePayload: IUpdateKid = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        nationalId: trimmedNationalId,
        nationalIdType: isKidRegisterEnabled
          ? (trimmedNationalId ? (values.nationalIdType as UserIdType) : undefined)
          : (kid?.nationalIdType as UserIdType | undefined),
        birthday: values.birthday,
        gender: values.gender,
        staticGroup,
        staticKidGroupId: staticGroup ? values.kidGroup : undefined,
        observations: values.observations !== undefined && values.observations !== null ? values.observations.trim() : '',
        healthSecurityEntity: values.healthSecurityEntity || undefined,
        medicalConditionId: values.medicalCondition || undefined,
        ...(uploadedPhotoUrl !== undefined ? { photoUrl: uploadedPhotoUrl } : {}),
      };

      await updateKid({
        id,
        data: updatePayload,
      }).unwrap();

      toast.success(t('kidRegistration:form.success_kid_updated'));
      navigate(APP_ROUTES.kidRegistration.checkIn(id), { replace: true });
    } catch (error: unknown) {
      const err = error as { data?: { message?: string }; message?: string };
      toast.error(err?.data?.message || err?.message || t('common:states.error_occurred'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const kidIdTypeOptions = useMemo(
    () =>
      idKidTypeSelect.map((opt) => ({
        id: opt.value,
        name: opt.label,
      })),
    [],
  );

  const kidGroupOptions = useMemo(() => {
    return kidGroups.map((g) => ({
      id: g.id,
      name: g.name,
    }));
  }, [kidGroups]);

  const medicalConditionOptions = [
    { id: '', name: 'Ninguna' },
    ...medicalConditions.map((m) => ({
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
    <div className="min-h-full bg-gray-50 flex flex-col flex-1 pb-6 sm:pb-8">
      <PageHeader
        title={t('kidRegistration:form.update_kid_title')}
        onBack={() => navigate(APP_ROUTES.kidRegistration.checkIn(id || ''))}
      />

      {kidLoading && !kid ? (
        <UpdateKidSkeleton />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 pb-16 flex flex-col gap-4 max-w-lg mx-auto w-full">
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
            {photoPreview && (
              <button
                type="button"
                onClick={removePhoto}
                className="mt-2 text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                {t('kidRegistration:form.remove_photo', 'Eliminar foto')}
              </button>
            )}
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

            {isKidRegisterEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Controller
                  name="nationalIdType"
                  control={control}
                  render={({ field }) => (
                    <SelectSearch
                      label={t('kidRegistration:form.identification_type_label')}
                      options={kidIdTypeOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t('kidRegistration:form.identification_type_placeholder')}
                    />
                  )}
                />

                <Input
                  label={t('kidRegistration:form.identification_number_label')}
                  placeholder={t('kidRegistration:form.identification_number_placeholder')}
                  badge={
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-gray-100 text-gray-600 rounded-full border border-gray-200">
                      {t('kidRegistration:form.optional_badge')}
                    </span>
                  }
                  helperText={t('kidRegistration:form.identification_optional_hint', {
                    guardian: guardianTerm.toLowerCase(),
                  })}
                  {...register('nationalId')}
                />
              </div>
            )}

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
            <Textarea
              label="Observaciones Generales"
              {...register('observations')}
              rows={3}
              maxLength={300}
              placeholder="Si tiene alguna otra observación médica, alimentaria o a la que debamos prestar atención, anótala aquí..."
            />
          </div>

          <Button
            type="submit"
            block
            variant="primary"
            className="mb-3"
            disabled={isUnderThreeMonths}
            loading={isSubmitting}
            loadingText={t('common:states.saving')}
          >
            {t('kidRegistration:form.btn_save_changes')}
          </Button>
          {/* Espaciador para evitar que el BottomNav flotante tape el botón */}
          <div className="h-24 sm:h-28 pointer-events-none shrink-0" aria-hidden="true" />
        </form>
      )}
    </div>
  );
};

export default UpdateKidView;
