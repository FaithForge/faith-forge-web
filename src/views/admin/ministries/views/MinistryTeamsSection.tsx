import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Users,
  Plus,
  Inbox,
  AlertCircle,
  Search,
  X,
  Layers,
  ChevronRight,
  ChevronDown,
  FolderKanban,
  CheckCircle2,
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
  MinistryGroupConfigStateEnum,
} from '@/libs/models';
import { capitalizeWords } from '@/libs/utils/text';
import AssignVolunteerDrawer from '../components/AssignVolunteerDrawer';
import TeamRosterDrawer from '../components/TeamRosterDrawer';
import { toast } from 'sonner';

interface MinistryTeamsSectionProps {
  ministryId: string;
  churchCampusId?: string;
}

/**
 * Dedicated Team Organization View.
 * Groups teams by group in alphabetical order, displays compact summary cards with supervisor names
 * and counts, provides quick actions to add supervisors or servidores, and opens the full roster drawer on click.
 *
 * @param {MinistryTeamsSectionProps} props - Component properties.
 * @returns {JSX.Element} Rendered team organization view.
 */
export const MinistryTeamsSection: React.FC<MinistryTeamsSectionProps> = ({
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

  // Campus selection
  const [selectedCampusId, setSelectedCampusId] = useState<string>('');

  // Filtering by Area and Grupo
  const [selectedAreaId, setSelectedAreaId] = useState<string>('ALL');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('ALL');
  const [searchMemberTerm, setSearchMemberTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

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

  const campusTeamsKey = `campus_teams_${ministryId}_${selectedCampusId}`;
  const loadingCampusTeams = loadingByPartition[campusTeamsKey] ?? false;

  // Set default campus
  useEffect(() => {
    if (campuses.length === 0) {
      dispatch(GetChurchCampuses());
    }
  }, [dispatch, campuses.length]);

  useEffect(() => {
    if (churchCampusId) {
      setSelectedCampusId(churchCampusId);
    } else if (!selectedCampusId && campuses.length > 0) {
      setSelectedCampusId(campuses[0].id);
    }
  }, [churchCampusId, campuses, selectedCampusId]);

  // Load Service Area Groups for each Area
  useEffect(() => {
    if (areas.length > 0) {
      areas.forEach((area) => {
        dispatch(GetServiceAreaGroups({ ministryAreaId: area.id }));
      });
    }
  }, [dispatch, areas]);

  // Load Campus Teams Assignments with limit=500 to prevent pagination cuts
  const fetchCampusAssignments = useCallback(() => {
    if (selectedCampusId) {
      dispatch(
        GetVolunteerAssignments({
          ministryId,
          churchCampusId: selectedCampusId,
          partitionKey: campusTeamsKey,
          limit: 500,
          force: true,
        }),
      );
    }
  }, [dispatch, ministryId, selectedCampusId, campusTeamsKey]);

  useEffect(() => {
    if (selectedCampusId) {
      dispatch(
        GetVolunteerAssignments({
          ministryId,
          churchCampusId: selectedCampusId,
          partitionKey: campusTeamsKey,
          limit: 500,
          force: false,
        }),
      );
    }
  }, [dispatch, ministryId, selectedCampusId, campusTeamsKey]);

  useEffect(() => {
    dispatch(GetVolunteers({ ministryId, limit: 500, force: false }));
  }, [dispatch, ministryId]);

  const campusOptions = useMemo(() => {
    return campuses.map((c) => ({
      id: c.id,
      name: c.name,
    }));
  }, [campuses]);

  // Campus teams
  const currentCampusTeams = useMemo(() => {
    const areaIdSet = new Set(areas.map((a) => a.id));
    return serviceAreaGroups.filter(
      (sag) => sag.churchCampusId === selectedCampusId && areaIdSet.has(sag.ministryAreaId),
    );
  }, [serviceAreaGroups, selectedCampusId, areas]);

  const campusTeamAssignments = useMemo(() => {
    return assignmentsByPartition[campusTeamsKey] || assignments;
  }, [assignmentsByPartition, campusTeamsKey, assignments]);

  // Area Options for Filter
  const areaFilterOptions = useMemo(() => {
    return [
      { id: 'ALL', name: `Todas las Áreas (${areas.length})` },
      ...areas.map((a) => ({ id: a.id, name: a.name })),
    ];
  }, [areas]);

  // Group Options for Filter
  const groupFilterOptions = useMemo(() => {
    const sorted = [...groups].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
    return [
      { id: 'ALL', name: `Todos los Grupos (${groups.length})` },
      ...sorted.map((g) => ({ id: g.id, name: g.name })),
    ];
  }, [groups]);

  /**
   * Resolves volunteer user profile details.
   */
  const getVolunteerDetails = useCallback(
    (asg: IVolunteerAssignment) => {
      const vId = asg.volunteerId || asg.ministryVolunteerId;
      const vol =
        asg.volunteer ||
        asg.ministryVolunteer ||
        volunteersList.find((v) => v.id === vId || (v.userId && v.userId === asg.volunteer?.userId));
      const user = asg.volunteer?.user || vol?.user || asg.user;

      const rawName = user && (user.firstName || user.lastName)
        ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
        : 'Servidor asignado';
      const fullName = capitalizeWords(rawName);

      return {
        fullName,
        nationalId: user?.nationalId,
        photoUrl: user?.photoUrl,
        phone: user?.phone,
        email: user?.email,
      };
    },
    [volunteersList],
  );

  // Filter Teams by selected Area and Group
  const filteredTeams = useMemo(() => {
    return currentCampusTeams.filter((team) => {
      if (selectedAreaId !== 'ALL' && team.ministryAreaId !== selectedAreaId) {
        return false;
      }
      if (selectedGroupId !== 'ALL' && team.ministryGroupConfigId !== selectedGroupId) {
        return false;
      }
      return true;
    });
  }, [currentCampusTeams, selectedAreaId, selectedGroupId]);

  // Group teams by Grupo in ALPHABETICAL ORDER as requested by user
  const teamsGroupedByGroup = useMemo(() => {
    // 1. Sort all unique groups alphabetically by name
    const sortedGroups = [...groups].sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }),
    );

    const result: Array<{
      group: (typeof groups)[0];
      teams: IServiceAreaGroup[];
    }> = [];

    sortedGroups.forEach((grp) => {
      const matching = filteredTeams.filter((t) => t.ministryGroupConfigId === grp.id);
      if (matching.length > 0) {
        // Sort teams inside group alphabetically by Area name
        const sortedTeams = [...matching].sort((a, b) => {
          const areaA = areas.find((ar) => ar.id === a.ministryAreaId)?.name || '';
          const areaB = areas.find((ar) => ar.id === b.ministryAreaId)?.name || '';
          return areaA.localeCompare(areaB, 'es', { sensitivity: 'base' });
        });
        result.push({ group: grp, teams: sortedTeams });
      }
    });

    // Leftover teams for groups not in the groups catalog
    const registeredGroupIds = new Set(groups.map((g) => g.id));
    const leftover = filteredTeams.filter((t) => !registeredGroupIds.has(t.ministryGroupConfigId));
    if (leftover.length > 0) {
      result.push({
        group: {
          id: 'other',
          name: 'Otros Equipos',
          position: 999,
          ministryId,
          state: MinistryGroupConfigStateEnum.ACTIVE,
        },
        teams: leftover,
      });
    }

    return result;
  }, [groups, filteredTeams, areas, ministryId]);

  // Initialize expanded state on load (first group open by default)
  useEffect(() => {
    if (teamsGroupedByGroup.length > 0) {
      setExpandedGroups((prev) => {
        // If already set by user interaction, preserve state
        if (Object.keys(prev).length > 0) return prev;
        // Expand the first group by default
        return { [teamsGroupedByGroup[0].group.id]: true };
      });
    }
  }, [teamsGroupedByGroup]);

  // Auto-expand group if filtered specifically
  useEffect(() => {
    if (selectedGroupId !== 'ALL') {
      setExpandedGroups((prev) => ({ ...prev, [selectedGroupId]: true }));
    }
  }, [selectedGroupId]);

  // Auto-expand all matching groups when searching member term
  useEffect(() => {
    if (searchMemberTerm.trim()) {
      const allMatching: Record<string, boolean> = {};
      teamsGroupedByGroup.forEach(({ group }) => {
        allMatching[group.id] = true;
      });
      setExpandedGroups(allMatching);
    }
  }, [searchMemberTerm, teamsGroupedByGroup]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleExpandAll = () => {
    const next: Record<string, boolean> = {};
    teamsGroupedByGroup.forEach(({ group }) => {
      next[group.id] = true;
    });
    setExpandedGroups(next);
  };

  const handleCollapseAll = () => {
    setExpandedGroups({});
  };

  const handleOpenAssignDrawer = (role?: VolunteerRole, serviceAreaGroupId?: string) => {
    setAssignDefaultRole(role);
    setAssignDefaultTeamId(serviceAreaGroupId);
    setAssignDrawerOpen(true);
  };

  const handleOpenRosterDrawer = (team: IServiceAreaGroup) => {
    setSelectedRosterTeam(team);
    setRosterDrawerOpen(true);
  };

  const handleOpenDelete = (asg: IVolunteerAssignment) => {
    setAssignmentToDelete(asg);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!assignmentToDelete) return;
    try {
      await dispatch(DeleteVolunteerAssignment({ id: assignmentToDelete.id })).unwrap();
      toast.success('Asignación removida exitosamente');
      setAssignmentToDelete(null);
      fetchCampusAssignments();
    } catch {
      toast.error('Error al remover la asignación');
    }
  };

  const handleAssignSuccess = () => {
    fetchCampusAssignments();
  };

  // KPIs
  const totalTeamsCount = currentCampusTeams.length;
  const teamsWithSupervisorCount = useMemo(() => {
    return currentCampusTeams.filter((team) =>
      campusTeamAssignments.some(
        (a) => a.serviceAreaGroupId === team.id && a.role === VolunteerRole.SUPERVISOR,
      ),
    ).length;
  }, [currentCampusTeams, campusTeamAssignments]);

  const totalMembersCount = useMemo(() => {
    const campusTeamIds = new Set(currentCampusTeams.map((t) => t.id));
    return campusTeamAssignments.filter(
      (a) => a.serviceAreaGroupId && campusTeamIds.has(a.serviceAreaGroupId),
    ).length;
  }, [currentCampusTeams, campusTeamAssignments]);

  return (
    <div className="flex flex-col gap-4">
      {/* QUICK METRICS BAR */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-2xl p-3 border border-gray-200/80 shadow-xs">
          <p className="text-[11px] font-semibold text-gray-400">Total Equipos</p>
          <p className="text-xl font-extrabold text-gray-900 mt-0.5">{totalTeamsCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-3 border border-gray-200/80 shadow-xs">
          <p className="text-[11px] font-semibold text-gray-400">Con Supervisor</p>
          <p className="text-xl font-extrabold text-indigo-700 mt-0.5">
            {teamsWithSupervisorCount}/{totalTeamsCount || 1}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-3 border border-gray-200/80 shadow-xs">
          <p className="text-[11px] font-semibold text-gray-400">Total Plantilla</p>
          <p className="text-xl font-extrabold text-teal-700 mt-0.5">{totalMembersCount}</p>
        </div>
      </div>

      {/* FILTER HEADER CARD: ÁREA + GRUPO + BUSCADOR */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Layers size={13} />
            </div>
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
              Filtrar Equipos y Plantillas
            </h3>
          </div>
          {(selectedAreaId !== 'ALL' || selectedGroupId !== 'ALL' || searchMemberTerm) && (
            <button
              type="button"
              onClick={() => {
                setSelectedAreaId('ALL');
                setSelectedGroupId('ALL');
                setSearchMemberTerm('');
              }}
              className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
            >
              Restablecer filtros
            </button>
          )}
        </div>

        {/* Campus Selector (if not fixed by parent) */}
        {!churchCampusId && (
          <div>
            <label className="text-[11px] font-bold text-gray-600 block mb-1">
              Sede (Campus)
            </label>
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

        {/* The 2 Primary Filters: Área and Grupo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">
              1. Filtrar por Área
            </label>
            <SelectSearch
              label=""
              placeholder="Todas las áreas..."
              options={areaFilterOptions}
              value={selectedAreaId}
              onChange={(val) => setSelectedAreaId(val)}
              searchable={areaFilterOptions.length > 5}
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">
              2. Filtrar por Grupo
            </label>
            <SelectSearch
              label=""
              placeholder="Todos los grupos..."
              options={groupFilterOptions}
              value={selectedGroupId}
              onChange={(val) => setSelectedGroupId(val)}
              searchable={groupFilterOptions.length > 5}
            />
          </div>
        </div>

        {/* Search member by name inside teams */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search size={14} />
          </div>
          <input
            type="text"
            value={searchMemberTerm}
            onChange={(e) => setSearchMemberTerm(e.target.value)}
            placeholder="Buscar servidor o supervisor por nombre..."
            className="w-full pl-8 pr-8 py-2 bg-slate-50 border border-gray-200/90 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          {searchMemberTerm && (
            <button
              type="button"
              onClick={() => setSearchMemberTerm('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* TEAMS LIST GROUPED BY GRUPO IN ALPHABETICAL ORDER */}
      {loadingCampusTeams && currentCampusTeams.length === 0 ? (
        <CellListSkeleton count={3} />
      ) : teamsGroupedByGroup.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-gray-200/80 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-gray-400">
            <Inbox size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">
              {currentCampusTeams.length === 0
                ? 'No hay equipos configurados en esta sede'
                : 'No se encontraron equipos con los filtros seleccionados'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {currentCampusTeams.length === 0
                ? 'Ve a la pestaña "Configuración" para generar las combinaciones de Área × Grupo.'
                : 'Prueba cambiando los filtros de Área o Grupo seleccionados.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Quick Helper Actions: Total Groups & Desplegar/Plegar todos */}
          <div className="flex items-center justify-between px-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-gray-600">
              <FolderKanban size={14} className="text-primary" />
              <span>
                {teamsGroupedByGroup.length}{' '}
                {teamsGroupedByGroup.length === 1 ? 'grupo disponible' : 'grupos disponibles'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExpandAll}
                className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
              >
                Desplegar todos
              </button>
              <span className="text-gray-300">•</span>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="text-[11px] font-bold text-gray-500 hover:text-gray-800 hover:underline cursor-pointer"
              >
                Plegar todos
              </button>
            </div>
          </div>

          {teamsGroupedByGroup.map(({ group, teams }) => {
            const isExpanded = !!expandedGroups[group.id];

            // Statistics for this group
            const groupTeamIds = new Set(teams.map((t) => t.id));
            const groupAssignments = campusTeamAssignments.filter(
              (a) => a.serviceAreaGroupId && groupTeamIds.has(a.serviceAreaGroupId),
            );
            const groupSupervisors = groupAssignments.filter(
              (a) => a.role === VolunteerRole.SUPERVISOR,
            );
            const groupVolunteers = groupAssignments.filter(
              (a) => a.role === VolunteerRole.VOLUNTEER,
            );

            const teamsWithSupervisor = teams.filter((t) =>
              campusTeamAssignments.some(
                (a) => a.serviceAreaGroupId === t.id && a.role === VolunteerRole.SUPERVISOR,
              ),
            ).length;

            const allTeamsCovered = teamsWithSupervisor === teams.length && teams.length > 0;

            return (
              <div
                key={group.id}
                className={`rounded-3xl border transition-all duration-200 overflow-hidden ${
                  isExpanded
                    ? 'bg-slate-50/50 border-primary/20 shadow-xs'
                    : 'bg-white border-gray-200/90 shadow-2xs hover:border-gray-300'
                }`}
              >
                {/* Grupo Section Header: Dropdown Toggle Button */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left transition-colors cursor-pointer group select-none"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                        isExpanded
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-slate-100 text-gray-600 group-hover:bg-primary/10 group-hover:text-primary'
                      }`}
                    >
                      <FolderKanban size={17} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-tight truncate group-hover:text-primary transition-colors">
                          {group.name}
                        </h3>
                        {allTeamsCovered ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70 shrink-0">
                            <CheckCircle2 size={11} /> Cobertura completa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/70 shrink-0">
                            <AlertCircle size={11} /> {teams.length - teamsWithSupervisor} sin supervisor
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-medium text-gray-500 mt-0.5">
                        <span className="font-bold text-gray-700">{teams.length}</span>{' '}
                        {teams.length === 1 ? 'área / equipo' : 'áreas / equipos'} •{' '}
                        <span className="font-bold text-teal-700">{groupVolunteers.length}</span> servidores •{' '}
                        <span className="font-bold text-indigo-700">{groupSupervisors.length}</span> supervisores
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden sm:inline-block text-[11px] font-bold text-gray-400">
                      {isExpanded ? 'Plegar' : 'Desplegar'}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center transition-transform duration-200 ${
                        isExpanded
                          ? 'bg-primary/10 text-primary rotate-180'
                          : 'bg-slate-100 text-gray-400 group-hover:text-gray-600'
                      }`}
                    >
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </button>

                {/* Collapsible Content with Smooth Framer Motion Animation */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      key={`content-${group.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="p-3.5 sm:p-4 pt-1 border-t border-gray-100 flex flex-col gap-3">
                        {/* Teams under this group */}
                        <div className="grid grid-cols-1 gap-3">
                          {teams.map((team) => {
                            const area =
                              areas.find((a) => a.id === team.ministryAreaId) || team.ministryArea;

                            const allTeamAssignments = campusTeamAssignments.filter(
                              (a) => a.serviceAreaGroupId === team.id,
                            );

                            const supervisors = allTeamAssignments.filter(
                              (a) => a.role === VolunteerRole.SUPERVISOR,
                            );
                            const volunteers = allTeamAssignments.filter(
                              (a) => a.role === VolunteerRole.VOLUNTEER,
                            );

                            // Search filtering
                            const q = searchMemberTerm.toLowerCase().trim();
                            if (q) {
                              const hasSupervisorMatch = supervisors.some((s) =>
                                getVolunteerDetails(s).fullName.toLowerCase().includes(q),
                              );
                              const hasVolunteerMatch = volunteers.some((v) =>
                                getVolunteerDetails(v).fullName.toLowerCase().includes(q),
                              );
                              if (!hasSupervisorMatch && !hasVolunteerMatch) {
                                return null;
                              }
                            }

                            const supervisorNames = supervisors
                              .map((s) => getVolunteerDetails(s).fullName)
                              .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

                            return (
                              <div
                                key={team.id}
                                onClick={() => handleOpenRosterDrawer(team)}
                                className="bg-white rounded-3xl p-4 border border-gray-200/90 shadow-2xs hover:border-primary/50 hover:shadow-md active:scale-[0.985] active:bg-slate-50/80 cursor-pointer transition-all duration-150 flex flex-col gap-3 group select-none relative"
                              >
                                {/* Header: Area Name & Total Members */}
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-black text-gray-900 uppercase tracking-tight group-hover:text-primary transition-colors">
                                      {area?.name || 'Área'}
                                    </span>
                                    <span className="text-gray-300">•</span>
                                    <span className="text-xs font-bold text-gray-600">
                                      {group.name}
                                    </span>
                                  </div>

                                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200/80 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all shrink-0 shadow-2xs">
                                    <span>
                                      {allTeamAssignments.length}{' '}
                                      {allTeamAssignments.length === 1 ? 'miembro' : 'miembros'}
                                    </span>
                                    <ChevronRight
                                      size={13}
                                      className="text-teal-600 group-hover:text-white group-hover:translate-x-0.5 transition-all"
                                    />
                                  </div>
                                </div>

                                {/* Supervisor Summary (List with bullets) */}
                                <div className="text-xs bg-slate-50/70 p-3 rounded-2xl border border-gray-100 group-hover:bg-slate-100/60 transition-colors">
                                  {supervisorNames.length > 0 ? (
                                    <div className="flex flex-col gap-1.5 text-gray-700">
                                      <div className="flex items-center gap-1.5 text-indigo-900 font-bold">
                                        <ShieldCheck
                                          size={14}
                                          className="text-indigo-600 shrink-0"
                                        />
                                        <span>
                                          Supervisores ({supervisorNames.length}):
                                        </span>
                                      </div>
                                      <ul className="flex flex-col gap-1 pl-4 list-disc text-gray-800 font-medium marker:text-indigo-500">
                                        {supervisorNames.map((name, sIdx) => (
                                          <li key={sIdx} className="leading-snug">
                                            {name}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 text-amber-700 font-bold">
                                      <AlertCircle size={14} className="shrink-0 text-amber-600" />
                                      <span>Sin supervisor asignado</span>
                                    </div>
                                  )}
                                </div>

                                {/* Card Click Hint */}
                                <div className="flex items-center justify-end text-[11px] text-gray-400 font-medium -mt-1 px-1">
                                  <span className="group-hover:text-primary font-semibold transition-colors flex items-center gap-1">
                                    <span>Ver plantilla completa ({allTeamAssignments.length})</span>
                                    <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                                  </span>
                                </div>

                                {/* Totals Breakdown and Actions */}
                                <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-gray-100 flex-wrap">
                                  <div className="flex items-center gap-2.5 text-xs text-gray-500 font-semibold">
                                    <span className="inline-flex items-center gap-1 text-indigo-700 font-bold">
                                      <ShieldCheck size={13} /> {supervisors.length} sup.
                                    </span>
                                    <span>•</span>
                                    <span className="inline-flex items-center gap-1 text-teal-700 font-bold">
                                      <Users size={13} /> {volunteers.length} serv.
                                    </span>
                                  </div>

                                  {/* Right side: Quick Add buttons + Dedicated Arrow Button */}
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="flex items-center gap-1.5"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleOpenAssignDrawer(VolunteerRole.SUPERVISOR, team.id)
                                        }
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 hover:bg-indigo-100 active:scale-95 transition-all cursor-pointer"
                                        title="Agregar Supervisor al equipo"
                                      >
                                        <Plus size={11} /> Supervisor
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleOpenAssignDrawer(VolunteerRole.VOLUNTEER, team.id)
                                        }
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200/80 hover:bg-teal-100 active:scale-95 transition-all cursor-pointer"
                                        title="Agregar Servidor al equipo"
                                      >
                                        <Plus size={11} /> Servidor
                                      </button>
                                    </div>

                                    {/* Dedicated Arrow Button (Directly opens team roster) */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenRosterDrawer(team);
                                      }}
                                      className="w-8 h-8 rounded-xl bg-slate-100 text-gray-500 group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-90"
                                      title="Ver todos los integrantes"
                                      aria-label="Ver todos los integrantes"
                                    >
                                      <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* TEAM ROSTER DRAWER (OPENS ON CARD CLICK TO SHOW FULL MEMBER LIST) */}
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
            handleOpenDelete(asg);
          }}
        />
      )}

      {/* CONTEXTUAL ASSIGN VOLUNTEER DRAWER */}
      <AssignVolunteerDrawer
        open={assignDrawerOpen}
        onOpenChange={setAssignDrawerOpen}
        ministryId={ministryId}
        churchCampusId={selectedCampusId}
        areas={areas}
        groups={groups}
        campuses={campuses}
        serviceAreaGroups={serviceAreaGroups}
        existingAssignments={campusTeamAssignments}
        defaultRole={assignDefaultRole}
        defaultServiceAreaGroupId={assignDefaultTeamId}
        onSuccess={handleAssignSuccess}
      />

      {/* DELETE CONFIRM MODAL */}
      <ConfirmModal
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Remover Miembro"
        description="¿Estás seguro de que deseas remover a esta persona de la plantilla del equipo?"
        confirmText="Sí, remover"
        cancelText="Cancelar"
        type="danger"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default MinistryTeamsSection;
