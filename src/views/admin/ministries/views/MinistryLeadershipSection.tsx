import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Crown,
  Layers,
  Users,
  Search,
  X,
  Plus,
  Trash2,
  Phone,
  Sparkles,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { CellListSkeleton } from '@/components/ui/DetailSkeleton';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import {
  DeleteVolunteerAssignment,
  GetVolunteerAssignments,
  GetVolunteers,
} from '@/libs/state/redux/thunks/church/volunteer.thunk';
import { IVolunteerAssignment, VolunteerRole } from '@/libs/models';
import { capitalizeWords } from '@/libs/utils/text';
import AssignVolunteerDrawer from '../components/AssignVolunteerDrawer';
import { toast } from 'sonner';
import clsx from 'clsx';

interface MinistryLeadershipSectionProps {
  ministryId: string;
  churchCampusId?: string;
}

type LeadershipCategoryFilter = 'ALL' | 'GENERAL' | 'AREAS' | 'GROUPS';

interface FilterTab {
  key: LeadershipCategoryFilter;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
}

const LEADERSHIP_FILTER_TABS: FilterTab[] = [
  { key: 'ALL', label: 'Todos los Líderes', shortLabel: 'Todos', icon: Sparkles },
  { key: 'GENERAL', label: 'Coord. General', shortLabel: 'General', icon: Crown },
  { key: 'AREAS', label: 'Coord. por Área', shortLabel: 'Por Área', icon: Layers },
  { key: 'GROUPS', label: 'Coord. por Grupo', shortLabel: 'Por Grupo', icon: Users },
];

/**
 * Leadership directory view with Telegram-style filter chips and visual grouping by Area and Grupo cards.
 *
 * @param {MinistryLeadershipSectionProps} props - Component properties.
 * @returns {JSX.Element} Rendered leadership management view.
 */
export const MinistryLeadershipSection: React.FC<MinistryLeadershipSectionProps> = ({
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

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<LeadershipCategoryFilter>('ALL');

  // Modals & Drawers State
  const [assignDrawerOpen, setAssignDrawerOpen] = useState(false);
  const [defaultRoleToAssign, setDefaultRoleToAssign] = useState<VolunteerRole | undefined>(undefined);
  const [assignmentToDelete, setAssignmentToDelete] = useState<IVolunteerAssignment | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const areas = useMemo(
    () =>
      [...(areasByMinistry[ministryId] || [])].sort((a, b) =>
        a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }),
      ),
    [areasByMinistry, ministryId],
  );
  const groups = useMemo(
    () =>
      [...(groupsByMinistry[ministryId] || [])].sort((a, b) =>
        a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }),
      ),
    [groupsByMinistry, ministryId],
  );
  const campuses = campusesState.data;

  // Partition Keys
  const ministryCoordsKey = `ministry_coords_${ministryId}`;
  const areaCoordsKey = `area_coords_${ministryId}`;
  const groupCoordsKey = `group_coords_${ministryId}`;

  const loadingMinistryCoords = loadingByPartition[ministryCoordsKey] ?? false;
  const loadingAreaCoords = loadingByPartition[areaCoordsKey] ?? false;
  const loadingGroupCoords = loadingByPartition[groupCoordsKey] ?? false;
  const isLoading = loadingMinistryCoords || loadingAreaCoords || loadingGroupCoords;

  // Fetch Coordinators with limit=500
  const fetchCoordinators = useCallback(
    (force = true) => {
      dispatch(
        GetVolunteerAssignments({
          ministryId,
          role: VolunteerRole.MINISTRY_GENERAL_COORDINATOR,
          partitionKey: ministryCoordsKey,
          limit: 500,
          force,
        }),
      );
      dispatch(
        GetVolunteerAssignments({
          ministryId,
          role: VolunteerRole.AREA_GENERAL_COORDINATOR,
          partitionKey: areaCoordsKey,
          limit: 500,
          force,
        }),
      );
      dispatch(
        GetVolunteerAssignments({
          ministryId,
          role: VolunteerRole.GROUP_COORDINATOR,
          partitionKey: groupCoordsKey,
          limit: 500,
          force,
        }),
      );
    },
    [dispatch, ministryId, ministryCoordsKey, areaCoordsKey, groupCoordsKey],
  );

  useEffect(() => {
    fetchCoordinators(false);
    dispatch(GetVolunteers({ ministryId, limit: 500, force: false }));
  }, [fetchCoordinators, dispatch, ministryId]);

  // Combine All Coordinators with strict deduplication by ID
  const allCoordinators = useMemo(() => {
    const list1 = assignmentsByPartition[ministryCoordsKey] || [];
    const list2 = assignmentsByPartition[areaCoordsKey] || [];
    const list3 = assignmentsByPartition[groupCoordsKey] || [];

    const combined = [...list1, ...list2, ...list3];
    const uniqueMap = new Map<string, IVolunteerAssignment>();
    combined.forEach((item) => {
      if (item && item.id) {
        uniqueMap.set(item.id, item);
      }
    });
    const uniqueList = Array.from(uniqueMap.values());
    if (uniqueList.length > 0) return uniqueList;

    const fallback = assignments.filter(
      (a) =>
        a.role === VolunteerRole.MINISTRY_GENERAL_COORDINATOR ||
        a.role === VolunteerRole.AREA_GENERAL_COORDINATOR ||
        a.role === VolunteerRole.GROUP_COORDINATOR,
    );
    const fallbackMap = new Map<string, IVolunteerAssignment>();
    fallback.forEach((item) => {
      if (item && item.id) {
        fallbackMap.set(item.id, item);
      }
    });
    return Array.from(fallbackMap.values());
  }, [assignmentsByPartition, ministryCoordsKey, areaCoordsKey, groupCoordsKey, assignments]);

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
        : 'Líder asignado';
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

  // Groupings:
  // 1. General Coordinators
  const generalCoordinators = useMemo(() => {
    const list = allCoordinators.filter(
      (a) => a.role === VolunteerRole.MINISTRY_GENERAL_COORDINATOR,
    );
    const q = searchTerm.toLowerCase().trim();
    if (!q) return list;
    return list.filter((asg) => {
      const d = getVolunteerDetails(asg);
      return (
        d.fullName.toLowerCase().includes(q) ||
        (d.nationalId && d.nationalId.toLowerCase().includes(q))
      );
    });
  }, [allCoordinators, searchTerm, getVolunteerDetails]);

  // 2. Coordinators by Area
  const areaCoordinatorsGrouped = useMemo(() => {
    const areaCoords = allCoordinators.filter(
      (a) => a.role === VolunteerRole.AREA_GENERAL_COORDINATOR,
    );
    const q = searchTerm.toLowerCase().trim();

    return areas.map((area) => {
      const matching = areaCoords.filter((asg) => asg.ministryAreaId === area.id);
      const filtered = q
        ? matching.filter((asg) => {
            const d = getVolunteerDetails(asg);
            return (
              d.fullName.toLowerCase().includes(q) ||
              (d.nationalId && d.nationalId.toLowerCase().includes(q)) ||
              area.name.toLowerCase().includes(q)
            );
          })
        : matching;

      return {
        area,
        coordinators: filtered,
      };
    }).filter((item) => (q ? item.coordinators.length > 0 : true));
  }, [allCoordinators, areas, searchTerm, getVolunteerDetails]);

  // 3. Coordinators by Group (in alphabetical order as requested)
  const groupCoordinatorsGrouped = useMemo(() => {
    const groupCoords = allCoordinators.filter(
      (a) => a.role === VolunteerRole.GROUP_COORDINATOR,
    );
    const q = searchTerm.toLowerCase().trim();
    const sortedGroups = [...groups].sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }),
    );

    return sortedGroups.map((group) => {
      const matching = groupCoords.filter(
        (asg) => asg.ministryGroupConfigId === group.id,
      );
      const filtered = q
        ? matching.filter((asg) => {
            const d = getVolunteerDetails(asg);
            return (
              d.fullName.toLowerCase().includes(q) ||
              (d.nationalId && d.nationalId.toLowerCase().includes(q)) ||
              group.name.toLowerCase().includes(q)
            );
          })
        : matching;

      return {
        group,
        coordinators: filtered,
      };
    }).filter((item) => (q ? item.coordinators.length > 0 : true));
  }, [allCoordinators, groups, searchTerm, getVolunteerDetails]);

  // Counts for Filter Chips
  const counts = useMemo(() => {
    return {
      ALL: allCoordinators.length,
      GENERAL: allCoordinators.filter(
        (a) => a.role === VolunteerRole.MINISTRY_GENERAL_COORDINATOR,
      ).length,
      AREAS: allCoordinators.filter(
        (a) => a.role === VolunteerRole.AREA_GENERAL_COORDINATOR,
      ).length,
      GROUPS: allCoordinators.filter(
        (a) => a.role === VolunteerRole.GROUP_COORDINATOR,
      ).length,
    };
  }, [allCoordinators]);

  const handleOpenAssign = (role?: VolunteerRole) => {
    setDefaultRoleToAssign(role);
    setAssignDrawerOpen(true);
  };

  const handleOpenDelete = (asg: IVolunteerAssignment) => {
    setAssignmentToDelete(asg);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!assignmentToDelete) return;
    try {
      await dispatch(DeleteVolunteerAssignment({ id: assignmentToDelete.id })).unwrap();
      toast.success('Asignación de liderazgo eliminada exitosamente');
      setAssignmentToDelete(null);
      fetchCoordinators();
    } catch {
      toast.error('Error al remover la asignación');
    }
  };

  const renderLeaderRow = (asg: IVolunteerAssignment, roleTitle: string, roleClass: string) => {
    const details = getVolunteerDetails(asg);

    return (
      <div
        key={asg.id}
        className="p-3 bg-white border border-gray-200/80 rounded-2xl shadow-2xs hover:border-gray-300 transition-all flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-gray-200 flex items-center justify-center font-bold text-xs text-gray-700 overflow-hidden shrink-0 shadow-2xs">
            {details.photoUrl ? (
              <img
                src={details.photoUrl}
                alt={details.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>
                {details.fullName
                  .split(' ')
                  .slice(0, 2)
                  .map((p) => p[0])
                  .join('')
                  .toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 truncate">
                {details.fullName}
              </h4>
              <span
                className={clsx(
                  'px-2 py-0.2 rounded-full text-[10px] font-bold border shrink-0',
                  roleClass,
                )}
              >
                {roleTitle}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5 flex-wrap">
              {details.nationalId && <span>Doc: {details.nationalId}</span>}
              {details.phone && (
                <span className="inline-flex items-center gap-0.5">
                  <Phone size={10} className="text-gray-400" />
                  {details.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleOpenDelete(asg)}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
          title="Remover Asignación"
        >
          <Trash2 size={14} />
        </button>
      </div>
    );
  };

  const showGeneral = selectedFilter === 'ALL' || selectedFilter === 'GENERAL';
  const showAreas = selectedFilter === 'ALL' || selectedFilter === 'AREAS';
  const showGroups = selectedFilter === 'ALL' || selectedFilter === 'GROUPS';

  return (
    <div className="flex flex-col gap-3.5">
      {/* TELEGRAM-STYLE SEARCH BAR */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar líderes por nombre o documento..."
            className="w-full pl-9 pr-9 py-2.5 bg-white rounded-2xl border border-gray-200/90 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <Button
          onClick={() => handleOpenAssign()}
          size="sm"
          className="rounded-2xl text-xs gap-1.5 py-2.5 px-3.5 shrink-0 shadow-xs"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">Asignar Líder</span>
        </Button>
      </div>

      {/* TELEGRAM-STYLE HORIZONTAL FILTER CHIPS */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-0.5">
        {LEADERSHIP_FILTER_TABS.map((tab) => {
          const Icon = tab.icon;
          const isSelected = selectedFilter === tab.key;
          const count = counts[tab.key];

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedFilter(tab.key)}
              className={clsx(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer select-none border',
                isSelected
                  ? 'bg-primary text-white border-primary shadow-xs shadow-primary/20'
                  : 'bg-white text-gray-600 border-gray-200/90 hover:bg-slate-100 hover:text-gray-900',
              )}
            >
              <Icon size={12} className={isSelected ? 'text-white' : 'text-gray-400'} />
              <span>{tab.shortLabel}</span>
              <span
                className={clsx(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-extrabold',
                  isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-gray-600',
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* LEADERSHIP CONTENT GROUPED BY CARDS */}
      {isLoading && allCoordinators.length === 0 ? (
        <CellListSkeleton count={3} />
      ) : (
        <div className="flex flex-col gap-5 mt-1">
          {/* ========================================================================= */}
          {/* SECTION 1: COORDINACIÓN GENERAL DEL MINISTERIO */}
          {/* ========================================================================= */}
          {showGeneral && (
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-200/90 shadow-xs flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
                    <Crown size={15} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 uppercase tracking-wide">
                      Coordinación General del Ministerio
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      Supervisión global de todas las áreas y sedes
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() =>
                    handleOpenAssign(VolunteerRole.MINISTRY_GENERAL_COORDINATOR)
                  }
                  size="sm"
                  className="text-xs py-1 px-2.5 gap-1"
                >
                  <Plus size={12} /> Asignar
                </Button>
              </div>

              {generalCoordinators.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-dashed border-gray-200 rounded-2xl text-center text-xs text-gray-500">
                  Sin coordinadores generales asignados.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {generalCoordinators.map((c) =>
                    renderLeaderRow(
                      c,
                      'Coordinador General',
                      'bg-amber-50 text-amber-800 border-amber-200',
                    ),
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 2: COORDINACIÓN POR ÁREAS (CARDS POR ÁREA) */}
          {/* ========================================================================= */}
          {showAreas && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
                    <Layers size={13} />
                  </div>
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                    Coordinación por Áreas
                  </h3>
                </div>
                <Button
                  onClick={() =>
                    handleOpenAssign(VolunteerRole.AREA_GENERAL_COORDINATOR)
                  }
                  size="sm"
                  variant="default"
                  className="text-xs py-1 px-2.5 gap-1"
                >
                  <Plus size={12} /> Asignar Coord. Área
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {areaCoordinatorsGrouped.map(({ area, coordinators }) => (
                  <div
                    key={area.id}
                    className="bg-white rounded-3xl p-4 border border-gray-200/90 shadow-xs flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-primary">
                        {area.name}
                      </span>
                      <span className="text-[11px] font-bold text-gray-400">
                        {coordinators.length}{' '}
                        {coordinators.length === 1 ? 'coordinador' : 'coordinadores'}
                      </span>
                    </div>

                    {coordinators.length === 0 ? (
                      <div className="p-3 bg-slate-50 border border-dashed border-gray-200 rounded-2xl flex items-center justify-between gap-2">
                        <span className="text-xs text-gray-400 italic">
                          Sin coordinador de área asignado
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenAssign(VolunteerRole.AREA_GENERAL_COORDINATOR)
                          }
                          className="text-xs font-bold text-primary hover:underline cursor-pointer"
                        >
                          + Asignar
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {coordinators.map((c) =>
                          renderLeaderRow(
                            c,
                            'Coord. de Área',
                            'bg-blue-50 text-blue-800 border-blue-200',
                          ),
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 3: COORDINACIÓN POR GRUPOS (CARDS POR GRUPO EN ORDEN ALFABÉTICO) */}
          {/* ========================================================================= */}
          {showGroups && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center">
                    <Users size={13} />
                  </div>
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                    Coordinación por Grupos (Orden Alfabético)
                  </h3>
                </div>
                <Button
                  onClick={() =>
                    handleOpenAssign(VolunteerRole.GROUP_COORDINATOR)
                  }
                  size="sm"
                  variant="default"
                  className="text-xs py-1 px-2.5 gap-1"
                >
                  <Plus size={12} /> Asignar Coord. Grupo
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {groupCoordinatorsGrouped.map(({ group, coordinators }) => (
                  <div
                    key={group.id}
                    className="bg-white rounded-3xl p-4 border border-gray-200/90 shadow-xs flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-purple-900">
                        {group.name}
                      </span>
                      <span className="text-[11px] font-bold text-gray-400">
                        {coordinators.length}{' '}
                        {coordinators.length === 1 ? 'coordinador' : 'coordinadores'}
                      </span>
                    </div>

                    {coordinators.length === 0 ? (
                      <div className="p-3 bg-slate-50 border border-dashed border-gray-200 rounded-2xl flex items-center justify-between gap-2">
                        <span className="text-xs text-gray-400 italic">
                          Sin coordinador de grupo asignado
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenAssign(VolunteerRole.GROUP_COORDINATOR)
                          }
                          className="text-xs font-bold text-primary hover:underline cursor-pointer"
                        >
                          + Asignar
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {coordinators.map((c) =>
                          renderLeaderRow(
                            c,
                            'Coord. de Grupo',
                            'bg-purple-50 text-purple-800 border-purple-200',
                          ),
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ASSIGN VOLUNTEER DRAWER */}
      <AssignVolunteerDrawer
        open={assignDrawerOpen}
        onOpenChange={setAssignDrawerOpen}
        ministryId={ministryId}
        churchCampusId={churchCampusId}
        areas={areas}
        groups={groups}
        campuses={campuses}
        serviceAreaGroups={serviceAreaGroups}
        existingAssignments={allCoordinators}
        defaultRole={defaultRoleToAssign}
        onSuccess={fetchCoordinators}
      />

      {/* DELETE CONFIRM MODAL */}
      <ConfirmModal
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Remover Líder"
        description="¿Estás seguro de que deseas remover esta asignación de liderazgo?"
        confirmText="Sí, remover"
        cancelText="Cancelar"
        type="danger"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default MinistryLeadershipSection;
