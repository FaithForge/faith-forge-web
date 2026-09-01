import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Plus,
  Search,
  ChevronRight,
  Sparkles,
  Edit2,
  CheckCircle2,
  XCircle,
  Inbox,
  MapPin,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SelectSearch from '@/components/ui/SelectSearch';
import PullToRefresh from '@/components/ui/PullToRefresh';
import { CellListSkeleton } from '@/components/ui/DetailSkeleton';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetChurchCampuses } from '@/libs/state/redux/thunks/church/church.thunk';
import { GetMinistries } from '@/libs/state/redux/thunks/church/ministry.thunk';
import { IMinistry } from '@/libs/models';
import { APP_ROUTES } from '@/config/routes';
import MinistryModal from './components/MinistryModal';
import clsx from 'clsx';

/**
 * Main Ministries Management View at /admin/ministries.
 * Displays all ministries belonging to the selected campus with search filtering and creation drawer.
 *
 * @returns {JSX.Element} Rendered view.
 */
const MinistriesManagementView: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const campuses = useAppSelector((state) => state.churchCampusSlice);
  const { ministries, loadingMinistries } = useAppSelector((state) => state.ministrySlice);

  const [selectedCampusId, setSelectedCampusId] = useState<string>('');
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [ministryToEdit, setMinistryToEdit] = useState<IMinistry | null>(null);

  // Load campuses on view mount
  useEffect(() => {
    if (campuses.data.length === 0) {
      dispatch(GetChurchCampuses());
    }
  }, [dispatch, campuses.data.length]);

  // Auto-select the first available campus if none is selected
  useEffect(() => {
    if (!selectedCampusId && campuses.data.length > 0) {
      setSelectedCampusId(campuses.data[0].id);
    }
  }, [campuses.data, selectedCampusId]);

  // Fetch ministries for the selected campus
  useEffect(() => {
    if (selectedCampusId) {
      dispatch(GetMinistries({ churchCampusId: selectedCampusId }));
    }
  }, [dispatch, selectedCampusId]);

  const campusOptions = useMemo(() => {
    return campuses.data.map((c) => ({
      id: c.id,
      name: c.name,
    }));
  }, [campuses.data]);

  const handleRefresh = async () => {
    if (selectedCampusId) {
      await dispatch(GetMinistries({ churchCampusId: selectedCampusId, force: true }));
    }
  };

  const filteredMinistries = useMemo(() => {
    if (!searchText.trim()) return ministries;
    const query = searchText.toLowerCase().trim();
    return ministries.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        (m.description && m.description.toLowerCase().includes(query)),
    );
  }, [ministries, searchText]);

  const handleOpenCreate = () => {
    setMinistryToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, m: IMinistry) => {
    e.stopPropagation();
    setMinistryToEdit(m);
    setModalOpen(true);
  };

  return (
    <div className="min-h-full flex-1 w-full bg-slate-50 pb-20">
      <PageHeader
        title="Gestión de Ministerios"
        onBack={() => navigate(APP_ROUTES.admin.root)}
        rightAction={
          <button
            type="button"
            onClick={handleOpenCreate}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 active:scale-95 text-white transition-all"
            title="Nuevo Ministerio"
          >
            <Plus size={18} />
          </button>
        }
      />

      <div className="max-w-2xl mx-auto p-4 sm:p-6 flex flex-col gap-5">
        {/* Informative Header Card */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-1">
            <Sparkles size={14} />
            <span>Módulo de Ministerios</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
            Ministerios de la Iglesia
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Administra los ministerios oficiales, configura sus áreas de servicio y equipos por sede.
          </p>

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-600">
              Total: {ministries.length} {ministries.length === 1 ? 'ministerio' : 'ministerios'}
            </span>
            <Button
              onClick={handleOpenCreate}
              size="sm"
              className="bg-primary text-white text-xs gap-1 py-1.5"
            >
              <Plus size={14} /> Nuevo Ministerio
            </Button>
          </div>
        </div>

        {/* Selector de Sede */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center">
              <MapPin size={14} />
            </div>
            <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
              Sede (Campus)
            </h2>
          </div>

          <SelectSearch
            label=""
            placeholder="Seleccionar sede..."
            options={campusOptions}
            value={selectedCampusId}
            onChange={(val) => setSelectedCampusId(val)}
            searchable={campusOptions.length > 4}
            disabled={campuses.loading}
          />
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Buscar ministerio por nombre..."
            icon="search"
            onClear={() => setSearchText('')}
          />
        </div>

        {/* Content list with PullToRefresh */}
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="flex flex-col gap-3">
            {loadingMinistries && ministries.length === 0 ? (
              <CellListSkeleton count={4} />
            ) : filteredMinistries.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-gray-200/80 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-gray-400">
                  <Inbox size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800">
                    {searchText ? 'No se encontraron ministerios' : 'Sin ministerios registrados'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {searchText
                      ? 'Intenta con otro término de búsqueda.'
                      : 'Comienza creando el primer ministerio de la iglesia.'}
                  </p>
                </div>
                {!searchText && (
                  <Button onClick={handleOpenCreate} size="sm" className="mt-2 text-xs">
                    <Plus size={14} /> Crear Primer Ministerio
                  </Button>
                )}
              </div>
            ) : (
              filteredMinistries.map((ministry) => {
                return (
                  <div
                    key={ministry.id}
                    onClick={() => navigate(APP_ROUTES.admin.ministryDetail(ministry.id))}
                    className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs hover:border-primary/40 hover:shadow-sm cursor-pointer transition-all active:scale-[0.99] flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Layers size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-sm font-bold text-gray-900 truncate">
                            {ministry.name}
                          </h2>
                          <span
                            className={clsx(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0',
                              ministry.active
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                                : 'bg-gray-100 text-gray-600 border border-gray-200',
                            )}
                          >
                            {ministry.active ? (
                              <>
                                <CheckCircle2 size={10} /> Activo
                              </>
                            ) : (
                              <>
                                <XCircle size={10} /> Inactivo
                              </>
                            )}
                          </span>
                        </div>
                        {ministry.description && (
                          <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                            {ministry.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleOpenEdit(e, ministry)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-slate-100 transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={15} />
                      </button>
                      <div className="w-6 h-6 flex items-center justify-center text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all">
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </PullToRefresh>
      </div>

      <MinistryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        ministryToEdit={ministryToEdit}
        churchCampusId={selectedCampusId}
        onSuccess={() => {
          if (selectedCampusId) {
            dispatch(GetMinistries({ churchCampusId: selectedCampusId, force: true }));
          }
        }}
      />
    </div>
  );
};

export default MinistriesManagementView;
