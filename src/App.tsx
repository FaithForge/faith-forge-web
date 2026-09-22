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
import { logout, updateTokens } from '@/libs/state/redux/slices/user/auth.slice';
import { GetChurchCampuses } from '@/libs/state/redux/thunks/church/church.thunk';
import { GetMinistries } from '@/libs/state/redux/thunks/church/ministry.thunk';
import { setHttpAuthHandlers } from '@/libs/utils/http';
import { store } from '@/libs/state/redux/store';
import { baseApi } from '@/libs/state/redux/api/baseApi';
import { userRolesNavBarConfig } from '@/components/layout/TopBar';
import { useScreenWakeLock } from '@/libs/hooks/useScreenWakeLock';
import { isRoleEnabled } from '@/config/roles';
import { requestAndSyncPushSubscription } from '@/libs/utils/notifications/webPush';

// Lazy-loaded route views for optimal code-splitting and reduced initial bundle size
const LoginView = lazy(() => import('@/views/auth/LoginView'));
const RegistrationDashboard = lazy(() => import('@/views/kid-registration/RegistrationDashboard'));
const NewKidView = lazy(() => import('@/views/kid-registration/NewKidView'));
const ScannerView = lazy(() => import('@/views/kid-registration/ScannerView'));
const GenerateGuardianQRView = lazy(() => import('@/views/kid-registration/GenerateGuardianQRView'));
const KidCheckInView = lazy(() => import('@/views/kid-registration/KidCheckInView'));
const UpdateKidView = lazy(() => import('@/views/kid-registration/UpdateKidView'));
const AttendanceTrackingView = lazy(
  () => import('@/views/kid-registration/AttendanceTrackingView'),
);
const AdminDashboard = lazy(() => import('@/views/admin/AdminDashboard'));
const CreateUserView = lazy(() => import('@/views/admin/users/CreateUserView'));
const UserManagementView = lazy(() => import('@/views/admin/users/UserManagementView'));
const UserDetailView = lazy(() => import('@/views/admin/users/UserDetailView'));
const UpdateUserView = lazy(() => import('@/views/admin/users/UpdateUserView'));
const ChurchMeetingsView = lazy(() => import('@/views/admin/ChurchMeetingsView'));
const CampusesManagementView = lazy(
  () => import('@/views/admin/campuses/CampusesManagementView'),
);
const PrintersManagementView = lazy(
  () => import('@/views/admin/printers/PrintersManagementView'),
);
const MinistriesManagementView = lazy(

  () => import('@/views/admin/ministries/MinistriesManagementView'),
);
const MinistryDetailView = lazy(() => import('@/views/admin/ministries/MinistryDetailView'));
const VolunteerDirectoryView = lazy(
  () => import('@/views/admin/volunteers/VolunteerDirectoryView'),
);
const VolunteerApplicationsView = lazy(
  () => import('@/views/admin/volunteers/VolunteerApplicationsView'),
);
const VolunteerRequestPublicView = lazy(
  () => import('@/views/public/VolunteerRequestPublicView'),
);
const TermsOfServiceView = lazy(() => import('@/views/legal/TermsOfServiceView'));
const PrivacyPolicyView = lazy(() => import('@/views/legal/PrivacyPolicyView'));
const KidChurchDashboard = lazy(() => import('@/views/kid-church/KidChurchDashboard'));
const SupervisorTeamView = lazy(() => import('@/views/kid-church/SupervisorTeamView'));
const HubView = lazy(() => import('@/views/hub/HubView'));
const KidGuardianDashboardView = lazy(
  () => import('@/views/kid-guardian/KidGuardianDashboardView')
);
import KidGuardianLayout from '@/components/layout/KidGuardianLayout';
import AdminLayout from '@/components/layout/AdminLayout';
import TermsAcceptanceModal from '@/components/legal/TermsAcceptanceModal';
import { AppRole, UserExperienceEnum, UserRole } from '@/libs/utils/auth';

const IndexRedirect = () => {
  const currentRole = useAppSelector((state) => state.authSlice.currentRole);
  const activeExperience = useAppSelector((state) => state.authSlice.activeExperience);
  const experiences = useAppSelector((state) => state.authSlice.experiences) || [];
  const user = useAppSelector((state) => state.authSlice.user);

  const userRoles = (user?.roles || []) as AppRole[];
  const isSuperAdmin = userRoles.includes(UserRole.SUPER_ADMIN);
  const isMultiRoleUser =
    experiences.length > 1 ||
    isSuperAdmin ||
    userRoles.filter(isRoleEnabled).length > 1;

  // If user has 2 or more roles / experiences and has not picked an active experience yet,
  // they MUST ALWAYS start at the Hub
  if (isMultiRoleUser && !activeExperience) {
    return <Navigate to={APP_ROUTES.hub} replace />;
  }

  // If user explicitly chose Kid Guardian experience
  if (activeExperience === UserExperienceEnum.KID_GUARDIAN) {
    return <Navigate to={APP_ROUTES.kidGuardian.root} replace />;
  }

  // If user explicitly chose Admin experience
  if (activeExperience === UserExperienceEnum.ADMIN) {
    return <Navigate to={APP_ROUTES.admin.root} replace />;
  }

  // If user explicitly chose Kid Church Staff experience
  if (activeExperience === UserExperienceEnum.KID_CHURCH_STAFF) {
    const isEnabled = currentRole ? isRoleEnabled(currentRole) : false;
    const dashboardUrl =
      isEnabled && currentRole && userRolesNavBarConfig[currentRole]?.dashboardUrl
        ? userRolesNavBarConfig[currentRole]!.dashboardUrl
        : APP_ROUTES.kidRegistration.root;
    return <Navigate to={dashboardUrl} replace />;
  }

  // If user has multiple experiences and has not picked one yet, send to the Hub
  if (isMultiRoleUser) {
    return <Navigate to={APP_ROUTES.hub} replace />;
  }

  // If user has only one experience and it is Kid Guardian
  if (experiences.length === 1 && experiences[0] === UserExperienceEnum.KID_GUARDIAN) {
    return <Navigate to={APP_ROUTES.kidGuardian.root} replace />;
  }

  // If user has only one experience and it is Admin
  if (experiences.length === 1 && experiences[0] === UserExperienceEnum.ADMIN) {
    return <Navigate to={APP_ROUTES.admin.root} replace />;
  }

  // If user has only one experience and it is Kid Church Staff
  if (experiences.length === 1 && experiences[0] === UserExperienceEnum.KID_CHURCH_STAFF) {
    const isEnabled = currentRole ? isRoleEnabled(currentRole) : false;
    const dashboardUrl =
      isEnabled && currentRole && userRolesNavBarConfig[currentRole]?.dashboardUrl
        ? userRolesNavBarConfig[currentRole]!.dashboardUrl
        : APP_ROUTES.kidRegistration.root;
    return <Navigate to={dashboardUrl} replace />;
  }

  // Default: Find the base dashboard URL for the current role if enabled
  const isEnabled = currentRole ? isRoleEnabled(currentRole) : false;
  const dashboardUrl =
    isEnabled && currentRole && userRolesNavBarConfig[currentRole]?.dashboardUrl
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
  const token = useAppSelector((state) => state.authSlice.token);
  useScreenWakeLock();

  // Global bootstrap: Ensure campuses, church settings, and ministries (custom terminology)
  // are loaded as soon as an authenticated session is active.
  useEffect(() => {
    if (!token) return;
    dispatch(GetChurchCampuses());
    dispatch(GetMinistries());
  }, [dispatch, token]);

  // Request notification permissions on app startup
  useEffect(() => {
    requestAndSyncPushSubscription();
  }, []);

  // When an authenticated session is active or restored, ensure device push subscription is synced
  useEffect(() => {
    if (!token) return;
    requestAndSyncPushSubscription(token);
  }, [token]);

  useEffect(() => {
    setHttpAuthHandlers({
      getToken: () => store.getState().authSlice.token,
      getRefreshToken: () => store.getState().authSlice.refreshToken,
      onTokenRefreshed: (token, refreshToken) =>
        dispatch(updateTokens({ token, refreshToken })),
    });

    const handleUnauthorized = () => {
      dispatch(logout());
      dispatch(baseApi.util.resetApiState());
      toast.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'persist:root' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.authSlice) {
            const auth = JSON.parse(parsed.authSlice);
            const currentToken = store.getState().authSlice.token;
            if (auth.token && auth.token !== currentToken) {
              dispatch(updateTokens({ token: auth.token, refreshToken: auth.refreshToken }));
            }
          }
        } catch {
          // Silent catch on storage parse errors
        }
      }
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [dispatch]);

  return (
    <>
      <NetworkStatusBanner />
      <Toaster position="top-center" richColors swipeDirections={['top', 'left', 'right']} />
      {import.meta.env.PROD && (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      )}
      <BrowserRouter>
        <ScrollToTop />
        <TermsAcceptanceModal />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path={APP_ROUTES.auth.login} element={<LoginView />} />
            <Route
              path={APP_ROUTES.public.volunteerRequest}
              element={<VolunteerRequestPublicView />}
            />
            <Route path={APP_ROUTES.legal.terms} element={<TermsOfServiceView />} />
            <Route path={APP_ROUTES.legal.privacy} element={<PrivacyPolicyView />} />
            <Route element={<PrivateRoute />}>
              {/* Hub: Experience selector */}
              <Route path={APP_ROUTES.hub} element={<HubView />} />

              {/* Kid Guardian Experience */}
              <Route path={APP_ROUTES.kidGuardian.root} element={<KidGuardianLayout />}>
                <Route index element={<KidGuardianDashboardView />} />
              </Route>

              {/* Admin Experience Layout (Decoupled from Kids Ministry) */}
              <Route element={<AdminLayout />}>
                <Route path={APP_ROUTES.admin.root} element={<AdminDashboard />} />
                <Route path={APP_ROUTES.admin.createUser} element={<CreateUserView />} />
                <Route path={APP_ROUTES.admin.users} element={<UserManagementView />} />
                <Route path={APP_ROUTES.admin.userDetailDynamic} element={<UserDetailView />} />
                <Route path={APP_ROUTES.admin.updateUserDynamic} element={<UpdateUserView />} />
                <Route
                  path={APP_ROUTES.admin.userRoles}
                  element={<Navigate to={APP_ROUTES.admin.users} replace />}
                />
                <Route path={APP_ROUTES.admin.campuses} element={<CampusesManagementView />} />
                <Route path={APP_ROUTES.admin.churchMeetings} element={<ChurchMeetingsView />} />
                <Route path={APP_ROUTES.admin.printers} element={<PrintersManagementView />} />
                <Route
                  path={APP_ROUTES.admin.ministries}
                  element={<MinistriesManagementView />}
                />

                <Route
                  path={APP_ROUTES.admin.ministryDetailDynamic}
                  element={<MinistryDetailView />}
                />
                <Route
                  path={APP_ROUTES.admin.ministrySectionDynamic}
                  element={<MinistryDetailView />}
                />
                <Route
                  path={APP_ROUTES.admin.volunteers}
                  element={<Navigate to={APP_ROUTES.admin.users} replace />}
                />
                <Route
                  path={APP_ROUTES.admin.volunteerApplications}
                  element={<VolunteerApplicationsView />}
                />
              </Route>

              {/* Operational Volunteers Layout (Kids Ministry) */}
              <Route path="/" element={<MainLayout />}>
                <Route index element={<IndexRedirect />} />
                <Route path={APP_ROUTES.kidChurch.root} element={<KidChurchDashboard />} />
                <Route path={APP_ROUTES.kidChurch.myTeam} element={<SupervisorTeamView />} />
                <Route path={APP_ROUTES.kidRegistration.root} element={<RegistrationDashboard />} />
                <Route path={APP_ROUTES.kidRegistration.myTeam} element={<SupervisorTeamView />} />
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
                <Route
                  path={APP_ROUTES.kidRegistration.attendanceTracking}
                  element={<AttendanceTrackingView />}
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
