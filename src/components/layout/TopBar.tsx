import React, { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { User, LogOut, Settings, ChevronDown, ChevronRight, Check, Search, Sparkles, Building2, Users as UsersIcon } from 'lucide-react';
import clsx from 'clsx';
import { APP_ROUTES } from '@/config/routes';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { logout, changeCurrentRole } from '@/libs/state/redux/slices/user/auth.slice';
import { setActiveGroupConfig } from '@/libs/state/redux/slices/church/volunteerContext.slice';
import { IVolunteerGroupConfigContext } from '@/libs/models/Volunteer';
import { useSearchScroll } from '@/libs/context/SearchScrollContext';
import UserProfileModal from '@/components/modal/UserProfileModal';
import ChangelogDrawer from '@/components/modal/ChangelogDrawer';
import ServiceOnboardingModal from '@/components/modal/ServiceOnboardingModal';
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
  const dispatch = useAppDispatch();
  const [profileOpen, setProfileOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const { isSearchAvailable, isScrolledPastSearch, triggerFocusSearch } = useSearchScroll();

  const user = useAppSelector((state) => state.authSlice.user);
  const currentRole = useAppSelector((state) => state.authSlice.currentRole);

  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false);

  const {
    isChurchVolunteer,
    campuses,
    activeCampusId,
    activeCampusName,
    activeGroupConfigId,
    activeGroupConfigName,
    isOnboardingCompleted,
    userMsRoles,
  } = useAppSelector((state) => state.volunteerContextSlice);

  const currentMasterCampus = useAppSelector((state) => state.churchCampusSlice.current);
  const currentVolunteerCampus = campuses.find((c) => c.id === activeCampusId);
  const currentCampusName =
    activeCampusName ||
    currentVolunteerCampus?.name ||
    currentMasterCampus?.name ||
    '';

  const availableGroups = currentVolunteerCampus?.groups || [];
  const hasMultipleGroups = availableGroups.length > 1;
  const hasMultipleCampuses = campuses.length > 1;

  // Check if active role originates from church vs fixed user ms role
  const isChurchRole =
    isChurchVolunteer &&
    (!currentRole || !userMsRoles.includes(currentRole));

  const handleGroupChange = (group: IVolunteerGroupConfigContext) => {
    const primaryRole = group.areas[0]?.role || group.groupRole || null;
    dispatch(
      setActiveGroupConfig({
        groupConfigId: group.id,
        groupConfigName: group.name,
        role: primaryRole,
      })
    );
    if (group.areas[0]?.permissions?.[0]) {
      const targetRole = group.areas[0].permissions[0] as AppRole;
      if (isRoleEnabled(targetRole) && userRolesNavBarConfig[targetRole]) {
        dispatch(changeCurrentRole(targetRole));
      }
    }
    toast.success(`Cambiado a ${group.name}`);
  };

  const userRoles = (user?.roles as AppRole[]) || [];
  const isSuperAdmin = userRoles.includes(UserRole.SUPER_ADMIN);

  // Filter out USER and inactive roles so base account or unfinished roles are never selectable in the switcher
  const operationalRoles = userRoles.filter(
    (role: AppRole) =>
      role !== UserRole.USER &&
      userRolesNavBarConfig[role] !== undefined &&
      isRoleEnabled(role)
  );

  // Super Admin can view and switch to all ENABLED system roles.
  // Other users only see their active operational roles.
  const availableRoles: ThemeRole[] = isSuperAdmin
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
    dispatch(changeCurrentRole(roleItem.id));
    navigate(roleItem.dashboardUrl, { replace: true });
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

  const hasMultipleRoles = availableRoles.length > 1;
  const canOpenContextDropdown = hasMultipleRoles || hasMultipleGroups || hasMultipleCampuses;

  const appTitleDisplay = currentCampusName
    ? `${activeVisualRole.appTitle} - ${currentCampusName}`
    : activeVisualRole.appTitle;

  let roleLabelDisplay = activeVisualRole.label;
  if (activeGroupConfigName) {
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
                className="bg-surface text-text-main rounded-2xl shadow-xl border border-gray-100 p-2.5 min-w-[270px] sm:min-w-[300px] max-h-[75vh] overflow-y-auto z-[250] pointer-events-auto animate-in fade-in duration-150"
                sideOffset={8}
                align="start"
              >
                {hasMultipleRoles && (
                  <>
                    <div className="text-[10px] font-bold text-text-muted mb-2 px-2 pt-1 uppercase tracking-wider">Cambiar Rol</div>
                    {availableRoles.map(role => (
                      <DropdownMenu.Item
                        key={role.id}
                        onSelect={() => handleRoleChange(role)}
                        className={clsx(
                          "flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer outline-none transition-colors text-sm",
                          activeVisualRole.id === role.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-gray-100"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs ring-1 ring-black/10"
                            style={{ backgroundColor: role.color }}
                          />
                          <div className="flex flex-col">
                            <span className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">{role.appTitle}</span>
                            <span className="font-semibold text-gray-800 text-sm leading-tight">{role.label}</span>
                          </div>
                        </div>
                        {activeVisualRole.id === role.id && <Check size={16} className="text-primary shrink-0 ml-2" />}
                      </DropdownMenu.Item>
                    ))}
                  </>
                )}

                {hasMultipleGroups && (
                  <>
                    <div className="text-[10px] font-bold text-text-muted mb-1.5 px-2 pt-2.5 border-t border-gray-100 uppercase tracking-wider">
                      Cambiar Grupo
                    </div>
                    {availableGroups.map((group) => {
                      const isGroupActive = activeGroupConfigId === group.id;
                      return (
                        <DropdownMenu.Item
                          key={group.id}
                          onSelect={() => handleGroupChange(group)}
                          className={clsx(
                            "flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer outline-none transition-colors text-sm",
                            isGroupActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-gray-100"
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <UsersIcon size={15} className={isGroupActive ? "text-primary" : "text-gray-400"} />
                            <span className="font-semibold text-gray-800 text-sm">{group.name}</span>
                          </div>
                          {isGroupActive && <Check size={16} className="text-primary shrink-0 ml-2" />}
                        </DropdownMenu.Item>
                      );
                    })}
                  </>
                )}

                {hasMultipleCampuses && (
                  <div className="pt-2.5 mt-2.5 border-t border-gray-100">
                    <div className="text-[10px] font-bold text-text-muted mb-1.5 px-2 uppercase tracking-wider">
                      Sede de servicio
                    </div>
                    <DropdownMenu.Item
                      onSelect={() => setOnboardingModalOpen(true)}
                      className="flex items-center justify-between p-2.5 rounded-xl cursor-pointer outline-none transition-all bg-gray-50/80 hover:bg-primary/5 hover:border-primary/20 border border-gray-100 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Building2 size={16} />
                        </div>
                        <div className="flex flex-col min-w-0 pr-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide leading-tight">
                            Sede actual
                          </span>
                          <span className="font-bold text-gray-900 text-xs truncate">
                            {activeCampusName || 'Sede'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-bold text-primary bg-white group-hover:bg-primary group-hover:text-white px-2.5 py-1 rounded-lg transition-all shrink-0 ml-1 border border-gray-200/70 group-hover:border-transparent shadow-2xs">
                        <span>Cambiar</span>
                        <ChevronRight size={13} />
                      </div>
                    </DropdownMenu.Item>
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

      {/* Modal para cambiar de sede o grupo manualmente */}
      <ServiceOnboardingModal
        forceOpen={onboardingModalOpen}
        onClose={() => setOnboardingModalOpen(false)}
      />
    </header>
    </>
  );
};

export default TopBar;
