import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FolderKanban,
  MapPin,
  Plus,
  Edit2,
  CalendarClock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileDown,
  Sparkles,
} from 'lucide-react';
import { FaChild } from 'react-icons/fa6';
import clsx from 'clsx';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { CellListSkeleton } from '@/components/ui/DetailSkeleton';
import {
  useGetChurchCampusesQuery,
  useGetMinistryWorkspaceOverviewQuery,
} from '@/libs/state/redux/api/churchApi';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { updateCurrentChurchCampus } from '@/libs/state/redux/slices/church/churchCampus.slice';
import { IMinistry, MinistryStateEnum, MinistryType } from '@/libs/models';
import { APP_ROUTES } from '@/config/routes';
import { useChurchTerm } from '@/libs/hooks/useTerm';
import MinistryModal from './components/MinistryModal';
import ExportOrganizationPdfModal from './components/ExportOrganizationPdfModal';

/**
 * Top-level Ministry Directory Hub view for administrators at /admin/ministries.
 * Displays all ministries registered in the selected campus as clean, accessible cards
 * with quick shortcuts to scheduling, team roster, leadership, and structure management.
 *
 * @returns {JSX.Element} Rendered ministry directory hub.
 */
export const MinistriesDirectoryView: React.FC = () => {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  // Dynamic terminology
  const campusTerm = useChurchTerm('campus');
  const volunteersTerm = useChurchTerm('volunteers');

  // 1. Fetch Campuses
  const { data: campuses = [], isLoading: loadingCampuses } = useGetChurchCampusesQuery();
  const currentReduxCampus = useAppSelector((state) => state.churchCampusSlice.current);

  // 2. Resolve Active Campus ID with multi-level fallback
  const [selectedCampusId, setSelectedCampusId] = useState<string>(() => {
    const fromUrl = searchParams.get('campusId');
    if (fromUrl) return fromUrl;
    const fromStorage = sessionStorage.getItem('ministries_selected_campus_id');
    if (fromStorage) return fromStorage;
    return currentReduxCampus?.id || '';
  });

  // 3. Fetch Campus Workspace Overview Data
  const {
    data: workspace,
    isLoading: loadingWorkspace,
    isFetching: fetchingWorkspace,
    refetch: refetchWorkspace,
  } = useGetMinistryWorkspaceOverviewQuery(
    selectedCampusId ? { churchCampusId: selectedCampusId } : undefined,
    { skip: !selectedCampusId },
  );

  // Synchronize campus selection when URL or Redux updates
  useEffect(() => {
    const urlCampus = searchParams.get('campusId');
    if (urlCampus && urlCampus !== selectedCampusId && campuses.some((c) => c.id === urlCampus)) {
      setSelectedCampusId(urlCampus);
      sessionStorage.setItem('ministries_selected_campus_id', urlCampus);
    }
  }, [searchParams, selectedCampusId, campuses]);

  useEffect(() => {
    if (campuses.length === 0) return;

    if (selectedCampusId && campuses.some((c) => c.id === selectedCampusId)) {
      sessionStorage.setItem('ministries_selected_campus_id', selectedCampusId);
      return;
    }

    const urlCampus = searchParams.get('campusId');
    const candidateId =
      (urlCampus && campuses.some((c) => c.id === urlCampus) && urlCampus) ||
      (currentReduxCampus?.id &&
        campuses.some((c) => c.id === currentReduxCampus.id) &&
        currentReduxCampus.id) ||
      campuses[0]?.id ||
      '';

    if (candidateId) {
      setSelectedCampusId(candidateId);
      sessionStorage.setItem('ministries_selected_campus_id', candidateId);
    }
  }, [campuses, currentReduxCampus?.id, searchParams, selectedCampusId]);

  /**
   * Handles campus selection update and query param synchronization.
   *
   * @param {string} newCampusId - Target campus ID.
   */
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

  // Modals state
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [ministryToEdit, setMinistryToEdit] = useState<IMinistry | null>(null);
  const [pdfModalOpen, setPdfModalOpen] = useState<boolean>(false);
  const [pdfMinistry, setPdfMinistry] = useState<IMinistry | null>(null);

  /**
   * Opens modal to create a brand-new ministry.
   */
  const handleOpenCreateModal = () => {
    setMinistryToEdit(null);
    setModalOpen(true);
  };

  /**
   * Opens modal to edit the metadata of a specific ministry.
   *
   * @param {IMinistry} min - Ministry to edit.
   */
  const handleOpenEditModal = (min: IMinistry) => {
    setMinistryToEdit(min);
    setModalOpen(true);
  };

  /**
   * Opens official PDF export modal for a ministry.
   *
   * @param {IMinistry} min - Target ministry.
   */
  const handleOpenPdfModal = (min: IMinistry) => {
    setPdfMinistry(min);
    setPdfModalOpen(true);
  };

  const campusOptions = useMemo(
    () => campuses.map((c) => ({ id: c.id, name: c.name })),
    [campuses],
  );

  const selectedCampusName = useMemo(() => {
    const found = campuses.find((c) => c.id === selectedCampusId);
    if (found) return found.name;
    if (currentReduxCampus?.name) return currentReduxCampus.name;
    if (campuses.length > 0) return campuses[0].name;
    return '';
  }, [campuses, selectedCampusId, currentReduxCampus?.name]);

  const campusMinistries = workspace?.campusMinistries || [];
  const isBusy = loadingCampuses || loadingWorkspace || fetchingWorkspace;

  return (
    <div className="min-h-full flex-1 w-full bg-slate-50/70 pb-28">
      {/* Mobile-only Top Header */}
      <PageHeader
        title={t('ministry_workspace.title')}
        onBack={() => navigate(APP_ROUTES.admin.root)}
        className="lg:hidden"
        rightAction={
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenCreateModal}
            className="w-8 h-8 rounded-full p-0 flex items-center justify-center bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer"
            title={t('ministry_workspace.create_ministry_tooltip')}
          >
            <Plus size={16} />
          </Button>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 flex flex-col gap-6">
        {/* Desktop-First Header Control Banner */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 lg:p-7 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4 min-w-0">
            <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-primary text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
              <FolderKanban size={26} className="lg:w-7 lg:h-7" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">
                <Sparkles size={13} />
                <span>
                  {t('ministry_workspace.ministries_count_plural', {
                    count: campusMinistries.length,
                    campus: campusTerm.toLowerCase(),
                  })}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight truncate">
                {t('ministry_workspace.title')}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 line-clamp-1">
                {t('ministry_workspace.directory_subtitle', {
                  campus: campusTerm.toLowerCase(),
                })}
              </p>
            </div>
          </div>

          {/* Integrated Campus Selector & Primary Action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            <div className="w-full sm:w-64">
              <div className="relative">
                <Select
                  value={selectedCampusId}
                  onChange={(e) => handleCampusChange(e.target.value)}
                  disabled={loadingCampuses}
                  className="w-full text-xs font-bold"
                >
                  <option value="" disabled>
                    {t('ministry_workspace.select_campus_placeholder', {
                      campus: campusTerm.toLowerCase(),
                    })}
                  </option>
                  {campusOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleOpenCreateModal}
              className="flex items-center justify-center gap-2 text-xs sm:text-sm font-bold shadow-xs cursor-pointer whitespace-nowrap"
            >
              <Plus size={16} />
              <span>{t('ministry_workspace.new_ministry_btn')}</span>
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isBusy && campusMinistries.length === 0 && (
          <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
            <CellListSkeleton count={3} />
          </div>
        )}

        {/* Ministries Grid */}
        {!isBusy && campusMinistries.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {campusMinistries.map((min) => {
              const isKids = min.type === MinistryType.KIDS;
              const isActive = min.state === MinistryStateEnum.ACTIVE;
              const isSelectedWorkspace = workspace?.ministry?.id === min.id;
              const minSummary = isSelectedWorkspace ? workspace?.summary : undefined;

              return (
                <div
                  key={min.id}
                  className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-5 group"
                >
                  {/* Card Header: Icon, Name, Status, Edit */}
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={clsx(
                            'w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-lg shadow-2xs transition-transform group-hover:scale-105',
                            isKids
                              ? 'bg-teal-50 text-teal-700 border border-teal-200/90'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200/90',
                          )}
                        >
                          {isKids ? <FaChild className="w-5 h-5" /> : <FolderKanban size={20} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-primary transition-colors">
                              {min.name}
                            </h3>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditModal(min);
                              }}
                              className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors cursor-pointer"
                              title={t('ministry_workspace.edit_ministry_tooltip')}
                            >
                              <Edit2 size={13} />
                            </button>
                          </div>
                          <span
                            className={clsx(
                              'inline-flex items-center gap-1 text-[11px] font-bold mt-0.5',
                              isActive ? 'text-emerald-700' : 'text-slate-400',
                            )}
                          >
                            {isActive ? (
                              <>
                                <CheckCircle2 size={11} className="text-emerald-500" />
                                {t('ministry_workspace.status_active')}
                              </>
                            ) : (
                              <>
                                <XCircle size={11} />
                                {t('ministry_workspace.status_inactive')}
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPdfModal(min);
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        title={t('ministry_workspace.download_pdf_tooltip')}
                      >
                        <FileDown size={16} />
                      </button>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-500 mt-3 line-clamp-2 min-h-[32px]">
                      {min.description || 'Sin descripción detallada configurada.'}
                    </p>

                    {/* Compact Metrics Chips */}
                    {minSummary && (
                      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100">
                        <div className="bg-slate-50 rounded-xl p-2 text-center border border-slate-100">
                          <span className="block text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">
                            {t('ministry_workspace.kpi_teams')}
                          </span>
                          <span className="text-base font-black text-slate-900 mt-0.5 block">
                            {minSummary.totalTeams}
                          </span>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-2 text-center border border-slate-100">
                          <span className="block text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">
                            {t('ministry_workspace.kpi_supervision')}
                          </span>
                          <span className="text-base font-black text-slate-900 mt-0.5 block">
                            {minSummary.teamsWithSupervisor}
                            <span className="text-[10px] font-bold text-slate-400 ml-0.5">
                              /{minSummary.teamsRequiringSupervisor || minSummary.totalTeams}
                            </span>
                          </span>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-2 text-center border border-slate-100">
                          <span className="block text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">
                            {t('ministry_workspace.kpi_workforce')}
                          </span>
                          <span className="text-base font-black text-slate-900 mt-0.5 block">
                            {minSummary.totalVolunteers}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(APP_ROUTES.admin.ministryTeams(min.id))}
                      className="flex-1 justify-center gap-1.5 text-xs font-bold shadow-2xs cursor-pointer"
                    >
                      <ShieldCheck size={14} />
                      <span>{t('ministry_workspace.manage_ministry_btn')}</span>
                      <ArrowRight size={13} className="ml-0.5 opacity-80" />
                    </Button>

                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => navigate(APP_ROUTES.admin.ministrySchedule(min.id))}
                      className="justify-center gap-1.5 text-xs font-bold cursor-pointer text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 border-indigo-200"
                      title={t('ministry_workspace.schedule_shortcut_btn')}
                    >
                      <CalendarClock size={14} className="text-indigo-600" />
                      <span className="hidden sm:inline">Turnos</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty Campus Ministries State */}
        {!isBusy && campusMinistries.length === 0 && (
          <div className="bg-white rounded-3xl p-10 border border-slate-200/80 shadow-xs text-center flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
              <FolderKanban size={28} />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">
              {t('ministry_workspace.empty_title', { campus: selectedCampusName })}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md">
              {t('ministry_workspace.empty_desc', { volunteers: volunteersTerm.toLowerCase() })}
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={handleOpenCreateModal}
              className="mt-2 flex items-center gap-2 text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
            >
              <Plus size={16} />
              <span>{t('ministry_workspace.create_ministry_btn')}</span>
            </Button>
          </div>
        )}
      </div>

      {/* Create / Edit Ministry Modal */}
      <MinistryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        ministryToEdit={ministryToEdit}
        churchCampusId={selectedCampusId}
        onSuccess={() => refetchWorkspace()}
      />

      {/* Export Official Organization PDF Modal */}
      <ExportOrganizationPdfModal
        open={pdfModalOpen}
        onOpenChange={setPdfModalOpen}
        ministry={pdfMinistry || undefined}
        churchCampusId={selectedCampusId}
        campusName={selectedCampusName}
        workspaceAreas={workspace?.areas}
        workspaceGroups={workspace?.groups}
        workspaceTeams={workspace?.teams}
        workspaceLeadership={workspace?.leadership}
      />
    </div>
  );
};

export default MinistriesDirectoryView;
