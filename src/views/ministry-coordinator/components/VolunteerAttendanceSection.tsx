import { useChurchTerm } from '@/libs/hooks/useTerm';
import {
  IMinistryGroupConfig,
  IMinistryVolunteerAnalytics,
  IVolunteerMeetingStatGroupBreakdown,
} from '@/libs/models/Ministry';
import clsx from 'clsx';
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  Filter,
  HelpCircle,
  Users,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface VolunteerAttendanceSectionProps {
  volunteers: IMinistryVolunteerAnalytics;
  groups?: IMinistryGroupConfig[];
}

/**
 * Section displaying volunteer attendance metrics, scheduled groups,
 * and detailed breakdown divided by group.
 *
 * @param {VolunteerAttendanceSectionProps} props - Section properties.
 * @returns {JSX.Element} Rendered attendance section.
 */
export const VolunteerAttendanceSection: React.FC<
  VolunteerAttendanceSectionProps
> = ({ volunteers, groups = [] }) => {
  const { t } = useTranslation(['kidChurch', 'common']);
  const volunteerTerm = useChurchTerm('volunteer');
  const volunteersTerm = useChurchTerm('volunteers');

  const {
    attended = 0,
    excused = 0,
    unexcused = 0,
    attendancePercent = 0,
    byGroup = [],
    scheduledGroupIds = [],
  } = volunteers;

  // Selected group filter: 'ALL', 'SCHEDULED_ONLY', or a specific groupId
  const [selectedGroupId, setSelectedGroupId] = useState<string>('ALL');

  // Map of group IDs to group configs/names
  const groupConfigMap = useMemo(() => {
    const map = new Map<string, string>();
    groups.forEach((g) => map.set(g.id, g.name));
    byGroup.forEach((g) => {
      if (!map.has(g.groupId)) map.set(g.groupId, g.groupName);
    });
    return map;
  }, [groups, byGroup]);

  // Names of groups explicitly scheduled/assigned for this service/meeting
  const scheduledGroupNames = useMemo(() => {
    if (!scheduledGroupIds || scheduledGroupIds.length === 0) return [];
    return scheduledGroupIds
      .map((id) => groupConfigMap.get(id) || 'Grupo')
      .filter(Boolean);
  }, [scheduledGroupIds, groupConfigMap]);

  // Compute active metrics based on selected group filter
  const currentMetrics = useMemo(() => {
    if (selectedGroupId === 'ALL') {
      const total = attended + excused + unexcused;
      return {
        attended,
        excused,
        unexcused,
        total,
        percent: attendancePercent,
      };
    }

    if (selectedGroupId === 'SCHEDULED_ONLY') {
      const scheduledList = byGroup.filter((g) =>
        scheduledGroupIds.includes(g.groupId),
      );
      const att = scheduledList.reduce((sum, g) => sum + (g.attended || 0), 0);
      const exc = scheduledList.reduce((sum, g) => sum + (g.excused || 0), 0);
      const unexc = scheduledList.reduce(
        (sum, g) => sum + (g.unexcused || 0),
        0,
      );
      const total = att + exc + unexc;
      const totalAsg = scheduledList.reduce(
        (sum, g) => sum + (g.totalAssigned || 0),
        0,
      );
      const pct = totalAsg > 0 ? Math.round((att / totalAsg) * 100) : 0;
      return {
        attended: att,
        excused: exc,
        unexcused: unexc,
        total,
        percent: pct,
      };
    }

    const targetGroup = byGroup.find((g) => g.groupId === selectedGroupId);
    if (targetGroup) {
      const att = targetGroup.attended || 0;
      const exc = targetGroup.excused || 0;
      const unexc = targetGroup.unexcused || 0;
      const total = att + exc + unexc;
      const asg = targetGroup.totalAssigned || 0;
      const pct = asg > 0 ? Math.round((att / asg) * 100) : 0;
      return {
        attended: att,
        excused: exc,
        unexcused: unexc,
        total,
        percent: pct,
      };
    }

    return {
      attended: 0,
      excused: 0,
      unexcused: 0,
      total: 0,
      percent: 0,
    };
  }, [
    selectedGroupId,
    attended,
    excused,
    unexcused,
    attendancePercent,
    byGroup,
    scheduledGroupIds,
  ]);

  const totalRecords = currentMetrics.total;

  const statusCards = [
    {
      label: t('common:status.attended', { defaultValue: 'Asistieron' }),
      count: currentMetrics.attended,
      percent:
        totalRecords > 0
          ? Math.round((currentMetrics.attended / totalRecords) * 100)
          : 0,
      icon: CheckCircle2,
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200/60',
    },
    {
      label: t('common:status.excused', { defaultValue: 'Excusados' }),
      count: currentMetrics.excused,
      percent:
        totalRecords > 0
          ? Math.round((currentMetrics.excused / totalRecords) * 100)
          : 0,
      icon: HelpCircle,
      textColor: 'text-sky-700',
      bgColor: 'bg-sky-50',
      borderColor: 'border-sky-200/60',
    },
    {
      label: t('common:status.unexcused', { defaultValue: 'Inasistencias' }),
      count: currentMetrics.unexcused,
      percent:
        totalRecords > 0
          ? Math.round((currentMetrics.unexcused / totalRecords) * 100)
          : 0,
      icon: AlertCircle,
      textColor: 'text-rose-700',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200/60',
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
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
                {t('common:attendance_rate', {
                  defaultValue: 'Tasa de Asistencia',
                })}
              </span>
              <span className="text-lg font-black text-emerald-600 leading-none">
                {currentMetrics.percent}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Scheduled Group(s) Banner */}
      {scheduledGroupNames.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-sky-50/70 border border-sky-200/60 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-sky-900 shrink-0">
            <CalendarCheck className="w-4 h-4 text-[#0284c7]" />
            <span>
              {scheduledGroupNames.length === 1
                ? 'Grupo asignado a este servicio:'
                : 'Grupos asignados a este servicio:'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {scheduledGroupNames.map((name, idx) => (
              <span
                key={idx}
                className="px-2.5 py-0.5 rounded-lg bg-white font-bold text-[#0284c7] border border-sky-200 shadow-2xs text-[11px]"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Group Filter Tabs / Chips */}
      {byGroup.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-medium text-[11px] flex items-center gap-1 mr-1 shrink-0">
            <Filter className="w-3 h-3" /> Filtrar:
          </span>

          <button
            type="button"
            onClick={() => setSelectedGroupId('ALL')}
            className={clsx(
              'px-3 py-1.5 rounded-xl font-bold transition-all shrink-0',
              selectedGroupId === 'ALL'
                ? 'bg-[#0284c7] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            )}
          >
            Todos los grupos
          </button>

          {scheduledGroupIds.length > 0 &&
            scheduledGroupIds.length < byGroup.length && (
              <button
                type="button"
                onClick={() => setSelectedGroupId('SCHEDULED_ONLY')}
                className={clsx(
                  'px-3 py-1.5 rounded-xl font-bold transition-all shrink-0',
                  selectedGroupId === 'SCHEDULED_ONLY'
                    ? 'bg-[#0284c7] text-white shadow-xs'
                    : 'bg-sky-50 text-sky-700 border border-sky-200/60 hover:bg-sky-100',
                )}
              >
                Solo programados ({scheduledGroupIds.length})
              </button>
            )}

          {byGroup.map((group) => {
            const isScheduled = scheduledGroupIds.includes(group.groupId);
            const isSelected = selectedGroupId === group.groupId;
            return (
              <button
                key={group.groupId}
                type="button"
                onClick={() => setSelectedGroupId(group.groupId)}
                className={clsx(
                  'px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 flex items-center gap-1.5',
                  isSelected
                    ? 'bg-[#0284c7] text-white shadow-xs'
                    : isScheduled
                      ? 'bg-sky-50/80 text-sky-800 border border-sky-200 hover:bg-sky-100'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                )}
              >
                <span>{group.groupName}</span>
                {isScheduled && !isSelected && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-[#0284c7]"
                    title="Programado"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Progress Bar */}
      {totalRecords > 0 ? (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-600">
            <span>
              {t('common:total_checks', {
                defaultValue: 'Total de marcas registradas',
              })}
            </span>
            <span className="text-slate-900 font-bold">{totalRecords}</span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
            {currentMetrics.attended > 0 && (
              <div
                style={{
                  width: `${(currentMetrics.attended / totalRecords) * 100}%`,
                }}
                className="bg-emerald-500 h-full transition-all"
                title={`Asistieron: ${currentMetrics.attended}`}
              />
            )}
            {currentMetrics.excused > 0 && (
              <div
                style={{
                  width: `${(currentMetrics.excused / totalRecords) * 100}%`,
                }}
                className="bg-sky-400 h-full transition-all"
                title={`Excusados: ${currentMetrics.excused}`}
              />
            )}
            {currentMetrics.unexcused > 0 && (
              <div
                style={{
                  width: `${(currentMetrics.unexcused / totalRecords) * 100}%`,
                }}
                className="bg-rose-400 h-full transition-all"
                title={`Inasistencias: ${currentMetrics.unexcused}`}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          {t('common:empty.no_attendance_records', {
            defaultValue:
              'No se encontraron registros de asistencia de servidores en el período seleccionado.',
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
                'p-3.5 rounded-2xl border flex items-center justify-between',
                item.bgColor,
                item.borderColor,
              )}
            >
              <div>
                <span className="text-[11px] font-bold text-slate-600 block leading-tight">
                  {item.label}
                </span>
                <span
                  className={clsx(
                    'text-xl font-black mt-0.5 block',
                    item.textColor,
                  )}
                >
                  {item.count}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {item.percent}%
                </span>
              </div>
              <div
                className={clsx(
                  'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-white/70 shadow-2xs',
                  item.textColor,
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Divided Report by Group */}
      {byGroup.length > 0 && (
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Desglose de asistencia por grupo
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">
              {byGroup.length} {byGroup.length === 1 ? 'grupo' : 'grupos'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {byGroup.map((group: IVolunteerMeetingStatGroupBreakdown) => {
              const isScheduled = scheduledGroupIds.includes(group.groupId);
              const groupPercent =
                group.totalAssigned > 0
                  ? Math.round((group.attended / group.totalAssigned) * 100)
                  : 0;
              const isSelected = selectedGroupId === group.groupId;

              return (
                <div
                  key={group.groupId}
                  onClick={() =>
                    setSelectedGroupId(isSelected ? 'ALL' : group.groupId)
                  }
                  className={clsx(
                    'p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5',
                    isSelected
                      ? 'border-[#0284c7] bg-sky-50/50 shadow-xs ring-1 ring-[#0284c7]/30'
                      : 'border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-slate-300',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {group.groupName}
                      </h4>
                      {group.areaName && (
                        <span className="text-[10px] text-slate-400 truncate block">
                          {group.areaName}
                        </span>
                      )}
                    </div>

                    <div className="shrink-0">
                      {isScheduled ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-[#0284c7] border border-sky-200">
                          <CalendarCheck className="w-2.5 h-2.5" />
                          Programado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                          No programado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Group Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-100/80">
                    <div className="bg-white/80 p-1.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-medium block">
                        Asistieron
                      </span>
                      <span className="text-xs font-bold text-emerald-700">
                        {group.attended} / {group.totalAssigned}
                      </span>
                    </div>

                    <div className="bg-white/80 p-1.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-medium block">
                        Excusados
                      </span>
                      <span className="text-xs font-bold text-sky-700">
                        {group.excused}
                      </span>
                    </div>

                    <div className="bg-white/80 p-1.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-medium block">
                        Inasistencias
                      </span>
                      <span className="text-xs font-bold text-rose-600">
                        {group.unexcused}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                      <span>Cumplimiento</span>
                      <span className="font-bold text-slate-800">
                        {groupPercent}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${groupPercent}%` }}
                        className={clsx(
                          'h-full rounded-full transition-all',
                          groupPercent >= 75
                            ? 'bg-emerald-500'
                            : groupPercent >= 50
                              ? 'bg-amber-500'
                              : 'bg-rose-500',
                        )}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerAttendanceSection;
