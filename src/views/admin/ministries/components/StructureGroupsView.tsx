import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users2,
  Edit2,
  CheckCircle2,
  XCircle,
  RotateCw,
  Layers,
  Check,
} from 'lucide-react';
import {
  IMinistryArea,
  IMinistryGroupConfig,
  IServiceAreaGroup,
  MinistryAreaStateEnum,
  MinistryGroupConfigStateEnum,
  ServiceAreaGroupStateEnum,
} from '@/libs/models';
import clsx from 'clsx';

interface StructureGroupsViewProps {
  ministryId: string;
  areas: IMinistryArea[];
  groups: IMinistryGroupConfig[];
  currentTeams: IServiceAreaGroup[];
  onEditGroup: (group: IMinistryGroupConfig) => void;
}

/**
 * Perspective: Por Grupos de Turno.
 * Presents each shift group with its rotation sequence and all the areas/classrooms it covers.
 *
 * @param {StructureGroupsViewProps} props - Component properties.
 * @returns {JSX.Element} Rendered groups perspective.
 */
export const StructureGroupsView: React.FC<StructureGroupsViewProps> = ({
  areas,
  groups,
  currentTeams,
  onEditGroup,
}) => {
  const { t } = useTranslation('admin');

  const sortedGroups = useMemo(() => {
    return [...groups]
      .filter((g) => g.state !== MinistryGroupConfigStateEnum.DELETED)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [groups]);

  const activeAreas = useMemo(() => {
    return areas
      .filter((a) => a.state !== MinistryAreaStateEnum.DELETED)
      .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  }, [areas]);

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

  return (
    <div className="flex flex-col gap-3">
      {sortedGroups.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200/90 text-center text-slate-400 text-xs shadow-xs">
          No hay grupos de rotación configurados.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sortedGroups.map((group) => {
            const isGroupActive = group.state === MinistryGroupConfigStateEnum.ACTIVE;

            // Covered active areas for this group
            const coveredAreas = activeAreas.filter((area) => {
              const team = teamByAreaAndGroup.get(`${area.id}-${group.id}`);
              return team && team.state === ServiceAreaGroupStateEnum.ACTIVE;
            });

            const isAllCovered =
              activeAreas.length > 0 && coveredAreas.length === activeAreas.length;

            return (
              <div
                key={group.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col gap-3 hover:border-slate-300 transition-all"
              >
                {/* Header Row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
                      <Users2 size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-extrabold text-slate-900 truncate">
                          {group.name}
                        </h3>

                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          <RotateCw size={10} className="text-purple-600" />
                          <span>Turno {group.position} en la rotación</span>
                        </span>

                        <span
                          className={clsx(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0',
                            isGroupActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200',
                          )}
                        >
                          {isGroupActive ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                          <span>{isGroupActive ? 'Activo' : 'Inactivo'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onEditGroup(group)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                    title="Editar Grupo"
                  >
                    <Edit2 size={15} />
                  </button>
                </div>

                {/* Covered Areas Section */}
                <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers size={13} className="text-teal-600" />
                      <span>Áreas cubiertas en esta sede:</span>
                    </span>

                    <span
                      className={clsx(
                        'text-[11px] font-bold px-2 py-0.5 rounded-lg border shrink-0',
                        isAllCovered
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200',
                      )}
                    >
                      {coveredAreas.length} de {activeAreas.length} áreas cubiertas
                    </span>
                  </div>

                  {coveredAreas.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">
                      Este grupo aún no tiene áreas asignadas en esta sede.
                    </p>
                  ) : (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {coveredAreas.map((area) => (
                        <span
                          key={area.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200/90 shadow-2xs"
                        >
                          <Check size={11} className="text-teal-600 stroke-[3]" />
                          <span>{area.name}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StructureGroupsView;
