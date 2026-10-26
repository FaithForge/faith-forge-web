import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Layers,
  Users2,
  TableProperties,
  Plus,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { StructureMatrixView } from '../components/StructureMatrixView';
import { StructureAreasView } from '../components/StructureAreasView';
import { StructureGroupsView } from '../components/StructureGroupsView';
import MinistryAreaModal from '../components/MinistryAreaModal';
import MinistryGroupModal from '../components/MinistryGroupModal';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetChurchCampuses } from '@/libs/state/redux/thunks/church/church.thunk';
import {
  CreateServiceAreaGroup,
  GetMinistryAreas,
  GetMinistryGroupConfigs,
  GetServiceAreaGroups,
  UpdateServiceAreaGroup,
} from '@/libs/state/redux/thunks/church/ministry.thunk';
import {
  IMinistryArea,
  IMinistryGroupConfig,
  IMinistryWorkspaceTeam,
  IServiceAreaGroup,
  MinistryAreaStateEnum,
  MinistryGroupConfigStateEnum,
  ServiceAreaGroupStateEnum,
} from '@/libs/models';
import { toast } from 'sonner';
import clsx from 'clsx';

type StructurePerspective = 'matrix' | 'areas' | 'groups';

interface PerspectiveTab {
  key: StructurePerspective;
  label: string;
  icon: React.ElementType;
}

const PERSPECTIVES: PerspectiveTab[] = [
  { key: 'matrix', label: 'Matriz de Cobertura', icon: TableProperties },
  { key: 'areas', label: 'Por Áreas', icon: Layers },
  { key: 'groups', label: 'Por Grupos de Turno', icon: Users2 },
];

interface MinistryStructureSectionProps {
  ministryId: string;
  churchCampusId?: string;
  workspaceAreas?: IMinistryArea[];
  workspaceGroups?: IMinistryGroupConfig[];
  workspaceTeams?: IMinistryWorkspaceTeam[];
  onRefreshWorkspace?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

/**
 * Unified Structure and Classrooms Workspace.
 * Consolidated view of Areas, Classrooms, and Shift Groups with interactive Matrix, Areas, and Groups perspectives.
 *
 * @param {MinistryStructureSectionProps} props - Component properties.
 * @returns {JSX.Element} Rendered structure section.
 */
export const MinistryStructureSection: React.FC<MinistryStructureSectionProps> = ({
  ministryId,
  churchCampusId,
  workspaceAreas,
  workspaceGroups,
  onRefreshWorkspace,
}) => {
  const { t } = useTranslation('admin');
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const campusesState = useAppSelector((state) => state.churchCampusSlice);
  const {
    areasByMinistry,
    groupsByMinistry,
    serviceAreaGroups,
  } = useAppSelector((state) => state.ministrySlice);

  // Active Perspective
  const urlPerspective = searchParams.get('perspective') as StructurePerspective | null;
  const legacySubTab = searchParams.get('subTab');
  const initialPerspective: StructurePerspective =
    urlPerspective && ['matrix', 'areas', 'groups'].includes(urlPerspective)
      ? urlPerspective
      : legacySubTab === 'areas'
      ? 'areas'
      : legacySubTab === 'groups'
      ? 'groups'
      : 'matrix';

  const [perspective, setPerspective] = useState<StructurePerspective>(initialPerspective);

  // Modals state
  const [areaModalOpen, setAreaModalOpen] = useState(false);
  const [areaToEdit, setAreaToEdit] = useState<IMinistryArea | null>(null);

  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<IMinistryGroupConfig | null>(null);

  // Async action states
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);

  // Selected campus resolution
  const [selectedCampusId, setSelectedCampusId] = useState<string>('');
  const campuses = campusesState.data;

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

  // Initial fetch
  useEffect(() => {
    if (ministryId) {
      dispatch(GetMinistryAreas({ ministryId, force: false }));
      dispatch(GetMinistryGroupConfigs({ ministryId, force: false }));
    }
  }, [dispatch, ministryId]);

  // Load service area groups
  const fetchAllTeams = useCallback(() => {
    if (selectedCampusId && ministryId) {
      dispatch(GetServiceAreaGroups({ churchCampusId: selectedCampusId, ministryId }));
    }
    const currentAreas = areasByMinistry[ministryId] || workspaceAreas || [];
    if (currentAreas.length > 0) {
      currentAreas.forEach((area) => {
        dispatch(GetServiceAreaGroups({ ministryAreaId: area.id }));
      });
    }
  }, [dispatch, selectedCampusId, ministryId, areasByMinistry, workspaceAreas]);

  useEffect(() => {
    if (selectedCampusId) {
      fetchAllTeams();
    }
  }, [selectedCampusId, fetchAllTeams]);

  // Perspective switch handler
  const handlePerspectiveChange = (next: StructurePerspective) => {
    setPerspective(next);
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        if (next === 'matrix') {
          params.delete('perspective');
          params.delete('subTab');
        } else {
          params.set('perspective', next);
          params.delete('subTab');
        }
        return params;
      },
      { replace: true },
    );
  };

  // Data collections
  const areas = useMemo(() => {
    const list = areasByMinistry[ministryId]?.length
      ? areasByMinistry[ministryId]
      : workspaceAreas || [];
    return list.filter((a) => a.state !== MinistryAreaStateEnum.DELETED);
  }, [areasByMinistry, ministryId, workspaceAreas]);

  const groups = useMemo(() => {
    const list = groupsByMinistry[ministryId]?.length
      ? groupsByMinistry[ministryId]
      : workspaceGroups || [];
    return list.filter((g) => g.state !== MinistryGroupConfigStateEnum.DELETED);
  }, [groupsByMinistry, ministryId, workspaceGroups]);

  const currentTeams = useMemo(() => {
    const areaIdSet = new Set(areas.map((a) => a.id));
    return (serviceAreaGroups || [])
      .filter((t) => t.state !== ServiceAreaGroupStateEnum.DELETED)
      .filter((sag) => {
        const matchCampus = !selectedCampusId || sag.churchCampusId === selectedCampusId;
        const matchArea = areaIdSet.has(sag.ministryAreaId);
        return matchCampus && matchArea;
      });
  }, [serviceAreaGroups, selectedCampusId, areas]);

  // Next default position for groups
  const nextDefaultPosition = useMemo(() => {
    if (groups.length === 0) return 1;
    const maxPos = Math.max(...groups.map((g) => g.position ?? 0));
    return maxPos + 1;
  }, [groups]);

  // Actions
  const handleToggleTeam = async (team: IServiceAreaGroup) => {
    setTogglingId(team.id);
    const isCurrentlyActive = team.state === ServiceAreaGroupStateEnum.ACTIVE;
    const nextState = isCurrentlyActive
      ? ServiceAreaGroupStateEnum.INACTIVE
      : ServiceAreaGroupStateEnum.ACTIVE;
    try {
      await dispatch(
        UpdateServiceAreaGroup({
          id: team.id,
          state: nextState,
        }),
      ).unwrap();
      toast.success(
        `Equipo ${!isCurrentlyActive ? 'habilitado' : 'deshabilitado'} correctamente`,
      );
    } catch {
      toast.error('Error al actualizar el estado del equipo');
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreateTeam = async (areaId: string, groupId: string) => {
    try {
      await dispatch(
        CreateServiceAreaGroup({
          ministryAreaId: areaId,
          ministryGroupConfigId: groupId,
          churchCampusId: selectedCampusId,
        }),
      ).unwrap();
      toast.success('Equipo asignado correctamente');
      fetchAllTeams();
    } catch (err: unknown) {
      const errMsg = typeof err === 'string' ? err : 'Error al asignar el equipo';
      toast.error(errMsg);
    }
  };

  const handleBulkGenerate = async () => {
    const activeAreas = areas.filter((a) => a.state === MinistryAreaStateEnum.ACTIVE);
    const activeGroups = groups.filter((g) => g.state === MinistryGroupConfigStateEnum.ACTIVE);

    if (activeAreas.length === 0 || activeGroups.length === 0) {
      toast.error('Se requieren áreas y grupos activos');
      return;
    }

    const existingKeys = new Set(
      currentTeams.map((t) => `${t.ministryAreaId}-${t.ministryGroupConfigId}`),
    );

    const toCreate: Array<{ areaId: string; groupId: string }> = [];
    activeAreas.forEach((a) => {
      activeGroups.forEach((g) => {
        if (!existingKeys.has(`${a.id}-${g.id}`)) {
          toCreate.push({ areaId: a.id, groupId: g.id });
        }
      });
    });

    if (toCreate.length === 0) {
      toast.info('Todos los equipos ya están creados');
      return;
    }

    setIsBulkGenerating(true);
    let createdCount = 0;
    try {
      for (const item of toCreate) {
        try {
          await dispatch(
            CreateServiceAreaGroup({
              ministryAreaId: item.areaId,
              ministryGroupConfigId: item.groupId,
              churchCampusId: selectedCampusId,
            }),
          ).unwrap();
          createdCount++;
        } catch {
          // ignore already existing
        }
      }

      fetchAllTeams();
      toast.success(`${createdCount} combinaciones completadas exitosamente`);
    } catch {
      toast.error('Error durante la generación de combinaciones');
    } finally {
      setIsBulkGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-28 sm:pb-36">
      {/* Top Unified Header & Perspective Switcher */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Title & Overview count */}
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
            {t('admin:ministry_structure.header_title', {
              defaultValue: 'Estructura del Ministerio',
            })}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('admin:ministry_structure.summary_metrics', {
              areas: areas.length,
              groups: groups.length,
              teams: currentTeams.length,
              defaultValue: `${areas.length} áreas • ${groups.length} grupos • ${currentTeams.length} combinaciones en esta sede`,
            })}
          </p>
        </div>

        {/* Center: Perspective Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200/80 self-start md:self-center">
          {PERSPECTIVES.map((tab) => {
            const Icon = tab.icon;
            const isSelected = perspective === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handlePerspectiveChange(tab.key)}
                className={clsx(
                  'flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer select-none',
                  isSelected
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 bg-transparent',
                )}
              >
                <Icon
                  size={14}
                  className={isSelected ? 'text-indigo-600' : 'text-slate-400'}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          <Button
            onClick={() => {
              setAreaToEdit(null);
              setAreaModalOpen(true);
            }}
            size="sm"
            className="text-xs gap-1.5 py-1.5 px-3 bg-teal-700 hover:bg-teal-800 text-white"
          >
            <Plus size={14} />
            <span>
              {t('admin:ministry_structure.btn_new_area', {
                defaultValue: 'Nueva Área',
              })}
            </span>
          </Button>

          <Button
            onClick={() => {
              setGroupToEdit(null);
              setGroupModalOpen(true);
            }}
            size="sm"
            className="text-xs gap-1.5 py-1.5 px-3"
          >
            <Plus size={14} />
            <span>
              {t('admin:ministry_structure.btn_new_group', {
                defaultValue: 'Nuevo Grupo',
              })}
            </span>
          </Button>
        </div>
      </div>

      {/* Perspective Content */}
      {perspective === 'matrix' && (
        <StructureMatrixView
          ministryId={ministryId}
          areas={areas}
          groups={groups}
          currentTeams={currentTeams}
          selectedCampusId={selectedCampusId}
          onEditArea={(area) => {
            setAreaToEdit(area);
            setAreaModalOpen(true);
          }}
          onEditGroup={(group) => {
            setGroupToEdit(group);
            setGroupModalOpen(true);
          }}
          onToggleTeam={handleToggleTeam}
          onCreateTeam={handleCreateTeam}
          onBulkGenerate={handleBulkGenerate}
          isBulkGenerating={isBulkGenerating}
          togglingId={togglingId}
        />
      )}

      {perspective === 'areas' && (
        <StructureAreasView
          ministryId={ministryId}
          areas={areas}
          groups={groups}
          currentTeams={currentTeams}
          onEditArea={(area) => {
            setAreaToEdit(area);
            setAreaModalOpen(true);
          }}
          onToggleTeam={handleToggleTeam}
          onCreateTeam={handleCreateTeam}
          togglingId={togglingId}
        />
      )}

      {perspective === 'groups' && (
        <StructureGroupsView
          ministryId={ministryId}
          areas={areas}
          groups={groups}
          currentTeams={currentTeams}
          onEditGroup={(group) => {
            setGroupToEdit(group);
            setGroupModalOpen(true);
          }}
        />
      )}

      {/* Modals */}
      <MinistryAreaModal
        open={areaModalOpen}
        onOpenChange={setAreaModalOpen}
        ministryId={ministryId}
        areaToEdit={areaToEdit}
        onSuccess={() => {
          dispatch(GetMinistryAreas({ ministryId, force: true }));
          fetchAllTeams();
          onRefreshWorkspace?.();
        }}
      />

      <MinistryGroupModal
        open={groupModalOpen}
        onOpenChange={setGroupModalOpen}
        ministryId={ministryId}
        groupToEdit={groupToEdit}
        defaultPosition={nextDefaultPosition}
        onSuccess={() => {
          dispatch(GetMinistryGroupConfigs({ ministryId, force: true }));
          fetchAllTeams();
          onRefreshWorkspace?.();
        }}
      />
    </div>
  );
};

export default MinistryStructureSection;
