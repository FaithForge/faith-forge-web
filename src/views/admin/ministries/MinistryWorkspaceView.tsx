import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  Crown,
  Settings,
  Plus,
  Edit2,
  MapPin,
  CheckCircle2,
  XCircle,
  FolderKanban,
  Layers,
  FileDown,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import SelectSearch from '@/components/ui/SelectSearch';
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
import clsx from 'clsx';

/**
 * Key identifiers for the ministry workspace operational tabs.
 */
type WorkspaceTabKey = 'teams' | 'leadership' | 'structure';

/**
 * Configuration item for workspace tab navigation items.
 */
interface TabItem {
  /** Distinct tab identifier */
  key: WorkspaceTabKey;
  /** Full i18n translation key for tab label */
  labelKey:
    | 'ministry_workspace.tabs.teams'
    | 'ministry_workspace.tabs.leadership'
    | 'ministry_workspace.tabs.structure';
  /** Short i18n translation key for mobile tab label */
  shortLabelKey:
    | 'ministry_workspace.tabs.teams_short'
    | 'ministry_workspace.tabs.leadership'
    | 'ministry_workspace.tabs.structure';
  /** Icon component */
  icon: React.ElementType;
}

/**
 * Static configuration list of workspace tabs (3 streamlined tabs without organigram).
 */
const WORKSPACE_TABS: TabItem[] = [
  {
    key: 'teams',
    labelKey: 'ministry_workspace.tabs.teams',
    shortLabelKey: 'ministry_workspace.tabs.teams_short',
    icon: ShieldCheck,
  },
  {
    key: 'leadership',
    labelKey: 'ministry_workspace.tabs.leadership',
    shortLabelKey: 'ministry_workspace.tabs.leadership',
    icon: Crown,
  },
  {
    key: 'structure',
    labelKey: 'ministry_workspace.tabs.structure',
    shortLabelKey: 'ministry_workspace.tabs.structure',
    icon: Settings,
  },
];

/**
 * Consolidated Ministry Workspace View.
 * Unifies ministry administration, team planning, leadership oversight,
 * structure management, and executive PDF export into a single high-performance screen.
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

  // 4. Fetch Consolidated Ministry Workspace Data (Single HTTP Call)
  const {
    data: workspace,
    isLoading: loadingWorkspace,
    refetch: refetchWorkspace,
  } = useGetMinistryWorkspaceOverviewQuery(
    selectedCampusId || activeMinistryIdParam
      ? { churchCampusId: selectedCampusId || undefined, ministryId: activeMinistryIdParam }
      : undefined,
    { skip: !selectedCampusId && !activeMinistryIdParam },
  );

  const activeMinistry = workspace?.ministry;
  const campusMinistries = workspace?.campusMinistries || [];

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

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('campusId', newCampusId);
        next.delete('ministryId');
        return next;
      },
      { replace: true },
    );
  };

  // Update URL ministryId if backend auto-resolved default ministry
  useEffect(() => {
    if (activeMinistry?.id && !urlMinistryId && searchParams.get('ministryId') !== activeMinistry.id) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('ministryId', activeMinistry.id);
          if (selectedCampusId) next.set('campusId', selectedCampusId);
          return next;
        },
        { replace: true },
      );
    }
  }, [activeMinistry?.id, urlMinistryId, searchParams, setSearchParams, selectedCampusId]);

  // 5. Active Tab Management (3 streamlined tabs)
  const activeTab: WorkspaceTabKey = useMemo(() => {
    const raw = urlSection || searchParams.get('tab');
    if (raw === 'leadership') return 'leadership';
    if (raw === 'structure' || raw === 'config') return 'structure';
    return 'teams';
  }, [urlSection, searchParams]);

  /**
   * Switches the active workspace operational tab.
   *
   * @param {WorkspaceTabKey} key - The target tab key.
   */
  const handleTabChange = (key: WorkspaceTabKey) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (key === 'teams') {
          next.delete('tab');
        } else {
          next.set('tab', key);
        }
        return next;
      },
      { replace: true },
    );
  };

  /**
   * Switches the currently active ministry in the workspace without page reload.
   *
   * @param {string} minId - Identifier of the ministry to switch to.
   */
  const handleSelectMinistry = (minId: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('ministryId', minId);
        if (selectedCampusId) next.set('campusId', selectedCampusId);
        return next;
      },
      { replace: true },
    );
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

  // Campus Select Options
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

  return (
    <div className="min-h-full flex-1 w-full bg-slate-50 pb-24">
      {/* Top Header */}
      <PageHeader
        title={t('ministry_workspace.title')}
        onBack={() => navigate(APP_ROUTES.admin.root)}
        rightAction={
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenCreateModal}
              className="w-8 h-8 rounded-full p-0 flex items-center justify-center bg-white/20 hover:bg-white/30 active:scale-95 text-white transition-all cursor-pointer"
              title={t('ministry_workspace.create_ministry_tooltip')}
            >
              <Plus size={16} />
            </Button>
          </div>
        }
      />

      <div className="max-w-3xl mx-auto p-3.5 sm:p-5 flex flex-col gap-3.5">
        {/* Campus & Ministry Selector Strip */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200/80 shadow-2xs flex flex-col gap-3">
          {/* Top Row: Full Width Campus Dropdown */}
          <div className="flex items-center gap-2.5 w-full">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <MapPin size={15} />
            </div>
            <div className="flex-1 min-w-0">
              <SelectSearch
                label={campusTerm}
                value={selectedCampusId}
                onChange={handleCampusChange}
                options={campusOptions}
                placeholder={t('ministry_workspace.select_campus_placeholder', {
                  campus: campusTerm.toLowerCase(),
                })}
                className="w-full text-xs font-semibold"
              />
            </div>
          </div>

          {/* Ministry Switcher Section with Explicit Label */}
          <div className="flex flex-col gap-1.5 pt-2.5 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <FolderKanban size={13} className="text-primary" />
                {t('ministry_workspace.ministries_section_title', {
                  count: campusMinistries.length,
                  campus: campusTerm.toLowerCase(),
                })}
              </span>
              <span className="text-[10.5px] text-gray-400 font-medium hidden sm:inline">
                {t('ministry_workspace.ministries_section_subtitle')}
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {campusMinistries.map((min) => {
                const isSelected = activeMinistry?.id === min.id;
                const isKids = min.type === MinistryType.KIDS;
                return (
                  <button
                    key={min.id}
                    type="button"
                    onClick={() => handleSelectMinistry(min.id)}
                    className={clsx(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs select-none',
                      isSelected
                        ? 'bg-primary text-white shadow-xs scale-[1.02]'
                        : 'bg-slate-100 hover:bg-slate-200/70 text-gray-700',
                    )}
                  >
                    {isKids ? (
                      <FaChild className={clsx('w-3 h-3', isSelected ? 'text-teal-200' : 'text-teal-600')} />
                    ) : (
                      <Layers size={13} className={clsx(isSelected ? 'text-white/80' : 'text-primary')} />
                    )}
                    <span>{min.name}</span>
                    {min.state === MinistryStateEnum.ACTIVE ? (
                      <span className={clsx('w-1.5 h-1.5 rounded-full', isSelected ? 'bg-emerald-300' : 'bg-emerald-500')} />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    )}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-primary hover:bg-primary/10 border border-dashed border-primary/40 transition-all shrink-0 cursor-pointer"
              >
                <Plus size={13} />
                <span>{t('ministry_workspace.new_ministry_btn')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Loading Skeleton */}
        {loadingWorkspace && !workspace && (
          <div className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-2xs">
            <CellListSkeleton count={4} />
          </div>
        )}

        {/* Active Ministry Details & KPI Bar */}
        {!loadingWorkspace && activeMinistry && (
          <>
            {/* Ministry Summary & KPIs Card */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/80 flex items-center justify-center font-bold text-sm shadow-2xs">
                    {activeMinistry.type === MinistryType.KIDS ? <FaChild className="w-4 h-4" /> : <FolderKanban size={16} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-sm sm:text-base font-extrabold text-gray-900 leading-tight">
                        {activeMinistry.name}
                      </h2>
                      <button
                        type="button"
                        onClick={handleOpenEditModal}
                        className="text-gray-400 hover:text-gray-700 p-1 rounded-md transition-colors cursor-pointer"
                        title={t('ministry_workspace.edit_ministry_tooltip')}
                      >
                        <Edit2 size={13} />
                      </button>
                    </div>
                    {activeMinistry.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{activeMinistry.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setPdfModalOpen(true)}
                    className="gap-1.5 cursor-pointer shrink-0 text-xs"
                    title={t('ministry_workspace.download_pdf_tooltip')}
                  >
                    <FileDown size={14} className="text-gray-500" />
                    <span>{t('ministry_workspace.download_pdf_btn')}</span>
                  </Button>

                  <span
                    className={clsx(
                      'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-2xs',
                      activeMinistry.state === MinistryStateEnum.ACTIVE
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200',
                    )}
                  >
                    {activeMinistry.state === MinistryStateEnum.ACTIVE ? (
                      <>
                        <CheckCircle2 size={11} /> {t('ministry_workspace.status_active')}
                      </>
                    ) : (
                      <>
                        <XCircle size={11} /> {t('ministry_workspace.status_inactive')}
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Executive KPI Strip */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                <div className="bg-slate-50/80 rounded-xl p-2.5 text-center border border-gray-100">
                  <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    {t('ministry_workspace.kpi_teams')}
                  </span>
                  <span className="text-lg font-black text-gray-900 mt-0.5 block">
                    {workspace?.summary.totalTeams ?? 0}
                  </span>
                </div>

                <div className="bg-slate-50/80 rounded-xl p-2.5 text-center border border-gray-100">
                  <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    {t('ministry_workspace.kpi_supervision')}
                  </span>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <span className="text-lg font-black text-gray-900">
                      {workspace?.summary.teamsWithSupervisor ?? 0}
                    </span>
                    <span className="text-xs font-bold text-gray-400">
                      / {workspace?.summary.totalTeams ?? 0}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50/80 rounded-xl p-2.5 text-center border border-gray-100">
                  <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    {t('ministry_workspace.kpi_workforce')}
                  </span>
                  <span className="text-lg font-black text-gray-900 mt-0.5 block">
                    {workspace?.summary.totalVolunteers ?? 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Clean 3-Tabs Control (Equipos, Liderazgo, Estructura) */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/80 rounded-2xl border border-gray-200/70 shadow-2xs">
              {WORKSPACE_TABS.map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => handleTabChange(tab.key)}
                    className={clsx(
                      'flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer select-none',
                      isSelected
                        ? 'bg-white text-gray-900 shadow-xs scale-[1.01]'
                        : 'text-gray-600 hover:text-gray-900 bg-transparent',
                    )}
                  >
                    <Icon
                      size={14}
                      className={clsx(
                        isSelected
                          ? tab.key === 'teams'
                            ? 'text-teal-600'
                            : tab.key === 'leadership'
                            ? 'text-amber-500'
                            : 'text-primary'
                          : 'text-gray-400',
                      )}
                    />
                    <span className="truncate hidden sm:inline">{t(tab.labelKey)}</span>
                    <span className="truncate sm:hidden">{t(tab.shortLabelKey)}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Views (Teams without duplicate metrics) */}
            <div className="mt-1">
              {activeTab === 'teams' && (
                <MinistryTeamsSection
                  ministryId={activeMinistry.id}
                  churchCampusId={selectedCampusId}
                  workspaceTeams={workspace?.teams}
                  workspaceGroups={workspace?.groups}
                  workspaceAreas={workspace?.areas}
                  onRefreshWorkspace={refetchWorkspace}
                  hideMetrics={true}
                />
              )}

              {activeTab === 'leadership' && (
                <MinistryLeadershipSection
                  ministryId={activeMinistry.id}
                  churchCampusId={selectedCampusId}
                  workspaceLeadership={workspace?.leadership}
                  workspaceAreas={workspace?.areas}
                  workspaceGroups={workspace?.groups}
                  onRefreshWorkspace={refetchWorkspace}
                />
              )}

              {activeTab === 'structure' && (
                <MinistryStructureSection
                  ministryId={activeMinistry.id}
                  churchCampusId={selectedCampusId}
                />
              )}
            </div>
          </>
        )}

        {/* Empty Campus Ministries State */}
        {!loadingWorkspace && (!activeMinistry || campusMinistries.length === 0) && (
          <div className="bg-white rounded-2xl p-8 border border-gray-200/80 shadow-2xs text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
              <FolderKanban size={24} />
            </div>
            <h3 className="text-sm font-extrabold text-gray-900">
              {t('ministry_workspace.empty_title', { campus: selectedCampusName })}
            </h3>
            <p className="text-xs text-gray-500 max-w-sm">
              {t('ministry_workspace.empty_desc', { volunteers: volunteersTerm.toLowerCase() })}
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreateModal}
              className="mt-1 flex items-center gap-1.5"
            >
              <Plus size={14} />
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
