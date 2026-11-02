import { VolunteerAttendanceStatus } from '@/libs/models';
import clsx from 'clsx';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  HelpCircle,
  Layers,
  Minus,
  Users,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AreaAttendanceBreakdown } from '../hooks/useMinistryServiceAttendance';

interface MinistryAttendanceAreaBreakdownProps {
  areas: AreaAttendanceBreakdown[];
  hasScheduledFilter?: boolean;
}

/**
 * Breakdown view grouped by ministry area, displaying area-specific compliance rates
 * and collapsible volunteer rosters.
 *
 * @param {MinistryAttendanceAreaBreakdownProps} props - Component properties.
 * @returns {JSX.Element} Rendered area breakdown.
 */
export const MinistryAttendanceAreaBreakdown: React.FC<
  MinistryAttendanceAreaBreakdownProps
> = ({ areas, hasScheduledFilter = false }) => {
  const { t } = useTranslation(['hub', 'common', 'kidChurch']);

  // Map to control expanded/collapsed state per area (default: all collapsed / closed)
  const [expandedAreas, setExpandedAreas] = useState<Record<string, boolean>>(
    {},
  );

  const allExpanded = useMemo(() => {
    return (
      areas.length > 0 && areas.every((a) => Boolean(expandedAreas[a.areaId]))
    );
  }, [areas, expandedAreas]);

  const toggleArea = (areaId: string) => {
    setExpandedAreas((prev) => ({
      ...prev,
      [areaId]: !prev[areaId],
    }));
  };

  const handleToggleAll = () => {
    if (allExpanded) {
      setExpandedAreas({});
    } else {
      const all: Record<string, boolean> = {};
      areas.forEach((a) => {
        all[a.areaId] = true;
      });
      setExpandedAreas(all);
    }
  };

  if (areas.length === 0) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-2xs text-center text-xs text-slate-400">
        No hay áreas registradas para este ministerio.
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {/* Top Header: Total count and Expand/Collapse All Action */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-slate-500">
          {areas.length}{' '}
          {areas.length === 1 ? 'área de servicio' : 'áreas de servicio'}
        </span>

        <button
          type="button"
          onClick={handleToggleAll}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-colors cursor-pointer select-none"
        >
          {allExpanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-[#0284c7]" />
              <span>
                {t('hub:attendance_report.collapse_all', {
                  defaultValue: 'Colapsar todos',
                })}
              </span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-[#0284c7]" />
              <span>
                {t('hub:attendance_report.expand_all', {
                  defaultValue: 'Desplegar todos',
                })}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Area Cards List */}
      {areas.map((area) => {
        const isExpanded = Boolean(expandedAreas[area.areaId]);
        const percentColor =
          area.attendancePercent >= 75
            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
            : area.attendancePercent >= 50
              ? 'text-amber-700 bg-amber-50 border-amber-200'
              : 'text-rose-700 bg-rose-50 border-rose-200';

        const barColor =
          area.attendancePercent >= 75
            ? 'bg-emerald-500'
            : area.attendancePercent >= 50
              ? 'bg-amber-500'
              : 'bg-rose-500';

        return (
          <div
            key={area.areaId}
            className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden transition-all"
          >
            {/* Header: Area Title, Compliance KPI, and Toggle */}
            <button
              type="button"
              onClick={() => toggleArea(area.areaId)}
              className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/70 transition-colors cursor-pointer select-none outline-hidden"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-[#0284c7] flex items-center justify-center shrink-0 border border-sky-100 shadow-2xs">
                  {area.areaId === 'COORDINATORS' ? (
                    <Users className="w-5 h-5" />
                  ) : (
                    <Layers className="w-5 h-5" />
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                    {area.areaName}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                    <span>
                      {area.volunteers.length}{' '}
                      {area.volunteers.length === 1 ? 'servidor' : 'servidores'}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-emerald-700">
                      {area.attended} asistieron
                    </span>
                    {area.unexcused > 0 && (
                      <>
                        <span>•</span>
                        <span className="font-semibold text-rose-600">
                          {area.unexcused} faltas
                        </span>
                      </>
                    )}
                    {area.exempt > 0 && (
                      <>
                        <span>•</span>
                        <span className="font-semibold text-slate-600">
                          {area.exempt}{' '}
                          {area.exempt === 1 ? 'exento' : 'exentos'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div
                  className={clsx(
                    'px-2.5 py-1 rounded-xl text-xs font-black border',
                    percentColor,
                  )}
                >
                  {area.attendancePercent}%
                </div>

                <div className="text-slate-400">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>
            </button>

            {/* Mini Progress Bar */}
            <div className="px-4 sm:px-5 pb-2">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  style={{ width: `${area.attendancePercent}%` }}
                  className={clsx(
                    'h-full rounded-full transition-all',
                    barColor,
                  )}
                />
              </div>
            </div>

            {/* Collapsible Volunteers Roster */}
            {isExpanded && (
              <div className="p-4 sm:p-5 pt-2 border-t border-slate-100 space-y-2.5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {area.volunteers.map((vol) => {
                    const initials =
                      `${vol.firstName?.[0] ?? ''}${vol.lastName?.[0] ?? ''}`.toUpperCase() ||
                      'SV';

                    const isAttended =
                      vol.attendanceStatus ===
                        VolunteerAttendanceStatus.ATTENDED ||
                      vol.attendanceStatus === VolunteerAttendanceStatus.LATE;
                    const isUnexcused =
                      vol.attendanceStatus ===
                      VolunteerAttendanceStatus.UNEXCUSED;
                    const isExcused =
                      vol.attendanceStatus ===
                      VolunteerAttendanceStatus.EXCUSED;
                    const isExempt =
                      vol.attendanceStatus === VolunteerAttendanceStatus.EXEMPT;
                    const isPending =
                      vol.attendanceStatus === 'PENDING' ||
                      !vol.attendanceStatus;

                    return (
                      <div
                        key={vol.assignmentId}
                        className="p-3 rounded-2xl border border-slate-200/70 bg-slate-50/40 hover:bg-white hover:border-slate-300 transition-all flex items-center justify-between gap-2.5"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0284c7] font-bold text-xs flex items-center justify-center shrink-0 border border-sky-100 overflow-hidden">
                            {vol.photoUrl ? (
                              <img
                                src={vol.photoUrl}
                                alt={vol.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              initials
                            )}
                          </div>

                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {vol.fullName}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                              <span>{vol.groupName}</span>
                              {hasScheduledFilter && (
                                <span
                                  className={clsx(
                                    'font-bold px-1 rounded-sm text-[9px]',
                                    vol.isScheduled
                                      ? 'text-[#0284c7] bg-sky-50'
                                      : 'text-amber-800 bg-amber-50',
                                  )}
                                >
                                  {vol.isScheduled ? 'Programado' : 'Apoyo'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0 text-right">
                          {isAttended && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Asistió</span>
                            </span>
                          )}

                          {isUnexcused && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              <span>Falta</span>
                            </span>
                          )}

                          {isExcused && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <HelpCircle className="w-3 h-3 text-amber-600" />
                              <span>Excusado</span>
                            </span>
                          )}

                          {isExempt && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-600">
                              <Minus className="w-3 h-3" />
                              <span>Exento</span>
                            </span>
                          )}

                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-500">
                              <Clock className="w-3 h-3" />
                              <span>Sin marcar</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MinistryAttendanceAreaBreakdown;
