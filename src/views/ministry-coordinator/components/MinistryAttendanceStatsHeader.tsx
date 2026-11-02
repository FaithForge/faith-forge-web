import { useChurchTerm } from '@/libs/hooks/useTerm';
import { IMinistryGroupConfig } from '@/libs/models';
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  Clock,
  HelpCircle,
  Minus,
  Users,
} from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface MinistryAttendanceStatsHeaderProps {
  metrics: {
    totalScheduled: number;
    totalVolunteers: number;
    attended: number;
    unexcused: number;
    excused: number;
    exempt?: number;
    pending: number;
    attendancePercent: number;
  };
  scheduledGroups: IMinistryGroupConfig[];
  initialHour?: string;
  finalHour?: string;
  meetingName?: string;
}

/**
 * Header section displaying attendance KPIs, scheduled groups banner,
 * and visual multi-segment progress distribution.
 *
 * @param {MinistryAttendanceStatsHeaderProps} props - Component properties.
 * @returns {JSX.Element} Rendered statistics header.
 */
export const MinistryAttendanceStatsHeader: React.FC<
  MinistryAttendanceStatsHeaderProps
> = ({
  metrics,
  scheduledGroups = [],
  initialHour,
  finalHour,
  meetingName,
}) => {
  const { t } = useTranslation(['hub', 'common', 'kidChurch']);
  const volunteerTerm = useChurchTerm('volunteer');
  const volunteersTerm = useChurchTerm('volunteers');

  const {
    totalScheduled,
    attended,
    unexcused,
    excused,
    exempt = 0,
    pending,
    attendancePercent,
  } = metrics;

  const totalCalculated = attended + unexcused + excused + exempt + pending;
  const denominator = totalCalculated > 0 ? totalCalculated : totalScheduled;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-4 sm:p-6 space-y-5">
      {/* Top Banner: Scheduled Group(s) & Service Hours */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200/60 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold text-sky-950 shrink-0">
            <CalendarCheck className="w-4 h-4 text-[#0284c7]" />
            <span>
              {scheduledGroups.length === 1
                ? t('hub:attendance_report.scheduled_group', {
                    defaultValue: 'Grupo programado:',
                  })
                : t('hub:attendance_report.scheduled_groups', {
                    defaultValue: 'Grupos programados:',
                  })}
            </span>
          </div>

          {scheduledGroups.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {scheduledGroups.map((group) => (
                <span
                  key={group.id}
                  className="px-2.5 py-0.5 rounded-lg bg-white font-bold text-[#0284c7] border border-sky-200 shadow-2xs text-[11px]"
                >
                  {group.name}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-slate-500 font-medium text-[11px]">
              {t('hub:attendance_report.no_scheduled_groups', {
                defaultValue: 'Sin rotación específica (convocatoria general)',
              })}
            </span>
          )}
        </div>

        {initialHour && (
          <div className="flex items-center gap-1.5 text-slate-500 font-medium shrink-0 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {initialHour.substring(0, 5)}
              {finalHour ? ` - ${finalHour.substring(0, 5)}` : ''}
            </span>
            {meetingName && (
              <span className="text-slate-400 font-normal truncate max-w-[120px]">
                • {meetingName}
              </span>
            )}
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Scheduled */}
        <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 block">
              {t('hub:attendance_report.kpi_total_scheduled', {
                defaultValue: `${volunteersTerm} Convocados`,
              })}
            </span>
            <div className="w-7 h-7 rounded-xl bg-sky-50 text-[#0284c7] flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 block leading-tight">
              {totalScheduled}
            </span>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
              {scheduledGroups.length > 0
                ? 'En grupo programado'
                : 'Padrón activo'}
            </span>
          </div>
        </div>

        {/* Attended */}
        <div className="p-3.5 sm:p-4 rounded-2xl border border-emerald-200/60 bg-emerald-50/40 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 block">
              {t('hub:attendance_report.kpi_attended', {
                defaultValue: 'Asistieron',
              })}
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-emerald-700 leading-tight">
                {attended}
              </span>
              <span className="text-xs font-bold text-emerald-600">
                ({attendancePercent}%)
              </span>
            </div>
            <span className="text-[10px] text-emerald-600/80 font-medium mt-0.5 block">
              Marcas confirmadas
            </span>
          </div>
        </div>

        {/* Unexcused */}
        <div className="p-3.5 sm:p-4 rounded-2xl border border-rose-200/60 bg-rose-50/40 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-800 block">
              {t('hub:attendance_report.kpi_unexcused', {
                defaultValue: 'Inasistencias',
              })}
            </span>
            <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-rose-700 block leading-tight">
              {unexcused}
            </span>
            <span className="text-[10px] text-rose-600/80 font-medium mt-0.5 block">
              Sin justificación
            </span>
          </div>
        </div>

        {/* Excused */}
        <div className="p-3.5 sm:p-4 rounded-2xl border border-amber-200/60 bg-amber-50/40 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 block">
              {t('hub:attendance_report.kpi_excused', {
                defaultValue: 'Excusados',
              })}
            </span>
            <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <HelpCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-amber-700 block leading-tight">
              {excused}
            </span>
            <span className="text-[10px] text-amber-700/80 font-medium mt-0.5 block">
              Con aviso previo
            </span>
          </div>
        </div>

        {/* Exempt */}
        <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 block">
              {t('hub:attendance_report.kpi_exempt', {
                defaultValue: 'Exentos',
              })}
            </span>
            <div className="w-7 h-7 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center">
              <Minus className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-slate-700 block leading-tight">
              {exempt}
            </span>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
              No aplica / Dispensa
            </span>
          </div>
        </div>
      </div>

      {/* Progress Distribution Bar */}
      {denominator > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
            <span>Distribución de cumplimiento</span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {attended} Asistieron
              </span>
              {unexcused > 0 && (
                <span className="inline-flex items-center gap-1 text-rose-700 font-bold">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  {unexcused} Faltas
                </span>
              )}
              {excused > 0 && (
                <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  {excused} Excusas
                </span>
              )}
              {exempt > 0 && (
                <span className="inline-flex items-center gap-1 text-slate-600 font-bold">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  {exempt} Exentos
                </span>
              )}
              {pending > 0 && (
                <span className="inline-flex items-center gap-1 text-slate-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                  {pending} Pendientes
                </span>
              )}
            </div>
          </div>

          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
            {attended > 0 && (
              <div
                style={{ width: `${(attended / denominator) * 100}%` }}
                className="bg-emerald-500 h-full transition-all"
                title={`Asistieron: ${attended}`}
              />
            )}
            {excused > 0 && (
              <div
                style={{ width: `${(excused / denominator) * 100}%` }}
                className="bg-amber-400 h-full transition-all"
                title={`Excusados: ${excused}`}
              />
            )}
            {unexcused > 0 && (
              <div
                style={{ width: `${(unexcused / denominator) * 100}%` }}
                className="bg-rose-500 h-full transition-all"
                title={`Inasistencias: ${unexcused}`}
              />
            )}
            {exempt > 0 && (
              <div
                style={{ width: `${(exempt / denominator) * 100}%` }}
                className="bg-slate-400 h-full transition-all"
                title={`Exentos: ${exempt}`}
              />
            )}
            {pending > 0 && (
              <div
                style={{ width: `${(pending / denominator) * 100}%` }}
                className="bg-slate-200 h-full transition-all"
                title={`Pendientes: ${pending}`}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MinistryAttendanceStatsHeader;
