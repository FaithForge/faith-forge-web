import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Bluetooth,
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
  UpdateChurchPrinter,
} from '@/libs/state/redux/thunks/church/church.thunk';
import { ChurchPrinterStateEnum, IChurchPrinter } from '@/libs/models';
import { APP_ROUTES } from '@/config/routes';
import PrinterModal from './components/PrinterModal';
import { toast } from 'sonner';
import clsx from 'clsx';

/**
 * Main Printers Management View at /admin/printers.
 * Allows administrators to manage thermal Bluetooth and network printers scoped by campus.
 *
 * @returns {JSX.Element} Rendered view.
 */
const PrintersManagementView: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const campuses = useAppSelector((state) => state.churchCampusSlice);
  const printersSlice = useAppSelector((state) => state.churchPrinterSlice);

  const [selectedCampusId, setSelectedCampusId] = useState<string>('');
  const [searchText, setSearchText] = useState('');
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

  const filteredPrinters = useMemo(() => {
    if (!searchText.trim()) return campusPrinters;
    const query = searchText.toLowerCase().trim();
    return campusPrinters.filter((p) => p.name.toLowerCase().includes(query));
  }, [campusPrinters, searchText]);

  const handleOpenCreate = () => {
    setPrinterToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, p: IChurchPrinter) => {
    e.stopPropagation();
    setPrinterToEdit(p);
    setModalOpen(true);
  };

  const handleToggleState = async (printer: IChurchPrinter) => {
    const isCurrentlyActive = printer.state === ChurchPrinterStateEnum.ACTIVE;
    const nextState = isCurrentlyActive ? ChurchPrinterStateEnum.INACTIVE : ChurchPrinterStateEnum.ACTIVE;

    try {
      await dispatch(
        UpdateChurchPrinter({
          id: printer.id,
          state: nextState,
          churchCampusId: selectedCampusId,
        }),
      ).unwrap();
      toast.success(`Impresora ${nextState === ChurchPrinterStateEnum.ACTIVE ? 'activada' : 'deshabilitada'}`);
    } catch (err: any) {
      toast.error(typeof err === 'string' ? err : 'Error al cambiar estado de la impresora');
    }
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
      toast.success('Impresora eliminada correctamente');
      setPrinterToDelete(null);
    } catch (err: any) {
      toast.error(typeof err === 'string' ? err : 'Error al eliminar la impresora');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-full flex-1 w-full bg-slate-50 pb-20">
      <PageHeader
        title="Gestión de Impresoras"
        onBack={() => navigate(APP_ROUTES.admin.root)}
        rightAction={
          <button
            type="button"
            onClick={handleOpenCreate}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 active:scale-95 text-white transition-all shadow-xs"
            title="Nueva Impresora"
          >
            <Plus size={18} />
          </button>
        }
      />

      <PullToRefresh onRefresh={fetchPrinters}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 flex flex-col gap-5">
          {/* Header Card */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 border border-cyan-100 flex items-center justify-center shrink-0">
                <Printer size={22} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-600 uppercase tracking-wider mb-0.5">
                  <Sparkles size={13} />
                  <span>Hardware y Dispositivos</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight truncate">
                  Impresoras Térmicas
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Administra las impresoras térmicas ESC/POS asignadas para los tickets de check-in.
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
              className="shrink-0 hidden sm:flex items-center gap-1.5"
            >
              <Plus size={16} />
              <span>Registrar Impresora</span>
            </Button>
          </div>

          {/* Filters Bar: Campus Selector + Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="w-full sm:w-72">
              <SelectSearch
                label="Filtrar por Sede"
                placeholder="Seleccionar sede..."
                options={campusOptions}
                value={selectedCampusId}
                onChange={setSelectedCampusId}
              />
            </div>
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Search size={16} />
              </div>
              <Input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Buscar impresora por nombre..."
                className="pl-9 bg-white border-gray-200 text-sm placeholder:text-gray-400 shadow-xs"
              />
            </div>
          </div>

          {/* Printers List */}
          {loadingPrinters && campusPrinters.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs">
              <CellListSkeleton count={3} />
            </div>
          ) : filteredPrinters.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center shadow-xs flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 mb-3">
                <Inbox size={26} />
              </div>
              <h3 className="text-base font-bold text-gray-800">
                {searchText ? 'No se encontraron impresoras' : 'No hay impresoras en esta sede'}
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                {searchText
                  ? 'Intenta con otro término de búsqueda.'
                  : 'Registra el nombre de la impresora física Bluetooth asignada a esta sede.'}
              </p>
              {!searchText && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleOpenCreate}
                  className="mt-4 flex items-center gap-1.5"
                >
                  <Plus size={15} />
                  <span>Registrar Impresora</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredPrinters.map((printer) => {
                const isActive = printer.state === ChurchPrinterStateEnum.ACTIVE;
                return (
                  <div
                    key={printer.id}
                    className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-gray-300"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Printer size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-base font-bold text-gray-900 truncate">
                            {printer.name}
                          </h2>
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
                                <span>Activa</span>
                              </>
                            ) : (
                              <>
                                <XCircle size={11} />
                                <span>Inactiva</span>
                              </>
                            )}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                          <Bluetooth size={12} className="text-blue-500 shrink-0" />
                          <span>Identificador Bluetooth / Térmica 58mm / 80mm</span>
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => handleToggleState(printer)}
                        className={clsx(
                          'px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs',
                          isActive
                            ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
                        )}
                      >
                        <span>{isActive ? 'Deshabilitar' : 'Habilitar'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleOpenEdit(e, printer)}
                        className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-xs font-semibold text-gray-700 flex items-center gap-1.5 transition-all shadow-2xs"
                      >
                        <Edit2 size={13} className="text-gray-500" />
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrinterToDelete(printer)}
                        className="w-8 h-8 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100 active:bg-rose-200/80 text-rose-600 flex items-center justify-center transition-all"
                        title="Eliminar Impresora"
                      >
                        <Trash2 size={14} />
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
        title="¿Eliminar esta Impresora?"
        description={`¿Estás seguro de que deseas eliminar la impresora "${printerToDelete?.name}"?`}
        confirmText="Sí, eliminar impresora"
        cancelText="Cancelar"
        type="danger"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default PrintersManagementView;
