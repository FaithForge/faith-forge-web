import { SelectMinistryModal } from '@/components/modal/SelectMinistryModal';
import { UnlinkVolunteerModal } from '@/components/modal/UnlinkVolunteerModal';
import { useKidsTerm } from '@/libs/hooks/useTerm';
import clsx from 'clsx';
import {
  ArrowRightLeft,
  Building2,
  ChevronDown,
  Download,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaChild } from 'react-icons/fa6';
import { AttendanceMatrixFilters } from '../components/AttendanceMatrixFilters';
import { AttendanceMatrixHeatmapLegend } from '../components/AttendanceMatrixHeatmapLegend';
import { AttendanceMatrixKpis } from '../components/AttendanceMatrixKpis';
import { AttendanceMatrixNavigationTabs } from '../components/AttendanceMatrixNavigationTabs';
import { AttendanceMatrixTable } from '../components/AttendanceMatrixTable';
import { useMinistryAttendanceMatrix } from '../hooks/useMinistryAttendanceMatrix';

/**
 * Ministry Coordinator Attendance Matrix View.
 * Early intervention and attendance control console.
 * Identifies absenteeism patterns across multiple events, assesses risk levels,
 * and provides 1-click action triggers (WhatsApp, Phone call, and Unlink).
 *
 * @returns {JSX.Element} Rendered attendance matrix view.
 */
export const MinistryCoordinatorAttendanceMatrixView: React.FC = () => {
  const { t } = useTranslation(['hub', 'common', 'kidChurch']);
  const kidsModuleName = useKidsTerm('module_alias');

  const {
    activeMinistryName,
    activeMinistryType,
    availableMinistriesCount,
    isMinistryModalOpen,
    setIsMinistryModalOpen,
    events,
    kpis,
    roster,
    totalRecords,
    selectedGroupId,
    setSelectedGroupId,
    availableGroups,
    selectedAreaId,
    setSelectedAreaId,
    availableAreas,
    timeframe,
    setTimeframe,
    riskFilter,
    setRiskFilter,
    riskCounts,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    isUnlinkModalOpen,
    volunteerToUnlink,
    handleOpenUnlinkModal,
    handleCloseUnlinkModal,
    isLoading,
    isFetching,
    refetch,
    exportMatrixToCsv,
    coordinatorShortName,
  } = useMinistryAttendanceMatrix();

  const isKidsMinistry = activeMinistryType === 'KIDS';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header Card */}
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
                {t('hub:attendance_matrix.title', {
                  defaultValue: 'Matriz de Asistencia por Fechas y Eventos',
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
                {activeMinistryName ||
                  (isKidsMinistry
                    ? kidsModuleName
                    : t('common:general', { defaultValue: 'General' }))}
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-0.5">
              {t('hub:attendance_matrix.subtitle', {
                defaultValue:
                  'Identificación visual instantánea de absentismo, patrones de inasistencia recurrente y auditoría de incidencias por cohorte operativa.',
              })}
            </p>
          </div>
        </div>

        {/* Action Controls: Download Matrix, Switch Ministry, Refresh */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
          {/* Download CSV button */}
          <button
            type="button"
            onClick={exportMatrixToCsv}
            disabled={isLoading || isFetching || roster.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#0284c7]" />
            <span>
              {t('hub:attendance_matrix.download_matrix', {
                defaultValue: 'Descargar Matriz',
              })}
            </span>
          </button>

          {/* Switch Ministry */}
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

          {/* Refresh Button */}
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

      {/* Top Navigation Switcher: Por Servicio vs Matriz Multievento */}
      <AttendanceMatrixNavigationTabs />

      {/* 1. Macro Filters: Grupo, Área, Ciclo */}
      <AttendanceMatrixFilters
        selectedGroupId={selectedGroupId}
        onGroupIdChange={setSelectedGroupId}
        availableGroups={availableGroups}
        selectedAreaId={selectedAreaId}
        onAreaIdChange={setSelectedAreaId}
        availableAreas={availableAreas}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        riskFilter={riskFilter}
        onRiskFilterChange={setRiskFilter}
        riskCounts={riskCounts}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        totalRecords={totalRecords}
      />

      {/* 2. Executive Pulse KPIs */}
      <AttendanceMatrixKpis kpis={kpis} />

      {/* 3. Compact Heatmap Legend */}
      <AttendanceMatrixHeatmapLegend />

      {/* 4. Heatmap Roster Table */}
      <AttendanceMatrixTable
        events={events}
        roster={roster}
        ministryName={activeMinistryName || 'Ministerio'}
        coordinatorName={coordinatorShortName}
        onOpenUnlinkModal={handleOpenUnlinkModal}
      />

      {/* Modals */}
      <UnlinkVolunteerModal
        open={isUnlinkModalOpen}
        onClose={handleCloseUnlinkModal}
        volunteer={volunteerToUnlink}
        onSuccess={() => refetch()}
      />

      <SelectMinistryModal
        open={isMinistryModalOpen}
        onOpenChange={setIsMinistryModalOpen}
      />
    </div>
  );
};

export default MinistryCoordinatorAttendanceMatrixView;
