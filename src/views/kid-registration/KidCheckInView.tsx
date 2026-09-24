import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppSelector } from '@/libs/state/redux/hooks';
import { useGetKidQuery, useDeleteKidMutation, useCreateKidRegistrationMutation, useReprintKidRegistrationMutation, useDeleteKidRegistrationMutation } from '@/libs/state/redux/api/kidChurchApi';
import { useDeleteKidGuardianRelationMutation, useGetKidGroupsQuery } from '@/libs/state/redux/api/kidChurchApi';
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
import DeleteKidModal from '@/components/modal/DeleteKidModal';
import { APP_ROUTES } from '@/config/routes';
import { capitalizeWords } from '@/libs/utils/text';
import { getRegistrationLogInfo } from '@/libs/utils/registrationLog';
import { formatPhoneDisplay, isPhoneValid } from '@/libs/utils/phone';
import { formatDateOnly, isDateToday, toDateOnlyInputValue } from '@/libs/utils/date';
import { KID_RELATION_CODE_MAPPER, KidGroupType } from '@/libs/models/KidChurch';
import { VolunteerRole } from '@/libs/models';
import { AppRole, ChurchRole, UserRole } from '@/libs/utils/auth';
import { KID_AGE_COPY, isKidOverage } from '@/libs/common-types/constants';
import { useChurchMeetingStatus } from '@/libs/hooks/useChurchMeetingStatus';
import { useKidsTerm } from '@/libs/hooks/useTerm';
import Alert from '@/components/ui/Alert';
import { KidCheckInSkeleton } from '@/components/ui/DetailSkeleton';
import { bluetoothPrinter } from '@/libs/utils/printer/bluetoothPrinter';
import ProcessingPrintModal from '@/components/modal/ProcessingPrintModal';
import { useTranslation } from 'react-i18next';

dayjs.locale('es');

const KidCheckInView = () => {
  const { t } = useTranslation(['kidRegistration', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deleteGuardianRelation] = useDeleteKidGuardianRelationMutation();
  const [createKidRegistration] = useCreateKidRegistrationMutation();
  const [reprintKidRegistration] = useReprintKidRegistrationMutation();
  const [deleteKidRegistration] = useDeleteKidRegistrationMutation();
  const [deleteKid] = useDeleteKidMutation();
  const guardianTerm = useKidsTerm('guardian');
  const guardiansTerm = useKidsTerm('guardians');

  const currentCampus = useAppSelector((state) => state.churchCampusSlice.current);
  const currentMeeting = useAppSelector((state) => state.churchMeetingSlice.current);
  const user = useAppSelector((state) => state.authSlice.user);
  const currentRole = useAppSelector((state) => state.authSlice.currentRole);
  const activeVolunteerRole = useAppSelector(
    (state) => state.volunteerContextSlice.activeVolunteerRole
  );

  const { data: kid, isLoading: loading, refetch: refetchKid } = useGetKidQuery(
    { id: id || '', registrationChurchMeetingId: currentMeeting?.id },
    { skip: !id }
  );
  const { data: kidGroups = [] } = useGetKidGroupsQuery();

  const printerModeSlice = useAppSelector((state) => state.printerModeSlice);
  const userRoles = (user?.roles as AppRole[]) || [];

  const canViewCreatorInfo =
    userRoles.includes(UserRole.SUPER_ADMIN) ||
    userRoles.includes(UserRole.ADMIN) ||
    userRoles.includes(UserRole.KID_REGISTER_ADMIN) ||
    currentRole === UserRole.SUPER_ADMIN ||
    currentRole === UserRole.ADMIN ||
    (currentRole as any) === ChurchRole.MINISTRY_ADMIN ||
    currentRole === UserRole.KID_REGISTER_ADMIN ||
    activeVolunteerRole === VolunteerRole.AREA_GENERAL_COORDINATOR;

  const { shouldBlockKids, isMeetingValid, meetingErrorMsg, isAdmin, isSupervisor } =
    useChurchMeetingStatus();

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
  const [guardianRelationToDelete, setGuardianRelationToDelete] = useState<any | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('Registrando...');

  // Reset imageError when kid or photoUrl changes
  useEffect(() => {
    setImageError(false);
  }, [kid?.photoUrl]);

  // Fetch kid data via RTK Query hook; no manual dispatch needed

  const getTranslatedRelation = (code: string) => {
    if (!code) return guardianTerm;
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
    const displayPhone = formatPhoneDisplay(rawPhone, dialCodePhone);
    const isPhoneErroneous = rawPhone ? !isPhoneValid(rawPhone, dialCodePhone) : false;
    const rawGender = g?.gender || rel?.gender || '';

    return {
      id: g?.id || rel?.id,
      guardianId: g?.id || rel?.guardianId || rel?.id,
      fullName,
      firstName,
      lastName,
      gender: rawGender,
      relation: relationLabel,
      dialCodePhone,
      rawPhone,
      displayPhone,
      isPhoneErroneous,
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
    return isDateToday(kid?.birthday);
  }, [kid?.birthday]);

  const isEpsUnknown = useMemo(() => {
    if (!kid?.healthSecurityEntity) return false;
    const eps = kid.healthSecurityEntity.trim().toUpperCase();
    return eps === 'NO SABE' || eps === 'NO_SABE' || eps === 'NOSABE' || eps === 'SIN EPS';
  }, [kid?.healthSecurityEntity]);

  const formattedAge = useMemo(() => {
    if (kid?.birthday) {
      const birth = dayjs(toDateOnlyInputValue(kid.birthday));
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

  const selectedGuardianObj = useMemo(() => {
    return relationsList.find((g: any) => g.id === selectedGuardian || g.kidGuardianId === selectedGuardian);
  }, [relationsList, selectedGuardian]);

  const isSelectedGuardianPhoneInvalid = !!selectedGuardianObj?.isPhoneErroneous;

  const executeRegistration = async () => {
    if (isOverage && !isAdmin) {
      toast.error(KID_AGE_COPY.maxAgeToastError);
      return;
    }
    if (!selectedGuardian) {
      toast.error(`Por favor seleccione un(a) ${guardianTerm.toLowerCase()}`);
      return;
    }
    if (isSelectedGuardianPhoneInvalid) {
      toast.error(`El/La ${guardianTerm.toLowerCase()} seleccionado(a) tiene un número con formato errado. Debe preguntarle el número correcto y actualizarlo antes de registrar.`);
      return;
    }
    if (!kid?.id || !kid?.kidGroup?.id) {
      toast.error("El niño no tiene asignado un grupo válido");
      return;
    }

    const specialGroup = kidGroups.find((g) => g.type === KidGroupType.SPECIAL || g.name === 'Yo Soy Iglekids') || kidGroups[0];
    const targetGroupId = isKidVolunteer && specialGroup?.id ? specialGroup.id : kid.kidGroup.id;

    let finalObservation = '';
    if (observationType === 'OTHER') {
      finalObservation = customObservation.trim();
    } else if (observationType !== 'NONE') {
      finalObservation = observationType;
    }

    if (!currentMeeting?.id) {
      toast.error('No hay una reunión activa seleccionada.');
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingStep('Guardando registro...');
      const registrationResponse = (await createKidRegistration({
        kidId: kid.id,
        observation: finalObservation || undefined,
        kidGuardianId: selectedGuardian,
        kidGroupId: targetGroupId,
        churchMeetingId: currentMeeting.id,
      }).unwrap()) as { securityCode?: string; code?: string } | undefined;

      if (printerModeSlice?.mode === 'BLUETOOTH' && bluetoothPrinter.isConnected()) {
        setProcessingStep('Imprimiendo etiqueta Bluetooth...');
        const guardian = relationsList.find((g) => g.id === selectedGuardian || g.guardianId === selectedGuardian);
        const group = kidGroups.find((g) => g.id === targetGroupId);
        const currentReg = kid.currentKidRegistration as { securityCode?: string } | undefined;
        await bluetoothPrinter.printKidTicket({
          kidName: `${kid.firstName} ${kid.lastName}`.trim(),
          kidGroup: group?.name || kid.kidGroup?.name || 'General',
          securityCode: registrationResponse?.securityCode || registrationResponse?.code || currentReg?.securityCode,
          guardianName: guardian ? `${guardian.firstName} ${guardian.lastName}`.trim() : undefined,
          guardianPhone: guardian?.displayPhone || guardian?.rawPhone,
          observation: finalObservation || undefined,
          campusName: currentCampus?.name,
          meetingName: currentMeeting?.name,
          isVolunteer: isKidVolunteer,
          gender: kid.gender,
        });
        toast.success("¡Etiqueta impresa por Bluetooth con éxito!");
      } else {
        toast.success("¡Etiqueta de registro enviada a impresión!");
      }
      navigate(APP_ROUTES.kidRegistration.root);
    } catch (err) {
      toast.error("Error al registrar");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedGuardian) {
      toast.error(`Por favor seleccione un(a) ${guardianTerm.toLowerCase()}`);
      return;
    }
    if (isSelectedGuardianPhoneInvalid) {
      toast.error(`El/La ${guardianTerm.toLowerCase()} seleccionado(a) tiene un número con formato errado. Debe preguntarle el número correcto y actualizarlo antes de registrar.`);
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
      setIsProcessing(true);
      setProcessingStep(t('kidRegistration:check_in.reprint_requesting'));
      await reprintKidRegistration({ id: kid.currentKidRegistration.id }).unwrap();
      if (printerModeSlice?.mode === 'BLUETOOTH' && bluetoothPrinter.isConnected()) {
        setProcessingStep(t('kidRegistration:check_in.reprint_printing_bluetooth'));
        const guardian = relationsList.find((g: any) => g.id === selectedGuardian || g.kidGuardianId === selectedGuardian);
        const currentReg = kid.currentKidRegistration as any;
        await bluetoothPrinter.printKidTicket({
          kidName: `${kid.firstName} ${kid.lastName}`.trim(),
          kidGroup: kid.kidGroup?.name || 'General',
          securityCode: currentReg?.securityCode || currentReg?.code,
          guardianName: guardian ? `${guardian.firstName} ${guardian.lastName}`.trim() : undefined,
          guardianPhone: guardian?.displayPhone || guardian?.rawPhone,
          campusName: currentCampus?.name,
          meetingName: currentMeeting?.name,
          isVolunteer: isKidVolunteer,
          gender: kid.gender || (kid as any).sex,
        });
        toast.success(t('kidRegistration:check_in.reprint_success_bluetooth'));
      } else {
        toast.success(t('kidRegistration:check_in.reprint_success'));
      }
      navigate(APP_ROUTES.kidRegistration.root);
    } catch (err) {
      toast.error(t('kidRegistration:check_in.reprint_error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!kid?.currentKidRegistration) return;
    try {
      await deleteKidRegistration({ id: kid.currentKidRegistration.id, kidId: kid.id }).unwrap();
      toast.success(t('kidRegistration:check_in.delete_registration_success'));
      navigate(APP_ROUTES.kidRegistration.root);
    } catch (err) {
      toast.error(t('kidRegistration:check_in.delete_registration_error'));
    }
  };

  const handleDeleteKid = async (targetKidId?: string) => {
    if (!kid?.id) return;
    try {
      await deleteKid({ id: kid.id, targetKidId }).unwrap();
      toast.success(
        targetKidId
          ? 'Niño eliminado e información transferida correctamente'
          : 'Niño eliminado correctamente'
      );
      navigate(APP_ROUTES.kidRegistration.root, { replace: true });
    } catch {
      toast.error('Error al eliminar el niño');
    }
  };

  const handleUpdateGuardian = (guardianData: any) => {
    setSelectedGuardianToUpdate(guardianData);
  };

  /**
   * Confirms and deletes the relation between the child and the selected guardian.
   * Calls DeleteKidGuardianRelation endpoint and refreshes kid details.
   *
   * @returns {Promise<void>} Resolves when relation deletion process completes.
   */
  const handleConfirmDeleteGuardianRelation = async (): Promise<void> => {
    if (!guardianRelationToDelete || !kid?.id) return;
    const targetGuardianId = guardianRelationToDelete.guardianId || guardianRelationToDelete.id;
    const guardianName = guardianRelationToDelete.fullName;

    try {
      await deleteGuardianRelation({
        kidId: kid.id,
        guardianId: targetGuardianId,
      }).unwrap();

      toast.success(`Relación con ${guardianName || `el/la ${guardianTerm.toLowerCase()}`} eliminada con éxito`);
      if (selectedGuardian === targetGuardianId) {
        setSelectedGuardian('');
      }
      await refetchKid();
    } catch (err: unknown) {
      const errorResponse = err as { data?: { message?: string }; message?: string };
      const msg = errorResponse?.data?.message || errorResponse?.message || `Error al eliminar la relación con ${guardianTerm.toLowerCase()}`;
      toast.error(msg);
    } finally {
      setGuardianRelationToDelete(null);
    }
  };

  const specialGroup = kidGroups.find((g) => g.type === KidGroupType.SPECIAL || g.name === 'Yo Soy Iglekids') || kidGroups[0];
  const specialGroupName = specialGroup?.name || 'Servidor Infantil';

  const displayedGroupName = isRegistered
    ? (kid?.currentKidRegistration?.groupId !== kid?.kidGroup?.id ? specialGroupName : kid?.kidGroup?.name)
    : (isKidVolunteer ? specialGroupName : (kid?.kidGroup?.name || 'Sin grupo'));

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
              <span>{t('kidRegistration:check_in.btn_update_data')}</span>
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
              <span>{t('kidRegistration:check_in.btn_assign_guardian', { guardian: guardianTerm })}</span>
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
                  <span>{t('kidRegistration:check_in.btn_delete_kid')}</span>
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );

  const kidData = kid;

  return (
    <div className="min-h-full bg-gray-50 flex flex-col flex-1 pb-6 sm:pb-8">
      <PageHeader
        title="Detalle y Registro"
        onBack={() => navigate(APP_ROUTES.kidRegistration.root)}
        rightAction={rightMenuAction}
      />

      <div className="p-4 sm:p-6 max-w-4xl mx-auto w-full pb-16 animate-in fade-in slide-in-from-right-4 duration-300">
        {(!kidData || kidData.id !== id || (loading && !kidData.relations)) && <KidCheckInSkeleton />}

        {kidData && kidData.id === id && (!loading || !!kidData.relations) && (
          <>
            {/* Banner de cumpleaños */}
            {isBirthdayToday && (
              <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white p-3.5 rounded-2xl mb-4 flex items-center justify-center gap-2.5 text-sm font-black shadow-md animate-pulse tracking-wide">
                <Cake size={22} className="text-yellow-200 animate-bounce" />
                <span>{t('kidRegistration:check_in.birthday_banner')}</span>
              </div>
            )}

            {/* Banner de aviso si la EPS es NO SABE */}
            {isEpsUnknown && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-2xl mb-4 flex items-start gap-3 text-xs leading-relaxed shadow-xs">
                <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-bold text-amber-900 text-sm mb-0.5">⚠️ EPS no registrada ("NO SABE")</h4>
                  <p className="text-amber-800">
                    La EPS del niño se encuentra registrada como <span className="font-bold">"NO SABE"</span>. Por favor, <strong>pregunta a {guardianTerm.toLowerCase()} si ya conoce la EPS actual del niño</strong> y actualízala desde las opciones (<strong>⋮</strong>).
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
                    {t('kidRegistration:check_in.code_label')}: {kid?.faithForgeId || kid?.id}{formattedAge ? ` • ${t('kidRegistration:check_in.age_label')}: ${formattedAge}` : ''}
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
                        {t('kidRegistration:dashboard.badge_birthday')}
                      </span>
                    )}
                    {isRegistered && (
                      <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                        {t('kidRegistration:dashboard.badge_registered')}
                      </span>
                    )}
                    {!isRegistered && (
                      <button
                        type="button"
                        onClick={() => setShowVolunteerConfirmModal(true)}
                        className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-all hover:scale-105 active:scale-95 border border-gray-200"
                        title={isKidVolunteer ? "Cambiar a recibir en su salón habitual" : `Cambiar a ${specialGroupName} (Servidor)`}
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
                {t('kidRegistration:form.step_kid_info')}
              </h2>
              <div className="flex flex-col gap-y-3 text-sm">
                {formattedAge && (
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="font-semibold text-gray-500">{t('kidRegistration:check_in.age_label')}</span>
                    <span className="font-bold text-gray-800">{formattedAge}</span>
                  </div>
                )}

                {kid?.birthday && (
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="font-semibold text-gray-500">{t('kidRegistration:form.birthday_label')}</span>
                    <span className="font-bold text-gray-800">{formatDateOnly(kid.birthday)}</span>
                  </div>
                )}

                {kid?.gender && (
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="font-semibold text-gray-500">{t('kidRegistration:form.gender_label')}</span>
                    <span className="font-bold text-gray-800">{kid.gender === 'M' ? t('kidRegistration:form.gender_male') : kid.gender === 'F' ? t('kidRegistration:form.gender_female') : kid.gender}</span>
                  </div>
                )}

                {kid?.healthSecurityEntity && (
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="font-semibold text-gray-500">{t('kidRegistration:check_in.health_entity_label')}</span>
                    <span className={clsx("font-bold", isEpsUnknown ? "text-amber-700 flex items-center gap-1.5" : "text-gray-800")}>
                      {isEpsUnknown && <AlertTriangle size={15} className="text-amber-600" />}
                      {capitalizeWords(kid.healthSecurityEntity)}
                    </span>
                  </div>
                )}

                {kid?.medicalCondition && (
                  <div className="flex justify-between items-start py-1 border-b border-gray-50">
                    <span className="font-semibold text-gray-500">{t('kidRegistration:check_in.medical_condition_label')}</span>
                    <span className="font-bold text-amber-600 text-right">
                      {typeof kid.medicalCondition === 'object' ? `${kid.medicalCondition.code || ''} - ${kid.medicalCondition.name || ''}` : kid.medicalCondition}
                    </span>
                  </div>
                )}

                {kid?.observations && (
                  <div className="flex flex-col py-1">
                    <span className="font-semibold text-gray-500 mb-1">{t('kidRegistration:check_in.notes_label')}</span>
                    <span className="font-medium text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-xs leading-relaxed">
                      {kid.observations}
                    </span>
                  </div>
                )}

                {canViewCreatorInfo && kid?.createdBy && (
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="font-semibold text-gray-500">Creado por</span>
                    <span className="font-bold text-gray-800 text-right flex items-center justify-end gap-1.5 flex-wrap">
                      <span>{capitalizeWords(`${kid.createdBy.firstName || ''} ${kid.createdBy.lastName || ''}`.trim())}</span>
                      {kid.createdBy.groupName && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200 shrink-0">
                          {kid.createdBy.groupName}
                        </span>
                      )}
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
                      <span className="font-semibold text-gray-500 shrink-0 pr-2 pt-0.5">{guardianTerm} que registró</span>
                      <div className="text-right flex flex-col items-end">
                        <span className="font-bold text-gray-800">
                          {registrationGuardian ? (
                            `${registrationGuardian.fullName} (${registrationGuardian.relation})`
                          ) : (
                            kid?.currentKidRegistration?.additionalInfo?.guardianFullName || `${guardianTerm} registrado(a)`
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

                    {isSupervisor && (() => {
                      const parsed = getRegistrationLogInfo(kid?.currentKidRegistration);
                      if (!parsed) return null;
                      return (
                        <div className="flex justify-between items-start py-1.5 border-b border-gray-50 last:border-0">
                          <span className="font-semibold text-gray-500 shrink-0 pr-2">Log de registro</span>
                          <span className="font-bold text-gray-800 text-sm leading-snug text-right">
                            {`Registrado por ${parsed.author}`}
                            {parsed.badgeLabel && (
                              <span
                                className={clsx(
                                  'inline-flex items-center ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide border align-middle',
                                  parsed.badgeType === 'group' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                                  parsed.badgeType === 'support' && 'bg-amber-50 text-amber-800 border-amber-200',
                                  parsed.badgeType === 'admin' && 'bg-purple-50 text-purple-700 border-purple-200',
                                  parsed.badgeType === 'coordinator' && 'bg-blue-50 text-blue-700 border-blue-200',
                                  parsed.badgeType === 'legacy' && 'bg-gray-100 text-gray-600 border-gray-200',
                                  parsed.badgeType === 'general' && 'bg-slate-50 text-slate-700 border-slate-200',
                                )}
                              >
                                {parsed.badgeLabel}
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Tabla de Acudientes */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 border-b border-gray-100 pb-2">{guardiansTerm}</h2>
                  <div className="grid grid-cols-12 gap-x-2 gap-y-3 text-xs items-center">
                    <div className="col-span-4 font-bold text-gray-500 uppercase">Nombre</div>
                    <div className="col-span-3 font-bold text-gray-500 uppercase">Relación</div>
                    <div className={clsx(isAdmin ? 'col-span-3' : 'col-span-4', 'font-bold text-gray-500 uppercase')}>Teléfono</div>
                    <div className={clsx(isAdmin ? 'col-span-2' : 'col-span-1')}></div>

                    {relationsList.map((rel: any) => (
                      <React.Fragment key={rel.id}>
                        <div className="col-span-12 border-t border-gray-50 my-0.5"></div>
                        <div className="col-span-4 text-gray-800 font-medium leading-tight truncate" title={rel.fullName}>{rel.fullName}</div>
                        <div className="col-span-3 text-gray-600">{rel.relation}</div>
                        <div className={clsx(isAdmin ? 'col-span-3' : 'col-span-4', 'text-gray-600 flex items-center gap-1.5 flex-wrap')}>
                          <span>{rel.displayPhone}</span>
                          {rel.isPhoneErroneous && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 text-[10px] font-bold border border-amber-300" title={`Formato de teléfono errado. Por favor pregúntele el número correcto a ${guardianTerm.toLowerCase()} y corríjalo con el lápiz.`}>
                              <AlertTriangle size={11} className="text-amber-600 shrink-0" />
                              <span>Teléfono errado — Preguntar número correcto a {guardianTerm.toLowerCase()}</span>
                            </span>
                          )}
                        </div>
                        <div className={clsx(isAdmin ? 'col-span-2' : 'col-span-1', 'flex justify-end items-center gap-1.5')}>
                          <button 
                            type="button"
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
                            title={`Editar ${guardianTerm.toLowerCase()}`}
                          >
                            <Pencil size={14}/>
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => setGuardianRelationToDelete(rel)}
                              className="text-red-600 p-2 bg-red-50 hover:bg-red-100 rounded-full transition-colors"
                              title={`Eliminar relación con ${guardianTerm.toLowerCase()}`}
                            >
                              <Trash2 size={14}/>
                            </button>
                          )}
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3 mb-8">
                  <Button onClick={handleReprint} block variant="primary">
                    <Printer size={18} className="mr-2 shrink-0" /> {t('kidRegistration:check_in.btn_reprint_ticket')}
                  </Button>
                  
                  {isSupervisor && (
                    <Button onClick={handleDelete} block variant="danger">
                      <Trash2 size={18} className="mr-2 inline" /> {t('kidRegistration:check_in.btn_delete_registration')}
                    </Button>
                  )}
                </div>
              </>
            ) : (
              /* FORMULARIO DE CHECK-IN (NO REGISTRADO) */
              <>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
                  <div className="mb-5">
                    <label className="block text-xs font-bold text-gray-700 mb-3 uppercase">
                      {t('kidRegistration:form.step_guardian_info', { guardian: guardianTerm })}
                    </label>
                    <div className="flex flex-col gap-2.5">
                      {relationsList.length === 0 ? (
                        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs leading-relaxed shadow-xs">
                          <div className="flex items-start gap-2.5">
                            <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="block font-bold text-amber-950 text-sm mb-0.5">
                                No hay {guardiansTerm.toLowerCase()} registrados(as)
                              </strong>
                              <span className="text-amber-800">
                                Este niño no tiene {guardiansTerm.toLowerCase()} asignados(as). Por favor, <strong>asigna un(a) {guardianTerm.toLowerCase()}</strong> seleccionando la opción en el menú superior (<strong>⋮</strong>) o con el botón a continuación.
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowAssignGuardianModal(true)}
                            className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 self-end sm:self-center"
                          >
                            <UserPlus size={15} /> Asignar {guardianTerm}
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
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-[11px] text-gray-500 truncate">Tel: {rel.displayPhone}</p>
                                {rel.isPhoneErroneous && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100/90 text-amber-950 text-[10px] font-bold border border-amber-300" title="Teléfono con formato errado. Corregir con el lápiz antes de registrar.">
                                    <AlertTriangle size={11} className="text-amber-700 shrink-0" />
                                    <span>Teléfono errado — Preguntar número correcto a {guardianTerm.toLowerCase()}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button 
                                type="button" 
                                onClick={(e) => {
                                  e.preventDefault(); 
                                  e.stopPropagation();
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
                                title={`Editar ${guardianTerm.toLowerCase()}`}
                              >
                                <Pencil size={13}/>
                              </button>
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault(); 
                                    e.stopPropagation();
                                    setGuardianRelationToDelete(rel);
                                  }}
                                  className="text-red-600 p-1.5 bg-white rounded-full hover:bg-red-50 shadow-sm border border-gray-200 hover:border-red-200 transition-colors shrink-0"
                                  title={`Eliminar relación con ${guardianTerm.toLowerCase()}`}
                                >
                                  <Trash2 size={13}/>
                                </button>
                              )}
                            </div>
                          </label>
                        ))
                      )}
                    </div>

                    {selectedGuardianObj?.isPhoneErroneous && (
                      <div className="mt-3 bg-amber-50 border-2 border-amber-300 text-amber-950 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                          <div className="text-xs">
                            <strong className="block font-bold text-amber-950 text-sm mb-0.5">
                              Teléfono errado — Preguntar número correcto a {guardianTerm.toLowerCase()}
                            </strong>
                            <span className="text-amber-900 leading-relaxed">
                              El número registrado (<strong>{selectedGuardianObj.displayPhone}</strong>) tiene un formato errado. Por seguridad y comunicación, <strong>debes preguntarle el número correcto</strong> y actualizarlo antes de poder registrar al niño.
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleUpdateGuardian({
                            id: selectedGuardianObj.id,
                            firstName: selectedGuardianObj.firstName,
                            lastName: selectedGuardianObj.lastName,
                            fullName: selectedGuardianObj.fullName,
                            gender: selectedGuardianObj.gender,
                            dialCodePhone: selectedGuardianObj.dialCodePhone,
                            phone: selectedGuardianObj.rawPhone,
                            relation: selectedGuardianObj.rawRelation,
                            kidId: kid?.id
                          })}
                          className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 self-end sm:self-center"
                        >
                          <Pencil size={14} /> Corregir Teléfono Ahora
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <Select
                      label={t('kidRegistration:scanner.observations_select_label')}
                      value={observationType}
                      onChange={(e) => setObservationType(e.target.value)}
                    >
                      <option value="NONE">{t('kidRegistration:scanner.observations_options.none')}</option>
                      <option value="Lleva bolso">{t('kidRegistration:scanner.observations_options.has_bag')}</option>
                      <option value="Lleva merienda">{t('kidRegistration:scanner.observations_options.has_snack')}</option>
                      <option value="Lleva bolso y merienda">{t('kidRegistration:scanner.observations_options.has_bag_and_snack')}</option>
                      <option value="OTHER">{t('kidRegistration:scanner.observations_options.other')}</option>
                    </Select>

                    {observationType === 'OTHER' && (
                      <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                        <textarea 
                          className="block w-full rounded-xl border-2 border-gray-200 bg-white text-text-main py-2.5 px-3 focus:border-primary focus:ring-0 transition-colors outline-none text-base shadow-sm placeholder:text-gray-400"
                          rows={3}
                          maxLength={300}
                          placeholder={t('kidRegistration:scanner.custom_observation_placeholder')}
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

                {isSelectedGuardianPhoneInvalid && (
                  <div className="mb-4 p-3.5 bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs rounded-xl flex items-center gap-2.5 shadow-xs">
                    <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                    <span>
                      <strong className="text-amber-950">Registro bloqueado:</strong> El/La {guardianTerm.toLowerCase()} seleccionado(a) tiene un número con formato errado. Debe preguntarle el número correcto y actualizarlo para poder registrar.
                    </span>
                  </div>
                )}

                <Button 
                  onClick={handleCheckIn} 
                  block 
                  variant="primary"
                  className="mb-3"
                  loading={isProcessing}
                  loadingText={processingStep}
                  disabled={shouldBlockKids || loading || isProcessing || relationsList.length === 0 || (isOverage && !isAdmin) || isSelectedGuardianPhoneInvalid}
                >
                  <Printer size={20} className="mr-2 shrink-0" /> {t('kidRegistration:check_in.btn_confirm_checkin')}
                </Button>
                {/* Espaciador para evitar que el BottomNav flotante tape el botón */}
                <div className="h-24 sm:h-28 pointer-events-none shrink-0" aria-hidden="true" />
              </>
            )}
          </>
        )}
      </div>

      <ProcessingPrintModal 
        open={isProcessing} 
        isBluetooth={printerModeSlice?.mode === 'BLUETOOTH'} 
        stepText={processingStep} 
      />

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

      <DeleteKidModal
        open={showDeleteKidModal}
        onClose={() => setShowDeleteKidModal(false)}
        kid={kid}
        onConfirm={handleDeleteKid}
      />

      <ConfirmModal
        open={showAdminOutOfScheduleModal}
        onOpenChange={setShowAdminOutOfScheduleModal}
        title="¿Registrar fuera de horario?"
        description={`${meetingErrorMsg || 'El servicio seleccionado se encuentra fuera del horario habitual de registro.'} Como administrador, ¿deseas confirmar y proceder con el registro de este niño?`}
        confirmText="Sí, registrar"
        cancelText={t('common:actions.cancel')}
        type="warning"
        onConfirm={executeRegistration}
      />

      <ConfirmModal
        open={showVolunteerConfirmModal}
        onOpenChange={setShowVolunteerConfirmModal}
        title={`Cambiar niño a ${isKidVolunteer ? (kid?.kidGroup?.name || 'salón habitual') : specialGroupName}`}
        description={`El niño será registrado ${isKidVolunteer ? `para recibir en su salón habitual (${kid?.kidGroup?.name || 'Salón habitual'})` : `en el área de servidores (${specialGroupName})`}. Por favor confirma si deseas realizar esta acción.`}
        confirmText={t('common:actions.confirm')}
        cancelText={t('common:actions.cancel')}
        type="info"
        onConfirm={() => setIsKidVolunteer(!isKidVolunteer)}
      />

      <ConfirmModal
        open={!!guardianRelationToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setGuardianRelationToDelete(null);
          }
        }}
        title={`¿Eliminar relación de ${guardianTerm.toLowerCase()}?`}
        description={`¿Estás seguro de que deseas desvincular a ${guardianRelationToDelete?.fullName || `este(a) ${guardianTerm.toLowerCase()}`} del niño? Esta acción eliminará la relación pero mantendrá el historial de registros.`}
        confirmText="Sí, eliminar"
        cancelText={t('common:actions.cancel')}
        type="danger"
        onConfirm={handleConfirmDeleteGuardianRelation}
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
