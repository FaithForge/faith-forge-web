import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Sparkles,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  ArrowUp,
  UserCheck,
  Building2,
} from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';

import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetVolunteerAssignments } from '@/libs/state/redux/thunks/church/volunteer.thunk';
import { GetVolunteerApplications } from '@/libs/state/redux/thunks/church/volunteerApplication.thunk';
import { useGetVolunteerAttendanceSummaryQuery } from '@/libs/state/redux/api/churchApi';
import { useVolunteerAttendanceLiveSync } from '@/libs/hooks/useVolunteerAttendanceLiveSync';
import { useChurchMeetingStatus } from '@/libs/hooks/useChurchMeetingStatus';
import { useChurchTerm, useKidsTerm } from '@/libs/hooks/useTerm';
import { usePermissions } from '@/libs/hooks/usePermissions';
import { APP_ROUTES } from '@/config/routes';
import { EntityState, MinistryAreaScope, VolunteerApplicationStatus } from '@/libs/models';
import { IVolunteerAssignment, VolunteerRole } from '@/libs/models/Volunteer';
import { VolunteerApplicationsTab } from '@/views/admin/volunteers/components/VolunteerApplicationsTab';

import Input from '@/components/ui/Input';
import { VolunteerAssignmentCard } from './components/VolunteerAssignmentCard';
import { LiveAttendanceWidget } from './components/LiveAttendanceWidget';
import { useMyTeamFilters } from './hooks/useMyTeamFilters';

const EMPTY_ASSIGNMENTS: IVolunteerAssignment[] = [];

/**
 * Universal Team Directory view for Leaders, Coordinators, and Supervisors.
 * Compatible with any church ministry (Kids, Worship, Ushers, Youth, etc.).
 */
export const MyTeamView: React.FC = () => {
  const { t } = useTranslation(['kidChurch', 'common']);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState('');

  const currentUser = useAppSelector((state) => state.authSlice.user);
  const currentRole = useAppSelector((state) => state.authSlice.currentRole);

  const {
    activeCampusId,
    activeCampusName,
    activeGroupConfigId,
    activeGroupConfigName,
    campuses,
  } = useAppSelector((state) => state.volunteerContextSlice);

  const {
    isSuperAdmin,
    isAreaCoordinator,
    isGroupCoordinator,
    isSupervisor,
    isApoyo,
    isKidRegistrationRole,
    canViewTeam: canAccessTeam,
    canTakeVolunteerAttendance,
  } = usePermissions();

  useEffect(() => {
    if (!canAccessTeam) {
      toast.error(
        isApoyo
          ? t('supervisor_team.access_denied_apoyo')
          : t('supervisor_team.access_denied'),
      );
      const fallbackUrl = currentRole?.includes('REGISTER')
        ? APP_ROUTES.kidRegistration.root
        : APP_ROUTES.kidChurch.root;
      navigate(fallbackUrl, { replace: true });
    }
  }, [canAccessTeam, isApoyo, currentRole, navigate, t]);

  const churchVolunteersTerm = useChurchTerm('volunteers');
  const kidsRegistrationName = useKidsTerm('registration');
  const kidsModuleName = useKidsTerm('module_alias');

  const currentCampus = useAppSelector((state) => state.churchCampusSlice.current);
  const effectiveCampusId = activeCampusId || currentCampus?.id;

  const activeCampusData = campuses.find((c) => c.id === effectiveCampusId);
  const activeGroupData = activeCampusData?.groups.find((g) => g.id === activeGroupConfigId);
  const supervisorAreaIds = useMemo(
    () => activeGroupData?.areas.map((a) => a.id).filter(Boolean) || [],
    [activeGroupData],
  );
  const supervisorSagIds = useMemo(
    () => activeGroupData?.areas.map((a) => a.serviceAreaGroupId).filter(Boolean) || [],
    [activeGroupData],
  );
  const primaryArea = activeGroupData?.areas[0];
  const activeAreaId = primaryArea?.id;
  const areaName = primaryArea?.name || 'Mi Área';

  const areaCoord =
    activeCampusData?.areaCoordinates?.find(
      (a) => a.scope === MinistryAreaScope.KID_REGISTRATION,
    ) || activeCampusData?.areaCoordinates?.[0];

  const fallbackArea = activeCampusData?.groups
    .flatMap((g) => g.areas)
    .find((a) => a.scope === MinistryAreaScope.KID_REGISTRATION);

  const effectiveAreaId = isAreaCoordinator
    ? (areaCoord?.id || fallbackArea?.id || activeAreaId)
    : activeAreaId;

  const effectiveAreaName = isAreaCoordinator
    ? (areaCoord?.name || fallbackArea?.name || kidsRegistrationName)
    : areaName;

  const headerBadgeStyle = useMemo(() => {
    if (isKidRegistrationRole || isAreaCoordinator) {
      return isAreaCoordinator ? 'bg-[#D1F2E0] text-[#0F3D2A]' : 'bg-[#CCFBF1] text-[#0F766E]';
    }
    if (isGroupCoordinator) {
      return 'bg-[#FCE7F3] text-[#831843]';
    }
    return 'bg-[#F3E8FF] text-[#581C87]';
  }, [isKidRegistrationRole, isAreaCoordinator, isGroupCoordinator]);

  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('ALL');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('ALL');

  const filterScrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkFilterScroll = useCallback((): void => {
    if (!filterScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = filterScrollRef.current;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  }, []);

  const handleScrollFilter = (direction: 'left' | 'right'): void => {
    if (!filterScrollRef.current) return;
    const offset = direction === 'left' ? -180 : 180;
    filterScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    setTimeout(checkFilterScroll, 300);
  };

  const availableAreas = useMemo(() => {
    if (!activeCampusData?.groups) return [];
    const areaMap = new Map<string, { id: string; name: string; isSAG: boolean }>();
    activeCampusData.groups.forEach((g) => {
      g.areas?.forEach((a) => {
        if (a.id && !areaMap.has(a.id)) {
          areaMap.set(a.id, {
            id: a.id,
            name: a.name || 'Área sin nombre',
            isSAG: Boolean(a.serviceAreaGroupId),
          });
        }
      });
    });
    return Array.from(areaMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [activeCampusData]);

  const partitionKey = useMemo(() => {
    const p1 = effectiveCampusId || 'no-campus';
    const p2 = effectiveAreaId || 'no-area';
    const p3 = activeGroupConfigId || 'no-group';
    return `${p1}:${p2}:${p3}`;
  }, [effectiveCampusId, effectiveAreaId, activeGroupConfigId]);

  const assignments = useAppSelector((state) => {
    return (
      state.volunteerSlice.assignmentsByPartition[partitionKey] ??
      state.volunteerSlice.assignments ??
      EMPTY_ASSIGNMENTS
    );
  });

  const coordinatorCount = useMemo(() => {
    return assignments.filter(
      (asg) => asg.state !== EntityState.DELETED && asg.role === VolunteerRole.GROUP_COORDINATOR,
    ).length;
  }, [assignments]);

  const availableGroups = useMemo(() => {
    const groupMap = new Map<string, string>();
    activeCampusData?.groups?.forEach((g) => {
      if (g.id) groupMap.set(g.id, g.name);
    });
    assignments.forEach((asg) => {
      const gId =
        asg.ministryGroupConfigId ||
        asg.ministryGroupConfig?.id ||
        asg.serviceAreaGroup?.ministryGroupConfigId ||
        asg.serviceAreaGroup?.ministryGroupConfig?.id;
      const gName =
        asg.ministryGroupConfig?.name ||
        asg.serviceAreaGroup?.ministryGroupConfig?.name;
      if (gId && gName && !groupMap.has(gId)) {
        groupMap.set(gId, gName);
      }
    });
    return Array.from(groupMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es', { numeric: true, sensitivity: 'base' }));
  }, [activeCampusData, assignments]);

  useEffect(() => {
    const timer = setTimeout(checkFilterScroll, 150);
    window.addEventListener('resize', checkFilterScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkFilterScroll);
    };
  }, [checkFilterScroll, selectedGroupFilter, selectedAreaFilter, assignments]);

  const isLoading = useAppSelector(
    (state) =>
      state.volunteerSlice.loadingByPartition[partitionKey] ??
      state.volunteerSlice.loadingAssignments,
  );
  const effectiveGroupId = activeGroupConfigId || activeCampusData?.groups[0]?.id;

  const loadTeamData = useCallback(() => {
    if (!effectiveCampusId) return;
    if (isAreaCoordinator) {
      dispatch(
        GetVolunteerAssignments({
          churchCampusId: effectiveCampusId,
          ministryAreaId: effectiveAreaId,
          state: EntityState.ACTIVE,
          partitionKey,
          force: true,
        }),
      );
    } else if (effectiveGroupId || isSuperAdmin) {
      dispatch(
        GetVolunteerAssignments({
          churchCampusId: effectiveCampusId,
          ministryGroupConfigId: effectiveGroupId,
          ministryAreaId: isGroupCoordinator ? undefined : (activeAreaId || undefined),
          state: EntityState.ACTIVE,
          partitionKey,
          force: true,
        }),
      );
    }
  }, [
    dispatch,
    effectiveCampusId,
    isAreaCoordinator,
    effectiveAreaId,
    effectiveGroupId,
    isSuperAdmin,
    isGroupCoordinator,
    activeAreaId,
    partitionKey,
  ]);

  useEffect(() => {
    loadTeamData();
  }, [loadTeamData]);

  const [activeMainTab, setActiveMainTab] = useState<'TEAM' | 'APPLICATIONS'>('TEAM');
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const mainEl = document.querySelector('main');
      const scrollPos = Math.max(
        mainEl?.scrollTop || 0,
        window.scrollY || 0,
        document.documentElement?.scrollTop || 0,
        document.body?.scrollTop || 0,
      );
      setShowScrollTop(scrollPos > 180);
    };

    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.addEventListener('scroll', handleScroll, { passive: true });
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      if (mainEl) {
        mainEl.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleScrollToTop = (): void => {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement?.scrollTo({ top: 0, behavior: 'smooth' });
    document.body?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pendingCountFromSlice = useAppSelector(
    (state) => state.volunteerApplicationSlice.pendingCount,
  );
  const [localPendingCount, setLocalPendingCount] = useState<number | null>(null);
  const pendingApplicationsCount =
    localPendingCount !== null ? localPendingCount : pendingCountFromSlice;

  const refreshApplicationsCount = useCallback(async () => {
    if (!effectiveCampusId || (!isGroupCoordinator && !isAreaCoordinator)) return;
    try {
      const res = await dispatch(
        GetVolunteerApplications({
          churchCampusId: effectiveCampusId,
          ministryGroupConfigId:
            isGroupCoordinator && !isAreaCoordinator ? effectiveGroupId : undefined,
          status: VolunteerApplicationStatus.PENDING,
          limit: 50,
        }),
      ).unwrap();
      const count = (res as any).totalItems ?? res.data?.length ?? 0;
      setLocalPendingCount(count);
    } catch {
      // Ignore count error
    }
  }, [dispatch, effectiveCampusId, isGroupCoordinator, isAreaCoordinator, effectiveGroupId]);

  useEffect(() => {
    refreshApplicationsCount();
  }, [refreshApplicationsCount]);

  const { currentMeeting } = useChurchMeetingStatus();

  const { data: attendanceSummary, refetch: refetchSummary } =
    useGetVolunteerAttendanceSummaryQuery(
      {
        churchMeetingId: currentMeeting?.id || '',
        ministryGroupConfigId: isAreaCoordinator ? undefined : effectiveGroupId,
      },
      {
        skip: !canTakeVolunteerAttendance || !currentMeeting?.id,
        refetchOnMountOrArgChange: true,
      },
    );

  useVolunteerAttendanceLiveSync({
    churchMeetingId: currentMeeting?.id,
  });

  const filteredAssignments = useMyTeamFilters({
    assignments,
    searchTerm,
    isAreaCoordinator,
    isGroupCoordinator,
    effectiveAreaId,
    effectiveGroupId,
    selectedAreaFilter,
    selectedGroupFilter,
    supervisorAreaIds,
    supervisorSagIds: supervisorSagIds.filter((id): id is string => Boolean(id)),
  });

  return (
    <div className="w-full max-w-4xl mx-auto min-w-0 px-3.5 sm:px-6 pt-3 sm:pt-4 pb-28 sm:pb-32 space-y-3.5 sm:space-y-4">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-gray-100 shadow-xs w-full min-w-0">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <Users size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                  {t('supervisor_team.title')}
                </h2>
                <span
                  className={clsx(
                    'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold max-w-full truncate',
                    headerBadgeStyle,
                  )}
                >
                  <UserCheck size={12} className="shrink-0" />
                  <span className="truncate">
                    {isAreaCoordinator
                      ? effectiveAreaName
                      : isGroupCoordinator
                        ? (activeGroupConfigName || 'Grupo')
                        : activeGroupConfigName
                          ? `${activeGroupConfigName} • ${areaName}`
                          : areaName}
                  </span>
                </span>
                {activeCampusName && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 max-w-full truncate">
                    <Building2 size={11} className="shrink-0" />
                    <span className="truncate">{activeCampusName}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-medium mt-1 leading-normal">
                {filteredAssignments.length === 1
                  ? t('supervisor_team.count_one')
                  : t('supervisor_team.count_other', { count: filteredAssignments.length })}
                {' • '}
                <span className="font-semibold text-gray-700">
                  {isAreaCoordinator
                    ? t('supervisor_team.role_area_coordinator')
                    : isGroupCoordinator
                      ? t('supervisor_team.role_group_coordinator')
                      : t('supervisor_team.role_supervisor')}
                </span>
                {activeGroupConfigName && !isAreaCoordinator && (
                  <span>{` — ${activeGroupConfigName}`}</span>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadTeamData}
            disabled={isLoading}
            title="Actualizar lista"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-600 flex items-center justify-center transition-colors active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
          >
            <RefreshCw size={15} className={clsx(isLoading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Main Tabs (Directorio vs Solicitudes) */}
      {(isGroupCoordinator || isAreaCoordinator) && (
        <div className="flex border-b border-gray-200 w-full min-w-0">
          <button
            type="button"
            onClick={() => setActiveMainTab('TEAM')}
            className={clsx(
              'flex-1 py-2.5 px-2 sm:px-4 text-center text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer min-w-0 truncate',
              activeMainTab === 'TEAM'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            )}
          >
            <Users size={16} className="shrink-0" />
            <span className="truncate">{t('supervisor_team.tabs.active_team')}</span>
            <span
              className={clsx(
                'px-1.5 py-0.2 rounded-full text-[11px] font-extrabold shrink-0',
                activeMainTab === 'TEAM'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-gray-100 text-gray-600',
              )}
            >
              {assignments.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('APPLICATIONS')}
            className={clsx(
              'flex-1 py-2.5 px-2 sm:px-4 text-center text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer min-w-0 truncate',
              activeMainTab === 'APPLICATIONS'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            )}
          >
            <Sparkles size={16} className="shrink-0" />
            <span className="truncate">{t('supervisor_team.tabs.applications')}</span>
            {pendingApplicationsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[11px] font-extrabold bg-amber-500 text-white animate-pulse shrink-0">
                {pendingApplicationsCount}
              </span>
            )}
          </button>
        </div>
      )}

      {activeMainTab === 'APPLICATIONS' ? (
        <div className="pt-1">
          <VolunteerApplicationsTab
            initialCampusId={effectiveCampusId}
            initialGroupId={effectiveGroupId}
            lockGroup={isGroupCoordinator && !isAreaCoordinator}
            onApplicationProcessed={() => {
              loadTeamData();
              refreshApplicationsCount();
            }}
          />
        </div>
      ) : (
        <>
          {/* Live Service Attendance Notice */}
          {canTakeVolunteerAttendance &&
            currentMeeting &&
            attendanceSummary &&
            attendanceSummary.total > 0 && (
              <LiveAttendanceWidget
                meetingName={currentMeeting.name}
                attendanceSummary={attendanceSummary}
                onClick={() => navigate(APP_ROUTES.kidChurch.volunteerAttendance)}
              />
            )}

          {/* Search bar */}
          <Input
            type="text"
            icon="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm('')}
            placeholder={t('supervisor_team.search_placeholder')}
          />

          {/* Group filter tabs for Area Coordinator */}
          {isAreaCoordinator && availableGroups.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500 px-0.5">
                <span className="font-semibold text-slate-700">
                  {t('volunteer_attendance.filter_by_group')}
                </span>
                {canScrollRight && (
                  <span className="text-[11px] text-primary font-semibold flex items-center gap-1">
                    <span>{t('volunteer_attendance.swipe_hint')}</span>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                  </span>
                )}
              </div>

              <div className="relative group w-full min-w-0 max-w-full">
                {canScrollLeft && (
                  <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center pr-3 bg-gradient-to-r from-slate-50 via-slate-50/80 to-transparent pointer-events-none">
                    <button
                      type="button"
                      onClick={() => handleScrollFilter('left')}
                      aria-label={t('volunteer_attendance.scroll_left_hint')}
                      title={t('volunteer_attendance.scroll_left_hint')}
                      className="pointer-events-auto w-7 h-7 rounded-full bg-white shadow-md border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-50 active:scale-90 transition-all cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div
                  ref={filterScrollRef}
                  onScroll={checkFilterScroll}
                  className="flex items-center gap-1.5 overflow-x-auto scroll-smooth py-0.5 no-scrollbar w-full min-w-0 max-w-full"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedGroupFilter('ALL')}
                    className={clsx(
                      'px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs',
                      selectedGroupFilter === 'ALL'
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80',
                    )}
                  >
                    <span>{t('supervisor_team.all_groups')}</span>
                    <span
                      className={clsx(
                        'px-1.5 py-0.2 rounded-full text-[10px] font-extrabold',
                        selectedGroupFilter === 'ALL'
                          ? 'bg-white/25 text-white'
                          : 'bg-slate-100 text-slate-600',
                      )}
                    >
                      {
                        assignments.filter(
                          (asg) =>
                            asg.state !== EntityState.DELETED &&
                            (asg.role === VolunteerRole.SUPERVISOR || asg.role === VolunteerRole.VOLUNTEER),
                        ).length
                      }
                    </span>
                  </button>

                  {availableGroups.map((group) => {
                    const count = assignments.filter((asg: IVolunteerAssignment) => {
                      if (asg.state === EntityState.DELETED) return false;
                      if (asg.role !== VolunteerRole.SUPERVISOR && asg.role !== VolunteerRole.VOLUNTEER)
                        return false;
                      const asgGroupId =
                        asg.ministryGroupConfigId ||
                        asg.ministryGroupConfig?.id ||
                        asg.serviceAreaGroup?.ministryGroupConfigId ||
                        asg.serviceAreaGroup?.ministryGroupConfig?.id;
                      return asgGroupId === group.id;
                    }).length;

                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => setSelectedGroupFilter(group.id)}
                        className={clsx(
                          'px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs',
                          selectedGroupFilter === group.id
                            ? 'bg-primary text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80',
                        )}
                      >
                        <span>{group.name}</span>
                        <span
                          className={clsx(
                            'px-1.5 py-0.2 rounded-full text-[10px] font-extrabold',
                            selectedGroupFilter === group.id
                              ? 'bg-white/25 text-white'
                              : 'bg-slate-100 text-slate-600',
                          )}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {canScrollRight && (
                  <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center pl-3 bg-gradient-to-l from-slate-50 via-slate-50/80 to-transparent pointer-events-none">
                    <button
                      type="button"
                      onClick={() => handleScrollFilter('right')}
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

          {/* Area & Role filter tabs for Group Coordinators */}
          {!isAreaCoordinator && isGroupCoordinator && (availableAreas.length > 0 || coordinatorCount > 0) && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500 px-0.5">
                <span className="font-semibold text-slate-700">
                  {t('volunteer_attendance.filter_by_area')}
                </span>
                {canScrollRight && (
                  <span className="text-[11px] text-primary font-semibold flex items-center gap-1">
                    <span>{t('volunteer_attendance.swipe_hint')}</span>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                  </span>
                )}
              </div>

              <div className="relative group w-full min-w-0 max-w-full">
                {canScrollLeft && (
                  <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center pr-3 bg-gradient-to-r from-slate-50 via-slate-50/80 to-transparent pointer-events-none">
                    <button
                      type="button"
                      onClick={() => handleScrollFilter('left')}
                      aria-label={t('volunteer_attendance.scroll_left_hint')}
                      title={t('volunteer_attendance.scroll_left_hint')}
                      className="pointer-events-auto w-7 h-7 rounded-full bg-white shadow-md border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-50 active:scale-90 transition-all cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div
                  ref={filterScrollRef}
                  onScroll={checkFilterScroll}
                  className="flex items-center gap-1.5 overflow-x-auto scroll-smooth py-0.5 no-scrollbar w-full min-w-0 max-w-full"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedAreaFilter('ALL')}
                    className={clsx(
                      'px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs',
                      selectedAreaFilter === 'ALL'
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80',
                    )}
                  >
                    <span>{t('supervisor_team.all_areas')}</span>
                    <span
                      className={clsx(
                        'px-1.5 py-0.2 rounded-full text-[10px] font-extrabold',
                        selectedAreaFilter === 'ALL'
                          ? 'bg-white/25 text-white'
                          : 'bg-slate-100 text-slate-600',
                      )}
                    >
                      {assignments.length}
                    </span>
                  </button>

                  {/* Coordinadores de grupo - First specific category filter */}
                  {coordinatorCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedAreaFilter('COORDINATORS')}
                      className={clsx(
                        'px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs',
                        selectedAreaFilter === 'COORDINATORS'
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80',
                      )}
                    >
                      <span>{t('supervisor_team.group_coordinators')}</span>
                      <span
                        className={clsx(
                          'px-1.5 py-0.2 rounded-full text-[10px] font-extrabold',
                          selectedAreaFilter === 'COORDINATORS'
                            ? 'bg-white/25 text-white'
                            : 'bg-slate-100 text-slate-600',
                        )}
                      >
                        {coordinatorCount}
                      </span>
                    </button>
                  )}

                  {/* Area filter tabs */}
                  {availableAreas.map((area) => {
                    const count = assignments.filter((asg: IVolunteerAssignment) => {
                      if (asg.state === EntityState.DELETED) return false;
                      if (asg.role === VolunteerRole.GROUP_COORDINATOR) return false;
                      const asgAreaId =
                        asg.ministryAreaId ||
                        asg.serviceAreaGroup?.ministryAreaId ||
                        asg.serviceAreaGroup?.ministryArea?.id;
                      return asgAreaId === area.id;
                    }).length;

                    return (
                      <button
                        key={area.id}
                        type="button"
                        onClick={() => setSelectedAreaFilter(area.id)}
                        className={clsx(
                          'px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs',
                          selectedAreaFilter === area.id
                            ? 'bg-primary text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80',
                        )}
                      >
                        <span>{area.name}</span>
                        <span
                          className={clsx(
                            'px-1.5 py-0.2 rounded-full text-[10px] font-extrabold',
                            selectedAreaFilter === area.id
                              ? 'bg-white/25 text-white'
                              : 'bg-slate-100 text-slate-600',
                          )}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {canScrollRight && (
                  <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center pl-3 bg-gradient-to-l from-slate-50 via-slate-50/80 to-transparent pointer-events-none">
                    <button
                      type="button"
                      onClick={() => handleScrollFilter('right')}
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

          {/* Server list */}
          {isLoading && assignments.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xs divide-y divide-gray-100 overflow-hidden w-full min-w-0 max-w-full">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-3.5 sm:p-4 flex items-center justify-between gap-3 animate-pulse">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-gray-100 shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-100 rounded w-1/3" />
                      <div className="h-3 bg-gray-100 rounded w-1/4" />
                    </div>
                  </div>
                  <div className="w-24 h-8 bg-gray-100 rounded-xl shrink-0" />
                </div>
              ))}
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 border border-gray-100 shadow-xs text-center flex flex-col items-center justify-center space-y-3 w-full min-w-0 max-w-full">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400">
                <Users size={28} />
              </div>
              <h3 className="text-base font-bold text-gray-800">
                {searchTerm
                  ? t('supervisor_team.empty_search_title')
                  : t('supervisor_team.empty_default_title', {
                      volunteers: churchVolunteersTerm.toLowerCase(),
                    })}
              </h3>
              <p className="text-xs text-gray-400 max-w-sm">
                {searchTerm
                  ? t('supervisor_team.empty_search_desc')
                  : t('supervisor_team.empty_default_desc', {
                      volunteers: churchVolunteersTerm.toLowerCase(),
                    })}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xs divide-y divide-gray-100 overflow-hidden w-full min-w-0 max-w-full">
              {filteredAssignments.map((asg) => {
                const user = asg.user || asg.volunteer?.user;
                const isMe =
                  (user?.id && user.id === currentUser?.id) ||
                  (asg.volunteer?.userId && asg.volunteer.userId === currentUser?.id);

                return (
                  <VolunteerAssignmentCard
                    key={asg.id}
                    assignment={asg}
                    isCurrentUser={Boolean(isMe)}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Floating Scroll-to-Top Button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={handleScrollToTop}
          aria-label={t('volunteer_attendance.scroll_to_top')}
          title={t('volunteer_attendance.scroll_to_top')}
          className="fixed bottom-20 sm:bottom-24 right-5 sm:right-8 z-30 w-11 h-11 rounded-full bg-slate-900 text-white shadow-xl hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
        >
          <ArrowUp className="w-5 h-5 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
};

export default MyTeamView;
