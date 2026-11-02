import { SelectMinistryModal } from '@/components/modal/SelectMinistryModal';
import DateCalendarPicker from '@/components/ui/DateCalendarPicker';
import Select from '@/components/ui/Select';
import { useChurchTerm, useKidsTerm } from '@/libs/hooks/useTerm';
import clsx from 'clsx';
import dayjs from 'dayjs';
import {
  ArrowRightLeft,
  Building2,
  Calendar,
  CalendarCheck,
  CalendarOff,
  ChevronDown,
  Clock,
  Inbox,
  Layers,
  RefreshCw,
  Sparkles,
  Users,
} from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaChild } from 'react-icons/fa6';
import { MinistryAttendanceAreaBreakdown } from '../components/MinistryAttendanceAreaBreakdown';
import { MinistryAttendanceGeneralList } from '../components/MinistryAttendanceGeneralList';
import { MinistryAttendanceStatsHeader } from '../components/MinistryAttendanceStatsHeader';
import { useMinistryServiceAttendance } from '../hooks/useMinistryServiceAttendance';

type ViewMode = 'general' | 'areas';

/**
 * Ministry Coordinator Attendance View.
 * Read-only report view for checking service attendance by date and meeting.
 * Identifies scheduled rotation groups, aggregated statistics, and individual roster
 * in flat list or area breakdown format.
 *
 * @returns {JSX.Element} Rendered attendance report view.
 */
export const MinistryCoordinatorAttendanceView: React.FC = () => {
  const { t } = useTranslation(['hub', 'common', 'kidChurch']);
  const kidsModuleName = useKidsTerm('module_alias');
  const meetingTerm = useChurchTerm('meeting');
  const meetingsTerm = useChurchTerm('meetings');

  const {
    selectedDate,
    setSelectedDate,
    setToday,
    setLastSunday,
    allowedDaysOfWeek,
    availableMeetings,
    selectedMeetingId,
    setSelectedMeetingId,
    activeMeeting,
    scheduledGroupIds,
    scheduledGroups,
    hasAttendanceRecords,
    enrichedVolunteers,
    areaBreakdown,
    metrics,
    isLoading,
    isFetching,
    refetch,
    activeMinistry,
    availableMinistriesCount,
    isMinistryModalOpen,
    setIsMinistryModalOpen,
  } = useMinistryServiceAttendance();

  const [viewMode, setViewMode] = useState<ViewMode>('general');

  const isKidsMinistry = activeMinistry?.type === 'KIDS';
  const hasMeetings = availableMeetings.length > 0;
  const isTodayAllowed = allowedDaysOfWeek
    ? allowedDaysOfWeek.includes(dayjs().day())
    : true;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header and Context Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={clsx(
              'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs',
              isKidsMinistry
                ? 'bg-gradient-to-br from-indigo-500 to-sky-500 text-white'
                : 'bg-gradient-to-br from-[#73c2fb] to-[#0284c7] text-white',
            )}
          >
            {isKidsMinistry ? (
              <FaChild className="w-6 h-6" />
            ) : (
              <Building2 className="w-6 h-6" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                {activeMinistry?.name ||
                  t('hub:ministry_coordinator', {
                    defaultValue: 'Coordinador de Ministerio',
                  })}
              </h1>
              <span
                className={clsx(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 border',
                  isKidsMinistry
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200/60'
                    : 'bg-sky-50 text-[#0284c7] border-sky-200/60',
                )}
              >
                <Sparkles className="w-2.5 h-2.5" />
                {isKidsMinistry
                  ? kidsModuleName
                  : t('common:general', { defaultValue: 'General' })}
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-0.5">
              {t('hub:attendance_report.subtitle', {
                defaultValue: 'Consulta y cumplimiento del equipo por servicio',
              })}
            </p>
          </div>
        </div>

        {/* Action Controls: Switch Ministry & Refresh */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          {availableMinistriesCount > 1 && (
            <button
              type="button"
              onClick={() => setIsMinistryModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-[#0284c7]" />
              <span>
                {t('hub:change_ministry', {
                  defaultValue: 'Cambiar Ministerio',
                })}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          )}

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="w-9 h-9 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
            title={t('common:actions.refresh', {
              defaultValue: 'Actualizar asistencia',
            })}
          >
            <RefreshCw
              className={clsx(
                'w-4 h-4',
                isFetching && 'animate-spin text-[#0284c7]',
              )}
            />
          </button>
        </div>
      </div>

      {/* Date & Service Filter Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3.5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-end">
          {/* Date Selector with quick shortcuts */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#0284c7]" />
                <span>
                  {t('hub:attendance_report.select_date', {
                    defaultValue: 'Fecha del servicio',
                  })}
                </span>
              </label>

              {/* Quick Jump Buttons */}
              <div className="flex items-center gap-1 text-[11px]">
                {isTodayAllowed && (
                  <button
                    type="button"
                    onClick={setToday}
                    className="px-2 py-0.5 rounded-lg font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                  >
                    {t('hub:attendance_report.quick_today', {
                      defaultValue: 'Hoy',
                    })}
                  </button>
                )}
                <button
                  type="button"
                  onClick={setLastSunday}
                  className="px-2 py-0.5 rounded-lg font-bold bg-sky-50 hover:bg-sky-100 text-[#0284c7] border border-sky-200/60 transition-colors cursor-pointer"
                >
                  {t('hub:attendance_report.quick_last_sunday', {
                    defaultValue: 'Último domingo',
                  })}
                </button>
              </div>
            </div>

            <DateCalendarPicker
              value={selectedDate}
              onChange={setSelectedDate}
              allowedDaysOfWeek={allowedDaysOfWeek}
              className="w-full"
            />
          </div>

          {/* Service / Meeting Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#0284c7]" />
              <span>
                {t('hub:attendance_report.select_service', {
                  defaultValue: `Servicio / ${meetingTerm}`,
                })}
              </span>
            </label>

            {hasMeetings ? (
              <Select
                value={selectedMeetingId}
                onChange={(e) => setSelectedMeetingId(e.target.value)}
                className="w-full text-xs font-semibold"
              >
                {availableMeetings.map((m) => {
                  const hourLabel = m.initialHour
                    ? ` (${m.initialHour.substring(0, 5)})`
                    : '';
                  return (
                    <option key={m.id} value={m.id}>
                      {m.name}
                      {hourLabel}
                    </option>
                  );
                })}
              </Select>
            ) : (
              <div className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-400 font-medium">
                No hay servicios programados para esta fecha
              </div>
            )}
          </div>
        </div>
      </div>

      {/* State 1: No meetings for selected date */}
      {!hasMeetings && !isLoading && (
        <div className="flex flex-col items-center justify-center p-8 sm:p-14 bg-white rounded-3xl border border-slate-200/80 shadow-2xs text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 shadow-2xs">
            <CalendarOff className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-base sm:text-lg font-bold text-slate-800">
              {t('hub:no_meetings_title', {
                defaultValue: 'No hay reuniones para este día',
              })}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('hub:no_meetings_desc', {
                defaultValue:
                  'No se encontraron reuniones ni servicios programados para la fecha seleccionada en esta sede.',
              })}
            </p>
          </div>
        </div>
      )}

      {/* State 2: Meetings exist, but NO attendance taken yet (User specific decision) */}
      {hasMeetings && !isLoading && !hasAttendanceRecords && (
        <div className="space-y-4">
          {/* Scheduled Group Banner */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-[#0284c7] shrink-0" />
              <span className="font-bold text-slate-700">
                {scheduledGroups.length === 1
                  ? t('hub:attendance_report.scheduled_group', {
                      defaultValue: 'Grupo programado para este servicio:',
                    })
                  : t('hub:attendance_report.scheduled_groups', {
                      defaultValue: 'Grupos programados para este servicio:',
                    })}
              </span>
              {scheduledGroups.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5 ml-1">
                  {scheduledGroups.map((g) => (
                    <span
                      key={g.id}
                      className="px-2.5 py-0.5 rounded-lg bg-sky-50 font-bold text-[#0284c7] border border-sky-200 text-[11px]"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-slate-400 font-medium">
                  {t('hub:attendance_report.no_scheduled_groups', {
                    defaultValue: 'Sin rotación específica',
                  })}
                </span>
              )}
            </div>

            {activeMeeting?.initialHour && (
              <span className="text-slate-500 font-medium">
                Horario: {activeMeeting.initialHour.substring(0, 5)}
                {activeMeeting.finalHour
                  ? ` - ${activeMeeting.finalHour.substring(0, 5)}`
                  : ''}
              </span>
            )}
          </div>

          {/* Empty Attendance Card */}
          <div className="flex flex-col items-center justify-center p-8 sm:p-14 bg-white rounded-3xl border border-slate-200/80 shadow-2xs text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center text-[#0284c7] shadow-2xs">
              <Inbox className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                {t('hub:attendance_report.attendance_not_taken_title', {
                  defaultValue: 'Asistencia aún no tomada',
                })}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('hub:attendance_report.attendance_not_taken_desc', {
                  defaultValue:
                    'Aún no se han registrado marcas de asistencia para este servicio.',
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* State 3: Attendance exists! Render full statistical & detailed report */}
      {hasMeetings && hasAttendanceRecords && (
        <div className="space-y-6">
          {/* Top Section: Statistical KPIs and Visual Distribution */}
          <MinistryAttendanceStatsHeader
            metrics={metrics}
            scheduledGroups={scheduledGroups}
            initialHour={activeMeeting?.initialHour}
            finalHour={activeMeeting?.finalHour}
            meetingName={activeMeeting?.name}
          />

          {/* View Mode Switcher: General vs Por Áreas */}
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode('general')}
                className={clsx(
                  'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer select-none',
                  viewMode === 'general'
                    ? 'bg-[#0284c7] text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50',
                )}
              >
                <Users className="w-3.5 h-3.5" />
                <span>
                  {t('hub:attendance_report.view_general', {
                    defaultValue: 'General',
                  })}
                </span>
                <span
                  className={clsx(
                    'px-1.5 py-0.2 rounded-md text-[10px] font-extrabold',
                    viewMode === 'general'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600',
                  )}
                >
                  {enrichedVolunteers.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('areas')}
                className={clsx(
                  'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer select-none',
                  viewMode === 'areas'
                    ? 'bg-[#0284c7] text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50',
                )}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>
                  {t('hub:attendance_report.view_by_area', {
                    defaultValue: 'Por Áreas',
                  })}
                </span>
                <span
                  className={clsx(
                    'px-1.5 py-0.2 rounded-md text-[10px] font-extrabold',
                    viewMode === 'areas'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600',
                  )}
                >
                  {areaBreakdown.length}
                </span>
              </button>
            </div>
          </div>

          {/* Bottom Section: Render selected view mode */}
          {viewMode === 'general' ? (
            <MinistryAttendanceGeneralList
              volunteers={enrichedVolunteers}
              scheduledGroupIds={scheduledGroupIds}
            />
          ) : (
            <MinistryAttendanceAreaBreakdown
              areas={areaBreakdown}
              hasScheduledFilter={scheduledGroupIds.length > 0}
            />
          )}
        </div>
      )}

      {/* Ministry Selector Modal */}
      <SelectMinistryModal
        open={isMinistryModalOpen}
        onOpenChange={setIsMinistryModalOpen}
      />
    </div>
  );
};

export default MinistryCoordinatorAttendanceView;
