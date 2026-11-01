import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  BellRing,
  Send,
  Users,
  Clock,
  Loader2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import ModalOverlay from '@/components/ui/ModalOverlay';
import Button from '@/components/ui/Button';
import {
  useGetMinistryServiceRemindersPreviewQuery,
  useSendMinistryServiceRemindersMutation,
} from '@/libs/state/redux/api/churchApi';
import { IServiceReminderPreviewItem } from '@/libs/models';
import { LumbrelaDateTime } from '@/libs/utils/lumbrelaDateTime';

export interface SendServiceReminderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ministryId: string;
  ministryName: string;
}

/**
 * Formats time from 24-hour string to friendly 12-hour AM/PM string.
 *
 * @param {string} [timeStr] - Raw time string.
 * @returns {string} Formatted 12-hour AM/PM string.
 */
const formatTime = (timeStr?: string): string => {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const hour = parseInt(parts[0], 10);
  if (isNaN(hour)) return timeStr;
  const minute = parts[1];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute} ${ampm}`;
};

/**
 * Centered desktop dialog modal allowing administrators to preview and manually trigger service reminders
 * for collaborators scheduled to serve in a ministry the following day.
 *
 * @param {SendServiceReminderModalProps} props - Component properties.
 * @returns {JSX.Element} Rendered modal dialog.
 */
export const SendServiceReminderModal: React.FC<SendServiceReminderModalProps> = ({
  open,
  onOpenChange,
  ministryId,
  ministryName,
}) => {
  const { t } = useTranslation(['admin', 'common']);

  const {
    data: preview,
    isLoading: isPreviewLoading,
    refetch,
  } = useGetMinistryServiceRemindersPreviewQuery(
    { ministryId },
    { skip: !open, refetchOnMountOrArgChange: true },
  );

  const [sendReminders, { isLoading: isSending }] = useSendMinistryServiceRemindersMutation();

  const handleSend = async () => {
    if (!preview || preview.totalScheduled === 0) return;

    const toastId = toast.loading(
      t('admin:service_reminders.sending', { defaultValue: 'Enviando recordatorios...' }),
    );

    try {
      const response = await sendReminders({ ministryId }).unwrap();
      toast.success(
        t('admin:service_reminders.sent_success', {
          defaultValue: 'Se enviaron {{count}} recordatorios con éxito.',
          count: response.totalSent,
        }),
        { id: toastId },
      );
      refetch();
      onOpenChange(false);
    } catch {
      toast.error(
        t('admin:service_reminders.sent_error', {
          defaultValue: 'Ocurrió un error al despachar los recordatorios.',
        }),
        { id: toastId },
      );
    }
  };

  const formattedDate = preview?.targetDate
    ? LumbrelaDateTime(preview.targetDate).format('dddd, D [de] MMMM [de] YYYY')
    : LumbrelaDateTime().add(1, 'day').format('dddd, D [de] MMMM [de] YYYY');

  // Group collaborators by church meeting
  const collaboratorsByMeeting = React.useMemo(() => {
    const map = new Map<
      string,
      { meetingName: string; meetingTime: string; items: IServiceReminderPreviewItem[] }
    >();
    for (const item of preview?.collaborators || []) {
      const existing = map.get(item.churchMeetingId) || {
        meetingName: item.churchMeetingName,
        meetingTime: item.meetingTime,
        items: [],
      };
      existing.items.push(item);
      map.set(item.churchMeetingId, existing);
    }
    return Array.from(map.values());
  }, [preview?.collaborators]);

  return (
    <ModalOverlay
      open={open}
      onClose={() => onOpenChange(false)}
      wrapperClassName="items-center justify-center p-3 sm:p-4"
      panelClassName="max-w-xl w-full mx-auto"
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full flex flex-col max-h-[85vh] overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between shrink-0 bg-white border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
              <BellRing size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight truncate">
                {t('admin:service_reminders.modal_title', { defaultValue: 'Recordatorio de Servicio' })}
              </h2>
              <p className="text-xs text-slate-500 truncate">
                {ministryName} &bull; {formattedDate}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-white">
          {/* Ministry & Target Date Banner */}
          <div className="bg-gradient-to-r from-indigo-50/90 via-blue-50/70 to-slate-50 p-4 rounded-2xl border border-indigo-100 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <BellRing size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                  {ministryName}
                </span>
                <span className="text-[10px] font-semibold bg-indigo-100/80 text-indigo-800 px-2 py-0.5 rounded-full">
                  Experimental
                </span>
              </div>
              <p className="text-sm font-extrabold text-slate-900 mt-0.5 capitalize">
                {formattedDate}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {t('admin:service_reminders.banner_description', {
                  defaultValue:
                    'Los colaboradores recibirán una notificación en la app y una alerta Web Push en sus dispositivos.',
                })}
              </p>
            </div>
          </div>

          {/* Loading state */}
          {isPreviewLoading && (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
              <Loader2 size={28} className="animate-spin text-indigo-600" />
              <p className="text-xs font-medium">
                {t('admin:service_reminders.loading_preview', {
                  defaultValue: 'Calculando servidores programados...',
                })}
              </p>
            </div>
          )}

          {/* Content loaded */}
          {!isPreviewLoading && preview && (
            <>
              {/* Metric counter */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100/80 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                    <Users size={18} />
                  </div>
                  <div>
                    <span className="text-xs text-slate-700 font-bold block">
                      {t('admin:service_reminders.metric_total', { defaultValue: 'Colaboradores Programados' })}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {t('admin:service_reminders.metric_total_desc', {
                        defaultValue: 'Recibirán recordatorio para su turno de servicio',
                      })}
                    </span>
                  </div>
                </div>
                <span className="text-2xl font-black text-slate-900 px-2">
                  {preview.totalScheduled}
                </span>
              </div>

              {/* Empty state: No scheduled collaborators */}
              {preview.totalScheduled === 0 ? (
                <div className="bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-2">
                    <Users size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {t('admin:service_reminders.no_collaborators_title', {
                      defaultValue: 'No hay servidores programados para mañana',
                    })}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {t('admin:service_reminders.no_collaborators_hint', {
                      defaultValue:
                        'Este ministerio no tiene reuniones con rotaciones o grupos activos para la fecha de mañana.',
                    })}
                  </p>
                </div>
              ) : (
                /* Collaborators List Grouped by Meeting */
                <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                  {collaboratorsByMeeting.map((group, gIdx) => (
                    <div
                      key={gIdx}
                      className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-2xs"
                    >
                      {/* Meeting header */}
                      <div className="bg-slate-100/75 px-3.5 py-2 flex items-center justify-between border-b border-slate-200/70">
                        <div className="flex items-center gap-2">
                          <Clock size={13} className="text-slate-500 shrink-0" />
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {group.meetingName}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            ({formatTime(group.meetingTime)})
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/60">
                          {group.items.length}
                        </span>
                      </div>

                      {/* Collaborator items */}
                      <div className="divide-y divide-slate-100">
                        {group.items.map((item, iIdx) => (
                          <div
                            key={iIdx}
                            className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 truncate">
                                  {item.fullName || 'Colaborador'}
                                </span>
                                {item.groupName && (
                                  <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                                    {item.groupName}
                                  </span>
                                )}
                              </div>
                              {item.areaName && (
                                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                                  Área: {item.areaName}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5 shrink-0">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
            className="text-xs"
          >
            {t('common:actions.cancel', { defaultValue: 'Cancelar' })}
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={handleSend}
            disabled={isSending || isPreviewLoading || !preview || preview.totalScheduled === 0}
            className="flex items-center gap-2 text-xs cursor-pointer shadow-xs"
          >
            {isSending ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>{t('admin:service_reminders.sending_btn', { defaultValue: 'Enviando...' })}</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>
                  {t('admin:service_reminders.send_btn', {
                    defaultValue: 'Enviar Recordatorios ({{count}})',
                    count: preview?.totalScheduled || 0,
                  })}
                </span>
              </>
            )}
          </Button>
        </div>
      </div>
    </ModalOverlay>
  );
};

export default SendServiceReminderModal;
