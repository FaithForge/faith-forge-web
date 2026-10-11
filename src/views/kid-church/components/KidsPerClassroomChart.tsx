import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  LabelList,
} from 'recharts';
import { Building2 } from 'lucide-react';
import { FaChild, FaChildDress } from 'react-icons/fa6';
import { isFeatureEnabled } from '@/config/features';
import { useKidsTerm, useChurchTerm } from '@/libs/hooks/useTerm';
import { ClassroomMetricItem } from '../hooks/useGroupCoordinatorStats';

export interface KidsPerClassroomChartProps {
  data: ClassroomMetricItem[];
  classroomTerm?: string;
  classroomsTerm?: string;
  volunteersTerm?: string;
}

interface CustomTooltipProps {
  active?: unknown;
  payload?: any[];
  classroomTerm: string;
  volunteersTerm: string;
}

/**
 * Custom Tooltip for Recharts Classroom BarChart.
 */
const CustomTooltip = ({
  active,
  payload,
  classroomTerm,
  volunteersTerm,
}: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const item: ClassroomMetricItem = payload[0].payload;
    const isVolunteerAttendanceEnabled = isFeatureEnabled('volunteerAttendance');

    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl border border-slate-800 text-xs space-y-1.5 min-w-[170px]">
        <p className="font-black text-slate-100 text-sm">{item.name}</p>
        <p className="text-[11px] text-slate-400 font-medium">{item.ageRange}</p>
        <div className="pt-1 border-t border-slate-800/80 space-y-1">
          <div className="flex justify-between items-center text-slate-200">
            <span className="font-medium">Total Niños:</span>
            <span className="font-black text-indigo-400">{item.totalKids}</span>
          </div>
          <div className="flex justify-between items-center text-slate-300 text-[11px]">
            <span className="inline-flex items-center gap-1">
              <FaChild className="text-indigo-400 w-3 h-3" /> Niños:
            </span>
            <span className="font-bold">{item.boys}</span>
          </div>
          <div className="flex justify-between items-center text-slate-300 text-[11px]">
            <span className="inline-flex items-center gap-1">
              <FaChildDress className="text-pink-400 w-3 h-3" /> Niñas:
            </span>
            <span className="font-bold">{item.girls}</span>
          </div>
          {isVolunteerAttendanceEnabled && (
            <div className="flex justify-between items-center text-slate-400 text-[10px] pt-0.5">
              <span>{volunteersTerm} en {classroomTerm.toLowerCase()}:</span>
              <span className="font-bold text-emerald-400">{item.serversAttended}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

/**
 * Recharts BarChart visualizing total kids attendance across classrooms using horizontal bars.
 * Displays counts directly on bars for immediate glance without interaction.
 *
 * @param {KidsPerClassroomChartProps} props - Component properties.
 * @returns {JSX.Element} Rendered chart card.
 */
export const KidsPerClassroomChart: React.FC<KidsPerClassroomChartProps> = ({
  data,
  classroomTerm,
  classroomsTerm,
  volunteersTerm,
}) => {
  const { t } = useTranslation(['kidChurch', 'common']);
  const defaultClassroom = useKidsTerm('classroom');
  const defaultClassrooms = useKidsTerm('classrooms');
  const defaultVolunteers = useChurchTerm('volunteers');

  const effectiveClassroom = classroomTerm || defaultClassroom;
  const effectiveClassrooms = classroomsTerm || defaultClassrooms;
  const effectiveVolunteers = volunteersTerm || defaultVolunteers;

  const chartData = data.map((c) => ({
    ...c,
    displayName: c.name.length > 15 ? `${c.name.slice(0, 14)}…` : c.name,
  }));

  const hasData = chartData.some((c) => c.totalKids > 0);
  const chartHeight = Math.max(260, Math.min(460, chartData.length * 40));

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Building2 className="w-4.5 h-4.5 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-tight truncate">
              {t('coordinator_dashboard.chart_kids_per_classroom_title', {
                classroom: effectiveClassroom,
                defaultValue: `Niños por ${effectiveClassroom}`,
              })}
            </h3>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5 leading-tight truncate">
              {t('coordinator_dashboard.chart_kids_per_classroom_desc', {
                classroom: effectiveClassroom.toLowerCase(),
                defaultValue: `Distribución general de asistencia en cada ${effectiveClassroom.toLowerCase()}`,
              })}
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
        <div className="h-56 flex flex-col items-center justify-center text-slate-400 text-xs font-semibold gap-1.5 bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
          <Building2 className="w-8 h-8 opacity-40" />
          <span>
            {t('coordinator_dashboard.chart_empty_classrooms', {
              classrooms: effectiveClassrooms.toLowerCase(),
              defaultValue: `Sin ${effectiveClassrooms.toLowerCase()} configurados`,
            })}
          </span>
        </div>
      ) : (
        <div className="w-full" style={{ height: chartHeight }}>
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
                width={105}
                tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <Tooltip
                content={
                  <CustomTooltip
                    classroomTerm={effectiveClassroom}
                    volunteersTerm={effectiveVolunteers}
                  />
                }
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar
                dataKey="totalKids"
                isAnimationActive={false}
                radius={[0, 8, 8, 0]}
                maxBarSize={24}
              >
                <LabelList
                  dataKey="totalKids"
                  position="right"
                  offset={10}
                  fill="#4338ca"
                  fontSize={12}
                  fontWeight={800}
                  formatter={(val: any) => (Number(val) > 0 ? val : '')}
                />
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index % 2 === 0 ? '#4f46e5' : '#6366f1'}
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

export default KidsPerClassroomChart;
