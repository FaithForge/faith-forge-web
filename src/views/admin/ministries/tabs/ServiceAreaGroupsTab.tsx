import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Wand2,
  MapPin,
  CheckCircle2,
  XCircle,
  Inbox,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronsUpDown,
  Layers,
  Users,
  Network,
  Sparkles,
  ArrowRight,
  Calculator,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { CellListSkeleton } from '@/components/ui/DetailSkeleton';
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
  IServiceAreaGroup,
  MinistryAreaStateEnum,
  MinistryGroupConfigStateEnum,
  ServiceAreaGroupStateEnum,
} from '@/libs/models';
import ServiceAreaGroupModal from '../components/ServiceAreaGroupModal';
import { toast } from 'sonner';
import clsx from 'clsx';

interface AreaTeamItem {
  team: IServiceAreaGroup;
  group?: IMinistryGroupConfig;
}

interface AreaGroupSection {
  areaId: string;
  areaName: string;
  areaActive: boolean;
  areaDescription?: string;
  teams: AreaTeamItem[];
}

interface ServiceAreaGroupsTabProps {
  ministryId: string;
  churchCampusId?: string;
  workspaceAreas?: IMinistryArea[];
  workspaceGroups?: IMinistryGroupConfig[];
  onNavigateToTab?: (tab: string) => void;
}

/**
 * Tab component managing Service Area Groups (Area × Group combinations per Campus).
 *
 * @param {ServiceAreaGroupsTabProps} props - Component properties.
 * @returns {JSX.Element} Rendered tab content.
 */
export const ServiceAreaGroupsTab: React.FC<ServiceAreaGroupsTabProps> = ({
  ministryId,
  churchCampusId,
  workspaceAreas,
  workspaceGroups,
  onNavigateToTab,
}) => {
  const { t } = useTranslation('admin');
  const dispatch = useAppDispatch();

  const campusesState = useAppSelector((state) => state.churchCampusSlice);
  const {
    areasByMinistry,
    groupsByMinistry,
    serviceAreaGroups,
    loadingAreas,
    loadingGroups,
    loadingServiceAreaGroups,
  } = useAppSelector((state) => state.ministrySlice);

  const [selectedCampusId, setSelectedCampusId] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedModalAreaId, setSelectedModalAreaId] = useState<string | undefined>(undefined);
  const [expandedAreaIds, setExpandedAreaIds] = useState<Set<string>>(new Set());
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Proactively fetch areas and groups if they are not yet loaded for this ministry
  useEffect(() => {
    if (ministryId) {
      dispatch(GetMinistryAreas({ ministryId, force: false }));
      dispatch(GetMinistryGroupConfigs({ ministryId, force: false }));
    }
  }, [dispatch, ministryId]);

  const areas = useMemo(() => {
    const list = areasByMinistry[ministryId]?.length
      ? areasByMinistry[ministryId]
      : workspaceAreas || [];
    return [...list].sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }),
    );
  }, [areasByMinistry, ministryId, workspaceAreas]);

  const groups = useMemo(() => {
    const list = groupsByMinistry[ministryId]?.length
      ? groupsByMinistry[ministryId]
      : workspaceGroups || [];
    return [...list].sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }),
    );
  }, [groupsByMinistry, ministryId, workspaceGroups]);

  const campuses = campusesState.data;

  // Load campuses if not yet available
  useEffect(() => {
    if (campuses.length === 0) {
      dispatch(GetChurchCampuses());
    }
  }, [dispatch, campuses.length]);

  // Set default campus from churchCampusId or first campus
  useEffect(() => {
    if (churchCampusId) {
      setSelectedCampusId(churchCampusId);
    } else if (!selectedCampusId && campuses.length > 0) {
      setSelectedCampusId(campuses[0].id);
    }
  }, [churchCampusId, campuses, selectedCampusId]);

  // Load service area groups for all areas in this ministry
  const fetchAllTeams = useCallback(() => {
    if (selectedCampusId && ministryId) {
      dispatch(GetServiceAreaGroups({ churchCampusId: selectedCampusId, ministryId }));
    }
    if (areas.length > 0) {
      areas.forEach((area) => {
        dispatch(GetServiceAreaGroups({ ministryAreaId: area.id }));
      });
    }
  }, [dispatch, selectedCampusId, ministryId, areas]);

  useEffect(() => {
    if (selectedCampusId) {
      fetchAllTeams();
    }
  }, [selectedCampusId, fetchAllTeams]);

  const campusOptions = useMemo(() => {
    return campuses.map((c) => ({
      id: c.id,
      name: c.name,
    }));
  }, [campuses]);

  // Filter combinations relevant to this ministry and this campus
  const currentTeams = useMemo(() => {
    const areaIdSet = new Set(areas.map((a) => a.id));
    return serviceAreaGroups
      .filter((t) => t.state !== ServiceAreaGroupStateEnum.DELETED)
      .filter((sag) => {
        const matchCampus = sag.churchCampusId === selectedCampusId;
        const matchArea = areaIdSet.has(sag.ministryAreaId);
        return matchCampus && matchArea;
      });
  }, [serviceAreaGroups, selectedCampusId, areas]);

  // Active items for matrix calculation
  const activeAreas = useMemo(
    () => areas.filter((a) => a.state === MinistryAreaStateEnum.ACTIVE),
    [areas],
  );
  const activeGroups = useMemo(
    () => groups.filter((g) => g.state === MinistryGroupConfigStateEnum.ACTIVE),
    [groups],
  );

  const expectedTeamsCount = activeAreas.length * activeGroups.length;

  // Missing combinations count
  const missingCombinationsCount = useMemo(() => {
    const existingKeys = new Set(
      currentTeams.map((t) => `${t.ministryAreaId}-${t.ministryGroupConfigId}`),
    );
    let count = 0;
    activeAreas.forEach((a) => {
      activeGroups.forEach((g) => {
        if (!existingKeys.has(`${a.id}-${g.id}`)) {
          count++;
        }
      });
    });
    return count;
  }, [activeAreas, activeGroups, currentTeams]);

  // Structure Area x Groups
  const areasWithTeams = useMemo<AreaGroupSection[]>(() => {
    const result: AreaGroupSection[] = [];
    const processedAreaIds = new Set<string>();

    // 1. Group by registered areas in the ministry
    areas.forEach((area) => {
      processedAreaIds.add(area.id);
      const areaTeams = currentTeams
        .filter((sag) => sag.ministryAreaId === area.id)
        .map((team) => ({
          team,
          group:
            groups.find((g) => g.id === team.ministryGroupConfigId) || team.ministryGroupConfig,
        }))
        .sort((a, b) => {
          const posA = a.group?.position ?? 999;
          const posB = b.group?.position ?? 999;
          if (posA !== posB) return posA - posB;
          return (a.group?.name || '').localeCompare(b.group?.name || '');
        });

      result.push({
        areaId: area.id,
        areaName: area.name,
        areaActive: area.state === MinistryAreaStateEnum.ACTIVE,
        areaDescription: area.description,
        teams: areaTeams,
      });
    });

    // 2. Add any remaining teams that belong to areas not in the areas array
    currentTeams.forEach((team) => {
      if (!processedAreaIds.has(team.ministryAreaId)) {
        processedAreaIds.add(team.ministryAreaId);
        const leftoverTeams = currentTeams
          .filter((sag) => sag.ministryAreaId === team.ministryAreaId)
          .map((t) => ({
            team: t,
            group: groups.find((g) => g.id === t.ministryGroupConfigId) || t.ministryGroupConfig,
          }));

        result.push({
          areaId: team.ministryAreaId,
          areaName: team.ministryArea?.name || 'Área desconocida',
          areaActive: team.ministryArea?.state === MinistryAreaStateEnum.ACTIVE,
          areaDescription: team.ministryArea?.description,
          teams: leftoverTeams,
        });
      }
    });

    return result;
  }, [areas, groups, currentTeams]);

  const toggleArea = (areaId: string) => {
    setExpandedAreaIds((prev) => {
      const next = new Set(prev);
      if (next.has(areaId)) {
        next.delete(areaId);
      } else {
        next.add(areaId);
      }
      return next;
    });
  };

  const allExpanded = useMemo(() => {
    if (areasWithTeams.length === 0) return false;
    return areasWithTeams.every((a) => expandedAreaIds.has(a.areaId));
  }, [areasWithTeams, expandedAreaIds]);

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedAreaIds(new Set());
    } else {
      setExpandedAreaIds(new Set(areasWithTeams.map((a) => a.areaId)));
    }
  };

  const handleOpenCreateModal = (areaId?: string) => {
    setSelectedModalAreaId(areaId);
    setModalOpen(true);
  };

  const handleToggleActive = async (team: IServiceAreaGroup) => {
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
        `Equipo ${!isCurrentlyActive ? 'activado' : 'desactivado'} correctamente`,
      );
    } catch (err: unknown) {
      const errMsg = typeof err === 'string' ? err : 'Error al cambiar estado del equipo';
      toast.error(errMsg);
    } finally {
      setTogglingId(null);
    }
  };

  /**
   * Generates all missing Area × Group combinations for the selected campus in bulk.
   */
  const handleBulkGenerate = async () => {
    if (activeAreas.length === 0 || activeGroups.length === 0) {
      toast.error('Se requieren áreas y grupos activos para generar combinaciones');
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
      toast.info('Todos los equipos posibles ya están creados para esta sede');
      return;
    }

    setIsBulkGenerating(true);
    let createdCount = 0;
    let skippedCount = 0;
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
        } catch (itemErr: unknown) {
          const is409 =
            typeof itemErr === 'object' &&
            itemErr !== null &&
            (
              (itemErr as { statusCode?: number }).statusCode === 409 ||
              (itemErr as { message?: string }).message?.toLowerCase().includes('already exists')
            );
          if (is409) {
            skippedCount++;
          } else {
            throw itemErr;
          }
        }
      }

      if (areas.length > 0) {
        await Promise.all(
          areas.map((area) => dispatch(GetServiceAreaGroups({ ministryAreaId: area.id }))),
        );
      }

      if (createdCount > 0) {
        toast.success(
          `${createdCount} combinacion${createdCount > 1 ? 'es' : ''} de equipos creada${createdCount > 1 ? 's' : ''} exitosamente` +
          (skippedCount > 0 ? ` (${skippedCount} ya existían)` : ''),
        );
      } else {
        toast.info('Todos los equipos posibles ya estaban creados para esta sede');
      }
    } catch {
      toast.error('Ocurrió un problema durante la generación en lote');
    } finally {
      setIsBulkGenerating(false);
    }
  };

  const isPrerequisitesLoading =
    (loadingAreas && areas.length === 0) ||
    (loadingGroups && groups.length === 0);

  const hasPrerequisites = areas.length > 0 && groups.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Prerequisites warning if no areas or groups (only when not loading) */}
      {!isPrerequisitesLoading && !hasPrerequisites && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 text-amber-800 shadow-xs">
          <AlertCircle className="shrink-0 mt-0.5 text-amber-600" size={18} />
          <div className="text-xs">
            <p className="font-bold mb-0.5">Configuración incompleta del ministerio</p>
            <p className="text-amber-700">
              Para generar equipos de servicio (Área × Grupo), primero debes registrar al menos un
              Área de Servicio y un Grupo en los pasos anteriores.
            </p>
            <div className="mt-2 flex gap-2">
              {groups.length === 0 && (
                <button
                  type="button"
                  onClick={() => onNavigateToTab?.('groups')}
                  className="font-bold underline text-amber-900 hover:text-amber-950 cursor-pointer"
                >
                  + Ir al Paso 1: Grupos
                </button>
              )}
              {areas.length === 0 && (
                <button
                  type="button"
                  onClick={() => onNavigateToTab?.('areas')}
                  className="font-bold underline text-amber-900 hover:text-amber-950 cursor-pointer"
                >
                  + Ir al Paso 2: Áreas
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Campus Selector Card - only if not already campus-scoped */}
      {!churchCampusId && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col gap-2">
          <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
            <div className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <MapPin size={12} />
            </div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Sede para Equipos
            </h3>
          </div>

          <Select
            value={selectedCampusId}
            onChange={(e) => setSelectedCampusId(e.target.value)}
            disabled={campusesState.loading}
          >
            <option value="" disabled>
              Seleccionar sede...
            </option>
            {campusOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      {/* Header Action Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
              <Network size={15} />
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
              {t('admin:ministry_structure.teams.header_title', {
                defaultValue: '3. Equipos de Servicio por Sede (Matriz Área × Grupo)',
              })}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {t('admin:ministry_structure.teams.header_desc', {
              defaultValue:
                'Combina cada Área con cada Grupo para formar los equipos de trabajo de la sede. Por ejemplo: Registro - Grupo 1, Cunas - Grupo 1.',
            })}
          </p>

          {/* Formula expected badge */}
          {activeAreas.length > 0 && activeGroups.length > 0 && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50/70 border border-emerald-100 text-[11px] text-emerald-800 font-medium">
              <Calculator size={11} className="text-emerald-600 shrink-0" />
              <span>
                {t('admin:ministry_structure.teams.formula_expected', {
                  areas: activeAreas.length,
                  groups: activeGroups.length,
                  teams: expectedTeamsCount,
                  defaultValue: `${activeAreas.length} áreas × ${activeGroups.length} grupos = ${expectedTeamsCount} equipos esperados`,
                })}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          {hasPrerequisites && missingCombinationsCount > 0 && (
            <Button
              onClick={handleBulkGenerate}
              variant="default"
              size="sm"
              className="text-xs gap-1.5 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white"
              loading={isBulkGenerating}
              loadingText="Generando..."
            >
              <Wand2 size={13} />{' '}
              {t('admin:ministry_structure.teams.btn_bulk_generate', {
                defaultValue: 'Generar Todos los Equipos',
              })}
            </Button>
          )}
          <Button
            onClick={() => handleOpenCreateModal()}
            size="sm"
            className="text-xs gap-1.5 py-2 px-3"
            disabled={!hasPrerequisites}
          >
            <Plus size={14} />{' '}
            {t('admin:ministry_structure.teams.btn_create_single', {
              defaultValue: 'Crear Uno a Uno',
            })}
          </Button>
        </div>
      </div>

      {/* State-aware Helper Banner: Complete vs Missing Combinations */}
      {hasPrerequisites && (
        <>
          {missingCombinationsCount === 0 && currentTeams.length > 0 ? (
            <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="shrink-0 mt-0.5 text-emerald-600" size={18} />
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">
                    {t('admin:ministry_structure.teams.all_complete_title', {
                      defaultValue: 'Todos los equipos están creados para esta sede',
                    })}
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                    {t('admin:ministry_structure.teams.all_complete_desc', {
                      count: currentTeams.length,
                      defaultValue: `La matriz de combinaciones está completa (${currentTeams.length} equipos). Ya puedes asignar a los líderes y voluntarios en cada equipo.`,
                    })}
                  </p>
                </div>
              </div>
              {onNavigateToTab && (
                <Button
                  onClick={() => onNavigateToTab('teams')}
                  variant="default"
                  size="sm"
                  className="text-xs gap-1.5 shrink-0 self-end sm:self-center bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  <span>
                    {t('admin:ministry_structure.teams.btn_go_to_roster', {
                      defaultValue: 'Ir a Equipos y Plantilla',
                    })}
                  </span>
                  <ArrowRight size={13} />
                </Button>
              )}
            </div>
          ) : missingCombinationsCount > 0 ? (
            <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start gap-2.5">
                <Wand2 className="shrink-0 mt-0.5 text-amber-600" size={18} />
                <div>
                  <h4 className="text-xs font-bold text-amber-950">
                    {t('admin:ministry_structure.teams.missing_combinations_title', {
                      defaultValue: 'Hay combinaciones de equipos pendientes por generar',
                    })}
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                    {t('admin:ministry_structure.teams.missing_combinations_desc', {
                      defaultValue: `Detectamos áreas o grupos sin su equipo correspondiente en esta sede (${missingCombinationsCount} faltantes). Haz clic en 'Generar Todos' para crearlos en lote.`,
                    })}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleBulkGenerate}
                variant="default"
                size="sm"
                className="text-xs gap-1.5 shrink-0 self-end sm:self-center bg-amber-700 hover:bg-amber-800 text-white"
                loading={isBulkGenerating}
              >
                <Wand2 size={13} />
                <span>
                  {t('admin:ministry_structure.teams.btn_bulk_generate', {
                    defaultValue: 'Generar Todos los Equipos',
                  })}
                </span>
              </Button>
            </div>
          ) : null}
        </>
      )}

      {/* Expand / Collapse All controller */}
      {areasWithTeams.length > 1 && currentTeams.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-slate-500 font-medium">
            {areasWithTeams.length}{' '}
            {areasWithTeams.length === 1 ? 'área de servicio' : 'áreas de servicio'} &bull;{' '}
            {currentTeams.length} {currentTeams.length === 1 ? 'equipo' : 'equipos'}
          </span>
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronsUpDown size={14} />
            <span>{allExpanded ? 'Colapsar todas' : 'Expandir todas'}</span>
          </button>
        </div>
      )}

      {/* Teams list */}
      {(loadingServiceAreaGroups || isPrerequisitesLoading) && currentTeams.length === 0 ? (
        <CellListSkeleton count={4} />
      ) : currentTeams.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200/90 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <Inbox size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">No hay equipos en esta sede</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Genera las combinaciones de Área × Grupo para asignar servidores.
            </p>
          </div>
          {hasPrerequisites && (
            <div className="flex gap-2 mt-2">
              <Button
                onClick={handleBulkGenerate}
                variant="default"
                size="sm"
                className="text-xs gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white"
                loading={isBulkGenerating}
              >
                <Wand2 size={13} /> Generar Todos los Equipos
              </Button>
              <Button onClick={() => handleOpenCreateModal()} size="sm" className="text-xs gap-1">
                <Plus size={13} /> Crear Uno a Uno
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {areasWithTeams.map((areaItem) => {
            const isExpanded = expandedAreaIds.has(areaItem.areaId);
            const activeTeamsCount = areaItem.teams.filter(
              (t) => t.team.state === ServiceAreaGroupStateEnum.ACTIVE,
            ).length;
            const isAreaComplete =
              activeGroups.length > 0 && areaItem.teams.length >= activeGroups.length;

            return (
              <div
                key={areaItem.areaId}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all"
              >
                {/* Accordion Header */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleArea(areaItem.areaId)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleArea(areaItem.areaId);
                    }
                  }}
                  className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-2.5 text-left hover:bg-slate-50/60 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center shrink-0">
                      <Layers size={17} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                          {areaItem.areaName}
                        </h3>
                        {!areaItem.areaActive && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                            <XCircle size={9} /> Inactiva
                          </span>
                        )}

                        {/* Progress / Completeness Badge */}
                        {activeGroups.length > 0 && (
                          <span
                            className={clsx(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0',
                              isAreaComplete
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                                : 'bg-amber-50 text-amber-700 border border-amber-200/80',
                            )}
                          >
                            {isAreaComplete ? (
                              <>
                                <CheckCircle2 size={10} />{' '}
                                {t('admin:ministry_structure.teams.complete_badge', {
                                  defaultValue: 'Completo',
                                })}
                              </>
                            ) : (
                              <>
                                <AlertCircle size={10} />{' '}
                                {t('admin:ministry_structure.teams.incomplete_badge', {
                                  count: Math.max(0, activeGroups.length - areaItem.teams.length),
                                  defaultValue: `Faltan ${Math.max(
                                    0,
                                    activeGroups.length - areaItem.teams.length,
                                  )} grupos`,
                                })}
                              </>
                            )}
                          </span>
                        )}
                      </div>

                      {areaItem.areaDescription ? (
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {areaItem.areaDescription}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {t('admin:ministry_structure.teams.groups_progress', {
                            created: areaItem.teams.length,
                            total: activeGroups.length,
                            defaultValue: `${areaItem.teams.length} de ${activeGroups.length} grupos creados`,
                          })}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={clsx(
                        'inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold shrink-0',
                        areaItem.teams.length > 0
                          ? 'bg-teal-50 text-teal-700 border border-teal-200/70'
                          : 'bg-slate-100 text-slate-500 border border-slate-200',
                      )}
                    >
                      {areaItem.teams.length}{' '}
                      {areaItem.teams.length === 1 ? 'grupo' : 'grupos'}
                      {areaItem.teams.length > 0 && activeTeamsCount < areaItem.teams.length && (
                        <span className="ml-1 text-[9.5px] text-teal-600 font-normal">
                          ({activeTeamsCount} act.)
                        </span>
                      )}
                    </span>

                    {hasPrerequisites && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCreateModal(areaItem.areaId);
                        }}
                        title={`Agregar grupo a ${areaItem.areaName}`}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                      >
                        <Plus size={15} />
                      </button>
                    )}

                    <div
                      className={clsx(
                        'w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 transition-transform duration-200',
                        isExpanded && 'rotate-180 text-slate-700',
                      )}
                    >
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </div>

                {/* Desplegable de Grupos: Lista compacta unificada */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-2.5 sm:p-3">
                    {areaItem.teams.length === 0 ? (
                      <p className="text-xs text-slate-400 py-2.5 text-center">
                        No hay combinaciones de grupos configuradas para esta área en esta sede.
                      </p>
                    ) : (
                      <div className="bg-white rounded-xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden shadow-2xs">
                        {areaItem.teams.map(({ team, group }) => {
                          const isToggling = togglingId === team.id;
                          const isTeamActive = team.state === ServiceAreaGroupStateEnum.ACTIVE;

                          return (
                            <div
                              key={team.id}
                              className="px-3 py-2 sm:py-2.5 flex items-center justify-between gap-2.5 hover:bg-slate-50/70 transition-colors"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100/80 flex items-center justify-center shrink-0">
                                  <Users size={12} />
                                </div>
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                    {group?.name ?? 'Grupo desconocido'}
                                  </span>
                                  <span
                                    className={clsx(
                                      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-bold shrink-0',
                                      isTeamActive
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                                        : 'bg-slate-100 text-slate-600 border border-slate-200',
                                    )}
                                  >
                                    {isTeamActive ? (
                                      <>
                                        <CheckCircle2 size={9} /> Activo
                                      </>
                                    ) : (
                                      <>
                                        <XCircle size={9} /> Inactivo
                                      </>
                                    )}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleToggleActive(team)}
                                  disabled={isToggling}
                                  className={clsx(
                                    'text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer shrink-0',
                                    isTeamActive
                                      ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                      : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100',
                                  )}
                                >
                                  {isToggling ? (
                                    <Loader2 className="animate-spin" size={12} />
                                  ) : isTeamActive ? (
                                    'Desactivar'
                                  ) : (
                                    'Activar'
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ServiceAreaGroupModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        areas={areas}
        groups={groups}
        campuses={campuses}
        selectedCampusId={selectedCampusId}
        defaultAreaId={selectedModalAreaId}
        onSuccess={fetchAllTeams}
      />
    </div>
  );
};

export default ServiceAreaGroupsTab;
