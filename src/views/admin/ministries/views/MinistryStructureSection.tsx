import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layers, Users2, Network } from 'lucide-react';
import { MinistryAreasTab } from '../tabs/MinistryAreasTab';
import { MinistryGroupsTab } from '../tabs/MinistryGroupsTab';
import { ServiceAreaGroupsTab } from '../tabs/ServiceAreaGroupsTab';
import { useAppDispatch } from '@/libs/state/redux/hooks';
import {
  GetMinistryAreas,
  GetMinistryGroupConfigs,
} from '@/libs/state/redux/thunks/church/ministry.thunk';
import { IMinistryArea, IMinistryGroupConfig } from '@/libs/models';
import clsx from 'clsx';

type StructureTabKey = 'groups' | 'areas' | 'teams';

interface TabItem {
  key: StructureTabKey;
  label: string;
  icon: React.ElementType;
}

const STRUCTURE_TABS: TabItem[] = [
  { key: 'groups', label: 'Grupos', icon: Users2 },
  { key: 'areas', label: 'Áreas de Servicio', icon: Layers },
  { key: 'teams', label: 'Equipos (Sede)', icon: Network },
];

interface MinistryStructureSectionProps {
  ministryId: string;
  churchCampusId?: string;
  workspaceAreas?: IMinistryArea[];
  workspaceGroups?: IMinistryGroupConfig[];
  onRefreshWorkspace?: () => void;
}

/**
 * Dedicated Structure Configuration View.
 * Exclusively manages Ministry Groups, Service Areas, and Team Combinations per Campus.
 *
 * @param {MinistryStructureSectionProps} props - Component properties.
 * @returns {JSX.Element} Rendered structure management view.
 */
export const MinistryStructureSection: React.FC<MinistryStructureSectionProps> = ({
  ministryId,
  churchCampusId,
  workspaceAreas,
  workspaceGroups,
  onRefreshWorkspace,
}) => {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const subTabFromUrl = searchParams.get('subTab') as StructureTabKey | null;
  const initialTab =
    subTabFromUrl && ['groups', 'areas', 'teams'].includes(subTabFromUrl)
      ? subTabFromUrl
      : 'groups';

  const [activeTab, setActiveTab] = useState<StructureTabKey>(initialTab);

  // Proactively fetch areas and groups when entering structure section
  useEffect(() => {
    if (ministryId) {
      dispatch(GetMinistryAreas({ ministryId, force: false }));
      dispatch(GetMinistryGroupConfigs({ ministryId, force: false }));
    }
  }, [dispatch, ministryId]);

  const handleTabChange = (key: StructureTabKey) => {
    setActiveTab(key);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (key === 'groups') {
          next.delete('subTab');
        } else {
          next.set('subTab', key);
        }
        return next;
      },
      { replace: true },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Sub-navigation Segmented Control */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/80 rounded-2xl border border-gray-200/70">
        {STRUCTURE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={clsx(
                'flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer select-none',
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

      {/* Tab Panels */}
      <div className="mt-1">
        {activeTab === 'groups' && (
          <MinistryGroupsTab ministryId={ministryId} workspaceGroups={workspaceGroups} />
        )}
        {activeTab === 'areas' && (
          <MinistryAreasTab
            ministryId={ministryId}
            workspaceAreas={workspaceAreas}
            onRefreshWorkspace={onRefreshWorkspace}
          />
        )}
        {activeTab === 'teams' && (
          <ServiceAreaGroupsTab
            ministryId={ministryId}
            churchCampusId={churchCampusId}
            workspaceAreas={workspaceAreas}
            workspaceGroups={workspaceGroups}
            onNavigateToTab={(target) => {
              if (target === 'areas' || target === 'groups') {
                handleTabChange(target);
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default MinistryStructureSection;
