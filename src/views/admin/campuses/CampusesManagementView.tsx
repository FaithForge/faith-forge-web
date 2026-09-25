import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MapPin,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Inbox,
  Building2,
  Compass,
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
 *
 * @returns {JSX.Element} Rendered view.
 */
const CampusesManagementView: React.FC = () => {
  const { t } = useTranslation(['admin', 'common']);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const campusTerm = useChurchTerm('campus');
  const campusesTerm = useChurchTerm('campuses');

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
    <div className="min-h-full flex-1 w-full bg-slate-50/60 pb-20">
      <PageHeader
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 sm:pt-5 flex flex-col gap-4">
          {/* Header Summary Banner */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                <MapPin size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">
                  <Sparkles size={12} />
                  <span>{t('admin:campuses.badge')}</span>
                </div>
                <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight truncate">
                  {t('admin:campuses.title', { campuses: campusesTerm })}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                  {t('admin:campuses.subtitle')}
                </p>
              </div>
            </div>

            {/* Quick Metrics & Desktop Action */}
            <div className="flex items-center gap-2 self-start sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200/80 text-[11px] font-bold text-slate-700">
                  {t('admin:campuses.stat_total')}: {totalCampuses}
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200/80 text-[11px] font-bold text-emerald-700">
                  {t('admin:campuses.stat_active')}: {activeCampuses}
                </span>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenCreate}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs shadow-xs"
              >
                <Plus size={15} />
                <span>{t('admin:campuses.new_campus_btn', { campus: campusTerm })}</span>
              </Button>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Status Filter Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100/90 rounded-2xl border border-gray-200/70 sm:w-80 shrink-0">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={clsx(
                  'py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer truncate',
                  statusFilter === 'ALL'
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-800',
                )}
              >
                {t('admin:campuses.filter_all', { count: totalCampuses })}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ACTIVE')}
                className={clsx(
                  'py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer truncate',
                  statusFilter === 'ACTIVE'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-800',
                )}
              >
                {t('admin:campuses.filter_active', { count: activeCampuses })}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('INACTIVE')}
                className={clsx(
                  'py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer truncate',
                  statusFilter === 'INACTIVE'
                    ? 'bg-white text-rose-700 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-800',
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
                className="bg-white border-gray-200 text-sm placeholder:text-gray-400 shadow-2xs"
              />
            </div>
          </div>

          {/* Campuses Cards List */}
          {campuses.loading && campuses.data.length === 0 ? (
            <CellListSkeleton count={4} />
          ) : filteredCampuses.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200/70 p-10 text-center shadow-2xs flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-gray-400 mb-3">
                <Inbox size={24} />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-gray-800">
                {searchText || statusFilter !== 'ALL'
                  ? t('admin:campuses.no_results_title', { campuses: campusesTerm })
                  : t('admin:campuses.no_campuses_title', { campuses: campusesTerm })}
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                {searchText || statusFilter !== 'ALL'
                  ? t('admin:campuses.no_results_desc')
                  : t('admin:campuses.no_campuses_desc')}
              </p>
              {!searchText && statusFilter === 'ALL' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleOpenCreate}
                  className="mt-4 flex items-center gap-1.5 text-xs"
                >
                  <Plus size={14} />
                  <span>{t('admin:campuses.create_first_campus', { campus: campusTerm })}</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filteredCampuses.map((campus) => {
                const isActive = campus.state === ChurchCampusStateEnum.ACTIVE;

                return (
                  <div
                    key={campus.id}
                    onClick={() => {
                      setCampusToEdit(campus);
                      setModalOpen(true);
                    }}
                    className="group bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200/80 shadow-2xs hover:shadow-xs hover:border-gray-300 transition-all cursor-pointer flex flex-col gap-2.5 active:scale-[0.995]"
                  >
                    {/* Header Row: Icon, Name, Order, Badges, and Top-Right Actions */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={clsx(
                            'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-colors',
                            isActive
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100/90 group-hover:bg-emerald-100/70'
                              : 'bg-slate-100 text-slate-500 border-slate-200 group-hover:bg-slate-200/80',
                          )}
                        >
                          <Building2 size={18} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-sm sm:text-base font-extrabold text-gray-900 truncate">
                              {campus.name}
                            </h2>

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

                          {/* Address / Description if present */}
                          {campus.description ? (
                            <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5 line-clamp-1">
                              <Compass size={12} className="text-gray-400 shrink-0" />
                              <span className="truncate">{campus.description}</span>
                            </p>
                          ) : (
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {t('admin:campuses.field_description_placeholder')}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Top-Right Quick Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                        <button
                          type="button"
                          onClick={(e) => handleOpenEdit(e, campus)}
                          className="p-1.5 sm:p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-600 active:scale-95 transition-all shadow-2xs cursor-pointer"
                          title={t('admin:campuses.edit_tooltip', { campus: campusTerm })}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCampusToDelete(campus);
                          }}
                          className="p-1.5 sm:p-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200/80 text-rose-600 active:scale-95 transition-all shadow-2xs cursor-pointer"
                          title={t('admin:campuses.delete_tooltip', { campus: campusTerm })}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Operational Footer Meta */}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-400">
                          {t('admin:campuses.flow_badge_prefix')}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-[10px]">
                          {getFlowModeLabel(campus.kidAttendanceFlowMode)}
                        </span>
                      </div>

                      <span className="text-[10px] text-gray-400 group-hover:text-primary font-medium transition-colors">
                        Tocar para editar →
                      </span>
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
