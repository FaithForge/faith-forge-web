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

/**
 * Dedicated layout for the Kid Guardian (acudiente) experience.
 * Minimalist, mobile-first design completely isolated from operational server menus.
 *
 * @returns {JSX.Element} The rendered Kid Guardian layout.
 */
const KidGuardianLayout: React.FC = () => {
  const { t } = useTranslation(['common', 'auth']);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.authSlice.user);
  const experiences = useAppSelector((state) => state.authSlice.experiences) || [];
  const kidsModuleName = useKidsTerm('module_alias');
  const guardianTerm = useKidsTerm('guardian');

  const hasMultipleSpaces = experiences.length > 1;
  const shortName = formatPersonShortName(user?.firstName, user?.lastName) || 'Acudiente';

  const handleLogout = async () => {
    await dispatch(UserLogout());
    navigate(APP_ROUTES.auth.login, { replace: true });
  };

  const handleSwitchSpace = () => {
    navigate(APP_ROUTES.hub);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200/80 shadow-xs">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white shadow-xs">
              <FaChild className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 block leading-none">
                {kidsModuleName}
              </span>
              <span className="text-sm font-bold text-slate-800 leading-tight">
                {guardianTerm}
              </span>
            </div>
          </div>

          {/* User Profile & Actions Dropdown */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full bg-slate-100 hover:bg-slate-200/70 border border-slate-200 transition-colors focus:outline-hidden"
              >
                <span className="text-xs font-medium text-slate-700 max-w-[110px] truncate">
                  {shortName}
                </span>
                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                  {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className="w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-100"
              >
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="text-xs text-slate-400 font-medium">Conectado como</p>
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {user ? `${capitalizeWords(user.firstName)} ${capitalizeWords(user.lastName)}` : shortName}
                  </p>
                  {user?.phone && (
                    <p className="text-xs text-slate-500 mt-0.5">{user.phone}</p>
                  )}
                </div>

                {hasMultipleSpaces && (
                  <DropdownMenu.Item
                    onClick={handleSwitchSpace}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-xl cursor-pointer transition-colors outline-hidden"
                  >
                    <LayoutGrid className="w-4 h-4 text-indigo-500" />
                    <span>Cambiar de espacio</span>
                  </DropdownMenu.Item>
                )}

                <DropdownMenu.Item
                  onClick={handleLogout}
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
    </div>
  );
};

export default KidGuardianLayout;
