import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Star,
  Landmark,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  FolderKanban,
  Layers,
  FileDown,
  CalendarDays,
  ArrowLeft,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { CellListSkeleton } from '@/components/ui/DetailSkeleton';
import {
  useGetChurchCampusesQuery,
  useGetMinistryWorkspaceOverviewQuery,
} from '@/libs/state/redux/api/churchApi';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { updateCurrentChurchCampus } from '@/libs/state/redux/slices/church/churchCampus.slice';
import { IMinistry, MinistryStateEnum, MinistryType } from '@/libs/models';
import { FaChild } from 'react-icons/fa6';
import { APP_ROUTES } from '@/config/routes';
import { useChurchTerm } from '@/libs/hooks/useTerm';
import MinistryTeamsSection from './views/MinistryTeamsSection';
import MinistryLeadershipSection from './views/MinistryLeadershipSection';
import MinistryStructureSection from './views/MinistryStructureSection';
import MinistryModal from './components/MinistryModal';
import ExportOrganizationPdfModal from './components/ExportOrganizationPdfModal';
import MinistrySchedulingSection from './views/MinistrySchedulingSection';
import clsx from 'clsx';

/**
 * Key identifiers for the ministry workspace operational subpages.
 */
type WorkspaceTabKey = 'schedule' | 'teams' | 'leadership' | 'structure';

/**
 * Configuration item for workspace tab navigation items.
 */
interface TabItem {
  /** Distinct tab identifier */
  key: WorkspaceTabKey;
  /** Full i18n translation key for tab label */
  labelKey:
    | 'ministry_workspace.tabs.schedule'
    | 'ministry_workspace.tabs.teams'
    | 'ministry_workspace.tabs.leadership'
    | 'ministry_workspace.tabs.structure';
  /** Short i18n translation key for mobile tab label */
  shortLabelKey:
    | 'ministry_workspace.tabs.schedule_short'
    | 'ministry_workspace.tabs.teams_short'
    | 'ministry_workspace.tabs.leadership'
    | 'ministry_workspace.tabs.structure';
  /** Icon component */
  icon: React.ElementType;
  /** Accent color class for icon */
  iconColor: string;
}

/**
 * Static configuration list of workspace tabs matching modern SaaS underline layout.
 */
const WORKSPACE_TABS: TabItem[] = [
  {
    key: 'teams',
    labelKey: 'ministry_workspace.tabs.teams',
    shortLabelKey: 'ministry_workspace.tabs.teams_short',
    icon: Users,
    iconColor: 'text-blue-600',
  },
  {
    key: 'schedule',
    labelKey: 'ministry_workspace.tabs.schedule',
    shortLabelKey: 'ministry_workspace.tabs.schedule_short',
    icon: CalendarDays,
    iconColor: 'text-rose-500',
  },
  {
    key: 'leadership',
    labelKey: 'ministry_workspace.tabs.leadership',
    shortLabelKey: 'ministry_workspace.tabs.leadership',
    icon: Star,
    iconColor: 'text-amber-500',
  },
  {
    key: 'structure',
    labelKey: 'ministry_workspace.tabs.structure',
    shortLabelKey: 'ministry_workspace.tabs.structure',
    icon: Landmark,
    iconColor: 'text-slate-600',
  },
];

/**
 * Dedicated Ministry Workspace View at /admin/ministries/:id and /admin/ministries/:id/:section.
 * Modern, clean header and underline tabs inspired by modern SaaS dashboards.
 *
 * @returns {JSX.Element} Rendered ministry workspace view.
 */
export const MinistryWorkspaceView: React.FC = () => {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id: urlMinistryId, section: urlSection } = useParams<{ id?: string; section?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  // Dynamic terminology
  const campusTerm = useChurchTerm('campus');
  const volunteersTerm = useChurchTerm('volunteers');

  // 1. Fetch available Campuses via RTK Query
  const { data: campuses = [], isLoading: loadingCampuses } = useGetChurchCampusesQuery();
  const currentReduxCampus = useAppSelector((state) => state.churchCampusSlice.current);

  // 2. Resolve Target Ministry ID from Route or Query
  const activeMinistryIdParam = useMemo(() => {
    return urlMinistryId || searchParams.get('ministryId') || undefined;
  }, [urlMinistryId, searchParams]);

  // 3. Resolve Active Campus ID with multi-level fallback
  const [selectedCampusId, setSelectedCampusId] = useState<string>(() => {
    const fromUrl = searchParams.get('campusId');
    if (fromUrl) return fromUrl;
    const fromStorage = sessionStorage.getItem('ministries_selected_campus_id');
    if (fromStorage) return fromStorage;
    return currentReduxCampus?.id || '';
  });

  // 4. Fetch Consolidated Ministry Workspace Data
  const {
    data: workspace,
    isLoading: loadingWorkspace,
    isFetching: fetchingWorkspace,
    refetch: refetchWorkspace,
  } = useGetMinistryWorkspaceOverviewQuery(
    selectedCampusId || activeMinistryIdParam
      ? { churchCampusId: selectedCampusId || undefined, ministryId: activeMinistryIdParam }
      : undefined,
    { skip: !selectedCampusId && !activeMinistryIdParam },
  );

  // Check if current workspace data in cache belongs to the currently selected campus
  const isWorkspaceStale = Boolean(
    workspace?.ministry?.churchCampusId &&
      selectedCampusId &&
      workspace.ministry.churchCampusId !== selectedCampusId,
  );

  const activeMinistry = isWorkspaceStale ? undefined : workspace?.ministry;
  const campusMinistries = isWorkspaceStale ? [] : workspace?.campusMinistries || [];
  const currentWorkspace = isWorkspaceStale ? undefined : workspace;
  const isBusy = loadingWorkspace || fetchingWorkspace || isWorkspaceStale;

  // Sync selectedCampusId whenever URL campusId changes
  useEffect(() => {
    const urlCampus = searchParams.get('campusId');
    if (urlCampus && urlCampus !== selectedCampusId && campuses.some((c) => c.id === urlCampus)) {
      setSelectedCampusId(urlCampus);
      sessionStorage.setItem('ministries_selected_campus_id', urlCampus);
    }
  }, [searchParams, selectedCampusId, campuses]);

  // Keep campus selection in sync once campuses or workspace load
  useEffect(() => {
    if (campuses.length === 0) return;

    if (selectedCampusId && campuses.some((c) => c.id === selectedCampusId)) {
      sessionStorage.setItem('ministries_selected_campus_id', selectedCampusId);
      return;
    }

    const urlCampus = searchParams.get('campusId');
    const ministryCampusId = workspace?.ministry?.churchCampusId;
    const candidateId =
      (urlCampus && campuses.some((c) => c.id === urlCampus) && urlCampus) ||
      (ministryCampusId &&
        campuses.some((c) => c.id === ministryCampusId) &&
        ministryCampusId) ||
      (currentReduxCampus?.id &&
        campuses.some((c) => c.id === currentReduxCampus.id) &&
        currentReduxCampus.id) ||
      campuses[0]?.id ||
      '';

    if (candidateId) {
      setSelectedCampusId(candidateId);
      sessionStorage.setItem('ministries_selected_campus_id', candidateId);
    }
  }, [campuses, currentReduxCampus?.id, searchParams, selectedCampusId, workspace?.ministry?.churchCampusId]);

  /**
   * Updates the selected campus and synchronizes with URL query and redux.
   *
   * @param {string} newCampusId - Newly selected campus identifier.
   */
  const handleCampusChange = (newCampusId: string) => {
    setSelectedCampusId(newCampusId);
    sessionStorage.setItem('ministries_selected_campus_id', newCampusId);
    dispatch(updateCurrentChurchCampus(newCampusId));
    navigate(`${APP_ROUTES.admin.ministries}?campusId=${newCampusId}`);
  };

  // 5. Active Tab Management (Route-first)
  const activeTab: WorkspaceTabKey = useMemo(() => {
    const raw = urlSection || searchParams.get('tab');
    if (raw === 'schedule') return 'schedule';
    if (raw === 'leadership') return 'leadership';
    if (raw === 'structure' || raw === 'config') return 'structure';
    return 'teams';
  }, [urlSection, searchParams]);

  /**
   * Switches the active workspace operational subpage.
   *
   * @param {WorkspaceTabKey} key - The target tab key.
   */
  const handleTabChange = (key: WorkspaceTabKey) => {
    const targetMinId = activeMinistry?.id || urlMinistryId;
    if (targetMinId) {
      navigate(`/admin/ministries/${targetMinId}/${key}`);
    } else {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('tab', key);
          return next;
        },
        { replace: true },
      );
    }
  };

  /**
   * Switches the currently active ministry in the workspace without page reload.
   *
   * @param {string} minId - Identifier of the ministry to switch to.
   */
  const handleSelectMinistry = (minId: string) => {
    navigate(`/admin/ministries/${minId}/${activeTab}`);
  };

  // Modals state
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [pdfModalOpen, setPdfModalOpen] = useState<boolean>(false);
  const [ministryToEdit, setMinistryToEdit] = useState<IMinistry | null>(null);

  /**
   * Opens the creation modal for a new ministry.
   */
  const handleOpenCreateModal = () => {
    setMinistryToEdit(null);
    setModalOpen(true);
  };

  /**
   * Opens the edit modal for the currently selected ministry.
   */
  const handleOpenEditModal = () => {
    if (!activeMinistry) return;
    setMinistryToEdit(activeMinistry);
    setModalOpen(true);
  };

  /**
   * Callback invoked after successful ministry creation or update.
   */
  const handleModalSuccess = () => {
    refetchWorkspace();
  };

  const selectedCampusName = useMemo(() => {
    const found = campuses.find((c) => c.id === selectedCampusId);
    if (found) return found.name;
    if (currentReduxCampus?.name) return currentReduxCampus.name;
    if (campuses.length > 0) return campuses[0].name;
    return '';
  }, [campuses, selectedCampusId, currentReduxCampus?.name]);

  return (
    <div className="min-h-full flex-1 w-full bg-slate-50/70 pb-28">
      {/* Mobile-only Header */}
      <PageHeader
        title={activeMinistry?.name || t('ministry_workspace.title')}
        onBack={() =>
          navigate(
            selectedCampusId
              ? `${APP_ROUTES.admin.ministries}?campusId=${selectedCampusId}`
              : APP_ROUTES.admin.ministries,
          )
        }
        className="lg:hidden"
        rightAction={
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenCreateModal}
              className="w-8 h-8 rounded-full p-0 flex items-center justify-center bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer"
              title={t('ministry_workspace.create_ministry_tooltip')}
            >
              <Plus size={16} />
            </Button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-20 sm:pb-32 flex flex-col gap-6">
        {/* Loading Skeleton */}
        {isBusy && !currentWorkspace && (
          <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
            <CellListSkeleton count={4} />
          </div>
        )}

        {/* Active Ministry Details & Modern Underline Tabs Header */}
        {!isBusy && activeMinistry && currentWorkspace && (
          <>
            {/* Clean Header & Navigation Card */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col gap-5">
              {/* Row 1: Back Navigation & Quick Actions / Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      navigate(
                        selectedCampusId
                          ? `${APP_ROUTES.admin.ministries}?campusId=${selectedCampusId}`
                          : APP_ROUTES.admin.ministries,
                      )
                    }
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 -ml-2 cursor-pointer"
                  >
                    <ArrowLeft size={15} />
                    <span>{t('ministry_workspace.back_to_ministries')}</span>
                  </Button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Ministry Switcher Chips (when multiple exist) */}
                  {campusMinistries.length > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden lg:inline mr-1">
                        {t('ministry_workspace.switch_ministry_label')}:
                      </span>
                      {campusMinistries.map((min) => {
                        const isSelected = activeMinistry?.id === min.id;
                        const isKids = min.type === MinistryType.KIDS;
                        return (
                          <button
                            key={min.id}
                            type="button"
                            onClick={() => handleSelectMinistry(min.id)}
                            className={clsx(
                              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer select-none',
                              isSelected
                                ? 'bg-slate-900 text-white shadow-2xs'
                                : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700',
                            )}
                          >
                            {isKids ? (
                              <FaChild
                                className={clsx('w-3 h-3', isSelected ? 'text-teal-300' : 'text-teal-600')}
                              />
                            ) : (
                              <Layers
                                size={13}
                                className={clsx(isSelected ? 'text-white/80' : 'text-primary')}
                              />
                            )}
                            <span>{min.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setPdfModalOpen(true)}
                    className="gap-1.5 cursor-pointer shrink-0 text-xs font-bold"
                    title={t('ministry_workspace.download_pdf_tooltip')}
                  >
                    <FileDown size={14} className="text-slate-500" />
                    <span className="hidden sm:inline">{t('ministry_workspace.download_pdf_btn')}</span>
                  </Button>
                </div>
              </div>

              {/* Row 2: Ministry Identity (Identical to User Reference Screenshot) */}
              <div className="flex items-start sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div
                    className={clsx(
                      'w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-2xs shrink-0',
                      activeMinistry.type === MinistryType.KIDS
                        ? 'bg-amber-50 text-amber-500 border border-amber-200/80'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200/80',
                    )}
                  >
                    {activeMinistry.type === MinistryType.KIDS ? (
                      <span className="text-2xl select-none">👶</span>
                    ) : (
                      <FolderKanban size={22} />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                        {activeMinistry.name}
                      </h1>

                      <span
                        className={clsx(
                          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold',
                          activeMinistry.state === MinistryStateEnum.ACTIVE
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200',
                        )}
                      >
                        {activeMinistry.state === MinistryStateEnum.ACTIVE ? (
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

                      <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                        <span>&bull;</span>
                        <span>{selectedCampusName}</span>
                      </span>

                      <button
                        type="button"
                        onClick={handleOpenEditModal}
                        className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors cursor-pointer"
                        title={t('ministry_workspace.edit_ministry_tooltip')}
                      >
                        <Edit2 size={13} />
                      </button>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      {activeMinistry.description || 'Ministerio para el cuidado y formación de la iglesia'}
                    </p>
                  </div>
                </div>

                {/* Discreet KPIs Summary (Desktop-only) */}
                {workspace?.summary && (
                  <div className="hidden xl:flex items-center gap-4 text-xs font-semibold text-slate-500">
                    <div>
                      <span className="font-extrabold text-slate-900 text-sm">{workspace.summary.totalTeams}</span>{' '}
                      {t('ministry_workspace.kpi_teams').toLowerCase()}
                    </div>
                    <span className="text-slate-300">&bull;</span>
                    <div>
                      <span className="font-extrabold text-slate-900 text-sm">{workspace.summary.teamsWithSupervisor}</span>
                      <span className="text-slate-400 text-[10px]">/{workspace.summary.teamsRequiringSupervisor || workspace.summary.totalTeams}</span>{' '}
                      {t('ministry_workspace.kpi_supervision').toLowerCase()}
                    </div>
                    <span className="text-slate-300">&bull;</span>
                    <div>
                      <span className="font-extrabold text-slate-900 text-sm">{workspace.summary.totalVolunteers}</span>{' '}
                      {t('ministry_workspace.kpi_workforce').toLowerCase()}
                    </div>
                  </div>
                )}
              </div>

              {/* Row 3: Modern Clean Underline Tabs (Matching Screenshot) */}
              <div className="flex items-center gap-6 sm:gap-8 border-b border-slate-200/90 pt-2 overflow-x-auto no-scrollbar">
                {WORKSPACE_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isSelected = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => handleTabChange(tab.key)}
                      className={clsx(
                        'flex items-center gap-2 pb-3 pt-1 text-xs sm:text-sm font-bold transition-all border-b-2 -mb-px cursor-pointer shrink-0 select-none',
                        isSelected
                          ? 'border-slate-900 text-slate-900 font-extrabold'
                          : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300',
                      )}
                    >
                      <Icon
                        size={16}
                        className={clsx(tab.iconColor, !isSelected && 'opacity-70')}
                      />
                      <span className="hidden sm:inline">{t(tab.labelKey)}</span>
                      <span className="sm:hidden">{t(tab.shortLabelKey)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Subpage Component */}
            <div className="mt-1">
              {activeTab === 'schedule' && (
                <MinistrySchedulingSection
                  ministryId={activeMinistry.id}
                  churchCampusId={selectedCampusId}
                  workspaceGroups={currentWorkspace?.groups}
                  onRefreshWorkspace={refetchWorkspace}
                />
              )}

              {activeTab === 'teams' && (
                <MinistryTeamsSection
                  ministryId={activeMinistry.id}
                  churchCampusId={selectedCampusId}
                  workspaceTeams={currentWorkspace?.teams}
                  workspaceGroups={currentWorkspace?.groups}
                  workspaceAreas={currentWorkspace?.areas}
                  onRefreshWorkspace={refetchWorkspace}
                  hideMetrics={true}
                />
              )}

              {activeTab === 'leadership' && (
                <MinistryLeadershipSection
                  ministryId={activeMinistry.id}
                  churchCampusId={selectedCampusId}
                  workspaceLeadership={currentWorkspace?.leadership}
                  workspaceAreas={currentWorkspace?.areas}
                  workspaceGroups={currentWorkspace?.groups}
                  onRefreshWorkspace={refetchWorkspace}
                />
              )}

              {activeTab === 'structure' && (
                <MinistryStructureSection
                  ministryId={activeMinistry.id}
                  churchCampusId={selectedCampusId}
                  workspaceAreas={currentWorkspace?.areas}
                  workspaceGroups={currentWorkspace?.groups}
                  workspaceTeams={currentWorkspace?.teams}
                  onRefreshWorkspace={refetchWorkspace}
                  onNavigateToTab={(targetTab) => handleTabChange(targetTab as WorkspaceTabKey)}
                />
              )}
            </div>
          </>
        )}

        {/* Empty Campus Ministries State */}
        {!isBusy && (!activeMinistry || campusMinistries.length === 0) && (
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
        onSuccess={handleModalSuccess}
      />

      {/* Export Official Organization PDF Modal */}
      <ExportOrganizationPdfModal
        open={pdfModalOpen}
        onOpenChange={setPdfModalOpen}
        ministry={activeMinistry}
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

export default MinistryWorkspaceView;
