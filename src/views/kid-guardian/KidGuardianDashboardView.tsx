import React, { useEffect, useMemo, useState } from 'react';
import { QRCode } from 'react-qrcode-logo';
import {
  QrCode,
  AlertCircle,
  Clock,
  CheckCircle2,
  X,
  RefreshCw,
  Calendar,
  Activity,
  MapPin,
  DoorOpen,
  FileText,
  BellRing,
} from 'lucide-react';
import { FaChild, FaChildDress } from 'react-icons/fa6';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAppSelector } from '@/libs/state/redux/hooks';
import { useGetMyGuardianAssignedKidsQuery } from '@/libs/state/redux/api/kidChurchApi';
import { useKidGuardianLiveSync } from '@/libs/hooks/useKidGuardianLiveSync';
import {
  isPushNotificationSupported,
  getExistingPushSubscription,
  getPushPermissionState,
  requestAndSyncPushSubscription,
} from '@/libs/utils/notifications/webPush';
import { KidGuardianRelationEnum } from '@/libs/models/KidChurch';
import { useChurchTerm, useKidsTerm } from '@/libs/hooks/useTerm';
import { capitalizeWords } from '@/libs/utils/text';
import { formatDateOnly } from '@/libs/utils/date';
import Button from '@/components/ui/Button';

/**
 * Dashboard for the Kid Guardian (Acudiente) experience.
 * Displays the guardian's personal QR check-in code and the list of linked children.
 *
 * @returns {JSX.Element} The rendered Kid Guardian dashboard.
 */
const KidGuardianDashboardView: React.FC = () => {
  const { t } = useTranslation(['kidGuardian', 'common']);
  const authUser = useAppSelector((state) => state.authSlice.user);
  const kidsModuleName = useKidsTerm('module_alias');
  const guardianTerm = useKidsTerm('guardian');
  const classroomTerm = useKidsTerm('classroom');
  const campusTerm = useChurchTerm('campus');
  const meetingTerm = useChurchTerm('meeting');

  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [isSubscribingPush, setIsSubscribingPush] = useState(false);

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useGetMyGuardianAssignedKidsQuery();

  const guardian = data?.guardian;
  const rawKids = data?.kids || [];

  const kids = useMemo(() => {
    return [...rawKids].sort((a, b) => {
      const aRegistered = Boolean(a.todayRegistration);
      const bRegistered = Boolean(b.todayRegistration);

      // 1. Si un niño está registrado hoy, se posiciona de primero
      if (aRegistered && !bRegistered) return -1;
      if (!aRegistered && bRegistered) return 1;

      // 2. Por defecto / desempate: orden alfabético de A a Z por nombre
      const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim().toLowerCase();
      const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim().toLowerCase();
      return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
    });
  }, [rawKids]);
  const qrValue = guardian?.qrCodeValue || guardian?.id || authUser?.id || '';
  const firstName = guardian?.firstName || authUser?.firstName || '';
  const lastName = guardian?.lastName || authUser?.lastName || '';
  const guardianFullName = firstName || lastName
    ? `${capitalizeWords(firstName)} ${capitalizeWords(lastName)}`.trim()
    : '';
  const guardianPhone = guardian?.phone || authUser?.phone || '';
  const guardianDialCode = guardian?.dialCodePhone || authUser?.dialCodePhone || '+57';

  // Check existing push subscription
  useEffect(() => {
    if (isPushNotificationSupported()) {
      getExistingPushSubscription().then((sub) => {
        setPushSubscribed(Boolean(sub) && getPushPermissionState() === 'granted');
      });
    }
  }, []);

  // Realtime Live Sync via SSE
  useKidGuardianLiveSync({
    guardianId: guardian?.id,
    enabled: Boolean(guardian?.id),
  });

  const handleActivatePush = async () => {
    setIsSubscribingPush(true);
    try {
      const success = await requestAndSyncPushSubscription();
      if (success) {
        setPushSubscribed(true);
        toast.success(
          t(
            'kidGuardian:dashboard.push_activated_toast',
            '¡Notificaciones activadas! Te avisaremos cuando tus niños ingresen.'
          )
        );
      } else {
        if (getPushPermissionState() === 'denied') {
          toast.error(
            'Las notificaciones están bloqueadas en tu navegador. Puedes habilitarlas en la configuración del sitio.'
          );
        } else {
          toast.error('No se concedieron permisos de notificación.');
        }
      }
    } catch (err) {
      console.warn('Push subscription failed:', err);
      toast.error('Ocurrió un problema al activar las notificaciones.');
    } finally {
      setIsSubscribingPush(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">
          {t('kidGuardian:dashboard.loading', 'Cargando tu información...')}
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm text-center flex flex-col items-center gap-3 my-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800">
            {t('kidGuardian:dashboard.error_title', 'No pudimos cargar tus datos')}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            {t(
              'kidGuardian:dashboard.error_desc',
              'Ocurrió un problema al consultar tus niños asignados. Por favor verifica tu conexión.',
            )}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => refetch()}
          loading={isFetching}
          className="mt-2 text-xs"
        >
          <RefreshCw className="w-4 h-4 mr-1.5 inline" />
          {t('common:actions.retry', 'Reintentar')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300">
      {/* Guardian Digital ID Pass / QR Card */}
      <section className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-sky-700 rounded-3xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden">
        {/* Background glow decoration */}
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -left-8 -top-8 w-28 h-28 bg-sky-400/20 rounded-full blur-lg pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-200 mb-0.5">
            {t('kidGuardian:dashboard.digital_pass_title', {
              module: kidsModuleName,
              defaultValue: `Carnet Digital · ${kidsModuleName}`,
            })}
          </span>
          <h2 className="text-base sm:text-lg font-black text-white truncate max-w-full">
            {guardianFullName || guardianTerm}
          </h2>
          {guardianPhone && (
            <p className="text-[11px] text-indigo-100/90 font-medium">
              {t('kidGuardian:dashboard.phone_label', {
                dialCode: guardianDialCode,
                phone: guardianPhone,
                defaultValue: `Tel: ${guardianDialCode} ${guardianPhone}`,
              })}
            </p>
          )}

          {/* QR Code Container */}
          <div className="mt-3 p-2 bg-white rounded-2xl shadow-sm relative">
            {qrValue ? (
              <QRCode
                value={qrValue}
                size={215}
                qrStyle="squares"
                fgColor="#0f172a"
                bgColor="#ffffff"
                ecLevel="M"
                quietZone={5}
              />
            ) : (
              <div className="w-[215px] h-[215px] flex items-center justify-center text-slate-400">
                <QrCode className="w-10 h-10 animate-pulse" />
              </div>
            )}
          </div>

          <p className="text-[11px] text-indigo-100/90 font-medium mt-2 flex items-center gap-1.5 justify-center">
            <QrCode className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
            {t(
              'kidGuardian:dashboard.show_code_hint',
              'Muestra este código al llegar a la estación de registro',
            )}
          </p>
        </div>
      </section>

      {/* Push Notification Card - Only prompt when not yet subscribed */}
      {isPushNotificationSupported() && !pushSubscribed && (
        <div className="bg-white rounded-2xl p-3.5 border border-indigo-100 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
              <BellRing className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-slate-900 leading-tight">
                {t('kidGuardian:dashboard.enable_push_title', 'Notificaciones en tu celular')}
              </h4>
              <p className="text-[11px] text-slate-600 font-medium leading-snug mt-0.5">
                {t(
                  'kidGuardian:dashboard.enable_push_desc',
                  'Mantente informado al instante sobre el registro de tus niños.'
                )}
              </p>
            </div>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={handleActivatePush}
            loading={isSubscribingPush}
            className="shrink-0 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold px-3 py-1.5 rounded-xl cursor-pointer"
          >
            {t('kidGuardian:dashboard.enable_push_button', 'Activar avisos')}
          </Button>
        </div>
      )}

      {/* Children Section */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
              {t('kidGuardian:dashboard.section_assigned_kids', 'Niños asignados')}
            </h3>
            <p className="text-xs text-slate-700 font-medium">
              {t('kidGuardian:dashboard.linked_to_profile', {
                guardian: guardianTerm.toLowerCase(),
                defaultValue: `Vinculados a tu perfil de ${guardianTerm.toLowerCase()}`,
              })}
            </p>
          </div>
          <span className="text-xs font-black bg-slate-200 text-slate-900 px-2.5 py-1 rounded-full">
            {kids.length === 1
              ? t('kidGuardian:dashboard.count_kids_one', { count: kids.length, defaultValue: '1 niño' })
              : t('kidGuardian:dashboard.count_kids_other', {
                  count: kids.length,
                  defaultValue: `${kids.length} niños`,
                })}
          </span>
        </div>

        {kids.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
              <FaChild className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">
                {t('kidGuardian:dashboard.empty_kids_title', 'Sin niños vinculados aún')}
              </h4>
              <p className="text-xs text-slate-700 mt-1 max-w-xs leading-relaxed">
                {t('kidGuardian:dashboard.empty_kids_desc', {
                  module: kidsModuleName,
                  defaultValue: `No tienes niños registrados a tu nombre todavía. Acércate a la estación de registro de ${kidsModuleName} para asociar a tus hijos.`,
                })}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {kids.map((kid) => {
              const isGirl = kid.gender === 'F';
              const kidFullName = `${capitalizeWords(kid.firstName)} ${capitalizeWords(kid.lastName)}`;
              const isCheckedInToday = Boolean(kid.todayRegistration);

              return (
                <article
                  key={kid.id}
                  className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs flex flex-col gap-2.5 hover:border-slate-300 transition-all text-slate-900"
                >
                  {/* Top Row: Avatar + Name + Compact Details + Status Badge */}
                  <div className="flex items-start gap-3">
                    {/* Kid Avatar - Compact w-10 h-10 */}
                    <div
                      className={clsx(
                        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden shadow-2xs mt-0.5',
                        isGirl
                          ? 'bg-rose-50 text-rose-600 border border-rose-200'
                          : 'bg-sky-50 text-sky-600 border border-sky-200',
                      )}
                    >
                      {kid.photoUrl ? (
                        <img
                          src={kid.photoUrl}
                          alt={kidFullName}
                          className="w-full h-full object-cover"
                        />
                      ) : isGirl ? (
                        <FaChildDress className="w-5 h-5" />
                      ) : (
                        <FaChild className="w-5 h-5" />
                      )}
                    </div>

                    {/* Kid Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-base font-bold text-slate-900 break-words leading-tight">
                          {kidFullName}
                        </h4>
                        {/* Status Badge */}
                        <div className="shrink-0 mt-0.5">
                          {isCheckedInToday ? (
                            kid.todayRegistration?.isMeetingFinished ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-full">
                                <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                {t('kidGuardian:dashboard.status_meeting_finished', 'Servicio concluido')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                {t('kidGuardian:dashboard.status_checked_in', 'Registrado')}
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-normal bg-slate-50 text-slate-600 border border-slate-200/80 px-2.5 py-0.5 rounded-full">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {t('kidGuardian:dashboard.status_not_checked_in', 'Sin registro hoy')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Parentesco y Edad */}
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-normal mt-1">
                        {kid.relation && (
                          <span className="text-slate-700 font-medium">
                            {KidGuardianRelationEnum[kid.relation] || kid.relation}
                          </span>
                        )}
                        {kid.age !== undefined && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span>
                              {kid.age === 1
                                ? t('kidGuardian:dashboard.year_one', '1 año')
                                : t('kidGuardian:dashboard.year_other', {
                                    count: kid.age,
                                    defaultValue: `${kid.age} años`,
                                  })}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Fecha de Nacimiento en su propia línea holgada */}
                      {kid.birthday && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {t('kidGuardian:dashboard.birthday_label', 'Fecha de nacimiento')}:
                          </span>
                          <span className="font-medium text-slate-700">
                            {formatDateOnly(kid.birthday, 'D [de] MMMM, YYYY')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Check-In Details Box (Active today) */}
                  {isCheckedInToday && kid.todayRegistration ? (
                    <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3 sm:p-3.5 flex flex-col gap-2.5">
                      {/* Header */}
                      <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-200/70">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          {kid.todayRegistration.isMeetingFinished ? (
                            <>
                              <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                              {t('kidGuardian:dashboard.status_meeting_finished', 'Servicio concluido')}
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              {t('kidGuardian:dashboard.active_checkin_title', 'Detalles del registro de hoy')}
                            </>
                          )}
                        </span>
                        {kid.todayRegistration.date && (
                          <span className="text-xs font-medium text-slate-600 bg-white border border-slate-200/80 px-2 py-0.5 rounded-md shadow-2xs">
                            {dayjs(kid.todayRegistration.date).format('h:mm A')}
                          </span>
                        )}
                      </div>

                      {/* Informative banner if meeting has ended */}
                      {kid.todayRegistration.isMeetingFinished && (
                        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-2.5 flex items-center gap-2 text-xs text-amber-900 font-medium leading-relaxed">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            {t(
                              'kidGuardian:dashboard.meeting_finished_hint',
                              'El servicio ha finalizado. Recuerda retirar a tu niño en el salón asignado.'
                            )}
                          </span>
                        </div>
                      )}

                      {/* 2-Column Grid con tipografía clara y descansada */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {/* Sede */}
                        <div className="min-w-0">
                          <span className="text-[11px] text-slate-400 font-normal block leading-tight">
                            {campusTerm}:
                          </span>
                          <span className="text-xs sm:text-sm font-medium text-slate-800 block truncate leading-snug mt-0.5">
                            {kid.todayRegistration.churchCampusName ||
                              t('kidGuardian:dashboard.default_campus_name', 'Sede actual')}
                          </span>
                        </div>

                        {/* Salón */}
                        <div className="min-w-0">
                          <span className="text-[11px] text-slate-400 font-normal block leading-tight">
                            {classroomTerm}:
                          </span>
                          <span className="text-xs sm:text-sm font-medium text-slate-800 block truncate leading-snug mt-0.5">
                            {kid.todayRegistration.groupName ||
                              kid.kidGroup?.name ||
                              t('kidGuardian:dashboard.assigned_status', 'Asignado')}
                          </span>
                        </div>

                        {/* Servicio / Reunión */}
                        <div className="min-w-0 col-span-2">
                          <span className="text-[11px] text-slate-400 font-normal block leading-tight">
                            {meetingTerm}:
                          </span>
                          <span className="text-xs sm:text-sm font-medium text-slate-800 block truncate leading-snug mt-0.5">
                            {kid.todayRegistration.churchMeetingName ||
                              t('kidGuardian:dashboard.default_service_name', 'Servicio de hoy')}
                          </span>
                        </div>
                      </div>

                      {/* Observación de registro legible */}
                      {kid.todayRegistration.observation && (
                        <div className="pt-2 border-t border-slate-200/70 flex items-baseline gap-1.5 text-xs">
                          <span className="font-medium text-slate-600 shrink-0">
                            {t('kidGuardian:dashboard.checkin_observation_label', 'Observación de registro')}:
                          </span>
                          <span className="font-normal text-slate-800 italic break-words">
                            "{kid.todayRegistration.observation}"
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Pending check-in state: compact single-row card */
                    <div className="bg-slate-50/80 border border-slate-200/70 rounded-xl px-3 py-2 flex items-center justify-between text-xs text-slate-900">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{t('kidGuardian:dashboard.status_not_checked_in', 'Sin registro hoy')}</span>
                      </div>
                      {kid.kidGroup && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-600 font-medium">
                          <DoorOpen className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>
                            {classroomTerm}: <strong className="font-bold text-slate-900">{kid.kidGroup.name}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Additional info footer (EPS & General Observations) */}
                  {(kid.healthSecurityEntity || kid.observations) && (
                    <div className="flex flex-col gap-1.5 pt-1.5 border-t border-slate-100 text-xs">
                      {kid.healthSecurityEntity && (
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                          <Activity className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>
                            {t('kidGuardian:dashboard.health_entity', 'EPS')}:{' '}
                            <span className="font-medium text-slate-700">
                              {kid.healthSecurityEntity}
                            </span>
                          </span>
                        </div>
                      )}

                      {kid.observations && (
                        <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-2.5 text-xs text-slate-900">
                          <span className="font-bold text-[10px] uppercase tracking-wide block text-amber-900 mb-0.5">
                            {t('kidGuardian:dashboard.observations', 'Observaciones del menor')}:
                          </span>
                          <p className="text-slate-800 font-medium leading-relaxed break-words">
                            {kid.observations}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default KidGuardianDashboardView;
