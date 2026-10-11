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
import { Layers } from 'lucide-react';
import { AreaMetricItem } from '../hooks/useGroupCoordinatorStats';

export interface ServersPerAreaChartProps {
  data: AreaMetricItem[];
  volunteersTerm: string;
  teachersTerm: string;
  supervisorsTerm: string;
  coordinatorsTerm?: string;
}

/**
 * Horizontal Recharts BarChart displaying servers attendance per area.
 * Displays numbers directly on the bars without requiring interaction.
 *
 * @param {ServersPerAreaChartProps} props - Component properties.
 * @returns {JSX.Element} Rendered chart card.
 */
export const ServersPerAreaChart: React.FC<ServersPerAreaChartProps> = ({
  data,
  volunteersTerm: _volunteersTerm,
  teachersTerm: _teachersTerm,
  supervisorsTerm: _supervisorsTerm,
  coordinatorsTerm: _coordinatorsTerm = 'Coordinadores',
}) => {
  const { t } = useTranslation(['kidChurch', 'common']);

  const chartData = data.map((area) => ({
    ...area,
    displayName: area.name.length > 15 ? `${area.name.slice(0, 14)}…` : area.name,
  }));

  const hasData = chartData.some((a) => a.attended > 0 || a.assigned > 0);
  const chartHeight = Math.max(240, Math.min(460, chartData.length * 38));

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Layers className="w-4.5 h-4.5 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-tight truncate">
              {t('coordinator_dashboard.chart_servers_per_area_title', 'Servidores por Área')}
            </h3>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5 leading-tight truncate">
              {t(
                'coordinator_dashboard.chart_servers_per_area_desc',
                'Distribución del personal presente en cada área',
              )}
            </p>
          </div>
        </div>

        {!hasData && (
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full shrink-0">
            {t('coordinator_dashboard.chart_empty', 'Sin registros')}
          </span>
        )}
      </div>

      {chartData.length === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-xs font-semibold gap-1.5 bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
          <Layers className="w-8 h-8 opacity-40" />
          <span>{t('coordinator_dashboard.chart_empty', 'Sin áreas configuradas')}</span>
        </div>
      ) : (
        <div className="w-full select-none pointer-events-none" style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 10, right: 35, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis
                type="number"
                allowDecimals={false}
                domain={[0, (dataMax: number) => Math.max(dataMax + 1, 5)]}
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="displayName"
                width={110}
                tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <Bar
                dataKey="attended"
                isAnimationActive={false}
                radius={[0, 8, 8, 0]}
                maxBarSize={24}
              >
                <LabelList
                  dataKey="attended"
                  position="right"
                  offset={10}
                  fill="#059669"
                  fontSize={12}
                  fontWeight={800}
                  formatter={(val: any) => (Number(val) > 0 ? val : '')}
                />
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index % 2 === 0 ? '#059669' : '#10b981'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ServersPerAreaChart;
