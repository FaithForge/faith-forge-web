import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import clsx from 'clsx';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  LayoutGrid,
  User,
  LogOut,
  Search,
  Bell,
  Menu,
  ChevronRight,
  ShieldCheck,
  Building2,
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
import { useGetInAppNotificationsQuery } from '@/libs/state/redux/api/userApi';
import { motion, AnimatePresence } from 'framer-motion';
import PageLoader from './PageLoader';
import { AdminSidebar } from './admin/AdminSidebar';

const UserProfileModal = lazy(() => import('@/components/modal/UserProfileModal'));
const ChangelogModal = lazy(() => import('@/components/modal/ChangelogModal'));
const NotificationsModal = lazy(() => import('@/components/modal/NotificationsModal'));
const TerminologyModal = lazy(() => import('@/components/modal/TerminologyModal').then((m) => ({ default: m.TerminologyModal })));
const ClearCacheModal = lazy(() => import('@/components/modal/ClearCacheModal').then((m) => ({ default: m.ClearCacheModal })));

interface AdminLayoutProps {
  children?: React.ReactNode;
}

/**
 * Inner shell for Church Administration workspace (/admin).
 * Provides a responsive Desktop-First layout with a persistent sidebar, top header,
 * and adaptive mobile drawer navigation.
 *
 * @param {AdminLayoutProps} props - Layout child components.
 * @returns {JSX.Element} The rendered Admin layout content.
 */
const AdminLayoutContent: React.FC<AdminLayoutProps> = ({ children }) => {
  const { t } = useTranslation(['admin', 'common']);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const user = useAppSelector((state) => state.authSlice.user);
  const experiences = useAppSelector((state) => state.authSlice.experiences) || [];
  const activeChurch = useAppSelector((state) => state.churchCampusSlice.church);

  // Modals state
  const [profileOpen, setProfileOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [terminologyOpen, setTerminologyOpen] = useState(false);
  const [clearCacheOpen, setClearCacheOpen] = useState(false);

  // Lazy modal trackers
  const [hasOpenedProfile, setHasOpenedProfile] = useState(false);
  const [hasOpenedChangelog, setHasOpenedChangelog] = useState(false);
  const [hasOpenedNotifications, setHasOpenedNotifications] = useState(false);

  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('ff_admin_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Close mobile drawer automatically whenever route changes
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ff_admin_sidebar_collapsed', String(next));
      } catch {
        // Ignore storage exceptions
      }
      return next;
    });
  };

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
  const hasAdminAccess =
    isSuperAdmin || isAdmin || isStaff || (experiences || []).includes(UserExperienceEnum.ADMIN);

  // Security guard: If user lacks admin permissions, block access and redirect away
  if (!hasAdminAccess) {
    if ((experiences || []).includes(UserExperienceEnum.KID_GUARDIAN)) {
      return <Navigate to={APP_ROUTES.kidGuardian.root} replace />;
    }
    return <Navigate to="/" replace />;
  }

  const adminThemeClass = isSuperAdmin
    ? 'theme-SUPER_ADMIN'
    : isAdmin
    ? 'theme-ADMIN'
    : isStaff
    ? 'theme-STAFF'
    : 'theme-ADMIN';

  useEffect(() => {
    dispatch(setActiveExperience(UserExperienceEnum.ADMIN));
    delete document.body.dataset.role;
    document.body.className = `${adminThemeClass} antialiased bg-slate-50`;
  }, [dispatch, adminThemeClass]);

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
    <div className={clsx('h-screen w-screen flex overflow-hidden bg-slate-50 text-slate-900 font-sans', adminThemeClass)}>
      {/* Desktop Sidebar (Permanent on lg screens) */}
      <div className="hidden lg:flex h-full shrink-0">
        <AdminSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
          onOpenTerminology={() => setTerminologyOpen(true)}
          onOpenClearCache={() => setClearCacheOpen(true)}
          onOpenChangelog={() => handleOpenChangelog(true)}
        />
      </div>

      {/* Mobile Drawer (Slide-out on screens smaller than lg) */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop with smooth fade */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs cursor-pointer"
              onClick={() => setMobileDrawerOpen(false)}
            />
            {/* Drawer content with smooth slide from left */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative z-10 w-72 h-full shadow-2xl flex flex-col"
            >
              <AdminSidebar
                isMobileDrawer
                onCloseMobile={() => setMobileDrawerOpen(false)}
                onOpenTerminology={() => {
                  setMobileDrawerOpen(false);
                  setTerminologyOpen(true);
                }}
                onOpenClearCache={() => {
                  setMobileDrawerOpen(false);
                  setClearCacheOpen(true);
                }}
                onOpenChangelog={() => {
                  setMobileDrawerOpen(false);
                  handleOpenChangelog(true);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Column */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Header (Desktop & Mobile) */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
          {/* Left: Mobile Hamburger or Desktop Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Abrir menú"
            >
              <Menu size={20} />
            </button>

            {/* Desktop Page Context */}
            <div className="hidden lg:flex items-center gap-2 text-sm text-slate-500 min-w-0">
              <span className="font-semibold text-slate-900 truncate">
                {activeChurch?.name || 'Administración de Iglesia'}
              </span>
              <ChevronRight size={14} className="text-slate-300 shrink-0" />
              <span className="text-slate-500 font-medium truncate">
                {isSuperAdmin
                  ? 'Panel de Plataforma'
                  : isAdmin
                  ? 'Panel de Administración'
                  : 'Gestión Administrativa'}
              </span>
            </div>

            {/* Mobile Title */}
            <div className="lg:hidden font-bold text-sm text-slate-900 truncate">
              {activeChurch?.name || 'Administración'}
            </div>
          </div>

          {/* Right: Actions, Search, Notifications, User Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Dynamic Search button when scrolled past in views */}
            {isSearchAvailable && (
              <button
                type="button"
                onClick={triggerFocusSearch}
                title={t('common:navigation.search', { defaultValue: 'Buscar' })}
                aria-label={t('common:navigation.search', { defaultValue: 'Buscar' })}
                className={clsx(
                  'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 outline-none active:scale-95 text-slate-600 hover:bg-slate-100 cursor-pointer',
                  isScrolledPastSearch
                    ? 'opacity-100 scale-100'
                    : 'opacity-0 scale-75 pointer-events-none w-0 overflow-hidden'
                )}
              >
                <Search size={18} />
              </button>
            )}

            {/* Notifications Button */}
            <button
              type="button"
              onClick={() => {
                setHasOpenedNotifications(true);
                setNotificationsOpen(true);
              }}
              title="Notificaciones"
              aria-label="Notificaciones"
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 outline-none active:scale-95 text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer relative"
            >
              <Bell size={19} />
              {unreadNotifCount > 0 && (
                <span className="absolute 1.5 top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center animate-pulse shadow-xs">
                  {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                </span>
              )}
            </button>

            {/* User Dropdown */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger className="outline-none flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer group">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold overflow-hidden border border-primary/20 shrink-0 group-hover:ring-2 group-hover:ring-primary/20 transition-all">
                  {user?.photoUrl ? (
                    <img src={user.photoUrl} alt={shortName} className="w-full h-full object-cover" />
                  ) : (
                    userInitials
                  )}
                </div>
                <div className="hidden sm:flex flex-col text-left pr-1 min-w-0">
                  <span className="font-semibold text-xs text-slate-800 truncate max-w-[120px]">
                    {shortName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium truncate leading-tight">
                    {isSuperAdmin ? 'Super Admin' : isAdmin ? 'Administrador' : 'Staff'}
                  </span>
                </div>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-100 p-2 min-w-[210px] z-[250] pointer-events-auto animate-in fade-in zoom-in-95 duration-150"
                  sideOffset={8}
                  align="end"
                >
                  <div className="px-3 py-2 border-b border-slate-100 mb-1 flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 text-xs flex items-center justify-center font-bold overflow-hidden shrink-0">
                      {user?.photoUrl ? (
                        <img src={user.photoUrl} alt={shortName} className="w-full h-full object-cover" />
                      ) : (
                        userInitials
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-sm truncate text-slate-900">
                        {user ? `${capitalizeWords(user.firstName)} ${capitalizeWords(user.lastName)}` : shortName}
                      </p>
                      {user?.email && <p className="text-xs text-slate-400 truncate">{user.email}</p>}
                    </div>
                  </div>

                  <DropdownMenu.Item
                    onSelect={() => navigate(APP_ROUTES.profile)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer outline-none hover:bg-slate-50 transition-colors text-sm text-slate-700 font-medium"
                  >
                    <User size={16} className="text-slate-400" />
                    <span>{t('common:navigation.profile', { defaultValue: 'Mi Perfil' })}</span>
                  </DropdownMenu.Item>

                  {hasMultipleSpaces && (
                    <DropdownMenu.Item
                      onSelect={handleSwitchSpace}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer outline-none hover:bg-slate-50 text-slate-700 transition-colors text-sm font-medium"
                    >
                      <LayoutGrid size={16} className="text-slate-400" />
                      <span>Cambiar de espacio</span>
                    </DropdownMenu.Item>
                  )}

                  <DropdownMenu.Item
                    onSelect={handleLogout}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer outline-none hover:bg-rose-50 text-rose-600 transition-colors text-sm mt-1 font-semibold"
                  >
                    <LogOut size={16} />
                    <span>{t('common:navigation.logout', { defaultValue: 'Cerrar sesión' })}</span>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </header>

        {/* Scrollable Work Area */}
        <main
          ref={mainRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto flex flex-col bg-slate-50/70"
        >
          <Suspense fallback={<PageLoader />}>
            {children || <Outlet />}
          </Suspense>
        </main>
      </div>

      {/* Profile Modal */}
      {hasOpenedProfile && (
        <Suspense fallback={null}>
          <UserProfileModal open={profileOpen} onOpenChange={handleOpenProfile} />
        </Suspense>
      )}

      {/* Changelog Modal */}
      {hasOpenedChangelog && (
        <Suspense fallback={null}>
          <ChangelogModal open={changelogOpen} onOpenChange={handleOpenChangelog} />
        </Suspense>
      )}

      {/* Notifications Modal */}
      {hasOpenedNotifications && (
        <Suspense fallback={null}>
          <NotificationsModal
            open={notificationsOpen}
            onOpenChange={setNotificationsOpen}
            experience={UserExperienceEnum.ADMIN}
          />
        </Suspense>
      )}

      {/* Terminology Modal */}
      {terminologyOpen && (
        <Suspense fallback={null}>
          <TerminologyModal open={terminologyOpen} onOpenChange={setTerminologyOpen} />
        </Suspense>
      )}

      {/* Clear Cache Modal */}
      {clearCacheOpen && (
        <Suspense fallback={null}>
          <ClearCacheModal open={clearCacheOpen} onOpenChange={setClearCacheOpen} />
        </Suspense>
      )}
    </div>
  );
};

/**
 * Dedicated Layout for the Church Administration workspace (/admin).
 * Wraps providers for navigation guards and dynamic search scroll interactions.
 *
 * @param {AdminLayoutProps} props - Layout children.
 * @returns {JSX.Element} Composed admin layout shell.
 */
const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <NavigationGuardProvider>
      <SearchScrollProvider>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </SearchScrollProvider>
    </NavigationGuardProvider>
  );
};

export default AdminLayout;
