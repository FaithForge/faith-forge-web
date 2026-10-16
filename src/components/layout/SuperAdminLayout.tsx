import React, { useState, lazy, Suspense, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import clsx from 'clsx';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  Building2,
  User,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Globe,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { UserLogout } from '@/libs/state/redux/thunks/user/auth.thunk';
import { APP_ROUTES } from '@/config/routes';
import { usePermissions } from '@/libs/hooks/usePermissions';
import { capitalizeWords, formatPersonShortName } from '@/libs/utils/text';
import PageLoader from './PageLoader';

const UserProfileModal = lazy(() => import('@/components/modal/UserProfileModal'));

interface SuperAdminLayoutProps {
  children?: React.ReactNode;
}

/**
 * Dedicated Desktop-First layout for the Platform Superadmin Console (`admin.lumbrela.app`).
 * Restricted strictly to users with the `platform:manage-churches` capability (`SUPER_ADMIN`).
 *
 * @param {SuperAdminLayoutProps} props - Optional child elements.
 * @returns {JSX.Element} Rendered Superadmin layout shell.
 */
const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({ children }) => {
  const { t } = useTranslation(['admin', 'common']);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { can } = usePermissions();

  const user = useAppSelector((state) => state.authSlice.user);
  const [profileOpen, setProfileOpen] = useState(false);
  const [hasOpenedProfile, setHasOpenedProfile] = useState(false);

  const canManageChurches = can('platform:manage-churches');

  useEffect(() => {
    delete document.body.dataset.role;
    document.body.className = 'theme-SUPER_ADMIN antialiased bg-slate-50';
  }, []);

  if (!canManageChurches) {
    return <Navigate to={APP_ROUTES.auth.login} replace />;
  }

  const shortName = formatPersonShortName(user?.firstName, user?.lastName) || 'Super Admin';
  const userInitials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'SA'
    : 'SA';

  const handleOpenProfile = (open: boolean) => {
    if (open) setHasOpenedProfile(true);
    setProfileOpen(open);
  };

  const handleLogout = async () => {
    await dispatch(UserLogout());
    navigate(APP_ROUTES.auth.login, { replace: true });
  };

  const isChurchesActive =
    location.pathname === APP_ROUTES.superAdmin.root ||
    location.pathname.startsWith(APP_ROUTES.superAdmin.churches);

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-slate-50 text-slate-900 font-sans theme-SUPER_ADMIN">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between shrink-0 border-r border-slate-800">
        <div>
          {/* Brand Header */}
          <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-800/80">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Globe size={20} />
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-sm tracking-tight text-white truncate">
                {t('admin:super_admin.console_title')}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {t('admin:super_admin.console_subtitle')}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <button
              type="button"
              onClick={() => navigate(APP_ROUTES.superAdmin.root)}
              className={clsx(
                'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer',
                isChurchesActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white',
              )}
            >
              <Building2 size={18} />
              <span>{t('admin:super_admin.nav_churches')}</span>
            </button>
          </nav>
        </div>

        {/* Footer Badge */}
        <div className="p-4 border-t border-slate-800/80">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
            <span className="text-xs font-medium text-slate-300 truncate">
              {t('admin:super_admin.badge')}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-2 text-sm text-slate-500 min-w-0">
            <span className="font-semibold text-slate-900 truncate">
              {t('admin:super_admin.console_title')}
            </span>
            <ChevronRight size={14} className="text-slate-300 shrink-0" />
            <span className="text-slate-500 font-medium truncate">
              {t('admin:super_admin.nav_churches')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger className="outline-none flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer group">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold overflow-hidden shrink-0">
                  {user?.photoUrl ? (
                    <img src={user.photoUrl} alt={shortName} className="w-full h-full object-cover" />
                  ) : (
                    userInitials
                  )}
                </div>
                <div className="hidden sm:flex flex-col text-left pr-1 min-w-0">
                  <span className="font-semibold text-xs text-slate-800 truncate max-w-[140px]">
                    {shortName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium truncate leading-tight">
                    {t('admin:super_admin.badge')}
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
                    onSelect={() => handleOpenProfile(true)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer outline-none hover:bg-slate-50 transition-colors text-sm text-slate-700 font-medium"
                  >
                    <User size={16} className="text-slate-400" />
                    <span>{t('admin:super_admin.nav_profile')}</span>
                  </DropdownMenu.Item>

                  <DropdownMenu.Item
                    onSelect={handleLogout}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer outline-none hover:bg-rose-50 text-rose-600 transition-colors text-sm mt-1 font-semibold"
                  >
                    <LogOut size={16} />
                    <span>{t('admin:super_admin.nav_logout')}</span>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto flex flex-col bg-slate-50/70">
          <Suspense fallback={<PageLoader />}>
            {children || <Outlet />}
          </Suspense>
        </main>
      </div>

      {hasOpenedProfile && (
        <Suspense fallback={null}>
          <UserProfileModal open={profileOpen} onOpenChange={handleOpenProfile} />
        </Suspense>
      )}
    </div>
  );
};

export default SuperAdminLayout;
