import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Layers,
  Plus,
  ChevronRight,
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
import {
  GetMinistries,
  GetMinistryAreas,
  GetMinistryGroupConfigs,
} from '@/libs/state/redux/thunks/church/ministry.thunk';
import { GetVolunteerAssignments } from '@/libs/state/redux/thunks/church/volunteer.thunk';
import { updateCurrentChurchCampus } from '@/libs/state/redux/slices/church/churchCampus.slice';
import {
  IMinistry,
  MinistryAreaStateEnum,
  MinistryGroupConfigStateEnum,
  MinistryStateEnum,
} from '@/libs/models';
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
  const [searchParams, setSearchParams] = useSearchParams();

  const campuses = useAppSelector((state) => state.churchCampusSlice);
  const { ministries, loadingMinistries, areasByMinistry, groupsByMinistry } = useAppSelector(
    (state) => state.ministrySlice,
  );
  const { assignmentsByPartition } = useAppSelector((state) => state.volunteerSlice);

  const [selectedCampusId, setSelectedCampusId] = useState<string>(() => {
    const urlCampusId = searchParams.get('campusId');
    if (urlCampusId) return urlCampusId;
    const sessionCampusId = sessionStorage.getItem('ministries_selected_campus_id');
    if (sessionCampusId) return sessionCampusId;
    return campuses.current?.id || '';
  });
  const [searchText, setSearchText] = useState<string>(() => searchParams.get('search') || '');
  const [modalOpen, setModalOpen] = useState(false);
  const [ministryToEdit, setMinistryToEdit] = useState<IMinistry | null>(null);

  // Load campuses on view mount
  useEffect(() => {
    if (campuses.data.length === 0) {
      dispatch(GetChurchCampuses());
    }
  }, [dispatch, campuses.data.length]);

  // Synchronize or auto-select campus once campuses are loaded
  useEffect(() => {
    if (campuses.data.length === 0) return;

    const urlCampusId = searchParams.get('campusId');
    const sessionCampusId = sessionStorage.getItem('ministries_selected_campus_id');
    const reduxCampusId = campuses.current?.id;

    // If currently selected ID is valid among campuses, persist and keep it
    if (selectedCampusId && campuses.data.some((c) => c.id === selectedCampusId)) {
      sessionStorage.setItem('ministries_selected_campus_id', selectedCampusId);
      if (searchParams.get('campusId') !== selectedCampusId) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.set('campusId', selectedCampusId);
            return next;
          },
          { replace: true },
        );
      }
      return;
    }

    // Determine candidate based on priority: URL -> SessionStorage -> Redux Current -> First Campus
    const candidateId =
      (urlCampusId && campuses.data.some((c) => c.id === urlCampusId) && urlCampusId) ||
      (sessionCampusId && campuses.data.some((c) => c.id === sessionCampusId) && sessionCampusId) ||
      (reduxCampusId && campuses.data.some((c) => c.id === reduxCampusId) && reduxCampusId) ||
      campuses.data[0]?.id ||
      '';

    if (candidateId) {
      setSelectedCampusId(candidateId);
      sessionStorage.setItem('ministries_selected_campus_id', candidateId);
      if (searchParams.get('campusId') !== candidateId) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.set('campusId', candidateId);
            return next;
          },
          { replace: true },
        );
      }
    }
  }, [campuses.data, campuses.current?.id, searchParams, selectedCampusId, setSearchParams]);

  // Fetch ministries for the selected campus
  useEffect(() => {
    if (selectedCampusId) {
      dispatch(GetMinistries({ churchCampusId: selectedCampusId }));
    }
  }, [dispatch, selectedCampusId]);

  // Fetch summary metrics (areas, groups, volunteer assignments) for ministries
  useEffect(() => {
    if (ministries.length > 0) {
      ministries.forEach((m) => {
        if (!areasByMinistry[m.id]) {
          dispatch(GetMinistryAreas({ ministryId: m.id, force: false }));
        }
        if (!groupsByMinistry[m.id]) {
          dispatch(GetMinistryGroupConfigs({ ministryId: m.id, force: false }));
        }
        const partitionKey = `ministry_stats_${m.id}`;
        if (!assignmentsByPartition[partitionKey]) {
          dispatch(
            GetVolunteerAssignments({
              ministryId: m.id,
              partitionKey,
              limit: 500,
              force: false,
            }),
          );
        }
      });
    }
  }, [dispatch, ministries, areasByMinistry, groupsByMinistry, assignmentsByPartition]);

  const campusOptions = useMemo(() => {
    return campuses.data.map((c) => ({
      id: c.id,
      name: c.name,
    }));
  }, [campuses.data]);

  const handleCampusChange = (newCampusId: string) => {
    setSelectedCampusId(newCampusId);
    sessionStorage.setItem('ministries_selected_campus_id', newCampusId);
    dispatch(updateCurrentChurchCampus(newCampusId));
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('campusId', newCampusId);
        return next;
      },
      { replace: true },
    );
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchText(val);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (val.trim()) {
          next.set('search', val);
        } else {
          next.delete('search');
        }
        return next;
      },
      { replace: true },
    );
  };

  const handleClearSearch = () => {
    setSearchText('');
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('search');
        return next;
      },
      { replace: true },
    );
  };

  const handleOpenMinistry = (ministryId: string) => {
    navigate(APP_ROUTES.admin.ministryTeams(ministryId), {
      state: {
        returnUrl: `${APP_ROUTES.admin.ministries}?campusId=${selectedCampusId}${
          searchText.trim() ? `&search=${encodeURIComponent(searchText.trim())}` : ''
        }`,
      },
    });
  };

  const handleRefresh = async () => {
    if (selectedCampusId) {
      await dispatch(GetMinistries({ churchCampusId: selectedCampusId, force: true }));
    }
  };

  const filteredMinistries = useMemo(() => {
    const list = ministries.filter((m) => m.state !== MinistryStateEnum.DELETED);
    if (!searchText.trim()) return list;
    const query = searchText.toLowerCase().trim();
    return list.filter(
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
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 active:scale-95 text-white transition-all cursor-pointer"
            title="Nuevo Ministerio"
          >
            <Plus size={18} />
          </button>
        }
      />

      <div className="max-w-2xl mx-auto p-4 sm:p-6 flex flex-col gap-4">
        {/* Unified Clean Controls: Sede + Buscador */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-200/80 shadow-2xs flex flex-col gap-3">
          <div>
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin size={12} className="text-primary" /> Sede (Campus)
              </span>
              <span className="text-xs font-semibold text-gray-400">
                {filteredMinistries.length} {filteredMinistries.length === 1 ? 'ministerio' : 'ministerios'}
              </span>
            </div>
            <SelectSearch
              label=""
              placeholder="Seleccionar sede..."
              options={campusOptions}
              value={selectedCampusId}
              onChange={handleCampusChange}
              searchable={campusOptions.length > 4}
              disabled={campuses.loading}
            />
          </div>

          <Input
            value={searchText}
            onChange={handleSearchChange}
            placeholder="Buscar ministerio por nombre..."
            icon="search"
            onClear={handleClearSearch}
          />
        </div>

        {/* Content list with PullToRefresh */}
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="flex flex-col gap-2.5">
            {loadingMinistries && ministries.length === 0 ? (
              <CellListSkeleton count={4} />
            ) : filteredMinistries.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-gray-200/80 text-center flex flex-col items-center justify-center gap-3 shadow-2xs">
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
                const ministryCampusName =
                  ministry.churchCampus?.name ||
                  campuses.data.find((c) => c.id === ministry.churchCampusId)?.name ||
                  '';

                const ministryAreas = areasByMinistry[ministry.id];
                const ministryGroups = groupsByMinistry[ministry.id];
                const ministryAssignments = assignmentsByPartition[`ministry_stats_${ministry.id}`];

                const areasCount = ministryAreas
                  ? ministryAreas.filter((a) => a.state !== MinistryAreaStateEnum.DELETED).length
                  : null;

                const groupsCount = ministryGroups
                  ? ministryGroups.filter((g) => g.state !== MinistryGroupConfigStateEnum.DELETED).length
                  : null;

                const volunteersCount = ministryAssignments
                  ? new Set(
                      ministryAssignments
                        .map((asg) => asg.volunteerId || asg.volunteer?.id)
                        .filter(Boolean),
                    ).size
                  : null;

                const hasMetrics =
                  areasCount !== null || groupsCount !== null || volunteersCount !== null;

                return (
                  <div
                    key={ministry.id}
                    onClick={() => handleOpenMinistry(ministry.id)}
                    className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200/80 shadow-2xs hover:border-primary/40 hover:shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer group active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-50 to-indigo-100/70 text-indigo-700 border border-indigo-200/80 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                        <Layers size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-primary transition-colors truncate">
                            {ministry.name}
                          </h2>
                          <span
                            className={clsx(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold shrink-0',
                              ministry.state === MinistryStateEnum.ACTIVE
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                                : 'bg-gray-100 text-gray-600 border border-gray-200',
                            )}
                          >
                            {ministry.state === MinistryStateEnum.ACTIVE ? (
                              <>
                                <CheckCircle2 size={9.5} /> Activo
                              </>
                            ) : (
                              <>
                                <XCircle size={9.5} /> Inactivo
                              </>
                            )}
                          </span>
                        </div>

                        {ministry.description ? (
                          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                            {ministry.description}
                          </p>
                        ) : ministryCampusName ? (
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <MapPin size={11} className="text-gray-400 shrink-0" />
                            <span>{ministryCampusName}</span>
                          </p>
                        ) : null}

                        {hasMetrics && (
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium mt-1 flex-wrap">
                            <span>
                              <strong className="text-gray-700 font-semibold">
                                {groupsCount ?? 0}
                              </strong>{' '}
                              {groupsCount === 1 ? 'grupo' : 'grupos'}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span>
                              <strong className="text-gray-700 font-semibold">
                                {areasCount ?? 0}
                              </strong>{' '}
                              {areasCount === 1 ? 'área' : 'áreas'}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span>
                              <strong className="text-gray-700 font-semibold">
                                {volunteersCount ?? 0}
                              </strong>{' '}
                              {volunteersCount === 1 ? 'servidor' : 'servidores'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions: Edit & Chevron */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleOpenEdit(e, ministry)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
                        title="Editar ministerio"
                      >
                        <Edit2 size={13.5} />
                      </button>
                      <div className="w-5 h-5 flex items-center justify-center text-gray-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all">
                        <ChevronRight size={17} />
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
