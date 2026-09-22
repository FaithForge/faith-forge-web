import React, { useState, useMemo, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  User,
  LogOut,
  ChevronDown,
  Check,
  Search,
  Sparkles,
  Users as UsersIcon,
  Crown,
  Shield,
  Sliders,
  LayoutGrid,
  Bell,
} from 'lucide-react';
import clsx from 'clsx';
import { APP_ROUTES } from '@/config/routes';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { logout, changeCurrentRole, setActiveExperience } from '@/libs/state/redux/slices/user/auth.slice';
import {
  setActiveGroupConfig,
  setActiveVolunteerRole,
} from '@/libs/state/redux/slices/church/volunteerContext.slice';
import { VolunteerRole, IVolunteerGroupConfigContext } from '@/libs/models/Volunteer';
import { useSearchScroll } from '@/libs/context/SearchScrollContext';
import { useGetInAppNotificationsQuery } from '@/libs/state/redux/api/userApi';

const UserProfileModal = lazy(() => import('@/components/modal/UserProfileModal'));
const ChangelogDrawer = lazy(() => import('@/components/modal/ChangelogDrawer'));
const SettingsDrawer = lazy(() => import('@/components/modal/SettingsDrawer'));
const NotificationsDrawer = lazy(() => import('@/components/modal/NotificationsDrawer'));

import { APP_VERSION } from '@/constants/version';
import { ALL_SYSTEM_ROLES_ORDER, AppRole, ChurchRole, UserRole, UserExperienceEnum } from '@/libs/utils/auth';
import { isRoleEnabled } from '@/config/roles';
import { toast } from 'sonner';
import { capitalizeWords } from '@/libs/utils/text';
import { useRoleTransition } from '@/libs/context/RoleTransitionContext';
import { useChurchTerm, useKidsTerm } from '@/libs/hooks/useTerm';

export type ThemeRole = {
  id: AppRole;
  appTitle: string;
  label: string;
  themeClass: string;
  color: string;
  dashboardUrl: string;
};

export const userRolesNavBarConfig: Record<AppRole, ThemeRole> = {
  [UserRole.SUPER_ADMIN]: {
    id: UserRole.SUPER_ADMIN,
    appTitle: 'Admin',
    label: 'Super Administrador',
    themeClass: 'theme-SUPER_ADMIN',
    color: '#003963',
    dashboardUrl: APP_ROUTES.admin.root,
  },
  [UserRole.ADMIN]: {
    id: UserRole.ADMIN,
    appTitle: 'Admin',
    label: 'Administrador',
    themeClass: 'theme-ADMIN',
    color: '#003963',
    dashboardUrl: APP_ROUTES.admin.root,
  },
  [UserRole.STAFF]: {
    id: UserRole.STAFF,
    appTitle: 'Admin',
    label: 'Staff',
    themeClass: 'theme-STAFF',
    color: '#3b82f6',
    dashboardUrl: APP_ROUTES.admin.root,
  },
  [ChurchRole.MINISTRY_ADMIN]: {
    id: ChurchRole.MINISTRY_ADMIN,
    appTitle: 'KidChurch',
    label: 'Admin General',
    themeClass: 'theme-MINISTRY_ADMIN',
    color: '#d97706',
    dashboardUrl: APP_ROUTES.kidChurch.root,
  },
  [UserRole.KID_GROUP_ADMIN]: {
    id: UserRole.KID_GROUP_ADMIN,
    appTitle: 'KidChurch',
    label: 'Coordinador de Grupo',
    themeClass: 'theme-KID_GROUP_ADMIN',
    color: '#db2777',
    dashboardUrl: APP_ROUTES.kidChurch.root,
  },
  [UserRole.KID_GROUP_SUPERVISOR]: {
    id: UserRole.KID_GROUP_SUPERVISOR,
    appTitle: 'KidChurch',
    label: 'Supervisor',
    themeClass: 'theme-KID_GROUP_SUPERVISOR',
    color: '#9333ea',
    dashboardUrl: APP_ROUTES.kidChurch.root,
  },
  [UserRole.KID_GROUP_USER]: {
    id: UserRole.KID_GROUP_USER,
    appTitle: 'KidChurch',
    label: 'Servidor',
    themeClass: 'theme-KID_GROUP_USER',
    color: '#fbbf24',
    dashboardUrl: APP_ROUTES.kidChurch.root,
  },
  [UserRole.KID_REGISTER_ADMIN]: {
    id: UserRole.KID_REGISTER_ADMIN,
    appTitle: 'KidRegistration',
    label: 'Coordinador de Área',
    themeClass: 'theme-KID_REGISTER_ADMIN',
    color: '#166534',
    dashboardUrl: APP_ROUTES.kidRegistration.root,
  },
  [UserRole.KID_REGISTER_SUPERVISOR]: {
    id: UserRole.KID_REGISTER_SUPERVISOR,
    appTitle: 'KidRegistration',
    label: 'Supervisor',
    themeClass: 'theme-KID_REGISTER_SUPERVISOR',
    color: '#15803d',
    dashboardUrl: APP_ROUTES.kidRegistration.root,
  },
  [UserRole.KID_REGISTER_USER]: {
    id: UserRole.KID_REGISTER_USER,
    appTitle: 'KidRegistration',
    label: 'Servidor',
    themeClass: 'theme-KID_REGISTER_USER',
    color: '#16a34a',
    dashboardUrl: APP_ROUTES.kidRegistration.root,
  },
  [ChurchRole.KID_SECURITY_COORDINATOR]: {
    id: ChurchRole.KID_SECURITY_COORDINATOR,
    appTitle: 'KidRegistration',
    label: 'Coordinador de Seguridad',
    themeClass: 'theme-KID_REGISTER_ADMIN',
    color: '#047857',
    dashboardUrl: APP_ROUTES.kidRegistration.root,
  },
  [ChurchRole.KID_SECURITY_SUPERVISOR]: {
    id: ChurchRole.KID_SECURITY_SUPERVISOR,
    appTitle: 'KidRegistration',
    label: 'Supervisor de Seguridad',
    themeClass: 'theme-KID_REGISTER_SUPERVISOR',
    color: '#059669',
    dashboardUrl: APP_ROUTES.kidRegistration.root,
  },
  [ChurchRole.KID_SECURITY_USER]: {
    id: ChurchRole.KID_SECURITY_USER,
    appTitle: 'KidRegistration',
    label: 'Servidor de Seguridad',
    themeClass: 'theme-KID_REGISTER_USER',
    color: '#10b981',
    dashboardUrl: APP_ROUTES.kidRegistration.root,
  },
  [UserRole.USER]: {
    id: UserRole.USER,
    appTitle: 'KidChurch',
    label: 'Usuario',
    themeClass: 'theme-USER',
    color: '#003963',
    dashboardUrl: APP_ROUTES.kidRegistration.root,
  },
};

export const getRoleIcon = (roleId?: string, label?: string, appTitle?: string) => {
  if (appTitle === 'Admin' || roleId === UserRole.ADMIN || roleId === UserRole.SUPER_ADMIN || roleId === UserRole.STAFF) {
    return Sliders;
  }
  const isCoord =
    (label && label.includes('Coordinador')) ||
    roleId === ChurchRole.MINISTRY_ADMIN ||
    roleId === UserRole.KID_REGISTER_ADMIN ||
    roleId === UserRole.KID_GROUP_ADMIN;
  if (isCoord) return Crown;
  const isSupervisor =
    (label && label.includes('Supervisor')) ||
    roleId === UserRole.KID_GROUP_SUPERVISOR ||
    roleId === UserRole.KID_REGISTER_SUPERVISOR;
  if (isSupervisor) return Shield;
  return UsersIcon;
};

/** Checks if a service area belongs to registration */
const isAreaRegistration = (area?: { scope?: string; name?: string }) => {
  if (!area) return false;
  return area.scope === 'KID_REGISTRATION';
};

/** Checks if a role is a system-level admin role (which never belongs to a group) */
const isSystemAdminRole = (roleId?: string, appTitle?: string) => {
  return (
    appTitle === 'Admin' ||
    roleId === UserRole.SUPER_ADMIN ||
    roleId === UserRole.ADMIN ||
    roleId === UserRole.STAFF
  );
};

/**
 * Finds if the user has a real volunteer assignment to a group for the specified role.
 * Admins may see all system roles, but only groups where they have an actual assignment match.
 */
const findAssignedGroupForRole = (
  roleId: AppRole,
  groups: IVolunteerGroupConfigContext[],
  preferredGroupId?: string | null
): IVolunteerGroupConfigContext | null => {
  if (!groups || groups.length === 0) return null;
  const matches = groups.filter((group) => {
    if (roleId === UserRole.KID_GROUP_ADMIN) {
      if (group.groupRole === VolunteerRole.GROUP_COORDINATOR) return true;
      return group.areas?.some(
        (a) => !isAreaRegistration(a) && a.role === VolunteerRole.GROUP_COORDINATOR
      );
    }
    if (roleId === UserRole.KID_GROUP_SUPERVISOR) {
      if (group.groupRole === VolunteerRole.SUPERVISOR) return true;
      return group.areas?.some(
        (a) => !isAreaRegistration(a) && a.role === VolunteerRole.SUPERVISOR
      );
    }
    if (roleId === UserRole.KID_GROUP_USER) {
      return group.areas?.some(
        (a) => !isAreaRegistration(a) && a.role === VolunteerRole.VOLUNTEER
      );
    }
    if (roleId === UserRole.KID_REGISTER_SUPERVISOR) {
      return group.areas?.some(
        (a) => isAreaRegistration(a) && a.role === VolunteerRole.SUPERVISOR
      );
    }
    if (roleId === UserRole.KID_REGISTER_USER) {
      return group.areas?.some(
        (a) => isAreaRegistration(a) && a.role === VolunteerRole.VOLUNTEER
      );
    }
    return false;
  });

  if (matches.length === 0) return null;
  if (preferredGroupId) {
    const found = matches.find((g) => g.id === preferredGroupId);
    if (found) return found;
  }
  return matches[0];
};

const TopBar = () => {
  const { t } = useTranslation(['common']);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [profileOpen, setProfileOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);

  const { isSearchAvailable, isScrolledPastSearch, triggerFocusSearch } = useSearchScroll();
  const { startTransition } = useRoleTransition();

  const user = useAppSelector((state) => state.authSlice.user);
  const currentRole = useAppSelector((state) => state.authSlice.currentRole);
  const experiences = useAppSelector((state) => state.authSlice.experiences) || [];
  const activeExperience = useAppSelector((state) => state.authSlice.activeExperience);
  const hasMultipleSpaces = experiences.length > 1;

  const [hasOpenedProfile, setHasOpenedProfile] = useState(false);
  const [hasOpenedChangelog, setHasOpenedChangelog] = useState(false);
  const [hasOpenedSettings, setHasOpenedSettings] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [hasOpenedNotifications, setHasOpenedNotifications] = useState(false);

  const currentExperience = useMemo(() => {
    if (location.pathname.startsWith('/admin')) return UserExperienceEnum.ADMIN;
    if (location.pathname.startsWith('/kid-guardian')) return UserExperienceEnum.KID_GUARDIAN;
    return UserExperienceEnum.KID_CHURCH_STAFF;
  }, [location.pathname]);

  const { data: notificationsData } = useGetInAppNotificationsQuery(
    { experience: currentExperience },
    { skip: !user }
  );
  const unreadNotifCount = notificationsData?.unreadCount || 0;

  const handleOpenProfile = (open: boolean) => {
    if (open) setHasOpenedProfile(true);
    setProfileOpen(open);
  };

  const handleOpenChangelog = (open: boolean) => {
    if (open) setHasOpenedChangelog(true);
    setChangelogOpen(open);
  };

  const handleOpenSettings = (open: boolean) => {
    if (open) setHasOpenedSettings(true);
    setSettingsDrawerOpen(open);
  };

  const {
    isChurchVolunteer,
    campuses,
    activeCampusId,
    activeCampusName,
    activeGroupConfigId,
    activeGroupConfigName,
    activeVolunteerRole,
    isOnboardingCompleted,
    userMsRoles,
  } = useAppSelector((state) => state.volunteerContextSlice);

  const currentMasterCampus = useAppSelector((state) => state.churchCampusSlice.current);
  const currentVolunteerCampus = campuses.find((c) => c.id === activeCampusId) || campuses[0];
  const currentCampusName =
    activeCampusName ||
    currentVolunteerCampus?.name ||
    currentMasterCampus?.name ||
    '';

  const kidsModuleName = useKidsTerm('module_alias');
  const kidsRegistrationName = useKidsTerm('registration');
  const kidsClassroomsName = useKidsTerm('classrooms');
  const kidsTeacherName = useKidsTerm('teacher');
  const churchVolunteerName = useChurchTerm('volunteer');
  const churchCampusTerm = useChurchTerm('campus');
  const activeChurch = useAppSelector((state) => state.churchCampusSlice.church);

  const availableGroups = currentVolunteerCampus?.groups || [];
  const areaCoordinates = currentVolunteerCampus?.areaCoordinates || [];
  const hasAreaCoordinatorAssignment = areaCoordinates.length > 0;
  const userRoles = (user?.roles as AppRole[]) || [];
  const isSuperAdmin = userRoles.includes(UserRole.SUPER_ADMIN);
  const hasAreaCoordinatorRole = userRoles.includes(UserRole.KID_REGISTER_ADMIN);

  const hasMultipleGroups = availableGroups.length > 1;
  const hasAreaCoordinatorOption = hasAreaCoordinatorAssignment || hasAreaCoordinatorRole;

  // Check if active role originates from church vs fixed user ms role
  const isChurchRole =
    isChurchVolunteer &&
    (!currentRole || !userMsRoles.includes(currentRole));

  const isAreaCoordinatorActive = currentRole === UserRole.KID_REGISTER_ADMIN;

  const handleGroupChange = (group: IVolunteerGroupConfigContext) => {
    const primaryArea = group.areas[0];
    const primaryRole = primaryArea?.role || group.groupRole || VolunteerRole.VOLUNTEER;

    dispatch(
      setActiveGroupConfig({
        groupConfigId: group.id,
        groupConfigName: group.name,
        role: primaryRole,
      })
    );
    dispatch(setActiveVolunteerRole(primaryRole));

    const isKidRegistration = primaryArea?.scope === 'KID_REGISTRATION';

    let targetRole: AppRole;
    const isCurrentRegistrationRole =
      currentRole === UserRole.KID_REGISTER_ADMIN ||
      currentRole === UserRole.KID_REGISTER_SUPERVISOR ||
      currentRole === UserRole.KID_REGISTER_USER;

    if (isCurrentRegistrationRole) {
      targetRole = currentRole;
    } else if (primaryRole === VolunteerRole.SUPERVISOR) {
      targetRole = isKidRegistration ? UserRole.KID_REGISTER_SUPERVISOR : UserRole.KID_GROUP_SUPERVISOR;
    } else if (primaryRole === VolunteerRole.GROUP_COORDINATOR) {
      // GROUP_COORDINATOR manages a specific group, never the full area → always KID_GROUP_ADMIN
      targetRole = UserRole.KID_GROUP_ADMIN;
    } else {
      targetRole = isKidRegistration ? UserRole.KID_REGISTER_USER : UserRole.KID_GROUP_USER;
    }

    if (targetRole && isRoleEnabled(targetRole) && userRolesNavBarConfig[targetRole]) {
      dispatch(changeCurrentRole(targetRole));
    }

    const roleLabel =
      primaryRole === VolunteerRole.SUPERVISOR
        ? 'Supervisor'
        : primaryRole === VolunteerRole.GROUP_COORDINATOR
          ? 'Coordinador'
          : isKidRegistration
            ? churchVolunteerName
            : kidsTeacherName;

    const moduleName = isKidRegistration ? kidsRegistrationName : kidsModuleName;

    startTransition(
      {
        roleTitle: roleLabel,
        moduleName,
        groupName: group.name,
        themeClass: userRolesNavBarConfig[targetRole]?.themeClass,
        icon: getRoleIcon(targetRole, roleLabel, moduleName),
      },
      () => {
        if (location.pathname.includes('/my-team') && primaryRole === VolunteerRole.VOLUNTEER) {
          const fallbackUrl = userRolesNavBarConfig[targetRole]?.dashboardUrl || APP_ROUTES.kidRegistration.root;
          navigate(fallbackUrl, { replace: true });
        }
      }
    );
  };

  const handleAreaCoordinatorSelect = () => {
    const targetRole = UserRole.KID_REGISTER_ADMIN;
    dispatch(changeCurrentRole(targetRole));
    dispatch(setActiveVolunteerRole(VolunteerRole.AREA_GENERAL_COORDINATOR));
    dispatch(
      setActiveGroupConfig({
        groupConfigId: '',
        groupConfigName: '',
        role: VolunteerRole.AREA_GENERAL_COORDINATOR,
      })
    );
    startTransition(
      {
        roleTitle: 'Coordinador de Área',
        moduleName: kidsRegistrationName,
        themeClass: 'theme-KID_REGISTER_ADMIN',
        icon: Crown,
      },
      () => {
        navigate(APP_ROUTES.kidRegistration.root, { replace: true });
      }
    );
  };

  const isAdminUser =
    isSuperAdmin ||
    userRoles.includes(UserRole.ADMIN) ||
    currentRole === UserRole.SUPER_ADMIN ||
    currentRole === UserRole.ADMIN;

  // Filter out USER and inactive roles so base account or unfinished roles are never selectable in the switcher
  const operationalRoles = userRoles.filter(
    (role: AppRole) =>
      role !== UserRole.USER &&
      userRolesNavBarConfig[role] !== undefined &&
      isRoleEnabled(role)
  );

  // In addition to explicit userRoles, include roles from volunteer group assignments
  const volunteerGroupRoles = React.useMemo(() => {
    const roles: AppRole[] = [];
    currentVolunteerCampus?.groups?.forEach((group) => {
      const primaryArea = group.areas?.[0];
      const primaryRole = primaryArea?.role || group.groupRole || VolunteerRole.VOLUNTEER;
      const isGroupRegistration = primaryArea?.scope === 'KID_REGISTRATION';
      let targetRole: AppRole;
      if (primaryRole === VolunteerRole.GROUP_COORDINATOR) {
        // GROUP_COORDINATOR manages a specific group, never the full area → always KID_GROUP_ADMIN
        targetRole = UserRole.KID_GROUP_ADMIN;
      } else if (primaryRole === VolunteerRole.SUPERVISOR) {
        targetRole = isGroupRegistration ? UserRole.KID_REGISTER_SUPERVISOR : UserRole.KID_GROUP_SUPERVISOR;
      } else {
        targetRole = isGroupRegistration ? UserRole.KID_REGISTER_USER : UserRole.KID_GROUP_USER;
      }
      if (!roles.includes(targetRole) && isRoleEnabled(targetRole) && userRolesNavBarConfig[targetRole]) {
        roles.push(targetRole);
      }
    });
    if (hasAreaCoordinatorAssignment && !roles.includes(UserRole.KID_REGISTER_ADMIN) && isRoleEnabled(UserRole.KID_REGISTER_ADMIN)) {
      roles.push(UserRole.KID_REGISTER_ADMIN);
    }
    return roles;
  }, [currentVolunteerCampus, hasAreaCoordinatorAssignment]);

  const allOperationalRoleIds = React.useMemo(() => {
    const combined = [...operationalRoles];
    volunteerGroupRoles.forEach((r) => {
      if (!combined.includes(r)) combined.push(r);
    });
    return combined;
  }, [operationalRoles, volunteerGroupRoles]);

  // Super Admin and Admin can view and switch to all ENABLED system roles when not strictly in KID_CHURCH_STAFF space.
  // In KID_CHURCH_STAFF space, we isolate operational roles for kids church and registration.
  const availableRoles: ThemeRole[] = useMemo(() => {
    if (activeExperience === UserExperienceEnum.KID_CHURCH_STAFF) {
      const opRoles = allOperationalRoleIds
        .map((role: AppRole) => userRolesNavBarConfig[role]!)
        .filter(Boolean);

      if (opRoles.length > 0) return opRoles;

      return ALL_SYSTEM_ROLES_ORDER.filter(isRoleEnabled)
        .filter((r) => r !== UserRole.SUPER_ADMIN && r !== UserRole.ADMIN && r !== UserRole.STAFF)
        .map((role) => userRolesNavBarConfig[role])
        .filter(Boolean) as ThemeRole[];
    }

    if (isAdminUser) {
      return ALL_SYSTEM_ROLES_ORDER.filter(isRoleEnabled)
        .map((role) => userRolesNavBarConfig[role])
        .filter(Boolean) as ThemeRole[];
    }

    const defaultRoles = allOperationalRoleIds
      .map((role: AppRole) => userRolesNavBarConfig[role]!)
      .filter(Boolean);

    if (defaultRoles.length === 0) {
      defaultRoles.push(userRolesNavBarConfig[UserRole.USER]);
    }
    return defaultRoles;
  }, [activeExperience, isAdminUser, allOperationalRoleIds]);

  // Find the active visual role based on Redux currentRole (defaults to the first available role)
  let activeVisualRole = availableRoles[0];
  if (currentRole && availableRoles.some((r) => r.id === currentRole)) {
    activeVisualRole =
      availableRoles.find((r) => r.id === currentRole) || activeVisualRole;
  }

  /** Derives the user's initials from first and last name, fallback 'US'. */
  const userInitials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'US'
    : 'US';

  const userName = user ? capitalizeWords(`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()) : 'Usuario';
  const userEmail = user?.email ?? '';

  const handleRoleChange = (roleItem: ThemeRole) => {
    const roleId = roleItem.id;
    dispatch(changeCurrentRole(roleId));

    // 1. Determine corresponding VolunteerRole
    let newVolunteerRole: VolunteerRole | null = null;
    if (roleId === UserRole.KID_REGISTER_ADMIN) {
      newVolunteerRole = VolunteerRole.AREA_GENERAL_COORDINATOR;
    } else if (roleId === UserRole.KID_GROUP_ADMIN) {
      newVolunteerRole = VolunteerRole.GROUP_COORDINATOR;
    } else if (
      roleId === UserRole.KID_REGISTER_SUPERVISOR ||
      roleId === UserRole.KID_GROUP_SUPERVISOR
    ) {
      newVolunteerRole = VolunteerRole.SUPERVISOR;
    } else if (
      roleId === UserRole.KID_REGISTER_USER ||
      roleId === UserRole.KID_GROUP_USER
    ) {
      newVolunteerRole = VolunteerRole.VOLUNTEER;
    } else if (roleId === ChurchRole.MINISTRY_ADMIN) {
      newVolunteerRole = VolunteerRole.MINISTRY_GENERAL_COORDINATOR;
    }
    dispatch(setActiveVolunteerRole(newVolunteerRole));

    // 2. Manage group context
    const isNewRoleAdmin = isSystemAdminRole(roleId, roleItem.appTitle);
    const isNewRoleAreaCoordinator = roleId === UserRole.KID_REGISTER_ADMIN;
    let targetGroupName = '';

    if (isNewRoleAdmin) {
      // Admins do not have groups
      targetGroupName = '';
      dispatch(setActiveExperience(UserExperienceEnum.ADMIN));
      dispatch(
        setActiveGroupConfig({
          groupConfigId: '',
          groupConfigName: '',
          role: null,
        }),
      );
    } else if (isNewRoleAreaCoordinator) {
      // Area Coordinators have no single group
      targetGroupName = '';
      dispatch(setActiveExperience(UserExperienceEnum.KID_CHURCH_STAFF));
      dispatch(
        setActiveGroupConfig({
          groupConfigId: '',
          groupConfigName: '',
          role: newVolunteerRole,
        }),
      );
    } else {
      dispatch(setActiveExperience(UserExperienceEnum.KID_CHURCH_STAFF));
      // Roles that operate in a group (Supervisor, Servidor, Coordinador de Grupo)
      const assignedGroup = findAssignedGroupForRole(
        roleId,
        availableGroups,
        activeGroupConfigId,
      );

      if (assignedGroup) {
        targetGroupName = assignedGroup.name;
        const primaryRole =
          assignedGroup.areas[0]?.role || assignedGroup.groupRole || newVolunteerRole;
        dispatch(
          setActiveGroupConfig({
            groupConfigId: assignedGroup.id,
            groupConfigName: assignedGroup.name,
            role: primaryRole,
          }),
        );
      } else if (isAdminUser) {
        // Powers acquired by admin: assign to Grupo Admin context
        targetGroupName = 'Grupo Admin';
        dispatch(
          setActiveGroupConfig({
            groupConfigId: 'ADMIN_GROUP',
            groupConfigName: 'Grupo Admin',
            role: newVolunteerRole,
          }),
        );
      } else {
        targetGroupName = '';
        dispatch(
          setActiveGroupConfig({
            groupConfigId: '',
            groupConfigName: '',
            role: newVolunteerRole,
          }),
        );
      }
    }

    const resolvedRoleModuleName =
      roleItem.appTitle === 'KidRegistration'
        ? kidsRegistrationName
        : roleItem.appTitle === 'KidChurch'
        ? kidsModuleName
        : roleItem.appTitle;

    startTransition(
      {
        roleTitle: roleItem.label,
        moduleName: resolvedRoleModuleName,
        groupName: targetGroupName || activeGroupConfigName,
        themeClass: roleItem.themeClass,
        icon: getRoleIcon(roleItem.id, roleItem.label, resolvedRoleModuleName),
      },
      () => {
        navigate(roleItem.dashboardUrl, { replace: true });
      }
    );
  };

  /** Dispatches logout action and redirects to login page. */
  const handleLogout = () => {
    dispatch(logout());
    if (typeof document !== 'undefined') {
      document.body.className = 'antialiased';
    }
    navigate(APP_ROUTES.auth.login, { replace: true });
    toast.success('Se ha cerrado su sesión', {
      duration: 5000,
    });
  };

  React.useEffect(() => {
    // Immediately apply the theme of the active role (defaults to the first role that appears for the user)
    if (activeVisualRole?.themeClass) {
      document.body.className = `${activeVisualRole.themeClass} antialiased`;
    } else {
      document.body.className = 'antialiased';
    }
  }, [activeVisualRole]);

  React.useEffect(() => {
    if (availableRoles.length > 0 && availableRoles[0].id !== UserRole.USER) {
      const isCurrentValid = currentRole && availableRoles.some((r) => r.id === currentRole);
      if (!isCurrentValid || !isRoleEnabled(currentRole)) {
        dispatch(changeCurrentRole(availableRoles[0].id));
      }
    }
  }, [currentRole, availableRoles, dispatch]);

  // Synchronize and clean group context when role or campus changes
  React.useEffect(() => {
    const isCurrentAdmin = isSystemAdminRole(currentRole, activeVisualRole.appTitle);
    const isCurrentAreaCoord = currentRole === UserRole.KID_REGISTER_ADMIN;

    if (isCurrentAdmin) {
      // Admins do not have groups
      if (activeGroupConfigId || activeGroupConfigName) {
        dispatch(
          setActiveGroupConfig({
            groupConfigId: '',
            groupConfigName: '',
            role: null,
          }),
        );
      }
    } else if (isCurrentAreaCoord) {
      // Area Coordinator does not belong to an individual group
      if (activeGroupConfigId || activeGroupConfigName) {
        dispatch(
          setActiveGroupConfig({
            groupConfigId: '',
            groupConfigName: '',
            role: VolunteerRole.AREA_GENERAL_COORDINATOR,
          }),
        );
      }
    } else if (currentRole && isAdminUser) {
      const assignedGroup = findAssignedGroupForRole(
        currentRole,
        availableGroups,
        activeGroupConfigId,
      );
      if (!assignedGroup) {
        if (
          activeGroupConfigId !== 'ADMIN_GROUP' ||
          activeGroupConfigName !== 'Grupo Admin'
        ) {
          dispatch(
            setActiveGroupConfig({
              groupConfigId: 'ADMIN_GROUP',
              groupConfigName: 'Grupo Admin',
              role: activeVolunteerRole,
            }),
          );
        }
      } else if (activeGroupConfigId !== assignedGroup.id) {
        dispatch(
          setActiveGroupConfig({
            groupConfigId: assignedGroup.id,
            groupConfigName: assignedGroup.name,
            role:
              assignedGroup.areas[0]?.role ||
              assignedGroup.groupRole ||
              activeVolunteerRole,
          }),
        );
      }
    } else if (currentRole && !isAdminUser) {
      const assignedGroup = findAssignedGroupForRole(
        currentRole,
        availableGroups,
        activeGroupConfigId,
      );
      if (assignedGroup) {
        if (activeGroupConfigId !== assignedGroup.id) {
          dispatch(
            setActiveGroupConfig({
              groupConfigId: assignedGroup.id,
              groupConfigName: assignedGroup.name,
              role:
                assignedGroup.areas[0]?.role ||
                assignedGroup.groupRole ||
                activeVolunteerRole,
            }),
          );
        }
      } else if (activeGroupConfigId || activeGroupConfigName) {
        dispatch(
          setActiveGroupConfig({
            groupConfigId: '',
            groupConfigName: '',
            role: activeVolunteerRole,
          }),
        );
      }
    }
  }, [
    currentRole,
    isAdminUser,
    activeVisualRole.appTitle,
    activeGroupConfigId,
    activeGroupConfigName,
    availableGroups,
    activeVolunteerRole,
    dispatch,
  ]);

  const isAreaCoordinator = currentRole === UserRole.KID_REGISTER_ADMIN;
  const isCurrentVisualRoleAdmin = isSystemAdminRole(activeVisualRole.id, activeVisualRole.appTitle);

  const hasMultipleRoles = availableRoles.length > 1;
  const canOpenContextDropdown =
    isAdminUser ||
    hasMultipleRoles ||
    availableGroups.length > 1 ||
    hasAreaCoordinatorOption;

  const getDynamicAppTitle = (roleId: AppRole) => {
    if (
      roleId === UserRole.SUPER_ADMIN ||
      roleId === UserRole.ADMIN ||
      roleId === UserRole.STAFF
    ) {
      return 'Administración';
    }
    if (
      roleId === UserRole.KID_REGISTER_ADMIN ||
      roleId === UserRole.KID_REGISTER_SUPERVISOR ||
      roleId === UserRole.KID_REGISTER_USER
    ) {
      return kidsRegistrationName;
    }
    return kidsModuleName;
  };

  const currentAppTitle = getDynamicAppTitle(activeVisualRole.id);
  const appTitleDisplay = currentCampusName
    ? `${currentAppTitle} - ${currentCampusName}`
    : currentAppTitle;

  const getDynamicRoleLabel = (roleId: AppRole) => {
    if (roleId === UserRole.KID_GROUP_USER) {
      return kidsTeacherName;
    }
    if (roleId === UserRole.KID_REGISTER_USER) {
      return churchVolunteerName;
    }
    return activeVisualRole.label;
  };

  let roleLabelDisplay = getDynamicRoleLabel(activeVisualRole.id);
  if (activeGroupConfigName && !isAreaCoordinator && !isCurrentVisualRoleAdmin) {
    roleLabelDisplay = `${roleLabelDisplay} - ${activeGroupConfigName}`;
  } else if (!isAreaCoordinator && !isCurrentVisualRoleAdmin) {
    roleLabelDisplay = `${roleLabelDisplay} - Apoyo`;
  }

  const roleSections = useMemo(() => {
    const sections: { title: string; roles: ThemeRole[] }[] = [];
    const adminRoles = availableRoles.filter((r) => r.appTitle === 'Admin');
    const kidChurchRoles = availableRoles.filter((r) => r.appTitle === 'KidChurch');
    const kidRegistrationRoles = availableRoles.filter((r) => r.appTitle === 'KidRegistration');

    if (adminRoles.length > 0 && activeExperience !== UserExperienceEnum.KID_CHURCH_STAFF) {
      sections.push({ title: 'Administración', roles: adminRoles });
    }
    if (kidChurchRoles.length > 0) {
      sections.push({ title: `${kidsModuleName} · ${kidsClassroomsName}`, roles: kidChurchRoles });
    }
    if (kidRegistrationRoles.length > 0) {
      sections.push({ title: `${kidsRegistrationName} · Punto de Entrada`, roles: kidRegistrationRoles });
    }

    const otherRoles = availableRoles.filter(
      (r) => r.appTitle !== 'Admin' && r.appTitle !== 'KidChurch' && r.appTitle !== 'KidRegistration'
    );
    if (otherRoles.length > 0) {
      sections.push({ title: 'Roles Disponibles', roles: otherRoles });
    }

    return sections;
  }, [availableRoles, activeExperience, kidsModuleName, kidsClassroomsName, kidsRegistrationName]);

  const roleTriggerContent = (
    <div className={clsx(
      "flex items-center gap-2.5 outline-none rounded-xl py-0.5 px-1 transition-colors",
      canOpenContextDropdown ? "hover:bg-black/10 cursor-pointer" : "cursor-default"
    )}>
      <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-white p-1 shadow-xs shrink-0 self-center">
         <img src="/logo-iglekids.png" alt={kidsModuleName} className="w-full h-full object-contain drop-shadow-xs" />
      </div>
      <div className="flex flex-col justify-center text-left min-w-0">
        <h1 className="font-extrabold text-[13px] sm:text-[15px] leading-snug tracking-tight truncate max-w-[200px] sm:max-w-xs md:max-w-sm">
          {appTitleDisplay}
        </h1>
        <div className="flex items-center gap-1 text-[10px] sm:text-[11px] tracking-wide opacity-90 font-medium mt-0.5 leading-none">
          <span>Rol: {roleLabelDisplay}</span>
          {canOpenContextDropdown && <ChevronDown size={11} className="shrink-0" />}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <header className="bg-primary text-primary-foreground px-4 py-2 sm:py-2.5 flex justify-between items-center shrink-0 transition-colors duration-300 z-[200] relative shadow-none border-none outline-none">
        
        {/* Lado Izquierdo: Menú de Roles y Contexto */}
        {canOpenContextDropdown ? (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              {roleTriggerContent}
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content 
                className="bg-white text-gray-900 rounded-2xl shadow-xl border border-gray-100 p-2 sm:p-2.5 min-w-[285px] sm:min-w-[320px] max-w-[360px] max-h-[75vh] overflow-y-auto z-[250] pointer-events-auto animate-in fade-in zoom-in-95 duration-150"
                sideOffset={8}
                align="start"
              >
                {/* Header informativo del menú */}
                <div className="flex items-center justify-between px-2.5 py-1.5 mb-1.5 border-b border-gray-100">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Sparkles size={12} />
                    </div>
                    <span className="text-[10.5px] font-bold text-gray-700 uppercase tracking-wider truncate">
                      {availableGroups.length > 1 ? 'Grupos de Servicio' : 'Roles y Módulos'}
                    </span>
                  </div>
                  {currentCampusName && (
                    <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full truncate max-w-[130px] shrink-0">
                      {currentCampusName}
                    </span>
                  )}
                </div>

                {/* 1. Coordinación de Área (para servidores que no son admin pero tienen asignación de área) */}
                {!isAdminUser && hasAreaCoordinatorOption && (
                  <div className="mb-2">
                    <div className="text-[10px] font-bold text-gray-400 mb-1 px-2 uppercase tracking-wider">
                      Coordinación
                    </div>
                    <DropdownMenu.Item
                      onSelect={handleAreaCoordinatorSelect}
                      className={clsx(
                        "flex items-center justify-between p-2 rounded-xl cursor-pointer outline-none transition-all text-sm",
                        isAreaCoordinatorActive
                          ? "bg-primary/10 text-primary font-semibold shadow-2xs"
                          : "hover:bg-gray-50 text-gray-700"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className={clsx(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                          isAreaCoordinatorActive
                            ? "bg-primary text-white"
                            : "bg-indigo-50 text-indigo-700"
                        )}>
                          <Crown size={16} />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm leading-tight truncate text-gray-900">
                              Coordinación de Área
                            </span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-indigo-50 text-indigo-700">
                              Coordinador
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-400 leading-tight mt-0.5 truncate">
                            {kidsRegistrationName} · Todos los grupos
                          </span>
                        </div>
                      </div>
                      {isAreaCoordinatorActive && (
                        <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0 ml-2 shadow-2xs">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </DropdownMenu.Item>
                  </div>
                )}

                {/* 2. Grupos de Servicio (cada grupo con su rol correspondiente vinculado) */}
                {availableGroups.length > 1 && (
                  <div className="mb-2">
                    <div className="text-[10px] font-bold text-gray-400 mb-1 px-2 uppercase tracking-wider">
                      Mis Grupos de Servicio
                    </div>
                    <div className="flex flex-col gap-1">
                      {availableGroups.map((group) => {
                        const primaryArea = group.areas[0];
                        const primaryRole = primaryArea?.role || group.groupRole || VolunteerRole.VOLUNTEER;
                        const isSupervisor = primaryRole === VolunteerRole.SUPERVISOR;
                        const isCoordinator = primaryRole === VolunteerRole.GROUP_COORDINATOR;
                        const isGroupRegistration = primaryArea?.scope === 'KID_REGISTRATION';
                        const roleLabel = isSupervisor
                          ? 'Supervisor'
                          : isCoordinator
                            ? 'Coordinador'
                            : isGroupRegistration
                              ? churchVolunteerName
                              : kidsTeacherName;
                        const areaName = primaryArea?.name || (isGroupRegistration ? kidsRegistrationName : kidsModuleName);
                        const isGroupActive = !isAreaCoordinatorActive && activeGroupConfigId === group.id;

                        return (
                          <DropdownMenu.Item
                            key={group.id}
                            onSelect={() => handleGroupChange(group)}
                            className={clsx(
                              "flex items-center justify-between p-2 rounded-xl cursor-pointer outline-none transition-all text-sm",
                              isGroupActive
                                ? "bg-primary/10 text-primary font-semibold shadow-2xs"
                                : "hover:bg-gray-50 text-gray-700"
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div className={clsx(
                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                                isGroupActive
                                  ? "bg-primary text-white shadow-xs"
                                  : isSupervisor
                                    ? "bg-purple-50 text-purple-700"
                                    : isCoordinator
                                      ? "bg-indigo-50 text-indigo-700"
                                      : "bg-emerald-50 text-emerald-700"
                              )}>
                                {isSupervisor ? (
                                  <Shield size={16} />
                                ) : isCoordinator ? (
                                  <Crown size={16} />
                                ) : (
                                  <UsersIcon size={16} />
                                )}
                              </div>
                              <div className="flex flex-col min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-semibold text-sm leading-tight text-gray-900 truncate">
                                    {group.name}
                                  </span>
                                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-gray-100 text-gray-600">
                                    {roleLabel}
                                  </span>
                                </div>
                                <span className="text-[11px] text-gray-400 leading-tight mt-0.5 truncate">
                                  {areaName}
                                </span>
                              </div>
                            </div>
                            {isGroupActive && (
                              <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0 ml-2 shadow-2xs">
                                <Check size={12} strokeWidth={3} />
                              </div>
                            )}
                          </DropdownMenu.Item>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Roles del Sistema / Módulos */}
                {(availableGroups.length <= 1 || isAdminUser) && (
                  <div className="flex flex-col gap-2">
                    {roleSections.map((section, sectionIdx) => (
                      <div
                        key={section.title}
                        className={clsx(
                          (sectionIdx > 0 || availableGroups.length > 1 || (!isAdminUser && hasAreaCoordinatorOption)) &&
                            "pt-2 border-t border-gray-100"
                        )}
                      >
                        <div className="text-[10px] font-bold text-gray-400 mb-1 px-2 uppercase tracking-wider">
                          {section.title}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          {section.roles.map((role) => {
                            const isRoleActive = activeVisualRole.id === role.id;
                            const isRoleAdmin = isSystemAdminRole(role.id, role.appTitle);
                            const isRegistrationAreaCoord = role.id === UserRole.KID_REGISTER_ADMIN;
                            const isCoordinatorRole =
                              role.id === ChurchRole.MINISTRY_ADMIN ||
                              role.id === UserRole.KID_REGISTER_ADMIN ||
                              role.id === UserRole.KID_GROUP_ADMIN;
                            const isSupervisorRole =
                              role.id === UserRole.KID_REGISTER_SUPERVISOR ||
                              role.id === UserRole.KID_GROUP_SUPERVISOR;
                            const RoleIcon = role.appTitle === 'Admin'
                              ? Sliders
                              : isCoordinatorRole
                              ? Crown
                              : isSupervisorRole
                              ? Shield
                              : UsersIcon;

                            let roleTitle = role.label;
                            if (role.id === UserRole.KID_GROUP_USER) {
                              roleTitle = kidsTeacherName;
                            } else if (role.id === UserRole.KID_REGISTER_USER) {
                              roleTitle = churchVolunteerName;
                            }

                            // Determine group badge and status
                            let assignedGroupName: string | null = null;
                            let isRoleAdminAcquired = false;
                            let isApoyoBadge = false;

                            if (isRoleAdmin || isRegistrationAreaCoord) {
                              assignedGroupName = null;
                              isRoleAdminAcquired = false;
                            } else {
                              const assignedGroup = findAssignedGroupForRole(
                                role.id,
                                availableGroups,
                                isRoleActive ? activeGroupConfigId : null,
                              );

                              if (assignedGroup) {
                                assignedGroupName = assignedGroup.name;
                                isRoleAdminAcquired = false;
                              } else if (isAdminUser) {
                                assignedGroupName = 'Grupo Admin';
                                isRoleAdminAcquired = true;
                              } else {
                                // No group assigned → Apoyo (temporary support / active grants)
                                assignedGroupName = 'Apoyo';
                                isApoyoBadge = true;
                              }
                            }

                            let subtitle = '';
                            if (role.id === UserRole.SUPER_ADMIN) {
                              subtitle = 'Control global del sistema';
                            } else if (role.id === UserRole.ADMIN) {
                              subtitle = `Administración de ${churchCampusTerm.toLowerCase()} y usuarios`;
                            } else if (role.id === UserRole.KID_REGISTER_ADMIN) {
                              subtitle = `Todos los grupos de ${kidsRegistrationName.toLowerCase()}`;
                            } else if (isRoleAdminAcquired) {
                              subtitle = 'Poderes de administración';
                            } else if (assignedGroupName) {
                              // Show "Grupo #1 · Regikids" or "Apoyo · Regikids"
                              const moduleSuffix =
                                role.appTitle === 'KidRegistration'
                                  ? kidsRegistrationName
                                  : role.appTitle === 'KidChurch'
                                  ? kidsModuleName
                                  : null;
                              subtitle = moduleSuffix
                                ? `${assignedGroupName} · ${moduleSuffix}`
                                : assignedGroupName;
                            } else if (role.appTitle === 'KidChurch') {
                              subtitle = isCoordinatorRole ? `Gestión general de ${kidsClassroomsName.toLowerCase()}` : `Supervisión de ${kidsClassroomsName.toLowerCase()}`;
                            } else if (role.appTitle === 'KidRegistration') {
                              subtitle = isSupervisorRole ? 'Supervisión de estaciones' : 'Atención en estaciones';
                            } else {
                              subtitle = role.appTitle;
                            }

                            const iconColorClass = isRoleActive
                              ? "bg-primary text-white shadow-xs"
                              : role.appTitle === 'Admin'
                              ? "bg-slate-100 text-slate-700"
                              : role.appTitle === 'KidChurch'
                              ? "bg-indigo-50 text-indigo-700"
                              : "bg-emerald-50 text-emerald-700";

                            return (
                              <DropdownMenu.Item
                                key={role.id}
                                onSelect={() => handleRoleChange(role)}
                                className={clsx(
                                  "flex items-center justify-between p-2 rounded-xl cursor-pointer outline-none transition-all text-sm",
                                  isRoleActive
                                    ? "bg-primary/10 text-primary font-semibold shadow-2xs"
                                    : "hover:bg-gray-50 text-gray-700"
                                )}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <div className={clsx(
                                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                                    iconColorClass
                                  )}>
                                    <RoleIcon size={16} />
                                  </div>
                                  <div className="flex flex-col min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={clsx(
                                        "text-sm leading-tight truncate",
                                        isRoleActive ? "font-bold text-primary" : "font-semibold text-gray-900"
                                      )}>
                                        {roleTitle}
                                      </span>
                                      {assignedGroupName && (
                                        <span
                                          className={clsx(
                                            "text-[10px] font-semibold px-1.5 py-0.2 rounded-md shrink-0 border",
                                            isRoleActive
                                              ? "bg-white/80 text-primary border-primary/20 shadow-2xs"
                                              : isApoyoBadge
                                              ? "bg-amber-50 text-amber-700 border-amber-200/60"
                                              : isRoleAdminAcquired
                                              ? "bg-amber-50 text-amber-800 border-amber-200/60"
                                              : role.appTitle === 'KidChurch'
                                              ? "bg-purple-50 text-purple-700 border-purple-200/60"
                                              : "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                                          )}
                                        >
                                          {assignedGroupName}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[11px] text-gray-400 leading-tight mt-0.5 truncate">
                                      {subtitle}
                                    </span>
                                  </div>
                                </div>
                                {isRoleActive && (
                                  <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0 ml-2 shadow-2xs">
                                    <Check size={12} strokeWidth={3} />
                                  </div>
                                )}
                              </DropdownMenu.Item>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        ) : (
          roleTriggerContent
        )}

      {/* Lado Derecho: Iconos y Avatar de Usuario */}
      <div className="flex items-center gap-2">
        {/* Botón de Búsqueda dinámico (estilo Telegram al hacer scroll) */}
        {isSearchAvailable && (
          <button
            type="button"
            onClick={triggerFocusSearch}
            title={t('navigation.search')}
            aria-label={t('navigation.search')}
            className={clsx(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 outline-none active:scale-90",
              isScrolledPastSearch
                ? "opacity-100 scale-100 bg-black/15 hover:bg-black/25 text-white cursor-pointer"
                : "opacity-0 scale-75 pointer-events-none w-0 -mr-2 overflow-hidden"
            )}
          >
            <Search size={18} />
          </button>
        )}

        {/* Botón de Notificaciones */}
        <button
          type="button"
          onClick={() => {
            setHasOpenedNotifications(true);
            setNotificationsOpen(true);
          }}
          title="Notificaciones"
          aria-label="Notificaciones"
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 outline-none active:scale-90 bg-black/15 hover:bg-black/25 text-white cursor-pointer relative"
        >
          <Bell size={18} />
          {unreadNotifCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center animate-pulse shadow-xs">
              {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
            </span>
          )}
        </button>

        {/* Menú de Usuario */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger className="outline-none rounded-full ring-2 ring-transparent hover:ring-white/30 transition-all relative active:scale-95">
            <div className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full bg-black/20 text-[11px] sm:text-xs flex items-center justify-center font-bold shadow-inner overflow-hidden">
              {user?.photoUrl ? (
                <img src={user.photoUrl} alt={userName} className="w-full h-full object-cover" />
              ) : (
                userInitials
              )}
            </div>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content 
              className="bg-surface text-text-main rounded-xl shadow-lg border border-gray-100 p-2 min-w-[180px] z-[250] pointer-events-auto animate-in fade-in zoom-in-95 duration-200"
              sideOffset={8}
              align="end"
            >
              <div className="px-3 py-2 border-b border-gray-100 mb-1 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold overflow-hidden shrink-0">
                  {user?.photoUrl ? (
                    <img src={user.photoUrl} alt={userName} className="w-full h-full object-cover" />
                  ) : (
                    userInitials
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold text-sm truncate">{userName}</p>
                  {(userEmail || user?.phone) && (
                    <p className="text-xs text-text-muted truncate">{userEmail || user?.phone}</p>
                  )}
                </div>
              </div>
              
              <DropdownMenu.Item 
                onSelect={() => handleOpenProfile(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer outline-none hover:bg-gray-100 transition-colors text-sm"
              >
                <User size={16} className="text-text-muted" />
                {t('navigation.profile')}
              </DropdownMenu.Item>

              {hasMultipleSpaces && (
                <DropdownMenu.Item 
                  onSelect={() => navigate(APP_ROUTES.hub)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer outline-none hover:bg-gray-100 text-gray-700 transition-colors text-sm"
                >
                  <LayoutGrid size={16} className="text-gray-500" />
                  <span>Cambiar de espacio</span>
                </DropdownMenu.Item>
              )}
              
              <DropdownMenu.Item 
                onSelect={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer outline-none hover:bg-red-50 text-red-600 transition-colors text-sm mt-1 font-medium"
              >
                <LogOut size={16} />
                <span>{t('navigation.logout')}</span>
              </DropdownMenu.Item>

              <div className="mt-2 pt-2 border-t border-gray-100 text-center px-2">
                <button
                  type="button"
                  onClick={() => handleOpenChangelog(true)}
                  className="w-full text-[10px] text-gray-400 hover:text-gray-600 transition-colors cursor-pointer text-center leading-tight py-0.5 group"
                >
                  <span className="block truncate font-medium">
                    {activeChurch?.name || kidsModuleName}
                  </span>
                  <span className="text-gray-400 group-hover:text-gray-600 mt-0.5 inline-block">
                    v{APP_VERSION} · <span className="underline decoration-dotted underline-offset-2">Ver novedades</span>
                  </span>
                </button>
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {/* User Profile Modal */}
      {hasOpenedProfile && (
        <Suspense fallback={null}>
          <UserProfileModal open={profileOpen} onOpenChange={handleOpenProfile} />
        </Suspense>
      )}

      {/* Changelog Drawer */}
      {hasOpenedChangelog && (
        <Suspense fallback={null}>
          <ChangelogDrawer open={changelogOpen} onOpenChange={handleOpenChangelog} />
        </Suspense>
      )}

      {/* Drawer para cambiar de sede o grupo manualmente */}
      {hasOpenedSettings && (
        <Suspense fallback={null}>
          <SettingsDrawer
            open={settingsDrawerOpen}
            onOpenChange={handleOpenSettings}
          />
        </Suspense>
      )}

      {/* Notifications Drawer */}
      {hasOpenedNotifications && (
        <Suspense fallback={null}>
          <NotificationsDrawer
            open={notificationsOpen}
            onOpenChange={setNotificationsOpen}
            experience={currentExperience}
          />
        </Suspense>
      )}

    </header>
    </>
  );
};

export default TopBar;
