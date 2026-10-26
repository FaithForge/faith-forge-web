import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { DatesSetArg, EventClickArg, EventContentArg, EventInput, DateSelectArg } from '@fullcalendar/core';
import esLocale from '@fullcalendar/core/locales/es';
import dayjs from 'dayjs';
import clsx from 'clsx';
import { toast } from 'sonner';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Tag,
  Users,
  Sparkles,
  CalendarOff,
  Loader2,
  Clock,
  CalendarDays,
  Repeat,
  Archive,
  Lock,
} from 'lucide-react';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import {
  ChurchMeetingKind,
  ChurchMeetingStateEnum,
  EntityState,
  ICalendarMeetingInstance,
  IChurchMeeting,
  IMinistryGroupConfig,
} from '@/libs/models';
import {
  useGetCalendarMeetingsQuery,
  useGetChurchMeetingTagsQuery,
  useGetMinistriesQuery,
} from '@/libs/state/redux/api/churchApi';
import { useChurchTerm } from '@/libs/hooks/useTerm';
import CalendarInstanceModal from '@/components/modal/CalendarInstanceModal';
import ChurchMeetingModal from '@/views/admin/meetings/components/ChurchMeetingModal';

export interface ChurchScheduleCalendarProps {
  churchCampusId: string;
  /** Optional locked ministry ID (e.g., when rendered inside MinistryWorkspaceView) */
  fixedMinistryId?: string;
  /** Optional locked ministry name */
  fixedMinistryName?: string;
  /** Optional pre-loaded ministry groups */
  ministryGroups?: IMinistryGroupConfig[];
  /** Whether to show the ministry selector dropdown (defaults to false for pure church meetings view) */
  showMinistryFilter?: boolean;
  /** Custom handler when an instance/event is clicked */
  onInstanceClick?: (instance: ICalendarMeetingInstance) => void;
  /** Whether to hide meeting creation button and date drag creation */
  hideMeetingCreation?: boolean;
  /** Whether to hide meeting state filter */
  hideStateFilter?: boolean;
  /** Initial calendar view mode (defaults to 'timeGridWeek') */
  defaultView?: CalendarViewMode;
  /** Custom helper hint text */
  helperHint?: string;
  /** Whether to show only active meetings (defaults to true when fixedMinistryId is provided) */
  onlyActiveMeetings?: boolean;
  /** Optional incremental trigger to force refetch without unmounting or resetting calendar view */
  refreshTrigger?: number;
}

type CalendarViewMode = 'dayGridMonth' | 'timeGridWeek' | 'listWeek';

/**
 * Formats an HH:mm:ss or HH:mm string to 12-hour AM/PM format (e.g. 7:00 AM, 11:30 AM, 6:00 PM).
 *
 * @param {string | undefined} val - Raw time string.
 * @returns {string} Formatted 12-hour string with AM/PM.
 */
const formatAmPm = (val?: string): string => {
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
 * Google Calendar-style interactive schedule component powered by FullCalendar and Tailwind CSS.
 * Supports monthly, weekly, and agenda views, date clicking to create meetings/events,
 * and instance clicking to manage holiday suspensions, macro group assignments, and sequential rotations.
 *
 * @param {ChurchScheduleCalendarProps} props - Component properties.
 * @returns {JSX.Element} Rendered interactive calendar.
 */
export const ChurchScheduleCalendar: React.FC<ChurchScheduleCalendarProps> = ({
  churchCampusId,
  fixedMinistryId,
  fixedMinistryName,
  ministryGroups,
  showMinistryFilter = false,
  onInstanceClick,
  hideMeetingCreation = false,
  hideStateFilter = false,
  defaultView = 'timeGridWeek',
  helperHint,
  onlyActiveMeetings,
  refreshTrigger,
}) => {
  const { t } = useTranslation(['admin', 'common']);
  const meetingTerm = useChurchTerm('meeting');
  const meetingsTerm = useChurchTerm('meetings');

  const calendarRef = useRef<FullCalendar | null>(null);

  // Visible date range state (defaults to current week)
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>(() => ({
    from: dayjs().startOf('week').subtract(1, 'day').format('YYYY-MM-DD'),
    to: dayjs().endOf('week').add(1, 'day').format('YYYY-MM-DD'),
  }));
  const [calendarTitle, setCalendarTitle] = useState<string>('');
  const [currentView, setCurrentView] = useState<CalendarViewMode>(defaultView);

  // Filter states
  const [selectedMinistryId, setSelectedMinistryId] = useState<string>(fixedMinistryId || 'ALL');
  const [selectedTagId, setSelectedTagId] = useState<string>('ALL');

  // Modals state
  const [selectedInstance, setSelectedInstance] = useState<ICalendarMeetingInstance | null>(null);
  const [instanceModalOpen, setInstanceModalOpen] = useState(false);

  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [meetingToEdit, setMeetingToEdit] = useState<IChurchMeeting | null>(null);
  const [clickedDate, setClickedDate] = useState<string | undefined>(undefined);
  const [clickedKind, setClickedKind] = useState<ChurchMeetingKind | undefined>(undefined);
  const [clickedInitialHour, setClickedInitialHour] = useState<string | undefined>(undefined);
  const [clickedFinalHour, setClickedFinalHour] = useState<string | undefined>(undefined);
  const [clickedInitialRegHour, setClickedInitialRegHour] = useState<string | undefined>(undefined);
  const [clickedFinalRegHour, setClickedFinalRegHour] = useState<string | undefined>(undefined);

  const effectiveMinistryId =
    fixedMinistryId || (selectedMinistryId !== 'ALL' ? selectedMinistryId : undefined);

  // Fetch campus ministries when not locked to a fixed ministry and ministry filter is enabled
  const { data: campusMinistries = [] } = useGetMinistriesQuery(
    { churchCampusId },
    { skip: !churchCampusId || Boolean(fixedMinistryId) || !showMinistryFilter },
  );

  // Fetch tags for tag filter
  const { data: campusTags = [] } = useGetChurchMeetingTagsQuery(
    { churchCampusId, suggestionsOnly: false },
    { skip: !churchCampusId },
  );

  // Fetch calendar meeting instances
  const {
    data: instances = [],
    isFetching,
    refetch: refetchCalendar,
  } = useGetCalendarMeetingsQuery(
    {
      churchCampusId,
      ministryId: effectiveMinistryId,
      from: dateRange.from,
      to: dateRange.to,
      tagId: selectedTagId !== 'ALL' ? selectedTagId : undefined,
    },
    { skip: !churchCampusId || !dateRange.from || !dateRange.to },
  );

  // Synchronize refetch when external trigger signals updates
  React.useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      refetchCalendar();
    }
  }, [refreshTrigger, refetchCalendar]);

  const effectiveMinistryName = useMemo(() => {
    if (fixedMinistryName) return fixedMinistryName;
    if (!effectiveMinistryId) return undefined;
    return campusMinistries.find((m) => m.id === effectiveMinistryId)?.name;
  }, [fixedMinistryName, effectiveMinistryId, campusMinistries]);

  const ministryOptions = useMemo(() => {
    return [
      {
        id: 'ALL',
        name: t('admin:calendar.all_ministries_option', { meetings: meetingsTerm.toLowerCase() }),
      },
      ...campusMinistries.map((min) => ({
        id: min.id,
        name: min.name,
      })),
    ];
  }, [campusMinistries, t, meetingsTerm]);

  const tagOptions = useMemo(() => {
    return [
      { id: 'ALL', name: t('admin:calendar.tag_filter_all') },
      ...campusTags.map((tag) => ({
        id: tag.id,
        name: `🏷️ ${tag.name}`,
      })),
    ];
  }, [campusTags, t]);

  const filteredInstances = useMemo(() => {
    return instances.filter((inst) => {
      const st = inst.meeting.state ?? ChurchMeetingStateEnum.ACTIVE;

      // In ministry view or when onlyActiveMeetings is specified, strictly show ONLY ACTIVE meetings
      if (onlyActiveMeetings || fixedMinistryId) {
        return st === ChurchMeetingStateEnum.ACTIVE;
      }

      return true;
    });
  }, [instances, onlyActiveMeetings, fixedMinistryId]);

  // Keep selectedInstance synchronized with the live instances query after refetch
  const liveSelectedInstance = useMemo(() => {
    if (!selectedInstance) return null;
    return (
      instances.find((inst) => inst.instanceId === selectedInstance.instanceId) || selectedInstance
    );
  }, [instances, selectedInstance]);

  // Map backend instances to FullCalendar EventInput items
  const calendarEvents: EventInput[] = useMemo(() => {
    return filteredInstances.map((instance) => {
      const initH = instance.meeting.initialHour;
      const finalH = instance.meeting.finalHour;

      // Detect if meeting spans the entire day or lacks bounded hours
      const isAllDay =
        (!initH || initH.startsWith('00:00')) &&
        (!finalH || finalH.startsWith('23:59') || finalH.startsWith('00:00'));

      let startIso = `${instance.serviceDate}T${initH || '08:00:00'}`;
      let endIso = `${instance.serviceDate}T${finalH || '10:00:00'}`;
      if (startIso === endIso) {
        endIso = `${instance.serviceDate}T${dayjs(startIso).add(1, 'hour').format('HH:mm:ss')}`;
      }

      // Unique event key incorporates dynamic groups and cancellation so FullCalendar forces DOM update
      const groupsFingerprint = (instance.scheduledGroupIds || []).slice().sort().join('-');
      const dynamicEventId = `${instance.instanceId}::${groupsFingerprint}::${instance.isCancelled ? 'cancelled' : 'active'}::${instance.meeting.name}::${initH || ''}::${finalH || ''}::${instance.meeting.state || ''}`;

      return {
        id: dynamicEventId,
        title: instance.meeting.name,
        allDay: isAllDay,
        start: isAllDay ? instance.serviceDate : startIso,
        end: isAllDay ? instance.serviceDate : endIso,
        extendedProps: {
          instance,
        },
      };
    });
  }, [filteredInstances]);


  /**
   * Synchronizes the visible date range and header title when FullCalendar navigates.
   *
   * @param {DatesSetArg} arg - FullCalendar datesSet payload.
   */
  const handleDatesSet = (arg: DatesSetArg) => {
    const fromStr = dayjs(arg.start).format('YYYY-MM-DD');
    const toStr = dayjs(arg.end).subtract(1, 'day').format('YYYY-MM-DD');
    setCalendarTitle(arg.view.title);
    setDateRange((prev) => {
      if (prev.from === fromStr && prev.to === toStr) return prev;
      return { from: fromStr, to: toStr };
    });
  };

  /**
   * Navigates the calendar backward, forward, or to today.
   *
   * @param {'prev' | 'next' | 'today'} action - Navigation direction.
   */
  const handleNavigate = (action: 'prev' | 'next' | 'today') => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    if (action === 'prev') api.prev();
    else if (action === 'next') api.next();
    else api.today();
    setCalendarTitle(api.view.title);
  };

  /**
   * Switches between Month, Week, and Agenda views.
   *
   * @param {CalendarViewMode} view - Target FullCalendar view mode.
   */
  const handleViewChange = (view: CalendarViewMode) => {
    setCurrentView(view);
    const api = calendarRef.current?.getApi();
    if (api) {
      api.changeView(view);
      setCalendarTitle(api.view.title);
    }
  };

  /**
   * Opens the meeting creation modal pre-populated with the dragged or selected time slot (Google Calendar style).
   *
   * @param {DateSelectArg} arg - FullCalendar date select payload.
   */
  const handleCalendarSelect = (arg: DateSelectArg) => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api.unselect();
    }

    if (hideMeetingCreation) return;

    // Disallow scheduling on dates or time slots that have already passed
    const isPastTime = arg.allDay
      ? dayjs(arg.start).endOf('day').isBefore(dayjs())
      : dayjs(arg.start).isBefore(dayjs());

    if (isPastTime) {
      toast.info(t('admin:calendar.past_date_schedule_blocked'));
      return;
    }

    const startDate = dayjs(arg.start);
    const dateStr = startDate.format('YYYY-MM-DD');

    setMeetingToEdit(null);
    setClickedDate(dateStr);
    setClickedKind(ChurchMeetingKind.ONE_TIME);

    if (!arg.allDay) {
      const diffMinutes = dayjs(arg.end).diff(startDate, 'minute');
      const startHour = startDate.format('HH:mm');

      // If clicked without dragging or dragged <= 30 mins, default duration to 2 hours
      const endHour =
        diffMinutes <= 30
          ? startDate.add(2, 'hour').format('HH:mm')
          : dayjs(arg.end).format('HH:mm');

      // Smart registration schedule: 30 minutes before meeting start until 1 hour into the meeting
      const regStart = startDate.subtract(30, 'minute').format('HH:mm');
      const regEnd = startDate.add(1, 'hour').format('HH:mm');

      setClickedInitialHour(startHour);
      setClickedFinalHour(endHour);
      setClickedInitialRegHour(regStart);
      setClickedFinalRegHour(regEnd);
    } else {
      // All-day slot ("Día") or month selection: pre-fill full-day hours 00:00 to 23:59
      setClickedInitialHour('00:00');
      setClickedFinalHour('23:59');
      setClickedInitialRegHour('00:00');
      setClickedFinalRegHour('23:59');
    }

    setMeetingModalOpen(true);
  };

  /**
   * Opens the instance management modal when clicking an event on the calendar.
   *
   * @param {EventClickArg} arg - FullCalendar eventClick payload.
   */
  const handleEventClick = (arg: EventClickArg) => {
    const instance = arg.event.extendedProps.instance as ICalendarMeetingInstance | undefined;
    if (!instance) return;

    if (onInstanceClick) {
      onInstanceClick(instance);
      return;
    }

    setSelectedInstance(instance);
    setInstanceModalOpen(true);
  };

  /**
   * Custom Tailwind renderer for each calendar event pill/card.
   *
   * @param {EventContentArg} eventInfo - FullCalendar event content argument.
   * @returns {JSX.Element} Styled event card.
   */
  const renderEventContent = (eventInfo: EventContentArg) => {
    const instance = eventInfo.event.extendedProps.instance as ICalendarMeetingInstance | undefined;
    if (!instance) {
      return <span className="text-xs font-bold truncate">{eventInfo.event.title}</span>;
    }

    const isOneTime = instance.meeting.kind === ChurchMeetingKind.ONE_TIME;
    const isCancelled = instance.isCancelled;
    const meetingState = instance.meeting.state ?? ChurchMeetingStateEnum.ACTIVE;
    const isArchived =
      meetingState === ChurchMeetingStateEnum.ARCHIVED ||
      meetingState === ChurchMeetingStateEnum.DISABLE ||
      meetingState === ChurchMeetingStateEnum.INACTIVE;

    const startTime = formatAmPm(instance.meeting.initialHour);
    const endTime = formatAmPm(instance.meeting.finalHour);
    const groups = instance.scheduledGroups || [];

    const endHour = instance.meeting.finalHour || instance.meeting.finalRegistrationHour;
    const isPast = endHour
      ? dayjs(`${instance.serviceDate} ${endHour}`, 'YYYY-MM-DD HH:mm:ss').isBefore(dayjs())
      : dayjs(instance.serviceDate).endOf('day').isBefore(dayjs());

    // Calculate duration in minutes if start and end dates are present
    const durationMinutes =
      eventInfo.event.start && eventInfo.event.end
        ? dayjs(eventInfo.event.end).diff(dayjs(eventInfo.event.start), 'minute')
        : 60;
    const isShort = durationMinutes <= 45;

    if (eventInfo.event.allDay) {
      return (
        <div
          className={clsx(
            'w-full rounded-lg px-2 py-0.5 text-left transition-all shadow-xs hover:shadow-md flex items-center justify-between gap-1 overflow-hidden cursor-pointer select-none ring-1.5 ring-white/95 border border-white/20',
            isCancelled
              ? 'bg-rose-100 text-rose-800 line-through border border-rose-300'
              : isArchived
              ? 'bg-amber-700 hover:bg-amber-800 text-white'
              : isPast
              ? 'bg-slate-200 hover:bg-slate-300 text-slate-800 border border-slate-300'
              : isOneTime
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
              : 'bg-sky-600 hover:bg-sky-700 text-white',
          )}
          title={instance.meeting.name}
        >
          <span className="text-xs font-semibold truncate leading-tight flex items-center gap-1">
            {isPast && <Lock size={10} className={isPast ? 'shrink-0 text-slate-500' : 'shrink-0 text-white/80'} />}
            {isArchived && <Archive size={11} className="shrink-0 text-amber-200" />}
            <span>{instance.meeting.name}</span>
          </span>
          {instance.meeting.tag && (
            <span
              className={clsx(
                'text-[10px] px-1 py-0.2 rounded shrink-0 font-medium',
                isPast && !isCancelled && !isArchived ? 'bg-slate-300 text-slate-700' : 'bg-black/15 text-white',
              )}
            >
              {instance.meeting.tag.name}
            </span>
          )}
        </div>
      );
    }

    return (
      <div
        className={clsx(
          'w-full h-full rounded-lg p-1.5 sm:p-2 text-left transition-all duration-150 cursor-pointer select-none flex flex-col justify-start gap-0.5 overflow-hidden ring-2 ring-white/95 shadow-md hover:shadow-xl hover:scale-[1.01] border border-white/20',
          isCancelled
            ? 'bg-rose-100 text-rose-900 border-rose-300'
            : isArchived
            ? 'bg-amber-700 hover:bg-amber-800 text-white'
            : isPast
            ? 'bg-slate-200 hover:bg-slate-300/90 text-slate-800 border-slate-300'
            : isOneTime
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
            : 'bg-sky-600 hover:bg-sky-700 text-white',
        )}
        title={`${instance.meeting.name} (${startTime} - ${endTime})`}
      >
        {/* Title */}
        <div
          className={clsx(
            'text-xs font-bold leading-snug line-clamp-2 break-words flex items-center gap-1',
            isCancelled
              ? 'line-through text-rose-800'
              : isPast && !isArchived
              ? 'text-slate-800'
              : 'text-white',
          )}
        >
          {isPast && <Lock size={11} className={isPast && !isArchived ? 'shrink-0 text-slate-500' : 'shrink-0 text-white/75'} />}
          {isArchived && <Archive size={12} className="shrink-0 text-amber-200" />}
          <span>{instance.meeting.name}</span>
        </div>

        {/* Time range */}
        <div
          className={clsx(
            'text-[11px] font-medium leading-none truncate',
            isCancelled
              ? 'text-rose-700'
              : isPast && !isArchived
              ? 'text-slate-600'
              : 'text-white/90',
          )}
        >
          {startTime}{endTime ? ` – ${endTime}` : ''}
        </div>

        {/* Tag (if present) */}
        {instance.meeting.tag && (
          <div
            className={clsx(
              'mt-1 self-start text-[10px] font-medium px-1.5 py-0.2 rounded truncate max-w-full',
              isPast && !isCancelled && !isArchived
                ? 'bg-slate-300/90 text-slate-700'
                : 'bg-black/15 text-white',
            )}
          >
            🏷️ {instance.meeting.tag.name}
          </div>
        )}

        {/* Scheduled Groups (when ministry is selected) */}
        {!isCancelled && effectiveMinistryId && groups.length > 0 && (
          <div className="mt-1 self-start bg-white/20 text-white text-[10px] font-medium px-1.5 py-0.2 rounded truncate max-w-full">
            👥 {groups.map((g) => g.name).join(', ')}
          </div>
        )}

        {/* Cancelled indicator */}
        {isCancelled && (
          <div className="mt-1 text-[10px] font-bold text-rose-700">
            {t('admin:calendar.cancelled_badge')}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col mb-12 sm:mb-16">
      {/* Top Google Calendar-style Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/50 flex flex-col gap-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Navigation & Current Period Title */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => handleNavigate('prev')}
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('today')}
                className="px-3 py-1 text-xs font-extrabold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                {t('admin:calendar.today_btn')}
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('next')}
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Siguiente"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <CalendarIcon size={18} className="text-primary shrink-0" />
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 capitalize">
                {calendarTitle}
              </h2>
              {isFetching && <Loader2 size={15} className="animate-spin text-primary" />}
            </div>
          </div>

          {/* Right: View Switcher & New Event Button */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5 flex-wrap">
            <div className="inline-flex items-center rounded-xl bg-slate-200/80 p-1 border border-slate-200">
              {(
                [
                  { key: 'dayGridMonth', label: t('admin:calendar.view_month') },
                  { key: 'timeGridWeek', label: t('admin:calendar.view_week') },
                  { key: 'listWeek', label: t('admin:calendar.view_agenda') },
                ] as { key: CalendarViewMode; label: string }[]
              ).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleViewChange(item.key)}
                  className={clsx(
                    'px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                    currentView === item.key
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {!hideMeetingCreation && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  setMeetingToEdit(null);
                  setClickedDate(dayjs().format('YYYY-MM-DD'));
                  setClickedKind(ChurchMeetingKind.ONE_TIME);
                  setClickedInitialHour('09:00');
                  setClickedFinalHour('11:00');
                  setClickedInitialRegHour('08:30');
                  setClickedFinalRegHour('10:00');
                  setMeetingModalOpen(true);
                }}
                className="gap-1.5 text-xs font-bold shadow-2xs"
              >
                <Plus size={14} />
                <span>{t('admin:calendar.new_event_btn', { meeting: meetingTerm })}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Second Toolbar Row: Ministry & Tag Filters + Helper Hint */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200/60">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles size={14} className="text-primary shrink-0" />
            <span>{helperHint || t('admin:calendar.click_day_hint', { meeting: meetingTerm.toLowerCase() })}</span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 flex-wrap">
            {showMinistryFilter && !fixedMinistryId && (
              <div className="w-full sm:w-60">
                <Select
                  value={selectedMinistryId}
                  onChange={(e) => setSelectedMinistryId(e.target.value)}
                  className="text-xs font-semibold py-2"
                >
                  {ministryOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {campusTags.length > 0 && (
              <div className="w-full sm:w-48">
                <Select
                  value={selectedTagId}
                  onChange={(e) => setSelectedTagId(e.target.value)}
                  className="text-xs font-semibold py-2"
                >
                  {tagOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Calendar Color Legend Bar */}
        <div className="px-4 sm:px-5 pb-3 pt-1 flex items-center justify-between flex-wrap gap-2.5 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3.5 flex-wrap text-xs font-medium text-slate-600">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              {t('admin:calendar.legend_title', { defaultValue: 'Leyenda' })}:
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-600 shrink-0" />
              <span>{t('admin:calendar.legend_recurrent')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0" />
              <span>{t('admin:calendar.legend_one_time')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
              <span>{t('admin:calendar.legend_cancelled')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 border border-slate-400 shrink-0" />
              <span>{t('admin:calendar.legend_finished')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-700 shrink-0" />
              <span>{t('admin:calendar.legend_archived')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* FullCalendar Interactive Grid */}
      <div className="p-3 sm:p-5 pb-6 sm:pb-8 fc-tailwind-wrapper">
        <style>{`
          .fc-tailwind-wrapper .fc {
            --fc-border-color: #e2e8f0;
            --fc-today-bg-color: rgba(2, 132, 199, 0.05);
            --fc-page-bg-color: #ffffff;
            --fc-neutral-bg-color: #f8fafc;
            font-family: inherit;
          }
          .fc-tailwind-wrapper .fc-timegrid-body {
            padding-bottom: 28px;
          }
          .fc-tailwind-wrapper .fc-scroller {
            padding-bottom: 12px;
          }
          .fc-tailwind-wrapper .fc-col-header-cell {
            background-color: #f8fafc;
            padding: 10px 4px;
            font-size: 0.75rem;
            font-weight: 800;
            text-transform: uppercase;
            color: #475569;
          }
          .fc-tailwind-wrapper .fc-col-header-cell.fc-day-today {
            background-color: rgba(2, 132, 199, 0.08);
            color: #0284c7;
          }
          .fc-tailwind-wrapper .fc-col-header-cell.fc-day-today .fc-col-header-cell-cushion {
            color: #0284c7;
            font-weight: 800;
          }
          /* Past days header styling (muted gray) */
          .fc-tailwind-wrapper .fc-col-header-cell.fc-day-past {
            background-color: #f1f5f9;
            color: #94a3b8;
          }
          .fc-tailwind-wrapper .fc-col-header-cell.fc-day-past .fc-col-header-cell-cushion {
            color: #94a3b8;
          }
          /* Past days columns & cells (soft gray shading to clearly indicate elapsed time) */
          .fc-tailwind-wrapper .fc-daygrid-day.fc-day-past {
            background-color: rgba(241, 245, 249, 0.7) !important;
          }
          .fc-tailwind-wrapper .fc-daygrid-day.fc-day-past .fc-daygrid-day-number {
            color: #94a3b8;
          }
          .fc-tailwind-wrapper .fc-daygrid-day.fc-day-past:hover {
            background-color: rgba(226, 232, 240, 0.7) !important;
          }
          .fc-tailwind-wrapper .fc-timegrid-col.fc-day-past {
            background-color: rgba(241, 245, 249, 0.75) !important;
          }
          .fc-tailwind-wrapper .fc-timegrid-col.fc-day-past:hover {
            background-color: rgba(226, 232, 240, 0.55) !important;
          }
          .fc-tailwind-wrapper .fc-timegrid-all-day .fc-day-past {
            background-color: #f1f5f9 !important;
          }
          .fc-tailwind-wrapper .fc-daygrid-day-number {
            font-size: 0.75rem;
            font-weight: 700;
            color: #334155;
            padding: 6px 8px;
          }
          .fc-tailwind-wrapper .fc-daygrid-day:hover {
            background-color: #f8fafc;
            cursor: pointer;
          }
          .fc-tailwind-wrapper .fc-daygrid-event {
            background: transparent !important;
            border: none !important;
            margin-top: 2px;
            margin-bottom: 2px;
          }
          .fc-tailwind-wrapper .fc-timegrid-event {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 8px !important;
            transition: transform 0.15s ease, z-index 0.1s ease;
          }
          .fc-tailwind-wrapper .fc-timegrid-event:hover {
            z-index: 50 !important;
          }
          .fc-tailwind-wrapper .fc-h-event {
            background: transparent !important;
            border: none !important;
          }
          .fc-tailwind-wrapper .fc-highlight {
            background: rgba(2, 132, 199, 0.22) !important;
            border: 1.5px solid rgba(2, 132, 199, 0.55) !important;
            border-radius: 8px !important;
          }
          .fc-tailwind-wrapper .fc-event-mirror {
            background: rgba(2, 132, 199, 0.25) !important;
            border: 1.5px dashed #0284c7 !important;
            border-radius: 8px !important;
          }
          .fc-tailwind-wrapper .fc-timegrid-slot-lane {
            cursor: pointer;
          }
          .fc-tailwind-wrapper .fc-timegrid-slot-lane:hover {
            background-color: rgba(2, 132, 199, 0.03);
          }
          /* Right gutter margin on event columns to easily drag/click concurrent meetings */
          .fc-tailwind-wrapper .fc-direction-ltr .fc-timegrid-col-events,
          .fc-tailwind-wrapper .fc-timegrid-col-events {
            margin-right: 24px !important;
          }
          .fc-tailwind-wrapper .fc-timegrid-all-day {
            background-color: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
          }
          .fc-tailwind-wrapper .fc-timegrid-all-day-cushion {
            font-size: 0.7rem;
            font-weight: 800;
            text-transform: uppercase;
            color: #64748b;
          }
          .fc-tailwind-wrapper .fc-timegrid-axis-cushion,
          .fc-tailwind-wrapper .fc-timegrid-slot-label-cushion {
            font-size: 0.72rem;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
          }
        `}</style>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView={currentView}
          locale={esLocale}
          headerToolbar={false}
          datesSet={handleDatesSet}
          events={calendarEvents}
          selectable={!hideMeetingCreation}
          selectMirror={true}
          unselectAuto={true}
          slotEventOverlap={true}
          selectLongPressDelay={200}
          select={handleCalendarSelect}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          dayMaxEvents={4}
          height={currentView === 'timeGridWeek' ? 720 : 'auto'}
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          scrollTime="07:00:00"
          scrollTimeReset={false}
          allDaySlot={true}
          allDayText={t('admin:calendar.all_day_label', { defaultValue: 'Día' })}
          nowIndicator={true}
          firstDay={0}
          slotDuration="00:30:00"
          slotLabelInterval="01:00"
          snapDuration="00:15:00"
          slotLabelFormat={(dateInfo) => {
            const h = dateInfo.date.hour;
            const m = dateInfo.date.minute;
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            return m === 0 ? `${h12} ${ampm}` : `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
          }}
          slotLabelContent={(arg) => {
            return arg.text.replace(/([ap])\.\s*m\./gi, '$1M');
          }}
          eventTimeFormat={(dateInfo) => {
            const formatPart = (d: { hour: number; minute: number }) => {
              const ampm = d.hour >= 12 ? 'PM' : 'AM';
              const h12 = d.hour % 12 || 12;
              const mStr = d.minute.toString().padStart(2, '0');
              return `${h12}:${mStr} ${ampm}`;
            };
            if (dateInfo.end) {
              return `${formatPart(dateInfo.start)} - ${formatPart(dateInfo.end)}`;
            }
            return formatPart(dateInfo.date);
          }}
        />
      </div>

      {/* Instance Management Modal (Holidays, Rotations & Macro Events) */}
      <CalendarInstanceModal
        open={instanceModalOpen}
        onOpenChange={setInstanceModalOpen}
        instance={liveSelectedInstance}
        churchCampusId={churchCampusId}
        ministryId={effectiveMinistryId}
        ministryName={effectiveMinistryName}
        ministryGroups={ministryGroups}
        onSuccess={() => {
          refetchCalendar();
        }}
        onAddConcurrentMeeting={(inst) => {
          setInstanceModalOpen(false);
          setMeetingToEdit(null);
          setClickedDate(inst.serviceDate);
          setClickedKind(inst.meeting.kind);
          setClickedInitialHour(inst.meeting.initialHour || '09:00');
          setClickedFinalHour(inst.meeting.finalHour || '11:00');
          setClickedInitialRegHour(inst.meeting.initialRegistrationHour || '08:30');
          setClickedFinalRegHour(inst.meeting.finalRegistrationHour || '10:00');
          setMeetingModalOpen(true);
        }}
        onEditMeeting={(inst) => {
          setInstanceModalOpen(false);
          setMeetingToEdit(inst.meeting);
          setClickedDate(undefined);
          setClickedKind(undefined);
          setClickedInitialHour(undefined);
          setClickedFinalHour(undefined);
          setClickedInitialRegHour(undefined);
          setClickedFinalRegHour(undefined);
          setMeetingModalOpen(true);
        }}
      />

      {/* Create / Edit Meeting Modal */}
      <ChurchMeetingModal
        open={meetingModalOpen}
        onOpenChange={setMeetingModalOpen}
        meetingToEdit={meetingToEdit}
        churchCampusId={churchCampusId}
        defaultDate={clickedDate}
        defaultKind={clickedKind}
        defaultInitialHour={clickedInitialHour}
        defaultFinalHour={clickedFinalHour}
        defaultInitialRegHour={clickedInitialRegHour}
        defaultFinalRegHour={clickedFinalRegHour}
        onSuccess={() => {
          refetchCalendar();
        }}
      />
    </div>
  );
};

export default ChurchScheduleCalendar;
