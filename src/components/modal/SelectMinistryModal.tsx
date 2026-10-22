import React from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Check, Sparkles } from 'lucide-react';
import { FaChild } from 'react-icons/fa6';
import clsx from 'clsx';
import AppDrawer from '@/components/ui/AppDrawer';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { setActiveMinistry } from '@/libs/state/redux/slices/church/volunteerContext.slice';
import { useGetMinistriesQuery } from '@/libs/state/redux/api/churchApi';
import { usePermissions } from '@/libs/hooks/usePermissions';
import { useKidsTerm } from '@/libs/hooks/useTerm';
import { IMinistry } from '@/libs/models/Ministry';

interface SelectMinistryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface AvailableMinistryItem {
  id: string;
  name: string;
  type?: string;
}

/**
 * Modal for switching the active ministry context in Ministry Coordinator dashboard.
 *
 * @param {SelectMinistryModalProps} props - Component properties.
 * @returns {JSX.Element} Drawer modal listing available ministries for the active campus.
 */
export const SelectMinistryModal: React.FC<SelectMinistryModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { t } = useTranslation(['hub', 'common', 'admin']);
  const dispatch = useAppDispatch();
  const { isAdmin } = usePermissions();

  const ministryTerm = t('common:ministry', { defaultValue: 'Ministerio' });
  const kidsModuleName = useKidsTerm('module_alias');

  const {
    activeCampusId,
    campuses,
    activeMinistryId,
  } = useAppSelector((state) => state.volunteerContextSlice);

  const currentCampus = useAppSelector((state) => state.churchCampusSlice.current);
  const effectiveCampusId = activeCampusId || currentCampus?.id;

  // Query all campus ministries (used by admins or to enrich ministry metadata like type)
  const { data: campusMinistries = [] } = useGetMinistriesQuery(
    effectiveCampusId ? { churchCampusId: effectiveCampusId } : undefined,
    { skip: !effectiveCampusId }
  );

  // Compute available ministries for the active campus
  const currentCampusContext = campuses.find((c) => c.id === effectiveCampusId);

  const availableMinistries = React.useMemo<AvailableMinistryItem[]>(() => {
    if (isAdmin) {
      return (campusMinistries || []).map((m: IMinistry) => ({
        id: m.id,
        name: m.name,
        type: m.type,
      }));
    }

    const map = new Map<string, AvailableMinistryItem>();

    // 1. Coordinated ministries in campus context
    if (currentCampusContext?.ministryCoordinators && currentCampusContext.ministryCoordinators.length > 0) {
      for (const coord of currentCampusContext.ministryCoordinators) {
        const enriched = campusMinistries.find((m: IMinistry) => m.id === coord.ministryId);
        map.set(coord.ministryId, {
          id: coord.ministryId,
          name: coord.ministryName,
          type: coord.ministryType || enriched?.type || 'GENERAL',
        });
      }
    }

    // Fallback: If map is empty and user has campus ministries loaded, provide them
    if (map.size === 0 && campusMinistries.length > 0) {
      for (const m of campusMinistries) {
        map.set(m.id, {
          id: m.id,
          name: m.name,
          type: m.type,
        });
      }
    }

    return Array.from(map.values());
  }, [isAdmin, campusMinistries, currentCampusContext]);

  const handleSelect = (ministry: AvailableMinistryItem) => {
    dispatch(
      setActiveMinistry({
        ministryId: ministry.id,
        ministryName: ministry.name,
        ministryType: ministry.type,
      })
    );
    onOpenChange(false);
  };

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#0284c7]" />
          <span>{t('hub:select_ministry_title', { defaultValue: `Seleccionar ${ministryTerm}` })}</span>
        </div>
      }
      contentClassName="max-w-md mx-auto"
    >
      <div className="p-4 space-y-4">
        <p className="text-xs text-slate-500 leading-relaxed">
          {t(
            'hub:select_ministry_subtitle',
            { defaultValue: `Elige el ${ministryTerm.toLowerCase()} que deseas coordinar en esta sede:` }
          )}
        </p>

        <div className="space-y-2.5">
          {availableMinistries.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              {t('common:empty.no_data', { defaultValue: 'No se encontraron ministerios disponibles en esta sede.' })}
            </div>
          ) : (
            availableMinistries.map((ministry) => {
              const isSelected = ministry.id === activeMinistryId;
              const isKids = ministry.type === 'KIDS';

              return (
                <button
                  key={ministry.id}
                  type="button"
                  onClick={() => handleSelect(ministry)}
                  className={clsx(
                    'w-full flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all text-left outline-hidden',
                    isSelected
                      ? 'border-[#0284c7] bg-sky-50/60 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={clsx(
                        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs',
                        isKids
                          ? 'bg-gradient-to-br from-indigo-500 to-sky-500 text-white'
                          : 'bg-gradient-to-br from-[#73c2fb] to-[#0284c7] text-white'
                      )}
                    >
                      {isKids ? <FaChild className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 truncate">
                          {ministry.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={clsx(
                            'text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1',
                            isKids
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/50'
                              : 'bg-sky-50 text-[#0284c7] border border-sky-200/50'
                          )}
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          {isKids ? kidsModuleName : t('common:general', { defaultValue: 'General' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-[#0284c7] text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </AppDrawer>
  );
};

export default SelectMinistryModal;
