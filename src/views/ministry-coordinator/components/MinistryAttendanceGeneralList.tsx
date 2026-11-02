import Input from '@/components/ui/Input';
import { VolunteerAttendanceStatus } from '@/libs/models';
import clsx from 'clsx';
import dayjs from 'dayjs';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Filter,
  HelpCircle,
  Inbox,
  Minus,
  Search,
  Sparkles,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EnrichedVolunteerAttendance } from '../hooks/useMinistryServiceAttendance';

interface MinistryAttendanceGeneralListProps {
  volunteers: EnrichedVolunteerAttendance[];
  scheduledGroupIds?: string[];
}

type StatusFilterOption =
  'ALL' | 'ATTENDED' | 'UNEXCUSED' | 'EXCUSED' | 'PENDING';

/**
 * General flat list view of all volunteers for the service, with real-time search,
 * status chip filters, and scheduled vs support indicators.
 *
 * @param {MinistryAttendanceGeneralListProps} props - Component properties.
 * @returns {JSX.Element} Rendered volunteer list.
 */
export const MinistryAttendanceGeneralList: React.FC<
  MinistryAttendanceGeneralListProps
> = ({ volunteers, scheduledGroupIds = [] }) => {
  const { t } = useTranslation(['hub', 'common', 'kidChurch']);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('ALL');
  const [onlyScheduled, setOnlyScheduled] = useState(false);

  const hasScheduledFilter = scheduledGroupIds.length > 0;
  const supportCount = useMemo(
    () => volunteers.filter((v) => !v.isScheduled).length,
    [volunteers],
  );
  const scheduledCount = useMemo(
    () => volunteers.filter((v) => v.isScheduled).length,
    [volunteers],
  );

  // Filter volunteers based on search, status tab, and scheduled flag
  const filteredVolunteers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return volunteers.filter((item) => {
      // 1. Search term
      if (term) {
        const matchesName = item.fullName.toLowerCase().includes(term);
        const matchesArea = item.areaName.toLowerCase().includes(term);
        const matchesRole = item.role.toLowerCase().includes(term);
        const matchesGroup = item.groupName.toLowerCase().includes(term);
        if (!matchesName && !matchesArea && !matchesRole && !matchesGroup) {
          return false;
        }
      }

      // 2. Only scheduled toggle
      if (onlyScheduled && !item.isScheduled) {
        return false;
      }

      // 3. Status tab
      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'ATTENDED') {
        return (
          item.attendanceStatus === VolunteerAttendanceStatus.ATTENDED ||
          item.attendanceStatus === VolunteerAttendanceStatus.LATE
        );
      }
      if (statusFilter === 'UNEXCUSED') {
        return item.attendanceStatus === VolunteerAttendanceStatus.UNEXCUSED;
      }
      if (statusFilter === 'EXCUSED') {
        return item.attendanceStatus === VolunteerAttendanceStatus.EXCUSED;
      }
      if (statusFilter === 'PENDING') {
        return (
          item.attendanceStatus === 'PENDING' ||
          item.attendanceStatus === undefined
        );
      }

      return true;
    });
  }, [volunteers, searchTerm, statusFilter, onlyScheduled]);

  // Counts for tabs
  const counts = useMemo(() => {
    let attended = 0;
    let unexcused = 0;
    let excused = 0;
    let pending = 0;

    volunteers.forEach((v) => {
      if (
        v.attendanceStatus === VolunteerAttendanceStatus.ATTENDED ||
        v.attendanceStatus === VolunteerAttendanceStatus.LATE
      ) {
        attended++;
      } else if (v.attendanceStatus === VolunteerAttendanceStatus.UNEXCUSED) {
        unexcused++;
      } else if (v.attendanceStatus === VolunteerAttendanceStatus.EXCUSED) {
        excused++;
      } else {
        pending++;
      }
    });

    return {
      all: volunteers.length,
      attended,
      unexcused,
      excused,
      pending,
    };
  }, [volunteers]);

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input using centralized UI primitive */}
          <div className="w-full sm:max-w-xs">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t(
                'hub:attendance_report.search_volunteer_placeholder',
                {
                  defaultValue: 'Buscar persona por nombre...',
                },
              )}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              className="w-full text-xs"
            />
          </div>

          {/* Toggle "Solo grupo programado" when there are external supports */}
          {hasScheduledFilter && supportCount > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOnlyScheduled((prev) => !prev)}
                className={clsx(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold border transition-colors cursor-pointer',
                  onlyScheduled
                    ? 'bg-sky-50 text-[#0284c7] border-sky-200 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
                )}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#0284c7]" />
                <span>
                  {t('hub:attendance_report.filter_only_scheduled', {
                    defaultValue: 'Solo grupo programado',
                  })}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-sky-100 text-[#0284c7] font-extrabold">
                  {scheduledCount}
                </span>
                {onlyScheduled && <Check className="w-3 h-3 text-[#0284c7]" />}
              </button>
            </div>
          )}
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-medium text-[11px] flex items-center gap-1 mr-1 shrink-0">
            <Filter className="w-3 h-3" /> Estado:
          </span>

          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={clsx(
              'px-3 py-1 rounded-xl font-bold transition-all shrink-0',
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            )}
          >
            {t('hub:attendance_report.filter_all', { defaultValue: 'Todos' })} (
            {counts.all})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('ATTENDED')}
            className={clsx(
              'px-3 py-1 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5',
              statusFilter === 'ATTENDED'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200/60 hover:bg-emerald-100',
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>
              {t('hub:attendance_report.filter_attended', {
                defaultValue: 'Asistieron',
              })}{' '}
              ({counts.attended})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('UNEXCUSED')}
            className={clsx(
              'px-3 py-1 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5',
              statusFilter === 'UNEXCUSED'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-800 border border-rose-200/60 hover:bg-rose-100',
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>
              {t('hub:attendance_report.filter_unexcused', {
                defaultValue: 'Inasistencias',
              })}{' '}
              ({counts.unexcused})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('EXCUSED')}
            className={clsx(
              'px-3 py-1 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5',
              statusFilter === 'EXCUSED'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-800 border border-amber-200/60 hover:bg-amber-100',
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>
              {t('hub:attendance_report.filter_excused', {
                defaultValue: 'Excusados',
              })}{' '}
              ({counts.excused})
            </span>
          </button>

          {counts.pending > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter('PENDING')}
              className={clsx(
                'px-3 py-1 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5',
                statusFilter === 'PENDING'
                  ? 'bg-slate-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span>
                {t('hub:attendance_report.filter_pending', {
                  defaultValue: 'Pendientes',
                })}{' '}
                ({counts.pending})
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Volunteer Cards Grid */}
      {filteredVolunteers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredVolunteers.map((item) => {
            const initials =
              `${item.firstName?.[0] ?? ''}${item.lastName?.[0] ?? ''}`.toUpperCase() ||
              'SV';

            const isAttended =
              item.attendanceStatus === VolunteerAttendanceStatus.ATTENDED ||
              item.attendanceStatus === VolunteerAttendanceStatus.LATE;
            const isUnexcused =
              item.attendanceStatus === VolunteerAttendanceStatus.UNEXCUSED;
            const isExcused =
              item.attendanceStatus === VolunteerAttendanceStatus.EXCUSED;
            const isExempt =
              item.attendanceStatus === VolunteerAttendanceStatus.EXEMPT;
            const isPending =
              item.attendanceStatus === 'PENDING' || !item.attendanceStatus;

            return (
              <div
                key={item.assignmentId}
                className="bg-white p-3.5 sm:p-4 rounded-3xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between gap-3"
              >
                {/* Header: Avatar, Name, Role & Group */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-sky-50 text-[#0284c7] font-bold text-xs flex items-center justify-center shrink-0 border border-sky-100 overflow-hidden shadow-2xs">
                    {item.photoUrl ? (
                      <img
                        src={item.photoUrl}
                        alt={item.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {item.fullName}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      {/* Area Badge */}
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                        {item.areaName}
                      </span>

                      {/* Group Badge */}
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-lg bg-sky-50 text-sky-800 border border-sky-100">
                        {item.groupName}
                      </span>

                      {/* Scheduled vs Support Badge */}
                      {hasScheduledFilter && (
                        <span
                          className={clsx(
                            'text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider',
                            item.isScheduled
                              ? 'bg-sky-100 text-[#0284c7]'
                              : 'bg-amber-100 text-amber-800',
                          )}
                        >
                          {item.isScheduled
                            ? t('hub:attendance_report.scheduled_volunteer', {
                                defaultValue: 'Programado',
                              })
                            : t('hub:attendance_report.support_volunteer', {
                                defaultValue: 'Apoyo',
                              })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer: Attendance Status Badge & Mark Time */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div>
                    {isAttended && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          {item.attendanceStatus ===
                          VolunteerAttendanceStatus.LATE
                            ? 'Asistió (Tarde)'
                            : 'Asistió'}
                        </span>
                      </span>
                    )}

                    {isUnexcused && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Inasistencia</span>
                      </span>
                    )}

                    {isExcused && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Excusado</span>
                      </span>
                    )}

                    {isExempt && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        <Minus className="w-3.5 h-3.5 text-slate-400" />
                        <span>Exento</span>
                      </span>
                    )}

                    {isPending && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200 border-dashed">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Sin marcar</span>
                      </span>
                    )}
                  </div>

                  {item.attendanceTakeDate && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {dayjs(item.attendanceTakeDate).format('hh:mm A')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-200/80 shadow-2xs text-center space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
            <Inbox className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-500">
            {t('hub:attendance_report.no_volunteers_match', {
              defaultValue:
                'No se encontraron servidores con los criterios de búsqueda',
            })}
          </p>
        </div>
      )}
    </div>
  );
};

export default MinistryAttendanceGeneralList;
