import { IMatrixKpis } from '@/libs/models';
import clsx from 'clsx';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface AttendanceMatrixKpisProps {
  kpis: IMatrixKpis;
  targetAttendanceRate?: number;
}

/**
 * Diagnostic executive pulse KPI cards for early intervention and attendance health.
 *
 * @param {AttendanceMatrixKpisProps} props - Component properties.
 * @returns {JSX.Element} Rendered KPI metrics grid.
 */
export const AttendanceMatrixKpis: React.FC<AttendanceMatrixKpisProps> = ({
  kpis,
  targetAttendanceRate = 90,
}) => {
  const { t } = useTranslation(['hub', 'common']);

  const isRateOnTarget = kpis.globalAttendanceRate >= targetAttendanceRate;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Tasa Global de Asistencia */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3 flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {t('hub:attendance_matrix.kpi_global_rate', {
              defaultValue: 'Tasa Global de Asistencia',
            })}
          </span>
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0284c7] flex items-center justify-center font-black text-xs">
            %
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {kpis.globalAttendanceRate}%
            </span>
            <span
              className={clsx(
                'inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-md',
                isRateOnTarget
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700',
              )}
            >
              <TrendingUp className="w-3 h-3" />
              {isRateOnTarget ? 'Cumplido' : 'Bajo meta'}
            </span>
          </div>

          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            {t('hub:attendance_matrix.kpi_cycle_goal', {
              target: targetAttendanceRate,
              defaultValue: `Meta del ciclo: ${targetAttendanceRate}% mínimo requerido`,
            })}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className={clsx(
              'h-full rounded-full transition-all duration-500',
              isRateOnTarget ? 'bg-emerald-500' : 'bg-[#0284c7]',
            )}
            style={{
              width: `${Math.min(100, Math.max(0, kpis.globalAttendanceRate))}%`,
            }}
          />
        </div>
      </div>

      {/* 2. Riesgo Crítico (≤30%) */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3 flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider truncate">
              {t('hub:attendance_matrix.kpi_critical_risk', {
                defaultValue: 'Riesgo Crítico (≤30%)',
              })}
            </span>
          </div>

          {kpis.criticalRiskCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shrink-0 shadow-2xs">
              {t('hub:attendance_matrix.kpi_action_required', {
                defaultValue: 'Acción Requerida',
              })}
            </span>
          )}
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600 tracking-tight">
              {kpis.criticalRiskCount}
            </span>
            <span className="text-xs text-slate-600 font-semibold">
              {kpis.criticalRiskCount === 1
                ? t('hub:attendance_matrix.kpi_person_in_cutoff', {
                    count: 1,
                    defaultValue: 'persona en corte administrativo',
                  })
                : t('hub:attendance_matrix.kpi_persons_in_cutoff', {
                    count: kpis.criticalRiskCount,
                    defaultValue: `${kpis.criticalRiskCount} personas en corte administrativo`,
                  })}
            </span>
          </div>

          {/* Names Preview / Stack */}
          {kpis.criticalVolunteers && kpis.criticalVolunteers.length > 0 ? (
            <div className="flex items-center gap-1.5 mt-2 overflow-hidden text-[11px] font-bold text-rose-700 truncate">
              <span className="truncate">
                {kpis.criticalVolunteers.map((v) => v.fullName).join(', ')}
              </span>
            </div>
          ) : (
            <p className="text-[11px] text-emerald-600 font-medium mt-1 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Sin colaboradores en situación crítica
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium pt-1">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>
            {t('hub:attendance_matrix.kpi_ready_for_notice', {
              defaultValue: 'Expedientes listos para notificación',
            })}
          </span>
        </div>
      </div>

      {/* 3. Faltas Sin Justificar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3 flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {t('hub:attendance_matrix.kpi_unexcused_absences', {
              defaultValue: 'Faltas Sin Justificar',
            })}
          </span>
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle className="w-4 h-4" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {kpis.totalUnexcused}
            </span>
          </div>

          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            {t('hub:attendance_matrix.kpi_unexcused_impact', {
              percent: kpis.unexcusedImpactPercent,
              defaultValue: `Impacta ${kpis.unexcusedImpactPercent}% del total de asistencias`,
            })}
          </p>
        </div>

        {/* Indicator Line */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full rounded-full bg-rose-500 transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.max(0, kpis.unexcusedImpactPercent * 5))}%`,
            }}
          />
        </div>
      </div>

      {/* 4. Índice de Puntualidad / Asistencia Perfecta */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3 flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {t('hub:attendance_matrix.kpi_punctuality_index', {
              defaultValue: 'Índice de Puntualidad / Asistencia Perfecta',
            })}
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {kpis.perfectAttendanceRate}%
            </span>
          </div>

          <p className="text-[11px] text-slate-500 mt-1 font-medium truncate">
            {kpis.perfectAttendanceCount === 1
              ? t('hub:attendance_matrix.kpi_perfect_attendance_count_single', {
                  count: 1,
                  defaultValue: '1 colaborador con asistencia perfecta (100%)',
                })
              : t('hub:attendance_matrix.kpi_perfect_attendance_count', {
                  count: kpis.perfectAttendanceCount,
                  defaultValue: `${kpis.perfectAttendanceCount} colaboradores con asistencia perfecta (100%)`,
                })}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.max(0, kpis.perfectAttendanceRate))}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AttendanceMatrixKpis;
