import React from 'react';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { FaChild, FaChildDress } from 'react-icons/fa6';
import { useChurchTerm } from '@/libs/hooks/useTerm';
import { GenderMetricItem } from '../hooks/useGroupCoordinatorStats';

export interface KidsGenderChartProps {
  data: GenderMetricItem[];
  totalKids: number;
}

/**
 * Custom Tooltip for Gender Donut Chart.
 */
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item: GenderMetricItem = payload[0].payload;
    const isBoys = item.key === 'boys';
    const Icon = isBoys ? FaChild : FaChildDress;

    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white px-3 py-2 rounded-2xl shadow-xl border border-slate-800 text-xs flex items-center gap-2">
        <Icon className={isBoys ? 'text-indigo-400 w-3.5 h-3.5' : 'text-pink-400 w-3.5 h-3.5'} />
        <span className="font-semibold text-slate-200">{item.name}:</span>
        <span className="font-black text-white">{item.value}</span>
        <span className="text-slate-400 font-bold">({item.percent}%)</span>
      </div>
    );
  }
  return null;
};

/**
 * Donut chart showing Gender distribution (Boys vs Girls) with Recharts.
 *
 * @param {KidsGenderChartProps} props - Component properties.
 * @returns {JSX.Element} Rendered chart card.
 */
export const KidsGenderChart: React.FC<KidsGenderChartProps> = ({ data, totalKids }) => {
  const { t } = useTranslation(['kidChurch', 'common']);
  const meetingTerm = useChurchTerm('meeting');

  const boys = data.find((d) => d.key === 'boys');
  const girls = data.find((d) => d.key === 'girls');

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
            <FaChildDress className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-tight truncate">
              {t('coordinator_dashboard.chart_gender_title', 'Distribución por Género')}
            </h3>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5 leading-tight truncate">
              {t(
                'coordinator_dashboard.chart_gender_desc',
                'Proporción de niños y niñas en el {{meeting}}',
                { meeting: meetingTerm.toLowerCase() },
              )}
            </p>
          </div>
        </div>

        {totalKids === 0 && (
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full shrink-0">
            {t('coordinator_dashboard.chart_empty', 'Sin registros')}
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-1">
        {/* Donut Chart Container */}
        <div className="relative w-44 h-44 sm:w-48 sm:h-48 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {totalKids > 0 && <Tooltip content={<CustomTooltip />} />}
              <Pie
                isAnimationActive={false}
                data={totalKids === 0 ? [{ name: 'Empty', value: 1, color: '#e2e8f0' }] : data}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={74}
                paddingAngle={totalKids === 0 ? 0 : 4}
                dataKey="value"
                stroke="none"
              >
                {(totalKids === 0 ? [{ color: '#e2e8f0' }] : data).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-black text-slate-900 tracking-tight leading-none">
              {totalKids}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
              {t('coordinator_dashboard.kids_label', 'Niños')}
            </span>
          </div>
        </div>

        {/* Gender Legend Cards */}
        <div className="flex flex-row sm:flex-col gap-2.5 w-full sm:w-48 shrink-0">
          {/* Boys Card */}
          <div className="flex-1 bg-indigo-50/60 rounded-xl p-3 border border-indigo-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <FaChild className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black text-slate-900 block truncate">
                  {boys?.name || t('coordinator_dashboard.boys', 'Niños')}
                </span>
                <span className="text-[11px] font-bold text-indigo-700">
                  {boys?.value || 0}
                </span>
              </div>
            </div>
            <span className="text-xs font-black text-indigo-900 bg-white px-2 py-0.5 rounded-md border border-indigo-200/80 shadow-2xs">
              {boys?.percent || 0}%
            </span>
          </div>

          {/* Girls Card */}
          <div className="flex-1 bg-pink-50/60 rounded-xl p-3 border border-pink-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-pink-500 text-white flex items-center justify-center shrink-0">
                <FaChildDress className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black text-slate-900 block truncate">
                  {girls?.name || t('coordinator_dashboard.girls', 'Niñas')}
                </span>
                <span className="text-[11px] font-bold text-pink-700">
                  {girls?.value || 0}
                </span>
              </div>
            </div>
            <span className="text-xs font-black text-pink-900 bg-white px-2 py-0.5 rounded-md border border-pink-200/80 shadow-2xs">
              {girls?.percent || 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KidsGenderChart;
