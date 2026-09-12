import React, { useState } from 'react';
import { Layers, Users2, Network } from 'lucide-react';
import { MinistryAreasTab } from '../tabs/MinistryAreasTab';
import { MinistryGroupsTab } from '../tabs/MinistryGroupsTab';
import { ServiceAreaGroupsTab } from '../tabs/ServiceAreaGroupsTab';
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
}) => {
  const [activeTab, setActiveTab] = useState<StructureTabKey>('groups');

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
              onClick={() => setActiveTab(tab.key)}
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
        {activeTab === 'groups' && <MinistryGroupsTab ministryId={ministryId} />}
        {activeTab === 'areas' && <MinistryAreasTab ministryId={ministryId} />}
        {activeTab === 'teams' && (
          <ServiceAreaGroupsTab
            ministryId={ministryId}
            churchCampusId={churchCampusId}
            onNavigateToTab={(target) => {
              if (target === 'areas' || target === 'groups') {
                setActiveTab(target);
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default MinistryStructureSection;
