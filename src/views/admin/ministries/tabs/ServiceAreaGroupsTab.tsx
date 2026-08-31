import React, { useEffect, useMemo, useState } from 'react';
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
import { IServiceAreaGroup } from '@/libs/models';
import ServiceAreaGroupModal from '../components/ServiceAreaGroupModal';
import { toast } from 'sonner';
import clsx from 'clsx';

interface ServiceAreaGroupsTabProps {
  ministryId: string;
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
  onNavigateToTab,
}) => {
  const dispatch = useAppDispatch();

  const campusesState = useAppSelector((state) => state.churchCampusSlice);
  const { areasByMinistry, groupsByMinistry, serviceAreaGroups, loadingServiceAreaGroups } =
    useAppSelector((state) => state.ministrySlice);

  const [selectedCampusId, setSelectedCampusId] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
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

  // Set default campus
  useEffect(() => {
    if (!selectedCampusId && campuses.length > 0) {
      setSelectedCampusId(campuses[0].id);
    }
  }, [campuses, selectedCampusId]);

  // Load service area groups for selected campus
  useEffect(() => {
    if (selectedCampusId) {
      dispatch(GetServiceAreaGroups());
    }
  }, [dispatch, selectedCampusId]);

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

      // Always refresh from the API after bulk generation
      await dispatch(GetServiceAreaGroups());

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

      {/* Campus Selector Card */}
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

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Equipos de Servicio (Área × Grupo)</h2>
          <p className="text-xs text-gray-500">
            {currentTeams.length}{' '}
            {currentTeams.length === 1 ? 'equipo configurado' : 'equipos configurados'} en esta sede
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
            onClick={() => setModalOpen(true)}
            size="sm"
            className="text-xs gap-1.5 py-1.5"
            disabled={!hasPrerequisites}
          >
            <Plus size={14} /> Crear Equipo
          </Button>
        </div>
      </div>

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
              <Button onClick={() => setModalOpen(true)} size="sm" className="text-xs gap-1">
                <Plus size={13} /> Crear Uno a Uno
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {currentTeams.map((team) => {
            const area = areas.find((a) => a.id === team.ministryAreaId) || team.ministryArea;
            const group =
              groups.find((g) => g.id === team.ministryGroupConfigId) || team.ministryGroupConfig;
            const isToggling = togglingId === team.id;

            return (
              <div
                key={team.id}
                className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex items-center justify-between gap-3 hover:border-gray-300 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center shrink-0">
                    <Network size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-gray-900">
                        {area?.name ?? 'Área desconocida'}
                      </span>
                      <span className="text-gray-300 font-light">×</span>
                      <span className="text-sm font-bold text-primary">
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
                      'text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all',
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

      <ServiceAreaGroupModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        areas={areas}
        groups={groups}
        campuses={campuses}
        selectedCampusId={selectedCampusId}
      />
    </div>
  );
};

export default ServiceAreaGroupsTab;
