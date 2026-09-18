import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { LogOut, LayoutGrid, HeartHandshake, User } from 'lucide-react';
import { FaChild } from 'react-icons/fa6';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { UserLogout } from '@/libs/state/redux/thunks/user/auth.thunk';
import { APP_ROUTES } from '@/config/routes';
import { useKidsTerm } from '@/libs/hooks/useTerm';
import { capitalizeWords, formatPersonShortName } from '@/libs/utils/text';

const UserProfileModal = React.lazy(() => import('@/components/modal/UserProfileModal'));

/**
 * Dedicated layout for the Kid Guardian (acudiente) experience.
 * Minimalist, mobile-first design completely isolated from operational server menus.
 *
 * @returns {JSX.Element} The rendered Kid Guardian layout.
 */
const KidGuardianLayout: React.FC = () => {
  const { t } = useTranslation(['kidGuardian', 'common', 'auth']);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.authSlice.user);
  const experiences = useAppSelector((state) => state.authSlice.experiences) || [];
  const kidsModuleName = useKidsTerm('module_alias');
  const guardianTerm = useKidsTerm('guardian');

  const [profileOpen, setProfileOpen] = React.useState(false);
  const [hasOpenedProfile, setHasOpenedProfile] = React.useState(false);

  const handleOpenProfile = (open: boolean) => {
    if (open) setHasOpenedProfile(true);
    setProfileOpen(open);
  };

  const hasMultipleSpaces = experiences.length > 1;
  const shortName = formatPersonShortName(user?.firstName, user?.lastName) || guardianTerm;
  const userInitials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'AC'
    : 'AC';

  const handleLogout = async () => {
    await dispatch(UserLogout());
    navigate(APP_ROUTES.auth.login, { replace: true });
  };

  const handleSwitchSpace = () => {
    navigate(APP_ROUTES.hub);
  };

  React.useEffect(() => {
    document.body.className = 'theme-GUARDIAN antialiased bg-slate-50';
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      {/* Top Header matching exact TopBar shape and dimensions with clean White color scheme */}
      <header className="bg-white/95 backdrop-blur text-slate-900 px-4 py-2 sm:py-2.5 flex justify-between items-center shrink-0 border-b border-slate-200/80 shadow-xs z-40 sticky top-0 transition-colors duration-300">
        {/* Left Side: Brand and Scope (Same layout as TopBar) */}
        <div className="flex items-center gap-2.5 outline-none rounded-xl py-0.5 px-1">
          <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-xs shrink-0 self-center">
            <FaChild className="w-4.5 h-4.5" />
          </div>
          <div className="flex flex-col text-left justify-center min-w-0">
            <div className="flex items-center gap-1.5 leading-tight">
              <span className="font-extrabold text-[13px] sm:text-[15px] leading-snug tracking-tight truncate text-slate-900">
                {kidsModuleName}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5 leading-none">
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 leading-none">
                {guardianTerm}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Circular User Avatar */}
        <div className="flex items-center gap-2.5">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full border border-slate-200 bg-slate-100 hover:bg-slate-200/80 text-slate-700 flex items-center justify-center font-bold text-xs shadow-2xs hover:ring-2 hover:ring-indigo-100 transition-all focus:outline-hidden overflow-hidden cursor-pointer"
              >
                {user?.photoUrl ? (
                  <img
                    src={user.photoUrl}
                    alt={shortName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  userInitials
                )}
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className="w-60 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-100"
              >
                {/* User Identity Header */}
                <div className="px-3 py-2 border-b border-slate-100 mb-1 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 text-xs flex items-center justify-center font-bold overflow-hidden shrink-0 border border-indigo-100/70">
                    {user?.photoUrl ? (
                      <img
                        src={user.photoUrl}
                        alt={shortName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      userInitials
                    )}
                  </div>
                  <div className="overflow-hidden min-w-0">
                    <p className="font-bold text-sm text-slate-800 truncate">
                      {user
                        ? `${capitalizeWords(user.firstName)} ${capitalizeWords(user.lastName)}`
                        : shortName}
                    </p>
                    {(user?.email || user?.phone) && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {user.email || user.phone}
                      </p>
                    )}
                  </div>
                </div>

                <DropdownMenu.Item
                  onSelect={() => handleOpenProfile(true)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors outline-hidden"
                >
                  <User className="w-4 h-4 text-slate-500" />
                  <span>{t('common:navigation.profile', 'Mi Perfil')}</span>
                </DropdownMenu.Item>

                {hasMultipleSpaces && (
                  <DropdownMenu.Item
                    onSelect={handleSwitchSpace}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-50 rounded-xl cursor-pointer transition-colors outline-hidden font-medium"
                  >
                    <LayoutGrid className="w-4 h-4 text-indigo-600" />
                    <span>{t('kidGuardian:header.switch_space', 'Cambiar de espacio')}</span>
                  </DropdownMenu.Item>
                )}

                <DropdownMenu.Item
                  onSelect={handleLogout}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer transition-colors outline-hidden mt-0.5"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>{t('common:actions.logout', 'Cerrar sesión')}</span>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-lg w-full mx-auto p-4 pb-12">
        <Outlet />
      </main>

      {/* Lazy-loaded User Profile Modal */}
      {hasOpenedProfile && (
        <React.Suspense fallback={null}>
          <UserProfileModal open={profileOpen} onOpenChange={handleOpenProfile} variant="guardian" />
        </React.Suspense>
      )}
    </div>
  );
};

export default KidGuardianLayout;
