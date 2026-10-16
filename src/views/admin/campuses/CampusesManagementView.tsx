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
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PullToRefresh from '@/components/ui/PullToRefresh';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { CellListSkeleton } from '@/components/ui/DetailSkeleton';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetChurchCampuses, DeleteChurchCampus } from '@/libs/state/redux/thunks/church/church.thunk';
import { ChurchCampusStateEnum, IChurchCampus, KidAttendanceFlowModeEnum } from '@/libs/models';
import { useChurchTerm } from '@/libs/hooks/useTerm';
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

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [campusToEdit, setCampusToEdit] = useState<IChurchCampus | null>(null);
  const [campusToDelete, setCampusToDelete] = useState<IChurchCampus | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCampuses.map((campus) => {
                const isActive = campus.state === ChurchCampusStateEnum.ACTIVE;

                return (
                  <div
                    key={campus.id}
                    className="group bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between gap-4"
                  >
                    {/* Top Row: Icon, Name, Position, Status & Actions */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={clsx(
                              'w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-colors',
                              isActive
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-100/70'
                                : 'bg-slate-100 text-slate-500 border-slate-200 group-hover:bg-slate-200/80',
                            )}
                          >
                            <Building2 size={20} />
                          </div>

                          <div className="min-w-0">
                            <h2 className="text-base font-extrabold text-slate-900 truncate">
                              {campus.name}
                            </h2>
                            <div className="flex items-center gap-1.5 mt-1">
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

                      {/* Address / Description */}
                      {campus.description ? (
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 line-clamp-2">
                          <Compass size={13} className="text-slate-400 shrink-0" />
                          <span>{campus.description}</span>
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 mt-1 italic">
                          {t('admin:campuses.field_description_placeholder')}
                        </p>
                      )}

                      {/* Flow Mode */}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[11px] font-semibold text-slate-400">
                          {t('admin:campuses.flow_badge_prefix')}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-[10px]">
                          {getFlowModeLabel(campus.kidAttendanceFlowMode)}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Bar: Jump directly to meetings of this campus */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`${APP_ROUTES.admin.churchMeetings}?campusId=${campus.id}`)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer group/link"
                      >
                        <CalendarClock size={15} />
                        <span>Ver {meetingsTerm}</span>
                        <ArrowRight size={13} className="group-hover/link:translate-x-0.5 transition-transform" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleOpenEdit(e, campus)}
                        className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                      >
                        Editar
                      </button>
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
