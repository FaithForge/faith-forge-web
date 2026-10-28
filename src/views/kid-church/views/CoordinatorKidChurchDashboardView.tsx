import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  UserCheck,
  BarChart3,
  RefreshCw,
  ClipboardCheck,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import PullToRefresh from '@/components/ui/PullToRefresh';
import Alert from '@/components/ui/Alert';
import Input from '@/components/ui/Input';
import Cell from '@/components/ui/Cell';
import { CellListSkeleton } from '@/components/ui/DetailSkeleton';
import KidDetailsModal from '@/components/modal/KidDetailsModal';
import { useChurchTerm, useKidsTerm } from '@/libs/hooks/useTerm';
import { APP_ROUTES } from '@/config/routes';
import { usePermissions } from '@/libs/hooks/usePermissions';
import { IKid, IKidGroup, UserGenderCode } from '@/libs/models';
import { capitalizeWords, parseEntitySearchParams } from '@/libs/utils/text';
import useGroupCoordinatorStats, { isKidNewToday } from '../hooks/useGroupCoordinatorStats';
import GroupCoordinatorStatsCards from '../components/GroupCoordinatorStatsCards';
import KidsPerClassroomChart from '../components/KidsPerClassroomChart';
import KidsGenderChart from '../components/KidsGenderChart';
// import KidsAgeDistributionChart from '../components/KidsAgeDistributionChart';
import ServerDistributionCards from '../components/ServerDistributionCards';
import TeamAttendanceSummaryCard from '../components/TeamAttendanceSummaryCard';
import ServersPerAreaChart from '../components/ServersPerAreaChart';

type DashboardTab = 'metrics' | 'roster';

/**
 * Analytical and operational dashboard for Group Coordinators in Kid Church.
 * Combines high-level live metrics (Recharts visualizations, server distribution, child ratios)
 * with the full live roster and search capabilities.
 *
 * @returns {JSX.Element} Rendered dashboard view.
 */
export const CoordinatorKidChurchDashboardView: React.FC = () => {
  const { t } = useTranslation(['kidChurch', 'common']);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<DashboardTab>('metrics');
  const [searchText, setSearchText] = useState('');
  const [selectedKidGroupId, setSelectedKidGroupId] = useState<string>('');
  const [selectedKid, setSelectedKid] = useState<IKid | undefined>(undefined);
  const [openKidDrawer, setOpenKidDrawer] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const classroomsTerm = useKidsTerm('classrooms');
  const classroomTerm = useKidsTerm('classroom');
  const meetingTerm = useChurchTerm('meeting');
  const volunteersTerm = useChurchTerm('volunteer');
  const teachersTerm = useKidsTerm('teacher');
  const supervisorsTerm = useKidsTerm('supervisor');
  const coordinatorsTerm = useChurchTerm('coordinators');

  const { canTakeVolunteerAttendance } = usePermissions();

  const {
    currentMeeting,
    currentCampus,
    isConfigured,
    loading,
    isRefreshing,
    refetchAll,
    kids,
    kidGroups,
    kpis,
    classroomData,
    genderData,
    ageDistributionData,
    serverDistributionStats,
    teamAttendanceSummaryStats,
    attendanceSummary,
    staffRoleSummary,
    areaServerData,
  } = useGroupCoordinatorStats();

  const handleRefresh = async () => {
    try {
      await refetchAll();
      toast.success(t('dashboard.toast_refreshed'));
    } catch {
      toast.error(t('dashboard.toast_refresh_error'));
    }
  };

  // Filtered kid list for the roster tab
  const filteredKids = useMemo(() => {
    let result = kids || [];

    if (selectedKidGroupId) {
      result = result.filter((kid) => kid.kidGroup?.id === selectedKidGroupId);
    }

    if (searchText) {
      const { filterByFirstName, filterByLastName, numericId } = parseEntitySearchParams(searchText);
      if (numericId) {
        result = result.filter((kid) => {
          const code = String(kid.userCode || kid.id || '').toLowerCase();
          return code.includes(numericId.toLowerCase());
        });
      } else if (filterByFirstName || filterByLastName) {
        result = result.filter((kid) => {
          const first = (kid.firstName || '').toLowerCase();
          const last = (kid.lastName || '').toLowerCase();
          const matchFirst = filterByFirstName ? first.includes(filterByFirstName.toLowerCase()) : true;
          const matchLast = filterByLastName ? last.includes(filterByLastName.toLowerCase()) : true;
          return matchFirst && matchLast;
        });
      }
    }

    return result;
  }, [kids, selectedKidGroupId, searchText]);

  const handleKidClick = (kid: IKid) => {
    setSelectedKid(kid);
    setOpenKidDrawer(true);
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-4xl mx-auto w-full flex flex-col gap-3.5 min-h-full flex-1 pb-24 relative">
      {/* Service Info Banner */}
      {isConfigured && currentMeeting ? (
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-2xs border border-slate-200/90 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary block truncate">
              {currentCampus?.name || t('dashboard.campus_fallback')}
            </span>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">
              {currentMeeting.name}
            </h2>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
              {t(
                'coordinator_dashboard.subtitle',
                'Métricas del {{meeting}} y seguimiento en tiempo real',
                { meeting: meetingTerm.toLowerCase() },
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
            title={t('coordinator_dashboard.refresh', 'Actualizar')}
            className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 shadow-2xs transition-colors active:scale-95 disabled:opacity-50 cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <RefreshCw
              size={14}
              className={clsx((loading || isRefreshing) && 'animate-spin text-primary')}
            />
            <span className="hidden sm:inline">
              {t('coordinator_dashboard.refresh', 'Actualizar')}
            </span>
          </button>
        </div>
      ) : (
        <Alert
          type="error"
          title={t('dashboard.missing_config_title')}
          message={t('dashboard.missing_config_desc')}
        />
      )}

      {/* Volunteer Attendance Alert Banner for Group Coordinators */}
      {canTakeVolunteerAttendance &&
        currentMeeting &&
        attendanceSummary &&
        attendanceSummary.total > 0 && (
          <div>
            {attendanceSummary.counts.taken === 0 ? (
              <div
                onClick={() => navigate(APP_ROUTES.kidChurch.volunteerAttendance)}
                className="bg-amber-50 border border-amber-300 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2.5 shadow-2xs cursor-pointer hover:bg-amber-100/70 transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8.5 h-8.5 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <ClipboardCheck className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs sm:text-sm font-bold text-amber-950 leading-tight">
                      {t('volunteer_attendance.missing_alert')}
                    </h3>
                    <p className="text-[11px] text-amber-800/90 font-medium leading-tight mt-0.5">
                      {t('volunteer_attendance.subtitle')}
                    </p>
                  </div>
                </div>

                <div className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-2.5 sm:px-3 py-1.5 rounded-xl flex items-center gap-1 shrink-0 shadow-2xs">
                  <span>{t('volunteer_attendance.take_button_short')}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ) : attendanceSummary.counts.pending > 0 ? (
              <div
                onClick={() => navigate(APP_ROUTES.kidChurch.volunteerAttendance)}
                className="bg-amber-50/90 border border-amber-200 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2.5 shadow-2xs cursor-pointer hover:bg-amber-100/70 transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8.5 h-8.5 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center shrink-0">
                    <ClipboardCheck className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs sm:text-sm font-bold text-amber-950 leading-tight">
                      {t('volunteer_attendance.partial_alert', {
                        count: attendanceSummary.counts.pending,
                      })}
                    </h3>
                    <p className="text-[11px] text-amber-800 font-medium leading-tight mt-0.5">
                      {t('volunteer_attendance.progress', {
                        taken: attendanceSummary.counts.taken,
                        total: attendanceSummary.total,
                      })}
                    </p>
                  </div>
                </div>

                <div className="bg-primary hover:bg-primary-dark text-white font-bold text-xs px-2.5 sm:px-3 py-1.5 rounded-xl flex items-center gap-1 shrink-0 shadow-2xs">
                  <span>{t('volunteer_attendance.take_button_short')}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ) : (
              <div
                onClick={() => navigate(APP_ROUTES.kidChurch.volunteerAttendance)}
                className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2.5 shadow-2xs cursor-pointer hover:bg-emerald-100/70 transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-emerald-900 leading-tight">
                    {t('volunteer_attendance.completed_alert')}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-600 shrink-0" />
              </div>
            )}
          </div>
        )}

      {/* Segmented Control / Tabs: Métricas vs Lista de Niños */}
      <div className="bg-slate-200/70 p-1 rounded-2xl flex items-center gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('metrics')}
          className={clsx(
            'flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer',
            activeTab === 'metrics'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900',
          )}
        >
          <BarChart3 className="w-4 h-4 text-indigo-600" />
          <span>{t('coordinator_dashboard.tab_metrics', 'Estadísticas')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('roster')}
          className={clsx(
            'flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer',
            activeTab === 'roster'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900',
          )}
        >
          <Users className="w-4 h-4 text-primary" />
          <span>{t('coordinator_dashboard.tab_kids_roster', 'Lista de Niños')}</span>
          <span className="bg-primary/10 text-primary text-[11px] font-black px-2 py-0.5 rounded-full">
            {kids.length}
          </span>
        </button>
      </div>

      <PullToRefresh onRefresh={handleRefresh} disabled={loading || isRefreshing}>
        {/* TAB 1: MÉTRICAS & ANALÍTICA */}
        {activeTab === 'metrics' && (
          <div className="space-y-5">
            {/* 1. SECCIÓN: NIÑOS (PRIMERA) */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 px-0.5 pt-1">
                <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight uppercase">
                    {t('coordinator_dashboard.section_kids_title', {
                      classrooms: classroomsTerm,
                      defaultValue: `Niños & ${classroomsTerm}`,
                    })}
                  </h2>
                  <p className="text-[11px] font-semibold text-slate-500 leading-tight">
                    {t('coordinator_dashboard.section_kids_subtitle', {
                      classrooms: classroomsTerm.toLowerCase(),
                      defaultValue: `Asistencia infantil, distribución por ${classroomsTerm.toLowerCase()} y demografía`,
                    })}
                  </p>
                </div>
              </div>

              {/* Cajas informativas de Niños (Total Niños y Niños Nuevos) */}
              <GroupCoordinatorStatsCards kpis={kpis} />

              {/* Recharts Grid: Niños por Salón + Niños por Género */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <KidsPerClassroomChart
                  data={classroomData}
                  classroomTerm={classroomTerm}
                  classroomsTerm={classroomsTerm}
                  volunteersTerm={volunteersTerm}
                />
                <KidsGenderChart data={genderData} totalKids={kids.length} />
              </div>

              {/* Distribución por Edad (preservada para futuros reportes) */}
              {/* <KidsAgeDistributionChart
                data={ageDistributionData}
                totalKids={kids.length}
              /> */}
            </div>

            {/* 2. SECCIÓN: SERVIDORES (SEGUNDA) */}
            <div className="space-y-3.5 pt-3 border-t border-slate-200/90">
              <div className="flex items-center gap-2 px-0.5">
                <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight uppercase">
                    {t('coordinator_dashboard.section_servers_title', {
                      volunteers: volunteersTerm,
                      defaultValue: `Personal & ${volunteersTerm}`,
                    })}
                  </h2>
                  <p className="text-[11px] font-semibold text-slate-500 leading-tight">
                    {t('coordinator_dashboard.section_servers_subtitle', {
                      classrooms: classroomsTerm.toLowerCase(),
                      defaultValue: `Asistencia general del equipo y distribución por ${classroomsTerm.toLowerCase()}`,
                    })}
                  </p>
                </div>
              </div>

              {/* Asistencia General (Tarjeta con Total, Compl, Pend y 4 estados) */}
              <TeamAttendanceSummaryCard stats={teamAttendanceSummaryStats} />

              {/* Gráfico de Barras Horizontales de Servidores por Área */}
              <ServersPerAreaChart
                data={areaServerData}
                volunteersTerm={volunteersTerm}
                teachersTerm={teachersTerm}
                supervisorsTerm={supervisorsTerm}
                coordinatorsTerm={coordinatorsTerm}
              />

              {/* Distribución de Personal en Salones vs Otras Áreas */}
              <ServerDistributionCards
                stats={serverDistributionStats}
                classroomsTerm={classroomsTerm}
                volunteersTerm={volunteersTerm}
                teachersTerm={teachersTerm}
                supervisorsTerm={supervisorsTerm}
              />
            </div>

            {/* Safe spacer so last card never collides with floating BottomNav */}
            <div className="h-28 sm:h-32 shrink-0 pointer-events-none" aria-hidden="true" />
          </div>
        )}

        {/* TAB 2: LISTA DE NIÑOS */}
        {activeTab === 'roster' && (
          <div className="space-y-3">
            {/* Search Input */}
            <div>
              <Input
                ref={searchInputRef}
                icon="search"
                placeholder={t('dashboard.search_placeholder_multi')}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onClear={() => setSearchText('')}
                wrapperClassName="mb-0"
              />
            </div>

            {/* Classroom Pills */}
            {kidGroups.length > 1 && (
              <div className="bg-white p-3 rounded-2xl shadow-2xs border border-slate-200/90 flex flex-col gap-2">
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    {classroomsTerm}
                  </span>
                  {selectedKidGroupId && (
                    <button
                      type="button"
                      onClick={() => setSelectedKidGroupId('')}
                      className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                    >
                      {t('dashboard.view_all')}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-6 gap-2">
                  {kidGroups.map((group: IKidGroup, index: number) => {
                    const isSelected = selectedKidGroupId === group.id;
                    const count = kids.filter((k) => k.kidGroup?.id === group.id).length;

                    let colSpanClass = 'col-span-2';
                    if (kidGroups.length === 2) {
                      colSpanClass = 'col-span-3';
                    } else {
                      const remainder = kidGroups.length % 3;
                      if (remainder === 1 && index === kidGroups.length - 1) {
                        colSpanClass = 'col-span-6';
                      } else if (remainder === 2 && index >= kidGroups.length - 2) {
                        colSpanClass = 'col-span-3';
                      }
                    }

                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => setSelectedKidGroupId(isSelected ? '' : group.id)}
                        className={clsx(
                          'py-2 px-1.5 rounded-xl text-center border transition-all flex flex-col items-center justify-center active:scale-95 cursor-pointer min-w-0',
                          colSpanClass,
                          isSelected
                            ? 'bg-primary/10 border-primary shadow-xs ring-1 ring-primary/30'
                            : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100 text-slate-700',
                        )}
                      >
                        <p
                          className={clsx(
                            'text-xs font-bold truncate w-full',
                            isSelected ? 'text-primary' : 'text-slate-800',
                          )}
                        >
                          {group.name}
                        </p>
                        <span
                          className={clsx(
                            'text-xs font-extrabold mt-0.5',
                            isSelected ? 'text-primary' : 'text-slate-500',
                          )}
                        >
                          {count === 1
                            ? t('dashboard.kids_count_one')
                            : t('dashboard.kids_count_other', { count })}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Kids List */}
            <div className="flex flex-col gap-2 mt-1">
              {loading && kids.length === 0 && <CellListSkeleton count={6} />}

              {!loading && filteredKids.length === 0 && (
                <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
                  <Users size={36} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-semibold text-slate-600">
                    {t('dashboard.empty_title')}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {searchText
                      ? t('dashboard.empty_desc_search')
                      : t('dashboard.empty_desc_default')}
                  </p>
                </div>
              )}

              {filteredKids.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden">
                  {filteredKids.map((kid: IKid) => {
                    const ageYears = Math.floor(kid.age ?? 0);
                    const ageMonths = kid.ageInMonths ? kid.ageInMonths - ageYears * 12 : 0;
                    const ageText = `${ageYears} años ${ageMonths > 0 ? `y ${ageMonths}m` : ''}`.trim();
                    const subtitleText = t('dashboard.classroom_label', {
                      classroom: kid.kidGroup?.name || t('dashboard.classroom_no_group'),
                      age: ageText,
                    });

                    const isNew = isKidNewToday(kid);
                    const badgeElement = (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isNew && (
                          <span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-100 text-amber-900 rounded-full border border-amber-200">
                            ✨ {t('coordinator_dashboard.new_kid_badge', 'Nuevo')}
                          </span>
                        )}
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                          {t('dashboard.in_classroom')}
                        </span>
                      </div>
                    );

                    return (
                      <Cell
                        key={kid.id || kid.userCode}
                        title={capitalizeWords(`${kid.firstName || ''} ${kid.lastName || ''}`.trim())}
                        subtitle={subtitleText}
                        gender={kid.gender === UserGenderCode.FEMALE ? 'F' : 'M'}
                        photoUrl={kid.photoUrl}
                        isRegistered={true}
                        badge={badgeElement}
                        onClick={() => handleKidClick(kid)}
                      />
                    );
                  })}
                </div>
              )}

              {/* Safe spacer for roster tab */}
              <div className="h-28 sm:h-32 shrink-0 pointer-events-none" aria-hidden="true" />
            </div>
          </div>
        )}
      </PullToRefresh>

      {/* Kid Details Bottom Sheet */}
      <KidDetailsModal
        open={openKidDrawer}
        onOpenChange={setOpenKidDrawer}
        kid={selectedKid}
        showEpsAlert={false}
      />
    </div>
  );
};

export default CoordinatorKidChurchDashboardView;
