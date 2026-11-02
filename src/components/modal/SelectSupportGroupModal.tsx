import { AppDrawer } from '@/components/ui/AppDrawer';
import { useKidsTerm } from '@/libs/hooks/useTerm';
import { EntityState, IMinistryGroupConfig, MinistryType } from '@/libs/models';
import { useGetMinistryWorkspaceOverviewQuery } from '@/libs/state/redux/api/churchApi';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { setSupportedGroupConfig } from '@/libs/state/redux/slices/church/volunteerContext.slice';
import clsx from 'clsx';
import { Check, ShieldCheck, Users } from 'lucide-react';
import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export interface SelectSupportGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface SupportGroupOption {
  id: string;
  name: string;
  position?: number;
}

/**
 * Mobile-first drawer modal requiring support coordinators to select the active service group.
 * Ensures an auxiliary coordinator cannot remain without a group context, unlocking
 * real-time server metrics, attendance taking, and roster supervision immediately upon selection.
 *
 * @param {SelectSupportGroupModalProps} props - Component properties.
 * @returns {JSX.Element} The rendered modal component.
 */
export const SelectSupportGroupModal: React.FC<
  SelectSupportGroupModalProps
> = ({ open, onOpenChange }) => {
  const { t } = useTranslation(['kidChurch', 'common']);
  const dispatch = useAppDispatch();
  const kidsModuleName = useKidsTerm('module_alias');

  const { activeCampusId, campuses, activeGroupConfigId, isSupportingGroup } =
    useAppSelector((state) => state.volunteerContextSlice);

  const currentCampus = useAppSelector(
    (state) => state.churchCampusSlice.current,
  );
  const effectiveCampusId = activeCampusId || currentCampus?.id;

  const currentCampusContext = campuses.find((c) => c.id === effectiveCampusId);

  const ministries = useAppSelector(
    (state) => state.ministrySlice.ministries || [],
  );
  const kidsMinistry = useMemo(() => {
    if (effectiveCampusId) {
      const match = ministries.find(
        (m) =>
          m.churchCampusId === effectiveCampusId &&
          m.type === MinistryType.KIDS,
      );
      if (match) return match;
    }
    return ministries.find((m) => m.type === MinistryType.KIDS);
  }, [ministries, effectiveCampusId]);

  const { data: workspaceData, isLoading: isLoadingWorkspace } =
    useGetMinistryWorkspaceOverviewQuery(
      effectiveCampusId
        ? { churchCampusId: effectiveCampusId, ministryId: kidsMinistry?.id }
        : undefined,
      { skip: !open || !effectiveCampusId },
    );

  const availableGroups = useMemo<SupportGroupOption[]>(() => {
    const groupMap = new Map<string, SupportGroupOption>();

    // 1. Groups from workspace overview API
    if (workspaceData?.groups && workspaceData.groups.length > 0) {
      workspaceData.groups.forEach((g: IMinistryGroupConfig) => {
        const isDeleted = g.state === EntityState.DELETED;
        const isApoyoLabel = g.name?.toLowerCase().includes('apoyo');
        if (!isDeleted && !isApoyoLabel) {
          groupMap.set(g.id, {
            id: g.id,
            name: g.name,
            position: g.position ?? 0,
          });
        }
      });
    }

    // 2. Fallback to campus volunteer context groups if available
    if (
      currentCampusContext?.groups &&
      currentCampusContext.groups.length > 0
    ) {
      currentCampusContext.groups.forEach((g) => {
        const isApoyoLabel = g.name?.toLowerCase().includes('apoyo');
        if (!isApoyoLabel && !groupMap.has(g.id)) {
          groupMap.set(g.id, {
            id: g.id,
            name: g.name,
            position: g.position ?? 0,
          });
        }
      });
    }

    return Array.from(groupMap.values()).sort(
      (a, b) =>
        (a.position ?? 0) - (b.position ?? 0) || a.name.localeCompare(b.name),
    );
  }, [workspaceData?.groups, currentCampusContext?.groups]);

  const hasActiveGroup = Boolean(
    activeGroupConfigId &&
    activeGroupConfigId !== 'ADMIN_GROUP' &&
    isSupportingGroup,
  );

  // Auto-select when exactly 1 group is available and coordinator has no active selection
  useEffect(() => {
    if (open && !hasActiveGroup && availableGroups.length === 1) {
      const singleGroup = availableGroups[0];
      dispatch(
        setSupportedGroupConfig({
          groupConfigId: singleGroup.id,
          groupConfigName: singleGroup.name,
        }),
      );
      onOpenChange(false);
    }
  }, [open, hasActiveGroup, availableGroups, dispatch, onOpenChange]);

  const handleSelectGroup = (group: SupportGroupOption) => {
    dispatch(
      setSupportedGroupConfig({
        groupConfigId: group.id,
        groupConfigName: group.name,
      }),
    );
    toast.success(
      t('coordinator_dashboard.toast_support_group_selected', {
        group: group.name,
        defaultValue: 'Apoyando ahora a {{group}}',
      }),
    );
    onOpenChange(false);
  };

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={t(
        'coordinator_dashboard.select_support_group_title',
        'Seleccionar Grupo a Apoyar',
      )}
      icon={<ShieldCheck size={18} className="text-primary" />}
      showCloseButton={hasActiveGroup}
      dismissible={hasActiveGroup}
      bodyClassName="px-4 py-4 flex flex-col gap-3 pb-8"
    >
      <div className="bg-primary/5 border border-primary/15 rounded-2xl p-3.5 mb-1 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
          <Users size={16} />
        </div>
        <p className="text-xs text-slate-600 font-medium leading-relaxed">
          {t(
            'coordinator_dashboard.select_support_group_desc',
            'Como coordinador de apoyo temporal, debes seleccionar a qué grupo estás apoyando hoy para visualizar sus métricas y habilitar la toma de asistencia.',
          )}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {isLoadingWorkspace && availableGroups.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold">
              {t('common:loading', { defaultValue: 'Cargando grupos...' })}
            </span>
          </div>
        ) : availableGroups.length === 0 ? (
          <div className="py-8 text-center text-xs font-semibold text-slate-500">
            {t(
              'coordinator_dashboard.no_groups_found',
              'No se encontraron grupos configurados en esta sede.',
            )}
          </div>
        ) : (
          availableGroups.map((group) => {
            const isSelected = activeGroupConfigId === group.id;

            return (
              <button
                key={group.id}
                type="button"
                onClick={() => handleSelectGroup(group)}
                className={clsx(
                  'w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left outline-none cursor-pointer',
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-xs'
                    : 'border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300 shadow-2xs',
                )}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={clsx(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                      isSelected
                        ? 'bg-primary text-white'
                        : 'bg-slate-100 text-slate-600',
                    )}
                  >
                    <Users size={18} />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-bold text-sm text-slate-900 truncate">
                      {group.name}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 mt-0.5 truncate">
                      {kidsModuleName}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shrink-0 ml-2 shadow-2xs">
                    <Check size={14} strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </AppDrawer>
  );
};

export default SelectSupportGroupModal;
