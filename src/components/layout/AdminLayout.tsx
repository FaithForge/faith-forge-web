import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  LayoutGrid,
  User,
  LogOut,
  Crown,
  Search,
  Bell,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavigationGuardProvider } from '@/libs/context/NavigationGuardContext';
import { SearchScrollProvider, useSearchScroll } from '@/libs/context/SearchScrollContext';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { setActiveExperience } from '@/libs/state/redux/slices/user/auth.slice';
import { UserLogout } from '@/libs/state/redux/thunks/user/auth.thunk';
import { APP_ROUTES } from '@/config/routes';
import { UserExperienceEnum, UserRole } from '@/libs/utils/auth';
import { capitalizeWords, formatPersonShortName } from '@/libs/utils/text';
import { APP_VERSION } from '@/constants/version';
import { useGetInAppNotificationsQuery } from '@/libs/state/redux/api/userApi';

const UserProfileModal = lazy(() => import('@/components/modal/UserProfileModal'));
const ChangelogDrawer = lazy(() => import('@/components/modal/ChangelogDrawer'));
const NotificationsDrawer = lazy(() => import('@/components/modal/NotificationsDrawer'));

/**
 * Inner shell for Church Administration workspace (/admin).
 *
 * @returns {JSX.Element} The rendered Admin layout content.
 */
const AdminLayoutContent: React.FC = () => {
  const { t } = useTranslation(['admin', 'common']);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const user = useAppSelector((state) => state.authSlice.user);
  const experiences = useAppSelector((state) => state.authSlice.experiences) || [];
  const activeChurch = useAppSelector((state) => state.churchCampusSlice.church);

  const [profileOpen, setProfileOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [hasOpenedProfile, setHasOpenedProfile] = useState(false);
  const [hasOpenedChangelog, setHasOpenedChangelog] = useState(false);
  const [hasOpenedNotifications, setHasOpenedNotifications] = useState(false);

  const { data: notificationsData } = useGetInAppNotificationsQuery(
    { experience: UserExperienceEnum.ADMIN },
    { skip: !user }
  );
  const unreadNotifCount = notificationsData?.unreadCount || 0;

  const mainRef = useRef<HTMLElement>(null);
  const {
    isSearchAvailable,
    isScrolledPastSearch,
    setIsScrolledPastSearch,
    registerMainContainer,
    triggerFocusSearch,
  } = useSearchScroll();

  useEffect(() => {
    registerMainContainer(mainRef.current);
  }, [registerMainContainer]);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setIsScrolledPastSearch(scrollTop > 90);
  };

  const isSuperAdmin = (user?.roles || []).includes(UserRole.SUPER_ADMIN);
  const isAdmin = (user?.roles || []).includes(UserRole.ADMIN);
  const isStaff = (user?.roles || []).includes(UserRole.STAFF);

  useEffect(() => {
    dispatch(setActiveExperience(UserExperienceEnum.ADMIN));
    const adminThemeClass = isSuperAdmin
      ? 'theme-SUPER_ADMIN'
      : isAdmin
      ? 'theme-ADMIN'
      : isStaff
      ? 'theme-STAFF'
      : 'theme-ADMIN';
    document.body.className = `${adminThemeClass} antialiased bg-slate-50`;
  }, [dispatch, isSuperAdmin, isAdmin, isStaff]);

  const shortName = formatPersonShortName(user?.firstName, user?.lastName) || 'Admin';
  const hasMultipleSpaces = experiences.length > 1;

  const handleOpenProfile = (open: boolean) => {
    if (open) setHasOpenedProfile(true);
    setProfileOpen(open);
  };

  const handleOpenChangelog = (open: boolean) => {
    if (open) setHasOpenedChangelog(true);
    setChangelogOpen(open);
  };

  const handleLogout = async () => {
    await dispatch(UserLogout());
    navigate(APP_ROUTES.auth.login, { replace: true });
  };

  const handleSwitchSpace = () => {
    navigate(APP_ROUTES.hub);
  };

  const userInitials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'AD'
    : 'AD';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      {/* Top Header matching exact TopBar shape and dimensions with primary blue color scheme */}
      <header className="bg-primary text-primary-foreground px-4 py-2 sm:py-2.5 flex justify-between items-center shrink-0 border-b border-white/10 shadow-none z-40 sticky top-0 transition-colors duration-300">
        {/* Left Side: Brand and Scope (Same layout as TopBar) */}
        <div className="flex items-center gap-2.5 outline-none rounded-xl py-0.5 px-1">
          <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-white p-1 shadow-xs shrink-0 self-center">
            <Crown className="w-4.5 h-4.5 text-amber-500 fill-amber-500" />
          </div>
          <div className="flex flex-col justify-center text-left min-w-0">
            <h1 className="font-extrabold text-[13px] sm:text-[15px] leading-snug tracking-tight truncate max-w-[200px] sm:max-w-xs md:max-w-sm text-white">
              {activeChurch?.name || 'Administración'}
            </h1>
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] tracking-wide text-white/80 font-medium mt-0.5 leading-none">
              <span>Rol: {isSuperAdmin ? 'Super Administrador' : isAdmin ? 'Administrador' : isStaff ? 'Staff' : 'Administrador'}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Search and User Dropdown (Same layout as TopBar) */}
        <div className="flex items-center gap-2">
          {/* Dynamic Search Icon when scrolled past search input */}
          {isSearchAvailable && (
            <button
              type="button"
              onClick={triggerFocusSearch}
              title={t('common:navigation.search', { defaultValue: 'Buscar' })}
              aria-label={t('common:navigation.search', { defaultValue: 'Buscar' })}
              className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 outline-none active:scale-90',
                isScrolledPastSearch
                  ? 'opacity-100 scale-100 bg-white/10 hover:bg-white/20 text-white cursor-pointer'
                  : 'opacity-0 scale-75 pointer-events-none w-0 -mr-2 overflow-hidden'
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
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 outline-none active:scale-90 bg-white/10 hover:bg-white/20 text-white cursor-pointer relative"
          >
            <Bell size={18} />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center animate-pulse shadow-xs">
                {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
              </span>
            )}
          </button>

          {/* User Dropdown */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger className="outline-none rounded-full ring-2 ring-transparent hover:ring-white/30 transition-all relative active:scale-95 cursor-pointer">
              <div className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full bg-white/20 text-[11px] sm:text-xs flex items-center justify-center font-bold shadow-inner overflow-hidden text-white border border-white/30">
                {user?.photoUrl ? (
                  <img src={user.photoUrl} alt={shortName} className="w-full h-full object-cover" />
                ) : (
                  userInitials
                )}
              </div>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="bg-white text-gray-900 rounded-xl shadow-lg border border-gray-100 p-2 min-w-[190px] z-[250] pointer-events-auto animate-in fade-in zoom-in-95 duration-200"
                sideOffset={8}
                align="end"
              >
                <div className="px-3 py-2 border-b border-gray-100 mb-1 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 text-xs flex items-center justify-center font-bold overflow-hidden shrink-0">
                    {user?.photoUrl ? (
                      <img src={user.photoUrl} alt={shortName} className="w-full h-full object-cover" />
                    ) : (
                      userInitials
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-sm truncate text-gray-900">
                      {user ? `${capitalizeWords(user.firstName)} ${capitalizeWords(user.lastName)}` : shortName}
                    </p>
                    {user?.email && <p className="text-xs text-gray-500 truncate">{user.email}</p>}
                  </div>
                </div>

                <DropdownMenu.Item
                  onSelect={() => handleOpenProfile(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer outline-none hover:bg-gray-100 transition-colors text-sm text-gray-700"
                >
                  <User size={16} className="text-gray-500" />
                  <span>{t('common:navigation.profile', { defaultValue: 'Mi Perfil' })}</span>
                </DropdownMenu.Item>

                {hasMultipleSpaces && (
                  <DropdownMenu.Item
                    onSelect={handleSwitchSpace}
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
                  <span>{t('common:navigation.logout', { defaultValue: 'Cerrar sesión' })}</span>
                </DropdownMenu.Item>

                <div className="mt-2 pt-2 border-t border-gray-100 text-center px-2">
                  <button
                    type="button"
                    onClick={() => handleOpenChangelog(true)}
                    className="w-full text-[10px] text-gray-400 hover:text-gray-600 transition-colors cursor-pointer text-center leading-tight py-0.5 group"
                  >
                    <span className="block truncate font-medium">
                      {activeChurch?.name || 'Administración'}
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
      </header>

      {/* Main Admin Scrollable Body */}
      <main
        ref={mainRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto flex flex-col bg-slate-50"
      >
        <Outlet />
      </main>

      {/* Profile Modal */}
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

      {/* Notifications Drawer */}
      {hasOpenedNotifications && (
        <Suspense fallback={null}>
          <NotificationsDrawer
            open={notificationsOpen}
            onOpenChange={setNotificationsOpen}
            experience={UserExperienceEnum.ADMIN}
          />
        </Suspense>
      )}
    </div>
  );
};

/**
 * Dedicated Layout for the Church Administration workspace (/admin).
 * Wraps providers for navigation guards and dynamic search scroll interactions.
 *
 * @returns {JSX.Element} Composed admin layout shell.
 */
const AdminLayout: React.FC = () => {
  return (
    <NavigationGuardProvider>
      <SearchScrollProvider>
        <AdminLayoutContent />
      </SearchScrollProvider>
    </NavigationGuardProvider>
  );
};

export default AdminLayout;
