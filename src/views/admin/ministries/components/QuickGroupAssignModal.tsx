import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import clsx from 'clsx';
import { toast } from 'sonner';
import {
  CalendarDays,
  Clock,
  Users,
  X,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import ModalOverlay from '@/components/ui/ModalOverlay';
import Button from '@/components/ui/Button';
import {
  ChurchMeetingKind,
  ICalendarMeetingInstance,
  IMinistryGroupConfig,
  MinistryMeetingGroupAssignmentKind,
} from '@/libs/models';
import {
  useUpsertMinistryGroupAssignmentMutation,
  useDeleteMinistryGroupAssignmentMutation,
} from '@/libs/state/redux/api/churchApi';

export interface QuickGroupAssignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instance: ICalendarMeetingInstance | null;
  ministryId: string;
  activeGroups: IMinistryGroupConfig[];
  onSuccess?: () => void;
}

/**
 * Formats an HH:mm:ss or HH:mm string to 12-hour AM/PM format (e.g. 7:00 AM, 11:30 AM).
 *
 * @param {string | undefined} val - Raw time string.
 * @returns {string} Formatted 12-hour AM/PM string.
 */
const formatTimeShort = (val?: string): string => {
  if (!val) return '';
  const parts = val.split(':');
  if (parts.length < 2) return val;
  const hour = parseInt(parts[0], 10);
  if (isNaN(hour)) return val;
  const minute = parts[1];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute} ${ampm}`;
};

/**
 * Quick modal drawer to override or customize the groups assigned to a specific service date.
 *
 * @param {QuickGroupAssignModalProps} props - Component properties.
 * @returns {JSX.Element | null} Rendered quick assign modal.
 */
export const QuickGroupAssignModal: React.FC<QuickGroupAssignModalProps> = ({
  open,
  onOpenChange,
  instance,
  ministryId,
  activeGroups,
  onSuccess,
}) => {
  const { t } = useTranslation(['admin', 'common']);

  const [upsertAssignment, { isLoading: isSaving }] = useUpsertMinistryGroupAssignmentMutation();
  const [deleteAssignment, { isLoading: isRestoring }] = useDeleteMinistryGroupAssignmentMutation();

  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  // Determine whether this meeting instance has already ended in the past
  const isPast = useMemo(() => {
    if (!instance) return false;
    const endHour = instance.meeting.finalHour || instance.meeting.finalRegistrationHour;
    if (endHour) {
      const endDateTime = dayjs(`${instance.serviceDate} ${endHour}`, 'YYYY-MM-DD HH:mm:ss');
      if (endDateTime.isValid()) {
        return endDateTime.isBefore(dayjs());
      }
    }
    return dayjs(instance.serviceDate).endOf('day').isBefore(dayjs());
  }, [instance]);

  useEffect(() => {
    if (!open || !instance) return;
    setSelectedGroupIds(instance.scheduledGroupIds || []);
  }, [open, instance]);

  if (!open || !instance) return null;

  const handleClose = () => {
    onOpenChange(false);
  };

  const formattedDate = dayjs(instance.serviceDate).format('DD/MM/YYYY');
  const initialTime = formatTimeShort(instance.meeting.initialHour);
  const finalTime = formatTimeShort(instance.meeting.finalHour);
  const isOneTime = instance.meeting.kind === ChurchMeetingKind.ONE_TIME;
  const hasUnderlyingRotation = Boolean(instance.rotationAssignmentId);

  /**
   * Toggles a group in the single-date selection.
   *
   * @param {string} groupId - Group identifier.
   */
  const handleToggleGroup = (groupId: string) => {
    if (isPast) return;
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId],
    );
  };

  /**
   * Saves single-date override assignment.
   */
  const handleSave = async () => {
    if (isPast) return;
    try {
      await upsertAssignment({
        ministryId,
        churchMeetingId: instance.meeting.id,
        kind: MinistryMeetingGroupAssignmentKind.SINGLE_DATE,
        intervalWeeks: 1,
        startDate: instance.serviceDate,
        endDate: instance.serviceDate,
        groupSequence: [selectedGroupIds],
      }).unwrap();

      toast.success(t('admin:ministry_scheduling.quick_assign_success'));
      onSuccess?.();
      handleClose();
    } catch {
      toast.error(t('admin:ministry_scheduling.quick_assign_error'));
    }
  };

  /**
   * Clears single-date assignment (reverts to automated rotation if recurrent, or removes assignment if one-time).
   */
  const handleRestoreAutomatic = async () => {
    if (isPast || !instance.singleDateAssignmentId) return;

    try {
      await deleteAssignment(instance.singleDateAssignmentId).unwrap();
      toast.success(
        isOneTime || !hasUnderlyingRotation
          ? t('admin:ministry_scheduling.clear_assignment_success')
          : t('admin:ministry_scheduling.restore_rotation_success'),
      );
      onSuccess?.();
      handleClose();
    } catch {
      toast.error(t('admin:ministry_scheduling.restore_rotation_error'));
    }
  };

  return (
    <ModalOverlay
      open={open}
      onClose={handleClose}
      wrapperClassName="items-center justify-center p-3 sm:p-4"
      panelClassName="max-w-md w-full mx-auto"
    >
      <div className="bg-slate-900 rounded-3xl shadow-2xl w-full flex flex-col overflow-hidden border border-slate-800/80">
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between shrink-0 bg-slate-900 text-white rounded-t-3xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
              <CalendarDays size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold tracking-tight truncate">
                {t('admin:ministry_scheduling.modal_quick_title')}
              </h2>
              <p className="text-xs text-slate-300 truncate">
                {instance.meeting.name} &bull; {formattedDate}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 bg-white">
          {/* Read-only banner if meeting has already ended */}
          {isPast && (
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900">
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-700 shrink-0">
                <Lock size={15} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-amber-950">
                  {t('admin:calendar.past_meeting_readonly_title')}
                </p>
                <p className="text-[11px] text-amber-800">
                  {t('admin:calendar.past_meeting_readonly_desc')}
                </p>
              </div>
            </div>
          )}

          {/* Service Details Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">{instance.meeting.name}</span>
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Clock size={12} className="text-indigo-600" />
                <span>
                  {initialTime} – {finalTime}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1.5 border-t border-slate-200/60 text-xs text-slate-600">
              <CalendarDays size={13} className="text-primary shrink-0" />
              <span>
                Fecha del servicio: <strong className="text-slate-900">{formattedDate}</strong>
              </span>
            </div>
          </div>

          {/* Group Picker */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Users size={13} className="text-indigo-600" />
                <span>{t('admin:ministry_scheduling.assigned_group_label')}</span>
              </span>

              {!isPast && instance.isSingleDateAssignment && hasUnderlyingRotation && !isOneTime && (
                <button
                  type="button"
                  onClick={handleRestoreAutomatic}
                  disabled={isRestoring}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw size={11} />
                  <span>{t('admin:ministry_scheduling.btn_restore_rotation')}</span>
                </button>
              )}

              {!isPast && instance.isSingleDateAssignment && (isOneTime || !hasUnderlyingRotation) && (
                <button
                  type="button"
                  onClick={handleRestoreAutomatic}
                  disabled={isRestoring}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 size={11} />
                  <span>{t('admin:ministry_scheduling.btn_clear_assignment')}</span>
                </button>
              )}
            </div>

            {!isPast && (
              <p className="text-[11.5px] text-slate-500">
                {t('admin:ministry_scheduling.macro_note')}
              </p>
            )}

            {isPast ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedGroupIds.length > 0 ? (
                  activeGroups
                    .filter((g) => selectedGroupIds.includes(g.id))
                    .map((group) => (
                      <div
                        key={group.id}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1.5"
                      >
                        <Users size={13} className="text-indigo-600" />
                        <span>{group.name}</span>
                      </div>
                    ))
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    {t('admin:calendar.no_groups_assigned_historical')}
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                {activeGroups.map((group) => {
                  const isSelected = selectedGroupIds.includes(group.id);
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => handleToggleGroup(group.id)}
                      className={clsx(
                        'p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-between gap-2 text-left',
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
                      )}
                    >
                      <span className="truncate">{group.name}</span>
                      {isSelected && <CheckCircle2 size={14} className="shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {isPast ? (
          <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-amber-800 font-semibold">
              <Lock size={14} className="text-amber-600 shrink-0" />
              <span>{t('admin:calendar.past_meeting_locked_notice')}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={handleClose}
            >
              {t('common:actions.close', { defaultValue: 'Cerrar' })}
            </Button>
          </div>
        ) : (
          <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={handleClose}
              disabled={isSaving || isRestoring}
            >
              {t('common:actions.cancel')}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              loading={isSaving}
              disabled={isRestoring}
              onClick={handleSave}
              className="text-xs font-bold"
            >
              {t('common:actions.save', { defaultValue: 'Guardar' })}
            </Button>
          </div>
        )}
      </div>
    </ModalOverlay>
  );
};

export default QuickGroupAssignModal;
