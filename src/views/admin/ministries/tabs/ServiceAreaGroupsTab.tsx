import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Network,
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
} from 'lucide-react';
import Button from '@/components/ui/Button';
import SelectSearch from '@/components/ui/SelectSearch';
import { CellListSkeleton } from '@/components/ui/DetailSkeleton';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetChurchCampuses } from '@/libs/state/redux/thunks/church/church.thunk';
import {
  CreateServiceAreaGroup,
  GetServiceAreaGroups,
  UpdateServiceAreaGroup,
} from '@/libs/state/redux/thunks/church/ministry.thunk';
import { IMinistryGroupConfig, IServiceAreaGroup } from '@/libs/models';
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
  onNavigateToTab,
}) => {
  const dispatch = useAppDispatch();

  const campusesState = useAppSelector((state) => state.churchCampusSlice);
  const { areasByMinistry, groupsByMinistry, serviceAreaGroups, loadingServiceAreaGroups } =
    useAppSelector((state) => state.ministrySlice);

  const [selectedCampusId, setSelectedCampusId] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedModalAreaId, setSelectedModalAreaId] = useState<string | undefined>(undefined);
  const [expandedAreaIds, setExpandedAreaIds] = useState<Set<string>>(new Set());
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const areas = areasByMinistry[ministryId] || [];
  const groups = groupsByMinistry[ministryId] || [];
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
    if (areas.length > 0) {
      areas.forEach((area) => {
        dispatch(GetServiceAreaGroups({ ministryAreaId: area.id }));
      });
    }
  }, [dispatch, areas]);

  useEffect(() => {
    if (selectedCampusId && areas.length > 0) {
      fetchAllTeams();
    }
  }, [selectedCampusId, areas, fetchAllTeams]);

  const campusOptions = useMemo(() => {
    return campuses.map((c) => ({
      id: c.id,
      name: c.name,
    }));
  }, [campuses]);

  // Filter combinations relevant to this ministry and this campus
  const currentTeams = useMemo(() => {
    const areaIdSet = new Set(areas.map((a) => a.id));
    return serviceAreaGroups.filter((sag) => {
      const matchCampus = sag.churchCampusId === selectedCampusId;
      const matchArea = areaIdSet.has(sag.ministryAreaId);
      return matchCampus && matchArea;
    });
  }, [serviceAreaGroups, selectedCampusId, areas]);

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
        areaActive: area.active,
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
          areaActive: team.ministryArea?.active ?? true,
          areaDescription: team.ministryArea?.description,
          teams: leftoverTeams,
        });
      }
    });

    return result;
  }, [areas, groups, currentTeams]);

  // Expand all areas by default when loaded
  useEffect(() => {
    if (areasWithTeams.length > 0) {
      setExpandedAreaIds((prev) => {
        if (prev.size === 0) {
          return new Set(areasWithTeams.map((a) => a.areaId));
        }
        return prev;
      });
    }
  }, [areasWithTeams]);

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
    try {
      await dispatch(
        UpdateServiceAreaGroup({
          id: team.id,
          active: !team.active,
        }),
      ).unwrap();
      toast.success(
        `Equipo ${!team.active ? 'activado' : 'desactivado'} correctamente`,
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
    const activeAreas = areas.filter((a) => a.active);
    const activeGroups = groups.filter((g) => g.active);

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
          // 409 = already exists in another session/tab — skip silently
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

      // Always refresh from the API after bulk generation for all areas
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
    } catch (err) {
      toast.error('Ocurrió un problema durante la generación en lote');
    } finally {
      setIsBulkGenerating(false);
    }
  };

  const hasPrerequisites = areas.length > 0 && groups.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Prerequisites warning if no areas or groups */}
      {!hasPrerequisites && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 text-amber-800 shadow-xs">
          <AlertCircle className="shrink-0 mt-0.5 text-amber-600" size={18} />
          <div className="text-xs">
            <p className="font-bold mb-0.5">Configuración incompleta del ministerio</p>
            <p className="text-amber-700">
              Para generar equipos de servicio (Área × Grupo), primero debes registrar al menos un
              Área de Servicio y un Grupo en las pestañas anteriores.
            </p>
            <div className="mt-2 flex gap-2">
              {areas.length === 0 && (
                <button
                  type="button"
                  onClick={() => onNavigateToTab?.('areas')}
                  className="font-bold underline text-amber-900 hover:text-amber-950"
                >
                  + Ir a Áreas
                </button>
              )}
              {groups.length === 0 && (
                <button
                  type="button"
                  onClick={() => onNavigateToTab?.('groups')}
                  className="font-bold underline text-amber-900 hover:text-amber-950"
                >
                  + Ir a Grupos
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Campus Selector Card - only if not already campus-scoped */}
      {!churchCampusId && (
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col gap-2">
          <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
            <div className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <MapPin size={12} />
            </div>
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
              Sede para Equipos
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

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Equipos de Servicio por Área</h2>
          <p className="text-xs text-gray-500">
            {currentTeams.length}{' '}
            {currentTeams.length === 1 ? 'combinación configurada' : 'combinaciones configuradas'} en esta sede
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasPrerequisites && (
            <Button
              onClick={handleBulkGenerate}
              variant="default"
              size="sm"
              className="text-xs gap-1.5 py-1.5"
              loading={isBulkGenerating}
              loadingText="Generando..."
            >
              <Wand2 size={13} /> Generar Todos
            </Button>
          )}
          <Button
            onClick={() => handleOpenCreateModal()}
            size="sm"
            className="text-xs gap-1.5 py-1.5"
            disabled={!hasPrerequisites}
          >
            <Plus size={14} /> Crear Equipo
          </Button>
        </div>
      </div>

      {/* Expand / Collapse All controller */}
      {areasWithTeams.length > 1 && currentTeams.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-gray-500 font-medium">
            {areasWithTeams.length} {areasWithTeams.length === 1 ? 'área de servicio' : 'áreas de servicio'}
          </span>
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronsUpDown size={14} />
            <span>{allExpanded ? 'Colapsar todas' : 'Expandir todas'}</span>
          </button>
        </div>
      )}

      {/* Teams list */}
      {loadingServiceAreaGroups && currentTeams.length === 0 ? (
        <CellListSkeleton count={4} />
      ) : currentTeams.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-gray-200/80 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-gray-400">
            <Inbox size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">No hay equipos en esta sede</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Genera las combinaciones de Área × Grupo para asignar servidores y maestros.
            </p>
          </div>
          {hasPrerequisites && (
            <div className="flex gap-2 mt-2">
              <Button
                onClick={handleBulkGenerate}
                variant="default"
                size="sm"
                className="text-xs gap-1"
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
            const activeTeamsCount = areaItem.teams.filter((t) => t.team.active).length;

            return (
              <div
                key={areaItem.areaId}
                className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden transition-all"
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
                  className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left hover:bg-slate-50/60 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center shrink-0">
                      <Layers size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-gray-900 truncate">
                          {areaItem.areaName}
                        </h3>
                        {!areaItem.areaActive && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200 shrink-0">
                            <XCircle size={10} /> Área Inactiva
                          </span>
                        )}
                      </div>
                      {areaItem.areaDescription ? (
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {areaItem.areaDescription}
                        </p>
                      ) : (
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {areaItem.teams.length === 0
                            ? 'Sin grupos configurados'
                            : `${areaItem.teams.length} ${areaItem.teams.length === 1 ? 'grupo configurado' : 'grupos configurados'}`}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={clsx(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0',
                        areaItem.teams.length > 0
                          ? 'bg-teal-50 text-teal-700 border border-teal-200/70'
                          : 'bg-slate-100 text-slate-500 border border-slate-200',
                      )}
                    >
                      {areaItem.teams.length} {areaItem.teams.length === 1 ? 'grupo' : 'grupos'}
                      {areaItem.teams.length > 0 && activeTeamsCount < areaItem.teams.length && (
                        <span className="ml-1 text-[10px] text-teal-600 font-normal">
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
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                      >
                        <Plus size={16} />
                      </button>
                    )}

                    <div
                      className={clsx(
                        'w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 transition-transform duration-200',
                        isExpanded && 'rotate-180 text-gray-700',
                      )}
                    >
                      <ChevronDown size={18} />
                    </div>
                  </div>
                </div>

                {/* Desplegable de Grupos */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-slate-50/50 p-3 sm:p-4">
                    {areaItem.teams.length === 0 ? (
                      <div className="p-4 rounded-xl border border-dashed border-gray-200 bg-white text-center flex flex-col items-center justify-center gap-2">
                        <p className="text-xs text-gray-500">
                          No hay grupos asignados a <strong className="text-gray-700">{areaItem.areaName}</strong> en esta sede.
                        </p>
                        {hasPrerequisites && (
                          <Button
                            onClick={() => handleOpenCreateModal(areaItem.areaId)}
                            size="sm"
                            variant="default"
                            className="text-xs py-1 px-3 gap-1 mt-1"
                          >
                            <Plus size={13} /> Asociar Grupo
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {areaItem.teams.map(({ team, group }) => {
                          const isToggling = togglingId === team.id;
                          return (
                            <div
                              key={team.id}
                              className="bg-white rounded-xl p-3 border border-gray-200/80 shadow-2xs flex items-center justify-between gap-3 hover:border-gray-300 transition-all"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                                  <Users size={15} />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                                      {group?.name ?? 'Grupo desconocido'}
                                    </span>
                                    <span
                                      className={clsx(
                                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0',
                                        team.active
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                                          : 'bg-gray-100 text-gray-600 border border-gray-200',
                                      )}
                                    >
                                      {team.active ? (
                                        <>
                                          <CheckCircle2 size={10} /> Activo
                                        </>
                                      ) : (
                                        <>
                                          <XCircle size={10} /> Inactivo
                                        </>
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleToggleActive(team)}
                                  disabled={isToggling}
                                  className={clsx(
                                    'text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer',
                                    team.active
                                      ? 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                      : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100',
                                  )}
                                >
                                  {isToggling ? (
                                    <Loader2 className="animate-spin" size={13} />
                                  ) : team.active ? (
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
