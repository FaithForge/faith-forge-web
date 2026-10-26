import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Layers,
  Edit2,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  ShieldCheck,
  Stethoscope,
  Loader2,
  Check,
  Users2,
} from 'lucide-react';
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
import { useKidsTerm, useMinistryTerm } from '@/libs/hooks/useTerm';
import clsx from 'clsx';

interface StructureAreasViewProps {
  ministryId: string;
  areas: IMinistryArea[];
  groups: IMinistryGroupConfig[];
  currentTeams: IServiceAreaGroup[];
  onEditArea: (area: IMinistryArea) => void;
  onToggleTeam: (team: IServiceAreaGroup) => Promise<void>;
  onCreateTeam: (areaId: string, groupId: string) => Promise<void>;
  togglingId: string | null;
}

/**
 * Perspective: Por Salones y Áreas.
 * Each area card presents its details and its active shift groups directly embedded.
 *
 * @param {StructureAreasViewProps} props - Component properties.
 * @returns {JSX.Element} Rendered areas perspective.
 */
export const StructureAreasView: React.FC<StructureAreasViewProps> = ({
  ministryId,
  areas,
  groups,
  currentTeams,
  onEditArea,
  onToggleTeam,
  onCreateTeam,
  togglingId,
}) => {
  const { t } = useTranslation('admin');
  const [searchTerm, setSearchTerm] = useState('');
  const [creatingKey, setCreatingKey] = useState<string | null>(null);

  const { data: kidGroups = [] } = useGetKidGroupsQuery();
  const regTerm = useMinistryTerm(ministryId, 'registration', 'Registro');
  const moduleAlias = useMinistryTerm(ministryId, 'module_alias', 'Ministerio de Niños');

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

  const handleGroupChipClick = async (areaId: string, groupId: string) => {
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

  return (
    <div className="flex flex-col gap-3">
      {/* Search and count bar */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-xs flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-slate-700">
          {filteredAreas.length}{' '}
          {filteredAreas.length === 1 ? 'área de servicio' : 'áreas de servicio'}
        </span>
        <div className="w-52 sm:w-64">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre..."
            leftIcon={<Search size={14} className="text-slate-400" />}
            className="text-xs py-1.5"
          />
        </div>
      </div>

      {/* Cards list */}
      {filteredAreas.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200/90 text-center text-slate-400 text-xs shadow-xs">
          No se encontraron áreas con los filtros aplicados.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredAreas.map((area) => {
            const classroomNames = getClassroomNames(area);
            const isAreaActive = area.state === MinistryAreaStateEnum.ACTIVE;

            // Count how many groups are active for this area
            const activeTeamsForArea = sortedGroups.filter((g) => {
              const team = teamByAreaAndGroup.get(`${area.id}-${g.id}`);
              return team && team.state === ServiceAreaGroupStateEnum.ACTIVE;
            }).length;

            const isAllGroupsCovered =
              sortedGroups.length > 0 && activeTeamsForArea === sortedGroups.length;

            return (
              <div
                key={area.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col gap-3 hover:border-slate-300 transition-all"
              >
                {/* Area Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={clsx(
                        'w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 mt-0.5',
                        area.scope === MinistryAreaScope.KID_MEDICAL
                          ? 'bg-rose-50 text-rose-600 border-rose-200'
                          : area.scope === MinistryAreaScope.KID_REGISTRATION
                          ? 'bg-amber-50 text-amber-600 border-amber-200'
                          : 'bg-teal-50 text-teal-700 border-teal-200',
                      )}
                    >
                      {area.scope === MinistryAreaScope.KID_MEDICAL ? (
                        <Stethoscope size={18} />
                      ) : area.scope === MinistryAreaScope.KID_REGISTRATION ? (
                        <ShieldCheck size={18} />
                      ) : (
                        <Layers size={18} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-extrabold text-slate-900 truncate">
                          {area.name}
                        </h3>

                        <span
                          className={clsx(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0',
                            isAreaActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200',
                          )}
                        >
                          {isAreaActive ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                          <span>{isAreaActive ? 'Activa' : 'Inactiva'}</span>
                        </span>

                        {/* Scope / Classroom badge */}
                        {classroomNames.length > 0 &&
                          classroomNames.some(
                            (n) => n.trim().toLowerCase() !== area.name.trim().toLowerCase(),
                          ) && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0" />
                              <span>{classroomNames.join(', ')}</span>
                            </span>
                          )}

                        {area.scope === MinistryAreaScope.KID_REGISTRATION && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <ShieldCheck size={10} /> {regTerm} (Check-in)
                          </span>
                        )}

                        {area.scope === MinistryAreaScope.KID_GROUP_MANAGEMENT && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <ShieldCheck size={10} /> {moduleAlias}
                          </span>
                        )}

                        {area.requiresSupervisor === false && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Supervisión opcional
                          </span>
                        )}
                      </div>

                      {area.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {area.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onEditArea(area)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                    title="Editar datos del área"
                  >
                    <Edit2 size={15} />
                  </button>
                </div>

                {/* Embedded Shift Groups Row */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Turnos activos:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {sortedGroups.map((group) => {
                        const cellKey = `${area.id}-${group.id}`;
                        const team = teamByAreaAndGroup.get(cellKey);
                        const isToggling = togglingId === team?.id;
                        const isCreating = creatingKey === cellKey;
                        const isActive = team && team.state === ServiceAreaGroupStateEnum.ACTIVE;

                        if (team) {
                          return (
                            <button
                              key={group.id}
                              type="button"
                              onClick={() => handleGroupChipClick(area.id, group.id)}
                              disabled={isToggling}
                              title={
                                isActive
                                  ? `Activo en ${group.name} (Clic para desactivar)`
                                  : `Inactivo en ${group.name} (Clic para activar)`
                              }
                              className={clsx(
                                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer',
                                isActive
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/90 hover:bg-emerald-100 shadow-2xs'
                                  : 'bg-slate-100 text-slate-400 line-through border border-slate-200 hover:bg-slate-200/70',
                              )}
                            >
                              {isToggling ? (
                                <Loader2 size={11} className="animate-spin text-slate-500" />
                              ) : isActive ? (
                                <Check size={11} className="text-emerald-600 stroke-[3]" />
                              ) : (
                                <XCircle size={11} />
                              )}
                              <span>{group.name}</span>
                            </button>
                          );
                        }

                        return (
                          <button
                            key={group.id}
                            type="button"
                            onClick={() => handleGroupChipClick(area.id, group.id)}
                            disabled={isCreating}
                            title={`Habilitar ${group.name} para esta área`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border border-dashed border-purple-200 text-purple-700 hover:bg-purple-50 transition-all cursor-pointer"
                          >
                            {isCreating ? (
                              <Loader2 size={11} className="animate-spin text-purple-600" />
                            ) : (
                              <Plus size={11} />
                            )}
                            <span>{group.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Coverage pill */}
                  <span
                    className={clsx(
                      'text-[11px] font-bold px-2 py-0.5 rounded-lg border self-start sm:self-center shrink-0',
                      isAllGroupsCovered
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200',
                    )}
                  >
                    {activeTeamsForArea}/{sortedGroups.length} turnos habilitados
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StructureAreasView;
