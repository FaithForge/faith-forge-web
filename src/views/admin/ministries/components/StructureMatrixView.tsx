import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  XCircle,
  Plus,
  Wand2,
  Layers,
  Search,
  Sparkles,
  Loader2,
  Stethoscope,
  ShieldCheck,
  Check,
  Edit2,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  IMinistryArea,
  IMinistryGroupConfig,
  IServiceAreaGroup,
  MinistryAreaScope,
  MinistryAreaStateEnum,
  MinistryGroupConfigStateEnum,
  ServiceAreaGroupStateEnum,
} from '@/libs/models';
import { useGetKidGroupsQuery } from '@/libs/state/redux/api/kidChurchApi';
import { useMinistryTerm } from '@/libs/hooks/useTerm';
import clsx from 'clsx';

interface StructureMatrixViewProps {
  ministryId: string;
  areas: IMinistryArea[];
  groups: IMinistryGroupConfig[];
  currentTeams: IServiceAreaGroup[];
  selectedCampusId: string;
  onEditArea?: (area: IMinistryArea) => void;
  onEditGroup?: (group: IMinistryGroupConfig) => void;
  onToggleTeam: (team: IServiceAreaGroup) => Promise<void>;
  onCreateTeam: (areaId: string, groupId: string) => Promise<void>;
  onBulkGenerate: () => Promise<void>;
  isBulkGenerating: boolean;
  togglingId: string | null;
}

/**
 * Interactive Matrix Perspective (Salones × Grupos)
 * Presents an executive grid where rows are Areas/Classrooms and columns are Shift Groups.
 *
 * @param {StructureMatrixViewProps} props - Component properties.
 * @returns {JSX.Element} Rendered matrix view.
 */
export const StructureMatrixView: React.FC<StructureMatrixViewProps> = ({
  ministryId,
  areas,
  groups,
  currentTeams,
  onEditArea,
  onEditGroup,
  onToggleTeam,
  onCreateTeam,
  onBulkGenerate,
  isBulkGenerating,
  togglingId,
}) => {
  const { t } = useTranslation('admin');
  const [searchTerm, setSearchTerm] = useState('');
  const [creatingKey, setCreatingKey] = useState<string | null>(null);

  const { data: kidGroups = [] } = useGetKidGroupsQuery();
  const regTerm = useMinistryTerm(ministryId, 'registration', 'Registro');

  // Sorted items
  const sortedGroups = useMemo(() => {
    return [...groups]
      .filter((g) => g.state !== MinistryGroupConfigStateEnum.DELETED)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [groups]);

  const sortedAreas = useMemo(() => {
    return [...areas]
      .filter((a) => a.state !== MinistryAreaStateEnum.DELETED)
      .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  }, [areas]);

  // Filtered areas by search
  const filteredAreas = useMemo(() => {
    if (!searchTerm.trim()) return sortedAreas;
    const term = searchTerm.toLowerCase();
    return sortedAreas.filter((a) => a.name.toLowerCase().includes(term));
  }, [sortedAreas, searchTerm]);

  // Lookup map: `${areaId}-${groupId}` => IServiceAreaGroup
  const teamByAreaAndGroup = useMemo(() => {
    const map = new Map<string, IServiceAreaGroup>();
    currentTeams.forEach((team) => {
      if (team.state !== ServiceAreaGroupStateEnum.DELETED) {
        map.set(`${team.ministryAreaId}-${team.ministryGroupConfigId}`, team);
      }
    });
    return map;
  }, [currentTeams]);

  // Total matrix metrics
  const activeAreas = useMemo(
    () => sortedAreas.filter((a) => a.state === MinistryAreaStateEnum.ACTIVE),
    [sortedAreas],
  );
  const activeGroups = useMemo(
    () => sortedGroups.filter((g) => g.state === MinistryGroupConfigStateEnum.ACTIVE),
    [sortedGroups],
  );

  const totalPossible = activeAreas.length * activeGroups.length;

  const totalActiveTeams = useMemo(() => {
    let count = 0;
    activeAreas.forEach((a) => {
      activeGroups.forEach((g) => {
        const team = teamByAreaAndGroup.get(`${a.id}-${g.id}`);
        if (team && team.state === ServiceAreaGroupStateEnum.ACTIVE) {
          count++;
        }
      });
    });
    return count;
  }, [activeAreas, activeGroups, teamByAreaAndGroup]);

  const missingCombinationsCount = useMemo(() => {
    let count = 0;
    activeAreas.forEach((a) => {
      activeGroups.forEach((g) => {
        if (!teamByAreaAndGroup.has(`${a.id}-${g.id}`)) {
          count++;
        }
      });
    });
    return count;
  }, [activeAreas, activeGroups, teamByAreaAndGroup]);

  const coveragePercent =
    totalPossible > 0 ? Math.round((totalActiveTeams / totalPossible) * 100) : 0;

  const handleCellClick = async (areaId: string, groupId: string) => {
    const key = `${areaId}-${groupId}`;
    const existing = teamByAreaAndGroup.get(key);
    if (existing) {
      await onToggleTeam(existing);
    } else {
      setCreatingKey(key);
      try {
        await onCreateTeam(areaId, groupId);
      } finally {
        setCreatingKey(null);
      }
    }
  };

  const getClassroomNames = (area: IMinistryArea): string[] => {
    const ids: string[] = [];
    if (area.kidGroupId) ids.push(area.kidGroupId);
    if (Array.isArray(area.kidGroupIds)) {
      area.kidGroupIds.forEach((id) => {
        if (!ids.includes(id)) ids.push(id);
      });
    }
    if (Array.isArray(area.kidGroups)) {
      area.kidGroups.forEach((kg: any) => {
        const id = kg.kidGroupId || kg.id;
        if (id && !ids.includes(id)) ids.push(id);
      });
    }
    return ids
      .map((id) => kidGroups.find((g) => g.id === id)?.name)
      .filter(Boolean) as string[];
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Matrix Controls & Summary Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-extrabold text-slate-900">
                {t('admin:ministry_structure.matrix.title', {
                  defaultValue: 'Matriz de Cobertura (Áreas × Grupos)',
                })}
              </h3>
              <span
                className={clsx(
                  'px-2 py-0.5 rounded-full text-[11px] font-bold border',
                  coveragePercent === 100
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200',
                )}
              >
                {coveragePercent}% Cobertura ({totalActiveTeams}/{totalPossible})
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('admin:ministry_structure.matrix.subtitle', {
                defaultValue:
                  'Cuadrícula interactiva que muestra qué grupos están habilitados en cada área de servicio.',
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {missingCombinationsCount > 0 && (
            <Button
              onClick={onBulkGenerate}
              size="sm"
              className="text-xs gap-1.5 py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white"
              loading={isBulkGenerating}
            >
              <Wand2 size={13} />
              <span>
                {t('admin:ministry_structure.matrix.btn_complete_matrix', {
                  defaultValue: 'Completar matriz automáticamente',
                })}
              </span>
            </Button>
          )}

          <div className="w-44 sm:w-56">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar área..."
              leftIcon={<Search size={14} className="text-slate-400" />}
              className="text-xs py-1.5"
            />
          </div>
        </div>
      </div>

      {/* Interactive Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/90 text-xs font-bold text-slate-700">
                <th className="py-3 px-4 min-w-[220px]">
                  {t('admin:ministry_structure.matrix.col_area', {
                    defaultValue: 'Área de Servicio',
                  })}
                </th>
                {sortedGroups.map((group) => (
                  <th
                    key={group.id}
                    className="py-3 px-3 text-center min-w-[120px] border-l border-slate-200/60"
                  >
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1 justify-center">
                        <span className="font-extrabold text-slate-900">{group.name}</span>
                        {onEditGroup && (
                          <button
                            type="button"
                            onClick={() => onEditGroup(group)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
                            title="Editar grupo"
                          >
                            <Edit2 size={11} />
                          </button>
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded mt-0.5 border border-purple-100">
                        Turno {group.position}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="py-3 px-4 text-center min-w-[110px] border-l border-slate-200/60">
                  {t('admin:ministry_structure.matrix.col_coverage', {
                    defaultValue: 'Cobertura',
                  })}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredAreas.length === 0 ? (
                <tr>
                  <td
                    colSpan={sortedGroups.length + 2}
                    className="py-8 text-center text-slate-400 font-medium"
                  >
                    No se encontraron áreas configuradas.
                  </td>
                </tr>
              ) : (
                filteredAreas.map((area) => {
                  const classroomNames = getClassroomNames(area);

                  // Count active groups for this area
                  const areaActiveGroups = sortedGroups.filter((g) => {
                    const team = teamByAreaAndGroup.get(`${area.id}-${g.id}`);
                    return team && team.state === ServiceAreaGroupStateEnum.ACTIVE;
                  }).length;

                  const isFullyCovered =
                    sortedGroups.length > 0 && areaActiveGroups === sortedGroups.length;

                  return (
                    <tr
                      key={area.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      {/* Area Name & Metadata Column */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={clsx(
                                'w-8 h-8 rounded-lg border flex items-center justify-center shrink-0',
                                area.scope === MinistryAreaScope.KID_MEDICAL
                                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                                  : area.scope === MinistryAreaScope.KID_REGISTRATION
                                  ? 'bg-amber-50 text-amber-600 border-amber-200'
                                  : 'bg-teal-50 text-teal-700 border-teal-200',
                              )}
                            >
                              {area.scope === MinistryAreaScope.KID_MEDICAL ? (
                                <Stethoscope size={15} />
                              ) : area.scope === MinistryAreaScope.KID_REGISTRATION ? (
                                <ShieldCheck size={15} />
                              ) : (
                                <Layers size={15} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-extrabold text-slate-900 block truncate">
                                {area.name}
                              </span>
                              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                {classroomNames.length > 0 &&
                                  classroomNames.some(
                                    (n) => n.trim().toLowerCase() !== area.name.trim().toLowerCase(),
                                  ) && (
                                    <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-1.5 py-0.2 rounded border border-purple-100 truncate max-w-[150px]">
                                      {classroomNames.join(', ')}
                                    </span>
                                  )}
                                {area.scope === MinistryAreaScope.KID_REGISTRATION && (
                                  <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-100">
                                    {regTerm}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {onEditArea && (
                            <button
                              type="button"
                              onClick={() => onEditArea(area)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                              title="Editar área"
                            >
                              <Edit2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Group Cells */}
                      {sortedGroups.map((group) => {
                        const cellKey = `${area.id}-${group.id}`;
                        const team = teamByAreaAndGroup.get(cellKey);
                        const isToggling = togglingId === team?.id;
                        const isCreating = creatingKey === cellKey;
                        const isActive = team && team.state === ServiceAreaGroupStateEnum.ACTIVE;

                        return (
                          <td
                            key={group.id}
                            className="py-2.5 px-3 text-center border-l border-slate-200/60 align-middle"
                          >
                            {team ? (
                              <button
                                type="button"
                                onClick={() => handleCellClick(area.id, group.id)}
                                disabled={isToggling}
                                title={
                                  isActive
                                    ? `Activo en ${group.name} (Clic para desactivar)`
                                    : `Inactivo en ${group.name} (Clic para activar)`
                                }
                                className={clsx(
                                  'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer w-full max-w-[110px]',
                                  isActive
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/90 hover:bg-emerald-100 shadow-2xs'
                                    : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200/70',
                                )}
                              >
                                {isToggling ? (
                                  <Loader2 size={12} className="animate-spin text-slate-500" />
                                ) : isActive ? (
                                  <>
                                    <Check size={12} className="text-emerald-600 stroke-[3]" />
                                    <span>Activo</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle size={12} className="text-slate-400" />
                                    <span>Inactivo</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleCellClick(area.id, group.id)}
                                disabled={isCreating}
                                title={`Asignar ${area.name} al ${group.name}`}
                                className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border border-dashed border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-all cursor-pointer w-full max-w-[110px]"
                              >
                                {isCreating ? (
                                  <Loader2 size={12} className="animate-spin text-purple-600" />
                                ) : (
                                  <>
                                    <Plus size={11} />
                                    <span>Asignar</span>
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        );
                      })}

                      {/* Coverage Progress Column */}
                      <td className="py-2.5 px-4 text-center border-l border-slate-200/60 align-middle">
                        <span
                          className={clsx(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold border',
                            isFullyCovered
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200',
                          )}
                        >
                          {isFullyCovered && <CheckCircle2 size={11} className="text-emerald-600" />}
                          <span>
                            {areaActiveGroups}/{sortedGroups.length}
                          </span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StructureMatrixView;
