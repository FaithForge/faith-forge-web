import {
  CheckCircle2,
  FileText,
  HelpCircle,
  MinusCircle,
  XCircle,
} from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Compact legend bar showing iconography and descriptions for the 4 attendance heatmap states.
 *
 * @returns {JSX.Element} Rendered guide card.
 */
export const AttendanceMatrixHeatmapLegend: React.FC = () => {
  const { t } = useTranslation(['hub', 'common']);

  return (
    <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
        <HelpCircle className="w-4 h-4 text-[#0284c7]" />
        <span>
          {t('hub:attendance_matrix.compact_guide', {
            defaultValue: 'Guía Compacta:',
          })}
        </span>
        <span className="text-slate-500 font-normal hidden sm:inline">
          {t('hub:attendance_matrix.compact_guide_desc', {
            defaultValue: 'Iconografía rápida del heatmap de asistencia',
          })}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
        {/* Asistió */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60 shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            {t('hub:attendance_matrix.status_attended', {
              defaultValue: 'Asistió',
            })}
          </span>
        </div>

        {/* Con Excusa */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 font-bold border border-amber-200/60 shadow-2xs">
          <FileText className="w-3.5 h-3.5 text-amber-600" />
          <span>
            {t('hub:attendance_matrix.status_excused', {
              defaultValue: 'Con Excusa',
            })}
          </span>
        </div>

        {/* Sin Excusa */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 text-rose-800 font-bold border border-rose-200/60 shadow-2xs">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>
            {t('hub:attendance_matrix.status_unexcused', {
              defaultValue: 'Sin Excusa',
            })}
          </span>
        </div>

        {/* Exento */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 text-slate-700 font-bold border border-slate-200/80 shadow-2xs">
          <MinusCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {t('hub:attendance_matrix.status_exempt', {
              defaultValue: 'Exento',
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceMatrixHeatmapLegend;
