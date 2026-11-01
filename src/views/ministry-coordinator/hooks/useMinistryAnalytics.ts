import { TemporalFilterValue } from '@/components/ui/TemporalFilterSelector';
import { Days } from '@/libs/common-types/constants/days';
import { usePermissions } from '@/libs/hooks/usePermissions';
import { ChurchMeetingStateEnum } from '@/libs/models/Church';
import { IMinistry } from '@/libs/models/Ministry';
import {
  useGetChurchMeetingsQuery,
  useGetChurchMeetingTagsQuery,
  useGetMinistriesQuery,
  useGetMinistryAnalyticsQuery,
} from '@/libs/state/redux/api/churchApi';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { setActiveMinistry } from '@/libs/state/redux/slices/church/volunteerContext.slice';
import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';

const DAYJS_TO_DAYS: Record<number, Days> = {
  0: Days.SUNDAY,
  1: Days.MONDAY,
  2: Days.TUESDAY,
  3: Days.WEDNESDAY,
  4: Days.THURSDAY,
  5: Days.FRIDAY,
  6: Days.SATURDAY,
};

/**
 * Resolves the unique set of Days (enum) falling within a [from, to] date range.
 *
 * @param {string} [from] - Start date in YYYY-MM-DD.
 * @param {string} [to] - End date in YYYY-MM-DD.
 * @returns {Set<Days>} Set of Days falling in the range.
 */
export const getDaysInRange = (from?: string, to?: string): Set<Days> => {
  const daysSet = new Set<Days>();
  if (!from) return daysSet;

  const startDate = dayjs(from);
  const endDate = to ? dayjs(to) : startDate;

  // If the range spans 6 or more days, all 7 days of the week are covered
  if (endDate.diff(startDate, 'day') >= 6) {
    return new Set(Object.values(Days));
  }

  let curr = startDate;
  while (curr.isBefore(endDate) || curr.isSame(endDate, 'day')) {
    const dayEnum = DAYJS_TO_DAYS[curr.day()];
    if (dayEnum) daysSet.add(dayEnum);
    curr = curr.add(1, 'day');
  }

  return daysSet;
};

/**
 * Custom hook orchestrating ministry coordinator analytics state, campus resolution,
 * temporal filtering, multi-service selection, and data querying.
 *
 * @returns {object} Analytics query results, active filters, available meetings, and control functions.
 */
export const useMinistryAnalytics = () => {
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

  // Fetch campus ministries to resolve available ministries and types
  const { data: campusMinistries = [] } = useGetMinistriesQuery(
    effectiveCampusId ? { churchCampusId: effectiveCampusId } : undefined,
    { skip: !effectiveCampusId },
  );

  // Determine all available ministries for the current coordinator in this campus
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

  // Auto-select ministry if only 1 is available, or open modal if > 1 and none selected
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
    } else if (availableMinistries.length > 1) {
      const isCurrentValid = availableMinistries.some(
        (m: { id: string }) => m.id === activeMinistryId,
      );
      if (!isCurrentValid) {
        setIsMinistryModalOpen(true);
      }
    }
  }, [availableMinistries, activeMinistryId, dispatch]);

  // Temporal filter state (defaults to LAST_7_DAYS)
  const [temporalFilter, setTemporalFilter] = useState<TemporalFilterValue>(
    () => {
      const today = dayjs();
      return {
        preset: 'LAST_7_DAYS',
        from: today.subtract(6, 'day').format('YYYY-MM-DD'),
        to: today.format('YYYY-MM-DD'),
        label: 'Últimos 7 días',
      };
    },
  );

  // Selected meeting IDs filter (empty array means all meetings / panoramic)
  const [selectedMeetingIds, setSelectedMeetingIds] = useState<string[]>([]);
  // Selected event tag ID filter (empty string means all tags)
  const [selectedTagId, setSelectedTagId] = useState<string>('');

  // Fetch church meetings for active campus
  const { data: rawMeetings = [] } = useGetChurchMeetingsQuery(
    effectiveCampusId ? { churchCampusId: effectiveCampusId } : undefined,
    { skip: !effectiveCampusId },
  );

  // Fetch active tags for active campus
  const { data: availableTags = [] } = useGetChurchMeetingTagsQuery(
    effectiveCampusId
      ? { churchCampusId: effectiveCampusId, suggestionsOnly: false }
      : { churchCampusId: '' },
    { skip: !effectiveCampusId },
  );

  // Filter meetings strictly by the selected day, date range, or event tag
  const filteredMeetings = useMemo(() => {
    if (!rawMeetings || rawMeetings.length === 0) return [];

    const daysInRange = getDaysInRange(temporalFilter.from, temporalFilter.to);

    return rawMeetings.filter((meeting) => {
      // Exclude only soft-deleted meetings (disabled/archived meetings remain valid for historical stats)
      if (meeting.state && meeting.state === ChurchMeetingStateEnum.DELETED) {
        return false;
      }
      if (selectedTagId && meeting.tagId !== selectedTagId) {
        return false;
      }
      if (daysInRange.size === 0) return true;
      return meeting.day ? daysInRange.has(meeting.day) : true;
    });
  }, [rawMeetings, temporalFilter.from, temporalFilter.to, selectedTagId]);

  const wasAutoSelectedRef = useRef(false);

  // Auto-select single meeting when exactly 1 meeting is available, and clean up stale selections
  useEffect(() => {
    if (filteredMeetings.length === 1) {
      const singleId = filteredMeetings[0].id;
      if (
        selectedMeetingIds.length !== 1 ||
        selectedMeetingIds[0] !== singleId
      ) {
        wasAutoSelectedRef.current = true;
        setSelectedMeetingIds([singleId]);
      }
    } else if (filteredMeetings.length > 1) {
      if (wasAutoSelectedRef.current) {
        wasAutoSelectedRef.current = false;
        setSelectedMeetingIds([]);
      } else if (selectedMeetingIds.length > 0) {
        const valid = selectedMeetingIds.filter((id) =>
          filteredMeetings.some((m) => m.id === id),
        );
        if (valid.length !== selectedMeetingIds.length) {
          setSelectedMeetingIds(valid);
        }
      }
    } else {
      wasAutoSelectedRef.current = false;
    }
  }, [filteredMeetings, selectedMeetingIds]);

  const hasMeetingsForSelection = filteredMeetings.length > 0;

  // Check if current date selection is today
  const isSelectionToday = useMemo(() => {
    if (!temporalFilter.from) return false;
    const todayStr = dayjs().format('YYYY-MM-DD');
    return temporalFilter.from === todayStr && temporalFilter.to === todayStr;
  }, [temporalFilter.from, temporalFilter.to]);

  // Check if any meeting today is currently within its operational schedule (initialHour to finalHour + 30m)
  const isMeetingCurrentlyInProgress = useMemo(() => {
    if (!isSelectionToday || filteredMeetings.length === 0) return false;
    const nowTime = dayjs().format('HH:mm:ss');
    return filteredMeetings.some((m) => {
      if (!m.initialHour) return false;
      const start = m.initialHour;
      const end = m.finalHour
        ? dayjs(`2000-01-01 ${m.finalHour}`)
            .add(30, 'minute')
            .format('HH:mm:ss')
        : '23:59:59';
      return nowTime >= start && nowTime <= end;
    });
  }, [isSelectionToday, filteredMeetings]);

  // Fetch ministry analytics via churchApi
  const effectiveMinistryId =
    activeMinistryId || (availableMinistries[0]?.id ?? '');

  const {
    data: analyticsData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetMinistryAnalyticsQuery(
    {
      id: effectiveMinistryId,
      churchCampusId: effectiveCampusId,
      from: temporalFilter.from,
      to: temporalFilter.to,
      churchMeetingIds:
        selectedMeetingIds.length > 0 ? selectedMeetingIds : undefined,
      tagId: selectedTagId || undefined,
    },
    {
      skip:
        !effectiveMinistryId || !effectiveCampusId || !hasMeetingsForSelection,
    },
  );

  const activeMinistry = useMemo(() => {
    if (!effectiveMinistryId) return null;
    const found = availableMinistries.find(
      (m: { id: string }) => m.id === effectiveMinistryId,
    );
    return {
      id: effectiveMinistryId,
      name: found?.name || activeMinistryName || 'Ministerio',
      type: found?.type || activeMinistryType || 'GENERAL',
    };
  }, [
    effectiveMinistryId,
    availableMinistries,
    activeMinistryName,
    activeMinistryType,
  ]);

  // Exact service dates that have historical statistics in DB
  const allowedDates = analyticsData?.availableDates;

  // Allowed days of the week based on campus church meetings and historical dates
  const allowedDaysOfWeek = useMemo(() => {
    const days = new Set<number>();

    if (rawMeetings && rawMeetings.length > 0) {
      rawMeetings.forEach((m) => {
        if (m.state && m.state === ChurchMeetingStateEnum.DELETED) return;
        if (selectedTagId && m.tagId !== selectedTagId) return;
        if (m.day) {
          const found = Object.entries(DAYJS_TO_DAYS).find(
            ([, v]) => v === m.day,
          );
          if (found) {
            days.add(Number(found[0]));
          }
        }
      });
    }

    if (allowedDates && allowedDates.length > 0) {
      allowedDates.forEach((dateStr) => {
        const d = dayjs(dateStr);
        if (d.isValid()) {
          days.add(d.day());
        }
      });
    }

    return days.size > 0 ? Array.from(days) : undefined;
  }, [rawMeetings, selectedTagId, allowedDates]);

  return {
    data: analyticsData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    activeMinistry,
    availableMinistries,
    availableMinistriesCount: availableMinistries.length,
    temporalFilter,
    setTemporalFilter,
    selectedMeetingIds,
    setSelectedMeetingIds,
    selectedTagId,
    setSelectedTagId,
    availableTags,
    allowedDaysOfWeek,
    allowedDates,
    meetings: filteredMeetings,
    rawMeetings,
    hasMeetingsForSelection,
    isMeetingCurrentlyInProgress,
    isMinistryModalOpen,
    setIsMinistryModalOpen,
  };
};

export default useMinistryAnalytics;
