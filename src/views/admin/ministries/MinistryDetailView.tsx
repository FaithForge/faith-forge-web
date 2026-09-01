import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Layers,
  Users2,
  Network,
  ShieldCheck,
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
import MinistryAreasTab from './tabs/MinistryAreasTab';
import MinistryGroupsTab from './tabs/MinistryGroupsTab';
import ServiceAreaGroupsTab from './tabs/ServiceAreaGroupsTab';
import VolunteerAssignmentsTab from './tabs/VolunteerAssignmentsTab';
import MinistryModal from './components/MinistryModal';
import clsx from 'clsx';

type TabKey = 'areas' | 'groups' | 'teams' | 'roles';

interface TabItem {
  key: TabKey;
  label: string;
  icon: React.ElementType;
}

const TABS: TabItem[] = [
  { key: 'areas', label: 'Áreas', icon: Layers },
  { key: 'groups', label: 'Grupos', icon: Users2 },
  { key: 'teams', label: 'Equipos', icon: Network },
  { key: 'roles', label: 'Servidores y Roles', icon: ShieldCheck },
];

/**
 * Ministry Detail View at /admin/ministries/:id.
 * Central hub for configuring a ministry's service areas, groups, campus teams,
 * and volunteer role assignments.
 *
 * @returns {JSX.Element} Rendered ministry detail view.
 */
const MinistryDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const ministryId = id || '';
  const campuses = useAppSelector((state) => state.churchCampusSlice);
  const { ministries, loadingMinistries } = useAppSelector((state) => state.ministrySlice);

  const [activeTab, setActiveTab] = useState<TabKey>('areas');
  const [editModalOpen, setEditModalOpen] = useState(false);

  const churchId = import.meta.env.VITE_CHURCH_ID;

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

  // Load child catalogs for this ministry
  useEffect(() => {
    if (ministryId) {
      dispatch(GetMinistryAreas({ ministryId, force: false }));
      dispatch(GetMinistryGroupConfigs({ ministryId, force: false }));
      // Service area groups will be loaded by the child tab when areas are available
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
    <div className="min-h-full bg-slate-50/60 pb-24">
      <PageHeader
        title={currentMinistry ? currentMinistry.name : 'Detalle del Ministerio'}
        onBack={() => navigate(APP_ROUTES.admin.ministries)}
        rightAction={
          currentMinistry ? (
            <button
              type="button"
              onClick={() => setEditModalOpen(true)}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 active:scale-95 text-white transition-all"
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
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-xs flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 truncate">
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
                    currentMinistry.active
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                      : 'bg-gray-100 text-gray-600 border border-gray-200',
                  )}
                >
                  {currentMinistry.active ? (
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

        {/* Tab Navigation (Segmented Bar) */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/80 rounded-2xl border border-gray-200/70">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={clsx(
                  'flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all duration-150',
                  isSelected
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 bg-transparent',
                )}
              >
                <Icon size={14} className={isSelected ? 'text-primary' : 'text-gray-500'} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="mt-1">
          {activeTab === 'areas' && <MinistryAreasTab ministryId={ministryId} />}
          {activeTab === 'groups' && <MinistryGroupsTab ministryId={ministryId} />}
          {activeTab === 'teams' && (
            <ServiceAreaGroupsTab
              ministryId={ministryId}
              churchCampusId={currentMinistry?.churchCampusId}
              onNavigateToTab={(tab) => setActiveTab(tab as TabKey)}
            />
          )}
          {activeTab === 'roles' && (
            <VolunteerAssignmentsTab
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
