import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Inbox,
  Building2,
  Compass,
  CalendarClock,
  ArrowRight,
  Clock,
  FileText,
  Navigation,
  ExternalLink,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PullToRefresh from '@/components/ui/PullToRefresh';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { CellListSkeleton } from '@/components/ui/DetailSkeleton';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetChurchCampuses, DeleteChurchCampus } from '@/libs/state/redux/thunks/church/church.thunk';
import { useGetChurchMeetingsQuery } from '@/libs/state/redux/api/churchApi';
import {
  ChurchCampusStateEnum,
  ChurchMeetingStateEnum,
  IChurchCampus,
  IChurchMeeting,
  KidAttendanceFlowModeEnum,
} from '@/libs/models';
import { useChurchTerm } from '@/libs/hooks/useTerm';
import { LumbrelaDateTime } from '@/libs/utils/lumbrelaDateTime';
import { APP_ROUTES } from '@/config/routes';
import CampusModal from './components/CampusModal';
import { toast } from 'sonner';
import clsx from 'clsx';

type StatusFilterType = 'ALL' | 'ACTIVE' | 'INACTIVE';

/**
 * Main Campuses Management View at /admin/campuses.
 * Displays all church campuses with search filtering, order, and modal drawers for creation/edition.
 * Optimized for Desktop-First with a multi-column responsive grid and direct meeting links.
 *
 * @returns {JSX.Element} Rendered view.
 */
const CampusesManagementView: React.FC = () => {
  const { t } = useTranslation(['admin', 'common']);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const campusTerm = useChurchTerm('campus');
  const campusesTerm = useChurchTerm('campuses');
  const meetingsTerm = useChurchTerm('meetings');

  const campuses = useAppSelector((state) => state.churchCampusSlice);
  const { data: allMeetings } = useGetChurchMeetingsQuery();

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [campusToEdit, setCampusToEdit] = useState<IChurchCampus | null>(null);
  const [campusToDelete, setCampusToDelete] = useState<IChurchCampus | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Group meetings by campus ID for enriched card metrics
  const meetingsByCampus = useMemo(() => {
    const map = new Map<string, IChurchMeeting[]>();
    for (const m of allMeetings || []) {
      if (!m.churchCampusId) continue;
      const list = map.get(m.churchCampusId) || [];
      list.push(m);
      map.set(m.churchCampusId, list);
    }
    return map;
  }, [allMeetings]);

  // Load campuses on mount
  useEffect(() => {
    dispatch(GetChurchCampuses({ force: true }));
  }, [dispatch]);

  const handleRefresh = async () => {
    await dispatch(GetChurchCampuses({ force: true }));
  };

  const totalCampuses = campuses.data?.length || 0;
  const activeCampuses = campuses.data?.filter((c) => c.state === ChurchCampusStateEnum.ACTIVE).length || 0;
  const inactiveCampuses = totalCampuses - activeCampuses;

  const filteredCampuses = useMemo(() => {
    if (!campuses.data) return [];
    let list = [...campuses.data];

    // Status filter
    if (statusFilter === 'ACTIVE') {
      list = list.filter((c) => c.state === ChurchCampusStateEnum.ACTIVE);
    } else if (statusFilter === 'INACTIVE') {
      list = list.filter((c) => c.state !== ChurchCampusStateEnum.ACTIVE);
    }

    // Search text filter
    if (searchText.trim()) {
      const query = searchText.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          (c.description && c.description.toLowerCase().includes(query)),
      );
    }

    // Sort by position ascending, then name
    list.sort((a, b) => {
      const posA = a.position ?? 9999;
      const posB = b.position ?? 9999;
      if (posA !== posB) return posA - posB;
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [campuses.data, statusFilter, searchText]);

  const handleOpenCreate = () => {
    setCampusToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, c: IChurchCampus) => {
    e.stopPropagation();
    setCampusToEdit(c);
    setModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!campusToDelete) return;
    setIsDeleting(true);
    try {
      await dispatch(DeleteChurchCampus(campusToDelete.id)).unwrap();
      toast.success(t('admin:campuses.delete_success', { campus: campusTerm }));
      setCampusToDelete(null);
    } catch (err: any) {
      toast.error(
        typeof err === 'string' ? err : t('admin:campuses.delete_error', { campus: campusTerm }),
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const getFlowModeLabel = (mode?: KidAttendanceFlowModeEnum) => {
    if (!mode) return t('admin:campuses.flow_modes.ONLY_CHECK_IN');
    return t(`admin:campuses.flow_modes.${mode}`, {
      defaultValue: t('admin:campuses.flow_modes.ONLY_CHECK_IN'),
    });
  };

  return (
    <div className="min-h-full flex-1 w-full bg-slate-50/60 pb-16">
      {/* Mobile-only header with back button */}
      <PageHeader
        className="lg:hidden"
        title={t('admin:campuses.header_title', { campuses: campusesTerm })}
        onBack={() => navigate(APP_ROUTES.admin.root)}
        rightAction={
          <button
            type="button"
            onClick={handleOpenCreate}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 active:scale-95 text-white transition-all shadow-xs cursor-pointer"
            title={t('admin:campuses.new_campus_btn', { campus: campusTerm })}
          >
            <Plus size={18} />
          </button>
        }
      />

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 flex flex-col gap-6">
          {/* Header Summary Banner (Desktop-First) */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 lg:p-7 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4 min-w-0">
              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                <MapPin size={24} className="lg:w-7 lg:h-7" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
                  <Sparkles size={13} />
                  <span>{t('admin:campuses.badge')}</span>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight truncate">
                  {t('admin:campuses.title', { campuses: campusesTerm })}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 line-clamp-1">
                  {t('admin:campuses.subtitle')}
                </p>
              </div>
            </div>

            {/* Quick Metrics & Desktop Action Button */}
            <div className="flex items-center gap-3 self-stretch md:self-center shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 justify-between md:justify-end">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-bold text-slate-700">
                  {t('admin:campuses.stat_total')}: {totalCampuses}
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-xs font-bold text-emerald-700">
                  {t('admin:campuses.stat_active')}: {activeCampuses}
                </span>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={handleOpenCreate}
                className="hidden sm:inline-flex items-center gap-2 text-sm shadow-sm cursor-pointer"
              >
                <Plus size={16} />
                <span>{t('admin:campuses.new_campus_btn', { campus: campusTerm })}</span>
              </Button>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Status Filter Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/70 sm:w-80 shrink-0">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={clsx(
                  'py-2 text-xs font-bold rounded-xl transition-all cursor-pointer truncate',
                  statusFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800',
                )}
              >
                {t('admin:campuses.filter_all', { count: totalCampuses })}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ACTIVE')}
                className={clsx(
                  'py-2 text-xs font-bold rounded-xl transition-all cursor-pointer truncate',
                  statusFilter === 'ACTIVE'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800',
                )}
              >
                {t('admin:campuses.filter_active', { count: activeCampuses })}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('INACTIVE')}
                className={clsx(
                  'py-2 text-xs font-bold rounded-xl transition-all cursor-pointer truncate',
                  statusFilter === 'INACTIVE'
                    ? 'bg-white text-rose-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800',
                )}
              >
                {t('admin:campuses.filter_inactive', { count: inactiveCampuses })}
              </button>
            </div>

            {/* Search Input */}
            <div className="flex-1">
              <Input
                icon="search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onClear={() => setSearchText('')}
                placeholder={t('admin:campuses.search_placeholder')}
                className="bg-white border-slate-200 text-sm placeholder:text-gray-400 shadow-2xs"
              />
            </div>
          </div>

          {/* Campuses Responsive Grid */}
          {campuses.loading && campuses.data.length === 0 ? (
            <CellListSkeleton count={4} />
          ) : filteredCampuses.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-4">
                <Inbox size={28} />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {searchText || statusFilter !== 'ALL'
                  ? t('admin:campuses.no_results_title', { campuses: campusesTerm })
                  : t('admin:campuses.no_campuses_title', { campuses: campusesTerm })}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md">
                {searchText || statusFilter !== 'ALL'
                  ? t('admin:campuses.no_results_desc')
                  : t('admin:campuses.no_campuses_desc')}
              </p>
              {!searchText && statusFilter === 'ALL' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleOpenCreate}
                  className="mt-5 flex items-center gap-2 text-xs shadow-xs"
                >
                  <Plus size={15} />
                  <span>{t('admin:campuses.create_first_campus', { campus: campusTerm })}</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
              {filteredCampuses.map((campus) => {
                const isActive = campus.state === ChurchCampusStateEnum.ACTIVE;
                const campusMeetings = meetingsByCampus.get(campus.id) || [];
                const activeMeetingsCount = campusMeetings.filter(
                  (m) => m.state !== ChurchMeetingStateEnum.DELETED,
                ).length;
                const localTimeStr = LumbrelaDateTime()
                  .tz(campus.timezone || 'America/Bogota')
                  .format('hh:mm A');
                const hasGps = campus.latitude != null && campus.longitude != null;
                const mapsUrl = hasGps
                  ? `https://www.google.com/maps/search/?api=1&query=${campus.latitude},${campus.longitude}`
                  : null;

                return (
                  <div
                    key={campus.id}
                    className="group bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-slate-300 transition-all flex flex-col justify-between gap-5"
                  >
                    <div className="flex flex-col gap-4">
                      {/* Top Header Row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className={clsx(
                              'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all shadow-xs',
                              isActive
                                ? 'bg-gradient-to-br from-emerald-50 to-teal-100/60 text-emerald-700 border-emerald-200/80 group-hover:shadow-emerald-500/10'
                                : 'bg-slate-100 text-slate-500 border-slate-200 group-hover:bg-slate-200/80',
                            )}
                          >
                            <Building2 size={22} />
                          </div>

                          <div className="min-w-0">
                            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
                              {campus.name}
                            </h2>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              {campus.position !== undefined && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/70">
                                  {t('admin:campuses.order_badge', { order: campus.position })}
                                </span>
                              )}
                              <span
                                className={clsx(
                                  'text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1',
                                  isActive
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200/80',
                                )}
                              >
                                {isActive ? (
                                  <>
                                    <CheckCircle2 size={11} />
                                    <span>{t('admin:campuses.status_active')}</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle size={11} />
                                    <span>{t('admin:campuses.status_inactive')}</span>
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Top-Right Quick Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => handleOpenEdit(e, campus)}
                            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-600 active:scale-95 transition-all shadow-2xs cursor-pointer"
                            title={t('admin:campuses.edit_tooltip', { campus: campusTerm })}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCampusToDelete(campus);
                            }}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200/80 text-rose-600 active:scale-95 transition-all shadow-2xs cursor-pointer"
                            title={t('admin:campuses.delete_tooltip', { campus: campusTerm })}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Physical Address & Geolocation Box */}
                      {campus.address || campus.city ? (
                        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200/80 flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100/80 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                                <MapPin size={14} />
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-slate-800 block leading-snug">
                                  {campus.address || 'Ubicación física sin dirección'}
                                </span>
                                {(campus.city || campus.country) && (
                                  <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                                    {campus.city ? `${campus.city}${campus.stateProvince ? `, ${campus.stateProvince}` : ''}${campus.country ? `, ${campus.country}` : ''}` : campus.country}
                                  </span>
                                )}
                              </div>
                            </div>

                            {mapsUrl && (
                              <a
                                href={mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-white border border-indigo-200/80 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs hover:bg-indigo-50/50 transition-colors"
                                title="Abrir en Google Maps / Waze"
                              >
                                <Navigation size={12} className="text-indigo-500" />
                                <span>Ver mapa</span>
                                <ExternalLink size={10} className="text-slate-400" />
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-2xl bg-slate-50/60 border border-dashed border-slate-200 text-xs text-slate-400 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <MapPin size={13} className="text-slate-400" />
                            <span>Sin ubicación física ni mapa asignado</span>
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleOpenEdit(e, campus)}
                            className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                          >
                            Configurar
                          </button>
                        </div>
                      )}

                      {/* Additional Description / Access notes */}
                      {campus.description && (
                        <div className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-100 text-xs text-amber-900 flex items-start gap-2">
                          <FileText size={13} className="text-amber-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-2 leading-relaxed">{campus.description}</span>
                        </div>
                      )}

                      {/* Key Indicators Grid (2 columns inside card) */}
                      <div className="grid grid-cols-2 gap-2.5">
                        {/* Meetings Metric Box */}
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 text-primary flex items-center justify-center shrink-0 shadow-2xs">
                            <CalendarClock size={16} />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                              {meetingsTerm}
                            </span>
                            <span className="text-xs font-bold text-slate-800 truncate block">
                              {activeMeetingsCount > 0
                                ? `${activeMeetingsCount} regulares`
                                : 'Sin cultos'}
                            </span>
                          </div>
                        </div>

                        {/* Local Time & Timezone Metric Box */}
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
                            <Clock size={16} />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider truncate" title={campus.timezone}>
                              {campus.timezone?.split('/').pop()?.replace(/_/g, ' ') || 'Local'}
                            </span>
                            <span className="text-xs font-bold text-slate-800 truncate block">
                              {localTimeStr}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Attendance Flow Banner */}
                      <div className="px-3.5 py-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100/90 flex items-center justify-between gap-2 text-xs">
                        <span className="text-[11px] font-bold text-indigo-950 flex items-center gap-1.5">
                          <Sparkles size={13} className="text-indigo-600" />
                          <span>{t('admin:campuses.field_flow_label', 'Flujo de Niños')}</span>
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white border border-indigo-200 text-indigo-700 shadow-2xs">
                          {getFlowModeLabel(campus.kidAttendanceFlowMode)}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`${APP_ROUTES.admin.churchMeetings}?campusId=${campus.id}`)}
                        className="flex-1 flex items-center justify-center gap-2 text-xs py-2 shadow-2xs cursor-pointer group/link"
                      >
                        <CalendarClock size={15} />
                        <span>Ver {meetingsTerm} ({activeMeetingsCount})</span>
                        <ArrowRight size={13} className="group-hover/link:translate-x-0.5 transition-transform" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleOpenEdit(e, campus)}
                        className="text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-100/80 py-2 px-3.5 rounded-xl cursor-pointer"
                      >
                        Editar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* Campus Modal */}
      <CampusModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        campusToEdit={campusToEdit}
        onSuccess={handleRefresh}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={Boolean(campusToDelete)}
        onOpenChange={(open) => !open && setCampusToDelete(null)}
        title={t('admin:campuses.delete_confirm_title', { campus: campusTerm })}
        description={t('admin:campuses.delete_confirm_desc', {
          campus: campusTerm.toLowerCase(),
          name: campusToDelete?.name || '',
        })}
        confirmText={t('admin:campuses.delete_confirm_btn', { campus: campusTerm })}
        cancelText={t('common:actions.cancel')}
        type="danger"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default CampusesManagementView;
