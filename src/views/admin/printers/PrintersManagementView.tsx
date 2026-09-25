import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Printer,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Inbox,
  MapPin,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SelectSearch from '@/components/ui/SelectSearch';
import PullToRefresh from '@/components/ui/PullToRefresh';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { CellListSkeleton } from '@/components/ui/DetailSkeleton';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import {
  GetChurchCampuses,
  GetChurchPrintersAdmin,
  DeleteChurchPrinter,
} from '@/libs/state/redux/thunks/church/church.thunk';
import { ChurchPrinterStateEnum, IChurchPrinter } from '@/libs/models';
import { useChurchTerm } from '@/libs/hooks/useTerm';
import { APP_ROUTES } from '@/config/routes';
import PrinterModal from './components/PrinterModal';
import { toast } from 'sonner';
import clsx from 'clsx';

type StatusFilterType = 'ALL' | 'ACTIVE' | 'INACTIVE';

/**
 * Main Printers Management View at /admin/printers.
 * Allows administrators to manage thermal Bluetooth and network printers scoped by campus.
 * Follows the sleek, modern design system established for admin views.
 *
 * @returns {JSX.Element} Rendered view.
 */
const PrintersManagementView: React.FC = () => {
  const { t } = useTranslation(['admin', 'common']);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const campusTerm = useChurchTerm('campus');

  const campuses = useAppSelector((state) => state.churchCampusSlice);
  const printersSlice = useAppSelector((state) => state.churchPrinterSlice);

  const [selectedCampusId, setSelectedCampusId] = useState<string>('');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [printerToEdit, setPrinterToEdit] = useState<IChurchPrinter | null>(null);
  const [printerToDelete, setPrinterToDelete] = useState<IChurchPrinter | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingPrinters, setLoadingPrinters] = useState(false);

  // Load campuses on mount
  useEffect(() => {
    if (campuses.data.length === 0) {
      dispatch(GetChurchCampuses());
    }
  }, [dispatch, campuses.data.length]);

  // Auto-select first campus
  useEffect(() => {
    if (!selectedCampusId && campuses.data.length > 0) {
      setSelectedCampusId(campuses.data[0].id);
    }
  }, [campuses.data, selectedCampusId]);

  // Fetch printers when selected campus changes
  const fetchPrinters = useCallback(async () => {
    if (!selectedCampusId) return;
    setLoadingPrinters(true);
    try {
      await dispatch(GetChurchPrintersAdmin(selectedCampusId)).unwrap();
    } catch {
      // Error handled in thunk
    } finally {
      setLoadingPrinters(false);
    }
  }, [dispatch, selectedCampusId]);

  useEffect(() => {
    fetchPrinters();
  }, [fetchPrinters]);

  const campusOptions = useMemo(() => {
    return campuses.data.map((c) => ({
      id: c.id,
      name: c.name,
    }));
  }, [campuses.data]);

  const campusPrinters = useMemo(() => {
    if (!selectedCampusId || !printersSlice.adminPrintersByCampus) return [];
    return printersSlice.adminPrintersByCampus[selectedCampusId] || [];
  }, [printersSlice.adminPrintersByCampus, selectedCampusId]);

  const totalPrinters = campusPrinters.length;
  const activePrinters = campusPrinters.filter((p) => p.state === ChurchPrinterStateEnum.ACTIVE).length;
  const inactivePrinters = totalPrinters - activePrinters;

  const filteredPrinters = useMemo(() => {
    let list = [...campusPrinters];

    // Status filter
    if (statusFilter === 'ACTIVE') {
      list = list.filter((p) => p.state === ChurchPrinterStateEnum.ACTIVE);
    } else if (statusFilter === 'INACTIVE') {
      list = list.filter((p) => p.state !== ChurchPrinterStateEnum.ACTIVE);
    }

    // Search query
    if (searchText.trim()) {
      const query = searchText.toLowerCase().trim();
      list = list.filter((p) => p.name.toLowerCase().includes(query));
    }

    // Sort alphabetically by name
    list.sort((a, b) => a.name.localeCompare(b.name));

    return list;
  }, [campusPrinters, statusFilter, searchText]);

  const handleOpenCreate = () => {
    setPrinterToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, p: IChurchPrinter) => {
    e.stopPropagation();
    setPrinterToEdit(p);
    setModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!printerToDelete || !selectedCampusId) return;
    setIsDeleting(true);
    try {
      await dispatch(
        DeleteChurchPrinter({
          id: printerToDelete.id,
          churchCampusId: selectedCampusId,
        }),
      ).unwrap();
      toast.success(t('admin:printers.delete_success'));
      setPrinterToDelete(null);
    } catch (err: any) {
      toast.error(typeof err === 'string' ? err : t('admin:printers.delete_error'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-full flex-1 w-full bg-slate-50/60 pb-20">
      <PageHeader
        title={t('admin:printers.header_title')}
        onBack={() => navigate(APP_ROUTES.admin.root)}
        rightAction={
          <button
            type="button"
            onClick={handleOpenCreate}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 active:scale-95 text-white transition-all shadow-xs cursor-pointer"
            title={t('admin:printers.new_printer_btn')}
          >
            <Plus size={18} />
          </button>
        }
      />

      <PullToRefresh onRefresh={fetchPrinters}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 sm:pt-5 flex flex-col gap-4">
          {/* Header Summary Banner */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-cyan-50 text-cyan-600 border border-cyan-100 flex items-center justify-center shrink-0">
                <Printer size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-600 uppercase tracking-wider mb-0.5">
                  <Sparkles size={12} />
                  <span>{t('admin:printers.badge')}</span>
                </div>
                <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight truncate">
                  {t('admin:printers.title')}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                  {t('admin:printers.subtitle')}
                </p>
              </div>
            </div>

            {/* Quick Metrics & Desktop Action */}
            <div className="flex items-center gap-2 self-start sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200/80 text-[11px] font-bold text-slate-700">
                  {t('admin:printers.stat_total')}: {totalPrinters}
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200/80 text-[11px] font-bold text-emerald-700">
                  {t('admin:printers.stat_active')}: {activePrinters}
                </span>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenCreate}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs shadow-xs"
              >
                <Plus size={15} />
                <span>{t('admin:printers.new_printer_btn')}</span>
              </Button>
            </div>
          </div>

          {/* Filters Bar: Campus Selector + Status Tabs + Search */}
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col sm:flex-row gap-2.5">
              {/* Campus Selector */}
              <div className="w-full sm:w-72 shrink-0">
                <SelectSearch
                  label={t('admin:printers.filter_campus_label', { campus: campusTerm })}
                  placeholder={t('admin:printers.select_campus_placeholder', { campus: campusTerm })}
                  options={campusOptions}
                  value={selectedCampusId}
                  onChange={setSelectedCampusId}
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100/90 rounded-2xl border border-gray-200/70 flex-1">
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
                  {t('admin:printers.filter_all', { count: totalPrinters })}
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
                  {t('admin:printers.filter_active', { count: activePrinters })}
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
                  {t('admin:printers.filter_inactive', { count: inactivePrinters })}
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div>
              <Input
                icon="search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onClear={() => setSearchText('')}
                placeholder={t('admin:printers.search_placeholder')}
                className="bg-white border-gray-200 text-sm placeholder:text-gray-400 shadow-2xs"
              />
            </div>
          </div>

          {/* Printers Cards List */}
          {loadingPrinters && campusPrinters.length === 0 ? (
            <CellListSkeleton count={3} />
          ) : filteredPrinters.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200/70 p-10 text-center shadow-2xs flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-gray-400 mb-3">
                <Inbox size={24} />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-gray-800">
                {searchText || statusFilter !== 'ALL'
                  ? t('admin:printers.no_results_title')
                  : t('admin:printers.no_printers_title', { campus: campusTerm })}
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                {searchText || statusFilter !== 'ALL'
                  ? t('admin:printers.no_results_desc')
                  : t('admin:printers.no_printers_desc', { campus: campusTerm })}
              </p>
              {!searchText && statusFilter === 'ALL' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleOpenCreate}
                  className="mt-4 flex items-center gap-1.5 text-xs"
                >
                  <Plus size={14} />
                  <span>{t('admin:printers.new_printer_btn')}</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filteredPrinters.map((printer) => {
                const isActive = printer.state === ChurchPrinterStateEnum.ACTIVE;

                return (
                  <div
                    key={printer.id}
                    onClick={() => {
                      setPrinterToEdit(printer);
                      setModalOpen(true);
                    }}
                    className="group bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200/80 shadow-2xs hover:shadow-xs hover:border-gray-300 transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.995]"
                  >
                    {/* Left: Icon, Name and Status Badge */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={clsx(
                          'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-colors',
                          isActive
                            ? 'bg-cyan-50 text-cyan-600 border-cyan-100/90 group-hover:bg-cyan-100/70'
                            : 'bg-slate-100 text-slate-500 border-slate-200 group-hover:bg-slate-200/80',
                        )}
                      >
                        <Printer size={18} />
                      </div>

                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <h2 className="text-sm sm:text-base font-extrabold text-gray-900 truncate">
                          {printer.name}
                        </h2>

                        <span
                          className={clsx(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0',
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                              : 'bg-rose-50 text-rose-700 border border-rose-200/80',
                          )}
                        >
                          {isActive ? (
                            <>
                              <CheckCircle2 size={11} />
                              <span>{t('admin:printers.status_active')}</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={11} />
                              <span>{t('admin:printers.status_inactive')}</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Right: Edit + Delete */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleOpenEdit(e, printer)}
                        className="p-1.5 sm:p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-600 active:scale-95 transition-all shadow-2xs cursor-pointer"
                        title={t('admin:printers.edit_tooltip')}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPrinterToDelete(printer);
                        }}
                        className="p-1.5 sm:p-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200/80 text-rose-600 active:scale-95 transition-all shadow-2xs cursor-pointer"
                        title={t('admin:printers.delete_tooltip')}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* Printer Modal */}
      <PrinterModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        printerToEdit={printerToEdit}
        churchCampusId={selectedCampusId}
        onSuccess={fetchPrinters}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={Boolean(printerToDelete)}
        onOpenChange={(open) => !open && setPrinterToDelete(null)}
        title={t('admin:printers.delete_confirm_title')}
        description={t('admin:printers.delete_confirm_desc', {
          name: printerToDelete?.name || '',
        })}
        confirmText={t('admin:printers.delete_confirm_btn')}
        cancelText={t('common:actions.cancel')}
        type="danger"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default PrintersManagementView;
