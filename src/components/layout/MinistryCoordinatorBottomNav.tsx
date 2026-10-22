import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Users, LucideIcon } from 'lucide-react';
import clsx from 'clsx';
import { APP_ROUTES } from '@/config/routes';

interface BottomNavItem {
  path: string;
  icon: LucideIcon;
  label: string;
}

/**
 * Dedicated Bottom Navigation Bar for the Ministry Coordinator workspace (`/ministry-coordinator`).
 * Strictly statistical and team directory navigation.
 * Contains NO configuration, printer, or session management buttons.
 *
 * @returns {JSX.Element} Floating bottom nav bar.
 */
export const MinistryCoordinatorBottomNav: React.FC = () => {
  const { t } = useTranslation(['common', 'hub']);
  const { pathname } = useLocation();

  const navItems: BottomNavItem[] = [
    {
      path: APP_ROUTES.ministryCoordinator.root,
      icon: LayoutDashboard,
      label: t('navigation.dashboard', { defaultValue: 'Dashboard' }),
    },
    {
      path: APP_ROUTES.ministryCoordinator.myTeam,
      icon: Users,
      label: t('navigation.my_team', { defaultValue: 'Mi Equipo' }),
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] px-4">
      <nav
        role="navigation"
        aria-label="Navegación del Coordinador de Ministerio"
        className="pointer-events-auto flex items-center justify-around w-full max-w-xs px-3 py-2 bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/90 shadow-lg shadow-slate-900/5 transition-all"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <Link
              key={item.label}
              to={item.path}
              className="flex flex-col items-center py-0.5 px-3 flex-1 group transition-transform active:scale-95 select-none cursor-pointer outline-hidden"
            >
              <div
                className={clsx(
                  'w-12 h-7 rounded-full flex items-center justify-center transition-all duration-200',
                  isActive
                    ? 'bg-sky-100 text-[#0284c7] scale-105 shadow-2xs'
                    : 'text-slate-400 group-hover:text-slate-600'
                )}
              >
                <Icon
                  size={20}
                  className={clsx('transition-transform', isActive && 'stroke-[2.3px] text-[#0284c7]')}
                />
              </div>
              <span
                className={clsx(
                  'text-[10px] tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[72px] text-center mt-0.5 transition-colors',
                  isActive
                    ? 'text-[#0284c7] font-bold'
                    : 'text-slate-500 font-medium group-hover:text-slate-700'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default MinistryCoordinatorBottomNav;
