import { DATE_FORMAT_DISPLAY } from '@/libs/common-types/constants';
import { usePermissions } from '@/libs/hooks/usePermissions';
import {
  AttendanceMatrixTimeframe,
  IMatrixEventColumn,
  IMatrixVolunteerRosterItem,
  IMinistry,
  MatrixRiskLevel,
} from '@/libs/models';
import {
  useGetMinistriesQuery,
  useGetMinistryAttendanceMatrixQuery,
  useGetMinistryWorkspaceOverviewQuery,
} from '@/libs/state/redux/api/churchApi';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { setActiveMinistry } from '@/libs/state/redux/slices/church/volunteerContext.slice';
import { formatPersonFullName, formatPersonShortName } from '@/libs/utils/text';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import {
  RiskFilterOption,
  SortByOption,
} from '../components/AttendanceMatrixFilters';

/**
 * Custom hook orchestrating early intervention attendance matrix data,
 * filters, search, sorting, and CSV export.
 *
 * @returns {object} Query state, processed matrix data, active filters, and handler callbacks.
 */
export const useMinistryAttendanceMatrix = () => {
  const dispatch = useAppDispatch();
  const { isAdmin } = usePermissions();
  const currentUser = useAppSelector((state) => state.authSlice.user);

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

  // Filter States
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('ALL');
  const [timeframe, setTimeframe] = useState<AttendanceMatrixTimeframe>(
    AttendanceMatrixTimeframe.LAST_6,
  );
  const [riskFilter, setRiskFilter] = useState<RiskFilterOption>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortByOption>('UNEXCUSED_DESC');

  // Modal for Unlink / Dar de baja
  const [isUnlinkModalOpen, setIsUnlinkModalOpen] = useState<boolean>(false);
  const [volunteerToUnlink, setVolunteerToUnlink] =
    useState<IMatrixVolunteerRosterItem | null>(null);

  const handleOpenUnlinkModal = (volunteer: IMatrixVolunteerRosterItem) => {
    setVolunteerToUnlink(volunteer);
    setIsUnlinkModalOpen(true);
  };

  const handleCloseUnlinkModal = () => {
    setVolunteerToUnlink(null);
    setIsUnlinkModalOpen(false);
  };

  // Fetch workspace overview for immediate structure resolution
  const { data: workspaceOverview } = useGetMinistryWorkspaceOverviewQuery(
    activeMinistryId && effectiveCampusId
      ? { ministryId: activeMinistryId, churchCampusId: effectiveCampusId }
      : ({} as any),
    { skip: !activeMinistryId || !effectiveCampusId },
  );

  // Query Backend Matrix Endpoint
  const {
    data: matrixData,
    isLoading,
    isFetching,
    refetch,
  } = useGetMinistryAttendanceMatrixQuery(
    activeMinistryId && effectiveCampusId
      ? {
          ministryId: activeMinistryId,
          churchCampusId: effectiveCampusId,
          ministryAreaId: selectedAreaId !== 'ALL' ? selectedAreaId : undefined,
          ministryGroupConfigId: selectedGroupId || undefined,
          timeframe,
        }
      : ({} as any),
    {
      skip: !activeMinistryId || !effectiveCampusId,
    },
  );

  // Available Groups & Areas extracted from matrix response or workspace overview
  const availableGroups = useMemo(() => {
    if (matrixData?.availableGroups && matrixData.availableGroups.length > 0) {
      return matrixData.availableGroups;
    }
    if (workspaceOverview?.groups && workspaceOverview.groups.length > 0) {
      return workspaceOverview.groups.map(
        (g: { id: string; name: string }) => ({
          id: g.id,
          name: g.name,
        }),
      );
    }
    return [];
  }, [matrixData?.availableGroups, workspaceOverview?.groups]);

  const availableAreas = useMemo(() => {
    if (matrixData?.availableAreas && matrixData.availableAreas.length > 0) {
      return matrixData.availableAreas;
    }
    if (workspaceOverview?.areas && workspaceOverview.areas.length > 0) {
      return workspaceOverview.areas.map((a: { id: string; name: string }) => ({
        id: a.id,
        name: a.name,
      }));
    }
    return [];
  }, [matrixData?.availableAreas, workspaceOverview?.areas]);

  // Keep selectedGroupId synchronized with active groups
  useEffect(() => {
    if (availableGroups.length > 0) {
      const isGroupValid = availableGroups.some(
        (g: { id: string; name: string }) => g.id === selectedGroupId,
      );
      if (!selectedGroupId || !isGroupValid) {
        setSelectedGroupId(
          matrixData?.selectedGroupId || availableGroups[0].id,
        );
      }
    }
  }, [selectedGroupId, availableGroups, matrixData?.selectedGroupId]);

  // Reset selectedGroupId on ministry change
  useEffect(() => {
    setSelectedGroupId('');
  }, [activeMinistryId]);

  // Risk Counts based on active search
  const riskCounts = useMemo(() => {
    const rawRoster = matrixData?.roster || [];
    let critical = 0;
    let alert = 0;
    let regular = 0;
    let optimal = 0;

    for (const v of rawRoster) {
      if (v.riskLevel === MatrixRiskLevel.CRITICAL) critical++;
      else if (v.riskLevel === MatrixRiskLevel.ALERT) alert++;
      else if (v.riskLevel === MatrixRiskLevel.REGULAR) regular++;
      else if (v.riskLevel === MatrixRiskLevel.OPTIMAL) optimal++;
    }

    return {
      all: rawRoster.length,
      critical,
      alert,
      regular,
      optimal,
    };
  }, [matrixData?.roster]);

  // Filtered & Sorted Roster with normalized Title Case names
  const processedRoster = useMemo(() => {
    const rawRoster = (matrixData?.roster || []).map((v) => ({
      ...v,
      fullName:
        formatPersonFullName(v.firstName, v.lastName) ||
        formatPersonFullName(v.fullName),
    }));

    // Filter by Risk
    let filtered: IMatrixVolunteerRosterItem[] = rawRoster;
    if (riskFilter !== 'ALL') {
      filtered = filtered.filter(
        (v: IMatrixVolunteerRosterItem) => v.riskLevel === riskFilter,
      );
    }

    // Filter by Search Term
    if (searchTerm.trim()) {
      const query = searchTerm.trim().toLowerCase();
      filtered = filtered.filter((v: IMatrixVolunteerRosterItem) =>
        v.fullName.toLowerCase().includes(query),
      );
    }

    // Sort
    return [...filtered].sort(
      (a: IMatrixVolunteerRosterItem, b: IMatrixVolunteerRosterItem) => {
        switch (sortBy) {
          case 'UNEXCUSED_ASC':
            return a.unexcusedCount - b.unexcusedCount;
          case 'RATE_ASC':
            return a.attendanceRate - b.attendanceRate;
          case 'RATE_DESC':
            return b.attendanceRate - a.attendanceRate;
          case 'NAME_ASC':
            return a.fullName.localeCompare(b.fullName);
          case 'UNEXCUSED_DESC':
          default:
            if (b.unexcusedCount !== a.unexcusedCount) {
              return b.unexcusedCount - a.unexcusedCount;
            }
            if (a.attendanceRate !== b.attendanceRate) {
              return a.attendanceRate - b.attendanceRate;
            }
            return a.fullName.localeCompare(b.fullName);
        }
      },
    );
  }, [matrixData?.roster, riskFilter, searchTerm, sortBy]);

  // CSV Export utility
  const exportMatrixToCsv = () => {
    if (!matrixData || matrixData.roster.length === 0) return;

    const events: IMatrixEventColumn[] = matrixData.events || [];
    const eventHeaders = events.map(
      (ev: IMatrixEventColumn) =>
        `"${dayjs(ev.date).format(DATE_FORMAT_DISPLAY)} - ${ev.meetingName}"`,
    );

    const headers = [
      '"Servidor"',
      '"Teléfono"',
      '"Área"',
      '"Grupo"',
      '"Tasa (%)"',
      '"Estado de Riesgo"',
      '"Faltas Sin Justificar"',
      '"Faltas Justificadas"',
      '"Asistencias"',
      ...eventHeaders,
    ];

    const rows = processedRoster.map((v: IMatrixVolunteerRosterItem) => {
      const eventStatuses = events.map((ev: IMatrixEventColumn) => {
        const cell = v.matrix[`${ev.date}_${ev.id}`];
        if (!cell) return '"No Convocado"';
        switch (cell.status) {
          case 'ATTENDED':
            return '"Asistió"';
          case 'EXCUSED':
            return `"${cell.observation ? `Con Excusa: ${cell.observation}` : 'Con Excusa'}"`;
          case 'UNEXCUSED':
            return '"Sin Excusa"';
          case 'EXEMPT':
            return '"Exento"';
          case 'NOT_SCHEDULED':
          default:
            return '"No Convocado"';
        }
      });

      return [
        `"${v.fullName}"`,
        `"${v.phone ? `${v.dialCodePhone || ''} ${v.phone}` : ''}"`,
        `"${v.areaName}"`,
        `"${v.groupName}"`,
        `"${v.attendanceRate}%"`,
        `"${v.riskLevel}"`,
        v.unexcusedCount,
        v.excusedCount,
        v.attendedCount,
        ...eventStatuses,
      ].join(',');
    });

    // Add UTF-8 BOM so Excel opens Spanish accents correctly
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Matriz_Asistencia_${matrixData.ministryName.replace(/\s+/g, '_')}_${dayjs().format('YYYY-MM-DD')}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const coordinatorShortName =
    formatPersonShortName(currentUser?.firstName, currentUser?.lastName) ||
    'Coordinación';

  return {
    effectiveCampusId,
    activeMinistryId,
    activeMinistryName: matrixData?.ministryName || activeMinistryName,
    activeMinistryType,
    availableMinistriesCount: availableMinistries.length,
    isMinistryModalOpen,
    setIsMinistryModalOpen,
    matrixData,
    events: matrixData?.events || [],
    kpis: matrixData?.kpis || {
      globalAttendanceRate: 0,
      targetAttendanceRate: 90,
      criticalRiskCount: 0,
      criticalVolunteers: [],
      totalUnexcused: 0,
      unexcusedImpactPercent: 0,
      perfectAttendanceRate: 0,
      perfectAttendanceCount: 0,
      totalVolunteers: 0,
    },
    roster: processedRoster,
    totalRecords: processedRoster.length,
    selectedGroupId,
    setSelectedGroupId,
    availableGroups,
    selectedAreaId,
    setSelectedAreaId,
    availableAreas,
    timeframe,
    setTimeframe,
    riskFilter,
    setRiskFilter,
    riskCounts,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    isUnlinkModalOpen,
    volunteerToUnlink,
    handleOpenUnlinkModal,
    handleCloseUnlinkModal,
    isLoading,
    isFetching,
    refetch,
    exportMatrixToCsv,
    coordinatorShortName,
  };
};

export default useMinistryAttendanceMatrix;
