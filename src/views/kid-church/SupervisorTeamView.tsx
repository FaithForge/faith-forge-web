import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetVolunteerAssignments } from '@/libs/state/redux/thunks/church/volunteer.thunk';
import { IVolunteerAssignment, VolunteerRole } from '@/libs/models/Volunteer';
import { capitalizeWords } from '@/libs/utils/text';
import {
  Users,
  Search,
  Phone,
  Building2,
  Calendar,
  Sparkles,
  RefreshCw,
  UserCheck,
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import clsx from 'clsx';
import { EntityState, MinistryType, MinistryAreaScope } from '@/libs/models';
import { toast } from 'sonner';
import { APP_ROUTES } from '@/config/routes';
import { useChurchTerm, useKidsTerm, getVolunteerRoleLabel } from '@/libs/hooks/useTerm';

const ROLE_LABEL: Record<VolunteerRole, string> = {
  [VolunteerRole.VOLUNTEER]: 'Servidor(a)',
  [VolunteerRole.SUPERVISOR]: 'Supervisor(a)',
  [VolunteerRole.GROUP_COORDINATOR]: 'Coordinador(a) de Grupo',
  [VolunteerRole.AREA_GENERAL_COORDINATOR]: 'Coordinador(a) de Área',
  [VolunteerRole.MINISTRY_GENERAL_COORDINATOR]: 'Coordinador(a) General',
};

interface RoleThemeStyle {
  badge: string;
  avatar: string;
  photoRing: string;
  highlightBg: string;
  tagBg: string;
}

const EMPTY_ASSIGNMENTS: IVolunteerAssignment[] = [];

/**
 * Resolves the visual theme (badge, avatar initials, photo border, and row highlight)
 * according to the exact role and area colors defined across the application interface:
 * - Registro (Supervisor / Servidor) -> Emerald/Green (#15803d, #16a34a)
 * - Niños Supervisor -> Purple (#9333ea)
 * - Niños Servidor -> Amber/Yellow (#fbbf24)
 * - Coordinador de Grupo -> Pink (#db2777)
 * - Coordinador General -> Amber (#d97706)
 */
const getAssignmentRoleTheme = (asg: IVolunteerAssignment): RoleThemeStyle => {
  const asgArea = asg.ministryArea || asg.serviceAreaGroup?.ministryArea;
  const areaName = (asgArea?.name || '').toLowerCase();
  const isRegistrationArea =
    asgArea?.scope === 'KID_REGISTRATION' ||
    areaName.includes('registro') ||
    areaName.includes('regikids');

  if (asg.role === VolunteerRole.GROUP_COORDINATOR) {
    return {
      badge: 'bg-pink-100 text-pink-700',
      avatar: 'bg-pink-100 text-pink-700 border-2 border-pink-200',
      photoRing: 'ring-2 ring-pink-400 ring-offset-1',
      highlightBg: 'bg-pink-50/30 hover:bg-pink-50/50',
      tagBg: 'bg-pink-100 text-pink-700 border-pink-200',
    };
  }

  if (asg.role === VolunteerRole.MINISTRY_GENERAL_COORDINATOR) {
    return {
      badge: 'bg-amber-100 text-amber-800',
      avatar: 'bg-amber-100 text-amber-800 border-2 border-amber-300',
      photoRing: 'ring-2 ring-amber-400 ring-offset-1',
      highlightBg: 'bg-amber-50/30 hover:bg-amber-50/50',
      tagBg: 'bg-amber-100 text-amber-800 border-amber-300',
    };
  }

  if (asg.role === VolunteerRole.AREA_GENERAL_COORDINATOR) {
    if (isRegistrationArea) {
      return {
        badge: 'bg-emerald-100 text-emerald-800',
        avatar: 'bg-emerald-100 text-emerald-800 border-2 border-emerald-300',
        photoRing: 'ring-2 ring-emerald-500 ring-offset-1',
        highlightBg: 'bg-emerald-50/30 hover:bg-emerald-50/50',
        tagBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      };
    }
    return {
      badge: 'bg-blue-100 text-blue-700',
      avatar: 'bg-blue-100 text-blue-700 border-2 border-blue-200',
      photoRing: 'ring-2 ring-blue-400 ring-offset-1',
      highlightBg: 'bg-blue-50/25 hover:bg-blue-50/40',
      tagBg: 'bg-blue-100 text-blue-700 border-blue-200',
    };
  }

  if (asg.role === VolunteerRole.SUPERVISOR) {
    if (isRegistrationArea) {
      // Registro Supervisor - Green-700 / Forest green (#15803d)
      return {
        badge: 'bg-green-200/90 text-green-900 border border-green-400/80 font-bold',
        avatar: 'bg-green-100 text-green-900 border-2 border-green-600',
        photoRing: 'ring-2 ring-green-600 ring-offset-1',
        highlightBg: 'bg-green-50/40 hover:bg-green-50/60',
        tagBg: 'bg-green-200 text-green-900 border-green-400',
      };
    }
    return {
      badge: 'bg-purple-100 text-purple-700 border border-purple-200/70 font-bold',
      avatar: 'bg-purple-100 text-purple-700 border-2 border-purple-200',
      photoRing: 'ring-2 ring-purple-400 ring-offset-1',
      highlightBg: 'bg-purple-50/25 hover:bg-purple-50/40',
      tagBg: 'bg-purple-100 text-purple-700 border-purple-200',
    };
  }

  // VOLUNTEER (Servidor)
  if (isRegistrationArea) {
    // Registro Servidor - Green-600 / Emerald / Mint (#16a34a)
    return {
      badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold',
      avatar: 'bg-emerald-50 text-emerald-700 border-2 border-emerald-300',
      photoRing: 'ring-2 ring-emerald-400 ring-offset-1',
      highlightBg: 'bg-emerald-50/20 hover:bg-emerald-50/40',
      tagBg: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    };
  }

  return {
    badge: 'bg-amber-100 text-amber-800',
    avatar: 'bg-amber-100 text-amber-800 border-2 border-amber-300',
    photoRing: 'ring-2 ring-amber-400 ring-offset-1',
    highlightBg: 'bg-amber-50/25 hover:bg-amber-50/40',
    tagBg: 'bg-amber-100 text-amber-800 border-amber-300',
  };
};

/**
 * Team directory view for Supervisors, displaying the servers assigned
 * to the supervisor's active group and service area.
 *
 * @returns {JSX.Element} Rendered supervisor team view.
 */
export const SupervisorTeamView: React.FC = () => {
  const { t } = useTranslation(['kidChurch', 'common']);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState('');

  const currentUser = useAppSelector((state) => state.authSlice.user);
  const currentRole = useAppSelector((state) => state.authSlice.currentRole);

  const {
    activeCampusId,
    activeCampusName,
    activeGroupConfigId,
    activeGroupConfigName,
    activeVolunteerRole,
    campuses,
  } = useAppSelector((state) => state.volunteerContextSlice);

  const isSuperAdmin = currentRole === 'SUPER_ADMIN' || currentRole === 'ADMIN';

  const isServidor =
    currentRole === 'KID_REGISTER_USER' ||
    currentRole === 'KID_GROUP_USER' ||
    activeVolunteerRole === VolunteerRole.VOLUNTEER;

  const isAreaCoordinator =
    currentRole === 'KID_REGISTER_ADMIN' ||
    activeVolunteerRole === VolunteerRole.AREA_GENERAL_COORDINATOR;

  const isGroupCoordinator =
    currentRole === 'KID_GROUP_ADMIN' ||
    activeVolunteerRole === VolunteerRole.GROUP_COORDINATOR;

  const isSupervisor =
    currentRole === 'KID_REGISTER_SUPERVISOR' ||
    currentRole === 'KID_GROUP_SUPERVISOR' ||
    activeVolunteerRole === VolunteerRole.SUPERVISOR;

  const isCoordinator = isAreaCoordinator || isGroupCoordinator || currentRole === 'MINISTRY_ADMIN';

  const canAccessTeam =
    !isServidor &&
    (isSuperAdmin ||
      isCoordinator ||
      isSupervisor ||
      activeVolunteerRole === VolunteerRole.MINISTRY_GENERAL_COORDINATOR);

  useEffect(() => {
    if (!canAccessTeam) {
      toast.error(t('supervisor_team.access_denied'));
      const fallbackUrl = currentRole?.includes('REGISTER')
        ? APP_ROUTES.kidRegistration.root
        : APP_ROUTES.kidChurch.root;
      navigate(fallbackUrl, { replace: true });
    }
  }, [canAccessTeam, currentRole, navigate, t]);

  const churchVolunteersTerm = useChurchTerm('volunteers');
  const kidsRegistrationName = useKidsTerm('registration');
  const kidsModuleName = useKidsTerm('module_alias');

  const currentCampus = useAppSelector((state) => state.churchCampusSlice.current);
  const effectiveCampusId = activeCampusId || currentCampus?.id;

  // Derive active area and SAG from campus context
  const activeCampusData = campuses.find((c) => c.id === effectiveCampusId);
  const activeGroupData = activeCampusData?.groups.find((g) => g.id === activeGroupConfigId);
  const supervisorAreaIds = useMemo(
    () => activeGroupData?.areas.map((a) => a.id).filter(Boolean) || [],
    [activeGroupData],
  );
  const supervisorSagIds = useMemo(
    () => activeGroupData?.areas.map((a) => a.serviceAreaGroupId).filter(Boolean) || [],
    [activeGroupData],
  );
  const primaryArea = activeGroupData?.areas[0];
  const activeAreaId = primaryArea?.id;
  const areaName = primaryArea?.name || 'Mi Área';

  // Area Coordinator context: find the specific Area by scope (KID_REGISTRATION)
  const areaCoord =
    activeCampusData?.areaCoordinates?.find(
      (a) => a.scope === MinistryAreaScope.KID_REGISTRATION,
    ) || activeCampusData?.areaCoordinates?.[0];

  const fallbackArea = activeCampusData?.groups
    .flatMap((g) => g.areas)
    .find((a) => a.scope === MinistryAreaScope.KID_REGISTRATION);

  const effectiveAreaId = isAreaCoordinator
    ? (areaCoord?.id || fallbackArea?.id || activeAreaId)
    : activeAreaId;

  const effectiveAreaName = isAreaCoordinator
    ? (areaCoord?.name || fallbackArea?.name || kidsRegistrationName)
    : areaName;

  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('ALL');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('ALL');

  const effectiveGroupId =
    activeGroupConfigId && activeGroupConfigId !== 'ADMIN_GROUP'
      ? activeGroupConfigId
      : undefined;

  const partitionKey = isAreaCoordinator
    ? `my-team-area-${effectiveCampusId}-${effectiveAreaId || 'all'}`
    : `my-team-${effectiveCampusId}-${effectiveGroupId || 'all'}-${isGroupCoordinator ? 'all' : (activeAreaId || 'all')}`;

  const assignments =
    useAppSelector(
      (state) => state.volunteerSlice.assignmentsByPartition[partitionKey],
    ) ?? EMPTY_ASSIGNMENTS;
  const isLoading = useAppSelector(
    (state) => state.volunteerSlice.loadingByPartition[partitionKey] || false,
  );

  const loadTeamData = React.useCallback(() => {
    if (!effectiveCampusId) return;

    if (isAreaCoordinator) {
      dispatch(
        GetVolunteerAssignments({
          churchCampusId: effectiveCampusId,
          ministryAreaId: effectiveAreaId || undefined,
          ministryGroupConfigId: undefined,
          state: EntityState.ACTIVE,
          partitionKey,
          force: true,
        }),
      );
    } else {
      dispatch(
        GetVolunteerAssignments({
          churchCampusId: effectiveCampusId,
          ministryGroupConfigId: effectiveGroupId,
          ministryAreaId: isGroupCoordinator ? undefined : (activeAreaId || undefined),
          state: EntityState.ACTIVE,
          partitionKey,
          force: true,
        }),
      );
    }
  }, [
    dispatch,
    effectiveCampusId,
    isAreaCoordinator,
    effectiveAreaId,
    effectiveGroupId,
    isGroupCoordinator,
    activeAreaId,
    partitionKey,
  ]);

  useEffect(() => {
    loadTeamData();
  }, [loadTeamData]);

  // Available groups for filtering when in Area Coordinator mode
  const availableGroups = useMemo(() => {
    const groupMap = new Map<string, string>();
    activeCampusData?.groups.forEach((g) => {
      if (g.id && g.name) groupMap.set(g.id, g.name);
    });
    assignments.forEach((asg: IVolunteerAssignment) => {
      const g = asg.ministryGroupConfig || asg.serviceAreaGroup?.ministryGroupConfig;
      if (g?.id && g?.name) {
        groupMap.set(g.id, g.name);
      }
    });
    return Array.from(groupMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es', { numeric: true }));
  }, [activeCampusData, assignments]);

  // List of distinct areas available in this group
  const availableAreas = useMemo(() => {
    const areaMap = new Map<string, string>();
    activeGroupData?.areas.forEach((a) => {
      if (a.id && a.name) areaMap.set(a.id, a.name);
    });
    assignments.forEach((asg: IVolunteerAssignment) => {
      const area = asg.ministryArea || asg.serviceAreaGroup?.ministryArea;
      if (area?.id && area?.name) {
        areaMap.set(area.id, area.name);
      }
    });
    return Array.from(areaMap.entries()).map(([id, name]) => ({ id, name }));
  }, [activeGroupData, assignments]);

  // Count coordinators in the active assignments
  const coordinatorCount = useMemo(() => {
    return assignments.filter((asg: IVolunteerAssignment) => {
      if (asg.state === EntityState.DELETED) return false;
      return asg.role === VolunteerRole.GROUP_COORDINATOR;
    }).length;
  }, [assignments]);

  const ROLE_HIERARCHY: Record<VolunteerRole, number> = {
    [VolunteerRole.MINISTRY_GENERAL_COORDINATOR]: 5,
    [VolunteerRole.AREA_GENERAL_COORDINATOR]: 4,
    [VolunteerRole.GROUP_COORDINATOR]: 3,
    [VolunteerRole.SUPERVISOR]: 2,
    [VolunteerRole.VOLUNTEER]: 1,
  };

  // Filter assignments:
  // For Area Coordinators: show only Supervisors and Servidores of their area, filterable by group
  // For Group Coordinators: show Coordinators, Supervisors and Servidores in the group
  // For Supervisors: show only Supervisor and Servidores in their specific area
  const filteredAssignments = useMemo(() => {
    const list = assignments.filter((asg: IVolunteerAssignment) => {
      if (asg.state === EntityState.DELETED) return false;

      if (isAreaCoordinator) {
        // Area Coordinator strictly sees supervisors and volunteers of their area
        const isAllowedRole =
          asg.role === VolunteerRole.SUPERVISOR || asg.role === VolunteerRole.VOLUNTEER;
        if (!isAllowedRole) return false;

        if (effectiveAreaId) {
          const asgAreaId =
            asg.ministryAreaId ||
            asg.serviceAreaGroup?.ministryAreaId ||
            asg.serviceAreaGroup?.ministryArea?.id;
          if (asgAreaId && asgAreaId !== effectiveAreaId) {
            return false;
          }
        }

        if (selectedGroupFilter !== 'ALL') {
          const asgGroupId =
            asg.ministryGroupConfigId ||
            asg.serviceAreaGroup?.ministryGroupConfigId ||
            asg.serviceAreaGroup?.ministryGroupConfig?.id;
          if (asgGroupId !== selectedGroupFilter) {
            return false;
          }
        }
      } else if (isGroupCoordinator) {
        const isAllowedRole =
          asg.role === VolunteerRole.GROUP_COORDINATOR ||
          asg.role === VolunteerRole.SUPERVISOR ||
          asg.role === VolunteerRole.VOLUNTEER;
        if (!isAllowedRole) return false;

        if (selectedAreaFilter === 'COORDINATORS') {
          if (asg.role !== VolunteerRole.GROUP_COORDINATOR) {
            return false;
          }
        } else if (selectedAreaFilter !== 'ALL') {
          // Area filter: only servers belonging to this area, strictly excluding group coordinators
          if (asg.role === VolunteerRole.GROUP_COORDINATOR) {
            return false;
          }
          const asgAreaId =
            asg.ministryAreaId ||
            asg.serviceAreaGroup?.ministryAreaId ||
            asg.serviceAreaGroup?.ministryArea?.id;
          if (asgAreaId !== selectedAreaFilter) {
            return false;
          }
        }
      } else {
        const isAllowedRole =
          asg.role === VolunteerRole.SUPERVISOR || asg.role === VolunteerRole.VOLUNTEER;
        if (!isAllowedRole) return false;

        if (supervisorAreaIds.length > 0 || supervisorSagIds.length > 0) {
          const asgAreaId =
            asg.ministryAreaId ||
            asg.serviceAreaGroup?.ministryAreaId ||
            asg.serviceAreaGroup?.ministryArea?.id;
          const asgSagId = asg.serviceAreaGroupId || asg.serviceAreaGroup?.id;

          const matchesArea =
            (asgAreaId && supervisorAreaIds.includes(asgAreaId)) ||
            (asgSagId && supervisorSagIds.includes(asgSagId));

          if (!matchesArea) return false;
        }
      }

      // Filter by search term
      const user = asg.user || asg.volunteer?.user;
      const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.toLowerCase();
      const nationalId = `${user?.nationalId || ''}`.toLowerCase();
      const phone = `${user?.phone || ''}`.toLowerCase();
      const term = searchTerm.trim().toLowerCase();

      if (!term) return true;
      return (
        fullName.includes(term) || nationalId.includes(term) || phone.includes(term)
      );
    });

    // Sort by role descending, then name ascending
    return list.sort((a, b) => {
      const rankDiff = (ROLE_HIERARCHY[b.role] || 0) - (ROLE_HIERARCHY[a.role] || 0);
      if (rankDiff !== 0) return rankDiff;

      const userA = a.user || a.volunteer?.user;
      const userB = b.user || b.volunteer?.user;
      const nameA = `${userA?.firstName || ''} ${userA?.lastName || ''}`.trim().toLowerCase();
      const nameB = `${userB?.firstName || ''} ${userB?.lastName || ''}`.trim().toLowerCase();
      return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
    });
  }, [
    assignments,
    isAreaCoordinator,
    effectiveAreaId,
    selectedGroupFilter,
    isGroupCoordinator,
    selectedAreaFilter,
    supervisorAreaIds,
    supervisorSagIds,
    searchTerm,
  ]);

  const isRegistrationUser =
    currentRole === 'KID_REGISTER_ADMIN' ||
    currentRole === 'KID_REGISTER_SUPERVISOR';

  const headerBadgeStyle = useMemo(() => {
    if (isRegistrationUser || isAreaCoordinator) {
      return 'bg-emerald-100 text-emerald-800';
    }
    if (isCoordinator) {
      return 'bg-pink-100 text-pink-700';
    }
    return 'bg-purple-100 text-purple-700';
  }, [isRegistrationUser, isAreaCoordinator, isCoordinator]);

  if (!canAccessTeam) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-5 pb-28 sm:pb-32">
      {/* Header card with leadership badge */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={clsx(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold',
                headerBadgeStyle,
              )}
            >
              <UserCheck size={13} />
              {isAreaCoordinator
                ? t('supervisor_team.role_area_coordinator')
                : isGroupCoordinator
                ? t('supervisor_team.role_group_coordinator')
                : t('supervisor_team.role_supervisor')}
            </span>
            {isAreaCoordinator ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                <Sparkles size={13} />
                {effectiveAreaName}
              </span>
            ) : activeGroupConfigName ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                <Calendar size={13} />
                {activeGroupConfigName}
              </span>
            ) : null}
            {activeCampusName && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                <Building2 size={13} />
                {activeCampusName}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            {isAreaCoordinator
              ? t('supervisor_team.title_area', { name: effectiveAreaName })
              : isGroupCoordinator
              ? t('supervisor_team.title_group', { name: activeGroupConfigName || 'Grupo' })
              : t('supervisor_team.title_group', { name: areaName })}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            {isAreaCoordinator
              ? t('supervisor_team.subtitle_area', { name: effectiveAreaName })
              : isGroupCoordinator
              ? t('supervisor_team.subtitle_group')
              : t('supervisor_team.subtitle_supervisor')}
          </p>
        </div>

        <button
          onClick={loadTeamData}
          disabled={isLoading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200/80 transition-colors active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={14} className={clsx(isLoading && 'animate-spin text-primary')} />
          {t('supervisor_team.refresh')}
        </button>
      </div>

      {/* Search & metric bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('supervisor_team.search_placeholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 shadow-2xs transition-all"
          />
        </div>
        <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white rounded-2xl border border-gray-200 text-xs font-bold text-gray-600 shadow-2xs justify-between sm:justify-start">
          <Users size={15} className="text-primary" />
          <span>
            {filteredAssignments.length === 1
              ? t('supervisor_team.count_one')
              : t('supervisor_team.count_other', { count: filteredAssignments.length })}
          </span>
        </div>
      </div>

      {/* Group filter tabs for Area Coordinator */}
      {isAreaCoordinator && availableGroups.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedGroupFilter('ALL')}
            className={clsx(
              'px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-2xs',
              selectedGroupFilter === 'ALL'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80',
            )}
          >
            <span>{t('supervisor_team.all_groups')}</span>
            <span
              className={clsx(
                'px-1.5 py-0.2 rounded-full text-[10px] font-extrabold',
                selectedGroupFilter === 'ALL'
                  ? 'bg-white/25 text-white'
                  : 'bg-gray-100 text-gray-600',
              )}
            >
              {
                assignments.filter(
                  (asg) =>
                    asg.state !== EntityState.DELETED &&
                    (asg.role === VolunteerRole.SUPERVISOR || asg.role === VolunteerRole.VOLUNTEER),
                ).length
              }
            </span>
          </button>

          {availableGroups.map((group) => {
            const count = assignments.filter((asg: IVolunteerAssignment) => {
              if (asg.state === EntityState.DELETED) return false;
              if (asg.role !== VolunteerRole.SUPERVISOR && asg.role !== VolunteerRole.VOLUNTEER)
                return false;
              const asgGroupId =
                asg.ministryGroupConfigId ||
                asg.serviceAreaGroup?.ministryGroupConfigId ||
                asg.serviceAreaGroup?.ministryGroupConfig?.id;
              return asgGroupId === group.id;
            }).length;

            return (
              <button
                key={group.id}
                type="button"
                onClick={() => setSelectedGroupFilter(group.id)}
                className={clsx(
                  'px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-2xs',
                  selectedGroupFilter === group.id
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80',
                )}
              >
                <span>{group.name}</span>
                <span
                  className={clsx(
                    'px-1.5 py-0.2 rounded-full text-[10px] font-extrabold',
                    selectedGroupFilter === group.id
                      ? 'bg-white/25 text-white'
                      : 'bg-gray-100 text-gray-600',
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Area & Role filter tabs for Group Coordinators */}
      {!isAreaCoordinator && isGroupCoordinator && (availableAreas.length > 0 || coordinatorCount > 0) && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedAreaFilter('ALL')}
            className={clsx(
              'px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-2xs',
              selectedAreaFilter === 'ALL'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80',
            )}
          >
            <span>{t('supervisor_team.all_areas')}</span>
          </button>

          {/* Coordinadores de grupo - First specific category filter */}
          {coordinatorCount > 0 && (
            <button
              type="button"
              onClick={() => setSelectedAreaFilter('COORDINATORS')}
              className={clsx(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-2xs',
                selectedAreaFilter === 'COORDINATORS'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80',
              )}
            >
              <span>{t('supervisor_team.group_coordinators')}</span>
              <span
                className={clsx(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-extrabold',
                  selectedAreaFilter === 'COORDINATORS'
                    ? 'bg-white/25 text-white'
                    : 'bg-gray-100 text-gray-600',
                )}
              >
                {coordinatorCount}
              </span>
            </button>
          )}

          {/* Area filter tabs */}
          {availableAreas.map((area) => {
            const count = assignments.filter((asg: IVolunteerAssignment) => {
              if (asg.state === EntityState.DELETED) return false;
              if (asg.role === VolunteerRole.GROUP_COORDINATOR) return false;
              const asgAreaId =
                asg.ministryAreaId ||
                asg.serviceAreaGroup?.ministryAreaId ||
                asg.serviceAreaGroup?.ministryArea?.id;
              return asgAreaId === area.id;
            }).length;

            return (
              <button
                key={area.id}
                type="button"
                onClick={() => setSelectedAreaFilter(area.id)}
                className={clsx(
                  'px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-2xs',
                  selectedAreaFilter === area.id
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80',
                )}
              >
                <span>{area.name}</span>
                <span
                  className={clsx(
                    'px-1.5 py-0.2 rounded-full text-[10px] font-extrabold',
                    selectedAreaFilter === area.id
                      ? 'bg-white/25 text-white'
                      : 'bg-gray-100 text-gray-600',
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Server list */}
      {isLoading && assignments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs divide-y divide-gray-100 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="p-3.5 sm:p-4 flex items-center justify-between gap-3 animate-pulse"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-gray-100 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
              </div>
              <div className="w-24 h-8 bg-gray-100 rounded-xl shrink-0" />
            </div>
          ))}
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-gray-100 shadow-xs text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400">
            <Users size={28} />
          </div>
          <h3 className="text-base font-bold text-gray-800">
            {searchTerm
              ? t('supervisor_team.empty_search_title')
              : t('supervisor_team.empty_default_title', { volunteers: churchVolunteersTerm.toLowerCase() })}
          </h3>
          <p className="text-xs text-gray-400 max-w-sm">
            {searchTerm
              ? t('supervisor_team.empty_search_desc')
              : t('supervisor_team.empty_default_desc', { volunteers: churchVolunteersTerm.toLowerCase() })}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs divide-y divide-gray-100 overflow-hidden">
          {filteredAssignments.map((asg) => {
            const user = asg.user || asg.volunteer?.user;
            const firstName = user?.firstName || 'Servidor';
            const lastName = user?.lastName || '';
            const fullName = capitalizeWords(`${firstName} ${lastName}`.trim());
            const isMe =
              (user?.id && user.id === currentUser?.id) ||
              (asg.volunteer?.userId && asg.volunteer.userId === currentUser?.id);
            const isCoordinatorRole = asg.role === VolunteerRole.GROUP_COORDINATOR;
            const isSupervisorRole = asg.role === VolunteerRole.SUPERVISOR;
            const asgArea = asg.ministryArea || asg.serviceAreaGroup?.ministryArea;
            const isKids =
              asg.ministry?.type === MinistryType.KIDS ||
              (!asg.ministry && asgArea?.scope === MinistryAreaScope.KID_GROUP_MANAGEMENT);
            const roleName = getVolunteerRoleLabel(asg.role, {
              ministryType: isKids ? MinistryType.KIDS : MinistryType.GENERAL,
              ministryOverrides: asg.ministry?.terminologyOverrides,
            });
            const phone = user?.phone;
            const dialCode = user?.dialCodePhone || '+57';
            const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
            const fullPhone = cleanPhone ? `${dialCode}${cleanPhone}`.replace('+', '') : '';
            const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'SV';
            const roleTheme = getAssignmentRoleTheme(asg);

            return (
              <div
                key={asg.id}
                className={clsx(
                  'p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-colors hover:bg-gray-50/80',
                  isMe && roleTheme.highlightBg,
                )}
              >
                {/* Left side: Avatar + Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={clsx(
                      'w-11 h-11 rounded-2xl font-bold flex items-center justify-center shrink-0 text-sm shadow-2xs overflow-hidden',
                      roleTheme.avatar,
                      user?.photoUrl && roleTheme.photoRing,
                    )}
                  >
                    {user?.photoUrl ? (
                      <img
                        src={user.photoUrl}
                        alt={fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-gray-900 text-sm truncate">
                        {fullName}
                      </h4>
                      {isMe && (
                        <span
                          className={clsx(
                            'px-1.5 py-0.2 rounded-md text-[10px] font-extrabold border',
                            roleTheme.tagBg,
                          )}
                        >
                          {t('supervisor_team.badge_you')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span
                        className={clsx(
                          'px-2 py-0.5 rounded-md text-[11px] font-bold tracking-tight',
                          roleTheme.badge,
                        )}
                      >
                        {roleName}
                      </span>
                      <span className="text-[11px] text-gray-500 font-medium">
                        {isAreaCoordinator
                          ? (() => {
                              const gName =
                                asg.ministryGroupConfig?.name ||
                                asg.serviceAreaGroup?.ministryGroupConfig?.name ||
                                availableGroups.find(
                                   (g) =>
                                     g.id === asg.ministryGroupConfigId ||
                                     g.id === asg.serviceAreaGroup?.ministryGroupConfigId,
                                )?.name;
                              return gName ? `· ${gName}` : t('supervisor_team.no_group_assigned');
                            })()
                          : `· ${asg.ministryArea?.name || asg.serviceAreaGroup?.ministryArea?.name || areaName}`}
                      </span>
                      {phone && (
                        <span className="text-xs text-gray-500 font-medium hidden sm:inline">
                          · {dialCode} {phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: WhatsApp and Phone Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {phone && fullPhone ? (
                    <>
                      <a
                        href={`https://wa.me/${fullPhone}?text=${encodeURIComponent(
                          `¡Hola ${firstName}! Te saluda ${
                            currentUser?.firstName
                              ? capitalizeWords(currentUser.firstName.split(' ')[0])
                              : 'tu supervisor'
                          } de ${kidsModuleName}.`,
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-bold text-xs transition-all active:scale-95 shadow-2xs"
                        title={t('supervisor_team.whatsapp_title')}
                      >
                        <FaWhatsapp size={15} />
                        <span className="hidden sm:inline">{t('supervisor_team.whatsapp_btn')}</span>
                      </a>
                      <a
                        href={`tel:${dialCode}${cleanPhone}`}
                        className="p-2 rounded-xl text-gray-500 bg-gray-50 hover:bg-gray-100 hover:text-gray-700 transition-all active:scale-95 shadow-2xs"
                        title={t('supervisor_team.call_title')}
                      >
                        <Phone size={15} />
                      </a>
                    </>
                  ) : (
                    <span className="text-[11px] text-gray-400 italic px-2">
                      {t('supervisor_team.no_phone')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Safe bottom spacer so the last card is never obscured by the floating navigation */}
      <div className="h-10 shrink-0 pointer-events-none" aria-hidden="true" />
    </div>
  );
};

export default SupervisorTeamView;
