import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, AlertCircle, HelpCircle, Users } from 'lucide-react';
import clsx from 'clsx';
import { IMinistryVolunteerAnalytics } from '@/libs/models/Ministry';
import { useChurchTerm } from '@/libs/hooks/useTerm';

interface VolunteerAttendanceSectionProps {
  volunteers: IMinistryVolunteerAnalytics;
}

/**
 * Section displaying volunteer attendance metrics and status breakdown.
 *
 * @param {VolunteerAttendanceSectionProps} props - Section properties.
 * @returns {JSX.Element} Rendered attendance section.
 */
export const VolunteerAttendanceSection: React.FC<VolunteerAttendanceSectionProps> = ({ volunteers }) => {
  const { t } = useTranslation(['kidChurch', 'common']);
  const volunteerTerm = useChurchTerm('volunteer');
  const volunteersTerm = useChurchTerm('volunteers');

  const {
    attended = 0,
    excused = 0,
    unexcused = 0,
    attendancePercent = 0,
  } = volunteers;

  const totalRecords = attended + excused + unexcused;

  const statusCards = [
    {
      label: t('common:status.attended', { defaultValue: 'Asistieron' }),
      count: attended,
      percent: totalRecords > 0 ? Math.round((attended / totalRecords) * 100) : 0,
      icon: CheckCircle2,
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200/60',
    },
    {
      label: t('common:status.excused', { defaultValue: 'Excusados' }),
      count: excused,
      percent: totalRecords > 0 ? Math.round((excused / totalRecords) * 100) : 0,
      icon: HelpCircle,
      textColor: 'text-sky-700',
      bgColor: 'bg-sky-50',
      borderColor: 'border-sky-200/60',
    },
    {
      label: t('common:status.unexcused', { defaultValue: 'Inasistencias' }),
      count: unexcused,
      percent: totalRecords > 0 ? Math.round((unexcused / totalRecords) * 100) : 0,
      icon: AlertCircle,
      textColor: 'text-rose-700',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200/60',
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-4 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0284c7]" />
            <span>
              {t('kidChurch:attendance.volunteer_title', {
                defaultValue: `Asistencia de ${volunteersTerm}`,
              })}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('kidChurch:attendance.volunteer_subtitle', {
              defaultValue: `Métricas de cumplimiento del equipo de ${volunteerTerm.toLowerCase()}`,
            })}
          </p>
        </div>

        {totalRecords > 0 && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                {t('common:attendance_rate', { defaultValue: 'Tasa de Asistencia' })}
              </span>
              <span className="text-lg font-black text-emerald-600 leading-none">
                {attendancePercent}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {totalRecords > 0 ? (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-600">
            <span>{t('common:total_checks', { defaultValue: 'Total de marcas registradas' })}</span>
            <span className="text-slate-900 font-bold">{totalRecords}</span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
            {attended > 0 && (
              <div
                style={{ width: `${(attended / totalRecords) * 100}%` }}
                className="bg-emerald-500 h-full transition-all"
                title={`Asistieron: ${attended}`}
              />
            )}
            {excused > 0 && (
              <div
                style={{ width: `${(excused / totalRecords) * 100}%` }}
                className="bg-sky-400 h-full transition-all"
                title={`Excusados: ${excused}`}
              />
            )}
            {unexcused > 0 && (
              <div
                style={{ width: `${(unexcused / totalRecords) * 100}%` }}
                className="bg-rose-400 h-full transition-all"
                title={`Inasistencias: ${unexcused}`}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          {t('common:empty.no_attendance_records', {
            defaultValue: 'No se encontraron registros de asistencia de servidores en el período seleccionado.',
          })}
        </div>
      )}

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {statusCards.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={clsx(
                'p-3 rounded-2xl border flex items-center justify-between',
                item.bgColor,
                item.borderColor
              )}
            >
              <div>
                <span className="text-[11px] font-bold text-slate-600 block leading-tight">
                  {item.label}
                </span>
                <span className={clsx('text-xl font-black mt-0.5 block', item.textColor)}>
                  {item.count}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {item.percent}%
                </span>
              </div>
              <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-white/70 shadow-2xs', item.textColor)}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VolunteerAttendanceSection;
