import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import clsx from 'clsx';
import { toast } from 'sonner';
import {
  RotateCcw,
  Calendar,
  Users,
  Plus,
  Trash2,
  X,
  Sparkles,
  ArrowRight,
  Clock,
  AlertCircle,
} from 'lucide-react';
import ModalOverlay from '@/components/ui/ModalOverlay';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import {
  ChurchMeetingStateEnum,
  IMinistryGroupConfig,
  IMinistryMeetingGroupAssignment,
  MinistryMeetingGroupAssignmentKind,
} from '@/libs/models';
import { Days } from '@/libs/common-types/constants';
import {
  useGetChurchMeetingsQuery,
  useUpsertMinistryGroupAssignmentMutation,
  useDeleteMinistryGroupAssignmentMutation,
} from '@/libs/state/redux/api/churchApi';
import { useChurchTerm } from '@/libs/hooks/useTerm';

/**
 * Day order indexing from Sunday (0) to Saturday (6).
 */
const DAY_ORDER: Record<string, number> = {
  [Days.SUNDAY]: 0,
  [Days.MONDAY]: 1,
  [Days.TUESDAY]: 2,
  [Days.WEDNESDAY]: 3,
  [Days.THURSDAY]: 4,
  [Days.FRIDAY]: 5,
  [Days.SATURDAY]: 6,
};

export interface MinistryRotationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ministryId: string;
  churchCampusId: string;
  activeGroups: IMinistryGroupConfig[];
  existingRotation?: IMinistryMeetingGroupAssignment | null;
  defaultChurchMeetingId?: string;
  onSuccess?: () => void;
}

/**
 * Modal to configure or edit an automatic group rotation schedule for a church meeting.
 *
 * @param {MinistryRotationModalProps} props - Component properties.
 * @returns {JSX.Element | null} Rendered rotation modal.
 */
export const MinistryRotationModal: React.FC<MinistryRotationModalProps> = ({
  open,
  onOpenChange,
  ministryId,
  churchCampusId,
  activeGroups,
  existingRotation,
  defaultChurchMeetingId,
  onSuccess,
}) => {
  const { t } = useTranslation(['admin', 'common']);
  const meetingTerm = useChurchTerm('meeting');

  const { data: churchMeetings = [], isLoading: loadingMeetings } = useGetChurchMeetingsQuery(
    { churchCampusId, states: [ChurchMeetingStateEnum.ACTIVE] },
    { skip: !open || !churchCampusId },
  );

  const sortedChurchMeetings = React.useMemo(() => {
    return [...churchMeetings].sort((meetingA, meetingB) => {
      const dayOrderA =
        meetingA.day && DAY_ORDER[meetingA.day.toUpperCase()] !== undefined
          ? DAY_ORDER[meetingA.day.toUpperCase()]
          : meetingA.specificDate
          ? dayjs(meetingA.specificDate).day()
          : 7;

      const dayOrderB =
        meetingB.day && DAY_ORDER[meetingB.day.toUpperCase()] !== undefined
          ? DAY_ORDER[meetingB.day.toUpperCase()]
          : meetingB.specificDate
          ? dayjs(meetingB.specificDate).day()
          : 7;

      if (dayOrderA !== dayOrderB) {
        return dayOrderA - dayOrderB;
      }

      const hourA = meetingA.initialHour || '00:00:00';
      const hourB = meetingB.initialHour || '00:00:00';
      if (hourA !== hourB) {
        return hourA.localeCompare(hourB);
      }

      return meetingA.name.localeCompare(meetingB.name);
    });
  }, [churchMeetings]);

  const [upsertRotation, { isLoading: isSaving }] = useUpsertMinistryGroupAssignmentMutation();
  const [deleteRotation, { isLoading: isDeleting }] = useDeleteMinistryGroupAssignmentMutation();

  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(() => dayjs().format('YYYY-MM-DD'));
  const [hasEndDate, setHasEndDate] = useState<boolean>(false);
  const [endDate, setEndDate] = useState<string>('');
  const [endDateError, setEndDateError] = useState<string>('');
  const [intervalWeeks, setIntervalWeeks] = useState<number>(1);
  const [sequenceSteps, setSequenceSteps] = useState<string[][]>([]);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false);

  // Initialize form state
  useEffect(() => {
    if (!open) return;

    if (existingRotation) {
      setSelectedMeetingId(existingRotation.churchMeetingId);
      setStartDate(
        existingRotation.startDate
          ? dayjs(existingRotation.startDate).format('YYYY-MM-DD')
          : dayjs().format('YYYY-MM-DD'),
      );
      setHasEndDate(Boolean(existingRotation.endDate));
      setEndDate(
        existingRotation.endDate
          ? dayjs(existingRotation.endDate).format('YYYY-MM-DD')
          : '',
      );
      setEndDateError('');
      setIntervalWeeks(existingRotation.intervalWeeks || 1);
      setSequenceSteps(
        existingRotation.groupSequence?.length > 0
          ? existingRotation.groupSequence
          : activeGroups.map((g) => [g.id]),
      );
    } else {
      setSelectedMeetingId(defaultChurchMeetingId || sortedChurchMeetings[0]?.id || '');
      setStartDate(dayjs().format('YYYY-MM-DD'));
      setHasEndDate(false);
      setEndDate('');
      setEndDateError('');
      setIntervalWeeks(1);
      setSequenceSteps(activeGroups.map((g) => [g.id]));
    }
  }, [open, existingRotation, defaultChurchMeetingId, sortedChurchMeetings, activeGroups]);

  if (!open) return null;

  const handleClose = () => {
    onOpenChange(false);
  };

  /**
   * Resets sequence to follow active groups in order.
   */
  const handleAutocompleteInOrder = () => {
    if (activeGroups.length === 0) return;
    setSequenceSteps(activeGroups.map((g) => [g.id]));
  };

  /**
   * Appends a new step to the rotation sequence.
   */
  const handleAddStep = () => {
    const defaultGroup = activeGroups[0];
    setSequenceSteps((prev) => [...prev, defaultGroup ? [defaultGroup.id] : []]);
  };

  /**
   * Removes a step at the given index.
   *
   * @param {number} stepIndex - Index of step to remove.
   */
  const handleRemoveStep = (stepIndex: number) => {
    if (sequenceSteps.length <= 1) return;
    setSequenceSteps((prev) => prev.filter((_, idx) => idx !== stepIndex));
  };

  /**
   * Toggles a group inside a specific sequence step.
   *
   * @param {number} stepIndex - Index of step to toggle.
   * @param {string} groupId - Group identifier.
   */
  const handleToggleGroupInStep = (stepIndex: number, groupId: string) => {
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
   * Submits rotation upsert mutation.
   */
  const handleSave = async () => {
    if (!selectedMeetingId) {
      toast.error(t('admin:ministry_scheduling.select_meeting_placeholder'));
      return;
    }

    if (hasEndDate && endDate && endDate < startDate) {
      setEndDateError(t('admin:ministry_scheduling.rotation_end_date_before_start_error'));
      return;
    }

    const cleanedSequence = sequenceSteps.filter((step) => step.length > 0);
    if (cleanedSequence.length === 0) {
      toast.error(t('admin:calendar.sequence_order_label'));
      return;
    }

    try {
      await upsertRotation({
        id: existingRotation?.id,
        ministryId,
        churchMeetingId: selectedMeetingId,
        kind: MinistryMeetingGroupAssignmentKind.ROTATION,
        intervalWeeks: Math.max(1, Number(intervalWeeks) || 1),
        startDate,
        endDate: hasEndDate && endDate ? endDate : null,
        groupSequence: cleanedSequence,
      }).unwrap();

      toast.success(t('admin:ministry_scheduling.save_rotation_success'));
      onSuccess?.();
      handleClose();
    } catch {
      toast.error(t('admin:ministry_scheduling.save_rotation_error'));
    }
  };

  /**
   * Deletes existing rotation assignment.
   */
  const handleDeleteRotation = async () => {
    if (!existingRotation?.id) return;

    try {
      await deleteRotation(existingRotation.id).unwrap();
      toast.success(t('admin:ministry_scheduling.delete_rotation_success'));
      setConfirmDeleteOpen(false);
      onSuccess?.();
      handleClose();
    } catch {
      toast.error(t('admin:ministry_scheduling.delete_rotation_error'));
    }
  };

  return (
    <>
      <ModalOverlay
      open={open}
      onClose={handleClose}
      wrapperClassName="items-center justify-center p-3 sm:p-4"
      panelClassName="max-w-2xl w-full mx-auto"
    >
      <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-800/80">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between shrink-0 bg-slate-900 text-white rounded-t-3xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
              <RotateCcw size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-extrabold tracking-tight truncate">
                {existingRotation
                  ? t('admin:ministry_scheduling.modal_rotation_edit_title')
                  : t('admin:ministry_scheduling.modal_rotation_title')}
              </h2>
              <p className="text-xs text-slate-300 truncate">
                {t('admin:ministry_scheduling.modal_rotation_desc')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-white">
          {/* Active groups check */}
          {activeGroups.length === 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800">
                <p className="font-bold">{t('admin:ministry_scheduling.no_groups_alert_title')}</p>
                <p className="mt-0.5">{t('admin:ministry_scheduling.no_groups_alert_desc')}</p>
              </div>
            </div>
          )}

          {/* 1. Target Church Meeting */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              {t('admin:ministry_scheduling.field_meeting_label')}
            </label>
            <Select
              value={selectedMeetingId}
              onChange={(e) => setSelectedMeetingId(e.target.value)}
              disabled={loadingMeetings || Boolean(existingRotation)}
              className="text-xs font-semibold"
            >
              <option value="" disabled>
                {t('admin:ministry_scheduling.select_meeting_placeholder')}
              </option>
              {sortedChurchMeetings.map((meeting) => (
                <option key={meeting.id} value={meeting.id}>
                  {meeting.name} ({meeting.initialHour} – {meeting.finalHour})
                </option>
              ))}
            </Select>
          </div>

          {/* 2. Frequency & Start Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                {t('admin:ministry_scheduling.field_start_date_label')}
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs font-semibold"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                {t('admin:ministry_scheduling.field_interval_label')}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { weeks: 1, label: t('admin:ministry_scheduling.interval_every_1_week') },
                  { weeks: 2, label: t('admin:ministry_scheduling.interval_every_2_weeks') },
                  { weeks: 4, label: t('admin:ministry_scheduling.interval_every_4_weeks') },
                ].map((item) => (
                  <button
                    key={item.weeks}
                    type="button"
                    onClick={() => setIntervalWeeks(item.weeks)}
                    className={clsx(
                      'py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer',
                      intervalWeeks === item.weeks
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50',
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Cycle Validity & Optional End Date */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Calendar size={14} className="text-indigo-600" />
                <span>{t('admin:ministry_scheduling.rotation_validity_label')}</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setHasEndDate(false);
                  setEndDate('');
                  setEndDateError('');
                }}
                className={clsx(
                  'p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between',
                  !hasEndDate
                    ? 'bg-indigo-50/80 border-indigo-500 ring-1 ring-indigo-500/20 text-indigo-900'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700',
                )}
              >
                <div>
                  <span className="block text-xs font-bold">
                    {t('admin:ministry_scheduling.rotation_indefinite_title')}
                  </span>
                  <span className="block text-[11px] text-slate-500 mt-0.5">
                    {t('admin:ministry_scheduling.rotation_indefinite_desc')}
                  </span>
                </div>
                <span
                  className={clsx(
                    'w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-2',
                    !hasEndDate ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300',
                  )}
                >
                  {!hasEndDate && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setHasEndDate(true);
                  if (!endDate) {
                    setEndDate(dayjs(startDate).add(1, 'month').format('YYYY-MM-DD'));
                  }
                }}
                className={clsx(
                  'p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between',
                  hasEndDate
                    ? 'bg-indigo-50/80 border-indigo-500 ring-1 ring-indigo-500/20 text-indigo-900'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700',
                )}
              >
                <div>
                  <span className="block text-xs font-bold">
                    {t('admin:ministry_scheduling.rotation_specific_end_title')}
                  </span>
                  <span className="block text-[11px] text-slate-500 mt-0.5">
                    {t('admin:ministry_scheduling.rotation_specific_end_desc')}
                  </span>
                </div>
                <span
                  className={clsx(
                    'w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-2',
                    hasEndDate ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300',
                  )}
                >
                  {hasEndDate && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
              </button>
            </div>

            {hasEndDate && (
              <div className="pt-2 border-t border-slate-200/60 flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {t('admin:ministry_scheduling.rotation_end_date_picker_label')}
                </label>
                <div className="max-w-xs">
                  <Input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      if (e.target.value && e.target.value < startDate) {
                        setEndDateError(t('admin:ministry_scheduling.rotation_end_date_before_start_error'));
                      } else {
                        setEndDateError('');
                      }
                    }}
                    className="text-xs font-semibold"
                  />
                </div>
                {endDateError && (
                  <p className="text-xs text-rose-600 font-medium">{endDateError}</p>
                )}
              </div>
            )}
          </div>

          {/* 4. Sequence Steps */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <RotateCcw size={14} className="text-indigo-600" />
                  <span>{t('admin:ministry_scheduling.sequence_title')}</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('admin:ministry_scheduling.sequence_desc')}
                </p>
              </div>

              {activeGroups.length > 0 && (
                <button
                  type="button"
                  onClick={handleAutocompleteInOrder}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                >
                  <Sparkles size={12} />
                  <span>{t('admin:ministry_scheduling.btn_autocomplete')}</span>
                </button>
              )}
            </div>

            <div className="space-y-2.5 pt-1">
              {sequenceSteps.map((stepGroupIds, stepIdx) => (
                <div
                  key={`step-${stepIdx}`}
                  className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">
                        {stepIdx + 1}
                      </span>
                      <span>{t('admin:ministry_scheduling.step_label', { index: stepIdx + 1 })}</span>
                    </span>

                    {sequenceSteps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(stepIdx)}
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
                          onClick={() => handleToggleGroupInStep(stepIdx, group.id)}
                          className={clsx(
                            'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5',
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
                          )}
                        >
                          <Users size={12} />
                          <span>{group.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddStep}
              className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-50 border border-dashed border-indigo-300 transition-colors cursor-pointer"
            >
              <Plus size={13} />
              <span>{t('admin:ministry_scheduling.btn_add_step')}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div>
            {existingRotation && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={isSaving || isDeleting}
                className="gap-1.5 text-xs font-bold"
              >
                <Trash2 size={13} />
                <span>{t('admin:ministry_scheduling.btn_delete_rotation')}</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={handleClose}
              disabled={isSaving || isDeleting}
            >
              {t('common:actions.cancel')}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              loading={isSaving}
              disabled={activeGroups.length === 0 || !selectedMeetingId}
              onClick={handleSave}
              className="gap-1.5 text-xs font-bold"
            >
              <span>{t('admin:calendar.save_assignment_btn')}</span>
            </Button>
          </div>
        </div>
      </div>
    </ModalOverlay>

      {/* Delete Confirmation */}
      <ConfirmModal
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title={t('admin:ministry_scheduling.delete_rotation_confirm_title')}
        description={t('admin:ministry_scheduling.delete_rotation_confirm_desc')}
        confirmText={t('common:actions.delete')}
        cancelText={t('common:actions.cancel')}
        type="danger"
        onConfirm={handleDeleteRotation}
      />
    </>
  );
};

export default MinistryRotationModal;
