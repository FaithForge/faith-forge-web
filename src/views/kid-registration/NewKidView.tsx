import React, { useState, useEffect, useMemo } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import PhoneInput from '@/components/ui/PhoneInput';
import { APP_ROUTES } from "@/config/routes";
import { Camera, ChevronRight, Check, ArrowLeft, QrCode, Pencil, Trash2, Search, UserCheck, AlertTriangle, X } from 'lucide-react';
import { FaChild, FaChildDress } from 'react-icons/fa6';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import SelectSearch from '@/components/ui/SelectSearch';
import DatePickerWheel from '@/components/ui/DatePickerWheel';
import ConfirmModal from '@/components/ui/ConfirmModal';
import PageHeader from '@/components/ui/PageHeader';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';

import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetKidGroups } from '@/libs/state/redux/thunks/kid-church/kid-group.thunk';
import { GetKidMedicalConditions } from '@/libs/state/redux/thunks/kid-church/kid-medical-condition.thunk';
import { GetKidGuardian, CreateKidGuardian } from '@/libs/state/redux/thunks/kid-church/kid-guardian.thunk';
import { CreateKid } from '@/libs/state/redux/thunks/kid-church/kid.thunk';
import { UploadUserImage } from '@/libs/state/redux/thunks/user/user.thunk';
import { cleanCurrentKidGuardian } from '@/libs/state/redux/slices/kid-church/kid-guardian.slice';
import { useNavigationGuard } from '@/libs/context/NavigationGuardContext';
import { useBackSwipeGuard } from '@/libs/hooks/useBackSwipeGuard';

import { healthSecurityEntitySelect, IdType, UserIdType } from '@/libs/models/User';
import { ID_TYPE_CODE_MAPPER, kidRelationSelect } from '@/libs/models';
import { KidGroupType } from '@/libs/models/KidChurch';
import { 
  KID_MIN_AGE_MONTHS, 
  KID_MAX_AGE_YEARS, 
  KID_AGE_COPY, 
  isKidUnderMinAge 
} from '@/libs/common-types/constants';
import { resizeAndCropImageToSquare } from '@/libs/utils/image/index';
import { capitalizeWords } from '@/libs/utils/text';
import { validateTwoLastNames } from '@/libs/utils/validator';

import { useChurchMeetingStatus } from '@/libs/hooks/useChurchMeetingStatus';
import Alert from '@/components/ui/Alert';
import StepProgress from '@/components/ui/StepProgress';

const NEW_KID_STEPS = ['Datos del Niño', 'Acudiente Responsable'];

const NewKidView = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { registerGuard } = useNavigationGuard();
  const { shouldBlockKids, meetingErrorMsg } = useChurchMeetingStatus();

  const [step, setStep] = useState(1);
  const [staticGroup, setStaticGroup] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Refs to access current values from navigation guard without re-subscribing
  const stepRef = React.useRef(step);
  const isUploadingRef = React.useRef(isUploading);
  stepRef.current = step;
  isUploadingRef.current = isUploading;

  const kidGroupSlice = useAppSelector((state) => state.kidGroupSlice);
  const kidMedicalConditionSlice = useAppSelector((state) => state.kidMedicalConditionSlice);
  const kidGuardianSlice = useAppSelector((state) => state.kidGuardianSlice);
  const kidSlice = useAppSelector((state) => state.kidSlice);

  const { register: registerKid, handleSubmit: handleKidSubmit, control: kidControl, watch: watchKid, resetField: resetKidField, setValue: setKidValue, formState: { errors: kidErrors } } = useForm();
  const { register: registerGuardian, handleSubmit: handleGuardianSubmit, control: guardianControl, watch: watchGuardian, setValue: setGuardianValue, getValues: getGuardianValues, formState: { errors: guardianErrors } } = useForm({
    defaultValues: {
      nationalIdType: UserIdType.CC,
      nationalId: '',
      firstName: '',
      lastName: '',
      dialCodePhone: '+57',
      phone: '',
      gender: '',
      relation: '',
    }
  });

  // Register navigation guard on mount: blocks BottomNav navigation when unsaved data exists
  useEffect(() => {
    const unregister = registerGuard((to) => {
      if (!isUploadingRef.current && stepRef.current <= 2) {
        setShowCancelModal(true);
        return false;
      }
      return true;
    });
    return unregister;
  }, [registerGuard]);

  // Intercept mobile back swipe / popstate when form is in progress
  const isBackGuardActive = !isUploading && step <= 2;
  const { allowNavigation } = useBackSwipeGuard({
    enabled: isBackGuardActive,
    onBlockBack: () => setShowCancelModal(true),
  });

  useEffect(() => {
    dispatch(GetKidGroups({}));
    dispatch(GetKidMedicalConditions());
    dispatch(cleanCurrentKidGuardian());
    return () => { dispatch(cleanCurrentKidGuardian()); };
  }, [dispatch]);

  // Automatically scroll to top of page and <main> container on step change
  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      mainEl.scrollTop = 0;
    }
  };

  useEffect(() => {
    if (step > 1) {
      scrollToTop();
      const timer = setTimeout(scrollToTop, 50);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Auto-fill guardian details if already existing in database
  useEffect(() => {
    if (kidGuardianSlice.current && step === 2) {
      setGuardianValue('nationalIdType', kidGuardianSlice.current.nationalIdType);
      setGuardianValue('nationalId', kidGuardianSlice.current.nationalId);
      setGuardianValue('firstName', kidGuardianSlice.current.firstName);
      setGuardianValue('lastName', kidGuardianSlice.current.lastName);
      setGuardianValue('phone', kidGuardianSlice.current.phone);
      setGuardianValue('gender', kidGuardianSlice.current.gender);
      setGuardianValue('relation', kidGuardianSlice.current.relation);
    }
  }, [kidGuardianSlice.current, setGuardianValue, step]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const resizedBlob = await resizeAndCropImageToSquare(file);
        const resizedFile = new File([resizedBlob], file.name, { type: file.type });
        setPhotoFile(resizedFile);
        setPhotoUrl(URL.createObjectURL(resizedBlob));
      } catch (error) {
        toast.error("Error al procesar la imagen");
      }
    }
  };

  const removePhoto = () => {
    setPhotoUrl('');
    setPhotoFile(null);
  };

  const handleCancelClick = () => setShowCancelModal(true);

  /** Confirms discarding changes and navigates back to dashboard. */
  const handleConfirmCancel = () => {
    allowNavigation();
    setShowCancelModal(false);
    navigate(APP_ROUTES.kidRegistration.root, { replace: true });
  };

  /** Closes cancel modal and continues filling the form. */
  const handleCloseModal = (open: boolean) => {
    setShowCancelModal(open);
  };

  const onKidSubmit = async (values: any) => {
    if (shouldBlockKids) {
      toast.error(meetingErrorMsg || 'El servicio actual está fuera del horario de registro.');
      navigate(APP_ROUTES.kidRegistration.root);
      return;
    }

    if (isUnderThreeMonths) {
      toast.error(KID_AGE_COPY.minAgeToastError);
      return;
    }

    setIsUploading(true);
    let uploadedPhotoUrl = '';

    try {
      if (photoFile) {
        const formData = new FormData();
        formData.append('file', photoFile);
        const resultAction = await dispatch(UploadUserImage({ formData }));
        if (UploadUserImage.fulfilled.match(resultAction)) {
          uploadedPhotoUrl = resultAction.payload as string;
        } else {
          toast.error("Error al subir la imagen");
          setIsUploading(false);
          return;
        }
      }

      const kidPayload = {
        firstName: values.firstName,
        lastName: values.lastName,
        birthday: values.birthday,
        gender: values.gender,
        staticGroup: staticGroup,
        staticKidGroupId: staticGroup ? values.kidGroup : undefined,
        observations: values.observations || undefined,
        photoUrl: uploadedPhotoUrl || undefined,
        healthSecurityEntity: values.healthSecurityEntity,
        medicalConditionId: values.medicalConditionId || undefined,
      };

      const resultAction = await dispatch(CreateKid(kidPayload as any));
      
      if (CreateKid.fulfilled.match(resultAction)) {
        if (!resultAction.payload.error) {
           setStep(2);
           scrollToTop();
        } else {
           toast.error(resultAction.payload.error || "Error al guardar el niño");
        }
      } else {
        toast.error("Error al guardar el niño");
      }
    } catch (error) {
       toast.error("Error inesperado al guardar el niño");
    } finally {
       setIsUploading(false);
    }
  };

  const onGuardianSubmit = async (values: any) => {
    if (shouldBlockKids) {
      toast.error(meetingErrorMsg || 'El servicio actual está fuera del horario de registro.');
      navigate(APP_ROUTES.kidRegistration.root);
      return;
    }

    if (!kidSlice.current?.id) {
       toast.error("No se encontró el ID del niño.");
       return;
    }
    
    setIsUploading(true);
    try {
       const guardianPayload = {
         kidId: kidSlice.current.id,
         nationalIdType: values.nationalIdType,
         nationalId: values.nationalId?.trim(),
         firstName: values.firstName?.trim(),
         lastName: values.lastName?.trim(),
         dialCodePhone: values.dialCodePhone || '+57',
         phone: values.phone?.trim(),
         gender: values.gender,
         relation: values.relation,
       };
       
       const resultAction = await dispatch(CreateKidGuardian(guardianPayload as any));
       if (CreateKidGuardian.fulfilled.match(resultAction)) {
          if (!resultAction.payload.error) {
             toast.success("¡Niño y Acudiente guardados!");
             window.scrollTo({ top: 0, behavior: 'smooth' });
             // Ir a check-in
             navigate(APP_ROUTES.kidRegistration.checkIn(kidSlice.current.id), { replace: true });
          } else {
             toast.error(resultAction.payload.error || "Error al guardar el acudiente");
          }
       } else {
          toast.error("Error al guardar el acudiente");
       }
    } catch(e) {
       toast.error("Error inesperado");
    } finally {
       setIsUploading(false);
    }
  };

  const birthdayVal = watchKid('birthday');
  const ageData = birthdayVal ? getAge(birthdayVal) : null;

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

  const isUnderThreeMonths = useMemo(() => {
    return isKidUnderMinAge(birthdayVal);
  }, [birthdayVal]);

  const idTypeOptions = [
    { id: UserIdType.CC, name: IdType.CC },
    { id: UserIdType.TI, name: IdType.TI },
    { id: UserIdType.RC, name: IdType.RC },
    { id: UserIdType.CE, name: IdType.CE },
    { id: UserIdType.PS, name: IdType.PS },
  ];

  const watchedGuardianGender = watchGuardian('gender');
  const availableRelations = kidRelationSelect
    .filter((r) => !watchedGuardianGender || r.gender === watchedGuardianGender)
    .map((r) => ({ id: r.value, name: r.label }));

  const [isSearchingGuardian, setIsSearchingGuardian] = useState(false);
  const checkNationalId = async () => {
    const doc = getGuardianValues('nationalId');
    if (doc && doc.trim().length > 0) {
      setIsSearchingGuardian(true);
      try {
        await dispatch(GetKidGuardian(doc.trim()));
      } finally {
        setIsSearchingGuardian(false);
      }
    }
  };

  const staticKidGroups = useMemo(() => {
    return (kidGroupSlice.data || []).filter(
      (g: any) => g.type !== KidGroupType.SPECIAL && !g.name?.toLowerCase().includes('yo soy iglekids')
    );
  }, [kidGroupSlice.data]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Nuevo Registro" onBack={handleCancelClick} />
      <StepProgress currentStep={step} steps={NEW_KID_STEPS} />

      <div className="p-4">
        {step === 1 && (
          <form onSubmit={handleKidSubmit(onKidSubmit)} className="animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Foto de Perfil */}
            <div className="flex flex-col items-center justify-center my-3">
              <label htmlFor="newKidPhoto" className="relative cursor-pointer group block">
                <div className={clsx(
                  "w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg flex items-center justify-center transition-transform group-hover:scale-105 active:scale-95",
                  !photoUrl && (
                    watchKid('gender') === 'F'
                      ? "bg-pink-100 text-pink-500"
                      : watchKid('gender') === 'M'
                        ? "bg-blue-100 text-blue-500"
                        : "bg-gray-100 text-gray-400"
                  )
                )}>
                  {photoUrl ? (
                    <img src={photoUrl} alt="Foto del niño" className="w-full h-full object-cover" />
                  ) : watchKid('gender') === 'F' ? (
                    <FaChildDress size={64} />
                  ) : watchKid('gender') === 'M' ? (
                    <FaChild size={64} />
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
                  id="newKidPhoto"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </label>
              <span className="text-xs text-gray-500 font-medium mt-2.5">
                {photoUrl ? 'Toca la imagen o la cámara para cambiar foto' : 'Toca la imagen o la cámara para agregar foto'}
              </span>
              {photoUrl && (
                <button 
                  type="button" 
                  onClick={removePhoto}
                  className="mt-2 flex items-center gap-1 text-xs text-red-500 font-bold bg-red-50 px-3 py-1 rounded-full hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={13} /> Eliminar foto
                </button>
              )}
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col gap-4">
              <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-2">Información Personal</h3>
              
              <Input 
                label="Nombres" 
                placeholder="Nombres del niño" 
                {...registerKid('firstName', { required: 'El nombre es requerido' })} 
                error={kidErrors.firstName?.message as string} 
                required 
              />
              <Input 
                label="Apellidos" 
                placeholder="Apellidos del niño" 
                {...registerKid('lastName', { 
                  required: 'El apellido es requerido',
                  validate: validateTwoLastNames
                })} 
                error={kidErrors.lastName?.message as string} 
                required 
              />

              <div>
                <Controller
                  name="birthday"
                  control={kidControl}
                  rules={{ 
                    required: 'La fecha es obligatoria',
                    validate: (val) => {
                      if (!val) return 'La fecha es obligatoria';
                      if (isKidUnderMinAge(val)) {
                        return KID_AGE_COPY.minAgeValidationError;
                      }
                      return true;
                    }
                  }}
                  render={({ field }) => (
                    <DatePickerWheel 
                      label="Fecha de Nacimiento"
                      required
                      value={field.value}
                      onChange={(date) => field.onChange(dayjs(date).format('YYYY-MM-DD'))}
                      minDate={dayjs().subtract(KID_MAX_AGE_YEARS, 'year').format('YYYY-MM-DD')}
                      maxDate={dayjs().format('YYYY-MM-DD')}
                    />
                  )}
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
                {kidErrors.birthday && !isUnderThreeMonths && <p className="text-red-500 text-xs font-medium mt-1">{kidErrors.birthday.message as string}</p>}
              </div>

              <Controller
                name="gender"
                control={kidControl}
                rules={{ required: 'Requerido' }}
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
                    error={kidErrors.gender?.message as string}
                    placeholder="Seleccionar género..."
                  />
                )}
              />

              <Controller
                name="healthSecurityEntity"
                control={kidControl}
                rules={{ required: 'Requerido' }}
                render={({ field }) => (
                  <SelectSearch
                    label="EPS"
                    required
                    options={healthSecurityEntitySelect}
                    value={field.value}
                    onChange={field.onChange}
                    error={kidErrors.healthSecurityEntity?.message as string}
                    placeholder="Buscar EPS..."
                    valueKey="name"
                  />
                )}
              />
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col gap-4">
              <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-2">Información Adicional</h3>
              
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
                     if(staticGroup) resetKidField('kidGroup');
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
                <Select label="Salón Estático" {...registerKid('kidGroup', { required: staticGroup ? 'Requerido' : false })} error={kidErrors.kidGroup?.message as string} required>
                  <option value="">Seleccione un salón</option>
                  {staticKidGroups.map((g: any) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </Select>
              )}

              <Controller
                name="medicalConditionId"
                control={kidControl}
                render={({ field }) => (
                  <SelectSearch
                    label="Condición Médica"
                    options={[
                      { id: '', name: 'Ninguna' },
                      ...(kidMedicalConditionSlice.data || [])
                    ]}
                    value={field.value}
                    onChange={field.onChange}
                    valueKey="id"
                    placeholder="Buscar condición..."
                  />
                )}
              />

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Observaciones</label>
                <textarea 
                  {...registerKid('observations')}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className="block w-full rounded-xl border-2 border-gray-200 bg-white text-text-main py-2.5 px-3 focus:border-primary focus:ring-0 transition-colors outline-none text-base shadow-sm"
                  rows={3}
                  maxLength={300}
                  placeholder="Si tiene alguna otra observación médica, alimentaria o a la que debamos prestar atención, anótala aquí..."
                ></textarea>
              </div>
            </div>

            <Button 
              type="submit"
              block
              variant="primary"
              disabled={isUploading || isUnderThreeMonths}
            >
              {isUploading ? 'Guardando...' : <>Guardar Niño y Continuar <ChevronRight size={18} className="ml-2 inline" /></>}
            </Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleGuardianSubmit(onGuardianSubmit)} className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col gap-4">
              <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-2">Información del Acudiente</h3>

              {/* Banner if already exists in database */}
              {kidGuardianSlice.current && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <UserCheck size={18} className="text-emerald-600 shrink-0" />
                    <span>Acudiente encontrado en la base de datos</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      dispatch(cleanCurrentKidGuardian());
                      setGuardianValue('nationalIdType', UserIdType.CC);
                      setGuardianValue('nationalId', '');
                      setGuardianValue('firstName', '');
                      setGuardianValue('lastName', '');
                      setGuardianValue('dialCodePhone', '+57');
                      setGuardianValue('phone', '');
                      setGuardianValue('gender', '');
                      setGuardianValue('relation', '');
                    }}
                    className="text-xs text-emerald-700 underline font-bold"
                  >
                    Limpiar
                  </button>
                </div>
              )}

              {/* Tipo de Documento */}
              <Controller
                name="nationalIdType"
                control={guardianControl}
                rules={{ required: 'Requerido' }}
                render={({ field }) => (
                  <SelectSearch
                    label="Tipo de Documento"
                    required
                    value={field.value}
                    onChange={field.onChange}
                    options={idTypeOptions}
                    disabled={!!kidGuardianSlice.current}
                    placeholder="Seleccionar tipo de documento..."
                  />
                )}
              />

              {/* Documento y Búsqueda */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  Número de Documento <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    {...registerGuardian('nationalId', { required: 'Requerido' })}
                    onBlur={checkNationalId}
                    disabled={!!kidGuardianSlice.current}
                    placeholder="Escribir número de documento..."
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    className="block w-full rounded-xl border-2 border-gray-200 bg-white text-text-main py-2.5 pl-3 pr-16 focus:border-primary focus:ring-0 outline-none text-base shadow-sm transition-colors disabled:bg-gray-100 disabled:text-gray-500"
                  />
                  {watchGuardian('nationalId') && !kidGuardianSlice.current && (
                    <button
                      type="button"
                      onClick={() => {
                        setGuardianValue('nationalId', '');
                        setGuardianValue('firstName', '');
                        setGuardianValue('lastName', '');
                        setGuardianValue('phone', '');
                      }}
                      className="absolute right-9 text-gray-400 hover:text-gray-600 p-1 transition-colors"
                      tabIndex={-1}
                      aria-label="Limpiar documento"
                    >
                      <div className="w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 transition-transform active:scale-90">
                        <X size={12} strokeWidth={2.5} />
                      </div>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={checkNationalId}
                    disabled={isSearchingGuardian || !!kidGuardianSlice.current}
                    className="absolute right-2 text-gray-400 hover:text-primary p-1.5 transition-colors"
                  >
                    <Search size={18} />
                  </button>
                </div>
                {guardianErrors.nationalId && <span className="text-red-500 text-xs font-medium mt-1 inline-block">{guardianErrors.nationalId.message as string}</span>}
              </div>

              {/* Nombre */}
              <Input
                label="Nombre"
                required
                placeholder="Nombres del acudiente"
                disabled={!!kidGuardianSlice.current}
                {...registerGuardian('firstName', { required: 'Requerido' })}
                error={guardianErrors.firstName?.message as string}
              />

              {/* Apellidos */}
              <Input
                label="Apellidos"
                required
                placeholder="Apellidos del acudiente"
                disabled={!!kidGuardianSlice.current}
                {...registerGuardian('lastName', { 
                  required: 'Los apellidos son requeridos',
                  validate: validateTwoLastNames
                })}
                error={guardianErrors.lastName?.message as string}
              />

              {/* Phone */}
              <Controller
                name="phone"
                control={guardianControl}
                rules={{ required: 'Requerido' }}
                render={({ field }) => (
                  <PhoneInput
                    label="Teléfono"
                    required
                    dialCode={watchGuardian('dialCodePhone') || '+57'}
                    phone={field.value}
                    disabled={!!kidGuardianSlice.current}
                    onDialCodeChange={(code) => setGuardianValue('dialCodePhone', code)}
                    onPhoneChange={field.onChange}
                    error={guardianErrors.phone?.message as string}
                  />
                )}
              />

              {/* Gender */}
              <Controller
                name="gender"
                control={guardianControl}
                rules={{ required: 'Requerido' }}
                render={({ field }) => (
                  <SelectSearch
                    label="Género"
                    required
                    value={field.value}
                    disabled={!!kidGuardianSlice.current}
                    onChange={(val) => {
                      field.onChange(val);
                      setGuardianValue('relation', '');
                    }}
                    options={[
                      { id: 'M', name: 'Masculino' },
                      { id: 'F', name: 'Femenino' },
                    ]}
                    placeholder="Seleccionar género..."
                  />
                )}
              />

              {/* Relationship to Child */}
              <Controller
                name="relation"
                control={guardianControl}
                rules={{ required: 'Requerido' }}
                render={({ field }) => (
                  <SelectSearch
                    label="Relación con el Niño"
                    required
                    value={field.value}
                    onChange={field.onChange}
                    options={availableRelations}
                    placeholder="Seleccionar relación..."
                    error={guardianErrors.relation?.message as string}
                  />
                )}
              />
            </div>

            <Button 
              type="submit"
              block
              variant="primary"
              disabled={isUploading}
            >
              {isUploading ? 'Guardando...' : <>Guardar Acudiente <Check size={18} className="ml-2 inline" /></>}
            </Button>
          </form>
        )}
      </div>

      <ConfirmModal
        open={showCancelModal}
        onOpenChange={handleCloseModal}
        title="¿Estás seguro de salir?"
        description="Perderás todos los datos del niño que no hayas guardado."
        confirmText="Sí, salir"
        cancelText="Continuar llenando"
        onConfirm={handleConfirmCancel}
        type="danger"
        disableBackClose={true}
      />
    </div>
  );
};

export default NewKidView;

