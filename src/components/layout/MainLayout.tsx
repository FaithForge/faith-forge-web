import React, { useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import BottomNav from './BottomNav';
import TopBar, { userRolesNavBarConfig } from './TopBar';
import { NavigationGuardProvider } from '@/libs/context/NavigationGuardContext';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { logout } from '@/libs/state/redux/slices/user/auth.slice';
import { isTokenExpired } from '@/libs/utils/jwt';
import { GetChurchCampuses, GetChurchMeetings } from '@/libs/state/redux/thunks/church/church.thunk';
import { ChurchMeetingStateEnum } from '@/libs/models';
import { APP_ROUTES } from '@/config/routes';
import { toast } from 'sonner';

// Global map to store scroll positions across route transitions
const routeScrollPositions = new Map<string, number>();

// Routes that maintain scroll position (only primary list directories)
const PRESERVED_SCROLL_ROUTES = new Set<string>([
  APP_ROUTES.kidRegistration.root,
  APP_ROUTES.kidChurch.root,
  APP_ROUTES.admin.users,
]);

const MainLayout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const mainRef = useRef<HTMLElement>(null);
  const prevPathnameRef = useRef<string>(pathname);

  const token = useAppSelector((state) => state.authSlice.token);
  const currentRole = useAppSelector((state) => state.authSlice.currentRole);
  const currentCampus = useAppSelector((state) => state.churchCampusSlice.current);
  const isAdminRole = currentRole === 'ADMIN' || currentRole === 'SUPER_ADMIN';

  // Automatically refresh church campuses and active meetings from BE on mount/focus
  useEffect(() => {
    if (!token) return;

    dispatch(GetChurchCampuses());
    if (currentCampus?.id) {
      dispatch(
        GetChurchMeetings({
          churchCampusId: currentCampus.id,
          state: ChurchMeetingStateEnum.ACTIVE,
        })
      );
    }
  }, [token, currentCampus?.id, dispatch]);

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

  // Restore scroll position when returning to a previous route, or scroll to top for singular views
  useEffect(() => {
    if (!mainRef.current) return;

    if (PRESERVED_SCROLL_ROUTES.has(pathname)) {
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
      }
    }

    // For singular views (forms, QR generator, scanners, detail views): ALWAYS force top position
    mainRef.current.scrollTo({ top: 0, behavior: 'instant' });
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Defensive re-enforcement across animation frames to prevent any autofocus/layout shift from misaligning the scroll
    const frame = requestAnimationFrame(() => {
      if (!PRESERVED_SCROLL_ROUTES.has(pathname)) {
        if (mainRef.current) mainRef.current.scrollTop = 0;
        window.scrollTo(0, 0);
      }
    });

    const resetTimer = setTimeout(() => {
      if (!PRESERVED_SCROLL_ROUTES.has(pathname)) {
        if (mainRef.current) mainRef.current.scrollTop = 0;
        window.scrollTo(0, 0);
      }
    }, 60);

    prevPathnameRef.current = pathname;
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(resetTimer);
    };
  }, [pathname]);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    if (PRESERVED_SCROLL_ROUTES.has(pathname)) {
      routeScrollPositions.set(pathname, e.currentTarget.scrollTop);
    }
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
          className={clsx('flex-1 overflow-y-auto relative flex flex-col bg-slate-50', !isAdminRole && 'pb-[80px]')}
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
