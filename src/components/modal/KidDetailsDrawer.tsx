import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import AppDrawer from '@/components/ui/AppDrawer';
import Button from '@/components/ui/Button';
import { X, Cake, Phone, AlertTriangle, Eye, CheckCircle2, FileText, BellRing } from 'lucide-react';
import { FaWhatsapp, FaChild, FaChildDress } from 'react-icons/fa6';
import dayjs from 'dayjs';
import clsx from 'clsx';
import { toast } from 'sonner';
import TagKidGroup from '@/components/ui/TagKidGroup';
import ModalOverlay from '@/components/ui/ModalOverlay';
import {
  IKid,
  USER_GENDER_CODE_MAPPER,
  KID_RELATION_CODE_MAPPER,
  IKidGuardian,
  KidGuardianRelationCodeEnum,
  VolunteerRole,
} from '@/libs/models';
import { capitalizeWords } from '@/libs/utils/text';
import { parseRegistrationLog } from '@/libs/utils/registrationLog';
import { formatPhoneDisplay, isPhoneValid } from '@/libs/utils/phone';
import { formatDateOnly, isDateToday } from '@/libs/utils/date';
import { isKidOverage, KID_AGE_COPY } from '@/libs/common-types/constants';
import { useAppSelector } from '@/libs/state/redux/hooks';
import { UserRole, ChurchRole, AppRole, ALL_SYSTEM_ROLES_METADATA } from '@/libs/utils/auth';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';
import { useChurchTerm, useKidsTerm } from '@/libs/hooks/useTerm';
import { useGetKidQuery, useSendUrgentGuardianNoticeMutation } from '@/libs/state/redux/api/kidChurchApi';

interface KidDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kid?: IKid;
  showEpsAlert?: boolean;
}

/**
 * Bottom sheet drawer displaying complete details of a registered kid in the kids ministry.
 * Uses the exact design language, styling, and card layout from KidCheckInView.
 *
 * @param {KidDetailsDrawerProps} props - Open state, kid data, and optional showEpsAlert override.
 * @returns {JSX.Element | null}
 */
const KidDetailsDrawer: React.FC<KidDetailsDrawerProps> = ({
  open,
  onOpenChange,
  kid: propKid,
  showEpsAlert,
}) => {
  const { t } = useTranslation(['kidChurch', 'common']);
  useModalBackClose(open, () => onOpenChange(false));

  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [urgentNoticeGuardian, setUrgentNoticeGuardian] = useState<IKidGuardian | null>(null);
  const [urgentReasonPreset, setUrgentReasonPreset] = useState<string>('presence');
  const [urgentCustomReason, setUrgentCustomReason] = useState<string>('');
  const [sendUrgentNotice, { isLoading: isSendingUrgentNotice }] = useSendUrgentGuardianNoticeMutation();

  const currentMeeting = useAppSelector((state) => state.churchMeetingSlice.current);
  const shouldFetchDetails = Boolean(open && propKid?.id && (!propKid?.relations || propKid.relations.length === 0));

  const { data: fetchedKid, isFetching: loadingFullKid } = useGetKidQuery(
    { id: propKid?.id || '', registrationChurchMeetingId: currentMeeting?.id },
    { skip: !shouldFetchDetails }
  );

  const kid = fetchedKid || propKid;

  const user = useAppSelector((state) => state.authSlice.user);
  const currentRole = useAppSelector((state) => state.authSlice.currentRole);
  const activeVolunteerRole = useAppSelector(
    (state) => state.volunteerContextSlice.activeVolunteerRole,
  );
  const userRoles = (user?.roles as AppRole[]) || [];

  const kidsModuleName = useKidsTerm('module_alias');
  const kidsTeacherTerm = useKidsTerm('teacher');
  const guardianTerm = useKidsTerm('guardian');
  const guardiansTerm = useKidsTerm('guardians');
  const churchVolunteerTerm = useChurchTerm('volunteer');

  const canViewCreatorInfo =
    userRoles.includes(UserRole.SUPER_ADMIN) ||
    userRoles.includes(UserRole.ADMIN) ||
    userRoles.includes(UserRole.KID_REGISTER_ADMIN) ||
    currentRole === UserRole.SUPER_ADMIN ||
    currentRole === UserRole.ADMIN ||
    (currentRole as any) === ChurchRole.MINISTRY_ADMIN ||
    currentRole === UserRole.KID_REGISTER_ADMIN ||
    activeVolunteerRole === VolunteerRole.AREA_GENERAL_COORDINATOR;

  const registeredGuardianId = kid?.currentKidRegistration?.guardianId;
  const kidRelations = kid?.relations;

  // Find the guardian who performed check-in today
  const primaryGuardian = useMemo(() => {
    if (!registeredGuardianId || !kidRelations) return null;
    return (
      kidRelations.find(
        (rel) => rel.id === registeredGuardianId || (rel as any).guardian?.id === registeredGuardianId,
      ) || null
    );
  }, [kidRelations, registeredGuardianId]);

  // Other authorized guardians
  const otherGuardians = useMemo(() => {
    if (!kidRelations) return [];
    if (!primaryGuardian) return kidRelations;
    return kidRelations.filter(
      (rel) => rel.id !== primaryGuardian.id && (rel as any).guardian?.id !== primaryGuardian.id,
    );
  }, [kidRelations, primaryGuardian]);

  if (!kid) return null;

  const isOverage = isKidOverage(kid);
  const isRegistered = !!kid.currentKidRegistration;

  const senderName = user ? capitalizeWords(`${user.firstName || ''} ${user.lastName || ''}`.trim()) : `un(a) ${churchVolunteerTerm.toLowerCase()}`;
  let roleTitle = churchVolunteerTerm;
  if (currentRole === UserRole.KID_GROUP_USER) {
    roleTitle = kidsTeacherTerm;
  } else if (currentRole === UserRole.KID_REGISTER_USER) {
    roleTitle = churchVolunteerTerm;
  } else if (currentRole === UserRole.KID_GROUP_SUPERVISOR || currentRole === UserRole.KID_REGISTER_SUPERVISOR) {
    roleTitle = 'Supervisor(a)';
  } else if (currentRole === UserRole.KID_GROUP_ADMIN || currentRole === UserRole.KID_REGISTER_ADMIN) {
    roleTitle = 'Coordinador(a)';
  } else if (currentRole === UserRole.ADMIN || currentRole === UserRole.SUPER_ADMIN || (currentRole as any) === ChurchRole.MINISTRY_ADMIN) {
    roleTitle = 'Administrador(a)';
  } else if (currentRole && ALL_SYSTEM_ROLES_METADATA[currentRole as AppRole]?.name) {
    roleTitle = ALL_SYSTEM_ROLES_METADATA[currentRole as AppRole].name;
  }

  // Supervisor+ can see the registration log
  const isSupervisor =
    currentRole === UserRole.KID_REGISTER_SUPERVISOR ||
    currentRole === UserRole.KID_REGISTER_ADMIN ||
    currentRole === UserRole.KID_GROUP_ADMIN ||
    currentRole === UserRole.KID_GROUP_SUPERVISOR ||
    currentRole === UserRole.ADMIN ||
    currentRole === UserRole.SUPER_ADMIN ||
    (currentRole as any) === ChurchRole.MINISTRY_ADMIN;

  const isBirthdayToday = isDateToday(kid.birthday);

  const birthdayFormatted = formatDateOnly(kid.birthday);

  const formattedAge = kid.age != null
    ? `${Math.floor(kid.age)} años${kid.ageInMonths ? ` y ${kid.ageInMonths - Math.floor(kid.age) * 12} meses` : ''}`
    : null;

  const isEpsUnknown = kid?.healthSecurityEntity?.trim()?.toUpperCase() === 'NO SABE';

  // La alerta de EPS "NO SABE" solo aplica para el personal de registro de niños (quienes reciben a los acudientes).
  // No debe mostrarse a coordinadores de grupo, supervisores de iglekids o maestros de salón.
  const isRegisterRole =
    currentRole === UserRole.KID_REGISTER_USER ||
    currentRole === UserRole.KID_REGISTER_SUPERVISOR ||
    currentRole === UserRole.KID_REGISTER_ADMIN;

  const shouldShowEpsAlert = showEpsAlert ?? isRegisterRole;

  const registrationObservation =
    kid?.currentKidRegistration?.observation ||
    (kid?.currentKidRegistration as any)?.observations ||
    (kid?.currentKidRegistration as any)?.additionalInfo?.observation ||
    (kid?.currentKidRegistration as any)?.additionalInfo?.observations;


  const handleOpenUrgentNotice = (g: IKidGuardian) => {
    setUrgentNoticeGuardian(g);
    setUrgentReasonPreset('presence');
    setUrgentCustomReason('');
  };

  const handleSendUrgentNotice = async () => {
    if (!urgentNoticeGuardian || !kid?.id) return;

    const guardianActual = (urgentNoticeGuardian as any).guardian || urgentNoticeGuardian;
    const guardianName = capitalizeWords(
      `${guardianActual.firstName || ''} ${guardianActual.lastName || ''}`.trim()
    );

    let reasonText = t('kid_details.urgent_notice_reason_presence', 'Se requiere presencia en el salón');
    if (urgentReasonPreset === 'health') {
      reasonText = t('kid_details.urgent_notice_reason_health', 'Niño indispuesto / Salud');
    } else if (urgentReasonPreset === 'crying') {
      reasonText = t('kid_details.urgent_notice_reason_crying', 'Llanto constante / Inconsolable');
    } else if (urgentReasonPreset === 'early_pickup') {
      reasonText = t('kid_details.urgent_notice_reason_early_pickup', 'Retiro anticipado del menor');
    } else if (urgentReasonPreset === 'custom') {
      reasonText = urgentCustomReason.trim() || t('kid_details.urgent_notice_reason_presence', 'Se requiere presencia en el salón');
    }

    try {
      const res = await sendUrgentNotice({
        guardianId: guardianActual.id || urgentNoticeGuardian.id!,
        kidId: kid.id,
        reason: reasonText,
      }).unwrap();

      if (res.delivered) {
        toast.success(
          t('kid_details.urgent_notice_toast_success', {
            guardian: guardianName,
            defaultValue: `¡Aviso urgente enviado al celular de ${guardianName}!`,
          })
        );
      } else {
        toast.info(res.message || t('kid_details.urgent_notice_toast_not_delivered'));
      }
      setUrgentNoticeGuardian(null);
    } catch {
      toast.error('No se pudo enviar el aviso urgente');
    }
  };

  const renderGuardianCard = (
    guardian: IKidGuardian,
    isPrimary: boolean = false,
  ) => {
    const g = (guardian as any).guardian || guardian;
    const firstName = g.firstName || guardian.firstName || '';
    const lastName = g.lastName || guardian.lastName || '';
    const fullName = capitalizeWords(`${firstName} ${lastName}`.trim());
    const rawRelation = (guardian as any).relationCode || guardian.relation || g.relation || '';
    const relationLabel = (KID_RELATION_CODE_MAPPER as any)[rawRelation as KidGuardianRelationCodeEnum] || rawRelation;
    const dialCode = g.dialCodePhone || guardian.dialCodePhone || '+57';
    const phone = g.phone || guardian.phone || '';
    const phoneFormatted = formatPhoneDisplay(phone, dialCode);
    const isPhoneErroneous = phone ? !isPhoneValid(phone, dialCode) : false;
    const rawPhone = `${dialCode}${phone}`.replace(/\s+/g, '');
    const cleanWhatsAppDigits = `${dialCode}${phone}`.replace(/\D/g, '');
    const kidName = capitalizeWords(`${kid.firstName || ''} ${kid.lastName || ''}`.trim());
    const defaultWhatsAppText = t('kid_details.whatsapp_default_message', {
      module: kidsModuleName,
      sender: senderName,
      role: roleTitle,
      kid: kidName,
    });
    const whatsappUrl = `https://wa.me/${cleanWhatsAppDigits}?text=${encodeURIComponent(defaultWhatsAppText)}`;

    return (
      <div
        key={guardian.id || `${firstName}-${lastName}`}
        className={clsx(
          "p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3",
          isPrimary
            ? "bg-emerald-50/40 border-emerald-200 shadow-2xs"
            : "bg-gray-50/70 border-gray-200/80 hover:bg-gray-100/60"
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-bold text-gray-900 text-sm truncate">
              {fullName}
            </p>
            {isPrimary && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100/90 text-emerald-800 rounded-full border border-emerald-300/80 shrink-0 flex items-center gap-1">
                <CheckCircle2 size={11} className="text-emerald-700" /> {t('kid_details.badge_checked_in_today')}
              </span>
            )}
            <span className="text-[11px] font-medium text-gray-600 bg-gray-200/70 px-2 py-0.5 rounded-md shrink-0">
              {relationLabel}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-xs font-semibold text-gray-600">
              {phoneFormatted}
            </p>
            {isPhoneErroneous && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200"
                title={t('kid_details.invalid_phone_tooltip', { guardian: guardianTerm.toLowerCase() })}
              >
                <AlertTriangle size={10} className="text-amber-600 shrink-0" />
                <span>{t('kid_details.invalid_phone_format')}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {(g.hasPushActive || guardian.hasPushActive) && (
            <button
              type="button"
              onClick={() => handleOpenUrgentNotice(guardian)}
              className="w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer group"
              title={t('kid_details.app_notice_btn_title', 'Enviar aviso urgente al celular')}
            >
              <BellRing size={15} className="group-hover:rotate-12 transition-transform" />
            </button>
          )}

          {phone && (
            <>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs hover:bg-emerald-600 active:scale-95 transition-all"
                title={t('kid_details.whatsapp_btn_title')}
              >
                <FaWhatsapp size={16} />
              </a>
              <a
                href={`tel:${rawPhone}`}
                className="w-8 h-8 rounded-full bg-gray-200/80 text-gray-700 hover:bg-gray-300 flex items-center justify-center active:scale-95 transition-all"
                title={t('kid_details.call_btn_title', { guardian: guardianTerm.toLowerCase() })}
              >
                <Phone size={15} />
              </a>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <AppDrawer
        open={open}
        onOpenChange={onOpenChange}
        title={t('kid_details.title')}
        bodyClassName="p-4 flex flex-col gap-4 pb-12"
      >
              {/* Birthday Banner */}
              {isBirthdayToday && (
                <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white p-3.5 rounded-2xl flex items-center justify-center gap-2.5 text-sm font-black shadow-md animate-pulse tracking-wide">
                  <Cake size={22} className="text-yellow-200 animate-bounce" />
                  <span>{t('kid_details.birthday_banner')}</span>
                </div>
              )}

              {/* Banner de aviso si la EPS es NO SABE (exclusivo para personal de registro) */}
              {shouldShowEpsAlert && isEpsUnknown && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-2xl flex items-start gap-3 text-xs leading-relaxed shadow-xs">
                  <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-bold text-amber-900 text-sm mb-0.5">{t('kid_details.eps_alert_title')}</h4>
                    <p className="text-amber-800">
                      {t('kid_details.eps_alert_desc')}
                    </p>
                  </div>
                </div>
              )}

              {/* Cabecera Principal del Niño (Matches KidCheckInView) */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
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
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 leading-snug break-words">
                      {capitalizeWords(`${kid.firstName || ''} ${kid.lastName || ''}`)}
                    </h3>
                    <h4 className="text-sm text-gray-500 font-medium mt-0.5">
                      {t('kid_details.code_prefix', { code: kid?.faithForgeId || kid?.id })}{formattedAge ? ` • ${t('kid_details.age_prefix', { age: formattedAge })}` : ''}
                    </h4>
                    <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                      <TagKidGroup
                        kidGroup={kid.kidGroup?.name}
                        staticGroup={kid.staticGroup}
                      />
                      {isOverage && (
                        <span className="px-2.5 py-0.5 text-xs font-bold bg-red-100 text-red-800 rounded-full border border-red-200">
                          {KID_AGE_COPY.maxAgeBadge}
                        </span>
                      )}
                      {isBirthdayToday && (
                        <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-300 flex items-center gap-1 animate-pulse">
                          {t('kid_details.badge_today')}
                        </span>
                      )}
                      {isRegistered && (
                        <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                          {t('kid_details.badge_registered')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tarjeta con Información Detallada del Niño (Datos del Niño) */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 border-b border-gray-100 pb-2">
                  {t('kid_details.section_kid_data')}
                </h2>
                <div className="flex flex-col gap-y-3 text-sm">
                  {formattedAge && (
                    <div className="flex justify-between items-center py-1 border-b border-gray-50">
                      <span className="font-semibold text-gray-500">{t('kid_details.label_age')}</span>
                      <span className="font-bold text-gray-800">{formattedAge}</span>
                    </div>
                  )}

                  {kid?.birthday && (
                    <div className="flex justify-between items-center py-1 border-b border-gray-50">
                      <span className="font-semibold text-gray-500">{t('kid_details.label_birthday')}</span>
                      <span className="font-bold text-gray-800">{birthdayFormatted}</span>
                    </div>
                  )}

                  {kid?.gender && (
                    <div className="flex justify-between items-center py-1 border-b border-gray-50">
                      <span className="font-semibold text-gray-500">{t('kid_details.label_gender')}</span>
                      <span className="font-bold text-gray-800">
                        {kid.gender === 'M' ? t('kid_details.gender_male') : kid.gender === 'F' ? t('kid_details.gender_female') : (USER_GENDER_CODE_MAPPER as any)[kid.gender] || kid.gender}
                      </span>
                    </div>
                  )}

                  {kid?.healthSecurityEntity && (
                    <div className="flex justify-between items-center py-1 border-b border-gray-50">
                       <span className="font-semibold text-gray-500">{t('kid_details.label_eps')}</span>
                       <span
                         className={clsx(
                           'font-bold',
                           shouldShowEpsAlert && isEpsUnknown
                             ? 'text-amber-700 flex items-center gap-1.5'
                             : 'text-gray-800'
                         )}
                       >
                         {shouldShowEpsAlert && isEpsUnknown && (
                           <AlertTriangle size={15} className="text-amber-600" />
                         )}
                         {capitalizeWords(kid.healthSecurityEntity)}
                       </span>
                     </div>
                   )}

                  {kid?.medicalCondition && (
                    <div className="flex justify-between items-start py-1 border-b border-gray-50">
                      <span className="font-semibold text-gray-500">{t('kid_details.label_medical_condition')}</span>
                      <span className="font-bold text-amber-600 text-right">
                        {typeof kid.medicalCondition === 'object' ? `${kid.medicalCondition.code || ''} - ${kid.medicalCondition.name || ''}` : kid.medicalCondition}
                      </span>
                    </div>
                  )}

                  {kid?.observations && (
                    <div className="flex flex-col py-1">
                      <span className="font-semibold text-gray-500 mb-1">{t('kid_details.label_general_obs')}</span>
                      <span className="font-medium text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-xs leading-relaxed">
                        {kid.observations}
                      </span>
                    </div>
                  )}

                  {canViewCreatorInfo && kid?.createdBy && (
                    <div className="flex justify-between items-center py-1 border-b border-gray-50">
                      <span className="font-semibold text-gray-500">{t('kid_details.label_created_by')}</span>
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

              {/* Información del Registro (Si está registrado hoy) */}
              {kid.currentKidRegistration && (
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 border-b border-gray-100 pb-2">
                    {t('kid_details.section_registration_info')}
                  </h2>
                  <div className="flex flex-col gap-y-3 text-sm">
                    <div className="flex justify-between items-center py-1 border-b border-gray-50">
                      <span className="font-semibold text-gray-500">{t('kid_details.label_check_in_time')}</span>
                      <span className="font-bold text-gray-800 text-right">
                        {dayjs(kid.currentKidRegistration.date).format('h:mm:ss A (D [de] MMMM)')}
                      </span>
                    </div>

                      {isSupervisor && kid.currentKidRegistration.log && (() => {
                        const parsed = parseRegistrationLog(kid.currentKidRegistration.log);
                        return (
                          <div className="flex justify-between items-start py-1 border-b border-gray-50 last:border-0">
                            <span className="font-semibold text-gray-500 shrink-0 pr-2">{t('kid_details.label_registration_log')}</span>
                            <span className="font-bold text-gray-800 text-xs leading-snug text-right">
                              {parsed?.author ? t('kid_details.registered_by', { author: parsed.author }) : kid.currentKidRegistration.log}
                              {parsed?.badgeLabel && (
                                <span
                                  className={clsx(
                                    'inline-flex items-center ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border align-middle',
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

                    {registrationObservation && (
                      <div className="flex flex-col py-1 border-b border-gray-50 last:border-0">
                        <span className="font-semibold text-gray-500 mb-1">{t('kid_details.label_entry_obs')}</span>
                        <span className="font-medium text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-xs leading-relaxed">
                          {registrationObservation}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Acudientes Autorizados */}
              {loadingFullKid && (
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                  <div className="h-20 bg-gray-50 rounded-xl" />
                </div>
              )}

              {kid.relations && kid.relations.length > 0 && (
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3.5">
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-2">
                    {t('kid_details.section_guardians', { guardians: guardiansTerm })}
                  </h2>

                  <div className="flex flex-col gap-2.5">
                    {/* Acudiente principal que realizó el registro hoy */}
                    {primaryGuardian && renderGuardianCard(primaryGuardian, true)}

                    {/* Otros acudientes autorizados */}
                    {otherGuardians.length > 0 && (
                      <>
                        {primaryGuardian && (
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-1 px-1">
                            {t('kid_details.other_guardians', { guardians: guardiansTerm.toLowerCase() })}
                          </p>
                        )}
                        {otherGuardians.map((guardian) => renderGuardianCard(guardian, false))}
                      </>
                    )}
                  </div>
                </div>
              )}
      </AppDrawer>

      {/* Modal de Foto Grande (Zoom) */}
      <ModalOverlay open={showPhotoModal} onClose={() => setShowPhotoModal(false)}>
        <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl max-w-sm w-full mx-auto p-4 flex flex-col items-center">
          <button
            type="button"
            onClick={() => setShowPhotoModal(false)}
            className="absolute top-4 right-4 z-10 w-9 h-9 bg-black/40 text-white rounded-full flex items-center justify-center hover:bg-black/60 active:scale-95 transition-all"
          >
            <X size={18} />
          </button>
          <div className="w-full aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-inner flex items-center justify-center">
            <img
              src={kid.photoUrl}
              alt={kid.firstName}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="mt-3 text-center">
            <h4 className="font-bold text-gray-900 text-base">
              {capitalizeWords(`${kid.firstName || ''} ${kid.lastName || ''}`.trim())}
            </h4>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              {kid.faithForgeId ? t('kid_details.code_prefix', { code: kid.faithForgeId }) : ''}
            </p>
          </div>
        </div>
      </ModalOverlay>

      {/* Modal de Aviso Urgente al Celular */}
      <ModalOverlay open={!!urgentNoticeGuardian} onClose={() => setUrgentNoticeGuardian(null)}>
        <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl max-w-sm w-full mx-auto p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <BellRing size={16} />
              </div>
              <h3 className="font-bold text-gray-900 text-base">
                {t('kid_details.urgent_notice_modal_title', 'Aviso Urgente al Celular')}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setUrgentNoticeGuardian(null)}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {urgentNoticeGuardian && (() => {
            const g = (urgentNoticeGuardian as any).guardian || urgentNoticeGuardian;
            const guardianName = capitalizeWords(`${g.firstName || ''} ${g.lastName || ''}`.trim());
            const kidName = capitalizeWords(`${kid.firstName || ''} ${kid.lastName || ''}`.trim());
            const groupName = kid.kidGroup?.name || (kid.currentKidRegistration as any)?.kidGroup?.name;

            return (
              <div className="mt-3 flex flex-col gap-3">
                <p className="text-xs text-gray-500">
                  {t('kid_details.urgent_notice_modal_desc', { guardian: guardianName })}
                </p>

                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-xs flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">{t('kid_details.urgent_notice_recipient')}:</span>
                    <span className="font-bold text-gray-800">{guardianName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">{t('kid_details.urgent_notice_kid')}:</span>
                    <span className="font-bold text-gray-800">{kidName}</span>
                  </div>
                  {groupName && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">{t('kid_details.urgent_notice_classroom')}:</span>
                      <span className="font-bold text-gray-800">{groupName}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">
                    {t('kid_details.urgent_notice_reason_label', 'Motivo del llamado')}
                  </label>
                  <select
                    value={urgentReasonPreset}
                    onChange={(e) => setUrgentReasonPreset(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="presence">{t('kid_details.urgent_notice_reason_presence')}</option>
                    <option value="health">{t('kid_details.urgent_notice_reason_health')}</option>
                    <option value="crying">{t('kid_details.urgent_notice_reason_crying')}</option>
                    <option value="early_pickup">{t('kid_details.urgent_notice_reason_early_pickup')}</option>
                    <option value="custom">{t('kid_details.urgent_notice_reason_custom')}</option>
                  </select>

                  {urgentReasonPreset === 'custom' && (
                    <input
                      type="text"
                      value={urgentCustomReason}
                      onChange={(e) => setUrgentCustomReason(e.target.value)}
                      placeholder={t('kid_details.urgent_notice_custom_placeholder')}
                      className="mt-1 w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      maxLength={100}
                    />
                  )}
                </div>

                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="flex-1 text-xs py-2"
                    onClick={() => setUrgentNoticeGuardian(null)}
                    disabled={isSendingUrgentNotice}
                  >
                    {t('kid_details.urgent_notice_btn_cancel', 'Cancelar')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="flex-1 text-xs py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold"
                    onClick={handleSendUrgentNotice}
                    disabled={isSendingUrgentNotice}
                  >
                    {isSendingUrgentNotice
                      ? t('kid_details.urgent_notice_sending', 'Enviando...')
                      : t('kid_details.urgent_notice_btn_send', 'Enviar aviso urgente')}
                  </Button>
                </div>
              </div>
            );
          })()}
        </div>
      </ModalOverlay>
    </>
  );
};

export default KidDetailsDrawer;

