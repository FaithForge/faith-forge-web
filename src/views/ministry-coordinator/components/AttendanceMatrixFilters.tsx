import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { AttendanceMatrixTimeframe, MatrixRiskLevel } from '@/libs/models';
import clsx from 'clsx';
import {
  ArrowUpDown,
  Calendar,
  Layers,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

export type RiskFilterOption = 'ALL' | MatrixRiskLevel;

export type SortByOption =
  'UNEXCUSED_DESC' | 'UNEXCUSED_ASC' | 'RATE_ASC' | 'RATE_DESC' | 'NAME_ASC';

interface AttendanceMatrixFiltersProps {
  selectedGroupId: string;
  onGroupIdChange: (groupId: string) => void;
  availableGroups: { id: string; name: string }[];
  selectedAreaId: string;
  onAreaIdChange: (areaId: string) => void;
  availableAreas: { id: string; name: string }[];
  timeframe: AttendanceMatrixTimeframe;
  onTimeframeChange: (timeframe: AttendanceMatrixTimeframe) => void;
  riskFilter: RiskFilterOption;
  onRiskFilterChange: (risk: RiskFilterOption) => void;
  riskCounts: {
    all: number;
    critical: number;
    alert: number;
    regular: number;
    optimal: number;
  };
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  sortBy: SortByOption;
  onSortByChange: (sort: SortByOption) => void;
  totalRecords: number;
}

/**
 * Macro filters (Group, Area, Cycle) and roster table controls (Risk segmentation pills,
 * search input, and sorting dropdown).
 *
 * @param {AttendanceMatrixFiltersProps} props - Component properties.
 * @returns {JSX.Element} Rendered filter controls.
 */
export const AttendanceMatrixFilters: React.FC<
  AttendanceMatrixFiltersProps
> = ({
  selectedGroupId,
  onGroupIdChange,
  availableGroups,
  selectedAreaId,
  onAreaIdChange,
  availableAreas,
  timeframe,
  onTimeframeChange,
  riskFilter,
  onRiskFilterChange,
  riskCounts,
  searchTerm,
  onSearchTermChange,
  sortBy,
  onSortByChange,
  totalRecords,
}) => {
  const { t } = useTranslation(['hub', 'common']);

  return (
    <div className="space-y-4">
      {/* 1. Macro Filters: Alcance Operativo (Grupo, Área, Ciclo) */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <SlidersHorizontal className="w-4 h-4 text-[#0284c7]" />
          <span>
            {t('hub:attendance_matrix.operational_scope', {
              defaultValue: 'Alcance Operativo:',
            })}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-end">
          {/* Grupo */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#0284c7]" />
              <span>
                {t('hub:attendance_matrix.filter_group', {
                  defaultValue: 'Grupo',
                })}
              </span>
            </label>
            <Select
              value={selectedGroupId}
              onChange={(e) => onGroupIdChange(e.target.value)}
              disabled={availableGroups.length === 0}
              className="w-full text-xs font-semibold py-2"
            >
              {availableGroups.length === 0 ? (
                <option value="">
                  {t('hub:attendance_matrix.no_groups_available', {
                    defaultValue: 'Sin grupos configurados',
                  })}
                </option>
              ) : (
                availableGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))
              )}
            </Select>
          </div>

          {/* Área */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#0284c7]" />
              <span>
                {t('hub:attendance_matrix.filter_area', {
                  defaultValue: 'Área',
                })}
              </span>
            </label>
            <Select
              value={selectedAreaId}
              onChange={(e) => onAreaIdChange(e.target.value)}
              className="w-full text-xs font-semibold py-2"
            >
              <option value="ALL">
                {t('hub:attendance_matrix.filter_all_areas', {
                  defaultValue: 'Todas las áreas',
                })}
              </option>
              {availableAreas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Ciclo */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#0284c7]" />
              <span>
                {t('hub:attendance_matrix.filter_cycle', {
                  defaultValue: 'Ciclo',
                })}
              </span>
            </label>
            <Select
              value={timeframe}
              onChange={(e) =>
                onTimeframeChange(e.target.value as AttendanceMatrixTimeframe)
              }
              className="w-full text-xs font-semibold py-2"
            >
              <option value={AttendanceMatrixTimeframe.LAST_6}>
                {t('hub:attendance_matrix.cycle_last_6', {
                  defaultValue: 'Últimos 6 servicios',
                })}
              </option>
              <option value={AttendanceMatrixTimeframe.LAST_12}>
                {t('hub:attendance_matrix.cycle_last_12', {
                  defaultValue: 'Últimos 12 servicios',
                })}
              </option>
              <option value={AttendanceMatrixTimeframe.MONTH}>
                {t('hub:attendance_matrix.cycle_month', {
                  defaultValue: 'Este mes',
                })}
              </option>
              <option value={AttendanceMatrixTimeframe.QUARTER}>
                {t('hub:attendance_matrix.cycle_quarter', {
                  defaultValue: 'Último trimestre',
                })}
              </option>
            </Select>
          </div>
        </div>
      </div>

      {/* 2. Roster Controls: Risk segmentation tabs, search bar, sort dropdown */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
        {/* Title + Risk segmentation tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
              {t('hub:attendance_matrix.consolidated_title', {
                defaultValue: 'Detalle Consolidado de Colaboradores',
              })}
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
              {t('hub:attendance_matrix.records_count', {
                count: totalRecords,
                defaultValue: `${totalRecords} registros`,
              })}
            </span>
          </div>

          {/* Risk Segmentation Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Todos */}
            <button
              type="button"
              onClick={() => onRiskFilterChange('ALL')}
              className={clsx(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                riskFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              )}
            >
              <span>
                {t('hub:attendance_matrix.risk_filter_all', {
                  defaultValue: 'Todos',
                })}
              </span>
              <span
                className={clsx(
                  'px-1.5 py-0.2 rounded-md text-[10px] font-extrabold',
                  riskFilter === 'ALL'
                    ? 'bg-white/20 text-white'
                    : 'bg-white text-slate-700',
                )}
              >
                {riskCounts.all}
              </span>
            </button>

            {/* Crítico */}
            <button
              type="button"
              onClick={() => onRiskFilterChange(MatrixRiskLevel.CRITICAL)}
              className={clsx(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border',
                riskFilter === MatrixRiskLevel.CRITICAL
                  ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                  : 'bg-rose-50 text-rose-700 border-rose-200/60 hover:bg-rose-100',
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span>
                {t('hub:attendance_matrix.risk_filter_critical', {
                  defaultValue: 'Crítico (≤30%)',
                })}
              </span>
              <span
                className={clsx(
                  'px-1.5 py-0.2 rounded-md text-[10px] font-extrabold',
                  riskFilter === MatrixRiskLevel.CRITICAL
                    ? 'bg-white/20 text-white'
                    : 'bg-white text-rose-700',
                )}
              >
                {riskCounts.critical}
              </span>
            </button>

            {/* Alerta */}
            <button
              type="button"
              onClick={() => onRiskFilterChange(MatrixRiskLevel.ALERT)}
              className={clsx(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border',
                riskFilter === MatrixRiskLevel.ALERT
                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                  : 'bg-amber-50 text-amber-800 border-amber-200/60 hover:bg-amber-100',
              )}
            >
              <span>
                {t('hub:attendance_matrix.risk_filter_alert', {
                  defaultValue: 'Alerta (31-59%)',
                })}
              </span>
              <span
                className={clsx(
                  'px-1.5 py-0.2 rounded-md text-[10px] font-extrabold',
                  riskFilter === MatrixRiskLevel.ALERT
                    ? 'bg-white/20 text-white'
                    : 'bg-white text-amber-800',
                )}
              >
                {riskCounts.alert}
              </span>
            </button>

            {/* Regular */}
            <button
              type="button"
              onClick={() => onRiskFilterChange(MatrixRiskLevel.REGULAR)}
              className={clsx(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border',
                riskFilter === MatrixRiskLevel.REGULAR
                  ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                  : 'bg-teal-50 text-teal-800 border-teal-200/60 hover:bg-teal-100',
              )}
            >
              <span>
                {t('hub:attendance_matrix.risk_filter_regular', {
                  defaultValue: 'Regular (60-84%)',
                })}
              </span>
              <span
                className={clsx(
                  'px-1.5 py-0.2 rounded-md text-[10px] font-extrabold',
                  riskFilter === MatrixRiskLevel.REGULAR
                    ? 'bg-white/20 text-white'
                    : 'bg-white text-teal-800',
                )}
              >
                {riskCounts.regular}
              </span>
            </button>

            {/* Óptimo */}
            <button
              type="button"
              onClick={() => onRiskFilterChange(MatrixRiskLevel.OPTIMAL)}
              className={clsx(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border',
                riskFilter === MatrixRiskLevel.OPTIMAL
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200/60 hover:bg-emerald-100',
              )}
            >
              <span>
                {t('hub:attendance_matrix.risk_filter_optimal', {
                  defaultValue: 'Óptimo (85-100%)',
                })}
              </span>
              <span
                className={clsx(
                  'px-1.5 py-0.2 rounded-md text-[10px] font-extrabold',
                  riskFilter === MatrixRiskLevel.OPTIMAL
                    ? 'bg-white/20 text-white'
                    : 'bg-white text-emerald-800',
                )}
              >
                {riskCounts.optimal}
              </span>
            </button>
          </div>
        </div>

        {/* Search Input and Sort Dropdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
          <div className="md:col-span-2">
            <Input
              type="text"
              icon="search"
              placeholder={t('hub:attendance_matrix.search_placeholder', {
                defaultValue: 'Filtrar por nombre...',
              })}
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="w-full text-xs font-medium placeholder:text-gray-400 py-2"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 whitespace-nowrap flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {t('hub:attendance_matrix.order_by', {
                  defaultValue: 'Ordenar por:',
                })}
              </span>
            </label>
            <Select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as SortByOption)}
              className="w-full text-xs font-bold py-2"
            >
              <option value="UNEXCUSED_DESC">
                {t('hub:attendance_matrix.order_unexcused_desc', {
                  defaultValue: 'Mayor Inasistencia',
                })}
              </option>
              <option value="UNEXCUSED_ASC">
                {t('hub:attendance_matrix.order_unexcused_asc', {
                  defaultValue: 'Menor Inasistencia',
                })}
              </option>
              <option value="RATE_ASC">
                {t('hub:attendance_matrix.order_rate_asc', {
                  defaultValue: 'Tasa (Menor a Mayor)',
                })}
              </option>
              <option value="RATE_DESC">
                {t('hub:attendance_matrix.order_rate_desc', {
                  defaultValue: 'Tasa (Mayor a Menor)',
                })}
              </option>
              <option value="NAME_ASC">
                {t('hub:attendance_matrix.order_name_asc', {
                  defaultValue: 'Nombre A-Z',
                })}
              </option>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceMatrixFilters;
