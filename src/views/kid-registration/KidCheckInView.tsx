import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetKid, DeleteKid } from '@/libs/state/redux/thunks/kid-church/kid.thunk';
import { GetKidGroups } from '@/libs/state/redux/thunks/kid-church/kid-group.thunk';
import { CreateKidRegistration, ReprintKidRegistration, RemoveKidRegistration } from '@/libs/state/redux/thunks/kid-church/kid-registration.thunk';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { Loader2, ArrowLeft, QrCode, Printer, Trash2, Pencil, Cake, ShieldAlert, HeartPulse, FileText, MoreVertical, UserPlus, UserCheck, ArrowLeftRight, AlertTriangle, Eye } from 'lucide-react';
import { FaChild, FaChildDress } from 'react-icons/fa6';
import { toast } from 'sonner';
import clsx from 'clsx';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import ConfirmModal from '@/components/ui/ConfirmModal';
import TagKidGroup from '@/components/ui/TagKidGroup';
import PageHeader from '@/components/ui/PageHeader';
import UpdateGuardianModal from '@/components/modal/UpdateGuardianModal';
import AssignGuardianModal from '@/components/modal/AssignGuardianModal';
import { APP_ROUTES } from '@/config/routes';
import { capitalizeWords } from '@/libs/utils/text';
import { KID_RELATION_CODE_MAPPER, KidGroupType } from '@/libs/models/KidChurch';
import { KID_AGE_COPY, isKidOverage } from '@/libs/common-types/constants';
import { useChurchMeetingStatus } from '@/libs/hooks/useChurchMeetingStatus';
import Alert from '@/components/ui/Alert';
import { KidCheckInSkeleton } from '@/components/ui/DetailSkeleton';

dayjs.locale('es');

const KidCheckInView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { current: kid, loading } = useAppSelector(state => state.kidSlice);
  const kidGroupSlice = useAppSelector(state => state.kidGroupSlice);
  const { shouldBlockKids, isMeetingValid, meetingErrorMsg, isAdmin } = useChurchMeetingStatus();

  const [selectedGuardian, setSelectedGuardian] = useState<string>('');
  const [observationType, setObservationType] = useState<string>('NONE');
  const [customObservation, setCustomObservation] = useState<string>('');
  const [selectedGuardianToUpdate, setSelectedGuardianToUpdate] = useState<any>(null);
  
  const [isKidVolunteer, setIsKidVolunteer] = useState(false);
  const [showVolunteerConfirmModal, setShowVolunteerConfirmModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showAssignGuardianModal, setShowAssignGuardianModal] = useState(false);
  const [showDeleteKidModal, setShowDeleteKidModal] = useState(false);
  const [showAdminOutOfScheduleModal, setShowAdminOutOfScheduleModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Reset imageError when kid or photoUrl changes
  useEffect(() => {
    setImageError(false);
  }, [kid?.photoUrl]);

  // Always fetch detailed child info, special groups, and current meeting registration
  useEffect(() => {
    if (id) {
      dispatch(GetKid({ id }));
      dispatch(GetKidGroups({ type: KidGroupType.SPECIAL }));
    }
  }, [id, dispatch]);

  const getTranslatedRelation = (code: string) => {
    if (!code) return 'Acudiente';
    return (KID_RELATION_CODE_MAPPER as Record<string, string>)[code] || code;
  };

  // Format relationships/guardians with full name and localized relationship label
  const relationsList = kid?.relations?.map((rel: any) => {
    const g = rel?.guardian || rel;
    const rawRelation = rel?.relationCode || rel?.relation || g?.relation || '';
    const firstName = g?.firstName || rel?.firstName || '';
    const lastName = g?.lastName || rel?.lastName || '';
    const dialCodePhone = g?.dialCodePhone || rel?.dialCodePhone || '+57';
    const rawPhone = g?.phone || rel?.phone || '';
    
    const fullName = capitalizeWords(`${firstName} ${lastName}`.trim());
    const relationLabel = getTranslatedRelation(rawRelation);
    const displayPhone = `${dialCodePhone} ${rawPhone}`.trim();
    const rawGender = g?.gender || rel?.gender || '';

    return {
      id: g?.id || rel?.id,
      fullName,
      firstName,
      lastName,
      gender: rawGender,
      relation: relationLabel,
      dialCodePhone,
      rawPhone,
      displayPhone,
      rawRelation,
      raw: rel
    };
  }) || [];

  // Guardian who performed the current check-in for the child
  const registrationGuardian = useMemo(() => {
    const guardianId = kid?.currentKidRegistration?.guardianId;
    if (!guardianId || !kid?.relations) return null;
    const found: any = (kid.relations as any[]).find(
      (rel: any) => (rel?.guardian?.id || rel?.id) === guardianId,
    );
    if (!found) return null;
    const g = found.guardian || found;
    const firstName = g.firstName || found.firstName || '';
    const lastName = g.lastName || found.lastName || '';
    const rawRelation = found.relationCode || found.relation || g.relation || '';
    const relation = getTranslatedRelation(rawRelation);
    const dialCode = g.dialCodePhone || found.dialCodePhone || '+57';
    const phone = g.phone || found.phone || '';

    return {
      fullName: capitalizeWords(`${firstName} ${lastName}`.trim()),
      relation,
      phone: `${dialCode} ${phone}`.trim(),
    };
  }, [kid]);

  const formatRegistrationDate = (date: string | Date | undefined) => {
    if (!date) return '';
    const formatted = dayjs(date).format('MMMM D, YYYY h:mm:ss A');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  // Automatically select the first guardian when relationships are loaded
  useEffect(() => {
    if (relationsList.length > 0 && !selectedGuardian) {
      setSelectedGuardian(relationsList[0].id);
    }
  }, [relationsList, selectedGuardian]);

  const isRegistered = !!kid?.currentKidRegistration;

  const isBirthdayToday = useMemo(() => {
    if (!kid?.birthday) return false;
    const str = typeof kid.birthday === 'string' ? kid.birthday : new Date(kid.birthday).toISOString();
    if (str.length >= 10 && str.includes('-')) {
      const parts = str.substring(0, 10).split('-');
      if (parts.length === 3) {
        return `${parts[1]}-${parts[2]}` === dayjs().format('MM-DD');
      }
    }
    return dayjs(kid.birthday).format('MM-DD') === dayjs().format('MM-DD');
  }, [kid?.birthday]);

  const isEpsUnknown = useMemo(() => {
    if (!kid?.healthSecurityEntity) return false;
    const eps = kid.healthSecurityEntity.trim().toUpperCase();
    return eps === 'NO SABE' || eps === 'NO_SABE' || eps === 'NOSABE' || eps === 'SIN EPS';
  }, [kid?.healthSecurityEntity]);

  const formattedAge = useMemo(() => {
    if (kid?.birthday) {
      const birth = dayjs(kid.birthday);
      if (birth.isValid()) {
        const now = dayjs();
        const years = now.diff(birth, 'year');
        const months = now.diff(birth, 'month') % 12;
        return `${years} ${years === 1 ? 'año' : 'años'} y ${months} ${months === 1 ? 'mes' : 'meses'}`;
      }
    }
    if (kid?.age !== undefined) {
      const years = Math.floor(kid.age);
      const months = kid.ageInMonths !== undefined ? Math.max(0, kid.ageInMonths - years * 12) : 0;
      return `${years} ${years === 1 ? 'año' : 'años'} y ${months} ${months === 1 ? 'mes' : 'meses'}`;
    }
    return '';
  }, [kid?.birthday, kid?.age, kid?.ageInMonths]);

  const isOverage = useMemo(() => {
    if (isKidVolunteer) return false;
    return isKidOverage(kid);
  }, [kid, isKidVolunteer]);

  const executeRegistration = async () => {
    if (isOverage && !isAdmin) {
      toast.error(KID_AGE_COPY.maxAgeToastError);
      return;
    }
    if (!selectedGuardian) {
      toast.error("Por favor seleccione un acudiente");
      return;
    }
    if (!kid?.id || !kid?.kidGroup?.id) {
      toast.error("El niño no tiene asignado un grupo válido");
      return;
    }

    const specialGroup = kidGroupSlice.data?.find((g: any) => g.name === 'Yo Soy Iglekids' || g.type === KidGroupType.SPECIAL) || kidGroupSlice.data?.[0];
    const targetGroupId = isKidVolunteer && specialGroup?.id ? specialGroup.id : kid.kidGroup.id;

    let finalObservation = '';
    if (observationType === 'OTHER') {
      finalObservation = customObservation.trim();
    } else if (observationType !== 'NONE') {
      finalObservation = observationType;
    }

    try {
      await dispatch(CreateKidRegistration({
        kidId: kid.id,
        observation: finalObservation || undefined,
        kidGuardianId: selectedGuardian,
        kidGroupId: targetGroupId
      })).unwrap();
      toast.success("¡Etiqueta de registro enviada a impresión!");
      navigate(APP_ROUTES.kidRegistration.root);
    } catch (err) {
      toast.error("Error al registrar");
    }
  };

  const handleCheckIn = async () => {
    if (!selectedGuardian) {
      toast.error("Por favor seleccione un acudiente");
      return;
    }
    if (!kid?.id || !kid?.kidGroup?.id) {
      toast.error("El niño no tiene asignado un grupo válido");
      return;
    }

    if (!isMeetingValid) {
      if (isAdmin) {
        setShowAdminOutOfScheduleModal(true);
        return;
      } else {
        toast.error(meetingErrorMsg || 'El servicio seleccionado ha finalizado. No se pueden realizar nuevos registros.');
        navigate(APP_ROUTES.kidRegistration.root);
        return;
      }
    }

    await executeRegistration();
  };

  const handleReprint = async () => {
    if (!kid?.currentKidRegistration) return;
    try {
      await dispatch(ReprintKidRegistration({ id: kid.currentKidRegistration.id, copies: 1 })).unwrap();
      toast.success("Reimpresión solicitada correctamente");
      navigate(APP_ROUTES.kidRegistration.root);
    } catch (err) {
      toast.error("Error al reimprimir");
    }
  };

  const handleDelete = async () => {
    if (!kid?.currentKidRegistration) return;
    try {
      await dispatch(RemoveKidRegistration({ id: kid.currentKidRegistration.id })).unwrap();
      toast.success("Registro eliminado");
      navigate(APP_ROUTES.kidRegistration.root);
    } catch (err) {
      toast.error("Error al eliminar registro");
    }
  };

  const handleDeleteKid = async () => {
    if (!kid?.id) return;
    try {
      await dispatch(DeleteKid({ id: kid.id })).unwrap();
      toast.success('Niño eliminado correctamente');
      navigate(APP_ROUTES.kidRegistration.root, { replace: true });
    } catch {
      toast.error('Error al eliminar el niño');
    }
  };

  const handleUpdateGuardian = (guardianData: any) => {
    setSelectedGuardianToUpdate(guardianData);
  };

  const specialGroup = kidGroupSlice.data?.find((g: any) => g.name === 'Yo Soy Iglekids' || g.type === KidGroupType.SPECIAL) || kidGroupSlice.data?.[0];

  const displayedGroupName = isRegistered
    ? (kid?.currentKidRegistration?.groupId !== kid?.kidGroup?.id ? 'Yo Soy Iglekids' : kid?.kidGroup?.name)
    : (isKidVolunteer ? (specialGroup?.name || 'Yo Soy Iglekids') : (kid?.kidGroup?.name || 'Sin grupo'));

  const isStaticGroup = isRegistered
    ? (kid?.currentKidRegistration?.groupId !== kid?.kidGroup?.id ? false : kid?.staticGroup)
    : (isKidVolunteer ? false : kid?.staticGroup);

  const rightMenuAction = (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowMenu((prev) => !prev)}
        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all text-primary-foreground"
        title="Opciones"
      >
        <MoreVertical size={20} />
      </button>

      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowMenu(false)} 
          />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 text-gray-800 animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
                if (id) navigate(APP_ROUTES.kidRegistration.updateKid(id));
              }}
              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-sm font-semibold text-gray-700 transition-colors"
            >
              <Pencil size={17} className="text-gray-500" />
              <span>Actualizar datos del niño</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
                setShowAssignGuardianModal(true);
              }}
              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-sm font-semibold text-gray-700 transition-colors"
            >
              <UserPlus size={17} className="text-gray-500" />
              <span>Asignar nuevo acudiente</span>
            </button>

            {isAdmin && (
              <>
                <div className="border-t border-gray-100 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    setShowDeleteKidModal(true);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-red-50 flex items-center gap-3 text-sm font-semibold text-red-600 transition-colors"
                >
                  <Trash2 size={17} className="text-red-500" />
                  <span>Eliminar niño</span>
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader
        title="Detalle y Registro"
        onBack={() => navigate(APP_ROUTES.kidRegistration.root)}
        rightAction={rightMenuAction}
      />

      <div className="p-4 animate-in fade-in slide-in-from-right-4 duration-300">
        {(!kid || kid.id !== id || (loading && !kid.relations)) && <KidCheckInSkeleton />}

        {kid && kid.id === id && (!loading || !!kid.relations) && (
          <>
            {/* Banner de cumpleaños */}
            {isBirthdayToday && (
              <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white p-3.5 rounded-2xl mb-4 flex items-center justify-center gap-2.5 text-sm font-black shadow-md animate-pulse tracking-wide">
                <Cake size={22} className="text-yellow-200 animate-bounce" />
                <span>¡¡¡HOY ES SU CUMPLEAÑOS!!! 🎉🎂</span>
              </div>
            )}

            {/* Banner de aviso si la EPS es NO SABE */}
            {isEpsUnknown && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-2xl mb-4 flex items-start gap-3 text-xs leading-relaxed shadow-xs">
                <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-bold text-amber-900 text-sm mb-0.5">⚠️ EPS no registrada ("NO SABE")</h4>
                  <p className="text-amber-800">
                    La EPS del niño se encuentra registrada como <span className="font-bold">"NO SABE"</span>. Por favor, <strong>pregunta al acudiente si ya conoce la EPS actual del niño</strong> y actualízala desde las opciones (<strong>⋮</strong>).
                  </p>
                </div>
              </div>
            )}

            {/* Cabecera Principal del Niño */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4">
              <div className="flex gap-4 items-center">
                <div className="relative shrink-0 group">
                  <div 
                    onClick={() => {
                      if (kid?.photoUrl && !imageError) setShowPhotoModal(true);
                    }}
                    className={clsx(
                      "w-20 h-20 rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-inner relative",
                      kid?.photoUrl && !imageError ? "cursor-pointer transition-transform hover:scale-105 active:scale-95" : "",
                      (!kid?.photoUrl || imageError) && (
                        kid?.gender === 'F' || (kid?.gender as string)?.toUpperCase() === 'FEMALE'
                          ? "bg-pink-100 text-pink-500"
                          : "bg-blue-100 text-blue-500"
                      )
                    )}
                  >
                    {kid?.photoUrl && !imageError ? (
                      <>
                        <img 
                          src={kid.photoUrl} 
                          alt="Avatar" 
                          className="w-full h-full object-cover" 
                          onError={() => setImageError(true)}
                        />
                        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <Eye size={24} className="text-white drop-shadow-md" />
                        </div>
                      </>
                    ) : kid?.gender === 'F' || (kid?.gender as string)?.toUpperCase() === 'FEMALE' ? (
                      <FaChildDress size={42} />
                    ) : (
                      <FaChild size={42} />
                    )}
                  </div>

                  {kid?.photoUrl && !imageError && (
                    <button
                      type="button"
                      onClick={() => setShowPhotoModal(true)}
                      className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:text-primary transition-transform active:scale-90"
                    >
                      <Eye size={12} />
                    </button>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 leading-snug break-words">{capitalizeWords(`${kid.firstName || ''} ${kid.lastName || ''}`)}</h3>
                  <h4 className="text-sm text-gray-500 font-medium mt-0.5">
                    Código: {kid?.faithForgeId || kid?.id}{formattedAge ? ` • Edad: ${formattedAge}` : ''}
                  </h4>
                  <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                    <TagKidGroup
                      kidGroup={displayedGroupName}
                      staticGroup={isStaticGroup}
                    />
                    {isOverage && (
                      <span className="px-2.5 py-0.5 text-xs font-bold bg-red-100 text-red-800 rounded-full border border-red-200">
                        {KID_AGE_COPY.maxAgeBadge}
                      </span>
                    )}
                    {isBirthdayToday && (
                      <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-300 flex items-center gap-1 animate-pulse">
                        🎂 Hoy
                      </span>
                    )}
                    {isRegistered && (
                      <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                        Registrado
                      </span>
                    )}
                    {!isRegistered && (
                      <button
                        type="button"
                        onClick={() => setShowVolunteerConfirmModal(true)}
                        className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-all hover:scale-105 active:scale-95 border border-gray-200"
                        title={isKidVolunteer ? "Cambiar a recibir en su salón habitual" : "Cambiar a Yo Soy Iglekids (Servidor)"}
                      >
                        <ArrowLeftRight size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tarjeta con Información Detallada del Niño (Datos del Niño) */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 border-b border-gray-100 pb-2">
                Datos del niño
              </h2>
              <div className="flex flex-col gap-y-3 text-sm">
                {formattedAge && (
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="font-semibold text-gray-500">Edad</span>
                    <span className="font-bold text-gray-800">{formattedAge}</span>
                  </div>
                )}

                {kid?.birthday && (
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="font-semibold text-gray-500">Fecha de nacimiento</span>
                    <span className="font-bold text-gray-800">{dayjs(kid.birthday).format('D [de] MMMM [de] YYYY')}</span>
                  </div>
                )}

                {kid?.gender && (
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="font-semibold text-gray-500">Género</span>
                    <span className="font-bold text-gray-800">{kid.gender === 'M' ? 'Masculino' : kid.gender === 'F' ? 'Femenino' : kid.gender}</span>
                  </div>
                )}

                {kid?.healthSecurityEntity && (
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="font-semibold text-gray-500">EPS</span>
                    <span className={clsx("font-bold", isEpsUnknown ? "text-amber-700 flex items-center gap-1.5" : "text-gray-800")}>
                      {isEpsUnknown && <AlertTriangle size={15} className="text-amber-600" />}
                      {capitalizeWords(kid.healthSecurityEntity)}
                    </span>
                  </div>
                )}

                {kid?.medicalCondition && (
                  <div className="flex justify-between items-start py-1 border-b border-gray-50">
                    <span className="font-semibold text-gray-500">Condición Médica</span>
                    <span className="font-bold text-amber-600 text-right">
                      {typeof kid.medicalCondition === 'object' ? `${kid.medicalCondition.code || ''} - ${kid.medicalCondition.name || ''}` : kid.medicalCondition}
                    </span>
                  </div>
                )}

                {kid?.observations && (
                  <div className="flex flex-col py-1">
                    <span className="font-semibold text-gray-500 mb-1">Observaciones generales</span>
                    <span className="font-medium text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-xs leading-relaxed">
                      {kid.observations}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {isRegistered ? (
              /* VISTA DE NIÑO YA REGISTRADO */
              <>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4">
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 border-b border-gray-100 pb-2">
                    Información del registro
                  </h2>
                  <div className="flex flex-col gap-y-3 text-sm">
                    <div className="flex justify-between items-center py-1 border-b border-gray-50">
                      <span className="font-semibold text-gray-500">Fecha de registro</span>
                      <span className="font-bold text-gray-800 text-right">
                        {formatRegistrationDate(kid?.currentKidRegistration?.date)}
                      </span>
                    </div>

                    <div className="flex justify-between items-start py-1.5 border-b border-gray-50">
                      <span className="font-semibold text-gray-500 shrink-0 pr-2 pt-0.5">Acudiente que registró</span>
                      <div className="text-right flex flex-col items-end">
                        <span className="font-bold text-gray-800">
                          {registrationGuardian ? (
                            `${registrationGuardian.fullName} (${registrationGuardian.relation})`
                          ) : (
                            kid?.currentKidRegistration?.additionalInfo?.guardianFullName || "Acudiente registrado"
                          )}
                        </span>
                        {registrationGuardian?.phone && (
                          <span className="text-xs font-semibold text-gray-500 mt-0.5">
                            Tel: {registrationGuardian.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    {kid?.currentKidRegistration?.observation && (
                      <div className="flex justify-between items-start py-1.5 border-b border-gray-50">
                        <span className="font-semibold text-gray-500 shrink-0 pr-2">Observaciones</span>
                        <span className="font-bold text-gray-800 text-right">
                          {kid.currentKidRegistration.observation}
                        </span>
                      </div>
                    )}

                    {kid?.currentKidRegistration?.log && (
                      <div className="flex justify-between items-start py-1.5 border-b border-gray-50 last:border-0">
                        <span className="font-semibold text-gray-500 shrink-0 pr-2">Log de registro</span>
                        <span className="font-bold text-gray-800 text-right">
                          {kid.currentKidRegistration.log}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tabla de Acudientes */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 border-b border-gray-100 pb-2">Acudientes</h2>
                  <div className="grid grid-cols-12 gap-x-2 gap-y-3 text-xs items-center">
                    <div className="col-span-4 font-bold text-gray-500 uppercase">Nombre</div>
                    <div className="col-span-3 font-bold text-gray-500 uppercase">Relación</div>
                    <div className="col-span-4 font-bold text-gray-500 uppercase">Teléfono</div>
                    <div className="col-span-1"></div>

                    {relationsList.map((rel: any) => (
                      <React.Fragment key={rel.id}>
                        <div className="col-span-12 border-t border-gray-50 my-0.5"></div>
                        <div className="col-span-4 text-gray-800 font-medium leading-tight truncate" title={rel.fullName}>{rel.fullName}</div>
                        <div className="col-span-3 text-gray-600">{rel.relation}</div>
                        <div className="col-span-4 text-gray-600">{rel.displayPhone}</div>
                        <div className="col-span-1 flex justify-end">
                          <button 
                            onClick={() => handleUpdateGuardian({
                              id: rel.id,
                              firstName: rel.firstName,
                              lastName: rel.lastName,
                              fullName: rel.fullName,
                              gender: rel.gender,
                              dialCodePhone: rel.dialCodePhone,
                              phone: rel.rawPhone,
                              relation: rel.rawRelation,
                              kidId: kid?.id
                            })}
                            className="text-primary p-2 bg-primary/10 rounded-full hover:bg-primary/20 transition-colors"
                          >
                            <Pencil size={14}/>
                          </button>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button onClick={handleReprint} block variant="primary">
                    <Printer size={18} className="mr-2 inline" /> Reimprimir registro
                  </Button>
                  
                  <Button onClick={handleDelete} block variant="danger">
                    <Trash2 size={18} className="mr-2 inline" /> Eliminar Registro
                  </Button>
                </div>
              </>
            ) : (
              /* FORMULARIO DE CHECK-IN (NO REGISTRADO) */
              <>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
                  <div className="mb-5">
                    <label className="block text-xs font-bold text-gray-700 mb-3 uppercase">¿Quién lo entrega?</label>
                    <div className="flex flex-col gap-2.5">
                      {relationsList.length === 0 ? (
                        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs leading-relaxed shadow-xs">
                          <div className="flex items-start gap-2.5">
                            <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="block font-bold text-amber-950 text-sm mb-0.5">
                                No hay acudientes registrados
                              </strong>
                              <span className="text-amber-800">
                                Este niño no tiene acudientes asignados. Por favor, <strong>asigna un acudiente</strong> seleccionando la opción en el menú superior (<strong>⋮</strong>) o con el botón a continuación.
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowAssignGuardianModal(true)}
                            className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 self-end sm:self-center"
                          >
                            <UserPlus size={15} /> Asignar Acudiente
                          </button>
                        </div>
                      ) : (
                        relationsList.map((rel: any) => (
                          <label key={rel.id} className="flex items-center gap-2.5 p-2.5 border-2 border-transparent hover:border-primary/50 bg-gray-50 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors relative has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                            <input 
                              type="radio" 
                              name="guardian" 
                              checked={selectedGuardian === rel.id} 
                              onChange={() => setSelectedGuardian(rel.id)}
                              className="w-4 h-4 text-primary focus:ring-primary border-gray-300 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-xs text-gray-800 break-words leading-tight" title={`${rel.fullName} (${rel.relation})`}>
                                {rel.fullName} <span className="font-semibold text-gray-500 text-[11px]">({rel.relation})</span>
                              </p>
                              <p className="text-[11px] text-gray-500 truncate">Tel: {rel.displayPhone}</p>
                            </div>
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.preventDefault(); 
                                handleUpdateGuardian({
                                  id: rel.id,
                                  firstName: rel.firstName,
                                  lastName: rel.lastName,
                                  fullName: rel.fullName,
                                  gender: rel.gender,
                                  dialCodePhone: rel.dialCodePhone,
                                  phone: rel.rawPhone,
                                  relation: rel.rawRelation,
                                  kidId: kid?.id
                                });
                              }}
                              className="text-primary p-1.5 bg-white rounded-full hover:bg-primary/10 shadow-sm border border-gray-200 transition-colors shrink-0"
                            >
                              <Pencil size={13}/>
                            </button>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <Select
                      label="Observaciones al registrar (Check-in)"
                      value={observationType}
                      onChange={(e) => setObservationType(e.target.value)}
                    >
                      <option value="NONE">Ninguna</option>
                      <option value="Lleva bolso">Lleva bolso</option>
                      <option value="Lleva merienda">Lleva merienda</option>
                      <option value="Lleva bolso y merienda">Lleva bolso y merienda</option>
                      <option value="OTHER">Otra observación</option>
                    </Select>

                    {observationType === 'OTHER' && (
                      <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                        <textarea 
                          className="block w-full rounded-xl border-2 border-gray-200 bg-white text-text-main py-2.5 px-3 focus:border-primary focus:ring-0 transition-colors outline-none text-base shadow-sm"
                          rows={3}
                          maxLength={300}
                          placeholder="Escriba la observación personalizada..."
                          value={customObservation}
                          onChange={(e) => setCustomObservation(e.target.value)}
                          autoFocus
                        ></textarea>
                      </div>
                    )}
                  </div>
                </div>

                {isOverage && !isAdmin && (
                  <Alert 
                    type="error" 
                    message={KID_AGE_COPY.maxAgeAlertMessage} 
                    className="mb-4"
                  />
                )}

                {shouldBlockKids && (
                  <Alert 
                    type="error" 
                    message={meetingErrorMsg || "El servicio ha finalizado. El registro no está disponible."} 
                    className="mb-4"
                  />
                )}

                <Button 
                  onClick={handleCheckIn} 
                  block 
                  variant="primary"
                  disabled={shouldBlockKids || loading || relationsList.length === 0 || (isOverage && !isAdmin)}
                >
                  <QrCode size={20} className="mr-2 inline" /> Registrar e Imprimir Etiqueta
                </Button>
              </>
            )}
          </>
        )}
      </div>

      <UpdateGuardianModal 
        open={!!selectedGuardianToUpdate} 
        onClose={() => setSelectedGuardianToUpdate(null)} 
        guardian={selectedGuardianToUpdate} 
      />

      <AssignGuardianModal
        open={showAssignGuardianModal}
        onClose={() => setShowAssignGuardianModal(false)}
        kidId={id || ''}
      />

      <ConfirmModal
        open={showDeleteKidModal}
        onOpenChange={setShowDeleteKidModal}
        title="¿Eliminar niño?"
        description="¿Está seguro que desea eliminar al niño? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        onConfirm={handleDeleteKid}
      />

      <ConfirmModal
        open={showAdminOutOfScheduleModal}
        onOpenChange={setShowAdminOutOfScheduleModal}
        title="¿Registrar fuera de horario?"
        description={`${meetingErrorMsg || 'El servicio seleccionado se encuentra fuera del horario habitual de registro.'} Como administrador, ¿deseas confirmar y proceder con el registro de este niño?`}
        confirmText="Sí, registrar"
        cancelText="Cancelar"
        type="warning"
        onConfirm={executeRegistration}
      />

      <ConfirmModal
        open={showVolunteerConfirmModal}
        onOpenChange={setShowVolunteerConfirmModal}
        title={`Cambiar niño a ${isKidVolunteer ? (kid?.kidGroup?.name || 'recibir en Iglekids') : 'Yo Soy Iglekids'}`}
        description={`El niño será registrado ${isKidVolunteer ? `para recibir en su salón habitual (${kid?.kidGroup?.name || 'Iglekids'})` : 'en el área de servidores (Yo Soy Iglekids)'}. Por favor confirma si deseas realizar esta acción.`}
        confirmText="Confirmar"
        cancelText="Cancelar"
        type="info"
        onConfirm={() => setIsKidVolunteer(!isKidVolunteer)}
      />

      {/* Modal / Lightbox de Foto en Tamaño Grande */}
      {showPhotoModal && kid?.photoUrl && (
        <div 
          onClick={() => setShowPhotoModal(false)}
          className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-sm w-full bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center p-4 animate-in zoom-in-95 duration-200"
          >
            <div className="w-full flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="font-bold text-gray-800 text-sm truncate">
                {capitalizeWords(`${kid.firstName || ''} ${kid.lastName || ''}`)}
              </span>
              <button
                type="button"
                onClick={() => setShowPhotoModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-base transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="w-full aspect-square mt-3 rounded-2xl overflow-hidden bg-gray-100 shadow-inner">
              <img 
                src={kid.photoUrl} 
                alt="Foto del niño en tamaño completo" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KidCheckInView;
