import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight, Info, AlertTriangle, ArrowLeftRight } from 'lucide-react';
import { Scanner, IDetectedBarcode } from '@yudiel/react-qr-scanner';
import { APP_ROUTES } from "@/config/routes";
import clsx from 'clsx';
import dayjs from 'dayjs';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import TagKidGroup from '@/components/ui/TagKidGroup';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { ScanCodeKidRegistration, CreateKidRegistration } from '@/libs/state/redux/thunks/kid-church/kid-registration.thunk';
import { GetKidGroups } from '@/libs/state/redux/thunks/kid-church/kid-group.thunk';
import { cleanScanQRSearch } from '@/libs/state/redux/slices/kid-church/scan-code-kid-registration.slice';
import { capitalizeWords } from '@/libs/utils/text';
import { KidGroupType } from '@/libs/models/KidChurch';
import { KID_AGE_COPY, isKidOverage } from '@/libs/common-types/constants';
import { useChurchMeetingStatus } from '@/libs/hooks/useChurchMeetingStatus';

const StepProgress = ({ currentStep }: { currentStep: number }) => {
  return (
    <div className="bg-white px-4 py-4 border-b border-gray-100 sticky top-0 z-20 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          {currentStep === 1 ? 'Paso 1: Escanear' : currentStep === 2 ? 'Paso 2: Selección' : 'Paso 3: Observaciones'}
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

const ScannerView = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { kidGuardian, relations, loading } = useAppSelector(state => state.scanQRKidGuardianSlice);
  const kidGroupSlice = useAppSelector(state => state.kidGroupSlice);
  const { shouldBlockKids, isMeetingValid, meetingErrorMsg, isAdmin } = useChurchMeetingStatus();
  
  const [step, setStep] = useState(1);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [selectedKids, setSelectedKids] = useState<string[]>([]);
  const [volunteerKids, setVolunteerKids] = useState<string[]>([]);
  const [observationTypes, setObservationTypes] = useState<Record<string, string>>({});
  const [customObservations, setCustomObservations] = useState<Record<string, string>>({});
  const [expandedKid, setExpandedKid] = useState<string | null>(null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showAdminOutOfScheduleModal, setShowAdminOutOfScheduleModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<'back' | 'home' | null>(null);

  // Cargar grupos especiales (Yo Soy Iglekids)
  useEffect(() => {
    dispatch(GetKidGroups({ type: KidGroupType.SPECIAL }));
  }, [dispatch]);

  // Clean on unmount
  useEffect(() => {
    return () => {
      dispatch(cleanScanQRSearch());
    };
  }, [dispatch]);

  // Intercept browser back button
  useEffect(() => {
    if (step > 1) {
      window.history.pushState(null, '', window.location.href);
      const handlePopState = () => {
        if (step === 3) {
          // Desde paso 3 regresa directamente a paso 2 sin alerta
          setStep(2);
        } else if (step === 2) {
          // Desde paso 2 muestra el modal de alerta antes de salir
          setShowCancelModal(true);
          setPendingNavigation('back');
        }
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [step]);

  const handleCancelClick = () => {
    if (step === 3) {
      // Desde paso 3 regresa directamente a paso 2 sin alerta
      setStep(2);
    } else if (step === 2) {
      // Desde paso 2 muestra el modal de alerta
      setShowCancelModal(true);
      setPendingNavigation('home');
    } else {
      navigate(APP_ROUTES.kidRegistration.root);
    }
  };

  const handleConfirmCancel = () => {
    setShowCancelModal(false);
    dispatch(cleanScanQRSearch());
    setStep(1);
    setSelectedKids([]);
    setVolunteerKids([]);
    setObservationTypes({});
    setCustomObservations({});
    setScanResult(null);
    if (pendingNavigation === 'back') {
      navigate(-1);
    } else {
      navigate(APP_ROUTES.kidRegistration.root);
    }
  };

  const handleCloseModal = (open: boolean) => {
    setShowCancelModal(open);
    if (!open && pendingNavigation === 'back') {
      window.history.pushState(null, '', window.location.href); 
    }
  };

  const handleScan = async (detectedCodes: IDetectedBarcode[]) => {
    if (!isMeetingValid && !isAdmin) {
      toast.error(meetingErrorMsg || 'El servicio actual ha finalizado. No se pueden realizar registros.');
      return;
    }

    if (detectedCodes.length > 0 && !scanResult && !loading) {
      const code = detectedCodes[0].rawValue;
      setScanResult(code);
      
      try {
        const resultAction = await dispatch(ScanCodeKidRegistration(code)).unwrap();
        if (resultAction) {
          setStep(2);
        }
      } catch (err) {
        toast.error("Error al escanear código o no encontrado.");
        setScanResult(null);
      }
    }
  };  const handleToggleKid = (kidId: string, isRegistered: boolean, isBlockedByAge: boolean) => {
    if (isRegistered) return;
    if (isBlockedByAge) {
      toast.error(KID_AGE_COPY.maxAgeToastError);
      return;
    }
    setSelectedKids(prev => 
      prev.includes(kidId) ? prev.filter(id => id !== kidId) : [...prev, kidId]
    );
  };

  const toggleVolunteer = (kid: any) => {
    const isVol = volunteerKids.includes(kid.id);
    if (isVol) {
      setVolunteerKids(prev => prev.filter(id => id !== kid.id));
      toast.info(`Cambiado a salón habitual (${kid.kidGroup?.name || 'Iglekids'})`, { id: `volunteer-toggle-${kid.id}` });
    } else {
      setVolunteerKids(prev => [...prev, kid.id]);
      toast.success(`Cambiado a Yo Soy Iglekids (Servidor)`, { id: `volunteer-toggle-${kid.id}` });
    }
  };

  const handleConfirmKids = () => {
    if (selectedKids.length === 0) {
      toast.error("Seleccione al menos un niño para registrar");
      return;
    }
    setStep(3);
  };

  const executeBatchRegistration = async () => {
    if (!kidGuardian) return;
    const specialGroup = kidGroupSlice.data?.find((g: any) => g.name === 'Yo Soy Iglekids' || g.type === KidGroupType.SPECIAL) || kidGroupSlice.data?.[0];

    try {
      const promises = selectedKids.map(kidId => {
        const relation = relations.find((r: any) => (r.kid?.id || r.id) === kidId);
        const kid = relation?.kid || relation;
        const isVol = volunteerKids.includes(kidId);
        const kidGroupId = isVol && specialGroup?.id ? specialGroup.id : (kid?.kidGroup?.id || '');
        
        const obsType = observationTypes[kidId] || 'NONE';
        let finalObs: string | undefined = undefined;
        if (obsType === 'OTHER') {
          finalObs = customObservations[kidId]?.trim() || undefined;
        } else if (obsType !== 'NONE') {
          finalObs = obsType;
        }

        return dispatch(CreateKidRegistration({ 
          kidId, 
          kidGuardianId: kidGuardian.id,
          kidGroupId,
          observation: finalObs
        })).unwrap();
      });
      
      await Promise.all(promises);
      toast.success("¡Niños registrados con éxito!");
      navigate(APP_ROUTES.kidRegistration.root);
    } catch (err) {
      toast.error("Ocurrió un error al registrar los niños");
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMeetingValid) {
      if (isAdmin) {
        setShowAdminOutOfScheduleModal(true);
        return;
      } else {
        toast.error(meetingErrorMsg || 'El servicio actual ha finalizado. No se pueden realizar registros.');
        navigate(APP_ROUTES.kidRegistration.root);
        return;
      }
    }
    await executeBatchRegistration();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-primary text-primary-foreground px-4 py-2 sticky top-0 z-30 shadow-xs flex items-center justify-between border-t border-white/15">
        <button 
          onClick={handleCancelClick}
          className="flex items-center gap-1.5 opacity-90 hover:opacity-100 text-sm font-semibold"
        >
          <ArrowLeft size={18} />
          <span>Registro por QR</span>
        </button>
        <div className="w-6" /> {/* Spacer */}
      </div>

      <StepProgress currentStep={step} />

      <div className="p-4">
        
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col items-center">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 w-full mb-6">
              <h2 className="text-lg font-bold text-gray-800 text-center mb-2">Escanear Código</h2>
              <p className="text-sm text-gray-500 text-center mb-4">Apunta la cámara al código QR del acudiente para buscar a los niños asociados.</p>
              
              <div className="rounded-xl overflow-hidden bg-black aspect-square relative border-4 border-gray-100 shadow-inner">
                {/* Lector QR - Usando el mismo componente que tenían en el viejo */}
                <Scanner 
                  onScan={handleScan}
                  // paused={false}
                  components={{ finder: true }}
                />
              </div>
            </div>

            <Button 
              onClick={() => navigate(APP_ROUTES.kidRegistration.generateQR)}
              block
              variant="default"
            >
              Generar QR Acudiente
            </Button>
          </div>
        )}

        {step === 2 && kidGuardian && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 text-center">
              <h1 className="text-2xl font-black text-gray-800 tracking-tight">Acudiente</h1>
              <p className="text-xl text-primary font-bold mt-1">
                {capitalizeWords(`${kidGuardian.firstName || ''} ${kidGuardian.lastName || ''}`.trim())}
              </p>
              <p className="text-sm text-gray-500 mt-2">Confirme que sea el acudiente y seleccione los niños a registrar hoy.</p>
            </div>

            <div className="flex flex-col gap-3 mb-6">
              {relations.map((relation: any) => {
                const kid = relation.kid || relation;
                if (!kid || !kid.id) return null;
                const isRegistered = !!kid.currentKidRegistration;
                const isSelected = selectedKids.includes(kid.id);
                const isKidVolunteer = volunteerKids.includes(kid.id);
                const displayedGroupName = isKidVolunteer ? 'Yo Soy Iglekids' : (kid.kidGroup?.name || 'Iglekids');
                const isStatic = isKidVolunteer ? false : !!kid.staticGroup;
                const hasMaxAge = isKidOverage(kid);
                const isBlockedByAge = hasMaxAge && !isKidVolunteer && !isAdmin;

                const isBday = (() => {
                  if (!kid.birthday) return false;
                  const str = typeof kid.birthday === 'string' ? kid.birthday : new Date(kid.birthday).toISOString();
                  if (str.length >= 10 && str.includes('-')) {
                    const parts = str.substring(0, 10).split('-');
                    if (parts.length === 3) {
                      return `${parts[1]}-${parts[2]}` === dayjs().format('MM-DD');
                    }
                  }
                  return dayjs(kid.birthday).format('MM-DD') === dayjs().format('MM-DD');
                })();

                return (
                  <div 
                    key={kid.id}
                    onClick={() => handleToggleKid(kid.id, isRegistered, isBlockedByAge)}
                    className={clsx(
                      "p-4 rounded-xl border-2 transition-all flex justify-between items-center",
                      isRegistered ? "bg-gray-100 border-gray-200 opacity-70 cursor-not-allowed" 
                      : isBlockedByAge ? "bg-red-50/70 border-red-200 opacity-80 cursor-not-allowed"
                      : isSelected ? "bg-primary/5 border-primary cursor-pointer" 
                      : "bg-white border-gray-200 hover:border-gray-300 shadow-sm cursor-pointer"
                    )}
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={clsx("font-bold text-lg", (isRegistered || isBlockedByAge) ? "text-gray-600" : "text-gray-800")}>
                          {capitalizeWords(`${kid.firstName} ${kid.lastName}`)}
                        </h3>
                        {isBday && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-300 animate-pulse">
                            🎂 ¡Cumpleaños!
                          </span>
                        )}
                        {isRegistered && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                            Registrado
                          </span>
                        )}
                        {hasMaxAge && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-800 rounded-full border border-red-200">
                            {KID_AGE_COPY.maxAgeBadge}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-xs font-medium text-gray-500">Código: {kid.faithForgeId}</span>
                        <span className="text-gray-300">•</span>
                        <div className="flex items-center gap-1.5">
                          <TagKidGroup kidGroup={displayedGroupName} staticGroup={isStatic} className="text-[10px] py-0.5 px-2" />
                          {!isRegistered && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleVolunteer(kid);
                              }}
                              className={clsx(
                                "w-6 h-6 rounded-full flex items-center justify-center transition-all border shrink-0",
                                isKidVolunteer 
                                  ? "bg-primary text-white border-primary shadow-xs scale-105" 
                                  : "bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-200 hover:scale-105 active:scale-95"
                              )}
                              title={isKidVolunteer ? "Cambiar a recibir en su salón habitual" : "Cambiar a Yo Soy Iglekids (Servidor)"}
                            >
                              <ArrowLeftRight size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    {!isRegistered && !isBlockedByAge && (
                      <div className={clsx(
                        "w-6 h-6 rounded-full flex items-center justify-center transition-colors border-2 shrink-0 ml-3",
                        isSelected ? "bg-primary border-primary" : "border-gray-300 bg-white"
                      )}>
                        {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <Button 
              onClick={handleConfirmKids}
              block
              variant="primary"
            >
              Siguiente <ChevronRight size={18} className="ml-2 inline" />
            </Button>
          </div>
        )}

        {step === 3 && kidGuardian && (
          <form onSubmit={handleFinalSubmit} className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6 flex gap-3">
              <Info className="text-blue-500 shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-blue-800 font-medium leading-relaxed">
                Si los niños tienen alguna observación, por favor escríbala abriendo el desplegable correspondiente.
              </p>
            </div>

            <div className="flex flex-col gap-3 mb-6">
              {relations
                .map((r: any) => r.kid || r)
                .filter((k: any) => k && k.id && selectedKids.includes(k.id))
                .map((kid: any) => {
                  const isExpanded = expandedKid === kid.id;
                  const isKidVolunteer = volunteerKids.includes(kid.id);
                  const displayedGroupName = isKidVolunteer 
                    ? 'Yo Soy Iglekids' 
                    : `${kid.kidGroup?.name || 'Iglekids'}${kid.staticGroup ? ' (Estático)' : ''}`;
                  
                  return (
                    <div key={kid.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div 
                        onClick={() => setExpandedKid(isExpanded ? null : kid.id)}
                        className="p-4 flex justify-between items-center cursor-pointer bg-white"
                      >
                        <h3 className="font-bold text-gray-800">
                          {capitalizeWords(`${kid.firstName} ${kid.lastName}`)}
                          <span className="block text-xs text-gray-500 font-medium mt-0.5">{displayedGroupName}</span>
                        </h3>
                        <ChevronRight size={20} className={clsx("text-gray-400 transition-transform duration-300", isExpanded && "rotate-90")} />
                      </div>
                      
                      <div className={clsx(
                        "px-4 transition-all duration-300 ease-in-out",
                        isExpanded ? "pb-4 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
                      )}>
                        <Select
                          label="Observaciones al registrar (Check-in)"
                          value={observationTypes[kid.id] || 'NONE'}
                          onChange={(e) => setObservationTypes({
                            ...observationTypes,
                            [kid.id]: e.target.value
                          })}
                        >
                          <option value="NONE">Ninguna</option>
                          <option value="Lleva bolso">Lleva bolso</option>
                          <option value="Lleva merienda">Lleva merienda</option>
                          <option value="Lleva bolso y merienda">Lleva bolso y merienda</option>
                          <option value="OTHER">Otra observación</option>
                        </Select>

                        {(observationTypes[kid.id] === 'OTHER') && (
                          <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                            <textarea 
                              className="block w-full rounded-xl border-2 border-gray-200 bg-white text-text-main py-2.5 px-3 focus:border-primary focus:ring-0 transition-colors outline-none text-sm shadow-sm"
                              rows={3}
                              maxLength={300}
                              autoComplete="off"
                              autoCorrect="off"
                              autoCapitalize="off"
                              spellCheck={false}
                              placeholder="Escriba la observación personalizada..."
                              value={customObservations[kid.id] || ''}
                              onChange={(e) => setCustomObservations({
                                ...customObservations,
                                [kid.id]: e.target.value
                              })}
                              autoFocus
                            ></textarea>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            <Button 
              type="submit"
              block
              variant="primary"
            >
              <Check size={20} className="mr-2 inline" /> Registrar Niños
            </Button>
          </form>
        )}
      </div>

      <ConfirmModal
        open={showCancelModal}
        onOpenChange={handleCloseModal}
        title="¿Cancelar el escaneo?"
        description="Se perderá el progreso de los niños seleccionados."
        confirmText="Sí, cancelar"
        cancelText="Continuar escaneando"
        onConfirm={handleConfirmCancel}
        type="danger"
      />

      <ConfirmModal
        open={showAdminOutOfScheduleModal}
        onOpenChange={setShowAdminOutOfScheduleModal}
        title="¿Registrar niños fuera de horario?"
        description={`${meetingErrorMsg || 'El servicio actual se encuentra fuera de horario de registro.'} Como administrador, ¿deseas proceder con el registro de los niños seleccionados?`}
        confirmText="Sí, registrar niños"
        cancelText="Cancelar"
        type="warning"
        onConfirm={executeBatchRegistration}
      />
    </div>
  );
};

export default ScannerView;
