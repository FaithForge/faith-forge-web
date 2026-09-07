import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Layers,
  Inbox,
  ArrowUpDown,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PullToRefresh from '@/components/ui/PullToRefresh';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { CellListSkeleton } from '@/components/ui/DetailSkeleton';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetChurchCampuses, DeleteChurchCampus } from '@/libs/state/redux/thunks/church/church.thunk';
import { ChurchCampusStateEnum, IChurchCampus } from '@/libs/models';
import { APP_ROUTES } from '@/config/routes';
import CampusModal from './components/CampusModal';
import { toast } from 'sonner';
import clsx from 'clsx';

/**
 * Main Campuses Management View at /admin/campuses.
 * Displays all church campuses with search filtering, order, and modal drawers for creation/edition.
 *
 * @returns {JSX.Element} Rendered view.
 */
const CampusesManagementView: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const campuses = useAppSelector((state) => state.churchCampusSlice);

  const [searchText, setSearchText] = useState('');
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

  const filteredCampuses = useMemo(() => {
    if (!campuses.data) return [];
    if (!searchText.trim()) return campuses.data;
    const query = searchText.toLowerCase().trim();
    return campuses.data.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        (c.description && c.description.toLowerCase().includes(query)),
    );
  }, [campuses.data, searchText]);

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
      toast.success('Sede eliminada correctamente');
      setCampusToDelete(null);
    } catch (err: any) {
      toast.error(typeof err === 'string' ? err : 'Error al eliminar la sede');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-full flex-1 w-full bg-slate-50 pb-20">
      <PageHeader
        title="Gestión de Sedes"
        onBack={() => navigate(APP_ROUTES.admin.root)}
        rightAction={
          <button
            type="button"
            onClick={handleOpenCreate}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 active:scale-95 text-white transition-all shadow-xs"
            title="Nueva Sede"
          >
            <Plus size={18} />
          </button>
        }
      />

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 flex flex-col gap-5">
          {/* Header Description Card */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                <MapPin size={22} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-0.5">
                  <Sparkles size={13} />
                  <span>Campus y Sedes Físicas</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight truncate">
                  Sedes de la Iglesia
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Administra las sedes físicas donde operan los servicios y actividades.
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
              <span>Nueva Sede</span>
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Search size={16} />
            </div>
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Buscar sede por nombre o dirección..."
              className="pl-9 bg-white border-gray-200 text-sm placeholder:text-gray-400 shadow-xs"
            />
          </div>

          {/* Campuses List */}
          {campuses.loading && campuses.data.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs">
              <CellListSkeleton count={4} />
            </div>
          ) : filteredCampuses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center shadow-xs flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 mb-3">
                <Inbox size={26} />
              </div>
              <h3 className="text-base font-bold text-gray-800">
                {searchText ? 'No se encontraron sedes' : 'No hay sedes registradas'}
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                {searchText
                  ? 'Intenta con otro término de búsqueda o limpia el filtro.'
                  : 'Crea la primera sede física para comenzar a estructurar los servicios y horarios.'}
              </p>
              {!searchText && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleOpenCreate}
                  className="mt-4 flex items-center gap-1.5"
                >
                  <Plus size={15} />
                  <span>Crear Sede</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredCampuses.map((campus) => {
                const isActive = campus.state === ChurchCampusStateEnum.ACTIVE;
                return (
                  <div
                    key={campus.id}
                    className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-gray-300"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-base font-bold text-gray-900 truncate">
                            {campus.name}
                          </h2>
                          {campus.position !== undefined && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                              Orden: #{campus.position}
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
                        {campus.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {campus.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={(e) => handleOpenEdit(e, campus)}
                        className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-xs font-semibold text-gray-700 flex items-center gap-1.5 transition-all shadow-2xs"
                      >
                        <Edit2 size={13} className="text-gray-500" />
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCampusToDelete(campus)}
                        className="w-8 h-8 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100 active:bg-rose-200/80 text-rose-600 flex items-center justify-center transition-all"
                        title="Eliminar Sede"
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
        title="¿Eliminar esta Sede?"
        description={`¿Estás seguro de que deseas eliminar la sede "${campusToDelete?.name}"? Esta acción la desactivará de forma segura.`}
        confirmText="Sí, eliminar sede"
        cancelText="Cancelar"
        type="danger"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default CampusesManagementView;
