import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Sparkles } from 'lucide-react';
import { FaChild, FaChildDress } from 'react-icons/fa6';
import { CoordinatorKpiMetrics } from '../hooks/useGroupCoordinatorStats';

export interface GroupCoordinatorStatsCardsProps {
  kpis: CoordinatorKpiMetrics;
  totalClassrooms?: number;
  isVolunteerAttendanceEnabled?: boolean;
}

/**
 * Top KPI statistic cards for the Group Coordinator dashboard.
 * Displays key metrics: Total Kids and New Kids (first-time today).
 *
 * @param {GroupCoordinatorStatsCardsProps} props - Component properties.
 * @returns {JSX.Element} Rendered grid of cards.
 */
export const GroupCoordinatorStatsCards: React.FC<GroupCoordinatorStatsCardsProps> = ({
  kpis,
}) => {
  const { t } = useTranslation(['kidChurch', 'common']);

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {/* 1. Total Niños */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-1.5 mb-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="w-4.5 h-4.5 stroke-[2.2]" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            <span className="inline-flex items-center gap-0.5 text-indigo-600 font-extrabold">
              <FaChild className="w-2.5 h-2.5" />
              {kpis.maleKids}
            </span>
            <span className="text-slate-300">|</span>
            <span className="inline-flex items-center gap-0.5 text-pink-500 font-extrabold">
              <FaChildDress className="w-2.5 h-2.5" />
              {kpis.femaleKids}
            </span>
          </span>
        </div>

        <div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none block">
            {kpis.totalKids}
          </span>
          <p className="text-xs font-bold text-slate-600 mt-1 truncate">
            {t('coordinator_dashboard.kpi_total_kids', 'Total Niños')}
          </p>
          <p className="text-[10px] font-semibold text-slate-500 mt-0.5 truncate">
            {t('coordinator_dashboard.kpi_gender_breakdown', {
              boys: kpis.maleKids,
              girls: kpis.femaleKids,
            })}
          </p>
        </div>
      </div>

      {/* 2. Niños Nuevos */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-1.5 mb-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-4.5 h-4.5 stroke-[2.2]" />
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 shrink-0">
            {kpis.newKidsPercentage}% hoy
          </span>
        </div>

        <div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none block">
            {kpis.newKidsCount}
          </span>
          <p className="text-xs font-bold text-slate-600 mt-1 truncate">
            {t('coordinator_dashboard.kpi_new_kids', 'Niños Nuevos')}
          </p>
          <p className="text-[10px] font-semibold text-slate-500 mt-0.5 truncate">
            {kpis.newKidsCount === 1
              ? t('coordinator_dashboard.kpi_new_kids_desc_one', '1 primera visita')
              : t('coordinator_dashboard.kpi_new_kids_desc_other', {
                  count: kpis.newKidsCount,
                  defaultValue: `${kpis.newKidsCount} primeras visitas`,
                })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default GroupCoordinatorStatsCards;
