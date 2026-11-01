import React, { useMemo, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import {
  Bell,
  BellOff,
  Clock,
  CheckCheck,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';

import {
  useGetInAppNotificationsQuery,
  useMarkInAppNotificationAsReadMutation,
  useDeleteInAppNotificationMutation,
  useClearReadInAppNotificationsMutation,
} from '@/libs/state/redux/api/userApi';
import { IInAppNotification } from '@/libs/models';
import { UserExperienceEnum } from '@/libs/utils/auth';
import { formatRelativeTime } from '@/libs/utils/date';
import { useChurchTerm, useKidsTerm } from '@/libs/hooks/useTerm';
import {
  getFormattedTitle,
  renderNotificationBody,
} from '@/components/modal/NotificationsModal';

/**
 * Anchored popover notification center tailored exclusively for the desktop and responsive Admin portal.
 * Floats beneath the bell icon without full-screen overlays or intrusive modal blocking.
 *
 * @returns {JSX.Element} The rendered admin notification popover.
 */
export const AdminNotificationsPopover: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const kidsModuleName = useKidsTerm('module_alias');
  const meetingTerm = useChurchTerm('meeting');
  const campusTerm = useChurchTerm('campus');

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useGetInAppNotificationsQuery(
    { experience: UserExperienceEnum.ADMIN },
    { refetchOnMountOrArgChange: true }
  );

  const [markAsRead] = useMarkInAppNotificationAsReadMutation();
  const [deleteNotification] = useDeleteInAppNotificationMutation();
  const [clearReadNotifications, { isLoading: isClearingRead }] = useClearReadInAppNotificationsMutation();

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

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          title="Notificaciones"
          aria-label="Notificaciones"
          className={clsx(
            'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 outline-none active:scale-95 cursor-pointer relative',
            open
              ? 'bg-slate-100 text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          )}
        >
          <Bell size={19} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center ring-2 ring-white shadow-2xs animate-in zoom-in-75">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 w-[calc(100vw-24px)] sm:w-[420px] max-w-[420px] max-h-[82vh] sm:max-h-[580px] flex flex-col z-[300] outline-none overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100/70 text-indigo-600 flex items-center justify-center shrink-0">
                <Bell size={16} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                    Notificaciones
                  </h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow-2xs">
                      {unreadCount} nueva{unreadCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                title="Actualizar"
                aria-label="Actualizar notificaciones"
                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw size={13} className={clsx(isFetching && 'animate-spin')} />
              </button>
              <Popover.Close asChild>
                <button
                  type="button"
                  title="Cerrar"
                  aria-label="Cerrar panel de notificaciones"
                  className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </Popover.Close>
            </div>
          </div>

          {/* Subheader Toolbar */}
          <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-100/80 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
            <span className="flex items-center gap-1.5 font-medium text-slate-500">
              <Clock size={12} className="text-slate-400" />
              Últimas 24 horas
            </span>
            <div className="flex items-center gap-2.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
                >
                  Marcar todas leídas
                </button>
              )}
              {hasReadNotifications && (
                <button
                  type="button"
                  onClick={handleClearRead}
                  disabled={isClearingRead}
                  className="text-rose-600 hover:text-rose-800 font-semibold hover:underline cursor-pointer"
                >
                  Limpiar leídas
                </button>
              )}
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-50/40">
            {/* Loading skeleton */}
            {isLoading && (
              <div className="space-y-2 py-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 bg-white rounded-2xl animate-pulse border border-slate-200/70"
                  />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isLoading && notifications.length === 0 && (
              <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-7 text-center space-y-2 my-2">
                <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <BellOff size={20} />
                </div>
                <h4 className="text-xs font-bold text-slate-800">Sin notificaciones recientes</h4>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Los avisos importantes y recordatorios de servicio de las últimas 24 horas aparecerán aquí.
                </p>
              </div>
            )}

            {/* Notifications list */}
            {!isLoading && notifications.length > 0 && (
              <div className="space-y-2">
                {notifications.map((notif: IInAppNotification) => {
                  const isUrgent = notif.type === 'URGENT_NOTICE';
                  const isRegistered = notif.type === 'KID_REGISTERED';
                  const isResponse = notif.type === 'GUARDIAN_RESPONSE';
                  const isServiceReminder =
                    notif.type === 'SERVICE_REMINDER' || (notif.data as any)?.type === 'SERVICE_REMINDER';

                  return (
                    <div
                      key={notif.id}
                      onClick={() => {
                        if (!notif.read) {
                          markAsRead(notif.id);
                        }
                      }}
                      className={clsx(
                        'rounded-2xl p-3 border transition-all text-left relative overflow-hidden group cursor-pointer',
                        !notif.read ? 'shadow-2xs' : 'opacity-85',
                        isUrgent
                          ? 'bg-rose-50/75 border-rose-200'
                          : isServiceReminder
                            ? 'bg-white hover:bg-indigo-50/30 border-slate-200/90 hover:border-indigo-200'
                            : 'bg-white border-slate-200/80 hover:border-slate-300'
                      )}
                    >
                      {/* Unread indicator */}
                      {!notif.read && (
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-rose-50 text-rose-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-rose-200/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                          <span>No leída</span>
                        </div>
                      )}

                      <div className="flex items-start gap-2.5">
                        {/* Icon */}
                        <div
                          className={clsx(
                            'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs text-sm select-none',
                            isUrgent
                              ? 'bg-rose-100 border border-rose-200 text-rose-700'
                              : isResponse
                                ? 'bg-amber-50 border border-amber-200'
                                : isRegistered
                                  ? 'bg-indigo-50 border border-indigo-100'
                                  : isServiceReminder
                                    ? 'bg-indigo-100/80 border border-indigo-200 text-indigo-700'
                                    : 'bg-slate-100 border border-slate-200/70'
                          )}
                        >
                          {isUrgent ? (
                            <span role="img" aria-label="Alerta">🚨</span>
                          ) : isResponse ? (
                            <span role="img" aria-label="En camino">🏃‍♂️</span>
                          ) : isRegistered ? (
                            <span role="img" aria-label="Registro">🧒</span>
                          ) : isServiceReminder ? (
                            <span role="img" aria-label="Recordatorio">🗓️</span>
                          ) : (
                            <span role="img" aria-label="Aviso">🔔</span>
                          )}
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1 pr-1">
                          <h4
                            className={clsx(
                              'text-xs font-bold leading-snug truncate pr-14',
                              isUrgent
                                ? 'text-rose-900'
                                : isServiceReminder
                                  ? 'text-indigo-950 font-extrabold'
                                  : 'text-slate-900'
                            )}
                          >
                            {getFormattedTitle(notif, isResponse)}
                          </h4>

                          <div className="text-xs text-slate-600 leading-relaxed mt-1 font-normal break-words">
                            {renderNotificationBody(notif, isUrgent, isResponse, isRegistered, {
                              kidsModuleName,
                              meetingTerm,
                              campusTerm,
                            })}
                          </div>

                          <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                              <Clock size={10} />
                              <span>{formatRelativeTime(notif.createdAt)}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {!notif.read ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notif.id);
                                  }}
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100/80 hover:bg-slate-200/70 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                                >
                                  <CheckCheck size={11} className="text-slate-500" />
                                  <span>Marcar leída</span>
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 mr-1">
                                  <CheckCheck size={11} className="text-slate-400" />
                                  <span>Leída</span>
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={(e) => handleDeleteNotification(notif.id, e)}
                                disabled={deletingId === notif.id}
                                title="Eliminar notificación"
                                aria-label="Eliminar notificación"
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <Trash2 size={12} className={clsx(deletingId === notif.id && 'animate-spin')} />
                              </button>
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
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default AdminNotificationsPopover;