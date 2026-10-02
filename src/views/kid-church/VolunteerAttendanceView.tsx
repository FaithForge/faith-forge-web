import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Minus,
  RefreshCw,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetVolunteerAssignments } from '@/libs/state/redux/thunks/church/volunteer.thunk';
import {
  useGetVolunteerAttendanceQuery,
  useRecordVolunteerAttendanceMutation,
} from '@/libs/state/redux/api/churchApi';
import {
  EntityState,
  IVolunteerAssignment,
  VolunteerAttendanceStatus,
  VolunteerRole,
} from '@/libs/models';
import { useChurchMeetingStatus } from '@/libs/hooks/useChurchMeetingStatus';
import { usePermissions } from '@/libs/hooks/usePermissions';
import { useVolunteerAttendanceLiveSync } from '@/libs/hooks/useVolunteerAttendanceLiveSync';
import { useChurchTerm, useKidsTerm } from '@/libs/hooks/useTerm';
import { isFeatureEnabled } from '@/config/features';
import { APP_ROUTES } from '@/config/routes';
import PullToRefresh from '@/components/ui/PullToRefresh';
import AreaAttendanceDrawer from './components/AreaAttendanceDrawer';

const EMPTY_ASSIGNMENTS: IVolunteerAssignment[] = [];

export interface AreaStats {
  id: string;
  name: string;
  total: number;
  taken: number;
  pending: number;
  attended: number;
  excused: number;
  unexcused: number;
  exempt: number;
  isComplete: boolean;
  assignments: IVolunteerAssignment[];
}

/**
 * Skeleton loader matching the statistical attendance dashboard structure.
 *
 * @returns {JSX.Element} Rendered animated dashboard skeleton.
 */
const VolunteerAttendanceDashboardSkeleton: React.FC = () => {
  return (
    <div
      className="space-y-4 animate-pulse pt-1"
      aria-busy="true"
      aria-label="Cargando estadísticas de asistencia"
    >
      {/* 1. Status Banner Skeleton */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-200 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="h-4 w-44 bg-slate-200 rounded-md" />
              <div className="h-4 w-20 bg-slate-200 rounded-full" />
            </div>
            <div className="h-3 w-4/5 bg-slate-100 rounded-md mt-2" />
            {/* Progress bar skeleton */}
            <div className="mt-3">
              <div className="flex justify-between mb-1.5">
                <div className="h-2.5 w-24 bg-slate-100 rounded-md" />
                <div className="h-2.5 w-8 bg-slate-100 rounded-md" />
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. 4 General Statistics Cards Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200 shadow-2xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-lg bg-slate-200" />
              <div className="h-6 w-8 bg-slate-200 rounded-md" />
            </div>
            <div className="mt-2.5">
              <div className="h-3.5 w-16 bg-slate-200 rounded-md" />
              <div className="h-2.5 w-24 bg-slate-100 rounded-md mt-1" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Section Title Skeleton */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <div className="h-4 w-36 bg-slate-200 rounded-md" />
          <div className="h-4 w-12 bg-slate-200 rounded-full" />
        </div>
        <div className="h-3.5 w-16 bg-slate-100 rounded-md" />
      </div>

      {/* 4. Area Cards Skeleton (3 cards) */}
      <div className="space-y-3">
        {[0, 1, 2].map((idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200 shadow-2xs space-y-3"
          >
            {/* Title & Badge */}
            <div className="flex items-center justify-between">
              <div className="h-5 w-40 bg-slate-200 rounded-md" />
              <div className="h-5 w-16 bg-slate-200 rounded-full" />
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <div className="h-2.5 w-20 bg-slate-100 rounded-md" />
                <div className="h-2.5 w-8 bg-slate-100 rounded-md" />
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full" />
            </div>

            {/* 4 Compact Stat Pills */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-4 gap-1.5 flex-1">
                {[0, 1, 2, 3].map((pillIdx) => (
                  <div key={pillIdx} className="h-6 bg-slate-100 rounded-lg" />
                ))}
              </div>
              <div className="w-5 h-5 bg-slate-100 rounded-full shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Mobile-first statistical dashboard enabling group coordinators to view attendance
 * metrics (attended, excused, unexcused, exempt), assess data completeness via a status banner,
 * and drill into individual areas via a lateral slide-over sheet to record attendance.
 *
 * @returns {JSX.Element} Rendered volunteer attendance statistical dashboard.
 */
export const VolunteerAttendanceView: React.FC = () => {
  const { t } = useTranslation(['kidChurch', 'common']);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { currentMeeting, currentCampus } = useChurchMeetingStatus();
  const { canTakeVolunteerAttendance, isSuperAdmin } = usePermissions();

  const classroomTerm = useKidsTerm('classroom');
  const classroomsTerm = useKidsTerm('classrooms');
  const teachersTerm = useKidsTerm('teachers');
  const teacherTerm = useKidsTerm('teacher');
  const meetingTerm = useChurchTerm('meeting');

  // Guard: Feature flag gating and permission
  useEffect(() => {
    if (!isFeatureEnabled('volunteerAttendance') || !canTakeVolunteerAttendance) {
      navigate(APP_ROUTES.kidChurch.root, { replace: true });
    }
  }, [navigate, canTakeVolunteerAttendance]);

  const {
    activeCampusId,
    activeCampusName,
    activeGroupConfigId,
    activeGroupConfigName,
  } = useAppSelector((state) => state.volunteerContextSlice);

  const churchOverrides = useAppSelector(
    (state) =>
      state.churchCampusSlice.churchTerminologyOverrides ||
      state.churchCampusSlice.church?.terminologyOverrides,
  );

  const effectiveCampusId = activeCampusId || currentCampus?.id;
  const effectiveCampusName = activeCampusName || currentCampus?.name;
  const effectiveGroupId =
    activeGroupConfigId && activeGroupConfigId !== 'ADMIN_GROUP'
      ? activeGroupConfigId
      : undefined;

  const partitionKey = `attendance-team-${effectiveCampusId}-${effectiveGroupId || 'all'}`;

  const assignments =
    useAppSelector(
      (state) => state.volunteerSlice.assignmentsByPartition[partitionKey],
    ) ?? EMPTY_ASSIGNMENTS;

  const isLoadingAssignments = useAppSelector(
    (state) => state.volunteerSlice.loadingByPartition[partitionKey] || false,
  );

  const [savingAssignmentIds, setSavingAssignmentIds] = useState<Record<string, boolean>>({});
  const [optimisticStatusMap, setOptimisticStatusMap] = useState<
    Record<string, VolunteerAttendanceStatus>
  >({});
  const [drawerAreaId, setDrawerAreaId] = useState<string | null>(null);

  // Fetch active team assignments for this coordinator's group
  const loadTeamData = React.useCallback(() => {
    if (!effectiveCampusId || (!effectiveGroupId && !isSuperAdmin)) return;

    dispatch(
      GetVolunteerAssignments({
        churchCampusId: effectiveCampusId,
        ministryGroupConfigId: effectiveGroupId,
        state: EntityState.ACTIVE,
        partitionKey,
        force: true,
      }),
    );
  }, [dispatch, effectiveCampusId, effectiveGroupId, isSuperAdmin, partitionKey]);

  useEffect(() => {
    loadTeamData();
  }, [loadTeamData]);

  const todayIso = useMemo(() => dayjs().format('YYYY-MM-DD'), []);

  // RTK Query: Recorded attendances for this meeting and group
  const {
    data: recordedAttendances = [],
    isLoading: isLoadingAttendance,
    refetch: refetchAttendance,
  } = useGetVolunteerAttendanceQuery(
    {
      churchMeetingId: currentMeeting?.id,
      ministryGroupConfigId: effectiveGroupId,
      attendanceDate: todayIso,
      limit: 500,
    },
    {
      skip: !currentMeeting?.id || (!effectiveGroupId && !isSuperAdmin),
    },
  );

  // Realtime Live Sync: SSE events and auto-invalidates RTK Query cache
  useVolunteerAttendanceLiveSync({
    churchMeetingId: currentMeeting?.id,
    enabled: Boolean(currentMeeting?.id && (effectiveGroupId || isSuperAdmin)),
  });

  // Mutation: Record or update volunteer attendance
  const [recordAttendanceMutation] = useRecordVolunteerAttendanceMutation();

  // Map of volunteerAssignmentId -> recorded attendance
  const attendanceMap = useMemo(() => {
    const map = new Map<string, (typeof recordedAttendances)[0]>();
    for (const att of recordedAttendances) {
      if (att.volunteerAssignmentId) {
        map.set(att.volunteerAssignmentId, att);
      }
    }
    return map;
  }, [recordedAttendances]);

  // Clean up confirmed optimistic updates once server data arrives
  useEffect(() => {
    if (recordedAttendances.length > 0) {
      setOptimisticStatusMap((prev) => {
        const keys = Object.keys(prev);
        if (keys.length === 0) return prev;
        let changed = false;
        const next = { ...prev };
        for (const id of keys) {
          const serverStatus = attendanceMap.get(id)?.attendanceStatus;
          if (serverStatus === prev[id]) {
            delete next[id];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }
  }, [recordedAttendances, attendanceMap]);

  // Exclude higher leadership roles if listed
  const eligibleAssignments = useMemo(() => {
    return assignments.filter(
      (asg) => asg.role !== VolunteerRole.MINISTRY_GENERAL_COORDINATOR,
    );
  }, [assignments]);

  // Computed live metrics per area
  const areaStatsList: AreaStats[] = useMemo(() => {
    const areaMap = new Map<string, AreaStats>();

    for (const asg of eligibleAssignments) {
      const area = asg.serviceAreaGroup?.ministryArea || asg.ministryArea;
      const id = area?.id || asg.ministryAreaId || asg.serviceAreaGroupId || 'NO_AREA';
      const name = area?.name || t('volunteer_attendance.other_areas');

      const currentStatus =
        optimisticStatusMap[asg.id] ?? attendanceMap.get(asg.id)?.attendanceStatus;

      let entry = areaMap.get(id);
      if (!entry) {
        entry = {
          id,
          name,
          total: 0,
          taken: 0,
          pending: 0,
          attended: 0,
          excused: 0,
          unexcused: 0,
          exempt: 0,
          isComplete: false,
          assignments: [],
        };
        areaMap.set(id, entry);
      }

      entry.total++;
      entry.assignments.push(asg);

      if (currentStatus) {
        entry.taken++;
        if (currentStatus === VolunteerAttendanceStatus.ATTENDED) entry.attended++;
        else if (currentStatus === VolunteerAttendanceStatus.EXCUSED) entry.excused++;
        else if (currentStatus === VolunteerAttendanceStatus.UNEXCUSED) entry.unexcused++;
        else if (currentStatus === VolunteerAttendanceStatus.EXEMPT) entry.exempt++;
      }
    }

    const list = Array.from(areaMap.values()).map((entry) => ({
      ...entry,
      pending: Math.max(0, entry.total - entry.taken),
      isComplete: entry.total > 0 && entry.taken === entry.total,
    }));

    return list.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  }, [eligibleAssignments, optimisticStatusMap, attendanceMap, t]);

  // Computed Overall Team Metrics
  const generalStats = useMemo(() => {
    let attended = 0;
    let excused = 0;
    let unexcused = 0;
    let exempt = 0;

    for (const asg of eligibleAssignments) {
      const currentStatus =
        optimisticStatusMap[asg.id] ?? attendanceMap.get(asg.id)?.attendanceStatus;
      if (currentStatus === VolunteerAttendanceStatus.ATTENDED) attended++;
      else if (currentStatus === VolunteerAttendanceStatus.EXCUSED) excused++;
      else if (currentStatus === VolunteerAttendanceStatus.UNEXCUSED) unexcused++;
      else if (currentStatus === VolunteerAttendanceStatus.EXEMPT) exempt++;
    }

    const total = eligibleAssignments.length;
    const taken = attended + excused + unexcused + exempt;
    const pending = Math.max(0, total - taken);
    const percent = total > 0 ? Math.round((taken / total) * 100) : 0;
    const isComplete = total > 0 && pending === 0;

    return {
      total,
      taken,
      pending,
      attended,
      excused,
      unexcused,
      exempt,
      percent,
      isComplete,
    };
  }, [eligibleAssignments, optimisticStatusMap, attendanceMap]);

  // Active drawer context
  const activeDrawerArea = useMemo(() => {
    if (!drawerAreaId) return null;
    if (drawerAreaId === 'ALL') {
      return {
        id: 'ALL',
        name: t('volunteer_attendance.area_drawer_all_title'),
        assignments: eligibleAssignments,
      };
    }
    const found = areaStatsList.find((a) => a.id === drawerAreaId);
    if (!found) return null;
    return {
      id: found.id,
      name: found.name,
      assignments: found.assignments,
    };
  }, [drawerAreaId, areaStatsList, eligibleAssignments, t]);

  /**
   * Records or updates volunteer attendance status with optimistic UI responsiveness.
   *
   * @param {string} assignmentId - Volunteer assignment unique identifier.
   * @param {VolunteerAttendanceStatus} status - Desired attendance status.
   * @returns {Promise<void>} Resolves when the mutation settles.
   */
  const handleSelectStatus = async (
    assignmentId: string,
    status: VolunteerAttendanceStatus,
  ): Promise<void> => {
    if (!currentMeeting?.id) {
      toast.error(t('dashboard.missing_config_desc'));
      return;
    }

    const previousStatus =
      optimisticStatusMap[assignmentId] ?? attendanceMap.get(assignmentId)?.attendanceStatus;

    // Optimistically update status and mark assignment as saving
    setOptimisticStatusMap((prev) => ({ ...prev, [assignmentId]: status }));
    setSavingAssignmentIds((prev) => ({ ...prev, [assignmentId]: true }));

    try {
      await recordAttendanceMutation({
        churchMeetingId: currentMeeting.id,
        volunteerAssignmentId: assignmentId,
        attendanceDate: todayIso,
        attendanceStatus: status,
      }).unwrap();
    } catch {
      // Revert optimistic update on failure
      setOptimisticStatusMap((prev) => {
        const next = { ...prev };
        if (previousStatus !== undefined) {
          next[assignmentId] = previousStatus;
        } else {
          delete next[assignmentId];
        }
        return next;
      });
      toast.error(t('volunteer_attendance.save_error'));
    } finally {
      setSavingAssignmentIds((prev) => {
        const next = { ...prev };
        delete next[assignmentId];
        return next;
      });
    }
  };

  const isLoading =
    isLoadingAssignments || (isLoadingAttendance && recordedAttendances.length === 0);

  return (
    <div className="flex-1 flex flex-col p-3.5 sm:p-6 max-w-4xl mx-auto w-full space-y-3 sm:space-y-4 pb-28 sm:pb-32 bg-slate-50 text-slate-900">
      {/* Clean Unified Page Header (matching SupervisorTeamView) */}
      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-tight shrink-0">
              {t('volunteer_attendance.title')}
            </h1>
            <div className="inline-flex items-center gap-1.5 flex-wrap">
              {activeGroupConfigName && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-100 text-pink-700 shrink-0">
                  <UserCheck size={12} />
                  {activeGroupConfigName}
                </span>
              )}
              {effectiveCampusName && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 shrink-0">
                  <Building2 size={11} />
                  {effectiveCampusName}
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 font-medium mt-1">
            {generalStats.total} {teachersTerm}
            {' • '}
            {currentMeeting?.name || meetingTerm}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            loadTeamData();
            refetchAttendance();
          }}
          disabled={isLoading}
          title={t('common:actions.refresh')}
          className="mt-0.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-600 bg-white hover:bg-gray-50 border border-gray-200/80 shadow-2xs transition-colors active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
        >
          <RefreshCw size={13} className={clsx(isLoading && 'animate-spin text-primary')} />
          <span className="hidden sm:inline">{t('common:actions.refresh')}</span>
        </button>
      </div>

      <PullToRefresh
        onRefresh={async () => {
          loadTeamData();
          await refetchAttendance();
        }}
      >
          {isLoading && eligibleAssignments.length === 0 ? (
            <VolunteerAttendanceDashboardSkeleton />
          ) : eligibleAssignments.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Users className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                {t('volunteer_attendance.no_volunteers')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Status Banner: Completeness notice depending on attendance step */}
              {generalStats.isComplete ? (
                /* Completed State */
                <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-3.5 sm:p-4 text-emerald-950 shadow-2xs">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h2 className="text-sm font-bold text-emerald-900 leading-tight">
                          {t('volunteer_attendance.banner.complete_title')}
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-200 text-emerald-900 shrink-0">
                          100% {t('volunteer_attendance.completed_team_badge')}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-800/90 mt-1 leading-relaxed">
                        {t('volunteer_attendance.banner.complete_desc', {
                          total: generalStats.total,
                          teachers: teachersTerm.toLowerCase(),
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ) : generalStats.taken > 0 ? (
                /* Incomplete / In Progress State */
                <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-3.5 sm:p-4 text-amber-950 shadow-2xs">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h2 className="text-sm font-bold text-amber-900 leading-tight">
                          {t('volunteer_attendance.banner.incomplete_title')}
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-200 text-amber-900 shrink-0">
                          {t('volunteer_attendance.pending_count_badge', {
                            count: generalStats.pending,
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
                        {t('volunteer_attendance.banner.incomplete_desc', {
                          pending: generalStats.pending,
                          total: generalStats.total,
                          teachers: teachersTerm.toLowerCase(),
                        })}
                      </p>

                      {/* Mini Progress Bar in Banner */}
                      <div className="mt-2.5">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-amber-900/80 mb-1">
                          <span>
                            {t('volunteer_attendance.progress_count', {
                              taken: generalStats.taken,
                              total: generalStats.total,
                            })}
                          </span>
                          <span>{generalStats.percent}%</span>
                        </div>
                        <div className="w-full bg-amber-200/60 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-600 rounded-full transition-all duration-300"
                            style={{ width: `${generalStats.percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Not Started State */
                <div className="bg-sky-50 border border-sky-200/90 rounded-2xl p-3.5 sm:p-4 text-sky-950 shadow-2xs">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h2 className="text-sm font-bold text-sky-900 leading-tight">
                          {t('volunteer_attendance.banner.not_started_title')}
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-sky-200 text-sky-900 shrink-0">
                          0 / {generalStats.total}
                        </span>
                      </div>
                      <p className="text-xs text-sky-800/90 mt-1 leading-relaxed">
                        {t('volunteer_attendance.banner.not_started_desc', {
                          total: generalStats.total,
                          teachers: teachersTerm.toLowerCase(),
                          meeting: meetingTerm.toLowerCase(),
                          classroom: classroomTerm.toLowerCase(),
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 4 General Statistical Cards */}
              <div>
                <div className="flex items-center justify-between mb-2 px-0.5">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {t('volunteer_attendance.title_general')}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">
                    {t('volunteer_attendance.stats.summary_bar', {
                      total: generalStats.total,
                      taken: generalStats.taken,
                      pending: generalStats.pending,
                    })}
                  </span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                  {/* Card 1: Sirviendo (Attended) */}
                  <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-emerald-100 hover:border-emerald-200 shadow-2xs transition-all">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                        {generalStats.total > 0
                          ? Math.round((generalStats.attended / generalStats.total) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tracking-tight leading-none">
                      {generalStats.attended}
                    </div>
                    <div className="text-xs font-bold text-slate-800 mt-1.5 leading-tight">
                      {t('volunteer_attendance.stats.attended')}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium leading-none mt-0.5">
                      {t('volunteer_attendance.stats.attended_desc')}
                    </div>
                  </div>

                  {/* Card 2: Con Excusa (Excused) */}
                  <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-amber-100 hover:border-amber-200 shadow-2xs transition-all">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                        <FileText className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                        {generalStats.total > 0
                          ? Math.round((generalStats.excused / generalStats.total) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 tracking-tight leading-none">
                      {generalStats.excused}
                    </div>
                    <div className="text-xs font-bold text-slate-800 mt-1.5 leading-tight">
                      {t('volunteer_attendance.stats.excused')}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium leading-none mt-0.5">
                      {t('volunteer_attendance.stats.excused_desc')}
                    </div>
                  </div>

                  {/* Card 3: Ausentes / Sin Excusa (Unexcused) */}
                  <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-rose-100 hover:border-rose-200 shadow-2xs transition-all">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                        <X className="w-4 h-4 stroke-[3]" />
                      </div>
                      <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/60">
                        {generalStats.total > 0
                          ? Math.round((generalStats.unexcused / generalStats.total) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-rose-700 tracking-tight leading-none">
                      {generalStats.unexcused}
                    </div>
                    <div className="text-xs font-bold text-slate-800 mt-1.5 leading-tight">
                      {t('volunteer_attendance.stats.unexcused')}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium leading-none mt-0.5">
                      {t('volunteer_attendance.stats.unexcused_desc')}
                    </div>
                  </div>

                  {/* Card 4: No Aplica (Exempt) */}
                  <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200 hover:border-slate-300 shadow-2xs transition-all">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                        <Minus className="w-4 h-4 stroke-[3]" />
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                        {generalStats.total > 0
                          ? Math.round((generalStats.exempt / generalStats.total) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-700 tracking-tight leading-none">
                      {generalStats.exempt}
                    </div>
                    <div className="text-xs font-bold text-slate-800 mt-1.5 leading-tight">
                      {t('volunteer_attendance.stats.exempt')}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium leading-none mt-0.5">
                      {t('volunteer_attendance.stats.exempt_desc')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Area Statistics List Section */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2 px-0.5">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 leading-tight">
                      {t('volunteer_attendance.areas_section_title', {
                        classrooms: classroomsTerm,
                      })}
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-none">
                      {t('volunteer_attendance.areas_section_desc', {
                        classroom: classroomTerm.toLowerCase(),
                        teachers: teachersTerm.toLowerCase(),
                      })}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/80 shrink-0">
                    {t('volunteer_attendance.areas_count', {
                      count: areaStatsList.length,
                      classrooms: classroomsTerm.toLowerCase(),
                    })}
                  </span>
                </div>

                {/* List of Area Cards */}
                <div className="space-y-2.5">
                  {areaStatsList.map((area) => {
                    const percent =
                      area.total > 0 ? Math.round((area.taken / area.total) * 100) : 0;

                    return (
                      <div
                        key={area.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setDrawerAreaId(area.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setDrawerAreaId(area.id);
                          }
                        }}
                        className="group bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 hover:border-primary/40 hover:shadow-xs active:scale-[0.99] transition-all cursor-pointer select-none space-y-2.5 shadow-2xs"
                      >
                        {/* Top: Salon Name & Count on 1 Line + Status Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1 flex items-baseline gap-1.5 truncate">
                            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight truncate group-hover:text-primary transition-colors">
                              {area.name}
                            </h3>
                            <span className="text-xs sm:text-sm font-semibold text-slate-500 shrink-0">
                              ({area.total} {teachersTerm})
                            </span>
                          </div>

                          <div className="shrink-0 flex items-center gap-1.5">
                            {area.isComplete ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>{t('volunteer_attendance.area_complete')}</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                                {t('volunteer_attendance.area_pending', {
                                  count: area.pending,
                                })}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar of Area */}
                        <div>
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
                            <span>
                              {t('volunteer_attendance.progress_count', {
                                taken: area.taken,
                                total: area.total,
                              })}
                            </span>
                            <span>{percent}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={clsx(
                                'h-full transition-all duration-300 rounded-full',
                                area.isComplete ? 'bg-emerald-500' : 'bg-primary',
                              )}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                        {/* Bottom: 4 Compact Stats & Right Navigation Arrow */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                          {/* 4 Compact Stat Pills */}
                          <div className="grid grid-cols-4 gap-1.5 flex-1 min-w-0">
                            {/* Sirviendo */}
                            <div className="flex items-center justify-center sm:justify-start gap-1 text-xs font-bold text-emerald-800 bg-emerald-50/80 px-2 py-1 rounded-lg border border-emerald-200/60 truncate">
                              <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-600 shrink-0" />
                              <span className="leading-none">{area.attended}</span>
                              <span className="text-[10px] text-emerald-700/80 font-medium hidden sm:inline leading-none">
                                {t('volunteer_attendance.stat_compact.attended')}
                              </span>
                            </div>

                            {/* Con Excusa */}
                            <div className="flex items-center justify-center sm:justify-start gap-1 text-xs font-bold text-amber-800 bg-amber-50/80 px-2 py-1 rounded-lg border border-amber-200/60 truncate">
                              <FileText className="w-3.5 h-3.5 stroke-[2.5] text-amber-600 shrink-0" />
                              <span className="leading-none">{area.excused}</span>
                              <span className="text-[10px] text-amber-700/80 font-medium hidden sm:inline leading-none">
                                {t('volunteer_attendance.stat_compact.excused')}
                              </span>
                            </div>

                            {/* Ausentes */}
                            <div className="flex items-center justify-center sm:justify-start gap-1 text-xs font-bold text-rose-800 bg-rose-50/80 px-2 py-1 rounded-lg border border-rose-200/60 truncate">
                              <X className="w-3.5 h-3.5 stroke-[3] text-rose-600 shrink-0" />
                              <span className="leading-none">{area.unexcused}</span>
                              <span className="text-[10px] text-rose-700/80 font-medium hidden sm:inline leading-none">
                                {t('volunteer_attendance.stat_compact.unexcused')}
                              </span>
                            </div>

                            {/* No Aplica */}
                            <div className="flex items-center justify-center sm:justify-start gap-1 text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 truncate">
                              <Minus className="w-3.5 h-3.5 stroke-[3] text-slate-500 shrink-0" />
                              <span className="leading-none">{area.exempt}</span>
                              <span className="text-[10px] text-slate-600 font-medium hidden sm:inline leading-none">
                                {t('volunteer_attendance.stat_compact.exempt')}
                              </span>
                            </div>
                          </div>

                          {/* Right Arrow (Visual indicator to take attendance) */}
                          <div className="shrink-0 flex items-center pl-1 text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all">
                            <ChevronRight className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Quick button to view / take attendance of whole team */}
                {areaStatsList.length > 1 && (
                  <div className="mt-4 pt-1">
                    <button
                      type="button"
                      onClick={() => setDrawerAreaId('ALL')}
                      className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>
                        {t('volunteer_attendance.view_all_team_button', {
                          count: generalStats.total,
                          teachers: teachersTerm.toLowerCase(),
                        })}
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom spacer so content doesn't collide with floating BottomNav */}
              <div className="h-28 sm:h-36 shrink-0 pointer-events-none" aria-hidden="true" />
            </div>
          )}
        </PullToRefresh>

      {/* Lateral Slide-Over Drawer for taking attendance per area */}
      {activeDrawerArea && (
        <AreaAttendanceDrawer
          open={Boolean(activeDrawerArea)}
          onClose={() => setDrawerAreaId(null)}
          areaName={activeDrawerArea.name}
          assignments={activeDrawerArea.assignments}
          onSelectStatus={handleSelectStatus}
          savingAssignmentIds={savingAssignmentIds}
          optimisticStatusMap={optimisticStatusMap}
          attendanceMap={attendanceMap}
          churchOverrides={churchOverrides}
        />
      )}
    </div>
  );
};

export default VolunteerAttendanceView;
