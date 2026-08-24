import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import BottomNav from './BottomNav';
import TopBar, { userRolesNavBarConfig } from './TopBar';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { NavigationGuardProvider } from '@/libs/context/NavigationGuardContext';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { logout } from '@/libs/state/redux/slices/user/auth.slice';
import { isTokenExpired } from '@/libs/utils/jwt';
import { APP_ROUTES } from '@/config/routes';
import { toast } from 'sonner';

// Global map to store scroll positions across route transitions
const routeScrollPositions = new Map<string, number>();

const MainLayout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const mainRef = useRef<HTMLElement>(null);
  const prevPathnameRef = useRef<string>(pathname);
  const [showExitModal, setShowExitModal] = useState(false);

  const token = useAppSelector((state) => state.authSlice.token);
  const currentRole = useAppSelector((state) => state.authSlice.currentRole);
  const isAdminRole = currentRole === 'ADMIN' || currentRole === 'SUPER_ADMIN';

  // Active session expiration watcher (checks every 15 seconds or when returning to tab)
  useEffect(() => {
    const checkExpiration = () => {
      if (token && isTokenExpired(token)) {
        dispatch(logout());
        toast.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        navigate(APP_ROUTES.auth.login, { replace: true });
      }
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 15000);
    window.addEventListener('visibilitychange', checkExpiration);
    window.addEventListener('focus', checkExpiration);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', checkExpiration);
      window.removeEventListener('focus', checkExpiration);
    };
  }, [token, dispatch, navigate]);

  // Guard against cross-role route navigation (e.g. phone back button jumping across modules)
  useEffect(() => {
    if (!currentRole) return;
    const config = userRolesNavBarConfig[currentRole];
    if (!config) return;

    const isIglekidsRole =
      currentRole === 'KID_GROUP_ADMIN' ||
      currentRole === 'KID_GROUP_SUPERVISOR' ||
      currentRole === 'KID_GROUP_USER';

    const isRegikidsRole =
      currentRole === 'KID_REGISTER_ADMIN' ||
      currentRole === 'KID_REGISTER_SUPERVISOR' ||
      currentRole === 'KID_REGISTER_USER' ||
      currentRole === 'USER';

    let isMismatch = false;
    if (isIglekidsRole && (pathname.startsWith('/kid-registration') || pathname.startsWith('/admin'))) {
      isMismatch = true;
    } else if (isRegikidsRole && (pathname.startsWith('/kid-church') || pathname.startsWith('/admin'))) {
      isMismatch = true;
    } else if (isAdminRole && (pathname.startsWith('/kid-church') || pathname.startsWith('/kid-registration'))) {
      isMismatch = true;
    }

    if (isMismatch) {
      navigate(config.dashboardUrl, { replace: true });
    }
  }, [pathname, currentRole, navigate, isAdminRole]);

  // Prevent back navigation from exiting without confirmation when on root dashboard views
  useEffect(() => {
    const isRootDashboard =
      pathname === APP_ROUTES.kidRegistration.root ||
      pathname === APP_ROUTES.kidChurch.root ||
      pathname === APP_ROUTES.admin.root;

    if (!isRootDashboard) return;

    // Push a dummy history state so the phone back button is trapped on the dashboard
    window.history.pushState({ isDashboardRoot: true }, '', window.location.href);

    const handlePopState = (event: PopStateEvent) => {
      // If a modal or drawer is handling its own popstate, let the modal close
      if (event.state?.modalOpen || window.history.state?.modalOpen) {
        return;
      }
      // Re-push dashboard state so user remains on root dashboard and open confirmation dialog
      window.history.pushState({ isDashboardRoot: true }, '', window.location.href);
      setShowExitModal(true);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pathname]);

  const handleConfirmExit = () => {
    // Attempt to close standalone PWA window
    window.close();
    // Fallback if window.close() is prevented by browser
    if (!window.closed) {
      window.location.replace('about:blank');
    }
  };

  // Restore scroll position when returning to a previous route, or scroll to top for new views
  useEffect(() => {
    if (!mainRef.current) return;

    const savedPosition = routeScrollPositions.get(pathname);
    if (savedPosition !== undefined && savedPosition > 0) {
      mainRef.current.scrollTo({ top: savedPosition, behavior: 'instant' });
      // Retry in animation frames and slight delay in case list elements take a frame to render
      const frame1 = requestAnimationFrame(() => {
        if (mainRef.current && routeScrollPositions.has(pathname)) {
          mainRef.current.scrollTo({ top: savedPosition, behavior: 'instant' });
        }
      });
      const timer = setTimeout(() => {
        if (mainRef.current && routeScrollPositions.has(pathname)) {
          mainRef.current.scrollTo({ top: savedPosition, behavior: 'instant' });
        }
      }, 50);
      return () => {
        cancelAnimationFrame(frame1);
        clearTimeout(timer);
      };
    } else {
      mainRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }

    prevPathnameRef.current = pathname;
  }, [pathname]);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    routeScrollPositions.set(pathname, e.currentTarget.scrollTop);
  };

  return (
    <NavigationGuardProvider>
      <div className="flex flex-col h-screen bg-background text-text-main overflow-hidden relative">
        {/* TopBar siempre visible en todas las pantallas */}
        <div className="shrink-0 z-[200] relative pointer-events-auto bg-primary">
          <TopBar />
        </div>

        {/* Main scrollable area */}
        <main
          ref={mainRef}
          onScroll={handleScroll}
          className={clsx('flex-1 overflow-y-auto relative', !isAdminRole && 'pb-[80px]')}
        >
          <Outlet />
        </main>

        {/* Fixed bottom navigation */}
        <BottomNav />

        {/* Modal de confirmación para salir de la aplicación */}
        <ConfirmModal
          open={showExitModal}
          onOpenChange={setShowExitModal}
          title="¿Deseas salir de la aplicación?"
          description="¿Estás seguro de que deseas salir de Faith Forge?"
          confirmText="Sí, salir"
          cancelText="Permanecer"
          type="warning"
          onConfirm={handleConfirmExit}
        />
      </div>
    </NavigationGuardProvider>
  );
};

export default MainLayout;
