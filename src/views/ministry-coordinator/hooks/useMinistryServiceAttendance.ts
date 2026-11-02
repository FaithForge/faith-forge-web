import { Days } from '@/libs/common-types/constants/days';
import { usePermissions } from '@/libs/hooks/usePermissions';
import {
  ChurchMeetingStateEnum,
  EntityState,
  IMinistry,
  IMinistryGroupConfig,
  IVolunteerAssignment,
  VolunteerAttendanceStatus,
  VolunteerRole,
} from '@/libs/models';
import {
  useGetCalendarMeetingsQuery,
  useGetChurchMeetingsQuery,
  useGetMinistriesQuery,
  useGetVolunteerAssignmentsQuery,
  useGetVolunteerAttendanceQuery,
} from '@/libs/state/redux/api/churchApi';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { setActiveMinistry } from '@/libs/state/redux/slices/church/volunteerContext.slice';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';

const DAYJS_TO_DAYS: Record<number, Days> = {
  0: Days.SUNDAY,
  1: Days.MONDAY,
  2: Days.TUESDAY,
  3: Days.WEDNESDAY,
  4: Days.THURSDAY,
  5: Days.FRIDAY,
  6: Days.SATURDAY,
};

export interface EnrichedVolunteerAttendance {
  assignmentId: string;
  assignment: IVolunteerAssignment;
  userId?: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  photoUrl?: string;
  role: VolunteerRole;
  areaId: string;
  areaName: string;
  groupId?: string;
  groupName: string;
  isScheduled: boolean;
  attendanceStatus?: VolunteerAttendanceStatus | 'PENDING';
  attendanceTakeDate?: string | Date;
}

export interface AreaAttendanceBreakdown {
  areaId: string;
  areaName: string;
  total: number;
  attended: number;
  unexcused: number;
  excused: number;
  pending: number;
  attendancePercent: number;
  volunteers: EnrichedVolunteerAttendance[];
}

/**
 * Custom hook orchestrating ministry coordinator attendance reporting logic by date and service.
 * Provides selected meeting resolution, scheduled groups detection, volunteer assignments mapping,
 * and attendance statistics calculation.
 *
 * @returns {object} State, query results, computed metrics, and control setters.
 */
export const useMinistryServiceAttendance = () => {
  const dispatch = useAppDispatch();
  const { isAdmin } = usePermissions();

  const {
    activeCampusId,
    activeMinistryId,
    activeMinistryName,
    activeMinistryType,
    campuses,
  } = useAppSelector((state) => state.volunteerContextSlice);

  const currentCampus = useAppSelector(
    (state) => state.churchCampusSlice.current,
  );
  const effectiveCampusId = activeCampusId || currentCampus?.id;

  // Active campus context from volunteer assignment
  const currentCampusContext = useMemo(
    () => campuses.find((c) => c.id === effectiveCampusId),
    [campuses, effectiveCampusId],
  );

  // Fetch campus ministries to resolve available ministries
  const { data: campusMinistries = [] } = useGetMinistriesQuery(
    effectiveCampusId ? { churchCampusId: effectiveCampusId } : undefined,
    { skip: !effectiveCampusId },
  );

  const availableMinistries = useMemo(() => {
    if (isAdmin) {
      return (campusMinistries || []).map((m: IMinistry) => ({
        id: m.id,
        name: m.name,
        type: m.type,
      }));
    }

    const map = new Map<string, { id: string; name: string; type?: string }>();

    if (
      currentCampusContext?.ministryCoordinators &&
      currentCampusContext.ministryCoordinators.length > 0
    ) {
      for (const coord of currentCampusContext.ministryCoordinators) {
        const enriched = campusMinistries.find(
          (m: IMinistry) => m.id === coord.ministryId,
        );
        map.set(coord.ministryId, {
          id: coord.ministryId,
          name: coord.ministryName,
          type: coord.ministryType || enriched?.type || 'GENERAL',
        });
      }
    }

    if (map.size === 0 && campusMinistries.length > 0) {
      for (const m of campusMinistries) {
        map.set(m.id, {
          id: m.id,
          name: m.name,
          type: m.type,
        });
      }
    }

    return Array.from(map.values());
  }, [isAdmin, campusMinistries, currentCampusContext]);

  // Modal open state for ministry selection
  const [isMinistryModalOpen, setIsMinistryModalOpen] = useState(false);

  // Auto-select ministry if only 1 is available
  useEffect(() => {
    if (availableMinistries.length === 1) {
      const single = availableMinistries[0];
      if (activeMinistryId !== single.id) {
        dispatch(
          setActiveMinistry({
            ministryId: single.id,
            ministryName: single.name,
            ministryType: single.type,
          }),
        );
      }
    }
  }, [availableMinistries, activeMinistryId, dispatch]);

  // Selected date state (defaults to today's date in YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    dayjs().format('YYYY-MM-DD'),
  );

  // Quick jump actions
  const setToday = () => {
    setSelectedDate(dayjs().format('YYYY-MM-DD'));
  };

  const setLastSunday = () => {
    const today = dayjs();
    const dayOfWeek = today.day();
    const lastSun = dayOfWeek === 0 ? today : today.subtract(dayOfWeek, 'day');
    setSelectedDate(lastSun.format('YYYY-MM-DD'));
  };

  // Fetch all active campus meetings
  const { data: rawMeetings = [], isLoading: isLoadingMeetings } =
    useGetChurchMeetingsQuery(
      effectiveCampusId ? { churchCampusId: effectiveCampusId } : undefined,
      { skip: !effectiveCampusId },
    );

  // Fetch calendar meeting instances for the exact selected date
  const {
    data: calendarMeetings = [],
    isLoading: isLoadingCalendar,
    refetch: refetchCalendar,
  } = useGetCalendarMeetingsQuery(
    {
      churchCampusId: effectiveCampusId || '',
      ministryId: activeMinistryId || undefined,
      from: selectedDate,
      to: selectedDate,
    },
    { skip: !effectiveCampusId || !selectedDate },
  );

  // Available meetings on the selected date
  const availableMeetings = useMemo(() => {
    if (!effectiveCampusId) return [];

    const selectedDayEnum = DAYJS_TO_DAYS[dayjs(selectedDate).day()];

    // Map calendar meetings by meeting ID
    const calMap = new Map<string, (typeof calendarMeetings)[0]>();
    calendarMeetings.forEach((cm) => {
      if (cm?.meeting?.id) calMap.set(cm.meeting.id, cm);
    });

    // Valid campus meetings that occur on this day of week
    const dayMeetings = rawMeetings.filter((m) => {
      if (m.state && m.state === ChurchMeetingStateEnum.DELETED) return false;
      return m.day === selectedDayEnum;
    });

    return dayMeetings.map((meeting) => {
      const calInstance = calMap.get(meeting.id);
      return {
        id: meeting.id,
        name: meeting.name,
        initialHour: meeting.initialHour,
        finalHour: meeting.finalHour,
        day: meeting.day,
        isCancelled: calInstance?.isCancelled ?? false,
        scheduledGroupIds: calInstance?.scheduledGroupIds || [],
        scheduledGroups: calInstance?.scheduledGroups || [],
      };
    });
  }, [effectiveCampusId, rawMeetings, calendarMeetings, selectedDate]);

  // Selected meeting ID state
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('');

  // Auto-sync selectedMeetingId when availableMeetings change
  useEffect(() => {
    if (availableMeetings.length > 0) {
      const exists = availableMeetings.some((m) => m.id === selectedMeetingId);
      if (!exists) {
        setSelectedMeetingId(availableMeetings[0].id);
      }
    } else {
      setSelectedMeetingId('');
    }
  }, [availableMeetings, selectedMeetingId]);

  const activeMeeting = useMemo(() => {
    return availableMeetings.find((m) => m.id === selectedMeetingId);
  }, [availableMeetings, selectedMeetingId]);

  const scheduledGroupIds = useMemo(() => {
    return activeMeeting?.scheduledGroupIds || [];
  }, [activeMeeting]);

  const scheduledGroups: IMinistryGroupConfig[] = useMemo(() => {
    return activeMeeting?.scheduledGroups || [];
  }, [activeMeeting]);

  // Fetch active volunteer assignments for this ministry and campus
  const {
    data: assignments = [],
    isLoading: isLoadingAssignments,
    refetch: refetchAssignments,
  } = useGetVolunteerAssignmentsQuery(
    effectiveCampusId && activeMinistryId
      ? {
          churchCampusId: effectiveCampusId,
          ministryId: activeMinistryId,
          state: EntityState.ACTIVE,
        }
      : undefined,
    { skip: !effectiveCampusId || !activeMinistryId },
  );

  // Fetch recorded volunteer attendances for this meeting and date
  const {
    data: recordedAttendances = [],
    isLoading: isLoadingAttendances,
    isFetching: isFetchingAttendances,
    refetch: refetchAttendances,
  } = useGetVolunteerAttendanceQuery(
    selectedMeetingId && selectedDate
      ? {
          churchMeetingId: selectedMeetingId,
          attendanceDate: selectedDate,
          limit: 500,
        }
      : undefined,
    { skip: !selectedMeetingId || !selectedDate },
  );

  const refetchAll = () => {
    refetchCalendar();
    refetchAssignments();
    refetchAttendances();
  };

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

  // Exclude ministry general coordinators from duty attendance roll
  const eligibleAssignments = useMemo(() => {
    return assignments.filter(
      (asg) => asg.role !== VolunteerRole.MINISTRY_GENERAL_COORDINATOR,
    );
  }, [assignments]);

  // Enriched list of all volunteer attendance entries
  const enrichedVolunteers: EnrichedVolunteerAttendance[] = useMemo(() => {
    const hasAnyRecords = recordedAttendances.length > 0;

    return eligibleAssignments.map((asg) => {
      const user =
        asg.churchMember?.user ||
        asg.volunteer?.user ||
        asg.ministryVolunteer?.user ||
        asg.user;
      const firstName = user?.firstName || '';
      const lastName = user?.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim() || 'Servidor';

      const area = asg.serviceAreaGroup?.ministryArea || asg.ministryArea;
      const areaId =
        area?.id || asg.ministryAreaId || asg.serviceAreaGroupId || 'NO_AREA';
      const areaName = area?.name || 'General';

      const group =
        asg.serviceAreaGroup?.ministryGroupConfig || asg.ministryGroupConfig;
      const groupId = group?.id || asg.ministryGroupConfigId;
      const groupName = group?.name || 'Sin Grupo';

      const isScheduled =
        scheduledGroupIds.length === 0 ||
        (Boolean(groupId) && scheduledGroupIds.includes(groupId as string));

      const recorded = attendanceMap.get(asg.id);
      const attendanceStatus = recorded
        ? recorded.attendanceStatus
        : hasAnyRecords
          ? 'PENDING'
          : undefined;

      return {
        assignmentId: asg.id,
        assignment: asg,
        userId: user?.id,
        firstName,
        lastName,
        fullName,
        photoUrl: user?.photoUrl,
        role: asg.role,
        areaId,
        areaName,
        groupId,
        groupName,
        isScheduled,
        attendanceStatus,
        attendanceTakeDate: recorded?.attendanceTakeDate,
      };
    });
  }, [
    eligibleAssignments,
    scheduledGroupIds,
    attendanceMap,
    recordedAttendances,
  ]);

  // Determine whether attendance has been taken for this service/date
  const hasAttendanceRecords = recordedAttendances.length > 0;

  // Compute metrics
  const metrics = useMemo(() => {
    let totalScheduled = 0;
    let attended = 0;
    let unexcused = 0;
    let excused = 0;
    let pending = 0;

    enrichedVolunteers.forEach((v) => {
      if (v.isScheduled) {
        totalScheduled++;
      }

      if (v.attendanceStatus === VolunteerAttendanceStatus.ATTENDED) {
        attended++;
      } else if (v.attendanceStatus === VolunteerAttendanceStatus.LATE) {
        attended++;
      } else if (v.attendanceStatus === VolunteerAttendanceStatus.UNEXCUSED) {
        unexcused++;
      } else if (v.attendanceStatus === VolunteerAttendanceStatus.EXCUSED) {
        excused++;
      } else if (v.attendanceStatus === 'PENDING') {
        pending++;
      }
    });

    const attendancePercent =
      totalScheduled > 0 ? Math.round((attended / totalScheduled) * 100) : 0;

    return {
      totalScheduled,
      totalVolunteers: enrichedVolunteers.length,
      attended,
      unexcused,
      excused,
      pending,
      attendancePercent,
    };
  }, [enrichedVolunteers]);

  // Group enriched volunteers by area
  const areaBreakdown: AreaAttendanceBreakdown[] = useMemo(() => {
    const areaMap = new Map<string, AreaAttendanceBreakdown>();

    enrichedVolunteers.forEach((v) => {
      let areaEntry = areaMap.get(v.areaId);
      if (!areaEntry) {
        areaEntry = {
          areaId: v.areaId,
          areaName: v.areaName,
          total: 0,
          attended: 0,
          unexcused: 0,
          excused: 0,
          pending: 0,
          attendancePercent: 0,
          volunteers: [],
        };
        areaMap.set(v.areaId, areaEntry);
      }

      areaEntry.total++;
      areaEntry.volunteers.push(v);

      if (
        v.attendanceStatus === VolunteerAttendanceStatus.ATTENDED ||
        v.attendanceStatus === VolunteerAttendanceStatus.LATE
      ) {
        areaEntry.attended++;
      } else if (v.attendanceStatus === VolunteerAttendanceStatus.UNEXCUSED) {
        areaEntry.unexcused++;
      } else if (v.attendanceStatus === VolunteerAttendanceStatus.EXCUSED) {
        areaEntry.excused++;
      } else if (v.attendanceStatus === 'PENDING') {
        areaEntry.pending++;
      }
    });

    return Array.from(areaMap.values()).map((area) => ({
      ...area,
      attendancePercent:
        area.total > 0 ? Math.round((area.attended / area.total) * 100) : 0,
    }));
  }, [enrichedVolunteers]);

  const isLoading =
    isLoadingMeetings ||
    isLoadingCalendar ||
    isLoadingAssignments ||
    isLoadingAttendances;

  return {
    selectedDate,
    setSelectedDate,
    setToday,
    setLastSunday,
    availableMeetings,
    selectedMeetingId,
    setSelectedMeetingId,
    activeMeeting,
    scheduledGroupIds,
    scheduledGroups,
    hasAttendanceRecords,
    enrichedVolunteers,
    areaBreakdown,
    metrics,
    isLoading,
    isFetching: isFetchingAttendances,
    refetch: refetchAll,
    activeMinistry: {
      id: activeMinistryId,
      name: activeMinistryName,
      type: activeMinistryType,
    },
    availableMinistriesCount: availableMinistries.length,
    isMinistryModalOpen,
    setIsMinistryModalOpen,
  };
};

export default useMinistryServiceAttendance;
