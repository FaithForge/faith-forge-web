import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  X,
  Minus,
  RefreshCw,
  Users,
  Search,
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
  MinistryType,
  VolunteerAttendanceStatus,
  VolunteerRole,
} from '@/libs/models';
import { useChurchMeetingStatus } from '@/libs/hooks/useChurchMeetingStatus';
import { usePermissions } from '@/libs/hooks/usePermissions';
import { useVolunteerAttendanceLiveSync } from '@/libs/hooks/useVolunteerAttendanceLiveSync';
import { getVolunteerRoleLabel } from '@/libs/hooks/useTerm';
import { isFeatureEnabled } from '@/config/features';
import { APP_ROUTES } from '@/config/routes';
import { capitalizeWords } from '@/libs/utils/text';
import PullToRefresh from '@/components/ui/PullToRefresh';
import { CellListSkeleton } from '@/components/ui/DetailSkeleton';

const EMPTY_ASSIGNMENTS: IVolunteerAssignment[] = [];

type AttendanceStatusKey =
  | 'volunteer_attendance.status.ATTENDED'
  | 'volunteer_attendance.status.EXCUSED'
  | 'volunteer_attendance.status.UNEXCUSED'
  | 'volunteer_attendance.status.EXEMPT'
  | 'volunteer_attendance.short_status.ATTENDED'
  | 'volunteer_attendance.short_status.EXCUSED'
  | 'volunteer_attendance.short_status.UNEXCUSED'
  | 'volunteer_attendance.short_status.EXEMPT';

interface StatusOption {
  status: VolunteerAttendanceStatus;
  labelKey: AttendanceStatusKey;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  selectedClass: string;
  unselectedClass: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    status: VolunteerAttendanceStatus.ATTENDED,
    labelKey: 'volunteer_attendance.short_status.ATTENDED',
    icon: Check,
    iconColor: 'text-emerald-600',
    selectedClass: 'bg-emerald-600 text-white font-bold shadow-xs border-emerald-600 ring-2 ring-emerald-600/30 scale-[1.02]',
    unselectedClass: 'bg-slate-50/90 text-slate-700 border-slate-200/90 hover:bg-emerald-50/70 hover:text-emerald-800 hover:border-emerald-300',
  },
  {
    status: VolunteerAttendanceStatus.EXCUSED,
    labelKey: 'volunteer_attendance.short_status.EXCUSED',
    icon: FileText,
    iconColor: 'text-amber-600',
    selectedClass: 'bg-amber-500 text-white font-bold shadow-xs border-amber-500 ring-2 ring-amber-500/30 scale-[1.02]',
    unselectedClass: 'bg-slate-50/90 text-slate-700 border-slate-200/90 hover:bg-amber-50/70 hover:text-amber-800 hover:border-amber-200',
  },
  {
    status: VolunteerAttendanceStatus.UNEXCUSED,
    labelKey: 'volunteer_attendance.short_status.UNEXCUSED',
    icon: X,
    iconColor: 'text-rose-600',
    selectedClass: 'bg-rose-600 text-white font-bold shadow-xs border-rose-600 ring-2 ring-rose-600/30 scale-[1.02]',
    unselectedClass: 'bg-slate-50/90 text-slate-700 border-slate-200/90 hover:bg-rose-50/70 hover:text-rose-800 hover:border-rose-200',
  },
  {
    status: VolunteerAttendanceStatus.EXEMPT,
    labelKey: 'volunteer_attendance.short_status.EXEMPT',
    icon: Minus,
    iconColor: 'text-slate-500',
    selectedClass: 'bg-slate-700 text-white font-bold shadow-xs border-slate-700 ring-2 ring-slate-700/30 scale-[1.02]',
    unselectedClass: 'bg-slate-50/90 text-slate-700 border-slate-200/90 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300',
  },
];

/**
 * Resolves the styling classes for the top-right status badge.
 *
 * @param {VolunteerAttendanceStatus} [status] - The volunteer's current attendance status.
 * @returns {string} Tailwind CSS class list for the badge.
 */
const getStatusBadgeClass = (status?: VolunteerAttendanceStatus): string => {
  switch (status) {
    case VolunteerAttendanceStatus.ATTENDED:
      return 'bg-emerald-50 text-emerald-800 border-emerald-200/90 font-bold';
    case VolunteerAttendanceStatus.EXCUSED:
      return 'bg-amber-50 text-amber-800 border-amber-200/90 font-bold';
    case VolunteerAttendanceStatus.UNEXCUSED:
      return 'bg-rose-50 text-rose-800 border-rose-200/90 font-bold';
    case VolunteerAttendanceStatus.EXEMPT:
      return 'bg-slate-100 text-slate-700 border-slate-200 font-bold';
    default:
      return 'bg-amber-100/90 text-amber-900 border-amber-300 font-extrabold';
  }
};

/**
 * Mobile-first screen enabling group coordinators to record and update
 * volunteer attendance for their assigned team during an active church meeting.
 *
 * @returns {JSX.Element} Rendered volunteer attendance screen.
 */
export const VolunteerAttendanceView: React.FC = () => {
  const { t } = useTranslation(['kidChurch', 'common']);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { currentMeeting, currentCampus } = useChurchMeetingStatus();
  const { canTakeVolunteerAttendance, isSuperAdmin } = usePermissions();

  // Guard: Feature flag gating and permission
  useEffect(() => {
    if (!isFeatureEnabled('volunteerAttendance') || !canTakeVolunteerAttendance) {
      navigate(APP_ROUTES.kidChurch.root, { replace: true });
    }
  }, [navigate, canTakeVolunteerAttendance]);

  const {
    activeCampusId,
    activeGroupConfigId,
    activeGroupConfigName,
  } = useAppSelector((state) => state.volunteerContextSlice);

  const churchOverrides = useAppSelector(
    (state) =>
      state.churchCampusSlice.churchTerminologyOverrides ||
      state.churchCampusSlice.church?.terminologyOverrides,
  );

  const effectiveCampusId = activeCampusId || currentCampus?.id;
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
  const [selectedAreaId, setSelectedAreaId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Monitor scroll position on viewport and main element
  useEffect(() => {
    const mainEl = document.querySelector('main');
    const handleScroll = () => {
      const scrollPos = mainEl ? mainEl.scrollTop : window.scrollY;
      setShowScrollTop(scrollPos > 300);
    };

    if (mainEl) {
      mainEl.addEventListener('scroll', handleScroll, { passive: true });
    }
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (mainEl) {
        mainEl.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  /**
   * Scrolls the viewport smoothly back to the top.
   *
   * @returns {void}
   */
  const handleScrollToTop = (): void => {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  // Realtime Live Sync: Receives SSE events and auto-invalidates RTK Query cache
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

  // Unique available areas extracted and sorted alphabetically with live taken counts
  const availableAreas = useMemo(() => {
    const areaMap = new Map<
      string,
      { id: string; name: string; count: number; takenCount: number }
    >();

    for (const asg of eligibleAssignments) {
      const area = asg.serviceAreaGroup?.ministryArea || asg.ministryArea;
      const id = area?.id || asg.ministryAreaId || asg.serviceAreaGroupId || 'NO_AREA';
      const name = area?.name || t('volunteer_attendance.other_areas');

      const isTaken = Boolean(
        optimisticStatusMap[asg.id] ?? attendanceMap.get(asg.id)?.attendanceStatus,
      );

      const existing = areaMap.get(id);
      if (existing) {
        existing.count++;
        if (isTaken) existing.takenCount++;
      } else {
        areaMap.set(id, { id, name, count: 1, takenCount: isTaken ? 1 : 0 });
      }
    }

    return Array.from(areaMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }),
    );
  }, [eligibleAssignments, attendanceMap, optimisticStatusMap, t]);

  // Reset selected area if it's no longer present
  useEffect(() => {
    if (selectedAreaId !== 'ALL' && !availableAreas.some((a) => a.id === selectedAreaId)) {
      setSelectedAreaId('ALL');
    }
  }, [availableAreas, selectedAreaId]);

  const areaScrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  /**
   * Checks whether the horizontal area chip list can scroll left or right.
   *
   * @returns {void}
   */
  const checkAreaScroll = (): void => {
    if (!areaScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = areaScrollRef.current;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  };

  /**
   * Scrolls the area filter chips smoothly left or right.
   *
   * @param {'left' | 'right'} direction - Scroll direction.
   * @returns {void}
   */
  const handleScrollArea = (direction: 'left' | 'right'): void => {
    if (!areaScrollRef.current) return;
    const offset = direction === 'left' ? -180 : 180;
    areaScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    setTimeout(checkAreaScroll, 300);
  };

  useEffect(() => {
    const timer = setTimeout(checkAreaScroll, 150);
    window.addEventListener('resize', checkAreaScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkAreaScroll);
    };
  }, [availableAreas]);

  // Filter assignments by area and search term, sorted alphabetically by volunteer name
  const filteredAssignments = useMemo(() => {
    return eligibleAssignments
      .filter((asg) => {
        // Area filter
        if (selectedAreaId !== 'ALL') {
          const area = asg.serviceAreaGroup?.ministryArea || asg.ministryArea;
          const areaId = area?.id || asg.ministryAreaId || asg.serviceAreaGroupId || 'NO_AREA';
          if (areaId !== selectedAreaId) return false;
        }

        // Search term filter
        if (!searchTerm.trim()) return true;

        const user = asg.churchMember?.user || asg.user;
        const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.toLowerCase();
        const nationalId = (user?.nationalId || '').toLowerCase();
        const query = searchTerm.toLowerCase().trim();

        return fullName.includes(query) || nationalId.includes(query);
      })
      .sort((a, b) => {
        const userA = a.churchMember?.user || a.user;
        const userB = b.churchMember?.user || b.user;
        const nameA = `${userA?.firstName || ''} ${userA?.lastName || ''}`.trim();
        const nameB = `${userB?.firstName || ''} ${userB?.lastName || ''}`.trim();
        return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
      });
  }, [eligibleAssignments, selectedAreaId, searchTerm]);

  // Overall Team Metrics (independent of active filter/search)
  const totalTeamCount = eligibleAssignments.length;
  const takenTeamCount = useMemo(() => {
    let count = 0;
    for (const asg of eligibleAssignments) {
      const hasStatus =
        optimisticStatusMap[asg.id] ?? attendanceMap.get(asg.id)?.attendanceStatus;
      if (hasStatus) count++;
    }
    return count;
  }, [eligibleAssignments, attendanceMap, optimisticStatusMap]);
  const pendingTeamCount = Math.max(0, totalTeamCount - takenTeamCount);

  // Active Filter Metrics (filtered by selected area and search)
  const totalVolunteers = filteredAssignments.length;
  const takenCount = useMemo(() => {
    let count = 0;
    for (const asg of filteredAssignments) {
      const hasStatus =
        optimisticStatusMap[asg.id] ?? attendanceMap.get(asg.id)?.attendanceStatus;
      if (hasStatus) count++;
    }
    return count;
  }, [filteredAssignments, attendanceMap, optimisticStatusMap]);
  const pendingCount = Math.max(0, totalVolunteers - takenCount);

  // Selected Area object (if filtering by a specific area)
  const selectedArea = useMemo(() => {
    if (selectedAreaId === 'ALL') return null;
    return availableAreas.find((a) => a.id === selectedAreaId) || null;
  }, [availableAreas, selectedAreaId]);

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

      toast.success(t('volunteer_attendance.save_success'));
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

  const isLoading = isLoadingAssignments || (isLoadingAttendance && recordedAttendances.length === 0);

  return (
    <div className="flex flex-col min-h-full bg-slate-50 text-slate-900 pb-8">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 shadow-xs">
        <div className="flex items-center justify-between gap-2 max-w-3xl mx-auto">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
              aria-label={t('common:actions.back')}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                {t('volunteer_attendance.title')}
              </h1>
              <p className="text-xs text-slate-500 font-medium leading-none mt-0.5">
                {activeGroupConfigName || currentCampus?.name || t('volunteer_attendance.subtitle')}
                {currentMeeting?.name ? ` • ${currentMeeting.name}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              loadTeamData();
              refetchAttendance();
            }}
            disabled={isLoading}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors shrink-0"
            title={t('common:actions.refresh')}
          >
            <RefreshCw className={clsx('w-4 h-4', isLoading && 'animate-spin text-primary')} />
          </button>
        </div>
      </header>

      {/* Progress & Summary Bar */}
      <div className="bg-white border-b border-slate-200/80 px-4 py-3 shadow-2xs">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* Header row: Context label & Status badge */}
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-900">
                {selectedArea ? selectedArea.name : t('volunteer_attendance.title_general')}
              </span>
              <span className="text-[11px] font-medium text-slate-500 shrink-0">
                • {selectedArea ? t('volunteer_attendance.area_scope') : t('volunteer_attendance.team_scope')}
              </span>
            </div>

            <span
              className={clsx(
                'font-bold px-2.5 py-0.5 rounded-full text-[11px] shrink-0 text-center border whitespace-nowrap',
                (selectedArea ? pendingCount : pendingTeamCount) === 0 &&
                  (selectedArea ? totalVolunteers : totalTeamCount) > 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-900 border-amber-200',
              )}
            >
              {(selectedArea ? pendingCount : pendingTeamCount) === 0 &&
              (selectedArea ? totalVolunteers : totalTeamCount) > 0
                ? selectedArea
                  ? t('volunteer_attendance.completed_area_alert')
                  : t('volunteer_attendance.completed_team_badge')
                : t('volunteer_attendance.pending_count_badge', {
                    count: selectedArea ? pendingCount : pendingTeamCount,
                  })}
            </span>
          </div>

          {/* Counts & Progress bar */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1 font-semibold">
              <span className="text-slate-700">
                {t('volunteer_attendance.progress_count', {
                  taken: selectedArea ? takenCount : takenTeamCount,
                  total: selectedArea ? totalVolunteers : totalTeamCount,
                })}
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                {Math.round(
                  (selectedArea
                    ? totalVolunteers > 0
                      ? takenCount / totalVolunteers
                      : 0
                    : totalTeamCount > 0
                      ? takenTeamCount / totalTeamCount
                      : 0) * 100,
                )}
                %
              </span>
            </div>

            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className={clsx(
                  'h-full transition-all duration-300 rounded-full',
                  (selectedArea ? pendingCount : pendingTeamCount) === 0 &&
                    (selectedArea ? totalVolunteers : totalTeamCount) > 0
                    ? 'bg-emerald-500'
                    : 'bg-primary',
                )}
                style={{
                  width: `${
                    (selectedArea
                      ? totalVolunteers > 0
                        ? takenCount / totalVolunteers
                        : 0
                      : totalTeamCount > 0
                        ? takenTeamCount / totalTeamCount
                        : 0) * 100
                  }%`,
                }}
              />
            </div>
          </div>

          {/* Overall Team Subline when an area or search filter is active */}
          {(selectedArea || searchTerm) && totalTeamCount > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500 pt-1 font-medium border-t border-slate-100">
              <span>
                {t('volunteer_attendance.overall_summary', {
                  taken: takenTeamCount,
                  total: totalTeamCount,
                  pending: pendingTeamCount,
                })}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedAreaId('ALL');
                  setSearchTerm('');
                }}
                className="text-primary hover:text-primary-dark font-bold underline cursor-pointer shrink-0 ml-2"
              >
                {t('volunteer_attendance.view_all')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 pt-2.5 pb-1.5 max-w-3xl mx-auto w-full">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('volunteer_attendance.search_placeholder')}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9.5 pr-9 py-2 text-sm text-slate-800 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-2xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label={t('volunteer_attendance.clear_filters')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Area Filter Chips */}
      {availableAreas.length > 1 && (
        <div className="px-4 pb-2.5 max-w-3xl mx-auto w-full">
          {/* Header with explicit swipe hint for older users */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 px-0.5">
            <span className="font-semibold text-slate-700">
              {t('volunteer_attendance.filter_by_area')}
            </span>
            <span className="text-[11px] text-primary font-semibold flex items-center gap-1">
              <span>{t('volunteer_attendance.swipe_hint')}</span>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            </span>
          </div>

          <div className="relative group">
            {/* Left Scroll Button & Fade Gradient */}
            {canScrollLeft && (
              <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center pr-3 bg-gradient-to-r from-slate-50 via-slate-50/80 to-transparent pointer-events-none">
                <button
                  type="button"
                  onClick={() => handleScrollArea('left')}
                  aria-label={t('volunteer_attendance.scroll_left_hint')}
                  title={t('volunteer_attendance.scroll_left_hint')}
                  className="pointer-events-auto w-7 h-7 rounded-full bg-white shadow-md border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-50 active:scale-90 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Chips Scroll Track */}
            <div
              ref={areaScrollRef}
              onScroll={checkAreaScroll}
              className="flex items-center gap-1.5 overflow-x-auto scroll-smooth py-0.5 no-scrollbar"
            >
              <button
                type="button"
                onClick={() => setSelectedAreaId('ALL')}
                className={clsx(
                  'px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs',
                  selectedAreaId === 'ALL'
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80',
                )}
              >
                <span>{t('volunteer_attendance.all_areas')}</span>
                <span
                  className={clsx(
                    'px-1.5 py-0.2 rounded-full text-[10px] font-extrabold',
                    selectedAreaId === 'ALL'
                      ? 'bg-white/25 text-white'
                      : 'bg-slate-100 text-slate-600',
                  )}
                >
                  {takenTeamCount}/{eligibleAssignments.length}
                </span>
              </button>

              {availableAreas.map((area) => {
                const isSelected = selectedAreaId === area.id;
                const isAreaComplete = area.takenCount === area.count && area.count > 0;
                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => setSelectedAreaId(area.id)}
                    className={clsx(
                      'px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs',
                      isSelected
                        ? 'bg-primary text-white shadow-xs'
                        : isAreaComplete
                          ? 'bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80',
                    )}
                  >
                    <span className="truncate max-w-[160px]">{area.name}</span>
                    <span
                      className={clsx(
                        'px-1.5 py-0.2 rounded-full text-[10px] font-extrabold',
                        isSelected
                          ? 'bg-white/25 text-white'
                          : isAreaComplete
                            ? 'bg-emerald-200 text-emerald-900'
                            : 'bg-slate-100 text-slate-600',
                      )}
                    >
                      {area.takenCount}/{area.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right Scroll Button & Fade Gradient */}
            {canScrollRight && (
              <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center pl-3 bg-gradient-to-l from-slate-50 via-slate-50/80 to-transparent pointer-events-none">
                <button
                  type="button"
                  onClick={() => handleScrollArea('right')}
                  aria-label={t('volunteer_attendance.scroll_right_hint')}
                  title={t('volunteer_attendance.scroll_right_hint')}
                  className="pointer-events-auto w-7 h-7 rounded-full bg-white shadow-md border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-50 active:scale-90 transition-all cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Team Volunteer List */}
      <main className="flex-1 px-4 max-w-3xl mx-auto w-full">
        <PullToRefresh
          onRefresh={async () => {
            loadTeamData();
            await refetchAttendance();
          }}
        >
          {isLoading && filteredAssignments.length === 0 ? (
            <div className="mt-4">
              <CellListSkeleton count={4} />
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Users className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                {eligibleAssignments.length === 0
                  ? t('volunteer_attendance.no_volunteers')
                  : t('volunteer_attendance.no_volunteers_filter')}
              </p>
              {eligibleAssignments.length > 0 && (selectedAreaId !== 'ALL' || searchTerm) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAreaId('ALL');
                    setSearchTerm('');
                  }}
                  className="mt-3 text-xs font-bold text-primary hover:text-primary-dark underline cursor-pointer"
                >
                  {t('volunteer_attendance.clear_filters')}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3 mt-1">
              {filteredAssignments.map((assignment) => {
                const user = assignment.churchMember?.user || assignment.user;
                const recorded = attendanceMap.get(assignment.id);
                const currentStatus =
                  optimisticStatusMap[assignment.id] ?? recorded?.attendanceStatus;
                const isSaving = Boolean(savingAssignmentIds[assignment.id]);
                const firstName = user?.firstName || '';
                const lastName = user?.lastName || '';
                const fullName = capitalizeWords(`${firstName} ${lastName}`.trim()) || 'Servidor(a)';
                const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'SV';
                const roleLabel = getVolunteerRoleLabel(assignment.role, {
                  ministryType: MinistryType.KIDS,
                  churchOverrides,
                  ministryOverrides: assignment.ministry?.terminologyOverrides,
                  short: true,
                });

                return (
                  <div
                    key={assignment.id}
                    className={clsx(
                      'bg-white rounded-2xl p-3 sm:p-3.5 border transition-all shadow-2xs hover:shadow-xs',
                      currentStatus
                        ? 'border-slate-200/90'
                        : 'border-amber-300/80 ring-1 ring-amber-300/40 bg-amber-50/15',
                    )}
                  >
                    {/* Top: Avatar + Full Name & Subtitle on Left, Status Badge on Right */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {user?.photoUrl ? (
                          <img
                            src={user.photoUrl}
                            alt={fullName}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs border border-primary/20 shrink-0">
                            {initials}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug break-words">
                            {fullName}
                          </h2>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap mt-0.5">
                            <span className="font-medium text-slate-700">
                              {assignment.serviceAreaGroup?.ministryArea?.name || assignment.ministryArea?.name || t('volunteer_attendance.other_areas')}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-600 font-medium">
                              {roleLabel}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Top Right Status Badge (Filling the empty space on the right) */}
                      <span
                        className={clsx(
                          'px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 border whitespace-nowrap shadow-2xs',
                          getStatusBadgeClass(currentStatus),
                        )}
                      >
                        {currentStatus
                          ? t(`volunteer_attendance.short_status.${currentStatus}` as AttendanceStatusKey)
                          : t('volunteer_attendance.unmarked')}
                      </span>
                    </div>

                    {/* Bottom: 4 Segmented Status Buttons with Explicit Labels and Icons */}
                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mt-3 pt-2.5 border-t border-slate-100" role="group" aria-label={fullName}>
                      {STATUS_OPTIONS.map((opt) => {
                        const isSelected = currentStatus === opt.status;
                        const Icon = opt.icon;
                        const label = t(opt.labelKey);

                        return (
                          <button
                            key={opt.status}
                            type="button"
                            disabled={isSaving}
                            title={label}
                            aria-label={`${fullName}: ${label}`}
                            aria-pressed={isSelected}
                            onClick={() => handleSelectStatus(assignment.id, opt.status)}
                            className={clsx(
                              'flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 sm:px-2 rounded-xl transition-all cursor-pointer select-none active:scale-95 disabled:opacity-50 border',
                              isSelected ? opt.selectedClass : opt.unselectedClass,
                            )}
                          >
                            <Icon className={clsx('w-4 h-4 shrink-0 stroke-[2.5]', isSelected ? 'text-white' : opt.iconColor)} />
                            <span className="text-[10px] sm:text-xs font-semibold leading-tight text-center">
                              {label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Safe spacer so the last card and buttons never collide with floating BottomNav */}
              <div className="h-28 sm:h-36 shrink-0 pointer-events-none" aria-hidden="true" />
            </div>
          )}
        </PullToRefresh>
      </main>

      {/* Floating Scroll To Top Button */}
      <button
        type="button"
        onClick={handleScrollToTop}
        aria-label={t('volunteer_attendance.scroll_to_top')}
        title={t('volunteer_attendance.scroll_to_top')}
        className={clsx(
          'fixed right-4 sm:right-6 bottom-22 sm:bottom-24 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/95 text-slate-700 border border-slate-200/90 shadow-lg hover:shadow-xl hover:text-primary hover:border-primary/40 flex items-center justify-center transition-all duration-300 active:scale-90 cursor-pointer backdrop-blur-xs',
          showScrollTop
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-75 pointer-events-none',
        )}
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </div>
  );
};

export default VolunteerAttendanceView;
