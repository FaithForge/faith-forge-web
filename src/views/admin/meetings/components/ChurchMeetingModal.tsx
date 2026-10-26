import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import clsx from 'clsx';
import { toast } from 'sonner';
import {
  CalendarClock,
  Clock,
  CalendarDays,
  Tag,
  Repeat,
  Sparkles,
  Trash2,
  X,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import ModalOverlay from '@/components/ui/ModalOverlay';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import {
  ChurchMeetingKind,
  ChurchMeetingStateEnum,
  IChurchMeeting,
} from '@/libs/models';
import { Days } from '@/libs/common-types/constants';
import {
  useCreateChurchMeetingMutation,
  useUpdateChurchMeetingMutation,
  useGetChurchMeetingTagsQuery,
  useDeleteChurchMeetingTagMutation,
  useDeleteChurchMeetingMutation,
} from '@/libs/state/redux/api/churchApi';
import { useChurchTerm } from '@/libs/hooks/useTerm';

interface ChurchMeetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingToEdit?: IChurchMeeting | null;
  churchCampusId: string;
  defaultDate?: string;
  defaultKind?: ChurchMeetingKind;
  defaultInitialHour?: string;
  defaultFinalHour?: string;
  defaultInitialRegHour?: string;
  defaultFinalRegHour?: string;
  onSuccess?: () => void;
}

const DAY_INDEX_MAP: Record<number, Days> = {
  0: Days.SUNDAY,
  1: Days.MONDAY,
  2: Days.TUESDAY,
  3: Days.WEDNESDAY,
  4: Days.THURSDAY,
  5: Days.FRIDAY,
  6: Days.SATURDAY,
};

/**
 * Normalizes any time input to HH:mm string for input elements.
 *
 * @param {unknown} val - Time string or Date.
 * @returns {string} HH:mm string.
 */
const toTimeString = (val: unknown): string => {
  if (!val) return '09:00';
  if (typeof val === 'string') {
    const parts = val.split(':');
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
  }
  return '09:00';
};

/**
 * Converts HH:mm to HH:mm:00 required by BE regex.
 *
 * @param {string} timeStr - Time string in HH:mm.
 * @returns {string} Time string in HH:mm:00.
 */
const formatToBackendTime = (timeStr: string): string => {
  if (!timeStr) return '00:00:00';
  const parts = timeStr.split(':');
  const hh = parts[0].padStart(2, '0');
  const mm = (parts[1] || '00').padStart(2, '0');
  return `${hh}:${mm}:00`;
};

/**
 * Centered modal to create or edit a Church Meeting (Recurrent weekly or One-Time event with date, hours, and tag).
 *
 * @param {ChurchMeetingModalProps} props - Component properties.
 * @returns {JSX.Element | null} The rendered centered modal.
 */
export const ChurchMeetingModal: React.FC<ChurchMeetingModalProps> = ({
  open,
  onOpenChange,
  meetingToEdit,
  churchCampusId,
  defaultDate,
  defaultKind,
  defaultInitialHour,
  defaultFinalHour,
  defaultInitialRegHour,
  defaultFinalRegHour,
  onSuccess,
}) => {
  const { t } = useTranslation(['admin', 'common']);
  const meetingTerm = useChurchTerm('meeting');

  const [createMeeting, { isLoading: isCreating }] = useCreateChurchMeetingMutation();
  const [updateMeeting, { isLoading: isUpdating }] = useUpdateChurchMeetingMutation();
  const [deleteMeeting, { isLoading: isDeleting }] = useDeleteChurchMeetingMutation();
  const [deleteTag] = useDeleteChurchMeetingTagMutation();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: suggestedTags = [] } = useGetChurchMeetingTagsQuery(
    { churchCampusId, suggestionsOnly: true },
    { skip: !open || !churchCampusId },
  );

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState<ChurchMeetingKind>(ChurchMeetingKind.RECURRENT);
  const [day, setDay] = useState<Days>(Days.SUNDAY);
  const [specificDate, setSpecificDate] = useState<string>('');
  const [tagInput, setTagInput] = useState<string>('');
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [isAllDay, setIsAllDay] = useState<boolean>(false);
  const [initialHour, setInitialHour] = useState('09:00');
  const [finalHour, setFinalHour] = useState('11:00');
  const [initialRegHour, setInitialRegHour] = useState('08:30');
  const [finalRegHour, setFinalRegHour] = useState('10:00');
  const [position, setPosition] = useState<number | ''>('');
  const [state, setState] = useState<ChurchMeetingStateEnum>(ChurchMeetingStateEnum.ACTIVE);
  const [endDate, setEndDate] = useState<string>('');
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [nameError, setNameError] = useState('');
  const [dateError, setDateError] = useState('');

  const loading = isCreating || isUpdating;
  const isEditing = Boolean(meetingToEdit);
  const isAlreadyArchived = meetingToEdit?.state === ChurchMeetingStateEnum.ARCHIVED;

  // Determine whether this one-time meeting has already ended in the past
  const isPastMeeting = useMemo(() => {
    if (!meetingToEdit) return false;
    if (meetingToEdit.kind === ChurchMeetingKind.ONE_TIME && meetingToEdit.specificDate) {
      const endHour = meetingToEdit.finalHour || meetingToEdit.finalRegistrationHour;
      if (endHour) {
        const endDateTime = dayjs(`${meetingToEdit.specificDate} ${endHour}`, 'YYYY-MM-DD HH:mm:ss');
        if (endDateTime.isValid()) return endDateTime.isBefore(dayjs());
      }
      return dayjs(meetingToEdit.specificDate).endOf('day').isBefore(dayjs());
    }
    return false;
  }, [meetingToEdit]);

  const dayOptions = useMemo(
    () => [
      { id: Days.SUNDAY, name: t('admin:meetings.days.sunday') },
      { id: Days.SATURDAY, name: t('admin:meetings.days.saturday') },
      { id: Days.FRIDAY, name: t('admin:meetings.days.friday') },
      { id: Days.THURSDAY, name: t('admin:meetings.days.thursday') },
      { id: Days.WEDNESDAY, name: t('admin:meetings.days.wednesday') },
      { id: Days.TUESDAY, name: t('admin:meetings.days.tuesday') },
      { id: Days.MONDAY, name: t('admin:meetings.days.monday') },
    ],
    [t],
  );

  const stateOptions = useMemo(() => {
    if (isAlreadyArchived) {
      return [{ id: ChurchMeetingStateEnum.ARCHIVED, name: t('admin:meetings.status_archived') }];
    }
    if (!isEditing) {
      return [{ id: ChurchMeetingStateEnum.ACTIVE, name: t('admin:meetings.status_active') }];
    }
    return [
      { id: ChurchMeetingStateEnum.ACTIVE, name: t('admin:meetings.status_active') },
      { id: ChurchMeetingStateEnum.ARCHIVED, name: t('admin:meetings.status_archived') },
    ];
  }, [isEditing, isAlreadyArchived, t]);

  useEffect(() => {
    if (!open) return;

    if (meetingToEdit) {
      setName(meetingToEdit.name);
      setDescription(meetingToEdit.description || '');
      setKind(meetingToEdit.kind || ChurchMeetingKind.RECURRENT);
      setDay(meetingToEdit.day || Days.SUNDAY);
      setSpecificDate(meetingToEdit.specificDate || dayjs().format('YYYY-MM-DD'));
      setTagInput(meetingToEdit.tag?.name || '');
      setSelectedTagId(meetingToEdit.tagId || meetingToEdit.tag?.id || null);
      const startH = toTimeString(meetingToEdit.initialHour);
      const endH = toTimeString(meetingToEdit.finalHour);
      const isMeetingAllDay =
        startH === '00:00' && (endH === '23:59' || endH === '00:00');
      setIsAllDay(isMeetingAllDay);
      setInitialHour(startH);
      setFinalHour(endH);
      setInitialRegHour(toTimeString(meetingToEdit.initialRegistrationHour));
      setFinalRegHour(toTimeString(meetingToEdit.finalRegistrationHour));
      setPosition(meetingToEdit.position ?? '');
      setState(meetingToEdit.state || ChurchMeetingStateEnum.ACTIVE);
      setEndDate(meetingToEdit.endDate || '');
    } else {
      const initialDate = defaultDate || dayjs().format('YYYY-MM-DD');
      const inferredDay = DAY_INDEX_MAP[dayjs(initialDate).day()] || Days.SUNDAY;
      const startH = defaultInitialHour || '09:00';
      const endH = defaultFinalHour || '11:00';
      const isDefaultAllDay =
        startH === '00:00' && (endH === '23:59' || endH === '00:00');
      setIsAllDay(isDefaultAllDay);
      setName('');
      setDescription('');
      setKind(defaultKind || (defaultDate ? ChurchMeetingKind.ONE_TIME : ChurchMeetingKind.RECURRENT));
      setDay(inferredDay);
      setSpecificDate(initialDate);
      setTagInput('');
      setSelectedTagId(null);
      setInitialHour(startH);
      setFinalHour(endH);
      setInitialRegHour(
        defaultInitialRegHour || (isDefaultAllDay ? '00:00' : '08:30'),
      );
      setFinalRegHour(
        defaultFinalRegHour || (isDefaultAllDay ? '23:59' : '10:00'),
      );
      setPosition('');
      setState(ChurchMeetingStateEnum.ACTIVE);
      setEndDate('');
    }
    setNameError('');
    setDateError('');
  }, [
    open,
    meetingToEdit,
    defaultDate,
    defaultKind,
    defaultInitialHour,
    defaultFinalHour,
    defaultInitialRegHour,
    defaultFinalRegHour,
  ]);

  const handleToggleAllDay = (checked: boolean) => {
    setIsAllDay(checked);
    if (checked) {
      setInitialHour('00:00');
      setFinalHour('23:59');
      setInitialRegHour('00:00');
      setFinalRegHour('23:59');
    } else {
      setInitialHour('09:00');
      setFinalHour('11:00');
      setInitialRegHour('08:30');
      setFinalRegHour('10:00');
    }
  };

  const handleSpecificDateChange = (newDate: string) => {
    setSpecificDate(newDate);
    if (dateError) setDateError('');
    if (newDate) {
      const dayIdx = dayjs(newDate).day();
      const mappedDay = DAY_INDEX_MAP[dayIdx];
      if (mappedDay) setDay(mappedDay);
    }
  };

  const handleDeleteSuggestedTag = async (tagIdToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteTag(tagIdToDelete).unwrap();
      if (selectedTagId === tagIdToDelete) {
        setSelectedTagId(null);
        setTagInput('');
      }
      toast.success(t('admin:meetings.tag_deleted_success'));
    } catch {
      toast.error(t('admin:meetings.save_error', { meeting: meetingTerm.toLowerCase() }));
    }
  };

  const handleDeleteMeeting = async () => {
    if (isPastMeeting || !meetingToEdit) return;
    try {
      await deleteMeeting({
        id: meetingToEdit.id,
        churchCampusId,
      }).unwrap();
      toast.success(t('admin:meetings.delete_success', { meeting: meetingTerm }));
      setShowDeleteConfirm(false);
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error(t('admin:meetings.delete_error', { meeting: meetingTerm.toLowerCase() }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPastMeeting) return;

    if (!name.trim()) {
      setNameError(t('admin:meetings.field_name_required', { meeting: meetingTerm.toLowerCase() }));
      return;
    }

    if (kind === ChurchMeetingKind.ONE_TIME && !specificDate) {
      setDateError(t('admin:meetings.field_date_required'));
      return;
    }

    // Disallow scheduling new one-time meetings on dates that have already passed
    if (!meetingToEdit && kind === ChurchMeetingKind.ONE_TIME && specificDate) {
      const endHour = finalHour || finalRegHour || '23:59';
      const endDateTime = dayjs(`${specificDate} ${endHour}`, 'YYYY-MM-DD HH:mm');
      if (endDateTime.isValid() && endDateTime.isBefore(dayjs())) {
        setDateError(t('admin:calendar.past_date_schedule_blocked'));
        return;
      }
    }

    if (!churchCampusId) return;

    const effectiveDay =
      kind === ChurchMeetingKind.ONE_TIME && specificDate
        ? DAY_INDEX_MAP[dayjs(specificDate).day()] || day
        : day;

    const trimmedTag = tagInput.trim();
    const matchingExistingTag = suggestedTags.find(
      (tagItem) => tagItem.name.toLowerCase() === trimmedTag.toLowerCase(),
    );

    const payload = {
      churchCampusId,
      name: name.trim(),
      description: description.trim() || undefined,
      kind,
      day: effectiveDay,
      specificDate: kind === ChurchMeetingKind.ONE_TIME ? specificDate : null,
      endDate: state === ChurchMeetingStateEnum.ARCHIVED ? (endDate || dayjs().format('YYYY-MM-DD')) : null,
      tagId: trimmedTag ? (matchingExistingTag?.id ?? selectedTagId ?? null) : null,
      tagName: trimmedTag || null,
      initialHour: formatToBackendTime(initialHour),
      finalHour: formatToBackendTime(finalHour),
      initialRegistrationHour: formatToBackendTime(initialRegHour),
      finalRegistrationHour: formatToBackendTime(finalRegHour),
      position: position !== '' ? Number(position) : undefined,
      state,
    };

    const executeSave = async () => {
      try {
        if (isEditing && meetingToEdit) {
          await updateMeeting({
            id: meetingToEdit.id,
            ...payload,
          }).unwrap();
          toast.success(t('admin:meetings.updated_single_success', { meeting: meetingTerm }));
        } else {
          await createMeeting(payload).unwrap();
          toast.success(t('admin:meetings.created_success', { meeting: meetingTerm }));
        }
        onOpenChange(false);
        onSuccess?.();
      } catch (err: unknown) {
        const errorMsg =
          (err as { data?: { message?: string } })?.data?.message ||
          (err as { message?: string })?.message ||
          t('admin:meetings.save_error', { meeting: meetingTerm.toLowerCase() });
        if (typeof errorMsg === 'string' && errorMsg.includes('Cannot archive')) {
          toast.error(t('admin:meetings.cannot_archive_no_activity', { meeting: meetingTerm }));
        } else {
          toast.error(errorMsg);
        }
      }
    };

    if (!isAlreadyArchived && state === ChurchMeetingStateEnum.ARCHIVED) {
      setArchiveConfirmOpen(true);
      return;
    }

    await executeSave();
  };

  if (!open) return null;

  return (
    <ModalOverlay
      open={open}
      onClose={() => onOpenChange(false)}
      wrapperClassName="items-center justify-center p-3 sm:p-4"
      panelClassName="max-w-2xl w-full mx-auto"
    >
      <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-800/80 mx-auto">
        {/* Header */}
        <div className="px-6 py-4.5 flex items-center justify-between shrink-0 bg-slate-900 text-white rounded-t-3xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
              <CalendarClock size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-extrabold tracking-tight truncate">
                {isEditing
                  ? t('admin:meetings.modal_edit_title', { meeting: meetingTerm })
                  : t('admin:meetings.modal_create_title', { meeting: meetingTerm })}
              </h2>
              <p className="text-xs text-slate-300 truncate">
                {isEditing
                  ? t('admin:meetings.modal_edit_subtitle', { meeting: meetingTerm.toLowerCase() })
                  : t('admin:meetings.modal_create_subtitle', { meeting: meetingTerm.toLowerCase() })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          id="church-meeting-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-white"
        >
          {isPastMeeting && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-700 shrink-0">
                <Lock size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-amber-950">
                  {t('admin:calendar.past_meeting_readonly_title')}
                </p>
                <p className="text-xs text-amber-800">
                  {t('admin:calendar.past_meeting_readonly_desc')}
                </p>
              </div>
            </div>
          )}
        {/* Kind Selector: Recurrent vs One-Time */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            {t('admin:meetings.field_kind_label')}
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setKind(ChurchMeetingKind.RECURRENT)}
              className={clsx(
                'flex flex-col items-start p-2.5 rounded-xl text-left transition-all cursor-pointer',
                kind === ChurchMeetingKind.RECURRENT
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              <div className="flex items-center gap-1.5 font-extrabold text-xs">
                <Repeat size={14} className="text-primary shrink-0" />
                <span>{t('admin:meetings.kind_recurrent')}</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                {t('admin:meetings.kind_recurrent_desc')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setKind(ChurchMeetingKind.ONE_TIME)}
              className={clsx(
                'flex flex-col items-start p-2.5 rounded-xl text-left transition-all cursor-pointer',
                kind === ChurchMeetingKind.ONE_TIME
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              <div className="flex items-center gap-1.5 font-extrabold text-xs">
                <Sparkles size={14} className="text-amber-500 shrink-0" />
                <span>{t('admin:meetings.kind_one_time')}</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                {t('admin:meetings.kind_one_time_desc')}
              </span>
            </button>
          </div>
        </div>

        {/* Name Input */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            {t('admin:meetings.field_name_label', { meeting: meetingTerm })}{' '}
            <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <CalendarClock size={17} />
            </div>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError('');
              }}
              placeholder={t('admin:meetings.field_name_placeholder')}
              className="pl-10 placeholder:text-gray-400"
              disabled={loading}
              autoFocus
            />
          </div>
          {nameError && (
            <p className="text-xs text-rose-600 mt-1.5 font-medium">{nameError}</p>
          )}
        </div>

        {/* Day Selection (Recurrent) OR Specific Date Selection (One-Time) */}
        {kind === ChurchMeetingKind.RECURRENT ? (
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              {t('admin:meetings.field_day_label')} <span className="text-rose-500">*</span>
            </label>
            <Select
              value={day}
              onChange={(e) => setDay(e.target.value as Days)}
              disabled={loading}
            >
              <option value="" disabled>
                {t('admin:meetings.field_day_placeholder')}
              </option>
              {dayOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </Select>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              {t('admin:meetings.field_specific_date_label')}{' '}
              <span className="text-rose-500">*</span>
            </label>
            <Input
              type="date"
              value={specificDate}
              onChange={(e) => handleSpecificDateChange(e.target.value)}
              className="bg-white placeholder:text-gray-400"
              disabled={loading}
              required
            />
            {dateError && (
              <p className="text-xs text-rose-600 mt-1.5 font-medium">{dateError}</p>
            )}
          </div>
        )}

        {/* Event Tag / Campaign Input with 45-Day Active Suggestions & Delete Human Error */}
        <div className="bg-amber-50/40 rounded-2xl p-3.5 border border-amber-200/60 flex flex-col gap-2">
          <label className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
            <Tag size={14} className="text-amber-600" />
            <span>{t('admin:meetings.field_tag_label')}</span>
          </label>
          <Input
            value={tagInput}
            onChange={(e) => {
              setTagInput(e.target.value);
              setSelectedTagId(null);
            }}
            placeholder={t('admin:meetings.field_tag_placeholder')}
            className="bg-white placeholder:text-gray-400"
            disabled={loading}
          />
          <p className="text-[11px] text-slate-500 leading-snug">
            {t('admin:meetings.field_tag_hint')}
          </p>

          {suggestedTags.length > 0 && (
            <div className="pt-1">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                {t('admin:meetings.tag_suggestions_label')}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {suggestedTags.map((tagItem) => {
                  const isSelected =
                    tagInput.trim().toLowerCase() === tagItem.name.toLowerCase();
                  return (
                    <div
                      key={tagItem.id}
                      className={clsx(
                        'inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-bold border transition-all',
                        isSelected
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300',
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setTagInput(tagItem.name);
                          setSelectedTagId(tagItem.id);
                        }}
                        className="cursor-pointer"
                      >
                        {tagItem.name}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSuggestedTag(tagItem.id, e)}
                        title={t('admin:meetings.tag_delete_tooltip')}
                        className={clsx(
                          'w-4 h-4 rounded-full flex items-center justify-center transition-colors cursor-pointer',
                          isSelected
                            ? 'hover:bg-amber-600 text-white'
                            : 'hover:bg-rose-100 text-slate-400 hover:text-rose-600',
                        )}
                      >
                        <X size={11} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Service Hours Row */}
        <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-gray-100 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
              <Clock size={14} className="text-primary" />
              <span>{t('admin:meetings.field_schedule_title', { meeting: meetingTerm })}</span>
            </div>
            {/* All Day Toggle */}
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAllDay}
                onChange={(e) => handleToggleAllDay(e.target.checked)}
                className="sr-only peer"
                disabled={loading}
              />
              <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-primary relative" />
              <span className="text-xs font-bold text-slate-700">
                {t('admin:meetings.all_day_toggle')}
              </span>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                {t('admin:meetings.field_initial_hour')}
              </label>
              <Input
                type="time"
                value={initialHour}
                onChange={(e) => {
                  setInitialHour(e.target.value);
                  if (isAllDay && e.target.value !== '00:00') setIsAllDay(false);
                }}
                className="bg-white placeholder:text-gray-400"
                disabled={loading}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                {t('admin:meetings.field_final_hour')}
              </label>
              <Input
                type="time"
                value={finalHour}
                onChange={(e) => {
                  setFinalHour(e.target.value);
                  if (isAllDay && e.target.value !== '23:59') setIsAllDay(false);
                }}
                className="bg-white placeholder:text-gray-400"
                disabled={loading}
                required
              />
            </div>
          </div>
        </div>

        {/* Registration Hours Row */}
        <div className="bg-blue-50/50 rounded-2xl p-3.5 border border-blue-100 flex flex-col gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
            <CalendarDays size={14} className="text-blue-600" />
            <span>{t('admin:meetings.field_reg_schedule_title')}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                {t('admin:meetings.field_initial_reg_hour')}
              </label>
              <Input
                type="time"
                value={initialRegHour}
                onChange={(e) => setInitialRegHour(e.target.value)}
                className="bg-white placeholder:text-gray-400"
                disabled={loading}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                {t('admin:meetings.field_final_reg_hour')}
              </label>
              <Input
                type="time"
                value={finalRegHour}
                onChange={(e) => setFinalRegHour(e.target.value)}
                className="bg-white placeholder:text-gray-400"
                disabled={loading}
                required
              />
            </div>
          </div>
        </div>

        {/* Position & State */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              {t('admin:meetings.field_position_label')}
            </label>
            <Input
              type="number"
              min={1}
              value={position}
              onChange={(e) => setPosition(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="1, 2, 3..."
              className="placeholder:text-gray-400"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              {t('admin:meetings.field_state_label', { meeting: meetingTerm })}
            </label>
            <Select
              value={state}
              onChange={(e) => setState(e.target.value as ChurchMeetingStateEnum)}
              disabled={loading || isAlreadyArchived}
            >
              {stateOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </Select>
            {isAlreadyArchived && (
              <p className="mt-1 text-[11px] text-slate-500 font-medium">
                {t('admin:meetings.archived_meeting_locked_notice', { meeting: meetingTerm })}
              </p>
            )}
          </div>

          {state === ChurchMeetingStateEnum.ARCHIVED && (
            <div className="col-span-1 sm:col-span-2 space-y-3">
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider">
                    {t('admin:meetings.field_end_date_label')}
                  </label>
                  <span className="text-[11px] text-amber-700 font-medium">
                    {t('admin:meetings.field_end_date_desc')}
                  </span>
                </div>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={loading || isAlreadyArchived}
                />
              </div>

              {!isAlreadyArchived && (
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-950">
                  <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-amber-950">
                      {t('admin:meetings.archive_warning_title')}
                    </p>
                    <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
                      {t('admin:meetings.archive_warning_desc', { meeting: meetingTerm.toLowerCase() })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        </form>

        {/* Centered Modal Actions Footer */}
        {isPastMeeting ? (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-amber-800 font-semibold">
              <Lock size={14} className="text-amber-600 shrink-0" />
              <span>{t('admin:calendar.past_meeting_locked_notice')}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              {t('common:actions.close', { defaultValue: 'Cerrar' })}
            </Button>
          </div>
        ) : (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
            {isEditing ? (
              <Button
                type="button"
                variant="danger"
                size="md"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading || isDeleting}
                className="gap-1.5 text-xs font-bold"
              >
                <Trash2 size={14} />
                <span>{t('admin:meetings.delete_tooltip', { meeting: meetingTerm })}</span>
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={loading || isDeleting}
              >
                {t('common:actions.cancel')}
              </Button>
              <Button
                type="submit"
                form="church-meeting-form"
                loading={loading}
                disabled={isDeleting}
                variant="primary"
                className="shadow-sm"
              >
                {isEditing
                  ? t('common:actions.save')
                  : t('admin:meetings.modal_create_title', { meeting: meetingTerm })}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t('admin:meetings.delete_confirm_title', { meeting: meetingTerm })}
        description={t('admin:meetings.delete_confirm_desc', {
          meeting: meetingTerm.toLowerCase(),
          name: meetingToEdit?.name,
        })}
        confirmText={t('admin:meetings.delete_confirm_btn', { meeting: meetingTerm.toLowerCase() })}
        cancelText={t('common:actions.cancel')}
        type="danger"
        onConfirm={handleDeleteMeeting}
      />

      {/* Archive Confirmation Modal (Irreversible Action) */}
      <ConfirmModal
        open={archiveConfirmOpen}
        onOpenChange={setArchiveConfirmOpen}
        title={t('admin:meetings.archive_confirm_title', { meeting: meetingTerm })}
        description={t('admin:meetings.archive_confirm_desc', {
          meeting: meetingTerm.toLowerCase(),
        })}
        confirmText={t('admin:meetings.archive_confirm_btn')}
        cancelText={t('common:actions.cancel')}
        type="danger"
        onConfirm={async () => {
          setArchiveConfirmOpen(false);
          const effectiveDay =
            kind === ChurchMeetingKind.ONE_TIME && specificDate
              ? DAY_INDEX_MAP[dayjs(specificDate).day()] || day
              : day;

          const trimmedTag = tagInput.trim();
          const matchingExistingTag = suggestedTags.find(
            (tagItem) => tagItem.name.toLowerCase() === trimmedTag.toLowerCase(),
          );

          try {
            await updateMeeting({
              id: meetingToEdit!.id,
              churchCampusId,
              name: name.trim(),
              description: description.trim() || undefined,
              kind,
              day: effectiveDay,
              specificDate: kind === ChurchMeetingKind.ONE_TIME ? specificDate : null,
              endDate: endDate || dayjs().format('YYYY-MM-DD'),
              tagId: trimmedTag ? (matchingExistingTag?.id ?? selectedTagId ?? null) : null,
              tagName: trimmedTag || null,
              initialHour: formatToBackendTime(initialHour),
              finalHour: formatToBackendTime(finalHour),
              initialRegistrationHour: formatToBackendTime(initialRegHour),
              finalRegistrationHour: formatToBackendTime(finalRegHour),
              position: position !== '' ? Number(position) : undefined,
              state: ChurchMeetingStateEnum.ARCHIVED,
            }).unwrap();
            toast.success(t('admin:meetings.updated_single_success', { meeting: meetingTerm }));
            onOpenChange(false);
            onSuccess?.();
          } catch (err: unknown) {
            const errorMsg =
              (err as { data?: { message?: string } })?.data?.message ||
              (err as { message?: string })?.message ||
              t('admin:meetings.save_error', { meeting: meetingTerm.toLowerCase() });
            if (typeof errorMsg === 'string' && errorMsg.includes('Cannot archive')) {
              toast.error(t('admin:meetings.cannot_archive_no_activity', { meeting: meetingTerm }));
            } else {
              toast.error(errorMsg);
            }
          }
        }}
      />
    </ModalOverlay>
  );
};

export default ChurchMeetingModal;
