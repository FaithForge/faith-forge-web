import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layers, Shield, UserCheck, Crown } from 'lucide-react';
import {
  IMinistryStructureAnalytics,
  IMinistryArea,
  IMinistryWorkspaceCoordinator,
} from '@/libs/models/Ministry';
import { useChurchTerm } from '@/libs/hooks/useTerm';

interface MinistryStructureSectionProps {
  structure: IMinistryStructureAnalytics;
}

/**
 * Section displaying the organizational hierarchy of the ministry:
 * Areas, Groups, Coordinators, and volunteer assignment breakdown.
 *
 * @param {MinistryStructureSectionProps} props - Section properties.
 * @returns {JSX.Element} Rendered ministry structure card.
 */
export const MinistryStructureSection: React.FC<MinistryStructureSectionProps> = ({ structure }) => {
  const { t } = useTranslation(['admin', 'common', 'hub']);
  const volunteerTerm = useChurchTerm('volunteer');
  const volunteersTerm = useChurchTerm('volunteers');

  const {
    areas = [],
    groups = [],
    teams = [],
    leadership,
    assignmentsCount = 0,
  } = structure;

  const areaCoordinators = leadership?.areaCoordinators || [];

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#0284c7]" />
            <span>{t('admin:ministry.structure_title', { defaultValue: 'Estructura y Áreas de Servicio' })}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('admin:ministry.structure_subtitle', {
              defaultValue: `Distribución de ${volunteersTerm.toLowerCase()} y coordinaciones en las áreas activas`,
            })}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <UserCheck className="w-4 h-4 text-[#0284c7]" />
          <span>
            {assignmentsCount} {volunteersTerm.toLowerCase()} ({groups.length} grupos)
          </span>
        </div>
      </div>

      {areas.length === 0 ? (
        <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          {t('common:empty.no_areas', { defaultValue: 'No se encontraron áreas de servicio configuradas en este ministerio.' })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {areas.map((area: IMinistryArea) => {
            const areaTeams = teams.filter((t) => t.ministryAreaId === area.id);
            const areaVolunteersCount = areaTeams.reduce((sum, t) => sum + (t.totalMembersCount || 0), 0);
            const coordsForArea = areaCoordinators.filter(
              (c: IMinistryWorkspaceCoordinator) => c.ministryAreaId === area.id
            );

            return (
              <div
                key={area.id}
                className="p-4 rounded-2xl border border-slate-200/80 hover:border-slate-300 bg-slate-50/50 hover:bg-white transition-all space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0284c7] flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {area.name}
                      </h3>
                      {area.scope && (
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          {area.scope}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base font-black text-slate-900 leading-none block">
                      {areaVolunteersCount}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {volunteersTerm.toLowerCase()}
                    </span>
                  </div>
                </div>

                {/* Area stats breakdown */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-700">{areaTeams.length}</span>
                    <span>{areaTeams.length === 1 ? 'grupo asignado' : 'grupos asignados'}</span>
                  </div>

                  {coordsForArea.length > 0 ? (
                    <div className="flex items-center gap-1 text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                      <Crown className="w-3 h-3 text-[#0284c7]" />
                      <span>
                        {coordsForArea.length} {coordsForArea.length === 1 ? 'coordinador' : 'coordinadores'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-[11px]">Sin coordinador</span>
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

export default MinistryStructureSection;
