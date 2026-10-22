import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  Users,
  CheckCircle2,
  Clock,
  RefreshCw,
  ChevronDown,
  ArrowRightLeft,
  Sparkles,
  Layers,
  AlertCircle,
  CalendarOff,
  Inbox,
} from 'lucide-react';
import { FaChild } from 'react-icons/fa6';
import clsx from 'clsx';
import { useMinistryAnalytics } from '../hooks/useMinistryAnalytics';
import { MinistryKpiCard } from '../components/MinistryKpiCard';
import { VolunteerAttendanceSection } from '../components/VolunteerAttendanceSection';
import { MinistryStructureSection } from '../components/MinistryStructureSection';
import { KidsAttendanceSection } from '../components/KidsAttendanceSection';
import { TemporalFilterSelector } from '@/components/ui/TemporalFilterSelector';
import { MeetingsMultiSelect } from '@/components/ui/MeetingsMultiSelect';
import { SelectMinistryModal } from '@/components/modal/SelectMinistryModal';
import { useChurchTerm, useKidsTerm } from '@/libs/hooks/useTerm';

/**
 * Ministry Coordinator Dashboard View.
 * Provides statistical, panoramic, and administrative analytics across services and dates.
 * Adapts dynamically: if ministry type is KIDS, displays child registrations, ratios, and classrooms;
 * if GENERAL, displays strictly volunteer fulfillment and organizational structure.
 *
 * @returns {JSX.Element} Rendered Ministry Coordinator dashboard.
 */
export const MinistryCoordinatorDashboardView: React.FC = () => {
  const { t } = useTranslation(['hub', 'common', 'kidChurch', 'admin']);
  const volunteerTerm = useChurchTerm('volunteer');
  const volunteersTerm = useChurchTerm('volunteers');
  const kidsModuleName = useKidsTerm('module_alias');

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    activeMinistry,
    availableMinistriesCount,
    temporalFilter,
    setTemporalFilter,
    selectedMeetingIds,
    setSelectedMeetingIds,
    meetings,
    hasMeetingsForSelection,
    isMeetingCurrentlyInProgress,
    isMinistryModalOpen,
    setIsMinistryModalOpen,
  } = useMinistryAnalytics();

  const isKidsMinistry = activeMinistry?.type === 'KIDS';

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
                : 'bg-gradient-to-br from-[#73c2fb] to-[#0284c7] text-white'
            )}
          >
            {isKidsMinistry ? <FaChild className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                {activeMinistry?.name || t('hub:ministry_coordinator', { defaultValue: 'Coordinador de Ministerio' })}
              </h1>
              <span
                className={clsx(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 border',
                  isKidsMinistry
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200/60'
                    : 'bg-sky-50 text-[#0284c7] border-sky-200/60'
                )}
              >
                <Sparkles className="w-2.5 h-2.5" />
                {isKidsMinistry ? kidsModuleName : t('common:general', { defaultValue: 'General' })}
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-0.5">
              {t('hub:dashboard_subtitle', {
                defaultValue: 'Panel estadístico y de gestión de servicio',
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
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-[#0284c7]" />
              <span>{t('hub:change_ministry', { defaultValue: 'Cambiar Ministerio' })}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          )}

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="w-9 h-9 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 shadow-2xs transition-colors disabled:opacity-50"
            title={t('common:actions.refresh', { defaultValue: 'Actualizar estadísticas' })}
          >
            <RefreshCw className={clsx('w-4 h-4', isFetching && 'animate-spin text-[#0284c7]')} />
          </button>
        </div>
      </div>

      {/* Filter Bar: Multi-temporal presets & Multi-service dropdown */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <TemporalFilterSelector
            value={temporalFilter}
            onChange={setTemporalFilter}
            className="flex-1 min-w-0"
          />

          <MeetingsMultiSelect
            meetings={meetings}
            selectedMeetingIds={selectedMeetingIds}
            onChange={setSelectedMeetingIds}
            className="shrink-0"
          />
        </div>
      </div>

      {/* State A: No meetings scheduled for this date/range */}
      {!hasMeetingsForSelection && (
        <div className="flex flex-col items-center justify-center p-8 sm:p-14 bg-white rounded-3xl border border-slate-200/80 shadow-2xs text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 shadow-2xs">
            <CalendarOff className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-base sm:text-lg font-bold text-slate-800">
              {t('hub:no_meetings_title', { defaultValue: 'No hay reuniones para este día' })}
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

      {/* State B: Service currently taking place today, pending finalization */}
      {hasMeetingsForSelection && isMeetingCurrentlyInProgress && (isError || !data) && (
        <div className="flex items-start gap-3 p-4 rounded-3xl bg-amber-50/80 border border-amber-200/80 text-amber-950 shadow-2xs">
          <div className="w-8 h-8 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-600 mt-0.5">
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-xs sm:text-sm">
            <p className="font-bold text-amber-900">
              {t('common:service_in_progress', { defaultValue: 'Servicio en curso o pendiente de consolidación' })}
            </p>
            <p className="text-amber-700 mt-0.5 text-xs">
              {t('common:pending_finalization_desc', {
                defaultValue:
                  'Este servicio aún no ha finalizado. Las estadísticas consolidadas estarán disponibles 30 minutos después de su culminación.',
              })}
            </p>
          </div>
        </div>
      )}

      {/* State C: Meetings exist, but no records or error (service has not happened or no attendance recorded) */}
      {hasMeetingsForSelection && !isLoading && !isMeetingCurrentlyInProgress && (isError || !data) && (
        <div className="flex flex-col items-center justify-center p-8 sm:p-14 bg-white rounded-3xl border border-slate-200/80 shadow-2xs text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center text-[#0284c7] shadow-2xs">
            <Inbox className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-base sm:text-lg font-bold text-slate-800">
              {t('hub:no_records_title', { defaultValue: 'No hay registros para este día' })}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('hub:no_records_desc', {
                defaultValue:
                  'No se encontraron registros de asistencia ni estadísticas consolidadas para la fecha o reunión seleccionada.',
              })}
            </p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {hasMeetingsForSelection && isLoading && !data && (
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-slate-200 rounded-3xl" />
            ))}
          </div>
          <div className="h-64 bg-slate-200 rounded-3xl" />
          <div className="h-64 bg-slate-200 rounded-3xl" />
        </div>
      )}

      {/* Main Content when loaded */}
      {hasMeetingsForSelection && data && (
        <div className="space-y-6">

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <MinistryKpiCard
              title={t('common:active_volunteers', { defaultValue: `${volunteersTerm} Asignados` })}
              value={data.volunteers.totalAssigned}
              subtitle={`${data.structure.assignmentsCount} asignaciones`}
              icon={Users}
              iconColor="text-[#0284c7]"
              iconBg="bg-sky-50"
            />

            <MinistryKpiCard
              title={t('common:attendance_rate', { defaultValue: 'Asistencia Promedio' })}
              value={`${data.volunteers.attendancePercent}%`}
              subtitle={`${data.volunteers.attended} asistencias registradas`}
              icon={CheckCircle2}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-50"
              trend={{
                label: `${data.volunteers.attendancePercent}%`,
                positive: data.volunteers.attendancePercent >= 75,
              }}
            />

            <MinistryKpiCard
              title={t('common:absences', { defaultValue: 'Inasistencias' })}
              value={data.volunteers.unexcused + data.volunteers.excused}
              subtitle={`${data.volunteers.unexcused} sin justificar, ${data.volunteers.excused} justificadas`}
              icon={AlertCircle}
              iconColor="text-rose-600"
              iconBg="bg-rose-50"
            />

            {/* Fourth KPI card: adaptive based on ministry type */}
            {isKidsMinistry && data.kids ? (
              <MinistryKpiCard
                title={t('kidChurch:new_kids', { defaultValue: 'Niños Nuevos' })}
                value={data.kids.newKids ?? 0}
                subtitle={`${data.kids.totalKids} niños en total`}
                icon={Sparkles}
                iconColor="text-indigo-600"
                iconBg="bg-indigo-50"
              />
            ) : (
              <MinistryKpiCard
                title={t('admin:ministry.active_areas', { defaultValue: 'Áreas de Servicio' })}
                value={data.structure.areas.length}
                subtitle={`${data.structure.groups.length} grupos activos`}
                icon={Layers}
                iconColor="text-sky-600"
                iconBg="bg-sky-50"
              />
            )}
          </div>

          {/* Volunteer Attendance Section */}
          <VolunteerAttendanceSection volunteers={data.volunteers} />

          {/* Children Attendance Section: ONLY displayed if ministry type is KIDS */}
          {isKidsMinistry && data.kids && (
            <KidsAttendanceSection kidsStats={data.kids} />
          )}

          {/* Organizational Structure Section */}
          <MinistryStructureSection structure={data.structure} />
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

export default MinistryCoordinatorDashboardView;
