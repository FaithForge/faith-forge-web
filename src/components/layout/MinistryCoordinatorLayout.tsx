import React, { useEffect } from 'react';
import { Outlet, useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  MapPin,
  ChevronDown,
  Sparkles,
  LogOut,
  Check,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import clsx from 'clsx';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { setActiveExperience } from '@/libs/state/redux/slices/user/auth.slice';
import { UserLogout } from '@/libs/state/redux/thunks/user/auth.thunk';
import { updateCurrentChurchCampus } from '@/libs/state/redux/slices/church/churchCampus.slice';
import { setActiveCampus } from '@/libs/state/redux/slices/church/volunteerContext.slice';
import { UserExperienceEnum, UserRole, ChurchRole } from '@/libs/utils/auth';
import { APP_ROUTES } from '@/config/routes';
import { formatPersonShortName } from '@/libs/utils/text';
import { usePermissions } from '@/libs/hooks/usePermissions';
import { useChurchTerm } from '@/libs/hooks/useTerm';
import MinistryCoordinatorBottomNav from './MinistryCoordinatorBottomNav';

/**
 * Dedicated Layout Shell for the Ministry Coordinator workspace (`/ministry-coordinator`).
 * Decoupled from Kid Church operational layout, with zero configuration buttons.
 * Provides sticky header with Azul Maya branding, Campus switching, space switching, and bottom navigation.
 *
 * @returns {JSX.Element} Layout shell.
 */
export const MinistryCoordinatorLayout: React.FC = () => {
  const { t } = useTranslation(['hub', 'common', 'auth']);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAdmin, isSuperAdmin } = usePermissions();

  const campusTerm = useChurchTerm('campus');
  const campusesTerm = useChurchTerm('campuses');

  const { user, experiences = [] } = useAppSelector((state) => state.authSlice);
  const userRoles = (user?.roles || []) as string[];

  const hasAccess =
    isSuperAdmin ||
    isAdmin ||
    userRoles.includes(ChurchRole.MINISTRY_ADMIN) ||
    experiences.includes(UserExperienceEnum.MINISTRY_COORDINATOR);

  // Security guard: If user lacks Ministry Coordinator permission, redirect away
  if (!hasAccess && experiences.length > 0) {
    return <Navigate to="/" replace />;
  }

  // Campus context resolution
  const volunteerCampuses = useAppSelector((state) => state.volunteerContextSlice.campuses || []);
  const allCampuses = useAppSelector((state) => state.churchCampusSlice.data || []);
  const currentCampus = useAppSelector((state) => state.churchCampusSlice.current);

  const availableCampuses = isAdmin || isSuperAdmin
    ? allCampuses
    : volunteerCampuses.map((vc) => ({ id: vc.id, name: vc.name }));

  const activeCampusName = currentCampus?.name || availableCampuses[0]?.name || 'Sede';

  const shortName = formatPersonShortName(user?.firstName, user?.lastName) || 'Usuario';
  const userInitials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'CM'
    : 'CM';

  useEffect(() => {
    delete document.body.dataset.role;
    document.body.className = 'theme-MINISTRY_ADMIN antialiased bg-slate-50';
    dispatch(setActiveExperience(UserExperienceEnum.MINISTRY_COORDINATOR));
  }, [dispatch]);

  const handleCampusChange = (campus: { id: string; name: string }) => {
    dispatch(updateCurrentChurchCampus(campus.id));
    dispatch(setActiveCampus({ campusId: campus.id, campusName: campus.name }));
  };

  const handleSwitchSpace = () => {
    navigate(APP_ROUTES.hub);
  };

  const handleLogout = async () => {
    await dispatch(UserLogout());
    navigate(APP_ROUTES.auth.login, { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans theme-MINISTRY_ADMIN">
      {/* Top Header sticky with Azul Maya accents */}
      <header className="bg-white/95 backdrop-blur text-slate-900 px-4 py-2 sm:py-2.5 flex justify-between items-center shrink-0 border-b border-slate-200/80 shadow-xs z-40 sticky top-0 transition-colors duration-300">
        {/* Left Side: Brand & Campus Selector */}
        <div className="flex items-center gap-2.5 outline-none rounded-xl py-0.5 px-1 min-w-0">
          <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#73c2fb] to-[#0284c7] text-white shadow-xs shrink-0 self-center">
            <Building2 className="w-4.5 h-4.5" />
          </div>

          <div className="flex flex-col text-left justify-center min-w-0">
            <div className="flex items-center gap-1.5 leading-tight">
              <span className="font-extrabold text-[13px] sm:text-[15px] leading-snug tracking-tight truncate text-slate-900">
                {t('hub:ministry_coordinator', { defaultValue: 'Coordinador de Ministerio' })}
              </span>
            </div>

            {/* Campus Selector Trigger or Label */}
            {availableCampuses.length > 1 ? (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1 mt-0.5 text-[11px] font-semibold text-[#0284c7] hover:text-[#0369a1] transition-colors cursor-pointer text-left truncate outline-hidden group"
                  >
                    <MapPin className="w-3 h-3 shrink-0 text-[#0284c7]" />
                    <span className="truncate underline decoration-dotted underline-offset-2">
                      {activeCampusName}
                    </span>
                    <ChevronDown className="w-3 h-3 shrink-0 opacity-70 group-hover:opacity-100" />
                  </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="start"
                    sideOffset={6}
                    className="w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-100"
                  >
                    <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {t('common:select_campus', { defaultValue: `Seleccionar ${campusTerm.toLowerCase()}` })}
                    </div>
                    {availableCampuses.map((campus) => {
                      const isSelected = campus.id === currentCampus?.id;
                      return (
                        <DropdownMenu.Item
                          key={campus.id}
                          onSelect={() => handleCampusChange(campus)}
                          className={clsx(
                            'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer outline-hidden transition-colors',
                            isSelected
                              ? 'bg-sky-50 text-[#0284c7]'
                              : 'text-slate-700 hover:bg-slate-50'
                          )}
                        >
                          <span className="truncate">{campus.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={3} />}
                        </DropdownMenu.Item>
                      );
                    })}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            ) : (
              <div className="flex items-center gap-1 mt-0.5 leading-none">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 leading-none truncate">
                  {activeCampusName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Space Switcher & User Avatar Menu */}
        <div className="flex items-center gap-2">
          {experiences.length > 1 && (
            <button
              type="button"
              onClick={handleSwitchSpace}
              title={t('hub:switch_workspace', { defaultValue: 'Cambiar espacio' })}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#0284c7]" />
              <span className="hidden sm:inline">
                {t('hub:workspaces', { defaultValue: 'Espacios' })}
              </span>
            </button>
          )}

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className="w-8 h-8 rounded-full border border-slate-200 bg-sky-50 text-[#0284c7] hover:bg-sky-100 flex items-center justify-center font-bold text-xs shadow-2xs transition-all focus:outline-hidden overflow-hidden cursor-pointer"
              >
                {user?.photoUrl ? (
                  <img src={user.photoUrl} alt={shortName} className="w-full h-full object-cover" />
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
                {/* User Header */}
                <div className="px-3 py-2 border-b border-slate-100 mb-1 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-sky-50 text-[#0284c7] text-xs flex items-center justify-center font-bold overflow-hidden shrink-0 border border-sky-100">
                    {user?.photoUrl ? (
                      <img src={user.photoUrl} alt={shortName} className="w-full h-full object-cover" />
                    ) : (
                      userInitials
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{shortName}</p>
                    <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                  </div>
                </div>

                {/* Switch Workspace */}
                {experiences.length > 1 && (
                  <DropdownMenu.Item
                    onSelect={handleSwitchSpace}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer outline-hidden transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-[#0284c7]" />
                    <span>{t('hub:switch_workspace', { defaultValue: 'Cambiar de espacio' })}</span>
                  </DropdownMenu.Item>
                )}

                {/* Logout */}
                <DropdownMenu.Item
                  onSelect={handleLogout}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 cursor-pointer outline-hidden transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('common:actions.logout', { defaultValue: 'Cerrar sesión' })}</span>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-1 pb-24">
        <Outlet />
      </main>

      {/* Floating Bottom Nav */}
      <MinistryCoordinatorBottomNav />
    </div>
  );
};

export default MinistryCoordinatorLayout;
