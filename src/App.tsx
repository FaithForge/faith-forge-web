import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import NetworkStatusBanner from '@/components/common/NetworkStatusBanner';
import MainLayout from '@/components/layout/MainLayout';
import ScrollToTop from '@/components/layout/ScrollToTop';
import PrivateRoute from '@/components/auth/PrivateRoute';
import PageLoader from '@/components/layout/PageLoader';
import { APP_ROUTES } from '@/config/routes';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { logout } from '@/libs/state/redux/slices/user/auth.slice';
import { userRolesNavBarConfig } from '@/components/layout/TopBar';

// Lazy-loaded route views for optimal code-splitting and reduced initial bundle size
const LoginView = lazy(() => import('@/views/auth/LoginView'));
const RegistrationDashboard = lazy(() => import('@/views/kid-registration/RegistrationDashboard'));
const NewKidView = lazy(() => import('@/views/kid-registration/NewKidView'));
const ScannerView = lazy(() => import('@/views/kid-registration/ScannerView'));
const GenerateGuardianQRView = lazy(() => import('@/views/kid-registration/GenerateGuardianQRView'));
const KidCheckInView = lazy(() => import('@/views/kid-registration/KidCheckInView'));
const UpdateKidView = lazy(() => import('@/views/kid-registration/UpdateKidView'));
const AdminDashboard = lazy(() => import('@/views/admin/AdminDashboard'));
const CreateUserView = lazy(() => import('@/views/admin/users/CreateUserView'));
const UserManagementView = lazy(() => import('@/views/admin/users/UserManagementView'));
const UserDetailView = lazy(() => import('@/views/admin/users/UserDetailView'));
const UpdateUserView = lazy(() => import('@/views/admin/users/UpdateUserView'));
const ChurchMeetingsView = lazy(() => import('@/views/admin/ChurchMeetingsView'));
const KidChurchDashboard = lazy(() => import('@/views/kid-church/KidChurchDashboard'));

const IndexRedirect = () => {
  const currentRole = useAppSelector((state) => state.authSlice.currentRole);

  // Find the base dashboard URL for the current role
  const dashboardUrl =
    currentRole && userRolesNavBarConfig[currentRole]?.dashboardUrl
      ? userRolesNavBarConfig[currentRole]!.dashboardUrl
      : APP_ROUTES.kidRegistration.root;

  return <Navigate to={dashboardUrl} replace />;
};

/**
 * Root component configuring routing, global notifications, layout providers,
 * and Vercel Analytics / Speed Insights monitoring.
 *
 * @returns {JSX.Element} Application tree with providers and routes.
 */
function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const handleUnauthorized = () => {
      dispatch(logout());
      toast.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [dispatch]);

  return (
    <>
      <NetworkStatusBanner />
      <Toaster position="top-center" richColors swipeDirections={['top', 'left', 'right']} />
      <Analytics />
      <SpeedInsights />
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path={APP_ROUTES.auth.login} element={<LoginView />} />
            <Route element={<PrivateRoute />}>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<IndexRedirect />} />
                <Route path={APP_ROUTES.admin.root} element={<AdminDashboard />} />
                <Route path={APP_ROUTES.admin.createUser} element={<CreateUserView />} />
                <Route path={APP_ROUTES.admin.users} element={<UserManagementView />} />
                <Route path={APP_ROUTES.admin.userDetailDynamic} element={<UserDetailView />} />
                <Route path={APP_ROUTES.admin.updateUserDynamic} element={<UpdateUserView />} />
                <Route
                  path={APP_ROUTES.admin.userRoles}
                  element={<Navigate to={APP_ROUTES.admin.users} replace />}
                />
                <Route path={APP_ROUTES.admin.churchMeetings} element={<ChurchMeetingsView />} />
                <Route path={APP_ROUTES.kidChurch.root} element={<KidChurchDashboard />} />
                <Route path={APP_ROUTES.kidRegistration.root} element={<RegistrationDashboard />} />
                <Route path={APP_ROUTES.kidRegistration.new} element={<NewKidView />} />
                <Route
                  path={APP_ROUTES.kidRegistration.checkInDynamic}
                  element={<KidCheckInView />}
                />
                <Route
                  path={APP_ROUTES.kidRegistration.updateKidDynamic}
                  element={<UpdateKidView />}
                />
                <Route path={APP_ROUTES.kidRegistration.scanner} element={<ScannerView />} />
                <Route
                  path={APP_ROUTES.kidRegistration.generateQR}
                  element={<GenerateGuardianQRView />}
                />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </>
  );
}

export default App;
