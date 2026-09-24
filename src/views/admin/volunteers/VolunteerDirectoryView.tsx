import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  ChevronRight,
  Sparkles,
  Inbox,
  User as UserIcon,
  Phone,
  FileText,
  MapPin,
  Filter,
  SlidersHorizontal,
  RotateCcw,
  Loader2,
  X,
  Shield,
  ChevronDown,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import AppDrawer from '@/components/ui/AppDrawer';
import PullToRefresh from '@/components/ui/PullToRefresh';
import { CellListSkeleton } from '@/components/ui/DetailSkeleton';
import { useInfiniteScroll } from '@/libs/hooks/useInfiniteScroll';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetChurchCampuses } from '@/libs/state/redux/thunks/church/church.thunk';
import { GetMinistries } from '@/libs/state/redux/thunks/church/ministry.thunk';
import {
  GetMoreVolunteers,
  GetVolunteerAssignments,
  GetVolunteers,
} from '@/libs/state/redux/thunks/church/volunteer.thunk';
import {
  GetVolunteersPayload,
  IVolunteer,
  VolunteerRole,
  MinistryVolunteerStateEnum,
} from '@/libs/models';
import { useChurchTerm, getVolunteerRoleLabel } from '@/libs/hooks/useTerm';
import { APP_ROUTES } from '@/config/routes';
import { formatPhoneWithDialCode } from '@/libs/utils/text';
import RegisterVolunteerModal from './components/RegisterVolunteerModal';
import VolunteerDetailDrawer from './components/VolunteerDetailDrawer';
import { VolunteerApplicationsTab } from './components/VolunteerApplicationsTab';
import EndOfListFunnyBadge from '@/components/ui/EndOfListFunnyBadge';
import clsx from 'clsx';

const STATUS_FILTERS: { label: string; value: 'ALL' | 'ACTIVE' | 'INACTIVE' }[] = [
  { label: 'Todos los estados', value: 'ALL' },
  { label: 'Activos', value: 'ACTIVE' },
  { label: 'Inactivos', value: 'INACTIVE' },
];

/**
 * Global Volunteers Directory View at /admin/volunteers.
 * Allows administrators to query volunteers across all ministries and campuses,
 * check their cross-ministry roles, filter by category pills, and inspect details.
 *
 * @returns {JSX.Element} Rendered volunteer directory.
 */
const VolunteerDirectoryView: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const churchId = import.meta.env.VITE_CHURCH_ID;

  const { ministries, areasByMinistry } = useAppSelector((state) => state.ministrySlice);
  const campuses = useAppSelector((state) => state.churchCampusSlice.data);
  const {
    volunteers: { data: volunteers, currentPage, totalPages, loading },
    assignments,
  } = useAppSelector((state) => state.volunteerSlice);

  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedMinistryFilter, setSelectedMinistryFilter] = useState<string>('ALL');
  const [selectedCampusFilter, setSelectedCampusFilter] = useState<string>('ALL');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<VolunteerRole | 'ALL'>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>(
    'ALL',
  );

  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<IVolunteer | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<'DIRECTORY' | 'APPLICATIONS'>('DIRECTORY');

  const activeCategoryFilterCount =
    (selectedMinistryFilter !== 'ALL' ? 1 : 0) +
    (selectedCampusFilter !== 'ALL' ? 1 : 0) +
    (selectedRoleFilter !== 'ALL' ? 1 : 0) +
    (selectedStatusFilter !== 'ALL' ? 1 : 0);

  const volunteerTerm = useChurchTerm('volunteer');
  const volunteersTerm = useChurchTerm('volunteers');
  const campusTerm = useChurchTerm('campus');
  const campusesTerm = useChurchTerm('campuses');
  const churchOverrides = useAppSelector(
    (state) =>
      state.churchCampusSlice.churchTerminologyOverrides ||
      state.churchCampusSlice.church?.terminologyOverrides,
  );

  const selectedMinistry = useMemo(
    () => ministries.find((m) => m.id === selectedMinistryFilter),
    [ministries, selectedMinistryFilter],
  );

  const roleFilters = useMemo(
    () => [
      { label: 'Todos los roles', value: 'ALL' as const },
      {
        label: getVolunteerRoleLabel(VolunteerRole.MINISTRY_GENERAL_COORDINATOR, {
          ministryType: selectedMinistry?.type,
          ministryOverrides: selectedMinistry?.terminologyOverrides,
          churchOverrides,
          plural: true,
        }),
        value: VolunteerRole.MINISTRY_GENERAL_COORDINATOR,
      },
      {
        label: getVolunteerRoleLabel(VolunteerRole.AREA_GENERAL_COORDINATOR, {
          ministryType: selectedMinistry?.type,
          ministryOverrides: selectedMinistry?.terminologyOverrides,
          churchOverrides,
          plural: true,
        }),
        value: VolunteerRole.AREA_GENERAL_COORDINATOR,
      },
      {
        label: getVolunteerRoleLabel(VolunteerRole.GROUP_COORDINATOR, {
          ministryType: selectedMinistry?.type,
          ministryOverrides: selectedMinistry?.terminologyOverrides,
          churchOverrides,
          plural: true,
        }),
        value: VolunteerRole.GROUP_COORDINATOR,
      },
      {
        label: getVolunteerRoleLabel(VolunteerRole.SUPERVISOR, {
          ministryType: selectedMinistry?.type,
          ministryOverrides: selectedMinistry?.terminologyOverrides,
          churchOverrides,
          plural: true,
        }),
        value: VolunteerRole.SUPERVISOR,
      },
      {
        label: getVolunteerRoleLabel(VolunteerRole.VOLUNTEER, {
          ministryType: selectedMinistry?.type,
          ministryOverrides: selectedMinistry?.terminologyOverrides,
          churchOverrides,
          plural: true,
        }),
        value: VolunteerRole.VOLUNTEER,
      },
    ],
    [selectedMinistry, churchOverrides],
  );

  // Debounce search input by 400ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
    }, 400);
    return () => clearTimeout(handler);
  }, [searchText]);

  // Initial metadata fetch (ministries, campuses, assignments)
  useEffect(() => {
    if (campuses.length === 0) {
      dispatch(GetChurchCampuses());
    }
    dispatch(GetMinistries({ churchId }));
    dispatch(GetVolunteerAssignments({ force: false }));
  }, [dispatch, churchId, campuses.length]);

  // Build filter query payload helper
  const getFilterPayload = useCallback(
    (pageNumber = 1): GetVolunteersPayload => {
      return {
        page: pageNumber,
        limit: 20,
        order: 'DESC',
        search: debouncedSearch || undefined,
        ministryId: selectedMinistryFilter !== 'ALL' ? selectedMinistryFilter : undefined,
        churchCampusId: selectedCampusFilter !== 'ALL' ? selectedCampusFilter : undefined,
        role: selectedRoleFilter !== 'ALL' ? selectedRoleFilter : undefined,
        state:
          selectedStatusFilter === 'ACTIVE'
            ? MinistryVolunteerStateEnum.ACTIVE
            : selectedStatusFilter === 'INACTIVE'
              ? MinistryVolunteerStateEnum.INACTIVE
              : undefined,
      };
    },
    [
      debouncedSearch,
      selectedMinistryFilter,
      selectedCampusFilter,
      selectedRoleFilter,
      selectedStatusFilter,
    ],
  );

  // Fetch page 1 when any filter or debounced search changes
  useEffect(() => {
    dispatch(GetVolunteers(getFilterPayload(1)));
  }, [dispatch, getFilterPayload]);

  const handleRefresh = async () => {
    await Promise.all([
      dispatch(GetVolunteers({ ...getFilterPayload(1), force: true })),
      dispatch(GetVolunteerAssignments({ force: true })),
    ]);
  };

  const hasMore = currentPage < totalPages;

  // Infinite Scroll: Load more volunteers when user scrolls down
  const handleLoadMore = useCallback(() => {
    dispatch(GetMoreVolunteers(getFilterPayload(currentPage + 1)));
  }, [currentPage, dispatch, getFilterPayload]);

  const { sentinelRef, loadingMore, triggerLoadMore } = useInfiniteScroll({
    onLoadMore: handleLoadMore,
    hasMore,
    isLoading: loading,
    threshold: 250,
    cooldownMs: 800,
  });

  // Reset all filters to default
  const handleResetFilters = () => {
    setSearchText('');
    setDebouncedSearch('');
    setSelectedMinistryFilter('ALL');
    setSelectedCampusFilter('ALL');
    setSelectedRoleFilter('ALL');
    setSelectedStatusFilter('ALL');
  };

  const hasActiveFilters = Boolean(
    debouncedSearch ||
      selectedMinistryFilter !== 'ALL' ||
      selectedCampusFilter !== 'ALL' ||
      selectedRoleFilter !== 'ALL' ||
      selectedStatusFilter !== 'ALL',
  );

  // Group assignments by volunteerId and userId for badge display
  const assignmentsByVolunteerId = useMemo(() => {
    const map: Record<string, typeof assignments> = {};
    assignments.forEach((asg) => {
      const vId = asg.volunteerId || asg.ministryVolunteerId;
      if (vId) {
        if (!map[vId]) map[vId] = [];
        map[vId].push(asg);
      }
      const uId = asg.volunteer?.userId || asg.ministryVolunteer?.userId;
      if (uId) {
        if (!map[uId]) map[uId] = [];
        map[uId].push(asg);
      }
    });
    return map;
  }, [assignments]);

  const handleOpenDetail = (vol: IVolunteer) => {
    setSelectedVolunteer(vol);
    setDetailDrawerOpen(true);
  };

  return (
    <div className="min-h-full flex-1 w-full bg-slate-50 pb-20">
      <PageHeader
        title={`Directorio de ${volunteersTerm}`}
        onBack={() => navigate(APP_ROUTES.admin.root)}
        rightAction={
          <button
            type="button"
            onClick={() => setRegisterModalOpen(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 active:scale-95 text-white transition-all"
            title={`Registrar ${volunteerTerm}`}
          >
            <Plus size={18} />
          </button>
        }
      />

      <div className="max-w-2xl mx-auto p-4 sm:p-6 flex flex-col gap-4">
        {/* Info Header Card */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-1">
            <Sparkles size={14} />
            <span>Módulo de {volunteersTerm}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
            Directorio Global de {volunteersTerm}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Visualiza todos los {volunteersTerm.toLowerCase()} de la iglesia, sus asignaciones entre ministerios y roles
            activos.
          </p>

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-600">
              Total cargados: {volunteers.length}{' '}
              {volunteers.length === 1 ? volunteerTerm.toLowerCase() : volunteersTerm.toLowerCase()}
            </span>
            <Button
              onClick={() => setRegisterModalOpen(true)}
              size="sm"
              className="text-xs gap-1 py-1.5"
            >
              <Plus size={14} /> Registrar {volunteerTerm}
            </Button>
          </div>
        </div>

        {/* Main Tabs Navigation */}
        <div className="flex bg-gray-200/70 p-1 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => setActiveMainTab('DIRECTORY')}
            className={clsx(
              'flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer',
              activeMainTab === 'DIRECTORY'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            )}
          >
            <UserIcon size={15} />
            <span>Directorio de {volunteersTerm}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMainTab('APPLICATIONS')}
            className={clsx(
              'flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer',
              activeMainTab === 'APPLICATIONS'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            )}
          >
            <Sparkles size={15} className={activeMainTab === 'APPLICATIONS' ? 'text-emerald-600' : ''} />
            <span>Registros de {volunteersTerm}</span>
          </button>
        </div>

        {activeMainTab === 'APPLICATIONS' ? (
          <VolunteerApplicationsTab />
        ) : (
          <>
            {/* Search Bar + Filter Modal Trigger */}
            <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Buscar por nombre o número de documento..."
              icon="search"
              onClear={() => setSearchText('')}
              wrapperClassName="mb-0"
            />
          </div>
          <button
            type="button"
            onClick={() => setFilterDrawerOpen(true)}
            className={clsx(
              'h-11 px-3.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold text-xs transition-all active:scale-95 shrink-0 cursor-pointer shadow-2xs',
              activeCategoryFilterCount > 0
                ? 'bg-primary text-white border-primary shadow-xs'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-slate-50',
            )}
            title="Abrir filtros"
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filtros</span>
            {activeCategoryFilterCount > 0 && (
              <span
                className={clsx(
                  'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black',
                  activeCategoryFilterCount > 0
                    ? 'bg-white text-primary'
                    : 'bg-primary text-white',
                )}
              >
                {activeCategoryFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter Modal Drawer */}
        <AppDrawer
          open={filterDrawerOpen}
          onOpenChange={setFilterDrawerOpen}
          title={`Filtros de ${volunteersTerm}`}
          icon={<SlidersHorizontal className="text-primary" size={20} />}
        >
          <div className="flex flex-col gap-4 p-4 max-h-[75vh] overflow-y-auto">
            {/* Ministry Filter */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Ministerio
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedMinistryFilter('ALL')}
                  className={clsx(
                    'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                    selectedMinistryFilter === 'ALL'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-slate-100 text-gray-600 hover:bg-slate-200',
                  )}
                >
                  Todos los Ministerios
                </button>
                {ministries.map((m) => {
                  const isSelected = selectedMinistryFilter === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMinistryFilter(m.id)}
                      className={clsx(
                        'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                        isSelected
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-slate-100 text-gray-600 hover:bg-slate-200',
                      )}
                    >
                      {m.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Campus Filter */}
            <div className="flex flex-col gap-1.5 pt-3 border-t border-gray-100">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                {campusTerm}
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedCampusFilter('ALL')}
                  className={clsx(
                    'px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer',
                    selectedCampusFilter === 'ALL'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-slate-100 text-gray-600 hover:bg-slate-200',
                  )}
                >
                  <MapPin size={12} />
                  Todas las {campusesTerm}
                </button>
                {campuses.map((c) => {
                  const isSelected = selectedCampusFilter === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCampusFilter(c.id)}
                      className={clsx(
                        'px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer',
                        isSelected
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-slate-100 text-gray-600 hover:bg-slate-200',
                      )}
                    >
                      <MapPin size={12} />
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Role Filter */}
            <div className="flex flex-col gap-1.5 pt-3 border-t border-gray-100">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Rol de Servicio
              </span>
              <div className="flex flex-wrap gap-1.5">
                {roleFilters.map((rf) => {
                  const isSelected = selectedRoleFilter === rf.value;
                  return (
                    <button
                      key={rf.value}
                      type="button"
                      onClick={() => setSelectedRoleFilter(rf.value)}
                      className={clsx(
                        'px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer',
                        isSelected
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-slate-100 text-gray-600 hover:bg-slate-200',
                      )}
                    >
                      <Shield size={12} />
                      {rf.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex flex-col gap-1.5 pt-3 border-t border-gray-100">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Estado
              </span>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_FILTERS.map((sf) => {
                  const isSelected = selectedStatusFilter === sf.value;
                  return (
                    <button
                      key={sf.value}
                      type="button"
                      onClick={() => setSelectedStatusFilter(sf.value)}
                      className={clsx(
                        'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                        isSelected
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-slate-100 text-gray-600 hover:bg-slate-200',
                      )}
                    >
                      {sf.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
              <Button
                type="button"
                variant="default"
                className="flex-1 text-xs"
                onClick={() => {
                  setSelectedMinistryFilter('ALL');
                  setSelectedCampusFilter('ALL');
                  setSelectedRoleFilter('ALL');
                  setSelectedStatusFilter('ALL');
                }}
                disabled={activeCategoryFilterCount === 0}
              >
                Limpiar Filtros
              </Button>
              <Button
                type="button"
                className="flex-1 text-xs"
                onClick={() => setFilterDrawerOpen(false)}
              >
                Ver Resultados
              </Button>
            </div>
          </div>
        </AppDrawer>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between gap-2 p-3 bg-slate-100/90 rounded-2xl border border-gray-200/90 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1">
                <Filter size={12} /> Filtros:
              </span>
              {debouncedSearch && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-white border border-gray-200 text-gray-700 shadow-2xs">
                  Texto: "{debouncedSearch}"
                  <button
                    type="button"
                    onClick={() => setSearchText('')}
                    className="hover:text-rose-500 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {selectedMinistryFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-white border border-gray-200 text-gray-700 shadow-2xs">
                  {ministries.find((m) => m.id === selectedMinistryFilter)?.name || 'Ministerio'}
                  <button
                    type="button"
                    onClick={() => setSelectedMinistryFilter('ALL')}
                    className="hover:text-rose-500 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {selectedCampusFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-white border border-gray-200 text-gray-700 shadow-2xs">
                  {campuses.find((c) => c.id === selectedCampusFilter)?.name || 'Sede'}
                  <button
                    type="button"
                    onClick={() => setSelectedCampusFilter('ALL')}
                    className="hover:text-rose-500 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {selectedRoleFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-white border border-gray-200 text-gray-700 shadow-2xs">
                  {getVolunteerRoleLabel(selectedRoleFilter, {
                    ministryType: selectedMinistry?.type,
                    ministryOverrides: selectedMinistry?.terminologyOverrides,
                    churchOverrides,
                    short: true,
                  })}
                  <button
                    type="button"
                    onClick={() => setSelectedRoleFilter('ALL')}
                    className="hover:text-rose-500 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {selectedStatusFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-white border border-gray-200 text-gray-700 shadow-2xs">
                  {selectedStatusFilter === 'ACTIVE' ? 'Activos' : 'Inactivos'}
                  <button
                    type="button"
                    onClick={() => setSelectedStatusFilter('ALL')}
                    className="hover:text-rose-500 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 shrink-0 cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Limpiar filtros</span>
            </button>
          </div>
        )}

        {/* Volunteers List */}
        <PullToRefresh onRefresh={handleRefresh}>
          {loading && volunteers.length === 0 ? (
            <CellListSkeleton count={5} />
          ) : volunteers.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-gray-200/80 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-gray-400">
                <Inbox size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800">
                  {hasActiveFilters
                    ? `No se encontraron ${volunteersTerm.toLowerCase()} con los filtros aplicados`
                    : `Sin ${volunteersTerm.toLowerCase()} registrados`}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {hasActiveFilters
                    ? 'Prueba modificando o limpiando los criterios de búsqueda.'
                    : 'Registra usuarios existentes para asignarles responsabilidades.'}
                </p>
              </div>
              {hasActiveFilters ? (
                <Button
                  onClick={handleResetFilters}
                  size="sm"
                  variant="secondary"
                  className="mt-2 text-xs gap-1.5"
                >
                  <RotateCcw size={14} /> Limpiar filtros
                </Button>
              ) : (
                <Button
                  onClick={() => setRegisterModalOpen(true)}
                  size="sm"
                  className="mt-2 text-xs"
                >
                  <Plus size={14} /> Registrar {volunteerTerm}
                </Button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xs divide-y divide-gray-100 overflow-hidden">
              {volunteers.map((volunteer) => {
                const user = volunteer.user;
                const name =
                  user && (user.firstName || user.lastName)
                    ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
                    : volunteerTerm;
                const userAssignments =
                  assignmentsByVolunteerId[volunteer.id] ||
                  (volunteer.userId ? assignmentsByVolunteerId[volunteer.userId] : []) ||
                  [];

                return (
                  <div
                    key={volunteer.id}
                    onClick={() => handleOpenDetail(volunteer)}
                    className="p-3.5 sm:p-4 hover:bg-gray-50/80 cursor-pointer transition-colors active:bg-gray-100/70 flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-slate-100 border border-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden mt-0.5">
                        {user?.photoUrl ? (
                          <img
                            src={user.photoUrl}
                            alt={name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UserIcon size={18} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h2 className="text-sm font-bold text-gray-900 truncate">{name}</h2>
                        <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-0.5 flex-wrap">
                          {user?.nationalId && (
                            <span className="flex items-center gap-1">
                              <FileText size={11} className="text-gray-400" />
                              <span>{user.nationalId}</span>
                            </span>
                          )}
                          {user?.phone && (
                            <span className="flex items-center gap-1">
                              <Phone size={11} className="text-gray-400" />
                              <span>
                                {formatPhoneWithDialCode(
                                  user.phone,
                                  user.dialCodePhone || (user as any).dialCode,
                                )}
                              </span>
                            </span>
                          )}
                        </div>

                        {/* Cross-Ministry Badges */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {userAssignments.length === 0 ? (
                            <span className="text-[10px] text-gray-400 italic">
                              Sin asignaciones activas
                            </span>
                          ) : (
                            userAssignments.map((a) => {
                              const matchedMinistry =
                                a.ministry ||
                                ministries.find(
                                  (m) =>
                                    m.id ===
                                    (a.ministryId ||
                                      a.ministryArea?.ministryId ||
                                      a.serviceAreaGroup?.ministryArea?.ministryId),
                                );
                              const ministryName = matchedMinistry?.name || 'Ministerio';
                              const campusId =
                                a.serviceAreaGroup?.churchCampusId ||
                                a.churchCampusId ||
                                matchedMinistry?.churchCampusId;
                              const campusName =
                                a.serviceAreaGroup?.churchCampus?.name ||
                                campuses.find((c) => c.id === campusId)?.name;
                              const roleLabel = getVolunteerRoleLabel(a.role, {
                                ministryType: matchedMinistry?.type,
                                ministryOverrides: matchedMinistry?.terminologyOverrides,
                                churchOverrides,
                                short: true,
                              });

                              const targetAreaId = a.ministryAreaId || a.serviceAreaGroup?.ministryAreaId;
                              const fallbackArea = targetAreaId
                                ? Object.values(areasByMinistry)
                                    .flat()
                                    .find((ar) => ar.id === targetAreaId)?.name
                                : undefined;
                              const areaName =
                                a.ministryArea?.name ||
                                a.serviceAreaGroup?.ministryArea?.name ||
                                fallbackArea;

                              const ministryAreaDisplay = areaName
                                ? `${ministryName} (${areaName}):`
                                : `${ministryName}:`;

                              return (
                                <span
                                  key={a.id}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80"
                                >
                                  {campusName && (
                                    <>
                                      <MapPin size={9} className="text-indigo-600 shrink-0" />
                                      <span className="text-indigo-900 font-semibold">{campusName}</span>
                                      <span className="text-gray-300">•</span>
                                    </>
                                  )}
                                  <span className="text-primary font-extrabold">
                                    {ministryAreaDisplay}
                                  </span>{' '}
                                  {roleLabel}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="w-6 h-6 flex items-center justify-center text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Infinite Scroll Sentinel & Load More Spinner */}
          {!loading && volunteers.length > 0 && (
            <div ref={sentinelRef} className="py-4 flex flex-col items-center justify-center">
              {loadingMore && (
                <div className="flex items-center gap-2 py-2 px-4 bg-white rounded-full border border-gray-100 shadow-2xs text-xs font-semibold text-gray-500">
                  <Loader2 size={16} className="animate-spin text-primary" />
                  <span>Cargando más {volunteersTerm.toLowerCase()}...</span>
                </div>
              )}
              {!loadingMore && hasMore && (
                <button
                  type="button"
                  onClick={() => triggerLoadMore()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 bg-white hover:bg-gray-50 border border-gray-200/80 rounded-full shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  <ChevronDown size={14} />
                  <span>Cargar más {volunteersTerm.toLowerCase()}</span>
                </button>
              )}
              {!loadingMore && !hasMore && (
                <EndOfListFunnyBadge type="volunteers" />
              )}
            </div>
          )}

          {/* Safe spacer so end indicator sits comfortably above bottom */}
          <div className="h-20 sm:h-24 shrink-0 pointer-events-none" aria-hidden="true" />
        </PullToRefresh>
          </>
        )}
      </div>

      <RegisterVolunteerModal open={registerModalOpen} onOpenChange={setRegisterModalOpen} />

      <VolunteerDetailDrawer
        open={detailDrawerOpen}
        onOpenChange={setDetailDrawerOpen}
        volunteer={selectedVolunteer}
        onAssignmentsChange={() => {
          dispatch(GetVolunteerAssignments({ force: true }));
        }}
      />
    </div>
  );
};

export default VolunteerDirectoryView;
