import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import clsx from 'clsx';
import {
  RotateCcw,
  Plus,
  Edit2,
  Clock,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import {
  EntityState,
  ICalendarMeetingInstance,
  IMinistryGroupConfig,
  IMinistryMeetingGroupAssignment,
  MinistryMeetingGroupAssignmentKind,
  ChurchMeetingStateEnum,
} from '@/libs/models';
import { Days } from '@/libs/common-types/constants';
import {
  useGetChurchMeetingsQuery,
  useGetMinistryGroupAssignmentsQuery,
} from '@/libs/state/redux/api/churchApi';
import MinistryRotationModal from '../components/MinistryRotationModal';
import QuickGroupAssignModal from '../components/QuickGroupAssignModal';
import ChurchScheduleCalendar from '@/components/calendar/ChurchScheduleCalendar';

dayjs.locale('es');

export interface MinistrySchedulingSectionProps {
  ministryId: string;
  churchCampusId: string;
  workspaceGroups?: IMinistryGroupConfig[];
  onRefreshWorkspace?: () => void;
}

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
 * Dedicated Ministry Scheduling View with Full-Width Calendar and Compact Rotation Rules Strip.
 * Strictly focused on Group Shift Assignments: Clicking any event opens QuickGroupAssignModal.
 *
 * @param {MinistrySchedulingSectionProps} props - Component properties.
 * @returns {JSX.Element} Rendered scheduling section.
 */
export const MinistrySchedulingSection: React.FC<MinistrySchedulingSectionProps> = ({
  ministryId,
  churchCampusId,
  workspaceGroups = [],
  onRefreshWorkspace,
}) => {
  const { t } = useTranslation(['admin', 'common']);

  // Active ministry groups
  const activeGroups = useMemo<IMinistryGroupConfig[]>(() => {
    return (workspaceGroups || [])
      .filter((group) => !group.state || group.state === EntityState.ACTIVE)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [workspaceGroups]);

  // Groups lookup map
  const groupsById = useMemo(() => {
    const map = new Map<string, IMinistryGroupConfig>();
    activeGroups.forEach((g) => map.set(g.id, g));
    return map;
  }, [activeGroups]);

  // 1. Fetch active rotations for this ministry
  const {
    data: rotations = [],
    isLoading: loadingRotations,
    refetch: refetchRotations,
  } = useGetMinistryGroupAssignmentsQuery(
    { ministryId, kind: MinistryMeetingGroupAssignmentKind.ROTATION },
    { skip: !ministryId },
  );

  // 2. Fetch campus church meetings (active only for assignment)
  const { data: churchMeetings = [] } = useGetChurchMeetingsQuery(
    { churchCampusId, states: [ChurchMeetingStateEnum.ACTIVE] },
    { skip: !churchCampusId },
  );

  const meetingsById = useMemo(() => {
    const map = new Map<string, (typeof churchMeetings)[0]>();
    churchMeetings.forEach((m) => map.set(m.id, m));
    return map;
  }, [churchMeetings]);

  const todayStr = useMemo(() => dayjs().format('YYYY-MM-DD'), []);

  // Rotations for active meetings only, excluding deprecated/expired ones.
  // Ordered from Sunday to Saturday, by hour, and with current (vigente) rules before upcoming ones.
  const activeRotations = useMemo(() => {
    return (rotations || [])
      .filter((rotation) => {
        const meeting = meetingsById.get(rotation.churchMeetingId);
        if (!meeting) return false;
        const st = meeting.state ?? ChurchMeetingStateEnum.ACTIVE;
        if (st !== ChurchMeetingStateEnum.ACTIVE) return false;

        // Discard deprecated / expired rotations whose endDate is in the past
        if (rotation.endDate && rotation.endDate < todayStr) {
          return false;
        }

        return true;
      })
      .sort((firstRotation, secondRotation) => {
        const meetingA = meetingsById.get(firstRotation.churchMeetingId);
        const meetingB = meetingsById.get(secondRotation.churchMeetingId);
        if (!meetingA || !meetingB) return 0;

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

        const nameCompare = meetingA.name.localeCompare(meetingB.name);
        if (nameCompare !== 0) return nameCompare;

        // For the same meeting: active/current first (startDate <= today), then upcoming by startDate
        const isUpcomingA = firstRotation.startDate > todayStr ? 1 : 0;
        const isUpcomingB = secondRotation.startDate > todayStr ? 1 : 0;
        if (isUpcomingA !== isUpcomingB) {
          return isUpcomingA - isUpcomingB;
        }

        return firstRotation.startDate.localeCompare(secondRotation.startDate);
      });
  }, [rotations, meetingsById, todayStr]);

  // Modals state
  const [rotationModalOpen, setRotationModalOpen] = useState(false);
  const [rotationToEdit, setRotationToEdit] = useState<IMinistryMeetingGroupAssignment | null>(null);

  const [quickAssignModalOpen, setQuickAssignModalOpen] = useState(false);
  const [instanceToAssign, setInstanceToAssign] = useState<ICalendarMeetingInstance | null>(null);

  // Calendar key trigger to force refresh on modal success
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);

  /**
   * Refreshes all scheduling related queries.
   */
  const handleDataRefresh = () => {
    refetchRotations();
    setCalendarRefreshKey((prev) => prev + 1);
    onRefreshWorkspace?.();
  };

  /**
   * Opens the rotation builder modal for a new rule or specific meeting.
   *
   * @param {IMinistryMeetingGroupAssignment | null} [rotation=null] - Optional rotation to edit.
   */
  const handleOpenRotationModal = (rotation: IMinistryMeetingGroupAssignment | null = null) => {
    setRotationToEdit(rotation);
    setRotationModalOpen(true);
  };

  /**
   * Opens the quick group assign modal for a specific meeting instance.
   *
   * @param {ICalendarMeetingInstance} instance - Target instance.
   */
  const handleOpenQuickAssign = (instance: ICalendarMeetingInstance) => {
    setInstanceToAssign(instance);
    setQuickAssignModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-5 pb-28 sm:pb-36">
      {/* Warning if no groups exist in ministry */}
      {activeGroups.length === 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-amber-800">
            <h4 className="font-bold">{t('admin:ministry_scheduling.no_groups_alert_title')}</h4>
            <p className="mt-0.5">{t('admin:ministry_scheduling.no_groups_alert_desc')}</p>
          </div>
        </div>
      )}

      {/* 1. Compact Distributions / Rotation Rules Strip */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col gap-3">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <RotateCcw size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900">
                  {t('admin:ministry_scheduling.rotations_title')}
                </h3>
                <span className="inline-flex items-center px-2 py-0.2 rounded-full text-[10.5px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {activeRotations.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.2">
                {t('admin:ministry_scheduling.rotations_subtitle')}
              </p>
            </div>
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={() => handleOpenRotationModal(null)}
            disabled={activeGroups.length === 0}
            className="gap-1.5 text-xs font-bold shrink-0 cursor-pointer text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-indigo-200"
          >
            <Plus size={14} className="text-indigo-600" />
            <span>{t('admin:ministry_scheduling.btn_configure_rotation')}</span>
          </Button>
        </div>

        {/* Compact Rules Chips (Single Row or Wrap) */}
        {activeRotations.length > 0 ? (
          <div className="flex items-center gap-2.5 flex-wrap pt-2.5 border-t border-slate-100">
            {activeRotations.map((rotation) => {
              const meeting = meetingsById.get(rotation.churchMeetingId);
              const meetingName = meeting ? meeting.name : 'Reunión';
              const meetingHours = meeting
                ? `${formatTimeShort(meeting.initialHour)} – ${formatTimeShort(meeting.finalHour)}`
                : '';

              const sequenceText = (rotation.groupSequence || [])
                .map((stepGroupIds, idx) => {
                  const names = stepGroupIds
                    .map((id) => groupsById.get(id)?.name || 'G')
                    .join(', ');
                  return `${idx + 1}. ${names}`;
                })
                .join(' ➔ ');

              const isUpcoming = rotation.startDate > todayStr;

              return (
                <div
                  key={rotation.id}
                  className={clsx(
                    'inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-colors shadow-2xs text-xs flex-wrap',
                    isUpcoming
                      ? 'bg-amber-50/40 border-amber-200/90 hover:bg-amber-50/80'
                      : 'bg-slate-50 border-slate-200/90 hover:bg-slate-100/80',
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-slate-900">{meetingName}</span>
                    {meetingHours && (
                      <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                        ({meetingHours})
                      </span>
                    )}
                  </div>

                  <span className="text-slate-300">&bull;</span>

                  {/* Status Badge: Vigente vs Próxima */}
                  {isUpcoming ? (
                    <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 text-[11px]">
                      <Clock size={11} className="text-amber-600" />
                      <span>
                        {t('admin:ministry_scheduling.rotation_status_upcoming', {
                          date: dayjs(rotation.startDate).format('DD/MM/YYYY'),
                        })}
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>
                        {rotation.endDate
                          ? t('admin:ministry_scheduling.rotation_status_active_until', {
                              date: dayjs(rotation.endDate).format('DD/MM/YYYY'),
                            })
                          : t('admin:ministry_scheduling.rotation_status_active')}
                      </span>
                    </span>
                  )}

                  <span className="text-slate-300">&bull;</span>

                  <span className="font-bold text-indigo-700 bg-indigo-50/90 px-2 py-0.5 rounded-lg border border-indigo-200/70 text-[11.5px]">
                    {sequenceText}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleOpenRotationModal(rotation)}
                    className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                    title={t('common:actions.edit', { defaultValue: 'Editar regla' })}
                  >
                    <Edit2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-slate-100 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-indigo-500 shrink-0" />
              <span>
                No hay rotaciones automáticas configuradas. Puedes definir cómo rotan los grupos semana a semana.
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleOpenRotationModal(null)}
              disabled={activeGroups.length === 0}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer shrink-0"
            >
              Configurar primera regla
            </button>
          </div>
        )}
      </div>

      {/* 2. El Calendario en Grande (Full-Width Stage) */}
      <div className="w-full">
        <ChurchScheduleCalendar
          churchCampusId={churchCampusId}
          fixedMinistryId={ministryId}
          ministryGroups={workspaceGroups}
          showMinistryFilter={false}
          hideMeetingCreation={true}
          hideStateFilter={true}
          onlyActiveMeetings={true}
          defaultView="timeGridWeek"
          refreshTrigger={calendarRefreshKey}
          helperHint="Haz clic en cualquier culto para ver o asignar los grupos de turno de este ministerio."
          onInstanceClick={(inst) => handleOpenQuickAssign(inst)}
        />
      </div>

      {/* Rotation Builder / Edit Modal */}
      <MinistryRotationModal
        open={rotationModalOpen}
        onOpenChange={setRotationModalOpen}
        ministryId={ministryId}
        churchCampusId={churchCampusId}
        activeGroups={activeGroups}
        existingRotation={rotationToEdit}
        onSuccess={handleDataRefresh}
      />

      {/* Quick Group Assign Modal (Purely focused on group assignments) */}
      <QuickGroupAssignModal
        open={quickAssignModalOpen}
        onOpenChange={setQuickAssignModalOpen}
        instance={instanceToAssign}
        ministryId={ministryId}
        activeGroups={activeGroups}
        onSuccess={handleDataRefresh}
      />
    </div>
  );
};

export default MinistrySchedulingSection;
