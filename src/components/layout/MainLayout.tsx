import React, { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import BottomNav from './BottomNav';
import TopBar from './TopBar';
import { NavigationGuardProvider } from '@/libs/context/NavigationGuardContext';
import { useAppSelector } from '@/libs/state/redux/hooks';
import { APP_ROUTES } from '@/config/routes';

// Rutas principales (dashboards) donde se muestra el TopBar con selector de roles y perfil
const DASHBOARD_ROUTES = new Set<string>([
  APP_ROUTES.admin.root,
  APP_ROUTES.kidRegistration.root,
  APP_ROUTES.kidChurch.root,
  '/',
]);

const MainLayout = () => {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  const currentRole = useAppSelector((state) => state.authSlice.currentRole);
  const isAdminRole = currentRole === 'ADMIN' || currentRole === 'SUPER_ADMIN';
  const isDashboardRoute = DASHBOARD_ROUTES.has(pathname);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [pathname]);

  return (
    <NavigationGuardProvider>
      <div className="flex flex-col h-screen bg-background text-text-main overflow-hidden relative">
        {/* TopBar solo se muestra en las pantallas principales / dashboards */}
        {isDashboardRoute && (
          <div className="shrink-0 z-[120] relative pointer-events-auto bg-primary">
            <TopBar />
          </div>
        )}

        {/* Main scrollable area */}
        <main
          ref={mainRef}
          className={clsx('flex-1 overflow-y-auto relative', !isAdminRole && 'pb-[80px]')}
        >
          <Outlet />
        </main>

        {/* Fixed bottom navigation */}
        <BottomNav />
      </div>
    </NavigationGuardProvider>
  );
};

export default MainLayout;
