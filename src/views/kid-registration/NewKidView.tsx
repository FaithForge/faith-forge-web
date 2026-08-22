import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { APP_ROUTES } from "@/config/routes";
import { Camera, ChevronRight, Check, ArrowLeft, QrCode, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import DatePickerWheel from '@/components/ui/DatePickerWheel';
import ConfirmModal from '@/components/ui/ConfirmModal';
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

import { healthSecurityEntitySelect } from '@/libs/models/User';
import { ID_TYPE_CODE_MAPPER } from '@/libs/models';
import { resizeAndCropImageToSquare } from '@/libs/utils/image/index';

const StepProgress = ({ currentStep }: { currentStep: number }) => {
  return (
    <div className="bg-white px-4 py-4 border-b border-gray-100 sticky top-0 z-20 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          {currentStep === 1 ? 'Paso 1: Niño' : currentStep === 2 ? 'Paso 2: Acudiente' : 'Finalizado'}
        </span>
        <span className="text-xs font-medium text-gray-400">{currentStep} / 3</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${(currentStep / 3) * 100}%` }}
        />
      </div>
    </div>
  );
};

const NewKidView = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const [step, setStep] = useState(1);
  const [staticGroup, setStaticGroup] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<'back' | 'cancel' | null>(null);

  const kidGroupSlice = useAppSelector((state) => state.kidGroupSlice);
  const kidMedicalConditionSlice = useAppSelector((state) => state.kidMedicalConditionSlice);
  const kidGuardianSlice = useAppSelector((state) => state.kidGuardianSlice);
  const kidSlice = useAppSelector((state) => state.kidSlice);

  const { register: registerKid, handleSubmit: handleKidSubmit, control: kidControl, watch: watchKid, resetField: resetKidField, setValue: setKidValue, formState: { errors: kidErrors } } = useForm();
  const { register: registerGuardian, handleSubmit: handleGuardianSubmit, control: guardianControl, watch: watchGuardian, setValue: setGuardianValue, getValues: getGuardianValues, formState: { errors: guardianErrors } } = useForm();

  useEffect(() => {
    dispatch(GetKidGroups({}));
    dispatch(GetKidMedicalConditions());
    dispatch(cleanCurrentKidGuardian());
    
    return () => {
      dispatch(cleanCurrentKidGuardian());
    };
  }, [dispatch]);

  // Interceptar el botón "Atrás" del celular
  useEffect(() => {
    if (step === 1) {
      window.history.pushState(null, '', window.location.href);
      const handlePopState = () => {
        setPendingNavigation('back');
        setShowCancelModal(true);
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [step]);

  // Efecto cuando se encuentra un acudiente
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

  const handleCancelClick = () => {
    setPendingNavigation('cancel');
    setShowCancelModal(true);
  };

  const handleConfirmCancel = () => {
    setShowCancelModal(false);
    navigate(APP_ROUTES.kidRegistration.root);
  };

  const handleCloseModal = (open: boolean) => {
    setShowCancelModal(open);
    if (!open && pendingNavigation === 'back') {
      window.history.pushState(null, '', window.location.href);
    }
    setPendingNavigation(null);
  };

  const onKidSubmit = async (values: any) => {
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
           window.scrollTo({ top: 0, behavior: 'smooth' });
           setStep(2);
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

  const checkNationalId = () => {
    const doc = getGuardianValues('nationalId');
    if (doc && doc.trim().length > 0) {
      dispatch(GetKidGuardian(doc));
    }
  };

  const onGuardianSubmit = async (values: any) => {
    if (!kidSlice.current?.id) {
       toast.error("No se encontró el ID del niño.");
       return;
    }
    
    setIsUploading(true);
    try {
       const guardianPayload = {
         kidId: kidSlice.current.id,
         nationalIdType: values.nationalIdType,
         nationalId: values.nationalId,
         firstName: values.firstName,
         lastName: values.lastName,
         dialCodePhone: "+57", // Harcoded as in old? We should use prefix if available
         phone: values.phone,
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

  const ageData = watchKid('birthday') ? getAge(watchKid('birthday')) : null;

  function getAge(birthdayDateString: string) {
    if (!birthdayDateString) return null;
    const birthDate = dayjs(birthdayDateString);
    const now = dayjs();
    const years = now.diff(birthDate, 'year');
    const months = now.diff(birthDate, 'month') % 12;
    return { years, months };
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* TopBar */}
      <div className="bg-primary text-primary-foreground p-4 flex items-center shadow-md sticky top-0 z-30">
        <button onClick={handleCancelClick} className="flex items-center gap-1 opacity-90 hover:opacity-100">
          <ArrowLeft size={20} />
          <span className="font-medium">Nuevo Registro</span>
        </button>
      </div>

      <StepProgress currentStep={step} />

      <div className="p-4">
        {step === 1 && (
          <form onSubmit={handleKidSubmit(onKidSubmit)} className="animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Foto del Niño */}
            <div className="flex flex-col items-center mb-6 mt-2 relative">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-primary shadow-sm relative group cursor-pointer">
                {photoUrl ? (
                  <>
                    <img src={photoUrl} alt="Foto del niño" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Pencil size={24} className="text-white" />
                    </div>
                  </>
                ) : (
                  <Camera size={32} className="text-gray-300" />
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  capture="environment"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handlePhotoChange}
                />
              </div>
              
              {photoUrl && (
                <button 
                  type="button" 
                  onClick={removePhoto}
                  className="mt-3 flex items-center gap-1 text-xs text-red-500 font-bold bg-red-50 px-3 py-1.5 rounded-full hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={14} /> Eliminar foto
                </button>
              )}
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
              <h3 className="font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Información Personal</h3>
              
              <Input 
                label="Nombres" 
                placeholder="Nombres del niño" 
                {...registerKid('firstName', { required: 'Requerido' })} 
                error={kidErrors.firstName?.message as string} 
                required 
              />
              <Input 
                label="Apellidos" 
                placeholder="Apellidos del niño" 
                {...registerKid('lastName', { required: 'Requerido' })} 
                error={kidErrors.lastName?.message as string} 
                required 
              />

              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  Fecha de Nacimiento <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="birthday"
                  control={kidControl}
                  rules={{ required: 'La fecha es obligatoria' }}
                  render={({ field }) => (
                    <DatePickerWheel 
                      label="Fecha de Nacimiento"
                      value={field.value}
                      onChange={(date) => field.onChange(dayjs(date).format('YYYY-MM-DD'))}
                      maxDate={dayjs().format('YYYY-MM-DD')} // No permitir fechas futuras
                    />
                  )}
                />
                {kidErrors.birthday && <p className="text-red-500 text-xs font-medium mt-1">{kidErrors.birthday.message as string}</p>}
                
                {ageData && (
                   <p className="text-xs text-primary font-bold mt-2 bg-primary/10 inline-block px-2 py-1 rounded-md">
                     (Tiene: {ageData.years} años y {ageData.months} meses)
                   </p>
                )}
              </div>

              <Select label="Género" {...registerKid('gender', { required: 'Requerido' })} error={kidErrors.gender?.message as string} required>
                <option value="">Seleccione</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </Select>

              <Select label="EPS" {...registerKid('healthSecurityEntity', { required: 'Requerido' })} error={kidErrors.healthSecurityEntity?.message as string} required>
                <option value="">Seleccione EPS</option>
                {healthSecurityEntitySelect.map(eps => (
                  <option key={eps.id} value={eps.name}>{eps.name}</option>
                ))}
              </Select>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
              <h3 className="font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Información Adicional</h3>
              
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-gray-700">Asignar salón estático</span>
                <button
                  type="button"
                  onClick={() => {
                     setStaticGroup(!staticGroup);
                     if(staticGroup) resetKidField('kidGroup');
                  }}
                  className={clsx(
                    "relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
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
                  {kidGroupSlice.data?.map((g: any) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </Select>
              )}

              <Select label="Condición Médica" {...registerKid('medicalConditionId')}>
                <option value="">Ninguna</option>
                {kidMedicalConditionSlice.data?.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </Select>

              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Observaciones</label>
                <textarea 
                  {...registerKid('observations')}
                  className="block w-full rounded-xl border-2 border-gray-200 bg-white text-text-main py-2.5 px-3 focus:border-primary focus:ring-0 transition-colors outline-none text-base shadow-sm"
                  rows={3}
                  maxLength={300}
                  placeholder="Ejemplo: lleva bolso, lleva merienda, está enfermo..."
                ></textarea>
              </div>
            </div>

            <Button 
              type="submit"
              block
              variant="primary"
              disabled={isUploading}
            >
              {isUploading ? 'Guardando...' : <>Guardar Niño y Continuar <ChevronRight size={18} className="ml-2 inline" /></>}
            </Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleGuardianSubmit(onGuardianSubmit)} className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
              <div className="grid grid-cols-[100px_1fr] gap-3">
                <Select label="Tipo" {...registerGuardian('nationalIdType', { required: 'Requerido' })} required>
                  <option value="CC">CC</option>
                  <option value="CE">CE</option>
                  <option value="TI">TI</option>
                  <option value="PP">PP</option>
                </Select>
                <Input label="Documento" type="number" placeholder="Número" {...registerGuardian('nationalId', { required: 'Requerido' })} required onBlur={checkNationalId} />
              </div>

              <Input label="Nombres" placeholder="Nombres del acudiente" {...registerGuardian('firstName', { required: 'Requerido' })} required />
              <Input label="Apellidos" placeholder="Apellidos del acudiente" {...registerGuardian('lastName', { required: 'Requerido' })} required />
              <Input label="Teléfono" type="tel" placeholder="Ej: 300 123 4567" {...registerGuardian('phone', { required: 'Requerido' })} required />

              <Select label="Género" {...registerGuardian('gender', { required: 'Requerido' })} required>
                <option value="">Seleccione</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </Select>
              <Select label="Relación" {...registerGuardian('relation', { required: 'Requerido' })} required>
                <option value="">Seleccione</option>
                <option value="madre">Madre</option>
                <option value="padre">Padre</option>
                <option value="abuelo">Abuelo(a)</option>
                <option value="tio">Tío(a)</option>
                <option value="hermano">Hermano(a)</option>
                <option value="otro">Otro</option>
              </Select>
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
      />
    </div>
  );
};

export default NewKidView;

