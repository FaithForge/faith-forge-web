import React, { useMemo, useState } from 'react';
import {
  Bell,
  BellOff,
  Clock,
  CheckCheck,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { FaChild } from 'react-icons/fa6';
import clsx from 'clsx';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { AppDrawer } from '@/components/ui/AppDrawer';
import Button from '@/components/ui/Button';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { setActiveExperience } from '@/libs/state/redux/slices/user/auth.slice';
import {
  useGetInAppNotificationsQuery,
  useMarkInAppNotificationAsReadMutation,
  useRespondInAppNotificationMutation,
  useDeleteInAppNotificationMutation,
  useClearReadInAppNotificationsMutation,
} from '@/libs/state/redux/api/userApi';
import { IInAppNotification } from '@/libs/models';
import { UserExperienceEnum } from '@/libs/utils/auth';
import { capitalizeWords } from '@/libs/utils/text';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';
import { useChurchTerm, useKidsTerm } from '@/libs/hooks/useTerm';

dayjs.extend(relativeTime);
dayjs.locale('es');

/**
 * Formats notification title cleanly:
 * - For guardian responses: "Respuesta de acudiente - [Nombre del niño]"
 * - For kid registrations: "Registro: [Nombre del niño]"
 */
const getFormattedTitle = (notif: IInAppNotification, isResponse: boolean): string => {
  if (isResponse) {
    let rawKid = notif.kidName;
    if (!rawKid && notif.body) {
      const match = notif.body.match(
        /(?:por el niño|por la niña|para el niño|para la niña|para)\s+([A-Za-zÁÉÍÓÚáéíóúñÑ\s]+?)(?:\s+ubicad|\.|$)/i
      );
      if (match) rawKid = match[1].trim();
    }
    const cleanKid = rawKid ? capitalizeWords(rawKid.trim()) : '';
    return cleanKid ? `Respuesta de acudiente - ${cleanKid}` : 'Respuesta de acudiente';
  }
  if (notif.title?.startsWith('Registro:')) {
    const rawKid = notif.title.replace(/^Registro:\s*/i, '');
    return `Registro: ${capitalizeWords(rawKid)}`;
  }
  return notif.title || '';
};

interface NotificationTerms {
  kidsModuleName: string;
  meetingTerm: string;
  campusTerm: string;
}

/**
 * Renders notification body with bold formatting for names, ministry, meeting, and classroom details.
 */
const renderNotificationBody = (
  notif: IInAppNotification,
  isUrgent: boolean,
  isResponse: boolean,
  isRegistered: boolean,
  terms?: NotificationTerms
): React.ReactNode => {
  if (isResponse) {
    let guardian = notif.guardianName ? capitalizeWords(notif.guardianName) : '';
    let kid = notif.kidName ? capitalizeWords(notif.kidName) : '';
    let classroom: string = (notif.data?.classroomName as string | undefined) || notif.kidGroupName || '';

    if (!guardian || !kid) {
      const match = notif.body?.match(
        /^(?:El acudiente\s+)?(.+?)\s+confirmó que va en camino (?:para|por)\s+(?:el niño|la niña)?\s*([A-Za-zÁÉÍÓÚáéíóúñÑ\s]+?)(?:\s+ubicad.*|\.|$)/i
      );
      if (match) {
        if (!guardian) guardian = capitalizeWords(match[1].trim());
        if (!kid) kid = capitalizeWords(match[2].trim());
      }
    }

    if (!classroom && notif.body) {
      const classMatch = notif.body.match(/salón\s+([A-Za-z0-9ÁÉÍÓÚáéíóúñÑ\s]+?)(?:\.|$)/i);
      if (classMatch) {
        classroom = classMatch[1].trim();
      }
    }

    const childArticle =
      (notif.data?.childArticle as string | undefined) ||
      (notif.data?.kidGender === 'FEMALE' ? 'la niña' : 'el niño');
    const isFemale = notif.data?.kidGender === 'FEMALE' || childArticle === 'la niña';
    const locatedWord = isFemale ? 'ubicada' : 'ubicado';

    return (
      <>
        El acudiente <strong className="font-semibold text-gray-900">{guardian || 'El acudiente'}</strong> confirmó que va en camino por {childArticle}{' '}
        <strong className="font-semibold text-gray-900">{kid || 'el menor'}</strong>
        {classroom ? (
          <>
            {' '}
            {locatedWord} en el salón{' '}
            <strong className="font-semibold text-gray-900">{classroom}</strong>.
          </>
        ) : (
          '.'
        )}
      </>
    );
  }

  if (isRegistered && notif.body) {
    const cleanBody = notif.body.replace(/\s*\(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?\)/g, '');
    const meetingWord = (terms?.meetingTerm || 'servicio').toLowerCase();
    const campusWord = (terms?.campusTerm || 'sede').toLowerCase();
    const defaultMinistry = terms?.kidsModuleName || 'Iglekids';

    // Pattern 1: New format: "(kid) fue registrado en (ministry) en el (servicio|culto) de (meeting) en la sede (campus) (Salón (classroom))."
    const mNew = cleanBody.match(
      /^(.+?)\s+fue registrado en\s+(.+?)\s+en el (?:servicio|culto|reunión)\s+de\s+(.+?)(?:\s+en la sede\s+(.+?))?(?:\s*\((?:Salón\s+)?(.+?)\))?\.?$/i
    );
    if (mNew) {
      const kid = capitalizeWords(mNew[1].trim());
      const ministry = mNew[2].trim();
      const meeting = mNew[3].trim();
      const campus = mNew[4]?.trim();
      const classroom = mNew[5]?.trim();
      return (
        <>
          <strong className="font-semibold text-gray-900">{kid}</strong> fue registrado en{' '}
          <strong className="font-semibold text-gray-900">{ministry}</strong> en el {meetingWord} de{' '}
          <strong className="font-semibold text-gray-900">{meeting}</strong>
          {campus && <> en la {campusWord} {campus}</>}
          {classroom && <> (Salón {classroom})</>}.
        </>
      );
    }

    // Pattern 2: Legacy format: "(kid) fue registrado en (meeting) en la sede (campus) (Salón (classroom))."
    const mLegacy = cleanBody.match(
      /^(.+?)\s+fue registrado en\s+(.+?)(?:\s+en la sede\s+(.+?))?(?:\s*\((?:Salón\s+)?(.+?)\))?\.?$/i
    );
    if (mLegacy) {
      const kid = capitalizeWords(mLegacy[1].trim());
      const meeting = mLegacy[2].trim();
      const campus = mLegacy[3]?.trim();
      const classroom = mLegacy[4]?.trim();
      const resolvedMinistry = (notif.data as any)?.ministryName || defaultMinistry;
      return (
        <>
          <strong className="font-semibold text-gray-900">{kid}</strong> fue registrado en{' '}
          <strong className="font-semibold text-gray-900">{resolvedMinistry}</strong> en el {meetingWord} de{' '}
          <strong className="font-semibold text-gray-900">{meeting}</strong>
          {campus && <> en la {campusWord} {campus}</>}
          {classroom && <> (Salón {classroom})</>}.
        </>
      );
    }

    return cleanBody;
  }

  if (isUrgent) {
    const cleaned = notif.body?.replace(/\s*\.?\s*Motivo:\s*.*$/i, '').trim() || '';
    const normalized = cleaned.replace(/\bpara\s+(el niño|la niña)\b/gi, 'por $1');
    const cleanBody = normalized.endsWith('.') ? normalized : `${normalized}.`;
    if (notif.kidName) {
      const formattedKid = capitalizeWords(notif.kidName);
      const parts = cleanBody.split(new RegExp(`(${notif.kidName}|${formattedKid})`, 'i'));
      if (parts.length > 1) {
        return (
          <>
            {parts.map((part, idx) =>
              part.toLowerCase() === notif.kidName?.toLowerCase() ||
              part.toLowerCase() === formattedKid.toLowerCase() ? (
                <strong key={idx} className="font-semibold text-gray-900">
                  {formattedKid}
                </strong>
              ) : (
                part
              )
            )}
          </>
        );
      }
    }
    return cleanBody;
  }

  return notif.body || '';
};

interface NotificationsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experience?: UserExperienceEnum;
}

/**
 * In-app Notification Center drawer displaying alerts and check-in updates
 * scoped to the active user and segmented by experience within the last 24 hours.
 *
 * @param {NotificationsDrawerProps} props - Component properties.
 * @returns {JSX.Element} The rendered notification drawer.
 */
export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  open,
  onOpenChange,
  experience: propExperience,
}) => {
  useModalBackClose(open, () => onOpenChange(false));
  const { t } = useTranslation(['kidGuardian', 'common']);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const reduxActiveExperience = useAppSelector((state) => state.authSlice.activeExperience);

  const kidsModuleName = useKidsTerm('module_alias');
  const meetingTerm = useChurchTerm('meeting');
  const campusTerm = useChurchTerm('campus');

  // Robust experience resolution: prop > pathname > Redux state
  const activeExperience = useMemo(() => {
    if (propExperience) return propExperience;
    if (location.pathname.startsWith('/admin')) return UserExperienceEnum.ADMIN;
    if (location.pathname.startsWith('/kid-guardian')) return UserExperienceEnum.KID_GUARDIAN;
    if (
      location.pathname.startsWith('/kid-church') ||
      location.pathname.startsWith('/kid-registration')
    ) {
      return UserExperienceEnum.KID_CHURCH_STAFF;
    }
    return reduxActiveExperience || UserExperienceEnum.KID_CHURCH_STAFF;
  }, [propExperience, location.pathname, reduxActiveExperience]);

  // Proactively align Redux activeExperience when drawer opens in a specific context
  React.useEffect(() => {
    if (open && activeExperience && reduxActiveExperience !== activeExperience) {
      dispatch(setActiveExperience(activeExperience));
    }
  }, [open, activeExperience, reduxActiveExperience, dispatch]);

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useGetInAppNotificationsQuery(
    { experience: activeExperience || undefined },
    { skip: !open, refetchOnMountOrArgChange: true }
  );

  const [markAsRead] = useMarkInAppNotificationAsReadMutation();
  const [respondInAppNotification, { isLoading: isResponding }] = useRespondInAppNotificationMutation();
  const [deleteNotification] = useDeleteInAppNotificationMutation();
  const [clearReadNotifications, { isLoading: isClearingRead }] = useClearReadInAppNotificationsMutation();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const notifications = useMemo(() => data?.notifications || [], [data?.notifications]);
  const unreadCount = data?.unreadCount || 0;
  const hasReadNotifications = useMemo(() => notifications.some((n) => n.read), [notifications]);

  const handleMarkAllRead = async () => {
    const unreadList = notifications.filter((n) => !n.read);
    for (const notif of unreadList) {
      try {
        await markAsRead(notif.id).unwrap();
      } catch {
        // Continue marking remaining
      }
    }
  };

  const handleDeleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(notificationId);
    try {
      const res = await deleteNotification(notificationId).unwrap();
      if (res.success) {
        toast.success('Notificación eliminada');
      } else if (res.message) {
        toast.error(res.message);
      }
    } catch {
      toast.error('No se pudo eliminar la notificación');
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearRead = async () => {
    try {
      const res = await clearReadNotifications().unwrap();
      if (res.success) {
        toast.success(
          `${res.deletedCount} notificación${res.deletedCount !== 1 ? 'es' : ''} eliminada${res.deletedCount !== 1 ? 's' : ''}`
        );
      }
    } catch {
      toast.error('No se pudieron eliminar las notificaciones leídas');
    }
  };

  const handleQuickResponse = async (notificationId: string) => {
    try {
      await respondInAppNotification({
        notificationId,
        response: 'ON_MY_WAY',
        message: 'El acudiente va en camino',
      }).unwrap();
      toast.success('¡Aviso enviado! El equipo ya sabe que vas en camino.');
    } catch {
      toast.error('No se pudo enviar la confirmación. Por favor intenta de nuevo.');
    }
  };

  const formatRelativeTime = (isoString: string) => {
    if (!isoString) return '';
    try {
      return dayjs(isoString).fromNow();
    } catch {
      return '';
    }
  };

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={
        <div className="flex items-center gap-2">
          <span>Notificaciones</span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">
              {unreadCount} nueva{unreadCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      }
      icon={<Bell size={18} className="text-primary" />}
      maxHeight="max-h-[88dvh]"
      contentClassName="max-w-md mx-auto"
      bodyClassName="p-4 space-y-3 overflow-y-auto"
    >
      <div className="space-y-3 pb-6">
        {/* Header toolbar */}
        <div className="flex items-center justify-between text-xs text-gray-500 px-0.5">
          <span className="flex items-center gap-1 font-medium">
            <Clock size={13} className="text-gray-400" />
            Últimas 24 horas
          </span>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-primary hover:underline font-semibold cursor-pointer"
              >
                Marcar todas leídas
              </button>
            )}
            {hasReadNotifications && (
              <button
                type="button"
                onClick={handleClearRead}
                disabled={isClearingRead}
                className="text-rose-600 hover:underline font-semibold cursor-pointer"
              >
                Limpiar leídas
              </button>
            )}
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              title="Actualizar"
              className="p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors cursor-pointer"
            >
              <RefreshCw size={13} className={clsx(isFetching && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-2.5 py-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-gray-100/80 rounded-2xl animate-pulse border border-gray-100"
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && notifications.length === 0 && (
          <div className="bg-slate-50 border border-dashed border-gray-200 rounded-3xl p-8 text-center space-y-2.5 my-4">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-2xs border border-gray-100 flex items-center justify-center mx-auto text-gray-400">
              <BellOff size={24} />
            </div>
            <h4 className="text-sm font-bold text-gray-700">Sin notificaciones recientes</h4>
            <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
              Los avisos importantes y confirmaciones de registro de las últimas 24 horas aparecerán aquí.
            </p>
          </div>
        )}

        {/* Notifications list */}
        {!isLoading && notifications.length > 0 && (
          <div className="space-y-2.5">
            {notifications.map((notif: IInAppNotification) => {
              const isUrgent = notif.type === 'URGENT_NOTICE';
              const isRegistered = notif.type === 'KID_REGISTERED';
              const isResponse = notif.type === 'GUARDIAN_RESPONSE';
              const isGuardian = activeExperience === UserExperienceEnum.KID_GUARDIAN;
              const isAcknowledged = notif.status === 'ACKNOWLEDGED';

              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.read) {
                      markAsRead(notif.id);
                    }
                  }}
                  className={clsx(
                    'rounded-2xl p-3.5 border transition-all text-left relative overflow-hidden',
                    !notif.read ? 'shadow-xs' : 'opacity-85',
                    isUrgent
                      ? 'bg-rose-50/75 border-rose-200 ring-1 ring-rose-300/40'
                      : 'bg-white border-gray-200/90 hover:border-gray-300'
                  )}
                >
                  {/* Unread badge */}
                  {!notif.read && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notif.id);
                      }}
                      title="Marcar como leída"
                      className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 bg-rose-50 hover:bg-rose-100/90 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200/80 shadow-2xs transition-all cursor-pointer"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      <span>No leída</span>
                    </button>
                  )}

                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div
                      className={clsx(
                        'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs text-base select-none',
                        isUrgent
                          ? clsx('bg-rose-100 border border-rose-200 text-rose-700', !isAcknowledged && 'animate-bounce duration-1000')
                          : isResponse
                            ? 'bg-amber-50/90 border border-amber-200/80'
                            : isRegistered
                              ? 'bg-indigo-50/90 border border-indigo-100'
                              : 'bg-gray-100/90 border border-gray-200/70'
                      )}
                    >
                      {isUrgent ? (
                        <span className="text-xl leading-none" role="img" aria-label="Alerta urgente">
                          🚨
                        </span>
                      ) : isResponse ? (
                        <span className="text-xl leading-none" role="img" aria-label="En camino">
                          🏃‍♂️
                        </span>
                      ) : isRegistered ? (
                        <span className="text-xl leading-none" role="img" aria-label="Niño registrado">
                          🧒
                        </span>
                      ) : (
                        <span className="text-lg leading-none" role="img" aria-label="Notificación">
                          🔔
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex items-center justify-between gap-2">
                        <h4
                          className={clsx(
                            'text-xs font-bold leading-snug truncate',
                            isUrgent ? 'text-rose-900' : 'text-gray-900'
                          )}
                        >
                          {getFormattedTitle(notif, isResponse)}
                        </h4>
                      </div>

                      <p className="text-xs text-gray-600 leading-relaxed mt-1 font-normal break-words">
                        {renderNotificationBody(notif, isUrgent, isResponse, isRegistered, {
                          kidsModuleName,
                          meetingTerm,
                          campusTerm,
                        })}
                      </p>

                      {/* Reason badge for urgent notice */}
                      {isUrgent && notif.reason && (
                        <div className="mt-2 text-[11px] font-semibold text-rose-800 bg-rose-100/70 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                          <span>Motivo:</span>
                          <span className="font-normal">{notif.reason}</span>
                        </div>
                      )}

                      {/* Quick action for guardian on urgent notices */}
                      {isUrgent && isGuardian && (
                        <div className="mt-3 pt-2 border-t border-rose-200/60">
                          {!isAcknowledged ? (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickResponse(notif.id);
                              }}
                              loading={isResponding}
                              className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2 rounded-xl shadow-xs flex items-center justify-center gap-1.5"
                            >
                              <span>🏃‍♂️ Voy en camino</span>
                            </Button>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 bg-rose-100/90 border border-rose-200/90 px-3 py-1.5 rounded-xl">
                              <span>🏃‍♂️ Avisaste que vas en camino</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Staff view of urgent notice acknowledgment */}
                      {isUrgent && !isGuardian && (
                        <div className="mt-2.5 pt-1.5 border-t border-rose-200/60 text-[11px]">
                          {isAcknowledged ? (
                            <span className="inline-flex items-center gap-1 font-bold text-rose-800 bg-rose-100/80 px-2 py-0.5 rounded-md">
                              <span>🏃‍♂️ El acudiente va en camino</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md font-medium">
                              <Clock size={11} />
                              Esperando respuesta del acudiente
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-2.5 pt-2 border-t border-gray-100/80 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          <Clock size={10} />
                          <span>{formatRelativeTime(notif.createdAt)}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {!notif.read && !(isUrgent && isGuardian && !isAcknowledged) ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notif.id);
                              }}
                              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 active:scale-95 px-2.5 py-1 rounded-lg border border-gray-200/90 transition-all cursor-pointer shadow-2xs"
                            >
                              <CheckCheck size={13} className="text-gray-500" />
                              <span>Marcar como leída</span>
                            </button>
                          ) : notif.read ? (
                            <div className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-400 mr-1">
                              <CheckCheck size={12} className="text-gray-400" />
                              <span>Leída</span>
                            </div>
                          ) : null}

                          {/* Voluntary delete button (hidden only if urgent notice is pending response) */}
                          {!(isUrgent && !isAcknowledged) && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteNotification(notif.id, e)}
                              disabled={deletingId === notif.id}
                              title="Eliminar notificación"
                              aria-label="Eliminar notificación"
                              className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 size={13} className={clsx(deletingId === notif.id && 'animate-spin')} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppDrawer>
  );
};

export default NotificationsDrawer;
