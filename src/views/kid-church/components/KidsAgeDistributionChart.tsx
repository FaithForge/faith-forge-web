import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  LabelList,
} from 'recharts';
import { Calendar } from 'lucide-react';
import { AgeDistributionItem } from '../hooks/useGroupCoordinatorStats';

export interface KidsAgeDistributionChartProps {
  data: AgeDistributionItem[];
  totalKids: number;
}

/**
 * Recharts BarChart visualizing kid age brackets distribution.
 *
 * @param {KidsAgeDistributionChartProps} props - Component properties.
 * @returns {JSX.Element} Rendered chart card.
 */
export const KidsAgeDistributionChart: React.FC<KidsAgeDistributionChartProps> = ({
  data,
  totalKids,
}) => {
  const { t } = useTranslation(['kidChurch', 'common']);
  const hasData = totalKids > 0;

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <Calendar className="w-4.5 h-4.5 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-tight truncate">
              {t('coordinator_dashboard.chart_age_title', 'Distribución por Edad')}
            </h3>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5 leading-tight truncate">
              {t(
                'coordinator_dashboard.chart_age_desc',
                'Concentración de niños según rango etario',
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

      <div className="w-full h-52 sm:h-60 select-none pointer-events-none">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 22, right: 10, left: -20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="bracket"
              tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              domain={[0, (dataMax: number) => Math.max(dataMax + 1, 5)]}
              tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
            />
            <Bar
              dataKey="count"
              isAnimationActive={false}
              radius={[8, 8, 0, 0]}
              maxBarSize={48}
            >
              <LabelList
                dataKey="count"
                position="top"
                offset={6}
                fill="#0f766e"
                fontSize={12}
                fontWeight={800}
                formatter={(val: any) => (Number(val) > 0 ? val : '')}
              />
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index % 2 === 0 ? '#0d9488' : '#14b8a6'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default KidsAgeDistributionChart;
