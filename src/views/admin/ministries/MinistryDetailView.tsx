import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  Crown,
  Network,
  Settings,
  Edit2,
  CheckCircle2,
  XCircle,
  MapPin,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetChurchCampuses } from '@/libs/state/redux/thunks/church/church.thunk';
import {
  GetMinistries,
  GetMinistryAreas,
  GetMinistryGroupConfigs,
  GetServiceAreaGroups,
} from '@/libs/state/redux/thunks/church/ministry.thunk';
import { APP_ROUTES } from '@/config/routes';
import { MinistryStateEnum } from '@/libs/models';
import MinistryTeamsSection from './views/MinistryTeamsSection';
import MinistryLeadershipSection from './views/MinistryLeadershipSection';
import MinistryOrganigramSection from './views/MinistryOrganigramSection';
import MinistryStructureSection from './views/MinistryStructureSection';
import MinistryModal from './components/MinistryModal';
import clsx from 'clsx';

type MinistryMainTabKey = 'teams' | 'leadership' | 'organigram' | 'structure';

interface TabItem {
  key: MinistryMainTabKey;
  label: string;
  icon: React.ElementType;
}

const MAIN_TABS: TabItem[] = [
  { key: 'teams', label: 'Equipos', icon: ShieldCheck },
  { key: 'leadership', label: 'Liderazgo', icon: Crown },
  { key: 'organigram', label: 'Organigrama', icon: Network },
  { key: 'structure', label: 'Configuración', icon: Settings },
];

/**
 * Ministry Detail View at /admin/ministries/:id and /admin/ministries/:id/:section.
 * Dynamic unified hub connecting the 4 administrative pillars:
 * 1. Teams & Rosters (Organización de equipos por Área y Grupo)
 * 2. Leadership (Liderazgo estilo Telegram)
 * 3. Organigram & Analytics (Organigrama visual y exportación PDF)
 * 4. Structure Configuration (Áreas, Grupos y Equipos)
 *
 * @returns {JSX.Element} Rendered ministry detail view.
 */
const MinistryDetailView: React.FC = () => {
  const { id, section } = useParams<{ id: string; section?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const ministryId = id || '';
  const campuses = useAppSelector((state) => state.churchCampusSlice);
  const { ministries } = useAppSelector((state) => state.ministrySlice);

  const [editModalOpen, setEditModalOpen] = useState(false);

  const churchId = import.meta.env.VITE_CHURCH_ID;

  // Determine active tab from URL param (:section) or query (?tab=...)
  const activeTab: MinistryMainTabKey = useMemo(() => {
    const raw = section || searchParams.get('tab');
    if (raw === 'leadership') return 'leadership';
    if (raw === 'organigram' || raw === 'chart') return 'organigram';
    if (raw === 'structure' || raw === 'config') return 'structure';
    return 'teams';
  }, [section, searchParams]);

  const handleTabChange = (key: MinistryMainTabKey) => {
    if (key === 'teams') {
      navigate(APP_ROUTES.admin.ministryTeams(ministryId));
    } else if (key === 'leadership') {
      navigate(APP_ROUTES.admin.ministryLeadership(ministryId));
    } else if (key === 'organigram') {
      navigate(APP_ROUTES.admin.ministryOrganigram(ministryId));
    } else if (key === 'structure') {
      navigate(APP_ROUTES.admin.ministryStructure(ministryId));
    }
  };

  // Load campuses if not yet available
  useEffect(() => {
    if (campuses.data.length === 0) {
      dispatch(GetChurchCampuses());
    }
  }, [dispatch, campuses.data.length]);

  // Load ministries if not yet loaded in Redux
  useEffect(() => {
    if (ministries.length === 0) {
      dispatch(GetMinistries({ churchId }));
    }
  }, [dispatch, churchId, ministries.length]);

  // Preload structure catalogs for this ministry
  useEffect(() => {
    if (ministryId) {
      dispatch(GetMinistryAreas({ ministryId, force: false }));
      dispatch(GetMinistryGroupConfigs({ ministryId, force: false }));
      dispatch(GetServiceAreaGroups({ ministryId }));
    }
  }, [dispatch, ministryId]);

  const currentMinistry = useMemo(() => {
    return ministries.find((m) => m.id === ministryId);
  }, [ministries, ministryId]);

  const campusName = useMemo(() => {
    if (!currentMinistry) return '';
    if (currentMinistry.churchCampus?.name) return currentMinistry.churchCampus.name;
    return campuses.data.find((c) => c.id === currentMinistry.churchCampusId)?.name || '';
  }, [currentMinistry, campuses.data]);

  return (
    <div className="min-h-full flex-1 w-full bg-slate-50 pb-24">
      <PageHeader
        title={currentMinistry ? currentMinistry.name : 'Detalle del Ministerio'}
        onBack={() => navigate(APP_ROUTES.admin.ministries)}
        rightAction={
          currentMinistry ? (
            <button
              type="button"
              onClick={() => setEditModalOpen(true)}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 active:scale-95 text-white transition-all cursor-pointer"
              title="Editar Ministerio"
            >
              <Edit2 size={16} />
            </button>
          ) : undefined
        }
      />

      <div className="max-w-2xl mx-auto p-4 sm:p-6 flex flex-col gap-4">
        {/* Ministry Information Card */}
        {currentMinistry && (
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-200/80 shadow-xs flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black text-gray-900 truncate">
                  {currentMinistry.name}
                </h1>
                {campusName && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                    <MapPin size={11} className="text-indigo-600" />
                    <span>{campusName}</span>
                  </span>
                )}
                <span
                  className={clsx(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0',
                    currentMinistry.state === MinistryStateEnum.ACTIVE
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                      : 'bg-gray-100 text-gray-600 border border-gray-200',
                  )}
                >
                  {currentMinistry.state === MinistryStateEnum.ACTIVE ? (
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
              {currentMinistry.description && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {currentMinistry.description}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Top Segmented Navigation (The 4 Core Pillars in exact requested order) */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/80 rounded-2xl border border-gray-200/70 shadow-2xs">
          {MAIN_TABS.map((tab) => {
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
                        : tab.key === 'organigram'
                        ? 'text-blue-600'
                        : 'text-indigo-600'
                      : 'text-gray-400',
                  )}
                />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <div className="mt-0.5">
          {activeTab === 'teams' && (
            <MinistryTeamsSection
              ministryId={ministryId}
              churchCampusId={currentMinistry?.churchCampusId}
            />
          )}
          {activeTab === 'leadership' && (
            <MinistryLeadershipSection
              ministryId={ministryId}
              churchCampusId={currentMinistry?.churchCampusId}
            />
          )}
          {activeTab === 'organigram' && (
            <MinistryOrganigramSection
              ministryId={ministryId}
              churchCampusId={currentMinistry?.churchCampusId}
              ministry={currentMinistry}
            />
          )}
          {activeTab === 'structure' && (
            <MinistryStructureSection
              ministryId={ministryId}
              churchCampusId={currentMinistry?.churchCampusId}
            />
          )}
        </div>
      </div>

      {currentMinistry && (
        <MinistryModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          ministryToEdit={currentMinistry}
          churchCampusId={currentMinistry.churchCampusId}
        />
      )}
    </div>
  );
};

export default MinistryDetailView;
