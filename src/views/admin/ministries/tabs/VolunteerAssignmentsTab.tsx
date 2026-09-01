import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Crown,
  Layers,
  Users,
  ShieldCheck,
  Plus,
  Trash2,
  MapPin,
  Inbox,
  User as UserIcon,
  AlertCircle,
  ChevronDown,
  ChevronsDown,
  ChevronsUp,
  Sparkles,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import SelectSearch from '@/components/ui/SelectSearch';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { CellListSkeleton } from '@/components/ui/DetailSkeleton';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetChurchCampuses } from '@/libs/state/redux/thunks/church/church.thunk';
import {
  DeleteVolunteerAssignment,
  GetVolunteerAssignments,
  GetVolunteers,
} from '@/libs/state/redux/thunks/church/volunteer.thunk';
import { GetServiceAreaGroups } from '@/libs/state/redux/thunks/church/ministry.thunk';
import {
  IServiceAreaGroup,
  IVolunteerAssignment,
  VolunteerRole,
} from '@/libs/models';
import AssignVolunteerDrawer from '../components/AssignVolunteerDrawer';
import TeamRosterDrawer from '../components/TeamRosterDrawer';
import { toast } from 'sonner';
import clsx from 'clsx';

interface VolunteerAssignmentsTabProps {
  ministryId: string;
  churchCampusId?: string;
}

type SubTabType = 'leadership' | 'teams';

const ROLE_LABEL_SHORT: Record<VolunteerRole, string> = {
  [VolunteerRole.MINISTRY_GENERAL_COORDINATOR]: 'Coord. General',
  [VolunteerRole.AREA_GENERAL_COORDINATOR]: 'Coord. Área',
  [VolunteerRole.GROUP_COORDINATOR]: 'Coord. Grupo',
  [VolunteerRole.SUPERVISOR]: 'Supervisor',
  [VolunteerRole.VOLUNTEER]: 'Servidor',
};

/**
 * Scalable Tab component managing volunteer assignments, team rosters,
 * leadership hierarchy, and a dedicated searchable ministry directory.
 *
 * @param {VolunteerAssignmentsTabProps} props - Component properties.
 * @returns {JSX.Element} The rendered assignments management view.
 */
export const VolunteerAssignmentsTab: React.FC<VolunteerAssignmentsTabProps> = ({
  ministryId,
  churchCampusId,
}) => {
  const dispatch = useAppDispatch();

  const campusesState = useAppSelector((state) => state.churchCampusSlice);
  const { areasByMinistry, groupsByMinistry, serviceAreaGroups } = useAppSelector(
    (state) => state.ministrySlice,
  );
  const {
    volunteers: { data: volunteersList },
    assignments,
    assignmentsByPartition,
    loadingByPartition,
  } = useAppSelector((state) => state.volunteerSlice);

  // Sub-tab navigation
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('teams');

  // Collapsible areas state (closed by default)
  const [expandedAreaIds, setExpandedAreaIds] = useState<Set<string>>(new Set());

  // Campus selection
  const [selectedCampusId, setSelectedCampusId] = useState<string>('');

  // Drawers & Modals
  const [assignDrawerOpen, setAssignDrawerOpen] = useState(false);
  const [assignDefaultRole, setAssignDefaultRole] = useState<VolunteerRole | undefined>(undefined);
  const [assignDefaultTeamId, setAssignDefaultTeamId] = useState<string | undefined>(undefined);

  const [selectedRosterTeam, setSelectedRosterTeam] = useState<IServiceAreaGroup | null>(null);
  const [rosterDrawerOpen, setRosterDrawerOpen] = useState(false);

  const [assignmentToDelete, setAssignmentToDelete] = useState<IVolunteerAssignment | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const areas = areasByMinistry[ministryId] || [];
  const groups = groupsByMinistry[ministryId] || [];
  const campuses = campusesState.data;

  // Partition Keys
  const ministryCoordsKey = `ministry_coords_${ministryId}`;
  const areaCoordsKey = `area_coords_${ministryId}`;
  const groupCoordsKey = `group_coords_${ministryId}`;
  const campusTeamsKey = `campus_teams_${ministryId}_${selectedCampusId}`;

  // Partition loading states
  const loadingMinistryCoords = loadingByPartition[ministryCoordsKey] ?? false;
  const loadingAreaCoords = loadingByPartition[areaCoordsKey] ?? false;
  const loadingGroupCoords = loadingByPartition[groupCoordsKey] ?? false;
  const loadingCampusTeams = loadingByPartition[campusTeamsKey] ?? false;

  // Toggle single area collapsed/expanded
  const toggleAreaExpanded = useCallback((areaId: string) => {
    setExpandedAreaIds((prev) => {
      const next = new Set(prev);
      if (next.has(areaId)) {
        next.delete(areaId);
      } else {
        next.add(areaId);
      }
      return next;
    });
  }, []);

  // Initial metadata and partitioned hierarchy queries
  useEffect(() => {
    if (campuses.length === 0) {
      dispatch(GetChurchCampuses());
    }

    // 1. Coordinadores Generales
    dispatch(
      GetVolunteerAssignments({
        ministryId,
        role: VolunteerRole.MINISTRY_GENERAL_COORDINATOR,
        partitionKey: ministryCoordsKey,
        force: false,
      }),
    );

    // 2. Coordinadores Generales de Área
    dispatch(
      GetVolunteerAssignments({
        ministryId,
        role: VolunteerRole.AREA_GENERAL_COORDINATOR,
        partitionKey: areaCoordsKey,
        force: false,
      }),
    );

    // 3. Coordinadores de Grupo
    dispatch(
      GetVolunteerAssignments({
        ministryId,
        role: VolunteerRole.GROUP_COORDINATOR,
        partitionKey: groupCoordsKey,
        force: false,
      }),
    );
  }, [dispatch, ministryId, campuses.length, ministryCoordsKey, areaCoordsKey, groupCoordsKey]);

  // Background preload volunteers list for name & photo resolution
  useEffect(() => {
    dispatch(GetVolunteers({ ministryId, limit: 100, force: false }));
  }, [dispatch, ministryId]);

  // Set default campus
  useEffect(() => {
    if (churchCampusId) {
      setSelectedCampusId(churchCampusId);
    } else if (!selectedCampusId && campuses.length > 0) {
      setSelectedCampusId(campuses[0].id);
    }
  }, [churchCampusId, campuses, selectedCampusId]);

  // Query campus teams assignments
  useEffect(() => {
    if (selectedCampusId) {
      dispatch(
        GetVolunteerAssignments({
          ministryId,
          churchCampusId: selectedCampusId,
          partitionKey: `campus_teams_${ministryId}_${selectedCampusId}`,
          force: false,
        }),
      );
    }
  }, [dispatch, ministryId, selectedCampusId]);

  // Service Area Groups query
  useEffect(() => {
    if (areas.length > 0) {
      areas.forEach((area) => {
        dispatch(GetServiceAreaGroups({ ministryAreaId: area.id }));
      });
    }
  }, [dispatch, areas]);

  const campusOptions = useMemo(() => {
    return campuses.map((c) => ({
      id: c.id,
      name: c.name,
    }));
  }, [campuses]);

  // Section 1: Coordinadores Generales de Ministerio
  const ministryCoordinators = useMemo(() => {
    const partitioned = assignmentsByPartition[ministryCoordsKey];
    if (partitioned) return partitioned;
    return assignments.filter(
      (a) =>
        a.role === VolunteerRole.MINISTRY_GENERAL_COORDINATOR &&
        (a.ministryId === ministryId || !a.ministryId),
    );
  }, [assignmentsByPartition, ministryCoordsKey, assignments, ministryId]);

  // Section 2: Coordinadores Generales de Área
  const areaCoordinatorsByAreaId = useMemo(() => {
    const source = assignmentsByPartition[areaCoordsKey] || assignments;
    const map: Record<string, IVolunteerAssignment[]> = {};
    areas.forEach((a) => {
      map[a.id] = source.filter(
        (asg) =>
          asg.role === VolunteerRole.AREA_GENERAL_COORDINATOR && asg.ministryAreaId === a.id,
      );
    });
    return map;
  }, [assignmentsByPartition, areaCoordsKey, assignments, areas]);

  // Section 3: Coordinadores de Grupo
  const groupCoordinatorsByGroupId = useMemo(() => {
    const source = assignmentsByPartition[groupCoordsKey] || assignments;
    const map: Record<string, IVolunteerAssignment[]> = {};
    groups.forEach((g) => {
      map[g.id] = source.filter(
        (asg) =>
          asg.role === VolunteerRole.GROUP_COORDINATOR && asg.ministryGroupConfigId === g.id,
      );
    });
    return map;
  }, [assignmentsByPartition, groupCoordsKey, assignments, groups]);

  // Section 4: Equipos por Sede (ServiceAreaGroups)
  const currentCampusTeams = useMemo(() => {
    const areaIdSet = new Set(areas.map((a) => a.id));
    return serviceAreaGroups.filter(
      (sag) => sag.churchCampusId === selectedCampusId && areaIdSet.has(sag.ministryAreaId),
    );
  }, [serviceAreaGroups, selectedCampusId, areas]);

  const campusTeamAssignments = useMemo(() => {
    return assignmentsByPartition[campusTeamsKey] || assignments;
  }, [assignmentsByPartition, campusTeamsKey, assignments]);

  // Group current campus teams by Area
  const teamsByArea = useMemo(() => {
    const map: Array<{
      area: (typeof areas)[0];
      teams: IServiceAreaGroup[];
    }> = [];

    areas.forEach((area) => {
      const matchingTeams = currentCampusTeams.filter((t) => t.ministryAreaId === area.id);
      if (matchingTeams.length > 0) {
        map.push({ area, teams: matchingTeams });
      }
    });

    // Also include leftover teams for areas not in areas list
    const registeredAreaIds = new Set(areas.map((a) => a.id));
    const leftoverTeams = currentCampusTeams.filter((t) => !registeredAreaIds.has(t.ministryAreaId));
    if (leftoverTeams.length > 0) {
      map.push({
        area: {
          id: 'other',
          name: 'Otras Áreas',
          ministryId,
          active: true,
        },
        teams: leftoverTeams,
      });
    }

    return map;
  }, [areas, currentCampusTeams, ministryId]);

  const isAllAreasExpanded = useMemo(() => {
    return teamsByArea.length > 0 && expandedAreaIds.size >= teamsByArea.length;
  }, [teamsByArea.length, expandedAreaIds.size]);

  const handleToggleAllAreas = useCallback(() => {
    if (isAllAreasExpanded) {
      setExpandedAreaIds(new Set());
    } else {
      setExpandedAreaIds(new Set(teamsByArea.map(({ area }) => area.id)));
    }
  }, [isAllAreasExpanded, teamsByArea]);

  // Executive KPIs
  const totalCoordinators = useMemo(() => {
    const areaCoordsCount = Object.values(areaCoordinatorsByAreaId).reduce(
      (acc, list) => acc + list.length,
      0,
    );
    const groupCoordsCount = Object.values(groupCoordinatorsByGroupId).reduce(
      (acc, list) => acc + list.length,
      0,
    );
    return ministryCoordinators.length + areaCoordsCount + groupCoordsCount;
  }, [ministryCoordinators, areaCoordinatorsByAreaId, groupCoordinatorsByGroupId]);

  const teamsWithSupervisorCount = useMemo(() => {
    return currentCampusTeams.filter((team) =>
      campusTeamAssignments.some(
        (a) => a.serviceAreaGroupId === team.id && a.role === VolunteerRole.SUPERVISOR,
      ),
    ).length;
  }, [currentCampusTeams, campusTeamAssignments]);

  const totalVolunteersInCampusTeams = useMemo(() => {
    return campusTeamAssignments.filter(
      (a) => a.role === VolunteerRole.VOLUNTEER || a.role === VolunteerRole.SUPERVISOR,
    ).length;
  }, [campusTeamAssignments]);

  const handleOpenAssignDrawer = (role?: VolunteerRole, serviceAreaGroupId?: string) => {
    setAssignDefaultRole(role);
    setAssignDefaultTeamId(serviceAreaGroupId);
    setAssignDrawerOpen(true);
  };

  const handleOpenRosterDrawer = (team: IServiceAreaGroup) => {
    setSelectedRosterTeam(team);
    setRosterDrawerOpen(true);
  };

  const handleOpenDeleteConfirm = (asg: IVolunteerAssignment) => {
    setAssignmentToDelete(asg);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!assignmentToDelete) return;
    try {
      const deletedRole = assignmentToDelete.role;
      await dispatch(DeleteVolunteerAssignment({ id: assignmentToDelete.id })).unwrap();
      toast.success('Asignación eliminada exitosamente');
      setAssignmentToDelete(null);

      // Re-fetch only affected partition
      if (deletedRole === VolunteerRole.MINISTRY_GENERAL_COORDINATOR) {
        dispatch(
          GetVolunteerAssignments({
            ministryId,
            role: VolunteerRole.MINISTRY_GENERAL_COORDINATOR,
            partitionKey: ministryCoordsKey,
            force: true,
          }),
        );
      } else if (deletedRole === VolunteerRole.AREA_GENERAL_COORDINATOR) {
        dispatch(
          GetVolunteerAssignments({
            ministryId,
            role: VolunteerRole.AREA_GENERAL_COORDINATOR,
            partitionKey: areaCoordsKey,
            force: true,
          }),
        );
      } else if (deletedRole === VolunteerRole.GROUP_COORDINATOR) {
        dispatch(
          GetVolunteerAssignments({
            ministryId,
            role: VolunteerRole.GROUP_COORDINATOR,
            partitionKey: groupCoordsKey,
            force: true,
          }),
        );
      } else if (selectedCampusId) {
        dispatch(
          GetVolunteerAssignments({
            ministryId,
            churchCampusId: selectedCampusId,
            partitionKey: campusTeamsKey,
            force: true,
          }),
        );
      }
    } catch {
      toast.error('Error al remover la asignación');
    }
  };

  const handleAssignmentSuccess = () => {
    dispatch(
      GetVolunteerAssignments({
        ministryId,
        role: VolunteerRole.MINISTRY_GENERAL_COORDINATOR,
        partitionKey: ministryCoordsKey,
        force: true,
      }),
    );
    dispatch(
      GetVolunteerAssignments({
        ministryId,
        role: VolunteerRole.AREA_GENERAL_COORDINATOR,
        partitionKey: areaCoordsKey,
        force: true,
      }),
    );
    dispatch(
      GetVolunteerAssignments({
        ministryId,
        role: VolunteerRole.GROUP_COORDINATOR,
        partitionKey: groupCoordsKey,
        force: true,
      }),
    );
    if (selectedCampusId) {
      dispatch(
        GetVolunteerAssignments({
          ministryId,
          churchCampusId: selectedCampusId,
          partitionKey: campusTeamsKey,
          force: true,
        }),
      );
    }
  };

  /**
   * Resolves the full name of a volunteer from an assignment.
   *
   * @param {IVolunteerAssignment} asg - The volunteer assignment.
   * @returns {string} The full name or fallback.
   */
  const getVolunteerName = useCallback(
    (asg: IVolunteerAssignment): string => {
      const vId = asg.volunteerId || asg.ministryVolunteerId;
      const vol =
        asg.volunteer ||
        asg.ministryVolunteer ||
        volunteersList.find(
          (v) => v.id === vId || (v.userId && v.userId === asg.volunteer?.userId),
        );
      const user = asg.volunteer?.user || vol?.user;
      return user && (user.firstName || user.lastName)
        ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
        : '';
    },
    [volunteersList],
  );

  /**
   * Sorts a list of volunteer assignments alphabetically A-Z by volunteer name.
   *
   * @param {IVolunteerAssignment[]} list - The assignments to sort.
   * @returns {IVolunteerAssignment[]} Sorted copy of assignments.
   */
  const sortAssignmentsByName = useCallback(
    (list: IVolunteerAssignment[]): IVolunteerAssignment[] => {
      return [...list].sort((a, b) => {
        const nameA = getVolunteerName(a);
        const nameB = getVolunteerName(b);
        return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
      });
    },
    [getVolunteerName],
  );

  const renderPersonItem = (asg: IVolunteerAssignment, roleLabel?: string) => {
    const name = getVolunteerName(asg) || 'Servidor asignado';
    const vId = asg.volunteerId || asg.ministryVolunteerId;
    const vol =
      asg.volunteer ||
      asg.ministryVolunteer ||
      volunteersList.find((v) => v.id === vId || (v.userId && v.userId === asg.volunteer?.userId));
    const user = asg.volunteer?.user || vol?.user;
    const nationalId = user?.nationalId;
    const photoUrl = user?.photoUrl;

    return (
      <div
        key={asg.id}
        className="flex items-center justify-between p-2.5 bg-slate-50 border border-gray-200/70 rounded-xl gap-2 hover:bg-slate-100/70 transition-all"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-600 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
            {photoUrl ? (
              <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <UserIcon size={14} />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">{name}</p>
            <p className="text-[11px] text-gray-500 truncate">
              {roleLabel ? `${roleLabel} • ` : ''}
              {nationalId ? `Doc: ${nationalId}` : 'Sin documento'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleOpenDeleteConfirm(asg)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
          title="Remover Asignación"
        >
          <Trash2 size={13} />
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* EXECUTIVE KPI SUMMARY BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 text-xs">
            <span className="font-semibold">Plantilla Sede</span>
            <Users size={15} className="text-teal-600" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-1">
            {totalVolunteersInCampusTeams}
          </p>
          <p className="text-[11px] text-gray-400">Servidores y supervisores</p>
        </div>

        <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 text-xs">
            <span className="font-semibold">Liderazgo</span>
            <Crown size={15} className="text-amber-500" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-1">
            {totalCoordinators}
          </p>
          <p className="text-[11px] text-gray-400">Coordinadores asignados</p>
        </div>

        <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 text-xs">
            <span className="font-semibold">Supervisores</span>
            <ShieldCheck size={15} className="text-indigo-600" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-1">
            {teamsWithSupervisorCount}
          </p>
          <p className="text-[11px] text-gray-400">Líderes de equipo</p>
        </div>

        <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 text-xs">
            <span className="font-semibold">Equipos</span>
            <Sparkles size={15} className="text-primary" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-1">
            {currentCampusTeams.length}
          </p>
          <p className="text-[11px] text-gray-400">
            {teamsWithSupervisorCount}/{currentCampusTeams.length || 1} con supervisor
          </p>
        </div>
      </div>

      {/* SUB-TAB SELECTOR & GLOBAL ACTION */}
      <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto sm:min-w-[320px]">
          <button
            type="button"
            onClick={() => setActiveSubTab('teams')}
            className={clsx(
              'flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer select-none',
              activeSubTab === 'teams'
                ? 'bg-white text-gray-900 shadow-2xs'
                : 'text-gray-600 hover:text-gray-900',
            )}
          >
            <ShieldCheck size={14} className={activeSubTab === 'teams' ? 'text-primary' : 'text-gray-400'} />
            <span className="truncate">Equipos ({currentCampusTeams.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('leadership')}
            className={clsx(
              'flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer select-none',
              activeSubTab === 'leadership'
                ? 'bg-white text-gray-900 shadow-2xs'
                : 'text-gray-600 hover:text-gray-900',
            )}
          >
            <Crown size={14} className={activeSubTab === 'leadership' ? 'text-amber-500' : 'text-gray-400'} />
            <span className="truncate">Liderazgo ({totalCoordinators})</span>
          </button>
        </div>

        <Button
          onClick={() => handleOpenAssignDrawer()}
          size="sm"
          className="text-xs gap-1.5 py-1.5 shrink-0"
        >
          <Plus size={14} /> Asignar Rol
        </Button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-VIEW 1: EQUIPOS Y PLANTILLAS (NIVELES 4 & 5 - ROSTERS COMPACTOS) */}
      {/* ========================================================================= */}
      {activeSubTab === 'teams' && (
        <div className="flex flex-col gap-4">
          {/* Campus Selector - only rendered if not fixed by ministry */}
          {!churchCampusId && (
            <div className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-200/80 shadow-xs flex flex-col gap-2">
              <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                <div className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                  <MapPin size={12} />
                </div>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                  Sede de los Equipos
                </h3>
              </div>
              <SelectSearch
                label=""
                placeholder="Seleccionar sede..."
                options={campusOptions}
                value={selectedCampusId}
                onChange={(val) => setSelectedCampusId(val)}
                searchable={campusOptions.length > 4}
                disabled={campusesState.loading}
              />
            </div>
          )}

          {loadingCampusTeams && assignmentsByPartition[campusTeamsKey] === undefined ? (
            <CellListSkeleton count={4} />
          ) : currentCampusTeams.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-gray-200/80 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-gray-400">
                <Inbox size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800">
                  No hay equipos configurados en esta sede
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Genera las combinaciones de Área × Grupo en la pestaña &quot;Equipos&quot; para asignar servidores.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Expand / Collapse all control */}
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-medium text-gray-500">
                  {teamsByArea.length} {teamsByArea.length === 1 ? 'área' : 'áreas'} • Haz clic para desplegar
                </p>
                <button
                  type="button"
                  onClick={handleToggleAllAreas}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer select-none py-1 px-2 rounded-lg hover:bg-primary/5"
                >
                  {isAllAreasExpanded ? (
                    <>
                      <ChevronsUp size={14} className="text-primary shrink-0" />
                      <span>Colapsar todas</span>
                    </>
                  ) : (
                    <>
                      <ChevronsDown size={14} className="text-primary shrink-0" />
                      <span>Expandir todas</span>
                    </>
                  )}
                </button>
              </div>

              {teamsByArea.map(({ area, teams }) => {
                const areaTeamIds = new Set(teams.map((t) => t.id));
                const areaTotalMembers = campusTeamAssignments.filter(
                  (a) => a.serviceAreaGroupId && areaTeamIds.has(a.serviceAreaGroupId),
                ).length;
                const isExpanded = expandedAreaIds.has(area.id);

                return (
                  <div
                    key={area.id}
                    className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden transition-all"
                  >
                    {/* Collapsible Area Header (closed by default) */}
                    <button
                      type="button"
                      onClick={() => toggleAreaExpanded(area.id)}
                      className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left hover:bg-slate-50/70 transition-colors cursor-pointer select-none"
                      aria-expanded={isExpanded}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center shrink-0">
                          <Layers size={14} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wide truncate">
                            {area.name}
                          </h3>
                          <p className="text-[11px] text-gray-500 font-medium">
                            {teams.length} {teams.length === 1 ? 'equipo' : 'equipos'} • {areaTotalMembers}{' '}
                            {areaTotalMembers === 1 ? 'miembro' : 'miembros'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-semibold text-gray-400 hidden sm:inline">
                          {isExpanded ? 'Ocultar' : 'Ver equipos'}
                        </span>
                        <div
                          className={clsx(
                            'w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 bg-slate-100 transition-transform duration-200',
                            isExpanded && 'rotate-180 text-gray-700 bg-slate-200/80',
                          )}
                        >
                          <ChevronDown size={16} />
                        </div>
                      </div>
                    </button>

                    {/* Area Teams Content (shown when expanded) */}
                    {isExpanded && (
                      <div className="p-3.5 sm:p-4 pt-0 border-t border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                          {teams.map((team) => {
                            const group =
                              groups.find((g) => g.id === team.ministryGroupConfigId) ||
                              team.ministryGroupConfig;
                            const teamAssignments = campusTeamAssignments.filter(
                              (a) => a.serviceAreaGroupId === team.id,
                            );
                            const supervisors = sortAssignmentsByName(
                              teamAssignments.filter((a) => a.role === VolunteerRole.SUPERVISOR),
                            );
                            const volunteersCount = teamAssignments.filter(
                              (a) => a.role === VolunteerRole.VOLUNTEER,
                            ).length;

                            return (
                              <div
                                key={team.id}
                                className="p-3.5 rounded-xl border border-gray-200/80 bg-slate-50/40 hover:bg-slate-50 transition-all flex flex-col justify-between gap-3"
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-extrabold text-primary">
                                      {group?.name ?? 'Grupo desconocido'}
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200/80 shrink-0">
                                      {teamAssignments.length} miembros
                                    </span>
                                  </div>

                                  {/* Supervisor Status - Shows ALL assigned supervisors sorted alphabetically */}
                                  <div className="mt-2 text-xs">
                                    {supervisors.length > 0 ? (
                                      <div className="flex flex-col gap-1">
                                        {supervisors.map((sup) => {
                                          const supervisorName =
                                            getVolunteerName(sup) || 'Supervisor asignado';

                                          return (
                                            <div
                                              key={sup.id}
                                              className="flex items-center gap-1.5 text-gray-700 font-medium truncate"
                                            >
                                              <ShieldCheck size={13} className="text-indigo-600 shrink-0" />
                                              <span className="truncate">Sup: {supervisorName}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1.5 text-amber-700 font-semibold">
                                        <AlertCircle size={13} className="shrink-0" />
                                        <span>Sin supervisor asignado</span>
                                      </div>
                                    )}
                                  </div>

                                  <p className="text-[11px] text-gray-500 mt-1">
                                    👥 {volunteersCount}{' '}
                                    {volunteersCount === 1 ? 'servidor activo' : 'servidores activos'}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 pt-2 border-t border-gray-200/60">
                                  <Button
                                    onClick={() => handleOpenRosterDrawer(team)}
                                    size="sm"
                                    variant="default"
                                    className="flex-1 text-xs py-1.5 gap-1"
                                  >
                                    <Users size={13} /> Ver Plantilla ({teamAssignments.length})
                                  </Button>
                                  <Button
                                    onClick={() => handleOpenAssignDrawer(VolunteerRole.VOLUNTEER, team.id)}
                                    size="sm"
                                    className="text-xs py-1.5 px-2.5 gap-1"
                                    title="Agregar servidor"
                                  >
                                    <Plus size={13} />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 2: LIDERAZGO Y COORDINACIÓN (NIVELES 1, 2 Y 3) */}
      {/* ========================================================================= */}
      {activeSubTab === 'leadership' && (
        <div className="flex flex-col gap-4">
          {/* LEVEL 1: COORDINACIÓN GENERAL DEL MINISTERIO */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
                  <Crown size={14} />
                </div>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                  1. Coordinación General del Ministerio
                </h3>
              </div>
              <Button
                onClick={() =>
                  handleOpenAssignDrawer(VolunteerRole.MINISTRY_GENERAL_COORDINATOR)
                }
                size="sm"
                variant="default"
                className="text-[11px] py-1 px-2.5 gap-1"
              >
                <Plus size={12} /> Asignar
              </Button>
            </div>

            {loadingMinistryCoords && ministryCoordinators.length === 0 ? (
              <CellListSkeleton count={1} />
            ) : ministryCoordinators.length === 0 ? (
              <div className="p-3 bg-slate-50 border border-dashed border-gray-200 rounded-xl text-center">
                <p className="text-xs text-gray-500">
                  Sin coordinadores generales asignados a este ministerio.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {sortAssignmentsByName(ministryCoordinators).map((c) =>
                  renderPersonItem(c, 'Coordinador General'),
                )}
              </div>
            )}
          </div>

          {/* LEVEL 2: COORDINACIÓN GENERAL DE ÁREA */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
                  <Layers size={14} />
                </div>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                  2. Coordinación General de Área
                </h3>
              </div>
              <Button
                onClick={() =>
                  handleOpenAssignDrawer(VolunteerRole.AREA_GENERAL_COORDINATOR)
                }
                size="sm"
                variant="default"
                className="text-[11px] py-1 px-2.5 gap-1"
              >
                <Plus size={12} /> Asignar
              </Button>
            </div>

            {areas.length === 0 ? (
              <p className="text-xs text-gray-500">No hay áreas de servicio configuradas.</p>
            ) : loadingAreaCoords && assignmentsByPartition[areaCoordsKey] === undefined ? (
              <CellListSkeleton count={2} />
            ) : (
              <div className="flex flex-col gap-3">
                {areas.map((area) => {
                  const assigned = areaCoordinatorsByAreaId[area.id] || [];
                  return (
                    <div
                      key={area.id}
                      className="p-3 rounded-xl border border-gray-200/80 bg-slate-50/40 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-800">{area.name}</span>
                        <span className="text-[10px] text-gray-500">
                          {assigned.length}{' '}
                          {assigned.length === 1 ? 'coordinador' : 'coordinadores'}
                        </span>
                      </div>

                      {assigned.length === 0 ? (
                        <p className="text-[11px] text-gray-400 italic">
                          Sin coordinador de área asignado.
                        </p>
                      ) : (
                        sortAssignmentsByName(assigned).map((a) =>
                          renderPersonItem(a, 'Coord. Área'),
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* LEVEL 3: COORDINACIÓN DE GRUPO */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center">
                  <Users size={14} />
                </div>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                  3. Coordinación de Grupo
                </h3>
              </div>
              <Button
                onClick={() =>
                  handleOpenAssignDrawer(VolunteerRole.GROUP_COORDINATOR)
                }
                size="sm"
                variant="default"
                className="text-[11px] py-1 px-2.5 gap-1"
              >
                <Plus size={12} /> Asignar
              </Button>
            </div>

            {groups.length === 0 ? (
              <p className="text-xs text-gray-500">No hay grupos configurados.</p>
            ) : loadingGroupCoords && assignmentsByPartition[groupCoordsKey] === undefined ? (
              <CellListSkeleton count={2} />
            ) : (
              <div className="flex flex-col gap-3">
                {groups.map((group) => {
                  const assigned = groupCoordinatorsByGroupId[group.id] || [];
                  return (
                    <div
                      key={group.id}
                      className="p-3 rounded-xl border border-gray-200/80 bg-slate-50/40 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-800">
                          {group.name} (Posición {group.position})
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {assigned.length}{' '}
                          {assigned.length === 1 ? 'coordinador' : 'coordinadores'}
                        </span>
                      </div>

                      {assigned.length === 0 ? (
                        <p className="text-[11px] text-gray-400 italic">
                          Sin coordinador de grupo asignado.
                        </p>
                      ) : (
                        sortAssignmentsByName(assigned).map((g) =>
                          renderPersonItem(g, 'Coord. Grupo'),
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TEAM ROSTER DRAWER */}
      {selectedRosterTeam && (
        <TeamRosterDrawer
          open={rosterDrawerOpen}
          onOpenChange={setRosterDrawerOpen}
          team={selectedRosterTeam}
          areaName={
            areas.find((a) => a.id === selectedRosterTeam.ministryAreaId)?.name ||
            selectedRosterTeam.ministryArea?.name
          }
          groupName={
            groups.find((g) => g.id === selectedRosterTeam.ministryGroupConfigId)?.name ||
            selectedRosterTeam.ministryGroupConfig?.name
          }
          campusName={
            campuses.find((c) => c.id === selectedRosterTeam.churchCampusId)?.name ||
            selectedRosterTeam.churchCampus?.name
          }
          assignments={campusTeamAssignments}
          volunteersList={volunteersList}
          onAssignClick={(role) => {
            handleOpenAssignDrawer(role, selectedRosterTeam.id);
          }}
          onDeleteAssignment={(asg) => {
            handleOpenDeleteConfirm(asg);
          }}
        />
      )}

      {/* GLOBAL / CONTEXTUAL ASSIGN DRAWER */}
      <AssignVolunteerDrawer
        open={assignDrawerOpen}
        onOpenChange={setAssignDrawerOpen}
        ministryId={ministryId}
        churchCampusId={selectedCampusId}
        areas={areas}
        groups={groups}
        campuses={campuses}
        serviceAreaGroups={serviceAreaGroups}
        existingAssignments={assignments}
        defaultRole={assignDefaultRole}
        defaultServiceAreaGroupId={assignDefaultTeamId}
        onSuccess={handleAssignmentSuccess}
      />

      {/* DELETE CONFIRM MODAL */}
      <ConfirmModal
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Remover Asignación"
        description="¿Estás seguro de que deseas remover esta asignación de rol?"
        confirmText="Sí, remover"
        cancelText="Cancelar"
        type="danger"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default VolunteerAssignmentsTab;
