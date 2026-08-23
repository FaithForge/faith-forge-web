import React, { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { User, LogOut, Settings, ChevronDown, Check } from 'lucide-react';
import clsx from 'clsx';
import { APP_ROUTES } from '@/config/routes';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { logout, changeCurrentRole } from '@/libs/state/redux/slices/user/auth.slice';
import SettingsDrawer from '@/components/modal/SettingsDrawer';
import UserProfileModal from '@/components/modal/UserProfileModal';
import { UserRole } from '@/libs/utils/auth';
import { toast } from 'sonner';
import { capitalizeWords } from '@/libs/utils/text';

export type ThemeRole = {
  id: UserRole;
  appTitle: string;
  label: string;
  themeClass: string;
  dashboardUrl: string;
};

export const userRolesNavBarConfig: Partial<Record<UserRole, ThemeRole>> = {
  SUPER_ADMIN: { id: UserRole.SUPER_ADMIN, appTitle: 'Admin', label: 'Super Administrador', themeClass: 'theme-SUPER_ADMIN', dashboardUrl: APP_ROUTES.admin.root },
  ADMIN: { id: UserRole.ADMIN, appTitle: 'Admin', label: 'Administrador', themeClass: 'theme-ADMIN', dashboardUrl: APP_ROUTES.admin.root },
  KID_REGISTER_ADMIN: { id: UserRole.KID_REGISTER_ADMIN, appTitle: 'Regikids', label: 'Coordinador', themeClass: 'theme-KID_REGISTER_ADMIN', dashboardUrl: APP_ROUTES.kidRegistration.root },
  KID_GROUP_ADMIN: { id: UserRole.KID_GROUP_ADMIN, appTitle: 'Iglekids', label: 'Coordinador', themeClass: 'theme-KID_GROUP_ADMIN', dashboardUrl: APP_ROUTES.kidChurch.root },
  KID_REGISTER_SUPERVISOR: { id: UserRole.KID_REGISTER_SUPERVISOR, appTitle: 'Regikids', label: 'Supervisor', themeClass: 'theme-KID_REGISTER_SUPERVISOR', dashboardUrl: APP_ROUTES.kidRegistration.root },
  KID_GROUP_SUPERVISOR: { id: UserRole.KID_GROUP_SUPERVISOR, appTitle: 'Iglekids', label: 'Supervisor', themeClass: 'theme-KID_GROUP_SUPERVISOR', dashboardUrl: APP_ROUTES.kidChurch.root },
  KID_REGISTER_USER: { id: UserRole.KID_REGISTER_USER, appTitle: 'Regikids', label: 'Maestro', themeClass: 'theme-KID_REGISTER_USER', dashboardUrl: APP_ROUTES.kidRegistration.root },
  KID_GROUP_USER: { id: UserRole.KID_GROUP_USER, appTitle: 'Iglekids', label: 'Maestro', themeClass: 'theme-KID_GROUP_USER', dashboardUrl: APP_ROUTES.kidChurch.root },
};

const TopBar = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [profileOpen, setProfileOpen] = useState(false);

  const user = useAppSelector((state) => state.authSlice.user);
  const currentRole = useAppSelector((state) => state.authSlice.currentRole);

  const userRoles = (user?.roles as UserRole[]) || [];
  
  // Create dynamic available roles strictly matching the old config mapping
  const availableRoles = userRoles
    .filter((userRole: UserRole) => userRolesNavBarConfig[userRole] !== undefined)
    .map((userRole: UserRole) => userRolesNavBarConfig[userRole]!);

  // Safe fallback if user has no mapped roles
  if (availableRoles.length === 0) {
    availableRoles.push({ id: UserRole.USER, appTitle: 'Regikids', label: 'Usuario', themeClass: 'theme-USER', dashboardUrl: APP_ROUTES.kidRegistration.root });
  }

  // Find the active visual role based on Redux currentRole
  let activeVisualRole = availableRoles[0];
  if (currentRole && availableRoles.some(r => r.id === currentRole)) {
    activeVisualRole = availableRoles.find(r => r.id === currentRole) || activeVisualRole;
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
    navigate(APP_ROUTES.auth.login, { replace: true });
    toast.success('Se ha cerrado su sesión', {
      duration: 5000,
    });
  };

  React.useEffect(() => {
    // Restaurar la inyección por clases de Tailwind v4 en el body
    document.body.className = `${activeVisualRole.themeClass} antialiased`;
  }, [activeVisualRole]);

  const hasMultipleRoles = availableRoles.length > 1;

  const roleTriggerContent = (
    <div className={clsx(
      "flex items-center gap-2 outline-none rounded-lg p-1 transition-colors",
      hasMultipleRoles ? "hover:bg-black/10 cursor-pointer" : "cursor-default"
    )}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 p-1">
         <img src="/logo-iglekids.png" alt="Iglekids" className="w-full h-full object-contain drop-shadow-sm" />
      </div>
      <div className="text-left">
        <h1 className="font-bold leading-tight">{activeVisualRole.appTitle}</h1>
        <div className="flex items-center gap-1 text-xs uppercase tracking-wider opacity-90 font-medium">
          Rol: {activeVisualRole.label}
          {hasMultipleRoles && <ChevronDown size={12} />}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <header className="bg-primary text-primary-foreground px-4 py-2 flex justify-between items-center shrink-0 transition-colors duration-300 z-[120] relative shadow-none border-none outline-none">
        
        {/* Lado Izquierdo: Menú de Roles */}
        {hasMultipleRoles ? (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              {roleTriggerContent}
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content 
                className="bg-surface text-text-main rounded-xl shadow-lg border border-gray-100 p-2 min-w-[200px] z-[130] pointer-events-auto animate-in fade-in zoom-in-95 duration-200"
                sideOffset={8}
                align="start"
              >
                <div className="text-xs font-bold text-text-muted mb-2 px-2 pt-1 uppercase">Cambiar Rol</div>
                {availableRoles.map(role => (
                  <DropdownMenu.Item
                    key={role.id}
                    onSelect={() => handleRoleChange(role)}
                    className={clsx(
                      "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer outline-none transition-colors text-sm",
                      activeVisualRole.id === role.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-gray-100"
                    )}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-xs text-gray-500 uppercase">{role.appTitle}</span>
                      <span>{role.label}</span>
                    </div>
                    {activeVisualRole.id === role.id && <Check size={16} />}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        ) : (
          roleTriggerContent
        )}

      {/* Lado Derecho: Iconos y Avatar de Usuario */}
      <div className="flex items-center gap-3">
        
        {/* Menú de Usuario */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger className="outline-none rounded-full ring-2 ring-transparent hover:ring-white/30 transition-all relative">
            <div className="w-9 h-9 rounded-full bg-black/20 text-sm flex items-center justify-center font-bold">
              {userInitials}
            </div>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content 
              className="bg-surface text-text-main rounded-xl shadow-lg border border-gray-100 p-2 min-w-[180px] z-[130] pointer-events-auto animate-in fade-in zoom-in-95 duration-200"
              sideOffset={8}
              align="end"
            >
              <div className="px-3 py-2 border-b border-gray-100 mb-1">
                <p className="font-bold text-sm">{userName}</p>
                {userEmail && <p className="text-xs text-text-muted">{userEmail}</p>}
              </div>
              
              <DropdownMenu.Item 
                onSelect={() => setProfileOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer outline-none hover:bg-gray-100 transition-colors text-sm"
              >
                <User size={16} className="text-text-muted" />
                Mi Perfil
              </DropdownMenu.Item>
              
              <DropdownMenu.Item 
                onSelect={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer outline-none hover:bg-red-50 text-red-600 transition-colors text-sm mt-1"
              >
                <LogOut size={16} />
                Cerrar Sesión
              </DropdownMenu.Item>

              <div className="mt-2 pt-2 border-t border-gray-100 text-center">
                <span className="text-[10px] font-semibold text-gray-400">Iglekids v3.0.0</span>
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {/* User Profile Modal */}
      <UserProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
    </header>
    </>
  );
};

export default TopBar;
