import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import {
  useGetKidGroupsQuery,
  useGetKidGroupAttendanceQuery,
} from '@/libs/state/redux/api/kidChurchApi';
import {
  useGetVolunteerAttendanceQuery,
  useGetVolunteerAttendanceSummaryQuery,
} from '@/libs/state/redux/api/churchApi';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetVolunteerAssignments } from '@/libs/state/redux/thunks/church/volunteer.thunk';
import {
  EntityState,
  IKid,
  IKidGroup,
  IVolunteerAssignment,
  MinistryAreaScope,
  UserGenderCode,
  VolunteerAttendanceStatus,
  VolunteerRole,
} from '@/libs/models';
import { useChurchMeetingStatus } from '@/libs/hooks/useChurchMeetingStatus';
import { usePermissions } from '@/libs/hooks/usePermissions';
import { useKidChurchLiveSync } from '@/libs/hooks/useKidChurchLiveSync';
import { useVolunteerAttendanceLiveSync } from '@/libs/hooks/useVolunteerAttendanceLiveSync';
import { sortKidGroupsByAge } from '@/libs/utils/kidGroup';
import { ServerDistributionStats } from '../components/ServerDistributionCards';
import { TeamAttendanceSummaryStats } from '../components/TeamAttendanceSummaryCard';

const EMPTY_ASSIGNMENTS: IVolunteerAssignment[] = [];

/**
 * Checks if a ministry area corresponds to children classroom management.
 *
 * @param {object} [area] - Ministry area object or partial relation.
 * @returns {boolean} True if the area manages kid groups, false otherwise.
 */
export const isClassroomArea = (
  area?: {
    scope?: MinistryAreaScope | null;
    kidGroups?: unknown[];
    kidGroupId?: string;
    kidGroupIds?: string[];
    name?: string;
  } | null,
): boolean => {
  if (!area) return false;
  if (area.scope === MinistryAreaScope.KID_GROUP_MANAGEMENT) return true;
  if (Array.isArray(area.kidGroups) && area.kidGroups.length > 0) return true;
  if (area.kidGroupId || (Array.isArray(area.kidGroupIds) && area.kidGroupIds.length > 0)) {
    return true;
  }
  return false;
};

/**
 * Checks if a volunteer role is supervisory.
 *
 * @param {VolunteerRole} [role] - Volunteer role.
 * @returns {boolean} True if supervisory.
 */
export const isSupervisorRole = (role?: VolunteerRole): boolean => {
  return role === VolunteerRole.SUPERVISOR;
};

/**
 * Checks if a volunteer role is a coordinator role.
 *
 * @param {VolunteerRole} [role] - Volunteer role.
 * @returns {boolean} True if coordinator.
 */
export const isCoordinatorRole = (role?: VolunteerRole): boolean => {
  return (
    role === VolunteerRole.GROUP_COORDINATOR ||
    role === VolunteerRole.AREA_GENERAL_COORDINATOR ||
    role === VolunteerRole.MINISTRY_GENERAL_COORDINATOR
  );
};

/**
 * Determines whether a kid was created or registered for the first time today.
 *
 * @param {IKid} kid - Kid entity.
 * @param {string} [todayDateStr] - Today's date string (YYYY-MM-DD). Defaults to current date.
 * @returns {boolean} True if new today.
 */
export const isKidNewToday = (kid: IKid, todayDateStr?: string): boolean => {
  if (kid.currentKidRegistration?.additionalInfo?.isNew !== undefined) {
    return Boolean(kid.currentKidRegistration.additionalInfo.isNew);
  }
  if (kid.createdAt) {
    const reference = todayDateStr ? dayjs(todayDateStr) : dayjs();
    return dayjs(kid.createdAt).isSame(reference, 'day');
  }
  return false;
};

export interface ClassroomMetricItem {
  id: string;
  name: string;
  totalKids: number;
  boys: number;
  girls: number;
  ageRange: string;
  serversAttended: number;
  ratio: number;
}

export interface GenderMetricItem {
  name: string;
  key: 'boys' | 'girls';
  value: number;
  percent: number;
  color: string;
}

export interface AgeDistributionItem {
  bracket: string;
  key: string;
  count: number;
  percent: number;
}

export interface AreaMetricItem {
  id: string;
  name: string;
  displayName: string;
  attended: number;
  assigned: number;
  teachersAttended: number;
  teachersAssigned: number;
  supervisorsAttended: number;
  supervisorsAssigned: number;
  coordinatorsAttended: number;
  coordinatorsAssigned: number;
  percent: number;
}

export interface StaffRoleSummary {
  totalAssigned: number;
  totalAttended: number;
  totalPercent: number;
  teachersAssigned: number;
  teachersAttended: number;
  teachersPercent: number;
  supervisorsAssigned: number;
  supervisorsAttended: number;
  supervisorsPercent: number;
}

export interface CoordinatorKpiMetrics {
  totalKids: number;
  maleKids: number;
  femaleKids: number;
  newKidsCount: number;
  newKidsPercentage: number;
  malePercentage: number;
  femalePercentage: number;
  attendedServers: number;
  assignedServers: number;
  serversAttendancePercent: number;
  activeClassroomsCount: number;
  kidsPerServerRatio: number;
  isRatioHealthy: boolean;
}

/**
 * Custom hook to aggregate live statistics for Group Coordinators.
 * Combines kid attendances, classroom rosters, volunteer assignments, and volunteer attendance
 * with real-time SSE syncing.
 *
 * @returns Aggregated metrics, chart datasets, loading flags, and refresh handler.
 */
export const useGroupCoordinatorStats = () => {
  const { t } = useTranslation(['kidChurch', 'common']);
  const dispatch = useAppDispatch();
  const { currentMeeting, currentCampus, isConfigured } = useChurchMeetingStatus();
  const { isSuperAdmin, canTakeVolunteerAttendance } = usePermissions();

  const {
    activeCampusId,
    activeGroupConfigId,
  } = useAppSelector((state) => state.volunteerContextSlice);

  const effectiveCampusId = activeCampusId || currentCampus?.id;
  const effectiveGroupId =
    activeGroupConfigId && activeGroupConfigId !== 'ADMIN_GROUP'
      ? activeGroupConfigId
      : undefined;

  const todayIso = useMemo(() => dayjs().format('YYYY-MM-DD'), []);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 1. Kid Groups / Classrooms
  const {
    data: kidGroups = [],
    isLoading: loadingKidGroups,
    refetch: refetchKidGroups,
  } = useGetKidGroupsQuery();

  const sortedKidGroups = useMemo(() => {
    return sortKidGroupsByAge(kidGroups);
  }, [kidGroups]);

  // 2. Live Kids Attendance for Current Meeting
  const {
    data: rawKids,
    isLoading: loadingKids,
    refetch: refetchKids,
  } = useGetKidGroupAttendanceQuery(
    {
      date: todayIso,
      churchMeetingId: currentMeeting?.id,
    },
    {
      skip: !currentMeeting?.id,
    },
  );

  const kids: IKid[] = useMemo(() => {
    if (Array.isArray(rawKids)) return rawKids;
    if (typeof rawKids === 'string') {
      try {
        const parsed = JSON.parse(rawKids);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }, [rawKids]);

  // 3. Volunteer Assignments
  const partitionKey = `attendance-team-${effectiveCampusId}-${effectiveGroupId || 'all'}`;
  const assignments =
    useAppSelector(
      (state) => state.volunteerSlice.assignmentsByPartition[partitionKey],
    ) ?? EMPTY_ASSIGNMENTS;

  const loadTeamData = useCallback(() => {
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

  // 4. Recorded Volunteer Attendances
  const {
    data: recordedAttendances = [],
    isLoading: loadingVolunteerAttendance,
    refetch: refetchVolunteerAttendance,
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

  // 5. Volunteer Attendance Summary
  const {
    data: attendanceSummary,
    refetch: refetchSummary,
  } = useGetVolunteerAttendanceSummaryQuery(
    {
      churchMeetingId: currentMeeting?.id || '',
      ministryGroupConfigId: effectiveGroupId,
    },
    {
      skip: !currentMeeting?.id || (!effectiveGroupId && !isSuperAdmin),
    },
  );

  // Realtime Live Sync: Keep kids and volunteers updated via SSE
  useKidChurchLiveSync({
    churchMeetingId: currentMeeting?.id,
    enabled: Boolean(currentMeeting?.id),
  });

  useVolunteerAttendanceLiveSync({
    churchMeetingId: currentMeeting?.id,
    enabled: Boolean(
      canTakeVolunteerAttendance &&
        currentMeeting?.id &&
        (effectiveGroupId || isSuperAdmin),
    ),
  });

  // Map of volunteerAssignmentId -> attendance record
  const attendanceMap = useMemo(() => {
    const map = new Map<string, (typeof recordedAttendances)[0]>();
    for (const att of recordedAttendances) {
      if (att.volunteerAssignmentId) {
        map.set(att.volunteerAssignmentId, att);
      }
    }
    return map;
  }, [recordedAttendances]);

  // Eligible volunteer assignments (excluding ministry general coordinator)
  const eligibleAssignments = useMemo(() => {
    return assignments.filter(
      (asg) => asg.role !== VolunteerRole.MINISTRY_GENERAL_COORDINATOR,
    );
  }, [assignments]);

  // 6. Calculate Server Distribution Stats (Personal en Salones vs Otras Áreas)
  const serverDistributionStats: ServerDistributionStats = useMemo(() => {
    let classroomAssignedTotal = 0;
    let classroomAssignedTeachers = 0;
    let classroomAssignedSupervisors = 0;
    let classroomAttendedTotal = 0;
    let classroomAttendedTeachers = 0;
    let classroomAttendedSupervisors = 0;

    let otherAreasAssignedTotal = 0;
    let otherAreasAssignedTeachers = 0;
    let otherAreasAssignedSupervisors = 0;
    let otherAreasAttendedTotal = 0;
    let otherAreasAttendedTeachers = 0;
    let otherAreasAttendedSupervisors = 0;

    const classroomAreaSet = new Set<string>();
    const otherAreaSet = new Set<string>();

    for (const asg of eligibleAssignments) {
      const area = asg.serviceAreaGroup?.ministryArea || asg.ministryArea;
      const areaId = area?.id || asg.ministryAreaId || asg.serviceAreaGroupId || 'NO_AREA';
      const isCoord = isCoordinatorRole(asg.role);
      const isSup = isSupervisorRole(asg.role);
      const isClassroom = isClassroomArea(area);

      if (!isCoord) {
        if (isClassroom) {
          classroomAreaSet.add(areaId);
          classroomAssignedTotal++;
          if (isSup) classroomAssignedSupervisors++;
          else classroomAssignedTeachers++;
        } else {
          otherAreaSet.add(areaId);
          otherAreasAssignedTotal++;
          if (isSup) otherAreasAssignedSupervisors++;
          else otherAreasAssignedTeachers++;
        }
      }

      const currentStatus = attendanceMap.get(asg.id)?.attendanceStatus;
      if (currentStatus === VolunteerAttendanceStatus.ATTENDED) {
        if (!isCoord) {
          if (isClassroom) {
            classroomAttendedTotal++;
            if (isSup) classroomAttendedSupervisors++;
            else classroomAttendedTeachers++;
          } else {
            otherAreasAttendedTotal++;
            if (isSup) otherAreasAttendedSupervisors++;
            else otherAreasAttendedTeachers++;
          }
        }
      }
    }

    return {
      classroomAreasCount: classroomAreaSet.size,
      classroomAttendedTotal,
      classroomAssignedTotal,
      classroomAttendedTeachers,
      classroomAttendedSupervisors,
      otherAreasCount: otherAreaSet.size,
      otherAreasAttendedTotal,
      otherAreasAssignedTotal,
      otherAreasAttendedTeachers,
      otherAreasAttendedSupervisors,
    };
  }, [eligibleAssignments, attendanceMap]);

  // Overall Staff Role Summary (Minicards de 3: Total Servidores, Maestros, Supervisores)
  const staffRoleSummary: StaffRoleSummary = useMemo(() => {
    let totalAssigned = 0;
    let totalAttended = 0;
    let teachersAssigned = 0;
    let teachersAttended = 0;
    let supervisorsAssigned = 0;
    let supervisorsAttended = 0;

    for (const asg of eligibleAssignments) {
      if (isCoordinatorRole(asg.role)) continue;
      const isSup = isSupervisorRole(asg.role);
      const isAttended =
        attendanceMap.get(asg.id)?.attendanceStatus === VolunteerAttendanceStatus.ATTENDED;

      totalAssigned++;
      if (isAttended) totalAttended++;

      if (isSup) {
        supervisorsAssigned++;
        if (isAttended) supervisorsAttended++;
      } else {
        teachersAssigned++;
        if (isAttended) teachersAttended++;
      }
    }

    return {
      totalAssigned,
      totalAttended,
      totalPercent: totalAssigned > 0 ? Math.round((totalAttended / totalAssigned) * 100) : 0,
      teachersAssigned,
      teachersAttended,
      teachersPercent:
        teachersAssigned > 0 ? Math.round((teachersAttended / teachersAssigned) * 100) : 0,
      supervisorsAssigned,
      supervisorsAttended,
      supervisorsPercent:
        supervisorsAssigned > 0
          ? Math.round((supervisorsAttended / supervisorsAssigned) * 100)
          : 0,
    };
  }, [eligibleAssignments, attendanceMap]);

  // Breakdown of servers per area for horizontal Recharts BarChart (including coordinators, sorted alphabetically)
  const areaServerData: AreaMetricItem[] = useMemo(() => {
    const areaMap = new Map<
      string,
      {
        id: string;
        name: string;
        attended: number;
        assigned: number;
        teachersAttended: number;
        teachersAssigned: number;
        supervisorsAttended: number;
        supervisorsAssigned: number;
        coordinatorsAttended: number;
        coordinatorsAssigned: number;
      }
    >();

    for (const asg of eligibleAssignments) {
      const area = asg.serviceAreaGroup?.ministryArea || asg.ministryArea;
      const areaId = area?.id || asg.ministryAreaId || asg.serviceAreaGroupId || 'COORDINATION';
      const areaName =
        area?.name ||
        asg.serviceAreaGroup?.ministryGroupConfig?.name ||
        (isCoordinatorRole(asg.role) ? 'Coordinación' : 'Área General');
      const isSup = isSupervisorRole(asg.role);
      const isCoord = isCoordinatorRole(asg.role);
      const isAttended =
        attendanceMap.get(asg.id)?.attendanceStatus === VolunteerAttendanceStatus.ATTENDED;

      if (!areaMap.has(areaId)) {
        areaMap.set(areaId, {
          id: areaId,
          name: areaName,
          attended: 0,
          assigned: 0,
          teachersAttended: 0,
          teachersAssigned: 0,
          supervisorsAttended: 0,
          supervisorsAssigned: 0,
          coordinatorsAttended: 0,
          coordinatorsAssigned: 0,
        });
      }

      const item = areaMap.get(areaId)!;
      item.assigned++;
      if (isAttended) item.attended++;

      if (isCoord) {
        item.coordinatorsAssigned++;
        if (isAttended) item.coordinatorsAttended++;
      } else if (isSup) {
        item.supervisorsAssigned++;
        if (isAttended) item.supervisorsAttended++;
      } else {
        item.teachersAssigned++;
        if (isAttended) item.teachersAttended++;
      }
    }

    return Array.from(areaMap.values())
      .map((item) => ({
        ...item,
        displayName: item.name.length > 15 ? `${item.name.slice(0, 14)}…` : item.name,
        percent: item.assigned > 0 ? Math.round((item.attended / item.assigned) * 100) : 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  }, [eligibleAssignments, attendanceMap]);

  // Total attended servers across all areas (including coordinators)
  const totalAttendedServers = useMemo(() => {
    let count = 0;
    for (const asg of eligibleAssignments) {
      if (attendanceMap.get(asg.id)?.attendanceStatus === VolunteerAttendanceStatus.ATTENDED) {
        count++;
      }
    }
    return count;
  }, [eligibleAssignments, attendanceMap]);

  // Overall Volunteer Attendance breakdown (Asistencia General)
  const teamAttendanceSummaryStats: TeamAttendanceSummaryStats = useMemo(() => {
    let attended = 0;
    let excused = 0;
    let unexcused = 0;
    let exempt = 0;

    for (const asg of eligibleAssignments) {
      const currentStatus = attendanceMap.get(asg.id)?.attendanceStatus;
      if (currentStatus === VolunteerAttendanceStatus.ATTENDED) attended++;
      else if (currentStatus === VolunteerAttendanceStatus.EXCUSED) excused++;
      else if (currentStatus === VolunteerAttendanceStatus.UNEXCUSED) unexcused++;
      else if (currentStatus === VolunteerAttendanceStatus.EXEMPT) exempt++;
    }

    const total = eligibleAssignments.length;
    const taken = attended + excused + unexcused + exempt;
    const pending = Math.max(0, total - taken);

    return {
      total,
      taken,
      pending,
      attended,
      excused,
      unexcused,
      exempt,
    };
  }, [eligibleAssignments, attendanceMap]);

  // 7. Calculate Kids KPIs & Metrics
  const totalKids = kids.length;
  const maleKids = useMemo(
    () => kids.filter((k) => k.gender === UserGenderCode.MALE).length,
    [kids],
  );
  const femaleKids = useMemo(
    () => kids.filter((k) => k.gender === UserGenderCode.FEMALE).length,
    [kids],
  );

  const malePercentage = totalKids > 0 ? Math.round((maleKids / totalKids) * 100) : 0;
  const femalePercentage = totalKids > 0 ? Math.round((femaleKids / totalKids) * 100) : 0;

  // New kids registered for the first time today
  const newKidsCount = useMemo(() => {
    return kids.filter((k) => isKidNewToday(k, todayIso)).length;
  }, [kids, todayIso]);

  const newKidsPercentage = totalKids > 0 ? Math.round((newKidsCount / totalKids) * 100) : 0;

  // Active classrooms with at least 1 registered kid
  const activeClassroomsCount = useMemo(() => {
    const groupIdsWithKids = new Set<string>();
    for (const kid of kids) {
      if (kid.kidGroup?.id) {
        groupIdsWithKids.add(kid.kidGroup.id);
      }
    }
    return groupIdsWithKids.size;
  }, [kids]);

  // Kids per Server Ratio (in classrooms)
  const classroomAttendedServers = serverDistributionStats.classroomAttendedTotal;
  const kidsPerServerRatio = useMemo(() => {
    if (classroomAttendedServers === 0) return totalKids;
    return Math.round((totalKids / classroomAttendedServers) * 10) / 10;
  }, [totalKids, classroomAttendedServers]);

  const isRatioHealthy = kidsPerServerRatio <= 8;

  const kpis: CoordinatorKpiMetrics = useMemo(() => {
    const assignedServers = eligibleAssignments.length;
    const serversAttendancePercent =
      assignedServers > 0 ? Math.round((totalAttendedServers / assignedServers) * 100) : 0;

    return {
      totalKids,
      maleKids,
      femaleKids,
      newKidsCount,
      newKidsPercentage,
      malePercentage,
      femalePercentage,
      attendedServers: totalAttendedServers,
      assignedServers,
      serversAttendancePercent,
      activeClassroomsCount,
      kidsPerServerRatio,
      isRatioHealthy,
    };
  }, [
    totalKids,
    maleKids,
    femaleKids,
    newKidsCount,
    newKidsPercentage,
    malePercentage,
    femalePercentage,
    totalAttendedServers,
    eligibleAssignments.length,
    activeClassroomsCount,
    kidsPerServerRatio,
    isRatioHealthy,
  ]);

  // 8. Classroom Chart Data
  const classroomData: ClassroomMetricItem[] = useMemo(() => {
    return sortedKidGroups.map((group) => {
      const groupKids = kids.filter((k) => k.kidGroup?.id === group.id);
      const boys = groupKids.filter((k) => k.gender === UserGenderCode.MALE).length;
      const girls = groupKids.filter((k) => k.gender === UserGenderCode.FEMALE).length;

      // Count attended servers assigned to this specific classroom / kid group
      let serversAttended = 0;
      for (const asg of eligibleAssignments) {
        const area = asg.serviceAreaGroup?.ministryArea || asg.ministryArea;
        const matchesGroup =
          area?.kidGroupId === group.id ||
          (Array.isArray(area?.kidGroupIds) && area.kidGroupIds.includes(group.id));
        if (
          matchesGroup &&
          attendanceMap.get(asg.id)?.attendanceStatus === VolunteerAttendanceStatus.ATTENDED
        ) {
          serversAttended++;
        }
      }

      let ageRange = group.description || '';
      if (group.initialMonth !== undefined && group.finalMonth !== undefined) {
        const minYears = Math.floor(Number(group.initialMonth) / 12);
        const maxYears = Math.floor(Number(group.finalMonth) / 12);
        if (!isNaN(minYears) && !isNaN(maxYears) && maxYears > 0) {
          ageRange = `${minYears} - ${maxYears} años`;
        }
      }

      const ratio = serversAttended > 0 ? Math.round(groupKids.length / serversAttended) : groupKids.length;

      return {
        id: group.id,
        name: group.name,
        totalKids: groupKids.length,
        boys,
        girls,
        ageRange,
        serversAttended,
        ratio,
      };
    });
  }, [sortedKidGroups, kids, eligibleAssignments, attendanceMap]);

  // 9. Gender Chart Data (for Donut / PieChart)
  const genderData: GenderMetricItem[] = useMemo(() => {
    return [
      {
        name: t('coordinator_dashboard.boys', 'Niños'),
        key: 'boys',
        value: maleKids,
        percent: malePercentage,
        color: '#4F46E5', // Indigo-600
      },
      {
        name: t('coordinator_dashboard.girls', 'Niñas'),
        key: 'girls',
        value: femaleKids,
        percent: femalePercentage,
        color: '#EC4899', // Pink-500
      },
    ];
  }, [maleKids, femaleKids, malePercentage, femalePercentage, t]);

  // 10. Age Distribution Data (Histogram / BarChart)
  const ageDistributionData: AgeDistributionItem[] = useMemo(() => {
    let count0to2 = 0;
    let count3to5 = 0;
    let count6to8 = 0;
    let count9to12 = 0;
    let count13plus = 0;

    for (const kid of kids) {
      const age = kid.age ?? 0;
      if (age <= 2) count0to2++;
      else if (age <= 5) count3to5++;
      else if (age <= 8) count6to8++;
      else if (age <= 12) count9to12++;
      else count13plus++;
    }

    const items: AgeDistributionItem[] = [
      {
        bracket: t('coordinator_dashboard.age_bucket_0_2', '0 a 2 años'),
        key: '0_2',
        count: count0to2,
        percent: totalKids > 0 ? Math.round((count0to2 / totalKids) * 100) : 0,
      },
      {
        bracket: t('coordinator_dashboard.age_bucket_3_5', '3 a 5 años'),
        key: '3_5',
        count: count3to5,
        percent: totalKids > 0 ? Math.round((count3to5 / totalKids) * 100) : 0,
      },
      {
        bracket: t('coordinator_dashboard.age_bucket_6_8', '6 a 8 años'),
        key: '6_8',
        count: count6to8,
        percent: totalKids > 0 ? Math.round((count6to8 / totalKids) * 100) : 0,
      },
      {
        bracket: t('coordinator_dashboard.age_bucket_9_12', '9 a 12 años'),
        key: '9_12',
        count: count9to12,
        percent: totalKids > 0 ? Math.round((count9to12 / totalKids) * 100) : 0,
      },
    ];

    if (count13plus > 0) {
      items.push({
        bracket: t('coordinator_dashboard.age_bucket_13_plus', '13+ años'),
        key: '13_plus',
        count: count13plus,
        percent: totalKids > 0 ? Math.round((count13plus / totalKids) * 100) : 0,
      });
    }

    return items;
  }, [kids, totalKids, t]);

  // Refresh all relevant queries in parallel
  const refetchAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchKidGroups(),
        refetchKids(),
        refetchVolunteerAttendance(),
        refetchSummary(),
      ]);
      loadTeamData();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchKidGroups, refetchKids, refetchVolunteerAttendance, refetchSummary, loadTeamData]);

  const loading = loadingKidGroups || loadingKids || loadingVolunteerAttendance;

  return {
    currentMeeting,
    currentCampus,
    isConfigured,
    loading,
    isRefreshing,
    refetchAll,
    kids,
    kidGroups: sortedKidGroups,
    kpis,
    classroomData,
    genderData,
    ageDistributionData,
    serverDistributionStats,
    teamAttendanceSummaryStats,
    staffRoleSummary,
    areaServerData,
    attendanceSummary,
  };
};

export default useGroupCoordinatorStats;
