import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import clsx from 'clsx';
import { toast } from 'sonner';
import {
  Clock,
  Tag,
  CalendarOff,
  CheckCircle2,
  Users,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  X,
  Archive,
  Lock,
} from 'lucide-react';
import ModalOverlay from '@/components/ui/ModalOverlay';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import {
  ChurchMeetingKind,
  ChurchMeetingStateEnum,
  EntityState,
  ICalendarMeetingInstance,
  IMinistryGroupConfig,
  MinistryMeetingGroupAssignmentKind,
} from '@/libs/models';
import {
  useUpsertChurchMeetingExceptionMutation,
  useDeleteChurchMeetingExceptionMutation,
  useGetMinistryWorkspaceOverviewQuery,
  useGetMinistryGroupAssignmentsQuery,
  useUpsertMinistryGroupAssignmentMutation,
  useDeleteMinistryGroupAssignmentMutation,
  useDeleteChurchMeetingMutation,
} from '@/libs/state/redux/api/churchApi';
import { useChurchTerm } from '@/libs/hooks/useTerm';

export interface CalendarInstanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instance: ICalendarMeetingInstance | null;
  churchCampusId: string;
  ministryId?: string;
  ministryName?: string;
  ministryGroups?: IMinistryGroupConfig[];
  onSuccess?: () => void;
  onEditMeeting?: (instance: ICalendarMeetingInstance) => void;
  onAddConcurrentMeeting?: (instance: ICalendarMeetingInstance) => void;
}

const DAY_KEY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

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
 * Modal dialog to inspect and manage a specific calendar meeting instance:
 * - Differentiates states cleanly: Activa, Suspendida, Finalizada, and Archivada.
 * - Displays service and registration schedules in structured cards.
 * - Allows suspending or reactivating the service on this date.
 * - Assigns ministry groups (Macro events or sequential rotation) when applicable.
 *
 * @param {CalendarInstanceModalProps} props - Component properties.
 * @returns {JSX.Element | null} Rendered modal dialog.
 */
export const CalendarInstanceModal: React.FC<CalendarInstanceModalProps> = ({
  open,
  onOpenChange,
  instance,
  churchCampusId,
  ministryId,
  ministryName,
  ministryGroups: propGroups,
  onSuccess,
  onEditMeeting,
  onAddConcurrentMeeting,
}) => {
  const { t } = useTranslation(['admin', 'common']);
  const meetingTerm = useChurchTerm('meeting');

  const handleClose = () => {
    onOpenChange(false);
  };

  // Exception / Suspension state
  const [isSuspendingOpen, setIsSuspendingOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');

  // Assignment mode: 'SINGLE_DATE' vs 'FROM_DATE_FORWARD'
  const [applyMode, setApplyMode] = useState<'SINGLE_DATE' | 'FROM_DATE_FORWARD'>('SINGLE_DATE');
  const [selectedOverrideGroupIds, setSelectedOverrideGroupIds] = useState<string[]>([]);
  const [intervalWeeks, setIntervalWeeks] = useState<number>(1);
  const [sequenceSteps, setSequenceSteps] = useState<string[][]>([[]]);

  // Queries for ministry groups & existing rotations if ministryId is active
  const { data: workspaceData } = useGetMinistryWorkspaceOverviewQuery(
    { ministryId: ministryId || '', churchCampusId },
    { skip: !open || !ministryId || Boolean(propGroups && propGroups.length > 0) },
  );

  const activeGroups = useMemo<IMinistryGroupConfig[]>(() => {
    const source: IMinistryGroupConfig[] =
      propGroups && propGroups.length > 0 ? propGroups : workspaceData?.groups || [];
    return source
      .filter((group: IMinistryGroupConfig) => !group.state || group.state === EntityState.ACTIVE)
      .sort(
        (firstGroup: IMinistryGroupConfig, secondGroup: IMinistryGroupConfig) =>
          (firstGroup.position ?? 0) - (secondGroup.position ?? 0),
      );
  }, [propGroups, workspaceData?.groups]);

  const { data: rotations = [] } = useGetMinistryGroupAssignmentsQuery(
    {
      ministryId: ministryId || '',
      churchMeetingId: instance?.meeting.id,
      kind: MinistryMeetingGroupAssignmentKind.ROTATION,
    },
    { skip: !open || !ministryId || !instance?.meeting.id },
  );

  // Mutations
  const [upsertException, { isLoading: savingException }] =
    useUpsertChurchMeetingExceptionMutation();
  const [deleteException, { isLoading: deletingException }] =
    useDeleteChurchMeetingExceptionMutation();
  const [upsertAssignment, { isLoading: savingAssignment }] =
    useUpsertMinistryGroupAssignmentMutation();
  const [deleteAssignment, { isLoading: deletingAssignment }] =
    useDeleteMinistryGroupAssignmentMutation();
  const [deleteMeeting, { isLoading: isDeletingMeeting }] =
    useDeleteChurchMeetingMutation();

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

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

  const isArchived = useMemo(() => {
    if (!instance) return false;
    const st = instance.meeting.state ?? ChurchMeetingStateEnum.ACTIVE;
    return (
      st === ChurchMeetingStateEnum.ARCHIVED ||
      st === ChurchMeetingStateEnum.DISABLE ||
      st === ChurchMeetingStateEnum.INACTIVE
    );
  }, [instance]);

  // Hydrate modal exception and basic inputs when instance or open changes
  useEffect(() => {
    if (!open || !instance) return;

    setIsSuspendingOpen(false);
    setSuspendReason(instance.exceptionReason || '');
    setSelectedOverrideGroupIds(instance.scheduledGroupIds || []);
  }, [
    open,
    instance?.instanceId,
    instance?.exceptionReason,
    instance?.scheduledGroupIds,
  ]);

  // Synchronize rotation and group sequence configuration
  useEffect(() => {
    if (!open || !instance) return;

    const isOneTimeMeeting = instance.meeting.kind === ChurchMeetingKind.ONE_TIME;
    if (isOneTimeMeeting || instance.isSingleDateAssignment) {
      setApplyMode('SINGLE_DATE');
    } else if (instance.rotationAssignmentId) {
      setApplyMode('FROM_DATE_FORWARD');
    } else {
      setApplyMode('SINGLE_DATE');
    }

    const matchingRotation =
      rotations.find((rot) => rot.id === instance.rotationAssignmentId) || rotations[0];
    if (matchingRotation && matchingRotation.groupSequence?.length > 0) {
      setIntervalWeeks(matchingRotation.intervalWeeks || 1);
      setSequenceSteps(matchingRotation.groupSequence);
    } else if (activeGroups.length > 0) {
      setIntervalWeeks(1);
      setSequenceSteps(activeGroups.map((group) => [group.id]));
    } else {
      setIntervalWeeks(1);
      setSequenceSteps([[]]);
    }
  }, [open, instance?.instanceId, instance?.rotationAssignmentId, rotations, activeGroups]);

  const formattedFullDate = useMemo(() => {
    if (!instance?.serviceDate) return '';
    const d = dayjs(instance.serviceDate);
    const dayKey = DAY_KEY_NAMES[d.day()];
    const translatedDay = t(`admin:meetings.days.${dayKey}`, { defaultValue: d.format('dddd') });
    return `${translatedDay}, ${d.format('D')} de ${d.format('MMMM')} de ${d.format('YYYY')}`;
  }, [instance?.serviceDate, t]);

  if (!instance) return null;

  const isOneTime = instance.meeting.kind === ChurchMeetingKind.ONE_TIME;
  const formattedDate = dayjs(instance.serviceDate).format('DD/MM/YYYY');

  /**
   * Toggles a group ID inside the single-date override selection.
   *
   * @param {string} groupId - Target group identifier.
   */
  const handleToggleOverrideGroup = (groupId: string) => {
    setSelectedOverrideGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId],
    );
  };

  /**
   * Toggles a group ID inside a specific step of the rotation sequence.
   *
   * @param {number} stepIndex - Index of the rotation step.
   * @param {string} groupId - Target group identifier.
   */
  const handleToggleStepGroup = (stepIndex: number, groupId: string) => {
    setSequenceSteps((prev) =>
      prev.map((step, idx) => {
        if (idx !== stepIndex) return step;
        return step.includes(groupId)
          ? step.filter((id) => id !== groupId)
          : [...step, groupId];
      }),
    );
  };

  /**
   * Appends a new rotation step to the sequence.
   */
  const handleAddSequenceStep = () => {
    const defaultGroupId = activeGroups[0]?.id;
    setSequenceSteps((prev) => [...prev, defaultGroupId ? [defaultGroupId] : []]);
  };

  /**
   * Removes a rotation step at the given index.
   *
   * @param {number} stepIndex - Index of the step to remove.
   */
  const handleRemoveSequenceStep = (stepIndex: number) => {
    if (sequenceSteps.length <= 1) return;
    setSequenceSteps((prev) => prev.filter((_, idx) => idx !== stepIndex));
  };

  /**
   * Suspends or restores the meeting on this specific date.
   */
  const handleToggleException = async () => {
    if (isPast) return;
    try {
      if (instance.isCancelled && instance.exceptionId) {
        await deleteException(instance.exceptionId).unwrap();
        toast.success(t('admin:calendar.restored_toast', { meeting: meetingTerm }));
      } else {
        await upsertException({
          churchMeetingId: instance.meeting.id,
          churchCampusId,
          exceptionDate: instance.serviceDate,
          reason: suspendReason.trim() || undefined,
        }).unwrap();
        toast.success(t('admin:calendar.suspended_toast', { meeting: meetingTerm }));
      }
      setIsSuspendingOpen(false);
      onSuccess?.();
      handleClose();
    } catch {
      toast.error(t('admin:meetings.save_error', { meeting: meetingTerm.toLowerCase() }));
    }
  };

  /**
   * Saves either the single-date group assignment or the forward sequential group rotation.
   */
  const handleSaveAssignment = async () => {
    if (isPast || !ministryId) return;

    try {
      if (applyMode === 'SINGLE_DATE') {
        await upsertAssignment({
          ministryId,
          churchMeetingId: instance.meeting.id,
          kind: MinistryMeetingGroupAssignmentKind.SINGLE_DATE,
          intervalWeeks: 1,
          startDate: instance.serviceDate,
          endDate: instance.serviceDate,
          groupSequence: [selectedOverrideGroupIds],
        }).unwrap();
      } else {
        const cleanedSequence = sequenceSteps.filter((step) => step.length > 0);
        if (cleanedSequence.length === 0) return;

        await upsertAssignment({
          id: instance.rotationAssignmentId,
          ministryId,
          churchMeetingId: instance.meeting.id,
          kind: MinistryMeetingGroupAssignmentKind.ROTATION,
          intervalWeeks: Math.max(1, Number(intervalWeeks) || 1),
          startDate: instance.serviceDate,
          endDate: null,
          groupSequence: cleanedSequence,
        }).unwrap();
      }

      toast.success(t('admin:calendar.assignment_saved_toast'));
      onSuccess?.();
      handleClose();
    } catch {
      toast.error(t('admin:meetings.save_error', { meeting: meetingTerm.toLowerCase() }));
    }
  };

  /**
   * Removes the single-date assignment so the instance reverts to the automatic rotation.
   */
  const handleRestoreAutomaticRotation = async () => {
    if (isPast || !instance.singleDateAssignmentId || !ministryId) return;
    try {
      await deleteAssignment(instance.singleDateAssignmentId).unwrap();
      toast.success(t('admin:calendar.override_cleared_toast'));
      onSuccess?.();
      handleClose();
    } catch {
      toast.error(t('admin:meetings.save_error', { meeting: meetingTerm.toLowerCase() }));
    }
  };

  /**
   * Confirms and permanently deletes the church meeting.
   */
  const handleConfirmDelete = async () => {
    if (isPast || !instance) return;
    try {
      await deleteMeeting({
        id: instance.meeting.id,
        churchCampusId,
      }).unwrap();
      toast.success(t('admin:meetings.delete_success', { meeting: meetingTerm }));
      setDeleteConfirmOpen(false);
      onSuccess?.();
      handleClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ||
        t('admin:meetings.delete_error', { meeting: meetingTerm.toLowerCase() });
      if (typeof errorMsg === 'string' && errorMsg.includes('Cannot delete')) {
        toast.error(t('admin:meetings.cannot_delete_has_activity', { meeting: meetingTerm }));
      } else {
        toast.error(errorMsg);
      }
    }
  };

  const isSavingAny =
    savingException ||
    deletingException ||
    savingAssignment ||
    deletingAssignment ||
    isDeletingMeeting;

  if (!open || !instance) return null;

  return (
    <ModalOverlay
      open={open}
      onClose={handleClose}
      wrapperClassName="items-center justify-center p-3 sm:p-4"
      panelClassName="max-w-2xl w-full mx-auto"
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 mx-auto">
        {/* Header: Meeting Identity, Full Date & Status Badge */}
        <div className="px-6 py-5 flex items-center justify-between shrink-0 bg-slate-900 text-white rounded-t-3xl">
          <div className="min-w-0 pr-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-extrabold tracking-tight truncate text-white">
                {instance.meeting.name}
              </h2>
              {instance.meeting.tag && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 shrink-0">
                  <Tag size={11} />
                  <span>{instance.meeting.tag.name}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-1 capitalize truncate">
              {formattedFullDate} &bull; {isOneTime ? t('admin:calendar.one_time_badge') : t('admin:meetings.kind_recurrent')}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Status Badge */}
            {(() => {
              if (instance.isCancelled) {
                return (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    <CalendarOff size={13} />
                    <span>{t('admin:calendar.instance_status_cancelled')}</span>
                  </span>
                );
              }
              if (isArchived) {
                return (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Archive size={13} />
                    <span>{t('admin:calendar.instance_status_archived')}</span>
                  </span>
                );
              }
              if (isPast) {
                return (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-700 text-slate-300 border border-slate-600">
                    <Lock size={13} />
                    <span>{t('admin:calendar.instance_status_finished')}</span>
                  </span>
                );
              }
              return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 size={13} />
                  <span>{t('admin:calendar.instance_status_active')}</span>
                </span>
              );
            })()}

            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200 transition-colors cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-white">
          {/* Read-only banner if meeting has already concluded */}
          {isPast && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700">
              <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                <Lock size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900">
                  {t('admin:calendar.past_meeting_readonly_title')}
                </p>
                <p className="text-xs text-slate-600">
                  {t('admin:calendar.past_meeting_readonly_desc')}
                </p>
              </div>
            </div>
          )}

          {/* Section 1: Meeting & Registration Schedules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/70 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-primary shrink-0">
                <Clock size={18} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-500 block">
                  {t('admin:calendar.schedule_service_title')}
                </span>
                <span className="text-sm font-extrabold text-slate-900 mt-0.5 block truncate">
                  {formatTimeShort(instance.meeting.initialHour)} – {formatTimeShort(instance.meeting.finalHour)}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/70 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 shrink-0">
                <Clock size={18} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-500 block">
                  {t('admin:calendar.schedule_registration_title')}
                </span>
                <span className="text-sm font-extrabold text-slate-900 mt-0.5 block truncate">
                  {formatTimeShort(instance.meeting.initialRegistrationHour)} – {formatTimeShort(instance.meeting.finalRegistrationHour)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Service Suspension Management */}
          {instance.isCancelled ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                    <CalendarOff size={16} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                      {t('admin:calendar.instance_status_cancelled')}
                    </h4>
                    <p className="text-xs text-rose-700 font-medium truncate mt-0.5">
                      {instance.exceptionReason || t('admin:calendar.instance_status_cancelled')}
                    </p>
                  </div>
                </div>

                {!isPast && (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    loading={deletingException}
                    onClick={handleToggleException}
                    className="gap-1.5 text-xs font-bold shrink-0"
                  >
                    <RotateCcw size={14} />
                    <span>{t('admin:calendar.restore_btn')}</span>
                  </Button>
                )}
              </div>
            </div>
          ) : !isPast ? (
            !isSuspendingOpen ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <p className="text-xs font-medium text-slate-700 truncate">
                    {t('admin:calendar.suspend_normal_notice')}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => setIsSuspendingOpen(true)}
                  className="gap-1.5 text-xs font-bold shrink-0"
                >
                  <CalendarOff size={13} />
                  <span>{t('admin:calendar.suspend_action_btn')}</span>
                </Button>
              </div>
            ) : (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-900 uppercase tracking-wide">
                  <CalendarOff size={14} className="text-rose-600" />
                  <span>{t('admin:calendar.suspend_section_title')}</span>
                </div>
                <Input
                  placeholder={t('admin:calendar.suspend_reason_placeholder')}
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  onClear={() => setSuspendReason('')}
                />
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsSuspendingOpen(false);
                      setSuspendReason('');
                    }}
                    className="text-xs"
                  >
                    {t('common:actions.cancel')}
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    loading={savingException}
                    onClick={handleToggleException}
                    className="gap-1.5 text-xs font-bold"
                  >
                    <CalendarOff size={14} />
                    <span>{t('admin:calendar.suspend_confirm_btn')}</span>
                  </Button>
                </div>
              </div>
            )
          ) : null}

          {/* Section 3: Ministry Group Assignment & Sequential Rotations */}
          {ministryId && isPast && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
                <Users size={15} className="text-primary" />
                <span>
                  {t('admin:calendar.groups_section_title', {
                    ministry: ministryName || 'Ministerio',
                  })}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {instance.scheduledGroupIds && instance.scheduledGroupIds.length > 0 ? (
                  activeGroups
                    .filter((group) => instance.scheduledGroupIds?.includes(group.id))
                    .map((group) => (
                      <div
                        key={group.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200"
                      >
                        <Users size={13} className="text-primary" />
                        <span>{group.name}</span>
                      </div>
                    ))
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    {t('admin:calendar.no_groups_assigned_historical')}
                  </p>
                )}
              </div>
            </div>
          )}

          {!isPast && ministryId && activeGroups.length > 0 && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
                    <Users size={15} className="text-primary" />
                    <span>
                      {t('admin:calendar.groups_section_title', {
                        ministry: ministryName || 'Ministerio',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t('admin:calendar.groups_section_hint')}
                  </p>
                </div>

                {instance.isSingleDateAssignment &&
                  instance.singleDateAssignmentId &&
                  !isOneTime &&
                  Boolean(instance.rotationAssignmentId) && (
                    <button
                      type="button"
                      onClick={handleRestoreAutomaticRotation}
                      disabled={deletingAssignment}
                      className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                    >
                      <RotateCcw size={12} />
                      <span>{t('admin:calendar.clear_override_btn')}</span>
                    </button>
                  )}
              </div>

              {/* Scope Selector: Single Date vs From This Date Forward */}
              {!isOneTime && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    {t('admin:calendar.apply_mode_label')}
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => setApplyMode('SINGLE_DATE')}
                      className={clsx(
                        'flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer',
                        applyMode === 'SINGLE_DATE'
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/15 text-primary'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700',
                      )}
                    >
                      <span className="text-xs font-bold">
                        {t('admin:calendar.apply_only_this_date', { date: formattedDate })}
                      </span>
                      <span
                        className={clsx(
                          'w-4 h-4 rounded-full border flex items-center justify-center shrink-0',
                          applyMode === 'SINGLE_DATE'
                            ? 'border-primary bg-primary text-white'
                            : 'border-slate-300',
                        )}
                      >
                        {applyMode === 'SINGLE_DATE' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setApplyMode('FROM_DATE_FORWARD')}
                      className={clsx(
                        'flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer',
                        applyMode === 'FROM_DATE_FORWARD'
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/15 text-primary'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700',
                      )}
                    >
                      <span className="text-xs font-bold">
                        {t('admin:calendar.apply_from_this_date', { date: formattedDate })}
                      </span>
                      <span
                        className={clsx(
                          'w-4 h-4 rounded-full border flex items-center justify-center shrink-0',
                          applyMode === 'FROM_DATE_FORWARD'
                            ? 'border-primary bg-primary text-white'
                            : 'border-slate-300',
                        )}
                      >
                        {applyMode === 'FROM_DATE_FORWARD' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Mode A: Single Date Override / Macro Event Group Picker */}
              {applyMode === 'SINGLE_DATE' && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {activeGroups.map((group) => {
                    const isSelected = selectedOverrideGroupIds.includes(group.id);
                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => handleToggleOverrideGroup(group.id)}
                        className={clsx(
                          'px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5',
                          isSelected
                            ? 'bg-primary text-white border-primary shadow-2xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
                        )}
                      >
                        <Users size={13} />
                        <span>{group.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Mode B: Sequential Rotation Builder (From This Date Forward) */}
              {applyMode === 'FROM_DATE_FORWARD' && (
                <div className="flex flex-col gap-4 pt-1 border-t border-slate-100">
                  {/* Interval Weeks Selector */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      {t('admin:calendar.interval_weeks_label')}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {[1, 2, 4].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setIntervalWeeks(preset)}
                          className={clsx(
                            'px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer',
                            intervalWeeks === preset
                              ? 'bg-primary text-white border-primary shadow-2xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
                          )}
                        >
                          {t('admin:calendar.weeks_chip', { count: preset })}
                        </button>
                      ))}

                      <div className="w-28">
                        <Input
                          type="number"
                          min={1}
                          max={52}
                          placeholder={t('admin:calendar.custom_weeks_placeholder')}
                          value={String(intervalWeeks)}
                          onChange={(e) =>
                            setIntervalWeeks(Math.max(1, parseInt(e.target.value || '1', 10)))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sequence Steps Builder */}
                  <div className="flex flex-col gap-2.5">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      {t('admin:calendar.sequence_order_label')}
                    </span>

                    <div className="flex flex-col gap-2.5">
                      {sequenceSteps.map((stepGroupIds, stepIdx) => (
                        <div
                          key={stepIdx}
                          className="p-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 flex flex-col gap-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-slate-700">
                              {t('admin:calendar.sequence_step_label', { index: stepIdx + 1 })}
                            </span>
                            {sequenceSteps.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSequenceStep(stepIdx)}
                                className="text-rose-500 hover:text-rose-700 p-1 rounded-lg transition-colors cursor-pointer"
                                title={t('admin:calendar.remove_step_btn')}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {activeGroups.map((group) => {
                              const isSelected = stepGroupIds.includes(group.id);
                              return (
                                <button
                                  key={group.id}
                                  type="button"
                                  onClick={() => handleToggleStepGroup(stepIdx, group.id)}
                                  className={clsx(
                                    'px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer',
                                    isSelected
                                      ? 'bg-primary text-white border-primary shadow-2xs'
                                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100',
                                  )}
                                >
                                  {group.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleAddSequenceStep}
                      className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-primary hover:bg-primary/10 border border-dashed border-primary/40 transition-colors cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>{t('admin:calendar.add_step_btn')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {isPast ? (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2.5 shrink-0 rounded-b-3xl">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
              <Lock size={15} className="text-slate-400 shrink-0" />
              <span>{t('admin:calendar.past_meeting_locked_notice')}</span>
            </div>
            <Button
              type="button"
              variant="default"
              size="md"
              onClick={handleClose}
            >
              {t('common:actions.close', { defaultValue: 'Cerrar' })}
            </Button>
          </div>
        ) : (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0 rounded-b-3xl">
            <div>
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={isDeletingMeeting || isSavingAny}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 size={14} />
                <span>{t('admin:meetings.delete_tooltip', { meeting: meetingTerm })}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={handleClose}
                disabled={isSavingAny || isDeletingMeeting}
              >
                {t('common:actions.close', { defaultValue: 'Cerrar' })}
              </Button>

              {onAddConcurrentMeeting && (
                <Button
                  type="button"
                  variant="default"
                  size="md"
                  onClick={() => {
                    handleClose();
                    onAddConcurrentMeeting(instance);
                  }}
                  className="gap-1.5 text-xs font-bold"
                >
                  <Plus size={14} />
                  <span>{t('admin:calendar.add_concurrent_meeting_btn')}</span>
                </Button>
              )}

              {onEditMeeting && (
                <Button
                  type="button"
                  variant="default"
                  size="md"
                  onClick={() => {
                    handleClose();
                    onEditMeeting(instance);
                  }}
                  className="gap-1.5 text-xs font-bold"
                >
                  <Edit2 size={14} />
                  <span>{t('admin:calendar.edit_meeting_btn', { meeting: meetingTerm.toLowerCase() })}</span>
                </Button>
              )}

              {ministryId && activeGroups.length > 0 && (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  loading={savingAssignment}
                  onClick={handleSaveAssignment}
                >
                  {t('admin:calendar.save_assignment_btn')}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Meeting Confirmation Modal */}
      <ConfirmModal
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={t('admin:meetings.delete_confirm_title', { meeting: meetingTerm })}
        description={t('admin:meetings.delete_confirm_desc', {
          meeting: meetingTerm.toLowerCase(),
          name: instance.meeting.name,
        })}
        confirmText={t('admin:meetings.delete_confirm_btn', { meeting: meetingTerm.toLowerCase() })}
        cancelText={t('common:actions.cancel')}
        type="danger"
        onConfirm={handleConfirmDelete}
      />
    </ModalOverlay>
  );
};

export default CalendarInstanceModal;
