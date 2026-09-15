import React, { useState } from 'react';
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
} from 'lucide-react';
import clsx from 'clsx';
import { APP_ROUTES } from '@/config/routes';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { logout, changeCurrentRole } from '@/libs/state/redux/slices/user/auth.slice';
import {
  setActiveGroupConfig,
  setActiveVolunteerRole,
} from '@/libs/state/redux/slices/church/volunteerContext.slice';
import { VolunteerRole, IVolunteerGroupConfigContext } from '@/libs/models/Volunteer';
import { useSearchScroll } from '@/libs/context/SearchScrollContext';
import UserProfileModal from '@/components/modal/UserProfileModal';
import ChangelogDrawer from '@/components/modal/ChangelogDrawer';
import SettingsDrawer from '@/components/modal/SettingsDrawer';
import { APP_VERSION } from '@/constants/version';
import { ALL_SYSTEM_ROLES_ORDER, AppRole, ChurchRole, UserRole } from '@/libs/utils/auth';
import { isRoleEnabled } from '@/config/roles';
import { toast } from 'sonner';
import { capitalizeWords } from '@/libs/utils/text';

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
    color: '#334155',
    dashboardUrl: APP_ROUTES.admin.root,
  },
  [UserRole.ADMIN]: {
    id: UserRole.ADMIN,
    appTitle: 'Admin',
    label: 'Administrador',
    themeClass: 'theme-ADMIN',
    color: '#475569',
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
    appTitle: 'Iglekids',
    label: 'Admin General',
    themeClass: 'theme-MINISTRY_ADMIN',
    color: '#d97706',
    dashboardUrl: APP_ROUTES.kidChurch.root,
  },
  [UserRole.KID_GROUP_ADMIN]: {
    id: UserRole.KID_GROUP_ADMIN,
    appTitle: 'Iglekids',
    label: 'Coordinador',
    themeClass: 'theme-KID_GROUP_ADMIN',
    color: '#db2777',
    dashboardUrl: APP_ROUTES.kidChurch.root,
  },
  [UserRole.KID_GROUP_SUPERVISOR]: {
    id: UserRole.KID_GROUP_SUPERVISOR,
    appTitle: 'Iglekids',
    label: 'Supervisor',
    themeClass: 'theme-KID_GROUP_SUPERVISOR',
    color: '#9333ea',
    dashboardUrl: APP_ROUTES.kidChurch.root,
  },
  [UserRole.KID_GROUP_USER]: {
    id: UserRole.KID_GROUP_USER,
    appTitle: 'Iglekids',
    label: 'Servidor',
    themeClass: 'theme-KID_GROUP_USER',
    color: '#fbbf24',
    dashboardUrl: APP_ROUTES.kidChurch.root,
  },
  [UserRole.KID_REGISTER_ADMIN]: {
    id: UserRole.KID_REGISTER_ADMIN,
    appTitle: 'Regikids',
    label: 'Coordinador',
    themeClass: 'theme-KID_REGISTER_ADMIN',
    color: '#166534',
    dashboardUrl: APP_ROUTES.kidRegistration.root,
  },
  [UserRole.KID_REGISTER_SUPERVISOR]: {
    id: UserRole.KID_REGISTER_SUPERVISOR,
    appTitle: 'Regikids',
    label: 'Supervisor',
    themeClass: 'theme-KID_REGISTER_SUPERVISOR',
    color: '#15803d',
    dashboardUrl: APP_ROUTES.kidRegistration.root,
  },
  [UserRole.KID_REGISTER_USER]: {
    id: UserRole.KID_REGISTER_USER,
    appTitle: 'Regikids',
    label: 'Servidor',
    themeClass: 'theme-KID_REGISTER_USER',
    color: '#16a34a',
    dashboardUrl: APP_ROUTES.kidRegistration.root,
  },
  [UserRole.USER]: {
    id: UserRole.USER,
    appTitle: 'Iglekids',
    label: 'Usuario',
    themeClass: 'theme-USER',
    color: '#003963',
    dashboardUrl: APP_ROUTES.kidRegistration.root,
  },
};

const TopBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [profileOpen, setProfileOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const { isSearchAvailable, isScrolledPastSearch, triggerFocusSearch } = useSearchScroll();

  const user = useAppSelector((state) => state.authSlice.user);
  const currentRole = useAppSelector((state) => state.authSlice.currentRole);

  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);

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

  const isAreaCoordinatorActive =
    currentRole === UserRole.KID_REGISTER_ADMIN ||
    activeVolunteerRole === VolunteerRole.AREA_GENERAL_COORDINATOR;

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

    const isRegikids =
      primaryArea?.scope === 'KID_REGISTRATION' ||
      (primaryArea.name || '').toLowerCase().includes('regi');

    let targetRole: AppRole;
    const isCurrentRegistrationRole =
      currentRole === UserRole.KID_REGISTER_ADMIN ||
      currentRole === UserRole.KID_REGISTER_SUPERVISOR ||
      currentRole === UserRole.KID_REGISTER_USER;

    if (isCurrentRegistrationRole) {
      targetRole = currentRole;
    } else if (primaryRole === VolunteerRole.SUPERVISOR) {
      targetRole = isRegikids ? UserRole.KID_REGISTER_SUPERVISOR : UserRole.KID_GROUP_SUPERVISOR;
    } else if (primaryRole === VolunteerRole.GROUP_COORDINATOR) {
      targetRole = isRegikids ? UserRole.KID_REGISTER_ADMIN : UserRole.KID_GROUP_ADMIN;
    } else {
      targetRole = isRegikids ? UserRole.KID_REGISTER_USER : UserRole.KID_GROUP_USER;
    }

    if (targetRole && isRoleEnabled(targetRole) && userRolesNavBarConfig[targetRole]) {
      dispatch(changeCurrentRole(targetRole));
    }

    if (location.pathname.includes('/my-team') && primaryRole === VolunteerRole.VOLUNTEER) {
      const fallbackUrl = userRolesNavBarConfig[targetRole]?.dashboardUrl || APP_ROUTES.kidRegistration.root;
      navigate(fallbackUrl, { replace: true });
    }

    const roleLabel =
      primaryRole === VolunteerRole.SUPERVISOR
        ? 'Supervisor'
        : primaryRole === VolunteerRole.GROUP_COORDINATOR
          ? 'Coordinador'
          : 'Servidor';

    toast.success(`Cambiado a ${group.name} (${roleLabel})`);
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
    navigate(APP_ROUTES.kidRegistration.root, { replace: true });
    toast.success('Cambiado a Coordinación de Área (Regikids)');
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

  // Super Admin and Admin can view and switch to all ENABLED system roles.
  // Other users only see their active operational roles.
  const availableRoles: ThemeRole[] = isAdminUser
    ? (ALL_SYSTEM_ROLES_ORDER.filter(isRoleEnabled)
        .map((role) => userRolesNavBarConfig[role])
        .filter(Boolean) as ThemeRole[])
    : operationalRoles.map((role: AppRole) => userRolesNavBarConfig[role]!);

  // Safe fallback if user has no operational roles (only regular USER or unmapped)
  if (availableRoles.length === 0) {
    availableRoles.push(userRolesNavBarConfig[UserRole.USER]);
  }

  // Find the active visual role based on Redux currentRole
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
    const isNewRoleAreaCoordinator = roleId === UserRole.KID_REGISTER_ADMIN;

    if (isNewRoleAreaCoordinator) {
      // Area Coordinators have no single group
      dispatch(
        setActiveGroupConfig({
          groupConfigId: '',
          groupConfigName: '',
          role: newVolunteerRole,
        }),
      );
    } else {
      // Roles that operate in a group (Supervisor, Servidor, Coordinador de Grupo)
      // If currently without a group, auto-assign default group from current campus
      if (!activeGroupConfigId && availableGroups.length > 0) {
        const defaultGroup = availableGroups[0];
        const primaryRole =
          defaultGroup.areas[0]?.role || defaultGroup.groupRole || newVolunteerRole;
        dispatch(
          setActiveGroupConfig({
            groupConfigId: defaultGroup.id,
            groupConfigName: defaultGroup.name,
            role: primaryRole,
          }),
        );
      }
    }

    navigate(roleItem.dashboardUrl, { replace: true });
    toast.success(`Cambiado a ${roleItem.label} (${roleItem.appTitle})`);
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
    // If user is awaiting onboarding (selecting campus/group), maintain the default brand blue theme
    const isAwaitingOnboarding =
      isChurchRole &&
      campuses.length > 0 &&
      (!isOnboardingCompleted || !activeCampusId);

    if (isAwaitingOnboarding) {
      document.body.className = 'antialiased';
    } else {
      document.body.className = `${activeVisualRole.themeClass} antialiased`;
    }
  }, [activeVisualRole, isChurchRole, campuses.length, isOnboardingCompleted, activeCampusId]);

  React.useEffect(() => {
    if (currentRole && !isRoleEnabled(currentRole) && availableRoles.length > 0) {
      dispatch(changeCurrentRole(availableRoles[0].id));
      navigate(availableRoles[0].dashboardUrl, { replace: true });
    }
  }, [currentRole, availableRoles, dispatch, navigate]);

  const isAreaCoordinator =
    currentRole === UserRole.KID_REGISTER_ADMIN ||
    activeVolunteerRole === VolunteerRole.AREA_GENERAL_COORDINATOR;

  const hasMultipleRoles = availableRoles.length > 1;
  const canOpenContextDropdown =
    isAdminUser ||
    hasMultipleRoles ||
    availableGroups.length > 1 ||
    hasAreaCoordinatorOption;

  const appTitleDisplay = currentCampusName
    ? `${activeVisualRole.appTitle} - ${currentCampusName}`
    : activeVisualRole.appTitle;

  let roleLabelDisplay = isAreaCoordinator ? 'Coordinador' : activeVisualRole.label;
  if (activeGroupConfigName && !isAreaCoordinator) {
    roleLabelDisplay = `${activeVisualRole.label} - ${activeGroupConfigName}`;
  }

  const roleTriggerContent = (
    <div className={clsx(
      "flex items-center gap-2.5 outline-none rounded-xl py-0.5 px-1 transition-colors",
      canOpenContextDropdown ? "hover:bg-black/10 cursor-pointer" : "cursor-default"
    )}>
      <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-white p-1 shadow-xs shrink-0 self-center">
         <img src="/logo-iglekids.png" alt="Iglekids" className="w-full h-full object-contain drop-shadow-xs" />
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
                className="bg-white text-gray-900 rounded-3xl shadow-2xl border border-gray-100/90 p-2 sm:p-2.5 min-w-[285px] sm:min-w-[320px] max-h-[75vh] overflow-y-auto z-[250] pointer-events-auto animate-in fade-in zoom-in-95 duration-150"
                sideOffset={8}
                align="start"
              >
                {/* Header informativo del menú */}
                <div className="flex items-center justify-between px-2 pt-1 pb-2 mb-1.5 border-b border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                      <Sparkles size={12} />
                    </div>
                    <span className="text-[10.5px] font-bold text-gray-700 uppercase tracking-wider">
                      {availableGroups.length > 1 ? 'Grupos de Servicio' : 'Cambiar Rol'}
                    </span>
                  </div>
                  {currentCampusName && (
                    <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full truncate max-w-[130px]">
                      {currentCampusName}
                    </span>
                  )}
                </div>

                {/* 1. Coordinación de Área (si aplica) */}
                {hasAreaCoordinatorOption && (
                  <div className="mb-2">
                    <DropdownMenu.Item
                      onSelect={handleAreaCoordinatorSelect}
                      className={clsx(
                        "flex items-center justify-between p-2 sm:p-2.5 rounded-2xl cursor-pointer outline-none transition-all text-sm border",
                        isAreaCoordinatorActive
                          ? "bg-primary/10 border-primary/30 text-primary font-bold shadow-2xs"
                          : "bg-white hover:bg-gray-50 border-transparent hover:border-gray-200/80 text-gray-800"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className={clsx(
                          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-transform",
                          isAreaCoordinatorActive
                            ? "bg-primary text-white border-primary shadow-xs"
                            : "bg-indigo-50 text-indigo-700 border-indigo-200/80"
                        )}>
                          <Crown size={16} />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-sm leading-tight truncate">
                              Coordinación de Área
                            </span>
                            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                              Coordinador
                            </span>
                          </div>
                          <span className="font-medium text-[11px] text-gray-400 leading-tight mt-0.5 truncate">
                            Regikids · Todos los grupos
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
                  <div className="mb-1">
                    <div className="flex flex-col gap-1.5">
                      {availableGroups.map((group) => {
                        const primaryArea = group.areas[0];
                        const primaryRole = primaryArea?.role || group.groupRole || VolunteerRole.VOLUNTEER;
                        const isSupervisor = primaryRole === VolunteerRole.SUPERVISOR;
                        const isCoordinator = primaryRole === VolunteerRole.GROUP_COORDINATOR;
                        const roleLabel = isSupervisor
                          ? 'Supervisor'
                          : isCoordinator
                            ? 'Coordinador'
                            : 'Servidor';
                        const areaName = primaryArea?.name || 'Regikids';
                        const isGroupActive = !isAreaCoordinatorActive && activeGroupConfigId === group.id;

                        return (
                          <DropdownMenu.Item
                            key={group.id}
                            onSelect={() => handleGroupChange(group)}
                            className={clsx(
                              "flex items-center justify-between p-2 sm:p-2.5 rounded-2xl cursor-pointer outline-none transition-all text-sm border",
                              isGroupActive
                                ? "bg-primary/10 border-primary/30 text-primary font-bold shadow-2xs"
                                : "bg-white hover:bg-gray-50 border-transparent hover:border-gray-200/80 text-gray-800"
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div className={clsx(
                                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-transform",
                                isGroupActive
                                  ? "bg-primary text-white border-primary shadow-xs"
                                  : isSupervisor
                                    ? "bg-purple-50 text-purple-700 border-purple-200/80"
                                    : isCoordinator
                                      ? "bg-pink-50 text-pink-700 border-pink-200/80"
                                      : "bg-emerald-50 text-emerald-700 border-emerald-200/80"
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
                                  <span className="font-bold text-sm leading-tight text-gray-900 truncate">
                                    {group.name}
                                  </span>
                                  <span
                                    className={clsx(
                                      "text-[10px] font-extrabold px-1.5 py-0.2 rounded-md border",
                                      isSupervisor
                                        ? "bg-purple-100 text-purple-700 border-purple-200/80"
                                        : isCoordinator
                                          ? "bg-pink-100 text-pink-700 border-pink-200/80"
                                          : "bg-emerald-100 text-emerald-800 border-emerald-200/80"
                                    )}
                                  >
                                    {roleLabel}
                                  </span>
                                </div>
                                <span className="font-medium text-[11px] text-gray-400 leading-tight mt-0.5 truncate">
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

                {/* 3. Funciones del Sistema / Admin o fallback sin grupos */}
                {(availableGroups.length <= 1 || isAdminUser) && (
                  <div className={clsx(availableGroups.length > 1 && "pt-2 mt-1.5 border-t border-gray-100")}>
                    {availableGroups.length > 1 && (
                      <div className="text-[10px] font-bold text-gray-400 mb-1 px-2 uppercase tracking-wider">
                        {isAdminUser ? 'Funciones de Administrador' : 'Cambiar Rol'}
                      </div>
                    )}
                    <div className="flex flex-col gap-0.5">
                      {availableRoles.map((role) => {
                        const isRoleActive = currentRole === role.id;
                        const isRegikidsRole = role.appTitle === 'Regikids';
                        const isCoordinatorRole =
                          role.label === 'Coordinador' ||
                          role.id === ChurchRole.MINISTRY_ADMIN;
                        const isSupervisorRole = role.label === 'Supervisor';
                        const RoleIcon = isCoordinatorRole
                          ? Crown
                          : isSupervisorRole
                          ? Shield
                          : UsersIcon;
                        const roleGroup = availableGroups.find((group) => {
                          const primaryArea = group.areas[0];
                          const primaryRole =
                            primaryArea?.role || group.groupRole || VolunteerRole.VOLUNTEER;
                          const isGroupRegikids =
                            primaryArea?.scope === 'KID_REGISTRATION' ||
                            (primaryArea?.name || '').toLowerCase().includes('regi');
                          const groupRoleId =
                            primaryRole === VolunteerRole.GROUP_COORDINATOR
                              ? isGroupRegikids
                                ? UserRole.KID_REGISTER_ADMIN
                                : UserRole.KID_GROUP_ADMIN
                              : primaryRole === VolunteerRole.SUPERVISOR
                              ? isGroupRegikids
                                ? UserRole.KID_REGISTER_SUPERVISOR
                                : UserRole.KID_GROUP_SUPERVISOR
                              : isGroupRegikids
                              ? UserRole.KID_REGISTER_USER
                              : UserRole.KID_GROUP_USER;
                          return groupRoleId === role.id;
                        });
                        const roleContextLabel = roleGroup?.name
                          || (role.id === UserRole.KID_REGISTER_ADMIN
                            ? 'Todos los grupos'
                            : activeGroupConfigName || 'Asignación provisional');
                        return (
                          <DropdownMenu.Item
                            key={role.id}
                            onSelect={() => handleRoleChange(role)}
                            className={clsx(
                              "flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer outline-none transition-all text-sm border",
                              isRoleActive
                                ? isRegikidsRole
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-bold shadow-2xs ring-1 ring-emerald-100"
                                  : "bg-pink-50 border-pink-200 text-pink-800 font-bold shadow-2xs ring-1 ring-pink-100"
                                : isRegikidsRole
                                  ? "border-gray-100 text-gray-700 hover:bg-emerald-50/70 hover:border-emerald-200"
                                  : "border-gray-100 text-gray-700 hover:bg-pink-50/70 hover:border-pink-200"
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={clsx(
                                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                  isRegikidsRole
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-pink-100 text-pink-700",
                                )}
                              >
                                <RoleIcon size={16} />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span
                                  className={clsx(
                                    "text-[10px] font-extrabold uppercase tracking-wide leading-none mb-1",
                                    isRegikidsRole ? "text-emerald-600" : "text-pink-600",
                                  )}
                                >
                                  {role.appTitle} · {role.label}
                                </span>
                                <span className="text-sm font-bold leading-tight truncate text-gray-800">
                                  {roleContextLabel}
                                </span>
                              </div>
                            </div>
                            {isRoleActive && (
                              <Check size={16} className="text-primary shrink-0 ml-2" />
                            )}
                          </DropdownMenu.Item>
                        );
                      })}
                    </div>
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
            title="Buscar"
            aria-label="Buscar"
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
                  {userEmail && <p className="text-xs text-text-muted truncate">{userEmail}</p>}
                </div>
              </div>
              
              <DropdownMenu.Item 
                onSelect={() => setProfileOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer outline-none hover:bg-gray-100 transition-colors text-sm"
              >
                <User size={16} className="text-text-muted" />
                Mi Perfil
              </DropdownMenu.Item>

              <DropdownMenu.Item 
                onSelect={() => setChangelogOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer outline-none hover:bg-gray-100 transition-colors text-sm"
              >
                <Sparkles size={16} className="text-amber-500" />
                Novedades e Historial
              </DropdownMenu.Item>
              
              <DropdownMenu.Item 
                onSelect={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer outline-none hover:bg-red-50 text-red-600 transition-colors text-sm mt-1"
              >
                <LogOut size={16} />
                Cerrar Sesión
              </DropdownMenu.Item>

              <div className="mt-2 pt-2 border-t border-gray-100 text-center">
                <button
                  type="button"
                  onClick={() => setChangelogOpen(true)}
                  className="text-[10px] font-semibold text-gray-400 hover:text-primary transition-colors cursor-pointer"
                >
                  Iglekids v{APP_VERSION}
                </button>
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {/* User Profile Modal */}
      <UserProfileModal open={profileOpen} onOpenChange={setProfileOpen} />

      {/* Changelog Drawer */}
      <ChangelogDrawer open={changelogOpen} onOpenChange={setChangelogOpen} />

      {/* Drawer para cambiar de sede o grupo manualmente */}
      <SettingsDrawer
        open={settingsDrawerOpen}
        onOpenChange={(v) => {
          setSettingsDrawerOpen(v);
        }}
      />

    </header>
    </>
  );
};

export default TopBar;
