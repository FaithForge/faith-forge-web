import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, FileText, X, Minus } from 'lucide-react';

export interface TeamAttendanceSummaryStats {
  total: number;
  taken: number;
  pending: number;
  attended: number;
  excused: number;
  unexcused: number;
  exempt: number;
}

export interface TeamAttendanceSummaryCardProps {
  stats: TeamAttendanceSummaryStats;
}

/**
 * General Volunteer Attendance Summary Card.
 * Displays overall attendance figures (Total, Completed, Pending)
 * and 4 status boxes in a single row: Sirviendo (Presentes), Con excusa (Justificada),
 * Ausentes (Sin justificar), and No aplica (Exentos).
 *
 * @param {TeamAttendanceSummaryCardProps} props - Component properties.
 * @returns {JSX.Element} Rendered summary card.
 */
export const TeamAttendanceSummaryCard: React.FC<TeamAttendanceSummaryCardProps> = ({
  stats,
}) => {
  const { t } = useTranslation(['kidChurch', 'common']);

  const attendedPercent =
    stats.total > 0 ? Math.round((stats.attended / stats.total) * 100) : 0;
  const excusedPercent =
    stats.total > 0 ? Math.round((stats.excused / stats.total) * 100) : 0;
  const unexcusedPercent =
    stats.total > 0 ? Math.round((stats.unexcused / stats.total) * 100) : 0;
  const exemptPercent =
    stats.total > 0 ? Math.round((stats.exempt / stats.total) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs space-y-3">
      {/* Header: Title and inline summary totals */}
      <div className="flex items-center justify-between gap-2 px-0.5">
        <h2 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
          {t('volunteer_attendance.title_general', 'Asistencia General')}
        </h2>
        <div className="text-[11px] sm:text-xs font-medium text-slate-500">
          Total: <strong className="text-slate-800 font-bold">{stats.total}</strong> • Compl:{' '}
          <strong className="text-slate-800 font-bold">{stats.taken}</strong> • Pend:{' '}
          <strong className="text-slate-800 font-bold">{stats.pending}</strong>
        </div>
      </div>

      {/* 4 Columns in 1 Row */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
        {/* Column 1: Sirviendo */}
        <div className="bg-[#F0FDF4] rounded-2xl p-2 sm:p-2.5 border border-emerald-100 flex flex-col items-center justify-between min-w-0 text-center">
          <div className="flex items-center justify-between w-full px-0.5">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded-full">
              {attendedPercent}%
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-900 mt-1 sm:mt-1.5 leading-none">
            {stats.attended}
          </div>
          <div className="text-[11px] sm:text-xs font-bold text-emerald-900 mt-1 truncate max-w-full leading-tight">
            {t('volunteer_attendance.stats.attended', 'Sirviendo')}
          </div>
          <div className="text-[10px] text-emerald-700/80 font-medium truncate max-w-full leading-tight">
            {t('volunteer_attendance.stats.attended_short_desc', 'Presentes')}
          </div>
        </div>

        {/* Column 2: Con excusa */}
        <div className="bg-[#FEFCE8] rounded-2xl p-2 sm:p-2.5 border border-amber-100 flex flex-col items-center justify-between min-w-0 text-center">
          <div className="flex items-center justify-between w-full px-0.5">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded-full">
              {excusedPercent}%
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-900 mt-1 sm:mt-1.5 leading-none">
            {stats.excused}
          </div>
          <div className="text-[11px] sm:text-xs font-bold text-amber-950 mt-1 truncate max-w-full leading-tight">
            {t('volunteer_attendance.stats.excused', 'Con excusa')}
          </div>
          <div className="text-[10px] text-amber-700/80 font-medium truncate max-w-full leading-tight">
            {t('volunteer_attendance.stats.excused_short_desc', 'Justificada')}
          </div>
        </div>

        {/* Column 3: Ausentes */}
        <div className="bg-[#FFF1F2] rounded-2xl p-2 sm:p-2.5 border border-rose-100 flex flex-col items-center justify-between min-w-0 text-center">
          <div className="flex items-center justify-between w-full px-0.5">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-rose-800 bg-rose-100/70 px-1.5 py-0.5 rounded-full">
              {unexcusedPercent}%
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-900 mt-1 sm:mt-1.5 leading-none">
            {stats.unexcused}
          </div>
          <div className="text-[11px] sm:text-xs font-bold text-rose-950 mt-1 truncate max-w-full leading-tight">
            {t('volunteer_attendance.stats.unexcused', 'Ausentes')}
          </div>
          <div className="text-[10px] text-rose-700/80 font-medium truncate max-w-full leading-tight">
            {t('volunteer_attendance.stats.unexcused_short_desc', 'Sin justificar')}
          </div>
        </div>

        {/* Column 4: No aplica */}
        <div className="bg-slate-50 rounded-2xl p-2 sm:p-2.5 border border-slate-200/70 flex flex-col items-center justify-between min-w-0 text-center">
          <div className="flex items-center justify-between w-full px-0.5">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
              <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-700 bg-slate-200/70 px-1.5 py-0.5 rounded-full">
              {exemptPercent}%
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1 sm:mt-1.5 leading-none">
            {stats.exempt}
          </div>
          <div className="text-[11px] sm:text-xs font-bold text-slate-900 mt-1 truncate max-w-full leading-tight">
            {t('volunteer_attendance.stats.exempt', 'No aplica')}
          </div>
          <div className="text-[10px] text-slate-500 font-medium truncate max-w-full leading-tight">
            {t('volunteer_attendance.stats.exempt_short_desc', 'Exentos')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamAttendanceSummaryCard;
